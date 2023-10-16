package MBooks::Utils::Transfer;

=head1 NAME

MBooks::Utils::Transfer

=head1 DESCRIPTION

Manage the C<mb_transfer> table:

CREATE TABLE `mb_transfer` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `token` varchar(36) NOT NULL DEFAULT '',
  `submitter` varchar(255) NOT NULL DEFAULT '',
  `submitter_usernames` text NOT NULL DEFAULT '[]',
  `receiver` varchar(255) DEFAULT NULL,
  `payload` text DEFAULT NULL,
  `created` timestamp NOT NULL DEFAULT current_timestamp(),
  `completed` timestamp NULL DEFAULT NULL,
  PRIMARY KEY (`id`),
  KEY `token` (`token`),
  KEY `submitter` (`submitter`)
) ENGINE=InnoDB AUTO_INCREMENT=19 DEFAULT CHARSET=utf8mb4;

=head1 SYNOPSIS

All potential usernames are collected for the submitter in restrict
transfers to collections owned by the submitter at the time of the
transfer.

=head1 METHODS

=over 8

=item MBooks::Utils::Transfer::load

Given $token, return a matching MBooks::Utils::Transfer object

=item MBooks::Utils::Transfer::find_pending

Return all pending transfers for an authenticated user.

If given C<@collids>, return only the pending transfers that
reference those collections.

=item new

Initializes a new transfer object with a C<UUID::Tiny::UUID_V4> 
token.

=item generate($C, $collection_data)

Creates a row in C<mb_transfer>.

Captures the usernames from C<Auth::Auth>.

=item complete($C)

Sets the C<receiver> to the current C<Auth::Auth> user and 
sets C<completed>.

=item in_payload(@collids)

Checks whether the submitted C<@collids> appear in the payload.

=back

=cut

use UUID::Tiny;
use JSON::XS;
use DbUtils;

use List::Util qw();

## ------------ class methods
sub load {
    my ( $C, $token ) = @_;

    my $dbh = $C->get_object('DBI');
    my $config = $C->get_object('MdpConfig');
    my $transfer_table_name = $config->get('transfer_table_name');

    my $select_token_sql = <<SQL;
SELECT * FROM $transfer_table_name WHERE token = ?
SQL

    my $datum;
    eval {
        $datum = $dbh->selectrow_hashref($select_token_sql, undef, $token);
    };
    if ( my $err = $@ ) {
        die "error.database::$err";
    }
    unless ( ref($datum) ) {
        die "error.invalid-token";
    }

    return __PACKAGE__->new(%$datum);
}

sub find_pending {
    my ( $C, @collids ) = @_;

    my $db = $C->get_object('Database');
    my $dbh = $db->get_DBH();
    my $auth = $C->get_object('Auth');
    my $config = $C->get_object('MdpConfig');

    my $transfer_table_name = $config->get('transfer_table_name');
    my @usernames = $auth->get_user_names();
    my $expr = _paramify(@usernames);

    my $find_pending_sql = <<SQL;
SELECT * FROM $transfer_table_name WHERE submitter IN ( $expr ) AND completed IS NULL
SQL

    my $rows;
    eval {
        $rows = [ 
            map { __PACKAGE__->new(%$_) } 
                @{ $dbh->selectall_arrayref($find_pending_sql, {Slice=>{}}, @usernames) }
        ];
    };
    if ( my $err = $@ ) {
        die "error.database::$err";
    }

    if ( scalar @collids ) {
        my @tmp = ();
        foreach my $transfer ( @$rows ) {
            if ( $transfer->in_payload(@collids) ) {
                push @tmp, $transfer;
            }
        }
        $rows = \@tmp;
    }

    return $rows;
}

## ------------ end class methods

sub new {
    my $class = shift;
    my $self = {@_};
    bless $self, $class;

    unless ( $$self{token} ) {
        $$self{token} = UUID::Tiny::create_uuid_as_string(UUID_V4); 
    }

    return $self;
}

sub generate {
    my $self = shift;
    my ( $C, $collection_data ) = @_;

    my $dbh = $C->get_object('DBI');
    my $config = $C->get_object('MdpConfig');
    my $transfer_table_name = $config->get('transfer_table_name');

    my $auth = $C->get_object('Auth');
    my @usernames = $auth->get_user_names($C);

    my $insert_token_sql = <<SQL;
INSERT INTO $transfer_table_name 
    ( token, submitter, submitter_usernames, payload, created )
VALUES (
    ?,
    ?,
    ?,
    ?,
    NOW()
)
SQL

    my @params = (
        $$self{token}, 
        $auth->get_user_name(),
        encode_json(\@usernames),
        encode_json($$collection_data{collids})
    );

    DbUtils::begin_work($dbh);
    eval {
        $dbh->do($insert_token_sql, undef, @params);
        DbUtils::commit($dbh);
    };
    if ( my $err = $@ ) {
        die "error.database::$err";
    }
}

sub complete {
    my $self = shift;
    my ( $C ) = @_;

    my $dbh = $C->get_object('DBI');
    my $config = $C->get_object('MdpConfig');
    my $transfer_table_name = $config->get('transfer_table_name');

    my $auth = $C->get_object('Auth');

    my $complete_token_sql = <<SQL;
UPDATE $transfer_table_name SET receiver = ?, completed = NOW() WHERE token = ?
SQL

    DbUtils::begin_work($dbh);
    eval {
        $dbh->do($complete_token_sql, undef, 
            $auth->get_user_name(),
            $$self{token}
        );
        DbUtils::commit($dbh);
    };
    if ( my $err = $@ ) {
        die "error.database::$err";
    }
}

sub cancel {
    my $self = shift;
    my ( $C ) = @_;

    my $dbh                 = $C->get_object('DBI');
    my $config              = $C->get_object('MdpConfig');
    my $transfer_table_name = $config->get('transfer_table_name');

    my $auth = $C->get_object('Auth');

    my $cancel_token_sql = <<SQL;
DELETE FROM $transfer_table_name WHERE token = ?
SQL

    DbUtils::begin_work($dbh);
    eval {
        $dbh->do(
            $cancel_token_sql, undef,
            $$self{token}
        );
        DbUtils::commit($dbh);
    };
    if ( my $err = $@ ) {
        die "error.database::$err";
    }
}

sub token {
    my $self = shift;
    return $$self{token};
}

sub payload {
    my $self = shift;
    return decode_json($$self{payload});
}

sub submitter {
    my $self = shift;
    return $$self{submitter};
}

sub submitter_usernames {
    my $self = shift;
    return decode_json($$self{submitter_usernames});
}

sub has_completed {
    my $self = shift;
    return ( $$self{receiver} && $$self{completed} );
}

sub in_payload {
    my $self = shift;
    my @collids = @_;
    my %union; my %isect;
    foreach $e (@collids, @{ $self->payload} ) { $union{$e}++ && $isect{$e}++ }
    return ( scalar keys %isect > 0 );
}

# utilities
sub _paramify {
    my ( @params ) = @_;
    return join(',', map { '?' } @params);
}

1;