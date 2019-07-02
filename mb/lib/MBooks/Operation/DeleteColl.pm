package MBooks::Operation::DeleteColl;


=head1 NAME

MBooks::Operation::DeleteColl (op)

=head1 DESCRIPTION

This class is the DeleteColl implementation of the abstract Operation
class.  It deletes an owned collection to from the database.  "Owned"
is defined as either having the userid of the current session or of
the logged in username.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);
use Collection;
use CollectionSet;
use Auth::Auth;
use Utils;
use Debug::DUtils;
use Search::Constants;  # for index status constants

use MBooks::Operation::Status;
use MBooks::Operation::Manager qw(ManageDeleteCollection);

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

Initialize MBooks::Operation::DeleteColl.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $attr_ref = shift;

    my $C = $$attr_ref{'C'};
    my $act = $$attr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database Operations necessary for the DeleteColl action

=cut

# ---------------------------------------------------------------------
sub execute_operation {
    my $self = shift;
    my $C = shift;
    
    DEBUG('op', qq{execute operation="DeleteColl"});

    $self->SUPER::execute_operation($C);

    my $act = $self->get_action();
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');
    my $cgi = $C->get_object('CGI');
    my $auth = $C->get_object('Auth');
    
    my $coll_id = $cgi->param('c');
    my $owner = $auth->get_user_name($C);

    # Avoid error if coll not owned by owner  XXX implement error messages
    return
        if (! $co->coll_owned_by_user($coll_id, $auth));

    my $ok = ManageDeleteCollection($C, $co, $coll_id);
    ASSERT($ok, qq{Operation DeleteColl error:$@});

    return $ST_OK;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007 ©, The Regents of The University of Michigan, All Rights Reserved

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

