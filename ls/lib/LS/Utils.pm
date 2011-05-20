package LS::Utils;

=head1 NAME

LS::Utils;

=head1 DESCRIPTION

This is a package of shared utility subroutines with no application
specific dependencies.  Let's keep it that way.

=head1 SUBROUTINES

=over 8

=cut

use strict;

use CGI;

use Context;
use LS::Action;
use Utils;
# ---------------------------------------------------------------------

=item get_result_object_pair

Description

=cut

# ---------------------------------------------------------------------
sub get_result_object_pair {
    my $C = shift;
    my $act = shift;
    ASSERT(0,qq{Utils::get_result_object_pair should not be called});
    my %rs_hash;

    my $config = $C->get_object('MdpConfig');
    my $cgi = $C->get_object('CGI');

    my $search_result_data_hashref =
        $act->get_transient_facade_member_data($C, 'search_result_data');
        $rs_hash{'primary'} = $$search_result_data_hashref{'primary_result_object'};
        $rs_hash{'secondary'} = $$search_result_data_hashref{'secondary_result_object'};

    return \%rs_hash;
}

# ---------------------------------------------------------------------

=item get_full_text_result_object

Description

=cut

# ---------------------------------------------------------------------
sub get_full_text_result_object
{
    my $C = shift;
    my $act = shift;
    ASSERT(0,qq{Utils::get_full_text_result object should not be called});
    my $search_result_data_hashref =
        $act->get_transient_facade_member_data($C, 'search_result_data');
    my $rs = $$search_result_data_hashref{'full_text_result_object'};

    
    return $rs;
}

# ---------------------------------------------------------------------

=item get_all_result_object

Description

=cut

# ---------------------------------------------------------------------
sub get_all_result_object
{
    my $C = shift;
    my $act = shift;
    ASSERT(0,qq{Utils::get_all_text_result object should not be called});
    my $search_result_data_hashref =
        $act->get_transient_facade_member_data($C, 'search_result_data');
    my $rs = $$search_result_data_hashref{'all_result_object'};

    return $rs;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

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


