#!/l/local/bin/perl
#$Id $#

BEGIN
{
    unshift( @INC, $ENV{'SDRROOT'} . '/lib');
    unshift( @INC, $ENV{'SDRROOT'} . '/cgi/m/mdp');
}



use strict;
use Test::Class;
use MBooks::Operation::Test::TestListItems;

use Data::Page; #TODO XXX make sure this is in mb or appropriate place

# MBooks
use App;
use Database;
use Utils;
use View;
use MdpConfig;
use Action::Bind;
use MBooks::Action;
use Context;
use Session;


use Auth::Auth;

use MBooks::Controller;
# warning  depends on SDRROOT/lib/DbUtils not DbUtils
# Could move subs needed by test framework to DbUtils and then modify Test.pm
use DbUtils;

use Test::WWW::Mechanize;



# uncomment and modify regular expression to only run tests matching regex

#$ENV{TEST_METHOD}= qr/.*slicing.*/i;


#$ENV{TEST_METHOD}= qr/.*ASSERT.*.add_items.*/i;

Test::Class->runtests;
