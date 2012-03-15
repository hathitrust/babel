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
    
    $self->{_client_req_params} = [ qw(name org email) ];
    $self->{_client_opt_params} = [ qw(debug) ];
    $self->{_supported_params} = 
      [ @{ $self->{_client_req_params} }, @{ $self->{_client_opt_params} } ];
}

sub get_client_supported_params {
    my $self = shift;
    return $self->{_supported_params};
}

sub get_client_req_params {
    my $self = shift;
    return $self->{_client_req_params};
}

sub get_client_opt_params {
    my $self = shift;
    return $self->{_client_opt_params};
}

# ---------------------------------------------------------------------

=item RequestHandler

Default handler. Present key request form. Server forces public https
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
    my $client_data = KGS_Utils::make_client_data($Q, $self->get_client_supported_params);
    
    my ($valid, $errors);
    $self->header_type('header');
    
    # do server-side backup of javascript form validation
    ($valid, $errors) = KGS_Validate::validate_form_params($C, $client_data, $self->get_client_req_params);
    if (! $valid) {
        return KGS_Pages::get_missing_params_page($C, $errors);
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
    
    KGS_Db::insert_client_data($C, $dbh, $client_data, $access_key, $secret_key);
    
    my $confirm_link = __get_confirm_link($C);
    my $request_method = REQUEST_METHOD;
    my $signed_url = HOAuth::Signature::S_get_signed_request_URL($confirm_link, $key_pair, $request_method, $client_data);
    
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
    
    my $access_key = $Q->param('oauth_consumer_key');
    
    my $client_data = KGS_Utils::remake_client_data($C, $Q, $dbh, $access_key, $self->get_client_opt_params);
    my $secret_key = KGS_Db::get_secret_by_access_key($C, $dbh, $access_key);
    my $key_pair = HOAuth::Keys::make_key_pair_from($access_key, $secret_key);
    
    # validate signature before we can test the other parameters for validity
    my $signed_url = $Q->self_url;
    LOG($C, qq{ConfirmHandler: url=$signed_url});
    
    ($valid, $errors) = HOAuth::Signature::S_validate($signed_url, $key_pair, REQUEST_METHOD, $client_data);
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
    KGS_Db::activate_client_access_key($C, $dbh, $access_key);
    
    return KGS_Pages::get_confirmation_page($C, $dbh, $key_pair, $client_data);
}

# ---------------------------------------------------------------------

=item __email_confirmation_link

Description

=cut

# ---------------------------------------------------------------------
sub __email_confirmation_link {
    my ($C, $dbh, $cgi, $client_data, $confirm_link) = @_;

    my $s;
    my $config = $C->get_object('MdpConfig');
    
    my $from_addr = $config->get('confirm_from_address');
    my $subject = $config->get('confirm_email_subj_line');
    
    my $template_name = $config->get('confirm_email_template');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $template_name);
    
    $$page_ref =~ s,___CONFIRM_LINK___,$confirm_link,;
    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$client_data->{email},g;
    
    my $timestamp = $cgi->param('oauth_timestamp');
    my $expires = Utils::Time::iso_Time('datetime', $timestamp);
    $$page_ref =~ s,___URL_EXPIRE_DATE___,$expires,g;
    
    my $max_1 = KGS_Validate::MAX_ATTEMPTED_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ATTEMPTED_REGISTRATIONS___,$max_1,g;
    my $max_2 = KGS_Validate::MAX_ACTIVE_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ACTIVE_REGISTRATIONS___,$max_2,g;
    
    my $email = $client_data->{email};
    my $registrations = KGS_Db::count_client_registrations($C, $dbh, $email, 0);
    $$page_ref =~ s,___ACTUAL_REGRISTRATIONS___,$registrations,g;
    $s = KGS_Utils::pluralize('request', $registrations);
    $$page_ref =~ s,___UREQ___,$s,g;

    my $confirmations = KGS_Db::count_client_registrations($C, $dbh, $email, 1);
    $$page_ref =~ s,___ACTUAL_CONFIRMATIONS___,$confirmations,g;
    $s = KGS_Utils::pluralize('request', $confirmations);
    $$page_ref =~ s,___CREQ___,$s,g;

    KGS_Utils::email_something($C, $client_data->{email}, $from_addr, $subject, $page_ref);
}


# ---------------------------------------------------------------------

=item __get_confirm_link

Description

=cut

# ---------------------------------------------------------------------
sub __get_confirm_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');
    
    my $endpoint = KGS_Utils::get_endpoint($C);
    my $request_uri = $config->get('kgs_request_uri');
    my $pathinfo = $config->get('kgs_confirm_link_pathinfo');
    
    my $url = 'http://' . $endpoint . $request_uri . $pathinfo;
    
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
