use Test::More;
use UUID::Tiny;

use Auth::Auth;
use Data::Dumper;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/slip-lib";
use lib "$ENV{SDRROOT}/mdp-lib";
use lib "$ENV{SDRROOT}/mdp-lib/t/lib";
use LS::PIFiller::ListSearchResults;
#use Collection;


my $C = new Context;
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
my $config = new MdpConfig(File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'),
                           File::Spec->catdir($ENV{SDRROOT}, 'slip-lib/Config/common.conf'));                           
$C->set_object('MdpConfig', $config);

my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
$C->set_object('Database', $db);

my $dbh = $db->get_DBH;
$C->set_object('DBI', $dbh);

#my $auth = Auth::Auth->new($C);
#$C->set_object( 'Auth', $auth );

subtest "handle_ANALYTICS_REPORT_URL_PI" => sub {
  # FIXME: find realistic examples of this, not copies of the collection builder tests
  subtest "with a collection ID" => sub {
    my $cgi = $C->get_object('CGI');
    # Given a query q1=something&sort=cn_a&colltype=featured&a=listcs
    # The analytics URL should be /mb/listcs/?q1=something&amp;sort=cn_a
    # This seems kind of brittle because handle_ANALYTICS_REPORT_URL_PI relies on CGI
    # for the ordering of parameters when constructing the URL. There's no explicit sorting.
    $cgi->param('c', '123');
    $cgi->param('q1', 'something');
    $cgi->param('sort', 'cn_a');
    $cgi->param('colltype', 'featured');
    $cgi->param('lmt', '10');
    my $res = LS::PIFiller::ListSearchResults::handle_ANALYTICS_REPORT_URL_PI($C, '', {});
    is($res, "/ls/listis/123/10?q1=something&amp;lmt=10");
    # Clean up
    $C->set_object('CGI', new CGI);
  };

  subtest "without a collection ID" => sub {
    my $cgi = $C->get_object('CGI');
    # Given a query q1=something&sort=cn_a&colltype=featured&a=listcs
    # The analytics URL should be /mb/listcs/?q1=something&amp;sort=cn_a
    # This seems kind of brittle because handle_ANALYTICS_REPORT_URL_PI relies on CGI
    # for the ordering of parameters when constructing the URL. There's no explicit sorting.
    $cgi->param('q1', 'something');
    $cgi->param('sort', 'cn_a');
    $cgi->param('colltype', 'featured');
    $cgi->param('a', 'listcs');
    my $res = LS::PIFiller::ListSearchResults::handle_ANALYTICS_REPORT_URL_PI($C, '', {});
    is($res, "/ls/listcs?q1=something");
    # Clean up
    $C->set_object('CGI', new CGI);
  };
};

done_testing();
