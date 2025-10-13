package WAYF::Action;

=head1 NAME

WAYF::Action (act)

=head1 DESCRIPTION

This class is a subclass of Action which see.

=head1 SYNOPSIS

$act->execute_action($C);

=head1 METHODS

=over 8

=cut

use base qw(Action);


# ---------------------------------------------------------------------

=item after_initialize

Initialize WAYF::Action child using Template Method Design Pattern

=cut

# ---------------------------------------------------------------------
sub after_initialize
{
    my $self = shift;
    my $C = shift;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut

