package MBooks::Operation::Manager;


=head1 NAME

MBooks::Operation::Manager

=head1 DESCRIPTION

This module is a wrapper around Add/Delete database operations to
manage the logic of adding items to the queue shared between
Collection Builder and SLIP.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

our (@ISA, @EXPORT_OK);
use base qw( Exporter );
@EXPORT_OK = qw(ManageAddItems ManageDeleteItems ManageDeleteCollection);

use Context;
use Utils;

use Collection;
use DbUtils;
use SharedQueue;

# ---------------------------------------------------------------------

=item ManageAddItems

Description

=cut

# ---------------------------------------------------------------------
sub ManageAddItems {
    my ($C, $co, $to_coll_id, $id_arr_ref) = @_;

    my $ok = 1;

    my $small_collection_max_items = $co->get_config()->get('filter_query_max_item_ids');
    my $coll_num_items = $co->count_all_items_for_coll($to_coll_id);
    my $num_to_add = scalar(@$id_arr_ref);

    my $dbh = $co->get_dbh();

    if ($coll_num_items <= $small_collection_max_items) {
        # coll is "small"
        if ($coll_num_items + $num_to_add > $small_collection_max_items) {
            # ... and coll would become "large" -- all collection
            # items must be queued for indexing (for the first time)
            # to add the coll_id field to the Solr doc
            $ok = (
                   __DO_copy_items($C, $co, $to_coll_id, $id_arr_ref)
                   &&
                   SharedQueue::enqueue_all_ids($C, $dbh, $to_coll_id)
                  );
        }
        else {
            # coll remains "small"
            $ok = __DO_copy_items($C, $co, $to_coll_id, $id_arr_ref);
        }
    }
    else {
        # coll is already "large" -- items added before this add have
        # already been queued (and possibly already indexed and
        # removed from the queue)

        $ok = (
               __DO_copy_items($C, $co, $to_coll_id, $id_arr_ref)
               &&
               SharedQueue::enqueue_item_ids($C, $dbh, $id_arr_ref)
              );
    }

    return $ok;
}


# ---------------------------------------------------------------------

=item __DO_copy_items

Description

=cut

# ---------------------------------------------------------------------
sub __DO_copy_items {
    my ($C, $co, $to_coll_id, $id_arr_ref) = @_;

    my $ok = 1;
    eval {
        $co->copy_items($to_coll_id, $id_arr_ref);
    };
    if ($@) {
        $ok = 0;
    }

    return $ok;
}


# ---------------------------------------------------------------------

=item ManageDeleteItems

Description

=cut

# ---------------------------------------------------------------------
sub ManageDeleteItems {
    my ($C, $co, $from_coll_id, $id_arr_ref) = @_;

    my $ok = 1;

    my $small_collection_max_items = $co->get_config()->get('filter_query_max_item_ids');
    my $coll_num_items = $co->count_all_items_for_coll($from_coll_id);
    my $num_to_del = scalar(@$id_arr_ref);

    my $dbh = $co->get_dbh();

    if ($coll_num_items > $small_collection_max_items) {
        # coll is "large"
        if ($coll_num_items - $num_to_del <= $small_collection_max_items) {
            # ... and coll would become "small" -- ALL collection
            # items must be queued BEFORE DELETION so indexing will
            # globally remove the coll_id field from the Solr docs for
            # these items
            $ok = (
                   SharedQueue::enqueue_all_ids($C, $dbh, $from_coll_id)
                   &&
                   __DO_delete_items($C, $co, $from_coll_id, $id_arr_ref)
                  );
        }
        else {
            # coll remains "large" -- only deleted items are queued for
            # coll_id field removal at indexing time
            $ok = (
                   __DO_delete_items($C, $co, $from_coll_id, $id_arr_ref)
                   &&
                   SharedQueue::enqueue_item_ids($C, $dbh, $id_arr_ref)
                  );
        }
    }
    else {
        # coll is "small" -- just delete items. items deleted when
        # coll was large or when it became small have already been
        # queued.

        $ok = __DO_delete_items($C, $co, $from_coll_id, $id_arr_ref);
    }

    return $ok;
}


# ---------------------------------------------------------------------

=item __DO_delete_items

Description

=cut

# ---------------------------------------------------------------------
sub __DO_delete_items {
    my ($C, $co, $from_coll_id, $id_arr_ref) = @_;

    my $ok = 1;
    eval {
        $co->delete_items($from_coll_id, $id_arr_ref);
    };
    if ($@) {
        $ok = 0;
    }

    return $ok;
}


# ---------------------------------------------------------------------

=item ManageDeleteCollection

Description

=cut

# ---------------------------------------------------------------------
sub ManageDeleteCollection {
    my ($C, $co, $coll_id) = @_;

    my $ok = 1;

    my $small_collection_max_items = $co->get_config()->get('filter_query_max_item_ids');
    my $coll_num_items = $co->count_all_items_for_coll($coll_id);

    if ($coll_num_items > $small_collection_max_items) {
        # coll is "large"
        my $dbh = $co->get_dbh();
        $ok = (
               SharedQueue::enqueue_all_ids($C, $dbh, $coll_id)
               &&
               __DO_delete_coll($C, $co, $coll_id)
              );
    }
    else {
        $ok = __DO_delete_coll($C, $co, $coll_id);
    }

    return $ok;
}


# ---------------------------------------------------------------------

=item __DO_delete_coll

Description

=cut

# ---------------------------------------------------------------------
sub __DO_delete_coll {
    my ($C, $co, $coll_id) = @_;

    my $ok = 1;
    eval {
        $co->delete_coll($coll_id);
    };
    if ($@) {
        $ok = 0;
    }

    return $ok;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2010 ©, The Regents of The University of Michigan, All Rights Reserved

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
