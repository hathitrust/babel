<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:h="http://www.hathitrust.org"
  xmlns="http://www.w3.org/1999/xhtml"
  extension-element-prefixes="exsl">

  <!-- Main template lives in skeleton.xsl -->

  <!-- TEMPLATE over-rides -->
  <xsl:template name="login-block"/>
  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/wayf/css/screen.css" />
    <script type="text/javascript" src="/wayf/js/login.js"></script>
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> no-search</xsl:text>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Login</xsl:text>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <a class="offscreen skip-link" href="#main">Skip to main</a>
  </xsl:template>

  <!-- main TEMPLATE -->

  <xsl:template name="contents">
    <h2 id="main" class="main-section-title">Log in to get the most out of HathiTrust.</h2>

    <!-- PARTNERS -->
    <div class="row">
      <div id="top-row-cells-wrapper" class="clearfix">

        <!-- top row, left cell -->
        <div id="partner-cell-left" class="kill-span-right-margin span7_5">
          <div>
            <div>
              <h3 class="partner-cell-title">Members of partner institutions</h3>
              <p class="partner-cell-text">Members of partner institutions get access to the largest number of volumes and features by logging in through their institution.</p>
            </div>
            <div class="row">
              <div class="partner-can-do-cells-wrapper">
                <div class="partner-can-do-cell">
                  <div>
                    <div><i class="icomoon icomoon-checkmark"/></div>
                    <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/collections-partner.png" /></div>
                    <p>Members can create &amp; share permanent collections</p>
                  </div>
                </div>
                <div class="partner-can-do-cell">
                  <div>
                    <div><i class="icomoon icomoon-checkmark"/></div>
                    <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/download-partner.png" /></div>
                    <p>Members can download PDFs of available items*</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <!-- top row, right cell -->
        <div id="partner-cell-right" class="span4_5">
          <div>
            <p>Log in with your partner institution &#x2014; no signup is necessary.</p>
            
            <xsl:call-template name="build-idp-list" />
            
            <div id="no-institution-listed">
              <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed">Don't see your institution listed? &#x00bb;</a>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <div class="row">
      <div class="column-left span12">
        <p id="not-provided-msg-text">*Logging in does not provide access to page images of "Limited (search-only)" items</p>
      </div>
    </div>
    
    <!-- GENERAL PUBLIC -->
    <div class="row">
      <div id="bottom-row-cells-wrapper" class="clearfix">

        <!-- bottom row, left cell -->
        <div id="friend-cell-left" class="kill-span-right-margin span7_5">
          <div>
            <div>
              <h3 class="friend-cell-title">Not with a partner institution?</h3>
              <p class="friend-cell-text">
                <xsl:text>You can create or log in with a guest </xsl:text>
                <xsl:call-template name="build-friend-link">
                  <xsl:with-param name="link-text">
                    <xsl:value-of select="'Friend'" />
                  </xsl:with-param>
                </xsl:call-template>
                <xsl:text> account. You won't be able to download PDFs, but you will be able to create and share your own collections.</xsl:text>
              </p>
            </div>
            <div class="row">
              <div class="friend-can-do-cells-wrapper">
                <div class="friend-do-cell-common friend-can-do-cell">
                  <div>
                    <div><i class="icomoon icomoon-checkmark"/></div>
                    <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/collections-friend.png" /></div>
                    <p>Friends can create &amp; share permanent collections</p>
                  </div>
                </div>
                <div class="friend-do-cell-common friend-cannot-do-cell">
                  <div>
                    <div><i class="icomoon icomoon-cancel"/></div>
                    <div><img aria-hidden="true" alt="" src="/common/web/unicorn/img/WAYF/download-friend.png" /></div>
                    <p>Friends cannot download PDFs of available items</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      
        <!-- bottom row, right cell -->
        <div id="friend-cell-right" class="span4_5">
          <div>
            <p>
              <xsl:call-template name="build-friend-link">
                <xsl:with-param name="link-text">
                  <xsl:value-of select="'Create or login with a guest Friend account for limited access to items and features. &#x00bb;'" />
                </xsl:with-param>
              </xsl:call-template>
            </p>
          </div>
        </div>
      </div>
    </div>

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
          <label for="idp" id="Selectyourinstitution-ariaLabel" class="SkipLink">Choose your partner institution</label>
          <div>
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
          <div id="continue-button">
            <button class="button continue log-in" type="submit">CONTINUE</button>
          </div>
        </form>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>


</xsl:stylesheet>
