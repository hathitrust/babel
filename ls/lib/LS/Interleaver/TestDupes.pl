#$Id$
#TestDupes

use strict;
umask 0000;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use lib "$ENV{SDRROOT}/mdp-lib/";
use lib "$ENV{SDRROOT}/ls/lib";

use LS::Interleaver;
use LS::Interleaver::Balanced;
use List::Util 'shuffle';

my $il = new LS::Interleaver::Balanced();

#  specify a number of dupes
#  B should have random permutation of ids in A except
#  for n_d dupes which are same id as in B but possibly at any particular postion.


my $num_runs =1000;

my $num_dupes;
my $num_records=100;
my $positions;#=[3, 5, 6, 9,10];
my $OUTPUT_AB;
my $OUTPUT_INT;
#my $OUTPUT_AB = "true";

for (my $i = 1; $i <= $num_runs; $i++) {
    $num_dupes=int(rand(100) +1);
    print "$i\n";
    run_sim($num_dupes);
}


#----------------------------------------------------------------------
sub run_sim
{
    my $num_dupes=shift;
    print "num_records=$num_records num_dupes=$num_dupes\n";

    my $seed = 1234;
    $seed = int(rand(500));
    $il->set_random_seed($seed);

    my $a = build_a_rs_array($num_records);
    # if positions not specified they will be random
    my $b = build_b_rs_array($num_records, $num_dupes,$positions);
    #make fake result set.  For test purposses we only need one hash
    my $a_rs={'result_response_docs_arr_ref'=>$a};
    my $b_rs={'result_response_docs_arr_ref'=>$b};

    if (defined($OUTPUT_AB)){
    
	print "A =";
	output($a_rs);
	print "\n---\nB=\n";
	output($b_rs);
    }

    #print "\n---\nOutput=\n";
    my $a_doc_ary_ref=$a_rs->{'result_response_docs_arr_ref'};
    my $b_doc_ary_ref=$b_rs->{'result_response_docs_arr_ref'};

    my $start = 'random';
    #$start='a';

    my $results = $il->__get_interleaved($a_doc_ary_ref ,$b_doc_ary_ref,$start);
    my $debug_data=$il->get_debug_data;

    my $results_rs={'result_response_docs_arr_ref'=>$results};

    my @fields=qw(counter_a counter_b diff_counters);

    print_debug_hash($debug_data,\@fields);
   # print_hash($debug_data);

   # print "start = $start\t seed = $seed\n";
    if($OUTPUT_INT)
    {
	output($results_rs);
    }
}

#----------------------------------------------------------------------
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
#----------------------------------------------------------------------
sub build_a_rs_array
{
    my $num_records = shift;
    my $ary=[];

    for my $i (0 .. ($num_records -1))
    {
	my $hash = get_hash('a',$i);
	push (@{$ary},$hash);
    }
    return $ary;
}
#----------------------------------------------------------------------
#XXX call:  my $b = build_b_rs_array($num_records, $num_dupes,$positions);
sub build_b_rs_array
{
    my $num_records = shift;
    my $num_dupes   = shift;
    my $positions   = shift;
    my $ary=[];

    my $num_positions;
    
    for my $i (0 .. ($num_records -1))
    {
	my $hash = get_hash('b',$i);
	push (@{$ary},$hash);
    }
    my $out_ary=[];
    my @ray=@{$ary};
    my @out;
    @out=List::Util::shuffle(@ray);
    my $seen={};
    my $pos;
    
    if (defined($positions))
    {
	$num_positions=scalar(@{$positions});
	foreach  $pos (@{$positions})
	{
	    $out[$pos] = label_dupe($out[$pos]);
	}
    }
    elsif($num_dupes > 0 )
    {
	while (scalar(keys %{$seen}) <=$num_dupes)
	{
	    my $pos=rand(int(scalar(@out)+1));
	    $seen->{$pos}++;
	    $out[$pos] = label_dupe($out[$pos]);
	}
    }
    
    return \@out;
}

#----------------------------------------------------------------------
#     array element is a hash
#    'id' => 'b-1'
#   'title' => 'my_title_b-1'

sub label_dupe
{
    my $el =shift;
    my $out={};
    
    my ($ab,$id_no)=split(/\-/,$el->{'id'});
    
    if ($ab eq "a")
	{
	    $out->{'id'}='b-' . $id_no;
	}
	else
	{
	    $out->{'id'}='a-' . $id_no;
	}
	
    $out->{'title'} = $el->{'title'} . " dupe";
    return $out;
}


    


#----------------------------------------------------------------------
# make a fake bib record hash with title and id
sub get_hash
{
    my $ab=shift;
    my $id_no = shift;
    my $id = $ab . '-' . $id_no;
    my $title = "my_title_" . $ab . '-' . $id_no;
    my $hash= {};
    $hash->{'id'} = $id;
    $hash->{'title'} = $title;
    return $hash;
    
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
sub print_debug_hash
{
    my $hash = shift;
    my $fields = shift;
    my $toprint={};
    foreach my $field(@{$fields}){
	$toprint->{$field}++;
    }
    
    foreach my $key (sort keys %{$hash})
    {
	if ($toprint->{$key} >0)
	{
	    print "$key\t$hash->{$key}\n";
	}
    }
    
}

sub print_hash
{
    my $hash = shift;
    foreach my $key (sort keys %{$hash})
    {
	print "$key\t$hash->{$key}\n";
    }
    
}
