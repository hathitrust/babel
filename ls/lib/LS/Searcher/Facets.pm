package LS::Searcher::Facets;


=head1 NAME

LS::Searcher::Facets (searcher)

=head1 DESCRIPTION

This class does X.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Search::Searcher);

use LS::Result::JSON::Facets;
use LS::Query::Facets;
use Debug::DUtils;

# ---------------------------------------------------------------------

=item PUBLIC: get_populated_Solr_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_populated_Solr_query_result {
    my $self = shift;
    my ($C, $Q, $rs,$AB) = @_;

    
    my $query_string = $Q->get_Solr_query_string($C,$AB);

    return $self->__Solr_result($C, $query_string, $rs,$AB);
}

# ---------------------------------------------------------------------
# HACK XXX overide Search::Searcher::__Solr_result
# copied from base class
#XXX   look up how to delegate to super in perl OOP
# don't really need to do this explicitly, but seems better.

sub __Solr_result {
    my $self = shift;
    my ($C, $query_string, $rs, $AB) = @_;

    my $url = $self->__get_Solr_select_url($C, $query_string, $AB);
    my $req = $self->__get_request_object($url);
    my $ua = $self->__create_user_agent();

    if (DEBUG('query')) {
        my $d = $url;
        Utils::map_chars_to_cers(\$d, [q{"}, q{'}]) if Debug::DUtils::under_server();;
        DEBUG('query', qq{Query URL: $d});
    }
    my ($code, $response, $status_line, $failed_HTTP_dump) = $self->__get_query_response($C, $ua, $req);

    $rs->ingest_Solr_search_response($code, \$response, $status_line, $failed_HTTP_dump);

    return $rs;
}

# HACK XXX overide Search::Searcher::__get_Solr_select_url
# here we can either overide more stuff or hack the shards param and engine url
# but we need to know AB here
# can we store it on context object instead of passing it around?
# ---------------------------------------------------------------------
sub __get_Solr_select_url {
    my $self = shift;
    my ($C, $query_string, $AB) = @_;

    my $shards_param = $self->use_ls_shards() ? $self->__get_LS_Solr_shards_param($C) : undef;
    my $primary_engine_uri = $self->get_engine_uri();
    #XXX Hack  should at least read config file to get core name of B
    if ($AB eq 'B')
    {
	my $AB_config=$C->get_object('AB_test_config');
	my $B_core_name = $AB_config->{'_'}->{'B_core_name'};
	my $A_core_name = $AB_config->{'_'}->{'A_core_name'};
	
	#get B core name
	# replace it
	$shards_param =~s/$A_core_name/$B_core_name/g;
	$primary_engine_uri =~s/$A_core_name/$B_core_name/g;

    }
    
    
    my $script = $C->get_object('MdpConfig')->get('solr_select_script');
    my $url = 
        $primary_engine_uri 
            . $script 
                . '?' 
                  . (defined($shards_param) ? "${shards_param}&" : '')
                    . $query_string;

    return $url;
}



# ---------------------------------------------------------------------
# ---------------------------------------------------------------------
=item get_Solr_internal_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_internal_query_result {
    my $self = shift;
    my ($C, $Q, $rs) = @_;    

    my $query_string = $Q->get_Solr_internal_query_string();
    return $self->__Solr_result($C, $query_string, $rs);
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu
Tom Burton-West,University of Michigan, tburtonw@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

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
