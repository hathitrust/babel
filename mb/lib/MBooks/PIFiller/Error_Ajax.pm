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

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

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
