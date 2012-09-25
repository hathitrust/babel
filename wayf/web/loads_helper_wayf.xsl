<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1348600578'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/wayf/js/concatenated_common-min.js{$timestamp}"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/wayf/concatenated_common-min.css{$timestamp}"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
     <script type="text/javascript" src="/wayf/js/login.js{$timestamp}"></script>
     <script type="text/javascript" src="/wayf/mobile/loginMobile.js{$timestamp}"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="//common-web/smallheader.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/wayf/loginStyles.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/wayf/mobile/loginStylesMobile.css{$timestamp}"/>
</xsl:template>
</xsl:stylesheet>