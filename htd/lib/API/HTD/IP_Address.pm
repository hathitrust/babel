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
 
 my $ip_address_is_valid  = $ipo->ip_is_valid();
 my $ip_address_match_result = $ipo->ip_match();
 
 if ($ip_address_is_valid) {
   if ($data_is_restricted) {
     if ($ip_address_match_result == IP_MATCH) {
       $authorized = 1;
     }
     else {
       $authorized = 0;
     }
   }
   else {
     if ($ip_address_match_result == IP_MATCH || $ip_address_match_result == IP_NOTREQD) {
       $authorized = 1;
     }
     else {
       $authorized = 0;
     }
   }
 }
 else {
     $authorized = 0;
 }
 

=head1 METHODS

=over 8

=cut

use constant IP_NOMATCH => 0;
use constant IP_MATCH   => 1;
use constant IP_NOTREQD => 2;

use base qw(Exporter);
our @EXPORT = qw( IP_NOMATCH IP_MATCH IP_NOTREQD );

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

      TpFc - (T)rusted (p)roxy for (F)ixed c)lient
      TFc  - (T)rusted (F)ixed (c)lient
      TpVc - (T)rusted (p)roxy for (V)ariable c)client
      uTc  - (u)n(T)rusted (c)lient

 Access keys that have been assigned a higher authorization level are
 'trusted' in the senses below. Access keys not in the table default
 to the lowest authorization (code==1).  

=cut

# ---------------------------------------------------------------------
sub __set_member_data {
    my $self = shift;
    ( $self->{ip}, $self->{valid}, $self->{match} ) = @_;
}

sub __initialize {
    my $self = shift;
    my ($config, $dbh, $access_key, $ip_address_param) = @_;

    my $REMOTE_ADDR = $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};

    my ($code, $ipregexp) = API::HTD::AuthDb::get_privileges_by_access_key($dbh, $access_key);
    my $trusted_client = ($code > 1);

    if (! $trusted_client) {
        my $s = ($ip_address_param ? 'ignored' : 'notsupplied');
        $self->__set_member_data($REMOTE_ADDR, 1, IP_NOTREQD);
        hLOG(qq{API: IP_Address(uTc): ip param not required: valid=1 ipp=$s REMOTE_ADDR=$REMOTE_ADDR});
        return;
    }

    # Trusted client tests
    if ($ipregexp) {
        if ($ip_address_param) {
            # trusted PROXY for a client locked to fixed IP address (HT web client)
            if ($ip_address_param =~ m,$ipregexp,) {
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG(qq{API: IP_Address(TpFc): ip param matches vs allowed REMOTE_ADDR=$ipregexp: valid=1 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG(qq{API: IP_Address(TpFc): ip param NO match vs allowed REMOTE_ADDR=$ipregexp: valid=0 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
        else {
            if ($REMOTE_ADDR =~  m,$ipregexp,) {
                # trusted CLIENT locked to its REMOTE_ADDR (Expressnet)
                $self->__set_member_data($REMOTE_ADDR, 1, IP_MATCH);
                hLOG(qq{API: IP_Address(TFc): REMOTE_ADDR matches vs allowed REMOTE_ADDR=$ipregexp: valid=1 ipp=notsupplied REMOTE_ADDR=$REMOTE_ADDR});

            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG(qq{API: IP_Address(TcF):  REMOTE_ADDR NO match vs allowed REMOTE_ADDR=$ipregexp: valid=0 ipp=notsupplied REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
    }
    else {
        # trusted PROXY for variable clients who must be locked to an
        # IP via IP address parameter asserted by proxy . (Qual)
        if ($ip_address_param) {
            if ($ip_address_param eq $REMOTE_ADDR) {
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG(qq{API: IP_Address(TpVc): ip param matches vs asserted REMOTE_ADDR: valid=1 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG(qq{API: IP_Address(TpVc): ip param NO match vs asserted REMOTE_ADDR: valid=0 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
        else {
            $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
            hLOG(qq{API: IP_Address(TpVc): ip param missing: valid=0 ipp=notsupplied REMOTE_ADDR=$REMOTE_ADDR});
        }
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

=item ip_match

Description

=cut

# ---------------------------------------------------------------------
sub ip_match {
    my $self = shift;
    return $self->{match};
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
