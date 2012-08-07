<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:import href="../pageviewer.xsl"/>

  <xsl:template name="extra-head-setup">
    <style>
      #mdpUberContainer {
        margin-top: 0px;
      }
      
      .contentContainerWrap {
        margin-top: 0px !important;
      }

    </style>
  </xsl:template>
  
  <xsl:template name="Sidebar">
    <div class="mdpControlContainer">

      <xsl:call-template name="crmsPageControls" />
      <xsl:call-template name="crmsModeControls" />
      
      <div class="mdpScrollableContainer">
        
        <xsl:call-template name="BuildContentsList" />

      </div> <!-- scrollable -->
      
    </div>
  </xsl:template>
  
  <xsl:template name="BookReaderToolbar">
  </xsl:template>
  
  <xsl:template name="crmsPageControls">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    
    <style>
      
      #mdpItemMetadata {
        z-index: 9999;
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
   
  
</xsl:stylesheet>
