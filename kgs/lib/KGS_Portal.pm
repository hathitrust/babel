package KGS_Portal;

=head1 NAME

KGS_Portal

=head1 DESCRIPTION

This package provides the handlers for the HathiTrust Key Generation Service Portal page.

=head1 SYNOPSIS

=head1 METHODS

=over 8

=cut

use strict;

use CGI;
use URI;

use base qw(CGI::Application);
use CGI::Application::Plugin::Routes;

use Context;
use Utils;
use MdpConfig;

use KGS_Utils;
use KGS_Pages;
use KGS_Log;


# ---------------------------------------------------------------------

=item setup

Description

=cut

# ---------------------------------------------------------------------
sub setup {
    my $self = shift;
    
    my @routes =
      (
       '/'         => 'PortalHandler',
      );
    
    $self->query->charset('UTF-8');
    
    $self->routes([@routes]);
    $self->start_mode('PortalHandler');    
}
    
# ---------------------------------------------------------------------

=item PortalHandler

Present portal.

=cut

# ---------------------------------------------------------------------
sub PortalHandler {
    my $self = shift;
    my $C = $self->param('_context');
    
    my $config = $C->get_object('MdpConfig');
    $self->header_type('header');
    
    LOG($C, qq{*** PortalHandler});
    return KGS_Pages::get_portal_page($C);
}

# ---------------------------------------------------------------------

=item get_kgs_link

Description

=cut

# ---------------------------------------------------------------------
sub get_kgs_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');    
    my $pathinfo = $config->get('kgs_request_pathinfo');
    my $url = 'http://' . $ENV{HTTP_HOST} . $pathinfo;
    
    return $url;
}


# ---------------------------------------------------------------------

=item get_portal_wayf_link

Description

=cut

# ---------------------------------------------------------------------
sub get_portal_wayf_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');
    my $uri = $config->get('portal_wayf_uri');
    my $target = __get_wayf_target_link_urlencoded($C);
    
    my $url = 'http://' . $ENV{HTTP_HOST} . $uri . '?target=' . $target;
    
    return KGS_Utils::adjust_url($url);
}

# ---------------------------------------------------------------------

=item get_portal_link

Description

=cut

# ---------------------------------------------------------------------
sub get_portal_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');
    my $uri = $config->get('kgs_portal_uri');
    my $url = 'http://' . $ENV{HTTP_HOST} . $uri;
    
    return $url;
}

# ---------------------------------------------------------------------

=item __get_wayf_target_link_urlencoded

Description

=cut

# ---------------------------------------------------------------------
sub __get_wayf_target_link_urlencoded {
    my $C = shift;

    my $config = $C->get_object('MdpConfig');
    my $uri = $config->get('kgs_auth_confirm_uri');
    
    # coming back from wayf user will be authenticated so be over
    # https. wayf know how user authenticated and will adjust /cgi to
    # /shcgi in target before it redirects
    my $url = 'https://' . $ENV{HTTP_HOST} . $uri;
    
    return CGI::escape($url);
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
