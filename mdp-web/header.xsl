<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns="http://www.w3.org/1999/xhtml"
  extension-element-prefixes="exsl">
  
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gHttpHost" select="/MBooksTop/MBooksGlobals/HttpHost"/>
  <xsl:variable name="gHtId" select="/MBooksTop/MBooksGlobals/HtId"/>
  
  <xsl:template name="header">
    <div id="mbHeader">
      <!--All pages use Header-->
      <xsl:call-template name="skipNavLink"/>
      <xsl:call-template name="heading1"/>
      <xsl:call-template name="AccessStatement"/>
      
      <div id="masthead">
        <xsl:call-template name="branding"/>
        <xsl:call-template name="mbooksnav"/>
        <!--<xsl:call-template name="Survey"/>-->
        <!--<xsl:call-template name="SpecialHeaderLink"/>-->
      </div>
      
      <xsl:call-template name="cbnavcontainer"/>
      <xsl:call-template name="subnavheaderWrapper"/>
    </div>
    <xsl:call-template name="skipNavAnchor"/>
    
  </xsl:template>
  
  
  <xsl:template name="skipNavLink">
    <xsl:element name="a">
      <xsl:attribute name="class">SkipLink</xsl:attribute>
      <xsl:attribute name="href">#skipNav</xsl:attribute>
      <xsl:attribute name="accesskey">2</xsl:attribute>
      <xsl:text>Skip navigation</xsl:text>      
    </xsl:element>
  </xsl:template>
  
  <xsl:template name="skipNavAnchor">
    <xsl:element name="a">
      <xsl:attribute name="name">skipNav</xsl:attribute>
      <xsl:attribute name="id">skipNav</xsl:attribute>
    </xsl:element>
  </xsl:template>
  
  <xsl:template name="heading1">
    <xsl:element name="h1">
      <xsl:attribute name="class">offscreen</xsl:attribute>
      <xsl:call-template name="get_page_title"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="get_page_title" />
  
  <xsl:template name="mbooksnav">
    <div class="MBooksNav" role="navigation">
      <h2 class="SkipLink">Navigation links for login, help, feedback, etc.</h2>
      <ul>
        <xsl:call-template name="loginlink"/>
        <xsl:call-template name="helplink"/>
        <xsl:call-template name="feedbacklink"/>
      </ul>
    </div>
  </xsl:template>
  
  <xsl:template name="AccessStatement">
    <xsl:variable name="loginlink">
      <xsl:call-template name="loginlink" />
    </xsl:variable>
    <xsl:variable name="li" select="exsl:node-set($loginlink)/li" />
    <div class="offscreen" role="note">
      <h2>Text Only Views</h2>
      <xsl:if test="normalize-space($li)">
        <p><xsl:copy-of select="$li/*|$li/text()" /></p>
      </xsl:if>
      <xsl:if test="$gHtId">
        <p>Go to the <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only view of this item.</xsl:element></p>
      </xsl:if>
      <ul>
        <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        <li>See the <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</li>
      </ul>
    </div>
  </xsl:template>  
  
  <xsl:template name="Survey">
    <div id="surveylink"><a href="http://www.surveygizmo.com/s/107495/hathi-trust-digital-library">Take our survey!</a></div>
  </xsl:template>
  
  <xsl:template name="SpecialHeaderLink">
    <div id="LSsearch"><a href="ls">Try our experimental full-text search!</a></div>
  </xsl:template>  
  
  <xsl:template name="branding">
    <div class="branding" role="branding">
      <div class="brandingLogo">
        <a href="http://catalog.hathitrust.org">
          <span id="brandingLabel">HathiTrust </span>
          <span>Digital Library</span>
        </a>
      </div>
    </div>
  </xsl:template>
  
  <xsl:template name="cbnavcontainer">
   <div id="CBNavContainer">
     <div id="CBNav">
       <h2 class="SkipLink">Navigation links for search and collections</h2>
       <ul>
         <li>
           <a href="http://www.hathitrust.org"><span title="Catalog Search">Home</span></a>
         </li>
         <li>
           <a href="http://www.hathitrust.org/about"><span title="About HathiTrust">About</span></a>
         </li>
         <li id="PubCollLink">
           <xsl:element name="a">
             <xsl:attribute name="href">
               <xsl:value-of select="/MBooksTop/Header/PubCollLink"/>
             </xsl:attribute>
             <span title="Collections">Collections</span>
           </xsl:element>
         </li>
         <li id="PrivCollLink">
           <xsl:element name="a">
             <xsl:attribute name="href">
               <xsl:value-of select="/MBooksTop/Header/PrivCollLink"/>
             </xsl:attribute>
             <span title="My Collections">My Collections</span>
           </xsl:element>
         </li>
         
         <li>
           <!-- XXX Suz make jumpToColl widget is coded for accessibility-->
           <xsl:for-each select="/MBooksTop/Header/JumpToCollWidget">
             <!-- only include widget if there is something to include -->
             <xsl:if test="count(/MBooksTop/Header/JumpToCollWidget/Option) &gt; '1'">
               <label for="jumpToColl" class="SkipLink">Jump to a collection</label>
               <xsl:call-template name="BuildHtmlSelect">
                 <xsl:with-param name="id">jumpToColl</xsl:with-param>
                 <xsl:with-param name="class" select="'c'"/>
                 <xsl:with-param name="key">
                   <xsl:text>jumpToColl()</xsl:text>
                 </xsl:with-param>
               </xsl:call-template>
             </xsl:if>
           </xsl:for-each>
         </li>

         <!-- New Search portal takes the place of this, but might want to repurpose it>
         <li>
           <xsl:element name="a">
             <xsl:attribute name="href"><xsl:text> </xsl:text></xsl:attribute>
             <xsl:attribute name="id">getStarted</xsl:attribute>
             <span title="Getting Started">Getting Started</span>
           </xsl:element>
         </li>
         -->
       </ul>
     </div>
   </div>
 </xsl:template>

 <xsl:template name="subnavheaderWrapper">
   <!--XXX The only reason this "wrapper" exists is because of the
   couple of divs ...  -->

   <!--SubNav Header-->
   <!--All pages will have a SubNavHeader, but text/links will be different-->
   <div id="SubNavHeader" role="navigation">
     <div id="SubNavHeaderCont">
       <xsl:call-template name="subnav_header"/>
     </div>
   </div>
 </xsl:template>

 <!--######################################################################-->
 <!-- Templates for links in mbooksnav -->
 <!--######################################################################-->
 <xsl:template name="loginlink">
   <li>
     <xsl:choose>
       <xsl:when test="/MBooksTop/MBooksGlobals/LoggedIn='NO'">
         <xsl:element name="a">
           <xsl:attribute name="href">
             <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
           </xsl:attribute>
           <xsl:attribute name="class">
             <xsl:text>loginLink</xsl:text>
           </xsl:attribute>
           <xsl:text>Login</xsl:text>
         </xsl:element>
       </xsl:when>
       <xsl:otherwise>
         <xsl:value-of select="concat('Hi ', /MBooksTop/Header/UserName, '!')"/>
         <xsl:text> </xsl:text>
         <xsl:element name="a">
           <xsl:attribute name="href">
             <xsl:if test="/MBooksTop/Header/LoginLink!=''">
               <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
             </xsl:if>
           </xsl:attribute>
           <xsl:attribute name="class">
             <xsl:text>loginLink</xsl:text>
           </xsl:attribute>
           <xsl:if test="/MBooksTop/Header/LoginLink=''">
             <xsl:attribute name="onClick">
               <xsl:text>window.alert('Please close your browser to logout'); return false;</xsl:text>
             </xsl:attribute>
           </xsl:if>
           <xsl:text>(logout)</xsl:text>
         </xsl:element>
       </xsl:otherwise>
     </xsl:choose>
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
 
 <xsl:template name="feedbacklink">
   <li>
     <xsl:element name="a">
       <xsl:attribute name="href"/>
       <xsl:attribute name="id">feedback</xsl:attribute>
       <xsl:attribute name="title">Feedback form for problems or comments</xsl:attribute>
       <xsl:element name="span">
         <xsl:text>Feedback</xsl:text>
       </xsl:element>
     </xsl:element>
   </li>
 </xsl:template>
 
 <xsl:template name="takedownlink">
   <!-- In header this does nothing, override in footer -->
 </xsl:template>

 <!--######################################################################-->
 <!--XXX consider whether header.xsl is where this belongs.  Its not used in the header but is called in several different pages. -->
 <xsl:template name="LoginMsg">
   <xsl:choose>
     <xsl:when test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO'">
       <div class="loginpromt">
         <span>You are not logged in.
         <a class="inlineLink">
           <xsl:attribute name="href">
             <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
           </xsl:attribute>
           Log in</a>
         </span>
         <p>Logging in lets you create and save permanent collections.<br/>
         Or, use the "Create New Collection" link above to create temporary collections.</p>
       </div>
     </xsl:when>
     <xsl:otherwise></xsl:otherwise>
   </xsl:choose>
 </xsl:template>
 
</xsl:stylesheet>

