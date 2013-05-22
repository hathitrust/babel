package MBooks::MetaDataGetter;

=head1 NAME

MBooks::MetaDataGetter

=head1 DESCRIPTION

This class takes a list of HathiTrust IDs and returns an array of
hashrefs containing the metadata for those ids from VuFindSolr.  The
metadata desired and the mapping from VuFindSolr field names to
Collection Building Fieldnames.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use Context;
use Utils;
use RightsGlobals;
use Access::Rights;

use MBooks::Searcher::VuFindSolr;
use MBooks::Query::VuFindSolr;
use MBooks::Result::VuFindSolr;

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize



=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $C = shift;
    my $id_aryref = shift;  # array ref of external ids, i.e. valid mdp/HathiTrust ids

    $self->set_id_aryref($id_aryref);
}

# ---------------------------------------------------------------------
sub set_id_aryref {
    my $self = shift;
    my $aryref = shift;
    $self->{'id_aryref'} = $aryref;
}
# ---------------------------------------------------------------------
sub get_id_aryref {
    my $self = shift;
    return $self->{'id_aryref'};
}


# ---------------------------------------------------------------------

=item metadata_getter_get_metadata

Description

=cut

# ---------------------------------------------------------------------
sub metadata_getter_get_metadata {
    my $self = shift;
    my $C = shift;

    my $metadata_aryref = $self->get_vufind_metadata($C);
    if ($metadata_aryref) {
        $self->add_rights_data($C, $metadata_aryref);
    }

    return $metadata_aryref;
}

# ---------------------------------------------------------------------

=item add_rights_data

Description

=cut

# ---------------------------------------------------------------------
sub add_rights_data {
    my $self = shift;
    my $C = shift;
    my $ary_of_hashrefs = shift;

    foreach my $meta_hashref (@$ary_of_hashrefs) {
        my $id = $meta_hashref->{'extern_item_id'};

        my $ar = new Access::Rights($C, $id);
        my $rights = $ar->get_rights_attribute($C, $id);
        ASSERT($rights != $RightsGlobals::NOOP_ATTRIBUTE, qq{bad rights data for id="$id"});
        $meta_hashref->{'rights'} = $rights;
    }
}

# ---------------------------------------------------------------------

=item get_vufind_metadata

Description

=cut

# ---------------------------------------------------------------------
sub get_vufind_metadata {
    my $self = shift;
    my $C = shift;

    my $metadata_aryref = [];
    my $id_ary_ref = $self->get_id_aryref();

    my $searcher = $self->create_VuFind_Solr_Searcher_by_alias($C);
    my $rs = new MBooks::Result::VuFindSolr($C, $id_ary_ref);
    my $q = new MBooks::Query::VuFindSolr($C, "dummyquery");
    my $query = $q->get_Solr_metadata_query_from_ids($id_ary_ref);
    $rs = $searcher->get_Solr_raw_internal_query_result($C, $query, $rs);

    # XXX do something that eventually sets $db_success=0 in caller
    if (! $rs->http_status_ok()) {
        return undef;
    }

    $metadata_aryref = $rs->get_complete_result();

    return $metadata_aryref;
}

# ---------------------------------------------------------------------

=item create_VuFind_Solr_Searcher_by_alias

Description

=cut

# ---------------------------------------------------------------------
sub create_VuFind_Solr_Searcher_by_alias {
    my $self = shift;
    my $C = shift;

    my $config = $C->get_object('MdpConfig');
    my $engine_uri = $config->get('engine_for_vSolr');

    my $searcher = new MBooks::Searcher::VuFindSolr($engine_uri);

    return $searcher;
}


# ---------------------------------------------------------------------

=item normalize_metadata

Description

=cut

# ---------------------------------------------------------------------
sub normalize_metadata {
    my $self = shift;
    my $metadata_hashref = shift;

    my $metadata_clean_ref = {};

    foreach my $key (keys %{$metadata_hashref}) {
        my $value = $self->maybe_concat_array($$metadata_hashref{$key});
        $$metadata_clean_ref{$key} = $value;
    }

    my $date = $$metadata_clean_ref{'date'};
    $$metadata_clean_ref{'date'} = $self->normalize_date($date);

    if (! defined($$metadata_clean_ref{'author'})) {
        $$metadata_clean_ref{'author'} = '';
    }

    return $metadata_clean_ref;
}


# ---------------------------------------------------------------------

=item maybe_concat_array

Description

=cut

# ---------------------------------------------------------------------
sub maybe_concat_array {
    my $self = shift;
    my $couldBeArrayRef = shift;

    my $ref_type = ref($couldBeArrayRef);
    my $concatenated;

    if ($ref_type eq "ARRAY") {
        $concatenated = join (" ", @{$couldBeArrayRef});
        return $concatenated;
    }
    else {
        return $couldBeArrayRef;
    }
}

# ---------------------------------------------------------------------

=item normalize_date

Description

=cut

# ---------------------------------------------------------------------
sub normalize_date {
    my $self = shift;
    my $date = shift;

    # XXX what kind of error to throw if can't figure out how to
    # normalize date.  Consider logging somewhere and inserting fake
    # date such as 3000 chk mysql for possible fake date value try
    # 0000
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

1;
