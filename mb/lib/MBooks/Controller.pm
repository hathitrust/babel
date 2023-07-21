package MBooks::Controller;


=head1 NAME

MBooks::Controller (ctl)

=head1 DESCRIPTION

This is an MBooks application-specific subclass of the Controller

=head1 SYNOPSIS

See coding example in base class Controller

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Controller;
use base qw(Controller);

use MBooks::Action;
use MBooks::Bind;
use MBooks::View;

use MBooks::Operation::Status;

my $g_bindings = $ENV{'SDRROOT'} . '/mb/lib/Config/bindings.pl';

# ---------------------------------------------------------------------

=item _initialize

Initialize MBooks::Controller object.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $C = shift;

    $self->___core_initialize($C);
}

# ---------------------------------------------------------------------

=item ___core_initialize

For reinitialization involving the MBooks::Controller object.

=cut

# ---------------------------------------------------------------------
sub ___core_initialize
{
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig'); 
    if ( defined $ENV{UNAVAILABLE} ) {
        my $msg = $config->get('solr_mb_maint_msg');
        
        ASSERT(0, $msg);
    }
    
    # Set up default action parameters if necessary
    my $cgi = $C->get_object('CGI');

    my $action = $cgi->param('a');
    if (! $action)
    {
        my $config = $C->get_object('MdpConfig');
        my $params = $config->get('mbooks_default_params');
        my $colltype = $cgi->param('colltype');
        my $temp_cgi = new CGI($params);
        $temp_cgi->param('debug', scalar $cgi->param('debug'));
        $cgi = $temp_cgi;
        $cgi->param('colltype', $colltype) if ( $colltype );
        $C->set_object('CGI',$cgi);
    }

    # Bind)ings
    my $ab = new MBooks::Bind($C, $g_bindings);
    $C->set_object('Bind', $ab);

    # Action. Preserve data from an existing Action to propagate it to
    # new action in cases of re-initialization.
    $C->set_object('Action', $self->get_action(), 1);                   
    my $act = new MBooks::Action($C);
    
    # View
    my $vw = new MBooks::View($C);

    $self->set_action($act);
    $self->set_view($vw);
}


# ---------------------------------------------------------------------

=item run_controller

Controller subclass for MBooks.

=cut

# ---------------------------------------------------------------------
sub run_controller
{
    my $self = shift;
    my $C = shift;
    my $cgi = $C->get_object('CGI');

    # Execute the Action's Operations
    my $act = $self->get_action();
    my $status = $act->execute_action($C);

    # Execute the View for this Action View if all the Operations
    # succeeded.  If the Action had an error, reinitialize the Context
    # to display the error condition UI.
    if ($status == $ST_OK)
    {
        $status = $self->core_execute_view($C);

        $self->handle_error($C)
            unless ($status == $ST_OK);
    }
    else
    {
        # we don't want to display an error page if this is an ajax call
        if ($cgi->param('page') eq 'ajax')
        {
            $self->handle_error_ajax($C);
        }
        else
        {
            $self->handle_error($C);
        }
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

    if ($status == $ST_OK)
    {
        # If View is redirect, serialize before redirect
        if ($vw->view_is_redirect())
        {
            $C->dispose();
            $vw->output($C);
        }
        else
        {
            $vw->output($C);
            $C->dispose();
        }
    }

    return $status;
}


# ---------------------------------------------------------------------

=item handle_error

Reinitialize the Context to display the error condition UI.

=cut

# ---------------------------------------------------------------------
sub handle_error
{
    my $self = shift;
    my $C = shift;
    
    my $error_cgi = new CGI('');
    my $cgi = $C->get_object('CGI');
    
    $error_cgi->param('a', 'page');
    $error_cgi->param('page', 'error');
    $error_cgi->param('debug', scalar $cgi->param('debug'));
    $C->set_object('CGI', $error_cgi);

    $self->___core_initialize($C);
    $self->core_execute_view($C);
}

# ---------------------------------------------------------------------

=item handle_error_ajax

return an ajax response with an error flag


=cut

# ---------------------------------------------------------------------
sub handle_error_ajax
{
    my $self = shift;
    my $C = shift;
    
    my $error_cgi = new CGI('');
    my $cgi = $C->get_object('CGI');

    $error_cgi->param('a', 'page');
    $error_cgi->param('page', 'error_ajax');
    $error_cgi->param('debug', $cgi->param('debug')) if ( defined $cgi->param('debug') );
    $C->set_object('CGI', $error_cgi);

    $self->___core_initialize($C);
    $self->core_execute_view($C);
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

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

