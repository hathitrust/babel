<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../legacy/wayf.xsl"/>
    
    <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
       	<meta name="HandheldFriendly" content="true" />
		<link rel="alternate" media="handheld" href="" />
		<meta name="viewport" content="width=device-width; initial-scale=1.0; maximum-scale=1; minimum-scale=1; user-scalable=0;" />
		<meta name="format-detection" content="telephone=no" />
        <title>Login | HathiTrust Mobile Digital Library</title>
        <xsl:call-template name="load_base_js" /> <!-- Unicorn temporary solution to load loginMobile.js for loginHomeClick() -->
        <xsl:call-template name="load_js_and_css"/>
      </head>

      <body>
      	<div id="frontpage">
      	<div class="header">
    		<a href="http://m.hathitrust.org" class="htlogobutton" ></a> <!-- todo - un-hardcode the href? -->
			<!-- <a href="">&lt;&lt;&nbsp;Results</a> -->
		</div>
      
        <div id="pagecontent">
          <!--<xsl:call-template name="smallheader"/>-->
          <xsl:call-template name="WAYF_PageContent"/>
          <!-- <xsl:call-template name="cancel"/> -->
        </div>
        </div>
        <xsl:call-template name="WAYF_SelectPage"/>
      </body>
    </html>
  </xsl:template>  
  
  
  <xsl:template name="WAYF_SelectPage">
  	<div id="selectinst" style="display:none">
      	<div class="header">
    		<a href="http://m.hathitrust.org" class="htlogobutton" ></a> <!-- todo - un-hardcode the href? -->
    		<!-- <a href="#" class="htlogobutton" ></a> -->
			<a class="backlink" href="#" onclick="return loginHomeClick();"><xsl:text disable-output-escaping="yes">&lt;&lt; Login Home</xsl:text></a>
		</div>  	
  	
		<div class="instheading">Select Your Institution:</div>
		<ul id="instlist">
			<xsl:for-each select="IdP_List/IdP_Site">
				<li>
                    <xsl:element name="a">
                    	<xsl:attribute name="href">
                        	<xsl:value-of select="Url"/>
                        </xsl:attribute>
                        <xsl:value-of select="LinkText"/>
                	</xsl:element>
                </li>
        	</xsl:for-each>
		</ul>
		<a class="noinst" href="http://www.hathitrust.org/faq#Shibboleth">Don't see your institution?</a>
  	</div>
  </xsl:template>
  
  <!-- TEMPLATE -->
  <xsl:template name="WAYF_PageContent">
    <div id="contentContainer">
    <!-- id="loginPage" -->
      <div >
        <div class="colMain">
          <xsl:choose>
            <xsl:when test="IdP_List!=''">
            <!--class="BoxCont"-->
              <div id="mobileShibLogin"  >
                <div class="mobileLoginBox">
                  <!--<h3>-->
                  <div class="heading">HathiTrust Partner Institutions</div>

                  <p class="loggedinAccess">Download full PDFs of public domain &amp; open access items</p>
                  <p class="loggedinAccess">Create permanent public &amp; private collections</p>
                  <p>There is no sign up necessary. Login with your institutional account. <a href="http://www.hathitrust.org/faq#Shibboleth">Don't see your institution?</a></p>
                
                  <div class="loginbutton">
                  	<!--<button onclick="return loginButtonClick();">-->
                  	<a href="#" onclick="return loginButtonClick();">Partner Login</a>
                  </div>
                </div>
              </div>
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
          </xsl:choose>
           <!--class="BoxCont"-->
          <div id="mobileNonShibLogin" >
            <div class="mobileLoginBox">        
              <div class="heading">Not from a Partner Institution?</div>              <!--<h4>Logging in will allow you to:</h4>-->
              <p class="loggedinNoAccess">Does NOT provide access to full PDF downloads of items not already publicly available</p>
              <p class="loggedinAccess">View your private collections (Regular site only)</p>
              
                <div class="friend">
                  <xsl:element name="a">
                    <xsl:attribute name="href">
                      <xsl:value-of select="/MBooksTop/FriendLoginLink"/>
                    </xsl:attribute>
                    <xsl:text>Create account or login as a friend</xsl:text>
                  </xsl:element>
                </div>
              
              
            </div>
          </div>
          
        </div>
      </div>
    </div>
  </xsl:template>  
  
</xsl:stylesheet>


 
