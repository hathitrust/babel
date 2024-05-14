package API::HTD::HAuth;


=head1 NAME

API::HTD:HAuth

=head1 DESCRIPTION

This base class encapsulates the authentication and authorization processes
for a single request to the HathiTrust Data API. It contains logic to
authorize access to a resource as a function of the requestors access
privileges and the privileges required to access the resource.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(Class::ErrorHandler);

use CGI;
use OAuth::Lite::Problems qw(:all);

use Context;
use Utils::Time;
use HOAuth::Signature;

use API::HTD_Log;
use API::Utils;

use API::HTD::AuthDb;
use API::HTD::IP_Address;
use API::HTD::HCodes;

# These switches never apply when in production
my $FORCE_SUCCESS = 0;
my $ALLOW_AUTHENTICATION_DEVELOPMENT_OVERRIDE = 0;
my $ALLOW_AUTHORIZATION_DEVELOPMENT_OVERRIDE = 0;

if ($FORCE_SUCCESS) {
    $ALLOW_AUTHENTICATION_DEVELOPMENT_OVERRIDE = 1;
    $ALLOW_AUTHORIZATION_DEVELOPMENT_OVERRIDE = 1;
}

use constant REQUEST_METHOD => 'GET';
# Number of production seconds in 5 minutes. To force an expired
# timestamp in development use flags below.
use constant TIMESTAMP_WINDOW => (defined $ENV{HT_DEV} ? 302400 : 5*60);


sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize

Initialize object.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $args = shift;

    my $Q = $args->{_query};

    my $dbh = $args->{_dbh};
    $self->{_dbh} = $dbh;

    my $oauth_consumer_key = $Q->param('oauth_consumer_key');
    API::HTD::AuthDb::update_access($dbh, $oauth_consumer_key)
        if (defined $oauth_consumer_key);
}


# ---------------------------------------------------------------------

=item __auth_valid

Mutator

=cut

# ---------------------------------------------------------------------
sub __auth_valid {
    my $self = shift;
    my $valid = shift;

    if (defined $valid) {
        die "FATAL: hauth initialization invalid" if (defined $self->{_authentication_valid});
        $self->{_authentication_valid} = $valid
    }
    return $self->{_authentication_valid};
}


# ---------------------------------------------------------------------

=item __allow_development_authorization_override

Description

=cut

# ---------------------------------------------------------------------
sub __allow_development_authorization_override {

    my $dev = ($ALLOW_AUTHORIZATION_DEVELOPMENT_OVERRIDE && (defined $ENV{HT_DEV})) ? 1 : 0;
    hLOG_DEBUG('API: ' . qq{__allow_development_authorization_override: dev authorization overridden=$dev});
    return $dev;
}

# ---------------------------------------------------------------------

=item __allow_development_authentication_override

Description

=cut

# ---------------------------------------------------------------------
sub __allow_development_authentication_override {

    my $dev = ($ALLOW_AUTHENTICATION_DEVELOPMENT_OVERRIDE && (defined $ENV{HT_DEV})) ? 1 : 0;
    hLOG_DEBUG('API: ' . qq{__allow_development_authentication_override: dev authentication overridden=$dev});
    return $dev;
}


# ---------------------------------------------------------------------

=item H_make_ssl_redirect_url

Description

=cut

# ---------------------------------------------------------------------
sub H_make_ssl_redirect_url {
    my $self = shift;
    my $Q = shift;

    foreach my $p ($Q->param) {
        if ($p =~ m,oauth,) {
            $Q->Delete($p);
        }
    }
    my $url = $Q->self_url;
    $url =~ s,^http:,https:,;

    return $url;
}

# ---------------------------------------------------------------------

=item H_authenticated_by_grace

Special support for grace period if OAuth params absent

=cut

# ---------------------------------------------------------------------
use constant OCT_1_2012 => 1349067599;

sub H_authenticated_by_grace {
    my $self = shift;

    if (time() < OCT_1_2012) {
        $self->__auth_valid(1);
        hLOG_DEBUG('API: ' . qq{H_authenticated_by_grace: authenticated=1 inside grace period});
        return 1;
    }

    if (__allow_development_authentication_override()) {
        $self->__auth_valid(1);
        return 1;
    }

    hLOG_DEBUG('API ERROR: ' . qq{H_authenticated_by_grace: authenticated=0 outside grace period});
    return $self->error('non-oauth request not allowed outside grace period. See http://babel.hathitrust.org/cgi/htdc or http://babel.hathitrust.org/cgi/kgs');
}

# ---------------------------------------------------------------------

=item __check_nonce_and_timestamp

Request is valid if:

1) oauth_timestamp is in the closed interval [now - window, now + window].

    This allows us to limit storage of nonces to just those seen
    within this window. We reject the request if timestamp is outside
    the window because we (the Service Provider) no longer have nonces
    from that interval to test against.  The window also allows a
    measure of non-synchronization between us and our Consumers' clocks.

AND

2) oauth_timestamp is greater than or equal to all other
timestamps for requests from this Consumer (access_key).

    A timestamp less than all others from this Consumer (with a
    different nonce, apparently) represents a possible replay attack.

AND

3) the combination of oauth_timestamp and oauth_nonce is unique for
this access_key.

    If timestamp+nonce is present for this access_key it represents a
    possible replay attack.

=cut

# ---------------------------------------------------------------------
sub __check_nonce_and_timestamp {
    my $self = shift;
    my ($dbh, $access_key, $nonce, $timestamp) = @_;

    my $window = TIMESTAMP_WINDOW;
    my $current_time = time();
    my $delta = $current_time - $timestamp;

    if (abs($delta) > $window) {
        # timestamp outside our window therefore cannot ensure
        # nonce+timestamp is unique within our window.
        hLOG('API ERROR: ' . qq{__check_nonce_and_timestamp: window violation current_time=$current_time oauth_timestamp=$timestamp delta=$delta window=$window oauth_consumer_key=$access_key});
        return $self->error(TIMESTAMP_REFUSED);
    }
    else {
        my $rec = API::HTD::AuthDb::validate_nonce_and_timestamp_for_access_key($dbh, $access_key, $nonce, $timestamp, $window);

        my ($max_error, $max) = API::HTD::AuthDb::max_timestamp_check_error($rec);
        if ($max_error) {
            hLOG('API ERROR: ' . qq{__check_nonce_and_timestamp: window exceeded oauth_timestamp=$timestamp max=$max oauth_nonce=$nonce oauth_consumer_key=$access_key});
            return $self->error(TIMESTAMP_REFUSED);
        }

        # POSSIBLY NOTREACHED
        my $uniq_error = API::HTD::AuthDb::uniqueness_check_error($rec);
        if ($uniq_error) {
            hLOG('API ERROR: ' . qq{__check_nonce_and_timestamp: uniqueness error oauth_timestamp=$timestamp oauth_nonce=$nonce oauth_consumer_key=$access_key});
            return $self->error(TIMESTAMP_REFUSED);
        }
        # POSSIBLY NOTREACHED
    }

    return 1;
}

# ---------------------------------------------------------------------

=item __check_access_key

Description

=cut

# ---------------------------------------------------------------------
sub __check_access_key {
    my $self = shift;
    my ($dbh, $access_key) = @_;

    unless ( API::HTD::AuthDb::access_key_exists($dbh, $access_key) ) {
        return $self->error(CONSUMER_KEY_UNKNOWN);
    }

    return 1;
}


# ---------------------------------------------------------------------

=item __check_signature

Description

=cut

# ---------------------------------------------------------------------
sub __check_signature {
    my $self = shift;
    my ($signed_url, $dbh, $access_key, $client_data) = @_;

    my $secret_key = API::HTD::AuthDb::get_secret_by_active_access_key($dbh, $access_key);
    my ($valid, $errors) = HOAuth::Signature::S_validate($signed_url, $access_key, $secret_key, REQUEST_METHOD, $client_data);
    unless ($valid) {
        hLOG('API ERROR: ' . qq{__check_signature: $errors oauth_consumer_key=$access_key url=$signed_url});
        return $self->error($errors);
    }

    return 1;
}


# ---------------------------------------------------------------------

=item H_request_is_oauth

True if *any* oauth parameters are present. Malformed OAuth requests
are trapped at signature validation time.

=cut

# ---------------------------------------------------------------------
sub H_request_is_oauth {
    my $self = shift;
    my $Q = shift;

    return 1 if (__allow_development_authentication_override());

    my @params = map { lc($_) } $Q->multi_param;
    foreach my $oauth (qw(oauth_consumer_key oauth_nonce oauth_timestamp oauth_signature_method oauth_signature oauth_version)) {
        if (grep(/^$oauth$/, @params)) {
            return 1;
        }
    }

    return $self->error('signature missing');
}

# ---------------------------------------------------------------------

=item H_authenticate

Description

=cut

# ---------------------------------------------------------------------
sub H_authenticate {
    my $self = shift;
    my ($Q, $dbh, $client_data) = @_;

    return $self->__auth_valid(1) if (__allow_development_authentication_override());

    my $authenticated = 0;

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    my $nonce = $Q->param('oauth_nonce') || 0;
    my $timestamp = $Q->param('oauth_timestamp') || 0;

    if ($self->__check_access_key($dbh, $access_key)) {
        if ($self->__check_nonce_and_timestamp($dbh, $access_key, $nonce, $timestamp)) {
            my $signed_url = signature_safe_url($Q);
            if ($self->__check_signature($signed_url, $dbh, $access_key, $client_data)) {
                $authenticated = 1;
            }
        }
    }

    $self->__auth_valid($authenticated);

    # record (even failures)
    API::HTD::AuthDb::insert_nonce_timestamp($dbh, $access_key, $nonce, $timestamp);
    # track errors
    API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 1) unless ($authenticated);

    return $authenticated;
}

# ---------------------------------------------------------------------

=item ACCESS AUTHORIZATION MAPPING

Please refer to comments in API::HTD::HCodes for code computation and
to /htd/scripts/[htdmonitor,authorization_code_generator] for tools to
compose and decompose authorization codes and their uses.

=cut

# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item __access_is_authorized

Wrapper method

=cut

# ---------------------------------------------------------------------
sub __access_is_authorized {
    my $self = shift;
    my ($client_code, $access_type) = @_;

    my ($basic_access, @extended_access) = API::HTD::HCodes::parse_access_type($access_type);
    my $extended_access = join('-', @extended_access);

    my ($required_code, $bitstring) = API::HTD::HCodes::get_authorization_code($basic_access, @extended_access);
    # test whether client_code has all bits set that required_code
    # says are needed for authorization
    my $authorized = (($client_code & $required_code) == $required_code);

    hLOG('API: ' . qq{__access_is_authorized: authorized=$authorized required=$required_code client=$client_code bitstring=$bitstring basic=$basic_access extended=$extended_access});
    return $authorized;
}

# ---------------------------------------------------------------------

=item __expired_authorization

Description

=cut

# ---------------------------------------------------------------------
sub __expired_authorization {
    my $self = shift;
    my ($dbh, $access_key) = @_;

    my $expiration_date = API::HTD::AuthDb::get_expiration_by_access_key($dbh, $access_key);
    if (defined $expiration_date) {
        if (Utils::Time::expired($expiration_date)) {
            return 1;
        }
    }

    return 0;
}

# ---------------------------------------------------------------------

=item __authorized_protocol

Description

=cut

# ---------------------------------------------------------------------
sub __authorized_protocol {
    my $self = shift;
    my $access_type_restriction = shift;

    $ENV{SERVER_PORT} = 80 unless (defined $ENV{SERVER_PORT});

    if ($access_type_restriction eq 'restricted') {
        if ($ENV{SERVER_PORT} ne '443') {
            return 0;
        }
    }

    return 1;
}


# ---------------------------------------------------------------------

=item __authorized_at_IP_address

We impose IP address match requirements vs. an IP address parameter or
REMOTE_ADDR (depending on client type).

Requests for resources that have a 'basic' access_type equal to
'open_restricted' must be locked when an extended_access_type is
defined (making them 'restricted') otherwise the resource is 'open'
and does not have to be locked to an IP address.

Requests for resources that have a 'basic' access_type equal to
'restricted[_forbidden]' must be locked to an IP address always.

=cut

# ---------------------------------------------------------------------
sub __authorized_at_IP_address {
    my $self = shift;
    my ($ipo, $access_type_restriction) = @_;

    my $ip = $ipo->address;
    my $ip_address_is_valid  = $ipo->ip_is_valid();
    my $client_type = $ipo->client_type();

    my $locked = $ipo->address_locked();
    my $lock_required = 0;

    if ($access_type_restriction eq 'restricted') {
        $lock_required = 1;
    }

    my $authorized = 0;

    if ($ip_address_is_valid) {
        if ($lock_required) {
            $authorized = $locked;
        }
        else {
            $authorized = 1;
        }
    }
    else {
        $authorized = 0;
    }

    my $r = qq{ip_valid=$ip_address_is_valid client_type=$client_type locked=$locked};
    my $s = qq{API: __authorized_at_IP_address: authorized=$authorized ip=$ip access_type_restriction=$access_type_restriction};
    hLOG("$s $r");

    return $authorized;
}


# ---------------------------------------------------------------------

=item H_authorized

Description

=cut

# ---------------------------------------------------------------------
sub H_authorized {
    my $self = shift;
    my ($Q, $dbh, $resource, $access_type, $access_type_restriction) = @_;

    return 1 if (__allow_development_authorization_override());

    unless ($self->__auth_valid) {
        return $self->error('cannot authorize: authentication error');
    }

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    if ($self->__expired_authorization($dbh, $access_key)) {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: authorization expired access_key=$access_key resource=$resource access_type=$access_type});
        return $self->error('authorization expired');
    }

    unless ($self->__authorized_protocol($access_type_restriction)) {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: protocol fail access_key=$access_key  resource=$resource access_type=$access_type port=$ENV{SERVER_PORT}});
        return $self->error('redirect over SSL required');
    }

    my ($code) = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    my $ipo = new API::HTD::IP_Address;

    if ($self->__access_is_authorized($code, $access_type)) {
        if ($self->__authorized_at_IP_address($ipo, $access_type_restriction)) {
            return 1;
        }
        else {
            API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
            my $ip = $ipo->address;
            hLOG('API ERROR: ' . qq{H_authorized: ip address fail access_key=$access_key resource=$resource access_type=$access_type ip=$ip});
            return $self->error('unauthorized originating ip address');
        }
    }
    else {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: insufficient privilege access_key=$access_key resource=$resource access_type=$access_type});
        return $self->error('insufficient privilege');
    }
}


1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012-14 ©, The Regents of The University of Michigan, All Rights Reserved

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
