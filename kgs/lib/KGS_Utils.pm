package KGS_Utils;


use strict;

use Encode;
use DBI;
use Mail::Mailer;

use Utils;
use Context;
use MdpConfig;

use KGS_Db;


# ---------------------------------------------------------------------

=item adjust_url

Description

=cut

# ---------------------------------------------------------------------
sub adjust_url {
    my $url = shift;

    if ($ENV{AUTH_TYPE} eq 'shibboleth' && Utils::is_cosign_active()) {
        $url =~ s,/cgi,/shcgi,g;
    }
    if (defined $ENV{AUTH_TYPE}) {
        $url =~ s,^http(:|%3A),https$1,;
    }
    
    return $url;
}

sub get_client_supported_params {
    return [ @{ get_client_req_params() }, @{ get_client_opt_params() } ];
}

sub get_client_req_params {
    return [ qw(name org email) ];
}

sub get_client_req_param_tests {
    return {
            name  => {
                      regexp => qr/^[a-zA-Z0-9- ]+$/,
                      msg    => 'Name may contain only spaces, letters: a-z, A-Z, digits: 0-9 and "-"',
                     },
            org   => {
                      regexp => qr/^[a-zA-Z0-9- ]+$/,
                      msg    => 'Organization name may contain only spaces, letters: a-z, A-Z, digits: 0-9 and "-"',
                     },
            email => {
                      # from http://www.regular-expressions.info/email.html
                      regexp => qr/^[A-Za-z0-9._%+-]+\@[A-Za-z0-9.-]+\.[A-Za-z]{2,4}$/,
                      msg    => 'Email address is not well-formed.',
                     },
           };
}

sub get_client_opt_params {
    return [ qw(debug) ];
}

# ---------------------------------------------------------------------

=item make_client_data

Description

=cut

# ---------------------------------------------------------------------
sub make_client_data {
    my ($Q, $supported) = @_;
    
    my $cd;
    foreach my $p ($Q->param) {
        if (grep(/^$p$/, @$supported)) {
            $cd->{$p} = $Q->param($p);
        }
    }
    
    return $cd;
}

# ---------------------------------------------------------------------

=item make_empty_client_data

Description

=cut

# ---------------------------------------------------------------------
sub make_empty_client_data {
    my $supported = shift;
    my $injected = shift;
    
    my $cd;
    foreach my $p (@$supported) {
        $cd->{$p} = ' ';
    }
    foreach my $i (keys %$injected) {
        $cd->{$i} = $injected->{$i};
    }
    
    return $cd;
}

# ---------------------------------------------------------------------

=item remake_client_data

Description

=cut

# ---------------------------------------------------------------------
sub remake_client_data {
    my ($C, $Q, $dbh, $access_key, $optional) = @_;
    
    my $client_data = KGS_Db::get_client_data_by_access_key($dbh, $access_key);
    
    foreach my $p ($Q->param) {
        if (grep(/^$p$/, @$optional)) {
            $client_data->{$p} = $Q->param($p);
        }
    }
    
    return $client_data;
}


# ---------------------------------------------------------------------

=item kgs_clean_cgi

Description

=cut

# ---------------------------------------------------------------------
sub kgs_clean_cgi {
    my $cgi = shift;

    foreach my $p ($cgi->param) {
        my @vals = $cgi->param($p);
        my @newvals = ();
        foreach my $v (@vals) {
            $v = Encode::decode_utf8($v);
            Utils::trim_spaces(\$v);
            push(@newvals, $v) if ($v);
        }
        $cgi->param($p, @newvals);
    }
}

# ---------------------------------------------------------------------

=item email_something

Description

=cut

# ---------------------------------------------------------------------
sub email_something {
    my ($C, $to_addr, $from_addr, $subject, $body_ref) = @_;

    my $mailer = new Mail::Mailer('sendmail', ('-t', '-f hathitrust-system@umich.edu'));
    $mailer->open({
                   'To'       => $to_addr,
                   'From'     => $from_addr,
                   'Subject'  => $subject,
                  });
    print $mailer($$body_ref);
    $mailer->close;
}

# ---------------------------------------------------------------------

=item Name 

Description

=cut

# ---------------------------------------------------------------------
sub pluralize {
    my $s = shift;
    my $ct = shift;
    
    if (($ct == 0) || ($ct > 1)) {
        $s .= 's';
    }
    return $s;
}


1;


__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2011 ©, The Regents of The University of Michigan, All Rights Reserved

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
