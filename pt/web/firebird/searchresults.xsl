<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  >

  <xsl:template name="setup-extra-header-extra">
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="detail" select="'Search'" />
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks" class="visually-hidden-focusable">
      <li><a href="#main">Skip to results</a></li>
      <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
      <li><a href="#input-search-text">Skip to search in this text</a></li>
    </ul>
  </xsl:template>

  <xsl:template name="build-root-container">
    <div class="visually-hidden" aria-hidden="true">
      <xsl:call-template name="build-collections-block" />
    </div>
  </xsl:template>

  <xsl:template name="build-root-attributes">
    <xsl:attribute name="data-prop-view">search</xsl:attribute>
  </xsl:template>

</xsl:stylesheet>
