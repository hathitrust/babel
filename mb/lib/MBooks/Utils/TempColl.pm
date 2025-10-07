package MBooks::Utils::TempColl;

=head1 NAME

MBooks::Utils::TempColl

=head1 DESCRIPTION

This package handles tests on temporary collections;

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use Context;
use Session;
use Collection;

# ---------------------------------------------------------------------

=item coll_is_temporary

Description

=cut

# ---------------------------------------------------------------------
sub coll_is_temporary {
    my ($C, $co, $coll_id) = @_;

    my $owner = $co->get_coll_owner($coll_id);

    my $session_id = 0;
    if ($C->has_object('Session')) {
        $session_id = $C->get_object('Session')->get_session_id();
    }

    return ($session_id eq $owner) ? 1 : 0;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
