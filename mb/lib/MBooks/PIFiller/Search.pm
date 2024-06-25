package MBooks::PIFiller::Search;

=head1 NAME

MBooks::PIFiller::Search (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_SEARCH action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use PIFiller;
use base qw(PIFiller);
use MBooks::Index;

use MBooks::Utils::ResultsCache;

# ---------------------------------------------------------------------

=item handle_OPERATION_RESULTS_PI

OPERATION_RESULTS for Search Phase I is a flag to test in the
javascript response handler.  If we got this far without assertion
failures, we should be good.  

=cut

# ---------------------------------------------------------------------
sub handle_OPERATION_RESULTS_PI
    : PI_handler(OPERATION_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    # How did search?
    my $search_result_data_hashref = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();

    my $rs = $$search_result_data_hashref{'result_object'};

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $query = $cgi->param('q1');

    my $temp_cgi = new CGI('');
    $temp_cgi->param('a', 'listsrch');
    $temp_cgi->param('c', $cgi->param('c'));
    $temp_cgi->param('q1', $cgi->param('q1'));
    $temp_cgi->param('sz', $cgi->param('sz'));
    $temp_cgi->param('debug', $cgi->param('debug'));
    $temp_cgi->param('facet', $cgi->multi_param('facet'));

    my $url = Utils::url_to($temp_cgi, undef, 'relative');

    my $coll_name = $act->get_persistent_facade_member_data($C, 'search_coll_name');
    
    my $s = qq{coll_name=$coll_name|coll_id=$coll_id|query=$query|url=$url};

    my $num_found = 0;
    if ($rs->http_status_ok()) {
        $s .= qq{|result=SEARCH_OK};
        $num_found = $rs->get_total_hits();
        
        # check to see if all indexed
        my $all_indexed = "FALSE";
        my $ix = new MBooks::Index;
        my ($solr_all_indexed, $item_status_hashref) = 
          $ix->get_coll_id_indexed_status($C, $coll_id);
        if ($solr_all_indexed)
        {
            $all_indexed = "TRUE";
        }
        $s .= qq{|all_indexed=$all_indexed};
        
        
        if ($all_indexed eq 'FALSE' && $num_found > 0)
        {
            # This is to prevent sending user to a search result
            # page if the only items found are items that have
            # been deleted but the deletions are not reflected in
            # the index check that at least one item in results is
            # still in collection if no items in resulst are in
            # the collection, then set num_found to 0!
            my $id_arr_ref = $rs->get_result_ids();
            if (! $co->one_or_more_items_in_coll($coll_id,$id_arr_ref))
            {
                #none of the results are in the collection so set num found to 0
                $num_found = 0;
            }
        }
        $s .= qq{|num_found=$num_found};
    }
    else
    {
        $s .= qq{|num_found=$num_found|result=SEARCH_FAILED};
        
        my $response_code = $rs->get_response_code();
        if (defined( $response_code))
        {
            $s .= qq{|Solr_http_response=$response_code};
        }                
    }
    
    return $s;
}



# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHORS

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Farber, University of Michigan, pfarber@umich.edu

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
