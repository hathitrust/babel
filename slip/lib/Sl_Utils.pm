package Sl_Utils;


=head1 NAME

Sl_Utils

=head1 DESCRIPTION

This package contains a SLIP utilities.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;


use Date::Calc qw(:all);

use Context;
use MdpConfig;
use File::Path qw(make_path);

use constant SLIP_TMP_DIR => "/tmp/slip_semaphores";


# Create the tmp dir if it doesn't already exist.
BEGIN {
    make_path(SLIP_TMP_DIR);
}

# ---------------------------------------------------------------------

=item checkIndex_day

Avoid full optimization on checkIndex days, for example.

=cut

# ---------------------------------------------------------------------
sub checkIndex_day {
    my $C = shift;

    my $day_of_week = Day_of_Week_to_Text(Day_of_Week(Today()));
    my $check_index_day = $C->get_object('MdpConfig')->get('check_index_day_of_week');
    return ($day_of_week eq $check_index_day);
}


#-------------------------------------------------
=item slip_lockfile_dir

Return the slip lockfile dir, as stored in the constant SLIP_TMP_DIR.
We make sure to create the directory when this file is loaded
just in case.

=cut

#-----------------------------------------------------

sub slip_lockfile_dir {
    return SLIP_TMP_DIR;
}

#-------------------------------------------------
=item slip_semaphore_file(file_base)

Return a filename based on the passed-in string and
the slip_lockfile_dir, of the form
<file_base>-lock.sem

=cut

#-----------------------------------------------------

sub slip_semaphore_file {
    my $file_base = shift;
    my $filename = $file_base . '-lock.sem';
    return join('/', SLIP_TMP_DIR, $filename);
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
