<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>
  <xsl:variable name="gGoogleOnclickTracking" select="'true'"/>

  <xsl:template name="footer">
    <xsl:param name="gUsingBookReader" select="'false'" />
    <div id="mbFooter" role="contentinfo">
      <xsl:if test="$gUsingBookReader = 'true'">
        <xsl:attribute name="class"><xsl:text>footerFixed</xsl:text></xsl:attribute>
      </xsl:if>
      <h2 class="offscreen">Footer</h2>
        
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
   <xsl:variable name="inst" select="/MBooksTop/MBooksGlobals/InstitutionName"/>
   <div class="footerBrandingLinks">
     <xsl:choose>
       <xsl:when test="$inst!=''">
         <xsl:value-of select="$inst"/>
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
       // turn semicolons into ampersands for analytics reporting
       pageTracker._setDomainName(".hathitrust.org");
       var href = (location.pathname + location.search).replace(/;/g, '&amp;');
       pageTracker._trackPageview(href);

       } catch(err) { }
       try {
       // track hierarchy
       if ( location.pathname.indexOf("XXX/cgi/pt") > -1 ) {
         var nextTracker = _gat._getTracker('UA-39581946-1');
         nextTracker._setAllowHash(false);
         nextTracker._setDomainName(".hathitrust.org");
         href = [location.pathname];
         var url = $.url();
         href.push("id=" + encodeURIComponent(url.param('id')));
         if ( location.pathname == '/cgi/pt' ) {
           href.push("view=" + url.param('view'));
           if ( url.param('seq') ) {
              href.push("seq=" + url.param('seq'));
           }
         } else {
           href.push("start=" + (url.param('start') ? url.param('start') : "1"));
         }
         href = href.join("/");
         nextTracker._trackPageview(href);
       }
       } catch(err) { console.log(err); }
       &lt;/script&gt;
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

