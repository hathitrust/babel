package Plack::Middleware::HTHTTPExceptions;
use strict;
use parent qw(Plack::Middleware::HTTPExceptions);
use Plack::Util::Accessor qw(error_pages);

use Carp ();
use Try::Tiny;
use Scalar::Util 'blessed';
use HTTP::Status ();
use Plack::MIME;

sub transform_error {
    my($self, $e, $env) = @_;

    my($code, $message);
    if (blessed $e && $e->can('as_psgi')) {
        return $e->as_psgi;
    }
    if (blessed $e && $e->can('code')) {
        $code = $e->code;
        $message =
            $e->can('as_string')       ? $e->as_string :
            overload::Method($e, '""') ? "$e"          : undef;
    } else {
        $code = $self->map_error($e);
        $env->{'psgi.errors'}->print($e);
    }

    if ($code !~ /^[3-5]\d\d$/) {
        die $e; # rethrow
    }


    if ($self->error_pages->{$code}) {
      return $self->error_page($env, $code, $e)
    } else {
      return $self->plain_response($env, $code, $e)
    }
}

sub map_error {
  my ($self, $e) = @_;

  return 404 if $e =~ /id not defined/;
  return 404 if $e =~ /Invalid document id provided/;
  return 404 if $e =~ /namespace not parsed/;

  return 400 if $e =~ /Action name not set/;
  return 400 if $e =~ /not a legal type of field/;
  return 400 if $e =~ /parameter missing or invalid/;
  return 400 if $e =~ /Requested page size.*greater than max/;
  return 400 if $e =~ /Invalid page view type/;

  return 500;
}

sub plain_response {
  my ($self, $env, $code, $e) = @_;

  my $message ||= HTTP::Status::status_message($code);

  my @headers = (
       'Content-Type'   => 'text/plain',
       'Content-Length' => length($message),
  );

  if ($code =~ /^3/ && (my $loc = eval { $e->location })) {
      push(@headers, Location => $loc);
  }

  return [ $code, \@headers, [ $message ] ];
}

sub error_page {
  my ($self, $env, $code, $e) = @_;

  my $filename = $$env{'SDRROOT'} . '/' . $self->error_pages->{$code};
  my ( $mime_type, $body ) = $self->read_error_file($filename);

  my $headers = [
    'Content-Type' => $mime_type,
    'Content-Length' => length($body)
  ];

  return [$code, $headers, [$$body]];

}

sub read_error_file {
  my ( $self, $filename ) = @_;
  my $mime_type = Plack::MIME->mime_type($filename);
  my $body;
  if ( $mime_type =~ m,^text/, ) {
    $body = Utils::read_file($filename, 1);
    my $app_name = Debug::DUtils::___determine_app();
    $$body =~ s,\./,/$app_name/common-web/,g;
  } else {
    open(my $in, $filename);
    binmode($in);
    my $tmp;
    while ( <$in> ) {
      $tmp .= $_;
    }
    close($in);
    $body = \$tmp;
  }
  return ( $mime_type, $body );
}

1;

__END__

=head1 NAME

Plack::Middleware::HTHTTPExceptions - Catch HTTP exceptions

=head1 SYNOPSIS

  use HTTP::Exception;

  my $app = sub {
      # ...
      HTTP::Exception::500->throw;
  };

  builder {
      enable "HTHTTPExceptions"
      $app;
  };

=head1 DESCRIPTION

Based on Plack::Middleware::HTHTTPExceptions.

=cut
