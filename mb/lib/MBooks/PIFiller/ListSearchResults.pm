package MBooks::PIFiller::ListSearchResults;

=head1 NAME

MBooks::PIFiller::ListSearchResults (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_LIST_COLLS action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

# Perl Modules
use Data::Page;

# MDP Modules
use PIFiller;
use base qw(PIFiller);

use Utils;
use Utils::XSLT;
use Search::Constants;
use MBooks::Index;
use MBooks::Utils::Sort;
use MBooks::PIFiller::ListUtils;
use MBooks::PIFiller::Survey;

use MBooks::Utils::ResultsCache;

use Namespaces;

use utf8;

BEGIN {
    require "PIFiller/Common/Group_HEADER.pm";
    require "PIFiller/Common/COLLECTIONS_OWNED_JS.pm";
}

# ---------------------------------------------------------------------

=item handle_SEARCH_RESULTS_PI

PI Handler for the

=cut

# ---------------------------------------------------------------------
sub handle_SEARCH_RESULTS_PI
    : PI_handler(SEARCH_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');

    my $solr_error_msg = $act->get_transient_facade_member_data($C, 'solr_error');

    # array of hashrefs of metadata with same fields as list items but
    # also with relevance score
    my $results_ref = $act->get_transient_facade_member_data($C, 'result_set_final_data');

    my $query_time = $act->get_transient_facade_member_data($C, 'query_time');

    my $coll_has_items = $act->get_transient_facade_member_data($C, 'coll_has_items');
    my $coll_empty = ($coll_has_items ? 'FALSE' : 'TRUE');

    my $output;
    $output .= wrap_string_in_tag($query_time, 'QueryTime');
    $output .= wrap_string_in_tag($solr_error_msg, 'SolrError');
    $output .= wrap_string_in_tag($coll_empty, 'CollEmpty');

    # Is the query a well-formed-formula (WFF)?
    my $search_result_data_hashref = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();


    my $wff_hashref = $search_result_data_hashref->{'well_formed'};
    my $well_formed = $wff_hashref->{'all'};
    $output .= wrap_string_in_tag($well_formed, 'WellFormed');
    $output .= wrap_string_in_tag($wff_hashref->{'processed_query_string'}, 'ProcessedQueryString');

    foreach my $item_hashref (@$results_ref) {
        my $s = '';

        my $display_title = $$item_hashref{'display_title'};
        $s .= wrap_string_in_tag($display_title, 'Title');

        my $author = $$item_hashref{'author'};
        $s .= wrap_string_in_tag($author, 'Author');

        # change date to just 4 digit year
        my $date = $$item_hashref{'date'};
        $date =~s,(\d\d\d\d)\-\d+\-\d+,$1,;
        $s .= wrap_string_in_tag($date, 'Date');

        $s .= wrap_string_in_tag($$item_hashref{'extern_item_id'}, 'ItemID');
        $s .= wrap_string_in_tag($$item_hashref{'rights'}, 'rights');
        $s .= wrap_string_in_tag($$item_hashref{'fulltext'}, 'fulltext');
        $s .= wrap_string_in_tag($$item_hashref{'emergency_flag'}, 'emergency');
        $s .= wrap_string_in_tag( $$item_hashref{'activated_role'},'activated_role' )
            if ( $$item_hashref{'activated_role'} );
        $s .= wrap_string_in_tag($$item_hashref{'rel'}, 'relevance');
        $s .= wrap_string_in_tag($$item_hashref{'record_no'}, 'record');
        $s .= wrap_string_in_tag($$item_hashref{'book_id'}, 'bookID');

        my $coll_ary_ref = $item_hashref->{'item_in_collections'};
        my $colls;

        foreach my $hashref (@$coll_ary_ref) {
            my $c;
            $c .= wrap_string_in_tag($hashref->{'collname'}, 'CollectionName');
            $c .= wrap_string_in_tag($hashref->{'MColl_ID'}, 'CollID');
            $c .= wrap_string_in_tag($hashref->{'href'}, 'CollHref');
            # wrap each set of coll info in a tag
            my $coll = wrap_string_in_tag($c, 'Collection');
            $colls .= $coll
        }
        $s .= wrap_string_in_tag($colls, 'Collections');

        # Link to Pageturner
        my $extern_id = $$item_hashref{'extern_item_id'};
        # pt searchhref
        $s .= wrap_string_in_tag(MBooks::PIFiller::ListUtils::PT_HREF_helper($C, $extern_id, 'pt_search'), 
                                 'PtSearchHref');
        # Unicorn pt href with query
        $s .= wrap_string_in_tag(MBooks::PIFiller::ListUtils::PT_HREF_helper($C, $extern_id, 'pt'), 
                                 'PtHref');

        $output .= wrap_string_in_tag($s, 'Item');
    }

    return $output;
}


# ---------------------------------------------------------------------

=item handle_QUERY_STRING

Description

=cut

# ---------------------------------------------------------------------
sub handle_QUERY_STRING
    : PI_handler(QUERY_STRING)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $query_string = $cgi->param('q1');

    return $query_string;
}


# ---------------------------------------------------------------------

=item handle_REL_SORT_HREF_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_REL_SORT_HREF_PI
    : PI_handler(REL_SORT_HREF)
{
    my ($C, $act, $piParamHashRef) = @_;
    return MBooks::PIFiller::ListUtils::get_sorting_href($C, 'rel')
}

#XXX this will convert "&" to "&amp;" and > and < to &gt; and &lt;
# The load programs should never put naked "&" in the data but the marc loader was missing the normalization
# XXX check to make sure that the additem code (from pageturner) and the marc loader use the same normalization!

sub normalize_string
{
    my $string = shift;
    # $string =~s/\&\s/\&amp\; /g;
    # $string =~s/\>/\&gt\; /g;
    # $string =~s/\</\&lt\; /g;

    $string =~ s/&([^;]+);/ENTITY:$1:ENTITY/gis;
    $string =~ s,&,&amp;,g;
    $string =~ s/ENTITY:([a-z0-9]+):ENTITY/&$1;/gis;

    return $string;

}


1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan,tburtonw@umich.edu

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
