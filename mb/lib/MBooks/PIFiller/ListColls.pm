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
use MBooks::Utils::Transfer;

use URI::Escape;
use Time::HiRes qw(time);
use Date::Manip::Date;

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
    my $session_id = $C->has_object('Session') ? 
        $C->get_object('Session')->get_session_id() : 0;

    my $cgi = $C->get_object('CGI');
    my $colltype = $cgi->param('colltype') || 'featured';

    my $output = '';

    my $start = time();

    my $updated_limit_date = new Date::Manip::Date;
    $updated_limit_date->parse("30 days ago");
    my $updated_limit = $updated_limit_date->printf("%Y-%m-%d %H:%M:%S");

    my $data_ref = $act->get_transient_facade_member_data($C, $data_key);
    foreach my $coll_hashref (@$data_ref)
    {
        my $s = get_coll_xml($C, $coll_hashref);

        my $featured = $$coll_hashref{featured} ne '' ? 'TRUE' : 'FALSE';
        my $recently_updated = 'FALSE';
        my $recently_updated = $$coll_hashref{modified} ge $updated_limit ? 'TRUE' : 'FALSE';
        my $owned = $$coll_hashref{is_owned} ? 'TRUE' : 'FALSE';

        my $selected = 'FALSE';
        if ( $colltype eq 'featured' ) { $selected = 'TRUE' if ( $featured eq 'TRUE' ); }
        elsif ( $colltype eq 'updated' ) { $selected = 'TRUE' if ( $recently_updated eq 'TRUE' ); }
        elsif ( $colltype eq 'my-collections' || $colltype eq 'priv' ) { $selected = 'TRUE' if ( $$coll_hashref{is_owned} ); }
        else { $selected = 'TRUE'; }

        my $is_temporary = ( $session_id eq $$coll_hashref{owner} ) ? 'TRUE' : 'FALSE';

        $output .= wrap_string_in_tag($s, 'Collection', [['featured', $featured], ['updated', $recently_updated], ['selected', $selected], ['owned',$owned], [ 'temporary', $is_temporary]]);
    }

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

sub handle_PENDING_TRANSFER_LIST_PI
    : PI_handler(PENDING_TRANSFERS_LIST)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $s = '';
    my $pending_transfers = MBooks::Utils::Transfer::find_pending($C);
    foreach my $transfer ( @$pending_transfers ) {
        my $attrs = [];
        push @$attrs, [ 'href', "/cgi/mb/transfer/" . $transfer->token ];

        my $collid_xml = '';
        my $payload = $transfer->payload;
        if ( scalar @$payload > 1 ) {
            # TODO: revisit if we ever allow for free
            # multiple selection of collections
            $collid_xml .= wrap_string_in_tag('ALL', 'Payload');
        } else {
            $collid_xml .= wrap_string_in_tag($$payload[0], 'Payload');
        }

        $s .= wrap_string_in_tag($collid_xml, 'Transfer', $attrs);
    }

    return $s;

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

    my $config = $C->get_object('MdpConfig');
    my $session_id =
        $C->has_object('Session')
      ? $C->get_object('Session')->get_session_id()
      : 0;

    $$coll_hashref{'num_items'} = 0 unless ( defined($$coll_hashref{'num_items'}) );

    $s .= wrap_string_in_tag($$coll_hashref{'collname'},    'CollName', [['e', uri_escape_utf8($$coll_hashref{'collname'})]]);
    my $owner_affiliation = MBooks::PIFiller::ListUtils::get_owner_affiliation($C, $$coll_hashref{'owner'}, $$coll_hashref{'owner_name'});
    $s .= wrap_string_in_tag($owner_affiliation ne '' ? 'true' : 'false', 'OwnerAffiliated');
    $s .= wrap_string_in_tag($$coll_hashref{'owner'}, 'Owner');
    $s .= wrap_string_in_tag($$coll_hashref{'contributor_name'}, 'ContributorName', [['e', uri_escape_utf8($$coll_hashref{'contributor_name'})]]);
    $s .= wrap_string_in_tag($$coll_hashref{'MColl_ID'},    'CollId');
    $s .= wrap_string_in_tag($$coll_hashref{'description'}, 'Description', [['e', uri_escape_utf8($$coll_hashref{'description'})]]);
    $s .= wrap_string_in_tag($$coll_hashref{'num_items'},   'NumItems');
    $s .= wrap_string_in_tag(MBooks::PIFiller::ListUtils::commify($$coll_hashref{'num_items'}),   'NumItems_Display');
    $s .= wrap_string_in_tag($$coll_hashref{'shared'},      'Shared');
    $s .= wrap_string_in_tag($$coll_hashref{'modified'},      'Updated');
    $s .= wrap_string_in_tag($$coll_hashref{'modified_display'},      'Updated_Display');
    $s .= wrap_string_in_tag($$coll_hashref{'featured'},      'Featured');
    $s .= wrap_string_in_tag($$coll_hashref{'branding'},      'Branding');

    my $is_temporary = ( $session_id eq $$coll_hashref{'owner'} );
    $s .= wrap_string_in_tag($is_temporary ? 'TRUE' : 'FALSE', 'IsTemporary');

    $s .= wrap_string_in_tag(lc $$coll_hashref{collname}, 'CollName_Sort');

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
    my %current_user = map { $_ => 1 } $C->get_object('Auth')->get_user_names($C);
    if ( $current_user{$$coll_hashref{owner}} ) {
        $$coll_hashref{is_owned} = 1;
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

sub handle_LIST_SIZE_WIDGET_PI
    : PI_handler(LIST_SIZE_WIDGET)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $size = $cgi->param('size') || '_';

    my $size_counts = $act->get_transient_facade_member_data( $C, 'size_counts' );

    my $s = '';
    foreach my $key ( keys %$size_counts ) {
        my $value = $$size_counts{$key} || 0;
        $s .= wrap_string_in_tag(
            '',
            'Size',
            [
                ['key', $key],
                ['count', $value],
                ['disabled', $value == 0 ? 'TRUE' : 'FALSE'],
                ['focus', $key eq $size ? 'TRUE' : 'FALSE']
            ]
        );
    }

    return $s;

}

sub handle_VIEW_SIZE_WIDGET_PI
    : PI_handler(VIEW_SIZE_WIDGET)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $colltype = $cgi->param('colltype');

    my $view_counts = $act->get_transient_facade_member_data($C, 'view_counts');

    my $s = '';
    foreach my $key ( keys %$view_counts ) {
        my $value = $$view_counts{$key} || 0;
        $s .= wrap_string_in_tag(
            '',
            'Size',
            [
                ['key', $key],
                ['count', $value],
                ['disabled', $value == 0 ? 'TRUE' : 'FALSE'],
                ['focus', $key eq $colltype ? 'TRUE' : 'FALSE']
            ]
        );
    }
    return $s;

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
