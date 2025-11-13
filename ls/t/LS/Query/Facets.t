use strict;
use warnings;

use Data::Dumper;
use Encode;
use Test::More;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/slip-lib";
use lib "$ENV{SDRROOT}/mdp-lib";

use Auth::Auth;
use Context;
use Database;
use LS::PIFiller::Advanced;
use LS::FacetConfig;
use LS::Query::Facets;
use Utils;


### THE MINDLESS SETUP BOILERPLATE
# copied from cgi/ls
my $C = new Context;
my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
  $C->set_object('Database', $db);
my $config = new MdpConfig(
                           Utils::get_uber_config_path('ls'),
                           $ENV{SDRROOT} . "/ls/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/ls/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);
my $AB_test_config_filename = $ENV{SDRROOT} . '/ls/lib/Config/AB_test_config';
my $AB_test_config = $config = Config::Tiny->read($AB_test_config_filename);
ASSERT($AB_test_config, qq{Error in testing config file $AB_test_config_filename: } . Config::Tiny::errstr);
# 1 disables checking object name
$C->set_object('AB_test_config', $AB_test_config, 1);
my $facet_config = new LS::FacetConfig($C, $ENV{SDRROOT} . "/ls/lib/Config/facetconfig.pl");
$C->set_object('FacetConfig', $facet_config);
my $auth = new Auth::Auth($C);
$C->set_object('Auth', $auth);

my $AB = 'A';


# NOTE: this is an almost completely useless test that illustrates the scaffolding
# we need to run better ones in the future.
# The resulting query strings are complex. I don't really know what to do with them
# beyond poking around with ugly regexes.
subtest 'get_Solr_query_string' => sub {
  # Mindlessly copied from test/testQueries.pl
  my $query_config = {
    solr_start_row => 0,
    solr_num_rows => 2,
    query_type => 'full_text'
  };
  subtest 'advanced search' => sub {
    subtest 'two terms' => sub {
      my $cgi = CGI->new;
      $C->set_object('CGI', $cgi);
      $cgi->param('adv', '1');

      $cgi->param('field1', 'ocr');
      $cgi->param('anyall1', 'all');
      $cgi->param('q1', 'search1');

      $cgi->param('field2', 'author');
      $cgi->param('anyall2', 'all');
      $cgi->param('q2', 'search2');

      $cgi->param('op2', 'AND');
      my $facets = new LS::Query::Facets($C, '', undef, $query_config);
      my $query_string = $facets->get_Solr_query_string($C, $AB);
      ok($query_string =~ m/AND\s+_query/, 'result is not parenthesized because q3 and q4 are not present');
    };

    subtest 'two terms separated by gap' => sub {
      my $cgi = CGI->new;
      $C->set_object('CGI', $cgi);
      $cgi->param('adv', '1');

      $cgi->param('field1', 'ocr');
      $cgi->param('anyall1', 'all');
      $cgi->param('q1', 'search1');

      $cgi->param('field4', 'author');
      $cgi->param('anyall4', 'all');
      $cgi->param('q4', 'search2');
      
      $cgi->param('op3', 'AND');
      
      my $facets = new LS::Query::Facets($C, '', undef, $query_config);
      my $query_string = $facets->get_Solr_query_string($C, $AB);
      ok($query_string =~ m/\) AND \(/, 'result is parenthesized because `(1 op2 2) op3 (3 op4 4)`');
    };
  };
};

done_testing;