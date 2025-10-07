package SLIP_Utils::Log;


=head1 NAME

Log.pm

=head1 DESCRIPTION

This non-OO package logs indexing stats

=head1 SYNOPSIS

various

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use Utils::Time;

use Context;
use MdpConfig;
use Semaphore;


# ------- Configuration variables --------
my $LOG_FUNCTION_ENABLED = 1;
# Semaphore uses flock() -- there have been lockd bugs
my $LOG_USING_SEMAPHORE = 0;

# ---------------------------------------------------------------------

=item __get_root_logdir

Description

=cut

# ---------------------------------------------------------------------
sub __get_root_logdir
{
    return $ENV{SDRROOT}; 
}

# ---------------------------------------------------------------------

=item full_log_filepath

Description

=cut

# ---------------------------------------------------------------------
sub full_log_filepath {
    my $C = shift;
    my $logfile_key = shift;
    my $dir_pattern = shift;
    my $dir_subst = shift;

    my $config = $C->get_object('MdpConfig');

    my $logdir = __get_root_logdir() . $config->get('logdir');
    $logdir =~ s,$dir_pattern,$dir_subst,;

    my $logfile = $config->get($logfile_key);
    my $date = Utils::Time::iso_Time('date');

    $logfile =~ s,___DATE___,-$date,;
    $logfile .= ".$ENV{SERVER_ADDR}";

    my $logfile_path = $logdir . '/' . $logfile;

    return ($logfile_path, $logdir);
}




# ---------------------------------------------------------------------

=item this_string

Description

=cut

# ---------------------------------------------------------------------
sub this_string {
    my $C = shift;
    my $s = shift;
    my $logfile_key = shift;
    my $dir_pattern = shift;
    my $dir_subst = shift;
    my $no_newline = shift;

    return if (! $LOG_FUNCTION_ENABLED);

    my ($logfile_path, $logdir) = full_log_filepath($C, $logfile_key, $dir_pattern, $dir_subst);

    Utils::mkdir_path($logdir);

    # --- BEGIN CRITICAL SECTION ---
    my $sem;
    if ($LOG_USING_SEMAPHORE) {
        use constant MAX_TRIES => 10;
        my $tries = 0;
        my $lock_file = $logfile_path . '.sem';
        while (! ($sem = new Semaphore($lock_file))) {
            $tries++;
            last if ($tries > MAX_TRIES);
            sleep 1;
        }
    }
    if ( open(LOG, '>>:encoding(UTF-8)', $logfile_path) ) {
        LOG->autoflush(1);
        print LOG ($no_newline ? qq{$s} : qq{$s\n});
        close(LOG);
    }

    $sem->unlock()
        if ($sem);
    # --- END CRITICAL SECTION ---
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
