package MBooks::Relevance;


=head1 NAME

MBooks::Relevance

=head1 DESCRIPTION

This package computes normalized scaled relevance scores based on
Lucene's relevance formula as returned by Solr.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use MBooks::Result::FullText;

use constant ABSOLUTE_SCALE_FACTOR => 10000;
use constant RELATIVE_SCALE_FACTOR => 1000;

# ---------------------------------------------------------------------

=item get_normalized_relevance

relative :: (this score / of max score) * RELATIVE_SCALE_FACTOR

absolute :: (this score) * ABSOLUTE_SCALE_FACTOR

=cut

# ---------------------------------------------------------------------
sub get_normalized_relevance
{
    my $rs = shift;
    my $un_normed_id_arr_ref = shift;
    my $norm_type = shift;

    my %normed_rel_hash;
    my $result_scores_hashref = $rs->get_result_scores();
    my $max_score = $rs->get_max_score();

    foreach my $id (@$un_normed_id_arr_ref)
    {
        my $this_score = $$result_scores_hashref{$id};
        if ($norm_type eq 'relative')
        {
            $normed_rel_hash{$id} = int(($this_score/$max_score) * RELATIVE_SCALE_FACTOR);
        }
        elsif ($norm_type eq 'absolute')
        {
            $normed_rel_hash{$id} = int($this_score * ABSOLUTE_SCALE_FACTOR);
        } 
        else
        {
            ASSERT(0, qq{Invalid normalization type="$norm_type"});
        }
    }
    
    return \%normed_rel_hash;
}




1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
