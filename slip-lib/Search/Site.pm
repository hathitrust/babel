package Search::Site;


=head1 NAME

Search::Site;

=head1 DESCRIPTION

This non-OO package privides and API to get site information.

=head1 VERSION

$Id: Site.pm,v 1.6 2009/03/13 17:47:01 pfarber Exp $

=head1 SYNOPSIS

use Search:SIte;

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

use MdpConfig;

my $SITE_ADDR = `hostname -i`;
my $DEFAULT_SITE = 'macc';

# Class B IP address <-> site name map.  These are the addresses of
# servers running cronjobs to sniff the m_index_queue table.
my %ipaddr_2_site_names =
    (
     '141.211' => 'macc',
     '141.213' => 'macc',
     '134.68'  => 'ictc',
    );

# ---------------------------------------------------------------------

=item get_server_site_name

Description

=cut

# ---------------------------------------------------------------------
sub get_server_site_name
{
    my ($server_class_B_addr) = ($SITE_ADDR =~ m,(\d+\.\d+).+,);
    my $site = $ipaddr_2_site_names{$server_class_B_addr};
    $site = $site ? $site : 'none';
    
    return $site;
}

# ---------------------------------------------------------------------

=item get_site_names

Description

=cut

# ---------------------------------------------------------------------
sub get_site_names {
    if ($ENV{HT_DEV}) {
        return $DEFAULT_SITE;
    }
    
    # Unique
    my %saw;
    @saw{values(%ipaddr_2_site_names)} = ();
    return keys %saw; 
}





1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
