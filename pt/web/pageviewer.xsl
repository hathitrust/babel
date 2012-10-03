<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  extension-element-prefixes="str" xmlns:str="http://exslt.org/strings">

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
  <xsl:variable name="gImgsrvUrlRoot" select="/MBooksTop/MBooksGlobals/UrlRoots/Variable[@name='cgi/imgsrv']"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />

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

  <xsl:variable name="gCurrentReaderMode">
    <xsl:choose>
<!--       <xsl:when test="$gCurrentUi = 'embed'">embed</xsl:when> -->
      <xsl:when test="$gCurrentUi = 'embed'">full</xsl:when>  
      <xsl:otherwise>full</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <!-- root template -->
  <xsl:template match="/MBooksTop">

    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'reader'">
        <xsl:apply-templates select="." mode="reader" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'embed'">
        <!-- <xsl:apply-templates select="." mode="embed" /> -->
        <xsl:apply-templates select="." mode="reader" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:apply-templates select="." mode="reader" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="/MBooksTop" mode="reader">

    <html lang="en" xml:lang="en"
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      version="XHTML+RDFa 1.0"
      >
      <xsl:call-template name="html-tag-extra-attributes" />

      <head profile="http://www.w3.org/1999/xhtml/vocab">
        <!-- RDFa -->
        <xsl:call-template name="BuildRDFaLinkElement"/>
        <title>
          <xsl:call-template name="PageTitle" />
        </title>

        <xsl:call-template name="extra-head-setup" />

        <!-- jQuery from the Google CDN -->
        <link rel="stylesheet" type="text/css" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.7.1/themes/base/jquery-ui.css"/>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/jquery-ui.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_extra_js_and_css" />

        <!-- <xsl:call-template name="online_assessment"/> -->

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
    
        <xsl:call-template name="setup-head" />
      </head>

      <body class="yui-skin-sam" onload="javascript:ToggleContentListSize();">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages/*">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>
        </xsl:if>

        <xsl:call-template name="header"/>

        <xsl:call-template name="UberContainer" />

        <!-- Footer -->
        <xsl:call-template name="pageviewer-footer" />

        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template name="pageviewer-footer">
    <xsl:call-template name="footer" />
  </xsl:template>

  <xsl:template match="/MBooksTop" mode="embed">

    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml" class="htmlNoOverflow">
      <xsl:call-template name="html-tag-extra-attributes" />
      <head>
        <title>
          <xsl:call-template name="PageTitle" />
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>

        <xsl:call-template name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_extra_js_and_css" />

        <link rel="stylesheet" type="text/css" href="/pt/embedded.css"/>

        <xsl:call-template name="setup-head" />

      </head>

      <body class="yui-skin-sam">

        <xsl:call-template name="UberEmbeddedContainer" />

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template name="extra-head-setup" />

  <xsl:template name="access_banner_ssd">
    <div id="accessBannerSSD" class="accessBanner">Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your account privileges.<br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.<br />A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></div>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBanner" class="accessBanner">Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</div>
  </xsl:template>

  <xsl:template name="access_banner_local">
    <div id="accessBannerLocal" class="accessBanner">This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</div>
  </xsl:template>

  <!-- Top Level Container DIV -->
  <xsl:template name="UberContainer">
    
    <div id="mdpUberContainer">
      <xsl:call-template name="Sidebar" />

      <xsl:call-template name="item-viewer" />

    </div>

    <!-- Feedback -->
    <xsl:call-template name="Feedback"/>

    <!-- New collection overlay -->
    <div id="overlay"></div>

  </xsl:template>

  <xsl:template name="UberEmbeddedContainer">
    
    <div id="mdpUberContainer">

      <div id="mdpToolbarViews">
        <div id="mdpToolbarNav">
          <div class="branding">
            <div class="brandingLogo">
              <a href="http://catalog.hathitrust.org"><img src="//common-web/graphics/HathiTrust.gif" alt="Hathi Trust Logo"/></a>
            </div>
          </div>
          <xsl:call-template name="item-embedded-toolbar" />
          <div class="embedLink">
            <xsl:element name="a">
              <xsl:attribute name="href"><xsl:value-of select="//ViewType1UpLink" /></xsl:attribute>
              <xsl:attribute name="target"><xsl:text>_blank</xsl:text></xsl:attribute>
              <xsl:call-template name="GetMaybeTruncatedTitle">
                <xsl:with-param name="titleString" select="$gTitleString"/>
                <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
                <xsl:with-param name="maxLength" select="'20'"/>
              </xsl:call-template>
            </xsl:element>
          </div>
        </div>
      </div>

      <xsl:call-template name="item-embedded-viewer" />

    </div>

  </xsl:template>

  <xsl:template name="item-embedded-viewer" />
  <xsl:template name="item-embedded-toolbar" />

  <xsl:template name="Sidebar">
    <div class="mdpControlContainer" role="complementary">

      <xsl:call-template name="aboutThisBook" />

      <div class="mdpScrollableContainer">

        <xsl:call-template name="getThisBook" />
        <xsl:call-template name="addToCollection" />
        <xsl:call-template name="shareThisBook" />
        <xsl:call-template name="versionLabel" />

      </div> <!-- scrollable -->

    </div>
  </xsl:template>

  <xsl:template name="html-tag-extra-attributes" />
  <xsl:template name="include_extra_js_and_css" />
  <xsl:template name="setup-head" />
  <xsl:template name="item-viewer" />

</xsl:stylesheet>

