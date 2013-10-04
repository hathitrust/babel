#!/usr/bin/env perl

use strict;
use warnings;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;


# Perl
use Getopt::Std;
# App
use Context;
use Utils;
use Debug::DUtils;

use Context;
use MdpConfig;
use Identifier;
use Password;
use Database;

use SLIP_Utils::Common;
use SLIP_Utils::States;

use Search::Searcher;
use Search::Query;
use Search::Result::SLIP;


our ($opt_r, $opt_F, $opt_I);

my $ops = getopts('r:I:F:');

my $RUN = $opt_r;
if (! defined $RUN) {
    print trv_get_usage();
    exit 1;
}

my $C = new Context;

my $config = SLIP_Utils::Common::gen_SLIP_config($RUN);
$C->set_object('MdpConfig', $config);

my $ID = $opt_I;
my $ID_FILENAME = $opt_F;

my $whoami = `whoami`;
chomp($whoami);
print "Enter passwd: ";
my $passwd = Password::get_password();
print "\n";

# Database connection
my $db = new Database($whoami, $passwd, 'ht', 'mysql-sdr');
my $DBH = $db->get_DBH();

sub trv_get_usage {
    return qq{Usage: test-rights-v/db.pl -r run -F outfile  [-I id] \nchecks for id(s) consistency in Solr vs. ht.rights_current.\n};
}

my $ROWS = 100;

sub test_ids_from_Solr {
    my $start = shift;
    
    my $query = 
      $ID 
        ? qq{q=id:$ID\&rows=$ROWS\&fl=id,rights} 
          : qq{q=*:*\&start=$start\&rows=$ROWS\&fl=id,rights};

    my $result = `$ENV{SDRROOT}/slip/index/query-j -r$RUN -N -V -q'$query'`;
    my @result_arr = split("\n", $result);    

    foreach my $res (@result_arr) {
        my ($id, $rights) = ($res =~ m,<doc><str name="id">(.*?)</str><int name="rights">(.*?)</int></doc>,);
         
        my $attr;
        
        my ($namespace, $barcode) = Identifier::__split_id($id);
         eval {
             my $statement = qq{SELECT attr FROM ht.rights_current WHERE namespace='$namespace' AND id='$barcode'};
             my $sth = DbUtils::prep_n_execute($DBH, $statement);
             $attr = $sth->fetchrow_array;
             
         };
        #print '.';
        #print "\n" if ($start % 500 == 0);
        
        print "$id $@\n" if ($@);
        if ($attr ne $rights) {
            print "\n$id solr=$rights db=$attr"
        }
     }
 
     return scalar @result_arr;
}

my $start_offset = 0;

while ( test_ids_from_Solr($start_offset) ) {
    $start_offset += $ROWS;
}

exit 0;

            
