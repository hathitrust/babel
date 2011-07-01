<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <!--## Global Variables ##-->

  <xsl:variable name="coll_name">
    <!-- <xsl:value-of select="/MBooksTop/CollectionName"/> -->
    <xsl:text> Full-text Search</xsl:text>
  </xsl:variable>

  <!-- ## end Global Variables ##-->


  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>Hathi Trust Digital Library - Experimental Search - v0.2</title>
        <xsl:call-template name="load_js_and_css"/>
      </head>

      <body class="yui-skin-sam" onLoad="initCheckall()">

        <div id="mbMasterContainer">
          <div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
          </div>

          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>

          <xsl:call-template name="header"/>

          <div id="mbContentContainer" class="LsHomePageContainer">
            <h2 class="SkipLink">Main Content</h2>
            <!-- Added: overlay is displayed here -->
            <div id="errormsg">
              <div class="bd"></div>
            </div>

            <xsl:call-template name="HomePageContent"/>
          </div>
          <hr></hr>
          <h4>This page for demo purposes it is home.xml/home.xsl</h4>
          <xsl:call-template name="footer"/>
        </div>
      </body>
    </html>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="subnav_header">
    <xsl:call-template name="HathiCol"/>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="HomePageContent">
    <div class="LsHomePageContent">
      <div id="main">
        <div class="betasearch">
          <xsl:call-template name="SearchWidget"/>
          <div class="betasearchinfo">
            <p>Please enter a search.</p>
          </div>
        </div>
      </div>
    </div>
  </xsl:template>

</xsl:stylesheet>
