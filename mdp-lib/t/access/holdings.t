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
my $dbh = $db->get_DBH($C);
DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
# HACK HACK HACK HACK
# TODO: Remove this once we transition fully to Holdings API.
# We won't be needing updated ht_institutions unless we want to mock the Holdings API based on
# database contents, and that seems kinda silly.
DbUtils::prep_n_execute($dbh, 'UPDATE ht_institutions SET mapto_inst_id=inst_id WHERE mapto_inst_id IS NULL');

my $jsonxs = JSON::XS->new->utf8->canonical(1)->pretty(0);
use constant ERROR_LOG => 'holdings_api-error.log';

# Call a subroutine ref flanked by temp error directory setup and teardown.
sub with_local_logdir {
  my $sub = shift;

  my $save_local_logdir = $config->get('local_logdir');
  my $tempdir = File::Temp->newdir;
  $config->override('local_logdir', $tempdir);
  my $local_error_log = File::Spec::Functions::catfile($tempdir, ERROR_LOG);
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

my $not_held_response = {
  'copy_count' => 0,
  'format' => 'spm',
  'n_enum' => 'v.1-5 (1901-1905)',
  'ocns' => ['001', '002', '003']
};

my $held_response = {
  'copy_count' => 1,
  'format' => 'spm',
  'n_enum' => 'v.1-5 (1901-1905)',
  'ocns' => ['001', '002', '003']
};

my $institutions_response = {
  'organizations' => ['umich', 'keio']
};

sub error_http_response {
  return HTTP::Response->new('500', 'ERROR', ['Content-Type' => 'text/plain'], 'An error occurred');
}

my $not_held_response_json = $jsonxs->encode($not_held_response);
my $held_response_json = $jsonxs->encode($held_response);
my $institutions_response_json = $jsonxs->encode($institutions_response);
my $item_access_endpoint = qr{$Access::Holdings::ITEM_ACCESS_ENDPOINT};
my $item_held_by_endpoint = qr{$Access::Holdings::ITEM_HELD_BY_ENDPOINT};

sub get_ua_for_held {
  my $held = shift;

  my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
  my $json = ($held) ? $held_response_json : $not_held_response_json;
  my $resp = HTTP::Response->new('200', 'OK', ['Content-Type' => 'application/json'], $json);
  $ua->map_response($item_access_endpoint, $resp);
  return $ua;
}

sub get_ua_for_institutions {
  my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
  my $resp = HTTP::Response->new('200', 'OK', ['Content-Type' => 'application/json'], $institutions_response_json);
  $ua->map_response($item_held_by_endpoint, $resp);
  return $ua;
}

# TODO: these are only needed for testing the legacy (non-API) interface
my $fake_lock_id = 'fake_lock_id';
my $fake_cluster_id = 'fake_cluster_id';

subtest "id_is_held_api" => sub {
  subtest "held according to session" => sub {
    my $htid = 'api.001';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.$htid", [$fake_lock_id, 1]);
    my $ua = get_ua_for_held(0);
    my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to API" => sub {
    my $htid = 'api.002';
    my $ua = get_ua_for_held(0);
    my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
    is($held, 0);

    subtest "DEBUG=held wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'held';
      my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
      is($held, 1);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held according to API" => sub {
    my $htid = 'api.003';
    my $ua = get_ua_for_held(1);
    my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
    is($held, 1);

    subtest "DEBUG=notheld wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheld';
      my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
      is($held, 0);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "return error message and held = 0 if API fails, and log error message" => sub {
    my $htid = 'api.004';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
      $ua->map_response($item_access_endpoint, error_http_response);
      my ($lock_id, $held) = Access::Holdings::id_is_held_API($C, $htid, 'umich', $ua);
      is($held, 0);
      like($lock_id, qr/500 : ERROR/, 'lock id contains error message');
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "id_is_held" => sub {
  subtest "held according to session" => sub {
    my $htid = 'mdp.001';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.$htid", [$fake_lock_id, 1]);
    my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to DB" => sub {
    my $htid = 'mdp.002';
    my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($held, 0);

    subtest "DEBUG=held wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'held';
      my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich');
      is($held, 1);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held according to DB" => sub {
    my $htid = 'mdp.003';
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, copy_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, 'umich', 3);
    my $ret = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($ret, 3);

    subtest "DEBUG=notheld wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheld';
      my ($lock_id, $held) = Access::Holdings::id_is_held($C, $htid, 'umich');
      is($held, 0);
      $ENV{DEBUG} = $save_debug;
    };
  };
};

subtest "id_is_held_and_BRLM_API" => sub {
  subtest "held and BRLM according to session" => sub {
    my $htid = 'api.004';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.brlm.$htid", [$fake_lock_id, 1]);
    my $ua = get_ua_for_held(0);
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held and BRLM according to API" => sub {
    my $htid = 'api.005';
    my $ua = get_ua_for_held(0);
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
    is($held, 0);

    subtest "DEBUG=heldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'heldb';
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
      is($held, 1);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held and BRLM according to API" => sub {
    my $htid = 'api.006';
    my $ua = get_ua_for_held(1);
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
    is($held, 1);

    subtest "DEBUG=notheldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheldb';
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
      is($held, 0);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "return error message and held = 0 if API fails, and log error message" => sub {
    my $htid = 'api.007';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
      $ua->map_response($item_access_endpoint, error_http_response);
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM_API($C, $htid, 'umich', $ua);
      is($held, 0);
      like($lock_id, qr/500 : ERROR/, 'lock id contains error message');
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "id_is_held_and_BRLM" => sub {
  DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
  subtest "held according to session" => sub {
    my $htid = 'mdp.004';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.brlm.$htid", [$fake_lock_id, 1]);
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($held, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to DB" => sub {
    my $htid = 'mdp.005';
    my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($held, 0);

    subtest "DEBUG=heldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'heldb';
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
      is($held, 1);
      $ENV{DEBUG} = $save_debug;
    };
  };

  subtest "held according to DB" => sub {
    my $htid = 'mdp.006';
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, access_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, 'umich', 5);
    my $ret = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($ret, 5);

    subtest "DEBUG=notheldb wins" => sub {
      my $save_debug = $ENV{DEBUG};
      $ENV{DEBUG} = 'notheldb';
      my ($lock_id, $held) = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
      is($held, 0);
      $ENV{DEBUG} = $save_debug;
    };
  };
};

subtest "holding_institutions_API" => sub {
  my $htid = 'api.007';
  my $ua = get_ua_for_institutions;
  my @got = sort @{Access::Holdings::holding_institutions_API($C, $htid, $ua)};
  my @expected = sort @{$institutions_response->{organizations}};
  is_deeply(\@got, \@expected);

  subtest "return empty list and log error if API fails" => sub {
    my $htid = 'api.007';
    with_local_logdir(sub {
      my $local_logfile = shift;

      my $ua = Test::LWP::UserAgent->new(network_fallback => 0);
      $ua->map_response($item_held_by_endpoint, error_http_response);
      my $got = Access::Holdings::holding_institutions_API($C, $htid, $ua);
      is_deeply($got, []);
      ok(error_log_contains($local_logfile, $htid));
    });
  };
};

subtest "holding_institutions" => sub {
  my @holding_institutions = sort ('asu', 'harvard');
  my @not_holding_institutions = sort ('loc', 'umich', 'utexas');
  my $htid = 'mdp.007';
  foreach my $inst (@holding_institutions) {
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, copy_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, $inst, 1);
  }
  my @ret = sort @{Access::Holdings::holding_institutions($C, $htid)};
  is_deeply(\@ret, \@holding_institutions);
};

subtest "holding_BRLM_institutions" => sub {
  my @holding_institutions = sort ('asu', 'harvard');
  my @not_holding_institutions = sort ('loc', 'umich', 'utexas');
  my $htid = 'mdp.008';
  foreach my $inst (@holding_institutions) {
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, access_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, $inst, 1);
  }
  foreach my $inst (@not_holding_institutions) {
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, access_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, $inst, 0);
  }
  my @ret = sort @{Access::Holdings::holding_BRLM_institutions($C, $htid)};
  is_deeply(\@ret, \@holding_institutions);
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

# Clean up
DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
done_testing();

