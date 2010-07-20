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
