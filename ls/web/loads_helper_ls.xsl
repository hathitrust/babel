<?xml version="1.0" encoding="utf-8"?>

      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
      <xsl:variable name="timestamp" select="'?_=1343163394'" />

  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/ls/js/concatenated_common-min.js{$timestamp}"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/ls/concatenated_common-min.css{$timestamp}"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
     <script type="text/javascript" src="/ls/yui2-lib/build/yahoo/yahoo-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/yui2-lib/build/event/event-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/yui2-lib/build/dom/dom-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/yui2-lib/build/dragdrop/dragdrop-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/yui2-lib/build/container/container-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/yui2-lib/build/connection/connection-min.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/jquery/jquery.trap.min.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/jquery/boxy/jquery.boxy.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/feedbackLSForm.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/overlayUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/listUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/search.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/js/newCollOverlayLS.js{$timestamp}"></script>
     <script type="text/javascript" src="/ls/js/ls_misc.js{$timestamp}"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="/  web/loads_helper_ls.xslls/yui2-lib/build/fonts/fonts-min.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/ls/yui2-lib/build/container/assets/skins/sam/container.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/jquery/boxy/boxy.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/feedback.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css{$timestamp}"/>
</xsl:template>
</xsl:stylesheet>
