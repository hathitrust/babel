<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  >

  <!-- Global Variables -->
  <xsl:variable name="gFinalAccessStatus" select="/MBooksTop/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gLastPageturnerLink" select="/MBooksTop/MdpApp/LastPageturnerLink"/>
  <xsl:variable name="gBeginningLink" select="/MBooksTop/MdpApp/BeginningLink"/>
  <xsl:variable name="gHasPageNumbers" select="/MBooksTop/MdpApp/HasPageNumbers"/>
  <xsl:variable name="gSearchFatalError" select="/MBooksTop/MdpApp/SearchResults/SearchError"/>
  <xsl:variable name="gValidBoolean" select="/MBooksTop/MdpApp/SearchResults/ValidBooleanExpression"/>
  <xsl:variable name="gItemType" select="/MBooksTop/MBooksGlobals/ItemType" />

  <xsl:variable name="gNumTerms" select="count(/MBooksTop/MdpApp/SearchTerms/Terms/Term)"/>
  <xsl:variable name="gMultiTerm" select="/MBooksTop/MdpApp/SearchTerms/MultiTerm"/>
  <xsl:variable name="gPagesFound" select="/MBooksTop/MdpApp/SearchSummary/TotalPages"/>
  <xsl:variable name="gSearchTerms" select="/MBooksTop/MdpApp/SearchTerms/Terms"/>
  <xsl:variable name="gSearchResults" select="/MBooksTop/MdpApp/SearchResults"/>

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

  <xsl:variable name="vNatLangQuery">
    <xsl:call-template name="buildNatLangQuery"/>
  </xsl:variable>

  <xsl:variable name="gUsingBookReader" select="'false'"/>

  <xsl:template name="setup-extra-header-extra">
    <xsl:call-template name="build-css-link">
      <xsl:with-param name="href">/pt/2021/dist/css/main.css</xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="detail" select="'PT Search'" />
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks">
      <li><a href="#section">Skip to results</a></li>
      <li><a href="/cgi/ssd?id={$gHtId}">Skip to text only view of this item</a></li>
      <li><a href="#input-search-text">Skip to search in this text</a></li>
    </ul>
  </xsl:template>

  <xsl:template name="contents-wait">
    <main class="main-container">
      <aside class="side-container"><xsl:call-template name="sidebar" /></aside>
      <xsl:call-template name="build-results-container" />
    </main>
  </xsl:template>

  <xsl:template name="build-main-container">
    <main class="main-container" id="main" data-view="search">
      <xsl:call-template name="header" />

      <div class="container container-medium flex-container container-boxed" style="margin-top: 1.75rem; margin-bottom: 1.75rem">
        <div class="sidebar-container" id="sidebar" tabindex="0">
          <button class="for-mobile filter-group-toggle-show-button" aria-expanded="false">
            <span class="flex-space-between flex-center">
              <span class="filter-group-heading">Options</span>
              <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-collapsed"></use></svg>
            </span>
          </button>
          <xsl:call-template name="build-access-alert-block" />
          <div class="d--panels">
            <xsl:call-template name="build-sidebar-panels" />
          </div>
        </div>
        <section class="section-container" id="section" tabindex="0">
          <xsl:call-template name="build-results-container" />
        </section>
      </div>
    </main>
  </xsl:template>

  <!-- Results -->
  <xsl:template name="build-results-container">
    <xsl:if test="$gFinalAccessStatus = 'deny'">
      <xsl:call-template name="build-checkout-notice" />
    </xsl:if>

    <div class="results-container">
      <xsl:call-template name="back-to-beginning-link" />
      <xsl:call-template name="embed-search-form" />
      <xsl:call-template name="msg-access-info" />
      <xsl:call-template name="build-search-summary" />
      <xsl:if test="$gPagesFound > 0">
        <!-- <xsl:call-template name="build-fisheye-links" /> -->
        <xsl:call-template name="build-results-list" />
        <xsl:call-template name="build-fisheye-links" />
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="back-to-beginning-link">
    <xsl:if test="$gFinalAccessStatus = 'allow'">
      <div class="back-to-beginning-link padded">
        <span>
          <img alt="">
            <xsl:attribute name="src">//common-web/graphics/triangle_left.gif</xsl:attribute>
          </img>
        </span>
        <a href="{$gBeginningLink}">Go to the beginning of the item</a>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-checkout-notice">
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:if test="normalize-space($access-type/Name)">
        <xsl:choose>
          <xsl:when test="$access-type/Name = 'emergency_access_affiliate'">
            <xsl:call-template name="build-checkout-emergency-access" />
          </xsl:when>
          <xsl:otherwise />
        </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-checkout-emergency-access">
    <xsl:variable name="access-type" select="//AccessType" />
    <xsl:choose>
      <xsl:when test="//Holdings/Held = 'NO'"></xsl:when>
      <xsl:when test="//AccessType/Available = 'TRUE'">

        <!-- item is available for checkout -->
        <div class="alert alert-block alert--emergency-access">
          <p style="margin-right: 1rem">
            <xsl:text>Access to this work is provided through the </xsl:text>
            <a href="{$etas_href}">Emergency Temporary Access Service</a>
            <xsl:text>.</xsl:text>
          </p>
          <div class="alert--emergency-access--options">
            <a class="btn btn-default" style="white-space: nowrap" href="{$access-type/Action}">Check Out</a>
          </div>
        </div>

      </xsl:when>
      <xsl:otherwise>
        <div class="alert alert-block alert-block alert--emergency-access">      
          <p style="margin-right: 1rem">
            <xsl:text>All available copies are currently in use. Try again later. Access to this work is provided through the </xsl:text>
            <a href="{$etas_href}">Emergency Temporary Access Service</a>
            <xsl:text>.</xsl:text>
          </p>

          <!-- <p>Another user is currently viewing this item. It will be available for viewing again: <strong><xsl:value-of select="/MBooksTop/MdpApp/Section108/Expires"/></strong></p> -->
        </div>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="msg-access-info">
    <xsl:if test="$gFinalAccessStatus='deny' and $gPagesFound > 0">
      <div class="alert alert-warning alert-block">
        <xsl:choose>
          <xsl:when test="$gRightsAttribute='26'">
            <xsl:text>Full view is not available for this item due to privacy concerns. Page numbers with matches are displayed but text snippets cannot be shown.</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>Full view is not available for this item due to copyright &#169; restrictions.</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-search-summary">
    <h2 class="offscreen">Search Results</h2>
    <xsl:variable name="page_string">
      <xsl:choose>
        <xsl:when test="$gPagesFound > 1 or $gPagesFound = 0"><xsl:text> pages </xsl:text></xsl:when>
        <xsl:when test="$gPagesFound = 1"><xsl:text> page</xsl:text></xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="slice-end" select="/MBooksTop/MdpApp/SliceNavigationLinks/End" />
    <xsl:variable name="slice-start" select="/MBooksTop/MdpApp/SliceNavigationLinks/Start" />

    <xsl:choose>
      <xsl:when test="$gSearchFatalError='true'">
        <div class="alert alert-error alert-block">
          <xsl:text>Sorry! There was a system error while conducting your search.  Please check back later.</xsl:text>
        </div>
      </xsl:when>

      <xsl:when test="$gPagesFound = 0">
        <div class="alert alert-error alert-block">
          <xsl:text>Your search for </xsl:text>
          <span class="mdpEmp">
            <xsl:value-of select="$vNatLangQuery"/>
          </span>
          <xsl:text> did not match any pages in this item.</xsl:text>
        </div>
        <xsl:if test="$gSearchOp='OR'">
          <div class="alert alert-warning alert-block">
            "Search in this text" can fail to find matching pages if you arrived at this item from a HathiTrust search that used bibliographic metadata terms <span class="mdpEmp"><em>about</em></span> the item that do not occur <span class="mdpEmp"><em>within</em></span> it.
          </div>
        </xsl:if>
      </xsl:when>

      <xsl:when test="$slice-end >= $slice-start">
        <xsl:variable name="currentSort">
          <xsl:choose>
            <xsl:when test="//Param[@name='sort']">
              <xsl:value-of select="//Param[@name='sort']" />
            </xsl:when>
            <xsl:otherwise>seq</xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
        <div class="alert alert-info alert-block alert--summary flex-container" tabindex="-1">
          <p>
            <xsl:value-of select="concat('Showing ',$slice-start,' - ',$slice-end,' of ',//TotalPages,' Results for ')"/>
            <span class="mdpEmp"><xsl:value-of select="$vNatLangQuery"/></span>
          </p>
        </div>
        <div class="alert alert-block results-options">
          <div class="btn-group" role="group">
            <button data-action="sort" data-value="score" aria-label="Sort by relevance" data-tippy-role="tooltip">
              <xsl:attribute name="class">
                <xsl:text>btn</xsl:text>
                <xsl:if test="$currentSort = 'score'">
                  <xsl:text> active</xsl:text>
                </xsl:if>
              </xsl:attribute>
              <xsl:attribute name="aria-pressed">
                <xsl:choose>
                  <xsl:when test="$currentSort = 'score'">
                    <xsl:text>true</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>false</xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-sort-down</xsl:with-param>
              </xsl:call-template>
            </button>
            <button class="btn" data-action="sort" data-value="seq" aria-label="Sort by page scan" data-tippy-role="tooltip">
              <xsl:attribute name="class">
                <xsl:text>btn</xsl:text>
                <xsl:if test="$currentSort = 'seq'">
                  <xsl:text> active</xsl:text>
                </xsl:if>
              </xsl:attribute>
              <xsl:attribute name="aria-pressed">
                <xsl:choose>
                  <xsl:when test="$currentSort = 'seq'">
                    <xsl:text>true</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>false</xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-sort-numeric-down</xsl:with-param>
              </xsl:call-template>
            </button>
          </div>
          <div class="btn-toolbar">
            <button aria-pressed="true" data-action="toggle-highlights" aria-label="Hide Highlights" data-toggled-label="Hide Highlights" data-untoggled-label="Show Highlights" data-tippy-role="tooltip">
              <xsl:attribute name="class">
                <xsl:text>btn</xsl:text>
                <xsl:choose>
                  <xsl:when test="//Param[@name='hl'] = 'false'"></xsl:when>
                  <xsl:otherwise> active</xsl:otherwise>
                </xsl:choose>
              </xsl:attribute>
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-brightness-high-fill</xsl:with-param>
                <xsl:with-param name="class">toggled</xsl:with-param>
              </xsl:call-template>
              <xsl:call-template name="build-pt-icon">
                <xsl:with-param name="id">bi-brightness-low</xsl:with-param>
                <xsl:with-param name="class">untoggled</xsl:with-param>
              </xsl:call-template>
            </button>
            <xsl:if test="false()">
              <button class="btn" aria-label="Clear search" data-tippy-role="tooltip" data-action="clear-search">
                <xsl:call-template name="build-pt-icon">
                  <xsl:with-param name="id">bi-x-circle</xsl:with-param>
                </xsl:call-template>
              </button>
            </xsl:if>
          </div>
        </div>
      </xsl:when>

      <xsl:otherwise>
        <pre><xsl:value-of select="End" /> / <xsl:value-of select="Start" /></pre>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:call-template name="build-repeat-search-message"/>
  </xsl:template>

  <xsl:template name="build-repeat-search-message">
    <xsl:choose>
      <xsl:when test="($gSearchOp='AND' and $gMultiTerm = 'true' )">
        <xsl:call-template name="build-repeat-search-message-or"/>
      </xsl:when>
      <xsl:when test="($gSearchOp='OR' and $gMultiTerm = 'true' and $gPagesFound > 1)">
        <xsl:call-template name="build-repeat-search-message-and"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-repeat-search-message-or">
    <p>
      <a href="{/MBooksTop/MdpApp/RepeatSearchLink}">Broaden your search to find pages having just <strong>one or more</strong> of your terms.</a>
    </p>
  </xsl:template>

  <xsl:template name="build-repeat-search-message-and">
    <p>
      <a href="{/MBooksTop/MdpApp/RepeatSearchLink}">Narrow your search to find just pages having <strong>all</strong> of your terms.</a>
    </p>
  </xsl:template>

  <xsl:template name="build-fisheye-links">
    <xsl:if test="/MBooksTop/MdpApp/SliceNavigationLinks/*">
      <xsl:apply-templates select="/MBooksTop/MdpApp/SliceNavigationLinks" />
    </xsl:if>
  </xsl:template>

  <xsl:template match="SliceNavigationLinks">
    <xsl:if test="End >= Start and ( PrevHitsLink != '' or NextHitsLink != '' )">
      <nav class="pagination-container" aria-label="Pagination" data-total-pages="{End}" data-current-page="{Start}">
        <div class="page-previous-link">
          <a class="page-previous-link" href="{PrevHitsLink}" data-start="{FisheyeLinks/FisheyeLink[Href=current()/PrevHitsLink]/@start}">
            <xsl:if test="PrevHitsLink = ''">
              <xsl:attribute name="style">visibility: hidden; white-space: nowrap; text-decoration: underline</xsl:attribute>
              <xsl:attribute name="aria-hidden">true</xsl:attribute>
            </xsl:if>
            <!-- <xsl:call-template name="build-pt-icon">
              <xsl:with-param name="id">bi-arrow-left-circle-fill</xsl:with-param>
            </xsl:call-template> -->
            <i class="icomoon icomoon-arrow-left" aria-hidden="true"></i>
            <span class="offscreen"> Previous page</span>
          </a>
        </div>

        <span class="" style="white-space: nowrap">
          <xsl:if test="count(FisheyeLinks/FisheyeLink) &gt; 1">
            <xsl:variable name="value" select="FisheyeLinks/FisheyeLink/LinkNumber[@focus='true']" />
            <xsl:text>Page </xsl:text>
            <input id="action-start-jump" name="start" type="number" size="5" min="1" max="{count(FisheyeLinks/FisheyeLink)}" value="{$value}" data-value="{$value}" data-sz="{//Param[@name='sz']}" style="width: 5rem; text-align: center" />
            <xsl:text>  of </xsl:text>
            <xsl:value-of select="count(FisheyeLinks/FisheyeLink)" />
          </xsl:if>
        </span>

        <div class="page-advance-link">
          <a class="page-advance-link" href="{NextHitsLink}" data-start="{FisheyeLinks/FisheyeLink[Href=current()/NextHitsLink]/@start}">
            <xsl:if test="NextHitsLink = ''">
              <xsl:attribute name="style">visibility: hidden; white-space: nowrap; text-decoration: underline</xsl:attribute>
              <xsl:attribute name="aria-hidden">true</xsl:attribute>
            </xsl:if>
            <span class="offscreen">Next page </span>
            <i class="icomoon icomoon-arrow-right" aria-hidden="true"></i>
            <!-- <xsl:call-template name="build-pt-icon">
              <xsl:with-param name="id">bi-arrow-right-circle-fill</xsl:with-param>
            </xsl:call-template> -->
          </a>
        </div>
      </nav>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:for-each select="$gSearchResults/Page">
      <xsl:variable name="page_label">
        <xsl:value-of select="concat('#', Sequence)" />
        <xsl:if test="$gHasPageNumbers='true' and PageNumber != ''">
          <xsl:text> (p. </xsl:text>
          <xsl:value-of select="PageNumber" />
          <xsl:text>)</xsl:text>
        </xsl:if>
        <xsl:if test="false()">
        <xsl:choose>
          <xsl:when test="$gHasPageNumbers='true'">
            <xsl:choose>
              <xsl:when test="PageNumber=''">
                <xsl:text>unnumbered page</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <xsl:text>Page </xsl:text>
                <xsl:value-of select="PageNumber"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>sequence No.</xsl:text>
            <xsl:value-of select="Sequence"/>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:if>
      </xsl:variable>
      <article class="result">
        <h3 class="results-header">
          <xsl:choose>
            <xsl:when test="$gFinalAccessStatus = 'allow'">
              <a href="{Link}" data-seq="{Sequence}"><xsl:value-of select="$page_label" /></a>
            </xsl:when>
            <xsl:otherwise>
              <span><xsl:value-of select="$page_label" /></span>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:text>&#xa0;-&#xa0;</xsl:text>
          <xsl:value-of select="Hits" />
          <xsl:choose>
            <xsl:when test="Hits > 1">
              <xsl:text>&#xa0;matching terms</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>&#xa0;matching term</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </h3>
        <xsl:for-each select="Kwic">
          <p class="kwic">
            <xsl:text>...</xsl:text>
            <xsl:apply-templates select="." mode="copy-guts" />
            <xsl:text>...</xsl:text>
          </p>
        </xsl:for-each>
      </article>
    </xsl:for-each>
  </xsl:template>

  <!-- Messages -->
  <!-- -->
  <xsl:template name="msgRepeatSearchWithOR">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/MdpApp/RepeatSearchLink"/>
        </xsl:attribute>
        Broaden your search to find pages having just <span class="mdpEmp">one or more</span> of your terms.
      </xsl:element>
  </xsl:template>

  <!-- -->
  <xsl:template name="msgRepeatSearchWithAND">
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/MdpApp/RepeatSearchLink"/>
        </xsl:attribute>
        Narrow your search to find just pages having <span class="mdpEmp">all</span> of your terms.
      </xsl:element>
  </xsl:template>

  <!-- -->
  <xsl:template name="msgRepeatSearch">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <xsl:text> op=</xsl:text>
      <xsl:value-of select="$gSearchOp"/>
      <xsl:text> numterms=</xsl:text>
      <xsl:value-of select="$gNumTerms"/>
      <xsl:text> multiterm=</xsl:text>
      <xsl:value-of select="$gMultiTerm"/>
      <xsl:text> pagesfound=</xsl:text>
      <xsl:value-of select="$gPagesFound"/>
    </xsl:if>

    <xsl:choose>
      <xsl:when test="($gSearchOp='AND' and $gMultiTerm = 'true' )">
        <xsl:call-template name="msgRepeatSearchWithOR"/>
      </xsl:when>
      <xsl:when test="($gSearchOp='OR' and $gMultiTerm = 'true' and $gPagesFound > 1)">
        <xsl:call-template name="msgRepeatSearchWithAND"/>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- -->
  <xsl:template name="buildNatLangQuery">
    <xsl:choose>
      <!-- emit entire expression -->
      <xsl:when test="$gValidBoolean=1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
        </xsl:for-each>
      </xsl:when>
      <!-- emit terms joined with OP -->
      <xsl:when test="$gNumTerms >= 1">
        <xsl:for-each select="$gSearchTerms/Term">
          <xsl:value-of select="."/>
          <xsl:if test="position()!=last()">
            <xsl:value-of select="concat(' ', $gSearchOp, ' ')"/>
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="embed-search-form">
    <div class="results-search-form">
      <xsl:call-template name="action-search-volume">
        <xsl:with-param name="view" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
      </xsl:call-template>
    </div>
  </xsl:template>


  <!-- -->
  <xsl:template match="Kwic">
    <xsl:copy-of select="./node()"/>
  </xsl:template>

</xsl:stylesheet>

