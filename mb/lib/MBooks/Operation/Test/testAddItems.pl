#!/l/local/bin/perl
#$Id: testAddItems.pl,v 1.4 2009/08/12 19:42:37 tburtonw Exp $#

BEGIN
{
    unshift( @INC, $ENV{'SDRROOT'} . '/lib');
    unshift( @INC, $ENV{'SDRROOT'} . '/cgi/m/mdp');
}



use strict;
use Test::Class;
use MBooks::Operation::Test::TestAddItems;

# MBooks
use App;
use Database;
use Utils;
use View;
use MdpConfig;
use Action::Bind;
use Action;
use Context;
use Session;

use Auth::Auth;

use MBooks::Controller;
# warning  depends on SDRROOT/lib/DbUtils not DbUtils
# Could move subs needed by test framework to DbUtils and then modify Test.pm
use DbUtils;

use Test::WWW::Mechanize;



# uncomment and modify regular expression to only run tests matching regex

#$ENV{TEST_METHOD}= qr/.*update_item_metadata_op.*/i;


#$ENV{TEST_METHOD}= qr/.*ASSERT.*.add_items.*/i;

Test::Class->runtests;
