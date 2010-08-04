#!/l/local/bin/perl

use strict;

=head1 NAME

batch-collection

=head1 USAGE

% batch-collection [-P][-i] -t title -d description -o userid file

=head1 DESCRIPTION

Create an MBooks collection prior to fulltext indexing (carried out by manage-index)

=head1 OPTIONS

=over 8

=item -P

make the collection Public.  Default is private

=item -t

collection title  (can be edited later in Collection Builder)

=item -d

collection description (can be edited later in Collection Builder)

=item -o

uniqname that will own the collection

=item -i

id list is internal. default is external (mdp) ids

=back

=cut

# ----------------------------------------------------------------------
# Set up paths for local libraries -- must come first
# ----------------------------------------------------------------------
use lib "$ENV{SDRROOT}/mdp-lib/Utils";
use Vendors;

use Getopt::Std;
use CGI;

use Context;
use Identifier;
use MdpConfig;
use Collection;
use AccessRights;
use MirlynGlobals;
use Debug::DUtils; 

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


our ($opt_P, $opt_t, $opt_d, $opt_o, $opt_i, $opt_f);
getopts( 'iPt:d:o:f:');

if ((! $opt_t) || (! $opt_d) || (! $opt_o) || (! $opt_f))
{
    print qq{Usage: batch-collection [-P][-i] -t title -d description -o userid -f file_of_mdp_ids\n};
    print qq{-i ids are internal. default is external (mdp) id\n};
    print qq{-P make collection public.  default is private\n};
    print qq{-o userid (must match your kerberos uniqname)\n};
    exit 1;
}

# $ENV{'DEBUG'} = 'doc';

open(INPUTFILE, "$opt_f") || die $@;

my ($c_name, $c_desc, $c_owner, $c_owner_name, $c_public) =
    (
     $opt_t,
     $opt_d,
     get_owner($opt_o),
     get_owner($opt_o),
     $opt_P,
    );


my $C = new Context;

my $config = new MdpConfig(
                           Utils::get_uber_config_path('mdp-misc')
                          );
$C->set_object('MdpConfig', $config);

my $cgi = new CGI;
$C->set_object('CGI', $cgi);

my $db = new Database($config);
$C->set_object('Database', $db);

my $co = new Collection($db->get_DBH(), $config, $c_owner);
$C->set_object('Collection', $co);

my $cs = CollectionSet->new($db->get_DBH(), $config, $c_owner) ;
$C->set_object('CollectionSet', $cs);

my $dsn = $db->get_dsn();
print qq{Begin "$opt_t" collection creation using db connection $dsn\n};

if ($cs->exists_coll_name_for_owner($c_name, $c_owner))
{
    print qq{You already have a collection named "$c_name"\n};
    exit 1;
}

#
# Create the (empty) collection
#
my $collid = add_collection();
# POSSIBLY NOTREACHED

#
# Add items to the collection
#
my $ct = 0;
foreach my $id (<INPUTFILE>)
{
    chomp($id);
    $id =~ s,\s,,g;

    my $use_id;
    if ($opt_i)
    {
        $use_id = $co->get_extern_id_from_item_id($id);
        if (! $use_id)
        {
            print qq{Could not map internal id="$id" to external MDP id ... skipping\n};
            next;
        }
    }
    else
    {
        $use_id = $id;
    }

    # Check existence in repository
    my $exists = `curl 'http://services.hathitrust.org/api/htd/meta/$use_id' 2>/dev/null`;
    if (! $exists) {
        print qq{id="$use_id" is not in the repository ... skipping\n};
        next;
    }
    
    $cgi->param('id', $use_id);

    if (! Identifier::validate_mbooks_id($use_id))
    {
        print qq{invalid MDP id="$use_id" ... skipping\n};
        next;
    }

    my ($metadata_ref, $metadata_failed) =
        GetMetadata_Mirlyn($C, $use_id);

    if ($metadata_failed)
    {
        print qq{Could not read Mirlyn metadata for "$use_id" ... skipping\n};
        next;
    }

    print qq{Adding item $ct "$use_id" ...\n};

    my $ar = new AccessRights($C, $use_id);
    my $rights = $ar->get_rights_attribute($C, $use_id);

    my $item_id;
    if ($item_id = add_item($use_id, $collid, $rights, $metadata_ref))
    {
       $ct++;
       add_item_to_queue($item_id);
       print qq{\tQueuing item $ct "$use_id" for indexing ...\n};
    }
}

print qq{Done. Added $ct items\n};

exit 0;


# ---------------------------------------------------------------------

=item GetMetadata_Mirlyn

Description

=cut

# ---------------------------------------------------------------------
sub GetMetadata_Mirlyn {
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

=item add_collection

Description

=cut

# ---------------------------------------------------------------------
sub add_collection
{
    my $coll_data_hashref = {
                             'collname'    => $c_name,
                             'description' => $c_desc,
                             'shared'      => $c_public ? 1 : 0,
                             'owner'       => $c_owner,
                             'owner_name'  => $c_owner_name,
                            };

    my $added_coll_id;
    eval
    {
        $added_coll_id = $cs->add_coll($coll_data_hashref);
    };
    if ($@)
    {
        print qq{Could not create collection "$c_name": $@\n};
        exit 1;
    }

    return $added_coll_id;
}

# ---------------------------------------------------------------------

=item get_fields_from_mdp_metadata

Description

=cut

# ---------------------------------------------------------------------
sub get_fields_from_mdp_metadata
{
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

    # <varfield id="MDP" i1=" " i2=" ">
    #   <subfield label="u">mdp.39015009999635</subfield>
    #   <subfield label="z">v.5-6 1961-1963</subfield>
    # </varfield>
    my ($vol_string) = ($$metadata_ref =~ m,<varfield id="MDP"[^>]*>\s*<subfield label="u">$id</subfield>\s*<subfield label="z">(.*?)</subfield>\s*</varfield>,g );
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

=item get_fields_from_miun_metadata

Description

=cut

# ---------------------------------------------------------------------
sub get_fields_from_miun_metadata
{
    my $metadata_ref = shift;



}


# ---------------------------------------------------------------------

=item get_sort_title

MARC 245 indicator 2 indicates how many positions to skip

=cut

# ---------------------------------------------------------------------
sub get_sort_title
{
    my ($display_title, $i2) = @_;

    # Remap XML charents so I2 makes sense
    Utils::remap_cers_to_chars(\$display_title);
    my $sort_title = substr($display_title, $i2);
    Utils::map_chars_to_cers(\$sort_title);

    return $sort_title;
}


# ---------------------------------------------------------------------

=item add_item

Description

=cut

# ---------------------------------------------------------------------
sub add_item
{
    my $id = shift;
    my $collid = shift;
    my $rights = shift;
    my $metadata_ref = shift;

    my ($m_title, $m_author, $m_date, $m_i2) =
        get_fields_from_mdp_metadata($id, $metadata_ref);

    # Make XML compliant
    Utils::map_chars_to_cers(\$m_title, [q{"}, q{'}]);
    Utils::map_chars_to_cers(\$m_author, [q{"}, q{'}]);

    my $metadata_hashref;
    $$metadata_hashref{'extern_item_id'} = $id;

    $$metadata_hashref{'sort_title'} = get_sort_title($m_title, $m_i2);
    $$metadata_hashref{'display_title'} = $m_title;
    $$metadata_hashref{'author'} = $m_author;
    $$metadata_hashref{'date'} = normalize_date($m_date);
    $$metadata_hashref{'rights'} = $rights;

    my $item_id;
    eval
    {
        $item_id = $co->create_or_update_item_metadata($metadata_hashref);
    };
    if ($@)
    {
        print qq{Could not create of update item="$id" to collection: $@};
        return 0;
    }

    if (! $cs->exists_coll_id($collid))
    {
        print qq{to_coll_id="$collid" does not exist\n};
        return 0;
    }

    if (! $co->item_exists($item_id))
    {
        print qq{Invalid id="$item_id"};
        return 0;
    }

    if ($co->item_in_collection($item_id, $collid))
    {
        print qq{Item id="$item_id" is already in the collection};
        return 0;
    }

    eval
    {
        $co->copy_items($collid, [$item_id]);
    };
    if  ($@)
    {
        print qq{Could not put item="$id" into collection: $@};
        return 0;
    }

    return $item_id;
}

# ---------------------------------------------------------------------

=item add_item_to_queue

Description

=cut

# ---------------------------------------------------------------------
sub add_item_to_queue
{
    my $item_id = shift;

    # Add to queue for indexing
    eval
    {
        my $priority = 1;
        $co->add_to_queue([$item_id], $priority);
    };
    if  ($@)
    {
        print qq{Could not add item="$item_id" to indexing queue: $@};
    }
}

# ---------------------------------------------------------------------

=item normalize_date

Description

=cut

# ---------------------------------------------------------------------
sub normalize_date
{
    my $date = shift;

    if ($date =~ m,(1\d{3}|20\d{2}),)
    {
        $date = $1;
        # mysql needs month and day so put in fake
        $date .= '-00-00';
    }
    else
    {
        $date = '0000-00-00';
    }

    return $date;
}



# ---------------------------------------------------------------------

=item get_owner

Description

=cut

# ---------------------------------------------------------------------
sub get_owner
{
    my $candidate = shift;

    if (! grep(/^$candidate$/, @allowed_uniqnames))
    {
        print qq{$candidate is not in the list of supported uniqnames\n};
        exit 1;
    }

    return $candidate;
}



exit 0;

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

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

