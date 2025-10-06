package MBooks::Operation::LogoutTrap;


=head1 NAME

MBooks::Operation::LogoutTrap (op)

=head1 DESCRIPTION


It is an "early operation" always executed to check if the collection
or action is private and whether there should be a redirect if the
user is logged out.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);

use Auth::Auth;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize MBooks::Operation::Login.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation


Check to see if user is logged in
 if they are, just return
 if they are not
     check to see if action is listed
     if so do a redirect and exit;
Actions covered are in $action2redir_params hashref
Currently these are:listis listsrch listcs

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="LogoutTrap"});

    # Parameter validation et. al.
    $self->SUPER::execute_operation($C);

    my $LIST_MY_COLLS_PARAMS = 'a=listcs;colltype=my-collections';

    # check for action names and also format of url
    my $action2redir_params
        = {
           'ACTION_LIST_ITEMS'          => "$LIST_MY_COLLS_PARAMS",
           'ACTION_LIST_SEARCH_RESULTS' => "$LIST_MY_COLLS_PARAMS",
          };

    my $auth = $C->get_object('Auth');
    if ($auth->is_logged_in())
    {
        return $ST_OK;
    }

    my $act = $self->get_action();
    my $action_name = $act->get_name();
    if (! defined($action2redir_params->{$action_name}))
    {
        return $ST_OK;
    }

    # Handle actions which operate on a collection that is either public or private
    # determine if the collection is private
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $cgi = $C->get_object('CGI');
    my $coll_id = $cgi->param('c');
    silent_ASSERT($coll_id, qq{Missing 'c' parameter in LogoutTrap});

    if ($co->get_shared_status($coll_id) =~ m,public|draft,)
    {
        return $ST_OK;
    }
    ASSERT($co->get_shared_status($coll_id) eq 'private',
           qq{collection $coll_id must be either public or private});

    # XXX leave this in for now.  We need to deal with difference between
    # logging out and not being logged in for temporary users.

    # if its a temp collection and owned by user we don't do anything
    my $session_user_id = $C->get_object('Session')->get_session_id();
    my $user_id = $auth->get_user_name($C);
    if (
        ($session_user_id eq $user_id)
        &&
        $co->coll_owned_by_user($coll_id, $user_id)
       )
    {
        # collection is owned by not logged in user and is a temp coll
        # so do nothing
        return $ST_OK;
    }
    else
    {
        # its a private collection so redirect
        redirect_and_exit($C, $action2redir_params->{$action_name});
    }
}


#----------------------------------------------------------------------
sub redirect_and_exit {
    my $C = shift;
    my $redir_params = shift;

    my $cgi = $C->get_object('CGI');
    my $temp_cgi = new CGI($redir_params);
    $temp_cgi->param('debug', $cgi->param('debug'));
    
    my $redirect_url = $temp_cgi->self_url();
    MBooks::View::P_redirect_HTTP($C, $redirect_url);

    exit 0;
}

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut

