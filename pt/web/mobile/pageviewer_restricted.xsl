<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../pageviewer_restricted.xsl"/>

  <xsl:variable name="gCatalogRecordNo" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record/controlfield[@tag='001']"/>
  <xsl:template name="ic_access_info">
    <p class="centertext" style="padding:0 1.5em 0 1.5em;margin-top:-1em; background:#fff">Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p>
  </xsl:template>

  <!-- Special mobile header -->
  <xsl:template name="mobile_header">
    <div class="header">
      <a class="htlogobutton" href="http://m.hathitrust.org"></a>
      <xsl:element name="a">
        <xsl:attribute name="id">mdpCatalogLinkLimited</xsl:attribute>
        <xsl:variable name="href">
          <xsl:text>http://m.hathitrust.org/Record/</xsl:text>
          <xsl:value-of select="$gCatalogRecordNo"/>
        </xsl:variable>
        <xsl:attribute name="class">tracked</xsl:attribute>
        <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
        <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
        <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
        <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
        <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
        <xsl:text disable-output-escaping="yes">&lt;&lt; Record</xsl:text>
      </xsl:element>
    </div>
  </xsl:template>

  <!-- Options when search-only, exclusive access fail -->
  <xsl:template name="limited_view_options">
    <div class="limitedviewoptions">
      <p style="font-style: italic">You can:</p>
      <ul>
        <li>
          <xsl:variable name="id" select="//CurrentCgi/Param[@name='id']" />
          <xsl:element name="a">
            <xsl:attribute name="id">mdpLimitedSearchInside</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="concat('/cgi/pt?id=', $id, ';skin=default')" />
            </xsl:attribute>
            <xsl:text>Search inside the text </xsl:text><br /><span style="color:#000; font-size: 0.9em">(on the non-mobile website)</span>
          </xsl:element>
        </li>
        <li>
          <xsl:call-template name="MobileGetBook"/>
        </li>
      </ul>
    </div>
  </xsl:template>

  <!-- NOTE: OrphanCandidatePage template is defined in base.  Not yet customized for mobile. -->

  <!-- Brittle access (OVERRIDES BASE) -->
  <xsl:template name="BrittleAccessPage">

    <xsl:call-template name="mobile_header"/>

    <div class="centertext special_text">
      <p>Hi <xsl:value-of select="$gUserName"/>!</p>

      <p>This work is in copyright. Full view access is available for this item based on your affiliation or account privileges. Items made available under these special circumstances can only be accessed by one user at a time, in 24 hour increments.</p>
      <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
    </div>

    <xsl:call-template name="limited_view_options"/>
    <xsl:call-template name="ic_access_info"/>
    <xsl:call-template name="BuildMobileFooter"/>
  </xsl:template>
  
  <!-- Deleted item  (OVERRIDES BASE) -->
  <xsl:template name="DeletedItemPage">
    <xsl:call-template name="mobile_header"/>

    <div class="centertext special_text">This item is <strong>no longer available</strong> in HathiTrust due to one of the following reasons:
      <ul class="bullets" style="padding-top:1em">
        <li>It was deleted at the request of the rights holder or has been marked for deletion.</li>
        <li>It was either wholly unusable or a superior copy is available.</li>
      </ul>      
    </div>
    <div class="limitedviewoptions">
      <p style="font-style: italic">You can:</p>
      <ul>
        <li>
          <xsl:element name="a">
            <xsl:attribute name="id">mdpLimitedSearchInside</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="'http://m.hathitrust.org'"/>
            </xsl:attribute>
            <xsl:text>Try a new search </xsl:text>
          </xsl:element>
        </li>
      </ul>
    </div>

    <xsl:call-template name="BuildMobileFooter"/>
  </xsl:template>

  <!-- No access due to copyright restrictions (OVERRIDES BASE) -->
  <xsl:template name="NoAccessPage">
    <xsl:call-template name="mobile_header"/>

    <p class="centertext special_text">This item is <strong>not available online</strong> (<img src="//common-web/graphics/Icon_SearchOnly.png" alt=" " /> Limited - search only) due to copyright restrictions. <a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">Learn More&#x00a0;»</a></p>

    <xsl:call-template name="limited_view_options"/>
    <xsl:call-template name="BuildMobileFooter"/>
  </xsl:template>

  <!-- VIEWING AREA: see Viewport template in base that calls the OVERRIDES defined here -->

</xsl:stylesheet>



