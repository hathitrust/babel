package PT::CompositeResult;

=head1 NAME

CompositeResult (cres)

=head1 DESCRIPTION

This class is a container for all the data that comes from an XPAT search.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Debug::DUtils;


sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize

Initialize Search::XPat::Result.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;

    my ($rset, $parsedQsCgi, $totalPages, $pageHitCountsRef, $secondary_query) = @_;

    $self->{'rset'} = $rset;
    $self->{'parsed_qs_cgi'} = $parsedQsCgi;
    $self->{'total_pages'} = $totalPages;
    $self->{'page_hit_counts_ref'} = $pageHitCountsRef;
    $self->{'secondary_query'} = $secondary_query;
}

# ---------------------------------------------------------------------

=item Accessors

=cut

# ---------------------------------------------------------------------
sub get_rset
{
    my $self = shift;
    return $self->{'rset'};
}


sub get_parsed_qs_cgi
{
    my $self = shift;
    return $self->{'parsed_qs_cgi'};
}


sub get_total_pages
{
    my $self = shift;
    return $self->{'total_pages'};
}


sub get_page_hit_counts_ref
{
    my $self = shift;
    return $self->{'page_hit_counts_ref'};
}


sub get_secondary_query
{
    my $self = shift;
    return $self->{'secondary_query'};
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
