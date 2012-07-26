<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>

  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <head>
        <meta http-equiv="Content-Type" content="text/html; charset=utf-8"/>
        <title>Login | HathiTrust Digital Library</title>
        <xsl:call-template name="load_js_and_css"/>
      </head>

      <body>
        <div id="pagecontent">
          <xsl:call-template name="smallheader"/>
          <xsl:call-template name="WAYF_PageContent"/>
          <!-- <xsl:call-template name="cancel"/> -->
        </div>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>
      </body>
    </html>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="cancel">
    <div id="cancel">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/SmallHeader/GoBackLink"/>
        </xsl:attribute>
        <xsl:text>Nevermind</xsl:text>
      </xsl:element>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="WAYF_PageContent">
    <div id="contentContainer">
      <div id="loginPage">
        <div class="colMain">
          <xsl:choose>
            <xsl:when test="IdP_List!=''">
              <div id="shibLogin" class="BoxCont">
                <div class="loginBox">
                  <h3><span>HathiTrust Partner Institutions</span></h3>
                  <div>
                    <form class="loginPrompt" onsubmit="return goto_page(this.idp.options[this.idp.selectedIndex].value)">
                      <label for="idp" id="Selectyourinstitution-ariaLabel" class="SkipLink">Select your institution</label>
                      <select id="idp" name="idp" aria-labelledby="Selectyourinstitution-ariaLabel">
                        <option value="0">Select your institution</option>
                        <xsl:for-each select="IdP_List/IdP_Site">
                          <xsl:element name="option">
                            <xsl:if test="Selected='1'">
                              <xsl:attribute name="selected">
                                <xsl:text>selected</xsl:text>
                              </xsl:attribute>
                            </xsl:if>
                            <xsl:attribute name="value">
                              <xsl:value-of select="Url"/>
                            </xsl:attribute>
                            <xsl:value-of select="LinkText"/>
                          </xsl:element>
                        </xsl:for-each>
                      </select>
                      <button type="submit">Login</button>
                    </form>
                  </div>
                  
                  <h4>Logging in will allow you to:</h4>
                  <p class="loggedinAccess">Download full PDFs of public domain &amp; open access items</p>
                  <p class="loggedinAccess">Create permanent public &amp; private collections</p>
                  <p>There is no sign up necessary. Login with your institutional account. <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed">Don't see your institution?</a></p>
                </div>
              </div>
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
          </xsl:choose>
          
          <div id="nonShibLogin" class="BoxCont">
            <div class="loginBox">        
              <h3><span>Not from a Partner Institution?</span></h3>
              <div>
                <p class="loginPrompt">
                  <xsl:element name="a">
                    <xsl:attribute name="href">
                      <xsl:value-of select="/MBooksTop/FriendLoginLink"/>
                    </xsl:attribute>
                    <xsl:text>Create or login with a guest "friend" account</xsl:text>
                  </xsl:element>
                </p>
              </div>
              <h4>Logging in will allow you to:</h4>
              <p class="loggedinAccess">Create permanent public &amp; private collections</p>
              <p class="friendNoAccess">Does NOT provide access to full PDF downloads of public domain &amp; open access items where not publicly available</p>
              <p>Read more about <a href="http://www.hathitrust.org/help_digital_library#FriendAccount">friend accounts</a>.</p>
            </div>
          </div>
          <p class="msg">Note: Logging in does NOT provide access to page images of "<span class="viewonly"/>Limited (search-only)" items.</p>
          
        </div>
      </div>
    </div>
  </xsl:template>

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

</xsl:stylesheet>
