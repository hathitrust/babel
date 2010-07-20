package PT::PageTurnerUtils;

# Copyright, 2005-6, The Regents of The University of Michigan, All Rights Reserved
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

use strict;

use Debug::DUtils;
use Utils;
use Utils::Js;
use Utils::XSLT;
use Utils::Date;
use Identifier;
use Collection;
use PI;
use MirlynGlobals;


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
sub GetMetsXmlFromFile
{
    my $metsXmlFilename = shift;

    my $metsXmlRef = Utils::read_file( $metsXmlFilename );

    return $metsXmlRef;
}

sub GetMetsXmlFilename
{
    my ($itemFileSystemLocation, $id) = @_;

    my $stripped_id = Identifier::get_pairtree_id_wo_namespace($id);
    return $itemFileSystemLocation . qq{/$stripped_id} . $PTGlobals::gMetsFileExtension;
}


# ----------------------------------------------------------------------
# NAME         : GetMdpItem
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetMdpItem
{
    my ($C, $id, $itemFileSystemLocation ) = @_;

    # # Instantiate object
    my $ses = $C->get_object('Session');

    DEBUG('time', qq{<h3>Start mdp item uncache</h3>} . Utils::display_stats());
    my $mdpItem = $ses->get_persistent( 'mdpitem' );
    DEBUG('time', qq{<h3>Finish mdp item uncache</h3>} . Utils::display_stats());

    # if we already have instantiated and saved on the session the
    # full mdpitem for the id being requested, we have everything we
    # need and can return
    if ( $mdpItem  && ( $mdpItem->Get( 'id' ) eq $id ))
    {
        # item is already cached and we have it in $mdpItem.  Test to
        # see if the item files got zipped since the last time we
        # accessed this mdpItem object.
        if (! $mdpItem->ItemIsZipped())
        {
            if (-e $itemFileSystemLocation . qq{/$id.zip})
            {
                $mdpItem->SetItemZipped();
            }
        }

        DEBUG('pt,all', qq{<h3>Using cached mdpItem object for id="$id" zipped="}  . ($mdpItem->ItemIsZipped() || '0') . q{"</h3>});
    }
    else
    {
        # if a different id is being asked for or nothing is set up
        # yet, set up a new MdpItem
        my $metsXmlFilename = GetMetsXmlFilename($itemFileSystemLocation, $id);
        my $metsXmlRef = GetMetsXmlFromFile( $metsXmlFilename );

        ASSERT(($metsXmlRef && $$metsXmlRef),
               qq{ERROR in PageTurnerUtils::GetMdpItem: Invalid or empty METS file});

        DEBUG('pt,all', qq{<h3>METS file: $metsXmlFilename</h3>});

        # Namespace=mdp: GetMetadataFromMirlyn always returns
        # something in $metadata we can use for display.  We assert
        # that the response was OK else we send email via soft_ASSERT
        # and continue execution.
        my ($metadataRef, $metadata_failed) = GetMetadataFromMirlyn($C, $id);

        $mdpItem = new PT::MdpItem( $C,
                                    $id,
                                    $metsXmlRef,
                                    $metsXmlFilename,
                                    $metadataRef,
                                    $itemFileSystemLocation,
                                    $metadata_failed,
                                  );
        $ses->set_persistent('mdpitem', $mdpItem);
    }

    DEBUG('pt,all',
          sub
          {
              return $mdpItem->DumpPageInfoToHtml();
          });

    return $mdpItem;
}

# ---------------------------------------------------------------------

=item _get_OWNERID

Exists solely to support the debug=ownerid switch.  If there is a
Google METS for the id, get the OWNERID attribute element for the page
being viewed.

=cut

# ---------------------------------------------------------------------
sub _get_OWNERID {
   my ($C, $id) = @_;

   return unless (DEBUG('ownerid'));

   my $OWNERID = 'item lacks OWNERID attribute';
   
   my $MdpItem = $C->get_object('MdpItem');
   my $zipfile = $MdpItem->Get('zipfile');

   # Get the Google METS to disk -- there's only on in the zip but we
   # don't know its name
   my $file_pattern_ref = ['*.xml'];
   my $file_sys_location = Identifier::get_item_location($id);
   my $concat_ocr_file_dir =
       Utils::Extract::extract_dir_to_temp_cache
               (
                $id,
                $file_sys_location,
                $file_pattern_ref
               );
   chomp($concat_ocr_file_dir);

   my $google_METS_filename = `ls $concat_ocr_file_dir/*.xml 2> /dev/null`;
   chomp($google_METS_filename);

   # If there is a Google METS, read and parse and get OWNERID
   # attribute value
   my $seq = $C->get_object('CGI')->param( 'seq' );

   if ($google_METS_filename) {
       my $metsXmlRef = Utils::read_file($google_METS_filename, 1);
       if ($$metsXmlRef) {
           my $parser = XML::LibXML->new();
           my $tree = $parser->parse_string($$metsXmlRef);
           my $root = $tree->getDocumentElement();

           # Image fileGrp
           my $imageFileGrp;
           my $xpath = q{//*[name()="METS:mets"][1]/*[name()="METS:fileSec"][1]/*[name()="METS:fileGrp" and @USE="image"][1]/*[name()="METS:file"]} . qq{[$seq]};

           foreach my $node ($root->findnodes($xpath)) {
               # There's just one <METS:file> selected by the XPath
               eval { 
                   $OWNERID = $node->findvalue('@OWNERID'); 
               };
               $OWNERID = 'error parsing OWNER id attribute' if $@;
           }
       }
   }

   DEBUG('ownerid', qq{OWNERID='$OWNERID', SEQ='$seq', id=$id});
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
sub GetMetadataFromMirlyn
{
    my ($C, $id) = @_;

    my $metadata = undef;
    my $url = $MirlynGlobals::gMirlynMetadataURL;
    $url =~ s,__METADATA_ID__,$id,;

    DEBUG('pt,mirlyn,all', qq{<h3>Mirlyn metadata URL: $url</h3>});
    DEBUG('time', qq{<h3>PageTurnerUtils::GetMetadataFromMirlyn(START)</h3>} . Utils::display_stats());

    my $response = Utils::get_user_agent()->get($url);
    my $responseOk = $response->is_success;
    my $responseStatus = $response->status_line;
    my $metadata_failed = 0;

    if ( $responseOk  )
    {
        $metadata = $response->content;

        DEBUG('ptdata,mirlyn',
              sub
              {
                  my $data = $metadata; Utils::map_chars_to_cers(\$data, [q{"}, q{'}]);
                  return qq{<h4>Mirlyn metadata:<br/></h4> $data};
              });

        # Point to surrogate data if the metadata is empty or there
        # was an error
        if ((! $metadata ) || ($metadata =~ m,<error>.*?</error>,))
        {
            $metadata_failed = 1;
            $metadata = <PageTurnerUtils::DATA>
        }
    }
    else
    {
        $metadata_failed = 1;
        $metadata = <PageTurnerUtils::DATA>;

        if (DEBUG('all,pt,mirlyn'))
        {
            ASSERT($responseOk,
                    qq{ERROR in PageTurnerUtils::GetMdpItem: Agent Status: $responseStatus});
        }
        else
        {
            soft_ASSERT($responseOk,
                        qq{ERROR in PageTurnerUtils::GetMdpItem: Agent Status: $responseStatus})
                if ($MdpGlobals::gMirlynErrorReportingEnabled);
        }
    }
    $metadata = Encode::decode_utf8($metadata);

    DEBUG('time', qq{<h3>PageTurnerUtils::GetMetadataFromMirlyn(END)</h3>} . Utils::display_stats());

    return (\$metadata, $metadata_failed);
}



# ----------------------------------------------------------------------
# NAME      : Debug
# PURPOSE   : when debug set, dump environment variables, URI variables,
#             and collection information (from CollsInfo object)
# CALLED BY :
# CALLS     :
# INPUT     :
# RETURNS   :
# NOTES     :
# ----------------------------------------------------------------------
sub Debug
{
    my ( $cgi, $ses ) = @_;

    # ---------------------------
    #        debugging requested?
    DEBUG('version,all',
          sub
          {
              my $s = sprintf( "<h3>Perl version = %vd</h3>", $^V );
              $s .= qq{<h3>main program version = $::VERSION</h3><br />};
              return $s;
          });

    DEBUG('cgi,all',
          sub
          {
              my $s = CGI::as_string();
              $s .= &CGI::br() . &CGI::hr();
              return $s;
          });

    DEBUG('env,all',
          sub
          {
              my $s .= Debug::DUtils::print_env('html');
              $s .= &CGI::br() . &CGI::hr();
              return $s;
          });

    DEBUG('pt,all',
          qq{<h5>Using development Mirlyn, XServer: $MirlynGlobals::gUseMirlynDevServer</h5>});
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
sub GetFullVolumeData
{
    my ( $cgi, $ses, $mdpItem ) = @_;

    my $dataRef = $mdpItem->GetVolumeData();

    # For now: bc2meta returns only the title associated with this
    # physical item, whatever volume that may be. Later: we may want
    # to do additional query to get the other volumes associated with
    # this one

    my $links;
    foreach my $bc ( keys %$dataRef )
    {
        my $href = BuildItemHandle( $mdpItem, $bc );

        $links .= wrap_string_in_tag
            ( wrap_string_in_tag( $href, 'Link' ) .
              wrap_string_in_tag( $$dataRef{$bc}{'vol'}, 'TitleFragment' ),
              'Data' );
    }

    return \$links
}



# ======================================================================
#
#         H i t   H i g h t l i g h t i n g   F u n c t i o n s
#
# ======================================================================

# ----------------------------------------------------------------------
# NAME         : _build_char_map
# PURPOSE      : parse collname.dd or DefaultCharacterMap.xml to construct
#                the list of "from" and "to" characters needed to
#                drive a perl tr/// command emulating the mapping performed
#                by XPAT at index-time and run-time
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------

my %charHash = (
                "a" => "&",
                "b" => "\b",
                "g" => ">",
                "l" => "<",
                "n" => "\n",
                "r"  => "\r",
                "t"  => "\t",
               );

#
# Takes a string containing one character or the ordinal value of a
# character in string form and returns a CHARACTER.  NB this routine
# returns two '\' characters, i.e. '\\\\' if the input is '\' because
# the output is used directly in a tr/// operator string and we don't
# want to escape the following character in the "from" or "to" strings
#
sub _numStr2Char
{
    my $s = shift;

    # parse metachar like "&tab." using just first letter
    if ( $s =~ m,^&([abglnrt]),o )
    {   return $charHash{$1};   }
    # Unicode notation: \x{XXXX} notation
    elsif ( $s =~ s,^U\+,,o )
    {   return chr( hex( $s ) );   }
    # octal notation: convert to \x{XXXX} notation except for '\'
    elsif ( $s =~ m,^\\$,o )
    {   return '\\\\';   }
    elsif ( $s =~ s,^\\,,o )
    {   return chr( oct( $s ) );   }
    # ASCII character
    else
    {   return $s;   }
}

my %gCharMapCache;
sub BuildCharacterMap
{
    my $charMapFile = $PTGlobals::gDd;
    my $dd = 'default';

    DEBUG('highq,highm', qq{<br/>Need map for $dd<br/>\n});

    # Check the cache to see if we have already a map fro this dd.
    if ( $gCharMapCache{$dd})
    {
        DEBUG('highq,highm', qq{Returned chached map for $dd<br/>\n});
        return ( $gCharMapCache{$dd}{'fromref'}, $gCharMapCache{$dd}{'toref'} );
    }

    local $/ = '</Mappings>';

    open( CHARMAP, '<:utf8', "$charMapFile" ) || return ( undef, undef );
    my $map = <CHARMAP>;
    close( CHARMAP );

    # Eliminate record separators, formatting
    # to make the patterns below more robust
    $map =~ s,[\r\n\t],,g;

    my @rawFrom = $map =~ m,<From>(.*?)</From>,g;
    my @rawTo = $map =~ m,<To>(.*?)</To>,g;

    my ( $fromMap, $toMap );
    for ( my $i=0; $i < scalar( @rawFrom ); $i++ )
    {
        # parse e.g. <From><CharRange><First>A</First><Last>Z</Last></CharRange></From>
        # "from" and "to" ranges are guaranteed to be the same size at index time and
        # are assumed to be contiguous.
        if ( $rawFrom[$i] =~ m,Char, )
        {
            my ( $firstFrom, $lastFrom ) =
                $rawFrom[$i] =~ m,<CharRange><First>(.*?)</First><Last>(.*?)</Last>,o;
            my ( $firstTo, $lastTo ) =
                $rawTo[$i] =~ m,<CharRange><First>(.*?)</First><Last>(.*?)</Last>,o;

            my ( $from, $to ) =
                ( ord( _numStr2Char( $firstFrom ) ), ord( _numStr2Char( $firstTo ) ) );
            my $last_from = ord( _numStr2Char( $lastFrom ) );

            while( $from <= $last_from )
            {
                $fromMap .= chr( $from ); $from++;
                $toMap   .= chr( $to ); $to++;
            }
        }
        else
        {
            $fromMap .= _numStr2Char( $rawFrom[$i] );

            # If 'from' is mapped to NULL (<From>x</From><To></To>)
            # make the 'to' be the same as the 'from' to keep the
            # from/to arrays parallel
            $toMap   .= _numStr2Char( $rawTo[$i] ? $rawTo[$i] : $rawFrom[$i] );
        }
    }

    # Cache the map
    $gCharMapCache{$dd}{'fromref'} = \$fromMap;
    $gCharMapCache{$dd}{'toref'} = \$toMap;

    DEBUG('highq,highm', qq{Returned (and cached) newly built map for $charMapFile<br/>\n});

    return ( \$fromMap, \$toMap );
}


# ---------------------------------------------------------------------
# Test the start and end position of a hit to see if either is within the
# start position + length of an already recorded hit match to prevent the
# highlighting of substrings within an already to-be-highlighted hit
# matches.
# ---------------------------------------------------------------------
sub _exclude_substring_match
{
    my ( $startPos, $trailingPos, $hitListHashRef ) = @_;

    foreach my $testtrailingPos ( keys % { $hitListHashRef } )
    {
        my $len = $$hitListHashRef{$testtrailingPos}{'trail'};
        my $teststartPos = $testtrailingPos - $len + 1;

        if (
            ( $startPos >= $teststartPos ) &&
            ( $startPos <= $testtrailingPos )
            ||
            ( $trailingPos >= $teststartPos ) &&
            ( $trailingPos <= $testtrailingPos )
           )
        {
            DEBUG('highq', qq{<font color="blue">overlap</font>, startPos=$startPos, trailPos=$trailingPos <br />\n});
            # does startPos overlap?
            return 1;
        }
    }

    return 0;
}


# ---------------------------------------------------------------------

=item alphabet_is_truncatable

Consult list of scripts that do not use whitespace to delimit words to
affect stemming and highlighting. Steming does not work in e.g. CJK
alphabets because in transforming "term" into "term " the original
term will not be found due to the absence if spaces in CJK.


=cut

# ---------------------------------------------------------------------
sub alphabet_is_truncatable
{
    my $C = shift;
    my $s_ref = shift;

    my $truncatable = 1;
    my @characters = split(//, $$s_ref);
    foreach my $c (@characters)
    {
        if (ord($c) > 0xFF)
        {
            foreach my $alphabet (@PTGlobals::gNoStemScripts)
            {
                if ( $c =~ m,\p{$alphabet},)
                {
                    $truncatable = 0;
                    last;
                }
            }
        }
    }

    return $truncatable;
}


# ----------------------------------------------------------------------
# NAME         : highlight_hit
# PURPOSE      : highlight hits in full page and KWICs
# INPUT        :
# RETURNS      :
# NOTES        : Perl 5.8.0 tr/// is buggy for some translations so
#                highlighting of certain strings from non western
#                languages currently fails.  This is the exception.
#
#                NOTE: KWICs have had CARRIAGE_RETURN replaced by SPACE
# ----------------------------------------------------------------------
sub highlight_hit
{
    my ($C, $parsedQsCgi, $s_ref) = @_;

    # flag to return: false if no hits found, true if hits found
    my $hitFound = 0;

    # Input string can have multiple spaces that XPAT space
    # compression algorithms collapse to a single space.  Emulate that
    # here to make the highlighting regexps match.  We don't use \s
    # because that also matches CARRIAGE_RETURN needed downstream to
    # format the OCR into lines when dealing with a full page. Must be
    # performed on input to preserve offsets.
    $$s_ref =~ s,( [ ]+), ,g;

    # Create a working buffer to match q's within, If encoding of
    # incoming data is UTF-8 the UTF-8 flag will have been set by in
    # XPat::Simple to make Perl treat the string as characters instead
    # of bytes.
    my $buf = $$s_ref;

    # Change all chars between '<' amd '>' and leading and trailing
    # half-tags to ' ' inclusive to avoid matching q's within tags
    # while maintaining character offsets into original data

    # leading half-tags
    $buf =~ s,(^[^<]*>),' ' x length( $1 ),es;
    # trailing half-tags
    $buf =~ s,(<[^>]*)$,' ' x length( $1 ),es;
    # within tags
    $buf =~ s,(<.*?>),' ' x  length( $1 ),ges;

    # Build translation tables
    my ( $fromRef, $toRef ) = BuildCharacterMap();

    DEBUG('highm',
          sub
          {
              my ( $f, $t ) = ( $$fromRef, $$toRef );
              $f =~ tr/\b\n\r\t/    /; $t =~ tr/\b\n\r\t/    /;
              my $s .= qq{<pre>Fm=$f</pre><br />};
              $s .= qq{<pre>To=$t</pre>\n};
              return $s;
          });

    # No highlighting if maps fail to build
    return if ( ! ( $$fromRef && $$toRef ) );

    # Apply translation map to data copy. Perl translation tables are
    # built at compile-time so we have to eval the tr/// to compile
    # the table.
    my $msg = "Translation table compilation failure in highlight_hit";
    eval "\$buf =~ tr/$$fromRef/$$toRef/;";
    ASSERT( ( ! $@ ), $msg  );

    DEBUG('highb', qq{<h2>Buffer after translation:</h2><p>|$buf|</p>\n});

    # Get all words searched for into one array -- remove trailing
    # spaces and apply translation map. Special handling for '*': It
    # might be present, it might be mapped to anything including
    # another '*' or space.  But other terminal chars might be mapped
    # to '*' or space as well. Handle all these cases.

    my $i = 0;
    my %qvalsHash;
    foreach my $q ('q1', 'q2', 'q3', 'q4', 'q5', 'q6', 'q7', 'q8', 'q9')
    {
        my @qvals = $parsedQsCgi->param( $q );
        if ( $qvals[0] )
        {
            foreach my $qv ( @qvals )
            {
                $i++;

                # cut trailing whitespace
                $qv =~ s,(.*?) +$,$1,;
                my $asterisk = $qv =~ s,\*$,,;
                # cut trailing whitespace exposed by removing possible asterisk
                $qv =~ s,(.*?) +$,$1,;
                # if the hit was solely an asterisk: nothing to highlight
                next if ( ! $qv );

                # otherwise push it through the map
                eval "\$qv =~ tr/$$fromRef/$$toRef/;";

                # If mapping produces an empty or whitespace string
                # there's nothing to highlight
                if ( $qv && ( $qv !~ m,^\s+$, ) )
                {
                    $qvalsHash{$qv}{'idx'} = $i;
                    $qvalsHash{$qv}{'wildcard'} = $asterisk;
                    $qvalsHash{$qv}{'truncatable'} = alphabet_is_truncatable($C, \$qv);
                    DEBUG('highq', qq{|$qv|, truncatable=$qvalsHash{$qv}{'truncatable'}<br/>\n});
                }
            }
        }
    }

    # Sort hits in descending order by length of word/phrase so that
    # we can prevent highlighting of substrings within a longer hit
    # string in cases involving data e.g. containing "I will send you
    # a rebel flag", and also "send" elsewhere that within this phrase
    # where the query terms are "I will send you a rebel flag" and
    # "send". See _exclude_substring_match() below.

    # Loop over the data copy recording the offsets of the matches for
    # each potential hit.
    my %hitList;
    foreach my $hit ( sort { length( $b ) <=> length( $a ) } keys %qvalsHash )
    {
        # Use \Q\E to allow for metachars introduced by the character
        # translation mapping. If the hit has an asterisk appended
        # (wildcard) allow chars to appear after the hit up to a word
        # boundary, otherwise delimit the hit with a word boundary
        # immediately following it.

        my $wildcard = $qvalsHash{$hit}{'wildcard'};
        my $truncatable = $qvalsHash{$hit}{'truncatable'};
        my $RE;
        if ( $truncatable )
        {
            if ( $wildcard )
            {   $RE = "\\b(\Q$hit\E.*?)\\b";   }
            else
            {   $RE = "\\b(\Q$hit\E)\\b";   }
        }
        else
        {
            # non-truncatable terms are essentially not wildcardable
            # and not delimited by word boundaries
            $RE = "(\Q$hit\E)";
        }

        my $compRE = qr/$RE/; # compile the pattern
        my $matching = 1;
        while ( $matching )
        {
            if ( $buf =~ m,$compRE,g )
            {
                # Save offset of char following the match and the
                # length of the match to get the match's begin pos.
                # Do not record this match if its start pos is within
                # that of a longer match already recorded because that
                # would amount to highlighting a substring within a
                # larger, already to-be-highlighted string match.
                my $length = length( $1 );
                my $trailingPos = pos($buf);
                my $startPos = $trailingPos - $length;

                DEBUG('highq', qq{<font color="red">match</font>=|$1|, length=$length, startPos=$startPos, trailPos=$trailingPos <br />\n});

                if ( ! _exclude_substring_match( $startPos, $trailingPos, \%hitList ) )
                {
                    $hitList{$trailingPos}{'trail'} = $length;
                    $hitList{$trailingPos}{'idx'} = $qvalsHash{$hit}{'idx'};
                    $hitFound++;
                }
            }
            else
            {   $matching = 0;   }
        }
    }

    return $hitFound  if ( ! $hitFound );

    # Markup for XML vs. HTML and for multicoloring.
    my ( $sMarkup, $eMarkup ) =
        (q{<Highlight class="hilite@" seq="_%%">}, q{</Highlight>});

    my ( $sDefaultMarkupLen, $eMarkupLen ) =
        ( length( $sMarkup ), length( $eMarkup ) );


    # Now we have the offsets at which we need to insert the
    # highlighting markup around the hits in the original data.
    # Copy from the original source to the destination buffer.  Note
    # we reuse the buffer now that the offset list has been built to
    # take advantage of its original memory allocation.

    # leading offsets ----------v----------------v
    # Original string: |--------y( q1 hit )x-----y( q2   hit )x-----|
    #        trailing offsets -------------^------------------^
    #                  lengths ->|   l1   |<-   ->|    l2    |<-

    my $len;
    my $leadOff;
    my ( $srcStart, $destStart ) = ( 0, 0 );

    # Empty the buffer.
    $buf='';

    foreach my $trailOff ( sort { $a <=> $b } keys %hitList )
    {
        my $hitLen = $hitList{$trailOff}{'trail'};
        my $idx = $hitList{$trailOff}{'idx'};

        # copy the substring before a hit from src to destination
        $leadOff = $trailOff - $hitLen;
        $len = $leadOff - $srcStart;
        substr( $buf, $destStart, $len ) = substr( $$s_ref, $srcStart, $len );
        $srcStart += $len;
        $destStart += $len;

        # insert the beginning hit markup into the destination
        # multicolof
        $sMarkup =~ s,@,$idx,;

        # Set correct length for double digit idx= 10, 11, 12, ...
        my $sMarkupLen = $sDefaultMarkupLen + int( $idx / 10 );

        substr( $buf, $destStart, $sMarkupLen ) = $sMarkup;
        $destStart += $sMarkupLen;

        # multicolor
        $sMarkup =~ s,$idx,@,;

        # copy the hit from src to destination
        substr( $buf, $destStart, $hitLen ) = substr( $$s_ref, $srcStart, $hitLen );
        $srcStart += $hitLen;
        $destStart += $hitLen;

        # insert the ending hit markup into the destination
        substr( $buf, $destStart, $eMarkupLen ) = $eMarkup;
        $destStart += $eMarkupLen;
    }

    # copy the substring following the last hit
    substr( $buf, $destStart ) = substr( $$s_ref, $srcStart );

    # supply highlighted terms with sequential attribute values
    my $seq = 1;
    while ( $buf =~ s,seq="_%%",seq="$seq",s )
    {     $seq++;     }

    # If highlighting tag insertion severs an & char from its CER text
    # or the text from its terminal semi-colon, delete it and its
    # text.
    $buf =~ s,&(<Highlight[^>]+>)[a-z]+,$1,g;
    $buf =~ s,&[a-z]+(<Highlight[^>]+>),$1,g;

    # point at new data
    $$s_ref = $buf;

    return $hitFound;
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
sub HighlightMultipleQs
{
    my ($C, $parsedQsCgi, $textRef) = @_;

    my $hitFound = highlight_hit($C, $parsedQsCgi, $textRef);
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
sub SetLastPageTurnerLinkFromSession
{
    my ( $cgi, $ses ) = @_;

    my $url = Utils::url_to( $cgi );

    $ses->set_persistent('lastpageturnerlink', $url);
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
sub GetLastPageTurnerLinkFromSession
{
    my ( $cgi, $ses ) = @_;

    my $url = $ses->get_persistent('lastpageturnerlink');

    return $url;
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
sub DeleteLastPageTurnerLinkFromSession
{
    my $ses = shift;
    $ses->set_persistent('lastpageturnerlink', undef);
}


# ---------------------------------------------------------------------
1;
# ---------------------------------------------------------------------

__DATA__
<present><record><record_header><set_entry>000000000</set_entry></record_header><doc_number>0</doc_number><metadata><oai_marc><fixfield id="008">^^^^^^^uuuu^^^^^^^^^^^^^^^^^^^^^^^^^^^^^</fixfield><varfield id="100" i1="1" i2=" "><subfield label="a">Metadata not available</subfield></varfield><varfield id="245" i1="0" i2="0"><subfield label="a">Metadata not available</subfield></varfield><varfield id="260" i1=" " i2=" "><subfield label="a">Metadata not available</subfield></varfield><varfield id="300" i1=" " i2=" "><subfield label="a">Metadata not available</subfield></varfield></oai_marc></metadata></record><session-id>0</session-id></present>
