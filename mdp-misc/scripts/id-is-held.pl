#!/usr/bin/env perl


# Perl
use Getopt::Std;

use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;


use Context;
use Database;
use DbUtils;
use SLIP_Utils::Common;

our ($opt_F, $opt_I);

my $ops = getopts('I:F:');


my $C = new Context;

my $config = SLIP_Utils::Common::gen_SLIP_config(11);
$C->set_object('MdpConfig', $config);

my $db = new Database('ht_web');
my $DBH = $db->get_DBH();


my $ID = $opt_I;
my $ID_FILENAME = $opt_F;

sub ho_get_usage {
    return qq{Usage: id-is-help.pl [ -F file | -I id ]\nchecks for id(s) in holdings_htitem_htmember.\n};
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

sub get_holdings_rows {
    my ($id) = @_;

    my $statement = qq{SELECT member_id, copy_count, access_count FROM holdings_htitem_htmember WHERE volume_id=?};
    my $sth = DbUtils::prep_n_execute($DBH, $statement, $id);
    my $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});

    return $ref_to_arr_of_hashref;
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
            my $ref_to_arr_of_hashref = get_holdings_rows($id);
            unless (scalar @$ref_to_arr_of_hashref) {
                print qq{$id not in PHDB\n};
                next;
            }


            foreach my $hashref (@$ref_to_arr_of_hashref) {
                printf("\tmember = %-10s copies = %-3s access = %-3s\n", $hashref->{member_id}, $hashref->{copy_count}, $hashref->{access_count});
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

            
