package LS::Operation::Search;

=head1 NAME

LS::Operation::Search (op)

=head1 DESCRIPTION

This class Search implementation of the abstract Operation
class.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# MDP Modules
use Operation;
use base qw(Operation);

use Utils;
use Debug::DUtils;
use Utils::Logger;
use Operation::Status;
use Search::Searcher;

#use LS::Query::FullText;
use LS::Query::Facets;
use LS::Result::Facets;
use LS::Searcher::Facets;

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize LS::Operation::Search.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for Search action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="Search"});

    my $cgi = $C->get_object('CGI');
    my $act = $self->get_action();

    # Execute the Action's Operations if there is a query to
    # perform. At this point there will be due to COntroller.
    my $user_query_string = $cgi->param('q1');

    my $config = $C->get_object('MdpConfig');
    # Randomize primary shard
    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $timeout = $config->get('ls_searcher_timeout');
    my $searcher = new LS::Searcher::Facets($engine_uri, $timeout, 1);
    
    # Paging: Solr doc number is 0-relative
    my ($solr_start_row, $solr_num_rows) = $self->get_solr_page_values($C);

    my  $lmt_2_query_type = {
                             'ft'=>'full_text',
                             'so'=>'search_only',
                             'all'=>'all',
                             'default'=>'all',
                            };
    
    my $primary_type; # primary type to get actual search results
    if (defined ($cgi->param('lmt') ) )
    {
        $primary_type = $lmt_2_query_type->{$cgi->param('lmt')}
    }
    else
    {
        $primary_type= $lmt_2_query_type->{'default'}
    }
    # secondary type to just get counts, default=full_text and can use math to get search only:
    #  all - full_text = search_only.   We just need to make sure we have an "all" count and one or the other of so|ft
    my $secondary_type ='full_text';  
    if ($primary_type ne 'all')
    {
        $secondary_type = 'all';
    }


    my ($primary_rs, $primary_Q)   = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows);
    my ($secondary_rs, $secondary_Q) = $self->do_query($C,$searcher,$user_query_string,$secondary_type,0,0);

    my %search_result_data =
        (
         'primary_result_object'   => $primary_rs,
         'secondary_result_object' =>$secondary_rs,
         'well_formed' => {
                           'primary'                => $primary_Q->well_formed() ,
                           'processed_query_string' => $primary_Q->get_processed_query_string() ,
                          },
        );

    $act->set_transient_facade_member_data($C, 'search_result_data', \%search_result_data);

    return $ST_OK;
}


# ---------------------------------------------------------------------
sub do_query{
    my $self= shift;
    my $C = shift;
    my $searcher = shift;
    my $user_query_string = shift;
    my $query_type = shift;
    my $start_rows =shift;
    my $num_rows = shift;
    
    my $Q = new LS::Query::Facets($C, $user_query_string, undef, 
                                       {
                                        'solr_start_row' => $start_rows,
                                        'solr_num_rows' => $num_rows,
                                        'query_type' => $query_type ,
                                       });

    my $rs = new LS::Result::Facets($query_type);
    $rs = $searcher->get_populated_Solr_query_result($C, $Q, $rs);
    
    #    Log
    $Q->log_query($C, $searcher, $rs, 'ls');
    return ($rs,$Q);
}

# ---------------------------------------------------------------------


=item get_solr_page_values

Description

=cut

# ---------------------------------------------------------------------
sub get_solr_page_values
{
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig');
    my $cgi = $C->get_object('CGI');

    my $current_page = $cgi->param('pn') || 1;
    my $current_sz = $cgi->param('sz') || $config->get('default_records_per_page');

    my $solr_start = ($current_page - 1) * $current_sz;
    my $solr_rows = $current_sz;

    return ($solr_start, $solr_rows);
}


# ---------------------------------------------------------------------

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

