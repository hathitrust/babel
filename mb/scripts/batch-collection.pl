#!/usr/bin/env perl

use strict;
use warnings;


BEGIN {
    ## $ENV{DEBUG_LOCAL} = 1;
}

=head1 NAME

batch-collection

=head1 USAGE

See Usage below

=head1 DESCRIPTION

Create an MBooks collection prior to SLIP fulltext indexing (for
"large" collections).  Throughput appears to be 20,000 items / hour.

Collection creation is private by default.  Use Collection Builder to
change to Public.  Id list is expected to be HathiTrust id format.

=head1 OPTIONS

=over 8

=item -t

collection title  (can be edited later in Collection Builder)

=item -d

collection description (can be edited later in Collection Builder)

=item -o

uniqname that will own the collection

=item -a

append id list to collection=coll_id

=back

=cut

# ----------------------------------------------------------------------
# Set up paths for local libraries -- must come first
# ----------------------------------------------------------------------
use Cwd qw(abs_path);
use File::Basename;

my $LOCATION;
BEGIN {
    $LOCATION = dirname(__FILE__);
}

# Always get libraries from current location instead of $ENV{SDROOT}
# for normal users who may have libraries in $ENV{SDRROOT} that are
# not up to date.  Developers can override this via DEBUG_LOCAL
use lib $LOCATION . "/../../mb/vendor/common-lib/lib";
use lib $LOCATION . "/../../mb/vendor/common-lib/lib/Utils";
use Vendors;


use Getopt::Std;
use CGI;

use Utils;
use Utils::Time;
use Context;
use Identifier;
use MdpConfig;
use Collection;
use Access::Rights;
use Debug::DUtils;
use SharedQueue;
use MBooks::MetaDataGetter;

my @superusers =
  (
   'pfarber',
   'roger',
  );

my @allowed_uniqnames =
  (
   'tburtonw',
   'pfarber',
   'roger',
   'jweise',
   'sooty',
   'khage',
   'kshawkin',
   'rwelzenb',
   'sethip',
   'jjyork',
   'blancoj',
  );

my @allowed_overrides =
  (
   'hathitrust@gmail.com',
  );

my @allowed_users = (@superusers, @allowed_uniqnames, @allowed_overrides);

sub bc_Usage {
    print qq{Usage: [ADD]     batch-collection.pl -t 'quoted title' -d 'quoted description text' -o userid -f <filename>\n\n};

    print qq{       [APPEND]  batch-collection.pl -a coll_id -o userid -f <filename>\n\n};

    print qq{       [DELETE]  batch-collection.pl -D coll_id -o superuserid -f <filename>\n\n};

    print qq{       [EXPUNGE] batch-collection.pl -X coll_id -o superuserid\n\n};

    print qq{       [QUERY]   batch-collection.pl -c -t title -o userid\n\n};

    print qq{       [QUERY]   batch-collection.pl -C <coll_id>\n\n};
    print qq{Options:\n};
    print qq{       -f <filename> file of HathiTrust IDs, one per line\n};
    print qq{       -t '<title>' collection title as a quoted string\n};
    print qq{       -d '<description>' collection description as a quoted string\n};
    print qq{       -o <userid> (must match your kerberos/Shibboleth/other uniqname)\n};
    print qq{       -a <coll_id> append IDs to coll_id. Obtain <coll_id> using batch_collection.pl -c option\n};
    print qq{       -D <coll_id> [superuser only] delete IDs from coll_id. Obtain <coll_id> using batch_collection.pl -c option\n};
    print qq{       -X <coll_id> [superuser only] delete entire collection. Obtain <coll_id> using batch_collection.pl -c option\n};
    print qq{       -c returns the coll_id for collection with -t '<title>' owned by -o <userid>\n};
    print qq{       -C returns the <userid>, display_name, title for collection with -C <coll_id>\n\n};
    print qq{Notes:\n};
    print qq{       IDs are HathiTrust IDs, e.g. mdp.39015012345\n};
    print qq{       Blank lines or lines beginning with a '#' are ignored\n};
    print qq{       Set the BATCH_COLLECTION_USER environment variable to over-ride whoami for group-owned collections\n\n};

}

our ($opt_t, $opt_d, $opt_o, $opt_f, $opt_a, $opt_c, $opt_D, $opt_C, $opt_X);
getopts('ct:d:o:f:a:D:C:X:');

my $INPUT_FILE = $opt_f || 'general';

my $date = Utils::Time::iso_Time('date');
my $time = Utils::Time::iso_Time('time');
my $LOGFILE = $INPUT_FILE . qq{-$date-$time.log};

my $WHO_AM_I_REALLY = `whoami`;
chomp($WHO_AM_I_REALLY);

my $NON_SUPERUSER = 1;
my $SUPERUSER = 0;

foreach my $superuser (@superusers) {
    if ($WHO_AM_I_REALLY eq $superuser) {
        $NON_SUPERUSER = 0;
        $SUPERUSER = 1;
        last;
    }
}

if ($NON_SUPERUSER) {
    my $path = abs_path($0);
    #print "ABSPATH: $path\n";

    unless ( index($path, "test.babel") >= 0 ) {
        print( qq{ERROR: Please run the copy of batch-collection.pl located in /htapps/test.babel/mb/scripts\n} );
        exit 1;
    }

    my $ip_address = `hostname -i`;
    chomp($ip_address);
    my $host_info = `host -i test.babel.hathitrust.org`;
    my ($test_dot_babel_ip_address) = ($host_info =~ /(\d+\.\d+\.\d+\.\d+)/s);
    unless ($ip_address eq $test_dot_babel_ip_address) {
        print( qq{ERROR: Please run batch-collection.pl when logged into host test.babel.hathitrust.org\n} );
        exit 1;
    }
}

my $WHO_I_AM = $ENV{BATCH_COLLECTION_USER} || $WHO_AM_I_REALLY;
chomp($WHO_I_AM);
unless (grep(/^$WHO_I_AM$/, @allowed_users)) {
    Log_print( qq{ERROR: $WHO_I_AM is not in the list of permitted users\n} );
    exit 1;
}

my $APPEND = $opt_a;
my $COLL_ID = $opt_c;
my $DELETE = $opt_D;
my $EXPUNGE = $opt_X;
my $USERID = $opt_C;

my $CREATE = 0;

if ($EXPUNGE) {
    if ($EXPUNGE !~ m,\d+,) {
        Log_print( qq{ERROR: invalid coll_id arg to expunge (-X) option\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($NON_SUPERUSER) {
        Log_print( qq{ERROR: $WHO_I_AM is not in the list of superusers\n} );
        exit 1;
    }
    unless ($opt_o) {
        Log_print( qq{missing -o option for collection expunge operation\n\n} );
        bc_Usage();
        exit 1;
    }
}
elsif ($DELETE) {
    if ($DELETE !~ m,\d+,) {
        Log_print( qq{ERROR: invalid coll_id arg to delete (-D) option\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($NON_SUPERUSER) {
        Log_print( qq{ERROR: $WHO_I_AM is not in the list of superusers\n} );
        exit 1;
    }
    if ((! $opt_o) || (! $opt_f)) {
        Log_print( qq{missing -o or -f options for collection item deletion operation\n\n} );
        bc_Usage();
        exit 1;
    }
}
elsif ($APPEND) {
    if ($APPEND !~ m,\d+,) {
        Log_print( qq{ERROR: invalid coll_id arg to append (-a) option\n\n} );
        bc_Usage();
        exit 1;
    }
    if ((! $opt_o) || (!$opt_f)) {
        Log_print( qq{ERROR: missing -o or -f options for append (-a) operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($opt_t || $opt_d) {
        Log_print( qq{ERROR: options -t or -d options are not supported for append (-a) operation\n\n} );
        bc_Usage();
        exit 1;
    }
}
elsif ($COLL_ID) {
    if ((! $opt_o) || (! $opt_t)) {
        Log_print( qq{ERROR: missing -o or -t options for coll_id query (-c) operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($opt_a || $opt_d) {
        Log_print( qq{ERROR: options -a or -d options are not supported for coll_id query (-c) operation\n\n} );
        bc_Usage();
        exit 1;
    }
}
elsif ($USERID) {
}
else {
    if ($opt_t && ((! $opt_d) || (! $opt_o) || (! $opt_f))) {
        Log_print( qq{missing -d or -o or -f options for collection creation operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($opt_d && ((! $opt_t) || (! $opt_o) || (! $opt_f))) {
        Log_print( qq{missing -t or -o or -f options for collection creation operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($opt_o && ((! $opt_t) || (! $opt_d) || (! $opt_f))) {
        Log_print( qq{missing -t or -d or -f options for collection creation operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ($opt_f && ((! $opt_t) || (! $opt_d) || (! $opt_o))) {
        Log_print( qq{missing -t or -d or -o options for collection creation operation\n\n} );
        bc_Usage();
        exit 1;
    }
    if ((! $opt_t) || (! $opt_d) || (! $opt_o) || (! $opt_f)) {
        bc_Usage();
        exit 0;
    }
    $CREATE = 1;
}

my ($C_TITLE, $C_DESC, $C_OWNER, $C_OWNER_NAME, $C_COLL_ID);
if ($APPEND) {
    ($C_OWNER, $C_OWNER_NAME, $C_COLL_ID) =
      ($opt_o, $opt_o, $opt_a,);
}
else {
    ($C_TITLE, $C_DESC, $C_OWNER, $C_OWNER_NAME) =
      ($opt_t, $opt_d, $opt_o, $opt_o,);
}

Utils::map_chars_to_cers(\$C_DESC, [q{"}, q{'}]);
Utils::map_chars_to_cers(\$C_TITLE, [q{"}, q{'}]);




my $C = new Context;

my $cgi = new CGI;
$C->set_object('CGI', $cgi);

my $debug = $cgi->param('debug') || 0;
my $debugging = ( ($ENV{DEBUG_LOCAL} ? $ENV{DEBUG_LOCAL} : 0) || ($debug =~ m,local,));
my $uber_conf = ($debugging
                 ? $ENV{SDRROOT} . "/mdp-lib/Config/uber.conf"
                 : $LOCATION . "/../../mb/vendor/common-lib/lib/Config/uber.conf");

my $config = new MdpConfig(
                           $uber_conf,
                           $LOCATION . "/../../mb/lib/Config/global.conf",
                           $LOCATION . "/../../mb/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);

my $db = new Database('ht_maintenance');
my $DBH = $db->get_DBH();
$C->set_object('Database', $db);

# Support DEBUG calls
Debug::DUtils::setup_debug_environment();

my $CO = new Collection($DBH, $config, $C_OWNER);
$C->set_object('Collection', $CO);

my $CS = CollectionSet->new($DBH, $config, $C_OWNER) ;
$C->set_object('CollectionSet', $CS);

if ($APPEND || $CREATE || $DELETE) {
    open(INPUTFILE, $INPUT_FILE) || die "Could not open $INPUT_FILE: $@\n";
}

my $INITIAL_COLLECTION_SIZE = 0;
my $small_collection_max_items = $config->get('filter_query_max_item_ids');
my $SMALLEST_LARGE_COLLECTION = $small_collection_max_items + 1;
my $SMALL_TO_LARGE_TRANSITION = 0;


if ($EXPUNGE) {
    my $coll_id = $EXPUNGE;
    my $coll_name = $CO->get_coll_name($coll_id);

    if (! $CS->exists_coll_id($coll_id)) {
        Log_print( qq{ERROR: coll_id=$coll_id does not exist. Cannot expunge a non-existent collection\n} );
        exit 1;
    }

    Log_print( qq{Beginning to expunge "$coll_name" collection\n} );

    $INITIAL_COLLECTION_SIZE = $CO->count_all_items_for_coll($coll_id);

    # Delete items from the collection
    bc_handle_expunge($C, $coll_id);

    Log_print( qq{Done.\n} );
}
elsif ($DELETE) {
    my $coll_id = $DELETE;
    my $coll_name = $CO->get_coll_name($coll_id);

    if (! $CS->exists_coll_id($coll_id)) {
        Log_print( qq{ERROR: coll_id=$coll_id does not exist. Cannot delete ids from non-existent collection\n} );
        exit 1;
    }

    Log_print( qq{Begin deleting IDs from "$coll_name" collection\n} );

    $INITIAL_COLLECTION_SIZE = $CO->count_all_items_for_coll($coll_id);

    # Delete items from the collection
    bc_handle_delete_items_from($C, $coll_id);

    Log_print( qq{Done.\n} );
}
elsif ($APPEND) {
    my $existing_coll_id = $APPEND;
    my $coll_name = $CO->get_coll_name($existing_coll_id);

    if (! $CS->exists_coll_id($existing_coll_id)) {
        Log_print( qq{ERROR: coll_id=$existing_coll_id does not exist. Cannot append ids to non-existent collection\n} );
        exit 1;
    }
    else {
        $coll_name = $CO->get_coll_name($existing_coll_id);
        if ($NON_SUPERUSER) {
            if ($WHO_I_AM ne $C_OWNER) {
                Log_print( qq{ERROR: $WHO_I_AM is not the owner of $coll_name. You can append only to collections you own\n} );
                exit 1;
            }

            if (! $CS->exists_coll_name_for_owner($coll_name, $C_OWNER)) {
                Log_print( qq{ERROR: $C_OWNER is apparently not the owner of the collection named "$coll_name"\n} );
                exit 1;
            }
        }

        Log_print( qq{Begin appending IDs to "$coll_name" collection\n} );

        $INITIAL_COLLECTION_SIZE = $CO->count_all_items_for_coll($existing_coll_id);

        # Add items to the collection
        bc_handle_add_items_to($C, $existing_coll_id);

        Log_print( qq{Done.\n} );
    }
}
elsif ($USERID) {
    my $userid = $CO->get_coll_owner($USERID);
    my $name = $CO->get_coll_owner_display_name($USERID);
    my $coll_name = $CO->get_coll_name($USERID);
    if ($userid) {
        Log_print( qq{\nCollection id = $USERID\n\tUser name = $name\n\tUserid = $userid\n\tTitle = $coll_name\n} );
    }
    else {
        Log_print( qq{\nERROR: could not find data for collection id = $USERID\n} );
    }
}
elsif ($COLL_ID) {
    my $coll_id = $CO->get_coll_id_for_collname_and_user($C_TITLE, $C_OWNER_NAME);
    if ($coll_id) {
        Log_print( qq{\nCollection id = $coll_id for collection="$C_TITLE" and owner="$C_OWNER_NAME"\n} );
    }
    else {
        Log_print( qq{\nERROR: could not determine Collection id for collection="$C_TITLE" and owner="$C_OWNER_NAME"\n} );
    }
}
else {
    Log_print( qq{Begin "$C_TITLE" collection creation\n} );

    # Create the (empty) collection
    my $new_coll_id = bc_create_collection();

    # Add items to the collection
    bc_handle_add_items_to($C, $new_coll_id);

    Log_print( qq{Done. coll_id for "$C_TITLE" collection is: $new_coll_id\n} );
}

close(INPUTFILE);

exit 0;

# ---------------------------------------------------------------------

=item Log_print(

Description

=cut

# ---------------------------------------------------------------------
sub Log_print {
    my $s = shift;

    print qq{$s};

    if (open(LOG, ">>$LOGFILE")) {
        my $logtime = Utils::Time::iso_Time('time');
        print LOG qq{$logtime: $s};
        close(LOG);
        chmod(0666, $LOGFILE) if (-o $LOGFILE);
    }
}

# ---------------------------------------------------------------------

=item bc_get_metadata_via_metadata_getter

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_metadata_via_metadata_getter {
    my $C = shift;
    my $id_aryref = shift;

    my $mdg = new MBooks::MetaDataGetter($C,$id_aryref);
    my $metadata_aryref = $mdg->metadata_getter_get_metadata($C, $id_aryref);

    my $normed_metadata_aryref = [];

    if ($metadata_aryref) {
        foreach my $metadata_hashref (@$metadata_aryref) {
            my $metadata_ref = $mdg->normalize_metadata($metadata_hashref);
            push(@$normed_metadata_aryref, $metadata_ref);
        }
    }

    return scalar @$normed_metadata_aryref ? $normed_metadata_aryref : undef;
}

# ---------------------------------------------------------------------

=item bc_handle_delete_items_from

Description

=cut

# ---------------------------------------------------------------------
sub bc_handle_delete_items_from {
    my $C = shift;
    my $coll_id = shift;

    my $num_ids = 0;
    my $deleted = 0;
    my $queued = 0;

    foreach my $id (<INPUTFILE>) {
        chomp($id);
        $id =~ s,\s,,g;

        # comment or blank line
        if ((! $id) || ($id =~ m,^\s*#,)) {
            next;
        }
        $num_ids++;

        Log_print( qq{Deleting item $num_ids "$id"\n} );

        my ($ok, $item_deleted) = bc_delete_item($id, $coll_id);
        if (! $ok) {
            Log_print( qq{ERROR: Failed to delete "$id" from collection\n} );
            exit 1;
        }
        else {
            $deleted += $item_deleted;
            if ($item_deleted) {
                my ($ok, $num_enqueued) = bc_do_del_enqueue($C, $coll_id, $id);
                if (! $ok) {
                    Log_print( qq{ERROR: Failed to enqueue "$id" for indexing\n} );
                    exit 1;
                }
                else {
                    $queued += $num_enqueued;
                }
            }
        }
    }

    Log_print( qq{Processed $num_ids items from $INPUT_FILE, deleted $deleted, enqueued $queued for indexing\n} );
}


# ---------------------------------------------------------------------

=item bc_handle_expunge

Description

=cut

# ---------------------------------------------------------------------
sub bc_handle_expunge {
    my $C = shift;
    my $coll_id = shift;

    my $coll_num_items = $INITIAL_COLLECTION_SIZE;
    my $coll_name = $CO->get_coll_name($coll_id);

    Log_print( qq{Expunging $coll_name ($coll_id) containing $coll_num_items items\n} );

    my $ok = 1;
    my $small_collection_max_items = $CO->get_config()->get('filter_query_max_item_ids');

    if ($coll_num_items > $small_collection_max_items) {
        # coll is "large"
        my $dbh = $CO->get_dbh();
        $ok = SharedQueue::enqueue_all_ids($C, $dbh, $coll_id);
        if ($ok) {
            Log_print( qq{Enqueued $coll_num_items from $coll_name for re-indexing\n} );
        }
        else {
            Log_print( qq{ERROR: Failed to enqueue all ids from collection for re-indexing\n} );
            exit 1;
        }
    }

    eval {
        $CO->delete_coll($coll_id, $SUPERUSER);
    };
    if ($@) {
        Log_print( qq{ERROR: Delete collection database operation failed\n} );
        exit 1;
    }

    Log_print( qq{Deleted $coll_num_items items from $coll_name and deleted collection record\n} );
}

# ---------------------------------------------------------------------

=item bc_handle_add_items_to

Description

=cut

# ---------------------------------------------------------------------
sub bc_handle_add_items_to {
    my $C = shift;
    my $coll_id = shift;

    my $num_ids = 0;
    my $added = 0;
    my $queued = 0;

    foreach my $id (<INPUTFILE>) {
        chomp($id);
        $id =~ s,\s,,g;

        # comment or blank line
        if ((! $id) || ($id =~ m,^\s*#,)) {
            next;
        }
        $num_ids++;

        # Check existence in repository
        my $file_sys_location = Identifier::get_item_location($id);
        if (! -e $file_sys_location) {
            Log_print( qq{id="$id" is not in the repository, SKIPPING\n} );
            next;
        }

        my $metadata_ref = bc_get_metadata_via_metadata_getter($C, [$id]);
        my $metadata_failed = $metadata_ref ? 0 : 1;

        if ($metadata_failed) {
            Log_print( qq{Could not read metadata for "$id", SKIPPING\n} );
            next;
        }

        Log_print( qq{Adding item $num_ids "$id"\n} );

        my $metadata_hashref = $metadata_ref->[0];

        my ($ok, $item_added) = bc_add_item($id, $coll_id, $metadata_hashref);
        if (! $ok) {
            Log_print( qq{ERROR: Failed to add "$id" to collection\n} );
            exit 1;
        }
        else {
            $added += $item_added;
            if ($item_added) {
                # only enqueue new items, not ones that are just
                # metadata updates. Also handle large vs. small
                # collection logic
                my ($ok, $num_enqueued) = bc_do_enqueue($C, $coll_id, $id);
                if (! $ok) {
                    Log_print( qq{ERROR: Failed to enqueue "$id" for indexing\n} );
                    exit 1;
                }
                else {
                    $queued += $num_enqueued;
                }
            }
        }
    }

    my $using = 'using VuFind for metadata';

    Log_print( qq{Processed $num_ids items from $INPUT_FILE $using, added $added, enqueued $queued for indexing\n} );
    if ($added) {
        my $not_queued = max($added - $queued, 0);
        # If collection started out large, $added items should have
        # been queued. If collection became large, more items would be
        # queued than were added.
        if (
            ($INITIAL_COLLECTION_SIZE >= $SMALLEST_LARGE_COLLECTION)
            ||
            $SMALL_TO_LARGE_TRANSITION
           ) {
            if ($not_queued) {
                Log_print( qq{WARN: $not_queued added items could not be queued for indexing\n} );
            }
            else {
                $SMALL_TO_LARGE_TRANSITION
                  ? Log_print( qq{All added items + existing small collection items were queued for indexing\n} )
                    : Log_print( qq{All added items were queued for indexing\n} );
            }
        }
    }
}

# ---------------------------------------------------------------------

=item bc_create_collection

Description

=cut

# ---------------------------------------------------------------------
sub bc_create_collection {

    if ($WHO_I_AM ne $C_OWNER) {
        Log_print( qq{ERROR: $WHO_I_AM does not match -o argument value: $C_OWNER\n} );
        exit 1;
    }

    if ($CS->exists_coll_name_for_owner($C_TITLE, $C_OWNER)) {
        Log_print( qq{ERROR: You already have a collection named "$C_TITLE"\n} );
        exit 1;
    }

    my $coll_data_hashref = {
                             'collname'    => $C_TITLE,
                             'description' => $C_DESC,
                             'shared'      => 0,
                             'owner'       => $C_OWNER,
                             'owner_name'  => $C_OWNER_NAME,
                            };

    my $new_coll_id;
    eval {
        $new_coll_id = $CS->add_coll($coll_data_hashref);
    };
    if ($@) {
        Log_print( qq{ERROR: Could not create collection "$C_TITLE": $@\n} );
        exit 1;
    }

    return $new_coll_id;
}

# ---------------------------------------------------------------------

=item bc_delete_item

Description ($ok, $deleted) = bc_delete_item()

=cut

# ---------------------------------------------------------------------
sub bc_delete_item {
    my $id = shift;
    my $coll_id = shift;

    if (! $CO->item_in_collection($id, $coll_id)) {
        Log_print( qq{Item id="$id" is not in the collection. Skipped.\n} );
        return (1, 0);
    }

    eval {
        $CO->delete_items($coll_id, [$id], $SUPERUSER);
    };
    if ($@) {
        Log_print( qq{Could not put item="$id" into collection: $@} );
        return (0, 0);
    }

    return (1, 1);
}

# ---------------------------------------------------------------------

=item bc_add_item

Description ($ok, $added) = bc_add_item()

=cut

# ---------------------------------------------------------------------
sub bc_add_item {
    my $id = shift;
    my $coll_id = shift;
    my $metadata_hashref = shift;

    eval {
        $CO->create_or_update_item_metadata($metadata_hashref);
    };
    if ($@) {
        Log_print( qq{Could not create of update item="$id" to collection: $@} );
        return (0, 0);
    }

    if ($CO->item_in_collection($id, $coll_id)) {
        Log_print( qq{Item id="$id" is already in the collection. Just updated metadata\n} );
        return (1, 0);
    }

    eval {
        $CO->copy_items($coll_id, [$id], $SUPERUSER);
    };
    if ($@) {
        Log_print( qq{Could not put item="$id" into collection: $@} );
        return (0, 0);
    }

    return (1, 1);
}


# ---------------------------------------------------------------------

=item bc_do_del_enqueue

Description

=cut

# ---------------------------------------------------------------------
sub bc_do_del_enqueue {
    my $C = shift;
    my $coll_id = shift;
    my $item_id = shift;

    if ($INITIAL_COLLECTION_SIZE < $SMALLEST_LARGE_COLLECTION) {
        # Nothing to do. Deletion will only make it smaller and this
        # coll_id could not be in any Solr doc needing re-indexing.
        return (1, 0);
    }

    # We are deleting from a large collection. Always enqueue.
    my $ok = SharedQueue::enqueue_item_ids($C, $DBH, [$item_id]);
    my $num_queued = ($ok ? 1 : 0);

    # Did deleting this item made the collection small?
    if ($ok) {
        my $curr_coll_size = $CO->count_all_items_for_coll($coll_id);
        if ($curr_coll_size == $SMALLEST_LARGE_COLLECTION - 1) {
            $SMALL_TO_LARGE_TRANSITION = $curr_coll_size;
            Log_print( qq{SMALL COLLECTION TRANSITION POINT ($curr_coll_size) REACHED at "$item_id"\n} );
        }
    }

    return ($ok, $num_queued);
}


# ---------------------------------------------------------------------

=item bc_do_enqueue

Description

=cut

# ---------------------------------------------------------------------
sub bc_do_enqueue {
    my $C = shift;
    my $coll_id = shift;
    my $item_id = shift;

    my $ok = 1;
    my $num_queued = 0;

    if ($INITIAL_COLLECTION_SIZE >= $SMALLEST_LARGE_COLLECTION) {
        # All items less than max have been handled in previous runs.
        # Just queue this one item.
        $ok = SharedQueue::enqueue_item_ids($C, $DBH, [$item_id]);
        $num_queued = 1;
    }
    else {
        # Handle the transition from small to large collection
        my $curr_coll_size = $CO->count_all_items_for_coll($coll_id);
        if ($curr_coll_size == $SMALLEST_LARGE_COLLECTION) {
            # Adding this item made the collection large.  Queue ALL
            # items already added (but that were not queued because
            # the collection was small when they were added)
            $ok = SharedQueue::enqueue_all_ids($C, $DBH, $coll_id);

            $num_queued = $curr_coll_size;
            $SMALL_TO_LARGE_TRANSITION = $curr_coll_size;

            Log_print( qq{LARGE COLLECTION TRANSITION POINT ($curr_coll_size) REACHED at "$item_id"\n} );
        }
        elsif ($curr_coll_size < $SMALLEST_LARGE_COLLECTION) {
            # Adding this item will NOT make collection large.  Nothing to queue.
            $num_queued = 0;
        }
        else { # $curr_coll_size > $SMALLEST_LARGE_COLLECTION)
            # Collection surpassed the small collection max items
            # somewhere earlier in this run so catch-up enqueuing has
            # already occured.  Just queue this one item.

            $ok = SharedQueue::enqueue_item_ids($C, $DBH, [$item_id]);
            $num_queued = 1;
        }
    }

    return ($ok, $num_queued);
}




=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-14 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut

###   ;;; Local Variables: ***
###   ;;; mode:cperl ***
###   ;;; end: ***

