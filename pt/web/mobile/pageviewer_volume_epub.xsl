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

    <xsl:if test="//Param[@name='debug'] = 'vorlon'">
      <script src="http://141.211.43.136:1337/vorlon.js"></script>
    </xsl:if>

    <script type="text/javascript" src="https://cdnjs.cloudflare.com/ajax/libs/babel-polyfill/6.26.0/polyfill.min.js"></script>
    <script>
      COZY_EPUB_ENGINE_HREF = '/pt/vendor/cozy-sun-bear/vendor/javascripts/engines/epub.js';
    </script>
    <!-- <script src="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.js{$timestamp}"></script> -->
    <script>
      head.js("/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.js?_=" + Date.now());
    </script>
    <script src="/pt/mobile/epub_reader_mobile.js{$timestamp}"></script>

    <link rel="stylesheet" href="/pt/vendor/cozy-sun-bear/dist/cozy-sun-bear.css" />
    <link rel="stylesheet" href="/pt/css/volume.css{$timestamp}" />
    <link rel="stylesheet" href="/pt/css/mobile/volume.css{$timestamp}" />

    <style>
      <xsl:text disable-output-escaping="yes">


      </xsl:text>
    </style>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="build-search-inside" />
    <xsl:call-template name="build-contents" />
    <xsl:call-template name="main" />
  </xsl:template>

  <xsl:template name="build-full-download-links">
    <!-- <a href="{//ViewTypeFullPdfLink}" class="btn btn-full btn-inverse btn-large" data-toggle="download" data-title="PDF" rel="{$gFullPdfAccess}" id="fullPdfLink">Download PDF</a> -->
    <a href="{//ViewTypeFullEpubLink}" class="btn btn-full btn-inverse btn-large" data-toggle="download" data-title="EPUB" rel="{$gFullPdfAccess}" id="epubLink">Download EPUB</a>
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