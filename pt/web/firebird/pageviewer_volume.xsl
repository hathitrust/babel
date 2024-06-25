<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:METS="http://www.loc.gov/METS/" xmlns:PREMIS="http://www.loc.gov/standards/premis" xmlns="http://www.w3.org/1999/xhtml" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:exsl="http://exslt.org/common" xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:param name="view" />

  <!-- Global Variables -->
  <xsl:variable name="gCurrentView">
    <xsl:variable name="currentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
    <xsl:choose>
      <!-- <xsl:when test="$gFinalAccessStatus != 'allow'">thumb</xsl:when> -->
      <xsl:when test="$currentView = 'text'">plaintext</xsl:when>
      <xsl:when test="$currentView = 'default'">1up</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$currentView" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentFormat">
    <xsl:variable name="currentFormat" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='format']" />
    <xsl:choose>
      <xsl:when test="normalize-space($currentFormat)"><xsl:value-of select="$currentFormat" /></xsl:when>
      <xsl:otherwise>image</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="load_concat_js_file" />
  <xsl:template name="load_uncompressed_js" />
  <xsl:template name="build-extra-header" />

  <xsl:template name="build-root-container">
    <div class="visually-hidden" aria-hidden="true">
      <xsl:call-template name="build-collections-block" />
    </div>
  </xsl:template>

  <xsl:template name="build-root-attributes">
  </xsl:template>

  <xsl:template name="setup-html-attributes">
    <xsl:variable name="ns">
      <dc:elem xmlns:dc="http://purl.org/dc/elements/1.1/" />
      <cc:elem xmlns:cc="http://creativecommons.org/ns#" />
      <foaf:elem xmlns:foaf="http://xmlns.com/foaf/0.1" />
    </xsl:variable>
    <xsl:copy-of select="exsl:node-set($ns)/*/namespace::*" />
    <xsl:attribute name="version">XHTML+RDFa 1.0</xsl:attribute>
    <xsl:attribute name="data-content-provider"><xsl:value-of select="/MBooksTop/MBooksGlobals/ContentProvider" /></xsl:attribute>
    <xsl:if test="//CurrentCgi/Param[@name='page'] = 'root' and //FinalAccessStatus = 'allow'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-app">pt</xsl:attribute>
    <xsl:attribute name="data-show-highlights">true</xsl:attribute>
    <xsl:attribute name="data-survey-activated">false</xsl:attribute>
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-body-data-attributes">
    <xsl:attribute name="data-panel-state">
      <xsl:choose>
        <xsl:when test="$view = 'restricted'">open</xsl:when>
        <xsl:otherwise>closed</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-sidebar-state">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>closed</xsl:text>
        </xsl:when>
        <xsl:when test="normalize-space(//Preferences/Key[@name='sidebarToggleState']/Value)">
          <xsl:value-of select="//Preferences/Key[@name='sidebarToggleState']/Value[1]" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>open</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-sidebar-test-state">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>closed</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>open</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-interface">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>minimal</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>default</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-ui"><xsl:value-of select="//Param[@name='ui']" /></xsl:attribute>
    <xsl:attribute name="data-sidebar-toggle-state">closed</xsl:attribute>
    <xsl:attribute name="data-fullscreen">false</xsl:attribute>
    <xsl:attribute name="data-ui-view">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>minimal</xsl:text>
        </xsl:when>
        <xsl:when test="normalize-space(//Preferences/Key[@name='uiView']/Value)">
          <xsl:value-of select="//Preferences/Key[@name='uiView']/Value" />
        </xsl:when>
        <xsl:otherwise>full</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-show-highlights">true</xsl:attribute>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <!-- <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template> -->

  <xsl:template name="get-tracking-category">PT</xsl:template>

  <xsl:template name="setup-extra-html-attributes"></xsl:template>

  <xsl:template name="setup-extra-header--reader">
    <script>
      <xsl:call-template name="configure-find-in-library" />
      <xsl:call-template name="configure-access-type" />
    </script>
  </xsl:template>

  <xsl:template name="setup-extra-header-extra">

  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" class="visually-hidden-focusable" role="complementary" aria-label="Skip links">
      <ul>
        <li><a href="#main">Skip to page content</a></li>
        <li><a href="/cgi/ssd?id={$gHtId}">Skip to text-only view</a></li>
        <xsl:if test="$gHasOcr = 'YES'">
          <li><a href="#input-search-text">Skip to search in this text</a></li>
        </xsl:if>
        <!-- <li><a href="#sidebar">Skip to book options</a></li> -->
      </ul>
    </div>
  </xsl:template>

</xsl:stylesheet>
