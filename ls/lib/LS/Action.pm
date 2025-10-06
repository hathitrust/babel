package LS::Action;

=head1 NAME

LS::Action (act)

=head1 DESCRIPTION

This class is a subclass of Action which see.

=head1 SYNOPSIS

$act->execute_action($C);

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Action);
use Collection;
use CollectionSet;



# ---------------------------------------------------------------------

=item after_initialize

Initialize LS::Action child using Template Method Design Pattern

=cut

# ---------------------------------------------------------------------
sub after_initialize
{
    my $self = shift;
    my $C = shift;

    # Auth
    my $auth = $C->get_object('Auth');
    my $db = $C->get_object('Database');
    my $config = $C->get_object('MdpConfig');

    my $dbh = $db->get_DBH();

    my $co = new Collection($dbh, $config, $auth);
    $C->set_object('Collection', $co);

    my $cs = new CollectionSet($dbh, $config, $auth);
    $C->set_object('CollectionSet', $cs);

    $self->set_transient_facade_member_data($C, 'collection_object', $co);
    $self->set_transient_facade_member_data($C, 'collection_set_object', $cs);

}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut

