package TestHelper;

use Exporter;

our @ISA = qw(Exporter);
our @EXPORT_OK = qw(setup_context_for_volume);

# This is ugly but spares us having to remember all of the -I parameters to perl/prove
# Could also provide these via PERL5LIB in perl.yml
use lib File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 'lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'slip-lib');
use lib File::Spec->catdir($ENV{SDRROOT}, 'plack-lib');

# This is probably incomplete since some tests may involve Session objects, particularly
# if messing with elevated access where are interested in activated role.
sub setup_context_for_volume {
  my $htid = shift;

  my $C = new Context;
  my $cgi = new CGI;
  $C->set_object('CGI', $cgi);

  # Should probably use Auth::Auth::PSGI but tests work without it (for now).
  # use SRV::Prolog;
  # my $auth = new Auth::Auth::PSGI($C);
  my $auth = new Auth::Auth($C);
  $C->set_object('Auth', $auth);
  my $config = new MdpConfig(
    File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'),
    File::Spec->catdir($ENV{SDRROOT}, 'imgsrv/lib/Config/global.conf')
  );
  $C->set_object('MdpConfig', $config);
  my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
  my $db = new Database($db_user);
  $C->set_object('Database', $db);

  # Find where this item's pages and METS manifest are located
  my $itemFileSystemLocation = Identifier::get_item_location($htid);
  # Determine access rights and store them on the MdpItem object
  my $ar = new Access::Rights($C, $htid);
  $C->set_object('Access::Rights', $ar);
  my $mdpItem = MdpItem->GetMdpItem($C, $htid, $itemFileSystemLocation);
  $C->set_object('MdpItem', $mdpItem);

  return $C;
}
1;
