#!/usr/bin/perl

use strict;
use warnings;

use Data::Dumper;
use File::Spec;
use HTTP::Request::Common qw(GET);
use JSON::XS;
use Plack::Test;
use Test::More;

use lib File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 't');
use TestHelper;

$Plack::Test::Impl = 'Server';

$ENV{HT_DEV} = 'placeholder_ht_dev';
$ENV{IMGSRV_CHECK_PERSISTENT_ATTRIBUTES} = '1';

subtest "imgsrv.psgi" => sub {
  my $app = do File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 'apps', 'imgsrv.psgi');
  my $test = Plack::Test->create($app);
  subtest "imgsrv/cover" => sub {
    my $res = $test->request(GET "/cover?id=test.pd_open"); # HTTP::Response
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'image/jpeg';

    subtest "only serves files up to gMaxThumbnailSize" => sub {
      my $res = $test->request(GET "/cover?id=test.pd_open&size=400"); # HTTP::Response
      is $res->code, 200;
      is $res->message, 'OK';
      is $res->header('Content-Type'), 'image/jpeg';
      is $res->header('x-hathitrust-imagesize'), '141x250';
    };
  };

  subtest "imgsrv/html" => sub {
    my $res = $test->request(GET "/html?id=test.pd_open&seq=1");
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'text/html;charset=utf-8';
  };

  subtest "imgsrv/image pd access granted" => sub {
    my $res = $test->request(GET "/image?id=test.pd_open&seq=1");
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'image/jpeg';
  };

  subtest "imgsrv/image ic access denied" => sub {
    my $res = $test->request(GET "/volume/thumbnail?id=test.ic_not_held&seq=1");
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'image/svg+xml';
    is $res->header('x-hathitrust-access'), 'deny';
  };

  # imgsrv/info is dev-only, skipping it

  subtest "imgsrv/metadata" => sub {
    my $res = $test->request(GET "/metadata?id=test.pd_open");
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'application/javascript;charset=utf-8';
    my $data = JSON::XS->new->utf8->decode($res->content);
    # Can check expected content of JSON structure
    isa_ok $data->{items}, 'ARRAY';
  };

  subtest "imgsrv/ocr" => sub {
    my $res = $test->request(GET "/ocr?id=test.pd_open&seq=1");
    is $res->code, 200;
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'text/html;charset=utf-8';
  };

  subtest "imgsrv/pdf" => sub {
    my $res = $test->request(GET "/pdf?id=test.pd_open&seq=1");
    # Redirects to download app
    is $res->code, 302;
    is $res->message, 'Found';
    my $redirect = $res->header('Location');
  };
};

subtest "download.psgi" => sub {
  # Silence uninitialized complaint in lib/SRV/Volume/Base.pm
  $ENV{SERVER_NAME} = 'localhost';
  $ENV{SERVER_PORT} = 0;
  # Silence uninitialized error in mdp-lib/Auth/Logging.pm
  $ENV{HTTP_HOST} = 'localhost';

  my $app = do File::Spec->catdir($ENV{SDRROOT}, 'imgsrv', 'apps', 'download.psgi');
  my $test = Plack::Test->create($app);
  subtest "volume/pdf" => sub {
    subtest "with callback" => sub {
      my $res = $test->request(GET "/pdf?id=test.pd_open&callback=1");
      is $res->message, 'OK';
      is $res->header('Content-Type'), 'application/javascript';
    };

    subtest "without callback" => sub {
      my $res = $test->request(GET "/pdf?id=test.pd_open");
      is $res->message, 'OK';
      is $res->header('Content-Type'), 'application/pdf';
    };
  };

  #subtest "volume/epub" => sub {
  #  subtest "with callback" => sub {
  #    my $res = $test->request(GET "/epub?id=test.pd_open&callback=1");
  #    is $res->message, 'OK';
  #    is $res->header('Content-Type'), 'application/javascript';
  #  };

  #  subtest "without callback" => sub {
  #    my $res = $test->request(GET "/epub?id=test.pd_open");
  #    is $res->message, 'OK';
  #    is $res->header('Content-Type'), 'application/epub+zip';
  #  };
  #};

  subtest "volume/plaintext" => sub {
    my $res = $test->request(GET "/plaintext?id=test.pd_open");
    is $res->message, 'OK';
    is $res->header('Content-Type'), 'text/plain';
  };

  subtest "volume/image" => sub {
    subtest "with callback" => sub {
      my $res = $test->request(GET "/image?id=test.pd_open&callback=1");
      is $res->message, 'Forbidden';
    };

    subtest "without callback" => sub {
      my $res = $test->request(GET "/image?id=test.pd_open");
      is $res->message, 'Forbidden';
    };
  };

  subtest "volume/remediated" => sub {
    my $res = $test->request(GET "/remediated?remediated_item_id=test.pd_open&id=test.pd_open");
    is $res->code, 404;
  };
};

delete $ENV{IMGSRV_CHECK_PERSISTENT_ATTRIBUTES};

done_testing();

