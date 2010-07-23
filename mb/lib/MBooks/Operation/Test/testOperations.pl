#!/l/local/bin/perl
#$Id $#

BEGIN
{
    unshift( @INC, $ENV{'SDRROOT'} . '/lib');
    unshift( @INC, $ENV{'SDRROOT'} . '/cgi/m/mdp');
}



use strict;
use Test::Class;
use MBooks::Operation::Test::Test;


# warning  depends on SDRROOT/lib/DbUtils not DbUtils
# Could move subs needed by test framework to DbUtils and then modify Test.pm
use DbUtils;
use CGI;

# Magic
use Attribute::Handlers;


# MBooks
use MdpGlobals;
use Utils;
use Debug::DUtils;
BEGIN 
{
    Debug::DUtils::setup_DebugScreen();
}

use App;
use Database;
use View;
use MdpConfig;
use Action::Bind;
use Context;
use Session;
use Auth::Auth;
use AccessRights;

use MBooks::Controller;
use MBooks::Action;

#--------------------



use Test::WWW::Mechanize;



# uncomment and modify regular expression to only run tests matching regex

#$ENV{TEST_METHOD}= qr/.*copy_items_op.*/i;


#$ENV{TEST_METHOD}= qr/.*ASSERT.*.add_items.*/i;

Test::Class->runtests;
