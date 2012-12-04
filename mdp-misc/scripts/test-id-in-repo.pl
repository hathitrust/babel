#!/usr/bin/env perl



# Perl
use Getopt::Std;
use File::Pairtree;

our ($opt_F);

my $ops = getopts('F:');


my $ID_FILENAME = $opt_F;


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
    my $ref_to_arr_of_ids = load_ids_from_file($ID_FILENAME);
    my $num_loaded = scalar(@$ref_to_arr_of_ids);

    if ($num_loaded > 0) {
        print qq{loaded $num_loaded items from file=$ID_FILENAME\n};
        
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
test_ids();

exit 0;

            
