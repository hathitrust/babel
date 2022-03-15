package MBooks::Operation::DownloadItemsMetadata;

=head1 NAME

MBooks::Operation::DownloadItemsMetadata (op)

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
use MBooks::Result::FullText;

use URI::Escape;

use MBooks::Operation::Status;

use Date::Manip;

use JSON::XS;
use File::Temp qw(tempfile);

use utf8;

delete $INC{"MBooks/Operation/OpListUtils.pl"};
require "MBooks/Operation/OpListUtils.pl";

use Auth::Logging;
use MBooks::Utils::ResultsCache;

use Download::Builder::MB;
use Download::Builder::HathiFiles;

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

    # is this a GET request? reject.
    ### ASSERT($cgi->request_method eq 'POST', qq{method not allowed});

    my $co = $act->get_transient_facade_member_data($C, 'collection_object');    
    my $owner = $co->get_user_id;

    my $CS = $act->get_transient_facade_member_data($C, 'collection_set_object'); 
    
    # check that this is a valid coll_id, i.e. collection exists
    my $status;
    
    if (!$CS->exists_coll_id($coll_id))
    {
        # Note: we would like to give the user the collection name if they clicked on a link to a non-existent
        # collection, but we can't get it.  
        my $msg = q{Collection "} . $coll_id .  q{" does not exist. };
        $act->set_error_record($C, $act->make_error_record($C, $msg));

        require HTTP::Response;
        $C->set_object('HTTP::Response', HTTP::Response->new(404));
        return $ST_NOT_OK;
    }
    # This assertion should never get triggered because of the logic above    
    ASSERT ($CS->exists_coll_id($coll_id),qq{Collection="$coll_id" does not exist});
    
    # only if collection not public do we care about owner!!
    my $status = $self->test_ownership($C, $co, $act, $coll_id, $owner);
    unless ( $status == $ST_OK ) {
        require HTTP::Response;
        $C->set_object('HTTP::Response', HTTP::Response->new(401));
    }
    return $status unless ($status == $ST_OK);

    my $coll_record = $co->get_coll_record($coll_id);
    my $rights_ref = $self->get_rights($C);

    # Result object
    my $rs; my $q1;
    if ( $q1 = defined $cgi->param('q1') ) {
        my $search_result_object = MBooks::Utils::ResultsCache->new($C, $coll_id)->get();
        $rs = $$search_result_object{result_object};
    }

    if ( ! defined $rs ) {
        # stale session OR query from download
        if ( defined $cgi->param('q1') && 
                ( $cgi->param('q1') ne '*' ) || 
                ( scalar $cgi->multi_param('facet') ) ) {

            # can we fake this?
            require MBooks::Query::FullText;
            require MBooks::Result::FullText;
            require MBooks::Searcher::FullText;

            $C->set_object('Collection', $co);

            my $user_query_string = $cgi->param('q1');
            my $Q = new MBooks::Query::FullText($C, $user_query_string);
            $Q->disable_sort();
            $rs = new MBooks::Result::FullText($coll_id);

            my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
            my $searcher = new MBooks::Searcher::FullText($engine_uri, undef, 1);

            $rs = $searcher->get_populated_Solr_query_result($C, $Q, $rs);            
        }
    }

    my $dbh = $C->get_object('Database')->get_DBH();
    $dbh->do(qq{SET NAMES utf8});

    my $format = $cgi->param('format') || 'text';
    my $source = $cgi->param('source') || 'mb';

    my $idx = 0;
    
    my $num_items = $$coll_record{num_items};
    my $suffix;

    if ( $cgi->param('lmt') eq 'ft' ) {
        $suffix .= "-ft";
        $num_items = $co->count_full_text($coll_id, $rights_ref);
    }

    my $include_hashref; 
    if ( $rs ) {
        my $result_id_arrayref = $rs->get_result_ids();
        unless ( scalar @$result_id_arrayref == $num_items ) {
            $include_hashref = { map { $_ => 1 } @$result_id_arrayref };
            require HTML::Entities;
            $suffix = lc HTML::Entities::decode_entities(uri_unescape(scalar $cgi->param('q1')));
            $suffix =~ s,[^a-z],-,g;
            $suffix =~ s,-+,-,g;
            $suffix = "-$suffix";
        }
    }

    my $cls = $self->get_builder($source, $format);
    my $builder = $cls->new(
        dbh => $dbh, 
        coll_record => $coll_record, 
        coll_id => $coll_id, 
        num_items => $num_items, 
        rights_ref => $rights_ref,
        is_ft => $cgi->param('lmt') eq 'ft',
        include => $include_hashref
    );

    $builder->run();

    my $fh = $builder->finish();

    $suffix .= "-" . time();

    my $session = $C->get_object('Session');
    my $op = DEBUG('attachment') ? "" : "attachment; ";
    my $ext = ( $format eq 'json' ? 'json' : 'txt' );
    Utils::add_header($C, 'Content-Disposition' => qq{$op filename="$coll_id$suffix.$ext});
    Utils::add_header($C, 'Cookie' => qq{download$coll_id=1; Path=/});
    # Utils::add_header($C, 'Cookie' => qq{downloadStarted=1});
    $act->set_transient_facade_member_data($C, 'output', $fh);

    my $request_uri = qq{$ENV{REQUEST_URI}?a=download;c=$coll_id;format=$format};
    if ( defined $q1 && $q1 ) { $request_uri .= "q1=$q1"; }
    if ( defined $cgi->param('lmt') ) { $request_uri .= ";lmt=" . $cgi->param('lmt'); }
    Auth::Logging::log_access($C, 'mb', undef, {
        REQUEST_URI => $request_uri
    });

    return $ST_OK;
}

sub get_builder {
    my $self = shift;
    my ( $source, $format ) = @_;

    my $FORMAT_MAP = {
        text => 'Text',
        json => 'JSON',
    };
    my $SOURCE_MAP = {
        mb => 'MB',
        hathifiles => 'HathiFiles',
    };

    return join("::", "Download", "Builder", $$SOURCE_MAP{$source}, $$FORMAT_MAP{$format});

}

1;

__END__

=head1 AUTHOR

Roger Espinosa, University of Michigan, roger@umich.edu

=head1 COPYRIGHT

Copyright 2016 ©, The Regents of The University of Michigan, All Rights Reserved

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

