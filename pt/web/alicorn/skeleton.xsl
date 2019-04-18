<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet [ 
<!ENTITY nbsp "&#160;"> 
<!ENTITY copy "&#169;">
<!ENTITY raquo "»"> 
<!ENTITY laquo "«"> 
]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  xmlns:exsl="http://exslt.org/common"
  xmlns:h="http://www.hathitrust.org"
  xmlns="http://www.w3.org/1999/xhtml"
  exclude-result-prefixes="h exsl"
  extension-element-prefixes="exsl">
  
  <xsl:variable name="timestamp" select="'?_=1548180869'" />

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
      <xsl:call-template name="setup-html-data-attributes" />
      <xsl:attribute name="class">
        <xsl:text>no-js </xsl:text>
        <xsl:call-template name="search-target-class" />
        <xsl:call-template name="setup-html-class" />
      </xsl:attribute>
      <xsl:call-template name="setup-html-attributes" />

      <head>

        <xsl:comment>IE PRE-SETUP</xsl:comment>

        <xsl:call-template name="load_base_js"/>

        <!-- <script type="text/javascript" src="/common/unicorn/js/head.min.js"></script> -->
        <!-- <script type="text/javascript" src="/common/unicorn/js/common.js"></script> -->
        <script type="text/javascript" src="/common/alicorn/js/utils.js"></script>

        <!-- <link rel="stylesheet" type="text/css" href="/common/unicorn/css/common.css{$timestamp}" /> -->
        <link rel="stylesheet" type="text/css" href="/common/alicorn/css/main.css" />
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/meyer-reset/2.0/reset.min.css" />
        <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous" />

        <script type="text/javascript" src="/pt/alicorn/js/utils.js"></script>


        <xsl:call-template name="setup-extra-header" />

        <xsl:comment>IE POST-SETUP</xsl:comment>

        <title>
          <xsl:call-template name="setup-page-title" />
        </title>

      </head>

      <body>
        <xsl:attribute name="class">
          <xsl:call-template name="setup-body-class" />
        </xsl:attribute>

        <h1 class="offscreen"><xsl:call-template name="setup-page-title" /></h1>

        <xsl:call-template name="debug-messages" />

        <xsl:call-template name="skip-to-main-link" />

        <!-- <xsl:call-template name="access-overview" /> -->

        <div id="root">

          <xsl:call-template name="navbar" />
          <xsl:call-template name="header" />

          <xsl:call-template name="page-contents" />

          <xsl:call-template name="footer" />
        </div>
      </body>

    </html>

  </xsl:template>

  <xsl:template name="skip-to-main-link" />

  <xsl:template name="setup-html-class" />
  <xsl:template name="setup-html-attributes" />
  <xsl:template name="setup-extra-header" />
  <xsl:template name="setup-body-class" />
  <xsl:template name="setup-html-data-attributes" />

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
    <div class="navbar navbar-static-top navbar-inverse">
      <div class="navbar-inner" id="navbar-inner">
        <h2 class="offscreen">
          <xsl:text>Navigation links for help, collections</xsl:text>
          <xsl:if test="$gLoggedIn = 'YES'">, logout</xsl:if>
        </h2>
        <ul id="nav" class="nav">
          <li><a href="https://www.hathitrust.org">Home</a></li>
          <li><a href="https://www.hathitrust.org/about">About</a>
            <ul>
              <li><a href="https://www.hathitrust.org/partnership">Our Partnership</a></li>
              <li><a href="https://www.hathitrust.org/digital_library">Our Digital Library</a></li>
              <li><a href="https://www.hathitrust.org/collaborative-programs">Our Collaborative Programs</a></li>
              <li><a href="https://www.hathitrust.org/htrc">Our Research Center</a></li>
              <li><a href="https://www.hathitrust.org/news_publications">News &amp; Publications</a></li>
            </ul>
          </li>
          <li><a href="//babel.hathitrust.org/cgi/mb">Collections</a></li>
          <li class="divider-vertical"></li>
          <li class="help"><a href="https://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
        </ul>
        <xsl:if test="$gLoggedIn = 'YES'">
          <ul id="person-nav" class="nav pull-right">
            <!-- <li><span>Hi <xsl:value-of select="//Header/UserName" />!</span></li> -->
            <li>
              <span>
                <xsl:value-of select="//Header/UserAffiliation" />
                <xsl:if test="//Header/ProviderName">
                  <xsl:text> (</xsl:text>
                  <xsl:value-of select="//Header/ProviderName" />
                  <xsl:text>)</xsl:text>
                </xsl:if>
              </span>
            </li>
            <li><a href="{//Header/PrivCollLink}">My Collections</a></li>
            <li><a id="logout-link" href="{//Header/LoginLink}">Logout</a></li>
          </ul>
        </xsl:if>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="header">
    <div class="container centered header clearfix" id="header">
      <h2 class="offscreen">Navigation links for searching HathiTrust, login</h2>
      <div class="logo">
        <a href="https://www.hathitrust.org"><span class="offscreen">HathiTrust Digital Library</span></a>
      </div>

      <xsl:call-template name="header-search-form" />

      <xsl:call-template name="login-block" />
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
    <xsl:variable name="inst" select="/MBooksTop/MBooksGlobals/InstitutionName"/>
    <footer class="site-navigation" role="contentinfo">
      <nav>
        <xsl:if test="$inst != ''">
          <ul class="nav">
            <li>
              <span><xsl:value-of select="$inst" /><br />Member, HathiTrust
              </span>
            </li>
          </ul>
        </xsl:if>
        <ul class="nav pull-right">
          <li><a href="https://www.hathitrust.org/">Home</a></li>
          <li><a href="https://www.hathitrust.org/about">About</a></li>
          <li><a href="/cgi/mb">Collections</a></li>
          <li><a href="https://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
          <li><a href="https://m.hathitrust.org">Mobile</a></li>
          <li><a href="https://www.hathitrust.org/take_down_policy">Take-Down Policy</a></li>
          <li><a href="https://www.hathitrust.org/privacy">Privacy</a></li>
          <li><a href="https://www.hathitrust.org/contact">Contact</a></li>
        </ul>
      </nav>
    </footer>
  </xsl:template>

  <xsl:template name="li-feedback">
    <xsl:variable name="feedback-id">
      <xsl:call-template name="get-feedback-id" />
    </xsl:variable>
    <xsl:variable name="feedback-m">
      <xsl:call-template name="get-feedback-m" />
    </xsl:variable>
    <li><a href="/cgi/feedback?page=form" data-m="{$feedback-m}" data-toggle="feedback tracking-action" data-id="{$feedback-id}" data-tracking-action="Show Feedback">Feedback</a></li>
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
    <label>
      <input type="checkbox" name="ft" value="ft">
        <xsl:if test="normalize-space($checked)">
          <xsl:attribute name="checked">checked</xsl:attribute>
        </xsl:if>
      </input>
      Full view only
    </label>
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

</xsl:stylesheet>
