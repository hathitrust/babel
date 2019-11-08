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

  <xsl:variable name="gIsCollSearch">
    <xsl:choose>
      <xsl:when test="//SearchResults/Item">TRUE</xsl:when>
      <xsl:otherwise>FALSE</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="g_current_sort_param" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']"/>
  <!-- need to separate sort and dir from sort param i.e. title_d = sort=title dir=d -->
  <xsl:variable name="g_current_sort" select="substring-before($g_current_sort_param,'_')"/>
  <xsl:variable name="g_current_sort_dir" select="substring-after($g_current_sort_param,'_')"/>

  <xsl:variable name="coll_name">
    <xsl:value-of select="/MBooksTop/CollectionName"/>
  </xsl:variable>

  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']" />

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-anlaytics-dimension">
      <xsl:text>dimension2=</xsl:text>
      <xsl:text>:</xsl:text>
      <xsl:value-of select="//MBooksGlobals/CurrentCgi/Param[@name='c']" />
      <xsl:text>:</xsl:text>
    </xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <script type="text/javascript">
      <xsl:value-of select="//CollectionsOwnedJs" />
      <xsl:value-of select="//CollectionSizesJs" />
    </script>
    <style type="text/css">
      html.debugpolite div[role="status"] {

        position: fixed !important;
        top: 10px;
        right: 10px;
        clip: unset;
        width: 50vw;
        height: 1.5rem;
        border: 1px solid green;
        background: white;
        color: black;
        text-align: right;

      }
    </style>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#section">Skip to collection items</a>
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
        <xsl:call-template name="build-no-results-container"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="build-empty-collection-container"/>
      </xsl:otherwise>
    </xsl:choose>
    <script>
      <xsl:text disable-output-escaping="yes">
        head.ready(function() {
          var $alert = $(".alert-operation");
          if ( $alert.length ) {
            HT.update_status($alert.text());
          }
        })
      </xsl:text>
    </script>
  </xsl:template>

  <xsl:template name="build-sidebar-container">
    <xsl:variable name="q" select="normalize-space(//QueryString)" />

    <div class="sidebar-container" id="sidebar">
      <button class="for-mobile sidebar-toggle-button filter-group-toggle-show-button" aria-expanded="false">
        <span class="flex-space-between flex-center">
          <h3 class="filter-group-heading">Options/Filters<span class="total-filter-count"></span></h3>
          <!-- <svg xmlns="http://www.w3.org/2000/svg" class="icon"><use xlink:href="#panel-collapsed"></use></svg> -->
          <i class="icomoon icomoon-sidebar-toggle" aria-hidden="true"></i>
        </span>
      </button>

      <xsl:call-template name="list-surveys" />
      <xsl:call-template name="build-collection-branding" />
      <xsl:call-template name="sidebar-filter" />
      <!-- <xsl:call-template name="sidebar-about-this-collection" /> -->
      <xsl:call-template name="share-this-collection" />
      <xsl:call-template name="download-metadata-form" />
    </div>
  </xsl:template>

  <xsl:template name="sidebar-filter">
    <xsl:variable name="q" select="normalize-space(//QueryString)" />

    <div class="panelx" style="width: 95%; margin: 0 auto 1rem">
      <xsl:if test="(normalize-space($q) and $q != '*')">
        <h2 class="active-filters-heading">Current Filters</h2>
        <ul class="active-filters-list">
          <xsl:call-template name="build-search-query-summary" />
        </ul>
      </xsl:if>
      <h2 class="filters-heading">Filter items</h2>
      <ul class="filter-group-list">
        <xsl:if test="//AllItemsCount > 0">
        <li>
          <ul class="filter-list" role="radiogroup" aria-label="Item Viewability">
            <li class="filter-group filter-group-checkbox">
              <xsl:call-template name="filter-view-option">
                <xsl:with-param name="name">All Items</xsl:with-param>
                <xsl:with-param name="display" select="//AllItemsCountDisplay" />
                <xsl:with-param name="count" select="//AllItemsCount" />
                <xsl:with-param name="checked" select="//LimitToFullText/Limit = 'NO'" />
                <xsl:with-param name="href" select="//AllHref" />
                <xsl:with-param name="label" select="'view-all'" />
              </xsl:call-template>
            </li>
            <li class="filter-group filter-group-checkbox">
              <xsl:call-template name="filter-view-option">
                <xsl:with-param name="name">Full View</xsl:with-param>
                <xsl:with-param name="display" select="//FullTextCountDisplay" />
                <xsl:with-param name="count" select="//FullTextCount" />
                <xsl:with-param name="checked" select="//LimitToFullText/Limit = 'YES'" />
                <xsl:with-param name="href" select="//FullTextHref" />
                <xsl:with-param name="label" select="'view-full-view'" />
              </xsl:call-template>
            </li>
          </ul>
        </li>
        </xsl:if>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-search-query-summary">
    <xsl:if test="//QueryString != '*'">
      <li class="active-filter-item">
        <button class="active-filter-button">
          <xsl:attribute name="data-href">
            <xsl:text>/cgi/mb?a=listis;c=</xsl:text>
            <xsl:value-of select="$coll_id" />
            <xsl:if test="//LimitToFullText/Limit = 'YES'">
              <xsl:text>;lmt=ft</xsl:text>
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
      <span class="flex-space-between flex-center" id="${label}">
        <span class="filter-name"><xsl:value-of select="$name" /><xsl:text> </xsl:text></span>
        <xsl:if test="$count > 0">
          <span class="filter-count"><xsl:value-of select="$display" /></span>
        </xsl:if>
      </span>
    </button>
  </xsl:template>

  <xsl:template name="sidebar-about-this-collection">
    <xsl:if test="//EditCollectionWidget/OwnedByUser='yes'">
      <div class="panel">
        <h3>About this Collection</h3>
        <dl class="metadata" style="margin-bottom: .5rem">
          <dt>Owner</dt>
          <dd>
            <xsl:value-of select="//CollectionOwner" />
          </dd>
          <dt>Status</dt>
          <dd class="status"><xsl:value-of select="//EditCollectionWidget/Status" /></dd>
        </dl>
        <xsl:if test="//EditCollectionWidget/OwnedByUser='yes' ">
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
    <xsl:if test="//EditCollectionWidget/OwnedByUser='yes'">
      <div style="display: flex; align-items: center; position: absolute; right: 0; top: 50%; transform: translateY(-50%)">
        <button
          class="btn btn-sm"
          id="action-edit-collection"
          data-desc="{normalize-space(EditCollectionWidget/CollDesc)}"
          data-cn="{$coll_name}"
          data-c="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']}"
          data-shrd="{$shrd}"
          >Edit</button>
        <!-- <xsl:if test="//EditCollectionWidget/Status = 'private'">
          <span style="margin-left: .25rem">
            <i class="icomoon-locked icomoon" aria-hidden="true"></i>
            <span class="offscreen">Private</span>
          </span>
        </xsl:if> -->
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="share-this-collection">
    <div class="shareLinks panel">

      <h3>Share</h3>

      <div class="btn-group share-toolbar social-links">
        <button data-service="facebook" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-facebook2"></i><span class="offscreen"> Share via Facebook</span></button>
        <button data-service="twitter" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-twitter2"></i><span class="offscreen"> Share via Twitter</span></button>
        <button data-service="reddit" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-reddit"></i><span class="offscreen"> Share via reddit</span></button>
        <button data-service="tumblr" data-title="{$coll_name}" data-media="" class="btn"><i class="icomoon icomoon-tumblr"></i><span class="offscreen"> Share via Tumblr</span></button>
        <button data-service="vkontakte" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-vk"></i><span class="offscreen"> Share via VK</span></button>
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
            <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']" />
          </xsl:attribute>
        </xsl:element>
      </form>
    </div>
  </xsl:template>

  <xsl:template name="download-metadata-form">
    <div class="downloadLinks panel">
      <h3>Download Metadata</h3>
      <xsl:choose>
        <xsl:when test="//TotalRecords = 0">
          <p style="margin-top: 2rem">
            <em>No records to download</em>
          </p>
        </xsl:when>
        <xsl:otherwise>

          <form class="form-download-metadata" method="POST" action="{//DownloadMetadataAction}">
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

  <xsl:template name="action-metadata-download-dropdown">
    <input type="hidden" name="format" value="text" />
    <div class="btn-group">
      <xsl:call-template name="btn-metadata-download" />
      <button type="button" class="btn btn-mini dropdown-toggle" data-toggle="dropdown" aria-haspopup="true" aria-expanded="false">
        <span class="caret"></span>
        <span class="offscreen">Toggle Dropdown</span>
      </button>
      <ul class="dropdown-menu">
        <li>
          <a href="#" onClick="$form = $(this).parents('form'); $form.find('input[name=format]').val('text'); $form.submit(); return false">Download Item Metadata: Tab-Delimited Text (TSV)</a>
        </li>
        <li>
          <a href="#" onClick="$form = $(this).parents('form'); $form.find('input[name=format]').val('json'); $form.submit(); return false">Download Collection + Item Metadata: Linked Data (JSON)</a>
        </li>
      </ul>
    </div>
    <xsl:text> </xsl:text>
    <a href="#" class="download-help-link">Help about Downloading Metadata</a>
    <div data-role="progress" class="spinner-download-metadata"><div class="typing_loader"></div></div>
  </xsl:template>

  <xsl:template name="build-results-container">
    <xsl:param name="title" />
    <xsl:param name="items" />
    <xsl:param name="item-list-contents" />

    <xsl:call-template name="build-mondo-collection-header" />
    <xsl:call-template name="build-operation-status-summary" />

    <div class="results-container">
      <div class="results-summary-container">
        <h2 class="results-summary">
          <xsl:value-of select="//FirstRecordNumber" />
          <xsl:text> to </xsl:text>
          <xsl:value-of select="//LastRecordNumber" />
          <xsl:text> of </xsl:text>
          <xsl:value-of select="//TotalRecords" />
          <xsl:text> </xsl:text>
          <xsl:value-of select="$title" />
          <!-- <xsl:choose>
            <xsl:when test="$gIsCollSearch = 'TRUE'">
              <xsl:text> results from this collection</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text> Full-Text results</xsl:text>
            </xsl:otherwise>
          </xsl:choose> -->
        </h2>
        <div class="results-actions">
          <label for="sort-option">Sort by</label>
          <select name="sort" id="sort-option" data-href="{//SortWidget/SortWidgetSort/@href}">
            <xsl:for-each select="//SortWidget/SortWidgetSort/Option">
              <option value="{Value}">
                <xsl:if test="Focus = 'true'">
                  <xsl:attribute name="selected">selected</xsl:attribute>
                </xsl:if>
                <xsl:value-of select="Label" />
              </option>
            </xsl:for-each>
          </select>
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
      <xsl:call-template name="build-results-list">
        <xsl:with-param name="items" select="$items" />
      </xsl:call-template>
      <xsl:call-template name="build-nav-pagination" />
    </div>

  </xsl:template>

  <xsl:template name="build-operation-status-summary">
    <xsl:variable name="action">
      <xsl:call-template name="get-action"/>
    </xsl:variable>
    <xsl:if test="$action='copyit' or $action='movit'or $action='copyitnc' or $action='movitnc' or $action='delit'">
      <div class="alert alert-success alert-operation">
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
      <xsl:when test=" starts-with ($CopyMoveAction, 'movit')">movit</xsl:when>
      <xsl:when test="starts-with ($CopyMoveAction, 'copyit')">copyit</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$delAction"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="build-results-list">
    <xsl:param name="items" />
    <xsl:for-each select="$items">
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
              <dd><xsl:value-of select="Date" /></dd>
              <xsl:if test="normalize-space(Author)">
                <dt>Author</dt>
                <dd><xsl:value-of select="Author" /></dd>
              </xsl:if>
            </dl>
          </div>
          <div class="resource-access-container">
            <ul>
              <li><a href="http://catalog.hathitrust.org/Record/{record}"><i class="icomoon icomoon-info-circle" aria-hidden="true"></i> Catalog Record</a></li>
              <li>
                <a href="https://babel.hathitrust.org/cgi/pt?id={ItemID}">
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

  <xsl:template name="build-no-results-container">
    <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>

    <xsl:call-template name="build-mondo-collection-header" />
    <xsl:call-template name="build-operation-status-summary" />

    <div class="results-container">
      <div class="results-summary-container">
        <h2 class="results-summary"><b>No results</b> matched your search.</h2>
      </div>

      <div class="results-container-inner">

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

  <xsl:template name="build-empty-collection-container">
    <xsl:call-template name="build-mondo-collection-header" />
    <xsl:call-template name="build-operation-status-summary" />

    <div class="results-container">
      <div class="results-summary-container">
        <h2 class="results-summary">This collection is empty.</h2>
      </div>

      <div class="results-container-inner">
        <h3>Suggestions</h3>
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
    </div>

  </xsl:template>

  <xsl:template name="build-collections-toolbar">
    <div class="collections-action-container">
      <button id="action-select-all" role="checkbox" class="checkbox-label" tabindex="0" aria-label="Select all on page"><div class="checkbox"><svg version="1.1" class="icon"><use xlink:href="#checkbox-empty"></use></svg></div><span style="margin-left: .5rem"> Select all on page</span></button>

      <div>
        <label class="offscreen" for="collections-chooser">Choose a collection</label>
        <select size="1" id="collections-chooser">
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
        <button class="button btn" id="addits">Add Selected</button>
        <xsl:if test="/MBooksTop/EditCollectionWidget/OwnedByUser='yes' ">
          <xsl:call-template name="build-item-selected-owner-actions"/>
        </xsl:if>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-item-selected-owner-actions">
    <button class="button btn" id="movit">Move</button>
    <button class="button btn" id="delit">Remove</button>
  </xsl:template>

  <xsl:template name="build-nav-pagination">

    <xsl:if test="count(//PageURL) > 1">
      <nav class="pagination-container" aria-label="Pagination">
        <div class="page-back-link">
          <xsl:if test="//Paging/PrevPage/Href">
            <a class="page-back-link" href="{//Paging/PrevPage/Href}">
              <span style="margin-right: 4px"><i class="icomoon icomoon-arrow-left" aria-hidden="true"></i> Previous page</span>
            </a>
          </xsl:if>
        </div>
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

  <xsl:template name="build-mondo-collection-header">
    <div class="collection-container">
      <div class="collection-header">
        <div style="display: flex; flex-grow: 1; flex-direction: row; position: relative">
          <h2 style="margin-top: 0; position: relative">
            <xsl:if test="//EditCollectionWidget/Status = 'private'">
              <span style="margin-right: .25rem">
                <i class="icomoon-locked icomoon" aria-hidden="true"></i>
              </span>
            </xsl:if>
            <xsl:value-of select="//EditCollectionWidget/CollName" />
            <xsl:if test="//EditCollectionWidget/Status = 'private'">
              <span class="offscreen">
                <xsl:text> (Collection is private)</xsl:text>
              </span>
            </xsl:if>
          </h2>
          <xsl:call-template name="build-collection-edit-action" />
        </div>
        <xsl:if test="normalize-space(//EditCollectionWidget/CollDesc)">
          <p><xsl:value-of select="//EditCollectionWidget/CollDesc" /></p>
        </xsl:if>
        <xsl:if test="normalize-space(//CollectionContactInfo)">
          <p><strong>More Information: </strong>
          <xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" /></p>
        </xsl:if>

        <!-- <xsl:call-template name="build-collection-branding" /> -->
      </div>
      <xsl:call-template name="build-mondo-collection-status-update" />

      <xsl:if test="/MBooksTop/SearchWidget/NumItemsInCollection > 0">
        <xsl:call-template name="build-mondo-collection-search-form" />
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="build-collection-branding">
    <xsl:if test="normalize-space(//CollectionBranding)">
      <p class="collection-branding not-mobile">
        <img src="{//CollectionBranding}" style="max-width: 100%" aria-hidden="true" alt="" />
      </p>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-mondo-collection-search-form">
    <form method="GET" action="/cgi/mb" class="container container-boxed" style="padding: 1rem; width: 100%">
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
          <div class="global-search-options" style="align-items: baseline; margin-top: .5rem; margin-bottom: 0; justify-content: flex-end">
            <!-- <a>
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
            </a> -->
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
            <button value="srch" id="srch" name="a" type="submit" class="button btn">Find</button>
          </div>
        </div>
      </div>

      <!-- <input type="hidden" value="srchls" name="a"/> -->

      <xsl:variable name="search-params-tmpl">
        <dc:select>
        <dc:option name="c" />
        <dc:option name="pn" />
        <dc:option name="sort" />
        <dc:option name="dir" />
        <dc:option name="sz" />
        <dc:option name="debug" />
        </dc:select>
      </xsl:variable>
      <xsl:variable name="search-params" select="exsl:node-set($search-params-tmpl)" />

      <!-- <input type="hidden">
        <xsl:attribute name="name">
          <xsl:text>c</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="value">
          <xsl:value-of select="$coll_id"/>
        </xsl:attribute>
      </input> -->

      <xsl:variable name="CurrentCgi" select="//CurrentCgi" />
      <xsl:for-each select="$search-params//dc:option">
        <xsl:variable name="name" select="@name" />
        <xsl:if test="normalize-space($CurrentCgi/Param[@name=$name])">
          <input type="hidden" name="{$name}" value="{$CurrentCgi/Param[@name=$name]}" />
        </xsl:if>
      </xsl:for-each>

      <input type="hidden" name="a" value="srch"/>

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
          <xsl:text> items were </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item was </xsl:text>
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
        <xsl:when test="$action = 'movit'">moved</xsl:when>
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

    <span class="undo">
      <xsl:text> (</xsl:text>
      <a class="inlineLink" href="{OperationResults/DeleteItemsInfo/UndoDelHref}">
        <xsl:text>undo</xsl:text>
        <span class="ofscreen">
          <xsl:text> delete</xsl:text>
        </span>
      </a>
      <xsl:text>)</xsl:text>
    </span>
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
