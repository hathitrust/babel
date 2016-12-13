package WAYF::PIFiller::WAYF;

=head1 NAME

WAYF::PIFiller::WAYF (pif)

=head1 DESCRIPTION

This class WAYF implementation of the abstract PIFiller class.

=head1 SYNOPSIS

See coding example in base class Operation

=head1 METHODS

=over 8

=cut
use strict;
use warnings;

# MDP Modules
use base qw(PIFiller);

use Utils;
use Debug::DUtils;
use Institutions;

use WAYF::IdpConfig;


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
    
    # To preselect user's UNMAPPED institution in list. Option 0 in
    # menu is in the xsl
    my $HT_list = WAYF::IdpConfig::get_HathiTrust_Institutions_List($C);

    # Add UM shibboleth SSO in dev
    if ( defined $ENV{HT_DEV} ) {
        $HT_list->{uoms}->{authtype} = 'shibboleth';
        $HT_list->{uoms}->{enabled}  = 0;
        $HT_list->{uoms}->{name} = 'University of Michigan (Shibboleth)';
        $HT_list->{uoms}->{template} = 'https://___HOST___/Shibboleth.sso/uom?target=___TARGET___';
        $HT_list->{uoms}->{domain} = 'umich.edu';
        $HT_list->{uoms}->{us} = 1;
        $HT_list->{uoms}->{entityID} = 'https://shibboleth.umich.edu/idp/shibboleth';
    }    

    my $inst = $C->get_object('Auth')->get_institution_code($C) || 'notaninstitution';
    foreach my $idp_key (sort 
                         {
                             $HT_list->{$a}->{name} cmp $HT_list->{$b}->{name}
                         } keys %$HT_list) {
        
        my $add_to_list = 0;
        my $development = 0;
        if ( $HT_list->{$idp_key}->{enabled} == 0 ) {
            if ( defined $ENV{HT_DEV} ) {
                $add_to_list = 1;
                $development = 1;
            }
        }
        elsif ( $HT_list->{$idp_key}->{enabled} == 1 ) {
            $add_to_list = 1;
        }
        elsif ( $HT_list->{$idp_key}->{enabled} == 2 ) {
            $add_to_list = 0;
        }
        next unless ($add_to_list);

        my $site;
        my $L_target = $target;

        # COSIGN special-case: remove when all HathiTrust auth is Shib
        if ($HT_list->{$idp_key}->{authtype} eq 'shibboleth' && Utils::is_cosign_active()) {
            $L_target =~ s,/cgi/,/shcgi/,;
            $L_target = CGI::escape($L_target);
        }

        my $idp_url = $HT_list->{$idp_key}->{template};
        my $host = $ENV{'HTTP_HOST'} || 'localhost';
        $idp_url =~ s,___HOST___,$host,;
        $idp_url =~ s,___TARGET___,$L_target,;


        $site .= wrap_string_in_tag($idp_url, 'Url');
        my $link_text = $HT_list->{$idp_key}->{name} . ($development ? ' DEV' : '');
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

Copyright 2010-12 ©, The Regents of The University of Michigan, All Rights Reserved

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

