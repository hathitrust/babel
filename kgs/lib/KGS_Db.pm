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


# ---------------------------------------------------------------------

=item kgs_database_connect

DBI::connect will become Apache::DBI::connect

=cut

# ---------------------------------------------------------------------
sub kgs_database_connect {
    my $C = shift;

    my $config = $C->get_object('MdpConfig');

    my ($db_name, $db_user, $db_passwd, $db_server) =
      (
       $config->get('db_name'),
       $config->get('db_user'),
       $config->get('db_passwd'),
       $config->get('db_server')
      );

    my $dsn = qq{DBI:mysql:$db_name:$db_server};
    my $dbh = DBI->connect(
                           $dsn,
                           $db_user,
                           $db_passwd,
                         {
                          PrintError => 1,
                          RaiseError => 0,
                          AutoCommit => 1,
                         }
                          );
    return $dbh;
}

# ---------------------------------------------------------------------

=item kgs_prep_execute

Description

=cut

# ---------------------------------------------------------------------
sub kgs_prep_execute {
    my ($dbh, $statement) = @_;

    my $count;
    my $sth = $dbh->prepare($statement);
    if ($sth) {
        $count = $sth->execute();
    }

    return $sth;
}


# ---------------------------------------------------------------------

=item insert_client_data 

Description

=cut

# ---------------------------------------------------------------------
sub insert_client_data {
    my ($dbh, $requestor_name, $requestor_org, $requestor_email, $access_key, $secret_key) = @_;

    my $statement = qq{INSERT INTO da_authentication SET access_key=?, secret_key=?, name=?, org=? email=?};
#    my $sth = kgs_prep_execute($dbh, $statement);
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
