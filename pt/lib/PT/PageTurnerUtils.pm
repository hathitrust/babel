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

use PT::MdpItem;
use MdpItem;


# ---------------------------------------------------------------------

=item format_OCR_text

Description

=cut

# ---------------------------------------------------------------------
sub format_OCR_text {
    my $OCR_text_ref = shift;
    my $full_page = shift;

    Utils::map_chars_to_cers($OCR_text_ref, [q{"}, q{'}], 1);

    $$OCR_text_ref =~ s,{lt:},<,go;
    $$OCR_text_ref =~ s,{gt:},>,go;

    $$OCR_text_ref =~ s!^([^\n]+)\n!$1<br />\n!gsm
      if ($full_page);
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

    ### return MdpItem
    DEBUG('time', qq{<h3>Start mdp item uncache</h3>} . Utils::display_stats());
    my $mdpItem = PT::MdpItem->new(MdpItem->GetMdpItem($C, $id));
    DEBUG('time', qq{<h3>Finish mdp item uncache</h3>} . Utils::display_stats());

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
