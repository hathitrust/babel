package API::HTD::HCodes;

=head1 NAME

API::HTD:HCodes

=head1 DESCRIPTION

This package contains routines that compute the authorization code
that corresponds to the values of basic_access and extended_access
required for a user to have access to a given resource.

    Bitfield encoding for basic_access|extended_access in least
    significant byte of authorization code.

     pdf_ebm:                   allow PDF access for Expressnet/EBM
     raw_archival_data:         allow raw TIFF JP2 images
     unwatermarked_derivatives: allow suppressed watermarking for derivatives
     zip:                       allow download zip package
     nonfree:                   allow access to basic_access=nonfree
     noaccess:                  allow access to basic_access=noaccess (attr=nobody)
     free:                      allow access to basic_access=free

    NOTE: We assume that a higher basic_access level implies access is
    allowed to resources requiring only a lower level.

                                          bit
                                          7 6 5 4 3 2 1 0
                                          | | | | | | | |
    extended: unwatermarked_derivatives --+ | | | | | | |
    extended: raw_archival_data ------------+ | | | | | |
    extended: pdf_ebm ------------------------+ | | | | |
    extended: zip ------------------------------+ | | | |
              unused -----------------------------+ | | |
       basic: noaccess -----------------------------+ | |
       basic: nonfree --------------------------------+ |
       basic: free -------------------------------------+


=head1 SYNOPSIS

Coding example

=head1 METHODS

=over 8

=cut

use strict;
use warnings;

my $basic_access_name2bit_map =
  {
   noaccess => 2,
   nonfree => 1,
   free => 0,
  };

my $extended_access_name2bit_map =
  {
   unwatermarked_derivatives => 7,
   raw_archival_data => 6,
   pdf_ebm => 5,
   zip => 4,
  };

my $basic_access_bit2name_map = { reverse %$basic_access_name2bit_map };
my $extended_access_bit2name_map = { reverse %$extended_access_name2bit_map };

my $max_decimal_authorization_code = 247; # 11110111b - see pod above


# ---------------------------------------------------------------------

=item get_extended_access_combination, genMask

Combinations of extended_access values based on printSubset and
genMask due to http://stackoverflow.com/users/2533756/aks @
http://stackoverflow.com/questions/994235/how-can-i-generate-all-subsets-of-a-list-in-perl

=cut

# ---------------------------------------------------------------------
my $set     = [ values %$extended_access_name2bit_map ];
my $bitMask = [ 0, 0, 0, 0 ]; # Same size as @set, initially filled with zeroes

sub get_extended_access_combination {
  my ($bitMask, $set) = @_;

  my @combo = ();

  for (0 .. @$bitMask-1) {
    push(@combo, $extended_access_bit2name_map->{$set->[$_]}) if $bitMask->[$_] == 1;
  }

  return @combo;
}

sub genMask {
  my ($bitMask, $set) = @_;

  my $i;
  for ($i = 0; $i < @$set && $bitMask->[$i]; $i++) {
    $bitMask->[$i] = 0;
  }

  if ($i < @$set) {
    $bitMask->[$i] = 1;
    return 1;
  }

  return 0;
}

# ---------------------------------------------------------------------

=item parse_access_type

Decompose access_type of the form basic_access(-extended_access)*

=cut

# ---------------------------------------------------------------------
sub parse_access_type {
    my $access_type = shift;

    my ($basic_access, @extended_access) = split('-', $access_type);

    return ($basic_access, @extended_access);
}

# ---------------------------------------------------------------------

=item __get_code_helper

Description

=cut

# ---------------------------------------------------------------------
sub __get_code_helper {
    my ($code_ref, $extended_access_ref, $restricted_only, $full) = @_;

    foreach my $basic_access (keys %$basic_access_name2bit_map) {
        if ($restricted_only) {
            next if ($basic_access eq 'free') && (scalar @$extended_access_ref == 0);
        }

        my ($authorization_code, $bitstring) = get_authorization_code($basic_access, @$extended_access_ref);
        my $extended_access = join('-', @$extended_access_ref);

        if ($full) {
            push(@$code_ref, { basic => $basic_access, extend => $extended_access, code => $authorization_code, bits => $bitstring });
        }
        else {
            push(@$code_ref, $authorization_code);
        }
    }
}

# ---------------------------------------------------------------------

=item get_all_authorization_codes

Generate the full list of decimal authorization codes and those that
equate to some restriction for security checking in htdmonitor.

=cut

# ---------------------------------------------------------------------
sub get_all_authorization_codes {
    my $restricted_only = shift;
    my $full = shift;

    my @codes = ();

    while ( genMask($bitMask, $set) ) {
        my @extended_access = get_extended_access_combination($bitMask, $set);
        __get_code_helper(\@codes, \@extended_access, $restricted_only, $full);
    }
    # handle no extended_access
    my @null_extended_access = ();
    __get_code_helper(\@codes, \@null_extended_access, $restricted_only, $full);

    return @codes;
}


# ---------------------------------------------------------------------

=item get_authorization_code

Return the decimal number that encodes the supplied basic_access and
extended_access values.

=cut

# ---------------------------------------------------------------------
sub get_authorization_code {
    my ($basic_access, @extended_access) = @_;

    my @bitvector = (0) x 8; # 8 bits

    # higher basic_access implies lower basic_access, e.g. access to
    # nonfree grants access to free
    if ( grep(/^$basic_access$/, keys %$basic_access_name2bit_map) ) {
        if ($basic_access eq 'noaccess') {
            $bitvector[$basic_access_name2bit_map->{free}] = 1;
            $bitvector[$basic_access_name2bit_map->{nonfree}] = 1;
            $bitvector[$basic_access_name2bit_map->{noaccess}] = 1;
        }
        elsif ($basic_access eq 'nonfree') {
            $bitvector[$basic_access_name2bit_map->{free}] = 1;
            $bitvector[$basic_access_name2bit_map->{nonfree}] = 1;
        }
        else {
            $bitvector[$basic_access_name2bit_map->{free}] = 1;
        }
    }
    else {
        die "FATAL: invalid basic_access=$basic_access in get_authorization_code()";
    }


    foreach my $extended_access_value (@extended_access) {
        if ( grep(/^$extended_access_value$/, keys %$extended_access_name2bit_map) ) {
            $bitvector[$extended_access_name2bit_map->{$extended_access_value}] = 1;
        }
        else {
            die "FATAL: invalid extended_access=$extended_access_value in get_authorization_code()";
        }
    }

    my $bitstring = join('', reverse @bitvector);
    my $authorization_code = oct("0b" . $bitstring);
    if ($authorization_code > $max_decimal_authorization_code) {
        die "FATAL: authorization_code=$authorization_code exceeds maximum: $max_decimal_authorization_code in get_authorization_code()";
    }

    return ($authorization_code, $bitstring);
}

# ---------------------------------------------------------------------

=item get_access_type_from_code

code -> basic_access(-extended_access)*

=cut

# ---------------------------------------------------------------------
sub get_access_type_from_code {
    my $code = shift;

    if ($code > $max_decimal_authorization_code) {
        die "FATAL: code=$code exceeds maximum: $max_decimal_authorization_code in get_access_type_from_code()";
    }

    my $bitstring = sprintf("%b", $code);
    my @bitvector = reverse split('', $bitstring);

    my $bit = 0;
    my $access_type = $basic_access_bit2name_map->{$bit} if $bitvector[$bit];
    $bit++;
    $access_type = $basic_access_bit2name_map->{$bit} if $bitvector[$bit];
    $bit++;
    $access_type = $basic_access_bit2name_map->{$bit} if $bitvector[$bit];
    $bit += 2; # skip "unused"

    for (@bitvector) {
        $access_type .= '-' . $extended_access_bit2name_map->{$bit} if $bitvector[$bit];
        $bit++;
    }

    return ($access_type, $bitstring);
}

1;

__END__

=back

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2014 ©, The Regents of The University of Michigan, All Rights Reserved

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
