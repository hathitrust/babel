<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl str"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:variable name="gExclusiveAccessFail">
    <xsl:choose>
      <xsl:when test="$gRightsAttribute='3' and ($gHathiTrustAffiliate='true' or $gIsInLibrary='YES') and $gBrittleHeld='YES'">
        <xsl:value-of select="'YES'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'NO'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-extra-header-extra">
    <link rel="stylesheet" href="/pt/css/restricted.css" />
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> view-restricted</xsl:text>
  </xsl:template>

  <xsl:template name="main">
    <div class="main" id="main" tabindex="0">
      <h2 class="offscreen">Individual Page (Not Available)</h2>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pAccessStatus" select="$gFinalAccessStatus"/>
      </xsl:call-template>
    </div>
  </xsl:template>

  <!-- Orphans -->
  <xsl:template name="OrphanCandidatePage">
    <xsl:variable name="copyright_restricted_msg">
      <i class="icomoon-locked"></i> 
      Full view is not available for this item due to copyright &#169; restrictions.
    </xsl:variable>

    <xsl:variable name="orphan_canditate_msg">
      <strong>This volume is an Orphan Works candidate.</strong> <ul><li>The Orphan Works Project is a framework for libraries to determine whether books in their collections are subject to copyright but whose copyright holders cannot be identified or contacted.</li><li>If you are a bona fide copyright holder of this volume, please contact us at the
      <a title="Orphan Works Project" href="http://www.lib.umich.edu/orphan-works/copyright-holders-we-want-hear-you"> Orphan Works Project.</a></li></ul>
    </xsl:variable>

    <div class="alert alert-info alert-block alert-banner">
      <p>
        <!-- <img style="float: left; padding-left: 8px" src="//common-web/graphics/LimitedLink.png" alt="" /> -->
        <xsl:copy-of select="$copyright_restricted_msg" />
      </p>
    </div>

    <p>
      <xsl:copy-of select="$orphan_canditate_msg" />
    </p>

  </xsl:template>

  <!-- Brittle access -->
  <xsl:template name="BrittleAccessPage">
    <div class="special_text">
      <p>Hi <xsl:value-of select="$gUserName"/>!</p>
      
      <p>This work is in copyright. Full view access is available for this item based on your affiliation or account privileges. Items made available under these special circumstances can only be accessed by one user at a time, in 24 hour increments.</p>
      <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
      
      <p>
        <label id="in_use"><xsl:text>In the meantime, you can search inside the text to see if it contains what you are looking for:</xsl:text></label>
        <xsl:call-template name="BuildSearchForm">
          <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
          <xsl:with-param name="pShowLabel" select="'NO'"/>
        </xsl:call-template>
      </p>
      <p>Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p>
    </div>    
  </xsl:template>
  
  <!-- Deleted item -->
  <xsl:template name="DeletedItemPage">
    <div class="alert alert-info alert-block alert-banner">
      <p>This item is <strong>no longer available</strong> in HathiTrust due to one of the following reasons:</p>
    </div>

    <ul class="bullets">
      <li>It was deleted at the request of the rights holder or has been marked for deletion.</li>
      <li>It was either wholly unusable or a superior copy is available.</li>
    </ul>
      
    <p>
      <xsl:text>Try a </xsl:text>
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="'http://www.hathitrust.org'"/>
        </xsl:attribute>
        <xsl:text> new search </xsl:text>
      </xsl:element>
      <xsl:text>for your item to see if there are other copies or editions of this work available.</xsl:text>
    </p>
  </xsl:template>

  <!-- No access due to copyright restrictions -->
  <xsl:template name="NoAccessPage">
    <xsl:variable name="find-in-library-link">
      <xsl:call-template name="FindInALibraryLink">
        <xsl:with-param name="class"> btn btn-primary btn-medium</xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <div class="alert alert-info alert-block alert-banner">
      This item is <strong>not available online</strong> (<i class="icomoon-locked"></i> Limited - search only) due to copyright restrictions. <a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">Learn More »</a>
    </div>
    <div class="no_access_text">
      <p>You can:</p>
    </div>
    <div class="row">
      <div class="span8 border-right">
        <div class="row">
          <div class="span12">
            <label id="in_copyright" for="mdpSearchInputBox">
              <xsl:text>Search inside the text</xsl:text>
            </label>
            <xsl:call-template name="BuildSearchForm">
              <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
              <xsl:with-param name="pShowLabel" select="'NO'"/>
            </xsl:call-template>
          </div>
        </div>
        <div class="row">
          <div class="span6">
            <div class="no_access_search_help_text">
              to find the frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, etc.
            </div>

          </div>
          <div class="span6">
            <div class="no_access_search_help_eg">
              <em>Example:</em>
              <br />
              <img src="//common-web/graphics/LimitedSample.png" />
            </div>
          </div>
        </div>
      </div>
      <xsl:if test="exsl:node-set($find-in-library-link)//node()">
        <div class="span4 find-in-library">
          <xsl:text>or </xsl:text>
          <xsl:apply-templates select="exsl:node-set($find-in-library-link)" mode="copy" />
        </div>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- No access due to pd-pvt (private) -->
  <xsl:template name="PrivateItemPage">
    <xsl:variable name="find-in-library-link">
      <xsl:call-template name="FindInALibraryLink">
        <xsl:with-param name="class"> btn btn-primary btn-medium</xsl:with-param>
      </xsl:call-template>
    </xsl:variable>
    <div class="alert alert-info alert-block alert-banner">
      We have determined this work to be in the public domain, but access is limited due to privacy concerns. See HathiTrust's <a href="http://www.hathitrust.org/privacy#pd-pvt">Privacy Policy</a> for more information.
    </div>
    <div class="no_access_text">
      <p>You can:</p>
    </div>
    <div class="row">
      <div class="span8 border-right">
        <div class="row">
          <div class="span12">
            <label id="in_copyright" for="mdpSearchInputBox">
              <xsl:text>Search inside the text</xsl:text>
            </label>
            <xsl:call-template name="BuildSearchForm">
              <xsl:with-param name="pSearchForm" select="MdpApp/SearchForm"/>
              <xsl:with-param name="pShowLabel" select="'NO'"/>
            </xsl:call-template>
          </div>
        </div>
        <div class="row">
          <div class="span6">
            <div class="no_access_search_help_text">
              to find the frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, etc.
            </div>

          </div>
          <div class="span6">
            <div class="no_access_search_help_eg">
              <em>Example:</em>
              <br />
              <img src="//common-web/graphics/LimitedSample.png" />
            </div>
          </div>
        </div>
      </div>
      <xsl:if test="exsl:node-set($find-in-library-link)//node()">
        <div class="span4 find-in-library">
          <xsl:text>or </xsl:text>
          <xsl:apply-templates select="exsl:node-set($find-in-library-link)" mode="copy" />
        </div>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- VIEWING AREA -->

  <xsl:template name="Viewport">
    <xsl:param name="pCurrentPageImageSource"/>
    <xsl:param name="pCurrentPageOcr"/>
    <xsl:param name="pAccessStatus"/>

    <xsl:element name="div">
      <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
      <xsl:choose>
        <!-- TOMBSTONE -->
        <xsl:when test="$gRightsAttribute='8'">
          <xsl:call-template name="DeletedItemPage"/>
        </xsl:when>

        <!-- PD-PVT (PRIVATE) -->
        <xsl:when test="$gRightsAttribute='26'">
          <xsl:call-template name="PrivateItemPage" />
        </xsl:when>

        <!-- Brittle message about when current accessor's exclusive access expires -->
        <xsl:when test="$gExclusiveAccessFail='YES'">
          <xsl:call-template name="BrittleAccessPage"/>          
        </xsl:when>

        <!-- orphan message -->
        <xsl:when test="$gOrphanCandidate='true'">
          <xsl:call-template name="OrphanCandidatePage"/>
        </xsl:when>

        <!-- In copyright, no access message -->
        <xsl:otherwise>
          <xsl:call-template name="NoAccessPage"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
    
  </xsl:template>

</xsl:stylesheet>

