<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1366320021'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var _js = [];
        _js.push("/ls/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
        head.js.apply(this, _js);
    </script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/ls/concatenated_common-min.css{$timestamp}"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
    <script type="text/javascript">
        var _js = [];
    _js.push("/mdp-web/js/google_covers.js<xsl:value-of select="$timestamp" />");
    _js.push("/mdp-web/js/search_tools.js<xsl:value-of select="$timestamp" />");
    _js.push("/mdp-web/js/collection_tools.js<xsl:value-of select="$timestamp" />");
    _js.push("/mdp-web/jquery/jQuery-URL-Parser/purl.js<xsl:value-of select="$timestamp" />");
    _js.push("/ls/js/ls_misc.js<xsl:value-of select="$timestamp" />");
    _js.push("/ls/js/ls_advanced.js<xsl:value-of select="$timestamp" />");
    head.js.apply(this, _js);
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>