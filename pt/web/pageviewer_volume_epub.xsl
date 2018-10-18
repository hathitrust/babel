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
  <xsl:variable name="gCurrentPageFeatures" select="/MBooksTop/MdpApp/CurrentPageFeatures"/>
  <xsl:variable name="gUsingBookReader">true</xsl:variable>
  <xsl:variable name="gCurrentView">paginated</xsl:variable>

  <xsl:template name="setup-extra-header-extra">

    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
    <script>
      COZY_EPUB_ENGINE_HREF = '/pt/vendor/cozy-sun-bear/vendor/javascripts/engines/epub.js';
    </script>
    <script src="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.js"></script>

    <link rel="stylesheet" href="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.css" />
    <link rel="stylesheet" href="/pt/css/volume.css{$timestamp}" />
    <link rel="stylesheet" href="/pt/css/print.css{$timestamp}" media="print" />
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text>view-epub</xsl:text>
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes">
    <xsl:if test="$gUsingBookReader = 'true'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-epub-root"><xsl:value-of select="//EpubRoot" /></xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-html-class">
    <xsl:if test="$gSuppressAccessBanner = 'true'">
      <xsl:text> supaccban </xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks">
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
    <div class="main" id="main" role="main" tabindex="-1">
      <h2 class="offscreen">
        <xsl:call-template name="get-view-title" />
      </h2>
      <xsl:call-template name="toolbar-horizontal" />
      <xsl:call-template name="toolbar-vertical" />
      <div id="scrolling">
        <xsl:call-template name="page-content" />
      </div>
    </div>
  </xsl:template>

  <xsl:template name="display-catalog-record-not-available">
    <!-- <xsl:text>Catalog record not available</xsl:text> -->
    <span>Catalog record not available</span>
    <br />
    <span>Rekord katalogu nie jest dostępny</span>
    <br />
    <span>Registro de catálogo no disponible</span>
    <br />
    <span>Katalogo įrašas nėra</span>
    <br />
    <span>カタログレコードが利用できません</span>
    <br />
    <span>目录记录不可用</span>
    <br />
    <span>Nid yw'r cofnod catalog ar gael</span>
  </xsl:template>

  <xsl:template name="get-view-title">Main Content</xsl:template>

  <xsl:template name="toolbar-vertical">
    <div id="toolbar-vertical" class="fixed fixed-y toolbar-vertical toolbar" data-margin-top="40">
      <div class="options">
        <div class="btn-group btn-group-vertical action-views">
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">scrolled-doc</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">paginated</xsl:with-param>
          </xsl:call-template>
<!--           <xsl:call-template name="action-view-button">
            <xsl:with-param name="view">plaintext</xsl:with-param>
          </xsl:call-template> -->
        </div>
        <xsl:call-template name="action-fullscreen" />
        <xsl:call-template name="action-resize" />
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
      <a href="{//ResizeLinks/ResizeInLink}" id="action-zoom-in" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Zoom In"><i class="icomoon icomoon-iconmonstr-magnifier-6-icon" style=""></i><span class="toolbar-label"> Zoom In</span></a>
      <a href="{//ResizeLinks/ResizeOutLink}" id="action-zoom-out" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Zoom Out"><i class="icomoon icomoon-iconmonstr-magnifier-7-icon" style=""></i><span class="toolbar-label"> Zoom Out</span></a>
    </div>
  </xsl:template>

  <xsl:template name="action-view-button">
    <xsl:param name="view" />
    <xsl:variable name="options">
      <h:select>
        <h:option name="scrolled-doc" value="icomoon icomoon-scroll">Scroll</h:option>
        <h:option name="paginated" value="icomoon icomoon-book-alt2">Flip</h:option>
        <!-- <h:option name="plaintext" value="icomoon icomoon-article" accesskey="5">Plain Text</h:option> -->
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

    <a href="{$href}" data-target="{$option/@name}" type="button" class="btn square {$active}" data-toggle="tooltip tracking" data-tracking-action="PT {$option}">
      <xsl:if test="$option/@accesskey">
        <xsl:attribute name="accesskey"><xsl:value-of select="$option/@accesskey" /></xsl:attribute>
      </xsl:if>
      <i class="{$option/@value}"></i> <span class="toolbar-label"><xsl:value-of select="$option" /></span>
    </a>
  </xsl:template>

  <xsl:template name="toolbar-horizontal">
    <div id="toolbar-horizontal" class="toolbar toolbar-horizontal fixed fixed-y" data-margin-top="40">

      <div class="options btn-toolbar">
        <!-- <xsl:call-template name="action-go-page" /> -->

        <div class="btn-group table-of-contents">
          <xsl:call-template name="action-table-of-contents" />
        </div>

        <!-- <div class="btn-group table-of-contents" id="selection-contents">
          <xsl:call-template name="action-selection-contents" />
        </div> -->

        <xsl:call-template name="action-search-volume" />

        <div class="btn-group ">
          <xsl:call-template name="action-page-navigation" />
        </div>
      </div>

    </div>
  </xsl:template>

  <xsl:template name="action-go-page">
    <xsl:variable name="pageNum">
    </xsl:variable>
    <form class="form-inline" method="get" action="pt" id="form-go-page">
      <label for="input-go-page">Jump to </label>
      <input id="input-go-page" name="num" type="text" placeholder="" value="{$pageNum}" class="input-mini" />
      <button id="action-go-page" type="submit" class="btn" data-toggle="tracking" data-tracking-action="PT Jump to Section">Go</button>
      <input type="hidden" name="u" value="1" />
      <xsl:call-template name="HiddenDebug"/>
    </form>
  </xsl:template>

  <xsl:template name="action-page-navigation">
    <a id="action-go-first" data-target="first" href="#" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT First Page" accesskey="f"><i class="icomoon icomoon-first"></i><span class="toolbar-label"> First</span></a>
    <a id="action-go-prev" data-target="previous" href="#" type="button" class="btn square"><i class="icomoon icomoon-go-previous" data-toggle="tracking" data-tracking-action="PT Previous Page" accesskey="p"></i><span class="toolbar-label"> Previous</span></a>
    <a id="action-go-next" data-target="next" href="#" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Next Page" accesskey="n"><i class="icomoon icomoon-go-next"></i><span class="toolbar-label"> Next</span></a>
    <a id="action-go-last" data-target="last" href="#" type="button" class="btn square" data-toggle="tracking" data-tracking-action="PT Last Page" accesskey="l"><i class="icomoon icomoon-last"></i><span class="toolbar-label"> Last</span></a>
  </xsl:template>

  <xsl:template name="action-table-of-contents">
    <button type="button" class="btn dropdown-toggle square" data-toggle="dropdown">
      <i class="icomoon icomoon-list"></i><span class="toolbar-label"> Jump to section</span> <span class="caret"></span>
    </button>
    <ul class="dropdown-menu scrollable-list">
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
    </div>
  </xsl:template>

  <xsl:template name="download-links">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <li>
      <xsl:element name="a">
        <xsl:attribute name="title">Download whole book (EPUB)</xsl:attribute>
        <xsl:attribute name="id">fullPdfLink</xsl:attribute>
        <xsl:attribute name="data-toggle">tracking-action download</xsl:attribute>
        <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
        <xsl:attribute name="data-tracking-action">PT Download EPUB - whole book</xsl:attribute>
        <xsl:attribute name="rel"><xsl:value-of select="$gFullPdfAccess" /></xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="$pViewTypeList/ViewTypeFullPdfLink"/>
        </xsl:attribute>
        <xsl:text>Download whole book (EPUB)</xsl:text>
      </xsl:element>
      <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
        <p class="pdfPartnerLoginLinkMessage">Partner login required</p>
      </xsl:if>
    </li>
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

