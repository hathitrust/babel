package LS::Query::FullText;


=head1 NAME

LS::Query::FullText (Q)

=head1 DESCRIPTION

This class subclasses Search::Query

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Debug::DUtils;

use base qw(Search::Query);


# ---------------------------------------------------------------------

=item AFTER_Query_initialize

Initialize LS::Query::FullText after base class.  Use Template
Design Pattern.

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize
{
    my $self = shift;
    my $C = shift;
    my $internal = shift;
    my $config_hashref = shift;

    $self->{'query_configuration'} = $config_hashref;
}



# ---------------------------------------------------------------------

=item get_id_arr_ref

Description

=cut

# ---------------------------------------------------------------------
sub get_id_arr_ref
{
    my $self = shift;
    return $self->{'id_arr_ref'};
}

# ---------------------------------------------------------------------

=item full_text_query

Description

=cut

# ---------------------------------------------------------------------
sub full_text_query
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'full_text_query'});
}

# ---------------------------------------------------------------------

=item rows_requested

Description

=cut

# ---------------------------------------------------------------------
sub rows_requested
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return ($query_config{'solr_num_rows'} > 0);
}


# ---------------------------------------------------------------------

=item get_start_row

Description

=cut

# ---------------------------------------------------------------------
sub get_start_row
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return $query_config{'solr_start_row'};
}

# ---------------------------------------------------------------------

=item get_solr_num_rows

Description

=cut

# ---------------------------------------------------------------------
sub get_solr_num_rows
{
    my $self = shift;
    my $C = shift;

    my %query_config = %{ $self->{'query_configuration'} };
    return $query_config{'solr_num_rows'};
}

# ---------------------------------------------------------------------

=item cache_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub cache_Solr_query_string {
    my $self = shift;
    my $s = shift;
    $self->{'cachedsolrquerystring'} = $s;
}

# ---------------------------------------------------------------------

=item get_cached_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub get_cached_Solr_query_string {
    my $self = shift;
    return $self->{'cachedsolrquerystring'};
}

# ---------------------------------------------------------------------

=item get_Solr_query_string

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_query_string
{
    my $self = shift;
    my $C = shift;

    # Cache to avoid repeated MySQL calls in Access::Rights
    if ($self->get_cached_Solr_query_string()) {
        return $self->get_cached_Solr_query_string();
    }

    # Massage the raw query string from the user
    my $user_query_string = $self->get_processed_user_query_string();

    # The common Solr query parameters
    my $USER_Q = qq{q=$user_query_string};
    my $FL = qq{&fl=title,author,date,rights,id,record_no,score};
    my $VERSION = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $INDENT = $ENV{'TERM'} ? qq{&indent=on} : qq{&indent=off};

    # Paging: Solr doc number is 0-relative
    my ($solr_start, $solr_rows) = (0, 0);
    if ($self->rows_requested($C))
    {
        ($solr_start, $solr_rows) =
            ($self->get_start_row($C), $self->get_solr_num_rows($C));
    }
    my $START_ROWS = qq{&start=$solr_start&rows=$solr_rows};

    # Full-text filter query (fq)
    my $FQ = '';
    if ($self->full_text_query($C)) {
        # Get list of attrs that equate to 'allow' for this user. This
        # is mainly for GeoIP check to add '9' to the list
        my $attr_list_aryref = [1,7];
        eval {
            $attr_list_aryref = Access::Rights::get_fulltext_attr_list($C);
        };
        $FQ = '&fq=rights:(' . join(' OR ', @$attr_list_aryref) .  ')';
    }

    # q=dog*&fl=id,rights,author,title,score&$version=2.2,&start=0&rows=20&indent=off
    my $solr_query_string = $USER_Q . $FL . $FQ . $VERSION . $START_ROWS . $INDENT;

    DEBUG('all,query',
          sub
          {
              my $s = $solr_query_string;
              Utils::map_chars_to_cers(\$s) if Debug::DUtils::under_server();
              return qq{Solr query="$s"}
          });

    $self->cache_Solr_query_string($solr_query_string);

    return $solr_query_string;
}



# ---------------------------------------------------------------------

=item get_Solr_internal_query_string

Expects a well-formed Lucene query from the calling code

=cut

# ---------------------------------------------------------------------
sub get_Solr_internal_query_string
{
    my $self = shift;

    # Solr right stemmed query strings have to be lowercase
    my $query_string = lc($self->get_query_string());

    my $INTERN_Q = qq{q=$query_string};
    my $FL = qq{&fl=*,score};
    my $VERSION = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $START_ROWS = qq{&start=0&rows=1000000};
    my $INDENT = qq{&indent=off};

    # q=id:123&fl=*,score&$version=2.2,&start=0&rows=1000000&indent=off
    my $solr_query_string =
        $INTERN_Q . $FL . $VERSION . $START_ROWS . $INDENT;

    return $solr_query_string;
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
