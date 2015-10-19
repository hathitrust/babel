package LS::Interleaver;

=head1 NAME

LS::Interleaver

=head1 DESCRIPTION

Abstract class for interleaving two result sets

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;

#use Utils;


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
sub get_interleaved
{
    my $self = shift;
    my $start = shift ;   # for balanced interleave choice is (random|fixed)
    my $rs_A = shift;
    my $rs_B = shift;
    
    ASSERT(0, qq{get_interleaved() in __PACKAGE__ is pure virtual});
#    my $rs_interleaved;
 #   return $rs_interleaved;
    
    
}
return 1;
