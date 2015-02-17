package KGS_Authed;

=head1 NAME

KGS_Portal

=head1 DESCRIPTION

This package provides the handlers for the HathiTrust Key Generation Service Portal auth page.

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
use Database;
use Utils;
use MdpConfig;

use HOAuth::Keys;
use HOAuth::Signature;

use KGS_Db;
use KGS_Utils;
use KGS_Pages;
use KGS_Portal;
use KGS_Log;

use constant REQUEST_METHOD => 'GET';


# ---------------------------------------------------------------------

=item setup

Description

=cut

# ---------------------------------------------------------------------
sub setup {
    my $self = shift;
    
    my @routes =
      (
       '/'   => 'AuthHandler',
      );
    
    $self->query->charset('UTF-8');
    
    $self->routes([@routes]);
    $self->start_mode('AuthHandler');    
}


# ---------------------------------------------------------------------

=item AuthHandler

Handle return from wayf.

=cut

# ---------------------------------------------------------------------
sub AuthHandler {
    my $self = shift;
    
    my $C = $self->param('_context');
    my $config = $C->get_object('MdpConfig');
    my $dbh = $self->param('_dbh');
    
    my $Q = $self->query();
    LOG($C, qq{*** AuthHandler});
    KGS_Utils::kgs_clean_cgi($Q);    
    
    $self->header_type('header');
    
    # We have to know who the user is so we can look up the
    # access_key. If REMOTE_USER is not set, send them to the
    # wayf. They must have invoked the link to here directly.
    my $userid = Utils::Get_Remote_User();
    unless ($userid) {
        print STDERR "KGS_Authed REMOTE_USER not set\n";
        my $wayf_link = KGS_Portal::get_portal_wayf_link($C);
        print $Q->redirect($wayf_link);
        exit 0;
    }
    
    # do not record another authenticated registration if already registered
    my $already_registered = KGS_Validate::validate_auth_registration_attempts($C, $dbh, $userid);
    if ($already_registered) {
        LOG($C, qq{AuthHandler userid=$userid already registered});
        return KGS_Pages::get_auth_reply_page($C);
    }
    
    #
    # Good to go with a new registration via authentication
    #
    my $key_pair = HOAuth::Keys::make_random_key_pair();
    my $access_key = $key_pair->token;
    my $secret_key = $key_pair->secret;

    my $client_data = KGS_Utils::make_empty_client_data(KGS_Utils::get_client_supported_params, {userid => $userid});
    KGS_Db::insert_client_data($dbh, $client_data, $access_key, $secret_key);
    # Automatic activation
    KGS_Db::activate_client_access_key($dbh, $access_key);
    LOG($C, qq{AuthHandler userid=$userid access_key=$access_key activated=1});
    
    return KGS_Pages::get_auth_reply_page($C);
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
