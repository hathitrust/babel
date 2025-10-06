package Operation::Status;


=head1 NAME

Operation:Status

=head1 DESCRIPTION

This package defines the base "OK" opcode
Operation.

=head1 VERSION

=head1 SYNOPSIS

see MBooks::Operation:Status;

=over 8

=cut

use Exporter;
use base qw(Exporter);

our @EXPORT = qw( $ST_OK );

$ST_OK = 0;

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
