package KGS_Db;

=head1 NAME

KGS_Db

=head1 DESCRIPTION

This package contains database DBI routines

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use DBI;

use Utils;
use Utils::Time;
use Debug::DUtils;
use DbUtils;

use KGS_Log;

# ---------------------------------------------------------------------

=item insert_client_data 

Description

=cut

# ---------------------------------------------------------------------
sub insert_client_data {
    my ($dbh, $client_data, $access_key, $secret_key) = @_;

    my ($name, $org, $email, $userid) = ($client_data->{name}, $client_data->{org}, $client_data->{email}, $client_data->{userid});
    
    my $statement = 
      qq{INSERT INTO htd_authentication SET access_key=?, secret_key=?, name=?, org=?, email=?}
        . ((defined $userid) ?', userid=?' : '' );
    
    my @values = ($access_key, $secret_key, $name, $org, $email);
    push(@values, $userid) if (defined $userid);
 
    DEBUG('db', qq{insert_client_data: $statement : $access_key, SECRET_KEY, $name, $org, $email, $userid});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, @values);
}

# ---------------------------------------------------------------------

=item count_client_registrations

Description

=cut

# ---------------------------------------------------------------------
sub count_client_registrations {
    my ($dbh, $email, $activated) = @_;

    my $statement = qq{SELECT count(*) FROM htd_authentication WHERE email=? AND activated=?};
    DEBUG('db', qq{count_client_registrations: $statement, $email, $activated});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $email, $activated);
    my $num = $sth->fetchrow_array || 0;

    return $num;
}

# ---------------------------------------------------------------------

=item count_client_auth_registrations

Description

=cut

# ---------------------------------------------------------------------
sub count_client_auth_registrations{
    my ($dbh, $userid) = @_;

    my $statement = qq{SELECT count(*) FROM htd_authentication WHERE userid=?};
    DEBUG('db', qq{count_client_registrations: $statement, $userid});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $userid);
    my $num = $sth->fetchrow_array || 0;

    return $num;
}


# ---------------------------------------------------------------------

=item activate_client_access_key

Also set default authorization to "open", i.e. free|limited, i.e. 1

=cut

# ---------------------------------------------------------------------
sub activate_client_access_key {
    my ($dbh, $access_key) = @_;
    
    my ($statement, $sth);

    $statement = qq{UPDATE htd_authentication SET activated=? WHERE access_key=?};
    DEBUG('db', qq{activate_client_access_key: $statement, 1, $access_key});
    $sth = DbUtils::prep_n_execute($dbh, $statement, 1, $access_key);
}  

# ---------------------------------------------------------------------

=item access_key_is_active

Description

=cut

# ---------------------------------------------------------------------
sub access_key_is_active {
    my ($dbh, $access_key) = @_;
    
    my $statement = qq{SELECT activated FROM htd_authentication WHERE access_key=?};
    DEBUG('db', qq{access_key_is_active: $statement, $access_key});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $access_key);
    my $active = $sth->fetchrow_array || 0;

    return $active;
}  

# ---------------------------------------------------------------------

=item client_access_key_exists

Description

=cut

# ---------------------------------------------------------------------
sub client_access_key_exists {
    my ($dbh, $access_key) = @_;
    
    my $statement = qq{SELECT count(*) FROM htd_authentication WHERE access_key=?};
    DEBUG('db', qq{client_access_key_exists: $statement, $access_key});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $access_key);
    my $exists = $sth->fetchrow_array || 0;

    return $exists;
}
  
# ---------------------------------------------------------------------

=item get_client_data_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_client_data_by_access_key {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT name, org, email FROM htd_authentication WHERE access_key=?};
    DEBUG('db', qq{get_client_data_by_access_key: $statement, $access_key});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $access_key);
    my $arr_ref_of_hashref = $sth->fetchall_arrayref({});

    return $arr_ref_of_hashref->[0];
}

# ---------------------------------------------------------------------

=item get_secret_by_access_key

Description

=cut

# ---------------------------------------------------------------------
sub get_secret_by_access_key {
    my ($dbh, $access_key) = @_;

    my $statement = qq{SELECT secret_key FROM htd_authentication WHERE access_key=?};
    DEBUG('db', qq{get_secret_by_access_key: $statement, $access_key});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $access_key);
    my $secret_key = $sth->fetchrow_array();

    return $secret_key;
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
