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

use PT::MdpItem;
use MdpItem;


# ---------------------------------------------------------------------

=item format_OCR_text

The special formatting syntax e.g. {lt:}, comes from Solr
configuration specs such as in
/htsolr/ptsearch/shards/1/conf/solrconfig.xml:

    <!-- multi-colored tag FragmentsBuilder for FVH -->
    <fragmentsBuilder name="colored"
                      class="org.apache.solr.highlight.ScoreOrderFragmentsBuilder"
                      default="true">
      <lst name="defaults">
        <str name="hl.tag.pre">
        <![CDATA[{lt:}strong class="solr_highlight_1"{gt:},
                 {lt:}strong class="solr_highlight_2"{gt:},
                 {lt:}strong class="solr_highlight_3"{gt:},
                 {lt:}strong class="solr_highlight_4"{gt:},
                 {lt:}strong class="solr_highlight_5"{gt:},
                 {lt:}strong class="solr_highlight_6"{gt:}]]></str>
        <str name="hl.tag.post"><![CDATA[{lt:}/strong{gt:}]]></str>
      </lst>
    </fragmentsBuilder>

=cut

# ---------------------------------------------------------------------
sub format_OCR_text {
    my $OCR_text_ref = shift;
    my $full_page = shift;

    Utils::map_chars_to_cers($OCR_text_ref, [q{"}, q{'}], 1);

    # $$OCR_text_ref =~ s,{lt:}(.*?){gt:},<$1>,go;
    $$OCR_text_ref =~ s,{lt:}strong class="(.*?)"{gt:},<mark class="$1">,go;
    $$OCR_text_ref =~ s,{lt:}/strong{gt:},</mark>,go;

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
    DEBUG('time', qq{<h3>Start PageTurnerUtils::GetMdpItem</h3>} . Utils::display_stats());
    my $mdpItem = PT::MdpItem->new(MdpItem->GetMdpItem($C, $id));
    DEBUG('time', qq{<h3>Finish PageTurnerUtils::GetMdpItem</h3>} . Utils::display_stats());

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
   
   my $seq = 0;
   my $MdpItem = $C->get_object('MdpItem');
   my $root = $MdpItem->_GetMetsRoot();
   my $source_mets = $root->findvalue(q{//METS:fileGrp[@USE='source METS']//METS:FLocat/@xlink:href});

   my $zipfile = $MdpItem->Get('zipfile');

   if (defined $zipfile && defined $source_mets) {
       # Get the source METS to disk --  should
       # <strike>there's only on in the zip but we don't know its name</strike>
       my $file_sys_location = Identifier::get_item_location($id);

       my $source_METS_filename = Utils::Extract::extract_file_to_temp_cache($id, $file_sys_location, $source_mets);

       # If there is a Google METS, read and parse and get OWNERID
       # attribute value
       $seq = $C->get_object('CGI')->param( 'seq' );

       if ($source_METS_filename) {
           my $metsXmlRef = Utils::read_file($source_METS_filename, 1);
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
                       $OWNERID = $node->findvalue('@OWNERID') || $OWNERID;
                   };
                   $OWNERID = 'error parsing OWNER id attribute' if $@;
               }
           }
       }
   }

   DEBUG('ownerid', qq{OWNERID='$OWNERID', SEQ='$seq', id=$id});
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

