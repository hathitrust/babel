package Ping::Utils;

use Auth::Auth;
use Institutions;
use Utils;

sub identify_user {

    my ( $C, $env ) = @_;

    my $auth = new Auth::Auth($C);

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

    my $retval = {authType => $auth_type, auth_type => $auth_type};

    $$retval{displayName} = $auth->get_user_display_name($C, 'unscoped');
    $$retval{institution_code} = $auth->get_institution_code($C);
    $$retval{institution_name} = $auth->get_institution_name($C);

    if ( ( my $mapped = $auth->get_institution_code($C, 'mapped') ) ne $$retval{institution_code} ) {
        $$retval{mapped_institution_code} = $mapped;
    }
    if ( ( my $mapped = $auth->get_institution_name($C, 'mapped') ) ne $$retval{institution_name} ) {
        $$retval{mapped_institution_name} = $mapped;
    }
    $$retval{affiliation} = ucfirst($auth->get_eduPersonUnScopedAffiliation($C));
    $$retval{u} = $auth->get_eduPersonEntitlement_print_disabled($C);

    $$retval{providerName} = $auth->get_institution_name($C, undef, 1);

    return $retval;
    
}

1;
