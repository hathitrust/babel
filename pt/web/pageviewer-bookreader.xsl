<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
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
  <xsl:variable name="gCurrentEmbed">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>full</xsl:text>
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
  <xsl:template match="/MBooksTop">
    
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view'] = 'text'">
        <xsl:call-template name="ocr-frame" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="default-frame"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <xsl:template name="common-html-head">
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
        <xsl:with-param name="titleString" select="$gTitleString"/>
        <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
        <xsl:with-param name="maxLength" select="$gTitleTrunc"/>
      </xsl:call-template>
    </title>

  </xsl:template>
  
  <!-- DEFAULT FRAME -->
  <xsl:template name="default-frame">
    
    
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        
        <xsl:call-template name="common-html-head" />
        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/> 
        <xsl:choose>
          <xsl:when test="$gCurrentEmbed = 'embed'">
            <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReaderEmbed.css"/> 
          </xsl:when>
          <xsl:otherwise>
          </xsl:otherwise>
        </xsl:choose>
            
        <link rel="stylesheet" type="text/css" href="/pt/hathi.css?ts={generate-id(.)}"/>
        <xsl:choose>
          <xsl:when test="$gCurrentEmbed = 'embed'">
            <link rel="stylesheet" type="text/css" href="/pt/hathi_embed.css"/> 
          </xsl:when>
          <xsl:otherwise>
          </xsl:otherwise>
        </xsl:choose>
        
        <xsl:variable name="protocol">
          <xsl:choose>
            <xsl:when test="/MBooksTop/MBooksGlobals/LoggedIn='YES'"><xsl:text>https</xsl:text></xsl:when>
            <xsl:otherwise><xsl:text>http</xsl:text></xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        
        <!-- <script type="text/javascript" src="http://www.archive.org/download/BookReader/lib/jquery-1.2.6.min.js"></script> -->
        <script type="text/javascript" src="{$protocol}://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js"></script>
        <script type="text/javascript" src="/pt/jquery.easing.1.3.js"></script>
        <script type="text/javascript" src="/pt/jquery-textfill-0.1.js"></script>
        <script type="text/javascript" src="/pt/jquery.pnotify.js"></script>
        <script type="text/javascript" src="/pt/bookreader/BookReader/BookReader.js?ts={generate-id(.)}"></script>
        <script type="text/javascript" src="/pt/bookreader/BookReader/dragscrollable.js?ts={generate-id(.)}"></script>
        <!-- <script type="text/javascript" src="https://getfirebug.com/firebug-lite.js"></script> -->

    		<link href="{$protocol}://ajax.googleapis.com/ajax/libs/jqueryui/1.8.2/themes/start/jquery-ui.css" media="all" rel="stylesheet" type="text/css" /> 
    		<link href="/pt/jquery.pnotify.default.css" media="all" rel="stylesheet" type="text/css" /> 
    		<link href="/pt/jquery.pnotify.default.icons.css" media="all" rel="stylesheet" type="text/css" /> 


      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <div>
          <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
        </div>
        <div id="container">
          <!-- Header -->
          <xsl:if test="$gCurrentEmbed = 'full'">
            <xsl:call-template name="header"/>
          </xsl:if>
        <xsl:call-template name="UberContainer"/>
        <!-- Footer -->
          <xsl:if test="$gCurrentEmbed = 'full'">
            <xsl:call-template name="footer"/>
          </xsl:if>
        </div>
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
              this.inTextMode = false;
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
              console.log("SETTING DAS HASH: <xsl:value-of select="$seq" />");
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
           br.bookTitle = "<xsl:value-of select="str:replace(string($gTitleString), '&quot;', '\&quot;')"/>";
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
            br.slice_size = 10;
            br.ui = '<xsl:value-of select="$gCurrentEmbed"/>';
            if ( br.ui == 'embed' ) {
              br.mode = 1;
              br.reduce = 1;
            }
            br.displayMode = 'image';
            // br.highlightText = "<xsl:value-of select="str:replace(string(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']), '&quot;', '\&quot;')"/>";
            br.qvalsHash = "<xsl:value-of select="string(/MBooksTop/MdpApp/QValsHash)" />";
        </script>
        <script type="text/javascript" src="/pt/js/hathi.js?ts={generate-id(.)}"/> 
        
        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>
      </body>
    </html>
  </xsl:template>
  
  <!-- Embedded OCR Frame -->
  <xsl:template name="ocr-frame">
    
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
    
      <head>
        <xsl:call-template name="common-html-head" />
        <xsl:call-template name="load_css" />
        <link rel="stylesheet" type="text/css" href="/pt/hathi.css?ts={generate-id(.)}"/>

        <xsl:variable name="protocol">
          <xsl:choose>
            <xsl:when test="/MBooksTop/MBooksGlobals/LoggedIn='YES'"><xsl:text>https</xsl:text></xsl:when>
            <xsl:otherwise><xsl:text>http</xsl:text></xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <script type="text/javascript" src="{$protocol}://ajax.googleapis.com/ajax/libs/jquery/1.4.3/jquery.min.js"></script>
        <script type="text/javascript" src="/pt/jquery-textfill-0.1.js"></script>
        <script type="text/javascript">
          $(document).ready(function() {
            $("#mdpTextFrame").textfill({ maxFontSize:40, minFontSize:12 });
            $("#MdpOcrFrame", parent.document).removeClass('loading');
          })
        </script>
      </head>
      
      <body>
        <xsl:element name="div">
          <xsl:attribute name="id">mdpTextFrame</xsl:attribute>
          <p>
            <xsl:apply-templates select="$gCurrentPageOcr"/>
          </p>
        </xsl:element>
      </body>
    
    </html>
    
  </xsl:template>


  <!-- Top Level Container DIV -->
  <xsl:template name="UberContainer">

    <div id="mdpUberContainer">

      <div id="ControlContentContainer">
        <div id="ControlContent">
          <!-- Controls -->
          <xsl:if test="$gCurrentEmbed = 'full'">
          <xsl:call-template name="ControlContainer"/>
          </xsl:if>

          <!-- Image -->
          <xsl:call-template name="ContentContainer"/>

          <!-- Feedback form -->
          <div id="feedbackDiv"></div>

          <!-- New collection overlay -->
          <div id="overlay"></div>

          <!-- Controls Bottom -->
          <!-- <xsl:call-template name="ControlContainerBottom"/> -->

          <!-- Feedback -->
          <xsl:call-template name="Feedback"/>
        </div>
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

      <!-- add COinS -->
      <xsl:for-each select="$gMdpMetadata">
        <xsl:call-template name="marc2coins" />
      </xsl:for-each>

    </div>
  </xsl:template>

  <!-- FORM: Add To Collection Form -->
  <xsl:template name="BuildAddToCollectionControl">
    <div class="ptSelectBox">
      <label for="PTaddItemSelect" class="PTcollectionlabel"><xsl:text>Add to your collection:</xsl:text></label>
      <!-- for-each just for context: there's only one -->
      <xsl:for-each select="$gCollectionForm/CollectionSelect">
        <xsl:call-template name="BuildHtmlSelect">
          <xsl:with-param name="id" select="'PTaddItemSelect'"/>
          <xsl:with-param name="class" select="'mdpColSelectMenu'"/>
        </xsl:call-template>
      </xsl:for-each>

      <button id="PTaddItemBtn">Add</button>

    </div>
  </xsl:template>


  <!-- Control Container -->
  <xsl:template name="ControlContainer">

    <div class="mdpControlContainer">
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
    <xsl:variable name="foldPosition">
      <xsl:choose>
        <xsl:when test="/MBooksTop/MBooksGlobals/SSDSession='true'">
          <!-- Do not fold for ssd; it hides some content -->
          <xsl:value-of select="9999"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="20"/>
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
              (<a href="http://www.hathitrust.org/faq#RestrictedAccess">More information</a>)
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

      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']='classic'">
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
        <div id="BookReader" />
      </xsl:otherwise>
      
    </xsl:choose>
  </xsl:template>

  <!-- -->
  <xsl:template match="CurrentPageOcr">
    <!-- handle Highlight element children in the OCR -->
    <xsl:apply-templates mode="ocr"/>
  </xsl:template>
  
  <xsl:template match="@*|*|text()" mode="ocr">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="ocr"/>
    </xsl:copy>
  </xsl:template>
  
  <xsl:template match="Highlight" mode="ocr">
    <xsl:element name="span">
      <xsl:copy-of select="@class"/>
      <xsl:value-of select="."/>
    </xsl:element>
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
    </ul>
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

</xsl:stylesheet>

