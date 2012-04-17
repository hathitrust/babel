package API::HTD::HAuth;


=head1 NAME

API::HTD:HAuth

=head1 DESCRIPTION

This class encapsulates the authentication and authorization processes
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

# So we can drive unit testing
delete $ENV{FORCE_NONCE_USED}            unless (defined $ENV{FORCE_NONCE_USED});
delete $ENV{FORCE_NONCE_UNUSED}          unless (defined $ENV{FORCE_NONCE_UNUSED});

delete $ENV{FORCE_VALID_TIMESTAMP}       unless (defined $ENV{FORCE_VALID_TIMESTAMP});
delete $ENV{FORCE_INVALID_TIMESTAMP}     unless (defined $ENV{FORCE_INVALID_TIMESTAMP});

delete $ENV{FORCE_VALID_SIGNATURE}       unless (defined $ENV{FORCE_VALID_SIGNATURE});
delete $ENV{FORCE_INVALID_SIGNATURE}     unless (defined $ENV{FORCE_INVALID_SIGNATURE});

delete $ENV{FORCE_AUTHORIZATION_SUCCESS} unless (defined $ENV{FORCE_AUTHORIZATION_SUCCESS});
delete $ENV{FORCE_AUTHORIZATION_FAILURE} unless (defined $ENV{FORCE_AUTHORIZATION_FAILURE});

delete $ENV{FORCE_SUCCESS}               unless (defined $ENV{FORCE_SUCCESS});
delete $ENV{ALLOW_DEVELOPMENT_OVERRIDE}  unless (defined $ENV{ALLOW_DEVELOPMENT_OVERRIDE});
delete $ENV{DISALLOW_GRACE_PERIOD}       unless (defined $ENV{DISALLOW_GRACE_PERIOD});


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
    my $Q = shift;
    my $dbh = shift;

    return if $ENV{FORCE_SUCCESS};

    my $oauth_consumer_key = $Q->param('oauth_consumer_key');
    API::HTD::AuthDb::update_access($dbh, $oauth_consumer_key)
        if (defined $oauth_consumer_key);
}


# ---------------------------------------------------------------------

=item H_auth_valid

Mutator

=cut

# ---------------------------------------------------------------------
sub H_auth_valid {
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

    my $dev = ($ENV{ALLOW_DEVELOPMENT_OVERRIDE} && (defined $ENV{HT_DEV})) ? 1 : 0;

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

    return 1 if ($ENV{FORCE_SUCCESS});
    return 0 if ($ENV{DISALLOW_GRACE_PERIOD});

    if (time() < OCT_1_2012) {
        if (grep(/^$accessType$/, ('open', 'limited'))) {
            return 1;
        }
    }

    return $self->error("access_type=$accessType in non-oauth request not allowed in grace period");
}

# ---------------------------------------------------------------------

=item __check_timestamp

Reject request if:

1) oauth_timestamp is outside a time window either past or
future. This allows us to expire old timestamps and to support some
measure of non-synchronization between us and our clients.

=cut

# ---------------------------------------------------------------------
sub __check_timestamp {
    my $self = shift;
    my ($dbh, $access_key, $timestamp) = @_;

    my $delta = time() - $timestamp;
    if (abs($delta) > TIMESTAMP_WINDOW) {
        # wayward clock (past or future) or stale timestamp
        hLOG('API: ' . qq{__check_timestamp: timestamp refused oauth_timestamp=$timestamp oauth_consumer_key=$access_key});
        return $self->error(TIMESTAMP_REFUSED) unless ($ENV{FORCE_VALID_TIMESTAMP});
    }
    else {
        my $valid = API::HTD::AuthDb::valid_timestamp_for_access_key($dbh, $access_key, $timestamp);
        if (! $valid) {
            hLOG('API: ' . qq{__check_timestamp: invalid timestamp oauth_timestamp=$timestamp oauth_consumer_key=$access_key});
            return $self->error(TIMESTAMP_REFUSED) unless ($ENV{FORCE_VALID_TIMESTAMP});
        }
    }

    return ($ENV{FORCE_INVALID_TIMESTAMP} ? 0 : 1);
}


# ---------------------------------------------------------------------

=item __check_nonce

Reject request if:

nonce repeats within a time window delta over past or
future to defeat replay attacks.

=cut

# ---------------------------------------------------------------------
sub __check_nonce {
    my $self = shift;
    my ($dbh, $access_key, $nonce, $timestamp) = @_;

    my $used = API::HTD::AuthDb::nonce_used_by_access_key($dbh, $access_key, $nonce, $timestamp, TIMESTAMP_WINDOW);
    if ($used) {
        hLOG('API: ' . qq{__check_nonce: oauth_nonce=$nonce used oauth_timestamp=$timestamp oauth_consumer_key=$access_key});
        return $self->error(NONCE_USED) unless ($ENV{FORCE_NONCE_UNUSED});
    }

    return ($ENV{FORCE_NONCE_USED} ? 0 : 1);
}

# ---------------------------------------------------------------------

=item __check_signature

Description

=cut

# ---------------------------------------------------------------------
sub __check_signature {
    my $self = shift;
    my ($Q, $dbh, $access_key, $client_data) = @_;

    my $signed_url = signature_safe_url($Q);    
    hLOG_DEBUG(qq{__check_signature: signature safe signed url=$signed_url});

    my $secret_key = API::HTD::AuthDb::get_secret_by_active_access_key($dbh, $access_key);
    my ($valid, $errors) = HOAuth::Signature::S_validate($signed_url, $access_key, $secret_key, REQUEST_METHOD, $client_data);
    if (! $valid) {
        hLOG('API: ' . qq{__check_signature: $errors oauth_consumer_key=$access_key url=$signed_url});
        return $self->error($errors) unless ($ENV{FORCE_VALID_SIGNATURE});
    }
    
    return ($ENV{FORCE_INVALID_SIGNATURE} ? 0 : 1);
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
    my $is_oauth = grep(/^oauth/, @params);
    return $is_oauth;
}


# ---------------------------------------------------------------------

=item H_authenticate

Description

=cut

# ---------------------------------------------------------------------
sub H_authenticate {
    my $self = shift;
    my ($Q, $dbh, $client_data) = @_;

    return $self->H_auth_valid(1) if ($ENV{FORCE_SUCCESS});

    my $authenticated = 0;

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    my $nonce = $Q->param('oauth_nonce') || 0;
    my $timestamp = $Q->param('oauth_timestamp') || 0;

    # stale timestamp?
    if ($self->__check_timestamp($dbh, $access_key, $timestamp)) {
        # replay attempt?
        if ($self->__check_nonce($dbh, $access_key, $nonce, $timestamp)) {
            # signature ok?
            if ($self->__check_signature($Q, $dbh, $access_key, $client_data)) {
                $authenticated = 1;
            }
        }
    }

    $self->H_auth_valid($authenticated);

    # record
    API::HTD::AuthDb::insert_nonce_timestamp($dbh, $access_key, $nonce, $timestamp);
    # track
    API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 1) if (! $authenticated);

    return $authenticated;
}

# ---------------------------------------------------------------------

=item __access_is_authorized

#    Bitfield encoding. A set bit indicates authorized access type(s) or an
#    enhanced rate agreement.
#
#    accesses
#                                  bit
#                            7 6 5 4 3 2 1 0
#                            | | | | | | | |
#    xxxxxxxxxxxxxxxxxxxxx --+ | | | | | | |
#    xxxxxxxxxxxxxxxxxxxxx ----+ | | | | | |
#    xxxxxxxxxxxxxxxxxxxxx ------+ | | | | |
#    rate -------------------------+ | | | |
#    restricted_forbidden -----------+ | | |
#    restricted -----------------------+ | |
#    open_restricted --------------------+ |
#    open ---------------------------------+
#
#    codes below assume that authorization to restricted implies
#    authorization to less restricted
#    
#    code       mask
#
#    0          0000: NOT AUTHORIZED
#    1  0001    0001: open
#    3  0011    0010: open|open_restricted
#    7  0111    0100: open|open_restricted|restricted
#    15 1111    1000: open|open_restricted|restricted|restricted_forbidden
#
#    codes when rate agreements apply
#
#    17 10001  10000: open                                                |rate
#    19 10011  10000: open|open_restricted                                |rate
#    23 10111  10000: open|open_restricted|restricted                     |rate
#    31 11111  10000: open|open_restricted|restricted|restricted_forbidden|rate
#

=cut

# ---------------------------------------------------------------------

use constant OPEN_MASK                 =>  1;
use constant OPEN_RESTRICTED_MASK      =>  2;
use constant RESTRICTED_MASK           =>  4;
use constant RESTRICTED_FORBIDDEN_MASK =>  8;
use constant RATE_MASK                 => 16;

my %authorization_map =
  (
   'open'                 => OPEN_MASK,
   'limited'              => OPEN_MASK,
   'open_restricted'      => OPEN_RESTRICTED_MASK,
   'restricted'           => RESTRICTED_MASK,
   'restricted_forbidden' => RESTRICTED_FORBIDDEN_MASK,
  );

sub __access_is_authorized {
    my ($code, $access_type) = @_;

    my $mask = $authorization_map{$access_type};
    my $result = ($code & $mask);
    
    hLOG_DEBUG('API: ' . qq{__access_is_authorized: access_type=$access_type code=$code mask=$mask result=$result});
    return ($result > 0);
}

# ---------------------------------------------------------------------

=item H_authorized_protocol

Description

=cut

# ---------------------------------------------------------------------
sub H_authorized_protocol {
    my $self = shift;
    my ($Q, $dbh, $access_type) = @_;

    return 1 if ($ENV{FORCE_SUCCESS});

    $ENV{SERVER_PORT} = 80 if (! defined $ENV{SERVER_PORT});
    
    if ($access_type =~ m,restricted,) {
        if ($ENV{SERVER_PORT} ne '443') {
            hLOG('API: ' . qq{H_authorized_protocol: FAIL access_type=$access_type port=$ENV{SERVER_PORT}});

            return $self->error('redirect to SSL required') unless $ENV{FORCE_AUTHORIZATION_SUCCESS};
        }
    }

    return 1;
}


# ---------------------------------------------------------------------

=item H_authorized

Description

=cut

# ---------------------------------------------------------------------
sub H_authorized {
    my $self = shift;
    my ($Q, $dbh, $resource, $access_type) = @_;

    return 1 if ($ENV{FORCE_SUCCESS});

    if (! $self->H_auth_valid) {
        return $self->error('cannot authorize. not authenticated');
    }    

    my $access_key = $Q->param('oauth_consumer_key');
    my $code = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    if (__access_is_authorized($code, $access_type)) {
        return ($ENV{FORCE_AUTHORIZATION_FAILURE}
                ||
                1);
    }
    else {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        hLOG('API: ' . qq{H_authorized: $access_key insufficient privilege. resource=$resource type=$access_type});
        return $self->error("insufficient privilege") unless ($ENV{FORCE_AUTHORIZATION_SUCCESS});
    }
}


1;

__END__

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
