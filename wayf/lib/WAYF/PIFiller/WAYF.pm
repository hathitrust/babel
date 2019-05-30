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

use URI::Escape;

use WAYF::IdpConfig;

require "PIFiller/Common/Globals.pm";

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

    my $target = $C->get_object('CGI')->param('target');

    if (! $target) {
        $target = $C->get_object('MdpConfig')->get('default_target');
    }
    $target = Utils::url_over_SSL_to($target);
    $target = uri_escape($target);

    return qq{https://$ENV{HTTP_HOST}/Shibboleth.sso/Login?entityID=https://shibboleth.umich.edu/idp/shibboleth&amp;target=$target};
}

# ---------------------------------------------------------------------

=item handle_BACK_TO_REFERER_LINK_PI : PI_handler(BACK_TO_REFERER_LINK)

Handler for BACK_TO_REFERER_LINK

=cut

# ---------------------------------------------------------------------
sub handle_BACK_TO_REFERER_LINK
    : PI_handler(BACK_TO_REFERER_LINK) {
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    if ( my $referer_link = $cgi->referer() ) {
        return Utils::xml_escape_url_separators($referer_link);
    }
}

# ---------------------------------------------------------------------

=item handle_IDP_LIST_PI : PI_handler(IDP_LIST)

Handler for IDP_LIST

=cut

# ---------------------------------------------------------------------
sub handle_IDP_LIST_PI
    : PI_handler(IDP_LIST) {
    my ($C, $act, $piParamHashRef) = @_;

    # To preselect user's UNMAPPED institution in list. Option 0 in
    # menu is in the xsl
    my $HT_list = WAYF::IdpConfig::get_HathiTrust_Institutions_List($C);
    my $idp_keys = [ sort
                        {
                             $HT_list->{$a}->{name} cmp $HT_list->{$b}->{name}
                        } keys %$HT_list 
                  ];

    return _list2xml($C, $idp_keys, $HT_list, 0);
}

sub handle_SOCIAL_IDP_LIST_PI
    : PI_handler(SOCIAL_IDP_LIST) {
    my ($C, $act, $piParamHashRef) = @_;

    my $HT_list = WAYF::IdpConfig::get_HathiTrust_Institutions_List($C);
    my $idp_keys = [ 'google', 'facebook', 'twitter' ];
    foreach my $idp_key ( sort
                        {
                             $HT_list->{$a}->{name} cmp $HT_list->{$b}->{name}
                        } keys %$HT_list
                        ) {
        next if ( grep(/$idp_key/, @$idp_keys) );
        push @$idp_keys, $idp_key;
    }
    return _list2xml($C, $idp_keys, $HT_list, 1);
}

sub _list2xml {
    my ($C, $idp_keys, $HT_list, $social ) = @_;

    my $enabled = $social ? 3 : 1;

    my $s;
    my $target = $C->get_object('CGI')->param('target');
    if (! defined($target)) {
        $target = $C->get_object('MdpConfig')->get('default_target');
    }
    else {
        $target = Utils::url_over_SSL_to($target);
    }
    
    my $inst = $C->get_object('Auth')->get_institution_code($C) || 'notaninstitution';
    foreach my $idp_key ( @$idp_keys ) {
        
        my $add_to_list = 0;
        my $development = 0;
        if ( $HT_list->{$idp_key}->{enabled} == 0 && ! $social ) {
            if ( defined $ENV{HT_DEV} ) {
                $add_to_list = 1;
                $development = 1;
            }
        }
        elsif ( $$HT_list{$idp_key}{enabled} < 0 ) {
            if ( 0 && defined $ENV{HT_DEV} && abs($$HT_list{$idp_key}{enabled}) == $enabled ) {
                $add_to_list = 1;
                $development = 1;
            }
        }
        elsif ( $HT_list->{$idp_key}->{enabled} == $enabled ) {
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
        $site .= wrap_string_in_tag($$HT_list{$idp_key}{social}, 'Social');
        $site .= wrap_string_in_tag($$HT_list{$idp_key}{inst_id}, 'InstID');
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

