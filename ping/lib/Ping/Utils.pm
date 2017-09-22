package Ping::Utils;

use Auth::Auth;
use Institutions;
use Utils;

sub identify_user {

    my ( $C, $env ) = @_;

    my $auth = new Auth::Auth($C);

    my $displayName = $auth->get_user_display_name($C, 'unscoped');
    my $institution_code = $auth->get_institution_code($C, 'mapped');
    my $institution_name = $auth->get_institution_name($C, 'mapped');
    my $print_disabled = $auth->get_eduPersonEntitlement_print_disabled($C);

    my $provider = $auth->get_institution_name($C, 'mapped', 1);
    if ( $provider eq 'University of Michigan' && Utils::Get_Remote_User() !~ m,^[a-z]+$, ) {
        # make this obvious you're a friend
        $provider .= " - Friend";
    }

    my $auth_type;
    if ( $auth->auth_sys_is_SHIBBOLETH($C) ) {
        $auth_type = 'shibboleth';
    } 
    elsif ( $auth->auth_sys_is_COSIGN($C) ) {
        $auth_type = 'cosign';
    } 
    else {
        $auth_type = '';
    } 


    
    return { authType => $auth_type, 
             displayName => $displayName, 
             affiliation => $institution_name, 
             institution => $institution_code,
             provider => $provider,
             u => $print_disabled };

}

1;
