package LS::Action;

=head1 NAME

LS::Action (act)

=head1 DESCRIPTION

This class is a subclass of Action which see.

=head1 SYNOPSIS

$act->execute_action($C);

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Action);
use Collection;
use CollectionSet;



# ---------------------------------------------------------------------

=item after_initialize

Initialize LS::Action child using Template Method Design Pattern

=cut

# ---------------------------------------------------------------------
sub after_initialize
{
    my $self = shift;
    my $C = shift;

    # Auth
    my $auth = $C->get_object('Auth');
    my $db = $C->get_object('Database');
    my $config = $C->get_object('MdpConfig');

    my $dbh = $db->get_DBH();

    my $co = new Collection($dbh, $config, $auth);
    $C->set_object('Collection', $co);

    my $cs = new CollectionSet($dbh, $config, $auth);
    $C->set_object('CollectionSet', $cs);

    $self->set_transient_facade_member_data($C, 'collection_object', $co);
    $self->set_transient_facade_member_data($C, 'collection_set_object', $cs);

}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008-2010 ©, The Regents of The University of Michigan, All Rights Reserved

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

