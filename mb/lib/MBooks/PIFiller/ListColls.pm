package MBooks::PIFiller::ListColls;

=head1 NAME

MBooks::PIFiller::ListColls (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_LIST_COLLS action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use PIFiller;
use base qw(PIFiller);

use Utils;
use MBooks::Index;
use MBooks::Utils::Sort;
use MBooks::PIFiller::ListUtils;

use URI::Escape;
use Time::HiRes qw(time);

BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "PIFiller/Common/Group_HEADER.pm";
    require "PIFiller/Common/ADD_COLL_LINK.pm";
    require "PIFiller/Common/COLLECTIONS_OWNED_JS.pm";
}


# ---------------------------------------------------------------------

=item coll_list_helper

Description

=cut

# ---------------------------------------------------------------------
use Data::Dumper;
sub coll_list_helper
{
    my ($C, $act, $data_key) = @_;

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    $C->set_object('Collection', $co);
    my $output = '';

    my $start = time();

    my $data_ref = $act->get_transient_facade_member_data($C, $data_key);
    foreach my $coll_hashref (@$data_ref)
    {
        my $s = get_coll_xml($C, $coll_hashref);
        $output .= wrap_string_in_tag($s, 'Collection');
    }

    ## print STDERR "COLL_LIST_HELPER : " . ( time() - $start ) . "\n";

    return $output;
}

# ---------------------------------------------------------------------
sub coll_list_helper_json
{
    my ($C, $act, $data_key) = @_;

    require JSON::XS;

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    $C->set_object('Collection', $co);

    my $data_ref = $act->get_transient_facade_member_data($C, $data_key);

    foreach my $coll_hashref ( @$data_ref ) {
        $$coll_hashref{collid} = $$coll_hashref{MColl_ID};
        delete $$coll_hashref{MColl_ID};
    }

    my $output = {
        total_items => scalar(@$data_ref),
        previous_page => undef,
        next_page => undef,
        items => $data_ref,
    };

    my $json = JSON::XS->new;
    $json->utf8(0);
    my $output = $json->encode($output);

    my $callback = $act->get_transient_facade_member_data($C, 'jsonCallback');
    if ($callback) {
        $output = "$callback($output);"
    }

    return $output;
}

# ---------------------------------------------------------------------

=item handle_PUBLIC_COLL_LIST_PI

PI Handler for the PUBLIC_COLL_LIST processing instruction.

=cut

# ---------------------------------------------------------------------
sub handle_COLL_LIST_PI
    : PI_handler(COLL_LIST)
{
    my ($C, $act, $piParamHashRef) = @_;

    return coll_list_helper($C, $act, 'list_colls_data');
}

sub handle_COLL_LIST_JSON_PI
    : PI_handler(COLL_LIST_JSON)
{
    my ($C, $act, $piParamHashRef) = @_;

    return coll_list_helper_json($C, $act, 'list_colls_data');
}

# ---------------------------------------------------------------------

=item handle_MY_COLL_LIST_PI

PI Handler for the MY_COLL_LIST processing instruction.

=cut

# ---------------------------------------------------------------------
sub handle_MY_COLL_LIST_PI
    : PI_handler(MY_COLL_LIST)
{
    my ($C, $act, $piParamHashRef) = @_;

    return coll_list_helper($C, $act, 'my_list_colls_data');
}


# ---------------------------------------------------------------------
#
# helper for PUBLIC|MY_COLL_LIST
#
sub get_coll_xml
{
    my $C = shift;
    my $coll_hashref = shift;
    my $s = '';

    $s .= wrap_string_in_tag($$coll_hashref{'collname'},    'CollName', [['e', uri_escape_utf8($$coll_hashref{'collname'})]]);
    my $owner_string = MBooks::PIFiller::ListUtils::get_owner_string($C, $$coll_hashref{'owner_name'}, 1);
    my $owner_affiliation = MBooks::PIFiller::ListUtils::get_owner_affiliation($C, $$coll_hashref{'owner'}, $$coll_hashref{'owner_name'});
    $s .= wrap_string_in_tag($owner_string, 'OwnerString', [['e', uri_escape_utf8($owner_string)]]);
    $s .= wrap_string_in_tag($owner_affiliation, 'OwnerAffiliation', [['e', uri_escape_utf8($owner_affiliation)]]);
    $s .= wrap_string_in_tag($$coll_hashref{'owner'}, 'Owner');
    $s .= wrap_string_in_tag($$coll_hashref{'MColl_ID'},    'CollId');
    $s .= wrap_string_in_tag($$coll_hashref{'description'}, 'Description', [['e', uri_escape_utf8($$coll_hashref{'description'})]]);
    $s .= wrap_string_in_tag($$coll_hashref{'num_items'},   'NumItems');
    $s .= wrap_string_in_tag($$coll_hashref{'shared'},      'Shared');
    $s .= wrap_string_in_tag($$coll_hashref{'modified'},      'Updated');
    $s .= wrap_string_in_tag($$coll_hashref{'modified_display'},      'Updated_Display');
    $s .= wrap_string_in_tag($$coll_hashref{'featured'},      'Featured');
    
    
    my $all_indexed = "FALSE";

    # XXX don't run these solr queries if we aren't putting search
    # boxes in list_colls
#     my $ix = new MBooks::Index;
#     my ($solr_all_indexed,$item_status_hashref) = 
#         $ix->get_coll_id_indexed_status($C,$$coll_hashref{'MColl_ID'});
#     if ($solr_all_indexed) {
#         $all_indexed="TRUE";
#     }
    $s .= wrap_string_in_tag($all_indexed, 'AllItemsIndexed');

    # Should only bother if we own coll!
    my $current_user = $C->get_object('Auth')->get_user_name($C);    
    if ($current_user eq $$coll_hashref{'owner'}) {
        my $cgi = $C->get_object('CGI');  
        my $temp_cgi = new CGI($cgi);
        $temp_cgi->param('a', 'delc');
        $temp_cgi->param('c', $$coll_hashref{'MColl_ID'});
        $temp_cgi->delete('cn');
        $temp_cgi->delete('desc');
        $temp_cgi->delete('shd');
        
        my $delete_coll_href = $temp_cgi->self_url();        
        $s .= wrap_string_in_tag($delete_coll_href, 'DeleteCollHref');
    }

    return $s;
}




# ---------------------------------------------------------------------

=item handle_OWNER_SORT_HREF_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_OWNER_SORT_HREF_PI
    : PI_handler(OWNER_SORT_HREF)
{
    my ($C, $act, $piParamHashRef) = @_;
    return MBooks::PIFiller::ListUtils::get_sorting_href($C, 'own')
}

# ---------------------------------------------------------------------

=item handle_NUM_ITEMS_SORT_HREF_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_NUM_ITEMS_SORT_HREF_PI
    : PI_handler(NUM_ITEMS_SORT_HREF)
{
    my ($C, $act, $piParamHashRef) = @_;
    return MBooks::PIFiller::ListUtils::get_sorting_href($C, 'num')    
}

# ---------------------------------------------------------------------

=item handle_SHARED_SORT_HREF_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_SHARED_SORT_HREF_PI
    : PI_handler(SHARED_SORT_HREF)
{
    my ($C, $act, $piParamHashRef) = @_;
    return MBooks::PIFiller::ListUtils::get_sorting_href($C, 'shrd')
}

# ---------------------------------------------------------------------

=item handle_COLLNAME_SORT_HREF_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_COLLNAME_SORT_HREF_PI
    : PI_handler(COLLNAME_SORT_HREF)
{
    my ($C, $act, $piParamHashRef) = @_;
    return MBooks::PIFiller::ListUtils::get_sorting_href($C, 'cn')
}


1;

__END__

=head1 AUTHOR

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
