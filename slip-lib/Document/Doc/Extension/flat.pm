package Document::Doc::Extension::flat;


=head1 NAME

Document::Doc::Extension::flat

=head1 DESCRIPTION

This subclass of Document::Doc::Extension handles
the logic for field creation for flat structured Solr documents.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(Document::Doc::Extension);
use Utils;

use Search::Constants;

# ---------------------------------------------------------------------

=item build_extension_fields

Description

=cut

# ---------------------------------------------------------------------
sub build_extension_fields {
    my $self = shift;
    my ($C, $state, $level, $granularity, $type) = @_;

    my $status = $self->SUPER::build_extension_fields(@_);
    return $status unless ($status == IX_NO_ERROR);
    # POSSIBLY NOTREACHED

    my $item_id = $self->__e_my_facade->D_get_doc_id;

    my $id =
      ($granularity eq '0')
        ? wrap_string_in_tag($item_id, 'field', [['name', 'id']])
          : wrap_string_in_tag(($item_id . "_$state"), 'field', [['name', 'id']]);
    
    my $chunk_seq =
      ($type eq 'token') 
        ? wrap_string_in_tag($state, 'field', [['name', 'chunk_seq']])
          : '';

    my $extension_fields = $id . $chunk_seq;

    $self->extension_fields(\$extension_fields);

    return $status;
}


1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
