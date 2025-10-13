=head1 NAME

HOME_LINK.pm

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

=item handle_HOME_LINK_PI : PI_handler(HOME_LINK)

Handler for HOME_LINK

=cut

sub handle_HOME_LINK_PI
    : PI_handler(HOME_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $params = $config->get('mbooks_home_base_params');
    my $home_url = qq{/cgi/mb?$params};
    
    return $home_url;
}

1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
