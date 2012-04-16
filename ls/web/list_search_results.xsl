<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <!--## Global Variables ##-->

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
      <input  name="sort" type="hidden">
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

  <!-- ## end Global Variables ##-->


  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>Hathi Trust Digital Library - Full-text Search</title>
        <!-- jQuery from the Google CDN -->
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>


        
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_local_javascript"/>
        <xsl:call-template name="debug_CSS"/>
        <!-- local css to be incorporated in global MBooks css later
             added here to overide common-web/MBooksCol.css-->
        <link rel="stylesheet" type="text/css" href="/ls/web/ls.css" />


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

          <div id="mbContentContainer" class="mbSearchResultsContainer">
          <h2 class="SkipLink">Main Content</h2>

            <div id="main">
              <!--     XXX          <div class="betasearch">-->
                <xsl:call-template name="SearchWidget"/>
                <!--</div>-->
                <!--XXX              <div class="betasearchinfo">  
              </div>-->
              <xsl:if test="/MBooksTop/AdvancedSearch/isAdvanced='false'">
                <xsl:choose>
                  <xsl:when test="SearchResults/WellFormed!=1">
                    <xsl:call-template name="QueryRewrite">
                      <xsl:with-param name="ProcessedQueryString">
                        <xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/>                    
                      </xsl:with-param>
                    </xsl:call-template>
                  </xsl:when>

                  <xsl:when test="SearchResults/UnBalancedQuotes=1">
                    <xsl:call-template name="QueryRewriteUnbalanced">
                        <xsl:with-param name="ProcessedQueryString">
                          <xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/>                    
                        </xsl:with-param>
                      </xsl:call-template>     
                    </xsl:when>
                </xsl:choose>
                
            </xsl:if>
              <div class="SearchAndRefine">
                <!--XXX this is moved into search results area.  What do we do with these two divs? -->
                <!--<xsl:call-template name="SearchResults_status"/>-->
                <div class="refine">

                </div>
              </div>
              
              <xsl:choose>
                <xsl:when test="SearchResults/Item">
                  <xsl:call-template name="DisplayContent"/>
                </xsl:when>
                <xsl:when test="SearchResults/SolrError[normalize-space(.)]">
                  <xsl:call-template name="SolrError"/>
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

        <!-- this is where we are supposed to put jquery javascript, check with roger -->
        <script type="text/javascript" src="../ls/web/js/ls_misc.js"></script>

        <!--
    <xsl:text disable-output-escaping="yes">&lt;script type="text/javascript"&gt;</xsl:text>
    <xsl:value-of select="/MBooksTop/MBooksGlobals/LoggedInJs"/>
    <xsl:text disable-output-escaping="yes"> &lt;/script&gt;</xsl:text>
-->
      </body>
    </html>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="subnav_header">
    <xsl:call-template name="HathiCol"/>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="DisplayContent">
          <!-- for debugging facets-->
          <div id="lsSidebarContainer" class="ls_box">

          <xsl:call-template name="facets"/>
        </div>

    <div id="ColContainer" class="ls">
      <div class="ColContent">

        <!-- Added: YUI overlay is displayed here -->
        <div id="errormsg">
          <div class="bd"></div>
        </div>

        <xsl:call-template name="SearchResultList"/>
      </div>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="SearchResultList">
    <div class="actions">

      <!-- 7/7/11 suz wants message about how many found in search result box-->
      <xsl:call-template name="SearchResults_status"/>

      <form id="form_ls1" name="form_ls1" method="get" action="ls?">
        <div name="hiddenParams">
          <xsl:call-template name="GetHiddenParams"/>
        </div>
        <div id="actionsRow1">
          <xsl:call-template name="BuildSortWidget"/>
          <xsl:call-template name="BuildPagingControls">
            <xsl:with-param name="which_paging" select="'top_paging'"/>
          </xsl:call-template>
        </div>
      </form>

      <div id="form_lsCB" name="form_lsCB" >
        <div id="actionsRow2">
          <div class="selectAll">Select all on page <input type="checkbox" id="checkAll"/></div>
          <xsl:call-template name="BuildItemSelectActions"/>
        </div>
      </div>
    
      <table id="itemTable" class="itemTable">
        <xsl:for-each select="SearchResults/Item">
          <xsl:call-template name="BuildItemChunk"/>
        </xsl:for-each>
      </table>
          
      <div id="listisFooter">
        <form id="form_ls2" name="form_ls2" method="get" action="ls?">
          <div name="hiddenParams">
            <xsl:call-template name="GetHiddenParams"/>
          </div>
          <xsl:call-template name="BuildPagingControls">
            <xsl:with-param name="which_paging" select="'bottom_paging'"/>
          </xsl:call-template>
        </form>
      </div>
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
      <!-- this should be all/so/or ft cound depending -->
      <xsl:call-template name="getTotalCount"/>
      <xsl:text> items found for</xsl:text>
      

      <xsl:call-template name="advanced"/>          
      <xsl:if test="/MBooksTop/AdvancedSearch/isAdvanced='true'">
        <div class="modify_link" id="modify_link">
          <a>
            <xsl:attribute name="href">
              <xsl:value-of select="AdvancedSearch/ModifyAdvancedSearchURL"/>
            </xsl:attribute>
            <xsl:text> Revise this advanced search</xsl:text>
          </a>
        </div>
      </xsl:if>


      <span class="debug">
      <xsl:text>
        (in </xsl:text>
      <xsl:value-of select="/MBooksTop/SearchResults/QueryTime"/>
      <xsl:text> sec.)</xsl:text>
    </span>

      <xsl:if test="$debug='YES'">
        <span class="debug">DEBUG </span>
      </xsl:if>

    </div>

  </xsl:template>

  <xsl:template name="getTotalCount">
      <xsl:value-of select="/MBooksTop/LimitToFullText/TotalCount"/>
</xsl:template>



  <xsl:template name="advanced">

      <xsl:variable name="SingleQuery">
        <xsl:if test="count(/MBooksTop/AdvancedSearch/group/Clause) = 1">
          <xsl:text>true</xsl:text>
        </xsl:if>
      </xsl:variable>
      <xsl:variable name="SingleGroup">
        <xsl:if test="count(/MBooksTop/AdvancedSearch/group) = 1">
          <xsl:text>true</xsl:text>
        </xsl:if>
      </xsl:variable>

      <xsl:choose>
        <xsl:when test="$SingleGroup='true'">
          <xsl:for-each select="/MBooksTop/AdvancedSearch/group">
            <xsl:call-template  name= "advancedGroup"/>
          </xsl:for-each>
        </xsl:when>
        <xsl:otherwise>
          <xsl:for-each select="/MBooksTop/AdvancedSearch/group[1]">
            <div class="advancedGroup">        
            <xsl:call-template  name= "advancedGroup"/>        
            </div>
          </xsl:for-each>

          <div class="op3">
            <xsl:value-of select="/MBooksTop/AdvancedSearch/OP3"/>
          </div>

          <xsl:for-each select="/MBooksTop/AdvancedSearch/group[2]">
            <div class="advancedGroup">        
            <xsl:call-template  name= "advancedGroup"/>        
            </div>
          </xsl:for-each>

        </xsl:otherwise>          
        </xsl:choose>

    </xsl:template>

    <xsl:template name="advancedGroup">
      <!-- this deals with grouping then calls template "advancedContent" for each clause
           if there is only 1 clause in the group just spit it out
           else add parens and the op properly formatted
           -->
      <xsl:choose>
        <xsl:when test="count(Clause)= 1">
          <xsl:for-each select="Clause">
            <xsl:call-template name="advancedContent"/>        
          </xsl:for-each>
        </xsl:when>
        <xsl:otherwise>
          <div class="advGroupFoo">
            <xsl:for-each select="Clause">
              <div class="clause">
              <xsl:call-template name="advancedContent"/>        
            </div>
          </xsl:for-each>
          </div>
          </xsl:otherwise>
        </xsl:choose>
    </xsl:template>


    <xsl:template name= "advancedContent">


      <xsl:if test="count(/MBooksTop/AdvancedSearch/group/Clause) &gt; 1">
        <a>
          <xsl:attribute name="href">
            <xsl:value-of select="unselectURL"/>          
          </xsl:attribute>
            <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
        </a>
   
   
        <xsl:if test="count(../Clause) &gt; 1">
          <span class="op">
            <xsl:text> </xsl:text>
            <xsl:value-of select="OP"/>
            <xsl:text> </xsl:text>
          </span>
        </xsl:if>
   

      </xsl:if>

   
      <!--XXX  check well formed stuff?
           Also need to make the punctuation only happen if there is an anyall
           -->
      
      <xsl:text> </xsl:text>      
      <xsl:if test="normalize-space(AnyAll)">
        <span class="AnyAll" >
        <xsl:value-of select="AnyAll"/>
        </span>
        <xsl:text>: </xsl:text>
      </xsl:if>

      <span>
        <xsl:value-of select="Query"/>
      </span>
     

      <xsl:text> in </xsl:text>
      <!-- replace em with css -->
      
      <em>
        <xsl:value-of select="Field"/>
      </em>
      <!--XXX Dont put in period at all or  only put period in if search succeeded -->
      <!--
      <xsl:if test="/MBooksTop/SearchResults/Item">
        <xsl:text>.  </xsl:text>
      </xsl:if>
      -->
      
      <xsl:if test="(/MBooksTop/AdvancedSearch/isAdvanced='true') and  (WellFormed!=1)">
        <div class="advancedMsg">
        <xsl:call-template name="QueryRewrite">
          <xsl:with-param name="ProcessedQueryString">
            <xsl:value-of select="ProcessedQuery"/>                    
          </xsl:with-param>
        </xsl:call-template>     
      </div>
      </xsl:if>

      <xsl:if test="(/MBooksTop/AdvancedSearch/isAdvanced='true') and  (UnBalancedQuotes=1)">

        <div class="advancedMsg">
        <xsl:call-template name="QueryRewriteUnbalanced">
          <xsl:with-param name="ProcessedQueryString">
            <xsl:value-of select="ProcessedQuery"/>                    
          </xsl:with-param>
        </xsl:call-template>     
      </div>
      </xsl:if>

    </xsl:template>
    
    






  <!-- TEMPLATE -->
  <xsl:template name="QueryRewrite">
    <xsl:param name="ProcessedQueryString"/>
    <div class="SearchResults_status">
      <div class="infoAlert">
        One of the operators: <span>AND</span>, <span>OR</span>, <span>)</span>, or <span>(</span> was missing or placed incorrectly in your query. Your query was changed and submitted as: <em>all of these words: </em>
      <span>
          <xsl:value-of select="$ProcessedQueryString"/>
          <!--xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/-->
        </span>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="QueryRewriteUnbalanced">
    <xsl:param name="ProcessedQueryString"/>
    <div class="SearchResults_status">
      <div class="infoAlert">
        Your query contained ambiguous quotes. Your query was changed and submitted as: 
      <span>
          <xsl:value-of select="$ProcessedQueryString"/>
          <!--xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/-->
        </span>
      </div>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->

  <xsl:template name="NoResults">
     <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>


      <div class="ColContent" id="ColContentLSerror">

        <!--       <div class="LSerror">-->
          <xsl:choose>
            <!-- if the ft checkbox was checked and there are no ft but some so then display stuff below -->
            <xsl:when test="($limitType = 'ft') and ($all_items_count &gt; 0) and ($full_text_count = 0)">
              <div class="LSerror">
                <xsl:text>There are no Full View items matching your search</xsl:text>
                <br></br>
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyHref"/>
                  </xsl:attribute>
                  <xsl:attribute name ="class">
                  
                  </xsl:attribute>
                  <xsl:text> See Limited (search only) items matching your search </xsl:text>
                </xsl:element>
              </div>
            </xsl:when>
            
            <!-- advanced search with either limits or both boxes
                 Should this logic be in the PI filler instead of the XSL?
                 -->
            
            <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced = 'true'"> 
            <div class="AdvancedLSerror">

              <img alt="Error" src="/ls/common-web/graphics/icon_x.gif" id="x_icon"  />
              <span id="zeroHits">
                <xsl:text>Your search returned 0 results.   </xsl:text>
              </span>
              <div id="AdvancedLSerrorSearchStuff">
              <xsl:text>You searched for:</xsl:text>
              <xsl:call-template name="advanced"/>          
              <!-- need styling-->
              <!--XXX test for limits-->
              <xsl:if test="/MBooksTop/Facets/facetsSelected='true'">
                <div id="LimitsError">
                <xsl:text>With these limits </xsl:text>
                <xsl:call-template name="showSelected">
                  <xsl:with-param name="noResults">
                    <xsl:value-of select="true"/>
                  </xsl:with-param>
                </xsl:call-template>
                </div>
              </xsl:if> 

              
              </div>
              <div class="modify_link" id="modify_link">
              <a>
                <xsl:attribute name="href">
                  <xsl:value-of select="AdvancedSearch/ModifyAdvancedSearchURL"/>
                </xsl:attribute>
                <xsl:text>Revise this advanced search</xsl:text>
              </a>
            </div>
          </div>
        </xsl:when>
        
        <xsl:otherwise>
          <div class="LSerror">
            <xsl:text>Your search for "</xsl:text>
            <xsl:value-of select="/MBooksTop/QueryString"/>
            <xsl:text>" in Everything returned zero hits.</xsl:text>
          </div>
        </xsl:otherwise>      
      </xsl:choose>
      
      <!-- </div>-->
      
    </div>
    
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="SolrError">
    <span class="debug">
      <xsl:value-of select="/MBooksTop/SearchResults/SolrError"/>
    </span>
    <div class="ColContent">
    <xsl:choose>
      <xsl:when test="contains(/MBooksTop/SearchResults/SolrError, 'timeout')">
        <div class="error">
          <xsl:text>Your search timed out.  Try refining your search avoiding common words.</xsl:text>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <div class="error">
          <xsl:text>Sorry! There was a problem searching.  Please try back later.</xsl:text>
        </div>
      </xsl:otherwise>
    </xsl:choose>
  </div>
  </xsl:template>


  <!--##  PAGING-related ##-->

  <!-- TEMPLATE -->
  <xsl:template name="Paging">
    <ul id="PageWidget">
      <li>
        <xsl:choose>
          <xsl:when test="/MBooksTop/Paging/PrevPage='None'">
            <span class="greyedOut">Prev</span>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name ="a">
              <xsl:attribute name="href">
                <xsl:value-of select="/MBooksTop/Paging/PrevPage/Href"/>
              </xsl:attribute>
             &lt;&lt;  Prev
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <xsl:choose>
        <xsl:when test="/MBooksTop/Paging/StartPageLinks = 'None'">
          <xsl:call-template name="allpages"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="somepages"/>
        </xsl:otherwise>
      </xsl:choose>

      <li>
        <xsl:choose>
          <xsl:when test="/MBooksTop/Paging/NextPage='None'">
            <span class="greyedOut">Next</span>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name ="a">
              <xsl:attribute name="href">
                <xsl:value-of select="/MBooksTop/Paging/NextPage/Href"/>
              </xsl:attribute>
              &gt;&gt; Next
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
      <!-- foobar suz says make it look like catalog XXX this is a Hack!-->

      <!-- This doesnt work right!###############################
    <xsl:for-each select="/MBooksTop/Paging/EndPageLinks/PageURL">

        <xsl:call-template name="output_page_link_or_current_page"/>

        <li>
          <xsl:text>[ </xsl:text>
          <xsl:element name ="a">
            <xsl:attribute name="href">
              <xsl:value-of select="Href"/>
            </xsl:attribute>
            <xsl:value-of select="Content"/>
          </xsl:element>
          <xsl:text> ]</xsl:text>
        </li>
    </xsl:for-each>
##############################################################-->


    </ul>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="BuildPagingControls">
    <xsl:param name="which_paging"/>
    <!-- variable top or bottom so we can determine which widget to read from js -->
    <div id="PageInfo">
      <xsl:attribute name="class">
        <xsl:value-of select="$which_paging"/>
      </xsl:attribute>
      <!-- rec per page widget-->
      <div id="resultsPerPage">
        <xsl:for-each select="/MBooksTop/Paging/SliceSizeWidget">
          <label for="sz" class="SkipLink">Items per page:</label>
          <xsl:call-template name="BuildHtmlSelect">
            <xsl:with-param name="id">
              <xsl:value-of select="$which_paging"/>
            </xsl:with-param>
            <xsl:with-param name="class" select="'sz'"/>
            <xsl:with-param name="key">
              <xsl:text>redisplay_new_slice_size(&quot;</xsl:text>
              <xsl:value-of select="$which_paging"/>
              <xsl:text>&quot;)</xsl:text>
            </xsl:with-param>
          </xsl:call-template>
        </xsl:for-each>
      </div>
      <div id="pagingNav">
        <xsl:call-template name="Paging"/>
      </div>
    </div>
  </xsl:template>


  <!-- TEMPLATE -->
  <xsl:template name="allpages">
    <xsl:for-each select="/MBooksTop/Paging/PageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="somepages">
    <xsl:for-each select="/MBooksTop/Paging/StartPageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>

    <xsl:for-each select="/MBooksTop/Paging/MiddlePageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>


    <!--
         suz says make it look like catalog-->
    <xsl:if test="/MBooksTop/Paging/EndPageLinks/PageURL">
      <li class="elipsis">
        <xsl:text>...</xsl:text>
      </li>
    </xsl:if>
    
    
    <xsl:for-each select="/MBooksTop/Paging/EndPageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>
    <!--    ##########################################################################-->
  </xsl:template>


  <!-- TEMPLATE -->
  <xsl:template name="output_page_link_or_current_page">
    <xsl:choose>
      <xsl:when test="Content/CurrentPage">
        <li class="URHere">
          <xsl:value-of select="Content/CurrentPage"/>
        </li>
      </xsl:when>
      <xsl:otherwise>
        <li>
          <xsl:element name ="a">
            <xsl:attribute name="href">
              <xsl:value-of select="Href"/>
            </xsl:attribute>
            <xsl:value-of select="Content"/>
          </xsl:element>
        </li>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  <!--##  END PAGING-related ##-->

  <!-- TEMPLATE -->
  <xsl:template name="BuildSortWidget">
    <div id="SortWidget">
      <xsl:for-each select="/MBooksTop/SortWidget/SortWidgetSort">
        <label for="sort">Sort by: </label>
        <xsl:call-template name="BuildHtmlSelect">
          <xsl:with-param name="id">SortWidgetSort</xsl:with-param>
          <xsl:with-param name="class" select="'sort'"/>
          <xsl:with-param name="key">
            <xsl:text>doSort()</xsl:text>
          </xsl:with-param>
        </xsl:call-template>
      </xsl:for-each>
    </div>
  </xsl:template>


  <!-- TEMPLATE: Sort sort direction pointer -->
  <xsl:template name="get_sort_arrow">
    <xsl:param name="which_sort"/>
    <xsl:if test="$which_sort=$g_current_sort">
      <!-- display arrow -->
      <xsl:choose>
        <xsl:when test="$g_current_sort_dir='a'">
          <img width="12" height="10" src="/ls/common-web/graphics/arrow_up.gif" alt="sort descending"/>
        </xsl:when>
        <xsl:otherwise>
          <img width="12" height="10" src="/ls/common-web/graphics/arrow_down.gif" alt="sort ascending"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <!-- TEMPLATE -->  
  <xsl:template name="BuildItemChunk">
    <xsl:variable name="IndexStatus">indexed</xsl:variable>

    <xsl:variable name="row_class">
      <xsl:choose>
        <xsl:when test="(position() mod 2)=0">
          <xsl:value-of select="'row roweven'"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="'row rowodd'"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="fulltext_string">
      <xsl:choose>
        <xsl:when test="fulltext=1">Full view</xsl:when>
        <xsl:otherwise>Limited (search-only)</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="fulltext_class">
      <xsl:choose>
        <xsl:when test="fulltext=1">fulltext</xsl:when>
        <xsl:otherwise>viewonly</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <tr>
      <xsl:attribute name="class">
        <xsl:text> Chunk </xsl:text>
        <xsl:value-of select="$row_class"/>
        <xsl:text> </xsl:text>
        <xsl:value-of select="$IndexStatus"/>
      </xsl:attribute>

      <xsl:if test="$debug='YES'">
        <td class="ItemSelect">
          <span class="ItemID Select">
            <span class="debug">
              <xsl:text>item_id: </xsl:text>
              <xsl:value-of select="ItemID"/>
            </span>
          </span>
        </td>
      </xsl:if>
      
      <!--tbw CB test code for now this should only appear if user is logged in-->
      <!--     <xsl:if test= "/MBooksTop/MBooksGlobals/LoggedIn = 'YES'">-->
        <td class ="ItemSelect">
          <span class="ItemID Select">
            <input class="iid" type="checkbox" name="id">
              <xsl:attribute name="value">
                <xsl:value-of select="ItemID"/>
              </xsl:attribute>
            </input>
          </span>
        </td>
        <!--      </xsl:if>-->
      <!--tbw CB test code-->

      <td class="ItemData">

        <!-- Title -->
        <div class="ItemTitle">
          <span class="Title">
            <xsl:value-of select="Title" disable-output-escaping="yes" />
          </span>
                  
          <!-- Vernacular Title -->
          <xsl:choose>

            <xsl:when test="normalize-space(VernacularTitle)">
              <div class="ItemTitle">
                <span class="Title">
                  <xsl:value-of select="VernacularTitle" disable-output-escaping="yes" />
                </span>
                <xsl:call-template name="EnumCron"/>
            </div>
          </xsl:when>

          <xsl:otherwise>
                <xsl:call-template name="EnumCron"/>
          </xsl:otherwise>
        </xsl:choose>          
        
        </div>          
          


        <!-- Author -->
        <!-- single '-' is a pageturner token for "no author" -->
        <xsl:if test="Author!=''">
          <div class="ItemAuthor">

            <span class="ItemAuthorLabel">
              <xsl:text>by </xsl:text>
            </span>
            <span class="Author">
              <xsl:value-of select="Author"  disable-output-escaping="yes"/>
            </span>
          </div>
        </xsl:if>

        <!-- Date -->
        <xsl:variable name="Date">
          <xsl:value-of select="Date"/>
        </xsl:variable>
        <div class="ItemDate">
          <span class="Date">
            <xsl:choose>
              <xsl:when test="$Date='0000'">
                <!-- bad date string from pi goes here-->
                <xsl:text>Published ----</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <span class="ItemDateLabel">
                  <xsl:text>Published </xsl:text>
                </span>
                <xsl:value-of select="$Date"/>
              </xsl:otherwise>
            </xsl:choose>
          </span>
        </div>

        <xsl:copy-of select="explain"/>


        <!-- SEARCH needs relevance -->
        <span class="Relevance debug">
          <xsl:text>relevance score: </xsl:text>
          <xsl:value-of select="relevance"/>
        </span>

        <ul>
          <li>
            <div class="cataloglink">
              <xsl:element name="a">
                <xsl:attribute name="href">     
                <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
                <xsl:value-of select ="record"/>
              </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:text>cataloglinkhref</xsl:text>
                </xsl:attribute>
                <xsl:text>Catalog Record</xsl:text>
                <!-- <xsl:value-of select="$fulltext_string"/>-->
              </xsl:element>
            </div>
          </li>
          <li>
            <div class="Rights">
              <span class="debug">
                <xsl:text>rights: </xsl:text>
                <xsl:value-of select="rights"/>
              </span>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <!-- link to page instead of a search -->
                  <xsl:value-of select="PtHref"/>
                </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:value-of select="$fulltext_class"/>
                </xsl:attribute>
                <xsl:value-of select="$fulltext_string"/>
              </xsl:element>
            </div>
          </li>
        </ul>
          
      </td>
    </tr>
  </xsl:template>

  <xsl:template name="EnumCron">
    <xsl:if test="normalize-space(VolEnumCron)">
      <span class="Title">
        <xsl:text> </xsl:text>
        <xsl:value-of select="VolEnumCron" disable-output-escaping="yes" />
      </span>
    </xsl:if>
  </xsl:template>


 <xsl:template name="BuildItemSelectActions">
    <div class="SelectedItemActions">
      <div id="errormsg">
        <div class="bd"></div>
      </div>

      <div class="overlay" id="overlay"></div>
      <span id="addCollectionWidgetLS"></span>
      <xsl:call-template name="BuildCollectionSelect"/>
      <input type="hidden" name="page" value="ajax"/>
      <button id="LSaddItemsBtn" >Add Selected</button>
    </div>
  </xsl:template>

  <xsl:template name="BuildCollectionSelect">
    <xsl:variable name="select_collection_text">Select Collection</xsl:variable>
    <select name="c2" id="LSaddItemSelect">

      <option value="a" selected="selected">
        <xsl:value-of select="$select_collection_text"/>
      </option>

      <option label="New Collection" id="NewC" value="b">
        <xsl:text>[CREATE NEW COLLECTION]</xsl:text>
      </option>

      <xsl:for-each select="SelectCollectionWidget/Coll">
        <xsl:element name="option">
          <xsl:attribute name="value">
            <xsl:value-of select="collid"/>
          </xsl:attribute>
          <xsl:value-of select="CollName"/>
        </xsl:element>
      </xsl:for-each>
      
    </select>
  </xsl:template>
  
  
  <xsl:template name="GetHiddenParams">
    <xsl:copy-of select="$hidden_pn_param"/>
    <xsl:copy-of select="$hidden_sort_param"/>
    <xsl:copy-of select="$hidden_dir_param"/>
    <xsl:copy-of select="$hidden_sz_param"/>
    <xsl:copy-of select="$hidden_debug_param"/>
    
    <xsl:variable name="hidden_q1_param">
      <input type="hidden" name="q1">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/QueryString"/>
        </xsl:attribute>
      </input>
    </xsl:variable>
    
    <xsl:copy-of select="$hidden_q1_param"/>
    <input type="hidden" name="page" value="srchresults"/>
  </xsl:template>


  <!--############### facet templates ########################################-->

  <xsl:template name="facets">
    <div class="facets">
      <xsl:variable name="facetsSelected">
        <xsl:value-of select="/MBooksTop/Facets/facetsSelected"/>
      </xsl:variable>
      <xsl:if test="$facetsSelected = 'true'">
        <xsl:call-template name="showSelected"/>
      </xsl:if>

      
      <!--  unselected facets ##########################################################   -->
      <div class="narrow">
        <h1 class="narrowsearch">Refine Results</h1>
        <div id="facetlist">
          <dl>
            <!-- hack to insert pseudo facet availability here based on actual rights queries-->
            <xsl:call-template name="pseudofacet"/>
            
            <xsl:for-each select="/MBooksTop/Facets/unselectedFacets/facetField">
              
              <xsl:text>    
            </xsl:text>
            <dt class="facetField"><xsl:value-of select="@name"/></dt>
            <xsl:text>                
          </xsl:text>
          <!--   WARNING!  waht we label the field in the html and the field name could be different
               Where should the name/label mapping exist?
               -->
          <xsl:call-template name="facetFields">
            <xsl:with-param name="fieldName">
              <xsl:value-of select="@name"/>
            </xsl:with-param>
          </xsl:call-template>
          
          <xsl:if test="showmoreless='true'">        
          <dd>
            
            <a  href="">
              <xsl:attribute name="class">
                <!-- need to process name so there are no spaces i.e. "place of publication"-->
                <xsl:value-of select="@normName"/>
                <xsl:text> morefacets</xsl:text>
              </xsl:attribute>
              <i>more...</i></a>
              
              <a  href="">    
              <xsl:attribute name="class">
                <xsl:value-of select="@normName"/>
                <xsl:text> lessfacets</xsl:text>
              </xsl:attribute>
              
              <i>less...</i></a>
              
            </dd>
          </xsl:if>
        </xsl:for-each>
      </dl>
    </div>
  </div>
  </div>
</xsl:template>


<xsl:template name="showSelected">
  <xsl:param name="isAdvanced" value="false"/>
  <div>
    <xsl:attribute name="id">selectedFacets</xsl:attribute>
    <xsl:attribute name="class">
      <xsl:choose>
        <xsl:when test="$isAdvanced = 'false'">
          <xsl:text>selectedFacets"</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>advancedSelectedFacets</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:attribute>

    <xsl:if test="$isAdvanced = 'false'">
      <h1>Results refined by:</h1>
    </xsl:if>

      
    <ul class="filters">
      <xsl:call-template name="multiselectFacets"/>
      <xsl:call-template name="daterangeFacets"/>
      <xsl:call-template name="selectedViewabilityFacet"/>
      <xsl:for-each select="/MBooksTop/Facets/SelectedFacets/facetValue">
        <xsl:text>
        </xsl:text>
        <li>
          <xsl:variable name="value">
            <xsl:value-of select="@name"/>
          </xsl:variable>
          
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="unselectURL"/>
            </xsl:attribute>
            <xsl:attribute name ="class">
              unselect
            </xsl:attribute>
            
            <!--   <img alt="Delete" src="/ls/common-web/graphics/delete.png" />-->
            <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
          </xsl:element>
          <span class="selectedfieldname">
          <xsl:value-of select="fieldName"/>
          </span>
          <xsl:text>:  </xsl:text>
          <xsl:value-of select="@name"/>
          
        </li>
      </xsl:for-each>
    </ul>
  </div>
</xsl:template>


<xsl:template name="daterangeFacets">
  <xsl:for-each select="/MBooksTop/Facets/SelectedFacets/daterange">
    
        <xsl:text>
        </xsl:text>

        <li>
          
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="unselectURL"/>
            </xsl:attribute>
            <xsl:attribute name ="class">
              unselect
            </xsl:attribute>


            <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
          </xsl:element>
          <span class="selectedfieldname">
            <xsl:text>Date: </xsl:text>
          </span>
          <xsl:value-of select ="facetString"/>
        </li>

  </xsl:for-each>
</xsl:template>



<xsl:template name="multiselectFacets">
  <xsl:for-each select="/MBooksTop/Facets/SelectedFacets/multiselect/multiselectClause">
    
        <xsl:text>
        </xsl:text>

        <li>
          <xsl:variable name="value">
            <xsl:value-of select="@name"/>
          </xsl:variable>
          
          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="unselectURL"/>
            </xsl:attribute>
            <xsl:attribute name ="class">
              unselect
            </xsl:attribute>


            <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
          </xsl:element>
          <span class="selectedfieldname">
          <xsl:value-of select="fieldName"/>
          </span>
          <xsl:text>:  </xsl:text>
          <!--<xsl:value-of select="@name"/>-->
          <xsl:value-of select ="facetValue"/>
        </li>

  </xsl:for-each>
</xsl:template>



<xsl:template name="selectedViewabilityFacet">

  <!--if LimitType = so or ft show appropriate text with link to remove facet i.e. lmt=all  -->
  <xsl:variable name="limitType">
    <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
  </xsl:variable>

  <xsl:choose>
    <xsl:when test="$limitType = 'so'">
      <li>
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:value-of select="/MBooksTop/LimitToFullText/AllHref"/>
          </xsl:attribute>
          <xsl:attribute name ="class">
            unselect
          </xsl:attribute>

          <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
        </xsl:element>
        <span class="selectedfieldname">
          <xsl:text>Viewability</xsl:text>
      </span>
        <xsl:text>:  Limited (search only)</xsl:text>
      </li>
      
    </xsl:when>
    <xsl:when test="$limitType = 'ft'">
      <li>
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:value-of select="/MBooksTop/LimitToFullText/AllHref"/>
          </xsl:attribute>
          <xsl:attribute name ="class">
            unselect
          </xsl:attribute>
          <img alt="Delete" src="/ls/common-web/graphics/cancel.png" class="removeFacetIcon" />
        </xsl:element>
        <span class="selectedfieldname">
          <xsl:text>Viewability</xsl:text>
      </span>
        <xsl:text>:  Full View</xsl:text>
      </li>
    </xsl:when>
    
    <xsl:otherwise>
      
    </xsl:otherwise>
  </xsl:choose>
</xsl:template>




<!--######################################################################-->
<xsl:template name="pseudofacet">
  <xsl:text>    
  </xsl:text>
  <dt class="facetField">Viewability</dt>
  <xsl:text>                
  </xsl:text>

  <xsl:variable name="limitType">
    <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
  </xsl:variable>
  

  <xsl:variable name ="SearchOnlyCount">
        <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyCount"/>
  </xsl:variable>

  <xsl:variable name ="FullTextCount">
        <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCount"/>
  </xsl:variable>


  <xsl:variable name="fakeFullTextFacet">
    <xsl:text> </xsl:text>
    <xsl:if test="$FullTextCount > 0">
      <dd>
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextHref"/>
          </xsl:attribute>
          <xsl:attribute name ="class">
            
          </xsl:attribute>
          <xsl:text>Full View </xsl:text>
        </xsl:element>
        <xsl:text> (</xsl:text>
        <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCountDisplay"/>
        <xsl:text>) </xsl:text>
      </dd>
    </xsl:if>
  </xsl:variable>
  
  <xsl:variable name="fakeSearchOnlyFacet">
    <xsl:text> </xsl:text>
    <xsl:if test="$SearchOnlyCount > 0">

    <dd>
      <xsl:element name="a">
        <xsl:attribute name="href">
          <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyHref"/>
        </xsl:attribute>
        <xsl:attribute name ="class">
          
        </xsl:attribute>
        <xsl:text>Limited (search only) </xsl:text>
      </xsl:element>
      <xsl:text> (</xsl:text>
      <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyCountDisplay"/>
      <xsl:text>) </xsl:text>
    </dd>
  </xsl:if>
  </xsl:variable>


  <xsl:choose>    
   <xsl:when test="$limitType = 'so'">
     <xsl:copy-of select="$fakeFullTextFacet"/>
   </xsl:when>
   <xsl:when test="$limitType = 'ft'">
     <xsl:copy-of select="$fakeSearchOnlyFacet"/>
   </xsl:when>
   <xsl:otherwise>
     <!-- put facet with highest count first -->
     <xsl:choose>
       <xsl:when test="$SearchOnlyCount &gt; $FullTextCount">
         <xsl:copy-of select="$fakeSearchOnlyFacet"/>
         <xsl:copy-of select="$fakeFullTextFacet"/>
       </xsl:when>
       <xsl:otherwise>
         <xsl:copy-of select="$fakeFullTextFacet"/>
         <xsl:copy-of select="$fakeSearchOnlyFacet"/>
       </xsl:otherwise>
     </xsl:choose>
   </xsl:otherwise>
 </xsl:choose>
</xsl:template>





  <xsl:template name="facetFields">
    <xsl:param name="fieldName">Unknown facet</xsl:param>

      <xsl:text>
      </xsl:text>
      <xsl:for-each select="facetValue"> 
        <xsl:text>
        </xsl:text>
        <dd>

          <xsl:attribute name ="class">
            <xsl:value-of select="@class"/>
          </xsl:attribute>

          <xsl:variable name="value">
            <xsl:value-of select="@name"/>
          </xsl:variable>

          <xsl:variable name="selected">
            <xsl:value-of select="selected"/>
          </xsl:variable>

          <xsl:choose>
            <xsl:when test="$selected='true'">
                <xsl:value-of select="$value"/>

                <span dir="ltr">
                <xsl:text> (</xsl:text>
                <xsl:value-of select="facetCount"/>
                <xsl:text>) </xsl:text>
              </span>
            </xsl:when>
            <xsl:otherwise>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="url"/>
                </xsl:attribute>
                
                <xsl:value-of select="$value"/>
              </xsl:element>
              <span dir="ltr">
                <xsl:text> (</xsl:text>
                <xsl:value-of select="facetCount"/>
                <xsl:text>) </xsl:text>
              </span>
            </xsl:otherwise>
          </xsl:choose>

        </dd>
      </xsl:for-each>

  </xsl:template>

  <xsl:template name="GetCurrentCGI">
    <xsl:for-each select="/MBooksTop/MBooksGlobals/CurrentCgi/Param">
      <xsl:choose>
        <!-- replace with a test for the first member of the set -->
        <xsl:when test="position()=1">
          <xsl:text>?</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <!-- how do we output a literal ampersand -->
          <xsl:text>&amp;</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      
      <xsl:value-of select="@name"/>
      <xsl:text>=</xsl:text>
      <xsl:value-of select="."/>
      
    </xsl:for-each>
  </xsl:template>
  
</xsl:stylesheet>
