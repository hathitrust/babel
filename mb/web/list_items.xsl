<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:template name="setup-extra-header">
    <!-- <link rel="stylesheet" type="text/css" href="/mb/css/mb.css" /> -->
    <link rel="stylesheet" type="text/css" href="/mb/css/results.css" />

<!--     <script src="/mb/web/js/mb.js"></script>
    <script src="/mb/web/js/tracking.js"></script> -->

    <xsl:call-template name="include_local_javascript" />
    <xsl:call-template name="load_js_and_css"/>
  </xsl:template>

  <xsl:template name="contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="list-items-results" />
  </xsl:template>

  <xsl:template name="sidebar">
    <div class="sidebar" role="complementary">
        
      <xsl:call-template name="display-collection-metadata" />
      
    </div>
  </xsl:template>

  <xsl:template name="display-collection-metadata">

    <h2 class="offscreen">About this collection</h2>

    <xsl:if test="//CollectionFeatured/text()">
      <div class="col-featured">
        <img src="{//CollectionFeatured}" alt=" " aria-hide="true" />
      </div>
    </xsl:if>

    <h3 class="cn">
      <!-- $spaced_coll_name ? -->
      <xsl:value-of select="$coll_name" />
    </h3>

    <dl class="collection">
      <dt>Owner</dt>
      <dd>
        <xsl:value-of select="//CollectionOwner" />
      </dd>

      <xsl:if test="normalize-space(//EditCollectionWidget/CollDesc)">
        <dt>Description</dt>
        <dd class="desc">
          <p>
            <xsl:value-of select="//EditCollectionWidget/CollDesc"/>
          </p>
        </dd>
      </xsl:if>

      <xsl:if test="normalize-space(//CollectionContactInfo)">
        <dt>More Information</dt>
        <p><xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" /></p>
      </xsl:if>

      <dt>Status</dt>
      <dd class="status"><xsl:value-of select="//EditCollectionWidget/Status" /></dd>

      <xsl:if test="//EditCollectionWidget/OwnedByUser='yes' ">
        <xsl:call-template name="collection-edit-metadata" />
      </xsl:if>

    </dl>
    
  </xsl:template>

  <xsl:template name="collection-edit-metadata">
    <h3 class="offscreen">Edit collection details</h3>
    <xsl:variable name="shrd">
      <xsl:choose>
        <xsl:when test="EditCollectionWidget/Status = 'private'">0</xsl:when>
        <xsl:otherwise>1</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <p>
      <a 
        href="#" id="trigger-editc"
        class="btn btn-small" 
        data-desc="{normalize-space(EditCollectionWidget/CollDesc)}"
        data-cn="{$coll_name}"
        data-c="{/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']}"
        data-shrd="{$shrd}"
        >Edit</a>
    </p>
  </xsl:template>

  <xsl:template name="list-items-results">
    <xsl:variable name="title">
      <xsl:choose>
        <xsl:when test="SearchResults/Item">
          <xsl:text>Search Results</xsl:text>
        </xsl:when>
        <xsl:when test="ItemList/Item">
          <xsl:text>Collection</xsl:text>
        </xsl:when>
        <xsl:when test="SearchResults[CollEmpty='FALSE']">
          <xsl:text>No Results</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>Empty Collection</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <h2 class="offscreen"><xsl:value-of select="$title" /></h2>
    <div id="mbContentContainer" class="main clearfix">

      <xsl:call-template name="SearchResults_status"/>
      <xsl:call-template name="DisplaySearchWidgetLogic"/>

      <xsl:call-template name="status-update" />

      <xsl:call-template name="decideDisplayRefine"/>
      <xsl:choose>
        <xsl:when test="SearchResults/Item">
          <xsl:call-template name="DisplayContent">
            <xsl:with-param name="title" select="'Search Results'" />
            <xsl:with-param name="item-list-contents" select="'items'" />
          </xsl:call-template>
        </xsl:when>
        <xsl:when test="ItemList/Item">
          <xsl:call-template name="DisplayContent">
            <xsl:with-param name="title">Collection</xsl:with-param>
            <xsl:with-param name="item-list-contents">items</xsl:with-param>
          </xsl:call-template>
        </xsl:when>
        <xsl:when test="SearchResults[CollEmpty='FALSE']">
          <!-- zero results -->
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="EmptyCollection"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>

  </xsl:template>
  
  <xsl:template name="SearchResults_status">
    <xsl:choose>
      <xsl:when test="SearchResults/Item">
        <div class="alert alert-summary">
          <strong>Search Results: </strong>

          <xsl:value-of select="$AllItemsCount"/>
          <xsl:text> item</xsl:text>
          <xsl:if test="$AllItemsCount > 1">s</xsl:if>
          <xsl:text> found for </xsl:text>
          <span>
            <xsl:value-of select="/MBooksTop/QueryString"/>
          </span>
          <xsl:text> in </xsl:text>
          <xsl:value-of select="/MBooksTop/CollectionOwner"/>
          <xsl:text>'s </xsl:text>
          <a href="{/MBooksTop/OperationResults/CollHref}">
            <xsl:value-of select="/MBooksTop/CollectionName"/>    
            <xsl:text> collection</xsl:text>
          </a>
          <xsl:if test="string-length(/MBooksTop/MBooksGlobals/EnvHT_DEV)&gt;1">
            <xsl:text> in </xsl:text>
            <xsl:value-of select="/MBooksTop/SearchResults/QueryTime"/>
            <xsl:text> sec.</xsl:text>
          </xsl:if>
          
          <xsl:if test="$debug='YES'">
            <span class="debug">DEBUG </span>
          </xsl:if>
          
        </div>
      </xsl:when>
      <xsl:when test="SearchResults">
        <div class="alert alert-error">
          <xsl:text>Your search for "</xsl:text>
          <xsl:value-of select="/MBooksTop/QueryString"/>
          <xsl:text>" in the </xsl:text>
          <span class="colName"><xsl:value-of select="$coll_name"/></span> 
          <xsl:text> collection returned zero hits.</xsl:text> 
        </div>
        <p>
          <a href="{//CollHref}">Back to the collection</a>
        </p>
      </xsl:when>
    </xsl:choose>

  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections: </xsl:text><xsl:value-of select="$coll_name" />
    <xsl:if test="//SearchResults"><xsl:text> Search Results</xsl:text></xsl:if>
    <xsl:text> | HathiTrust Digital Library</xsl:text>
  </xsl:template>

  <xsl:template name="status-update">
    <!-- Special case show index status message only for listsrch page -->
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='a']='listsrch'">
      <xsl:call-template name="IndexingStatusMsg"/>
    </xsl:if>

    <!--ADDITION: Added: overlay is displayed here-->
    <xsl:if test="$action='copyit' or $action='movit'or $action='copyitnc' or $action='movitnc' or $action='delit'">
      <div class="alert alert-success">
        <xsl:call-template name="OperationResults" />
      </div>
    </xsl:if>

  </xsl:template>
    
  <!-- Edit Collection Widget  (refine results needs separate pi/widget) -->
  <xsl:template name="EditCollectionWidget">
    <div class="ColSidebar" role="complementary">
      <div class="ColOptions">
        <h2 class="offscreen">About this collection</h2>
        <xsl:choose>
          <xsl:when test="EditCollectionWidget/OwnedByUser='yes' ">
            <xsl:call-template name="EditCollectionWidgetOwned"/>
          </xsl:when>
          <xsl:otherwise>
            <xsl:call-template name="EditCollectionWidgetViewOnly"/>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </div>
  </xsl:template>
  
  <xsl:template name="EditCollectionWidgetOwned">
    <div class="editOwned">
      <!-- <h4><xsl:text>Edit options</xsl:text></h4> -->
      <h3>Edit options</h3>
      
      <form id="editcoll" name="editcoll" method="get" action="mb?">
        <xsl:copy-of select="$hidden_c_param"/>
        <input type="hidden" name="a" value="editc"/>
        <xsl:call-template name="HiddenDebug"/>  
        
        <div class="formElement">
          <div class="colNameLabel">
            <label for="CollNameEdit">
              <xsl:text>Collection Name</xsl:text>
            </label>
          </div>
          <div>
            <input id="CollNameEdit" type="text" size="16" maxlength="50" name="cn">
              <xsl:attribute name="value">
                <xsl:value-of select="$coll_name"/>
              </xsl:attribute>
            </input>
          </div>
        </div>
        <div class="formElement">
          <div class="colDescLabel">
            <label for="ColDescEdit">
              <xsl:text>Description </xsl:text>
            </label>
          </div>
          <div class="colDesc">
            <textarea id="ColDescEdit" cols="17" rows="4" name="desc">
              <xsl:value-of select="EditCollectionWidget/CollDesc"/>
            </textarea>
          </div>
        </div>
        
        <div class="formElement">
          <label for="private_radio">
            <xsl:text>Private</xsl:text>
            <input type="radio" name="shrd" id="private_radio" value="0">
              <xsl:if test="EditCollectionWidget/Status = 'private'">
                <xsl:attribute name="checked">checked</xsl:attribute>
              </xsl:if>
            </input>
          </label>
          
          <xsl:if test="EditCollectionWidget/Temporary!='1'">
            <label for="public_radio">
              <xsl:text>Public</xsl:text>
              <input type="radio" name="shrd" id="public_radio" value="1">
                <xsl:if test="EditCollectionWidget/Status='public'">
                  <xsl:attribute name="checked">checked</xsl:attribute>
                </xsl:if>
              </input>
            </label>
          </xsl:if>
        </div>
        
        <button id="editc" value="editc">
          <xsl:text>Save Changes</xsl:text>
        </button>
      </form>
    </div>
  </xsl:template>
  
  <xsl:template name="EditCollectionWidgetViewOnly">
    <div class="editViewOnly">
      
      <xsl:if test="//CollectionFeatured/text()">
        <div class="colFeatured">
          <img src="{//CollectionFeatured}" alt=" " />
        </div>
      </xsl:if>
      
      <h3>Collection Name</h3>
      <div class="colNameLabel">
        <span class="colName"><xsl:value-of select="$spaced_coll_name"/></span>
      </div>
      
      <xsl:if test="normalize-space(EditCollectionWidget/CollDesc)">
          <h3>Collection Description</h3>
        <div class="colDescLabel">
          <p class="colDesc">
            <xsl:value-of select="EditCollectionWidget/CollDesc"/>
          </p>
        </div>
      </xsl:if>
      
      <xsl:if test="normalize-space(//CollectionContactInfo)">
        <div class="ownerLink">
          <h3 class="offscreen">Contact Information</h3>
          <xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" />
        </div>
      </xsl:if>
      
    </div>
  </xsl:template>
    
  <xsl:template name ="DisplaySearchWidgetLogic">
    <div class="mainsearch" role="search">
      <xsl:call-template name="SearchWidget"/>
    </div>
  </xsl:template>

  <xsl:template name="EmptyCollection">
    <div class="alert alert-block">
      <p>
        <xsl:text>There are 0 items in </xsl:text>
        <span class="colName"><xsl:value-of select="$coll_name"/></span>
        <xsl:text> Collection</xsl:text>
      </p>
    </div>
    <div>
      <p>
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
        <a href="http://www.hathitrust.org/" class="inlineLink">Search HathiTrust</a>
        <xsl:text> for new items.</xsl:text>
      </p>
    </div>
  </xsl:template>

  <xsl:template match="*" mode="copy-guts">
    <xsl:apply-templates select="*|text()" mode="copy" />
  </xsl:template>
  
  <xsl:template match="a" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*" mode="copy" />
      <xsl:attribute name="class">tracked</xsl:attribute>
      <xsl:apply-templates select="*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>
  
  <xsl:template match="@*|*|text()" mode="copy">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" mode="copy" />
    </xsl:copy>
  </xsl:template>

</xsl:stylesheet>
