package MBooks::Result::FullText;


=head1 NAME

MBooks::Result::FullText (rs)

=head1 DESCRIPTION

This class does encapsulates the Solr search response data.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use JSON::XS;
use Utils;

use Search::Result;

use base qw(Search::Result);


sub ingest_Solr_search_response {
    my $self = shift;
    my ( $code, $Solr_response_ref, $status_line, $failed_HTTP_dump ) = @_;

    my $http_status_ok = ( $code eq '200' );

    my ( $max_score, $num_found, $query_time ) = ( 0, 0, 0.0 );

    my $parsed;    #parsed json Solr response object

    if ($http_status_ok) {
        $parsed = $self->parse_JSON_results($Solr_response_ref);

        # QTime (query time in milliseconds)
        $query_time = $parsed->{responseHeader}->{QTime};
        $query_time = sprintf( "%.3f", $query_time / 1000 );

        # Max score
        ($max_score) = ( $parsed->{response}->{maxScore} );
        $max_score = $max_score ? $max_score : 0.0;

        # Hits
        ($num_found) = ( $parsed->{response}->{numFound} );
        $num_found = $num_found ? $num_found : 0;
    }

    $self->{'http_status_ok'} = $http_status_ok;
    $self->{'response_code'}  = $code;
    $self->{'status_line'}    = $status_line;
    $self->{'query_time'}     = $query_time;
    $self->{'max_score'}      = $max_score;
    $self->{'num_found'}      = $num_found;

    # May be overridden for queries that limit by rows
    $self->{'rows_returned'}    = $num_found;
    $self->{'failed_HTTP_dump'} = $failed_HTTP_dump;

    # In Subclass:
    if ($http_status_ok) {
        $self->AFTER_ingest_Solr_search_response($parsed);
    }
}
# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize MBooks::Result::FullText object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize
{
    my $self = shift;
    my $collid = shift;

    $self->{'collid'} = $collid;
}


# ---------------------------------------------------------------------

=item AFTER_ingest_Solr_search_response

Example Solr result is:

  "response": {
    "numFound": 36,
    "start": 0,
    "maxScore": 0.06646542,
    "docs": [
      {
        "rights": 1,
        "id": "pur1.32754070178151",
        "score": 0.06646542
      },
      {
        "rights": 1,
        "id": "uc2.ark:/13960/t6xw4b92f",
        "score": 0.04884191
      },
      {
        "rights": 1,
        "id": "uc2.ark:/13960/t4rj6471s",
        "score": 0.044879846
      },
      [...]
    ]
  },
  "facet_counts": {
    "facet_queries": {},
    "facet_fields": {
       "facet_fields": {
          "topicStr": [
            [
              "Elephants",
              21
            ],
            [ ... ]
          ]
       }
    }
  }

=cut

# ---------------------------------------------------------------------
sub AFTER_ingest_Solr_search_response {
    my $self = shift;
    my $response_ref = shift;

    my @coll_ids = ();
    my (@result_ids, %result_score_hash, %result_rights_hash);

    # Coll_ids
    foreach my $doc ( @{ $$response_ref{response}{docs} } ) {
        push @coll_ids, $$doc{coll_id} if ( $$doc{coll_id} );
        push @result_ids, $$doc{id};
        $result_score_hash{$$doc{id}} = $$doc{score};
        $result_rights_hash{$$doc{id}} = $$doc{rights};
    }
    $self->__set_result_coll_ids(\@coll_ids);
    $self->__set_result_ids(\@result_ids);
    $self->{'result_scores'} = \%result_score_hash;
    $self->{'result_rights'} = \%result_rights_hash;

    my $facet_hash = $$response_ref{facet_counts}{facet_fields};
    $self->{facet_hash_ref} = $facet_hash;
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_ids
{
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_ids'} = $arr_ref;
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_coll_ids

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_coll_ids
{
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_coll_ids'} = $arr_ref;
}


# ---------------------------------------------------------------------

=item get_collid

Description

=cut

# ---------------------------------------------------------------------
sub get_collid
{
    my $self = shift;
    return $self->{'collid'};
}


# ---------------------------------------------------------------------

=item get_result_coll_ids

Description

=cut

# ---------------------------------------------------------------------
sub get_result_coll_ids
{
    my $self = shift;
    return $self->{'result_coll_ids'};
}

# ---------------------------------------------------------------------

=item get_result_ids

Description

=cut

# ---------------------------------------------------------------------
sub get_result_ids
{
    my $self = shift;
    return $self->{'result_ids'};
}


# ---------------------------------------------------------------------

=item get_result_scores

Description

=cut

# ---------------------------------------------------------------------
sub get_result_scores
{
    my $self = shift;
    return $self->{'result_scores'};
}

# ---------------------------------------------------------------------

=item get_result_rights

Description

=cut

# ---------------------------------------------------------------------
sub get_result_rights
{
    my $self = shift;
    return $self->{'result_rights'};
}

# ---------------------------------------------------------------------

=item remove_result_ids_for

Used to keep the Result object member data synchronized with the
DELETE or MOVE operation eliminating the need to redo a search to
re-display the search result list following the DELETE or MOVE.

=cut

# ---------------------------------------------------------------------
sub remove_result_ids_for
{
    my $self = shift;
    my $collid = shift;
    my $id_arr_ref = shift;

    return if ($self->get_collid() ne $collid);

    # XXX WARNING: Inefficient.  We will probably not need this if we
    # use Lucene for sorting.
    my $curr_id_arr_ref = $self->get_result_ids();

    my @reduced_arr;
    foreach my $curr_id (@$curr_id_arr_ref)
    {
        # If one of the current ids is in the list of ids to be
        # deleted, decrement the num_found count else save it to the
        # reduced list of ids that will replace the current list
        if (grep(/^$curr_id$/, @$id_arr_ref))
        {
            $self->{'num_found'}--;
        }
        else
        {
            push(@reduced_arr, $curr_id);
        }
    }
    $self->__set_result_ids(\@reduced_arr);
}


sub parse_JSON_results {
    my $self              = shift;
    my $Solr_response_ref = shift;

    # Warning json won't escape xml entities such as "&" ">" etc.
    my $coder  = JSON::XS->new->utf8->pretty->allow_nonref;
    my $parsed = $coder->decode($$Solr_response_ref);

    return $parsed;

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
