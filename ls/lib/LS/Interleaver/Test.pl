use strict;
umask 0000;



# ----------------------------------------------------------------------
use lib "$ENV{SDRROOT}/ls/lib";

# MBooks
#use "$ENV{SDRROOT}/mdp-lib/Utils;

use LS::Interleaver;
use LS::Interleaver::Balanced;

my $il = new LS::Interleaver::Balanced();

  


my $a = build_rs_array('a');
my $b = build_rs_array('b');
#make fake result set.  For test purposses we only need one hash

my $a_rs={'result_response_docs_arr_ref'=>$a};
my $b_rs={'result_response_docs_arr_ref'=>$b};

print "A =";
output($a_rs);
print "\n---\nB=\n";
output($b_rs);
print "\n---\nOutput=\n";

my $results=$il->get_interleaved('random',$a_rs,$b_rs);
output($results);


sub output
{
    my $rs=shift;
    my $ary=$rs->{'result_response_docs_arr_ref'};
    
    foreach my $el (@{$ary})
    {
	print "$el->{'id'}\t $el->{'title'}";
	if (exists($el->{'AB'}))
	{
	    print "\t$el->{'AB'}";
	}
	print "\n";    
	
    }
}




#   sub build_rs_array
#
# build simulation of result set array  
#
#
# > x $rs->{result_response_docs_arr_ref}->[0]
# 0  HASH(0x45a2998)
#    'author' => ARRAY(0x47356f8)
#       0  'United States. Government Printing Office.'
#    'author2' => ARRAY(0x4734ea0)
#       0  'United States. Government Printing Office.'
#    'bothPublishDate' => ARRAY(0x4735008)
#       0  1965
#    'date' => 1965
#    'enumPublishDate' => ARRAY(0x46d4930)
#       0  1965
#    'id' => 'mdp.39015010761016'
#    'mainauthor' => ARRAY(0x46da4b8)
#       0  'United States. Government Printing Office.'
#    'record_no' => 000709508
#    'rights' => 2
#    'score' => 0.58787936
#    'title' => ARRAY(0x4734db0)
#       0  'Seals and other devices in use in the Government Printing Office.'

#XXX
# need a way to have some common ids between list a and b

sub build_rs_array
{
    my $ab = shift;
    my $common = shift;
    my $ary=[];
    my $num_records= 10;

    


    for my $i (0 .. ($num_records -1))
    {
	my $hash = get_hash($ab,$i);
	push (@{$ary},$hash);
    }
    return $ary;
}
# make a fake bib record hash with title and id
sub get_hash
{
    my $ab=shift;
    my $i = shift;

    my $id = $ab . '-' . $i;
    my $title = "my_title_" . $ab . '-' . $i;
    #dupes  will have common id but diff title so we can see they are dupes
    if ($i =~/2|4/)
    {
	if ($ab eq "a")
	{
	    $id='b-' . $i;
	}
	$title.= " dupe";
	
    }


    my $hash= {};
    $hash->{'id'} = $id;
    $hash->{'title'} = $title;
    return $hash;
    
}

__DATA__
A_first:
a-0      my_title_a-0
b-0      my_title_b-0

a-1      my_title_a-1
b-1      my_title_b-1

b-2      my_title_a-2 dupe
b-3      my_title_b-3

a-3      my_title_a-3
b-4      my_title_b-4 dupe

a-5      my_title_a-5
b-5      my_title_b-5


B_first:
