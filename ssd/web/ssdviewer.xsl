<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:cc="http://creativecommons.org/ns#"
  xmlns:foaf="http://xmlns.com/foaf/0.1/"
  >

  <!-- Global Variables -->
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gFullOcr" select="/MBooksTop/MBooksGlobals/Ocr"/>
  <xsl:variable name="gCurrentPageFeatures" select="/MBooksTop/MdpApp/CurrentPageFeatures"/>
  <xsl:variable name="gCurrentPageOcr" select="/MBooksTop/MBooksGlobals/CurrentPageOcr"/>
  <xsl:variable name="gCurrentPageNum" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']"/>
  <xsl:variable name="gCurrentPageSeq" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']"/>
  <xsl:variable name="gCurrentDebug" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
  <xsl:variable name="gCurrentAttr" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='attr']"/>
  <xsl:variable name="gItemId" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>
  <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>
  <xsl:variable name="gItemHandle" select="/MBooksTop/MBooksGlobals/ItemHandle"/>
  <xsl:variable name="gHasOcr" select="/MBooksTop/MBooksGlobals/HasOcr"/>
  <xsl:variable name="gSSD_Session" select="/MBooksTop/MBooksGlobals/SSDSession"/>
  <xsl:variable name="gLoggedIn" select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  <xsl:variable name="gInCopyright" select="/MBooksTop/MBooksGlobals/InCopyright"/>
  <xsl:variable name="gHeld" select="/MBooksTop/MBooksGlobals/Holdings/Held"/>
  <xsl:variable name="gSSDFullTitleString">
    <xsl:value-of select="$gFullTitleString"/>
  </xsl:variable>

  <!-- Handle the view type. There are four (4) cases when
       FinalAccessStatus='allow' where access is either full volume or
       page-at-a-time: -->

  <!-- (1) SSD user of anything (authentication assumed): entire volume
       (2) non-SSD user of PD, not authenticated: page-at-a-time
       (3) non-SSD user of PD, authenticated: entire volume
       (4) non-SSD user of IC (brittle/orphan), authenticated: page-at-a-time -->

  <xsl:variable name="gViewingMode">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus='allow'">
        <xsl:choose>
          <!-- Case (1) SSD: display entire volume -->
          <xsl:when test="$gSSD_Session='true'">
            <xsl:value-of select="'entire-volume'"/>
          </xsl:when>
          <!-- non-SSD cases -->
          <xsl:when test="$gSSD_Session='false'">
            <xsl:choose>
              <!-- Case (2) non-SSD page-at-a-time -->
              <xsl:when test="$gInCopyright='false' and $gLoggedIn='NO'">
                <xsl:value-of select="'page-at-a-time'"/>
              </xsl:when>
              <!-- Case (3) non-SSD: entire volume-->
              <xsl:when test="$gInCopyright='false' and $gLoggedIn='YES'">
                <xsl:value-of select="'entire-volume'"/>
              </xsl:when>
              <!-- Case (4) non-SSD: page-at-a-time -->
              <xsl:when test="$gInCopyright='true' and $gLoggedIn='YES'">
                <xsl:value-of select="'page-at-a-time'"/>
              </xsl:when>
            </xsl:choose>
          </xsl:when>
        </xsl:choose>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'no-view'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gFinalView">
    <xsl:choose>
      <xsl:when test="$gFinalAccessStatus!='allow'">
        <xsl:value-of select="'restricted'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:choose>
          <xsl:when test="$gHasOcr='NO'">
            <xsl:value-of select="'empty'"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:value-of select="'text'"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <!-- root template -->
  <xsl:template match="/MBooksTop">

    <html lang="en" xml:lang="en"
      xmlns="http://www.w3.org/1999/xhtml"
      xmlns:dc="http://purl.org/dc/elements/1.1/"
      xmlns:cc="http://creativecommons.org/ns#"
      xmlns:foaf="http://xmlns.com/foaf/0.1/"
      version="XHTML+RDFa 1.0"
      >

      <head profile="http://www.w3.org/1999/xhtml/vocab">
        <!-- RDFa -->
        <xsl:call-template name="BuildRDFaLinkElement"/>
        <title>
          <xsl:variable name="dash">
            <xsl:choose>
              <xsl:when test="$gFullOcr//Page"><xsl:text>--</xsl:text></xsl:when>
              <xsl:otherwise><xsl:text>-</xsl:text></xsl:otherwise>
            </xsl:choose>
          </xsl:variable>
          <xsl:call-template name="PageTitle">
            <xsl:with-param name="title" select="$gSSDFullTitleString" />
            <xsl:with-param name="detail" select="'Text-only'" />
            <xsl:with-param name="dash" select="$dash" />
          </xsl:call-template>
        </title>

        <link rel="stylesheet" href="/ssd/web/ssdstyles.css" type="text/css" />
      </head>

      <body>
        <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages!=''">
          <div id="DebugMessages">
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
          </div>
        </xsl:if>

        <xsl:call-template name="UberContainer"/>

        <xsl:if test="$gEnableGoogleAnalytics='true'">
          <xsl:call-template name="google_analytics" />
        </xsl:if>

      </body>
    </html>
  </xsl:template>


  <!-- Top Level Container DIV -->
  <xsl:template name="UberContainer">

    <div id="mdpUberContainer">
      <!-- Header -->
      <xsl:call-template name="SSDPageHeader"/>

      <div id="ControlContentContainer">
        <xsl:choose>
          <xsl:when test="$gFinalAccessStatus='allow' and $gHasOcr='YES'">
            <!-- Table of Contents -->
            <xsl:call-template name="BuildTOC"/>

            <!-- Pages -->
            <xsl:call-template name="ContentContainer"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:if test="$gHasOcr='NO'">
              <h2>Page Text</h2>
              <xsl:text>Sorry, this volume does not contain any readable text.</xsl:text>
            </xsl:if>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template name="question_or_comments">
    <div id="SSDcontact">
      <xsl:text>For questions or comments, contact HathiTrust.org at </xsl:text>
      <xsl:element name="a">
        <xsl:attribute name="href">mailto:feedback@issues.hathitrust.org</xsl:attribute>
        <xsl:text>feedback@issues.hathitrust.org</xsl:text><br/>
      </xsl:element>
    </div>
  </xsl:template>

  <!-- SSD Page Header -->
  <xsl:template name="SSDPageHeader">
    <div id="mdpHeaderContainer">
      <div id="mdpPageHeader">
        <xsl:element name="a"><xsl:attribute name="name">top</xsl:attribute></xsl:element>
        <xsl:element name="h1">
          <xsl:value-of select="$gSSDFullTitleString"/>
          <xsl:text> | HathiTrust Digital Library</xsl:text>
        </xsl:element>

        <xsl:if test="$gFinalAccessStatus='allow'">
          <p>Use of this online version is subject to all U.S. copyright laws. Please do not save or redistribute this file.</p>
          <xsl:call-template name="question_or_comments"/>
        </xsl:if>

        <xsl:call-template name="Access"/>

        <div id="SSDjumps">
          <xsl:if test="$gRightsAttribute!='8'">
            <xsl:element name="a">
              <xsl:attribute name="href">#biblio</xsl:attribute>
              <xsl:text>Go to full bibliographic information</xsl:text>
            </xsl:element>
            <xsl:element name="br"/>
          </xsl:if>

          <xsl:if test="$gFinalAccessStatus='allow'">
            <xsl:choose>
              <!--If TOC exists, add link to skip TOC and go to first page. If no TOC, just go to first page-->
              <xsl:when test="$gFeatureList/Feature">
                <xsl:element name="a">
                  <xsl:attribute name="href">#toc</xsl:attribute>
                  <xsl:text>Go to table of contents</xsl:text>
                </xsl:element>
                <xsl:element name="br"/>

                <xsl:choose>
                  <!--If using page by page view, skip to current page instead of first -->
                  <xsl:when test="$gSSD_Session='false'">
                    <xsl:element name="a">
                      <xsl:attribute name="href">#SkipToBookText</xsl:attribute>
                      <xsl:text>Skip table of contents and go to current page</xsl:text>
                    </xsl:element>
                  </xsl:when>

                  <xsl:otherwise>
                    <xsl:element name="a">
                      <xsl:attribute name="href">#SkipToBookText</xsl:attribute>
                      <xsl:text>Skip table of contents and go to first page</xsl:text>
                    </xsl:element>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:when>

              <xsl:otherwise>
                <xsl:element name="a">
                  <xsl:attribute name="href"><xsl:value-of select="MdpApp/PageLinks/FirstPageLink"/></xsl:attribute>
                  <xsl:text>Go to First Page</xsl:text>
                </xsl:element>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:if>
        </div>

        <xsl:if test="$gRightsAttribute!='8'">
          <div id="mdpItemMetadata">
            <xsl:element name="h2">
              <xsl:element name="a"><xsl:attribute name="name">biblio</xsl:attribute></xsl:element>
              <xsl:text>Full Bibliographic Information</xsl:text>
            </xsl:element>

            <xsl:call-template name="FullTitle"/>
            <xsl:call-template name="BookMetadata"/>
          </div>
        </xsl:if>
      </div>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template name="BookMetadata">
    <!-- Author, Edition, Published, Description -->
    <xsl:call-template name="MdpMetadataHelper">
      <xsl:with-param name="ssd" select="'true'"/>
    </xsl:call-template>
  </xsl:template>

  <!-- -->
  <xsl:template name="FullTitle">
    <div class="mdpMetaDataRow">
      <div class="mdpMetaDataRegionHead">
        <xsl:text>Title</xsl:text>
      </div>
      <div class="mdpMetaText">
        <xsl:call-template name="BuildRDFaWrappedTitle">
          <xsl:with-param name="visible_title_string" select="$gSSDFullTitleString"/>
          <xsl:with-param name="hidden_title_string" select="$gSSDFullTitleString"/>
        </xsl:call-template>
      </div>
    </div>
  </xsl:template>

  <!-- Control Container -->
  <xsl:template name="BuildTOC">
    <div class="mdpControlContainer">
      <!-- Contents LIST-->
      <div id="mdpContentsList">
        <p/>
        <xsl:if test="$gFeatureList/Feature">
          <xsl:call-template name="BuildContentsList"/>
        </xsl:if>
      </div>
    </div>
  </xsl:template>

  <!--Book contents -->
  <xsl:template name="ContentContainer">
    <div id="mdpContentContainer">
      <xsl:element name="a">
        <xsl:attribute name="name">SkipToBookText</xsl:attribute>
      </xsl:element>
      <xsl:call-template name="Viewport"/>
    </div>
  </xsl:template>

  <!-- CONTROL: Contents List -->
  <xsl:template name="BuildContentsList">
    <!-- Use page anchors if entire-volume, relative links if page-at-a-time -->

    <xsl:if test="$gViewingMode!='no-view'">
      <h2><a name="toc">Table of Contents</a></h2>
      <xsl:element name="ul">
        <xsl:for-each select="$gFeatureList/Feature">
          <xsl:element name="li">
            <xsl:attribute name="class">mdpFeatureListItem</xsl:attribute>
            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:choose>
                  <xsl:when test="$gViewingMode='entire-volume'">
                    <xsl:variable name="SectionTitleAttr">
                      <xsl:call-template name="ReplaceChar">
                        <xsl:with-param name="string">
                          <xsl:value-of select="Label"/>
                        </xsl:with-param>
                        <xsl:with-param name="from_char">
                          <xsl:text> </xsl:text>
                        </xsl:with-param>
                        <xsl:with-param name="to_char">
                          <xsl:text></xsl:text>
                        </xsl:with-param>
                      </xsl:call-template>
                    </xsl:variable>
                    <xsl:text>#</xsl:text>
                    <xsl:value-of select="$SectionTitleAttr"/>
                  </xsl:when>
                  <xsl:when test="$gViewingMode='page-at-a-time'">
                    <xsl:text>ssd?id=</xsl:text><xsl:value-of select="$gItemId"/>
                    <xsl:text>;seq=</xsl:text><xsl:value-of select="Seq"/>
                    <xsl:text>;num=</xsl:text><xsl:value-of select="Page"/>
                    <xsl:if test="$gCurrentDebug!=''">
                      <xsl:text>;debug=</xsl:text><xsl:value-of select="$gCurrentDebug"/>
                    </xsl:if>
                    <xsl:if test="$gCurrentAttr!=''">
                      <xsl:text>;attr=</xsl:text><xsl:value-of select="$gCurrentAttr"/>
                    </xsl:if>
                  </xsl:when>
                  <xsl:otherwise></xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:value-of select="Label"/>
              <xsl:if test="Page!=''">
                <xsl:element name="span">
                  <xsl:text> on page number </xsl:text>
                  <xsl:value-of select="Page"/>
                </xsl:element>
              </xsl:if>
            </xsl:element>
          </xsl:element>
        </xsl:for-each>
      </xsl:element>
    </xsl:if>
  </xsl:template>

  <!-- Page At A Time Viewing -->
  <xsl:template name="ViewOnePage">
    <xsl:choose>
      <xsl:when test="$gFeatureList/Feature">
        <xsl:choose>
          <!-- If item has page numbers and page is numbered, heading is "Page #" using num. -->
          <xsl:when test="$gCurrentPageNum != ''">
            <h2>Page <xsl:value-of select="$gCurrentPageNum"/></h2>
          </xsl:when>
          <!-- If item has page numbers and page is not numbered, heading is "Page Text". -->
          <xsl:otherwise>
            <h2>Page Text</h2>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>
      <!-- If item does has page numbers and page is numbered, heading is "Page #" using seq. -->
      <xsl:otherwise>
        <h2>Page <xsl:value-of select="gCurrentPageSeq"/></h2>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:element name="div">
      <xsl:attribute name="id">mdpPage</xsl:attribute>
      <xsl:choose>
        <xsl:when test="$gCurrentPageOcr=''">
          <div id="mdpTextEmpty">
            <div class="mdpTMPhead">NO TEXT ON PAGE</div>
            <div class="mdpTMPtext">This page does not contain any text recoverable by the OCR engine.</div>

            <xsl:if test="contains($gCurrentPageFeatures,'IMAGE_ON_PAGE')">
              <p class="Image">
                <xsl:text>This page contains an image.</xsl:text>
              </p>
            </xsl:if>
          </div>
        </xsl:when>
        <xsl:otherwise>
          <p class="Text"><xsl:value-of select="$gCurrentPageOcr"/></p>
          <xsl:if test="contains($gCurrentPageFeatures,'IMAGE_ON_PAGE')">
            <p class="Image">
              <xsl:text>This page contains an image.</xsl:text>
            </p>
          </xsl:if>
        </xsl:otherwise>
      </xsl:choose>
      <p>
        <xsl:choose>
          <xsl:when test="MdpApp/PageLinks/PreviousPageLink !=''">
            <xsl:element name="a">
              <xsl:attribute name="href"><xsl:value-of select="MdpApp/PageLinks/PreviousPageLink"/></xsl:attribute>
              Previous Page
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            This is the first page.
          </xsl:otherwise>
        </xsl:choose>
        <br/>
        <xsl:choose>
          <xsl:when test="MdpApp/PageLinks/NextPageLink !=''">
            <xsl:element name="a">
              <xsl:attribute name="href"><xsl:value-of select="MdpApp/PageLinks/NextPageLink"/></xsl:attribute>
              Next Page
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            This is the last page.
          </xsl:otherwise>
        </xsl:choose>
        <br/>
        Return to <a href="#top">top</a>.
      </p>
    </xsl:element>
  </xsl:template>

  <!-- Full Volume Viewing -->
  <xsl:template name="ViewEntireVolume">
    <h2>Book Text</h2>
    <xsl:element name="div">
      <xsl:attribute name="id">mdpText</xsl:attribute>
      <xsl:apply-templates select="$gFullOcr"/>
      <p>End of text. Return to <a href="#top">beginning</a>.</p>
    </xsl:element>
  </xsl:template>


  <!-- VIEWING AREA -->
  <xsl:template name="Viewport">

    <xsl:choose>
      <xsl:when test="$gViewingMode='entire-volume'">
        <xsl:call-template name="ViewEntireVolume"/>
      </xsl:when>
      <xsl:when test="$gViewingMode='page-at-a-time'">
        <xsl:call-template name="ViewOnePage"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- -->
  <xsl:template name="maybe_login">
    <xsl:if test="$gLoggedIn!='YES'">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/LoginLink"/>
        </xsl:attribute>
        <xsl:attribute name="id">
          <xsl:text>loginLink</xsl:text>
        </xsl:attribute>
        <xsl:text> Login</xsl:text>
      </xsl:element>
      <xsl:text> to determine if you have access and see all volumes that are available when searching. </xsl:text>
    </xsl:if>
  </xsl:template>

  <!-- -->
  <xsl:template name="Access">

    <xsl:choose>
      <xsl:when test="$gFinalView='restricted'">
        <xsl:choose>
          <xsl:when test="$gRightsAttribute='8'">
            <!-- TOMBSTONE -->
            <p>This item is no longer available in HathiTrust due to one of the following reasons:</p>
            <ul>
              <li>It was removed at the request of the rights holder.</li>
              <li>It was either wholly unusable or a superior copy is available.</li>
            </ul>
            <p>Try a <a title="search for item" href="http://www.hathitrust.org">new search</a> for your item to see if there are other copies or editions of this work available </p>
            <xsl:call-template name="question_or_comments"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="div">
              <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
              <xsl:choose>
                <xsl:when test="$gHeld='YES'">
                  <p>Authenticated members of HathiTrust institutions who have a print disability may have access to the full-text of this item. <xsl:call-template name="maybe_login"/></p>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:choose>
                    <xsl:when test="$gSSD_Session='true'">
                      <p><xsl:text>Sorry, your institution does not hold this volume so access to it is not available.</xsl:text></p>
                    </xsl:when>
                    <xsl:otherwise>
                      <p><xsl:text>Sorry, copyright restrictions make this volume unavailable.</xsl:text></p>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:otherwise>
              </xsl:choose>
              <p>For more information, see <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a>.</p>
              <p>
                <a>
                  <xsl:attribute name="title">
                    <xsl:text>Keyword searchable (no full-text) access to this item</xsl:text>
                  </xsl:attribute>
                  <xsl:attribute name="href">
                    <xsl:value-of select="$gItemHandle"/>
                  </xsl:attribute>
                  <xsl:text>Search within this item</xsl:text>
                </a>
              </p>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:when>

      <xsl:when test="$gViewingMode='page-at-a-time'">
        <xsl:element name="div">
          <p>You have one page at a time access to this item. Authenticated members of HathiTrust institutions who have a print disability may have full-text access to this item. <xsl:call-template name="maybe_login"/>  For more information, see <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a>.  Page at a time access to this item is also available via our fully-styled HathiTrust interface.</p>
          <p>
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="$gItemHandle"/>
              </xsl:attribute>
              View this item in the fully-styled HathiTrust interface.
            </a>
          </p>
        </xsl:element>
      </xsl:when>

      <xsl:when test="$gViewingMode='entire-volume' and $gInCopyright='true'">
        <xsl:element name="div">
          <p>You have full view access to this item based on your account privileges. This work is in copyright (see the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>). More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></p>
          <p>
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="$gItemHandle"/>
              </xsl:attribute>
              View this item in the fully-styled HathiTrust interface.
            </a>
          </p>
        </xsl:element>
      </xsl:when>

      <xsl:otherwise>
        <p/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- -->
  <xsl:template match="Section">

    <xsl:variable name="SectionTitleAttr">
      <xsl:call-template name="ReplaceChar">
        <xsl:with-param name="string">
          <xsl:value-of select="SectionTitle"/>
        </xsl:with-param>
        <xsl:with-param name="from_char">
          <xsl:text> </xsl:text>
        </xsl:with-param>
        <xsl:with-param name="to_char">
          <xsl:text></xsl:text>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:variable>

    <xsl:if test="$SectionTitleAttr!=''">
      <xsl:element name="a">
        <xsl:attribute name="name">
          <xsl:value-of select="$SectionTitleAttr"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:if>

    <div class="Section">
      <h3 class="SectionHeading"><xsl:apply-templates select="SectionTitle"/></h3>
      <xsl:apply-templates select="Page"/>
      <p>
        <xsl:choose>
          <xsl:when test="normalize-space(SectionTitle)">
            End of <xsl:apply-templates select="SectionTitle"/>.
          </xsl:when>
          <xsl:otherwise>
            End of Section.
          </xsl:otherwise>
        </xsl:choose>
        <xsl:if test="$gFeatureList/Feature">Continue to next section or <a href="#toc">go to Table of Contents</a></xsl:if>
      </p>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="Page">
    <div class="Page">
      <xsl:choose>
        <xsl:when test="PageNum">
          <xsl:apply-templates select="PageNum"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:apply-templates select="Seq"/>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:apply-templates select="Text"/>
      <xsl:if test="Features = 'image'">
        <p class="Image">
          <xsl:text>This page contains an image.</xsl:text>
        </p>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="PageNum">
    <div class="PageNum">
      <xsl:choose>
        <xsl:when test="normalize-space(.)">
          Page <xsl:apply-templates/>
        </xsl:when>
        <xsl:otherwise>
          No page number
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="Seq">
    <div class="Seq">Page <xsl:apply-templates/> </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="Text">
    <p class="Text">
      <xsl:choose>
        <xsl:when test="normalize-space(.)">
          <xsl:apply-templates/>
        </xsl:when>
        <xsl:otherwise>
          Blank page
        </xsl:otherwise>
      </xsl:choose>
    </p>
  </xsl:template>

</xsl:stylesheet>

