package MBooks::Searcher::VuFindSolr;

=head1 NAME

Searcher::

=head1 DESCRIPTION

This class does X.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use base qw(Search::Searcher);

use MBooks::Result::VuFindSolr;
use MBooks::Query::VuFindSolr;


# ---------------------------------------------------------------------

=item PUBLIC: get_populated_Solr_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_populated_Solr_query_result
{
    my $self = shift;
    my ($C, $Q, $rs) = @_;

    my $query_string = $Q->get_Solr_query_string($C);

    return $self->__Solr_result($C, $query_string, $rs);
}

# ---------------------------------------------------------------------

=item get_Solr_internal_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_internal_query_result
{
    my $self = shift;
    my ($C, $Q, $rs) = @_;    

    my $query_string = $Q->get_Solr_internal_query_string();
    return $self->__Solr_result($C, $query_string, $rs);
}
# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut
