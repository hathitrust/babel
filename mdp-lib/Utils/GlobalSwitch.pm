package Utils::GlobalSwitch;


=head1 NAME

Utils::GlobalSwitch

=head1 DESCRIPTION

This package encapsulates functions that (mostly cron) client code can
call to test whether to run or not.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut
umask 0000;

use strict;

# Fast way to turn things off without touching files
my $CRON_JOBS_DISABLED = 0;
# Fast way to enable cron jobs if files have been touched
my $GlobalSwitch_ignore_STOP_files = 0;

my %app2file_map =
  (
   'slip' => 'STOPSLIP',
  );

sub Exit_If_cron_jobs_disabled {
    my $app = shift;

    exit 0
        if (cron_jobs_disabled($app));
}

sub cron_jobs_disabled {
    my $app = shift;

    # If the STOP files are ignored, cron jobs are enabled
    return 0
        if ($GlobalSwitch_ignore_STOP_files);

    my $file = $app2file_map{$app};
    return (
            $CRON_JOBS_DISABLED
            ||
            (-e "$ENV{SDRROOT}/$app/etc/$file")
           );
}

sub stop_file_name {
    my $app = shift;

    my $file = $app2file_map{$app};
    return "$ENV{SDRROOT}/$app/etc/$file";
}

sub disable_cron_jobs {
    my $app = shift;

    # If the STOP files are ignored, cron jobs are enabled
    return 0
        if ($GlobalSwitch_ignore_STOP_files);

    my $file = $app2file_map{$app};
    `touch "$ENV{SDRROOT}/$app/etc/$file"`;
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
