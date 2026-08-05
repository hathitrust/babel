use strict;
use warnings;

use Encode;
use Test::More;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/slip-lib";
use lib "$ENV{SDRROOT}/mdp-lib";

use Auth::Auth;
use Context;
use Database;
use LS::Controller;
use LS::Operation::Search;
use Operation::Status;
use Session;
use Utils;

### THE MINDLESS SETUP BOILERPLATE
# copied from cgi/ls
my $C = new Context;
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
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

my $ses = Session::start_session($C);
$C->set_object('Session', $ses);


subtest 'execute operation' => sub {
  subtest 'with basic search' => sub {
    my $cgi = new CGI;
    $cgi->param('q1', 'journal');
    $cgi->param('field1', 'ocr');
    $cgi->param('a', 'srchls');
    $cgi->param('ft', 'ft');
    $cgi->param('lmt', 'ft');
    $C->set_object('CGI', $cgi);

    my $ctl = new LS::Controller($C);
    my $search = LS::Operation::Search->new({C => $C, act => $ctl->get_action});
    my $res = $search->execute_operation($C);
    is($res, $Operation::Status::ST_OK);
  };

  # Test "no cached counter a found" error fixed in ETT-1368
  subtest 'with bogus search paging past the interleaver' => sub {
    my $cgi = new CGI;
    # This will not return any results
    $cgi->param('q1', 'qwertyuiopasdfghjkl');
    $cgi->param('field1', 'ocr');
    $cgi->param('a', 'srchls');
    $cgi->param('ft', 'ft');
    $cgi->param('lmt', 'ft');
    # Page way past the interleaver.
    $cgi->param('pn', '100');
    $C->set_object('CGI', $cgi);

    my $ctl = new LS::Controller($C);
    my $search = LS::Operation::Search->new({C => $C, act => $ctl->get_action});
    my $res = $search->execute_operation($C);
    is($res, $Operation::Status::ST_OK);
  };
};


done_testing();

