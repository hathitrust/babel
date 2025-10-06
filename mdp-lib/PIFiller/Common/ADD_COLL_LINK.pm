=head1 NAME

ADD_COLL_LINK.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/ADD_COLL_LINK.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut


use CGI;

# ---------------------------------------------------------------------

=item handle_ADD_COLL_LINK_PI : PI_handler(ADD_COLL_LINK)

Handler for ADD_COLL_LINK 

=cut

sub handle_ADD_COLL_LINK_PI
    : PI_handler(ADD_COLL_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    
    my $temp_cgi = new CGI($cgi);
    $temp_cgi->param('a', 'page');
    $temp_cgi->param('page','addc');
    $temp_cgi->delete('cn');
    $temp_cgi->delete('c');
    $temp_cgi->delete('shd');
    $temp_cgi->delete('sort');

    my $href = $temp_cgi->self_url();        
    return $href;
}

1;

__END__

=head1 AUTHOR

Tom Burton-West, University of Michigan, tburtonw@umich.edu

=cut
