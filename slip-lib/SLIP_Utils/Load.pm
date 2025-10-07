package SLIP_Utils::Load;


=head1 NAME

SLIP_Utils::Load

=head1 DESCRIPTION

This package contains a file loading routine

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use SLIP_Utils::States;
use SLIP_Utils::Common;

# ---------------------------------------------------------------------

=item load_ids_from_file

Description

=cut

# ---------------------------------------------------------------------
sub load_ids_from_file {
    my $C = shift;
    my $filename = shift;

    my @arr;
    my $ok;
    eval {
        $ok = open(IDS, "<$filename");
    };
    if ($@) {
        my $s0 = qq{i/o ERROR:($@) opening file="$filename"\n};
        __output($s0);

        exit $SLIP_Utils::States::RC_BAD_ARGS;
    }

    if (! $ok) {
        my $s1 = qq{could not open file="$filename"\n};
        __output($s1);

        exit $SLIP_Utils::States::RC_BAD_ARGS;
    }

    while (my $id = <IDS>) {
        chomp($id);
        push(@arr, $id)
            if($id);
    }
    close (IDS);

    return \@arr;
}

# ---------------------------------------------------------------------

=item write_ids_to_file

Description

=cut

# ---------------------------------------------------------------------
sub write_ids_to_file {
    my $C = shift;
    my $filename = shift;
    my $id_arr_ref = shift;

    my $ok;
    
    eval {
        $ok = open(IDS, ">$filename");
    };
    if ($@) {
        my $s0 = qq{i/o ERROR:($@) opening file="$filename"\n};
        __output($s0);

        exit $SLIP_Utils::States::RC_BAD_ARGS;
    }

    if (! $ok) {
        my $s1 = qq{could not open file="$filename"\n};
        __output($s1);

        exit $SLIP_Utils::States::RC_BAD_ARGS;
    }

    foreach(@$id_arr_ref) {
        print IDS "$_\n";
    }
    close (IDS);
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
