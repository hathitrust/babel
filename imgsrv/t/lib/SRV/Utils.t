#!/usr/bin/perl

use strict;
use warnings;

use Test::More;
use File::Spec;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper qw(setup_context_for_volume);

use Access::Rights;
use Context;
use MdpItem;
use Plack::Request;
use SRV::Utils;

# given: params, path_info_segments, req, args
# needs: $req->env->{'psgix.context'}->get_object('MdpItem')->GetId();
# $req->path_info
# $req->param


subtest 'sorts seq params to file' => sub {
  my $C = setup_context_for_volume('test.pd_open');
  my $env = {
    'QUERY_STRING' => 'id=test.id_not_held&seq=10&seq=11&seq=9',
    'psgix.context' => $C
  };
  my $params = {
    file => undef,
  };
  my $req = Plack::Request->new($env);

  SRV::Utils::parse_env($params, [], $req, {});

  is($params->{file},'seq:9,10,11');
};

done_testing();
