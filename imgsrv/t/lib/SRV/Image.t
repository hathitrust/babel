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
use SRV::Image;

subtest 'new' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Image->new;
  isa_ok($srv, 'SRV::Image', 'SRV::Image is created');
};

subtest 'persistent_attributes' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Image->new;
  ok(scalar keys %{$srv->persistent_attributes} > 0, 'persistent_attributes has multiple keys');
};

# Test normal mode and thumbnail mode for data retention
# mount "/thumbnail" => SRV::Image->new(mode => 'thumbnail', watermark => 0)->to_app;
subtest 'data retention across call' => sub {
  subtest 'image mode' => sub {
    my $C = setup_context_for_volume('test.pd_open');
    my $srv = SRV::Image->new;
    my $env = {
      'psgix.config' => $C->get_object('MdpConfig'),
      'psgix.context' => $C
    };
    my $res = $srv->call($env);
    foreach my $attr (keys %{$srv->persistent_attributes}) {
      ok(exists $srv->{$attr}, "$attr attribute is retained");
    }
    foreach my $attr (qw(id file size region rotation format mimetype restricted missing force tracker)) {
      ok(! exists $srv->{$attr}, "$attr attribute is not retained");
    }
  };

  subtest 'thumbnail mode' => sub {
    my $C = setup_context_for_volume('test.ic_not_held');
    my $srv = SRV::Image->new(mode => 'thumbnail', watermark => 0);
    my $env = {
      'psgix.config' => $C->get_object('MdpConfig'),
      'psgix.context' => $C
    };
    my $res = $srv->call($env);
    is($srv->mode, 'thumbnail', 'mode `thumbnail` retained');
    is($srv->watermark, 0, 'watermark `0` retained');
  };
};

done_testing();
