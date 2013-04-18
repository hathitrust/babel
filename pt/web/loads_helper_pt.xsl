<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1366317257'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript" src="/pt/js/concatenated_common-min.js{$timestamp}"></script>
    <xsl:if test="//ItemType='volume' and $gSkin='default'">
        <script type="text/javascript" src="/pt/js/concatenated_PAGETURNER_VOLUME_JS-min.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
        <script type="text/javascript" src="/pt/js/concatenated_PAGETURNER_SEARCH_JS-min.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
        <script type="text/javascript" src="/pt/js/concatenated_LEGACY_JS-min.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gSkin!='default'">
        <script type="text/javascript" src="/pt/js/concatenated_LEGACY_PAGETURNER_JS-min.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gItemType = 'volume' and $gUsingBookReader='true' and $gSkin != 'default'">
        <script type="text/javascript" src="/pt/js/concatenated_LEGACY_BOOKREADER_JS-min.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
        <script type="text/javascript" src="/pt/js/concatenated_MOBILE_JS-min.js{$timestamp}"></script>
    </xsl:if>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/pt/concatenated_common-min.css{$timestamp}"/>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
        <link rel="stylesheet" type="text/css" href="/pt/concatenated_LEGACY_CSS-min.css{$timestamp}" />
    </xsl:if>
    <xsl:if test="$gSkin='mobile'">
        <link rel="stylesheet" type="text/css" href="/pt/concatenated_MOBILE_CSS-min.css{$timestamp}" />
    </xsl:if>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
     <script type="text/javascript" src="//common-web/jquery/jQuery-URL-Parser/purl.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.cookie.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/base.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/feedback.js{$timestamp}"></script>
    <xsl:if test="//ItemType='volume' and $gSkin='default'">
     <script type="text/javascript" src="/pt/vendor/nanoscroller/jquery.nanoscroller.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.fracs.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.viewport.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/BookBlock/js/jquerypp.custom.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/BookBlock/js/jquery.bookblock.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/slider/js/bootstrap-slider.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/scrolling.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/downloader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/collection_tools.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/reader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/manager.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/imgsrv.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/view/image.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/view/scroll.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/view/thumb.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/view/flip.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/view/plaintext.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/access_banner_02.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/version_popup.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
     <script type="text/javascript" src="/pt/js/downloader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/version_popup.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/collection_tools.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
     <script type="text/javascript" src="/pt/yui2-lib/build/yahoo/yahoo-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/event/event-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/dom/dom-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/dragdrop/dragdrop-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/container/container-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/connection/connection-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/utilities/utilities.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/yui2-lib/build/resize/resize-min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/versionPopup.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/jquery/jquery.trap.min.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/feedbackForm.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/newCollOverlayCore.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/newCollOverlayPT.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/overlayUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/listUtils.js{$timestamp}"></script>
     <script type="text/javascript" src="//common-web/js/pageturner.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/boxy/jquery.boxy.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.cookie.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/init.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/download_helper.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gSkin!='default'">
     <script type="text/javascript" src="/pt/js/section108.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.tmpl.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.tmplPlus.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/classic.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gItemType = 'volume' and $gUsingBookReader='true' and $gSkin != 'default'">
     <script type="text/javascript" src="/pt/vendor/jquery.easing.1.3.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.color.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/vendor/jquery.textfill.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/bookreader/BookReader/BookReader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/HTBookReader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/bookreader/BookReader/dragscrollable.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/js/lscache.js{$timestamp}"></script>
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
     <script type="text/javascript" src="/pt/mobile/epub_download_helper.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/mobile/jquery.url.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/mobile/jquery-ui-1.8.5.custom.min.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/mobile/HTMobileBookReader.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/mobile/jquery.ui.ipad.js{$timestamp}"></script>
     <script type="text/javascript" src="/pt/mobile/jquery.jswipe-0.1.2.js{$timestamp}"></script>
    </xsl:if>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
    <xsl:if test="$gSkin='mobile'">
 <link rel="stylesheet" type="text/css" href="/pt/mobile/mobilept.css{$timestamp}"/>
    </xsl:if>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
 <link rel="stylesheet" type="text/css" href="/pt/bookreader/BookReader/BookReader.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/fonts/fonts-min.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/container/assets/skins/sam/container.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/yui2-lib/build/resize/assets/skins/sam/resize.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/vendor/boxy/boxy.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/framework.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/feedback.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/pageviewer.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/harmony.css{$timestamp}"/>
 <link rel="stylesheet" type="text/css" href="/pt/download_helper.css{$timestamp}"/>
    </xsl:if>
</xsl:template>
</xsl:stylesheet>