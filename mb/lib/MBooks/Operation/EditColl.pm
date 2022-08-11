package MBooks::Operation::EditColl;


=head1 NAME

MBooks::Operation::EditColl (op)

=head1 DESCRIPTION

This class is the EditColl implementation of the abstract Operation
class.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);
use Collection;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;
use MBooks::Utils::TempColl;

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

Initialize MBooks::Operation::EditColl.  Must call parent initialize.

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

Perform the database operations necessary for EditColl action
These are update operations on one or all of the following 3 fields:

UI name          cgi param       field name
Collection Name  cn              MColl_ID
Description      desc            collname
shared status    shrd            shared

NOTE: this operation is overloaded.  It handles action 'editst' to
change the shared status and action 'editc' to edit the description,
collection name and shared status.  When the action is editst we need
to preserve the collection name and description.  This could be done
by passing both on the URL but it makes a shorter URL to test for the
case in the code here.  pfarber Mon Jun 23 12:22:19 2008


=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="EditColl"});

    $self->SUPER::execute_operation($C);

    my $cgi = $C->get_object('CGI');
    my $ab = $C->get_object('Bind');
    my $co = $self->get_action()->get_transient_facade_member_data($C, 'collection_object');

    # Avoid error if coll not owned by owner XXX tbw need to test that
    # when coll not owned, the exception is thrown caught XXX
    # implement error messages
    my $coll_id = $cgi->param('c');
    my $owner = $co->get_user_id;
    return
        if (! $co->coll_owned_by_user($coll_id, $owner));

    my $shared;
    my $shared_code = $cgi->param('shrd');
    if ($shared_code == 0)
    {
        $shared = 'private';
    }
    elsif (abs($shared_code) == 1)
    {
        # Do not allow edits to make a temporary collection public -- security
        if (MBooks::Utils::TempColl::coll_is_temporary($C, $co, $coll_id)) {
            $shared = 'private';
        }
        elsif ($shared_code < 0) {
            $shared = 'draft';
        }
        else {
            $shared = 'public';
        }
    }
    else
    {
        ASSERT(0, qq{Invalid share code="$shared_code"});
    }

    # edit status
    if (defined ($cgi->param('shrd')))
    {
        eval
        {
            $co->edit_status($coll_id, $shared);
        };
        die $@  if ($@);
    }

    # edit description, collection name only when action is editc. See
    # NOTE: above
    my $action = $cgi->param('a');
    if ($action eq 'editc')
    {
        my $desc = $cgi->param('desc') || '';
        eval
        {
            $co->edit_description($coll_id, $desc);
        };
        die $@ if ($@);

        my $contributor_name = $cgi->param('contributor_name') || '';
        eval { $co->edit_contributor_name( $coll_id, $contributor_name ); };
        die $@ if ($@);

        # edit collection name
        my $coll_name = $cgi->param('cn');

        if ((defined ($cgi->param('cn'))) && ($cgi->param('cn') ne '') )
        {
            # if the coll name submitted is the current coll name then
            # they probably just left it unchanged in the form and are
            # trying to edit something else
            my $current_coll_name = $co->get_coll_name($coll_id);
            if ($current_coll_name ne $coll_name)
            {
                eval
                {
                    $co->edit_coll_name($coll_id, $coll_name);
                };
                die $@ if ($@);
            }
        }
    }

    return $ST_OK;
}


1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

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

