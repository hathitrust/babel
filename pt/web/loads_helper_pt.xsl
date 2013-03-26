<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1364417844'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var _js = [];
        _js.push("/pt/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume'">
        _js.push("/pt/js/concatenated_PAGETURNER_VOLUME_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
        _js.push("/pt/js/concatenated_PAGETURNER_SEARCH_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
        _js.push("/pt/js/concatenated_MOBILE_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        head.js.apply(this, _js);
    </script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/pt/concatenated_common-min.css{$timestamp}"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
    <script type="text/javascript">
        var _js = [];
    _js.push("/mdp-web/js/collection_tools.js<xsl:value-of select="$timestamp" />");
    _js.push("/mdp-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/vendor/jquery.cookie.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/base.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume'">
    _js.push("/pt/vendor/nanoscroller/jquery.nanoscroller.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/vendor/jquery.fracs.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/vendor/jquery.viewport.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/vendor/BookBlock/js/jquerypp.custom.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/vendor/BookBlock/js/jquery.bookblock.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/reader.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/downloader.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/manager.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/imgsrv.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/view/image.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/view/scroll.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/view/thumb.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/view/flip.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/view/plaintext.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/js/scrolling.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gUsingSearch='true'">
    _js.push("/pt/js/downloader.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    <xsl:if test="$gSkin='mobile' and $gItemType='volume' and $gUsingBookReader='true'">
    _js.push("/pt/mobile/epub_download_helper.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/mobile/jquery.url.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/mobile/jquery-ui-1.8.5.custom.min.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/mobile/HTMobileBookReader.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/mobile/jquery.ui.ipad.js<xsl:value-of select="$timestamp" />");
    _js.push("/pt/mobile/jquery.jswipe-0.1.2.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    head.js.apply(this, _js);
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>
