package WAYF::Operation::WAYF;

=head1 NAME

WAYF::Operation::WAYF (op)

=head1 DESCRIPTION

This class Search implementation of the abstract Operation class.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

# MDP Modules
use base qw(Operation);

use Utils;
use Debug::DUtils;

use Operation::Status;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize WAYF::Operation::Search.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for Search action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="WAYF"});

    my $cgi = $C->get_object('CGI');
    my $act = $self->get_action();

    return $ST_OK;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut

