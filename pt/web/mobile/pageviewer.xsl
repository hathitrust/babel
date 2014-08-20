<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:import href="../pageviewer.xsl" />

  <xsl:template name="setup-extra-header">
    <meta name="viewport" content="width=device-width,initial-scale=1.0,maximum-scale=1.0,minimum-scale=1,user-scalable=0" />
    <link rel="stylesheet" type="text/css" href="/pt/css/screen.css" />

    <meta name="robots" content="noarchive" />

    <xsl:element name="link">
      <xsl:attribute name="rel">canonical</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:text>http://babel.hathitrust.org/cgi/pt?id=</xsl:text>
        <xsl:value-of select="$gHtId" />
      </xsl:attribute>
    </xsl:element>

    <xsl:text disable-output-escaping="yes">
    <![CDATA[<!--[if lte IE 8]><link rel="stylesheet" type="text/css" href="/pt/css/ie8.css" /><![endif]-->]]>
    </xsl:text>

    <script>
      var HT = HT || {};
      <!-- this should really become a JSON blob -->
      HT.params = {};
      <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
        <xsl:choose>
          <xsl:when test="@name = 'seq'">
            HT.params['<xsl:value-of select="@name" />'] = <xsl:value-of select="number(.)" />;
          </xsl:when>
          <!-- prevent XSS exploit when q1 is displayed in result page -->
          <xsl:when test="@name = 'q1'">
            HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="'foo'" />';
          </xsl:when>
          <xsl:otherwise>
            HT.params['<xsl:value-of select="@name" />'] = '<xsl:value-of select="." />';
          </xsl:otherwise>
        </xsl:choose>
      </xsl:for-each>
      HT.params.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
      HT.params.RecordURL = '<xsl:value-of select="concat('http://catalog.hathitrust.org/Record/', $gCatalogRecordNo)" />';
    </script>
    <xsl:call-template name="load_js_and_css"/>
    <xsl:call-template name="include_local_javascript" />

    <xsl:call-template name="setup-extra-header-extra" />
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <a class="offscreen skip-link" href="#main">Skip to main</a>
  </xsl:template>

  <xsl:template name="setup-extra-header-extra" />

  <xsl:template name="navbar" />
  <xsl:template name="sidebar" />

  <xsl:template name="contents">
    <!-- h2 ? -->
    <xsl:call-template name="pageviewer-contents" />
    <xsl:call-template name="get-access-statements" />
  </xsl:template>

  <xsl:template name="header">
    <div id="toolbar-header" class="cbp-spmenu-top cbp-spmenu cbp-spmenu-open">
      <nav class="cbp-spmenu-horizontal2">
        <a href="http://m.hathitrust.org/" class="ht-logo-link float-left"><span class="label">HathiTrust</span></a>
        <button id="action-table-of-contents" class="float-right">Contents</button>
        <a id="toolbar-back-to-record" href="http://catalog.hathitrust.org/Record/{$gCatalogRecordNo}">&lt;&lt; Record</a>
        <a id="toolbar-back-to-item" href="#">&lt;&lt; Back</a>
      </nav>
    </div>
  </xsl:template>

  <xsl:template name="footer">

    <div id="mobile-footer" class="container centered">
      <xsl:variable name="feedback-id">
        <xsl:call-template name="get-feedback-id" />
      </xsl:variable>
      <xsl:variable name="feedback-m">
        <xsl:call-template name="get-feedback-m" />
      </xsl:variable>
      <div class="row">
        <div class="span12">
          <p>
            <xsl:choose>
              <xsl:when test="$gLoggedIn = 'YES'">
                <a id="logout-link" class="btn btn-large btn-inverse" href="{//Header/LoginLink}">Logout</a>
              </xsl:when>
              <xsl:otherwise>
                <a class="btn btn-large btn-inverse" href="{//Header/LoginLink};skin=mobilewayf">Login</a>
              </xsl:otherwise>
            </xsl:choose>
          </p>
          <p class="links">
            <a href="/cgi/feedback" data-m="{$feedback-m}" data-toggle="feedback tracking-action" data-id="{$feedback-id}" data-tracking-action="Show Feedback">Feedback</a>
            <xsl:text> | </xsl:text>
            <a href="http://www.hathitrust.org/help_digital_library#Mobile" title="Help, Documentation, and FAQ">Help</a>
            <xsl:text> | </xsl:text>
            <a href="http://www.hathitrust.org/take_down_policy" title="item removal policy">Take-Down Policy</a>
          </p>
        </div>
      </div>
    </div>

    <div id="toolbar-footer" class="cbp-spmenu-bottom cbp-spmenu cbp-spmenu-open">
      <a href="#" id="action-toggle-toolbars"></a>
      <nav class="cbp-spmenu-horizontal">
          <button id="action-view-toggle"><span class="label">Plain Text</span></button>
          <button id="action-info"><span class="label">Info</span></button>
          <button id="action-settings"><span class="label">Settings</span></button>
          <button id="action-get-item"><span class="label">Get Item</span></button>
          <button id="action-search-inside"><span class="label">Search Inside</span></button>
      </nav>
      <div class="slider-park"></div>
    </div>


    <xsl:call-template name="build-settings-panel" />
    <xsl:call-template name="build-info-panel" />
    <xsl:call-template name="build-get-book-panel" />

  </xsl:template>

<!--   <div class="slider-horizontal">
    <div class="slider-track"></div>
  </div> -->

  <xsl:template name="build-search-inside">
    <div id="search-page" class="hide">
      <form class="form-inline centered form-search-inside" id="form-search-volume">
        <input type="text" id="mdpSearchInputBox" name="q1" maxlength="150" size="20" value="" class="input-medium" />
        <button class="btn">Find</button>
      </form>
      <div class="message"></div>
      <ul class="search-results">
      </ul>
      <div class="centered">
        <p>
          <button id="action-more-results" class="btn btn-large btn-inverse hide">More Results</button>
        </p>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-get-book-panel">
    <xsl:param name="pViewTypeList" select="//MdpApp/ViewTypeLinks"/>
    <div id="get-book-panel" class="modal hide bootbox" tabindex="-1" role="dialog" aria-labelledby="Get this Book" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Get this Book</h3>
      </div>
      <div class="modal-body">
        <div class="panel-group">
          <xsl:call-template name="find-in-library" />
        </div>
        <div class="panel-group">
          <xsl:if test="$gFullPdfAccessMessage='' or $gFullPdfAccessMessage='NOT_AFFILIATED' or $gFullPdfAccessMessage='RESTRICTED_SOURCE'">
            <xsl:choose>
              <xsl:when test="$gFullPdfAccessMessage='RESTRICTED_SOURCE'">
                <p>
                  <xsl:text>Download whole book (PDF)</xsl:text>
                  <br />
                  <i>Not available</i> (<a href="http://www.hathitrust.org/help_digital_library#FullPDF" target="_blank">why not?</a>)
                </p>
              </xsl:when>
              <xsl:otherwise>
                <a href="{//ViewTypeFullPdfLink}" class="btn btn-full btn-inverse btn-large" data-toggle="download" data-title="PDF" rel="{$gFullPdfAccess}" id="fullPdfLink">Download PDF</a>
                <a href="{//ViewTypeFullEpubLink}" class="btn btn-full btn-inverse btn-large" data-toggle="download" data-title="EPUB" rel="{$gFullPdfAccess}" id="epubLink">Download EPUB</a>
                <xsl:if test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                  <p class="pdfPartnerLoginLinkMessage">Partner login required</p>
                </xsl:if>
              </xsl:otherwise>
            </xsl:choose>
            
            <xsl:if test="$gFullPdfAccess = 'deny'">
              <div id="noPdfAccess">
                <xsl:choose>
                  <xsl:when test="$gLoggedIn = 'NO' and $gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                    <p class="larger">
                      <xsl:text>Partner institution members: </xsl:text>
                      <strong><a  href="{$pViewTypeList/ViewTypeFullPdfLink}">Login</a></strong>
                      <xsl:text> to download this book.</xsl:text>
                    </p>
                    <p>
                    <em>If you are not a member of a partner institution, 
                      <br />
                      whole book download is not available. 
                      (<a href="http://www.hathitrust.org/help_digital_library#Download" target="_blank">why not?</a>)</em>
                    </p>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_AFFILIATED'">
                    <p>
                      <xsl:text>Full PDF available only to authenticated users from </xsl:text>
                      <a href="http://www.hathitrust.org/help_digital_library#LoginNotListed" target="_blank">HathiTrust partner institutions.</a>
                    </p>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_PD'">
                    <p>
                      <xsl:text>In-copyright books cannot be downloaded.</xsl:text>
                    </p>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'NOT_AVAILABLE'">
                    <p>
                      <xsl:text>This book cannot be downloaded.</xsl:text>
                    </p>
                  </xsl:when>
                  <xsl:when test="$gFullPdfAccessMessage = 'RESTRICTED_SOURCE'">
                      <xsl:comment>Handled above</xsl:comment>
                  </xsl:when>
                  <xsl:otherwise>
                    <p>
                      <xsl:text>Sorry.</xsl:text>
                    </p>
                  </xsl:otherwise>
                </xsl:choose>
              </div>
            </xsl:if>
          </xsl:if>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-large" data-dismiss="modal">OK</button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-info-panel">

    <div id="info-panel" class="modal hide bootbox" tabindex="-1" role="dialog" aria-labelledby="Info" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Info</h3>
      </div>
      <div class="modal-body">
        <div class="panel-group">
          <p>
            <xsl:call-template name="BuildRDFaWrappedTitle">
              <xsl:with-param name="visible_title_string" select="$gTruncTitleString"/>
              <xsl:with-param name="hidden_title_string" select="$gFullTitleString"/>
            </xsl:call-template>
            <xsl:text> </xsl:text>

            <!-- not visible -->
            <xsl:call-template name="BuildRDFaWrappedAuthor"/>
          </p>
          <p class="smaller">
            <strong>Copyright: </strong><xsl:call-template name="BuildRDFaCCLicenseMarkup" />
          </p>            
        </div>
        <div class="panel-group">
          <p>
            <a href="http://m.hathitrust.org/Record/{$gCatalogRecordNo}" class="btn btn-full btn-inverse btn-large">Back to Record</a>
          </p>
        </div>
        <div class="panel-group">
          <p>
            <xsl:call-template name="action-feedback-link" />
          </p>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-large" data-dismiss="modal">OK</button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-settings-panel">
    <div id="settings-panel" class="modal hide bootbox" tabindex="-1" role="dialog" aria-labelledby="Settings" aria-hidden="true">
      <div class="modal-header">
        <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button>
        <h3 id="myModalLabel">Settings</h3>
      </div>
      <div class="modal-body">
        <div class="panel-group">
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-in">Zoom In</button>
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-out">Zoom Out</button>
        </div>
        <div class="panel-group">
          <button class="btn btn-full btn-inverse btn-large" id="action-zoom-reset">Fit to Page</button>
        </div>
        <div class="panel-group">
          <a href="{$gItemHandle}?urlappend=%3Bskin=default" class="btn btn-full btn-inverse btn-large">Regular Site</a>
        </div>
      </div>
      <div class="modal-footer">
        <button class="btn btn-primary btn-large" data-dismiss="modal">OK</button>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="find-in-library">
    <xsl:variable name="x" select="$gMdpMetadata/datafield" />
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
      <xsl:variable name="oclc-number">
        <xsl:choose>
          <xsl:when test="contains(.,'OCoLC)ocm')">
            <xsl:value-of select="substring-after(.,'OCoLC)ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'OCoLC')">
            <xsl:value-of select="substring-after(.,'OCoLC)')"/>
          </xsl:when>
          <xsl:when test="contains(.,'oclc')">
            <xsl:value-of select="substring-after(.,'oclc')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocm')">
            <xsl:value-of select="substring-after(.,'ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocn')">
            <xsl:value-of select="substring-after(.,'ocn')"/>
          </xsl:when>
          <xsl:otherwise/>
        </xsl:choose>
      </xsl:variable>
      <xsl:element name="a">
        <xsl:attribute name="class">btn btn-full btn-inverse btn-large</xsl:attribute>
        <xsl:attribute name="data-toggle">tracking</xsl:attribute>
        <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
        <xsl:attribute name="data-tracking-action">PT Find in a Library</xsl:attribute>
        <xsl:attribute name="data-tracking-label"><xsl:value-of select="$oclc-number" /></xsl:attribute>
        <xsl:attribute name="href">
          <xsl:text>http://www.worldcat.org/oclc/</xsl:text>
          <xsl:value-of select="$oclc-number" />
        </xsl:attribute>
        <xsl:text>Find in a library</xsl:text>
      </xsl:element>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="action-feedback-link">
    <xsl:variable name="feedback-id">
      <xsl:call-template name="get-feedback-id" />
    </xsl:variable>
    <xsl:variable name="feedback-m">
      <xsl:call-template name="get-feedback-m" />
    </xsl:variable>
    <a class="btn btn-full btn-inverse btn-large" href="/cgi/feedback?page=form" data-m="{$feedback-m}" data-toggle="feedback tracking-action" data-id="{$feedback-id}" data-tracking-action="Show Feedback">Feedback</a>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="action-search-volume">
    <h3 class="offscreen">Search in this volume</h3>
    <form class="form-inline" method="get" id="form-search-volume">
      <xsl:attribute name="action">
        <xsl:choose>
          <xsl:when test="$gUsingSearch = 'true'">search</xsl:when>
          <xsl:otherwise>pt/search</xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
      <label for="input-search-text">Search in this text </label>
      <input id="input-search-text" name="q1" type="text" class="input-small">
        <xsl:if test="$gHasOcr!='YES'">
          <xsl:attribute name="disabled">disabled</xsl:attribute>
        </xsl:if>
        <xsl:attribute name="placeholder">
          <xsl:choose>
            <xsl:when test="$gHasOcr = 'YES'">
              <!-- <xsl:text>Search in this text</xsl:text> -->
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>No text to search in this item</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        <xsl:attribute name="value">
          <xsl:if test="$gHasOcr = 'YES'">
            <xsl:value-of select="$gCurrentQ1" />
          </xsl:if>
        </xsl:attribute>
      </input>
      <button type="submit" class="btn">Find</button>
      <xsl:apply-templates select="//MdpApp/SearchForm/HiddenVars" />
      <input type="hidden" name="view" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']}" />
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']">
        <input type="hidden" name="seq" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']}" />
      </xsl:if>
      <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']">
        <input type="hidden" name="num" value="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='num']}" />
      </xsl:if>
    </form>
  </xsl:template>

  <xsl:template name="get-access-statements">
    <!-- access banners are hidden and exposed by access_banner.js -->
    <xsl:if test="$gFinalAccessStatus='allow' and $gInCopyright='true'">
      <xsl:choose>
        <xsl:when test="$gLoggedIn='YES'">
          <xsl:choose>
            <xsl:when test="$gSSD_Session='true'">
              <xsl:call-template name="access_banner_ssd"/>
            </xsl:when>
            <xsl:otherwise>
              <xsl:call-template name="access_banner"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="access_banner_local"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="access_banner_ssd">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.<br /><br />A <xsl:element name="a"><xsl:attribute name="href">/cgi/ssd?id=<xsl:value-of select="$gHtId"/></xsl:attribute>text-only version</xsl:element> is also available. More information is available at <a href="http://www.hathitrust.org/accessibility">HathiTrust Accessibility.</a></p></div></div>
  </xsl:template>

  <xsl:template name="access_banner">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>Hi <xsl:value-of select="$gUserName"/>! This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="access_banner_local">
    <div id="accessBannerID" class="hidden"><div class="accessBannerText"><p>This work is in copyright. You have full view access to this item based on your affiliation or account privileges.<br /><br />Information about use can be found in the <a href="http://www.hathitrust.org/access_use#ic-access">HathiTrust Access and Use Policy</a>.</p></div></div>
  </xsl:template>

  <xsl:template name="html-tag-extra-attributes" />
  <xsl:template name="include_extra_js_and_css" />
  <xsl:template name="setup-head" />
  <xsl:template name="item-viewer" />

  <xsl:template name="get-title-suffix">
    <xsl:text>HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="get-tracking-category">PT</xsl:template>

  <xsl:template name="access-overview" />

</xsl:stylesheet>

