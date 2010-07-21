package LS::Result::FullText;


=head1 NAME

LS::Result::FullText (rs)

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
use base qw(Search::Result);


# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize LS::Result::FullText object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize
{
    my $self = shift;
}


# ---------------------------------------------------------------------

=item AFTER_ingest_Solr_search_response

Example Solr result is:




=cut

# ---------------------------------------------------------------------
sub AFTER_ingest_Solr_search_response
{
    my $self = shift;
    my $Solr_response_ref = shift;

    # Ids
    my @result_ids = ($$Solr_response_ref =~ m,<str name="id">(.*?)</str>,gs);
    $self->__set_result_ids(\@result_ids);

    # Relevance scores
    my %result_score_hash;
    my @result_scores = ($$Solr_response_ref =~ m,<float name="score">(.*?)</float>,gs);
    for (my $i=0; $i < scalar(@result_ids); $i++)
    {
        $result_score_hash{$result_ids[$i]} = $result_scores[$i];
    }
    $self->__set_result_scores(\%result_score_hash);

    # Documents
    my @result_docs = ($$Solr_response_ref =~ m,<doc>(.*?)</doc>,gs);
    $self->__set_result_docs(\@result_docs); 
}


# ---------------------------------------------------------------------

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
