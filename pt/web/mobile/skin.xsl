<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:template name="load_skin_js">
    <!-- Default is empty template to be overridden in skin specific template-->
    <xsl:if test="//ItemType = 'volume'">
      <script type="text/javascript">head.load('/pt/js/view/plaintext.scroll.js');</script>
      <script type="text/javascript">head.load('/pt/mobile/reader.js');</script>
    </xsl:if>
  </xsl:template>


   <xsl:template name="load_skin_css">
    <link rel="stylesheet" type="text/css" href="/pt/css/mobile.css" />
  </xsl:template>


</xsl:stylesheet>
