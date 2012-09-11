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
use HOAuth::Signature;

use API::HTD_Log;
use API::Utils;

use API::HTD::AuthDb;
use API::HTD::IP_Address;

my $FORCE_SUCCESS = 0;
my $DISALLOW_GRACE_PERIOD = 0;
my $ALLOW_DEVELOPMENT_OVERRIDE = 0;

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

    return if ($FORCE_SUCCESS);

    my $Q = $args->{_query};
    my $dbh = $args->{_dbh};

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
        die if (defined $self->{_authentication_valid});
        $self->{_authentication_valid} = $valid
    }
    return $self->{_authentication_valid};
}


# ---------------------------------------------------------------------

=item H_allow_development_auth

Description

=cut

# ---------------------------------------------------------------------
sub H_allow_development_auth {
    my $self = shift;

    my $dev = ($ALLOW_DEVELOPMENT_OVERRIDE && (defined $ENV{HT_DEV})) ? 1 : 0;

    hLOG_DEBUG('API: ' . qq{H_allow_development_auth: dev authnz overridden=$dev});
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

=item H_allow_non_oauth_by_grace

Special support for grace period if OAuth params absent

=cut

# ---------------------------------------------------------------------
use constant OCT_1_2012 => 1349049600;

sub H_allow_non_oauth_by_grace {
    my $self = shift;
    my $accessType = shift;

    return 1 if ($FORCE_SUCCESS);
    return 0 if ($DISALLOW_GRACE_PERIOD);

    if (time() < OCT_1_2012) {
        if (grep(/^$accessType$/, ('open', 'limited'))) {
            return 1;
        }
    }

    return $self->error("access_type=$accessType in non-oauth request not allowed in grace period");
}

# ---------------------------------------------------------------------

=item __check_nonce_and_timestamp

Request is valid if:

1) oauth_timestamp is in the closed interval [now - window, now + window].

    This allows us to limit storage of nonces to just those seen
    within this window. We reject the request id timestamp is outside
    the window because we (the Service Provider) no longer have nonces
    from that interval to test against.  The window also supports a
    measure of non-synchronization between us and our Consumers.

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

Description

=cut

# ---------------------------------------------------------------------
sub H_request_is_oauth {
    my $self = shift;
    my $Q = shift;

    my @params = map { lc($_) } $Q->param;
    my $oauth_param_ct = grep(/^oauth/, @params);
    return ($oauth_param_ct == 6);
}


# ---------------------------------------------------------------------

=item H_authenticate

Description

=cut

# ---------------------------------------------------------------------
sub H_authenticate {
    my $self = shift;
    my ($Q, $dbh, $client_data) = @_;

    return $self->__auth_valid(1) if ($FORCE_SUCCESS);

    my $authenticated = 0;

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    my $nonce = $Q->param('oauth_nonce') || 0;
    my $timestamp = $Q->param('oauth_timestamp') || 0;

    if ($self->__check_nonce_and_timestamp($dbh, $access_key, $nonce, $timestamp)) {
        my $signed_url = signature_safe_url($Q);
        if ($self->__check_signature($signed_url, $dbh, $access_key, $client_data)) {
            $authenticated = 1;
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

 #    Bitfield encoding. A set bit indicates authorized access level(s) +
 #      - an enhanced data rate
 #      - PDF access for Expressnet/EBM
 #      - image derivatives
 #      - suppressed watermarking
 #
 #    accesses
 #                                  bit
 #                            7 6 5 4 3 2 1 0
 #                            | | | | | | | |
 #    allow_unwatermarked ----+ | | | | | | |
 #    allow_derivative ---------+ | | | | | |
 #    allow_pdf ------------------+ | | | | |
 #    rate -------------------------+ | | | |
 #    restricted_forbidden -----------+ | | |
 #    restricted -----------------------+ | |
 #    open_restricted --------------------+ |
 #    open ---------------------------------+
 #
 #    Basic codes below assume that authorization to restricted implies
 #    authorization to less restricted.  Some shorthand:
 #
 #    (O)         = open
 #    (O|OR)      = open|open_restricted
 #    (O|OR|R)    = open|open_restricted|restricted
 #    (O|OR|R|RF) = open|open_restricted|restricted|restricted_forbidden
 #
 #       Basic
 #       code      basic_mask
 #    0  00000000            NOT AUTHORIZED
 #    1  00000001  00000001  (O)
 #    3  00000011  00000010  (O|OR)
 #    7  00000111  00000100  (O|OR|R)
 #    15 00001111  00001000  (O|OR|R|RF)
 #
 #       Basic+rate
 #       code      rate_mask
 #    17 00010001  00010000  (O)        |rate
 #    19 00010011  00010000  (O|OR)     |rate
 #    23 00010111  00010000  (O|OR|R)   |rate
 #    31 00011111  00010000  (O|OR|R|RF)|rate
 #
 #       Basic+allow_pdf
 #       code      allow_pdf_ebm_mask
 #    33 00100001  00100000  (O)        |allow_pdf
 #    35 00100011  00100000  (O|OR)     |allow_pdf
 #    39 00100111  00100000  (O|OR|R)   |allow_pdf
 #    47 00101111  00100000  (O|OR|R|RF)|allow_pdf
 #
 #       Basic+allow_derivative
 #       code      allow_derivative_mask
 #    65 01000001  01000000  (O)        |allow_derivative
 #    67 01000011  01000000  (O|OR)     |allow_derivative
 #    71 01000111  01000000  (O|OR|R)   |allow_derivative
 #    79 01001111  01000000  (O|OR|R|RF)|allow_derivative
 #
 #       Basic+allow_unwatermarked
 #       code      allow_unwatermarked_mask
 #   129 10000001  10000000  (O)        |allow_unwatermarked
 #   131 10000011  10000000  (O|OR)     |allow_unwatermarked
 #   135 10000111  10000000  (O|OR|R)   |allow_unwatermarked
 #   143 10001111  10000000  (O|OR|R|RF)|allow_unwatermarked
 #
 #       Basic+allow_derivative+allow_unwatermarked
 #       code
 #   193 11000001  --------  (O)        |allow_derivative|allow_unwatermarked
 #   195 11000011  --------  (O|OR)     |allow_derivative|allow_unwatermarked
 #   199 11000111  --------  (O|OR|R)   |allow_derivative|allow_unwatermarked
 #   207 11001111  --------  (O|OR|R|RF)|allow_derivative|allow_unwatermarked
 #
 #       Basic+allow_pdf+allow_derivative+allow_unwatermarked
 #       code
 #   225 11100001  --------  (O)        |allow_pdf|allow_derivative|allow_unwatermarked
 #   227 11100011  --------  (O|OR)     |allow_pdf|allow_derivative|allow_unwatermarked
 #   231 11100111  --------  (O|OR|R)   |allow_pdf|allow_derivative|allow_unwatermarked
 #   239 11101111  --------  (O|OR|R|RF)|allow_pdf|allow_derivative|allow_unwatermarked

=cut

# ---------------------------------------------------------------------

use constant OPEN_MASK                 =>   1;
use constant OPEN_RESTRICTED_MASK      =>   2;
use constant RESTRICTED_MASK           =>   4;
use constant RESTRICTED_FORBIDDEN_MASK =>   8;
use constant RATE_MASK                 =>  16;
use constant ALLOW_PDF_EBM_MASK        =>  32;
use constant ALLOW_DERIVATIVE_MASK     =>  64;
use constant ALLOW_UNWATERMARKED_MASK  => 128;

# ---------------------------------------------------------------------

=item __basic_access_is_authorized

Description

=cut

# ---------------------------------------------------------------------
my %basic_authorization_map =
  (
   'open'                 => OPEN_MASK,
   'limited'              => OPEN_MASK,
   'open_restricted'      => OPEN_RESTRICTED_MASK,
   'restricted'           => RESTRICTED_MASK,
   'restricted_forbidden' => RESTRICTED_FORBIDDEN_MASK,
  );

sub __basic_access_is_authorized {
    my $self = shift;
    my ($code, $access_type) = @_;

    my $mask = $basic_authorization_map{$access_type};
    my $result = ($code & $mask);
    my $authorized = ($result == $mask);

    hLOG_DEBUG('API: ' . qq{__basic_access_is_authorized: access_type=$access_type code=$code mask=$mask result=$result authorized=$authorized});
    return $authorized;
}

# ---------------------------------------------------------------------

=item __extended_access_is_authorized

Description

=cut

# ---------------------------------------------------------------------
my %extended_authorization_map =
  (
   'pdf_ebm'                  => ALLOW_PDF_EBM_MASK,
   'watermarked_derivative'   => ALLOW_DERIVATIVE_MASK,
   'unwatermarked_derivative' => ALLOW_DERIVATIVE_MASK|ALLOW_UNWATERMARKED_MASK,
  );

sub __extended_access_is_authorized {
    my $self = shift;
    my ($code, $extended_access_type) = @_;

    my $mask = $extended_authorization_map{$extended_access_type};
    my $result = ($code & $mask);
    my $authorized = ($result == $mask);

    hLOG_DEBUG('API: ' . qq{__extended_access_is_authorized: extended_access_type=$extended_access_type code=$code mask=$mask result=$result authorized=$authorized});
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

=item __authorized_protocol

Description

=cut

# ---------------------------------------------------------------------
sub __authorized_protocol {
    my $self = shift;
    my ($access_type, $extended_access_type) = @_;

    $ENV{SERVER_PORT} = 80 if (! defined $ENV{SERVER_PORT});

    if ( ($access_type =~ m,restricted,) || (defined $extended_access_type) ) {
        if ($ENV{SERVER_PORT} ne '443') {
            return 0;
        }
    }

    return 1;
}

# ---------------------------------------------------------------------

=item __authorized_at_IP_address

Requests for resources that have a 'basic' access_type of 'restricted'
or any 'extended' access_type must have an authorized 'ip' query parameter
value. Note that all query parameters are hashed into the signature.

It has already been determined that the access_key allows access based
on these access_types so here the test is for a valid origin for the
request with the given access_types.

=cut

# ---------------------------------------------------------------------
sub __authorized_at_IP_address {
    my $self = shift;
    my ($ipo, $access_type, $extended_access_type) = @_;

    $extended_access_type = ($extended_access_type ? $extended_access_type : 'none');

    my $ip = $ipo->address;
    if ( defined($extended_access_type) || ($access_type =~ m,restricted,) ) {
        my $authorized = $ipo->is_authorized;

        hLOG_DEBUG(qq{__authorized_at_IP_address: authorized=$authorized ip=$ip access_type=$access_type extended_access_type=$extended_access_type});
        return $authorized;
    }

    hLOG_DEBUG(qq{__authorized_at_IP_address: authorized=1 ip=$ip access_type=$access_type extended_access_type=$extended_access_type});
    return 1;
}


# ---------------------------------------------------------------------

=item H_authorized

Description

=cut

# ---------------------------------------------------------------------
sub H_authorized {
    my $self = shift;
    my ($Q, $dbh, $resource, $access_type, $extended_access_type) = @_;

    return 1 if ($FORCE_SUCCESS);

    if (! $self->__auth_valid) {
        return $self->error('cannot authorize. not authenticated');
    }

    my $access_key = $Q->param('oauth_consumer_key');

    if (! $self->__authorized_protocol($access_type, $extended_access_type)) {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: protocol fail access_key=$access_key  resource=$resource access_type=$access_type extended_access_type=$extended_access_type port=$ENV{SERVER_PORT}});
        return $self->error('redirect over SSL required');
    }

    my $code = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    my $ipo = new API::HTD::IP_Address;

    if ($self->__access_is_authorized($code, $access_type, $extended_access_type)) {
        if ($self->__authorized_at_IP_address($ipo, $access_type, $extended_access_type)) {
            return 1;
        }
        else {
            API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
            my $ip = $ipo->address;
            hLOG('API ERROR: ' . qq{H_authorized: ip address fail $access_key=$access_key resource=$resource access_type=$access_type extended_access_type=$extended_access_type ip=$ip});
            return $self->error('unauthorized originating ip address');
        }
    }
    else {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API ERROR: ' . qq{H_authorized: insufficient privilege access_key=$access_key resource=$resource access_type=$access_type extended_access_type=$extended_access_type});
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
