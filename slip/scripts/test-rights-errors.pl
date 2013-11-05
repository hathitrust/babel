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
use SLIP_Utils::DatabaseWrapper;
use SLIP_Utils::Log;
use Search::Result::SLIP_Raw;
use Search::Searcher;
use SLIP_Utils::Solr;


use IO::Handle;
autoflush STDOUT 1;

our ($opt_r, $opt_R, $opt_I, $opt_E, $opt_t, $opt_B, $opt_V);

my $ops = getopts('r:I:R:EtBV');

my $RUN = $opt_r;
if (! defined $RUN) {
    print trv_get_usage();
    exit 1;
}

my $ENQUEUE = defined($opt_E);
my $TEST_PROFILE = defined($opt_t);

my $MODE; # Optional
if (defined($opt_V)) {
    $MODE = 'serving';
}
elsif (defined($opt_B)) {
    $MODE = 'build';
}
else {
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

# Database connection
my $DBH = SLIP_Utils::DatabaseWrapper::GetDatabaseConnection($C, 'test-rights-errors.pl');

my $SLIP_RIGHTS_SLICE = 1000;

use constant MYTIMEOUT => 1200; # 20 minutes 
use constant MAX_HTTP_TRIES => 5;
use constant HTTP_SLEEP => 60;

sub trv_get_usage {
    return qq{Usage: test-rights-errors.pl -r run -B|-V [-I id] [-E] [-t] [-R <resume_offset>]\n\t checks one id (-I) or all for consistency in (B)uild or ser(V)e Solr vs. ht.rights_current vs. ht.slip_rights (including access_profile with -t). \n\t\tWrites list to stdout, logs and enqueues (-E).\n};
}


my $ref_to_arr_of_hash_ref;

if ($ID) {
    $ref_to_arr_of_hash_ref = get_one_slip_rights($ID); 

    test_ids($ref_to_arr_of_hash_ref);
}
else {
    my $start_offset = $RESUME_AT;

    while (1) {
        $ref_to_arr_of_hash_ref = get_slip_rights($start_offset); 
        last unless (scalar @$ref_to_arr_of_hash_ref);
        
        test_ids($ref_to_arr_of_hash_ref);
        
        $start_offset += $SLIP_RIGHTS_SLICE;
        __output("$start_offset.");
    }
}


exit 0;

# ---------------------------------------------------------------------
sub Log_consistency_error {
    my ($C, $s) = @_;

    my $when = Utils::Time::iso_Time();
    SLIP_Utils::Log::this_string($C, $s . " $when", 'consistency_logfile', '___RUN___', $RUN);
}

# ---------------------------------------------------------------------
sub handle_HTTP_result {
    my $rs = shift;
    
    my $tries = 0;
    while (1) {
        if ($rs->http_status_ok) {
            return 1;
        }
        else {
            $tries++;
            if ($tries > MAX_HTTP_TRIES) {
                my $status = $rs->get_status_line;
                __output("Solr HTTP error: $status\n");
                return 0;
            }
            else {
                sleep HTTP_SLEEP;
            }
        }
    }
}

# ---------------------------------------------------------------------
sub get_solr_attr {
    my $nid = shift;
    
    my $shard = Db::Select_item_id_shard($C, $DBH, $RUN, $nid);
    return 0 unless($shard);

    my $searcher = ($MODE eq 'build') 
      ? SLIP_Utils::Solr::create_shard_Searcher_by_alias($C, $shard, MYTIMEOUT)
        : SLIP_Utils::Solr::create_prod_shard_Searcher_by_alias($C, $shard, MYTIMEOUT);

    my $rs = new Search::Result::SLIP_Raw();
    my $safe_id = Identifier::get_safe_Solr_id($nid);
    my $query = qq{q=id:$safe_id&fl=rights&indent=on};

    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);

    unless ( handle_HTTP_result($rs) ) {
        return 0;
    }

    my $result_docs_arr_ref = $rs->get_result_docs();

    my $result_doc = $result_docs_arr_ref->[0];
    $result_doc = '' unless ($result_doc);

    my ($solr_attr) = ($result_doc =~ m,<int name="rights">(.*?)</int>,);
    $solr_attr = '0' unless ($solr_attr);

    return $solr_attr;
}


# ---------------------------------------------------------------------
sub get_rights_current {
    my $nid = shift;

    my $ref_to_arr_of_hash_ref = [];
    my ($namespace, $barcode) = Identifier::split_id($nid);

    eval {
        my $statement = qq{SELECT * FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $ref_to_arr_of_hash_ref = $sth->fetchall_arrayref({});
    };
    __output("\nget_rights_current FAIL for $nid: $@") if ($@);

    return $ref_to_arr_of_hash_ref->[0];
}

# ---------------------------------------------------------------------
sub get_slip_rights {
    my $offset = shift;

    my $ref_to_arr_of_hash_ref = [];

    eval {
        my $statement = qq{SELECT * FROM ht.slip_rights LIMIT $offset, $SLIP_RIGHTS_SLICE};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $ref_to_arr_of_hash_ref = $sth->fetchall_arrayref({});
    };
    __output("\nget_slip_rights FAIL at $offset: $@") if ($@);

    return $ref_to_arr_of_hash_ref;
}

# ---------------------------------------------------------------------
sub get_one_slip_rights {
    my $nid = shift;

    my $ref_to_arr_of_hash_ref = [];

    eval {
        my $statement = qq{SELECT * FROM ht.slip_rights WHERE nid='$nid'};
        my $sth = DbUtils::prep_n_execute($DBH, $statement);
        $ref_to_arr_of_hash_ref = $sth->fetchall_arrayref({});
    };
    __output("\nget_one_slip_rights FAIL for $nid: $@") if ($@);

    return $ref_to_arr_of_hash_ref;
}

# ---------------------------------------------------------------------
sub get_catalog_time {
    my $nid = shift;

    my $engine_uri = $C->get_object('MdpConfig')->get('engine_for_vSolr');
    my $searcher = new Search::Searcher($engine_uri);
    my $rs = new Search::Result::SLIP_Raw;

    my $safe_id = Identifier::get_safe_Solr_id($nid);
    my $query_string = qq{q=ht_id:$safe_id&&fl=ht_id_display};
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query_string, $rs);

    unless ( handle_HTTP_result($rs) ) {
        return 0;
    }

    my $ref = $rs->get_result_docs;
    my $result = $ref->[0];
    
    my ($catalog_time) = ($result =~ m,<str>$safe_id\|(.+?)\|.*?</str>,);

    return $catalog_time
}

# ---------------------------------------------------------------------

=item test_ids

Description

=cut

# ---------------------------------------------------------------------
sub test_ids {
    my $ref_to_arr_of_hash_ref = shift;

    foreach my $hashref (@$ref_to_arr_of_hash_ref) {
        my $error = '';

        my $nid = $hashref->{nid};

        # SLIP
        my $slip_rights_attr    = $hashref->{attr};
        my $slip_rights_profile = $hashref->{access_profile};
        my $slip_rights_time    =  $hashref->{update_time};

        # rights_current
        my $rights_hashref = get_rights_current($nid);

        my $rights_current_attr    = $rights_hashref->{attr};
        my $rights_current_profile = $rights_hashref->{access_profile};

        # solr
        my $slip_solr_attr = get_solr_attr($nid);

        if (
            ($slip_rights_attr ne $rights_current_attr)
            ||
            ($slip_rights_attr ne $slip_solr_attr)
            ||
            ($slip_solr_attr ne $rights_current_attr)
           ) {
            $error = qq{ slip_solr_attr=$slip_solr_attr slip_rights_attr=$slip_rights_attr rights_current_attr=$rights_current_attr};
        }

        # catalog
        my ($catalog_time) = get_catalog_time($nid);

        if ($TEST_PROFILE) {
            if ($slip_rights_profile ne $rights_current_profile) {
                $error .= qq{ slip_rights_profile=$slip_rights_profile rights_current_profile=$rights_current_profile};
            }
        }

        if ($error) {
            $error .= qq{ slip_solr_update $slip_rights_time catalog_time=$catalog_time};

            # Only enqueue if missing from build index not the
            # production index which is 1+ day(s) behind
            my $enqueue = $ENQUEUE && ($MODE eq 'build');
            if ($enqueue) {
                my $ref_to_arr_of_ids = [ $nid ];
                Db::handle_queue_insert($C, $DBH, $RUN, $ref_to_arr_of_ids);
                $error .= ($enqueue ? " enqueued" : "");       
            }
            Log_consistency_error($C, "$nid $error");
            __output(qq{\n$nid FAIL $error\n});
        }
    }

    return scalar @$ref_to_arr_of_hash_ref;
}

