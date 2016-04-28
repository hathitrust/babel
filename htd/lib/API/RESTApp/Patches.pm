package API::RESTApp;

use CGI::PSGI;
use Data::Dumper;

sub run {
    my $self = shift;
    my $env = $API::HTD::env;

    $ENV{REST_APP_RETURN_ONLY} = 1;

    $self->{__defaultQuery} = $self->{__query} = CGI::PSGI->new($env);

    # Get resource.
    $self->preRun(); # A no-op by default.
    my $repr = $self->loadResource(@_);
    $self->postRun($repr); # A no-op by default.

    my @headers;
    my $type = $self->headerType;
    my $q = $self->query;

    if ($type eq 'redirect') {
        my %props = $self->header;
        $props{'-location'} ||= delete $props{'-url'} || delete $props{'-uri'};
        @headers = $q->psgi_header(%props);
    } elsif ($type eq 'header') {
        my %props = $self->header;
        my @other_props = ();
        # psgi_header chokes if the X- headers are in 
        # the start of the hash->array
        foreach my $key ( keys %props ) {
            next unless ( $key =~ m,^X-, );
            push @other_props, $key, $props{$key};
            delete $props{$key};
        }
        @headers = $q->psgi_header(%props);
        push @{ $headers[1] }, @other_props;
    } elsif ($type eq 'none') {
        Carp::croak("header_type of 'none' is not support by CGI::Application::PSGI");
    } else {
        Carp::croak("Invalid header_type '$type'");
    }

    # Plack will accept an arrayref, coderef or object (blessed
    # hashref). coderefs are passed without headers!!!
    use Scalar::Util;
    if (ref($repr) eq 'REF' ) {
        $repr = $$repr;
    }

    # put the return value in $API::HTD::RETVAL because
    # we can't get the return value from the CGI::Compile closure
    if (ref($repr) eq 'CODE') {
        # return $repr;
        $API::HTD::RETVAL = $repr;
    }
    elsif (ref($repr) eq 'SCALAR') {
        $repr = RefWriter->new($repr);
        $API::HTD::RETVAL = [ @headers, $repr ];
    }
    elsif (! Scalar::Util::blessed($repr)) {
        $repr = [ $repr ];
        $API::HTD::RETVAL = [ @headers, $repr ];
    }


    return [ @headers, $repr ];
}

package RefWriter;
sub new {
    my ($proto, $ref) = @_;
    my $class = ref($proto) ? ref($proto) : $proto;
    my $self = bless({ __ref => $ref, __written => 0 }, $class);
    return $self;
}
sub getline { my $self = shift;
    return undef if ( $$self{__written} );
    $$self{__written} = 1;
    return ${$$self{__ref}};
}
sub close { }

1;
