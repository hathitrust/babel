package PT::Bind;


=head1 NAME

Bind (ab)

=head1 DESCRIPTION

This class encapsulates the minimized bindings that associate URL
parameters with action names for pageturner.

Its application specific configuration is passed as a filename which
is required when instantiated.  The config data becomes package global.

=head1 SYNOPSIS

$ab = new Bind('bindings.pl');


=head1 METHODS

=over 8

=cut

use strict;

use base qw(Action::Bind);
use Utils;


# ---------------------------------------------------------------------

=item set_action_name

In pageturner all actions are page displays

=cut

# ---------------------------------------------------------------------
sub set_action_name
{
    my $self = shift;
    my $C = shift;

    my $cgi = $C->get_object('CGI');
    my $page = $cgi->param('page');

    my $action_name;
    if ($page eq 'root')
    {
        $action_name = 'ACTION_VIEW';
    }
    elsif ($page eq 'search' || $page eq 'index')
    {
        $action_name = 'ACTION_SEARCH';
    }
    elsif ($page eq 'ssd')
    {
        $action_name = 'ACTION_SSD';
    }
    elsif ($page eq 'mobile')
    {
        $action_name = 'ACTION_MOBILE';
    }

    ASSERT($action_name, qq{page URL parameter missing or invalid});

    $self->{'action_name'} = $action_name;
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

    my $page = $cgi->param('page');

    my $ui_hashref = $Action::Bind::g_action_bindings{$action_name}{'view'}{$page};
    my $pifiller_name = $$ui_hashref{'filler'};

    return $pifiller_name;
}

sub get_action_template_name
{
    my $self = shift;
    my $C = shift;

    my $action_name = $self->get_action_name($C);
    my $cgi = $C->get_object('CGI');

    my $page = $cgi->param('page') || 'default';
    my $format = $cgi->param('format');

    my $action_hashref = $Action::Bind::g_action_bindings{$action_name}{'view'};
    my $ui_hashref = ( defined $format && exists $$action_hashref{$format} ) ? 
        $$action_hashref{$format} : 
        $$action_hashref{$page};

    # my $ui_hashref = $Action::Bind::g_action_bindings{$action_name}{'view'}{$page};
    my $template_name = $$ui_hashref{'template'};

    my $item_type;
    my $id = $cgi->param('id');
    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ( $finalAccessStatus ne 'allow' ) { $item_type = 'restricted'; }
    else {
        my $mdpItem = $C->get_object('MdpItem');
        $item_type = lc $mdpItem->GetItemType();
        if ( my $item_sub_type = $mdpItem->GetItemSubType() ) {
            $item_type .= ( lc "_$item_sub_type" );
        }
    }

    $template_name =~ s,\{ITEM_TYPE\},$item_type,;

    return $template_name;
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
    
    return \%params
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

