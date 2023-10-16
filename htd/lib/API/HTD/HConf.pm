package API::HTD::HConf;


=head1 NAME

API::HTD::HConf

=head1 DESCRIPTION

This class encapsulates configuration management for htd[c].

=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

use base qw(Class::ErrorHandler);
use YAML::Any;


my $singleton;

sub new {
    if ( defined($singleton) ) {
        shift;
        die "FATAL: attempt to redefine API::HTD::HConf" if (scalar(@_));
    }
    else {
        my $class = shift;
        my $self = {};
        $singleton = bless $self, $class;

        $self->{_init_success} = $self->_initialize(@_);
    }
    return $singleton;
}

# ---------------------------------------------------------------------

=item _initialize

Initialize object.

=cut

# ---------------------------------------------------------------------
sub _initialize {
    my $self = shift;
    my $configArrRef = shift;
    
    # config
    my @configs;
    foreach my $conf_file (@$configArrRef) {
        my $config;
        eval {
            $config = YAML::Any::LoadFile($conf_file);
        };
        if ($@) {
            return $self->error("load error. cannot load $conf_file");
        }

        if (! defined($config)) {
            return $self->error("config not defined. cannot load $conf_file");
        }
        push(@configs, $config);
    }

    # Merge config into base config for totality
    my $merged_conf;
    foreach my $conf (@configs) {
        @$merged_conf{keys %$conf} = values %$conf;
    }
    
    $self->{_config} = $merged_conf;
    return 1;
}

# ---------------------------------------------------------------------

=item initSuccess

Description

=cut

# ---------------------------------------------------------------------
sub initSuccess {
    my $self = shift;
    return $self->{_init_success};
}


# ---------------------------------------------------------------------

=item getConfigVal 

Description

=cut

# ---------------------------------------------------------------------
sub getConfigVal {
    my $self = shift;
    my ($key, $sub_1_key, $sub_2_key, $sub_3_key, $sub_4_key, $sub_5_key) = @_;

    if ($sub_5_key) {
        return $self->{_config}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key}{$sub_4_key}{$sub_5_key};
    }
    elsif ($sub_4_key) {
        return $self->{_config}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key}{$sub_4_key};
    }
    elsif ($sub_3_key) {
        return $self->{_config}->{$key}{$sub_1_key}{$sub_2_key}{$sub_3_key};
    }
    elsif ($sub_2_key) {
        return $self->{_config}->{$key}{$sub_1_key}{$sub_2_key};
    }
    elsif ($sub_1_key) {
        return $self->{_config}->{$key}{$sub_1_key};
    }
    else {
        return $self->{_config}->{$key};
    }
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2012 ©, The Regents of The University of Michigan, All Rights Reserved

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
