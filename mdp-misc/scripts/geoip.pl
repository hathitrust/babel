#!/usr/bin/env perl

my $IP = $ARGV[0];

use Geo::IP;
my $geoIp = Geo::IP->new();
my $countryCode = $geoIp->country_code_by_addr($IP);
my $countryName = $geoIp->country_name_by_addr($IP);
print "$countryCode / $countryName\n";
