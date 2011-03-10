package MBooks::Index;


=head1 NAME

MBooks::Index {ix)

=head1 DESCRIPTION

This class provides a Solr query interface to the Solr index.

=head1 SYNOPSIS

my $ix = new MBooks::Index($C);

my ($all_indexed) = $ix->get_coll_id_all_indexed_status($C, $coll_id);


=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Collection;
use Search::Constants;
use Search::Searcher;

use MBooks::Searcher::FullText;
use MBooks::Query::FullText;
use MBooks::Result::FullText;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize

Initialize Search::Index object.

=cut

# ---------------------------------------------------------------------
sub _initialize
{}

# ---------------------------------------------------------------------

=item  __get_counts_for_coll_id

For a "large" colelction, queries the Solr index to determine the
number of items in that collection currently indexed.

=cut

# ---------------------------------------------------------------------
sub __get_counts_for_coll_id {
    my $self = shift;
    my ($C, $coll_id) = @_;

    my $config = $C->get_object('MdpConfig');
    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $searcher = new MBooks::Searcher::FullText($engine_uri);

    my $query_string = qq{q=coll_id:$coll_id&fl=id&rows=0};

    my $rs = new MBooks::Result::FullText();
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query_string, $rs);

    my $count = $rs->get_num_found();
    
    return $count
}



# ---------------------------------------------------------------------

=item get_coll_id_all_indexed_status

If the collections is "large", counts to quickly see whether the
number of items in the collection in the mysql db matches the number
of items in Solr.  If the collection is "small", all items are already
indexed, by definition.

=cut

# ---------------------------------------------------------------------
sub get_coll_id_all_indexed_status {
    my $self = shift;
    my ($C, $co, $coll_id) = @_;

    my $all_indexed = 1;
    my $num_not_indexed = 0;
    my $num_in_collection = $co->count_all_items_for_coll($coll_id);

    if ($co->collection_is_large($coll_id)) {
        # count number of items in this collection in the Solr index
        my $solr_count = $self->__get_counts_for_coll_id($C, $coll_id);
        $num_not_indexed = $num_in_collection - $solr_count;
 
        $all_indexed = ($num_not_indexed == 0);
    }

    return ($all_indexed, $num_in_collection, $num_not_indexed);
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008-11 ©, The Regents of The University of Michigan, All Rights Reserved

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
