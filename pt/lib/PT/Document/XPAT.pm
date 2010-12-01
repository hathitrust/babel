package PT::Document::XPAT;


=head1 NAME

PT::Document::XPAT

=head1 DESCRIPTION

This class creates an XPAT stype document for indexing

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Search::Document);
use Utils;
use Utils::Extract;
use PT::Document::ISO8859_1_Map;

# ---------------------------------------------------------------------

=item after_initialize

Initialize Document::XPAT.

=cut

# ---------------------------------------------------------------------
sub after_initialize 
{
    my $self = shift;
}


# ---------------------------------------------------------------------

=item get_document_content

Description: Implements pure virtual method

=cut

# ---------------------------------------------------------------------
sub get_document_content
{
    my $self = shift;
    my ($C, $mdp_item ) = @_;

    # for each page from first to last, read ocr text file and wrap in
    # <page> element, then concatenate all pages Wrap all in <doc>
    # element
    my $first_page = $mdp_item->GetFirstPageSequence();
    my $last_page = $mdp_item->GetLastPageSequence();

    my $full_text = '';
    my $has_ocr = $mdp_item->Get('has_ocr');
    
    if ($has_ocr) {
        my $pattern_arr_ref = ['*.txt'];
        my $fileDir = $mdp_item->GetDirPathMaybeExtract($pattern_arr_ref, 'ocrfile');

        for (my $i = $first_page; $i <= $last_page; $i++) {
            my $ocr_file = $mdp_item->GetFileNameBySequence($i, 'ocrfile');
            
            # Some packages lack OCR for some pages
            next if (! $ocr_file);

            my $ocr_text_ref = Utils::read_file($fileDir . '/' . $ocr_file);

            # Do no build pages of whitespace
            next if ($$ocr_text_ref =~ m,^\s*$,);
        
            $self->clean_xml($ocr_text_ref);
            my $num = $mdp_item->GetPageNumBySequence($i);

            $full_text .= wrap_string_in_tag_by_ref($ocr_text_ref,
                                                    'page',
                                                    [['SEQ', $i], ['NUM', $num]]);
        }
    }
    else {
        # Safety valve: If all the OCR is empty indexing will
        # crash. So we really should not be here. Some other mechanism
        # will remove the search box from the UI but there could still
        # be a URL to ptsearch ...
        $full_text = wrap_string_in_tag('__EMPTYOCR__',
                                        'page',
                                        [['SEQ', 1], ['NUM', 1]]);
    }

    PT::Document::ISO8859_1_Map::iso8859_1_mapping(\$full_text);
    $full_text = wrap_string_in_tag_by_ref(\$full_text, 'doc');

    return \$full_text;
}





1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-10 ©, The Regents of The University of Michigan, All Rights Reserved

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
