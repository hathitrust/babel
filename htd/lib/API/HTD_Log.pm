package API::HTD_Log;

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

use base qw(Exporter);
our @EXPORT = qw( hLOG hLOG_DEBUG);

 
# ---------------------------------------------------------------------

=item hLOG_DEBUG

Description

=cut

# ---------------------------------------------------------------------
# Support production debugging
my $debug_logging_enabled = 0;
my $in_development = defined $ENV{HT_DEV};

sub hLOG_DEBUG {
    my $s = shift;
    if ($debug_logging_enabled || $in_development) {
        hLOG('DEBUG: ' . $s);
    }
}

# ---------------------------------------------------------------------

=item hLOG

Description

=cut

# ---------------------------------------------------------------------
sub hLOG {
    my $s = shift;

    my ($logdir, $logfile_path) = hlog_path();    
    Utils::mkdir_path($logdir);
    
    my $string = sprintf("%s %8s %s\n", $ENV{REMOTE_ADDR}, Utils::Time::iso_Time('time'), $s); 
    if (open(HLOG, ">>:encoding(UTF-8)", $logfile_path)) {
        print HLOG qq{$string};
        close(HLOG);
        chmod(0666, $logfile_path) if (-o $logfile_path);
    }
}

# ---------------------------------------------------------------------

=item hlog_path

Description

=cut

# ---------------------------------------------------------------------
sub hlog_path {
    my $date = Utils::Time::iso_Time('date');

    my $logdir = $ENV{SDRROOT} . '/logs/htd';
    my $logfile = "$date.log";
    my $logfile_path = $logdir . '/' . $logfile;

    return ($logdir, $logfile_path);
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
