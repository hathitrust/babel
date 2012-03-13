package KGS_Validate;

=head1 NAME

KGS_Pages

=head1 DESCRIPTION

This package provides the code to validate condition.

=head1 SYNOPSIS

=head1 METHODS

=over 8

=cut

use strict;

use CGI;

use Context;
use Database;
use Utils;
use MdpConfig;

use Keys;
use Signature;
use KGS_Db;
use KGS_Utils;
use KGS_Log;

use constant MAX_ATTEMPTED_REGISTRATIONS => 10;
use constant MAX_ACTIVE_REGISTRATIONS => 5;
use constant LINK_LIFETIME => 86400; # seconds in 24 hours 

# ---------------------------------------------------------------------

=item validate_form_params

Test validity of params server-side

=cut

# ---------------------------------------------------------------------
sub validate_form_params {
    my ($C, $client_data) = @_;

    my $name = $client_data->{name};
    my $org = $client_data->{org};
    my $email = $client_data->{email};

    my $valid = 1;
    my $errors;
    $errors->{name} = 1 if (! $client_data->{name});
    $errors->{org} = 1 if (! $client_data->{org});
    $errors->{email} = 1 if (! $client_data->{email});

    if (scalar keys %$errors) {
        $valid = 0;
    }

    LOG($C, qq{validate_form_params [valid=$valid]: name=$name org=$org email=$email});
    return ($valid, $errors);
}

# ---------------------------------------------------------------------

=item validate_max_registration_attempts

Prevent > MAX_ATTEMPTED_REGISTRATIONS for this email address

=cut

# ---------------------------------------------------------------------
sub validate_max_registration_attempts {
    my ($C, $dbh, $client_data) = @_;

    my $valid = 0;
    my $email = $client_data->{email};

    my $reg_ct = KGS_Db::count_client_registrations($C, $dbh, $email, 0);
    if ($reg_ct < MAX_ATTEMPTED_REGISTRATIONS) {
        $valid = 1;
    }

    LOG($C, qq{validate_max_registration_attempts [valid=$valid]: num=$reg_ct email=$email});
    return $valid;
}

# ---------------------------------------------------------------------

=item validate_max_active_registrations

Prevent > MAX_ACTIVE_REGISTRATIONS for this email address

=cut

# ---------------------------------------------------------------------
sub validate_max_active_registrations {
    my ($C, $dbh, $client_data) = @_;

    my $valid = 0;
    my $email = $client_data->{email};

    my $reg_ct = KGS_Db::count_client_registrations($C, $dbh, $email, 1);
    if ($reg_ct < MAX_ACTIVE_REGISTRATIONS) {
        $valid = 1;
    }
    
    LOG($C, qq{validate_max_active_registrations [valid=$valid]: num=$reg_ct email=$email});
    return $valid;
}

# ---------------------------------------------------------------------

=item validate_confirmation_link_timestamp

Description

=cut

# ---------------------------------------------------------------------
sub validate_confirmation_link_timestamp {
  my ($C, $cgi, $client_data) = @_;

  my $valid = 0;
  
  my $now = time;
  my $elapsed = -1;
  my $link_timestamp = $cgi->param('oauth_timestamp');
  if (defined $link_timestamp) {
      $elapsed  = $now - $link_timestamp;
      if ($elapsed < LINK_LIFETIME) {
          $valid = 1;
      }
  }

  LOG($C, qq{validate_confirmation_link_timestamp [valid=$valid]: elapsed=$elapsed});
  return $valid;
}

# ---------------------------------------------------------------------

=item validate_confirmation_replay

Description

=cut

# ---------------------------------------------------------------------
sub validate_confirmation_replay {
    my ($C, $dbh, $key_pair) = @_;
    
    my $access_key = $key_pair->token;
    my $valid = (! KGS_Db::access_key_is_active($C, $dbh, $access_key));

    LOG($C, qq{validate_confirmation_replay [valid=$valid]: access_key=$access_key});
    return $valid;
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
