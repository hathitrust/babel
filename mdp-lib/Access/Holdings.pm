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
    $held = ($constraint eq 'brlm') ? $holdings_data->{brlm_count} : $holdings_data->{copy_count};
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

=item id_is_held_API

Uses the Holdings item access API to determine if item `id` is held by `inst`.
User Agent `ua` is only intended for testing.

Calls `_query_item_access_api` which in turn calls `_query_api` if
the data is not recoverable from the transient session cache.

Returns two-element array of `(lock_id, held)`, in case of error `lock_id` is an
error message and `held` is 0.

=cut

# ---------------------------------------------------------------------
sub id_is_held_API {
    my ($C, $id, $inst, $ua) = @_;

    my $held = 0;
    my $lock_id = $id;

    if (DEBUG('held')) {
        $held = 1;
    }
    elsif (DEBUG('notheld')) {
        $held = 0;
    }
    else {
        my $ses = $C->get_object('Session', 1);
        if ( $ses && defined $ses->get_transient("held.$id") ) {
            ( $lock_id, $held ) = @{ $ses->get_transient("held.$id") };
            return ( $lock_id, $held );
        }
        ($lock_id, $held) = _query_item_access_api($C, $inst, $id, undef, $ua);
        $ses->set_transient("held.$id", [$lock_id, $held]) if ( $ses );
    }
    DEBUG('auth,all,held,notheld', qq{<h4>Holdings for inst=$inst id="$id": held=$held</h4>});
    return ( $lock_id, $held );
}

# ---------------------------------------------------------------------

=item id_is_held

Description

=cut

# ---------------------------------------------------------------------
sub id_is_held {
    my ($C, $id, $inst) = @_;

    if ($C->get_object('MdpConfig')->get('use_holdings_api')) {
      return id_is_held_API(@_);
    }

    my $held = 0;
    my $lock_id = $id;

    if (DEBUG('held')) {
        $held = 1;
    }
    elsif (DEBUG('notheld')) {
        $held = 0;
    }
    else {
        my $ses = $C->get_object('Session', 1);
        if ( $ses && defined $ses->get_transient("held.$id") ) { 
            ( $lock_id, $held ) = @{ $ses->get_transient("held.$id") }; 
            return ( $lock_id, $held );
        }

        my $dbh = $C->get_object('Database')->get_DBH($C);

        my $sth;

        # The lock ID depends on the item format:
        # (the lock id is destined for storage in pt_exclusivity_ng
        #   single part monograph (cluster_id present, no n_enum): cluster_id (API version: concatenated OCNs)
        #   multi-part monograph (cluster_id and n_enum both present): cluster_id:n_enum (API version: concatenated OCNs + n_enum)
        #      may need to truncate each to 50 because edge cases, don't overthink
        #   serial (cluster id will not be present): volume_id
        #
        # Fallback in case of API issue: not available, do not 500
        my $SELECT_clause = <<EOT;
          SELECT lock_id,
                 sum(copy_count)
          FROM holdings_htitem_htmember h 
          JOIN ht_institutions t ON h.member_id = t.inst_id
          WHERE h.volume_id = ? AND mapto_inst_id = ?
          GROUP BY h.volume_id, mapto_inst_id;
EOT
        eval {
            $sth = DbUtils::prep_n_execute($dbh, $SELECT_clause, $id, $inst);
        };
        if (my $err = $@) {
            return ($err, 0);
        }

        my @row = $sth->fetchrow_array();
        ( $lock_id, $held ) = @row if ( scalar @row );
        $ses->set_transient("held.$id", [$lock_id, $held]) if ( $ses );
    }
    DEBUG('auth,all,held,notheld', qq{<h4>Holdings for inst=$inst id="$id": held=$held</h4>});

    return ( $lock_id, $held );
}

# ---------------------------------------------------------------------

=item id_is_held_and_BRLM_API

Uses the Holdings item access API to determine if item `id` is held by `inst`,
and qualifies as brittle/lost/missing. User Agent `ua` is only intended
for testing.

Calls `_query_item_access_api` which in turn calls `_query_api` if
the data is not recoverable from the transient session cache.

Returns two-element array of `(lock_id, held)`, in case of error `lock_id` is an
error message and `held` is 0.

=cut

# ---------------------------------------------------------------------
sub id_is_held_and_BRLM_API {
    my ($C, $id, $inst, $ua) = @_;

    my $held = 0;
    my $lock_id = $id;

    if (DEBUG('heldb')) {
        $held = 1;
    }
    elsif (DEBUG('notheldb')) {
        $held = 0;
    }
    else {
        my $ses = $C->get_object('Session', 1);
        if ( $ses && defined $ses->get_transient("held.brlm.$id") ) {
            ( $lock_id, $held ) = @{ $ses->get_transient("held.brlm.$id") };
            return ( $lock_id, $held );
        }
        ($lock_id, $held) = _query_item_access_api($C, $inst, $id, 'brlm', $ua);
        $ses->set_transient("held.brlm.$id", [$lock_id, $held]) if ( $ses );
    }
    DEBUG('auth,all,heldb,notheldb', qq{<h4>BRLM holdings for inst=$inst id="$id": held=$held</h4>});

    return ( $lock_id, $held );
}

# ---------------------------------------------------------------------

=item id_is_held_and_BRLM

Description

=cut

# ---------------------------------------------------------------------
sub id_is_held_and_BRLM {
    my ($C, $id, $inst) = @_;

    if ($C->get_object('MdpConfig')->get('use_holdings_api')) {
      return id_is_held_and_BRLM_API(@_);
    }

    my $held = 0;
    my $lock_id = $id;

    if (DEBUG('heldb')) {
        $held = 1;
    }
    elsif (DEBUG('notheldb')) {
        $held = 0;
    }
    else {
        my $ses = $C->get_object('Session', 1);
        if ( $ses && defined $ses->get_transient("held.brlm.$id") ) { 
            ( $lock_id, $held ) = @{ $ses->get_transient("held.brlm.$id") }; 
            return ( $lock_id, $held );
        }

        my $dbh = $C->get_object('Database')->get_DBH($C);

        my $sth;
        my $SELECT_clause = qq{SELECT lock_id, access_count FROM holdings_htitem_htmember h WHERE h.volume_id = ? AND member_id = ?};
        eval {
            $sth = DbUtils::prep_n_execute($dbh, $SELECT_clause, $id, $inst);
        };
        if ($@) {
            return 0;
        }

        my @row = $sth->fetchrow_array();
        ( $lock_id, $held ) = @row if ( scalar @row );
        $ses->set_transient("held.brlm.$id", [$lock_id, $held]) if ( $ses );
    }
    DEBUG('auth,all,heldb,notheldb', qq{<h4>BRLM holdings for inst=$inst id="$id": access_count=$held</h4>});

    # @OPB
    return ( $lock_id, $held );
}

# ---------------------------------------------------------------------

=item holding_institutions_API

Return arrayref of institutions holding `id`.

=cut

# ---------------------------------------------------------------------
sub holding_institutions_API {
  my ($C, $id, $ua) = @_;

  my $institutions = _query_item_held_by_api($C, $id, undef, $ua);
  DEBUG('auth,all,held,notheld', qq{<h4>Holding institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});
  return $institutions;
}

# ---------------------------------------------------------------------

=item holding_BRLM_institutions_API

Return arrayref of institutions holding `id` where `id` is brittle, lost, or missing.

=cut

# ---------------------------------------------------------------------
sub holding_BRLM_institutions_API {
  my ($C, $id, $ua) = @_;

  my $institutions = _query_item_held_by_api($C, $id, 'brlm', $ua);
  DEBUG('auth,all,held,notheld', qq{<h4>Holding (BRLM) institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});
  return $institutions;
}

# ---------------------------------------------------------------------

=item holding_institutions

Description

=cut

# ---------------------------------------------------------------------
sub holding_institutions {
    my ($C, $id) = @_;

    if ($C->get_object('MdpConfig')->get('use_holdings_api')) {
      return holding_institutions_API(@_);
    }

    my $dbh = $C->get_object('Database')->get_DBH($C);

    my $sth;
    my $SELECT_clause = qq{SELECT member_id FROM holdings_htitem_htmember WHERE volume_id=?};
    eval {
        $sth = DbUtils::prep_n_execute($dbh, $SELECT_clause, $id);
    };
    if ($@) {
        return [];
    }

    my $ref_to_arr_of_arr_ref = $sth->fetchall_arrayref([0]);

    my $inst_arr_ref = [];
    if (scalar(@$ref_to_arr_of_arr_ref)) {
        $inst_arr_ref = [ map {$_->[0]} @$ref_to_arr_of_arr_ref ];
    }
    DEBUG('auth,all,held,notheld', qq{<h4>Holding institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});

    return $inst_arr_ref;
}

# ---------------------------------------------------------------------

=item holding_BRLM_institutions

Description

=cut

# ---------------------------------------------------------------------
sub holding_BRLM_institutions {
    my ($C, $id) = @_;

    if ($C->get_object('MdpConfig')->get('use_holdings_api')) {
      return holding_BRLM_institutions_API(@_);
    }

    my $dbh = $C->get_object('Database')->get_DBH($C);

    my $sth;
    my $SELECT_clause = qq{SELECT member_id FROM holdings_htitem_htmember WHERE volume_id=? AND access_count > 0};
    eval {
        $sth = DbUtils::prep_n_execute($dbh, $SELECT_clause, $id);
    };
    if ($@) {
        return [];
    }

    my $ref_to_arr_of_arr_ref = $sth->fetchall_arrayref([0]);

    my $inst_arr_ref = [];
    if (scalar(@$ref_to_arr_of_arr_ref)) {
        $inst_arr_ref = [ map {$_->[0]} @$ref_to_arr_of_arr_ref ];
    }
    DEBUG('auth,all,held,notheld', qq{<h4>Holding (BRLM) institutions for id="$id": } . join(' ', @$inst_arr_ref) . q{</h4>});

    return $inst_arr_ref;
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
