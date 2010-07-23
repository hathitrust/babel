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
