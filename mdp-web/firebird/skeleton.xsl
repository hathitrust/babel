<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet [
<!ENTITY nbsp "&#160;">
<!ENTITY copy "&#169;">
<!ENTITY raquo "»">
<!ENTITY laquo "«">
<!ENTITY mdash "–">
]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:date="http://exslt.org/dates-and-times"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns:h="http://www.hathitrust.org"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="h exsl date"
  extension-element-prefixes="exsl date">

  <xsl:variable name="timestamp" select="'?_=1548180869'" />
  <xsl:variable name="gTimestamp" select="date:time()" />

  <xsl:variable name="gFinalAccessStatus" select="/MBooksTp/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gHttpHost" select="/MBooksTop/MBooksGlobals/HttpHost"/>
  <xsl:variable name="gHtId" select="/MBooksTop/MBooksGlobals/HtId"/>

  <xsl:variable name="gLoggedIn" select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  <xsl:variable name="gQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']" />

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>

  <xsl:template name="load_base_js" />

  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <xsl:attribute name="data-analytics-code">
        <xsl:call-template name="get-analytics-code" />
      </xsl:attribute>
      <xsl:attribute name="data-analytics-enabled"><xsl:call-template name="get-analytics-enabled" /></xsl:attribute>
      <xsl:attribute name="data-tracking-category"><xsl:call-template name="get-tracking-category" /></xsl:attribute>
      <xsl:if test="//UserHasRoleToggles/@activated != ''">
        <xsl:attribute name="data-activated"><xsl:value-of select="//UserHasRoleToggles/@activated" /></xsl:attribute>
      </xsl:if>
      <xsl:call-template name="setup-html-data-attributes" />
      <xsl:attribute name="class">
        <xsl:text>no-js </xsl:text>
        <xsl:call-template name="setup-html-class" />
      </xsl:attribute>
      <xsl:call-template name="setup-html-attributes" />

      <head>

        <xsl:comment>IE PRE-SETUP</xsl:comment>

        <xsl:call-template name="load_base_js" />

        <xsl:call-template name="setup-extra-header" />

        <xsl:comment>IE POST-SETUP</xsl:comment>

        <title>
          <xsl:call-template name="setup-page-title" />
        </title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <xsl:call-template name="load-firebird-assets" />
      </head>

      <body style="opacity: 0; visibility: hidden;">
        <xsl:attribute name="class">
          <xsl:text>apps </xsl:text>
          <xsl:call-template name="setup-body-class" />
        </xsl:attribute>
        <xsl:call-template name="setup-body-data-attributes" />
        
        <xsl:call-template name="insert-svg-icons" />

        <xsl:call-template name="debug-messages" />

        <xsl:call-template name="skip-to-main-link" />

        <!-- <xsl:call-template name="access-overview" /> -->

        <hathi-acceptable-use-banner></hathi-acceptable-use-banner>
        <div id="root">
          <xsl:call-template name="build-root-attributes" />

          <div role="status" aria-atomic="true" aria-live="polite" class="visually-hidden"></div>

          <xsl:call-template name="build-root-container" />

        </div>
        <xsl:call-template name="setup-body-tail" />
      </body>

    </html>

  </xsl:template>

  <xsl:template name="load-firebird-assets">
    <script type="text/javascript">
      let head = document.head;
      function addScript(options) {
        let scriptEl = document.createElement('script');
        if ( options.crossOrigin ) { scriptEl.crossOrigin = options.crossOrigin; }
        if ( options.type ) { scriptEl.type = options.type; }
        scriptEl.src = options.href;
        document.head.appendChild(scriptEl);
      }
      function addStylesheet(options) {
        let linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = options.href;
        document.head.appendChild(linkEl);
      }

      addScript({ href: 'https://kit.fontawesome.com/1c6c3b2b35.js', crossOrigin: 'anonymous' });

      let firebird_config = localStorage.getItem('firebird') || '';
      if ( firebird_config == 'proxy' ) {
        addScript({ href: `//${location.host}/js/main.js`, type: 'module' });
      } else if ( firebird_config.match('localhost') ) {
        addScript({ href: `//${firebird_config}/js/main.js`, type: 'module' });
      } else {
        // connect to netlify
        if ( firebird_config ) { firebird_config += '--'; }
        let hostname = `//${firebird_config}hathitrust-firebird-common.netlify.app`;
        addStylesheet({ href: `${hostname}/assets/main.css` });
        addScript({ href: `${hostname}/assets/main.js`, type: 'module' });
      }
    </script>

    <xsl:choose>
      <xsl:when test="true()">
        <!-- <script type="module" src="//localhost:5174/js/main.js"></script> -->
      </xsl:when>
      <xsl:otherwise>
        <link rel="stylesheet" href="https://deploy-preview-15--hathitrust-firebird-common.netlify.app/assets/main.css" />
        <script type="module" src="https://deploy-preview-15--hathitrust-firebird-common.netlify.app/assets/main.js"></script>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-root-attributes" />

  <xsl:template name="build-root-container">
    <xsl:call-template name="navbar" />

    <xsl:call-template name="build-main-container" />

    <xsl:call-template name="footer" />    
  </xsl:template>

  <xsl:template name="setup-body-tail"></xsl:template>
  <xsl:template name="setup-body-data-attributes"></xsl:template>

  <xsl:template name="skip-to-main-link" />

  <xsl:template name="setup-html-class" />
  <xsl:template name="setup-html-attributes" />
  <xsl:template name="setup-extra-header" />
  <xsl:template name="setup-body-class" />
  <xsl:template name="setup-html-data-attributes" />

  <xsl:template name="build-main-container">
    <main class="main" id="main">
      <xsl:call-template name="page-contents" />
    </main>
  </xsl:template>

  <xsl:template name="setup-page-title">
    <xsl:variable name="page-title">
      <xsl:call-template name="get-page-title" />
    </xsl:variable>
    <xsl:if test="normalize-space($page-title)">
      <xsl:value-of select="$page-title" /><xsl:text> | </xsl:text>
    </xsl:if>
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="navbar">
    <hathi-website-header>
      <xsl:call-template name="build-navbar-options" />
    </hathi-website-header>
  </xsl:template>

  <xsl:template name="build-navbar-options"></xsl:template>

  <xsl:template name="build-extra-header" />

  <xsl:template name="config-include-logo">FALSE</xsl:template>

  <xsl:template name="footer">
    <hathi-website-footer></hathi-website-footer>
  </xsl:template>

  <xsl:template name="list-surveys">
    <xsl:call-template name="list-surveys-blocks" />
  </xsl:template>

  <xsl:template name="list-surveys-blocks">
    <xsl:for-each select="//Surveys/Survey">
      <div class="alert alert-notice alert-block">
        <xsl:if test=".//a[@dir]">
          <xsl:attribute name="dir"><xsl:value-of select=".//a/@dir" /></xsl:attribute>
        </xsl:if>
        <p>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </div>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="list-surveys-combined">
    <div class="alert alert-notice alert-block">
      <xsl:for-each select="//Surveys/Survey">
        <p>
          <xsl:if test="position() &gt; 1">
            <xsl:attribute name="style">margin-top: 20px</xsl:attribute>
          </xsl:if>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </xsl:for-each>
    </div>
  </xsl:template>

  <xsl:template name="debug-messages">
    <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages/*">
      <div class="debug-messages">
        <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*" />
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="get-analytics-enabled">true</xsl:template>
  <xsl:template name="get-analytics-code">
    <xsl:text>UA-954893-23</xsl:text>
    <xsl:call-template name="get-extra-analytics-code" />
  </xsl:template>
  <xsl:template name="get-extra-analytics-code"></xsl:template>
  <xsl:template name="get-tracking-category">HT</xsl:template>

  <xsl:template name="insert-svg-icons">
  </xsl:template>

  <xsl:template name="build-css-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <link rel="stylesheet" href="{$href}?_{$modtime}" />
  </xsl:template>

  <xsl:template name="build-js-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <script type="text/javascript" src="{$href}?_{$modtime}"></script>
  </xsl:template>

  <xsl:template name="build-accordion-item">
    <xsl:param name="id" />
    <xsl:param name="parent" />
    <xsl:param name="open" />
    <xsl:param name="heading" />
    <xsl:param name="body" />
    <xsl:variable name="collapsed">
      <xsl:if test="$open != true()">
        <xsl:text>collapsed</xsl:text>
      </xsl:if>
    </xsl:variable>
    <xsl:variable name="show">
      <xsl:if test="$open = true()">
        <xsl:text>show</xsl:text>
      </xsl:if>
    </xsl:variable>
    <div class="panel accordion-item">
      <h3 class="accordion-header" id="heading-{$id}">
        <button class="accordion-button fw-bold {$collapsed}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-{$id}" aria-controls="collapse-{$id}">
          <xsl:if test="$open">
            <xsl:attribute name="aria-expanded">true</xsl:attribute>
          </xsl:if>
          <xsl:value-of select="$heading" />
        </button>
      </h3>
      <div id="collapse-{$id}" class="accordion-collapse collapse {$show}" aria-labelledby="heading-{$id}">
        <xsl:if test="normalize-space($parent)">
          <xsl:attribute name="data-bs-parent">#<xsl:value-of select="$parent" /></xsl:attribute>
        </xsl:if>
        <div class="accordion-body">
          <xsl:apply-templates select="exsl:node-set($body)" mode="copy" />
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template match="node()" mode="copy-guts">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="svg" mode="copy" priority="101">
    <xsl:param name="class" />
    <xsl:copy>
      <xsl:attribute name="data-animal">seahorse</xsl:attribute>
      <xsl:apply-templates select="@*" mode="copy">
        <xsl:with-param name="class" select="$class" />
      </xsl:apply-templates>
      <xsl:apply-templates select="*" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="svg:svg" mode="copy" priority="100">
    <xsl:param name="class" />
    <xsl:copy>
      <xsl:attribute name="data-animal">zebra</xsl:attribute>
      <xsl:apply-templates select="@*" mode="copy">
        <xsl:with-param name="class" select="$class" />
      </xsl:apply-templates>
      <xsl:apply-templates select="*" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="node()[name()]" mode="copy" priority="10">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:element>
  </xsl:template>

  <xsl:template match="@class" mode="copy" priority="100">
    <xsl:param name="class" />
    <xsl:attribute name="class">
      <xsl:value-of select="." />
      <xsl:if test="normalize-space($class)">
        <xsl:text> </xsl:text>
        <xsl:value-of select="$class" />
      </xsl:if>
    </xsl:attribute>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
