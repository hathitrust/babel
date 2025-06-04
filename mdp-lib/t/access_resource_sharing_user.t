#!/usr/bin/perl

use strict;
use warnings;
use Test::More;
use File::Spec;

use FindBin;
use lib "$FindBin::Bin/lib";

use RightsGlobals;

use MdpConfig;
use Auth::Auth;
use Auth::ACL;
use Access::Rights;
use Database;
use Institutions;
use CGI;
use Utils;

use Test::File;
use Test::ACL;

use Data::Dumper;
use feature qw(say);

# Controls the behavior of the monkeypatched Access::Holdings routines.
# The only one we care about for the Resource Sharing user type is `id_is_currently_held`
my $g_held_condition = undef;

#---- MONEKYPATCHES
no warnings 'redefine';
local *Auth::Auth::affiliation_is_hathitrust = sub {
    return 1;
};

local *Auth::Auth::auth_sys_is_SHIBBOLETH = sub {
    return 1;
};

local *Auth::Auth::user_is_resource_sharing_user = sub {
    return 1;
};

local *Access::Holdings::id_is_currently_held = sub {
    my ( $C, $id, $inst ) = @_;

    return ( $g_held_condition eq 'currently' ) ? 1 : 0;
};
#---- MONEKYPATCHES


my $C = new Context;
my $cgi = new CGI;
$C->set_object('CGI', $cgi);
my $config = new MdpConfig(File::Spec->catdir($ENV{SDRROOT}, 'mdp-lib/Config/uber.conf'),
                           File::Spec->catdir($ENV{SDRROOT}, 'slip-lib/Config/common.conf'));
$C->set_object('MdpConfig', $config);

my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
$C->set_object('Database', $db);

my $auth = Auth::Auth->new($C);
$C->set_object('Auth', $auth);

mock_institutions($C);

Test::ACL::mock_acls($C, [
    {
      userid => 'user@iu.edu',
      role => 'resource_sharing',
      usertype => 'external',
      access => 'normal',
      expires => Test::ACL::future_date_string(),
      identity_provider => 'https://idp.login.iu.edu/idp/shibboleth'
    },
    {
      userid => 'user@ox.ac.edu',
      role => 'resource_sharing',
      usertype => 'external',
      access => 'normal',
      expires => Test::ACL::future_date_string(),
      identity_provider => q{https://registry.shibboleth.ox.ac.uk/idp}
    }
]);

local %ENV = %ENV;
$ENV{HTTP_HOST} = q{babel.hathitrust.org};
# SERVER_ADDR from TEST-NET-1 block, may not be needed at all
$ENV{SERVER_ADDR} = q{192.0.2.0};
$ENV{SERVER_PORT} = q{443};
$ENV{AUTH_TYPE} = q{shibboleth};
$ENV{affiliation} = q{member@iu.edu};

sub setup_us_institution {
    $ENV{REMOTE_USER} = 'user@iu.edu';
    $ENV{eppn} = q{user@iu.edu};
    $ENV{Shib_Identity_Provider} = 'https://idp.login.iu.edu/idp/shibboleth';
}

sub setup_nonus_instition {
    $ENV{REMOTE_USER} = 'user@ox.ac.edu';
    $ENV{eppn} = q{user@ox.ac.edu};
    $ENV{Shib_Identity_Provider} = q{https://registry.shibboleth.ox.ac.uk/idp};
    $ENV{affiliation} = q{member@ox.ac.edu};
}

sub test_initial_access_status {
    my ( $code, $attr, $access_profile, $location ) = @_;
    my $id = "test.$attr\_$access_profile";
    $ENV{TEST_GEO_IP_COUNTRY_CODE} = $location || 'US';

    unless ( $code && $attr ) {
        print STDERR caller();
    }

    my $ar = Access::Rights->new($C, $id);
    my $status = $ar->check_initial_access_status_by_attribute($C, $code, $id);
    return $status;
}

sub test_final_access_status {
    my ( $attr, $access_profile, $location ) = @_;
    my $id = "test.$attr\_$access_profile";
    $ENV{TEST_GEO_IP_COUNTRY_CODE} = $location || 'US';

    unless ( $attr ) {
        print STDERR caller();
    }

    my $ar = Access::Rights->new($C, $id);
    my $status = $ar->check_final_access_status($C, $id);
    return $status;
}

my $num_tests = 0;

my $tests = Test::File::load_data("$FindBin::Bin/data/access/resource_sharing_user.tsv");


my $holdings_codes = {
  "n" => "notheld",
  "h" => "held",
  "b" => "brlm",
  "c" => "currently"
};
# Translate the shorthand codes used in the TSV file for holdings states or groups of states
# Possible input [-]nhbc\*+
# Possible translations are "notheld", "held", "brlm", "currently"
# Output is sorted arrayref
sub translate_holdings_code {
  my $code = shift;

  my $negate = 0;
  my $resolved = {};
  $code =~ s/\*/nhbc/g;
  if ($code =~ m/-/) {
    $negate = 1;
    $code = substr($code, 1);
    $resolved->{$holdings_codes->{$_}} = 1 for keys %$holdings_codes;
  }
  while (my ($key, $val) = each %$holdings_codes) {
    if ($code =~ m/$key/) {
      if ($negate) {
        delete $resolved->{$val};
      } else {
        $resolved->{$val} = 1;
      }
    }
  }
  my @retval = sort keys %$resolved;
  return \@retval;
}

foreach my $test ( @$tests ) {
    my ( 
        $code,
        $attr,
        $access_profile,
        $location,
        $held,
        $expected_initial_access_status,
        $expected_final_access_status,
        $expected_download_page,
        $expected_download_volume,
        $expected_download_plaintext
    ) = @$test;
    my @test_locations = ();
    if ($location eq '*') {
        @test_locations = ('US', 'NONUS');
    } else {
        @test_locations = ( $location );
    }
    foreach my $test_location (@test_locations) {
        # Note: FORCE_GEOIP may be a viable alternative to some of this setup.
        # (Would need to adjust its use in Access::Rights::_resolve_access_by_GeoIP)
        if ( $test_location eq 'US' ) { setup_us_institution(); }
        else { setup_nonus_instition(); }
        my $held_conditions = translate_holdings_code($held);
        foreach my $held_condition (@$held_conditions) {
          $g_held_condition = $held_condition;
          #printf STDERR "HELD CONDITION $g_held_condition FROM %s\n", Dumper $held_conditions;
          my $got_initial_access_status = test_initial_access_status($code, $attr, $access_profile, $test_location);
          is($got_initial_access_status, $expected_initial_access_status, "INITIAL resource_sharing_user + attr=$attr + held=$held_condition + location=$test_location + profile=$access_profile");
          $num_tests += 1;
          my $got_final_access_status = test_final_access_status($attr, $access_profile, $test_location);
          is($got_final_access_status, $expected_final_access_status, "FINAL resource_sharing_user + attr=$attr + held=$held_condition + location=$test_location + profile=$access_profile");
          $num_tests += 1;
        }
    }
    # NOTE: there are no tests yet for the $expected_download_* values
}

done_testing($num_tests);

#---- UTILITY
sub mock_institutions {
    my ( $C ) = @_;

    my $inst_ref = { entityIDs => {} };
    $$inst_ref{entityIDs}{'https://idp.login.iu.edu/idp/shibboleth'} = {
        sdrinst => 'iu',
        inst_id => 'iu',
        entityID => 'https://idp.login.iu.edu/idp/shibboleth',
        enabled => 1,
        allowed_affiliations => '^(member|alum|faculty|staff|student|employee)@iu.edu',
        us => 1,
    };
    $$inst_ref{entityIDs}{q{https://registry.shibboleth.ox.ac.uk/idp}} = {
        sdrinst => 'ox',
        inst_id => 'ox',
        entityID => q{https://registry.shibboleth.ox.ac.uk/idp},
        enabled => 1,
        allowed_affiliations => q{^(alum|member)@ox.ac.uk},
        us => 0,
    };
    bless $inst_ref, 'Institutions';
    $C->set_object('Institutions', $inst_ref);
}
