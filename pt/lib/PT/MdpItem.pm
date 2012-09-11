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

use SLIP_Utils::Common;

# Define the PTGlobals namespace
use PTGlobals;

# MDP
use Utils;
use Debug::DUtils;
use Context;

use PT::SearchUtils;


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

}

sub GetItemType
{
    my $self = shift;
    $self->GetItemType(); 
    if ( DEBUG('jats') ) {
        return qq{jats};
    }
    return qq{book};
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

    if ( $requestedPageView eq 'plaintext' || $requestedPageView eq 'text' ) {
        ### BookReader will eventually serve "text" view
        $self->SetContentHandler( 'OcrHandler' );
    }
    elsif ( $requestedPageView eq 'fpdf' ) {
        my $handler = $self->GetFormatHandler('nul', 'fpdf');
        $self->SetContentHandler($handler);
    }
    elsif ( $requestedPageView eq 'image' || $requestedPageView eq '1up' || $requestedPageView eq '2up' || $requestedPageView eq 'thumb' || $requestedPageView eq 'text' ) {
        my $requestedPageSequence = $self->GetRequestedPageSequence();
        my $storedFileType = $self->GetStoredFileType( $requestedPageSequence );
        my $handler = $self->GetFormatHandler( $storedFileType, 'image' ); # all variations on image
        $self->SetContentHandler( $handler );

        DEBUG('image,pt,all', qq{ContentHandler set to: $handler});
        ASSERT($handler, qq{No handler set in MdpItem::DetermineAndSetContentHandler} );
    }
    else {
        ASSERT(0, qq{Invalid page view type: "$requestedPageView} );
    }
}

# ---------------------------------------------------------------------

=item OcrHandler

When q's are present, get OCR from Solr to support consistent highlighting.

=cut

# ---------------------------------------------------------------------
sub OcrHandler {
    my $self = shift;
    my $C = shift;

        my $text = '';
    my $ocrTextRef = \$text;

    my $q1 = $C->get_object('CGI')->param('q1');
    my $seq = $self->GetRequestedPageSequence();
            
    if ($q1) {
        my $id = $self->Get('id');
        $ocrTextRef = PT::SearchUtils::Solr_retrieve_OCR_page($C, $id, $seq);
        DEBUG('all', qq{Solr retrieve OCR for seq=$seq});
        }
        else {
        my $ocrFile = $self->GetFilePathMaybeExtract($seq, 'ocrfile') ;
            
        if ($ocrFile) {
            $ocrTextRef = Utils::read_file($ocrFile, 0, 1);
            SLIP_Utils::Common::clean_xml($ocrTextRef);
        }
        DEBUG('all', qq{zip retrieve ocr from file="$ocrFile" for seq=$seq});
    }

    $self->{'ocrtextref'} =  $ocrTextRef;


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
#-----------------------------------------------
#JatsHandler is simpler version of  OcrHandler
#for handling JATS articles
#-----------------------------------------------
sub JatsHandler 
{
    my $self = shift;	
    my $text = '';
    my $jatsTextRef = \$text;
    my $id = $self->Get('id');
   
	if ($id eq 'mdp.39015015394847') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/jats.xml') or die "Can't open jats file: $!";
	      my @all_lines = ();
	      chomp(@all_lines = <FH>); 
	      my $pageOfJatsXML = '';
	      foreach $all_lines (@all_lines) 
		{  
		    $pageOfJatsXML .= $all_lines;
		}
	      $jatsTextRef = $pageOfJatsXML;
	      close (FH);
	  }
    
        if ($id eq 'uc2.ark:/13960/t0dv1g69b') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/pnas_html.xml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $scndPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $scndPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $scndPageOfJatsXML;
	      close (FH);
	  }

        if ($id eq 'mdp.39015051323379') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/PMC3003633/1475-2859-9-89.nxml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $thrdPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $thrdPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $thrdPageOfJatsXML;
	      close (FH);
	  }

        if ($id eq 'inu.30000000123830') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/PMC1762412/pone.0000133.nxml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $frthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $frthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $frthPageOfJatsXML;
	      close (FH);
	  }

        if ($id eq 'miun.aas8778.0001.001') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/1741-7015-9-17.xml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $ffthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $ffthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $ffthPageOfJatsXML;
	      close (FH);
	  }

        if ($id eq '*') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/PMC1762412/pone.0000133.nxml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $sxthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $sxthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $sxthPageOfJatsXML;
	      close (FH);
	  }

     if ($id eq '*') 
	  {
	      open (FH, '/htapps/nasirg.babel/pt/jatsdata/PMC1762412/pone.0000133.nxml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $svnthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $svnthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $svnthPageOfJatsXML;
	      close (FH);
	  }

    if ($id eq '*') 
	  {
	      open (FH, '/htapps/nasirg.babel/obj/mdp/pairtree_root/39/01/50/66/04/59/34/39015066045934/39015066045934.xml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $nnthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $nnthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $nnthPageOfJatsXML;
	      close (FH);
	  }

     if ($id eq '*') 
	  {
	      open (FH, '/htapps/nasirg.babel/obj/mdp/pairtree_root/39/01/50/02/97/61/01/39015002976101/39015002976101.xml') or die "Can't open jats file: $!";
	      my @yall_lines = ();
	      chomp(@yall_lines = <FH>); 
	      my $tnthPageOfJatsXML = '';
	      foreach $yall_lines (@yall_lines) 
		{  
		    $tnthPageOfJatsXML .= $yall_lines;
		}
	      $jatsTextRef = $tnthPageOfJatsXML;
	      close (FH);
	  }

    $self->{'jatstextref'} =  $jatsTextRef;
    return $self->{'jatstextref'};
}


#-----------------------------------------------
#getJats is like GetOcrTextRef
#-----------------------------------------------
sub GetJatsTextRef
{    
   my $self = shift;
   return $self->{'jatstextref'};      	          
   #return $self->{'ocrtextref'};
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
sub GetOcrBySequence {
    my $self = shift;
    my $sequence = shift;

    my $ocrTextRef;
    my $ocrFile = $self->GetFilePathMaybeExtract( $sequence, 'ocrfile' );
    if (! $ocrFile) {
        my $text = '';
        $ocrTextRef = \$text;
    }
    else {
        $ocrTextRef = Utils::read_file($ocrFile, 0, 1);
    }

    DEBUG('all', qq{ocr file is: $ocrFile});

    SLIP_Utils::Common::clean_xml($ocrTextRef);

    $$ocrTextRef =~ s,\n\n,<br /><br />\n,g;

    return $ocrTextRef;
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
    
    return 1;
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

    my $s = $self->{ProxyItem}->DumpPageInfoToHtml();

    # attach any other details

    return $s;
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
