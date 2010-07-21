package LS::Searcher::FullText;



=head1 NAME

LS::Searcher::FullText (searcher)

=head1 DESCRIPTION

This class does X.

=head1 VERSION

$Id: FullText.pm,v 1.4 2009/11/13 22:08:39 pfarber Exp $

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Search::Searcher;
use base qw(Search::Searcher);

use LS::Result::FullText;
use LS::Query::FullText;


# ---------------------------------------------------------------------

=item PUBLIC: get_populated_Solr_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_populated_Solr_query_result
{
    my $self = shift;
    my ($C, $Q, $rs) = @_;

    my $query_string = $Q->get_Solr_query_string($C);

    return $self->__Solr_result($C, $query_string, $rs);
}

# ---------------------------------------------------------------------

=item get_Solr_internal_query_result

Description

=cut

# ---------------------------------------------------------------------
sub get_Solr_internal_query_result
{
    my $self = shift;
    my ($C, $Q, $rs) = @_;    

    my $query_string = $Q->get_Solr_internal_query_string();
    return $self->__Solr_result($C, $query_string, $rs);
}


# ---------------------------------------------------------------------

=item __get_Solr_select_url

Description: OVERRIDE of Search::Searcher to support multi-shard
parameters.

=cut

# ---------------------------------------------------------------------
sub __get_Solr_select_url
{
    my $self = shift;
    my ($C, $query_string) = @_;

    my $config = $C->get_object('MdpConfig');
    my @num_shards_list = $config->get('num_shards_list');

    my @shard_engine_uris = $config->get('mbooks_solr_engines');
    my @active_shard_engine_uris;
    foreach my $shard (@num_shards_list) {
        push(@active_shard_engine_uris, $shard_engine_uris[$shard-1]);
    }
    map {$_ =~ s,^http://,,} @active_shard_engine_uris;

    my $shards_param = 'shards=' . join(',', @active_shard_engine_uris);
    my $primary_engine_uri = $self->get_engine_uri();
    my $script = $C->get_object('MdpConfig')->get('solr_select_script');
    my $url = 
        $primary_engine_uri 
            . $script 
                . '?' 
                    . $shards_param
                        . '&' . $query_string;

    return $url;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

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
