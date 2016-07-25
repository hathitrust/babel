package LS::Interleaver;

=head1 NAME

LS::Interleaver

=head1 DESCRIPTION

Abstract class for interleaving two result sets

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

use Utils;


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

Initialize Search::Result object.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    # Subclass:
#    $self->AFTER_Result_initialize(@_);
}

# ---------------------------------------------------------------------
#
# sub get_interleaved

# Wrapper for __get_interleaved that takes 2 result sets and returns interleaved result doc array.
# Extracts result_docs_aray_ref from result objects from result sets a and b.
# calls __get_interleaved and return interleaved docs_array_ref
#
# ---------------------------------------------------------------------
sub get_interleaved
{
    my $self = shift;
    my $C    = shift;
    my $rs_a = shift;
    my $rs_b = shift;
    my $rs_out = shift;
    my $start_row = shift;
    my $num_rows = shift;
    my @params=@_;

    
    my $a_docs_ary   =  $rs_a->{result_response_docs_arr_ref};
    my $b_docs_ary   =  $rs_b->{result_response_docs_arr_ref};
    my $i_docs_ary = $self->__get_interleaved($a_docs_ary,$b_docs_ary,@params);
    my $rs_out = $self->get_slice($C,$start_row,$num_rows,$a_docs_ary,$i_docs_ary,$rs_out);
    return $rs_out;
}
#----------------------------------------------------------------------


#----------------------------------------------------------------------
sub get_slice
{
    my $self = shift;
    my $C    = shift;
    my $start_row = shift;
    my $num_rows = shift;
    my $a_docs_ary = shift;
    my $i_docs_ary = shift;
    my $rs_out = shift;
    
    my $AB_config=$C->get_object('AB_test_config');
    my $N_Interleaved = $AB_config->{'_'}->{'Num_Interleaved_Results'};

    #XXX ccheck for off by one errors below 
    ASSERT($start_row < $N_Interleaved,qq{start row $start_row must be less than N $N_Interleaved});
    #hard coded should be from config file
    my $MAX_SZ = 100;
    ASSERT($start_row +$num_rows < $N_Interleaved+ $MAX_SZ ,qq{start row $start_row plus num_rows $num_rows must be less than N $N_Interleaved plus max sz $MAX_SZ});

    my @A_out=();# empty array
    my $end_row = $start_row + $num_rows;
    my $i_end_row_array_index;
    
    if( $end_row > $N_Interleaved)
    {
	@A_out=self->get_rows_from_A($num_rows,$end_row,$N_Interleaved,$a_docs_ary);
	#end row for extracting from interleaved
	$i_end_row_array_index = $N_Interleaved -1;
    }
    else
    {
	 $i_end_row_array_index = ($start_row + $num_rows) -1;
    }    
    # get subset of $i_docs_ary based on $start_row,$end_row
    my @i_temp = @{$i_docs_ary}[$start_row..$i_end_row_array_index];

    my @out_array=(@i_temp,@A_out);
    my $out_docs_ary=\@out_array;
        
    # insert the docs_array into the interleaved result set object
    # XXX we are bypassing internal methods
    # We probably need a new result set object subclass maybe a mock result set object
    # for now lets just copy the docs and create an array of ids in rank order
    #    $rs_out->{'result_response_docs_arr_ref'}=($out_docs_ary);
    $rs_out->__set_result_docs($out_docs_ary); 
    my $id_ary_ref=[];
    foreach my $doc (@{$out_docs_ary})
    {
     	my $id = $doc->{'id'};
     	push (@{$id_ary_ref},$id);
    }
    $rs_out->__set_result_ids($id_ary_ref);
    
    return $rs_out;
}
#----------------------------------------------------------------------
sub get_rows_from_A
{
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
    my $a_end_row_array_index=($a_start + $A_rows_needed) -1;
    my @A_temp=@{$a_docs_ary};
    my @A_out = @A_temp[$a_start..$a_end_row_array_index];
    return (@A_out);
}

    
#----------------------------------------------------------------------
#
#  sub __get_interleaved
#
#  Takes two arrays and returns an interleaved array
#  Size of returned array is size of smaller of two input arrays
#----------------------------------------------------------------------

sub __get_interleaved
{
    ASSERT(0, qq{get_interleaved() in __PACKAGE__ is pure virtual});
}

sub get_debug_data
{
    my $self = shift;
    return $self->{'debug_data'}
}

sub set_debug_data
{
    my $self = shift;
    my $data = shift;
    $self->{'debug_data'} = $data;
}



sub get_random_seed
{
    my $self= shift;
    return $self->{'seed'};
}


#XXX Think about whether seed should be session based or ip + query based.
# i.e. same person does same query next day
# vs  same person does same query on another computer
#  Just query and num found or query + facets + any other limits etc?
sub set_random_seed
{
    my $self = shift;
    my $seed = shift;
    $self->{'seed'} = $seed;
}


sub get_random_seed_from_data
{
    my $self=shift;
    my $C = shift;
    my $B_Q = shift;  #query object ?  We can get all rel parms here
    my $num_found = shift;
        
    my $cgi = $C->get_object('CGI');

    # OK do we need only the session and q1 param or all relevant result params?
    # better to use correct parts of Solr query
    # TODO: use $B_Q
    #XXX for now use just the query string
    my $query_string = $cgi->param('q1'). $cgi->param('q2'). $cgi->param('q3') . $cgi->param('q4');

    #normalize query
    # remove whitespace?
    my $query=$query_string;
    my $session_id = $C->get_object('Session')->get_session_id();
    my $seed =get_seed($query, $session_id, $num_found);
    return $seed;
}


#XXX temporary subs to be replaced/refactors
#this function should get a different number for each different query
# lets make sure seed is less than max size of int maybe 30,000 is safe?

sub get_seed
{
    my $query     = shift;
    my $session   = shift;
    my $num_found = shift;
    
    #XXX TODO  check if seed for this query/session is cached otherwise calculate it

    #XXX should we separate getting number from query due to possible long queries with utf8 or
    # is mod 10000 sufficient to get minimal collisions
    my $string= $query . $session . $num_found;
    my $seed = get_number_from_string($string);
    return $seed;    
}


sub get_number_from_string
{
    my $string = shift;
    #remove multiple spaces and leading/trailing spaces
    $string=~s/\s+/ /g;
    $string=~s/^\s+//g;
    $string=~s/\s+$//g;
    
    my $num=0;
    
    my @chars=split(//,$string);
    foreach my $char (@chars)
    {
	$num += ord($char);
#	print " $char :\t$num\n";
    }
    if ($num > 10000)
    {
#	print "\n===\nDEBUG $num\n==\n";
	$num = $num % 10000;
    }
    return $num;
}




return 1;
