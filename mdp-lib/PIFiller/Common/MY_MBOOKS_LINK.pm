=head1 NAME

MY_MBOOKS_LINK.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/MY_MBOOKS_LINK.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut



# ---------------------------------------------------------------------

=item handle_MY_MBOOKS_LINK_PI : PI_handler(MY_MBOOKS_LINK)

Handler for MY_MBOOKS_LINK

=cut

sub handle_MY_MBOOKS_LINK_PI
    : PI_handler(MY_MBOOKS_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $params = $config->get('list_colls_base_params');
    my $my_mbooks_url = qq{/cgi/mb?$params};
    return $my_mbooks_url;
}




1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
