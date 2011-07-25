<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/ls/js/concatenated_common-min.js?_=1311629782"></script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/ls/concatenated_common-min.css?_=1311629782"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
 <script type="text/javascript" src="/ls/yui2-lib/build/yahoo/yahoo-min.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/yui2-lib/build/event/event-min.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/yui2-lib/build/dom/dom-min.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/yui2-lib/build/dragdrop/dragdrop-min.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/yui2-lib/build/container/container-min.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/yui2-lib/build/connection/connection-min.js?_=1311629782"></script>
 <script type="text/javascript" src="//common-web/js/feedbackLSForm.js?_=1311629782"></script>
 <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js?_=1311629782"></script>
 <script type="text/javascript" src="//common-web/js/overlayUtils.js?_=1311629782"></script>
 <script type="text/javascript" src="//common-web/js/listUtils.js?_=1311629782"></script>
 <script type="text/javascript" src="//common-web/js/search.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/js/newCollOverlayLS.js?_=1311629782"></script>
 <script type="text/javascript" src="/ls/js/ls_misc.js?_=1311629782"></script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="/ls/yui2-lib/build/fonts/fonts-min.css?_=1311629782"/>
 <link rel="stylesheet" type="text/css" href="/ls/yui2-lib/build/container/assets/skins/sam/container.css?_=1311629782"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css?_=1311629782"/>
</xsl:template>
</xsl:stylesheet>