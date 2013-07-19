package KGS_Pages;

=head1 NAME

KGS_Pages

=head1 DESCRIPTION

This package provides the code to build various KGS pages.

=head1 SYNOPSIS

=head1 METHODS

=over 8

=cut

use strict;

use CGI;

use Context;
use Database;
use Utils;
use Utils::Time;
use MdpConfig;

use HOAuth::Keys;
use HOAuth::Signature;
use KGS;
use KGS_Db;
use KGS_Utils;
use KGS_Validate;

# ---------------------------------------------------------------------

=item get_portal_page

Description

=cut

# ---------------------------------------------------------------------
sub get_portal_page {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');

    my $filename = $config->get('portal_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    my $kgs_link = KGS_Portal::get_kgs_link($C);
    $$page_ref =~ s,___KGS___,$kgs_link,g;

    my $wayf_link = KGS_Portal::get_portal_wayf_link($C);
    $$page_ref =~ s,___WAYF___,$wayf_link,g;

    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_request_page

Description

=cut

# ---------------------------------------------------------------------
sub get_request_page {
    my ($C, $Q) = @_;
    
    my $config = $C->get_object('MdpConfig');

    my $filename = $config->get('request_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    my $debug = $Q->param('debug');
    $$page_ref =~ s,___DEBUG___,$debug,g;

    ___subst_max_request_snippet($page_ref);
    
    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_email_page

Description

=cut

# ---------------------------------------------------------------------
sub get_email_page {
    my ($C, $dbh, $cgi, $to_addr, $confirm_link) = @_;

    my $s;    
    my $template_name = $C->get_object('MdpConfig')->get('confirm_email_template');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $template_name);
    
    $$page_ref =~ s,___CONFIRM_LINK___,$confirm_link,;
    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$to_addr,g;
    
    my $timestamp = $cgi->param('oauth_timestamp');
    my $expires = Utils::Time::iso_Time('zdatetime', $timestamp);
    $$page_ref =~ s,___URL_EXPIRE_DATE___,$expires,g;
    
    ___subst_max_request_snippet($page_ref);
        
    my $registrations = KGS_Db::count_client_registrations($dbh, $to_addr, 0);
    $$page_ref =~ s,___ACTUAL_REGRISTRATIONS___,$registrations,g;
    $s = KGS_Utils::pluralize('request', $registrations);
    $$page_ref =~ s,___UREQ___,$s,g;

    my $confirmations = KGS_Db::count_client_registrations($dbh, $to_addr, 1);
    $$page_ref =~ s,___ACTUAL_CONFIRMATIONS___,$confirmations,g;
    $s = KGS_Utils::pluralize('request', $confirmations);
    $$page_ref =~ s,___CREQ___,$s,g;

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_request_reply_page

Description

=cut

# ---------------------------------------------------------------------
sub get_request_reply_page {
    my ($C, $client_data) = @_;
    
    my $config = $C->get_object('MdpConfig');
    
    my $filename = $config->get('request_reply_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    my $email = $client_data->{email};
    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$email,g;

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_auth_reply_page

Description

=cut

# ---------------------------------------------------------------------
sub get_auth_reply_page {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');
    
    my $filename = $config->get('auth_reply_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    ___insert_hathitrust_email($C, $page_ref);

    my $htdc_v2_link = KGS::get_data_api_client_link($C, 2);
    $$page_ref =~ s,___DATA_API_V2_CLIENT___,$htdc_v2_link,g;

    my $portal_link = KGS_Portal::get_portal_link($C);
    $$page_ref =~ s,___PORTAL___,$portal_link,g;

    my $request_link = KGS_Pages::get_request_link($C);
    $$page_ref =~ s,___REQUEST_URL___,$request_link,g;

    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_confirmation_page

Description

=cut

# ---------------------------------------------------------------------
sub get_confirmation_page {
    my ($C, $dbh, $key_pair, $client_data) = @_;
    
    my $s;
    my $config = $C->get_object('MdpConfig');

    my $filename = $config->get('confirm_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    my ($access_key, $secret_key) = ($key_pair->token, $key_pair->secret);

    $$page_ref =~ s,___ACCESS_KEY___,$access_key,g;
    $$page_ref =~ s,___SECRET_KEY___,$secret_key,g;

    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$client_data->{email},g;

    my $max_1 = KGS_Validate::MAX_ATTEMPTED_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ATTEMPTED_REGISTRATIONS___,$max_1,g;
    my $max_2 = KGS_Validate::MAX_ACTIVE_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ACTIVE_REGISTRATIONS___,$max_2,g;

    my $email = $client_data->{email};
    my $registrations = KGS_Db::count_client_registrations($dbh, $email, 0);
    $$page_ref =~ s,___ACTUAL_REGRISTRATIONS___,$registrations,g;
    $s = KGS_Utils::pluralize('request', $registrations);
    $$page_ref =~ s,___UREQ___,$s,g;

    my $confirmations = KGS_Db::count_client_registrations($dbh, $email, 1);
    $$page_ref =~ s,___ACTUAL_CONFIRMATIONS___,$confirmations,g;
    $s = KGS_Utils::pluralize('request', $confirmations);
    $$page_ref =~ s,___CREQ___,$s,g;

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_missing_params_page

Description

=cut

# ---------------------------------------------------------------------
sub get_missing_params_page {
    my ($C, $errors) = @_;

    my $config = $C->get_object('MdpConfig');

    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'missing_params_msg');

    my @msg_elems;
    foreach my $e (keys %$errors) {
        push(@msg_elems, $e) if ($errors->{$e});
    }

    my $msg = join(', ', @msg_elems);
    $$page_ref =~ s,___MISSING_PARAMS___,$msg,g;

    my $url = get_request_link($C);
    $$page_ref =~ s,___REQUEST_URL___,$url,g;

    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_invalid_signature_page

Description

=cut

# ---------------------------------------------------------------------
sub get_invalid_signature_page {
    my ($C, $signed_url, $errstr) = @_;

    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'invalid_signature_msg');
    
    my $uri = URI->new($signed_url);
    my $s = CGI->new($uri->query)->as_string;

    $$page_ref =~ s,___SIGNED_URL_PARAMS___,$s,g;

    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_stale_timestamp_page

Description

=cut

# ---------------------------------------------------------------------
sub get_stale_timestamp_page {
    my ($C, $cgi, $client_data) = @_;

    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'stale_timestamp_msg');
    
    my $timestamp = $cgi->param('oauth_timestamp');
    my $expired = Utils::Time::iso_Time('zdatetime', $timestamp);

    $$page_ref =~ s,___URL_EXPIRE_DATE___,$expired,g;

    return $page_ref;
}

# ---------------------------------------------------------------------

=item get_confirmation_replay_page

Description

=cut

# ---------------------------------------------------------------------
sub get_confirmation_replay_page {
    my ($C, $client_data) = @_;

    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'confirmation_replay_msg');

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_max_registrations_page

Description

=cut

# ---------------------------------------------------------------------
sub get_max_registrations_page {
    my ($C, $client_data) = @_;

    my $config = $C->get_object('MdpConfig');

    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'max_register_msg');

    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$client_data->{email},g;
    my $max = KGS_Validate::MAX_ATTEMPTED_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ATTEMPTED_REGISTRATIONS___,$max,g;

    my $url = get_request_link($C);
    $$page_ref =~ s,___REQUEST_URL___,$url,g;

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_max_confirmations_page

Description

=cut

# ---------------------------------------------------------------------
sub get_max_confirmations_page {
    my ($C, $client_data) = @_;

    my $config = $C->get_object('MdpConfig');
    my $email = $client_data->{email};
    
    my $page_ref = __get_request_fail_page($C);
    __insert_chunk($C, $page_ref, 'max_confirm_msg');

    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$email,g;
    my $max = KGS_Validate::MAX_ACTIVE_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ACTIVE_REGISTRATIONS___,$max,g;

    my $url = get_request_link($C);
    $$page_ref =~ s,___REQUEST_URL___,$url,g;

    return $page_ref;
}


# ---------------------------------------------------------------------

=item get_request_link

Description

=cut

# ---------------------------------------------------------------------
sub get_request_link {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');
    my $pathinfo = $config->get('kgs_request_pathinfo');
    
    my $url = 'http://' . $ENV{HTTP_HOST} . $pathinfo;
    
    return KGS_Utils::adjust_url($url);
}


# ---------------------------------------------------------------------

=item __get_request_fail_page

Description

=cut

# ---------------------------------------------------------------------
sub __get_request_fail_page {
    my $C = shift;
    
    my $config = $C->get_object('MdpConfig');

    my $filename = $config->get('request_fail_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    __insert_chunk($C, $page_ref, 'ga_chunk');

    return $page_ref;
}

# ---------------------------------------------------------------------

=item ___subst_max_request_snippet

Description

=cut

# ---------------------------------------------------------------------
sub ___subst_max_request_snippet {
    my $page_ref = shift;
    
    my $max_1 = KGS_Validate::MAX_ATTEMPTED_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ATTEMPTED_REGISTRATIONS___,$max_1,g;
    my $max_2 = KGS_Validate::MAX_ACTIVE_REGISTRATIONS;
    $$page_ref =~ s,___MAX_ACTIVE_REGISTRATIONS___,$max_2,g;
}

# ---------------------------------------------------------------------

=item ___insert_hathitrust_email

Description

=cut

# ---------------------------------------------------------------------
sub ___insert_hathitrust_email {
    my $C = shift;
    my $page_ref = shift;
    
    my $config = $C->get_object('MdpConfig');

    my $addr = $config->get('hathitrust_email_addr');
    $$page_ref =~ s,___HATHITRUST_EMAIL_ADDRESS___,$addr,g;
}

#
# ---------------------------------------------------------------------

=item __insert_chunk

Description

=cut

# ---------------------------------------------------------------------
sub __insert_chunk {
    my $C = shift;
    my $page_ref = shift;
    my $chunk_name = shift;

    my $config = $C->get_object('MdpConfig');

    my $pattern =  $config->get($chunk_name .'_pat');
    my $filename = $config->get($chunk_name .'_file');
    my $chunk_ref = Utils::read_file($ENV{SDRROOT} . $filename);

    $$page_ref =~ s,$pattern,$$chunk_ref,;

    ___insert_hathitrust_email($C, $page_ref);
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2011 ©, The Regents of The University of Michigan, All Rights Reserved

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
