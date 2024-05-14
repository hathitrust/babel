package MBooks::Bind;

=head1 NAME

MBooks::Bind (ab)

=head1 DESCRIPTION

This class encapsulates the bindings that associate URL parameters,
action names, and action handlers.  It provides a query
interface for these bindings.

Its application specific configuration is passed as a filename which
is required when instantiated.  The config data becomes package global.

=head1 SYNOPSIS

$ab = new MBooks::Bind('bindings.pl');


=head1 METHODS

=over 8

=cut

use strict;

use base qw(Action::Bind);

use Utils;

# ---------------------------------------------------------------------

=item set_action_name

Default to the default action

=cut

# ---------------------------------------------------------------------
sub set_action_name
{
    my $self = shift;
    my $C = shift;

    my $cgi = $C->get_object('CGI');
    my $action = $cgi->param('a');
    
    ASSERT($action, qq{No action ('a') parameter set on CGI object});

    foreach my $name (keys %Action::Bind::g_action_bindings)
    {
        if ($action eq $Action::Bind::g_action_bindings{$name}{'action_param'})
        {
            $self->{'action_name'} = $name;
            last;
        }
    }
}



# ---------------------------------------------------------------------

=item get_view_redirect_action_name

Return the redirect Action name for this View

=cut

# ---------------------------------------------------------------------
sub get_view_redirect_action_name
{
    my $self = shift;
    my ($C, $page) = @_;

    my $action_name = $self->get_action_name($C);
    my $redirect = $Action::Bind::g_action_bindings{$action_name}{'view'}{$page}{'redirect'};

    return $redirect;
}

sub get_view_content_type
{
    my $self = shift;
    my ($C, $page) = @_;

    my $action_name = $self->get_action_name($C);
    my $content_type = $Action::Bind::g_action_bindings{$action_name}{'view'}{$page}{'content_type'};

    return $content_type;
}


# ---------------------------------------------------------------------

=item get_action_param_hashref

Return a hash of the optional and required url parameters for this
Action for Operations (if any) and Builders (if any).

=cut

# ---------------------------------------------------------------------
sub get_action_param_hashref
{
    my $self = shift;
    my ($C, $action_name) = @_;

    my %params;

    my $op_names_arr_ref = $self->get_action_operation_names($C, $action_name);
    my $bu_names_arr_ref = $self->get_view_builder_names($C, 'default', $action_name);

    foreach my $op (@$op_names_arr_ref, @$bu_names_arr_ref)
    {
        my $op_params_hashref = $self->get_operation_params_hashref($C, $op);        
        %params = (%params, %$op_params_hashref);
    }
    
    return \%params;
}


# ---------------------------------------------------------------------

=item get_operation_params_hashref

Description

=cut

# ---------------------------------------------------------------------
sub get_operation_params_hashref
{
    my $self = shift;
    my ($C, $operation_name) = @_;

    my %params;
    
    my $req_param_hashref =
        $Action::Bind::g_operation_params{$operation_name}{'req_params'};
    foreach my $p (keys %$req_param_hashref)
    {
        $params{'required'}{$p} = $$req_param_hashref{$p};
    }

    my $opt_param_hashref =
        $Action::Bind::g_operation_params{$operation_name}{'opt_params'};
    foreach my $p (keys %$opt_param_hashref)
    {
        $params{'optional'}{$p} = $$opt_param_hashref{$p};
    }

    return \%params
}

# ---------------------------------------------------------------------

=item get_view_builder_names

Return the class names of the Operation subclasses that constitute the
Builders for the indicated View (page).

=cut

# ---------------------------------------------------------------------
sub get_view_builder_names
{
    my $self = shift;
    my ($C, $page, $p_action_name) = @_;

    my $action_name = $p_action_name ? $p_action_name : $self->get_action_name($C);
    my $builder_name_arr_ref =
        $Action::Bind::g_action_bindings{$action_name}{'view'}{$page}{'builders'};

    return $builder_name_arr_ref;
}



# ---------------------------------------------------------------------

=item get_action_pifiller_name

Return the class name of the PIFiller subclass for this action

=cut

# ---------------------------------------------------------------------
sub get_action_pifiller_name
{
    my $self = shift;
    my $C = shift;

    my $action_name = $self->get_action_name($C);
    my $cgi = $C->get_object('CGI');

    my $page = $cgi->param('page') || 'default';

    my $ui_hashref = $Action::Bind::g_action_bindings{$action_name}{'view'}{$page};
    my $pifiller_name = $$ui_hashref{'filler'};

    return $pifiller_name;
}


# ---------------------------------------------------------------------

=item mapurl_param_to_field

Mapping for certain URL parameters to database field names

=cut

# ---------------------------------------------------------------------
sub mapurl_param_to_field
{
    my $self = shift;
    my ($C, $param, $default_field) = @_;

    my $field;

    $field = $Action::Bind::g_url_to_field_name_map{$param} || $default_field;
    # ASSERT($field, qq{failed to map url param="$param" to a database field value.});

    return $field;
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

