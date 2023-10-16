package PT::View;

use strict;

use base qw(View);

sub new {
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

sub read_template {
    my $self = shift;
    my ( $C, $ab ) = @_;

    my $template_name = $ab->get_action_template_name($C);
    unless ($template_name) {
        $$self{template_name} = undef;
        $$self{PIs}           = {};
        my $s = "";
        $$self{template_data_ref} = \$s;
    }
    else {
        $self->SUPER::read_template( $C, $ab );
    }
}
# ---------------------------------------------------------------------

=item output

Description: Override of base class for redirect.

=cut

# ---------------------------------------------------------------------
sub output
{
    my $self = shift;
    my $C = shift;
    my $content_type = $self->{content_type} || 'text/html';

    if ( exists($$self{output}) ) {
        my $output = $$self{output};
        my $ref = ref($output) ? $output : \$output;
        $self->output_HTTP($C, $ref, $content_type);
    }
    else
    {
        my $transformed_xml_ref = $self->_get_transformed_xml($C);
        $self->output_HTTP($C, $transformed_xml_ref, $content_type);
    }
}

sub output_HTTP {
    my $self = shift;
    my ( $C, $data_ref, $content_type ) = @_;
    my $status = get_response_status($C);

    if ( ref($data_ref) eq 'File::Temp' || ref($data_ref) eq 'CODE' ) {
        P_output_glob_data_HTTP( $C, $data_ref, $content_type, $status );
    }
    else {
        View::P_output_data_HTTP( $C, $data_ref, $content_type, $status );
    }
}

sub P_output_glob_data_HTTP {
    my ( $C, $data_ref, $content_type, $status ) = @_;

    $content_type = 'text/plain'
      if ( !$content_type );

    $status = 200 unless ($status);

    my $charset = 'UTF-8';

    Utils::add_header( $C,
        'Content-type' => qq{$content_type; charset=$charset} );

    my $headers_ref = $C->get_object('HTTP::Headers');

    print STDOUT "Status: $status" . $CGI::CRLF;
    print STDOUT $headers_ref->as_string($CGI::CRLF);
    print STDOUT $CGI::CRLF;

    if ( ref($data_ref) eq 'CODE' ) {
        $data_ref->();
        return;
    }

    while ( my $line = <$data_ref> ) {
        print STDOUT $line;
    }
}

sub get_response_status {
    my ($C) = @_;
    if ( my $resp = $C->get_object( 'HTTP::Response', 1 ) ) {
        return $resp->code;
    }
    return 200;
}

1;