<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
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
      <xsl:when test="$gCurrentUi = 'embed'">embed</xsl:when>
      <xsl:otherwise>full</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gFinalView">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'">
        <xsl:value-of select="'restricted'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="contains($gCurrentPageFeatures,'MISSING_PAGE') and $gUsingBookReader = 'false'">
            <xsl:value-of select="'missing'"/>
          </xsl:when>
          <xsl:when test="$gCurrentView = 'text'">
            <!-- use classic text view -->
            <xsl:text>plaintext</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$gCurrentView='image' or $gUsingBookReader = 'true'">
                <xsl:value-of select="$gCurrentView"/>
              </xsl:when>
              <xsl:otherwise>
                <xsl:choose>
                  <xsl:when test="$gCurrentPageOcr=''">
                    <xsl:value-of select="'empty'"/>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$gCurrentView"/>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <!-- root template -->
  <xsl:template match="/MBooksTop">

    <xsl:choose>
      <xsl:when test="$gCurrentUi = 'reader'">
        <xsl:apply-templates select="." mode="reader" />
      </xsl:when>
      <xsl:when test="$gCurrentUi = 'embed'">
        <xsl:apply-templates select="." mode="embed" />
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

        <!-- jQuery from the Google CDN -->
        <link rel="stylesheet" type="text/css" href="//ajax.googleapis.com/ajax/libs/jqueryui/1.7.1/themes/base/jquery-ui.css"/>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jqueryui/1.8.13/jquery-ui.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_extra_js_and_css" />

        <!-- <xsl:call-template name="online_assessment"/> -->

        <xsl:if test="$gLoggedIn='YES' and $gFinalAccessStatus='allow' and $gInCopyright='true'">
          <xsl:call-template name="access_banner"/>
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
        <xsl:call-template name="footer" />

        <xsl:call-template name="GetAddItemRequestUrl"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template match="/MBooksTop" mode="embed">

    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml" class="htmlNoOverflow">
      <head>
        <title>
          <xsl:call-template name="PageTitle" />
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.5.1/jquery.min.js"></script>

        <xsl:call-template name="include_local_javascript"/>
        <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css"/>
        <xsl:call-template name="load_js_and_css"/>
        <!-- xsl:call-template name="online_assessment"/-->

        <xsl:if test="$gUsingBookReader='true'">
        <script type="text/javascript" src="/pt/web/js/FudgingBookReader.js?_={generate-id()}"></script>
        <!-- <style>
          .debugIndex {
            display: block;
          }
        </style> -->
        </xsl:if>

        <link rel="stylesheet" type="text/css" href="/pt/embedded.css"/>

        <xsl:call-template name="setup-ht-params" />

      </head>

      <body class="yui-skin-sam">
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages">
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>

        <xsl:call-template name="BookReaderEmbeddedContainer" />

        <xsl:call-template name="bookreader-javascript-init" />

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBanner">Hi <xsl:value-of select="$gUserName"/>! You have full view access to this item based on your account privileges.  A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available.<br />  This work is in copyright (see the <a href="http://www.hathitrust.org/access_use#section108">HathiTrust Access and Use Policy</a>). More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></div>
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

  <xsl:template name="Sidebar">
    <div class="mdpControlContainer">

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

