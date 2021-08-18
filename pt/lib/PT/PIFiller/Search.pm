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
use POSIX qw(floor ceil);

use File::Basename qw();
use List::MoreUtils;

use JSON::XS;
use Utils::Cache::Storable;

# Number of allowed links for pagination. Set this so page links fit on one line.
use constant MAX_PAGELABELS=>11;

use constant RESULTS_VERSION => 1;

# use feature qw(say);
# our $DEBUG_LOGFILE;
# open($DEBUG_LOGFILE, ">", "/ram/search.txt");
# chmod(0666, "/ram/search.txt");

# ---------------------------  Utilities  -----------------------------
#

# ---------------------------------------------------------------------
=item BuildFirstLastPagesLink_XML

Description

=cut

# ---------------------------------------------------------------------
sub BuildFirstLastPagesLink_XML {
    my ($cgi, $totalMatches, $direction) = @_; 

    my $sliceSize  =  $cgi->param('sz'); 
    my $focus =   $cgi->param('start'); 

    my $href = '';
    my $pageLabel = '';
    my $pageLink = '';
    my $tempCgi = new CGI($cgi);

    if ($direction eq 'first') 
    {
        my $firstPageLabel = 1;
        $tempCgi->param('start', $firstPageLabel);
        $href = $tempCgi->self_url();
	$pageLabel = '[' . $firstPageLabel . ']';
    }
    elsif ($direction eq 'last') 
    { 
	my $lastPageLabel = ceil($totalMatches/$sliceSize);
        $tempCgi->param('start', (floor($totalMatches/$sliceSize) * $sliceSize) + 1);
        $href = $tempCgi->self_url();
        $pageLabel = '[' . $lastPageLabel . ']';
    }

    $pageLink .= wrap_string_in_tag($href, 'Href');
    $pageLink .= wrap_string_in_tag($pageLabel, 'LinkNumber');

    return $pageLink;
}

# ---------------------------------------------------------------------

=item BuildPrevNextHitsLink_XML

Page 1 contains result pages 1-10, 2 contains 11-20, etc.
No matter what cgi->start is set to, set Prev and Next buttons 
to point to very first result set of each page. Otherwise,
simply adding/subtracting sliceSize makes things wonky near first
and last pages. 
So if start is set to 33:
Prev -->  31
Next -->  41

=cut

# ---------------------------------------------------------------------
sub BuildPrevNextHitsLink_XML {
    my ($cgi, $totalMatches, $direction) = @_;

    my $sliceSize  = $cgi->param('sz');
    my $focus = $cgi->param('start');

    my $start = -1;
    my $href = '';
    my $tempCgi = new CGI($cgi);

    if ($direction eq 'prev')
    {
        my $prevFocus = (floor($focus/$sliceSize) * $sliceSize) - ($sliceSize - 1);
        if (($prevFocus) >= 1)
        {
            $tempCgi->param('start', $prevFocus);
            $href = $tempCgi->self_url();
            $start = $prevFocus;
        }
    }
    elsif ($direction eq 'next')
    {
        my $nextFocus = (ceil($focus/$sliceSize) * $sliceSize) + 1;
        if ($totalMatches >= $nextFocus )
	{
            $tempCgi->param('start', $nextFocus);
            $href = $tempCgi->self_url();
            $start = $nextFocus;
        }
    }

    return ( $start, $href );
}

# ---------------------------------------------------------------------

=item _BuildFisheyeLinks_XML

Page 1 contains result pages 1-10, 2 contains 11-20, etc.
Not using a pager facade. 
Still implementing start=<page> in CGI as main linking mechanism.
Just calculating the pagination using POSIX ceil function.

=cut

# ---------------------------------------------------------------------
sub _BuildFisheyeLinks_XML {
    my ($focus, $numOccurrences, $sliceSize, $cgi) = @_;

    my $current_pageLabel = ceil($focus/$sliceSize);
    my $last_pageLabel = ceil($numOccurrences/$sliceSize);

    # spit out links for each page with the page range i.e href to
    # page2 label 11-20
    my $start = '';
    my $end = '';
    my $pageLinks = '';
    my $firstPageLink = '';
    my $lastPageLink = '';
    my $lastPageFactor = 0;
    my $toReturn;

    if ($last_pageLabel <= MAX_PAGELABELS)
    {
        # if there aren't too many just spit out all the page links
        $start = 1;
        $end = $last_pageLabel;
    }
    else
    {
        if ($focus > $sliceSize)
	{
            $firstPageLink
	      = BuildFirstLastPagesLink_XML($cgi, $numOccurrences, 'first');
        }
        unless (noLastLinkNecessary($focus, $numOccurrences, $sliceSize))
        {
            $lastPageFactor = -1;
            $lastPageLink
              = BuildFirstLastPagesLink_XML($cgi, $numOccurrences, 'last');
        }
        my $smallestEndPageLabel = $last_pageLabel - (MAX_PAGELABELS - 1);
        if ($current_pageLabel < $smallestEndPageLabel)
        {
            $start = $current_pageLabel;
            $end = $current_pageLabel + (MAX_PAGELABELS - 1);
        }
        else
        {
            # just output tail end of PAGELABELS 
	    $start = $smallestEndPageLabel + $lastPageFactor;
	    $end = $last_pageLabel + $lastPageFactor;
	}
    }
    $pageLinks =
        _ls_get_pagelinks($start, $end, $numOccurrences, $cgi, $current_pageLabel);
    
    wrap_string_in_tag_by_ref(\$firstPageLink, 'EndPageLink');
    add_attribute(\$firstPageLink, 'page', 'first');
    wrap_string_in_tag_by_ref(\$lastPageLink, 'EndPageLink');
    add_attribute(\$lastPageLink, 'page', 'last');
    wrap_string_in_tag_by_ref(\$pageLinks, 'FisheyeLinks');

    $toReturn = join(qq{\n}, $firstPageLink, $lastPageLink, $pageLinks);

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

    my $sliceSize = $cgi->param('sz');
    my $focus     = $cgi->param('start');

    my $prevHitsLink = ''; my $prevHitsStart;
    my $nextHitsLink = ''; my $nextHitsStart;
    my $fisheyeLinks = '';
    my $toReturn;

    my $matchesString =
      _BuildMatchesString_XML($focus, $sliceSize, $numOccurrences);

    if ($numOccurrences > $sliceSize) {
      $fisheyeLinks =
        _BuildFisheyeLinks_XML($focus, $numOccurrences, $sliceSize, $cgi);
      ( $prevHitsStart, $prevHitsLink )
        = BuildPrevNextHitsLink_XML($cgi, $numOccurrences, 'prev');
    }
    unless (noLastLinkNecessary($focus, $numOccurrences, $sliceSize)) {
      ( $nextHitsStart, $nextHitsLink )
        = BuildPrevNextHitsLink_XML($cgi, $numOccurrences, 'next');
    }

    wrap_string_in_tag_by_ref(\$nextHitsLink, 'NextHitsLink');
    add_attribute(\$nextHitsLink, 'start', $nextHitsStart);

    wrap_string_in_tag_by_ref(\$prevHitsLink, 'PrevHitsLink');
    add_attribute(\$prevHitsLink, 'start', $prevHitsStart);

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

    if($total_pages > 0) {
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
        # $tempCgi->param('view', '1up');
        $tempCgi->delete('view');
    }
    if ( $tempCgi->param('format') eq 'image' ) {
        $tempCgi->delete('format');
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
        my $pgnum = $Page_result->{pgnum} || '';
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

sub WrapFragmentSearchResultsInXml {
    my ($C, $rs, $finalAccessStatus) = @_;

    my $cgi = $C->get_object('CGI');
    my $mdpItem = $C->get_object('MdpItem');

    my $tempCgi = new CGI($cgi);
    # my $view = $tempCgi->param('view');
    # if ($view eq 'thumb') {
    #     $tempCgi->param('view', '1up');
    # }
    $tempCgi->delete('type');
    $tempCgi->delete('orient');
    $tempCgi->delete('u');

    use Time::HiRes;
    my $start_0 = Time::HiRes::time();

    my $XML_result = '';

    # Server/Query/Network error
    if (! $rs->http_status_ok()) {
        $XML_result = wrap_string_in_tag('true', 'SearchError');
        return $XML_result;
    }

    my $cache_max_age = 600;
    my $cache_dir = Utils::get_true_cache_dir($C, 'search_cache_dir');
    my $cache = Utils::Cache::Storable->new($cache_dir, $cache_max_age, $mdpItem->get_modtime);

    my $cache_key = $$rs{cache_key};
    my $cached_result = $cache->Get($mdpItem->GetId, "$cache_key.${ \RESULTS_VERSION }.xml");

    if ( ref $cached_result ) {
        $XML_result = $$cached_result{XML_result};
        return $XML_result;
    }

    my $Q = $C->get_object('Query');
    my $valid_boolean = $Q->parse_was_valid_boolean_expression();
    $XML_result .= wrap_string_in_tag($valid_boolean, 'ValidBooleanExpression');

    my $fileid = $mdpItem->GetPackageId();
    my $epub_filename = $mdpItem->GetFilePathMaybeExtract($fileid, 'epubfile');
    my $epub_pathname = $epub_filename . "_unpacked";

    my $xpc = XML::LibXML::XPathContext->new();
    $xpc->registerNs("opf", "http://www.idpf.org/2007/opf");
    $xpc->registerNs("xhtml", "http://www.w3.org/1999/xhtml");
    $xpc->registerNs('container', 'urn:oasis:names:tc:opendocument:xmlns:container');

    my $container_filename = qq{$epub_pathname/META-INF/container.xml};
    my $container_doc = XML::LibXML->load_xml(location => $container_filename);

    my $package_filename = $xpc->findvalue(q{//container:rootfile/@full-path}, $container_doc);
    my $package_dirname = File::Basename::dirname($package_filename);
    my $package_doc = XML::LibXML->load_xml(location => qq{$epub_pathname/$package_filename});

    my $manifest = ($xpc->findnodes(qq{//opf:manifest}, $package_doc))[0];
    my $spine = ($xpc->findnodes(qq{//opf:spine}, $package_doc))[0];

    my $map = {}; my $idref_map = {};
    my $seq = 0;
    my @itemrefs = $xpc->findnodes(qq{opf:itemref}, $spine);
    foreach my $itemref ( @itemrefs ) {
        $seq += 1;
        my $idref = $itemref->getAttribute('idref');
        my $item = ($xpc->find(qq{opf:item[\@id="$idref"]}, $manifest))->[0];
        my $filename = $item->getAttribute('href');
        if ( $filename !~ m,^$package_dirname, ) {
            $filename = "$package_dirname/$filename";
        }
        $$map{$seq} = $filename;
        $$idref_map{$seq} = $idref;
    }

    $rs->init_iterator();
    my $item_no = 0;

    my $MAX_SNIPPET_WORDS = 50;
    my $MAX_SNIPPETS = 10;

    while (my $Page_result = $rs->get_next_Page_result()) {

        my $snip_list = $Page_result->{snip_list};
        my $pgnum = $Page_result->{pgnum};
        my $seq = $mdpItem->GetVirtualPageSequence($Page_result->{seq});
        my $id = $Page_result->{id};
        my $vol_id = $Page_result->{vol_id};

        my $chapter_filename = $$map{$seq};
        my $chapter_index = $seq * 2 ; # ( $seq - 1 ) * 2;
        # print STDERR "AHOY PAGING $seq : $chapter_index : $chapter_filename\n";
        my $chapter_title = $mdpItem->GetPageFeature($seq);
        my $chapter = XML::LibXML->load_xml(location => join("/", $epub_pathname, $chapter_filename));
        unless ( $chapter_title ) {
            if ( $xpc->findvalue(q{//node()/@epub:type}, $chapter) =~ m,titlepage, ) {
                $chapter_title = "(Title Page)";
            } elsif ( my $h2 = $xpc->findvalue(qq{//xhtml:h2[1]}, $chapter) ) {
                $chapter_title = $h2;
            } else {
                # this may be a horrible hack
                $chapter_title = "(" . File::Basename::basename($chapter_filename, ".xhtml", ".html") . ")";
                $chapter_title =~ s,([a-z])([A-Z]),$1 $2,g;
                $chapter_title =~ s,_, ,g;
            }
        } 

        my @matched_words = ();
        foreach my $snip_ref ( @$snip_list ) {
            my @matched = $$snip_ref =~ /\[\[([^\]]+)\]\]/g;
            push @matched_words, @matched;
        }

        @matched_words = List::MoreUtils::distinct(@matched_words);
        # print STDERR "AHOY WRAP @matched_words\n";

        $XML_result .=
          qq{<Page>\n} .
            wrap_string_in_tag($seq, 'Sequence') .
              wrap_string_in_tag($pgnum, 'PageNumber') .
                wrap_string_in_tag($chapter_title, 'Label');

        my $idref = $$idref_map{$seq};
        my $cfi_path = join("/", "", "6", "$chapter_index\[$idref\]!/4");
        # $temperCgi->param('num', join('/', @$offset));
        my $temperCgi = new CGI($tempCgi);
        # $temperCgi->param('num', $cfi_path);
        my $href = Utils::url_to($temperCgi, $PTGlobals::gPageturnerCgiRoot);
        $href .= '#' . $cfi_path;

        $XML_result .= wrap_string_in_tag($href, 'Link');
        $XML_result .= wrap_string_in_tag(JSON::XS::encode_json(\@matched_words), 'Highlight');

        my $expr = join('|', map { qr/\Q$_/ } @matched_words);
        # my $expr = join('|', map { qr/\b\Q$_\E\b/ } @matched_words);
        my @nodes = map { [ [4], $_ ] } $xpc->findnodes(".//xhtml:body", $chapter);
        my @possibles = ();
        while ( scalar @nodes ) {
            my $tuple = shift @nodes;
            my ( $offset, $node ) = @$tuple;
            my $content = $node->textContent;
            if ( $content =~ m,$expr,i ) {

                push @possibles, [ [ @$offset ], $content, $node ];

                my @children = ();
                foreach my $child ( $node->nonBlankChildNodes() ) { # $xpc->findnodes("node()", $node);
                    next unless ( $child->nodeType == 1 );
                    push @children, $child;
                }
                if ( scalar @children ) {
                    my $_offset = 0;
                    foreach my $child ( @children ) {
                        $_offset += 2;
                        push @nodes, [ [ @$offset, $_offset ], $child ];
                    }
                }
            }
        }

        my $last_path;
        my $num_snippets = 0;

        my $range_start = -1;
        my $range_length = 0;
        my $range_offset;

        while ( my $possible = pop @possibles ) {
            my ( $offset, $content, $node ) = @$possible;
            my @words = split(/\s/, $content);
            my $path = join('/', @$offset);

            ## need to find the range_start from *this* spot
            if ( $range_start < 0 ) {
                $range_offset = $offset;
                foreach my $child ( $node->nonBlankChildNodes() ) {
                    next unless ( $child->nodeType == 3 );
                    $range_start += 2;
                    my $value = $child->nodeValue;
                    my @chunks = split(/($expr)/, $value);
                    if ( scalar @chunks > 1 ) {
                        my $idx = List::MoreUtils::firstidx { $_ =~ m,$expr, } @chunks;
                        $range_length = length(join('', @chunks[0..$idx]));
                        last;
                    }
                }
            }

            next if ( scalar @possibles && scalar @words < 10 );

            next if ( $last_path && $last_path =~ m,^$path/, );
            $last_path = $path;

            $item_no += 1;

            my @chunks = split(/($expr)/, $content);
            my $__n = 0;
            my @tmp = ();
            my $last_idx = -1;
            while ( scalar @chunks ) {
                $__n += 1;
                last if ( $__n > 100 );
                my $idx = List::MoreUtils::firstidx { $_ =~ m,$expr, } @chunks;
                last if ( $idx < 0);
                last if ( scalar @tmp > $MAX_SNIPPET_WORDS );
                if ( $last_idx >= 0 && $idx - $last_idx > 2 ) {
                    push @tmp, "...";
                }
                $last_idx = $idx;
                my @words = split(/\s/, $chunks[$idx - 1]);
                my $p0 = scalar @words - $MAX_SNIPPET_WORDS / 2;
                $p0 = 0 if ( $p0 < 0 );
                push @tmp, @words[$p0 .. $#words] if ( scalar @words );
                push @tmp, qq{<strong class="solr_highlight_1">$chunks[$idx]</strong>&#160;};
                @chunks = splice(@chunks, $idx + 1);



            }
            if ( scalar @chunks && scalar @tmp < $MAX_SNIPPET_WORDS  ) {
                my $n = scalar @tmp;
                my @words = split(/\s/, $chunks[0]);
                push @tmp, @words[ 0 .. $MAX_SNIPPET_WORDS - $n ];
            }
            @words = @tmp;
            $content = join(' ', @words);

            $XML_result .= '<Result>';

            # $XML_result .= wrap_string_in_tag(join('|', @matched_words), 'Highlight');
            my $temperCgi = new CGI($tempCgi);

            $range_start = 1 if ( $range_start < 0 );
            my $cfi_path = join("/", "", "6", "$chapter_index\[$idref\]") . "!/" . join("/", @$range_offset) . "/$range_start:$range_length";
            # $temperCgi->param('num', $cfi_path);
            # $temperCgi->param('h', join(':', @matched_words));
            my $href = Utils::url_to($temperCgi, $PTGlobals::gPageturnerCgiRoot);

            # my $hash = qq{/$chapter_filename};
            # $hash =~ s,$epub_pathname,,;
            my $hash = $cfi_path;
            # $href .= '#' . $hash;

            $XML_result .= wrap_string_in_tag("$href#$cfi_path", 'Link');
            $XML_result .= wrap_string_in_tag(JSON::XS::encode_json(\@matched_words), 'Highlight');

            # escape entities and ampersands
            $content =~ s,&([\#a-z0-9A-Z]+);,__AMP__$1__SEMI__,gsm;
            $content =~ s,&,&amp;,gsm;
            $content =~ s,__AMP__,&,gsm;
            $content =~ s,__SEMI__,;,gsm;

            $XML_result .= wrap_string_in_tag($content, 'Kwic', [ [ 'path', $path ] ]);
            # calculating $term_hits does not work
            my $term_hits = () = $content =~ /$expr/g;
            $XML_result .= wrap_string_in_tag($term_hits, 'Hits');

            $XML_result .= '</Result>';

            $range_start = -1;
            $range_length = 0;
            $range_offset = undef;

            $num_snippets += 1;
            last if ( $num_snippets >= $MAX_SNIPPETS );
        }

        $XML_result .= '</Page>';
    }

    # open(my $fh, ">", $xml_cache_filename);
    # print $fh $XML_result;
    # close($fh);

    $cache->Set($mdpItem->GetId, "$cache_key.xml", { XML_result => $XML_result });

    # print STDERR "AHOY AHOY XML BUILD : " . ( Time::HiRes::time() - $start_0 ) . "\n";

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
    $temp_cgi->param('debug', scalar $cgi->param('debug'));
    my $skin = $cgi->param('skin');
    if ( defined $skin ) {
        $temp_cgi->param('skin', $skin);
    }
    # my $seq = $cgi->param('seq');
    # if ( defined $seq ) {
    #     $cgi->param('seq', $seq);
    # }

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

sub handle_ITEM_FRAGMENT_SEARCH_RESULTS_PI
    : PI_handler(ITEM_FRAGMENT_SEARCH_RESULTS)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $id = $C->get_object('CGI')->param('id');
    my $rs = $C->get_object('Search::Result::Page');

    my $final_access_status =
        $C->get_object('Access::Rights')->assert_final_access_status($C, $id);

    if ($rs) {
        return WrapFragmentSearchResultsInXml($C, $rs, $final_access_status);
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
#======================================================================
#
#              P I    H a n d l e r   H e l p e r s
#
#======================================================================
#----------------------------------------------------------------------

=item noLastLinkNecessary 

Don't need to navigate to next page if we're on last slice of page results 

=cut

# --------------------------------------------------------------------
sub noLastLinkNecessary
{
    my $focus = shift;
    my $totalMatches = shift;
    my $sliceSize = shift;

    return (ceil($totalMatches/$sliceSize) == ceil($focus/$sliceSize)) ? 1 : 0;
}

#----------------------------------------------------------------------

=item _ls_get_pagelinks

Generate a set of pagination links [start ... end]

=cut

# --------------------------------------------------------------------
sub _ls_get_pagelinks
{
    my $start = shift;
    my $end = shift;
    my $numOccurrences = shift;
    my ($cgi, $current_pageLabel) = @_;
    my $temp_cgi = new CGI($cgi);

    my $pagelinks;

    for my $pageLabel ($start..$end)
    {
        $pagelinks .= _ls_make_pagelink($pageLabel, $numOccurrences, $temp_cgi, $current_pageLabel);
    }

    return $pagelinks;
}

# ---------------------------------------------------------------------

=item _ls_make_pagelink

Create a pagination link: <Href> and <LinkNumber>.
No HREF necessary for focus page.

=cut

# ---------------------------------------------------------------------
sub _ls_make_pagelink
{
    my $pageLabel = shift;
    my $numOccurrences = shift;
    my $temp_cgi = shift;
    my $current_pageLabel = shift;
    my $href;

    my $linkNumberElement = '<LinkNumber>'. $pageLabel .  '</LinkNumber>';
    my $startPage;
    if ($pageLabel eq $current_pageLabel)
    {
	add_attribute(\$linkNumberElement, 'focus', 'true');
    	# $href = '';
        ( $href, $startPage ) = _ls_make_item_page_href($pageLabel, $numOccurrences, $temp_cgi);
    }
    else
    {
        ( $href, $startPage ) = _ls_make_item_page_href($pageLabel, $numOccurrences, $temp_cgi);
    }
    my $url .= wrap_string_in_tag($href, 'Href');
    $url .= $linkNumberElement;
    my $pagelink = wrap_string_in_tag($url, 'FisheyeLink', [['start', $startPage]]);

    return $pagelink;
}

# ---------------------------------------------------------------------

=item _ls_make_item_page_href

Create an HREF. Page being linked to should not be bigger than last page.

=cut

# ---------------------------------------------------------------------
sub _ls_make_item_page_href
{
    my $pageLabel = shift;
    my $numOccurrences = shift;
    my $cgi = shift;

    my $temp_cgi = new CGI($cgi);
    my $sliceSize = $cgi->param('sz');
    # PageLabel 4 points to pageresults 31-40. Thus point this to result page 31.
    my $focusPage = ($pageLabel * $sliceSize) - ($sliceSize - 1);
    $focusPage = ($focusPage > $numOccurrences) ? $numOccurrences : $focusPage;
    $temp_cgi->param('start', $focusPage);
    my $href = CGI::self_url($temp_cgi);

    return ( $href, $focusPage );
}

1;

__END__

=head1 AUTHORS

Phillip Farber, University of Michigan, pfarber@umich.edu

=head1 COPYRIGHT

Copyright 2008-14 ©, The Regents of The University of Michigan, All Rights Reserved

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
