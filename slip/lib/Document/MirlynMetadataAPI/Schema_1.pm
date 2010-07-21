package Document::MirlynMetadataAPI::Schema_1;


=head1 NAME

Document::MirlynMetadataAPI::Schema_1

=head1 DESCRIPTION

This class creates an Solr type 1 schema document for indexing using
the Mirlyn API

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


# App
use base qw(Document::MirlynMetadataAPI);
use Utils;
use Debug::DUtils;
use Identifier;
use Context;
use Search::Constants;

# ---------------------------------------------------------------------

=item get_structured_metadata_f_item_id

Implements pure virtual method

=cut

# ---------------------------------------------------------------------
sub get_structured_metadata_f_item_id
{
    my $self = shift;
    my ($C, $item_id, $metadata_ref) = @_;
    
    my %metadata_hash;

    if ($metadata_ref && $$metadata_ref)
    {
        # Title
        $metadata_hash{'title'} = 
            $self->get_metadata_title($C, $item_id, $metadata_ref);
        # Author
        $metadata_hash{'author'} = 
            $self->get_metadata_author($C, $item_id, $metadata_ref);
    }

    return \%metadata_hash;
}


# ---------------------------------------------------------------------

=item get_metadata_fields

Implements pure virtual method. For title, author, date to use Lucene
for queries on these

=cut

# ---------------------------------------------------------------------
sub get_metadata_fields
{
    my $self = shift;
    my ($C, $dbh, $item_id) = @_;

    # Author sort-title and date
    my ($metadata_hashref, $metadata_status)  = $self->get_metadata_f_item_id($C, $item_id);

    my $title_field =
        wrap_string_in_tag($$metadata_hashref{'title'} || 'Not found',
                           'field', [['name', 'title']]);
    my $author_field =
        wrap_string_in_tag($$metadata_hashref{'author'} || 'Not found',
                           'field', [['name', 'author']]);

    my $metadata_fields = $title_field . $author_field;

    return (\$metadata_fields, $metadata_status);
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
