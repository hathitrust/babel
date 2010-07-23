<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html>
      <head>
        <title>redirect</title>
        <meta HTTP-EQUIV="refresh">
          <xsl:attribute name="CONTENT">
            <xsl:text>"0";</xsl:text>
            <xsl:value-of select="/MBooksTop/RedirectUrl"/>
          </xsl:attribute>
        </meta>
      </head>
      
      <body>
        This page has moved. You will be 
        automatically redirected 
        to its new location in 3 seconds. 
        If you aren't forwarded 
        to the new page, 
        <a>
          <xsl:attribute name="href">
            <xsl:value-of select="/MBooksTop/RedirectUrl"/>
          </xsl:attribute>
          click here
        </a>. 
        
      </body>
    </html>    
  </xsl:template>
  
   </xsl:stylesheet>
   
