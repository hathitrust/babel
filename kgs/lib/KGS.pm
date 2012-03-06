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

use Keys;
use Signature;
use KGS_Utils;

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

    # only enable test output in dev
    #push (@routes, '/test'=> 'test') if $ENV{HT_DEV};
    ## 18 March 2011: temporarily enable this everywhere
    #push (@routes, '/test'=> 'test');

    $self->query->charset('UTF-8');

    $self->routes([@routes]);
    $self->start_mode('RequestHandler');
}

# ---------------------------------------------------------------------

=item RequestHandler

Default handler. Present key request form. Force https so form
submission is protected.

=cut

# ---------------------------------------------------------------------
sub RequestHandler {
    my $self = shift;
    my $C = $self->param('_context');
    my $config = $C->get_object('MdpConfig');

    my $page_ref;
    my $protocol = $ENV{TERM} ? 'https' : $self->query()->protocol();

    if (lc($protocol) ne 'https') {
        # redirect

        my $url = $self->query()->url();
        $url =~ s,^$protocol,https,;

        $self->header_type('redirect');
        $self->header_props('url' => $url);
    }
    else {
        # serve Request page
        my $filename = $config->get('request_html_file');
        $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
        __insert_chunk($C, $page_ref, 'header_chunk');

        $self->header_type('header');
    }

    return $page_ref;
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
    
    my $q = $self->query();
    KGS_Utils::kgs_clean_cgi($q);
    
    # test validity of params server-side
    my ($name_miss, $org_miss, $email_miss);    
    my $requestor_name = $q->param('name') ;
    $name_miss = 1 if (! $requestor_name);    
    my $requestor_org = $q->param('org');
    $org_miss = 1 if (! $requestor_org);
    my $requestor_email = $q->param('email');
    $email_miss = 1 if (! $requestor_email);

    if ($name_miss || $org_miss || $email_miss) {
        my $page_ref = __handle_missing_params($C, $name_miss, $org_miss, $email_miss);
        $self->header_type('header');

        return $page_ref;
        # NOTREACHED
    }
    
    # XXX prevent resend repeat registration
#    my $client_data_ref = KGS_Db::get_client_data_by_email($dbh, $requestor_email);

    my $key_pair = Keys::get_key_pair();
    my $access_key = $key_pair->token;
    my $secret_key = $key_pair->secret;

    my $confirm_link = __get_confirm_link($C, $key_pair,
                                          {
                                           'name' => $requestor_name, 
                                           'org' => $requestor_org, 
                                           'email' => $requestor_email,
                                           });

#    my $params = $consumer->gen_auth_params($http_method, $request_url);
#     say $params->{oauth_consumer_key};
#     say $params->{oauth_timestamp};
#     say $params->{oauth_nonce};
#     say $params->{oauth_signature_method};
#     say $params->{oauth_signature};
#     say $params->{oauth_version};

    KGS_Db::insert_client_data($dbh, $requestor_name, $requestor_org, $requestor_email, 
                               $access_key, $secret_key);




    __email_confirmation_link($C, $requestor_name, $requestor_org, $requestor_email, $confirm_link);

    my $filename = $config->get('request_reply_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');
    
    $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,$requestor_email,g;

    $self->header_type('header');
    
    return $page_ref;
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

    my $page_ref;
    my $protocol = $ENV{TERM} ? 'https' : $self->query()->protocol();

    if (lc($protocol) ne 'https') {
        # redirect
        my $url = $self->query()->url();
        $url =~ s,^$protocol,https,;

        $self->header_type('redirect');
        $self->header_props('url' => $url);
    }
    else {
        # validate signature
        


        # serve Confirmation page
        my $filename = $config->get('confirm_html_file');
        $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
        __insert_chunk($C, $page_ref, 'header_chunk');

        $$page_ref =~ s,___REQUESTOR_TO_ADDRESS___,fixme,g;

        $self->header_type('header');
    }

    return $page_ref;
}

# ---------------------------------------------------------------------

=item __handle_missing_params

Description

=cut

# ---------------------------------------------------------------------
sub __handle_missing_params {
    my ($C, $name_miss, $org_miss, $email_miss) = @_;    

    my $config = $C->get_object('MdpConfig');

    my $filename = $config->get('request_fail_html_file');
    my $page_ref = Utils::read_file($ENV{SDRROOT} . $filename);
    __insert_chunk($C, $page_ref, 'header_chunk');

    __insert_chunk($C, $page_ref, 'missing_params_msg');

    my @msg_elems;
    push(@msg_elems, '<b>name</b>') if ($name_miss);
    push(@msg_elems, '<b>organization or location</b>') if ($org_miss);
    push(@msg_elems, '<b>email address</b>') if ($email_miss);

    my $msg = join(', ', @msg_elems);
    $$page_ref =~ s,___MISSING_PARAMS___,$msg,g;

    my $uri = $config->get('kgs_request_uri'); 
    my $pathinfo = $config->get('kgs_request_pathinfo');      
    my $url = 'https://' . $ENV{HTTP_HOST} . $uri . $pathinfo;
    $$page_ref =~ s,___REQUEST_URL___,$url,g;
    
    return $$page_ref;
}

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
}


# ---------------------------------------------------------------------

=item __email_confirmation_link

Description

=cut

# ---------------------------------------------------------------------
sub __email_confirmation_link {
    my ($C, $requestor_name, $requestor_org, $requestor_email, $confirm_link) = @_;

    my $config = $C->get_object('MdpConfig');

    my $from_addr = $config->get('confirm_from_address');
    my $subject = $config->get('confirm_email_subj_line');

    my $template_name = $config->get('confirm_email_template');
    my $email_template_ref = Utils::read_file($ENV{SDRROOT} . $template_name);

    $$email_template_ref =~ s,___CONFIRM_LINK___,$confirm_link,;
    $$email_template_ref =~ s,___REQUESTOR_TO_ADDRESS___,$requestor_email,g;

    KGS_Utils::email_something($C, $requestor_email, $from_addr, $subject, $email_template_ref);
}


# ---------------------------------------------------------------------

=item __get_confirm_link

Description

=cut

# ---------------------------------------------------------------------
sub __get_confirm_link {
    my ($C, $key_pair, $extra) = @_;

    my $config = $C->get_object('MdpConfig');
    
    my $request_method = 'GET';
    my $uniq = defined($ENV{HT_DEV}) ? "$ENV{HT_DEV}-full." : "";
    my $endpoint = $config->get('kgs_endpoint');
    $endpoint =~ s,___UNIQ___,$uniq,;
    my $request_uri = $config->get('kgs_request_uri');
    my $pathinfo = $config->get('kgs_confirm_link_pathinfo');

    my $uri = 'https://' . $endpoint . $request_uri . $pathinfo;

    use OAuth::Lite::Consumer;
    my $consumer = 
      OAuth::Lite::Consumer->new
          (
           consumer_key    => $key_pair->token,
           consumer_secret => $key_pair->secret,
           realm           => 'foo',
           auth_method     => OAuth::Lite::AuthMethod::URL_QUERY,
          );
    
    my $query = $consumer->gen_auth_query($request_method, $uri, $key_pair, $extra);
    my $url = $uri . '?' . $query;

    return $url;
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
