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

### use MediaHandler::Image;

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
    my $view = $cgi->param( 'view' );
    $self->SetRequestedView( $view );
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
    
    my $cacheDir      = $PTGlobals::gCacheDir;
    my $cacheDocRoot  = $PTGlobals::gCacheDocRoot;
    my $file_info;
    
    eval {
        require MediaHandler::Image;
        $file_info = MediaHandler::Image::GetImageInfo({mdpItem => $self, linkTo => 'cache'});
    };
    ASSERT(!$@, qq{Error creating page image file="$$file_info{'src'}": $@} );
    
    my $targetFileName = $self->{'targetimagefilename'} = $$file_info{'src'};
    $self->{'targetimagefileinfo'} = $file_info;
    
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
    return $self->{'targetimagefileinfo'} || {};
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
