package MBooks::PIFiller::AddItems;

=head1 NAME

MBooks::PIFiller::AddItems (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_ADD_ITEM action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use PIFiller;
use base qw(PIFiller);


# ---------------------------------------------------------------------

=item handle_OPERATION_RESULTS_PI

OPERATION_RESULTS for AddItem Phase I is a flag to test in the
javascript response handler.  If we got this far without assertion
failures, we should be good.  If the item added already existed in the
selected collection we are silent.  All other user errors are trapped
by javascript:

1) adding to a new collection whose name is already in use

2) over-long description or collection name

System errors are ASSERT failures:

1) bad id, bad_collid, coll_id not owned by user, etc.

=cut

# ---------------------------------------------------------------------

sub handle_OPERATION_RESULTS_PI
    : PI_handler(OPERATION_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $action = $cgi->param('a');

    my $coll_name;
    if ($action eq 'addit')
    {
        my $copy_items_data_hashref
            = $act->get_persistent_facade_member_data($C, 'copy_items_data');
        $coll_name = $$copy_items_data_hashref{'to_coll_name'}
    }
    elsif ($action eq 'additnc')
    {
        $coll_name = $cgi->param('cn');
    }
    else
    {
        ASSERT(0, qq{Invalid action="$action"});
    }
    my $coll_id = $cgi->param('c2');

    # How did adding to the database and index go?
    my $add_items_data_hashref
        = $act->get_persistent_facade_member_data($C, 'add_items_data');
    my $copy_items_data_hashref
        = $act->get_persistent_facade_member_data($C, 'copy_items_data');

    my $database_success = 
        $$add_items_data_hashref{'database_success'} &&
            $$copy_items_data_hashref{'database_success'};

    my $s = qq{coll_id=$coll_id|coll_name=$coll_name};
    if ($database_success)
    {
        $s .= qq{|result=ADD_ITEM_SUCCESS};
    }
    else
    {
        $s .= qq{|result=ADD_ITEM_FAILURE};
    }

    return $s;
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
