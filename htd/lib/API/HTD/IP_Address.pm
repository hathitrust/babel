package API::HTD::IP_Address;

=head1 NAME

API::HTD::IP_Address

=head1 DESCRIPTION

This singleton class provides the logic to determine the IP address of
an API request.

Refer to SDRROOT/htd/lib/API/HTD/trust

=head1 SYNOPSIS

 API::HTD::IP_Address->new($config, $dbh, $access_key, $ip_address_param);

 later:

 my $ipo = new API::HTD::IP_Address();

 my $ip_address_is_valid  = $ipo->ip_is_valid();


=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use API::HTD::HConf;
use API::HTD_Log;
use API::HTD::AuthDb;

my $singleton;

sub new {
    if ( defined($singleton) ) {
        shift;
        die "FATAL: attempt to redefine API::HTD::IP_Address" if (scalar(@_));
    }
    else {
        my $class = shift;
        my $self = {};
        $singleton = bless $self, $class;

        $self->__initialize(@_);
    }
    return $singleton;
}

# ---------------------------------------------------------------------
#
my $IP_REMOTE_ADDR_NO_TRUST                 = 'ip_remote_addr_no_trust';

my $IP_IP_PARAM_NO_LOCK                     = 'ip_ip_param_no_lock';

my $IP_REMOTE_ADDR_MATCH_REGEXP             = 'ip_remote_addr_match_regexp';
my $IPf_REMOTE_ADDR_MATCH_REGEXP            = 'ip_remote_addr_NO_match_regexp';

my $IP_IP_PARAM_MATCH_REGEXP                = 'ip_ip_param_match_regexp';
my $IPf_IP_PARAM_MATCH_REGEXP               = 'ip_ip_param_NO_match_regexp';

my $IP_IP_PARAM_EQ_REMOTE_ADDR              = 'ip_ip_param_eq_remote_addr';
my $IPf_IP_PARAM_EQ_REMOTE_ADDR             = 'ip_ip_param_NO_eq_remote_addr';

my $IP_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM  = 'ip_remote_addr_match_regexp_w_ip_param';
my $IPf_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM = 'ip_remote_addr_NO_match_regexp_w_ip_param';

my $IPf_BAD_TYPE                            = 'ip_bad_type';
my $IPf_BAD_IP_PARAM                        = 'ip_bad_ip_param';

# ---------------------------------------------------------------------
#
sub __set_member_data {
    my $self = shift;
    ( $self->{storedipaddress}, $self->{valid}, $self->{geotrusted}, $self->{type}, $self->{addresslocked} ) = @_;
}

# ---------------------------------------------------------------------

=item __handle_type_U_client

An external requestor who has registered for a key-pair but which has
not been given higher that default code=1 access (not in
htd_authorization). The stored IP address is the REMOTE_ADDR but we do
not trust this for geoip test because this client could be a proxy. We
have no way of knowing.

=cut

# ---------------------------------------------------------------------
sub __handle_type_U_client {
    my $self = shift;
    my $stored_IP_address = shift;
    
    my $type = 'U';

    my $valid = 1;
    my $geo_trusted = 0;
    my $locked_to_authorized_ip_address = 0;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    hLOG(qq{API: IP_Address[type=$type]: $IP_REMOTE_ADDR_NO_TRUST: valid=$valid ip_param=NONE IP_stored=$stored_IP_address lock=$locked_to_authorized_ip_address});
}

# ---------------------------------------------------------------------

=item __handle_type_K_client

This is an authenticated (logged in) user of htdc who does not have
authorization above default code=1 (not in htd_authorization so no IP
regexp to test with for restricted/extended access). The stored IP
address is the IP param passed to us from htdc which we trust because
htdc aupplies the REMOTE_ADDR of the users UA for geoip testing.

=cut

# ---------------------------------------------------------------------
sub __handle_type_K_client {
    my $self = shift;
    my $stored_IP_address  = shift;

    my $type = 'K';
    
    my $valid = 1;
    my $geo_trusted = 1;
    my $locked_to_authorized_ip_address = 0;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    hLOG(qq{API: IP_Address[type=$type]: $IP_IP_PARAM_NO_LOCK: valid=$valid ip_param=$stored_IP_address IP_stored=$stored_IP_address lock=$locked_to_authorized_ip_address});
}

# ---------------------------------------------------------------------

=item __handle_type_0_client

This is in internal development client such as from ptg locked to its
REMOTE_ADDR. 

=cut

# ---------------------------------------------------------------------
sub __handle_type_0_client {
    my $self = shift;
    my ($stored_IP_address, $match_IP_address, $IP_regexp) = @_;

    my $type = '0';

    my $valid = ($match_IP_address =~ m,$IP_regexp,);
    my $geo_trusted = $valid;
    my $locked_to_authorized_ip_address = $valid;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    my $event = $valid ? $IP_REMOTE_ADDR_MATCH_REGEXP : $IPf_REMOTE_ADDR_MATCH_REGEXP;

    hLOG(qq{API: IP_Address[type=$type]: $event: valid=$valid ip_param=$stored_IP_address IP_stored=$stored_IP_address IP_match=$match_IP_address regexp=$IP_regexp lock=$locked_to_authorized_ip_address});
}

# ---------------------------------------------------------------------

=item __handle_type_1_client

This is an authenticated (logged in) user of htdc who may have
authorization above default code=1 (in htd_authorization. There must
be an IP regexp to test with if restricted/extended access is
required. The stored IP address is the IP param passed to us from htdc
which we always trust for geoip testing.

=cut

# ---------------------------------------------------------------------
sub __handle_type_1_client {
    my $self = shift;
    my ($stored_IP_address, $match_IP_address, $IP_regexp) = @_;

    my $type = '1';

    my $valid = 1;
    my $match = ($match_IP_address =~ m,$IP_regexp,);
    my $geo_trusted = 1;
    my $locked_to_authorized_ip_address = $match;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    my $event = $match ? $IP_IP_PARAM_MATCH_REGEXP : $IPf_IP_PARAM_MATCH_REGEXP;

    hLOG(qq{API: IP_Address[type=$type]: $event: valid=$valid ip_param=$stored_IP_address IP_stored=$stored_IP_address IP_match=$match_IP_address regexp=$IP_regexp lock=$locked_to_authorized_ip_address});
}
    
# ---------------------------------------------------------------------

=item __handle_type_2_client

This is a Qual-type client where a trusted server has asserted a
remote javascript client's IP address. If the client's actual
REMOTE_ADDR equals the asserted IP address in the IP URL param, the
request is valid.

=cut

# ---------------------------------------------------------------------
sub __handle_type_2_client {
    my $self = shift;
    my ($stored_IP_address, $match_IP_address, $remote_addr) = @_;

    my $type = '2';

    my $match = ($match_IP_address eq $remote_addr);
    my $valid = $match;
    my $geo_trusted = $valid;
    my $locked_to_authorized_ip_address = $valid;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    my $event = $valid ? $IP_IP_PARAM_EQ_REMOTE_ADDR : $IPf_IP_PARAM_EQ_REMOTE_ADDR;

    hLOG(qq{API: IP_Address[type=$type]: $event: valid=$valid ip_param=$stored_IP_address IP_stored=$stored_IP_address IP_match_IP=$match_IP_address regexp=$remote_addr lock=$locked_to_authorized_ip_address});
}

# ---------------------------------------------------------------------

=item __handle_type_3_client

This is a ODB-type client where a trusted server has supplied the
client's IP address. If the server's REMOTE_ADDR matches our regexp
then the supplied IP address in the IP URL param is geotrusted for
PDUS/ICUS testing and the request is valid.

=cut

# ---------------------------------------------------------------------
sub __handle_type_3_client {
    my $self = shift;
    my ($stored_IP_address, $match_IP_address, $IP_regexp) = @_;

    my $type = '3';

    my $match = ($match_IP_address =~ m,$IP_regexp,);
    my $valid = $match;
    my $geo_trusted = $valid;
    my $locked_to_authorized_ip_address = $valid;
    
    $self->__set_member_data($stored_IP_address, $valid, $geo_trusted, $type, $locked_to_authorized_ip_address);
    my $event = $valid ? $IP_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM : $IPf_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM;

    hLOG(qq{API: IP_Address[type=$type]: $event: valid=$valid ip_param=$stored_IP_address IP_stored=$stored_IP_address IP_match=$match_IP_address regexp=$IP_regexp lock=$locked_to_authorized_ip_address});
}

# ---------------------------------------------------------------------

=item __initialize

Tests of REMOTE_ADDR and IP address URL parameter vs IP address
regular expression if any configured for the given access key.

See ./trust for a table of trust relationships over the request types.

Grant access to PDUS/ICUS if code permits IC or if the stored IP
address if geotrusted and address is US/nonUS.

Grant access to restricted/extended (assuming code permits it) only if
locked to authorized IP address(es).

=cut

# ---------------------------------------------------------------------
sub __initialize {
    my $self = shift;
    my ($config, $dbh, $access_key, $ip_address_param) = @_;

    my $REMOTE_ADDR = $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};

    my ($code, $IP_regexp, $type) = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);

    if ($type eq 'U') { # program, no regexp. defasult authorization code=1
        $self->__handle_type_U_client($REMOTE_ADDR);
        return;
    }
    if ($type eq 'K') { # htdc, w/o higher authorization
        $self->__handle_type_K_client($ip_address_param);
        return;
    }
    if ($type eq '0') { # internal/development
        $self->__handle_type_0_client($REMOTE_ADDR, $REMOTE_ADDR, $IP_regexp);
        return;
    }
    if ($type eq '1') { # htdc, possibly with higher authorization + regexp
        $self->__handle_type_1_client($ip_address_param, $ip_address_param, $IP_regexp);
        return;
    }
    if ($type eq '2') { # qual
        $self->__handle_type_2_client($ip_address_param, $ip_address_param, $REMOTE_ADDR);
        return;
    }
    if ($type eq '3') { # ODB
        $self->__handle_type_3_client($ip_address_param, $REMOTE_ADDR, $IP_regexp);
        return;
    }

    # system fail
    hLOG(qq{API: IP_Address[type=$type]: $IPf_BAD_TYPE type=$type ip_param=$ip_address_param, REMOTE_ADDR=$REMOTE_ADDR, ipregexp=$IP_regexp: valid=0});
    die("FATAL: IP_Address system error: invalid client type=$type");
}


# ---------------------------------------------------------------------

=item address

Description

=cut

# ---------------------------------------------------------------------
sub address {
    my $self = shift;
    return $self->{storedipaddress};
}

# ---------------------------------------------------------------------

=item ip_is_valid

Description

=cut

# ---------------------------------------------------------------------
sub ip_is_valid {
    my $self = shift;
    return $self->{valid};
}


# ---------------------------------------------------------------------

=item geotrusted 

Description

=cut

# ---------------------------------------------------------------------
sub geo_trusted {
    my $self = shift;
    return $self->{geotrusted};
}


# ---------------------------------------------------------------------

=item locked

Description

=cut

# ---------------------------------------------------------------------
sub address_locked {
    my $self = shift;
    return $self->{addresslocked};
}

# ---------------------------------------------------------------------

=item client_type

Description

=cut

# ---------------------------------------------------------------------
sub client_type {
    my $self = shift;
    return $self->{type};
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
