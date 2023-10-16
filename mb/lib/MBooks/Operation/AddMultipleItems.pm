package MBooks::Operation::AddMultipleItems;


=head1 NAME

MBooks::Operation::AddMultipleItems (op)

=head1 DESCRIPTION

This class is a subclass of MBooks::Operation (op)

=head1 SYNOPSIS

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);
use Collection;
use Utils;
use Identifier;
use Debug::DUtils;
use MBooks::Operation::Status;
use MBooks::MetaDataGetter;
use Time::HiRes;

# ---------------------------------------------------------------------
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

Initialize MBooks::Operation::AddMultipleItems.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $rattr_ref = shift;

    my $C = $$rattr_ref{'C'};
    my $act = $$rattr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}

# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for AddMultipleItems action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig');
    my $co = $self->get_action()->get_transient_facade_member_data($C, 'collection_object');
    my $act = $self->get_action();

    DEBUG('op', qq{execute operation="AddMultipleItems"});

    $self->SUPER::execute_operation($C);

    my $start = Time::HiRes::time();
    my $cgi = $C->get_object('CGI');

    # if in production limit ids to max_ids
    my @ids = $cgi->multi_param('id');
    my $num_ids = scalar(@ids);
    my $max_ids = $config->get('max_add_ids');
    if (! defined ($ENV{'HT_DEV'})) {
        ASSERT($num_ids <= $max_ids,qq{$num_ids items submitted.  Maximum allowed is $max_ids});
    }

    my @no_metadata;
    my @update_metadata;
    my @invalid_ids;
    my @added_or_updated;
    my @failed_ids;
    my $failed_to_add_count  = 0;
    my $added_count = 0;

    # Pessimistic
    my $ALL_METADATA_RETURNED = 0;

    foreach my $id (@ids) {
        if (! Identifier::validate_mbooks_id($id)) {
            push(@invalid_ids, $id);
        }
        else {
            # valid
            if (! $co->item_exists($id)) {
                # if there is no entry in the item table we don't have metadata
                push(@no_metadata, $id);
            }
            else {
                push (@update_metadata, $id);
            }
        }
    }

    my @get_metadata_ids = (@no_metadata, @update_metadata);

    # clear out the idea; successful ids will be added
    # as we get metadata
    $cgi->delete('id');

    my $metadata_aryref = $self->get_metadata_via_metadata_getter($C, \@get_metadata_ids);
    if (! defined($metadata_aryref)) {
        my $msg = qq{Could not get metadata for items. };
        $act->set_error_record($C, $act->make_error_record($C, $msg));
    }
    else {
        # check to see that we have 1 metadata ref for each id?
        if ( scalar(@get_metadata_ids) == scalar(@$metadata_aryref) ) {
            $ALL_METADATA_RETURNED = 1;
        }

        foreach my $metadata_hashref (@$metadata_aryref) {
            my $id = $self->add_item_metadata_to_database($C, $metadata_hashref);
            if (defined($id)) {
                $added_count ++;
                push (@added_or_updated, $metadata_hashref->{'extern_item_id'});
            }
            else {
                $failed_to_add_count++;
                push (@failed_ids, $metadata_hashref->{'extern_item_id'});
            }
            # next action, copy items (to collection) assumes that ids
            # are available on the cgi params as ids
            $cgi->append(-name => 'id', -values => [$id]);
        }
    }

    my $db_success = (scalar(@failed_ids) == 0 && scalar(@invalid_ids) == 0 && $ALL_METADATA_RETURNED);

    # DEBUG
    my $elapsed = Time::HiRes::time() - $start;
    my $summary = "\n------\n" ;
    $summary .= $added_count ." were added for indexing/updating in " . $elapsed . " \n\t";
    $summary .= scalar(@ids) . " item ids  input\n\t";
    $summary .=  scalar(@invalid_ids) ." invalid_ids\n----\n";
    $summary .= $failed_to_add_count ." failed to be added  \n\t";
    if (!$ALL_METADATA_RETURNED) {
        $summary .= "Not all metadata returned from MetaDataGetter";
    }
    DEBUG('time', qq{$summary});
    # end DEBUG

    my %add_multiple_items_data;
    $add_multiple_items_data{'database_success'} = $db_success;
    $add_multiple_items_data{'all_metadata_returned'} = $ALL_METADATA_RETURNED;
    $add_multiple_items_data{'added_or_updated'} = \@added_or_updated;
    $add_multiple_items_data{'ids'} = \@ids;
    $add_multiple_items_data{'invalid_ids'} = \@invalid_ids;
    $add_multiple_items_data{'failed_ids'} = \@failed_ids;

    my $act = $self->get_action();
    $act->set_persistent_facade_member_data($C, 'add_multiple_items_data', \%add_multiple_items_data);

    $cgi->param('c', scalar $cgi->param('c2'));
    $C->set_object('CGI', $cgi);

    return $db_success ? $ST_OK : $ST_NOT_OK;

}

# ---------------------------------------------------------------------
sub get_metadata_via_metadata_getter {
    my $self = shift;
    my $C = shift;
    my $id_aryref = shift;

    my $mdg = new MBooks::MetaDataGetter($C, $id_aryref);
    my $metadata_aryref = $mdg->metadata_getter_get_metadata($C);

    return undef unless ($metadata_aryref && scalar @$metadata_aryref);
    return $metadata_aryref;
}

# ---------------------------------------------------------------------
# add_item_metadata_to_database
#
#   calls $co->create_or_update_item_metadata($metadata_ref);
#   which will create new item if extern_id not in db or update data otherwise
#
# ---------------------------------------------------------------------
sub add_item_metadata_to_database {
    my $self = shift;
    my $C = shift;
    my $metadata_ref = shift;

    my $act = $self->get_action();
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $id;

    eval {
        $id = $co->create_or_update_item_metadata($metadata_ref);
    };
    if ($@) {
        $id = undef;
        soft_ASSERT(0, qq{AddItem database failure="$@", extern_id="$$metadata_ref{'extern_item_id'}"}, 'force_email');
    }

    return $id;
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

