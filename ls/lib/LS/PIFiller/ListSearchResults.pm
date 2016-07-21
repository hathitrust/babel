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
use Identifier;
use LS::FacetConfig;
#use Encode;
use URI::Escape;
use Utils;
use Namespaces;
# for logging in json
use JSON::XS;


BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "PIFiller/Common/COLLECTIONS_OWNED_JS.pm";
    require "LS/PIFiller/Globals.pm";
}


#======================================================================
#
#                        P I    H a n d l e r s
#
#======================================================================


# ---------------------------------------------------------------------

=item handle_HEADER_SEARCH_SELECT_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_HEADER_SEARCH_SELECT
    : PI_handler(HEADER_SEARCH_SELECT)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $field1 = $cgi->param('field1');
    my $out="";
    my $map={
             ocr => 'all',
             title => 'title',
             author => 'author',
             subject => 'subject',
             isn => 'isbn',
             publisher => 'publisher',
             series => 'seriestitle',
             pdate_start => 'pubyear'
            };
    
    if (defined($field1) && $field1 ne "")
    {
        my $selected=$map->{$field1};
        $out=wrap_string_in_tag($selected, 'Selected');
    }
    
    
    return $out;
    
}


# ---------------------------------------------------------------------

=item handle_PAGING_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_PAGING_PI
    : PI_handler(PAGING)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $config = $C->get_object('MdpConfig');

    my $pager = $act->get_transient_facade_member_data($C, 'pager');
    ASSERT(defined($pager), qq{pager not defined});

    my $cgi = $C->get_object('CGI');
    my $current_page = $cgi->param('pn');
    #my $requested_pn = $cgi->param('requested_pn');
    my $current_sz = $cgi->param('sz');
    # set total entries to max_rows if number results greater than max_rows
    my $max_rows = $config->get('max_rows');
    my $total_rows = $pager->total_entries;

    if ($total_rows > $max_rows)
    {
	$pager->total_entries($max_rows);
    }
    
    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('a', 'srchls');

    my $num_records = $pager->total_entries;

    # spit out links for each page with the page range i.e href to
    # page2 label 11-20
    my $pagelinks = "None";           # A small enough number of pages 
                                      # that they are all viewable in the pager
    # Else, they are broken down into three subsets:
    my $start_pagelinks = "None";
    my $middle_pagelinks = "None";
    my $end_pagelinks = "None";

    my $start;
    my $end;

    # Set this so page links fit on one line
    my $MAX_PAGE_LINKS = 9;
    my $NUM_END_LINKS = 1 ;

    if ($pager->last_page <= $MAX_PAGE_LINKS)
    {
        # if there aren't too many just spit out all the page links
        $start = 1;
        $end = $pager->last_page;
        $pagelinks =
            _ls_get_pagelinks($start, $end,
                              $pager, $temp_cgi, $current_page);
    }
    else
    {
        my ($end_links_start, $end_links_end);

        # Always be able to get back to the first page; Display "1 ... " at head.
        if ($current_page > 2)
        {
            $start_pagelinks =
                _ls_get_pagelinks(1, 1,
                                  $pager, $temp_cgi, $current_page);
        }

        if ($current_page < $pager->last_page - ($MAX_PAGE_LINKS - 1))
        {
            $start = $current_page;
            $end = $current_page + (($MAX_PAGE_LINKS - $NUM_END_LINKS) - 1);
            $end_links_start = $pager->last_page - ($NUM_END_LINKS - 1);
            $end_links_end = $pager->last_page;
            $middle_pagelinks =
                _ls_get_pagelinks($start, $end,
                                  $pager, $temp_cgi, $current_page);
        }
        else
        {
            # just output last $MAX_PAGE_LINKS links
            $end_links_start = $pager->last_page - (($MAX_PAGE_LINKS) - 1);
            $end_links_end = $pager->last_page;
            # reset pager
            $pager->current_page($current_page);
        }
        $end_pagelinks =
            _ls_get_pagelinks($end_links_start, $end_links_end,
                              $pager, $temp_cgi, $current_page);
    }

    # Make links for current page, next page, and previous page

    # reset pager to correct current page
    $pager->current_page($current_page);

    my $current_page_href = _ls_make_item_page_href($pager->current_page, $temp_cgi);

    my $previous_page_href;
    my $previous_page;
    my $previous_page_number = $pager->previous_page;

    if (defined ($previous_page_number))
    {
        # set pager current page to previous_page_number so that
        # $pager->first gives correct first record number for that
        # page
        $pager->current_page($previous_page_number);
        $previous_page_href = _ls_make_item_page_href($pager->current_page, $temp_cgi);
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
        $next_page_href = _ls_make_item_page_href($pager->current_page, $temp_cgi);
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
    $s .= wrap_string_in_tag(_ls_make_slice_size_widget($current_value, \@values), 'SliceSizeWidget');

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
    my $num_search_only  = $act->get_transient_facade_member_data($C, 'search_only_count');


    #always remove the page number from any url that switches context
    # i.e. changing from lmt=x to lmt=y changes ordering/result set and therefore pages
    $temp_cgi->delete('pn');
   
    my $limit_type = 'all'; #default
    if (defined $cgi->param('lmt'))
    {
        $limit_type = $cgi->param('lmt');
    }  
    $temp_cgi->param('lmt', 'ft');
    my $full_text_href = $temp_cgi->self_url();

    $temp_cgi->param('lmt', 'all');
    my $all_href = $temp_cgi->self_url();

    $temp_cgi->param('lmt', 'so');
    my $search_only_href = $temp_cgi->self_url();
    my $num_total;
    if ($limit_type eq 'all')
    {
        $num_total=$num_all;
    }
    elsif($limit_type eq 'so')
    {
        $num_total=$num_search_only;
    }
    else
    {
        $num_total=$num_full_text;
    }
    
    $num_total=commify($num_total);
    
    
    my $s;

    $s .= wrap_string_in_tag($limit_type, 'LimitType');
    $s .= wrap_string_in_tag($all_href, 'AllHref');
    $s .= wrap_string_in_tag($full_text_href, 'FullTextHref');
    $s .= wrap_string_in_tag($search_only_href, 'SearchOnlyHref');

    my $ft_display=commify($num_full_text);
    $s .= wrap_string_in_tag($num_full_text, 'FullTextCount');
    $s .= wrap_string_in_tag($ft_display, 'FullTextCountDisplay');

    my $all_display=commify($num_all);
    $s .= wrap_string_in_tag($num_all, 'AllItemsCount');
    $s .= wrap_string_in_tag($all_display, 'AllItemsCountDisplay');

    my $so_display=commify($num_search_only);
    $s .= wrap_string_in_tag($num_search_only, 'SearchOnlyCount');
    $s .= wrap_string_in_tag($so_display, 'SearchOnlyCountDisplay');

    $s .= wrap_string_in_tag($num_total, 'TotalCount');

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
    my ($A_query_time, $B_query_time);
    my $cgi = $C->get_object('CGI');
    my $limit = $cgi->param('lmt');
    my $search_result_data_hashref= $act->get_transient_facade_member_data($C, 'search_result_data');
    my $user_query_string = $$search_result_data_hashref{'user_query_string'};
    
    my $primary_rs = $$search_result_data_hashref{'primary_result_object'};
    my $secondary_rs = $$search_result_data_hashref{'secondary_result_object'};
    my $B_rs =$$search_result_data_hashref{'B_result_object'};
    my $i_rs =$$search_result_data_hashref{'interleaved_result_object'};
    my $i_debug_data= $$search_result_data_hashref{'il_debug_data'};
    
    # get cgi url from cgi object and add logger to ls i.e SDRROOT/cgi/ls/logger
    my $base_url = $cgi->url();
    my $logger= $base_url . '/logger';
    $output .= wrap_string_in_tag($logger, 'LoggerURL');   

    # Was there a search?
    if ($search_result_data_hashref->{'undefined_query_string'}) { 
        $query_time = 0;
        $solr_error_msg = '';
    }
    else {
        # we can just add up all 3 query times. Forget primary secondary
       	#   $query_time = $primary_rs->get_query_time() + $secondary_rs->get_query_time();
	#XXX do we need total query time see above?
        $A_query_time = $primary_rs->get_query_time();
	if (defined($B_rs))
	{
	    $B_query_time = $B_rs->get_query_time();
	}
	
        $solr_error_msg = $act->get_transient_facade_member_data($C, 'solr_error');
		
	my $AB_config=$C->get_object('AB_test_config');

	my $A_result_ref;
	my $B_result_ref;
	my $A_label;
	my $B_label;
	my $side_by_side = $AB_config->{'_'}->{'side_by_side'};
	my $display_AB = $AB_config->{'_'}->{'display_AB'};
	my $use_interleave=$AB_config->{'_'}->{'use_interleave'};
	#test for existence
	my $use_B_query;
	
	if (exists($AB_config->{'_'}->{'use_B_query'}) && 
	    defined($AB_config->{'_'}->{'use_B_query'}))
	{
	    $use_B_query=$AB_config->{'_'}->{'use_B_query'};
	}
	my $interleaver_class = $AB_config->{'_'}->{'interleaver_class'};
	my $B_description = $AB_config->{'_'}->{'B_description'};

	my $global_click_data;
	
	
	# XXX should we check if debug flag set and do logic here
	if ($display_AB)
	{
	    $output .= wrap_string_in_tag('TRUE', 'DISPLAY_AB');   
	}
	
   	#  side-by-side 
	if ($side_by_side)
	{
	    $A_result_ref  = _ls_wrap_result_data($C, $user_query_string,  $primary_rs);
	    $A_label = "Default";
	    $output.=wrap_string_in_tag('TRUE','SideBySideDisplay');
	    if ($use_interleave) 
	    {
		$B_result_ref = _ls_wrap_result_data($C, $user_query_string,  $i_rs);
		$global_click_data=get_global_click_data($C, 'side_intl',  $primary_rs, $B_rs,$i_rs);
	    }
	    elsif ($use_B_query)
	    {
		$B_result_ref = _ls_wrap_result_data($C, $user_query_string,  $B_rs);
		$global_click_data=get_global_click_data($C, 'side_AB',  $primary_rs, $B_rs);
	    }
	}
	elsif($use_interleave && defined($i_rs))
	{
	    #interleave single column
	    # if we are using interleave but not side by side just put interleave 	    
	    #result in A and don't define B result ref
	    $A_result_ref  = _ls_wrap_result_data($C, $user_query_string,  $i_rs );
    	    $A_label= $interleaver_class . ':' . $B_description;
	    $global_click_data=get_global_click_data($C, 'intl',  $primary_rs, $B_rs,$i_rs);
	}
	else
	{
	    #normal results single column
	    $A_result_ref  = _ls_wrap_result_data($C, $user_query_string,  $primary_rs);
	    $global_click_data=get_global_click_data($C, 'normal',  $primary_rs);
	    #Single column, normal results followed by B results
	    if ($use_B_query)
	    {
		$B_result_ref = _ls_wrap_result_data($C, $user_query_string,  $B_rs);
	    }
	    
	}
	$output .= wrap_string_in_tag($global_click_data,'G_CLICK_DATA');
	
	if (DEBUG('AB')&& defined($i_debug_data))
	{
	    my $debug_out;
	    foreach my $key (sort keys %{$i_debug_data})
	    {
		$debug_out .= "$key = $i_debug_data->{$key}, ";
	    }
	    $A_label .= " DEBUG:  $debug_out";
	}
	   
	$output .= wrap_string_in_tag($A_label,'A_LABEL');
	
	
        my $A_out = wrap_string_in_tag($$A_result_ref, 'A_RESULTS');
	$output .= $A_out;
	
	if (defined($B_result_ref))
	{
	    my $B_out = wrap_string_in_tag($$B_result_ref, 'B_RESULTS');
	    $output .=  $B_out;
	    # change label to interleaved if we are displaying interleave
	    # in B column
	    my $B_label;
	    
	    if ($use_interleave)
	    {
		$B_label= $interleaver_class;
	    }
	    else{
		$B_label = $B_description;
	    }
	    my $B_label_out = wrap_string_in_tag($B_label, 'B_LABEL');
	    $output .= $B_label_out;
	    
	}
    }
    
    #$output .= wrap_string_in_tag($query_time, 'QueryTime');
    $output .= wrap_string_in_tag($A_query_time, 'A_QueryTime');
    $output .= wrap_string_in_tag($B_query_time, 'B_QueryTime');

    $output .= wrap_string_in_tag($solr_error_msg, 'SolrError');

    #XXX  get first element of array for basic search See xxx for advanced search
    # Is the query a well-formed-formula (WFF)?
    my $wff_hashref = $search_result_data_hashref->{'well_formed'};
    my $well_formed_ary = ($wff_hashref->{'primary'} );
    my $processed_aryref=$wff_hashref->{'processed_query_string'};
    my $processed_query_string = clean_for_xml($processed_aryref->[1]);
    my $well_formed = ($well_formed_ary->[1]);
    $output .= wrap_string_in_tag($well_formed, 'WellFormed');
    $output .= wrap_string_in_tag($processed_query_string, 'ProcessedQueryString');
    #XXX tbw add unbalenced parens here foobar
    my $unbalanced_quotes=$wff_hashref->{'unbalanced_quotes'}->[1];
    $output.= wrap_string_in_tag($unbalanced_quotes, 'UnBalancedQuotes');
    #need to fix any xml chars before output
    
  #  $processed =clean_for_xml($processed);
    
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
# ---------------------------------------------------------------------
sub handle_HELDBY_PI
    : PI_handler(HELDBY) 
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $temp_cgi= CGI->new($cgi);
    $temp_cgi->delete('pn');
    # change line below to delete either facet_lang or facet_format
    $temp_cgi->delete('heldby');
    
    my $url = $temp_cgi->url(-relative=>1,-query=>1);  
    my $xml = wrap_string_in_tag($url,'unselectURL') . "\n";
    return $xml;
}


# ---------------------------------------------------------------------
sub handle_FACETS_PI
    : PI_handler(FACETS) 
{
    my ($C, $act, $piParamHashRef) = @_;
    my $fconfig=$C->get_object('FacetConfig');

    my $cgi = $C->get_object('CGI');


    my $result_data = $act->get_transient_facade_member_data($C, 'search_result_data');
    my $facet_hash =$result_data->{'primary_result_object'}->{'facet_hash_ref'};
    
    my $xml;
    my ($selected,$unselected)= get_selected_unselected($facet_hash,$cgi);
    # $selected= array ref of hashes
    #        $hash->{'value'}      
    #        $hash->{'count'}      
    #        $hash->{'facet_name'} 
    #        $hash->{'selected'}= "false"|"true";
    #        $hash->{'select_url'}   url for unselected facets on click will select it
    #        $hash->{'unselect_url'}   url for selected facets on click will unselect it

    # unselected= hash key= facet name, values = array of hashes as above
    
    # output whether any facets are selected include the multivalued and the psuedo facet full-view/limited i.e. lmt param  add the date_range facets pdate_start or end but one must be 


             
    if (defined ($cgi->param('facet')) || 
        defined ($cgi->param('facet_lang'))
        ||defined ($cgi->param('facet_format'))
        || $cgi->param('lmt') ne "all"
        || pdate_selected($cgi)
       )
    {
        $xml .= wrap_string_in_tag('true','facetsSelected') . "\n"; 
    }
    
    my $selected_facets_xml = make_selected_facets_xml($selected,$fconfig,$cgi);
    $xml .= $selected_facets_xml;

    my $unselected_facets_xml = make_unselected_facets_xml($unselected,$fconfig, $cgi);
    $xml .= $unselected_facets_xml;
    
    return $xml
}
#----------------------------------------------------------------------    
sub pdate_selected
{
    my $cgi = shift;
    
    # if either pdate_start or pdate_end is defined and non-blank return ture
    return ( 
            (! __IsUndefOrBlank(scalar $cgi->param('pdate_start')))
            ||
            (! __IsUndefOrBlank(scalar $cgi->param('pdate_end')))
              );
}

#----------------------------------------------------------------------    

sub get_selected_unselected 

{
    my $facet_hash = shift; # from JSON 
    my $cgi = shift;

    my @selected;
    my $unselected={};

    #XXX hack to cause pdate facet to show up as selected if pdate was used in advanced search
    #XXX if facet_hash is empty because we got zero results
    
    foreach my $facet_name (keys %{$facet_hash})
    {
        #--------------------------------------------------
        #XXX hack for pdate and no results
        # how do we know no results?
        # 
        
#        if ($facet_name eq 'publishDateRange')
#          {
#            # pdate param removed by now and put back in Facet:publishDateRange
#            my @facets = $cgi->param('facet');
#            my $pdate= $facets[0];
#            if (defined($pdate) && $pdate ne "")
#            {
                
#                # need test for zero results and pdate param
#                my $hash={};
#                $hash->{'selected'}   = "true";
#                $hash->{'count'}      = 0;
#                $hash->{'facet_name'} = $facet_name;
                
#                my ($junk, $facet_value) = split(/\:/,$pdate); #fix this
#                $hash->{'value'}      = clean_for_xml($facet_value);
#                $hash->{'unselect_url'}=__get_unselect_url($hash,$cgi);
#                push (@selected,$hash);
#            }
#        }
        
        my $ary_for_this_facet_name=[];
        my $facet_list_ref=$facet_hash->{$facet_name};
        foreach my $facet_ary (@{$facet_list_ref})
        {
            my $hash                 = {};
            $hash->{'selected'}   = "false";
            $hash->{'count'}      = $facet_ary->[1];
            $hash->{'facet_name'} = $facet_name;

            my $facet_value = $facet_ary->[0];
            # clean facet data from json Solr response so we can output it in XML
            $hash->{'value'}      = clean_for_xml($facet_value);



            my @cgi_facets = $cgi->multi_param('facet');
            if (@cgi_facets){    
                # XXX move this loop into isFacetSelected
                # test the facet names for a match first before comparing the values and
                # then just compare values!
                foreach my $facet (@cgi_facets)
                {
                    my ($cgi_facet_name,@rest)=split(/\:/,$facet);
                    my $cgi_facet_value = join (':', @rest);
                    if ($facet_name eq $cgi_facet_name)
                    {
                        if (isFacetSelected($facet_value,$cgi_facet_value)eq "true")
                        {
                            $hash->{'selected'} = "true";
                        }                    
                    }
                }
            }
            
            if ($hash->{'selected'} eq "true")
            {
                # add the unselect url to the hash
                $hash->{'unselect_url'}=__get_unselect_url($hash,$cgi);
                push (@selected,$hash);
            }
            else
            {
                # add the select url
                $hash->{'select_url'}=__get_select_url($hash,$cgi);
            }
            
            # unselected needs array of array of hashes
            # facet1->hashes for facet 1
            # facet2->hashes for facet 2

            push (@{$ary_for_this_facet_name},$hash); 
        }
        $unselected->{$facet_name}=$ary_for_this_facet_name;
    }
    return (\@selected,$unselected);
}


sub make_selected_facets_xml
{
    my $selected = shift;
    my $fconfig = shift;
    my $cgi = shift;

    my $facet2label=$fconfig->get_facet_mapping;
    my $xml;
    my $unselect_url;

    $xml='<SelectedFacets>' . "\n";
#   insert any advanced search multiselect OR facets on top of list
    my $multiselect_xml = __get_multiselect_xml($fconfig, $cgi);
    $xml .= $multiselect_xml;
    
    my $daterange_xml;
    if ( __IsUndefOrBlank( scalar $cgi->param('pdate_start')) && __IsUndefOrBlank( scalar $cgi->param('pdate_end')) )
    {
        # if they are both blank/undef don't bother getting the xml
    }
    else
    {
        $daterange_xml= __get_daterange_xml($fconfig, $cgi);
        $xml .=$daterange_xml;
    }
    
    foreach my $facet (@{$selected})
    {
        $unselect_url=$facet->{'unselect_url'};
        my $facet_name=$facet->{facet_name};
        my $field_name=$facet2label->{$facet_name};
        
        $xml .= '<facetValue name="' . $facet->{value} .'" class="selected">'  . "\n";; 
        $xml .= wrap_string_in_tag($field_name,'fieldName') . "\n"; 
        $xml .= wrap_string_in_tag($unselect_url,'unselectURL') . "\n"; 
        $xml .='</facetValue>' ."\n";
    }
 
    $xml .= '</SelectedFacets>' . "\n";
    return $xml;
}

#----------------------------------------------------------------------

sub __get_daterange_xml
{
    my $fconfig = shift;
    my  $cgi    = shift;
   
    my $xml ="";
    my $start = $cgi->param('pdate_start');
    my $end = $cgi->param('pdate_end');
    my $msg;
    # pdate already replaced with normal date facet so we only need to deal with start/end pdates


   
    if (__IsUndefOrBlank($start))
    {
        $msg= "Before or during $end";
    }
    elsif (__IsUndefOrBlank($end))
    {

       $msg = "During or after $start"
    }
    else
    {
        $msg =    "Between $start and $end";
    }
    
    my $facetXML = wrap_string_in_tag($msg,'facetString') . "\n"; 

    $xml .= $facetXML;
    
    my $unselectURL = get_daterange_unselectURL($fconfig,$cgi);
    my $unselectURLXML=wrap_string_in_tag($unselectURL,'unselectURL') . "\n"; 
    $xml .= $unselectURLXML;
     
    my    $daterange_xml .= wrap_string_in_tag($xml,'daterange') . "\n"; 
    return $daterange_xml;
    
}
#----------------------------------------------------------------------
sub get_daterange_unselectURL
{
    my $fconfig = shift;
    my $cgi = shift;
    my $temp_cgi= CGI->new($cgi);
    $temp_cgi->delete('pdate_start');
    $temp_cgi->delete('pdate_end');
    $temp_cgi->delete('pdate');
    my $url = $temp_cgi->url(-relative=>1,-query=>1);  
    return $url;
}

#----------------------------------------------------------------------
sub __IsUndefOrBlank
{
    my $var = shift;
    $var =~s/\s+//g;
    return ( (!defined($var)) || $var eq "")
}

#----------------------------------------------------------------------
sub __get_multiselect_xml
{
    my $fconfig = shift;
    my  $cgi = shift ;
    my $xml;
    my $multiselect;
    # XXX should read names of multiselect facets from config file for now hard code
    my @lang= $cgi->multi_param('facet_lang');
    my @format = $cgi->multi_param('facet_format');
    my $lang=get_multifacet_xml(\@lang,$cgi,$fconfig);
    my $format=get_multifacet_xml(\@format,$cgi,$fconfig);
    $multiselect= $lang . $format;
    $xml .= wrap_string_in_tag($multiselect,'multiselect') . "\n"; 
    return $xml
}

sub get_multifacet_xml
{
    my $ary = shift;
    my $cgi = shift;
    my $fconfig = shift;
    
    my $xml;
    
    
    if (! defined($ary)|| scalar(@{$ary})<1 )
    {
        # return blank
        return "";
    }

    my $clause;
    my $field;
    
    foreach my $fquery (@{$ary})
    {

        my @rest;
        ($field,@rest)=split(/\:/,$fquery);
        my $string=join(':',@rest);
        # &fq=language:( foo OR bar OR baz)
        $clause.= $string . " OR ";
    }
    # remove last OR and add &fq=field:
    $clause =~s/OR\s*$//g;
    $clause= '(' . $clause . ' )';
    my $facetValueXML=wrap_string_in_tag($clause,'facetValue') . "\n"; 

    #XXX need to map url param field name to dispay value
    # so language= Language  see regular facet code for this, is there a lookup?
    
    my $facet2label=$fconfig->get_facet_mapping;
    my $field_label=$facet2label->{$field};
    my $fieldnameXML= wrap_string_in_tag($field_label,'fieldName') . "\n"; 

    my $unselectURL=getMultiUnselectURL($field,$cgi);
    
    my $unselectURLXML=wrap_string_in_tag($unselectURL,'unselectURL') . "\n"; 
    $clause.= $facetValueXML . $fieldnameXML . $unselectURLXML;
    
    $xml .= wrap_string_in_tag($clause,'multiselectClause') . "\n"; 
    return $xml;
}


sub getMultiUnselectURL{
    my $field = shift;
    my $cgi = shift;

    # we just need to remove either facet_lang or facet_format parameters
    #XXX this is a hard coded solution for now and will require adding any other multiselect params
    #delete all facet params

    my $temp_cgi= CGI->new($cgi);
    $temp_cgi->delete('pn');
    # change line below to delete either facet_lang or facet_format
    if ($field =~/language/)
    {
        $temp_cgi->delete('facet_lang');
    }
    elsif ($field =~/format/)
    {
        $temp_cgi->delete('facet_format');
    }
    
    my $url = $temp_cgi->url(-relative=>1,-query=>1);  
    return $url;

}

#----------------------------------------------------------------------

sub  make_unselected_facets_xml
{
    my $unselected = shift;
    my $fconfig = shift;
    my $cgi = shift;
    
    my $facet2label=$fconfig->get_facet_mapping;
    my $facet_order=$fconfig->{'facet_order'};
    my $MINFACETS = $fconfig->get_facet_initial_show;

    my $current_url = $cgi->url(-relative=>1,-query=>1);    
    # remove page number since changing facets changes facet count
    $current_url =~s,[\;\&]pn=\d+,,g;

    my $xml =  '<unselectedFacets>' . "\n";

    foreach my $facet_name (@{$facet_order})
    {
        my $facet_label = $facet2label->{$facet_name};
        # normalize filed name by replacing spaces with underscores
        my $norm_field_name = $facet_label;
        $norm_field_name =~s,\s+,\_,g;
        
        $xml .='<facetField name="' . $facet_label . '" '. 'normName='.'"'.  "$norm_field_name" . '" '   .     ' >' . "\n";
        
        my ($xml_for_facet_field,$SHOW_MORE_LESS)= make_xml_for_unselected_facet_field ($facet_name,$norm_field_name,$unselected,$current_url,$MINFACETS);
        $xml .= $xml_for_facet_field;
 
        $xml .="\n" .'<showmoreless>'. $SHOW_MORE_LESS . '</showmoreless>' ."\n";
        $xml.='</facetField>' . "\n";
        
    }
    $xml .='</unselectedFacets>' . "\n";
    return $xml;
}

#----------------------------------------------------------------------
# change name to for unselected facet field
sub make_xml_for_unselected_facet_field 
{
    my $facet_name = shift;
    my $norm_field_name = shift;
    my $unselected = shift;
    my $current_url = shift;
    my $MINFACETS = shift;
    
    my $SHOW_MORE_LESS = "false";
    my $xml;
    
    my $ary_ref=$unselected->{$facet_name};    
    my $counter=0;
    foreach my $value_hash (@{$ary_ref})
    {
        #instead of displaying selected facets greyed out don't display them per Suz email 7/22/11
        next if ($value_hash->{'selected'} eq "true");
        my $value=$value_hash->{'value'};
        my $facet_url=$value_hash->{'select_url'};
        my $class=' class ="showfacet';
        
        if ($counter >= $MINFACETS)
        {
            $class=' class ="hidefacet';
            $SHOW_MORE_LESS="true";
        }
        
        # add normalized facet field to class
        $class .= ' ' . $norm_field_name . '" ';

        my $count=commify($value_hash->{'count'});
        
        $xml .='<facetValue name="' . $value . '" '.$class . '> ' . "\n";
        $xml .='<facetCount>' . $count . '</facetCount>'. "\n";
        $xml .='<url>' . $facet_url . '</url>'  . "\n";
        $xml .='<selected>' . $value_hash->{'selected'} . '</selected>' . "\n";
        $xml .='</facetValue>' ."\n";
        $counter++;
        
    }
    return ($xml,$SHOW_MORE_LESS);
}


# ---------------------------------------------------------------------


# 
sub handle_ADVANCED_SEARCH_PI
    : PI_handler(ADVANCED_SEARCH) 
{
    my ($C, $act, $piParamHashRef) = @_;


    my $cgi = $C->get_object('CGI');
    #get query params from cgi and map to user friendly fields using config
    # put the stuff inside the for loop in a subroutine!
    my $output;
    my $groups;
    my $isAdvanced =__isAdvanced($cgi);

    my $start; # first query number in group, ie we want queries 1&2   and 3 &4  so starts are 1 and 3
    $start =1;
    my $group_1 = getGroup($C,$act,$start);
    $start = 3;
    my $group_2 = getGroup($C,$act,$start);
    my $op3 = $cgi->param('op3');
    $output .=  wrap_string_in_tag($op3, 'OP3');
    if (defined $group_1)
    {
        $output .=  wrap_string_in_tag($group_1, 'group');
    }
    if (defined $group_2)
    {
        $output .=  wrap_string_in_tag($group_2, 'group');
    }
    

    
# will have to do something like this in the xsl    
#    if ($query_group_1 =~/\S/ )
#    {
#        if  ($query_group_2 =~/\S/)
#        {
#            # if both have at least one non-blank character 
#            $advanced = $paren_1 . $op_ary->[3] . $paren_2;
#        }
#        else
#        {
#            $advanced = ' ' . $query_group_1 .' ';
#        }
#    }
#    else
#    {
#        $advanced = ' ' . $query_group_2 .' ';
#    }

    

    
    my $advURL=getAdvancedSearchURL($cgi);
    $output .= wrap_string_in_tag($advURL, 'AdvancedSearchURL');
    my $modURL=getModifyAdvancedSearchURL($cgi);
    $output .= wrap_string_in_tag($modURL, 'ModifyAdvancedSearchURL');

    $output .= wrap_string_in_tag($isAdvanced, 'isAdvanced');
    return $output;
  }

# ---------------------------------------------------------------------
#======================================================================
#
#              P I    H a n d l e r   H e l p e r s
#
#======================================================================
#----------------------------------------------------------------------

sub getGroup{
    my $C = shift;
    my $act = shift;
    my $start =shift;
    
    
    my $fconfig=$C->get_object('FacetConfig');
    my $cgi = $C->get_object('CGI');


    #XXX add result data so we can put well formed/processed string here instead of someplace else
    my $search_result_data_hashref= $act->get_transient_facade_member_data($C, 'search_result_data');    
    my $wff_hashref = $search_result_data_hashref->{'well_formed'};
    my $well_formed_aryref = ($wff_hashref->{'primary'} );
    my $processed_aryref=$wff_hashref->{'processed_query_string'};

    my $param2userMap =      $fconfig->{field_2_display};
    my $anyall_2_display = $fconfig->{'anyall_2_display'};

    my $qcount=0;
    my $field1;
    my $output;

    my $isAdvanced =__isAdvanced($cgi);
    
    my $op;
    my $GROUP_NOT_EMPTY;
    
    for my $i ($start, $start+1)
    {
        #XXX hardcoded op logic
        if ($i == 2 || $i == 4)
        {
            $op    = $cgi->param('op' . $i);
            $output .=wrap_string_in_tag($op, 'OP');
        }
        
        my $q     = $cgi->param('q' . $i);

        if (defined($q))
        {
            $GROUP_NOT_EMPTY="true";
        }
            
        my $anyall = $cgi->param('anyall' . $i);
        my $anyall_string= $anyall_2_display->{$anyall}; 
        
        
        my $field = $cgi->param('field' . $i);
        # XXX hack.  Should at least read default field from config file
        # special case for basic search where there is no field  param
        if ( $i ==1 && defined($q) && (!defined ($field)))
        {
                 $field='ocr';
             }
        
        my $user_field= $param2userMap->{$field} ;
        
        # unselect url for this row
        my $unselectURL=getUnselectAdvancedClauseURL($cgi,$i);
        
        my $well_formed = $well_formed_aryref->[$i]; 
        my $processed_query = $processed_aryref->[$i];

        $processed_query = clean_for_xml($processed_query);
        my $unbalanced_quotes=$wff_hashref->{'unbalanced_quotes'}->[$i];
        
        #  we need to pull op out of clauses and group clauses into groups
        #    my $query_group_1 = __make_group(1,$clause_ary,$op_ary); # q1 and q2
        my $clause;
        if (defined ($q))
        {
            #XXX handle everything query
            if ($q=~/^\s*\*\s*$/ && $i == 1)
            {
                $clause .=wrap_string_in_tag('true', 'EveryThingQuery');
            }
                        
            $clause .=wrap_string_in_tag($i, 'Qnum');
            $clause .=wrap_string_in_tag($q ,'Query');
            $clause .=wrap_string_in_tag($well_formed ,'WellFormed');
            $clause .=wrap_string_in_tag($processed_query ,'ProcessedQuery');
            $clause .= wrap_string_in_tag($unbalanced_quotes, 'UnBalancedQuotes');
            $clause .=wrap_string_in_tag($op, 'OP');
            $clause .=wrap_string_in_tag($user_field, 'Field');
            $clause .=wrap_string_in_tag($anyall_string, 'AnyAll');
            $clause .=wrap_string_in_tag($unselectURL, 'unselectURL');
            $output .= wrap_string_in_tag($clause, 'Clause');
        }
        
    }
    if (defined ($GROUP_NOT_EMPTY))
    {
        return ($output);
    }
    else
    {
        return undef;
    }
    

}
#----------------------------------------------------------------------
sub __isAdvanced{
    my $cgi = shift;
    my $isAdvanced="false";
    my $qcount = 0;
    my $anyall;
    
    for my $i (1..4)
    {
        my $q     = $cgi->param('q' . $i);
        if (defined($q) && $q ne "")
        {
            $qcount++;
            if ($i == 1)
            {
                #if there is a populated q1 and there is an anyall field then its advanced since we don't put an anyall field param for basic
                $anyall =$cgi->param('anyall1');
                if (defined($anyall) && $anyall ne "")
                {
                    $isAdvanced="true";
                }
            }
            if ($i > 1)
            {
                #if there is a populated q2,3 or 4 then it is and advanced search
                $isAdvanced="true";
            }
        }
    }
    return $isAdvanced;
}


#----------------------------------------------------------------------
sub getAdvancedSearchURL
{
    my $cgi=shift;
    #    my $url='http://tburtonw-full.babel.hathitrust.org/cgi/ls?a=page&amp;page=advanced';
    my $url=$cgi->url(-relative=>1);
    $url.='?a=page&amp;page=advanced';
    # populate query box from previous basic search?
    #unicorn-- add field1 and lmt as well
    # but if this is an advanced search just do a blank query box
    if ( __isAdvanced($cgi) ne "true")
    {
        $url.='&amp;q1=' . $cgi->param('q1') . '&amp;field1=' . $cgi->param('field1');
        my $limit=$cgi->param('lmt');
        if (defined($limit))
        {
            $url.='&amp;lmt='. $limit;
        }
        
    }
    return $url;
}

sub getModifyAdvancedSearchURL
{
    my $cgi=shift;
    my $temp_cgi = new CGI($cgi);
    my $LIMIT="2000"; #IE limit about 2048 chars 
    
    ## do we need to delete a and page params first?
    $temp_cgi->param('a','page');
    $temp_cgi->param('page','advanced');
    #XXX for now see if url is too long for a safe GET and delete long facets if it is
    # alternative is javascript to grab the url and do a POST instead of a get.
    my $tempurl=$temp_cgi->self_url();
    my $facet_lang_string = join(' ',$temp_cgi->multi_param('facet_lang'));
    my $facet_format_string = join(' ',$temp_cgi->multi_param('facet_format'));
    

    if (length($tempurl ) > $LIMIT)
    {
        if (length($facet_lang_string) > $LIMIT/3)
        {
            $temp_cgi->delete('facet_lang');
        }
        if (length ($facet_format_string) > $LIMIT/3)
        {
            $temp_cgi->delete('facet_format');
        }
    }
    
    my $url=$temp_cgi->self_url();
    
    return $url;
}

sub getUnselectAdvancedClauseURL
{
    my $cgi =    shift;
    my $row =      shift;
    
    my $temp_cgi = new CGI($cgi);
    # delete this clause
    my $q ='q' . $row;
    my $op = 'op' . $row;
    my $anyall = 'anyall' .  $row;
    my $field = 'field' .  $row;
    
    $temp_cgi->delete("$q");
    $temp_cgi->delete("$op");
    $temp_cgi->delete("$anyall");
    $temp_cgi->delete("$field");

    my $url=$temp_cgi->self_url();
    return $url;
}





#XXX this should probably be moved to Utils, but I don't want to mess with submodule stuff now!
sub commify
{
    my $text = reverse $_[0];       
    $text =~s/(\d\d\d)(?=\d)(?!\d*\.)/$1,/g;
    return scalar reverse $text
}


sub __get_unselect_url
{
    my $facet_hash = shift;
    #add qoutes to the facet string
    my $facet_string=$facet_hash->{facet_name} . ':"' . $facet_hash->{'value'}. '"';
    # convert from xml friendly to url friendly 

    Utils::remap_cers_to_chars(\$facet_string);       
#        my $escaped_value= uri_escape_utf8($url_value);

    my $cgi= shift;
    my @facets= $cgi->multi_param('facet');

    my $temp_cgi= CGI->new($cgi);
    # remove paging since selecting/unselecting facets causes result set changes and reordering
    $temp_cgi->delete('pn');

    my @new_facets;
    my $debug;
    
    # get list of all facet params except the one we got as an argument    

    foreach my $f (@facets)
    {
        Utils::remap_cers_to_chars(\$f);       
        if ($facet_string eq $f)
        {
            $debug=$1;
        }
        else
        {
            #escape quotes
      #      $f=~s/\"/\&quot\;/g;
            
            push (@new_facets,$f);
        }
    }
    #delete all facet params
    $temp_cgi->delete('facet');
    #$query->param(-name=>'foo',-values=>['an','array','of','values']);

    $temp_cgi->param(-name=>'facet',-values=>\@new_facets);
    my $url = $temp_cgi->url(-relative=>1,-query=>1);  
    return $url;
}


sub __get_select_url
{
    my $hashref = shift;
    my $cgi = shift;
    my $facet_name=$hashref->{'facet_name'};
    my $value=$hashref->{'value'} || '';
    
    # remove page number since changing facets changes facet count
    my $current_url = $cgi->url(-relative=>1,-query=>1);    
    $current_url =~s,[\;\&]pn=\d+,,g;


    my $url_value=$value;
    Utils::remap_cers_to_chars(\$url_value);       
    my $escaped_value= uri_escape_utf8($url_value);
    my $facet_url= $current_url . '&amp;facet='  . $facet_name . ':&quot;' . $escaped_value . '&quot;';
    return $facet_url;
    
}




#  map xml chars to character entities so we can output good xml
sub clean_for_xml
{
    my $value=shift;
    Utils::map_chars_to_cers(\$value);
    return $value;
}


sub isFacetSelected
{

    my $facet_value = shift;

    # following is how the cgi is processed in clean_cgi.  We process json facet value to match
    Utils::map_chars_to_cers(\$facet_value , [qq{"}, qq{'}]);
    my $cgi_facet_value = shift;

    #XXX check why do we have quotes from cgi and not from json?
    #remove leading and trailing quotes from cgi facet string 
    $cgi_facet_value=~s/^\"//;
    $cgi_facet_value=~s/\"$//;

    #facet=language:German
    if ($cgi_facet_value eq $facet_value)
    {
        return "true"
    }
    return "false";
}

# ---------------------------------------------------------------------

=item _ls_get_pagelinks

Description

=cut

# ---------------------------------------------------------------------
sub _ls_get_pagelinks
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
        $pagelinks .= _ls_make_pagelink($pager, $page, $temp_cgi, $current_page);
    }

    return $pagelinks;
}

# ---------------------------------------------------------------------

=item _ls_make_pagelink

Description

=cut

# ---------------------------------------------------------------------
sub _ls_make_pagelink
{
    my $pager = shift;
    my $page = shift;
    my $temp_cgi = shift;
    my $current_page = shift;
    my $href;

    my $DISPLAY = "page" ;    # set to page|records

    $pager->current_page($page);
    $href = _ls_make_item_page_href($page, $temp_cgi);

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

=item _ls_make_item_page_href

Description

=cut

# ---------------------------------------------------------------------
sub _ls_make_item_page_href
{
    my $page_number = shift;
    my $cgi = shift;

    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('pn', $page_number);
    my $href = CGI::self_url($temp_cgi);

    return $href;
}

# ---------------------------------------------------------------------

=item _ls_make_slice_size_widget

Description

=cut

# ---------------------------------------------------------------------
sub _ls_make_slice_size_widget
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

=item _ls_wrap_result_data

Description

=cut

# ---------------------------------------------------------------------
sub _ls_wrap_result_data {
    my $C = shift;
    #XXXfoobar  this is wrong  we don't need query here we only need it in global data
    # need to redo this and fix all method calls
    my $query=shift;
    my $rs = shift;
    my $get_slice = shift;
    
    my $cgi = $C->get_object('CGI');

    my $output;
    my $solr_debug;
    
    if (DEBUG('explain'))
    {
        $solr_debug=$rs->get_result_solr_debug();
    }
    
    # since json might contain unescaped xml entities i.e. "&" we need to filter
    # any strings.  Is there a better place to do this?

    my $result_docs_arr_ref;

    $result_docs_arr_ref = $rs->get_result_docs();

    my $doc_count=0;
    
    foreach my $doc_data (@$result_docs_arr_ref) {
        my $s = '';
	$doc_count++;
	# unicorn add oclc, isbn and ? for google book covers
        my $book_ids_ary_ref=[];
      
      my @vuFind_book_id_fields = ("oclc","isbn","lccn");
      foreach my $field (@vuFind_book_id_fields)
      {
          if (defined ($doc_data->{$field}))
          {
              my $temp_ref = $doc_data->{$field};
              my    $tmp_ary_ref = add_book_id_prefix_and_filter(uc($field),$temp_ref);
              push(@{$book_ids_ary_ref},  @{$tmp_ary_ref});
          }
      }

      my $ht_id = $doc_data->{'id'};
      my $google_id = Namespaces::get_google_id_by_namespace($C, $ht_id);
      if (defined($google_id))
      {
          push(@{$book_ids_ary_ref},$google_id);
      }

        my $book_ids = join (',',@{$book_ids_ary_ref});
        
        $s .= wrap_string_in_tag($book_ids,'bookID');
        
        my ($display_titles_ary_ref) = $doc_data->{'title'};
        #XXX WARNING  Second title in Solr title field is either 
        #  a) title without the initial article
        #  b) title in the vernacular from a linked 880 field
        # Until we fix indexing and what fields we get from VuFind we will only use the first 245
        # thus we won't display title in vernacular
        #   my $display_title = join(',', @{$display_titles_ary_ref});
        my $display_title = $display_titles_ary_ref->[0];
        # add 245c, assume only one!
        if (defined ($doc_data->{'title_c'})){
            $display_title.=" ". $doc_data->{'title_c'}->[0];
        }    

        Utils::map_chars_to_cers(\$display_title);

        $s .= wrap_string_in_tag($display_title, 'Title');

        # how do we display vernacular title?
        if (defined ($doc_data->{'vtitle'})){
            my  $vtitle.=  $doc_data->{'vtitle'};
            # add the vernacular $245c if present
            #XXX we assume second 245c is a vernacular!
            if (defined ($doc_data->{'title_c'}->[1])){
                $vtitle.= $doc_data->{'title_c'}->[1];
            }    

            Utils::map_chars_to_cers(\$vtitle);
            $s .= wrap_string_in_tag($vtitle, 'VernacularTitle');
        }   
        my $enum=$doc_data->{'volume_enumcron'}->[0];
        
        if (defined ($enum))
        {
            Utils::map_chars_to_cers(\$enum);
        }
        $s .= wrap_string_in_tag($enum, 'VolEnumCron');

        # mainauthor changes
        my $main_author='';
        my $author;
        
        my ($main_author_ary_ref) = $doc_data->{'mainauthor'};
        if (defined ($main_author_ary_ref))
        {
            $main_author = join(',', @{$main_author_ary_ref});
            $author =$main_author;
        }
        if (defined($author))
        {       
            Utils::map_chars_to_cers(\$author);
            $s .= wrap_string_in_tag($author, 'Author');
        }
        
        #DATES
	# XXX usedate = (both|date) check config/debug?
	
	# XXX get date_type (should this be a subroutine?
	my $facet_config=$C->get_object('FacetConfig');
	my $date_type = $facet_config->{date_type};
	if (DEBUG('enum'))
	{
	    $date_type='both';
	}

	my ($use_date) = ($doc_data->{'date'});
	if ($date_type eq "both")
	{
	    ($use_date) = ($doc_data->{'bothPublishDate'}->[0]);
	}
	$s .= wrap_string_in_tag($use_date, 'UseDate');


        my ($date) = ($doc_data->{'date'});
        $s .= wrap_string_in_tag($date, 'Date');
	# XXX both date enum date here
	my ($edate) = ($doc_data->{'enumPublishDate'}->[0]);
	$s .= wrap_string_in_tag($edate, 'EnumDate');
	my ($bdate) = ($doc_data->{'bothPublishDate'}->[0]);
	$s .= wrap_string_in_tag($bdate, 'BothDate');

        my $id = $doc_data->{'id'};
        $s .= wrap_string_in_tag($id, 'ItemID');

	# AB and interleaving label
	my $AB;
	if (exists($doc_data->{'il_num'}))
	{
	    $AB = $doc_data->{'AB'} . " $doc_count i: " . $doc_data->{'il_num'};
	}
	else
	{
	   $AB = $doc_data->{'AB'};
	}
	
	
	if ($AB=~/A|B|Rank/)
	{
	    $s.= wrap_string_in_tag($AB, 'ABLabel');
	}
	
	# Local Click Data
	# id, AB label, count
	my $item_click_data= {
			      'id'=>$id,
			      'rank_on_page'=>$doc_count,
			      'AB_label'=>$AB,
			     };
	
	my $item_click_data_json  = encode_json $item_click_data;
	$s.= wrap_string_in_tag($item_click_data_json, 'ItemClickData');

        # use id to look up explain data
        if (DEBUG('explain'))
        {

            #XXX do we need to do any id normalizing/denormalizing
            my $explain = $solr_debug->{explain}->{$id};
            ASSERT(defined($explain),qq{no explain data for id $id});
            $s .= wrap_string_in_tag($explain, 'explain');
        }
        
        my $rights = $doc_data->{'rights'};
        $s .= wrap_string_in_tag($rights, 'rights');

        my ($score) = $doc_data->{'score'};
        $s .= wrap_string_in_tag($score, 'relevance');

        # Link to Pageturner
        # Remove q1 if this is an advanced search
        my $pt_search_URL = PT_HREF_helper($C, $id, 'pt_search');
        my $pt_URL = PT_HREF_helper($C, $id, 'pt');
        my $isAdvanced = __isAdvanced($cgi);
        
        #XXX tbw for Roger's suggestion instead of q1= blank
        # call subroutine which checks to see if it should be blank or should be
        # a boolean of any searches where the field is ocr or ocronly 
        # $pt_search_URL = get_advanced_PT_url($cgi, $pt_search_URL)
        if ($isAdvanced eq "true")
        {
            $pt_search_URL=~s/q1=[^\&\;]+//g;
            $pt_URL=~s/q1=[^\&\;]+//g;
        }
        $s .= wrap_string_in_tag($pt_search_URL, 'PtSearchHref');
        $s .= wrap_string_in_tag($pt_URL, 'PtHref');

        # Access rights
        my $access_status;
        eval {
            my $ar = new Access::Rights($C, $id);
            $access_status = $ar->check_final_access_status_by_attribute($C, $rights, $id);
        };
        $access_status = 'deny'         
            if ($@);
        
        my $fulltext_flag = ($access_status eq 'allow') ? 1 : 0;
        $s .= wrap_string_in_tag($fulltext_flag, 'fulltext');

        my $record_no = $doc_data->{'record_no'};
        
        $s .= wrap_string_in_tag($record_no, 'record');
	# add for debugging original number in result list
	my $result_number = $doc_data->{'result_number'};
	$s .=wrap_string_in_tag($result_number, 'result_number');
	
	
        $output .= wrap_string_in_tag($s, 'Item');
    }

    return \$output;
}
#----------------------------------------------------------------------
#unicorn google book covers
sub add_book_id_prefix_and_filter
{
    my $prefix = shift;
    my $ary_ref=shift;
    my $out=[];
    
    foreach my $el (@{$ary_ref})
    {
    #skip ids with ampersands (found some in bad lccns)
        next if $el =~/\&/;
        push (@{$out},$prefix .':'. $el)
    }
    return $out;
}

sub get_advanced_PT_url
{
    my $cgi = shift;
    my  $pt_search_URL =shift;
    #check if any of the fields are ocr or ocronly
    # if not set q1 to blank
    # if so, combine them in a proper boolean query
    # this means we need to honor the anyall operator
    # which means to insert "OR"s for an anyall=any or surround with parens for phrase
    # and put in the parens and the boolean ops with precedence
    # actually if the ops are a boolean AND and we have a non ocr field then do we skip it
    # or ignore the non-ocr field
    return $pt_search_URL;
    
}

#----------------------------------------------------------------------
#
#  get_global_click)data
#
#   XXX how much do we want to repeat stuff already in regular ls logs? 

# Do we want numbered arrays? 
sub get_global_click_data
{
    my $C = shift;
    my $test_type=shift;  # this is type of test  (normal|intl|side_intl'|side_AB) intl=interleaved
    
    my $A_rs= shift;
    my $B_rs = shift;
    my $I_rs = shift;
    my $config = $C->get_object('MdpConfig');

    my $g_hashref={};
    
    my $rs_hashref={ 'A'=>$A_rs,
		  'B'=>$B_rs,
		  'I'=>$I_rs,
		};
    
    
    # Repeat stuff that is in normal logs here.  Consider later whether to 
    # remove it as it duplicates regular query logs

    my $ipaddr = ($ENV{REMOTE_ADDR} ? $ENV{REMOTE_ADDR} : '0.0.0.0');
    my $A_Qtime = $A_rs->get_query_time();
    my $A_num_found = $A_rs->get_num_found();
#    my $timestamp =Utils::Time::iso_Time('time');
    my $timestamp =Utils::Time::iso_Time('datetime');
    # add cgi params for better tracking
    my $cgi = $C->get_object('CGI');
    # is this the best way to serialize the cgi params?
    my $appURL=$cgi->url(-query=>1);
    my $entries_per_page;
    if (defined ($cgi->param('sz')))
    {
	$entries_per_page = $cgi->param('sz');
    }
    else
    {
	$entries_per_page=$config->get('default_records_per_page');
    }
    my $page_number;
    if (defined ($cgi->param('pn')))
    {
	$page_number = $cgi->param('pn');
    }
    else
    {
	$page_number = $config->get('pn');
    }
    my $starting_result_number = (($entries_per_page * ($page_number-1) ))+1; 
    # XXXdo we need to indicate whether this is an advanced search
    # get starting result id
    my $query_string = $cgi->param('q1') .
    ' ' . $cgi->param('q2') .
    ' ' . $cgi->param('q3') . 
    ' '. $cgi->param('q4');
    #remove trailing spaces
    $query_string=~s/(\s+)$//g;
    #escape quotes before we urlencode them for json
    $query_string=~s/\"/\\"/g;
    
    #NOTE: we should probably detect advanced search by seeing if more than one qN param is used.
    my $session_id = $C->get_object('Session')->get_session_id();
    my $pid = $$;
    my $referer = $ENV{REFERER} ||$cgi->referer();
    
    my $auth = $C->get_object('Auth');
    my $is_logged_in = $auth->is_logged_in($C) ? 'YES':'NO';
    
    #fingerprinting stuff
    my $user_agent=$cgi->user_agent() || '';
    $user_agent = URI::Escape::uri_escape_utf8($user_agent);
    
    # accept headers for fingerprinting
    # could do md5sum or murmurhash of all 3 to save log space but keep for now
    my $http_accept= $cgi->http('HTTP_ACCEPT')||$cgi->https('HTTP_ACCEPT');
    my $http_accept_language = $cgi->http('HTTP_ACCEPT_LANGUAGE')||$cgi->https('HTTP_ACCEPT_LANGUAGE');
    my $http_accept_encoding = $cgi->http('HTTP_ACCEPT_ENCODING')||$cgi->https('HTTP_ACCEPT_ENCODING');
    
    $g_hashref->{'user_agent'}        = $user_agent;
    $g_hashref->{'accept'}    = clean_string($http_accept);
    $g_hashref->{'accept_language'}    = clean_string($http_accept_language);
    $g_hashref->{'accept_encoding'}    = clean_string($http_accept_encoding);

    # end fingerprinting

    $g_hashref->{'ip'}        = $ipaddr ;
    $g_hashref->{'session'}   = $session_id;
    $g_hashref->{'pid'}       = $pid;
    $g_hashref->{'timestamp'} = $timestamp;
    $g_hashref->{'A_qtime'}   = $A_Qtime;

    $g_hashref->{'num_found'}     = $A_num_found ;
    $g_hashref->{'query_string'}  = escape_for_json($query_string) ;
    $g_hashref->{'test_type'}          = $test_type ;
    $g_hashref->{'starting_result_no'}  = $starting_result_number;
    $g_hashref->{'referer'} = escape_for_json($referer);
    $g_hashref->{'logged_in'}     = $is_logged_in;   
    $g_hashref->{'cgi'}          =  escape_for_json($appURL);
    #   $g_hashref->{''}          = ;

    # B info, check for $B_rs exists
    # B will exist if doing side-by-side or interleaving
    if (defined($B_rs))
    {
	my $B_Qtime = $B_rs->get_query_time();
	my $B_num_found=$B_rs->get_num_found();
	$g_hashref->{'B_qtime'}     = $B_Qtime;
	$g_hashref->{'B_num_found'}  = $B_num_found;
    }
    
    #   $g_hashref->{''}          = ;
    #   $g_hashref->{''}          = ;
    
    # arrays of result ids in relevance order for each applicable A, B, I(interleaved)
    $g_hashref = add_result_arrays($rs_hashref,$g_hashref);
    
    my    $utf8_encoded_json_text = encode_json $g_hashref;
    return($utf8_encoded_json_text);    

}    
#----------------------------------------------------------------------
sub escape_for_json
{
    my $s  = shift || '';
    #escape quotes before we urlencode them for json
    $s=~s/\%22/\"/g;
    $s=~s/\"/\\"/g;
    #replace any tabs with spaces
    $s=~s/\%09/\t/g;
    $s=~s/\t/ /g;
    # remove escapes if the next character is a space
    $s=~s/\\\s+/ /g;
    
    my $out = URI::Escape::uri_escape_utf8($s);
    
}
#----------------------------------------------------------------------
sub clean_string
{
    my $s = shift;
    $s =~s/\;/%3B/g;
    $s =~s/\&/%26/g;
    $s =~s/\"/%22/g;
    return $s;
}
#----------------------------------------------------------------------

sub add_result_arrays
{
    my $rs_hashref = shift;
    my $g_hashref = shift;
    
    foreach my $key (qw(A B I))
    {
	if (exists($rs_hashref->{$key}) && defined($rs_hashref->{$key}))
	{
	    my $rs =$rs_hashref->{$key};
	    my $ary_ref=$rs->get_result_ids();
	    my $hash_key=$key . '_rs';
	    $g_hashref->{$hash_key} = $ary_ref;
	}
	
    }
    return $g_hashref
}
#----------------------------------------------------------------------

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu
Tom Burton-West,University of Michigan, tburtonw@umich.edu

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
