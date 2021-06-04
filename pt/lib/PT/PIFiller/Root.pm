package PT::PIFiller::Root;

=head1 NAME

PIFiller::Root (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the Root pageturner action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use List::MoreUtils qw(firstidx);

use Utils;
use Utils::Time;
use Utils::Date;
use Identifier;
use Survey;

use base qw(PIFiller);

use PT::PIFiller::Common;

use HTML::Entities qw();
use JSON::XS qw(encode_json);

use Utils::Cache::JSON;


# ---------------------------------------------------------------------

=item BuildRotateLink

Description

=cut

# ---------------------------------------------------------------------
sub BuildRotateLink
{
    my ( $cgi, $mdpItem, $direction ) = @_;

    my $toReturn = '';

    return '' if ( $cgi->param('view') eq 'plaintext' );

    my $id  = $cgi->param( 'id' );
    my $seq = $mdpItem->GetRequestedPageSequence( 'seq' );

    my $currentOrientation = $mdpItem->GetOrientationForIdSequence( $id, $seq );
    my $tempCgi = new CGI( $cgi );
    my $value;
    if ( $direction eq 'clockwise' )
    {
        $value = ( $currentOrientation + 1 ) % 4;
    }
    elsif ( $direction eq 'counterclockwise' )
    {
        $value = ( $currentOrientation - 1 ) % 4;
    }
    else
    {
        ASSERT( 0, qq{BuildRotateLink called with invalid parameters});
    }
    $tempCgi->param( 'orient', $value );

    return Utils::url_to($tempCgi);
}

sub BuildResizeLink
{
    my ( $cgi, $mdpItem, $direction ) = @_;

    my $toReturn = '';
    return '' if ( $cgi->param('view') eq 'plaintext' );

    my $id  = $cgi->param( 'id' );
    my $seq = $mdpItem->GetRequestedPageSequence( 'seq' );

    my $requestedSize = $mdpItem->GetRequestedSize();
    my $default = $requestedSize;

    # sort numerically
    my @valuesList = sort { $a <=> $b } keys( %PTGlobals::gSizes );
    my $idx = firstidx { $_ eq $requestedSize } @valuesList;

    my $tempCgi = new CGI( $cgi );
    my $value;
    if ( $direction eq 'in' )
    {
        $idx += 1;
    }
    elsif ( $direction eq 'out' )
    {
        $idx -= 1;
    }
    else
    {
        ASSERT( 0, qq{BuildRotateLink called with invalid parameters});
    }

    if ( $idx < 0 ) { $idx = 0; }
    elsif ( $idx == scalar @valuesList ) { $idx -= 1; }

    $tempCgi->param( 'size', $valuesList[$idx] );

    return Utils::url_to($tempCgi);
}

# ---------------------------------------------------------------------

=item BuildPageNavLink

Description

=cut

# ---------------------------------------------------------------------
sub BuildPageNavLink
{
    my ( $cgi, $mdpItem, $page ) = @_;

    my $toReturn = '';
    my $returnValueFlag = 'true';
    my $tempCgi = new CGI( $cgi );

    $tempCgi->delete( 'orient' );
    $tempCgi->delete( 'seq' );
    $tempCgi->delete( 'num' );
    $tempCgi->delete( 'u' );

    my $currentSeq = $mdpItem->GetRequestedPageSequence();
    my $pageValue;

    if ( $page eq 'first' )
    {
        $pageValue = $mdpItem->GetFirstPageSequence();
        if ( $currentSeq == $pageValue ) {
            $returnValueFlag = undef;
        }
    }
    elsif ( $page eq 'previous' )
    {
        if ( $currentSeq - 1 < $mdpItem->GetFirstPageSequence() )
        {     $returnValueFlag = undef;  }
        else
        {     $pageValue = $currentSeq - 1;  }
    }
    elsif ( $page eq 'next' )
    {
        if ( $currentSeq + 1 > $mdpItem->GetLastPageSequence() )
        {     $returnValueFlag = undef;     }
        else
        {     $pageValue = $currentSeq + 1;  }
    }
    elsif ( $page eq 'last' )
    {
        $pageValue = $mdpItem->GetLastPageSequence();
        if ( $currentSeq == $pageValue ) {
            $returnValueFlag = undef;
        }
    }
    else
    {
    }

    $returnValueFlag = 'true' if ( $cgi->param('view') =~ m,1up|2up|thumb, );

    if ( $returnValueFlag )
    {
        $tempCgi->param( 'seq', $pageValue );
        my $pageNumber =  $mdpItem->GetPageNumBySequence( $pageValue );
        $tempCgi->param( 'num', $pageNumber )
            if ( $pageNumber );

        $toReturn = Utils::url_to($tempCgi);
    }

    return $toReturn;

}

sub BuildImageServerImageUrl
{
    my ( $cgi ) = @_;

    my $tempCgi = new CGI ("");

    my $path;
    my $action = 'image';
    # copy params
    foreach my $p (qw(id orient size attr src u seq num)) {
        $tempCgi->param($p, scalar $cgi->param($p));
    }

    if ( $cgi->param('debug') ) {
        $tempCgi->param('debug', scalar $cgi->param('debug'));
    }

    my $href = Utils::url_to($tempCgi, $PTGlobals::gImgsrvCgiRoot . "/$action");
    return $href;
}



# ---------------------------  Handlers  ------------------------------
#
# ---------------------------------------------------------------------

# ---------------------------------------------------------------------

=item handle_ITEM_STYLESHEET_PI : PI_handler(ITEM_STYLESHEET)

Description

=cut
# ---------------------------------------------------------------------
sub handle_ITEM_STYLESHEET_PI
  : PI_handler(ITEM_STYLESHEET)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $item_type = PT::PIFiller::Common::GetItemType($C);
    my $item_sub_type = PT::PIFiller::Common::GetItemSubType($C);
    if ( $item_sub_type ) { $item_type .= "_$item_sub_type"; }
    my $xml = qq{<Filename>pageviewer_${item_type}.xsl</Filename>};
    return $xml;
}

sub handle_ITEM_CHUNK_PI
  : PI_handler(ITEM_CHUNK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $item_type = PT::PIFiller::Common::GetItemType($C);
    my $item_sub_type = PT::PIFiller::Common::GetItemSubType($C);
    if ( $item_sub_type ) { $item_type .= "_$item_sub_type"; }
    my $xml = qq{<?CHUNK filename="_pageviewer_${item_type}.xml"?>};
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


# ---------------------------------------------------------------------

=item handle_CURRENT_PAGE_IMG_SRC_PI : PI_handler(CURRENT_PAGE_IMG_SRC)

Handler for CURRENT_PAGE_IMG_SRC

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_PAGE_IMG_SRC_PI
    : PI_handler(CURRENT_PAGE_IMG_SRC)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    my $cgi = $C->get_object('CGI');

    my $href = '';

    if ( $finalAccessStatus eq 'allow' )
    {
        $href = BuildImageServerImageUrl($cgi);
    }

    return $href;
}

sub handle_CURRENT_PAGE_IMG_WIDTH_PI
    : PI_handler(CURRENT_PAGE_IMG_WIDTH)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');

    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    my $value = '';

    if ( $finalAccessStatus eq 'allow' ) {
        $value = $C->get_object('MdpItem')->GetTargetImageFileInfo()->{width};
    }

    return $value;
}

sub handle_CURRENT_PAGE_IMG_HEIGHT_PI
    : PI_handler(CURRENT_PAGE_IMG_HEIGHT)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $value = '';

    my $finalAccessStatus =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ( $finalAccessStatus eq 'allow' ) {
        $value = $C->get_object('MdpItem')->GetTargetImageFileInfo()->{height};
    }

    return $value;
}

# ---------------------------------------------------------------------

=item handle_DEFAULT_COLLID_PI : PI_handler(DEFAULT_COLLID)

Handler for DEFAULT_COLLID

=cut

# ---------------------------------------------------------------------
sub handle_DEFAULT_COLLID_PI
    : PI_handler(DEFAULT_COLLID)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $to_collid = $ses->get_persistent('last_to_collid');

    return (wrap_string_in_tag( $to_collid, 'DefaultCollid' ));
}

# ---------------------------------------------------------------------

=item handle_SECTION_108_PI : PI_handler(SECTION_108)

Handler for SECTION_108 Note that this handler depends on
Access::Rights::assert_final_access_status having been called already to
set the exclusivity data. This happens in the main script for pt,
ptsearch and ssd.

=cut

# ---------------------------------------------------------------------
sub handle_SECTION_108_PI
    : PI_handler(SECTION_108)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ar = $C->get_object('Access::Rights');
    my ($granted, $owner, $expires) = $ar->get_exclusivity($C);

    my $date = Utils::Time::friendly_iso_Time($expires, 'date');
    $date =~ s/,.*//; # strip year
    my $time = Utils::Time::friendly_iso_Time($expires, 'time');
    $time =~ s,(\d+:\d+):\d+( .*),$1$2,;

    my $expiration = "$date at $time";

    return (
            wrap_string_in_tag($granted, 'Granted') .
            wrap_string_in_tag($owner, 'Owner') .
            wrap_string_in_tag($expiration, 'Expires')
           );
}


# ---------------------------------------------------------------------

=item handle_CURRENT_PAGE_FEATURES_PI : PI_handler(CURRENT_PAGE_FEATURES)

Handler for CURRENT_PAGE_FEATURES

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_PAGE_FEATURES_PI
    : PI_handler(CURRENT_PAGE_FEATURES)
{
    my ($C, $act, $piParamHashRef) = @_;


    my $mdpItem = $C->get_object('MdpItem');
    my $seq = $mdpItem->GetRequestedPageSequence() || 1;

    my $pageFeatureXML = '';
    my @pageFeatures = $mdpItem->GetPageFeatures( $seq );

    foreach my $feature ( @pageFeatures )
    {
        $pageFeatureXML .= wrap_string_in_tag($feature, 'Feature');
    }

    return $pageFeatureXML;
}

# ---------------------------------------------------------------------

=item handle_CURRENT_PAGE_OCR_PI : PI_handler(CURRENT_PAGE_OCR)

Handler for CURRENT_PAGE_OCR

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_PAGE_OCR_PI
    : PI_handler(CURRENT_PAGE_OCR)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    return $mdpItem->GetOcrTextRef();
}

# ---------------------------------------------------------------------

=item handle_ORPHAN_CANDIDATE_PI : PI_handler(ORPHAN_CANDIDATE)

Handler for ORPHAN_CANDIDATE

=cut

# ---------------------------------------------------------------------
sub handle_ORPHAN_CANDIDATE_PI
    : PI_handler(ORPHAN_CANDIDATE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $is_orphcand = $C->get_object('Access::Rights')->orphan_candidate($C, $id);

    return $is_orphcand ? 'true' : 'false';
}


# ---------------------------------------------------------------------

=item handle_CURRENT_VIEW_PI : PI_handler(CURRENT_VIEW)

Handler for CURRENT_VIEW

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_VIEW_PI
    : PI_handler(CURRENT_VIEW)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    return $mdpItem->GetRequestedView();
}



# ---------------------------------------------------------------------

=item handle_VIEW_TYPE_VALUES_PI : PI_handler(VIEW_TYPE_VALUES)

Handler for VIEW_TYPE_VALUES

=cut

# ---------------------------------------------------------------------
sub handle_VIEW_TYPE_VALUES_PI
    : PI_handler(VIEW_TYPE_VALUES)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $default = $C->get_object('MdpItem')->GetRequestedView();
    my @view_types = @PTGlobals::gViewTypes;

    my $id = $C->get_object('CGI')->param('id');
    my $status = $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
    if ($status eq 'allow') {
        @view_types = (@view_types, @PTGlobals::gAuthdViewTypes);
    }

    if (! grep(/^$default$/, @view_types)) {
        $default = $PTGlobals::gDefaultView;
    }

    my $select = Utils::build_HTML_pulldown_XML('view',
                                                     \@view_types,
                                                     undef,
                                                     $default);
    return $select;
}

# ---------------------------------------------------------------------

=item handle_VIEW_TYPE_TEXT_LINK_PI : PI_handler(VIEW_TYPE_TEXT_LINK)

Handler for VIEW_TYPE_TEXT_LINK

=cut

# ---------------------------------------------------------------------
sub handle_VIEW_TYPE_TEXT_LINK_PI
    : PI_handler(VIEW_TYPE_TEXT_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, 'text');
}

sub handle_VIEW_TYPE_PLAINTEXT_LINK_PI
    : PI_handler(VIEW_TYPE_PLAINTEXT_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, 'plaintext');
}

sub handle_VIEW_TYPE_2UP_LINK_PI
    : PI_handler(VIEW_TYPE_2UP_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, '2up');
}

sub handle_VIEW_TYPE_1UP_LINK_PI
    : PI_handler(VIEW_TYPE_1UP_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, '1up');
}

sub handle_VIEW_TYPE_THUMBNAIL_LINK_PI
    : PI_handler(VIEW_TYPE_THUMBNAIL_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, 'thumb');
}


# ---------------------------------------------------------------------

=item handle_VIEW_TYPE_IMAGE_LINK_PI : PI_handler(VIEW_TYPE_IMAGE_LINK)

Handler for VIEW_TYPE_IMAGE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_VIEW_TYPE_IMAGE_LINK_PI
    : PI_handler(VIEW_TYPE_IMAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, 'image');
}

# ---------------------------------------------------------------------

=item handle_VIEW_TYPE_PDF_LINK_PI : PI_handler(VIEW_TYPE_PDF_LINK)

Handler for VIEW_TYPE_PDF_LINK

=cut

# ---------------------------------------------------------------------
sub handle_VIEW_TYPE_PDF_LINK_PI
    : PI_handler(VIEW_TYPE_PDF_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return PT::PIFiller::Common::BuildViewTypeUrl($cgi, 'pdf');
}

sub handle_URL_ROOTS_PI
    : PI_handler(URL_ROOTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $toReturn = '';
    $toReturn .= wrap_string_in_tag( $PTGlobals::gCollectionBuilderCgiRoot, 'Variable', [ [ 'name', 'cgi/mb' ] ] );
    $toReturn .= wrap_string_in_tag( $PTGlobals::gPageturnerCgiRoot, 'Variable', [ [ 'name', 'cgi/pt' ] ] );
    $toReturn .= wrap_string_in_tag( $PTGlobals::gImgsrvCgiRoot, 'Variable', [ [ 'name', 'cgi/imgsrv' ] ] );
    $toReturn .= wrap_string_in_tag( $PTGlobals::gPageturnerSearchCgiRoot, 'Variable', [ [ 'name', 'cgi/ptsearch' ] ] );

    return $toReturn;
}


# ---------------------------------------------------------------------

=item handle_RESIZE_VALUES_PI : PI_handler(RESIZE_VALUES)

Handler for RESIZE_VALUES

=cut

# ---------------------------------------------------------------------
sub handle_RESIZE_VALUES_PI
    : PI_handler(RESIZE_VALUES)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    my $requestedSize = $mdpItem->GetRequestedSize();

    my $default = $requestedSize;

    # sort numerically
    my @valuesList = sort { $a <=> $b } keys( %PTGlobals::gSizes );
    my $select = Utils::build_HTML_pulldown_XML('size',
                                                     \@valuesList,
                                                     \%PTGlobals::gSizeLabels,,
                                                     $default, undef);
    return $select;
}

sub handle_RESIZE_IN_LINK_PI
    : PI_handler(RESIZE_IN_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');
    my $requestedSize = $mdpItem->GetRequestedSize();

    return BuildResizeLink($cgi, $mdpItem, 'in');
}

sub handle_RESIZE_OUT_LINK_PI
    : PI_handler(RESIZE_OUT_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');
    my $requestedSize = $mdpItem->GetRequestedSize();

    return BuildResizeLink($cgi, $mdpItem, 'out');
}

# ---------------------------------------------------------------------

=item handle_CLOCKWISE_LINK_PI : PI_handler(CLOCKWISE_LINK)

Handler for CLOCKWISE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_CLOCKWISE_LINK_PI
    : PI_handler(CLOCKWISE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildRotateLink($cgi, $mdpItem, 'clockwise');
}


# ---------------------------------------------------------------------

=item handle_COUNTER_CLOCKWISE_LINK_PI : PI_handler(COUNTER_CLOCKWISE_LINK)

Handler for COUNTER_CLOCKWISE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_COUNTER_CLOCKWISE_LINK_PI
    : PI_handler(COUNTER_CLOCKWISE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildRotateLink($cgi, $mdpItem, 'counterclockwise');
}


# ---------------------------------------------------------------------

=item handle_HIDDEN_SEQUENCE_PI : PI_handler(HIDDEN_SEQUENCE)

Handler for HIDDEN_SEQUENCE

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_SEQUENCE_PI
    : PI_handler(HIDDEN_SEQUENCE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $form = $$piParamHashRef{'form'};

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');
    my $defaultSeq = $cgi->param( 'seq' ) ? $cgi->param( 'seq' ) : 1;

    my $sequence;

    if ($form eq 'PageXofYForm' ) {
        # Sequence number is a function of the user-entered number
        # from the go-to page form
        my $num = $cgi->param( 'num' );
        $sequence = $mdpItem->GetSequenceForPageNumber( $num, $defaultSeq );
    }
    else {
        # Sequence number is the defaultSeq number
        $sequence = $defaultSeq;
    }


    return wrap_string_in_tag( $sequence, 'Variable', [ [ 'name', 'seq' ] ] );
}

# ---------------------------------------------------------------------

=item handle_HIDDEN_NUM_PI : PI_handler(HIDDEN_NUM)

Handler for HIDDEN_NUM

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_NUM_PI
    : PI_handler(HIDDEN_NUM)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return Utils::build_hidden_var_XML($cgi, 'num');
}


# ---------------------------------------------------------------------

=item handle_HIDDEN_VIEW_TYPE_PI : PI_handler(HIDDEN_VIEW_TYPE)

Handler for HIDDEN_VIEW_TYPE

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_VIEW_TYPE_PI
    : PI_handler(HIDDEN_VIEW_TYPE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return Utils::build_hidden_var_XML($cgi, 'view');
}




# ---------------------------------------------------------------------

=item handle_HIDDEN_SIZE_PI : PI_handler(HIDDEN_SIZE)

Handler for HIDDEN_SIZE

=cut

# ---------------------------------------------------------------------
sub handle_HIDDEN_SIZE_PI
    : PI_handler(HIDDEN_SIZE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return Utils::build_hidden_var_XML($cgi, 'size');
}

# ---------------------------------------------------------------------

=item handle_FIRST_PAGE_LINK_PI : PI_handler(FIRST_PAGE_LINK)

Handler for FIRST_PAGE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_FIRST_PAGE_LINK_PI
    : PI_handler(FIRST_PAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildPageNavLink($cgi, $mdpItem, 'first');
}

# ---------------------------------------------------------------------

=item handle_PREVIOUS_PAGE_LINK_PI : PI_handler(PREVIOUS_PAGE_LINK)

Handler for PREVIOUS_PAGE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_PREVIOUS_PAGE_LINK_PI
    : PI_handler(PREVIOUS_PAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildPageNavLink($cgi, $mdpItem, 'previous');
}

# ---------------------------------------------------------------------

=item handle_NEXT_PAGE_LINK_PI : PI_handler(NEXT_PAGE_LINK)

Handler for NEXT_PAGE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_NEXT_PAGE_LINK_PI
    : PI_handler(NEXT_PAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildPageNavLink($cgi, $mdpItem, 'next');
}

# ---------------------------------------------------------------------

=item handle_LAST_PAGE_LINK_PI : PI_handler(LAST_PAGE_LINK)

Handler for LAST_PAGE_LINK

=cut

# ---------------------------------------------------------------------
sub handle_LAST_PAGE_LINK_PI
    : PI_handler(LAST_PAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return BuildPageNavLink($cgi, $mdpItem, 'last');
}


sub handle_PAGE_LINK_PI
    : PI_handler(PAGE_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $tempCgi = new CGI($C->get_object('CGI'));
    $tempCgi->delete('q1');
    $tempCgi->delete('start');
    if ( $tempCgi->param('orient') == 0 ) {
        $tempCgi->delete('orient');
    }

    return Utils::url_to($tempCgi);
}

sub handle_EPUB_ROOT_PI
    : PI_handler(EPUB_ROOT)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $mdpItem = $C->get_object('MdpItem');

    my $fileid = $mdpItem->GetPackageId();
    my $epub_filename = $mdpItem->GetFilePathMaybeExtract($fileid, 'epubfile');

    my $unpacked_epub = $epub_filename . "_unpacked";
    unless ( -d $unpacked_epub ) {
        my @unzip;
        my @yes;
        push @yes, "echo", "n";
        my $UNZIP_PROG = "/l/local/bin/unzip";
        push @unzip, $UNZIP_PROG,"-qq", "-d", $unpacked_epub, $epub_filename;
        IPC::Run::run \@yes, '|',  \@unzip, ">", "/dev/null", "2>&1";
    }

    my $unpacked_root = $unpacked_epub . '/';
    $unpacked_root =~ s,$ENV{SDRROOT},,;
    return $unpacked_root;
}

# ---------------------------------------------------------------------
sub handle_BASE_IMAGE_DIMENSIONS
    : PI_handler(BASE_IMAGE_DIMENSIONS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    my $ignore_existing_cache = $cgi->param('newsid') || 1;
    my $cache_key = qq{base_image_dimensions};
    my $cache_max_age = 0;
    my $cache_dir = Utils::get_true_cache_dir($C, 'mdpitem_cache_dir');
    my $cache = Utils::Cache::JSON->new($cache_dir, $cache_max_age, $mdpItem->get_modtime);

    my $info;
    $info = $cache->Get($mdpItem->GetId(), $cache_key) unless ( $ignore_existing_cache );

    unless ( ref($info) ) {

        require Image::ExifTool;


        my $pageinfo_sequence = $mdpItem->Get('pageinfo')->{'sequence'};
        my @items = sort { int($a) <=> int($b) } keys %{ $pageinfo_sequence };

        my ( $use_width, $use_height, $use_filename );
        my $tries = 0;
        while ( ! $use_filename ) {
            my $seq = $items[int(rand(scalar @items))];
            next if ( grep(/MISSING_PAGE/, $mdpItem->GetPageFeatures($seq)) );
            my $filename = $mdpItem->GetFilePathMaybeExtract($seq, 'imagefile');

            # my ( $width, $height, $type_or_error ) = Process::Image::imgsize($filename);
            my $info_ = Image::ExifTool::ImageInfo($filename);
            my ( $width, $height ) = ( $$info_{ImageWidth}, $$info_{ImageHeight} );

            $tries += 1;

            if ( $width < $height && $height > 1024 || $tries > 1) {
                $use_filename = $filename;
                $info = $info_;
                # ( $use_width, $use_height ) = ( $width, $height );
            } else {
                unlink($filename);
            }
        }

        $cache->Set($mdpItem->GetId(), $cache_key, { ImageWidth => $$info{ImageWidth}, ImageHeight => $$info{ImageHeight} }, 1);
    }

    my $use_height = int($$info{ImageHeight} * ( 680.0 / $$info{ImageWidth} ));
    my $use_width = 680;

    return qq{<Width>$use_width</Width><Height>$use_height</Height>};

}

# ---------------------------------------------------------------------
sub handle_FIRST_PAGE_SEQUENCE
    : PI_handler(FIRST_PAGE_SEQUENCE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return $mdpItem->GetFirstPageSequence;

}

# ---------------------------------------------------------------------
sub handle_DEFAULT_SEQ
    : PI_handler(DEFAULT_SEQ)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    my $seq;
    if ( $seq = $mdpItem->HasTitleFeature()) {
        # $cgi->param('seq', $seq );
    }
    elsif ($seq = $mdpItem->HasTOCFeature()) {
        # $cgi->param('seq', $seq );
    } else {
        $seq = 1;
    }

    return $seq;
}

# ---------------------------------------------------------------------
sub handle_READING_ORDER
    : PI_handler(READING_ORDER)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    return $mdpItem->Get('readingOrder');
}

# ---------------------------------------------------------------------
sub handle_FEATURE_LIST_JSON
    : PI_handler(FEATURE_LIST_JSON)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    my $ignore_existing_cache = $cgi->param('newsid') || 0;
    my $cache_key = qq{featureList};
    my $cache_max_age = 0;
    my $cache_dir = Utils::get_true_cache_dir($C, 'mdpitem_cache_dir');
    my $cache = Utils::Cache::JSON->new($cache_dir, $cache_max_age, $mdpItem->get_modtime);

    my $featureList;
    $featureList = $cache->Get($mdpItem->GetId(), $cache_key) unless ( $ignore_existing_cache );
    return '[' . join(',', @$featureList) . ']' if ( ref($featureList) );

    $mdpItem->InitFeatureIterator();
    my $featureRef;

    my $seenFirstTOC = 0;
    my $seenFirstIndex = 0;
    my $seenSection = 0;

    my $json = JSON::XS->new()->utf8(1)->allow_nonref(1);
    my $featureList = [];

    my $pageinfo_sequence = $mdpItem->Get('pageinfo')->{'sequence'};
    my @items = sort { int($a) <=> int($b) } keys %{ $pageinfo_sequence };

    my $i = 0;
    foreach my $seq ( @items ) {
        my $features = [ $mdpItem->GetPageFeatures($seq) ];
        # next unless ( scalar @$features );
        my $pageNum = $$pageinfo_sequence{ $seq }{ 'pagenumber' };
        ## label is trickier
        # my $label = $$featureHashRef{$seqFeature};
        my $label;
        my $feature_map = { map { $_ => 1 } @$features };
        if ( $$feature_map{FIRST_CONTENT_CHAPTER_START} || $$feature_map{'1STPG'} ) {
            $label = $$MdpGlobals::gPageFeatureHashRef{FIRST_CONTENT_CHAPTER_START} . " " . $i++;
            $seenSection = 1;
        } elsif ( $$feature_map{CHAPTER_START} ) {
            $label = $$MdpGlobals::gPageFeatureHashRef{CHAPTER_START} . " " . $i++;
            $seenSection = 1;
        } elsif ( $$feature_map{MULTIWORK_BOUNDARY} ) {
            if ( $$feature_map{CHAPTER_START} ) {
                # do nothing
            } else {
                $label = $$MdpGlobals::gPageFeatureHashRef{MULTIWORK_BOUNDARY} . " " . $i++;
                $seenSection = 1;
            }
        }

        if ( $seenSection ) {
            $seenFirstTOC = 0;
            $seenFirstIndex = 0;
        }

        # Repetition suppression
        if  ( $$feature_map{TABLE_OF_CONTENTS} || $$feature_map{TOC} ) {
            $seenSection = 0;
            if ($seenFirstTOC) {
                # next;
            }
            else {
                $seenFirstTOC = 1;
            }
        }

        if  ( $$feature_map{INDEX} || $$feature_map{IND} ) {
            $seenSection = 0;
            if ($seenFirstIndex) {
                # next;
            }
            else {
                $seenFirstIndex = 1;
            }
        }

        next unless ( scalar @$features || $pageNum );

        if ( $pageNum ) {
            $pageNum = HTML::Entities::encode_entities($pageNum);
        }

        my $feature_json = [];
        push @$feature_json, q{"seq":} . $json->encode($seq);
        push @$feature_json, q{"features":} . $json->encode($features) if ( scalar @$features );
        push @$feature_json, q{"label":} . $json->encode($label) if ( $label );
        push @$feature_json, q{"pageNum":} . $json->encode($pageNum) if ( $pageNum );

        push @{$featureList}, '{' . join(',', @$feature_json) . '}';
    }

    $cache->Set($mdpItem->GetId(), $cache_key, $featureList);
    return '[' . join(',', @$featureList) . ']';
}

sub handle_FEATURE_LIST_JSON_XX
    : PI_handler(FEATURE_LIST_JSON_XX)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    $mdpItem->InitFeatureIterator();
    my $featureRef;

    my $seenFirstTOC = 0;
    my $seenFirstIndex = 0;
    my $seenSection = 0;

    my $json = JSON::XS->new()->utf8(1)->allow_nonref(1);
    my $featureList = [];

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

        # y $url = BuildContentsItemLink($cgi, $seq, $page);

        push @{$featureList}, '{' .
            q{"seq":} . $json->encode($seq) . ', ' .
            q{"tag":} . $json->encode($tag) . ', ' .
            q{"label":} . $json->encode($label) . ',' .
            q{"page":} . $json->encode($page) . '}';

        # my $featureItem =
        #     wrap_string_in_tag($tag, 'Tag') .
        #         wrap_string_in_tag($label, 'Label') .
        #             wrap_string_in_tag($page, 'Page') .
        #                 wrap_string_in_tag($seq, 'Seq') .
        #                     wrap_string_in_tag($url, 'Link');

        # $featureXML .=
        #     wrap_string_in_tag($featureItem, 'Feature');
    }

    return '[' . join(',', @$featureList) . ']';
}

1;

__END__

=head1 AUTHORS

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
