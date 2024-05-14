<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:template name="main">
    <xsl:call-template name="display-error-message" />
  </xsl:template>

  <xsl:template name="display-error-message">
    <div id="mbContentContainer" class="main clearfix">
      <div class="alert alert-block alert-error">
        <p><xsl:apply-templates select="/MBooksTop/ErrorMessage" mode="copy-guts" /></p>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections: Error</xsl:text>
    <xsl:text> | HathiTrust Digital Library</xsl:text>
  </xsl:template>
    
</xsl:stylesheet>
  
