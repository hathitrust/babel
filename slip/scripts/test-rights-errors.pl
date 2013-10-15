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
use IO::Handle;
autoflush STDOUT 1;

our ($opt_r, $opt_R, $opt_I);

my $ops = getopts('r:I:R:');

my $RUN = $opt_r;
if (! defined $RUN) {
    print trv_get_usage();
    exit 1;
}

my $ID = $opt_I;
if (defined($opt_I)) {
    $ID = $opt_I;
}

my $RESUME_AT = (defined $opt_R ? $opt_R : 0);

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
my $SLIP_RIGHTS_SLICE = 1000;

sub trv_get_usage {
    return qq{Usage: test-rights-errors.pl -r run [-I id] [-R <resume_offset>]\n\tchecks for id(s) consistency in Solr vs. ht.rights_current vs. ht.slip_rights and writes list to stdout.\n};
}


if ($ID) {
    test_one_id();
}
else {
    my $start_offset = $RESUME_AT;
    while ( test_all_ids($start_offset) ) {
        $start_offset += $SLIP_RIGHTS_SLICE;
        print "$start_offset.";
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
        return [];
    }
    
    my $result_docs_arr_ref = $rs->get_result_docs();
    
    return $result_docs_arr_ref->[0];
}

# ---------------------------------------------------------------------
sub get_rights_current_attr {
    my $nid = shift;
    
    my $attr = 0;
    my ($namespace, $barcode) = Identifier::split_id($nid);
    
    eval {
        my $statement = qq{SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $attr = $sth->fetchrow_array;
    };
    print "\n get_rights_current_attr FAIL for $nid: $@" if ($@);
    
    return $attr;
}

# ---------------------------------------------------------------------
sub get_slip_rights_attrs {
    my $offset = shift;
    
    my $ref_to_arr_of_hash_ref = [];
    
    eval {
        my $statement = qq{SELECT nid, attr FROM ht.slip_rights LIMIT $offset, $SLIP_RIGHTS_SLICE};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $ref_to_arr_of_hash_ref = $sth->fetchall_arrayref({});
    };
    print "\nget_slip_rights_attr FAIL at $offset: $@" if ($@);
    
    return $ref_to_arr_of_hash_ref;
}

# ---------------------------------------------------------------------

=item test_all_ids

Description

=cut

# ---------------------------------------------------------------------
sub test_all_ids {
    my $offset = shift;
    
    # slip_rights slice
    my $ref_to_arr_of_hash_ref = get_slip_rights_attrs($offset);
    
    foreach my $hashref (@$ref_to_arr_of_hash_ref) {
        my $nid = $hashref->{nid};
        my $slip_attr = $hashref->{attr};
        
        # rights_current
        my $rights_attr = get_rights_current_attr($nid);
        
        # solr
        my $safe_id = Identifier::get_safe_Solr_id($nid);
        my $query = qq{q=id:$safe_id&fl=rights};
        my $result_doc = call_solr($query);
        my ($solr_attr) = ($result_doc =~ m,<int name="rights">(.*?)</int>,);
        
        if (
            ($slip_attr ne $rights_attr)
            ||
            ($slip_attr ne $solr_attr)
            ||
            ($solr_attr ne $rights_attr)
           ) {
            print qq{\n$nid FAIL solr_attr=$solr_attr slip_attr=$slip_attr rights_attr=$rights_attr\n};
        }        
    }
    
    return scalar @$ref_to_arr_of_hash_ref; 
}

# ---------------------------------------------------------------------

=item test_one_id

Description

=cut

# ---------------------------------------------------------------------
sub test_one_id {
    
    my $safe_id = Identifier::get_safe_Solr_id($ID);
    
    my $query = qq{q=id:$safe_id&fl=rights};
    my $result_doc = call_solr($query) || '';
    my ($solr_attr) = ($result_doc =~ m,<int name="rights">(.*?)</int>,);    
    $solr_attr = 0 unless ($solr_attr);

    my $rights_attr;
    my ($namespace, $barcode) = Identifier::split_id($ID);
    eval {
        my $statement = qq{SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $rights_attr = $sth->fetchrow_array;
    };
    print "\nrights_current FAIL for $ID: $@\n" if ($@);
    $rights_attr = 0 unless($rights_attr);
    
    my $slip_attr;
    eval {
        my $statement = qq{SELECT attr FROM ht.slip_rights WHERE nid='$ID'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $slip_attr = $sth->fetchrow_array
    };
    print "\nslip_rights FAIL for $ID: $@" if ($@);
    $slip_attr = 0 unless($slip_attr);
    
    if (
        ($slip_attr ne $rights_attr)
        ||
        ($slip_attr ne $solr_attr)
        ||
        ($solr_attr ne $rights_attr)
       ) {
        print qq{\n$ID FAIL solr_attr=$solr_attr slip_attr=$slip_attr rights_attr=$rights_attr\n}; 
    }
}
