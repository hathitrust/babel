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
use Utils;
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


# ---------------------------------------------------------------------
#
#   Does method have to know what's inside arraref?
#
# ---------------------------------------------------------------------
sub __get_interleaved
{
    my $self = shift;

    #WARNING $rs is not a result set object its the $rs->{result_response_docs_arr_ref}
    #WARNING #2   These end up being pointers to the result set objects not deep copies
    # So if we mess with them, and later on want to use set a or b they are messed up

    my $rs_a = shift;
    my $rs_b = shift;
    my @params = @_;
    my $start = $params[0];  # (random|fixed); #fixed = always start with first list
      ASSERT(($start eq "random"||$start eq "first" ), qq{start=$start  start  must be one of "random"|"fixed" for Balanced Interleave params});    

    my $rs_out=[];
    
    #hashrefs for testing if an id is in the result set
    my $ids_a = __get_id_hashref($rs_a);
    my $ids_b = __get_id_hashref($rs_b);
    my $ids_out ={};
    
    

    # check that inputs are refs to arrays!
    #    ASSERT(0, qq{get_interleaved() in __PACKAGE__ is pure virtual});
    
    my $first =$self->__get_first($start);
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
    my $self = shift;
    
    my $start=shift;
   # ASSERT(($start  "random"), qq{start must be one of "random"|"fixed"});
    
    my $first = 'a';
    my $num;
    
    if ($start ne "fixed")
    {
	#XXX
	# seed random number generator based on
	# query, session, and/or page size/number?
	#XXX
	my $seed = $self->get_random_seed();
	srand($seed);
	$num =int(rand(2));#XXX check this produces a 1 or 0 at random

	if ($num == 1)
	{
	    $first='b';
	}
	$self->set_debug_data($first,$seed,$num);
    }
    else
    {
	$self->set_debug_data($first);
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



#Class specific override
sub set_debug_data
{
    my $self = shift;
    my $first = shift;
    my $seed = shift;
    my $num  = shift;
    my $data= {
	       'first' => $first,
	       'seed' => $seed,
	       'bool' => $num,
	      };
    $self->SUPER::set_debug_data($data);
}


return 1;
