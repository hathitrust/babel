<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../2021/pageviewer_volume.xsl" />

  <xsl:template name="action-fullscreen" />

  <xsl:template name="list-surveys"></xsl:template>

  <xsl:template name="build-sidebar-beta-notice"></xsl:template>

  <xsl:template name="load-extra-main-script">
    <script type="text/javascript"><xsl:text>head.load('/pt/crms/crms.js</xsl:text><xsl:value-of select="$timestamp" /><xsl:text>')</xsl:text></script>
  </xsl:template>

</xsl:stylesheet>
