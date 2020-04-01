#!/usr/bin/env perl

use strict;

# use Try::Tiny;
use IO::File;
use IPC::Run qw(run);
use POSIX qw(strftime);
use Mail::Mailer;
use Data::Dumper;
use DBI;

use Getopt::Long;

my $TABLE_NAME = q{pt_exclusivity_ng};
my $LOGDIR = "/htprep/stats/pt_exclusivity";
my $is_reporting = 0;
my $is_debugging = 0;

GetOptions(
    "logdir=s" => \$LOGDIR,
    "report" => \$is_reporting,
    "debug" => \$is_debugging,
);

if ( ! -d $LOGDIR ) {
    exit;
}
my $TMPFILE = "$LOGDIR/report.tmp";

my @now =localtime(time);
$is_reporting = ( $now[2] == 23 && $now[1] >= 45 ) unless ( $is_reporting );

my $config = {};
open(my $in, "<", "/htapps/babel/etc/ht_web.conf") or die "could not open ht_web.conf - $!";
while ( my $line = <$in> ) {
  chomp $line;
  next if ( $line =~ m,^#, || $line =~ m,^$, );
  my ( $key, $value ) = split(/\s+=\s+/, $line);
  $$config{$key} = $value;
}
close($in);

# Database connection
my $dsn = qq{DBI:mysql:$$config{db_name}:$$config{db_server}};
my $dbh = DBI->connect(
                    $dsn,
                    $$config{db_user},
                    $$config{db_passwd},
                  {
                   RaiseError => 1,
                   PrintError => 0,
                  }
                   );

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
    # my $timestamp = UnixDate("now", "%Y-%m-%d");
    my $timestamp = strftime("%Y-%m-%d", @now);
    my $filename = "$LOGDIR/grants-$timestamp.log";
    my $err;
    my $body;

    # only include today's data
    run 
      [ "/usr/bin/sort", "-u", $TMPFILE ], "|", [ "egrep", $timestamp ],
      \$body, \$err;

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
    unlink($TMPFILE) unless ( $is_debugging );
}


