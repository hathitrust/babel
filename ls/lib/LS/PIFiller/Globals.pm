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
    my $mtime = (stat (qq{$ENV{SDRROOT}/$pathanme}))[9];

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

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

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
