<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>Hathi Trust Digital Library - Search Results</title>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_local_javascript"/>        
        <xsl:call-template name="debug_CSS"/>        
      </head>
      
      <body class="yui-skin-sam" onLoad="initCheckall()">
        <div id="mbMasterContainer">
          <div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
          </div>
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>
          
          <xsl:call-template name="header"/>
          <xsl:call-template name="DisplaySearchWidgetLogic"/>
          
          <div id="mbContentContainer" class="mbSearchResultsContainer">            
            <h2 class="SkipLink">Main Content</h2>
            
            <!-- Warning message suppressed for now.  Can't get paging
                 to properly handle 'well_formed' search_result_data.
                 Probably something to do with redirection and reuse of
                 results -->
            <!-- xsl:call-template name="QueryRewrite"/ -->
            
            <div class="SearchAndRefine">
              <xsl:call-template name="SearchResults_status"/>
              <div class="refine">
                <xsl:call-template name="decideDisplayRefine"/>
              </div>
            </div>
            
            <div id="main">
              <xsl:choose>
                <xsl:when test="SearchResults/Item">
                  <xsl:call-template name="DisplayContent"/>
                </xsl:when>
                <xsl:when test="SearchResults/SolrError[normalize-space(.)]">
                  <xsl:call-template name="SolrError"/>
                </xsl:when>
                <xsl:when test="SearchResults/CollEmpty = 'TRUE'">
                  <xsl:call-template name="EmptyCollection"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="NoResults"/>
                </xsl:otherwise>
              </xsl:choose>
            </div>
          </div>
          
          <xsl:call-template name="footer"/>          
          <xsl:call-template name="google_analytics" /> 
          
        </div>
      </body>
    </html>
  </xsl:template>
  
  <!-- TEMPLATE -->
  <xsl:template name="QueryRewrite">
    <xsl:if test="/MBooksTop/SearchResults/WellFormed!=1">
      <div class="SearchResults_status">
        <div class="infoAlert">
          One of the operators: <span>AND</span>, <span>OR</span>, <span>)</span>, or <span>(</span> was placed incorrectly in your query. Your query was changed and submitted as: 
          <span>
            <xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/>
          </span>
        </div>
      </div>
    </xsl:if>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="MBooksCol">
    <div class="MBooksCol">
      <h2>
        <xsl:value-of select="/MBooksTop/CollectionOwner"/>
        <xsl:text>'s </xsl:text>
        <a>
          <xsl:attribute name="href">
            <xsl:value-of select="/MBooksTop/OperationResults/CollHref"/>
          </xsl:attribute>
          <span class="colName"><xsl:value-of select="$coll_name"/></span>
        </a>
        <xsl:text> collection</xsl:text>
        <xsl:if test="$debug='YES'">
          <span class="debug">DEBUG </span>
        </xsl:if>
      </h2>
    </div>
  </xsl:template>
  
  <!-- TEMPLATE -->
  <xsl:template name="SearchResults_status">
    <div class="SearchResults_status">
      <xsl:if test="$debug='YES'">
        <span id="TempDebug">SEARCH RESULTS</span>
      </xsl:if>
      
      <span>
        <xsl:text>Search Results: </xsl:text>
      </span>
      
      <xsl:value-of select="$AllItemsCount"/>
      <xsl:text> items found for </xsl:text>
      <span>
        <xsl:value-of select="/MBooksTop/QueryString"/>
      </span>

      <xsl:text> in </xsl:text>
      <xsl:value-of select="/MBooksTop/CollectionOwner"/>
      <xsl:text>'s </xsl:text>
      <xsl:value-of select="/MBooksTop/CollectionName"/>
      <xsl:text> collection</xsl:text>
      <xsl:if test="string-length(/MBooksTop/MBooksGlobals/EnvHT_DEV)&gt;1">
        <xsl:text> in </xsl:text>
        <xsl:value-of select="/MBooksTop/SearchResults/QueryTime"/>
        <xsl:text> sec.</xsl:text>
      </xsl:if>
      
      <xsl:if test="$debug='YES'">
        <span class="debug">DEBUG </span>
      </xsl:if>
      
    </div>
  </xsl:template>
  
  
  <!-- TEMPLATE -->
  <xsl:template name="EditCollectionWidget">
    <!-- not used by list_search_results so empty template here to
         allow list_items and list_search_results to share code -->
  </xsl:template>
  
  <!-- TEMPLATE -->
  <xsl:template name="DisplaySearchWidgetLogic">
    <div class="mainsearch">
      <xsl:if test="/MBooksTop/SearchResults/CollEmpty='FALSE'">
        <xsl:call-template name="SearchWidget"/>
      </xsl:if>
    </div>    
  </xsl:template>
  
  <!-- TEMPLATE -->
  <xsl:template name="subnav_header">
    <xsl:call-template name="MBooksCol"/>
  </xsl:template>  
  
  <!-- TEMPLATE -->
  <xsl:template name="NoResults">    
    <div id="ColContainer">
      <div class="ColContent">
        <xsl:variable name="AllIndexedStatus">
          <xsl:value-of select="/MBooksTop/SearchWidget/AllItemsIndexed"/>
        </xsl:variable>
        <div id="ListSearchInfoAlert">            
          <xsl:if test="$AllIndexedStatus = 'FALSE'">
            <xsl:attribute name="class">
              <xsl:text>infoAlert</xsl:text>
            </xsl:attribute>
            <xsl:call-template name="AllIndexedMsg">
              <xsl:with-param name="AllIndexedStatus">
                <xsl:value-of select="/MBooksTop/SearchWidget/AllItemsIndexed"/>
              </xsl:with-param>
              <xsl:with-param name="IndexMsg">Not all items in your collection are currently available for searching. Try again soon.</xsl:with-param>
              <xsl:with-param name="IndexMsgClass">IndexMsgSearchResults</xsl:with-param>
            </xsl:call-template>
          </xsl:if>
        </div>
        <div class="error">
          <xsl:text>Your search for "</xsl:text>
          <xsl:value-of select="/MBooksTop/QueryString"/>
          <xsl:text>" in the </xsl:text>
          <span class="colName"><xsl:value-of select="$coll_name"/></span> 
          <xsl:text> collection returned zero hits.</xsl:text> 
        </div>
      </div>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="SolrError">
    <!-- if debug flags or env variable on then show the whole message otherwise some text
         SUZ fix -->
    <span class="debug">
      <xsl:value-of select = "/MBooksTop/SearchResults/SolrError"/>
    </span>
    <div class="error">
      <xsl:text>There was a problem with searching.  Try again soon.</xsl:text>
    </div>
  </xsl:template>
  
</xsl:stylesheet>
