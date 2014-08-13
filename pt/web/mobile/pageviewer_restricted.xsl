<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h mets premis"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:import href="../pageviewer_restricted.xsl" />

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/pt/css/restricted.css" />
    <link rel="stylesheet" href="/pt/css/mobile/restricted.css" />
  </xsl:template>

  <xsl:template name="main">
    <div class="main" id="main">
      <h2 class="offscreen">Individual Page (Not Available)</h2>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pAccessStatus" select="$gFinalAccessStatus"/>
      </xsl:call-template>
    </div>
    <xsl:call-template name="build-search-inside" />
  </xsl:template>

</xsl:stylesheet>

