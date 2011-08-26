<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/pt/js/concatenated_common-min.js?_=1314371813"></script>
    <xsl:if test="$gUsingSearch='false'">
        <script type="text/javascript" src="/pt/js/concatenated_PAGETURNER_JS-min.js?_=1314371813"></script>
    </xsl:if>
    <xsl:if test="$gUsingBookReader='true'">
        <script type="text/javascript" src="/pt/js/concatenated_BOOKREADER_JS-min.js?_=1314371813"></script>
    </xsl:if>
    <xsl:if test="$gUsingBookReader='true'">
        <script type="text/javascript" src="/pt/js/concatenated_MOBILE_JS-min.js?_=1314371813"></script>
    </xsl:if>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/pt/concatenated_common-min.css?_=1314371813"/>
    <xsl:if test="$gUsingSearch='true'">
        <link rel="stylesheet" type="text/css" href="/pt/concatenated_SEARCH_CSS-min.css?_=1314371813" />
    </xsl:if>
    <xsl:if test="$gSkin='mobile'">
        <link rel="stylesheet" type="text/css" href="/pt/concatenated_MOBILE_CSS-min.css?_=1314371813" />
    </xsl:if>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
 <script type="text/javascript" src="/pt/yui2-lib/build/yahoo/yahoo-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/event/event-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/dom/dom-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/dragdrop/dragdrop-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/container/container-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/connection/connection-min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/utilities/utilities.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/yui2-lib/build/resize/resize-min.js?_=1314371813"></script>
 <script type="text/javascript" src="//common-web/js/feedbackForm.js?_=1314371813"></script>
 <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/newCollOverlayPT.js?_=1314371813"></script>
 <script type="text/javascript" src="//common-web/js/overlayUtils.js?_=1314371813"></script>
 <script type="text/javascript" src="//common-web/js/listUtils.js?_=1314371813"></script>
 <script type="text/javascript" src="//common-web/js/pageturner.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/jquery/boxy/jquery.boxy.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/init.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/download_helper.js?_=1314371813"></script>
    <xsl:if test="$gUsingBookReader='true'">
 <script type="text/javascript" src="/pt/mobile/epub_download_helper.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/mobile/jquery.url.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/mobile/jquery-ui-1.8.5.custom.min.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/mobile/HTMobileBookReader.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/mobile/jquery.ui.ipad.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/mobile/jquery.jswipe-0.1.2.js?_=1314371813"></script>
    </xsl:if>
    <xsl:if test="$gUsingBookReader='true'">
 <script type="text/javascript" src="/pt/jquery/jquery.easing.1.3.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/jquery/jquery.color.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/jquery/jquery.textfill.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/bookreader/BookReader/BookReader.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/HTBookReader.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/bookreader/BookReader/dragscrollable.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/lscache.js?_=1314371813"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='false'">
 <script type="text/javascript" src="/pt/js/section108.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/jquery/jquery.tmpl.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/jquery/jquery.tmplPlus.js?_=1314371813"></script>
 <script type="text/javascript" src="/pt/js/classic.js?_=1314371813"></script>
    </xsl:if>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/fonts/fonts-min.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/container/assets/skins/sam/container.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/resize/assets/skins/sam/resize.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="//common-web/framework.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="//common-web/feedback.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="//common-web/pageviewer.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="/pt/harmony.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="/pt/jquery/boxy/boxy.css?_=1314371813"/>
 <link rel="stylesheet" type="text/css" href="/pt/download_helper.css?_=1314371813"/>
    <xsl:if test="$gSkin='mobile'">
 <link rel="stylesheet" type="text/css" href="/pt/mobile/mobilept.css?_=1314371813"/>
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
 <link rel="stylesheet" type="text/css" href="/pt/searchresults.css?_=1314371813"/>
    </xsl:if>
</xsl:template>
</xsl:stylesheet>