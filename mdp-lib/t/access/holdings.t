#!/usr/bin/perl

use strict;
use warnings;

use CGI;
use Data::Dumper;
use File::Spec::Functions;
use File::Temp;
use JSON::XS;
use Test::More;
use Test::LWP::UserAgent;

use lib "$ENV{SDRROOT}/mdp-lib";
use Access::Holdings;
use MdpConfig;
use Session;

my $C = new Context;
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
my $config = new MdpConfig(File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'));
$C->set_object('MdpConfig', $config);
my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
$C->set_object('Database', $db);

my $jsonxs = JSON::XS->new->utf8->canonical(1)->pretty(0);
use constant ERROR_LOG => 'holdings_api-error.log';

# Call a subroutine ref flanked by temp error directory setup and teardown.
sub with_local_logdir {
  my $sub = shift;

  my $save_local_logdir = $config->get('local_logdir');
  my $tempdir = File::Temp->newdir;
  $config->override('local_logdir', $tempdir);
  my $local_error_log = File::Spec->catfile($tempdir, ERROR_LOG);
  eval {
    $sub->($local_error_log);
  };
  my $err = $@;
  $config->override('local_logdir', $save_local_logdir);
  die $err if $err;
}

sub error_log_contains {
  my $log_file      = shift;
  my $search_string = shift;

  my $cmd = "grep -c '$search_string' " . $log_file;
  my $count = `$cmd` || 0;
  chomp $count;
  return $count;
}

my $held_response = {
  'copy_count' => 555,
  'brlm_count' => 222,
  'format' => 'spm',
  'n_enum' => 'v.1-5 (1901-1905)',
  'ocns' => ['001', '002', '003']
};

my $institutions_response = {
  'organizations' => ['umich', 'keio']
};

sub get_ua_for_error {
  my $endpoint = shift;

  my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
  $ua->map_response(
    $endpoint,
    HTTP::Response->new('500', 'ERROR', ['Content-Type' => 'text/plain'], 'An error occurred')
  );
  return $ua;
}

my $held_response_json = $jsonxs->encode($held_response);
my $institutions_response_json = $jsonxs->encode($institutions_response);
my $item_access_endpoint = qr{$Access::Holdings::ITEM_ACCESS_ENDPOINT};
my $item_held_by_endpoint = qr{$Access::Holdings::ITEM_HELD_BY_ENDPOINT};

# Create user agent with specified endpoint and 200 OK JSON response
sub get_ua {
  my $endpoint = shift;
  my $response = shift;

  my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
  my $resp = HTTP::Response->new('200', 'OK', ['Content-Type' => 'application/json'], $response);
  $ua->map_response($endpoint, $resp);
  return $ua;
}

sub get_ua_for_held {
  return get_ua($item_access_endpoint, $held_response_json);
}

sub get_ua_for_institutions {
  return get_ua($item_held_by_endpoint, $institutions_response_json);
}

# Verify that the parameters passed to the API by `ua` match the names and values we expect.
# If an expected parameter value is `undef` we expect it _not_ to be sent.
sub expect_params {
  my $ua = shift;
  my %expected = @_;

  my %sent = ();
  # There may not have been a query sent if the API call was preempted by session or DEBUG
  if (defined $ua->last_http_request_sent) {
    %sent = $ua->last_http_request_sent->uri->query_form;
  }
  my $expected_count = 0;
  foreach my $expected_key (keys %expected) {
    my $expected_value = $expected{$expected_key};
    if (defined $expected_value) {
      ok(defined($sent{$expected_key}), "parameter $expected_key was sent");
      is($sent{$expected_key}, $expected_value, "parameter $expected_key was sent as $expected_value");
      $expected_count++;
    } else {
      ok(!defined($sent{$expected_key}), "undef parameter $expected_key was not sent");
    }
  }
  is(scalar keys %sent, $expected_count, "number of parameters sent equals number expected ($expected_count)");
}

my $fake_lock_id = 'fake_lock_id';

subtest "id_is_held" => sub {
  subtest "held according to session" => sub {
    my $htid = 'api.001';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.$htid", [$fake_lock_id, 1]);
    my $ua = get_ua_for_held(0);
    my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich', $ua);
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to API" => sub {
    my $htid = 'api.002';
    my $ua = get_ua_for_held(0);
    # It's not interesting to test the "not held" case for the API since the "held" test below
    # ascertains that we pass and parse correct info to and from `ua`.

    subtest "DEBUG=held wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'held';
      my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich', $ua);
      is($held, 1);
      expect_params($ua);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held according to API" => sub {
    my $htid = 'api.003';
    my $ua = get_ua_for_held;
    my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich', $ua);
    is($held, 555);
    expect_params($ua, item_id => $htid, organization => 'umich', constraint => undef);

    subtest "DEBUG=notheld wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheld';
      $ua = get_ua_for_held;
      my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich', $ua);
      is($held, 0);
      expect_params($ua);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "return error message and held = 0 if API fails, and log error message" => sub {
    my $htid = 'api.004';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = get_ua_for_error($item_access_endpoint);
      my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich', $ua);
      is($held, 0);
      like($lock_id, qr/500 : ERROR/, 'lock id contains error message');
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "id_is_held_and_BRLM" => sub {
  subtest "held/BRLM according to session" => sub {
    my $htid = 'api.004';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.brlm.$htid", [$fake_lock_id, 1]);
    my $ua = get_ua_for_held;
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich', $ua);
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held/BRLM according to API" => sub {
    my $htid = 'api.005';
    my $ua = get_ua_for_held;
    # It's not interesting to test the "not held" case for the API since the "held" test below
    # ascertains that we pass and parse correct info to and from `ua`.

    subtest "DEBUG=heldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'heldb';
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich', $ua);
      is($held, 1);
      expect_params($ua);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held/BRLM according to API" => sub {
    my $htid = 'api.006';
    my $ua = get_ua_for_held;
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich', $ua);
    expect_params($ua, item_id => $htid, organization => 'umich');
    is($held, 222);

    subtest "DEBUG=notheldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheldb';
      $ua = get_ua_for_held;
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich', $ua);
      is($held, 0);
      expect_params($ua);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "return error message and held = 0 if API fails, and log error message" => sub {
    my $htid = 'api.007';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = get_ua_for_error($item_access_endpoint);
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich', $ua);
      is($held, 0);
      like($lock_id, qr/500 : ERROR/, 'lock id contains error message');
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "holding_institutions" => sub {
  my $htid = 'api.007';
  my $ua = get_ua_for_institutions;
  my @got = sort @{Access::Holdings::holding_institutions($C, $htid, $ua)};
  my @expected = sort @{$institutions_response->{organizations}};
  is_deeply(\@got, \@expected);
  expect_params($ua, item_id => $htid, constraint => undef);

  subtest "return empty list and log error if API fails" => sub {
    my $htid = 'api.007';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = get_ua_for_error($item_held_by_endpoint);
      my $got = Access::Holdings::holding_institutions($C, $htid, $ua);
      is_deeply($got, []);
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "holding_BRLM_institutions" => sub {
  my $htid = 'api.008';
  my $ua = get_ua_for_institutions;
  my @got = sort @{Access::Holdings::holding_BRLM_institutions($C, $htid, $ua)};
  my @expected = sort @{$institutions_response->{organizations}};
  is_deeply(\@got, \@expected);
  expect_params($ua, item_id => $htid, constraint => 'brlm');

  subtest "return empty list and log error if API fails" => sub {
    my $htid = 'api.009';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = get_ua_for_error($item_held_by_endpoint);
      my $got = Access::Holdings::holding_BRLM_institutions($C, $htid, $ua);
      is_deeply($got, []);
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "generate_lock_id" => sub {
  my $htid = 'test.001';
  my $test_data = [
    [$htid, 'spm', 'v.1', ['001', '002'], '001-002'],
    [$htid, 'mpm', 'v.1', ['001', '002'], '001-002:v.1'],
    [$htid, 'ser', 'v.1', ['001', '002'], $htid]
  ];
  foreach my $t (@$test_data) {
    is(Access::Holdings::generate_lock_id($t->[0], $t->[1], $t->[2], @{$t->[3]}), $t->[4]);
  }

  subtest "mpm with long n_enum" => sub {
    my $really_long_enum = 'abcdefghij' x 10;
    my $lock_id = Access::Holdings::generate_lock_id($htid, 'mpm', $really_long_enum , '001', '002');
    ok(length($lock_id) <= 100);
    ok($lock_id =~ m/^001-002:/);
  };

  subtest "mpm with long ocns list" => sub {
    my @really_long_ocns_list = ('9876543210', '0123456789', '55555');
    my $lock_id = Access::Holdings::generate_lock_id($htid, 'mpm', 'v.1', @really_long_ocns_list);
    is($lock_id, '0123456789-55555-987:v.1');
  };
};

done_testing();

