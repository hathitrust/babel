package MBooks::MetaDataGetter;

=head1 NAME

MBooks::MetaDataGetter

=head1 DESCRIPTION

This class takes a list of HathiTrust IDs and returns an array of
hashrefs containing the metadata for those ids from VuFindSolr.

=head1 SYNOPSIS

my $id_arr_ref = [ qw/yale.39002002220953 uva.x002482248/ ];
my $mdg = new MBooks::MetaDataGetter($C, $id_arr_ref);
my $metadata_arr_ref = $mdg->metadata_getter_get_metadata($C);


=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use Context;
use Utils;
use RightsGlobals;
use Access::Rights;

use MBooks::Searcher::VuFindSolr;
use MBooks::Query::VuFindSolr;
use MBooks::Result::VuFindSolr;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item metadata_getter_set_ids

Description

=cut

# ---------------------------------------------------------------------
sub metadata_getter_set_ids {
    my $self = shift;
    my ($C, $id_aryref) = @_;

    die "not initialized" unless $self->{_initialized};
    $self->{_id_aryref} = $id_aryref;
}

# ---------------------------------------------------------------------

=item PUBLIC: metadata_getter_get_metadata

Main method exposed to clients

=cut

# ---------------------------------------------------------------------
sub metadata_getter_get_metadata {
    my $self = shift;
    my $C = shift;

    my $ref_to_arr_of_metadata_hashref = $self->__get_vufind_metadata($C);
    my $ref = $self->__post_process_metadata($C, $ref_to_arr_of_metadata_hashref);

    return $ref;
}

# ---------------------------------------------------------------------

=item _initialize



=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my ($C, $id_aryref) = @_;

    $self->{_id_aryref} = $id_aryref;
    $self->{_context} = $C;
    $self->{_initialized} = 1;
}

# ---------------------------------------------------------------------
sub get_id_aryref {
    my $self = shift;
    return $self->{_id_aryref};
}


# ---------------------------------------------------------------------
sub __get_context {
    my $self = shift;
    return $self->{_context};
}

# ---------------------------------------------------------------------

=item PRIVATE: __create_VuFind_Solr_Searcher_by_alias

Description

=cut

# ---------------------------------------------------------------------
sub __create_VuFind_Solr_Searcher_by_alias {
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig');
    my $engine_uri = $config->get('engine_for_vSolr');

    my $searcher = new MBooks::Searcher::VuFindSolr($engine_uri);

    return $searcher;
}

# ---------------------------------------------------------------------

=item PRIVATE:__get_vufind_metadata

Description

=cut

# ---------------------------------------------------------------------
sub __get_vufind_metadata {
    my $self = shift;
    my $C = shift;

    my $id_ary_ref = $self->get_id_aryref();

    my $searcher = $self->__create_VuFind_Solr_Searcher_by_alias($C);
    my $rs = new MBooks::Result::VuFindSolr($C, $id_ary_ref);
    my $q = new MBooks::Query::VuFindSolr($C, "dummyquery");
    my $query = $q->get_Solr_metadata_query_from_ids($id_ary_ref);
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);

    unless ($rs->http_status_ok()) {
        return undef;
    }

    my $ref_to_arr_of_metadata_hashref = $rs->get_complete_result();

    return $ref_to_arr_of_metadata_hashref;
}

# ---------------------------------------------------------------------

=item PRIVATE: __post_process_metadata

Description

=cut

# ---------------------------------------------------------------------
sub __post_process_metadata {
    my $self = shift;
    my ($C, $ref_to_arr_of_metadata_hashref) = @_;

    my $ref_to_arr_of_post_processed_metadata_hashref = [];

    # Handle IDs for multivolume/serials
    my $wanted_item_id_hashref = {};
    my $ids_in_query = $self->get_id_aryref;

    foreach my $id (@$ids_in_query) {
        Utils::trim_spaces(\$id);
        $wanted_item_id_hashref->{$id} = 1;
    }

    foreach my $metadata_hashref (@$ref_to_arr_of_metadata_hashref) {
        # Serial or multivolume sets have multiple items in bib
        # records. Add add a separate metadata record for any items
        # that were wanted by the query.

        my $bib_id = $metadata_hashref->{id};
        my $iteminfo_arr_ref = $metadata_hashref->{ht_id_display};

        my ($item_id_arr_ref, $aux_metadata_hashref) = $self->__extract_item_metadata($iteminfo_arr_ref, $wanted_item_id_hashref);

        foreach my $item_id (@$item_id_arr_ref) {

            my $item_metadata_hashref = { %$metadata_hashref };
        
            $item_metadata_hashref->{bib_id} = $bib_id;
            delete $item_metadata_hashref->{id};

            delete $item_metadata_hashref->{ht_id_display};

            $item_metadata_hashref->{extern_item_id} = $item_id;

            $self->__helper_post_process_metadata($C, $item_metadata_hashref, $aux_metadata_hashref);
            push (@$ref_to_arr_of_post_processed_metadata_hashref, $item_metadata_hashref);
        }
    }

    return $ref_to_arr_of_post_processed_metadata_hashref;
}

# ---------------------------------------------------------------------

=item PRIVATE: __add_rights_data

Description

=cut

# ---------------------------------------------------------------------
sub __add_rights_data {
    my $self = shift;
    my ($C, $metadata_hashref) = @_;

    my $item_id = $metadata_hashref->{extern_item_id};

    my $ar = new Access::Rights($C, $item_id);
    my $attribute = $ar->get_rights_attribute($C, $item_id);

    # Some items in sample personal collections are not in the sample
    # repository. We can still get metadata for them from vufind.
    my $view = $ENV{SDRVIEW} || '';
    if ($view eq 'sample') {
        if ($attribute == $RightsGlobals::NOOP_ATTRIBUTE) {
            $attribute = 1;
        }
    }
    ASSERT($attribute != $RightsGlobals::NOOP_ATTRIBUTE, qq{bad rights data for id="$item_id"});

    $metadata_hashref->{rights} = $attribute;
}

# ---------------------------------------------------------------------

=item PRIVATE: __extract_item_metadata, __generate_sortkey

Employ heuristic to make a key to increase granularity of sort_title
using pubdate + volume from enumchron @ Tim Prettyman

The heuristic is to capture as much of the enumchron that consists of
digits depending on volume info coming earlier than additional year
info and for the additional volumes following that sequence. For
example:

pubdate=1901 enumchron=c.1 1898/99-1901/02| normed_pubdate=1901| normed_enum=000001001898000099001901000002


=cut

# ---------------------------------------------------------------------
my $DEBUG_sortkey = 0;

sub __generate_sortkey {
  my ($pubdate, $enumchron) = @_;

  print "pubdate=$pubdate enumchron=$enumchron|" if ($DEBUG_sortkey);
  
  # years before 1000 CE or containing non-numerals
  my $normed_pubdate = $pubdate;
  $normed_pubdate =~ s/[^\d]/0/g;
  $normed_pubdate = sprintf("%04d", $pubdate);

  print " normed_pubdate=$normed_pubdate|" if ($DEBUG_sortkey);

  my $normed_enumchron = $enumchron || '0';
  $normed_enumchron =~ s/[^\d]/ /g;
  $normed_enumchron =~ s/\d+/sprintf("%06d",$&)/eg;
  $normed_enumchron =~ s/[^\d]//g;

  print " normed_enum=$normed_enumchron\n" if ($DEBUG_sortkey);

  my $sortkey = $normed_pubdate . $normed_enumchron;

  return $sortkey;
}

sub __extract_item_metadata {
    my $self = shift;
    my ($ht_id_display_arr_ref, $wanted_item_id_hashref) = @_;

    my $id_arr_ref = [];
    my $aux_metadata_hashref = {};

    foreach my $ht_id_display (@$ht_id_display_arr_ref) {
        my ($item_id, $update_time, $volume, $pubdate) = split(/\|/, $ht_id_display);

        next unless ( $wanted_item_id_hashref->{$item_id} );

        push(@$id_arr_ref, $item_id);

        # enumchron
        $aux_metadata_hashref->{$item_id}->{volume} = ( (defined($volume) && $volume) ? $volume : '');

        # publish date
        $pubdate = ( (defined($pubdate) && $pubdate) ? $pubdate : '0000' );
        $aux_metadata_hashref->{$item_id}->{pubdate} = $pubdate;

        # heuristic sortkey
        my $sortkey = __generate_sortkey($pubdate, $volume);
        $aux_metadata_hashref->{$item_id}->{sortkey} = $sortkey;
    }

    return ($id_arr_ref, $aux_metadata_hashref);
}

# ---------------------------------------------------------------------

=item PRIVATE: __helper_post_process_metadata

Description

=cut

# ---------------------------------------------------------------------
sub __helper_post_process_metadata {
    my $self = shift;
    my ($C, $metadata_hashref, $aux_metadata_hashref) = @_;

    $self->__process_title($metadata_hashref, $aux_metadata_hashref);
    $self->__process_sort_title($metadata_hashref, $aux_metadata_hashref);
    $self->__process_author_sort_author($metadata_hashref);
    $self->__process_sort_date($metadata_hashref, $aux_metadata_hashref);
    $self->__process_date($metadata_hashref, $aux_metadata_hashref);
    $self->__add_book_ids($metadata_hashref);
    $self->__add_rights_data($C, $metadata_hashref);
    $self->__array2string($metadata_hashref);

    return $metadata_hashref;
}

# ---------------------------------------------------------------------

=item PRIVATE: __process_title

Combine title, 245c vtitle and volume/enum_cron

=cut

# ---------------------------------------------------------------------
sub __process_title {
    my $self = shift;
    my ($metadata_hashref, $aux_metadata_hashref) = @_;

    my $display_title;

    #Showing title_display field instead of title
    if (ref $metadata_hashref->{title_display} eq 'ARRAY') {
        $display_title = $metadata_hashref->{title_display}->[0];
    }
    else {
        $display_title = $metadata_hashref->{title_display};
    }

    # If 245c is an array with more than one element, the second
    # element is the vernacular title
    #my $vtitle_c;
    #my $title_c = $metadata_hashref->{title_c};

    # Add first 245c,
    #if (defined $title_c) {
    #    if (ref $title_c eq 'ARRAY') {
    #        $display_title .= ' ' . $title_c->[0];
    #        $vtitle_c = $title_c->[1];
    #    }
    #    else {
    #        $display_title .= ' ' . $title_c;
    #    }
    #}

    # Display vernacular title?
    #my $vtitle = $metadata_hashref->{vtitle};
    #if (defined $vtitle) {
    #    $vtitle = $vtitle->[0] if (ref $vtitle eq 'ARRAY');

        # Add the vernacular $245c if present. We assume second 245c
        # is a vernacular!
    #    $vtitle .= $vtitle_c if (defined $vtitle_c);

        # Add space
    #    $vtitle = " " . $vtitle;
    #    $display_title .= $vtitle;
    #}

    my $item_id = $metadata_hashref->{extern_item_id};
    my $volume = $aux_metadata_hashref->{$item_id}->{volume};
    $display_title .= " " . $volume if (defined $volume);

    $metadata_hashref->{display_title} = $display_title;

    # Remove vufind title keys
    #delete $metadata_hashref->{title};
    #delete $metadata_hashref->{vtitle};
    #delete $metadata_hashref->{title_c};
}

# ---------------------------------------------------------------------

=item PRIVATE: __process_sort_title

Combine vufind titleSort and sortkey as sort_title

=cut

# ---------------------------------------------------------------------
sub __process_sort_title {
    my $self = shift;
    my ($metadata_hashref, $aux_metadata_hashref) = @_;

    my $config = $self->__get_context->get_object('MdpConfig');
    my $sort_title_length = $config->get('sort_title_trunc_length');

    my $item_id = $metadata_hashref->{extern_item_id};
    my $sortkey = $aux_metadata_hashref->{$item_id}->{sortkey};
    
    my $sort_title = $metadata_hashref->{titleSort};
    if (ref $sort_title eq 'ARRAY') {
        $sort_title = $sort_title->[0];
    }
    delete $metadata_hashref->{titleSort};

    # remove cruft at the beginning of the sort_title
    $sort_title =~ s/^(\s|\p{Punctuation})+//;

    # truncate to fit schema
    $sort_title = substr($sort_title, 0, $sort_title_length);    

    # make it ~unique
    $sort_title .= $sortkey;
    $metadata_hashref->{sort_title} = $sort_title;
}

# ---------------------------------------------------------------------

=item PRIVATE: __process_author_sort_author

author now contains 7xx's per Bill's changes replace author with
contents of mainauthor when present.

=cut

# ---------------------------------------------------------------------
sub __process_author_sort_author {
    my $self = shift;
    my $metadata_hashref = shift;

    $metadata_hashref->{author} = $metadata_hashref->{mainauthor} if ($metadata_hashref->{mainauthor});
    unless (defined $metadata_hashref->{author}) {
        $metadata_hashref->{author} = '';
    }
    delete $metadata_hashref->{mainauthor};

    my $sort_author = $metadata_hashref->{author} || '';
    if (ref $sort_author eq 'ARRAY') {
        $sort_author = $sort_author->[0];
    }
    $sort_author =~ s/(\p{Punctuation})+/ /;
    Utils::trim_spaces(\$sort_author);
    $metadata_hashref->{sort_author} = $sort_author;
}

# ---------------------------------------------------------------------

=item PRIVATE: __process_sort_date

sortkey is actually a fine-grained date-like value

=cut

# ---------------------------------------------------------------------
sub __process_sort_date {
    my $self = shift;
    my ($metadata_hashref, $aux_metadata_hashref) = @_;

    my $item_id = $metadata_hashref->{extern_item_id};
    $metadata_hashref->{sort_date} = $aux_metadata_hashref->{$item_id}->{sortkey};
}

# ---------------------------------------------------------------------

=item PRIVATE:__process_date

MySQL needs month and day so put in fake

=cut

# ---------------------------------------------------------------------
sub __process_date {
    my $self = shift;
    my ($metadata_hashref, $aux_metadata_hashref) = @_;

    my $item_id = $metadata_hashref->{extern_item_id};
    my $date = $aux_metadata_hashref->{$item_id}->{pubdate};

    if ( $date =~ m,(0\d{3}|1\d{3}|20\d{2}), ) {
        $date = $1 . '-00-00';
    }
    else {
        $date = '0000-00-00';
    }

    $metadata_hashref->{date} = $date;
}

# ---------------------------------------------------------------------

=item PRIVATE: __add_book_id_prefix_and_filter

Unicorn google book covers

=cut

# ---------------------------------------------------------------------
sub __add_book_id_prefix_and_filter {
    my ($prefix, $arr_ref) = @_;

    my $out_arr_ref = [];
    foreach my $el (@$arr_ref) {
        # skip ids with ampersands (bad lccns?)
        next if ($el =~ /\&/);
        # delete spaces (bad?)
        $el =~ s/\s//g;
        push (@$out_arr_ref, ($prefix . ':' . $el));
    }

    return $out_arr_ref;
}

# ---------------------------------------------------------------------

=item PRIVATE: __add_book_ids

Insert "OCLC" or "ISBN" in front of oclc or isbns, put in comma
separated list.  Add namespace to google namespace to end of list (See
Tim's algorithm)

=cut

# ---------------------------------------------------------------------
sub __add_book_ids {
    my $self = shift;
    my $metadata_hashref = shift;

    my $arr_ref = [];

    my @vuFind_book_id_fields = ( qw/oclc isbn lccn/ );
    foreach my $field (@vuFind_book_id_fields) {
        if (defined $metadata_hashref->{$field}) {
            my $book_id_arr_ref = $metadata_hashref->{$field};
            my $temp_ref = __add_book_id_prefix_and_filter(uc($field), $book_id_arr_ref);
            push(@$arr_ref, @$temp_ref);
        }
        delete $metadata_hashref->{$field};
    }

    my $C = $self->__get_context;
    my $item_id = $metadata_hashref->{extern_item_id};
    my $google_id = Namespaces::get_google_id_by_namespace($C, $item_id);
    if (defined $google_id) {
        push(@$arr_ref, $google_id);
    }
    $metadata_hashref->{book_id} = join(',', @$arr_ref);
}

# ---------------------------------------------------------------------

=item __array2string

Description

=cut

# ---------------------------------------------------------------------
sub __array2string {
    my $self = shift;
    my $metadata_hashref = shift;

    foreach my $key (keys %$metadata_hashref) {
        my $ref = $metadata_hashref->{$key};
        if ( ref($ref) eq 'ARRAY') {
            $metadata_hashref->{$key} = join(' ', @$ref);
        }
    }
}

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu
Phillip Frber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-14 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject to
the following conditions:

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
