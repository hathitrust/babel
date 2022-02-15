#!/usr/bin/env perl

use IO::File;
use Date::Manip;
use Data::Dumper;

# aggregate and sort log data
my @lines = ();
while ( my $LOGFILE = shift @ARGV ) {
    print STDERR "== $LOGFILE\n";
    my $in = new IO::File $LOGFILE or die "Could not open $LOGFILE - $!";
    while ( my $line = <$in> ) {
        chomp $line;
        next if ( $line =~ m,^\s*$, );
        push @lines, [ split( /\|/, $line ) ];
    }
}

@lines = sort { $$a[1] cmp $$b[1] } @lines;

my %map = ();
my $last;
while ( my $row = shift @lines ) {
    my ( 
        $remote_addr,
        $ts,
        $previous_ts,
        $client_idtype,
        $cache_key,
        $choke,         # always request
        $choke_debt,
        $choke_max,
        $choke_until
    ) = @$row;

    if ( qq{$remote_addr,$choke_until} eq $last ) {
        next;
    }

    unless ( ref($map{$remote_addr,$cache_key}) ) {
        $map{$remote_addr,$cache_key} = [];
    }
    
    $last = qq{$remote_addr,$choke_until};
    
    push @{ $map{$remote_addr,$cache_key} }, $row;
    
}

my @max_dims = ();
my $do_print_header = 1;

my %events = ();

foreach my $key ( sort keys %map ) {
    my ( $remote_addr ) = $map{$key}->[0]->[0];
    my ( $cache_key ) = $map{$key}->[0]->[4];
    
    my @table = ();
    push @table, [ 'TS', '+Y:M:D:W:H:M:S', 'DEBT', 'LIMIT'];

    foreach my $row ( @{ $map{$key} } ) {
        my ( 
            $remote_addr,
            $ts,
            $previous_ts,
            $client_idtype,
            $cache_key,
            $choke,         # always request
            $choke_debt,
            $choke_max,
            $choke_until
        ) = @$row;
        
        my $delta = '-';
        if ( $previous_ts > 0 ) {
            #  Y M D W H M S 
            # +0:0:0:0:0:0:2
            $delta = DateCalc($previous_ts, $ts);
        }
        
        push @table, [ $ts, $delta, sprintf("%.04f", $choke_debt), $choke_max ];
        foreach my $i ( 0 .. $#{$table[-1]} ) {
            if ( length($table[-1][$i]) > length($max_dims[$i]) ) {
                $max_dims[$i] = length($table[-1][$i]);
            }
            $max_dims[1] = 20;
        }

        $events{$cache_key} += 1;        
    }
    
    my $row = shift @table;
    
    if ( $do_print_header ) {
        my @line = ();
        foreach my $i ( 0 .. $#$row ) {
            push @line, sprintf("    %-${max_dims[$i]}s", $$row[$i]);
        }
        print join("\t", @line), "\n";
        $do_print_header = 0;
    }
    
    print sprintf("%-15s\t%s", $remote_addr, $cache_key), "\n";
    foreach my $row ( @table ) {
        my @line = ();
        foreach my $i ( 0 .. $#$row ) {
            push @line, sprintf("    %-${max_dims[$i]}s", $$row[$i]);
        }
        print join("\t", @line), "\n";
    }
    print "\n";
    
    @table = ();
    
}

print "\nEvents:\n";
foreach my $event ( sort { $events{$b} <=> $events{$a} } keys %events ) {
    print sprintf("    %-10s: $events{$event}", $event), "\n";
}