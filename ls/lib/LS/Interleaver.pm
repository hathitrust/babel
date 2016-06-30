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

sub get_debug_data
{
    my $self = shift;
    return $self->{'debug_data'}
}

sub set_debug_data
{
    my $self = shift;
    my $data = shift;
    $self->{'debug_data'} = $data;
}



sub get_random_seed
{
    my $self= shift;
    return $self->{'seed'};
}


#XXX Think about whether seed should be session based or ip + query based.
# i.e. same person does same query next day
# vs  same person does same query on another computer
#  Just query and num found or query + facets + any other limits etc?

sub set_random_seed
{
    my $self=shift;
    my $C = shift;
    my $B_Q = shift;  #query object ?  We can get all rel parms here
    my $num_found = shift;
        
    my $cgi = $C->get_object('CGI');

    # OK do we need only the session and q1 param or all relevant result params?
    # better to use correct parts of Solr query
    # TODO: use $B_Q
    #XXX for now use just the query string
    my $query_string = $cgi->param('q1'). $cgi->param('q2'). $cgi->param('q3') . $cgi->param('q4');

    #normalize query
    # remove whitespace?
    my $query=$query_string;
    my $session_id = $C->get_object('Session')->get_session_id();
    my $seed =get_seed($query, $session_id, $num_found);
    $self->{'seed'} = $seed;
}


#XXX temporary subs to be replaced/refactors
#this function should get a different number for each different query
# lets make sure seed is less than max size of int maybe 30,000 is safe?

sub get_seed
{
    my $query     = shift;
    my $session   = shift;
    my $num_found = shift;
    
    #XXX TODO  check if seed for this query/session is cached otherwise calculate it

    #XXX should we separate getting number from query due to possible long queries with utf8 or
    # is mod 10000 sufficient to get minimal collisions
    my $string= $query . $session . $num_found;
    my $seed = get_number_from_string($string);
    return $seed;    
}


sub get_number_from_string
{
    my $string = shift;
    #remove multiple spaces and leading/trailing spaces
    $string=~s/\s+/ /g;
    $string=~s/^\s+//g;
    $string=~s/\s+$//g;
    
    my $num=0;
    
    my @chars=split(//,$string);
    foreach my $char (@chars)
    {
	$num += ord($char);
#	print " $char :\t$num\n";
    }
    if ($num > 10000)
    {
#	print "\n===\nDEBUG $num\n==\n";
	$num = $num % 10000;
    }
    return $num;
}




return 1;
