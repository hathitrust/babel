package LS::Result::JSON; 

use strict;

use JSON::XS;
use Utils;
use base qw(Search::Result);

# ---------------------------------------------------------------------
#  Overide base class because we need to parse json to get these things
# XXX tbw
#   maybe base class should use methods to parse these things and call a parser object that
# would know how to parse the response


# ---------------------------------------------------------------------
sub ingest_Solr_search_response
{
    my $self = shift;
    my ($code, $Solr_response_ref, $status_line, $failed_HTTP_dump) = @_;

    my $http_status_ok = ($code eq '200');

    my ($max_score, $num_found, $query_time) = (0, 0, 0.0);

    if ($http_status_ok)
    {

        ($query_time,$max_score,$num_found) = $self->parse_JSON_results($Solr_response_ref);
        #XXX what if these are undefined when returning?
        # QTime (query time in milliseconds)
        $query_time = sprintf("%.3f", $query_time/1000);

        # Max score
        $max_score = $max_score ? $max_score : 0.0;

        # Hits
        $num_found = $num_found ? $num_found : 0;
    }

    $self->{'http_status_ok'} = $http_status_ok;
    $self->{'response_code'} = $code;
    $self->{'status_line'} = $status_line;
    $self->{'query_time'} = $query_time;
    $self->{'max_score'} = $max_score;
    $self->{'num_found'} = $num_found;
    # May be overridden for queries that limit by rows
    $self->{'rows_returned'} = $num_found;
    $self->{'failed_HTTP_dump'} = $failed_HTTP_dump;

    # In Subclass:
    if ($http_status_ok)
    {
        $self->AFTER_ingest_Solr_search_response($Solr_response_ref);
    }
}

# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
sub parse_JSON_results
{   
    my $self = shift;
    my $Solr_response_ref = shift;
    my $coder = JSON::XS->new->ascii->pretty->allow_nonref;
    my $parsed = $coder->decode ($$Solr_response_ref);
    
       # QTime (query time in milliseconds)
         my  $query_time = $parsed->{responseHeader}->{QTime};

        # Max score
        my ($max_score) = ($parsed->{response}->{maxScore});
        # Hits
        my ($num_found) = ($parsed->{response}->{numFound});

    return ($query_time,$max_score,$num_found);

}

# ---------------------------------------------------------------------
#
1;

