package SSD::PIFiller::SSD;

=head1 NAME

SSD::PIFiller::SSD (pif)

=head1 DESCRIPTION

This class implements the PI handlers for the SSD cgi.

=head1 SYNOPSIS

See coding example in base class PIFiller

=head1 METHODS

=over 8

=cut

use strict;

use CGI;
use Context;
use Session;
use Utils;

use base qw(PIFiller);

use PT::MdpItem;

BEGIN {
    require "PT/PIFiller/Root.pm";
    require "PT/PIFiller/Common.pm";
}


# ---------------------------  Handlers  ------------------------------
#

# ---------------------------------------------------------------------

=item handle_CURRENT_PAGE_OCR_PI : PI_handler(CURRENT_PAGE_OCR)

Handler for CURRENT_PAGE_OCR

=cut

# ---------------------------------------------------------------------
sub handle_CURRENT_PAGE_OCR_PI
    : PI_handler(CURRENT_PAGE_OCR)
{
    my ($C, $act, $piParamHashRef) = @_;

    my $mdpItem = $C->get_object('MdpItem');
    return $mdpItem->GetOcrTextRef();
}


# ---------------------------------------------------------------------

=item handle_OCR_DATA_PI : PI_handler(OCR_DATA)

Handler for OCR_DATA PI

=cut

# ---------------------------------------------------------------------
sub handle_OCR_DATA_PI
  : PI_handler(OCR_DATA)
{
    my ($C, $act, $piParamHashRef) = @_;
    
    # Compile ocr only if SSD user
    my $cgi = $C->get_object('CGI');
    my $id = $cgi->param('id');
    my $ses = $C->get_object('Session');
    my $full_ocr_allowed = ($ses->get_transient_subkey('full_ocr', $id) eq 'allowed');
    
    # As of Fri Mar 18 14:32:00 2011, JPW authorized ssd cgi to
    # provide the full OCR of books in the public domain to all users,
    # not just SSD users.  Other cases may equate to
    # $full_ocr_allowed==1 too.
    return '' unless ($full_ocr_allowed);
    
    my $mdpItem = $C->get_object('MdpItem');
    
    my $fullTextXML;
    my $sectionXML;
    
    my $pastFirstSection = 0; #Used to track whether the current text should be wrapped in section tags
    my $newSection = 1;
    my $sectionTitle;
    
    # Check to see if record has page numbers. If it doesn't treat sequence numbers as page numbers
    my $hasPageNumbers = $mdpItem->HasPageNumbers( );
    
    # Used to indicate acceptable feature tags and to track multipage features
    my $featureHash = $mdpItem->GetFeatureHash( );
    my @featureTags = keys( %$featureHash );
    my $hasFirstContentFeature = $mdpItem->HasFirstContentFeature();
    my $seenFirstContentFeature = 0;
    my $seenFirstTOC = 0;
    my $seenFirstIndex = 0;
    my $sectionNum = 1;
    my $currentSection;
    
    foreach my $seq ($mdpItem->GetSequenceNumbers()) {
	# Check to see if section heading
	my @pgFeatures = $mdpItem->GetPageFeatures( $seq );
        
	my $matched = 0; #indicates if we've already found a section heading for this page
	foreach my $featureTag ( @featureTags ) {
            if ( grep( /$featureTag/, @pgFeatures )  && $matched eq 0) {
                # Found section heading, add section heading name Wrap
                # the old section in a "section" tag Initialize
                # section html
                if ($pastFirstSection && (($currentSection ne $featureTag) ||  ( $featureTag =~ m,^CHAPTER_START$, ) ) ) {
                    $matched = 1;
                    $sectionXML = "<SectionTitle>$sectionTitle</SectionTitle>" . $sectionXML;
                    $fullTextXML .= wrap_string_in_tag($sectionXML, 'Section');
                    
                    # initialize XML and sectionTitle
                    $sectionXML = "";
                } 
                else {
                    $pastFirstSection = 1;
                }
                
                $sectionTitle = $$featureHash{$featureTag};
                $currentSection = $featureTag;
                
                # Logic below is taken from GetFeatureList
                if  ( $featureTag =~ m,TABLE_OF_CONTENTS, ) {
                    if ( ($seenFirstTOC ) ) {
                        $newSection = 0;
                    }
                    else {$seenFirstTOC = 1;
                          $newSection = 1;
                      }
                }
                
                if  ( $featureTag =~ m,INDEX, ) {
                    if ( ($seenFirstIndex ) ) {
                        $newSection = 0;
                    }
                    else {
                        $seenFirstIndex = 1;
                        $newSection = 1;
                    }
                }
                
                if ( $hasFirstContentFeature ) {
                    if  ( $featureTag =~ m,FIRST_CONTENT_CHAPTER_START, ) {
                        $seenFirstContentFeature = 1;
                        $sectionTitle = $sectionTitle . " " . $sectionNum++;
                    }
                    elsif ( $featureTag =~ m,^CHAPTER_START$, ) {
                        $sectionTitle = $sectionTitle . " " . $sectionNum++
                          if ( $seenFirstContentFeature );
                    }
                    
                    $newSection = 1;
                }
                elsif ( $featureTag =~ m,^CHAPTER_START$, ) {
                    $sectionTitle = $sectionTitle . " " . $sectionNum++;
                    $newSection = 1;
                }
                
            } # end if section heading
	} # end for each feature tag
        
        my $text = $mdpItem->GetOcrBySequence( $seq );
	my $pageNum;
	my $pageData = "";
        
	# Check for image on page
	if ( grep( /IMAGE_ON_PAGE/, @pgFeatures ) ) {
            $pageData = wrap_string_in_tag("image", 'Features');
	}
        
	if($hasPageNumbers) {
            $pageNum = $mdpItem->GetPageNumBySequence( $seq );
            $pageData .= wrap_string_in_tag($pageNum, 'PageNum');
	}
        
	$pageData .= wrap_string_in_tag($seq, 'Seq') .
          wrap_string_in_tag($$text, 'Text');
        
        $sectionXML .= wrap_string_in_tag($pageData, 'Page');
    }
    
    # If last page, wrap in closing section tag
    $sectionXML = "<SectionTitle>$sectionTitle</SectionTitle>" . $sectionXML;
    $fullTextXML .= wrap_string_in_tag($sectionXML, 'Section');
    
    return $fullTextXML;
}


1;

__END__

=head1 AUTHORS

Phillip Farber, University of Michigan, pfarber@umich.edu
Kathleen Ludewig, University of Michigan, kludewig@umich.edu

=cut
