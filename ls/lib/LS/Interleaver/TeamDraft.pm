package LS::Interleaver::TeamDraft;

=head1 NAME

LS::Interleaver::TeamDraft

=head1 DESCRIPTION

Implementation of the Team Draft Interleaving algorithm
based on what? lerot or yue sample code or what paper?

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
#use Utils;
use base qw(LS::Interleaver);


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

Initialize Search::Result object.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;

    # Subclass:
#    $self->AFTER_Result_initialize(@_);
}

# ---------------------------------------------------------------------
sub __get_interleaved
{
    my $self = shift;
    my $rs_a = shift;
    my $rs_b = shift;
    my @params = @_;
    my $rs_out=[];

    # first go down the list until entry [i] in a does not match b
    # i.e. dupes in head of list should not count or count equally!
    my @leading_dupes = get_leading_dupes(a b)

    
    # See if there is duplicated code in Balanced that could be moved to base class!
    
}



return 1;
