<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1496266443'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var HT = HT || {};
        (function() {
            // window.HT = window.HT || {};
            HT.scripts = HT.scripts || [];
    HT.scripts.push("/mb/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
            HT.scripts.push("/mb/js/concatenated_COLLLIST_JS-min.js<xsl:value-of select="$timestamp" />");
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
            to_load.push("/mb/common-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/js/mb.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/js/tracking.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/js/help_modals.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/common-web/js/google_covers.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/common-web/js/collection_tools.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/common-web/js/search_tools.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/common-web/js/social_links.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
            to_load.push("/mb/js/date.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mb/js/listcs_collection_tools.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        })()
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>