package API::HTD::IP_Address;

=head1 NAME

API::HTD::IP_Address

=head1 DESCRIPTION

This singleton class provides the logic to determine the IP address of
an API request.

An IP address asserted by a client as a URL parameter is authorized if
the client access_key is trusted (access_key is in htd_authorization
and code > 1) and the asserted ip address matches the origin ip
address (Qual case) or, failing that matches the IP address configured
for that access_key in our authorization tables (Data API web client
case).

=head1 SYNOPSIS

 API::HTD::IP_Address->new($config, $dbh, $access_key, $ip_address_param);

 later:

 my $ipo = new API::HTD::IP_Address();

 my $ip_address_is_valid  = $ipo->ip_is_valid();
 my $ip_address_match_result = $ipo->ip_match();

 LOG("IP match=$ip_address_match_result");

 if ($ip_address_is_valid) {
   $authorized = 1;
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

Tests of REMOTE_ADDR and IP address URL parameter vs IP address
regular expression configured for the given access key.

  [t-lP+lC]   (t)rusted -(l)ocked (P)roxy for +(l)ocked (C)lient

             Security: Known authenticated user at known fixed desktop IP.

             This is the htdc app (the trusted proxy) acting as a
             proxy for a web browser locked to an IP address (the
             fixed client).

             The access key is that of an authenticated user of
             htdc. The IP address is that of the users desktop browser
             (fixed client) which must match the stored regexp.

  [t+lPuC]   (t)rusted +(l)ocked (P)roxy (u)nknown (C)lient 

             [WEAK, can't test geo location] !! REMOVED !!

             Security: Contractual app from known fixed IP for unknown
             client IP addresses.

             This is the Expressnet On Demand Book (ODB) app (the
             trusted fixed client) acting as a proxy for Espresso Book
             Machine (EBM) clients.

             The access key is that of the ODB app. The IP address is
             that of the ODB app which must match the stored regexp.

             NOTE: This is a weak form of trust. We do not know the
             proxied EBM IP addresses to test it for US origin for
             PDUS materials for authorization code(s) that limit to
             PD. This gives rise to the next case.

  [t+lPaC]   (t)rusted +(l)ocked (P)roxy (a)sserted (C)lient

             Security: Contractual app from known fixed IP for
             asserted client IP addresses.

             This is the Expressnet On Demand Book (ODB) app (the
             trusted fixed client) acting as a proxy for Espresso Book
             Machine (EBM) clients, supplying EBM IP address in URL.

             The access key is that of the ODB app. The IP address is
             that of the ODB app which must match the stored
             regexp. The URL parameter is the IP address of the EBM.

 [v+laCt-lP]  (v)ariable +(l)ocked (C)lient (a)sserted by (t)rusted -(l)ocked(P)roxy

             Security: trusted app transfers signed URL to clients it has IP addresses for.

             This is the qual app which signs a URL containing the IP
             address of a client /it/ knows and sends it to that
             client who originates the request. Originating
             REMOTE_ADDR must match the secure IP address parameter.

             The access key is that of the qual (signing) app. The IP
             address is that of the variable known (to qual) app
             supplied in teh URL and which must match the REMOTE_ADDR
             of the request.

    [-tC]    -(t)rusted (C)lient

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
    my $trusted_client = ($code > 1); # i.e. configured in the htd_authorization table

    # unTrusted client
    if (! $trusted_client) {
        my $s = ($ip_address_param ? 'ignored' : 'notsupplied');
        $self->__set_member_data($REMOTE_ADDR, 1, IP_NOTREQD);
        hLOG(qq{API: IP_Address[-tC]: ip param not required: valid=1 ip param=$s REMOTE_ADDR=$REMOTE_ADDR});
        return;
    }

    # Trusted client tests
    if ($ipregexp) {
        if ($ip_address_param) {
            # trusted unlocked Proxy for a authenticated Client locked to fixed IP address (HT web client)
            if ($ip_address_param =~ m,$ipregexp,) {
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG(qq{API: IP_Address[t-lP+lC]: ip param=$ip_address_param matches ipregexp=$ipregexp, REMOTE_ADDR=$REMOTE_ADDR: valid=1});
            }
            elsif ($REMOTE_ADDR =~  m,$ipregexp,) {
                # trusted Proxy locked to its REMOTE_ADDR and asserting Client IP address URL param
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG(qq{API: IP_Address[t+lPaC]: REMOTE_ADDR=$REMOTE_ADDR matches ipregexp=$ipregexp, ip param=$ip_address_param: valid=1});
            }
            else {
                # fail
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG(qq{API: IP_Address[t-lP+lC]|[t+lPaC]: NO match: ip param=$ip_address_param, REMOTE_ADDR=$REMOTE_ADDR, ipregexp=$ipregexp: valid=0});
            }
        }
    }
    else {
        # No ipregexp to test against.
        if ($ip_address_param) {
            if ($ip_address_param eq $REMOTE_ADDR) {
                # variable locked Client IP address asserted by trusted unlocked Proxy. (Qual)
                $self->__set_member_data($ip_address_param, 1, IP_MATCH);
                hLOG(qq{API: IP_Address[v+laCt-lP]: ip param=$ip_address_param matches REMOTE_ADDR=$REMOTE_ADDR: valid=1});
            }
            else {
                # fail
                $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
                hLOG(qq{API: IP_Address[v+laCt-lP]: ip param=$ip_address_param NO match REMOTE_ADDR=$REMOTE_ADDR: valid=0});
            }
        }
        else {
            # fail: trusted but missing ip_param to test vs. REMOTE_ADDR
            $self->__set_member_data($REMOTE_ADDR, 0, IP_NOMATCH);
            hLOG(qq{API: IP_Address[v+laCt-lP]: ip param missing, ipregexp=NULL, REMOTE_ADDR=$REMOTE_ADDR: valid=0});
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
