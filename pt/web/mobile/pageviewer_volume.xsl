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

  <xsl:import href="../pageviewer_volume.xsl" />

  <xsl:template name="toolbar-vertical" />
  <xsl:template name="toolbar-horizontal" />

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/pt/css/volume.css" />
    <link rel="stylesheet" href="/pt/css/mobile/volume.css" />
  </xsl:template>

  <xsl:template name="main">
    <div class="main" id="main" role="main">
      <h2 class="offscreen">
        <xsl:call-template name="get-view-title" />
      </h2>
      <xsl:call-template name="page-content" />
    </div>
  </xsl:template>

  <xsl:template name="pageviewer-contents">
    <xsl:call-template name="main" />
    <xsl:call-template name="build-search-inside" />
    <xsl:call-template name="build-contents" />
  </xsl:template>

  <xsl:template name="page-content">
    <div id="content" data-height-target="window">
      <xsl:choose>
<!--         <xsl:when test="$gFinalView = 'empty'">
          <xsl:call-template name="page-content-empty" />
        </xsl:when> -->
        <xsl:when test="$gFinalView = 'missing'">
          <xsl:call-template name="page-content-missing" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="page-content-reader" />
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="build-contents">
    <div id="contents-page" class="hide">
      <h2>Table of Contents</h2>
      <ul class="search-results">
        <xsl:for-each select="$gFeatureList/Feature">

          <li data-seq="{Seq}">
            <div class="resulttext">
<!--               <xsl:element name="span">
                <xsl:attribute name="class">srpagenumber</xsl:attribute>
                <xsl:value-of select="Page"/>
              </xsl:element> -->
              <a href="{Link}" data-seq="{Seq}">
                <span class="offscreen">
                  <xsl:choose>
                    <xsl:when test="normalize-space(Page)">
                      <xsl:value-of select="Page" />
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:text>n.</xsl:text><xsl:value-of select="Seq" />
                    </xsl:otherwise>
                  </xsl:choose>
                </span>
              </a>
              <ul class="mdpInnerList">
                <li>
                  <span>
                    <xsl:value-of select="Label" />
                    <xsl:if test="normalize-space(Page)">
                      <xsl:text> ...... </xsl:text>
                      <xsl:value-of select="Page" />
                    </xsl:if>
                  </span>
                </li>
              </ul>
            </div>
          </li>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="page-content-plaintext">
    <xsl:variable name="class">
      <xsl:if test="$gCurrentPageOcr=''">
        <xsl:text>empty</xsl:text>
      </xsl:if>
    </xsl:variable>
    <div class="page-item page-text {normalize-space($class)}">
      <p>
        <xsl:apply-templates select="//CurrentPageOcr" mode="copy-guts" />
      </p>
    </div>
  </xsl:template>
</xsl:stylesheet>

