#!/usr/bin/perl -w

use strict;
use warnings;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use Identifier;

my $id = $ARGV[0];

my $safe_id = Identifier::get_safe_Solr_id($id);

my $url = "http://solr-sdr-catalog:9033/catalog/select/?q=ht_id:$safe_id&fl=ht_id_display";
my $result = system ("curl", "--silent", "$url");

print qq{$result "$?" \n};

