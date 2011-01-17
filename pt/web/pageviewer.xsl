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
  <xsl:variable name="gCurrentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']"/>
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
  <xsl:variable name="gCurrentEmbed">
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
              <xsl:when test="$gCurrentView='image' or $gCurrentView='pdf'">
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

  <!-- root template -->
  <!-- root template -->
  <xsl:template match="/MBooksTop">
    
    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'classic'">
        <xsl:apply-templates select="." mode="classic" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'bookreader'">
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
    <!-- for prototype : bookreader instance section -->
    <script type="text/javascript">
      function subclass(constructor, superConstructor)
      {
        function surrogateConstructor()
        {
        }

        surrogateConstructor.prototype = superConstructor.prototype;

        var prototypeObject = new surrogateConstructor();
        prototypeObject.constructor = constructor;

        constructor.prototype = prototypeObject;
      }

      subclass(FrankenBookReader, BookReader);

      function FrankenBookReader() {
          BookReader.call(this);
          this.constModeText = 4;
      }
    </script>
    
    <script type="text/javascript">
      $(window).bind("resize", function() {
        var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
        var chromeHeight = $("#mbFooter").height() + $("#mbHeader").height();
        $("#BookReader").height(viewportHeight - chromeHeight - 75);
        $("div.mdpControlContainer").height(viewportHeight - chromeHeight - 75);
      })


      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
          <xsl:variable name="seq" select="number(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']) - 1" />
          window.location.hash = "#page/n<xsl:value-of select="$seq" />/mode/1up";
      </xsl:if>


      $(document).ready(function(){ 
        $('#mdpImage').hide();
        var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
        var chromeHeight = $("#mbFooter").height() + $("#mbHeader").height();
        $("#BookReader").height(viewportHeight - chromeHeight - 75);
        $("div.mdpControlContainer").height(viewportHeight - chromeHeight - 75);
      
        // $('#BookReader').height($('.mdpControlContainer').height()-50);
        // $('#BookReader').height(viewportHeight-50);
      
      
      });

       br = new FrankenBookReader();
       br.bookId   = '<xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>';
       br.bookTitle = "<xsl:value-of select="str:replace(string($gFullTitleString), '&quot;', '\&quot;')"/>";
       br.reduce = 1;
       br.pageProgression = 'lr';
       // specifying our own reductionFactors seems to mess with zooming out
       //br.reductionFactors = [0.5, 0.75, 1, 1.5, 2, 4]; // [0.5, 1, 2, 4, 8];
       
       br.reductionFactors = [   {reduce: 0.5, autofit: null},
                                 {reduce: 2/3, autofit: null},
                                 {reduce: 1, autofit: null},
                                 {reduce: 2, autofit: null},
                                 {reduce: 4, autofit: null},
                             ];
       
       
              <xsl:for-each select="$gFeatureList/Feature[Tag='TITLE'][last()]">
                <xsl:if test="position() = 1">   
                  // The index of the title page.
                  br.titleLeaf = <xsl:value-of select="number(./Seq)-1"/>;  
                </xsl:if>
              </xsl:for-each>
        br.imagesBaseURL = "/pt/bookreader/BookReader/images/";
        br.metaURL = "/cgi/imgsrv/meta";
        br.force = 1;
        br.imageURL = "/cgi/imgsrv/image";
        br.ocrURL = "/cgi/imgsrv/ocr";
        br.pingURL = "/cgi/imgsrv/ping";
        br.ocrFrameURL = "/cgi/pt";
        br.slice_size = 100;
        br.ui = 'full';
        if ( br.ui == 'embed' ) {
          br.mode = 1;
          br.reduce = 1;
        }
        br.displayMode = 'image';
        br.hasOcr = '<xsl:value-of select="string(/MBooksTop/MBooksGlobals/HasOcr)" />' == 'YES';
        br.qvalsHash = "<xsl:value-of select="string(/MBooksTop/MdpApp/QValsHash)" />";
    </script>
    <script type="text/javascript" src="/pt/js/hathi.js?ts={generate-id(.)}"/> 
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

    <div id="mdpUberContainer">
      <xsl:call-template name="BookReaderToolbar" />
      
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
                <xsl:attribute name="href">
                  <xsl:value-of select="$pViewTypeList/ViewTypePdfLink"/>
                </xsl:attribute>
                <xsl:attribute name="target">
                  <xsl:text>pdf</xsl:text>
                </xsl:attribute>
                <xsl:text>Download PDF - this page</xsl:text>
              </xsl:element>
            </li>
            
            <xsl:if test="$gFullPdfAccess='allow'">
              <li>
                <xsl:element name="a">
                  <xsl:attribute name="title">Download full PDF</xsl:attribute>
                  <xsl:attribute name="id">fullPdfLink</xsl:attribute>
                  <xsl:attribute name="href">
                    <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
                  </xsl:attribute>
                  <xsl:text>Download PDF - whole book</xsl:text>
                </xsl:element>
								<div id="fullPdfProgress" class="meter-wrap">
									<div class="meter-value" style="background-color: #666; width: 0%">
										<div clas="meter-text">
											Generating PDF...
										</div>
									</div>
								</div>
								<div id="fullPdfAlert">
									<p>
										There was a problem building your PDF; staff have been notified.
										Please try again in 24 hours.
									</p>
								</div>
								<div id="fullPdfFrame"></div>
              </li>
            </xsl:if>
          </ul>
        </div>

        <div class="collectionLinks">
          <h2>Add to Collection</h2>
          <xsl:choose>
            <xsl:when test="$gLoggedIn='NO'">
              <p class="collectionLoginMessage">
                <xsl:element name="a">
                  <xsl:attribute name="class">PTloginLinkText</xsl:attribute>
                  <xsl:attribute name="href">
                    <xsl:value-of select="/MBooksTop/MdpApp/LoginLink"/>
                  </xsl:attribute>
                  <xsl:text>Login</xsl:text>
                </xsl:element>
                <xsl:text> to make your personal collections permanent</xsl:text>
              </p>
            </xsl:when>
            <xsl:otherwise>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:call-template name="BuildAddToCollectionControl"/>
        </div>
        
        <div class="shareLinks">
          <h2>Share</h2>
          <form action="" name="urlForm" id="urlForm">
						<label class="smaller" for="permURL">Permanent link to this book</label>
						<input type="text" name="permURL_link" id="permURL" class="email-permURL" onclick="document.urlForm.permURL_link.select();" readonly="readonly = true;" value="http://hdl.handle.net/2027/mdp.39015015394847" />

						<br />

						<label class="smaller" for="pageURL">Link to this page</label>
						<input type="text" name="pageURL_link" id="pageURL" class="email-permURL" onclick="document.urlForm.pageURL_link.select();" readonly="readonly = true;" value="http://hdl.handle.net/2027/mdp.39015015394847" />
          </form>
        </div>

      </div> <!-- scrollable -->
      
    </div>
  </xsl:template>
  
  <xsl:template name="BookReaderToolbar">
		<div id="mdpToolbar">
			
			<div id="mdpToolbarViews">
				<ul>
					<li>
						<a class="PTbutton" href="#" id="btnClassicView">
							<img src="/pt/images/icon_classicview.png" />
							<span>Classic View</span>
						</a>
					</li>
					<li>
						<ul id="mdpBookReaderViews">
							<li>
								<img id="mdpNewStarburst" src="/pt/images/NewStarburst.png" height="44" width="40" />
							</li>
							<li>
								<span class="prompt">Try our new views!</span>
							</li>
							<li>
								<a class="PTbutton" href="#" id="btnBookReaderScroll">
									<img src="/pt/images/icon_scroll.png" />
									<span>Scroll</span>
								</a>
							</li>
							<li>
								<a class="PTbutton PTbuttonActive" href="#" id="btnBookReaderFlip">
									<img src="/pt/images/icon_flip_25.png" />
									<span>Flip</span>
								</a>
							</li>
							<li>
								<a class="PTbutton" href="#" id="btnBookReaderThumbnails">
									<img src="/pt/images/icon_thumbnails.png" />
									<span>Thumbnails</span>
								</a>
							</li>
							<li>
								<a class="PTbutton" href="#" id="btnBookReaderText">
									<img src="/pt/images/1x1.png" height="25" width="1" />
									<span>Plain Text</span>
									<img src="/pt/images/1x1.png" height="25" width="1" />
								</a>
							</li>
						</ul>
					</li>
				</ul>
			</div>
			<div id="mdpToolbarNav">
				<ul id="mdpSectionOptions">
					<li>
						<select size="1" id="mdpJumpToSection">
							<option value="">Jump to Section</option>
						</select>
					</li>
				</ul>
				<ul id="mdpZoomOptions">
					<li class="PTiconButton">
						<a href="#" id="mdpZoomOut"><img src="/pt/images/icon_zoomout.png" height="25" width="25" /></a>
					</li>
					<li>
						<span id="mdpZoomStatus">100%</span>
					</li>
					<li class="PTiconButton">
						<a href="#" id="mdpZoomIn"><img src="/pt/images/icon_zoomin.png" height="25" width="25" /></a>
					</li>
				</ul>
				<ul id="mdpPageOptions">
					<li class="PTiconButton">
						<a href="#" id="mdpPageFirst"><img src="/pt/images/icon_first.png" height="25" width="17" /></a>
					</li>
					<li class="PTiconButton">
						<a href="#" id="mdpPagePrev"><img src="/pt/images/icon_previous.png" height="25" width="17" /></a>
					</li>
					<li>
						<input id="mdpPageNum" width="5" type="text" value="5" />
					</li>
					<li class="PTiconButton">
						<a href="#" id="mdpPageNext"><img src="/pt/images/icon_next.png" height="25" width="17" /></a>
					</li>
					<li class="PTiconButton">
						<a href="#" id="mdpPageLast"><img src="/pt/images/icon_last.png" height="25" width="17" /></a>								
					</li>
				</ul>
			</div>
		</div>
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

    <xsl:call-template name="hathiVuFind"/>

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
      <xsl:call-template name="BackwardNavigation"/>
    </div>
  </xsl:template>

  <!-- FORM: Add To Collection Form -->
  <xsl:template name="BuildAddToCollectionControl">
    <div class="ptSelectBox">
      <!-- <label for="PTaddItemSelect" class="PTcollectionlabel"><xsl:text>Add to your collection:</xsl:text></label> -->
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
    <ul>
      <li>
        <xsl:if test="$pPageLinks/FirstPageLink">
          <xsl:element name="a">
            <xsl:attribute name="title">First [f]</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/FirstPageLink"/>
            </xsl:attribute>
            <xsl:attribute name="accesskey">f</xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">First [f]</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/first.gif'"/>
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
                  <xsl:value-of select="'//common-web/graphics/prev_gray.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Previous [p]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">p</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous [p]</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/prev.gif'"/>
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
                  <xsl:value-of select="'//common-web/graphics/next_gray.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Next [n]</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:attribute name="accesskey">n</xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Next [n]</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/next.gif'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:if test="$pPageLinks/LastPageLink">


          <xsl:element name="a">
            <xsl:attribute name="title">Last [l]</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/LastPageLink"/>
            </xsl:attribute>
            <xsl:attribute name="accesskey">l</xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">Last [l]</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/last.gif'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
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

      <xsl:when test="$gFinalView='text'">
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

      <xsl:when test="$gFinalView='missing'">
        <div id="mdpTextMissingPage">
          <div class="mdpTMPhead">MISSING PAGE</div>
          <div class="mdpTMPtext">This page is missing in the original.  Use the arrows and links to continue to available pages.</div>
          <div class="mdpTMPtext"><a href="http://www.hathitrust.org/faq#PageNotAvailable">See the Help page for more information.</a></div>
        </div>
      </xsl:when>

      <xsl:when test="$gCurrentUi='classic'">
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
        
        <!-- Search -->
        <div id="mdpSearch">
          <xsl:call-template name="BuildSearchForm">
            <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
          </xsl:call-template>
        </div>
      </div>
    </div>
    
  </xsl:template>

</xsl:stylesheet>

