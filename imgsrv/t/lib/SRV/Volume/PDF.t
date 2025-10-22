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
use SRV::Volume::PDF;

subtest 'new' => sub {
  setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::PDF->new;
  isa_ok($srv, 'SRV::Volume::PDF', 'SRV::Volume::PDF is created');
};

# SRV::Volume::PDF uses the default implementation in SRV::Volume::Base for this method.
# Will return a 403 if the volume is restricted, otherwise returns a coderef wrapping the
# `run` method.
subtest 'call' => sub {
  my $C = setup_context_for_volume('test.ic_not_held');
  my $srv = SRV::Volume::PDF->new;
  my $env = {
    'psgix.config' => $C->get_object('MdpConfig'),
    'psgix.context' => $C
  };
  my $res = $srv->call($env);
  is($res->[0], 403, 'returns 403 response for a restricted volume');
};

# Produces a PDF at $srv->{output_filename}
# There is also a directory with the same extension-less basename plus "__progress"
# (progress_filepath) which holds progress .js files (1.js, 2.js, ...) and a done.js file.
subtest 'run' => sub {
  my $C = setup_context_for_volume('test.pd_open');
  my $srv = SRV::Volume::PDF->new;
  my $env = {
    'psgix.config' => $C->get_object('MdpConfig'),
    'psgix.context' => $C
  };
  $srv->call($env);
  my $res = $srv->run($env);
  ok(-d $srv->progress_filepath, 'progress directory exists');
  ok(-e $srv->output_filename, 'output file exists');
  ok($srv->output_filename =~ /\.pdf$/, 'output file extension is .pdf');
};

done_testing();
