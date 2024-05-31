#!/usr/bin/env perl

use feature qw(say);
use IO::File;
use Data::Dumper;
use Date::Manip;
use IPC::Run qw(run);
use File::Basename qw(basename);
use Getopt::Long;

# By default use any NNNN-NN-NN datestamp
my $yyyymmdd = '[0-9][0-9][0-9][0-9]-[0-9][0-9]-[0-9][0-9]';
my $hh = UnixDate('1 hour ago', "%H");
my $debug;
my $verbose;

GetOptions("yyyymmdd=s" => \$yyyymmdd,
           "hh=s" => \$hh,
           "debug" => \$debug,
           "v" => \$verbose);

my $pattern = qq{.*-$yyyymmdd.log.[0-9]+.[0-9]+.[0-9]+.[0-9]+.[0-9]+\$};

my $possibles = {};

umask(0000);

my $logdir = "$ENV{SDRROOT}/logs";
opendir my $dh, $logdir or die "Could not open $logdir - $!";
my @dirs = grep { $_ ne '.' and $_ ne '..' and $_ ne 'tmp' and -d "$logdir/$_" } readdir $dh;
foreach my $dir ( @dirs ) {
    next unless ( -d "$logdir/$dir/$hh" );
    say "= $logdir/$dir/$hh - $pattern" if ( $verbose );
    my $in = new IO::File qq{find "$logdir/$dir/$hh" -type f -regex '$pattern' 2>/dev/null | };
    while ( my $input_filename = <$in> ) {
        chomp $input_filename;
        my $target_filename = basename($input_filename);
        # remove the PID + HH
        $target_filename =~ s,\.\d+$,,;
        $target_filename = "$logdir/$dir/$target_filename";
        touch($target_filename);

        my $cmd = [ "/bin/cat", $input_filename ];
        run $cmd, ">>", $target_filename;
        unless ( $debug ) {
            unlink $input_filename;
        }
        
        if ( $verbose ) {
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