<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:METS="http://www.loc.gov/METS/" xmlns:PREMIS="http://www.loc.gov/standards/premis" xmlns="http://www.w3.org/1999/xhtml" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:exsl="http://exslt.org/common" xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:param name="view" />

  <!-- Global Variables -->
  <xsl:variable name="gCurrentView">
    <xsl:variable name="currentView" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']" />
    <xsl:choose>
      <!-- <xsl:when test="$gFinalAccessStatus != 'allow'">thumb</xsl:when> -->
      <xsl:when test="$currentView = 'text'">plaintext</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$currentView" />
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="gCurrentFormat">
    <xsl:variable name="currentFormat" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='format']" />
    <xsl:choose>
      <xsl:when test="normalize-space($currentFormat)"><xsl:value-of select="$currentFormat" /></xsl:when>
      <xsl:otherwise>image</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="load_concat_js_file" />
  <xsl:template name="load_uncompressed_js" />
  <xsl:template name="build-extra-header" />

  <!-- <xsl:template name="footer"></xsl:template> -->

  <xsl:template name="build-main-container">
    <xsl:call-template name="build-main-container-drawers" />
  </xsl:template>

  <xsl:template name="build-main-container-drawers">
    <main class="d--container" id="main" data-view="1up">
      <xsl:call-template name="build-main-container-drawers-main" />
      <div class="d--sidebar--toggle--container">
        <div class="d--sidebar--toggle--edge mq--wide"></div>
        <button class="btn mq--wide" id="action-tweak-sidebar" aria-expanded="true" aria-label="Close Sidebar" data-toggled-label="Open Sidebar" data-untoggled-label="Close Sidebar" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="class">rotate-90 open</xsl:with-param>
            <xsl:with-param name="id">bi-arrows-collapse</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="class">rotate-90 closed</xsl:with-param>
            <xsl:with-param name="id">bi-arrows-expand</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn mq--narrow"  id="action-toggle-sidebar" aria-expanded="false">
          <span class="flex-space-between flex-center">
            <span class="filter-group-heading">Options</span>
            <i class="icomoon icomoon-sidebar-toggle column" aria-hidden="true"></i>
          </span>
        </button>
      </div>
      <div id="sidebar">
        <xsl:attribute name="class">
          <xsl:text>d--sidebar scroll-gradient</xsl:text>
        </xsl:attribute>
        <!-- <xsl:call-template name="build-access-alert-block" /> -->
        <div class="d--panels">
          <xsl:call-template name="build-sidebar-panels" />
        </div>
      </div>
    </main>
    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/2021/js/main.js']/@modtime" />
    <script type="text/javascript" src="/pt/2021/dist/js/main.js?_={$modtime}"></script>
  </xsl:template>

  <xsl:template name="build-sidebar-panels">

    <!-- <xsl:call-template name="build-survey-panel" /> -->

    <xsl:call-template name="build-access-alert-details" />

    <xsl:call-template name="build-sidebar-beta-notice" />

    <xsl:call-template name="BuildBackToResultsLink" />

    <xsl:call-template name="sidebar-about-this-book" />

    <xsl:call-template name="build-sidebar-panel">
      <xsl:with-param name="id">panel-download</xsl:with-param>
      <xsl:with-param name="html">
        <xsl:call-template name="download-this-book" />
      </xsl:with-param>
    </xsl:call-template>

    <xsl:if test="$gHasOcr = 'YES'">
      <xsl:call-template name="build-sidebar-panel">
        <xsl:with-param name="id">panel-search</xsl:with-param>
        <xsl:with-param name="html">
          <xsl:call-template name="build-search-in-item-panel" />
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>

    <xsl:call-template name="build-sidebar-panel">
      <xsl:with-param name="id">panel-sections</xsl:with-param>
      <xsl:with-param name="html">
        <xsl:call-template name="build-sections-panel" />
      </xsl:with-param>
    </xsl:call-template>

    <xsl:call-template name="build-sidebar-panel">
      <xsl:with-param name="id">panel-get-this-book</xsl:with-param>
      <xsl:with-param name="html">
        <xsl:call-template name="get-this-book" />
      </xsl:with-param>
    </xsl:call-template>

    <xsl:call-template name="build-sidebar-panel">
      <xsl:with-param name="id">panel-bookmark</xsl:with-param>
      <xsl:with-param name="html">
        <xsl:call-template name="collect-this-book" />
      </xsl:with-param>
    </xsl:call-template>

    <xsl:call-template name="build-sidebar-panel">
      <xsl:with-param name="id">panel-share</xsl:with-param>
      <xsl:with-param name="html">
        <xsl:call-template name="share-this-book" />
      </xsl:with-param>
    </xsl:call-template>

    <xsl:call-template name="versionLabel" />

  </xsl:template>

  <xsl:template name="build-sidebar-beta-notice">
    <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='beta-notice-2019']/Value" />
    <details class="details--alert beta" id="beta-notice-2019" data-open="{$state}">
      <xsl:if test="$state = 'open' or normalize-space($state) = ''">
        <xsl:attribute name="open">open</xsl:attribute>
      </xsl:if>
      <summary style="font-weight: bold; padding-left: 0.25rem">
        <div class="summary">
          <span style="display: flex; flex-direction: row; align-items: center; margin-right: 0.5rem">
            <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve" style="height: 2rem; width: 2rem;">
              <polygon points="66.608,59.075 53.333,56.286 55.247,51.667 " />
              <polygon points="75.749,44.939 68.333,33.58 72.952,31.666 " />
              <polygon points="84.167,58.333 81.667,35 86.667,35 " />
              <polygon points="32.514,65.427 11.912,76.667 10,72.048 " />
              <polygon points="73.021,77.979 58.581,86.667 56.667,82.048 " />
              <path d="M47.291,35.137l9.376-8.805l-16.12-2.26L33.344,10l-7.221,14.072L10,26.332l11.676,10.957L18.922,52.78l14.422-7.315  l14.424,7.315l-1.992-11.155c13.7,3.516,25.146,12.646,31.666,24.84c-4.509-3.027-9.935-4.798-15.774-4.798  c-6.823,0-13.051,2.447-17.941,6.468L40.84,62.5l-4.643,9.046l-10.363,1.455l7.506,7.041L31.568,90l9.271-4.7L50.11,90l-1.776-9.958  l7.499-7.041l-6.348-0.892c3.471-2.373,7.656-3.776,12.182-3.776c11.969,0,21.666,9.707,21.666,21.667H90  C90,63.535,71.826,41.365,47.291,35.137z M38.852,40.785l-5.508-2.793l-5.518,2.795l1.047-5.889L24.721,31l5.754-0.805l2.861-5.58  l2.855,5.576l5.766,0.811l-4.154,3.9L38.852,40.785z" />
              <path d="M90,16.998l-6.907-0.969L80.003,10l-3.092,6.029L70,16.998l5.003,4.695l-1.178,6.641l6.178-3.133l6.182,3.133L85,21.693  L90,16.998z" />
              <circle cx="60" cy="18.334" r="3.333" />
              <circle cx="20" cy="83.333" r="3.334" />
              <path d="M36.666,56.667c0,1.839-1.49,3.333-3.332,3.333C31.49,60,30,58.506,30,56.667c0-1.84,1.49-3.334,3.334-3.334  C35.176,53.333,36.666,54.827,36.666,56.667z" />
              <text x="0" y="115" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">Created by Danil Polshin</text>
              <text x="0" y="120" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">from the Noun Project</text>
            </svg>
            <span>The 2021 Edition</span>
          </span>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
            <use xlink:href="#panel-collapsed"></use>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
            <use xlink:href="#panel-expanded"></use>
          </svg>
        </div>
      </summary>
      <div style="padding: 1rem; padding-top: 0">
        <p>
          <xsl:text>You are using the new 2021 edition of the book reader. </xsl:text>
          <a href="https://www.hathitrust.org/ws-book-viewer-beta-site">Learn more</a>
        </p>
        <p>
          <xsl:variable name="debug">
            <xsl:choose>
              <xsl:when test="//Param[@name='debug'] = 'super'">
                <xsl:text>;debug=super</xsl:text>
              </xsl:when>
              <xsl:otherwise></xsl:otherwise>
            </xsl:choose>
          </xsl:variable>
          <a data-params-seq="true" href="/cgi/pt?id={$gHtId};seq={//Param[@name='seq']}{$debug};skin=default" class="action-beta-2019">Use the 2019 edition</a>
        </p>
      </div>
    </details>
  </xsl:template>

  <xsl:template name="build-sidebar-beta-notice-alert">
    <div class="beta--panel">
      <div class="alert">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.0" x="0px" y="0px" viewBox="0 0 100 125" enable-background="new 0 0 100 100" xml:space="preserve"><polygon points="66.608,59.075 53.333,56.286 55.247,51.667 "/><polygon points="75.749,44.939 68.333,33.58 72.952,31.666 "/><polygon points="84.167,58.333 81.667,35 86.667,35 "/><polygon points="32.514,65.427 11.912,76.667 10,72.048 "/><polygon points="73.021,77.979 58.581,86.667 56.667,82.048 "/><path d="M47.291,35.137l9.376-8.805l-16.12-2.26L33.344,10l-7.221,14.072L10,26.332l11.676,10.957L18.922,52.78l14.422-7.315  l14.424,7.315l-1.992-11.155c13.7,3.516,25.146,12.646,31.666,24.84c-4.509-3.027-9.935-4.798-15.774-4.798  c-6.823,0-13.051,2.447-17.941,6.468L40.84,62.5l-4.643,9.046l-10.363,1.455l7.506,7.041L31.568,90l9.271-4.7L50.11,90l-1.776-9.958  l7.499-7.041l-6.348-0.892c3.471-2.373,7.656-3.776,12.182-3.776c11.969,0,21.666,9.707,21.666,21.667H90  C90,63.535,71.826,41.365,47.291,35.137z M38.852,40.785l-5.508-2.793l-5.518,2.795l1.047-5.889L24.721,31l5.754-0.805l2.861-5.58  l2.855,5.576l5.766,0.811l-4.154,3.9L38.852,40.785z"/><path d="M90,16.998l-6.907-0.969L80.003,10l-3.092,6.029L70,16.998l5.003,4.695l-1.178,6.641l6.178-3.133l6.182,3.133L85,21.693  L90,16.998z"/><circle cx="60" cy="18.334" r="3.333"/><circle cx="20" cy="83.333" r="3.334"/><path d="M36.666,56.667c0,1.839-1.49,3.333-3.332,3.333C31.49,60,30,58.506,30,56.667c0-1.84,1.49-3.334,3.334-3.334  C35.176,53.333,36.666,54.827,36.666,56.667z"/><text x="0" y="115" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">Created by Danil Polshin</text><text x="0" y="120" fill="#000000" font-size="5px" font-weight="bold" font-family="'Helvetica Neue', Helvetica, Arial-Unicode, Arial, Sans-serif">from the Noun Project</text></svg>
        <p><strong>You are using the new 2021 edition of the book reader.</strong> <a href="https://www.hathitrust.org/ws-book-viewer-beta-site">Learn more</a></p>
      </div>
      <div>
        <a class="btn action-beta-2019" data-params-seq="true" href="/cgi/pt?id={$gHtId};seq={//Param[@name='seq']};skin=default">Return to the 2019 edition</a>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-search-in-item-panel">
    <div class="panel">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-search</xsl:with-param>
        </xsl:call-template>
        <span>Search in This Text</span>
      </h3>
      <form class="d--search-form">
        <div class="input-group-text">
          <label class="small offscreen" for="input-search-text">Search for</label>
          <input type="text" class="form-control" name="q1" id="input-search-text" value="{//Param[@name='q1']}" style="margin-bottom: 0" />
        </div>
        <button class="btn" data-action="submit-search" aria-label="Submit search" style="x-margin-top: 0.5rem">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-search</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" aria-label="Clear search" data-tippy-role="tooltip" data-action="clear-search" style="x-margin-top: 0.5rem; margin-left: 0.25rem">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-x-circle</xsl:with-param>
          </xsl:call-template>
        </button>
      </form>

      <xsl:call-template name="build-search-results-toolbar" />
    </div>
  </xsl:template>

  <xsl:template name="build-sections-panel">
    <xsl:variable name="gFeatureList" select="/MBooksTop/MdpApp/FeatureList"/>

    <div class="panel app--panel--contents" rel="note">
      <h3>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-list</xsl:with-param>
        </xsl:call-template>
        <span>Jump to Section</span>
      </h3>

      <p>
        <button class="btn" id="action-jump-to-page">Jump to page...</button>
      </p>

      <ul class="scrollable-list action-contents-navigation">
        <xsl:for-each select="$gFeatureList/Feature">
          <li>
            <a href="{Link}" data-seq="{Seq}">
              <xsl:value-of select="Label" />
              <xsl:if test="normalize-space(Page)">
                <xsl:text> - </xsl:text>
                <xsl:value-of select="Page" />
              </xsl:if>
            </a>
          </li>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-main-container-drawers-main">
    <section class="d--reader">
      <xsl:call-template name="build-main-container-drawers-toolbar" />
      <h2 class="offscreen">Page Scans</h2>
      <div id="reader" class="d--reader--container">
        <section class="d--reader--viewer">
          <xsl:call-template name="build-main-container-data-attributes" />
        </section>
      </div>
      <button tabindex="-1" id="action-focus-current-page" aria-hidden="true" style="display: none" accesskey="9">Show Current Page</button>
      <button tabindex="-1" id="action-switch-view-plaintext" aria-hidden="true" style="display: none" accesskey="5">Switch to Paged Plain Text View</button>
      <button tabindex="-1" id="action-proxy-navigation-f" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="f" data-target="action-go-first">Go First</button>
      <button tabindex="-1" id="action-proxy-navigation-p" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="p" data-target="action-go-prev">Go Previous</button>
      <button tabindex="-1" id="action-proxy-navigation-x" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="x" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-n" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="n" data-target="action-go-next">Go Next</button>
      <button tabindex="-1" id="action-proxy-navigation-l" class="action-proxy-navigation" aria-hidden="true" style="display: none" accesskey="l" data-target="action-go-last">Go Last</button>
    </section>
  </xsl:template>

  <xsl:template name="build-main-container-drawers-toolbar">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />

    <xsl:variable name="view-options-tmp">
      <ul>
        <li label="Page Format" role="header"></li>
        <li label="Plain Text" icon="bi-file-text" href="plaintext" role="format"></li>
        <li label="Image" icon="bi-file-image" href="image" role="format"></li>
        <li role="divider"></li>
        <li label="View Mode" role="header"></li>
        <li label="Scroll" icon="bi-arrow-down-up" href="1up" role="view"></li>
        <li label="Flip" icon="bi-book" href="2up" role="view"></li>
        <li label="Page-by-Page" icon="bi-layers-half" href="page" role="view"></li>
        <li role="divider"></li>
        <!-- <li label="Browse" role="header"></li> -->
        <li label="Thumbnails" icon="bi-grid-3x3-gap-fill" href="thumb" role="view"></li>
      </ul>
    </xsl:variable>
    <xsl:variable name="view-options" select="exsl:node-set($view-options-tmp)" />

    <div class="d--toolbar--reader">

      <button class="btn" id="action-go-minimal" data-untoggled-label="Hide controls" data-toggled-label="Show controls" data-tippy-role="tooltip">
        <xsl:attribute name="aria-label">
          <xsl:choose>
            <xsl:when test="//Param[@name='ui'] = 'embed'">Show controls</xsl:when>
            <xsl:otherwise>Hide controls</xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>

        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-eye</xsl:with-param>
          <xsl:with-param name="class">maximal</xsl:with-param>
        </xsl:call-template>
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-eye-slash</xsl:with-param>
          <xsl:with-param name="class">minimal</xsl:with-param>
        </xsl:call-template>
      </button>

      <div class="output-group">
        <div class="navigator-range-wrap">
          <input id="range-seq" class="navigator-range" type="range" min="1" max="{$totalSeq}" value="{$currentSeq}" aria-label="Progress">
            <xsl:if test="$readingOrder = 'right-to-left'">
              <xsl:attribute name="dir">rtl</xsl:attribute>
            </xsl:if>
          </input>
        </div>
        <label for="output-seq"><span aria-hidden="true">#</span><span class="offscreen">Page Sequence</span></label>
        <input id="output-seq" type="text" autocomplete="off" value="{//Param[@name='seq']}" />
        <span> / </span>
        <span><xsl:value-of select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" /></span>
      </div>

      <div class="dropup">
        <button class="btn dropdown-toggle" type="button" id="action-select-view" data-bs-toggle="dropdown" data-bs-offset-not="0,8" aria-expanded="false" aria-label="View Options" data-tippy-role="tooltip">
          <span style="display: flex; align-items: center">
            <xsl:call-template name="build-pt-icon">
              <xsl:with-param name="id"><xsl:value-of select="$view-options//xhtml:li[@href=$gCurrentView]/@icon" /></xsl:with-param>
            </xsl:call-template>
            <span>View</span>
            <span class="offscreen" data-role="description"></span>
          </span>
        </button>
        <ul class="dropdown-menu dropdown-menu-dark" aria-labelledby="action-select-view">
          <xsl:for-each select="$view-options//xhtml:li">
            <xsl:choose>
              <xsl:when test="@role = 'divider'">
                <li><hr class="dropdown-divider" /></li>
              </xsl:when>
              <xsl:when test="@role = 'header'">
                <li>
                  <span class="dropdown-header">
                    <svg aria-hidden="true" width="16" height="16"></svg>
                    <span><xsl:value-of select="@label" /></span>
                  </span>
                </li>
              </xsl:when>
              <xsl:otherwise>
                <li>
                  <xsl:variable name="active">
                    <xsl:if test="@role = 'view' and @href = $gCurrentView">
                      <xsl:text> active</xsl:text>
                    </xsl:if>
                    <xsl:if test="@role = 'format' and @href = $gCurrentFormat">
                      <xsl:text> active</xsl:text>
                    </xsl:if>
                  </xsl:variable>
                  <button type="button" class="dropdown-item{$active}" href="#{@href}" data-role="{@role}" data-value="{@href}">
                    <xsl:call-template name="build-pt-icon">
                      <xsl:with-param name="id"><xsl:value-of select="@icon" /></xsl:with-param>
                    </xsl:call-template>
                    <span><xsl:value-of select="@label" /></span>
                  </button>
                </li>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:for-each>
        </ul>
      </div>

      <div class="btn-group" id="actions-group-zoom">
        <button class="btn action-zoom-in" id="action-zoom-in" aria-label="Zoom In" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-plus-circle</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn action-zoom-out" id="action-zoom-out" aria-label="Zoom Out" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-minus-circle</xsl:with-param>
          </xsl:call-template>
        </button>
      </div>

      <div class="btn-group">
        <button class="btn" id="action-go-first" aria-label="First Page" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-bar-left</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-prev" aria-label="Previous Page" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-left</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-next" aria-label="Next Page" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-right</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-last" aria-label="Last Page" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-bar-right</xsl:with-param>
          </xsl:call-template>
        </button>
      </div>

      <div class="btn-group">
        <button class="btn" id="action-toggle-fullscreen" aria-label="Full screen" data-untoggled-label="Full screen" data-toggled-label="Exit full screen" data-tippy-role="tooltip">
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-arrows-fullscreen</xsl:with-param>
            <xsl:with-param name="class">enter-fullscreen</xsl:with-param>
          </xsl:call-template>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-fullscreen-exit</xsl:with-param>
            <xsl:with-param name="class">exit-fullscreen</xsl:with-param>
          </xsl:call-template>
        </button>
      </div>

    </div>
  </xsl:template>

  <xsl:template name="setup-html-attributes">
    <xsl:variable name="ns">
      <dc:elem xmlns:dc="http://purl.org/dc/elements/1.1/" />
      <cc:elem xmlns:cc="http://creativecommons.org/ns#" />
      <foaf:elem xmlns:foaf="http://xmlns.com/foaf/0.1" />
    </xsl:variable>
    <xsl:copy-of select="exsl:node-set($ns)/*/namespace::*" />
    <xsl:attribute name="version">XHTML+RDFa 1.0</xsl:attribute>
    <xsl:attribute name="data-content-provider"><xsl:value-of select="/MBooksTop/MBooksGlobals/ContentProvider" /></xsl:attribute>
    <xsl:if test="//CurrentCgi/Param[@name='page'] = 'root' and //FinalAccessStatus = 'allow'">
      <xsl:attribute name="data-analytics-skip">true</xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-app">pt</xsl:attribute>
    <xsl:attribute name="data-show-highlights">true</xsl:attribute>
    <xsl:attribute name="data-survey-activated">false</xsl:attribute>
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-body-data-attributes">
    <xsl:attribute name="data-panel-state">
      <xsl:choose>
        <xsl:when test="$view = 'restricted'">open</xsl:when>
        <xsl:otherwise>closed</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-sidebar-state">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>closed</xsl:text>
        </xsl:when>
        <xsl:when test="normalize-space(//Preferences/Key[@name='sidebarToggleState']/Value)">
          <xsl:value-of select="//Preferences/Key[@name='sidebarToggleState']/Value[1]" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>open</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-sidebar-test-state">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>closed</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>open</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-ui"><xsl:value-of select="//Param[@name='ui']" /></xsl:attribute>
    <xsl:attribute name="data-sidebar-toggle-state">closed</xsl:attribute>
    <xsl:attribute name="data-fullscreen">false</xsl:attribute>
    <xsl:attribute name="data-ui-view">
      <xsl:choose>
        <xsl:when test="//Param[@name='ui'] = 'embed'">
          <xsl:text>minimal</xsl:text>
        </xsl:when>
        <xsl:when test="normalize-space(//Preferences/Key[@name='uiView']/Value)">
          <xsl:value-of select="//Preferences/Key[@name='uiView']/Value" />
        </xsl:when>
        <xsl:otherwise>full</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-show-highlights">true</xsl:attribute>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <!-- <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template> -->

  <xsl:template name="get-tracking-category">PT</xsl:template>

  <xsl:template name="setup-extra-html-attributes"></xsl:template>

  <xsl:template name="build-search-results-toolbar">
    <div class="results-container">
      <xsl:if test="//Param[@name='q1']">
        <div class="alert alert-block results-options" style="justify-content: flex-end">
          <div class="btn-toolbar">
            <xsl:if test="//ItemIndexStatus = 'INDEXED'">
              <button aria-pressed="true" class="btn active" data-action="toggle-highlights" aria-label="Hide Highlights" data-toggled-label="Hide Highlights" data-untoggled-label="Show Highlights" data-tippy-role="tooltip">
                <xsl:call-template name="build-pt-icon">
                  <xsl:with-param name="id">bi-brightness-high-fill</xsl:with-param>
                  <xsl:with-param name="class">toggled</xsl:with-param>
                </xsl:call-template>
                <xsl:call-template name="build-pt-icon">
                  <xsl:with-param name="id">bi-brightness-low</xsl:with-param>
                  <xsl:with-param name="class">untoggled</xsl:with-param>
                </xsl:call-template>
              </button>
            </xsl:if>
            <xsl:if test="false()">
              <button class="btn" aria-label="Clear search" data-tippy-role="tooltip" data-action="clear-search">
                <xsl:call-template name="build-pt-icon">
                  <xsl:with-param name="id">bi-x-circle</xsl:with-param>
                </xsl:call-template>
              </button>
            </xsl:if>
          </div>
        </div>
      </xsl:if>
    </div>
  </xsl:template>

  <xsl:template name="build-main-container-data-attributes">
    <xsl:variable name="currentSeq" select="//Param[@name='seq']" />
    <xsl:variable name="totalSeq" select="count(//METS:structMap[@TYPE='physical']/METS:div[@TYPE]/METS:div[@ORDER])" />
    <xsl:variable name="readingOrder" select="//Manifest/ReadingOrder" />

    <xsl:attribute name="data-has-ocr">
      <xsl:choose>
        <xsl:when test="$gHasOcr = 'YES'">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-allow-full-download">
      <xsl:choose>
        <xsl:when test="$gFullPdfAccess = 'allow'">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>
    <xsl:attribute name="data-reading-order"><xsl:value-of select="$readingOrder" /></xsl:attribute>
    <xsl:attribute name="data-total-seq"><xsl:value-of select="$totalSeq" /></xsl:attribute>
    <xsl:attribute name="data-default-seq"><xsl:value-of select="//Manifest/DefaultSeq" /></xsl:attribute>
    <xsl:attribute name="data-first-seq"><xsl:value-of select="//Manifest/FirstPageSeq" /></xsl:attribute>
    <xsl:attribute name="data-default-height"><xsl:value-of select="//Manifest/BaseImage/Height" /></xsl:attribute>
    <xsl:attribute name="data-default-width"><xsl:value-of select="//Manifest/BaseImage/Width" /></xsl:attribute>
    <xsl:attribute name="data-htid"><xsl:value-of select="//Param[@name='id']" /></xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header--reader">
    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/2021/css/app.css']/@modtime" />

    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&amp;display=swap" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="/pt/2021/dist/css/app.css?_={$modtime}" />

    <script>
      HT.params.featureList = <xsl:value-of select="concat(//Manifest/FeatureList, ';')"  />
    </script>
  </xsl:template>

  <xsl:template name="setup-extra-header-extra">

  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li><a href="#reader" accesskey="2">Skip to page content</a></li>
        <li><a href="/cgi/ssd?id={$gHtId}">Skip to text-only view</a></li>
        <xsl:if test="$gHasOcr = 'YES'">
          <li><a href="#input-search-text">Skip to search in this text</a></li>
        </xsl:if>
        <!-- <li><a href="#sidebar">Skip to book options</a></li> -->
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="build-survey-panel">
    <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='uc-etas-survey']/Value" />
    <details id="uc-etas-survey" class="details--alert details--notice" data-open="{$state}">
      <xsl:if test="$state = 'open' or normalize-space($state) = ''">
        <xsl:attribute name="open">open</xsl:attribute>
      </xsl:if>
      <summary style="font-weight: bold; padding-left: 0.25rem;">
        <div class="summary">
          <span>How about a survey?</span>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
            <use xlink:href="#panel-collapsed"></use>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
            <use xlink:href="#panel-expanded"></use>
          </svg>
        </div>
      </summary>
      <div>
        <p>Would you like to participate in a survey to better understand how someone like <em>you</em> avails themselves of the wealth of information at your fingertips?</p>
        <p><a href="#">Take our survey!</a></p>
      </div>
    </details>
  </xsl:template>

  <xsl:template name="footer" />

  <xsl:template name="build-access-alert-details">
    <xsl:variable name="access-type" select="//AccessType" />
    <!-- debugging aid -->
    <!-- <xsl:variable name="access-type-tmp">
      <AccessType xmlns="">
        <Name>emergency_access_affiliate</Name>
      </AccessType>
    </xsl:variable>
    <xsl:variable name="access-type" select="exsl:node-set($access-type-tmp)//AccessType" /> -->
    <xsl:if test="( $gFinalAccessStatus='allow' and $gInCopyright='true' )">
      <xsl:variable name="alert-tmp">
        <xsl:if test="$access-type/Name = 'emergency_access_affiliate'">
          <xsl:call-template name="build-emergency-access-affiliate-header" />
        </xsl:if>
        <xsl:if test="$access-type/Name = 'in_library_user'">
          <xsl:call-template name="build-in-library-user-header" />
        </xsl:if>
        <xsl:if test="$gLoggedIn='YES' and $gSSD_Session='true'">
          <xsl:call-template name="build-ssd-session-header" />
        </xsl:if>
        <xsl:if test="$access-type/Name = 'enhanced_text_user'">
          <xsl:call-template name="build-ssd-session-header" />
        </xsl:if>
      </xsl:variable>
      <xsl:variable name="alert" select="exsl:node-set($alert-tmp)/node()" />
      <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name=$alert/@id]/Value" />
      <details class="details--alert iconless special-access" data-access-type="{$access-type/Name}">
        <xsl:attribute name="id"><xsl:value-of select="$alert/@id" /></xsl:attribute>
        <xsl:if test="$state = 'open' or normalize-space($state) = ''">
          <xsl:attribute name="open">open</xsl:attribute>
        </xsl:if>
        <xsl:attribute name="data-initialized">
          <xsl:value-of select="$alert/@data-initialized" />
        </xsl:attribute>
        <xsl:if test="$alert/@data-access-expires">
          <xsl:attribute name="data-access-expires">
            <xsl:value-of select="$alert/@data-access-expires" />
          </xsl:attribute>
          <xsl:attribute name="data-access-expires-seconds">
            <xsl:value-of select="$alert/@data-access-expires-seconds" />
          </xsl:attribute>
        </xsl:if>
        <summary>
          <div class="summary">
            <span>
              <xsl:if test="$access-type/Name = 'emergency_access_affiliate'">
                <xsl:text>Checked out until </xsl:text>
                <span class="expires-display"></span>
              </xsl:if>
              <xsl:if test="$access-type/Name = 'in_library_user'">
                <xsl:text>Checked out until </xsl:text>
                <span class="expires-display"></span>
              </xsl:if>
              <xsl:if test="$gLoggedIn='YES' and $gSSD_Session='true'">
                <xsl:text>In-Copyright Access</xsl:text>
              </xsl:if>
              <xsl:if test="$access-type/Name = 'enhanced_text_user'">
                <xsl:text>In-Copyright Access</xsl:text>
              </xsl:if>
            </span>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
              <use xlink:href="#panel-collapsed"></use>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
              <use xlink:href="#panel-expanded"></use>
            </svg>
          </div>
        </summary>
        <div>
          <xsl:apply-templates select="$alert/*" mode="copy" />
        </div>
      </details>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-hotjar-script-extra">
    <xsl:text>
      hj('trigger', 'test_2021');
      setTimeout(function() {
        document.documentElement.dataset.surveyActivated = true;
      }, 1000 * 30);
    </xsl:text>
  </xsl:template>
</xsl:stylesheet>