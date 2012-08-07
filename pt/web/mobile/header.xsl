<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../common-web/header.xsl"/>
  
  <xsl:output
    method="xml"
    indent="yes"
    encoding="utf-8"
    doctype-system="http://www.wapforum.org/DTD/xhtml-mobile10.dtd"
    doctype-public="-//WAPFORUM//DTD XHTML Mobile 1.0//EN"
    />

<!--
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"
    doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"
-->

    <xsl:template name="header">
    	<div style="display:none">
    	<xsl:call-template name="loginlink"/>
    	<xsl:call-template name="helplink"/>
    	<xsl:call-template name="feedbacklink"/>
    	</div>
    	<!--<xsl:call-template name="subnavheaderWrapper"/>-->
       <!--<div style="background-color:#FFFFFF;border-top:5px solid #494949; height:20px; width:100%; margin-bottom: 25px">
        <xsl:call-template name="subnavheaderWrapper"/>
      </div>-->
    </xsl:template>

    <xsl:template name="subnavheaderWrapper">
      <!--
      <div id="BRiteminfo" style="display:none">
        <div id="SubNavHeaderCont">
          <xsl:call-template name="subnav_header_short"/>
        </div>
      </div>
      -->
    </xsl:template>

    <!-- Navigation bar -->
    <xsl:template name="subnav_header_short">
      <div id="mdpItemBar">
        <div id="ItemBarContainer">
          <xsl:call-template name="ItemMetadata"/>
        </div>
      </div>
    </xsl:template>


 <xsl:template name="loginlink">
 
     <xsl:choose>
       <xsl:when test="/MBooksTop/MBooksGlobals/LoggedIn='NO'">
         <xsl:element name="a">
           <xsl:attribute name="id">mobilelogin</xsl:attribute>
           <xsl:attribute name="href">
             <xsl:value-of select="/MBooksTop/Header/LoginLink"/><xsl:text disable-output-escaping="yes">&amp;skin=mobilewayf;</xsl:text>
             <!-- ;skin=mobilewayf; -->
           </xsl:attribute>
           <xsl:text>Login</xsl:text>
         </xsl:element>
       </xsl:when>
       <xsl:otherwise>
         <span id="mobilelogin">
         <xsl:value-of select="concat('Hi ', /MBooksTop/Header/UserName, '! ')"/>
         <xsl:element name="a">
           <xsl:attribute name="href">
             <xsl:if test="/MBooksTop/Header/LoginLink!=''">
               <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
               <!-- ;skin=mobilewayf; -->
             </xsl:if>
           </xsl:attribute>
           <xsl:if test="/MBooksTop/Header/LoginLink=''">
             <xsl:attribute name="onClick">
               <xsl:text>window.alert('Please close your browser to logout'); return false;</xsl:text>
             </xsl:attribute>
           </xsl:if>
           <xsl:text>(logout)</xsl:text>
         </xsl:element>
         </span>
       </xsl:otherwise>
     </xsl:choose>
 
 </xsl:template>
 
 <xsl:template name="aboutlink">
 <!--
     <a href="http://www.hathitrust.org" title="About Hathi Trust">About</a>
     <xsl:attribute name="id">about</xsl:attribute>
 -->
 </xsl:template>
 
 <xsl:template name="helplink">
 
     <a>
       <xsl:attribute name="href">http://www.hathitrust.org/faq</xsl:attribute>
       <xsl:attribute name="id">mobilehelp</xsl:attribute>
       <xsl:attribute name="title">Help page and faq</xsl:attribute>
       <xsl:text>Help</xsl:text>
     </a>
 
 </xsl:template>
 
 <xsl:template name="feedbacklink">
 	<!-- <div style="display:none"> -->
     <xsl:element name="a">
       <xsl:attribute name="href"/>
       <xsl:attribute name="class">mobilefeedback</xsl:attribute>
       <xsl:text>Feedback</xsl:text>
     </xsl:element>
 	<!-- </div> -->
 </xsl:template>




</xsl:stylesheet>
