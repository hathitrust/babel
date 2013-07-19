package API::HTD::App::V_2::Plugin::Volume;

=head1 NAME

API::HTD::App::V_2::Plugin::Volume

=head1 DESCRIPTION

This subclass handles the specifics of parsing the METS for the volume
resource. It is require'd by the Plugin base class.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(API::HTD::App::V_2::Plugin);

use XML::LibXML;

# ---------------------------------------------------------------------

=item __getFilenameFromMETSfor

Description

=cut

# ---------------------------------------------------------------------
sub __getFilenameFromMETSfor {
   my $self = shift;
   my $resource = shift;

   my %resource_map =
     (
      'volume/pageocr'      => 'ocr',
      'volume/pagecoordocr' => 'coordOCR',
      'volume/pageimage'    => 'image',
     );

   my $USE = $resource_map{$resource};
   my $seq = $self->__paramsRef->{seq};

   my $root = $self->__getMETS_root;
   my $xpath = qq{//METS:fileSec/METS:fileGrp[\@USE="$USE"]/METS:file[position()=$seq]};
   my %fns;
   foreach my $node ($root->findnodes($xpath)) {
       my $fn = ($node->findnodes('METS:FLocat'))[0]->findvalue('@xlink:href');
       $fns{$fn} = $node->findvalue('@MIMETYPE');
   }

   my ($filename, $mimetype);

   if ($USE eq 'image') {
       if (scalar(keys %fns) > 1) {
           $filename = grep(/\.jp2$/, keys %fns);
           $filename = (keys %fns)[0] unless($filename);
       }
       else {
           $filename = (keys %fns)[0];
       }
   }
   else {
       $filename = (keys %fns)[0];
   }
   $mimetype = $fns{$filename};

   return ($filename, $mimetype);
}

1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2013 ©, The Regents of The University of Michigan, All Rights Reserved

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

