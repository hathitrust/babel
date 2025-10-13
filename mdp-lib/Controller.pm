package Controller;


=head1 NAME

Controller (ctl)

=head1 DESCRIPTION

This class is the traffic-cop for the application. It coordinates the
use of the dispatcher and the view classes.

=head1 VERSION

$Id: Controller.pm,v 1.3 2008/01/04 18:03:15 pfarber Exp $

=head1 SYNOPSIS

my $ctl = new MBooks::Controller($C, $dph, $vw);

...

$ctl->run_controller($C);

=head1 METHODS

=over 8

=cut

BEGIN
{
    if ($ENV{'HT_DEV'})
    {
        require "strict.pm";
        strict::import();
    }
}

use Context;
use Action;
use Action::Bind;
use View;
use Utils;



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

Initialize Controller object must be implemented in subclass.

=cut

# ---------------------------------------------------------------------
sub _initialize 
{
    my $self = shift;
    my $C = shift;
    ASSERT(0, qq{_initialize() in __PACKAGE__ is pure virtual});
}



# ---------------------------------------------------------------------

=item run_controller

Controller pure virtual method.  Must be subclassed for
application specific functionality.

=cut

# ---------------------------------------------------------------------
sub run_controller
{
    my $self = shift;
    my $C = shift;
    ASSERT(0, qq{run_controller() in __PACKAGE__ is pure virtual});
}




# ---------------------------------------------------------------------

=item get_action

Action object accessor.

=cut

# ---------------------------------------------------------------------
sub get_action 
{
    my $self = shift;
    return $self->{'action'};
}


# ---------------------------------------------------------------------

=item set_action

Action object accessor.

=cut

# ---------------------------------------------------------------------
sub set_action 
{
    my $self = shift;
    my $act = shift;
    $self->{'action'} = $act;
}


# ---------------------------------------------------------------------

=item get_view

View object accessor.

=cut

# ---------------------------------------------------------------------
sub get_view
{
    my $self = shift;
    return $self->{'view'};
}


# ---------------------------------------------------------------------

=item set_view

View object accessor.

=cut

# ---------------------------------------------------------------------
sub set_view
{
    my $self = shift;
    my $vw = shift;
    $self->{'view'} = $vw;
}






1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
 
