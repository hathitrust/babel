#!/l/local/bin/perl
#$Id: testAddMultipleItems.pl,v 1.2 2010/07/06 17:57:42 tburtonw Exp $#

BEGIN
{
    unshift( @INC, $ENV{'SDRROOT'} . '/lib');
    unshift( @INC, $ENV{'SDRROOT'} . '/cgi/m/mdp');
}



use strict;
use Test::Class;
use MBooks::Operation::Test::TestAddMultipleItems;

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

#$ENV{TEST_METHOD}= qr/.*add_multiple_items.*/i;


#$ENV{TEST_METHOD}= qr/.*ASSERT.*.add_items.*/i;

Test::Class->runtests;
