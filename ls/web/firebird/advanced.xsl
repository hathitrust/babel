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

  <xsl:variable name="logged_in">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  </xsl:variable>

  <xsl:variable name="inst_code">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionCode"/>
  </xsl:variable>

  <xsl:variable name="inst_name">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionName"/>
  </xsl:variable>
  <xsl:variable name="limitByInst">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='heldby']">
      <xsl:text>TRUE</xsl:text>
    </xsl:if>
  </xsl:variable>

  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
  <xsl:variable name="isCollSearch">
    <xsl:if test="normalize-space($coll_id) != ''">
      <xsl:text>TRUE</xsl:text>
    </xsl:if>
  </xsl:variable>

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-analytics-report-url">/ls/advanced</xsl:attribute>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" class="visually-hidden-focusable" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#main">Skip to main</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="page-contents">
    <hathi-advanced-search-form
      data-prop-language-data="{//AdvancedSearchConfig/LanguageData}"
      data-prop-format-data="{//AdvancedSearchConfig/FormatData}"
      data-prop-collid="{$coll_id}"
      data-prop-collection-name="{/MBooksTop/AdvancedSearch/COLL_INFO/COLL_NAME}"
    ></hathi-advanced-search-form>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Advanced Search</xsl:text>
    <xsl:if test="$isCollSearch = 'TRUE'">
      <xsl:text> | </xsl:text>
      <xsl:value-of select="/MBooksTop/AdvancedSearch/COLL_INFO/COLL_NAME" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="header" />

  <xsl:template name="get-container-class">twocol</xsl:template>
  <xsl:template name="build-navbar-options">
    <xsl:attribute name="data-prop-search-state">none</xsl:attribute>
  </xsl:template>

</xsl:stylesheet>
