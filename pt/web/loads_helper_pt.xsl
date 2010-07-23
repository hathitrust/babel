<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:template name="load_concat_js_file">    <script type="text/javascript" src="/pt/js/concatenated_common-min.js"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">    <link rel="stylesheet" type="text/css" href="/pt/concatenated_common-min.css"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
 <script type="text/javascript" src="/pt/yui2-lib/build/yahoo/yahoo-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/event/event-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/dom/dom-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/dragdrop/dragdrop-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/container/container-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/connection/connection-min.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/utilities/utilities.js"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/resize/resize-min.js"></script>
 <script type="text/javascript" src="//common-web/js/feedbackForm.js"></script>
 <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js"></script>
 <script type="text/javascript" src="/pt/js/newCollOverlayPT.js"></script>
 <script type="text/javascript" src="//common-web/js/overlayUtils.js"></script>
 <script type="text/javascript" src="//common-web/js/listUtils.js"></script>
 <script type="text/javascript" src="/pt/js/section108.js"></script>
 <script type="text/javascript" src="/pt/js/pageturner.js"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/fonts/fonts-min.css"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/container/assets/skins/sam/container.css"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/resize/assets/skins/sam/resize.css"/>
 <link rel="stylesheet" type="text/css" href="//common-web/framework.css"/>
 <link rel="stylesheet" type="text/css" href="//common-web/feedback.css"/>
 <link rel="stylesheet" type="text/css" href="//common-web/pageviewer.css"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css"/>
</xsl:template>
</xsl:stylesheet>