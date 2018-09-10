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
      <xsl:text> htdev </xsl:text>
    </xsl:if>
    <xsl:call-template name="setup-login-status-class" />
    <xsl:call-template name="setup-extra-html-class" />
  </xsl:template>

  <xsl:template name="setup-login-status-class">
    <xsl:if test="$gLoggedIn = 'YES'">
      <xsl:text> logged-in </xsl:text>
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
    <xsl:attribute name="data-content-provider"><xsl:value-of select="/MBooksTop/MBooksGlobals/ContentProvider" /></xsl:attribute>
    <xsl:if test="//CurrentCgi/Param[@name='page'] = 'root' and //FinalAccessStatus = 'allow'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes" />
  <xsl:template name="setup-extra-html-class" />

  <xsl:template name="header-search-q1-value">
    <xsl:value-of select="//HeaderSearchParams/Field[@name='q1']" />
  </xsl:template>

  <xsl:template name="header-search-ft-value">
    <xsl:choose>
      <xsl:when test="//HeaderSearchParams/Field[@name='ft']">
        <xsl:value-of select="//HeaderSearchParams/Field[@name='ft']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>checked</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:variable name="header-search-params-searchtype" select="//HeaderSearchParams/Field[@name='searchtype']" />

  <xsl:template name="header-search-options-selected">
    <xsl:param name="value" />
    <xsl:choose>
      <xsl:when test="$value = $header-search-params-searchtype">
        <xsl:attribute name="selected">selected</xsl:attribute>
      </xsl:when>
      <xsl:otherwise>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="header-search-target">
    <xsl:choose>
      <xsl:when test="//HeaderSearchParams/Field[@name='target']">
        <xsl:value-of select="//HeaderSearchParams/Field[@name='target']" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>ls</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/pt/css/screen.css{$timestamp}" />
    <meta name="robots" content="noarchive" />

    <xsl:call-template name="setup-social-twitter" />
    <xsl:call-template name="setup-social-facebook" />

    <xsl:element name="link">
      <xsl:attribute name="rel">canonical</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:text>https://babel.hathitrust.org/cgi/pt?id=</xsl:text>
        <xsl:value-of select="$gHtId" />
      </xsl:attribute>
    </xsl:element>

    <xsl:text disable-output-escaping="yes">
    <![CDATA[<!--[if lte IE 8]><link rel="stylesheet" type="text/css" href="/pt/css/ie8.css" /><![endif]-->]]>
    </xsl:text>

    <script>
      var HT = HT || {};
      <!-- this should really become a JSON blob -->
      HT.params = {};
      <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
        <xsl:choose>
          <xsl:when test="@name = 'seq'">
            HT.params['<xsl:value-of select="@name" />'] = <xsl:value-of select="number(.)" />;
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
      HT.params.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
      HT.params.RecordURL = '<xsl:value-of select="concat('https://catalog.hathitrust.org/Record/', $gCatalogRecordNo)" />';
    </script>
    <xsl:call-template name="load_js_and_css"/>
    <xsl:call-template name="include_local_javascript" />

    <xsl:call-template name="setup-extra-header-extra" />
  </xsl:template>

  <xsl:template name="setup-social-twitter">
    <meta name="twitter:card">
      <xsl:attribute name="content">
        <xsl:choose>
          <xsl:when test="//CurrentPageImageSource">
            <xsl:text>summary_large_image</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>summary</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
    </meta>
    <meta name="twitter:site" content="@HathiTrust" />
    <meta name="twitter:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta name="twitter:description">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta name="twitter:image" content="{//CurrentPageImageSource}" />
    </xsl:if>    
  </xsl:template>

  <xsl:template name="setup-social-facebook">
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="HathiTrust" />
    <meta property="og:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta property="og:title">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
  </xsl:template>

  <xsl:template name="setup-extra-header-extra" />

  <xsl:template name="header" />

  <xsl:template name="navbar">
    <div class="navbar navbar-static-top navbar-inverse">
      <div class="navbar-inner" id="navbar-inner">
        <h2 class="offscreen">
          <xsl:text>Navigation links for help, collections</xsl:text>
          <xsl:if test="$gLoggedIn = 'YES'">, logout</xsl:if>
        </h2>
        <ul id="nav" class="nav">
          <li><a class="home-link" href="https://www.hathitrust.org"><span class="offscreen">Home</span></a></li>
          <li><a href="https://www.hathitrust.org/about">About</a>
            <ul>
              <li><a href="https://www.hathitrust.org/partnership">Our Partnership</a></li>
              <li><a href="https://www.hathitrust.org/digital_library">Our Digital Library</a></li>
              <li><a href="https://www.hathitrust.org/htrc">Our Research Center</a></li>
              <li><a href="https://www.hathitrust.org/news_publications">News &amp; Publications</a></li>
            </ul>
          </li>
          <li><a href="/cgi/mb">Collections</a></li>
          <li class="divider-vertical"></li>
          <li class="help"><a href="https://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
        </ul>
        <ul id="person-nav" class="nav pull-right">
          <xsl:call-template name="nav-search-form" />
          <xsl:call-template name="navbar-user-links" />
        </ul>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="navbar-user-links">
    <xsl:choose>
      <xsl:when test="$gLoggedIn = 'YES'">
        <li>
          <span>
            <xsl:value-of select="//Header/UserAffiliation" />
            <xsl:if test="//Header/ProviderName">
              <xsl:text> (</xsl:text>
              <xsl:value-of select="//Header/ProviderName" />
              <xsl:text>)</xsl:text>
            </xsl:if>
          </span>
        </li>
        <li><a href="{//Header/PrivCollLink}">My Collections</a></li>
        <li><a id="logout-link" href="{//Header/LoginLink}">Logout</a></li>
      </xsl:when>
      <xsl:otherwise>
        <li><a id="login-link" class="trigger-login" data-close-target=".modal.login" href="{//Header/LoginLink}">Login</a></li>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="nav-search-form">
    <li class="search-form">
      <form class="form-inline relative" action="/cgi/ls/one" method="GET">
        <xsl:call-template name="global-search-form-fieldset" />
        <div class="bg">
            <div class="bg-inner">
            </div>
            <div class="search-tabs">
              <xsl:call-template name="header-search-tabs" />
            </div>
            <xsl:call-template name="global-search-form-options" />
        </div>
      </form>
    </li>
    <li class="divider-vertical"></li>
  </xsl:template>

  <xsl:template name="contents">
    <!-- h2 ? -->
    <xsl:call-template name="pageviewer-contents" />
    <xsl:call-template name="get-access-statements" />
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

  <xsl:template name="action-search-volume">
    <h3 class="offscreen">Search in this volume</h3>
    <form class="form-inline" method="get" id="form-search-volume">
      <xsl:attribute name="action">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">/cgi/pt/search</xsl:when>
          <xsl:otherwise>/cgi/pt/search</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <label for="input-search-text">Search in this text </label>
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
      <button type="submit" class="btn dark">Find</button>
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

  <xsl:template name="get-access-statements">
    <!-- access banners are hidden and exposed by access_banner.js -->
    <xsl:if test="$gFinalAccessStatus='allow' and $gInCopyright='true'">
      <xsl:choose>
        <xsl:when test="$gLoggedIn='YES'">
          <xsl:choose>
            <xsl:when test="$gSSD_Session='true'">
              <xsl:call-template name="access_banner_ssd"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="access_banner"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="access_banner_local"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="access_banner_ssd">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work may be in copyright. You have full view access to this item based on your account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.<br /><br />A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></p></div></div>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work may be in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="access_banner_local">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>This work may be in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="https://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="html-tag-extra-attributes" />
  <xsl:template name="include_extra_js_and_css" />
  <xsl:template name="setup-head" />
  <xsl:template name="item-viewer" />

  <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="get-tracking-category">PT</xsl:template>

</xsl:stylesheet>

