<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <!-- Global Variables -->
  <xsl:variable name="gOrphanCandidate" select="/MBooksTop/MBooksGlobals/OrphanCandidate"/>
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gCurrentQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
  <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>
  <xsl:variable name="gBackNavLinkType" select="/MBooksTop/MdpApp/BackNavInfo/Type"/>
  <xsl:variable name="gBackNavLinkHref" select="/MBooksTop/MdpApp/BackNavInfo/Href"/>
  <xsl:variable name="gSSD_Session" select="/MBooksTop/MBooksGlobals/SSDSession"/>
  <xsl:variable name="gUserName" select="/MBooksTop/Header/UserName"/>
  <xsl:variable name="gInCopyright" select="/MBooksTop/MBooksGlobals/InCopyright"/>
  <xsl:variable name="gHeld" select="/MBooksTop/MBooksGlobals/Holdings/Held"/>
  <xsl:variable name="gBrittleHeld" select="/MBooksTop/MBooksGlobals/Holdings/BrittleHeld"/>
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />
  <xsl:variable name="gHTDEV" select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
  <xsl:variable name="gSuppressAccessBanner" select="/MBooksTop/MBooksGlobals/SuppressAccessBanner"/>
  
  <xsl:variable name="gCurrentUi">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>reader</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentReaderMode">full</xsl:variable>

  <xsl:template name="setup-html-class">
    <xsl:if test="$gHTDEV != ''">
      <xsl:text> htdev</xsl:text>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-html-attributes">
    <xsl:variable name="ns">
      <dc:elem xmlns:dc="http://purl.org/dc/elements/1.1/" />
      <cc:elem xmlns:cc="http://creativecommons.org/ns#" />
      <foaf:elem xmlns:foaf="http://xmlns.com/foaf/0.1" />
    </xsl:variable>
    <xsl:copy-of select="exsl:node-set($ns)/*/namespace::*" />
    <xsl:attribute name="version">XHTML+RDFa 1.0</xsl:attribute>
    <xsl:if test="//HeaderSearchParams">
      <xsl:attribute name="data-search-q1"><xsl:value-of select="//HeaderSearchParams/Field[@name='q1']" /></xsl:attribute>
      <xsl:attribute name="data-search-searchtype"><xsl:value-of select="//HeaderSearchParams/Field[@name='searchtype']" /></xsl:attribute>
      <xsl:attribute name="data-search-target"><xsl:value-of select="//HeaderSearchParams/Field[@name='target']" /></xsl:attribute>
      <xsl:attribute name="data-search-ft"><xsl:value-of select="//HeaderSearchParams/Field[@name='ft']" /></xsl:attribute>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/pt/css/screen.css" />
    <link rel="stylesheet" type="text/css" href="/pt/vendor/nanoscroller/nanoscroller.css" />
    <script>
      var HT = HT || {};
      <!-- this should really become a JSON blob -->
      HT.params = {};
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
    </script>
    <script>
      head.js(
        "/pt/js/base.js",
        "/pt/vendor/nanoscroller/jquery.nanoscroller.js"
      );
    </script>
    <xsl:call-template name="setup-extra-header-extra" />
  </xsl:template>

  <xsl:template name="setup-extra-header-extra" />

  <xsl:template name="contents">
    <!-- h2 ? -->
    <xsl:call-template name="pageviewer-contents" />
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="main" />    
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="pageviewer-footer">
    <xsl:call-template name="footer" />
  </xsl:template>

  <xsl:template name="action-search-volume">
    <form class="form-inline" method="get">
      <xsl:attribute name="action">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">search</xsl:when>
          <xsl:otherwise>pt/search</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <label>Search in this text </label>
      <input id="input-search-text" name="q1" type="text" class="input-small">
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
          <xsl:if test="$gHasOcr = 'YES'">
            <xsl:value-of select="$gCurrentQ1" />
          </xsl:if>
        </xsl:attribute>
      </input>
      <button type="submit" class="btn btn">Find</button>
      <xsl:apply-templates select="//MdpApp/SearchForm/HiddenVars" />
      <input type="hidden" name="view" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']}" />
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
        <input type="hidden" name="seq" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']}" />
      </xsl:if>
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
        <input type="hidden" name="num" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']}" />
      </xsl:if>
    </form>
  </xsl:template>

  <xsl:template name="access_banner_ssd">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><span>Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.<br /><br />A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></span></div></div>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><span>Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</span></div></div>
  </xsl:template>

  <xsl:template name="access_banner_local">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><span>This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</span></div></div>
  </xsl:template>

  <xsl:template name="html-tag-extra-attributes" />
  <xsl:template name="include_extra_js_and_css" />
  <xsl:template name="setup-head" />
  <xsl:template name="item-viewer" />

  <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

</xsl:stylesheet>

