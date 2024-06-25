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

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#section">Skip to collections list</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <script type="text/javascript">
      <xsl:value-of select="//CollectionsOwnedJs" />
      <xsl:value-of select="//CollectionSizesJs" />
    </script>
    <style type="text/css">
      .record--temporary .xbadge {
        text-transform: uppercase;
      }
    </style>
  </xsl:template>

  <xsl:template name="setup-html-data-attributes">
    <!-- <xsl:attribute name="data-use">search</xsl:attribute> -->
  </xsl:template>

  <xsl:template name="main">
    <xsl:call-template name="build-results-container" />
  </xsl:template>

  <xsl:template name="build-results-container">
    <div class="results-container" data-colltype="{//Param[@name='colltype']}">

      <h1 class="listcs-intro" style="margin-left: 0; font-weight: normal; margin-bottom: 1rem">
          Collections are a way to group items for public or private use.
      </h1>

      <xsl:call-template name="build-temporary-collection-alert" />

      <div class="results-summary-container">
        <h2 class="results-summary">
          <span class="pagination-summary">
            <xsl:text>1 to 25 of </xsl:text>
            <xsl:value-of select="count(//CollList/Collection[@selected='TRUE'])" />
          </span>
          <span class="current-filter">
            <xsl:choose>
              <xsl:when test="$gView = 'featured'">Featured</xsl:when>
              <xsl:when test="$gView = 'updated'">Recently Updated</xsl:when>
              <xsl:when test="$gView = 'my-collections'">My Collections</xsl:when>
              <xsl:otherwise>All Collections</xsl:otherwise>
            </xsl:choose>
            <xsl:text> Collections</xsl:text>
          </span>
        </h2>
        <div class="results-actions">
          <label for="sort-option">Sort by</label>
          <select name="sort" id="sort-option">
            <xsl:for-each select="//SortWidget/SortWidgetSort/Option[Value != 'OwnerString']">
              <option value="{Value}">
                <xsl:if test="Focus = 'true'">
                  <xsl:attribute name="selected">selected</xsl:attribute>
                </xsl:if>
                <xsl:if test="@data-sort">
                  <xsl:attribute name="data-sort"><xsl:value-of select="@data-sort" /></xsl:attribute>
                </xsl:if>
                <xsl:value-of select="Label" />
              </option>
            </xsl:for-each>
          </select>
          <label for="top_paging">Items per page</label>
          <select name="sz" id="top_paging">
            <xsl:for-each select="//SliceSizeWidget/Option">
              <option value="{Value}">
                <xsl:if test="Focus = 'true'">
                  <xsl:attribute name="selected">selected</xsl:attribute>
                </xsl:if>
                <xsl:value-of select="Value" />
              </option>
            </xsl:for-each>
          </select>
        </div>
      </div>
      <div class="results-summary-container" style="justify-content: space-between">
        <!-- row 2! -->
        <div class="results-actions not-mobile" style="justify-content: flex-start">
          <label for="filter-q">Find </label>
          <input type="text" name="q" id="filter-q" style="width: 15rem" placeholder="Find a collection" />
        </div>
        <div class="results-actions" style="justify-content: flex-end">
          <button id="action-new-collection" class="btn">New Collection</button>
        </div>
      </div>
      <div class="listcs-intro">
        <p>
          The full-text of items within a collection can be searched
          independently of the full library.
          <a href="https://www.hathitrust.org/help_digital_library#CBBuild">Learn more about collections</a>
        </p>
      </div>
      <!-- <div class="listcs-intro">
        <p>
          Collections are a way to group items for public or private use.
          The full-text of items within a collection can be searched
          independently of the full library.
          <a href="https://www.hathitrust.org/help_digital_library#CBBuild">Learn more about collections</a>
        </p>
      </div> -->
      <xsl:call-template name="build-results-template" />
      <xsl:call-template name="build-results-data" />
      <div class="results-container--list">
        <xsl:call-template name="build-results-list" />
      </div>
      <xsl:call-template name="build-nav-pagination" />
      <script type="text/javascript">
        head.js("/mb/alicorn/js/list_colls.js");
      </script>
    </div>
  </xsl:template>

  <xsl:template name="build-results-template">
    <!-- <template id="article-template">
      <article class="record">
        <div class="cover">
        </div>
        <div class="record-container record-medium-container">
          <div class="record-title-and-actions-container">
            <h3 class="record-title">
              <a data-key="CollName" href="#"></a>
              <div class="actions"></div>
            </h3>
            <dl style="font-size: .9rem">
              <dt>Updated</dt>
              <dd data-key="Updated_Display"></dd>
              <dt>Owner</dt>
              <dd data-key="OwnerName"></dd>
              <dt>Number of items</dt>
              <dd data-key="NumItems_Display"></dd>
            </dl>
          </div>
          <div class="resource-access-container" data-key="Description"></div>
        </div>
      </article>
    </template> -->
  </xsl:template>

  <xsl:template name="build-results-data">
    <script type="text/javascript">
      var HT = HT || {};
      HT.listcs = HT.listcs || {};
      HT.listcs.bucket = [];
      HT.listcs.featured = [];

      <xsl:for-each select="//CollList/Collection">
          var datum = {};
          datum.index = <xsl:value-of select="position()" />;
          datum.CollId = '<xsl:value-of select="CollId" />';
          datum.CollName = decodeURIComponent('<xsl:value-of select="CollName/@e" />');
          datum.Description = decodeURIComponent('<xsl:value-of select="Description/@e" />');
          datum.NumItems = <xsl:value-of select="NumItems" />;
          datum.NumItems_Display = '<xsl:value-of select="NumItems_Display" />';
          datum.ContributorName = decodeURIComponent('<xsl:value-of select="ContributorName/@e" />');

          datum.isOwnerAffiliated = '<xsl:value-of select="OwnerAffiliated" />' == 'true';
          datum.Updated = '<xsl:value-of select="Updated" />';
          datum.Updated_Display = '<xsl:value-of select="Updated_Display" />';
          datum.Featured = '<xsl:value-of select="Featured" />';
          datum.isFeatured = '<xsl:value-of select="@featured" />' == 'TRUE';
          datum.isUpdated = '<xsl:value-of select="@updated" />' == 'TRUE';
          if ( datum.isFeatured ) {
            HT.listcs.featured.push(datum);
          }
          datum.Branding = '<xsl:value-of select="Branding" />';
          datum.Shared = '<xsl:value-of select="Shared" />';
          datum.isShared = '<xsl:value-of select="Shared" />' == '1';
          datum.DeleteCollHref = '<xsl:value-of select="DeleteCollHref" />';
          datum.isOwned = '<xsl:value-of select="@owned" />' == 'TRUE';
          datum.isTemporary  = '<xsl:value-of select="@temporary" />' == 'TRUE';
          HT.listcs.bucket.push(datum);
      </xsl:for-each>

    </script>
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
  
  <xsl:template match="Collection">
    <article data-collid="{CollId}">
      <xsl:attribute name="class">
        <xsl:text>record</xsl:text>
        <xsl:if test="@featured = 'TRUE'">
          <xsl:text> record--featured</xsl:text>
        </xsl:if>
        <xsl:if test="Owner = $gUserId">
          <xsl:text> record--owned</xsl:text>
        </xsl:if>
        <xsl:if test="@temporary = 'TRUE'">
          <xsl:text> record--temporary</xsl:text>
        </xsl:if>
      </xsl:attribute>
      <div class="cover">
        <xsl:if test="normalize-space(Branding)">
          <img class="bookCover" aria-hidden="true" alt="" src="{Branding}" />
        </xsl:if>
      </div>
      <div class="record-container record-medium-container">
        <div class="record-title-and-actions-container">
          <div class="record-title-actions">
            <h3 class="record-title">
              <a href="/cgi/mb?a=listis;c={CollId}"><xsl:value-of select="CollName" /></a>
            </h3>
            <xsl:if test="@featured = 'TRUE' or Owner = $gUserId">
              <div class="actions">
                <xsl:if test="@featured = 'TRUE'">
                  <span class="xbadge xbadge-dark">Featured</span>
                </xsl:if>
                <xsl:if test="Owner = $gUserId">
                  <xsl:choose>
                    <xsl:when test="IsTemporary = 'TRUE'">
                      <span class="xbadge xbadge-secondary" style="text-transform: uppercase">Temporary</span>
                    </xsl:when>
                    <xsl:when test="Shared = '0'">
                      <span class="xbadge xbadge-secondary">Private</span>
                    </xsl:when>
                    <xsl:otherwise />
                  </xsl:choose>
                  <xsl:if test="Shared = '0'">
                    <!-- <span class="xbadge xbadge-secondary">Private</span> -->
                    <xsl:if test="NumItems &gt; 0">
                      <button class="btn btn-sm action-change-shared" data-href="/cgi/mb?a=editst;shrd=1;collid={CollId};colltype={$gView}">Make Public</button>
                    </xsl:if>
                  </xsl:if>
                  <xsl:if test="Shared = '1'">
                    <button class="btn btn-sm action-change-shared" data-href="/cgi/mb?a=editst;shrd=0;collid={CollId};colltype={$gView}">Make Private</button>
                  </xsl:if>
                  <button class="btn btn-sm action-delete" data-href="{DeleteCollHref}">Delete</button>
                </xsl:if>
              </div>
            </xsl:if>
          </div>
          <dl style="font-size: .9rem">
            <xsl:if test="true() and normalize-space(ContributorName)">
              <dt>Contributor</dt>
              <dd>
                <xsl:value-of select="ContributorName" />
              </dd>
            </xsl:if>
            <dt>Updated</dt>
            <dd><xsl:value-of select="Updated_Display" /></dd>
            <dt>Number of items</dt>
            <dd><xsl:value-of select="NumItems_Display" /></dd>
          </dl>
        </div>
        <xsl:if test="normalize-space(Description)">
          <div class="resource-access-container">
            <p><xsl:value-of select="Description" /></p>
          </div>
        </xsl:if>
      </div>
    </article>
  </xsl:template>

  <xsl:template name="build-nav-pagination">
    <nav class="pagination-container" aria-label="Pagination">
      <div class="page-back-link">
      </div>
      <ul>
      </ul>
      <div class="page-advance-link">
      </div>
    </nav>
  </xsl:template>

  <xsl:template name="build-sidebar-container">
    <div class="sidebar-container active-filters--empty" id="sidebar">
      <button class="for-mobile sidebar-toggle-button filter-group-toggle-show-button" aria-expanded="false">
        <span class="flex-space-between flex-center">
          <h3 class="filter-group-heading">
            Options/Filters
            <span class="total-filter-count"></span>
          </h3>
          <!-- <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-collapsed"></use></svg> -->
          <i class="icomoon icomoon-sidebar-toggle" aria-hidden="true"></i>
        </span>
      </button>

      <h2 class="filters-heading">Filter collections</h2>

      <h3 class="active-filters-heading">Current Filters</h3>
      <ul class="active-filters-list"></ul>

      <ul class="filter-group-list">
        <li>
          <xsl:call-template name="build-collection-filter" />
        </li>
        <xsl:call-template name="build-collection-size-filter" />
      </ul>

      <xsl:if test="count(//CollList/Collection[@owned='TRUE']) != 0">
        <xsl:call-template name="build-collection-tools" />
      </xsl:if>

    </div>
  </xsl:template>

  <xsl:template name="build-collection-filter">
    <h3 class="filters-heading" id="collection-filter-desc">Collection Filter</h3>
    <ul class="filter-list" role="radiogroup" aria-labelledby="collection-filter-desc">
      <li class="filter-group filter-group-checkbox">
        <xsl:call-template name="filter-view-option">
          <xsl:with-param name="name">All Collections</xsl:with-param>
          <xsl:with-param name="display" select="count(//CollList/Collection)" />
          <xsl:with-param name="count" select="count(//CollList/Collection)" />
          <xsl:with-param name="checked" select="$gView = 'all'" />
          <xsl:with-param name="href" select="'all'" />
          <xsl:with-param name="label" select="'view-all'" />
        </xsl:call-template>
      </li>
      <li class="filter-group filter-group-checkbox">
        <xsl:call-template name="filter-view-option">
          <xsl:with-param name="name">Recently Updated</xsl:with-param>
          <xsl:with-param name="display" select="count(//CollList/Collection[@updated='TRUE'])" />
          <xsl:with-param name="count" select="count(//CollList/Collection[@updated='TRUE'])" />
          <xsl:with-param name="checked" select="$gView = 'updated'" />
          <xsl:with-param name="href" select="'updated'" />
          <xsl:with-param name="label" select="'view-updated'" />
        </xsl:call-template>
      </li>
      <li class="filter-group filter-group-checkbox">
        <xsl:call-template name="filter-view-option">
          <xsl:with-param name="name">Featured</xsl:with-param>
          <xsl:with-param name="display" select="count(//CollList/Collection[@featured='TRUE'])" />
          <xsl:with-param name="count" select="count(//CollList/Collection[@featured='TRUE'])" />
          <xsl:with-param name="checked" select="$gView = 'featured'" />
          <xsl:with-param name="href" select="'featured'" />
          <xsl:with-param name="label" select="'view-featured'" />
        </xsl:call-template>
      </li>
      <li class="filter-group filter-group-checkbox">
        <xsl:call-template name="filter-view-option">
          <xsl:with-param name="name">My Collections</xsl:with-param>
          <xsl:with-param name="display" select="count(//CollList/Collection[@owned='TRUE'])" />
          <xsl:with-param name="count" select="count(//CollList/Collection[@owned='TRUE'])" />
          <xsl:with-param name="checked" select="$gView = 'my-collections'" />
          <xsl:with-param name="href" select="'my-collections'" />
          <xsl:with-param name="label" select="'view-my-collections'" />
        </xsl:call-template>
      </li>
    </ul>
  </xsl:template>

  <xsl:template name="build-collection-size-filter">

    <xsl:variable name="items" select="//CollList/Collection[@selected='TRUE']" />

    <xsl:variable name="size-list-template">
      <h:list>
        <h:option value="1000">1000 items or more</h:option>
        <h:option value="500">500-1000 items</h:option>
        <h:option value="250">250-500 items</h:option>
        <h:option value="100">100-250 items</h:option>
        <h:option value="50">50-100 items</h:option>
        <h:option value="25">25-50 items</h:option>
        <h:option value="-1">up to 25 items</h:option>
      </h:list>
    </xsl:variable>
    <xsl:variable name="size-list" select="exsl:node-set($size-list-template)" />


    <li class="filter-group filter-group-multiselect">
      <button class="filter-group-toggle-show-button" aria-expanded="true">
        <span class="flex-space-between flex-center">
          <h3 class="filter-group-heading">Collections with</h3>
          <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-expanded"></use></svg>
        </span>
      </button>
      <div class="filter-list-container">
        <ul class="filter-list">
          <xsl:for-each select="$size-list//h:option">
            <xsl:variable name="label" select="." />
            <xsl:variable name="min" select="@value" />
            <xsl:variable name="index" select="position()" />
            <xsl:variable name="max" select="$size-list//h:option[$index - 1]/@value" />
            <!-- <xsl:variable name="count" select="count($items[@featured='TRUE'][NumItems &gt;= $value])" /> -->
            <xsl:variable name="count">
              <xsl:choose>
                <xsl:when test="position() = 1">
                  <xsl:value-of select="count($items[NumItems &gt;= $min])" />
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="count($items[NumItems &gt;= $min][NumItems &lt; $max])" />
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>
            <li class="filter-item">
              <button class="filter-button" data-target="{$min}" data-type="min_items">
                <xsl:attribute name="aria-label">
                  <xsl:value-of select="$label" />
                  <xsl:text> - </xsl:text>
                  <xsl:value-of select="$count" />
                </xsl:attribute>
                <xsl:if test="$count = 0">
                  <xsl:attribute name="disabled">disabled</xsl:attribute>
                </xsl:if>
                <span class="flex-space-between flex-center">
                  <span class="filter-value"><xsl:value-of select="$label" /></span>
                  <span class="filter-count"><xsl:value-of select="$count" /></span>
                </span>
              </button>
              <!-- <pre>
                <xsl:value-of select="position() = last()" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="position()" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="last()" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="$count" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="$min" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="$max" />
                <xsl:text> : </xsl:text>
                <xsl:value-of select="count($items)" />
              </pre> -->
            </li>
          </xsl:for-each>
        </ul>
      </div>
    </li>
  </xsl:template>

  <xsl:template name="filter-view-option">
    <xsl:param name="name" />
    <xsl:param name="count" />
    <xsl:param name="display" />
    <xsl:param name="checked" />
    <xsl:param name="href" />
    <xsl:param name="label" />

    <button role="radio" aria-checked="{$checked}" class="checkbox-label">
      <xsl:attribute name="aria-labelledby"><xsl:value-of select="$label" /></xsl:attribute>
      <xsl:if test="$count = 0">
        <xsl:attribute name="disabled">disabled</xsl:attribute>
      </xsl:if>
      <xsl:if test="$count > 0">
        <xsl:choose>
          <xsl:when test="$checked = 'true'">
            <xsl:attribute name="tabindex">0</xsl:attribute>
          </xsl:when>
          <xsl:otherwise>
            <xsl:attribute name="tabindex">-1</xsl:attribute>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:attribute name="data-target"><xsl:value-of select="$href" /></xsl:attribute>
      </xsl:if>
      <div class="checkbox">
        <svg xmlns="http://www.w3.org/2000/svg" class="icon">
          <use>
            <xsl:choose>
              <xsl:when test="$checked">
                <xsl:attribute name="xlink:href">#radio-checked</xsl:attribute>
              </xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="xlink:href">#radio-empty</xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>
          </use>
        </svg>
      </div>
      <span class="flex-space-between flex-center" id="{$label}">
        <span class="filter-name"><xsl:value-of select="$name" /><xsl:text> </xsl:text></span>
        <xsl:if test="$count > 0">
          <span class="filter-count"><xsl:value-of select="$display" /></span>
        </xsl:if>
      </span>
    </button>
  </xsl:template>

  <xsl:template name="build-collection-tools">
    <div class="collection-tools" data-active="false">
      <h2 class="offscreen">Collection Tools</h2>
      <div class="panel">

        <h3>Transfer Collections</h3>

        <p>Generate a link to transfer your collections to another user account.</p>

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
              <button class="btn">Transfer</button>
            </form>
          </xsl:otherwise>
        </xsl:choose>

        <p class="smaller">
          <a href="https://www.hathitrust.org/help_digital_library#TransferCollection" class="transfer-help-link"><i class="icomoon icomoon-help" aria-hidden="true"></i> Help about Transferring Collections</a>
        </p>

      </div>

    </div>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections</xsl:text>
  </xsl:template>

</xsl:stylesheet>
