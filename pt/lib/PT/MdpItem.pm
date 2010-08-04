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

# 3rd Party
use Image::Magick;

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
# NAME         : Jp2ToJpgExtractParameters
# PURPOSE      : Retrieve information from a JPEG2000 file type
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub Jp2ToJpgExtractParameters
{
    my $self = shift;

    my $inputFilePath = shift;
    my $outputRatio = shift;

    ASSERT( ( -e $inputFilePath ), qq{file $inputFilePath does not exist} );

    # Get the number of resolution levels in the jp2 file, the height
    # and width of the image at the highest resolution level.
    my ( $nlev, $tWidth, $tHeight ) = $self->GetJp2FileParameters( $inputFilePath );

    my $requestedWidth =
        min( $PTGlobals::gStandardPixelWidthAmount * $outputRatio, $tWidth );
    my $aspectRatio =   $tHeight / $tWidth;
    my $requestedHeight = int( $requestedWidth * $aspectRatio );

    my $nlChosen = 0;
    my $extractWidth;

    # Find the resolution level that has the closest width greater
    # than the requested output width so we can scale downward to the
    # exact width. 0 is the level with highest resolution
    my @levels =  ( 0 .. $nlev );
    foreach my $nl ( reverse @levels )
    {
        # Calculate the width of the input file at the current
        # resolution
        $extractWidth  = int( $tWidth / ( 2**$nl ) );

        if ( $extractWidth >= $requestedWidth )
        {
            $nlChosen = $nl;
            last;
        }
    }

    return ( $nlChosen, $requestedWidth, $requestedHeight );
}


# ----------------------------------------------------------------------
# NAME         : ExtractJp2Info
# PURPOSE      : Take the jp2 information returned by kdu_expand -quiet
#                and parse it for three particular values
# INPUT        : String of text that was returned from the caller's call
#                to kdu_expand
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub ExtractJp2Info
{
    my $self = shift;
    my $jp2Info = shift;

    # ?????????? or split on \n??????
    my @lines = split( /\x0A/, $jp2Info );

    my ( $Ssize )   =  grep(/^Ssize/, @lines);
    my ( $Clevels ) =  grep(/^Clevels/, @lines);

    $Ssize =~ m/Ssize=\{([^,]*),([^\}]*)\}/i;
    my $maxheight = $1;
    my $maxwidth = $2;

    my ( $cruft, $levels ) = split( /\=/, $Clevels );
    chomp( $levels );

    return ( $levels, $maxwidth, $maxheight );
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
sub GetJp2FileParameters
{
    my $self = shift;
    my $jp2File = shift;

    # Get maximum dimensions and number of levels in stored jp2 image
    my $jp2InfoCommand = $PTGlobals::gKduInfoCommand;
    $jp2InfoCommand =~ s,__INPUT_JP2__,$jp2File,;

    my $jp2Info = qx( $jp2InfoCommand );
    ASSERT( ($? == 0), qq{GetJp2FileParameters: command="$jp2InfoCommand" failed with code="$?"} );

    if ( ! $jp2Info || ( $jp2Info !~ m,Clevels,) )
    {
        ASSERT( 0, qq{GetJp2FileParameters: failed for jp2 file="$jp2File" with error="$jp2Info"} );
    }

    my ( $levels, $maxwidth, $maxheight ) = $self->ExtractJp2Info( $jp2Info );

    return ( $levels, $maxwidth, $maxheight );
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
sub KakaduCreateJpg
{
    my $self = shift;

    my $jp2InputFile = shift;
    my $outputFileName = shift;

    # Get parameters for the extraction, rotation and scaling operation
    my $requestedSize = $self->GetRequestedSize();
    my $outputRatio = $PTGlobals::gSizes{ $requestedSize };

    my ( $nlChosen, $outputWidth, $outputHeight ) =
        $self->Jp2ToJpgExtractParameters( $jp2InputFile, $outputRatio );

    # Extract rotated resolution for $nlChosen
    my $rotation = $self->GetOrientationInDegrees();
    my $jp2ExtractCommand = $PTGlobals::gKduExtractCommand;
    $jp2ExtractCommand =~ s,__INPUT_JP2__,$jp2InputFile,;
    $jp2ExtractCommand =~ s,__OUTPUT_JPG__,$outputFileName,;
    $jp2ExtractCommand =~ s,__LEVEL_CHOICE__,$nlChosen,;
    if ( $rotation != 0 )
    {
        $jp2ExtractCommand .= qq{ -rotate $rotation};
        if ( $rotation != 180 )
        {
            my $tmp = $outputWidth;
            $outputWidth = $outputHeight;
            $outputHeight = $tmp;
        }
    }

    qx( $jp2ExtractCommand );
    ASSERT( ($? == 0), qq{Jp2ToJpgHandler: command="$jp2ExtractCommand" failed with code="$?"} );

    #  Scale it to the exact size requested, watermark
    my $image = new Image::Magick;

    #kludwig@umich.edu: Set the density before reading the file. Must be 72x72 if creating multipage pdf
    #Density of tifs is fine by default. JP2 and JPG are different.

    if($self->GetContainsJp2Jpg() eq 1)
    {
	    $image->Set( density => "72x72" );
	    #DEBUG('all', qq{JPG or JP2, KakaduCreateJpg, set density to 72x72 });
    }

    $image->Read( $outputFileName );

    # ==================================================
    # Watermark as needed: If single page view only or still
    # processing individual pages for pdf
    # ==================================================
    if($self->GetPageCount() eq 0 || $self->GetConcatenate() eq 0)
    {
	    $image->Sample( width  => $outputWidth,
                    height => $outputHeight );
	    $self->WatermarkImageMagickObject( $image );
    }


    # Record these transformations to disk cache in case this file is
    # requested for view=image
    WriteImageMagickObjectToDisk( $image, $outputFileName );

    DEBUG('image,pt,all',
          sub
          {
              my $s = qq{KakaduCreateJpg:<br/>\n} .
                  join( '<br/>',
                        qq{jp2 extract cmd: $jp2ExtractCommand},
                        qq{Input file path: $jp2InputFile},
                        qq{Output file path: $outputFileName},
                        qq{Scale factor: $outputRatio},
                        qq{Rotation degrees: $rotation},
                        qq{Chosen level: $nlChosen},
                        qq{Output Width: $outputWidth},
                        qq{Output Height: $outputHeight<br/>},
                      );
              return $s;
          }
         );

    return $image;
    # Caller must destroy
}

# ----------------------------------------------------------------------
# NAME         : Jp2ToJpgHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      : name of resized jpg file created
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        : uses imagemagick's mogrify and info in self to create a jpg file
#                and deposit it in the proper directory
# ----------------------------------------------------------------------
sub Jp2ToJpgHandler
{
    my $self = shift;

    my ( $outputDestDir, $outputFileName, $storedFilePath )
        = $self->BuildOutputImageFileInfo( 'jpg' );

    if ($self->file_exists_n_newer($outputFileName) && $self->GetPageCount() eq 0 )
    {
        DEBUG('image,pt,all',
            sub
            {
                my $s = qq{Jp2ToJpgHandler:<br/>\n} .
                    join( '<br/>',
                          qq{Input file path: $storedFilePath},
                          qq{Output file path (CACHED): $outputFileName<br/>},
                        );
                return $s;
            });

        return $outputFileName;
    }
    # POSSIBLY NOTREACHED

    # Create sub dir in which to deposit image file, if dir doesn't exist already
    $self->CheckCreateDeliveryWebDirectory( $outputDestDir );

    # Extract, scale, rotate and watermark the JPG
    my $image = $self->KakaduCreateJpg( $storedFilePath, $outputFileName );

    WriteImageMagickObjectToDisk( $image, $outputFileName );

    # destroy Image::Magick object
    $image = undef;

    DEBUG('image,pt,all',
          sub
          {
              my $s = qq{Jp2ToJpgHandler:<br />\n} .
                  join( '<br/>',
                        qq{Input file path: $storedFilePath},
                        qq{Output file path: $outputFileName<br/>},
                      );
              return $s;
          });

    return $outputFileName;
}




# ----------------------------------------------------------------------
# NAME         : JpgToJpgHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      : name of resized jpg file created
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        : uses imagemagick's mogrify and info in self to create a jpg file
#                and deposit it in the proper directory
# ----------------------------------------------------------------------
sub JpgToJpgHandler
{
    my $self = shift;

    my ( $outputDestDir, $outputFileName, $storedFilePath )
        = $self->BuildOutputImageFileInfo( 'jpg' );

    # Create sub dir in which to deposit image file, if dir doesn't exist already
    $self->CheckCreateDeliveryWebDirectory( $outputDestDir );

    my $requestedSize = $self->GetRequestedSize();
    my $outputRatio = $PTGlobals::gSizes{ $requestedSize };

    $self->CheckCreateImageViaImageMagick( $storedFilePath, $outputFileName, $outputRatio, 'jpg' );

    return $outputFileName;
}



# ----------------------------------------------------------------------
# NAME         : TifToWebHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub TifToWebHandler
{
    my $self = shift;

    # Initial implemetation: Since using ImageMagick Convert to
    # resize, grayscale and then possibly rotate a tiff file into a
    # png or gif takes a long time (about 2 seconds), we are for now
    # using tif2web to scale and grayscale a tif, convert it to a gif
    # and then rotate it, only if rotation is necessary, using
    # ImageMagick in a second step

    # Fri Oct 6 13:46:29 2006 pfarber: Using tif2web -F to do scaling
    # is fast but only produces a few discrete sizes rather than exact
    # sizes counter to the user's expectation. tif2web -A exact
    # scaling is almost as fast for reasonable downsampling factors,
    # i.e. > 4.0. but to calculate the final scale factor we require
    # the initial width of the tif.  ImageMagick->Ping proved to be a
    # slow piggy. tiffinfo is quite fast so we use that below.
    # ImageMagick is still used to rotate.


    # value saved in object should already have been determined
    my $rotationInDegrees = $self->GetOrientationInDegrees();

    # need general information to proceed
    my ( $outputDestDir, $finalOutputFileName, $storedFilePath ) =
        $self->BuildOutputImageFileInfo( $PTGlobals::gTif2WebOutputType );

    DEBUG('image,pt,all',
          sub
          {
              my $s = qq{TifToWebHandler:<br/>\n} .
                  join( '<br/>',
                        qq{Stored file path: $storedFilePath},
                        qq{Output Destination Directory: $outputDestDir},
                        qq{Final Output File Name: $finalOutputFileName<br/>},
                      );
              return $s;
          });

    # we are using tif2web to create a image that is oriented in the same way
    # as the original.
    # ImageMagick will be used to rotate it if need be in a second step.
    my $preRotationOutputFileName = $finalOutputFileName;
    my $type = $PTGlobals::gTif2WebOutputType;
    $preRotationOutputFileName =~ s,\d\.$type,orig\.$type,;

    # create sub dir in which to deposit gif file, if dir doesn't exist already
    $self->CheckCreateDeliveryWebDirectory( $outputDestDir );

    # ==================================================
    # If final, rotated file is available in cache, we'll just return it
    # ==================================================
    # If we need to create a final, rotated image,
    # check to see if pre-rotation output file, from
    # which it will be derived, already exists in cache
    # ==================================================
    if (! $self->file_exists_n_newer($finalOutputFileName))
    {
        # ==================================================
        # if pre-rotated image does not exist in cache, create it
        if(! $self->file_exists_n_newer($preRotationOutputFileName))
        {
            my $requestedSize = $self->GetRequestedSize();
            my $outputRatio = $PTGlobals::gSizes{ $requestedSize };

            $self->Tif2WebCreateFile( $storedFilePath,
                                      $preRotationOutputFileName,
                                      $outputRatio );
        }

        # ==================================================
        # now, create ImageMagick object for manipulation (rotation and watermarking)
        # ==================================================
        my $image = new Image::Magick;
	$image->Read( $preRotationOutputFileName );

        # ==================================================
        # Rotate if needed
        # ==================================================
        $self->RotateImageMagickObject( $image, $rotationInDegrees )
            if ( $rotationInDegrees != 0 );

        # ==================================================
        # Watermark as needed
        # ==================================================
        $self->WatermarkImageMagickObject( $image );

        # Write and destroy Image::Magick object
        WriteImageMagickObjectToDisk( $image, $finalOutputFileName );
        $image = undef;
    }

    soft_ASSERT(Utils::file_exists($finalOutputFileName),
                qq{Could not create file="$finalOutputFileName" } .
                qq{File does not exist or exists but is zero bytes in size. } .
                qq{Error message in file="$PTGlobals::gMakeDirOutputLog"});

    return $finalOutputFileName;
}

# ----------------------------------------------------------------------
# NAME         : Tif2WebCreateFile
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub Tif2WebCreateFile
{
    my $self = shift;
    my ( $inFilePath, $outFilePath, $outputRatio ) = @_;

    my $info = qx( tiffinfo $inFilePath 2>> $PTGlobals::gMakeDirOutputLog );
    my ( $archiveWidth ) = ( $info =~ m,Width:\s+(\d+), );
    soft_ASSERT($archiveWidth,
                qq{tiffinfo $inFilePath failed} .
                qq{Error message file="$PTGlobals::gMakeDirOutputLog"});

    my $reductionFactor = $archiveWidth / $PTGlobals::gStandardPixelWidthAmount;
    my $finalScaleFactor = $reductionFactor / $outputRatio;
    $finalScaleFactor = max( 1.0, min( 16.0, $finalScaleFactor ) );

    my $scaleCmd = qq{ -A $finalScaleFactor };
    my $arg = $PTGlobals::gTif2WebOutputTypeArg;
    my $commandParams =
        qq{$arg -N $PTGlobals::gNumGrey -g $PTGlobals::gGamma } .
            $scaleCmd .
                qq{ -x -o $outFilePath $inFilePath};

    my $command = qq{$PTGlobals::gTIF2WEB $commandParams};
    DEBUG('image,pt,all', qq{<br/>Tif2WebCreateFile command: $command<br/>\n});

    qx( $command 2>> $PTGlobals::gMakeDirOutputLog );
}


# ----------------------------------------------------------------------
# NAME         : Jp2ToPdfHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub Jp2ToPdfHandler
{
    my $self = shift;

    # Construct output jpg filename
    my ( $outputDestDir, $outputJpgFileName, $storedFilePath )
        = $self->BuildOutputImageFileInfo( 'jpg' );

    # Construct output pdf filename
    my ( $x, $outputPdfFileName, $y )
        = $self->BuildOutputImageFileInfo( 'pdf' );

    if ($self->file_exists_n_newer($outputPdfFileName))
    {
        DEBUG('image,pt,pdf,all',
              sub
              {
                  my $s = qq{Jp2ToPdfHandler:<br/>\n} .
                      join( '<br />',
                            qq{Input file path: $storedFilePath},
                            qq{Output file path (CACHED): $outputPdfFileName<br/>},
                          );
              });
    } #end if pdf exists
    else
    {
        # Create sub dir in which to deposit image file, if dir doesn't exist already
        $self->CheckCreateDeliveryWebDirectory( $outputDestDir );

        # Image::Magick object
        my $image;
        my $inCache = 0;

        # If the JPG for the JP2 already exists or if this is the last page
        # in a pdf
        if ($self->file_exists_n_newer($outputJpgFileName) || $self->GetConcatenate() eq 1)
        {

            if ($self->GetConcatenate() eq 1)
            {
                DEBUG('pdf, all', qq{processing pdf });

                $image = new Image::Magick;
                # Read image files to create single or multipage pdf
                foreach my $file (@scaledImageFiles)
                {
                    DEBUG('pdf, all', qq{Use ImageMagick to read scaled $file });
                    $image->Read( $file )
                }
            }
        }
        else
        {
            # Extract, scale, rotate and watermark the JPG
            $image = $self->KakaduCreateJpg( $storedFilePath, $outputJpgFileName );

            DEBUG('image,pt,all',
		  sub
		  {
		      my $s = qq{Jp2ToPdfHandler:<br/>\n} .
			  join( '<br />',
				qq{Input file path: $storedFilePath},
				qq{Generated JPG: $outputJpgFileName<br/>},
				qq{Output file path: $outputPdfFileName<br/>},
			      );
		      return $s;
		  });
        }

        WriteImageMagickObjectToDisk( $image, $outputPdfFileName );

        soft_ASSERT(Utils::file_exists($outputPdfFileName),
                    qq{Could not create file="$outputPdfFileName"});

        #destroy arrays
        undef(@imageFiles);
        undef (@scaledImageFiles);

        # destroy Image::Magick object
        @$image = ();
        undef ($image);

    } #end if pdf does not already exist

    if ($self->file_exists_n_newer($outputPdfFileName))
    {
        if ($self->GetPageCount() > 1)
        {
            my $cgi = CGI->new();

            if ( $cgi->param( 'debug' ) ne "all" && $cgi->param( 'debug' ) ne "watermark")
            {
                my $start = index ($outputPdfFileName, "/cache");
                my $location = substr( $outputPdfFileName, $start);
                my $href = 'http://' . Utils::HTTP_hostname() . $location;
                DEBUG('all', qq{Redirect user to $href });

                #Get file name
                my @parts = split(/\//, $outputPdfFileName);
                my $file = $parts[-1];

                #Download pdf as attachment
                #Code from: http://www.perlmonks.org/?node_id=419216

                print "Content-type: application/pdf\n";
                print "Content-Disposition: attachment; filename=$file\n";
                print "\n";

                open    TMP, "$outputPdfFileName" or die "Error message here: $!\n\n";
                binmode TMP;
                binmode STDOUT;

                print <TMP>;

                exit;
            } #end if multipage pdf and not debug mode
            else
            {
                DEBUG('all',
                      sub
                      {
                          my $s = qq{Jp2ToPdfHandler: Multi-page pdf <br/>\n} .
                              join( '<br />',
                                    qq{Output file path: $outputPdfFileName<br/>},
                                  );
                          return $s;
                      });
            } #end if multipage pdf and am in debug mode
        } #end if multipage pdf
        elsif ($self->GetPageCount() eq 1)
        {
            DEBUG('all',
                  sub
                  {
                      my $s = qq{Jp2ToPdfHandler: Single page pdf <br/>\n} .
                          join( '<br />',
                                qq{Output file path: $outputPdfFileName<br/>},
                              );
                      return $s;
                  });
        } #end if single-page pdf
    }

    return $outputPdfFileName;
}

# ----------------------------------------------------------------------
# NAME         : JpgToPdfHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub JpgToPdfHandler
{
    my $self = shift;

    return $self->SimplePdfHandler();

}

# ----------------------------------------------------------------------
# NAME         : TifToPdfHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub TifToPdfHandler
{
    my $self = shift;

    return $self->SimplePdfHandler();
}

# ----------------------------------------------------------------------
# NAME         : SimplePdfHandler
# PURPOSE      :
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS :
# NOTES        :
# ----------------------------------------------------------------------
sub SimplePdfHandler
{
    my $self = shift;

    my ( $outputDestDir, $outputFileName, $storedFilePath )
        = $self->BuildOutputImageFileInfo( 'pdf' );

    # Create sub dir in which to deposit image file, if dir doesn't
    # exist already
    $self->CheckCreateDeliveryWebDirectory( $outputDestDir );

    my $outputRatio = 3;
    $self->CheckCreateImageViaImageMagick( $storedFilePath,
                                           $outputFileName,
                                           $outputRatio,
                                           'pdf' );

    return $outputFileName;
}


# ---------------------------------------------------------------------

=item FullPdfHandler

'-' writes to STDOUT. 'LETTER' is the default.

=cut

# ---------------------------------------------------------------------
my $patterns_arr_ref = ['*.jp2', '*.tif', '*.txt'];

sub FullPdfHandler {
    my $self = shift;
    my $C = shift;

    # This takes a long time to compile
    require PT::PDF;

    my $id = $C->get_object('CGI')->param('id');
    my $file_sys_location = Identifier::get_item_location($id);

    # dir of image files
    my $burst_dir = Utils::Extract::extract_dir_to_temp_cache
        ($id, $file_sys_location, $patterns_arr_ref);

    # watermark
    my $source_attribute = $self->Get('source_attribute');
    my $namespace = Identifier::the_namespace($id);
    my $watermark_filename = $PTGlobals::gWatermarkImages{$namespace}{$source_attribute};

    my $header_vals_ref =
            {-Content_type        => qq{application/pdf},
             -Content_Disposition => qq{attachment; filename=$id.pdf},
            };

    print STDOUT CGI::header($header_vals_ref);
    binmode STDOUT;
    PT::PDF::API3createPDF({
                            -outputfile    => '-',
                            -watermarkfile => $watermark_filename,
                            -inputdir      => $burst_dir,
                            -pagesize      => 'LETTER',
                            -searchable    => 1,
                           });
    exit;
}


# ----------------------------------------------------------------------
# NAME         : CheckCreateImageViaImageMagick
# PURPOSE      : Creates the image or pdf of the given page(s).
# CALLS        :
# INPUT        :
# RETURNS      :
# GLOBALS      :
# SIDE-EFFECTS : This method has been updated to create multipage pdfs.
# NOTES        :
# ----------------------------------------------------------------------
sub CheckCreateImageViaImageMagick
{
    my $self = shift;

    my ( $storedFilePath, $outputFileName, $outputRatio, $outputFileType ) = @_;

    my $cgi = CGI->new();

    # check to see if output file already exists in cache
    if(! $self->file_exists_n_newer($outputFileName))
    {
        # value saved in object should already have been determined
        my $rotation = $self->GetOrientationInDegrees();

        my $image = new Image::Magick;
	# kludwig@umich.edu: Set the density before reading the file. Must be 72x72
	# if creating multipage pdf that contains any JP2 and JPG
	$image->Set( density => "72x72" );

	if ($self->GetConcatenate() eq 1) {

		DEBUG('all', qq{processing pdf });

		# Read image files to create single or multipage pdf
		foreach my $file (@scaledImageFiles)
		{
			DEBUG('all', qq{Use ImageMagick to read $file });
			$image->Read( $file )
		}

		my $cgi = CGI->new();

		WriteImageMagickObjectToDisk( $image, $outputFileName );

		soft_ASSERT(Utils::file_exists($outputFileName),
				qq{Could not create file="$outputFileName"});

		#destroy arrays
		undef(@imageFiles);
		undef (@scaledImageFiles);

		# destroy Image::Magick object
		@$image = ();
		undef ($image);

	} # end if last page of pdf
	elsif ($self->GetConcatenate() eq 0)
	{
            # processing single page within multipage pdf or single image
            $image->Read( $storedFilePath );
            DEBUG('all', qq{processing single page within multipage pdf or single image });

            my $originalWidth  = $image->Get( 'width' );
            my $originalHeight = $image->Get( 'height' );

            my $finalRatio;

            if($outputRatio > 0)
            {
                $finalRatio =  ( $PTGlobals::gStandardPixelWidthAmount / $originalWidth ) * $outputRatio;
            }
            else
            {
                $finalRatio = ( $PTGlobals::gStandardPixelWidthAmount / $originalWidth );
            }

            my $outputWidth  = int( $originalWidth * $finalRatio );
            my $outputHeight = int( $originalHeight * $finalRatio );

            $image->Sample( width  => $outputWidth,
                            height => $outputHeight );
            $self->RotateImageMagickObject( $image, $rotation )
                if ( $rotation != 0 );
            $image->Set( quality => 80 )
                if ( $outputFileType eq 'jpg');

            # ==================================================
            # Watermark as needed: If single page image view only or still
            # processing individual pages for pdf
            if($self->GetPageCount() eq 0 || $self->GetConcatenate() eq 0)
            {
                $self->WatermarkImageMagickObject( $image );
            }

            DEBUG('image,pt,all',
                  sub
                  {
                      my $s = qq{CheckCreateImageViaImageMagick: NEW IMAGE<br />\n} .
                          join( '<br />',
                                qq{Stored file path: $storedFilePath},
                                qq{Final Output File Name: $outputFileName},
                                qq{Original width: $originalWidth},
                                qq{Output width: $outputWidth},
                                qq{Output height: $outputHeight},
                                qq{Output scale factor: $outputRatio},
                                qq{Final scale factor: $finalRatio<br/>},
                              );
                      return $s;
                  });

            WriteImageMagickObjectToDisk( $image, $outputFileName );

            soft_ASSERT(Utils::file_exists($outputFileName),
                        qq{Could not create file="$outputFileName"});

            # destroy Image::Magick object
            $image = undef;

	} #End if not in cache
    } #End  ! $self->file_exists_n_newer($outputFileName)

    if ($self->file_exists_n_newer($outputFileName))
    {
        #If multipage pdf, download as an attachment
        if ($self->GetPageCount() > 1 && $self->GetConcatenate() eq 1)
        {

            if ( $cgi->param( 'debug' ) ne "all" && $cgi->param( 'debug' ) ne "watermark")
            {
                my $start = index ($outputFileName, "/cache");
                my $location = substr( $outputFileName, $start);
                my $href = 'http://' . Utils::HTTP_hostname() . $location;
                DEBUG('all', qq{Multipage pdf });
                DEBUG('all', qq{Redirect user to $href });

                #Get file name
                my @parts = split(/\//, $outputFileName);
                my $file = $parts[-1];

                #Download pdf as attachment
                #Code from: http://www.perlmonks.org/?node_id=419216
                print "Content-type: application/pdf\n";
                print "Content-Disposition: attachment; filename=$file\n";
                print "\n";

                open    TMP, "$outputFileName" or die "Error message here: $!\n\n";
                binmode TMP;
                binmode STDOUT;

                print <TMP>;

                $cgi = undef;

                exit;
            } #end if multi-page pdf and not debug
            else
            {
                DEBUG('all', qq{ CheckCreateImageViaImageMagick: Multi-page pdf \n$outputFileName });
            }
        }
        elsif ($self->GetPageCount() eq 1 && $self->GetConcatenate() eq 1)
        {
            DEBUG('all', qq{ CheckCreateImageViaImageMagick: Single-page pdf \n$outputFileName});
        }
        else
        {
            DEBUG('image,pt,all',
                  sub
                  {
                      my $s =  qq{CheckCreateImageViaImageMagick: CACHED IMAGE<br />\n} .
                          join( '<br />',
                                qq{Stored file path: $storedFilePath},
                                qq{Final Output File Name: $outputFileName},
                                qq{Output scale factor: $outputRatio<br/>},
                              );
                      return $s;
                  });

        }
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
sub RotateImageMagickObject
{
    my $self = shift;

    my ( $image, $rotationInDegrees ) = @_;

    DEBUG('image,pt,all', qq{METHOD: RotateImageMagickObject:<br/>\n});

    $image->Rotate( degrees => $rotationInDegrees );
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

    my $handler = $self->GetContentHandler();

    my $cacheDir      = $PTGlobals::gCacheDir;
    my $cacheDocRoot  = $PTGlobals::gCacheDocRoot;

    my $targetFileName;
    eval
    {
        no strict 'refs';
	$targetFileName = $self->$handler();
    };
    ASSERT(!$@, qq{Error creating page image file="$targetFileName": $@} );

    $targetFileName =~ s,^$cacheDir,$cacheDocRoot,;

    $self->{'targetimagefilename'} = $targetFileName;

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
sub WriteImageMagickObjectToDisk
{
    my ( $image, $outFilePath ) = @_;

    open( IMAGE, ">$outFilePath" );
    $image->Write( file => \*IMAGE,
                   filename => $outFilePath );
    close(IMAGE);
    undef ($image);
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
sub WatermarkImageMagickObject
{
    my $self = shift;
    my $imObject = shift;

    return
        if ( ! $PTGlobals::gWatermarkingEnabled );

    my $source_attribute = $self->Get( 'source_attribute' );
    my $namespace = Identifier::the_namespace( $self->GetId() );
    my $watermarkFileName = $PTGlobals::gWatermarkImages{$namespace}{$source_attribute};

    return if (! $watermarkFileName);

    my $wmImage = new Image::Magick;
    $wmImage->Read( $watermarkFileName );

    my $wmWidth  = $wmImage->Get( 'width' );
    my $wmHeight = $wmImage->Get( 'height' );

    my $mainWidth = $imObject->Get( 'width' );
    my $mainHeight = $imObject->Get( 'height' );

    my $cornerOffset = 5;
    my $x = ($mainWidth - $wmWidth) / 2;
    my $y = $mainHeight - $wmHeight - $cornerOffset;
    my $geometry = $wmWidth . "x" . $wmHeight . "+" . $x . "+" . $y;

    $imObject->Composite(
                         compose  => 'Over',
                         image    => $wmImage,
                         geometry => $geometry,
                        );

    DEBUG('image,watermark',
          sub
          {
              my $f = $imObject->Get( 'base-filename' );
              return qq{Watermarking "$f" using watermark image: "$watermarkFileName"<br />geometry=$geometry\n};
          });

    # destroy watermark ImageMagick object
    $wmImage   = undef;
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
