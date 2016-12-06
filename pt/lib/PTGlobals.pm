package PTGlobals;

# Copyright 2006 The Regents of The University of Michigan, All Rights Reserved
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

# Determine the location where this file is being loaded from so
# package variables containing absolute paths can be built to the
# correct location.  debug=local places SDRROOT/mdp-lib in the @INC
# path list *before* its submodule under vendor/ as a development
# shortcut so mdp-lib modules do not have to be committed so they can
# be updated into the vendor/ submodule.
use File::Basename;
my $LOCATION = dirname(__FILE__);
 
# Apply the google watermark (may be affected by metadata indicating
# that the page image is DLPS created vs. Google created.
$gWatermarkingEnabled = 1;

$gMetsFileExtension    = '.mets.xml';
$gOcrXmlFileExtension  = '.ocr.xml';
$gInitFileExtension    = '.init';

# When we get XML compliant HTML for hOCR
$ghOCREnabled          = 0;

# --------------------------------------------------
# needed for creating subdirs in the image caching directory
$gMakeDirOutputLog    = '/tmp/pageturnerdiroutput.log';

## --------------------------------------------------
# Programs run by CGI scripts
my $local_bin_dir = "/l/local/bin";
$gTIF2WEB   = "$local_bin_dir/tif2web";
$gCONVERT   = "$local_bin_dir/convert";
$gXPATBLDU  = "$local_bin_dir/xpatbldu";
$gMULTIRGN  = "$local_bin_dir/multirgn";
$gXPATU     = "$local_bin_dir/xpatu";

$gPsetOffset = 200;
$gPsetOffsetString = $gPsetOffset . qq{ shift.-} . int($gPsetOffset / 2);

# List alphabets that do not use whitespace to delimit words
@gNoStemScripts = ('Han', 'Hiragana', 'Katakana', 'Hangul');
@gValidPageValues = ('root');

# Hash by providing institution (namespace) and digitization agent
# (source_attribute)
$gGraphicsHtmlDir  = $LOCATION . q{/../web/common-web/graphics/};
%gWatermarkImages  = (
                      'mdp'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigMichigan.png},
                                  '2' => $gGraphicsHtmlDir . q{DigMichigan_OrigMichigan.png},
                                  '3' => $gGraphicsHtmlDir . q{DigMichiganPress_OrigMichigan.png},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'miun'  => {
                                  '1' => $gGraphicsHtmlDir . q{},
                                  '2' => $gGraphicsHtmlDir . q{DigMichigan_OrigMichigan.png},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'miua'  => {
                                  '1' => $gGraphicsHtmlDir . q{},
                                  '2' => $gGraphicsHtmlDir . q{DigMichigan_OrigMichigan.png},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'wu'    => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigWisconsin.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'inu'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigIndiana.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'uc1'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigCalifornia.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'uc2'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigCalifornia.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{DigIA_OrigCalifornia.png},
                                 },
                      'pst'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigPenn.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                      'umn'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigMinnesota.png},
                                  '2' => $gGraphicsHtmlDir . q{},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{},
                                 },
                       'nyp'   => {
                                   '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigNYPL.png},
                                   '2' => $gGraphicsHtmlDir . q{DigNYPL_OrigNYPL.png},
                                   '3' => $gGraphicsHtmlDir . q{},
                                   '4' => $gGraphicsHtmlDir . q{DigIA_OrigNYPL.png},
                                  },
                      'chi'   => {
                                  '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigChicago.png},
                                  '2' => $gGraphicsHtmlDir . q{DigChicago_OrigChicago.png},
                                  '3' => $gGraphicsHtmlDir . q{},
                                  '4' => $gGraphicsHtmlDir . q{DigIA_OrigChicago.png},
                                 },
                     'nnc1'  => {
                                 '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigColumbia.png},
                                 '2' => $gGraphicsHtmlDir . q{},
                                 '3' => $gGraphicsHtmlDir . q{},
                                 '4' => $gGraphicsHtmlDir . q{},
                                },
                     'nnc2'  => {
                                 '1' => $gGraphicsHtmlDir . q{DigIA_OrigColumbia.png},
                                 '2' => $gGraphicsHtmlDir . q{},
                                 '3' => $gGraphicsHtmlDir . q{},
                                 '4' => $gGraphicsHtmlDir . q{},
                                },
                    'yale' => {
                                '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigYale.png},
                                '2' => $gGraphicsHtmlDir . q{DigYale_OrigYale.png},
                                '3' => $gGraphicsHtmlDir . q{},
                                '4' => $gGraphicsHtmlDir . q{DigIA_OrigYale.png},
                               },
                    'njp' => {
                                '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigPrinceton.png},
                                '2' => $gGraphicsHtmlDir . q{DigPrinceton_OrigPrinceton.png},
                                '3' => $gGraphicsHtmlDir . q{},
                                '4' => $gGraphicsHtmlDir . q{DigIA_OrigPrinceton.png},
                               },
                    'uiuo' => {
                                '1' => $gGraphicsHtmlDir . q{DigGoogle_OrigIllinois.png},
                                '2' => $gGraphicsHtmlDir . q{DigIllinois_OrigIllinois.png},
                                '3' => $gGraphicsHtmlDir . q{},
                                '4' => $gGraphicsHtmlDir . q{DigIA_OrigIllinois.png},
                               },
                     );

$gCacheDocRoot  = ($ENV{SDRVIEW} eq 'full') ? '/cache-full/imgsrv/' : '/cache/imgsrv/';

# Filesystem root for cached generated images
$gCacheDir      = $ENV{SDRROOT} . (($ENV{SDRVIEW} eq 'full') ? "/cache-full/imgsrv" : "/cache/imgsrv");

# XPAT indexes
$gIndexCacheDir = $ENV{SDRROOT} . (($ENV{SDRVIEW} eq 'full') ? "/cache-full/ptsearch" : "/cache/ptsearch");

# Jp2 info and extraction command templates
$gKduInfoCommand = 
    $ENV{'SDRROOT'} . q{/pt/bin/kdu_expand_record-stdout -i __INPUT_JP2__ -record -};
$gKduExtractCommand = 
    $ENV{'SDRROOT'} . q{/pt/bin/kdu_expand_jpg -quiet -i __INPUT_JP2__ -o __OUTPUT_JPG__ -reduce __LEVEL_CHOICE__ -quality 85};


# ---------------------------------------------------------------------
# Page Features
# ---------------------------------------------------------------------
%gMdpPageFeatureHash =
    (
     'CHAPTER_START'               => 'Section',
     'COPYRIGHT'                   => 'Copyright',
     'FIRST_CONTENT_CHAPTER_START' => 'Section',
     'FRONT_COVER'                 => 'Front Cover',
     'INDEX'                       => 'Index',
     'REFERENCES'                  => 'Bibliography',
     'TABLE_OF_CONTENTS'           => 'Table of Contents',
     'TITLE'                       => 'Title Page',     
    );

%gMiunPageFeatureHash =
    (
     '1STPG' =>'First Page',
#     'ACK'  =>'Acknowledgement',
#     'ADV'  =>'Advertisement',
     'APP'  =>'Appendix',
     'BIB'  =>'Bibliography',
#     'BLP'  =>'Blank Page',
#     'CTP'  =>'Cover Title Page',
     'CTP'  =>'Title Page',
     'DIG'  =>'Digest',
     'ERR'  =>'Errata',
#     'FNT'  =>'Front Matter',
#     'HIS'  =>'History',
#     'IND'  =>'Comprehensive Index',
     'IND'  =>'Index',
     'LOI'  =>'List of Illustrations',
     'LOT'  =>'List of Tables',
#     'MAP'  =>'Map',
#     'MIS'  =>'Miscellaneous',
#     'MSS'  =>'Manuscript',
     'NOT'  =>'Notes',
#     'NPN'  =>'[n/a]',
#     'ORD'  =>'Ordinances',
     'PNI'  =>'Author/Name Index',
     'PNT'  =>'Production Note',
     'PRE'  =>'Preface',
     'PRF'  =>'Preface',
     'REF'  =>'References',
#     'REG'  =>'Regulations',
#     'RUL'  =>'Rules',
     'SPI'  =>'Special Index',
     'SUI'  =>'Subject Index',
     'SUP'  =>'Supplement',
#     'TAB'  =>'Table',
     'TOC'  =>'Table of Contents',
     'TPG'  =>'Title Page',
#     'UNS'  =>'',
#     'VES'  =>'Volume End Sheets',
#     'VLI'  =>'Volume List of Illus',
     'VLI'  =>'List of Illustrations',
     'VOI'  =>'Volume Index',
#     'VPG'  =>'Various Pagination',
#     'VTP'  =>'Volume Title Page',
     'VTP'  =>'Title Page',
#     'VTV'  =>'Volume Title Page Verso',
     'VTV'  =>'Title Page',
);     
     
# ----------------------------------------------------------------------
# Handle link stem
# ----------------------------------------------------------------------
$gHandleLinkStem = q{https://hdl.handle.net/2027/};

# ---------------------------------------------------------------------
# CGI locations (actual server cgi root and URL for it)
# ---------------------------------------------------------------------
$gCgiPathComponent         = ($ENV{'AUTH_TYPE'} eq 'shibboleth') ? '/shcgi' : '/cgi';

$gCollectionBuilderCgiRoot = $gCgiPathComponent . '/mb';
$gPageturnerCgiRoot        = $gCgiPathComponent . '/pt';
$gImgsrvCgiRoot            = $gCgiPathComponent . '/imgsrv';
$gLsSearchCgiRoot                = $gCgiPathComponent . '/ls';
$gPageturnerSearchCgiRoot            = $gCgiPathComponent . '/pt/search';
$gCatalogSearchPattern = "catalog.hathitrust.org/Search/";
$gCatalogRecordPattern = "catalog.hathitrust.org/Record/";
$gCollectionBuilderPattern = qq{$gCgiPathComponent/mb};
$gTrackableReferers = qq{$gCatalogSearchPattern|$gCatalogRecordPattern|$gCollectionBuilderPattern|$gLsSearchCgiRoot};
$gTrackableLimit = 100;

# ---------------------------------------------------------------------
#
# Viewing parameters
#
# ---------------------------------------------------------------------
# tif2web parameters
$gNumGrey = 4;
$gGamma   = 1.1;

# Either gif(-G) or png(-P)
$gTif2WebOutputTypeArg = '-P';
$gTif2WebOutputType    = 'png';

$gDefaultSize         = '100';
$gDefaultSeq          = '1';
$gDefaultNum          = '1';
$gDefaultView         = '1up';
$gDefaultSsdView      = 'plaintext';
$gDefaultOrientation  = '0';
$gDefaultRotation     = '0';

%gValidRotationValues = 
    (
     '0' => '0',
     '1' => '90',
     '2' => '180',
     '3' => '270'
    );

$gStandardPixelWidthAmount = 680;

# map from user interface values to percentages (happens to look to be
# very one to one
%gSizes =
    (
     '400'  => 4.00,
     '300'  => 3.00,
     '200'  => 2.00,
     '175'  => 1.75,
     '150'  => 1.50,
     '125'  => 1.25,
     '100'  => 1.00,
     '75'   => 0.75,
     '50'   => 0.50,
    );

%gSizeLabels =
    (
     '400'  => '400%',
     '300'  => '300%',
     '200'  => '200%',
     '175'  => '175%',
     '150'  => '150%',
     '125'  => '125%',
     '100'  => '100%',
     '75'   => '75%',
     '50'   => '50%',
    );

# Views open to all
@gViewTypes = ( 'image', 'text', '1up', '2up', 'thumb', 'plaintext' );
# Views open to some
@gAuthdViewTypes = ( 'fpdf' );

## --------------------------------------------------

%gViewToFormatHandlers =
    (
     'jp2' => {
               'image'   =>  'Jp2ToJpgHandler',
               'pdf'     =>  'Jp2ToPdfHandler',
              },
     'jpg' => {
               'image'   =>  'JpgToJpgHandler',
               'pdf'     =>  'JpgToPdfHandler',
              },
     'tif' => {
               'image'   =>  'TifToWebHandler',
               'pdf'     =>  'TifToPdfHandler',
              },
    );

$gDefaultSliceSize = 10;
$gDefaultMaxSliceSize = 25;


# ------------------------------------------------------------
1;
