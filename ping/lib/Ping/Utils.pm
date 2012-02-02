package Ping::Utils;

sub expand_affiliation {
    my ( $affiliation ) = @_;
    # can we assume that institutions.xml is always going to be well formatted??
    require File::Slurp;
    my $institutions_filename = qq{$ENV{SDRROOT}/ping/web/common-web/institutions.xml};
    my $match;
    my $in_affiliation = 0;
    foreach my $line ( File::Slurp::read_file($institutions_filename) ) {
        if ( $line =~ m,"$affiliation", ) {
            $in_affiliation = 1;
        } elsif ( $line =~ m,enabled=, && $in_affiliation ) {
            chomp $line;
            $match = $line;
            $match =~ s,^.*>([^<]+)<.*,$1,;
            return $match;
        }
    }
    return $affiliation;
}
    
sub identify_user {

    my ( $C, $env ) = @_;

    my $displayName = $$env{REMOTE_USER};
    my $affiliation;
    my $auth_type = lc $$env{AUTH_TYPE};
    my $auth = new Auth::Auth($C);

    if ( $auth_type eq 'shibboleth' ) {
        $displayName = $$env{displayName} || $auth->__get_prioritized_scoped_affiliation();
        ## $affiliation = $auth->__get_prioritized_scoped_affiliation();
        $affiliation = expand_affiliation($auth->get_institution($C));
    } elsif ( $displayName !~ m,@,) {
        $affiliation = 'University of Michigan';
    }
    
    my $print_disabled = $auth->get_eduPersonEntitlement_print_disabled($C);
    
    return { authType => $auth_type, 
             displayName => $displayName, 
             affiliation => $affiliation, 
             institution => $auth->get_institution($C),
             u => $print_disabled };

}

1;
