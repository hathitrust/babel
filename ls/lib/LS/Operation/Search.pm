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

use Digest::MD5 qw(md5 md5_hex);


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
use LS::Interleaver::AA;


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
    
    my ($cgi, $primary_type,$secondary_type)= get_types($cgi);

    my $AB_config=$C->get_object('AB_test_config');
    my $use_interleave=$AB_config->{'_'}->{'use_interleave'};
    my $use_B_query = $AB_config->{'_'}->{'use_B_query'};
    my $N_Cached = $AB_config->{'_'}->{'Num_Cached_Results'};
    # Paging: Solr doc number is 0-relative
    my ($user_solr_start_row, $user_solr_num_rows,$current_sz) = $self->get_solr_page_values($C);
    #default no interleave so regular paging
    my  $solr_start_row = $user_solr_start_row;
    my  $solr_num_rows  = $user_solr_num_rows;

    my ($primary_rs, $primary_Q);
    my ($secondary_rs, $secondary_Q);
    my $B_rs;
    my $B_Q;  # do we need to save B query if we are doing query expansion?
    my $i_rs;  # we will put truncated result set here
    my $il_debug_data;

    if ( $use_B_query)
    {
	($B_rs,$B_Q)= $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'B');
    }
    
    if ($use_interleave)
    {
	if ($user_solr_start_row eq 0 || $user_solr_start_row + $current_sz < $N_Cached)
	{
	    # check for off by 1 error < N_Cached
	    # get interleaved results for first N records and cache them
	    # check for cached results
	    my $query_md5 = get_query_md5($C,$cgi);
	    my $cached_rs = get_cached_rs($C,$query_md5);
	    
	    if (!defined($cached_rs))
	    {
	     	$solr_num_rows = $N_Cached;
	     	($primary_rs, $primary_Q)   = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'A');
	     	($secondary_rs, $secondary_Q) = $self->do_query($C,$searcher,$user_query_string,$secondary_type,0,0,'A');
		($B_rs,$B_Q)= $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'B');
		
		($i_rs,$il_debug_data)= $self->do_interleaved_query($C,$primary_rs,$secondary_rs,$B_rs,$B_Q);
		#cache whole rs
		set_cached_rs($C, $query_md5,$i_rs);
		# set start and sz for this query on rs
		$i_rs->set_start($user_solr_start_row);
		$i_rs->set_num_rows($user_solr_num_rows);
	    }
	    else
	    {
		$i_rs = $cached_rs;
		$i_rs->set_start($user_solr_start_row);
		$i_rs->set_num_rows($user_solr_num_rows);
	    }
	    #XXX moved to list search results
	    # for now grab only a page worth of results from $full_i_rs
	    #$i_rs=get_page_of_results($full_i_rs,$user_solr_start_row, $current_sz);
	}
	
	elsif ($user_solr_start_row + $current_sz >$N_Cached)
	{
	    if($user_solr_start_row < $N_Cached)
	    {
		# get rows from start row to N_Cached from cache then get rest from a query
	    }
	    else
	    {
		# just do A query but calculate from the A pointer as a start?
		#i.e. if N =1000 and A pointer=505, then start A query at 506 i.e. subtract 500 and then add offset?
	    }
	    
	  #  does this include already subtracting 1
	   # i.e. if N = 100 and we ask for rows 50-150?
	   # calculate start row based on cached counters
	   # i.e. whatever it would be normally - (100-counter)
	}
#    my ($solr_start_row, $solr_num_rows) = $self->get_solr_page_values($C);	
	# my $solr_start_row = ($current_page - 1) * $current_sz;
#	    my $solr_num_rows = $current_sz;
	# Check if we already have cashed info
    }
    else
    {
	($primary_rs, $primary_Q)   = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'A');
	($secondary_rs, $secondary_Q) = $self->do_query($C,$searcher,$user_query_string,$secondary_type,0,0,'A');
    }
    #XXX do we truncate result set here leaving ListSearchResults and the PI filler ignorent or put the paging stuff there
    # for now list search results should take responsibility!

    
    
    my %search_result_data =
        (
         'primary_result_object'   => $primary_rs,
         'secondary_result_object' =>$secondary_rs,
	 'B_result_object'         =>$B_rs,
	 'interleaved_result_object'=>$i_rs,
	 'il_debug_data'           =>$il_debug_data,
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
sub do_interleaved_query
{
    my $self         = shift;
    my $C            = shift;
    my $primary_rs   = shift;
    my $secondary_rs = shift;
    my $B_rs         = shift;
    my $B_Q          = shift;
        
    my $AB_config=$C->get_object('AB_test_config');
    my $interleaver_class = $AB_config->{'_'}->{'interleaver_class'};
    my $IL = new $interleaver_class;
    my $num_found = $self->get_all_num_found($primary_rs, $secondary_rs);    

    my $seed = $IL->get_random_seed_from_data($C,$B_Q,$num_found);
    $IL->set_random_seed($seed);
    
    
    # We need a result set object, but won't populate it by searching
    # populate by interleaving results and copying stuff from real result sets
    
    my  $i_rs = new LS::Result::JSON::Facets('all'); 
    $i_rs = $IL->get_interleaved($primary_rs,$B_rs,$i_rs, 'random' );
    my $il_debug_data ;
    
    if (DEBUG('AB'))
    {
	$il_debug_data = $IL->get_debug_data();
    }
    return($i_rs,$il_debug_data);
    
}

# ---------------------------------------------------------------------





sub get_types
{
    my $cgi = shift;
    
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
    return ($cgi, $primary_type,$secondary_type);
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

    return ($solr_start, $solr_rows, $current_sz);
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
# sub get_all_num_found
# return number of hits for all query
#----------------------------------------------------------------------
sub get_all_num_found
{
    my $self         = shift;
    my $primary_rs   = shift;
    my $secondary_rs = shift;
    my $num_found;
    
    if ($primary_rs->{'result_type'} eq 'all')
    {
	$num_found = $primary_rs->{'num_found'}
    }
    else
    {
	$num_found = $secondary_rs->{'num_found'}
    }
    return $num_found;
}

#----------------------------------------------------------------------
sub get_query_md5
{
    my $C = shift;
    my $cgi = shift;
    my $ses = $C->get_object('Session');
    # get only cgi params we want like sz pn what else?
    my $temp_cgi = new CGI($cgi);
    # remove params we don't want
    # insert code here XXX
    my $md5=md5_hex($temp_cgi);
    return $md5;
}
#----------------------------------------------------------------------
sub set_cached_rs
{
    my $C     = shift;
    my $q_md5 = shift;
    my $rs    = shift;
    my $ses   = $C->get_object('Session');
    $ses->set_persistent($q_md5, $rs) ;
}

#----------------------------------------------------------------------
sub get_cached_rs
{
    my $C     = shift;
    my $q_md5 = shift;
    my $ses = $C->get_object('Session');
    my $rs = $ses->get_persistent($q_md5) ;
}

#----------------------------------------------------------------------
sub get_page_of_results
{
    my $full_i_rs = shift;
    my $user_solr_start_row = shift;
    my $current_sz = shift;
    my $page_rs =[];
    
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

