package MBooks::PIFiller::Error;

=head1 NAME

MBooks::PIFiller::Error (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_DISP_PAGE page=error action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use PIFiller;
use base qw(PIFiller);


# ---------------------------------------------------------------------

=item handle_ERROR_MESSAGE_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_ERROR_MESSAGE_PI
    : PI_handler(ERROR_MESSAGE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $error_ref = $act->get_error_record($C);
    my $error_message = $$error_ref{'msg'};

    return $error_message;
}



# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHORS

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
