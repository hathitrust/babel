#!/l/local/bin/perl

use strict;
use warnings;

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
  );

sub bc_Usage {
    print qq{Usage: batch-collection -t 'quoted title' -d 'quoted description text' -o userid -f <filename>\n};
    print qq{         or\n};
    print qq{       batch-collection -a coll_id -o userid -f <filename>\n};
    print qq{         or\n};
    print qq{       batch-collection -c -t title -o userid\n\n};
    print qq{Options:\n};
    print qq{  -f file of HathiTrust IDs, one per line\n};
    print qq{  -o userid (must match your kerberos uniqname)\n};
    print qq{  -a coll_id append IDs to collid (obtain coll_id from batch_collection.pl -c option)\n};
    print qq{  -c returns the coll_id for collection with title and owner\n\n};
    print qq{Notes:\n};
    print qq{       IDs are HathiTrust IDs, e.g. mdp.39015012345\n};
    print qq{       Blank lines or lines beginning with a '#' are ignored\n\n};

}

if ($ENV{SDRVIEW} ne 'full') {
    Log_print( qq{ERROR: batch-collection.pl only functions in the full HTDE environment\n} );
    exit 1;
}

our ($opt_t, $opt_d, $opt_o, $opt_f, $opt_a, $opt_c);
getopts('ct:d:o:f:a:');

my $APPEND = $opt_a;
my $COLL_ID = $opt_c;

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
}

my $USE_MIRLYN = 0;
my $INPUT_FILE = $opt_f;

my $date = Utils::Time::iso_Time('date');
my $time = Utils::Time::iso_Time('time');
my $LOGFILE = $INPUT_FILE . qq{-$date-$time.log};

my ($C_TITLE, $C_DESC, $C_OWNER, $C_OWNER_NAME, $C_COLL_ID);
if ($APPEND) {
    ($C_OWNER, $C_OWNER_NAME, $C_COLL_ID) =
      (
       bc_get_owner($opt_o),
       bc_get_owner($opt_o),
       $opt_a,
      );
}
else {
    ($C_TITLE, $C_DESC, $C_OWNER, $C_OWNER_NAME) =
      (
       $opt_t,
       $opt_d,
       bc_get_owner($opt_o),
       bc_get_owner($opt_o),
      );
}

Utils::map_chars_to_cers(\$C_DESC, [q{"}, q{'}]);
Utils::map_chars_to_cers(\$C_TITLE, [q{"}, q{'}]);

my $C = new Context;
my $config = new MdpConfig(
                           Utils::get_uber_config_path('mdp-misc'),
                           $ENV{SDRROOT} . "/mb/lib/Config/global.conf",
                           $ENV{SDRROOT} . "/mb/lib/Config/local.conf"
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

open(INPUTFILE, $INPUT_FILE) || die $@;

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
        if (! $CS->exists_coll_name_for_owner($coll_name, $C_OWNER)) {
            Log_print( qq{ERROR: You are apparently not the owner of the collection named "$coll_name"\n} );
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
    Log_print( qq{\nCollection id = $coll_id for collection="$C_TITLE" and owner="$C_OWNER_NAME"\n} );
}
else {
    Log_print( qq{Begin "$C_TITLE" collection creation using db connection $dsn\n} );

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
        print LOG qq{$time: $s};
        close(LOG);
        chmod(0666, $LOGFILE) if (-o $LOGFILE);
    }
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

        my ($metadata_ref, $metadata_failed);
        if ($USE_MIRLYN) {
            ($metadata_ref, $metadata_failed) = bc_get_metadata_mirlyn($C, $id);
        }
        else {
            ($metadata_ref, $metadata_failed) = bc_get_metadata_vufind($C, $id);
        }
        
        if ($metadata_failed) {
            Log_print( qq{Could not read metadata for "$id", SKIPPING\n} );
            next;
        }

        Log_print( qq{Adding item $ct "$id"\n} );

        my $rights = Access::Rights->new($C, $id)->get_rights_attribute($C, $id);

        my ($ok, $item_added) = bc_add_item($id, $coll_id, $rights, $metadata_ref);
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
    my $using = $USE_MIRLYN ? 'using bc2meta' : 'using vufind';
    
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

=item bc_get_metadata_mirlyn

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_metadata_mirlyn {
    my ($C, $id) = @_;

    my $metadata = undef;
    my $url = $MirlynGlobals::gMirlynMetadataURL;
    $url =~ s,__METADATA_ID__,$id,;

    my $response = Utils::get_user_agent()->get($url);
    my $responseOk = $response->is_success;
    my $responseStatus = $response->status_line;
    my $metadata_failed = 0;

    if ( $responseOk  ) {
        $metadata = $response->content;

        # Point to surrogate data if the metadata is empty or there
        # was an error
        if ((! $metadata ) || ($metadata =~ m,<error>.*?</error>,)) {
            $metadata_failed = 1;
        }
        $metadata = Encode::decode_utf8($metadata);
    }
    else {
        $metadata_failed = 1;
    }

    return (\$metadata, $metadata_failed);
}


# ---------------------------------------------------------------------

=item bc_get_metadata_vufind

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_metadata_vufind {
    my ($C, $id) = @_;

    my $url = $C->get_object('MdpConfig')->get('engine_for_vSolr') . qq{/select?fl=fullrecord&q=ht_id:$id};
    my $metadata = `curl --silent '$url'`;
    my $rc = $?;
    my $metadata_failed = ($rc > 0);
    
    if (! $metadata_failed) {
        $metadata = Encode::decode_utf8($metadata);
        $metadata =~ s,&lt;,<,g;
        $metadata =~ s,&gt;,>,g;
    }

    return (\$metadata, $metadata_failed);
}


# ---------------------------------------------------------------------

=item bc_create_collection

Description

=cut

# ---------------------------------------------------------------------
sub bc_create_collection {

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

=item bc_get_fields_from_mdp_metadata

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_fields_from_mdp_metadata_marc21 {
    my $id = shift;
    my $metadata_ref = shift;

    # I2
    my ($m_i2) = ($$metadata_ref =~ m,<datafield tag="245".*?ind2="(\d+)">,s);

    # Title
    my $m_title;
    my ($data_245) = ($$metadata_ref =~ m,<datafield tag="245"[^>]*>(.*?)</datafield>,is);
    my ($title_a) = ($data_245 =~ m,<subfield code="a">(.*?)</subfield>,is);
    $m_title .= $title_a;
    my ($title_b) = ($data_245 =~ m,<subfield code="b">(.*?)</subfield>,is);
    $m_title .= ' ' . $title_b if $title_b;
    my ($title_c) = ($data_245 =~ m,<subfield code="c">(.*?)</subfield>,is);
    $m_title .= ' ' . $title_c if $title_c;

    my (@MDP_Vols)  = ($$metadata_ref =~ m,<datafield tag="974"[^>]*>(.*?)</datafield>,gis);
    foreach my $vol (@MDP_Vols) {
        my ($mdp_id) = ($vol =~ m,<subfield code="u">(.*?)</subfield>,is);
        if ($mdp_id eq $id) {
            my ($vol_string) = ($vol =~ m,<subfield code="z">(.*?)</subfield>,is);
            $m_title .= ' ' . $vol_string if $vol_string;
            last;
        }
    }

    # Author
    my $m_author;
    my ($data_100) = ($$metadata_ref =~ m,<datafield tag="100"[^>]*>(.*?)</datafield>,is);
    my ($author_a) = ($data_100 =~ m,<subfield code="a">(.*?)</subfield>,is);
    $m_author .= $author_a;
    my ($author_b) = ($data_100 =~ m,<subfield code="b">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_b if $author_b;
    my ($author_c) = ($data_100 =~ m,<subfield code="c">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_c if $author_c;
    my ($author_e) = ($data_100 =~ m,<subfield code="e">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_e if $author_e;
    my ($author_q) = ($data_100 =~ m,<subfield code="q">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_q if $author_q;
    my ($author_d) = ($data_100 =~ m,<subfield code="d">(.*?)</subfield>,is);
    $m_author .= ' ' . $author_d if $author_d;

    my ($data_110) = ($$metadata_ref =~ m,<datafield tag="110"[^>]*>(.*?)</datafield>,is);
    my ($author_a1) = ($data_110 =~ m,<subfield code="a">(.*?)</subfield>,is);
    $m_author .= $author_a1;
    my ($author_b1) = ($data_110 =~ m,<subfield code="b">(.*?)</subfield>,is);
    if ($author_b1) {
        my ($author_c1) = ($data_110 =~ m,<subfield code="c">(.*?)</subfield>,is);
        $m_author .= ' ' . $author_c1;
    }

    my ($data_111) = ($$metadata_ref =~ m,<datafield tag="111"[^>]*>(.*?)</datafield>,is);
    my ($author_a11) = ($data_111 =~ m,<subfield code="a">(.*?)</subfield>,is);
    $m_author .= $author_a11 if $author_a11;

    # Date
    my $m_date;
    my ($fixed_008_data) = ($$metadata_ref =~ m,<controlfield tag="008">(.*?)</controlfield>,s);
    $m_date = substr($fixed_008_data, 7, 4);
    $m_date =~ s,[^0-9],0,g;

    return ($m_title, $m_author, $m_date, $m_i2);
}


# ---------------------------------------------------------------------

=item bc_get_sort_title

MARC 245 indicator 2 indicates how many positions to skip

=cut

# ---------------------------------------------------------------------
sub bc_get_sort_title {
    my ($display_title, $i2) = @_;

    # Remap XML charents so I2 makes sense
    Utils::remap_cers_to_chars(\$display_title);
    my $sort_title = substr($display_title, $i2);
    Utils::map_chars_to_cers(\$sort_title);

    return $sort_title;
}


# ---------------------------------------------------------------------

=item bc_add_item

Description ($ok, $added) = bc_add_item()

=cut

# ---------------------------------------------------------------------
sub bc_add_item {
    my $id = shift;
    my $coll_id = shift;
    my $rights = shift;
    my $metadata_ref = shift;

    my ($m_title, $m_author, $m_date, $m_i2);
    if ($USE_MIRLYN) {
        ($m_title, $m_author, $m_date, $m_i2) =
          bc_get_fields_from_mdp_metadata($id, $metadata_ref);
    }
    else {
        ($m_title, $m_author, $m_date, $m_i2) =
          bc_get_fields_from_mdp_metadata_marc21($id, $metadata_ref);
    }

    # Make XML compliant
    Utils::map_chars_to_cers(\$m_title, [q{"}, q{'}]);
    Utils::map_chars_to_cers(\$m_author, [q{"}, q{'}]);

    my $metadata_hashref;

    $$metadata_hashref{'extern_item_id'} = $id;
    $$metadata_hashref{'sort_title'} = bc_get_sort_title($m_title, $m_i2);
    $$metadata_hashref{'display_title'} = $m_title;
    $$metadata_hashref{'author'} = $m_author;
    $$metadata_hashref{'date'} = bc_normalize_date($m_date);
    $$metadata_hashref{'rights'} = $rights;

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

# ---------------------------------------------------------------------

=item bc_normalize_date

Description

=cut

# ---------------------------------------------------------------------
sub bc_normalize_date {
    my $date = shift;

    if ($date =~ m,(1\d{3}|20\d{2}),) {
        $date = $1;
        # mysql needs month and day so put in fake
        $date .= '-00-00';
    }
    else {
        $date = '0000-00-00';
    }

    return $date;
}

# ---------------------------------------------------------------------

=item bc_get_owner

Description

=cut

# ---------------------------------------------------------------------
sub bc_get_owner {
    my $candidate = shift;

    if (! grep(/^$candidate$/, @allowed_uniqnames)) {
        Log_print( qq{ERROR: $candidate is not in the list of supported uniqnames\n} );
        exit 1;
    }

    return $candidate;
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

