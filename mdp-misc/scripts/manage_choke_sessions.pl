#!/usr/bin/env perl

use vars qw(
            $opt_m
            $opt_a
            $opt_i
            $opt_k
            $opt_s
           );


use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

# ----------------------------------------------------------------------
# remove in production
use strict;

use IO::File;
use Getopt::Std;
use MdpConfig;
use Utils::GlobalSwitch;
use File::Slurp;
use File::Basename;
use Data::Dumper;

use JSON::XS;      # for thawing data

# configuration
my $g_config = new MdpConfig(
                             Utils::get_uber_config_path('mdp-misc'),
                             $ENV{SDRROOT} . "/mdp-misc/lib/Config/global.conf",
                             $ENV{SDRROOT} . "/mdp-misc/lib/Config/local.conf"
                          );


# --------------------------------------------------
# configurable default value for age in minutes
my $g_default_age = '120';

# --------------------------------------------------
#       MAIN
# --------------------------------------------------

check_usage();

if ($opt_m eq 'list')
{
    list_sessions();
}
elsif ( $opt_m eq 'delete')
{
    delete_session($opt_i, $opt_k);
}
else
{
    clean_sessions($opt_a);
}

exit;

sub list_sessions {

    my @max_dims = ();
    my @table = ();
    push @table, ['MODIFIED', 'LOCKED UNTIL', 'APP-KEY', 'ID TYPE', 'ID', 'POLICY', 'DEBT', 'MAX DEBT', 'CR/RATE'];
    
    foreach ( @table ) {
        push @max_dims, length($_);
    }
    
    my $in = new IO::File qq{find $opt_s -type f -printf '%T@ %p\n' | sort -k 1 -n -r |};
    while ( my $line = <$in> ) {
        chomp $line;
        my ( $mtime, $filename ) = split(/ /, $line);
        my $data = decode_json(read_file($filename));
        next unless ( $$data{_ts} );
        
        my $key = basename($filename, ".json");
        
        my $until_ts = $$data{_until_ts} ? Utils::Time::iso_Time('datetime', $$data{_until_ts}) : '-';
        my @output = (Utils::Time::iso_Time('datetime', $$data{_ts}), $until_ts, $key, $$data{_idtype}, $$data{_client_identifier});
        foreach my $type ( grep(!/^_/, keys %$data) ) {
            my $policy_data = $$data{$type};
            my @tmp = ();
            push @tmp, sprintf("%.04f", $$policy_data{debt});
            push @tmp, $$policy_data{max_debt};
            if ( $$policy_data{credit_rate} ) {
                push @tmp, $$policy_data{credit_rate} ;
            } else {
                push @tmp, "-";
            }
            # print join("\t", @output, $type, @tmp), "\n";
            push @table, [ @output, $type, @tmp ];
        }
        foreach my $i ( 0 .. $#{$table[-1]} ) {
            if ( length($table[-1][$i]) > length($max_dims[$i]) ) {
                $max_dims[$i] = length($table[-1][$i]);
            }
        }
    }
    
    foreach my $row ( @table ) {
        my @line = ();
        foreach my $i ( 0 .. $#$row ) {
            push @line, sprintf("%-${max_dims[$i]}s", $$row[$i]);
        }
        print join("\t", @line), "\n";
    }
    
}

sub clean_sessions {
    my $cutoff_age = shift;

    # get cutoff time based on now's time and cutoff age in minutes
    my $cutoff_time = time - (60 * $cutoff_age);
    
    my $ses_deleted_count = 0;
    my $checked_count = 0;
    
    my $in = new IO::File qq{find $opt_s -type f -printf '%T@ %p\n' | sort -k 1 -n -r |};
    while ( my $line = <$in> ) {
        chomp $line;
        $checked_count += 1;
        my ( $mtime, $filename ) = split(/ /, $line);
        if ( $mtime <= $cutoff_time ) {
            $ses_deleted_count += 1;
            unlink $filename;
        }
    }
    
    print STDOUT "Processed $checked_count sessions\n";
    print STDOUT "Deleted $ses_deleted_count sessions\n";
    if ($checked_count) {
        printf("Freshness: %.1f %\n", (($checked_count - $ses_deleted_count)/$checked_count)*100);
    }
    else {
        print("Freshness: 100 %\n");
    }
    
}

sub delete_session {
    my $target_id = shift;
    my $target_key = shift;
    
    my $in = new IO::File qq{find $opt_s -type f -printf '%T@ %p\n' | sort -k 1 -n -r |};
    while ( my $line = <$in> ) {
        chomp $line;
        my ( $mtime, $filename ) = split(/ /, $line);
        my $data = decode_json(read_file($filename));
        my $key = basename($filename, ".json");
        
        if ( $$data{_client_identifier} ne $target_id ) { next; }
        if ( $target_key && $key !~ m,^$target_key, ) { next; }
        
        print "Deleting: $target_id : $key\n";
        unlink($filename);
    }
}

# ---------------------------------------------------------------------

=item check_usage


=cut

# ---------------------------------------------------------------------
sub check_usage
{
    # get command line options
    getopt('m:a:i:k:s:');

    if (! $opt_m  ||
         ($opt_m  ne 'list' &&
           $opt_m  ne 'delete' &&
           $opt_m  ne 'clean')
      )
    {
        &print_usage() ;
        exit;
    }
    elsif ( $opt_m eq 'delete' && ! $opt_i )
    {
        &print_usage();
        exit;
    }
    elsif ($opt_m eq 'clean' && ! $opt_a)
    {
        $opt_a = $g_default_age;
        return;
    }
    
    if ( ! $opt_s ) { $opt_s = qq{/ram/choke} ; }
}

# ----------------------------------------------------------------------
# NAME         : print_usage
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub print_usage
{
    print STDOUT qq{Usage:\n};
    print STDOUT qq{$0 -m list\n\t\tfor a list of current sessions\n};
    print STDOUT qq{$0 -m clean -a age\n\t\twhere "age" is maximum age in minutes of sessions to leave alive\n};
    print STDOUT qq{$0 -m clean\n\t\twhere "age" defaults to $g_default_age\n\n};
    print STDOUT qq{$0 -m delete -i id\n\t\twhere "id" is a client id\n\n};
    print STDOUT qq{$0 -m delete -i id -k key\n\t\twhere "id" is a client id and "key" is the app-key; "key" can be the beginning of the app-key (e.g. imgsrv to match imgsrv-image)\n\n};
    print STDOUT qq{Use -s path to specify a different "path" to a session directory; default is /ram/choke.\n};
}



__END__;