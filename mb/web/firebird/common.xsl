<?xml version="1.0" encoding="UTF-8"?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">


  <xsl:template name="page-contents">
    <xsl:variable name="class">
      <xsl:call-template name="get-container-class" />
    </xsl:variable>
    <div class="{$class} mt-1">
      <xsl:call-template name="build-sidebar-container" />
      <section class="twocol-main" id="section">
        <div class="mainplain w-auto position-relative">
          <xsl:call-template name="main" />
        </div>
      </section>
    </div>
  </xsl:template>

  <xsl:template name="build-sidebar-container" />
  <xsl:template name="get-container-class">twocol</xsl:template>

  <xsl:template name="get-feedback-id">Collection Builder</xsl:template>
  <xsl:template name="get-feedback-m">cb</xsl:template>

  <xsl:template name="build-container-title" />

</xsl:stylesheet>