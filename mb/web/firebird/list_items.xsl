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

  <xsl:variable name="gIsCollSearch">
    <xsl:choose>
      <xsl:when test="//SearchResults/Item">TRUE</xsl:when>
      <xsl:otherwise>FALSE</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="g_current_sort_param"
    select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']" />
  <!-- need to separate sort and dir from sort param i.e. title_d = sort=title dir=d -->
  <xsl:variable name="g_current_sort" select="substring-before($g_current_sort_param,'_')" />
  <xsl:variable name="g_current_sort_dir" select="substring-after($g_current_sort_param,'_')" />

  <xsl:variable name="coll_name">
    <xsl:value-of select="/MBooksTop/CollectionName" />
  </xsl:variable>

  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']" />

  <xsl:variable name="gIsOwnedByUser">
    <xsl:choose>
      <xsl:when test="//EditCollectionWidget/OwnedByUser = 'yes'">TRUE</xsl:when>
      <xsl:otherwise>FALSE</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gIsTemporaryCollection">
    <xsl:choose>
      <xsl:when test="//EditCollectionWidget/Temporary = '1'">TRUE</xsl:when>
      <xsl:otherwise>FALSE</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-anlaytics-dimension">
      <xsl:text>dimension2=</xsl:text>
      <xsl:text>:</xsl:text>
      <xsl:value-of
        select="//MBooksGlobals/CurrentCgi/Param[@name='c']" />
      <xsl:text>:</xsl:text>
    </xsl:attribute>
    <xsl:attribute name="data-c"><xsl:value-of select="$coll_id" /></xsl:attribute>
    <xsl:attribute name="data-collname">
      <xsl:value-of select="//EditCollectionWidget/CollName" />
    </xsl:attribute>
    <xsl:attribute name="data-shared">
      <xsl:choose>
        <xsl:when test="//EditCollectionWidget/Status = 'private'">0</xsl:when>
        <xsl:otherwise>1</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-contributor-name">
      <xsl:value-of select="//EditCollectionWidget/ContributorName" />
    </xsl:attribute>
    <xsl:attribute name="data-desc">
      <xsl:value-of select="//EditCollectionWidget/CollDesc" />
    </xsl:attribute>
    <xsl:attribute name="data-analytics-report-url"><xsl:value-of select="//AnalyticsReportUrl" /></xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header">
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" class="visually-hidden-focusable" role="complementary"
      aria-label="Skip links">
      <ul>
        <li>
          <a href="#skipto">Skip to collection items</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="main">
    <xsl:choose>
      <xsl:when test="SearchResults/Item">
        <xsl:call-template name="build-results-container">
          <xsl:with-param name="title" select="'results from this collection'" />
          <xsl:with-param name="items" select="SearchResults/Item" />
          <xsl:with-param name="item-list-contents" select="'items'" />
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="ItemList/Item">
        <xsl:call-template name="build-results-container">
          <xsl:with-param name="title">items in this collection</xsl:with-param>
          <xsl:with-param name="item-list-contents">items</xsl:with-param>
          <xsl:with-param name="items" select="ItemList/Item" />
        </xsl:call-template>
      </xsl:when>
      <xsl:when test="SearchResults[CollEmpty='FALSE']">
        <xsl:call-template name="build-no-results-container" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="build-empty-collection-container" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-sidebar-container">
    <xsl:variable name="q" select="normalize-space(//QueryString)" />

    <div class="twocol-side" id="sidebar">

      <button id="action-toggle-filters" class="btn btn-outline-primary" aria-expanded="false">
        <span>
          <span class="not-expanded">Show</span>
          <span class="is-expanded">Hide</span>
          Search Filters
        </span>
      </button>

      <div>
        <h2 class="filters-heading fs-3">Collection Tools</h2>
        <div class="accordion" id="accordion-tools">
          <xsl:call-template name="share-this-collection" />
          <xsl:call-template name="download-metadata-form" />
          <xsl:call-template name="transfer-this-collection" />
        </div>
        <xsl:call-template name="sidebar-filter" />
      </div>

    </div>
  </xsl:template>

  <xsl:template name="sidebar-filter">
    <xsl:variable name="q" select="normalize-space(//QueryString)" />
    <xsl:variable name="current"
      select="//Facets/SelectedFacets[multiselect/multiselectClause|facetValue|daterange]" />

    <h2 class="filters-heading fs-3 mt-3">Filter your search</h2>
    <xsl:if test="(normalize-space($q) and $q != '*') or count($current) > 0">
      <div class="accordion mb-3">
        <xsl:call-template name="build-accordion-item">
          <xsl:with-param name="id" select="'current'" />
          <xsl:with-param name="open" select="true()" />
          <xsl:with-param name="heading">Current Filters</xsl:with-param>
          <xsl:with-param name="body">
            <ul class="list-group list-group-flush">
              <xsl:call-template name="build-search-query-summary" />

              <xsl:for-each select="$current/multiselect/multiselectClause">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <xsl:value-of select="fieldName" />
                    <xsl:text>: </xsl:text>
                    <xsl:value-of select="facetValue" />
                  </span>
                  <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    <span class="visually-hidden">Remove</span>
                  </a>
                </li>
              </xsl:for-each>

              <xsl:for-each select="$current/facetValue">
                <li class="list-group-item d-flex justify-content-between align-items-center">
                  <span>
                    <xsl:value-of select="fieldName" />
                    <xsl:text>: </xsl:text>
                    <xsl:text> </xsl:text>
                    <xsl:value-of select="@name" />
                  </span>
                  <a href="/cgi/{unselectURL}" class="btn btn-outline-dark btn-lg">
                    <i class="fa-solid fa-xmark" aria-hidden="true"></i>
                    <span class="visually-hidden">Remove</span>
                  </a>
                </li>
              </xsl:for-each>      
            </ul>
          </xsl:with-param>
        </xsl:call-template>
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
                <xsl:if test="//LimitToFullText/Limit = 'NO'"> active</xsl:if>
              </xsl:attribute>
              <xsl:if test="//LimitToFullText/Limit = 'NO'">
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
                <xsl:if test="//LimitToFullText/Limit = 'YES'"> active</xsl:if>
              </xsl:attribute>
              <xsl:if test="//LimitToFullText/Limit = 'YES'">
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
  </xsl:template>

  <xsl:template name="build-search-query-summary">
    <xsl:if test="//QueryString != '*'">
      <li class="list-group-item d-flex justify-content-between align-items-center">
        <span>
          <xsl:text>Full-Text + All Fields: </xsl:text>
          <xsl:value-of select="//QueryString" />
        </span>
      
        <a class="btn btn-outline-dark btn-lg">
          <xsl:attribute name="href">
            <xsl:text>/cgi/mb?a=listis;c=</xsl:text>
            <xsl:value-of select="$coll_id" />
            <xsl:if test="//LimitToFullText/Limit = 'YES'">
              <xsl:text>;lmt=ft</xsl:text>
            </xsl:if>
            <xsl:for-each select="//Param[@name='facet']">
              <xsl:text>;facet=</xsl:text>
              <xsl:value-of select="." />
            </xsl:for-each>
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

  <xsl:template name="build-filter-view-option">
    <xsl:param name="name" />
    <xsl:param name="count" />
    <xsl:param name="display" />
    <xsl:param name="checked" />
    <xsl:param name="href" />
    <xsl:param name="label" />

    <div class="d-flex flex-nowrap align-items-center justify-content-between gap-3 flex-grow-1">
      <a href="{$href}" class="d-flex align-items-center gap-1">
        <xsl:choose>
          <xsl:when test="$checked = 'true'">
            <i class="fa-regular fa-circle-dot" aria-hidden="true"></i>
          </xsl:when>
          <xsl:otherwise>
            <i class="fa-regular fa-circle" aria-hidden="true"></i>
          </xsl:otherwise>
        </xsl:choose>
        <span><xsl:value-of select="$name" /></span>
      </a>
      <xsl:if test="$count > 0">
        <span class="filter-count">
          <xsl:value-of select="$display" />
        </span>
      </xsl:if>      
    </div>
  </xsl:template>

  <xsl:template name="sidebar-about-this-collection">
    <xsl:if test="$gIsOwnedByUser = 'TRUE'">
      <div class="panel">
        <h3>About this Collection</h3>
        <dl class="metadata" style="margin-bottom: .5rem">
          <dt>Owner</dt>
          <dd>
            <xsl:value-of select="//CollectionOwner" />
          </dd>
          <dt>Status</dt>
          <dd class="status">
            <xsl:value-of select="//EditCollectionWidget/Status" />
          </dd>
        </dl>
        <xsl:if test="$gIsOwnedByUser = 'TRUE'">
          <xsl:call-template name="collection-edit-metadata" />
        </xsl:if>
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="collection-edit-metadata">
    <xsl:variable name="shrd">
      <xsl:choose>
        <xsl:when test="EditCollectionWidget/Status = 'private'">0</xsl:when>
        <xsl:otherwise>1</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <p>
      <a
        href="#" id="trigger-editc"
        class="btn btn-small"
        data-desc="{normalize-space(EditCollectionWidget/CollDesc)}"
        data-contributor="{normalize-space(EditCollectionWidget/ContributorName)}"
        data-cn="{$coll_name}"
        data-c="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']}"
        data-shrd="{$shrd}"
        >Edit <span class="offscreen">Collection Metadata</span></a>
    </p>
  </xsl:template>

  <xsl:template name="build-collection-edit-action">
    <xsl:variable name="shrd">
      <xsl:choose>
        <xsl:when test="//EditCollectionWidget/Status = 'private'">0</xsl:when>
        <xsl:otherwise>1</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:if test="$gIsOwnedByUser = 'TRUE'">
      <div style="display: flex; align-items: center; position: absolute; right: 0; top: 50%; transform: translateY(-50%); gap: 0.5rem;">
        <button
          class="btn btn-sm"
          id="action-edit-collection"
          data-desc="{normalize-space(EditCollectionWidget/CollDesc)}"
          data-cn="{$coll_name}"
          data-c="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']}"
          data-contributor_name="{normalize-space(EditCollectionWidget/ContributorName)}"
          data-shrd="{$shrd}"
          >Edit</button>
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
                <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']" />
              </xsl:attribute>
              <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
            </input>
          </form>
        </div>
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="transfer-this-collection">
    <xsl:variable name="transfer-link" select="//EditCollectionWidget/TransferLink" />
    <xsl:if test="$gIsOwnedByUser = 'TRUE' and normalize-space($transfer-link)">
      <xsl:call-template name="build-accordion-item">
        <xsl:with-param name="id">transfer</xsl:with-param>
        <xsl:with-param name="parent">accordion-tools</xsl:with-param>
        <xsl:with-param name="heading">Transfer Collection</xsl:with-param>
        <xsl:with-param name="body">
          <p>Generate a link to transfer this collection to another user.</p>

          <form action="{$transfer-link}">
            <input type="hidden" name="c"
              value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']}" />
            <xsl:choose>
              <xsl:when test="//EditCollectionWidget/QueuedForTransfer='yes'">
                <div class="alert alert-info" style="padding-right: 0">
                  <p style="margin-bottom: 0">This collection is scheduled for transfer.</p>
                </div>

                <div style="display: flex; gap: 0.25rem;">
                  <button class="btn">View/Cancel Transfer</button>
                  <!-- <button class="btn-mini">Cancel Transfer</button> -->
                </div>
              </xsl:when>
              <xsl:otherwise>
                <button class="btn btn-outline-dark">Transfer</button>
              </xsl:otherwise>
            </xsl:choose>
          </form>

          <p class="fs-7 mt-1">
            <a href="https://hathitrust.atlassian.net/servicedesk/customer/kb/view/2387214348" class="transfer-help-link">
              <i class="fa-regular fa-circle-question fa-fw" aria-hidden="true"></i> 
              <xsl:text>Help about Transferring Collections</xsl:text>
            </a>
          </p>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>
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
          <xsl:otherwise>
            <iframe name="form-sink" style="display: none"></iframe>
            <form data-action="download-metadata" class="form-download-metadata" method="POST" action="{//DownloadMetadataAction}" target="form-sink">
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
                <a href="#" class="download-help-link">
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

  <xsl:template name="build-results-container">
    <xsl:param name="title" />
    <xsl:param name="items" />
    <xsl:param name="item-list-contents" />

    <xsl:call-template name="build-mondo-collection-header" />

    <xsl:call-template name="build-collections-toolbar" />

    <xsl:call-template name="build-results-list">
      <xsl:with-param name="items" select="$items" />
    </xsl:call-template>

    <xsl:call-template name="build-nav-pagination" />

  </xsl:template>

  <xsl:template name="build-operation-status-summary">
    <xsl:variable name="action">
      <xsl:call-template name="get-action"/>
    </xsl:variable>
    <xsl:if test="$action='copyit' or $action='movit' or $action='copyitnc' or $action='movitnc' or $action='delit'">
      <div class="alert alert-success alert-operation mt-1">
        <xsl:call-template name="OperationResults" />
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="get-action">
    <xsl:variable name="delAction">
      <xsl:value-of select="/MBooksTop/OperationResults/DeleteItemsInfo/DelActionType"/>
    </xsl:variable>
    <xsl:variable name="CopyMoveAction">
      <xsl:value-of select="/MBooksTop/OperationResults/CopyActionType"/>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test="starts-with($CopyMoveAction, 'movit')">movit</xsl:when>
      <xsl:when test="starts-with($CopyMoveAction, 'copyit')">copyit</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$delAction"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:param name="items" />
    <xsl:for-each select="$items">
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
          <xsl:value-of select="Title" />
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
                <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="Date" /></dd>
              </div>
              <xsl:if test="normalize-space(Author)">
                <div class="grid">
                  <dt class="g-col-lg-4 g-col-12">Author</dt>
                  <dd class="g-col-lg-8 g-col-12"><xsl:value-of select="Author" /></dd>
                </div>
              </xsl:if>
            </dl>
          </div>
          <div class="resource-access-container">
            <xsl:variable name="key" select="Key" />
            <xsl:variable name="config" select="$gItemLinkConfig//h:option[@key=$key]" />
            <div class="list-group list-group-horizontal-sm align-items-center">
              <a class="list-group-item list-group-item-action w-sm-50" href="https://catalog.hathitrust.org/Record/{record}">
                <i class="fa-solid fa-circle-info" aria-hidden="true"></i> 
                <span>Catalog Record</span><i aria-hidden="true" class="visited-link fa-solid fa-check-double"></i>
              </a>
              <a class="list-group-item list-group-item-action {$config/@class} w-sm-50" href="/cgi/pt?id={ItemID}">
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
  </xsl:template>

  <xsl:template name="build-no-results-container">
    <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>

    <xsl:call-template name="build-mondo-collection-header" />
    <xsl:call-template name="build-operation-status-summary" />

    <div>
      <div class="alert alert-info alert-block">
       <strong>No results</strong> match your search.
      </div>

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

  <xsl:template name="build-empty-collection-container">
    <xsl:call-template name="build-mondo-collection-header" />
    <xsl:call-template name="build-operation-status-summary" />

    <div>
      <div class="alert alert-info alert-block">
        This collection is empty.
      </div>

      <h2 class="fs-3">Suggestions</h2>
      <ul>
        <li>
          <xsl:text>Copy or move items from </xsl:text>
          <a href="{/MBooksTop/Header/PubCollLink}">a public collection</a>
          <xsl:if test="//LoggedIn='YES'">
            <xsl:text> or </xsl:text>
            <a href="{MBooksTop/Header/PrivCollLink}">another of your collections</a>
          </xsl:if>
        </li>
        <li>
          <a href="https://www.hathitrust.org/">Search HathiTrust</a>
          <xsl:text> for new items</xsl:text>
        </li>
      </ul>
    </div>

  </xsl:template>

  <xsl:template name="build-collections-toolbar">
    <xsl:variable name="target">
      <xsl:choose>
        <xsl:when test="//SearchResults/Item">mb.listsrch</xsl:when>
        <xsl:otherwise>mb.listis</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <hathi-results-toolbar
      data-prop-first-record-number="{//FirstRecordNumber}"
      data-prop-last-record-number="{//LastRecordNumber}"
      data-prop-total-records="{//TotalRecords}"
      data-prop-target="{$target}"
      data-prop-current-sort-option="{//SortWidgetSort/Option[Focus='true']/Value}"
      ></hathi-results-toolbar>
    
    <hathi-collections-toolbar
      data-prop-editable="{$gIsOwnedByUser = 'TRUE'}"
      data-prop-user-is-anonymous="{//LoggedIn = 'NO'}"
      data-prop-collid="{$coll_id}"
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

    <xsl:call-template name="build-operation-status-summary" />

  </xsl:template>


  <xsl:template name="build-item-selected-owner-actions">
    <button class="button btn" id="movit">Move</button>
    <hr role="separator" aria-orientation="vertical" />
    <button class="button btn" id="delit">Remove</button>
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

  <xsl:template name="build-mondo-collection-header">

  <xsl:if test="$gIsTemporaryCollection = 'TRUE'">
      <div class="alert alert-block alert-danger mb-3 mt-3">
        <strong>This collection is temporary.</strong>
        Log in to make this collection permanent.
      </div>
    </xsl:if>

    <div class="card mb-3 shadow">
      <div class="row g-0 p-3">
        <xsl:if test="normalize-space(//CollectionBranding)">
          <div class="col-md-2 d-flex flex-direction-column align-items-center justify-content-center">
            <img src="{//CollectionBranding}" class="img-fluid rounded" style="height: auto" aria-hidden="true" alt="" />
          </div>
        </xsl:if>
        <div>
          <xsl:attribute name="class">
            <xsl:choose>
              <xsl:when test="normalize-space(//CollectionBranding)">col-md-10</xsl:when>
              <xsl:otherwise>col-md-12</xsl:otherwise>
            </xsl:choose>      
          </xsl:attribute>
          <div class="card-body">
            <div class="card-title d-flex align-items-start justify-content-between gap-2">
              <h1 id="skipto" class="card-title d-flex align-items-center gap-2">
                <xsl:choose>
                  <xsl:when test="$gIsTemporaryCollection = 'TRUE'">
                    <i class="fa-solid fa-circle-exclamation" aria-hidden="true"></i>
                  </xsl:when>
                  <xsl:when test="//EditCollectionWidget/Status = 'private'">
                    <i class="fa-solid fa-lock" aria-hidden="true"></i>
                  </xsl:when>
                  <xsl:otherwise />
                </xsl:choose>
                <xsl:value-of select="//EditCollectionWidget/CollName" />
              </h1>
              <div class="d-flex align-items-center justify-content-end gap-1">
                <xsl:if test="$gIsOwnedByUser = 'TRUE'">
                  <xsl:if test="$gIsTemporaryCollection = 'TRUE'">
                    <span class="badge text-bg-danger text-uppercase">Temporary</span>
                  </xsl:if>
                  <xsl:if test="$gIsTemporaryCollection = 'FALSE' and //EditCollectionWidget/Status = 'private'">
                    <span class="badge bg-secondary">Private</span>
                  </xsl:if>
                  <button class="btn btn-outline-dark btn-sm" data-action="edit-metadata">
                    <xsl:text>Edit</xsl:text>
                    <span class="visually-hidden"> Collection Metadata</span>
                  </button>
                </xsl:if>
              </div>
            </div>
            <xsl:if test="normalize-space(//EditCollectionWidget/CollDesc)">
              <p class="card-text mt-0 mb-1"><xsl:value-of select="//EditCollectionWidget/CollDesc" /></p>
            </xsl:if>
            <xsl:if test="normalize-space(//EditCollectionWidget/ContributorName)">
              <p class="card-text mt-0 mb-1">
                <strong>Contributor: </strong><xsl:value-of select="//EditCollectionWidget/ContributorName" />
              </p>
            </xsl:if>
            <xsl:if test="normalize-space(//CollectionContactInfo)">
              <p class="card-text mt-0 mb-1">
                <strong>More Information: </strong>
                <xsl:choose>
                  <xsl:when test="normalize-space(//CollectionContactLink)">
                    <a href="{//CollectionContactLink}">
                      <xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" />
                    </a>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" />
                  </xsl:otherwise>
                </xsl:choose>
              </p>
            </xsl:if>
          </div>
        </div>
      </div>
      <xsl:if test="/MBooksTop/SearchWidget/NumItemsInCollection > 0">
        <xsl:call-template name="build-mondo-collection-search-form" />
      </xsl:if>
    </div>

    <xsl:call-template name="build-mondo-collection-status-update" />
  </xsl:template>

  <xsl:template name="build-collection-branding">
    <xsl:if test="normalize-space(//CollectionBranding)">
      <p class="collection-branding not-mobile" style="margin-bottom: 1rem">
        <img src="{//CollectionBranding}" style="max-width: 100%; min-width: 100px; min-height: 100px" aria-hidden="true" alt="" />
      </p>
    </xsl:if>
  </xsl:template>
  
  <xsl:template name="build-mondo-collection-search-form">
    <form method="GET" action="/cgi/mb">
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
          <div class="search-help p-3 pt-1 fs-7 fst-italic">
            <i class="fa-solid fa-circle-info fa-fw" aria-hidden="true"></i>
            Search within this collection.
          </div>
        </div>
      </div>

      <xsl:variable name="search-params-tmpl">
        <h:select>
          <h:option name="c" />
          <h:option name="pn" />
          <h:option name="sort" />
          <h:option name="dir" />
          <h:option name="sz" />
          <h:option name="debug" />
          <h:option name="skin" />
        </h:select>
      </xsl:variable>
      <xsl:variable name="search-params" select="exsl:node-set($search-params-tmpl)" />

      <xsl:variable name="CurrentCgi" select="//CurrentCgi" />
      <xsl:for-each select="$search-params//h:option">
        <xsl:variable name="name" select="@name" />
        <xsl:if test="normalize-space($CurrentCgi/Param[@name=$name])">
          <input type="hidden" name="{$name}" value="{$CurrentCgi/Param[@name=$name]}" />
        </xsl:if>
      </xsl:for-each>

      <xsl:for-each select="//CurrentCgi/Param[@name='facet']">
        <input type="hidden" name="facet" value="{.}" />
      </xsl:for-each>

      <input type="hidden" name="lmt" value="ft" />
      <input type="hidden" name="a" value="srch"/>
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
      <div class="alert alert-warning my-3">
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

  <xsl:template name="get-page-title">
    <xsl:text>Collections: </xsl:text><xsl:value-of select="$coll_name" />
    <xsl:if test="//SearchResults"><xsl:text> Search Results</xsl:text></xsl:if>
  </xsl:template>

  <xsl:template name="btn-metadata-download">
    <button class="btn btn-mini">
      <xsl:attribute name="data-toggle">tracking</xsl:attribute>
      <xsl:attribute name="data-tracking-action">MB Download Metadata</xsl:attribute>
      <xsl:attribute name="data-tracking-label">
        <xsl:value-of select="//EditCollectionWidget/CollName" />
        <xsl:text>: </xsl:text>
        <xsl:value-of select="//EditCollectionWidget/CollId" />
      </xsl:attribute>
      <i class="icomoon icomoon-download"></i>
      <xsl:text> Download Metadata</xsl:text>
    </button>
  </xsl:template>

  <!-- OPERATION STATUS -->
  <xsl:template name="OperationResults">

    <xsl:variable name="already_count">
      <xsl:value-of select="OperationResults/AlreadyInColl2Count"/>
    </xsl:variable>

    <xsl:variable name="added_count">
      <xsl:value-of select="OperationResults/IdsAdded"/>
    </xsl:variable>

    <xsl:variable name="DelValidCount">
      <xsl:value-of select="OperationResults/DeleteItemsInfo/DelValidCount"/>
    </xsl:variable>

    <xsl:if test="$added_count &gt; 0">
      <xsl:call-template name="CopiedOrMoved">
        <xsl:with-param name="added_count">
          <xsl:value-of select="$added_count"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>

    <xsl:if test="$already_count &gt; 0">
      <xsl:value-of select="$already_count"/>
      <xsl:choose>
        <xsl:when test="$already_count &gt; 1">
          <xsl:text> items </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:text> already in </xsl:text>
      <xsl:copy-of select="$to_coll_url"/>
    </xsl:if>

    <xsl:if test="$DelValidCount &gt; 0 and $action='delit'">
      <xsl:call-template name="Deleted">
        <xsl:with-param name="DelValidCount">
          <xsl:value-of select="$DelValidCount"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>

  </xsl:template>

  <xsl:template name="CopiedOrMoved">
    <xsl:param name="added_count"/>

    <xsl:variable name="ToCollName">
      <xsl:value-of select="OperationResults/ToCollName"/>
    </xsl:variable>

    <xsl:variable name="CollName">
      <xsl:value-of select="OperationResults/CollName"/>
    </xsl:variable>

    <xsl:variable name="ActionName">
      <xsl:choose>
        <xsl:when test="$action = 'movit'">
    moved</xsl:when>
        <xsl:when test="$action = 'delit'">deleted</xsl:when>
        <xsl:when test="$ToCollName = $CollName">restored</xsl:when>
        <xsl:otherwise>copied</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <!-- move or copied text starts here -->

    <xsl:value-of select="$added_count"/>
    <xsl:choose>
      <xsl:when test="$added_count &gt; 1">
        <xsl:text> items were </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> item was </xsl:text>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:value-of select="$ActionName"/>
    <xsl:choose>
      <xsl:when test="$ActionName = 'restored'">
        <xsl:text> to collection </xsl:text>
        <span class="colName">
        <xsl:value-of select="$coll_name"/>
        </span>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> from </xsl:text>
        <span class="colName">
          <xsl:value-of select="$coll_name"/>
        </span>
        <xsl:text> to </xsl:text>
        <xsl:copy-of select="$to_coll_url"/>
      </xsl:otherwise>
    </xsl:choose>

  </xsl:template>

  <xsl:template name="Deleted">
    <xsl:param name="DelValidCount"/>

    <div class="d-flex align-items-center justify-content-between">
      <span>
        <xsl:value-of select="$DelValidCount"/>
        <xsl:choose>
          <xsl:when test="$DelValidCount &gt; 1">
            <xsl:text> items were </xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text> item was </xsl:text>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:text>deleted from collection: </xsl:text>
        <span class="colName">
          <xsl:value-of select="OperationResults/DeleteItemsInfo/DeleteFromCollName"/>
        </span>
      </span>
      <a class="btn btn-light" href="{OperationResults/DeleteItemsInfo/UndoDelHref}">
        <xsl:text>Undo</xsl:text>
        <span class="visually-hidden">
          <xsl:text> Delete</xsl:text>
        </span>
      </a>
    </div>
  </xsl:template>

  <xsl:template match="*" mode="copy-guts">
    <xsl:apply-templates select="*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="a" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*" mode="copy" />
      <xsl:attribute name="class">tracked</xsl:attribute>
      <xsl:apply-templates select="*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
