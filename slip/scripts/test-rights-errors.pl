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

use Search::Searcher;
use Search::Query;
use Search::Result::SLIP_Raw;

use IO::Handle;
autoflush STDOUT 1;

our ($opt_r, $opt_R, $opt_I, $opt_E);

my $ops = getopts('r:I:R:E');

my $RUN = $opt_r;
if (! defined $RUN) {
    print trv_get_usage();
    exit 1;
}

my $ENQUEUE = defined($opt_E);
                      
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

sub trv_get_usage {
    return qq{Usage: test-rights-errors.pl -r run [-I id] [-R <resume_offset>]\n\tchecks for id(s) consistency in Solr vs. ht.rights_current vs. ht.slip_rights and writes list to stdout.\n};
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
        print "$start_offset.";
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
sub get_solr_attr {
    my $nid = shift;

    use constant MYTIMEOUT => 600; # 10 minutes 

    my $safe_id = Identifier::get_safe_Solr_id($nid);
    my $query = qq{q=id:$safe_id&fl=rights};

    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $searcher = new Search::Searcher($engine_uri, MYTIMEOUT, 1);
    my $rs = new Search::Result::SLIP_Raw;

    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
    unless ($rs->http_status_ok()) {
        my $status = $rs->get_status_line;
        print "Solr HTTP error: $status\n";
        return 0;
    }

    my $result_docs_arr_ref = $rs->get_result_docs();

    my $result_doc = $result_docs_arr_ref->[0];
    $result_doc = '' unless ($result_doc);

    my ($solr_attr) = ($result_doc =~ m,<int name="rights">(.*?)</int>,);
    $solr_attr = '' unless ($solr_attr);

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
    print "\nget_rights_current FAIL for $nid: $@" if ($@);

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
    print "\nget_slip_rights FAIL at $offset: $@" if ($@);

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
    print "\nget_one_slip_rights FAIL for $nid: $@" if ($@);

    return $ref_to_arr_of_hash_ref;
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
        my $slip_attr    = $hashref->{attr};
        my $slip_profile = $hashref->{access_profile};

        # rights_current
        my $rights_hashref = get_rights_current($nid);

        my $rights_attr    = $rights_hashref->{attr};
        my $rights_profile = $rights_hashref->{access_profile};

        # solr
        my $solr_attr = get_solr_attr($nid);

        if (
            ($slip_attr ne $rights_attr)
            ||
            ($slip_attr ne $solr_attr)
            ||
            ($solr_attr ne $rights_attr)
           ) {
            $error = qq{ solr_attr=$solr_attr slip_attr=$slip_attr rights_attr=$rights_attr};
        }

        if ($slip_profile ne $rights_profile) {
            $error .= qq{ slip_profile=$slip_profile rights_profile=$rights_profile};
        }

        if ($error) {
            if ($ENQUEUE) {
                `echo 'y' | $ENV{SDRROOT}/slip/index/enqueuer-j -r11 -I $nid`;
            }
            $error .= ($ENQUEUE ? " enqueued" : "");       
            Log_consistency_error($C, "$nid $error");
            print qq{\n$nid FAIL $error\n};
        }
    }

    return scalar @$ref_to_arr_of_hash_ref;
}

