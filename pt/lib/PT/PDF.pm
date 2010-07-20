package PT::PDF;

=head1 NAME

PT::PDF;

=head1 DESCRIPTION

This package provides a simple interface for the creation of a PDF
consisting of JPEG2000 and TIFF images with PNG watermark overlays on
each page. It uses a modified version of PDF::API3 with many unneeded
modules removed from the tree to speed compilation.

=head1 SYNOPSIS

PT::PDF::API3createPDF({
                        -outputfile    => 'foo.pdf' || -,
                        -watermarkfile => 'watermark.png',
                        -inputdir      => '/ram/abc1234',
                        -pagesize      => 'LETTER',
                       });

'-' writes to STDOUT. 'LETTER' is the default.

=head1 METHODS

=over 8

=cut

use strict;
use IO::File;
use PDF::API3::Compat::API2;

# ---------------------------------------------------------------------

=item API3createPDF

Defaults to LETTER size.

=cut

# ---------------------------------------------------------------------
sub API3createPDF {
    my $args_ref = shift;

    my $input_dir = $args_ref->{-inputdir};
    opendir(DIR, $input_dir);
    my @files = sort map {$input_dir . '/' . $_} grep {/\.tif|\.jp2/} readdir(DIR);
    
    my $output_filename = $args_ref->{-outputfile};
    if ( $output_filename eq '-' ) {
        $output_filename = IO::File->new;
        $output_filename->fdopen(fileno(STDOUT), "w");
    }
    my $pdf = PDF::API3::Compat::API2->new(-file => $output_filename);

    my $ps_ref = get_page_size($args_ref->{-pagesize});
    my ($x1, $y1, $x2, $y2) = ($ps_ref->[0], $ps_ref->[1], $ps_ref->[2], $ps_ref->[3]);
    my ($w, $h) = ($x2, $y2);
    $pdf->mediabox($x1, $y1, $x2, $y2);

    my $watermark_data;
    my ($center_x, $center_y);

    my $watermark_filename = $args_ref->{-watermarkfile};
    if ($watermark_filename) {
        $watermark_data = $pdf->image_png($watermark_filename);
        ($center_x, $center_y) = ($x2/2, $y2/2);
    }

    my $ocr_font;
    my $searchable = $args_ref->{-searchable};
    if ($searchable) {
        $ocr_font = $pdf->corefont('Helvetica', -encode => 'latin1');
    }

    foreach my $image_filename (@files) {
        my $page = $pdf->page($w, $h);

        if ($searchable) {
            insert_text_as_lines($page, $image_filename, $ocr_font, $y2);
        }

        my $image_data;
        if ($image_filename =~ m,\.jp2$,o) {
            $image_data = $pdf->image_jp2($image_filename);
        }
        else {
            $image_data = $pdf->image_tiff($image_filename);
        }

        my $image = $page->gfx;
        $image->image($image_data, $x1, $y1, $x2, $y2);

        if (defined($watermark_data)) {
            my ($wm_w, $wm_h) = ($watermark_data->width, $watermark_data->height);
            # center the watermark 30 pixels above the bottom.
            $image->image($watermark_data, $center_x - ($wm_w/2), 30, $wm_w, $wm_h);
        }
    }

    $pdf->save();
}

# ---------------------------------------------------------------------

=item insert_text_as_lines

Description

=cut

# ---------------------------------------------------------------------
sub insert_text_as_lines {
    my ($page, $image_filename, $font, $h) = @_;

    my $ocr_filename = $image_filename;
    $ocr_filename =~ s,^(.+).(jp2|tif)$,$1.txt,;
    if (-f $ocr_filename) {
        my $fh = IO::File->new($ocr_filename);
        local $/ = undef;
        my $buffer = <$fh>;
        $fh->close;
        
        my @ocr = split(/\n/, $buffer);

        # start 12% lower than top of page
        my $y = $h - (0.12 * $h);
        my $txt = $page->text;
        $txt->font($font, 2);
        $txt->strokecolor('#000000');
        $txt->translate(10,$y);
        while (1) {
            my $txt_data = shift @ocr;
            $txt->text($txt_data);
            $txt->cr(-10);
            last if (! scalar(@ocr));
        }
    }
}



# ---------------------------------------------------------------------

=item get_page_size

Description

=cut

# ---------------------------------------------------------------------
sub get_page_size {
    my $name = shift;

    my %pagesizes =
        (
         'A0'         => [ 0, 0, 2380, 3368 ],
         'A1'         => [ 0, 0, 1684, 2380 ],
         'A2'         => [ 0, 0, 1190, 1684 ],
         'A3'         => [ 0, 0, 842,  1190 ],
         'A4'         => [ 0, 0, 595,  842  ],
         'A4L'        => [ 0, 0, 842,  595  ],
         'A5'         => [ 0, 0, 421,  595  ],
         'A6'         => [ 0, 0, 297,  421  ],
         'LETTER'     => [ 0, 0, 612,  792  ],
         'LETTERL'    => [ 0, 0, 792,  612  ],
         'BROADSHEET' => [ 0, 0, 1296, 1584 ],
         'LEDGER'     => [ 0, 0, 1224, 792  ],
         'TABLOID'    => [ 0, 0, 792,  1224 ],
         'LEGAL'      => [ 0, 0, 612,  1008 ],
         'EXECUTIVE'  => [ 0, 0, 522,  756  ],
         '36X36'      => [ 0, 0, 2592, 2592 ],
        );

    if (! $pagesizes{uc($name)}) {
        $name = 'LETTER';
    }

    return $pagesizes{uc($name)};
}

1;

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2010 ©, The Regents of The University of Michigan, All Rights Reserved

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

