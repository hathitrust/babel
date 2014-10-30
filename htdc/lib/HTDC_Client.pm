package HTDC_Client;


=head1 NAME

HTDC_Client

=head1 DESCRIPTION

This class provides the common code for htdc and htdc2 and loads the
correct version of HTDC based on its instantiation args.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;
use warnings;

use CGI;

use HTTP::Request;
use LWP::UserAgent;

use Context;
use Utils;
use Debug::DUtils;

use API::DbIF;
use API::HTD_Log;


our $VERSION;
our $DEVELOPMENT_SUPPORT;
my $DEBUG;

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

    $VERSION = $args->{version};
    $DEVELOPMENT_SUPPORT = $args->{development_support};
    $DEBUG = $args->{debug} || 0;
    $self->{_Q} = $args->{_Q};
}

# ---------------------------------------------------------------------

=item run

Description

=cut

# ---------------------------------------------------------------------
sub run {
    my $self = shift;

    my $Q = $self->{_Q};

    if ($DEVELOPMENT_SUPPORT) {
        $DEBUG = $Q->param('debug') || $DEBUG;
    }

    if (! defined $ENV{REMOTE_USER}) {
        _serve_login_page();
        # NOTREACHED
    }

    my $clientVersion = "V_${VERSION}::HTDC";
    my $packagePath = $ENV{SDRROOT} . "/htdc/lib/V_${VERSION}/HTDC.pm";;

    eval {
        require $packagePath;
    };
    if ($@) {
        Call_Handler(0, "Internal error: $@");
        # NOTREACHED
    }
    $clientVersion->import();

    if (! $Q->param()) {
        _serve_request_form_page();
        # NOTREACHED
    }

    my $config = Call_Handler(get_config(), 'System configuration error');
    # POSSIBLY NOTREACHED

    my $dbh = Call_Handler(_htdc_connect(), 'Database error');
    # POSSIBLY NOTREACHED

    my $access_key = validate_request($Q, $dbh, $config, $ENV{REMOTE_USER});
    # POSSIBLY NOTREACHED

    if ($DEBUG == 2) {
        _serve_DEBUG_Data_API_uri($Q, $dbh, $access_key);
    }
    elsif ($DEBUG == 1) {
        _serve_DEBUG_Data_API_response($Q, $dbh, $config, $access_key);
    }
    else {
        _serve_Data_API_response($Q, $dbh, $config, $access_key);
    }
    # NOTREACHED
}

# ---------------------------------------------------------------------

=over

=item PUBLIC

=cut

# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item IPADDR_of_my_client

Description

=cut

# ---------------------------------------------------------------------
sub IPADDR_of_my_client {
    return $ENV{HTTP_X_FORWARDED_FOR} || $ENV{REMOTE_ADDR};
}

# ---------------------------------------------------------------------

=item Call_Handler

Description

=cut

# ---------------------------------------------------------------------
sub Call_Handler {
    my $return_from_call = shift;
    my $in_case_of_error = shift;

    if (! $return_from_call) {
        _serve_error_page($in_case_of_error);
    }

    return $return_from_call;
}

# ---------------------------------------------------------------------

=item PRIVATE ( _ )

=cut

# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item _serve_login_page

Description

=cut

# ---------------------------------------------------------------------
sub _serve_login_page {
    hLOG(qq{htdc: serve login page version=$VERSION});

    my $page_ref = Utils::read_file($ENV{SDRROOT} . '/htdc/web/htdc_login.html');

    my $wayf_link = _get_htdc_wayf_link();
    $$page_ref =~ s,___WAYF_LINK___,$wayf_link,;

    _standard_replacements($page_ref);

    print CGI::header('text/html');
    print $$page_ref;
    exit 0;
}


# ---------------------------------------------------------------------

=item _serve_error_page

Description

=cut

# ---------------------------------------------------------------------
sub _serve_error_page {
    my $error_message = shift;
    hLOG(qq{htdc ERROR: serve error page version=$VERSION: $error_message});

    my $page_ref = Utils::read_file($ENV{SDRROOT} . '/htdc/web/htdc_error.html');
    $$page_ref =~ s,___FAIL_REASON___,$error_message,;

    _standard_replacements($page_ref);

    print CGI::header('text/html');
    print $$page_ref;
    exit 0;
}

# ---------------------------------------------------------------------

=item _serve_request_form_page

Description

=cut

# ---------------------------------------------------------------------
sub _serve_request_form_page {
    hLOG(qq{htdc: serve request form version=$VERSION});

    my $page_ref = Utils::read_file($ENV{SDRROOT} . "/htdc/web/V_$VERSION/htdc_request_form.html");
    _standard_replacements($page_ref);

    print CGI::header('text/html');
    print $$page_ref;
    exit 0;
}


# ---------------------------------------------------------------------

=item _get_htdc_wayf_link

Description

=cut

# ---------------------------------------------------------------------
sub _get_htdc_wayf_link {
    my $C = shift;

    my $target = 'https://' . $ENV{HTTP_HOST} . '/cgi/kgs/authed';
    # wayf will change target /cgi into /shcgi, depending
    my $url = 'http://' . $ENV{HTTP_HOST} . '/cgi/wayf' . '?target=' . CGI::escape($target);

    return $url;
}

# ---------------------------------------------------------------------

=item _serve_DEBUG_Data_API_uri

Description

=cut

# ---------------------------------------------------------------------
sub _serve_DEBUG_Data_API_uri {
    my ($Q, $dbh, $access_key) = @_;

    my $signed_url = make_Data_API_request_url($Q, $dbh, $access_key);

    print CGI::header('text/html');
    print "<p><b>[CLIENT] URL to paste to server:</b><br/>";
    print $signed_url;

    exit 0;
}

# ---------------------------------------------------------------------

=item _serve_DEBUG_Data_API_response

Description

=cut

# ---------------------------------------------------------------------
sub _serve_DEBUG_Data_API_response {
    my ($Q, $dbh, $config, $access_key) = @_;

    my $signed_url = make_Data_API_request_url($Q, $dbh, $access_key);
    my $response = _get_response($signed_url);

    # Debug block
    print CGI::header('text/html');
    print "<p><b>[CLIENT] sent this URL to server:</b><br/>";
    print $signed_url;

    print "<p><b>[CLIENT] received this HTTP response from server:</b><br/>";
    print "<b>Status:</b> " . $response->status_line;
    print "<br/>";
    print "<b>Header:</b> " . $response->headers->as_string;
    print "<br/>";
    print "<b>Content byte count:</b> " . length($response->content);

    exit 0;
}


# ---------------------------------------------------------------------

=item _serve_Data_API_response

Description

=cut

# ---------------------------------------------------------------------
sub _serve_Data_API_response {
    my ($Q, $dbh, $config, $access_key) = @_;

    my $signed_url = make_Data_API_request_url($Q, $dbh, $access_key);
    my $response = _get_response($signed_url);
    my $client_url = $Q->self_url;
    hLOG(qq{htdc: _serve_Data_API_response version=$VERSION: client_url=$client_url signed_request_url=$signed_url});

    if ($response->is_success) {
        my $h = $response->headers;
        my $content_type = $h->header('Content-Type');
        my $content_disposition = $h->header('Content-Disposition') || '';
        if ($Q->param('disposition') eq 'download') {
            $content_disposition = 'attachment; ' . $content_disposition;
        }

        print CGI::header(
                          -Content_Type => $content_type,
                          -Content_Disposition => $content_disposition,
                         );
        print_encoded_output($Q, $response);
    }
    else {
        my $code = $response->code;
        my $status = $response->status_line . " " . (($code !~ m,^5\d\d,) ? $response->content : '');

        Call_Handler(0, 'Data API error: ' . $status);
    }

    exit 0;
}

# ---------------------------------------------------------------------

=item _htdc_connect

Description

=cut

# ---------------------------------------------------------------------
sub _htdc_connect {
    return API::DbIF::databaseConnect('ht_web');
}

# ---------------------------------------------------------------------

=item _get_user_agent

Description

=cut

# ---------------------------------------------------------------------
sub _get_user_agent {

    my $ua = LWP::UserAgent->new;
    $ua->timeout(300); # long to allow for large PDF generation
    $ua->agent("HathiTrust Data API Client");

    return $ua;
}

# ---------------------------------------------------------------------

=item _get_response

Description

=cut

# ---------------------------------------------------------------------
sub _get_response {
    my $url = shift;

    my $req = HTTP::Request->new( GET => "$url" );
    my $ua =  _get_user_agent();
    my $res = $ua->request($req);

    return $res;
}



# ---------------------------------------------------------------------

=item _standard_replacements

Description

=cut

# ---------------------------------------------------------------------
sub _standard_replacements {
    my $page_ref = shift;

    my $header_ref = Utils::read_file($ENV{SDRROOT} . '/htdc/web/header.chunk');
    $$page_ref =~ s,___HEADER_CHUNK___,$$header_ref,;

    my $analytics_ref = Utils::read_file($ENV{SDRROOT} . '/htdc/web/google_analytics.chunk');
    $$page_ref =~ s,___GOOGLE_ANALYTICS___,$$analytics_ref,;

    my $empty = '';
    my $base = $ENV{SDRROOT} . "/htdc/web/V_$VERSION";
    
    my $extended_types_ref = $DEVELOPMENT_SUPPORT ? Utils::read_file("$base/extended_types.chunk") : \$empty;
    $$page_ref =~ s,___EXTENDED_TYPES___,$$extended_types_ref,;

    my $extended_opts_ref = $DEVELOPMENT_SUPPORT ? Utils::read_file("$base/extended_options.chunk") : \$empty;
    $$page_ref =~ s,___EXTENDED_OPTIONS___,$$extended_opts_ref,;

    my $extended_opts_js_ref = $DEVELOPMENT_SUPPORT ? Utils::read_file("$base/extended_options_js.chunk") : \$empty;
    $$page_ref =~ s,___EXTENDED_OPTIONS_JS___,$$extended_opts_js_ref,;

    my $article_types_ref = $DEVELOPMENT_SUPPORT ? Utils::read_file("$base/article_types.chunk") : \$empty;
    $$page_ref =~ s,___ARTICLE_TYPES___,$$article_types_ref,;

    my $object_type_ref = $DEVELOPMENT_SUPPORT ? Utils::read_file("$base/object_type.chunk") : \$empty;
    $$page_ref =~ s,___OBJECT_TYPE___,$$object_type_ref,;

    my $example_ids_ref = 
      $DEVELOPMENT_SUPPORT 
        ? Utils::read_file("$base/example_ids_dev.chunk") 
          : Utils::read_file("$base/example_ids.chunk");
    $$page_ref =~ s,___EXAMPLE_IDS___,$$example_ids_ref,;
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
