package Search::Result::SLIP_Raw;

=head1 NAME

Result::SLIP_Raw (rs)

=head1 DESCRIPTION

This class does encapsulates the raw Solr search response data.

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


use strict;
use base qw(Search::Result);

# ---------------------------------------------------------------------

=item AFTER_Result_initialize

Subclass Initialize Result::SLIP object.

=cut

# ---------------------------------------------------------------------
sub AFTER_Result_initialize {
    my $self = shift;
}

# ---------------------------------------------------------------------

=item AFTER_ingest_Solr_search_response

Example Solr result is anything

<response>
  <lst name="responseHeader">
    <int name="status">0</int>
    <int name="QTime">1</int>
  </lst>
  <result name="response" numFound="3" start="0" maxScore="0.02694472">
    <doc>
       [ ... ]
    </doc>

    [...]
  </result>
</response>


=cut

# ---------------------------------------------------------------------
sub AFTER_ingest_Solr_search_response {
    my $self = shift;
    my $Solr_response_ref = shift;

    my @result_docs = ($$Solr_response_ref =~ m,<doc>(.*?)</doc>,gs);
    @result_docs = map { '<doc>' . $_ . '</doc>' } @result_docs;

    $self->__set_result_docs(\@result_docs);
    $self->__set_rows_returned(scalar @result_docs);
}


# ---------------------------------------------------------------------

=item PRIVATE: __set_result_docs

Description

=cut

# ---------------------------------------------------------------------
sub __set_result_docs {
    my $self = shift;
    my $arr_ref = shift;
    $self->{'result_response_docs_arr_ref'} = $arr_ref;
}

# ---------------------------------------------------------------------

=item PRIVATE: __set_rows_returned

Description

=cut

# ---------------------------------------------------------------------
sub __set_rows_returned {
    my $self = shift;
    my $rows = shift;
    $self->{'rows_returned'} = $rows;
}

# ---------------------------------------------------------------------

=item get_result_docs

Description

=cut

# ---------------------------------------------------------------------
sub get_result_docs {
    my $self = shift;
    return $self->{'result_response_docs_arr_ref'};
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
