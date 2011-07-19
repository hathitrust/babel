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
    my $MAX_PAGE_LINKS = 11;
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

        if ($current_page < $pager->last_page - ($MAX_PAGE_LINKS - 1))
        {
            $start = $current_page;
            $end = $current_page + (($MAX_PAGE_LINKS - $NUM_END_LINKS) - 1);
            $end_links_start = $pager->last_page - ($NUM_END_LINKS - 1);
            $end_links_end = $pager->last_page;
            $start_pagelinks =
                _ls_get_pagelinks($start, $end,
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
    
    my $s;

    $s .= wrap_string_in_tag($limit_type, 'LimitType');
    $s .= wrap_string_in_tag($all_href, 'AllHref');
    $s .= wrap_string_in_tag($full_text_href, 'FullTextHref');
    $s .= wrap_string_in_tag($search_only_href, 'SearchOnlyHref');
    $s .= wrap_string_in_tag($num_full_text, 'FullTextCount');
    $s .= wrap_string_in_tag($num_all, 'AllItemsCount');
    $s .= wrap_string_in_tag($num_search_only, 'SearchOnlyCount');
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
    my $cgi = $C->get_object('CGI');
    my $limit = $cgi->param('lmt');
    my $search_result_data_hashref= $act->get_transient_facade_member_data($C, 'search_result_data');
    my $primary_rs = $$search_result_data_hashref{'primary_result_object'};
    my $secondary_rs = $$search_result_data_hashref{'secondary_result_object'};

    # Was there a search?
    if ($search_result_data_hashref->{'undefined_query_string'}) {
        $query_time = 0;
        $solr_error_msg = '';
    }
    else {
        # we can just add up all 3 query times. Forget primary secondary
        $query_time = $primary_rs->get_query_time() + $secondary_rs->get_query_time();

        $solr_error_msg = $act->get_transient_facade_member_data($C, 'solr_error');
        my $result_ref = _ls_wrap_result_data($C, $primary_rs);
        $output .= $$result_ref;
    }

    $output .= wrap_string_in_tag($query_time, 'QueryTime');
    $output .= wrap_string_in_tag($solr_error_msg, 'SolrError');

    # Is the query a well-formed-formula (WFF)?
    my $wff_hashref = $search_result_data_hashref->{'well_formed'};
    my $well_formed = ($wff_hashref->{'primary'} );
    $output .= wrap_string_in_tag($well_formed, 'WellFormed');
    #need to fix any xml chars before output
    my $processed=$wff_hashref->{'processed_query_string'};
  #  $processed =clean($processed);
    $output .= wrap_string_in_tag($processed, 'ProcessedQueryString');

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
sub handle_FACETS_PI
    : PI_handler(FACETS) 
{
    my ($C, $act, $piParamHashRef) = @_;
    my $fconfig=$C->get_object('FacetConfig');

    my $cgi = $C->get_object('CGI');

    my @cgi_facets = $cgi->param('facet');
    my $cgi_facets_hashref;
    if (defined (@cgi_facets))
    {
        foreach my $facet_string (@cgi_facets)
        {
            #remove quotes
            $facet_string=~s/\"//g;
            $cgi_facets_hashref->{$facet_string}=1;
        }
    }

    my $result_data = $act->get_transient_facade_member_data($C, 'search_result_data');
    my $facet_hash =$result_data->{'primary_result_object'}->{'facet_hash_ref'};
    
    my $xml;
    my ($selected,$unselected)= get_selected_unselected($facet_hash,$cgi_facets_hashref);
    # $selected= array ref of hashes
    #        $hash->{'value'}      
    #        $hash->{'count'}      
    #        $hash->{'facet_name'} 
    #        $hash->{'selected'}= "false"|"true";
    # unselected= hash key= facet name, values = array of hashes as above

    my $selected_facets_xml = make_selected_facets_xml($selected,$fconfig,$cgi);
    $xml .= $selected_facets_xml;

    my $unselected_facets_xml = make_unselected_facets_xml($unselected,$fconfig, $cgi);
    $xml .= $unselected_facets_xml;
    
    return $xml
}

#----------------------------------------------------------------------    
sub make_selected_facets_xml
{
    my $selected = shift;
    my $fconfig = shift;
    my $cgi = shift;

    my $facet2label=$fconfig->get_facet_mapping;
    my $xml;
    my $unselect_url;

    $xml='<SelectedFacets>' . "\n";
    
    foreach my $facet (@{$selected})
    {
        $unselect_url=_get_unselect_url($facet,$cgi);
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
        
        my ($xml_for_facet_field,$SHOW_MORE_LESS)= make_xml_for_facet_field ($facet_name,$norm_field_name,$unselected,$current_url,$MINFACETS);
        $xml .= $xml_for_facet_field;
 
        $xml .="\n" .'<showmoreless>'. $SHOW_MORE_LESS . '</showmoreless>' ."\n";
        $xml.='</facetField>' . "\n";
        
    }
    $xml .='</unselectedFacets>' . "\n";
    return $xml;
}

#----------------------------------------------------------------------
sub make_xml_for_facet_field 
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
        my $value=$value_hash->{'value'};
        
        # XXX we convert cers back to chars and then url escape them for the url string
        my $url_value=$value;
        Utils::remap_cers_to_chars(\$url_value);       
        my $escaped_value= uri_escape_utf8($url_value);
        my $facet_url= $current_url . '&amp;facet='  . $value_hash->{'facet_name'} . ':&quot;' . $escaped_value . '&quot;';
        my $class=' class ="showfacet';
        
        if ($counter >= $MINFACETS)
        {
            $class=' class ="hidefacet';
            $SHOW_MORE_LESS="true";
        }
        
        # add normalized facet field to class
        $class .= ' ' . $norm_field_name . '" ';
        
        $xml .='<facetValue name="' . $value . '" '.$class . '> ' . "\n";
        $xml .='<facetCount>' . $value_hash->{'count'} . '</facetCount>'. "\n";
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
    my $fconfig=$C->get_object('FacetConfig');
    my $cgi = $C->get_object('CGI');

# move this map to the config object
    my $param2userMap={
                           'author'=>'author',
                           'title'=>'title',
                           'subject'=>'subject', 
                           'hlb3'=>'Academic Discipline',
                           'ocr'=> 'full text',
                            'all'=>'all marc',
                            'callnumber'=>'callnumber',
                            'publisher'=>'publisher',
                            'series'=>'serialtitle',
                            'year'=>'year',
                            'isn'=>'isn',
                          };
    #get query params from cgi and map to user friendly fields using config
    # put the stuff inside the for loop in a subroutine!
    my $output;
    for my $i (1..4)
    {
        my $q     = $cgi->param('q' . $i);
        my $op    = $cgi->param('op' . $i);
        if (!defined($op))
        {
            $op='AND';
        }
        if ($i ==1)
        {
            $op="";
        }
    
        my $field = $cgi->param('field' . $i);
        my $user_field= $param2userMap->{$field} ;

        my $clause;
        if (defined ($q))
        {
            
            $clause .=wrap_string_in_tag($i, 'Qnum');
            $clause .=wrap_string_in_tag($q ,'Query');
            $clause .=wrap_string_in_tag($op, 'OP');
            $clause .=wrap_string_in_tag($user_field, 'Field');
            $output .= wrap_string_in_tag($clause, 'Clause');
        }
        
    }
    return $output;
  }

# ---------------------------------------------------------------------
#======================================================================
#
#              P I    H a n d l e r   H e l p e r s
#
#======================================================================
sub _get_unselect_url

{
    my $facet = shift;
    #add qoutes to the facet string
    my $facet_string=$facet->{facet_name} . ':"' . $facet->{'value'}. '"';
    
    my $cgi= shift;
    my @facets= $cgi->param('facet');

    my $temp_cgi= CGI->new($cgi);
    # remove paging since selecting/unselecting facets causes result set changes and reordering
    $temp_cgi->delete('pn');

    my @new_facets;
    my $debug;
    
    # get list of all facet params except the one we got as an argument    

    foreach my $f (@facets)
    {
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



sub get_selected_unselected 

{
    my $facet_hash = shift;
    my $cgi_facets_hashref = shift;
    
    my @selected;
    my $unselected={};
    
    foreach my $facet_name (keys %{$facet_hash})
    {
        my $ary_for_this_facet=[];
        my $facet_list_ref=$facet_hash->{$facet_name};
        foreach my $facet (@{$facet_list_ref})
        {
            my $hash                 = {};
            $hash->{'value'}      = clean($facet->[0]);
            $hash->{'count'}      = $facet->[1];
            $hash->{'facet_name'} = clean($facet_name);
            $hash->{'selected'}   = "false";
            #facet=language:German
            my $facet_string      = $facet_name . ':' . $hash->{'value'};

            if (defined ($cgi_facets_hashref)){    
                $hash->{'selected'} = facetSelected($facet_string,$cgi_facets_hashref);
            }
            
            if ($hash->{'selected'} eq "true")
            {
                push (@selected,$hash);
            }
            # unselected needs array of array of hashes
            # facet1->hashes for facet 1
            # facet2->hashes for facet 2

            push (@{$ary_for_this_facet},$hash); 
        }
        $unselected->{$facet_name}=$ary_for_this_facet;
    }
    return (\@selected,$unselected);
}

sub clean
{
    my $value=shift;
    $value = Encode::decode_utf8($value);
    Utils::map_chars_to_cers(\$value);
    return $value;
}


sub facetSelected
{
    my $facet_string= shift;
    my $cgi_facets_hashref = shift;
    #remove quotes from facet string
    $facet_string=~s/\"//g;
    
    #facet=language:German
    if ($cgi_facets_hashref->{$facet_string}==1)
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
    my $rs = shift;

    my $output;


    # since json might contain unescaped xml entities i.e. "&" we need to filter
    # any strings.  Is there a better place to do this?

    my $result_docs_arr_ref = $rs->get_result_docs();
    foreach my $doc_data (@$result_docs_arr_ref) {
        my $s = '';

        my ($display_titles_ary_ref) = $doc_data->{'title'};
        
        my $display_title = join(',', @{$display_titles_ary_ref});
        $display_title = Encode::decode_utf8($display_title);
        Utils::map_chars_to_cers(\$display_title);

        $s .= wrap_string_in_tag($display_title, 'Title');

        my ($authors_ary_ref) = $doc_data->{'author'};
        if (defined ($authors_ary_ref))
        {
            my $author = join(',', @{$authors_ary_ref});
            $author = Encode::decode_utf8($author);
            Utils::map_chars_to_cers(\$author);
            $s .= wrap_string_in_tag($author, 'Author');
        }
            
        my ($date) = ($doc_data->{'date'});
        $s .= wrap_string_in_tag($date, 'Date');

        my $id = $doc_data->{'id'};
        $s .= wrap_string_in_tag($id, 'ItemID');

        my $rights = $doc_data->{'rights'};
        $s .= wrap_string_in_tag($rights, 'rights');

        my ($score) = $doc_data->{'score'};
        $s .= wrap_string_in_tag($score, 'relevance');

        # Link to Pageturner
        $s .= wrap_string_in_tag(PT_HREF_helper($C, $id, 'pt_search'), 'PtSearchHref');

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
        $output .= wrap_string_in_tag($s, 'Item');
    }

    return \$output;
}



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
