<?xml version="1.0" encoding="UTF-8" ?>
<!DOCTYPE xsl:stylesheet [
<!ENTITY mdash "–">
]>
<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS dc"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <!--## Global Variables ##-->
  <xsl:variable name="gIsAdvanced" select="/MBooksTop/AdvancedSearch/isAdvanced"/>
  <xsl:variable name="gCollSearch" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
  <xsl:variable name="g_current_sort_param" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']"/>
  <!-- need to separate sort and dir from sort param i.e. title_d = sort=title dir=d -->
  <xsl:variable name="g_current_sort" select="substring-before($g_current_sort_param,'_')"/>
  <xsl:variable name="g_current_sort_dir" select="substring-after($g_current_sort_param,'_')"/>
  <xsl:variable name="hidden_pn_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='pn']">
      <input name="pn" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='pn']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="hidden_sort_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']">
      <input name="sort" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="hidden_dir_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='dir']">
      <input name="dir" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='dir']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="hidden_sz_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sz']">
      <input name="sz" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sz']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="hidden_debug_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <input name="debug" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="full_text_count">
    <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCount"/>
  </xsl:variable>
  <xsl:variable name="all_items_count">
    <xsl:value-of select="/MBooksTop/LimitToFullText/AllItemsCount"/>
  </xsl:variable>
  <xsl:variable name="Field1">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='field1']"/>
  </xsl:variable>
  <xsl:variable name="gSelected">
    <xsl:value-of select="/MBooksTop/HeaderSearchSelect/Selected"/>
  </xsl:variable>
  <xsl:variable name="gLimit">
    <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
  </xsl:variable>
  <xsl:variable name="limitByInst">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='heldby']">
      <xsl:text>True</xsl:text>
    </xsl:if>
  </xsl:variable>
  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
  <xsl:variable name="gIsCollSearch">
    <xsl:choose>
      <xsl:when test="normalize-space($coll_id) != ''">
        <xsl:text>TRUE</xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>FALSE</xsl:text>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <xsl:variable name="gCollName">
    <xsl:if test="$gIsCollSearch = 'TRUE'">
      <xsl:value-of select="/MBooksTop/SearchResults/COLL_INFO/COLL_NAME"/>
    </xsl:if>
  </xsl:variable>

  <xsl:template name="setup-html-data-attributes">
    <xsl:if test="//MBooksGlobals/CurrentCgi/Param[@name='c']">
      <xsl:attribute name="data-anlaytics-dimension">
        <xsl:text>dimension2=</xsl:text>
        <xsl:text>:</xsl:text>
        <xsl:value-of select="//MBooksGlobals/CurrentCgi/Param[@name='c']" />
        <xsl:text>:</xsl:text>
      </xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-ft"><xsl:value-of select="//LimitToFullText/LimitType = 'ft'" /></xsl:attribute>
    <xsl:attribute name="data-use">search</xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <script type="text/javascript">
      <xsl:value-of select="//CollectionsOwnedJs" />
      <xsl:value-of select="//CollectionSizesJs" />
    </script>

  </xsl:template>

  <xsl:template name="GetAdvancedFullTextHref">
    <xsl:value-of select="AdvancedSearch/AdvancedSearchURL"/>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#section">Skip to search results</a>
        </li>
        <li>
          <a href="#sidebar">Skip to results filters</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="main">
    <xsl:choose>
      <xsl:when test="SearchResults/A_RESULTS/Item">
        <xsl:call-template name="build-results-container" />
        <xsl:if test="false()">
          <xsl:call-template name="DisplayContent">
            <xsl:with-param name="title" select="'Search Results'"/>
            <xsl:with-param name="item-list-contents" select="'items'"/>
            <!--AB-->
            <xsl:with-param name="hasB" select="$hasB"/>
          </xsl:call-template>
        </xsl:if>
      </xsl:when>
      <!--   <xsl:when test="SearchResults/SolrError[normalize-space(.)]">-->
      <xsl:when test="SearchResults/A_RESULTS/SolrError[normalize-space(.)]">
        <xsl:call-template name="SolrError"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="build-noresults-container"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-results-container">

    <xsl:if test="$gCollSearch">
      <xsl:call-template name="build-mondo-collection-header" />
    </xsl:if>

    <xsl:call-template name="check-processing-errors" />

    <div class="results-container">
      <xsl:attribute name="data-gdata">
        <xsl:value-of select="/MBooksTop/SearchResults/G_CLICK_DATA" />
      </xsl:attribute>
      <xsl:attribute name="data-logger-url">
        <xsl:value-of select="/MBooksTop/SearchResults/LoggerURL" />
      </xsl:attribute>
      <!-- <h2 class="offscreen">Search Results</h2> -->
      <div class="results-summary-container">
        <h2 class="results-summary">
          <xsl:value-of select="//FirstRecordNumber" />
          <xsl:text> to </xsl:text>
          <xsl:value-of select="//LastRecordNumber" />
          <xsl:text> of </xsl:text>
          <xsl:value-of select="//TotalCount" />
          <xsl:choose>
            <xsl:when test="$gIsCollSearch = 'TRUE'">
              <!-- <xsl:text> in the collection </xsl:text> -->
              <xsl:text> results from this collection</xsl:text>
              <!-- <em><xsl:value-of select="//COLL_INFO/COLL_NAME" /></em> -->
              <!-- <xsl:text> results</xsl:text> -->
            </xsl:when>
            <xsl:otherwise>
              <xsl:text> Full-Text results</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </h2>
        <div class="results-actions">
          <label for="top_paging">Items per page</label>
          <select name="sz" id="top_paging" data-href="{//SliceSizeWidget/@href}">
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
      <!-- <xsl:call-template name="build-nav-pagination" /> -->
      <xsl:call-template name="build-collections-toolbar" />
      <xsl:call-template name="build-results-list" />
      <xsl:call-template name="build-nav-pagination" />
      <script type="text/javascript">
        head.js("/ls/alicorn/js/ls_clicklog.js");
      </script>
    </div>
  </xsl:template>

  <xsl:template name="build-noresults-container">
    <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>

    <!-- <xsl:if test="$gIsCollSearch = 'TRUE' and /MBooksTop/AdvancedSearch/isAdvanced != 'true'">
      <xsl:call-template name="build-collection-search-widget"/>
    </xsl:if> -->

    <div class="results-container">

      <xsl:call-template name="check-processing-errors" />

      <div class="results-summary-container">
        <h2 class="results-summary"><b>No results</b> matched your search.</h2>
      </div>

      <div class="results-container-inner">

        <xsl:if test="false()">
          <div class="alert alert-info alert-block">
            <p class="error">
              <xsl:text>Your </xsl:text>
              <xsl:if test="$limitType = 'ft'">
                <xsl:text>Full View only </xsl:text>
              </xsl:if>
              <xsl:text>search</xsl:text>
              <xsl:if test="$gIsCollSearch = 'TRUE'">
                <xsl:text>  in the collection </xsl:text>
                <a href="/cgi/ls?a=srchls;q1=*;c={$coll_id}"><xsl:value-of select="$gCollName"/></a>
                <xsl:text> </xsl:text>
              </xsl:if>
              <xsl:if test="/MBooksTop/AdvancedSearch/isAdvanced = 'false'">
                <xsl:text> &mdash; </xsl:text>
                <strong><xsl:value-of select="//QueryString" /></strong>
                <xsl:text> &mdash; </xsl:text>
              </xsl:if>
              <xsl:text> did not match any resources.</xsl:text>
            </p>
          </div>
        </xsl:if>

        <xsl:if test="false() and /MBooksTop/AdvancedSearch/isAdvanced = 'true'">
          <xsl:call-template name="build-noresults-advanced-search-summary" />
        </xsl:if>

        <h3>Suggestions</h3>
        <ul class="bullets">
          <li>Revise your search term</li>
          <xsl:if test="($limitType = 'ft') and ($all_items_count &gt; 0) and ($full_text_count = 0)">
            <li>Filter by <strong>All Items</strong></li>
          </xsl:if>
          <li>Remove some filters</li>
        </ul>

      </div>

    </div>
  </xsl:template>

  <xsl:template name="build-collections-toolbar">
    <div class="collections-action-container">
      <button id="action-select-all" role="checkbox" class="checkbox-label" tabindex="0" aria-label="Select all on page"><div class="checkbox"><svg version="1.1" class="icon"><use xlink:href="#checkbox-empty"></use></svg></div><span style="margin-left: .5rem"> Select all on page</span></button>

      <div>
        <label class="offscreen" for="collection-chooser">Choose a collection</label>
        <select size="1" id="collection-chooser">
          <option value="0" selected="selected">Select Collection</option>
          <option value="__NEW__">[CREATE NEW COLLECTION]</option>
          <xsl:for-each select="SelectCollectionWidget/Coll">
            <xsl:element name="option">
              <xsl:attribute name="value">
                <xsl:value-of select="collid"/>
              </xsl:attribute>
              <xsl:value-of select="CollName"/>
            </xsl:element>
          </xsl:for-each>
        </select>
        <button class="button btn btn-primary" id="addits">Add Selected</button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-nav-pagination">

    <nav class="pagination-container" aria-label="Pagination">
      <div class="page-back-link">
        <xsl:if test="//Paging/PrevPage/Href">
          <a class="page-back-link" href="{//Paging/PrevPage/Href}">
            <span style="margin-right: 4px"><i class="icomoon icomoon-arrow-left" aria-hidden="true"></i> Previous page</span>
          </a>
        </xsl:if>
      </div>
      <!-- <ul>
        <xsl:for-each select="//Paging/MiddlePageLinks/PageURL|//Paging/PageLinks/PageURL">
          <li>
            <xsl:choose>
              <xsl:when test="Content/CurrentPage">
                <span>
                  <strong><span class="offscreen">Results page (current) </span><xsl:value-of select="Content/CurrentPage" /></strong>
                </span>
              </xsl:when>
              <xsl:otherwise>
                <a href="{Href}"><span class="offscreen">Results page </span><xsl:value-of select="Content" /></a>
              </xsl:otherwise>
            </xsl:choose>
          </li>
        </xsl:for-each>
      </ul> -->
      <ul>
        <xsl:if test="//Paging/PageLinks/PageURL">
          <xsl:apply-templates select="//Paging/PageLinks/PageURL" />
        </xsl:if>
        <xsl:if test="//Paging/StartPageLinks/PageURL and //Paging/MiddlePageLinks = 'None' and count(//Paging/StartPageLinks/PageURL) &gt; 1">
          <xsl:apply-templates select="//Paging/StartPageLinks/PageURL" />
        </xsl:if>
        <xsl:if test="//Paging/MiddlePageLinks/PageURL">
          <xsl:apply-templates select="//Paging/MiddlePageLinks/PageURL" />
        </xsl:if>
        <xsl:if test="(//Paging/StartPageLinks = 'None' or count(//Paging/StartPageLinks) = 1) and //Paging/MiddlePageLinks = 'None' and //Paging/EndPageLinks/PageURL">
          <xsl:apply-templates select="//Paging/EndPageLinks/PageURL" />
        </xsl:if>
      </ul>
      <div class="page-advance-link">
        <xsl:if test="//Paging/NextPage/Href">
          <a class="page-advance-link" href="{//Paging/NextPage/Href}">
            <span style="margin-right: 4px">Next page <i class="icomoon icomoon-arrow-right" aria-hidden="true"></i></span>
          </a>
        </xsl:if>
      </div>
    </nav>

  </xsl:template>

  <xsl:template match="PageURL">
    <li>
      <xsl:choose>
        <xsl:when test="Content/CurrentPage">
          <span>
            <strong><span class="offscreen">Results page (current) </span><xsl:value-of select="Content/CurrentPage" /></strong>
          </span>
        </xsl:when>
        <xsl:otherwise>
          <a href="{Href}"><span class="offscreen">Results page </span><xsl:value-of select="Content" /></a>
        </xsl:otherwise>
      </xsl:choose>
    </li>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:for-each select="//SearchResults//Item">
      <article class="record">
        <div class="cover" data-hdl="{ItemID}">
          <img class="bookCover" aria-hidden="true" alt="" src="/cgi/imgsrv/cover?id={ItemID}" />
        </div>
        <div class="record-container record-medium-container">
          <div class="record-title-and-actions-container">
            <h3 class="record-title">
              <xsl:value-of select="Title" />
              <xsl:if test="normalize-space(VolEnumCron)">
                <xsl:text> </xsl:text>
                <xsl:value-of select="VolEnumCron" />
              </xsl:if>
            </h3>
            <dl>
              <dt>Published</dt>
              <dd><xsl:value-of select="UseDate" /></dd>
              <xsl:if test="normalize-space(Author)">
                <dt>Author</dt>
                <dd><xsl:value-of select="Author" /></dd>
              </xsl:if>
            </dl>
          </div>
          <div class="resource-access-container">
            <ul>
              <li>
                <a href="http://catalog.hathitrust.org/Record/{record}">
                  <xsl:attribute name="data-clickdata">
                    <xsl:value-of select="ItemClickData"/>
                  </xsl:attribute>
                  <xsl:attribute name="data-clicktype">catalog</xsl:attribute>
                  <i class="icomoon icomoon-info-circle" aria-hidden="true"></i>
                  <xsl:text> Catalog Record</xsl:text>
                </a>
              </li>
              <li>
                <a href="https://babel.hathitrust.org/cgi/pt?id={ItemID}">
                  <xsl:attribute name="data-clickdata">
                    <xsl:value-of select="ItemClickData"/>
                  </xsl:attribute>
                  <xsl:attribute name="data-clicktype">pt</xsl:attribute>
                  <xsl:choose>
                    <xsl:when test="fulltext=1">
                      <i class="icomoon icomoon-document-2" aria-hidden="true"></i><xsl:text> Full View</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                      <i class="icomoon icomoon-locked" aria-hidden="true"></i><xsl:text> Limited (search-only)</xsl:text>
                      <xsl:if test="rights = '8'">
                        <br />
                        <xsl:text>This is item is no longer available</xsl:text>
                      </xsl:if>
                    </xsl:otherwise>
                  </xsl:choose>
                </a>
              </li>
            </ul>
          </div>
        </div>
        <div class="record-action" style="order: -1">
          <div class="add-to-list-checkbox-container">
            <button role="checkbox" class="checkbox-label" tabindex="0" data-barcode="{ItemID}" aria-label="Add item to a collection"><div class="checkbox"><svg version="1.1" class="icon"><use xlink:href="#checkbox-empty"></use></svg></div><span class="offscreen">Add item to a collection</span></button>
          </div>
        </div>
      </article>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="build-sidebar-container">
    <!-- facetValue|//Facets/SelectedFacets/daterange|//Facets/SelectedFacets/multiselect/multiselectClause -->
    <xsl:variable name="current" select="//Facets/SelectedFacets[multiselect/multiselectClause|facetValue|daterange]" />
    <xsl:variable name="q" select="normalize-space(//QueryString)" />

    <div class="sidebar-container" id="sidebar">
      <xsl:call-template name="build-collection-panels" />
      <xsl:if test="(normalize-space($q) and $q != '*') or count($current) > 0">
        <h2 class="active-filters-heading">Current Filters</h2>
        <ul class="active-filters-list">
          <xsl:choose>
            <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced = 'true'">
              <xsl:call-template name="build-advanced-search-query-summary" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="build-search-query-summary" />
            </xsl:otherwise>
          </xsl:choose>
          <xsl:for-each select="$current/multiselect/multiselectClause">
            <li class="active-filter-item">
              <button class="active-filter-button" data-href="/cgi/{unselectURL}">
                <span class="flex-space-between flex-center">
                  <span class="active-filter-button-text">
                    <xsl:value-of select="fieldName" />
                    <xsl:text>: </xsl:text>
                    <xsl:value-of select="facetValue" />
                  </span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>
                  <span class="offpage">Remove</span>
                </span>
              </button>
            </li>
          </xsl:for-each>
          <xsl:for-each select="$current/daterange">
            <li class="active-filter-item">
              <button class="active-filter-button" data-href="/cgi/{unselectURL}">
                <span class="flex-space-between flex-center">
                  <span class="active-filter-button-text"><xsl:value-of select="facetString" /></span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>
                  <span class="offpage">Remove</span>
                </span>
              </button>
            </li>
          </xsl:for-each>
          <xsl:for-each select="$current/facetValue">
            <li class="active-filter-item">
              <button class="active-filter-button" data-href="/cgi/{unselectURL}">
                <span class="flex-space-between flex-center">
                  <span class="active-filter-button-text"><xsl:value-of select="fieldName" />: <xsl:value-of select="@name" /></span>
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>
                  <span class="offpage">Remove</span>
                </span>
              </button>
            </li>
          </xsl:for-each>

          <xsl:if test="$gIsAdvanced = 'true'">
            <li class="filter-action">
              <button class="button-link-light clear-all-filters" data-href="{//ModifyAdvancedSearchURL}">
                <span>Revise this advanced search</span>
              </button>
            </li>
          </xsl:if>
          <li class="filter-action">
            <button class="button-link-light clear-all-filters">
              <xsl:attribute name="data-href">
                <xsl:text>/cgi/ls</xsl:text>
                <xsl:text>?a=srchls;q1=*</xsl:text>
                <xsl:if test="$coll_id">
                  <xsl:text>;c=</xsl:text>
                  <xsl:value-of select="$coll_id" />
                </xsl:if>
              </xsl:attribute>
              <span>Clear filters</span>
            </button>
          </li>

        </ul>
      </xsl:if>

      <h2 class="filters-heading">Filter your search</h2>
      <ul class="filter-group-list">
        <xsl:if test="//AllItemsCount > 0">
        <li>
          <ul class="filter-list" role="radiogroup" aria-label="Item Viewability">
            <li class="filter-group filter-group-checkbox">
              <xsl:call-template name="filter-view-option">
                <xsl:with-param name="name">All Items</xsl:with-param>
                <xsl:with-param name="display" select="//AllItemsCountDisplay" />
                <xsl:with-param name="count" select="//AllItemsCount" />
                <xsl:with-param name="checked" select="//LimitToFullText/LimitType != 'ft'" />
                <xsl:with-param name="href" select="//AllHref" />
                <xsl:with-param name="label" select="'view-all'" />
              </xsl:call-template>
            </li>
            <li class="filter-group filter-group-checkbox">
              <xsl:call-template name="filter-view-option">
                <xsl:with-param name="name">Full View</xsl:with-param>
                <xsl:with-param name="display" select="//FullTextCountDisplay" />
                <xsl:with-param name="count" select="//FullTextCount" />
                <xsl:with-param name="checked" select="//LimitToFullText/LimitType = 'ft'" />
                <xsl:with-param name="href" select="//FullTextHref" />
                <xsl:with-param name="label" select="'view-full-view'" />
              </xsl:call-template>
            </li>
          </ul>
        </li>
        </xsl:if>

        <xsl:for-each select="//Facets/unselectedFacets/facetField[.//facetValue]">
          <xsl:variable name="filter" select="." />
          <xsl:variable name="index" select="position()" />
          <xsl:variable name="total" select="count($filter/facetValue)" />
          <li class="filter-group filter-group-multiselect">
            <button class="filter-group-toggle-show-button" aria-expanded="true">
              <span class="flex-space-between flex-center">
                <h3 class="filter-group-heading"><xsl:value-of select="$filter/@name" /></h3>
                <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-expanded"></use></svg>
              </span>
            </button>
            <div class="filter-list-container">
              <ul class="filter-list">
                <xsl:for-each select="$filter/facetValue">
                  <xsl:variable name="label" select="normalize-space(@name)" />
                  <xsl:variable name="count" select="facetCount" />

                  <li class="filter-item">
                    <button class="filter-button" data-href="/cgi/{url}">
                      <xsl:attribute name="aria-label">
                        <xsl:value-of select="$label" />
                        <xsl:text> - </xsl:text>
                        <xsl:value-of select="$count" />
                      </xsl:attribute>
                      <span class="flex-space-between flex-center">
                        <span class="filter-value"><xsl:value-of select="$label" /></span>
                        <span class="filter-count"><xsl:value-of select="$count" /></span>
                      </span>
                    </button>
                  </li>
                </xsl:for-each>
                <xsl:if test="$total &gt; 6">
                  <li class="filter-action">
                    <button class="button-link-light show-all-button" aria-expanded="false">
                      <span class="show-all-button__text">Show all <xsl:value-of select="$total" /><xsl:text> </xsl:text><xsl:value-of select="$filter/@name" /> Filters</span>
                      <span class="show-fewer-button__text">Show fewer <xsl:value-of select="$filter/@name" /> Filters</span>
                    </button>
                  </li>
                </xsl:if>
              </ul>
            </div>
          </li>
        </xsl:for-each>


      </ul>
    </div>
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
        <xsl:if test="$checked = 'true'">
          <xsl:attribute name="tabindex">0</xsl:attribute>
        </xsl:if>
        <xsl:attribute name="data-href"><xsl:value-of select="$href" /></xsl:attribute>
      </xsl:if>
      <span class="offscreen" id="{$label}">View</span>
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
      <span class="flex-space-between flex-center">
        <span class="filter-name"><xsl:value-of select="$name" /><xsl:text> </xsl:text></span>
        <xsl:if test="$count > 0">
          <span class="filter-count"><xsl:value-of select="$display" /></span>
        </xsl:if>
      </span>
    </button>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:choose>
      <xsl:when test="$gIsCollSearch = 'TRUE'">
        <xsl:text>Collections: </xsl:text>
        <xsl:value-of select="//OperationResults/CollName" />
      </xsl:when>
      <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced='true'">
        <xsl:text>Full-text Advanced </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text>Full-text </xsl:text>
      </xsl:otherwise>
    </xsl:choose>
    <xsl:text>Search Results</xsl:text>
  </xsl:template>

  <xsl:template name="header-search-q1-value">
    <!-- from skeleton.xsl global gets current cgi q1 param-->
    <xsl:choose>
      <xsl:when test="$gCollSearch">
        <!-- Don't show query in global search box if its a search within collection tbw-->
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$gQ1"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-search-query-summary">
    <xsl:if test="//QueryString != '*'">
      <li class="active-filter-item">
        <button class="active-filter-button">
          <xsl:attribute name="data-href">
            <xsl:text>/cgi/ls?a=srchls;q1=*</xsl:text>
            <xsl:if test="$coll_id">
              <xsl:text>;c=</xsl:text>
              <xsl:value-of select="$coll_id" />
            </xsl:if>
            <xsl:text>;lmt=</xsl:text>
            <xsl:value-of select="//LimitToFullText/LimitType" />
            <xsl:if test="//Param[@name='facet']">
              <xsl:for-each select="//Param[@name='facet']">
                <xsl:text>;facet=</xsl:text>
                <xsl:value-of select="." />
              </xsl:for-each>
            </xsl:if>
          </xsl:attribute>
          <span class="flex-space-between flex-center">
            <span class="active-filter-button-text">Full-Text + All Fields: <xsl:value-of select="//QueryString" /></span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>
            <span class="offpage">Remove</span>
          </span>
        </button>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-advanced-search-query-summary">
    <xsl:variable name="SingleQuery">
      <xsl:if test="count(/MBooksTop/AdvancedSearch/group/Clause) = 1">
        <xsl:text>true</xsl:text>
      </xsl:if>
    </xsl:variable>
    <xsl:variable name="SingleGroup">
      <xsl:if test="count(/MBooksTop/AdvancedSearch/group) = 1">
        <xsl:text>true</xsl:text>
      </xsl:if>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="$SingleGroup='true'">
        <xsl:for-each select="/MBooksTop/AdvancedSearch/group">
          <xsl:call-template name="build-advance-search-group-summary"/>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <xsl:for-each select="/MBooksTop/AdvancedSearch/group[1]">
          <!-- <div class="advancedGroup"> -->
            <xsl:call-template name="build-advance-search-group-summary"/>
          <!-- </div> -->
        </xsl:for-each>
        <!-- <div class="op3">
          <xsl:value-of select="/MBooksTop/AdvancedSearch/OP3"/>
        </div> -->
        <!-- <li style="margin: 0 1rem; padding: 0; padding-bottom: .5rem;">
          <xsl:value-of select="/MBooksTop/AdvancedSearch/OP3" />
        </li> -->
        <xsl:for-each select="/MBooksTop/AdvancedSearch/group[2]">
          <!-- <div class="advancedGroup"> -->
            <xsl:call-template name="build-advance-search-group-summary"/>
          <!-- </div> -->
        </xsl:for-each>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-advance-search-group-summary">
    <xsl:for-each select="Clause">
      <li class="active-filter-item">
        <button class="active-filter-button" data-href="{unselectURL}">
          <span class="flex-space-between flex-center">
            <span class="active-filter-button-text">
              <xsl:value-of select="Field" />
              <xsl:text>: </xsl:text>
              <xsl:value-of select="Query" />
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 14 14" version="1.1" class="icon"><use xlink:href="#action-remove"></use></svg>
            <span class="offpage">Remove</span>
          </span>
        </button>
      </li>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="header-search-ft-value">
    <xsl:if test="//LimitToFullText/LimitType = 'ft'">checked</xsl:if>
  </xsl:template>

  <xsl:template name="build-mondo-collection-header">
    <div class="collection-container">
      <div class="collection-header">
        <h2 style="margin-top: 0"><xsl:value-of select="//COLL_INFO/COLL_NAME" /></h2>
        <p><xsl:value-of select="//COLL_INFO/COLL_DESC" /></p>
      </div>
      <xsl:call-template name="build-mondo-collection-status-update" />
      <xsl:call-template name="build-mondo-collection-search-form" />
    </div>
  </xsl:template>

  <xsl:template name="build-mondo-collection-search-form">
    <form method="GET" action="/cgi/ls" class="container container-boxed" style="padding: 1rem">
      <div style="display: flex; flex-direction: row">
        <div style="flex-grow: 1">
          <div style="display: flex">
            <div class="control control-q1" style="display: flex; align-items: center">
              <label for="mondo-q1-input" style="white-space: nowrap; margin-right: 0.5rem">Search in this collection </label>
              <input id="mondo-q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items" required="required" pattern="^(?!\s*$).+">
                <xsl:attribute name="value">
                  <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
                </xsl:attribute>
              </input>
            </div>
          </div>
          <div class="global-search-options" style="align-items: baseline; margin-top: .5rem; margin-bottom: 0">
            <a>
              <xsl:attribute name="href">
                <xsl:text>/cgi/ls?a=page;page=advanced;c=</xsl:text>
                <xsl:value-of select="$coll_id"/>
                <xsl:text>;q1=</xsl:text>
                <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
                <xsl:for-each select="//CurrentCgi/Param[@name='facet']">
                  <xsl:text>;facet=</xsl:text>
                  <xsl:value-of select="." />
                </xsl:for-each>
              </xsl:attribute>
              Advanced full-text search in this collection
            </a>
            <div class="mondo-search-ft">
              <input id="collection-lmt" type="checkbox" value="ft" name="lmt">
                <xsl:if test="//CurrentCgi/Param[@name='lmt'] = 'ft'">
                  <xsl:attribute name="checked">checked</xsl:attribute>
                </xsl:if>
              </input>
              <label for="collection-lmt">Full view only</label>
            </div>
          </div>
        </div>
        <div style="flex-grow: 0">
          <div class="control">
            <button type="submit" class="button btn">Find</button>
          </div>
        </div>
      </div>

      <!-- <input type="hidden" value="srchls" name="a"/> -->
      <input type="hidden" value="srchls" name="a"/>
      <input type="hidden">
        <xsl:attribute name="name">
          <xsl:text>c</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="value">
          <xsl:value-of select="$coll_id"/>
        </xsl:attribute>
      </input>
      <xsl:for-each select="//CurrentCgi/Param[@name='facet']">
        <input type="hidden" name="facet" value="{.}" />
      </xsl:for-each>

    </form>
  </xsl:template>

  <xsl:template name="build-mondo-collection-status-update">
    <xsl:if test="//AllItemsIndexed != 'TRUE'">
      <xsl:variable name="num_in_collection" select="//NumItemsInCollection"/>
      <xsl:variable name="num_not_indexed" select="//NumNotIndexed"/>
      <xsl:variable name="num_deleted" select="//NumDeleted"/>
      <xsl:variable name="num_queued" select="$num_not_indexed - $num_deleted"/>

      <xsl:variable name="num_not_indexed_verb">
        <xsl:choose>
          <xsl:when test="$num_not_indexed > 1">
            <xsl:text> items are </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text> item is </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <xsl:variable name="num_queued_verb">
        <xsl:choose>
          <xsl:when test="$num_queued > 1">
            <xsl:text> items are </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text> item is </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>

      <xsl:variable name="num_deleted_verb">
        <xsl:choose>
          <xsl:when test="$num_deleted > 1">
            <xsl:text> items have been</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text> item has been</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:variable>
      <div class="alert alert-warning">
        <xsl:text>Of </xsl:text><xsl:value-of select="$num_in_collection"/><xsl:text> items in this collection, </xsl:text>
        <xsl:value-of select="$num_not_indexed"/><xsl:value-of select="$num_not_indexed_verb"/><xsl:text>not available for searching. </xsl:text>

        <xsl:if test="$num_deleted > 0">
          <xsl:value-of select="$num_deleted"/><xsl:value-of select="$num_deleted_verb"/><xsl:text> deleted from the repository. </xsl:text>
        </xsl:if>

        <xsl:if test="$num_queued > 0">
          <xsl:value-of select="$num_queued"/><xsl:value-of select="$num_queued_verb"/>
          <xsl:text> queued to be indexed, usually within 1-5 days.</xsl:text>
        </xsl:if>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-collection-panels">
    <xsl:if test="$gIsCollSearch = 'TRUE'">
      <xsl:call-template name="build-collection-branding" />
      <xsl:call-template name="share-this-collection" />
      <xsl:call-template name="download-metadata-form" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-collection-branding">
    <xsl:if test="//COLL_INFO/COLL_BRANDING">
      <p class="collection-branding">
        <img src="{//COLL_INFO/COLL_BRANDING}" style="max-width: 100%" aria-hide="true" alt="" />
      </p>
    </xsl:if>
  </xsl:template>

  <xsl:template name="share-this-collection">
    <div class="shareLinks panel">

      <h3>Share</h3>

      <div class="btn-group share-toolbar social-links">
        <button data-service="facebook" data-title="{$gCollName}" class="btn"><i class="icomoon icomoon-facebook2"></i><span class="offscreen"> Share via Facebook</span></button>
        <button data-service="twitter" data-title="{$gCollName}" class="btn"><i class="icomoon icomoon-twitter2"></i><span class="offscreen"> Share via Twitter</span></button>
        <button data-service="reddit" data-title="{$gCollName}" class="btn"><i class="icomoon icomoon-reddit"></i><span class="offscreen"> Share via reddit</span></button>
        <button data-service="tumblr" data-title="{$gCollName}" data-media="" class="btn"><i class="icomoon icomoon-tumblr"></i><span class="offscreen"> Share via Tumblr</span></button>
        <button data-service="vkontakte" data-title="{$gCollName}" class="btn"><i class="icomoon icomoon-vk"></i><span class="offscreen"> Share via VK</span></button>
      </div>

      <br />

      <form action="" name="urlForm" id="urlForm">
        <label class="smaller" for="permURL">Link to this collection</label>
        <xsl:element name="input">
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">permURL_link</xsl:attribute>
          <xsl:attribute name="id">permURL</xsl:attribute>
          <xsl:attribute name="class">email-permURL</xsl:attribute>
          <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
          <xsl:attribute name="readonly">readonly</xsl:attribute>
          <xsl:attribute name="value">
            <xsl:text>https://babel.hathitrust.org/cgi/mb?a=listis&amp;c=</xsl:text>
            <xsl:value-of select="$gCollSearch" />
          </xsl:attribute>
        </xsl:element>
      </form>
    </div>
  </xsl:template>

  <xsl:template name="download-metadata-form">
    <div class="downloadLinks panel" style="padding-bottom: 1rem; margin-bottom: 0; border-bottom: 8px double #ddd">
      <h3>Download Metadata</h3>
      <xsl:choose>
        <xsl:when test="//TotalRecords = 0">
          <p>
            <em>No records to download</em>
          </p>
        </xsl:when>
        <xsl:when test="$gIsAdvanced = 'true'">
          <p>
            <em>Download of advanced search results is not supported at this time.</em>
          </p>
        </xsl:when>
        <xsl:when test="count(//Facets/SelectedFacets/facetValue) > 0 or //Param[@name='q1'] != '*'">
          <p>
            <em>Download of search results is not supported at this time.</em>
          </p>
        </xsl:when>
        <xsl:otherwise>

          <form class="form-download-metadata" method="POST" action="/cgi/mb">
            <input type="hidden" name="c" value="{//Param[@name='c']}" />
            <input type="hidden" name="a" value="download" />
            <xsl:choose>
              <xsl:when test="//Param[@name='q1']">
                <input type="hidden" name="q1" value="{//Param[@name='q1']}" />
              </xsl:when>
              <xsl:otherwise>
              </xsl:otherwise>
            </xsl:choose>
            <xsl:if test="//Param[@name='lmt']">
              <input type="hidden" name="lmt" value="{//Param[@name='lmt']}" />
            </xsl:if>

            <fieldset>
              <legend class="offscreen">Format</legend>
              <div class="control">
                <input type="radio" name="format" id="format-text" value="text" checked="checked" />
                <label for="format-text">Tab-Delimited Text (TSV)</label>
              </div>
              <div class="control" style="margin-top: -0.25rem">
                <input type="radio" name="format" id="format-json" value="json" />
                <label for="format-json">Linked Data (JSON)</label>
              </div>
            </fieldset>

            <p>
              <button class="btn button">Download</button>
            </p>

            <!-- <p class="smaller">
              <strong>Linked Data (JSON)</strong> includes both collection and item metadata.
            </p> -->

            <xsl:choose>
              <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='lmt']='ft'">
                <p class="smaller"><em>Metadata will be limited to full view items.</em></p>
              </xsl:when>
              <xsl:otherwise/>
            </xsl:choose>

            <xsl:choose>
              <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='a']='listsrch'">
                <p><em>Metadata will be limited to these search results.</em></p>
              </xsl:when>
              <xsl:otherwise/>
            </xsl:choose>

            <p class="smaller">
              <a href="#" class="download-help-link"><i class="icomoon icomoon-help" aria-hidden="true"></i> Help about Downloading Metadata</a>
            </p>

            <div data-role="progress" class="spinner-download-metadata"><div class="typing_loader"></div></div>
          </form>

        </xsl:otherwise>
      </xsl:choose>
    </div>

  </xsl:template>

  <xsl:template name="check-processing-errors">
    <xsl:choose>
      <xsl:when test="$gIsAdvanced = 'TRUE'">
        <xsl:for-each select="//AdvancedSearch/group/Clause">
          <xsl:call-template name="build-processing-error-alerts">
            <xsl:with-param name="WellFormed" select="WellFormed" />
            <xsl:with-param name="UnBalancedQuotes" select="UnBalancedQuotes" />
            <xsl:with-param name="ProcessedQuery" select="ProcessedQuery" />
          </xsl:call-template>
        </xsl:for-each>
      </xsl:when>
      <xsl:otherwise>
        <xsl:for-each select="//SearchResults">
          <xsl:call-template name="build-processing-error-alerts">
            <xsl:with-param name="WellFormed" select="WellFormed" />
            <xsl:with-param name="UnBalancedQuotes" select="UnBalancedQuotes" />
            <xsl:with-param name="ProcessedQuery" select="ProcessedQueryString" />
          </xsl:call-template>
        </xsl:for-each>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-processing-error-alerts">
    <xsl:param name="WellFormed" />
    <xsl:param name="UnBalancedQuotes" />
    <xsl:param name="ProcessedQuery" />
    <xsl:if test="$WellFormed != 1">
      <xsl:call-template name="build-well-formed-alert">
        <xsl:with-param name="ProcessedQuery" select="$ProcessedQuery" />
      </xsl:call-template>
    </xsl:if>
    <xsl:if test="$UnBalancedQuotes = 1">
      <xsl:call-template name="build-unbalanced-quote-alert">
        <xsl:with-param name="ProcessedQuery" select="$ProcessedQuery" />
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-well-formed-alert">
    <xsl:param name="ProcessedQuery" />
    <div class="alert alert-block">
      <p>One of the operators: <strong>AND</strong>, <strong>OR</strong>, <strong>)</strong>, or <strong>(</strong> was missing or placed incorrectly in your query. Your query was changed and submitted as: <em>all of these words: </em><strong><xsl:value-of select="$ProcessedQuery" /></strong></p>
    </div>
  </xsl:template>

  <xsl:template name="build-unbalanced-quote-alert">
    <xsl:param name="ProcessedQuery" />
    <div class="alert alert-block">
      <p>Your query contained ambiguous quotes. Your query was changed and submitted as: <strong><xsl:value-of select="$ProcessedQuery" /></strong></p>
    </div>
  </xsl:template>

</xsl:stylesheet>
