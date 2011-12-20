#!/usr/bin/env perl

use strict;

use File::Slurp;
my $apps_filename = qq{$ENV{SDRROOT}/mdp-tools/lib/Config/app-list.txt};

my @module_list = ();

foreach my $app_dir ( File::Slurp::read_file($apps_filename) ) {
    chomp($app_dir);
    my $full_path = qq{$ENV{SDRROOT}/$app_dir};
    print STDERR qq{processing $full_path\n};
    
    chdir($full_path);
    my @modules = `$ENV{SDRROOT}/mdp-misc/scripts/modules-regexp.sh`;
    chomp(@modules);
    map { s,;,, } @modules;
      
    push(@module_list, @modules);
}

my %module_hash = map { $_ => 0 } @module_list;
my @unique_module_list = keys %module_hash;

my $the_list = join("\n", @unique_module_list);

print $the_list;

exit 0;



