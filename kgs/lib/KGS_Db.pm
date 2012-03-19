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
use DbUtils;

use KGS_Log;

# ---------------------------------------------------------------------

=item insert_client_data 

Description

=cut

# ---------------------------------------------------------------------
sub insert_client_data {
    my ($C, $dbh, $client_data, $access_key, $secret_key) = @_;

    my ($name, $org, $email) = ($client_data->{name}, $client_data->{org}, $client_data->{email});
    
    my $statement = qq{INSERT INTO da_authentication SET access_key=?, secret_key=?, name=?, org=?, email=?};
    LOG($C, qq{insert_client_data: $statement : $access_key, SECRET_KEY, $name, $org, $email});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, 
                                      $access_key, $secret_key, $name, $org, $email);
}

# ---------------------------------------------------------------------

=item count_client_registrations

Description

=cut

# ---------------------------------------------------------------------
sub count_client_registrations {
    my ($C, $dbh, $email, $activated) = @_;

    my $statement = qq{SELECT count(*) FROM da_authentication WHERE email=? AND activated=?};
    LOG($C, qq{count_client_registrations: $statement, $email, $activated});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $email, $activated);
    my $num = $sth->fetchrow_array || 0;

    return $num;
}


# ---------------------------------------------------------------------

=item activate_client_access_key

Description

=cut

# ---------------------------------------------------------------------
sub activate_client_access_key {
    my ($C, $dbh, $access_key) = @_;
    
    my $last_access = Utils::Time::iso_Time();

    my $statement = qq{UPDATE da_authentication SET activated=?, last_access=? WHERE access_key=?};
    LOG($C, qq{activate_client_access_key: $statement, 1, $last_access, $access_key});
    my $sth = DbUtils::prep_n_execute($dbh, $statement, 1, $last_access, $access_key);
}  

# ---------------------------------------------------------------------

=item access_key_is_active

Description

=cut

# ---------------------------------------------------------------------
sub access_key_is_active {
    my ($C, $dbh, $access_key) = @_;
    
    my $statement = qq{SELECT activated FROM da_authentication WHERE access_key=?};
    LOG($C, qq{access_key_is_active: $statement, $access_key});
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
    my ($C, $dbh, $access_key) = @_;
    
    my $statement = qq{SELECT count(*) FROM da_authentication WHERE access_key=?};
    LOG($C, qq{client_access_key_exists: $statement, $access_key});
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
    my ($C, $dbh, $access_key) = @_;

    my $statement = qq{SELECT name, org, email FROM da_authentication WHERE access_key=?};
    LOG($C, qq{get_client_data_by_access_key: $statement, $access_key});
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
    my ($C, $dbh, $access_key) = @_;

    my $statement = qq{SELECT secret_key FROM da_authentication WHERE access_key=?};
    LOG($C, qq{get_secret_by_access_key: $statement, $access_key});
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
