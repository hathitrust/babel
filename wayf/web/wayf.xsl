<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:h="http://www.hathitrust.org"
  xmlns="http://www.w3.org/1999/xhtml"
  extension-element-prefixes="exsl h">

  <!-- Main template lives in skeleton.xsl -->

  <!-- TEMPLATE over-rides -->
  <xsl:template name="login-block"/>
  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/wayf/css/screen.css" />
    <script type="text/javascript" src="/wayf/js/login.js"></script>
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=yes" />
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> no-search no-login</xsl:text>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Login</xsl:text>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <a class="offscreen skip-link" href="#main">Skip to main</a>
  </xsl:template>

  <!-- main TEMPLATE -->

  <xsl:template name="contents">
    <style>


    </style>

    <h2 id="main" class="main-section-title">Log in to get the most out of HathiTrust.</h2>
    <xsl:if test="normalize-space(//BackToRefererLink)">
      <div class="back-to-referer">
        <a class="btn" href="{//BackToRefererLink}"><i class="icomoon icomoon-arrow-left" aria-hidden="true"></i> Go back</a>
      </div>
    </xsl:if>

    <!-- PARTNERS -->
    <div class="row versus">
      <div>
        <div>
          <h3 class="partner-cell-title">Members of partner institutions</h3>
          <p class="partner-cell-text">Members of partner institutions get access to the largest number of volumes and features by logging in through their institution.</p>

          <div class="can-do-list {//Param[@name='debug']}">
            <p><a href="https://www.hathitrust.org/help_digital_library#MemberLogin">What are the benefits of logging in as a member?</a></p>
            <xsl:if test="//Param[@name='debug'] = 'explain'">
            <ul>
              <li>Download public domain works that have download restrictions (see “Can I download a whole book?” for more information)</li>
              <li>Create, save and share public or private collections</li>
              <li>Access copyrighted works lawfully in appropriate circumstances (see <a href="https://www.hathitrust.org/accessibility">accessibility</a> and <a href="https://www.hathitrust.org/out-of-print-brittle">out-of-print and brittle</a> for more information)</li>
            </ul>
            <p>Members can not view or download works that are “limited (search-only)”. See <a href="https://www.hathitrust.org/help_digital_library#LimitedView">“Is it possible to view a volume that is Limited (search-only)?”</a> for more information.</p>              
            </xsl:if> 
          </div>

          <xsl:if test="false()">
            <div class="partner-can-do-cells-wrapper">
              <div class="partner-can-do-cell">
                <div>
                  <div><i class="icomoon icomoon-checkmark"/></div>
                  <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/collections-partner.png" /></div>
                  <p>Create &amp; share permanent collections</p>
                </div>
              </div>
              <div class="partner-can-do-cell">
                <div>
                  <div><i class="icomoon icomoon-checkmark"/></div>
                  <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/download-partner.png" /></div>
                  <p>Download PDFs of all available items*</p>
                </div>
              </div>
              <br clear="both" />
              <p class="not-provided-msg-text">*Logging in does not provide access to page images of "Limited (search-only)" items</p>
            </div>
          </xsl:if>


          <div style="margin-top: 16px">
            <h4>Find your partner institution:</h4>
            
            <xsl:call-template name="build-idp-list" />
            
            <div id="no-institution-listed" style="text-align: left; xmargin-top: 0;">
              <a href="https://www.hathitrust.org/help_digital_library#LoginNotListed">Why isn't my institution listed?</a>
            </div>
          </div>
        </div>
      </div>

      <div>
        <div>
          <h3 class="partner-cell-title">Guests</h3>
          <p class="partner-cell-text">
            Guests have the ability to create and share their own collections when logged in.
          </p>

          <div class="can-do-list {//Param[@name='debug']}">
            <p>See <a href="https://www.hathitrust.org/help_digital_library#NoLogin">“What can I access without logging in?”</a> for information about what all users can do without logging in.</p>
            <xsl:if test="//Param[@name='debug'] = 'explain'">
            <ul>
              <li>Create, save and share public or private collections</li>
            </ul>
            <p>Members can not view or download works that are “limited (search-only)”. See <a href="https://www.hathitrust.org/help_digital_library#LimitedView">“Is it possible to view a volume that is Limited (search-only)?”</a> for more information.</p>
          </xsl:if>
          </div>              

          <xsl:if test="false()">
            <div class="partner-can-do-cells-wrapper">
              <div class="partner-can-do-cell" xclass="friend-do-cell-common friend-can-do-cell">
                <div>
                  <div><i class="icomoon icomoon-checkmark"/></div>
                  <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/collections-friend.png" /></div>
                  <p>Create &amp; share permanent collections</p>
                </div>
              </div>
              <div class="partner-can-do-cell friend-cannot-do-cell">
                <div>
                  <div><i class="icomoon icomoon-cancel"  style="font-size: 3.4rem" /></div>
                  <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/download-friend.png" /></div>
                  <p>Download PDFs of all certain public domain items.</p>
                </div>
              </div>

              <br clear="both" />
              <p class="not-provided-msg-text" style="visibility: hidden" aria-hidden="true">*Logging in does not provide access to page images of "Limited (search-only)" items</p>
            </div>
          </xsl:if>

          <div style="margin-top: 16px; position: relative">
            <h4>Log in with:</h4>

            <div class="alert alert-block alert-warning" style="color: #000">
              <h5 class="offscreen">AOL Deprecation Notice</h5>
              <p style="margin-top: 0">
                <strong>You can no longer login with AOL.</strong>
              </p>
              <p>To access collections you’ve previously built, create a <a href="https://friend.weblogin.umich.edu/friend/">University of Michigan Friend Account</a> that uses the same AOL email address.
              </p>
              <p>Contact us at <a href="mailto:feedback@issues.hathitrust.org">feedback@issues.hathitrust.org</a> for help. We apologize for the inconvenience.
              </p>
            </div>

            <ul class="unstyled">
              <xsl:apply-templates select="SocialIdP_List/IdP_Site" />
              <li>
                <xsl:call-template name="build-friend-link">
                  <xsl:with-param name="link-text">University of Michigan Friend Account</xsl:with-param>
                </xsl:call-template>
              </li>
            </ul>

            <div id="no-institution-listed" style="text-align: left; xmargin-top: 0;">
              <p>
                Still need a way to log in? <a href="https://friend.weblogin.umich.edu/friend/">Create a University of Michigan Friend Account</a>
              </p>
            </div>


          </div>
        </div> 
      </div>
    </div>

  </xsl:template>

  <xsl:template match="IdP_Site">
    <li>
      <xsl:call-template name="get-provider-badge">
        <xsl:with-param name="inst_id" select="InstID" />
      </xsl:call-template>
      <a href="{Url}"><xsl:value-of select="LinkText" /></a>
    </li>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="get-provider-badge">
    <xsl:param name="inst_id" />
    <xsl:variable name="klass">
      <xsl:choose>
        <xsl:when test="$inst_id = 'google'">icomoon-google</xsl:when>
        <xsl:when test="$inst_id = 'twitter'">icomoon-twitter2</xsl:when>
        <xsl:when test="$inst_id = 'facebook'">icomoon-facebook</xsl:when>
        <xsl:when test="$inst_id = 'linkedin'">icomoon-linkedin</xsl:when>
        <xsl:when test="$inst_id = 'live'">icomoon-windows8</xsl:when>
        <xsl:when test="$inst_id = 'yahoo'">icomoon-yahoo</xsl:when>
        <xsl:when test="$inst_id = 'aol'">icomoon-aol</xsl:when>
        <xsl:otherwise>icomoon-blank</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <i class="icomoon {$klass}" aria-hidden="true"></i><xsl:text> </xsl:text>
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

  <!-- TEMPLATE -->
  <xsl:template name="build-idp-list">
    <xsl:choose>
      <xsl:when test="IdP_List!=''">
        <form onsubmit="return goto_page(this.idp.options[this.idp.selectedIndex].value)">
          <div class="wayf-list" style="padding-bottom: 8px; padding-top: 0">
            <label for="idp" id="Selectyourinstitution-ariaLabel" class="SkipLink">Choose your partner institution</label>
            <select id="idp" name="idp" aria-labelledby="Selectyourinstitution-ariaLabel">
              <option value="0">Choose your partner institution</option>
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
          </div>
          <div class="actions" style="padding-left: 0; text-align: right">
            <button class="button continue log-in" type="submit">CONTINUE</button>
          </div>
        </form>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>


</xsl:stylesheet>
