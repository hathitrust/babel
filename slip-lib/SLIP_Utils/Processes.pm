package SLIP_Utils::Processes;


=head1 NAME

Processes

=head1 DESCRIPTION

Some useful subs.

=head1 VERSION

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut


# ---------------------------------------------------------------------

=item num_producers_running

Description

=cut

# ---------------------------------------------------------------------
sub num_producers_running {
    my ($C, $producer_pattern, $effective_uid) = @_;

    return __count_processes_this_pattern($producer_pattern, $effective_uid);
}

# ---------------------------------------------------------------------

=item is_tomcat_running

Description

=cut

# ---------------------------------------------------------------------
sub is_tomcat_running {
    my ($C, $tomcat_pattern) = @_;
    my $euid = $C->get_object('MdpConfig')->get('tomcats_run_as_user');
    return __count_processes_this_pattern($tomcat_pattern, $euid);
}

# ---------------------------------------------------------------------

=item __count_processes_this_pattern 

Description

=cut

# ---------------------------------------------------------------------
sub __count_processes_this_pattern {
    my $pattern = shift;
    my $euid = shift;

    chomp($euid);
    my $ct = `pgrep -fl -u $euid '$pattern' | wc -l`;
    chomp($ct);
    
    return $ct;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
