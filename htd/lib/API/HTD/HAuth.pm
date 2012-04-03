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

use API::HTD::AuthDb;
use API::HTD_Log;

# So we can drive unit testing
$ENV{FORCE_NONCE_USED} = 0;
$ENV{FORCE_NONCE_UNUSED} = 0;

$ENV{FORCE_VALID_TIMESTAMP} = 0;
$ENV{FORCE_INVALID_TIMESTAMP} = 0;

$ENV{FORCE_VALID_SIGNATURE} = 0;
$ENV{FORCE_INVALID_SIGNATURE} = 0;

$ENV{FORCE_AUTHROIZATION_SUCCESS} = 0;
$ENV{FORCE_AUTHROIZATION_FAILURE} = 0;

$ENV{FORCE_SUCCESS} = 0;
$ENV{ALLOW_DEVELOPMENT_OVERRIDE} = 0;

my $DEBUG;

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

    return if $ENV{FORCE_SUCCESS};
    
    my $oauth_consumer_key = $args->{_query}->param('oauth_consumer_key');
    API::HTD::AuthDb::update_access($args->{_dbh}, $oauth_consumer_key)
        if (defined $oauth_consumer_key);

    $DEBUG = $args->{_debug};
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

=item H_allowDevelopmentAuth

Description

=cut

# ---------------------------------------------------------------------
sub H_allowDevelopmentAuth {
    my $self = shift;

    my $dev = ($ENV{ALLOW_DEVELOPMENT_OVERRIDE} && (defined $ENV{HT_DEV})) ? 1 : 0;

    if ($DEBUG eq 'auth') { print qq{dev authnz overridden=$dev<br/>\n} }
    return $dev;
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
        return
          hLOG(qq{__check_timestamp: timestamp refused oauth_timestamp=$timestamp oauth_consumer_key=$access_key}),
            $self->error(TIMESTAMP_REFUSED)
              unless ($ENV{FORCE_VALID_TIMESTAMP});
    }
    else {
        my $valid = API::HTD::AuthDb::valid_timestamp_for_access_key($dbh, $access_key, $timestamp);
        if (! $valid) {
            return
              hLOG(qq{H_authenticate: invalid timestamp oauth_timestamp=$timestamp oauth_consumer_key=$access_key}),
                $self->error(TIMESTAMP_REFUSED)
                  unless ($ENV{FORCE_VALID_TIMESTAMP});
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
        return
          hLOG(qq{H_authenticate: oauth_nonce=$nonce used oauth_timestamp=$timestamp oauth_consumer_key=$access_key}),
            $self->error(NONCE_USED)
              unless ($ENV{FORCE_NONCE_UNUSED});
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

    my $signed_url = $Q->url({
                              -path_info=>1,
                              -query=>1
                             });
    my $secret_key = API::HTD::AuthDb::get_secret_by_active_access_key($dbh, $access_key);
    my ($valid, $errors) = HOAuth::Signature::S_validate($signed_url, $access_key, $secret_key, REQUEST_METHOD, $client_data);
    if (! $valid) {
        my $s = qq{H_authenticate: $errors url=$signed_url};
        return hLOG($s), $self->error($errors) unless ($ENV{FORCE_VALID_SIGNATURE});
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

    my $access_key = $Q->param('oauth_consumer_key') || 0;
    return $access_key;
}


# ---------------------------------------------------------------------

=item H_authenticate

Description

=cut

# ---------------------------------------------------------------------
sub H_authenticate {
    my $self = shift;
    my ($Q, $dbh, $client_data) = @_;

    return 1 if ($ENV{FORCE_SUCCESS});
    
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
#    xxxxxxxxxxxxxxxxxxxxx --------+ | | | |
#    rate ---------------------------+ | | |
#    restricted -----------------------+ | |
#    open_restricted --------------------+ |
#    open ---------------------------------+
#
#    masks
#
#    0  = 0000: NOT AUTHORIZED
#    1  = 0001: open
#    2  = 0010: open_restricted
#    3  = 0011: open|open_restricted
#    4  = 0100:                      restricted
#    5  = 0101: open                |restricted
#    6  = 0110:      open_restricted|restricted
#    7  = 0111: open|open_restricted|restricted
#    8  = 1000:                                 rate
#    9  = 1001: open                           |rate
#    10 = 1010: open_restricted                |rate
#    11 = 1011: open|open_restricted           |rate
#    12 = 1100:                      restricted|rate
#    13 = 1101: open                |restricted|rate
#    14 = 1110:      open_restricted|restricted|rate
#    15 = 1111: open|open_restricted|restricted|rate
#

=cut

# ---------------------------------------------------------------------

use constant OPEN_MASK            => 1;
use constant OPEN_RESTRICTED_MASK => 2;
use constant RESTRICTED_MASK      => 4;
use constant RATE_MASK            => 8;

my %authorization_map =
  (
   'open'            => OPEN_MASK,
   'limited'         => OPEN_MASK,
   'open_restricted' => OPEN_RESTRICTED_MASK,
   'restricted'      => RESTRICTED_MASK,
  );

sub __access_is_authorized {
    my ($code, $access_type) = @_;

    my $mask = $authorization_map{$access_type};

    return ($code & $mask) > 0;
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

    if ($access_type =~ m,restricted,) {
        # First this has to be HTTPS ...
        if ($ENV{SERVER_PORT} ne '443') {
            return $self->error('SSL required') unless ($ENV{FORCE_AUTHROIZATION_SUCCESS});
        }
    }

    # ... then see if they are authorized
    my $access_key = $Q->param('oauth_consumer_key');
    my $code = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    if (__access_is_authorized($code, $access_type)) {
        return 1 unless ($ENV{FORCE_AUTHROIZATION_FAILURE});
    }
    else {
        API::HTD::AuthDb::update_fail_ct($dbh, $access_key, 0);
        return $self->error("$access_key not authorized. resource=$resource type=$access_type") unless ($ENV{FORCE_AUTHROIZATION_SUCCESS});
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
