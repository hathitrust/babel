<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:key name="institution-names" match="/MBooksTop/MBooksGlobals/Institutions/Inst" use="@sdrinst"/> 

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>
  <xsl:variable name="gGoogleOnclickTracking" select="'true'"/>

  <xsl:template name="footer">
    <xsl:param name="gUsingBookReader" select="'false'" />
    <div id="mbFooter">
      <xsl:if test="$gUsingBookReader = 'true'">
        <xsl:attribute name="class"><xsl:text>footerFixed</xsl:text></xsl:attribute>
      </xsl:if>
      <h2 class="SkipLink">More Page Information</h2>
        
      <div id="FooterCont">
        <!--All pages use Footer-->
        <xsl:call-template name="footerBrandingLinks"/>
          <!-- call this template in header.xsl, override particular templates-->
        <xsl:call-template name="footermbooksnav"/>
      </div>
    </div>
  </xsl:template>

  <!-- XXX copied from header and modified, call template mbooksnav instead and remove this and the called footer templates below  if they really should be the same-->
 <xsl:template name="footermbooksnav">
   <div class="MBooksNav">
     <ul>
       <xsl:call-template name="loginlink"/>
       <xsl:call-template name="footeraboutlink"/>
       <xsl:call-template name="helplink"/>
       <xsl:call-template name="footerfeedbacklink"/>
       <xsl:call-template name="mobilelink" />
       <xsl:call-template name="footertakedownlink"/>
       <xsl:call-template name="footerprivacylink"/>
       <xsl:call-template name="footercontactlink"/>
     </ul>
   </div>
 </xsl:template>

 <xsl:template name="footerBrandingLinks">
   <xsl:variable name="sdrinst" select="/MBooksTop/MBooksGlobals/EnvSDRINST"/>
   <div class="footerBrandingLinks">
     <xsl:choose>
       <xsl:when test="$sdrinst!=''">
         <xsl:value-of select="key('institution-names', $sdrinst)"/>
         <br />
         <em>Member, HathiTrust</em>
       </xsl:when>
       <xsl:otherwise></xsl:otherwise>
     </xsl:choose>
   </div>
 </xsl:template>

 <!--  mbooks nav content where its different in the footer-->

 <xsl:template name="footeraboutlink">
   <li>
     <a href="http://www.hathitrust.org/about" title="About Hathi Trust">About</a>
   </li>
 </xsl:template>
 
 <xsl:template name="mobilelink">
   <li>
     <a href="http://m.hathitrust.org/" title="HathiTrust Mobile">Mobile</a>
   </li>
</xsl:template>

 <xsl:template name="footertakedownlink">
   <li>
     <a href="http://www.hathitrust.org/take_down_policy" title="item removal policy">Take-Down Policy</a>
   </li>
 </xsl:template>

 <xsl:template name="footerprivacylink">
   <li>
     <a href="http://www.hathitrust.org/privacy" title="privacy policy">Privacy</a>
   </li>
 </xsl:template>
 
 <xsl:template name="footercontactlink">
   <li>
     <a href="http://www.hathitrust.org/contact" title="contact information">Contact</a>
   </li>
 </xsl:template>
 
 <xsl:template name="footerfeedbacklink">
   <li>
     <xsl:element name="a">
       <xsl:attribute name="href"/>
       <!--XXX note that we have to give this a unique id so
            its feedback_footer not just feedback as in the header
            any code or stylesheet for this will have to be modified accordingly -->
       <xsl:attribute name="id">feedback_footer</xsl:attribute>
       <xsl:attribute name="title">Feedback form for problems or comments</xsl:attribute>
       <xsl:element name="span">
         <xsl:text>Feedback</xsl:text>
       </xsl:element>
     </xsl:element>
   </li>
 </xsl:template>
 <!--########################## Google Analytics code #####################################-->
 
 <xsl:template name="google_analytics">
   <xsl:variable name="tracker_id" select="'UA-954893-23'"/>
   <xsl:variable name="accessType" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
   <xsl:if test="$gEnableGoogleAnalytics='true'">
     <script type="text/javascript">var gaJsHost = (("https:" == document.location.protocol) ? "https://ssl." : "http://www.");
     document.write(unescape("%3Cscript src='" + gaJsHost + "google-analytics.com/ga.js' type='text/javascript'%3E%3C/script%3E"));
     </script>
     <xsl:text disable-output-escaping="yes">
       &lt;script type="text/javascript"&gt;
       try {
       var pageTracker = _gat._getTracker("</xsl:text>
       <xsl:value-of select="$tracker_id"/>
       <xsl:text disable-output-escaping="yes">");
       pageTracker._setDomainName(".hathitrust.org");
       pageTracker._trackPageview();
       } catch(err) {}&lt;/script&gt;
     </xsl:text>
   </xsl:if>
 </xsl:template>
 
 <xsl:template name="PageTracker">
   <xsl:param name="label"/>
   <xsl:param name="category" select="'inLinks'"/>
   <xsl:param name="action" select="'click'"/>
   <xsl:variable name="debug" select="'false'"/>
   
   <xsl:text>javascript:</xsl:text>
   <xsl:choose>
     <xsl:when test="$debug = 'true'">
       <xsl:text>alert("google tracking params = category: </xsl:text>
       <xsl:value-of select="$category"/>
       <xsl:text>, action: </xsl:text>
       <xsl:value-of select="$action"/>
       <xsl:text>, label: </xsl:text>
       <xsl:value-of select="$label"/>
       <xsl:text>'");</xsl:text>
     </xsl:when>
     
     <xsl:otherwise>
       <xsl:text>try{pageTracker._trackEvent('</xsl:text>
       <xsl:value-of select="$category"/>
       <xsl:text>',' </xsl:text>
       <xsl:value-of select="$action"/>
       <xsl:text>',' </xsl:text>
       <xsl:value-of select="$label"/>
       <xsl:text>');}catch(e) {};</xsl:text>
     </xsl:otherwise>
   </xsl:choose>
 </xsl:template>
 
</xsl:stylesheet>

