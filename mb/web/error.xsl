<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <!-- overide debug style if debug flag is on -->
        <xsl:call-template name="debug_CSS"/>
        <title>My HathiTrust Digital Library Error</title>
      </head>

      <body>
        <xsl:call-template name="header"/>
        <xsl:call-template name="ErrorMessage"/>
      </body>
    </html>
  </xsl:template>

  <xsl:template name="ErrorMessage">
    <div class="error">
      <p><xsl:value-of select="/MBooksTop/ErrorMessage"/></p>
    </div>
    </xsl:template>

  <xsl:template name="subnav_header">
  </xsl:template>
    
</xsl:stylesheet>
  
