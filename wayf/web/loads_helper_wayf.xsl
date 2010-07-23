<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:template name="load_concat_js_file">    <script type="text/javascript" src="/wayf/js/concatenated_common-min.js"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">    <link rel="stylesheet" type="text/css" href="/wayf/concatenated_common-min.css"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
 <script type="text/javascript" src="/wayf/js/login.js"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="//common-web/smallheader.css"/>
 <link rel="stylesheet" type="text/css" href="/wayf/loginStyles.css"/>
</xsl:template>
</xsl:stylesheet>