package KGS;

=head1 NAME

KGS

=head1 DESCRIPTION

This package provides the handlers for the HathiTrust Key Generation Service.

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
       '/'         => 'RequestHandler',
       '/request'  => 'RequestHandler',
       '/register' => 'RegisterHandler',
       '/confirm'  => 'ConfirmHandler',
      );
    
    $self->query->charset('UTF-8');
    
    $self->routes([@routes]);
    $self->start_mode('RequestHandler');
}



# ---------------------------------------------------------------------

=item RequestHandler

Present key request form. Server forces public https
so form submission is protected.

=cut

# ---------------------------------------------------------------------
sub RequestHandler {
    my $self = shift;
    my $C = $self->param('_context');
    
    my $config = $C->get_object('MdpConfig');
    $self->header_type('header');
    
    LOG($C, qq{*** RequestHandler});
    return KGS_Pages::get_request_page($C, $self->query);
}

# ---------------------------------------------------------------------

=item RegisterHandler

Handle request form post data.

=cut

# ---------------------------------------------------------------------
sub RegisterHandler {
    my $self = shift;
    
    my $C = $self->param('_context');
    my $config = $C->get_object('MdpConfig');
    my $dbh = $self->param('_dbh');
    
    my $Q = $self->query();
    LOG($C, qq{*** RegisterHandler: url=} . $Q->self_url);
    KGS_Utils::kgs_clean_cgi($Q);
    
    # filter
    my $client_data = KGS_Utils::make_client_data($Q, KGS_Utils::get_client_supported_params);
    
    my ($valid, $missing, $invalid);
    $self->header_type('header');
    
    # do server-side backup of javascript form validation
    ($valid, $missing, $invalid) = 
      KGS_Validate::validate_form_params($C, $client_data, KGS_Utils::get_client_req_params);
    unless ($valid) {
        return KGS_Pages::get_missing_params_page($C, $missing, $invalid);
    }
    
    # do not allow another registration if MAX_ATTEMPTED_REGISTRATIONS have been made
    ($valid) = KGS_Validate::validate_max_registration_attempts($C, $dbh, $client_data);
    if (! $valid) {
        return KGS_Pages::get_max_registrations_page($C, $client_data);
    }
    
    #
    # Good to go
    #
    my $key_pair = HOAuth::Keys::make_random_key_pair();
    my $access_key = $key_pair->token;
    my $secret_key = $key_pair->secret;
    
    KGS_Db::insert_client_data($dbh, $client_data, $access_key, $secret_key);
    
    my $confirm_link = __get_confirm_link($C);
    my $request_method = REQUEST_METHOD;
    my $signed_url = 
      HOAuth::Signature::S_get_signed_request_URL($confirm_link, $access_key, $secret_key, $request_method, $client_data);
    
    __email_confirmation_link($C, $dbh, $Q, $client_data, $signed_url);
    LOG($C, qq{__email_confirmation_link: link=$signed_url email=} . $client_data->{email});
    
    return KGS_Pages::get_request_reply_page($C, $client_data);
}


# ---------------------------------------------------------------------

=item ConfirmHandler

Description

=cut

# ---------------------------------------------------------------------
sub ConfirmHandler {
    my $self = shift;
    
    my $C = $self->param('_context');
    my $config = $C->get_object('MdpConfig');
    my $dbh = $self->param('_dbh');
    
    my ($valid, $errors);
    $self->header_type('header');
    
    my $Q = $self->query();
    KGS_Utils::kgs_clean_cgi($Q);

    if ( $Q->request_method eq 'HEAD' ) {
        return "";
    }
    
    my $access_key = $Q->param('oauth_consumer_key');
    
    my $client_data = KGS_Utils::remake_client_data($C, $Q, $dbh, $access_key, KGS_Utils::get_client_opt_params);
    my $secret_key = KGS_Db::get_secret_by_access_key($dbh, $access_key);
    my $key_pair = HOAuth::Keys::make_key_pair_from($access_key, $secret_key);
    
    # validate signature before we can test the other parameters for validity
    my $signed_url = $Q->self_url;
    LOG($C, qq{ConfirmHandler: signed url=$signed_url});
    
    ($valid, $errors) = HOAuth::Signature::S_validate($signed_url, $access_key, $secret_key, REQUEST_METHOD, $client_data);
    LOG($C, qq{S_validate [valid=$valid] errors=$errors});
    if (! $valid) {
        return KGS_Pages::get_invalid_signature_page($C, $signed_url, $errors);
    }
    
    # do not activate more than MAX_ACTIVE_REGISTRATIONS
    ($valid) = KGS_Validate::validate_max_active_registrations($C, $dbh, $client_data);
    if (! $valid) {
        return KGS_Pages::get_max_confirmations_page($C, $client_data);
    }
    
    # do not accept a confirmation link older than LINK_LIFETIME
    ($valid) = KGS_Validate::validate_confirmation_link_timestamp($C, $Q, $client_data);
    if (! $valid) {
        return KGS_Pages::get_stale_timestamp_page($C, $Q, $client_data);
    }
    
    # do not accept a confirmation link for an already activated registration
    ($valid) = KGS_Validate::validate_confirmation_replay($C, $dbh, $key_pair);
    if (! $valid) {
        return KGS_Pages::get_confirmation_replay_page($C, $client_data);
    }
    
    #
    # Good to go
    #
    KGS_Db::activate_client_access_key($dbh, $access_key);
    
    return KGS_Pages::get_confirmation_page($C, $dbh, $key_pair, $client_data);
}

# ---------------------------------------------------------------------

=item get_data_api_client_link

Description

=cut

# ---------------------------------------------------------------------
sub get_data_api_client_link {
    my $C = shift;
    my $ver = shift;
    
    my $config = $C->get_object('MdpConfig');
    
    my $uri = $config->get('data_api_v' . $ver . '_client_uri');
    my $url = 'http://' . $ENV{HTTP_HOST} . $uri;
    
    return KGS_Utils::adjust_url($url);
}


# ---------------------------------------------------------------------

=item __email_confirmation_link

Description

=cut

# ---------------------------------------------------------------------
sub __email_confirmation_link {
    my ($C, $dbh, $cgi, $client_data, $confirm_link) = @_;

    my $config = $C->get_object('MdpConfig');
    
    my $to_addr = $client_data->{email};
    my $from_addr = $config->get('confirm_from_address');
    my $subject = $config->get('confirm_email_subj_line');

    my $page_ref = KGS_Pages::get_email_page($C, $dbh, $cgi, $to_addr, $confirm_link);

    KGS_Utils::email_something($C, $to_addr, $from_addr, $subject, $page_ref);
}


# ---------------------------------------------------------------------

=item __get_confirm_link

Description

=cut

# ---------------------------------------------------------------------
sub __get_confirm_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');    
    my $pathinfo = $config->get('kgs_confirm_link_pathinfo');
    
    my $url = 'https://' . $ENV{HTTP_HOST} . $pathinfo;
    
    return $url;
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
