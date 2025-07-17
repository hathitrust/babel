use strict;
use warnings;

use CGI;
use Encode;
use Test::More;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/mdp-lib";
use lib "$ENV{SDRROOT}/slip-lib";
use lib "$ENV{SDRROOT}/libtest";

use Access::Rights;
use Context;
use Database;
use TestUser;
#use LS::PIFiller::Advanced;
use LS::Query::Facets;
use LS::FacetConfig;
use PIFiller;
use RightsGlobals;
use Utils;


### THE MINDLESS SETUP BOILERPLATE
# copied from cgi/ls
my $C = new Context;
my $config = new MdpConfig(
                           Utils::get_uber_config_path('ls'),
                           $ENV{SDRROOT} . "/ls/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/ls/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
my $AB_test_config_filename = $ENV{SDRROOT} . '/ls/lib/Config/AB_test_config';
my $AB_test_config = $config = Config::Tiny->read($AB_test_config_filename);
ASSERT($AB_test_config, qq{Error in testing config file $AB_test_config_filename: } . Config::Tiny::errstr);
# 1 disables checking object name
$C->set_object('AB_test_config', $AB_test_config, 1);
my $facet_config = new LS::FacetConfig($C, $ENV{SDRROOT} . "/ls/lib/Config/facetconfig.pl");
$C->set_object('FacetConfig', $facet_config);
my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
$C->set_object('Database', $db);
my $auth = Auth::Auth->new($C);
$C->set_object('Auth', $auth);

my $facets = LS::Query::Facets->new($C, '');
my $result = $facets->__get_Solr_fulltext_filter_query($C);
print STDERR "RESULT $result\n";
ok(length $result > 0);

subtest '__get_Solr_fulltext_filter_query' => sub {
  subtest 'with ordinary user' => sub {
    my $test_user = TestUser->new('type' => $RightsGlobals::ORDINARY_USER, 'context' => $C);
    $test_user->begin;
    my $result = $facets->__get_Solr_fulltext_filter_query($C);
    # FIXME: what is the real test?
    ok(length $result > 0);
    $test_user->end;
  };

  subtest 'with RS user' => sub {
    my $test_user = TestUser->new('type' => $RightsGlobals::RESOURCE_SHARING_USER, 'context' => $C);
    $test_user->begin;
    my $result = $facets->__get_Solr_fulltext_filter_query($C);
    # FIXME: what is the real test?
    ok(length $result > 0);
    $test_user->end;
  };
};


done_testing();
