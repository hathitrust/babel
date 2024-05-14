package API::Utils;

=head1 NAME

API::Utils;

=head1 DESCRIPTION

This is a package of shared utility subroutines with no application
specific dependencies.  Let's keep it that way.

=head1 SUBROUTINES

=over 8

=cut

use strict;
use warnings;

use FileHandle;
use POSIX ();
use Time::HiRes ();

use base qw(Exporter);
our @EXPORT = qw( signature_safe_url );

use API::HTD_Log;

# ---------------------------------------------------------------------

=item valid_IP_address

Description

=cut

# ---------------------------------------------------------------------
sub valid_IP_address {
    my $ip = shift;
    return (defined($ip) && ($ip =~ m,^(([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])\.){3}([0-9]|[1-9][0-9]|1[0-9]{2}|2[0-4][0-9]|25[0-5])$,o));
}

# ---------------------------------------------------------------------

=item signature_safe_url

CGI.pm 3.51 mis-handles pathinfo when it contains a URL escaped character,
e.g. /pagemeta/uc1.%24b759628/1

AFAICT, CGI::[self_]url do not properly unescape path_info and also
doubles it so instead of

http://host/cgi/htd/pagemeta/uc1.$b759628/1

you get

http://host/cgi/htd/pagemeta/uc1.%24b759628/1/pagemeta/uc1.%24b759628/1

Signatures fail on this account. Ugh.

Due to the network architecture that includes the net scaler, to do
secure transport over SSL Data API sees protocol http:// over port
443, NOT https://

=cut

# --------------------------------------------------------------------- 
sub __DEBUG_signature_safe_url {
    my $Q = shift;

    my ($who) = ($ENV{SDRROOT} =~ m,/htapps/(.*?)\.babel,);
    $ENV{HTTP_HOST} = $who . '-full.babel.hathitrust.org';
    $ENV{REQUEST_URI} = '/cgi/htd';
    $ENV{SERVER_PORT} = '443';
    my $semi = $CGI::USE_PARAM_SEMICOLONS;
    $CGI::USE_PARAM_SEMICOLONS = 0;
    my $dev_url = $Q->self_url;
    $CGI::USE_PARAM_SEMICOLONS = $semi;

    return $dev_url;
}

sub signature_safe_url {
    my $Q = shift;

    my $terminal = $ENV{TERM} || 0;
    
    my $safe_url;
    if ($terminal) {
        $safe_url = __DEBUG_signature_safe_url($Q);
    }
    else {
        my $protocol = ( ($ENV{SERVER_PORT} eq '443') ? 'https://' : 'http://' );
        $safe_url = $protocol . $ENV{HTTP_HOST} . $ENV{REQUEST_URI};
    }   

    hLOG_DEBUG('API: ' . qq{signature_safe_url: safe url=$safe_url port=$ENV{SERVER_PORT} terminal=$terminal});
    return $safe_url;
}

# ---------------------------------------------------------------------

=item getTextFilehandle

Set the utf8 flag without checking.  It is up to the client to handle
malformed utf8.

=cut

# ---------------------------------------------------------------------
sub getTextFilehandle
{
    my $filename = shift;

    my $fh = new FileHandle;
    if ($fh->open("<$filename")) {
        if (binmode($fh, ':utf8')) {
            return $fh;
        }
    }
    return undef;
}

# ---------------------------------------------------------------------

=item getBinaryFilehandle

Description

=cut

# ---------------------------------------------------------------------
sub getBinaryFilehandle
{
    my $filename = shift;

    my $fh = new FileHandle;
    if ($fh->open("<$filename")) {
        if (binmode($fh)) {
            return $fh;
        }
    }

    return undef;
}

# ---------------------------------------------------------------------

=item readFile

Obvious

=cut

# ---------------------------------------------------------------------
sub readFile
{
    my $filename = shift;
    my $binary = shift;

    my $fh = $binary ? getBinaryFilehandle($filename) : getTextFilehandle($filename);

    my $data;
    if (defined($fh)) {
        $data = join('', <$fh>);
        $fh->close;
    }

    return \$data;
}


# ---------------------------------------------------------------------

=item getDateString

atom:updated date string.

A Date construct is an element whose
content MUST conform to the "date-time" production in [RFC3339]. In
addition, an uppercase "T" character MUST be used to separate date and
time, and an uppercase "Z" character MUST be present in the absence of
a numeric time zone offset.

atomDateConstruct =
   atomCommonAttributes,
   xsd:dateTime

Such date values happen to be compatible with the following
specifications: [ISO.8601.1988], [W3C.NOTE-datetime-19980827], and
[W3C.REC-xmlschema-2-20041028].

Example Date constructs:

<updated>2003-12-13T18:30:02Z</updated>
<updated>2003-12-13T18:30:02.25Z</updated>
<updated>2003-12-13T18:30:02+01:00</updated>
<updated>2003-12-13T18:30:02.25+01:00</updated>


=cut

# ---------------------------------------------------------------------
sub getDateString
{
    my ($seconds, $microseconds) = Time::HiRes::gettimeofday();
    my $fraction = sprintf("%03d", $microseconds/1000);
    my $date = POSIX::strftime("%Y-%m-%dT%H:%M:%S.$fraction%z", localtime($seconds));

    return $date;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-10 ©, The Regents of The University of Michigan, All Rights Reserved

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


