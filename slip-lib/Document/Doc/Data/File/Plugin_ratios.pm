=head1 NAME

Plugin_data_ratios

=head1 DESCRIPTION

This is a plugin to the Document::Doc::Data class.

Refer to Document/Plugins.txt for documentation on Plugins.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use POSIX qw(ceil floor);

use Search::Constants;


# ---------------------------------------------------------------------

=item PLG_add_data_ratio_fields

Adds these fields to the Solr document

 <field name="numPages"     type="tint" indexed="true" stored="true">
 <field name="numChars"     type="tint" indexed="true" stored="true">
 <field name="charsPerPage" type="tint" indexed="true" stored="true">

=cut

# ---------------------------------------------------------------------
sub PLG_add_data_ratio_fields {
    my $self = shift;

    my $fields_ref;

    my $numPages = $self->d_my_facade->D_get_doc_tokenizer->T_granularity;
    $$fields_ref .= wrap_string_in_tag($numPages, 'field',
                                       [
                                        ['name', 'numPages'],
                                        ['type', 'tint'],
                                        ['stored', 'true'],
                                       ]);
    my $numChars = $self->d_my_num_chars;
    $$fields_ref .= wrap_string_in_tag($numChars, 'field',
                                       [
                                        ['name', 'numChars'],
                                        ['type', 'tint'],
                                        ['stored', 'true'],
                                       ]);
    my $ratio;
    if ($numPages == 0) {
        $ratio = 0;
    }
    else {
        if ($numChars == 0) {
            $ratio = 0;
        }
        else {
            $ratio = $numChars/$numPages;
            $ratio = ($ratio < 1.0) ? ceil($ratio) : floor($ratio);
        }
    }
    $$fields_ref .= wrap_string_in_tag($ratio, 'field',
                                       [
                                        ['name', 'charsPerPage'],
                                        ['type', 'tint'],
                                        ['stored', 'true'],
                                       ]);
    $self->data_fields($fields_ref);

    return IX_NO_ERROR;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut

1;


