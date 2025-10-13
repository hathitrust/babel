package Document::Reporter;


=head1 NAME

Document::Reporter

=head1 DESCRIPTION

This package combined debugging and logging.

=head1 SYNOPSIS

use Document::Reporter;
report($where, $what);

=head1 METHODS

=over 8

=cut

use Debug::DUtils;
use Utils::Logger;

use Exporter;
use base qw(Exporter);

our @EXPORT = qw( report );


# ---------------------------------------------------------------------

=item reprot

Description

=cut

# ---------------------------------------------------------------------
sub report {
    my $msg = shift;
    my $log = shift;
    my $debug_switch = shift;

    if ( DEBUG($debug_switch) || $log ) {
        my $host = `hostname`; chomp($host);
        my ($package, $filename, $line, $subroutine, $hasargs, $wantarray, $evaltext, $is_require, $hints, $bitmask, $hinthash) = caller(1);
        my $s = $msg . qq{ $host $$ $package $filename $line $subroutine};

        DEBUG($debug_switch, $s);
        Utils::Logger::__Log_simple($s) if ($log);
    }
}

1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
