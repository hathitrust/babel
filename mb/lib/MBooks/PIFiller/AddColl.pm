package MBooks::PIFiller::AddColl;

=head1 NAME

MBooks::PIFiller::AddColl (pif)

=head1 DESCRIPTION

This class implements the PI handlers for displaying the Add_COLL page.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut


use strict;

use PIFiller;
use base qw(PIFiller);

use Utils;


BEGIN
{
    require "PIFiller/Common/Globals.pm";
    require "PIFiller/Common/Group_HEADER.pm";
}


1;

