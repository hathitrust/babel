package MBooks::PIFiller::ListItems;

=head1 NAME

MBooks::PIFiller::ListItems (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the ACTION_LIST_COLLS action.

=head1 VERSION

$Id $

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

# Perl Modules
use Data::Page;

# MDP Modules
use PIFiller;
use base qw(PIFiller);

use Utils;
use Utils::XSLT;
use Search::Constants;
use MBooks::Index;
use MBooks::Utils::Sort;
use MBooks::PIFiller::ListUtils;
use MBooks::PIFiller::Survey;

use Namespaces;

BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "PIFiller/Common/Group_HEADER.pm";
    require "PIFiller/Common/COLLECTIONS_OWNED_JS.pm";
}



# ---------------------------------------------------------------------

=item handle_ITEM_LIST_PI

PI Handler for the PUBLIC_COLL_LIST processing instruction.

sub to create url for delete, move, copy actions

 1. set param a to delit movit/nc addit/nc
     'a'     => 'addit|additnc|movit|movitnc|delit|listis|viewit|addc|delc|editc|listcs|srch|page',
 2. get item list and put it as multiple id params?

=cut

# ---------------------------------------------------------------------

sub handle_ITEM_LIST_PI
    : PI_handler(ITEM_LIST)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');    
    $C->set_object('Collection', $co);
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');

    my $output = '';
    my $data_ref = $act->get_transient_facade_member_data($C, 'list_items_data');
    
    foreach my $item_hashref (@$data_ref) {
        my $s = '';

        my $display_title = $$item_hashref{'display_title'};
        $s .= wrap_string_in_tag(normalize_string($display_title), 'Title');

        my $author = $$item_hashref{'author'};
        $s .= wrap_string_in_tag(normalize_string($author), 'Author');
        
        # change date to just 4 digit year
        my $date = $$item_hashref{'date'};
        $date =~s,(\d\d\d\d)\-\d+\-\d+,$1,;
        $s .= wrap_string_in_tag($date, 'Date');
        
        $s .= wrap_string_in_tag($$item_hashref{'extern_item_id'}, 'ItemID');
        $s .= wrap_string_in_tag($$item_hashref{'rights'}, 'rights');
        $s .= wrap_string_in_tag($$item_hashref{'fulltext'}, 'fulltext');
        $s .= wrap_string_in_tag($$item_hashref{'record_no'}, 'record');
        $s .= wrap_string_in_tag($$item_hashref{'book_id'}, 'bookID');

        my $coll_ary_ref = $item_hashref->{'item_in_collections'};
        my $colls;        
        
        foreach my $hashref (@$coll_ary_ref) {
            my $c;
            $c .= wrap_string_in_tag($hashref->{'collname'}, 'CollectionName');
            $c .= wrap_string_in_tag($hashref->{'MColl_ID'}, 'CollID');
            $c .= wrap_string_in_tag($hashref->{'href'}, 'CollHref');
            # wrap each set of coll info in a tag
            my $coll = wrap_string_in_tag($c, 'Collection');
            $colls .= $coll
        }
        $s .= wrap_string_in_tag($colls, 'Collections');

        # Link to Pageturner
        my $extern_id = $$item_hashref{'extern_item_id'};        
        $s .= wrap_string_in_tag(MBooks::PIFiller::ListUtils::PT_HREF_helper($C, $extern_id, 'pt'), 'PtHref');

        $output .= wrap_string_in_tag($s, 'Item');
    }

    return $output;
}

sub handle_ITEM_LIST_JSON_PI
    : PI_handler(ITEM_LIST_JSON)
{
    my ($C, $act, $piParamHashRef) = @_;

    require JSON::XS;

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');    
    $C->set_object('Collection', $co);
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');

    my $output = '';
    my $data_ref = $act->get_transient_facade_member_data($C, 'list_items_data');

    foreach my $item_hashref ( @$data_ref ) {
        my $extern_id = $$item_hashref{'extern_item_id'}; 
        $$item_hashref{href} = MBooks::PIFiller::ListUtils::PT_HREF_helper($C, $extern_id, 'pt');
    }

    my $pager = $act->get_transient_facade_member_data($C, 'pager');
    ASSERT(defined($pager),qq{pager not defined });

    my $cgi = $C->get_object('CGI');
    my $current_page = $cgi->param('pn');
    my $current_sz = $cgi->param('sz');

    my $output = {
        total_items => int($pager->total_entries),
        previous_page => $pager->previous_page,
        next_page => $pager->next_page,
        items => $data_ref,
    };

    my $json = JSON::XS->new;
    $json->utf8(0);
    $output = $json->encode($output);

    ## things we're not changing (yet?)
    # $s .= wrap_string_in_tag($$item_hashref{'extern_item_id'}, 'ItemID');
    # $s .= wrap_string_in_tag($$item_hashref{'rights'}, 'rights');
    # $s .= wrap_string_in_tag($$item_hashref{'fulltext'}, 'fulltext');
    # $s .= wrap_string_in_tag($$item_hashref{'record_no'}, 'record');
    # $c .= wrap_string_in_tag($hashref->{'collname'}, 'CollectionName');
    # $c .= wrap_string_in_tag($hashref->{'MColl_ID'}, 'CollID');
    # $c .= wrap_string_in_tag($hashref->{'href'}, 'CollHref');

    my $callback = $act->get_transient_facade_member_data($C, 'jsonCallback');
    if ($callback) {
        $output = "$callback($output);"
    }

    return $output;

}

#XXX this will convert "&" to "&amp;" and > and < to &gt; and &lt;
# The load programs should never put naked "&" in the data but the marc loader was missing the normalization
# XXX check to make sure that the additem code (from pageturner) and the marc loader use the same normalization!

sub normalize_string
{
    my $string = shift;
    # $string =~s/\&\s/\&amp\; /g;
    # $string =~s/\>/\&gt\; /g;
    # $string =~s/\</\&lt\; /g;

    require HTML::Entities;
    $string =~ s/&([^;]+);/ENTITY:$1:ENTITY/gis;
    $string = HTML::Entities::encode_entities($string);
    $string =~ s/ENTITY:([a-z0-9]+):ENTITY/&$1;/gis;

    return $string;
    
}

# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan,tburtonw@umich.edu

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
