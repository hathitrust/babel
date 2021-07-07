<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:h="http://www.hathitrust.org" xmlns:METS="http://www.loc.gov/METS/" xmlns:PREMIS="http://www.loc.gov/standards/premis" xmlns="http://www.w3.org/1999/xhtml" xmlns:xlink="https://www.w3.org/1999/xlink"
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
      <xsl:otherwise><xsl:value-of select="'true'" /></xsl:otherwise>
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
    <xsl:call-template name="build-css-link">
      <xsl:with-param name="href" select="'/pt/alicorn/css/app.css'" />
    </xsl:call-template>

    <!-- <link rel="stylesheet" href="/pt/alicorn/css/main.css?_{$gTimestamp}" /> -->
    <!-- <link rel="stylesheet" href="/pt/css/print.css{$timestamp}" media="print" /> -->

    <xsl:if test="$gUsingPageImages = 'true'">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>

    <xsl:call-template name="build-hotjar-script" />

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
    <xsl:attribute name="data-sidebar-collapsible">true</xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-html-class">
    <xsl:if test="$gSuppressAccessBanner = 'true'">
      <xsl:text> supaccban </xsl:text>
    </xsl:if>
    <xsl:if test="//Param[@name='debug'] = 'polite'">
      <xsl:text> debugpolite</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-extra-header--reader">
    <script>
      HT.params.featureList = <xsl:value-of select="concat(//Manifest/FeatureList, ';')"  />
    </script>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li><a href="#section" accesskey="2">Skip to page content</a></li>
        <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
        <li><a href="#input-search-text">Skip to search in this text</a></li>
        <!-- <li><a href="#sidebar">Skip to book options</a></li> -->
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="build-extra-header" />

  <xsl:template name="build-main-container">
    <main class="app--container" id="main">
      <xsl:call-template name="build-reader-toolbar-controls" />
      <xsl:call-template name="build-main-container-main" />
      <div class="app--sidebar--toggle--container">
        <button class="btn mq--wide" id="action-toggle-sidebar" aria-expanded="true">
          <i class="icomoon toggle-sidebar row" aria-hidden="true"></i>
          <span class="offscreen">Toggle Options</span>
          <span class="mq--narrow flex-space-between flex-center">
            <span class="filter-group-heading">Options</span>
            <i class="icomoon icomoon-sidebar-toggle column" aria-hidden="true"></i>
          </span>
        </button>
        <button class="btn mq--narrow" id="action-toggle-sidebar-narrow" aria-expanded="false">
          <span class="flex-space-between flex-center">
            <span class="filter-group-heading">Options</span>
            <i class="icomoon icomoon-sidebar-toggle column" aria-hidden="true"></i>
          </span>
        </button>
      </div>
      <div class="app--sidebar scroll-gradient" id="sidebar">
        <!-- <xsl:call-template name="build-access-alert-block" /> -->
        <div class="app--panels">
          <xsl:call-template name="sidebar" />
        </div>
      </div>
      <xsl:call-template name="build-main-app-script" />
      <xsl:call-template name="build-main-container-extra" />
    </main>
  </xsl:template>

  <xsl:template name="build-main-container-main">
    <div class="app--reader" data-view="1up">
      <xsl:call-template name="build-reader" />
    </div>
  </xsl:template>

  <xsl:template name="build-reader">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />
    <h2 class="offscreen">
      <xsl:call-template name="get-view-title" />
    </h2>
    <!-- <xsl:call-template name="build-reader-toolbar-controls" /> -->
    <div id="section" class="app--reader--container">
      <section class="app--reader--viewer">
        <xsl:attribute name="data-has-ocr">
          <xsl:choose>
            <xsl:when test="$gHasOcr = 'YES'">true</xsl:when>
            <xsl:otherwise>false</xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="data-allow-full-download">
          <xsl:choose>
            <xsl:when test="$gFullPdfAccess = 'allow'">true</xsl:when>
            <xsl:otherwise>false</xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="data-reading-order"><xsl:value-of select="$readingOrder" /></xsl:attribute>
        <xsl:attribute name="data-total-seq"><xsl:value-of select="$totalSeq" /></xsl:attribute>
        <xsl:attribute name="data-default-seq"><xsl:value-of select="//Manifest/DefaultSeq" /></xsl:attribute>
        <xsl:attribute name="data-first-seq"><xsl:value-of select="//Manifest/FirstPageSeq" /></xsl:attribute>
        <xsl:attribute name="data-default-height"><xsl:value-of select="//Manifest/BaseImage/Height" /></xsl:attribute>
        <xsl:attribute name="data-default-width"><xsl:value-of select="//Manifest/BaseImage/Width" /></xsl:attribute>
        <!-- <xsl:attribute name="data-feature-list"><xsl:value-of select="//Manifest/FeatureList" /></xsl:attribute> -->
        <xsl:attribute name="data-htid"><xsl:value-of select="//Param[@name='id']" /></xsl:attribute>
      </section>
    </div>
    <div class="app--reader--toolbar">
      <button id="action-expando" class="btn for-mobile" aria-label="Toggle Controls" aria-expanded="true">
        <i class="icomoon" aria-hidden="true"></i>
      </button>
      <xsl:call-template name="build-reader-toolbar-navigator">
        <xsl:with-param name="currentSeq" select="$currentSeq" />
        <xsl:with-param name="totalSeq" select="$totalSeq" />
        <xsl:with-param name="readingOrder" select="$readingOrder" />
      </xsl:call-template>
    </div>

    <xsl:call-template name="load-extra-main-script" />
  </xsl:template>

  <xsl:template name="build-reader-toolbar-navigator">
    <xsl:param name="currentSeq" />
    <xsl:param name="totalSeq" />
    <xsl:param name="readingOrder" />

    <form class="app--reader--navigator">
      <div class="navigator-range-wrap">
        <input class="navigator-range" type="range" min="1" max="{$totalSeq}" value="{$currentSeq}">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="dir">rtl</xsl:attribute>
          </xsl:if>
        </input>
      </div>
      <div class="navigator-output">
        <!-- <span data-slot="seq">15</span> -->
        <span>#</span>
        <input type="text" name="navigator-input-seq" value="{$currentSeq}">
          <xsl:attribute name="size">
            <xsl:value-of select="string-length($totalSeq)" />
          </xsl:attribute>
        </input>
        <span> / </span>
        <span data-slot="total-seq"><xsl:value-of select="$totalSeq" /></span>
      </div>
      <button id="action-prompt-seq" class="btn">
        <!-- <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-card-list</xsl:with-param>
        </xsl:call-template> -->
        <span>Jump...</span>
      </button>

      <button tabindex="-1" id="action-focus-current-page" aria-hidden="true" style="display: none" accesskey="9">Show Current Page</button>
      <button tabindex="-1" id="action-proxy-navigation-f" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="f" data-target="action-go-first">Go First</button>
      <button tabindex="-1" id="action-proxy-navigation-p" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="p" data-target="action-go-prev">Go Previous</button>
      <button tabindex="-1" id="action-proxy-navigation-x" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="x" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-n" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="n" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-l" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="l" data-target="action-go-last">Go Last</button>

    </form>
  </xsl:template>


  <xsl:template name="build-reader-toolbar-controls">
    <div class="app--reader--toolbar--controls">
      <xsl:call-template name="build-reader-toolbar-paginator" />
      <xsl:call-template name="build-reader-toolbar-options" />
    </div>
  </xsl:template>

  <xsl:template name="build-reader-toolbar-options">
    <xsl:call-template name="toolbar-vertical" />
  </xsl:template>

  <xsl:template name="build-reader-toolbar-paginator">
    <xsl:call-template name="toolbar-horizontal" />
  </xsl:template>

  <xsl:template name="build-main-container-extra">
    <!-- <xsl:call-template name="build-reader-toolbar-controls" /> -->
  </xsl:template>

  <xsl:template name="load-extra-main-script" />

  <xsl:template name="get-view-title">Main Content</xsl:template>

  <xsl:template name="build-pre-sidebar-panels">
    <div class="panel options for-mobile">
      <!-- <h3 class="for-mobile">View Options</h3> -->
      <ul>
        <li><button class="btn" data-trigger="contents"><span><i class="icomoon icomoon-list" aria-hidden="true"></i> Contents</span></button></li>
        <li style="margin-top: 1rem; margin-bottom: 1rem;">
          <form action="/cgi/pt/search" id="form-search-volume-2" class="form-search-volume" role="search" style="padding: 0.5rem; border: 1px solid #ddd">
            <label style="text-align: center" for="input-search-text">Search in this text </label>
            <input id="input-search-text" name="q1" type="text" style="width: 100%; margin-bottom: 0.25rem; display: block">
              <xsl:if test="$gHasOcr!='YES'">
                <xsl:attribute name="disabled">disabled</xsl:attribute>
              </xsl:if>
              <xsl:attribute name="placeholder">
                <xsl:choose>
                  <xsl:when test="$gHasOcr = 'YES'">
                    <!-- <xsl:text>Search in this text</xsl:text> -->
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>No text to search in this item</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:attribute name="value">
                <xsl:if test="$gHasOcr = 'YES' and $gCurrentQ1 != '*'">
                  <xsl:value-of select="$gCurrentQ1" />
                </xsl:if>
              </xsl:attribute>
            </input>
            <button class="btn" style="display: block; margin-left: 0" data-trigger="search"><span><i class="icomoon icomoon-search"></i> Find</span></button>
            <xsl:apply-templates select="//MdpApp/SearchForm/HiddenVars" />
            <input type="hidden" name="view" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']}" />
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
              <input type="hidden" name="seq" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']}" />
            </xsl:if>
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
              <input type="hidden" name="num" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']}" />
            </xsl:if>
            <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
              <input type="hidden" name="debug" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']}" />
            </xsl:if>
          </form>
        </li>

        <li class="toggle--500"><button class="btn action-zoom-in"><span><i class="icomoon icomoon-zoom-in"></i> Zoom In</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-out"><span><i class="icomoon icomoon-zoom-out"></i> Zoom Out</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-reset"><span><i class="icomoon icomoon-document"></i> Fit to Page</span></button></li>

        <li class="toggle--500" style="margin-top: 1rem">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">plaintext</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">1up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">2up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">thumb</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">image</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="configure-this-book">
    <div class="panel mq--narrower configure">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-sliders</xsl:with-param>
        </xsl:call-template>
        <span>Configure</span>
      </h3>
      <ul>
        <li class="toggle--500"><button class="btn action-zoom-in"><span><i class="icomoon icomoon-zoom-in"></i> Zoom In</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-out"><span><i class="icomoon icomoon-zoom-out"></i> Zoom Out</span></button></li>
        <li class="toggle--500"><button class="btn action-zoom-reset"><span><i class="icomoon icomoon-document"></i> Fit to Page</span></button></li>

        <li class="toggle--500" style="margin-top: 1rem">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">plaintext</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">1up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">2up</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">thumb</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
        <li class="toggle--500">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">image</xsl:with-param>
            <xsl:with-param name="show-label">TRUE</xsl:with-param>
          </xsl:call-template>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="sidebar-table-of-contents">
    <div class="panel mq--narrow app--panel--contents" rel="note">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-list</xsl:with-param>
        </xsl:call-template>
        <span>Table of Contents</span>
      </h3>

      <ul class="scrollable-list action-contents-navigation">
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
    </div>
  </xsl:template>


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

      <div class="btn-group btn-group-vertical action-rotate">
        <button href="{//RotateLinks/CounterClockwiseLink}" id="action-rotate-counterclockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Counterclockwise" aria-label="Rotate Counter-clockwise" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-reload-CCW"></i></button>
        <button href="{//RotateLinks/ClockwiseLink}" id="action-rotate-clockwise" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Rotate Clockwise" aria-label="Rotate Clockwise" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-reload-CW"></i></button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="action-fullscreen">
    <div class="btn-group btn-group-vertical action-fullscreen" data-expanded="false">
      <button data-target="enter-fullscreen" id="action-toggle-enter-fullscreen" type="button" class="btn square alone" data-toggle="tracking" data-tracking-action="PT Full Screen" aria-label="View Full Screen" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-fullscreen"></i></button>
      <button data-target="exit-fullscreen" id="action-toggle-exit-fullscreen" type="button" class="btn square alone" data-toggle="tracking" data-tracking-action="PT Full Screen" aria-label="Exit Full Screen" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-fullscreen-exit"></i></button>
    </div>
  </xsl:template>

  <xsl:template name="action-resize">
    <div class="btn-group btn-group-vertical action-zoom">
      <button href="{//ResizeLinks/ResizeInLink}" id="action-zoom-in" type="button" class="btn square action-zoom-in" data-toggle="tracking" data-tracking-action="PT Zoom In" aria-label="Zoom In" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-zoom-in" aria-hidden="true"></i></button>
      <button href="{//ResizeLinks/ResizeOutLink}" id="action-zoom-out" type="button" class="btn square action-zoom-out" data-toggle="tracking" data-tracking-action="PT Zoom Out" aria-label="Zoom Out" data-microtip-position="left" data-microtip-size="small" data-role="tooltip"><i class="icomoon icomoon-zoom-out" aria-hidden="true"></i></button>
    </div>
  </xsl:template>

  <xsl:template name="action-view-button">
    <xsl:param name="view" />
    <xsl:param name="show-label" />
    <xsl:variable name="role">
      <xsl:choose>
        <xsl:when test="$show-label = 'TRUE'">x-tooltip</xsl:when>
        <xsl:otherwise>tooltip</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="options">
      <h:select>
        <h:option name="1up" value="icomoon icomoon-scroll">Scroll Page Scans</h:option>
        <h:option name="2up" value="icomoon icomoon-book-alt2">Flip Page Scans</h:option>
        <h:option name="thumb" value="icomoon icomoon-gridview">View Thumbnails</h:option>
        <h:option name="image" value="icomoon icomoon-documents">View Page by Page</h:option>
        <h:option name="plaintext" value="icomoon icomoon-article">View Plain Text</h:option>
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

    <button href="{$href}" data-target="{$option/@name}" type="button" class="action-view btn square" data-toggle="tooltip tracking" data-tracking-action="PT {$option}" aria-label="{$option}" data-microtip-position="left" data-microtip-size="small" data-role="{$role}">
      <xsl:if test="$option/@accesskey">
        <xsl:attribute name="accesskey"><xsl:value-of select="$option/@accesskey" /></xsl:attribute>
      </xsl:if>
      <xsl:if test="$view = $gCurrentView">
        <xsl:attribute name="aria-pressed">true</xsl:attribute>
      </xsl:if>
      <i class="{$option/@value}"></i>
      <xsl:if test="$show-label = 'TRUE'">
        <span aria-hidden="true"><xsl:value-of select="$option" /></span>
      </xsl:if>
    </button>
  </xsl:template>

  <xsl:template name="toolbar-horizontal">
    <div id="toolbar-horizontal" class="toolbar toolbar-horizontal" role="toolbar" aria-label="Volume Navigation">

      <xsl:call-template name="action-go-page" />

      <div class="btn-group table-of-contents mq--wide">
        <xsl:call-template name="action-table-of-contents" />
      </div>

      <xsl:call-template name="action-search-volume">
        <xsl:with-param name="class">mq--wide</xsl:with-param>
      </xsl:call-template>

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
    <button id="action-go-first" href="{//FirstPageLink}" type="button" class="btn square mq--wide" data-toggle="tracking" data-tracking-action="PT First Page" aria-label="Go to first page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-first"></i></button>
    <button id="action-go-prev" href="{//PreviousPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Previous Page" aria-label="Go to previous page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-go-previous"></i></button>
    <button id="action-go-next" href="{//NextPageLink}" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Next Page" aria-label="Go to next page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-go-next"></i></button>
    <button id="action-go-last" href="{//LastPageLink}" type="button" class="btn square mq--wide" data-toggle="tracking" data-tracking-action="PT Last Page" aria-label="Go to last page scan" data-microtip-position="bottom" data-microtip-size="small" data-role="x-tooltip"><i class="icomoon icomoon-last"></i></button>
  </xsl:template>

  <xsl:template name="action-table-of-contents">
    <button type="button" class="btn dropdown-toggle square" data-toggle="dropdown" aria-label="Jump to section" data-microtip-position="bottom" data-microtip-size="small" data-role="tooltip">
      <i class="icomoon icomoon-list"></i><span class="caret"></span>
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
    <button type="button" class="btn dropdown-toggle square disabled" data-toggle="dropdown" aria-label="Jump to selected page" data-microtip-position="bottom" data-microtip-size="small" data-role="tooltip">
      <i class="icomoon icomoon-copy"></i><span class="caret"></span>
      <span class="msg"></span>
    </button>
    <ul class="dropdown-menu scrollable-list selected-list"></ul>
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

  <xsl:template name="build-main-app-script">
    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/alicorn/js/main.js']/@modtime" />
    <script type="text/javascript">
      <xsl:text>head.load('/pt/alicorn/js/main.js?_</xsl:text>
      <xsl:value-of select="$modtime" />
      <xsl:text>')</xsl:text>
    </script>
  </xsl:template>

  <xsl:template name="build-access-alert-details">
    <xsl:variable name="access-type" select="//AccessType" />
    <!-- debugging aid -->
    <!-- <xsl:variable name="access-type-tmp">
      <AccessType xmlns="">
        <Name>emergency_access_affiliate</Name>
      </AccessType>
    </xsl:variable>
    <xsl:variable name="access-type" select="exsl:node-set($access-type-tmp)//AccessType" /> -->
    <xsl:if test="( $gFinalAccessStatus='allow' and $gInCopyright='true' )">
      <xsl:variable name="alert-tmp">
        <xsl:if test="$access-type/Name = 'emergency_access_affiliate'">
          <xsl:call-template name="build-emergency-access-affiliate-header" />
        </xsl:if>
        <xsl:if test="$access-type/Name = 'in_library_user'">
          <xsl:call-template name="build-in-library-user-header" />
        </xsl:if>
        <xsl:if test="$gLoggedIn='YES' and $gSSD_Session='true'">
          <xsl:call-template name="build-ssd-session-header" />
        </xsl:if>
        <xsl:if test="$access-type/Name = 'enhanced_text_user'">
          <xsl:call-template name="build-ssd-session-header" />
        </xsl:if>
      </xsl:variable>
      <xsl:variable name="alert" select="exsl:node-set($alert-tmp)/node()" />
      <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name=$alert/@id]/Value" />
      <details class="details--alert iconless special-access" data-access-type="{$access-type/Name}">
        <xsl:attribute name="id">
          <xsl:value-of select="$alert/@id" />
        </xsl:attribute>
        <xsl:if test="$state = 'open' or normalize-space($state) = ''">
          <xsl:attribute name="open">open</xsl:attribute>
        </xsl:if>
        <xsl:attribute name="data-initialized">
          <xsl:value-of select="$alert/@data-initialized" />
        </xsl:attribute>
        <xsl:if test="$alert/@data-access-expires">
          <xsl:attribute name="data-access-expires">
            <xsl:value-of select="$alert/@data-access-expires" />
          </xsl:attribute>
          <xsl:attribute name="data-access-expires-seconds">
            <xsl:value-of select="$alert/@data-access-expires-seconds" />
          </xsl:attribute>
        </xsl:if>
        <summary>
          <div class="summary">
            <span>
              <xsl:if test="$access-type/Name = 'emergency_access_affiliate'">
                <xsl:text>Checked out until </xsl:text>
                <span class="expires-display"></span>
              </xsl:if>
              <xsl:if test="$access-type/Name = 'in_library_user'">
                <xsl:text>Checked out until </xsl:text>
                <span class="expires-display"></span>
              </xsl:if>
              <xsl:if test="$gLoggedIn='YES' and $gSSD_Session='true'">
                <xsl:text>In-Copyright Access</xsl:text>
              </xsl:if>
              <xsl:if test="$access-type/Name = 'enhanced_text_user'">
                <xsl:text>In-Copyright Access</xsl:text>
              </xsl:if>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
              <use xlink:href="#panel-collapsed"></use>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
              <use xlink:href="#panel-expanded"></use>
            </svg>
          </div>
        </summary>
        <div>
          <xsl:apply-templates select="$alert/*" mode="copy" />
        </div>
      </details>
    </xsl:if>
  </xsl:template>

  <xsl:template name="list-surveys">
    <xsl:call-template name="build-survey-panel" />
    <xsl:call-template name="build-access-alert-details" />
    <xsl:call-template name="build-beta-alert-details" />
  </xsl:template>

  <xsl:template name="build-beta-alert-details">
    <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='beta-notice-2021']/Value" />
    <details class="details--alert beta" id="beta-notice-2021" data-open="{$state}">
      <xsl:if test="$state = 'open' or normalize-space($state) = ''">
        <xsl:attribute name="open">open</xsl:attribute>
      </xsl:if>
      <summary style="font-weight: bold; padding-left: 0.25rem">
        <div class="summary">
          <span style="display: flex; flex-direction: row; align-items: center; margin-right: 0.5rem">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve" style="height: 2rem; width: 2rem;">
              <polygon points="66.608,59.075 53.333,56.286 55.247,51.667 " />
              <polygon points="75.749,44.939 68.333,33.58 72.952,31.666 " />
              <polygon points="84.167,58.333 81.667,35 86.667,35 " />
              <polygon points="32.514,65.427 11.912,76.667 10,72.048 " />
              <polygon points="73.021,77.979 58.581,86.667 56.667,82.048 " />
              <path d="M47.291,35.137l9.376-8.805l-16.12-2.26L33.344,10l-7.221,14.072L10,26.332l11.676,10.957L18.922,52.78l14.422-7.315  l14.424,7.315l-1.992-11.155c13.7,3.516,25.146,12.646,31.666,24.84c-4.509-3.027-9.935-4.798-15.774-4.798  c-6.823,0-13.051,2.447-17.941,6.468L40.84,62.5l-4.643,9.046l-10.363,1.455l7.506,7.041L31.568,90l9.271-4.7L50.11,90l-1.776-9.958  l7.499-7.041l-6.348-0.892c3.471-2.373,7.656-3.776,12.182-3.776c11.969,0,21.666,9.707,21.666,21.667H90  C90,63.535,71.826,41.365,47.291,35.137z M38.852,40.785l-5.508-2.793l-5.518,2.795l1.047-5.889L24.721,31l5.754-0.805l2.861-5.58  l2.855,5.576l5.766,0.811l-4.154,3.9L38.852,40.785z" />
              <path d="M90,16.998l-6.907-0.969L80.003,10l-3.092,6.029L70,16.998l5.003,4.695l-1.178,6.641l6.178-3.133l6.182,3.133L85,21.693  L90,16.998z" />
              <circle cx="60" cy="18.334" r="3.333" />
              <circle cx="20" cy="83.333" r="3.334" />
              <path d="M36.666,56.667c0,1.839-1.49,3.333-3.332,3.333C31.49,60,30,58.506,30,56.667c0-1.84,1.49-3.334,3.334-3.334  C35.176,53.333,36.666,54.827,36.666,56.667z" />
              <text x="0" y="115" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">Created by Danil Polshin</text>
              <text x="0" y="120" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">from the Noun Project</text>
            </svg>
            <span>The 2019 Edition</span>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
            <use xlink:href="#panel-collapsed"></use>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
            <use xlink:href="#panel-expanded"></use>
          </svg>
        </div>
      </summary>
      <div style="padding: 1rem; padding-top: 0">
        <p>
          The 2019 edition can be accessed until <strong>August 9.</strong>
          <xsl:text> </xsl:text>
          <a href="https://www.hathitrust.org/ws-book-viewer-beta-site" style="color: black; font-size: 0.875rem">Learn more</a>
        </p>
        <!-- <p>
          Try the
          <strong>new 2021 edition</strong>
          of the book reader!
          <a href="https://www.hathitrust.org/ws-book-viewer-beta-site" style="color: black; font-size: 0.875rem">Learn more</a>
        </p> -->
        <p>
          <xsl:variable name="debug">
            <xsl:choose>
              <xsl:when test="//Param[@name='debug'] = 'super'">
                <xsl:text>;debug=super</xsl:text>
              </xsl:when>
              <xsl:otherwise></xsl:otherwise>
            </xsl:choose>
          </xsl:variable>
          <a data-params-seq="true" href="/cgi/pt?id={$gHtId};seq={//Param[@name='seq']}{$debug};skin=2021;via=2019" class="action-beta-2021">Use the 2021 edition</a>
        </p>
      </div>
    </details>
  </xsl:template>

  <xsl:template name="build-survey-panel">
    <xsl:variable name="inst_id" select="//InstitutionCode" />
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:if test="false() and ( $inst_id = 'universityofcalifornia' ) and $access-type/Name = 'emergency_access_affiliate'">
      <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='uc-etas-survey']/Value" />
      <details id="uc-etas-survey" class="details--alert details--notice" data-open="{$state}">
        <xsl:if test="$state = 'open' or normalize-space($state) = ''">
          <xsl:attribute name="open">open</xsl:attribute>
        </xsl:if>
        <summary style="font-weight: bold; padding-left: 0.75rem;">
          <div class="summary">
            <span>How about a survey?</span>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
              <use xlink:href="#panel-collapsed"></use>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
              <use xlink:href="#panel-expanded"></use>
            </svg>
          </div>
        </summary>
        <div>
          <p>
            <xsl:text>Help us learn about your HathiTrust experience and win a chance at a </xsl:text>
            <strong>$50 Amazon Gift Card!</strong>
          </p>
          <p>
            <a href="https://survey.alchemer.com/s3/6380278/HathiTrust-UC-2021-Survey" target="_blank">Take our survey!</a>
          </p>
          <div style="margin-top: 1rem">
            <span class="offscreen">Sponsored by the University of California</span>
            <img style="max-width: 8rem" aria-hidden="true" src="data:image/png;base64,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" alt="" />
          </div>
        </div>
      </details>
    </xsl:if>
  </xsl:template>

  <xsl:template name="list-surveys-alert">
    <xsl:if test="false() or $gLoggedIn = 'YES'">
      <xsl:if test="true() or //Header/ProviderName = 'University of Michigan'">
        <div class="beta--panel">
          <div class="alert">
            <svg aria-hidden="true" width="24" height="24" xmlns="http://www.w3.org/2000/svg" fill-rule="evenodd" clip-rule="evenodd"><path d="M17.517 10.012c.151.23.087.541-.144.692l-2.2 1.444c-.085.056-.179.082-.274.082-.162 0-.322-.079-.418-.225-.152-.231-.087-.541.143-.692l2.201-1.445c.23-.151.541-.089.692.144m-6.242-2.595l1.111-2.385c.116-.252.414-.36.664-.243.25.117.36.413.242.664l-1.111 2.386c-.085.181-.265.288-.453.288l-.211-.047c-.25-.115-.359-.413-.242-.663m-2.624.613c1.377-2.652 1.484-5.104.318-7.286-.178-.333.066-.734.441-.734.177 0 .351.095.442.264 1.33 2.49 1.225 5.254-.314 8.217-.089.171-.263.269-.444.269-.078 0-.156-.018-.23-.056-.245-.127-.341-.429-.213-.674m15.349 5.526c0 .352-.351.588-.671.47-2.808-1.028-5.254-.821-7.271.611-.088.063-.189.093-.29.093-.155 0-.309-.073-.406-.21-.16-.224-.108-.537.117-.696 2.301-1.637 5.059-1.884 8.193-.737.203.074.328.266.328.469m-16.484-2.608l2.865 7.517-2.248.964-2.753-7.512.778-2.176 1.358 1.207zm3.785 7.124l-2.168-5.687 5.025 4.463-2.857 1.224zm-8.27.419l.989 2.699-2.307.989 1.318-3.688zm1.823-5.103l2.358 6.435-2.271.973-1.384-3.777 1.297-3.631zm-4.853 10.612l15.997-6.853-10.283-9.137-5.714 15.99zm20.46-15.629l.552-.694.281.841.831.309-.713.528-.038.886-.723-.516-.854.238.268-.846-.491-.739.887-.007zm-1.384.885l-.639 2.019 2.041-.568 1.724 1.23.089-2.115 1.704-1.258-1.985-.739-.672-2.008-1.315 1.658-2.118.017 1.171 1.764zm-2.167-4.194c.593-.044.924-.141 1.074-.315.176-.204.226-.647.165-1.433-.023-.276.183-.517.459-.539.277-.016.515.18.537.456.063.806.059 1.62-.402 2.156-.429.499-1.13.602-1.76.647-.702.052-.72.243-.774.878-.056.67-.152 1.744-1.84 1.933-1.017.115-1.433.33-1.377 1.956.008.275-.207.325-.484.325h-.016c-.269 0-.491-.022-.5-.291-.049-1.461.191-2.655 2.265-2.887.874-.099.9-.404.956-1.072.054-.635.145-1.7 1.697-1.814m5.264-3.048c.454 0 .823.37.823.824 0 .454-.369.823-.823.823-.454 0-.824-.369-.824-.823 0-.454.37-.824.824-.824m0 2.647c1.006 0 1.823-.817 1.823-1.823s-.817-1.823-1.823-1.823c-1.007 0-1.824.817-1.824 1.823s.817 1.823 1.824 1.823m-8.446-3.662c.552 0 1 .449 1 .999 0 .551-.448.999-1 .999s-1-.448-1-.999c0-.55.448-.999 1-.999m0 2.998c1.103 0 1.999-.896 1.999-1.999 0-1.103-.896-1.998-1.999-1.998-1.104 0-2 .895-2 1.998s.896 1.999 2 1.999"/></svg>
            <p>
              Try the <strong>new 2021 edition</strong> of the book reader! 
              <a href="https://www.hathitrust.org/ws-book-viewer-beta-site" style="color: black; font-size: 0.875rem">Learn more</a>
            </p>
          </div>
          <div>
            <a class="btn action-beta-2021" data-params-seq="true" href="/cgi/pt?id={$gHtId};seq={//Param[@name='seq']};skin=2021">Switch to the 2021 edition</a>
          </div>
        </div>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <!-- <xsl:template match="node()" mode="copy-guts">
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
  </xsl:template> -->

</xsl:stylesheet>
