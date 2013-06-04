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

use SLIP_Utils::Common;
use URI::Escape;


# ---------------------------  Utilities  -----------------------------
#

# ---------------------------------------------------------------------

=item BuildPrevNextHitsLink_XML

Description

=cut

# ---------------------------------------------------------------------
sub BuildPrevNextHitsLink_XML {
    my ($cgi, $totalMatches, $direction, $cgiRoot) = @_;

    my $interval  = $cgi->param('size');
    my $start = $cgi->param('start');

    my $href = '';
    my $tempCgi = new CGI($cgi);

    if ($direction eq 'prev')
    {
        my $prevStart = $start - $interval;

        if (($prevStart) >= 1)
        {
            $tempCgi->param('start', $prevStart);
            $href = $tempCgi->self_url();
        }
    }
    elsif ($direction eq 'next')
    {
        my $nextStart =  $start + $interval;
        if ($totalMatches >= $nextStart )
        {
            $tempCgi->param('start', $nextStart);
            $href = $tempCgi->self_url();
        }
    }

    return $href;
}

# ---------------------------------------------------------------------

=item _BuildFisheyeLinks_XML

Description

=cut

# ---------------------------------------------------------------------
sub _BuildFisheyeLinks_XML {
    my ($focus, $hits, $interval, $cgi) = @_;

    if ($hits == 0) { return ''; }

    my $factor = 2;
    my $firstStartPoint = 1;

    my ($x, $y) = ($focus, 0);
    my @a;

    my $rightDistance = $hits - $focus;
    my $leftDistance = $focus - $firstStartPoint;

    if ($rightDistance == 0) { $rightDistance = 1; }
    if ($leftDistance == 0) { $leftDistance = 1; }

    # definitely include next "slice"
    push (@a, $interval);

    my $basePercent = $interval / $rightDistance;
    for ($x = $basePercent; $y < $hits; $x = $x * $factor) {
        $y = $y + ($x * $rightDistance);
        $y = int ($y);
        push (@a, $y);
    }

    # now do left side
    $x = $focus;
    $y = 0;
    $basePercent = $interval / $leftDistance;
    for ($x = $basePercent; $y > $firstStartPoint; $x = $x * $factor) {
        $y += $y - ($x * $leftDistance);
        $y = int ($y);
        push (@a, $y);
    }

    # duplicate the numbers but negative to get a mirror image of the
    # parabolic curve away from the starting number
    my @b = map { 0 - $_ } @a ;
    push (@a , @b);

    # add 0, so that when $focus is added to all, there exists in the
    # list a number for the current slice
    push (@a, 0);

    # get actual numbers by adding focus to all numbers
    @a = map { $_ + $focus  }  @a;

    my (@linkNumbersArray, $linkNumber);

    foreach $linkNumber (@a) {
        if ($linkNumber >= $firstStartPoint && $linkNumber <= $hits) {
            push (@linkNumbersArray, $linkNumber);
        }
    }

    # build up ends of slices always include the focus
    push (@linkNumbersArray, $focus);

    # always include the first "slice"
    push (@linkNumbersArray, $firstStartPoint);

    # sort
    Utils::sort_uniquify_list(\@linkNumbersArray, 'numeric');

    # check to see if last currently included slice would include the
    # last item.  if so, we are done. Otherwise, we need to add a
    # slice that includes the last $interval items, so that the last
    # slice shown does in fact get the user to the last item
    my $possibleLastSliceNumber = $hits - $interval + 1 ;
    if ($possibleLastSliceNumber > $linkNumbersArray[ scalar(@linkNumbersArray)-1 ]) {
        push (@linkNumbersArray, $possibleLastSliceNumber);
    }

    my $toReturn = '';
    my (@linksArray, $link);

    # make links for each number in the array, only if there is more than one slice
    if (scalar(@linkNumbersArray > 1)) {
        foreach $linkNumber (@linkNumbersArray) {
            my $href = undef;

            my $linkNumberElement = wrap_string_in_tag($linkNumber, 'LinkNumber');
            if ($linkNumber == $focus) {
                add_attribute(\$linkNumberElement, 'focus', 'true');
            }
            else {
                my $tempCgi = new CGI($cgi);
                $tempCgi->param('start', $linkNumber);
                $href = $tempCgi->self_url();
            }

            my $hrefElement = wrap_string_in_tag($href, 'Href');
            $toReturn .= wrap_string_in_tag($linkNumberElement . qq{\n} . $hrefElement, 'FisheyeLink');
        }
    }
    wrap_string_in_tag_by_ref(\$toReturn, 'FisheyeLinks');

    return $toReturn;
}

# ---------------------------------------------------------------------

=item _BuildMatchesString_XML

Description

=cut

# ---------------------------------------------------------------------
sub _BuildMatchesString_XML {
    my ($start, $sliceSize, $occurrences) = @_;

    my $toReturn = '';

    my $end = $start + $sliceSize - 1;
    if ($end > $occurrences) {
        $end = $occurrences;
    }

    wrap_string_in_tag_by_ref(\$start, 'Start');
    wrap_string_in_tag_by_ref(\$end, 'End');

    $toReturn = $start . qq{\n} . $end . qq{\n};

    return $toReturn;
}


# ---------------------------------------------------------------------

=item BuildFisheyeString_XML

Description

=cut

# ---------------------------------------------------------------------
sub BuildFisheyeString_XML {
    my ($cgi, $numOccurrences) = @_;

    my $sliceSize = $cgi->param('size');
    my $start     = $cgi->param('start');

    my $toReturn;

    my $matchesString =
      _BuildMatchesString_XML($start, $sliceSize, $numOccurrences);
    my $fisheyeLinks =
      _BuildFisheyeLinks_XML($start, $numOccurrences, $sliceSize, $cgi);
    my $nextHitsLink
      = BuildPrevNextHitsLink_XML($cgi, $numOccurrences, 'next');
    my $prevHitsLink
      = BuildPrevNextHitsLink_XML($cgi, $numOccurrences, 'prev');

    wrap_string_in_tag_by_ref(\$nextHitsLink, 'NextHitsLink');
    wrap_string_in_tag_by_ref(\$prevHitsLink, 'PrevHitsLink');

    $toReturn = join(qq{\n}, $matchesString, $fisheyeLinks, $nextHitsLink, $prevHitsLink);

    return $toReturn;
}

# ---------------------------------------------------------------------

=item BuildSliceNavigationLinks

Description

=cut

# ---------------------------------------------------------------------
sub BuildSliceNavigationLinks {
    my ($cgi, $total_pages) = @_;

    my $toReturn = '';

    if($total_pages >= 0) {
        my $fe_str = BuildFisheyeString_XML ($cgi, $total_pages);
        $toReturn = wrap_string_in_tag($total_pages, 'TotalPages') . $fe_str;
    }

    return $toReturn;
}


# ---------------------------------------------------------------------

=item WrapSearchResultsInXml

Description

=cut

# ---------------------------------------------------------------------
sub WrapSearchResultsInXml {
    my ($C, $rs, $finalAccessStatus) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    my $tempCgi = new CGI($cgi);
    my $view = $tempCgi->param('view');
    if ($view eq 'thumb') {
        $tempCgi->param('view', '1up');
    }
    $tempCgi->delete('type');
    $tempCgi->delete('orient');
    $tempCgi->delete('u');

    my $XML_result = '';

    # Server/Query/Network error
    if (! $rs->http_status_ok()) {
        $XML_result = wrap_string_in_tag('true', 'SearchError');
        return $XML_result;
    }

    my $Q = $C->get_object('Query');
    my $valid_boolean = $Q->parse_was_valid_boolean_expression();
    $XML_result .= wrap_string_in_tag($valid_boolean, 'ValidBooleanExpression');

    $rs->init_iterator();
    while (my $Page_result = $rs->get_next_Page_result()) {

        my $snip_list = $Page_result->{snip_list};
        my $pgnum = $Page_result->{pgnum};
        my $seq = $mdpItem->GetVirtualPageSequence($Page_result->{seq});
        my $id = $Page_result->{id};
        my $vol_id = $Page_result->{vol_id};

        $XML_result .=
          qq{<Page>\n} .
            wrap_string_in_tag($seq, 'Sequence') .
              wrap_string_in_tag($pgnum, 'PageNumber');

        $tempCgi->param('seq', $seq);
        $tempCgi->param('num', $pgnum) if ($pgnum);

            my $href = Utils::url_to($tempCgi, $PTGlobals::gPageturnerCgiRoot);
        $XML_result .= wrap_string_in_tag($href, 'Link');

        my $term_hit_ct = 0;
        foreach my $snip_ref (@$snip_list) {
            $term_hit_ct += () = $$snip_ref =~ m,{lt:}.*?{gt:},g;

            if ($finalAccessStatus eq 'allow') {
                PT::PageTurnerUtils::format_OCR_text( $snip_ref );
                $XML_result .= wrap_string_in_tag_by_ref($snip_ref, 'Kwic')
        }
    }
        $XML_result .= wrap_string_in_tag($term_hit_ct/2, 'Hits');

        $XML_result .= qq{</Page>\n};
    }

    return $XML_result;
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

    my $toReturn = '';

    my $rs = $C->get_object('Search::Result::Page');
    my $parsed_terms_arr_ref = $rs->get_auxillary_data('parsed_query_terms');
    my $multi_term = $rs->get_auxillary_data('is_multiple');

    my $terms_xml;
    foreach my $term (@$parsed_terms_arr_ref) {
        $terms_xml .= wrap_string_in_tag($term, 'Term');
    }
    $toReturn .= wrap_string_in_tag($terms_xml, 'Terms');

    # If see PT::SearchUtils re: MultiTerm logic.
    $toReturn .= wrap_string_in_tag($multi_term, 'MultiTerm');

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

    my $total_pages = $C->get_object('Search::Result::Page')->get_num_found();
    return $total_pages;
}


# ---------------------------------------------------------------------

=item handle_QUERY_TIME_PI : PI_handler(QUERY_TIME)

Handler for QUERY_TIME

=cut

# ---------------------------------------------------------------------
sub handle_QUERY_TIME_PI
  : PI_handler(QUERY_TIME)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $query_time = $C->get_object('Search::Result::Page')->get_query_time();
    return $query_time;
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
    my $total_pages = $C->get_object('Search::Result::Page')->get_num_found();

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

If there is a valid Result object from the search, use it to populate
the XML.  If there is not, send out a simple string that the XSL can
test in order to put out a user friendly explanation.

=cut

# ---------------------------------------------------------------------
sub handle_ITEM_SEARCH_RESULTS_PI
    : PI_handler(ITEM_SEARCH_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $rs = $C->get_object('Search::Result::Page');

    my $final_access_status =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ($rs) {
        return WrapSearchResultsInXml($C, $rs, $final_access_status);
    }
    else {
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
# ---------------------------------------------------------------------

=item handle_REPEAT_SEARCH_LINK    : PI_handler(REPEAT_SEARCH_LINK)

Handler to create the link to broaden or narrow your search.
Replaces the URL construction in searchresults.xsl templates msgRepeatSearchWithAND and OR
Needed because we need to convert CERS back to chars in the url

=cut

# ---------------------------------------------------------------------
sub handle_REPEAT_SEARCH_LINK
    : PI_handler(REPEAT_SEARCH_LINK)
{
    my ($C, $act, $piParamHashRef) = @_;
    my $cgi = $C->get_object('CGI');
    my $tempCgi = new CGI($cgi);
    $tempCgi->delete('op');

    # default operator is AND so to broaden a search we use OR
    $tempCgi->param('ptsop','OR');

    if ($cgi->param('ptsop') eq "OR")
    {
        $tempCgi->param('ptsop','AND');
    }
    my $q = $cgi->param('q1');
    Utils::remap_cers_to_chars(\$q);
    $tempCgi->delete('q1');
    $tempCgi->param('q1',$q);

  #  $tempCgi->param('q1',$escaped_q1);

    my    $href = $tempCgi->self_url();

    return $href;
}


# ---------------------------------------------------------------------

1;

__END__

=head1 AUTHORS

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008-11 ©, The Regents of The University of Michigan, All Rights Reserved

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
