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

delete $INC{"MBooks/Operation/OpListUtils.pl"};
require "MBooks/Operation/OpListUtils.pl";

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
    ASSERT($cgi->request_method eq 'POST', qq{method not allowed});

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
        return $ST_NOT_OK;
    }
    # This assertion should never get triggered because of the logic above    
    ASSERT ($CS->exists_coll_id($coll_id),qq{Collection="$coll_id" does not exist});
    
    # only if collection not public do we care about owner!!
    my $status = $self->test_ownership($C, $co, $act, $coll_id, $owner);
    return $status unless ($status == $ST_OK);

    # this is a reference to an array where each member is a rights
    # attribute valid for this context
    my $rights_ref = $self->get_rights($C);

    # Result object
    my $ses = $C->get_object('Session');
    my $rs = defined $cgi->param('q1') ? $ses->get_persistent('search_result_object') : undef;

    require JSON::XS;
    my $dbh = $C->get_object('Database')->get_DBH();

    my $format = $cgi->param('format') || 'json';
    my $content = [];
    push @$content, join("\t", "htitem_id", "title", "author", "date", "rights", "OCLC", "LCCN", "ISBN", "catalog_url", "handle_url") if ( $format eq 'text' );
    my $select_sql = q{SELECT a.extern_item_id AS htitem_id, a.display_title AS title, a.author, a.date, a.rights, a.book_id, a.bib_id};
    my $from_sql = qq{mb_coll_item b, mb_item a};
    my $where_sql = qq{MColl_ID = ? AND a.extern_item_id = b.extern_item_id};

    my $idx = 0;
    my $sql = qq{$select_sql FROM $from_sql WHERE $where_sql };

    my @params = ( $coll_id );

    my $result_id_arrayref; 
    my $suffix;
    if ( $rs ) {
        $result_id_arrayref = $rs->get_result_ids();
        unless ( scalar @$result_id_arrayref ) {
            $result_id_arrayref = [ 'zzz-not-found-zzz' ];
        }
        $sql .= q{ AND b.extern_item_id IN ( } . ( join(',', map { '?' } @$result_id_arrayref) ) . q{)};
        push @params, @$result_id_arrayref;
        require HTML::Entities;
        $suffix = lc HTML::Entities::decode_entities(uri_unescape($cgi->param('q1')));
        $suffix =~ s,[^a-z],-,g;
        $suffix =~ s,-+,-,g;
        $suffix = "-$suffix";
    }

    if ( $cgi->param('lmt') eq 'ft' ) {
        my $rights_sql = join(' OR ', map { 'rights = ?' } @$rights_ref);
        push @params, @$rights_ref;
        $sql .= " AND ( $rights_sql )";
        $suffix .= "-ft";
    }

    $sql .= qq{ ORDER BY title};
    my $sth = $dbh->prepare($sql);
    $sth->execute(@params);

    while ( my $rows = $sth->fetchall_arrayref({}, 500) ) {
        last unless ( scalar @$rows );
        $self->_fill_contents($content, $rows, $format);
    }

    if ( $format eq 'json' ) {
        my $json = JSON::XS->new()->utf8(1)->allow_nonref(1);

        my $emit = sub {
            my ( $key, $value, $last ) = @_;
            my $suffix = $last ? '' : ',';
            return sprintf(qq{%s: %s%s}, $json->encode($key), $json->encode($value), $suffix);
        };

        # and add metadata about this collection
        my $coll_record = $co->get_coll_record($coll_id);

        my $buf = [];
        push @$buf, "  " . $emit->("id", "https://babel.hathitrust.org/cgi/mb?a=listis;c=$coll_id");
        push @$buf, "  " . $emit->("type", "http://purl.org/dc/dcmitype/Collection");
        push @$buf, "  " . $emit->("description", $$coll_record{description});
        push @$buf, "  " . $emit->("created", $$coll_record{owner_name});
        push @$buf, "  " . $emit->("extent", $$coll_record{num_items});
        push @$buf, "  " . $emit->("formats", "text/txt");
        push @$buf, "  " . $emit->("publisher", { "id" => "https://www.hathitrust.org" });
        push @$buf, "  " . $emit->("title", $$coll_record{collname});
        push @$buf, "  " . $emit->("visibility", $$coll_record{shared} ? 'publish' : 'private');

        push @$buf, "  " . $json->encode("gathers") . ": [";

        foreach my $item ( @$content ) {
            my $last = $$item{htitem_id} eq $$content[-1]{htitem_id};
            push @$buf, "    {";
            my $keys = [ qw/title author date rights codes__oclc codes__lccn codes__isbn catalog_url htitem_id/ ];
            foreach my $key ( @$keys ) {
                my $value = $$item{$key};
                my $last = $key eq $$keys[-1];
                if ( $key =~ m,^codes__, ) {
                    my @tmp = split(/__/, $key);
                    $key = $tmp[-1];
                    $value = $$item{codes}{uc $key};
                }
                push @$buf, "      " . $emit->($key, $value, $last);
            }
            push @$buf, "    }" . ( $last ? '' : ',');
        }

        push @$buf, "  ]";

        $content = "{\n" . join("\n", @$buf) . "\n}";
    } else {
        $content = join("\n", @$content);
    }

    my $session = $C->get_object('Session');
    my $op = DEBUG('attachment') ? "" : "attachment; ";
    my $ext = ( $format eq 'json' ? 'json' : 'txt' );
    Utils::add_header($C, 'Content-Disposition' => qq{$op filename="$coll_id$suffix.$ext});
    $act->set_transient_facade_member_data($C, 'output', $content);

    return $ST_OK;
}

sub _fill_contents {
    my ( $self, $content, $rows, $format ) = @_;
    my $USE_CODES = { OCLC => 1, LCCN => 1, ISBN => 1 };
    my %SEEN = ();
    foreach my $row ( @$rows ) {
        # my ( $htitem_id, $title, $author, $date, $book_id, $bib_id ) = @$row;
        $$row{codes} = {};
        $$row{catalog_url} = qq{https://catalog.hathitrust.org/Record/$$row{bib_id}};
        $$row{handle_url} = qq{https://hdl.handle.net/2027/$$row{htitem_id}};
        $$row{rights} = $RightsGlobals::g_attribute_keys{$$row{rights}};

        my @parts = split(/,/, $$row{book_id});
        my ( $key, $value );
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

        delete $$row{bib_id}; delete $$row{book_id};
        if ( $format eq 'text' ) {
            foreach my $code ( keys %{$$row{codes}} ) {
                $$row{codes}{$code} = join(',', @{ $$row{codes}{$code} });
            }
            push @$content, join("\t", 
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
        } else {
            push @$content, $row;
        }

        delete $$row{rel};
        delete $$row{item_in_collections};
        delete $$row{sort_title};
        delete $$row{fulltext};
        delete $$row{record_no};
    }
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

