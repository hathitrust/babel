<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../pageviewer.xsl"/>

  <xsl:variable name="gCurrentView">
  	<xsl:value-of select="'1up'" >
  	</xsl:value-of>
  </xsl:variable>

  <xsl:template name="BookReaderSidebar">
    <div class="mdpControlContainer">

      <xsl:call-template name="crmsPageControls" />
<!--
      <xsl:call-template name="crmsModeControls" />
-->

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
      	<!--
      	<button id="wraptext">Wrapped Text</button><br />
      	<button id="unwraptext" class="selectedwrap">Unwrapped Text</button>
      	-->
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
            <xsl:text>http://m.catalog.hathitrust.org/Record/</xsl:text>
            <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
          </xsl:variable>
          <xsl:attribute name="class">tracked</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
          <!--<xsl:text>View full catalog record</xsl:text>-->
          <xsl:text>Back to Record</xsl:text>
    </xsl:element>
</xsl:template>

<xsl:template name="MobileGetBook">

        <xsl:for-each select="/MBooksTop/METS:mets/METS:dmdSec/present/record/metadata/oai_marc/varfield[@id='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
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


    //console.log("pageview.xsl - checkpoint init_from_params");
    /*
       		var myScroll;
			function loaded() {
				console.log("Setting iScroll Timeout");
				setTimeout(function () {
					console.log("Initializing TOC iScroll");
					myScroll = new iScroll('mdpMobileTableOfContents');
				}, 100);
			}
			console.log("Adding load event listener");
			window.addEventListener('load', loaded, false);
			*/
       /*
    var myScroll;
	function loaded() {
		console.log("Creating Scroller");
		myScroll = new iScroll('mdpMobileTableOfContents');
	}
	document.addEventListener('touchmove', function (e) { e.preventDefault(); }, false);
	document.addEventListener('DOMContentLoaded', loaded, false);
       */

    //console.log("pageview.xsl - document.addEventListener for loaded method");

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
        if ( HT.reader.ui == 'embed' ) {
          HT.reader.mode = 1;
          HT.reader.reduce = 1;
        }else{
        	switch(window.orientation){
        		case 90, -90:
        			HT.reader.mode=3;
        			break;
        		case 0:
        			HT.reader.mode=1;
        			break;
        	}
        }
        // HT.reader.displayMode = 'image';
        HT.reader.q1 = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>';
        HT.reader.flags.debug = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>';
        HT.reader.flags.attr = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='attr']"/>';
        HT.reader.flags.has_ocr = '<xsl:value-of select="string(/MBooksTop/MBooksGlobals/HasOcr)" />' == 'YES';
        HT.reader.flags.final_access_status = '<xsl:value-of select="$gFinalAccessStatus" />';
        //HT.reader.flags.force = (HT.reader.flags.debug.indexOf('force') >= 0);
        HT.reader.lazyDelay = 500;
        //console.log("pageview.xsl - checkpoint lazyDelay");
    </script>
    <script type="text/javascript" src="/pt/mobile/bookreader_startup.js?ts={generate-id(.)}">;</script>
    <!-- <script src="http://localhost:8080/target/target-script-min.js#anonymous"></script> -->
    
    <script type="text/javascript">
        // HT.monitor.run();
    </script>
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
            <xsl:text>http://m.catalog.hathitrust.org/Record/</xsl:text>
            <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
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
          <xsl:text>Download PDF - this page</xsl:text>
        </xsl:element>

      </p>
      </xsl:if>


      <xsl:if test="$gFullPdfAccessMessage != 'NOT_AVAILABLE'">


        <p id="fullPdfLinkP">
          <xsl:element name="a">
            <xsl:attribute name="title">Download full PDF</xsl:attribute>
            <xsl:attribute name="id">fullPdfLink</xsl:attribute>
            <xsl:attribute name="class">tracked</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Download PDF - whole book</xsl:attribute>
            <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
            </xsl:attribute>
            <xsl:text>Download PDF</xsl:text>
          </xsl:element>

          <xsl:if test="$gFullPdfAccess = 'deny'">
            <div id="noPdfAccess">
              <p>
                <xsl:choose>
                  <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                    <strong><a href="{$pViewTypeList/ViewTypeFullPdfLink}&amp;skin=mobilewayf;">Login</a></strong>
                    <xsl:text> to determine whether you can download this book.</xsl:text>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                    <xsl:text>Full PDF available only to authenticated users from </xsl:text>
                    <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed">HathiTrust partner institutions.</a>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_PD'">
                    <xsl:text>In-copyright books cannot be downloaded.</xsl:text>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_AVAILABLE'">
                    <xsl:text>This book cannot be downloaded.</xsl:text>
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
            <!--<xsl:attribute name="linktype">epub</xsl:attribute>-->
            <!--<xsl:attribute name="bookId"><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']" /></xsl:attribute>-->
            <!--<xsl:attribute name="proxy">false</xsl:attribute>-->
            <xsl:attribute name="class">tracked</xsl:attribute>
            <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
            <xsl:attribute name="data-tracking-action">PT Download EPUB</xsl:attribute>
            <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
            <!--<xsl:attribute name="href">#</xsl:attribute>-->
            <!--<xsl:attribute name="href_epub">-->
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
            </xsl:attribute>
            <xsl:text>Download EPUB</xsl:text>
          </xsl:element>



          <xsl:if test="$gFullPdfAccess = 'deny'">
            <div id="noEpubAccess">
              <p>
                <xsl:choose>
                  <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                    <strong><a href="{$pViewTypeList/ViewTypeFullPdfLink}&amp;skin=mobilewayf;">Login</a></strong>
                    <xsl:text> to determine whether you can download this book.</xsl:text>
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
<!--
    <div class="mdpPageLinks controls">
      <xsl:call-template name="BuildPageLinks">
        <xsl:with-param name="pPageLinks" select="MdpApp/PageLinks"/>
      </xsl:call-template>
      <br clear="both" />
    </div>
-->
<!--
    <div class="controls">
-->
<!--
      <xsl:call-template name="BuildPageXofYForm">
        <xsl:with-param name="pPageXofYForm" select="MdpApp/PageXOfYForm"/>
        <xsl:with-param name="pPageXofYFormId" select="'PageNumberJump_1'"/>
        <xsl:with-param name="pPageXofYId" select="'PageNumberJump_1_Form'"/>
      </xsl:call-template>
-->
<!--
      <xsl:variable name="pageNum">
		    <xsl:choose>
		      <xsl:when test="$gCurrentPageNum">
		        <xsl:value-of select="$gCurrentPageNum" />
		      </xsl:when>
		      <xsl:otherwise>
-->
		        <!-- not making this visible -->
            <!-- <xsl:text>n</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" /> -->
<!--
		      </xsl:otherwise>
		    </xsl:choose>
		  </xsl:variable>
-->
<!--
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
-->
        <!-- <xsl:attribute name="title">Jump to this sequential page in the text</xsl:attribute>
          <xsl:attribute name="alt">Jump to this sequential page in the text</xsl:attribute> -->
<!--
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
-->
<!--
    </div>
-->
    <xsl:if test="$gFinalView != 'plaintext'">
<!--
    <div class="controls">
        <xsl:call-template name="BuildResizeForm">
          <xsl:with-param name="pResizeForm" select="MdpApp/ResizeForm"/>
        </xsl:call-template>
    </div>
-->
<!--
    <div class="controls">
      <span class="sizeLabel controlLabel" title="Change page rotation">rotate&#xa0;</span>
      <xsl:variable name="href-counterclockwise" select="/MBooksTop/MdpApp/RotateLinks/CounterClockwiseLink" />
      <a href="{$href-counterclockwise}" id="rotate-counterclockwise" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Left" data-tracking-category="PT" title="Rotate Left"><img alt="" src="//common-web/graphics/harmony/icon_rotate_counterclockwise.png" height="25" width="25" /></a>
      <xsl:variable name="href-clockwise" select="/MBooksTop/MdpApp/RotateLinks/ClockwiseLink" />
      <a href="{$href-clockwise}" id="rotate-clockwise" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Right" data-tracking-category="PT" title="Rotate Right"><img alt="" src="//common-web/graphics/harmony/icon_rotate_clockwise.png" height="25" width="25" /></a>
    </div>
-->
    </xsl:if>

  </xsl:template>

  <!-- FORM: Image Resize -->
  <xsl:template name="BuildResizeForm">
    <xsl:param name="pResizeForm"/>
<!--
    <xsl:element name="form">
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>
-->
      <!-- <ul>
        <li class="asearchform"> -->
<!--
         <xsl:apply-templates select="$pResizeForm/HiddenVars"/>
          <xsl:for-each select="$pResizeForm/ResizeValuesSelect">
            <span class="sizeLabel" title="Change size">size&#xa0;</span>
            <xsl:call-template name="BuildHtmlSelect">
              <xsl:with-param name="class" select="'mdpSelectMenu'"/>
              <xsl:with-param name="key" select="'this.form.submit()'"/>
            </xsl:call-template>
          </xsl:for-each>
-->
       <!-- </li>
      </ul> -->
<!--
      <xsl:call-template name="HiddenDebug"/>
    </xsl:element>
-->
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

<!--

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

      .PTbutton, #btnClassicView {
        width: 8em;
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
            <img src="//common-web/graphics/harmony/icon_classicview.png">
              <xsl:attribute name="alt"></xsl:attribute>
            </img>
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
            <img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" alt="" />
            <span>Plain Text</span>
            <img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" alt="" />
          </xsl:element>
        </li>
      </ul>
    </div>

    -->

  </xsl:template>

  <xsl:template name="bookreader-toolbar-items">
    <!--

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
          <img src="//common-web/graphics/harmony/icon_scroll.png">
            <xsl:attribute name="alt"></xsl:attribute>
          </img>
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
          <img src="//common-web/graphics/harmony/icon_flip_25.png">
            <xsl:attribute name="alt"></xsl:attribute>
          </img>
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
          <img src="//common-web/graphics/harmony/icon_thumbnails.png">
            <xsl:attribute name="alt"></xsl:attribute>
          </img>
          <span>Thumbnails</span>
        </xsl:element>
      </li>
      </xsl:if>
    </script>

   -->

  </xsl:template>

  <xsl:template name="BuildContentsList2">
  	<div id="scrolltest" >
  	<ul>
  	<xsl:for-each select="$gFeatureList/Feature">
  		<li >
  			<xsl:value-of select="Label"/>
  		</li>
  	</xsl:for-each>
  	<xsl:for-each select="$gFeatureList/Feature">
  		<li >
  			<xsl:value-of select="Label"/>
  		</li>
  	</xsl:for-each>
  	<xsl:for-each select="$gFeatureList/Feature">
  		<li>
  			<xsl:value-of select="Label"/>
  		</li>
  	</xsl:for-each>
  	</ul>
  	</div>
  </xsl:template>


  <!-- CONTROL: Contents List -->
  <xsl:template name="BuildContentsList">
    <div >
    <div id="mdpFeatureListTitle">
          Table of Contents:&#xA0;&#xA0;
    </div>
    <xsl:element name="ul">
    	<xsl:attribute name="id"><xsl:text>mdpTOCContentsList</xsl:text></xsl:attribute>
        <!--<li id="mdpFeatureListTitle">
          Table of Contents:&#xA0;&#xA0;
        </li>-->

        <xsl:for-each select="$gFeatureList/Feature">
          <xsl:element name="li">

			<xsl:attribute name="class">mdpFeatureListItem</xsl:attribute>

            <xsl:element name="a">
            	<xsl:attribute name="class"><xsl:text>mdpFeatureListItemLink</xsl:text></xsl:attribute>
				<xsl:attribute name="href">
	            <xsl:value-of select="Link"/>
	            </xsl:attribute>
	            <xsl:attribute name="seq">
	            <xsl:value-of select="Seq"/>
	            </xsl:attribute>
	            <xsl:if test="Page!=''">
	              <xsl:element name="span">
	                    <xsl:attribute name="class">SkipLink</xsl:attribute>
	                    <xsl:text> on page number </xsl:text>
	                    <xsl:value-of select="Page"/>
	              </xsl:element>
	            </xsl:if>
	        </xsl:element>

	        <div class="toctext">
            <xsl:element name="span">
            	<xsl:attribute name="class"><xsl:text>mdpContentsName</xsl:text></xsl:attribute>
            	<xsl:value-of select="Label"/>
            </xsl:element>

           	<xsl:element name="span">
           	  <xsl:attribute name="class"><xsl:text>mdpContentsPageNumber</xsl:text></xsl:attribute>
              <xsl:if test="/MBooksTop/MBooksGlobals/SSDSession='false'">
                <!-- Do not repeat the page number already emitted CSS -->
                <!-- invisibly above for screen readers                -->
                <xsl:if test="Page!=''">
                	<span>    ......     </span>
                </xsl:if>
                <xsl:value-of select="Page"/>
              </xsl:if>
			</xsl:element>
			</div>
			<!-- </xsl:element> -->


          </xsl:element>
        </xsl:for-each>
    </xsl:element>
    </div>
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

      <!--
      <xsl:if test="$gMdpMetadata/varfield[@id='100']/subfield or $gMdpMetadata/varfield[@id='110']/subfield or $gMdpMetadata/varfield[@id='111']/subfield">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Author:</xsl:text>
          </span>
          <span id="mdpAuthor" class="mdpMetaText">
            <xsl:call-template name="MetadataAuthorHelper"/>
          </span>
        </div>
      </xsl:if>
      -->

      <!--
      <xsl:if test="$gMdpMetadata/varfield[@id='250']/subfield">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Edition:</xsl:text>
          </span>
          <span class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/varfield[@id='250']/subfield"/>
          </span>
        </div>
      </xsl:if>
      -->

      <!--
      <div class="mdpMetaDataRow">
        <span class="mdpMetaDataRegionHead">
          <xsl:text>Published:</xsl:text>
        </span>
        <span class="mdpMetaText">
          <xsl:if test="$gMdpMetadata/varfield[@id='260']/subfield[@label='a']">
            <xsl:value-of select="$gMdpMetadata/varfield[@id='260']/subfield[@label='a']"/>
            &#x20;
          </xsl:if>
          <xsl:if test="$gMdpMetadata/varfield[@id='260']/subfield[@label='b']">
            <xsl:value-of select="$gMdpMetadata/varfield[@id='260']/subfield[@label='b']"/>
            &#x20;
          </xsl:if>
          <xsl:if test="$gMdpMetadata/varfield[@id='260']/subfield[@label='c']">
            <xsl:value-of select="$gMdpMetadata/varfield[@id='260']/subfield[@label='c']"/>
          </xsl:if>
        </span>
      </div>
      -->

      <!--
      <xsl:choose>
        <xsl:when test="$gMdpMetadata/varfield[@id='MDP']/subfield[@label='h']">
          <div class="mdpMetaDataRow">
            <span class="mdpMetaDataRegionHead">
              <xsl:text>Orig. Call No.:</xsl:text>
            </span>
            <span class="mdpMetaText">
              <xsl:value-of select="$gMdpMetadata/varfield[@id='MDP']/subfield[@label='h']"/>
            </span>
          </div>
        </xsl:when>
        <xsl:otherwise>
          <xsl:if test="$gMdpMetadata/varfield[@id='050']/subfield[@label='a']">
            <div class="mdpMetaDataRow">
              <span class="mdpMetaDataRegionHead">
                <xsl:text>Orig. Call No.:</xsl:text>
              </span>
              <span class="mdpMetaText">
                <xsl:value-of select="$gMdpMetadata/varfield[@id='050']/subfield[@label='a']"/>
                <xsl:text> </xsl:text>
                <xsl:value-of select="$gMdpMetadata/varfield[@id='050']/subfield[@label='b']"/>
              </span>
            </div>
          </xsl:if>
        </xsl:otherwise>
      </xsl:choose>
      -->

      <!--
      <xsl:if test="$gMdpMetadata/varfield[@id='300']/subfield">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Description:</xsl:text>
          </span>
          <span class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/varfield[@id='300']/subfield[@label='a']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/varfield[@id='300']/subfield[@label='b']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/varfield[@id='300']/subfield[@label='c']"/>
          </span>
        </div>
      </xsl:if>
      -->

      <xsl:if test="$gRightsAttribute">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Copyright:</xsl:text>
          </span>
          <span class="mdpMetaText">
            <xsl:call-template name="BuildRDFaCCLicenseMarkup" />
            <!-- <xsl:element name="a">
              <xsl:attribute name="href">http://www.hathitrust.org/faq#RightsCodes</xsl:attribute>
              <xsl:choose>
                <xsl:when test="$gRightsAttribute='1'">
                  <xsl:text>Public Domain</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='2'">
                  <xsl:text>In-copyright</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='3'">
                  <xsl:text>In-copyright</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='4'">
                  <xsl:text>In-copyright</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='5'">
                  <xsl:text>Undetermined copyright status</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='6'">
                  <xsl:text>Available to U-M affiliates and walk-in patrons (all
                  campuses)</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='7'">
                  <xsl:text>Available to everyone in the world</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='8'">
                  <xsl:text>Available to nobody; blocked for all users</xsl:text>
                </xsl:when>
                <xsl:when test="$gRightsAttribute='9'">
                  <xsl:text>Public domain only when viewed in the US</xsl:text>
                </xsl:when>
                <xsl:otherwise/>
              </xsl:choose>
            </xsl:element> -->
          </span>
        </div>
      </xsl:if>

      <!--
      <xsl:if test="$gSourceAttribute">
        <div class="mdpMetaDataRow">
          <span class="mdpMetaDataRegionHead">
            <xsl:text>Access and Use:</xsl:text>
          </span>
          <span class="mdpMetaText">
            <xsl:choose>
              <xsl:when test="$gRightsAttribute='1' or $gRightsAttribute='7' or $gRightsAttribute='9'">
                <xsl:choose>
                  <xsl:when test="$gSourceAttribute='1'">
                    <xsl:text>Users are free to download, cite and link to this digital item. Downloaded portions may not be redistributed, rehosted, or used commercially.</xsl:text>
                  </xsl:when>
                  <xsl:when test="$gSourceAttribute='2'">
                    <xsl:text>Users are free to download, copy, and distribute this work without asking for permission.</xsl:text>
                  </xsl:when>
                  <xsl:otherwise/>
                </xsl:choose>
              </xsl:when>
              <xsl:when test="$gRightsAttribute='2' or $gRightsAttribute='3' or $gRightsAttribute='4'">
                <xsl:text>This item is keyword searchable only. Page images and full text are not available due to copyright restrictions.</xsl:text>
              </xsl:when>
              <xsl:when test="$gRightsAttribute='6'">
                <xsl:text>This item is keyword searchable only. The copyright status is undetermined and it is treated as though it were in copyright.</xsl:text>
              </xsl:when>
              <xsl:when test="$gRightsAttribute='8'">
                <xsl:text>This item is keyword searchable only. Viewing is restricted while issues regarding display are resolved.</xsl:text>
              </xsl:when>
              <xsl:otherwise/>
            </xsl:choose>
          </span>
        </div>
      </xsl:if>
      -->

      <!-- allow SSD user to link from SSDviewer to pageturner if desired -->
      <!--
      <xsl:choose>
        <xsl:when test="$ssd">
          <xsl:call-template name="PermanentURL">
            <xsl:with-param name="ssd" select="$ssd"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="PermanentURL"/>
        </xsl:otherwise>
      </xsl:choose>
      -->

  </xsl:template>

    <xsl:template name="PermanentURL">
  <!--
    <xsl:param name="ssd"/>
    <div class="mdpMetaDataRow">
      <span class="mdpMetaDataRegionHead">
        <xsl:text>Permanent URL:</xsl:text>
      </span>
      <span class="mdpMetaText">
        <xsl:choose>
          <xsl:when test="$gItemHandle=''">
            <xsl:text>not available</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$ssd = 'true'">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
                  <xsl:value-of select="$gItemHandle"/>
                </a>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$gItemHandle"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </span>
    </div>
    -->
  </xsl:template>


  <xsl:template match="/MBooksTop" mode="reader">
    <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
    <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
    <xsl:variable name="min-width">
      <xsl:choose>
        <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
          <xsl:value-of select="350 + (1100 * ( $currentSize div 100 ))" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="270 + (680 * ( $currentSize div 100 ))" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <html lang="en" xml:lang="en"
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      version="XHTML+RDFa 1.0"
      >
      <xsl:if test="$gUsingBookReader = 'true'">
        <xsl:attribute name="class"><xsl:text>htmlNoOverflow</xsl:text></xsl:attribute>
      </xsl:if>

      <head profile="http://www.w3.org/1999/xhtml/vocab">

		<meta name="HandheldFriendly" content="true" />
		<link rel="alternate" media="handheld" href="" />
		<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1; minimum-scale=1; user-scalable=0;" />
		<meta name="format-detection" content="telephone=no" />
		<!-- this causes bookmarked-to-home to open without browser chrome; don't do that -->
		<!-- <meta name="apple-mobile-web-app-capable" content="yes" />  -->

        <!-- RDFa -->
        <xsl:call-template name="BuildRDFaLinkElement"/>
        <title>
          <xsl:call-template name="PageTitle">
            <xsl:with-param name="prefix" select="'HathiTrust Mobile'" />
          </xsl:call-template>
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:if test="$gUsingBookReader='true'">
          <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/>
        </xsl:if>
        <xsl:call-template name="load_js_and_css"/>
        <script type="text/javascript" src="/pt/js/FudgingBookReader.js"></script>
        
        <!-- <xsl:call-template name="online_assessment"/> -->

        <xsl:if test="$gCurrentView = 'image'">
          <style>
            html, body {
              min-width: <xsl:value-of select="$min-width" />px;
            }
          </style>
        </xsl:if>

        <xsl:comment><![CDATA[[if IE 7]>
        <style>
          #mdpNewStarburst {
            margin-left: -25px;
          }

          .prompt {
            margin-left: 0;
          }

          #mdpBookReaderViews {
            margin-left: 30px;
          }

          #mdpToolbarNav > ul {
            padding-left: 0;
          }

        </style>
        <![endif]]]></xsl:comment>


        <xsl:call-template name="bookreader-toolbar-items" />

        <xsl:call-template name="setup-ht-params" />

      </head>

	<!-- scrollTo(0,1);ToggleContentListSize(); -->
      <body class="yui-skin-sam" onload="scrollTo(0,1);">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>

        <xsl:call-template name="header"/>

        <xsl:call-template name="BookReaderContainer" />

        <!-- not using these after all; keep reference around until we're sure -->
        <!-- <xsl:if test="$gUsingBookReader = 'true'">
          <xsl:call-template name="bookreader-page-items" />
        </xsl:if> -->

        <!-- Footer -->
        <xsl:call-template name="footer">
          <xsl:with-param name="gUsingBookReader" select="$gUsingBookReader" />
        </xsl:call-template>

        <xsl:if test="$gUsingBookReader = 'true'">
          <xsl:call-template name="bookreader-javascript-init" />
        </xsl:if>
        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>


  <!-- FORM: Search -->
  <xsl:template name="MobileBuildSearchForm">

<!--
    <xsl:param name="pSearchForm"/>
    <xsl:element name="form">
      <xsl:attribute name="onsubmit">
        <xsl:value-of select="'return FormValidation(this.q1, &quot;Please enter a term in the search box.&quot;)'"/>
      </xsl:attribute>
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'ptsearch'"/>
      </xsl:attribute>

      <h2 class="SkipLink">Search and page navigation options</h2>
-->
      <!--<ul>
        <li id="mdpSearchFormLabel"> -->
        <div id="mdpSearchFormLabel">
          <!--<label for="mdpSearchInputBox">Search in this text</label>-->
          <xsl:element name="a">
            <xsl:attribute name="class">SkipLink</xsl:attribute>
            <xsl:attribute name="name">SkipToSearch</xsl:attribute>
          </xsl:element>
        </div>
        <!--<li class="asearchform">-->
        <form method="get" onsubmit='return false;' action='pt/search'>
        <div class="asearchform">
          <!--<xsl:apply-templates select="$pSearchForm/HiddenVars"/>-->

          <xsl:element name="input">
            <xsl:attribute name="id">mdpSearchInputBox</xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="name">q1</xsl:attribute>
            <xsl:attribute name="maxlength">150</xsl:attribute>
            <xsl:attribute name="size">20</xsl:attribute>
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
        <!--</li>
      </ul>-->
<!--
      <xsl:call-template name="HiddenDebug"/>
    </xsl:element>
-->
<!--
	<div id="mdpSearchResultsFooter">
	<div id="footerDiv" class="footer">

		    <div id="footerlogin">
				<xsl:call-template name="loginlink"/>
    		</div>

			<span style="color: black;">Mobile</span> | <a href="http://catalog.hathitrust.org?mdetect=no">Regular Site</a>
			<br />

			<xsl:call-template name="feedbacklink"/> | <xsl:call-template name="helplink"/> | <xsl:call-template name="footertakedownlink"/>
			<br />


	</div>
	</div>
-->
	<xsl:call-template name="BuildMobileFooter"/>
  </xsl:template>


  <xsl:template name="BuildMobileFooter">
	  <div id="mdpFooter">
		<div id="footerDiv" class="footer">

			    <div id="footerlogin">
					<xsl:call-template name="loginlink"/>
	    		</div>

	    	<!-- 2011-09-29: "regular site" link shouldn't take you to the catalog -->
        <!-- <span style="color: black;">Mobile</span> | <a href="http://catalog.hathitrust.org?mdetect=no">Regular Site</a>
        <br />         -->

				<xsl:call-template name="feedbacklink"/>  | <a href="http://www.hathitrust.org/help_mobile">Help</a> | <xsl:call-template name="footertakedownlink"/>
				<br />


		</div>
		</div>
  </xsl:template>

  <!-- | <xsl:call-template name="helplink"/> -->
<!-- VIEWING AREA -->
  <xsl:template name="Viewport">
    <xsl:param name="pCurrentPageImageSource"/>
    <xsl:param name="pCurrentPageOcr"/>
    <xsl:param name="pAccessStatus"/>

    <!-- now handle the view type -->
    <xsl:choose>
      <xsl:when test="$gFinalView='pdf'">
        <xsl:element name="iframe">
          <xsl:attribute name="id">mdpPdf</xsl:attribute>
          <xsl:attribute name="src">
            <xsl:value-of select="$pCurrentPageImageSource"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:when>

      <xsl:when test="$gFinalView='plaintext'">
        <xsl:element name="div">
          <xsl:attribute name="id">mdpText</xsl:attribute>
          <p>
            <xsl:apply-templates select="$pCurrentPageOcr"/>
          </p>
        </xsl:element>
      </xsl:when>

      <xsl:when test="$gFinalView='empty'">
        <div id="mdpTextEmpty">
          <xsl:choose>
            <xsl:when test="$gHasOcr='YES'">
              <div class="mdpTMPhead">NO TEXT ON PAGE</div>
              <div class="mdpTMPtext">This page does not contain any text recoverable by the OCR engine</div>
            </xsl:when>
            <xsl:otherwise>
              <div class="mdpTMPhead">NO TEXT IN THIS ITEM</div>
              <div class="mdpTMPtext">This item consists only of page images without any OCR text</div>
            </xsl:otherwise>
          </xsl:choose>
        </div>
      </xsl:when>

      <xsl:when test="$gFinalView='restricted'">
        <xsl:element name="div">
          <xsl:attribute name="id">mdpTextDeny</xsl:attribute>

          <div class="header">
		      <a class="htlogobutton" href="http://m.hathitrust.org"></a>
		      <xsl:element name="a">
		          <xsl:attribute name="id">mdpCatalogLinkLimited</xsl:attribute>
		          <xsl:variable name="href">
		            <xsl:text>http://m.catalog.hathitrust.org/Record/</xsl:text>
		            <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
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
          </div>
          <br />

          <xsl:choose>
            <!-- If opb (attr=3) + affiliated user then tell them when -->
            <!-- current accessor's exclusive access expires -->
            <xsl:when test="$gRightsAttribute='3' and $gMichiganAffiliate='true'">
              <div class="Specialtext">
                <p class="leftText">Full view access <em>is</em> available for this item under the following circumstances:</p>
                <ul>
                  <li><strong>Unlimited</strong> use via University of Michigan Library computers</li>
                  <li><strong>One user at a time</strong> for authenticated University of Michigan users in 24 hour increments</li>
                </ul>
                <p class="leftText">You are seeing this message because another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
                <p class="leftText"><a href="#" id="section108">Learn more</a>.</p>

              </div>
            </xsl:when>
            <xsl:otherwise>
              <p class="centertext">Full view is not available for this item <br/>due to copyright &#169; restrictions.</p>
            </xsl:otherwise>
          </xsl:choose>
          <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
          <div style="background-color:#f6f6f6;margin:0;padding:10px">
          <div id="limitedviewoptions">
              <!--<img src="//common-web/graphics/LimitedSample.png" alt="" class="imgFloat"/>-->
              <p>What you <strong>CAN</strong> do:
                <ul>
                  <li>
                      <xsl:variable name="id" select="//CurrentCgi/Param[@name='id']" />
	                  <xsl:element name="a">
	                  	<xsl:attribute name="id">mdpLimitedSearchInside</xsl:attribute>
		           	  	<xsl:attribute name="href">
      						<xsl:value-of select="concat('/cgi/pt?id=', $id)" />
      					</xsl:attribute>
      					<xsl:text>Search inside on Regular (non-mobile) Website</xsl:text>
		              </xsl:element>
                  <!--Find the frequency and page numbers of specific words and phrases to help you decide if the book would be useful to you.-->
                  </li>
                  <li>
                  <xsl:call-template name="MobileGetBook"/>
                  <!-- Find this item in a library near you using WorldCat. -->
                  </li>
                </ul>
              </p>
              <p>Or <a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">learn more</a> about HathiTrust copyright regulations</p>
            </div>
            </div>
        </xsl:element>
        <xsl:call-template name="BuildMobileFooter"/>
      </xsl:when>

      <xsl:when test="$gFinalView='restricted-with-thumbnails'">
        <xsl:element name="div">
          <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
          <xsl:choose>
            <!-- If opb (attr=3) + affiliated user then tell them when -->
            <!-- current accessor's exclusive access expires -->
            <xsl:when test="$gRightsAttribute='3' and $gMichiganAffiliate='true'">
              <div class="Specialtext">
                <p class="leftText">Full view access <em>is</em> available for this item under the following circumstances:</p>
                <ul>
                  <li><strong>Unlimited</strong> use via University of Michigan Library computers</li>
                  <li><strong>One user at a time</strong> for authenticated University of Michigan users in 24 hour increments</li>
                </ul>
                <p class="leftText">You are seeing this message because another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
                <p class="leftText"><a href="#" id="section108">Learn more</a>.</p>

              </div>
            </xsl:when>
            <xsl:otherwise>
              <h2>
                <img src="//common-web/graphics/LimitedLink.png" alt="" class="imgFloat" />
                Full view is not available for this item <br/>due to copyright &#169; restrictions.
              </h2>
            </xsl:otherwise>
          </xsl:choose>
          <!-- <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p> -->
          <div>
              <img src="//common-web/graphics/LimitedSample.png" alt="" class="imgFloat"/>
              <p>What you <strong>CAN</strong> do:
                <ul>
                  <li>Use the "Search in this text" search box above to find frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, or when working with a book that does not have an index.</li>
                  <li>Click the "Find in a library" link to find this item in a library near you.</li>
                </ul>
              </p>
              (<a href="http://www.hathitrust.org/faq#RestrictedAccess">More information</a>)
            </div>
        </xsl:element>
        <div id="BookReader"></div>
      </xsl:when>

      <xsl:when test="$gFinalView='missing'">
        <div id="mdpTextMissingPage">
          <div class="mdpTMPhead">MISSING PAGE</div>
          <div class="mdpTMPtext">This page is missing in the original.  Use the arrows and links to continue to available pages.</div>
          <div class="mdpTMPtext"><a href="http://www.hathitrust.org/faq#PageNotAvailable">See the Help page for more information.</a></div>
        </div>
      </xsl:when>

      <xsl:when test="$gFinalView = 'image'">
        <xsl:element name="img">
          <xsl:attribute name="alt">image of individual page</xsl:attribute>
          <xsl:attribute name="id">mdpImage</xsl:attribute>
          <xsl:attribute name="src">
            <xsl:value-of select="$pCurrentPageImageSource"/>
          </xsl:attribute>
          <xsl:attribute name="width">
            <xsl:value-of select="$gCurrentPageImageWidth"/>
          </xsl:attribute>
          <xsl:attribute name="height">
            <xsl:value-of select="$gCurrentPageImageHeight"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:when>

      <xsl:otherwise>
        <div id="BookReader"></div>
      </xsl:otherwise>

    </xsl:choose>
  </xsl:template>

</xsl:stylesheet>



