#!/usr/bin/env perl



# Perl
use Getopt::Std;
use File::Pairtree;

our ($opt_F, $opt_I);

my $ops = getopts('I:F:');


my $ID = $opt_I;
my $ID_FILENAME = $opt_F;

sub ti_get_usage {
    return qq{Usage: test-id-in-repo.pl [ -F file | -I id ]\nchecks for id(s) by expanding to pairtree path in repository to check file existence.\n};
}

sub load_ids_from_file {
    my $filename = shift;

    my $arr;
    my $ok;
    eval {
        $ok = open(IDS, "<$filename");
    };
    if ($@) {
        my $s0 = qq{i/o ERROR:($@) opening file="$filename"\n};
        exit 1;
    }

    if (! $ok) {
        my $s1 = qq{could not open file="$filename"\n};
        exit 1;
    }

    while (my $id = <IDS>) {
        chomp($id);
        push(@$arr, $id) if($id);
    }
    close (IDS);

    return $arr;
}



sub test_ids {
    my $id = shift;
    
    my $ref_to_arr_of_ids;

    if (defined $id) {
        push(@$ref_to_arr_of_ids, $id);
    }
    else {
        $ref_to_arr_of_ids = load_ids_from_file($ID_FILENAME);
    }
    my $num_loaded = scalar(@$ref_to_arr_of_ids);

    if ($num_loaded > 0) {
        print qq{loaded $num_loaded items from file=$ID_FILENAME\n} if ($ID_FILENAME);
        
        foreach my $id (@$ref_to_arr_of_ids) {
            my ($namespace, $barcode) = ($id =~ m,^(.*?)\.(.*?)$,);
            my $root = q{/sdr1/obj/} . $namespace . q{/pairtree_root};

            # Initial pairtree module
            $File::Pairtree::root = $root;
            my $path = File::Pairtree::id2ppath($barcode) . File::Pairtree::s2ppchars($barcode);
            if (-e $path) {
                print qq{$id exists\n};
            }
            else {
                print qq{$id does not exist\n};
            }
        }
    }
}

if ($ID) {
    test_ids($ID);
}
elsif ($ID_FILENAME) {
    test_ids();
}
else {
    print ti_get_usage();
}


exit 0;

            
