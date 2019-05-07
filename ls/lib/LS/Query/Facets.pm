package LS::Query::Facets;


=head1 NAME

LS::Query::FullText (Q)

=head1 DESCRIPTION

This class subclasses Search::Query

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Debug::DUtils;
use LS::FacetConfig;
use URI::Escape;

use base qw(Search::Query);


# ---------------------------------------------------------------------

=item AFTER_Query_initialize

Initialize LS::Query::FullText after base class.  Use Template
Design Pattern.

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize
{
    my $self = shift;
    my $C = shift;
    my $internal = shift;
    my $config_hashref = shift;
    
    $self->{'query_configuration'} = $config_hashref;
    my $facet_config=$C->get_object('FacetConfig');
    $self->{'facet_config'}=$facet_config;
}
# ---------------------------------------------------------------------
sub get_facet_config
{
    my $self = shift;
    return $self->{'facet_config'}
}
# ---------------------------------------------------------------------
sub get_date_type
{
    my $self =shift;
    my $config=$self->get_facet_config;
    my $date_type=$config->{date_type};
    if (DEBUG('enum'))
    {
	$date_type='both';
    }
    return $date_type;
}

# ---------------------------------------------------------------------

=item get_id_arr_ref

Description

=cut

# ---------------------------------------------------------------------
sub get_id_arr_ref
{
    my $self = shift;
    return $self->{'id_arr_ref'};
}

# ---------------------------------------------------------------------

=item get_query_type

Description: returns what was passed in on config: (full_text_query|search_only_query|all_query)

=cut

# ---------------------------------------------------------------------
sub get_query_type
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'query_type'});
}
# ---------------------------------------------------------------------


# ---------------------------------------------------------------------

=item full_text_query

Description: returns 1 if this is a full text query and 0 otherwise

=cut

# ---------------------------------------------------------------------
sub full_text_query
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'full_text_query'});
}
# ---------------------------------------------------------------------

=item search_only_text_query

Description returns 1 if this is a search only query and 0 otherwise

=cut

# ---------------------------------------------------------------------
sub search_only_query
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'search_only_query'});
}

# ---------------------------------------------------------------------

=item rows_requested

Description

=cut

# ---------------------------------------------------------------------
sub rows_requested
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'solr_num_rows'} > 0);
}

# ---------------------------------------------------------------------

=item get_start_row

Description

=cut

# ---------------------------------------------------------------------
sub get_start_row
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return $query_config{'solr_start_row'};
}

# ---------------------------------------------------------------------

=item get_solr_num_rows

Description

=cut

# ---------------------------------------------------------------------
sub get_solr_num_rows
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return $query_config{'solr_num_rows'};
}

# ---------------------------------------------------------------------

=item cache_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub cache_Solr_query_string {
    my $self = shift;
    my $s = shift;
    $self->{'cachedsolrquerystring'} = $s;
}

# ---------------------------------------------------------------------

=item get_cached_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub get_cached_Solr_query_string {
    my $self = shift;
    return $self->{'cachedsolrquerystring'};
}

# ---------------------------------------------------------------------

=item get_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_query_string
{
    my $self = shift;
    my $C = shift;
    my $AB = shift;
    
    # Cache to avoid repeated MySQL calls in Access::Rights

    if ($self->get_cached_Solr_query_string()) {
        return $self->get_cached_Solr_query_string();
    }
    
    my $cgi = $C->get_object('CGI');
   
    # do we need to rename facet_config since it contains more than just facet config info?
    my $config = $self->get_facet_config;  
    
    # get date type (date|both) both = enum cron date if exists otherwise bib date
    my $date_type= $self->get_date_type;

    #advanced search foobar
    #XXX consider refactoring and putting in subroutine
    # remove facet_lang or facet_format = "All" in case javascript did not work
    if(defined ($cgi->param('facet_lang')) || defined ($cgi->param('facet_format')))
    {
        $cgi =__remove_All($cgi);
    }
    

    my $ADVANCED= "";

    #  if there is a q1 with a single asterisk bypass all other processing and do an everything search
    my $q1 =$cgi->param('q1');
    if ($q1 =~/^\s*\*\s*$/)
    {
        $ADVANCED='*:*';
        # set various stuff to a-OK
        $self->set_unbalanced_quotes(0,1);
        $self->set_processed_query_string('* = EVERYTHING',1);
        $self->set_was_valid_boolean_expression(1);
        $self->set_well_formed(1,1);   
    }
    else
    {
        $ADVANCED = $self->__get_advanced_query($cgi,$AB);
    }
   # XXX   hack here for A/B just replacing ocr field with proper scoring field
    #
    # my $B_rank_type= $cgi->param('b');
    # $B_rank_type='bm25'; #XXX hardcoded for debugging
    
    # if ($AB eq "B" && defined ($B_rank_type))
    # {
    #     $ADVANCED =~s/ocronly/$B_rank_type/g;
    #     $ADVANCED =~s/ocr/$B_rank_type/g;
    # }

  
    # The common Solr query parameters
    my $Q ='q=';
    my $FL = qq{&fl=title,title_c,volume_enumcron,vtitle,author,author2,mainauthor,date,rights,id,record_no,oclc,isbn,lccn,score};

#XXX temporary until Phil fixes ability to login and set debug flag

#    if (DEBUG('date,enum')) {
        $FL .= qq{,bothPublishDate,enumPublishDate};
 #   }

    my $VERSION = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $INDENT = $ENV{'TERM'} ? qq{&indent=on} : qq{&indent=off};

    # Paging: Solr doc number is 0-relative
    my ($solr_start, $solr_rows) = (0, 0);
    if ($self->rows_requested($C))
    {
        ($solr_start, $solr_rows) =
            ($self->get_start_row($C), $self->get_solr_num_rows($C));
    }

    my $START_ROWS = qq{&start=$solr_start&rows=$solr_rows};
    my $FQ = $self->__get_full_or_limited_filter_query($C);
    

# Facet aspects of query added here
#
#    if we implement show all facets by A-Z we need to set facet.sort param
#    but how does Blacklight implement paging?
    
    my $FACETS= $self->__get_facets;
    my $WRITER ='&wt=json&json.nl=arrarr';

    #WARNING  this can set an additional facet parameter on the cgi so must come before we figure out the facet query
    my $DATE_RANGE = $self->__get_date_range($C);    

    # 
    my $HELDBY="";
    my $holding_inst=$cgi->param('heldby');
    if (defined($holding_inst))
    {
        # do we need to clean this?
        $HELDBY = '&fq=ht_heldby:' . $holding_inst;
    }
    
    # This builds a filter query based on the values of the facet parameter(s) in the cgi
    my $FACETQUERY="";
    my @facetquery = $cgi->multi_param('facet');
    
    if (@facetquery)
    {
        foreach my $fquery (@facetquery)
        {
	    #change datequery to proper type if using date=both
	    if ($date_type eq "both" && $fquery=~/publishDateRange/ )
	    {
		$fquery=~s/publishDateRange/bothPublishDateRange/g;
	    }

            my $cleaned_fquery = $self->__clean_facet_query($fquery);
            $FACETQUERY.='&fq=' . $cleaned_fquery;
        }
    }
    
    # move this to subroutine that returns either empty string or good query
    my $FACET_OR_QUERY=$self->__get_facet_OR_query($cgi);

    
    
    # for temporary debugging of rel ranking
    #  Need a much better mechanisim

    my $EXPLAIN="";
    if (DEBUG('explain')) {
        $EXPLAIN='&debugQuery=on';
    }

    my $COLL='';

    if(defined ($cgi->param('c')))  {
	my $coll_id = $cgi->param('c');
	#check for empty or space only param
	$coll_id=~s/s+//g;
	if ($coll_id ne ''){
	    $COLL='&fq=coll_id:' . $coll_id;
	}
    }
    

    my $solr_query_string = $Q . $ADVANCED . $FL . $FQ .$HELDBY . $VERSION . $START_ROWS . $INDENT . $FACETS . $WRITER . $FACETQUERY .$FACET_OR_QUERY .$DATE_RANGE .  $EXPLAIN . $COLL;    
    
    # for debugging  we need a debug switch to hide the dismax stuff if we want it hidden
    #    my $solr_query_string = 'q=id:uc1.$b333205' . $WRITER;
    my $sq;     #solr_query_string with or without dismax
    if (DEBUG('nodismax')) 
    {
        $sq = $self->__hide_dismax($solr_query_string);
    }
    else
    {
        $sq = $solr_query_string;
    }
        
    DEBUG('all,query',
          sub
          {   my $s = $sq;
              Utils::map_chars_to_cers(\$s) if Debug::DUtils::under_server();
              return qq{Solr query="$s"}
          });

    $self->cache_Solr_query_string($solr_query_string);

    return $solr_query_string;
}
#====================
# START REFACTOR tbw foobar
# XXX copied from slip-lib/Search/Query   when done testing
# remove and move refactored stuff there

# ---------------------------------------------------------------------
# ---------------------------------------------------------------------

=item get_Solr_fulltext_filter_query

Construct a full filter query (fq) informed by the
authentication and holdings environment.
tbw added code to add items from a specified collection to the full-text tab on January 1, 2019 (configurable) 

=cut


# ---------------------------------------------------------------------

sub __get_Solr_fulltext_filter_query {
    my $self = shift;
    my $C = shift;
    
    my $full_fulltext_FQ_string = 'fq=' . $self->__HELPER_get_Solr_fulltext_filter_query_arg($C);

    DEBUG('query', qq{<font color="blue">FQ: </font>$full_fulltext_FQ_string});
    return $full_fulltext_FQ_string;
}



# ---------------------------------------------------------------------
# ---------------------------------------------------------------------

=item __HELPER_get_Solr_fulltext_filter_query_arg

Construct the clause to a filter query (fq) informed by the
authentication, institution and holdings environment. Construction
varies:

There are two cases that turn on attr:3 (OP)

1) The SSD user query only requires holdings because OP implies IC so
their query is e.g. 

fq=((rights:1+OR+rights:7+OR+...)+OR+(ht_heldby:inst+AND+attr:3)+OR+(ht_heldby:inst+AND+attr:4))

2) HT affiliates or in-library users require holdings AND brittle so their query is e.g.

fq=((rights:1+OR+rights:7+OR+...)+OR+(ht_heldby_brlm:inst+AND+attr:3)+OR+(ht_heldby:inst+AND+attr:4))

=cut

# ---------------------------------------------------------------------

# ---------------------------------------------------------------------
sub __HELPER_get_Solr_fulltext_filter_query_arg {
    my $self = shift;
    my $C = shift;
    
    # These are the attrs, for this users authorization type
    # (e.g. SSD, HT affiliate, in-library), geo location and
    # institution that equate to the 'allow' status, i.e. fulltext.
    # This code takes into account whether the attr requires
    # institution to hold the volumes, whether the holding have to be
    # brittle, and qualifies accordingly.
    my $fulltext_attr_list_ref = Access::Rights::get_fulltext_attr_list($C);

    # unqualified string = OR query clause for rights attributes that don't need to be combined with holdings
    # holdings_qualified_attr_list = list of rights attr for this user/ip or other conditions that must be qualified by holdings
    
    my ($holdings_qualified_attr_list,  $unqualified_string) = $self->__get_holdings_qualified_attr_list_and_unqualified_string($fulltext_attr_list_ref);

    
    # Now qualify by holdings.  If there is no institution, there
    # cannot be a clause qualified by institution holdings at all.
    my $holdings_qualified_string;
    my $inst = $C->get_object('Auth')->get_institution_code($C, 'mapped');
    if ($inst)
    {
	$holdings_qualified_string = $self->__get_holdings_qualified_string($C, $holdings_qualified_attr_list, $inst);
    }
    my $fulltext_FQ_string;
    
    if ($holdings_qualified_string)
    {
     	$fulltext_FQ_string = '(' . $unqualified_string . '+OR+' . $holdings_qualified_string . ')';
    }
    else
    {
	$fulltext_FQ_string = '(' . $unqualified_string . ')';
    }
    

    #XXX todo  make same fix for string below and ternary operator
    
    #tbw code to get items that will go from IC to PD on New Years day see:https://tools.lib.umich.edu/jira/browse/HT-769
    
    if ($self-> __now_in_date_range_new_years($C))
    {
	my $new_years_pd_Q_string =$self->__get_new_years_pd_Q_string($C);
        $fulltext_FQ_string = '(' . $unqualified_string . ($holdings_qualified_string ? '+OR+' . $holdings_qualified_string : '') . '+OR+'. $new_years_pd_Q_string . ')';
    }
    
    return $fulltext_FQ_string;
}
#----------------------------------------------------------------------
sub __get_holdings_qualified_attr_list_and_unqualified_string
{
    my $self = shift;
    my $fulltext_attr_list_ref = shift;
    my @unqualified_attr_list = @$fulltext_attr_list_ref;
    my @holdings_qualified_attr_list = ();
	
    # Remove any attributes that must be qualified by holdings of the
    # user's institution
    foreach my $fulltext_attr (@$fulltext_attr_list_ref) {
        if (grep(/^$fulltext_attr$/, @RightsGlobals::g_access_requires_holdings_attribute_values)) {
            push(@holdings_qualified_attr_list, $fulltext_attr);
            @unqualified_attr_list = grep(! /^$fulltext_attr$/, @unqualified_attr_list);
        }
    }
    
    my $unqualified_string = '';
    if (scalar @unqualified_attr_list) {
        $unqualified_string = 
	'(rights:(' . join('+OR+', @unqualified_attr_list) . '))';
    }
    return( \@holdings_qualified_attr_list,  $unqualified_string)
}

#----------------------------------------------------------------------
sub __get_holdings_qualified_string
{
    my $self = shift;
    my $C    = shift;
    my $holdings_qualified_attr_list = shift;
    my $inst = shift;
    my $holdings_qualified_string = '';
    
    # @OPB

    my @qualified_OR_clauses = ();
    my $access_type = Access::Rights::get_access_type_determination($C);
	
    foreach my $attr (@{$holdings_qualified_attr_list}) {
	if (($access_type ne $RightsGlobals::SSD_USER)
	    &&
	    ($attr eq $RightsGlobals::g_access_requires_brittle_holdings_attribute_value)) {
	    push(@qualified_OR_clauses, qq{(ht_heldby_brlm:$inst+AND+rights:$attr)});
	}
	else {
	    push(@qualified_OR_clauses, qq{(ht_heldby:$inst+AND+rights:$attr)});
	}
    }
#FIXME
    $holdings_qualified_string = (scalar @qualified_OR_clauses) ? '(' . join('+OR+', @qualified_OR_clauses) . ')' : '';
    
    return $holdings_qualified_string;
}
#----------------------------------------------------------------------


# ---------------------------------------------------------------------


# END REFACTOR tbw foobar
#======================================================================
#----------------------------------------------------------------------
#
#  If javascript does not remove the "All" value from facet_lang or facet_format
#  we remove it here
#
sub __remove_All
{
    my $cgi = shift;
            
    my @lang = $cgi->multi_param('facet_lang');        
    my @format = $cgi->multi_param('facet_format');        
    my ($wasAll,$lang_cleaned) = __clean_all(\@lang);
    if ($wasAll)
    {
        $cgi->delete('facet_lang');
        $cgi->param('facet_lang',@{$lang_cleaned});
    }
    my $format_cleaned;
    
    ($wasAll, $format_cleaned) = __clean_all(\@format);
    if ($wasAll)
    {
        $cgi->delete('facet_format');
        $cgi->param('facet_format',@{$format_cleaned});
    }
    return $cgi;
}

#----------------------------------------------------------------------
#  removes "All" from array and indicates if All was found
#
sub __clean_all
{
    my $aryref=shift;
    my $cleaned=[];
    my $wasAll;
    
    foreach my $value (@{$aryref})
    {
	if ($value=~/All$/)
        {
            $wasAll="true";
        }
        else
        {
            push (@{$cleaned},$value);
        }
        
    }
    return ($wasAll,$cleaned);
}


#----------------------------------------------------------------------
#
#  __get_full_or_limited_filter_query
#
#      filter query (fq) for Full text or search only
#      based on holdings 
# ---------------------------------------------------------------------
sub __get_full_or_limited_filter_query
{

    my $self = shift;
    my $C    = shift;
    
    my $query_type=$self->get_query_type($C);
        
    my $FQ = '';
    my $RQuery;
    my $attr_list_aryref;    

    if ( $query_type ne 'all') {
        if ( $query_type eq 'search_only') 
        {
            $RQuery = $self->get_Solr_no_fulltext_filter_query($C);
        }
        elsif ( $query_type eq 'full_text') 
        {
            $RQuery = $self->get_Solr_fulltext_filter_query($C);
        }
        else
        {
            ASSERT(0,qq{LS::Query::Facets::get_solr_query_string: wrong query type $query_type});
        }
    }
    
    $FQ = '&' . $RQuery;
    
    DEBUG('rights',
          sub
          {  
              my $rq = qq{Solr rights query="$query_type = $FQ"};
              Utils::map_chars_to_cers(\$rq) if Debug::DUtils::under_server();
              return $rq;
              
          });

    return $FQ;
}

# ---------------------------------------------------------------------

sub __get_facet_OR_query
{
    my $self = shift;
    my $cgi = shift;
    
    my $query ="";
    
    my @lang= $cgi->multi_param('facet_lang');
    my @format = $cgi->multi_param('facet_format');
    my $clause1;
    my $clause2;

    my   $clause1 = $self->__getClause(\@lang);
    my   $clause2 = $self->__getClause(\@format);
    $query = $clause1 . $clause2;
    
    return $query;
}

sub __getClause
{
    my $self = shift;
    my $ary = shift;

    
    if (! defined($ary)|| scalar(@{$ary})<1 )
    {
        # return blank
        return "";
    }
    my $clause;
    my $field;
    
    foreach my $fquery (@{$ary})
    {
        my $cleaned_fquery = $self->__clean_facet_query($fquery);
        my @rest;
        ($field,@rest)=split(/\:/,$cleaned_fquery);
        my $string=join(':',@rest);
        # &fq=language:( foo OR bar OR baz)
        $clause.= $string . " OR ";
    }
    # remove last OR and add &fq=field:
    $clause =~s/OR\s*$//g;
    $clause='&fq=' . $field . ':(' . $clause . ' )';

    
    return $clause;
}

#foobar       

    #if (@facetquery)
#    {
#        foreach my $fquery (@facetquery)
#        {
#            my $cleaned_fquery = $self->__clean_facet_query($fquery);
#            $FACETQUERY.='&fq=' . $cleaned_fquery;
#        }
#    }

#}


# ---------------------------------------------------------------------

sub __clean_facet_query
{
    my $self = shift;
    my $fquery = shift;
    
    my $cleaned;
    #facet=language:%22German%22
    my ($field,@rest)=split(/\:/,$fquery);
    my $string=join(':',@rest);
    # remove leading and trailing quotes
    $string=~s/^\"//;
    $string=~s/\"$//;
    #XXX order dependent.  Must remove escape backslashes in string before adding backslashes to double or single quotes
    # backslash
    $string=~s/\\/\\\\/g;  

  # back slash escape any quotes or backslashes
    # XXX what about other lucene chars?
    $string=~s/\"/\\\"/g;
    #single quotes
   # $string=~s/\'/\\\'/g;  
  
    # replace leading and trailing quotes
    $string = '"'. $string . '"';
        
    Utils::remap_cers_to_chars(\$string);
    # XXX Need to hex escape question mark and then protect it with a backslash, note Solr is ok if fed a question mark
    # code in Search::Searcher::__get_request_object splits a URL on "?" so leaving a non-hex-escaped queston mark
    # will cause the split to truncate the query. uri escape will take care of it
  
    # Note: facet fields mostly? all? type string which is not analyzed
    # So we should hexencode url chars and then escape the rest
    # Lucene special chars are: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
    # dismax seems to not have problems with lucene special chars in fq esp if they are url encoded
    my $escaped_string=URI::Escape::uri_escape_utf8($string);
    
    $cleaned=$field . ':' . $escaped_string;
    return $cleaned;
}



# ---------------------------------------------------------------------
# __process_qa_query
#
#  If query is produced by javascript widget decode it
#
#
#
# ---------------------------------------------------------------------
sub __process_qa_query
{
}


# ---------------------------------------------------------------------
# __get_advanced_query
#
# 
#
# ---------------------------------------------------------------------
sub __get_advanced_query
{
    my $self = shift;
    my $cgi = shift;
    my $AB  = shift;
    my $ADVANCED="";
    
    #There is no longer any op1  the number of the op goes with the number of the query
    my $q;
    my $clause;
    my $Q;
    my @clause_ary = ();
    my @op_ary = ();
    my $op;
    

    if (defined $cgi->param('qa'))
    {
       $ADVANCED = $self->_process_qa_query($cgi);
        
    }
    else{
        for my $i (1..4)
        {
            $q = 'q' . $i;
            # do we also want to check for a defined but blank query?
            if (defined $cgi->param($q))
            {
                $clause_ary[$i] = $self-> make_query_clause($i,$cgi,$AB);
            }
            $op = 'op' . $i;
            $op_ary[$i] =$cgi->param($op); 
        }
        # string clauses together with proper parens 
        # and move cleanup stuff here
        # (q1 and/or q2) op3 (q3 and/or q4)
        if (scalar(@clause_ary) == 1)
        {
            $ADVANCED = $clause_ary[0];
        }
        else
        {
            $ADVANCED = $self->getParenQuery(\@clause_ary,\@op_ary);
        }
        
        # XXX move this into sub above
        $ADVANCED=~s/^\s+/ /;
    }
    #remove operator from beginning of query string if there is one
    # i.e. if user unselects row 1
    #XXX move this into getParenQuery
    $ADVANCED=~s/^\s*(AND|OR|NOT)//;
    return $ADVANCED;
}

# ---------------------------------------------------------------------
# do we also check that field1, and op1 are defined and reasonable or provide defaults
#
#  Note special case handling if there is a q1 that automatically deals with op and field
# so we can actually implement regular search as if it is an advanced search
#

sub make_query_clause{
    my $self = shift;
    my $i    = shift;
    my $cgi  = shift;
    my $AB   = shift;
    
    my $q     = $cgi->param('q' . $i);
    my $field = $cgi->param('field' . $i);
    my $anyall = $cgi->param('anyall' . $i);
    
    
    # default to ocr if there is not field for field 1
    if ($i ==1 && (!defined($field))  )
    {
        $field='ocr';
    }
    #XXX is this what we want?
    if (!defined($field))
    {
        return "";
    }
    #XXX this is in middle of a for i loop!!!
    my $processed_user_query_string = $self->process_query($q,$i,$anyall);
    Utils::remap_cers_to_chars(\$processed_user_query_string);
    
    DEBUG('query_q',
          sub
          {   my $s = $processed_user_query_string;
              Utils::map_chars_to_cers(\$s, [q{"}, q{'}], 1) if Debug::DUtils::under_server();
              return qq{Solr query q $i ="$s"}
          });
    
    $processed_user_query_string = uri_escape_utf8( $processed_user_query_string );
    
    DEBUG('query_uri',
          sub
          {   my $s = $processed_user_query_string;
              return qq{Solr query q $i ="$s"}
          });
    

    

    my $config = $self->get_facet_config;    
    
    my $field_hash = $config->get_param_2_solr_map;
    # do we need something more user friendly than an assert out?
    ASSERT (defined ($field_hash->{$field} ),qq{LS::Query::Facets: $field is not a legal type of field});
    my $solr_field = $field_hash->{$field};

#    my $weights = $config->get_weights_for_field($solr_field);
    my $weights = $config->get_weights_for_field($solr_field,$AB);    

    my $qf = $self->dismax_2_string($weights->{'qf'});
    my $pf = $self->dismax_2_string($weights->{'pf'});
    my $pf3;
    my $pf2;
    
    if ($field =~/ocrpf/)
    {
        $pf3= $self->dismax_2_string($weights->{'pf3'});
        $pf2= $self->dismax_2_string($weights->{'pf2'});
    }
    
    my $mm = $weights->{'mm'};
       
    my $tie=$weights->{'tie'};
    $mm =~s,\%,\%25,g; #url encode any percent sign should this be a named sub? 

  
    my $QF = qq{ qf='} . $qf . qq{' };

    my $PF = qq{ pf='} . $pf . qq{' };
    #XXX with pf 2 and 3.  XXX need to write this so we only put these in if they are in the config  Should test individually for definded $pf2 and $pf3 Current code assumes both defined if
#pf2 exists
    if (defined ($pf2))
    {
        $PF = qq{ pf='} . $pf . qq{' } . qq{ pf3='} . $pf3 . qq{' } .qq{ pf2='} . $pf2 . qq{' };
    }
    
    my $MM = qq{ mm='} . $mm . qq{' };
    my $TIE = qq{ tie='} . $tie . qq{' };

    my $QUERY_STRING = $processed_user_query_string;    
    my $Q;
    
    
    $Q= ' '.  '_query_:"{!edismax' . $QF . $PF . $MM .$TIE  . '} ' .  $QUERY_STRING .'"';

    return $Q;
    
}

# ---------------------------------------------------------------------
sub getParenQuery
{
    my $self = shift;
    my $clause_ary    = shift;
    my $op_ary  = shift;
    my $parenQ;
    my $advanced;
    
    my $query_group_1 = __make_group(1,$clause_ary,$op_ary); # q1 and q2
    my $query_group_2 = __make_group(3,$clause_ary,$op_ary); # q3 and q4
    my $paren_1 = ' ( ' . $query_group_1 . ' ) ';
    my $paren_2 = ' ( ' . $query_group_2 . ' ) ';
    
    if ($query_group_1 =~/\S/ )
    {
        if  ($query_group_2 =~/\S/)
        {
            # if both have at least one non-blank character 
            $advanced = $paren_1 . $op_ary->[3] . $paren_2;
        }
        else
        {
            $advanced = ' ' . $query_group_1 .' ';
        }
    }
    else
    {
        $advanced = ' ' . $query_group_2 .' ';
    }
    
    return $advanced;
}
# ---------------------------------------------------------------------

#   q1 op q2
#    just q1 or just q2
#   

sub __make_group
{
    my $start = shift;
    my $clause_ary = shift;
    my $op_ary = shift;
    my $group;
    my $op;
    
    # do we need to test for non-blank not just defined?
    if (defined ($clause_ary->[$start]) && defined ($clause_ary->[$start+1]))
    {
        for my $i ($start, $start+1)
        {
            #hard-coded to only look at op2 or op 4
            if ($i == 2 || $i == 4)
            {
                $op = $op_ary->[$i];
            }
        }
        $group = $clause_ary->[$start] . ' '. $op . ' ' . $clause_ary->[$start+1] ;        
    }
    else
    {
        for my $i ($start, $start+1)
        {
            if (defined ($clause_ary->[$i]))
            {
                $group = $clause_ary->[$i];
            }
        }
    }
    # remove any leading or trailing spaces?
    return $group;
}

# ---------------------------------------------------------------------
sub process_query
{
    my $self = shift;
    my $q = shift;    
    my $i = shift;
    my $anyall = shift;

    my $processed_q =$self->get_processed_user_query_string($q,$i);
    # if query was not valid change the anyall operator to all
    if (! $self->well_formed->[$i])
    {
        $anyall='all';
    }
            
    #XXX  clean query above so we can assume balenced quotes and any operators are ok
    #XXX WARNING  but the above has the effect of ignoring the anyall operator right??
    #  insert   any|all|phrase processing  might move to subroutine
    #XXX test for Boolean operators.  If there are any then we ignore anyall
    # This may change if UX changes mind
    # this should be subroutine if (isBoolean) or something
    my $isBoolean;

    # "AND" or "OR" must be surrounded by spaces otherwise we match "FOR" or "WAND"
    if ($processed_q=~/\s+(AND|OR)\s+/)
    {
        $isBoolean="true";
    }
    #XXX check for leading + or -


    #XXX do we want to actually reset the cgi parameter anyall so the user message will mention "as a phrase"?
    # if entire q is quoted and there are no other quotes, treat as if its a phrase query i.e. set anyall = phrase
    #check for leading and trailing quotes    # and no other quotes
    # once we set anyall to phrase, we need to remove the quotes so we don't double quote later in processing
    if ($processed_q=~/^\".+\"$/)
    {
        my $num_quotes = $processed_q =~ tr/"//;
        if ($num_quotes == 2)
        {
            $anyall='phrase';
            $processed_q=~s,",,g;
            
        }
        
    }

    
    if (defined($anyall) && (!defined($isBoolean)) )
    {
        if ($anyall ne "all")
        {
            if ($anyall eq "phrase")
            {
                #XXX what if already has quotes around whole phrase?
                # what if something like "dog food" AND cat
                $processed_q = "\"" . $processed_q . "\"";
                
            }
            elsif ($anyall eq "any")
            {
                $processed_q = $self-> __convert_to_Boolean_OR($processed_q);
            }
            
        }
        
    }
    
    
   
    #XXX temporary fix until we refactor Search::Query::_get_processed_user_query_string
    # remove any string consisting only of ascii punctuation
    # Why is this here?  
    # Turns out we need this because of the dismax bug
    # http://bibwild.wordpress.com/2011/06/15/more-dismax-gotchas-varying-field-analysis-and-mm/
    $processed_q = $self->remove_tokens_with_only_punctuation($processed_q);
    
    my $boolean_q= $processed_q;
    #XXX What is the code/subroutine/note below about??
    # only use below if dismax is not working right
#    my $boolean_q = $self->__get_boolean_query($processed_q)   ;
    
    #XXX does the following need to happen before or after booleanizing the query
    #XXX current processing will remove unbalenced quotes but leave in balenced quotes
    # since the dismax query needs to be quoted, we need to escape any quotes in the query
    #  ie  "foo" => \"foo\"
    $boolean_q =~s,\",\\\",g;
    return $boolean_q;
    
}
#----------------------------------------------------------------------


#XXX need to not split up words within quotes
# i.e.  [unique "New York"] should be [unique OR "New York"] not [unique OR New OR York]

#XXX hacked copied version of Search::Query::parse_preprocess used to only insert OR if not inside quotes

sub __convert_to_Boolean_OR
{
    my $self = shift;
    my $q = shift;
    
    my $query = $q;
    my @token_array = ();

    # Set parens off from operands for parsing ease
    $query =~ s,\(, \( ,g;
    $query =~ s,\), \) ,g;

    Utils::trim_spaces(\$query);
    my @PreTokens = split(/\s+/, $query);

    # 
    # XXX We assume balanced quotes at this point in the processing.
    #  Probably should run query through parse_preprocess is valid first!
    while (1) {
        my $t = shift @PreTokens;
        last if (! $t);
        if ($t =~ m,^",) {
            my $quote;
            $quote .= $t;#suppress_boolean_in_phrase($t);
            while (($t !~ m,"$,) && ($t)) {
                $t =  shift @PreTokens;
                $quote .= " $t";#suppress_boolean_in_phrase($t);
            }
            push(@token_array, $quote);
        }
        else {

            push(@token_array, $t);
        }
        push(@token_array, "OR");
    }
    my $q=join(" ",@token_array);
    
    # return @token_array;
   # $q =~s/\s+/ OR /g;
    #$q = '( ' . $q .' )';
     #remove last OR
    $q=~s/OR$//;
    
    return $q;
}





# ---------------------------------------------------------------------
#  
# ---------------------------------------------------------------------
sub remove_tokens_with_only_punctuation
{
    my $self = shift;
    my $q = shift;
    Utils::remap_cers_to_chars(\$q);
    my $pq;
    
    my @tokens = split(/\s+/,$q);
    my @out=();
    
    #XXX We remove any punctuation including a lone ampersand because of the dismax bug
    # http://bibwild.wordpress.com/2011/06/15/more-dismax-gotchas-varying-field-analysis-and-mm/
    # There may be another reason, so if dismax bug is fixed need to verify that we don't need this!

    my $regex=qr/
                 [\-
                 \`
                 ~
                 !
                 @
                 \#
                 \$
                 \%
                 \^
                 &
                 \*
                 \_
                 \+
                 =
                 \\
                 \|
                 \]
                 \}
                 \[
                 \{
                 \'
                 \"
                 \;
                 \:
                 \/
                 \?
                 \.
                 \>
                 \,\<
                ]/x;
    

    foreach my $token (@tokens)
    {
        # if token has at least one character not in ascii punctuation
        
        if ($token =~/$regex/)
        {
            my $temp = $token;
            # remove ascii punct
            while ($temp =~s/$regex//g)        { }
            
            if ($temp =~/^\s*$/)
            {
                # if after removing all ascii punctuation we have nothing or nothing but spaces then don't output token
            }
            else
            {
                push (@out,$token);
            }
        }
        else
        {
            push (@out,$token);
        }
    }
    $pq = join (' ',@out);
    
    Utils::map_chars_to_cers(\$pq, [q{"}, q{'}], 1);
        
    return $pq;
}

#----------------------------------------------------------------------

sub dismax_2_string
{
    my $self = shift;
    
    my $aryref = shift;
    my $string;
    
    foreach my $el (@{$aryref})
    {
        my $field=$el->[0];
        my $weight=$el->[1];
        $string.=$field . '^' . $weight . '+'; 
    }
    return $string;
}
# ---------------------------------------------------------------------w
sub __hide_dismax
{
    my $self = shift;
    my $sq = shift;  #solr query string
    # try to just include the first dismax param so we can see which one?
    $sq =~s ,_query_\:,,g;
    $sq =~s,\{\![^\}]+\},dismax,g;
    
    return $sq;
#     _query_:"{!edismax ...}
}

# ---------------------------------------------------------------------w

#----------------------------------------------------------------------
#
#  __get_date_range($cgi);
#
#      filter query (fq) for date ranges 

# XXX Dec 2104 tbw need to parameterize name of facet
# i.e. publishDateRange and publishDateTrie could be enumPub... or bothPub...
# ---------------------------------------------------------------------
sub __get_date_range
{
    my $self = shift;
    my $C = shift;
    my $cgi = $C->get_object('CGI');

    my $config = $self->get_facet_config;  
    # get date type (date|both) both = enum cron date if exists otherwise bib date
    my $date_type=$self->get_date_type;
    

    my $date_range_facet='publishDateRange';
    my $date_trie_facet ='publishDateTrie';
    if ($date_type eq "both")
    {
	$date_range_facet='bothPublishDateRange';
	$date_trie_facet ='bothPublishDateTrie';
    }
    
    
    my $q="";
    my $fq="";
    
    my $start = $cgi->param('pdate_start');
    my $end =   $cgi->param('pdate_end');
    my $pdate = $cgi->param('pdate');
    # do we need to trim these values?

    my $facet;
    
    
    if (defined($pdate) && $pdate ne "")
    {
        $facet="$date_range_facet" . ':"' . $pdate . '"';
        #remove pdate param
        $cgi->delete('pdate');
        # remove the other pdate params since we can only either have a pdate or a date range from the advanced search form
        $cgi->delete('pdate_start');
        $cgi->delete('pdate_end');
        # set cgi param facet since a single date is the same
        $cgi->append(-name=>'facet',-values=>[$facet]);
        $C->set_object('CGI',$cgi);
        
        return $q
    }
    elsif ( (defined($start)&& $start ne "")    || (defined($end) && $end ne "") )
    {
        if ($start eq "")
        {
            $start='*';
        }
        elsif ($end eq "")
        {
            $end = '*';
        }
        
        $fq="$date_trie_facet" . ':[ ' . $start . ' TO ' . $end . ' ]'; 
    }
    
    $q='&fq=' . $fq;
    
    return  $q;
    
}

#XXX below is very buggy needs work!!
sub isUndefOrBlank
{
    my $var = shift;
    $var=s/\s+//g;
    return ( (!defined($var)) || $var eq "")
}

# ---------------------------------------------------------------------

# XXX think about how this might be refactored to also allow Blacklight style showing paged,sorted values for a particular facet
# or is that a different api call?
# ---------------------------------------------------------------------
sub __get_facets
{
    my $self = shift;
    my $FACETS;
    my $facet_config = $self->get_facet_config;
    my $FACET_LIMIT=$facet_config->get_facet_limit;
    
    my $facetfields = $facet_config->get_facet_order();    
    my $FACET_FIELDS;
    my $date_type = $self->get_date_type;
    
    foreach my $field (@{$facetfields})
    {
	#date fix
	if ($field eq "publishDateRange" && $date_type eq 'both')
	{
	    $field = 'bothPublishDateRange';
	}
		
        $FACET_FIELDS .='&facet.field=' . $field;
    }
    
    $FACETS .='&facet.mincount=1&facet=true&facet.limit='. $FACET_LIMIT . $FACET_FIELDS;
    return $FACETS;
}


# ---------------------------------------------------------------------

=item get_Solr_internal_query_string

Expects a well-formed Lucene query from the calling code

=cut

# ---------------------------------------------------------------------
sub get_Solr_internal_query_string
{
    my $self = shift;

    # Solr right stemmed query strings have to be lowercase
    my $query_string = lc($self->get_query_string());

    my $INTERN_Q = qq{q=$query_string};
    my $FL = qq{&fl=*,score};
    my $VERSION = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $START_ROWS = qq{&start=0&rows=1000000};
    my $INDENT = qq{&indent=off};

    # q=id:123&fl=*,score&$version=2.2,&start=0&rows=1000000&indent=off
    my $solr_query_string =
        $INTERN_Q . $FL . $VERSION . $START_ROWS . $INDENT;

    return $solr_query_string;
}

# ---------------------------------------------------------------------

=item __get_boolean_query

Since dismax and edismax don't seem to honor the default query operator, we need to convert queries to AND queries
WARNING! need to be careful with quotes and input AND queries
WARNING! currently makes assumptions about query being run through base class 
Search::Query::get_processed_user_query_string


=cut



# ---------------------------------------------------------------------
sub __get_boolean_query
{
    my $self = shift;
    my $q = shift;
    
    my $bq =$q;
    # remove leading and trailing spaces
    $bq =~s,^\s+,,g;
    $bq =~s,\s+$,,g;

    # for now if the query contains an allowed boolean operator, don't mess with it
    # later we might try being more sophisticated and ANDing any two words
    # We operate with these assumptions about the query being run through Search::Query::get_processed_user_query_strin
    #    1 At this point double quotes are balanced. Lower-case AND|OR
    #      embedded in phrases and replace phrase-embedded parentheses with
    #       spaces.
    #    2   process_user_query in base class  already removed any plus or minus that is not leading a word

    # put a couple of assertions here asserting our assumptions aobut what Search::Query did
    
    # there should be no upper case AND|OR inside of quotes
    if ($q=~/\"[^\"]*(AND|OR)[^\"]*\"/)
    {
        ASSERT(0,qq{boolean in caps inside phrase});
    }

    if ($bq=~/AND|OR|\+|\-/)
    {
        #leave it alone for now
        #XXX TODO: look at modifying handle_phrases to deal with these properly
    }
    elsif ($bq =~ /\"/)
    {
        $bq = __handle_phrases($bq);
    }        
    else
    {
        $bq =~s,\s+, AND ,g;
    }
    
    #replace multiple spaces with single spaces
    $bq =~s,\s+, ,g;
    
    return $bq;
}
#----------------------------------------------------------------------
sub __handle_phrases
{
    my $q = shift;
    my $bq=$q;
    my @tokens = split(/\s+/,$bq);
    
    my $INQUOTE = "false";
    my $out;
    
    foreach my $token (@tokens)
    {
        if ($token =~/\"/)
        {
            if ($INQUOTE eq "true")
            {
                $INQUOTE = "false";
                $out .= " $token AND ";
            }
            else
            {
                $INQUOTE = "true";
                 $out .= " $token "
            }
        }
        else
        {
            if ($INQUOTE eq "true")
            {
                $out .= " " . $token;
            }
            else
            {
                $out .="$token AND ";
            }
        }
    }
    # remove any leading or tailing AND
    $out =~s/^\s*AND\s*//g;
    $out =~s/\s*AND\s*$//g;
    
    return $out;
}
#----------------------------------------------------------------------
#XXX hack to store/use processed user query for q1-4 instead of just q1
#XXX  After this is working migrate appropriate parts to base class slip-lib/Search::Query


=item get_processed_user_query_string

Perform some common ops on the user query string to make it work with
Solr.  Support for very simple useer entered queries

1) '"' chars must be balanced or the query is treated as without '"'

2) leading "+" and "-" are supported

3) stemming via "*" is supported

NOTE: as of Tue Nov 17 13:26:52 2009, stemming is causing timeouts in
the 12/4 configuration.  Not supported

NOTE: as of Fri Dec 4 12:21:44 2009 AND|OR and "(", ")" balanced
parentheses are supported. However, if a boolean query si not a
well-formed formula, all operators and parens are removed. This means
the query will devolve to the default AND query.

4) All other punctuation is _removed_

5) added code to allow query string as an argument for advanced search
processing (tbw)

=cut

# ---------------------------------------------------------------------
sub get_processed_user_query_string {
    my $self = shift;
    my $query_string = shift;
    my $query_num = shift;
    
    my $user_query_string;

    if (defined ($query_string))
    {
        $user_query_string= $query_string;
    }
    else
    {
        $user_query_string = $self->get_query_string();
    }

    #XXX this is inside of filter_lucene_chars in Query.pm in slip-lib.  Consider redoing?

    # Replace sequences of 2 or more double-quotes (") with a single
    # double-quote
    $user_query_string =~ s,["]+,",g;
    # Remove all double-quote (") if any are unbalanced
    #XXX should probably set separate unbalenced quote indicator for better error message
    my $num_chars = $user_query_string =~ tr/"//;
    if ($num_chars % 2)
    {
        $user_query_string =~ s,", ,g;
        $self->set_unbalanced_quotes(1,$query_num);
        $self->set_processed_query_string($user_query_string,$query_num);
    }
    else
    {
        $self->set_unbalanced_quotes(0,$query_num);
    }
    


    $user_query_string = $self->filter_lucene_chars($user_query_string);
    

    # At this point double quotes are balanced. Lower-case AND|OR
    # embedded in phrases and replace phrase-embedded parentheses with
    # spaces.
    
    # if user searches for [pride and prejudice] don't treat the "and" as an operator unless
    # it is upper case and the query is not all upper case
    #XXX temp fix until we change schema
    $user_query_string = $self->escapeNonBooleanAndOR($user_query_string,$query_num);
    my @tokens = Search::Query::parse_preprocess($user_query_string);


    # XXX check Phil/s code, do we need to add parens?
    # If user is not attempting a boolean query skip the parse here
    #    if (grep(/^(AND|OR|\(|\))$/, @tokens)) {
    my $valid = 1;
    if (grep(/^(AND|OR)$/, @tokens)) {
        # Attempt to parse the query as a boolean expression.
        $valid = Search::Query::valid_boolean_expression(@tokens);
        if ($valid) {
            $self->set_was_valid_boolean_expression($query_num);
        }
    }

    if (! $valid) {
        $self->set_well_formed(0,$query_num);

        # The parse fails. remove parentheses and lower case _all_
        # occurrences of AND|OR and compose a default AND query.
        my @final_tokens = ();
        foreach my $t (@tokens) {
            my $f = get_final_token($t);
            push(@final_tokens, $f) if ($f);
        }
        $user_query_string = join(' ', @final_tokens);
    }
    else {
        $self->set_well_formed(1,$query_num);
    }

    $self->set_processed_query_string($user_query_string,$query_num);
    my $debug_user_query_string = $user_query_string;
    DEBUG('parse', sub {
              Utils::map_chars_to_cers(\$debug_user_query_string) if Debug::DUtils::under_server();
              return qq{Final processed user query: $debug_user_query_string qnumber: $query_num}
          });

    return $user_query_string;
}

sub get_final_token {
    my $s = shift;
    if ($s =~ m,([\(\)]|^AND$|^OR$),) {
        return '';
    }
    return $s;
}


# ---------------------------------------------------------------------
sub escapeNonBooleanAndOR
{
    my $self = shift;
    my $user_query_string = shift;
    my $query_num =shift;
        
    
    #XXX temporary fix for edismax.  Move to subroutine!
    # won't need if we put following in the request handler for edismax
    # see bill email 4/11/2012
    # <bool name="lowercaseOperators">false</bool>
    

    if ($user_query_string =~/\s+(and|or)\s+/)
    {
        $user_query_string =~s,\s+and\s+, =and= ,g;
        $user_query_string =~s,\s+or\s+, =or= ,g;
        $self->set_processed_query_string($user_query_string,$query_num);    
    }
    
    # if all caps then assume not boolean and lower case
    # or we just lower case AND/OR

    if ($user_query_string =~/\s+AND\s+|\s+OR\s+/)
    {

        # If there is not  a single lower case character then its  all upper case
        if ($user_query_string =~/\p{Lowercase_Letter}/)
        {
            
        }
        else
        {
            #bug fix for CJK and other caseless scripts/languages
            # if after removing AND|OR there is an  upper case letter
            #then its not a caseless language so it is safe to do the transform
            # see $SDRROOT/ls/tests/newTest.pl i.e.   perl newTest.pl newdata.txt

            my $temp= $user_query_string;    
            $temp =~s,AND,,g;
            $temp =~s,OR,,g;
            if ($temp=~/(\p{Uppercase_Letter})/)
            {
                
                # lower case doesn't work with edismax so we surround op with "=" which then make qparser
                # think its a word but analyzer strips out the equals
                
                $user_query_string =~s,\s+AND\s+, =and= ,g;
                $user_query_string =~s,\s+OR\s+, =or= ,g;
            }
            
            $self->set_processed_query_string($user_query_string,$query_num);
        }
    }
    
    return $user_query_string
}


# ---------------------------------------------------------------------
sub filter_lucene_chars{
    my $self = shift;
    my $user_query_string = shift;

    Utils::remap_cers_to_chars(\$user_query_string);
    
    # stemming
    # stemming    # Asterisk (*) must follow wordchars and be followed by whitespace
    # stemming    # or EOL.  In other words, a free standing, leading or embedded *
    # stemming    # is ignored
    # stemming    while ($user_query_string =~ s,(\w)\*+(\w),$1 $2,){}
    # stemming    while ($user_query_string =~ s,(^|\s)\*+,$1,){}
    # stemming
    # stemming    # If any asterisk (*) remains, we have right stemming. Solr right
    # stemming    # stemmed query strings have to be lowercase
    # stemming    if ($user_query_string =~ m,\*,) {
    # stemming        $user_query_string = lc($user_query_string);
    # stemming    }
    # stemming
    
    # Temporarily disable stemming
    $user_query_string =~ s,\*, ,g;
    
    # Preserve only word-leading plus and minus (+) (-)
    # exception to punctuation rule for -"words in quotes"

    #protect quote
    $user_query_string=~s/\"/QUOTE_/g;
    #remove  "-+"
    while ($user_query_string =~ s,(^|\W)[-+]+(\W|$),$1 $2,){}
    #insert quote
    $user_query_string=~s/QUOTE_/\"/g;



    
    # Note: Lucene special chars are: + - && || ! ( ) { } [ ] ^ " ~ * ? : \

    # Note: See "stemming note" above. Except for + - * " ( ) special
    # chars are removed to prevent query parsing errors.  Other
    # punctuation, (e.g. ' . , @) is more likely to appear in normal
    # text) is left in place, (e.g. 1,000) because the
    # PunctFilterFactory will tokenize the punctuated term as a single
    # token whereas if we remove the punctuation, the query parser
    # will see 2 or more operands and perform a boolean AND which is
    # slow.
    $user_query_string =~ s/[!:?\[\]\\^{~}]/ /g;
    $user_query_string =~ s/\|\|/ /g;
    $user_query_string =~ s/\&\&/ /g;
           
    # Remove leading and trailing whitespace
    Utils::trim_spaces(\$user_query_string);

    # convert the xml special characters  < > & back to character entities
    Utils::map_chars_to_cers(\$user_query_string, [q{"}, q{'}], 1);

    return $user_query_string;
    
}


# ---------------------------------------------------------------------
sub set_unbalanced_quotes
{
    my $self = shift;
    my $unbalanced = shift;
    my $query_number = shift;
    $self->{'unbalanced_quotes'}->[$query_number] = $unbalanced;
}
# ---------------------------------------------------------------------
sub get_unbalanced_quotes
{
    my $self = shift;
    return $self->{'unbalanced_quotes'};
}

# ---------------------------------------------------------------------
# overide base class to deal with q1-4
# ---------------------------------------------------------------------
sub set_well_formed {
    my $self = shift;
    my $well_formed = shift;
    my $query_number = shift;
    $self->{'wellformedformula'}->[$query_number] = $well_formed;
}

# ---------------------------------------------------------------------
sub well_formed {
    my $self = shift;
    return $self->{'wellformedformula'};
}

# ---------------------------------------------------------------------

sub set_was_valid_boolean_expression {
    my $self = shift;
    my $query_number = shift;
    $self->{'wasvalidbooleanexpression'}->[$query_number] = 1;
}
# ---------------------------------------------------------------------
sub parse_was_valid_boolean_expression {
    my $self = shift;
    return $self->{'wasvalidbooleanexpression'};
}


# ---------------------------------------------------------------------
sub get_processed_query_string {
    my $self = shift;
    return $self->{'processedquerystring'};
}
# ---------------------------------------------------------------------
sub set_processed_query_string {
    my $self = shift;
    my $s = shift;    
    my $query_number = shift;
    $self->{'processedquerystring'}->[$query_number] = $s;
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
