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
    my $affiliation = $auth->get_eduPersonUnScopedAffiliation($C);
    my $print_disabled = $auth->get_eduPersonEntitlement_print_disabled($C);

    my $providerName = $auth->get_institution_name($C, 'mapped', 1);

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
             institution_name => $institution_name,
             institution_code => $institution_code,
             providerName => $providerName,
             affiliation => $affiliation,
             u => $print_disabled };

}

1;
