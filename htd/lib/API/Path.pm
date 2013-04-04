package API::Path;


=head1 NAME

API::Path;

=head1 DESCRIPTION

This package contains routines to build file systems paths to objects
in the repository.

=head1 SYNOPSIS

use API::Path;

my $po = API::Path->new($ENV{SDRDATAROOT} . '/obj/mdp/pairtree_root');

$po->getItemDir($barcode);

=head1 METHODS

=over 8

=cut

use strict;
use File::Pairtree;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize

Initialize API::Path object.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $myRoot = shift;

    $self->{my_root} = $myRoot;
    $File::Pairtree::root = $myRoot;
}


# ---------------------------------------------------------------------

=item getItemDir



=cut

# ---------------------------------------------------------------------
sub getItemDir {
    my $self = shift;
    my $barcode = shift;

    my $path = File::Pairtree::id2ppath($barcode) . File::Pairtree::s2ppchars($barcode);
    return $path;
}

# ---------------------------------------------------------------------

=item getPairtreeFilename



=cut

# ---------------------------------------------------------------------
sub getPairtreeFilename {
    my $self = shift;
    my $barcode = shift;

    my $filename = File::Pairtree::s2ppchars($barcode);
    return $filename;
}

# ---------------------------------------------------------------------

=item Name

Description

=cut

# ---------------------------------------------------------------------
sub getRoot {
    my $self = shift;
    return $self->{my_root};
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-10 ©, The Regents of The University of Michigan, All Rights Reserved

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
