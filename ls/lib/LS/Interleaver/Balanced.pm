package LS::Interleaver::Balanced;

=head1 NAME

LS::Interleaver::Balanced

=head1 DESCRIPTION

Implementation of the Balanced Interleaving algorithm
based on what? lerot or yue sample code or what paper?

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
#use Utils;
use base qw(LS::Interleaver);


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

# XXXTODO:
# consider moving this to base class!
# i.e. base class should handle creating rs with values from a and b and then subclass should provide interleaved set

# wrapper for __get_interleaved that takes 2 result sets and returns interleaved result set
# change signature so we get self, a, b and then any interleave specific params in @

sub get_interleaved
{
    my $self = shift;
    my $start = shift;  # (random|fixed); #fixed = always start with first list
    
    #WARNING $rs is not a result set object its the 
    my $rs_a = shift;
    my $rs_b = shift;
    my $rs_out = shift;
    
    # extract $rs->{result_response_docs_arr_ref} from input result sets and get interleaved result_response_docs_arr_ref
    my $a_docs_ary   =  $rs_a->{result_response_docs_arr_ref};
    my $b_docs_ary   =  $rs_b->{result_response_docs_arr_ref};
    my $out_docs_ary = $self->__get_interleaved($start,$a_docs_ary,$b_docs_ary);
        
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
    
    

    # Commented code below is attempt to copy other data from rs_a to interleaved object
    # I think we only need rs_B query time to get the cost of doing the additional query
    # What about scores for A and B? do we care
    # copy various values from result set a to interleaved result set object
    # See setter methods in /htapps/tburtonw.babel/ls/lib/LS/Result/JSON/Facets.pm
    #  XXX Is there any other part of the result set for a and b that we need to keep?
    # replace result_response_docs_arr_ref and replace with inteleaved $out_docs_ary
    # copy fields except  result_response_docs_arr_ref to $rs_out
    # use $out_docs_array for $rs_out->result_response_docs_arr_ref
    # add b_key for various keys to $rs_out
    # my $rs_out = {};
    # # OK here is the problme $rs_a is actually a result set object
    # foreach my $key (keys %{$rs_a})
    # {
    # 	if ($key eq "result_response_docs_arr_ref")
    # 	{
    # 	    $rs_out->{result_response_docs_arr_ref} = $out_docs_ary;
    # 	}
    # 	else
    # 	{
    # 	    $rs_out->{$key} = $rs_a->{$key};
    # 	}
    # }
        
    # # add various b keys
    # my $bkey;
    # my @keys= qw(result_ids result_scores num_found max_score query_time response_code);
    # foreach my $key  (@keys)
    # {
    # 	$bkey= 'b_' . $key;
    # 	$rs_out->{$bkey}=$rs_b->{$key};
    # }
    return $rs_out;
}

# ---------------------------------------------------------------------
#
#   Does method have to know what's inside arraref?
#
# ---------------------------------------------------------------------
sub __get_interleaved
{
    my $self = shift;
    my $start = shift;  # (random|fixed); #fixed = always start with first list

    #WARNING $rs is not a result set object its the $rs->{result_response_docs_arr_ref}
    #WARNING #2   These end up being pointers to the result set objects not deep copies
    # So if we mess with them, and later on want to use set a or b they are messed up

    my $rs_a = shift;
    my $rs_b = shift;

    my $rs_out=[];
    
    #hashrefs for testing if an id is in the result set
    my $ids_a = __get_id_hashref($rs_a);
    my $ids_b = __get_id_hashref($rs_b);
    my $ids_out ={};
    
    

    # check that inputs are refs to arrays!
    #    ASSERT(0, qq{get_interleaved() in __PACKAGE__ is pure virtual});
    
    my $first =__get_first($start);
    my $min_length=__get_min_length($rs_a,$rs_b);
    
    my $counter_a = 0;
    my $counter_b = 0;
    my $counter_out = 0;
    
    #XXX check for off by 1
    while (scalar(@{$rs_out}) < $min_length)
    {
	 # check this against algorithm in TOIS
	# I don't like this condtion.  
	# Check translation and then rewrite for clarity
	# if first = 0 then use list a
	# 
	my $id;
	my $el;
	
	#WARNING:  we are labeling whether record came from A or B but if there is a dupe 
	#then the one who got it first gets credit
	#  How would we elminate dupes later for scoring?
	
	if (($counter_a < $counter_b) || (($counter_a == $counter_b) && ($first eq 'a')))
	{
	    #check if current canditate element is already in the output
	    # id, hashref
	    $id = $rs_a->[$counter_a]->{'id'};
	    if ( __not_in($ids_out,$id))
	    {
		#add field
		#check for dupe.  If this is also in rs_b then label as dupe
		if (__in($ids_b,$id))
		{
		    $rs_a->[$counter_a]->{AB}="A_dupe"
		}
		else
		{
		    $rs_a->[$counter_a]->{AB}="A";
		}
		
		push(@{$rs_out},$rs_a->[$counter_a]);
		$ids_out->{$id}++;
	    }
	    $counter_a++;
	}
	else
	{
	    $id = $rs_b->[$counter_b]->{'id'};
	    if ( __not_in($ids_out,$id))
	    {
		#add field
		#check for dupe
		if (__in($ids_a,$id))
		{
		    $rs_b->[$counter_b]->{AB}="B_dupe"
		}
		else
		{
		    $rs_b->[$counter_b]->{AB}="B";
		}
		
		push(@{$rs_out},$rs_b->[$counter_b]);
		$ids_out->{$id}++;
	    }
	    $counter_b++;
	}
    }
    return $rs_out;
    
}

sub __get_id_hashref
{
    my $rs = shift;
    my $hashref={};
    
    foreach my $el (@{$rs})
    {
	my $id =__get_id_from_rs_el($el);
	$hashref->{$id}++;
    }
    return $hashref;
    
}

# this will change when we pass real rs around instead of test?
sub __get_id_from_rs_el
{
    my $el = shift;
    my $id=$el->{'id'};
    return $id;
    
}

sub __in
{
    my $hashref = shift;
    my $el = shift;
    my $to_return;
    
    if (exists($hashref->{$el}) || ($hashref->{$el} >= 1)) 
    {
	#it is in the hash 
	$to_return="true";	
    }
    else
    {
	#its not in the hash so return undef
    }
    return $to_return;
}

sub __not_in
{
    my $hashref = shift;
    my $el = shift;
    my $to_return;
    
    if (exists($hashref->{$el}) || ($hashref->{$el} >= 1)) 
    {
	#it is in the hash so non_in should return undef
    }
    else
    {
	$to_return="true";
    }
    return $to_return;
}

#
# sub __get_first
#
# if start = fixed return "a"
# else return a or b with equal probability

sub __get_first
{
    my $start=shift;
#    ASSERT($start=/random|fixed/, qq{start must be one of "random"|"fixed"});
    
    my $first = 'a';
    my $num;
    
   if($start ne "fixed")
   {
       $num =int(rand(2));#XXX check this produces a 1 or 0 at random
       if ($num == 1)
       {
	   $first='b';
       }
       
   }
    return $first;
}
    
#XXX consider which of these could be moved to base class
# do we assume what is in array

sub __get_min_length
{
    my $rs_A = shift;
    my $rs_B = shift;
    
    #get min length of input arrays
    my $min_length = scalar(@{$rs_A});
    if  (scalar(@{$rs_B})< $min_length)
    {
	$min_length=scalar(@{$rs_B})
    } 
    return $min_length;
}

# compare id number of two array elements    
sub __is_same
{
    my $a = shift;
    my $b = shift
    my $to_return;
    
    if ($a->{id} eq $b->{id})
    {
	$to_return ="true"
    }
    return ($to_return);
}

# Not really a deep copy, just copying hash values to new hash
sub __deep_copy
{
    my $in=shift;
    my $out={};
    
    foreach my $key (keys %{$in})
    {
	$out->{$key}=$in->{$key};
    }
    
}

return 1;
