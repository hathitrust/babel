package LS::Operation::ListSearchResults;

=head1 NAME

LS::Operation::ListSearchResults (op)

=head1 DESCRIPTION

This class is an implementation of the abstract Operation class.  It
provides the data structures/objects needed by the PIFiller to list
search results

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

use strict;

# Perl modules
use Data::Page;

# MDP Modules
use base qw(Operation);

use Utils;
use Debug::DUtils;
use Operation::Status;

use LS::View;
use LS::Result::FullText;

use LS::Operation::CollectionUtil;


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

Initialize LS::Operation::ListSearchResults.  Must call parent
initialize.

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

Perform the database operations necessary for ListSearchResults action

=cut

# ---------------------------------------------------------------------
sub execute_operation
{
    my $self = shift;
    my $C = shift;

    $self->SUPER::execute_operation($C);

    DEBUG('op', qq{execute operation="ListSearchResults"});

    my $cgi = $C->get_object('CGI');
    my $act = $self->get_action();
    ASSERT(defined($act), qq{action not defined});

    LS::Operation::CollectionUtil::test_collection($C, $act);

    # Result object

    my $result_data = $act->get_transient_facade_member_data($C, 'search_result_data');
    my $primary_rs = $result_data->{'primary_result_object'};
    my $secondary_rs= $result_data->{'secondary_result_object'};

    if (! $primary_rs->http_status_ok())
    {
        my $solr_error_msg = qq{SEARCH_FAILED};
        if (defined ($primary_rs->{'response_code'}))
        {
            my $code = $primary_rs->{'response_code'};
            my $status_line = $primary_rs->{'status_line'};
            $solr_error_msg .= qq{|Solr_http_response=$code|Solr_http_status_line=$status_line};
        }

        $act->set_transient_facade_member_data($C, 'solr_error', $solr_error_msg);

        my $empty_pager = $self->get_empty_pager($C,$cgi);
        $act->set_transient_facade_member_data($C, 'pager', $empty_pager);

        return $ST_OK;
    }
    # POSSIBLY NOTREACHED

    my $primary_count = $primary_rs->get_total_hits();
    my $pager;
    
    if ($primary_count > 0)
    {
        $pager = $self->do_paging($C, $cgi, $primary_count);
    }
    else
    {
        # No search results so set create pager with total_entries set
        # to 0 and return 
        $pager = $self->get_empty_pager($C,$cgi);
    }

    $act->set_transient_facade_member_data($C, 'pager', $pager);

    my $counts = $self->__get_counts($primary_rs,$secondary_rs);
    $act->set_transient_facade_member_data($C, 'all_count', $counts->{'all'});
    $act->set_transient_facade_member_data($C, 'full_text_count', $counts->{'full_text'});
    $act->set_transient_facade_member_data($C, 'search_only_count', $counts->{'search_only'});

    return $ST_OK;
    
}

sub __get_counts
{
    my $self = shift;
    my $primary_rs = shift;
    my $secondary_rs = shift;
    my $primary_rs_type   = $primary_rs->get_result_type();
    my $secondary_rs_type = $secondary_rs->get_result_type();
    
    my $counts={};
    
    $counts->{$primary_rs_type}= $primary_rs->get_total_hits;
    $counts->{$secondary_rs_type}= $secondary_rs->get_total_hits;
    foreach my $key (keys %{$counts})
    {
        if ($key eq 'full_text')
        {
            $counts->{'search_only'} = $counts->{'all'} - $counts->{'full_text'};
        }
        elsif ($key eq 'search_only')
        {
            $counts->{'full_text'} = $counts->{'all'} - $counts->{'search_only'};
        }

    }
    return $counts;
}

# ---------------------------------------------------------------------

=item get_empty_pager 

Description

=cut

# ---------------------------------------------------------------------
sub get_empty_pager
{
    my $self = shift;
    my $C = shift;
    my $cgi = shift;

    my $pager_count = 0;
    my $pager = $self->do_paging($C, $cgi, $pager_count);

    return $pager;
}


# ---------------------------------------------------------------------


=item do_paging

Description

=cut

# ---------------------------------------------------------------------
sub do_paging
{
    my $self = shift;
    my ($C, $cgi, $total_count) = @_;
    
    my $config = $C->get_object('MdpConfig');
    my $records_per_page = $config->get('default_records_per_page');
    my $current_page = 1;
    
    if (defined $cgi->param('sz'))
    {
        my $recs_per_page = $cgi->param('sz');
        my $max = $config->get('max_records_per_page');
        if (! defined ($ENV{'HT_DEV'}))
        {
            ASSERT($recs_per_page <= $max, qq{Requested page size: $recs_per_page greater than max $max});
        }
        $records_per_page = $cgi->param('sz');
    }

    if (defined $cgi->param('pn'))
    {
        $current_page = $cgi->param('pn'); 
    }
    
    my $pager = Data::Page->new();
    
    $pager->total_entries($total_count);
    $pager->entries_per_page($records_per_page);
    $pager->current_page($current_page);
    
    return $pager;
}


# ---------------------------------------------------------------------
1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu
Tom Burton-West  University of Michigan, tburtonw@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

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

