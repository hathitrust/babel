package API::HTD::Rights;


=head1 NAME

API::HTD::Rights;

=head1 DESCRIPTION

This class provides an interface to the rights database returning an
object that encapsulates a row of the database and determinations of
accessibility.

=head1 SYNOPSIS

use API::HTD::Rights;

my $ro = API::HTD::Rights::createRightsObject($DBH, $paramRef);
if ($ro)
{
  ...
}


=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use API::DbIF;

# ---------------------------------------------------------------------

=item createRightsObject

Procedural interface

=cut

# ---------------------------------------------------------------------
sub createRightsObject
{
    my ($dbh, $paramRef) = @_;

    my $namespace = $paramRef->{'ns'};
    my $barcode = $paramRef->{'bc'};

    my $ro = API::HTD::Rights->new($dbh, $namespace, $barcode);

    return $ro->__initialized() ? $ro : undef;
}

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}


# ---------------------------------------------------------------------

=item _initialize

Initialize API::HTD::Rights object

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my ($dbh, $namespace, $barcode) = @_;

    my $statement =
        qq{SELECT namespace, id, attr, reason, source, user, time, note FROM rights_current WHERE id=? AND namespace=?};
    my $sth = API::DbIF::prepAndExecute($dbh, $statement, $barcode, $namespace);
    my $row_hashref = $sth->fetchrow_hashref();

    if (defined($row_hashref)) {
        # ISO time format
        $row_hashref->{'time'} =~ s,[ ],T,;

        # no undef fields
        foreach my $key (keys %$row_hashref) {
            $row_hashref->{$key} = ''
                if (! defined($row_hashref->{$key}));
        }

        $self->{'rights'} = $row_hashref;
    }
}

# ---------------------------------------------------------------------

=item getRightsFieldVal

Public method on rights object

=cut

# ---------------------------------------------------------------------
sub getRightsFieldVal {
    my $self = shift;
    my $field = shift;

    if ($ENV{UNDER_TEST}) {
        return $ENV{TEST_ATTR} if ($field eq 'attr');
        return $ENV{TEST_SOURCE} if ($field eq 'source');
    }

    return $self->{'rights'}{$field};
}

# ---------------------------------------------------------------------

=item __initialized

Private

=cut

# ---------------------------------------------------------------------
sub __initialized
{
    my $self = shift;
    return exists($self->{'rights'});
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2009 ©, The Regents of The University of Michigan, All Rights Reserved

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
