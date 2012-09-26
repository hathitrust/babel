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

Description

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

    my $clientKeyRef  = $config->getConfigVal('client_key_authorization_list');
    my $known_client = grep(/^$access_key$/, @$clientKeyRef);

    if ($known_client) {
        my $ipregexp = API::HTD::AuthDb::get_ip_address_by_access_key($dbh, $access_key);
        if ($ipregexp) {
            # known client is locked to known IP address
            if ($ip_address_param) {
                if ($ip_address_param =~ m,$ipregexp,) {
                    $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                    hLOG_DEBUG(qq{API: IP_Address(KL client): ip param matches vs allowed REMOTE_ADDR=$ipregexp: valid=1 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
                }
                else {
                    $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                    hLOG_DEBUG(qq{API: IP_Address(KL client): ip param no match vs allowed REMOTE_ADDR=$ipregexp: valid=0 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
                }
            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG_DEBUG(qq{API: IP_Address(KL client): ip param missing for allowed REMOTE_ADDR=$ipregexp: valid=0 ipp=missing REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
        else {
            # known client is not locked to an IP but may still supply an IP address parameter
            if ($ip_address_param) {
                if ($ip_address_param eq $REMOTE_ADDR) {
                    $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                    hLOG_DEBUG(qq{API: IP_Address(KuL client): ip param matches vs REMOTE_ADDR: valid=1 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
                }
                else {
                    $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                    hLOG_DEBUG(qq{API: IP_Address(KuL client): ip param no match vs REMOTE_ADDR: valid=0 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
                }
            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 1, IP_NOTREQD);
                hLOG_DEBUG(qq{API: IP_Address(KuL client): ip param not required: valid=1 ipp=notsupplied REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
    }
    else {
        # unknown unlocked client not in list
        if ($ip_address_param) {
            if ($ip_address_param eq $REMOTE_ADDR) {
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG_DEBUG(qq{API: IP_Address(uK client): ip param matches vs REMOTE_ADDR: valid=1 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
            else {
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG_DEBUG(qq{API: IP_Address(uK client): ip param no match vs REMOTE_ADDR: valid=0 ipp=$ip_address_param REMOTE_ADDR=$REMOTE_ADDR});
            }
        }
        else {
            $self->__set_member_data($REMOTE_ADDR, 1, IP_NOTREQD);
            hLOG_DEBUG(qq{API: IP_Address(uK client): ip param not required: valid=1 ipp=notsupplied REMOTE_ADDR=$REMOTE_ADDR});
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
