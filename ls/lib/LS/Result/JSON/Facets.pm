package LS::Result::JSON::Facets;


=head1 NAME

LS::Result::Facets (rs)

=head1 DESCRIPTION

This class does encapsulates the Solr search response data.

=head1 VERSION

$Id: FullText.pm,v 1.2 2009/08/10 20:04:09 pfarber Exp $

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Debug::DUtils;
use JSON::XS;
use URI::Escape;
use base qw(LS::Result::JSON);


# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize LS::Result::FullText object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize
{
    my $self = shift;
    my $result_type = shift;
    $self->__set_result_type($result_type);
    
}

# ---------------------------------------------------------------------

=item AFTER_ingest_Solr_search_response

Example Solr result is:


=cut

# ---------------------------------------------------------------------
sub AFTER_ingest_Solr_search_response
{
    my $self = shift;
    # since this is a subclass of LS::Result::JSON we expect a parsed json object rather than
    # a Solr XML response string
    my $Parsed_Solr_response_ref = shift;
    
    my $solr_debug;
    $solr_debug=$Parsed_Solr_response_ref->{'debug'};
    if (DEBUG('explain'))
    {
        my $processed_explain= $self->__process_expain_data($solr_debug);
        DEBUG('explain', $processed_explain); 
    }
    # do we want the raw debug stuff from solr stored on self or the processed data?    
    
    if (defined $solr_debug)
    {
        $self->__set_result_solr_debug($solr_debug);
    }

    my $docs = $Parsed_Solr_response_ref->{'response'}->{'docs'};
    
    # check to see if there is at least one doc
    if (defined($docs->[0]))
    {
        
        my @result_ids;
        my $result_score_hash;
    
        foreach my $doc (@{$docs})
        {
            my $result_id = $doc->{'id'};
            
            push (@result_ids,$result_id);
            # Relevance scores
            $result_score_hash->{$result_id}=$doc->{'score'};
        }
        
        # Ids
        
        $self->__set_result_ids(\@result_ids);
        $self->__set_result_scores($result_score_hash);
        
        # Documents
        #XXX this is expecting xml docs 
        $self->__set_result_docs($docs); 
    }
    #XXX  need to ingest facet data and save it (i.e. get/set_facet_data)
    # check for facets first
    my $facet_hash;
    $facet_hash = $Parsed_Solr_response_ref->{facet_counts}->{facet_fields};
        
    if (defined($facet_hash))
    {
        #XXX do we want to parse this or just pass on a data structure?
        # This routine currently doesn't do anything due to line near the bottom that says $cleaned=$hash
        # consider removing
        my $clean_facet_hash = $self->__clean_facets($facet_hash);
        $clean_facet_hash = $self->__remove_Electronic_Resources_facet_value($clean_facet_hash);
        
        
        $self->__set_facet_hash($clean_facet_hash);
    
    }
    
}


# ---------------------------------------------------------------------

=item PRIVATE: __process_expain_data

Description

=cut

# ---------------------------------------------------------------------
sub __process_expain_data
{
    my $self       = shift;
    my $solr_debug = shift;
    
    #XXX  we might also want some data besides the explain part as in the parsed query
    #XXX  we need to link some metadata with the explain data
    #  we could actually provide a mouseover to inspect the explain data for each item
    

    #XXX  TODO:  add query parsing stuff to beginning
    
    require Data::Dumper;
    my $d = Data::Dumper::Dumper($solr_debug->{'explain'});
    # need to make this xml safe.  Check methods in DEBUG or other code
    Utils::map_chars_to_cers(\$d) if Debug::DUtils::under_server();
    $d= qq{<pre>$d</pre>};

    return $d;

    # do we need to use this code?  
    #    # protect entities and turn naked & into &amp;
    #    $dump =~ s/&([^;]+);/ENTITY:$1:ENTITY/gis;
    #    $dump =~ s/&/&amp;/gis;
    #    $dump =~ s/ENTITY:([a-z0-9]+):ENTITY/&$1;/gis;
    
    #    return qq{<pre style="text-align: left">$dump</pre>};

}
# ---------------------------------------------------------------------

#XXX this is only here until bill removes this from metadata in vufind and we reindex
sub __remove_Electronic_Resources_facet_value
{
    my $self = shift;
    my $hash =shift;
    # key =facetname
    #value=array of arrays where ary->[0]=facet value and ary->[1]=facet count
    my $format_aryary= $hash->{'format'};
    my $cleaned_aryary =[];
    foreach my $ary (@{$format_aryary})
    {
        my $cleaned_ary=[];
        #XXX HACK to remove format::Electronic Resource until bill removes it from Vufind Index
        next if ($ary->[0] =~/Electronic Resource/);
        $cleaned_ary->[0] =$ary->[0];
        $cleaned_ary->[1] =$ary->[1];
        
        push (@{$cleaned_aryary},$cleaned_ary)
    }
    $hash->{'format'} =$cleaned_aryary;
    return $hash;
}


# ---------------------------------------------------------------------
sub __clean_facets
{
    my $self = shift;
    my $hash =shift;

    # key =facetname
    #value=array of arrays where ary->[0]=facet value and ary->[1]=facet count
    
#XXX WARNING  this entire rountine not used right now.  Consider removing it!
    my $cleaned={};
    foreach my $facetfield (keys %{$hash})
    {
        my $cleaned_aryary=[];
       
        my  $aryary = $hash->{$facetfield};
        foreach my $ary (@{$aryary})
        {
            my $cleaned_ary=[];
            #XXX HACK to remove format::Electronic Resource until bill removes it from Vufind Index
            next if ($ary->[0] =~/Electronic Resource/);
                
            
            my $value = $ary->[0];
            my $count = $ary->[1];
            my $cleaned;

            #XXX test for now by encoding only stuf with an ampersand           
            if ($value=~/\&/)
            {
                 $cleaned = URI::Escape::uri_escape_utf8($value);
            }
            else
            {
                $cleaned=$value;
            }
            
            $cleaned_ary->[0] =$cleaned;
            $cleaned_ary->[1] = $count;
            push (@{$cleaned_aryary},$cleaned_ary)
        }
        $cleaned->{$facetfield} =$cleaned_aryary;
    }
#XXX  This is for debugging so unless this line is commented out this just returns the input hash!                            
    $cleaned =$hash;
    
    return $cleaned;
}

# ---------------------------------------------------------------------

=item PRIVATE: __set_facet_hash

Description

=cut

# ---------------------------------------------------------------------
sub __set_facet_hash
{
    my $self = shift;
    my $hash_ref = shift;
    $self->{'facet_hash_ref'} = $hash_ref;
}

# ---------------------------------------------------------------------

=item PRIVATE:__set_result_solr_debug

Description: results of a solr debug/explain query parsed from the json response

=cut

# ---------------------------------------------------------------------
sub  __set_result_solr_debug
{
    my $self = shift;
    my $solr_debug = shift;
    $self->{'result_solr_debug'} = $solr_debug;
}

# ---------------------------------------------------------------------

=item :get_result_solr_debug

Description

=cut

# ---------------------------------------------------------------------
sub get_result_solr_debug
{
    my $self = shift;
    return     $self->{'result_solr_debug'} ;
}



# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item :get_facet_hash

Description

=cut

# ---------------------------------------------------------------------
sub get_facet_hash
{
    my $self = shift;
    return     $self->{'facet_hash_ref'} ;
}





=item PRIVATE: __set_result_docs

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_docs
{
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_response_docs_arr_ref'} = $arr_ref;
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_ids
{
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_ids'} = $arr_ref;
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_scores

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_scores
{
    my $self = shift;
    my $hash_ref = shift;
    $self->{'result_scores'} = $hash_ref;
}

# ---------------------------------------------------------------------

=item get_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub get_result_ids
{
    my $self = shift;
    return $self->{'result_ids'};
}


# ---------------------------------------------------------------------

=item get_result_scores

Description

=cut

# ---------------------------------------------------------------------
sub get_result_scores
{
    my $self = shift;
    return $self->{'result_scores'};
}

# ---------------------------------------------------------------------

=item get_result_docs

Description

=cut

# ---------------------------------------------------------------------
sub get_result_docs
{
    my $self = shift;
    return $self->{'result_response_docs_arr_ref'};
}
# ---------------------------------------------------------------------

#  these set per query start number and number of rows for taking a slice
# of the $i_rs doc array ref
#		$i_rs->set_start($user_solr_start_row);
#		$i_rs->set_num_rows($user_solr_num_rows);
# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
sub set_start
{
    my $self = shift;
    my $start = shift;
    $self->{'start'} = $start;
}
# ---------------------------------------------------------------------
sub set_num_rows
{
    my $self = shift;
    my $num_rows = shift;
    $self->{'num_rows'} = $num_rows;
}

# ---------------------------------------------------------------------
sub get_slice_result_docs
{
    my $self = shift;
    #XXX do we need to replace by getter functions?
    my $start = $self->{'start'};
    my $num = $self->{'num_rows'};
    my $ary_ref =[];
    #XXX figure out 0 based array off by 1 stuff
    for (my $i = $start; $i < $num; $i++)
    {
	push(@{$ary_ref}, $self->{'result_response_docs_arr_ref'}->[$i]);
    }
    return ($ary_ref);
}


# ---------------------------------------------------------------------

=item __set_result_type

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_type
{
    my $self = shift;
    my $type = shift;
    $self->{'result_type'} = $type;
}

# ---------------------------------------------------------------------

=item get_result_type

Description

=cut

# ---------------------------------------------------------------------
sub get_result_type
{
    my $self = shift;
    return $self->{'result_type'};
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

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
