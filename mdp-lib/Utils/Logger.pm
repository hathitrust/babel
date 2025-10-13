package Utils::Logger;


=head1 NAME

Logger.pm

=head1 DESCRIPTION

This non-OO package logs indexing stats

=head1 VERSION

$Id: Logger.pm,v 1.6 2009/12/21 22:04:49 pfarber Exp $

=head1 SYNOPSIS

various

=head1 METHODS

=over 8

=cut

use strict;

use File::Basename qw(basename);
use Utils;
use Utils::Time;

use Context;
use MdpConfig;
use Semaphore;

use Time::HiRes;


# ------- Configuration variables --------
our $logging_enabled = 1;

# ---------------------------------------------------------------------

=item __get_logdir_root

Description

=cut

# ---------------------------------------------------------------------
sub __get_logdir_root
{
    return $ENV{'SDRROOT'}; 
}

=item __logging_enabled

Make sure logging is not turned off.
Wraps $logging_enabled (which can be set from outside) as well
as ENV{HEALTHCHECK} to prevent imgsrv from spamming the logs.

=cut
# ---------------------------------------------------------------------
sub __logging_enabled {
    return ($logging_enabled && !$ENV{HEALTHCHECK});
}


=item __Log_string

Description

=cut

# ---------------------------------------------------------------------
use constant MAX_TRIES => 10;

sub __Log_string {
    my $C = shift;
    my $s = shift;
    my $logfile_key = shift;
    my $optional_dir_pattern = shift;
    my $optional_dir_key = shift;
    my $optional_logfile_pattern = shift;
    my $optional_logfile_key = shift;

    return unless __logging_enabled;

    my $config = ref($C) eq 'Context' ? $C->get_object('MdpConfig') : $C;

    if(my $local_log = $config->get('local_logdir')) {
        my $log_prefix = $config->get('logdir');
        if (defined($optional_dir_key) && defined($optional_dir_pattern)) {
            $log_prefix =~ s,$optional_dir_pattern,$optional_dir_key,;
        }
        my $logfile = $log_prefix . '-' . $config->get($logfile_key);
        $logfile =~ s/___DATE___//;
        if (defined($optional_logfile_key) && defined($optional_logfile_pattern)) {
            $logfile =~ s,$optional_logfile_pattern,$optional_logfile_key,;
        }

        $logfile = basename($logfile);

        # if on a local filesystem, writes in "append mode" should be atomic, so 
        # multiple processes' log output shouldn't stomp on each other
        if (open(LOG, ">>:encoding(UTF-8)", "$local_log/$logfile")) {
            LOG->autoflush(1);
            syswrite LOG, qq{$s\n};
            close(LOG);
        } else {
          print STDERR "Can't open $local_log/$logfile: $!\n";
        }
    }
}

sub __Log_struct {
    my $C = shift;
    my $message = shift;
    my $logfile_key = shift;
    my $optional_dir_pattern = shift;
    my $optional_dir_key = shift;
    my $optional_logfile_pattern = shift;
    my $optional_logfile_key = shift;

    return unless __logging_enabled;

    # get the singleton
    unless ( ref $C ) { $C = new Context; }

    if ( $$message[0][0] ne 'datetime' ) {
        unshift @$message, ['datetime', Utils::Time::iso_Time()];
    }

    require JSON::XS;
    my $json = JSON::XS->new()->utf8(1)->allow_nonref(1);
    my $s = '{';
    while ( scalar @$message ) {
        my $kv = shift @$message;
        my ( $key, $value ) = @$kv;
        my $suffix = scalar @$message ? "," : "";
        $s .= sprintf(qq{%s:%s%s}, $json->encode($key), $json->encode($value), $suffix)
    }
    $s .= '}';

    __Log_string($C, $s, $logfile_key, $optional_dir_pattern, $optional_dir_key, $optional_logfile_pattern, $optional_logfile_key);

}

sub __Log_benchmark {
    my ( $C, $message, $app_name ) = @_;
    __Log_struct($C, 
        $message, 
        'benchmark_logfile', 
        qr(slip/run-___RUN___|___QUERY___), 'benchmark',
        qr(___APP_NAME___), $app_name);
}

# ---------------------------------------------------------------------

=item __Log_simple

Description

=cut

# ---------------------------------------------------------------------
sub __Log_simple {
    my $s = shift;
    return unless __logging_enabled;

    my $date = Utils::Time::iso_Time('date');
    my $time = Utils::Time::iso_Time('time');
    my $logfile = qq{MDP-generic-$date.log.$ENV{SERVER_ADDR}};

    my $logfile_path = Utils::get_tmp_logdir() . "/$logfile";
    if (open(LOG, ">>:encoding(UTF-8)", $logfile_path)) {
        LOG->autoflush(1);
        syswrite LOG, qq{$time: $s\n};
        close(LOG);
        chmod(0666, $logfile_path) if (-o $logfile_path);
    }
    
    return $logfile_path;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
