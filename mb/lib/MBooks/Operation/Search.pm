package MBooks::Operation::Search;

=head1 NAME

MBooks::Operation::Search (op)

=head1 DESCRIPTION

This class is a dummy the Search implementation of the abstract Operation
class.  It returns fake search results

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# MDP Modules
use base qw(Operation);

use Collection;
use CollectionSet;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;
use MBooks::Query::FullText;
use MBooks::Result::FullText;
use MBooks::Searcher::FullText;

use Utils::Cache::Storable;

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

Initialize MBooks::Operation::Search.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    # my $cache_key = qq{mb__search};
    # my $cache_dir = Utils::get_true_cache_dir($C, 'mb_cache_dir');
    # my $cache = Utils::Cache::Storable->new($cache_dir, 600);
    # $$self{cache} = $cache;

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for Search action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="Search"});

    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    my $act = $self->get_action();

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $CS = $act->get_transient_facade_member_data($C, 'collection_set_object');

    if (! $CS->exists_coll_id($coll_id))
    {
        # Note: we would like to give the user the collection name if
        # they clicked on a link to a non-existent collection, but we
        # can't get it.
        my $msg = q{Collection "} . $coll_id .  q{" does not exist. };  
        $act->set_error_record($C, $act->make_error_record($C, $msg));

        return $ST_NOT_OK;
    }

    # This assertion should never get triggered because of the logic above    
    ASSERT($CS->exists_coll_id($coll_id), qq{Collection="$coll_id" does not exist});

    my $user_query_string = $cgi->param('q1');

    if ( $co->collection_is_large($coll_id) ) {
        print $cgi->redirect("/cgi/ls?a=srchls;coll_id=$coll_id;q1=$user_query_string");
        exit;
    }

    # pass along collection name for AJAX PI filler
    my $coll_name = $co->get_coll_name($coll_id);
    $act->set_persistent_facade_member_data($C, 'search_coll_name', $coll_name);

    $C->set_object('Collection', $co);

    my $Q = new MBooks::Query::FullText($C, $user_query_string);
    my $rs = new MBooks::Result::FullText($coll_id);

    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $searcher = new MBooks::Searcher::FullText($engine_uri, undef, 1);

    $rs = $searcher->get_populated_Solr_query_result($C, $Q, $rs);

    # Log
    $Q->log_query($C, $searcher, $rs, 'mb');

    # Preserve this rs on the session for repeated use in sorting
    # search results by relevance and also pass it along in the
    # %search_result_data to the PIFIller if we need to post the ajax
    # "search failed" message
    my $ses = $C->get_object('Session');
    $ses->set_persistent('search_result_object', $rs);
    $$self{cache}->Set("search_result_object__$coll_id", $rs);
    # Pass result along for possible use by an AJAX PI filler
    # regardless of success or failure
    my %search_result_data = 
        (
         'result_object' => $rs,
         'well_formed' => {
                           'all' => $Q->well_formed(),
                           'processed_query_string' => $Q->get_processed_query_string(),
                          },
        );

    $act->set_persistent_facade_member_data($C, 'search_result_data', \%search_result_data);

    return $ST_OK;
}


# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-9 ©, The Regents of The University of Michigan, All Rights Reserved

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

