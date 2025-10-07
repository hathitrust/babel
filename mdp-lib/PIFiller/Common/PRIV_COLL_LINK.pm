=head1 NAME

PRIV_COLL_LINK.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/PRIV_COLL_LINK.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut



# ---------------------------------------------------------------------

=item handle_PRIV_COLL_LINK_PI : PI_handler(PRIV_COLL_LINK)

Handler for PRIV_COLL_LINK

=cut

sub handle_PRIV_COLL_LINK_PI
    : PI_handler(PRIV_COLL_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $debug = $C->get_object('CGI')->param('debug');
    my $params = $C->get_object('MdpConfig')->get('list_colls_base_params');
    $params .= ";colltype=my-collections";
    if ( $debug ) {
        $params .= ";debug=$debug";
    }

    my $priv_coll_url;
    my $auth = $C->get_object('Auth');
    if ($auth->auth_sys_is_SHIBBOLETH($C) && $auth->is_cosign_active()) {
        $priv_coll_url = qq{/shcgi/mb?$params};
    }
    else {
        $priv_coll_url = qq{/cgi/mb?$params};
    }

    return $priv_coll_url;
}

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut
