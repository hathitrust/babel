<?xml version="1.0" encoding="utf-8"?>
      <xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns="http://www.w3.org/1999/xhtml" version="1.0">
      <xsl:output method="html"/>
       
  <xsl:variable name="timestamp" select="'?_=1363712342'" />
  <xsl:template name="load_concat_js_file">
    <script type="text/javascript">
        var _js = [];
        _js.push("/mb/js/concatenated_common-min.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
        _js.push("/mb/js/concatenated_COLLLIST_JS-min.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
        head.js.apply(this, _js);
    </script>
  </xsl:template> 
  <xsl:template name="load_concat_css_file">
    <link rel="stylesheet" type="text/css" href="/mb/concatenated_common-min.css{$timestamp}"/>
  </xsl:template> 

  <xsl:template name="load_uncompressed_js">
    <script type="text/javascript">
        var _js = [];
    _js.push("//common-web/jquery/jquery.trap.min.js<xsl:value-of select="$timestamp" />");
    _js.push("/mb/js/mb.js<xsl:value-of select="$timestamp" />");
    _js.push("/mb/js/tracking.js<xsl:value-of select="$timestamp" />");
    <xsl:if test="//CurrentCgi/Param[@name='a'] = 'listcs'">
    _js.push("/mb/js/jquery.placeholder.js<xsl:value-of select="$timestamp" />");
    _js.push("/mb/js/date.js<xsl:value-of select="$timestamp" />");
    </xsl:if>
    head.js.apply(this, _js);
    </script>
</xsl:template>
 

 <xsl:template name="load_uncompressed_css">
</xsl:template>
</xsl:stylesheet>