package LS::Result::Facets;


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
use JSON::XS;
use base qw(LS::Result::JSON);


# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize LS::Result::FullText object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize
{
    my $self = shift;
}


# --------------------------------------------------------------------


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
        # the below is more work but would isolate any changes necessary if we change the json response format i.e. json.nl=??
        #my $clean_facet_hash=self->clean_facets($facet_hash)

        $self->__set_facet_hash($facet_hash);
    
    }
    
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
