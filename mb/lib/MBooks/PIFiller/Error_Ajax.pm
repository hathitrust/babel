package MBooks::PIFiller::Error_Ajax;

=head1 NAME

MBooks::PIFiller::Error (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_DISP_PAGE page=error_ajax action.

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

=item handle_AJAX_ERROR_MESSAGE_PI

Current javascript expects repsonse as a bar delimited string
foo|bar|result=ADD_ITEM_FAILURE   or |result=ADD_ITEM_SUCCESS
This provides an appropriate response
Consider redoing this to use result=SUCCESS or FAILURE so other ajax calls can use 
this API

=cut

# ---------------------------------------------------------------------

sub handle_ERROR_MESSAGE_AJAX_PI
    : PI_handler(ERROR_MESSAGE_AJAX)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $error_ref = $act->get_error_record($C);
    my $error_message = $$error_ref{'msg'};

    my $s = qq{error_message=$error_message|dummy=dummy};
    $s .= qq{|result=ADD_ITEM_FAILURE};
    
    return $s
}

# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHORS

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
