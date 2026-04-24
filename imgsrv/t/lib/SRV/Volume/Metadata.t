#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Spec;
use Test::Exception;
use Test::More;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper qw(setup_context_for_volume);

use Auth::Auth;
use Access::Rights;
use Context;
use Database;
use MdpConfig;
use MdpItem;
use SRV::Volume::Metadata;

subtest 'new' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::Metadata->new;
  isa_ok($srv, 'SRV::Volume::Metadata', 'SRV::Volume::Metadata is created');
};

subtest 'persistent_attributes' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::Metadata->new;
  ok(scalar keys %{$srv->persistent_attributes} > 0, 'persistent_attributes has multiple keys');
};

subtest 'data retention across calls' => sub {
  # Make sure the persistent attributes are retained and the transient ones are cleared.
  sub check_attributes {
    my $srv = shift;

    foreach my $attr (keys %{$srv->persistent_attributes}) {
      ok(exists $srv->{$attr}, "$attr attribute is retained");
    }
    foreach my $attr (qw(size start limit)) {
      ok(! exists $srv->{$attr}, "$attr attribute is not retained");
    }
  }

  # `Try::Tiny` does cleanup in a `finally` block.
  my $C = setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::Metadata->new;
  my $env = {
    'psgix.config' => $C->get_object('MdpConfig'),
    'psgix.context' => $C
  };
  # HTTP 200
  my $res = $srv->call($env);
  check_attributes($srv);
  # HTTP 500
  dies_ok {
    $srv->call('BOGUS ENV');
  };
  check_attributes($srv);
};

done_testing();
