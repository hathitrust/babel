<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:import href="../pageviewer_book.xsl"/>
    
  <xsl:template name="BookReaderToolbar">
  </xsl:template>
  
  <xsl:template name="crmsPageControls">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    
    <style>
      
      #mdpItemMetadata {
        z-index: 9999;
      }
      
      #mdpUberContainer {
        margin-top: 0px;
      }
      
      .controls {
        margin-top, margin-bottom: 0.5em;
        border-bottom: 1px dashed #666;
        clear: both;
      }
      
      .sizeLabel {
        font-weight: bold;
      }
      
      .mdpPageNumberInputBox {
        width: 5em;
      }
      
      .mdpPageLinks, .mdpPageLinks > ul {
        float: none;
      }
            
      .mdpControlContainer div {
        padding-top: 8px;
      }
      
      #mdpSectionForm, #mdpPageForm {
        float: none;
      }
      
      #BottomNav {
        left: 14px;
      }
      
      .mdpPageLinksBottom ul li {
        padding-right: 4px !important;
      }
      
      .mdpPageLinksBottom ul li a img {
        background: none;
      }
      
      .mdpPageXofYBottom {
        margin-left: 80px;
      }
      
      #mdpBottomToolbar {
        display: none;
      }
      
      #mbToggleHeader {
        display: none;
      }
      
    </style>
    
    <script>
      $(document).ready(function() {
        $("#mdpBottomToolbar").remove();
      })
    </script>
    
    <div class="controls">
      <p>
        <xsl:element name="a">
          <xsl:variable name="href">
            <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
            <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
          </xsl:variable>
          <xsl:attribute name="class">tracked</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
          <xsl:text>View full catalog record</xsl:text>
        </xsl:element>
      </p>

      <xsl:if test="$gFinalAccessStatus = 'allow' and $gUsingSearch = 'false'">
      <p>
        <xsl:element name="a">
          <xsl:attribute name="title">Download this page (PDF)</xsl:attribute>
          <xsl:attribute name="id">pagePdfLink</xsl:attribute>
          <xsl:attribute name="class">tracked</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Download PDF - this page</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
          </xsl:attribute>
          <xsl:attribute name="target">
            <xsl:text>pdf</xsl:text>
          </xsl:attribute>
          <xsl:text>Download this page (PDF)</xsl:text>
        </xsl:element>
      </p>
    </xsl:if>
    
    <xsl:if test="$gFullPdfAccessMessage='' or $gFullPdfAccessMessage='NOT_AFFILIATED' or $gFullPdfAccessMessage='RESTRICTED_SOURCE'">
      <p>
        <xsl:choose>
          <xsl:when test="$gFullPdfAccessMessage='RESTRICTED_SOURCE'">
            <xsl:text>Download whole book (PDF)</xsl:text>
            <br />
            <i>Not available</i> (<a href="http://www.hathitrust.org/help_digital_library#FullPDF" target="_blank">why not?</a>)
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Download whole book (PDF)</xsl:attribute>
              <xsl:attribute name="id">fullPdfLink</xsl:attribute>
              <xsl:attribute name="class">tracked</xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Download PDF - whole book</xsl:attribute>
              <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
              </xsl:attribute>
              <xsl:text>Download whole book (PDF)</xsl:text>
            </xsl:element>
            <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
              <p class="pdfPartnerLoginLinkMessage">Partner login required</p>
            </xsl:if>
          </xsl:otherwise>
        </xsl:choose>
        
        <xsl:if test="$gFullPdfAccess = 'deny'">
          <div id="noPdfAccess">
            <p style="text-align: left">
              <xsl:choose>
                <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                  <xsl:text>Partner institution members: </xsl:text>
                  <strong><a href="{$pViewTypeList/ViewTypeFullPdfLink}">Login</a></strong>
                  <xsl:text> to download this book.</xsl:text>
                  <br />
                  <br />
                  <em>If you are not a member of a partner institution, 
                  <br />
                  whole book download is not available. 
                  (<a href="http://www.hathitrust.org/help_digital_library#Download" target="_blank">why not?</a>)</em>
                </xsl:when>
                <xsl:when test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                  <xsl:text>Full PDF available only to authenticated users from </xsl:text>
                  <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed" target="_blank">HathiTrust partner institutions.</a>
                </xsl:when>
                <xsl:when test="$gFullPdfAccessMessage = 'NOT_PD'">
                  <xsl:text>In-copyright books cannot be downloaded.</xsl:text>
                </xsl:when>
                <xsl:when test="$gFullPdfAccessMessage = 'NOT_AVAILABLE'">
                  <xsl:text>This book cannot be downloaded.</xsl:text>
                </xsl:when>
                <xsl:when test="$gFullPdfAccessMessage = 'RESTRICTED_SOURCE'">
                  <i>Not available</i> (<a href="http://www.hathitrust.org/help_digital_library#FullPDF" target="_blank">why not?</a>)
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>Sorry.</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
            </p>
          </div>
        </xsl:if>
      </p>
      </xsl:if>
    </div>
    
    <div class="mdpPageLinks controls">
      <xsl:call-template name="BuildPageLinks">
        <xsl:with-param name="pPageLinks" select="MdpApp/PageLinks"/>
      </xsl:call-template>
      <br clear="both" />
    </div>
    
    <div class="controls">
      <!-- <xsl:call-template name="BuildPageXofYForm">
        <xsl:with-param name="pPageXofYForm" select="MdpApp/PageXOfYForm"/>
        <xsl:with-param name="pPageXofYFormId" select="'PageNumberJump_1'"/>
        <xsl:with-param name="pPageXofYId" select="'PageNumberJump_1_Form'"/>
      </xsl:call-template> -->
      
      <xsl:variable name="pageNum">
		    <xsl:choose>
		      <xsl:when test="$gCurrentPageNum">
		        <xsl:value-of select="$gCurrentPageNum" />
		      </xsl:when>
		      <xsl:otherwise>
		        <!-- not making this visible -->
            <!-- <xsl:text>n</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" /> -->
		      </xsl:otherwise>
		    </xsl:choose>
		  </xsl:variable>
		  

			<form method="GET" action="pt" id="mdpPageForm">
			  <input type="hidden" name="u" id="u" value="1" />
			  
			  <label for="BRpagenum">Jump to </label>

        <xsl:element name="input">
          <xsl:attribute name="id">BRpagenum</xsl:attribute>
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="size">8</xsl:attribute>
          <xsl:attribute name="name">num</xsl:attribute>
          <xsl:attribute name="alt">Page Number</xsl:attribute>
          <xsl:attribute name="value">
            <xsl:value-of select="$pageNum"/>
          </xsl:attribute>
        </xsl:element>

			  <xsl:element name="input">
          <xsl:attribute name="id">mdpGotoButton</xsl:attribute>
          <xsl:attribute name="type">submit</xsl:attribute>
          <xsl:attribute name="value">Go</xsl:attribute>
          <xsl:attribute name="title">Go</xsl:attribute>
          <xsl:attribute name="alt">Jump</xsl:attribute>
          <!-- <xsl:attribute name="title">Jump to this sequential page in the text</xsl:attribute>
          <xsl:attribute name="alt">Jump to this sequential page in the text</xsl:attribute> -->
          <xsl:attribute name="class">tracked interactive </xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Jump to Page</xsl:attribute>
        </xsl:element>
        
        &#160;
        
        <xsl:apply-templates select="//PageXOfYForm/HiddenVars"/>
        <xsl:if test="not(//PageXOfYForm/HiddenVars/Variable[@name='seq'])">
          <input type="hidden" name="seq" value="" />
        </xsl:if>
        <xsl:call-template name="HiddenDebug" />
			  
			  <br clear="both" />
			</form>

    </div>

    <xsl:if test="$gFinalView != 'plaintext'">
    <div class="controls">
        <xsl:call-template name="BuildResizeForm">
          <xsl:with-param name="pResizeForm" select="MdpApp/ResizeForm"/>
        </xsl:call-template>
    </div>
    <div class="controls">
      <span class="sizeLabel controlLabel" title="Change page rotation">rotate&#xa0;</span>
      <xsl:variable name="href-counterclockwise" select="/MBooksTop/MdpApp/RotateLinks/CounterClockwiseLink" />
      <a href="{$href-counterclockwise}" id="rotate-counterclockwise" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Left" data-tracking-category="PT" title="Rotate Left"><img alt="" src="//common-web/graphics/harmony/icon_rotate_counterclockwise.png" height="25" width="25" /></a>
      <xsl:variable name="href-clockwise" select="/MBooksTop/MdpApp/RotateLinks/ClockwiseLink" />
      <a href="{$href-clockwise}" id="rotate-clockwise" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Right" data-tracking-category="PT" title="Rotate Right"><img alt="" src="//common-web/graphics/harmony/icon_rotate_clockwise.png" height="25" width="25" /></a>
    </div>
    </xsl:if>
    		
  </xsl:template>
  
  <!-- FORM: Image Resize -->
  <xsl:template name="BuildResizeForm">
    <xsl:param name="pResizeForm"/>

    <xsl:element name="form">
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>
      <!-- <ul>
        <li class="asearchform"> -->
          <xsl:apply-templates select="$pResizeForm/HiddenVars"/>
          <xsl:for-each select="$pResizeForm/ResizeValuesSelect">
            <span class="sizeLabel" title="Change size">size&#xa0;</span>
            <xsl:call-template name="BuildHtmlSelect">
              <xsl:with-param name="class" select="'mdpSelectMenu'"/>
              <xsl:with-param name="key" select="'this.form.submit()'"/>
            </xsl:call-template>
          </xsl:for-each>
        <!-- </li>
      </ul> -->
      <xsl:call-template name="HiddenDebug"/>
    </xsl:element>
  </xsl:template>
  
  <xsl:template name="BuildPageLinks">
    <xsl:param name="pPageLinks"/>
    
    <style>
      .mdpPageLinks ul li a img {
        background-color: transparent;
      }
    </style>
    
    <ul>
      <li>
        <xsl:if test="$pPageLinks/FirstPageLink">
          <xsl:element name="a">
            <xsl:attribute name="id">mdpFirstPageLink</xsl:attribute>
            <xsl:attribute name="title">First [f]</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/FirstPageLink"/>
            </xsl:attribute>
            <xsl:attribute name="accesskey">f</xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">First [f]</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/harmony/icon_first.png'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>

      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/PreviousPageLink='XX'">

            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_previous_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="id">mdpPreviousPageLink</xsl:attribute>
              <xsl:attribute name="title">Previous [p]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">p</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous [p]</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_previous.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>


      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/NextPageLink='XX'">


            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Next</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Next [n]</xsl:attribute>
              <xsl:attribute name="id">mdpNextPageLink</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">n</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Next [n]</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:if test="$pPageLinks/LastPageLink">


          <xsl:element name="a">
            <xsl:attribute name="id">mdpLastPageLink</xsl:attribute>
            <xsl:attribute name="title">Last [l]</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/LastPageLink"/>
            </xsl:attribute>
            <xsl:attribute name="accesskey">l</xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">Last [l]</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:text>//common-web/graphics/harmony/icon_last.png</xsl:text>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>
    </ul>

  </xsl:template>
  
   <xsl:template name="crmsModeControls">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    
    <style>
      
      #mdpToolbarViews {
        height: auto;
        margin-top: 0.5em;
      }
      
      #mdpToolbarViews li {
        list-style-type: none;
        display: block;
        float: none;
        padding-right: 4px;
      }
      
      .PTbutton, #btnClassicView, #btnClassicText {
        width: 8em;
      }

      #mdpToolbarViews .PTbutton {
        padding-left: 2.8em !important;
      }
      
    </style>

    <div id="mdpToolbarViews">
      <xsl:if test="$gFinalAccessStatus != 'allow'">
        <xsl:attribute name="class"><xsl:text>disabled</xsl:text></xsl:attribute>
      </xsl:if>
      
      <ul>
        <li>
          <xsl:element name="a">
            <xsl:attribute name="id"><xsl:text>btnClassicView</xsl:text></xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Classic View</xsl:attribute>
            <xsl:attribute name="title">
              <xsl:choose>
                <xsl:when test="$gCurrentView = 'image'">
                  <xsl:text>Classic View is the current view</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>Classic View</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypeImageLink"/>
            </xsl:attribute>
            <xsl:attribute name="class">
              <xsl:text>tracked </xsl:text>
              <xsl:text>PTbutton </xsl:text>
              <xsl:if test="$gCurrentView = 'image'">
                <xsl:text>PTbuttonActive</xsl:text>
              </xsl:if>
            </xsl:attribute>
            <span>Classic View</span>
          </xsl:element>
        </li>
        <li id="mdpPlainTextView">
          <xsl:element name="a">
            <xsl:attribute name="id"><xsl:text>btnClassicText</xsl:text></xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Plain Text</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypePlainTextLink"/>
            </xsl:attribute>
            <xsl:attribute name="class">
              <xsl:text>tracked </xsl:text>
              <xsl:text>PTbutton </xsl:text>
              <xsl:if test="$gCurrentView = 'plaintext' or $gCurrentView = 'text'">
                <xsl:text>PTbuttonActive</xsl:text>
              </xsl:if>
            </xsl:attribute>
            <xsl:attribute name="title">
              <xsl:choose>
                <xsl:when test="$gCurrentView = 'plaintext' or $gCurrentView = 'text'">
                  <xsl:text>Plain Text is the current view</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>Plain Text</xsl:text>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:attribute>
            <span>Plain Text</span>
          </xsl:element>
        </li>
      </ul>
    </div>
  </xsl:template>
  
  <xsl:template name="bookreader-toolbar-items">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <script id="bookreader-toolbar-items" type="text/x-jquery-tmpl">
      <li>
        <xsl:variable name="title">
          <xsl:choose>
            <xsl:when test="$gCurrentView = '1up'">
              <xsl:text>Scroll View is the current view</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>Scroll View</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:element name="a">
          <xsl:attribute name="id"><xsl:text>btnBookReader1up</xsl:text></xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Scroll View</xsl:attribute>
          <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewType1UpLink"/>
          </xsl:attribute>
          <xsl:attribute name="class">
            <xsl:text>tracked interactive </xsl:text>
            <xsl:text>PTbutton </xsl:text>
            <xsl:if test="$gCurrentView = '1up'">
              <xsl:text>PTbuttonActive</xsl:text>
            </xsl:if>
          </xsl:attribute>
          <span>Scroll</span>
        </xsl:element>
      </li>
      <li>
        <xsl:variable name="title">
          <xsl:choose>
            <xsl:when test="$gCurrentView = '2up'">
              <xsl:text>Flip View is the current view</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>Flip View</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:element name="a">
          <xsl:attribute name="id"><xsl:text>btnBookReader2up</xsl:text></xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Flip View</xsl:attribute>
          <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewType2UpLink"/>
          </xsl:attribute>
          <xsl:attribute name="class">
            <xsl:text>tracked interactive </xsl:text>
            <xsl:text>PTbutton </xsl:text>
            <xsl:if test="$gCurrentView = '2up'">
              <xsl:text>PTbuttonActive</xsl:text>
            </xsl:if>
          </xsl:attribute>
          <span>Flip</span>
        </xsl:element>
      </li>
      <xsl:if test="true()">
      <li>
        <xsl:variable name="title">
          <xsl:choose>
            <xsl:when test="$gCurrentView = 'thumb'">
              <xsl:text>Thumbnail View is the current view</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>Thumbnail View</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <xsl:element name="a">
          <xsl:attribute name="id"><xsl:text>btnBookReaderThumbnail</xsl:text></xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Thumbnail View</xsl:attribute>
          <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypeThumbnailLink"/>
          </xsl:attribute>
          <xsl:attribute name="class">
            <xsl:text>tracked interactive </xsl:text>
            <xsl:text>PTbutton </xsl:text>
            <xsl:if test="$gCurrentView = 'thumb'">
              <xsl:text>PTbuttonActive</xsl:text>
            </xsl:if>
          </xsl:attribute>
          <span>Thumbnails</span>
        </xsl:element>
      </li>
      </xsl:if>
    </script>
  </xsl:template>
  
   
 
</xsl:stylesheet>
