package MBooks::Action;

=head1 NAME
    
    MBooks::Action (act)

=head1 DESCRIPTION

This class is a subclass of Action which see.

=head1 SYNOPSIS

$act->execute_action($C);

=head1 METHODS

=over 8

=cut

use strict;

# Specification of Actions that equate to a view of a list of items in
# a single collection from which the user might choose to view an item
# and to which the user might want to return after done viewing.
my @gItemViewingActions =
    (
     'ACTION_EDIT_COLL',
     'ACTION_COPY_ITEM',
     'ACTION_COPY_ITEM_NC',
     'ACTION_MOVE_ITEM',
     'ACTION_MOVE_ITEM_NC',
     'ACTION_DEL_ITEM',
     'ACTION_LIST_ITEMS',
    );

use base qw(Action);

use Collection;
use CollectionSet;

use MBooks::Operation::Status;

# ---------------------------------------------------------------------

=item after_initialize

Initialize MBooks::Action child using Template Method Design Pattern

=cut

# ---------------------------------------------------------------------
sub after_initialize
{
    my $self = shift;
    my $C = shift;

    my $dbh = $C->get_object('Database')->get_DBH();
    my $config = $C->get_object('MdpConfig');
    my $auth = $C->get_object('Auth');
    # my $user_id = $C->get_object('Auth')->get_user_name($C);

    my $co = Collection->new($dbh, $config, $auth);
    $self->set_transient_facade_member_data($C, 'collection_object', $co);

    my $CS = CollectionSet->new($dbh, $config, $auth) ;
    $self->set_transient_facade_member_data($C, 'collection_set_object', $CS);

    $self->set_back_to_app_url($C);
}



# ---------------------------------------------------------------------

=item set_back_to_app_url

Create and persist the link to take the PT user back to the CB
collection they came from.  If the user is not logged in, delete any
record of where they came from.

=cut

# ---------------------------------------------------------------------
sub set_back_to_app_url
{
    my $self = shift;
    my $C = shift;
    
    my $app_name = $C->get_object('App')->get_app_name($C);

    my $auth = $C->get_object('Auth');
    my $is_logged_in = $auth->is_logged_in($C);

    if (! $is_logged_in)
    {
        my $ses = $C->get_object('Session');
        $ses->set_persistent($app_name . '_app_url', undef);
    }
    else
    {
        my $name = $self->get_name();
        if (grep(/$name/, @gItemViewingActions))
        {
            my $cgi = $C->get_object('CGI');
            my $ses = $C->get_object('Session');
            
            my $new_cgi = new CGI('');
            
            $new_cgi->param('a', 'listis');
            $new_cgi->param('c', scalar $cgi->param('c'));
            $new_cgi->param('debug', scalar $cgi->param('debug'));
            
            $ses->set_persistent($app_name . '_app_url', $new_cgi->self_url());
        }
    }
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2007-10 ©, The Regents of The University of Michigan, All Rights Reserved

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

