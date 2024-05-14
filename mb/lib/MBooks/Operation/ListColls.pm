package MBooks::Operation::ListColls;


=head1 NAME

MBooks::Operation::ListColls (op)

=head1 DESCRIPTION

This class is the ListColls implementation of the abstract Operation
class.  It obtains a collection list from the database on behalf of a
client.

TODO: XXX It might be overkill since a PIFiller PI handler for a
collection list PI could do this directly.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);

use CollectionSet;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;
use MBooks::Utils::Sort;

use Date::Manip::Date;

delete $INC{"MBooks/Operation/OpListUtils.pl"};
require "MBooks/Operation/OpListUtils.pl";

our $SIZES = [
    [ 1000, 1000 * 1000, '1000' ],
    [ 500,  1000,        '500-1000' ],
    [ 250,  500,         '250-500' ],
    [ 100,  250,         '100-250' ],
    [ 50,   100,         '50-100' ],
    [ 25,   50,          '25-50' ],
    [ 0,    25,          '0-25' ],
];

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

Initialize MBooks::Operation::ListColls.  Must call parent initialize.

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

Perform the database operations necessary for ListColls action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    my %colltype_map = (
        priv => 'my-collections',
        pub  => 'all' # all_cools
    );

    DEBUG('op', qq{execute operation="ListColls"});

    $self->SUPER::execute_operation($C);

    my $act = $self->get_action();
    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');

    my $cgi = $C->get_object('CGI');
    my $ab = $C->get_object('Bind');

    my $sortkey =$ab->mapurl_param_to_field($C, scalar $cgi->param('sort'), 'title_a');
    # print STDERR "AHOY SORT " . $cgi->param('sort') . " :: " . $sortkey . "\n";
    my $dir = MBooks::Utils::Sort::get_dir_from_sort_param(scalar $cgi->param('sort'));

    my $colltype = $cgi->param('colltype');
    my $auth = $C->get_object('Auth', 1);
    my $coll_data = ref($auth) ? $cs->get_coll_data_from_user_id($auth) : [];

    if ( $colltype eq 'default' ) {
        if ( scalar @$coll_data ) {
            $colltype = 'my-collections';
        } else {
            $colltype = 'featured';
        }
        $cgi->param('colltype', $colltype);
    }

    my $list_colls_colltype = 'all_colls';
    unless ( $cgi->param('page') eq 'ajax' ) {
        # $colltype = 'all_colls';
    } else {
        $list_colls_colltype = $colltype_map{$colltype} ? $colltype_map{$colltype} : $colltype;
    }

    if ( $cgi->param('colltype') eq 'my-collections' && ! ( $ENV{REMOTE_USER} || scalar @$coll_data ) ) {
        $cgi->param('colltype', 'featured');
    }
    $colltype = $cgi->param('colltype');

    my $callback = $cgi->param('callback');
    if ($callback && $callback =~ /[^A-Za-z0-9_]/) {
        $callback = 'jsonCallback';
    }
    if ($callback) {
        $act->set_transient_facade_member_data($C, 'jsonCallback', $callback);
    }

    $colltype = $list_colls_colltype if ( $cgi->param('skin') eq 'alicorn' );

    my $coll_arr_ref;
    eval {
        $coll_arr_ref = $cs->list_colls($list_colls_colltype, $sortkey,$dir );
    };
    die $@ if ( $@ );

    # foreach my $_colltype (qw/all featured updated my-collections/) {
    #     my $count = $cs->count_colls($_colltype);
    #     print STDERR "AHOY COUNTS $_colltype :: $count\n";
    # }

    my $updated_limit_date = new Date::Manip::Date;
    $updated_limit_date->parse("30 days ago");
    my $updated_limit = $updated_limit_date->printf("%Y-%m-%d %H:%M:%S");
    my $view_counts = {
        all => 0,
        featured => 0,
        updated => 0,
        'my-collections' => 0,
    };
    my $size_counts = {
        'any' => 0,
        '1000' => 0,
        '500-1000' => 0,
        '250-500' => 0,
        '100-250' => 0,
        '50-100' => 0,
        '25-50' => 0,
        '0-25' => 0,
    };

    my $q1 = $cgi->param('q1') || '';
    my $size = $cgi->param('size');
    my ( $min_size, $max_size );
    if ( $size ) {
        ( $min_size, $max_size ) = split(/-/, $size);
        $max_size = 1000 * 1000 if ( $min_size == 1000 );
    }

    my $tmp = [];
    foreach my $coll_hashref ( @$coll_arr_ref ) {
        my $matches_query = 1;
        my $matches_size = 1;

        my %current_user = map { $_ => 1 } $C->get_object('Auth')->get_user_names($C);
        $$coll_hashref{is_owned} = 1 if ( $current_user{$$coll_hashref{owner}} );

        if ( 
            $q1 && 
            ! ( 
                $$coll_hashref{contributor_name} =~ m,$q1,i || 
                $$coll_hashref{collname} =~ m,$q1,i || 
                $$coll_hashref{description} =~ m,$q1,i
            )
        ) {
            $matches_query = 0;
        }

        if (
            $size && 
            ! (
                ( $$coll_hashref{num_items} >= $min_size )
                && ( $$coll_hashref{num_items} < $max_size )
            )
        ) {
            $matches_size = 0;
        }

        # Bail out and do not update facets unless this is a query match
        next unless $matches_query;
        $$view_counts{all} += 1 if ( $$coll_hashref{shared} );
        $$view_counts{featured} += 1 if ( $$coll_hashref{featured} ne '' );
        $$view_counts{updated} += 1 if ( $$coll_hashref{modified} ge $updated_limit );
        $$view_counts{'my-collections'} += 1 if ( $$coll_hashref{is_owned} );

        # now final include is whether it matches the colltype
        next if ( $colltype eq 'all' && ! $$coll_hashref{shared} );
        next if ( $colltype eq 'featured' && $$coll_hashref{featured} eq '' );
        next if ( $colltype eq 'updated' && $$coll_hashref{modified} lt $updated_limit );
        next if ( $colltype eq 'my-collections' && ! $$coll_hashref{is_owned} );

        my $num_items = $$coll_hashref{num_items};
        $$size_counts{all} += 1;
        $$size_counts{'1000'} += 1 if ( 1000 <= $num_items );
        $$size_counts{'500-1000'} += 1 if ( 500 <= $num_items && $num_items < 1000 );
        $$size_counts{'250-500'} += 1 if ( 250 <= $num_items && $num_items < 500 );
        $$size_counts{'100-250'} += 1 if ( 100 <= $num_items && $num_items < 250 );
        $$size_counts{'50-100'} += 1 if ( 50 <= $num_items && $num_items < 100 );
        $$size_counts{'25-50'} += 1 if ( 25 <= $num_items && $num_items < 50 );
        $$size_counts{'0-25'} += 1 if ( 0 <= $num_items && $num_items < 25 );

        push @$tmp, $coll_hashref if $matches_size;
    }
    $coll_arr_ref = $tmp;

    my $total_records = scalar @$coll_arr_ref;
    if ( $total_records > 100 && $cgi->param('skin') ne 'alicorn' ) {
        my $pn = $cgi->param('pn') || 1;
        my $start = $pn - 1;
        my $end = $start + 100 - 1;
        $coll_arr_ref = [ @$coll_arr_ref[$start .. $end] ];
    }

    $act->set_transient_facade_member_data($C, 'list_colls_data', $coll_arr_ref);
    $act->set_transient_facade_member_data($C, 'size_counts', $size_counts);
    $act->set_transient_facade_member_data($C, 'view_counts', $view_counts);

    my $pager = $self->do_paging($C, $cgi, $total_records);
    $act->set_transient_facade_member_data( $C, 'pager', $pager );
    return $ST_OK;
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

