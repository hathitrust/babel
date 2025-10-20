package Utils::UserLog;


=head1 NAME

UserLog.pm

=head1 DESCRIPTION

This non-OO package logs activity around useradmin, warn_contact,
register, usercertify, userupdate

=head1 SYNOPSIS

various

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use Exporter;
use base qw(Exporter);

use Encode;
use Utils;
use Utils::Time;


our @EXPORT = qw(__ul_log_event __ul_get_log_filename);

use Utils::Time;

# Logging (to same place as the 'register' app)
sub __ul_get_log_filename {
    my $date = iso_Time('date');
    my $log_filename = $ENV{SDRROOT} . '/logs/register/' . $date . '.log';

    return $log_filename;
}

sub __ul_log_event {
    my $msg_template = shift;
    my $message = shift;

    my $date = iso_Time('date');
    my $log_filename = __ul_get_log_filename();

    my $s = $msg_template;
    my $time = iso_Time();
    
    $s =~ s,__T__,$time,;
    $s =~ s,__E__,$message,;
    $s =~ s,\n+,\n,g;
    $s =~ s,\n, / ,g;
    
    open(my $fh, '>>', $log_filename);
    chmod 0666, $log_filename;
    syswrite $fh, Encode::encode('UTF-8',"$s\n");
    close $fh;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
