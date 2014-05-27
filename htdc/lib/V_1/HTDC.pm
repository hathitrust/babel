package V_1::HTDC;


=head1 NAME

V_1::HTDC

=head1 DESCRIPTION

This is version 1 client code

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use URI;
use Encode;

use API::HTD::AuthDb;
use API::HTD::HConf;
use HOAuth::Signature;

use base qw(Exporter);
our @EXPORT = qw ( 
                     get_config
                     validate_request
                     print_encoded_output
                     make_Data_API_request_url
                );

# not circular!
use HTDC_Client;

# ---------------------------------------------------------------------

=item get_config

Description

=cut

# ---------------------------------------------------------------------
sub get_config {
    my $config = new API::HTD::HConf(
                                     [
                                      $ENV{SDRROOT} . '/htd/lib/API/HTD/base-config.yaml',
                                      $ENV{SDRROOT} . qq{/htd/lib/API/HTD/App/V_1/config.yaml},
                                     ]
                                    );
    return ($config->initSuccess ? $config : 0);
}

# ---------------------------------------------------------------------

=item validate_request

Description

=cut

# ---------------------------------------------------------------------
sub validate_request {
    my ($Q, $dbh, $config, $userid) = @_;

    # known?
    my $access_key = 
      HTDC_Client::Call_Handler(API::HTD::AuthDb::get_access_key_by_userid($dbh, $userid),
                                qq{Your user ID is not registered. Please visit the <a href="/cgi/kgs/authed">registration page</a> to record your user id});

    Utils::clean_cgi_params($Q);

    # all params present?
    HTDC_Client::Call_Handler(scalar $Q->param('id'), 'Please specify an ID');

    my $resource = $Q->param('resource');
    HTDC_Client::Call_Handler($resource, 'Please specify a resource');

    if (grep(/^$resource$/, qw( pagemeta pageimage pageocr pagecoordocr ))) {
        my $seq = $Q->param('seq');
        if (! $seq) {
            HTDC_Client::Call_Handler(0, 'Please specify a sequence number');
        }
        elsif ($seq !~ m,^\d+$,) {
            HTDC_Client::Call_Handler(0, 'Please specify a sequence number that consists of only digits');
        }
    }
    else {
        $Q->Delete('seq');
    }

    unless ($HTDC_Client::DEVELOPMENT_SUPPORT) {
        # No debug support and only resolution and width for sizing
        # when in production
        foreach my $arg ( qw(debug size height) ) {
            $Q->Delete($arg);
        }
    }

    return $access_key;
}


# ---------------------------------------------------------------------

=item print_encoded_output

Description

=cut

# ---------------------------------------------------------------------
sub print_encoded_output {
    my ($Q, $response) = @_;

    my $resource = $Q->param('resource');
    if (grep(/^$resource$/, qw(aggregate pageimage))) {
        # Do not encode binary types
        print $response->content;
    }
    else {
        print Encode::encode_utf8(Encode::decode_utf8($response->content));
    }
}


# ---------------------------------------------------------------------

=item make_Data_API_request_url

For simplicity, htdc always sends its request over SSL even for PD
data.

=cut

# ---------------------------------------------------------------------
sub make_Data_API_request_url {
    my $Q = shift;
    my $dbh = shift;
    my $access_key = shift;

    my $protocol = 'https://';

    if ($ENV{HT_DEV}) {
        if (! Debug::DUtils::under_server) {
            $ENV{HTTP_HOST} = $ENV{REMOTE_USER} . '-full.babel.hathitrust.org';
        }
    }

    my ($id, $resource, $seq) = (scalar $Q->param('id'), scalar $Q->param('resource'), scalar $Q->param('seq'));
    # So API can do geo ip lookup for this user
    my $client_IPADDR = HTDC_Client::IPADDR_of_my_client(); 
    my $extra = { ip => $client_IPADDR };

    if ($resource eq 'pageimage') {
        my $format = $Q->param('format');
        $extra->{format} = $format;
        if ($format ne 'raw') {
            my $unwatermarked = $Q->param('unwatermark') || '';
            if ($unwatermarked eq 'on') {
                $extra->{watermark} = 0;
            }
            my $res = $Q->param('res');
            my $width = $Q->param('width');

            # Prefer resolution
            if (defined $res) {
                $extra->{res} = $res || 0;
            }
            elsif (defined $width) {
                $extra->{width} = $width || 680;
            }
            else {
                $extra->{res} = $res || 0;
            }
        }
    }

    $extra->{v} = $Q->param('v') || $HTDC_Client::VERSION;

    my $url = $protocol . $ENV{HTTP_HOST} . '/cgi/htd' . qq{/$resource} . qq{/$id} . ($seq ? qq{/$seq} : '');

    my $secret_key = API::HTD::AuthDb::get_secret_by_active_access_key($dbh, $access_key);
    my $signed_url = HOAuth::Signature::S_get_signed_request_URL($url, $access_key, $secret_key, 'GET', $extra);

    return $signed_url;
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
