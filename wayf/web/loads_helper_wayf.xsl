<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/wayf/js/concatenated_common-min.js?_=1313504037"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/wayf/concatenated_common-min.css?_=1313504037"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
 <script type="text/javascript" src="/wayf/js/login.js?_=1313504037"></script>
 <script type="text/javascript" src="/wayf/mobile/loginMobile.js?_=1313504037"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="//common-web/smallheader.css?_=1313504037"/>
 <link rel="stylesheet" type="text/css" href="/wayf/loginStyles.css?_=1313504037"/>
 <link rel="stylesheet" type="text/css" href="/wayf/mobile/loginStylesMobile.css?_=1313504037"/>
</xsl:template>
</xsl:stylesheet>