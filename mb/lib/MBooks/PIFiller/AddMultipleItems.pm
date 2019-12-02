package MBooks::PIFiller::AddMultipleItems;

=head1 NAME

MBooks::PIFiller::AddMultipleItems (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_ADD_MULTIPLE_ITEMS action.

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
    if ($action eq 'addits')
    {
        my $copy_items_data_hashref
            = $act->get_persistent_facade_member_data($C, 'copy_items_data');
        $coll_name = $$copy_items_data_hashref{'to_coll_name'}
    }
    elsif ($action eq 'additsnc')
    {
        $coll_name = $cgi->param('cn');
    }
    else
    {
        ASSERT(0, qq{Invalid action="$action"});
    }
    my $coll_id = $cgi->param('c2');

    # How did adding to the database and index go?
    my $add_multiple_items_data_hashref
        = $act->get_persistent_facade_member_data($C, 'add_multiple_items_data');
    my $copy_items_data_hashref
        = $act->get_persistent_facade_member_data($C, 'copy_items_data');

    my $database_success = 
        $$add_multiple_items_data_hashref{'database_success'} &&
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
    # insert number of items added here.  Do we want to compare number requested with number added or already in collection??
#        my %add_multiple_items_data;
#    $add_multiple_items_data{'database_success'} = $db_success;
#    $add_multiple_items_data{'all_metadata_returned'} = $ALL_METADATA_RETURNED;
#    $add_multiple_items_data{'added_or_updated'} = \@added_or_updated;
#    $add_multiple_items_data{'ids'} =\@ids;
#    $add_multiple_items_data{'invalid_ids'} = \@invalid_ids;
#    $add_multiple_items_data{'failed_ids'} = \@failed_ids;
    my $NumIds = scalar(@{$add_multiple_items_data_hashref->{'ids'}});
    my $NumAdded = scalar(@{$add_multiple_items_data_hashref->{'added_or_updated'}});
    my $NumFailed =scalar(@{$add_multiple_items_data_hashref->{'failed_ids'}});

    # 'valid_ids'        => \@valid_ids,
    # 'already_in_coll2' => \@already_in_coll2

    my $NumAddedToCollection = scalar(@{$$copy_items_data_hashref{valid_ids}});
    my $NumAlreadyInCollection = scalar(@{$$copy_items_data_hashref{already_in_coll2}});
    # we could return the actual lists of ids added or failed and then do something fancy in the UI.
    $s .= qq{|NumSubmitted=$NumIds};
    $s .= qq{|NumAdded=$NumAdded};
    $s .= qq{|NumFailed=$NumFailed};
    $s .= qq{|NumAddedToCollection=$NumAddedToCollection};
    $s .= qq{|NumAlreadyInCollection=$NumAlreadyInCollection};



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
