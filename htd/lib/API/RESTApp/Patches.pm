package API::RESTApp;

use CGI::PSGI;
use Data::Dumper;

sub run {
    my $self = shift;
    my $env = $API::HTD::env;
    
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
        @headers = $q->psgi_header(-Status => 302, %props);
    } elsif ($type eq 'header') {
        my %props = $self->header;
        @headers = $q->psgi_header(%props);
    } elsif ($type eq 'none') {
        Carp::croak("header_type of 'none' is not support by CGI::Application::PSGI");
    } else {
        Carp::croak("Invalid header_type '$type'");
    }
    
    if ( ref($repr) eq 'SCALAR' ) {
        $repr = RefWriter->new($repr);
    } else {
        $repr = [ $repr ];
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