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

  <!-- Global Variables -->
  <xsl:variable name="gOrphanCandidate" select="/MBooksTop/MBooksGlobals/OrphanCandidate"/>
  <xsl:variable name="gInCopyright" select="/MBooksTop/MBooksGlobals/InCopyright"/>
  <xsl:variable name="gHeld" select="/MBooksTop/MBooksGlobals/Holdings/Held"/>
  <xsl:variable name="gBrittleHeld" select="/MBooksTop/MBooksGlobals/Holdings/BrittleHeld"/>
  <xsl:variable name="gHTDEV" select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>

  <xsl:variable name="gIsCRMS">
    <xsl:choose>
      <xsl:when test="contains(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='ui'], 'crms')">true</xsl:when>
      <xsl:otherwise>false</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="setup-html-class">
    <xsl:if test="$gHTDEV != ''">
      <xsl:text> htdev </xsl:text>
    </xsl:if>
    <xsl:if test="$gIsCRMS = 'true'">
      <xsl:text> crms </xsl:text>
    </xsl:if>
    <xsl:choose>
      <xsl:when test="//Param[@name='skin']">
        <xsl:text> skin-</xsl:text><xsl:value-of select="//Param[@name='skin']" />
      </xsl:when>
      <xsl:otherwise><xsl:text> skin-default</xsl:text></xsl:otherwise>
    </xsl:choose>
    <xsl:call-template name="setup-login-status-class" />
    <xsl:call-template name="setup-extra-html-class" />
  </xsl:template>

  <xsl:template name="setup-login-status-class">
    <xsl:if test="$gLoggedIn = 'YES'">
      <xsl:text> logged-in </xsl:text>
    </xsl:if>
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
    <xsl:call-template name="setup-extra-html-attributes" />
  </xsl:template>

  <xsl:template name="setup-extra-html-attributes" />
  <xsl:template name="setup-extra-html-class" />

  <xsl:variable name="header-search-params-searchtype" select="//HeaderSearchParams/Field[@name='searchtype']" />

  <xsl:template name="load-firebird-assets">

    <xsl:for-each select="//ApplicationAssets[@slot='common']/Stylesheet">
      <link rel="stylesheet" href="{.}" />
    </xsl:for-each>

    <script type="text/javascript">
      let head = document.head;

      <xsl:text disable-output-escaping="yes">
      window.firebirdErrorHandler = function(event) {
        event.preventDefault();
        if ((event.target &amp;&amp; event.target.src &amp;&amp; event.target.src.indexOf('/firebird/dist/') != -1) || (event.filename &amp;&amp; event.filename.indexOf('/firebird/dist/' != -1))) {
          if ( ! HT.service_domain ) {
            console.log(event);
            alert("Sorry, this browser version is not supported.");
            window.removeEventListener('error', firebirdErrorHandler);
          }
        }
      };
      </xsl:text>
      
      window.addEventListener('error', window.firebirdErrorHandler);

      function addScript(options) {
        let scriptEl = document.createElement('script');
        if ( options.crossOrigin ) { scriptEl.crossOrigin = options.crossOrigin; }
        if ( options.type ) { scriptEl.type = options.type; }
        scriptEl.src = options.href;
        scriptEl.onerror = firebirdErrorHandler;
        document.head.appendChild(scriptEl);
      }
      function addStylesheet(options) {
        let linkEl = document.createElement('link');
        linkEl.rel = 'stylesheet';
        linkEl.href = options.href;
        document.head.appendChild(linkEl);
      }

      if ( ! Array.prototype.at ) {
        addScript({ href: 'https://polyfill.io/v3/polyfill.min.js?features=Array.prototype.at' });
      }
    
      let firebird_config = localStorage.getItem('firebird-reader') || '';
      if ( firebird_config == 'proxy' ) {
        addScript({ href: `//${location.host}/js/main.js`, type: 'module' });
      } else if ( firebird_config.match('localhost') ) {
        addScript({ href: `//${firebird_config}/js/main.js`, type: 'module' });
      } else {
        <xsl:for-each select="//ApplicationAssets[@slot='pt']/Stylesheet">
          addStylesheet({ href: `<xsl:value-of select="." />` });
        </xsl:for-each>
        <xsl:for-each select="//ApplicationAssets[@slot='pt']/Script">
          addScript({ href: `<xsl:value-of select="." />`, type: 'module' });
        </xsl:for-each>
      }        
    </script>
  </xsl:template>

  <xsl:template name="build-root-container">
  </xsl:template>

  <xsl:template name="build-collections-block">
    <div id="collections-block" class="d-none" aria-hidden="true">
      <select aria-hidden="true" tabindex="-1" data-use="collections">
        <xsl:for-each select="//AddToCollectionForm/CollectionSelect/Option">
          <option value="{Value}"><xsl:value-of select="Label" /></option>
        </xsl:for-each>
      </select>
      <select aria-hidden="true" tabindex="-1" data-use="featured-collections">
        <xsl:for-each select="//FeaturedCollectionList/Coll">
          <option value="{Url}"><xsl:value-of select="CollName" /></option>
        </xsl:for-each>
      </select>
      <select aria-hidden="true" tabindex="-1" data-use="in-collections">
        <xsl:for-each select="//CollectionList/Coll">
          <option value="{Url}"><xsl:value-of select="CollName" /></option>
        </xsl:for-each>
      </select>
    </div>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <meta name="robots" content="noarchive" />

    <xsl:call-template name="setup-social-twitter" />
    <xsl:call-template name="setup-social-facebook" />

    <xsl:element name="link">
      <xsl:attribute name="rel">canonical</xsl:attribute>
      <xsl:attribute name="href">
        <xsl:text>https://babel.hathitrust.org/cgi/pt?id=</xsl:text>
        <xsl:value-of select="$gHtId" />
      </xsl:attribute>
    </xsl:element>

    <script>
      var HT = HT || {};
      <xsl:value-of select="//ApplicationParams" />
      HT.params.download_progress_base = '<xsl:value-of select="//DownloadProgressBase" />';
      HT.params.RecordURL = '<xsl:value-of select="concat('https://catalog.hathitrust.org/Record/', $gCatalogRecordNo)" />';
    </script>
    <xsl:call-template name="setup-extra-header--reader" />

    <xsl:call-template name="setup-extra-header-extra" />
  </xsl:template>

  <xsl:template name="setup-extra-header--reader" />

  <xsl:template name="configure-find-in-library">
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
      <xsl:value-of select="concat('HT.params.externalLinks.push({type: &quot;oclc&quot;, href: &quot;https://www.worldcat.org/oclc/', $oclc-number, '&quot;});')" />
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="configure-access-type">
    <xsl:if test="//AccessType">
      <xsl:variable name="available" select="//AccessType/Granted = 'TRUE'" />
      <xsl:text>HT.params.accessType = {};</xsl:text>
      <xsl:value-of select="concat('HT.params.accessType.granted =', $available, ';')" />
      <xsl:value-of select="concat('HT.params.accessType.debug = &quot;', //AccessType/Available, '&quot;;')" />
      <xsl:value-of select="concat('HT.params.accessType.name = &quot;', //AccessType/Name, '&quot;;')" />
      <xsl:value-of select="concat('HT.params.accessType.role = &quot;', //AccessType/Role, '&quot;;')" />
      <xsl:value-of select="concat('HT.params.accessType.action = &quot;', //AccessType/Action, '&quot;;')" />
      <xsl:if test="//AccessType/Expires">
        <xsl:value-of select="concat('HT.params.accessType.expires = ', //AccessType/Expires, ';')" />
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-social-twitter">
    <meta name="twitter:card">
      <xsl:attribute name="content">
        <xsl:choose>
          <xsl:when test="//CurrentPageImageSource">
            <xsl:text>summary_large_image</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>summary</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </xsl:attribute>
    </meta>
    <meta name="twitter:site" content="@HathiTrust" />
    <meta name="twitter:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta name="twitter:description">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta name="twitter:image" content="{//CurrentPageImageSource}" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="setup-social-facebook">
    <meta property="og:type" content="website" />
    <meta property="og:site_name" content="HathiTrust" />
    <meta property="og:url">
      <xsl:attribute name="content">
        <xsl:call-template name="get-sharable-handle-link" />
      </xsl:attribute>
    </meta>
    <meta property="og:title">
      <xsl:attribute name="content">
        <xsl:call-template name="GetMaybeTruncatedTitle">
          <xsl:with-param name="titleString" select="$gTitleString"/>
          <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
          <xsl:with-param name="maxLength" select="128"/>
        </xsl:call-template>
      </xsl:attribute>
    </meta>

    <xsl:if test="//CurrentPageImageSource">
      <meta property="og:image" content="{//CurrentPageImageSource}" />
    </xsl:if>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
  </xsl:template>

  <xsl:template name="setup-extra-header-extra" />

  <xsl:template name="get-page-title">
    <xsl:call-template name="PageTitle">
      <xsl:with-param name="suffix">
        <xsl:call-template name="get-title-suffix" />
      </xsl:with-param>
    </xsl:call-template>
  </xsl:template>

  <xsl:template name="get-title-suffix">
    <!-- <xsl:text>HathiTrust Digital Library</xsl:text> -->
  </xsl:template>

</xsl:stylesheet>
