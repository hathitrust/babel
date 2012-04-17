use strict;
umask 0000;


# ----------------------------------------------------------------------
# Set up paths for local libraries -- must come first
# ----------------------------------------------------------------------
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

BEGIN {
    if ( $ENV{'HT_DEV'} ) {
        # Set the SDRINST and SDRLIB environment variables in auth
        # system absence.
        require Auth::Surrogate;
        Auth::Surrogate::authorize('/ls/cgi');
    }
}


use CGI;

# Magic
use Attribute::Handlers;

# MBooks
use Utils;
use Debug::DUtils;
BEGIN {
    Debug::DUtils::setup_DebugScreen();
}

use MdpGlobals;
use App;
use Database;
use MdpConfig;
use Action::Bind;
use Context;
use Session;
use Auth::Auth;
use Access::Rights;

use LS::Controller;
use LS::FacetConfig;
use LS::Query::Facets;


$::VERSION = 0.2000;

# ============================ Main ===================================

#
# Establish and populate the Context.  Order dependent.
#

my $C = new Context;


# configuration
my $config = new MdpConfig(
                           Utils::get_uber_config_path('ls'),
                           $ENV{SDRROOT} . "/ls/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/ls/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);

# additional configuration for facets and relevance weighting
my $facet_config= new LS::FacetConfig($ENV{SDRROOT} . "/ls/lib/Config/facetconfig.pl");
$C->set_object('FacetConfig', $facet_config);


my $query_type = 'full_text';
my $start_rows =0;
my $num_rows = 2;
my $user_query_string;    
my $Q = new LS::Query::Facets($C, $user_query_string, undef, 
                              {
                               'solr_start_row' => $start_rows,
                               'solr_num_rows' => $num_rows,
                               'query_type' => $query_type ,
                              });


#----------------------------------------------------------------------

#    is(processQuery($Q,'"dog food" prices "good eats"','any'), q{\"dog food\" OR prices OR \"good eats\"},qq{multiple quotes any});
#  is(processQuery($Q,'dog OR food prices','all'), 'dog OR food prices',qq{OR all});
my $q=q{dog  "food  "prices "  pizza};
my $i =1;
my $anyall='all';
my $processed = processQuery($q,$anyall,$i);

print "$q\n$processed\n";

sub processQuery
{
    my $q = shift;
    my $anyall = shift;
    my $i = shift;
    if (!defined($i))
    {
        $i=1;
    }
    
    my $processed;
    $processed = $Q->process_query($q,$i,$anyall);
    return $processed;
    
}







exit 0;



__DATA__
