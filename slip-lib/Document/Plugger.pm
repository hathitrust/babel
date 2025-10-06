=head1 NAME

Plugger.pm

=head1 DESCRIPTION

This is not a package.  It is use'd into the namespace of a client
package to act as common code over the Document subclasses that have
plugins configured.

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use MdpConfig;
use Context;

# ---------------------------------------------------------------------

=item initialize_plugins

Use Class::MOP (perl 5 Meta Object Protocol) to introspect the methods
on this object created by its plugin(s).

Refer to Document/Plugins.txt

=cut

# ---------------------------------------------------------------------
sub initialize_plugins {
    my $self = shift;
    my $C = shift;

    $self->{_plugin_method_names} = [];

    my $config = $C->get_object('MdpConfig');
    my $class = ref $self;
    my $plugin_key = 'plugin_for_' . $class;

    if ($config->has($plugin_key)) {
        my @plugin_names = split(/,/, $config->get($plugin_key));
        my @plugins = map { $class . '::' . $_ } @plugin_names;

        if (scalar @plugins) {
            require Class::MOP;

            foreach my $pin (@plugins) {
                eval "require $pin";
                ASSERT(!$@, qq{Error compiling Plugin name="$pin": $@});
            }

            my $metaclass = Class::MOP::Class->initialize($class);
            my @plugin_method_names;
            my @all_methods = ( $metaclass->get_all_methods );
            foreach my $meth (@all_methods) {
                my $method_name = $meth->fully_qualified_name;
                push(@plugin_method_names, $method_name) if (grep(/PLG_/, $method_name));
            }
            $self->{_plugin_method_names} = [ @plugin_method_names ];
        }
    }
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
