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
    
    my $statement = qq{SELECT secret_key FROM da_authentication WHERE access_key=? AND activated=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $l_access_key, 1);
    my $secret_key = $sth->fetchrow_array();
    hLOG_DEBUG('DB:  ' . qq{get_secret_by_active_access_key: $statement: $l_access_key 1 ::: SECRET_KEY});

    return $secret_key;
}

# ---------------------------------------------------------------------

=item nonce_used_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub nonce_used_by_access_key {
    my ($dbh, $access_key, $nonce, $timestamp, $window) = @_;

    my ($statement, $sth);

    $statement = qq{LOCK TABLES da_requests WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    # dispose nonce vaues for this access_key outside our window
    my $timestamp_CLAUSE = qq{(stamptime > UNIX_TIMESTAMP()+?) OR (stamptime < UNIX_TIMESTAMP()-?)};

    $statement = qq{DELETE FROM da_requests WHERE access_key=? AND ($timestamp_CLAUSE)};
    hLOG_DEBUG('DB:  ' . qq{nonce_used_by_access_key: $statement: $access_key $window});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key, $window, $window);

    # any remaining nonce values must be inside the window and are
    # replays if they exist
    $statement = qq{SELECT count(*) FROM da_requests WHERE access_key=? AND nonce=?};
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key, $nonce);

    my $ct = $sth->fetchrow_array() || 0;
    hLOG_DEBUG('DB:  ' . qq{nonce_used_by_access_key: $statement: $access_key $nonce ::: $ct});

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    return $ct;
}

# ---------------------------------------------------------------------

=item valid_timestamp_for_access_key

Description

=cut

# ---------------------------------------------------------------------
sub valid_timestamp_for_access_key {
    my ($dbh, $access_key, $timestamp) = @_;

    my ($statement, $sth);

    $statement = qq{LOCK TABLES da_requests WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    # timestamp must be greater than that on all recorded requests for this access key
    $statement = qq{SELECT MAX(stamptime) FROM da_requests WHERE access_key=?};
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);

    my $max = $sth->fetchrow_array() || 0;
    hLOG_DEBUG('DB:  ' . qq{valid_timestamp_for_access_key: $statement: $access_key $timestamp ::: $max});

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    return ($timestamp > $max);
}

# ---------------------------------------------------------------------

=item insert_nonce_timestamp

Description

=cut

# ---------------------------------------------------------------------
sub insert_nonce_timestamp {
    my ($dbh, $access_key, $nonce, $timestamp) = @_;

    my ($statement, $sth);

    $statement = qq{LOCK TABLES da_requests WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{INSERT INTO da_requests SET access_key=?, nonce=?, stamptime=?};
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

    $statement = qq{LOCK TABLES da_statistics WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{INSERT INTO da_statistics SET access_key=? ON DUPLICATE KEY UPDATE accesses=accesses+1, last_access=?};
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

    $statement = qq{LOCK TABLES da_statistics WRITE};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);

    $statement = qq{UPDATE da_statistics SET $field=$field+1 WHERE access_key=?};
    hLOG_DEBUG('DB:  ' . qq{update_fail_ct: $statement: $access_key});
    $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);

    $statement = qq{UNLOCK TABLES};
    $sth = API::DbIF::prepAndExecute($dbh, $statement);
}

# ---------------------------------------------------------------------

=item get_privileges_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_privileges_by_access_key {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT code FROM da_authorization WHERE  access_key=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    # No row for access key means default lowest privilege
    my $code = $sth->fetchrow_array() || 1;

    hLOG_DEBUG('DB:  ' . qq{get_privileges_by_access_key: $statement: $access_key ::: $code});
    return $code;
}

# ---------------------------------------------------------------------

=item get_ip_address_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_ip_address_by_access_key {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT ipregexp FROM da_authorization WHERE  access_key=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $access_key);
    my $ipregexp = $sth->fetchrow_array() || '^$';

    hLOG_DEBUG('DB:  ' . qq{get_ip_address_by_access_key: $statement: $access_key ::: $ipregexp});
    return $ipregexp;
}

# ---------------------------------------------------------------------

=item get_access_key_by_userid

Description

=cut

# ---------------------------------------------------------------------
sub get_access_key_by_userid {
    my ($dbh, $userid) = @_;

    my $statement = qq{SELECT access_key FROM da_authentication WHERE userid=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $userid);
    my $access_key = $sth->fetchrow_array() || 0;

    hLOG_DEBUG('DB:  ' . qq{get_access_key_by_userid: $statement: $userid ::: $access_key});
    return $access_key;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012 ©, The Regents of The University of Michigan, All Rights Reserved

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
