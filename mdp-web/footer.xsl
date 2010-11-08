<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

<xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>
<xsl:variable name="gGoogleOnclickTracking" select="'true'"/>

  <xsl:template name="footer">
    <div id="mbFooter">
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
       <xsl:call-template name="aboutlink"/>
       <xsl:call-template name="helplink"/>
       <xsl:call-template name="footerfeedbacklink"/>
       <xsl:call-template name="footertakedownlink"/>
     </ul>
   </div>
 </xsl:template>


 <xsl:template name="footerBrandingLinks">
   <xsl:variable name="sdrinst" select="/MBooksTop/MBooksGlobals/EnvSDRINST"/>
   <div class="footerBrandingLinks">
     <xsl:choose>
       <xsl:when test="$sdrinst='uom'">
         <xsl:text>University of Michigan</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='wisc'">
         <xsl:text>University of Wisconsin</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='ucal'">
         <xsl:text>University of California</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='ind'">
         <xsl:text>Indiana University</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='purdue'">
         <xsl:text>Purdue University</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='chi'">
         <xsl:text>The University of Chicago</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='uic'">
         <xsl:text>University of Illinois at Chicago</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='uiuc'">
         <xsl:text>University of Illinois</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='iowa'">
         <xsl:text>University of Iowa</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='minn'">
         <xsl:text>University of Minnesota</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='msu'">
         <xsl:text>Michigan State University</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='nwu'">
         <xsl:text>Northwestern University</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='osu'">
         <xsl:text>The Ohio State University</xsl:text>
       </xsl:when>
       <xsl:when test="$sdrinst='psu'">
         <xsl:text>Penn State University</xsl:text>
       </xsl:when>
       <xsl:otherwise>
         <xsl:text></xsl:text>
       </xsl:otherwise>
     </xsl:choose>
     <br />
     <xsl:choose>
       <xsl:when test="$sdrinst=''">
         <xsl:text></xsl:text>
       </xsl:when>
       <xsl:otherwise>
         <em>Member, HathiTrust</em>
       </xsl:otherwise>
     </xsl:choose>
   </div>
 </xsl:template>

 <!--  mbooks nav content where its different in the footer-->

 <xsl:template name="footertakedownlink">
   <li>
     | <a href="http://www.hathitrust.org/take_down_policy" title="item removal policy">Take-Down Policy</a>
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

