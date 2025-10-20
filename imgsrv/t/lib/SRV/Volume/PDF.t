#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Spec;
use Test::More;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper;

use Auth::Auth;
use Access::Rights;
use Context;
use Database;
use MdpConfig;
use MdpItem;
use SRV::Volume::PDF;

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

# This is probably incomplete since some tests may involve Session objects, particularly
# if messing with elevated access where are interested in activated role.
sub setup_context_for_volume {
  my $htid = shift;

  # Find where this item's pages and METS manifest are located
  my $itemFileSystemLocation = Identifier::get_item_location($htid);
  # Determine access rights and store them on the MdpItem object
  my $ar = new Access::Rights($C, $htid);
  $C->set_object('Access::Rights', $ar);
  my $mdpItem = MdpItem->GetMdpItem($C, $htid, $itemFileSystemLocation);
  $C->set_object('MdpItem', $mdpItem);
}

subtest 'new' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::PDF->new;
  isa_ok($srv, 'SRV::Volume::PDF', 'SRV::Volume::PDF is created');
};

# SRV::Volume::PDF uses the default implementation in SRV::Volume::Base for this method.
# Will return a 403 if the volume is restricted, otherwise returns a coderef wrapping the
# `run` method.
subtest 'call' => sub {
  setup_context_for_volume('test.ic_not_held');
  my $srv = SRV::Volume::PDF->new;
  my $env = {
    'psgix.config' => $config,
    'psgix.context' => $C
  };
  my $res = $srv->call($env);
  is($res->[0], 403, 'returns 403 response for a restricted volume');
};

# Produces a PDF at $srv->{output_filename}
# There is also a directory with the same extension-less basename plus "__progress"
# (progress_filepath) which holds progress .js files (1.js, 2.js, ...) and a done.js file.
subtest 'run' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::PDF->new;
  my $env = {
    'psgix.config' => $config,
    'psgix.context' => $C
  };
  $srv->call($env);
  my $res = $srv->run($env);
  ok(-d $srv->progress_filepath, 'progress directory exists');
  ok(-e $srv->output_filename, 'output file exists');
  ok($srv->output_filename =~ /\.pdf$/, 'output file extension is .pdf');
};

done_testing();
