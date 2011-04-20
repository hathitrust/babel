package LS::FacetConfig;


=head1 NAME

LS::FacetConfig;

=head1 DESCRIPTION


=head1 VERSION

$Id$

=head1 SYNOPSIS

$fconfig = new LS::FacetConfig(fconfig.pl);


=head1 METHODS

=over 8

=cut


BEGIN
{
    if ($ENV{'HT_DEV'})
    {
        require "strict.pm";
        strict::import();
    }
}




use Utils;

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

Initialize 

=cut

# ---------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
 
# XXX do we need context object?
#   my $C = shift;
    my $config_filename = shift;

    ASSERT(-e "$config_filename",
           qq{"Could not find config file $config_filename"});

    eval
    {
        require $config_filename;
    };
    ASSERT(!$@, qq{Invalid config file $config_filename. Error: $@});

    # turn of strict
    do 
    {
        no strict;
        $self->__set_facet_order(\@facet_order);
        $self->__set_facet_mapping($facet_to_label_map);
        $self->__set_facet_limit($facet_limit);
        $self->__set_facet_initial_show($facet_initial_show);
        
    };
        
    my $weights= $self->__read_yaml();
    $self->__set_weights($weights);    
}



# ---------------------------------------------------------------------
sub __set_facet_limit
{
    my $self = shift;
    my $facet_limit = shift;
    
    $self->{'facet_limit'} = $facet_limit;
}
# ---------------------------------------------------------------------
sub get_facet_limit
{
    my $self=shift;
    return $self->{'facet_limit'};
}

# ---------------------------------------------------------------------
sub __set_facet_initial_show
{
    my $self=shift;
    my $facet_initial_show = shift;
    $self->{'facet_initial_show'} = $facet_initial_show;
}

# ---------------------------------------------------------------------
sub get_facet_initial_show
{
    my $self = shift;
    return $self->{'facet_initial_show'};
}

# ---------------------------------------------------------------------
        

# ---------------------------------------------------------------------
#XXX we need to know location and name of yaml file!
sub __read_yaml
{
   my $self = shift;
   my $weights={};
   return ($weights);
   
}

# ---------------------------------------------------------------------
sub __set_weights
{
    my $self=shift;
    my $weights = shift;
    $self->{'weights'}={$weights};
}

# ---------------------------------------------------------------------
sub __set_facet_order
{
   my $self = shift;
   my $facet_order=shift;
   $self->{'facet_order'}= $facet_order;
}

# ---------------------------------------------------------------------
sub __set_facet_mapping
{
    my $self = shift;
    my $maphash  =shift;
    $self->{'facet_mapping'} = $maphash;
}


# ---------------------------------------------------------------------
sub get_facet_order
{
   my $self = shift;
   return $self->{facet_order};
}

# ---------------------------------------------------------------------
sub get_facet_mapping
{
   my $self = shift;
   return $self->{'facet_mapping'};
}
# ---------------------------------------------------------------------
sub get_all_weights
{
   my $self = shift;
}

# ---------------------------------------------------------------------
sub get_title_weights
{
   my $self = shift;
}

# ---------------------------------------------------------------------
sub get_author_weights
{
   my $self = shift;
}

# ---------------------------------------------------------------------
sub get_subject_weight
{
   my $self = shift;
}


1;
