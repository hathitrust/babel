#!/usr/bin/env perl
use strict;


my %countries;


chdir "/l/local/apache/logs";
my @logs = `ls access_log*`;

my $offset = 0;

while ($offset < 10)
{
    my $log = $logs[$#logs - $offset++];
    chomp $log;

    print "Reading /l/local/apache/logs/$log\n";
    open( PAGE, "/l/local/apache/logs/$log" );

    my $text;
    my %ipaddrs;
    my $lines;
    while ( $text = <PAGE> )
    {
        next if ($text =~ m,(slurp|msnbot),i);

        my ( $ipaddr ) = ( $text =~ m,(\d+\.\d+\.\d+\.\d+).*, );
        $ipaddrs{$ipaddr}++;
        $lines++;
        print "$lines lines\n"
            if ( $lines % 10000 == 0 );
    }
    close ( PAGE );

    foreach my $ip ( keys %ipaddrs )
    {
        my $country =  `$ENV{SDRROOT}/mdp-misc/geoip.pl $ip`;
        chomp $country;
        $countries{$country}++;
    }

}

foreach my $c ( keys %countries )
{
    print $c . " - " . $countries{$c} . "\n";
}



exit 0;



