=head1 NAME

LOGIN_LINK.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/LOGIN_LINK.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut


use CGI;

# ---------------------------------------------------------------------

=item handle_LOGIN_LINK_PI : PI_handler(LOGIN_LINK)

Handler for LOGIN_LINK (which doubles as the logout link).  There is
currently no logout from Shibboleth.

=cut

# ---------------------------------------------------------------------
sub handle_LOGIN_LINK_PI
    : PI_handler(LOGIN_LINK) {
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $auth = $C->get_object('Auth');

    my $href;

    if ($auth->is_logged_in($C)) {
        # LOGIN_LINK is "" if auth_sys_is_SHIBBOLETH.  User must close
        # browser to logout.
        if ($auth->auth_sys_is_COSIGN($C)) {
            my $cgi = $C->get_object('CGI');
            my $redirect_to = CGI::self_url($cgi);
            $redirect_to = Utils::url_over_nonSSL_to($redirect_to);
            $href = 'https://' . CGI::virtual_host() . $config->get('logouturl') . q{?} .  $redirect_to;
        }
    }
    else {
        my $return_to_url = CGI::self_url($cgi);
        $href = $auth->get_WAYF_login_href($C, $return_to_url);
    }
    
    return $href;
}




1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
