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
  <xsl:variable name="gCollectionList" select="/MBooksTop/MdpApp/CollectionList"/>
  <xsl:variable name="gCollectionForm" select="/MBooksTop/MdpApp/AddToCollectionForm"/>
  <xsl:variable name="gFullPdfAccess" select="/MBooksTop/MdpApp/AllowFullPDF"/>
  <xsl:variable name="gFullPdfAccessMessage" select="/MBooksTop/MdpApp/FullPDFAccessMessage"/>
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  
  <xsl:variable name="gFinalView">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'">
        <xsl:value-of select="'restricted'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="contains($gCurrentPageFeatures,'MISSING_PAGE')">
            <xsl:value-of select="'missing'"/>
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
  
  <xsl:variable name="gCurrentView">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus != 'allow'">thumb</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <!-- <xsl:variable name="gCurrentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']"/> -->
  
  
  <xsl:variable name="gUsingBookReader">
    <xsl:choose>
      <xsl:when test="$gCurrentView = '1up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = '2up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'thumb'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'text'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:otherwise><xsl:value-of select="'false'" /></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  
  <xsl:variable name="gCurrentUi">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>classic</xsl:text>
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

  <!-- root template -->
  <!-- root template -->
  <xsl:template match="/MBooksTop">
    
    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'classic'">
        <xsl:apply-templates select="." mode="classic" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'true'">
        <xsl:apply-templates select="." mode="bookreader" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'embed'">
        <xsl:apply-templates select="." mode="embed" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="." mode="classic" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
    
  <xsl:template match="/MBooksTop" mode="classic">
    <xsl:param name="gCurrentEmbed" select="'full'" />
    <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
    <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
    <xsl:variable name="min-width">
      <xsl:choose>
        <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
          <xsl:value-of select="235 + (1100 * ( $currentSize div 100 ))" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="235 + (680 * ( $currentSize div 100 ))" />
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <xsl:if test="$gUsingBookReader = 'true'">
        <xsl:attribute name="class"><xsl:text>htmlNoOverflow</xsl:text></xsl:attribute>
      </xsl:if>
      <xsl:attribute name="gUsingBookReader"><xsl:value-of select="$gUsingBookReader" /> :: <xsl:value-of select="$gFinalView" /></xsl:attribute>
      <head>
        <title>
          <xsl:choose>
            <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
              <xsl:text>HathiTrust Digital Library - </xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>HathiTrust Digital Library -- </xsl:text>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:call-template name="GetMaybeTruncatedTitle">
            <xsl:with-param name="titleString" select="$gFullTitleString"/>
            <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
            <xsl:with-param name="maxLength" select="$gTitleTrunc"/>
          </xsl:call-template>
        </title>

        <!-- jQuery from the Google CDN -->
    		<script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:if test="$gUsingBookReader='true'">
          <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/>
        </xsl:if>
        <xsl:call-template name="load_js_and_css"/>

        <xsl:if test="$gCurrentView = 'image'">
          <style>
            html {
              min-width: <xsl:value-of select="$min-width" />px;
            }
          </style>
        </xsl:if>
        
        <xsl:call-template name="bookreader-toolbar-items" />
        
      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>
        <xsl:call-template name="header"/>

        <xsl:call-template name="BookReaderContainer" />

        <xsl:if test="$gCurrentEmbed = 'full' and $gUsingBookReader = 'true'">
          <xsl:call-template name="bookreader-page-items" />
        </xsl:if>

        <!-- Footer -->
        <xsl:if test="$gCurrentEmbed = 'full'">
          <xsl:call-template name="footer">
            <xsl:with-param name="gUsingBookReader" select="$gUsingBookReader" />
          </xsl:call-template>
        </xsl:if>
        
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

  <xsl:template match="/MBooksTop" mode="bookreader">
    <xsl:param name="gCurrentEmbed" select="'full'" />

    <html lang="en" xml:lang="en" 
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      version="XHTML+RDFa 1.0"
      >

      <head profile="http://www.w3.org/1999/xhtml/vocab">
        <!-- RDFa -->
        <xsl:call-template name="BuildRDFaLinkElement"/>
        <xsl:call-template name="common-html-head" />

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="online_assessment"/>
        <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/> 
        <link rel="stylesheet" type="text/css" href="/pt/hathi.css?ts={generate-id(.)}"/>

        <!-- jQuery and plugins -->
    		<script type="text/javascript" src="http://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
        <script type="text/javascript" src="/pt/jquery/jquery.easing.1.3.js"></script>
        <script type="text/javascript" src="/pt/jquery/jquery-textfill-0.1.js"></script>
        <script type="text/javascript" src="/pt/jquery/jgrowl/jquery.jgrowl.js"></script>
    		<script type="text/javascript" src="/pt/jquery/boxy/jquery.boxy.js" charset="utf-8"></script>
    		
    		<!-- BookReader -->
        <script type="text/javascript" src="/pt/bookreader/BookReader/BookReader.js?ts={generate-id(.)}"></script>
        <script type="text/javascript" src="/pt/bookreader/BookReader/dragscrollable.js?ts={generate-id(.)}"></script>
        <script type="text/javascript" src="/pt/js/lscache.js?ts={generate-id(.)}"></script>

        <link href="/pt/jquery/jgrowl/jquery.jgrowl.css" media="all" rel="stylesheet" type="text/css" /> 
        <link href="/pt/jquery/boxy/boxy.css" media="all" rel="stylesheet" type="text/css" /> 

      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>
        <xsl:call-template name="header"/>

        <xsl:call-template name="BookReaderContainer" />

        <!-- Footer -->
        <xsl:if test="$gCurrentEmbed = 'full'">
          <xsl:call-template name="footer"/>
        </xsl:if>
        
        <xsl:call-template name="bookreader-javascript-init" />
        
        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>
  
  <xsl:template name="bookreader-javascript-init">
    <script type="text/javascript">
      
       HT.params = {};
       <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
         HT.params.seq = <xsl:value-of select="number(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']) - 1" />;
       </xsl:if>
       HT.params.view = "<xsl:value-of select="$gCurrentView" />";
       HT.init_from_params();

       HT.reader = new HTBookReader();
       HT.reader.bookId   = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>';
       HT.reader.bookTitle = "<xsl:value-of select="str:replace(string($gFullTitleString), '&quot;', '\&quot;')"/>";
       HT.reader.reduce = 1;
       HT.reader.pageProgression = 'lr';

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
        HT.reader.ui = 'full';
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
    <script type="text/javascript" src="/pt/js/bookreader_startup.js?ts={generate-id(.)}"/> 
  </xsl:template>

  <xsl:template match="/MBooksTop" mode="embed">

    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>
          <xsl:choose>
            <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
              <xsl:text>HathiTrust Digital Library - </xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>HathiTrust Digital Library -- </xsl:text>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:call-template name="GetMaybeTruncatedTitle">
            <xsl:with-param name="titleString" select="$gFullTitleString"/>
            <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
            <xsl:with-param name="maxLength" select="$gTitleTrunc"/>
          </xsl:call-template>
        </title>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <div>
          <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
        </div>
        <xsl:call-template name="UberContainer"/>
        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="online_assessment">
    <script type="text/javascript" src="https://ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
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

  <!-- Top Level Container DIV -->
  <xsl:template name="BookReaderContainer">
    <xsl:param name="gCurrentEmbed" select="'full'" />
    
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>

    <div id="mdpUberContainer">
      <xsl:call-template name="BookReaderToolbar">
        <xsl:with-param name="pViewTypeList" select="$pViewTypeList"/>
      </xsl:call-template>
      
      <!-- Image -->
      <xsl:call-template name="ContentContainer"/>

      <xsl:if test="$gCurrentEmbed = 'full'">
        <xsl:call-template name="BookReaderSidebar" />
      </xsl:if>
    </div>

    <!-- Feedback -->
    <xsl:call-template name="Feedback"/>

    <!-- New collection overlay -->
    <div id="overlay"></div>


  </xsl:template>
  
  <xsl:template name="BookReaderSidebar">
    <div class="mdpControlContainer">
      <div class="bibLinks">
        <h2>About this Book</h2>
        <p>
          <xsl:value-of select="$gFullTitleString" />
        </p>
        <p>
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
              <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
            </xsl:attribute>
            <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
            <xsl:text>View full catalog record</xsl:text>
          </xsl:element>
        </p>
				<p class="smaller">
					Access &amp; Use: 
					<xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="$gAccessUseLink"/>
            </xsl:attribute>
            <xsl:value-of select="$gAccessUseHeader" />
          </xsl:element>
				</p>
      </div>
      
      <div class="mdpScrollableContainer">
        
        <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
        
        <div class="getLinks">
          <h2>Get this Book</h2>
          <ul>
            <li>
              <xsl:for-each select="/MBooksTop/METS:mets/METS:dmdSec/present/record/metadata/oai_marc/varfield[@id='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
                <xsl:element name="a">
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
            </li>
            
            <xsl:if test="$gPodUrl != ''">
              <li>
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:value-of select="$gPodUrl"/>
                  </xsl:attribute>
                  <xsl:if test="$gGoogleOnclickTracking = 'true'">
                    <xsl:attribute name="onclick">
                      <xsl:call-template name="PageTracker">
                        <xsl:with-param name="category" select="'outLinks'"/>
                        <xsl:with-param name="action" select="'click'"/>
                        <xsl:with-param name="label" select="'PT Buy a reprint'"/>
                      </xsl:call-template>
                    </xsl:attribute>
                  </xsl:if>
                  <xsl:text>Buy a copy</xsl:text>
                </xsl:element>
              </li>
            </xsl:if>
            
            <li>
              <xsl:element name="a">
                <xsl:attribute name="id">pagePdfLink</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
                </xsl:attribute>
                <xsl:attribute name="target">
                  <xsl:text>pdf</xsl:text>
                </xsl:attribute>
                <xsl:text>Download PDF - this page</xsl:text>
              </xsl:element>
            </li>
            
            <xsl:if test="$gFullPdfAccessMessage != 'NOT_AVAILABLE'">
              <li>
                <xsl:element name="a">
                  <xsl:attribute name="title">Download full PDF</xsl:attribute>
                  <xsl:attribute name="id">fullPdfLink</xsl:attribute>
                  <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
                  <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
                  <xsl:attribute name="href">
                    <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
                  </xsl:attribute>
                  <xsl:text>Download PDF - whole book</xsl:text>
                </xsl:element>
              
                <xsl:if test="$gFullPdfAccess = 'deny'">
                  <div id="noPdfAccess">
                    <p>
                      <xsl:choose>
                        <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                          <strong><a href="{$pViewTypeList/ViewTypeFullPdfLink}">Login</a></strong>
                          <xsl:text> to determine whether you can download this book.</xsl:text>
                        </xsl:when>
                        <xsl:when test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                          <xsl:text>You need to be affiliated with a HathiTrust Member institution to download this book.</xsl:text>
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
  							<div id="fullPdfFrame"></div>
              </li>
            </xsl:if>
         </ul>
        </div>

        <div class="collectionLinks">
          <h2>Add to Collection</h2>
          <xsl:call-template name="CollectionWidgetContainer" />
        </div>
        
        <div class="shareLinks">
          <h2>Share</h2>
          <form action="" name="urlForm" id="urlForm">
						<label class="smaller" for="permURL">Permanent link to this book</label>
            <!-- <input type="text" name="permURL_link" id="permURL" class="email-permURL" onclick="document.urlForm.permURL_link.select();" readonly="readonly = true;" value="http://hdl.handle.net/2027/mdp.39015015394847" /> -->
            <xsl:element name="input">
              <xsl:attribute name="type">text</xsl:attribute>
              <xsl:attribute name="name">permURL_link</xsl:attribute>
              <xsl:attribute name="id">permURL</xsl:attribute>
              <xsl:attribute name="class">email-permURL</xsl:attribute>
              <xsl:attribute name="onclick">javascript:document.urlForm.permURL_link.focus();</xsl:attribute>
              <xsl:attribute name="onclick">document.urlForm.permURL_link.select();
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT Perm Link'"/>
                </xsl:call-template>
              </xsl:if>
              </xsl:attribute>
              <xsl:attribute name="readonly">readonly = true;</xsl:attribute>
              <xsl:attribute name="value">
                <xsl:value-of select="$gItemHandle"/>
              </xsl:attribute>
            </xsl:element>

						<br />

						<label class="smaller" for="pageURL">Link to this page</label>

            <xsl:element name="input">
              <xsl:attribute name="type">text</xsl:attribute>
              <xsl:attribute name="name">pageURL_link</xsl:attribute>
              <xsl:attribute name="id">pageURL</xsl:attribute>
              <xsl:attribute name="class">email-permURL</xsl:attribute>
              <xsl:attribute name="onclick">javascript:document.urlForm.pageURL_link.focus();</xsl:attribute>
              <xsl:attribute name="onclick">document.urlForm.pageURL_link.select();
              <xsl:if test="$gGoogleOnclickTracking = 'true'">
                <xsl:call-template name="PageTracker">
                  <xsl:with-param name="label" select="'PT Page URL Link'"/>
                </xsl:call-template>
              </xsl:if>
              </xsl:attribute>
              <xsl:attribute name="readonly">readonly = true;</xsl:attribute>
              <xsl:attribute name="value">
                <xsl:text>http://</xsl:text>
                <xsl:value-of select="//HttpHost" />
                <xsl:value-of select="//PageLink"/>
              </xsl:attribute>
            </xsl:element>

          </form>
        </div>

      </div> <!-- scrollable -->
      
    </div>
  </xsl:template>
  
  <xsl:template name="BookReaderToolbar">
    <xsl:param name="pViewTypeList"/>

    <xsl:variable name="CurrentUrl" select="string(/MBooksTop/MBooksGlobals/CurrentUrl)" />
    <xsl:variable name="BookReaderURL">
      <xsl:choose>
        <xsl:when test="contains($CurrentUrl, 'ui=classic')">
          <xsl:value-of select="str:replace($CurrentUrl, 'ui=classic', 'ui=bookreader')" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$CurrentUrl" /><xsl:text>;ui=bookreader</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <!-- <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
        <xsl:text>#page/</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
      </xsl:if> -->
    </xsl:variable>

		<div id="mdpToolbar">
		  <xsl:if test="$gFinalAccessStatus != 'allowed' and contains(//CurrentCgi/Param[@name='debug'], 'hide')">
		    <xsl:attribute name="style"><xsl:text>display: none</xsl:text></xsl:attribute>
		  </xsl:if>
			
			<div id="mdpToolbarViews">
				<ul>
					<li>
					  <xsl:element name="a">
					    <xsl:attribute name="id"><xsl:text>btnClassicView</xsl:text></xsl:attribute>
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
					      <xsl:text>PTbutton </xsl:text>
  					    <xsl:if test="$gCurrentView = 'image'">
  					      <xsl:text>PTbuttonActive</xsl:text>
  					    </xsl:if>
  					  </xsl:attribute>
							<img src="//common-web/graphics/harmony/icon_classicview.png">
							  <xsl:attribute name="alt">
							    <xsl:text>Classic View</xsl:text>
							  </xsl:attribute>
  					    <xsl:attribute name="title"><xsl:text>Classic View</xsl:text></xsl:attribute>
							</img>
							<span>Classic View</span>
					  </xsl:element>
					</li>
					<li>
					  <xsl:element name="a">
					    <xsl:attribute name="id"><xsl:text>btnClassicText</xsl:text></xsl:attribute>
					    <xsl:attribute name="href">
					      <xsl:value-of select="$pViewTypeList/ViewTypeSimpleTextLink"/>
					    </xsl:attribute>
					    <xsl:attribute name="class">
					      <xsl:text>PTbutton </xsl:text>
  					    <xsl:if test="$gCurrentView = 'plaintext'">
  					      <xsl:text>PTbuttonActive</xsl:text>
  					    </xsl:if>
  					  </xsl:attribute>
							<img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" />
							<span>Plain Text</span>
							<img src="//common-web/graphics/harmony/1x1.png" height="25" width="1" />
					  </xsl:element>
					</li>
				</ul>
			</div>
			<div id="mdpToolbarNav">
			  <form action="/cgi/pt" method="GET" id="mdpSectionForm">
  				<ul id="mdpSectionOptions">
            <xsl:if test="$gFeatureList/Feature">
              <xsl:call-template name="BuildContentsList"/>
            </xsl:if>
  				</ul>
  			</form>
				<ul id="mdpZoomOptions">
					<li class="PTiconButton">
						<xsl:call-template name="build-zoomout-button" />
					</li>
					<li>
						<span id="mdpZoomStatus"><xsl:value-of select="//ResizeForm/ResizeValuesSelect/Option[Focus='true']/Label" /></span>
					</li>
					<li class="PTiconButton">
						<xsl:call-template name="build-zoomin-button" />
					</li>
				</ul>

				<xsl:call-template name="BuildPageLinks">
          <xsl:with-param name="pPageLinks" select="//MdpApp/PageLinks"/>
        </xsl:call-template>
			</div>
		</div>
  </xsl:template>
  
  <xsl:template name="bookreader-page-items">
    <div id="BRpageControls">
      <div>
        <label>Print</label>
        <a href="#" id="print-page" class="printAction" target="pdf"><img alt="Print Page" src="//common-web/graphics/harmony/icon_printer.png" height="25" width="25" /></a>
      </div>
      <div>
        <label>Rotate</label>
        <a href="#" id="rotate-left" class="rotateAction"><img alt="Rotate Left" src="//common-web/graphics/harmony/icon_rotate_counterclockwise.png" height="25" width="25" /></a>
        <a href="#" id="rotate-right" class="rotateAction"><img alt="Rotate Right" src="//common-web/graphics/harmony/icon_rotate_clockwise.png" height="25" width="25" /></a>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="bookreader-toolbar-items">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <script id="bookreader-toolbar-items" type="text/x-jquery-tmpl">
      <li>
				<ul id="mdpBookReaderViews">
					<li>
						<img id="mdpNewStarburst" src="//common-web/graphics/harmony/NewStarburst.png" height="44" width="40" />
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
						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
					    <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewType1UpLink"/>
					    </xsl:attribute>
					    <xsl:attribute name="class">
					      <xsl:text>PTbutton </xsl:text>
  					    <xsl:if test="$gCurrentView = '1up'">
  					      <xsl:text>PTbuttonActive</xsl:text>
  					    </xsl:if>
  					  </xsl:attribute>
							<img src="//common-web/graphics/harmony/icon_scroll.png">
							  <xsl:attribute name="alt">
							    <xsl:text>Scroll View</xsl:text>
							  </xsl:attribute>
  						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
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
						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
					    <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewType2UpLink"/>
					    </xsl:attribute>
					    <xsl:attribute name="class">
					      <xsl:text>PTbutton </xsl:text>
  					    <xsl:if test="$gCurrentView = '2up'">
  					      <xsl:text>PTbuttonActive</xsl:text>
  					    </xsl:if>
  					  </xsl:attribute>
							<img src="//common-web/graphics/harmony/icon_flip_25.png">
							  <xsl:attribute name="alt">
							    <xsl:text>Flip View</xsl:text>
							  </xsl:attribute>
  						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
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
						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
					    <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewTypeThumbnailLink"/>
					    </xsl:attribute>
					    <xsl:attribute name="class">
					      <xsl:text>PTbutton </xsl:text>
  					    <xsl:if test="$gCurrentView = 'thumb'">
  					      <xsl:text>PTbuttonActive</xsl:text>
  					    </xsl:if>
  					  </xsl:attribute>
							<img src="//common-web/graphics/harmony/icon_thumbnails.png">
							  <xsl:attribute name="alt">
							    <xsl:text>Thumbnail View</xsl:text>
							  </xsl:attribute>
  						  <xsl:attribute name="title"><xsl:value-of select="$title" /></xsl:attribute>
							</img>
							<span>Thumbnails</span>
					  </xsl:element>
					</li>
					<li>
					  <xsl:element name="a">
					    <xsl:attribute name="id"><xsl:text>btnBookReaderText</xsl:text></xsl:attribute>
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
					</li>
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
      <xsl:value-of select="concat('/cgi/pt?id=', $id, ';ui=classic;seq=', $seq, ';size=', $size, ';view=', $view)" />
      <xsl:if test="normalize-space($debug)"><xsl:value-of select="concat(';debug=', $debug)" /></xsl:if>
    </xsl:variable>
    <xsl:value-of select="normalize-space($href)" />
  </xsl:template>
  
  <xsl:template name="build-bookreader-href">
    <xsl:param name="mode" />
    
    <xsl:variable name="id" select="//CurrentCgi/Param[@name='id']" />
    <xsl:variable name="seq" select="//CurrentCgi/Param[@name='seq']" />
    
    <xsl:variable name="href">
      <xsl:value-of select="concat('/cgi/pt?id=', $id, ';ui=bookreader;seq=', $seq, '#mode/', $mode)" />
    </xsl:variable>
    <xsl:value-of select="normalize-space($href)" />
  </xsl:template>
  
  <!-- Backward Navigation -->
  <xsl:template name="BackwardNavigation">
    <div id="PTbacknav">
      <xsl:variable name="back_nav_text">
        <xsl:choose>
          <xsl:when test="$gBackNavLinkType='from_item_list'">
            <xsl:variable name="coll_name" select="/MBooksTop/MdpApp/BackNavInfo/CollName"/>
            <xsl:value-of select="concat('Back to &quot;', $coll_name, '&quot; Collection')"/>
          </xsl:when>
          <xsl:when test="$gBackNavLinkType='from_result_list'">
            <xsl:value-of select="'Back to Collection Search Results'"/>
          </xsl:when>
          <xsl:when test="$gBackNavLinkType='undefined'">
            <xsl:value-of select="'undefined'"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="'undefined'"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <xsl:if test="$back_nav_text!='undefined'">
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:value-of select="$gBackNavLinkHref"/>
          </xsl:attribute>
          <xsl:value-of select="$back_nav_text"/>
        </xsl:element>
      </xsl:if>
    </div>
  </xsl:template>


  <!-- Collection Widget -->
  <xsl:template name="CollectionWidgetContainer">

    <!-- <xsl:call-template name="hathiVuFind"/> -->

    <div id="PTcollection">
      <h3 class="SkipLink">Collection Lists</h3>

      <xsl:variable name="collection_list_label">
        <xsl:choose>
          <xsl:when test="$gLoggedIn='YES'">
            <xsl:choose>
              <xsl:when test="$gCollectionList/Coll">
                <xsl:text>This item is in your collection(s):</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <xsl:text>This item is not in any of your collections</xsl:text>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="class">PTloginLinkText</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="/MBooksTop/MdpApp/LoginLink"/>
              </xsl:attribute>
              <xsl:text>Login</xsl:text>
            </xsl:element>
            <xsl:text> to make your personal collections permanent</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <span id="PTitemInCollLabel" class="PTcollectionlabel">
        <xsl:copy-of select="$collection_list_label"/>
      </span>

      <ul id="PTcollectionList">
        <xsl:choose>
          <xsl:when test="$gCollectionList/Coll">
            <xsl:for-each select="$gCollectionList/Coll">
              <li>
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:value-of select="Url"/>
                  </xsl:attribute>
                  <xsl:value-of select="CollName"/>
                </xsl:element>
              </li>
            </xsl:for-each>
          </xsl:when>
          <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
      </ul>

      <h3 class="SkipLink">Add to a Collection</h3>

      <xsl:call-template name="BuildAddToCollectionControl"/>

      <!-- add COinS -->
      <xsl:for-each select="$gMdpMetadata">
        <xsl:call-template name="marc2coins" />
      </xsl:for-each>

    </div>
  </xsl:template>

  <!-- FORM: Add To Collection Form -->
  <xsl:template name="BuildAddToCollectionControl">
    <div class="ptSelectBox">
      <label for="PTaddItemSelect" class="SkipLink"><xsl:text>Add to your collection:</xsl:text></label>
      <!-- for-each just for context: there's only one -->
      <xsl:for-each select="$gCollectionForm/CollectionSelect">
        <xsl:call-template name="BuildHtmlSelect">
          <xsl:with-param name="id" select="'PTaddItemSelect'"/>
          <xsl:with-param name="class" select="'mdpColSelectMenu'"/>
        </xsl:call-template>
      </xsl:for-each>
      <br />
      <button id="PTaddItemBtn">Add</button>

    </div>
  </xsl:template>


  <!-- Control Container -->
  <xsl:template name="ControlContainer">

    <xsl:variable name="CurrentUrl" select="string(/MBooksTop/MBooksGlobals/CurrentUrl)" />
    <xsl:variable name="BookReaderURL">
      <xsl:choose>
        <xsl:when test="contains($CurrentUrl, 'ui=classic')">
          <xsl:value-of select="str:replace($CurrentUrl, 'ui=classic', 'ui=bookreader')" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="$CurrentUrl" /><xsl:text>;ui=bookreader</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <!-- <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
        <xsl:text>#page/</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
      </xsl:if> -->
    </xsl:variable>
    <div class="mdpControlContainer">
      
      <style>
        
        .uiSwitchNote {
          padding: 8px;
          padding-bottom: 4px;
          margin-botom: 4px;
          border: 1px solid #C96806;
          background-color: #ef7a06;
        }

        .uiSwitchNote a {
          color: black;
          font-weight: bold;
        }

        .uiSwitchLink {
          font-size: 80%;
        }
        
      </style>

      <div class="uiSwitchNote">
        <p>
          You are using the <strong>Classic</strong> interface.
        </p>
        <p class="uiSwitchLink">
          Switch to the <a title="Switch to BookReader UI" href="{$BookReaderURL}">Book Reader interface</a>.
        </p>
      </div>

      <xsl:choose>
        <xsl:when test="/MBooksTop/MBooksGlobals/MetadataFailure='true'">
          <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
            <div id="PTcollectionUnavail">
              <span class="PTcollectionlabel">Sorry, the personal collection function is not available for this item</span>
            </div>
          </xsl:if>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="CollectionWidgetContainer"/>
        </xsl:otherwise>
      </xsl:choose>

      <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
        <xsl:element name="a">
          <xsl:attribute name="class">SkipLink</xsl:attribute>
          <xsl:attribute name="name">SkipToBookNav</xsl:attribute>
        </xsl:element>

        <h3 class="SkipLink">Page through book, skip to page, and switch view mode to image, text, or pdf</h3>
        <ul id="PageNav">

          <li>
            <!-- First/Next/Previous/Last Links -->
            <div class="mdpPageLinks">
              <xsl:call-template name="BuildPageLinks">
                <xsl:with-param name="pPageLinks" select="MdpApp/PageLinks"/>
              </xsl:call-template>
            </div>
          </li>

          <li>
            <!-- Page X of Y -->
            <div class="mdpPageXofY">
              <xsl:call-template name="BuildPageXofYForm">
                <xsl:with-param name="pPageXofYForm" select="MdpApp/PageXOfYForm"/>
                <xsl:with-param name="pPageXofYFormId" select="'PageNumberJump_1'"/>
                <xsl:with-param name="pPageXofYId" select="'PageNumberJump_1_Form'"/>
              </xsl:call-template>
            </div>
          </li>

          <xsl:if test="$gViewIsResizable='true'">
            <li>
              <!-- Resize & Rotate -->
              <xsl:if test="$gCurrentView='image'">
                <div class="mdpItemResize">
                  <xsl:call-template name="BuildResizeForm">
                    <xsl:with-param name="pResizeForm" select="MdpApp/ResizeForm"/>
                  </xsl:call-template>
                </div>
                <div class="mdpItemRotate">
                  <xsl:call-template name="BuildItemRotateLinks">
                    <xsl:with-param name="pRotateLinks" select="MdpApp/RotateLinks"/>
                  </xsl:call-template>
                </div>
              </xsl:if>
            </li>
          </xsl:if>

          <xsl:if test="$gShowViewTypes='true'">
            <li>
              <!-- View type LIST-->
              <div class="mdpViewTypeList">
                <xsl:call-template name="BuildItemViewLinks">
                  <xsl:with-param name="pViewTypeList" select="MdpApp/ViewTypeLinks"/>
                </xsl:call-template>
              </div>
            </li>
          </xsl:if>

          <li>
            <!-- Contents LIST-->
            <div id="mdpContentsList">
              <xsl:if test="$gFeatureList/Feature">
                <xsl:call-template name="BuildContentsList"/>
              </xsl:if>
            </div>
          </li>
        </ul>
      </xsl:if>

    </div>
  </xsl:template>

  <!-- Control Container -->
  <xsl:template name="BookReaderControlContainer">

    <div class="mdpControlContainer">
      
      <div class="uiSwitchNote">
        <p>
          You are using the <strong>Book Reader</strong> interface.
        </p>
        <p class="uiSwitchLink">
          Switch to the <a id="uiSwitchLink" title="Switch to Classic UI" href="{str:replace(string(/MBooksTop/MBooksGlobals/CurrentUrl), 'ui=bookreader', 'ui=classic')}">Classic interface</a>.
        </p>
      </div>
      
      <xsl:choose>
        <xsl:when test="/MBooksTop/MBooksGlobals/MetadataFailure='true'">
          <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
            <div id="PTcollectionUnavail">
              <span class="PTcollectionlabel">Sorry, the personal collection function is not available for this item</span>
            </div>
          </xsl:if>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="CollectionWidgetContainer"/>
        </xsl:otherwise>
      </xsl:choose>

      <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
        <xsl:element name="a">
          <xsl:attribute name="class">SkipLink</xsl:attribute>
          <xsl:attribute name="name">SkipToBookNav</xsl:attribute>
        </xsl:element>

        <h3 class="SkipLink">Page through book, skip to page, and switch view mode to image, text, or pdf</h3>
        <ul id="PageNav">

          <xsl:if test="$gShowViewTypes='true'">
            <li>
              <!-- View type LIST-->
              <div class="mdpViewTypeList">
                <ul>
                  <xsl:call-template name="BuildPdfViewLinks">
                    <xsl:with-param name="pViewTypeList" select="MdpApp/ViewTypeLinks"/>
                  </xsl:call-template>
                </ul>
              </div>
            </li>
          </xsl:if>

          <li>
            <!-- Contents LIST-->
            <div id="mdpContentsList">
              <xsl:if test="$gFeatureList/Feature">
                <xsl:call-template name="BuildContentsList">
                  <xsl:with-param name="defaultFoldPosition" select="9999" />
                </xsl:call-template>
              </xsl:if>
            </div>
          </li>
        </ul>
      </xsl:if>

    </div>
  </xsl:template>

  <!-- Image -->
  <xsl:template name="ContentContainer">
    <div id="mdpContentContainer">
      <xsl:if test="$gUsingBookReader = 'true'">
        <xsl:attribute name="class"><xsl:text>hideContentContainer</xsl:text></xsl:attribute>
      </xsl:if>

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

  <!-- Control Container Bottom -->
  <xsl:template name="ControlContainerBottom">

    <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
      <div class="mdpControlContainerBottom">
        <ul id="BottomNav">
          <li>
            <!-- First/Next/Previous/Last Links -->
            <div class="mdpPageLinksBottom">
              <xsl:call-template name="BuildPageLinksBottom">
                <xsl:with-param name="pPageLinks" select="MdpApp/PageLinks"/>
              </xsl:call-template>
            </div>
          </li>

          <li>
            <!-- Page X of Y -->
            <div class="mdpPageXofYBottom">
              <xsl:call-template name="BuildPageXofYForm">
                <xsl:with-param name="pPageXofYForm" select="MdpApp/PageXOfYForm"/>
                <xsl:with-param name="pPageXofYFormId" select="'PageNumberJump_2'"/>
                <xsl:with-param name="pPageXofYId" select="'PageNumberJump_2_Form'"/>
              </xsl:call-template>
            </div>
          </li>

          <xsl:if test="$gViewIsResizable='true'">
            <li>
              <!-- Resize & Rotate -->
              <xsl:if test="$gCurrentView='image'">
                <div class="mdpItemResizeBottom">
                  <xsl:call-template name="BuildResizeForm">
                    <xsl:with-param name="pResizeForm" select="MdpApp/ResizeForm"/>
                  </xsl:call-template>
                </div>
                <div class="mdpItemRotateBottom">
                  <xsl:call-template name="BuildItemRotateLinksBottom">
                    <xsl:with-param name="pRotateLinks" select="MdpApp/RotateLinks"/>
                  </xsl:call-template>
                </div>
              </xsl:if>
            </li>
          </xsl:if>

          <xsl:if test="$gShowViewTypes='true'">
            <li>
              <!-- View type -->
              <div class="mdpViewType">
                <xsl:call-template name="BuildViewTypeForm">
                  <xsl:with-param name="pViewTypeForm" select="MdpApp/ViewTypeForm"/>
                </xsl:call-template>
              </div>
            </li>
          </xsl:if>

        </ul>
      </div>
    </xsl:if>

  </xsl:template>

  <!-- CONTROL: Contents List -->
  
  <xsl:template name="BuildContentsList">
    <label for="mdpJumpToSection" class="SkipLink">Jump to a section</label>
    <select id="mdpJumpToSection" size="1" name="seq">
      <option value="">Jump to Section</option>
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
    <input type="submit" value="Go" id="mdpJumpToSectionSubmit" />
    
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
    <ul id="mdpPageOptions">
			<li>
			  <xsl:variable name="pageNum">
			    <xsl:choose>
			      <xsl:when test="$gCurrentPageNum">
			        <xsl:value-of select="$gCurrentPageNum" />
			      </xsl:when>
			      <xsl:otherwise>
			        <xsl:text>n</xsl:text><xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
			      </xsl:otherwise>
			    </xsl:choose>
			  </xsl:variable>
				<form method="GET" action="/cgi/pt" id="mdpPageForm">
				  <input type="hidden" name="u" id="u" value="1" />
				  
				  <label for="BRpagenum">Jump to </label>

          <xsl:element name="input">
            <xsl:attribute name="id">BRpagenum</xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="size">8</xsl:attribute>
            <xsl:attribute name="name">num</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="$pageNum"/>
            </xsl:attribute>
          </xsl:element>

				  <xsl:element name="input">
            <xsl:attribute name="id">mdpGotoButton</xsl:attribute>
            <xsl:attribute name="type">submit</xsl:attribute>
            <xsl:attribute name="value">Go</xsl:attribute>
            <xsl:attribute name="title">Jump to this sequential page in the text</xsl:attribute>
            <xsl:attribute name="alt">Jump to this sequential page in the text</xsl:attribute>
          </xsl:element>
          
          &#160;
          
          <xsl:apply-templates select="//PageXOfYForm/HiddenVars"/>
          <xsl:if test="not(//PageXOfYForm/HiddenVars/Variable[@name='seq'])">
            <input type="hidden" name="seq" value="" />
          </xsl:if>
          <xsl:call-template name="HiddenDebug" />
				  
				</form>
				
			</li>
			<li class="PTiconButton">
			  <xsl:choose>
			    <xsl:when test="$pPageLinks/FirstPageLink">
            <xsl:element name="a">
              <xsl:attribute name="id">mdpFirstPageLink</xsl:attribute>
              <xsl:attribute name="title">First [f]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/FirstPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">f</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">First [f]</xsl:attribute>
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
                <xsl:attribute name="alt"></xsl:attribute>
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
              <xsl:attribute name="id">mdpPreviousPageLink</xsl:attribute>
              <xsl:attribute name="title">Previous [p]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">p</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Previous [p]</xsl:attribute>
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
                <xsl:attribute name="alt">Previous</xsl:attribute>
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
              <xsl:attribute name="id">mdpNextPageLink</xsl:attribute>
              <xsl:attribute name="title">Next [n]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">n</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Next [n]</xsl:attribute>
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
                <xsl:attribute name="alt">Next</xsl:attribute>
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
              <xsl:attribute name="id">mdpLastPageLink</xsl:attribute>
              <xsl:attribute name="title">Last [l]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/LastPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">l</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt">Last [l]</xsl:attribute>
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
                <xsl:attribute name="alt">Last</xsl:attribute>
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

  <!-- CONTROL: Page Links Bottom -->
  <xsl:template name="BuildPageLinksBottom">
    <xsl:param name="pPageLinks"/>

    <ul>
      <li>
        <xsl:if test="$pPageLinks/FirstPageLink">
          <xsl:element name="a">
            <xsl:attribute name="title">First</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/FirstPageLink"/>
            </xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">First</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/first_bottom.gif'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>

      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/PreviousPageLink=''">
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/prev_bottom_gray.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Previous</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/prev_bottom.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/NextPageLink=''">
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Next</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/next_bottom_gray.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Next</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Next</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/next_bottom.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:if test="$pPageLinks/LastPageLink">
          <xsl:element name="a">
            <xsl:attribute name="title">Last</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/LastPageLink"/>
            </xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">Last</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/last_bottom.gif'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>
    </ul>

  </xsl:template>

  <!-- CONTROL: Image Rotate -->
  <xsl:template name="BuildItemRotateLinks">
    <xsl:param name="pRotateLinks"/>
    <ul>
      <li>
        <span class="rotateLabel">rotate&#xa0;</span>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image counter-clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/CounterClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image counter-clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCCW.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/ClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCW.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
      </li>
    </ul>

  </xsl:template>

  <!-- CONTROL: Image Rotate Bottom-->
  <xsl:template name="BuildItemRotateLinksBottom">
    <xsl:param name="pRotateLinks"/>

    <ul>
      <li>
        <span class="rotateLabel">rotate&#xa0;</span>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image counter-clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/CounterClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image counter-clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCCW_bottom.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/ClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCW_bottom.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
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

      <xsl:when test="$gFinalView='restrictedXX'">
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
        <div id="BookReader"></div>
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
  
  <!-- FORM: Image View Type -->
  <xsl:template name="BuildViewTypeForm">
    <xsl:param name="pViewTypeForm"/>
    
    <xsl:element name="form">
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>

      <ul>
        <li class="asearchform">
          <xsl:apply-templates select="$pViewTypeForm/HiddenVars"/>
          <xsl:for-each select="$pViewTypeForm/ViewTypeValuesSelect">
            <span class="viewLabel">view&#xa0;page&#xa0;as&#xa0;</span>
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

  <!-- CONTROL: Image View Type LIST -->
  <xsl:template name="BuildItemViewLinks">
    <xsl:param name="pViewTypeList"/>

    <xsl:variable name="currentViewDesc">
      <xsl:value-of select="$gCurrentView"/><xsl:text> view is current Page view</xsl:text>
    </xsl:variable>

    <ul>
      <li>
        <xsl:choose>
          <xsl:when test="$gCurrentView!='image'">
            <xsl:element name="a">
              <xsl:attribute name="class">ViewAsIcon</xsl:attribute>
              <xsl:attribute name="title">image view</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewTypeImageLink"/>
              </xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">View Page as Image</xsl:attribute>
                <xsl:attribute name="title">Image view for original</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/icon_image.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
            <xsl:element name="a">
              <xsl:attribute name="class">ViewAsLabel</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pViewTypeList/ViewTypeImageLink"/>
              </xsl:attribute>
              <xsl:attribute name="title">Image view for original</xsl:attribute>
              <xsl:text>image</xsl:text>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="img">
              <xsl:attribute name="alt"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/icon_image_gray.gif'"/>
              </xsl:attribute>
              <xsl:attribute name="title"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
            </xsl:element>
            <span class="nonactiveView">
              <xsl:text>image</xsl:text>
            </span>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <xsl:if test="$gHasOcr='YES'">
        <li>
          <xsl:choose>
            <xsl:when test="$gCurrentView!='text'">
              <xsl:element name="a">
                <xsl:attribute name="class">SkipLink</xsl:attribute>
                <xsl:attribute name="accesskey">5</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="$pViewTypeList/ViewTypeTextLink"/>
                </xsl:attribute>
                <xsl:attribute name="title">OCR text version</xsl:attribute>
              </xsl:element>
              
              <xsl:element name="a">
                <xsl:attribute name="class">ViewAsIcon</xsl:attribute>
                <xsl:attribute name="title">full view</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="$pViewTypeList/ViewTypeTextLink"/>
                </xsl:attribute>
                <xsl:element name="img">
                  <xsl:attribute name="alt">View Page as Text</xsl:attribute>
                  <xsl:attribute name="title">OCR text view for copy/paste [5]</xsl:attribute>
                  <xsl:attribute name="src">
                    <xsl:value-of select="'//common-web/graphics/icon_text.gif'"/>
                  </xsl:attribute>
                </xsl:element>
              </xsl:element>
              <xsl:element name="a">
                <xsl:attribute name="class">ViewAsLabel</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="$pViewTypeList/ViewTypeTextLink"/>
                </xsl:attribute>
                <xsl:attribute name="title">Text view for copy/paste</xsl:attribute>
                <xsl:text>text</xsl:text>
              </xsl:element>
            </xsl:when>
            <xsl:otherwise>
              <xsl:element name="img">
                <xsl:attribute name="alt"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/icon_text_gray.gif'"/>
                </xsl:attribute>
                <xsl:attribute name="title"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
              </xsl:element>
              <span class="nonactiveView">
                <xsl:text>text</xsl:text>
              </span>
            </xsl:otherwise>
          </xsl:choose>
        </li>        
      </xsl:if> <!-- has ocr -->
      
      <xsl:call-template name="BuildPdfViewLinks">
        <xsl:with-param name="pViewTypeList" select="$pViewTypeList"/>
      </xsl:call-template>

    </ul>
  </xsl:template>
  
  <xsl:template name="BuildPdfViewLinks">
    <xsl:param name="pViewTypeList"/>
    <li>
      <xsl:choose>
        <xsl:when test="$gCurrentView!='pdf'">
          <xsl:element name="a">
            <xsl:attribute name="class">ViewAsIcon</xsl:attribute>
            <xsl:attribute name="title">PDF view</xsl:attribute>
            <xsl:attribute name="id">pdfLink</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
            </xsl:attribute>
            <xsl:attribute name="target">
              <xsl:text>pdf</xsl:text>
            </xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">View Page as PDF</xsl:attribute>
              <xsl:attribute name="title">PDF view for printing</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/icon_pdf.gif'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
          <xsl:element name="a">
            <xsl:attribute name="class">ViewAsLabel</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
            </xsl:attribute>
            <xsl:attribute name="title">PDF view for printing</xsl:attribute>
            <xsl:attribute name="target">
              <xsl:text>pdf</xsl:text>
            </xsl:attribute>
            <xsl:text>1-page PDF</xsl:text>
          </xsl:element>
        </xsl:when>

        <xsl:otherwise>
          <xsl:element name="img">
            <xsl:attribute name="alt"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/icon_pdf_gray.gif'"/>
            </xsl:attribute>
            <xsl:attribute name="title"><xsl:value-of select="$currentViewDesc"/></xsl:attribute>
          </xsl:element>
          <span class="nonactiveView">
            <xsl:text>1-page PDF</xsl:text>
          </span>
        </xsl:otherwise>
      </xsl:choose>
    </li>

    <xsl:if test="$gFullPdfAccess='allow'">
      <li>
        <xsl:element name="a">
          <xsl:attribute name="class">ViewAsIcon</xsl:attribute>
          <xsl:attribute name="title">Download full PDF</xsl:attribute>
          <xsl:attribute name="id">pdfLink</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
          </xsl:attribute>
        </xsl:element>
        <xsl:element name="img">
          <xsl:attribute name="alt">Download book as PDF</xsl:attribute>
          <xsl:attribute name="title">Download book as PDF</xsl:attribute>
          <xsl:attribute name="src">
            <xsl:value-of select="'//common-web/graphics/icon_pdf.gif'"/>
          </xsl:attribute>
        </xsl:element>
        <xsl:element name="a">
          <xsl:attribute name="class">ViewAsLabel</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
          </xsl:attribute>
          <xsl:attribute name="title">Download book as PDF</xsl:attribute>
          <xsl:text>full PDF</xsl:text>
        </xsl:element>
      </li>
    </xsl:if>
    
>>>>>>> 6ac5551... Initial support for 'ui' parameter
  </xsl:template>
  
  <xsl:template name="BuildFullPdfDownloadLink">
    <xsl:param name="href" />
    <xsl:param name="linktext" />
    
    <xsl:element name="a">
      <xsl:attribute name="class">ViewAsIcon</xsl:attribute>
      <xsl:attribute name="title">Download full PDF</xsl:attribute>
      <xsl:attribute name="id">pdfLink</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:value-of select="$href"/>
      </xsl:attribute>
      <xsl:element name="img">
        <xsl:attribute name="alt">Download book as PDF</xsl:attribute>
        <xsl:attribute name="title">Download book as PDF</xsl:attribute>
        <xsl:attribute name="src">
          <xsl:value-of select="'//common-web/graphics/icon_pdf.gif'"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:element>
    <xsl:element name="a">
      <xsl:attribute name="class">ViewAsLabel</xsl:attribute>
      <xsl:attribute name="style">width:120%</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:value-of select="$href"/>
      </xsl:attribute>
      <xsl:attribute name="title">Download book as PDF</xsl:attribute>
      <!-- <xsl:text>full PDF</xsl:text> -->
      <xsl:value-of select="$linktext" />
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

  <!-- AJAX: build "add item to [new] collection" request URL -->
  <xsl:template name="GetAddItemRequestUrl">

    <xsl:variable name="id">
      <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>
    </xsl:variable>

    <xsl:variable name="ajax_request_partial_url">
          <xsl:value-of select="concat('mb?', 'page=ajax', ';id=', $id )"/>
    </xsl:variable>

    <div id="PTajaxAddItemPartialUrl" class="hidden">
          <xsl:value-of select="$ajax_request_partial_url"/>

    </div>


  </xsl:template>
  
  <!-- TEMPORARY OVERRIDES -->
  
  <!-- Navigation bar -->
  <xsl:template name="subnav_header">
    
    <div id="mdpItemBar">
      <div id="ItemBarContainer">
        <!-- Back to Search Results -->
        <xsl:if test="normalize-space(//SearchForm/SearchResultsLink)">
          <xsl:call-template name="BuildBackToResultsLink" />
        </xsl:if>
        
        <!-- Search -->
        <div id="mdpSearch">
          <xsl:call-template name="BuildSearchForm">
            <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
          </xsl:call-template>
        </div>
      </div>
    </div>
    
  </xsl:template>
  
  <xsl:template name="BuildBackToResultsLink">
    <div id="mdpBackToResults">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="//SearchForm/SearchResultsLink" />
        </xsl:attribute>
        <xsl:text>&#171; Back to </xsl:text>
        <xsl:value-of select="//SearchForm/SearchResultsLabel" />
      </xsl:element>
    </div>
  </xsl:template>

</xsl:stylesheet>

