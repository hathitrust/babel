package MBooks::Operation::Test::OperationTestFixture;


use Test::More;
use MBooks::Action;
use Auth::Auth;
use MBooks::Bind;

use base (MBooks::TestFixture);

# 
#creates a context object by calling sub setup_objects
#Usage:
#  1  get context object
#     my $C = $self->get_context();
#
#  2  set cgi parameters
#     my $temp_cgi = $C->get_object('CGI');
#     $temp_cgi->param('xid',$extern_id); 
#
#  3   put cgi object back in context
#     $C->set_object('CGI', $temp_cgi);
#  
# 4  create app
#
#  5   set $attr_ref by calling setup_operations and then instantiate Operation  
#        my $attr_ref = $self->setup_operation($C);
#        my $AddItems = new MBooks::Operation::AddItems($attr_ref);
#
#  6  execute operaton
#      my $status= $AddItems->execute_operation($C);

#=====================================================================
# Setup and teardown
#
# these are run before and after every test
#----------------------------------------------------------------------
#
# Note we use letters to influence order so that these occur after base class methods
# TODO: rewrite so base class methods always called first.  Need to seriously understand Test::Class 

sub C_setup_objects:Test(setup=>no_plan)
{

    # set env $DEBUG to usetesttbl before instantiating collection object
    $ENV{DEBUG}='usetesttbl';
    
    diag("setting up objects ") if $DEBUG;
    my $self = shift;
    my $C = $self->setup_objects();
    $self->{'context'} = $C;
    
    if ($DEBUG)
    {
        $self->num_method_tests('C_setup_objects','2');
        $self->test_setup_objects();
    }
}
sub test_setup_objects
{
    my $self=shift;
    my $C = $self->get_context();
    isa_ok($C,Context);
    # add tests for member data
}
#========================================================================
# STARTUP and TEARDOWN/SHUTDOWN 
# these are run once per test suite
#========================================================================




#==============================================================================================================
#  Utility routines
#
#==============================================================================================================
#----------------------------------------------------------------------
sub get_context
{
    my $self = shift;
    return $self->{'context'}; 
}


#==============================================================================================================
#  Utility routines for setting up objects so we can test operations
#
#==============================================================================================================
sub setup_objects{
    #
    # Setup
    #
    # Establish and populate the Context.  Order dependent.
    #

    # WARNING!! right here we are hardcoding the user/owner so that the auth object will read it
    # this probably should be in each test by putting the auth setup after the rest
    # set up environment varible remote user to tburtonw
    $ENV{'REMOTE_USER'} ='tburtonw';

    my $self=shift;
    
    my $C = new Context;

    # new stuff from mb
    my $app = new App($C, 'mb');
    $C->set_object('App', $app);

    # CGI
    my $cgi = new CGI;

    # set cgi parameters here
    $C->set_object('CGI', $cgi);

    # configuration
      
    my $config = new MdpConfig($ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/global.conf');
    $C->set_object('MdpConfig', $config);


    # Database connection
#
    my $db = new Database($config);
    #kludge
    #replace db in db with the test db dbh
    $db->{'dbh'}=$self->get_dbh();
    
    $C->set_object('Database', $db);

    
    # Session
    my $ses = Session::start_session($C);
    $C->set_object('Session', $ses);


    # Auth
    my $auth = new Auth::Auth($C);
    $C->set_object('Auth', $auth);
    # new stuff from mb 2009
   # my $ctl = new MBooks::Controller($C);


    return $C;

}
#---------------------------------------------------------------------------------------------------------------

sub setup_operation{
    my $self = shift;
    my $C = shift;
    
    # bindings
#new code copied from Controller.pm
    my $g_bindings = $ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/bindings.pl';
    my $ab = new MBooks::Bind($C, $g_bindings);

# old code that breaks
#    my $ab = new Action::Bind($C, $ENV{'SDRROOT'} . '/cgi/m/mdp/MBooks/Config/bindings.pl');
    $C->set_object('Bind', $ab);


    # Action
    
    my $act = new MBooks::Action($C);

    #initialize op
    my $attr_ref={};
    $$attr_ref{'C'}=$C;
    $$attr_ref{'act'} =$act;
    return $attr_ref;
    
}


1;


