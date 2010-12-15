package PT::PIFiller::Common;

=head1 NAME

Common.pm

=head1 DESCRIPTION

This a PI handler package for the PIs that a re global, i.e. as in ptglobals.xml

=head1 SYNOPSIS

use PIFiller::Common;

=head1 METHODS

=over 8

=cut
use base qw(PIFiller);

use App;
use Utils;
use DbUtils;
use Debug::DUtils;
use Identifier;
use View::Skin;
use Collection;
use CollectionSet;
use AccessRights;
use MirlynGlobals;


require "PIFiller/Common/Globals.pm";
require "PIFiller/Common/Group_HEADER.pm";

# ---------------------------  Utilities  -----------------------------
#
# ---------------------------------------------------------------------

=item BuildItemHandle

Description

=cut

# ---------------------------------------------------------------------
sub BuildItemHandle
{
    my $mdpItem = shift;
    my $id = shift || $mdpItem->GetId( );

    my $href = $PTGlobals::gHandleLinkStem . $id;

    return $href;
}

# ---------------------------  Handlers  ------------------------------
#

# ---------------------------------------------------------------------

=item handle_RIGHTS_ATTRIBUTE_PI : PI_handler(RIGHTS_ATTRIBUTE)

Handler for FEEDBACK_CGI_HOST

=cut

# ---------------------------------------------------------------------
sub handle_RIGHTS_ATTRIBUTE_PI
    : PI_handler(RIGHTS_ATTRIBUTE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $rights_attribute = RightsGlobals::NOOP_ATTRIBUTE;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    
    if (defined($id))
    {
        my $ar = new AccessRights($C, $id);
        $rights_attribute = $ar->get_rights_attribute($C, $id);
    }
    
    return $rights_attribute;
}


# ---------------------------------------------------------------------

=item handle_SOURCE_ATTRIBUTE_PI : PI_handler(SOURCE_ATTRIBUTE)

Handler for FEEDBACK_CGI_HOST

=cut

# ---------------------------------------------------------------------
sub handle_SOURCE_ATTRIBUTE_PI
    : PI_handler(SOURCE_ATTRIBUTE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $source_attribute = RightsGlobals::NOOP_ATTRIBUTE;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    
    if (defined($id))
    {
        my $ar = new AccessRights($C, $id);
        $source_attribute = $ar->get_source_attribute($C, $id);
    }
    
    return $source_attribute;
}


# ---------------------------------------------------------------------

=item handle_POD_DATA_PI :  PI_handler(POD_DATA)

Description

=cut

# ---------------------------------------------------------------------
sub handle_POD_DATA_PI 
    :  PI_handler(POD_DATA)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $dbh = $C->get_object('Database')->get_DBH($C);
    my $id = $C->get_object('CGI')->param('id');

    my $statement = qq{SELECT url FROM pod WHERE id='$id' LIMIT 1};
    my $sth = DbUtils::prep_n_execute($dbh, $statement);

    my $url = $sth->fetchrow_array();
    $url = Utils::escape_url_separators($url);
    
    return wrap_string_in_tag($url, 'Url');
}        

# ---------------------------------------------------------------------

=item handle_FEEDBACK_CGI_URL_PI : PI_handler(FEEDBACK_CGI_URL)

Handler for FEEDBACK_CGI_URL

=cut

# ---------------------------------------------------------------------
sub handle_FEEDBACK_CGI_URL_PI
    : PI_handler(FEEDBACK_CGI_URL)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $host = $MdpGlobals::gFeedbackCGIUrl;
    return wrap_string_in_tag( $host, 'FeedbackCGIUrl');
}


# ---------------------------------------------------------------------

=item handle_HIDDEN_Q1_PI : PI_handler(HIDDEN_Q1)

Handler for HIDDEN_Q1

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_Q1_PI
    : PI_handler(HIDDEN_Q1)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return Utils::build_hidden_var_XML($cgi, 'q1');
}


# ---------------------------------------------------------------------

=item handle_HIDDEN_SSD_PI : PI_handler(HIDDEN_SSD)

Handler for HIDDEN_SSD

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_SSD_PI
    : PI_handler(HIDDEN_SSD)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');

    return Utils::build_hidden_var_XML($cgi, 'ssd');
}

# ---------------------------------------------------------------------

=item handle_HIDDEN_ID_PI : PI_handler(HIDDEN_ID)

Handler for HIDDEN_ID

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_ID_PI
    : PI_handler(HIDDEN_ID)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');

    return Utils::build_hidden_var_XML($cgi, 'id');
}

# ---------------------------------------------------------------------

=item handle_HIDDEN_ATTR_PI : PI_handler(HIDDEN_ATTR)

Handler for HIDDEN_ATTR

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_ATTR_PI
    : PI_handler(HIDDEN_ATTR)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');

    return Utils::build_hidden_var_XML($cgi, 'attr');
}


# ---------------------------------------------------------------------

=item handle_HIDDEN_DATAROOT_PI : PI_handler(HIDDEN_DATAROOT)

Handler for HIDDEN_DATAROOT

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_DATAROOT_PI
    : PI_handler(HIDDEN_DATAROOT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');

    return Utils::build_hidden_var_XML($cgi, 'dr');
}


# ---------------------------------------------------------------------

=item handle_METS_XML_PI : PI_handler(METS_XML)

Handler for METS_XML

=cut

# ---------------------------------------------------------------------
sub handle_METS_XML_PI
    : PI_handler(METS_XML)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $fullMetsRef = $mdpItem->GetFullMetsRef();

    return $fullMetsRef;
}


# ---------------------------------------------------------------------

=item handle_FINAL_ACCESS_STATUS_PI : PI_handler(FINAL_ACCESS_STATUS)

Handler for FINAL_ACCESS_STATUS. Note that this handler calls
assert_final_access_status() instead of check_final_access_status()
because this PI is used in pt and ptsearch which are actually
accessing the item instead of just providing a link _to_ the item.
The decision was taken not to reflect special access statuses in link
labels.

=cut

# ---------------------------------------------------------------------
sub handle_FINAL_ACCESS_STATUS_PI
    : PI_handler(FINAL_ACCESS_STATUS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $ar = $C->get_object('AccessRights');
    my $output = $ar->assert_final_access_status($C, $id);

    return $output;
}

# ---------------------------------------------------------------------

=item handle_ITEM_HANDLE_PI : PI_handler(ITEM_HANDLE)

Handler for ITEM_HANDLE

=cut

# ---------------------------------------------------------------------
sub handle_ITEM_HANDLE_PI
    : PI_handler(ITEM_HANDLE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    return BuildItemHandle($mdpItem);
}

# ---------------------------------------------------------------------

=item handle_MIRLYN_ITEM_LINK_PI : PI_handler(MIRLYN_ITEM_LINK)

Handler for MIRLYN_ITEM_LINK

=cut

# ---------------------------------------------------------------------
sub handle_MIRLYN_ITEM_LINK_PI
    : PI_handler(MIRLYN_ITEM_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $id = $mdpItem->GetId();

    return $MirlynGlobals::gMirlynLinkStem . $id;
}



# ---------------------------------------------------------------------

=item handle_CONTACT_EMAIL_PI : PI_handler(CONTACT_EMAIL)

Handler for CONTACT_EMAIL

=cut

# ---------------------------------------------------------------------
sub handle_CONTACT_EMAIL_PI
    : PI_handler(CONTACT_EMAIL)
{
    my ($C, $act, $piParamHashRef) = @_;

    return Utils::obfuscate_email_addr($MdpGlobals::adminLink);
}

# ---------------------------------------------------------------------

=item handle_CONTACT_TEXT_PI : PI_handler(CONTACT_TEXT)

Handler for CONTACT_TEXT

=cut

# ---------------------------------------------------------------------
sub handle_CONTACT_TEXT_PI
    : PI_handler(CONTACT_TEXT)
{
    my ($C, $act, $piParamHashRef) = @_;

    return $MdpGlobals::adminText;
}


# ---------------------------------------------------------------------

=item handle_CURRENT_URL_PI : PI_handler(CURRENT_URL)

Handler for CURRENT_URL

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_URL_PI
    : PI_handler(CURRENT_URL)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');

    return Utils::url_to($cgi);
}


# ---------------------------------------------------------------------

=item handle_ENV_VAR_PI : PI_handler(ENV_VAR)

Handler for ENV_VAR

=cut

# ---------------------------------------------------------------------
sub handle_ENV_VAR_PI
    : PI_handler(ENV_VAR)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $environmentVariable = $$piParamHashRef{'variable'};
    my $v = $ENV{$environmentVariable};
    # occassionally useragent has chars
    # in need of mapping. e.g., AT&T
    Utils::map_chars_to_cers(\$v);
    return $v;
}

# ---------------------------------------------------------------------

=item handle_VOLUME_DATA_PI : PI_handler(VOLUME_DATA)

Handler for VOLUME_DATA

=cut

# ---------------------------------------------------------------------
sub handle_VOLUME_DATA_PI
    : PI_handler(VOLUME_DATA)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $ses = $C->get_object('Session');
    my $mdpItem = $C->get_object('MdpItem');

    my $dataRef = $mdpItem->GetVolumeData();

    # For now: Tim's script returns only the title associated with
    # this physical item, whatever volume that may be. Later: we may
    # want to do additional query to get the other volumes associated
    # with this one

    my $links;
    foreach my $bc ( keys %$dataRef )
    {
        my $href = BuildItemHandle( $mdpItem, $bc );

        $links .=
            wrap_string_in_tag
                ( wrap_string_in_tag( $href, 'Link' ) .
                  wrap_string_in_tag( $$dataRef{$bc}{'vol'}, 'TitleFragment' ),
                  'Data' );
    }

    return \$links
}

# ---------------------------------------------------------------------

=item handle_VOLUME_CURRENT_TITLE_PI : PI_handler(VOLUME_CURRENT_TITLE)

Handler for VOLUME_CURRENT_TITLE

=cut

# ---------------------------------------------------------------------
sub handle_VOLUME_CURRENT_TITLE_PI
    : PI_handler(VOLUME_CURRENT_TITLE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');

    my $dataRef = $mdpItem->GetVolumeData();
    my $id = $mdpItem->GetId();
    my $frag = $$dataRef{$id}{'vol'};

    return $frag
}

# ---------------------------------------------------------------------

=item handle_METADATA_FAILURE_PI : PI_handler(METADATA_FAILURE)

Handler for METADATA_FAILURE

=cut

# ---------------------------------------------------------------------
sub handle_METADATA_FAILURE_PI
    : PI_handler(METADATA_FAILURE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    return $mdpItem->GetMetadataFailure() ? 'true' : 'false';
}


# ---------------------------------------------------------------------

=item handle_MBOOKS_ENABLED_PI : PI_handler(MBOOKS_ENABLED)

Handler for MBOOKS_ENABLED

=cut

# ---------------------------------------------------------------------
sub handle_MBOOKS_ENABLED_PI
    : PI_handler(MBOOKS_ENABLED)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $app = $C->get_object('App');
    
    $app->__test_MBooks_enabled() ? 'true' : 'false';
}

# ---------------------------------------------------------------------

=item handle_HATHITRUST_AFFILIATE_PI : PI_handler(HATHITRUST_AFFILIATE)

Handler for HATHITRUST_AFFILIATE

=cut

# ---------------------------------------------------------------------
sub handle_HATHITRUST_AFFILIATE_PI
    : PI_handler(HATHITRUST_AFFILIATE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $is_hathitrust = $C->get_object('Auth')->affiliation_is_hathitrust($C);

    return $is_hathitrust ? 'true' : 'false'
}

# ---------------------------------------------------------------------

=item handle_MICHIGAN_AFFILIATE_PI : PI_handler(MICHIGAN_AFFILIATE)

Handler for MICHIGAN_AFFILIATE

=cut

# ---------------------------------------------------------------------
sub handle_MICHIGAN_AFFILIATE_PI
    : PI_handler(MICHIGAN_AFFILIATE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $is_umich = $C->get_object('Auth')->affiliation_is_umich($C);

    return $is_umich ? 'true' : 'false'
}


# ---------------------------------------------------------------------

=item handle_MY_SKIN_PI : PI_handler(MY_SKIN)

Handler for MY_SKIN

=cut

# ---------------------------------------------------------------------
sub handle_MY_SKIN_PI
    : PI_handler(MY_SKIN)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $skin = new View::Skin($C);
    
    return $skin->get_skin_name($C);
}


# ---------------------------------------------------------------------

=item handle_COLLECTIONS_OWNED_JS_PI : PI_handler(COLLECTIONS_OWNED_JS)

Handler for COLLECTIONS_OWNED_JS

=cut

# ---------------------------------------------------------------------
sub handle_COLLECTIONS_OWNED_JS_PI
    : PI_handler(COLLECTIONS_OWNED_JS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $dbh = $C->get_object('Database')->get_DBH();
    my $config = $C->get_object('MdpConfig');
    my $user_id = $C->get_object('Auth')->get_user_name($C);

    my $CS = CollectionSet->new($dbh, $config, $user_id) ;
    my $coll_hashref = $CS->get_coll_data_from_user_id($user_id);

    my @coll_names;
    foreach my $row (@{$coll_hashref})
    {
        push(@coll_names, $row->{'collname'});
    }
    @coll_names = sort {lc($a) <=> lc($b)} @coll_names;

    my $js = Utils::Js::build_javascript_array('getCollArray', 'COLL_NAME', \@coll_names);

    return $js;
}


# ---------------------------------------------------------------------

=item handle_COLLECTION_LIST_PI : PI_handler(COLLECTION_LIST)

Handler for COLLECTION_LIST

=cut

# ---------------------------------------------------------------------
sub handle_COLLECTION_LIST_PI
    : PI_handler(COLLECTION_LIST)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $user_id = $C->get_object('Auth')->get_user_name($C);
    my $co = $C->get_object('Collection');

    my $cgi = $C->get_object('CGI');
    my $extern_id = $cgi->param('id');
    my $intern_id = $co->get_item_id_from_extern_id($extern_id);

    my $coll_list;
    if ($co->item_exists($intern_id))
    {
        my $coll_data_arrayref =
            $co->get_coll_data_for_item_and_user($intern_id, $user_id);

        foreach my $coll_hashref (@$coll_data_arrayref)
        {
            my $MBooks_url
                = $PTGlobals::gCollectionBuilderCgiRoot 
                    . qq{?a=listis;c=$$coll_hashref{'MColl_ID'}};
            $coll_list .=
                wrap_string_in_tag
                    (wrap_string_in_tag($MBooks_url, 'Url') .
                     wrap_string_in_tag($$coll_hashref{'collname'}, 'CollName'), 'Coll');
        }
    }

    return $coll_list;
}


# ---------------------------------------------------------------------

=item handle_COLLECTION_SELECT_PI : PI_handler(COLLECTION_SELECT)

Handler for COLLECTION_SELECT

=cut

# ---------------------------------------------------------------------
sub handle_COLLECTION_SELECT_PI
    : PI_handler(COLLECTION_SELECT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $co = $C->get_object('Collection');
    my $cs = $C->get_object('CollectionSet');

    my $cgi = $C->get_object('CGI');
    my $extern_id = $cgi->param('id');
    my $intern_id = $co->get_item_id_from_extern_id($extern_id);

    my (%coll_names, @coll_vals);

    # Put default items into the list
    push(@coll_vals, 'a');
    $coll_names{'a'} = 'Select Collection';
    push(@coll_vals, 'b');
    $coll_names{'b'} = '[CREATE NEW COLLECTION]';

    # Get list of collections owned by user
    my $user_id = $C->get_object('Auth')->get_user_name($C);
    my $coll_data_arrayref = $cs->get_coll_data_from_user_id($user_id);

    # Add collections not containing the item to the pulldown.  If the
    # item has never been added by anyone it will not 'exist' so it will
    # be ok to show all this user's collections as in the pulldown
    my $item_exists = $co->item_exists($intern_id);
    foreach my $coll_hashref (@$coll_data_arrayref)
    {
        if ((! $item_exists)
            ||
            (! $co->item_in_collection($intern_id, $$coll_hashref{'MColl_ID'})))
        {
            push(@coll_vals, $$coll_hashref{'MColl_ID'});
            $coll_names{$$coll_hashref{'MColl_ID'}} = $$coll_hashref{'collname'};
        }
    }

    my $ses = $C->get_object('Session');
    my $to_collid = $ses->get_persistent('last_to_collid');

    my $name = 'c2';
    my $select =
        Utils::build_HTML_pulldown_XML($name, \@coll_vals, \%coll_names, $to_collid);

    return $select;
}


# ---------------------------------------------------------------------

=item handle_BACK_NAV_LINK_INFO_PI : PI_handler(BACK_NAV_LINK_INFO)

Handler for BACK_NAV_LINK_INFO

=cut

# ---------------------------------------------------------------------
sub handle_BACK_NAV_LINK_INFO_PI
    : PI_handler(BACK_NAV_LINK_INFO)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $auth = $C->get_object('Auth');
    my $is_logged_in = $auth->is_logged_in($C);
    if (! $is_logged_in)
    {
        my $ses = $C->get_object('Session');
        $ses->set_persistent('mb_app_url', undef);
    }

    my $back_to_mb_url = $C->get_object('Session')->get_persistent('mb_app_url');

    my $backLinkType;
    if ($back_to_mb_url =~ m,a=editc|a=copyit(nc)*|a=movit(nc)*|a=delit|a=listis,)
    {
        $backLinkType = 'from_item_list';
    }
    elsif ($back_to_mb_url =~ m,a=srch,)
    {
        $backLinkType = 'from_result_list';
    }
    else
    {
        $backLinkType = 'undefined';
    }

    # Grab the collid and look up the collection name
    my ($coll_name, $coll_id);
    if ($backLinkType ne 'undefined')
    {
        ($coll_id) = ($back_to_mb_url =~ m,\Wc=(\d+),);
        if ($coll_id)
        {
            my $dbh = $C->get_object('Database')->get_DBH();
            my $config = $C->get_object('MdpConfig');
            my $user_id = $C->get_object('Auth')->get_user_name($C);
            my $co = Collection->new($dbh, $config, $user_id) ;

            $coll_name = $co->get_coll_name($coll_id);
        }
    }

    my $backNavInfo =
        wrap_string_in_tag($backLinkType, 'Type') .
            wrap_string_in_tag($back_to_mb_url, 'Href') .
                wrap_string_in_tag($coll_name, 'CollName');

    return $backNavInfo;
}


# ---------------------------------------------------------------------

=item handle_SSD_SESSION_PI : PI_handler(SSD_SESSION)

Handler for SSD_SESSION

=cut

# ---------------------------------------------------------------------
sub handle_SSD_SESSION_PI
    : PI_handler(SSD_SESSION)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    my $ses = $C->get_object('Session');
    my $ssd = $ses->get_persistent_subkey('ssd', $id);

    return ($ssd eq 'allowed') ? 'true' : 'false';
}
# ---------------------------------------------------------------------

=item BuildContentsItemLink

Description

=cut

# ---------------------------------------------------------------------
sub BuildContentsItemLink
{
    my ( $cgi, $seq, $num ) = @_;

    my $tempCgi = new CGI( $cgi );

    $tempCgi->delete( 'seq' );
    $tempCgi->delete( 'num' );
    $tempCgi->delete( 'u' );
    # Use the last requested orientation for this page or the default
    $tempCgi->delete( 'orient' );
    $tempCgi->param( 'seq', $seq );
    $tempCgi->param( 'num', $num );

    return Utils::url_to($tempCgi);
}

# ---------------------------------------------------------------------

=item handle_FEATURE_LIST_PI

Description

=cut

# ---------------------------------------------------------------------
sub handle_FEATURE_LIST_PI
  : PI_handler(FEATURE_LIST) 
{
    my ($C, $act, $piParamHashRef) = @_;
    
    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');
    
    my $featureXML;
    
    $mdpItem->InitFeatureIterator();
    my $featureRef;
    
    my $seenFirstTOC = 0;
    my $seenFirstIndex = 0;
    my $seenSection = 0;
    
    my $i = 1;
    while ($featureRef = $mdpItem->GetNextFeature(), $$featureRef) {
        my $tag   = $$$featureRef{'tag'};
        my $label = $$$featureRef{'label'};
        my $page  = $$$featureRef{'pg'};
        my $seq   = $$$featureRef{'seq'};
        
        if  ($tag =~ m,FIRST_CONTENT_CHAPTER_START|1STPG,) {
            $label = qq{$label } . $i++;
            $seenSection = 1;
        }
        elsif ($tag =~ m,^CHAPTER_START$,) {
            $label = qq{$label } . $i++;
            $seenSection = 1;
        }
        elsif ($tag =~ m,^MULTIWORK_BOUNDARY$,) {
            # Suppress redundant link on MULTIWORK_BOUNDARY seq+1
            # if its seq matches the next CHAPTER seq.
            my $nextFeatureRef = $mdpItem->PeekNextFeature();
            if ($$nextFeatureRef 
                && (
                    ($$$nextFeatureRef{'tag'} =~ m,^CHAPTER_START$,)
                    &&
                    ($$$nextFeatureRef{'seq'} eq $seq))
               ) {
                # Skip CHAPTER_START
                $mdpItem->GetNextFeature();
            }
            $label = qq{$label } . $i++;
            $seenSection = 1;
        }

        if ($seenSection) {
            $seenFirstTOC = 0;
            $seenFirstIndex = 0;
        }
        
        # Repetition suppression
        if  ($tag =~ m,TABLE_OF_CONTENTS|TOC,) {
            $seenSection = 0;
            if ($seenFirstTOC) {   
                next;   
            }
            else {   
                $seenFirstTOC = 1;   
            }
        }
        
        if  ($tag =~ m,INDEX|IND,) {
            $seenSection = 0;
            if ($seenFirstIndex) {   
                next;   
            }
            else {   
                $seenFirstIndex = 1;   
            }
        }
        
        my $url = BuildContentsItemLink($cgi, $seq, $page);

        my $featureItem =
            wrap_string_in_tag($tag, 'Tag') .
                wrap_string_in_tag($label, 'Label') .
                    wrap_string_in_tag($page, 'Page') .
                        wrap_string_in_tag($seq, 'Seq') .
                            wrap_string_in_tag($url, 'Link');

        $featureXML .=
            wrap_string_in_tag($featureItem, 'Feature');
    }

    return $featureXML;
}



1;

__END__

=head1 AUTHOR

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008 ©, The Regents of The University of Michigan, All Rights Reserved

Permission is hereby granted, free of charge, to any person obtaining
a copy of this software and associated documentation files (the
"Software"), to deal in the Software without restriction, including
without limitation the rights to use, copy, modify, merge, publish,
distribute, sublicense, and/or sell copies of the Software, and to
permit persons to whom the Software is furnished to do so, subject
to the following conditions:

The above copyright notice and this permission notice shall be
included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

=cut
