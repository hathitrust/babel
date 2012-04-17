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
        if ($self->__geo_location_is_US()) {
            $in_copyright = 0;
        }
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

=item getAccessTypeByResource

Description

=cut

# ---------------------------------------------------------------------
sub getAccessTypeByResource {
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

    return $accessType;
}

# =====================================================================
#  Private Methods
# =====================================================================

# ---------------------------------------------------------------------

=item __geo_location_is_US

Description

=cut

# ---------------------------------------------------------------------
sub __geo_location_is_US {
    my $self = shift;

    my $is_us = 1;
    
    # Limit pdus volumes to un-proxied "U.S." clients. Use forwarded
    # IP address if proxied, else UA IP addr
    my $IPADDR = $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};

    require "Geo/IP.pm";
    my $geoIP = Geo::IP->new();
    my $country_code = $geoIP->country_code_by_addr($IPADDR);
    my $pdusCountryCodesRef = $self->__getConfigVal('pdus_country_codes');

    if (! grep(/^$country_code$/, @RightsGlobals::g_pdus_country_codes)) {
        $is_us = 0;
        hLOG('API: ' . qq{non-US pdus access attempt $IPADDR});
    }
    else {
        # veryify this is not a blacklisted US proxy that does not
        # set HTTP_X_FORWARDED_FOR for a non-US request
        require "Access/Proxy.pm";
        if (Access::Proxy::blacklisted($IPADDR, $ENV{SERVER_ADDR}, $ENV{SERVER_PORT})) {
            $is_us = 0;
            hLOG('API: ' . qq{proxy blocked $IPADDR});
        }
    }

    return $is_us;
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
    elsif (($freedom eq 'free') && ($rights eq 'pdus')) {
        if (! $self->__geo_location_is_US()) {
            $freedom = 'nonfree';
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
