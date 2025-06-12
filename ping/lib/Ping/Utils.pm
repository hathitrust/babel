package Ping::Utils;

use Auth::Auth;
use Auth::ACL;
use Institutions;
use Utils;

use Ping::Notifications;

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
    $$retval{x} = $auth->affiliation_has_emergency_access($C);

    $$retval{r} = undef;

    my $has_activated_role = $Types::Serialiser::false;
    foreach my $config ( $auth->get_switchable_roles($C) ) {
        my $method = $$config{method};
        my $check  = $auth->$method( $C, 1 );
        if ( $check ) {
            $$retval{r} = {}; # unless ( defined $$retval{r} );
            $$retval{r}{$$config{role}} =
                $auth->$method($C) ?
            $Types::Serialiser::true : 
            $Types::Serialiser::false;
            if ( $$retval{r}{$$config{role}} == $Types::Serialiser::true ) {
                $has_activated_role = $Types::Serialiser::true;
            }
        }
    }
    $$retval{u} =
      $has_activated_role || 
        $auth->get_eduPersonEntitlement_print_disabled($C) ? 
            $Types::Serialiser::true : 
            $Types::Serialiser::false;
    
    # $$retval{activated} = $auth->user_is_print_disabled_proxy($C) ? 'enhancedTextProxy' : undef;

    $$retval{providerName} = $auth->get_institution_name($C, undef, 1);
    unless ( $$retval{affiliation} ) {
        if ( $$retval{providerName} ) {
            $$retval{affiliation} = 'Guest';
        }
    }

    return $retval;

}

1;
