=head1 NAME

Group_HEADER.pm

=head1 DESCRIPTION

The syntax of the Group_*.pm files in Common indicates that they are
convenience modules to gather together the require statements of a
number of single handler packages (packages that handle ONE PI) into a
single package to simplify maintenence.

The single PI packages are actually "packageless" shared methods that
become methods in the package into which they are "require"d.

This Group packageless package brings together the PIs for the header.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/Group_HEADER.pm";
}


=head1 METHODS

=over 8

=cut


BEGIN
{

=item PIFiller/Common/LOGIN_LINK.pm

=cut

    require "PIFiller/Common/LOGIN_LINK.pm";

=item PIFiller/Common/USER_NAME.pm

=cut

    require "PIFiller/Common/USER_NAME.pm";

=item PIFiller/Common/MY_MBOOKS_LINK.pm

=cut

    require "PIFiller/Common/MY_MBOOKS_LINK.pm";
    require "PIFiller/Common/PUB_COLL_LINK.pm";
    require "PIFiller/Common/PRIV_COLL_LINK.pm";
    require "PIFiller/Common/HOME_LINK.pm";
    require "PIFiller/Common/COLLECTIONS_OWNED.pm";
    require "PIFiller/Common/RECENTLY_ADDED.pm";
}


1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
