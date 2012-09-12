<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  extension-element-prefixes="str" xmlns:str="http://exslt.org/strings">

  <xsl:template name="item-viewer">

    <div class="contentContainerWrap">


      <!-- Image -->
      <xsl:element name="a">
        <xsl:attribute name="name">skipNav</xsl:attribute>
        <xsl:attribute name="id">skipNav</xsl:attribute>
      </xsl:element>
      <xsl:call-template name="ContentContainer"/>

    </div>

  </xsl:template>

  <xsl:template name="item-embedded-viewer">
    <xsl:call-template name="ContentContainer" />
  </xsl:template>

  <xsl:template name="ContentContainer">
    <div id="mdpContentContainer">

      <!-- Error message set from addItemToCollection javascript -->
      <div id="errormsg">
        <div class="bd"></div>
      </div>

      <xsl:element name="a">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:attribute name="name">SkipToBookText</xsl:attribute>
      </xsl:element>
      <h2 class="offscreen">Individual Page (Not Available)</h2>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pAccessStatus" select="$gFinalAccessStatus"/>
      </xsl:call-template>
    </div>

  </xsl:template>

  <!-- VIEWING AREA -->
  <xsl:template name="Viewport">
    <xsl:param name="pCurrentPageImageSource"/>
    <xsl:param name="pCurrentPageOcr"/>
    <xsl:param name="pAccessStatus"/>

    <xsl:variable name="orphan_canditate_msg">
      <strong>This volume is an Orphan Works candidate.</strong> <ul><li>The Orphan Works Project is a framework for libraries to determine whether books in their collections are subject to copyright but whose copyright holders cannot be identified or contacted.</li><li>If you are a bona fide copyright holder of this volume, please contact us at the
      <a title="Orphan Works Project" href="http://www.lib.umich.edu/orphan-works/copyright-holders-we-want-hear-you"> Orphan Works Project.</a></li></ul>
    </xsl:variable>

    <xsl:variable name="copyright_restricted_msg">
      Full view is not available for this item<br/> due to copyright &#169; restrictions.
    </xsl:variable>

    <xsl:element name="div">
      <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
      <xsl:choose>
        <!-- TOMBSTONE -->
        <xsl:when test="$gRightsAttribute='8'">
          <div class="Specialtext">
            <xsl:copy-of select="$gTombstoneMsg"/>
          </div>
        </xsl:when>

        <!-- If opb (attr=3) + affiliated user then tell them when -->
        <!-- current accessor's exclusive access expires -->
        <xsl:when test="$gRightsAttribute='3' and $gMichiganAffiliate='true' and $gHeld='YES'">
          <div class="Specialtext">
            <p class="leftText">Full view access <em>is</em> available for this item under the following circumstances:</p>
            <ul>
              <li><strong>Unlimited</strong> use via University of Michigan Library computers</li>
              <li><strong>One user at a time</strong> for authenticated University of Michigan users in 24 hour increments</li>
            </ul>
            <p class="leftText">You are seeing this message because another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
            <p class="leftText"><a href="#" id="ic-access">Learn more</a>.</p>
          </div>
        </xsl:when>

        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="$gOrphanCandidate='true'">
              <p class="centertext"><xsl:copy-of select="$copyright_restricted_msg"/></p>
              <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
              <p class="centertext"><xsl:copy-of select="$orphan_canditate_msg"/></p>
            </xsl:when>
            <xsl:otherwise>
              <p class="centertext"><xsl:copy-of select="$copyright_restricted_msg"/></p>
              <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>

      <xsl:if test="$gRightsAttribute!='8'">
        <div>
          <img src="//common-web/graphics/LimitedSample.png" alt="" class="imgFloat"/>
          <p>What you <strong>CAN</strong> do:
            <ul>
              <li>Use the "Search in this text" search box above to find frequency and page number of specific words and phrases. This can be especially useful to help you decide if the book is worth buying, checking out from a library, or when working with a book that does not have an index.</li>
              <li>Click the "Find in a library" link to find this item in a library near you.</li>
            </ul>
          </p>
          (<a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">More information about restricted items</a>)
        </div>
      </xsl:if>
    </xsl:element>

  </xsl:template>

</xsl:stylesheet>

