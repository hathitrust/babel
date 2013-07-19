package API::HTD::App::V_2::Plugin::Article;


=head1 NAME

API::HTD::App::V_2::Plugin::Article

=head1 DESCRIPTION

This subclass handles the specifics of parsing the METS for the article
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

   my $seq = $self->__paramsRef->{seq};
   my $structMap_xpath = q{//METS:structMap[@TYPE="physical"]/METS:div[@TYPE="contents"]};

   my $article_xpath = $structMap_xpath . qq{/METS:div[\@TYPE="article"]};
   my $asset_xpath   = $structMap_xpath . qq{/METS:div[\@TYPE="assets"]};

   my %resource_FILEIDmap =
     (
      'article'                      => $article_xpath . qq{/METS:div[\@TYPE="primary"]/METS:fptr},
      'article/alternate'            => $article_xpath . qq{/METS:div[\@TYPE="alternate"]/*[$seq]},
      'article/assets/embedded'      => $asset_xpath   . qq{/METS:div[\@TYPE="embedded"]/*[$seq]},
      'article/assets/supplementary' => $asset_xpath   . qq{/METS:div[\@TYPE="supplementary"]/*[$seq]},
     );

   my $root = $self->__getMETS_root;
   my $node;
   my ($filename, $mimetype);

   my $FILEID_xpath = $resource_FILEIDmap{$resource};
   ($node) = $root->findnodes($FILEID_xpath);

   if ($node) {
       my $fid = $node->getAttribute('FILEID');
       my $fn_xpath = qq{//METS:file[\@ID="$fid"]};

       my ($fn_node) = $root->findnodes($fn_xpath);
       if ($fn_node) {
           $mimetype = $fn_node->getAttribute('MIMETYPE');
           ($node)= $fn_node->findnodes($fn_xpath . q{/METS:FLocat});
           $filename = $node->getAttribute('xlink:href');
       }
   }

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

