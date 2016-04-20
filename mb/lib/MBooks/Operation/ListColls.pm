package MBooks::Operation::ListColls;


=head1 NAME

MBooks::Operation::ListColls (op)

=head1 DESCRIPTION

This class is the ListColls implementation of the abstract Operation
class.  It obtains a collection list from the database on behalf of a
client.

TODO: XXX It might be overkill since a PIFiller PI handler for a
collection list PI could do this directly.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

use base qw(Operation);

use CollectionSet;
use Utils;
use Debug::DUtils;

use MBooks::Operation::Status;
use MBooks::Utils::Sort;

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

Initialize MBooks::Operation::ListColls.  Must call parent initialize.

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

Perform the database operations necessary for ListColls action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    my %colltype_map = (
        priv => 'my-collections',
        pub  => 'all_colls'
    );

    DEBUG('op', qq{execute operation="ListColls"});

    $self->SUPER::execute_operation($C);

    my $act = $self->get_action();
    my $cs = $act->get_transient_facade_member_data($C, 'collection_set_object');

    my $cgi = $C->get_object('CGI');
    my $ab = $C->get_object('Bind');

    my $sortkey =$ab->mapurl_param_to_field($C, scalar $cgi->param('sort'));    
    my $dir = MBooks::Utils::Sort::get_dir_from_sort_param(scalar $cgi->param('sort'));
    
    my $colltype = $cgi->param('colltype');
    unless ( $cgi->param('page') eq 'ajax' ) {
        $colltype = 'all_colls';
    } else {
        $colltype = $colltype_map{$colltype} ? $colltype_map{$colltype} : $colltype;
    }

    my $callback = $cgi->param('callback');
    if ($callback && $callback =~ /[^A-Za-z0-9_]/) {
        $callback = 'jsonCallback';
    }
    if ($callback) {
        $act->set_transient_facade_member_data($C, 'jsonCallback', $callback);
    }
    
    my $coll_arr_ref;
    eval {
        $coll_arr_ref = $cs->list_colls($colltype, $sortkey,$dir );
    };
    die $@ if ( $@ );
    
    $act->set_transient_facade_member_data($C, 'list_colls_data', $coll_arr_ref);

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

