use lib "$ENV{SDRROOT}/mdp-lib/Utils";
BEGIN
{
    $ENV{DEBUG_LOCAL}="true";
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



my $C = new Context;

my $user_query_string="dummy_initialize";

my $Q = new LS::Query::TestHarness($C, $user_query_string, undef,"arraygoeshere");
my $q="test query";

my $out=$Q->get_processed_user_query_string($q);

print "out is $out\n";
