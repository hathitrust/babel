package PT::PIFiller::Search;

=head1 NAME

PIFiller::Search (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the Search pageturner action.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use Utils;
use PIFiller;
use base qw(PIFiller);

use PT::PIFiller::Common;

use PT::PageTurnerUtils;
use PT::Document::XPAT;

use Search::Utils;


# ---------------------------  Utilities  -----------------------------
#

# ----------------------------------------------------------------------
# NAME         : BuildPrevNextHitsLink_XML
# PURPOSE      :
#
# CALLED BY    :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub BuildPrevNextHitsLink_XML
{
    my ( $cgi, $totalMatches, $direction, $cgiRoot ) = @_;

    my $interval  = $cgi->param( 'size' );
    my $start     = $cgi->param( 'start' );

    my $href = '';

    # my $tempCgi = new CGI( $cgi );
    my $tempCgi = new CGI( );

    if ( $direction eq 'prev' )
    {
        my $prevStart = $start - $interval;

        if ( ( $prevStart ) >= 1 )
        {
            $tempCgi->param( 'start', $prevStart );
            $href = $tempCgi->self_url();
        }
    }
    elsif ( $direction eq 'next' )
    {
        my $nextStart =  $start + $interval;
        if ( $totalMatches >= $nextStart  )
        {
            $tempCgi->param( 'start', $nextStart );
            $href = $tempCgi->self_url();
        }
    }

    return $href;
}

# ----------------------------------------------------------------------
# NAME         : _BuildFisheyeLinks_XML
# PURPOSE      :
#
# CALLED BY    :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub _BuildFisheyeLinks_XML
{
    my ( $focus, $hits, $interval, $cgi ) = @_;

    if ( $hits == 0 )
    {	return '';   }

    my $factor = 2;

    my $firstStartPoint = 1;

    my ( $x, $y );
    $x = $focus;
    $y = 0;

    my @a;

    my $rightDistance = $hits - $focus;
    my $leftDistance = $focus - $firstStartPoint;

    if ( $rightDistance == 0 )
    {    $rightDistance = 1;   }

    if ( $leftDistance == 0 )
    {    $leftDistance = 1;   }

    # definitely include next "slice"
    push ( @a, $interval );

    my $basePercent = $interval / $rightDistance;
    for ( $x = $basePercent; $y < $hits; $x = $x * $factor )
    {
        $y = $y + ( $x * $rightDistance );
        $y = int ( $y );
        push ( @a, $y );
    }

    # now do left side
    $x = $focus;
    $y = 0;
    $basePercent = $interval / $leftDistance;
    for ( $x = $basePercent; $y > $firstStartPoint; $x = $x * $factor )
    {
        $y += $y - ( $x * $leftDistance );
        $y = int ( $y );
        push ( @a, $y );
    }

    # duplicate the numbers but negative to get a mirror image
    # of the parabolic curve away from the starting number
    my @b = map { 0 - $_ } @a ;
    push ( @a , @b );

    # add 0, so that when $focus is added to all, there exists in the
    # list a number for the current slice
    push ( @a, 0 );

    # get actual numbers by adding focus to all numbers
    @a = map { $_ + $focus  }  @a;

    my ( @linkNumbersArray, $linkNumber );

    foreach $linkNumber ( @a )
    {
        if ( $linkNumber >= $firstStartPoint  &&
             $linkNumber <= $hits )
        {   push ( @linkNumbersArray, $linkNumber );      }
    }

    # build up ends of slices
    # always include the focus
    push ( @linkNumbersArray, $focus);

    # always include the first "slice"
    push ( @linkNumbersArray, $firstStartPoint);

    # sort
    Utils::sort_uniquify_list(\@linkNumbersArray, 'numeric');

    # check to see if last currently included slice would include the last item.
    # if so, we are done. Otherwise, we need to add a slice that includes
    # the last $interval items, so that the last slice shown does in fact
    # get the user to the last item
    my $possibleLastSliceNumber = $hits - $interval + 1 ;
    if ( $possibleLastSliceNumber > $linkNumbersArray[ scalar(@linkNumbersArray)-1 ] )
    {   push ( @linkNumbersArray, $possibleLastSliceNumber );    }

    my $toReturn = '';
    my ( @linksArray, $link );

    # make links for each number in the array, only if there is more than one slice
    if ( scalar( @linkNumbersArray > 1 ) )
    {
        foreach $linkNumber ( @linkNumbersArray )
        {
            my $href = undef;

            my $linkNumberElement = wrap_string_in_tag( $linkNumber, 'LinkNumber' );
            if ( $linkNumber == $focus )
            {
                add_attribute(\$linkNumberElement, 'focus', 'true');
            }
            else
            {
                my $tempCgi = new CGI( $cgi );
                $tempCgi->param( 'start', $linkNumber );
                $href = $tempCgi->self_url();
            }

            my $hrefElement = wrap_string_in_tag($href, 'Href');
            $toReturn .=
                wrap_string_in_tag( $linkNumberElement . qq{\n} . $hrefElement,
                                    'FisheyeLink' );
        }
    }
    wrap_string_in_tag_by_ref(\$toReturn, 'FisheyeLinks');

    return $toReturn;
}



# ----------------------------------------------------------------------
# NAME         : _BuildMatchesString_XML
# PURPOSE      :
#
# CALLED BY    :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub _BuildMatchesString_XML
{
    my ( $start, $sliceSize, $occurrences, $occurrenceType ) = @_;

    my $toReturn = '';

    my $end = $start + $sliceSize - 1;

    if ( $end > $occurrences )
    {        $end = $occurrences;      }

    wrap_string_in_tag_by_ref( \$start, 'Start' );
    wrap_string_in_tag_by_ref( \$end, 'End' );
    wrap_string_in_tag_by_ref( \$occurrenceType, 'OccurrenceType' );

    $toReturn = $start . qq{\n} . $end . qq{\n} . $occurrenceType;

    return $toReturn;
}


# ----------------------------------------------------------------------
# NAME         : BuildFisheyeString_XML
# PURPOSE      :
#
# CALLED BY    :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub BuildFisheyeString_XML
{
    my ( $cgi, $numOccurrences, $occurrenceType ) = @_;

    # size and start should also be checked higher up in validity checks,
    # but a double-check here might avoid an extremely long run. Not sure why.
    my $sliceSize = $cgi->param( 'size' ) || 25;
    my $start     = $cgi->param( 'start' ) || 0;

    my $toReturn;

    my $matchesString =
        _BuildMatchesString_XML( $start, $sliceSize, $numOccurrences, $occurrenceType );
    my $fisheyeLinks =
        _BuildFisheyeLinks_XML( $start, $numOccurrences, $sliceSize, $cgi );
    my $nextHitsLink
        = BuildPrevNextHitsLink_XML( $cgi, $numOccurrences, 'next' );
    my $prevHitsLink
        = BuildPrevNextHitsLink_XML( $cgi, $numOccurrences, 'prev' );

    wrap_string_in_tag_by_ref( \$nextHitsLink, 'NextHitsLink' );
    wrap_string_in_tag_by_ref( \$prevHitsLink, 'PrevHitsLink' );

    $toReturn = join( qq{\n}, $matchesString, $fisheyeLinks, $nextHitsLink, $prevHitsLink );

    return $toReturn;
}

# ----------------------------------------------------------------------
# NAME         : BuildSliceNavigationLinks
# PURPOSE      :
# NOTES        :
# ----------------------------------------------------------------------
sub BuildSliceNavigationLinks
{
    my ( $cgi, $totalPages ) = @_;

    my $toReturn;

    my $numOccurrences = $totalPages;
    my $occurrenceType = 'page';

    if( $numOccurrences >= 0 )
    {
        $toReturn = BuildFisheyeString_XML
            (
             $cgi,
             $numOccurrences,
             $occurrenceType,
            );

        $toReturn =
            wrap_string_in_tag( $numOccurrences, 'TotalPages' ) . $toReturn;
    }

    return $toReturn;
}


# ----------------------------------------------------------------------
# NAME         : CleanKwic
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# We don't need to clean this data at the character/byte level
# because is is derived from the XML we generate for searching
# which has already been cleaned
# ----------------------------------------------------------------------
sub CleanKwic
{
    my ( $sRef, $currentSeq ) = @_;

    Utils::remove_truncated_cers($sRef);
    Utils::remove_truncated_tags($sRef);

    # $currentSeq is an aid to allow us to trim material that follows
    # the end of the page or preceeds the beginning of the page for
    # the current seq if pr.200 shift.-100 grabbed such

    my $nextSeq = $currentSeq + 1;
    $$sRef =~ s,<page SEQ="$nextSeq"[^>]*>.*,,is;

    $$sRef =~ s,.*?<page SEQ="$currentSeq"[^>]*>(.*),$1,is;

    Utils::remove_tags($sRef);

    my $doc = new PT::Document::XPAT;
    $doc->clean_xml($sRef);
}


# ---------------------------------------------------------------------

=item WrapSearchResultsInXml

Description

=cut

# ---------------------------------------------------------------------
sub WrapSearchResultsInXml
{
    my ( $C, $rset, $parsedQsCgi, $pageHitCountsRef, $finalAccessStatus ) = @_;

    my ( $label, $textRef, $byte, $xpat );
    my ( $resultsToReturn, $lastLevel, $currentSeq );

    my $cgi = $C->get_object('CGI');

    my $tempCgi = new CGI( $cgi );
    $tempCgi->delete( 'view' );
    $tempCgi->delete( 'type' );
    
    my $view = $cgi->param('view'); # just use the default pt view
    if ( $view eq 'thumb' ) { $view = '1up'; }

    $rset->init_iterator();

    while ( ( $label, $textRef, $byte, $xpat ) = $rset->get_Next_result() )
    {
        last if ( ! $label );

        # Page info
        if ( $label eq 'page' )
        {
            $resultsToReturn .= qq{</Page>\n}
                if ( $lastLevel eq 'kwic' );

            $resultsToReturn .= qq{<Page>\n};

            my ( $sequence, $number );

            if ( $$textRef =~ m,<page(.*?)>,is )
            {
                my $attrs = $1;
                my ( $seq ) =( $attrs =~ m,SEQ="(.*?)", );
                my ( $num ) =( $attrs =~ m,NUM="(.*?)", );

                $currentSeq = $sequence = $seq;
                $number = $num;
            }

            my $pageHitCount = shift @$pageHitCountsRef;

            $resultsToReturn .=
                wrap_string_in_tag( $sequence, 'Sequence' ) .
                    wrap_string_in_tag( $number, 'PageNumber' ) .
                        wrap_string_in_tag( $pageHitCount, 'Hits' );

            $tempCgi->param( 'seq', $sequence );
            $tempCgi->param( 'num', $number )
                if ( $number );
            $tempCgi->delete( 'orient' );
            $tempCgi->delete( 'u' );
            $tempCgi->param('view',$view) if ( $view );
            my $href = Utils::url_to($tempCgi, $PTGlobals::gPageturnerCgiRoot);

            $resultsToReturn .= wrap_string_in_tag( $href, 'Link');
        }

        elsif ( $label eq 'kwic' )
        {
            $lastLevel = 'kwic';

            #if not authorized we don't show content
            next unless
                ( $finalAccessStatus eq 'allow' );

            # remove page tags and doc tags
            CleanKwic( $textRef, $currentSeq );

            # munge cgi to have multiple q's
            ## PT::PageTurnerUtils::HighlightMultipleQs($C, $parsedQsCgi, $textRef );
            Search::Utils::HighlightMultipleQs($C,
                                                     $parsedQsCgi,
                                                     $textRef);

            $resultsToReturn .= wrap_string_in_tag_by_ref( $textRef, 'Kwic');
        }
    }

    # don't close the element if there is no content
    # (there should be no opening tag here if there were no results)
    $resultsToReturn .= qq{</Page>\n}
        if ( $resultsToReturn );

    return $resultsToReturn;

}


# ---------------------------  Handlers  ------------------------------
#

# ---------------------------------------------------------------------

=item handle_SEARCH_TERMS_PI : PI_handler(SEARCH_TERMS)

Handler for SEARCH_TERMS

=cut

# ---------------------------------------------------------------------
sub handle_SEARCH_TERMS_PI
    : PI_handler(SEARCH_TERMS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CompositeResult')->get_parsed_qs_cgi();

    my $toReturn = '';

    my $i;
    my $numberOfFinalQs = $cgi->param( 'numberofqs' );

    for ($i = 1; $i <= $numberOfFinalQs; $i++)
    {
        my $q = $cgi->param('q' . $i);
        $toReturn .= wrap_string_in_tag( $q, 'Term');
    }

    return $toReturn;
}


# ---------------------------------------------------------------------

=item handle_TOTAL_PAGES_PI : PI_handler(TOTAL_PAGES)

Handler for TOTAL_PAGES

=cut

# ---------------------------------------------------------------------
sub handle_TOTAL_PAGES_PI
    : PI_handler(TOTAL_PAGES)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $total_pages = $C->get_object('CompositeResult')->get_total_pages();
    return $total_pages;
}


# ---------------------------------------------------------------------

=item handle_QUERY_TYPE_PI : PI_handler(QUERY_TYPE)

Handler for QUERY_TYPE

=cut

# ---------------------------------------------------------------------
sub handle_QUERY_TYPE_PI
    : PI_handler(QUERY_TYPE)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $was_secondary = $C->get_object('CompositeResult')->get_secondary_query();
    return $was_secondary ? 'OR' : 'AND';
}


# ---------------------------------------------------------------------

=item handle_SLICE_NAVIGATION_LINKS_PI : PI_handler(SLICE_NAVIGATION_LINKS)

Handler for SLICE_NAVIGATION_LINKS

=cut

# ---------------------------------------------------------------------
sub handle_SLICE_NAVIGATION_LINKS_PI
    : PI_handler(SLICE_NAVIGATION_LINKS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $total_pages = $C->get_object('CompositeResult')->get_total_pages();

    return BuildSliceNavigationLinks($cgi, $total_pages);
}

# ---------------------------------------------------------------------

=item handle_LAST_PAGETURNER_LINK_PI : PI_handler(LAST_PAGETURNER_LINK)

Handler for LAST_PAGETURNER_LINK.  If coming from Mirlyn full text
search, lose history of last page viewed in pageturner. If within
pageturner keep the history.

=cut

# ---------------------------------------------------------------------
sub handle_LAST_PAGETURNER_LINK_PI
    : PI_handler(LAST_PAGETURNER_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $came_from_Mirlyn_search =
        ($ENV{'HTTP_REFERER'} =~ m,mirlyn\.lib,i);

    my $ses = $C->get_object('Session');
    my $url;
    if ($came_from_Mirlyn_search)
    {
        PT::PageTurnerUtils::DeleteLastPageTurnerLinkFromSession($ses);
        $url = '';
    }
    else
    {
        my $cgi = $C->get_object('CGI');
        $url = PT::PageTurnerUtils::GetLastPageTurnerLinkFromSession($cgi, $ses);
    }

    return $url;
}

# ---------------------------------------------------------------------

=item handle_BEGINNING_LINK_PI : PI_handler(BEGINNING_LINK)

Handler for BEGINNING_LINK

=cut

# ---------------------------------------------------------------------
sub handle_BEGINNING_LINK_PI
    : PI_handler(BEGINNING_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    
    my $temp_cgi = new CGI('');
    $temp_cgi->param('id', $id);
    $temp_cgi->param('debug', $cgi->param('debug'));

    my $url = Utils::url_to($temp_cgi, $PTGlobals::gPageturnerCgiRoot);

    return $url;
}

# ---------------------------------------------------------------------

=item handle_ITEM_SEARCH_RESULTS_PI : PI_handler(ITEM_SEARCH_RESULTS)

Handler for ITEM_SEARCH_RESULTS

If there is a valid XPatResultSet from the search, use it to populate
the XML.  If there is not, send out a simple string that the XSL can
test in order to put out a user friendly explanation.

=cut

# ---------------------------------------------------------------------
sub handle_ITEM_SEARCH_RESULTS_PI
    : PI_handler(ITEM_SEARCH_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $rset = $C->get_object('CompositeResult')->get_rset();
    my $parsed_qs_cgi = $C->get_object('CompositeResult')->get_parsed_qs_cgi();
    my $rset = $C->get_object('CompositeResult')->get_rset();
    my $page_hit_counts_ref = $C->get_object('CompositeResult')->get_page_hit_counts_ref();

    my $final_access_status =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ( $rset )
    {
        return WrapSearchResultsInXml($C,
                                      $rset,
                                      $parsed_qs_cgi,
                                      $page_hit_counts_ref,
                                      $final_access_status);
    }
    else
    {
        return 'INVALID_SEARCH_TERMS';
    }
}


# ---------------------------------------------------------------------

=item handle_HAS_PAGE_NUMBERS_PI : PI_handler(HAS_PAGE_NUMBERS)

Handler for HAS_PAGE_NUMBERS

=cut

# ---------------------------------------------------------------------
sub handle_HAS_PAGE_NUMBERS_PI
    : PI_handler(HAS_PAGE_NUMBERS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $has = $C->get_object('MdpItem')->HasPageNumbers();
    return $has ? 'true' : 'false';
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
