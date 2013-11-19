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

    if (! API::HTD::AuthDb::access_key_exists($dbh, $access_key)) {
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
    if (! $valid) {
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

    my @params = map { lc($_) } $Q->param;
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
    API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 1) if (! $authenticated);

    return $authenticated;
}

# ---------------------------------------------------------------------

=item ACCESS AUTHORIZATION MAPPING

    Bitfield encoding. A set bit indicates authorized access level(s) +
      - an enhanced data rate
      - PDF access for Expressnet/EBM
      - raw images
      - suppressed watermarking for derivatives
      - zip access

    NOTE: If you add codes here, add them to htdmonitor too.

                                      bit
                                      7 6 5 4 3 2 1 0
                                      | | | | | | | |
    allow_unwatermarked_derivatives --+ | | | | | | |
    allow_raw --------------------------+ | | | | | |
    allow_pdf ----------------------------+ | | | | |
    allow_zip ------------------------------+ | | | |
    rate ------------------(not implemented)--+ | | |
    restricted_forbidden------------------------+ | |
    restricted -----------------------------------+ |
    open -------------------------------------------+

    Basic codes below assume that authorization to restricted implies
    authorization to less restricted.  Some shorthand:

       (O)      = open
       (O|R)    = open|restricted
       (O|R|RF) = open|restricted|restricted_forbidden

       combinations: (4)
                     (1) = 4

       Basic
       code      basic_mask
     0 00000000            NOT AUTHORIZED
     1 00000001  00000001  (O)
     3 00000011  00000010  (O|R)
     7 00000111  00000100  (O|R|RF)

       Basic+allow_zip
       code      allow_zip_mask(16)
    17 00010001  00010000  (O)     |allow_zip
    19 00010011  00010000  (O|R)   |allow_zip
    23 00010111  00010000  (O|R|RF)|allow_zip

       Basic+allow_pdf
       code      allow_pdf_mask(32)
    33 00100001  00100000  (O)     |allow_pdf
    35 00100011  00100000  (O|R)   |allow_pdf
    39 00100111  00100000  (O|R|RF)|allow_pdf

       Basic+allow_raw
       code      allow_raw_mask(64)
    65 01000001  01000000  (O)     |allow_raw
    67 01000011  01000000  (O|R)   |allow_raw
    71 01000111  01000000  (O|R|RF)|allow_raw

       Basic+allow_unwatermarked_derivatives
       code      allow_unwatermarked_derivatives_mask(128)
   129 10000001  10000000  (O)     |allow_unwatermarked_derivatives
   131 10000011  10000000  (O|R)   |allow_unwatermarked_derivatives
   135 10000111  10000000  (O|R|RF)|allow_unwatermarked_derivatives

       combinations: (4)
                     (2) = 6

       Basic+allow_zip+allow_pdf
       code      mask(48)
    49 00110001  00110000 (O)     |allow_zip|allow_pdf
    51 00110011  00110000 (O|R)   |allow_zip|allow_pdf
    55 00110111  00110000 (O|R|RF)|allow_zip|allow_pdf

       Basic+allow_zip+allow_raw
       code      mask(80)
    81 01010001  01010000 (O)     |allow_zip|allow_raw
    83 01010011  01010000 (O|R)   |allow_zip|allow_raw
    87 01010111  01010000 (O|R|RF)|allow_zip|allow_raw

       Basic+allow_raw+allow_pdf
       code      mask(80)
    97 01100001  01100000 (O)     |allow_raw|allow_pdf
    99 01100011  01100000 (O|R)   |allow_raw|allow_pdf
   103 01100111  01100000 (O|R|RF)|allow_raw|allow_pdf

       Basic+allow_zip+allow_unwatermarked_derivatives
       code      mask(80)
   145 10010001  10010000 (O)     |allow_zip|allow_unwatermarked_derivatives
   147 10010011  10010000 (O|R)   |allow_zip|allow_unwatermarked_derivatives
   151 10010111  10010000 (O|R|RF)|allow_zip|allow_unwatermarked_derivatives

       Basic+allow_pdf+allow_unwatermarked_derivatives
       code      mask(80)
   161 10100001  10100000 (O)     |allow_pdf|allow_unwatermarked_derivatives
   163 10100011  10100000 (O|R)   |allow_pdf|allow_unwatermarked_derivatives
   167 10100111  10100000 (O|R|RF)|allow_pdf|allow_unwatermarked_derivatives

       Basic+allow_raw+allow_unwatermarked_derivatives
       code      mask(80)
   193 11000001  11000000 (O)     |allow_raw|allow_unwatermarked_derivatives
   195 11000011  11000000 (O|R)   |allow_raw|allow_unwatermarked_derivatives
   199 11000111  11000000 (O|R|RF)|allow_raw|allow_unwatermarked_derivatives

       combinations: (4)
                     (3) = 4

       Basic+allow_zip+allow_pdf+allow_raw
       code      mask(112)
   113 01110001  01110000 (O)     |allow_zip|allow_pdf|allow_raw
   115 01110011  01110000 (O|R)   |allow_zip|allow_pdf|allow_raw
   119 01110111  01110000 (O|R|RF)|allow_zip|allow_pdf|allow_raw

       Basic+allow_zip+allow_pdf+allow_unwatermarked_derivatives
       code      mask(112)
   177 10110001  10110000 (O)     |allow_zip|allow_pdf|allow_unwatermarked_derivatives
   179 10110011  10110000 (O|R)   |allow_zip|allow_pdf|allow_unwatermarked_derivatives
   183 10110111  10110000 (O|R|RF)|allow_zip|allow_pdf|allow_unwatermarked_derivatives

       Basic+allow_zip+allow_raw+allow_unwatermarked_derivatives
       code      mask(112)
   209 11010001  11010000 (O)     |allow_zip|allow_raw|allow_unwatermarked_derivatives
   211 11010011  11010000 (O|R)   |allow_zip|allow_raw|allow_unwatermarked_derivatives
   215 11010111  11010000 (O|R|RF)|allow_zip|allow_raw|allow_unwatermarked_derivatives


       Basic+allow_pdf+allow_raw+allow_unwatermarked_derivatives
       code      mask(112)
   225 11100001  11100000 (O)     |allow_pdf|allow_raw|allow_unwatermarked_derivatives
   227 11100011  11100000 (O|R)   |allow_pdf|allow_raw|allow_unwatermarked_derivatives
   231 11100111  11100000 (O|R|RF)|allow_pdf|allow_raw|allow_unwatermarked_derivatives

       combinations: (4)
                     (4) = 1

       Basic+allow_zip+allow_pdf+allow_raw+allow_unwatermarked_derivatives_mask
       code      mask(240)
   241 11110001  11110000  (O)     |allow_zip|allow_pdf|allow_raw|allow_unwatermarked_derivatives
   243 11110011  11110000  (O|R)   |allow_zip|allow_pdf|allow_raw|allow_unwatermarked_derivatives
   247 11110111  11110000  (O|R|RF)|allow_zip|allow_pdf|allow_raw|allow_unwatermarked_derivatives


=cut

# ---------------------------------------------------------------------

use constant OPEN_MASK                 =>   1;
use constant OPEN_RESTRICTED_MASK      =>   1;
use constant RESTRICTED_MASK           =>   2;
use constant RESTRICTED_FORBIDDEN_MASK =>   4;
use constant RATE_MASK                 =>   8;
use constant ALLOW_ZIP_MASK            =>  16;
use constant ALLOW_PDF_EBM_MASK        =>  32;
use constant ALLOW_RAW_MASK            =>  64;
use constant ALLOW_UNWATERMARKED_MASK  => 128;

# ---------------------------------------------------------------------

=item __basic_access_is_authorized

Description

=cut

# ---------------------------------------------------------------------
my %basic_authorization_map =
  (
   'open'                 => OPEN_MASK,
   'open_restricted'      => OPEN_RESTRICTED_MASK,
   'restricted'           => RESTRICTED_MASK,
   'restricted_forbidden' => RESTRICTED_FORBIDDEN_MASK,
  );

sub __basic_access_is_authorized {
    my $self = shift;
    my ($code, $access_type) = @_;

    die "FATAL: access_type=$access_type" unless ($access_type);

    my $mask = $basic_authorization_map{$access_type};
    my $result = ($code & $mask);
    my $authorized = ($result == $mask);

    hLOG('API: ' . qq{__basic_access_is_authorized: access_type=$access_type code=$code mask=$mask result=$result authorized=$authorized});
    return $authorized;
}

# ---------------------------------------------------------------------

=item __extended_access_is_authorized

Materials that are [open_]restricted[_forbidden] require authorization bits

=cut

# ---------------------------------------------------------------------
my %extended_authorization_map =
  (
   'zip'                      => ALLOW_ZIP_MASK,
   'pdf_ebm'                  => ALLOW_PDF_EBM_MASK,
   'raw_archival_data'        => ALLOW_RAW_MASK,
   'unwatermarked_derivative' => ALLOW_UNWATERMARKED_MASK,
  );

sub __extended_access_is_authorized {
    my $self = shift;
    my ($code, $extended_access_type) = @_;

    die "FATAL: extended_access_type=$extended_access_type" unless ($extended_access_type);

    my $mask = $extended_authorization_map{$extended_access_type};
    my $result = ($code & $mask);
    my $authorized = ($result == $mask);

    hLOG('API: ' . qq{__extended_access_is_authorized: extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none') .qq{ code=$code mask=$mask result=$result authorized=$authorized});
    return $authorized;
}

# ---------------------------------------------------------------------

=item __access_is_authorized

Wrapper method

=cut

# ---------------------------------------------------------------------
sub __access_is_authorized {
    my $self = shift;
    my ($code, $access_type, $extended_access_type) = @_;

    my $authorized = $self->__basic_access_is_authorized($code, $access_type);
    if ($authorized) {
        if (defined $extended_access_type) {
            $authorized = $self->__extended_access_is_authorized($code, $extended_access_type);
        }
    }

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
    my $access_type = shift;

    $ENV{SERVER_PORT} = 80 if (! defined $ENV{SERVER_PORT});

    if ($access_type =~ m,restricted,) {
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
    my ($ipo, $access_type, $extended_access_type) = @_;

    my $ip = $ipo->address;
    my $ip_address_is_valid  = $ipo->ip_is_valid();
    my $client_type = $ipo->client_type();

    my $locked = $ipo->address_locked();
    my $lock_required = 0;

    if ($access_type =~ m,restricted,) {
        if ($access_type =~ m,open,) {
            if (defined $extended_access_type) {
                $lock_required = 1;
            }
        }
        else {
            $lock_required = 1;
        }
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
    my $s = qq{API: __authorized_at_IP_address: authorized=$authorized ip=$ip access_type=$access_type extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none');
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
    my ($Q, $dbh, $resource, $access_type, $extended_access_type) = @_;

    return 1 if (__allow_development_authorization_override());

    if (! $self->__auth_valid) {
        return $self->error('cannot authorize: authentication error');
    }

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    if ($self->__expired_authorization($dbh, $access_key)) {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: authorization expired access_key=$access_key  resource=$resource access_type=$access_type extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none'));
        return $self->error('authorization expired');
    }

    if (! $self->__authorized_protocol($access_type)) {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: protocol fail access_key=$access_key  resource=$resource access_type=$access_type extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none') . qq{ port=$ENV{SERVER_PORT}});
        return $self->error('redirect over SSL required');
    }

    my ($code) = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    my $ipo = new API::HTD::IP_Address;

    if ($self->__access_is_authorized($code, $access_type, $extended_access_type)) {
        if ($self->__authorized_at_IP_address($ipo, $access_type, $extended_access_type)) {
            return 1;
        }
        else {
            API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
            my $ip = $ipo->address;
            hLOG('API ERROR: ' . qq{H_authorized: ip address fail access_key=$access_key resource=$resource access_type=$access_type extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none') . qq{ ip=$ip});
            return $self->error('unauthorized originating ip address');
        }
    }
    else {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: insufficient privilege access_key=$access_key resource=$resource access_type=$access_type extended_access_type=} . (defined($extended_access_type) ? $extended_access_type : 'none'));
        return $self->error('insufficient privilege');
    }
}


1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012 ©, The Regents of The University of Michigan, All Rights Reserved

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
