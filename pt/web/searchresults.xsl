<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  >

  <!-- Global Variables -->
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gLastPageturnerLink" select="/MBooksTop/MdpApp/LastPageturnerLink"/>
  <xsl:variable name="gBeginningLink" select="/MBooksTop/MdpApp/BeginningLink"/>
  <xsl:variable name="gHasPageNumbers" select="/MBooksTop/MdpApp/HasPageNumbers"/>
  <xsl:variable name="gSearchFatalError" select="/MBooksTop/MdpApp/SearchResults/SearchError"/>
  <xsl:variable name="gNumTerms" select="count(/MBooksTop/MdpApp/SearchTerms/Term)"/>
  <xsl:variable name="gPagesFound" select="/MBooksTop/MdpApp/SearchSummary/TotalPages"/>
  <xsl:variable name="gValidBoolean" select="/MBooksTop/MdpApp/SearchResults/ValidBooleanExpression"/>
  
  <xsl:variable name="gSearchOp">
    <xsl:variable name='ptsop_var' select="//CurrentCgi/Param[@name='ptsop']"/>
    <xsl:choose>
      <xsl:when test="$ptsop_var='AND' or $ptsop_var='and'">
        <xsl:text>AND</xsl:text>
      </xsl:when>
      <xsl:when test="$ptsop_var='OR' or $ptsop_var='or'">
        <xsl:text>OR</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>AND</xsl:text>          
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gUsingBookReader" select="'false'"/>

  <!-- root template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>
          <xsl:call-template name="PageTitle">
            <xsl:with-param name="prefix" select="'HathiTrust Digital Library Search Inside'" />
          </xsl:call-template>
        </title>

        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        
        <script type="text/javascript">
          HT.config.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
        </script>

        <script type="text/javascript">
          HT.params = {};
          <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
            <xsl:choose>
              <xsl:when test="@name = 'seq'">
                HT.params['<xsl:value-of select="@name" />'] = <xsl:value-of select="number(.) - 1" />;
              </xsl:when>
              <xsl:otherwise>
                HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="." />';
              </xsl:otherwise>
            </xsl:choose>
          </xsl:for-each>
          HT.params.view = "search";
        </script>
        
      </head>

      <body class="yui-skin-sam">
        <div>
          <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages"/>
        </div>


        <xsl:call-template name="header" />
        <xsl:call-template name="UberContainer"/>

        <!-- Feedback form -->
        <div id="feedbackDiv"></div>

        <!-- New collection overlay -->
        <div id="overlay"></div>

        <!-- Feedback -->
        <xsl:call-template name="Feedback"/>

        <!-- Footer -->
        <xsl:call-template name="footer"/>

        <xsl:call-template name="GetAddItemRequestUrl"/>

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
      <!-- <xsl:call-template name="header"/> -->

      <div class="mdpControlContainer">
        <!-- <xsl:call-template name="hathiVuFind"/> -->
        <xsl:call-template name="aboutThisBook" />
        <xsl:call-template name="getThisBook" />
        <xsl:call-template name="addToCollection" />
        <xsl:call-template name="shareThisBook" />

      </div>

      <xsl:element name="a">
        <xsl:attribute name="name">skipNav</xsl:attribute>
        <xsl:attribute name="id">skipNav</xsl:attribute>
      </xsl:element>

      <!-- Results -->
      <xsl:call-template name="ResultsContainer">
        <xsl:with-param name="pSearchTerms" select="MdpApp/SearchTerms"/>
        <xsl:with-param name="pSearchHits" select="MdpApp/SearchSummary/TotalPages"/>
        <xsl:with-param name="pSearchResults" select="MdpApp/SearchResults"/>
      </xsl:call-template>


      <!-- Catalog Links -->
      <!-- <div id="ControlContentContainer">
        <div id="ControlContent">
        </div>
      </div> -->


    </div>

  </xsl:template>


  <!-- Results -->
  <xsl:template name="ResultsContainer">

    <xsl:param name="pSearchTerms"/>
    <xsl:param name="pSearchHits"/>
    <xsl:param name="pSearchResults"/>

    <div id="mdpResultsContainer">

      <xsl:call-template name="BuildSearchSummary">
        <xsl:with-param name="ppSearchTerms" select="$pSearchTerms"/>
        <xsl:with-param name="ppSearchHits" select="$pSearchHits"/>
      </xsl:call-template>

      <xsl:if test="$pSearchHits > 0">
        <xsl:choose>
          <xsl:when test="$gFinalAccessStatus='needlogin'">
            <div class="mdpSearchSummary">
              <span>
                <span class="mdpEmp">Note:</span> detailed search results are not shown for restricted items.  Results may be available if you login.
              </span>
            </div>
          </xsl:when>
        </xsl:choose>

        <ul id="mdpOuterList">
          <xsl:for-each select="$pSearchResults/Page">

            <xsl:variable name="pageLabel">
              <xsl:choose>
                <xsl:when test="$gHasPageNumbers='true'">
                  <xsl:choose>
                    <xsl:when test="PageNumber=''">
                      <xsl:text>unnumbered page</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:text>p.</xsl:text>
                      <xsl:value-of select="PageNumber"/>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>sequence No.</xsl:text>
                  <xsl:value-of select="Sequence"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>

            <li>

              <xsl:choose>
                <xsl:when test="$gFinalAccessStatus='allow'">
                  <xsl:element name="a">
                    <xsl:attribute name="href">
                      <xsl:value-of select="Link"/>
                    </xsl:attribute>
                    <xsl:value-of select="$pageLabel"/>
                  </xsl:element>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="$pageLabel"/>
                </xsl:otherwise>
              </xsl:choose>

              <xsl:element name="span">
                <xsl:attribute name="class">mdpHitCount</xsl:attribute>
                <xsl:text>&#xa0;-&#xa0;</xsl:text>
                <xsl:value-of select="Hits"/>
                <xsl:choose>
                  <xsl:when test="Hits > 1">
                    <xsl:text>&#xa0;matching terms</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>&#xa0;matching term</xsl:text>
                  </xsl:otherwise>
                </xsl:choose>
                <xsl:text>&#xa0;</xsl:text>
              </xsl:element>
              <xsl:if test="$gFinalAccessStatus='allow'">
                <ul class="mdpInnerList">
                  <xsl:for-each select="Kwic">
                    <li>&#x2026;<xsl:apply-templates select="."/>&#x2026;</li>
                  </xsl:for-each>
                </ul>
              </xsl:if>
            </li>
          </xsl:for-each>
        </ul>
      </xsl:if>
      <xsl:if test="$pSearchHits > 0">
        <xsl:call-template name="BuildFisheyeTable"/>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template name="buildNatLangQuery">
    <xsl:choose>
      <!-- emit entire expression -->
      <xsl:when test="$gValidBoolean=1">
        <xsl:for-each select="/MBooksTop/MdpApp/SearchTerms/Term">
          <xsl:value-of select="."/>
        </xsl:for-each>
      </xsl:when>
      <!-- emit terms joined with OP -->
      <xsl:when test="$gNumTerms >= 1">
        <xsl:for-each select="/MBooksTop/MdpApp/SearchTerms/Term">
          <xsl:value-of select="."/>
          <xsl:if test="position()!=last()">
            <xsl:value-of select="concat(' ', $gSearchOp, ' ')"/>
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>No search terms were entered.</xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- -->
  <xsl:template name="href_OP">
    <xsl:param name="op_op"/>
    <xsl:text>/cgi/pt/search?</xsl:text>
    <xsl:for-each select="//CurrentCgi/Param">
      <xsl:if test="@name!='ptsop'">
        <xsl:value-of select="@name"/>=<xsl:value-of select="."/><xsl:value-of select="';'"/>
      </xsl:if>
    </xsl:for-each>
    <xsl:text>ptsop=</xsl:text><xsl:value-of select="$op_op"/>
  </xsl:template>
  
  <!-- -->
  <xsl:template name="msgRepeatSearchWithOR">      
    <div class="repeatSearchMessage">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:call-template name="href_OP">
            <xsl:with-param name="op_op">
              <xsl:value-of select="'OR'"/>
            </xsl:with-param>
          </xsl:call-template>
        </xsl:attribute>
        Broaden your search to pages having just <span class="mdpEmp">one or more</span> of your terms.
      </xsl:element>
    </div>
  </xsl:template>
  
  <!-- -->
  <xsl:template name="msgRepeatSearchWithAND">
    <div class="repeatSearchMessage">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:call-template name="href_OP">
            <xsl:with-param name="op_op">
              <xsl:value-of select="'AND'"/>
            </xsl:with-param>
          </xsl:call-template>
        </xsl:attribute>
        Narrow your search to just pages having <span class="mdpEmp">all</span> of your terms.
      </xsl:element>
    </div>
  </xsl:template>
  
  <!-- -->
  <xsl:template name="msgRepeatSearch">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <xsl:text> op=</xsl:text>
      <xsl:value-of select="$gSearchOp"/>
      <xsl:text> numterms=</xsl:text>
      <xsl:value-of select="$gNumTerms"/>
      <xsl:text> pagesfound=</xsl:text>
      <xsl:value-of select="$gPagesFound"/>
    </xsl:if>

    <xsl:choose>
      <xsl:when test="($gSearchOp='AND' and $gNumTerms > 1)">
        <xsl:call-template name="msgRepeatSearchWithOR"/>
      </xsl:when>
      <xsl:when test="($gSearchOp='OR' and $gNumTerms > 1 and $gPagesFound > 1)">
        <xsl:call-template name="msgRepeatSearchWithAND"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- -->
  <xsl:template name="BuildSearchSummary">
    <xsl:param name="ppSearchTerms"/>
    <xsl:param name="ppSearchHits"/>
    
    <xsl:variable name="vNatLangQuery">
      <xsl:call-template name="buildNatLangQuery"/>
    </xsl:variable>
    
    <div class="mdpSearchSummary">
      <xsl:if test="$gFinalAccessStatus!='allow'">
        <xsl:element name="div">
          <p class="centertext">Full view is not available for this item <br/>due to copyright &#169; restrictions. </p>
          <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
        </xsl:element>
      </xsl:if>
      
      <xsl:variable name="page_string">
        <xsl:choose>
          <xsl:when test="$ppSearchHits > 1"><xsl:text> pages in this item.</xsl:text></xsl:when>
          <xsl:when test="$ppSearchHits = 1"><xsl:text> page in this item.</xsl:text></xsl:when>
          <xsl:when test="$ppSearchHits = 0"><xsl:text> pages in this item.</xsl:text></xsl:when>
          <xsl:otherwise></xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      
      <span>
        <xsl:choose>
          <!-- Fatal error! -->
          <xsl:when test="$gSearchFatalError='true'">
            <span class="error">
              <xsl:text>Sorry! There was an error performing your search.  Please check back later.</xsl:text>
            </span>
          </xsl:when>
          <!-- Hits! -->
          <xsl:otherwise>
            <span class="mdpEmp">
              <xsl:value-of select="$vNatLangQuery"/>
            </span>
            <xsl:text> matched </xsl:text>
            <span class="mdpEmp">
              <xsl:value-of select="$ppSearchHits"/>
            </span>
            <xsl:value-of select="$page_string"/>
            <xsl:call-template name="msgRepeatSearch"/>
          </xsl:otherwise>
        </xsl:choose>
      
        <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
          <xsl:text> query time (ms) =</xsl:text>
          <xsl:value-of select="MdpApp/SearchSummary/QueryTime"/>
        </xsl:if>
      </span>
    </div>

    <xsl:call-template name="backToBeginning" />

    <xsl:if test="$ppSearchHits > 0">
      <xsl:call-template name="BuildFisheyeTable"/>
    </xsl:if>
  </xsl:template>

  <!-- -->
  <xsl:template name="NoResultsAdditionalMessage">
    <!-- If the query came from the ls application and there are no hits show this message-->
    <xsl:variable name="refstring">
      <xsl:value-of select="/MBooksTop/MBooksGlobals/ReferrerHref"/>      
    </xsl:variable>
    <xsl:if test="contains($refstring,'ls?q1')">
      <div class="NoResultsLS">
        
        <xsl:text>You may have received no results because:</xsl:text>
      <ul> 
        <li> <xsl:text>You searched in a language not currently supported by "search within 
        a book"</xsl:text>
      </li>
        <li><xsl:text> "Your term(s) do not appear on pages in this book but are present in 
the bibliographic metadata for this book (not shown): </xsl:text>

        <xsl:element name="a">
          <xsl:variable name="href">
            <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
            <xsl:value-of select="/MBooksTop/METS:mets/METS:dmdSec/present/record/doc_number"/>
          </xsl:variable>
          <xsl:attribute name="class">tracked</xsl:attribute>
          <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT VuFind Catalog Record</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="href"><xsl:value-of select="$href" /></xsl:attribute>
          <xsl:attribute name="title">Link to the HathiTrust VuFind Record for this item</xsl:attribute>
          <xsl:text>see the  catalog record</xsl:text>
        </xsl:element>

      </li>
</ul>
</div>
            <!-- we need a link to the catalog record as well-->
    </xsl:if>


  </xsl:template>



  <!-- -->
  <xsl:template match="Kwic">
    <xsl:copy-of select="."/>
  </xsl:template>

  <!-- -->
  <xsl:template name="BuildFisheyeTable">
    <div class="mdpFisheye">
      <xsl:if test="/MBooksTop/MdpApp/SliceNavigationLinks/*">
        <xsl:apply-templates select="/MBooksTop/MdpApp/SliceNavigationLinks"/>
      </xsl:if>
    </div>
  </xsl:template>

  <!-- -->
  <xsl:template match="SliceNavigationLinks">
    <xsl:if test="End > Start">
      <div>
        <xsl:value-of select="concat('Viewing results for: ',Start,' to ',End,' of ',TotalPages,' pages')"/>
      </div>

      <xsl:if test="PrevHitsLink!=''">
        <span class="mdpFisheyeLink">
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="PrevHitsLink"/>
            </xsl:attribute>
            <xsl:text>&#x25C4;previous</xsl:text>
          </xsl:element>
          <xsl:text> | </xsl:text>
        </span>
      </xsl:if>

      <xsl:apply-templates select="FisheyeLinks"/>

      <xsl:if test="NextHitsLink!=''">
        <span class="mdpFisheyeLink">
          <xsl:text> | </xsl:text>
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="NextHitsLink"/>
            </xsl:attribute>
            <xsl:text>next&#x25BA;</xsl:text>
          </xsl:element>
        </span>
      </xsl:if>
    </xsl:if>

  </xsl:template>

  <!-- -->
  <xsl:template match="FisheyeLinks">
    <span>
      <xsl:for-each select="FisheyeLink">
        <xsl:choose>
          <!-- if there is an Href then build a link, otherwise, this is the slice in focus -->
          <xsl:when test="Href!=''">
            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:value-of select="Href"/>
              </xsl:attribute>
              <xsl:value-of select="LinkNumber"/>
            </xsl:element>
          </xsl:when>
          <!-- slice in focus, just output the link number -->
          <xsl:otherwise>
            <span class="mdpEmp">
              <xsl:value-of select="LinkNumber"/>
            </span>
          </xsl:otherwise>
        </xsl:choose>
        <!-- output separator after all links, but the last one -->
        <xsl:choose>
          <xsl:when test="position() = last()"/>
          <!-- do nothing -->
          <xsl:otherwise>
            <xsl:text disable-output-escaping="yes"> | </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
    </span>
  </xsl:template>
    
  <xsl:template name="backToBeginning">
    <div class="mdpGoToBeginning">
      <span>
       <xsl:element name="img">
         <xsl:attribute name="src">//common-web/graphics/triangle_left.gif</xsl:attribute>
       </xsl:element>
      </span>
      <xsl:element name="a">
        <xsl:attribute name="href">
        <xsl:value-of select="$gBeginningLink"/>
        </xsl:attribute>
        Go to the beginning of the book
      </xsl:element>
    </div>
  </xsl:template>

</xsl:stylesheet>

