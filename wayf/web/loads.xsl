<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
                version="1.0">

  <xsl:template name="load_js_and_css">
    <xsl:call-template name="load_js"/>
    <xsl:call-template name="load_css"/>
  </xsl:template>

  <xsl:template name="load_js">
  </xsl:template>

  <xsl:template name="load_css">
    <xsl:call-template name="load_base_css"/>
  </xsl:template>

  <xsl:template name="load_base_css">
    <link rel="stylesheet" href="/m/mdp/faq.css" type="text/css" />
    <link rel="stylesheet" href="/m/mdp/MBooks/MBooksCol.css" type="text/css" /> 
  </xsl:template>

</xsl:stylesheet>
