#!/usr/bin/perl

use strict;
use warnings;

use CGI;
use Data::Dumper;
use Test::More;

use lib "$ENV{SDRROOT}/mdp-lib";
use Auth::Auth;
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

local %ENV = %ENV;
$ENV{AUTH_TYPE} = q{shibboleth};
$ENV{Shib_Identity_Provider} = 'https://idp.hathitrust.org/entity';

use constant ALUM_ENTITLEMENT => 'alum@hathitrust.org';
use constant MEMBER_ENTITLEMENT => 'member@hathitrust.org';
use constant SSD_USER => 'ssduser@hathitrust.org';
use constant SSD_PROXY_USER => 'ssdproxy@hathitrust.org';

# To prevent the various top-level tests from clobbering each other
sub save_env {
  my $saved_env = {};
  $saved_env->{$_} = $ENV{$_} for @_;
  return $saved_env;
}

sub restore_env {
  my $saved_env = shift;

  foreach my $key (keys %$saved_env) {
    my $val = $saved_env->{$key};
    if (defined $val) {
      $ENV{$key} = $val;
    } else {
      delete $ENV{$key};
    }
  }
}

sub setup_session {
  my $C         = shift;
  my $logged_in = shift || '';

  my $ses = Session::start_session($C);
  if ($logged_in eq 'logged_in') {
    $ses->set_persistent('authenticated_via', 'shibboleth');
  }
  $C->set_object('Session', $ses);
}

subtest 'user_is_print_disabled_proxy' => sub {
  my $save_env = save_env('affiliation', 'REMOTE_USER');
  subtest 'logged out user is not print disabled proxy' => sub {
    setup_session($C);
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled_proxy($C), 0, 'not print disabled proxy by default');
  };

  subtest 'logged in ssdproxy user with invalid affiliation is not print disabled proxy' => sub {
    $ENV{affiliation} = ALUM_ENTITLEMENT;
    $ENV{REMOTE_USER} = SSD_PROXY_USER;
    setup_session($C, 'logged_in');
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled_proxy($C, 1), 0, 'not print disabled even if role is ssd');
  };

  subtest 'logged-in ssdproxy user with valid affiliation is print disabled proxy' => sub {
    $ENV{affiliation} = MEMBER_ENTITLEMENT;
    $ENV{REMOTE_USER} = SSD_PROXY_USER;
    setup_session($C, 'logged_in');
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled_proxy($C, 1), 1, 'print disabled with the appropriate affiliation');
  };
  restore_env($save_env);
};

subtest 'user_is_print_disabled' => sub {
  my $save_env = save_env('affiliation', 'REMOTE_USER');
  subtest 'logged out user is not print disabled' => sub {
    setup_session($C);
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled($C), 0, 'not print disabled by default');
  };

  subtest 'logged in ssd user with invalid affiliation is not print disabled' => sub {
    $ENV{affiliation} = ALUM_ENTITLEMENT;
    $ENV{REMOTE_USER} = SSD_USER;
    setup_session($C, 'logged_in');
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled($C), 0, 'not print disabled even if role is ssd');
  };

  subtest 'logged-in ssd user with valid affiliation is print disabled' => sub {
    $ENV{affiliation} = MEMBER_ENTITLEMENT;
    $ENV{REMOTE_USER} = SSD_USER;
    setup_session($C, 'logged_in');
    my $auth = Auth::Auth->new($C);
    is($auth->user_is_print_disabled($C), 1, 'print disabled with the appropriate affiliation');
  };
  restore_env($save_env);
};

done_testing();
