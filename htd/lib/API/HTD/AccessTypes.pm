package API::HTD::AccessTypes;

=head1 NAME

API::HTD::AccessTypes

=head1 DESCRIPTION

This class encapsulates Data API access type determination.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(Class::ErrorHandler);

use RightsGlobals;

use API::HTD_Log;
use API::HTD::Rights;
use API::HTD::HConf;
use API::HTD::IP_Address;


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
    
    $self->{_rights} = $args->{_rights};
    $self->{_config} = $args->{_config};
    $self->{_dbh}    = $args->{_dbh};
}


# =====================================================================
#  Accessors
# =====================================================================

sub __getRightsObject {
    my $self = shift;
    return $self->{_rights};
}

sub __getConfObject {
    my $self = shift;
    return $self->{_config};
}

sub __get_DBH {
    my $self = shift;
    return $self->{_dbh};
}

sub __getConfigVal {
    my $self = shift;
    return $self->__getConfObject()->getConfigVal(@_);
}


# =====================================================================
#  Public Methods
# =====================================================================

# ---------------------------------------------------------------------

=item getInCopyrightStatus

Description

=cut

# ---------------------------------------------------------------------
sub getInCopyrightStatus {
    my $self = shift;
    
    # pessimistic
    my $in_copyright = 1;
    my $ro = $self->__getRightsObject();
    my $attribute = $ro->getRightsFieldVal('attr');    
    my $rights = $self->__getConfigVal('rights_name_map', $attribute);

    if ($rights eq 'pdus') {
        $in_copyright = 0 if ($self->__geo_location_is('US'))
    }
    elsif ($rights eq 'icus') {
        $in_copyright = 0 if ($self->__geo_location_is('NONUS'))
    }
    else {
        my @freely_available = (
                                @RightsGlobals::g_creative_commons_attribute_values, 
                                @RightsGlobals::g_public_domain_world_attribute_values,
                               );
        $in_copyright = (! grep(/^$attribute$/, @freely_available));        
    }

    return ($in_copyright, $attribute);
}


# ---------------------------------------------------------------------

=item getAccessType

Description

=cut

# ---------------------------------------------------------------------
sub getAccessType {
    my $self = shift;
    my $resource = shift;

    my $ro = $self->__getRightsObject();

    my $source = $self->__getConfigVal('sources_name_map', $ro->getRightsFieldVal('source'));
    my $rights = $self->__getConfigVal('rights_name_map', $ro->getRightsFieldVal('attr'));

    my $freedom = $self->__getFreedomVal($rights);
    my $accessType = 
      ($freedom =~ m,forbidden,) 
        ? $freedom
          : $self->__getConfigVal('accessibility_matrix', $resource, $freedom, $source);

    # Pending
    if (0) {
        if ($accessType eq 'open_restricted') {
            my $ccNamesRef  = $self->__getConfigVal('creative_commons_names');
            if (grep(/^$rights$/, @$ccNamesRef)) {
                $accessType = 'open';
            }
        }
    }

    return $accessType;
}

# ---------------------------------------------------------------------

=item getExtendedAccessType

Highly specific for EBM PDF and un-watermarked derivatives and
raw_archival_data with CC licenses

=cut

# ---------------------------------------------------------------------
sub getExtendedAccessType {
    my $self = shift;
    my ($resource, $accessType, $Q) = @_;

    # undef except in specific circumstances
    my $extended_accessType;

    my $format = $Q->param('format');

    if ( ($resource eq 'pageimage') && grep(/^$format$/, qw(png jpeg optimalderivative)) ) {
        my $watermark = $Q->param('watermark');
        if (defined $watermark && ($watermark == 0)) {
            $extended_accessType = 'unwatermarked_derivative';
        }
    }
    elsif ( ($resource eq 'pageimage') && ($format eq 'raw') ) {
        # default open pageimage is watermarked derivative else
        # requires allow_raw bit set
        $extended_accessType = 'raw_archival_data';
    }
    elsif ($resource eq 'pdf') {
        # parameter validation forces pdf to have format=ebm, requires
        # bit set
        $extended_accessType = 'pdf_ebm';
    }

    return $extended_accessType;
}

# =====================================================================
#  Private Methods
# =====================================================================

# ---------------------------------------------------------------------

=item __geo_location_is

Description

=cut

# ---------------------------------------------------------------------
sub __geo_location_is {
    my $self = shift;
    my $required_location = shift;

    my $is = 1;
    
    # This will be the UA IP address seen in HTTP_X_FORWARDED_FOR or
    # REMOTE_USER by (our) trusted client and passed as a URL
    # parameter or else simply HTTP_X_FORWARDED_FOR or REMOTE_USER of
    # a untrusted client itself.  The best we can do to limit pdus(icus) to
    # US(NONUS) users is the geoIP and blacklist tests on these addresses.
    my $IPADDR = API::HTD::IP_Address->new->address;

    require "Geo/IP.pm";
    my $geoIP = Geo::IP->new();
    my $country_code = $geoIP->country_code_by_addr($IPADDR);

    my $correct_location = 0;
    if ($required_location eq 'US') { 
        $correct_location = (grep(/$country_code/, @RightsGlobals::g_pdus_country_codes));
    }
    elsif ($required_location eq 'NONUS') {
        $correct_location = (! grep(/$country_code/, @RightsGlobals::g_pdus_country_codes));
    }
    else {
        die qq{Invalid required_location value="$required_location"};
    }

    if ($correct_location) {
        # veryify this is not a blacklisted US(NONUS) proxy that does not set
        # HTTP_X_FORWARDED_FOR for a non-US(US) request
        require "Access/Proxy.pm";
        my $dbh = $self->__get_DBH;

        if (Access::Proxy::blacklisted($dbh, $IPADDR, $ENV{SERVER_ADDR}, $ENV{SERVER_PORT})) {
            $is = 0;
        }
        else {
            $is = 1;
        }
    }
    else {
        $is = 0;
    }

    return $is;
}



# ---------------------------------------------------------------------

=item __getFreedomVal

Attempt to determine freedom based on IPADDR.  However, we can't trust
remote address due to proxying so test mdp.proxies for IPADDR.

=cut

# ---------------------------------------------------------------------
sub __getFreedomVal {
    my $self = shift;
    my $rights = shift;

    my $openAccessNamesRef  = $self->__getConfigVal('open_access_names');
    my $freedom = grep(/^$rights$/, @$openAccessNamesRef) ? 'free' : 'nonfree';

    if (($freedom eq 'nonfree') && ($rights eq 'nobody')) {
        $freedom = 'restricted_forbidden';
    }
    elsif ($freedom eq 'free') {
        if ($rights eq 'pdus') {
            $freedom = 'nonfree' if (! $self->__geo_location_is('US'));
        }
        elsif ($rights eq 'icus') {
            $freedom = 'nonfree' if (! $self->__geo_location_is('NONUS'));
        }
    }

    return $freedom;
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
