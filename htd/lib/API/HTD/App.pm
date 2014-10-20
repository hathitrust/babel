package API::HTD::App;

=head1 NAME

API::HTD::App;

=head1 DESCRIPTION

This class is a subclass of API::RESTApp.

URI scheme:

http[s]://babel.hathitrust.org/cgi/htd/:RESOURCE/:ID[/:SEQ]
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
use CGI;

use XML::LibXML;
use XML::Simple;
use XML::SAX;
use JSON::XS;
use XML::LibXSLT;
use OAuth::Lite::Problems;

# Local
use DataTypes;

# Us
use API::Path;
use API::Utils;
use API::DbIF;
use API::HTD_Log;

use API::HTD::Rights;
use API::HTD::HAuth;
use API::HTD::HConf;
use API::HTD::AccessTypes;
use API::HTD::IP_Address;

my $DEBUG = ''; # e.g. 'tree'

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
    my $ver = $self->getVersion;
    my $config_object = new API::HTD::HConf(
                                            [
                                             $ENV{SDRROOT} . '/htd/lib/API/HTD/base-config.yaml',
                                             $ENV{SDRROOT} . qq{/htd/lib/API/HTD/App/V_${ver}/config.yaml},
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

    $self->__debugging;
    # POSSIBLY NOTREACHED

    # We only support HTTP GET
    if ($self->getRequestMethod ne 'GET') {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(405, $self->getRequestMethod . ' method not supported');
        return 0;
    }
    # POSSIBLY NOTREACHED

    # We need a database connection from this point on.
    my $DBH = API::DbIF::databaseConnect('ht_web');

    unless ($DBH) {
        $self->__setMember('setup_error', 1);
        $self->__setErrorResponseCode(500, 'database connect error');
        return 0;
    }
    # POSSIBLY NOTREACHED

    $self->__setMember('dbh', $DBH);

    # Map to requested version of resource handlers.
    $self->__mapURIsToHandlers;
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
    unless ($self->header) {
        $self->__setErrorResponseCode(500, $self->__errorDescription);
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

    my $defaultHandler = sub { $self->defaultResourceHandler };

    # Noting to do if setup failed.
    return $defaultHandler
        if ($self->__setupError);
    # POSSIBLY NOTREACHED

    my $Q = $self->query;

    # Did the handlers bind OK?
    unless ($self->handlerBindingOk) {
        hLOG('API ERROR: ' . qq{pathinfo match failure, URI=} . $Q->self_url);
        $self->__setErrorResponseCode(400, 'invalid URI');
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    # fundamental member data
    $self->__paramsRef($self->__makeParamsRef(@$argsRef));

    my $dbh = $self->__get_DBH;

    my $namespace = $self->__paramsRef->{ns};
    my $barcode = $self->__paramsRef->{bc};

    # Create Path object
    my $po = API::Path->new($self->__get_SDRDATAROOT($namespace, $barcode) . q{/obj/} . $namespace . q{/pairtree_root});
    $self->__setMember('path', $po);

    # could fail if invalid HTID is requested
    my $ro = API::HTD::Rights::createRightsObject($dbh, $namespace, $barcode);
    unless (defined($ro)) {
        $self->__setErrorResponseCode(404, "rights information not found for id=" . $self->__paramsRef->{id});
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED
    $self->__setMember('rights', $ro);
    $self->__paramsRefAddRights($ro);

    # Query parameter validation.  Failure is fobbed off to the
    # defaultResourceHandler to deal with the mess
    unless ($self->validateQueryParams) {
        $self->__setErrorResponseCode(400, $self->__errorDescription);
        return $defaultHandler;
    }
    # POSSIBLY NOTREACHED

    # Establish IP address context singleton
    API::HTD::IP_Address->new({
                               _query => $Q,
                               _dbh   => $dbh,
                              });

    # Get an access type object
    my $ato = new API::HTD::AccessTypes({
                                         _params_ref => $self->__paramsRef,
                                         _dbh        => $dbh,
                                        });
    $self->__setMember('access', $ato);

    # Get an authentication object.
    my $hauth = new API::HTD::HAuth({
                                     _query => $Q,
                                     _dbh   => $dbh,
                                    });
    $self->__setMember('hauth', $hauth);

    # single logging point
    $self->__log_client($hauth);

    # Authenticate and authorize
    unless ($self->__authNZ_Success) {
        return $defaultHandler;
    }

    # Create bindings to tokens in the YAML
    if (! $self->__bindYAMLTokens) {
        $self->__setErrorResponseCode(500, 'token binding failure');
        return $defaultHandler;
    }

    # Instantiate Plugin type
    unless ($self->__set_PluginType) {
        # __set_PluginType sets response code
        return $defaultHandler;
    }

    return $handler;
}


# =====================================================================
# =====================================================================
#  Utilities
# =====================================================================
# =====================================================================


# ---------------------------------------------------------------------

=item __getMETS_root

Description

=cut

# ---------------------------------------------------------------------
sub __getMETS_root {
    my $self = shift;

    my $root = $self->{_metsroot};

    unless(defined $root) {
        my $dataRef = $self->__readPairtreeFile('mets.xml');
        if (defined($dataRef) && $$dataRef) {
            my $parser = XML::LibXML->new;
            my $tree = $parser->parse_string($$dataRef);
            $self->{_metsroot} = $root = $tree->getDocumentElement;
        }
    }

    return $root;
}

# ---------------------------------------------------------------------

=item __set_PluginType

Pure virtual

=cut

# ---------------------------------------------------------------------
sub __set_PluginType {
    my $self = shift;
    return 0;
}

# ---------------------------------------------------------------------

=item __get_SDRDATAROOT

Description

=cut

# ---------------------------------------------------------------------
sub __get_SDRDATAROOT {
    my $self = shift;
    my ($namespace, $barcode) = @_;

    if ($ENV{HT_DEV}) {
        my $dataRef = $self->__getConfigVal('development_data');
        my $id = qq{$namespace.$barcode};
        if (grep(/^$id$/, keys %$dataRef)) {
            $ENV{SDRDATAROOT} = $ENV{SDRROOT} . $dataRef->{$id}{sdrdataroot};
        }
    }

    return $ENV{SDRDATAROOT};
}

# ---------------------------------------------------------------------

=item __log_client

single logging point

=cut

# ---------------------------------------------------------------------
sub __log_client {
    my $self = shift;
    my $hauth = shift;

    my $Q = $self->query;

    my $ipo = new API::HTD::IP_Address;
    my $ip_valid = $ipo->ip_is_valid;
    my $ua_ip = $ipo->address;
    my $is_oauth = $hauth->H_request_is_oauth($Q);
    my $url = $Q->self_url;
    my $access_key = $Q->param('oauth_consumer_key');
    my $resource = $self->__paramsRef->{resource};

    hLOG('API: ' . sprintf(qq{__log_client: access_key=%s ip_valid=%d signed=%d UA_ip=%s REMOTE_ADDR=%s HTTP_X_FORWARDED_FOR=%s SERVER_PORT=%s url=%s resource=%s },
                           $access_key, $ip_valid, $is_oauth, $ua_ip, $ENV{REMOTE_ADDR}, $ENV{HTTP_X_FORWARDED_FOR}, $ENV{SERVER_PORT}, $url, $resource));
}


# ---------------------------------------------------------------------

=item __debugging

Description

=cut

# ---------------------------------------------------------------------
sub __debugging {
    my $self = shift;
    hLOG_DEBUG('API: ' . $self->__getEnv);
}


# ---------------------------------------------------------------------

=item __printEnv

Format the %ENV hash

=cut

# ---------------------------------------------------------------------
sub __getEnv {
    my $self = shift;
    my $s;
    foreach my $key (qw (REMOTE_ADDR SERVER_ADDR SERVER_PORT AUTH_TYPE HTTPS HTTP_HOST HT_DEV SCRIPT_URI  SCRIPT_URL QUERY_STRING PATH_INFO REQUEST_URI)) {
        $s .= qq{$key="$ENV{$key}" };
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
    my ($extension, $bare) = @_;

    my $barcode = $self->__paramsRef->{bc};
    my $po = $self->__getPathObject;
    my $filename = $po->getPairtreeFilename($barcode) . qq{.$extension};
    if (! $bare) {
        my $dir = $po->getItemDir($barcode);
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
    my ($extension, $binary) = @_;

    my $dataRef;

    my $filename = $self->__getPairtreeFilename($extension);
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

    $self->resetHeader;

    $self->__errorDescription($msg) if ($msg);
    my $desc = $self->__errorDescription || '';

    my $statusLine = $self->__getConfigVal('httpstatus', $code) || $code;
    $self->header(
                  -status         => $statusLine,
                  -type           => q{text/plain; charset=utf8},
                  -content_length => bytes::length($desc),
                 );

    if ($code =~ m,^30[1-7],) {
        my $Q = new CGI($self->query);
        my $url = $self->__getHAuthObject->H_make_ssl_redirect_url($Q);
        $self->setRedirect($url);
    }
    else {
        if (OAuth::Lite::Problems->match($desc)) {
            my $oauth_desc = "OAuth $desc";
            $self->header(
                          -WWW_Authenticate => $oauth_desc,
                         );
        }
    }

    hLOG('API ERROR: ' . qq{__setErrorResponseCode: code=$code description=$desc});
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

sub __bindYAMLTokens {
    my $self = shift;
    return 0;
}


# =====================================================================
# =====================================================================
#  Accessors
# =====================================================================
# =====================================================================

sub __paramsRef {
    my $self = shift;
    my $ref = shift;

    $self->{_params_ref} = $ref if (defined $ref);

    my $val = $self->{_params_ref};
    unless (defined $val) {
        die "FATAL: no value for _params_ref member data in __paramsRef() method call";
    }

    return $self->{_params_ref};
}

sub __paramsRefAddRights {
    my $self = shift;
    my $ro = shift;

    my $ref = $self->__paramsRef;

    $ref->{attr} = $ro->getRightsFieldVal('attr');
    $ref->{source} = $ro->getRightsFieldVal('source');
    $ref->{access_profile} = $ro->getRightsFieldVal('access_profile');
}

sub __paramsRefHasFileid {
    my $self = shift;
    return $self->__paramsRef->{fileid};
}

sub __errorDescription {
    my $self = shift;
    my $desc = shift;
    $self->{error_description} = $desc if (defined $desc);
    return $self->{error_description};
}

sub __getRightsObject {
    my $self = shift;
    return $self->{rights};
}

sub __getConfObject {
    my $self = shift;
    return $self->{config};
}

sub __getAccessObject {
    my $self = shift;
    return $self->{access};
}

sub __getHAuthObject {
    my $self = shift;
    return $self->{hauth};
}

sub __get_DBH {
    my $self = shift;
    return $self->{dbh};
}

sub __getPathObject {
    my $self = shift;
    return $self->{path};
}

sub __setupError {
    my $self = shift;
    return $self->{setup_error};
}

sub __setMember {
    my $self = shift;
    my ($key, $val) = @_;
    $self->{$key} = $val;
}

sub __getConfigVal {
    my $self = shift;
    return $self->__getConfObject->getConfigVal(@_);
}

sub __getAccessType {
    my $self = shift;
    return $self->__getAccessObject->getAccessType(@_);

}

sub __getAccessTypeRestriction {
    my $self = shift;
    return $self->__getAccessObject->getAccessTypeRestriction(@_);

}

# =====================================================================
# =====================================================================
#  Helpers
# =====================================================================
# =====================================================================

# ---------------------------------------------------------------------

=item __addExtraHeaders

Description

=cut

# ---------------------------------------------------------------------
sub __addExtraHeaders {
    my $self = shift;
    my ($resource, $resource_str) = @_;

    $self->___addHeaderAccessUseMsg;

    my $resource_type = $self->__getConfigVal('resources', $resource, 'resource_type');
    if ($resource_type eq 'data') {
        $self->___addHeaderInCopyrightMsg($resource_str);
    }
}

# ---------------------------------------------------------------------

=item __addHeaderInCopyrightMsg

Description

=cut

# ---------------------------------------------------------------------
sub ___addHeaderInCopyrightMsg {
    my $self = shift;
    my $resource_str = shift;

    my $Header_Key = 'X-HathiTrust-InCopyright';

    my ($in_copyright, $attr) = $self->__getAccessObject->getInCopyrightStatus;
    if ($in_copyright) {
        my $access_key = $self->query->param('oauth_consumer_key') || 0;
        $self->header(
                      $Header_Key => "user=$access_key,none;attr=$attr;access=data_api_user");
        hLOG('API: ' . qq{X-HathiTrust-InCopyright: access key=$access_key } . $resource_str);
    }
}


# ---------------------------------------------------------------------

=item __addHeaderAccessUseMsg

Description

=cut

# ---------------------------------------------------------------------
sub ___addHeaderAccessUseMsg {
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

    my $dbh = $self->__get_DBH;
    my $P_Ref = $self->__paramsRef;

    my ($attr, $access_profile) = ( $P_Ref->{attr}, $P_Ref->{access_profile} );
    my $ref_to_arr_of_hashref =
      Access::Statements::get_stmt_by_rights_values(undef, $dbh, $attr, $access_profile, $fieldHashRef);
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
    my ($resource, $id, $namespace, $barcode, $x, $y, $z, $seqORfileid) = @_;
    my $ro = $self->__getRightsObject;

    my $params_ref =
      {
       'resource' => $resource,
       'id'       => $id,
       'ns'       => $namespace,
       'bc'       => $barcode,
      };

    if (defined $seqORfileid) {
        if ($seqORfileid =~ m,^\d+$,) {
            $params_ref->{seq} = $seqORfileid;
        }
        else {
            $params_ref->{fileid} = $seqORfileid;
        }
    }

    return $params_ref;
}

# ---------------------------------------------------------------------

=item __getIdParamsRef

Description

=cut

# ---------------------------------------------------------------------
sub __getIdParamsRef {
    my $self = shift;
    return $self->__paramsRef->{id};
}

# ---------------------------------------------------------------------

=item __getParamsRefStr

Description

=cut

# ---------------------------------------------------------------------
sub __getParamsRefStr {
    my $self = shift;
    my $P_Ref = $self->__paramsRef;

    return join(" ", map sprintf(q{%s="%s"}, $_, $$P_Ref{$_}), keys %$P_Ref) . ' ';
}

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
    my $Q = $self->query;
    foreach my $p (@$clientParamsRef) {
        my $val = $Q->param($p);
        $hashRef->{$p} = $val if (defined $val);
    }

    return $hashRef;
}

# ---------------------------------------------------------------------

=item __getDownloadability

This is the downloadability value we put into the Atom response.  It
is a summary includes the access bits that might be set for a given
client that we may have authorized to access forms of restricted
content.

=cut

# ---------------------------------------------------------------------
sub __getDownloadability {
    my $self = shift;
    my $resource = shift;

    my $Q = $self->query;
    my $downloadability = $self->__getAccessTypeRestriction( $self->__getAccessType($resource, $Q) );

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

    my $downloadability = $self->__getDownloadability($resource);
    my $protocol = ($downloadability eq 'restricted') ? 'https' : 'http';

    return $protocol;
}

# ---------------------------------------------------------------------

=item __getMimetype

Used to determine mimetype emitted in header.

=cut

# ---------------------------------------------------------------------
sub __getMimetype {
    my $self = shift;
    my ($resource, $format) = @_;

    unless (defined $format) {
        $format = 'default';
    }

    my $key = $self->__getConfigVal('extension_format_map', $format);
    my $mimetype = $self->__getConfigVal('mimetype_map', $resource, $key);

    # fallback in case extension is not in config.yaml
    unless (defined $mimetype) {
        $mimetype = $self->__getConfigVal('mimetype_map', $resource, 'default');
    }

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

    my $Q = $self->query;
    my $hauth = $self->__getHAuthObject;

    my $Success = 0;
    my $fail_point = '?';

    # Authenticate and authorize an OAuth request
    if ($hauth->H_request_is_oauth($Q)) {
        ($Success = $self->__authenticated) || ($fail_point = 'oauth_authentication');
        if ($Success) {
            ($Success = $self->__authorized) || ($fail_point = 'oauth_authorization');
        }
    }
    elsif ($hauth->H_authenticated_by_grace) {
        ($Success = $self->__authorized) || ($fail_point = 'grace_authorization');
    }
    else {
        $Success = 0;
        $self->__setErrorResponseCode(403, $hauth->errstr);
        $fail_point = 'non-oauth_outside_grace';
    }

    unless ($Success) {
        my $s = $self->__getParamsRefStr;
        my $ipo = new API::HTD::IP_Address;
        hLOG('API ERROR: ' . qq{__authNZ_Success: Success=0 } . $hauth->errstr . qq{ $s orig=} . $ipo->address . qq{ failpoint=$fail_point});
    }

    return $Success;
}


# ---------------------------------------------------------------------

=item __authenticated

Description

=cut

# ---------------------------------------------------------------------
sub __authenticated {
    my $self = shift;

    my $authenticated = 0;

    my $Q = $self->query;
    my $hauth = $self->__getHAuthObject;

    my $dbh = $self->__get_DBH;
    my $client_data = $self->__getClientQueryParams;

    if ($hauth->H_authenticate($Q, $dbh, $client_data)) {
        $authenticated = 1;
    }
    else {
        $self->__setErrorResponseCode(401, $hauth->errstr);
        hLOG('API ERROR: ' . qq{__authenticated: authenticated=0 } . $hauth->errstr);
    }

    hLOG_DEBUG('API: ' . qq{__authenticated: authenticated=$authenticated error=} . $hauth->errstr);
    return $authenticated;
}


# ---------------------------------------------------------------------

=item __authorized

See if the client is authorized to access the resource being
requested.  This is a function of access type which is in turn a
function of rights, access_profile, resource.

i.e.

authorization = f(rights, access_profile, resource))

=cut

# ---------------------------------------------------------------------
sub __authorized {
    my $self = shift;

    my $error = '';
    my $authorized = 0;

    # Access types: (free|nonfree|noaccess)[-extended_access]
    my $Q = $self->query;
    my $dbh = $self->__get_DBH;
    my $hauth = $self->__getHAuthObject;
    my $resource = $self->__paramsRef->{resource};
    my $access_key = $Q->param('oauth_consumer_key');

    my $access_type = 'access_type_notdefined';
    eval {
        $access_type = $self->__getAccessType($resource, $Q);
        my $access_type_restriction = $self->__getAccessTypeRestriction($access_type);

        if ($hauth->H_authorized($Q, $dbh, $resource, $access_type, $access_type_restriction)) {
            $authorized = 1;
        }
        else {
            $error = $hauth->errstr;
            if ($error =~ m,redirect,) {
                $self->__setErrorResponseCode(303, $error);
            }
            else {
                $self->__setErrorResponseCode(403, $error);
            }
        }

        hLOG('API ERROR: ' . qq{__authorized: access_type=$access_type authorized=0 error="$error"}) unless($authorized);
        hLOG_DEBUG('API: ' . qq{__authorized: resource=$resource access_type=$access_type authorized=$authorized error="$error"});
    };
    if ($@) {
        hLOG('API ERROR: ' . qq{__authorized: access_type=$access_type authorized=0 error="$@"});
        hLOG_DEBUG('API: ' . qq{__authorized: resource=$resource access_type=$access_type authorized=$authorized error="$@"});
        $self->__setErrorResponseCode(500, $@);
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
    my $level = shift;

    my $P_Ref = $self->__paramsRef;
    my $orig_val = $val;

    my ($pointer) = ($val =~ m,(_HTD_[A-Z_]+_),);
    if ($pointer) {
        my $pointerVal = $self->__getConfigVal($pointer);
        $val =~ s,$pointer,$pointerVal,;
    }
    $val =~ s,__ID__,$P_Ref->{id},;
    $val =~ s,__SEQ__,$P_Ref->{seq},;

    my @boundTokens = ($val =~ m,:::[A-Z_]+,g);
    foreach my $token (@boundTokens) {
        my $handler = $self->__getYAMLTokenBinding($token);
        my $replacement = &$handler;
        $val =~ s,$token,$replacement,;
    }

    if ($DEBUG eq 'tree') {
        hLOG_DEBUG('API: ' . (" " x (5*$level)) . "p__processValue[$level]: $orig_val => $val");
    }

    return $val;
}

# ---------------------------------------------------------------------

=item p__handleAttributes

Description

=cut

# ---------------------------------------------------------------------
sub p__handleAttributes {
    my $self = shift;
    my ($elem, $attrRef, $level) = @_;

    if (ref($attrRef) eq 'HASH') {
        foreach my $aName (keys %{ $attrRef }) {
            if ($DEBUG eq 'tree') {
                hLOG_DEBUG('API: ' . (" " x (5*$level)) . "p__handleAttributes[$level]: elem=" . ($elem ? $elem->nodeName : '') . " attribute=$aName");
            }
            my $attrVal = $attrRef->{$aName};
            $attrVal = $self->p__processValue($attrVal, $level+1);
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
    my ($doc, $parentElem, $elem, $ref, $level) = @_;

    if ($DEBUG eq 'tree') {
        hLOG_DEBUG('API: ' .  (" " x (5*$level)) .  "p__handleContent[$level]: elem=" . ($parentElem ? $parentElem->nodeName : ''));
    }

    if ($parentElem) {
        $parentElem->appendChild($elem);
    }
    else {
        $doc->setDocumentElement($elem);
    }

    if (ref($ref) eq 'HASH') {
        # ! Indirect recursion !
        $self->p__buildXML($doc, $elem, $ref, $level+1);
    }
    elsif ($ref ne 'null') {
        $ref = $self->p__processValue($ref, $level+1);
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
    my ($doc, $parentElem, $eName, $ref, $level) = @_;

    if ($DEBUG eq 'tree') {
        hLOG_DEBUG('API: ' . (" " x (5*$level)) . "p__handleElement[$level]: parent elem=" . ($parentElem ? $parentElem->nodeName : '') . " elem=$eName");
    }

    my $elem = $doc->createElement($eName);

    my $attrRef = $ref->{attrs};
    $self->p__handleAttributes($elem, $attrRef, $level+1);

    my $contentRef = $ref->{content};
    $self->p__handleContent($doc, $parentElem, $elem, $contentRef, $level+1);
}

# ---------------------------------------------------------------------

=item p__buildXML

Description

=cut

# ---------------------------------------------------------------------
sub p__buildXML {
    my $self = shift;
    my ($doc, $parentElem, $responsesRef, $level) = @_;

    if ($DEBUG eq 'tree') {
        hLOG_DEBUG('API: ' .  (" " x (5*$level)) .  "p__buildXML[$level]: " . ($parentElem ? $parentElem->nodeName : ''));
    }

    foreach my $eName (keys %$responsesRef) {
        my $eRef = $responsesRef->{$eName};
        if (ref($eRef) eq 'ARRAY') {
            foreach my $hashRef (@$eRef) {
                $self->p__handleElement($doc, $parentElem, $eName, $hashRef, $level+1);
            }
        }
        else {
            $self->p__handleElement($doc, $parentElem, $eName, $eRef, $level+1);
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
    my ($doc, $parser) = @_;

    # See if parser will be able to access the METS file
    my $filename = $self->__getPairtreeFilename('mets.xml');
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

    my $metsXSL = $ENV{SDRROOT} . $self->__getConfigVal($metsFileKey);
    my $metsXSL_fh = API::Utils::getBinaryFilehandle($metsXSL);
    my $metsXSL_doc = $parser->parse_fh($metsXSL_fh);

    my $xslParser = XML::LibXSLT->new;
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

    my $coder = JSON::XS->new;
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
    if (defined($representation) && $representation) {
        $representationRef = \$representation;

        if ($format eq 'json') {
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
    my ($resource, $parser) = @_;

    my $responsesRef = $self->__getConfigVal('responses', $resource);

    my $doc = XML::LibXML::Document->createDocument('1.0', 'UTF-8');
    $self->p__buildXML($doc, undef, $responsesRef, 0);

    if (! $self->p__processXIncludes($doc, $parser)) {
        return undef;
    }

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
