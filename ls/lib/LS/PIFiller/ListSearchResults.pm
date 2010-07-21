package LS::PIFiller::ListSearchResults;

=head1 NAME

LS::PIFiller::ListSearchResults (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_LIST_LS_SEARCH_RESULTS action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

# Perl Modules
use Data::Page;

# MDP Modules
use base qw(PIFiller);
use Utils;
use LS::Utils;

BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "LS/PIFiller/Globals.pm";
    require "PIFiller/ListUtils.pl"; 
}


#======================================================================
#
#                        P I    H a n d l e r s
#
#======================================================================

# ---------------------------------------------------------------------

=item handle_PAGING_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_PAGING_PI
    : PI_handler(PAGING)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $pager = $act->get_transient_facade_member_data($C, 'pager');
    ASSERT(defined($pager), qq{pager not defined});

    my $cgi = $C->get_object('CGI');
    my $current_page = $cgi->param('pn');
    my $current_sz = $cgi->param('sz');

    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('a', 'srchls');

    my $num_records = $pager->total_entries;

    # spit out links for each page with the page range i.e href to
    # page2 label 11-20
    my $pagelinks = '';
    my $start_pagelinks = "None";
    my $middle_pagelinks = "None";
    my $end_pagelinks = "None";
    my $start;
    my $end;

    # Set this so page links fit on one line
    my $MAX_PAGE_LINKS = 8;
    my $NUM_END_LINKS = 2 ;

    if ($pager->last_page <= $MAX_PAGE_LINKS)
    {
        # if there aren't too many just spit out all the page links
        $start = 1;
        $end = $pager->last_page;
        $pagelinks =
            get_pagelinks($start, $end,
                          $pager, $temp_cgi, $current_page);
    }
    else
    {
        my ($end_links_start, $end_links_end);

        if ($current_page < $pager->last_page - ($MAX_PAGE_LINKS - 1))
        {
            $start = $current_page;
            $end = $current_page + (($MAX_PAGE_LINKS - $NUM_END_LINKS) - 1);
            $end_links_start = $pager->last_page - ($NUM_END_LINKS - 1);
            $end_links_end = $pager->last_page;
            $start_pagelinks =
                get_pagelinks($start, $end,
                              $pager, $temp_cgi, $current_page);
        }
        else
        {
            # just output last $MAX_PAGE_LINKS links
            $start_pagelinks = "Some";
            $end_links_start = $pager->last_page - (($MAX_PAGE_LINKS) - 1);
            $end_links_end = $pager->last_page;
            # reset pager
            $pager->current_page($current_page);
        }
        $end_pagelinks =
            get_pagelinks($end_links_start, $end_links_end,
                          $pager, $temp_cgi, $current_page);
    }

    # Make links for current page, next page, and previous page

    # reset pager to correct current page
    $pager->current_page($current_page);

    my $current_page_href = make_item_page_href($pager->current_page, $temp_cgi);

    my $previous_page_href;
    my $previous_page;
    my $previous_page_number = $pager->previous_page;

    if (defined ($previous_page_number))
    {
        # set pager current page to previous_page_number so that
        # $pager->first gives correct first record number for that
        # page
        $pager->current_page($previous_page_number);
        $previous_page_href = make_item_page_href($pager->current_page, $temp_cgi);
        $previous_page = wrap_string_in_tag($previous_page_href, 'Href');
    }
    else
    {
        $previous_page = "None";
    }

    # reset pager to correct current page
    $pager->current_page($current_page);

    my $next_page_href;
    my $next_page;
    my $next_page_number = $pager->next_page;

    if (defined ($next_page_number))
    {
        # set pager current page to next_page_number
        $pager->current_page($next_page_number);
        $next_page_href = make_item_page_href($pager->current_page, $temp_cgi);
        $next_page = wrap_string_in_tag($next_page_href, 'Href');
    }
    else
    {
        $next_page =  'None';
    }

    # Wrap output in XML
    my $s = '';
    $s .= wrap_string_in_tag($pagelinks, 'PageLinks');
    $s .= wrap_string_in_tag($current_page_href, 'CurrentPageHref');
    $s .= wrap_string_in_tag($previous_page, 'PrevPage');
    $s .= wrap_string_in_tag($next_page, 'NextPage');
    $s .= wrap_string_in_tag($start_pagelinks, 'StartPageLinks');
    $s .= wrap_string_in_tag($middle_pagelinks, 'MiddlePageLinks');
    $s .= wrap_string_in_tag($end_pagelinks, 'EndPageLinks');

    $s .= wrap_string_in_tag($pager->last_page, 'TotalPages');
    $s .= wrap_string_in_tag($pager->entries_on_this_page, 'NumRecsOnThisPage');
    $s .= wrap_string_in_tag($pager->entries_per_page, 'RecsPerPage');
    $s .= wrap_string_in_tag($pager->first, 'FirstRecordNumber');
    $s .= wrap_string_in_tag($pager->last, 'LastRecordNumber');
    # Following will be affected by any limit!
    $s .= wrap_string_in_tag($pager->total_entries, 'TotalRecords');

    my $config = $C->get_object('MdpConfig');
    my $default_recs_per_page = $config->get('default_records_per_page');
    my $current_value = $default_recs_per_page;

    if (defined ($current_sz))
    {
        $current_value = $current_sz
    }

    my @values = $config->get('slice_sizes');
    $s .= wrap_string_in_tag(make_slice_size_widget($current_value, \@values), 'SliceSizeWidget');

    return $s;
}


# ---------------------------------------------------------------------

=item handle_OPERATION_RESULTS_PI

Description

=cut


# ---------------------------------------------------------------------
sub handle_OPERATION_RESULTS_PI
    : PI_handler(OPERATION_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');

    my $coll_name = $config->get('ls_coll_name');
    my $coll_href = $config->get('hathitrust_link');

    my $s;

    $s .= wrap_string_in_tag($coll_name, 'CollName');
    $s .= wrap_string_in_tag($coll_href, 'CollHref');

    return $s;
}


# ---------------------------------------------------------------------

=item handle_LIMIT_TO_FULL_TEXT_PI

Description

=cut

# ---------------------------------------------------------------------
sub  handle_LIMIT_TO_FULL_TEXT_PI
    : PI_handler(LIMIT_TO_FULL_TEXT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $temp_cgi = new CGI($cgi);
    my $limit_text = "";

    my $num_full_text = $act->get_transient_facade_member_data($C, 'full_text_count');
    my $num_all = $act->get_transient_facade_member_data($C, 'all_count');
    my $is_limit_on = ($cgi->param('lmt') eq 'ft') ? 'YES' : 'NO';

    if ($is_limit_on eq 'NO')
    {
        $temp_cgi->delete('pn');
    }
        
    $temp_cgi->param('lmt', 'ft');
    my $full_text_href = $temp_cgi->self_url();

    $temp_cgi->param('lmt', 'all');
    my $all_href = $temp_cgi->self_url();

    my $s;
    $s .= wrap_string_in_tag($is_limit_on, 'Limit');
    $s .= wrap_string_in_tag($all_href, 'AllHref');
    $s .= wrap_string_in_tag($full_text_href, 'FullTextHref');
    $s .= wrap_string_in_tag($num_full_text, 'FullTextCount');
    $s .= wrap_string_in_tag($num_all, 'AllItemsCount');

    return $s;
}


# ---------------------------------------------------------------------

=item handle_SEARCH_RESULTS_PI

PI Handler for the Solr response. Typically:

<doc>
  <float name="score">0.120934345</float>
  <str name="author">Fox, Michael W., by M.W. Fox. With a foreword by J.P. Scott. 1937-</str>
  <str name="id">mdp.39015004362094</str>
  <int name="rights">2</int>
  <str name="title">Canine behavior; a history of domestication...</str>
</doc>

=cut

# ---------------------------------------------------------------------
sub handle_SEARCH_RESULTS_PI
    : PI_handler(SEARCH_RESULTS) {
    my ($C, $act, $piParamHashRef) = @_;

    my $output;
    my ($query_time, $solr_error_msg);

    my $rs_hash_ref = LS::Utils::get_result_object_pair($C, $act);
    my $primary_rs = $rs_hash_ref->{'primary'};
    my $secondary_rs = $rs_hash_ref->{'secondary'};

    # Was there a search?
    my $search_result_data_hashref =
        $act->get_transient_facade_member_data($C, 'search_result_data');
    if ($search_result_data_hashref->{'undefined_query_string'}) {
        $query_time = 0;
        $solr_error_msg = '';
    }
    else {
        $query_time = $primary_rs->get_query_time() + $secondary_rs->get_query_time();
        $solr_error_msg = $act->get_transient_facade_member_data($C, 'solr_error');

        my $result_ref = wrap_result_data($C, $primary_rs);
        $output .= $$result_ref;
    }

    $output .= wrap_string_in_tag($query_time, 'QueryTime');
    $output .= wrap_string_in_tag($solr_error_msg, 'SolrError');

    # Is the query a well-formed-formula (WFF)?
    my $wff_hashref = $search_result_data_hashref->{'well_formed'};
    my $well_formed = ($wff_hashref->{'ft'} && $wff_hashref->{'all'});
    $output .= wrap_string_in_tag($well_formed, 'WellFormed');
    $output .= wrap_string_in_tag($wff_hashref->{'processed_query_string'}, 'ProcessedQueryString');

    return $output;
}


# ---------------------------------------------------------------------

=item handle_QUERY_STRING_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_QUERY_STRING_PI
    : PI_handler(QUERY_STRING)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $query_string = $cgi->param('q1');

    return $query_string;
}


#======================================================================
#
#              P I    H a n d l e r   H e l p e r s
#
#======================================================================

# ---------------------------------------------------------------------

=item get_pagelinks

Description

=cut

# ---------------------------------------------------------------------
sub get_pagelinks
{
    my $start = shift;
    my $end = shift;
    my ($pager_in, $cgi, $current_page) = @_;

    my $temp_cgi = new CGI($cgi);

    # Instantiate new pager so we don't mess with member data of the
    # global pager we got passed in
    my $pager = Data::Page->new(
                                $pager_in->total_entries,
                                $pager_in->entries_per_page,
                                $current_page
                               );

    # sanity checks
    if ($end > $pager ->last_page)
    {
        $end = $pager->last_page;
    }
    if ($start < $pager->first_page)
    {
        $start = $pager->first_page;
    }
    ASSERT($start <= $end, qq{start = $start end=$end start must be less than end});

    my $pagelinks;

    for my $page ($start..$end)
    {
        $pagelinks .= make_pagelink($pager, $page, $temp_cgi, $current_page);
    }

    return $pagelinks;
}

# ---------------------------------------------------------------------

=item make_pagelink

Description

=cut

# ---------------------------------------------------------------------
sub make_pagelink
{
    my $pager = shift;
    my $page = shift;
    my $temp_cgi = shift;
    my $current_page = shift;
    my $href;

    my $DISPLAY = "page" ;    # set to page|records

    $pager->current_page($page);
    $href = make_item_page_href($page, $temp_cgi);

    my $content;
    if ($DISPLAY eq "page")
    {
        $content = $page;
    }
    else
    {
        $content = $pager->first . "-" . $pager->last ;
        if ($pager->first == $pager->last)
        {
            $content = $pager->first;
        }
    }

    if ($pager->current_page eq $current_page)
    {
        $content = '<CurrentPage>'. $content .  '</CurrentPage>';
    }

    my $url;
    $url .= wrap_string_in_tag($href, 'Href');
    $url .= wrap_string_in_tag($content, 'Content');
    my $pagelink = wrap_string_in_tag($url, 'PageURL');

    return $pagelink;
}


# ---------------------------------------------------------------------

=item make_item_page_href

Description

=cut

# ---------------------------------------------------------------------
sub make_item_page_href
{
    my $page_number = shift;
    my $cgi = shift;

    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('pn', $page_number);
    my $href = CGI::self_url($temp_cgi);

    return $href;
}

# ---------------------------------------------------------------------

=item make_slice_size_widget

Description

=cut

# ---------------------------------------------------------------------
sub make_slice_size_widget
{
    my $default = shift;
    my $list_ref = shift;

    my $label_hashref = {};
    my $name = "sz";

    foreach my $value (@{$list_ref})
    {
        $label_hashref->{$value} = qq{$value per page};
    }
    my $pulldown =
        Utils::build_HTML_pulldown_XML($name, $list_ref, $label_hashref, $default);

    return $pulldown;
}


# ---------------------------------------------------------------------

=item wrap_result_data

Description

=cut

# ---------------------------------------------------------------------
sub wrap_result_data {
    my $C = shift;
    my $rs = shift;

    my $output;

    # This parse will be replaced with A DOM when the Facet data come online.
    my $result_docs_arr_ref = $rs->get_result_docs();
    foreach my $doc_data (@$result_docs_arr_ref) {
        my $s = '';

        my ($str_titles) = ($doc_data =~ m,<arr name="title">(.*?)</arr>,gs);
        my (@display_titles) = ($str_titles =~ m,<str[^>]*>(.*?)</str>,);
        my $display_title = join(',', @display_titles);
        $display_title = Encode::decode_utf8($display_title);
        $s .= wrap_string_in_tag($display_title, 'Title');

        my ($str_authors) = ($doc_data =~ m,<arr name="author">(.*?)</arr>,gs);
        my (@authors) = ($str_authors =~ m,<str[^>]*>(.*?)</str>,gs);
        my $author = join(',', @authors);
        $author = Encode::decode_utf8($author);
        $s .= wrap_string_in_tag($author, 'Author');

        my ($date) = ($doc_data =~ m,<str name="date">(.*?)</str>,s);
        $s .= wrap_string_in_tag($date, 'Date');

        my ($id) = ($doc_data =~ m,<str name="id">(.*?)</str>,s);
        $s .= wrap_string_in_tag($id, 'ItemID');

        my ($rights) = ($doc_data =~ m,<int name="rights">(.*?)</int>,s);
        $s .= wrap_string_in_tag($rights, 'rights');

        my ($score) = ($doc_data =~ m,<float name="score">(.*?)</float>,s);
        $s .= wrap_string_in_tag($score, 'relevance');

        # Link to Pageturner
        $s .= wrap_string_in_tag(PT_HREF_helper($C, $id, 'pt_search'), 'PtSearchHref');

        # Access rights
        my $access_status;
        eval {
            my $ar = new AccessRights($C, $id);
            $access_status = $ar->check_final_access_status_by_attribute($C, $rights, $id);
        };
        $access_status = 'deny'         
            if ($@);
        
        my $fulltext_flag = ($access_status eq 'allow') ? 1 : 0;
        $s .= wrap_string_in_tag($fulltext_flag, 'fulltext');

        # Catalog record number
         my $solr_response = 
             `curl -s http://solr-vufind:8026/solr/biblio/select?q=ht_id:$id&start=0&rows=1&fl=id`;
         my ($record_no) = ($solr_response =~ m,<str name="id">(.*?)</str>,);
        $s .= wrap_string_in_tag($record_no, 'record');


        $output .= wrap_string_in_tag($s, 'Item');
    }

    return \$output;
}



1;

__END__

=head1 AUTHOR

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
