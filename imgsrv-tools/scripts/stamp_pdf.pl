#!/usr/bin/env perl

use Data::Dumper;
use FindBin qw($Bin);
use IPC::Run qw(run);
use Getopt::Long;

my $options = {};
GetOptions($options,
    "config_filename=s",
);

my $cmd = [
  #    "java", "-cp", "$Bin/../target/stamper-1.0-SNAPSHOT.jar",
  "java", "-cp", "$Bin/../target/stamper-1.1.jar",
        "org.hathitrust.tools.Stamper",
        $$options{config_filename},
    ];

run $cmd;
