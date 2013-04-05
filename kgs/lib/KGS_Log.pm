package KGS_Log;

=head1 NAME

KGS_Log

=head1 DESCRIPTION

This package implements simple logging.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use Context;
use Utils;
use Utils::Time;
use MdpConfig;

use base qw(Exporter);
our @EXPORT = qw( LOG );

# ---------------------------------------------------------------------

=item LOG

Description

=cut

# ---------------------------------------------------------------------
sub LOG {
    my $C = shift;
    my $s = shift;

    chomp($s);
    my $config = $C->get_object('MdpConfig');

    my $logdir = $ENV{'SDRROOT'} . $config->get('logdir');
    my $logfile = $config->get('logfile');
    my $date = Utils::Time::iso_Time('date');
    $logfile =~ s,___DATE___,$date,;
    
    Utils::mkdir_path($logdir);

    my $logfile_path = $logdir . '/' . $logfile;
    
    $s = Utils::Time::iso_Time('time') . " $ENV{REMOTE_ADDR} " . $s; 
    if (open(KLOG, ">>:encoding(UTF-8)", $logfile_path)) {
        print KLOG qq{$s\n};
        close(KLOG);
        chmod(0666, $logfile_path) if (-o $logfile_path);
    }
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
