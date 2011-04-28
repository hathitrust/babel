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

=item full_text_query

Description

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
    my $cgi = $C->get_object('CGI');
   
    #XXX do we need to rename facet_config since it contains more than just facet config info?
    #XXX if there is an advanced query we want the dismax entered 
    my $config = $self->get_facet_config;        
    #advanced search
    my $DISMAX="";
    
    my $ADVANCED= "";

    #XXX once we get this working we need to redo advanced so it also takes q1 and makes the proper dismax query
    if ( $self->is_advanced($cgi) )
    {
        $ADVANCED = $self->__get_advanced_query($cgi);
    }
    else
    {
        $DISMAX  = $self->_getDismaxString($config);
    }
    
        
    # Cache to avoid repeated MySQL calls in Access::Rights
    if ($self->get_cached_Solr_query_string()) {
        return $self->get_cached_Solr_query_string();
    }

    # Massage the raw query string from the user
    my $user_query_string = $self->get_processed_user_query_string();

    # The common Solr query parameters
    my $USER_Q = qq{q=$user_query_string};
    my $FL = qq{&fl=title,author,date,rights,id,record_no,score};
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

    # Full-text filter query (fq)
    my $FQ = '';
    if ($self->full_text_query($C)) {
        # Get list of attrs that equate to 'allow' for this user. This
        # is mainly for GeoIP check to add '9' to the list
        my $attr_list_aryref = [1,7];
        eval {
            $attr_list_aryref = Access::Rights::get_fulltext_attr_list($C);
        };
        $FQ = '&fq=rights:(' . join(' OR ', @$attr_list_aryref) .  ')';
    }

# Facet aspects of query added here
#
#    if we implement show all facets by A-Z we need to set facet.sort param
#    but how does Blacklight implement paging?
    
    my $FACETS= $self->__get_facets;
    my $WRITER ='&wt=json&json.nl=arrarr';
    
    # q=dog*&fl=id,rights,author,title,score&$version=2.2,&start=0&rows=20&indent=off
    #    my $solr_query_string = $USER_Q . $FL . $FQ . $VERSION . $START_ROWS . $INDENT . $FACETS . $WRITER;
    #XXX change to edismax query for testing
    # add debug flag to ask solr for an explain query and need to change output somewhere
    # This builds a filter query based on the values of the facet paraameter in the cgi

    my $FACETQUERY="";
    #XXX should we do some cleaning of facet param coming in on url?

    my $facetquery=$cgi->{'facet'};

    if (defined ($facetquery))
    {
        foreach my $fquery (@{$facetquery})
        {
            $FACETQUERY.='&fq=' . $fquery;
        }
    }
    
#XXX for temporary debugging of rel ranking
    #  Need a much better mechanisim
#   Replace all this with a debug flag    
    my $EXPLAIN="";
#        $EXPLAIN='&debugQuery=on';

# for now make default dismax!
   

   my $solr_query_string = $USER_Q . $ADVANCED . $FL . $FQ . $VERSION . $START_ROWS . $INDENT . $FACETS . $WRITER . $DISMAX . $FACETQUERY . $EXPLAIN;    
#    my $solr_query_string = $USER_Q . $ADVANCED . $FL . $FQ . $VERSION . $START_ROWS . $INDENT .  $WRITER . $FACETQUERY .$EXPLAIN;
    
#XXX for debugging
#    my $solr_query_string = 'q=id:uc1.$b333205' . $WRITER;
    
    DEBUG('all,query',
          sub
          {
              my $s = $solr_query_string;
              Utils::map_chars_to_cers(\$s) if Debug::DUtils::under_server();
              return qq{Solr query="$s"}
          });

    $self->cache_Solr_query_string($solr_query_string);

    return $solr_query_string;
}


# ---------------------------------------------------------------------
#  is_advanced
#  returns true if there is one or more of q2, q3, or q4
# ---------------------------------------------------------------------
sub is_advanced
{
    my $self = shift;
    my $cgi = shift;
    my $q;
    
    for my $i (2..4)
    {
        $q = 'q' . $i;
        if ( defined($cgi->param("$q") )   )
        {
            return "true";
        }
    }
    #perl best practices: return with no arg always returns false for context of calling routine
    return;
}




# ---------------------------------------------------------------------
# __get_advanced_query

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
        
    for my $i (2..4)
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
#  XXX as currently implemented this makes one huge q param
#  q=fulltext AND field1:something AND field2 somethingelse
#
#   We need to actually use local params to make a bunch of dismax queries with
# the OPs tieing them together and move the default dismax parameters appropriately

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

    my $field = $cgi->param('field' . $i);
    if (!defined($field))
    {
        return "";
    }
    my $processed_q =$self->get_processed_user_query_string($q);

    my $config = $self->get_facet_config;    
    
    my $field_hash = $config->get_param_2_solr_map;
    # do we need something more user friendly than an assert out?
    ASSERT (defined ($field_hash->{$field} ),qq{LS::Query::Facets: $field is not a legal type of field});
    my $solr_field = $field_hash->{$field};

    my $weights = $config->get_weights_for_field($solr_field);
    
    my $qf = $self->dismax_2_string($weights->{'qf'});
    my $pf = $self->dismax_2_string($weights->{'pf'});
    my $mm=$weights->{'mm'};
    my $tie=$weights->{'tie'};
    $mm =~s,\%,\%25,g; #url encode any percent sign should this be a named sub? 
    
    my $QF = qq{ qf='} . $qf . qq{' };
    my $PF = qq{ pf='} . $pf . qq{' };
    my $MM = qq{ mm='} . $mm . qq{' };
    my $TIE = qq{ tie='} . $tie . qq{' };

    my $Q;

    $Q= ' ' . $op  . ' _query_:"{!edismax' . $QF . $PF . $MM .$TIE  . '} ' . $solr_field  .':'. $processed_q .'"';

    return $Q;
    
}

# ---------------------------------------------------------------------w

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
=item _getDismaxString

Reads yaml config file 
Currently only for an all fields search
Could be modified for advanced searches to weight properly full-text + (author|title|subject)

=cut

# ---------------------------------------------------------------------

sub _getDismaxString
{
    my $self = shift;
    my $config = shift;
    my $all_weights = $config->get_all_weights;
  my $string = '&defType=edismax';   #dismax|edismax, dismax won't work with normal adv search syntax, but see naomi stuff if needed
    
    foreach my $key (keys %{$all_weights})
    {
         $string.= '&' . $key . '=';
        if (ref($all_weights->{$key}) eq 'ARRAY')
        {
            
            my $aryref= $all_weights->{$key};
           
            foreach my $el (@{$aryref})
            {
               my $field=$el->[0];
               my $weight=$el->[1];
               $string.=$field . '^' . $weight . '+'; 
            }
        }
        else
        {
            $string.= $all_weights->{$key};
            
        }
        
    }
    
    
#XXX need to insert tie parameter with correct url escapeing!!!
#    $string='&defType=dismax&pf=title_ab^10000+title_a^8000+author^1600&qf=ocr^100000+title_ab^1000+title_a^800+author^1600&mm="2-25%"&tie=0.1 ';
    return $string;
    
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
