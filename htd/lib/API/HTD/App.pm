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
use YAML::Any;
use XML::LibXML;
use XML::Simple;
use XML::SAX;
use JSON::XS;
use XML::LibXSLT;

# Local
use API::Path;
use API::Utils;
use API::DbIF;

use API::HTD::Rights;

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
    my $config;
    eval {
        $config = YAML::Any::LoadFile($ENV{'SDRROOT'} . '/htd/lib/API/HTD/base-config.yaml');
    };
    if ($@) {
        $self->__setErrorResponseCode('500');
        $self->__setMember('setup_error', 1);
        return 0;
    }
    # POSSIBLY NOTREACHED

    if (! defined($config)) {
        $self->__setErrorResponseCode('500');
        $self->__setMember('setup_error', 1);
        return 0;
    }

    # Load version plugin class and its config
    my $ver_config;
    my $ver = $self->getVersion();
    eval {
        $ver_config = YAML::Any::LoadFile($ENV{'SDRROOT'} . qq{/htd/lib/API/HTD/App/V_${ver}/config.yaml});
    };
    if ($@) {
        $self->__setErrorResponseCode('500');
        $self->__setMember('setup_error', 1);
        return 0;
    }
    # POSSIBLY NOTREACHED

    if (! defined($ver_config)) {
        $self->__setErrorResponseCode('500');
        $self->__setMember('setup_error', 1);
        return 0;
    }
    # POSSIBLY NOTREACHED

    # Merge version config into base config for totality
    @$config{keys %$ver_config} = values %$ver_config;
    $self->__setMember('config', $config);

    $self->__debugging();
    # POSSIBLY NOTREACHED

    # We only support HTTP GET
    if ($self->getRequestMethod() ne 'GET') {
        $self->__setErrorResponseCode('400H');
        $self->__setMember('setup_error', 1);
        return 0;
    }
    # POSSIBLY NOTREACHED

    # Query parameter validation.  Failure is fobbed off to the
    # defaultResourceHandler to deal with the mess
    if (! $self->validateQueryParams()) {
        $self->__setErrorResponseCode('400U');
        $self->__setMember('setup_error', 1);
        return 0;
    }
    # POSSIBLY NOTREACHED

    # We need a database connection from this point on. Note ||= for
    # persistent connectivity under mod_perl
    my $DBH = API::DbIF::databaseConnect
      (
       $self->__getConfigVal('database', 'name'),
       $self->__getConfigVal('database', 'user'),
       $self->__getConfigVal('database', 'passwd'),
       $self->__getConfigVal('database', 'server'),
      );

    if (! $DBH) {
        $self->__setErrorResponseCode('503');
        $self->__setMember('setup_error', 1);
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
        $self->__setErrorResponseCode('500');
    }

    return '';
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
        # Probably Bad URI
        $self->__setErrorResponseCode('400U');
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    my $P_Ref = $self->__makeParamsRef(@$argsRef);

    # Get a Rights object. We need this either to permit access or to
    # fill in response data for unrestricted resource.
    my $ro = API::HTD::Rights::createRightsObject($self->__get_DBH(), $P_Ref);
    if (! defined($ro)) {
        $self->__setErrorResponseCode('404');
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    $self->__setMember('rights', $ro);

    # Authorize
    if (! $self->__authorized($P_Ref)) {
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    # Create bindings to tokens in the YAML
    if (! $self->__bindYAMLTokens($P_Ref)) {
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

    # Debug only allowed by IP
    if ($self->__allowByIPAddress()) {
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
    my ($P_Ref, $extension) = @_;

    my $po = $self->__getPathObject();
    my $dir = $po->getItemDir($P_Ref->{'bc'});
    my $filename = qq{$dir/} . $po->getPairtreeFilename($P_Ref->{'bc'}) . qq{.$extension};

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
    my $code = shift;

    my $statusLine = $self->__getConfigVal('httpstatus', $code) || $code;
    $self->resetHeader();
    $self->header(
                  -Status => $statusLine,
                 );
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

sub __getRightsObject {
    my $self = shift;
    return $self->{'rights'};
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
    my ($key, $sub_1_key, $sub_2_key, $sub_3_key, $sub_4_key, $sub_5_key) = @_;

    if ($sub_5_key) {
        return $self->{'config'}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key}{$sub_4_key}{$sub_5_key};
    }
    elsif ($sub_4_key) {
        return $self->{'config'}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key}{$sub_4_key};
    }
    elsif ($sub_3_key) {
        return $self->{'config'}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key};
    }
    elsif ($sub_2_key) {
        return $self->{'config'}->{$key}{$sub_1_key}{$sub_2_key};
    }
    elsif ($sub_1_key) {
        return $self->{'config'}->{$key}{$sub_1_key};
    }
    else {
        return $self->{'config'}->{$key};
    }
}

# =====================================================================
# =====================================================================
#  Helpers
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __getFreedomVal

Attempt to determine freedom based on IPADDR.  However, we can't trust
remote address due to proxying so test mdp.proxies for IPADDR.

=cut

# ---------------------------------------------------------------------
sub __getFreedomVal {
    my $self = shift;
    my $rights = shift;

    my $openAccessNamesRef  = $self->__getConfigVal('open_access_names');
    my $freedom = grep(/^$rights$/, @$openAccessNamesRef) ? 'free' : 'nonfree';

    # Limit pdus volumes to un-proxied "U.S." clients
    if (($freedom eq 'free') && ($rights eq 'pdus')) {
        my $IPADDR = shift || $ENV{'REMOTE_ADDR'};

        require "Geo/IP.pm";
        my $geoIP = Geo::IP->new();
        my $country_code = $geoIP->country_code_by_addr($IPADDR);
        my $pdusCountryCodesRef = $self->__getConfigVal('pdus_country_codes');

        if (! grep(/^$country_code$/, @$pdusCountryCodesRef)) {
            $freedom = 'nonfree';
        }
        else {
            # veryify this is not a US proxy for a non-US request
            require "Access/Proxy.pm";
            if (Access::Proxy::blacklisted($IPADDR, $ENV{SERVER_ADDR}, $ENV{SERVER_PORT})) {
                $freedom = 'nonfree';
                if ($DEBUG eq 'access') { print qq{proxy blocked $IPADDR<br/>\n} }
            }
        }
    }

    return $freedom;
}


# ---------------------------------------------------------------------

=item __getAccessTypeByResource

Description

=cut

# ---------------------------------------------------------------------
sub __getAccessTypeByResource {
    my $self = shift;
    my $resource = shift;

    my $ro = $self->__getRightsObject();

    my $source = $self->__getConfigVal('sources_name_map', $ro->getRightsFieldVal('source'));
    my $rights = $self->__getConfigVal('rights_name_map', $ro->getRightsFieldVal('attr'));

    my $freedom = $self->__getFreedomVal($rights);
    my $val =
        $self->__getConfigVal('accessibility_matrix', $resource, $freedom, $source);

    if ($DEBUG eq 'access') { print qq{resource=$resource rights=$freedom access_type=$val<br/>\n} }

    return $val;
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

    my $downloadability = $self->__getAccessTypeByResource($resource);

    if ($downloadability eq 'free_bulk_restricted') {
        $downloadability = 'restricted';
    }
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

=item __allowByIPAddress

Description

=cut

# ---------------------------------------------------------------------
sub __allowByIPAddress {
    my $self = shift;

    my $remote_addr = $ENV{'REMOTE_ADDR'};

    my $internalRef = $self->__getConfigVal('allowed_ip_addresses', 'internal');
    foreach my $addrRegexp (@$internalRef) {
        if ($remote_addr =~ m,$addrRegexp,) {
            if ($DEBUG eq 'auth') { print qq{internal access allowed by IP=$remote_addr<br/>\n} }
            return 'internal';
        }
    }

    my $allow_external = $self->__getConfigVal('allow_external');
    if ($allow_external) {
        my $externalRef = $self->__getConfigVal('allowed_ip_addresses', 'external');
        foreach my $addrRegexp (@$externalRef) {
            if ($remote_addr =~ m,$addrRegexp,) {
                if ($DEBUG eq 'auth') { print qq{external access allowed by IP=$remote_addr<br/>\n} }
                return 'external';
            }
        }
    }

    if ($DEBUG eq 'auth') { print qq{no access by IP=$remote_addr<br/>\n} }
    return 'notallowed';
}

# ---------------------------------------------------------------------

=item __allowByRegistration

Description

=cut

# ---------------------------------------------------------------------
sub __allowByRegistration {
    my $self = shift;

    my $allow = 0;

    if ($DEBUG eq 'auth') { print qq{HTTPS=$ENV{'HTTPS'} DN=$ENV{'SL_CLIENT_S_DN'}<br/>\n} }
    # First this has to be HTTPS ...
    if ($ENV{'HTTPS'} eq 'on') {
        # ... then their DN has to exist and be registered
        my $DN = $ENV{'SL_CLIENT_S_DN'};
        if ($DN) {
            if ($self->__lookupDN($DN)) {
                $allow = 1;
            }
            else {
                if ($DEBUG eq 'auth') { print qq{DB lookup failed<br/>\n} }
                # DN not registered
                $self->__setErrorResponseCode('401');
            }
        }
        else {
            # Authentication required
            $self->__setErrorResponseCode('403');
        }
    }
    else {
        # Invalid protocol
        $self->__setErrorResponseCode('403P');
    }
    if ($DEBUG eq 'auth') { print qq{registered access=$allow<br/>\n} }

    return $allow;
}

# ---------------------------------------------------------------------

=item __authorized

See if the client is authorized to access the resource being
requested.  This is a function of rights, source and resource.

=cut

# ---------------------------------------------------------------------
sub __authorized {
    my $self = shift;
    my $P_Ref = shift;

    my $authorized = 0;

    # Access types: open, limited, free_bulk_restricted, restricted
    my $resource = $P_Ref->{'resource'};
    my $accessType = $self->__getAccessTypeByResource($resource);
    if ($DEBUG eq 'auth') { print qq{resource=$resource access_type=$accessType<br/>\n} }

    # Back door?
    my $ip_allowed = $self->__allowByIPAddress();
    if ($ip_allowed eq 'internal') {
        # Allow all
        $authorized = 1;
    }
    elsif ($ip_allowed eq 'external') {
        # Allow open, limited, free_bulk_restricted
        if (
            ($accessType eq 'open')
            ||
            ($accessType eq 'limited')
            ||
            ($accessType eq 'free_bulk_restricted')
           ) {
            $authorized = 1;
        }
    }
    else {
        # Normal access testing
        if (
            ($accessType eq 'restricted')
            ||
            ($accessType eq 'free_bulk_restricted')
           ) {
            # For any "restricted" type: restricted, free_bulk_restricted
            if ($self->__allowByRegistration()) {
                $authorized = 1;
            }
        }
        else {
            $authorized = 1;
        }
    }

    exit 0
        if ($DEBUG eq 'auth');

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
