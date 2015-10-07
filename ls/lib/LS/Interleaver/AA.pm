package LS::Interleaver::AA;

=head1 NAME

LS::Interleaver::AA

=head1 DESCRIPTION

Dummy interleaver for running A/A tests
Just adds an A or B label to each item in the results docs list
. i.e. coin flip decides if first one is A or B
Then they just alternate

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
}


 sub get_interleaved
 {
     my $self = shift;
     my $start = shift;  # (random|fixed); #fixed = always start with first list
    

     my $rs_a = shift;
     my $rs_b = shift;
     my $rs_out = shift;
    
     # extract $rs->{result_response_docs_arr_ref} from input result sets and get interleaved result_response_docs_arr_ref
     my $a_docs_ary   =  $rs_a->{result_response_docs_arr_ref};
     my $b_docs_ary   =  $rs_b->{result_response_docs_arr_ref};
     my $out_docs_ary = $self->__get_interleaved($start,$a_docs_ary,$b_docs_ary);
        
     #What we want is all the fields of the rs_a hash except for docs_array
     #$rs_out->__set_result_docs($out_docs_ary); 
    
    

     #Test  code below is to see if attempt to copy other data from rs_a to interleaved object works

      foreach my $key (keys %{$rs_a})
      {
      	if ($key eq "result_response_docs_arr_ref")
      	{
      	    $rs_out->{result_response_docs_arr_ref} = $out_docs_ary;
      	}
      	else
      	{
      	    $rs_out->{$key} = $rs_a->{$key};
      	}
      }
        
     return $rs_out;
 }

 # ---------------------------------------------------------------------
 #
 #   __get_interleaved 
 #
 # in this implementation we just add an A or B label to the a doc data array
 # with the first label determined by the $start param and every other item
 # getting the same label i.e. either ABAB...   or BABA...
 #
 # ---------------------------------------------------------------------
 sub __get_interleaved
 {
     my $self = shift;
     my $start = shift;  # (random|fixed); #fixed = always start with first list

     my $a_ary = shift;
     my $b_ary = shift; # we ignore this. Just here for interleaved API
    
     my $first  = __get_first($start);
     my $second = __get_second($first);
    
     my $counter = 0;
     foreach   (@{$a_ary})
     {
 	if ($counter % 2 == 0)
 	{
 	    $a_ary->[$counter]->{AB}=$first;
 	}
 	else
 	{
 	    $a_ary->[$counter]->{AB}=$second;
 	}
 	$counter++;
     }
     return $a_ary;
 }


 sub __get_second
 {
     my $first = shift;
     if ($first eq 'A')
     {
 	return 'B';
     }
     else
     {
 	return 'A';
     }
    
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
    
     my $first = 'A';
     my $num;
    
    if($start ne "fixed")
    {
        $num =int(rand(2));#XXX check this produces a 1 or 0 at random
        if ($num == 1)
        {
 	   $first='B';
        }
       
    }
     return $first;
 }
    

return 1;
