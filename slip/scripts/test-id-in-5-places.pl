#!/usr/bin/env perl

use strict;
use warnings;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;


# Perl
use Getopt::Std;
use File::Pairtree;

# App
use Context;
use Utils;
use Debug::DUtils;

use Context;
use MdpConfig;
use Identifier;
use Password;

use SLIP_Utils::Common;
use SLIP_Utils::States;
use SLIP_Utils::DatabaseWrapper;

use Search::Searcher;
use Search::Query;
use Search::Result::SLIP_Raw;


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

# Database connection
my $DBH = SLIP_Utils::DatabaseWrapper::GetDatabaseConnection($C, 'test-id-in-5-places.pl');

sub tis_get_usage {
    return qq{Usage: test-id-in-5-places.pl -r run {-F file | -I id} \nchecks for id(s) existence by querying -r run solr, repository, catalog, slip_rights and rights_current.\n};
}

sub load_ids_from_file {
    my $filename = shift;

    my $arr;
    my $ok;
    eval {
        $ok = open(IDS, "<$filename");
    };
    if ($@) {
        print STDERR qq{i/o ERROR:($@) opening file="$filename"\n};
        exit 1;
    }

    if (! $ok) {
        print STDERR qq{could not open file="$filename"\n};
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

            my $path_result;
            
            my ($namespace, $barcode) = Identifier::split_id($id);
            my $root = q{/sdr1/obj/} . $namespace . q{/pairtree_root};

            $File::Pairtree::root = $root;
            my $path = File::Pairtree::id2ppath($barcode) . File::Pairtree::s2ppchars($barcode);
            if (-e $path) {
                $path_result = 'ONE ';
            }
            else {
                $path_result = 'ZERO';
            }

            my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
            my $searcher = new Search::Searcher($engine_uri, undef, 1);
            my $rs = new Search::Result::SLIP_Raw;

            my $solr_result;
            my $solr_attr = -3;
            
            # Solr
            my $safe_id = Identifier::get_safe_Solr_id($id);
            my $query = qq{q=id:$safe_id&fl=rights};
            $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
            if (! $rs->http_status_ok()) {
                $solr_result = 'ERRO';
            }
            else {
                my $num_found = $rs->get_num_found();
                my $result_docs_arr_ref = $rs->get_result_docs();
                my $result_doc = $result_docs_arr_ref->[0];
                $result_doc = '' unless ($result_doc);
                ($solr_attr) = ($result_doc =~ m,<int name="rights">(.*?)</int>,);
                $solr_attr = '-3' unless ($solr_attr);

                if ($num_found > 1) {
                    $solr_result = 'MULT';
                }
                elsif ($num_found == 1) {
                    $solr_result = 'ONE ';
                }
                else {
                    $solr_result = 'ZERO';
                }
            }

            my ($statement, $sth);
            my $ref_to_arr_of_hashref;
            
            # slip_rights
            my $slip_rights_result;
            my $slip_attr = -1;
            eval {
                $statement = "SELECT attr FROM ht.slip_rights WHERE nid='$id'";
                $sth = DbUtils::prep_n_execute($DBH, $statement);
                $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});
            };
            if ($@) {
                $slip_rights_result = 'ERRO';
            }
            else {
                my $attr = $ref_to_arr_of_hashref->[0]->{attr};
                if ($attr) {
                    $slip_rights_result = 'ONE ';
                    $slip_attr = $attr;
                }
                else {
                    $slip_rights_result = 'ZERO';
                }
            }

            # rights_current
            my $rights_result;
            my $rights_attr = -2;

            eval {
                $statement = "SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'";
                $sth = DbUtils::prep_n_execute($DBH, $statement);
                $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});
            };
            if ($@) {
                $rights_result = 'ERRO';
            }
            else {
                my $attr = $ref_to_arr_of_hashref->[0]->{attr};
                if ($attr) {
                    $rights_result = 'ONE ';
                    $rights_attr = $attr;
                }
                else {
                    $rights_result = 'ZERO';
                }
            }

            my $url = "http://solr-sdr-catalog:9033/catalog/select/?q=ht_id:$safe_id&start=0&rows=0";
            my $result = `curl --silent '$url'`;
            my ($catalog_result) = ($result =~ m,numFound="(.*?)",);
            $catalog_result = $catalog_result ? 'ONE' : 'ZERO';
            
            printf("%-20s solr=%s slip=%s rights=%s (solr=%2d slip=%2d rights=%2d) repo=%s catalog=%s\n", 
                   $id, $solr_result, $slip_rights_result, $rights_result, $solr_attr, $slip_attr, $rights_attr, $path_result, $catalog_result);
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

            
