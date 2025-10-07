=head1 NAME

USER_NAME.pm

=head1 DESCRIPTION

This a single PI package which consists of "packageless" shared
methods that become methods in the package into which they are
"require"d.

=head1 SYNOPSIS

BEGIN
{
    require "PIFiller/Common/USER_NAME.pm";
}

see also package with the naming convention Group_*.pm

=head1 METHODS

=over 8

=cut



# ---------------------------------------------------------------------

=item handle_USER_NAME_PI : PI_handler(USER_NAME)

Handler for USER_NAME

=cut

# ---------------------------------------------------------------------
use Utils;
sub handle_USER_NAME_PI
    : PI_handler(USER_NAME) {
    my ($C, $act, $piParamHashRef) = @_;

    my $auth = $C->get_object('Auth');
    my $user_name = $auth->get_user_display_name($C, 'unscoped');
    Utils::map_chars_to_cers(\$user_name, [q{"}, q{'}], 1);

    return $user_name;
}


# ---------------------------------------------------------------------

=item handle_USER_ID_PI : PI_handler(USER_ID)

Handler for USER_ID

=cut

# ---------------------------------------------------------------------
sub handle_USER_ID_PI
    : PI_handler(USER_ID) {
    my ($C, $act, $piParamHashRef) = @_;

    my $auth = $C->get_object('Auth');
    my $user_id = CGI::escape($auth->get_user_name($C));

    return $user_id;
}

use Auth::Auth;
sub handle_USER_AFFILIATION_PI
    : PI_handler(USER_AFFILIATION) {
    my ($C, $act, $piParamHashRef) = @_;

    my $auth = $C->get_object('Auth');
    my $affiliation;

    if ( $auth->get_eduPersonEntitlement($C)->has_entitlement($Auth::Auth::ENTITLEMENT_COMMON_LIB_TERMS) ) {
        $affiliation = 'Member';
    } else {
        $affiliation = ucfirst($auth->get_eduPersonUnScopedAffiliation($C) || 'Guest');
    }

    $affiliation = CGI::escape($affiliation);

    my $config = $auth->get_activated_switchable_role($C);
    if ( $config ) {
        $affiliation = $$config{label};
    }

    return $affiliation;
}

sub handle_USER_HAS_ROLE_TOGGLES_PI
    : PI_handler(USER_HAS_ROLE_TOGGLES) {

    my ($C, $act, $piParamHashRef) = @_;

    my $retval;

    my $auth = $C->get_object('Auth');

    my @switchable_roles = $auth->get_switchable_roles($C);
    my $config = $auth->get_activated_switchable_role($C);
    if ( scalar @switchable_roles ) {
        my $activated = ref $config ? $$config{role} : '';
        $retval = qq{<UserHasRoleToggles activated="$activated">TRUE</UserHasRoleToggles>};
    }

    return $retval;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=cut
