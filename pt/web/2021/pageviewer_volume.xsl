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
      <xsl:when test="$currentView = 'default'">1up</xsl:when>
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
      <xsl:call-template name="build-main-container-drawers-toolbar" />
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
    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/2021/dist/js/main.js']/@modtime" />
    <script type="text/javascript" src="/pt/2021/dist/js/main.js?_={$modtime}"></script>
  </xsl:template>

  <xsl:template name="build-sidebar-panels">

    <xsl:call-template name="build-survey-panel" />

    <xsl:call-template name="build-access-alert-details" />

    <!-- <xsl:call-template name="build-sidebar-beta-notice" /> -->

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
            <span>The 2021 Version</span>
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
          <xsl:text>This is the new version of the book reader. </xsl:text>
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
          <a data-params-seq="true" href="/cgi/pt?id={$gHtId};seq={//Param[@name='seq']}{$debug};skin=2019" class="action-beta-2019">Use the 2019 version</a>
        </p>
        <p style="margin-top: 0">
          (Available until August 9)
        </p>
      </div>
    </details>
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
        <div class="d--search-form-target">
          <xsl:variable name="state" select="//Preferences/Key[@name='submitTarget']/Value" />
          <input type="checkbox" name="target" id="search-form-target">
            <xsl:if test="$state = 'true'">
              <xsl:attribute name="checked">checked</xsl:attribute>
            </xsl:if>
          </input>
          <label for="search-form-target">Open results in a new window</label>
        </div>
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
      <!-- <xsl:call-template name="build-main-container-drawers-toolbar" /> -->
      <h2 class="offscreen">Page Scans</h2>
      <div id="reader" class="d--reader--container" tabindex="0">
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

      <button class="btn" id="action-help" aria-label="Help" data-tippy-role="tooltip" style="margin-left: 0.25rem">
        <xsl:call-template name="build-pt-icon">
          <xsl:with-param name="id">bi-question-circle</xsl:with-param>
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
                  <xsl:variable name="group-label">
                    <xsl:if test="@role = 'view'">
                      <xsl:text>View Mode</xsl:text>
                    </xsl:if>
                    <xsl:if test="@role = 'format'">
                      <xsl:text>Format</xsl:text>
                    </xsl:if>
                  </xsl:variable>

                  <button type="button" class="dropdown-item{$active}" href="#{@href}" data-role="{@role}" data-value="{@href}" aria-label="{$group-label}: {@label}">
                    <xsl:if test="@href = $gCurrentView or @href = $gCurrentFormat">
                      <xsl:attribute name="aria-current">true</xsl:attribute>
                    </xsl:if>
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

      <div class="btn-group" id="actions-group-paginator">
        <button class="btn" id="action-go-first" aria-label="First Page" data-tippy-role="tooltip">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="data-label-rtl">Last Page</xsl:attribute>
          </xsl:if>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-bar-left</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-prev" aria-label="Previous Page" data-tippy-role="tooltip">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="data-label-rtl">Next Page</xsl:attribute>
          </xsl:if>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-left</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-next" aria-label="Next Page" data-tippy-role="tooltip">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="data-label-rtl">Previous Page</xsl:attribute>
          </xsl:if>
          <xsl:call-template name="build-pt-icon">
            <xsl:with-param name="id">bi-chevron-right</xsl:with-param>
          </xsl:call-template>
        </button>
        <button class="btn" id="action-go-last" aria-label="Last Page" data-tippy-role="tooltip">
          <xsl:if test="$readingOrder = 'right-to-left'">
            <xsl:attribute name="data-label-rtl">First Page</xsl:attribute>
          </xsl:if>
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
      <xsl:if test="//Param[@name='q1'] and //ItemIndexStatus = 'INDEXED'">
        <div class="alert alert-block results-options" style="justify-content: flex-end">
          <div class="btn-toolbar">
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
    <xsl:variable name="modtime" select="//Timestamp[@href='/pt/2021/dist/css/app.css']/@modtime" />

    <link rel="preconnect" href="https://fonts.gstatic.com" />
    <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono&amp;display=swap" rel="stylesheet" />
    <link rel="stylesheet" type="text/css" href="/pt/2021/dist/css/app.css?_={$modtime}" />

    <script>
      HT.params.featureList = <xsl:value-of select="concat(//Manifest/FeatureList, ';')"  />
      HT.params.messagesList = <xsl:value-of select="concat(//MdpApp/MessagesList, ';')" />
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
    <xsl:variable name="inst_id" select="//InstitutionCode" />
    <xsl:variable name="access-type" select="//AccessType" />

    <xsl:if test="false() and $gLoggedIn = 'YES'">
      <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='ht-2023-ux-qa']/Value" />
      <details id="ht-2023-ux-qa" class="details--alert details--notice" data-open="{$state}">
        <xsl:if test="$state = 'open' or normalize-space($state) = ''">
          <xsl:attribute name="open">open</xsl:attribute>
        </xsl:if>
        <summary style="font-weight: bold; padding-left: 0.75rem;">
          <div class="summary">
            <span>Are you an undergrad?</span>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
              <use xlink:href="#panel-collapsed"></use>
            </svg>
            <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
              <use xlink:href="#panel-expanded"></use>
            </svg>
          </div>
        </summary>
        <div>
          <p>
            <xsl:text>We want to talk to you about your HathiTrust experience!</xsl:text>
          </p>
          <p>
            <a href="http://eepurl.com/gbk5Jb" target="_blank">Sign up for an interview</a> 
            <xsl:text> and a chance to receive a $25 gift card.</xsl:text>
          </p>
        </div>
      </details>
    </xsl:if>

    <xsl:if test="false() and ( $inst_id = 'universityofcalifornia' ) and $access-type/Name = 'emergency_access_affiliate'">
      <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='uc-etas-survey']/Value" />
      <details id="uc-etas-survey" class="details--alert details--notice" data-open="{$state}">
        <xsl:if test="$state = 'open' or normalize-space($state) = ''">
          <xsl:attribute name="open">open</xsl:attribute>
        </xsl:if>
        <summary style="font-weight: bold; padding-left: 0.75rem;">
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
          <p>
            <xsl:text>Help us learn about your HathiTrust experience and win a chance at a </xsl:text>
            <strong>$50 Amazon Gift Card!</strong>
          </p>
          <p>
            <a href="https://survey.alchemer.com/s3/6380278/HathiTrust-UC-2021-Survey" target="_blank">Take our survey!</a>
          </p>
          <div style="margin-top: 1rem">
            <span class="offscreen">Sponsored by the University of California</span>
            <img style="max-width: 8rem" aria-hidden="true" src="data:image/png;base64,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" alt="" />
          </div>
        </div>
      </details>
    </xsl:if>
  </xsl:template>

  <xsl:template name="build-last-2021-survey">
    <xsl:variable name="state" select="//Preferences/Key[@name='alerts']/Key[@name='last-2021-survey']/Value" />
    <details id="last-2021-survey" class="details--alert details--notice" data-open="{$state}">
      <xsl:if test="$state = 'open' or normalize-space($state) = ''">
        <xsl:attribute name="open">open</xsl:attribute>
      </xsl:if>
      <summary style="font-weight: bold; padding-left: 0.75rem;">
        <div class="summary">
          <span>Tell us how we're doing</span>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon closed">
            <use xlink:href="#panel-collapsed"></use>
          </svg>
          <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" class="icon open">
            <use xlink:href="#panel-expanded"></use>
          </svg>
        </div>
      </summary>
      <div>
        <p>
          <xsl:text>We want to provide you with the best experience using the HathiTrust Digital Library, so your feedback is very valuable to us.</xsl:text>
        </p>
        <p>
          <a href="https://umich.qualtrics.com/jfe/form/SV_bk3rny1OQwxwY8C" target="_blank">Take our short survey!</a>
        </p>
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
    <xsl:if test="( $gFinalAccessStatus='allow' and $gInCopyright='true' and normalize-space($access-type) )">
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
        <xsl:if test="$access-type/Name = 'total_access'">
          <xsl:call-template name="build-total-access-header" />
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
              <xsl:if test="$access-type/Name = 'total_access'">
                <xsl:choose>
                  <xsl:when test="$access-type/Role = 'ht_staff_user'">
                    <xsl:text>Collection Administration Access</xsl:text>
                  </xsl:when>
                  <xsl:when test="$access-type/Role = 'ht_total_user'">
                    <xsl:text>Collection Administration Access</xsl:text>
                  </xsl:when>
                  <xsl:when test="$access-type/Role = 'ssd_proxy_user'">
                    <xsl:text>Accessible Text Request Service</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="$access-type/Role" />
                  </xsl:otherwise>
                </xsl:choose>
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
        if ( document.querySelector('#uc-etas-survey') ) { return ; }
        document.documentElement.dataset.surveyActivated = true;
      }, 1000 * 30);
    </xsl:text>
  </xsl:template>
</xsl:stylesheet>
