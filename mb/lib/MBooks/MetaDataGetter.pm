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
use Identifier;
use Utils;
use RightsGlobals;

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

    my $metadata_aryref = [];
    my $vufind_aryref = $self->get_vufind_metadata($C);
    $metadata_aryref = $self->add_rights_data($C, $vufind_aryref);
    $metadata_aryref = $vufind_aryref;

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

        my ($rights, $rc) = $self->__get_rights_attribute_for_id($C, $id);
        ASSERT($rc == RightsGlobals::OK_ID, qq{bad rights data $rc });
        $meta_hashref->{'rights'} = $rights;
    }

    return $ary_of_hashrefs;
}

# ---------------------------------------------------------------------

=item PRIVATE: __get_rights_attribute_for_id

Description

=cut

# ---------------------------------------------------------------------
sub __get_rights_attribute_for_id {
    my $self = shift;
    my ($C, $id) = @_;

    my $dbh = $C->get_object('Database')->get_DBH($C);

    my $stripped_id = Identifier::get_id_wo_namespace($id);
    my $namespace = Identifier::the_namespace($id);

    my $row_hashref;
    my $statement =
        qq{SELECT id, attr FROM rights_current WHERE id=? AND namespace=?;};
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $stripped_id, $namespace);

    $row_hashref = $sth->fetchrow_hashref();
    $sth->finish;

    my $attr = $$row_hashref{'attr'};
    my $db_id = $$row_hashref{'id'};

    my $rc = RightsGlobals::OK_ID;

    $rc |= RightsGlobals::BAD_ID         if (! $db_id);
    $rc |= RightsGlobals::NO_ATTRIBUTE   if (! $attr);

    return ($attr, $rc);
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

1;
