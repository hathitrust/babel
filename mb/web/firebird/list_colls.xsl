<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE xsl:stylesheet [
<!ENTITY mdash "–">
]>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:h="http://www.hathitrust.org"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  xmlns:date="http://exslt.org/dates-and-times"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS dc date h"
  extension-element-prefixes="str exsl date" xmlns:str="http://exslt.org/strings">

  <xsl:variable name="gUserId">
    <xsl:value-of select="/MBooksTop/Header/UserId"/>
  </xsl:variable>

  <xsl:variable name="gView">
    <xsl:choose>
      <xsl:when test="//Param[@name='colltype']">
        <xsl:value-of select="//Param[@name='colltype']" />
      </xsl:when>
      <xsl:when test="normalize-space($gUserId)">
        my-collections
      </xsl:when>
      <xsl:otherwise>featured</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gSkin" select="normalize-space(//Param[@name='skin'])" />

  <xsl:variable name="gQueryString" select="normalize-space(//Param[@name='q1'])" />
  <xsl:variable name="gSizeRange" select="normalize-space(//Param[@name='size'])" />

  <xsl:variable name="gColltype" select="//Param[@name='colltype']" />

  <xsl:template name="skip-to-main-link">
    <div class="visually-hidden-focusable" id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#section">Skip to collections list</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-analytics-report-url">
      <xsl:text>/mb/listcs/</xsl:text>
      <xsl:value-of select="$gColltype" />
      <xsl:if test="//Param[@name='size']">
        <xsl:text>?size=</xsl:text>
        <xsl:value-of select="//Param[@name='size']" />
      </xsl:if>
      <xsl:if test="//Param[@name='q1']">
        <xsl:choose>
          <xsl:when test="//Param[@name='size']">&amp;</xsl:when>
          <xsl:otherwise>?</xsl:otherwise>
        </xsl:choose>
        <xsl:text>q1=</xsl:text>
        <xsl:value-of select="//Param[@name='q1']" />
      </xsl:if>
    </xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <!-- <script type="text/javascript">
      <xsl:value-of select="//CollectionsOwnedJs" />
      <xsl:value-of select="//CollectionSizesJs" />
    </script> -->
    <style type="text/css">
      .record--temporary .xbadge {
        text-transform: uppercase;
      }
    </style>
  </xsl:template>

  <xsl:template name="main">
    <xsl:call-template name="build-results-container" />
  </xsl:template>

  <xsl:template name="build-results-container">

    <xsl:call-template name="build-temporary-collection-alert" />

    <div class="card mb-3 shadow">
      <div class="row g-0 p-3 pb-0">
        <div class="card-body">
          <h1 class="card-title d-flex align-items-center gap-2">
            <xsl:choose>
              <xsl:when test="$gColltype = 'featured'">
                Featured Collections
              </xsl:when>
              <xsl:when test="$gColltype = 'updated'">
                Recently Updated Collections
              </xsl:when>
              <xsl:when test="$gColltype = 'my-collections'">
                My Collections
              </xsl:when>
              <xsl:otherwise>
                Shared Collections
              </xsl:otherwise>
            </xsl:choose>
          </h1>
        </div>
      </div>

      <xsl:call-template name="build-collection-search-form" />
    </div>

    <hathi-results-toolbar
      data-prop-first-record-number="{//FirstRecordNumber}"
      data-prop-last-record-number="{//LastRecordNumber}"
      data-prop-total-records="{//TotalRecords}"
      data-prop-target="mb.listcs"
      >
        <xsl:attribute name="data-prop-current-sort-option">
          <xsl:choose>
            <xsl:when test="//Param[@name='sort']">
              <xsl:value-of select="//Param[@name='sort']" />
            </xsl:when>
            <xsl:otherwise>cn_a</xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
      </hathi-results-toolbar>

    <xsl:apply-templates select="//CollList/Collection[@selected='TRUE']" />

    <xsl:call-template name="build-nav-pagination" />

    <xsl:call-template name="setup-confirm-handlers" />
    
  </xsl:template>

  <xsl:template name="build-collection-search-form">
    <div class="p-3 rounded py-0 ps-3">
      <form method="GET" action="/cgi/mb">
        <div class="row g-3 align-items-center">
          <div class="col-auto">
            <label class="col-form-label visually-hidden" for="collection-search">Search for collections</label>
          </div>
          <div class="col-auto flex-grow-1">
            <input name="q1" type="text" id="collection-search" class="form-control" placeholder="Search using keywords" required="required">
              <xsl:attribute name="value">
                <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
              </xsl:attribute>
            </input>
          </div>
          <div class="col-auto">
            <button type="submit" class="btn btn-secondary">Search</button>
          </div>
        </div>
        <div class="search-help p-3 pt-1 fs-7 fst-italic mt-2">
          <i class="fa-solid fa-circle-info fa-fw" aria-hidden="true"></i>
          <xsl:text>Find </xsl:text>
          <xsl:call-template name="get-colltype-descriptor" />
          <xsl:text> collections matching keywords.</xsl:text>
        </div>

        <xsl:variable name="search-params-tmpl">
          <dc:select>
            <dc:option name="pn" />
            <dc:option name="sort" />
            <dc:option name="dir" />
            <dc:option name="sz" />
            <dc:option name="debug" />
            <dc:option name="skin" />
            <dc:option name="colltype" />
            <dc:option name="min_items" />
          </dc:select>
        </xsl:variable>
        <xsl:variable name="search-params" select="exsl:node-set($search-params-tmpl)" />

        <xsl:variable name="CurrentCgi" select="//CurrentCgi" />
        <xsl:for-each select="$search-params//dc:option">
          <xsl:variable name="name" select="@name" />
          <xsl:if test="normalize-space($CurrentCgi/Param[@name=$name])">
            <input type="hidden" name="{$name}" value="{$CurrentCgi/Param[@name=$name]}" />
          </xsl:if>
        </xsl:for-each>
    
        <input type="hidden" name="a" value="listcs"/>
      </form>
    </div>  
  </xsl:template>

  <xsl:template name="get-colltype-descriptor">
    <xsl:choose>
      <xsl:when test="$gColltype = 'featured'">
        featured
      </xsl:when>
      <xsl:when test="$gColltype = 'updated'">
        recently updated
      </xsl:when>
      <xsl:when test="$gColltype = 'my-collections'">
        my 
      </xsl:when>
      <xsl:otherwise>
        shared 
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template match="Collection" priority="99">
    <article class="record d-flex gap-3 p-3 mb-3 mt-3 shadow-sm">
      <xsl:if test="@featured = 'TRUE'">
        <xsl:attribute name="data-featured">true</xsl:attribute>
      </xsl:if>
      <xsl:if test="Owner = $gUserId">
        <xsl:attribute name="data-owned">true</xsl:attribute>
      </xsl:if>
      <xsl:if test="@temporary = 'TRUE'">
        <xsl:attribute name="data-temporary">true</xsl:attribute>
      </xsl:if>

      <div class="cover d-none d-md-block">
        <xsl:if test="normalize-space(Branding)">
          <img loading="lazy" class="bookCover border p-1 flex-grow-0 flex-shrink-0" aria-hidden="true" alt="" src="{Branding}" />
        </xsl:if>
      </div>
      <div class="flex-grow-1 d-flex flex-column justify-content-between">
        <div class="container-fluid p-1">
          <div class="d-flex flex-row align-items-start justify-content-between">
            <h3 class="record-title">
              <a href="mb?a=listis;c={CollId}"><xsl:value-of select="CollName" /></a>
            </h3>
            <div class="d-flex align-items-center gap-1">
              <xsl:if test="@featured = 'TRUE'">
                <span class="badge text-bg-primary">Featured</span>
              </xsl:if>
              <xsl:if test="@owned = 'TRUE'">
                <xsl:choose>
                  <xsl:when test="IsTemporary = 'TRUE'">
                    <span class="badge text-bg-danger text-uppercase">Temporary</span>
                  </xsl:when>
                  <xsl:when test="Shared = '0'">
                    <span class="badge text-bg-secondary">Private</span>
                  </xsl:when>
                  <xsl:otherwise />
                </xsl:choose>
                <xsl:if test="Shared = '0'">
                  <xsl:if test="NumItems &gt; 0 and OwnerAffiliated = 'true'">
                    <form method="POST" action="/cgi/mb">
                      <input type="hidden" name="a" value="editst" />
                      <input type="hidden" name="shrd" value="1" />
                      <input type="hidden" name="c" value="{CollId}" />
                      <input type="hidden" name="colltype" value="{$gView}" />
                      <xsl:if test="$gSkin"><input type="hidden" name="skin" value="{$gSkin}" /></xsl:if>
                      <button type="submit" class="btn btn-outline-dark btn-sm action-change-shared text-nowrap">Make Public</button>
                    </form>
                  </xsl:if>
                </xsl:if>
                <xsl:if test="Shared = '1'">
                  <form method="POST" action="/cgi/mb">
                    <input type="hidden" name="a" value="editst" />
                    <input type="hidden" name="shrd" value="0" />
                    <input type="hidden" name="c" value="{CollId}" />
                    <input type="hidden" name="c" value="{$gView}" />
                    <xsl:if test="$gSkin"><input type="hidden" name="skin" value="{$gSkin}" /></xsl:if>
                    <button type="submit" class="btn btn-outline-dark btn-sm action-change-shared text-nowrap">Make Private</button>
                  </form>
                </xsl:if>
                <form method="POST" action="/cgi/mb" data-collname="{CollName/@e}" data-confirm="true">
                  <input type="hidden" name="a" value="delc" />
                  <input type="hidden" name="shrd" value="0" />
                  <input type="hidden" name="c" value="{CollId}" />
                  <input type="hidden" name="colltype" value="{$gView}" />
                  <xsl:if test="$gSkin"><input type="hidden" name="skin" value="{$gSkin}" /></xsl:if>
                  <button type="submit" class="btn btn-outline-danger btn-sm action-change-shared text-nowrap">Delete</button>
                </form>
              </xsl:if>
            </div>
          </div>
          <dl class="metadata mt-3">
            <xsl:if test="normalize-space(ContributorName)">
              <div class="grid">
                <dt class="g-col-lg-4 g-col-12">Contributor Name</dt>
                <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="ContributorName" /></dd>
              </div>
            </xsl:if>
            <div class="grid">
              <dt class="g-col-lg-4 g-col-12">Updated</dt>
              <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="Updated_Display" /></dd>
            </div>
            <div class="grid">
              <dt class="g-col-lg-4 g-col-12">Number of items</dt>
              <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="NumItems_Display" /></dd>
            </div>
            <xsl:if test="normalize-space(Description)">
              <div class="grid">
                <dt class="g-col-lg-4 g-col-12">Description</dt>
                <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="Description" /></dd>
              </div>
            </xsl:if>
          </dl>
        </div>
      </div>
    </article>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:variable name="sz">
      <xsl:choose>
        <xsl:when test="//Param[@name='sz']">
          <xsl:value-of select="//Param[@name='sz']" />
        </xsl:when>
        <xsl:otherwise>25</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="sort" select="//Param[@name='sort']" />
    <xsl:variable name="items" select="//CollList/Collection[@selected='TRUE']" />
    <xsl:choose>
      <xsl:when test="$sort = 'cn_a'">
        <xsl:for-each select="$items">
          <xsl:sort select="CollName_Sort" order="ascending" />
          <xsl:if test="position() &lt;= $sz">
            <xsl:apply-templates select="." />
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:when test="$sort = 'own_a'">
        <xsl:for-each select="$items">
          <xsl:sort select="OwnerString_Sort" order="ascending" />
          <xsl:if test="position() &lt;= $sz">
            <xsl:apply-templates select="." />
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:when test="$sort = 'num_a'">
        <xsl:for-each select="$items">
          <xsl:sort select="NumItems" order="ascending" type="number" />
          <xsl:if test="position() &lt;= $sz">
            <xsl:apply-templates select="." />
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:when test="$sort = 'num_d'">
        <xsl:for-each select="$items">
          <xsl:sort select="NumItems" order="descending" type="number" />
          <xsl:if test="position() &lt;= $sz">
            <xsl:apply-templates select="." />
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:when test="$sort = 'updated_d'">
        <xsl:for-each select="$items">
          <xsl:sort select="Updated" order="descending" />
          <xsl:if test="position() &lt;= $sz">
            <xsl:apply-templates select="." />
          </xsl:if>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <xsl:for-each select="$items[position() &lt;= $sz]">
          <xsl:apply-templates select="." />
        </xsl:for-each>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-temporary-collection-alert">
    <xsl:if test="count(//CollList/Collection[@temporary='TRUE']) &gt; 0">
      <div class="alert alert-block alert-danger">
        <strong>You have temporary collections.</strong>
        Log in to make the collections permanent.
      </div>
    </xsl:if>
  </xsl:template>
  
  <xsl:template name="build-sidebar-container">
    <div class="twocol-side" id="sidebar">

      <button id="action-toggle-filters" class="btn btn-outline-primary" aria-expanded="false">
        <span>
          <span class="not-expanded">Show</span>
          <span class="is-expanded">Hide</span>
          Search Filters
        </span>
      </button>

      <div>
        <xsl:if test="//LoggedIn='YES' and count(//CollList/Collection[@owned='TRUE']) != 0">
          <xsl:call-template name="build-collection-tools" />
        </xsl:if>

        <h2 class="fs-3 mt-3">Filter your collections</h2>

        <xsl:if test="(normalize-space($gQueryString) and $gQueryString != '*')">
          <div class="accordion mb-3">
            <xsl:call-template name="build-accordion-item">
              <xsl:with-param name="id" select="'current'" />
              <xsl:with-param name="open" select="true()" />
              <xsl:with-param name="heading">Current Filters</xsl:with-param>
              <xsl:with-param name="body">
                <ul class="list-group list-group-flush">
                  <xsl:call-template name="build-search-query-summary" />
                </ul>
              </xsl:with-param>
            </xsl:call-template>
          </div>    
        </xsl:if>
        <div class="accordion mb-3">
          <xsl:call-template name="build-collection-filter" />
          <xsl:call-template name="build-collection-size-filter" />
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-search-query-summary">
    <xsl:if test="$gQueryString != '*'">
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>
          <xsl:text>Collections matching: </xsl:text>
          <xsl:value-of select="$gQueryString" />
        </span>
      
        <a class="btn btn-outline-dark btn-lg">
          <xsl:attribute name="href">
            <xsl:text>/cgi/mb?a=listcs;colltype=</xsl:text>
            <xsl:value-of select="$gView" />
            <xsl:if test="$gSizeRange">
              <xsl:text>;size=</xsl:text>
              <xsl:value-of select="$gSizeRange" />
            </xsl:if>
            <xsl:if test="//Param[@name='sort']">
              <xsl:text>;sort=</xsl:text>
              <xsl:value-of select="//Param[@name='sort']" />
            </xsl:if>
            <xsl:if test="//Param[@name='skin']">
              <xsl:text>;skin=</xsl:text>
              <xsl:value-of select="//Param[@name='skin']" />
            </xsl:if>
          </xsl:attribute>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="visually-hidden">Remove</span>
        </a>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-collection-filter">
    <xsl:variable name="widget" select="//ViewSizeWidget" />
    <xsl:call-template name="build-accordion-item">
      <xsl:with-param name="id" select="'colltype'" />
      <xsl:with-param name="open" select="true()" />
      <xsl:with-param name="heading">View Collections</xsl:with-param>
      <xsl:with-param name="body">
        <div class="list-group list-group-flush">
          <xsl:call-template name="filter-view-option">
            <xsl:with-param name="name">Shared Collections</xsl:with-param>
            <xsl:with-param name="display" select="$widget/Size[@key='all']/@count" />
            <xsl:with-param name="count" select="$widget/Size[@key='all']/@count" />
            <xsl:with-param name="checked" select="$gView = 'all'" />
            <xsl:with-param name="href" select="'all'" />
            <xsl:with-param name="label" select="'view-all'" />
          </xsl:call-template>
          <xsl:call-template name="filter-view-option">
            <xsl:with-param name="name">Recently Updated Collections</xsl:with-param>
            <xsl:with-param name="display" select="$widget/Size[@key='updated']/@count" />
            <xsl:with-param name="count" select="$widget/Size[@key='updated']/@count" />
            <xsl:with-param name="checked" select="$gView = 'updated'" />
            <xsl:with-param name="href" select="'updated'" />
            <xsl:with-param name="label" select="'view-updated'" />
          </xsl:call-template>
          <xsl:call-template name="filter-view-option">
            <xsl:with-param name="name">Featured Collections</xsl:with-param>
            <xsl:with-param name="display" select="$widget/Size[@key='featured']/@count" />
            <xsl:with-param name="count" select="$widget/Size[@key='featured']/@count" />
            <xsl:with-param name="checked" select="$gView = 'featured'" />
            <xsl:with-param name="href" select="'featured'" />
            <xsl:with-param name="label" select="'view-featured'" />
          </xsl:call-template>
          <xsl:call-template name="filter-view-option">
            <xsl:with-param name="name">My Collections</xsl:with-param>
            <xsl:with-param name="display" select="$widget/Size[@key='my-collections']/@count" />
            <xsl:with-param name="count" select="$widget/Size[@key='my-collections']/@count" />
            <xsl:with-param name="checked" select="$gView = 'my-collections'" />
            <xsl:with-param name="href" select="'my-collections'" />
            <xsl:with-param name="label" select="'view-my-collections'" />
          </xsl:call-template>
        </div>
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="build-collection-size-filter">

    <xsl:variable name="size-list-template">
      <h:list>
        <h:option value="1000">1000 items or more</h:option>
        <h:option value="500-1000">500-1000 items</h:option>
        <h:option value="250-500">250-500 items</h:option>
        <h:option value="100-250">100-250 items</h:option>
        <h:option value="50-100">50-100 items</h:option>
        <h:option value="25-50">25-50 items</h:option>
        <h:option value="0-25">up to 25 items</h:option>
      </h:list>
    </xsl:variable>
    <xsl:variable name="size-list" select="exsl:node-set($size-list-template)" />

    <xsl:variable name="widget" select="//ListSizeWidget" />

    <xsl:call-template name="build-accordion-item">
      <xsl:with-param name="id" select="'size'" />
      <xsl:with-param name="open" select="true()" />
      <xsl:with-param name="heading">Collection Size</xsl:with-param>
      <xsl:with-param name="body">
        <div class="list-group list-group-flush">
          <a>
            <xsl:call-template name="build-size-href">
            </xsl:call-template>
            <xsl:attribute name="class">
              <xsl:text>list-group-item d-flex justify-content-between align-items-center</xsl:text>
              <xsl:if test="not(normalize-space($gSizeRange))"> active</xsl:if>
            </xsl:attribute>
            <xsl:if test="not(normalize-space($gSizeRange))">
              <xsl:attribute name="aria-current">true</xsl:attribute>
            </xsl:if>
            <xsl:text>Any size</xsl:text>
            <span xclass="badge bg-dark rounded-pill">
              <xsl:value-of select="$widget//Size[@key = 'all']/@count" />
            </span>
          </a>
          <xsl:for-each select="$size-list//h:option">
            <xsl:variable name="value" select="@value" />
            <xsl:variable name="size" select="$widget//Size[@key = $value]" />
            <xsl:if test="$size/@disabled = 'FALSE'">
              <a>
                <xsl:call-template name="build-size-href">
                  <xsl:with-param name="size" select="$value" />
                </xsl:call-template>
                <xsl:attribute name="class">
                  <xsl:text>list-group-item d-flex justify-content-between align-items-center</xsl:text>
                  <xsl:if test="$size/@focus = 'TRUE'"> active</xsl:if>
                </xsl:attribute>
                <xsl:if test="$size/@focus = 'TRUE'">
                  <xsl:attribute name="aria-current">true</xsl:attribute>
                </xsl:if>
                <xsl:value-of select="." />
                <span xclass="badge bg-dark rounded-pill">
                  <xsl:value-of select="$size/@count" />
                </span>
              </a>
            </xsl:if>
          </xsl:for-each>
        </div>        
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="build-size-href">
    <xsl:param name="size" />
    <xsl:attribute name="href">
      <xsl:text>/cgi/mb?a=listcs</xsl:text>
      <xsl:text>;colltype=</xsl:text>
      <xsl:value-of select="$gView" />
      <xsl:if test="$size">
        <xsl:text>;size=</xsl:text>
        <xsl:value-of select="$size" />
      </xsl:if>
      <xsl:if test="$gQueryString">
        <xsl:text>;q1=</xsl:text>
        <xsl:value-of select="$gQueryString" />
      </xsl:if>
      <xsl:if test="$gSkin">
        <xsl:text>;skin=</xsl:text>
        <xsl:value-of select="$gSkin" />
      </xsl:if>
    </xsl:attribute>
  </xsl:template>

  <xsl:template name="filter-view-option">
    <xsl:param name="name" />
    <xsl:param name="count" />
    <xsl:param name="display" />
    <xsl:param name="checked" />
    <xsl:param name="href" />
    <xsl:param name="label" />

    <a>
      <xsl:choose>
        <xsl:when test="$display = 0">
          <xsl:attribute name="aria-disabled">true</xsl:attribute>
          <xsl:attribute name="role">link</xsl:attribute>
        </xsl:when>
        <xsl:otherwise>
          <xsl:attribute name="href">
            <xsl:text>/cgi/mb?a=listcs</xsl:text>
            <xsl:text>;colltype=</xsl:text>
            <xsl:value-of select="$href" />
            <xsl:if test="$gSizeRange">
              <xsl:text>;size=</xsl:text>
              <xsl:value-of select="$gSizeRange" />
            </xsl:if>
            <xsl:if test="$gQueryString">
              <xsl:text>;q1=</xsl:text>
              <xsl:value-of select="$gQueryString" />
            </xsl:if>
            <xsl:if test="//Param[@name='skin']">
              <xsl:text>;skin=</xsl:text>
              <xsl:value-of select="//Param[@name='skin']" />
            </xsl:if>
          </xsl:attribute>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:attribute name="class">
        <xsl:text>list-group-item d-flex justify-content-between align-items-center</xsl:text>
        <xsl:if test="$checked = 'true'"> active</xsl:if>
        <xsl:if test="$count = 0"> disabled</xsl:if>
      </xsl:attribute>
      <xsl:if test="$checked = 'true'">
        <xsl:attribute name="aria-current">true</xsl:attribute>
      </xsl:if>
      <xsl:value-of select="$name" />
      <span xclass="badge bg-dark rounded-pill">
        <xsl:value-of select="$display" />
      </span>
    </a>
  </xsl:template>

  <xsl:template name="build-collection-tools">
    <div>
      <h2 class="filters-heading fs-3">Collection Tools</h2>
      <div class="accordion" id="accordion-tools">
        <xsl:call-template name="transfer-all-collection" />
      </div>
    </div>
  </xsl:template>
  
  <xsl:template name="transfer-all-collection">
    <xsl:call-template name="build-accordion-item">
      <xsl:with-param name="id">transfer</xsl:with-param>
      <xsl:with-param name="parent">accordion-tools</xsl:with-param>
      <xsl:with-param name="heading">Transfer Collections</xsl:with-param>
      <xsl:with-param name="body">
        <p>Generate a link to transfer your collections to another user.</p>

        <xsl:choose>
          <xsl:when test="count(//PendingTransfers/Transfer) != 0">
            <div class="alert alert-info">
              Some collections are already scheduled for transfer.
            </div>
            <p>
              <strong>Review Transfers</strong>
            </p>
            <ul>
              <xsl:for-each select="//PendingTransfers/Transfer">
                <li>
                  <a href="{@href}">
                    <xsl:choose>
                      <xsl:when test="Payload = 'ALL'">
                        My Collections
                      </xsl:when>
                      <xsl:otherwise>
                        <xsl:variable name="payload" select="normalize-space(Payload)" />
                        <xsl:variable name="collection" select="//CollList/Collection[CollId=$payload]" />
                        <xsl:value-of select="$collection/CollName" />
                      </xsl:otherwise>
                    </xsl:choose>
                  </a>
                </li>
              </xsl:for-each>
            </ul>
          </xsl:when>
          <xsl:otherwise>
            <form action="/cgi/mb/transfer">
              <input type="hidden" name="c" value="ALL" />
              <button class="btn btn-outline-dark">Transfer</button>
            </form>
          </xsl:otherwise>
        </xsl:choose>

        <p class="fs-7 mt-3">
          <a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387214348" class="transfer-help-link">
            <i class="fa-regular fa-circle-question fa-fw" aria-hidden="true"></i> 
            <xsl:text>Help about Transferring Collections</xsl:text>
          </a>
        </p>
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="build-nav-pagination">
    <xsl:if test="count(//PageURL) > 1">
      <hathi-results-pagination
        data-prop-next-href="{//Paging/NextPage/Href}"
        data-prop-prev-href="{//Paging/PrevPage/Href}"
        data-prop-value="{//Paging/CurrentPage}"
        data-prop-max-pages="{//Paging/TotalPages}"
        data-prop-param="pn"
        ></hathi-results-pagination>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-confirm-handlers">
    <script type="text/javascript">
      function confirmDelete(event) {
        const collname = decodeURIComponent(event.target.dataset.collname);
        const choice = window.confirm("Do you really want to delete the collection " + collname + "?");
        if ( choice ) {
          return true;
        }
        event.preventDefault();
        event.stopPropagation();
        return false;  
      }
      document.querySelectorAll('[data-confirm="true"]').forEach(function(el) {
        el.onsubmit = confirmDelete;
      });
    </script>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections</xsl:text>
  </xsl:template>

</xsl:stylesheet>
