<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:import href="str.replace.function.xsl" />

  <!-- Global Variables -->
  <xsl:variable name="gCurrentPageImageSource" select="/MBooksTop/MBooksGlobals/CurrentPageImageSource"/>
  <xsl:variable name="gCurrentPageImageWidth" select="/MBooksTop/MBooksGlobals/CurrentPageImageWidth"/>
  <xsl:variable name="gCurrentPageImageHeight" select="/MBooksTop/MBooksGlobals/CurrentPageImageHeight"/>
  <xsl:variable name="gCurrentPageOcr" select="/MBooksTop/MBooksGlobals/CurrentPageOcr"/>
  <xsl:variable name="gCurrentPageNum" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']"/>
  <xsl:variable name="gCurrentPageFeatures" select="/MBooksTop/MdpApp/CurrentPageFeatures"/>

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

  <xsl:variable name="currentSize" select="number(//CurrentCgi/Param[@name='size'])" />
  <xsl:variable name="currentOrient" select="number(//CurrentCgi/Param[@name='orient'])" />
  <xsl:variable name="gMinImageHeight">
    <xsl:choose>
      <xsl:when test="$currentOrient = '1' or $currentOrient = '3'">
        <xsl:value-of select="(680 * ( $currentSize div 100 ))" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="(680 * ( $currentSize div 100 ))" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/pt/css/toolbar.css" />
    <script>
      head.js("/pt/vendor/jquery.fracs.js");
      head.js("/pt/js/reader.js", "/pt/js/manager.js", "/pt/js/views.js");
    </script>
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> view-</xsl:text><xsl:value-of select="$gCurrentView" />
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />    
  </xsl:template>

  <xsl:template name="main">
    <div class="main" id="viewport">
      <xsl:call-template name="toolbar-vertical" />
      <div id="scrolling">
        <xsl:call-template name="toolbar-horizontal" />
        <xsl:call-template name="page-content" />
      </div>
    </div>
    <script>
      head.js("/pt/web/js/scrolling.js");
    </script>
  </xsl:template>

  <xsl:template name="toolbar-vertical">
    <div id="toolbar-vertical" class="fixed fixed-y toolbar-vertical toolbar" data-margin-top="40">
      <div class="options">
        <div class="btn-group btn-group-vertical action-views">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">1up</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">2up</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">thumb</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view" select="'image'">image</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">plaintext</xsl:with-param>
          </xsl:call-template>
        </div>
        <div class="btn-group btn-group-vertical">
          <button id="action-toggle-fullscreen" type="button" class="btn square alone"><i class="icomoon-fullscreen"></i><span class="label"> Full Screen</span></button>
        </div>
        <div class="btn-group btn-group-vertical">
          <a href="{//ResizeLinks/ResizeInLink}" id="action-zoom-in" type="button" class="btn square"><i class="icomoon-iconmonstr-magnifier-6-icon" style=""></i><span class="label"> Zoom In</span></a>
          <a href="{//ResizeLinks/ResizeOutLink}" id="action-zoom-out" type="button" class="btn square"><i class="icomoon-iconmonstr-magnifier-7-icon" style=""></i><span class="label"> Zoom Out</span></a>
        </div>
        <div class="btn-group btn-group-vertical">
          <a href="{//RotateLinks/CounterClockwiseLink}" id="action-rotate-counterclockwise" type="button" class="btn square"><i class="icomoon-reload-CCW"></i><span class="label"> Rotate left</span></a>
          <a href="{//RotateLinks/ClockwiseLink}" id="action-rotate-clockwise" type="button" class="btn square"><i class="icomoon-reload-CW"></i><span class="label"> Rotate right</span></a>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="action-view-button">
    <xsl:param name="view" />
    <xsl:variable name="options">
      <h:select>
        <h:option name="1up" value="icomoon-scroll">Scroll</h:option>
        <h:option name="2up" value="icomoon-book-alt2">Flip</h:option>
        <h:option name="thumb" value="icomoon-grid-view">Thumbnail</h:option>
        <h:option name="image" value="icomoon-documents">Page by Page</h:option>
        <h:option name="plaintext" value="icomoon-article">Plain Text</h:option>
      </h:select>
    </xsl:variable>

    <xsl:variable name="option" select="exsl:node-set($options)//h:option[@name=$view]" />
    <xsl:variable name="href" select="//ViewTypeLinks/View[@name=$view]" />
    <xsl:variable name="active">
      <xsl:choose>
        <xsl:when test="$view = $gCurrentView"> active</xsl:when>
        <xsl:otherwise />
      </xsl:choose>
    </xsl:variable>

    <a href="{$href}" data-target="{$option}" type="button" class="btn square {$active}"><i class="{$option/@value}"></i><span class="label"> <xsl:value-of select="$option" /></span></a>
  </xsl:template>

  <xsl:template name="toolbar-horizontal">
    <div id="toolbar-horizontal" class="toolbar toolbar-horizontal fixed fixed-y" data-margin-top="40">
        
      <div class="options btn-toolbar">
        <div class="btn-group ">
          <xsl:call-template name="action-page-navigation" />
        </div>

        <xsl:call-template name="action-go-page" />

        <div class="btn-group table-of-contents">
          <xsl:call-template name="action-table-of-contents" />
        </div>

        <xsl:call-template name="action-search-volume" />

      </div>

    </div>
  </xsl:template>

  <xsl:template name="action-go-page">
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
    <form class="form-inline" method="get" action="pt">
      <label>Jump to </label>
      <input id="input-go-page" name="num" type="text" placeholder="" value="{$pageNum}" class="input-mini" />
      <button id="action-go-page" type="submit" class="btn btn">Go</button>
      <input type="hidden" name="u" value="1" />
      <xsl:apply-templates select="//PageXOfYForm/HiddenVars"/>
      <xsl:if test="not(//PageXOfYForm/HiddenVars/Variable[@name='seq'])">
        <input type="hidden" name="seq" value="" />
      </xsl:if>
      <xsl:call-template name="HiddenDebug"/>
    </form>
  </xsl:template>

  <xsl:template name="action-page-navigation">
    <a id="action-go-first" href="{//FirstPageLink}" type="button" class="btn square"><i class="icomoon-first"></i><span class="label"> First</span></a>
    <a id="action-go-prev" href="{//PreviousPageLink}" type="button" class="btn square"><i class="icomoon-go-previous" style=""></i><span class="label"> Previous</span></a>
    <a id="action-go-next" href="{//NextPageLink}" type="button" class="btn square"><i class="icomoon-go-next"></i><span class="label"> Next</span></a>
    <a id="action-go-last" href="{//LastPageLink}" type="button" class="btn square"><i class="icomoon-last"></i><span class="label"> Last</span></a>
  </xsl:template>

  <xsl:template name="action-table-of-contents">
    <button type="button" class="btn dropdown-toggle square" data-toggle="dropdown">
      <i class="icomoon-list"></i><span class="label"> Jump to section</span> <span class="caret"></span>
    </button>
    <ul class="dropdown-menu scrollable-list">
      <xsl:for-each select="$gFeatureList/Feature">
        <li>
          <a href="{Link}">
            <xsl:value-of select="Label" />
            <xsl:if test="normalize-space(Page)">
              <xsl:text> - </xsl:text>
              <xsl:value-of select="Page" />
            </xsl:if>
          </a>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template name="page-content">
    <div id="content">
      <xsl:choose>
        <xsl:when test="$gCurrentView = 'image'">
          <xsl:call-template name="page-content-image" />
        </xsl:when>
        <xsl:when test="$gCurrentView = 'plaintext'">
          <xsl:call-template name="page-content-plaintext" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="page-content-reader" />
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="page-content-reader">
    <xsl:call-template name="page-content-image" />
  </xsl:template>

  <xsl:template name="page-content-image">
    <div class="page-item">
      <img src="{//CurrentPageImageSource}" />
    </div>
  </xsl:template>

  <xsl:template name="setup-head">
    <xsl:call-template name="bookreader-toolbar-items" />
    <xsl:call-template name="setup-ht-params" />
  </xsl:template>

  <xsl:template name="setup-ht-params">
    <script type="text/javascript">
      HT.params = {};
      HT.params.ui = 'reader';
      if ( location.hash == '#fullscreen' ) {
        HT.params.fullscreen = true;
        location.hash = "";
      }
      <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
        <xsl:choose>
          <xsl:when test="@name = 'seq'">
            HT.params['<xsl:value-of select="@name" />'] = <xsl:value-of select="number(.) - 1" />;
          </xsl:when>
          <!-- prevent XSS exploit when q1 is displayed in result page -->
          <xsl:when test="@name = 'q1'">
            HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="'foo'" />';
          </xsl:when>
          <xsl:otherwise>
            HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="." />';
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
      if ( HT.params.ui == 'fullscreen' ) {
        HT.params.ui = 'reader';
        HT.params.fullscreen = true;
      }
      HT.params.view = "<xsl:value-of select="$gCurrentView" />";
      var fudgingMonkeyPatch = fudgingMonkeyPatch || false;
      HT.params.fudging = fudgingMonkeyPatch;
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
        if ( HT.params.fudging ) {
          HT.reader.slice_size = 999999;
          HT.reader.catalog_method = 'fudged';
        }
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
        <xsl:text disable-output-escaping="yes">
        HT.reader.flags.force = (HT.reader.flags.debug.indexOf('force') >= 0);
        </xsl:text>
        HT.reader.lazyDelay = 500;
        // HT.reader.pageProgression = "rl";
    </script>
    <script type="text/javascript" src="/pt/js/bookreader_startup.js"/>
    <script type="text/javascript">
        // HT.monitor.run();
    </script>
  </xsl:template>

  <xsl:template name="classic-javascript-init">
    <script type="text/javascript" src="/pt/js/classic_startup.js"/>
  </xsl:template>

  <xsl:template name="item-viewer">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>

    <div class="contentContainerWrap" role="main">

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

    <xsl:choose>
      <xsl:when test="$gUsingBookReader = 'true'">
        <xsl:call-template name="bookreader-javascript-init" />
      </xsl:when>
      <xsl:when test="$gCurrentView = 'image'">
        <xsl:call-template name="classic-javascript-init" />
      </xsl:when>
      <xsl:otherwise />
    </xsl:choose>

  </xsl:template>

  <xsl:template name="item-embedded-viewer">
    <xsl:call-template name="ContentContainer"/>
    <xsl:call-template name="bookreader-javascript-init" />
  </xsl:template>

  <xsl:template name="item-embedded-toolbar">
    <xsl:call-template name="BuildPageLinks">
      <xsl:with-param name="pPageLinks" select="//MdpApp/PageLinks"/>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="BookReaderToolbar">
    <xsl:param name="pViewTypeList"/>

    <div id="mdpToolbar" role="toolbar">
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
              <xsl:if test="$gCurrentView = 'image'">
                <xsl:attribute name="title">current view</xsl:attribute>
              </xsl:if>
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
              <xsl:if test="$gCurrentView = 'plaintext' or $gCurrentView = 'text'">
                <xsl:attribute name="title">current view</xsl:attribute>
              </xsl:if>
              <span>Plain Text</span>
            </xsl:element>
          </li>
        </ul>
      </div>
      </xsl:if>
      <xsl:call-template name="build-toolbar-nav" />
    </div>
  </xsl:template>

  <xsl:template name="bookreader-toolbar-items">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <script id="bookreader-toolbar-items" type="text/x-jquery-tmpl">
      <li>
        <ul id="mdpBookReaderViews">
          <li>
            <xsl:element name="a">
              <xsl:attribute name="id"><xsl:text>btnBookReader1up</xsl:text></xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Scroll View</xsl:attribute>
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
              <xsl:if test="$gCurrentView = '1up'">
                <xsl:attribute name="title">current view</xsl:attribute>
              </xsl:if>
              <span>Scroll</span>
            </xsl:element>
          </li>
          <li>
            <xsl:element name="a">
              <xsl:attribute name="id"><xsl:text>btnBookReader2up</xsl:text></xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Flip View</xsl:attribute>
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
              <xsl:if test="$gCurrentView = '2up'">
                <xsl:attribute name="title">current view</xsl:attribute>
              </xsl:if>
              <span>Flip</span>
            </xsl:element>
          </li>
          <li>
            <xsl:element name="a">
              <xsl:attribute name="id"><xsl:text>btnBookReaderThumbnail</xsl:text></xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Thumbnail View</xsl:attribute>
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
              <xsl:if test="$gCurrentView = 'thumb'">
                <xsl:attribute name="title">current view</xsl:attribute>
              </xsl:if>
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
    <xsl:param name="target" select="'header'" />

    <xsl:variable name="zoom" select="//ResizeForm/ResizeValuesSelect/Option[following-sibling::Option[Focus='true']][last()]" />
    <xsl:choose>
      <xsl:when test="$zoom">
        <xsl:element name="a">
          <xsl:if test="$target = 'header'">
            <xsl:attribute name="id"><xsl:text>mdpZoomOut</xsl:text></xsl:attribute>
          </xsl:if>
          <xsl:attribute name="class">mdpZoomOut tracked interactive zoomAction </xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Zoom Out</xsl:attribute>
          <!-- <xsl:attribute name="title"><xsl:text>Zoom Out: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text></xsl:attribute> -->
          <xsl:attribute name="href">
            <xsl:call-template name="build-zoom-href">
              <xsl:with-param name="size" select="$zoom/Value" />
            </xsl:call-template>
          </xsl:attribute>
          <xsl:text>Zoom Out: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <img src="//common-web/graphics/harmony/icon_zoomout_grayed.png" height="25" width="25" alt="(At Minimum Zoom)"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-zoomin-button">
    <xsl:param name="target" select="'header'" />

    <xsl:variable name="zoom" select="//ResizeForm/ResizeValuesSelect/Option[preceding-sibling::Option[Focus='true']]" />
    <xsl:choose>
      <xsl:when test="$zoom">
        <xsl:element name="a">
          <xsl:if test="$target = 'header'">
            <xsl:attribute name="id"><xsl:text>mdpZoomIn</xsl:text></xsl:attribute>
          </xsl:if>
          <xsl:attribute name="class">mdpZoomIn tracked interactive zoomAction </xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Zoom In</xsl:attribute>
          <!-- <xsl:attribute name="title"><xsl:text>Zoom In: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text></xsl:attribute> -->
          <xsl:attribute name="href">
            <xsl:call-template name="build-zoom-href">
              <xsl:with-param name="size" select="$zoom/Value" />
            </xsl:call-template>
          </xsl:attribute>
          <xsl:text>Zoom In: </xsl:text><xsl:value-of select="$zoom/Value" /><xsl:text>%</xsl:text>
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
    <xsl:variable name="pt" select="//UrlRoots/Variable[@name='cgi/pt']" />

    <xsl:variable name="href">
      <xsl:value-of select="concat($pt, '?id=', $id, ';seq=', $seq, ';size=', $size, ';view=', $view)" />
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
          <xsl:attribute name="class"><xsl:text>overflowContentContainer fakeContentLoader</xsl:text></xsl:attribute>
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
      <xsl:variable name="default-tail">(use access key 5 to switch to full text / OCR mode)</xsl:variable>
      <xsl:variable name="header-1up">Scrolling view of the page images</xsl:variable>
      <xsl:variable name="header-2up">Flip view of two facing page images</xsl:variable>
      <xsl:variable name="header-thumb">Gallery of thumbnail images of all pages</xsl:variable>
      <h2 class="offscreen viewport">
        <xsl:if test="$gUsingBookReader = 'true'">
          <xsl:attribute name="data-default-tail"><xsl:value-of select="$default-tail" /></xsl:attribute>
          <xsl:attribute name="data-header-1up"><xsl:value-of select="$header-1up" /></xsl:attribute>
          <xsl:attribute name="data-header-2up"><xsl:value-of select="$header-2up" /></xsl:attribute>
          <xsl:attribute name="data-header-thumb"><xsl:value-of select="$header-thumb" /></xsl:attribute>
        </xsl:if>
        <xsl:choose>
          <xsl:when test="$gCurrentView = '1up'">
            <xsl:value-of select="$header-1up" />
            <xsl:text> </xsl:text>
            <xsl:value-of select="$default-tail" />
          </xsl:when>
          <xsl:when test="$gCurrentView = '2up'">
            <xsl:value-of select="$header-2up" />
            <xsl:text> </xsl:text>
            <xsl:value-of select="$default-tail" />
          </xsl:when>
          <xsl:when test="$gCurrentView = 'thumb'">
            <xsl:value-of select="$header-thumb" />
            <xsl:text> </xsl:text>
            <xsl:value-of select="$default-tail" />
          </xsl:when>
          <xsl:when test="$gCurrentView = 'image'">
            <xsl:text>Image of individual page</xsl:text>
            <xsl:text> </xsl:text>
            <xsl:value-of select="$default-tail" />
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>Text of individual page</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </h2>
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
      <form action="pt" method="get" class="mdpSectionForm">
        <xsl:if test="$target = 'header'">
          <xsl:attribute name="id">mdpSectionForm</xsl:attribute>
        </xsl:if>
        <div class="mdpSectionOptions">
          <xsl:if test="$gFeatureList/Feature">
            <xsl:call-template name="BuildContentsList">
              <xsl:with-param name="target" select="$target" />
            </xsl:call-template>
          </xsl:if>
        </div>
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
          <a href="{$href}" class="rotate-counterclockwise rotateAction tracked interactive" data-tracking-action="PT Rotate Left" data-tracking-category="PT">
            <xsl:if test="$target = 'header'">
              <xsl:attribute name="id">rotate-counterclockwise</xsl:attribute>
            </xsl:if>
            <xsl:text>Rotate left</xsl:text>
          </a>
        </li>
        <li class="PTiconButton">
          <xsl:variable name="href" select="/MBooksTop/MdpApp/RotateLinks/ClockwiseLink" />
          <a href="{$href}" class="rotate-clockwise rotateAction tracked interactive" data-tracking-action="PT Rotate Right" data-tracking-category="PT">
            <xsl:if test="$target = 'header'">
              <xsl:attribute name="id">rotate-clockwise</xsl:attribute>
            </xsl:if>
            <xsl:text>Rotate right</xsl:text>
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
      <option value="">Jump to Section</option>
      <xsl:for-each select="$gFeatureList/Feature">
        <xsl:element name="option">
          <xsl:attribute name="value">
            <xsl:value-of select="Seq" />
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
        <form method="get" action="pt" class="mdpPageForm">
          <xsl:if test="$target = 'header'">
            <xsl:attribute name="id">mdpPageForm</xsl:attribute>
          </xsl:if>

          <xsl:variable name="jumpToId">
            <xsl:choose>
              <xsl:when test="$target = 'header'">BRpagenum</xsl:when>
              <xsl:otherwise>BRPagenumFooter</xsl:otherwise>
            </xsl:choose>
          </xsl:variable>

          <input type="hidden" name="u" value="1" />

          <label for="{$jumpToId}">Jump to </label>

          <xsl:element name="input">
            <xsl:attribute name="id"><xsl:value-of select="$jumpToId" /></xsl:attribute>
            <xsl:attribute name="type">text</xsl:attribute>
            <xsl:attribute name="size">8</xsl:attribute>
            <xsl:attribute name="name">num</xsl:attribute>
            <xsl:attribute name="title">Page Number</xsl:attribute>
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
            <!-- <xsl:attribute name="title">Jump to this sequential page in the text</xsl:attribute>
             -->
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
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpFirstPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">mdpFirstPageLink tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT First Page</xsl:attribute>
<!--               <xsl:attribute name="title">First [f]</xsl:attribute> -->
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/FirstPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">f</xsl:attribute>
              </xsl:if>
              <xsl:text>First [f]</xsl:text>

<!--               <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"><xsl:text> </xsl:text></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_first.png'"/>
                </xsl:attribute>
              </xsl:element> -->
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
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpPreviousPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">mdpPreviousPageLink tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Previous Page</xsl:attribute>
              <!-- <xsl:attribute name="title">Previous [p]</xsl:attribute> -->
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">p</xsl:attribute>
              </xsl:if>
              <xsl:text>Previous [p]</xsl:text>
<!--               <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"><xsl:text> </xsl:text></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_previous.png'"/>
                </xsl:attribute>
              </xsl:element> -->
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
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpNextPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">mdpNextPageLink tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Next Page</xsl:attribute>
<!--               <xsl:attribute name="title">Next [n]</xsl:attribute> -->
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">n</xsl:attribute>
              </xsl:if>
              <xsl:text>Next [n]</xsl:text>
<!--               <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"><xsl:text> </xsl:text></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next.png'"/>
                </xsl:attribute>
              </xsl:element> -->
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
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="id">mdpLastPageLink</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="class">mdpLastPageLink tracked interactive </xsl:attribute>
              <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
              <xsl:attribute name="data-tracking-action">PT Last Page</xsl:attribute>
<!--               <xsl:attribute name="title">Last [l]</xsl:attribute> -->
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/LastPageLink"/>
              </xsl:attribute>
              <xsl:if test="$target = 'header'">
                <xsl:attribute name="accesskey">l</xsl:attribute>
              </xsl:if>
              <xsl:text>Last [l]</xsl:text>
<!--               <xsl:element name="img">
                <xsl:attribute name="height">25</xsl:attribute>
                <xsl:attribute name="width">17</xsl:attribute>
                <xsl:attribute name="alt"><xsl:text> </xsl:text></xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:text>//common-web/graphics/harmony/icon_last.png</xsl:text>
                </xsl:attribute>
              </xsl:element> -->
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

    <xsl:variable name="orphan_canditate_msg">
      <strong>This volume is an Orphan Works candidate.</strong> <ul><li>The Orphan Works Project is a framework for libraries to determine whether books in their collections are subject to copyright but whose copyright holders cannot be identified or contacted.</li><li>If you are a bona fide copyright holder of this volume, please contact us at the
      <a title="Orphan Works Project" href="http://www.lib.umich.edu/orphan-works/copyright-holders-we-want-hear-you"> Orphan Works Project.</a></li></ul>
    </xsl:variable>

    <xsl:variable name="copyright_restricted_msg">
      Full view is not available for this item<br/> due to copyright &#169; restrictions.
    </xsl:variable>

    <!-- now handle the view type -->
    <xsl:choose>

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

      <xsl:when test="$gFinalView='missing'">
        <div id="mdpTextMissingPage">
          <div class="mdpTMPhead">PAGE NOT AVAILABLE</div>
          <div class="mdpTMPtext"><a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable">Learn more.</a></div>
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
    <xsl:copy-of select="."/>
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

  <xsl:template name="pageviewer-footer">
    <xsl:call-template name="footer">
      <xsl:with-param name="gUsingBookReader" select="$gUsingBookReader" />
    </xsl:call-template>
  </xsl:template>

</xsl:stylesheet>

