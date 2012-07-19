<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1342726526'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/mb/js/concatenated_common-min.js{$timestamp}"></script>
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
        <script type="text/javascript" src="/mb/js/concatenated_COLLLIST_JS-min.js{$timestamp}"></script>
    </xsl:if>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/mb/concatenated_common-min.css{$timestamp}"/>
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
        <link rel="stylesheet" type="text/css" href="/mb/concatenated_COLLLIST_CSS-min.css{$timestamp}" />
    </xsl:if>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
     <script type="text/javascript" src="/mb/yui2-lib/build/yahoo/yahoo-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/yui2-lib/build/event/event-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/yui2-lib/build/dom/dom-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/yui2-lib/build/dragdrop/dragdrop-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/yui2-lib/build/container/container-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/yui2-lib/build/connection/connection-min.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/feedbackCBForm.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/newCollOverlayCB.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/listUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/overlayUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/search.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/mb.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/tracking.js{$timestamp}"></script>
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
     <script type="text/javascript" src="/mb/js/jquery.tmpl.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/jquery.placeholder.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/date.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/jquery.ba-hashchange.js{$timestamp}"></script>
     <script type="text/javascript" src="/mb/js/hyphenator.js{$timestamp}"></script>
    </xsl:if>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="/mb/yui2-lib/build/fonts/fonts-min.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/mb/yui2-lib/build/container/assets/skins/sam/container.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/mb/mb.css{$timestamp}"/>
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
 <link rel="stylesheet" type="text/css" href="/mb/list_colls.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/mb/awesome.css{$timestamp}"/>
    </xsl:if>
</xsl:template>
</xsl:stylesheet>