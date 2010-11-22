package Document::vSolrMetadataAPI::Schema_LS_4;

=head1 NAME

Document::vSolrMetadataAPI::Schema_LS_4

=head1 DESCRIPTION

This class creates an VuFind Solr type 4 schema document for indexing
using the VuFind API and the VuFind Solr schema for facets.
This is currently based on the ancient Schema_LS_4 and needs to be updated for the current VuFind

Maps the publishDate field to the stored date field for display

=head1 VERSION

$Id$

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;


# App
use Utils;
use Search::Constants;


# SLIP
use Db;
use base qw(Document::vSolrMetadataAPI);



# ------------------------  Field List  -------------------------------
#
# So far all are multi-valued (arr)  
#
my @g_FIELD_LIST = 
    (
     'id',
     'oclc',
     'ht_id_display',
     'author',
     'author2',
     'titleSort',
     'title',
     'series',
     'series2',
     'language',
     'format',
     'ht_availability',
     'htsource',
     'topicStr',
     'geographicStr',
     'fullgenre',
     'genre',
     'hlb3',
     'hlb3Str',
     'publishDate',
     'publishDateRange',
     'era',
     'countryOfPubStr',
    );


# ---------------------------------------------------------------------

=item get_field_list

Description

=cut

# ---------------------------------------------------------------------
sub get_field_list {
    return \@g_FIELD_LIST;
}

# ---------------------------------------------------------------------

=item PUBLIC: post_process_metadata

Description: Massage field values that come back from VuFind specific
to the schema in question for this subclass.

This mapping adheres to the LS Schema above.

=cut

# ---------------------------------------------------------------------
sub post_process_metadata {
    my $self = shift;
    my ($C, $item_id, $metadata_hashref) = @_;

    # map VuFind id to LS bib_id
    # PIFiller/ListSearchResults uses $record_no so we use that for now.  Is it worth changing here and in ls UI code?

    $metadata_hashref->{'record_no'}=    $metadata_hashref->{'id'};
    delete $metadata_hashref->{'id'};

    my @titles = @{$metadata_hashref->{'title'}};

    # Title is used as a proxy for metadata validity
    return unless (scalar(@titles) > 0);

    my @hathiTrust_str = grep(/^$item_id\|.*/, @{$metadata_hashref->{'ht_id_display'}});
    # 0      1            2          3  
    # htid | ingestDate | enumcron | rightsCodeForThisItem
    my @ht_id_display = split(/\|/, $hathiTrust_str[0]);
    my $volume_enumcron = $ht_id_display[2];
    if ($volume_enumcron) {
        $metadata_hashref->{'title'}[0] .= qq{, $volume_enumcron};
    }
    delete $metadata_hashref->{'ht_id_display'};
    
    # put publishDate into date field
    if (defined($metadata_hashref->{'publishDate'})) {
        $metadata_hashref->{'date'}[0] = $metadata_hashref->{'publishDate'}[0];
    }
    delete $metadata_hashref->{'publishDate'};
}

1;
`
