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

use MBooks::Utils::ResultsCache;

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
    return $status unless ($status == $ST_OK);

    my $coll_record = $co->get_coll_record($coll_id);

    # this is a reference to an array where each member is a rights
    # attribute valid for this context
    my $rights_ref = $self->get_rights($C);

    # Result object
    my $rs;
    if ( defined $cgi->param('q1') ) {
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

    my $select_sql = q{SELECT a.extern_item_id AS htitem_id, a.display_title AS title, a.author, a.date, a.rights, a.book_id, a.bib_id};
    my $from_sql = qq{mb_coll_item b, mb_item a};
    my $where_sql = qq{MColl_ID = ? AND a.extern_item_id = b.extern_item_id};

    my $idx = 0;
    my $sql = qq{$select_sql FROM $from_sql WHERE $where_sql };

    my @params = ( $coll_id );
    
    my $num_items = $$coll_record{num_items};
    my $suffix;

    if ( $cgi->param('lmt') eq 'ft' ) {
        my $rights_sql = join(' OR ', map { 'rights = ?' } @$rights_ref);
        push @params, @$rights_ref;
        $sql .= " AND ( $rights_sql )";
        $suffix .= "-ft";
        $num_items = $co->count_full_text($coll_id, $rights_ref);
    }

    $sql .= qq{ ORDER BY sort_title};
    my $sth = $dbh->prepare($sql);
    $sth->execute(@params);

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

    my $cls = "Download::Builder::" . uc $format;
    my $builder = $cls->new(coll_record => $coll_record, coll_id => $coll_id, include => $include_hashref);

    $builder->init();

    while ( my $rows = $sth->fetchall_arrayref({}, 500) ) {
        last unless ( scalar @$rows );
        $builder->_fill_contents($rows);
    }

    my $fh = $builder->finish();

    $suffix .= "-" . time();

    my $session = $C->get_object('Session');
    my $op = DEBUG('attachment') ? "" : "attachment; ";
    my $ext = ( $format eq 'json' ? 'json' : 'txt' );
    Utils::add_header($C, 'Content-Disposition' => qq{$op filename="$coll_id$suffix.$ext});
    Utils::add_header($C, 'Cookie' => qq{download$coll_id=1; Path=/});
    # Utils::add_header($C, 'Cookie' => qq{downloadStarted=1});
    $act->set_transient_facade_member_data($C, 'output', $fh);

    return $ST_OK;
}

package Download::Builder;

use File::Temp;

sub open {
    my $self = shift;
    my ( $suffix ) = @_;
    $$self{fh} = File::Temp->new(DIR => '/ram', SUFFIX => $suffix);
    $$self{fh}->unlink_on_destroy(1);
}

sub _include {
    my $self = shift;
    my ( $row ) = @_;
    my $htitem_id = $$row{htitem_id};
    if ( ref($$self{include}) ) {
        return exists($$self{include}{$htitem_id});
    }
    return 1;
}

sub _process_row {
    my $self = shift;
    my ( $row ) = @_;

    my $USE_CODES = { OCLC => 1, LCCN => 1, ISBN => 1 };

    my @parts = split(/,/, $$row{book_id});
    my ( $key, $value );
    $$row{codes} = {};
    while ( scalar @parts ) {
        my $part = shift @parts;
        if ( $part =~ m,:, ) {
            ( $key, $value ) = split(/:/, $part, 2);
            unless ( $$USE_CODES{$key} ) {
                $key = undef;
                next;
            }
            $$row{codes}{$key} = [] unless ( ref($$row{codes}{$key}) );
            push @{ $$row{codes}{$key} }, $value;
        } elsif ( $key ) {
            $$row{codes}{$key}[-1] .= ",$part";
        }
    }
}

package Download::Builder::TEXT;

use base qw/Download::Builder/;
use utf8;

sub new
{
    my $class = shift;
    
    my $self = {@_};
    bless $self, $class;
    $self->open('.txt');
    binmode($$self{fh}, ":utf8");
    return $self;
}

sub init {
    my $self = shift;
    print { $$self{fh} } join("\t", "htitem_id", "title", "author", "date", "rights", "OCLC", "LCCN", "ISBN", "catalog_url", "handle_url") . "\n";
}

sub _fill_contents {
    my $self = shift;
    my ( $rows ) = @_;

    foreach my $row ( @$rows ) {
        next unless ( $self->_include($row) );
        $self->_process_row($row);
        $$row{catalog_url} = qq{https://catalog.hathitrust.org/Record/$$row{bib_id}};
        $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htitem_id}};

        foreach my $code ( keys %{$$row{codes}} ) {
            $$row{codes}{$code} = join(',', @{ $$row{codes}{$code} });
        }



        my $line = join("\t", 
            $$row{htitem_id}, 
            $$row{title},
            $$row{author},
            $$row{date},
            $$row{rights},
            $$row{codes}{OCLC},
            $$row{codes}{LCCN},
            $$row{codes}{ISBN},
            $$row{catalog_url},
            $$row{handle_url},
        );
        utf8::encode($line);

        print { $$self{fh} } $line, "\n";
    }
}

sub finish {
    my $self = shift;
    $$self{fh}->seek(0,0);
    return $$self{fh};
}

package Download::Builder::JSON;

use base qw/Download::Builder/;
use JSON::XS;

sub new
{
    my $class = shift;
    
    my $self = {@_};
    bless $self, $class;
    $self->open(".json");
    $$self{json} = JSON::XS->new()->utf8(1)->allow_nonref(1);
    return $self;
}

sub emit {
    my ( $self, $key, $value, $last ) = @_;
    my $suffix = $last ? '' : ',';
    return sprintf(qq{%s: %s%s}, $$self{json}->encode($key), $$self{json}->encode($value), $suffix);
};

sub init {
    my $self = shift;
    my $coll_record = $$self{coll_record};
    my $coll_id = $$coll_record{coll_id};

    print { $$self{fh} } '{' . "\n";
    print { $$self{fh} } "  " . $self->emit("id", "https://babel.hathitrust.org/cgi/mb?a=listis;c=$coll_id") . "\n";
    print { $$self{fh} } "  " . $self->emit("type", "http://purl.org/dc/dcmitype/Collection") . "\n";
    print { $$self{fh} } "  " . $self->emit("description", $$coll_record{description}) . "\n";
    print { $$self{fh} } "  " . $self->emit("created", $$coll_record{owner_name}) . "\n";
    print { $$self{fh} } "  " . $self->emit("extent", $$coll_record{num_items}) . "\n";
    print { $$self{fh} } "  " . $self->emit("formats", "text/txt") . "\n";
    print { $$self{fh} } "  " . $self->emit("publisher", { "id" => "https://www.hathitrust.org" }) . "\n";
    print { $$self{fh} } "  " . $self->emit("title", $$coll_record{collname}) . "\n";
    print { $$self{fh} } "  " . $self->emit("visibility", $$coll_record{shared} ? 'publish' : 'private') . "\n";

    print { $$self{fh} } "  " . $$self{json}->encode("gathers") . ": [" . "\n";

    $$self{num_contents} = 0;
}

sub _fill_contents {
    my $self = shift;
    my ( $rows ) = @_;

    my $USE_CODES = { OCLC => 1, LCCN => 1, ISBN => 1 };
    my %SEEN = ();
    foreach my $row ( @$rows ) {
        next unless ( $self->_include($row) );

        # my ( $htitem_id, $title, $author, $date, $book_id, $bib_id ) = @$row;
        $self->_process_row($row);
        $$row{catalog_url} = qq{https://catalog.hathitrust.org/Record/$$row{bib_id}};
        $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htitem_id}};
        $$row{rights} = $RightsGlobals::g_attribute_keys{$$row{rights}};

        if ( $$self{num_contents} ) {
            print { $$self{fh} } ",\n";
        }
        $$self{num_contents} += 1;

        print { $$self{fh} } "    {\n";

        my $keys = [ qw/title author date rights codes__oclc codes__lccn codes__isbn catalog_url htitem_id/ ];
        foreach my $key ( @$keys ) {
            my $value = $$row{$key};
            my $last = $key eq $$keys[-1];
            if ( $key =~ m,^codes__, ) {
                my @tmp = split(/__/, $key);
                $key = $tmp[-1];
                $value = $$row{codes}{uc $key};
            }
            print { $$self{fh} } "      " . $self->emit($key, $value, $last) . "\n";
        }
        print { $$self{fh} } "    }" ;
    }
}

sub finish {
    my $self = shift;
    print { $$self{fh} } "\n  ]" . "\n";
    print { $$self{fh} } "}";

    $$self{fh}->seek(0,0);
    return $$self{fh};
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

