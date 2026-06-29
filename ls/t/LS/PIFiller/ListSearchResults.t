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


subtest "handle_ANALYTICS_REPORT_URL_PI" => sub {
  # Note: these may not be realistic URLs. The point is to check for cgi->param warnings.
  subtest "with a collection ID" => sub {
    # Track warnings. We don't want any. They clutter the logs.
    my @warnings;
    local $SIG{__WARN__} = sub {
      my $message = shift;
      print STDERR $message;
      push @warnings, $message;
    };

    my $cgi = $C->get_object('CGI');
    # Given a query c=123&q1=something&sort=cn_a&colltype=featured&a=listcs&lmt-10
    # The analytics URL should be /ls/listis/123/10?q1=something&amp;lmt=10
    # Be wary of brittleness with generated URL: param order may not be stable.
    $cgi->param('c', '123');
    $cgi->param('q1', 'something');
    $cgi->param('sort', 'cn_a');
    $cgi->param('colltype', 'featured');
    $cgi->param('lmt', '10');
    my $res = LS::PIFiller::ListSearchResults::handle_ANALYTICS_REPORT_URL_PI($C, '', {});
    is($res, "/ls/listis/123/10?q1=something&amp;lmt=10");
    is(scalar @warnings, 0, 'no warnings encountered');
    # Clean up
    $C->set_object('CGI', new CGI);
  };

  subtest "without a collection ID" => sub {
    # Track warnings. We don't want any. They clutter the logs.
    my @warnings;
    local $SIG{__WARN__} = sub {
      my $message = shift;
      print STDERR $message;
      push @warnings, $message;
    };

    my $cgi = $C->get_object('CGI');
    # Given a query q1=something&sort=cn_a&colltype=featured&a=listcs
    # The analytics URL should be /ls/listcs?q1=something"
    # Be wary of brittleness with generated URL: param order may not be stable.
    $cgi->param('q1', 'something');
    $cgi->param('sort', 'cn_a');
    $cgi->param('colltype', 'featured');
    $cgi->param('a', 'listcs');
    my $res = LS::PIFiller::ListSearchResults::handle_ANALYTICS_REPORT_URL_PI($C, '', {});
    is($res, "/ls/listcs?q1=something");
    is(scalar @warnings, 0, 'no warnings encountered');
    # Clean up
    $C->set_object('CGI', new CGI);
  };
};

done_testing();
