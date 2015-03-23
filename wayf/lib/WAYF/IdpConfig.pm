package WAYF::IdpConfig;

# HathiTrust Shibboleth IdP URLs and link text, icons, etc. Keyed by GRIN code.

use strict;
use warnings;

use Utils;
use Debug::DUtils;
use Institutions;

my $HathiTrust_Institutions;

# ---------------------------------------------------------------------

=item __populate_HT_hash

Description

=cut

# ---------------------------------------------------------------------
sub __populate_HT_hash {
    my $C = shift;

    my $list_ref = Institutions::get_institution_list($C);

    foreach my $hashref (@$list_ref) {

        my $name = $hashref->{name};
        Utils::map_chars_to_cers(\$name, [q{"}, q{'}], 1);

        my $enabled  = $hashref->{enabled};
        my $inst_id  = $hashref->{inst_id};
        my $template = $hashref->{template};
        my $authtype = $hashref->{authtype};

        my $h = {
                 'name' => $name,
                 'authtype' => $authtype,
                 'template' => $template,
                 'enabled' => $enabled,
                };

        $HathiTrust_Institutions->{$inst_id} = $h;
    }
}


# ---------------------------------------------------------------------

=item get_HathiTrust_Institutions_List

Description

=cut

# ---------------------------------------------------------------------
sub get_HathiTrust_Institutions_List {
    my $C = shift;

    if (scalar keys %$HathiTrust_Institutions) {
        return $HathiTrust_Institutions;
    }
    else {
        __populate_HT_hash($C);
        return $HathiTrust_Institutions;
    }
}


1;
