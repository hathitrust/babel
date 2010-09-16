package PT::MdpItem;
our $AUTOLOAD;

# Copyright 2004-5, The Regents of The University of Michigan, All Rights Reserved
#
# Permission is hereby granted, free of charge, to any person obtaining
# a copy of this software and associated documentation files (the
# "Software"), to deal in the Software without restriction, including
# without limitation the rights to use, copy, modify, merge, publish,
# permit persons to whom the Software is furnished to do so, subjectoc
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


# Define the PTGlobals namespace
use PTGlobals;

# MDP
use Debug::DUtils;
use Utils;
use Utils::Serial;
use Utils::Extract;
use Context;
use Auth::Auth;
use Identifier;

use PT::Document::XPAT;

use PT::PageTurnerUtils;
use XML::LibXML;

use MediaHandler::Image;

# Global variables

# store the paths for each original image file used to create the
# multipage pdf
my @imageFiles;
# store the paths for each scaled image file (png or jpg) used to
# create the multipage pdf. (Use these scaled versions due to
# watermark size issues)
my @scaledImageFiles;

# **********************************************************************
#
# ItemView is a super class for page and clip image viewing largely based
# on the PageView class but refactorization has moved that code to
# this super class.
#
# The structure if this object follows.  Subclasses may add additional
# structure and variants of the 'pageinfo' record. cf. PageView subclass
#
# MdpItem=
#
# **********************************************************************

# ----------------------------------------------------------------------
# NAME      : new
# PURPOSE   : create new object
# CALLED BY :
# CALLS     : $self->_initialize
# INPUT     : idno,  page sequence number
# RETURNS   : NONE
# NOTES     :
# ----------------------------------------------------------------------
sub new
{
    my $class = shift;
    my $mdpItem = shift;
    
    my $self = { 'ProxyItem' => $mdpItem };
    bless $self, $class;
    $self->_initialize(@_);
    return $self;
}

# ----------------------------------------------------------------------
# NAME      : _initialize
# PURPOSE   : create structure for object
# CALLED BY : new
# CALLS     :
# INPUT     : see new
# RETURNS   :
# NOTES     :
# ----------------------------------------------------------------------
sub _initialize
{
    my $self = shift;
    my ( $C, $id, $metsXmlRef, $metsXmlFilename, $metadataRef, $fileSystemLocation, $metadata_failed ) = @_;

    # $self->SetId( $id );
    # $self->Set('namespace', App::Identifier::the_namespace($id));
    # 
    # # Reduce size of METS
    # $self->DeleteExtraneousMETSElements($metsXmlRef);
    # 
    # $self->Set( 'metsxml', $metsXmlRef );
    # $self->Set( 'metsxmlfilename', $metsXmlFilename );
    # $self->Set( 'filesystemlocation', $fileSystemLocation );
    # 
    # my $stripped_id = App::Identifier::get_pairtree_id_wo_namespace($id);
    # my $zipfile = $fileSystemLocation . qq{/$stripped_id.zip};
    # if (-e $zipfile)
    # {
    #     $self->SetItemZipped();
    #     $self->Set('zipfile', $zipfile); 
    # }
    # 
    # my $source_attribute = $C->get_object('AccessRights')->get_source_attribute($C, $id);
    # $self->Set( 'source_attribute', $source_attribute );
    # 
    # $self->Set( 'marcmetadata', $metadataRef );
    # 
    # # --------------------------------------------------
    # 
    # $self->Set( 'defaultsize', $PTGlobals::gDefaultSize );
    # $self->Set( 'defaultseq', $PTGlobals::gDefaultSeq );
    # 
    # $self->Set( 'sizehash', \%PTGlobals::gSizes );
    # $self->Set( 'pdfchunksize', $PTGlobals::gPdfChunkSize );
    # $self->Set( 'metadatafailure', $metadata_failed );
    # 
    # $self->SetPageInfo();
    # 
    # if ( $self->HasPageFeatures() )
    # {
    #     $self->BuildFeatureTable();
    # }
}

sub GetFormatHandler
{
    my $self = shift;

    my $storedFileType = shift;
    my $requestedPageView = shift;

    return $PTGlobals::gViewToFormatHandlers{$storedFileType}{$requestedPageView};
}

sub SetRequestedView
{
    my $self = shift;
    my $view = shift;
    $self->{ 'requestedview' } = $view;
}

sub GetRequestedView
{
    my $self = shift;
    return $self->{ 'requestedview' };
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
sub SetCurrentRequestInfo
{
    my $self = shift;
    my ( $C, $validRotationValuesHashRef ) = @_;

    $self->{ProxyItem}->SetCurrentRequestInfo(@_);

    my $cgi = $C->get_object('CGI');

    my $id     = $cgi->param( 'id' );
    my $seq    = $cgi->param( 'seq' );
    my $num    = $cgi->param( 'num' );
    my $user   = $cgi->param( 'u' );
    my $size   = $cgi->param( 'size' );
    my $orient = $cgi->param( 'orient' );

    # Restrict full pdf to HathiTrust affiliates
    my $view = $cgi->param( 'view' );
    if ($view eq 'fpdf') {
        my $status = $C->get_object('AccessRights')->get_full_PDF_access_status($C, $id);
        if ($status ne 'allow') {
            $view = 'pdf';
            $cgi->param('view', $view);
        }
    }
    $self->SetRequestedView( $view );

    # See note below re: multipage pdf
    return if ($view eq 'fpdf');

    $self->SetRequestedSize( $size );

    # kludwig@umich.edu: Start multipage pdf code here. pfarber@umich:
    # This multipage pdf code was all driven from a panel that is
    # obsolete so the code is too.  Needs to be examined and mostly
    # removed.

    my $pageCount;
    $self->SetConcatenate(0);
    $self->SetPageCount(0);
    $self->SetContainsJp2Jpg(0);
    if ($view eq 'pdf')
    {
	# Set the pg count to 10 regardless of the size given in the
	# cgi parameter for multi-page pdfs This is to prevent the
	# user from getting more than 10 pages at a time.
	if ($cgi->param( 'pgcount' ))
	{
            $pageCount = 10;
	}
	else
	{
            $pageCount = 1;
	}

	$self->SetPageCount($pageCount);

	my @seqNos;

	if($num eq "" || $num < 1)
	{
            DEBUG('all', qq{num is empty or a roman numeral: $num});
	}

	# initialize variables
	my ( $outputDestDir, $outputFileName, $storedFilePath, $jp2FilePath );

	# Check to see if the multi-page pdf already exists in cache
	# to avoid unncessary processing

	# Find the filepath, check to see if it exists
	my $inCache = 0;
	$self->SetConcatenate(1);
	$self->SetRequestedPageSequence( $seq, $num, $user);
	( $outputDestDir, $outputFileName, $storedFilePath ) = $self->BuildOutputImageFileInfo( 'pdf' );
	$self->SetConcatenate(0);

	if ($self->file_exists_n_newer($outputFileName))
	{
            $inCache = 1;
            DEBUG('all', qq{file $outputFileName exists already in cache});
	}
	else {
            $inCache = 0;

            my $seqNo;
            # Process each sequence number individually
            for(my $pg=0;$pg < $pageCount;$pg++)
            {
                # Increment only the sequence number and keep
                # the page number static This is to catch
                # pages w/o numbers in books that have page
                # metadata Example id: mdp.39015061014265

                # There are three variables for sequence numbers
                # 1. $seq is the sequence number given in the URL
                # 2. $seqNum is the next sequence number for each page

                # which is passed to the script to determine
                # if the person should have access to that
                # sequence number
                # 3. $seqNo is the next
                # sequence number for which the user has
                # access
                my $seqNum;

                if($pg eq 0)
                {
                    $seqNum = $seq;

                    # If it's the first page, $user could
                    # be 0 or 1. If it's 1, we want to
                    # preserve that for this first page
                    # only to begin with the right
                    # sequence number.
                    $self->SetRequestedPageSequence( $seqNum, $num, $user);
                }
                else
                {
                    $seqNum = $seqNo + 1;
                    $self->SetRequestedPageSequence( $seqNum, $num, 0);
                }

                $seqNo = $self->GetRequestedPageSequence();
                push(@seqNos, $seqNo);
                my $filetype = $self->GetStoredFileType( $seqNo );
                DEBUG('all', qq{type is $filetype for sequence number $seqNo});

                my ( $scaledOutputDestDir, $scaledOutputPath, $inputFilePath );

                if ( $filetype eq "tif")
                {
                    ( $scaledOutputDestDir, $scaledOutputPath, $storedFilePath ) =
                        $self->BuildOutputImageFileInfo( $PTGlobals::gTif2WebOutputType );
                }
                elsif ( $filetype eq "jpg")
                {
                    ( $scaledOutputDestDir, $scaledOutputPath, $storedFilePath ) =
                        $self->BuildOutputImageFileInfo( 'jpg' );
                    $self->SetContainsJp2Jpg(1);
                }
                elsif ( $filetype eq "jp2")
                {
                    # Construct output jpg filename
                    ( $outputDestDir, $storedFilePath, $jp2FilePath ) =
                        $self->BuildOutputImageFileInfo( 'jpg' );
                    $scaledOutputPath = $storedFilePath;
                    $self->SetContainsJp2Jpg(1);
                }

                DEBUG('all', qq{path for page image $pg : $storedFilePath });

                # If scaled image does not exist, create it
                # Since there is currently a problem where the
                # watermark is a different size in the page by
                # page PDF view, always generate the
                # multi-page pdf from the scaled images (jpegs
                # and pngs) in order to have the watermark
                # consistently sized and consistently placed
                if(! $self->file_exists_n_newer($scaledOutputPath) || $filetype ne "tif")
                {
                    DEBUG('all', qq{generate scaled image page $pg: $scaledOutputPath});
                    $view = 'image';
                    $self->SetRequestedSize( $size );
                    $self->SetRequestedView( $view );
                    DetermineAndSetContentHandler($self);
                    HandleImageContent($self);
                }
                else
                {
                    DEBUG('all', qq{scaled image for page $pg exists: $scaledOutputPath});
                }

                # kludwig@umich.edu: Check to see if the given page already
                # exists This is meant to catch pages at the
                # end of the book.
                # 1. If they enter a
                # starting page number that is less than ten
                # pages from the last page, they will get a
                # pdf with fewer than 10 pages.
                # 2. If they
                # enter a page number greater than the last
                # page or a non-numeric page number, they will
                # get the first ten pages.
                # 3. If there is a
                # suppressed page in range given, the user
                # will get only 9 pages.

                my %is_dup;
                for (@imageFiles) { $is_dup{$_} = 1; }

                if(!($is_dup{$storedFilePath}))
                {
                    push(@imageFiles, $storedFilePath);
                    push(@scaledImageFiles, $scaledOutputPath);
                }

                undef (%is_dup);
            } # end for each
            my $num = scalar(@imageFiles);
            DEBUG('all', qq{num pages in range: $num });

	} # end else (not in cache)

	$self->SetConcatenate(1);

	# Reinitialize the starting sequence
	$self->SetRequestedPageSequence( $seq, $num, $user);
	$view = 'pdf';
	$self->SetRequestedSize( $size );
	$self->SetRequestedView( $view );

    }
    else
    {
        DEBUG('all', qq{single page pdf or image});
        $self->SetRequestedPageSequence( $seq, $num, $user);
        $self->SetConcatenate(0);
    }

    # kludwig@umich.edu: End multipage pdf code here

    my $requestedSequence = $self->GetRequestedPageSequence();

    # The idea here is that only the "rotate clockwise" and "rotate
    # counterclockwise" links will put an orientation param on the URL
    #
    # if the requested orientation is valid, use it
    #      cannot test: if ( $orient ) because "0" is a valid orientation
    #      and would test false in Perl
    my $orientationToUse;

    if ( exists( $$validRotationValuesHashRef{ $orient } ) )
        {
        $self->SetOrientationForIdSequence( $id, $requestedSequence, $orient );
        $orientationToUse = $orient;
        }

    # if there is no requested orientation, use the page's
    # most-recently saved orientation
    else
    {
        $orientationToUse = $self->GetOrientationForIdSequence( $id, $requestedSequence ) ||
            $PTGlobals::gDefaultOrientation;
        $self->SetOrientationForIdSequence( $id, $requestedSequence, $orientationToUse );
    }

    $cgi->param( 'orient', $orientationToUse );
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
sub DetermineAndSetContentHandler {
    my $self = shift;

    my $requestedPageView = $self->GetRequestedView();

    if ( $requestedPageView eq 'text' ) {
        $self->SetContentHandler( 'OcrHandler' );
    }
    elsif ( $requestedPageView eq 'fpdf' ) {
        my $handler = $self->GetFormatHandler('nul', 'fpdf');
        $self->SetContentHandler($handler);
    }
    elsif ( $requestedPageView eq 'image' || $requestedPageView eq 'pdf' ) {
        my $requestedPageSequence = $self->GetRequestedPageSequence();
        my $storedFileType = $self->GetStoredFileType( $requestedPageSequence );
        my $handler = $self->GetFormatHandler( $storedFileType, $requestedPageView );
        $self->SetContentHandler( $handler );

        DEBUG('image,pt,all', qq{ContentHandler set to: $handler});
        ASSERT($handler, qq{No handler set in MdpItem::DetermineAndSetContentHandler} );
    }
    else {
        ASSERT(0, qq{Invalid page view type: "$requestedPageView} );
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
sub OcrHandler
{
    my $self = shift;

    my $hOCR = $self->HasCoordOCR();
    my $fileType = $hOCR ? 'coordocrfile' : 'ocrfile';

    my $ocrFile = $self->GetFilePathMaybeExtract( $self->GetRequestedPageSequence(), $fileType );
    my $ocrTextRef = Utils::read_file($ocrFile, 0, 1);
    DEBUG('all', qq{ocr file is: $ocrFile});

    if ($hOCR)
    {
        my ($hOCR_Body) = ($$ocrTextRef =~ m,<body[^>]*>(.*?)</body>,is);
        # Aaaiiiieee!!!
        $hOCR_Body =~ s,\&shy;,\&\#173;,gis;
        $hOCR_Body =~ s,<br>,<br/>,gis;

        $self->{'ocrtextref'} =  \$hOCR_Body;
    }
    else
    {
        my $doc = new PT::Document::XPAT;
        $doc->clean_xml($ocrTextRef);

        # XMLify line breaks using <br/>
        $$ocrTextRef =~ s,\n,<br />\n,g;

        $self->{'ocrtextref'} =  $ocrTextRef;
    }

    return $self->{'ocrtextref'};
}


# ---------------------------------------------------------------------

=item GetOcrTextRef

Description

=cut

# ---------------------------------------------------------------------
sub GetOcrTextRef
{
    my $self = shift;
    return $self->{'ocrtextref'};
}


# ----------------------------------------------------------------------
# NAME         : GetOcrBySequence
# PURPOSE      : Same function as OcrHandler but returns text without <br> and
#			takes a sequence number as input
# CALLS        :
# INPUT        : Sequence number
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetOcrBySequence
{
    my $self = shift;
    my $sequence = shift;

    my $ocrFile = $self->GetFilePathMaybeExtract( $sequence, 'ocrfile' );
    my $ocrTextRef = Utils::read_file($ocrFile, 0, 1);

    DEBUG('all', qq{ocr file is: $ocrFile});

    my $doc = new PT::Document::XPAT;
    $doc->clean_xml($ocrTextRef);

    $$ocrTextRef =~ s,\n\n,<br /><br />\n,g;

    return $ocrTextRef;
}

# ----------------------------------------------------------------------
# NAME         : CheckCreateDeliveryWebDirectory
# PURPOSE      : Check to see if "cache" directory, into which we will
# CALLS        : deposit/create a file for viewing. If not
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub CheckCreateDeliveryWebDirectory
{
    my $self = shift;
    my $destDir = shift;

    Utils::mkdir_path( $destDir );
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
sub GetPageNumBySequence
{
    my $self = shift;
    my $sequence = shift;

    my $pageInfoHashRef = $self->Get( 'pageinfo' );

    my $pageNumber;
    if ( $self->HasPageNumbers() )
    {
        $pageNumber = $$pageInfoHashRef{ 'sequence' }{ $sequence }{ 'pagenumber' };
    }
    else
    {
        $pageNumber = $sequence;
    }

    return $pageNumber;
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
sub GetFileNameBySequence
{
    my $self = shift;
    my $sequence = shift;
    my $which = shift;

    my $pageInfoHashRef = $self->Get( 'pageinfo' );
    my $fileName = $$pageInfoHashRef{ 'sequence' }{ $sequence }{ $which };

    return $fileName;
}


# ----------------------------------------------------------------------
# NAME         : GetDirPathMaybeExtract
# PURPOSE      : Extract all ocr or img files for a given id from zip archive and drop
#                them in the input cache
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetDirPathMaybeExtract
{
    my $self = shift;
    my $pattern_arr_ref = shift;
    my $which = shift;

    my $fileDir;

    my $fileSystemLocation = $self->Get( 'filesystemlocation' );
    if ($self->ItemIsZipped())
    {
        # Extract file to the input cache location
        $fileDir =
            Utils::Extract::extract_dir_to_temp_cache
                (
                 $self->GetId(),
                 $fileSystemLocation,
                 $pattern_arr_ref
                );
    }
    else
    {
        # File is already available
        $fileDir = $fileSystemLocation;
    }

    return $fileDir;
}

# ----------------------------------------------------------------------
# NAME         : GetFilePathMaybeExtract
# PURPOSE      : Extract ocr/image for a given seq from zip archive and drop
#                it in the input cache
#                unless it's already in the cache or not zipped
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub GetFilePathMaybeExtract
{
    my $self = shift;
    my $sequence = shift;
    my $which = shift;

    my $filePath;

    my $fileName = $self->GetFileNameBySequence($sequence, $which);
    my $fileSystemLocation = $self->Get( 'filesystemlocation' );

    if ($self->ItemIsZipped())
    {
        # Extract file to the input cache location
        $filePath =
            Utils::Extract::extract_file_to_temp_cache
                (
                 $self->GetId(),
                 $fileSystemLocation,
                 $fileName
                );
    }
    else
    {
        # File is already available
        $filePath = $fileSystemLocation . qq{/$fileName};
    }

    return ($fileName, $filePath);
}


# ----------------------------------------------------------------------
# NAME         : HandleImageContent
# PURPOSE      : Determine how the requested page image should be converted,
#                if need be, and put in the web space's cache directory
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub HandleImageContent
{
    my $self = shift;
    
    print STDERR "YO HEY DER\n";

    my $cacheDir      = $PTGlobals::gCacheDir;
    my $cacheDocRoot  = $PTGlobals::gCacheDocRoot;

    my $file_info = MediaHandler::Image::GetImageInfo({mdpItem => $self, linkTo => 'cache'});

    my $targetFileName = $self->{'targetimagefilename'} = $$file_info{'src'};
    $self->{'targetimagefileinfo'} = $file_info;

    ## return $targetFileName;

    ## $targetFileName =~ s,^$cacheDir,$cacheDocRoot,;

    ## $self->{'targetimagefilename'} = $targetFileName;
    
    return $targetFileName;
}

# ---------------------------------------------------------------------

=item GetTargetImageFile

Description

=cut

# ---------------------------------------------------------------------
sub GetTargetImageFile
{
    my $self = shift;
    return $self->{'targetimagefilename'};
}

sub GetTargetImageFileInfo
{
    my $self = shift;
    return $self->{'targetimagefileinfo'};
}


# ----------------------------------------------------------------------
# NAME         : DumpPageInfoToHtml
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub DumpPageInfoToHtml
{
    my $self = shift;

    my $s;
    my $s = $self->{ProxyItem}->DumpPageInfoToHtml();

    # attach any other details

    return $s;
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
sub BuildOutputImageFileInfo
{
    my $self = shift;
    my $outputFileType = shift;

    my $id                    = $self->GetId();
    my $requestedPageSequence = $self->GetRequestedPageSequence();
    my $requestedOrientation  = $self->GetOrientationForIdSequence( $id, $requestedPageSequence );
    my $requestedSize         = $self->GetRequestedSize();

    my ( $storedFileName, $storedFilePath ) =
        $self->GetFilePathMaybeExtract($requestedPageSequence, 'imagefile');

    my $outputDestDir =
        $PTGlobals::gCacheDir . q{/} . Identifier::id_to_mdp_path($id);

    my $outputFileName = $outputDestDir . q{/} .
        join( '.',
              $storedFileName,
              $requestedSize,
              $requestedOrientation,
              $outputFileType );

    # Give the output file a different name if this is for the final
    # concatenation of the multipage pdf
    if ($self->GetConcatenate() eq 1)
    {
	my $pages = $self->GetPageCount() . "pg";

	$outputFileName = $outputDestDir . q{/} .
            join( '.',
                  $storedFileName, $pages,
                  $requestedSize,
                  $requestedOrientation,
                  $outputFileType );
    }

    return ( $outputDestDir, $outputFileName, $storedFilePath );
}

# ---------------------------------------------------------------------

=item file_exists_n_newer

Check existence of web derivative and that its mtime is newer that
mtime of zip file it was derived from.  Assumes all archival files are
in zip files. That should now be the case.

=cut

# ---------------------------------------------------------------------
sub file_exists_n_newer {
    my $self = shift;
    my $derivative = shift;

    my $exists_n_newer = 0;
    
    if (Utils::file_exists($derivative)) {
        my $zipfile = $self->Get('zipfile');

        my $zip_mtime = (stat($zipfile))[9];
        my $der_mtime = (stat($derivative))[9];

        if ($der_mtime > $zip_mtime) {
            $exists_n_newer = 1;
        }
    }
    
    return $exists_n_newer;
}


# ----------------------------------------------------------------------

# proxy method calls to App::MdpItem
sub AUTOLOAD {
    my $self = shift;
    my $mdpItem = $self->{ProxyItem};
    my $name = $AUTOLOAD;
    $name =~ s/.*://; # strip fully-qualified portion

    return $self->{ProxyItem}->$name(@_);
}

1;



__END__;


# if don't want to use tif2web
# convert -sample 1080 -depth 8
#         -blur 2 -sample 540
#         -sharpen 2x1 -quality 0
#         -density 72x72
#  00000011.tif PNG:00000011.png

# not needed since for now using tif2web for bitonal tifs
#        $image->Set( depth  => '8' );
#        $image->Set( type  => 'Grayscale' );

#        $image->Blur( factor   => 2 );
#        $image->Sharpen( radius   => 2 );
