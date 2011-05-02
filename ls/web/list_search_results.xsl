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
              <div class="betasearch">
                <xsl:call-template name="SearchWidget"/>
              </div>
              <div class="betasearchinfo">  
              </div>

              <xsl:if test="SearchResults/WellFormed!=1">
                <xsl:call-template name="QueryRewrite"/>
              </xsl:if>

              <div class="SearchAndRefine">
                <xsl:call-template name="SearchResults_status"/>
                <div class="refine">
                  <xsl:call-template name="DecideDisplayRefine"/>
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
          <div id="lsSidebarContainer">
          <h1 class="facet">DEBUxG:</h1>
          <xsl:call-template name="facets"/>
        </div>

    <div id="ColContainer">
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
      <form id="form_ls1" name="form_ls1" method="get" action="ls?">
        <xsl:call-template name="GetHiddenParams"/>

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
          <xsl:call-template name="GetHiddenParams"/>
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

      <xsl:value-of select="$all_items_count"/>
      <xsl:text> items found for </xsl:text>
      <xsl:choose>
        <xsl:when test="/MBooksTop/SearchResults/WellFormed=1">
          <!--  Skip this for now but this choose needs reimiplentation in advanced template
               <span>
            <xsl:value-of select="/MBooksTop/QueryString"/>
          </span>
          -->
        </xsl:when>
        <xsl:otherwise>
          <span>
            <xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/>
          </span>
        </xsl:otherwise>
      </xsl:choose>

      <!-- <xsl:text>x in the full text of all items </xsl:text>-->

      <xsl:call-template name="advanced"/>

      <br></br>
      <xsl:text>
        (in </xsl:text>
      <xsl:value-of select="/MBooksTop/SearchResults/QueryTime"/>
      <xsl:text> sec.)</xsl:text>


      <xsl:if test="$debug='YES'">
        <span class="debug">DEBUG </span>
      </xsl:if>

    </div>
  </xsl:template>

  <xsl:template name="advanced">
    <xsl:for-each select="/MBooksTop/AdvancedSearch/Clause">
      <xsl:text> </xsl:text>
      <xsl:value-of select="OP"/><xsl:text> </xsl:text>
      <!-- XXX figure out what the well formed stuff is above and put it here-->
      <span>
        <xsl:value-of select="Query"/>
      </span>
      <xsl:text> in </xsl:text>
      <!-- replace em with css -->
      <em>
        <xsl:value-of select="Field"/>
      </em>
    </xsl:for-each>
  </xsl:template>











  <!-- TEMPLATE -->
  <xsl:template name="QueryRewrite">
    <div class="SearchResults_status">
      <div class="infoAlert">
        One of the operators: <span>AND</span>, <span>OR</span>, <span>)</span>, or <span>(</span> was missing or placed incorrectly in your query. Your query was changed and submitted as: 
        <span>
          <xsl:value-of select="/MBooksTop/SearchResults/ProcessedQueryString"/>
        </span>
      </div>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="NoResults">
    <div id="ColContainer">
      <div class="ColContent">
        <div class="error">
          <xsl:text>Your search for "</xsl:text>
          <xsl:value-of select="/MBooksTop/QueryString"/>
          <xsl:text>" in the </xsl:text>
          <span class="colName"><xsl:value-of select="$coll_name"/></span>
          <xsl:text> returned zero hits.</xsl:text>
        </div>
      </div>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="SolrError">
    <span class="debug">
      <xsl:value-of select="/MBooksTop/SearchResults/SolrError"/>
    </span>
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
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="DecideDisplayRefine">

    <!-- need to handle cases:
         no results    don't display widget
         one result    don't display widget
         all full text  ""
         all view-only  ""
         no full text   ""   display message
         -->

    <!-- only display refine widget if there are more than one items in this collection
         0 or 1 item limit does not make sense
         -->

    <xsl:if test="$all_items_count > 1">
      <xsl:choose>
        <xsl:when test="$full_text_count > 0">
          <xsl:choose>
            <xsl:when test="$all_items_count = $full_text_count">
              <!-- either they are all full text or all view-only so don't display widget-->
            </xsl:when>
            <xsl:otherwise>
                <xsl:call-template name="Refine"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>There are no Full View items in this collection</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="Refine">
    <span>
      <xsl:variable name="Limit">
        <xsl:value-of select="/MBooksTop/LimitToFullText/Limit"/>
      </xsl:variable>

      <xsl:choose>
        <xsl:when test="$Limit='YES'">
          <!-- we are currently showing the result of narrow to full view so we want a URL to all -->
          <ul class="refineTabs">
            <li class="viewall inactive">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/LimitToFullText/AllHref"/>
                </xsl:attribute>
                <xsl:text>All Items (</xsl:text>
                <xsl:value-of select="$all_items_count"/>
                <xsl:text>)</xsl:text>
              </xsl:element>
            </li>
            <li class="fulltext active">
              <xsl:text>Only Full view (</xsl:text>
              <xsl:value-of select="$full_text_count"/>
              <xsl:text>)</xsl:text>
            </li>
          </ul>
        </xsl:when>
        <xsl:otherwise>
          <!-- we are currently showing all so we want to show a url for  narrow to full text  -->
          <ul class="refineTabs">
            <li class="viewall active">
              <xsl:text>All Items (</xsl:text>
              <xsl:value-of select="$all_items_count"/>
              <xsl:text>)</xsl:text>
            </li>
            <li class="inactive">
              <xsl:element name="a">
                <xsl:attribute name="class">fulltext</xsl:attribute>
                <xsl:attribute name="title">full view</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextHref"/>
                </xsl:attribute>
                <xsl:text>Only Full view (</xsl:text>
                <xsl:value-of select="$full_text_count"/>
                <xsl:text>)</xsl:text>
              </xsl:element>
            </li>
          </ul>
        </xsl:otherwise>
      </xsl:choose>
    </span>
  </xsl:template>



  <!--##  PAGING-related ##-->

  <!-- TEMPLATE -->
  <xsl:template name="Paging">
    <ul id="PageWidget">
      <li>
        <xsl:choose>
          <xsl:when test="/MBooksTop/Paging/PrevPage='None'">
            <span class="greyedOut">Previous</span>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name ="a">
              <xsl:attribute name="href">
                <xsl:value-of select="/MBooksTop/Paging/PrevPage/Href"/>
              </xsl:attribute>
              Previous Page
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
              Next
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>
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

          <!--          <span class="ItemTitleLabel">
            <xsl:text>Title:  </xsl:text>
          </span>-->

          <span class="Title">
            <xsl:value-of select="Title" disable-output-escaping="yes" />
          </span>
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
                  <xsl:value-of select="PtSearchHref"/>
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


  <!-- copied from CB list utils tbw-->
  <!--XXX problem is that this is inside a form calling the ls cgi not the mb cgi
       we need a form with the action calling mb additems!
       -->
 <xsl:template name="BuildItemSelectActions">
    <div class="SelectedItemActions">
      <div id="errormsg">
        <div class="bd"></div>
      </div>
      <!--XXX choose either class is overlay or id for hook for javascript to focus widget-->
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

      <!--tbw XXX this code assumes a PI used by CB. Can we reuse it?
           alternative is that somehow the header already knows the
           collections because if you are logged in you get the jump
           to collection widget-->
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
  <!--#################################################
     Will need to redo to create links and or check boxes with proper attributes to be in a form or
      addressable by ajax js
XXX REDO push work for creating urls and separating selected vs unselected back to pi handler!

for now create an href with current_url . &fq=facetname:value
       ################################################-->
  <xsl:template name="facets">

    <div id="selectedFacets">
      <ul>
        <xsl:for-each select="/MBooksTop/Facets/SelectedFacets/facetValue">

          <xsl:text>
          </xsl:text>
          <li>
            <xsl:variable name="value">
              <xsl:value-of select="@name"/>
            </xsl:variable>
            
            <xsl:value-of select="fieldName"/>
            <xsl:text>:</xsl:text>
            <xsl:value-of select="@name"/>
            
            <xsl:element name="a">
              <xsl:attribute name="href">

                <!-- &we need to remove this facet from the cgi -->
                <xsl:value-of select="unselectURL"/>
              </xsl:attribute>
              <xsl:text>(remove)</xsl:text>
            </xsl:element>
            
          </li>
        </xsl:for-each>
      </ul>
    </div>

    <!--  unselected facets ##########################################################   -->
    
    <h2>refine search</h2>
    <div id="facetlist">
      <ul>
        <xsl:for-each select="/MBooksTop/Facets/unselectedFacets/facetField">
          <xsl:text>    
          </xsl:text>
          <li class="facetField"><xsl:value-of select="@name"/></li>
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
          <a  href="">
            <xsl:attribute name="class">
            <!-- need to process name so there are no spaces i.e. "place of publication"-->
              <xsl:value-of select="@name"/>
              <xsl:text> morefacets</xsl:text>
            </xsl:attribute>
            Show More</a>
          <a class="lessfacets" href="">Show Fewer</a>

        </xsl:for-each>
      </ul>
    </div>
  </xsl:template>


  <xsl:template name="facetFields">
    <xsl:param name="fieldName">Unknown facet</xsl:param>
    <ul>
      <xsl:text>
      </xsl:text>
      <xsl:for-each select="facetValue"> 
        <xsl:text>
        </xsl:text>
        <li>

          <xsl:attribute name ="class">
            <xsl:value-of select="@class"/>
            <xsl:text> </xsl:text>
            <!-- need to process fieldname so there are no spaces -->
            <xsl:value-of select="$fieldName"/>
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
                <xsl:text> (</xsl:text>
                <xsl:value-of select="facetCount"/>
                <xsl:text>) </xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="url"/>
                </xsl:attribute>
                
                <xsl:value-of select="$value"/>
                <xsl:text> (</xsl:text>
                <xsl:value-of select="facetCount"/>
                <xsl:text>) </xsl:text>
              </xsl:element>
              
            </xsl:otherwise>
          </xsl:choose>

        </li>
      </xsl:for-each>
    </ul>
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
