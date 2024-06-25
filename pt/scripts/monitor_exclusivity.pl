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
        # and store the logdata for reference
        $fh = IO::File->new($filename, ">");
        print $fh $body, "\n";
        $fh->close;

        # summarize the data by institution

        my @columns = ("inst_id", "unique", "renewals", "items", "yesterday?");
        my $inst_map = {};
        my $todays_grants = {};
        my @lines = split(/\n/, $body);

        foreach my $line ( @lines ) {
            chomp $line;
            next unless ( $line );
            my ( $lock_id, $item_id, $owner, $inst_id, $timestamp, $renewals ) = split(/\t/, $line);
            $$inst_map{$inst_id} = { unique => 0, renewals => 0, items => {}, flagged => 0 } unless ( ref($$inst_map{$inst_id}) );

            if ( $renewals > 0 && ! $$todays_grants{$lock_id,$owner} ) {
                $$inst_map{$inst_id}{flagged} += 1;
            }

            $$inst_map{$inst_id}{unique} += 1 if ( $renewals == 0 );
            $$todays_grants{$lock_id,$owner} = 1 if ( $renewals == 0 );
            $$inst_map{$inst_id}{renewals} += 1 if ( $renewals > 0 );
            $$inst_map{$inst_id}{items}{$lock_id} += 1;
        }

        my $boundary = "====" . time() . "====";
        my $mailer = new Mail::Mailer('sendmail');
        $mailer->open(
                      {
                       'To'       => q{hathitrust-exclusivity-report@umich.edu},
                       # 'Bcc'      => $bccAddrArrRef,
                       'From'     => q{roger@umich.edu},
                       'Subject'  => "HathiTrust Exclusivity Report: $timestamp",
                       'Content-Type' => qq{multipart/alternative; boundary="$boundary"}
                      }
                    );

        $boundary = '--'. $boundary;
        print $mailer $boundary . "\n";
        # print $mailer qq{Content-Type: 'multipart/alternative; boundary="boundary-string"\n};

        # print $mailer "\n--boundary-string\n";
        print $mailer "Content-Type: text/plain; charset='utf-8'\n";
        print $mailer "Content-Transfer-Encoding: quoted-pritable\n";
        print $mailer "Content-Disposition: inline\n\n";

        print $mailer(join("\t", @columns), "\n");
        print $mailer("\n");

        my @output = ( '<table><tr>');
        push @output, '<th>' . join('</th><th>', @columns) . '</th>';
        push @output, '</tr>';

        foreach my $inst_id ( sort { $$inst_map{$b}{unique} <=> $$inst_map{$a}{unique} } keys %$inst_map ) {
            my $datum = $$inst_map{$inst_id};
            my @row = ( $inst_id, $$datum{unique}, 
                $$datum{renewals}, 
                scalar keys %{$$datum{items}},
                $$datum{flagged} > 0 ? '*' : ''
            );
            push @output, qq{<tr><td>} . join('</td><td>', @row) . qq{</td></tr>};
            print $mailer(join("\t", @row) . "\n");
        }

        print $mailer "\n\n$boundary\n";
        print $mailer "Content-Type: text/html; charset='utf-8'\n";
        print $mailer "Content-Transfer-Encoding: quoted-pritable\n";
        print $mailer "Content-Disposition: inline\n\n";


        push @output, qq{</table>};
        print $mailer(join("\n", @output));
        print $mailer "\n";

        print $mailer "\n$boundary--\n";

        $mailer->close;
    }
    unlink($TMPFILE) unless ( $is_debugging );
}


