package API::HTD::App::V_2::Plugin;


=head1 NAME

API::HTD::App::V_2::Plugin;

=head1 DESCRIPTION

This is a subclass of API::HTD::App which contains resource handlers
and associated support code to handle the Version 2 schemas for the
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

use XML::LibXML;

use base qw(API::HTD::App);
use Access::Statements;
use DataTypes;

use constant API_VERSION => 2;

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

=item __getDataType

Description

=cut

# ---------------------------------------------------------------------
sub __getDataType {
    my $self = shift;

    my $data_type;

    my $root = $self->__getMETS_root;
    return unless (defined $root);

    $data_type = DataTypes::getDataType($root);
    return unless (defined $data_type);

    return $data_type;
}

# ---------------------------------------------------------------------

=item validateQueryParams

For a given version

=cut

# ---------------------------------------------------------------------
sub validateQueryParams {
    my $self = shift;

    my $Q = $self->query;
    my $validParamsRef = $self->__getConfigVal('valid_query_params');

    # Only the query params we recognize ....
    my @params = $Q->param;
    foreach my $p (@params) {
        if (! grep(/^$p$/, @$validParamsRef)) {
            # Invalid param: set HTTP status line and bail
            $self->__errorDescription("invalid query parameter $p");
            return 0;
        }
    }

    # ... and must be associated with the correct resource
    my $resource = $self->__paramsRef->{resource};
    unless (grep(/^$resource$/, qw(aggregate structure type))) {
        my $data_type = $self->__getDataType;

        if (index($resource, $data_type) < 0) {
            $self->__errorDescription("type of ID is $data_type, request is for $resource");
            return 0;
        }
    }

    # validate format for XML resource types
    if (grep(/^$resource$/, qw(volume/meta volume/pagemeta structure article/meta type))) {
        my $format = $Q->param('format');
        if ($format && (! grep(/^$format$/, qw(json xml)))) {
            $self->__errorDescription("invalid format parameter value: $format");
            return 0;
        }
    }

    # validate format for non-format supported resources
    if (grep(/^$resource$/, qw(volume/pageocr volume/pagecoordocr aggregate article article/alternate article/assets/embedded article/assets/supplementary))) {
        my $format = $Q->param('format');
        if ($format) {
            $self->__errorDescription("format parameter not supported for resource");
            return 0;
        }
    }

    # Raw pageimage resource only supports format=raw not
    # resolutions. Unwatermarked image derivatives require ip,
    # watermark=0 parameters.
    if ($resource eq 'volume/pageimage') {
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
    }

    # volume resource only allows format=ebm
    elsif ($resource eq 'volume') {
        my $format = $Q->param('format');
        if (! $format || ($format ne 'ebm')) {
            $self->__errorDescription("invalid or missing format parameter value format=$format");
            return 0;
        }
    }

    return 1;
}



# =====================================================================
# =====================================================================
# Subclass Utilities
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __set_PluginType

Description

=cut

# ---------------------------------------------------------------------
sub __set_PluginType {
    my $self = shift;

    my $_type;
    my $root = $self->__getMETS_root;
    if (defined $root) {
        $_type = DataTypes::getDataType($root);
        unless (defined $_type) {
            $self->__setErrorResponseCode(404, 'cannot parse type for Plugin from METS');
            return 0;
        }
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch METS for Plugin');
        return 0;
    }
    # POSSIBLY NOTREACHED

    # Go ...
    my $subclass = ucfirst($_type);
    my $classPackage = qq{API::HTD::App::V_2::Plugin::$subclass};

    eval qq{require $classPackage};
    if ($@) {
        $self->__setErrorResponseCode(404, 'cannot compile subclass=$classPackage for Plugin');
        return 0;
    }
    else {
        bless $self, $classPackage;
    }

    return 1;
}

# ---------------------------------------------------------------------

=item __mapURIsToHandlers

Support mapping to handlers and backward compatibility between
e.g. volume/pageimage and pageimage.

Performs mapping of backward resources to their cannonical form:
pageimage -> volume_pageimage

=cut

# ---------------------------------------------------------------------
sub __mapURIsToHandlers {
    my $self = shift;

    my $patternsRef = $self->__getConfigVal('patterns');

    my $arkPattern =  $self->__getConfigVal('ark_pattern');;
    my $idPattern =  $self->__getConfigVal('id_pattern');;
    my $nsPattern =  $self->__getConfigVal('namespace_pattern');;

    my %map;
    foreach my $resource (keys %$patternsRef) {

        my $fullRE = $patternsRef->{$resource};
        $fullRE =~ s,_ARK_,$arkPattern,;
        $fullRE =~ s,_ID_,$idPattern,;
        $fullRE =~ s,_NS_,$nsPattern,;

        my $cannonicalResource = $resource;
        $cannonicalResource =~ s,/,_,g;

        my $handler = qq{GET_$cannonicalResource};
        $map{qr/$fullRE/} = $handler;
    }

    $self->resourceHooks(%map);
}

# ---------------------------------------------------------------------

=item __bindYAMLTokens

Tokens must be consistent with the V_2/config.yaml. Metadata is always open.

=cut

# ---------------------------------------------------------------------
sub __bindYAMLTokens {
    my $self = shift;

    # ----------------  DOWNLOAD-ability ---------------
    # Common
    $self->__setMember(':::DOWNLOADAGGREGATE',
                       sub { $self->__getDownloadability('aggregate') });
    # Volume
    $self->__setMember(':::DOWNLOADVOLUME',
                       sub { $self->__getDownloadability('volume') });
    $self->__setMember(':::DOWNLOADVOLUMEPAGEIMAGE',
                       sub { $self->__getDownloadability('volume/pageimage') });
    $self->__setMember(':::DOWNLOADVOLUMEPAGEOCR',
                       sub { $self->__getDownloadability('volume/pageocr') });
    $self->__setMember(':::DOWNLOADVOLUMEPAGECOORDOCR',
                       sub { $self->__getDownloadability('volume/pagecoordocr') });
    # Article
    $self->__setMember(':::DOWNLOADARTICLE',
                       sub { $self->__getDownloadability('article') });
    $self->__setMember(':::DOWNLOADARTICLEASSETS',
                       sub { $self->__getDownloadability('article/assets/embedded') });

    # ----------------  PROTOCOL ---------------
    # Common
    $self->__setMember(':::AGGREGATEPROTOCOL',
                       sub { $self->__getProtocol('aggregate') });
    # Volume
    $self->__setMember(':::VOLUMEPROTOCOL',
                       sub { $self->__getProtocol('volume') });
    $self->__setMember(':::VOLUMEPAGEIMAGEPROTOCOL',
                       sub { $self->__getProtocol('volume/pageimage') });
    $self->__setMember(':::VOLUMEPAGEOCRPROTOCOL',
                       sub { $self->__getProtocol('volume/pageocr') });
    $self->__setMember(':::VOLUMEPAGECOORDOCRPROTOCOL',
                       sub { $self->__getProtocol('volume/pagecoordocr') });
    # Article
    $self->__setMember(':::ARTICLEPROTOCOL',
                       sub { $self->__getProtocol('article') });
    $self->__setMember(':::ARTICLEASSETSPROTOCOL',
                       sub { $self->__getProtocol('article/assets/embedded') });


    # ----------------  MISCELLANEOUS --------------
    $self->__setAccessUseFields({stmt_url => 1, stmt_text => 1, stmt_key => 1});
    $self->__setMember(':::ACCESSUSE',
                       sub { $self->__getResourceAccessUseKey });
    $self->__setMember(':::ACCESSUSESTATEMENT',
                       sub { $self->__getResourceAccessUseStatement });
    $self->__setMember(':::UPDATED',
                       sub { API::Utils::getDateString });
    $self->__setMember(':::XINCLUDEMETS',
                       sub { $self->__getPairtreeFilename('mets.xml') });

    # Rights tokens
    my @rightsTokens = qw/:::SOURCE
                          :::NAMESPACE
                          :::TIME
                          :::USER
                          :::REASON
                          :::ID
                          :::ATTR
                          :::NOTE/;

    my $ro = $self->__getRightsObject;

    foreach my $tok (@rightsTokens) {
        my ($field) = ($tok =~ m,([A-Z]+),);
        $field = lc($field);
        $self->__setMember($tok,
                           sub { $ro->getRightsFieldVal($field) || '' });
    }

    return 1;
}


# ---------------------------------------------------------------------

=item __getFileResourceRepresentation

Description

=cut

# ---------------------------------------------------------------------
sub __getFileResourceRepresentation {
    my $self = shift;
    my $resource = shift;

    my $representation;

    my ($filename, $mimetype) = $self->__getFilenameFromMETSfor($resource);
    if (defined($filename) && $filename) {
        my $zipFile = $self->__getPairtreeFilename('zip');
        if (-e $zipFile) {
            my $barcode = $self->__paramsRef->{bc};
            my $po = $self->__getPathObject;
            my $toExtract = $po->getPairtreeFilename($barcode) . qq{/$filename};
            my $unzip_prog = $self->__getConfigVal('unzip_prog');

            $representation = `$unzip_prog -p '$zipFile' '$toExtract'`;
        }
    }

    # Allow the return of 0-length files (mainly OCR)
    return
        defined($representation)
            ? (\$representation, $filename, $mimetype)
                : (undef, undef, undef);
}

# ---------------------------------------------------------------------

=item __getFileFor

Description

=cut

# ---------------------------------------------------------------------
sub __getFileFor {
    my $self = shift;
    my $caller_name = shift;

    my $resource = $self->__paramsRef->{resource};
    my $resource_str = $self->__getParamsRefStr;
    hLOG('API: ' . $caller_name . q{: } . $resource_str . $self->query->self_url);

    my ($representationRef, $filename, $mimetype) = $self->__getFileResourceRepresentation($resource);
    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype . '; charset=utf8',
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg;
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch $resource resource');
    }

    return $representationRef;
}


# ---------------------------------------------------------------------

=item __getResourceMetaRepresentationFor

Description

=cut

# ---------------------------------------------------------------------
sub __getResourceMetaRepresentationFor {
    my $self = shift;
    my ($caller_name, $xsl_key, $args_hashref) = @_;

    hLOG('API: ' . $caller_name . q{: } . $self->__getParamsRefStr . $self->query->self_url);

    my $resource = $self->__paramsRef->{resource};
    my $parser = XML::LibXML->new;
    my $doc = $self->__getBase_DOMtreeFor($resource, $parser);
    if (! defined($doc)) {
        $self->__setErrorResponseCode(404, 'cannot parse $resource DOM tree');
        return undef;
    }
    # POSSIBLY NOTREACHED

    $doc = $self->__transform($doc,
                              $parser,
                              $xsl_key,
                              $args_hashref,
                             );

    my $format = $self->query->param('format') || 'xml';
    my $representationRef = $self->__getMetadataResourceRepresentation($doc, $format);

    if (defined($representationRef) && $$representationRef) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype($resource, $format);
        my $resource = $self->__paramsRef->{resource};
        $resource =~ s,/,-,g;
        my $filename = $resource . '-' . $self->__getIdParamsRef . ".$format";

        $self->header
            (
             -Status => $statusLine,
             -Content_type => $mimetype . '; charset=utf8',
             -Content_Disposition => qq{filename=$filename},
            );
        $self->__addHeaderAccessUseMsg;
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch $resource representation');
    }

    return $representationRef;

}


# =====================================================================
# =====================================================================
#  Version plugin subclass methods to handle resource creation
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item GET_type

Return a representation of the type of the resource.

=cut

# ---------------------------------------------------------------------
sub GET_type {
    my $self = shift;

    hLOG('API: ' . qq{GET_type: } . $self->__getParamsRefStr . $self->query->self_url);

    my $data_type;

    my $root = $self->__getMETS_root;
    if (defined $root) {
        $data_type = DataTypes::getDataType($root);
        unless (defined $data_type) {
            $self->__setErrorResponseCode(404, 'cannot parse type from METS');
            return;
        }
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch METS');
        return;
    }
    # POSSIBLY NOTREACHED

    my $format = $self->query->param('format') || 'xml';
    if ($format eq 'json') {
        $data_type = qq{"$data_type"};
    }
    else {
        $data_type = qq{<htd:object_type xmlns:htd="http://schemas.hathitrust.org/htd/2009">$data_type</htd:object_type>};
    }

    my $representationRef = \$data_type;

    my $statusLine = $self->__getConfigVal('httpstatus', 200);
    my $mimetype = $self->__getMimetype('type', $format);
    my $filename = 'type-' . $self->__getIdParamsRef . ".$format";

    $self->header
      (
       -Status => $statusLine,
       -Content_type => $mimetype . '; charset=utf8',
       -Content_Disposition => qq{filename=$filename},
      );

    return $representationRef;
}


# ---------------------------------------------------------------------

=item GET_structure

Return a representation of structure map for the resource.  METS for
now.

=cut

# ---------------------------------------------------------------------
sub GET_structure {
    my $self = shift;

    my $resource_str = $self->__getParamsRefStr;
    hLOG('API: ' . q{GET_structure: } . $resource_str . $self->query->self_url);

    my $representationRef;

    my $dataRef = $self->__readPairtreeFile('mets.xml');
    if (defined($dataRef) && $$dataRef) {
        my $format = $self->query->param('format');
        if ($format eq 'json') {
            $representationRef = $self->__makeJSON($dataRef);
        }
        else {
            $representationRef = $dataRef;
        }

        my $filename = $self->__getPairtreeFilename('mets.xml');
        # prevent Google Chrome error 346
        $filename =~ s/,/\./g;
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('structure', $format);

        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype,
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg;
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch structure resource');
    }

    return $$representationRef;
}

# ---------------------------------------------------------------------

=item GET_aggregate

Description

=cut

# ---------------------------------------------------------------------
sub GET_aggregate {
    my $self = shift;

    my $resource_str = $self->__getParamsRefStr;
    hLOG('API: ' . q{GET_aggregate: } . $resource_str . $self->query->self_url);

    my $representation;

    my $dataRef = $self->__readPairtreeFile('zip', 'binary');
    if (defined($dataRef) && $$dataRef) {
        $representation = $dataRef;
        my $filename = $self->__getPairtreeFilename('zip', 1);
        # prevent Google Chrome error 346
        $filename =~ s/,/\./g;
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        my $mimetype = $self->__getMimetype('aggregate', 'zip');

        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype,
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg;
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch aggregate resource');
    }

    return $representation;
}

# ---------------------------------------------------------------------

=item GET_volume_meta

Description

=cut

# ---------------------------------------------------------------------
sub GET_volume_meta {
    my $self = shift;

    return $self->__getResourceMetaRepresentationFor('GET_volume_meta', 'mets_meta_xsl');
}


# ---------------------------------------------------------------------

=item GET_volume_pagemeta

Description

=cut

# ---------------------------------------------------------------------
sub GET_volume_pagemeta {
    my $self = shift;

    return $self->__getResourceMetaRepresentationFor('GET_volume_pagemeta',
                                                         'mets_pagemeta_xsl',
                                                         { SelectedSeq => $self->__paramsRef->{seq} });
}

# ---------------------------------------------------------------------

=item GET_volume_pageocr

Description

=cut

# ---------------------------------------------------------------------
sub GET_volume_pageocr {
    my $self = shift;
    return $self->__getFileFor('GET_volume_pageocr');
}


# ---------------------------------------------------------------------

=item GET_volume_pagecoordocr

Description

=cut

# ---------------------------------------------------------------------
sub GET_volume_pagecoordocr {
    my $self = shift;
    return $self->__getFileFor('GET_volume_pagecoordocr');
}

# ---------------------------------------------------------------------

=item __get_pageimage

Description

=cut

# ---------------------------------------------------------------------
sub __get_pageimage {
    my $self = shift;

    my ($representationRef, $filename, $mimetype);

    my $Q = $self->query;
    my $format = $Q->param('format');
    if ($format eq 'raw') {
        ($representationRef, $filename, $mimetype) = $self->__getFileResourceRepresentation('volume/pageimage');
    }
    else {
        use constant _OK => 0;

        # Remove 'optimalderivative' from args to let imgsrv decide on format
        my @arg_arr = qw(format size width height res watermark);
        if ($format eq 'optimalderivative') {
            @arg_arr = grep(! /^format$/, @arg_arr);
            my $extension = $self->__getFileExtension($filename);
            $format = ($extension eq 'jp2') ? 'jpeg' : 'png';
        }

        my %args;
        foreach my $arg ( @arg_arr ) {
            my $argval = $Q->param($arg);
            $args{'--' . $arg} = $argval if (defined $argval);
        }
        my $id = $self->__getIdParamsRef;
        my $seq = $self->__paramsRef->{seq};

        my $script = $ENV{SDRROOT} . "/imgsrv/bin/image";
        my $cmd = "$script " . "--id=$id --seq=$seq " . join(" ", map sprintf(q{%s=%s}, $_, $args{$_}), keys %args);
        hLOG_DEBUG("API: GET_pageimage: imgsrv command=$cmd");

        my $buf = `$cmd`;
        my $rc = $? >> 8;
        if ($rc == _OK) {
            ($representationRef, $filename, $mimetype)
              = (\$buf, "$id.$format", $self->__getMimetype('volume/pageimage', $format));
        }
    }

    return ($representationRef, $filename, $mimetype);
}

# ---------------------------------------------------------------------

=item GET_volume_pageimage

Description

=cut

# ---------------------------------------------------------------------
sub GET_volume_pageimage {
    my $self = shift;

    my $resource_str = $self->__getParamsRefStr;
    hLOG('API: ' . qq{GET_volume_pageimage: } . $resource_str . $self->query->self_url);

    my ($representationRef, $filename, $mimetype) = $self->__get_pageimage;

    if (defined($representationRef)) {
        my $statusLine = $self->__getConfigVal('httpstatus', 200);
        $self->header(
                      -Status => $statusLine,
                      -Content_type => $mimetype,
                      -Content_Disposition => qq{filename=$filename},
                     );
        $self->__addHeaderAccessUseMsg;
        $self->__addHeaderInCopyrightMsg($resource_str);
    }
    else {
        $self->__setErrorResponseCode(404, 'cannot fetch volume/pageimage resource');
    }

    return $representationRef;
}

# ---------------------------------------------------------------------

=item __get_volume

Description

=cut

# ---------------------------------------------------------------------
sub __get_volume {
    my $self = shift;
    my $cmd_ref = shift;

    use IO::File;
    autoflush STDOUT 1;

    use IPC::Open3;
    use File::Spec;
    use Symbol qw(gensym);

    open(NULL, ">", File::Spec->devnull);
    my ($wtr, $rdr, $err) = (gensym, \*DATA, \*NULL);

    my $pid = open3($wtr, $rdr, $err, @$cmd_ref);
    binmode $rdr;

    my $coderef = sub {
        my $responder = shift;
        my $writer = $responder->([ 200, [ $self->header ] ]);
        my $buffer;
        while (read($rdr, $buffer, 4096)) {
            print STDERR "GOT: length = " . length($buffer) . "\n";
            $writer->write($buffer);
        }
        waitpid($pid, 0);
    };

    return $coderef;
}

# ---------------------------------------------------------------------

=item __get_volume_debug

Description

=cut

# ---------------------------------------------------------------------
sub __get_volume_debug {
    my $self = shift;
    my ($id, $cmd_ref) = @_;

    my $buf = `@$cmd_ref`;

    return \$buf;
}

# ---------------------------------------------------------------------

=item GET_volume

Dedicated handler for EBM POD PDF only. PDF creation is time-intensive
so this method passes a code block up the Plack stack to implement
streaming by Plack. This sub is Plack/PSGI aware. It does not follow
CGI::Application conventions.

=cut

# ---------------------------------------------------------------------
sub GET_volume {
    my $self = shift;

    my $DEBUG = 1 if ($ENV{HT_DEV});

    my $resource_str = $self->__getParamsRefStr;
    hLOG('API: ' . qq{GET_volume: } . $resource_str . $self->query->self_url);

    my $mimetype = $self->__getMimetype('volume');
    my $id = $self->__getIdParamsRef;
    my $filename = $id . '.pdf';
    $self->header(
                  'Content-type' => $mimetype,
                  'Content-Disposition' => qq{filename=$filename},
                 );
    $self->__addHeaderAccessUseMsg;
    $self->__addHeaderInCopyrightMsg($resource_str);

    my $script = $ENV{SDRROOT} . "/imgsrv/bin/pdf";
    my $cmd_ref = [ $script, "--format=ebm", "--id=$id" ];
    push(@$cmd_ref, ("--seq=1", "--seq=2")) if ($DEBUG);

    hLOG_DEBUG("API: GET_volume: imgsrv command=" . join(' ', @$cmd_ref));

    my $running_under_plack = $ENV{REST_APP_RETURN_ONLY};

    if ($running_under_plack) {
        return $self->__get_volume($cmd_ref);
    }
    else {
        return $self->__get_volume_debug($id, $cmd_ref);
    }
}

# ---------------------------------------------------------------------

=item GET_article

Description

=cut

# ---------------------------------------------------------------------
sub GET_article {
    my $self = shift;
    return $self->__getFileFor('GET_article');
}

# ---------------------------------------------------------------------

=item GET_article_alternate

Description

=cut

# ---------------------------------------------------------------------
sub GET_article_alternate {
    my $self = shift;
    return $self->__getFileFor('GET_article_alternate');
}

# ---------------------------------------------------------------------

=item GET_article_assets_embedded

Description

=cut

# ---------------------------------------------------------------------
sub GET_article_assets_embedded {
    my $self = shift;
    return $self->__getFileFor('GET_article_assets_embedded');
}

# ---------------------------------------------------------------------

=item GET_article_assets_supplementary

Description

=cut

# ---------------------------------------------------------------------
sub GET_article_assets_supplementary {
    my $self = shift;
    return $self->__getFileFor('GET_article_assets_supplementary');
}

# ---------------------------------------------------------------------

=item GET_article_meta

Description

=cut

# ---------------------------------------------------------------------
sub GET_article_meta {
    my $self = shift;

    return $self->__getResourceMetaRepresentationFor('GET_article_meta', 'mets_article_meta_xsl');
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-13 ©, The Regents of The University of Michigan, All Rights Reserved

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
