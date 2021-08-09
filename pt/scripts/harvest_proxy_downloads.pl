#!/usr/bin/env perl

use strict;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;
use Database;

use JSON::XS;
use IO::Uncompress::Gunzip;
use IO::File;
use Data::Dumper;
use File::Basename qw(basename);
use File::stat;
use Date::Manip;
use DBI;

use Getopt::Long;

my $N = -1;
my $TABLE_NAME = q{ht_web.reports_downloads_ssdproxy};
my $LOGFILE_ROOT = qq{$ENV{SDRROOT}/logs/access};
my $LOGFILE_PATTERN = qr{imgsrv_downloads};
my $DRY_RUN = 0;
my $RESET = 0;
my $VERBOSE = 0;
my $INITIAL_TIMESTAMP = -1;

GetOptions(
    "dry-run" => \$DRY_RUN,
    "reset" => \$RESET,
    "logfile-root=s" => \$LOGFILE_ROOT,
    "table-name=s" => \$TABLE_NAME,
    "from-timestamp=i" => \$INITIAL_TIMESTAMP,
    "verbose" => \$VERBOSE,
    "N=i" => \$N,
);

$VERBOSE = 1 if ( $DRY_RUN );

# Database connection
my $db =  new Database('ht_web');
my $dbh = $db->get_DBH();

if ( $RESET ) {
    $dbh->do("DELETE FROM $TABLE_NAME");
    exit;
}

my $insert_sql = <<SQL;
INSERT INTO $TABLE_NAME (
    yyyy,
    yyyymm,
    datetime,
    htid,
    in_copyright,
    is_partial,
    email,
    inst_code,
    sha
) VALUES (
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    ?,
    UNHEX(SHA1(CONCAT_WS(' ', `datetime`, `htid`, `in_copyright`, `is_partial`, `email`, `inst_code`)))
)
SQL

my $check_sql = <<SQL;
SELECT * FROM $TABLE_NAME WHERE sha = UNHEX(SHA1(CONCAT_WS(' ', ?, ?, ?, ?, ?, ?)))
SQL

my $insert_sth = $dbh->prepare($insert_sql);
my $check_sth = $dbh->prepare($check_sql);

my $last_run_timestamp = 0;
my $last_run_filename = qq{$ENV{SDRROOT}/logs/harvest_proxy_downloads.txt};
if ( -f $last_run_filename ) {
    open my $fh, '<', $last_run_filename or die "Can't open file $!";
    $last_run_timestamp = do { local $/; <$fh> }; chomp $last_run_timestamp;
}
$last_run_timestamp = $INITIAL_TIMESTAMP if ( $INITIAL_TIMESTAMP >= 0 );

my @filenames = gather_logfiles($last_run_timestamp);
exit unless ( scalar @filenames );

my $user_map = {};
my $inst_map = {};

my $__i = 0;
my $filename;
while ( scalar @filenames ) {
    $filename = shift @filenames;
    chomp $filename;
    print STDERR "== processing: $filename\n" if ( $VERBOSE );
    my $fh;
    if ( $filename =~ m,\.gz, ) {
        $fh = IO::Uncompress::Gunzip->new($filename);
    } else {
        $fh = IO::File->new($filename);
    }

    while ( my $line = <$fh> ) {
        chomp $line;
        my $datum;
        if ( $line =~ m,^mode=, ) {
            $datum = {};
            my @kvs = split(/\|/, $line);
            foreach my $kv ( @kvs ) {
                my ( $k, $v ) = split(/=/, $kv, 2);
                $$datum{$k} = $v;
            }
            $$datum{access} = 'success';
            $$datum{digitization_source} = $$datum{digitization};
            $$datum{collection_source} = $$datum{collection};
            # $$datum{inst_code} = $$datum{Shib_Identity_Provider};
        } else {
            eval {
                $datum = decode_json $line;
            };
            if ( my $err = $@ ) {
                print STDERR "$err : $line\n";
                next;
            }
        }
        # print STDERR Dumper($datum); next;
        next unless ( $$datum{role} eq 'ssdproxy' );
        next unless ( $$datum{access} eq 'success' );
        next unless ( $$datum{mode} eq 'download' );

        my $email;
        unless ( $$user_map{$$datum{remote_user_processed}} ) {
            my $check = $dbh->selectrow_hashref(qq{SELECT * FROM ht_users WHERE userid = ?}, undef, $$datum{remote_user_processed});
            # print STDERR "AHOY AHOY $$datum{remote_user_processed} :: $$check{email}\n";
            $$user_map{$$datum{remote_user_processed}} = $$check{email};
        }
        $email = $$user_map{$$datum{remote_user_processed}};
        unless ( $email ) {
            $email = $$datum{remote_user_processed};
            print STDERR "USING REMOTE USER $$datum{remote_user_processed}";
        }

        my @params = (
            # parameters for data
            UnixDate($$datum{datetime}, "%Y"),
            UnixDate($$datum{datetime}, "%Y-%m"),
            $$datum{datetime},
            $$datum{id},
            $$datum{ic},
            $$datum{is_partial},
            $email, # $$datum{remote_user_processed},
            $$datum{inst_code},
        );

        if ( $VERBOSE ) {
            print join("\t", @params), "\n";
        }
        unless ( $DRY_RUN ) {
            my $rv = $check_sth->execute(
                # parameters for sha1
                $$datum{datetime},
                $$datum{id},
                $$datum{ic},
                $$datum{is_partial},
                $email, # $$datum{remote_user_processed},
                $$datum{inst_code},
            );
            my $check = $check_sth->fetchrow_hashref;
            unless ( ref($check) ) {
                $insert_sth->execute(@params) || die $DBI::errstr;
            }
        }
    }

    $__i += 1;
    last if ( $N > 0 && $__i >= $N )
}

if ( $filename ) {
    my $info = stat($filename);
    unless ( $DRY_RUN || $INITIAL_TIMESTAMP >= 0 ) {
        open(my $fh, ">", $last_run_filename) or die "Could not open $last_run_filename for writing: $!";
        print $fh $info->mtime;
        close($fh);
    }
    if ( $VERBOSE ) {
        print STDERR "== SETTING LAST TIMESTAMP: ", $info->mtime, "\n";
    }
}

exit;

sub gather_logfiles {
    my ( $timestamp ) = @_;
    my @filenames = ();
    opendir(my $dir, $LOGFILE_ROOT) || die "Cannot open $LOGFILE_ROOT: $!";
    foreach my $filename ( readdir $dir ) {
        next unless ( $filename =~ m,$LOGFILE_PATTERN, );
        my $info = stat(qq{$LOGFILE_ROOT/$filename});
        next if ( $info->mtime <= $timestamp );
        push @filenames, qq{$LOGFILE_ROOT/$filename};
    }

    return sort @filenames;
}
