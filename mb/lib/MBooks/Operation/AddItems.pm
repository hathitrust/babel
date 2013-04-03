package MBooks::Operation::AddItems;


=head1 NAME

MBooks::Operation::AddItems (op)

=head1 DESCRIPTION

This class is the AddItems implementation of the abstract Operation
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
use Identifier;
use Debug::DUtils;

use Search::Indexer;
use Search::Constants;

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

Initialize MBooks::Operation::AddItems.  Must call parent initialize.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my $rattr_ref = shift;

    my $C = $$rattr_ref{'C'};
    my $act = $$rattr_ref{'act'};

    $self->SUPER::_initialize($C, $act);
}



# ---------------------------------------------------------------------

=item execute_operation

Perform the database operations necessary for AddItems action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    DEBUG('op', qq{execute operation="AddItems"});

    $self->SUPER::execute_operation($C);

    # Pessimistic
    my $db_success = 0;
    # Cron handles Solr indexing of this item
    
    # Special validation for external (mdp, miun) ID
    my $cgi = $C->get_object('CGI');
    if (Identifier::validate_mbooks_id($cgi))
    {
        my $new_internal_id = $self->add_item_to_database($C);

        if (defined($new_internal_id))
        {
            $db_success = 1;
            # The cron job will eventually add this item to the index
        }
    }

    my %add_items_data;
    $add_items_data{'database_success'} = $db_success;
    my $act = $self->get_action();
    $act->set_persistent_facade_member_data($C, 'add_items_data', \%add_items_data);

    return $db_success ? $ST_OK : $ST_NOT_OK;
}


# ---------------------------------------------------------------------

=item add_item_to_database

Description

=cut

# ---------------------------------------------------------------------
sub add_item_to_database
{
    my $self = shift;
    my $C = shift;

    my $cgi = $C->get_object('CGI');

    my $act = $self->get_action();
    my $co = $act->get_transient_facade_member_data($C, 'collection_object');

    my $metadata_hashref;
    $$metadata_hashref{'extern_item_id'} = $cgi->param('id');

    my $display_title = $cgi->param('ti');
    $$metadata_hashref{'display_title'} = $display_title;

    my $i2 = $cgi->param('i2');
    my $sort_title = $self->get_sort_title($display_title, $i2);
    $$metadata_hashref{'sort_title'} = $sort_title;

    my $author = $cgi->param('au');;
    $$metadata_hashref{'author'} = $author;

    $$metadata_hashref{'date'} = $cgi->param('da');
    $$metadata_hashref{'rights'} = $cgi->param('rattr');

    my $metadata_ref = $self->normalize_metadata($metadata_hashref);
    my $item_id;

    eval
    {
        $item_id = $co->create_or_update_item_metadata($metadata_ref);
    };
    if ($@)
    {
        $item_id = undef;
        soft_ASSERT(0, qq{AddItem database failure="$@", extern_id="$$metadata_hashref{'extern_item_id'}"}, 'force_email');
    }

    # Pass added item ids downstream to later Operation like CopyItems
    $cgi->param('id', $item_id);

    return $item_id;
}


# ---------------------------------------------------------------------

=item get_sort_title

MARC 245 indicator 2 indicates how many positions to skip

=cut

# ---------------------------------------------------------------------
sub get_sort_title
{
    my $self = shift;
    my ($display_title, $i2) = @_;

    # Remap XML charents so I2 makes sense
    Utils::remap_cers_to_chars(\$display_title);
    my $sort_title = substr($display_title, $i2);
    Utils::map_chars_to_cers(\$sort_title);

    return $sort_title;
}


# ---------------------------------------------------------------------

=item normalize_metadata

Description

=cut

# ---------------------------------------------------------------------
sub normalize_metadata
{
    my $self = shift;
    my $metadata_hashref = shift;

    my $metadata_clean_ref = {};

    foreach my $key (keys %{$metadata_hashref})
    {
        $$metadata_clean_ref{$key} = $$metadata_hashref{$key}
    }
    my $date = $$metadata_hashref{'date'};
    $$metadata_clean_ref{'date'} = $self->normalize_date($date);
    if (! defined($$metadata_clean_ref{'author'}))
    {
        $$metadata_clean_ref{'author'}='';
    }
    return $metadata_clean_ref;
}


# ---------------------------------------------------------------------

=item Name

Description

=cut

# ---------------------------------------------------------------------
sub normalize_date
{
    my $self = shift;
    my $date = shift;

    # XXX what kind of error to throw if can't figure out how to
    # normalize date.  Consider logging somewhere and inserting fake
    # date such as 3000 chk mysql for possible fake date value try
    # 0000
    if ($date =~ m,(1\d{3}|20\d{2}),)
    {
        $date = $1;
        # mysql needs month and day so put in fake
        $date .= '-00-00';
    }
    else
    {
        $date = '0000-00-00';
    }

    return $date;
}


# ---------------------------------------------------------------------
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

