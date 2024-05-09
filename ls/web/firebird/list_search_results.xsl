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
  xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS dc h"
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
  <xsl:variable name="inst_code">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionCode"/>
  </xsl:variable>
  <xsl:variable name="inst_name">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionName"/>
  </xsl:variable>
  <xsl:variable name="limitByInst">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='heldby']">
      <xsl:text>TRUE</xsl:text>
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

  <xsl:variable name="gSkin" select="//Param[@name='skin']" />

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
    <xsl:attribute name="data-analytics-report-url"><xsl:value-of select="//AnalyticsReportUrl" /></xsl:attribute>
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
    <div id="skiplinks" role="complementary" class="visually-hidden-focusable" aria-label="Skip links">
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
      </xsl:when>
      <xsl:when test="SearchResults/A_RESULTS/SolrError[normalize-space(.)]">
        <xsl:call-template name="SolrError"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="build-noresults-container"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-results-container">

    <xsl:choose>
      <xsl:when test="$gCollSearch">
        <xsl:call-template name="build-mondo-collection-header" />
      </xsl:when>
      <xsl:otherwise>
        <h1>Search Results</h1>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:call-template name="check-processing-errors" />

    <xsl:call-template name="build-collections-toolbar" />

    <xsl:call-template name="build-results-list" />

    <xsl:call-template name="build-nav-pagination" />

      <!-- <script type="text/javascript">
        head.js("/ls/alicorn/js/ls_clicklog.js");
      </script> -->
  </xsl:template>

  <xsl:template name="build-noresults-container">
    <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>

    <xsl:choose>
      <xsl:when test="$gCollSearch">
        <xsl:call-template name="build-mondo-collection-header" />
      </xsl:when>
      <xsl:otherwise>
        <h1>Search Results</h1>
      </xsl:otherwise>
    </xsl:choose>

    <div>
      <xsl:call-template name="check-processing-errors" />

      <div class="alert alert-info alert-block">
        <strong>No results</strong> match your search.
      </div>

      <xsl:if test="false() and /MBooksTop/AdvancedSearch/isAdvanced = 'true'">
        <xsl:call-template name="build-noresults-advanced-search-summary" />
      </xsl:if>

      <h2 class="fs-3">Suggestions</h2>
      <ul>
        <li>Revise your search term</li>
        <xsl:if test="($limitType = 'ft') and ($all_items_count &gt; 0) and ($full_text_count = 0)">
          <li>Filter by <strong>All Items</strong></li>
        </xsl:if>
        <li>Remove some filters</li>
      </ul>

    </div>
  </xsl:template>

  <xsl:template name="build-collections-toolbar">
    <xsl:variable name="target">ls</xsl:variable>
    <hathi-results-toolbar
      data-prop-first-record-number="{//FirstRecordNumber}"
      data-prop-last-record-number="{//LastRecordNumber}"
      data-prop-total-records="{//TotalCount}"
      data-prop-target="{$target}"
      data-prop-current-sort-option="{//SortWidgetSort/Option[Focus='true']/Value}"
      ></hathi-results-toolbar>
    
    <hathi-collections-toolbar
      data-prop-editable="{false()}"
      data-prop-user-is-anonymous="{//LoggedIn = 'NO'}"
    >
        <select data-use="collections" class="d-none" aria-hidden="true">
          <xsl:for-each select="SelectCollectionWidget/Coll">
            <xsl:element name="option">
              <xsl:attribute name="value">
                <xsl:value-of select="collid"/>
              </xsl:attribute>
              <xsl:value-of select="CollName"/>
            </xsl:element>
          </xsl:for-each>
        </select>
    </hathi-collections-toolbar>
  </xsl:template>

  <xsl:template name="build-nav-pagination">
    <xsl:if test="count(//PageURL) > 1">
      <hathi-results-pagination
        data-prop-next-href="{//Paging/NextPage/Href}"
        data-prop-prev-href="{//Paging/PrevPage/Href}"
        data-prop-max-pages="{//Paging/TotalPages}"
        data-prop-param="pn"
        >
          <xsl:attribute name="data-prop-value">
            <xsl:choose>
              <xsl:when test="//Paging//CurrentPage">
                <xsl:value-of select="//Paging//CurrentPage" />
              </xsl:when>
              <xsl:otherwise>1</xsl:otherwise>
            </xsl:choose>
          </xsl:attribute>
        </hathi-results-pagination>
    </xsl:if>
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
	  <div class="results-container">
	    <xsl:attribute name="data-gdata">
		<xsl:value-of select="/MBooksTop/SearchResults/G_CLICK_DATA" />
	    </xsl:attribute>
	    <xsl:attribute name="data-logger-url">
	        <xsl:value-of select="/MBooksTop/SearchResults/LoggerURL" />
	    </xsl:attribute>
    <xsl:for-each select="//SearchResults//Item">
      <xsl:if test="position() mod 25 = 0">
        <div class="visually-hidden-focusable rounded m-3 border border-4 d-flex gap-4 align-items-center justify-content-center">
          <ul class="list-group list-group-horizontal w-100 p-3">
            <li class="list-group-item flex-fill text-center bg-transparent border-0">
              <a class="btn btn-outline-dark w-100" href="#top">Back to Top</a>
            </li>
            <li class="list-group-item flex-fill text-center bg-transparent border-0">
              <a class="btn btn-outline-dark w-100" href="#pagination">Jump to Pagination</a>
            </li>
          </ul>
        </div>
      </xsl:if>

      <article class="record d-flex gap-3 p-3 mb-3 mt-3 shadow-sm">
        <xsl:variable name="title">
          <xsl:value-of select="Title" disable-output-escaping="yes" />
          <xsl:if test="normalize-space(VernacularTitle)">
            <xsl:text> </xsl:text>
            <xsl:value-of select="VernacularTitle" disable-output-escaping="yes"/>
          </xsl:if>
          <xsl:if test="normalize-space(VolEnumCron)">
            <xsl:text> </xsl:text>
            <xsl:value-of select="VolEnumCron" />
          </xsl:if>
        </xsl:variable>
        <div class="cover d-none d-md-block" data-hdl="{ItemID}">
          <img loading="lazy" class="bookCover border p-1 flex-grow-0 flex-shrink-0" aria-hidden="true" alt="" src="/cgi/imgsrv/cover?id={ItemID};width=250" />
        </div>
        <div class="flex-grow-1 d-flex flex-column justify-content-between">
          <div class="container-fluid p-1">
            <h3 class="record-title">
              <xsl:value-of select="$title" />
            </h3>
            <dl class="metadata">
              <div class="grid">
                <dt class="g-col-lg-4 g-col-12">Published</dt>
                <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="UseDate" /></dd>
              </div>
              <xsl:if test="normalize-space(Author)">
                <div class="grid">
                  <dt class="g-col-lg-4 g-col-12">Author</dt>
                  <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="Author" /></dd>
                </div>
              </xsl:if>
            </dl>
          </div>
          <div class="resource-access-container" data-key="{Key}">
            <xsl:variable name="key" select="Key" />
            <xsl:variable name="config" select="$gItemLinkConfig//h:option[@key=$key]" />
            <div class="list-group list-group-horizontal-sm align-items-center">
              <a class="list-group-item list-group-item-action w-sm-50" href="http://catalog.hathitrust.org/Record/{record}">
		<xsl:attribute name="data-clickdata">
                    <xsl:value-of select="ItemClickData"/>
		    </xsl:attribute>
                  <xsl:attribute name="data-clicktype">catalog</xsl:attribute>
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i> 
                <span>Catalog Record</span>
                <span class="visually-hidden"> for <xsl:value-of select="$title" /></span>
                <i aria-hidden="true" class="visited-link fa-solid fa-check-double"></i>
              </a>
              <a class="list-group-item list-group-item-action {$config/@class} w-sm-50" href="/cgi/pt?id={ItemID}">
		<xsl:attribute name="data-clickdata">
                    <xsl:value-of select="ItemClickData"/>
                  </xsl:attribute>
                  <xsl:attribute name="data-clicktype">pt</xsl:attribute>
                <xsl:if test="fulltext=1 and normalize-space(activated_role)">
                  <xsl:attribute name="data-activated-role">
                    <xsl:value-of select="activated_role" />
                  </xsl:attribute>
                </xsl:if>
                <xsl:choose>
                  <xsl:when test="emergency=1">
                    <i class="icomoon icomoon-document-2" aria-hidden="true"></i><xsl:text> Temporary Access</xsl:text>
                  </xsl:when>
                  <xsl:when test="fulltext=1 and normalize-space(activated_role)">
                    <i class="icomoon icomoon-unlocked" aria-hidden="true"></i>
                      <xsl:text> Limited (Access Permitted)</xsl:text>
                  </xsl:when>
                  <xsl:when test="fulltext=1">
                    <i class="fa-regular fa-file-lines" aria-hidden="true"></i>
                    <span>Full View</span>
                  </xsl:when>
                  <xsl:otherwise>
                    <i aria-hidden="true" class="fa-solid fa-unlock"></i>
                    <span>Limited (search-only)</span>
                  </xsl:otherwise>
                </xsl:choose>
                <span class="visually-hidden"> for <xsl:value-of select="$title" /></span>
                <i aria-hidden="true" class="visited-link fa-solid fa-check-double"></i>
              </a>
              <xsl:if test="rights = '8'">
                <br />
                <xsl:text>This is item is no longer available</xsl:text>
              </xsl:if>
            </div>
          </div>
        </div>
        <div class="record-action form-check" style="order: -1">
          <input class="form-check-input" type="checkbox" id="select-{position()}" name="extern_item_id"
            value="{ItemID}" aria-label="Add item &quot;{$title}&quot; to a collection" />
        </div>
      </article>
    </xsl:for-each>
	 <script type="text/javascript">
	  let clicklog_script = document.createElement('script');
	  clicklog_script.src = "/ls/firebird/js/ls_clicklog.js"
	  document.head.append(clicklog_script);
         </script>
    </div>
  </xsl:template>

  <xsl:template name="build-sidebar-container">
    <!-- facetValue|//Facets/SelectedFacets/daterange|//Facets/SelectedFacets/multiselect/multiselectClause -->
    <xsl:variable name="current" select="//Facets/SelectedFacets[multiselect/multiselectClause|facetValue|daterange]" />
    <xsl:variable name="q" select="normalize-space(//QueryString)" />

    <div class="twocol-side" id="sidebar" tabindex="0">

      <button id="action-toggle-filters" class="btn btn-outline-primary" aria-expanded="false">
        <span>
          <span class="not-expanded">Show</span>
          <span class="is-expanded">Hide</span>
          Search Filters
        </span>
      </button>

      <xsl:call-template name="build-collection-panels" />

      <h2 class="filters-heading fs-3 mt-3">Filter your search</h2>

      <xsl:if test="(normalize-space($q) and $q != '*') or count($current) > 0">
        <div class="accordion mb-1">
          <xsl:call-template name="build-accordion-item">
            <xsl:with-param name="id" select="'current'" />
            <xsl:with-param name="open" select="true()" />
            <xsl:with-param name="heading">Current Filters</xsl:with-param>
            <xsl:with-param name="body">
              <ul class="list-group list-group-flush">
                <xsl:choose>
                  <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced = 'true'">
                    <xsl:call-template name="build-advanced-search-query-summary" />
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:call-template name="build-search-query-summary" />
                  </xsl:otherwise>
                </xsl:choose>
                <xsl:if test="$limitByInst = 'TRUE'">
                  <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
                    <xsl:variable name="clauseSummary">
                      <span>
                        <xsl:text>Held by: </xsl:text>
                        <xsl:value-of select="$inst_name" />
                      </span>
                    </xsl:variable>
                    <xsl:value-of select="$clauseSummary" />
                    <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                      <span class="visually-hidden">Remove filter
                        <xsl:value-of select="$clauseSummary" />
                      </span>
                    </a>
                  </li>
                </xsl:if>

                <xsl:for-each select="$current/multiselect/multiselectClause">
                  <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
                    <xsl:variable name="clauseSummary">
                      <span>
                        <xsl:value-of select="fieldName" />
                        <xsl:text>: </xsl:text>
                        <xsl:value-of select="facetValue" />
                      </span>
                    </xsl:variable>
                    <xsl:value-of select="$clauseSummary" />
                    <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                      <span class="visually-hidden">Remove filter
                        <xsl:value-of select="$clauseSummary" />
                      </span>
                    </a>
                  </li>
                </xsl:for-each>

                <xsl:for-each select="$current/daterange">
                  <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
                    <span><xsl:value-of select="facetString" /></span>
                    <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                      <span class="visually-hidden">Remove filter
                        <span>
                          <xsl:value-of select="facetString" />
                        </span>
                      </span>
                    </a>
                  </li>
                </xsl:for-each>

                <xsl:for-each select="$current/facetValue">
                  <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
                    <xsl:variable name="clauseSummary">
                      <span>
                        <xsl:value-of select="fieldName" />
                        <xsl:text>: </xsl:text>
                        <xsl:value-of select="@name" />
                      </span>
                    </xsl:variable>
                    <xsl:value-of select="$clauseSummary" />
                    <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                      <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                      <span class="visually-hidden">Remove filter
                        <xsl:value-of select="$clauseSummary" />
                      </span>
                    </a>
                  </li>
                </xsl:for-each>      
              </ul>
            </xsl:with-param>
          </xsl:call-template>
        </div>

        <div class="d-flex flex-column gap-2 mb-3">
          <xsl:if test="$gIsAdvanced = 'true'">
            <a class="btn btn-outline-dark btn-sm clear-all-filters" href="{//ModifyAdvancedSearchURL}">
              <span>Revise this advanced search</span>
            </a>
          </xsl:if>
          <a class="btn btn-outline-dark btn-sm clear-all-filters">
            <xsl:attribute name="href">
              <xsl:text>/cgi/ls</xsl:text>
              <xsl:text>?a=srchls;q1=*</xsl:text>
              <xsl:if test="$coll_id">
                <xsl:text>;c=</xsl:text>
                <xsl:value-of select="$coll_id" />
              </xsl:if>
              <xsl:if test="$gSkin">
                <xsl:text>;skin=</xsl:text>
                <xsl:value-of select="$gSkin" />
              </xsl:if>
            </xsl:attribute>
            <span>Clear filters</span>
          </a>
        </div>


      </xsl:if>

      <div class="accordion mb-3">
        <xsl:call-template name="build-accordion-item">
          <xsl:with-param name="id" select="'viewability'" />
          <xsl:with-param name="open" select="true()" />
          <xsl:with-param name="heading">Item Viewability</xsl:with-param>
          <xsl:with-param name="body">
            <div class="list-group list-group-flush">
              <a href="{//AllHref}">
                <xsl:attribute name="class">
                  <xsl:text>list-group-item d-flex justify-content-between align-items-center</xsl:text>
                  <xsl:if test="//LimitToFullText/LimitType != 'ft'"> active</xsl:if>
                </xsl:attribute>
                <xsl:if test="//LimitToFullText/LimitType != 'ft'">
                  <xsl:attribute name="aria-current">true</xsl:attribute>
                </xsl:if>
                <xsl:text>All Items</xsl:text>
                <span class="badge bg-dark rounded-pill">
                  <xsl:value-of select="//AllItemsCountDisplay" />
                </span>
              </a>
              <a href="{//FullTextHref}">
                <xsl:attribute name="class">
                  <xsl:text>list-group-item d-flex justify-content-between align-items-center</xsl:text>
                  <xsl:if test="//LimitToFullText/LimitType = 'ft'"> active</xsl:if>
                </xsl:attribute>
                <xsl:if test="//LimitToFullText/LimitType = 'ft'">
                  <xsl:attribute name="aria-current">true</xsl:attribute>
                </xsl:if>
                <xsl:text>Full View</xsl:text>
                <span class="badge bg-dark rounded-pill">
                  <xsl:value-of select="//FullTextCountDisplay" />
                </span>
              </a>
            </div>
          </xsl:with-param>
        </xsl:call-template>
      </div>

      <div class="accordion" id="accordion-filters">
        <xsl:for-each select="//Facets/unselectedFacets/facetField[.//facetValue]">
          <xsl:variable name="filter" select="." />
          <xsl:variable name="index" select="position()" />
          <xsl:variable name="total" select="count($filter/facetValue)" />
          <xsl:call-template name="build-accordion-item">
            <xsl:with-param name="id" select="position()" />
            <xsl:with-param name="parent">accordion-filters</xsl:with-param>
            <xsl:with-param name="heading" select="$filter/@name" />
            <xsl:with-param name="body">
              <div class="filter-list" data-expanded="false">
                <xsl:for-each select="$filter/facetValue">
                  <xsl:variable name="label" select="normalize-space(@name)" />
                  <xsl:variable name="count" select="facetCount" />
                  <div class="filter-list-item d-flex flex-nowrap align-items-center justify-content-between gap-3 mb-2 px-3">
                    <a href="/cgi/{url}">
                      <xsl:value-of select="$label" />
                    </a>
                    <span>
                      <xsl:value-of select="$count" />
                    </span>
                  </div>
                </xsl:for-each>
              </div>
              <xsl:if test="$total &gt; 10">
                <div class="mt-3">
                  <button type="button" class="btn btn-sm btn-outline-dark" data-action="expand-filter" aria-expanded="false">
                    <span>
                      Show 
                      <span class="not-expanded">
                        <xsl:text> all </xsl:text>
                        <xsl:value-of select="$total" />
                        <xsl:text> </xsl:text>
                      </span>
                      <span class="is-expanded"> fewer </span>
                      <xsl:value-of select="$filter/@name" />
                      <xsl:text> Filters</xsl:text>
                    </span>
                  </button>
                </div>
              </xsl:if>
            </xsl:with-param>
          </xsl:call-template>
        </xsl:for-each>
      </div>
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
      <!-- <span class="offscreen" id="{$label}">View</span> -->
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
      <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
        <span class="d-inline-flex align-items-center gap-2">
          <xsl:text>Full Text &amp; All Fields: </xsl:text>
          <span class="query-term"><xsl:value-of select="//QueryString" /></span>
        </span>
      
        <a class="btn btn-outline-dark btn-lg">
          <xsl:attribute name="href">
            <xsl:text>/cgi/ls?a=srchls;q1=*</xsl:text>
            <xsl:value-of select="$coll_id" />
            <xsl:text>;lmt=</xsl:text>
            <xsl:value-of select="//LimitToFullText/LimitType" />
            <xsl:for-each select="//Param[@name='facet']">
              <xsl:text>;facet=</xsl:text>
              <xsl:value-of select="." />
            </xsl:for-each>
            <xsl:if test="//Param[@name='skin']">
              <xsl:text>;skin=</xsl:text>
              <xsl:value-of select="//Param[@name='skin']" />
            </xsl:if>
          </xsl:attribute>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="visually-hidden">Remove filter
            <span>
              <xsl:text>Full Text &amp; All Fields: </xsl:text>
              <xsl:value-of select="//QueryString" />
            </span>
          </span>
        </a>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-advanced-search-query-summary">
    <xsl:if test="/MBooksTop/AdvancedSearch/group/Clause/Query != '*'">
      <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
        <xsl:variable name="clauseSummary">
          <span>
            <xsl:apply-templates select="/MBooksTop/AdvancedSearch/group[1]" mode="summary" />
            <xsl:if test="/MBooksTop/AdvancedSearch/group[2]/Clause">
              <xsl:text> </xsl:text>
              <xsl:value-of select="/MBooksTop/AdvancedSearch/OP3" />
              <xsl:text> </xsl:text>
              <xsl:apply-templates select="/MBooksTop/AdvancedSearch/group[2]" mode="summary" />
            </xsl:if>
          </span>
        </xsl:variable>
        <xsl:value-of select="$clauseSummary" />
        <a class="btn btn-outline-dark btn-lg">
          <xsl:attribute name="href">
            <xsl:text>/cgi/ls?a=srchls;adv=1;q1=*</xsl:text>
            <xsl:if test="//Param[@name='facet_lang']">
              <xsl:text>;facet_lang=</xsl:text>
              <xsl:value-of select="//Param[@name='facet_lang']" />
            </xsl:if>
            <xsl:if test="//Param[@name='facet_lang']">
              <xsl:text>;facet_format=</xsl:text>
              <xsl:value-of select="//Param[@name='facet_format']" />
            </xsl:if>
            <xsl:if test="//Param[@name='lmg']">
              <xsl:text>;lmt=</xsl:text>
              <xsl:value-of select="//Param[@name='lmt']" />
            </xsl:if>
          </xsl:attribute>
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="visually-hidden">Remove filter
            <xsl:value-of select="$clauseSummary" />
          </span>
        </a>
      </li>
    </xsl:if>
  </xsl:template>

  <xsl:template match="group" mode="summary">
    <xsl:for-each select="Clause">
      <xsl:if test="normalize-space(OP)">
        <xsl:text> </xsl:text>
        <xsl:value-of select="OP" />
        <xsl:text> </xsl:text>
      </xsl:if>
      <xsl:value-of select="Field" />
      <xsl:text>: </xsl:text>
      <span class="query-term"><xsl:value-of select="Query" /></span>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="build-advance-search-group-summary">
    <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
      <span>
        <xsl:for-each select="Clause">
          <xsl:if test="normalize-space(Op)">
            <xsl:text> </xsl:text>
            <xsl:value-of select="Op" />
            <xsl:text> </xsl:text>
          </xsl:if>
          <xsl:value-of select="Field" />
          <xsl:text>: </xsl:text>
          <span class="fw-bold"><xsl:value-of select="Query" /></span>
        </xsl:for-each>
      </span>
    </li>
  </xsl:template>

  <!-- UNUSED: adapt if we decide to allow users to remove individual clauses -->
  <xsl:template name="build-advance-search-group-summary-distinct">
    <xsl:for-each select="Clause">
      <li class="list-group-item d-flex justify-content-between align-items-center gap-3">
        <xsl:variable name="clauseSummary">
          <span>
            <xsl:value-of select="Field" />
            <xsl:text>: </xsl:text>
            <span class="fw-bold"><xsl:value-of select="Query" /></span>
          </span>
        </xsl:variable>
        <xsl:value-of select="$clauseSummary" />
        <a href="{unselectURL}" class="btn btn-outline-dark btn-lg">
          <i class="fa-solid fa-xmark" aria-hidden="true"></i>
          <span class="visually-hidden">Remove filter
            <xsl:value-of select="$clauseSummary" />
          </span>
        </a>
      </li>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="build-mondo-collection-header">
    <div class="card mb-3 shadow">
      <div class="row g-0 p-3">
        <xsl:if test="normalize-space(//COLL_INFO/COLL_BRANDING)">
          <div class="col-md-2 d-flex flex-direction-column align-items-center justify-content-center">
            <img src="{//COLL_INFO/COLL_BRANDING}" class="img-fluid rounded" style="height: auto" aria-hidden="true" alt="" />
          </div>
        </xsl:if>
        <div>
          <xsl:attribute name="class">
            <xsl:choose>
              <xsl:when test="normalize-space(//COLL_INFO/COLL_BRANDING)">col-md-10</xsl:when>
              <xsl:otherwise>col-md-12</xsl:otherwise>
            </xsl:choose>      
          </xsl:attribute>
          <div class="card-body">
            <div class="card-title d-flex align-items-start justify-content-between gap-2">
              <h1 id="skipto" class="card-title d-flex align-items-center gap-2">
                <xsl:choose>
                  <xsl:when test="//COLL_INFO/COLL_STATUS = 'private'">
                    <i class="fa-solid fa-lock" aria-hidden="true"></i>
                  </xsl:when>
                  <xsl:otherwise />
                </xsl:choose>
                <xsl:value-of select="//COLL_INFO/COLL_NAME" />
              </h1>
              <div class="d-flex align-items-center justify-content-end gap-1">
                <xsl:if test="//COLL_INFO/COLL_STATUS = 'private'">
                  <span class="badge bg-secondary">Private</span>
                </xsl:if>
              </div>
            </div>
            <xsl:if test="normalize-space(//COLL_INFO/COLL_DESC)">
              <p class="card-text mt-0 mb-1"><xsl:value-of select="//COLL_INFO/COLL_DESC" /></p>
            </xsl:if>
            <xsl:if test="normalize-space(//COLL_INFO/COLL_CONTRIBUTOR_NAME)">
              <p class="card-text mt-0 mb-1">
                <strong>Contributor Name: </strong><xsl:value-of select="//COLL_INFO/COLL_CONTRIBUTOR_NAME" />
              </p>
            </xsl:if>
            <xsl:if test="normalize-space(//COLL_INFO/COLL_CONTACT_INFO)">
              <p class="card-text mt-0 mb-1">
                <strong>More Information: </strong>
                <xsl:choose>
                  <xsl:when test="normalize-space(//COLL_INFO/COLL_CONTACT_LINK)">
                    <a href="{//COLL_INFO/COLL_CONTACT_LINK}">
                      <xsl:apply-templates select="//COLL_INFO/COLL_CONTACT_INFO" mode="copy-guts" />
                    </a>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:apply-templates select="//COLL_INFO/COLL_CONTACT_INFO" mode="copy-guts" />
                  </xsl:otherwise>
                </xsl:choose>
              </p>
            </xsl:if>
          </div>
        </div>
      </div>
      <xsl:call-template name="build-mondo-collection-search-form" />
    </div>

    <xsl:call-template name="build-mondo-collection-status-update" />
  </xsl:template>  

  <xsl:template name="build-collection-manage-action">
    <xsl:variable name="shrd">
      <xsl:choose>
        <xsl:when test="//COLL_INFO/COLL_STATUS = 'private'">0</xsl:when>
        <xsl:otherwise>1</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:if test="//EditCollectionWidget/OwnedByUser='yes'">
      <div style="display: flex; align-items: center; position: absolute; right: 0; top: 50%; transform: translateY(-50%)">
        <a
          class="btn btn-sm"
          href="/cgi/mb?c={$coll_id};a=listis;adm=1"
          >Manage Collection</a>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-mondo-collection-search-form">
    <form method="GET" action="/cgi/ls">
      <div class="row g-0 p-3 py-0">
        <div class="col-md-12">
          <div class="row g-3 align-items-center">
            <div class="col-auto flex-grow-1 ps-3">
              <input name="q1" type="text" 
                id="collection-search" 
                class="form-control" 
                placeholder="Search using keywords" 
                required="required"
                aria-label="Search in this collection">
                <xsl:attribute name="value">
                  <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
                </xsl:attribute>
              </input>
            </div>
            <div class="col-auto pe-3">
              <button type="submit" class="btn btn-secondary">Search</button>
            </div>
          </div>
          <div class="d-flex justify-content-between gap-3 mt-2 w-90">
            <div class="search-help p-3 pt-1 fs-7 fst-italic">
              <i class="fa-solid fa-circle-info fa-fw" aria-hidden="true"></i>
              Search within this collection.
            </div>
            <a class="fs-7 display-block px-3 pt-1">
              <xsl:attribute name="href">
                <xsl:text>/cgi/ls?a=page;page=advanced;c=</xsl:text>
                <xsl:value-of select="$coll_id"/>
                <xsl:text>;q1=</xsl:text>
                <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']"/>
                <xsl:for-each select="//CurrentCgi/Param[@name='facet']">
                  <xsl:text>;facet=</xsl:text>
                  <xsl:value-of select="." />
                </xsl:for-each>
                <xsl:if test="$gSkin">
                  <xsl:text>;skin=</xsl:text>
                  <xsl:value-of select="$gSkin" />
                </xsl:if>
              </xsl:attribute>
              Advanced search in this collection
            </a>
          </div>
        </div>
      </div>
    
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
      <xsl:if test="$gSkin">
        <input type="hidden" name="skin" value="{$gSkin}" />
      </xsl:if>
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
      <h2 class="filters-heading fs-3">Collection Tools</h2>
      <div class="accordion" id="accordion-tools">
        <xsl:call-template name="share-this-collection" />
        <xsl:call-template name="download-metadata-form" />
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="share-this-collection">
    <xsl:call-template name="build-accordion-item">
      <xsl:with-param name="id">share</xsl:with-param>
      <xsl:with-param name="parent">accordion-tools</xsl:with-param>
      <xsl:with-param name="heading">Share</xsl:with-param>
      <xsl:with-param name="body">
        <div class="">
          <form action="" name="urlForm" id="urlForm">
            <label for="permURL" class="form-label">Link to this collection</label>
            <input type="text" class="form-control" id="permURL" name="permURL_link" readonly="true">
              <xsl:attribute name="value">
                <xsl:text>https://babel.hathitrust.org/cgi/mb?a=listis&amp;c=</xsl:text>
                <xsl:value-of select="$gCollSearch" />
              </xsl:attribute>
              <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
            </input>
          </form>
        </div>
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="download-metadata-form">
    <xsl:call-template name="build-accordion-item">
      <xsl:with-param name="id">download</xsl:with-param>
      <xsl:with-param name="parent">accordion-tools</xsl:with-param>
      <xsl:with-param name="heading">Download Metadata</xsl:with-param>
      <xsl:with-param name="body">
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
            <iframe name="form-sink" style="display: none"></iframe>
            <form class="form-download-metadata" method="POST" action="/cgi/mb" target="form-sink">
              <input type="hidden" name="c" value="{//Param[@name='c']}" />
              <input type="hidden" name="a" value="download" />
              <xsl:choose>
                <xsl:when test="//Param[@name='q1']">
                  <input type="hidden" name="q1" value="{//Param[@name='q1']}" />
                </xsl:when>
                <xsl:otherwise></xsl:otherwise>
              </xsl:choose>
              <xsl:if test="//Param[@name='lmt']">
                <input type="hidden" name="lmt" value="{//Param[@name='lmt']}" />
              </xsl:if>
              <xsl:if test="//Param[@name='facet']">
                <xsl:for-each select="//Param[@name='facet']">
                  <input type="hidden" name="facet" value="{.}" />
                </xsl:for-each>
              </xsl:if>

              <input type="hidden" name="source" value="hathifiles" />

              <fieldset class="mb-3">
                <legend class="visually-hidden">Format</legend>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="format" id="format-text" value="text" checked="checked" />
                  <label class="form-check-label" for="format-text">Tab-Delimited Text (TSV)</label>
                </div>
                <div class="form-check">
                  <input class="form-check-input" type="radio" name="format" id="format-json" value="json" />
                  <label class="form-check-label" for="format-json">Linked Data (JSON)</label>
                </div>
              </fieldset>

              <p>
                <button type="submit" class="btn btn-secondary">
                  Download
                  <span
                    class="ms-2 spinner spinner-border spinner-border-sm"
                    role="status"
                    aria-hidden="true"
                  />
                  <span class="spinner visually-hidden">Loading...</span>
                </button>
              </p>
              <xsl:choose>
                <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='lmt']='ft'">
                  <p class="fs-7"><em>Metadata will be limited to full view items.</em>
                  </p>
                </xsl:when>
                <xsl:otherwise />
              </xsl:choose>

              <xsl:choose>
                <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='a']='listsrch'">
                  <p class="fs-7"><em>Metadata will be limited to these search results.</em>
                  </p>
                </xsl:when>
                <xsl:otherwise />
              </xsl:choose>

              <p class="fs-7">
                <a target="_blank" href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2688450579" class="download-help-link">
                  <i class="fa-solid fa-circle-question" aria-hidden="true"></i>
                  <span>Help about Downloading Metadata</span>
                </a>
              </p>

              <div data-role="progress" class="spinner-download-metadata">
                <div class="typing_loader"></div>
              </div>
            </form>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:with-param>
    </xsl:call-template>
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
    <div class="alert alert-warning">
      <p>One of the operators: <strong>AND</strong>, <strong>OR</strong>, <strong>)</strong>, or <strong>(</strong> was missing or placed incorrectly in your query. Your query was changed and submitted as: <em>all of these words: </em><strong><xsl:value-of select="$ProcessedQuery" /></strong></p>
    </div>
  </xsl:template>

  <xsl:template name="build-unbalanced-quote-alert">
    <xsl:param name="ProcessedQuery" />
    <div class="alert alert-warning">
      <p>Your query contained ambiguous quotes. Your query was changed and submitted as: <strong><xsl:value-of select="$ProcessedQuery" /></strong></p>
    </div>
  </xsl:template>

</xsl:stylesheet>
