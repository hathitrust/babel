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
use warnings;

use base qw(API::HTD::App);
use Access::Statements;

use constant API_VERSION => 1;

use API::HTD_Log;
use API::HTD::AccessTypes;

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
    my $P_Ref = shift;

    my $Q = $self->query();
    my $validParamsRef = $self->__getConfigVal('valid_query_params');

    # Only the query params we recognize ....
    my @params = $Q->param();
    foreach my $p (@params) {
        if (! grep(/^$p$/, @$validParamsRef)) {
            # Invalid param: set HTTP status line and bail
            $self->__errorDescription("invalid query parameter $p");
            return 0;
        }
    }

    # ... and must be associated with the correct resource
    my $resource = $P_Ref->{resource};

    # JSON only makes sense for the XML resource types
    if (grep(/^$resource$/, qw(meta structure pagemeta))) {
        my $alt = $Q->param('alt');
        if ($alt && ($alt ne 'json')) {
            $self->__errorDescription("invalid alt parameter value: $alt");
            return 0;
        }
    }

    # Raw pageimage resource only supports format=raw not
    # resolutions. Unwatermarked image derivatives require ip,
    # watermark=0 parameters.
    elsif ($resource eq 'pageimage') {
        # If no format default is optimal derivative
        my $format = $Q->param('format') || $Q->param('format', 'optimalderivative'); 
        my ($w, $h, $r, $s, $watermark);
        $w = $Q->param('width'), $h =  $Q->param('height'), $r = $Q->param('res'), $s = $Q->param('size'), $watermark = $Q->param('watermark');
        my $derivative_param_defined = (defined($w) || defined($h) || defined($r) || defined($s) || defined($watermark));

        # Valid format?
        if (! grep(/^$format$/, qw(raw png jpeg optimalderivative))) {
            $self->__errorDescription("invalid format parameter value: $format");
            return 0;
        }

        if ($format eq 'raw') {
            # Default
            if ($derivative_param_defined) {
                $self->__errorDescription("invalid image query parameters present");
                return 0;
            }
        }
        else {
            # Unwatermarked derivative requires ip address hashed into
            # signature. Authorization for ip address is determined
            # downstream.
            if (defined($watermark) && ($watermark == 0)) {
                my $ip = $Q->param('ip');
                if (! API::Utils::valid_IP_address($ip)) {
                    $self->__errorDescription("unwatermarked derivative image ip parameter missing or invalid");
                    return 0;
                }
            }
        }
    }

    # PDF resource only allows format=ebm
    elsif ($resource eq 'pdf') {
        my $format = $Q->param('format');
        if (! $format || ($format ne 'ebm')) {
            $self->__errorDescription("invalid or missing format parameter value format=$format");
            return 0;
        }
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

=item __addHeaderInCopyrightMsg

Description

=cut

# ---------------------------------------------------------------------
sub __addHeaderInCopyrightMsg {
    my $self = shift;
    my $resource_str = shift;

    my $Header_Key = 'X-HathiTrust-InCopyright';

    my ($in_copyright, $attr) = $self->__getAccessObject()->getInCopyrightStatus();
    if ($in_copyright) {
        my $access_key = $self->query->param('oauth_consumer_key') || 0;
        $self->header(
                      $Header_Key => "user=$access_key;attr=$attr;access=data_api_user");
        hLOG('API: ' . qq{X-HathiTrust-InCopyright: access key=$access_key } . $resource_str);
    }
}


# ---------------------------------------------------------------------

=item __addHeaderAccessUseMsg

Description

=cut

# ---------------------------------------------------------------------
sub __addHeaderAccessUseMsg {
    my $self = shift;

    my $url = $self->{stmt_url};
    my $access_use_message = $self->__getConfigVal('access_use_intro') . " " . qq{$url};
    my $Header_Key = 'X-HathiTrust-Notice';

    $self->header(
                  $Header_Key => $access_use_message,
                 );
}

# ---------------------------------------------------------------------

=item __getResourceAccessUseStatement

Description

=cut

# ---------------------------------------------------------------------
sub __getResourceAccessUseStatement {
    my $self = shift;
    return $self->{stmt_text};
}

# ---------------------------------------------------------------------

=item __getResourceAccessUseKey

Description

=cut

# ---------------------------------------------------------------------
sub __getResourceAccessUseKey {
    my $self = shift;
    return $self->{stmt_key};
}


# ---------------------------------------------------------------------

=item __setAccessUseFields

Expects a hashref. Stores requested fields.

=cut

# ---------------------------------------------------------------------
sub __setAccessUseFields {
    my $self = shift;
    my $fieldHashRef = shift;

    my $ro = $self->__getRightsObject();
    my $dbh = $self->__get_DBH();

    my ($attr, $source) = (
                           $ro->getRightsFieldVal('attr'),
                           $ro->getRightsFieldVal('source')
                          );
    my $ref_to_arr_of_hashref =
      Access::Statements::get_stmt_by_rights_values(undef, $dbh, $attr, $source, $fieldHashRef);
    my $hashref = $ref_to_arr_of_hashref->[0];

    foreach my $field_val (keys %$hashref) {
        $self->__setMember($field_val, $hashref->{$field_val});
    }
}

# ---------------------------------------------------------------------

=item __makeParamsRef

Order of params is order of regexp captures in config.yaml

=cut

# ---------------------------------------------------------------------
sub __makeParamsRef {
    my $self = shift;
    my ($resource, $id, $namespace, $barcode, $x, $y, $z, $seq) = @_;
    my $ro = $self->__getRightsObject;

    return
    {
     'resource' => $resource,
     'id'       => $id,
     'ns'       => $namespace,
     'bc'       => $barcode,
     'seq'      => $seq,
     'attr'     => defined $ro ? $ro->getRightsFieldVal('attr') : 0,
     'source'   => defined $ro ? $ro->getRightsFieldVal('source') : 0,
    };
}

# ---------------------------------------------------------------------

=item __getIdParamsRef

Description

=cut

# ---------------------------------------------------------------------
sub __getIdParamsRef {
    my $self = shift;
    my $P_Ref = shift;

    return join('.', ($P_Ref->{'ns'}, $P_Ref->{'bc'}));
}

# ---------------------------------------------------------------------

=item __getParamsRefStr

Description

=cut

# ---------------------------------------------------------------------
sub __getParamsRefStr {
    my $self = shift;
    my $P_Ref = shift;

    return join(" ", map sprintf(q{%s="%s"}, $_, $$P_Ref{$_}), keys %$P_Ref) . ' ';
}


# ---------------------------------------------------------------------

=item __mapURIsToHandlers

Description

=cut

# ---------------------------------------------------------------------
sub __mapURIsToHandlers {
    my $self = shift;

    my $patternsRef = $self->__getConfigVal('patterns');
    my $arkPattern =  $self->__getConfigVal('ark_pattern');;

    my %map;
    foreach my $p (keys %$patternsRef) {
        my $fullRE = $patternsRef->{$p};
        $fullRE =~ s,___ARK___,$arkPattern,;
        my $handler = qq{GET_$p};
        $map{qr/$fullRE/} = $handler;
    }

    $self->resourceHooks(%map);
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

    $self->__setAccessUseFields({stmt_url => 1, stmt_text => 1, stmt_key => 1});
    $self->__setMember(':::ACCESSUSE',
                       sub { $self->__getResourceAccessUseKey() });
    $self->__setMember(':::ACCESSUSESTATEMENT',
                       sub { $self->__getResourceAccessUseStatement() });

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

            $representation = `$unzip_prog -p '$zipFile' '$toExtract'`;
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

    hLOG('API: ' . qq{GET_structure: } . $self->__getParamsRefStr($P_Ref) . $self->query->self_url);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('structure', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode(404, 'cannot parse structure DOM tree');
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
        $self->__addHeaderAccessUseMsg();
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch structure representation');
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

    hLOG('API: ' . qq{GET_meta: } . $self->__getParamsRefStr($P_Ref) . $self->query->self_url);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('meta', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode(404, 'cannot parse meta DOM tree');
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
        $self->__addHeaderAccessUseMsg();
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch meta representation');
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

    hLOG('API: ' . qq{GET_pagemeta: } . $self->__getParamsRefStr($P_Ref) . $self->query->self_url);

    my $parser = XML::LibXML->new();
    my $doc = $self->__getBase_DOMtreeFor('pagemeta', $P_Ref, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode(404, 'cannot parse pagemeta DOM tree');
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
        $self->__addHeaderAccessUseMsg();
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch pagemeta representation');
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

    my $resource_str = $self->__getParamsRefStr($P_Ref);
    hLOG('API: ' . qq{GET_aggregate: } . $resource_str . $self->query->self_url);

    my $representation;

    my $dataRef = $self->__readPairtreeFile($P_Ref, 'zip', 'binary');
    if (defined($dataRef) && $$dataRef) {
        $representation = $dataRef;
        my $filename = $self->__getPairtreeFilename($P_Ref, 'zip', 1);
        # prevent Google Chrome error 346
        $filename =~ s/,/\./g;
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('aggregate', 'zip');

        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype,
                      -Content_Disposition => qq{attachment; filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg();
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch aggregate resource');
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

    my $resource_str = $self->__getParamsRefStr($P_Ref);
    hLOG('API: ' . qq{GET_pageocr: } . $resource_str . $self->query->self_url);

    my ($representationRef, $filename, $extension) =
        $self->__getFileResourceRepresentation($P_Ref, 'ocr');
    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pageocr', $extension);

        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype . '; charset=utf8',
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg();
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch pageocr resource');
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

    my $resource_str = $self->__getParamsRefStr($P_Ref);
    hLOG('API: ' . qq{GET_pagecoordocr: } . $resource_str . $self->query->self_url);

    my ($representationRef, $filename, $extension) =
        $self->__getFileResourceRepresentation($P_Ref, 'coordOCR');
    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pagecoordocr', $extension);
        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype . '; charset=utf8',
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg();
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch pagecoordocr resource');
    }

    return $representationRef;
}

# ---------------------------------------------------------------------

=item __get_pageimage

Description

=cut

# ---------------------------------------------------------------------
sub __get_pageimage {
    my $self = shift;
    my $P_Ref = shift;

    my ($representationRef, $filename, $extension);

    my $Q = $self->query();
    my $format = $Q->param('format');
    if ($format eq 'raw') {
        ($representationRef, $filename, $extension) = $self->__getFileResourceRepresentation($P_Ref, 'image');
    }
    else {
        use constant _OK => 0;

        # Remove 'optimalderivative' to let imgsrv decide on format
        my @arg_arr = qw(format size width height res watermark);
        if ($format eq 'optimalderivative') {
            @arg_arr = grep(! /^format$/, @arg_arr)
        }

        my %args;
        foreach my $arg ( @arg_arr ) {
            my $argval = $Q->param($arg);
            $args{'--' . $arg} = $argval if (defined $argval);
        }
        my $id = $self->__getIdParamsRef($P_Ref);
        my $seq = $P_Ref->{'seq'};

        my $script = $ENV{SDRROOT} . "/imgsrv/bin/image";
        my $cmd = "$script " . "--id=$id --seq=$seq " . join(" ", map sprintf(q{%s=%s}, $_, $args{$_}), keys %args);
        hLOG_DEBUG("API: GET_pageimage: imgsrv command=$cmd");
        
        my $buf = `$cmd`;
        my $rc = $? >> 8;
        if ($rc == _OK) {
            ($representationRef, $filename, $extension) = (\$buf, $id . ".$format", $format);
        }
    }

    return ($representationRef, $filename, $extension);
}

# ---------------------------------------------------------------------

=item GET_pageimage

Description

=cut

# ---------------------------------------------------------------------
sub GET_pageimage {
    my $self = shift;
    my $P_Ref = $self->__makeParamsRef(@_);

    my $resource_str = $self->__getParamsRefStr($P_Ref);
    hLOG('API: ' . qq{GET_pageimage: } . $resource_str . $self->query->self_url);

    my ($representationRef, $filename, $extension) = $self->__get_pageimage($P_Ref);

    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('pageimage', $extension);

        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype,
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg();
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch pageimage resource');
    }

    return $representationRef;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-12 ©, The Regents of The University of Michigan, All Rights Reserved

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
