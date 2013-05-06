#!/usr/bin/env perl

# ----------------------------------------------------------------------
# Set up paths for local libraries -- must come first
# ----------------------------------------------------------------------
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use PT::SearchUtils;



#Han
my $a="\N{U+4E2D}";
my $b="\N{U+56FD}";
my $c="\N{U+5BF9}";


my $han_1=$a;
my $han_2=$a . $b;
my $han_3=$a . $b . $c;


#katakana
my $kat="\N{U+30B9}";
my $kat_2="\N{U+30B9}" . "\N{U+30AB}"; 
my $kat_3= $kat_3 . "\N{U+30A4}";
#hirigana
my $hir="\N{U+306E}"  ;
my $hir_2= $hir . $hir;
my $hir_3= $hir_2 . $hir;

my $numbers_han=$han_1 . "123";


my $multi =
{
 "3han"       => "$han_3", 
 "3hir"       => "$hir_3", 
 "numbers_han" => "$numbers_han", 
 "han latin"  => "$a  foo", 
 "han kat"    => "$han_1 .$kat", 
 "han hir"    => "$han_1 . $hir", 
 "kat hir"    => "$kat . $hir"
};

my $single= 
{
 "han2"       => "$han_2",
 "han1"       => "$han_1",
 "kat2"       => "$kat_2",
 "3kat"       => "$kat_3", 
 "hir2"       => "$hir_2",
 "latin"      => "foobar",

};

print "testing multiple\n";

foreach my $testname (keys %{$multi})
{
        
        my $string=$multi->{$testname};
        my $return=PT::SearchUtils::isMultiple($string);
        print "$testname $return\n";
}
print "testing single\n";
foreach my $testname (keys %{$single})
{
        
        my $string=$single->{$testname};
        my $return=PT::SearchUtils::isMultiple($string);
        print "$testname $return\n";
}



# ---------------------------------------------------------------------
#   return true if string will be split into more than one token
#    
#   Current cases
#
#   This may change when if we change settings on CJKFiltering
# 
# consider using Analysis request handler which would always be correct

#1   3 or more Han or Hiragana characters
#2   Combination of any two of the three: Han, Hiragana, Katakana 

sub isMultiple
{
    my $q = shift;
    my $toReturn="false";

    $q=~s/\s//g;    
    
    eval
    {
        if ($q =~/\p{Han}|\p{Hiragana}/)
        {
            # count Han/Hir
            my $temp_q = $q;
            
            my $Han_count = $temp_q =~ s/\p{Han}//g;
#            print "q is $q han count is $Han_count\n";
            
            $temp_q = $q;
            my $Hir_count = $temp_q =~ s/\p{Hiragana}//g;
            if ($Han_count >2 || $Hir_count >2)
            {
                $toReturn="true";
            }
            else
            {
                # test for 2 of any of Han, Hiragana, Katakana, Latin (do we need totest for numbers?)
                $temp_q = $q;
                my $Kat_count = $temp_q =~ s/\p{Katakana}//g;
                $temp_q = $q;
                my $Lat_count = $temp_q =~ s/\p{Latin}//g;

                #XXX  what about numbers and punctuation that is not stripped out
                # could us \p{common} but that includes punct that is stripped out
                # for now just include numbers
                $temp_q = $q;
                my $Num_count= $temp_q =~ s/\d//g;
                my $total_scripts =0;
                
                foreach my $count ($Han_count, $Hir_count,$Kat_count, $Lat_count, $Num_count)
                {
                    if ($count >0) 
                    {
                        $total_scripts++;
                    }
                }
                if ($total_scripts >1)
                {
                    $toReturn ="true";
                }
            }
        }    
        
    };
    
    # change this to an ASSERT
    if ($@)
    {
        print STDERR "bad char $@  $_\n";
    }
    
    return($toReturn)
}

