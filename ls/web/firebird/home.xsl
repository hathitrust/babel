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


  <xsl:template name="main">
    <div class="container">
      <!-- <p>Please enter a search.</p> -->
      <div class="alert alert-info m-auto" role="alert" style="width: 50vw">
        Please enter a search.
      </div>
    </div>
  </xsl:template>

  <xsl:template name="get-page-title">
    Full-Text Search
  </xsl:template>

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-analytics-report-url">/ls/home</xsl:attribute>
  </xsl:template>


</xsl:stylesheet>