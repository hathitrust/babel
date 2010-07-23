package API::DbIF;

=head1 NAME

API::DbIF;

=head1 DESCRIPTION

This package contains database DBI utilities

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use DBI;


# ---------------------------------------------------------------------

=item databaseConnect

DBI::connect will become Apache::DBI::connect under mod_perl transparently
See the ||= thing above on the $DBH global variable.

=cut

# ---------------------------------------------------------------------
sub databaseConnect
{
    my ($db_name, $db_user, $db_passwd, $db_server) = @_;

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

=item prepAndExecute

Description

=cut

# ---------------------------------------------------------------------
sub prepAndExecute
{
    my ($dbh, $statement) = @_;

    my $count;
    my $sth = $dbh->prepare($statement);
    if ($sth) {
        $count = $sth->execute();
    }

    return $sth;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009-10 ©, The Regents of The University of Michigan, All Rights Reserved

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
