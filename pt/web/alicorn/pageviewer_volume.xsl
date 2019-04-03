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
      <xsl:when test="$currentView = 'text'">plaintext</xsl:when>
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
      <xsl:when test="$gCurrentView='image' or $gUsingBookReader = 'true'">
        <xsl:value-of select="$gCurrentView"/>
      </xsl:when>
      <xsl:when test="$gCurrentPageOcr=''">
        <xsl:value-of select="'empty'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$gCurrentView"/>
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

  <xsl:variable name="gUsingPageImages">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'"><xsl:value-of select="'false'" /></xsl:when>
      <xsl:when test="$gCurrentView = '1up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = '2up'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'thumb'"><xsl:value-of select="'true'" /></xsl:when>
      <xsl:when test="$gCurrentView = 'image'"><xsl:value-of select="'true'" /></xsl:when>
      <!-- <xsl:when test="$gCurrentView = 'text'"><xsl:value-of select="'true'" /></xsl:when> -->
      <xsl:otherwise><xsl:value-of select="'false'" /></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/pt/alicorn/css/main.css{$timestamp}" />
    <!-- <link rel="stylesheet" href="/pt/css/print.css{$timestamp}" media="print" /> -->

    <xsl:if test="$gUsingPageImages = 'true'">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>

  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:if test="$gUsingBookReader = 'false'">
      <xsl:text> view-</xsl:text><xsl:value-of select="$gCurrentView" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes">
    <xsl:if test="$gUsingBookReader = 'true'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-extra-html-class">
    <xsl:if test="$gSuppressAccessBanner = 'true'">
      <xsl:text> supaccban </xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks" class="offscreen">
      <li><a href="#main">Skip to page content</a></li>
      <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
      <li><a href="#input-search-text">Skip to search in this text</a></li>
      <li><a href="#sidebar">Skip to book options</a></li>
    </ul>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="main">
    <xsl:call-template name="toolbar-horizontal" />
    <div class="inner main">
      <section class="viewer">
        <div class="viewer-inner"></div>
      </section>
      <xsl:call-template name="toolbar-vertical" />
    </div>
    <div class="navigator">
      <input id="control-navigator" type="range" name="locations-range-value" min="0" max="100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% • Page scan 0 of ?" value="0" data-background-position="0" />
    </div>
    <!-- <script type="text/javascript" src="/pt/alicorn/js/main.js"></script> -->
  </xsl:template>

  <xsl:template name="xxx-main">
    <xsl:call-template name="toolbar-horizontal" />
    <xsl:call-template name="toolbar-vertical" />
    <!-- <div class="main-wrap"> -->
      <div class="pages">
        <div class="pages-inner"></div>
      </div>
      <div class="navigator">
        <!-- <input type="range" id="control-navigator" /> -->
        <input class="cozy-navigator-range__input" id="control-navigator" type="range" name="locations-range-value" min="0" max="100" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0" aria-valuetext="0% • Page Scan 0 of ?" value="0" data-background-position="0" />
        <xsl:text> </xsl:text>
        <output>Page Scan <span>0</span> of <span>N</span></output>
        <button>Go...</button>
        <!-- <div class="navigator-range__background"></div> -->
      </div>
    <!-- </div> -->
    <script type="text/javascript" src="/pt/alicorn/js/main.js"></script>
  </xsl:template>

  <xsl:template name="xx-main">
    <div class="main" id="main" role="main" tabindex="-1">
      <h2 class="offscreen">
        <xsl:call-template name="get-view-title" />
        <xsl:if test="$gHasOcr = 'YES'">
          <xsl:text> (use access key 5 to view full text / OCR mode)</xsl:text>
        </xsl:if>
      </h2>
      <xsl:call-template name="toolbar-horizontal" />
      <xsl:call-template name="toolbar-vertical" />
      <div id="scrolling">
        <xsl:call-template name="page-content" />
      </div>
    </div>
  </xsl:template>

  <xsl:template name="get-view-title">Main Content</xsl:template>

  <xsl:template name="toolbar-vertical">
    <div id="toolbar-vertical" class="toolbar toolbar-vertical" role="toolbar" aria-label="Viewing Options">
      <div class="btn-group btn-group-vertical action-views">
        <xsl:call-template name="action-view-button">
          <xsl:with-param name="view">plaintext</xsl:with-param>
        </xsl:call-template>
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
          <xsl:with-param name="view">image</xsl:with-param>
        </xsl:call-template>
      </div>
      <xsl:call-template name="action-fullscreen" />
      <xsl:call-template name="action-resize" />

      <div class="btn-group btn-group-vertical">
        <button href="{//RotateLinks/CounterClockwiseLink}" id="action-rotate-counterclockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Counterclockwise"><i class="icomoon icomoon-reload-CCW"></i><span class="toolbar-label"> Rotate left</span></button>
        <button href="{//RotateLinks/ClockwiseLink}" id="action-rotate-clockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Clockwise"><i class="icomoon icomoon-reload-CW"></i><span class="toolbar-label"> Rotate right</span></button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="action-fullscreen">
    <div class="btn-group btn-group-vertical">
      <button id="action-toggle-fullscreen" type="button" class="btn square alone" data-toggle="tracking" data-tracking-action="PT Full Screen"><i class="icomoon icomoon-fullscreen"></i><span class="toolbar-label"> Full Screen</span></button>
    </div>
  </xsl:template>

  <xsl:template name="action-resize">
    <div class="btn-group btn-group-vertical">
      <button href="{//ResizeLinks/ResizeInLink}" id="action-zoom-in" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Zoom In"><i class="icomoon icomoon-iconmonstr-magnifier-6-icon" style=""></i><span class="toolbar-label"> Zoom In</span></button>
      <button href="{//ResizeLinks/ResizeOutLink}" id="action-zoom-out" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Zoom Out"><i class="icomoon icomoon-iconmonstr-magnifier-7-icon" style=""></i><span class="toolbar-label"> Zoom Out</span></button>
    </div>
  </xsl:template>

  <xsl:template name="action-view-button">
    <xsl:param name="view" />
    <xsl:variable name="options">
      <h:select>
        <h:option name="1up" value="icomoon icomoon-scroll">Scroll</h:option>
        <h:option name="2up" value="icomoon icomoon-book-alt2">Flip</h:option>
        <h:option name="thumb" value="icomoon icomoon-gridview">Thumbnail</h:option>
        <h:option name="image" value="icomoon icomoon-documents">Page by Page</h:option>
        <h:option name="plaintext" value="icomoon icomoon-article" accesskey="5">Plain Text</h:option>
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

    <button href="{$href}" data-target="{$option/@name}" type="button" class="btn square {$active}" data-toggle="tooltip tracking" data-tracking-action="PT {$option}">
      <xsl:if test="$option/@accesskey">
        <xsl:attribute name="accesskey"><xsl:value-of select="$option/@accesskey" /></xsl:attribute>
      </xsl:if>
      <i class="{$option/@value}"></i> <span class="toolbar-label"><xsl:value-of select="$option" /></span>
    </button>
  </xsl:template>

  <xsl:template name="toolbar-horizontal">
    <div id="toolbar-horizontal" class="toolbar toolbar-horizontal" role="toolbar" aria-label="Volume Navigation">

      <xsl:call-template name="action-go-page" />

      <div class="btn-group table-of-contents">
        <xsl:call-template name="action-table-of-contents" />
      </div>

      <div class="btn-group table-of-contents" id="selection-contents">
        <xsl:call-template name="action-selection-contents" />
      </div>

      <xsl:call-template name="action-search-volume" />

      <div class="btn-group">
        <xsl:call-template name="action-page-navigation" />
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
    <form class="form-inline" method="get" action="pt" id="form-go-page">
      <label for="input-go-page">Jump to </label>
      <input id="input-go-page" name="num" type="text" placeholder="" value="{$pageNum}" class="input-mini" />
      <button id="action-go-page" type="submit" class="btn" data-toggle="tracking" data-tracking-action="PT Jump to Section">Go</button>
      <input type="hidden" name="u" value="1" />
      <xsl:apply-templates select="//PageXOfYForm/HiddenVars"/>
      <xsl:if test="not(//PageXOfYForm/HiddenVars/Variable[@name='seq'])">
        <input type="hidden" name="seq" value="" />
      </xsl:if>
      <xsl:call-template name="HiddenDebug"/>
    </form>
  </xsl:template>

  <xsl:template name="action-page-navigation">
    <button id="action-go-first" href="{//FirstPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT First Page" accesskey="f"><i class="icomoon icomoon-first"></i><span class="toolbar-label"> First</span></button>
    <button id="action-go-prev" href="{//PreviousPageLink}" type="button" class="btn square"><i class="icomoon icomoon-go-previous" data-toggle="tracking" data-tracking-action="PT Previous Page" accesskey="p"></i><span class="toolbar-label"> Previous</span></button>
    <button id="action-go-next" href="{//NextPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Next Page" accesskey="n"><i class="icomoon icomoon-go-next"></i><span class="toolbar-label"> Next</span></button>
    <button id="action-go-last" href="{//LastPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Last Page" accesskey="l"><i class="icomoon icomoon-last"></i><span class="toolbar-label"> Last</span></button>
  </xsl:template>

  <xsl:template name="action-table-of-contents">
    <button type="button" class="btn dropdown-toggle square" data-toggle="dropdown">
      <i class="icomoon icomoon-list"></i><span class="toolbar-label"> Jump to section</span> <span class="caret"></span>
    </button>
    <ul class="dropdown-menu scrollable-list">
      <xsl:for-each select="$gFeatureList/Feature">
        <li>
          <a href="{Link}" data-seq="{Seq}">
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

  <xsl:template name="action-selection-contents">
    <button type="button" class="btn dropdown-toggle square disabled" data-toggle="dropdown">
      <i class="icomoon icomoon-attachment"></i><span class="toolbar-label"> Jump to selected page</span> <span class="msg"></span> <span class="caret"></span>
    </button>
    <ul class="dropdown-menu scrollable-list"></ul>
  </xsl:template>

  <xsl:template name="page-content">
    <div id="content">
      <xsl:choose>
        <xsl:when test="$gFinalView = 'empty'">
          <xsl:call-template name="page-content-empty" />
        </xsl:when>
        <xsl:when test="$gFinalView = 'missing'">
          <xsl:call-template name="page-content-missing" />
        </xsl:when>
        <xsl:otherwise>
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
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="page-content-reader">
    <div class="page-item">
      <div class="alert alert-info alert-block startup">
        <p>Loading <em><xsl:value-of select="$gTitleString" /></em>. <img src="/pt/graphics/thumb-loader.gif" /></p>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-image">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <div class="page-item size-{//CurrentCgi/Param[@name='size']}" data-seq="{$seq}" id="page{$seq}">
      <div class="page-wrap">
        <img alt="image of individual page" src="{//CurrentPageImageSource}" />
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-plaintext">
    <xsl:variable name="seq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']" />
    <div class="page-item page-text loaded" data-seq="{$seq}" id="page{$seq}">
      <div class="page-wrap">
        <div class="page-inner">
          <p>
            <xsl:apply-templates select="//CurrentPageOcr" mode="copy-guts" />
          </p>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="page-content-empty">
    <xsl:choose>
      <xsl:when test="$gHasOcr = 'YES'">
        <div class="alert alert-block alert-info alert-headline">
          <p>
            NO TEXT ON PAGE
          </p>
        </div>
        <p>
          This page does not contain any text recoverable by the OCR engine.
        </p>
      </xsl:when>
      <xsl:otherwise>
        <div class="alert alert-block alert-info alert-headline">
          <p>
            NO TEXT IN THIS ITEM
          </p>
        </div>
        <p>
          This item consists only of page images without any OCR text.
        </p>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="page-content-missing">
    <div class="alert alert-block alert-info alert-headline">
      <p>
        PAGE NOT AVAILABLE
      </p>

      <br />
      <a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable" class="btn btn-primary">Learn more.</a>
    </div>
  </xsl:template>

  <xsl:template match="node()" mode="copy-guts">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="node()[name()]" mode="copy" priority="10">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>

