#!/usr/bin/env perl

use feature qw(say);
use IPC::Run qw(run);

while ( my $line = <STDIN> ) {
    chomp $line;
    my ( $code, $organization, $flag, $label ) = split(/::/, $line);

    my $cmd = [ "./scripts/generate_mark_bw.pl", "--skip"];
    push @$cmd, "--code", $code;
    push @$cmd, "--organization", $organization;
    if ( $flag ) {
        push @$cmd, "--digitized";
        push @$cmd, "--digitized_label", $label if ( $label );
    } else {
        push @$cmd, "--original" if ( -f "$code/collection/100.png" );
        push @$cmd, "--digitized" if ( -f "$code/digitization/100.png" );
    }

    # say join(" ", @$cmd);
    run $cmd;

 }