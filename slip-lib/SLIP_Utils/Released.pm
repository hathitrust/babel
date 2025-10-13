package SLIP_Utils::Released;


=head1 NAME

SLIP_Utils::Released

=head1 DESCRIPTION

Check state of index release flag for the active production index

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

# ---------------------------------------------------------------------

=item released

Description

=cut

# ---------------------------------------------------------------------
sub released {
    my $TODAY = `date +%Y-%m-%d`;
    chomp($TODAY);

    my $release_flag = "$ENV{SDRROOT}/flags/web/lss-release-$TODAY";
    my $index_released = (-e $release_flag);

    my $msg = $index_released 
      ? "Release flag=$release_flag found"
        : "Release flag=$release_flag not present";

    return ($index_released, $msg);
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
