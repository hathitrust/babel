#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Slurp;
use FindBin;
use Test::More;
use XML::LibXML ();

use Context;
use Database;
use MdpItem;
use Utils;

my $C = new Context;
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
my $config = new MdpConfig(File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'),
                           File::Spec->catdir($ENV{SDRROOT}, 'slip-lib/Config/common.conf'));
$C->set_object('MdpConfig', $config);

subtest 'ParseVersionFromPREMIS' => sub {
  # Not used within ParseVersionFromPREMIS but needed to get to the instance method.
  my $mdp_item = MdpItem->new($C, 'test.pd_open');

  subtest 'multiple ingestion' => sub {
    my $mets = File::Slurp::read_file("$FindBin::Bin/fixtures/multiple_ingestion.mets.xml");
    my $parser = XML::LibXML->new();
    my $tree = $parser->parse_string($mets);
    my $root = $tree->getDocumentElement();
    my ($date, $del) = $mdp_item->ParseVersionFromPREMIS($root);
    # Ingestion events: 2025 and 2026
    is($date, '2026-01-01T00:00:00Z', 'uses the 2026 ingestion date');
    is($del, 0, 'item is not marked as deleted');
  };

  subtest 'multiple deletion and ingestion' => sub {
    my $mets = File::Slurp::read_file("$FindBin::Bin/fixtures/deletion.mets.xml");
    my $parser = XML::LibXML->new();
    my $tree = $parser->parse_string($mets);
    my $root = $tree->getDocumentElement();
    my ($date, $del) = $mdp_item->ParseVersionFromPREMIS($root);
    # Ingestion 2025 and 2026, deletion 2021 and 2022
    is($date, '2022-01-01T00:00:00Z', 'uses the 2022 deletion date');
    is($del, 1, 'finds the latest deletion event');
  };
};

done_testing();

