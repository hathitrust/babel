package PT::PageTurnerSearchUtils;

# Copyright, 2007, The Regents of The University of Michigan, All Rights Reserved
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# distribute, sublicense, and/or sell copies of the Software, and to
# permit persons to whom the Software is furnished to do so, subject
# to the following conditions:
#
# The above copyright notice and this permission notice shall be
# included in all copies or substantial portions of the Software.

# THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
# EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
# MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
# IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
# CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
# TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
# SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

use PT::MdpItem;
use PT::CompositeResult;

use Search::XPat::Simple;
use Search::XPat::Result;
use Search::XPat::ResultSet;

use Session;
use Utils;
use Utils::Logger;
use Debug::DUtils;
use Identifier;

use Document::XPAT;


# ---------------------------------------------------------------------

=item clean_user_query_string

Do several mappings to make the string compatible with XPAT query
syntax.

Note this process preserves double quotes to support a mixture of
quoted strings (phrases) and single terms all of which can then be
conjoined or disjoined in a web-style query

=cut

# ---------------------------------------------------------------------
sub clean_user_query_string
{
    my $s_ref = shift;

    # remove Perl metacharacters that interfere with the
    # regular expressions we build to highlight hits and to
    # parenthesize XPat queries.
    $$s_ref =~ s,[\\\(\)\[\]\?\$\^\+\|], ,g;

    # remove variations on wild card searches that resolve to
    # searching for the empty string to prevent runaway
    # searches
    $$s_ref =~ s,^\*+,,g;  # no leading '*'
    $$s_ref =~ s,\*+,*,g;  # only a single trailing '*'

    # We now support AND, OR operators in the Solr interface. Remove
    # those so they are not searched as words in the XPAT query.
    $$s_ref =~ s,(\s+AND\s+|\s+OR\s+), ,g;
    
    Utils::trim_spaces($s_ref);
}

# ---------------------------------------------------------------------

=item limit_operand_length

Description

=cut

# ---------------------------------------------------------------------
sub limit_operand_length {
    my $op_ref = shift;
    
    # XPAT accepts a maximum of 256 chars in a query operand.
    if (length($$op_ref) > 256)
    {
        $$op_ref = substr($$op_ref, 0, 255);
    }
}

# ---------------------------------------------------------------------

=item ocr_search_driver

Try an AND search and fall back to an OR.

Thu Dec 3 11:37:30 2009: The fallback scheme has a tendency to hide
pages on which not all of multiple terms appear. From now on we will
use and XPAT OR query exclusively.  This will show the pages on which
all the the terms appear and those on which only some of them occur.

=cut

# ---------------------------------------------------------------------
sub ocr_search_driver
{
    my $C = shift;

    my $mdpItem = $C->get_object('MdpItem');
    my $id = $mdpItem->GetId();

    my $ddFile  = GetOutputDdFileName($id);
    my $xpat = StartXPatSearchEngine($ddFile);

    my $cgi = $C->get_object('CGI');

    my $q1 = $cgi->param('q1');
    my $start = $cgi->param( 'start' );
    my $size = $cgi->param( 'size' );

    my ( $numberOfFinalQs, $parsedQsCgi, $xpatReadySearchTermsArrayRef ) =
        ParseSearchTerms($C, \$q1);

    # Flag indicating whether we redid the query as an "OR"
    my $secondary_query = 0;

    my ($rset, $totalPages, $pageHitCountsRef);
    ($rset,
     $totalPages,
     $pageHitCountsRef) =
# see note        search_OCR_with('AND', $start, $size, $xpat, $xpatReadySearchTermsArrayRef);
         search_OCR_with('OR', $start, $size, $xpat, $xpatReadySearchTermsArrayRef);

# see note     # If more than one term was entered and the terms do no co-occur
# see note     # on any page then redo the search as an OR query to find pages
# see note     # where at least one of the terms might occur
# see note     if (($numberOfFinalQs > 1) && ($totalPages < 1))
# see note     {
# see note         ($rset,
# see note          $totalPages,
# see note          $pageHitCountsRef) =
# see note              search_OCR_with('OR', $start, $size, $xpat, $xpatReadySearchTermsArrayRef);
# see note 
# see note         $secondary_query = 1;
# see note     }

    # if $rset is still undef, it's because the search terms were not
    # valid somehow and the caller will deal with outputting the proper thing
    my $cres = new PT::CompositeResult( $rset,
                                        $parsedQsCgi,
                                        $totalPages,
                                        $pageHitCountsRef,
                                        $secondary_query );
    return $cres;
}


# ---------------------------------------------------------------------

=item search_OCR_with

Description

=cut

# ---------------------------------------------------------------------
sub search_OCR_with
{
    my ($operator, $start, $size, $xpat, $xpatReadySearchTermsArrayRef) = @_;

    my $rset = Search::XPat::ResultSet->new('ptsearch');

    # Total pages
    my $pageRegionExpression = q{region "page"};
    my $pageSearch =
        BuildPageSearch($operator,
                        $pageRegionExpression,
                        $xpatReadySearchTermsArrayRef );
    my $pageQuery = qq{pages = $pageSearch};

    DEBUG('search,all',
          sub
          {
              my $q = $pageQuery;
              Utils::map_chars_to_cers(\$q, [q{"}, q{'}]);
              qq{<font color="green">PT query ($operator): $q</font>};
          });

    eval
    {
        ($error, $results) = $xpat->get_simple_results_from_query($pageQuery);
    };
    ASSERT((! $@), qq{XPAT error: $@});
    ASSERT((! $error), qq{XPAT error: $results});

    strip_SSize_cruft(\$results);
    $totalPages = $results;

    return ($rset, 0, []) if ($totalPages < 1);

    # Slicing
    my $subsetCmd = qq{subset.$start.$size};

    my $pageSliceQuery = qq{pagesslice = $subsetCmd *pages};
    eval
    {
        ($error, $results) = $xpat->get_simple_results_from_query($pageSliceQuery);
    };
    ASSERT((! $@), qq{XPAT error: $@});
    ASSERT((! $error), qq{XPAT error: $results});

    my $qsExpresssion = join(
                             q{ + },
                             @$xpatReadySearchTermsArrayRef
                            );

    my $pageTagName = q{"page-T"};
    my $pageTagExpression = qq{region $pageTagName};
    my $pageTagQuery = qq{pagetags = (($pageTagExpression) within \*pagesslice)};
    eval
    {
        ( $error, $results ) = $xpat->get_simple_results_from_query($pageTagQuery);
    };
    ASSERT((! $@), qq{XPAT error: $@});
    ASSERT((! $error), qq{XPAT error: $results});

    my $printPageTagsQuery = qq{pr.region.$pageTagName \*pagetags};
    $xro = $xpat->get_results_from_query('page', $printPageTagsQuery);
    $rset->add_result_object($xro);

    my $kwicQuery = qq{pr.} .
        $PTGlobals::gPsetOffsetString .
                qq{(($qsExpresssion) within \*pagesslice)};

    DEBUG('search,all',
          sub
          {
              my $s;
              my $x2 = $pageQuery; Utils::map_chars_to_cers(\$x2, [q{"}, q{'}]);
              $s .= qq{<h5>Total Page query: $x2</h5>};
              my $x7 = $pageSliceQuery; Utils::map_chars_to_cers(\$x7, [q{"}, q{'}]);
              $s .= qq{<h5>Page slice query: $x7</h5>};
              my $x3 = $kwicQuery; Utils::map_chars_to_cers(\$x3, [q{"}, q{'}]);
              $s .= qq{<h5>KWIC query: $x3</h5>};
              my $x5 = $pageTagQuery; Utils::map_chars_to_cers(\$x5, [q{"}, q{'}]);
              $s .= qq{<h5>Page tags query: $x5</h5>};
              my $x6 = $printPageTagsQuery; Utils::map_chars_to_cers(\$x6, [q{"}, q{'}]);
              $s .= qq{<h5>Print page tags query: $x6</h5>};
              return $s;
          });

    $xro = $xpat->get_results_from_query('kwic', $kwicQuery);
    $rset->add_result_object($xro);
    ASSERT(($xro->get_type() ne 'Error'),
           qq{XPAT Error: } . join(' ', @{$xro->get_results_as_array_ref()}));

    # Build array of per page hit counts
    $pageHitCountsRef =
        BuildPerPageHitCounts( $rset, $pageRegionExpression, $qsExpresssion );

    return ($rset, $totalPages, $pageHitCountsRef);
}



# ---------------------------------------------------------------------

=item XPAT_truncation_handler

Convert "word" to "word" + "word<" to provide stemming by default.
This also handles the "word<" problem caused by the practice of not
mapping "<" to " " in the XPAT dd file. Also handle no-stem '*'
operator.  See also notes on no_stem_scripts in
global.conf/alphabet_is_truncatable

=cut

# ---------------------------------------------------------------------
sub XPAT_truncation_handler
{
    my $C = shift;
    my $term = shift;

    if ( $term =~ m,\*$, )
    {
        # If user enters "*", take it off and let XPAT expand the term
        # into a sistring as it will
        $term =~ s,\s*\*$,,s;
        $term = '("' . $term . '")';
    }
    else
    {
        # Test whether 1st character comes from any of the
        # non-truncatable alphabets and skip stemming if so. Optimize
        # for the Latin 1 case. See
        my $truncatable =
            PT::PageTurnerUtils::alphabet_is_truncatable($C, \$term);
        DEBUG('search',
              sub
              {
                  my $t = $term;
                  qq{|$t|, truncatable=$truncatable};
              });

        # If user enters just a term, clean it up and then add
        # a space and a "<" and OR them
        if ( $truncatable )
        {
            $term =~ s,\s+$, ,s;
            $term = '("' . $term . ' " + "' . $term . '<")';
        }
        else
        {
            $term = '("' . $term . '")';
        }
    }

    return $term;
}


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub ParseSearchTerms
{
    my ($C, $s_ref) = @_;

    clean_user_query_string($s_ref);

    my @finalQs;
    # fix unpaired double quotes

    # yank out quoted terms
    my @quotedTerms = ( $$s_ref =~ m,\"(.*?)\",gis );

    $$s_ref =~ s,\"(.*?)\",,gis;

    @quotedTerms = grep( !/^\s*$/, @quotedTerms );

    # yank out leftover single instance of double quote, if any
    $$s_ref =~ s,\",,gs;

    Utils::trim_spaces($s_ref);

    # yank out single word terms
    my @singleWords = split( /\s+/, $$s_ref );

    push( @finalQs, @quotedTerms, @singleWords );

    my $cgi = $C->get_object('CGI');
    my $parsedQsCgi = new CGI($cgi);

    my @xPatSearchExpressions = ();

    my $numberOfFinalQs = scalar( @finalQs );
    foreach ( my $i = 0; $i < $numberOfFinalQs; $i++ )
    {
        my $qNumber = 'q' . ( $i + 1 );
        my $qTerm   = $finalQs[$i];

        limit_operand_length(\$qTerm);

        # if the term is empty, remove it
        if ( $qTerm &&
             $qTerm ne '*' )
        {
            push(@xPatSearchExpressions, XPAT_truncation_handler($C, $qTerm));
            $parsedQsCgi->param($qNumber, $qTerm);
        }
    }

    # tack on $numberOfFinalTerms onto the transient cgi, so that it
    # will be available downstream
    $parsedQsCgi->param( 'numberofqs', $numberOfFinalQs );

    DEBUG('search,all',
          sub
          {
              my $s = $parsedQsCgi->as_string();
              return qq{<h3>CGI after parsing into separate terms: $s</h3>};
          });

    my $ipaddr = $ENV{'REMOTE_ADDR'};
    my $log_string = "$ipaddr " . Utils::Time::iso_Time('time') . " " . $parsedQsCgi->query_string();
    Utils::Logger::__Log_string($C, $log_string,
                                     'query_logfile', '___QUERY___', 'ptsearch');

    return ( $numberOfFinalQs, $parsedQsCgi, \@xPatSearchExpressions );
}


# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub BuildPerPageHitCounts
{
    my ( $rset, $pageTagExpression, $qsExpresssion ) = @_;

    my @hitCountList;

    my ( $label, $textRef, $byte, $xpat );

    # Get list of seqs in this slice
    $rset->init_iterator();

    while ( ( $label, $textRef, $byte, $xpat ) = $rset->get_Next_result() )
    {
        last if ( ! $label );

        # Page info
        if ( $label eq 'page' )
        {
            my ( $seq ) = ( $$textRef =~ m,<page SEQ="(.*?)"[^>]*>,is );

            my $pageSelector = qq{<page SEQ=X };
            $pageSelector =~ s,X,$seq,;
            my $pageHitQuery = qq{(($qsExpresssion) within ($pageTagExpression incl "$pageSelector"))};

            DEBUG('search,all',
                  sub
                  {
                      my $y = $pageHitQuery; Utils::map_chars_to_cers(\$y, [q{"}, q{'}]);
                      my $s .= qq{<h5>Page hit query: $y</h5>};
                      return $s;
                  });

            my ( $error, $results ) = $xpat->get_simple_results_from_query($pageHitQuery);
            strip_SSize_cruft( \$results );

            push( @hitCountList, $results );
        }
    }

    return \@hitCountList;
}

# ---------------------------------------------------------------------

=item GetIndexOutputDestDir

Description

=cut

# ---------------------------------------------------------------------
sub GetIndexOutputDestDir
{
    my $id = shift;
    my $outputDestDir =
        $PTGlobals::gIndexCacheDir . Identifier::id_to_mdp_path($id);
    return $outputDestDir;
}

# ---------------------------------------------------------------------

=item GetOutputOcrXmlFileName

Description

=cut

# ---------------------------------------------------------------------
sub GetOutputOcrXmlFileName {
    my $id = shift;

    my $pairtree_id = Identifier::get_pairtree_id_with_namespace($id);
    my $outputFileName =
        GetIndexOutputDestDir($id) . qq{/$pairtree_id} . $PTGlobals::gOcrXmlFileExtension;
    return $outputFileName;

}

# ---------------------------------------------------------------------

=item GetOutputDdFileName

Description

=cut

# ---------------------------------------------------------------------
sub GetOutputDdFileName {
    my $id = shift;

    my $pairtree_id = Identifier::get_pairtree_id_with_namespace($id);
    my $outputDdFile  =
        GetIndexOutputDestDir($id) . qq{/$pairtree_id} . '.dd';
    return $outputDdFile;
}

# ---------------------------------------------------------------------

=item GetOutputDdFileName

Description

=cut

# ---------------------------------------------------------------------
sub GetOutputRgnFileName {
    my $id = shift;

    my $pairtree_id = Identifier::get_pairtree_id_with_namespace($id);
    my $outputRgnFile =
        GetIndexOutputDestDir($id) . qq{/$pairtree_id} . '.rgn';
    return $outputRgnFile;
}

# ---------------------------------------------------------------------

=item GetOutputIdxFileName

Description

=cut

# ---------------------------------------------------------------------
sub GetOutputIdxFileName {
    my $id = shift;

    my $pairtree_id = Identifier::get_pairtree_id_with_namespace($id);
    my $outputIdxFile =
        GetIndexOutputDestDir($id) . qq{/$pairtree_id} . '.idx';
    return $outputIdxFile;
}

# ---------------------------------------------------------------------

=item MaybeBuildDdFile

Description

=cut

# ---------------------------------------------------------------------
sub MaybeBuildDdFile
{
    my ($id, $outputOcrXmlFileName, $initFile, $outputIdxFile, $outputRgnFile, $force_rebuild) = @_;

    my $rebuilt = 0;

    my $outputDdFile = GetOutputDdFileName($id);

    if (
        ! -e $outputDdFile
        ||
        ( @fileStat = stat($outputDdFile))[7] == 0
        ||
        $force_rebuild
       )
    {
        DEBUG('index,all', qq{<h5>Creating dd file: $outputDdFile from $PTGlobals::gDd</h5>});

        # read in blank xpat dd file for use in indexing, make
        # replacements in useable dd file, and save to cache dir
        open( DDFILE, "<$PTGlobals::gDd" );
        my $ddText = join( '', <DDFILE> );
        close( DDFILE );

        $ddText =~ s,<\?XMLFILEPATH\?>,$outputOcrXmlFileName,gs;
        $ddText =~ s,<\?IDXFILE\?>,$outputIdxFile,gs;
        $ddText =~ s,<\?INITFILE\?>,$initFile,gs;
        $ddText =~ s,<\?RGNFILEPATH\?>,$outputRgnFile,gs;

        open( DDFILE, ">$outputDdFile" );
        print DDFILE $ddText;
        close( DDFILE );

        $rebuilt = 1;
        DEBUG('index,time', qq{<h3>dd FINISHED</h3>} . Utils::display_stats());
    }

    return ($outputDdFile, $rebuilt);
}


# ---------------------------------------------------------------------

=item MaybeBuildOcrXmlFile

Description

=cut

# ---------------------------------------------------------------------
sub MaybeBuildOcrXmlFile
{
    my $id = shift;
    my $mdpItem = shift;

    my $rebuilt = 0;

    my $outputOcrXmlFileName = GetOutputOcrXmlFileName($id);

    my @fileStat;
    if (
        ! -e $outputOcrXmlFileName
        ||
        ( @fileStat = stat($outputOcrXmlFileName))[7] == 0
       )
    {
        DEBUG('index,all', qq{<h5>Creating output XML file: $outputOcrXmlFileName</h5>});

        my $doc = new MBooks::Document::XPAT;
        my $fullTextRef = $doc->get_document_content($C, $mdpItem);
        Utils::write_data_to_file( $fullTextRef, $outputOcrXmlFileName );

        $rebuilt = 1;
        DEBUG('index,time', qq{<h3>OCR FINISHED</h3>} . Utils::display_stats());
    }

    return ($outputOcrXmlFileName, $rebuilt);
}

# ---------------------------------------------------------------------

=item MaybeBuildInitFile

Description

=cut

# ---------------------------------------------------------------------
sub MaybeBuildInitFile {
    my $id = shift;

    my $pairtree_id = Identifier::get_pairtree_id_with_namespace($id);
    my $initFile = GetIndexOutputDestDir($id) . qq{/$pairtree_id} . '.init';
    my @fileStat;
    if (
        ! -e $initFile
         ||
         ( @fileStat = stat($initFile))[7] != 0
       ) {
        DEBUG('index,all', qq{<h5>Creating indexing init file: $initFile</h5>});

        my $command = 'touch ' . $initFile;
        system( $command );
    }

    return $initFile;
}

# ---------------------------------------------------------------------

=item BuildIdxIndex

Description

=cut

# ---------------------------------------------------------------------
sub BuildIdxIndex
{
    my ($id, $outputDdFile, $force_rebuild) = @_;

    my ( $command, $result );

    my $idx_file_name = GetOutputIdxFileName($id);

    my @fileStat;
    if (
        ! -e $idx_file_name
        ||
        ( @fileStat = stat($idx_file_name))[7] == 0
        ||
        $force_rebuild
       )
    {
        $command = $PTGlobals::gXPATBLDU . q{ -m 256m -D } . $outputDdFile;
        $result = system( $command ) / 256;

        DEBUG('index,all', qq{<h5>Index command( result="$result" ): $command</h5>});
        ASSERT(($result == 0), qq{[ERROR] result="$result" index command="$command"});
        DEBUG('index,time', qq{<h3>Main index FINISHED</h3>} . Utils::display_stats());
    }
}


# ---------------------------------------------------------------------

=item BuildRgnIndex

Since multirgn needs to be able to create a temporary file in the
current directory, we temporarily change to the idx/cache directory,
where all the XPat index files are permitted for "nobody" (the runner
of the middleware), so that the temp file can be created

=cut

# ---------------------------------------------------------------------
sub BuildRgnIndex
{
    my ($id, $outputDdFile, $force_rebuild) = @_;

    my ( $command, $result );

    my $rgn_file_name = GetOutputRgnFileName($id);

    my @fileStat;
    if (
        ! -e $rgn_file_name
        ||
        ( @fileStat = stat($rgn_file_name))[7] == 0
        ||
        $force_rebuild
       )
    {
        my $currentDir = $ENV{'PWD'};
        chdir $PTGlobals::gIndexCacheDir;

        $command = $PTGlobals::gMULTIRGN . q{ -f -D } . $outputDdFile . q{ -t } . $PTGlobals::gMdpTags;
        $result = system( $command ) / 256;
        ASSERT(($result == 0), qq{[ERROR] result="$result" index command="$command});

        # back to original working directory
        chdir $currentDir;

        DEBUG('index,all', qq{<h5>Multirgn command( result="$result" ): $command</h5>});
        DEBUG('index,time', qq{<h3>Region index FINISHED</h3>} . Utils::display_stats());
    }
}



# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub IndexOcr
{
    my $C = shift;

    DEBUG('index,time', qq{<h3>IndexOcr: Indexing BEGIN</h3>} . Utils::display_stats());

    my $mdpItem = $C->get_object('MdpItem');
    my $id = $mdpItem->GetId();

    my $outputDestDir = GetIndexOutputDestDir($id);
    $mdpItem->CheckCreateDeliveryWebDirectory($outputDestDir);

    # ----------------------------------------------------------------------
    # Create XML to index
    # ----------------------------------------------------------------------
    my ($outputOcrXmlFileName, $xml_rebuilt) =
        MaybeBuildOcrXmlFile($id, $mdpItem);

    # ---------------------------------------------------------------------
    # Create initFile. It is empty (zero bytes)
    # ---------------------------------------------------------------------
    my $initFile = MaybeBuildInitFile($id);

    # ----------------------------------------------------------------------
    # Create the dd the file
    # ----------------------------------------------------------------------
    my $outputIdxFile = GetOutputIdxFileName($id);
    my $outputRgnFile = GetOutputRgnFileName($id);
    my ($outputDdFile, $dd_rebuilt) = MaybeBuildDdFile($id,
                                                       $outputOcrXmlFileName,
                                                       $initFile,
                                                       $outputIdxFile,
                                                       $outputRgnFile,
                                                       $xml_rebuilt);

    # ----------------------------------------------------------------------
    # Create the main (idx) index
    # ----------------------------------------------------------------------
    BuildIdxIndex($id, $outputDdFile, $dd_rebuilt);

    # ----------------------------------------------------------------------
    # Create the region (rgn) index
    # ----------------------------------------------------------------------
    BuildRgnIndex($id, $outputDdFile, $dd_rebuilt);

    DEBUG('index,time', qq{<h3>IndexOcr: Indexing END</h3>} . Utils::display_stats());
}



# ----------------------------------------------------------------------
# NAME         :
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub StartXPatSearchEngine
{
    my $ddFile = shift;

    my $xpat;
    eval
    {
        $xpat = new Search::XPat::Simple
            (
             $ddFile,
             $PTGlobals::gPsetOffset,
            );
    };
    ASSERT(!$@, qq{Error="$@" creating XPat object for $ddFile\n} );

    return $xpat;
}



# ---------------------------------------------------------------------

=item BuildPageSearch

Description

=cut

# ---------------------------------------------------------------------
sub BuildPageSearch
{
    my ( $operator, $pageRegionExpression, $xpatReadySearchTermsArrayRef ) = @_;

    my $xpat_operator = ($operator eq 'AND') ? q{ ^ } : q{ + };
    my $toReturn = join(
                        $xpat_operator,
                        map { qq{( $pageRegionExpression incl $_ )} }
                        @$xpatReadySearchTermsArrayRef
                       );

    return $toReturn;
}

# ---------------------------------------------------------------------

=item strip_SSize_cruft

Description

=cut

# ---------------------------------------------------------------------
sub strip_SSize_cruft
{
    my $s_ref = shift;
    $$s_ref =~ s,</?SSize>,,g;
    Utils::trim_spaces($s_ref);
}



1;
