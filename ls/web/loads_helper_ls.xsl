<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1399918445'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var HT = HT || {};
        (function() {
            // window.HT = window.HT || {};
            HT.scripts = HT.scripts || [];
    HT.scripts.push("/ls/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
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
            to_load.push("/mdp-web/js/google_covers.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mdp-web/js/search_tools.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mdp-web/js/collection_tools.js<xsl:value-of select="$timestamp" />");
            to_load.push("/mdp-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
            to_load.push("/ls/js/ls_misc.js<xsl:value-of select="$timestamp" />");
            to_load.push("/ls/js/ls_advanced.js<xsl:value-of select="$timestamp" />");
        })()
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>