package MBooks::View;


=head1 NAME

MBooks::View (vw)

=head1 DESCRIPTION

This class is responsible for template management and binding of the
PI handlers in Actions to the PIs in the template and the invocation
of said PI handlers.

=head1 SYNOPSIS

my $vw = new MBooks::View($C);

$vw->execute_view($C, $act);

$vw->output($C);

PRIVATE:

$vw->_install_PI_handlers($C, $act);

$vw->_run_PI_handlers($C);

$vw->_render_template($C);


=head1 METHODS

=over 8

=cut

use strict;

use base qw(View);

use PI;
use Context;
use ObjFactory;
use Utils;
use Action;
use Debug::DUtils;
use Utils::XSLT;

use Operation::Status;


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

Initialize View.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $C = shift;

    my $ab = $C->get_object('Bind');
    my $page = $self->{'page'} = $C->get_object('CGI')->param('page') || 'default';

    my $redirect = $self->{'redirect_action_name'} = $ab->get_view_redirect_action_name($C, $page);

    if (! $redirect)
    {
        $self->SUPER::_initialize($C);
        $self->{content_type} = $ab->get_view_content_type($C, $page) || 'text/html';
    }
}


sub read_template {
    my $self = shift;
    my ($C, $ab) = @_;

    my $template_name = $ab->get_action_template_name($C);
    unless ( $template_name ) {
        $$self{template_name} = undef;
        $$self{PIs} = {};
        my $s = "";
        $$self{template_data_ref} = \$s;
    } else {
        $self->SUPER::read_template($C, $ab);
    }
}


# ---------------------------------------------------------------------

=item execute_view

Handle the logic of the view including determination of whether the
application should redirect to produce the view or simply produce the
view inline.

=cut

# ---------------------------------------------------------------------
sub execute_view
{
    my $self = shift;
    my ($C, $act) = @_;

    return
        if ($self->view_is_redirect());

    # run the Operations that constitute the Builders for this VIew
    my $status = $self->_execute_builders($C, $act);

    if ($status == $Operation::Status::ST_OK && ! ref($$self{template_action}))
    {

        if ( $$self{template_name} ) {
            $self->SUPER::execute_view(@_);
        } else {
            $$self{output} = $act->get_transient_facade_member_data($C, 'output');
        }
    }

    return $status;
}



# ---------------------------------------------------------------------

=item _get_builders

PRIVATE: Obvious

=cut

# ---------------------------------------------------------------------
sub _get_builders
{
    my $self = shift;
    my ($C, $act) = @_;

    my $ab = $C->get_object('Bind');
    my $cgi = $C->get_object('CGI');
    my $page = $self->get_page();

    my $of = new ObjFactory;

    my @builders = ();
    my $builder_name_arr_ref = $ab->get_view_builder_names($C, $page);
    foreach my $bu_name (@$builder_name_arr_ref)
    {
        my %of_bu_attrs = (
                           'class_name' => $bu_name,
                           'parameters' => {
                                            'C'   => $C,
                                            'act' => $act,
                                           },
                          );

        my $bu = $of->create_instance($C, \%of_bu_attrs);
        push(@builders, $bu);
    }

    return \@builders;
}

# ---------------------------------------------------------------------

=item _execute_builders

PRIVATE: Run the Operations that constitute the Builders for this View

=cut

# ---------------------------------------------------------------------
sub _execute_builders
{
    my $self = shift;
    my ($C, $act) = @_;

    my $status = $Operation::Status::ST_OK;

    ASSERT((! $self->view_is_redirect()),
           qq{Cannot execute builders for redirect-type View});

    my $bu_arr_ref = $self->_get_builders($C, $act);
    foreach my $bu (@$bu_arr_ref)
    {
        $status = $bu->execute_operation($C, $act)
            if ($status == $Operation::Status::ST_OK);
    }

    return $status;
}


# ---------------------------------------------------------------------

=item get_redirect_action_name

Description

=cut

# ---------------------------------------------------------------------
sub get_redirect_action_name
{
    my $self = shift;
    return $self->{'redirect_action_name'};
}


# ---------------------------------------------------------------------

=item view_is_redirect

Description

=cut

# ---------------------------------------------------------------------
sub view_is_redirect
{
    my $self = shift;
    return defined($self->{'redirect_action_name'});
}


# ---------------------------------------------------------------------

=item P_redirect_HTTP

Description: Procedural interface to redirect

=cut

# ---------------------------------------------------------------------
sub P_redirect_HTTP
{
    my ($C, $url) = @_;

    my $ses = $C->get_object('Session');

    if (DEBUG('noredir'))
    {
        my $sid = $ses->get_session_id();
        my $debug_msg = $url . qq{;newsid=$sid};
        View::P_output_data_HTTP($C, \$debug_msg, undef)
    }
    else
    {
        my $cookie = $ses->get_cookie();
        print STDOUT CGI::redirect(
                                   -uri     => $url,
                                   -cookie  => $cookie,
                                   -status  => 301,
                                  );
    }

    exit;
}


# ---------------------------------------------------------------------

=item output

Description: Override of base class for redirect.

=cut

# ---------------------------------------------------------------------
sub output
{
    my $self = shift;
    my $C = shift;
    my $content_type = $self->{content_type} || 'text/html';

    if ($self->view_is_redirect())
    {
        $self->redirect_HTTP($C);
    }
    elsif ( exists($$self{output}) ) {
        my $output = $$self{output};
        my $ref = ref($output) ? $output : \$output;
        $self->output_HTTP($C, $ref, $content_type);
    }
    else
    {
        my $transformed_xml_ref = $self->_get_transformed_xml($C);
        $self->output_HTTP($C, $transformed_xml_ref, $content_type);
    }
}


# ---------------------------------------------------------------------

=item redirect_HTTP

Description: Class interface to redirect data.  Can be over-ridden to
call different output methods

=cut

# ---------------------------------------------------------------------
sub redirect_HTTP
{
    my $self = shift;
    my $C = shift;

    my $url = $self->get_redirect_url($C);
    P_redirect_HTTP($C, $url);
}


# ---------------------------------------------------------------------

=item get_redirect_url

Obvious :-)

=cut

# ---------------------------------------------------------------------
sub get_redirect_url
{
    my $self = shift;
    my $C = shift;

    my $ab = $C->get_object('Bind');
    my $cgi = $C->get_object('CGI');

    my $redirect_cgi = new CGI('');

    # Get the required and optional parameters for the Operations and
    # Builders (Operations) for this View and put them onto the
    # redirect CGI object
    my $action_name = $self->get_redirect_action_name();
    my $params_hashref = $ab->get_action_param_hashref($C, $action_name);

    # First: required
    my $required_params_hashref = $$params_hashref{'required'};
    foreach my $param (keys %$required_params_hashref)
    {
        my $param_val = $$required_params_hashref{$param};
        if (defined($param_val))
        {
            $redirect_cgi->param($param, $param_val);
        }
        else
        {
            # get the value from the CGI based on the specs for the
            # required from bindings.pl for this Action's
            # Operations/Builders
            $param_val = $cgi->param($param);
            ASSERT(defined($param_val),
                   qq{CGI object missing a value for parameter="$param" for Action="$action_name"});
            $redirect_cgi->param($param, $param_val);
        }
    }

    # Next: optional
    my $optional_params_hashref = $$params_hashref{'optional'};
    foreach my $param (keys %$optional_params_hashref)
    {
        my @param_val = $cgi->multi_param($param);
        # CGI params override the optional defaults
        if (scalar(@param_val))
        {
            $redirect_cgi->param($param, @param_val);
        }
        else
        {
            # Use optional default.  May be undef when Action may or
            # may not require the value and the parameter has no
            # default value.
            my $param_val = $$optional_params_hashref{$param};
            $redirect_cgi->param($param, $param_val)
                if (defined($param_val));
        }
    }

    # Preserve debug param
    $redirect_cgi->param('debug', scalar $cgi->param('debug'));

    return($redirect_cgi->self_url());
}

sub output_HTTP {
    my $self = shift;
    my ($C, $data_ref, $content_type) = @_ ;
    my $status = get_response_status($C);

    if ( ref($data_ref) eq 'File::Temp' ) {
        P_output_glob_data_HTTP($C, $data_ref, $content_type, $status);
    } else {
        View::P_output_data_HTTP($C, $data_ref, $content_type, $status);
    }
}


sub P_output_glob_data_HTTP {
    my ($C, $data_ref, $content_type, $status) = @_ ;

    $content_type = 'text/plain'
        if (! $content_type);

    $status = 200 unless ( $status );

    my $charset = 'UTF-8';
    
    Utils::add_header($C, 'Content-type' => qq{$content_type; charset=$charset});
    
    my $headers_ref = $C->get_object('HTTP::Headers');
    
    print STDOUT "Status: $status" . $CGI::CRLF;
    print STDOUT $headers_ref->as_string($CGI::CRLF);
    print STDOUT $CGI::CRLF;
    while ( my $line = <$data_ref> ) {
        print STDOUT $line;
    }
}

sub get_response_status {
    my ( $C ) = @_;
    if ( my $resp = $C->get_object('HTTP::Response', 1) ) {
        return $resp->code;
    }
    return 200;
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

