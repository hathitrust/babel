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
use LS::Result::JSON::Facets;
use LS::Searcher::Facets;
use LS::Interleaver::Balanced;


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
    my $user_query_string = $self->__get_user_query_string($cgi);

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
                            };
    
    my $primary_type; # primary type to get actual search results
    my $lmt = $cgi->param('lmt');
    #  XXX This is needed per current UI which sends no lmt param when full veiw box is unchecked
    # TODO: rewrite UI logic so lmt=all is sent if full view box is unchecked and then change
    # line below to $lmt='ft'

    if (!defined($lmt))
    {
        $lmt='all';
    }
    
    if ($lmt=~/^(ft|so|all)$/) 
    {
        $primary_type = $lmt_2_query_type->{$lmt}
    }
    else
    {
        #This sets the default to be full-text and sets the cgi lmt to ft for UI purposes
        $cgi->param('lmt','ft');
        $primary_type= $lmt_2_query_type->{'ft'}
    }
    # secondary type to just get counts, default=full_text and can use math to get search only:
    #  all - full_text = search_only.   We just need to make sure we have an "all" count and one or the other of so|ft
    my $secondary_type ='full_text';  
    if ($primary_type ne 'all')
    {
        $secondary_type = 'all';
    }


    my ($primary_rs, $primary_Q)   = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'A');
    my ($secondary_rs, $secondary_Q) = $self->do_query($C,$searcher,$user_query_string,$secondary_type,0,0,'A');

    my $AB_config=$C->get_object('AB_test_config');
    my $use_interleave=$AB_config->{'_'}->{'use_interleave'};
    my $use_B_query = $AB_config->{'_'}->{'use_B_query'};
    
    # should read config file to determine whether or not to do a B query
    my $B_rs;
    my $B_Q;  # do we need to save B query if we are doing query expansion?
    my $i_rs;

    if ($use_interleave || $use_B_query)
    {
	($B_rs,$B_Q)= $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'B');
    }
    
# Read config file to decide whether to interleave at all
# Will need to read again at display time? or not?


    if ($use_interleave)
    {

	my $AB_config=$C->get_object('AB_test_config');
	my $interleaver_class = $AB_config->{'_'}->{'interleaver_class'};
	my $IL = new $interleaver_class;
	
	# We need a result set object, but won't populate it by searching
	# populate by interleaving results and copying stuff from real result sets
	
	$i_rs = new LS::Result::JSON::Facets('all'); 
	$i_rs = $IL->get_interleaved('random',$primary_rs,$B_rs,$i_rs );
    }
    

    my %search_result_data =
        (
         'primary_result_object'   => $primary_rs,
         'secondary_result_object' =>$secondary_rs,
	 'B_result_object'         =>$B_rs,
	 'interleaved_result_object'=>$i_rs,
         'well_formed' => {
                           'primary'                => $primary_Q->well_formed() ,
                           'processed_query_string' => $primary_Q->get_processed_query_string() ,
                           'unbalanced_quotes' =>$primary_Q->get_unbalanced_quotes() ,
                          },
	 'user_query_string' =>$user_query_string,
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
    my $AB = shift;
    
    
    my $Q = new LS::Query::Facets($C, $user_query_string, undef, 
                                       {
                                        'solr_start_row' => $start_rows,
                                        'solr_num_rows' => $num_rows,
                                        'query_type' => $query_type ,
                                       });

    my $rs = new LS::Result::JSON::Facets($query_type);
    $rs = $searcher->get_populated_Solr_query_result($C, $Q, $rs,$AB);
    
    #    Log
    $Q->log_query($C, $searcher, $rs, 'ls',$AB);
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
    #my $requested_pn = $current_page;
    
    my $current_sz = $cgi->param('sz') || $config->get('default_records_per_page');

    # set deep paging limits
    ($current_page,$current_sz)=__limit_paging($config,$current_page,$current_sz);

    #XXX consider setting flag with pn requested
    # if ($requested_pn != $current_page)
    # {
    # 	$cgi->param('requested_pn', $requested_pn);
    # }

    # reset CGI object
    $cgi->param('pn', $current_page);
    $C->set_object('CGI', $cgi);

    my $solr_start = ($current_page - 1) * $current_sz;
    my $solr_rows = $current_sz;

    return ($solr_start, $solr_rows);
}


# ---------------------------------------------------------------------
sub __limit_paging
{
    # reset pn param to limit according to max_rows set in config file
    #XXX do we want to log pn attempts over the limit?
    my $config = shift;
    my $pn = shift;
    my $sz = shift;
    my $max_rows = $config->get('max_rows');
    my $default_sz =$config->get('default_records_per_page');
    my $rows = $pn * $sz;
    my $max_pn = int($max_rows/$default_sz);

    if (defined $sz && $sz != 0)
    {
	$max_pn = int($max_rows/$sz);
    }

    unless ($pn < $max_pn) {
	$pn = $max_pn
    }
    return ($pn,$sz);
}



# ---------------------------------------------------------------------
sub __get_user_query_string
{
    my $self = shift;
    my $cgi  = shift;
    
    my $user_query_string = $cgi->param('q1')||$cgi->param('q2')||$cgi->param('q3')||$cgi->param('q4');

    return $user_query_string;
}
#----------------------------------------------------------------------


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

