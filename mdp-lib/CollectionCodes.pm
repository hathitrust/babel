package CollectionCodes;

=head1 NAME

CollectionCodes

=head1 DESCRIPTION

This package provides the interface and access logic to
collection code data.

  CREATE TABLE `ht_collections` (
       `collection`               varchar(16) NOT NULL,
       `content_provider_cluster` varchar(255) DEFAULT NULL,
       `responsible_entity`       varchar(64) DEFAULT NULL,
       `original_from_inst_id`    varchar(32) DEFAULT NULL,
     PRIMARY KEY (`collection`)
  ) ENGINE=InnoDB DEFAULT CHARSET=latin1;

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use Context;
use Database;
use DbUtils;


# ---------------------------------------------------------------------

=item ___get_CC_ref, ___set_CC_ref

Needed for persistent clients, e.g. imgsrv.

=cut

# ---------------------------------------------------------------------
sub ___get_CC_ref {
    my $C = shift;

    my $CollectionCodes_Hash_ref = ( $C->has_object('CollectionCodes') ? $C->get_object('CollectionCodes') : {} );
    return $CollectionCodes_Hash_ref;
}
sub ___set_CC_ref {
    my ($C, $n_ref) = @_;

    bless $n_ref, 'CollectionCodes';
    $C->set_object('CollectionCodes', $n_ref);
}

# ---------------------------------------------------------------------

=item __load_collection_code_hash

Description

=cut

# ---------------------------------------------------------------------
sub __load_collection_code_hash {
    my $C = shift;

    my $CollectionCode_Hash_ref = ___get_CC_ref($C);
    return if (scalar keys %$CollectionCode_Hash_ref);

    my $dbh = $C->get_object('Database')->get_DBH;

    my $statement = qq{SELECT * FROM ht_collections};
    my $sth = DbUtils::prep_n_execute($dbh, $statement);
    my $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});

    my %CollectionCode_Hash = map { $_->{collection},
                                      {
                                       content_provider_cluster   => $_->{content_provider_cluster},
                                       responsible_entity   => $_->{responsible_entity},
                                       original_from_inst_id => $_->{original_from_inst_id},
                                      }
                                  } @$ref_to_arr_of_hashref;

    ___set_CC_ref($C, \%CollectionCode_Hash);
}


# ---------------------------------------------------------------------

=item get_inst_id_by_collection_code

Description

=cut

# ---------------------------------------------------------------------
sub get_inst_id_by_collection_code {
    my ($C, $collection_code) = @_;

    __load_collection_code_hash($C);
    my $CollectionCode_Hash_ref = ___get_CC_ref($C);
    return $CollectionCode_Hash_ref->{$collection_code}->{original_from_inst_id};
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
