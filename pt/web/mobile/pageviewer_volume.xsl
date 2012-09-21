<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:import href="../pageviewer_volume.xsl"/>

  <xsl:variable name="gCurrentView">
    <xsl:variable name="currentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
    <xsl:choose>
      <xsl:when test="$currentView = '2up'">2up</xsl:when>
      <xsl:when test="$currentView = '1up'">1up</xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gUsingBookReader">true</xsl:variable>

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

        console.log("PARAMS:", HT.params.view);
        if ( ! HT.params.view ) {
          if ( $(window).width() - $(window).height() == Math.abs($(window).width() - $(window).height() )) {
            HT.params.view = '2up';
          } else {
            HT.params.view = '1up';
          }
        }

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
        }
        console.log("STARTUP", HT.params.view);

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
    
  </xsl:template>

  <xsl:template name="BookReaderToolbar">
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

 
</xsl:stylesheet>



