#!/usr/bin/perl

use strict;
use warnings;

use CGI;
use Data::Dumper;
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
my $config = new MdpConfig(File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'),
                           File::Spec->catdir($ENV{SDRROOT}, 'slip-lib/Config/common.conf'));
$C->set_object('MdpConfig', $config);
my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
$C->set_object('Database', $db);
my $dbh = $db->get_DBH($C);
DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
# HACK HACK HACK HACK
# FIXME: Remove this once we transition to Holdings API.
# We won't be needing updated ht_institutions unless we want to mock the Holdings API based on
# database contents, and that seems kinda silly.
DbUtils::prep_n_execute($dbh, 'UPDATE ht_institutions SET mapto_inst_id=inst_id WHERE mapto_inst_id IS NULL');

# FIXME: these will not be needed when testing holdings API
my $fake_lock_id = 'fake_lock_id';
my $fake_cluster_id = 'fake_cluster_id';
subtest "id_is_held" => sub {
  subtest "held according to session" => sub {
    my $htid = 'mdp.001';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.$htid", [$fake_lock_id, 1]);
    my $ret = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($ret, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to DB" => sub {
    my $htid = 'mdp.002';
    my $ret = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($ret, 0);
  };

  subtest "held according to DB" => sub {
    my $htid = 'mdp.003';
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, copy_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, 'umich', 3);
    my $ret = Access::Holdings::id_is_held($C, $htid, 'umich');
    is($ret, 3);
  };
};

subtest "id_is_held_and_BRLM" => sub {
  DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
  subtest "held according to session" => sub {
    my $htid = 'mdp.004';
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);
    $ses->set_transient("held.brlm.$htid", [$fake_lock_id, 1]);
    my $ret = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($ret, 1, "$htid is held in session transient");
    $ses->close;
  };

  subtest "not held according to DB" => sub {
    my $htid = 'mdp.005';
    my $ret = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($ret, 0);
  };

  subtest "held according to DB" => sub {
    my $htid = 'mdp.006';
    my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, access_count) VALUES (?, ?, ?, ?, ?)';
    DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, 'umich', 5);
    my $ret = Access::Holdings::id_is_held_and_BRLM($C, $htid, 'umich');
    is($ret, 5);
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
  # holding_institutions doesn't care if copy_count is zero, so enabling this bit messes up the test.
  # May work with Holdings API, however.
  #foreach my $inst (@not_holding_institutions) {
  #  my $sql = 'INSERT INTO holdings_htitem_htmember (lock_id, cluster_id, volume_id, member_id, copy_count) VALUES (?, ?, ?, ?, ?)';
  #  DbUtils::prep_n_execute($dbh, $sql, $fake_lock_id, $fake_cluster_id, $htid, $inst, 0);
  #}
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

# ====================== FUTURE WORK HERE ======================
# This will likely be the testing procedure for the Holdings API
my $item_held_by_endpoint = qr{/v1/item_held_by};
my $ua = Test::LWP::UserAgent->new;
my $jsonxs = JSON::XS->new->utf8->canonical(1)->pretty(0);
# Response will look something like this
my $held_by_response = {
  'copy_count' => 1,
  'format' => 'spm',
  'n_enum' => 'v.1-5 (1901-1905)',
  'ocns' => [1, 2, 3]
};
my $held_by_response_json = $jsonxs->encode($held_by_response);
$ua->map_response($item_held_by_endpoint, HTTP::Response->new('200', 'OK', ['Content-Type' => 'text/plain'], $held_by_response_json));
# ====================== FUTURE WORK HERE ======================

# Clean up
DbUtils::prep_n_execute($dbh, 'DELETE FROM holdings_htitem_htmember');
done_testing();

