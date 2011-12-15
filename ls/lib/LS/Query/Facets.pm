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
    
    # Cache to avoid repeated MySQL calls in Access::Rights

    if ($self->get_cached_Solr_query_string()) {
        return $self->get_cached_Solr_query_string();
    }
    
    my $cgi = $C->get_object('CGI');
   
    # do we need to rename facet_config since it contains more than just facet config info?
    my $config = $self->get_facet_config;  
    
    #advanced search
    
    my $ADVANCED= "";

    $ADVANCED = $self->__get_advanced_query($cgi);
        
  
    # The common Solr query parameters
    my $Q ='q=';
    my $FL = qq{&fl=title,title_c,volume_enumcron,vtitle,author,author2,date,rights,id,record_no,score};
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
    
    # This builds a filter query based on the values of the facet parameter(s) in the cgi

    my $FACETQUERY="";

    my @facetquery = $cgi->param('facet');
    
    if (defined (@facetquery))
    {
        foreach my $fquery (@facetquery)
        {
            my $cleaned_fquery = $self->__clean_facet_query($fquery);
            $FACETQUERY.='&fq=' . $cleaned_fquery;
        }
    }
    
    # for temporary debugging of rel ranking
    #  Need a much better mechanisim

    my $EXPLAIN="";
    if (DEBUG('explain')) {
        $EXPLAIN='&debugQuery=on';
    }

    my $solr_query_string = $Q . $ADVANCED . $FL . $FQ . $VERSION . $START_ROWS . $INDENT . $FACETS . $WRITER . $FACETQUERY . $EXPLAIN;    
    
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
# __get_advanced_query
#
# 
#
# ---------------------------------------------------------------------
sub __get_advanced_query
{
    my $self = shift;
    my $cgi = shift;
    
    my $ADVANCED="";
    
    #There is no longer any op1  the number of the op goes with the number of the query
    my $q;
    my $clause;
    my $Q;
        
    for my $i (1..4)
    {
        $q = 'q' . $i;
        if (defined $cgi->param($q))
        {
            $clause=$self-> make_query_clause($i,$cgi);
            $ADVANCED.= ' ' .$clause;
        }
    }
    # replace multiple leading spaces with one space
    $ADVANCED=~s/^\s+/ /;

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
    #XXX temporary fix until we refactor Search::Query in mdp-lib so it behaves properly
    # currently it deals with balencing of quotes and eliminates 
    Utils::remap_cers_to_chars(\$q);
    
    my $processed_q =$self->get_processed_user_query_string($q);
    #XXX temporary fix until we refactor Search::Query::_get_processed_user_query_string
    # remove any string consisting only of ascii punctuation
    $processed_q = $self->remove_tokens_with_only_punctuation($processed_q);
    
    my $boolean_q= $processed_q;
    # only use below if dismax is not working right
#    my $boolean_q = $self->__get_boolean_query($processed_q)   ;
    
    #XXX does the following need to happen before or after booleanizing the query
    #XXX current processing will remove unbalenced quotes but leave in balenced quotes
    # since the dismax query needs to be quoted, we need to escape any quotes in the query
    #  ie  "foo" => \"foo\"
    $boolean_q =~s,\",\\\",g;
    
    my $config = $self->get_facet_config;    
    
    my $field_hash = $config->get_param_2_solr_map;
    # do we need something more user friendly than an assert out?
    ASSERT (defined ($field_hash->{$field} ),qq{LS::Query::Facets: $field is not a legal type of field});
    my $solr_field = $field_hash->{$field};

    my $weights = $config->get_weights_for_field($solr_field);
    
    my $qf = $self->dismax_2_string($weights->{'qf'});
    my $pf = $self->dismax_2_string($weights->{'pf'});
    my $pf3;
    my $pf2;
    
    if ($field =~/ocrpf/)
    {
        $pf3= $self->dismax_2_string($weights->{'pf3'});
        $pf2= $self->dismax_2_string($weights->{'pf2'});
    }
    
    my $mm=$weights->{'mm'};
    my $tie=$weights->{'tie'};
    $mm =~s,\%,\%25,g; #url encode any percent sign should this be a named sub? 
    
    my $QF = qq{ qf='} . $qf . qq{' };

    my $PF = qq{ pf='} . $pf . qq{' };
    #XXX with pf 2 and 3.  XXX need to write this so we only put these in if they are in the config
    if (defined ($pf2))
    {
        $PF = qq{ pf='} . $pf . qq{' } . qq{ pf3='} . $pf3 . qq{' } .qq{ pf2='} . $pf2 . qq{' };
    }
    
    my $MM = qq{ mm='} . $mm . qq{' };
    my $TIE = qq{ tie='} . $tie . qq{' };

    my $Q;
    

    $Q= ' ' . $op  . ' _query_:"{!edismax' . $QF . $PF . $MM .$TIE  . '} ' .  $boolean_q .'"';

    return $Q;
    
}

# ---------------------------------------------------------------------w

sub remove_tokens_with_only_punctuation
{
    my $self = shift;
    my $q = shift;
    my $pq;
    
    my @tokens = split(/\s+/,$q);
    my @out=();
        
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
    
    foreach my $field (@{$facetfields})
    {
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
