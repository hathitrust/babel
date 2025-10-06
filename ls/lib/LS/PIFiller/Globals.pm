=head1 NAME

Globals.pm

=head1 DESCRIPTION

This a PI handler package for the PIs that are global

=head1 VERSION

$Id:

=head1 SYNOPSIS

BEGIN
{
    require "LS/PIFiller/Globals.pm";
}

=head1 METHODS

=over 8

=cut

use Utils;
use Debug::DUtils;
use Context;
use MdpConfig;

require "PIFiller/Common/Globals.pm";
require "PIFiller/Common/PUB_COLL_LINK.pm";
require "PIFiller/Common/PRIV_COLL_LINK.pm";
require "PIFiller/Common/HOME_LINK.pm";
require "PIFiller/Common/LOGIN_LINK.pm";
require "PIFiller/Common/USER_NAME.pm";


# ---------------------------------------------------------------------

=item handle_COLLECTION_NAME_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_TIMESTAMP_PI
    : PI_handler(TIMESTAMP)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $href = $$piParamHashRef{href};
    my $pathname = $href;
    $pathname =~ s,/(^[/]+)/(.*)$,/$1/web/$2,;
    my $mtime = (stat (qq{$ENV{SDRROOT}/$pathname}))[9];

    return "?_=$mtime";
}

sub handle_COLLECTION_NAME_PI
    : PI_handler(COLLECTION_NAME)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $coll_name = $config->get('ls_coll_name');

    return $coll_name;
}


# ---------------------------------------------------------------------

=item handle_LS_HOME_LINK_PI : PI_handler(LS_HOME_LINK)

Handler for LS_HOME_LINK

=cut

# ---------------------------------------------------------------------
sub handle_LS_HOME_LINK_PI
    : PI_handler(LS_HOME_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $home_url  = $config->get('ls_home_link');

    return $home_url;
}

# ---------------------------------------------------------------------

=item handle_HOME_LINK_PI : PI_handler(HOME_LINK)

Handler for HOME_LINK

=cut

# ---------------------------------------------------------------------
sub handle_HOME_LINK_PI
    : PI_handler(HOME_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $home_url = $config->get('hathitrust_link');

    return $home_url;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
