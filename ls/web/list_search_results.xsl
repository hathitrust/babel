<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
 xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">


  <!-- XXX unicorn version-->
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

  <xsl:variable name="Field1">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='field1']"/>    
  </xsl:variable>
  <xsl:variable name="gSelected">
    <xsl:value-of select="/MBooksTop/HeaderSearchSelect/Selected"/>
  </xsl:variable>

  <xsl:variable name="gLimit">
    <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
  </xsl:variable>

  <!-- ######################### end Global Variables ###################################-->



  <!-- XXX temporary dummy template until Roger puts this in the right place -->
  <xsl:template name="google_analytics"/>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/ls/css/screen.css" />
    <link rel="stylesheet" type="text/css" href="/ls/css/ls.css" />
    <xsl:call-template name="include_local_javascript" />
    <xsl:call-template name="load_js_and_css"/>
  </xsl:template>

  <!--  pass params from basic search on to advanced search-->
  <xsl:template name="GetAdvancedFullTextHref">
    <xsl:value-of select="AdvancedSearch/AdvancedSearchURL"/>
  </xsl:template>




  <!--##############################new templates##################################################-->

  <xsl:template name="contents">
    <!-- XXX do proper thing if no results -->
    <!-- XXX temporarily put these back in until Roger fixes this
         They actually should go at the very top of the body, but that would require a change to skeleton.xsl
        Not sure what first one is but the second shows debug messages -->


    <div>
      <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
    </div>
    <xsl:call-template name="sidebar" />
<div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
          </div>

    <xsl:call-template name="list-items-results" />
  </xsl:template>

  <xsl:template name="sidebar">
    <!-- XXX don't display if no results-->
    <xsl:if test="SearchResults/Item">
      <xsl:call-template name="facets"/>
    </xsl:if>
  </xsl:template>

  <!-- XXX change name to list-search results once we are clear
       also remove the extra divs and YUI unless needed 
REMOVE the below and see if it will call list_utils

-->

  <!--XXX template copied from mb list_items as basis to modify-->

  <xsl:template name="list-items-results">
    <xsl:variable name="title">
      <xsl:choose>
        <xsl:when test="SearchResults/Item">
          <xsl:text>Search Results</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>Fix this in list-items-results</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <h2 class="offscreen"><xsl:value-of select="$title" /></h2>
    <div id="mbContentContainer" class="main clearfix">


      <!--XXX <xsl:call-template name="DisplaySearchWidgetLogic"/> -->

      <!--XXX      <xsl:call-template name="status-update" /> -->

      <!-- XXX       <xsl:call-template name="decideDisplayRefine"/> -->

          
      <xsl:choose>
        <xsl:when test="SearchResults/Item">
          <xsl:call-template name="SearchResults_status"/>
          <xsl:call-template name="Refine"/>
          <xsl:call-template name="DisplayContent">
            <xsl:with-param name="title" select="'Search Results'" />
            <xsl:with-param name="item-list-contents" select="'items'" />
          </xsl:call-template>
        </xsl:when>
        <xsl:when test="SearchResults/SolrError[normalize-space(.)]">
          <xsl:call-template name="SolrError"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="NoResults"/>
        </xsl:otherwise>
      </xsl:choose>

    </div>

  </xsl:template>

  <!-- templates to make search box in header sticky  make sure not confused by an advanced search-->
  <xsl:template name="header-search-q1-value" >
    <!-- from skeleton.xsl global gets current cgi q1 param-->
    <xsl:value-of select="$gQ1"/>
  </xsl:template>




  <!-- XXX  template header-search-options-selected
       Name mapping issue here  hard coded in the PI handler and in cgi/one
       ls/ cgi/one $LS_MAP maps from what is in the header search form to correct 
       field1 params.  Reverse mapping from field1 params to header-search form params
       in PIFILLER/ListSearchResults::handle_HEADER_SEARCH_SELECT 
   -->

   <xsl:template name="header-search-options-selected">
     <xsl:param name="value" value="all" />
     
     <xsl:if test= "$value = $gSelected">
         <xsl:attribute name="selected">selected</xsl:attribute>
     </xsl:if>
     
   </xsl:template>

   <!-- XXX ask Roger if we can clean this up. i.e. skeleton calls it without a param-->

<xsl:template name="header-search-ft-checkbox">
    
    <label>
      <input type="checkbox" name="ft" value="ft">
        <xsl:if test="$gLimit='ft'">
          <xsl:attribute name="checked" value="checked"/>
        </xsl:if>
      </input>
      Full view only
    </label>
      

  </xsl:template>



    

  <!--################################################################################-->
  <!-- TEMPLATE -->
  <xsl:template name="SearchResults_status">
   
    <div class="SearchResults_status">
      <xsl:if test="$debug='YES'">
        <span id="TempDebug">SEARCH RESULTS</span>
      </xsl:if>
      <!--XXX foobar   this shouldn't display if 0 results-->
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


<!-- ####################### Advanced search status messages, called by SearchResults_status ############# -->
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
      
    <!-- XXX temporary fix for *:* search   this should be done in the perl -->
      <xsl:variable name="EveryThingQuery">
        <xsl:value-of select="EveryThingQuery"/> 
      </xsl:variable>
      
      <xsl:choose>
        <xsl:when test="$EveryThingQuery = 'true'">
          <xsl:text>* (Everything)</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <span>
            <xsl:value-of select="Query"/> 
          </span>
                
          <xsl:text> in </xsl:text>
          <!-- replace em with css -->
      
          <em>
            <xsl:value-of select="Field"/>
          </em>
        </xsl:otherwise>
      </xsl:choose>
      
      <!--xsl:if test="(/MBooksTop/AdvancedSearch/isAdvanced='true') and  (WellFormed!=1)"-->
      <xsl:if test="WellFormed!=1">

        <xsl:call-template name="QueryRewrite">
          <xsl:with-param name="ProcessedQueryString">
            <xsl:value-of select="ProcessedQuery"/>                    
          </xsl:with-param>
        </xsl:call-template>     

      </xsl:if>

      <!--xsl:if test="(/MBooksTop/AdvancedSearch/isAdvanced='true') and  (UnBalancedQuotes=1)"-->
      <xsl:if test="UnBalancedQuotes=1">
        <div class="advancedMsg">
        <xsl:call-template name="QueryRewriteUnbalanced">
          <xsl:with-param name="ProcessedQueryString">
            <xsl:value-of select="ProcessedQuery"/>                    
          </xsl:with-param>
        </xsl:call-template>     
      </div>
      </xsl:if>

    </xsl:template>
    


<!--  Helpers for advanced search status messages called by template advancedContent -->    

  <!-- TEMPLATE -->
  <xsl:template name="QueryRewrite">
    <xsl:param name="ProcessedQueryString"/>
    <div class="SearchResults_status">
      <div class="alert alert-block">
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

      <div class="alert alert-block">
        Your query contained ambiguous quotes. Your query was changed and submitted as: 
      <span>
          <xsl:value-of select="$ProcessedQueryString"/>
          <!--xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/-->
        </span>
      </div>
    </div>
  </xsl:template>

<!-- ####################### End Advanced search status messages, called by SearchResults_status ############# -->    


  <!-- TEMPLATE -->

  <xsl:template name="NoResults">
     <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>

    <!-- if there are some  results, but just no ft results show tabs-->

    <xsl:if test="$all_items_count &gt; 0">
          <xsl:call-template name="Refine"/>
    </xsl:if>


      <div class="ColContent" id="ColContentLSerror">

        <!--       <div class="LSerror">-->
          <xsl:choose>
            <!-- if the ft checkbox was checked and there are no ft but some so then display stuff below -->
            <xsl:when test="($limitType = 'ft') and ($all_items_count &gt; 0) and ($full_text_count = 0)">
              <div class="LSerror alert alert-error">
                <xsl:text>There are no Full View items matching your search</xsl:text>
                <!--XXX we don't need this if we show the tabs-->
                <!--#################################
                <br></br>
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyHref"/>
                  </xsl:attribute>
                  <xsl:attribute name ="class">
                  
                  </xsl:attribute>
                  <xsl:text> See Limited (search only) items matching your search </xsl:text>
                </xsl:element>
                #################################-->
              </div>
            </xsl:when>
            
            <!-- advanced search with either limits or both boxes
                 Should this logic be in the PI filler instead of the XSL?
                 -->
            <!-- XXX test this with new isAdvanced criteria -->  
            <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced = 'true'"> 
            <div class="AdvancedLSerror alert alert-error alert-block">

             
              <span id="zeroHits">
                <xsl:text>Your search returned 0 results.   </xsl:text>
              </span>
              <div id="AdvancedLSerrorSearchStuff alert alert-error alert-block">
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
          <div class="LSerror alert  alert-error">
            <xsl:text>Your search for "</xsl:text>
            <xsl:value-of select="/MBooksTop/QueryString"/>
            <xsl:text>" in </xsl:text>
            <xsl:value-of select="/MBooksTop/AdvancedSearch/group/Clause/Field"/>
            <xsl:text> returned zero hits.</xsl:text>
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


  <!--#########################  PAGING-related ###################################-->

  <!-- TEMPLATE -->
  <xsl:template name="Paging">

    <ul class="PageWidget">
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
              &lt;&lt;   Prev
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
              Next  &gt;&gt;
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
      <!--  suz says make it look like catalog XXX see hack that doesn't work in clean up!-->

    </ul>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="BuildPagingControls">
    <xsl:param name="which_paging"/>
    <!-- variable top or bottom so we can determine which widget to read from js -->
    <!--XXX tbw change id to class after fixing CSS -->

    <div>
      <xsl:attribute name="class">
        <xsl:value-of select="$which_paging"/>
        <xsl:text> PageInfo</xsl:text>
      </xsl:attribute>
      <h3 class="offscreen">Sorting/Filtering Tools</h3>
      <!-- rec per page widget-->
      <div class="resultsPerPage">
        <xsl:for-each select="/MBooksTop/Paging/SliceSizeWidget">
          <label  class="SkipLink">
            <xsl:attribute name="for">
              <xsl:value-of select="$which_paging"/>
            </xsl:attribute>
            Items per page:
          </label>

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
      <div class="pagingNav">
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
  <!--#########################  END PAGING-related ###################################-->


  <!-- ################################# ls BuildItemChunk not used for now but needs looking at ################################# -->
  <!-- TEMPLATE -->  
  <!--XXX TODO  compare this with list_utils BuildItemChunk.  Probably need stuff here since xml in ls different
       consider fixing xml in ls to be consistant with what is in title field of CB db table, i.e. 245c/vernacular/enum cron stuff!!
-->



  <xsl:template name="GetTitle">
    <xsl:value-of select="Title" disable-output-escaping="yes" />
    <!-- Vernacular Title -->
    <xsl:choose>
      <xsl:when test="normalize-space(VernacularTitle)">
        <div class="Itemtitle">
          <xsl:value-of select="VernacularTitle" disable-output-escaping="yes" />
          <xsl:call-template name="EnumCron"/>
        </div>
      </xsl:when>
      
      <xsl:otherwise>
        <xsl:call-template name="EnumCron"/>
      </xsl:otherwise>
    </xsl:choose>          
  </xsl:template>



  <xsl:template name="BuildItemChunkOld">
    <xsl:variable name="IndexStatus">indexed</xsl:variable>

    <xsl:variable name="row_class">
      <xsl:choose>
        <xsl:when test="(position() mod 2)=0">
          <xsl:value-of select="'row result'"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="'row result alt'"/>
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


    <!-- variables from list_utils ############################################
    <xsl:variable name="fulltext_string">
      <xsl:choose>
        <xsl:when test="rights=8">This item is no longer available</xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="fulltext_link_string">
      <xsl:choose>
        <xsl:when test="fulltext=1">Full view</xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="rights=8"> (Why not?)</xsl:when>
            <xsl:otherwise>Limited (search-only)</xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="fulltext_class">
      <xsl:choose>
        <xsl:when test="fulltext=1">fulltext icomoon-document-2</xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test="rights=8"></xsl:when>
            <xsl:otherwise>viewonly icomoon-locked</xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="showing-collections">
      <xsl:choose>
        <xsl:when test="Collections">true</xsl:when>
        <xsl:otherwise>false</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="span-n">
      <xsl:choose>
        <xsl:when test="$showing-collections = 'true'">7</xsl:when>
        <xsl:otherwise>10</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="Date">
      <xsl:value-of select="Date"/>
    </xsl:variable>
    ################################## end variables from list utils-->
    <!--################################## end variables-->


    <!-- XXX what is indexstatus -->


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
       <!--XXX Access  need label for checkbox -->
          <xsl:variable name="checkbox_id">
            <xsl:text>check_</xsl:text>
            <xsl:value-of select="ItemID"/>
          </xsl:variable>
      

          <td class ="ItemSelect">
            <span class="ItemID Select">
              <label class="offscreen">
                <xsl:attribute name="for">
                  <xsl:value-of select="$checkbox_id"/>
                </xsl:attribute>
                <xsl:text>Checkbox for </xsl:text>
                <xsl:value-of select="Title" disable-output-escaping="yes" />
              </label>
              <input class="iid" type="checkbox" name="id">
                <xsl:attribute name="value">
                  <xsl:value-of select="ItemID"/>
                </xsl:attribute>
                <xsl:attribute name="id">
                  <xsl:value-of select="$checkbox_id"/>
                </xsl:attribute>
              </input>
            </span>
          </td>
        <!--      </xsl:if>-->
      <!--tbw CB test code-->
      <!-- unicorn google book stuff-->
      <td class="ItemData">
        <xsl:attribute name="bookIdData">
          <xsl:value-of select="BookIds"/>
        </xsl:attribute>
        <!-- Title -->
        
        <div class="ItemTitle">
          <h4 class="iTitle">
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
            </h4>
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

  <!-- ################################# ls BuildItemChunk not used for now but needs looking at #################################-->

 
 
  
  <!-- XXX remove?  don't think this is used -->
  <xsl:template name="GetHiddenParams">
    <h1>Get hidden</h1>
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
    <div class="facets sidebar">
      <xsl:variable name="facetsSelected">
        <xsl:value-of select="/MBooksTop/Facets/facetsSelected"/>
      </xsl:variable>
      <xsl:if test="$facetsSelected = 'true'">
        <xsl:call-template name="showSelected"/>
      </xsl:if>

      
      <!--  unselected facets ##########################################################   -->
      <div class="narrow">
        <h3 class="narrowsearch">Refine Results</h3>
        <div id="facetlist">
          <dl>
            <!-- hack to insert pseudo facet availability here based on actual rights queries-->
            <!--XXX remove viewability fake facets      <xsl:call-template name="pseudofacet"/>-->
            
            <xsl:for-each select="/MBooksTop/Facets/unselectedFacets/facetField">
              <xsl:variable name="facetName">
                <xsl:value-of select="@name"/>
              </xsl:variable>
              
              
              <xsl:text>    
            </xsl:text>
            <dt class="facetField"><xsl:value-of select="$facetName"/></dt>
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
              
              <span class="offscreen">
                <xsl:value-of select="$facetName"/><xsl:text>: show </xsl:text>
              </span>
              <span class="moreless">more...</span></a>
              
              
              <a  href="">    
              <xsl:attribute name="class">
                <xsl:value-of select="@normName"/>
                <xsl:text> lessfacets</xsl:text>
              </xsl:attribute>
              <span class="offscreen">
                <xsl:value-of select="$facetName"/><xsl:text>: show </xsl:text>
              </span>
               <span class="moreless">less...</span></a>              
              
            </dd>
          </xsl:if>
        </xsl:for-each>
      </dl>
    </div>
  </div>
  </div>
</xsl:template>

<!--XXX what does the isAdvanced code below do?  Does it work with changed isAdvanced criteria? -->
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
      <!--XXX remove fake facet      <xsl:call-template name="selectedViewabilityFacet"/>-->
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


  <!-- get-page-title called by skeleton.xsl --> 
 <xsl:template name="get-page-title">
     <xsl:choose>
     <xsl:when test="/MBooksTop/AdvancedSearch/isAdvanced='true'">
       <xsl:text>Full-text Advanced Search Results</xsl:text>
     </xsl:when>
     <xsl:otherwise>
       <xsl:text>Full-text Search Results</xsl:text>
     </xsl:otherwise>
   </xsl:choose>
  </xsl:template>


  <!--XXX temporary overide of template in list_utilsxsl-->
  <!--#################################
       Logic maybe different from CB?
       All Items tab only shows up if both so and ft > 0
       ft and st Tab should only show up if count > 0
       Active tabs should be the limit type
       Hyperlined tabs should be everything but the LimitType (all|ft|so)

       XXX consider changing logic so if limit=ft and there are some results but no ft, then we want to show both tabs but inside the active tab
       we want to show an appropriate  zero results message

   ##################################  -->
  <xsl:template name="Refine">
    <div>

      <xsl:variable name="LimitType">
        <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
      </xsl:variable>

      <xsl:variable name="SearchOnlyCount">
        <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyCount"/>
      </xsl:variable>

      <xsl:variable name="FullTextCount">
        <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCount"/>
      </xsl:variable>
      <!--XXX if we aren't displaying tabs don't put this here? -->
    <ul class="nav nav-tabs">

      <!-- This is for 3 tab logic    <xsl:if test="($FullTextCount &gt; 0) and ($SearchOnlyCount &gt; 0)" -->
      <!--XXX logic below assumes only an all tab and one other -->
     <xsl:if test="($FullTextCount &gt; 0) or ($SearchOnlyCount &gt; 0)">
        

        <!-- display all items tab-->
        <div>
          <!--          <xsl:call-template name="DisplayAllItemsTab"/>-->
          <xsl:call-template name="DisplayTab">
            <xsl:with-param name="active">
              <xsl:if test="$LimitType ='all'">
                <xsl:text>true</xsl:text>
              </xsl:if>
            </xsl:with-param>

            <xsl:with-param name="text">All Items </xsl:with-param>
            
            <xsl:with-param name="count">
              <xsl:value-of select="/MBooksTop/LimitToFullText/AllItemsCountDisplay" />
            </xsl:with-param>
            
            <xsl:with-param name="href">
              <xsl:value-of select="/MBooksTop/LimitToFullText/AllHref"/>
            </xsl:with-param>
          </xsl:call-template>

        </div>
      </xsl:if>

        <!-- display search only tab  commented out for now-->
        <!--################################################

    <xsl:if test="$SearchOnlyCount &gt; 0">

      <div>

        <xsl:call-template name="DisplayTab">
          <xsl:with-param name="active">
            <xsl:if test="$LimitType ='so'">
              <xsl:text>true</xsl:text>
            </xsl:if>
          </xsl:with-param>

          <xsl:with-param name="text">Limited (search only) </xsl:with-param>
            
          <xsl:with-param name="count">
            <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyCountDisplay" />
          </xsl:with-param>
            
          <xsl:with-param name="href">
            <xsl:value-of select="/MBooksTop/LimitToFullText/SearchOnlyHref"/>
          </xsl:with-param>
        </xsl:call-template>

      </div>
    </xsl:if>
    ################################################ -->
      
   
    <xsl:if test="($FullTextCount &gt; 0)  or ($LimitType ='ft')">
        <!-- display full text tab-->
        <div>

          <xsl:call-template name="DisplayTab">
            <xsl:with-param name="active">
              <xsl:if test="$LimitType ='ft'">
                <xsl:text>true</xsl:text>
              </xsl:if>
            </xsl:with-param>

            <xsl:with-param name="text">Full View </xsl:with-param>
            
            <xsl:with-param name="count">
              <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCountDisplay" />
            </xsl:with-param>
            
            <xsl:with-param name="href">
              <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextHref"/>
            </xsl:with-param>
          </xsl:call-template>

        </div>
      </xsl:if>
      <!--XXX test -->

    <xsl:if test="($FullTextCount = 0) and ($SearchOnlyCount &gt; 0) and ($LimitType='all') ">
        <!-- display full text tab with 0 results and not active-->
        <div>

          <xsl:call-template name="DisplayTab">
            <xsl:with-param name="active">
                <xsl:text>false</xsl:text>
            </xsl:with-param>

            <xsl:with-param name="text">Full View</xsl:with-param>
            
            <xsl:with-param name="count">
              <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCountDisplay" />
            </xsl:with-param>
            
            <xsl:with-param name="href">
              <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextHref"/>
            </xsl:with-param>
          </xsl:call-template>

        </div>
      </xsl:if>
    </ul>
    </div>
  </xsl:template>

  <!--################################# Template  #################################-->

    <xsl:template name="DisplayTab">
        <xsl:param name="active" value="false"/>
        <xsl:param name="text" value="Bad Text"/>
        <xsl:param name="count" value="Bad count"/>
        <xsl:param name="href" value="Bad href"/>
      <xsl:choose>
        <xsl:when test="$active = 'true'">
          <li class="viewall active">
            <span>
              <xsl:value-of select="$text"/>
              <xsl:text> (</xsl:text>
              <xsl:value-of select="$count" />)
            </span>
          </li>
        </xsl:when>
        <!-- XXX test tab with 0 results-->
        <xsl:when test="$active = 'zero'">
          <li class="zero">
            <span class="disabled">
              <xsl:value-of select="$text"/>
              <xsl:text> (</xsl:text>
              <xsl:value-of select="$count" />)
            </span>
          </li>
        </xsl:when>

        <xsl:otherwise>
            <li class="viewall">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="$href"/>
                </xsl:attribute>
                <xsl:value-of select="$text"/>
                <xsl:text> (</xsl:text>
                <xsl:value-of select="$count" />)
              </xsl:element>
            </li>
        </xsl:otherwise>
      </xsl:choose>


    </xsl:template>
    

  
</xsl:stylesheet>
