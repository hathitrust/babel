package LS::Controller;

=head1 NAME

LS::Controller (ctl)

=head1 DESCRIPTION

This is an LS application-specific subclass of the Controller

=head1 SYNOPSIS

See coding example in base class Controller

=head1 METHODS

=over 8

=cut

use strict;

use Time::HiRes;

use Controller;
use base qw(Controller);

use Utils;
use Utils::Logger;

use LS::Action;
use LS::Bind;
use LS::View;

use Operation::Status;

my $g_bindings = $ENV{'SDRROOT'} . '/ls/lib/Config/bindings.pl';

# ---------------------------------------------------------------------

=item _initialize

Initialize LS::Controller object.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $C = shift;

    $self->___core_initialize($C);
}

# ---------------------------------------------------------------------

=item ___core_initialize

For reinitialization involving the MBooks::Controller object.

=cut

# ---------------------------------------------------------------------
sub ___core_initialize {
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig');

    if ( defined $ENV{UNAVAILABLE} ) {
        my $msg = $config->get('solr_ls_maint_msg');
        print STDERR '___ls_core_initialize';

        ASSERT(0, $msg);
    }

    # Set up default action parameters if necessary
    my $cgi = $C->get_object('CGI');

    my $action = $cgi->param('a');
    my $query = $self->__get_user_query_string($cgi);

    my $page = $cgi->param('page');

    #XXX  redo this with cleaner logic
    if ($action eq "page")
    {
        # we need this to display a page even when there is no query
    }
    elsif (! $action || ! $query)
    {
        my $params = $config->get('ls_default_params');
        my $temp_cgi = new CGI($params);
        # Preserve debug params
        $temp_cgi->param('debug', scalar $cgi->param('debug'));
        $C->set_object('CGI', $temp_cgi);
    }

    # Bind)ings
    my $ab = new LS::Bind($C, $g_bindings);
    $C->set_object('Bind', $ab);

    # Action. Preserve data from an existing Action to propagate it to
    # new action in cases of re-initialization.
    $C->set_object('Action', $self->get_action(), 1);
    my $act = new LS::Action($C);

    # View
    my $vw = new LS::View($C);

    $self->set_action($act);
    $self->set_view($vw);
}


# ---------------------------------------------------------------------

=item Log_elapsed

Description

=cut

# ---------------------------------------------------------------------
sub Log_elapsed {
    my $self = shift;
    my $C = shift;
    my $act = shift;

    # Log
    my $ipaddr = $ENV{'REMOTE_ADDR'};
    my $session_id = $C->get_object('Session')->get_session_id();
    my $elapsed = sprintf("%.2f", Time::HiRes::time() - $main::realSTART);
    my $timeout = '';

    my $solr_error_msg = $act->get_transient_facade_member_data($C, 'solr_error');
    if ($solr_error_msg) {
        my $http_status_line;
        if ($solr_error_msg =~ m,Solr_http_status_line=([^\|]+),)
        {
            $http_status_line=$1;
        }

        if ($http_status_line =~ m,timeout,i) {
            my $config_timeout = $C->get_object('MdpConfig')->get('ls_searcher_timeout');
            $timeout = qq{ TIMEOUT cfgd_timeout=$config_timeout};
        }
    }

    my $log_string = qq{$ipaddr $session_id $$ }
        . Utils::Time::iso_Time('time')
            . qq{ total elapsed=$elapsed sec. $timeout};


    Utils::Logger::__Log_string($C, $log_string,
                                     'query_logfile', '___QUERY___', 'ls');
}

# ---------------------------------------------------------------------

=item run_controller

Controller subclass for MBooks.

=cut

# ---------------------------------------------------------------------
sub run_controller {
    my $self = shift;
    my $C = shift;

    my $status = $ST_OK;

    # Execute the Action's Operations if there is a query to perform
    my $act = $self->get_action();
    my $cgi = $C->get_object('CGI');
    my $user_query_string = $self->__get_user_query_string($cgi);

    # Undefined query string? No query to perform.  Just present the
    # initial view.
    if (defined($user_query_string)) {
        my $status = $act->execute_action($C);
    }

    # Execute the View for this Action View if all the Operations
    # succeeded.  If the Action had an error, reinitialize the Context
    # to display the error condition UI.
    if ($status == $ST_OK) {
        $status = $self->core_execute_view($C);

        $self->Log_elapsed($C, $act);

        $self->handle_error($C)
            unless ($status == $ST_OK);
    }
    else {
        $self->handle_error($C);
    }
}

# ---------------------------------------------------------------------

=item core_execute_view

The essence of the controller handling of the view

=cut

# ---------------------------------------------------------------------
sub core_execute_view
{
    my $self = shift;
    my $C = shift;

    my $act = $self->get_action();

    my $vw = $self->get_view();
    my $status = $vw->execute_view($C, $act);

    if ($status == $ST_OK) {
        # If View is redirect, serialize before redirect
        if ($vw->view_is_redirect()) {
            $C->dispose();
            $vw->output($C);
        }
        else {
            $vw->output($C);
            $C->dispose();
        }
    }

    return $status;
}



# ---------------------------------------------------------------------

=item handle_root

Reinitialize the Context to display the initial UI.

=cut

# ---------------------------------------------------------------------
sub handle_root {
    my $self = shift;
    my $C = shift;

    my $root_cgi = new CGI('');
    $root_cgi->param('a', 'page');
    $root_cgi->param('page', 'root');
    $C->set_object('CGI', $root_cgi);

    $self->___core_initialize($C);
    $self->core_execute_view($C);
}


# ---------------------------------------------------------------------

=item handle_error

Reinitialize the Context to display the error condition UI.

=cut

# ---------------------------------------------------------------------
sub handle_error {
    my $self = shift;
    my $C = shift;

    my $error_cgi = new CGI('');
    $error_cgi->param('a', 'page');
    $error_cgi->param('page', 'error');
    $C->set_object('CGI', $error_cgi);

    $self->___core_initialize($C);
    $self->core_execute_view($C);
}
#----------------------------------------------------------------------
sub __get_user_query_string
{
    my $self = shift;
    my $cgi  = shift;

    my $user_query_string = $cgi->param('q1')||$cgi->param('q2')||$cgi->param('q3')||$cgi->param('q4');

    return $user_query_string;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-9 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut

