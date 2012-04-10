package API::HTD::App;

=head1 NAME

API::HTD::App;

=head1 DESCRIPTION

This class is a subclass of API::RESTApp.

URI scheme:

http[s]://services.hathitrust.org/api/htd/:RESOURCE/:ID[/:SEQ]
?
[v=:N] [&alt=json[&callback=:CALLBACK]]

Concrete path info regexps for /:RESOURCE/:ID

:ID ::= (mdp|miua|miun|wu)\.[a-z.0-9]+
:SEQ ::= \d+

/meta/(:ID)$
/structure/(:ID)$
/aggregate/(:ID)$

/pageimage/(:ID)/(:SEQ)$
/pageocr/(:ID)/(:SEQ)$
/pagemeta/(:ID)/(:SEQ)$

The calling sequence for the base class is:

    new()
        setup() - overridden
    run()
        preRun() - NOOP
        loadResource()
            getMatchText()
                getPathInfo()
                    query()
                        defaultQueryObject()
            defaultResourceHandler() - NOOP
            resourceHooks()
            checkMatch()
                _setLastRegexMatches()
            _getHandlerFromHook()
                resourceHooks()
                defaultResourceHandler() - NOOP
                getRequestMethod()
                    query()
                        defaultQueryObject()
                bestContentType()
                    simpleContentNegotiation
                        getContentPrefs
                            getAcceptHeader
                        scoreType()
            callHandler()
                getHandlerArgs
                    _getLastRegexMatches()
                    extraHandlerArgs()
                preHandler() - NOOP
                ... your handler called here ...
                postHandler() - NOOP
        postRun() - NOOP
        getHeaders()
            headerType()
            query()
                defaultQueryObject()
            header()
        addRepresentation()


=head1 SYNOPSIS

use API::HTD::App;
API::HTD::App->new()->run();


=head1 METHODS

=over 8

=cut

use strict;
use base qw(API::RESTApp);

# Perl
use DBI;
#use YAML::Any;
use XML::LibXML;
use XML::Simple;
use XML::SAX;
use JSON::XS;
use XML::LibXSLT;

# Local
use API::Path;
use API::Utils;
use API::DbIF;
use API::HTD_Log;

use API::HTD::Rights;
use API::HTD::HAuth;
use API::HTD::HConf;
use API::HTD::AccessTypes;

my $DEBUG = '';

# =====================================================================
# =====================================================================
#  Overridden REST::Application Methods
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item setup

Overrides base class method to set up mapping between PATH_INFO and
request handlers

=cut

# ---------------------------------------------------------------------
sub setup {
    my $self = shift;

    # config
    my $ver = $self->getVersion();
    my $config_object = new API::HTD::HConf(
                                            [
                                             $ENV{'SDRROOT'} . '/htd/lib/API/HTD/base-config.yaml',
                                             $ENV{'SDRROOT'} . qq{/htd/lib/API/HTD/App/V_${ver}/config.yaml},
                                            ]
                                           );
    if ($config_object->initSuccess) {
        $self->__setMember('config', $config_object);
    }
    else {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(500, $config_object->errstr);
        return 0;
    }
    
    $self->__debugging();
    # POSSIBLY NOTREACHED

    # We only support HTTP GET
    if ($self->getRequestMethod() ne 'GET') {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(405, $self->getRequestMethod() . " method not supported");
        return 0;
    }
    # POSSIBLY NOTREACHED

    # Query parameter validation.  Failure is fobbed off to the
    # defaultResourceHandler to deal with the mess
    if (! $self->validateQueryParams()) {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(400);
        return 0;
    }
    # POSSIBLY NOTREACHED

    # We need a database connection from this point on.
    my $DBH = API::DbIF::databaseConnect
      (
       $self->__getConfigVal('database', 'name'),
       $self->__getConfigVal('database', 'user'),
       $self->__getConfigVal('database', 'passwd'),
       $self->__getConfigVal('database', 'server'),
      );

    if (! $DBH) {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(500, "database connect error");
        return 0;
    }
    # POSSIBLY NOTREACHED

    $self->__setMember('dbh', $DBH);

    # Map to requested version of resource handlers.
    $self->__mapURIsToHandlers();
}



# ---------------------------------------------------------------------

=item defaultResourceHandler

Overeide base class method. Clean up messes from failed parameter
validation, unmatching URIs, unsupported HTTP access methods, etc.

=cut

# ---------------------------------------------------------------------
sub defaultResourceHandler {
    my $self = shift;

    # Some conditions will already have set the header so preserve
    # that otherwise assume a 500
    if (! $self->header()) {
        $self->__setErrorResponseCode(500);
    }

    return $self->__errorDescription;
}

# ---------------------------------------------------------------------

=item preHandler

Override base class method to create the Rights object prior to
invoking handlers.  All handlers (so far) need this data.

Access rights database

Authorize

Bind tokens

Defer to defaultResourceHandler() on errors otherwise return candidate
handler passed in by callHandler

=cut

# ---------------------------------------------------------------------
sub preHandler {
    my $self = shift;
    my $argsRef = shift;
    my $handler = shift;

    my $defaultHandler = sub { $self->defaultResourceHandler() };

    # Noting to do if setup failed.
    return $defaultHandler
        if ($self->__setupError());
    # POSSIBLY NOTREACHED

    # Did the handlers bind OK?
    if (! $self->handlerBindingOk()) {
        $self->__setErrorResponseCode(400, "invalid URI");
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    my $P_Ref = $self->__makeParamsRef(@$argsRef);

    # Get a Rights object. We need this either to permit access or to
    # fill in response data for unrestricted resource.
    my $ro = API::HTD::Rights::createRightsObject($self->__get_DBH(), $P_Ref);
    if (! defined($ro)) {
        my $id = $self->__getIdParamsRef($P_Ref);
        $self->__setErrorResponseCode(404, "rights information not found for $id");
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED
    $self->__setMember('rights', $ro);

    # Get an access type object
    my $ato = new API::HTD::AccessTypes({
                                         _rights => $ro,
                                         _config => $self->__getConfObject,
                                         _debug  => $DEBUG,
                                        });
    $self->__setMember('access', $ato);
    

    # Authenticate and authorize
    if (! $self->__authNZ_Success($P_Ref)) {
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    # Create bindings to tokens in the YAML
    if (! $self->__bindYAMLTokens($P_Ref)) {
        $self->__setErrorResponseCode(500, "token binding failure");
        return $defaultHandler;
    }

    # Create Path object
    my $po = API::Path->new($ENV{'SDRDATAROOT'} . q{/obj/} . $P_Ref->{'ns'} . q{/pairtree_root});
    $self->__setMember('path', $po);

    return $handler;
}


# =====================================================================
# =====================================================================
#  Utilities
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __debugging

Description

=cut

# ---------------------------------------------------------------------
sub __debugging {
    my $self = shift;

    # Debug only allowed in development
    if ($self->__allowDevelopmentDebugging()) {
        $DEBUG = $self->query()->param('debug') || $ENV{'DEBUG'} || '';
    }

    if ($DEBUG) {
        print CGI::header() unless ($DEBUG eq 'local');
    }

    if ($DEBUG eq 'env') {
        print $self->__printEnv();
        exit 0;
    }
}


# ---------------------------------------------------------------------

=item __printEnv

Format the %ENV hash

=cut

# ---------------------------------------------------------------------
sub __printEnv {
    my $self = shift;
    my $s;
    foreach my $key (sort keys(%ENV)) {
        my $e = $ENV{$key};
        $s .= qq{<b>$key = $e</b><br/>\n};
    }
    return $s;
}

# ---------------------------------------------------------------------

=item __getYAMLTokenBinding

Description

=cut

# ---------------------------------------------------------------------
sub __getYAMLTokenBinding {
    my $self = shift;
    my $token = shift;
    return $self->{$token};
}

# ---------------------------------------------------------------------

=item __lookupDN

Description

=cut

# ---------------------------------------------------------------------
sub __lookupDN {
    my $self = shift;
    my $DN = shift;

    return 0;
}

# ---------------------------------------------------------------------

=item __getFileExtension

Description

=cut

# ---------------------------------------------------------------------
sub __getFileExtension {
    my $self = shift;
    my $filename = shift;
    my ($extension) = ($filename =~ m,^.+\.(.+)$,);
    return $extension;
}


# ---------------------------------------------------------------------

=item __getPairtreeFilename

Description

=cut

# ---------------------------------------------------------------------
sub __getPairtreeFilename {
    my $self = shift;
    my ($P_Ref, $extension, $bare) = @_;

    my $po = $self->__getPathObject();
    my $filename = $po->getPairtreeFilename($P_Ref->{'bc'}) . qq{.$extension};
    if (! $bare) {
        my $dir = $po->getItemDir($P_Ref->{'bc'});
        $filename = qq{$dir/} . $filename;
    }

    return $filename;
}


# ---------------------------------------------------------------------

=item __readPairtreeFile

Description

=cut

# ---------------------------------------------------------------------
sub __readPairtreeFile {
    my $self = shift;
    my ($P_Ref, $extension, $binary) = @_;

    my $dataRef;
    my $filename = $self->__getPairtreeFilename($P_Ref, $extension);
    if (-e $filename) {
        $dataRef = API::Utils::readFile($filename, $binary);
    }

    return $dataRef;
}


# ---------------------------------------------------------------------

=item __setErrorResponseCode

Set the HTTP status line in the header

=cut

# ---------------------------------------------------------------------
sub __setErrorResponseCode {
    my $self = shift;
    my ($code, $msg) = @_;

    $self->resetHeader();

    my $statusLine = $self->__getConfigVal('httpstatus', $code) || $code;
    $self->header(
                  -status => $statusLine,
                 );

    $self->__errorDescription($msg) if ($msg);

    my $desc = $self->__errorDescription;
    if ($desc) {
        $self->header(
                      -type           => q{text/plain; charset=utf8},
                      -content_length => bytes::length($desc),
                     );
        if (OAuth::Lite::Problems->match($desc)) {
            my $header = "OAuth $desc";
            $self->header(
                          -WWW_Authenticate => $header,
                         );
        }
    }
    hLOG(qq{__setErrorResponseCode: code=$code description=$desc});
}


# ---------------------------------------------------------------------

=item __mapURIsToHandlers

Description

=cut

# ---------------------------------------------------------------------
sub __mapURIsToHandlers {
    my $self = shift;

    my $patternsRef = $self->__getConfigVal('patterns');

    my %map;
    foreach my $p (keys %$patternsRef) {
        my $fullRE = $patternsRef->{$p};
        my $handler = qq{GET_$p};
        $map{qr/$fullRE/} = $handler;
    }

    $self->resourceHooks(%map);
}


# =====================================================================
# =====================================================================
#  Pure virtual. Must be implemented in a version plugin subclass.
# =====================================================================
# =====================================================================

sub getVersion {
    my $self = shift;
    return 0;
}

sub validateQueryParams {
    my $self = shift;
    return 0;
}

sub __makeParamsRef {
    my $self = shift;
    return undef;
}

sub __bindYAMLTokens {
    my $self = shift;
    return 0;
}


# =====================================================================
# =====================================================================
#  Accessors
# =====================================================================
# =====================================================================

sub __errorDescription {
    my $self = shift;
    my $desc = shift;
    $self->{error_description} = $desc if (defined $desc);
    return $self->{error_description};
}

sub __getRightsObject {
    my $self = shift;
    return $self->{'rights'};
}

sub __getConfObject {
    my $self = shift;
    return $self->{'config'};
}

sub __getAccessObject {
    my $self = shift;
    return $self->{'access'};
}

sub __getHAuthObject {
    my $self = shift;
    return $self->{'hauth'};
}

sub __get_DBH {
    my $self = shift;
    return $self->{'dbh'};
}

sub __getPathObject {
    my $self = shift;
    return $self->{'path'};
}

sub __setupError {
    my $self = shift;
    return $self->{'setup_error'};
}

sub __setMember {
    my $self = shift;
    my ($key, $val) = @_;
    $self->{$key} = $val;
}

sub __getConfigVal {
    my $self = shift;
    return $self->__getConfObject()->getConfigVal(@_);
}

sub __getAccessTypeByResource {
    my $self = shift;
    return $self->__getAccessObject()->getAccessTypeByResource(@_);

}

# =====================================================================
# =====================================================================
#  Helpers
# =====================================================================
# =====================================================================


# ---------------------------------------------------------------------

=item __getClientQueryParams

Extract a hash of the query string parameters that are not
OAuth-related, e.g. 'v'

=cut

# ---------------------------------------------------------------------
sub __getClientQueryParams {
    my $self = shift;

    my $hashRef = {};

    my $clientParamsRef  = $self->__getConfigVal('client_query_params');
    my $Q = $self->query();
    foreach my $p (@$clientParamsRef) {
        my $val = $Q->param($p);
        $hashRef->{$p} = $val if ($val);
    }

    return $hashRef;
}

# ---------------------------------------------------------------------

=item __getDownloadability

This is the downloadability value we put into the Atom response.  It
is not the resolved value we base the download decision on.

=cut

# ---------------------------------------------------------------------
sub __getDownloadability {
    my $self = shift;
    my $resource = shift;

    my $accessType = $self->__getAccessTypeByResource($resource);
    # support 'free_restricted'
    my $downloadability = 'restricted' if ($accessType =~ m,restricted,);

    if ($DEBUG eq 'access') { print qq{resource=$resource download=$downloadability<br/>\n} }

    return $downloadability;
}

# ---------------------------------------------------------------------

=item __getProtocol

Description

=cut

# ---------------------------------------------------------------------
sub __getProtocol {
    my $self = shift;
    my $resource = shift;

    my $accessType = $self->__getAccessTypeByResource($resource);
    my $protocol = ($accessType =~ m,restricted,) ? 'https' : 'http';
    if ($DEBUG eq 'access') { print qq{resource=$resource protocol="$protocol"<br/>\n} }

    return $protocol;
}

# ---------------------------------------------------------------------

=item __getMetaMimeType

Description

=cut

# ---------------------------------------------------------------------
sub __getMetaMimeType {
    my $self = shift;
    my $P_Ref = shift;
    my $fileType = shift;

    my $mimeType;

    # For now.  Expand when more text types become available
    if ($fileType eq 'ocr') {
        $mimeType = $self->__getMimetype('pageocr', 'txt');
    }
    elsif ($fileType eq 'coordOCR') {
        my $filename = $self->__getFilenameFromMETSfor($P_Ref, 'pagecoordocr');
        my $extension = $self->__getFileExtension($filename);

        $mimeType = $self->__getMimetype('pagecoordocr', 'txt');
    }
    elsif ($fileType eq 'image') {
        my $filename = $self->__getFilenameFromMETSfor($P_Ref, 'image');
        my $extension = $self->__getFileExtension($filename);

        $mimeType = $self->__getMimetype('pageimage', $extension);
    }

    return $mimeType;
}

# ---------------------------------------------------------------------

=item __getMimetype

Description

=cut

# ---------------------------------------------------------------------
sub __getMimetype {
    my $self = shift;
    my ($resource, $format_OR_extension) = @_;

    $format_OR_extension ||= 'default';

    my $key = $self->__getConfigVal('extension_format_map', $format_OR_extension);
    my $mimetype = $self->__getConfigVal('mimetype_map', $resource, $key);

    return $mimetype;
}


# =====================================================================
# =====================================================================
#  Authentication and authorization methods
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __authNZ_Success

Description

=cut

# ---------------------------------------------------------------------

sub __authNZ_Success {
    my $self = shift;
    my $P_Ref = shift;    

    my $Q = $self->query;
    my $accessType = $self->__getAccessTypeByResource($P_Ref->{resource});
    
    # Get an authentication object.
    my $hauth = new API::HTD::HAuth({
                                     _query       => $Q,
                                     _dbh         => $self->__get_DBH,
                                     _debug       => $DEBUG,
                                    });
    $self->__setMember('hauth', $hauth);

    # Allow through back door?
    if ($hauth->H_allow_development_auth()) {
        return 1;
    }
    # POSSIBLY NOTREACHED

    my $Success = 0;
    
    # Authenticate and authorize an OAuth request
    if ($hauth->H_request_is_oauth($Q)) {
        $Success = ($self->__authenticated() && $self->__authorized($P_Ref));
    }
    elsif (! $hauth->H_allow_non_oauth_by_grace($accessType)) {
        $self->__setErrorResponseCode(403, "access_type=$accessType in non-oauth request not allowed in grace period");    
    }
    else {
        $Success = 1;
    }
    
    exit 0 if ($DEBUG eq 'auth');
    return $Success;
}


# ---------------------------------------------------------------------

=item __allowDevelopmentDebugging

Description

=cut

# ---------------------------------------------------------------------
sub __allowDevelopmentDebugging {
    my $self = shift;

    return (defined $ENV{HT_DEV} ? 1 : 0);
}


# ---------------------------------------------------------------------

=item __authenticated

Description

=cut

# ---------------------------------------------------------------------
sub __authenticated {
    my $self = shift;

    my $authenticated = 0;
    my $hauth = $self->__getHAuthObject();

    my $Q = $self->query();
    my $dbh = $self->__get_DBH();
    my $client_data = $self->__getClientQueryParams();

    if ($hauth->H_authenticate($Q, $dbh, $client_data)) {
        $authenticated = 1;
    }
    else {
        $self->__setErrorResponseCode(401, $hauth->errstr);
    }

    if ($DEBUG eq 'auth') {print qq{authenticated=$authenticated error="} . $hauth->errstr . qq{"<br/>\n}};
    
    return $authenticated;
}


# ---------------------------------------------------------------------

=item __authorized

See if the client is authorized to access the resource being
requested.  This is a function of access type which is in turn a
function of rights, source and resource.

i.e.

authorization = f(access_type = g(rights, source, resource))

=cut

# ---------------------------------------------------------------------
sub __authorized {
    my $self = shift;
    my $P_Ref = shift;

    my $error;
    my $authorized = 0;

    # Access types: open, limited, open_restricted, restricted
    my $resource = $P_Ref->{'resource'};
    my $accessType = $self->__getAccessTypeByResource($resource);

    my $hauth = $self->__getHAuthObject();
    my $Q = $self->query();
    my $dbh = $self->__get_DBH();

    if ($hauth->H_authorized($Q, $dbh, $resource, $accessType)) {
        $authorized = 1;
    }
    else {
        $error = $hauth->errstr;
        $self->__setErrorResponseCode(403, $error);
    }

    if ($DEBUG eq 'auth') { 
        print qq{resource=$resource access_type=$accessType authorized=$authorized error="$error"<br/>\n};
        exit 0;
    }

    return $authorized;
}


# =====================================================================
# =====================================================================
# Base class Parsing methods (p__) for XML-based responses whose
# schemas are defined in V_n/config.yaml
# =====================================================================
# =====================================================================


# ---------------------------------------------------------------------

=item p__processValue

Description

=cut

# ---------------------------------------------------------------------
sub p__processValue {
    my $self = shift;
    my $val = shift;
    my $P_Ref = shift;
    my $level = shift;

    my $orig_val = $val;

    my ($pointer) = ($val =~ m,(_HTD_[A-Z_]+_),);
    if ($pointer) {
        my $pointerVal = $self->__getConfigVal($pointer);
        $val =~ s,$pointer,$pointerVal,;
    }
    $val =~ s,__ID__,$P_Ref->{'id'},;
    $val =~ s,__SEQ__,$P_Ref->{'seq'},;

    my @boundTokens = ($val =~ m,:::[A-Z]+,g);
    foreach my $token (@boundTokens) {
        my $handler = $self->__getYAMLTokenBinding($token);
        my $replacement = &$handler;
        $val =~ s,$token,$replacement,;
    }

    if ($DEBUG eq 'tree') { print "&nbsp;" x (5*$level), "<b>p__processValue:</b> $orig_val => $val<br/>\n"; }

    return $val;
}

# ---------------------------------------------------------------------

=item p__handleAttributes

Description

=cut

# ---------------------------------------------------------------------
sub p__handleAttributes {
    my $self = shift;
    my ($elem, $attrRef, $P_Ref, $level) = @_;

    if (ref($attrRef) eq 'HASH') {
        foreach my $aName (keys %{ $attrRef }) {
            if ($DEBUG eq 'tree') { print "&nbsp;" x (5*$level), "<b>p__handleAttributes:</b> elem=" . ($elem ? $elem->nodeName : '') . " attribute=$aName" . "<br/>\n"; }
            my $attrVal = $attrRef->{$aName};
            $attrVal = $self->p__processValue($attrVal, $P_Ref, $level+1);
            $elem->setAttribute($aName, $attrVal);
        }
    }
}

# ---------------------------------------------------------------------

=item p__handleContent

Description

=cut

# ---------------------------------------------------------------------
sub p__handleContent {
    my $self = shift;
    my ($doc, $parentElem, $elem, $P_Ref, $ref, $level) = @_;

    if ($DEBUG eq 'tree') { print "&nbsp;" x (5*$level),  "<b>p__handleContent:</b> elem=" . ($parentElem ? $parentElem->nodeName : '') . "<br/>\n"; }

    if ($parentElem) {
        $parentElem->appendChild($elem);
    }
    else {
        $doc->setDocumentElement($elem);
    }

    if (ref($ref) eq 'HASH') {
        # ! Indirect recursion !
        $self->p__buildXML($doc, $elem, $P_Ref, $ref, $level+1);
    }
    elsif ($ref ne 'null') {
        $ref = $self->p__processValue($ref, $P_Ref, $level+1);
        $elem->appendText($ref);
    }
}

# ---------------------------------------------------------------------

=item p__handleElement

Description

=cut

# ---------------------------------------------------------------------
sub p__handleElement {
    my $self = shift;
    my ($doc, $parentElem, $eName, $P_Ref, $ref, $level) = @_;

    if ($DEBUG eq 'tree') { print "&nbsp;" x (5*$level), "<b>p__handleElement:</b> parent elem=" . ($parentElem ? $parentElem->nodeName : '') . " elem=$eName" . "<br/>\n"; }

    my $elem = $doc->createElement($eName);

    my $attrRef = $ref->{'attrs'};
    $self->p__handleAttributes($elem, $attrRef, $P_Ref, $level+1);

    my $contentRef = $ref->{'content'};
    $self->p__handleContent($doc, $parentElem, $elem, $P_Ref, $contentRef, $level+1);
}

# ---------------------------------------------------------------------

=item p__buildXML

Description

=cut

# ---------------------------------------------------------------------
sub p__buildXML {
    my $self = shift;
    my ($doc, $parentElem, $P_Ref, $responsesRef, $level) = @_;

    if ($DEBUG eq 'tree') { print "&nbsp;" x (5*$level),  "<b>p__buildXML:</b> " . ($parentElem ? $parentElem->nodeName : '') . "<br/>\n"; }

    foreach my $eName (keys %$responsesRef) {
        my $eRef = $responsesRef->{$eName};
        if (ref($eRef) eq 'ARRAY') {
            foreach my $hashRef (@$eRef) {
                $self->p__handleElement($doc, $parentElem, $eName, $P_Ref, $hashRef, $level+1);
            }
        }
        else {
            $self->p__handleElement($doc, $parentElem, $eName, $P_Ref, $eRef, $level+1);
        }
    }
}


# ---------------------------------------------------------------------

=item p__processXIncludes

Description

=cut

# ---------------------------------------------------------------------
sub p__processXIncludes {
    my $self = shift;
    my ($doc, $parser, $P_Ref) = @_;

    # See if parser will be able to access the METS file
    my $filename = $self->__getPairtreeFilename($P_Ref, 'mets.xml');
    if (-e $filename) {
        $parser->processXIncludes($doc);
        return 1;
    }
    return 0;
}

# =====================================================================
# =====================================================================
# Base class helpers
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __transform

The optional $paramRef is used to pass a parameter to the stylesheet
instead of using <xsl:variable> because the <xi:xinclude> expansion in
the doc object apparently leaves XML_XINCLUDE_{START|END} nodes in the
dom tree that screw up the select on the xml element I was using to
create this variable in the stylesheet.  Seems like a XML::LibXSLT
bug.

=cut

# ---------------------------------------------------------------------
sub __transform {
    my $self = shift;
    my ($doc, $parser, $metsFileKey, $XSLvarRef) = @_;

    my $metsXSL = $ENV{'SDRROOT'} . $self->__getConfigVal($metsFileKey);
    my $metsXSL_fh = API::Utils::getBinaryFilehandle($metsXSL);
    my $metsXSL_doc = $parser->parse_fh($metsXSL_fh);

    my $xslParser = XML::LibXSLT->new();
    my $stylesheet = $xslParser->parse_stylesheet($metsXSL_doc);
    if ($XSLvarRef) {
        $doc = $stylesheet->transform($doc, %$XSLvarRef);
    }
    else {
        $doc = $stylesheet->transform($doc);
    }

    return $doc;
}

# ---------------------------------------------------------------------

=item __makeJSON

Description

=cut

# ---------------------------------------------------------------------
sub __makeJSON {
    my $self = shift;
    my $XMLref = shift;

    my $JSONref;

    my $forceRef;
    my $valsRef = $self->__getConfigVal('force_array_format');
    foreach my $forceVal (@$valsRef) {
        push(@$forceRef, $forceVal);
    }

    my $simple =
        XML::Simple->new
                (
                 ForceArray => $forceRef,
                );
    my $sax = XML::SAX::ParserFactory->parser(Handler => $simple);
    my $ref = $sax->parse_string($$XMLref);

    my $coder = JSON::XS->new();
    my $json = $coder->encode($ref);
    if (defined($json)) {
        $JSONref = \$json;
    }

    return $JSONref;
}

# ---------------------------------------------------------------------

=item __getMetadataResourceRepresentation

XML or JSON

=cut

# ---------------------------------------------------------------------
sub __getMetadataResourceRepresentation {
    my $self = shift;
    my ($doc, $format) = @_;

    $format ||= 'default';

    my $representationRef;

    # Format (1) the stream for readability.
    my $representation = $doc->toString($DEBUG eq 'xml' ? 1 : 0);
    if (defined($representation) && $representation)
    {
        $representationRef = \$representation;

        if ($format eq 'json')
        {
            $representationRef = $self->__makeJSON($representationRef);
        }
    }

    return $representationRef
}

# ---------------------------------------------------------------------

=item __getBase_DOMtreeFor

Build common XML for the metadata responses and expand the METS
xi:xinclude element.

=cut

# ---------------------------------------------------------------------
sub __getBase_DOMtreeFor {
    my $self = shift;
    my ($resource, $P_Ref, $parser) = @_;

    my $responsesRef = $self->__getConfigVal('responses', $resource);

    my $doc = XML::LibXML::Document->createDocument('1.0', 'UTF-8');
    $self->p__buildXML($doc, undef, $P_Ref, $responsesRef, 0);

    if (! $self->p__processXIncludes($doc, $parser, $P_Ref)) {
        return undef;
    }

    exit 0
        if (($DEBUG eq 'tree') || ($DEBUG eq 'access'));

    return $doc;
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
