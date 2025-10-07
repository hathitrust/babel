package vSolr;


=head1 NAME

vSolr

=head1 DESCRIPTION

Module providing a MySQL-like interface to VuFind Solr specifically to
retrieve IDs based on a timestamp.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

# App
use Debug::DUtils;
use Context;
use MdpConfig;
use Search::Constants;
use Search::Result::vSolr;
use SLIP_Utils::Log;

# Local
use Db;
use SLIP_Utils::Common;
use SLIP_Utils::Solr;


# ---------------------------------------------------------------------

=item get_item_updated_nid_slice_as_of

Get a slice of records from VuFind, parse out all the barcodes from
the ht_id_display field that are newer or equal to the last
update_time recorded in slip_vsolr_timestamp. It must be >= because
on a full rebuild we start at 0000000. Strictly > 00000000 would mean
we'd skip all of those. During an incremental we query for 2 days
earlier than the MAX(update_time) of the last run. This overlap allows
up to pick up records that culd have been added in the same day as our
last run but *after* we ran that day. The inevitable duplication of
some barcodes is handled downstream.

=cut

# ---------------------------------------------------------------------
sub get_item_updated_nid_slice_as_of {
    my ($C, $dbh, $query_timestamp, $offset, $slice_size) = @_;
    
    my $anomalies = 0;
    my $searcher = SLIP_Utils::Solr::create_VuFind_Solr_Searcher_by_alias($C);
    
    my $rs = new Result::vSolr();
    my $query = qq{q=ht_id_update:[$query_timestamp TO *]&start=$offset&rows=$slice_size&fl=ht_id_display,id };
    
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
    
    die qq{HTTP response code=} . $rs->get_response_code()
        if (! $rs->http_status_ok());
    
    my @arr_of_processed_hashref;
    
    my $ref_to_arr_of_hashref = $rs->get_complete_result();
    foreach my $hash_ref (@$ref_to_arr_of_hashref) {
        # hash_ref contains: 
        # 'sysid', 'id', 'namespace', 'ht_id_display_timestamp', 'node_content'
        my $sysid = $hash_ref->{'sysid'};
        my $timestamp_of_nid = $hash_ref->{'ht_id_display_timestamp'};

        my ($rights_hashref, $anomaly) = (undef, 0);
        my $want_this_nid = 0;
        
        # Want only nids that are newer or equal to timestamp.
        if ($timestamp_of_nid >= $query_timestamp) {
            ($rights_hashref, $anomaly) = 
              process_nid_from_Solr_query_result($C, $dbh, $hash_ref);
            $want_this_nid = 1;
        }        
    
        if ($want_this_nid) {
            if (! $anomaly) {
                # Supplement rights_current database row hashref with
                # vSolr query data
                $rights_hashref->{'sysid'} = $sysid;
                $rights_hashref->{'timestamp_of_nid'} = $timestamp_of_nid;

                push(@arr_of_processed_hashref, $rights_hashref);
            }
        }

        $anomalies += 1 if ($anomaly);
    }
    
    my $bib_record_ct = $rs->get_doc_node_count();
    
    return (\@arr_of_processed_hashref, $bib_record_ct, $anomalies);
}

# ---------------------------------------------------------------------

=item process_nid_from_Solr_query_result

The input is an nid from a vSolr bib record that is a candidate for
insertion into slip_rights.

The return is an nid to insert into slip_rights validated vs. rights_current

=cut

# ---------------------------------------------------------------------
sub process_nid_from_Solr_query_result {
    my ($C, $dbh, $hash_ref) = @_;    
    
    my $anomaly = 0;
    
    my $sysid = $hash_ref->{'sysid'};        
    my $id = $hash_ref->{'id'};
    my $namespace = $hash_ref->{'namespace'};
    my $nid = $namespace . '.' . $id;
    my $timestamp_of_nid = $hash_ref->{'ht_id_display_timestamp'};

    my $s1 = qq{Item-level vSolr nid=$nid timestamp_of_nid=$timestamp_of_nid sysid=$sysid };
    DEBUG('vsolr', qq{DEBUG: $s1} . Utils::Time::iso_Time());
    
    # ANOMALY is an nid in a bib record with no corresponding row in
    # rights_current.
    my $row_hashref = Db::Select_latest_rights_row($C, $dbh, $namespace, $id);
    if (rights_database_anomaly($C, $dbh, $row_hashref, $hash_ref)) {
        $anomaly = 1;
    }

    return ($row_hashref, $anomaly);
}

# ---------------------------------------------------------------------

=item rights_database_anomaly

Description

=cut

# ---------------------------------------------------------------------
sub rights_database_anomaly {
    my ($C, $dbh, $row_hashref, $hash_ref) = @_;
    
    if (! $row_hashref) {
        my $node_content = $hash_ref->{'node_content'};
        my $sysid = $hash_ref->{'sysid'};        
        my $id = $hash_ref->{'id'};
        my $namespace = $hash_ref->{'namespace'};
        my $nid = $namespace . '.' . $id;
        my $nid_timestamp = $hash_ref->{'ht_id_display_timestamp'};

        my $s2 = qq{vSolr ANOMALY: nid=$nid sysid=$sysid node_content="$node_content" nid_timestamp=$nid_timestamp };
        DEBUG('me', qq{DEBUG: $s2} . Utils::Time::iso_Time());
        SLIP_Utils::Log::this_string($C, $s2, 'bad_rights_logfile', '___RUN___', 'rights');
        
        return 1;
    }

    return 0;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
