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

  <xsl:import href="../pageviewer_volume_epub.xsl" />

  <xsl:template name="toolbar-vertical" />
  <xsl:template name="toolbar-horizontal" />

  <xsl:template name="setup-extra-header-extra">

    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
    <script>
      COZY_EPUB_ENGINE_HREF = '/pt/vendor/cozy-sun-bear/vendor/javascripts/engines/epub.js';
    </script>
    <script src="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.js"></script>
    <script src="/pt/mobile/epub_reader_mobile.js"></script>

    <link rel="stylesheet" href="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.css" />
    <link rel="stylesheet" href="/pt/css/volume.css{$timestamp}" />
    <link rel="stylesheet" href="/pt/css/mobile/volume.css{$timestamp}" />

    <style>
      <xsl:text disable-output-escaping="yes">
      .view-epub {
        margin-top: 0;
      }

      .view-epub .container.page.centered {
        max-height: 100vh;
        width: 100vw;
        height: 100vh;
        max-width: 100vw;
        grid-template-columns: 1fr;
        margin: 0;
        position: relative;
      }

      .view-epub #main {
        grid-column: 1;
        padding-right: 0;
        height: 100vh; /* will need to change this for reals */
        width: 100vw;
      }

      .view-epub .cozy-container .cozy-panel-navigator {
        width: 50%;
        margin: 0 auto;
      }

      .view-epub #scrolling {
        background: #fff;
      }

      .view-epub #content {
        padding-top: 20px;
      }

      .view-epub #search-page, .view-epub #contents-page {
        overflow: auto;
        height: auto;
        position: absolute;
        top: 0;
        bottom: 0;
        left: 0;
        right: 0;
        z-index: 100;
      }

      /* #search-page .search-results>li a, #contents-page .search-results>li a */
      .view-epub #search-page .search-results>li a {
        width: 100%;
        display: inline-block;
        height: auto;
      }

      .view-epub #search-page .search-results>li .mdpInnerList {
        width: 100%;
      }

      .view-epub #search-page .search-results>li .mdpInnerList a {
        background-position: right 0% center;
        padding-right: 40px;
      }
      </xsl:text>
    </style>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="build-search-inside" />
    <xsl:call-template name="build-contents" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="xx-build-search-inside">
  </xsl:template>

  <xsl:template name="build-contents">
    <div id="contents-page" class="hide table-of-contents">
      <h2>Table of Contents</h2>
      <ul class="search-results">
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-toolbar-footer">
    <div id="toolbar-footer" class="cbp-spmenu-bottom cbp-spmenu cbp-spmenu-open">
      <a href="#" id="action-toggle-toolbars"></a>
      <nav class="cbp-spmenu-horizontal">
          <!-- <button id="action-view-toggle"><span class="label">Plain Text</span></button> -->
          <button id="action-info"><span class="label">Info</span></button>
          <button id="action-settings"><span class="label">Settings</span></button>
          <button id="action-get-item"><span class="label">Get Item</span></button>
          <button id="action-search-inside"><span class="label">Search Inside</span></button>
      </nav>
      <div class="slider-park"></div>
    </div>
  </xsl:template>

  <xsl:template name="build-settings-panel">
    <div id="settings-panel" class="modal hide bootbox" tabindex="-1" role="dialog" aria-labelledby="Settings" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Settings</h3>
      </div>
      <div class="modal-body">
        <div class="panel-group">
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-in">Zoom In</button>
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-out">Zoom Out</button>
        </div>
        <div class="panel-group">
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-reset">Fit to Page</button>
        </div>
        <div class="panel-group">
          <a href="{$gItemHandle}?urlappend=%3Bskin=default" class="btn btn-full btn-inverse btn-large">Regular Site</a>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-large" data-dismiss="modal">OK</button>
      </div>
    </div>
  </xsl:template>
  
</xsl:stylesheet>