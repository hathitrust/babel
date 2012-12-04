<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../pageviewer_restricted.xsl"/>

  <xsl:variable name="gCatalogRecordNo" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record/controlfield[@tag='001']"/>
  <xsl:variable name="gSection108_Access" select="/MBooksTop/MdpApp/Section108/Granted"/>

  <!-- VIEWING AREA -->
  <xsl:template name="Viewport">
    <xsl:param name="pCurrentPageImageSource"/>
    <xsl:param name="pCurrentPageOcr"/>
    <xsl:param name="pAccessStatus"/>

            <xsl:element name="div">
              <xsl:attribute name="id">mdpTextDeny</xsl:attribute>

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
                  <!--<xsl:text>View full catalog record</xsl:text>-->
                  <xsl:text disable-output-escaping="yes">&lt;&lt; Record</xsl:text>
                </xsl:element>
              </div>
              <br />

              <xsl:choose>
                <!-- TOMBSTONE -->
                <xsl:when test="$gRightsAttribute='8'">
                  <div class="Specialtext">
                    <p class="leftText">This item is no longer available in HathiTrust due to one of the following reasons:</p>
                    <ul class="bullets">
                      <li>It was removed at the request of the rights holder.</li>
                      <li>It was either wholly unusable or a superior copy is available.</li>
                    </ul>
                    
                    <p class="leftText">
                      <xsl:text>Try a </xsl:text>
                      <xsl:element name="a">
                        <xsl:attribute name="href">
                          <xsl:value-of select="'http://m.hathitrust.org'"/>
                        </xsl:attribute>
                        <xsl:text> new search </xsl:text>
                      </xsl:element>
                      <xsl:text>for your item to see if there are other copies or editions of this work available.</xsl:text>
                    </p>
                  </div>
                </xsl:when>
                <!-- If opb (attr=3) + affiliated user then tell them when @OPB -->
                <!-- current accessor's exclusive access expires -->
                <xsl:when test="$gRightsAttribute='3' and ($gHathiTrustAffiliate='true' or $gIsInLibrary='YES') and $gBrittleHeld='YES'">
                  <div class="Specialtext">
                    <p class="leftText">This work is in copyright. Full view access is available for this item based on your affiliation or account privileges. Items made available under these special circumstances can only be accessed by one user at a time, in 24 hour increments.</p>
                    <p class="leftText">Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p>
                    <p class="leftText"><a href="#" id="ic-access">Learn more</a>.</p>

                  </div>
                </xsl:when>
                <xsl:otherwise>
                  <p class="centertext">Full view is not available for this item <br/>due to copyright &#169; restrictions.</p>
                </xsl:otherwise>
              </xsl:choose>
             
              <xsl:if test="$gRightsAttribute!='8'">
                <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
                <div style="background-color:#f6f6f6;margin:0;padding:10px">
                  <div id="limitedviewoptions">
                    <!--<img src="//common-web/graphics/LimitedSample.png" alt="" class="imgFloat"/>-->
                    <p>What you <strong>CAN</strong> do:
                    <ul>
                      <li>
                        <xsl:variable name="id" select="//CurrentCgi/Param[@name='id']" />
                        <xsl:element name="a">
                          <xsl:attribute name="id">mdpLimitedSearchInside</xsl:attribute>
                          <xsl:attribute name="href">
                            <xsl:value-of select="concat('/cgi/pt?id=', $id, ';skin=default')" />
                          </xsl:attribute>
                          <xsl:text>Search inside on Regular (non-mobile) Website</xsl:text>
                        </xsl:element>
                        <!--Find the frequency and page numbers of specific words and phrases -->
                        <!-- to help you decide if the book would be useful to you.-->
                      </li>
                      <li>
                        <xsl:call-template name="MobileGetBook"/>
                        <!-- Find this item in a library near you using WorldCat. -->
                      </li>
                    </ul>
                  </p>
                  <p>Or <a href="http://www.hathitrust.org/help_copyright#RestrictedAccess">learn more</a> about HathiTrust copyright regulations</p>
                </div>
              </div>
            </xsl:if>
          </xsl:element>
          <xsl:call-template name="BuildMobileFooter"/>

    
  </xsl:template>

</xsl:stylesheet>



