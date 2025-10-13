package View::Skin;



=head1 NAME

View::Skin;  (skin)

=head1 DESCRIPTION

This class encapsulates the logic to determine the skin to apply
according and based on the skin to provide paths to XSL stylesheets
that implement that skin.

=head1 VERSION

$Id: Skin.pm,v 1.11 2009/09/02 14:29:46 pfarber Exp $

=head1 SYNOPSIS

my $skin = new View::Skin($C);

$skin->get_name($C);

=head1 METHODS

=over 8

=cut

BEGIN
{
    if ($ENV{'HT_DEV'})
    {
        require "strict.pm";
        strict::import();
    }
}

use CGI;

use Context;
use Utils;
use Debug::DUtils;

sub new
{
    my $class = shift;

    my $self = {};
    bless $self, $class;
    $self->_initialize(@_);

    return $self;
}

use constant DEFAULT_SKIN    => 'default';


# ---------------------------------------------------------------------

=item _initialize

Initialize View::Skin object.

=cut

# ---------------------------------------------------------------------
sub _initialize
{
}


# ---------------------------------------------------------------------

=item __get_skin_by_location

Description

=cut

# ---------------------------------------------------------------------
sub __get_skin_by_location
{
    my $self = shift;
    my $C = shift;

    my $skin_name = DEFAULT_SKIN;

    return $skin_name;
}



# ---------------------------------------------------------------------

=item get_skin_name

Primarily based on SDRINST but other logic could also apply here.
This is all hardcoded currently.  This will change when we elaborate
skin configutation.

Current Algorithm:

if (UM authenticated) then
     if (UM friend authenticated) then
        skin is determined by institution (could be no institution)
     else
        skin is um
     endif
else
   skin is determined by institution (could be no institution)
endif


=cut

# ---------------------------------------------------------------------
sub get_skin_name
{
    my $self = shift;
    my $C = shift;

    my $skin_name;
    $skin_name = DEFAULT_SKIN;

    # Debugging URL parameter to force a skin
    my $skin_key = $C->get_object('CGI')->param('skin');
    $skin_name = $skin_key ? $skin_key : $skin_name;

    ASSERT($skin_name, qq{Skin name algorithm failed});
    return $skin_name;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
