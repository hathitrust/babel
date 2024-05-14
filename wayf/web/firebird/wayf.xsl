<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:h="http://www.hathitrust.org"
  xmlns="http://www.w3.org/1999/xhtml"
  extension-element-prefixes="exsl h">

  <xsl:template name="page-contents">
    <div class="mt-1 twocol wayf">
      <div class="twocol-main h-100" id="section">
        <div class="mainplain w-auto position-relative">
          <div class="row justify-content-md-center">
            <div class="col-md-auto">
              <h1 class="text-center">Log in with Your Institution</h1>
            </div>
          </div>
          <div class="row justify-content-md-center mt-3">
            <div class="col-md-10">
              <div class="row gx-5">
                <div class="col-md-6">
                  <h2>Find Your Institution</h2>
                  <p class="mt-3">
                    Search for your university or library in order to get access
                    to the largest number of volumes and features.
                  </p>

                  <hathi-login-form>
                    <xsl:if test="//Param[@name='target']">
                      <xsl:attribute name="data-prop-target"><xsl:value-of select="//Param[@name='target']" /></xsl:attribute>
                    </xsl:if>
                  </hathi-login-form>

                </div>
                <div class="col-md-6">
                  <h2>Guests</h2>
                  <p class="mt-3">
                    Can’t find your university or library in the list? You can log in as a guest. 
                    Guests have the ability to create and share their own collections when logged in.
                  </p>
                  <div class="mt-3 position-relative">
                    <h3>Log in with:</h3>

                    <ul class="list-unstyled">
                      <xsl:apply-templates select="SocialIdP_List/IdP_Site" />
                      <li>
                        <xsl:call-template name="build-friend-link">
                          <xsl:with-param name="link-text">University of Michigan Friend Account</xsl:with-param>
                        </xsl:call-template>
                      </li>
                    </ul>

                    <div>
                      <p>
                        Still need a way to log in? <a href="https://friend.weblogin.umich.edu/friend/">Create a University of Michigan Friend Account</a>
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div class="row mt-3 justify-content-md-center">
            <div class="col-md-10">
              <h2>Help</h2>
              <ul>
                <li><a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2386919473">Why isn't my institution listed?</a></li>
                <li><a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2386919473">What are the benefits of logging in as a member?</a></li>
                <li><a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2386919473">What can I access without logging in?</a></li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" href="/wayf/firebird/css/wayf.css" />
  </xsl:template>

  <xsl:template name="get-page-title">
    Log In
  </xsl:template>

  <xsl:template name="build-navbar-options">
     <xsl:attribute name="data-prop-search-state">none</xsl:attribute>
     <xsl:attribute name="data-prop-user-navigation">false</xsl:attribute>
  </xsl:template>

  <xsl:template match="IdP_Site">
    <li class="mb-2">
      <xsl:call-template name="get-provider-badge">
        <xsl:with-param name="inst_id" select="InstID" />
      </xsl:call-template>
      <a href="{Url}">
        <span class="offscreen">Log in with </span>
        <xsl:value-of select="LinkText" />
      </a>
    </li>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="get-provider-badge">
    <xsl:param name="inst_id" />
    <xsl:variable name="klass">
      <xsl:choose>
        <xsl:when test="$inst_id = 'google'">fa-google</xsl:when>
        <xsl:when test="$inst_id = 'twitter'">fa-twitter</xsl:when>
        <xsl:when test="$inst_id = 'facebook'">fa-facebook-f</xsl:when>
        <xsl:when test="$inst_id = 'linkedin'">fa-linkedin</xsl:when>
        <xsl:when test="$inst_id = 'live'">fa-windows</xsl:when>
        <xsl:when test="$inst_id = 'yahoo'">fa-yahoo</xsl:when>
        <xsl:when test="$inst_id = 'aol'">icomoon-aol</xsl:when>
        <xsl:otherwise>icomoon-blank</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <i class="fa-brands {$klass}" aria-hidden="true"></i><xsl:text> </xsl:text>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="build-friend-link">
    <xsl:param name="link-text" />
    <xsl:element name="a">
      <xsl:attribute name="href">
        <xsl:value-of select="/MBooksTop/FriendLoginLink"/>
      </xsl:attribute>
      <xsl:value-of select="$link-text" />
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>
