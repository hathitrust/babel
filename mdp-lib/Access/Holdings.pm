package Access::Holdings;

=head1 NAME

Access::Holdings;

=head1 DESCRIPTION

This package provides an interface to the Holdings Database tables
(mdp-holdings).

During updates to the PHDB, tables can be inaccessible. We return
held=0 if there are assertion failures in this case assuming that
this only affects a diminishingly small number of cases, rather that
affecting every user with an assertion failure.

=head1 SYNOPSIS

=head1 METHODS

=over 8

=cut

use Context;
use Data::Dumper;
use Utils;
use DbUtils;
use Debug::DUtils;
use HTTP::Request;
use Utils::Logger;

# Generate a lock id string destined for storage in `ht.pt_exclusivity_ng.lock_id`
# The lock ID depends on the item format:
#   single part monograph (cluster_id present, no n_enum): concatenated OCNs
#   multi-part monograph (cluster_id and n_enum both present): concatenated OCNs + : + n_enum)
#   serial (cluster id will not be present): volume_id
# Example usage: generate_lock_id('mdp.001', 'mpm', 'v.1', 1001, 1002);
# > '1001-1002:v.1'
# For OCNs + n_enum we reserve 20 characters for the OCNs, then add ': and the n_enum and
# rtrim so we can fit in the VARCHAR(100)

# 5-second timeout. Can we go lower?
use constant HOLDINGS_API_TIMEOUT => 5;
use constant LOCK_ID_MAX_LENGTH => 100;
use constant LOCK_ID_OCNS_LENGTH => 20;
our $ITEM_ACCESS_ENDPOINT = '/v1/item_access';
our $ITEM_HELD_BY_ENDPOINT = '/v1/item_held_by';

# Map _query_item_access_api constraint to field returned by API
my %ITEM_ACCESS_DATA_MAP = (
  '' => 'copy_count',
  'brlm' => 'brlm_count',
  'current' => 'currently_held_count'
);

sub generate_lock_id {
  my $id     = shift;
  my $format = shift;
  my $n_enum = shift || '';
  my @ocns   = sort @_;

  my $lock_id = '';
  if ($format eq 'spm') {
    $lock_id = join('-', @ocns);
  } elsif ($format eq 'mpm') {
    $lock_id = join('-', @ocns);
    if (length($lock_id) > LOCK_ID_OCNS_LENGTH) {
      $lock_id = substr($lock_id, 0, LOCK_ID_OCNS_LENGTH);
    }
    $lock_id .= ':' . $n_enum;
  } elsif ($format eq 'ser') {
    $lock_id = $id;
  } else {
    die "unknown format in generate_lock_id($id, $format, ...)";
  }
  if (length($lock_id) > LOCK_ID_MAX_LENGTH) {
    $lock_id = substr($lock_id, 0, LOCK_ID_MAX_LENGTH);
  }
  return $lock_id;
}

# Query one of the Holdings API endpoints
sub _query_api {
  my $C        = shift;
  my $endpoint = shift;
  my $ua       = shift || LWP::UserAgent->new;

  my %params = @_;
  # Remove any unnecessary undefs from the parameters
  # (mainly to avoid sending `constraint=` with empty value).
  foreach my $key (keys %params) {
    delete $params{$key} unless defined $params{$key};
  }
  my $url_string = $C->get_object('MdpConfig')->get('holdings_api_url') . $endpoint;
  my $uri = URI->new($url_string);
  $uri->query_form(\%params);
  my $req = HTTP::Request->new('GET' => $uri->as_string);
  $ua->timeout(HOLDINGS_API_TIMEOUT);
  my $res = $ua->request($req);
  if (!$res->is_success()) {
    # Newline at end of error message prevents `die` from appending file and line number,
    # which we do not need. Caller `chomp`s it before logging and using as lock id.
    my $err = sprintf "%s : %s : %s\n", $res->code, $res->message, $uri->as_string;
    die $err;
  }
  my $jsonxs = JSON::XS->new->utf8;
  return $jsonxs->decode($res->content);
}

# Internal wrapper for calling `_query_api` with `item_access` endpoint.
sub _query_item_access_api {
  my ($C, $inst, $id, $constraint, $ua) = @_;

  $constraint //= '';
  my $holdings_data;
  my $lock_id = $id;
  eval {
    $holdings_data = _query_api(
      $C,
      $ITEM_ACCESS_ENDPOINT,
      $ua,
      organization => $inst,
      item_id => $id
    );
    $lock_id = generate_lock_id(
      $id,
      $holdings_data->{format},
      $holdings_data->{n_enum},
      @{$holdings_data->{ocns}}
    );
    $held = $holdings_data->{copy_count};
    if (!defined $ITEM_ACCESS_DATA_MAP{$constraint}) {
      die "Unknown _query_item_access_api constraint '$constraint'";
    }
    $held = $holdings_data->{$ITEM_ACCESS_DATA_MAP{$constraint}};
  };
  if (my $err = $@) {
    log_error($err);
    return ($err, 0);
  }
  return ($lock_id, $held);
}

# Internal wrapper for calling `_query_api` with `item_held_by` endpoint.
sub _query_item_held_by_api {
  my ($C, $id, $constraint, $ua) = @_;

  my $holdings_data;
  my $institutions = [];
  eval {
    $holdings_data = _query_api(
      $C,
      $ITEM_HELD_BY_ENDPOINT,
      $ua,
      item_id => $id,
      constraint => $constraint
    );
    $institutions = $holdings_data->{organizations};
  };
  if (my $err = $@) {
    log_error($err);
    return [];
  }
  return $institutions;
}

# ---------------------------------------------------------------------

=item _id_is_held_core

Common code for id_is_held, id_is_held_and_BRLM, and id_is_currently_held.

Required additional parameter:
  `constraint` in {undef/'', 'brlm', 'current'}

Calls `_query_item_access_api` which in turn calls `_query_api` if
the data is not recoverable from the transient session cache.

Returns two-element array of `(lock_id, held)`, in case of error `lock_id` is an
error message and `held` is 0.

=cut

# ---------------------------------------------------------------------
sub _id_is_held_core {
    my ($C, $id, $inst, $constraint, $ua) = @_;

    my $held = 0;
    my $lock_id = $id;
    $constraint //= '';
    # debug suffix will be appended to {`held`, `notheld`}
    my $debug_suffixes = {'' => '', 'brlm' => 'b', 'current' => 'c'};
    my $held_debug_key = 'held' . $debug_suffixes->{$constraint};
    my $notheld_debug_key = 'notheld' . $debug_suffixes->{$constraint};
    if (DEBUG($held_debug_key)) {
        $held = 1;
    }
    elsif (DEBUG($notheld_debug_key)) {
        $held = 0;
    }
    elsif (!$inst) {
        $held = 0;
    }
    else {
        my $ses = $C->get_object('Session', 1);
        # Session key is of the form "held.[$constraint.]HTID"
        my $session_key = 'held';
        $session_key .= ".$constraint" if $constraint;
        $session_key .= ".$id";
        if ( $ses && defined $ses->get_transient($session_key) ) {
            ( $lock_id, $held ) = @{ $ses->get_transient($session_key) };
            return ( $lock_id, $held );
        }
        ($lock_id, $held) = _query_item_access_api($C, $inst, $id, $constraint, $ua);
        $ses->set_transient($session_key, [$lock_id, $held]) if ( $ses );
    }
    DEBUG(
      "auth,all,$held_debug_key,$notheld_debug_key",
      qq{<h4>Holdings for constraint=$constraint inst=$inst id="$id": held=$held</h4>}
    );
    return ( $lock_id, $held );
}

# ---------------------------------------------------------------------

=item id_is_held

Uses the Holdings item access API to determine if item `id` is held by `inst`.
User Agent `ua` is only intended for testing.

=cut

# ---------------------------------------------------------------------
sub id_is_held {
    my ($C, $id, $inst, $ua) = @_;

    return _id_is_held_core($C, $id, $inst, undef, $ua);
}

# ---------------------------------------------------------------------

=item id_is_held_and_BRLM

Uses the Holdings item access API to determine if item `id` is held by `inst`,
and qualifies as brittle/lost/missing. User Agent `ua` is only intended
for testing.

=cut

# ---------------------------------------------------------------------
sub id_is_held_and_BRLM {
    my ($C, $id, $inst, $ua) = @_;

    return _id_is_held_core($C, $id, $inst, 'brlm', $ua);
}

# ---------------------------------------------------------------------

=item id_is_currently_held

Uses the Holdings item access API to determine if item `id` is held by `inst`,
and is not lost, missing, or withdrawn. User Agent `ua` is only intended
for testing.

=cut

# ---------------------------------------------------------------------
sub id_is_currently_held {
    my ($C, $id, $inst, $ua) = @_;

    return _id_is_held_core($C, $id, $inst, 'current', $ua);
}

# ---------------------------------------------------------------------

=item holding_institutions

Return arrayref of institutions holding `id`.

=cut

# ---------------------------------------------------------------------
sub holding_institutions {
  my ($C, $id, $ua) = @_;

  my $institutions = _query_item_held_by_api($C, $id, undef, $ua);
  DEBUG('auth,all,held,notheld', qq{<h4>Holding institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});
  return $institutions;
}

# ---------------------------------------------------------------------

=item holding_BRLM_institutions

Return arrayref of institutions holding `id` where `id` is brittle, lost, or missing.

=cut

# ---------------------------------------------------------------------
sub holding_BRLM_institutions {
  my ($C, $id, $ua) = @_;

  my $institutions = _query_item_held_by_api($C, $id, 'brlm', $ua);
  DEBUG('auth,all,held,notheld', qq{<h4>Holding (BRLM) institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});
  return $institutions;
}

# Log Holdings API errors using common interface.
sub log_error {
  my $err = shift;

  chomp $err;
  Utils::Logger::__Log_struct($C, [['error', $err]], 'holdings_api_error_logfile', '___QUERY___', 'holdings_api');
}


1;


__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2011-12 ©, The Regents of The University of Michigan, All Rights Reserved

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
