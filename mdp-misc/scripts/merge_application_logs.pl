#!/usr/bin/env perl

use feature qw(say);
use IO::File;
use Data::Dumper;
use Date::Manip;
use IPC::Run qw(run);
use Getopt::Long;

my $yyyymmdd = UnixDate('now', '%Y-%m-%d');
my $hh = UnixDate('1 hour ago', "%H");
my $debug;

GetOptions("yyyymmdd=i" => \$yyyymmdd,
           "hh=i" => \$hh,
           "debug" => \$debug);

my $pattern = qq{.*-$yyyymmdd.log.[0-9]+.[0-9]+.[0-9]+.[0-9]+.[0-9]+.$hh\$};

my $possibles = {};

umask(0000);

my $logdir = "$ENV{SDRROOT}/logs";
opendir my $dh, $logdir or die "Could not open $logdir - $!";
my @dirs = grep { $_ ne '.' and $_ ne '..' and $_ ne 'tmp' and -d "$logdir/$_" } readdir $dh;
foreach my $dir ( @dirs ) {
    my $in = new IO::File qq{find "$logdir/$dir" -type f -regex '$pattern' | };
    while ( my $input_filename = <$in> ) {
        chomp $input_filename;
        my $target_filename = $input_filename;
        # remove the PID + HH
        $target_filename =~ s,\.\d+\.$hh$,,;
        touch($target_filename);
        my $cmd = [ "/bin/cat", $input_filename ];
        run $cmd, ">>", $target_filename;
        unless ( $debug ) {
            unlink $input_filename;
        } else {
            say $input_filename;
        }
    }
}

sub touch {
    my ( $filename ) = @_;
    if ( ! -f $filename ) {
        open(my $fh, ">>", $filename);
        close($fh);
    }
}