package MBooks::Operation::CopyItems;


=head1 NAME

MBooks::Operation::CopyItems (op)

=head1 DESCRIPTION

This class is the CopyItems implementation of the abstract Operation
class.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);
use Collection;
use Utils;
use Debug::DUtils;
use Search::Constants;  # for index status constants

use MBooks::Operation::Status;
use MBooks::Operation::Manager qw(ManageAddItems);


sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize MBooks::Operation::CopyItems.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for CopyItems action

=cut

# ---------------------------------------------------------------------
sub execute_operation {
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="CopyItems"});

    $self->SUPER::execute_operation($C);

    my $ab = $C->get_object('Bind');
    my $act = $self->get_action();

    my $cgi = $C->get_object('CGI');
    my $a_param = $cgi->param('a');

    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');

    my $to_coll_id = $cgi->param('c2');

    if (! $cs->exists_coll_id($to_coll_id))
    {
        # Note: we would like to give the user the collection name if
        # they clicked on a link to a non-existent collection, but we
        # can't get it.
        my $msg = q{Collection "} . $to_coll_id .  q{" does not exist. };
        $act->set_error_record($C, $act->make_error_record($C, $msg));

        return $ST_NOT_OK;
    }
    # this should never be reached because of the error handling above.
    ASSERT ($cs->exists_coll_id($to_coll_id),
            qq{to_coll_id="$to_coll_id" does not exist});

    # Check that these ids exist.  Either they are new as a result of
    # an AddMultipleItems Operation or exist from another colleciton
    my @ids = $cgi->multi_param('id');
    ASSERT(scalar(@ids), qq{No ids supplied});

    my @valid_ids = ();
    my @already_in_coll2 = ();

    foreach my $id (@ids) {
        ASSERT($co->item_exists($id), qq{Invalid id="$id"});

        if ($co->item_in_collection($id, $to_coll_id)) {
            # item already in c2.  Cannot happen in AddItems/CopyItems
            # sequence because javascript limits user to collections
            # the item is not in
            push(@already_in_coll2, $id);
        }
        else {
            push(@valid_ids, $id);
        }
    }

    my $to_coll_name = $co->get_coll_name($to_coll_id);

    #  If there is at least one valid id we want to copy it, but we
    #  also want to give a message for any ids that didn't get copied
    #  either because they were already in the c2 (most likely)

    # XXX if there are no valid ids because some or all are already in the
    # database, we want to give a message
    my $undo_op;

    if (defined($cgi->param('undo'))) {
        $undo_op = $cgi->param('undo');
    }

    my $copy_items_data_hashref = {
                                   'undo_op'          => $undo_op,
                                   'to_coll_id'       => $to_coll_id,
                                   'to_coll_name'     => $to_coll_name,
                                   'action'           => $a_param,
                                   'valid_ids'        => \@valid_ids,
                                   'already_in_coll2' => \@already_in_coll2
                                  };

    my $db_success = 1;
    # only attempt copy operation if valid ids available
    if (scalar(@valid_ids > 0)) {
        $db_success = ManageAddItems($C, $co, $to_coll_id, \@valid_ids);
    }
    $$copy_items_data_hashref{'database_success'} = $db_success;

    # Save the destination collid (to_coll_id) to offer as the default
    # e.g. in pageturner for subsequent adds.
    my $ses = $C->get_object('Session');
    $ses->set_persistent('last_to_collid', $to_coll_id);

    $act->set_persistent_facade_member_data($C,
                                            'copy_items_data',
                                            $copy_items_data_hashref);

    return $ST_OK;
}



1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut
