package WAYF::IdpConfig;

# HathiTrust Shibboleth IdP URLs and link text, icons, etc. Keyed by GRIN code.

use strict;
use XML::LibXML;
use Utils;
use Debug::DUtils;

our %HT;
my $g_wPARSER = XML::LibXML->new();


# ---------------------------------------------------------------------

=item get_config_filename

Description

=cut

# ---------------------------------------------------------------------
sub get_config_filename {
    my $filename;
    if (DEBUG('local')) {
        $filename = $ENV{SDRROOT} . "/mdp-web/institutions.xml";
    }
    else {
        $filename = $ENV{SDRROOT} . "/wayf/web/common-web/institutions.xml";
    }

    return $filename;
}

# ---------------------------------------------------------------------

=item populate_HT_hash

Description

=cut

# ---------------------------------------------------------------------
sub populate_HT_hash {
    # lazy
    return if (scalar keys %HT);
    
    my $xml_config_file = get_config_filename();    
    my $xmlRef = Utils::read_file( $xml_config_file );

    my $doc = $g_wPARSER->parse_string($$xmlRef);

    my $doc_xpath = q{//Inst};
    my @doc_nodes = $doc->findnodes($doc_xpath);

    foreach my $node (@doc_nodes) {
        # NAME ::= Inst
        my $link_text = $node->textContent();
        Utils::map_chars_to_cers(\$link_text, [q{"}, q{'}], 1);

        my $enabled = $node->getAttributeNode('enabled')->textContent();
        my $sdrinst = $node->getAttributeNode('sdrinst')->textContent();
        my $template = $node->getAttributeNode('template')->textContent();
        my $authtype = $node->getAttributeNode('authtype')->textContent();

        my $h = {
                 'link_text' => $link_text,
                 'authtype' => $authtype,
                 'template' => $template,
                 'enabled' => $enabled,
                };
        
        $HT{$sdrinst} = $h;
    }
}

1;
