package MBooks::Operation::ListItems;

=head1 NAME

MBooks::Operation::ListItems (op)

=head1 DESCRIPTION

This class is the ListItems implementation of the abstract Operation
class.  It obtains an item list from the database on behalf of a
client.

TODO:  Shares much code with ListColls should they inherit from a base List class?

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# Perl modules
use Data::Page;

# MDP Modules
use base qw(Operation);
use Collection;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;
use MBooks::Utils::Sort;
use MBooks::Index;
use MBooks::Utils::ResultsCache;

delete $INC{"MBooks/Operation/OpListUtils.pl"};
require "MBooks/Operation/OpListUtils.pl";

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

Initialize MBooks::Operation::ListItems.  Must call parent initialize.

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

Perform the database operations necessary for ListItems action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    # TODO:  Break this up into a bunch of methods called by execute_operation
    my $self = shift;
    my $C = shift;
    
    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="ListItems"});
    
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $act = $self->get_action();

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');    
    my $owner = $co->get_user_id;
    $C->set_object('Collection', $co);

    my $CS = $act->get_transient_facade_member_data($C, 'collection_set_object'); 
    
    # check that this is a valid coll_id, i.e. collection exists
    my $status;
    
    if (!$CS->exists_coll_id($coll_id))
    {
        # Note: we would like to give the user the collection name if they clicked on a link to a non-existent
        # collection, but we can't get it.  
        my $msg = q{Collection "} . $coll_id .  q{" does not exist. };  
        $act->set_error_record($C, $act->make_error_record($C, $msg));
        return $ST_NOT_OK;
    }
    # This assertion should never get triggered because of the logic above    
    ASSERT ($CS->exists_coll_id($coll_id),qq{Collection="$coll_id" does not exist});
    
    # only if collection not public do we care about owner!!
    my $status = $self->test_ownership($C, $co, $act, $coll_id, $owner);
    return $status unless ($status == $ST_OK);

    # may exit with redirect
    $self->test_mondo_collection($C, $co, $act, $coll_id);

    # this is a reference to an array where each member is a rights
    # attribute valid for this context
    my $rights_ref = $self->get_rights($C);
    
    # get total number of full-text records regardless of slicing
    my $full_text_count = $co->count_full_text($coll_id, $rights_ref);
    $act->set_transient_facade_member_data($C, 'full_text_count', $full_text_count);
    
    # get total number of records
    my $all_count = $co->count_all_items_for_coll($coll_id);
    $act->set_transient_facade_member_data($C, 'all_count', $all_count);

    my $pager_count = $all_count;
    if ($cgi->param('lmt') eq 'ft')
    {
        $pager_count = $full_text_count;
    }

    my $pager = $self->do_paging($C, $cgi, $pager_count);
    $act->set_transient_facade_member_data($C, 'pager', $pager);
    
    # get item data for items in this collection
    #remove bad sort keys such as rel before asking for data
    $self->replace_bad_sort_keys($C,$co);
    my $item_arr_ref = $self->get_item_data($C, $rights_ref, $pager);
    
    # add full-text field and field for collections that item is in    
    my $final_item_arr_ref = $self->get_final_item_arr_ref($C, $item_arr_ref, $rights_ref);

    $act->set_transient_facade_member_data($C, 'list_items_data', $final_item_arr_ref);
    
    # get list of collections owned by user for use in dropdown should
    # this go in the PI? should it all go in list_items_data?
    my $collist_hashref = $CS->get_coll_data_from_user_id($owner);
    $act->set_transient_facade_member_data($C, 'list_items_owned_collection_data', $collist_hashref);

    # who is owner of collection (not same as current user if viewing
    # someone elses public colleciton or not logged in    
    my $coll_owner_display = $co->get_coll_owner_display_name($coll_id);
    $act->set_transient_facade_member_data($C,'coll_owner_display', $coll_owner_display);

    $act->set_transient_facade_member_data($C, 'co', $co);

    # check that we have to generate facets
    my $search_result_data_hashref = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();
    unless ( ref($search_result_data_hashref) ) {
        my $ix = new MBooks::Index;
        $search_result_data_hashref = $ix->get_coll_id_facets_counts($C, $co, $coll_id);
    }
    
    my $callback = $cgi->param('callback');
    if ($callback && $callback =~ /[^A-Za-z0-9_]/) {
        $callback = 'jsonCallback';
    }
    if ($callback) {
        $act->set_transient_facade_member_data($C, 'jsonCallback', $callback);
    }

    return $ST_OK;
}
#----------------------------------------------------------------------
# ---------------------------------------------------------------------

=item replace_bad_sort_keys

Removes bad cgi sort parameter if it is not in the list of sort fields supported by the collection object and replaces it with the default sort key.
This prevents the collection object from throwing an assertion failure when a sort=rel_d or rel_a.
We don't know how this happened since it is not in the ui.  However it is valid for listsrch but not for listitems, since items have no relevance ranking

=cut

# ---------------------------------------------------------------------

sub replace_bad_sort_keys{
    my $self = shift;
    my $C = shift;
    my $co = shift;
    
    my $cgi = $C->get_object('CGI');
    my $ab = $C->get_object('Bind');
    my $sort_key = $ab->mapurl_param_to_field($C, scalar $cgi->param('sort'), 'title_a');
    my $params_hashref = $ab->get_operation_params_hashref($C, ref($self));
    my $optional_params_hashref = $$params_hashref{'optional'};

    my $item_sort_fields_arr_ref = $co->get_item_sort_fields_arr_ref();
    my $sort_key_in_sort_fields = grep(/$sort_key/, @$item_sort_fields_arr_ref);

    if ($sort_key_in_sort_fields == 0)
    {
        #replace sort param with default
        $cgi->param('sort', $$optional_params_hashref{'sort'});
        #set cgi back in $C
        $C->set_object('CGI', $cgi);
    }
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

