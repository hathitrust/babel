use strict;
use warnings;

use Encode;
use Test::More;

use lib "$ENV{SDRROOT}/ls/lib";
use lib "$ENV{SDRROOT}/slip-lib";
use lib "$ENV{SDRROOT}/mdp-lib";
use lib "$ENV{SDRROOT}/mdp-lib/t/lib";

use Auth::Auth;
use Context;
use Data::Dumper;
use Database;
use LS::PIFiller::Advanced;
use LS::FacetConfig;
use LS::Query::Facets;
use RightsGlobals;
use Test::User;
use Utils;


### THE MINDLESS SETUP BOILERPLATE
# copied from cgi/ls
my $C = new Context;
my $db_user = $ENV{'MARIADB_USER'} || 'ht_testing';
my $db = new Database($db_user);
  $C->set_object('Database', $db);
my $config = new MdpConfig(
                           Utils::get_uber_config_path('ls'),
                           $ENV{SDRROOT} . "/ls/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/ls/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);
my $AB_test_config_filename = $ENV{SDRROOT} . '/ls/lib/Config/AB_test_config';
my $AB_test_config = $config = Config::Tiny->read($AB_test_config_filename);
ASSERT($AB_test_config, qq{Error in testing config file $AB_test_config_filename: } . Config::Tiny::errstr);
# 1 disables checking object name
$C->set_object('AB_test_config', $AB_test_config, 1);
my $facet_config = new LS::FacetConfig($C, $ENV{SDRROOT} . "/ls/lib/Config/facetconfig.pl");
$C->set_object('FacetConfig', $facet_config);
my $auth = new Auth::Auth($C);
$C->set_object('Auth', $auth);

my $AB = 'A';


# NOTE: this is an almost completely useless test that illustrates the scaffolding
# we need to run better ones in the future.
# The resulting query strings are complex. I don't really know what to do with them
# beyond poking around with ugly regexes.
subtest 'get_Solr_query_string' => sub {
  # Mindlessly copied from test/testQueries.pl
  my $query_config = {
    solr_start_row => 0,
    solr_num_rows => 2,
    query_type => 'full_text'
  };
  subtest 'advanced search' => sub {
    subtest 'two terms' => sub {
      my $cgi = CGI->new;
      $C->set_object('CGI', $cgi);
      $cgi->param('adv', '1');

      $cgi->param('field1', 'ocr');
      $cgi->param('anyall1', 'all');
      $cgi->param('q1', 'search1');

      $cgi->param('field2', 'author');
      $cgi->param('anyall2', 'all');
      $cgi->param('q2', 'search2');

      $cgi->param('op2', 'AND');
      my $facets = new LS::Query::Facets($C, '', undef, $query_config);
      my $query_string = $facets->get_Solr_query_string($C, $AB);
      ok($query_string =~ m/AND\s+_query/, 'result is not parenthesized because q3 and q4 are not present');
    };

    subtest 'two terms separated by gap' => sub {
      my $cgi = CGI->new;
      $C->set_object('CGI', $cgi);
      $cgi->param('adv', '1');

      $cgi->param('field1', 'ocr');
      $cgi->param('anyall1', 'all');
      $cgi->param('q1', 'search1');

      $cgi->param('field4', 'author');
      $cgi->param('anyall4', 'all');
      $cgi->param('q4', 'search2');
      
      $cgi->param('op3', 'AND');
      
      my $facets = new LS::Query::Facets($C, '', undef, $query_config);
      my $query_string = $facets->get_Solr_query_string($C, $AB);
      ok($query_string =~ m/\) AND \(/, 'result is parenthesized because `(1 op2 2) op3 (3 op4 4)`');
    };
  };
};

### FULLTEXT FACET
# LIMITATIONS OF TESTING
# We have not exercised the Facets.pm code adjacent to UNIVERSITY_OF_CALIFORNIA
# No test run for ETAS outside US

# TERMINOLOGY
# "Invisible" rights are 8, 26, 27 (nobody, pd-pvt, supp) only viewable by HT staff
# "IC Equivalents" are 2, 3, 4, 5, 16 (ic, op, orph, und, orphcand) -- note that orph and orphcand are obsolete
#     (Note some of these are obsolete)
# "PD Equivalents" are 1, 6, 7 (pd, umall, ic-world) and all the CC licenses -- note that umall is obsolete

# KNOWN BUGS
# SSD_USER located in US includes icus
# LIBRARY_IPADDR_USER hard-codes pdus-allowed and icus-disallowed even for non-US (which is impossible? so maybe not a bug)
# EMERGENCY_ACCESS_AFFILIATE located in US includes icus (outside-US not tested)
# RESOURCE_SHARING_USER located in the US includes icus
# RESOURCE_SHARING_USER located outside the US includes pdus

# I believe most of these could be fixed if `Access::Rights::_Check_final_access_status`
# did not bail out when `$id` is unset -- it deprives the caller of geoip status.
# Instead it should call _resolve_ssd_access_by_held_by_GeoIP (and its ilk) with `$id`
# undefined and allow it to bail out before checking holdings but after checking geoip.


# Swap in user, and make sure the auth system thinks this is actually a user of this type.
# When we have more confidence in Test::User.pm we can probably get rid of this.
sub begin_and_check_user {
  my $user = shift;

  $user->begin;
  my $access_type = Access::Rights::get_access_type_determination(new Context);
  is($access_type, $user->{type});
}

my $cgi = CGI->new;
$C->set_object('CGI', $cgi);
my $facets = LS::Query::Facets->new($C, '');

subtest '__get_Solr_fulltext_filter_query' => sub {
  subtest 'with CAA user (HT_TOTAL_USER)' => sub {
    my $test_user = Test::User->new('type' => $RightsGlobals::HT_TOTAL_USER);
    begin_and_check_user($test_user);
    my $result = $facets->__get_Solr_fulltext_filter_query($C);
    (my $expected = <<~'FQ') =~ s/\s//g;
      fq=(
        rights:(1+OR+2+OR+3+OR+4+OR+5+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                14+OR+15+OR+16+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
      )
    FQ
    is($result, $expected, 'excludes 8, 26, 27 (nobody, pd-pvt, supp)');
    $test_user->end;
  };

  subtest 'with ordinary user (ORDINARY_USER)' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::ORDINARY_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows 9 (pdus) but not 19 (icus)');
      $test_user->end;
    };

    subtest 'located outside US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::ORDINARY_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows 19 (icus) but not 9 (pdus)');
      $test_user->end;
    };
  };

  subtest 'with SSD user (SSD_USER)' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::SSD_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
          +OR+
          (
            (ht_heldby:hathitrust+AND+rights:2)
            +OR+
            (ht_heldby:hathitrust+AND+rights:3)
            +OR+
            (ht_heldby:hathitrust+AND+rights:4)
            +OR+
            (ht_heldby:hathitrust+AND+rights:5)
            +OR+
            (ht_heldby:hathitrust+AND+rights:16)
          )
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows icus and pdus [BUG], requires holdings for ic equivalents');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::SSD_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
          +OR+
          (
            (ht_heldby:ox+AND+rights:2)
            +OR+
            (ht_heldby:ox+AND+rights:3)
            +OR+
            (ht_heldby:ox+AND+rights:4)
            +OR+
            (ht_heldby:ox+AND+rights:5)
            +OR+
            (ht_heldby:ox+AND+rights:16)
          )
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows 19 (icus) but not 9 (pdus), requires holdings for ic equivalents');
      $test_user->end;
    };
  };

  subtest 'with ATRS Provider user (SSD_PROXY_USER)' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::SSD_PROXY_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          rights:(1+OR+2+OR+3+OR+4+OR+5+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                  14+OR+15+OR+16+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
        )
      FQ
      is($result, $expected, 'excludes invisible rights');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::SSD_PROXY_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          rights:(1+OR+2+OR+3+OR+4+OR+5+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                  14+OR+15+OR+16+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
        )
      FQ
      is($result, $expected, 'excludes invisible rights');
      $test_user->end;
    };
  };

  subtest 'with in-library user (LIBRARY_IPADDR_USER)' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::LIBRARY_IPADDR_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
          )
          +OR+
          (
            (ht_heldby_brlm:hathitrust+AND+rights:3)
          )
        )
      FQ
      is($result, $expected, 'allows 9 (pdus) but not 19 (icus), 3 (op) allowed if held BRLM');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::LIBRARY_IPADDR_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
          )
          +OR+
          (
            (ht_heldby_brlm:ox+AND+rights:3)
          )
        )
      FQ
      is($result, $expected, 'allows 9 (pdus) but not 19 (icus) [BUG?], 3 (op) allowed if held BRLM');
      $test_user->end;
    };
  };

  subtest 'with affiliate (HT_AFFILIATE)' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::HT_AFFILIATE);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
          )
        )
      FQ
      is($result, $expected, 'disallows ic equivalents, allows 9 (pdus) but not 19 (icus)');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::HT_AFFILIATE, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25)
          )
        )
      FQ
      is($result, $expected, 'disallows ic equivalents, allows 19 (icus) but not 9 (pdus)');
      $test_user->end;
    };
  };

  # ETAS located outside the US is an edge case that would require an additional
  # database fixture and more logic for Test::User to simulate it properly.
  # Restrict to testing US access for now.
  subtest 'with ETAS user' => sub {
    my $test_user = Test::User->new('type' => $RightsGlobals::EMERGENCY_ACCESS_AFFILIATE);
    begin_and_check_user($test_user);
    my $result = $facets->__get_Solr_fulltext_filter_query($C);
    (my $expected = <<~'FQ') =~ s/\s//g;
      fq=(
        (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                 14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
        +OR+
        (
          (ht_heldby:etas+AND+rights:2)
          +OR+
          (ht_heldby:etas+AND+rights:3)
          +OR+
          (ht_heldby:etas+AND+rights:4)
          +OR+
          (ht_heldby:etas+AND+rights:5)
          +OR+
          (ht_heldby:etas+AND+rights:16)
        )
      )
    FQ
    is($result, $expected, 'allows pd equivalents, allows 9 (pdus) and 19 (icus) [BUG], requires holdings for ic equivalents');
    $test_user->end;
  };

  subtest 'with HT_STAFF user' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::HT_STAFF_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          rights:(1+OR+2+OR+3+OR+4+OR+5+OR+6+OR+7+OR+8+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+16+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25+OR+26+OR+27)
        )
      FQ
      is($result, $expected, 'allows everything');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::HT_STAFF_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          rights:(1+OR+2+OR+3+OR+4+OR+5+OR+6+OR+7+OR+8+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+16+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25+OR+26+OR+27)
        )
      FQ
      is($result, $expected, 'allows everything');
      $test_user->end;
    };
  };

  subtest 'with RS user' => sub {
    subtest 'located in US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::RESOURCE_SHARING_USER);
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
          +OR+
          (
            (ht_heldby:hathitrust+AND+rights:2)
            +OR+
            (ht_heldby:hathitrust+AND+rights:3)
            +OR+
            (ht_heldby:hathitrust+AND+rights:4)
            +OR+
            (ht_heldby:hathitrust+AND+rights:5)
            +OR+
            (ht_heldby:hathitrust+AND+rights:16)
          )
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows 9 (pdus) and 19 (icus) [BUG], requires holdings for ic equivalents');
      $test_user->end;
    };

    subtest 'located outside the US' => sub {
      my $test_user = Test::User->new('type' => $RightsGlobals::RESOURCE_SHARING_USER, location => 'NONUS');
      begin_and_check_user($test_user);
      my $result = $facets->__get_Solr_fulltext_filter_query($C);
      (my $expected = <<~'FQ') =~ s/\s//g;
        fq=(
          (rights:(1+OR+6+OR+7+OR+9+OR+10+OR+11+OR+12+OR+13+OR+
                   14+OR+15+OR+17+OR+18+OR+19+OR+20+OR+21+OR+22+OR+23+OR+24+OR+25))
          +OR+
          (
            (ht_heldby:ox+AND+rights:2)
            +OR+
            (ht_heldby:ox+AND+rights:3)
            +OR+
            (ht_heldby:ox+AND+rights:4)
            +OR+
            (ht_heldby:ox+AND+rights:5)
            +OR+
            (ht_heldby:ox+AND+rights:16)
          )
        )
      FQ
      is($result, $expected, 'allows pd equivalents, allows 9 (pdus) and 19 (icus) [BUG], requires holdings for ic equivalents');
      $test_user->end;
    };
  };
};

done_testing();