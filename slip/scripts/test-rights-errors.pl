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
use Search::Result::SLIP_Raw;
;

our ($opt_r, $opt_I);

my $ops = getopts('r:I:');

my $RUN = $opt_r;
if (! defined $RUN) {
    print trv_get_usage();
    exit 1;
}

my $ID = $opt_I;
if (defined($opt_I)) {
    $ID = $opt_I;
}

my $C = new Context;

my $config = SLIP_Utils::Common::gen_SLIP_config($RUN);
$C->set_object('MdpConfig', $config);

my $whoami = `whoami`;
chomp($whoami);
print STDERR "Enter passwd: ";
my $passwd = Password::get_password();
print STDERR "\n";

# Database connection
my $db = new Database($whoami, $passwd, 'ht', 'mysql-sdr');
my $DBH = $db->get_DBH();
my $ROWS = 1000;

sub trv_get_usage {
    return qq{Usage: test-rights-errors.pl -r run [-I id]\n\tchecks for id(s) consistency in Solr vs. ht.rights_current and writes list to stdout.\n};
}


if ($ID) {
    test_one_id_in_Solr();
}
else {
    my $start_offset = 0;
    while ( test_ids_in_Solr($start_offset) ) {
        $start_offset += $ROWS;
        print STDERR "$start_offset.";
    }
}


exit 0;


# ---------------------------------------------------------------------
sub call_solr {
    my $query = shift;
    
    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $searcher = new Search::Searcher($engine_uri, undef, 1);
    my $rs = new Search::Result::SLIP_Raw;

    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
    unless ($rs->http_status_ok()) {
        my $status = $rs->get_status_line;
        print "Solr HTTP error: $status\n";
        return;
    }
     
    my $result_docs_arr_ref = $rs->get_result_docs();

    return $result_docs_arr_ref;
}

# ---------------------------------------------------------------------

=item test_ids_in_Solr 

Description

=cut

# ---------------------------------------------------------------------
sub test_ids_in_Solr {
    my $start = shift;

    my $query = qq{q=*:*&start=$start&rows=$ROWS&fl=id,rights};
    my $result_docs_arr_ref = call_solr($query);

    foreach my $res (@$result_docs_arr_ref) {
        my ($rights) = ($res =~ m,<int name="rights">(.*?)</int>,);
        my ($id) = ($res =~ m,<str name="id">(.*?)</str>,);
        #print STDERR "$id\n";
        
        my $attr;
        my ($namespace, $barcode) = Identifier::split_id($id);
         eval {
             my $statement = qq{SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
             my $sth = DbUtils::prep_n_execute($DBH, $statement);
             $attr = $sth->fetchrow_array;
         };
        print "\n$id FAIL $@" if ($@);

        if ($attr ne $rights) {
            print qq{\n$id FAIL [ LSS solr rights ]="$rights" [ ht.rights_current.attr ]="$attr"};
        }
    }
    
    return scalar @$result_docs_arr_ref 
}

# ---------------------------------------------------------------------

=item test_one_id_in_Solr

Description

=cut

# ---------------------------------------------------------------------
sub test_one_id_in_Solr {

    my $safe_id = Identifier::get_safe_Solr_id($ID);

    my $query = qq{q=id:$safe_id&fl=id,rights};
    my $result_docs_arr_ref = call_solr($query);
    my $result = $result_docs_arr_ref->[0];
    
    unless ($result) {
        print "\n$ID not in LSS Solr";
    }
    my ($rights) = ($result =~ m,<int name="rights">(.*?)</int>,);
    my ($id) = ($result =~ m,<str name="id">(.*?)</str>,);
        
    my $attr;
    my ($namespace, $barcode) = Identifier::split_id($ID);
    eval {
        my $statement = qq{SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $attr = $sth->fetchrow_array;
    };
    print "\n$ID $@\n" if ($@);

    $attr = 'no_attr' unless (defined $attr);
    $rights = 'no_rights' unless (defined $rights);
    
    if ($attr ne $rights) {
        print "\n$ID FAIL";
    }
    else {
        print "\n$ID OK"
    }
    print qq{ [ LSS solr rights ]="$rights" [ ht.rights_current.attr ]="$attr"\n};
}


