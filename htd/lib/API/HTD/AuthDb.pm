package API::HTD::AuthDb;

=head1 NAME

API::HTD::AuthDb

=head1 DESCRIPTION

This package contains authentication and authorization database access routines

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use DBI;

use API::DbIF;
use API::HTD_Log;

# ---------------------------------------------------------------------

=item get_secret_by_active_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_secret_by_active_access_key {
    my ($dbh, $access_key) = @_;

    my $l_access_key = ($access_key ? $access_key : 0);

    my $statement = qq{SELECT secret_key FROM htd_authentication WHERE access_key=? AND activated=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $l_access_key, 1);
    my $secret_key = $sth->fetchrow_array();
    hLOG_DEBUG('DB:  ' . qq{get_secret_by_active_access_key: $statement: $l_access_key 1 ::: SECRET_KEY});

    return $secret_key;
}

# ---------------------------------------------------------------------

=item max_timestamp_check_error

Description

=cut

# ---------------------------------------------------------------------
sub max_timestamp_check_error {
    my $rec_ref = shift;
    return ($rec_ref->{max_timestamp_check}->{error}, $rec_ref->{max});
}

# ---------------------------------------------------------------------

=item uniqueness_check_error

Description

=cut

# ---------------------------------------------------------------------
sub uniqueness_check_error {
    my $rec_ref = shift;
    return $rec_ref->{uniqueness_check}->{error};
}

# ---------------------------------------------------------------------

=item validate_nonce_and_timestamp_for_access_key

Description

=cut

# ---------------------------------------------------------------------
sub validate_nonce_and_timestamp_for_access_key {
    my ($dbh, $access_key, $nonce, $timestamp, $window) = @_;

    my $validation_record = {
                             'max_timestamp_check' => {'error' => 0, 'max'   => 0},
                             'uniqueness_check'    => {'error' => 0              },
                            };

    my ($statement, $sth);

    $statement = qq{LOCK TABLES htd_requests WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    # Dispose nonce values for all access_keys outside window
    # (otherwise they accumulate for access_keys that are not ever
    # used again). Any remaining nonces values must be inside the
    # window and are replays if they exist.
    my $now = time();
    my ($window_minus, $window_plus) = ($now - $window, $now + $window);
    $statement = qq{DELETE FROM htd_requests WHERE ((stamptime < ?) OR (stamptime > ?))};
    hLOG_DEBUG('DB:  ' . qq{validate_nonce_and_timestamp_for_access_key: $statement: $access_key $window_minus $window_plus});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $window_minus, $window_plus);

    # timestamp must be greater than or equal to all other recorded
    # requests for this access key.  (Simultaneous (>=)) requests with
    # same timestamp with different nonces for this access key are OK
    # because it is the combination that must be unique (below).
    $statement = qq{SELECT MAX(stamptime) FROM htd_requests WHERE access_key=?};
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    my $max = $sth->fetchrow_array() || 0;
    hLOG_DEBUG('DB:  ' . qq{validate_nonce_and_timestamp_for_access_key: $statement: $access_key $timestamp ::: $max});

    $validation_record->{max_timestamp_check}->{error} = ($timestamp < $max);
    $validation_record->{max_timestamp_check}->{max} = $max;

    if (max_timestamp_check_error($validation_record)) {
        $statement = qq{UNLOCK TABLES};
        $sth = API::DbIF::prepAndExecute($dbh, $statement);
        return $validation_record;
    }
    # POSSIBLY NOTREACHED

    # Any remaining nonce values must be inside the window and are
    # replays if they exist
    $statement = qq{SELECT count(*) FROM htd_requests WHERE access_key=? AND nonce=? AND stamptime=?};
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key, $nonce, $timestamp);
    my $ct = $sth->fetchrow_array() || 0;
    hLOG_DEBUG('DB:  ' . qq{validate_nonce_and_timestamp_for_access_key: $statement: $access_key $nonce $timestamp ::: $ct});

    $validation_record->{uniqueness_check}->{error} = ($ct > 0);

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    return $validation_record;
}

# ---------------------------------------------------------------------

=item insert_nonce_timestamp

Description

=cut

# ---------------------------------------------------------------------
sub insert_nonce_timestamp {
    my ($dbh, $access_key, $nonce, $timestamp) = @_;

    my ($statement, $sth);

    $statement = qq{LOCK TABLES htd_requests WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{INSERT INTO htd_requests SET access_key=?, nonce=?, stamptime=?};
    hLOG_DEBUG('DB:  ' . qq{insert_nonce_timestamp: $statement: $access_key $nonce $timestamp});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key, $nonce, $timestamp);

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);
}

# ---------------------------------------------------------------------

=item update_access

Description

=cut

# ---------------------------------------------------------------------
sub update_access {
    my ($dbh, $access_key) = @_;

    my ($statement, $sth);
    my $last_access = Utils::Time::iso_Time();

    $statement = qq{LOCK TABLES htd_statistics WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{INSERT INTO htd_statistics SET access_key=? ON DUPLICATE KEY UPDATE accesses=accesses+1, last_access=?};
    hLOG_DEBUG('DB:  ' . qq{update_access: $statement: $access_key $last_access});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key, $last_access);

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);
}

# ---------------------------------------------------------------------

=item update_fail_ct

Description

=cut

# ---------------------------------------------------------------------
sub update_fail_ct {
    my ($dbh, $access_key, $authentication_phase) = @_;

    my ($statement, $sth);
    my $field = $authentication_phase ? 'authentication_failures' : 'authorization_failures';

    $statement = qq{LOCK TABLES htd_statistics WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{UPDATE htd_statistics SET $field=$field+1 WHERE access_key=?};
    hLOG_DEBUG('DB:  ' . qq{update_fail_ct: $statement: $access_key});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);
}

# ---------------------------------------------------------------------

=item get_privileges_by_access_key

Not in htd_authorization table implies U or K type: PD access only
(downstream test for PDUS).

NOTE: We may temporarily set code=1 for access_keys in
htd_authorization to restrict access to the same level as an
unauthorized htdc user or an unauthorized programatic user.

=cut

# ---------------------------------------------------------------------
sub get_privileges_by_access_key {
    my ($dbh, $access_key) = @_;

    my ($statement, $sth);

    $statement = qq{SELECT code, ipregexp, type FROM htd_authorization WHERE access_key=?};
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    # No row for access key or code == 1 means default lowest privilege
    my $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});
    my $in_htd_authorized = scalar @$ref_to_arr_of_hashref;

    my ($code, $ipregexp, $type) = (1, 'notanipregexp', 'U');

    if ($in_htd_authorized) {
        $code = $ref_to_arr_of_hashref->[0]->{code} || 1;
        $ipregexp = $ref_to_arr_of_hashref->[0]->{ipregexp} || 'notanipregexp';
        $type = $ref_to_arr_of_hashref->[0]->{type};
    }

    unless ($code > 1) {
        # Determine authorization for htdc users by the authentication
        # credential stored as userid when they log in to
        # htdc. Programatic users will not have the userid field
        # populated.
        $in_htd_authorized = 0;

        $statement = qq{SELECT userid FROM htd_authentication WHERE access_key=?};
        $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
        my $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});
        my $userid = $ref_to_arr_of_hashref->[0]->{userid};
        if ($userid) {
            $type = 'K';
        }
        else  {
            $type = 'U';
        }
        $code = 1;
        $ipregexp = 'notanipregexp';
    }

    hLOG('DB:  ' . qq{get_privileges_by_access_key: $statement: $access_key ::: code=$code, ipregexp=$ipregexp, in_authorized=$in_htd_authorized, type=$type});
    return ($code, $ipregexp, $type);
}


# ---------------------------------------------------------------------

=item get_access_key_by_userid

Description

=cut

# ---------------------------------------------------------------------
sub get_access_key_by_userid {
    my ($dbh, $userid) = @_;

    my $statement = qq{SELECT access_key FROM htd_authentication WHERE userid=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $userid);
    my $access_key = $sth->fetchrow_array() || 0;

    hLOG_DEBUG('DB:  ' . qq{get_access_key_by_userid: $statement: $userid ::: $access_key});
    return $access_key;
}


# ---------------------------------------------------------------------

=item access_key_exists

Description

=cut

# ---------------------------------------------------------------------
sub access_key_exists {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT count(*) FROM htd_authentication WHERE access_key=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    my $ct = $sth->fetchrow_array() || 0;

    hLOG_DEBUG('DB:  ' . qq{access_key_exists: $statement: $access_key ::: $ct});
    return $ct;
}

# ---------------------------------------------------------------------

=item get_expiration_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_expiration_by_access_key {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT expires FROM htd_authorization WHERE access_key=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    my $expires = $sth->fetchrow_array() || '0000-00-00 00:00:00';

    hLOG_DEBUG('DB:  ' . qq{expiration: $statement: $access_key ::: $expires});
    return $expires;
}

# ---------------------------------------------------------------------

=item get_all_authentication_data

Description

=cut

# ---------------------------------------------------------------------
sub get_all_authentication_data {
    my ($dbh) = @_;

    my $statement = qq{SELECT access_key, name, org, email FROM htd_authentication WHERE activated=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, 1);
    my $ref_to_arr_of_hashref = $sth->fetchall_arrayref({});

    hLOG_DEBUG('DB:  ' . qq{get_all_authentication_data: $statement});
    return $ref_to_arr_of_hashref;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012-13 ©, The Regents of The University of Michigan, All Rights Reserved

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
