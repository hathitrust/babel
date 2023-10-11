package MBooks::Query::VuFindSolr;


=head1 NAME

MBooks::Query::VuFindSolr

=head1 DESCRIPTION


This class is specialized to get metadata for a list of mdp/hathi ids
used by Collection Builder, CB-update_rights an batch_collection.pl.

It is not a general class for searching the VuFindSolr instance.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;
use warnings;

use Utils;
use Debug::DUtils;
use Collection;
use base qw(Search::Query);


# ---------------------------------------------------------------------

=item AFTER_Query_initialize

  Use Template
Design Pattern.

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize {
    my $self = shift;
    my $C = shift;
}

# ---------------------------------------------------------------------

=item get_id_arr_ref

Description

=cut

# ---------------------------------------------------------------------
sub get_id_arr_ref {
    my $self = shift;
    return $self->{'id_arr_ref'};
}

# ---------------------------------------------------------------------
sub get_query_string_from_ids {
    my $self = shift;
    my $id_arr_ref = shift;

    ASSERT(scalar(@$id_arr_ref) <= 1024, qq{more than 1024 ids });
    my $query = join(' OR ', map {qq{ht_id:"$_"}} @$id_arr_ref);

    return $query;
}

# ---------------------------------------------------------------------

=item get_Solr_metadata_query_from_ids

Creates a solr query based on a list of HathiTrust ids and  the
TODO: implment conf file step: fields in the global.conf file

=cut

# ---------------------------------------------------------------------
sub get_Solr_metadata_query_from_ids {
    my $self = shift;
    my $id_arr_ref = shift;

    #Remove title, title_c and vtitle because this function is only used in MetadataGetter.pm and we are removing from them all the titles
    my $field_list_arr_ref= [ 'author',
                              'mainauthor',
                              'title_display',
                              'titleSort',
                              'ht_id_display', # contains item_id, update_time, enumchron, enhanced publishDate
                              'id',            # bib record id
                              'oclc',          # book cover support
                              'isbn',          # book cover support
                              'lccn',          # book cover support
                            ];

    my $field_list = join(',', @$field_list_arr_ref);

    my $query_string = $self->get_query_string_from_ids($id_arr_ref);

    my $FL         = qq{&fl=$field_list};
    my $INDENT     = qq{&indent=off};
    my $FORMAT     = qq{&wt=xml};
    my $VERSION    = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $INTERN_Q   = qq{q=$query_string};
    my $START_ROWS = qq{&start=0&rows=1000000};

    my $solr_query_string = $INTERN_Q . $FL . $VERSION . $START_ROWS . $INDENT . $FORMAT;

    if (0) {
        require Data::Dumper;
        my $d = Data::Dumper::Dumper($solr_query_string);
        print STDERR $d;
    }

    return $solr_query_string;
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
