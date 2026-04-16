#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Spec;
use Test::More;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper qw(setup_context_for_volume);

use Auth::Auth;
use Access::Rights;
use Context;
use Database;
use MdpConfig;
use MdpItem;
use SRV::Volume::HTML;

subtest 'new' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::HTML->new;
  isa_ok($srv, 'SRV::Volume::HTML', 'SRV::Volume::HTML is created');
};

subtest 'persistent_attributes' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::HTML->new;
  ok(scalar keys %{$srv->persistent_attributes} > 0, 'persistent_attributes has multiple keys');
};

# Test normal mode and thumbnail mode for data retention
# mount "/thumbnail" => SRV::Image->new(mode => 'thumbnail', watermark => 0)->to_app;
subtest 'data retention across call' => sub {
  my $C = setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::HTML->new;
  my $env = {
    'psgix.config' => $C->get_object('MdpConfig'),
    'psgix.context' => $C
  };
  my $res = $srv->call($env);
  foreach my $attr (keys %{$srv->persistent_attributes}) {
    ok(exists $srv->{$attr}, "$attr attribute is retained");
  }
  foreach my $attr (qw(file restricted p output_filename q1)) {
    ok(! exists $srv->{$attr}, "$attr attribute is not retained");
  }
};

done_testing();
