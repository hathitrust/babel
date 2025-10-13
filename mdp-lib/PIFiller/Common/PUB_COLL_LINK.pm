=head1 NAME

PUB_COLL_LINK.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/PUB_COLL_LINK.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut



# ---------------------------------------------------------------------

=item handle_PUB_COLL_LINK_PI : PI_handler(PUB_COLL_LINK)

Handler for PUB_COLL_LINK

=cut

# ---------------------------------------------------------------------
sub handle_PUB_COLL_LINK_PI
    : PI_handler(PUB_COLL_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $debug = $C->get_object('CGI')->param('debug');
    my $params = $C->get_object('MdpConfig')->get('list_colls_base_params');
    $params .= ";colltype=all;debug=$debug";

    my $pub_coll_url;
    my $auth = $C->get_object('Auth');
    if ($auth->auth_sys_is_SHIBBOLETH($C)) {
        $pub_coll_url = qq{/shcgi/mb?$params};
    }
    else {
        $pub_coll_url = qq{/cgi/mb?$params};
    }

    return $pub_coll_url;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
