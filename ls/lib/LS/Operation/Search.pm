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

    my $AB_config=$C->get_object('AB_test_config');
    my $use_interleave=$AB_config->{'_'}->{'use_interleave'};
    my $use_B_query = $AB_config->{'_'}->{'use_B_query'};
    my $N_Interleaved = $AB_config->{'_'}->{'Num_Interleaved_Results'};

    my ($user_solr_start_row, $user_solr_num_rows,$current_sz) = $self->get_solr_page_values($C);
    my ($cgi, $primary_type,$secondary_type)= get_types($cgi);
    my $result_data={};
    
    if (!$use_interleave)
    {
	# Regular A search (or AB search) no interleave
	my $to_search =  {
			  'a'=>1,
			 };
	if($use_B_query)
	{
	    $to_search->{'b'} = 1;
	}
	$result_data=$self->do_queries($C,$to_search,$primary_type,$user_solr_start_row, $user_solr_num_rows);
    }
    else
    {
	# use_interleave
	if ($user_solr_start_row eq 0 || $user_solr_start_row < $N_Interleaved)
	{
	    if ($user_solr_start_row +$user_solr_num_rows > $N_Interleaved)
	    {
		#get results from interleaver for $start_row up to N
		# get results from N to $user_solr_num_rows (end) from A results
		# Calculate
		my $end_row = $user_solr_start_row + $user_solr_num_rows;
		# double check off by 1
		my $A_rows_needed = $end_row - $N_Interleaved;
		my $I_rows_needed =  $user_solr_num_rows - $A_rows_needed;
		ASSERT($A_rows_needed + $I_rows_needed == $user_solr_num_rows,qq{A: $A_rows_needed + I: $I_rows_needed should equal number of rows requested: $user_solr_num_rows} );
		#do regular interleaved query (this will also set counter_A which we need)
		# XXX check for off by 1 XXX consider fancier stuff to avoid doing A query twice
		my $i_start= $N_Interleaved - $I_rows_needed;
		
		my $to_search =  {
				  'a'=>1,
				  'b'=>1,
				  'i'=>1,
				  'i_start_end'=>[$i_start,$I_rows_needed],
				 };
		my $solr_start_row = 0;
		my $solr_num_rows = $N_Interleaved;
		my $i_result_data=$self->do_queries($C,$to_search,$primary_type,$solr_start_row, $solr_num_rows,$N_Interleaved);

		my $debug_output = scalar(@{$i_result_data->{'i_rs'}->{'result_response_docs_arr_ref'}});
	#	ASSERT(0,qq{ $debug_output result docs from interleaver start, rows neede = $i_start $I_rows_needed });

		# 		    #hard coded should be from config file
		# my $global_config = $C->get_object('MdpConfig');
		# my $MAX_SZ = $global_config->get('max_records_per_page');
		# #ASSERT(0,qq{start row $start_row plus num_rows $num_rows must be less than N $N_Interleaved plus max sz $MAX_SZ});   

		#retrieve results from N_Iterleaved to end i.e. A rows needed
		#

		my $counter_a=$self->get_counter_a($C,$N_Interleaved,$primary_type );

		$solr_start_row =$N_Interleaved;
		$solr_num_rows=$A_rows_needed;
		
		my $a_result_data=$self->__do_A_search_from_counter($C,$N_Interleaved,$primary_type,$solr_start_row,$solr_num_rows,$counter_a);

		
		# get doc arrays from both I and A and concatenate
		#  create id arry
		#  shove both into i_rs 
		my @i_array=@{$i_result_data->{'i_rs'}->{'result_response_docs_arr_ref'}};
		my @a_array=@{$a_result_data->{'primary_rs'}->{'result_response_docs_arr_ref'}};
		my @new_i = (@i_array , @a_array);

		# create new_i_rs with the combined i + a results and then
		# replace the old $i_result_data->{i_rs }
	    
		my $new_i_rs =new LS::Result::JSON::Facets('all');
		my $new_i_docs_ary=\@new_i;
		$new_i_rs ->__set_result_docs($new_i_docs_ary);

		my $id_ary_ref=[];
		foreach my $doc (@{$new_i_docs_ary})
		{
		    my $id = $doc->{'id'};
		    push (@{$id_ary_ref},$id);
		}
		$new_i_rs->__set_result_ids($id_ary_ref);
		$i_result_data->{'i_rs'} = $new_i_rs;
		$result_data=$i_result_data;
				
	    }
	    else
	    {
		#get all results from interleaver
		# get slice of interleaved results specifed by user start and num roww
		my $to_search =  {
		      'a'=>1,
		      'b'=>1,
		      'i'=>1,
		      'i_start_end'=>[$user_solr_start_row,$user_solr_num_rows],
		     };
		# set start and num rows for A and B queries to the number we want interleaved
		my $solr_start_row=0;	    
		my $solr_num_rows = $N_Interleaved;
		
	        $result_data=$self->do_queries($C,$to_search,$primary_type,$solr_start_row, $solr_num_rows,$N_Interleaved);
    
		# cache counter_a on session
		my $counter_a = $result_data->{'il_debug_data'}->{'counter_a'};
		my $query_md5 = get_query_md5($C);
		set_cached_object($C, $query_md5, 'counter_a', $counter_a);

		#$result_data=$self->__do_interleave_N($C,$N_Interleaved,$primary_type);
	    }
	}
	else
	{
	    # $user_solr_start_row >=  $N_Interleaved
	    # Return results needed from A results using offset from counter_a
	    # 
	    my $counter_a=$self->get_counter_a($C,$N_Interleaved,$primary_type );
	    	    
	    $result_data=$self->__do_A_search_from_counter($C,$N_Interleaved,$primary_type,$user_solr_start_row,$user_solr_num_rows,$counter_a);
	}	    
    } # end if use_interleave (actually if(!use_interleave) else

    my $primary_Q= $result_data->{'primary_Q'};
    
    my %search_result_data =
        (
         'primary_result_object'   =>   $result_data->{'primary_rs'},
         'secondary_result_object' =>   $result_data->{'secondary_rs'},
	 'B_result_object'         =>   $result_data->{'B_rs'},
	 'interleaved_result_object'=>  $result_data->{'i_rs'},
	 'il_debug_data'           =>   $result_data->{'il_debug_data'},

	 'well_formed'             =>   {
					 'primary'                => $primary_Q->well_formed() ,
					 'processed_query_string' => $primary_Q->get_processed_query_string() ,
					 'unbalanced_quotes' =>$primary_Q->get_unbalanced_quotes() ,
					},
    
	 'user_query_string'       =>   $result_data->{'user_query_string'},
        );

    $act->set_transient_facade_member_data($C, 'search_result_data', \%search_result_data);

    return $ST_OK;
}
# ---------------------------------------------------------------------
sub get_counter_a
{
    my $self = shift;
    my $C = shift;
    my $N_Interleaved = shift;
    my $primary_type = shift;
    
    my $query_md5 = get_query_md5($C);
    my $counter_a = get_cached_object($C, $query_md5,'counter_a');
    
    if(!defined($counter_a))
    {
	# Handle bug where caching failed or edge case where there hasn't
	# been an initial page1 query or session timed out
	# Do regular query for 0.. $N_interleaved results in order to get
	# the last A result i.e. $counter_a
	my $throwaway_result_data=$self->__do_interleave_N($C,$N_Interleaved,$primary_type);
	
	$query_md5 = get_query_md5($C);
	$counter_a = get_cached_object($C, $query_md5,'counter_a');
	ASSERT(defined($counter_a),qq {no cached counter a found} );
    }
    return $counter_a;
}

#----------------------------------------------------------------------
sub get_rows_from_A
{
    #XXX moveed from Interleaver may not be needed
    my $self = shift;
    my $num_rows=shift;
    my $end_row = shift;
    my $N_Interleaved = shift;
    my $a_docs_ary = shift;
    
    my $A_rows_needed;
    my $I_rows_needed;
	
    $A_rows_needed = $end_row - $N_Interleaved;
    $I_rows_needed =  $num_rows - $A_rows_needed;
    ASSERT($A_rows_needed + $I_rows_needed == $num_rows,qq{A: $A_rows_needed + I: $I_rows_needed should equal number of rows requested: $num_rows} );
    # get start and end for extracting from A results
    # counter_a = start
    #XXX move counters out of debug data into something better named
    my $debug_data = $self->get_debug_data();
    my $counter_a=$debug_data->{'counter_a'};
    my $a_start = $counter_a;
    my $a_end_row=($a_start + $A_rows_needed);
    my $a_end_row_array_index = $a_end_row -1;
            
    my @A_temp=@{$a_docs_ary};
    my $A_total_rows = scalar(@A_temp);
    ASSERT($a_end_row < $A_total_rows ,qq{rows requested $a_end_row must be less than the total number of rows < $A_total_rows});
    my @A_out = @A_temp[$a_start..$a_end_row_array_index];
    return (@A_out);
}

#----------------------------------------------------------------------

sub __do_A_search_from_counter
{
    my $self                = shift;
    my $C                   = shift;
    my $N_Interleaved       = shift;
    my $primary_type        = shift;
    my $user_solr_start_row = shift;
    my $solr_num_rows       = shift;
    my $counter_a           = shift;
    
    # get start row based on counter and N_Interleaved and just do an A query
    my $offset= $user_solr_start_row - $N_Interleaved;
    ASSERT($offset >=  0,qq{offset = $offset user start row $user_solr_start_row less then N $N_Interleaved });
    my $solr_start_row= $offset + $counter_a;
    #ASSERT(0,qq{calculated start row is $solr_start_row});
    my $to_search =  {
		      'a'=>1,
		     };
    my $result_data=$self->do_queries($C,$to_search,$primary_type,$solr_start_row, $solr_num_rows);
    $result_data->{'il_debug_data'}->{'a_solr_start_row'} = $solr_start_row;
    return $result_data;
}


# ---------------------------------------------------------------------
#XXX need better name

sub __do_interleave_N
{
    my $self          = shift;
    my $C             = shift;
    my $N_Interleaved = shift;
    my $primary_type  = shift;
    
    # get interleaved results for first N records 
    my $solr_start_row=0;	    
    my $solr_num_rows = $N_Interleaved;
    
    my $to_search =  {
		      'a'=>1,
		      'b'=>1,
		      'i'=>1,
		      'i_start_end'=>[$solr_start_row,$solr_num_rows],
		     # my ($user_solr_start_row, $user_solr_num_rows) = $to_search->{'i_start_end'};
		      
		     };
    
    my $result_data=$self->do_queries($C,$to_search,$primary_type,$solr_start_row, $solr_num_rows,$N_Interleaved);
    
    # cache counter_a on session
    my $counter_a = $result_data->{'il_debug_data'}->{'counter_a'};
    my $query_md5 = get_query_md5($C);
    set_cached_object($C, $query_md5, 'counter_a', $counter_a);
    return $result_data;
}
# ---------------------------------------------------------------------
sub do_queries
{
    my $self              = shift;
    my $C                 = shift;
    my $to_search         = shift;
    my $primary_type      = shift;
    my $solr_start_row    = shift;
    my $solr_num_rows     = shift;
    my $N_Interleaved     = shift;
    my $r={}; #result_data
    
    my $cgi = $C->get_object('CGI');    
    my ($cgi, $primary_type,$secondary_type)= get_types($cgi);
    my $user_query_string = $self->__get_user_query_string($cgi);
    my $searcher= get_searcher($C);
    if($to_search->{'a'} eq 1)
    {
	($r->{'primary_rs'}, $r->{'primary_Q'} )     = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'A');
	($r->{'secondary_rs'}, $r->{'secondary_Q'} ) = $self->do_query($C,$searcher,$user_query_string,$secondary_type,0,0,'A');
    }
    if($to_search->{'b'} eq 1){
	
	($r->{'B_rs'}, $r->{'B_Q'} )                 = $self->do_query($C,$searcher,$user_query_string,$primary_type,$solr_start_row, $solr_num_rows,'B');
    }
    if($to_search->{'i'} eq 1)
    {
	#get originally requested rows to pull from $N_Interleaved results
	#	my ($user_solr_start_row, $user_solr_num_rows,$current_sz) = $self->get_solr_page_values($C);
	my $user_solr_start_row = $to_search->{'i_start_end'}->[0];
	my $user_solr_num_rows  = $to_search->{'i_start_end'}->[1];
	
	
	($r->{'i_rs'}, $r->{'il_debug_data'} )       = $self->do_interleaved_query($C,$r->{'primary_rs'}, $r->{'secondary_rs'},$r->{'B_rs'},$r->{'B_Q'},$user_solr_start_row,$user_solr_num_rows);

    }
    
    $r->{'user_query_string'} = $user_query_string;
    return($r);
}
# ---------------------------------------------------------------------
sub get_searcher
{
    my $C = shift;
    my $config = $C->get_object('MdpConfig');
    # Randomize primary shard
    my $engine_uri = Search::Searcher::get_random_shard_solr_engine_uri($C);
    my $timeout = $config->get('ls_searcher_timeout');
    my $searcher = new LS::Searcher::Facets($engine_uri, $timeout, 1);
    return $searcher;
}


# ---------------------------------------------------------------------
sub do_query{
    my $self= shift;
    my $C = shift;
    my $searcher = shift;
    my $user_query_string = shift;
    my $query_type = shift;
    my $start_row =shift;
    my $num_rows = shift;
    my $AB = shift;
    
    
    my $Q = new LS::Query::Facets($C, $user_query_string, undef, 
                                       {
                                        'solr_start_row' => $start_row,
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
#
#   XXX TODO:  fix this documentation!
#  Notes on do_interleaved_query
    # We need a result set object, but won't populate it by searching
# populate by interleaving results and copying stuff from real result sets
# 1 get N_Interleaved results for A and B queries
#   We need more than N_Interleaved results from each of A and B due to dupes so
#    we ask A and B to each get N_Interleaved
# 2) interleave them to produce set of N_Interleaved results
# 3) currently we don't cache this
# 4) calculate sub-set of interleaved results needed and provide interleaver with start and end rows based on paging info
# 5) Interleaver gets subset of interleaved results and returns it
# 6) XXX need to verify that if asked for start < N and end > N that interleaver will grab 
# appropriate results from A.  Also need to make sure that N results from the A query will satisfy any possible start < N and end > N within allowed page size limits
# 7XXX need to figure out how to populate click logs with
# a) A and B id lists?
# b) interleaved id list
# Do we return A and B from 0 to end row?

# we tell the interleaver object the start and end 

    # get subset of $all_docs_ary based on $start_row,$num_rows# array_index - numrows-1
    #XXX WARNING  if we decide to cache whole result set we need to do something
    # different
    # current code below interleaves N results and then grabs appropriate sub-set
    # Consider having two object on the rs object
    #  1  sub set stored in result_response_docs_arr_ref so it looks like any other rs
    #  2 full result set stored in "full_result_response_docs_arr_ref"

# ---------------------------------------------------------------------
sub do_interleaved_query
{
    my $self         = shift;
    my $C            = shift;
    my $primary_rs   = shift;
    my $secondary_rs = shift;
    my $B_rs         = shift;
    my $B_Q          = shift;
    my $start_row =shift;
    my $num_rows = shift;

    
    #    my $num_rows_primary_rs=scalar(@{$primary_rs->{'result_ids'}});
   # ASSERT($num_rows_primary_rs == $N_Interleaved,qq{A and B must have N=$N_interleaved rows not $num_rows_primary_rs rows});

    my $AB_config=$C->get_object('AB_test_config');
    my $interleaver_class = $AB_config->{'_'}->{'interleaver_class'};
    my $IL = new $interleaver_class;


    my $num_found = $self->get_all_num_found($primary_rs, $secondary_rs);#XXX consider using md5 cgi    
    my $seed = $IL->get_random_seed_from_data($C,$B_Q,$num_found);
    $IL->set_random_seed($seed);
      
    
    my  $i_rs = new LS::Result::JSON::Facets('all'); 
    $i_rs = $IL->get_interleaved($C,$primary_rs,$B_rs,$i_rs, $start_row,$num_rows,'random' );
    my $il_debug_data ;
    $il_debug_data = $IL->get_debug_data();
      
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
    $temp_cgi->delete('sz','pn','debug');

    my $md5 = md5_hex($temp_cgi->query_string);
    
    return $md5;
}
#----------------------------------------------------------------------
#XXX foobar
#   consider whether to consolidate these two caching functions
sub set_cached_object
{
    my $C     = shift;
    my $q_md5 = shift;
    my $object_name    = shift;
    my $object = shift;
    my $key = $q_md5 . $object_name;
    
    my $ses   = $C->get_object('Session');
    $ses->set_persistent($key, $object) ;
}

#----------------------------------------------------------------------
sub get_cached_object
{
    my $C     = shift;
    my $q_md5 = shift;
    my $object_name    = shift;
    my $key = $q_md5 . $object_name;
    my $ses = $C->get_object('Session');
    my $rs = $ses->get_persistent($key) ;
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

