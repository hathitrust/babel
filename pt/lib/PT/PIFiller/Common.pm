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
use Utils::Time;
use DbUtils;
use Debug::DUtils;
use Identifier;
use View::Skin;
use Collection;
use CollectionSet;
use Access::Rights;
use Survey;
use Namespaces;

use File::Slurp ();

use URI;

require "PIFiller/Common/Globals.pm";
require "PIFiller/Common/Group_HEADER.pm";

# ---------------------------  Utilities  -----------------------------
#
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item BuildViewTypeUrl

Description

=cut

# ---------------------------------------------------------------------
sub BuildViewTypeUrl
{
    my ( $cgi, $view ) = @_;

    my $tempCgi = new CGI( $cgi );

    if ( $view eq 'fpdf' || $view eq 'pdf' ) {
        return BuildImageServerPDFUrl($cgi, $view);
    } elsif ( $view eq 'epub' ) {
        return BuildImageServerPDFUrl($cgi, $view);
    }

    $tempCgi->delete('ui'); # clear ui=embed
    $tempCgi->param( 'view', $view );
    my $href = Utils::url_to($tempCgi);

    return $href;
}

sub BuildImageServerPDFUrl
{
    my ( $cgi, $view ) = @_;

    my $tempCgi = new CGI ("");

    my $path;
    # copy params
    foreach my $p (qw(id orient size attr src u)) {
        $tempCgi->param($p, scalar $cgi->param($p));
    }
    if ( $view eq 'fpdf' ) {
        # pass
        $action = "download/pdf";
    } elsif ( $view eq 'pdf' ) {
        # don't force download;
        # let the PDF open in the browser if possible
        $tempCgi->param('seq', scalar $cgi->param('seq'));
        $tempCgi->param('num', scalar $cgi->param('num'));
        $tempCgi->param('attachment', 0);
        $action = "download/pdf";
    } elsif ( $view eq 'epub' ) {
        $action = 'download/epub';
    }

    if ( $cgi->param('debug') ) {
        $tempCgi->param('debug', scalar $cgi->param('debug'));
    }

    my $href = Utils::url_to($tempCgi, $PTGlobals::gImgsrvCgiRoot . "/$action");
    return $href;
}


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
=item handle_ITEM_TYPE_PI : PI_handler(ITEM_TYPE)

Description

=cut

# ---------------------------------------------------------------------
sub GetItemType
{
    my ( $C ) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $id = $C->get_object('CGI')->param('id');

    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ( $finalAccessStatus ne 'allow' )
    {
        return qq{restricted};
    }

    # pull from mdpItem
    my $item_type = $mdpItem->GetItemType();

    if ( my $item_sub_type = $mdpItem->GetItemSubType() ) {
        $item_type .= "/" . lc $item_sub_type;
    }

    return $item_type;
}

sub GetItemSubType
{
    my ( $C ) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $id = $C->get_object('CGI')->param('id');

    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ( $finalAccessStatus ne 'allow' )
    {
        return undef;
    }

    # pull from mdpItem
    my $item_type = $mdpItem->GetItemSubType() || '';

    return lc $item_type;
}

sub handle_ITEM_TYPE_PI
  : PI_handler(ITEM_TYPE)
{
    my ($C, $act, $piParamHashRef) = @_;

    return GetItemType($C);
}

=item handle_PT_SURVEY_PI : PI_handler(PT_SURVEY)

 <Surveys><?PT_SURVEY?></Surveys>

  i.e.

 <Surveys>
   <Survey>
     <Desc>words</Desc>
     <Effective>2013-06-06</Expires>
     <Expires>2013-06-07</Expires>
   </Survey>
   <Survey>
     <Desc>words</Desc>
     <Effective>2013-06-06</Expires>
     <Expires>2013-06-07</Expires>
   </Survey>
   [...]
  </Surveys>

=cut

# ---------------------------------------------------------------------
sub handle_PT_SURVEY_PI
    : PI_handler(PT_SURVEY)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $survey_arr_ref =
      Survey::get_survey_by_itemid($C,
                                   $C->get_object('Database')->get_DBH,
                                   scalar $C->get_object('CGI')->param('id'));

    my $surveys = '';
    foreach my $hashref (@$survey_arr_ref) {
        my $s = '';
        $s .= wrap_string_in_tag($hashref->{description}, 'Desc');
        $s .= wrap_string_in_tag($hashref->{effective_date}, 'Effective');
        $s .= wrap_string_in_tag($hashref->{expires_date}, 'Expires');
        $surveys .= wrap_string_in_tag($s, 'Survey');
    }

    return $surveys;
}

# ---------------------------------------------------------------------
sub handle_ITEM_IN_COLLECTIONS
    : PI_handler(ITEM_IN_COLLECTIONS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $collections_list = '';

    my $id = $C->get_object('CGI')->param('id');
    my $dbh = $C->get_object('Database')->get_DBH($C);

    my $statement = qq{SELECT MColl_ID FROM mb_coll_item WHERE extern_item_id=?};
    my $sth = DbUtils::prep_n_execute($dbh, $statement, $id);

    foreach my $row ( @{ $sth->fetchall_arrayref() } ) {
        $collections_list .= wrap_string_in_tag($$row[0], 'Item');
    }

    return $collections_list;
}

# ---------------------------------------------------------------------

=item handle_RIGHTS_ATTRIBUTE_PI : PI_handler(RIGHTS_ATTRIBUTE)

Handler for FEEDBACK_CGI_HOST

=cut

# ---------------------------------------------------------------------
sub handle_RIGHTS_ATTRIBUTE_PI
    : PI_handler(RIGHTS_ATTRIBUTE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $rights_attribute = $RightsGlobals::NOOP_ATTRIBUTE;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    if (defined($id)) {
        $rights_attribute = $C->get_object('Access::Rights')->get_rights_attribute($C, $id);
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

    my $source_attribute = $RightsGlobals::NOOP_ATTRIBUTE;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    if (defined($id)) {
        $source_attribute = $C->get_object('Access::Rights')->get_source_attribute($C, $id);
    }

    return $source_attribute;
}


# ---------------------------------------------------------------------

=item handle_CONTENT_PROVIDER_PI : PI_handler(CONTENT_PROVIDER)

Handler for CONTENT_PROVIDER

=cut

# ---------------------------------------------------------------------
sub handle_CONTENT_PROVIDER_PI
    : PI_handler(CONTENT_PROVIDER)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $content_provider = lc $mdpItem->Get('collection_source');

    # no collection source in METS, punt to using namespace + source attribute lookup
    # NOTE: REMOVE AFTER METS UPLIFT - ROGER
    unless ( $content_provider ) {
        my $id = $mdpItem->GetId();
        my $rights = $C->get_object('Access::Rights',1);
        my $source_attribute;
        if (ref $rights){
            $source_attribute = $rights->get_source_attribute($C, $id);
        }
        my $namespace = Identifier::the_namespace( $id );
        $content_provider = $namespace; # default
        if ( -f qq{$ENV{SDRROOT}/watermarks/config.txt} ) {
            @watermark_config = File::Slurp::read_file(qq{$ENV{SDRROOT}/watermarks/config.txt});
            my ( $line ) = grep(/^$namespace\|$source_attribute\|/, @watermark_config); chomp $line;
            if ( $line ) {
                my @config = split(/\|/, $line);
                $content_provider = $config[3];
            }
        }
    }

    return $content_provider;
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

    # Even HT affiliates can only see the POD link to a PDUS on US
    # soil.
    my $id = $C->get_object('CGI')->param('id');
    my $allow_pod = ($C->get_object('Access::Rights')->get_POD_access_status($C, $id) eq 'allow');

    my $url = '';

    if ($allow_pod) {
        my $dbh = $C->get_object('Database')->get_DBH($C);

        my $statement = qq{SELECT url FROM pod WHERE id=? LIMIT 1};
        my $sth = DbUtils::prep_n_execute($dbh, $statement, $id);

        $url = $sth->fetchrow_array();
        $url = Utils::xml_escape_url_separators($url);
    }

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

sub handle_QVAL_ENCODED_PI
    : PI_handler(QVAL_ENCODED)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $sess = $C->get_object('Session');
    my $qval = $sess->get_transient('qvalsHash');
    return CGI::escape($qval);
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

    my $ar = $C->get_object('Access::Rights');
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

=item handle_VERSION_LABEL_PI : PI_handler(VERSION_LABEL)

Handler for VERSION_LABEL

=cut

# ---------------------------------------------------------------------
sub handle_VERSION_LABEL_PI
    : PI_handler(VERSION_LABEL)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');

    # massage for final output: we get 2010-09-28T13:43:24 but want
    # 2010-09-28 17:43 UTC
    my ($ver, $deleted) = $mdpItem->Version();
    my $version = ($deleted ? 'Deleted ' : '') . iso_UTC_Time(unix_Time($ver));

    return $version;
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

=item handle_VOLUME_CURRENT_TITLE_FRAGMENT_PI : PI_handler(VOLUME_CURRENT_TITLE_FRAGMENT)

Handler for VOLUME_CURRENT_TITLE_FRAGMENT

=cut

# ---------------------------------------------------------------------
sub handle_VOLUME_CURRENT_TITLE_FRAGMENT_PI
    : PI_handler(VOLUME_CURRENT_TITLE_FRAGMENT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $frag = $C->get_object('MdpItem')->GetVolumeData();
    return $frag;
}

# ---------------------------------------------------------------------

=item handle_VOLUME_TITLE_PI : PI_handler(VOLUME_TITLE)

Handler for VOLUME_TITLE

=cut

# ---------------------------------------------------------------------
sub handle_VOLUME_TITLE_PI
    : PI_handler(VOLUME_TITLE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $title = $C->get_object('MdpItem')->GetFullTitle();
    return $title;
}

# ---------------------------------------------------------------------

=item handle_ITEM_FORMAT_PI : PI_handler(ITEM_FORMAT)

Handler for ITEM_FORMAT

=cut

# ---------------------------------------------------------------------
sub handle_ITEM_FORMAT_PI
    : PI_handler(ITEM_FORMAT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $format = $C->get_object('MdpItem')->GetFormat();
    return $format;
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
    return $mdpItem->MetadataFailure() ? 'true' : 'false';
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
    my $auth = $C->get_object('Auth');

    my $CS = CollectionSet->new($dbh, $config, $auth) ;
    my $coll_hashref = $CS->get_coll_data_from_user_id($auth);

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

    my $auth = $C->get_object('Auth');
    my $co = $C->get_object('Collection');

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $coll_list;
    if ($co->item_exists($id))
    {
        my $coll_data_arrayref =
            $co->get_coll_data_for_item_and_user($id, $auth);

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
    my $id = $cgi->param('id');

    my (%coll_names, @coll_vals);

    # Put default items into the list
    # push(@coll_vals, 'a');
    # $coll_names{'a'} = 'Select Collection';
    # push(@coll_vals, 'b');
    # $coll_names{'b'} = '[CREATE NEW COLLECTION]';

    # Get list of collections owned by user
    my $auth = $C->get_object('Auth');
    my $coll_data_arrayref = $cs->get_coll_data_from_user_id($auth);

    # Add collections not containing the item to the pulldown.  If the
    # item has never been added by anyone it will not 'exist' so it will
    # be ok to show all this user's collections as in the pulldown
    my $item_exists = $co->item_exists($id);
    foreach my $coll_hashref (@$coll_data_arrayref)
    {
        if ((! $item_exists)
            ||
            (! $co->item_in_collection($id, $$coll_hashref{'MColl_ID'})))
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
    my $auth = $C->get_object('Auth');
    my $ssd_authenticated = $auth->get_eduPersonEntitlement_print_disabled($C);

    return $ssd_authenticated ? 'true' : 'false';
}

sub handle_ACCESS_TYPE_PI
    : PI_handler(ACCESS_TYPE)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $rights = $C->get_object('Access::Rights');
    my $mdpItem = $C->get_object('MdpItem');
    my $id = $mdpItem->GetId();
    my $xml = '';
    my $access_type = $rights->get_access_type($C, 1);
    my $rights_attribute = $rights->get_rights_attribute($C, $id);
    my $initial_access_type =
        $rights->check_initial_access_status_by_attribute($C, $rights_attribute, $id);

    if ( $access_type eq 'enhanced_text_user' ) {
        $xml .= qq{<Name>$access_type</Name>};
    }

    if ( 
        ( $access_type eq 'emergency_access_affiliate' && $initial_access_type =~ m,emergency_access, ) 
        ||
        ( $access_type eq 'in_library_user' && $initial_access_type =~ m,allow_by_held, ) 
    )
        {

        $xml .= q{<Name>} . $access_type . q{</Name>};

        my ( $granted, $owner, $expires ) = $rights->get_exclusivity($C);
        $granted = $granted ? 'TRUE' : 'FALSE';

        $xml .= qq{<Granted>$granted</Granted>};

        my $action_url;
        if ( $granted eq 'FALSE' ) {
            my $available = Auth::Exclusive::check_available_grants($C, $id);

            if ( $available ) {
                my $tempCgi = new CGI();
                $tempCgi->param('a', 'checkout');
                $action_url = Utils::url_to($tempCgi, "/cgi/pt");
                $xml .= qq{<Action>$action_url</Action>};
            }
            $available = $available ? 'TRUE' : 'FALSE';
            $xml .= qq{<Available>$available</Available>};
        } else {
            my $expires_seconds = Utils::Time::unix_Time($expires);
            $xml .= qq{<Expires>$expires_seconds</Expires>};

            my $tempCgi = new CGI();
            $tempCgi->param('a', 'release');
            $action_url = Utils::url_to($tempCgi, "/cgi/pt");
            $xml .= qq{<Action>$action_url</Action>};
        }
    }

    return $xml;
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

# ---------------------------------------------------------------------

=item handle_VIEW_TYPE_FULL_PDF_LINK_PI : PI_handler(VIEW_TYPE_FULL_PDF_LINK)

Handler for VIEW_TYPE_FULL_PDF_LINK.  In the absence of authentication
as a HathiTrust affilliate, this PI is a link to the WAYF.

=cut

# ---------------------------------------------------------------------
sub handle_VIEW_TYPE_FULL_PDF_LINK_PI
    : PI_handler(VIEW_TYPE_FULL_PDF_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $href;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    my $status = $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
    if ($status eq 'allow') {
        $href = BuildViewTypeUrl($cgi, 'fpdf');
    }
    else {
        my $return_to_url = $cgi->self_url;
        my $auth = $C->get_object('Auth');
        $href = $auth->get_WAYF_login_href($C, $return_to_url);
        if ($cgi->param('skin') eq 'mobile') {
            $href .= ';skin=mobilewayf';
        }
    }

    return $href;
}

sub handle_VIEW_TYPE_FULL_EPUB_LINK_PI
    : PI_handler(VIEW_TYPE_FULL_EPUB_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $href;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    my $status = $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
    if ($status eq 'allow') {
        $href = BuildViewTypeUrl($cgi, 'epub');
    }
    else {
        my $return_to_url = $cgi->self_url;
        my $auth = $C->get_object('Auth');
        $href = $auth->get_WAYF_login_href($C, $return_to_url);
        if ($cgi->param('skin') eq 'mobile') {
            $href .= ';skin=mobilewayf';
        }
    }

    return $href;
}

sub handle_VIEW_TYPE_REMEDIATED_FILES_LINKS_PI
    : PI_handler(VIEW_TYPE_REMEDIATED_FILES_LINKS)
{

    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $finalAccessStatus =
        $C->get_object('Access::Rights')->get_remediated_items_access_status($C, $id);

    if ( $finalAccessStatus ne 'allow' ) {
        return '';
    }

    my $dbh = $C->get_object('Database')->get_DBH;

    my $retval = '';
    my $links = $dbh->selectall_arrayref(qq{SELECT * FROM emma_items WHERE original_item_id = ?}, {Slice=>{}}, $id);
    if ( scalar @$links ) {
        foreach my $link ( @$links ) {
            my $label = $$link{rem_coverage};
            if ( $$link{dc_format} ) {
                $label .= " (" . uc $$link{dc_format} . ")";
            }
            my $remediation;
            if ( $$link{rem_remediation} ) {
                my @tmp = split(/\n/, $$link{rem_remediation});
                $remediation = "<p>" . join("</p><p>", @tmp) . "</p>";
            }
            $retval .= <<XML;
<View name="remediated">
    <Link>/cgi/imgsrv/download/remediated?id=$id;remediated_item_id=$$link{remediated_item_id}</Link>
    <Format>$$link{dc_format}</Format>
    <Coverage>$$link{rem_coverage}</Coverage>
    <Label>$label</Label>
    <Remediation>$remediation</Remediation>
</View>
XML
        }
    } else {
        $retval .= q{<NOP></NOP>};
    }

    return $retval;

}

#
# ---------------------------------------------------------------------

=item handle_ALLOW_FULL_PDF_PI : PI_handler(ALLOW_FULL_PDF)

Handler for ALLOW_FULL_PDF.

=cut

# ---------------------------------------------------------------------
sub handle_ALLOW_SINGLE_PAGE_PDF_PI
    : PI_handler(ALLOW_SINGLE_PAGE_PDF)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    return $C->get_object('Access::Rights')->get_single_page_PDF_access_status($C, $id);
}

#
# ---------------------------------------------------------------------

=item handle_ALLOW_FULL_PDF_PI : PI_handler(ALLOW_FULL_PDF)

Handler for ALLOW_FULL_PDF.

=cut

# ---------------------------------------------------------------------
sub handle_ALLOW_FULL_PDF_PI
    : PI_handler(ALLOW_FULL_PDF)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    return $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
}

# ---------------------------------------------------------------------

=item handle_FULL_PDF_ACCESS_MESSAGE_PI : PI_handler(FULL_PDF_ACCESS_MESSAGE)

Handler for FULL_PDF_ACCESS_MESSAGE. Returns the reason that full book PDF
download is not available.

=cut

# ---------------------------------------------------------------------
sub handle_FULL_PDF_ACCESS_MESSAGE_PI
    : PI_handler(FULL_PDF_ACCESS_MESSAGE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my ( $message, $status ) = $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
    return $message;
}

sub handle_DOWNLOAD_PROGRESS_BASE
    : PI_handler(DOWNLOAD_PROGRESS_BASE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $config = $C->get_object('MdpConfig');
    my $cache_dir = $config->get('download_progress_base');
    my $true_cache_component = ($ENV{SDRVIEW} eq 'full') ? 'cache-full' : 'cache';
    $cache_dir =~ s,___CACHE___,$true_cache_component,;

    return $cache_dir;
}

sub handle_IN_ITEM_SEARCH_RESULTS_LINK
    : PI_handler(IN_ITEM_SEARCH_RESULTS_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    if ( my $referer = $ses->get_transient('ptsearch_referer') ) {
        $referer =~ s,&,&amp;,g;
        return $referer;
    }
}

sub handle_SEARCH_RESULTS_LINK_PI
    : PI_handler(SEARCH_RESULTS_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $script_name = $cgi->script_name;

    my $href;
    if ( my $referer = $ses->get_transient('referer') ) {
        $href = $referer;
        $href =~ s,&,&amp;,g;
    } elsif ( $script_name !~ m,/search, ) {
        # $script_name at this point is /pt/cgi/search NOT /cgi/pt/search
        $href = BuildSearchResultsUrl($cgi);
    } else {
        # check the original CGI parameters before
        # Prolog added default seq, etc.
        my $tempCgi = new CGI();
        if ( $tempCgi->param('seq') ) {
            $href = Utils::url_to($cgi, $PTGlobals::gPageturnerCgiRoot);
        }
    }

    $href = '' if ( $href =~ m,/cgi/pt, );

    return $href;
}

sub handle_SEARCH_RESULTS_LABEL_PI
    : PI_handler(SEARCH_RESULTS_LABEL)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $script_name = $cgi->script_name;

    my $label;
    if ( my $referer = $ses->get_transient('referer') ) {
        if ( $referer =~ m,$PTGlobals::gCatalogSearchPattern, ) {
            $label = qq{catalog search results};
        } elsif ( $referer =~ m,$PTGlobals::gCatalogRecordPattern, ) {
            $label = qq{catalog record};
        } elsif ( $referer =~ m,$PTGlobals::gCollectionBuilderPattern, ) {
            $label = qq{collection};
            my $co = $C->get_object('Collection');
            my ( $collid ) = ( $referer =~ m,c=(\d+), );
            if ( $collid ) {
                my $collname = $co->get_coll_name($collid);
                $collname =~ s,^\s+,,; $collname =~ s,\s+$,,;
                ## $label = qq{&#x201c;$collname&#x201d; collection};
                $label = qq{<em>$collname</em> $label};
            }

        } elsif ( $referer =~ m,$PTGlobals::gLsSearchCgiRoot, ) {
            $label = qq{"Full text search" results};
        }
    } elsif ( $cgi->param('q1') ) {
        # $script_name at this point is /pt/cgi/search NOT /cgi/pt/search
        if ( $script_name !~ m,/search, ) {
            $label = qq{"Search in this text" results};
        } elsif ( $cgi->param('seq') ) {
            $label = qq{page};
        }
    }

    return $label;
}

sub handle_HEADER_SEARCH_FIELDS_PI
    : PI_handler(HEADER_SEARCH_FIELDS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');

    my $script_name = $cgi->script_name;

    my $q1; my $searchtype = 'all'; my $target;
    if ( my $referer = $ses->get_transient('referer') ) {
        if ( $referer =~ m,$PTGlobals::gCatalogSearchPattern, ) {
            ( $q1, $searchtype, $ft ) = ExtractCatalogParams($referer);
            $target = 'catalog';
        } elsif ( $referer =~ m,$PTGlobals::gCatalogRecordPattern, ) {
            ( $q1, $searchtype, $ft ) = ExtractCatalogParams($referer);
            $target = 'catalog';
        } elsif ( $referer =~ m,$PTGlobals::gLsSearchCgiRoot, ) {
            $target = 'ls';
            ( $q1, $searchtype, $ft ) = ExtractLSParams($referer);
        }
    } elsif ( $cgi->param('q1') ) {
        # $script_name at this point is /pt/cgi/search NOT /cgi/pt/search
    }

    my $xml;

    if ( $q1 || $target ) {

        if ( $q1 ) {
            Utils::map_chars_to_cers(\$q1, [qq{"}, qq{'}]);
            Utils::remove_invalid_xml_chars(\$q1);
        }
        $xml = qq{<HeaderSearchParams>};
        $xml .= wrap_string_in_tag($q1, 'Field', [['name', "q1" ]]);
        $xml .= wrap_string_in_tag($searchtype, 'Field', [['name', "searchtype" ]]);
        $xml .= wrap_string_in_tag($target, 'Field', [['name', "target" ]]);
        $xml .= wrap_string_in_tag($ft, 'Field', [['name', "ft" ]]);
        $xml .= qq{</HeaderSearchParams>};

    }

    return $xml;
}

sub handle_SETUP_APPLICATION_PARAMS_PI
    : PI_handler(SETUP_APPLICATION_PARAMS)
{
    my ($C, $act, $piParamHashRef) = @_;


    my $cgi = $C->get_object('CGI');

    my $xml = [ 'HT.params = {};'];
    foreach my $param ( qw(id view size orient seq debug q1 skin l11_tracking l11_uid ui) ) {
        my $v = $cgi->param($param);
        if ( defined $v ) {
            if ( $param =~ m/size|orient|seq/ ) {
                $v =~ s,[^\d]+,,g;
                push @$xml, qq{HT.params.$param = $v;} if ( $v ne '' );
            } else {
                $v =~ s,\',\\',gsm;
                push @$xml, qq{HT.params.$param = '$v';}
            }
        }
    }

    $xml = join("\n", @$xml);
    return $xml;
}

# ---------------------------------------------------------------------

=item handle_IN_COPYRIGHT_PI : PI_handler(IN_COPYRIGHT)

Description

=cut

# ---------------------------------------------------------------------
sub handle_IN_COPYRIGHT_PI
  : PI_handler(IN_COPYRIGHT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    if ($C->get_object('Access::Rights')->in_copyright($C, $id)) {
        return 'true';
    }
    return 'false';
}

sub handle_GOOGLE_BOOK_LINK
    : PI_handler(GOOGLE_BOOK_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $id = $C->get_object('CGI')->param('id');
    my $book_id = Namespaces::get_google_id_by_namespace($C, $id);
    if ( $book_id ) {
        return qq{<Link service="google" href="https://books.google.com/books?vid=$book_id">Google Books</Link>};
    }
    return '';
}

sub ExtractLSParams {
    my ( $referer ) = @_;
    my ( $q1, $searchtype, $ft );

    local $URI::DEFAULT_QUERY_FORM_DELIMITER = ';';

    my $uri = URI->new($referer);
    %params = $uri->query_form();

    $ft = 'checked';

    # don't bother if we detect q2
    unless ( $params{'q2'} ) {
        $q1 = $params{'q1'};

        utf8::decode($q1);
        $searchtype = $params{'field1'} || 'all';
    }
    $ft = $params{'lmt'} eq 'ft' ? 'checked' : '';

    return ( $q1, $searchtype, $ft );
}

sub ExtractCatalogParams {
    my ( $referer ) = @_;
    my ( $q1, $searchtype, $ft );

    $ft = 'checked';

    $referer =~ s,\[\],,gsm;
    $referer =~ s,%5B%5D,,gsm;

    my $uri = URI->new($referer);
    my %params = $uri->query_form();

    # advanced search, punt
    unless ( $params{'adv'} ) {
        $q1 = $params{'lookfor'};
        utf8::decode($q1);
        $searchtype = $params{'type'} || $params{'searchtype'} || 'all';
    }
    $ft = $params{'ft'} eq 'ft' ? 'checked' : '';


    # my ( $q1 ) = ( $url =~ m,.*lookfor=([^;&]+).*, );
    # my ( $searchtype ) = ( $url =~ m,.*?.*type=([^;&]+), ) || 'all';
    # my ( $ft ) = ( $url =~ m,htftonly=true, ) ? 'checked' : '';
    # unless ( $ft ) {
    #   ( $ft ) = ( $url =~ m,ft=ft, ) ? 'checked' : '';
    # }
    return ( $q1, $searchtype, $ft );
}

sub BuildSearchResultsUrl
{
    my ( $cgi, $view ) = @_;

    my $href;

    if ( $cgi->param('q1') ) {
        my $tempCgi;
        $tempCgi = new CGI( $cgi );
        $tempCgi->param('page', 'search');
        $tempCgi->delete('view');
        $href = Utils::url_to($tempCgi, $PTGlobals::gPageturnerSearchCgiRoot);
    }

    return $href;
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
