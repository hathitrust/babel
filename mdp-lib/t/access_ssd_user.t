#!/usr/bin/perl

use strict;
use warnings;
use Test::More;
use File::Spec;

use FindBin;
use lib "$FindBin::Bin/lib";
use lib "$ENV{SDRROOT}/libtest";

use TestUser;

use RightsGlobals;

use MdpConfig;
use Auth::Auth;
use Auth::ACL;
use Access::Rights;
use Access::Holdings;
use Database;
use Institutions;
use CGI;
use Utils;

use Test::File;
use Test::ACL;

use Data::Dumper;
#use feature qw(say);

#---- MONEKYPATCHES
no warnings 'redefine';
#local *Auth::Auth::affiliation_is_hathitrust = sub {
#    return 1;
#};
#
#local *Auth::Auth::auth_sys_is_SHIBBOLETH = sub {
#    return 1;
#};
#
#local *Auth::Auth::affiliation_has_emergency_access = sub {
#    return 0;
#};

local *Access::Holdings::id_is_held = sub {
    my ( $C, $id, $inst ) = @_;
    # pretend that no google books are held by the institution
    return ( $id =~ m,google, ) ? 0 : 1;
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

# mock_institutions($C);
# Test::ACL::mock_acls($C, [
#     {
#       userid => 'user@umich.edu',
#       role => 'ssd',
#       usertype => 'student',
#       access => 'normal',
#       expires => Test::ACL::future_date_string(),
#       identity_provider => Auth::Auth::get_umich_IdP_entity_id(),
#       iprestrict => '.*', #iprestrict_none
#     },
#     {
#       userid => 'user@ox.ac.edu',
#       role => 'ssd',
#       usertype => 'student',
#       access => 'normal',
#       expires => Test::ACL::future_date_string(),
#       identity_provider => q{https://registry.shibboleth.ox.ac.uk/idp},
#       iprestrict => '.*', #iprestrict_none
#     }
# ]);

# local %ENV = %ENV;
# $ENV{HTTP_HOST} = q{babel.hathitrust.org};
# # SERVER_ADDR from TEST-NET-1 block, may not be needed at all
# $ENV{SERVER_ADDR} = q{192.0.2.0};
# $ENV{SERVER_PORT} = q{443};
# $ENV{AUTH_TYPE} = q{shibboleth};
# $ENV{affiliation} = q{student@umich.edu};
# 
# sub setup_us_institution {
#     $ENV{REMOTE_USER} = 'user@umich.edu';
#     $ENV{eppn} = q{user@umich.edu};
#     $ENV{umichCosignFactor} = q{UMICH.EDU};
#     $ENV{Shib_Identity_Provider} = Auth::Auth::get_umich_IdP_entity_id();    
# }
# 
# sub setup_nonus_instition {
#     $ENV{REMOTE_USER} = 'user@ox.ac.edu';
#     $ENV{eppn} = q{user@ox.ac.edu};
#     delete $ENV{umichCosignFactor};
#     $ENV{Shib_Identity_Provider} = q{https://registry.shibboleth.ox.ac.uk/idp};
#     $ENV{affiliation} = q{member@ox.ac.edu};
# }

my $us_ssd_user = TestUser->new('type' => $RightsGlobals::SSD_USER, 'context' => $C);
my $nonus_ssd_user = TestUser->new('type' => $RightsGlobals::SSD_USER, 'context' => $C, 'location' => 'NONUS');

sub test_attr {
    my ( $attr, $access_profile, $location ) = @_;
    my $id = "test.$attr\_$access_profile";
    #$ENV{TEST_GEO_IP_COUNTRY_CODE} = $location || 'US';

    unless ( $attr ) {
        print STDERR caller();
    }

    my $ar = Access::Rights->new($C, $id);
    my $status = $ar->check_final_access_status($C, $id);
    return $status;
}

my $num_tests = 0;

my $tests = Test::File::load_data("$FindBin::Bin/data/access/ssd_user.tsv");

foreach my $test ( @$tests ) {
    my ( 
        $code, 
        $attr, 
        $access_profile, 
        $access_type, 
        $expected_volume,
        $expected_download_page,
        $expected_download_volume,
        $expected_download_plaintext
    ) = @$test;

    my $test_location = $access_type =~ m,NONUS, ? 'NONUS' : 'US';
    my $user = ($test_location eq 'US') ? $us_ssd_user : $nonus_ssd_user;
    $user->begin;
    #if ( $location eq 'US' ) { setup_us_institution(); }
    #else { setup_nonus_instition(); }

    if ( $expected_volume eq 'allow_by_us_geo_ipaddr' ) {
        $expected_volume = ( $test_location eq 'NONUS' ) ? 'deny' : 'allow';
    } elsif ( $expected_volume eq 'allow_nonus_aff_by_ipaddr' ) {
        $expected_volume = ( $test_location eq 'NONUS' ) ? 'allow' : 'deny';
    } elsif ( $expected_volume eq 'allow_us_aff_by_ipaddr' ) {
        $expected_volume = 'allow';
    } elsif ( $expected_volume eq 'allow_ssd_by_holdings' ) {
        $expected_volume = ( $access_profile eq 'google' ) ? 'deny' : 'allow';
    } elsif ( $expected_volume eq 'allow_ssd_by_holdings_by_geo_ipaddr' ) {
        $expected_volume = ( $test_location eq 'NONUS') ? 'allow' : ( ( $access_profile eq 'google' ) ? 'deny' : 'allow' );
    }
    my $actual_volume = test_attr($attr, $access_profile, $test_location);
    $user->end;
    is($actual_volume, $expected_volume, "ssd_user + attr=$attr + location=$test_location + profile=$access_profile");
    $num_tests += 1;
    
}

done_testing($num_tests);

#---- UTILITY
# sub mock_institutions {
#     my ( $C ) = @_;
# 
#     my $inst_ref = { entityIDs => {} };
#     $$inst_ref{entityIDs}{Auth::Auth::get_umich_IdP_entity_id()} = {
#         sdrinst => 'umich',
#         inst_id => 'umich',
#         entityID => Auth::Auth::get_umich_IdP_entity_id(),
#         enabled => 1,
#         allowed_affiliations => q{^(alum|member|student)@umich.edu},
#         us => 1,
#     };
#     $$inst_ref{entityIDs}{q{https://registry.shibboleth.ox.ac.uk/idp}} = {
#         sdrinst => 'ox',
#         inst_id => 'ox',
#         entityID => q{https://registry.shibboleth.ox.ac.uk/idp},
#         enabled => 1,
#         allowed_affiliations => q{^(alum|member|student)@ox.ac.uk},
#         us => 0,
#     };
#     bless $inst_ref, 'Institutions';
#     $C->set_object('Institutions', $inst_ref);
# }
