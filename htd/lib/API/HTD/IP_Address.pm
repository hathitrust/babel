package API::HTD::IP_Address;

=head1 NAME

API::HTD::IP_Address

=head1 DESCRIPTION

This singleton class provides the logic to determine the IP address of
an API request.

An IP address asserted by a client as a URL parameter is trusted if
the client access_key is trusted (access_key is in htd_authorization).

=head1 SYNOPSIS

 API::HTD::IP_Address->new($config, $dbh, $access_key, $ip_address_param);

 later:

 my $ipo = new API::HTD::IP_Address();

 my $ip_address_is_valid  = $ipo->ip_is_valid();

 if ($ip_address_is_valid) {
   $authorized = 1;
 else {
   $authorized = 0;
 }


=head1 METHODS

=over 8

=cut


use API::HTD::HConf;
use API::HTD_Log;
use API::HTD::AuthDb;

my $singleton;

sub new {
    if ( defined($singleton) ) {
        shift;
        die "attempt to redefine API::HTD::IP_Address" if (scalar(@_));
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

=item __initialize

Tests of REMOTE_ADDR and IP address URL parameter vs IP address
regular expression configured for the given access key.

Clients are trusted if they are in htd_authorization table. There are
3 trusted proxy-like clients and one non-proxy-like client type (which
is not required to supply an IP param).

A trusted client is trusted to supply a correct IP address parameter
if required.

Untrusted clients have default authorization (code=1) and are
restricted to PD in downstream checks.

If client is restricted to "open" data types and wants to request
PDUS/ICUS it must become trusted (authorized) by agreement with
HathiTrust, be added (with code=1) to the authorization table and
become a type 0 client or, if proxying, supply its client's IP address
in the URL making it a Type 3 client.

           Example   IP_regexp   IP_param   Lock                      Stored

 [Type 1] (htdc)        Y           Y       IP_param =~ IP_regexp     IP_param

 [Type 2] (qual)        N           Y       REMOTE_ADDR == IP_param   IP_param

 [Type 3] (ODB)         Y           Y       REMOTE_ADDR =~ IP_regexp  IP_param 

 [Type 0] ()            Y           N       REMOTE_ADDR =~ IP_regexp  REMOTE_ADDR

 [Type U] (untrusted)   N           N       none                      REMOTE_ADDR

=cut

# ---------------------------------------------------------------------
 my $IP_REMOTE_ADDR_NO_TRUST                = 'ip_remote_addr_no_trust';

 my $IP_REMOTE_ADDR_MATCH_REGEXP            = 'ip_remote_addr_match_regexp';
 my $IPF_REMOTE_ADDR_MATCH_REGEXP           = 'ip_remote_addr_NO_match_regexp';

 my $IP_IP_PARAM_MATCH_REGEXP               = 'ip_ip_param_match_regexp';
 my $IPf_IP_PARAM_MATCH_REGEXP              = 'ip_ip_param_NO_match_regexp';

my $IP_IP_PARAM_EQ_REMOTE_ADDR              = 'ip_ip_param_eq_remote_addr';
my $IPf_IP_PARAM_EQ_REMOTE_ADDR             = 'ip_ip_param_NO_eq_remote_addr';

my $IP_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM  = 'ip_remote_addr_match_regexp_w_ip_param';
my $IPf_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM = 'ip_remote_addr_NO_match_regexp_w_ip_param';

 my $IPf_BAD_TYPE                           = 'ip_bad_type';
 my $IPf_BAD_IP_PARAM                       = 'ip_bad_ip_param';

sub __set_member_data {
    my $self = shift;   
    ( $self->{ip}, $self->{valid}, $self->{trusted}, $self->{type} ) = @_;
}

sub __initialize {
    my $self = shift;
    my ($config, $dbh, $access_key, $ip_address_param) = @_;

    my $REMOTE_ADDR = $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};

    my ($code, $ipregexp, $trusted, $type) = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);

    if ($type eq 'U') { # untrusted client
        $self->__set_member_data($REMOTE_ADDR, 1, $trusted, $type);
        hLOG(qq{API: IP_Address[type=$type]: $IP_REMOTE_ADDR_NO_TRUST: valid=1 ip param=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
    }
    elsif ($type eq '0') { # trusted client, no IP param required
        if ($REMOTE_ADDR =~ m,$ipregexp,) {
            $self->__set_member_data($REMOTE_ADDR, 1, $trusted, $type);
            hLOG(qq{API: IP_Address[type=$type]: $IP_REMOTE_ADDR_MATCH_REGEXP REMOTE_ADDR=$REMOTE_ADDR ipregexp=$ipregexp: valid=1});
        } 
        else { # fail
            $self->__set_member_data($REMOTE_ADDR, 0, $trusted, $type);
            hLOG(qq{API: IP_Address[type=$type]: $IPf_REMOTE_ADDR_MATCH_REGEXP REMOTE_ADDR=$REMOTE_ADDR ipregexp=$ipregexp: valid=0});
        }
    }
    elsif (API::Utils::valid_IP_address($ip_address_param)) { # valid IP param required
        if ($type eq '1') { # trusted (htdc)
            if ($ip_address_param =~ m,$ipregexp,) {
                $self->__set_member_data($ip_address_param, 1, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IP_IP_PARAM_MATCH_REGEXP ip_param=$ip_address_param ipregexp=$ipregexp, REMOTE_ADDR=$REMOTE_ADDR: valid=1});
            }
            else { # fail
                $self->__set_member_data($REMOTE_ADDR, 0, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IPf_IP_PARAM_MATCH_REGEXP ip_param=$ip_address_param ipregexp=$ipregexp, REMOTE_ADDR=$REMOTE_ADDR: valid=0});
            }
        }
        elsif ($type eq '2') { # trusted (qual)
            if ($ip_address_param eq $REMOTE_ADDR) {
                $self->__set_member_data($ip_address_param, 1, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IP_IP_PARAM_EQ_REMOTE_ADDR ip_param=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR: valid=1});
            }
            else { # fail
                $self->__set_member_data($REMOTE_ADDR, 0, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IPf_IP_PARAM_EQ_REMOTE_ADDR ip_param=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR: valid=0});

            }
        }
        elsif ($type eq '3') { # trusted (ODB) 
            if ($REMOTE_ADDR =~ m,$ipregexp,) {
                $self->__set_member_data($ip_address_param, 1, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IP_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM $REMOTE_ADDR ipregexp=$ipregexp ip_param=$ip_address_param: valid=1});
            }
            else { # fail
                $self->__set_member_data($REMOTE_ADDR, 0, $trusted, $type);
                hLOG(qq{API: IP_Address[type=$type]: $IPf_REMOTE_ADDR_MATCH_REGEXP_W_IP_PARAM $REMOTE_ADDR ipregexp=$ipregexp ip_param=$ip_address_param: valid=0});
            }
        }
        else { # system fail
            hLOG(qq{API: IP_Address[type=$type]: $IPf_BAD_TYPE type=$type ip param=$ip_address_param, REMOTE_ADDR=$REMOTE_ADDR, ipregexp=$ipregexp: valid=0});
            die("IP_Address system error: invalid client type=$type ");
        }
    }
    else { # fail
        $self->__set_member_data($REMOTE_ADDR, 0, $trusted, $type);
        hLOG(qq{API: IP_Address[type=$type]: $IPf_BAD_IP_PARAM ip_param=$ip_address_param, REMOTE_ADDR=$REMOTE_ADDR, ipregexp=$ipregexp: valid=0});
    }
}


# ---------------------------------------------------------------------

=item address

Description

=cut

# ---------------------------------------------------------------------
sub address {
    my $self = shift;
    return $self->{ip};
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

=item trusted

Description

=cut

# ---------------------------------------------------------------------
sub trusted {
    my $self = shift;
    return $self->{trusted};
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
