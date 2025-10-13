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

use MBooks::FacetConfig;

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
    my $searcher = new MBooks::Searcher::FullText($engine_uri, undef, 1);

    my $query_string = qq{q=coll_id:$coll_id&fl=id&start=0&rows=0&wt=json&json.nl=arrarr};

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

    if ($co->collection_is_large($coll_id, $num_in_collection)) {
        # count number of items in this collection in the Solr index
        my $solr_count = $self->__get_counts_for_coll_id($C, $coll_id);
        $num_not_indexed = $num_in_collection - $solr_count;

        $all_indexed = ($num_not_indexed == 0);
    }

    # determine if some are not indexed because they are attr=8
    my $deleted = 0;
    unless ($all_indexed) {
        $deleted = $co->count_rights_for_coll($coll_id, 8);
    }

    return ($all_indexed, $num_in_collection, $num_not_indexed, $deleted);
}

sub get_coll_id_facets_counts {
    my $self = shift;
    my ($C, $co, $coll_id) = @_;

    # bail early if the colleciton is empty
    return if ( $co->count_all_items_for_coll($coll_id) == 0 );

    my $config = $C->get_object('MdpConfig');
    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $searcher = new MBooks::Searcher::FullText($engine_uri, undef, 1);

    my $num_in_collection = $co->count_all_items_for_coll($coll_id);

    my $query_string = "";
    my $is_large = 0;

    if ($is_large = $co->collection_is_large($coll_id, $num_in_collection)) {
        # build a query using the collid filter
        $query_string = qq{q=coll_id:$coll_id};
    } else {
        # need to build a query filtering on items
        $query_string = qq{q=*};
    }

    my $Q = new MBooks::Query::FullText($C, $query_string);

    if ( ! $is_large ) {
        $query_string .= $Q->get_id_FQ();
    }

    $query_string .= "&start=0&rows=0&wt=json&json.nl=arrarr&fl=id";
    $query_string .= $Q->__get_facets;

    my $rs = new MBooks::Result::FullText();
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query_string, $rs);

    my %search_result_data = 
        (
         'result_object' => $rs,
         'well_formed' => {
                           'all' => $Q->well_formed(),
                           'processed_query_string' => $Q->get_processed_query_string(),
                          },
        );

    my $cache = MBooks::Utils::ResultsCache->new($C, $coll_id)->set(\%search_result_data);

    return \%search_result_data;    
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
