package App;


=head1 NAME

App (app)

=head1 DESCRIPTION

This class provides a framework for high level application logic not
appropriate to the Controller.

=head1 VERSION

$Id: App.pm,v 1.15 2009/12/15 16:27:07 pfarber Exp $

=head1 SYNOPSIS

my $app = new App($C, 'someapp');

my $ctl = new MBooks::Controller($C, $dph, $vw);

$app->run_application($C, $ctl);


=head1 METHODS

=over 8

=cut

BEGIN {
    if ($ENV{'HT_DEV'}) {
        require "strict.pm";
        strict::import();
    }
}

use Utils;
use Debug::DUtils;
use Context;
use Controller;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}




# ---------------------------------------------------------------------

=item _initialize

Initialize App object.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $C = shift;
    my $name = shift;

    $self->{'application_name'} = $name;
}


# ---------------------------------------------------------------------

=item run_application

Obvious

=cut

# ---------------------------------------------------------------------
sub run_application {
    my $self = shift;
    my ($C, $ctl) = @_;

    $ctl->run_controller($C);
}

# ---------------------------------------------------------------------

=item get_app_name

Description

=cut

# ---------------------------------------------------------------------
sub get_app_name {
    my $self = shift;
    my $C = shift;

    return $self->{'application_name'};
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
