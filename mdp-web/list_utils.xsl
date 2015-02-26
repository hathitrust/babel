<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <!-- MBooks global variables -->

  <xsl:variable name="g_current_sort_param" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']"/>
  <!-- need to separate sort and dir from sort param i.e. title_d = sort=title dir=d -->
  <xsl:variable name="g_current_sort" select="substring-before($g_current_sort_param,'_')"/>
  <xsl:variable name="g_current_sort_dir" select="substring-after($g_current_sort_param,'_')"/>

  <xsl:variable name="debug" >
    <xsl:value-of select="/MBooksTop/MBooksGlobals/Debug"/>
  </xsl:variable>

  <!-- end global variables -->

  <!-- list_items/search_results global variables  -->

  <!-- date debugging info tbw -->
  <xsl:variable name="dateDebug">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
  </xsl:variable>


  <xsl:variable name="ItemListType">
    <xsl:choose>
      <xsl:when test="/MBooksTop/SearchResults">SearchResults</xsl:when>
      <xsl:when test="/MBooksTop/ItemList">ItemList</xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:variable name="spaced_coll_name">
    <xsl:value-of select="/MBooksTop/EditCollectionWidget/SpacedCollName"/>
  </xsl:variable>

  <xsl:variable name="coll_name">
    <xsl:value-of select="/MBooksTop/CollectionName"/>
  </xsl:variable>
  <xsl:variable name="action">
    <xsl:call-template name="GetAction"/>
  </xsl:variable>

  <xsl:variable name="hidden_c_param">
    <input type="hidden" name="c">
      <xsl:attribute name="value">
        <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
      </xsl:attribute>
    </input>
  </xsl:variable>

  <xsl:variable name="hidden_pn_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='pn']">
      <input  name="pn" type="hidden">
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
      <input  name="dir" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='dir']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>

  <xsl:variable name="hidden_sz_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sz']">
      <input  name="sz" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sz']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>

  <xsl:variable name="hidden_debug_param">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
      <input  name="debug" type="hidden">
        <xsl:attribute name="value">
          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
        </xsl:attribute>
      </input>
    </xsl:if>
  </xsl:variable>

  <xsl:variable name="FullTextCount">
    <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextCount"/>
  </xsl:variable>

  <xsl:variable name="AllItemsCount">
    <xsl:value-of select="/MBooksTop/LimitToFullText/AllItemsCount"/>
  </xsl:variable>

  <!-- used in 2 templates called by Operation results -->
    <xsl:variable name="to_coll_url">
      <xsl:element name="a">
        <xsl:attribute name ="class">inlineLink</xsl:attribute>
        <xsl:attribute name ="href">
          <xsl:value-of select="/MBooksTop/OperationResults/ToCollHref"/>
        </xsl:attribute>
        <span class="collectionName">
          <xsl:value-of select="/MBooksTop/OperationResults/ToCollName"/>
        </span>
      </xsl:element>
      <xsl:text>. </xsl:text>
    </xsl:variable>




  <xsl:template name="GetAction">
    <xsl:variable name="delAction">
      <xsl:value-of select="/MBooksTop/OperationResults/DeleteItemsInfo/DelActionType"/>
    </xsl:variable>
    <xsl:variable name="CopyMoveAction">
      <xsl:value-of select="/MBooksTop/OperationResults/CopyActionType"/>
    </xsl:variable>
    <xsl:choose>
      <xsl:when test=" starts-with ($CopyMoveAction, 'movit')">movit</xsl:when>
      <xsl:when test="starts-with ($CopyMoveAction, 'copyit')">copyit</xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$delAction"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- ############################################# end global list_items/search_results variables -->


  <xsl:template name="EmptyCollection">

    <div id="ColContainer">
      <xsl:call-template name="EditCollectionWidget"/>
      <div class="ColContent ">
        <h4 class="SkipLink">List of items and actions</h4>

        <xsl:if test="$action='copyit' or $action='movit'or $action='copyitnc' or $action='movitnc' or $action='delit'">
          <div class="alert" id="alert">
            <xsl:call-template name="OperationResults" />
          </div>
        </xsl:if>

            <div class="infoAlert">
          <xsl:text>There are 0 items in </xsl:text>
          <span class="colName"><xsl:value-of select="$coll_name"/></span>
          <xsl:text> Collection</xsl:text><br></br>
          <xsl:text>Copy or move items from </xsl:text>
          <xsl:element name="a">
            <xsl:attribute name ="class">inlineLink</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/Header/PubCollLink"/>
            </xsl:attribute>
            <span class="" title="Public MBooks Collections">a public collection</span>
          </xsl:element>
          <xsl:text> or </xsl:text>
          <xsl:element name="a">
            <xsl:attribute name ="class">inlineLink</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/Header/PrivCollLink"/>
            </xsl:attribute>
            <span class="" title="My MBooks Collections">another of your collections</span>
          </xsl:element>

          <xsl:text> or </xsl:text>
          <a href="http://www.hathitrust.org/" class="inlineLink"><span class="" title="New HathiTrust Search">Search HathiTrust</span></a>
          <xsl:text> for new items</xsl:text>
        </div>
      </div>
    </div>

  </xsl:template>



  <xsl:template name="decideDisplayRefine">

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

    <xsl:if test="$AllItemsCount&gt;1">
      <xsl:choose>
        <xsl:when test="$FullTextCount&gt;0">
          <xsl:choose>
            <xsl:when test="$AllItemsCount = $FullTextCount">
              <!-- either they are all full text or all view-only so don't display widget-->
              <xsl:call-template name="Refine" />
            </xsl:when>
            <xsl:otherwise>
                <xsl:call-template name="Refine"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:when>
        <xsl:otherwise>
          <div class="alert alert-info">
            <!--XXX tbw different message needed for ls-->
            <p>There are no Full View items in this collection</p>
          </div>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <xsl:template name="Refine">
    <div>
      <xsl:variable name="Limit">
        <xsl:value-of select="/MBooksTop/LimitToFullText/Limit"/>
      </xsl:variable>

      <xsl:choose>

        <xsl:when test="$AllItemsCount = $FullTextCount">
          <!-- only full text -->
          <ul class="nav nav-tabs">
            <li class="viewall active">
              <span>All Items (<xsl:value-of select="$AllItemsCount" />)</span>
            </li>
          </ul>
        </xsl:when>

        <xsl:when test ="$Limit = 'YES'">
          <!-- we are currently showing the result of narrow to full text so we want a URL to all -->
          <ul class="nav nav-tabs">
            <li class="viewall">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/LimitToFullText/AllHref"/>
                </xsl:attribute>
                <xsl:text>All Items (</xsl:text>
                <xsl:value-of select="$AllItemsCount"/>
                <xsl:text>)</xsl:text>
              </xsl:element>
            </li>
            <li class="fulltext active">
              <span>
                <xsl:text>Only Full view (</xsl:text>
                <xsl:value-of select="$FullTextCount"/>
                <xsl:text>)</xsl:text>
              </span>
            </li>
          </ul>
        </xsl:when>

        <xsl:otherwise>
          <!-- we are currently showing all so we want to show a url for  narrow to full text  -->

          <ul class="nav nav-tabs">
            <li class="viewall active">
              <span>
                <xsl:text>All Items (</xsl:text>
                <xsl:value-of select="$AllItemsCount"/>
                <xsl:text>)</xsl:text>
              </span>
            </li>
            <li class="fulltext">
              <xsl:element name="a">
                <xsl:attribute name="class">fulltext</xsl:attribute>
                <xsl:attribute name="title">full view</xsl:attribute>
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/LimitToFullText/FullTextHref"/>
                </xsl:attribute>
                <xsl:text>Only Full view (</xsl:text>
                <xsl:value-of select="$FullTextCount"/>
                <xsl:text>)</xsl:text>
              </xsl:element>
            </li>
          </ul>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="IndexingStatusMsg">
    <xsl:variable name="all_items_indexed">
      <xsl:value-of select="/MBooksTop/SearchWidget/AllItemsIndexed"/>
    </xsl:variable>

    <xsl:variable name="num_in_collection">
      <xsl:value-of select="/MBooksTop/SearchWidget/NumItemsInCollection"/>
    </xsl:variable>

    <xsl:variable name="num_not_indexed">
      <xsl:value-of select="/MBooksTop/SearchWidget/NumNotIndexed"/>
    </xsl:variable>

    <xsl:variable name="num_deleted">
      <xsl:value-of select="/MBooksTop/SearchWidget/NumDeleted"/>
    </xsl:variable>

    <xsl:variable name="num_queued">
      <xsl:value-of select="$num_not_indexed - $num_deleted"/>
    </xsl:variable>

    <xsl:variable name="num_not_indexed_verb">
      <xsl:choose>
        <xsl:when test="$num_not_indexed > 1">
          <xsl:text> items are </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item is </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="num_queued_verb">
      <xsl:choose>
        <xsl:when test="$num_queued > 1">
          <xsl:text> items are </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item is </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="num_deleted_verb">
      <xsl:choose>
        <xsl:when test="$num_deleted > 1">
          <xsl:text> items have been</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item has been</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:if test="$all_items_indexed='FALSE'">
      <xsl:element name="div">
        <xsl:attribute name="id">
          <xsl:text>ListSearchInfoAlert</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="class">
          <xsl:text>alert</xsl:text>
        </xsl:attribute>

        <xsl:element name="span">
          <xsl:attribute name="class">
            <xsl:text>IndexMsgSearchResults</xsl:text>
          </xsl:attribute>
          <xsl:text>Of </xsl:text><xsl:value-of select="$num_in_collection"/><xsl:text> items in this collection, </xsl:text>
          <xsl:value-of select="$num_not_indexed"/><xsl:value-of select="$num_not_indexed_verb"/><xsl:text>not available for searching. </xsl:text>

          <xsl:if test="$num_deleted > 0">
            <xsl:value-of select="$num_deleted"/><xsl:value-of select="$num_deleted_verb"/><xsl:text> deleted from the repository. </xsl:text>
          </xsl:if>

          <xsl:if test="$num_queued > 0">
            <xsl:value-of select="$num_queued"/><xsl:value-of select="$num_queued_verb"/>
            <xsl:text> queued to be indexed, usually within 48 hours.</xsl:text>
          </xsl:if>
        </xsl:element>
      </xsl:element>
    </xsl:if>
  </xsl:template>

  <xsl:template name="DisplayContent">
    <xsl:param name="title" />
    <xsl:param name="item-list-contents" />
    <div role="main">

      <xsl:call-template name="ItemList">
        <xsl:with-param name="item-list-contents" select="$item-list-contents" />
      </xsl:call-template>

    </div>  <!-- end div ColContainer -->
  </xsl:template>


  <xsl:template name="OperationResults">

    <xsl:variable name="already_count">
      <xsl:value-of select="OperationResults/AlreadyInColl2Count"/>
    </xsl:variable>

    <xsl:variable name="added_count">
      <xsl:value-of select="OperationResults/IdsAdded"/>
    </xsl:variable>

    <xsl:variable name="DelValidCount">
      <xsl:value-of select="OperationResults/DeleteItemsInfo/DelValidCount"/>
    </xsl:variable>


    <xsl:if test="$added_count &gt; 0">
      <xsl:call-template name="CopiedOrMoved">
        <xsl:with-param name="added_count">
          <xsl:value-of select="$added_count"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>

    <xsl:if test="$already_count &gt; 0">
      <xsl:value-of select="$already_count"/>
      <xsl:choose>
        <xsl:when test="$already_count &gt; 1">
          <xsl:text> items were </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item was </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:text> already in </xsl:text>
      <xsl:copy-of select="$to_coll_url"/>
    </xsl:if>



    <xsl:if test="$DelValidCount &gt; 0 and $action='delit'">
      <xsl:call-template name="Deleted">
        <xsl:with-param name="DelValidCount">
          <xsl:value-of select="$DelValidCount"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>

  </xsl:template>


  <xsl:template name="CopiedOrMoved">
    <xsl:param name="added_count"/>

    <xsl:variable name="ToCollName">
      <xsl:value-of select="OperationResults/ToCollName"/>
    </xsl:variable>

    <xsl:variable name="CollName">
      <xsl:value-of select="OperationResults/CollName"/>
    </xsl:variable>

    <xsl:variable name="ActionName">
      <xsl:choose>
        <xsl:when test="$action = 'movit'">moved</xsl:when>
        <xsl:when test="$action = 'delit'">deleted</xsl:when>
        <xsl:when test="$ToCollName = $CollName">restored</xsl:when>
        <xsl:otherwise>copied</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>


    <!-- move or copied text starts here -->

    <xsl:value-of select="$added_count"/>
    <xsl:choose>
      <xsl:when test="$added_count &gt; 1">
        <xsl:text> items were </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> item was </xsl:text>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:value-of select="$ActionName"/>
    <xsl:choose>
      <xsl:when test="$ActionName = 'restored'">
        <xsl:text> to collection </xsl:text>
        <span class="colName">
        <xsl:value-of select="$coll_name"/>
        </span>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> from </xsl:text>
        <span class="colName">
          <xsl:value-of select="$coll_name"/>
        </span>
        <xsl:text> to </xsl:text>
        <xsl:copy-of select="$to_coll_url"/>
      </xsl:otherwise>
      </xsl:choose>

    </xsl:template>


    <xsl:template name="Deleted">
      <xsl:param name="DelValidCount"/>

      <xsl:value-of select="$DelValidCount"/>
      <xsl:choose>
        <xsl:when test="$DelValidCount &gt; 1">
          <xsl:text> items were </xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text> item was </xsl:text>
        </xsl:otherwise>
      </xsl:choose>
      <xsl:text>deleted from collection: </xsl:text>
      <span class="colName">
        <xsl:value-of select="OperationResults/DeleteItemsInfo/DeleteFromCollName"/>
      </span>

      <span class="undo">
		    <xsl:text>(</xsl:text>
        <a>
          <xsl:attribute name="href">
          <xsl:attribute name ="class">inlineLink</xsl:attribute>
            <xsl:value-of select="OperationResults/DeleteItemsInfo/UndoDelHref"/>
          </xsl:attribute>undo
		    </a>
		    <xsl:text>)</xsl:text>
      </span>
    </xsl:template>


  <xsl:template name="BuildCollectionSelect">
    <xsl:variable name="select_collection_text">Select Collection</xsl:variable>

    <label class="SkipLink" for="c2">Select Collection</label>
    <select name="c2" id="c2">

      <option value="0" selected="selected">
        <xsl:value-of select="$select_collection_text"/>
      </option>

      <option value="__NEW__" id="NewC">
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



  <xsl:template name="BuildPagingControls">
    <xsl:param name="which_paging"/>
    <!-- variable top or bottom so we can determine which widget to read from js -->
    <div>
      <xsl:attribute name="class">
        <xsl:text>PageInfo </xsl:text>
        <xsl:value-of select="$which_paging"/>
      </xsl:attribute>
      <!-- rec per page widget-->
      <!-- for-each so we can provide context to template.  Why not have an optional parameter
           so we don't have to do a foreach           -->
      <div class="resultsPerPage">
        <xsl:for-each select="/MBooksTop/Paging/SliceSizeWidget">
          <label for="{$which_paging}" class="SkipLink">Items per page:</label>
          <xsl:call-template name="BuildHtmlSelect">
            <xsl:with-param name="id">
              <xsl:value-of select="$which_paging"/>
            </xsl:with-param>
            <xsl:with-param name="class" select="'sz'"/>
<!--             <xsl:with-param name="key">
              <xsl:text>redisplay_new_slice_size(&quot;</xsl:text>
              <xsl:value-of select="$which_paging"/>
              <xsl:text>&quot;)</xsl:text>
            </xsl:with-param> -->
          </xsl:call-template>
        </xsl:for-each>
      </div>
      <div class="pagingNav">
        <xsl:call-template name="Paging"/>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="BuildItemSelectActions">
    <div class="SelectedItemActions">
      <xsl:call-template name="BuildCollectionSelect"/>

      <input type="hidden" name="a" id="a"/>

      <button class="btn btn-small" id="addits" value="addits">Add Selected</button>

      <!-- if they don't own the collection they shouldn't be able to delete (or move) items -->
      <xsl:choose>
        <xsl:when test="/MBooksTop/EditCollectionWidget/OwnedByUser='yes' ">
          <button class="btn btn-small" id="movit" value="movit">Move Selected</button>
          <button class="btn btn-small" id="delit" value="delit">Remove Selected</button>
        </xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>


  <!--##############################################################  PAGING #########################-->
  <xsl:template name="Paging">

    <ul class="PageWidget">
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

  <xsl:template name="allpages">
    <xsl:for-each select="/MBooksTop/Paging/PageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>
  </xsl:template>

  <xsl:template name="somepages">
    <!--EXPERIMENTAL CODE-->
    <xsl:for-each select="/MBooksTop/Paging/StartPageLinks/PageURL">
      <xsl:call-template name="output_page_link_or_current_page"/>
    </xsl:for-each>

    <!--##################### only if we want two elipsis
    <xsl:if test="/MBooksTop/Paging/StartPageLinks/PageURL">
      <li class="elipsis">
        <xsl:text>...start</xsl:text>
      </li>
    </xsl:if>
    ######################################-->
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

  <!--##############################################################  END PAGING #########################-->


  <xsl:template name="BuildSortWidget">

    <div id="SortWidget">

      <xsl:for-each select="/MBooksTop/SortWidget/SortWidgetSort">
          <label for="SortWidgetSort">Sort by: </label>
          <xsl:call-template name="BuildHtmlSelect">
            <xsl:with-param name="id">SortWidgetSort</xsl:with-param>
            <xsl:with-param name="class" select="'sort'"/>
<!--             <xsl:with-param name="key">
              <xsl:text>doSort()</xsl:text>
            </xsl:with-param> -->
          </xsl:call-template>
        </xsl:for-each>

      </div>

    </xsl:template>

  <!--##############################################################  END BuildSortWidget #########################-->
  <!-- Sort direction pointer -->
  <xsl:template name="get_sort_arrow">
    <xsl:param name="which_sort"/>
    <xsl:if test="$which_sort=$g_current_sort">
      <!-- display arrow -->
      <xsl:choose>
        <xsl:when test="$g_current_sort_dir='a'">
          <img width="12" height="10" src="//common-web/graphics/arrow_up.gif" alt="sort descending"/>
        </xsl:when>
        <xsl:otherwise>
          <img width="12" height="10" src="//common-web/graphics/arrow_down.gif" alt="sort ascending"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <!-- temporary hard coded column names should come from xml -->
  <xsl:template name="BuildItemListHeadings">
    <thead>
      <tr>
        <th>Select<br/><input type="checkbox" id="checkAll"/></th>
        <!-- Title -->
        <th>
          <xsl:choose>
            <xsl:when test="$g_current_sort='title'">
              <xsl:attribute name="class">CurrentSort ItemTitle</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="class">ItemTitle</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>

          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/TitleSortHref"/>
            </xsl:attribute>
            <xsl:text>Title</xsl:text>
            <xsl:call-template name="get_sort_arrow">
              <xsl:with-param name="which_sort" select="'title'"/>
            </xsl:call-template>
          </xsl:element>
        </th>

        <!--Author-->
        <th>
          <xsl:choose>
            <xsl:when test="$g_current_sort='auth'">
              <xsl:attribute name="class">CurrentSort ItemAuthor</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="class">ItemAuthor</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>

          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/AuthorSortHref"/>
            </xsl:attribute>
            <xsl:text>Author</xsl:text>
            <xsl:call-template name="get_sort_arrow">
              <xsl:with-param name="which_sort" select="'auth'"/>
            </xsl:call-template>
          </xsl:element>
        </th>

        <!-- Date -->
        <th>
          <xsl:choose>
            <xsl:when test="$g_current_sort='date'">
              <xsl:attribute name="class">CurrentSort ItemDate</xsl:attribute>
            </xsl:when>
            <xsl:otherwise>
              <xsl:attribute name="class">ItemDate</xsl:attribute>
            </xsl:otherwise>
          </xsl:choose>

          <xsl:element name="a">
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/DateSortHref"/>
            </xsl:attribute>
            <xsl:text>Date</xsl:text>
            <xsl:call-template name="get_sort_arrow">
              <xsl:with-param name="which_sort" select="'date'"/>
            </xsl:call-template>
          </xsl:element>
        </th>

        <!--XXX tbw SEARCH needs rel rank and sorting so test for presense of the RelSortHref-->
        <xsl:if test="/MBooksTop/RelSortHref">
          <th>
            <xsl:choose>
              <xsl:when test="$g_current_sort='rel'">
                <xsl:attribute name="class">CurrentSort ItemRel</xsl:attribute>
              </xsl:when>
              <xsl:otherwise>
                <xsl:attribute name="class">ItemRel</xsl:attribute>
              </xsl:otherwise>
            </xsl:choose>

            <xsl:element name="a">
              <xsl:attribute name="href">
                <xsl:value-of select="/MBooksTop/RelSortHref"/>
              </xsl:attribute>
              <xsl:text>Relevance/10000</xsl:text>
              <xsl:call-template name="get_sort_arrow">
                <xsl:with-param name="which_sort" select="'rel'"/>
              </xsl:call-template>
            </xsl:element>

          </th>
        </xsl:if>

        <th>In My Collections</th>
        <th>Links to Text</th>
      </tr>
    </thead>
  </xsl:template>


  <xsl:template name="ItemList">
    <xsl:param name="item-list-contents" />
    <div class="actions">
      <form id="form1" name="form1" method="get" action="mb?">
        <xsl:copy-of select="$hidden_c_param"/>
        <xsl:copy-of select="$hidden_pn_param"/>
        <xsl:copy-of select="$hidden_sort_param"/>
        <xsl:copy-of select="$hidden_dir_param"/>
        <xsl:copy-of select="$hidden_sz_param"/>
        <xsl:copy-of select="$hidden_debug_param"/>

        <xsl:if test="$ItemListType='SearchResults'">
          <xsl:variable name="hidden_q1_param">
            <input type="hidden" name="q1">
              <xsl:attribute name="value">
                <xsl:value-of select="/MBooksTop/QueryString"/>
              </xsl:attribute>
            </input>
          </xsl:variable>

          <xsl:copy-of select="$hidden_q1_param"/>
          <input type="hidden" name="page" value="srchresults"/>
        </xsl:if>

        <div class="toolbar" role="toolbar">
          <h3 class="offscreen">Tools for sorting and filtering the list</h3>
          <!--XXX tbw BuildSortWidget not applicable for ls-->
          <xsl:call-template name="BuildSortWidget"/>
          <xsl:call-template name="BuildPagingControls">
              <xsl:with-param name="which_paging" select="'top_paging'"/>
          </xsl:call-template>
        </div>
        <div class="toolbar alt" role="toolbar">
          <h3 class="offscreen">Tools for collection management</h3>
          <div class="selectAll"><label>Select all on page <input type="checkbox" id="checkAll"/></label></div>
          <xsl:call-template name="BuildItemSelectActions"/>
        </div>

        <h3 class="offscreen">List of <xsl:value-of select="$item-list-contents" /></h3>
        <xsl:choose>
          <xsl:when test="$ItemListType='SearchResults'">
            <xsl:for-each select="SearchResults/Item">
              <xsl:call-template name="BuildItemChunk"/>
            </xsl:for-each>
          </xsl:when>
          <xsl:otherwise>
            <xsl:for-each select="ItemList/Item">
              <xsl:call-template name="BuildItemChunk"/>
            </xsl:for-each>
          </xsl:otherwise>
        </xsl:choose>

        <!-- XX TODO : should be removable -->
        <!-- <div id="listisFooter">
          <xsl:call-template name="BuildPagingControls">
            <xsl:with-param name="which_paging" select="'bottom_paging'"/>
          </xsl:call-template>
        </div> -->

        <xsl:call-template name="BuildPagingControls">
          <xsl:with-param name="which_paging" select="'bottom_paging'"/>
        </xsl:call-template>
      </form>
    </div>
    <!-- end div actions-->
  </xsl:template>

  <xsl:template name="inMyColls">
    <li>
      <xsl:choose>
        <xsl:when test="$ItemListType='SearchResults'">
          <xsl:call-template name="getSearchCollUrl"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="getListItemsCollUrl"/>
        </xsl:otherwise>
      </xsl:choose>
    </li>
  </xsl:template>

  <xsl:template name="getListItemsCollUrl">
    <xsl:choose>
      <xsl:when test="$coll_name!=string(CollectionName)">
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:copy-of select="CollHref"/>
          </xsl:attribute>
          <xsl:value-of select="CollectionName"/>
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <span id="currCollName"><xsl:value-of select="$coll_name"/></span>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="getSearchCollUrl">
    <!-- for list search results we want current collection highlighted -->
    <!-- for list search all should be hyperlinked but current coll name should be in
         span id=currCollName -->

    <xsl:element name="a">
      <xsl:attribute name="href">
        <xsl:copy-of select="CollHref"/>
      </xsl:attribute>
      <xsl:choose>
        <xsl:when test="$coll_name=string(CollectionName)">
          <span id="currCollName"><xsl:value-of select="CollectionName"/></span>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="CollectionName"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:element>
  </xsl:template>


  <xsl:template name="SearchWidget">
    <xsl:param name="label">Search in this collection</xsl:param>
    <xsl:if test="/MBooksTop/SearchWidget/NumItemsInCollection > 0">
      <form id="itemlist_searchform" method="get" action="mb" name="searchcoll" class="form-inline">
        <xsl:call-template name="HiddenDebug"/>
        <label for="q1"><xsl:value-of select="$label" /></label>
        <input type="text" size="30" maxlength="150" name="q1" id="q1" class="input-xlarge">
          <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='a']='listsrch'">
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/QueryString"/>
            </xsl:attribute>
          </xsl:if>
        </input>
        <input type="hidden" name="a" value="srch"/>
        <button class="btn" type="submit" name="a" id="srch" value="srch">Find</button>
        <xsl:copy-of select="$hidden_c_param"/>
      </form>
    </xsl:if>
  </xsl:template>


  <xsl:template name="BuildItemChunk">
    <!--#######################  variables used for each chunk-->

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
    <!-- enum date stuff for debugging -->
    <xsl:variable name="UseDate">
      <xsl:value-of select="UseDate"/>
    </xsl:variable>

    <xsl:variable name="EnumDate">
      <xsl:value-of select="EnumDate"/>
    </xsl:variable>
    <xsl:variable name="BothDate">
      <xsl:value-of select="BothDate"/>
    </xsl:variable>


    <!--################################## end variables-->

    <div class="{$row_class}">
      <xsl:variable name="item-number" select="position()" />
      <!-- push2 -->
      <div class="span{$span-n} push2 metadata">
        <h4 class="Title">
          <span class="offscreen">Item <xsl:value-of select="$item-number" />: </span>
          <xsl:call-template name="GetTitle"/>
        </h4>
        <!-- Author -->
        <xsl:if test="Author!=''">
          <div class="result-metadata-author">
            <span class="ItemAuthorLabel">
              <xsl:text>by </xsl:text>
            </span>

            <span class="Author">
              <xsl:value-of select="Author"  disable-output-escaping="yes"/>
            </span>
          </div>
        </xsl:if>

	<!-- date in $UseDate depends on date_type set in config  -->

        <div class="result-metadata-published">
          <span class="Date">
            <xsl:choose>
              <xsl:when test="$UseDate='0000'">
                <!-- bad date string from pi goes here-->
                <xsl:text>Published ----</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <span class="ItemDateLabel">
                  <xsl:text>Published </xsl:text>
                </span>
                <xsl:value-of select="$UseDate"/>
              </xsl:otherwise>
            </xsl:choose>
          </span>
	</div>

	<!-- additional information for debug=date -->
	<xsl:if test="contains($dateDebug,'date')">
	<div>
          <span class="Date">
            <xsl:choose>
              <xsl:when test="$Date='0000'">
                <!-- bad date string from pi goes here-->
                <xsl:text>bibdate ----</xsl:text>
              </xsl:when>
              <xsl:otherwise>
                <span class="ItemDateLabel">
                  <xsl:text>bibdate: </xsl:text>
                </span>
                <xsl:value-of select="$Date"/>
              </xsl:otherwise>
            </xsl:choose>
          </span>
	</div>


	<xsl:if test="normalize-space($BothDate)">
	  <div>
	    <span class="Date">
	      <xsl:choose>
		<xsl:when test="$BothDate='0000'">
		  <!-- bad date string from pi goes here-->
		  <xsl:text>bothdate ----</xsl:text>
		</xsl:when>
		<xsl:otherwise>
		  <span class="ItemDateLabel">
		    <xsl:text>bothdate: </xsl:text>
		  </span>
		  <strong>
		    <xsl:value-of select="$BothDate"/>
		  </strong>
		</xsl:otherwise>
	      </xsl:choose>
	    </span>
	  </div>
	</xsl:if>
	
	<xsl:if test="normalize-space($EnumDate)">
	  <div>
	    <span class="Date">
	      <xsl:choose>
		<xsl:when test="$EnumDate='0000'">
		  <!-- bad date string from pi goes here-->
		  <xsl:text>enumdate ----</xsl:text>
		</xsl:when>
		<xsl:otherwise>
		  <span class="ItemDateLabel">
		    <xsl:text>enumdate: </xsl:text>
		  </span>
		  <xsl:value-of select="$EnumDate"/>
		</xsl:otherwise>
	      </xsl:choose>
	    </span>
	  </div>
	</xsl:if>
	</xsl:if>
<!--end date debugging stuff-->




        <!-- SEARCH needs relevance -->
        <xsl:if test="$ItemListType='SearchResults'">
          <span class="Relevance debug">
            <xsl:text>relevance score: </xsl:text>
            <xsl:value-of select="relevance"/>
          </span>
        </xsl:if>

        <div class="result-access-link">
          <ul>
            <li>
              <!--tbw catalog link hard coded text   div needs a class!-->
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
                  <xsl:value-of select ="record"/>
                </xsl:attribute>
                <xsl:attribute name="title">
                  <xsl:text>for item </xsl:text><xsl:value-of select="$item-number" />
                </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:text>cataloglinkhref icomoon-info-circle</xsl:text>
                </xsl:attribute>
                <xsl:text>Catalog Record</xsl:text>
              </xsl:element>
            </li>
            <li>
                <!-- <span class="debug">
                  <xsl:text>rights: </xsl:text>
                  <xsl:value-of select="rights"/>
                </span> -->
              <xsl:value-of select="$fulltext_string"/>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="PtHref"/>
                </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:value-of select="$fulltext_class"/>
                </xsl:attribute>
                <xsl:attribute name="title">
                  <xsl:text>for item </xsl:text><xsl:value-of select="$item-number" />
                </xsl:attribute>
                <xsl:value-of select="$fulltext_link_string"/>
              </xsl:element>
            </li>
          </ul>
        </div>

      </div>

      <!-- options span2 pull{$span-n + 2} -->
      <!-- options span1 pull{$span-n + 1}_5 -->
      <div class="options span2 pull{$span-n + 2}">
        <div class="cover">
          <xsl:if test="normalize-space(bookID)">
            <xsl:attribute name="data-bookID"><xsl:value-of select="bookID" /></xsl:attribute>
            <xsl:attribute name="data-hdl"><xsl:value-of select="ItemID" /></xsl:attribute>
          </xsl:if>
        </div>
        <div class="select">
          <label class="offscreen" for="id{$item-number}">Select item <xsl:value-of select="$item-number" /></label>
          <input type="checkbox" name="id" class="id" id="id{$item-number}">
            <xsl:attribute name="value">
              <xsl:value-of select="ItemID"/>
            </xsl:attribute>
          </input>
        </div>
      </div>

      <xsl:if test="Collections">
        <div class="in-collections span3">
          <h5>
            <xsl:text>In my collections: </xsl:text>
          </h5>

          <ul class="inMyColls">
            <xsl:for-each select="Collections/Collection">
              <xsl:call-template name="inMyColls"/>
            </xsl:for-each>
            <!-- add "-" when the item isn't in any collections -->
            <xsl:for-each select="Collections">
              <xsl:if test =" not(Collection)">
                <li>---</li>
              </xsl:if>
            </xsl:for-each>
          </ul>
        </div>
      </xsl:if>


    </div>

    <xsl:if test="false()">
    <div class="{$row_class}">
      <xsl:variable name="item-number" select="position()" />
      <h4 class="Title">
        <span class="offscreen">Item <xsl:value-of select="$item-number" />: </span>
        <xsl:value-of select="Title" disable-output-escaping="yes" />
      </h4>
      <div class="span1 cover">
        <img src="http://babel.hathitrust.org/cgi/imgsrv/thumbnail?id={ItemID};seq=1;width=60" />
      </div>
      <div class="span1 select">
        <label class="offscreen" for="id{$item-number}">Select item <xsl:value-of select="$item-number" /></label>
        <input type="checkbox" name="id" class="id" id="id{$item-number}">
          <xsl:attribute name="value">
            <xsl:value-of select="ItemID"/>
          </xsl:attribute>
        </input>
      </div>
      <div class="span7 push2 pull">
        <!-- Author -->
        <xsl:if test="Author!=''">
          <div class="result-metadata-author">
            <span class="ItemAuthorLabel">
              <xsl:text>by </xsl:text>
            </span>

            <span class="Author">
              <xsl:value-of select="Author"  disable-output-escaping="yes"/>
            </span>
          </div>
        </xsl:if>

        <div class="result-metadata-published">
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
        <xsl:if test="$ItemListType='SearchResults'">
          <span class="Relevance debug">
            <xsl:text>relevance score: </xsl:text>
            <xsl:value-of select="relevance"/>
          </span>
        </xsl:if>

        <div class="result-access-link">
          <ul>
            <li>
              <!--tbw catalog link hard coded text   div needs a class!-->
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:text>http://catalog.hathitrust.org/Record/</xsl:text>
                  <xsl:value-of select ="record"/>
                </xsl:attribute>
                <xsl:attribute name="title">
                  <xsl:text>for item </xsl:text><xsl:value-of select="$item-number" />
                </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:text>cataloglinkhref icomoon-info-circle</xsl:text>
                </xsl:attribute>
                <xsl:text>Catalog Record</xsl:text>
              </xsl:element>
            </li>
            <li>
                <!-- <span class="debug">
                  <xsl:text>rights: </xsl:text>
                  <xsl:value-of select="rights"/>
                </span> -->
              <xsl:value-of select="$fulltext_string"/>
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:choose>
                    <xsl:when test="$ItemListType='SearchResults'">
                      <!-- if we want first page instead of passing the search to xpat use $pt_href instead of $pt_search_href -->
                      <xsl:value-of select="PtSearchHref"/>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:value-of select="PtHref"/>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:attribute>
                <xsl:attribute name="class">
                  <xsl:value-of select="$fulltext_class"/>
                </xsl:attribute>
                <xsl:attribute name="title">
                  <xsl:text>for item </xsl:text><xsl:value-of select="$item-number" />
                </xsl:attribute>
                <xsl:value-of select="$fulltext_link_string"/>
              </xsl:element>
            </li>
          </ul>
        </div>

          <div class="in-collections span3">
            <h5>
              <xsl:text>In your Collections: </xsl:text>
            </h5>

            <ul class="inMyColls">
              <xsl:for-each select="Collections/Collection">
                <xsl:call-template name="inMyColls"/>
              </xsl:for-each>
              <!-- add "-" when the item isn't in any collections -->
              <xsl:for-each select="Collections">
                <xsl:if test =" not(Collection)">
                  <li>---</li>
                </xsl:if>
              </xsl:for-each>
            </ul>
          </div>
        </div>


      </div>
    </xsl:if>

  </xsl:template>

  <xsl:template name="GetTitle">
    <xsl:value-of select="Title" disable-output-escaping="yes" />
  </xsl:template>



</xsl:stylesheet>


