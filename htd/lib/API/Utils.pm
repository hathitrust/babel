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
use FileHandle;
use POSIX ();
use Time::HiRes ();

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


