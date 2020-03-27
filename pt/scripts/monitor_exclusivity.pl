#!/usr/bin/env perl

use strict;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;
use Database;

# use Try::Tiny;
use IO::File;
use IPC::Run qw(run);
use Date::Manip;
use Mail::Mailer;

my $TABLE_NAME = q{pt_exclusivity_ng};
my $LOGDIR = "$ENV{SDRROOT}/logs/pt_exclusivity";
if ( ! -d $LOGDIR ) {
    mkdir($LOGDIR, 0775);
}
my $TMPFILE = "$LOGDIR/report.tmp";

my @now =localtime(time);
my $is_reporting = ( ( $now[2] == 23 && $now[1] >= 45 ) || $ARGV[0] eq '--report' );

# Database connection
my $db =  new Database('ht_web');
my $dbh = $db->get_DBH();
$dbh->{RaiseError} = 1;

my $monitor_sql = <<SQL;
SELECT lock_id, item_id, owner, affiliation, expires, renewals FROM $TABLE_NAME ORDER BY affiliation, expires, owner, renewals;
SQL

my $sth = $dbh->prepare($monitor_sql) || die "Could not prepare: $!";

$sth->execute();
my $rows = $sth->fetchall_arrayref();

my $fh = IO::File->new($TMPFILE, ">>") || die "Could not open $TMPFILE - $!";
foreach my $row ( @$rows ) {
    print $fh join("\t", @$row), "\n";
}
$fh->close;

if ( $is_reporting ) {
    my $timestamp = UnixDate("now", "%Y-%m-%d");
    my $filename = "$LOGDIR/grants-$timestamp.log";
    my $err;
    my $body;
    run [ "/usr/bin/sort", "-u", $TMPFILE ], \undef, \$body, \$err;
    if ( $body ) {
        # mail this file out
        my $mailer = new Mail::Mailer('sendmail');
        $mailer->open(
                      {
                       'To'       => q{hathitrust-exclusivity-report@umich.edu},
                       # 'Bcc'      => $bccAddrArrRef,
                       'From'     => q{roger@umich.edu},
                       'Subject'  => "HathiTrust Exclusivity Report: $timestamp"
                      }
                    );

        print $mailer(join("\t", "lock_id", "item_id", "owner", "affiliation", "expires", "renewals"), "\n");
        print $mailer("\n");
        print $mailer($body);
        $mailer->close;

        # and store the logdata for reference
        $fh = IO::File->new($filename, ">");
        print $fh $body, "\n";
        $fh->close;
    }
    unlink($TMPFILE);
}


