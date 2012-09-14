package API::HTD::IP_Address;

=head1 NAME

API::HTD::IP_Address

=head1 DESCRIPTION

This singleton class provides the logic of determine the IP address of
an API request.

An IP address asserted by a client as a URL parameter is authorized if
the client access_key is trusted (in the whitelist) and the asserted
ip address matches the origin ip address (Qual case) or, failing that
matches the IP address configured for that access_key in our
authorization tables (Data API web client case).

=head1 SYNOPSIS

API::HTD::IP_Address->new($config, $dbh, $access_key, $ip_address_param);

later:

my $ipo = new API::HTD::IP_Address();

my $ip_address  = $ipo->address();
my $authorized = $ipo->is_authorized();

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

Description

=cut

# ---------------------------------------------------------------------
sub __set_authorized {
    my $self = shift;
    ($self->{authorized}, $self->{ip}) = @_;
}

sub __initialize {
    my $self = shift;
    my ($config, $dbh, $access_key, $ip_address_param) = @_;

    my $REMOTE_ADDR = $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};

    if (! defined($ip_address_param) ) {
        $self->__set_authorized(0, $REMOTE_ADDR);
        hLOG_DEBUG(qq{API::HTD::IP_Address: no ip param: authorized=0 ip=$REMOTE_ADDR});
        return;
    }
    # POSSIBLY NOTREACHED

    #
    # Tests for validity of $ip_address_param
    #
    my $clientKeyWhitelistRef  = $config->getConfigVal('client_key_whitelist');
    
    if ( grep(/^$access_key$/, @$clientKeyWhitelistRef) ) {
        # We have an access_key from a trusted client ...
        if ($ip_address_param eq $REMOTE_ADDR) {
            # ... proxying a client at an endpoint IP matching the IP
            # address asserted by the trusted client
            $self->__set_authorized(1, $ip_address_param);
            hLOG_DEBUG(qq{API::HTD::IP_Address: ip param matches REMOTE_ADDR: authorized=1 ip=$ip_address_param});
        }
        else {
            my $ipregexp = API::HTD::AuthDb::get_ip_address_by_access_key($dbh, $access_key);
            if ($ip_address_param =~ m,$ipregexp,) {
                # ... proxying a user agent client at an endpoint IP
                # matching the configured authorized IP address
                $self->__set_authorized(1, $ip_address_param);
                hLOG_DEBUG(qq{API::HTD::IP_Address: ip param matches allowed REMOTE_ADDR: authorized=1 ip=$ip_address_param});
            }
            else {
                # ... but IP of proxied user agent client not
                # configured as authorized
                $self->__set_authorized(0, $ip_address_param);
                hLOG_DEBUG(qq{API::HTD::IP_Address: ip param no match allowed REMOTE_ADDR: authorized=0 ip=$ip_address_param});
            }
        }
    }
    else {
        $self->__set_authorized(0, $REMOTE_ADDR);
        hLOG_DEBUG(qq{API::HTD::IP_Address: ip param ignored, untrusted client: authorized=0 ip=$REMOTE_ADDR});
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

=item is_authorized

Description

=cut

# ---------------------------------------------------------------------
sub is_authorized {
    my $self = shift;
    return $self->{authorized};
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
