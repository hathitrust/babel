use Test::More;
use UUID::Tiny;

use Auth::Auth;
use Data::Dumper;

use lib "$ENV{SDRROOT}/mb/lib";
use lib "$ENV{SDRROOT}/slip-lib";
use MBooks::PIFiller::ListUtils;
use Collection;


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
  # Given a query a=listis&c=123&sort=title_d
  # The analytics URL should be /mb/listcs/<COLLID>?q1=something&amp;sort=cn_a
  # This seems kind of brittle because handle_ANALYTICS_REPORT_URL_PI relies on CGI
  # for the ordering of parameters when constructing the URL. There's no explicit sorting.
  $cgi->param('a', 'listis');
  $cgi->param('c', '123');
  $cgi->param('sort', 'title_d');  
  my $res = MBooks::PIFiller::ListUtils::handle_ANALYTICS_REPORT_URL_PI($C, '', {});
  is($res, '/mb/listis/123?sort=title_d');
  # Clean up
  $C->set_object('CGI', new CGI);
};

done_testing();
