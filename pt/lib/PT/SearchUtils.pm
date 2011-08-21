package PT::SearchUtils;

=head1 NAME

PT::SearchUtils

=head1 DESCRIPTION

This pachage contains the wrapper code to drive item-level search
coupled with dynamic Solr indexing.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use Time::HiRes;

use Utils;
use Utils::Time;
use Utils::Logger;
use Debug::DUtils;
use MdpConfig;

use Db;
use Search::Utils;
use Search::Constants;
use SLIP_Utils::Solr;
use Search::Result::SLIP_Raw;
use Search::Result::Page;

use Index_Module;

use PT::Query;

my $HOST = `hostname`; chomp($HOST); $HOST =~ s,\..*$,,;

# ---------------------------------------------------------------------

=item __enable_indexing

Errors on an id can disable indexing service.  Enable.

=cut

# ---------------------------------------------------------------------
sub __enable_indexing {
    my ($C, $run) = @_;

    my $dbh = $C->get_object('Database')->get_DBH($C);
    Db::update_host_enabled($C, $dbh, $run, $HOST, 1);
    Db::update_shard_enabled($C, $dbh, $run, 1, 1);
}

# ---------------------------------------------------------------------

=item __timer

Description

=cut

# ---------------------------------------------------------------------
sub __timer {
    my $start = shift;
    
    my $elapsed = Time::HiRes::time() - $start;
    return $elapsed;
}

# ---------------------------------------------------------------------

=item __index_item_ok

Description

=cut

# ---------------------------------------------------------------------
sub __index_item_ok {
    my ($index_state, $data_status, $metadata_status) = @_;
    
    my $ok = (
              (! Search::Constants::indexing_failed($index_state))
              &&
              ($data_status == IX_NO_ERROR)
              &&
              ($metadata_status == IX_NO_ERROR)
             );
    
    return $ok;
}


# ---------------------------------------------------------------------

=item maybe_Solr_index_item

If item is not indexed or has been updated in the repository since
indexed, index it.

=cut

# ---------------------------------------------------------------------
sub maybe_Solr_index_item {
    my ($C, $run, $id, $g_stats_ref) = @_;

    use constant COMMIT_TIMEOUT => 60;

    my $start_0 = Time::HiRes::time();

    # Indexed ?
    my $do_index = 0;

    my $rs = new Search::Result::SLIP_Raw;
    my $searcher = SLIP_Utils::Solr::create_shard_Searcher_by_alias($C, 1);
    my $safe_id = Identifier::get_safe_Solr_id($id);
    my $query = qq{q=vol_id:$safe_id&start=0&rows=1&fl=timestamp};

    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);
    $g_stats_ref->{update}{check} = __timer($start_0);
    
    my $indexed = $rs->get_num_found();

    my ($index_state, $data_status, $metadata_status, $stats_ref ) =
      (IX_INDEXED, IX_NO_ERROR, IX_NO_ERROR, {});

    if (! $indexed) {
        __enable_indexing($C, $run);

        ($index_state, $data_status, $metadata_status, $stats_ref) =
          Solr_index_one_item($C, $run, $id);

        SLIP_Utils::Common::merge_stats($C, $g_stats_ref, $stats_ref);

        if (__index_item_ok($index_state, $data_status, $metadata_status)) {
            my $indexer = SLIP_Utils::Solr::create_shard_Indexer_by_alias($C, 1);    
            my ($index_state, $commit_stats_ref) = $indexer->commit_updates($C);

            SLIP_Utils::Common::merge_stats($C, $g_stats_ref, $commit_stats_ref);
        }
        else {
            soft_ASSERT(0, qq{Item-level indexing fail: id=$id index=$index_state data=$data_status meta=$metadata_status});
        }
    }

    $g_stats_ref->{update}{total} = __timer($start_0);

    return ($index_state, $data_status, $metadata_status, $g_stats_hashref);
}


# ---------------------------------------------------------------------

=item Solr_index_one_item

Description

=cut

# ---------------------------------------------------------------------
sub Solr_index_one_item {
    my ($C, $run, $id) = @_;

    my $dbh = $C->get_object('Database')->get_DBH($C);

    my ($index_state, $data_status, $metadata_status, $stats_ref) = 
      Index_Module::Service_ID($C, $dbh, $run, $$, $HOST, $id, 1);

    return ($index_state, $data_status, $metadata_status, $stats_ref);
}

# ---------------------------------------------------------------------

=item Solr_search_item

Description

=cut

# ---------------------------------------------------------------------
sub Solr_search_item {
    my ($C, $id, $g_stats_ref) = @_;

    my $start_0 = Time::HiRes::time();

    my $cgi = $C->get_object('CGI');
    my $config = $C->get_object('MdpConfig');

    my $q1 = $cgi->param('q1');
    my $parsed_terms_arr_ref = Search::Utils::ParseSearchTerms($C, \$q1);
    my $q_str = join(' ', @$parsed_terms_arr_ref);

    # Solr paging is zero-relative
    my $start = max($cgi->param('start') - 1, 0);
    my $rows = $cgi->param('size');

    my $rs = new Search::Result::Page;
    $rs->set_auxillary_data('parsed_query_terms', $parsed_terms_arr_ref);

    if (scalar(@$parsed_terms_arr_ref) > 0) {
        my $searcher = SLIP_Utils::Solr::create_shard_Searcher_by_alias($C, 1);
        
        my $safe_id = Identifier::get_safe_Solr_id($id);
        my $fls = $config->get('default_Solr_search_fields');
        
        # Default to the solrconfig.xml default unless specified on the URL
        my $op = $cgi->param('ptsop') || 'OR';
        my $solr_q_op_param = 'q.op=' . uc($op);
        
        # highlighting sizes
        my $snip = $config->get('solr_hl_snippets');
        my $frag = $config->get('solr_hl_fragsize');

        my $query = qq{q=ocr:$q_str&start=$start&rows=$rows&fl=$fls&hl.fragListBuilder=simple&fq=vol_id:$safe_id&hl.snippets=$snip&hl.fragsize=$frag&$solr_q_op_param};
        
        $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);

        $g_stats_ref->{query}{qtime} = $rs->get_query_time();
        $g_stats_ref->{query}{num_found} = $rs->get_num_found();
        $g_stats_ref->{query}{elapsed} = __timer($start_0);
        $g_stats_ref->{cgi}{elapsed} = __timer($main::realSTART);
        
        my $Solr_url = $searcher->get_engine_uri() . '?' . $query;
        $Solr_url =~ s, ,+,g;

        my $Q = new PT::Query($C, $Solr_url);
        $Q->log_query($C, $g_stats_ref);
    }

    return $rs;
}

# ---------------------------------------------------------------------

=item Solr_retrieve_OCR_page

Description

=cut

# ---------------------------------------------------------------------
sub Solr_retrieve_OCR_page {
    my ($C, $id, $seq) = @_;

    my $config = $C->get_object('MdpConfig');
    maybe_Solr_index_item($C, SLIP_Utils::Common::get_run_number($config), $id);

    my $cgi = $C->get_object('CGI');
    my $q1 = $cgi->param('q1');

    my $parsed_terms_arr_ref = Search::Utils::ParseSearchTerms($C, \$q1);
    my $q_str = join(' ', @$parsed_terms_arr_ref);

    my $rs = new Search::Result::Page;
    my $searcher = SLIP_Utils::Solr::create_shard_Searcher_by_alias($C, 1);
    my $safe_id = Identifier::get_safe_Solr_id($id);

    # get ocr field as we will get an empty snippet list if the q_str does not match
    my $fls = 'vol_id,hid,ocr';
    my $hid = $safe_id . "_$seq";
    my $start = 0;
    my $rows = 1;
    # The page to retrieve may not have the q1 match on it so OR it
    # with the id of the page we want.
    my $query = qq{q=ocr:$q_str+OR+hid:$hid&start=$start&rows=$rows&fl=$fls&hl.fragListBuilder=single&hl.fragsize=10000&fq=hid:$hid};

    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);

    my $Page_result = $rs->get_next_Page_result();
    my $snip_list = $Page_result->{snip_list};
    my $page_OCR_ref = $snip_list->[0];

    if (! $page_OCR_ref) {
        # Use the 'ocr' field w/o highlights
        $page_OCR_ref = $Page_result->{ocr};
    }

    return $page_OCR_ref;
}


# ---------------------------------------------------------------------

=item __get_id_timestamp

Description

=cut

# ---------------------------------------------------------------------
sub __get_id_timestamp {
    my ($C, $id) = @_;

    my $dbh = $C->get_object('Database')->get_DBH($C);
    my ($namespace, $barcode) = split(/\./, $id);

    my $rights_hashref = Db::Select_latest_rights_row($C, $dbh, $namespace, $barcode);

    return $rights_hashref->{time};
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2011 ©, The Regents of The University of Michigan, All Rights Reserved

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
