package MBooks::Operation::DeleteItems;

=head1 NAME

MBooks::Operation::DeleteItems (op)

=head1 DESCRIPTION

This class is the DeleteItems implementation of the abstract Operation
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

use MBooks::Result::FullText;
use MBooks::Operation::Status;
use MBooks::Operation::Manager qw(ManageDeleteItems);

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize MBooks::Operation::DeleteItems.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};
    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for DeleteItems action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="DeleteItems"});

    $self->SUPER::execute_operation($C);

    my $cgi = $C->get_object('CGI');
    my $a_param=$cgi->param('a');

    my $ab = $C->get_object('Bind');
    my $coll_id = $cgi->param('c');

    my $act = $self->get_action();
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $owner = $co->get_user_id;

    ASSERT($co->coll_owned_by_user($coll_id, $owner),
           qq{Operation::DeleteItems coll $coll_id not owned by user $owner});

    # check that these ids exist
    my @ids = $cgi->multi_param('id');
    my @valid_ids = ();
    foreach my $id (@ids) {
        ASSERT($co->item_exists($id), qq{Invalid id="$id"});
        push(@valid_ids, $id);
    }
    my $item_id_ref = \@valid_ids;

    my $ok = ManageDeleteItems($C, $co, $coll_id, $item_id_ref);
    ASSERT($ok, qq{Operation DeleteItems error:$@});

    # Delete items from result object also Result object
    my $ses = $C->get_object('Session');
    my $rs = $ses->get_persistent('search_result_object');
    if (defined($rs)) {
        $rs->remove_result_ids_for($coll_id, $item_id_ref);
    }

    my $delete_items_data_hashref = {
                                     'coll_id'   => $coll_id,
                                     'action'    => $a_param,
                                     'valid_ids' => $item_id_ref,
                                    };

    $act->set_persistent_facade_member_data($C,
                                            'delete_items_data',
                                            $delete_items_data_hashref);

    return $ST_OK;
}


1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

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

