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

use Utils;
use Utils::Time;
use Utils::Date;
use Utils::Serial;
use Identifier;

use base qw(PIFiller);

use PT::PIFiller::Common;


# ---------------------------  Utilities  -----------------------------
#


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
    
    # copy params
    foreach my $p (qw(id orient size attr src u)) {
        $tempCgi->param($p, $cgi->param($p));
    }
    if ( $view eq 'fpdf' ) {
        # pass
    } elsif ( $view eq 'pdf' ) {
        # don't force download;
        # let the PDF open in the browser if possible
        $tempCgi->param('seq', $cgi->param('seq'));
        $tempCgi->param('num', $cgi->param('num'));
        $tempCgi->param('attachment', 0);
    }
    
    if ( $cgi->param('debug') ) {
        $tempCgi->param('debug', $cgi->param('debug'));
    }
    
    my $href = Utils::url_to($tempCgi, $PTGlobals::gImgsrvCgiRoot . "/pdf");
    return $href;
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

# ---------------------------------------------------------------------

=item BuildRotateLink

Description

=cut

# ---------------------------------------------------------------------
sub BuildRotateLink
{
    my ( $cgi, $mdpItem, $direction ) = @_;

    my $toReturn = '';

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
    }
    else
    {
    }

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


# ---------------------------  Handlers  ------------------------------
#
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

    my $href = '';

    if ( $finalAccessStatus eq 'allow' )
    {
        $href = $C->get_object('MdpItem')->GetTargetImageFile();
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

    my $pageFeatureXML;
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
    return BuildViewTypeUrl($cgi, 'text');
}

sub handle_VIEW_TYPE_PLAINTEXT_LINK_PI
    : PI_handler(VIEW_TYPE_PLAINTEXT_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return BuildViewTypeUrl($cgi, 'plaintext');
}

sub handle_SEARCH_RESULTS_LINK_PI
    : PI_handler(SEARCH_RESULTS_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    
    my $href;
    if ( my $referer = $ses->get_transient('referer') ) {
        $href = $referer;
        $href =~ s,&,&amp;,g;
    } else {
        $href = BuildSearchResultsUrl($cgi);
    }

    return $href;
}

sub handle_SEARCH_RESULTS_LABEL_PI
    : PI_handler(SEARCH_RESULTS_LABEL)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $ses = $C->get_object('Session');
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    
    my $label;
    if ( my $referer = $ses->get_transient('referer') ) {
        if ( $referer =~ m,$PTGlobals::gCatalogSearchPattern, ) {
            $label = qq{catalog search results};
        } elsif ( $referer =~ m,$PTGlobals::gCatalogRecordPattern, ) {
            $label = qq{catalog record};
        }
    } elsif ( $cgi->param('q1') ) {
        $label = qq{"Search in this text" results};
    }

    return $label;
}

sub handle_VIEW_TYPE_2UP_LINK_PI
    : PI_handler(VIEW_TYPE_2UP_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return BuildViewTypeUrl($cgi, '2up');
}

sub handle_VIEW_TYPE_1UP_LINK_PI
    : PI_handler(VIEW_TYPE_1UP_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return BuildViewTypeUrl($cgi, '1up');
}

sub handle_VIEW_TYPE_THUMBNAIL_LINK_PI
    : PI_handler(VIEW_TYPE_THUMBNAIL_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    return BuildViewTypeUrl($cgi, 'thumb');
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
    return BuildViewTypeUrl($cgi, 'image');
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
    return BuildViewTypeUrl($cgi, 'pdf');
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
    }

    return $href;
}

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

sub handle_FULL_PDF_ACCESS_MESSAGE_PI
    : PI_handler(FULL_PDF_ACCESS_MESSAGE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my ( $message, $status ) = $C->get_object('Access::Rights')->get_full_PDF_access_status($C, $id);
    return $message;
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
