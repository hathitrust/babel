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
        $self->__set_rel_weights($rel_weights);
        $self->__set_param_2_solr_map($param_2_solr_map);
    };
        
} 

# ---------------------------------------------------------------------
sub __set_param_2_solr_map
{
    my $self = shift;
    my $map = shift;
    
    $self->{'param_2_solr_map'} = $map;
}
# ---------------------------------------------------------------------
sub get_param_2_solr_map
{
    my $self = shift;
    return  $self->{'param_2_solr_map'};
}

# ---------------------------------------------------------------------
sub __set_rel_weights
{
    my $self = shift;
    my $rel_weights = shift;
    
    $self->{'rel_weights'} = $rel_weights;
}
# ---------------------------------------------------------------------
sub get_rel_weights
{
    my $self = shift;
    return  $self->{'rel_weights'};
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
sub get_weights_for_field
{
    my $self = shift;
    my $field = shift;
    my $weights = $self->get_rel_weights;
    ASSERT (defined($weights->{$field}),qq{no weights for $field field});
    return $weights->{$field};
}



# ---------------------------------------------------------------------

sub get_all_weights
{
   my $self = shift;
   return $self->{'rel_weights'}->{'all'};
   
}

# ---------------------------------------------------------------------


1;
