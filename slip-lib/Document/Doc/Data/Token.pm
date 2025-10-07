package Document::Doc::Data::Token;

=head1 NAME

Document::Doc::Data::Token

=head1 DESCRIPTION

This class encapsulates the retrieval of text to build a Solr document
that contains a chunk of a configured number of tokens from the
concatenated text of all files within of a repository item.

The concatenation consists of the contents of all OCR .txt files or of
the entire textual content of an XML structured document.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw( Document::Doc::Data );


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
