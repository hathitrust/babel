use lib "$ENV{SDRROOT}/mdp-lib/Utils";
BEGIN
{
#    $ENV{DEBUG_LOCAL}="true";
}
use Vendors;



#ask phil where to put debug=local so we can use stuff in mdp-lib instead of vendors!!

BEGIN {
    if ( $ENV{'HT_DEV'} ) {
        # Set the SDRINST and SDRLIB environment variables in auth
        # system absence.
        require Auth::Surrogate;
        Auth::Surrogate::authorize('/ls/cgi');
    }
}


# Magic
use Attribute::Handlers;

# MBooks
use Utils;
use Debug::DUtils;
use Context;
use Search::Query;
use LS::Query::TestHarness;


#TODO:

#1 Redo so we can specfy query, expected result and class of test
#2 Rewrite to use with Test::More or Test::Class

my $C = new Context;

my $user_query_string="dummy_initialize";

my $Q = new LS::Query::TestHarness($C, $user_query_string, undef,"arraygoeshere");

my $queries = [];
$queries=getQueries();

foreach my $query (@{$queries})
{
    testQuery($query,$Q);
    
}


sub getQueries
{
    my @q;
   #=('rain ? spain','foo*bar',
#           'foo( AND bar) OR baz',
#           'foo &amp; ampersand entity',
#           'foo & bare ampersand',
#           'two ampersands && foo',
#          );

    while (<DATA>)
    {
        next if /^\s*\#/;
        next if /^s*$/;
        chomp;
        push (@q,$_ );
    }
    
    return \@q;
}
sub testQuery
{
    my $q = shift;
    my $Q = shift;
    my $out=$Q->get_processed_user_query_string($q);
  #  print "---\n\tsent: $q\n\tgot: $out\n";
    
    if ( $Q->well_formed() )    { }
    else     
    {
        print "\nNot well formed\n";
        print "\tsent: $q\n\tgot: $out\n";
    }

    
}
    
__DATA__
#
( dog AND cat AND bear)
dog AND cat
dog AND cat AND bear
dog cat AND bear
dog cat OR bear
dog (cat OR bear)
(dog cat) bear
(dog OR cat) AND food
(dog OR cat OR bear) AND (food OR water OR feeding)
dog AND and bear
dog AND AND bear

#foo "bar" baz
#morgan & york
#    ampersand entity &amp; foo
#this && that
unbalenced" double" quotes"
unbalenced (parens ()
balenced ( parens )
