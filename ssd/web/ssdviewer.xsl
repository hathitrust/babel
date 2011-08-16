<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

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
  <xsl:variable name="gSSDFullTitleString">
    <xsl:value-of select="$gFullTitleString"/>
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

  <xsl:variable name="gViewIsResizable">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted' or $gFinalView='empty' or $gFinalView='missing'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gShowViewTypes">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted'">
        <xsl:value-of select="'false'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'true'"/>
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
          <xsl:text>Hathi Trust Digital Library - </xsl:text>
          <xsl:value-of select="$gSSDFullTitleString"/>
        </title>

        <link rel="stylesheet" href="/ssd/web/ssdstyles.css" type="text/css" />

        <!-- Below is a workaround for javascript script tags so we don't get a cdata output              -->
        <!--     WARNING  This won't work if the javascript in the XML has a > or < sign in them          -->
        <!--     XXX TODO:  Figure out how to include javascript that has less than or greater than signs -->
        <xsl:text disable-output-escaping="yes">&lt;script type="text/javascript"&gt;</xsl:text>
        <xsl:value-of select="/MBooksTop/MBooksGlobals/LoggedInJs"/>
        <xsl:text disable-output-escaping="yes"> &lt;/script&gt;</xsl:text>

      </head>

      <body>
        <div id="DebugMessages">
          <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
        </div>

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
              <h2 class="SkipLink">Page Text</h2>
              <xsl:text>Sorry, this volume does not contain any readable text.</xsl:text>
            </xsl:if>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </div>
  </xsl:template>

  <!-- SSD Page Header -->
  <xsl:template name="SSDPageHeader">
    <div id="mdpHeaderContainer">
      <div id="mdpPageHeader">
        <xsl:element name="h1">
          <xsl:text>Hathi Trust Digital Library - </xsl:text>
          <xsl:value-of select="$gSSDFullTitleString"/>
            
          <xsl:element name="a"><xsl:attribute name="name">top</xsl:attribute></xsl:element>
        </xsl:element>

        <div id="SSDcontact">
          <xsl:text>For questions or comments, contact HathiTrust.org: </xsl:text>
          <xsl:element name="a">
            <xsl:attribute name="href">mailto:feedback@issues.hathitrust.org</xsl:attribute>
            <xsl:text>feedback@issues.hathitrust.org</xsl:text><br/>
          </xsl:element>
        </div>

        <xsl:call-template name="Access"/>
        <div id="SSDjumps">
          <xsl:element name="a">
            <xsl:attribute name="href">#biblio</xsl:attribute>
            <xsl:text>Go to full bibliographic information</xsl:text>
          </xsl:element>
          <xsl:element name="br"/>
        </div>

        <!--If TOC exists, add link to skip TOC and go to first page. If no TOC, just go to first page-->
        <xsl:choose>
          <xsl:when test="$gFeatureList/Feature">
            <xsl:if test="$gFinalAccessStatus='allow'">
              <xsl:element name="a">
                <xsl:attribute name="href">#toc</xsl:attribute>
                <xsl:text>Go to table of contents</xsl:text>
              </xsl:element>
              <xsl:element name="br"/>
            </xsl:if>

            <xsl:choose>
              <!--If using page by page view, skip to current page instead of first -->
              <xsl:when test="$gFinalAccessStatus='allow' and $gSSD_Session='false'">
                <xsl:element name="a">
                  <xsl:attribute name="href">#SkipToBookText</xsl:attribute>
                  <xsl:text>Skip table of contents and go to current page</xsl:text>
                </xsl:element>
              </xsl:when>
              <xsl:otherwise>
                <xsl:if test="$gFinalAccessStatus='allow'">
                  <xsl:element name="a">
                    <xsl:attribute name="href">#SkipToBookText</xsl:attribute>
                    <xsl:text>Skip table of contents and go to first page</xsl:text>
                  </xsl:element>
                </xsl:if>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="href">#SkipToBookText</xsl:attribute>
              <xsl:text>Go to First Page</xsl:text>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>

        <div id="mdpItemMetadata">
          <xsl:element name="h2">
            <xsl:attribute name="class">SkipLink</xsl:attribute>
            <xsl:element name="a"><xsl:attribute name="name">biblio</xsl:attribute></xsl:element>
            <xsl:text>Full Bibliographic Information</xsl:text>
          </xsl:element>

          <xsl:call-template name="FullTitle"/>
          <xsl:call-template name="BookMetadata"/>
          
        </div>
      </div>
    </div>
  </xsl:template>
  
  <xsl:template name="BookMetadata">
    <!-- Author, Edition, Published, Description -->
    <xsl:call-template name="MdpMetadataHelper">
      <xsl:with-param name="ssd" select="'true'"/>
    </xsl:call-template>
  </xsl:template>
  
  
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
          <h2><a name="toc">Table of Contents</a></h2>
          <xsl:call-template name="BuildContentsList"/>
        </xsl:if>
      </div>
    </div>
  </xsl:template>
  
  <!--Book contents -->
  <xsl:template name="ContentContainer">
    <div id="mdpContentContainer">
      <xsl:element name="a">
        <xsl:attribute name="class">SkipLink</xsl:attribute>
        <xsl:attribute name="name">SkipToBookText</xsl:attribute>
      </xsl:element>
      <xsl:call-template name="Viewport">
        <xsl:with-param name="pOcr" select="$gFullOcr"/>
      </xsl:call-template>
    </div>
  </xsl:template>

  <!-- CONTROL: Contents List -->
  <xsl:template name="BuildContentsList">
    <xsl:element name="ul">
      <xsl:for-each select="$gFeatureList/Feature">
        <xsl:element name="li">
          <xsl:attribute name="class">mdpFeatureListItem</xsl:attribute>
          <xsl:element name="a">
            <xsl:attribute name="href">
              <!--Used page anchors if full text, relative links if page by page -->
              <xsl:choose>
                <xsl:when test="$gSSD_Session='true'">
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
                <xsl:when test="$gFinalAccessStatus='allow' and $gSSD_Session='false'">ssd?id=<xsl:value-of select="$gItemId"/>;seq=<xsl:value-of select="Seq"/>;num=<xsl:value-of select="Page"/>
                <xsl:if test="$gCurrentDebug!=''">
                  <xsl:text>;debug=</xsl:text><xsl:value-of select="$gCurrentDebug"/>
                </xsl:if>
                <xsl:if test="$gCurrentAttr!=''">
                  <xsl:text>;attr=</xsl:text><xsl:value-of select="$gCurrentAttr"/>
                </xsl:if>
                </xsl:when>
              </xsl:choose>
            </xsl:attribute>
            <xsl:value-of select="Label"/>
            <xsl:if test="Page!=''">
              <xsl:element name="span">
                <xsl:attribute name="class">SkipLink</xsl:attribute>
                <xsl:text> on page number </xsl:text>
                <xsl:value-of select="Page"/>
              </xsl:element>
            </xsl:if>
          </xsl:element>
        </xsl:element>
      </xsl:for-each>
    </xsl:element>
  </xsl:template>

  <!-- VIEWING AREA -->
  <xsl:template name="Viewport">
    <xsl:param name="pOcr"/>
    <!-- now handle the view type -->
    <xsl:choose>
      <xsl:when test="$gSSD_Session='true' or ($gFinalAccessStatus='allow' and $gLoggedIn='YES')">
        <h2 class="SkipLink">Book Text</h2>
        <xsl:element name="div">
          <xsl:attribute name="id">mdpText</xsl:attribute>
          <xsl:apply-templates select="$pOcr"/>
          <p>End of text. Return to <a href="#top">beginning</a>.</p>
        </xsl:element>
      </xsl:when>
      <!--If public domain and not SSD session, display single page (unless LoggedIn then full-text if allowed)-->
      <xsl:when test="$gFinalAccessStatus='allow' and $gSSD_Session='false'">
        <xsl:choose>
          <xsl:when test="$gFeatureList/Feature">
            <xsl:choose>
              <!--If item has page numbers and page is numbered, heading is "Page #" using num. -->
              <xsl:when test="$gCurrentPageNum != ''">
                <h2 class="SkipLink">Page <xsl:value-of select="$gCurrentPageNum"/></h2>
              </xsl:when>
              <!--If item has page numbers and page is not numbered, heading is "Page Text". -->
              <xsl:otherwise>
                <h2 class="SkipLink">Page Text</h2>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <!--If item does has page numbers and page is numbered, heading is "Page #" using seq. -->
          <xsl:otherwise>
            <h2 class="SkipLink">Page <xsl:value-of select="gCurrentPageSeq"/></h2>
          </xsl:otherwise>
        </xsl:choose>
        
        <xsl:element name="div">
          <xsl:attribute name="id">mdpPage</xsl:attribute>
          <xsl:choose>
            <xsl:when test="$gCurrentPageOcr=''">
              <div id="mdpTextEmpty">
                <div class="mdpTMPhead">NO TEXT ON PAGE</div>
                <div class="mdpTMPtext">This page does not contain any text recoverable by the OCR engine</div>
                
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
      </xsl:when>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="loginlink">
    <xsl:element name="a">
      <xsl:attribute name="href">
        <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
      </xsl:attribute>
      <xsl:attribute name="id">
        <xsl:text>loginLink</xsl:text>
      </xsl:attribute>
      <xsl:text>Login</xsl:text>
    </xsl:element>
  </xsl:template>

  <xsl:template name="Access">
    <xsl:choose>
      <xsl:when test="$gFinalView='restricted'">
        <xsl:element name="div">
          <xsl:attribute name="id">mdpTextDeny</xsl:attribute>
          <p>Authenticated members of HathiTrust institutions who have a print disability may have access to the full-text of this item. <xsl:call-template name="loginlink"/> to determine if you have access and see all volumes that are available when searching. For more information, see <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a>. Keyword searchable (no full-text) access to this item is also available via the link below.</p>
          <p>
            <a>
              <xsl:attribute name="href">
                <xsl:value-of select="$gItemHandle"/>
              </xsl:attribute>
              Search within this item
            </a>
          </p>
        </xsl:element>
      </xsl:when>

      <xsl:when test="$gSSD_Session='false' and ($gFinalAccessStatus='allow' and $gLoggedIn!='YES')">
        <xsl:element name="div">
          <p>You have one page at a time access to this item. Authenticated members of HathiTrust institutions who have a print disability may have full-text access to this item. <xsl:call-template name="loginlink"/> to determine if you have access and see all volumes that are available when searching.  For more information, see <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility</a>.  Page at a time access to this item is also available via our fully-styled HathiTrust interface.</p>
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
      
      <xsl:when test="$gLoggedIn='YES' and $gFinalAccessStatus='allow' and $gInCopyright='true'">
        <xsl:element name="div">
          <p>You have full view access to this item based on your account privileges. This work is in copyright (see the <a href="http://www.hathitrust.org/access_use#section108">HathiTrust Access and Use Policy</a>). More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></p>
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
  
    <xsl:element name="a">
      <xsl:attribute name="name">
        <xsl:value-of select="$SectionTitleAttr"/>
      </xsl:attribute>
    </xsl:element>
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
        <xsl:if test="$gFeatureList/Feature">Continue to next section or jump to <a href="#toc">Table of Contents</a></xsl:if>
      </p>
    </div>
  </xsl:template>

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

  <xsl:template match="Seq">
    <div class="Seq">Page <xsl:apply-templates/> </div>
  </xsl:template>

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

