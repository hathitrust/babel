package WAYF::Controller;


=head1 NAME

WAYF::Controller (ctl)

=head1 DESCRIPTION

This is an WAYF application-specific subclass of the Controller

=head1 SYNOPSIS

See coding example in base class Controller

=head1 METHODS

=over 8

=cut

use base qw(Controller);

use Utils;
use Utils::Logger;

use WAYF::Action;
use WAYF::Bind;

my $g_bindings = $ENV{'SDRROOT'} . '/wayf/lib/Config/bindings.pl';

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

For reinitialization involving the WAYF::Controller object.

=cut

# ---------------------------------------------------------------------
sub ___core_initialize {
    my $self = shift;
    my $C = shift;

    # Set up default action parameters if necessary
    my $cgi = $C->get_object('CGI');

    my $action = $cgi->param('a');
    if (! $action) {
        $cgi->param('a', 'wayf');
    }

    # Filter bad targets -- security
    if (Debug::DUtils::under_server()) {
        my $target = $cgi->param('target');
        if ($target) {
            require URI;
            my $url = URI->new($target);
            my $host;
            # No host -> Shib in memory relay identifier is the target, 
            # e.g. target=ss:Amem:2f9c62608d121b14bdb0ff030bb2c44b30cc3899
            eval {
                $host = $url->host();
            };
            if ($host) {
                my $host_pattern = $C->get_object('MdpConfig')->get('target_host_pattern');
    
                if ($host !~ m,$host_pattern,) {
                    $cgi->delete('target');
                    require Utils::Logger;
                    Utils::Logger::__Log_simple( "vhost=$host target deleted\n" );
                }
            }
        }
    }

    # Bind)ings
    my $ab = new WAYF::Bind($C, $g_bindings);
    $C->set_object('Bind', $ab);

    # Action
    my $act = new WAYF::Action($C);
    $C->set_object('Action', $act);
    $self->set_action($act);

    # View
    my $vw = new View($C);
    $self->set_view($vw);
}

# ---------------------------------------------------------------------

=item run_controller

Controller subclass for WAYF.

=cut

# ---------------------------------------------------------------------
sub run_controller {
    my $self = shift;
    my $C = shift;

    my $status = $self->core_execute_view($C);

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
    $vw->execute_view($C, $act);
    $vw->output($C);
    $C->dispose();

    return $ST_OK;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2010 ©, The Regents of The University of Michigan, All Rights Reserved

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

