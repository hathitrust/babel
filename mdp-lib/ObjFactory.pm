package ObjFactory;


=head1 NAME

ObjFactory (of)

=head1 DESCRIPTION

This class provides object creation functionality allowing clients to
instantiate objects of various classes dynamically given a class name
parameter.

=head1 VERSION

$Id: ObjFactory.pm,v 1.4 2008/05/21 20:17:53 pfarber Exp $

=head1 SYNOPSIS

my $of = new ObjFactory;

my %of_attrs = (
                'class_name' => 'Foo::Bar',
                'parameters' => {'C' => $C},
               );

my $foo_bar = $of->create_instance($C, \%of_attrs);


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

use Context;
use Utils;


sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;

    return $self;
}


# ---------------------------------------------------------------------

=item create_instance

Instantiate the class

=cut

# ---------------------------------------------------------------------
sub create_instance {
    my $self = shift;

    my ($C, $attr_ref) = @_;

    my $class_name = $$attr_ref{'class_name'};
    my $instance_param_hashref = $$attr_ref{'parameters'};

    ASSERT($class_name, qq{Missing class_name in ObjFactory::create_instance});
    ASSERT($instance_param_hashref, qq{Missing instance param in ObjFactory::create_instance});

    # Instantiate the class
    my $instance;
    eval "require $class_name";
    ASSERT(!$@, qq{Error compiling package for class="$class_name": $@} );

    eval {
        $instance = $class_name->new($instance_param_hashref);
    };
    ASSERT(!$@, qq{Error instantiating class="$class_name": $@} );

    return $instance;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
