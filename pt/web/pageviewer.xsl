<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  extension-element-prefixes="str" xmlns:str="http://exslt.org/strings">

  <xsl:import href="str.replace.function.xsl" />

  <!-- Global Variables -->
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gCurrentPageImageSource" select="/MBooksTop/MBooksGlobals/CurrentPageImageSource"/>
  <xsl:variable name="gCurrentPageImageWidth" select="/MBooksTop/MBooksGlobals/CurrentPageImageWidth"/>
  <xsl:variable name="gCurrentPageImageHeight" select="/MBooksTop/MBooksGlobals/CurrentPageImageHeight"/>
  <xsl:variable name="gCurrentPageOcr" select="/MBooksTop/MBooksGlobals/CurrentPageOcr"/>
  <xsl:variable name="gCurrentPageNum" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']"/>
  <xsl:variable name="gCurrentQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
  <xsl:variable name="gCurrentPageFeatures" select="/MBooksTop/MdpApp/CurrentPageFeatures"/>
  <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>
  <xsl:variable name="gBackNavLinkType" select="/MBooksTop/MdpApp/BackNavInfo/Type"/>
  <xsl:variable name="gBackNavLinkHref" select="/MBooksTop/MdpApp/BackNavInfo/Href"/>
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  
  <xsl:variable name="gCurrentUi">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>reader</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentView">
    <xsl:variable name="currentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
    <xsl:choose>
      <!-- <xsl:when test="$gFinalAccessStatus != 'allow'">thumb</xsl:when> -->
      <xsl:when test="$gCurrentUi = 'embed'">
        <xsl:choose>
          <xsl:when test="$currentView = 'image'">1up</xsl:when>
          <xsl:when test="$currentView = 'text' or $currentView = 'plaintext'">1up</xsl:when>
          <xsl:otherwise><xsl:value-of select="$currentView" /></xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$currentView" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <!-- <xsl:variable name="gCurrentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']"/> -->
  
  <xsl:variable name="gCurrentReaderMode">
    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'embed'">embed</xsl:when>
      <xsl:otherwise>full</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  
  <xsl:variable name="gUsingBookReader">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'"><xsl:value-of select="'false'" /></xsl:when>
      <xsl:when test="$gCurrentView = '1up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = '2up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'thumb'"><xsl:value-of select="'true'" /></xsl:when>
      <!-- <xsl:when test="$gCurrentView = 'text'"><xsl:value-of select="'true'" /></xsl:when> -->
      <xsl:otherwise><xsl:value-of select="'false'" /></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gFinalView">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'">
        <xsl:value-of select="'restricted'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="contains($gCurrentPageFeatures,'MISSING_PAGE') and $gUsingBookReader = 'false'">
            <xsl:value-of select="'missing'"/>
          </xsl:when>
          <xsl:when test="$gCurrentView = 'text'">
            <!-- use classic text view -->
            <xsl:text>plaintext</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$gCurrentView='image' or $gUsingBookReader = 'true'">
                <xsl:value-of select="$gCurrentView"/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:choose>
                  <xsl:when test="$gCurrentPageOcr=''">
                    <xsl:value-of select="'empty'"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$gCurrentView"/>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gViewIsResizable">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted' or $gFinalView='empty' or $gFinalView='missing'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gShowViewTypes">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  
  <xsl:variable name="gMinImageHeight">
    <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
    <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
    <xsl:choose>
      <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
        <xsl:value-of select="(680 * ( $currentSize div 100 ))" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="(1024 * ( $currentSize div 100 ))" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <!-- root template -->
  <!-- root template -->
  <xsl:template match="/MBooksTop">
    
    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'reader'">
        <xsl:apply-templates select="." mode="reader" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'embed'">
        <xsl:apply-templates select="." mode="embed" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="." mode="reader" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
    
  <xsl:template match="/MBooksTop" mode="reader">
    <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
    <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
    <!-- <xsl:variable name="min-width">
      <xsl:choose>
        <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
          <xsl:value-of select="350 + (1100 * ( $currentSize div 100 ))" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="270 + (680 * ( $currentSize div 100 ))" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable> -->

    <xsl:variable name="min-width">
      <xsl:value-of select="270 + (680 * ( $currentSize div 100 ))" />
    </xsl:variable>

    <html lang="en" xml:lang="en" 
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      version="XHTML+RDFa 1.0"
      >
      <xsl:choose>
        <xsl:when test="$gUsingBookReader = 'true'">
          <xsl:attribute name="class"><xsl:text>htmlNoOverflow</xsl:text></xsl:attribute>
        </xsl:when>
        <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
          <xsl:attribute name="class"><xsl:text>htmlNoOverflowX</xsl:text></xsl:attribute>
        </xsl:when>
        <xsl:otherwise/>
      </xsl:choose>

      <head profile="http://www.w3.org/1999/xhtml/vocab">
        <!-- RDFa -->
        <xsl:call-template name="BuildRDFaLinkElement"/>
        <title>
          <xsl:call-template name="PageTitle" />
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/jquery-ui.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:if test="$gUsingBookReader='true'">
          <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/>
        </xsl:if>
        <xsl:call-template name="load_js_and_css"/>
        <!-- <xsl:call-template name="online_assessment"/> -->

        <!-- <xsl:if test="$gCurrentView = 'image'">
          <style>
            html, body {
              min-width: <xsl:value-of select="$min-width" />px;
            }
          </style>
        </xsl:if> -->
        
        <xsl:text disable-output-escaping="yes">
        <![CDATA[<!--[if IE 7]>]]>
        </xsl:text>
        <!-- <script src="//ie7-js.googlecode.com/svn/version/2.1(beta4)/IE7.js"></script> -->
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
          
          body {
            /* width: <xsl:value-of select="$min-width" />px; */
            width: auto;
          }
          
        </style>
        <xsl:text disable-output-escaping="yes">
        <![CDATA[<![endif]-->]]>
        </xsl:text>
        
        <xsl:call-template name="bookreader-toolbar-items" />
        
        <xsl:call-template name="setup-ht-params" />
        
      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>
        
        <!-- <xsl:if test="$gUsingBookReader = 'true'">
          <a href="#" title="Pull Down Header" id="mbToggleHeader">Show Header&#160;</a>
        </xsl:if> -->
        
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
        
        <!-- <xsl:if test="$gUsingBookReader = 'true'">
          <xsl:call-template name="bookreader-javascript-init" />
        </xsl:if> -->
        
        <xsl:choose>
          <xsl:when test="$gUsingBookReader = 'true'">
            <xsl:call-template name="bookreader-javascript-init" />
          </xsl:when>
          <xsl:when test="$gCurrentView = 'image'">
            <xsl:call-template name="classic-javascript-init" />
          </xsl:when>
          <xsl:otherwise />
        </xsl:choose>
        
        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template match="/MBooksTop" mode="embed">

    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml" class="htmlNoOverflow">
      <head>
        <title>
          <xsl:call-template name="PageTitle" />
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/>
        <xsl:call-template name="load_js_and_css"/>
        <!-- xsl:call-template name="online_assessment"/-->

        <link rel="stylesheet" type="text/css" href="/pt/embedded.css"/>
        
        <xsl:call-template name="setup-ht-params" />
        
      </head>

      <body class="yui-skin-sam">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>
        
        <xsl:call-template name="BookReaderEmbeddedContainer" />

        <xsl:call-template name="bookreader-javascript-init" />

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template name="setup-ht-params">
    <script type="text/javascript">
      HT.params = {};
      <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
        <xsl:choose>
          <xsl:when test="@name = 'seq'">
            HT.params['<xsl:value-of select="@name" />'] = <xsl:value-of select="number(.) - 1" />;
          </xsl:when>
          <xsl:otherwise>
            HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="." />';
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
      HT.params.view = "<xsl:value-of select="$gCurrentView" />";
      HT.config.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
    </script>
  </xsl:template>

  <xsl:template name="bookreader-javascript-init">
    <script type="text/javascript">
      
       HT.init_from_params();

       HT.reader = new HTBookReader();
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
        HT.reader.slice_size = 100;
        HT.reader.total_slices = 1;
        HT.reader.ui = '<xsl:value-of select="$gCurrentReaderMode" />';
        if ( HT.reader.ui == 'embed' ) {
          HT.reader.mode = 1;
          HT.reader.reduce = 1;
        }
        // HT.reader.displayMode = 'image';
        HT.reader.q1 = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>';
        HT.reader.flags.debug = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>';
        HT.reader.flags.attr = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='attr']"/>';
        HT.reader.flags.has_ocr = '<xsl:value-of select="string(/MBooksTop/MBooksGlobals/HasOcr)" />' == 'YES';
        HT.reader.flags.final_access_status = '<xsl:value-of select="$gFinalAccessStatus" />';
        HT.reader.flags.force = (HT.reader.flags.debug.indexOf('force') >= 0);
        HT.reader.lazyDelay = 500;
    </script>
    <script type="text/javascript" src="/pt/js/bookreader_startup.js"/> 
    <script type="text/javascript">
        HT.monitor.run();
    </script>
  </xsl:template>
  
  <xsl:template name="classic-javascript-init">
    <script type="text/javascript" src="/pt/js/classic_startup.js"/> 
  </xsl:template>

  <xsl:template name="online_assessment">
    <script xmlns="" type="text/javascript" src="/pt/web/js/jQuery-Notify-bar/jquery.notifyBar.js"></script>
    <script xmlns="" type="text/javascript" src="/pt/web/js/jquery.cookie.js"></script>

    <script xmlns="" type="text/javascript">
      $(document).ready(function() {
          var value = $.cookie('survey.hathitrust.org');
          if (value == null) {
            $.cookie('survey.hathitrust.org', 1, { expires: 30, path: '/', domain: '.hathitrust.org' });
            $.notifyBar(
              {
                html: '<div style="margin-bottom:3px">Please participate in a brief <a onClick="pageTracker._trackEvent(\'PT\', \'click\', \'WCLsurveyIntercept\');" style="text-decoration: underline; color:blue" target="_blank" href="http://www.loop11.com/usability-test/7292/introduction/">online usability assessment</a>.</div><div>Your comments can help us improve access to the HathiTrust Digital Library</div>',
                close: true,
                delay: 2000000,
                animationSpeed: "normal"
              });
          }
      });
    </script>
    <link xmlns="" rel="stylesheet" href="/pt/js/jQuery-Notify-bar/jquery.notifyBar.css" type="text/css" media="screen" />
  </xsl:template>

  <!-- Top Level Container DIV -->
  <xsl:template name="UberContainer">

    <div id="mdpUberContainer">
      <!-- Header -->
      <xsl:call-template name="header"/>

      <div id="ControlContentContainer">
        <div id="ControlContent">
          <!-- Controls -->
          <xsl:call-template name="ControlContainer"/>

          <!-- Image -->
          <xsl:call-template name="ContentContainer"/>

          <!-- Feedback form -->
          <div id="feedbackDiv"></div>

          <!-- New collection overlay -->
          <div id="overlay"></div>

          <!-- Controls Bottom -->
          <xsl:call-template name="ControlContainerBottom"/>

          <!-- Feedback -->
          <xsl:call-template name="Feedback"/>
        </div>
      </div>

      <!-- Footer -->
      <xsl:call-template name="footer"/>
    </div>

  </xsl:template>

  <xsl:template name="BookReaderEmbeddedContainer">
    <div id="mdpUberContainer">
      <xsl:call-template name="BookReaderEmbeddedToolbar" />
      <xsl:call-template name="ContentContainer"/>
    </div>
  </xsl:template>

  <!-- Top Level Container DIV -->
  <xsl:template name="BookReaderContainer">
    <!-- <xsl:param name="gCurrentReaderMode" select="'full'" /> -->
    
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>

    <div id="mdpUberContainer">
      <xsl:call-template name="BookReaderSidebar" />

      <xsl:call-template name="BookReaderToolbar">
        <xsl:with-param name="pViewTypeList" select="$pViewTypeList"/>
      </xsl:call-template>
      

      <!-- Image -->
      <xsl:element name="a">
        <xsl:attribute name="name">skipNav</xsl:attribute>
        <xsl:attribute name="id">skipNav</xsl:attribute>
      </xsl:element>
      <xsl:call-template name="ContentContainer"/>
      
      <xsl:if test="$gUsingBookReader = 'false'">
        <div id="mdpBottomToolbar">
          <xsl:if test="$gFinalAccessStatus != 'allow'">
            <xsl:attribute name="class"><xsl:text>disabled</xsl:text></xsl:attribute>
          </xsl:if>
          <xsl:call-template name="build-toolbar-nav">
            <xsl:with-param name="target">footer</xsl:with-param>
          </xsl:call-template>
        </div>
      </xsl:if>

    </div>

    <!-- Feedback -->
    <xsl:call-template name="Feedback"/>

    <!-- New collection overlay -->
    <div id="overlay"></div>

  </xsl:template>
  
  <xsl:template name="BookReaderSidebar">
    <div class="mdpControlContainer">

      <xsl:call-template name="aboutThisBook" />
      
      <div class="mdpScrollableContainer">
        
        <xsl:call-template name="getThisBook" />
        <xsl:call-template name="addToCollection" />
        <xsl:call-template name="shareThisBook" />


      </div> <!-- scrollable -->
      
    </div>
  </xsl:template>
  
  <xsl:template name="BookReaderEmbeddedToolbar">
    <div id="mdpToolbarViews">
      <div id="mdpToolbarNav">
        <div class="branding">
          <div class="brandingLogo">
            <a href="http://catalog.hathitrust.org"><img src="//common-web/graphics/HathiTrust.gif" alt="Hathi Trust Logo"/></a>
          </div>
        </div>
        <xsl:call-template name="BuildPageLinks">
          <xsl:with-param name="pPageLinks" select="//MdpApp/PageLinks"/>
        </xsl:call-template>
        <div class="embedLink">
          <xsl:element name="a">
            <xsl:attribute name="href"><xsl:value-of select="//ViewType1UpLink" /></xsl:attribute>
            <xsl:attribute name="target"><xsl:text>_blank</xsl:text></xsl:attribute>
            <xsl:call-template name="GetMaybeTruncatedTitle">
              <xsl:with-param name="titleString" select="$gTitleString"/>
              <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
              <xsl:with-param name="maxLength" select="'20'"/>
            </xsl:call-template>
          </xsl:element>
        </div>  
      </div>
    </div>
  </xsl:template>
  
  <xsl:template name="BookReaderToolbar">
    <xsl:param name="pViewTypeList"/>

    <div id="mdpToolbar">
      <xsl:if test="$gFinalAccessStatus != 'allow'">
        <xsl:attribute name="class"><xsl:text>disabled</xsl:text></xsl:attribute>
      </xsl:if>
      
      <xsl:if test="$gCurrentReaderMode = 'full'">
      <div id="mdpToolbarViews">
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
                <!-- <xsl:attribute name="alt">
                  <xsl:text>Classic View</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="title"><xsl:text>Classic View</xsl:text></xsl:attribute> -->
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
              <!-- remove this if we ever do scrolling text view -->
              <xsl:if test="$gHasOcr='YES'">
                <xsl:attribute name="accesskey">5</xsl:attribute>
              </xsl:if>
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
      </xsl:if>
      <xsl:call-template name="build-toolbar-nav" />
    </div>
  </xsl:template>
  
  <xsl:template name="bookreader-page-items">
    <div id="BRpageControls">
      <div>
        <label>Print</label>
        <a href="#" id="print-page" title="Print Page" class="printAction tracked interactive" target="pdf" data-tracking-action="PT Print" data-tracking-category="PT"><img alt="" src="//common-web/graphics/harmony/icon_printer.png" height="25" width="25" /></a>
        <label>Rotate</label>
        <a href="#" id="rotate-left" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Left" data-tracking-category="PT" title="Rotate Left"><img alt="" src="//common-web/graphics/harmony/icon_rotate_counterclockwise.png" height="25" width="25" /></a>
        <a href="#" id="rotate-right" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Right" data-tracking-category="PT" title="Rotate Right"><img alt="" src="//common-web/graphics/harmony/icon_rotate_clockwise.png" height="25" width="25" /></a>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="bookreader-toolbar-items">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <script id="bookreader-toolbar-items" type="text/x-jquery-tmpl">
      <li>
        <ul id="mdpBookReaderViews">
          <li>
            <img alt="NEW!" id="mdpNewStarburst" src="//common-web/graphics/harmony/NewStarburst.png" height="44" width="40" />
          </li>
          <li>
            <span class="prompt">Try our new views!</span>
          </li>
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
                <!-- <xsl:attribute name="alt">
                  <xsl:text>Scroll View</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute> -->
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
                <!-- <xsl:attribute name="alt">
                  <xsl:text>Flip View</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute> -->
              </img>
              <span>Flip</span>
            </xsl:element>
          </li>
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
                <!-- <xsl:attribute name="alt">
                  <xsl:text>Thumbnail View</xsl:text>
                </xsl:attribute>
                <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute> -->
              </img>
              <span>Thumbnails</span>
            </xsl:element>
          </li>
          <!-- <li>
            <xsl:element name="a">
              <xsl:attribute name="id"><xsl:text>btnBookReaderText</xsl:text></xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Text View</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:if test="$gHasOcr='YES'">
                  <xsl:value-of select="$pViewTypeList/ViewTypeTextLink"/>
                </xsl:if>
              </xsl:attribute>
              <xsl:if test="$gHasOcr='YES'">
                <xsl:attribute name="accesskey">5</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="title">
                <xsl:choose>
                  <xsl:when test="$gHasOcr='NO'">
                    <xsl:text>(This item has no text)</xsl:text>
                  </xsl:when>
                  <xsl:when test="$gCurrentView = 'text'">
                    <xsl:text>Text View is the current view</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>Text View</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:attribute name="class">
                <xsl:text>tracked interactive </xsl:text>
                <xsl:text>PTbutton </xsl:text>
                <xsl:if test="$gCurrentView = 'text'">
                  <xsl:text>PTbuttonActive</xsl:text>
                </xsl:if>
                <xsl:if test="$gHasOcr='NO'">
                  <xsl:text>PTbuttonDisabled</xsl:text>
                </xsl:if>
              </xsl:attribute>
              <img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" alt="" />
              <span>Plain Text</span>
              <img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" alt="" />
            </xsl:element>
          </li> -->
        </ul>
      </li>
    </script>
  </xsl:template>
  
  <xsl:template name="build-zoomout-button">
    <xsl:variable name="zoom" select="//ResizeForm/ResizeValuesSelect/Option[following-sibling::Option[Focus='true']][last()]" />
    <xsl:choose>
      <xsl:when test="$zoom">
        <xsl:element name="a">
          <xsl:attribute name="id"><xsl:text>mdpZoomOut</xsl:text></xsl:attribute>
          <xsl:attribute name="class">tracked interactive zoomAction </xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Zoom Out</xsl:attribute>
          <xsl:attribute name="title"><xsl:text>Zoom Out: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:call-template name="build-zoom-href">
              <xsl:with-param name="size" select="$zoom/Value" />
            </xsl:call-template>
          </xsl:attribute>
          <img src="//common-web/graphics/harmony/icon_zoomout.png" height="25" width="25" alt="Zoom Out: {$zoom/Value}%" />
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <img src="//common-web/graphics/harmony/icon_zoomout_grayed.png" height="25" width="25" alt="(At Minimum Zoom)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-zoomin-button">
    <xsl:variable name="zoom" select="//ResizeForm/ResizeValuesSelect/Option[preceding-sibling::Option[Focus='true']]" />
    <xsl:choose>
      <xsl:when test="$zoom">
        <xsl:element name="a">
          <xsl:attribute name="id"><xsl:text>mdpZoomIn</xsl:text></xsl:attribute>
          <xsl:attribute name="class">tracked interactive zoomAction </xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Zoom In</xsl:attribute>
          <xsl:attribute name="title"><xsl:text>Zoom In: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text></xsl:attribute>
          <xsl:attribute name="href">
            <xsl:call-template name="build-zoom-href">
              <xsl:with-param name="size" select="$zoom/Value" />
            </xsl:call-template>
          </xsl:attribute>
          <img src="//common-web/graphics/harmony/icon_zoomin.png" height="25" width="25" alt="Zoom In: {$zoom/Value}%" />
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <img src="//common-web/graphics/harmony/icon_zoomin_grayed.png" height="25" width="25" alt="(At Maximum Zoom)" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-zoom-href">
    <xsl:param name="size" />
    
    <xsl:variable name="id" select="//CurrentCgi/Param[@name='id']" />
    <xsl:variable name="seq" select="//CurrentCgi/Param[@name='seq']" />
    <xsl:variable name="view" select="//CurrentCgi/Param[@name='view']" />
    <xsl:variable name="debug" select="//CurrentCgi/Param[@name='debug']" />
    
    <xsl:variable name="href">
      <xsl:value-of select="concat('/cgi/pt?id=', $id, ';seq=', $seq, ';size=', $size, ';view=', $view)" />
      <xsl:if test="normalize-space($debug)"><xsl:value-of select="concat(';debug=', $debug)" /></xsl:if>
    </xsl:variable>
    <xsl:value-of select="normalize-space($href)" />
  </xsl:template>

  <!-- Image -->
  <xsl:template name="ContentContainer">
    <div id="mdpContentContainer">
      <xsl:choose>
        <xsl:when test="$gUsingBookReader = 'true'">
          <xsl:attribute name="class"><xsl:text>hideContentContainer</xsl:text></xsl:attribute>
        </xsl:when>
        <xsl:when test="$gCurrentView = 'image'">
          <xsl:attribute name="class"><xsl:text>overflowContentContainer</xsl:text></xsl:attribute>
          <xsl:attribute name="style">
            <xsl:text>min-height: </xsl:text>
            <xsl:value-of select="$gMinImageHeight" />
            <xsl:text>px</xsl:text>
          </xsl:attribute>
        </xsl:when>
        <xsl:otherwise/>
      </xsl:choose>

      <!-- Error message set from addItemToCollection javascript -->
      <div id="errormsg">
        <div class="bd"></div>
      </div>

      <xsl:element name="a">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:attribute name="name">SkipToBookText</xsl:attribute>
      </xsl:element>
      <h2 class="SkipLink">Text or image of individual page (use access key 5 to switch to full text / OCR mode)</h2>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pCurrentPageImageSource" select="$gCurrentPageImageSource"/>
        <xsl:with-param name="pCurrentPageOcr" select="$gCurrentPageOcr"/>
        <xsl:with-param name="pAccessStatus" select="$gFinalAccessStatus"/>
      </xsl:call-template>
    </div>


  </xsl:template>
  
  <xsl:template name="build-toolbar-nav">
    <xsl:param name="target" select="'header'" />
    <div class="mdpToolbarNav">
      <xsl:if test="$target = 'header'">
        <xsl:attribute name="id">mdpToolbarNav</xsl:attribute>
      </xsl:if>
      <form action="pt" method="GET" class="mdpSectionForm">
        <xsl:if test="$target = 'header'">
          <xsl:attribute name="id">mdpSectionForm</xsl:attribute>
        </xsl:if>
        <ul class="mdpSectionOptions">
          <xsl:if test="$gFeatureList/Feature">
            <xsl:call-template name="BuildContentsList">
              <xsl:with-param name="target" select="$target" />
            </xsl:call-template>
          </xsl:if>
        </ul>
      </form>
      <xsl:call-template name="BuildPageLinks">
        <xsl:with-param name="pPageLinks" select="//MdpApp/PageLinks"/>
        <xsl:with-param name="target" select="$target" />
      </xsl:call-template>
      <ul class="mdpPageWidgets">
        <xsl:if test="$target = 'header'">
          <xsl:attribute name="id">mdpPageWidgets</xsl:attribute>
        </xsl:if>
        <xsl:if test="$gFinalView != 'plaintext'">
        <li class="PTiconButton">
          <xsl:call-template name="build-zoomout-button">
            <xsl:with-param name="target" select="$target" />
          </xsl:call-template>
        </li>
        <li class="PTiconButton">
          <xsl:call-template name="build-zoomin-button">
            <xsl:with-param name="target" select="$target" />
          </xsl:call-template>
        </li>
        <li class="paddingLeftRight">&#160;</li>
        <li class="PTiconButton">
          <xsl:variable name="href" select="/MBooksTop/MdpApp/RotateLinks/CounterClockwiseLink" />
          <a href="{$href}" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Left" data-tracking-category="PT" title="Rotate Left">
            <xsl:if test="$target = 'header'">
              <xsl:attribute name="id">rotate-counterclockwise</xsl:attribute>
            </xsl:if>
            <img alt="" src="//common-web/graphics/harmony/icon_rotate_counterclockwise.png" height="25" width="25" />
          </a>
        </li>
        <li class="PTiconButton">
          <xsl:variable name="href" select="/MBooksTop/MdpApp/RotateLinks/ClockwiseLink" />
          <a href="{$href}" class="rotateAction tracked interactive" data-tracking-action="PT Rotate Right" data-tracking-category="PT" title="Rotate Right">
            <xsl:if test="$target = 'header'">
              <xsl:attribute name="id">rotate-clockwise</xsl:attribute>
            </xsl:if>
            <img alt="" src="//common-web/graphics/harmony/icon_rotate_clockwise.png" height="25" width="25" />
          </a>
        </li>

        </xsl:if>
      </ul>
                  
    </div>
  </xsl:template>

  <!-- CONTROL: Contents List -->
  
  <xsl:template name="BuildContentsList">
    <xsl:param name="target" select="'header'" />
    <xsl:variable name="formId">
      <xsl:choose>
        <xsl:when test="$target = 'header'">mdpJumpToSection</xsl:when>
        <xsl:otherwise>mdpJumpToSectionFooter</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <label for="{$formId}" class="SkipLink">Jump to a section</label>
    <select id="{$formId}" size="1" name="seq">
      <option value="" alt="">Jump to Section</option>
      <xsl:for-each select="$gFeatureList/Feature">
        <xsl:element name="option">
          <xsl:attribute name="value">
            <xsl:value-of select="Seq" />
          </xsl:attribute>
          <xsl:attribute name="rel">
            <xsl:value-of select="Link" />
          </xsl:attribute>
          <xsl:attribute name="title">
            <xsl:value-of select="Label" />
            <xsl:if test="Page!=''">
              <xsl:text> on page number </xsl:text>
              <xsl:value-of select="Page"/>
            </xsl:if>
          </xsl:attribute>
          <xsl:value-of select="Label" />
          <xsl:if test="normalize-space(Page)">
            <xsl:text> - </xsl:text>
            <xsl:value-of select="Page" />
          </xsl:if>
        </xsl:element>
      </xsl:for-each>
    </select>
    <input type="submit" value="Go">
      <xsl:if test="$target = 'header'">
        <xsl:attribute name="id">mdpJumpToSectionSubmit</xsl:attribute>
      </xsl:if>
      <xsl:attribute name="class">tracked interactive </xsl:attribute>
      <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
      <xsl:attribute name="data-tracking-action">PT Jump to Section</xsl:attribute>
    </input>
    
    <xsl:for-each select="//CurrentCgi/Param">
      <xsl:choose>
        <xsl:when test="@name != 'num' and @name != 'seq'">
          <input type="hidden" name="{@name}" value="{.}" />
        </xsl:when>
        <xsl:otherwise />
      </xsl:choose>
    </xsl:for-each>
    
  </xsl:template>
  
  <xsl:template name="OldBuildContentsList">
    <xsl:param name="defaultFoldPosition" select="20" />
    <xsl:variable name="foldPosition">
      <xsl:choose>
        <xsl:when test="/MBooksTop/MBooksGlobals/SSDSession='true'">
          <!-- Do not fold for ssd; it hides some content -->
          <xsl:value-of select="9999"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$defaultFoldPosition"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:element name="table">
      <xsl:attribute name="summary">This table links to the Table of Contents links for this book</xsl:attribute>
      <tbody>
        <tr id="mdpFeatureListTitle">
          <th scope="col"><a name="contents"></a>Contents:&#xA0;&#xA0;</th>
          <th scope="col" class="SkipLink">page number</th>
        </tr>

        <xsl:for-each select="$gFeatureList/Feature">
          <xsl:element name="tr">
            <xsl:choose>
              <xsl:when test="position() &gt; $foldPosition">
                <xsl:attribute name="class">mdpFeatureListItem mdpFlexible_3_1</xsl:attribute>
              </xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="class">mdpFeatureListItem</xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>
            <td>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="Link"/>
                </xsl:attribute>
                <xsl:attribute name="class">mdpContentsLink</xsl:attribute>
                <xsl:value-of select="Label"/>
                <xsl:if test="Page!=''">
                  <xsl:element name="span">
                    <xsl:attribute name="class">SkipLink</xsl:attribute>
                    <xsl:text> on page number </xsl:text>
                    <xsl:value-of select="Page"/>
                  </xsl:element>
                </xsl:if>
              </xsl:element>
            </td>
            <td class="mdpContentsPageNumber">
              <xsl:if test="/MBooksTop/MBooksGlobals/SSDSession='false'">
                <!-- Do not repeat the page number already emitted CSS -->
                <!-- invisibly above for screen readers                -->
                <xsl:value-of select="Page"/>
              </xsl:if>
            </td>
          </xsl:element>
        </xsl:for-each>

        <xsl:if test="count($gFeatureList/*) &gt; $foldPosition">
          <xsl:element name="tr">
            <xsl:attribute name="class">mdpFeatureListItem</xsl:attribute>
            <td>&#xA0;</td>
            <td>
              <xsl:element name="a">
                <xsl:attribute name="id">mdpFlexible_3_2</xsl:attribute>
                <xsl:attribute name="class">mdpFlexible</xsl:attribute>
                <xsl:attribute name="href"><xsl:value-of select="'#contents'"/></xsl:attribute>
                <xsl:attribute name="onclick">
                  <xsl:value-of select="'javascript:ToggleContentListSize();'"/>
                </xsl:attribute>
                <xsl:attribute name="onkeypress">
                  <xsl:value-of select="'javascript:ToggleContentListSize();'"/>
                </xsl:attribute>
                <xsl:text>&#x00AB; less</xsl:text>
              </xsl:element>
            </td>
          </xsl:element>
        </xsl:if>

      </tbody>
    </xsl:element>

  </xsl:template>


  <!-- CONTROL: Page Links -->
  <xsl:template name="BuildPageLinks">
    <xsl:param name="pPageLinks"/>
    <xsl:param name="target" select="'header'" />
    <ul class="mdpPageOptions">
      <xsl:if test="$target = 'header'">
        <xsl:attribute name="id">mdpPageOptions</xsl:attribute>
      </xsl:if>
      
      
      <xsl:if test="$gCurrentReaderMode = 'full'">
      
      <li>
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
        <form method="GET" action="pt" class="mdpPageForm">
          <xsl:if test="$target = 'header'">
            <xsl:attribute name="id">mdpPageForm</xsl:attribute>
          </xsl:if>
          
          <xsl:variable name="jumpToId">
            <xsl:choose>
              <xsl:when test="$target = 'header'">BRpagenum</xsl:when>
              <xsl:otherwise>BRPagenumFooter</xsl:otherwise>
            </xsl:choose>
          </xsl:variable>
          
          <input type="hidden" name="u" id="u" value="1" />
          
          <label for="{$jumpToId}">Jump to </label>

          <xsl:element name="input">
            <xsl:attribute name="id"><xsl:value-of select="$jumpToId" /></xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="size">8</xsl:attribute>
            <xsl:attribute name="name">num</xsl:attribute>
            <xsl:attribute name="alt">Page Number</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="$pageNum"/>
            </xsl:attribute>
          </xsl:element>

          <xsl:element name="input">
            <xsl:attribute name="class">mdpGotoButton</xsl:attribute>
            <xsl:if test="$target = 'header'">
              <xsl:attribute name="id">mdpGotoButton</xsl:attribute>
            </xsl:if>
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
          
        </form>
        
      </li>
      
      </xsl:if>
      
      <li class="PTiconButton">
        <xsl:choose>
          <xsl:when test="$pPageLinks/FirstPageLink">
            <xsl:element name="a">
              <xsl:attribute name="class">mdpFirstPageLink</xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpFirstPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT First Page</xsl:attribute>
              <xsl:attribute name="title">First [f]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/FirstPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">f</xsl:attribute>
              </xsl:if>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_first.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">First (at start of book)</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_first_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
      <li class="PTiconButton">
        <xsl:choose>
          <xsl:when test="$pPageLinks/PreviousPageLink">
            <xsl:element name="a">
              <xsl:attribute name="class">mdpPreviousPageLink</xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpPreviousPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Previous Page</xsl:attribute>
              <xsl:attribute name="title">Previous [p]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">p</xsl:attribute>
              </xsl:if>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_previous.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Previous (at start of book)</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_previous_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
      <li class="PTiconButton">
        <xsl:choose>
          <xsl:when test="$pPageLinks/NextPageLink">
            <xsl:element name="a">
              <xsl:attribute name="class">mdpNextPageLink</xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpNextPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Next Page</xsl:attribute>
              <xsl:attribute name="title">Next [n]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">n</xsl:attribute>
              </xsl:if>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Next (at end of book)</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
      <li class="PTiconButton">
        <xsl:choose>
          <xsl:when test="$pPageLinks/LastPageLink">
            <xsl:element name="a">
              <xsl:attribute name="class">mdpLastPageLink</xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpLastPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Last Page</xsl:attribute>
              <xsl:attribute name="title">Last [l]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/LastPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">l</xsl:attribute>
              </xsl:if>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:text>//common-web/graphics/harmony/icon_last.png</xsl:text>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Last (at end of book)</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:text>//common-web/graphics/harmony/icon_last_grayed.png</xsl:text>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
    </ul>

  </xsl:template>

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
          <div>
              <img src="//common-web/graphics/LimitedSample.png" alt="" class="imgFloat"/>
              <p>What you <strong>CAN</strong> do:
                <ul>
                  <li>Use the "Search in this text" search box above to find frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, or when working with a book that does not have an index.</li>
                  <li>Click the "Find in a library" link to find this item in a library near you.</li>
                </ul>
              </p>
              (<a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">More information</a>)
            </div>
        </xsl:element>
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
        </xsl:element>
      </xsl:when>
      
      <xsl:otherwise>
        <div id="BookReader"></div>
      </xsl:otherwise>
      
    </xsl:choose>
  </xsl:template>

  <!-- -->
  <xsl:template match="CurrentPageOcr">
    <!-- handle Highlight element children in the OCR -->
    <xsl:apply-templates/>
  </xsl:template>

  <!-- FORM: Page X of Y -->
  <xsl:template name="BuildPageXofYForm">
    <xsl:param name="pPageXofYForm"/>
    <xsl:param name="pPageXofYFormId"/>
    <xsl:param name="pPageXofYId"/>
    
    <xsl:element name="form">
      <xsl:attribute name="onsubmit">
        <xsl:value-of select="'return FormValidation(this.num, &quot;Please enter a page number in the box.&quot;)'"/>
      </xsl:attribute>
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>
      <xsl:attribute name="id">
        <xsl:value-of select="$pPageXofYId"/>
      </xsl:attribute>
      
      <ul>
        <li class="asearchform">
          <xsl:apply-templates select="$pPageXofYForm/HiddenVars"/>
          
          <!-- this hidden variable exists to differentiate page
               numbers entered by users via form submission where it is
               possible for them to enter an incorrect number and page
               numbers on links the middleware builds which will always
               correspond, if present, to a physical page. -->
          <input type="hidden" name="u" id="u" value="1"/>
          
          <xsl:element name="input">
            <xsl:attribute name="class">mdpGotoButton</xsl:attribute>
            <xsl:attribute name="type">submit</xsl:attribute>
            <xsl:attribute name="value">go to</xsl:attribute>
            <xsl:attribute name="title">Jump to this sequential page in the text</xsl:attribute>
            <xsl:attribute name="alt">Jump to this sequential page in the text</xsl:attribute>
          </xsl:element>
          
          <xsl:element name="label">
            <xsl:attribute name="for">
              <xsl:value-of select="$pPageXofYFormId"/>
            </xsl:attribute>
            <xsl:attribute name="class">SkipLink</xsl:attribute>
            <xsl:text>Enter page number to jump</xsl:text>
          </xsl:element>
          <span class="mdpNumberLabel">&#xa0;#</span>
          
          <xsl:element name="input">
            <xsl:attribute name="class">mdpPageNumberInputBox</xsl:attribute>
            <xsl:attribute name="id">
              <xsl:value-of select="$pPageXofYFormId"/>
            </xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="name">num</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="$gCurrentPageNum"/>
            </xsl:attribute>
          </xsl:element>
          <xsl:call-template name="HiddenDebug"/>
        </li>
      </ul>
    </xsl:element>
    
  </xsl:template>
  
  <!-- FORM: Image Resize -->
  <xsl:template name="BuildResizeForm">
    <xsl:param name="pResizeForm"/>

    <xsl:element name="form">
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>
      <ul>
        <li class="asearchform">
          <xsl:apply-templates select="$pResizeForm/HiddenVars"/>
          <xsl:for-each select="$pResizeForm/ResizeValuesSelect">
            <span class="sizeLabel" title="Change size">size&#xa0;</span>
            <xsl:call-template name="BuildHtmlSelect">
              <xsl:with-param name="class" select="'mdpSelectMenu'"/>
              <xsl:with-param name="key" select="'this.form.submit()'"/>
            </xsl:call-template>
          </xsl:for-each>
        </li>
      </ul>
      <xsl:call-template name="HiddenDebug"/>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>

