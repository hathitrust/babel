<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1414184565'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var HT = HT || {};
        (function() {
            // window.HT = window.HT || {};
            HT.scripts = HT.scripts || [];
    HT.scripts.push("/pt/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume'">
            HT.scripts.push("/pt/js/concatenated_PAGETURNER_VOLUME_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        })()
    </script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
    <script type="text/javascript">
        var HT = HT || {};
        (function() {
            // window.HT = window.HT || {};
            HT.scripts = HT.scripts || [];
            var to_load = HT.scripts;
            to_load.push("/pt/common-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/base.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/feedback.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/downloader.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/version_popup.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/embedHtml_popup.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/collection_tools.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/access_banner_02.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/google_analytics_experiment.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//ItemType='volume'">
            to_load.push("/pt/vendor/nanoscroller/jquery.nanoscroller.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/vendor/jquery.fracs.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/vendor/jquery.viewport.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/vendor/BookBlock/js/jquerypp.custom.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/vendor/BookBlock/js/jquery.bookblock.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/vendor/slider/js/bootstrap-slider.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/scrolling.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/reader.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/manager.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/imgsrv.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/view/image.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/view/scroll.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/view/thumb.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/view/flip.js<xsl:value-of select="$timestamp" />");
            to_load.push("/pt/js/view/plaintext.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        })()
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>