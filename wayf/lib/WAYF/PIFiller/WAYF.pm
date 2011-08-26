package WAYF::PIFiller::WAYF;

=head1 NAME

WAYF::PIFiller::WAYF (pif)

=head1 DESCRIPTION

This class Search implementation of the abstract PIFiller class.

=head1 VERSION

$Id: WAYF.pm,v 1.12 2010/06/10 18:55:25 pfarber Exp $

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut

# MDP Modules
use base qw(PIFiller);

use Utils;
use Debug::DUtils;

# ---------------------------------------------------------------------

=item handle_GO_BACK_LINK_PI : PI_handler(GO_BACK_LINK)

Handler for GO_BACK_LINK

=cut

# ---------------------------------------------------------------------
sub handle_GO_BACK_LINK_PI
    : PI_handler(GO_BACK_LINK) {
    my ($C, $act, $piParamHashRef) = @_;

    my $target = $C->get_object('CGI')->param('target');
    if (! $target) {
        $target = $C->get_object('MdpConfig')->get('default_target');
    }

    return $target;
}

# ---------------------------------------------------------------------

=item handle_FRIEND_LOGIN_LINK_PI : PI_handler(FRIEND_LOGIN_LINK)

Handler for GO_BACK_LINK

=cut

# ---------------------------------------------------------------------
sub handle_FRIEND_LOGIN_LINK
    : PI_handler(FRIEND_LOGIN_LINK) {
    my ($C, $act, $piParamHashRef) = @_;

    my $friend_href = $C->get_object('CGI')->param('target');
    if (! $friend_href) {
        $friend_href = $C->get_object('MdpConfig')->get('default_friend_login');
    }
    else {
        $friend_href = Utils::url_over_SSL_to($friend_href);
    }

    return $friend_href;
}

# ---------------------------------------------------------------------

=item handle_IDP_LIST_PI : PI_handler(IDP_LIST)

Handler for IDP_LIST

=cut

# ---------------------------------------------------------------------
sub handle_IDP_LIST_PI
    : PI_handler(IDP_LIST) {
    my ($C, $act, $piParamHashRef) = @_;

    my $s;
    my $target = $C->get_object('CGI')->param('target');
    if (! defined($target)) {
        $target = $C->get_object('MdpConfig')->get('default_target');
    }
    else {
        $target = Utils::url_over_SSL_to($target);
    }
    
    # To preselect user's institution in list. Option 0 is in the xsl
    my $inst = $C->get_object('Auth')->get_institution_by_ip_address();
    foreach my $idp_key (sort 
                         {
                             $WAYF::IdpConfig::HT{$a}{'link_text'} cmp $WAYF::IdpConfig::HT{$b}{'link_text'}
                         } keys %WAYF::IdpConfig::HT) {
        
        my $development = 0;
        if (! $WAYF::IdpConfig::HT{$idp_key}{'enabled'}) {
            $development = 1;
            next unless ($ENV{'HT_DEV'});
        }

        my $site;
        my $L_target = $target;

        # COSIGN special-case: remove when all HathiTrust auth is Shib
        if ($WAYF::IdpConfig::HT{$idp_key}{'authtype'} eq 'shibboleth') {
            $L_target =~ s,/cgi/,/shcgi/,;
            $L_target = CGI::escape($L_target);
        }

        my $idp_url = $WAYF::IdpConfig::HT{$idp_key}{'template'};
        $idp_url =~ s,___HOST___,$ENV{'HTTP_HOST'},;
        $idp_url =~ s,___TARGET___,$L_target,;


        $site .= wrap_string_in_tag($idp_url, 'Url');
        my $link_text = $WAYF::IdpConfig::HT{$idp_key}{'link_text'} . ($development ? ' DEV' : '');
        $site .= wrap_string_in_tag($link_text, 'LinkText');
        if ($inst eq $idp_key) {
            $site .= wrap_string_in_tag('1', 'Selected');
        }
        $s .= wrap_string_in_tag($site, 'IdP_Site');
    }

    return $s;
}



1;


__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2010 ©, The Regents of The University of Michigan, All Rights Reserved

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

