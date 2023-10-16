package MBooks::Operation::AddColl;


=head1 NAME

MBooks::Operation::AddColl (op)

=head1 DESCRIPTION

This class is the AddColl implementation of the abstract Operation
class.  It adds an owned collection to from the database.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);

use CollectionSet;
use Auth::Auth;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;

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

Initialize MBooks::Operation::AddColl.  Must call parent initialize.

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

Perform the database operations necessary for the AddColl action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="AddColl"});

    $self->SUPER::execute_operation($C);

    my $act = $self->get_action();
    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');
    my $cgi = $C->get_object('CGI');
    my $auth = $C->get_object('Auth');

    my $collname = $cgi->param('cn');
    my $description = $cgi->param('desc');
    my $shared = $cgi->param('shrd');

    # maybe check here for which user name is being used for collections!
    my $owner = $auth->get_user_name($C);
    my $owner_name = $auth->get_user_display_name($C);

    # Avoid error if collname exists for owner. Collname already
    # exists so make this a no-op XXX need error messages
    return 
        if ($cs->exists_coll_name_for_owner($collname, $auth));

    my $coll_data_hashref = {
                             'collname'    => $collname,
                             'description' => $description,
                             'shared'      => $shared,
                             'owner'       => $auth,
                             'owner_name'  => $owner_name,
                            };

    my $added_coll_id;
    eval
    {
        $added_coll_id = $cs->add_coll($coll_data_hashref);
    };
    die $@ if ($@);
    
    $cgi->param('c2', $added_coll_id);

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

