package API::HTD::AccessTypes;

=head1 NAME

API::HTD::AccessTypes

=head1 DESCRIPTION

This class encapsulates Data API access type determination. An access
type is a combination of

 basic_access [free|nonfree|noaccess]

  and

 extended_access [zip, unwatermarked_derivatives, pdf_ebm, raw_archival_data, non_free, noaccess]

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

    $self->{_params_ref} = $args->{_params_ref};
    $self->{_dbh}    = $args->{_dbh};

    $self->{_config} = new API::HTD::HConf;
}


# =====================================================================
#  Accessors
# =====================================================================

sub __getParamsRef {
    my $self = shift;
    return $self->{_params_ref};
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

=item getAccessType

access_type is a combination of basic_access and extended_access

=cut

# ---------------------------------------------------------------------
sub getAccessType {
    my $self = shift;
    my ($resource, $Q) = @_;

    my $basic_access = $self->__getBasicAccess($resource);
    my $extended_access = $self->__getExtendedAccess($resource, $Q);

    my $access_type = $basic_access;

    if (defined $extended_access) {
        $access_type .= "-$extended_access";
    }

    return $access_type;
}

# ---------------------------------------------------------------------

=item getInCopyrightStatus

Description

=cut

# ---------------------------------------------------------------------
sub getInCopyrightStatus {
    my $self = shift;

    my $in_copyright = 0;

    my $attribute = $self->__getParamsRef->{attr};
    my $rights = $self->__getConfigVal('rights_name_map', $attribute);

    if ($rights eq 'pdus') {
        $in_copyright = 1 if (! $self->__geo_location_is('US'));
    }
    elsif ($rights eq 'icus') {
        $in_copyright = 1 if (! $self->__geo_location_is('NONUS'));
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

=item getAccessTypeRestriction

Boil basic_access+extended_access down to open|restricted

=cut

# ---------------------------------------------------------------------
sub getAccessTypeRestriction {
    my $self = shift;
    my $access_type = shift;

    # Is access_type unencumbered by any extended_access bits?
    if ( $access_type eq 'free') {
        return 'open';
    }

    return 'restricted'
}


# =====================================================================
#  Private Methods
# =====================================================================


# ---------------------------------------------------------------------

=item __getBasicAccess

basic_access = ( free, nonfree, noaccess )

Attempt to determine basic_access based on IPADDR.  However, we can't trust
some addresses due to proxying so test proxies table for IPADDR.

If the supplied IP address can be geotrusted test it for PDUS/ICUS.
If the supplied IP address cannot be geotrusted freedom becomes
'nonfree' if PDUS/ICUS.

If the client code permits IC we permit PDUS/ICUS.

For a resource with resource_type=metadata there are no restrictions.

=cut

# ---------------------------------------------------------------------
sub __getBasicAccess {
    my $self = shift;
    my $resource = shift;

    my $basic_access = 'basic_access_notdefined';

    my $resource_type = $self->__getConfigVal('resources', $resource, 'resource_type');
    if ($resource_type eq 'metadata') {
        # metadata resources are not restricted
        $basic_access = 'free';
    }
    else {
        # data resources are subject to restrictions
        my $rights_name = $self->__getConfigVal('rights_name_map', $self->__getParamsRef->{attr});
        my $openAccessNamesRef  = $self->__getConfigVal('open_access_rights_names');

        $basic_access = grep(/^$rights_name$/, @$openAccessNamesRef) ? 'free' : 'nonfree';

        if (($basic_access eq 'nonfree') && ($rights_name eq 'nobody')) {
            $basic_access = 'noaccess';
        }
        elsif ($basic_access eq 'free') {
            my $geo_trusted = API::HTD::IP_Address->new->geo_trusted;
            if ($geo_trusted) {
                if ($rights_name eq 'pdus') {
                    $basic_access = 'nonfree' unless ($self->__geo_location_is('US'));
                }
                elsif ($rights_name eq 'icus') {
                    $basic_access = 'nonfree' unless ($self->__geo_location_is('NONUS'));
                }
            }
            else {
                if (grep(/^$rights_name$/, ('pdus', 'icus'))) {
                    # cannot validate origin IP address so cannot test
                    $basic_access = 'nonfree';
                }
            }
        }
    }

    return $basic_access;
}


# ---------------------------------------------------------------------

=item __getExtendedAccess

Specific for defined extension bits which must be set for access to
certain resources.

The restrictions on pageimages include unwatermarked derivatives and
raw images (which do not carry watermarks).

These bits allow a resource to restricted in a finer-grained manner
for special cases regardless of basic_access.

imgsrv handles 'page+lowres' access

=cut

# ---------------------------------------------------------------------
sub __getExtendedAccess {
    my $self = shift;
    my ($resource, $Q) = @_;

    my $access_profile = $self->__getConfigVal('access_profile_name_map', $self->__getParamsRef->{access_profile});

    # undef except when restricted in specific circumstances
    my $extended_access;

    if ( ($resource eq 'volume/pageimage') ) {
        # may require unwatermarked_derivatives or raw_archival_data bit
        $extended_access = __get_pageimage_extended_access($Q);
    }
    elsif ($resource eq 'volume') {
        # parameter validation forces pdf to have format=ebm, requires
        # pdf_ebm bit set under all conditions
        $extended_access = 'pdf_ebm';
    }
    elsif ($resource eq 'aggregate') {
        # zip bit required for some access_profiles
        unless ($access_profile eq 'open') {
            $extended_access = 'zip';
        }
    }

    return $extended_access;
}


# ---------------------------------------------------------------------

=item __get_pageimage_extended_access

Certain query conditions on page images require extended_access.

This means that the downloadability in the metadata resources (whose
request URI do not have query strings) could have the value 'open' but
end up being 'restricted' when these conditions apply.

=cut

# ---------------------------------------------------------------------
sub __get_pageimage_extended_access {
    my $Q = shift;

    my $pageimage_extended_access;

    my $format = (defined $Q) ? $Q->param('format') : '';

    if ( grep(/^$format$/, qw(png jpeg optimalderivative)) ) {
        my $watermark = $Q->param('watermark');
        if (defined $watermark && ($watermark == 0)) {
            $pageimage_extended_access = 'unwatermarked_derivatives';
        }
    }
    elsif ( ($format eq 'raw') ) {
        # default open pageimage is a watermarked derivative else
        # requires raw_archival_data bit set. This doubles for
        # handling access to highres for access_profile=page+lowres
        $pageimage_extended_access = 'raw_archival_data';
    }

    return $pageimage_extended_access;
}


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
        die qq{FATAL: Invalid required_location value="$required_location"};
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


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012-14 ©, The Regents of The University of Michigan, All Rights Reserved

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
