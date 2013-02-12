#!/usr/bin/env perl

use strict;
use warnings;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;


# Perl
use Getopt::Std;
# App
use Context;
use Utils;
use Debug::DUtils;

use Context;
use MdpConfig;
use Identifier;
use Password;
use Database;

use SLIP_Utils::Common;
use SLIP_Utils::States;

use Search::Searcher;
use Search::Query;
use Search::Result::SLIP;


our ($opt_r, $opt_F, $opt_I);

my $ops = getopts('r:I:F:');

my $RUN = $opt_r;
if (! defined $RUN) {
    print tis_get_usage();
    exit 1;
}

my $C = new Context;

my $config = SLIP_Utils::Common::gen_SLIP_config($RUN);
$C->set_object('MdpConfig', $config);

my $ID = $opt_I;
my $ID_FILENAME = $opt_F;

my $whoami = `whoami`;
chomp($whoami);
print "Enter passwd: ";
my $passwd = Password::get_password();
print "\n";

# Database connection
my $db = new Database($whoami, $passwd, 'ht', 'mysql-sdr');
my $DBH = $db->get_DBH();

sub tis_get_usage {
    return qq{Usage: test-id-in-solr.pl -r run {-F file | -I id} \nchecks for id(s) existence by querying -r run solr and in slip_rights.\n};
}

sub load_ids_from_file {
    my $filename = shift;

    my $arr;
    my $ok;
    eval {
        $ok = open(IDS, "<$filename");
    };
    if ($@) {
        my $s0 = qq{i/o ERROR:($@) opening file="$filename"\n};
        exit 1;
    }

    if (! $ok) {
        my $s1 = qq{could not open file="$filename"\n};
        exit 1;
    }

    while (my $id = <IDS>) {
        chomp($id);
        push(@$arr, $id) if($id);
    }
    close (IDS);

    return $arr;
}


sub test_ids {
    my $id = shift;
    
    my $ref_to_arr_of_ids;

    if (defined $id) {
        push(@$ref_to_arr_of_ids, $id);
    }
    else {
        $ref_to_arr_of_ids = load_ids_from_file($ID_FILENAME);
    }
    my $num_loaded = scalar(@$ref_to_arr_of_ids);

    if ($num_loaded > 0) {
        print qq{loaded $num_loaded items from file=$ID_FILENAME\n} if ($ID_FILENAME);
        
        foreach my $id (@$ref_to_arr_of_ids) {
            my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
            my $searcher = new Search::Searcher($engine_uri, undef, 1);
            my $rs = new Result::SLIP();

            my $solr_result;

            # Solr
            my $safe_id = Identifier::get_safe_Solr_id($id);
            my $query = qq{q=id:$safe_id&start=0&rows=0&fl=id};
            $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
            if (! $rs->http_status_ok()) {
                $solr_result = 'SOLR_HTTP';
            }
            else {
                my $num_found = $rs->get_num_found();

                if ($num_found > 1) {
                    $solr_result = 'SOLR_MULTIPLE';
                }
                elsif ($num_found == 1) {
                    $solr_result = 'SOLR_ONE';
                }
                else {
                    $solr_result = 'SOLR_ZERO';
                }
            }

            my $rights_result;
            
            # Rights
            my ($statement, $sth);
            my $ref_to_arr_of_hashref;
            eval {
                $statement = "SELECT * FROM ht.slip_rights WHERE nid='$id'";
                $sth = DbUtils::prep_n_execute($DBH, $statement);
                $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});
            };
            if ($@) {
                $rights_result = 'RIGHTS_DB';
            }
            else {
                if ($ref_to_arr_of_hashref->[0]->{nid}) {
                    $rights_result = 'RIGHTS_ONE';
                }
                else {
                    $rights_result = 'RIGHTS_ZERO';
                }
            }

            print "$id solr=$solr_result rights=$rights_result\n";
        }
    }
}


if ($ID) {
    test_ids($ID);
}
elsif ($ID_FILENAME) {
    test_ids();
}
else {
    print tis_get_usage();
}


exit 0;

            
