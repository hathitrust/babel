package API::HTD::App::V_1::Plugin;


=head1 NAME

API::HTD::App::V_1::Plugin;

=head1 DESCRIPTION

This is a subclass of API::HTD::App which contains resource handlers
and associated support code to handle the Version 1 schemas for the
HathiTruse Data API.

As such, it contains methods that assume data values or structural
relationships that might differ from one version to another.

Subsequent versions will be copies of this code with minor
emendations.  Code copying is not desirable.  However, the functional
changes between versions are unpredictable.  It would be difficult to
create a class hierarchy that defined a base class that supported an
inheritance scheme general enough to anticipate all new requirments
such that a subclass could easily override base class functionality to
implement it.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;
use base qw(API::HTD::App);

use constant API_VERSION => 1; 

# =====================================================================
# =====================================================================
# Accessors
# =====================================================================
# =====================================================================
sub getVersion {
    my $self = shift;
    return API_VERSION;
}

# =====================================================================
# =====================================================================
# URI Validator
# =====================================================================
# =====================================================================


# ---------------------------------------------------------------------

=item validateQueryParams

For a given version

=cut

# ---------------------------------------------------------------------
sub validateQueryParams {
    my $self = shift;

    my $Q = $self->query();
    my $validParamsRef = $self->__getConfigVal('valid_query_params');

    my @params = $Q->param();
    foreach my $p (@params) {
        if (! grep(/^$p$/, @$validParamsRef)) {
            # Invalid param: set HTTP status line and bail
            $self->__setErrorResponseCode('400U');
            return 0;
        }
    }
    # POSSIBLY NOTREACHED

    if ($Q->param('alt') && ($Q->param('alt') ne 'json')) {
        # Invalid param: set HTTP status line and bail
        $self->__setErrorResponseCode('400U');
        return 0;
    }
    # POSSIBLY NOTREACHED

    return 1;
}


# =====================================================================
# =====================================================================
# Subclass Utilities
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __handlePdusHeader

Description

=cut

# ---------------------------------------------------------------------
sub __handlePdusHeader {
    my $self = shift;
    my $headerHashRef = shift;

    if ($self->isPdus()) {
        my $pdus_message = $self->__getConfigVal('pdus_message');
        $headerHashRef->{'-X_HathiTrust_Notice'} = $pdus_message;
    }
}

# ---------------------------------------------------------------------

=item __makeParamsRef

Order of params is order of regexp captures in config.yaml

=cut

# ---------------------------------------------------------------------
sub __makeParamsRef {
    my $self = shift;
    my ($resource, $id, $namespace, $barcode, $seq) = @_;
    return
    {
     'resource' => $resource,
     'id'       => $id,
     'ns'       => $namespace,
     'bc'       => $barcode,
     'seq'      => $seq,
    };
}


# ---------------------------------------------------------------------

=item __bindYAMLTokens

Tokens must be consistent with the V_1/config.yaml

=cut

# ---------------------------------------------------------------------
sub __bindYAMLTokens {
    my $self = shift;
    my $P_Ref = shift;

    $self->__setMember(':::DOWNLOADPAGEIMAGE',
                       sub { $self->__getDownloadability('pageimage') });
    $self->__setMember(':::DOWNLOADPAGEOCR',
                       sub { $self->__getDownloadability('pageocr') });
    $self->__setMember(':::DOWNLOADPAGECOORDOCR',
                       sub { $self->__getDownloadability('pagecoordocr') });
    $self->__setMember(':::DOWNLOADAGGREGATE',
                       sub { $self->__getDownloadability('aggregate') });

    $self->__setMember(':::PAGEIMAGEPROTOCOL',
                       sub { $self->__getProtocol('pageimage') });
    $self->__setMember(':::PAGEOCRPROTOCOL',
                       sub { $self->__getProtocol('pageocr') });
    $self->__setMember(':::PAGECOORDOCRPROTOCOL',
                       sub { $self->__getProtocol('pagecoordocr') });
    $self->__setMember(':::AGGREGATEPROTOCOL',
                       sub { $self->__getProtocol('aggregate') });

    $self->__setMember(':::IMAGEMIMETYPE',
                       sub { $self->__getMetaMimeType($P_Ref, 'image') });
    $self->__setMember(':::OCRMIMETYPE',
                       sub { $self->__getMetaMimeType($P_Ref, 'ocr') });
    $self->__setMember(':::COORDOCRMIMETYPE',
                       sub { $self->__getMetaMimeType($P_Ref, 'coordOCR') });

    $self->__setMember(':::UPDATED',
                       sub { API::Utils::getDateString });

    my @rightsTokens = qw/:::SOURCE
                          :::NAMESPACE
                          :::TIME
                          :::USER
                          :::REASON
                          :::ID
                          :::ATTR
                          :::NOTE/;

    my $ro = $self->__getRightsObject();

    foreach my $tok (@rightsTokens) {
        my ($field) = ($tok =~ m,([A-Z]+),);
        $field = lc($field);
        $self->__setMember($tok,
                           sub { $ro->getRightsFieldVal($field) || '' });
    }

    $self->__setMember(':::XINCLUDEMETS',
                       sub { $self->__getPairtreeFilename($P_Ref, 'mets.xml') });

    return 1;
}

# ---------------------------------------------------------------------

=item __getFilenameFromMETSfor

Description

=cut

# ---------------------------------------------------------------------
sub __getFilenameFromMETSfor {
   my $self = shift;
   my ($P_Ref, $fileType) = @_;

   my $fn;
   my $seq = $P_Ref->{'seq'};

   my $parser = XML::LibXML->new();
   my $doc = $self->__getBase_DOMtreeFor('structure', $P_Ref, $parser);
   my $xpath = q{//METS:fileGrp[@USE='} . $fileType . q{']/METS:file/METS:FLocat};

   my $attr = $doc->createAttributeNS('', 'dummy', '');
   $doc->getDocumentElement()->setAttributeNodeNS($attr);
   #'From: http://coding.derkeiler.com/Archive/Perl/comp.lang.perl.modules/2007-07/msg00045.html'
   my @fns;
   foreach my $node ($doc->findnodes($xpath)) {
       $fn = $node->findvalue('@xlink:href');
       push(@fns, $fn);
   }
   # Cache these ... phase 2?
   $fn = $fns[$seq-1];

   return $fn;
}


# ---------------------------------------------------------------------

=item __getFileResourceRepresentation

Description

=cut

# ---------------------------------------------------------------------
sub __getFileResourceRepresentation {
    my $self = shift;
    my ($P_Ref, $fileType) = @_;

    my ($representation, $extension);

    my $filename = $self->__getFilenameFromMETSfor($P_Ref, $fileType);
    if (defined($filename) && $filename) {
        $extension = $self->__getFileExtension($filename);
        my $zipFile = $self->__getPairtreeFilename($P_Ref, 'zip');
        if (-e $zipFile) {
            my $po = $self->__getPathObject();
            my $toExtract = $po->getPairtreeFilename($P_Ref->{'bc'}) . qq{/$filename};
            my $unzip_prog = $self->__getConfigVal('unzip_prog');

            $representation = `$unzip_prog -p $zipFile $toExtract`;
        }
    }

    # Allow the return of 0-length files (mainly OCR)
    return
        defined($representation)
            ? (\$representation, $filename, $extension)
                : (undef, undef, undef);
}



# =====================================================================
# =====================================================================
#  Version plugin subclass methods to handle resource creation
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item GET_structure

Return a representation of structure map for the resource.  METS for
now.

=cut

# ---------------------------------------------------------------------
sub GET_structure {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('structure', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode('404');
        return undef;
    }
    # POSSIBLY NOTREACHED

    my $format = $self->query->param('alt');
    my $representationRef =
        $self->__getMetadataResourceRepresentation($doc, $format);

    if (defined($representationRef) && $$representationRef) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('structure', $format);
        $self->header
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
            );
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;
}


# ---------------------------------------------------------------------

=item GET_meta

Description

=cut

# ---------------------------------------------------------------------
sub GET_meta {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('meta', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode('404');
        return undef;
    }
    # POSSIBLY NOTREACHED

    $doc = $self->__transform($doc,
                              $parser,
                              'mets_meta_xsl');

    my $format = $self->query->param('alt');
    my $representationRef =
        $self->__getMetadataResourceRepresentation($doc, $format);

    if (defined($representationRef) && $$representationRef) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('meta', $format);
        $self->header
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
            );
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;
}


# ---------------------------------------------------------------------

=item GET_pagemeta

Description

=cut

# ---------------------------------------------------------------------
sub GET_pagemeta {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('pagemeta', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode('404');
        return undef;
    }
    # POSSIBLY NOTREACHED

    $doc = $self->__transform($doc,
                              $parser,
                              'mets_pagemeta_xsl',
                              {SelectedSeq => $P_Ref->{'seq'}});

    my $format = $self->query->param('alt');
    my $representationRef
        = $self->__getMetadataResourceRepresentation($doc, $format);

    if (defined($representationRef) && $$representationRef) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pagemeta', $format);
        $self->header
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
            );
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;
}


# ---------------------------------------------------------------------

=item GET_aggregate

Description

=cut

# ---------------------------------------------------------------------
sub GET_aggregate {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my $representation;

    my $dataRef = $self->__readPairtreeFile($P_Ref, 'zip', 'binary');
    if (defined($dataRef) && $$dataRef) {
        $representation = $dataRef;
        my $filename = $self->__getPairtreeFilename($P_Ref, 'zip');
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('aggregate', 'zip');
        my %header =
            (
             -Status => $statusLine,
             -Content_type => $mimetype,
             -Content_Disposition => qq{filename=$filename},
            );
        $self->__handlePdusHeader(\%header);
        $self->header(%header);

    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representation;
}


# ---------------------------------------------------------------------

=item GET_pageocr

Description

=cut

# ---------------------------------------------------------------------
sub GET_pageocr {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my ($representationRef, $filename, $extension) =
        $self->__getFileResourceRepresentation($P_Ref, 'ocr');
    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pageocr', $extension);
        my %header =
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
             -Content_Disposition => qq{filename=$filename},
            );
        $self->__handlePdusHeader(\%header);
        $self->header(%header);
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;
}


# ---------------------------------------------------------------------

=item GET_pagecoordocr

Description

=cut

# ---------------------------------------------------------------------
sub GET_pagecoordocr {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my ($representationRef, $filename, $extension) =
        $self->__getFileResourceRepresentation($P_Ref, 'coordOCR');
    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pagecoordocr', $extension);
        my %header =
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
             -Content_Disposition => qq{filename=$filename},
            );
        $self->__handlePdusHeader(\%header);
        $self->header(%header);
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;
}

# ---------------------------------------------------------------------

=item GET_pageimage

Description

=cut

# ---------------------------------------------------------------------
sub GET_pageimage {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my ($representationRef, $filename, $extension) =
        $self->__getFileResourceRepresentation($P_Ref, 'image');
    if (defined($representationRef))
    {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pageimage', $extension);
        my %header = 
            (
             -Status => $statusLine,
             -Content_type => $mimetype,
             -Content_Disposition => qq{filename=$filename},
            );
        $self->__handlePdusHeader(\%header);
        $self->header(%header);
    }
    else {
        $self->__setErrorResponseCode('404');
    }

    return $representationRef;

}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009 ©, The Regents of The University of Michigan, All Rights Reserved

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
