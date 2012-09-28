#!/l/local/bin/perl

use strict;
#use warnings;

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
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use Getopt::Std;
use CGI;

use File::Basename;
my $LOCATION = dirname(__FILE__);

use Utils;
use Utils::Time;
use Context;
use Identifier;
use MdpConfig;
use Collection;
use Access::Rights;
use MirlynGlobals;
use Debug::DUtils;
use SharedQueue;
use MBooks::MetaDataGetter;

# Support DEBUG calls
Debug::DUtils::setup_debug_environment();

my @allowed_uniqnames =
  (
   'suzchap',
   'tburtonw',
   'pfarber',
   'jweise',
   'sooty',
   'khage',
   'kshawkin',
   'rwelzenb',
   'sethip',
   'bkammin',
  );

my @allowed_overrides = 
  (
   'hathitrust@gmail.com',
  );

my @allowed_users = (@allowed_uniqnames, @allowed_overrides);

sub bc_Usage {
    print qq{Usage: batch-collection -t 'quoted title' -d 'quoted description text' -o userid -f <filename>\n};
    print qq{         or\n};
    print qq{       batch-collection -a coll_id -o userid -f <filename>\n};
    print qq{         or\n};
    print qq{       batch-collection -c -t title -o userid\n\n};
    print qq{Options:\n};
    print qq{  -f <filename> file of HathiTrust IDs, one per line\n};
    print qq{  -t '<title>' collection title as a quoted string\n};
    print qq{  -d '<description>' collection description as a quoted string\n};
    print qq{  -o <userid> (must match your kerberos uniqname)\n};
    print qq{  -a <coll_id> append IDs to collid. Obtain <coll_id> using batch_collection.pl -c option\n};
    print qq{  -c returns the coll_id for collection with -t '<title>' owned by -o <userid>\n\n};
    print qq{Notes:\n};
    print qq{       IDs are HathiTrust IDs, e.g. mdp.39015012345\n};
    print qq{       Blank lines or lines beginning with a '#' are ignored\n\n};

}

my $WHO_I_AM = $ENV{BATCH_COLLECTION_USER} || `whoami`;

chomp($WHO_I_AM);
if (! grep(/^$WHO_I_AM$/, @allowed_users)) {
    Log_print( qq{ERROR: $WHO_I_AM is not in the list of permitted users\n} );
    exit 1;
}

my $allowed = ($ENV{SDRVIEW} eq 'full') || (-e '/htapps/babel');
if (! $allowed) {
    Log_print( qq{ERROR: batch-collection.pl only functions in the full HTDE environment or production\n} );
    exit 1;
}

our ($opt_t, $opt_d, $opt_o, $opt_f, $opt_a, $opt_c);
getopts('ct:d:o:f:a:');

my $APPEND = $opt_a;
my $COLL_ID = $opt_c;
my $CREATE = 0;

if ($APPEND) {
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

my $INPUT_FILE = $opt_f;

my $date = Utils::Time::iso_Time('date');
my $time = Utils::Time::iso_Time('time');
my $LOGFILE = $INPUT_FILE . qq{-$date-$time.log};

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
my $config = new MdpConfig(
                           # circumvent debug=local for uber.conf
                           $LOCATION . "/../../mb/vendor/common-lib/lib/Config/uber.conf",
                           $LOCATION . "/../../mb/lib/Config/global.conf",
                           $LOCATION . "/../../mb/lib/Config/local.conf"
                          );
$C->set_object('MdpConfig', $config);

my $cgi = new CGI;
$C->set_object('CGI', $cgi);

my $DB = new Database($config);
$C->set_object('Database', $DB);
my $dsn = $DB->get_dsn();

my $CO = new Collection($DB->get_DBH(), $config, $C_OWNER);
$C->set_object('Collection', $CO);

my $CS = CollectionSet->new($DB->get_DBH(), $config, $C_OWNER) ;
$C->set_object('CollectionSet', $CS);

if ($APPEND || $CREATE) {
    open(INPUTFILE, $INPUT_FILE) || die $@;
}

my $INITIAL_COLLECTION_SIZE = 0;
my $small_collection_max_items = $config->get('filter_query_max_item_ids');
my $SMALLEST_LARGE_COLLECTION = $small_collection_max_items + 1;
my $SMALL_TO_LARGE_TRANSITION = 0;

if ($APPEND) {
    my $existing_coll_id = $APPEND;
    my $coll_name = 'undefined';

    if (! $CS->exists_coll_id($existing_coll_id)) {
        Log_print( qq{ERROR: coll_id=$existing_coll_id does not exist. Cannot append ids to non-existent collection\n} );
        exit 1;
    }
    else {
        $coll_name = $CO->get_coll_name($existing_coll_id);
        if ($WHO_I_AM ne $C_OWNER) {
            Log_print( qq{ERROR: $WHO_I_AM is not the owner of $coll_name. You can append only to collections you own\n} );
            exit 1;
        }

        if (! $CS->exists_coll_name_for_owner($coll_name, $C_OWNER)) {
            Log_print( qq{ERROR: $C_OWNER is apparently not the owner of the collection named "$coll_name"\n} );
            exit 1;
        }
    }

    Log_print( qq{Begin appending IDs to "$coll_name" collection using database: $dsn\n} );

    $INITIAL_COLLECTION_SIZE = $CO->count_all_items_for_coll($existing_coll_id);

    # Add items to the collection
    my $added = bc_handle_add_items_to($C, $existing_coll_id);

    Log_print( qq{Done.\n} );
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
    Log_print( qq{Begin "$C_TITLE" collection creation using database: $dsn\n} );

    # Create the (empty) collection
    my $new_coll_id = bc_create_collection();

    # Add items to the collection
    my $added = bc_handle_add_items_to($C, $new_coll_id);

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
    else {
        return undef;
    }
    

    return $normed_metadata_aryref;
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

    my $ct = 1;
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

        Log_print( qq{Adding item $ct "$id"\n} );

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

        $ct++;
    }

    $ct--;
    my $using = 'using vufind';

    Log_print( qq{Processed $ct of $num_ids items from $INPUT_FILE $using, added $added, enqueued $queued for indexing\n} );
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

=item bc_get_fields_from_mdp_metadata

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_fields_from_mdp_metadata {
    my $id = shift;
    my $metadata_ref = shift;

    # I2
    my ($m_i2) = ($$metadata_ref =~ m,<varfield id="245".*?i2="(\d+)">,s);

    # Title
    my $m_title;
    my ($data_245) = ($$metadata_ref =~ m,<varfield id="245"[^>]*>(.*?)</varfield>,is);
    my ($title_a) = ($data_245 =~ m,<subfield label="a">(.*?)</subfield>,is);
    $m_title .= $title_a;
    my ($title_b) = ($data_245 =~ m,<subfield label="b">(.*?)</subfield>,is);
    $m_title .= ' ' . $title_b if $title_b;
    my ($title_c) = ($data_245 =~ m,<subfield label="c">(.*?)</subfield>,is);
    $m_title .= ' ' . $title_c if $title_c;

    my ($MDP_Vol)  = ($$metadata_ref =~ m,<varfield id="MDP"[^>]*>(.*?)</varfield>,is);
    my ($vol_string) = ($MDP_Vol =~ m,<subfield label="z">(.*?)</subfield>,is);
    $m_title .= ' ' . $vol_string if $vol_string;

    # Author
    my $m_author;
    my ($data_100) = ($$metadata_ref =~ m,<varfield id="100"[^>]*>(.*?)</varfield>,is);
    my ($author_a) = ($data_100 =~ m,<subfield label="a">(.*?)</subfield>,is);
    $m_author .= $author_a;
    my ($author_b) = ($data_100 =~ m,<subfield label="b">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_b if $author_b;
    my ($author_c) = ($data_100 =~ m,<subfield label="c">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_c if $author_c;
    my ($author_e) = ($data_100 =~ m,<subfield label="e">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_e if $author_e;
    my ($author_q) = ($data_100 =~ m,<subfield label="q">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_q if $author_q;
    my ($author_d) = ($data_100 =~ m,<subfield label="d">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_d if $author_d;

    my ($data_110) = ($$metadata_ref =~ m,<varfield id="110"[^>]*>(.*?)</varfield>,is);
    my ($author_a1) = ($data_110 =~ m,<subfield label="a">(.*?)</subfield>,is);
    $m_author .= $author_a1;
    my ($author_b1) = ($data_110 =~ m,<subfield label="b">(.*?)</subfield>,is);
    if ($author_b1)
    {
        my ($author_c1) = ($data_110 =~ m,<subfield label="c">(.*?)</subfield>,is);
        $m_author .= ' ' . $author_c1;
    }

    my ($data_111) = ($$metadata_ref =~ m,<varfield id="111"[^>]*>(.*?)</varfield>,is);
    my ($author_a11) = ($data_111 =~ m,<subfield label="a">(.*?)</subfield>,is);
    $m_author .= $author_a11 if $author_a11;

    # Date
    my $m_date;
    my ($fixed_008_data) = ($$metadata_ref =~ m,<fixfield id="008">(.*?)</fixfield>,s);
    $m_date = substr($fixed_008_data, 7, 4);
    $m_date =~ s,[^0-9],0,g;

    return ($m_title, $m_author, $m_date, $m_i2);
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
        $CO->copy_items($coll_id, [$id]);
    };
    if ($@) {
        Log_print( qq{Could not put item="$id" into collection: $@} );
        return (0, 0);
    }

    return (1, 1);
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
    my $dbh = $DB->get_DBH();

    if ($INITIAL_COLLECTION_SIZE >= $SMALLEST_LARGE_COLLECTION) {
        # All items less than max have been handled in previous runs.
        # Just queue this one item.
        $ok = SharedQueue::enqueue_item_ids($C, $dbh, [$item_id]);
        $num_queued = 1;
    }
    else {
        # Handle the transition from small to large collection
        my $curr_coll_size = $CO->count_all_items_for_coll($coll_id);
        if ($curr_coll_size == $SMALLEST_LARGE_COLLECTION) {
            # Adding this item made the collection large.  Queue ALL
            # items already added (but that were not queued because
            # the collection was small when they were added)
            $ok = SharedQueue::enqueue_all_ids($C, $dbh, $coll_id);

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

            $ok = SharedQueue::enqueue_item_ids($C, $dbh, [$item_id]);
            $num_queued = 1;
        }
    }

    return ($ok, $num_queued);
}




=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-11 ©, The Regents of The University of Michigan, All Rights Reserved

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

