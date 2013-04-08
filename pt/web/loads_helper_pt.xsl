<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1365452543'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var _js = [];
        _js.push("/pt/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume' and $gSkin='default'">
        _js.push("/pt/js/concatenated_PAGETURNER_VOLUME_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
        _js.push("/pt/js/concatenated_PAGETURNER_SEARCH_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
        _js.push("/pt/js/concatenated_LEGACY_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gSkin!='default'">
        _js.push("/pt/js/concatenated_LEGACY_PAGETURNER_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gItemType = 'volume' and $gUsingBookReader='true' and $gSkin != 'default'">
        _js.push("/pt/js/concatenated_LEGACY_BOOKREADER_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
        _js.push("/pt/js/concatenated_MOBILE_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        head.js.apply(this, _js);
    </script>
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
    <script type="text/javascript">
        var _js2 = [];
    _js2.push("/mdp-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.cookie.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/base.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/feedback.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume' and $gSkin='default'">
    _js2.push("/pt/vendor/nanoscroller/jquery.nanoscroller.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.fracs.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.viewport.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/BookBlock/js/jquerypp.custom.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/BookBlock/js/jquery.bookblock.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/downloader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/collection_tools.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/reader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/manager.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/imgsrv.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/view/image.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/view/scroll.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/view/thumb.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/view/flip.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/view/plaintext.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/scrolling.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/access_banner_02.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
    _js2.push("/pt/js/downloader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/collection_tools.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' or $gSkin='crms'">
    _js2.push("/pt/yui2-lib/build/yahoo/yahoo-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/event/event-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/dom/dom-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/dragdrop/dragdrop-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/container/container-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/connection/connection-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/utilities/utilities.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/yui2-lib/build/resize/resize-min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/versionPopup.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/jquery/jquery.trap.min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/js/feedbackForm.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/js/newCollOverlayCore.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/newCollOverlayPT.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/js/overlayUtils.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/js/listUtils.js<xsl:value-of select="$timestamp" />");
    _js2.push("/mdp-web/js/pageturner.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/boxy/jquery.boxy.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.cookie.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/init.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/download_helper.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gSkin!='default'">
    _js2.push("/pt/js/section108.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.tmpl.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.tmplPlus.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/classic.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='false' and $gItemType = 'volume' and $gUsingBookReader='true' and $gSkin != 'default'">
    _js2.push("/pt/vendor/jquery.easing.1.3.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.color.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/vendor/jquery.textfill.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/bookreader/BookReader/BookReader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/HTBookReader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/bookreader/BookReader/dragscrollable.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/js/lscache.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
    _js2.push("/pt/mobile/epub_download_helper.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/mobile/jquery.url.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/mobile/jquery-ui-1.8.5.custom.min.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/mobile/HTMobileBookReader.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/mobile/jquery.ui.ipad.js<xsl:value-of select="$timestamp" />");
    _js2.push("/pt/mobile/jquery.jswipe-0.1.2.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    head.js.apply(this, _js2);
    </script>
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