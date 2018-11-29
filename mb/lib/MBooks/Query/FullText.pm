package MBooks::Query::FullText;


=head1 NAME

MBooks::Query::FullText (Q)

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
use Collection;
use base qw(Search::Query);
use URI::Escape;

our $COUNTS = 1;


# ---------------------------------------------------------------------

=item AFTER_Query_initialize

Initialize MBooks::Query::FullText after base class.  Use Template
Design Pattern.

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize
{
    my $self = shift;
    my $C = shift;
    my $internal = shift;

    if (! $internal)
    {
        $self->get_ids_f_standard_user_query($C);
    }
}

# ---------------------------------------------------------------------

=item get_ids_f_standard_user_query

Construct filter query id array for the normal case (as opposed to
internal queries)

=cut

# ---------------------------------------------------------------------
sub get_ids_f_standard_user_query {
    my $self = shift;
    my $C = shift;

    my $coll_id = $C->get_object('CGI')->param('c');
    my $co = $C->get_object('Collection');

    my $id_arr_ref;
    if ($co->collection_is_large($coll_id)) {
        $id_arr_ref = [$coll_id];
    }
    else {
        $id_arr_ref = $co->get_ids_for_coll($coll_id);
    }

    $self->{'id_arr_ref'} = $id_arr_ref;
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

=item get_processed_user_query_string

Overide base class to handle asterisk

=cut

# ---------------------------------------------------------------------

sub get_processed_user_query_string {
    my $self = shift;
    my $query_string = shift;

    my $user_query_string;

    if (defined ($query_string))
    {
        $user_query_string= $query_string;
    }
    else
    {
        $user_query_string = $self->get_query_string();
    }
    #insert code from ls here
    if ($user_query_string eq "*")
    {
	#do stuff in ls
	
        $user_query_string ='*:*';
        # set various stuff to a-OK
        #$self->set_unbalanced_quotes(0,1);
        $self->set_processed_query_string('* = EVERYTHING',1);
        $self->set_was_valid_boolean_expression(1);
        $self->set_well_formed(1,1);
	return $user_query_string;
    }
    else
    {
	$user_query_string = $self->SUPER::get_processed_user_query_string($query_string);
    }
    
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
    my $cgi = $C->get_object('CGI');

    # Massage the raw query string from the user
    my $user_query_string = $self->get_processed_user_query_string();
    #XXXtbw prepare query string to function as part of an http request to Solr i.e. not xml and url escaped
    Utils::remap_cers_to_chars(\$user_query_string);
    $user_query_string = uri_escape_utf8( $user_query_string );
    
    # The common Solr query parameters
    my $USER_Q = qq{q=$user_query_string};
    $USER_Q = "q=*" if ( $USER_Q eq 'q=' && scalar $cgi->multi_param('facet') );

    my $FL = qq{&fl=id,score,rights};
    my $VERSION = qq{&version=} . $self->get_Solr_XmlResponseWriter_version();
    my $START_ROWS = qq{&start=0&rows=1000000};
    my $INDENT = qq{&indent=off};

    # a Solr Filter Query to limit to the collections containing the
    # ids requested or to limit to the collection field itself
    my $FQ;
    my $co = $C->get_object('Collection');
    my $coll_id = $cgi->param('c');

    if ($co->collection_is_large($coll_id)) {    
        $FQ = $self->get_coll_id_FQ();
    }
    else {
        $FQ = $self->get_id_FQ();
    }

    if ( my @facets = $cgi->multi_param('facet') ) {
        foreach my $facet ( @facets ) {
            $FQ .= qq{&fq=$facet};
        }
    }

    if ( $$self{disable_sort} && $USER_Q ne 'q=*' ) {
        $USER_Q =~ s,q=,,;
        $FQ .= qq{&fq=__query__:{!type=edismax}$USER_Q};
        $USER_Q = q{q=*};
    }

    # q=dog*&fl=id,score&fq=coll_id:(276)&$version=2.2,&start=0&rows=1000000&indent=off
    # q=dog*&fl=id,score&fq=extern_id:(mdp.3910534567+OR+mdp.3910523456+OR+mdp.3910512345)&$version=2.2,&start=0&rows=1000000&indent=off

    my $solr_query_string = $USER_Q . $FL . $FQ . $VERSION . $START_ROWS . $INDENT;


    if (DEBUG('query')||DEBUG('all')) {
        my $debug_solr_query_string = $solr_query_string;
        Utils::map_chars_to_cers(\$debug_solr_query_string, [q{"}, q{'}]) if Debug::DUtils::under_server();
        DEBUG('query', qq{Solr query="$debug_solr_query_string"});
        
    }
    return $solr_query_string;
}

# ---------------------------------------------------------------------

=item get_id_FQ

Description

=cut

# ---------------------------------------------------------------------
sub get_id_FQ {
    my $self = shift;

    # a Solr Filter Query to limit to the collections containing the ids requested
    my $id_arr_ref = $self->get_id_arr_ref();
    ASSERT((scalar(@$id_arr_ref) > 0),
           qq{Missing id values for id filter query (fq) construction});

    my $fq_args = join('+OR+', @$id_arr_ref);
    # escape colons in IDs so Solr can parse query
    $fq_args =~ s,:,\\:,g;

    my $FQ = qq{&fq=id:($fq_args)};

    return $FQ;
}

# ---------------------------------------------------------------------

=item get_coll_id_FQ

Description

=cut

# ---------------------------------------------------------------------
sub get_coll_id_FQ {
    my $self = shift;

    # a Solr Filter Query to limit to the collections containing the ids requested
    my $coll_id_arr_ref = $self->get_id_arr_ref();
    ASSERT((scalar(@$coll_id_arr_ref) > 0),
           qq{Missing coll_id values for coll_id filter query construction});

    my $fq_args = join('+', @$coll_id_arr_ref);    
    my $FQ = qq{&fq=coll_id:($fq_args)};

    return $FQ;
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

sub disable_sort {
    my $self = shift;
    $$self{disable_sort} = 1;
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
