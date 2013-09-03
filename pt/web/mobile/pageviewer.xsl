<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:import href="../legacy/pageviewer.xsl"/>

  <xsl:template name="get-title-suffix">
    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'embed'">
        <xsl:text>HathiTrust Digital Library</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>HathiTrust Mobile Digital Library</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="GeneratePageTitle">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">HathiTrust Mobile Digital Library</xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:variable name="gCatalogRecordNo" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record/controlfield[@tag='001']"/>
  <xsl:variable name="gCurrentView">
    <xsl:value-of select="'1up'" >
    </xsl:value-of>
  </xsl:variable>

  <xsl:template name="Sidebar">
    <div class="mdpControlContainer">

      <xsl:call-template name="crmsPageControls" />

      <div id="mdpMobileTableOfContents">
        <xsl:call-template name="BuildContentsList" />
      </div>
      <div id="BRiteminfo" >
        
        <xsl:call-template name="MobileItemMetadata" />
        <xsl:call-template name="BuildCatalogLink" />
        <div id="mobilefeedbackdiv"><xsl:call-template name="feedbacklink"/></div>
      </div>
      <div id="BRsearch" data-scroll="true" >
        <xsl:call-template name="MobileBuildSearchForm" />
        
      </div>
      
      <div id="BRgetbook">
        <div id="fullEpubDownload"></div>
        <xsl:call-template name="MobileGetBook" />
      </div>
      
      <div id="BRocrsettings">
        <button id="ocrzoomin" class="bigger">Bigger Text</button><br />
        <button id="ocrzoomout" class="smaller">Smaller Text</button><br /><br />
        <button id="wraptext" class="selectedwrap">Wrapped Text</button><br />
        <button id="unwraptext" >Unwrapped Text</button>
        
        <br />
        <a class="PTregularLink" href="/cgi/pt?id={$gHtId};seq={/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']};skin=default">Regular Site</a>
        
      </div>
      
      <div id="BRimagesettings">
        <button id="imagezoomin" class="bigger">Zoom In</button><br />
        <button id="imagezoomout" class="smaller">Zoom Out</button><br />
        <button id="fittopage" >Fit to Page</button>
        <br />
        <a class="PTregularLink" href="/cgi/pt?id={$gHtId};seq={/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']};skin=default">Regular Site</a>
      </div>
      
      <div id="BRabout">About</div>
      
    </div>
  </xsl:template>
  
  
  <xsl:template name="BuildCatalogLink">
    <xsl:element name="a">
      <xsl:attribute name="id">mdpCatalogLinkInfoForm</xsl:attribute>
      <xsl:variable name="href">
        <xsl:text>http://m.hathitrust.org/Record/</xsl:text>
        <xsl:value-of select="$gCatalogRecordNo"/>
      </xsl:variable>
      <xsl:attribute name="class">tracked</xsl:attribute>
      <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
      <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
      <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
      <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
      <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
      <xsl:text>Back to Record</xsl:text>
    </xsl:element>
  </xsl:template>
  
  <xsl:template name="MobileGetBook">
    <xsl:for-each select="/MBooksTop/METS:mets/METS:dmdSec/collection/record/datafield[@tag='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
      <xsl:element name="a">
        <xsl:attribute name="class">worldcat</xsl:attribute>
        <xsl:attribute name="href">
          <xsl:text>http://www.worldcat.org/oclc/</xsl:text>
          <xsl:choose>
            <xsl:when test="contains(.,'OCoLC)ocm')">
              <xsl:value-of select="substring-after(.,'OCoLC)ocm')"/>
            </xsl:when>
            <xsl:when test="contains(.,'OCoLC')">
              <xsl:value-of select="substring-after(.,'OCoLC)')"/>
            </xsl:when>
            <xsl:when test="contains(.,'oclc')">
              <xsl:value-of select="substring-after(.,'oclc')"/>
            </xsl:when>
            <xsl:when test="contains(.,'ocm')">
              <xsl:value-of select="substring-after(.,'ocm')"/>
            </xsl:when>
            <xsl:when test="contains(.,'ocn')">
              <xsl:value-of select="substring-after(.,'ocn')"/>
            </xsl:when>
            <xsl:otherwise/>
          </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="title">Link to OCLC Find in a Library</xsl:attribute>
        
        <xsl:if test="$gGoogleOnclickTracking = 'true'">
          <xsl:attribute name="onclick">
            <xsl:call-template name="PageTracker">
              <xsl:with-param name="category" select="'outLinks'"/>
              <xsl:with-param name="action" select="'click'"/>
              <xsl:with-param name="label" select="'PT Find in a Library'"/>
            </xsl:call-template>
          </xsl:attribute>
        </xsl:if>
        
        <xsl:text>Find in a library</xsl:text>
        
      </xsl:element>
    </xsl:for-each>

  </xsl:template>

  <xsl:template name="bookreader-javascript-init">
    <script type="text/javascript">

      head.ready(function() {

      HT.init_from_params();

      HT.reader = new HTMobileBookReader(); // new HTMobileBookReader();
      HT.reader.bookId   = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>';
      <!-- HT.reader.bookTitle = "<xsl:value-of select="str:replace(str:replace(string($gFullTitleString), '&quot;', '\&quot;'), '&amp;', '\&amp;amp;')"/>"; -->
      HT.reader.bookTitle = document.title;
      HT.reader.reduce = 1;
      HT.reader.pageProgression = 'lr';

      HT.reader.track_event = HT.track_event;

      // reduce: 4 == thumbnails; too small for normal page browsing
      HT.reader.reductionFactors = [   {reduce: 0.5, autofit: null},
                                {reduce: 2/3, autofit: null},
                                {reduce: 1, autofit: null},
                                {reduce: 4/3, autofit: null}, // 1.5 = 66%, 1.25 == 80%
                                {reduce: 2, autofit: null}
                            ];


       <xsl:for-each select="$gFeatureList/Feature[Tag='TITLE'][last()]">
         <xsl:if test="position() = 1">
       // The index of the title page.
       HT.reader.titleLeaf = <xsl:value-of select="number(./Seq)-1"/>;
         </xsl:if>
       </xsl:for-each>
       HT.reader.imagesBaseURL = "/pt/bookreader/BookReader/images/";
       HT.reader.url_config = {
         meta  : "<xsl:value-of select="$gImgsrvUrlRoot" />/meta",
         image : "<xsl:value-of select="$gImgsrvUrlRoot" />/image",
         text  : "<xsl:value-of select="$gImgsrvUrlRoot" />/ocr",
         ping  : "<xsl:value-of select="$gImgsrvUrlRoot" />/ping",
         thumb : "<xsl:value-of select="$gImgsrvUrlRoot" />/thumbnail"
       };
       HT.reader.slice_size = 999999; // 100;
       HT.reader.catalog_method = 'fudged';
       HT.reader.total_slices = 1;
       HT.reader.ui = '<xsl:value-of select="$gCurrentReaderMode" />';

       if ( window.orientation != undefined ) {
         switch(window.orientation){
           case 90, -90:
             HT.reader.mode=3;
             break;
           case 0:
             HT.reader.mode=1;
             break;
         }
       } else if ( ! HT.params.mode ) {
         if ( $(window).length > $(window).height() ) {
           HT.params.mode = 2;
         } else {
           HT.params.mode = 1;
         }
       }

       console.log("STARTUP", HT.params.mode);

       // HT.reader.displayMode = 'image';
       HT.reader.q1 = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>';
       HT.reader.flags.debug = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>';
       HT.reader.flags.attr = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='attr']"/>';
       HT.reader.flags.has_ocr = '<xsl:value-of select="string(/MBooksTop/MBooksGlobals/HasOcr)" />' == 'YES';
       HT.reader.flags.final_access_status = '<xsl:value-of select="$gFinalAccessStatus" />';
       //HT.reader.flags.force = (HT.reader.flags.debug.indexOf('force') >= 0);
       HT.reader.lazyDelay = 500;
       //console.log("pageview.xsl - checkpoint lazyDelay");      
      })


    </script>
    <script type="text/javascript" src="/pt/mobile/bookreader_startup.js?ts={generate-id(.)}">;</script>
    
  </xsl:template>

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

    </style>

    <div class="controls" style="display:none">

       <p>
        <xsl:element name="a">
          <xsl:attribute name="id">mdpCatalogLink</xsl:attribute>
          <xsl:variable name="href">
            <xsl:text>http://m.hathitrust.org/Record/</xsl:text>
            <xsl:value-of select="$gCatalogRecordNo"/>
          </xsl:variable>
          <xsl:attribute name="class">tracked</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
          <!--<xsl:text>View full catalog record</xsl:text>-->
          <xsl:text disable-output-escaping="yes">&lt;&lt; Record</xsl:text>
        </xsl:element>
      </p>

     <xsl:if test="$gFinalAccessStatus = 'allow' and $gUsingSearch = 'false'">
      	<p id="pagePdfLinkP">

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
        <p id="fullPdfLinkP">
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
            <xsl:text>Download PDF</xsl:text>
            <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
              <br />
              <span class="pdfPartnerLoginLinkMessage" style="font-size: 80%">Partner login required</span>
            </xsl:if>
          </xsl:element>

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

        <p id="fullEpubLinkP">
          <xsl:element name="a">
            <xsl:attribute name="title">Download EPUB</xsl:attribute>
            <xsl:attribute name="id">epubLink</xsl:attribute>
            <xsl:attribute name="class">tracked</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Download EPUB</xsl:attribute>
            <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
            </xsl:attribute>
            <xsl:text>Download EPUB</xsl:text>
            <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
              <br />
              <span class="pdfPartnerLoginLinkMessage" style="font-size: 80%">Partner login required</span>
            </xsl:if>
          </xsl:element>

          <xsl:if test="$gFullPdfAccess = 'deny'">
            <div id="noEpubAccess">
              <p>
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
                    <xsl:text>Full EPUB available only to authenticated users from </xsl:text>
                    <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed">HathiTrust partner institutions.</a>
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
  </xsl:template>

  <xsl:template name="BuildContentsList" />

  <!-- FORM: Image Resize -->
  <xsl:template name="BuildResizeForm">
    <xsl:param name="pResizeForm"/>
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
  </xsl:template>

  <xsl:template name="bookreader-toolbar-items">
  </xsl:template>

 
  <xsl:template name="MobileItemMetadata">
    <div id="mdpMobileItemMetadata">
        <div id="mdpTitle" class="mdpMobileMetaText">
          <xsl:call-template name="GetMaybeTruncatedTitle">
            <xsl:with-param name="titleString" select="$gFullTitleString"/>
            <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
            <xsl:with-param name="maxLength" select="30"/>
          </xsl:call-template>
        </div>

      <!-- Author, Edition, Published, Description -->
      <xsl:call-template name="MdpMetadataHelper"/>
    </div>

  </xsl:template>


  <!-- METADATA: MDP-style metadata helper -->
  <xsl:template name="MdpMetadataHelper">
    <xsl:param name="ssd"/>

      <xsl:if test="$gRightsAttribute">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Copyright:</xsl:text>
          </span>
          <span class="mdpMetaText">
            <xsl:call-template name="BuildRDFaCCLicenseMarkup" />
          </span>
        </div>
      </xsl:if>

  </xsl:template>

  <xsl:template name="PermanentURL">
  </xsl:template>

  <xsl:template name="extra-head-setup">
    <meta name="HandheldFriendly" content="true" />
    <meta name="robots" content="noarchive" /> 
    <xsl:element name="link">
      <xsl:attribute name="rel">canonical</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:text>http://babel.hathitrust.org/cgi/pt?id=</xsl:text>
        <xsl:value-of select="$gHtId" />
      </xsl:attribute>
    </xsl:element>
    <link rel="alternate" media="handheld" href="" />
    <meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1; minimum-scale=1; user-scalable=0;" />
    <meta name="format-detection" content="telephone=no" />
    <script src="/common/unicorn/js/head.min.js"></script>
    <script>
      head.js.apply(this, HT.scripts);
    </script>
  </xsl:template>

  <!-- FORM: Search -->
  <xsl:template name="MobileBuildSearchForm">

    <div id="mdpSearchFormLabel">
      <xsl:element name="a">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:attribute name="name">SkipToSearch</xsl:attribute>
      </xsl:element>
    </div>
    <form method="get" onsubmit='return false;' action='pt/search'>
      <div class="asearchform">
        <xsl:element name="input">
          <xsl:attribute name="id">mdpSearchInputBox</xsl:attribute>
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">q1</xsl:attribute>
          <xsl:attribute name="maxlength">150</xsl:attribute>
          <xsl:attribute name="size">20</xsl:attribute>
          <xsl:attribute name="onclick"><xsl:text>this.focus();</xsl:text></xsl:attribute>
          <xsl:attribute name="value">
            <xsl:value-of select="$gCurrentQ1"/>
          </xsl:attribute>
        </xsl:element>

        <xsl:element name="input">
          <xsl:attribute name="id">mdpSearchButton</xsl:attribute>
          <xsl:attribute name="type">submit</xsl:attribute>
          <xsl:attribute name="value">Find</xsl:attribute>
          <xsl:attribute name="searchurl"><xsl:value-of select="'ptsearch'"/></xsl:attribute>
        </xsl:element>

      </div>
    </form>

    <xsl:call-template name="BuildMobileFooter"/>
  </xsl:template>


  <xsl:template name="BuildMobileFooter">
    <div id="mdpFooter">
      <div id="footerDiv" class="footer">
        <div id="footerlogin">
          <xsl:call-template name="loginlink"/>
        </div>
        
        <xsl:call-template name="feedbacklink"/>  | <a href="http://www.hathitrust.org/help_mobile">Help</a> | <xsl:call-template name="footertakedownlink"/>
        <br />
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>



