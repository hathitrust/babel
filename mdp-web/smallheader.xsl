<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:template name="smallheader">
    <div id="smallHeader">
      <!--All pages use Header-->
      <xsl:call-template name="Accessibilitylink"/>

      <div id="masthead">
        <xsl:call-template name="branding"/>
        <xsl:call-template name="mbooksnav"/>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="mbooksnav">
    <div class="MBooksNav">
      <h2 class="SkipLink">Navigation links for login, help, feedback, etc.</h2>
        <ul>
          <xsl:call-template name="aboutlink"/>
          <xsl:call-template name="helplink"/>
        </ul>
    </div>
  </xsl:template>

 <xsl:template name="Accessibilitylink">
   <div class="SkipLink">
     <xsl:text>Go to the </xsl:text>
     <a href="//common-web/accessibility.html">web accessibility page</a> 
     <xsl:text> for access keys and other accessibility related information.</xsl:text>
   </div>
 </xsl:template>

 <xsl:template name="branding">
   <div class="branding">
     <div class="brandingLogo">
       <a href="http://catalog.hathitrust.org"><img src="//common-web/graphics/HathiTrust.gif" alt="Hathi Trust Logo"/>
        <span>Digital Library</span></a>
     </div>
   </div>
 </xsl:template>

 <xsl:template name="aboutlink">
   <li>
     <a href="http://www.hathitrust.org/about" title="About Hathi Trust">About</a>
   </li>
 </xsl:template>
 
 <xsl:template name="helplink">
   <li>
     <a>
       <xsl:attribute name="href">http://www.hathitrust.org/help</xsl:attribute>
       <xsl:attribute name="title">Help page and faq</xsl:attribute>
       <xsl:text>Help</xsl:text>
     </a>
   </li>
 </xsl:template>
 
</xsl:stylesheet>

