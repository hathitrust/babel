package MBooks::Operation::ListSearchResults;

=head1 NAME

MBooks::Operation::ListSearchResults (op)

=head1 DESCRIPTION

This class is an implementation of the abstract Operation class.  It
provides the data structures/objects needed by the PI to list search
results

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# Perl modules
use Data::Page;

# MDP Modules
use base qw(Operation);
use Collection;
use Utils;
use Debug::DUtils;

use MBooks::View;

use MBooks::Relevance;
use MBooks::Result::FullText;
use MBooks::Operation::Status;
require "MBooks/Operation/OpListUtils.pl";

use MBooks::Utils::ResultsCache;

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize MBooks::Operation::ListSearchResults.  Must call parent
initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for ListSearchResults action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="ListSearchResults"});

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $act = $self->get_action();
    ASSERT(defined($act),qq{action not defined});

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');

    #XXX this seems kludgey set $co on $C for $ix call
    $C->set_object('Collection', $co);

    my $owner = $co->get_user_id;
    my $CS = $act->get_transient_facade_member_data($C, 'collection_set_object');

    if (! $CS->exists_coll_id($coll_id))
    {
        # Note: we would like to give the user the collection name if
        # they clicked on a link to a non-existent collection, but we
        # can't get it.
        my $msg = q{Collection "} . $coll_id .  q{" does not exist. };  
        $act->set_error_record($C, $act->make_error_record($C, $msg));
        return $ST_NOT_OK;
    }
    # This assertion should never get triggered because of the logic above    
    ASSERT($CS->exists_coll_id($coll_id), qq{Collection="$coll_id" does not exist});

    # only if collection not public do we care about owner!!
    my $status = $self->test_ownership($C, $co, $act, $coll_id, $owner);
    return $status unless ($status == $ST_OK);

    my $user_query_string = $cgi->param('q1');

    if ( $co->collection_is_large($coll_id) ) {
        my $user_query_string = $cgi->param('q1');
        print $cgi->redirect("/cgi/ls?a=srchls;coll_id=$coll_id;q1=$user_query_string");
        exit;
    }

    # get collection owner for subnav header
    my $coll_owner_display = $co->get_coll_owner_display_name($coll_id);
    $act->set_transient_facade_member_data($C,'coll_owner_display', $coll_owner_display);

    # this is a reference to an array where each member is a rights
    # attribute valid for this context
    my $rights_ref = $self->get_rights($C);

    # We need to know if this is an empty collection to determine
    # whether to display search widget Also if there are 0 results, we
    # need this to display correct message
    my $count_all_items = $co->count_all_items_for_coll($coll_id);
    my $coll_has_items = ($count_all_items > 0);
    $act->set_transient_facade_member_data($C, 'coll_has_items', $coll_has_items);

    my $solr_error_msg;

    # Result object
    my $search_result_object = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();
    my $rs = defined $search_result_object ? $$search_result_object{result_object} : undef;

    # If the session expired the rs object will be undef.  Redo the
    # search by redirection.
    if (! $rs)
    {
        my $cgi = $C->get_object('CGI');
        my $temp_cgi = new CGI($cgi);
        $temp_cgi->param('a', 'srch');
        
        my $redirect_url = Utils::url_to($temp_cgi, undef, 'relative');
        MBooks::View::P_redirect_HTTP($C, $redirect_url);

        exit;
    }
    elsif (! $rs->http_status_ok())
    {
        $solr_error_msg = qq{SEARCH_FAILED};
        if (defined ($rs->{'response_code'}))
        {
            $solr_error_msg .= qq{|Solr_http_response=$rs->{'response_code'}};
        }

        $act->set_transient_facade_member_data($C, 'solr_error', $solr_error_msg);

        my $empty_pager=$self->get_empty_pager($C,$cgi);
        $act->set_transient_facade_member_data($C, 'pager', $empty_pager);

        return;
    }
    
    ######################################################################
    #
    #XXX Scripps hack skip this step for more than 40,000 results?  or 10,000?
    # do we know collid
    ######################################################################

    # Here we delete any items from the result set that are no longer
    # in the collection according to mysql Later calls to the result
    # set object will reflect this This solves the problem where an
    # item is deleted in mysql but not yet in the solar index

    # do not check for deleted ids if $count_all_items >= delete_check_max_item_ids

    my $temp_result_id_arrayref = $rs->get_result_ids();
    my @deleted_ids;

    unless ( $co->collection_is_very_large($coll_id, $count_all_items) )
    {
    	foreach my $id (@{$temp_result_id_arrayref}) {
    	    if (! $co->item_in_collection($id, $coll_id)) {
    		  push (@deleted_ids, $id);
    	    }
    	}
    	$rs->remove_result_ids_for($coll_id, \@deleted_ids) 
        	if (scalar(@deleted_ids > 0));
    }

    ######################################################################


    # get total number of records
    my $all_count = $rs ? $rs->get_total_hits() : 0;
    $act->set_transient_facade_member_data($C, 'all_count', $all_count);

    if ($all_count == 0)
    {
        # No search results so set create pager with total_entries set
        # to 0 and return No need to do the rest of the logic below
        # this since we won't display any results

        my $empty_pager = $self->get_empty_pager($C,$cgi);
        $act->set_transient_facade_member_data($C, 'pager', $empty_pager);

        return;
    }

    # get total number of full-text records and thieir ids regardless
    # of slicing
    my $result_id_arrayref = $rs->get_result_ids();
    my $full_text_count = 0;
    if (scalar(@$result_id_arrayref) > 0) {
        ## REPLACE WITH MORE ACCURATE / FASTER QUERY
        # $full_text_count = $co->count_full_text($coll_id, $rights_ref, $result_id_arrayref);
        $full_text_count = $self->count_full_text($rs, $rights_ref);
    }
    $act->set_transient_facade_member_data($C, 'full_text_count', $full_text_count);


    my $pager_count = $all_count;
    if ($cgi->param('lmt') eq 'ft') {
        $pager_count = $full_text_count;
    }

    my $pager = $self->do_paging($C, $cgi, $pager_count);
    $act->set_transient_facade_member_data($C, 'pager', $pager);

    my $final_rs_data = $self->get_final_rs_data($C, $act, $co, $rs, $rights_ref, $pager);
    $act->set_transient_facade_member_data($C, 'result_set_final_data', $final_rs_data);
    $act->set_transient_facade_member_data($C, 'query_time', $rs->get_query_time());

    # get list of collections owned by user for use in dropdown
    my $collist_hashref = $CS->get_coll_data_from_user_id($owner);
    $act->set_transient_facade_member_data($C, 'list_items_owned_collection_data', $collist_hashref);

    return $ST_OK;
}


# ---------------------------------------------------------------------
sub get_empty_pager
{
    my $self = shift;
    my $C = shift;
    my $cgi = shift;
    my $pager_count = 0;
    my $pager = $self->do_paging($C, $cgi, $pager_count);
    return $pager;
}
# ---------------------------------------------------------------------


=item get_final_rs_data

Takes full list of ids and rel scores
queries item table for metadata for appropriate sorted slice adds
other data needed for list display (item in
colleciton/fulltext|viewonly returns array of hashrefs 1 row per item


NOTES: need to investigate performance/efficiency/data
duplication/update issues re: paging/sorting in MySQL or Lucene and
how they work together and possible caching Note also possiblility of
creating temp table in mysql for Lucene result set and doing mysql ops
on it. i.e. create a temp collection consisting of the result set with
the additional colum of rel scores.  Then all paging/sorting can use
regular listitems mysql operations

=cut

# ---------------------------------------------------------------------
sub get_final_rs_data
{
    my $self = shift;
    my ($C, $act, $co, $rs, $rights_ref, $pager) = @_;

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $ab = $C->get_object('Bind');

    # below we don't map because we want raw rel_a or rel_d for all
    # non-relevance sorts get_item_data gets its own sortkey from the
    # cgi object and does the mapping and sorting.
    my $sortkey = $cgi->param('sort');

    # Result data: $result list is an array of ids sorted by relevance
    # $result_scores_hashref key=id, value=relevance score
    my $result_id_arrayref = $rs->get_result_ids();
    my $result_scores_hashref = $rs->get_result_scores();
    my $temp_rs_data = [];

    my @sorted;

    if ($sortkey eq 'rel_a'|| $sortkey eq 'rel_d')
    {
        # get item metadata for each id add relevance scores to
        # metadata

        # XXX Currently 1 database access per id through the $co
        # object Alternative is to redo $co->get_metadata_for_item_ids
        # to return a hash of hashrefs with the key = item_id This
        # means only one database access

        # handle limit to full-text need to get an array containing
        # only full-text items before paging
        my $limit = $cgi->param('lmt');

        if ($limit eq 'ft')
        {
            # get list of ids containing full-text. These are not sorted by relevance!
            my $temp_aryref = $co->get_full_text_ids($result_id_arrayref, $rights_ref);
            #set total items pager to current number
            $pager->total_entries(scalar(@{$temp_aryref}));

            # sort only the full-text entries by relevance score and put back in $result_id_arrayref
            $result_id_arrayref = [];
            if ($sortkey eq 'rel_a') {
                @sorted = sort {$result_scores_hashref->{$a} <=> $result_scores_hashref->{$b} } @{$temp_aryref};
            }
            else {
                @sorted = sort {$result_scores_hashref->{$b} <=> $result_scores_hashref->{$a} } @{$temp_aryref};
            }
            $result_id_arrayref = \@sorted;
        }
        elsif ($sortkey eq 'rel_a')
        {
            #reverse the entire already sorted $result_id_arrayref
            my @descendingRel = reverse(@{$result_id_arrayref});
            $result_id_arrayref=\@descendingRel;
        }

        # get page worth of $ids
        my $first_item = $pager->first;
        $first_item = $first_item -1;
        my $last_item = $pager->last;
        $last_item = $last_item -1;

        my @ids_on_page = @{$result_id_arrayref}[$first_item .. $last_item];
        ASSERT(scalar(@ids_on_page) > 0, qq{ problem with @ids_on_page});

        my $norm_rel_hashref
            = MBooks::Relevance::get_normalized_relevance($rs, \@ids_on_page, 'absolute');

        my $metadata_arr_ref = $co->get_metadata_for_item_ids(\@ids_on_page);
        foreach my $metadata_hashref ( @$metadata_arr_ref ) {
            $metadata_hashref->{'rel'} = $norm_rel_hashref->{'extern_item_id'};
            push(@$temp_rs_data, $metadata_hashref);
        }
    }
    else
    {
        my $id_arr_ref = $result_id_arrayref;
        # OpListUtils::get_item_data handles limit to full text, paging, and sorting
        # OpListUtils is required by ListSearchResults so thats why the call to self

        $temp_rs_data = $self->get_item_data($C, $rights_ref, $pager, $id_arr_ref);

        foreach my $hashref (@$temp_rs_data) {
            my $id = $hashref->{'extern_item_id'};
            my $norm_rel_hashref = MBooks::Relevance::get_normalized_relevance($rs, [$id], 'absolute');
            $hashref->{'rel'} = $norm_rel_hashref->{$id};
        }
    }

    # we now have array of hashes with itme metadata including rel
    # score, but need to add more stuff. add "full-text/view_only and
    # list of collections owned by user that item is in this method in
    # OpListUtils.pl
    my $final_rs_data = $self->get_final_item_arr_ref($C, $temp_rs_data, $rights_ref);

    # return some array of hashes with item metadata as well as id and
    # rel rank containing id elements
    return $final_rs_data;
}

sub count_full_text {
    my ( $self, $rs, $rights_ref ) = @_;
    my $full_text_count = 0;
    my $rights_hash = $rs->get_result_rights;
    my $rights_map = { map { $_ => 1 } @$rights_ref };
    foreach my $id ( keys %$rights_hash ) {
        $full_text_count += 1 if ( $$rights_map{$$rights_hash{$id}} );
    }
    return $full_text_count;
}


# ---------------------------------------------------------------------
1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut

