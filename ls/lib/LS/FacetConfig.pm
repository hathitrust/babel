package LS::FacetConfig;


=head1 NAME

LS::FacetConfig;

=head1 DESCRIPTION

Reads config file (fconfig.pl) and sets appropriate member data

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

    # turn off strict
    do 
    {
        no strict;
	$self->__set_date_type($date_type);
	$self->__set_facet_order(\@facet_order);
        $self->__set_facet_mapping($facet_to_label_map);
        $self->__set_facet_limit($facet_limit);
        $self->__set_facet_initial_show($facet_initial_show);
        $self->__set_rel_weights($rel_weights_A,'A');
	$self->__set_rel_weights($rel_weights_B,'B');

        $self->__set_param_2_solr_map($param_2_solr_map);
        #advanced search additions
        $self->__set_field_2_display($field_2_display);
        $self->__set_field_order($field_order);
        $self->__set_op_order($op_order);
        $self->__set_default_fields($default_fields);
        $self->__set_default_anyall($default_anyall);
        $self->__set_anyall_2_display($anyall_2_display);
        $self->__set_yop_default($yop_default);
        $self->__set_yop_order($yop_order);
        $self->__set_yop_map($yop_map);
        $self->__set_yop_input_order($yop_input_order);
        $self->__set_yop2label($yop2label);
        $self->__set_yop2name($yop2name);
        $self->__set_map2han($map2han);
        $self->__set_format_list($formats_list);
        $self->__set_language_list($language_list);
    };
        
} 


# ---------------------------------------------------------------------

sub __set_map2han
{
    my $self = shift;
    my $map2han = shift;
    $self->{'map2han'} = $map2han;
}

sub get_map2han
{
    my $self = shift;
    return    $self->{'map2han'};
}


# ---------------------------------------------------------------------
 
#Advanced Search


# ---------------------------------------------------------------------
sub __set_yop_default
{
    my $self = shift;
    my $yop_default = shift;
    $self->{'yop_default'} = $yop_default;
}
# ---------------------------------------------------------------------
sub __set_yop_order
{
    my $self = shift;
    my $yop_order = shift;
    $self->{'yop_order'} = $yop_order;
}
# ---------------------------------------------------------------------
sub __set_yop_map
{
    my $self = shift;
    my $yop_map = shift;
    
    $self->{'yop_map'} = $yop_map;
}


# ---------------------------------------------------------------------
sub __set_yop_input_order
{
    my $self = shift;
    my $in = shift;
    
    $self->{'yop_input_order'} = $in;
}
# ---------------------------------------------------------------------
sub __set_yop2label
{
    my $self = shift;
    my $in= shift;
    
    $self->{'yop2label'} = $in;
}
# ---------------------------------------------------------------------
sub __set_yop2name
{
    my $self = shift;
    my $in = shift;
    
    $self->{'yop2name'} = $in;
}
# ---------------------------------------------------------------------
sub __set_language_list
{
    my $self = shift;
    my $language_list = shift;
    
    $self->{'language_list'} = $language_list;
}

# ---------------------------------------------------------------------
sub __set_format_list
{
    my $self = shift;
    my $formats_list = shift;
    
    $self->{'formats_list'} = $formats_list;
}


# ---------------------------------------------------------------------
sub __set_anyall_2_display
{
    my $self = shift;
    my $a2d = shift;
    
    $self->{'anyall_2_display'} = $a2d;
}

# ---------------------------------------------------------------------
sub __set_field_2_display
{
    my $self = shift;
    my $f2d = shift;
    
    $self->{'field_2_display'} = $f2d;
}

# ---------------------------------------------------------------------
sub __set_field_order
{
    my $self = shift;
    my $order = shift;
    
    $self->{'field_order'} = $order;
}

# ---------------------------------------------------------------------
sub __set_op_order
{
    my $self = shift;
    my $order = shift;
    
    $self->{'op_order'} = $order;
}
# ---------------------------------------------------------------------
sub __set_default_fields
{
    my $self = shift;
    my $fields = shift;
    
    $self->{'default_fields'} = $fields;
}

# ---------------------------------------------------------------------
sub __set_default_anyall
{
    my $self = shift;
    my $anyall = shift;
    
    $self->{'default_anyall'} = $anyall;
}
# ---------------------------------------------------------------------
# Facets
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
    my $AB = shift;
    $self->{'rel_weights'}->{$AB} = $rel_weights;
}
# ---------------------------------------------------------------------
sub get_rel_weights
{
    my $self = shift;
    my $AB = shift;
    return  $self->{'rel_weights'}->{$AB};
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
sub __set_date_type
{
    my $self = shift;
    my $date_type = shift;
    
    $self->{'date_type'} = $date_type;
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
    my $AB = shift;
    
    my $weights = $self->get_rel_weights($AB);
    ASSERT (defined($weights->{$field}),qq{no weights for $field field});
    return $weights->{$field};
}



# ---------------------------------------------------------------------

sub get_all_weights
{
   my $self = shift;
   my $AB = shift;
   #XXX
   return $self->{'rel_weights'}->{$AB}->{'all'};
   
}

# ---------------------------------------------------------------------


1;
