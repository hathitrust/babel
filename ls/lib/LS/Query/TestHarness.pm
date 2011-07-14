package LS::Query::TestHarness;


use strict;

use Utils;
use Debug::DUtils;
use LS::FacetConfig;
use URI::Escape;

use base qw(Search::Query);


# ---------------------------------------------------------------------

=item AFTER_Query_initialize

Initialize LS::Query::FullText after base class.  Use Template
Design Pattern.

=cut

# ---------------------------------------------------------------------
sub AFTER_Query_initialize
{
    my $self = shift;
    my $C = shift;
    my $internal = shift;
    # dummy implementation
    return;
    
}
# ---------------------------------------------------------------------
1;
