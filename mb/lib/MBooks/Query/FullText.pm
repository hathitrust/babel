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
use MBooks::FacetConfig;
use URI::Escape;

use base qw(Search::Query);

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
    my $facet_config = $C->get_object('FacetConfig');
    $self->{'facet_config'} = $facet_config;
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
    my $WRITER = '&wt=json&json.nl=arrarr';

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

    # do we need to rename facet_config since it contains more than just facet config info?
    my $config = $self->get_facet_config;  
    
    # get date type (date|both) both = enum cron date if exists otherwise bib date
    my $date_type= $self->get_date_type;
    my $FACETS = $self->__get_facets;

    my $FACETQUERY = "";
    my @facetquery = $cgi->multi_param('facet');

    if (@facetquery) {
        foreach my $fquery (@facetquery) {

            #change datequery to proper type if using date=both
            if ( $date_type eq "both" && $fquery =~ /publishDateRange/ ) {
                $fquery =~ s/publishDateRange/bothPublishDateRange/g;
            }

            my $cleaned_fquery = $self->__clean_facet_query($fquery);
            $FACETQUERY .= '&fq=' . $cleaned_fquery;
        }
    }

    if ( $$self{disable_sort} && $USER_Q ne 'q=*' ) {
        $USER_Q =~ s,q=,,;
        $FQ .= qq{&fq=__query__:{!type=edismax}$USER_Q};
        $USER_Q = q{q=*};
    }

    # q=dog*&fl=id,score&fq=coll_id:(276)&$version=2.2,&start=0&rows=1000000&indent=off
    # q=dog*&fl=id,score&fq=extern_id:(mdp.3910534567+OR+mdp.3910523456+OR+mdp.3910512345)&$version=2.2,&start=0&rows=1000000&indent=off

    my $solr_query_string = $USER_Q . $FL . $FQ . $FACETS . $FACETQUERY . $VERSION . $WRITER . $START_ROWS . $INDENT;


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

sub get_facet_config
{
    my $self = shift;
    return $self->{'facet_config'}
}
# ---------------------------------------------------------------------
sub get_date_type
{
    my $self =shift;
    my $config=$self->get_facet_config;
    my $date_type=$config->{date_type};
    if (DEBUG('enum'))
    {
	$date_type='both';
    }
    return $date_type;
}

sub __get_facets {
    my $self = shift;
    my $FACETS;
    my $facet_config = $self->get_facet_config;
    my $FACET_LIMIT  = $facet_config->get_facet_limit;

    my $facetfields = $facet_config->get_facet_order();
    my $FACET_FIELDS;
    my $date_type = $self->get_date_type;

    foreach my $field ( @{$facetfields} ) {

        #date fix
        if ( $field eq "publishDateRange" && $date_type eq 'both' ) {
            $field = 'bothPublishDateRange';
        }

        $FACET_FIELDS .= '&facet.field=' . $field;
    }

    $FACETS .=
        '&facet.mincount=1&facet=true&facet.limit='
      . $FACET_LIMIT
      . $FACET_FIELDS;
    return $FACETS;
}

sub __clean_facet_query
{
    my $self = shift;
    my $fquery = shift;
    
    my $cleaned;
    #facet=language:%22German%22
    my ($field,@rest)=split(/\:/,$fquery);
    my $string=join(':',@rest);
    # remove leading and trailing quotes
    $string=~s/^\"//;
    $string=~s/\"$//;
    #XXX order dependent.  Must remove escape backslashes in string before adding backslashes to double or single quotes
    # backslash
    $string=~s/\\/\\\\/g;  

  # back slash escape any quotes or backslashes
    # XXX what about other lucene chars?
    $string=~s/\"/\\\"/g;
    #single quotes
   # $string=~s/\'/\\\'/g;  
  
    # replace leading and trailing quotes
    $string = '"'. $string . '"';
        
    Utils::remap_cers_to_chars(\$string);
    # XXX Need to hex escape question mark and then protect it with a backslash, note Solr is ok if fed a question mark
    # code in Search::Searcher::__get_request_object splits a URL on "?" so leaving a non-hex-escaped queston mark
    # will cause the split to truncate the query. uri escape will take care of it
  
    # Note: facet fields mostly? all? type string which is not analyzed
    # So we should hexencode url chars and then escape the rest
    # Lucene special chars are: + - && || ! ( ) { } [ ] ^ " ~ * ? : \
    # dismax seems to not have problems with lucene special chars in fq esp if they are url encoded
    my $escaped_string=URI::Escape::uri_escape_utf8($string);
    
    $cleaned=$field . ':' . $escaped_string;
    return $cleaned;
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
