<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet [
<!ENTITY nbsp "&#160;">
<!ENTITY copy "&#169;">
<!ENTITY raquo "»">
<!ENTITY laquo "«">
<!ENTITY mdash "–">
]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:date="http://exslt.org/dates-and-times"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns:h="http://www.hathitrust.org"
  xmlns:svg="http://www.w3.org/2000/svg"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="h exsl date"
  extension-element-prefixes="exsl date">

  <xsl:variable name="timestamp" select="'?_=1548180869'" />
  <xsl:variable name="gTimestamp" select="date:time()" />

  <xsl:variable name="gFinalAccessStatus" select="/MBooksTp/MBooksGlobals/FinalAccessStatus"/>
  <xsl:variable name="gHttpHost" select="/MBooksTop/MBooksGlobals/HttpHost"/>
  <xsl:variable name="gHtId" select="/MBooksTop/MBooksGlobals/HtId"/>

  <xsl:variable name="gLoggedIn" select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  <xsl:variable name="gQ1" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='q1']" />

  <xsl:variable name="gEnableGoogleAnalytics" select="'true'"/>

  <xsl:variable name="search-options">
      <!-- <option value="ocr" data-target="ls">Everything</option> -->
      <option value="all">All Fields</option>
      <!-- <option value="ocronly" data-target="ls">Just Full Text</option> -->
      <option value="title">Title</option>
      <option value="author">Author</option>
      <option value="subject">Subject</option>
      <option value="isbn">ISBN/ISSN</option>
      <option value="publisher">Publisher</option>
      <option value="seriestitle">Series Title</option>
  </xsl:variable>

  <xsl:template name="load_base_js" />

  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">
      <xsl:attribute name="data-analytics-code">
        <xsl:call-template name="get-analytics-code" />
      </xsl:attribute>
      <xsl:attribute name="data-analytics-enabled"><xsl:call-template name="get-analytics-enabled" /></xsl:attribute>
      <xsl:attribute name="data-tracking-category"><xsl:call-template name="get-tracking-category" /></xsl:attribute>
      <xsl:if test="//UserHasRoleToggles/@activated != ''">
        <xsl:attribute name="data-activated"><xsl:value-of select="//UserHasRoleToggles/@activated" /></xsl:attribute>
      </xsl:if>
      <xsl:call-template name="setup-html-data-attributes" />
      <xsl:attribute name="class">
        <xsl:text>no-js </xsl:text>
        <xsl:call-template name="search-target-class" />
        <xsl:call-template name="setup-html-class" />
      </xsl:attribute>
      <xsl:call-template name="setup-html-attributes" />

      <head>

        <xsl:comment>IE PRE-SETUP</xsl:comment>

        <xsl:call-template name="load_base_js" />

        <xsl:call-template name="setup-extra-header" />

        <xsl:comment>IE POST-SETUP</xsl:comment>

        <title>
          <xsl:call-template name="setup-page-title" />
        </title>

        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <script src="https://kit.fontawesome.com/1c6c3b2b35.js" crossorigin="anonymous"></script>
        <xsl:choose>
          <xsl:when test="true()">
            <script type="module" src="//localhost:5173/js/main.js"></script>
          </xsl:when>
          <xsl:otherwise>
            <link rel="stylesheet" href="https://deploy-preview-15--hathitrust-firebird-common.netlify.app/assets/main.css" />
            <script type="module" src="https://deploy-preview-15--hathitrust-firebird-common.netlify.app/assets/main.js"></script>
          </xsl:otherwise>
        </xsl:choose>
      </head>

      <body>
        <xsl:attribute name="class">
          <xsl:text>apps </xsl:text>
          <xsl:call-template name="setup-body-class" />
        </xsl:attribute>
        <xsl:call-template name="setup-body-data-attributes" />
        
        <xsl:call-template name="insert-svg-icons" />

        <xsl:call-template name="debug-messages" />

        <xsl:call-template name="skip-to-main-link" />

        <!-- <xsl:call-template name="access-overview" /> -->

        <div id="root">

          <div role="status" aria-atomic="true" aria-live="polite" class="visually-hidden"></div>

          <xsl:call-template name="navbar" />

          <xsl:call-template name="build-main-container" />

          <xsl:call-template name="footer" />
        </div>
        <xsl:call-template name="setup-body-tail" />
      </body>

    </html>

  </xsl:template>

  <xsl:template name="setup-body-tail"></xsl:template>
  <xsl:template name="setup-body-data-attributes"></xsl:template>

  <xsl:template name="skip-to-main-link" />

  <xsl:template name="setup-html-class" />
  <xsl:template name="setup-html-attributes" />
  <xsl:template name="setup-extra-header" />
  <xsl:template name="setup-body-class" />
  <xsl:template name="setup-html-data-attributes" />

  <xsl:template name="build-main-container">
    <main class="main" id="main">
      <xsl:call-template name="page-contents" />
    </main>
  </xsl:template>

  <xsl:template name="access-overview">
    <div class="offscreen" rel="note">
      <h2>Text Only Views</h2>
      <xsl:if test="$gHtId">
        <p>Go to the <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only view of this item.</xsl:element></p>
      </xsl:if>
      <ul>
        <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        <li>See the <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="access-overview-block">
    <div class="accessOverview" rel="note">
      <h3>Text Only Views</h3>
      <xsl:if test="$gHtId">
        <p>Go to the <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only view of this item.</xsl:element></p>
      </xsl:if>
      <ul>
        <li>Special full-text views of publicly-available items are available to authenticated members of HathiTrust institutions.</li>
        <li>Special full-text views of in-copyright items may be available to authenticated members of HathiTrust institutions. Members should login to see which items are available while searching. </li>
        <li>See the <a href="https://www.hathitrust.org/accessibility">HathiTrust Accessibility</a> page for more information.</li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="setup-page-title">
    <xsl:variable name="page-title">
      <xsl:call-template name="get-page-title" />
    </xsl:variable>
    <xsl:if test="normalize-space($page-title)">
      <xsl:value-of select="$page-title" /><xsl:text> | </xsl:text>
    </xsl:if>
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="navbar">
    <hathi-website-header>
      <xsl:call-template name="build-navbar-options" />
    </hathi-website-header>
  </xsl:template>

  <xsl:template name="build-navbar-options"></xsl:template>

  <xsl:template name="navbar---alicorn">
    <header class="site-navigation" role="banner">
      <nav aria-label="about the site">
        <xsl:call-template name="navbar-site-links" />
        <ul id="person-nav" class="nav pull-right">
          <xsl:call-template name="navbar-user-links" />
        </ul>
      </nav>
      <xsl:call-template name="build-extra-header" />
    </header>
  </xsl:template>

  <xsl:template name="build-extra-header" />

  <xsl:template name="config-include-logo">FALSE</xsl:template>

  <xsl:template name="navbar-site-links">
    <ul id="nav" class="nav">
      <li class="nav-item">
        <a class="nav-link home-link" href="https://www.hathitrust.org">
          <span class="offscreen-for-narrowest">Home</span>
        </a>
      </li>
      <li class="nav-item dropdown" id="burger-menu-container">
        <a id="burger-menu-trigger" href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button" aria-expanded="false"><i class="icomoon icomoon-reorder" aria-hidden="true"></i> Menu</a>
        <ul id="burger-menu" class="dropdown-menu">
          <li class="fixed">
            <span class="dropdown-header">About</span>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/about">Welcome to HathiTrust</a>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/partnership">Our Partnership</a>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/digital_library">Our Digital Library</a>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/collaborative-programs">Our Collaborative Programs</a>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/htrc">Our Research Center</a>
          </li>
          <li class="nested">
            <a class="dropdown-item" href="https://www.hathitrust.org/news_publications">News &amp; Publications</a>
          </li>
          <li><hr class="dropdown-divider" /></li>
          <!-- <xsl:if test="$gLoggedIn = 'YES'">
            <li class=""><a class="dropdown-item" href="{//Header/PrivCollLink}">My Collections</a></li>
          </xsl:if> -->
          <li class="">
            <a class="dropdown-item" href="/cgi/mb">Collections</a>
          </li>
          <li class="help">
            <a class="dropdown-item" href="https://www.hathitrust.org/help">Help</a>
          </li>
          <xsl:call-template name="li-feedback">
            <xsl:with-param name="a-class">dropdown-item</xsl:with-param>
          </xsl:call-template>
        </ul>
      </li>
      <li class="nav-item" id="about-menu-container">
        <a id="about-menu" href="#" class="nav-link dropdown-toggle" data-bs-toggle="dropdown" role="button">About</a>
        <ul class="dropdown-menu">
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/about">Welcome to HathiTrust</a>
          </li>
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/partnership">Our Partnership</a>
          </li>
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/digital_library">Our Digital Library</a>
          </li>
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/collaborative-programs">Our Collaborative Programs</a>
          </li>
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/htrc">Our Research Center</a>
          </li>
          <li>
            <a class="dropdown-item" href="https://www.hathitrust.org/news_publications">News &amp; Publications</a>
          </li>
        </ul>
      </li>
      <!-- <xsl:if test="$gLoggedIn = 'YES'">
        <li class="nav-item wide"><a class="nav-link" href="{//Header/PrivCollLink}">My Collections</a></li>
      </xsl:if> -->
      <li class="nav-item wide">
        <a class="nav-link" href="/cgi/mb">Collections</a>
      </li>
      <li class="nav-item help wide">
        <a class="nav-link" href="https://www.hathitrust.org/help">Help</a>
      </li>
      <xsl:call-template name="li-feedback">
        <xsl:with-param name="li-class">nav-item wide</xsl:with-param>
        <xsl:with-param name="a-class">nav-link</xsl:with-param>
      </xsl:call-template>
    </ul>
  </xsl:template>

  <xsl:template name="navbar-user-links">
    <li class="on-for-pt on-for-narrow">
      <button class="btn action-search-hathitrust control-search">
        <i class="icomoon icomoon-search" aria-hidden="true"></i><span class="offscreen-for-narrowest"> Search</span> HathiTrust</button>
    </li>
    <li>
      <button disabled="disabled" class="btn action-toggle-notifications" aria-label="Toggle Notifications">
        <i class="icomoon icomoon-bell" aria-hidden="true"></i>
      </button>
    </li>
    <xsl:choose>
      <xsl:when test="$gLoggedIn = 'YES'">
        <xsl:choose>
          <xsl:when test="//Header/UserHasRoleToggles='TRUE'">
            <li class="x--off-for-narrowest">
              <xsl:variable name="debug">
                <xsl:if test="//Param[@name='debug']">?debug=<xsl:value-of select="//Param[@name='debug']" /></xsl:if>
              </xsl:variable>
              <a href="/cgi/ping/switch{$debug}" class="action-switch-role">
                <xsl:apply-templates select="//Header/UserAffiliation" mode="copy-guts" />
                <xsl:text> </xsl:text>
                <xsl:text>⚡</xsl:text>
              </a>
            </li>
          </xsl:when>
          <xsl:otherwise>
            <li class="item-vanishing">
              <span>
                <xsl:value-of select="//Header/UserAffiliation" />
                <!-- ProviderName causes collisions with search navbar -->
                <!--
                <xsl:if test="//Header/ProviderName">
                  <xsl:text> (</xsl:text>
                  <xsl:value-of select="//Header/ProviderName" />
                  <xsl:text>)</xsl:text>
                </xsl:if>
                -->
              </span>
            </li>
          </xsl:otherwise>
        </xsl:choose>
        <li class="x--off-for-narrowest"><a class="logout-link" href="{//Header/LoginLink}">Log out</a></li>
      </xsl:when>
      <xsl:otherwise>
        <li><a id="login-link" class="trigger-login action-login" data-close-target=".modal.login" href="{//Header/LoginLink}">Log in</a></li>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="header">

    <div class="container container-medium flex-container container-header">
      <div class="logo">
        <a href="https://www.hathitrust.org">
          <span class="offscreen">HathiTrust Digital Library</span>
        </a>
      </div>
      <div id="search-modal-content" class="search-modal-content">
        <form id="ht-search-form" class="ht-search-form" method="GET" action="/cgi/ls/one">
          <div style="display: flex; flex-direction: row">
            <div style="flex-grow: 1">
              <div style="display: flex">
                <div class="control control-q1">
                  <label for="q1-input" class="offscreen">Search full-text index</label>
                  <input id="q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items" required="required" pattern="^(?!\s*$).+">
                    <xsl:attribute name="value">
                      <xsl:call-template name="header-search-q1-value" />
                    </xsl:attribute>
                  </input>
                </div>
                <div class="control control-searchtype">
                  <label for="search-input-select" class="offscreen">Search Field List</label>
                  <select id="search-input-select" size="1" class="search-input-select" name="searchtype" style="font-size: 1rem">
                    <xsl:call-template name="search-input-select-options" />
                  </select>
                </div>
              </div>
              <div class="global-search-options">
                <fieldset class="search-target">
                  <legend class="offscreen">Available Indexes</legend>
                  <input name="target" type="radio" id="option-full-text-search" value="ls" checked="checked" />
                  <label for="option-full-text-search" class="search-label-full-text">Full-text</label>
                  <input name="target" type="radio" id="option-catalog-search" value="catalog" />
                  <label for="option-catalog-search" class="search-label-catalog">Catalog</label>
                </fieldset>
                <xsl:call-template name="header-search-ft-checkbox" />
              </div>
            </div>
            <div style="flex-grow: 0">
              <div class="control">
                <button class="btn btn-primary" id="action-search-hathitrust"><i class="icomoon icomoon-search" aria-hidden="true"></i> Search HathiTrust</button>
              </div>
            </div>
          </div>
          <div class="global-search-links" style="padding-top: 1rem; margin-top: -1rem">
            <ul class="search-links">
              <li class="search-advanced-link">
                <a href="/cgi/ls?a=page;page=advanced">Advanced full-text search</a>
              </li>
              <li class="search-catalog-link">
                <a href="https://catalog.hathitrust.org/Search/Advanced">Advanced catalog search</a>
              </li>
              <li>
                <a href="https://www.hathitrust.org/help_digital_library#SearchTips">Search tips</a>
              </li>
            </ul>
          </div>
        </form>
      </div>
    </div>

  </xsl:template>

  <xsl:template name="header-search-form">
    <div class="search-form">
      <xsl:call-template name="global-search-form" />
    </div>
  </xsl:template>

  <xsl:template name="global-search-form">
    <form action="/cgi/ls/one" method="GET">
      <div class="search-tabs" role="radiogroup" aria-labelledby="search-tabs-label">
        <span id="search-tabs-label" class="offscreen">Search this index</span>
        <xsl:call-template name="header-search-tabs" />
      </div>
      <xsl:call-template name="global-search-form-fieldset" />
      <xsl:call-template name="global-search-form-options" />
    </form>
  </xsl:template>

  <xsl:template name="global-search-form-fieldset">
    <fieldset>
      <label for="q1-input" class="offscreen" >Search</label>
      <input id="q1-input" name="q1" type="text" class="search-input-text" placeholder="Search words about or within the items">
        <xsl:attribute name="value">
          <xsl:call-template name="header-search-q1-value" />
        </xsl:attribute>
      </input>
      <div class="search-input-options">
        <label for="search-input-select" class="offscreen">Search Field List</label>
        <select id="search-input-select" size="1" class="search-input-select" name="searchtype">
          <xsl:call-template name="search-input-select-options" />
        </select>
      </div>
      <button class="button"><span class="offscreen">Search</span></button>
    </fieldset>
  </xsl:template>

  <xsl:template name="global-search-form-options">
    <div class="search-extra-options">
      <ul class="search-links">
        <li class="search-advanced-link">
          <a>
            <xsl:attribute name="href">
              <xsl:call-template name="GetAdvancedFullTextHref"/>
            </xsl:attribute>
            <xsl:text>Advanced full-text search</xsl:text>
          </a>
        </li>
        <li class="search-catalog-link"><a href="https://catalog.hathitrust.org/Search/Advanced">Advanced catalog search</a></li>
        <li><a href="https://www.hathitrust.org/help_digital_library#SearchTips">Search tips</a></li>
      </ul>
      <xsl:call-template name="header-search-ft-checkbox" />
    </div>
  </xsl:template>

  <xsl:template name="GetAdvancedFullTextHref">
    <xsl:text>/cgi/ls?a=page;page=advanced</xsl:text>
  </xsl:template>


  <xsl:template name="header-search-q1-value" />

  <xsl:template name="footer">
    <hathi-website-footer></hathi-website-footer>
  </xsl:template>

  <xsl:template name="li-feedback">
    <xsl:param name="li-class" />
    <xsl:param name="a-class" />
    <xsl:variable name="feedback-id">
      <xsl:call-template name="get-feedback-id" />
    </xsl:variable>
    <xsl:variable name="feedback-m">
      <xsl:call-template name="get-feedback-m" />
    </xsl:variable>
    <li class="{$li-class}"><a class="{$a-class}" href="/cgi/feedback?page=form" data-m="{$feedback-m}" data-toggle="feedback tracking-action" data-id="{$feedback-id}" data-tracking-action="Show Feedback">Feedback</a></li>
  </xsl:template>

  <xsl:template name="get-feedback-id">HathiTrust (babel)</xsl:template>
  <xsl:template name="get-feedback-m">ht</xsl:template>

  <xsl:template name="page-contents">
    <xsl:call-template name="contents" />
  </xsl:template>

  <xsl:template name="get-page-contents" />

  <xsl:template name="login-block">
    <div class="login">
      <xsl:choose>
        <xsl:when test="$gLoggedIn = 'YES'">
          <!-- we don't do anything normally -->
        </xsl:when>
        <xsl:otherwise>
          <a href="{/MBooksTop/Header/LoginLink}" id="login-button" class="button log-in">LOG IN</a>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="header-search-tabs">
    <xsl:variable name="target">
      <xsl:call-template name="header-search-target" />
    </xsl:variable>
    <input name="target" type="radio" id="option-full-text-search" value="ls">
      <xsl:if test="$target = 'ls'">
        <xsl:attribute name="checked">checked</xsl:attribute>
      </xsl:if>
    </input>
    <label for="option-full-text-search" class="search-label-full-text">Full-text</label>
    <input name="target" type="radio" id="option-catalog-search" value="catalog">
      <xsl:if test="$target = 'catalog'">
        <xsl:attribute name="checked">checked</xsl:attribute>
      </xsl:if>
    </input>
    <label for="option-catalog-search" class="search-label-catalog">Catalog</label>
  </xsl:template>

  <!-- default to ls -->
  <xsl:template name="search-target-class">
    <xsl:variable name="class">
      <xsl:text>search-target-</xsl:text><xsl:call-template name="header-search-target" />
    </xsl:variable>
    <xsl:value-of select="normalize-space($class)" />
  </xsl:template>
  <xsl:template name="header-search-target">ls</xsl:template>

  <xsl:template name="search-input-select-options">
    <xsl:for-each select="exsl:node-set($search-options)/*">
      <option value="{@value}">
        <xsl:if test="@data-target">
          <xsl:attribute name="data-target"><xsl:value-of select="@data-target" /></xsl:attribute>
        </xsl:if>
        <xsl:call-template name="header-search-options-selected">
          <xsl:with-param name="value" select="@value" />
        </xsl:call-template>
        <xsl:value-of select="." />
      </option>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="header-search-options-selected" />

  <xsl:template name="header-search-ft-checkbox">
    <xsl:variable name="checked">
      <xsl:call-template name="header-search-ft-value" />
    </xsl:variable>
    <div class="global-search-ft">
      <input type="checkbox" name="ft" value="ft" id="global-search-ft">
        <xsl:if test="normalize-space($checked)">
          <xsl:attribute name="checked">checked</xsl:attribute>
        </xsl:if>
      </input>
      <label for="global-search-ft">Full view only</label>
    </div>
  </xsl:template>

  <xsl:template name="header-search-ft-value">checked</xsl:template>

  <xsl:template name="list-surveys">
    <xsl:call-template name="list-surveys-blocks" />
<!--     <xsl:choose>
      <xsl:when test="contains(//Param[@name='debug'], 'blocks')">
        <xsl:call-template name="list-surveys-blocks" />
      </xsl:when>
      <xsl:otherwise>
        <xsl:call-template name="list-surveys-combined" />
      </xsl:otherwise>
    </xsl:choose> -->
  </xsl:template>

  <xsl:template name="list-surveys-blocks">
    <xsl:for-each select="//Surveys/Survey">
      <div class="alert alert-notice alert-block">
        <xsl:if test=".//a[@dir]">
          <xsl:attribute name="dir"><xsl:value-of select=".//a/@dir" /></xsl:attribute>
        </xsl:if>
        <p>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </div>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="list-surveys-combined">
    <div class="alert alert-notice alert-block">
      <xsl:for-each select="//Surveys/Survey">
        <p>
          <xsl:if test="position() &gt; 1">
            <xsl:attribute name="style">margin-top: 20px</xsl:attribute>
          </xsl:if>
          <xsl:apply-templates select="Desc" mode="copy-guts" />
        </p>
      </xsl:for-each>
    </div>
  </xsl:template>

  <xsl:template name="debug-messages">
    <xsl:if test="/MBooksTop/MBooksGlobals/DebugMessages/*">
      <div class="debug-messages">
        <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*" />
      </div>
    </xsl:if>
  </xsl:template>

  <xsl:template name="get-analytics-enabled">true</xsl:template>
  <xsl:template name="get-analytics-code">
    <xsl:text>UA-954893-23</xsl:text>
    <xsl:call-template name="get-extra-analytics-code" />
  </xsl:template>
  <xsl:template name="get-extra-analytics-code"></xsl:template>
  <xsl:template name="get-tracking-category">HT</xsl:template>

  <xsl:template name="insert-svg-icons">
  </xsl:template>

  <xsl:template name="build-css-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <link rel="stylesheet" href="{$href}?_{$modtime}" />
  </xsl:template>

  <xsl:template name="build-js-link">
    <xsl:param name="href" />
    <xsl:variable name="modtime" select="//Timestamp[@href=$href]/@modtime" />
    <script type="text/javascript" src="{$href}?_{$modtime}"></script>
  </xsl:template>

  <xsl:template name="build-accordion-item">
    <xsl:param name="id" />
    <xsl:param name="parent" />
    <xsl:param name="open" />
    <xsl:param name="heading" />
    <xsl:param name="body" />
    <xsl:variable name="collapsed">
      <xsl:if test="$open != true()">
        <xsl:text>collapsed</xsl:text>
      </xsl:if>
    </xsl:variable>
    <xsl:variable name="collapse">
      <xsl:if test="$open != true()">
        <xsl:text>collapse</xsl:text>
      </xsl:if>
    </xsl:variable>
    <div class="panel accordion-item">
      <h3 class="accordion-header" id="heading-{$id}">
        <button class="accordion-button fw-bold {$collapsed}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-{$id}" aria-controls="collapse-{$id}">
          <xsl:value-of select="$heading" />
        </button>
      </h3>
      <div id="collapse-{$id}" class="accordion-collapse {$collapse}" aria-labelledby="heading-{$id}">
        <xsl:if test="normalize-space($parent)">
          <xsl:attribute name="data-bs-parent">#<xsl:value-of select="$parent" /></xsl:attribute>
        </xsl:if>
        <div class="accordion-body">
          <xsl:apply-templates select="exsl:node-set($body)" mode="copy" />
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template match="node()" mode="copy-guts">
    <xsl:apply-templates select="@*|*|text()" mode="copy" />
  </xsl:template>

  <xsl:template match="svg" mode="copy" priority="101">
    <xsl:param name="class" />
    <xsl:copy>
      <xsl:attribute name="data-animal">seahorse</xsl:attribute>
      <xsl:apply-templates select="@*" mode="copy">
        <xsl:with-param name="class" select="$class" />
      </xsl:apply-templates>
      <xsl:apply-templates select="*" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="svg:svg" mode="copy" priority="100">
    <xsl:param name="class" />
    <xsl:copy>
      <xsl:attribute name="data-animal">zebra</xsl:attribute>
      <xsl:apply-templates select="@*" mode="copy">
        <xsl:with-param name="class" select="$class" />
      </xsl:apply-templates>
      <xsl:apply-templates select="*" mode="copy" />
    </xsl:copy>
  </xsl:template>

  <xsl:template match="node()[name()]" mode="copy" priority="10">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:element>
  </xsl:template>

  <xsl:template match="@class" mode="copy" priority="100">
    <xsl:param name="class" />
    <xsl:attribute name="class">
      <xsl:value-of select="." />
      <xsl:if test="normalize-space($class)">
        <xsl:text> </xsl:text>
        <xsl:value-of select="$class" />
      </xsl:if>
    </xsl:attribute>
  </xsl:template>

  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
