<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:template name="setup-html-data-attributes">
    <xsl:attribute name="data-anlaytics-dimension">
      <xsl:text>dimension2=</xsl:text>
      <xsl:text>:</xsl:text>
      <xsl:value-of select="//MBooksGlobals/CurrentCgi/Param[@name='c']" />
      <xsl:text>:</xsl:text>
    </xsl:attribute>
  </xsl:template>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/mb/css/screen.css" />

    <xsl:call-template name="include_local_javascript" />
    <xsl:call-template name="load_js_and_css"/>
  </xsl:template>

  <xsl:template name="setup-body-class">
    listis
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

    <xsl:call-template name="list-surveys" />

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

    <div class="shareLinks">

      <h3>Share</h3>

      <div class="btn-group share-toolbar social-links">
        <button data-service="facebook" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-facebook2"></i><span class="offscreen"> Share via Facebook</span></button>
        <button data-service="twitter" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-twitter2"></i><span class="offscreen"> Share via Twitter</span></button>
        <button data-service="plusone" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-google-plus"></i><span class="offscreen"> Share via Google+</span></button>
        <button data-service="reddit" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-reddit"></i><span class="offscreen"> Share via reddit</span></button>
        <button data-service="tumblr" data-title="{$coll_name}" data-media="" class="btn"><i class="icomoon icomoon-tumblr"></i><span class="offscreen"> Share via Tumblr</span></button>
        <button data-service="vkontakte" data-title="{$coll_name}" class="btn"><i class="icomoon icomoon-vk"></i><span class="offscreen"> Share via VK</span></button>
      </div>

      <br />

      <form action="" name="urlForm" id="urlForm">
        <label class="smaller" for="permURL">Link to this collection</label>
        <xsl:element name="input">
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">permURL_link</xsl:attribute>
          <xsl:attribute name="id">permURL</xsl:attribute>
          <xsl:attribute name="class">email-permURL</xsl:attribute>
          <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
          <xsl:attribute name="readonly">readonly</xsl:attribute>
          <xsl:attribute name="value">
            <xsl:text>http://babel.hathitrust.org/cgi/mb?a=listis&amp;c=</xsl:text>
            <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']" />
          </xsl:attribute>
        </xsl:element>
      </form>

      <xsl:call-template name="DownloadMetadataForm" />

    </div>

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
          <span><strong>
            <xsl:value-of select="/MBooksTop/QueryString"/>
          </strong></span>
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
        <div class="alert alert-summary">
          <strong>Search Results: </strong>
          <xsl:text>0 items for for </xsl:text>
          <span><strong>
            <xsl:value-of select="/MBooksTop/QueryString"/>
          </strong></span>
          <xsl:text> in </xsl:text>
          <xsl:value-of select="/MBooksTop/CollectionOwner"/>
          <xsl:text>'s </xsl:text>
          <a href="{/MBooksTop/OperationResults/CollHref}">
            <xsl:value-of select="/MBooksTop/CollectionName"/>    
            <xsl:text> collection</xsl:text>
          </a>
        </div>
      </xsl:when>
      <xsl:when test="XXSearchResults">
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
      <xsl:otherwise />
    </xsl:choose>

  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections: </xsl:text><xsl:value-of select="$coll_name" />
    <xsl:if test="//SearchResults"><xsl:text> Search Results</xsl:text></xsl:if>
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
      <xsl:choose>
        <xsl:when test="//SearchResults and count(//SearchResults/Item) = 0">
          <xsl:call-template name="search-widget-no-results" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="SearchWidget"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>

  <xsl:template name="search-widget-no-results">
    <div class="alert alert-error alert-block">
      <p>
        <xsl:text>Your search for "</xsl:text>
        <xsl:value-of select="/MBooksTop/QueryString"/>
        <xsl:text>" in the </xsl:text>
        <span class="colName"><xsl:value-of select="$coll_name"/></span> 
        <xsl:text> collection returned zero hits.</xsl:text> 
      </p>
      <br />
      <xsl:call-template name="SearchWidget">
        <xsl:with-param name="label">Search again?</xsl:with-param>
      </xsl:call-template>
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

  <xsl:template name="DownloadMetadataForm">
    <xsl:choose>
      <xsl:when test="//TotalRecords = 0">
        <p style="margin-top: 4rem">
          <em>No records to download</em>
        </p>
      </xsl:when>
      <xsl:otherwise>

        <form class="form-download-metadata" method="POST" action="/cgi/mb">
          <input type="hidden" name="c" value="{//Param[@name='c']}" />
          <input type="hidden" name="a" value="download" />
          <xsl:choose>
            <xsl:when test="//Param[@name='q1']">
              <input type="hidden" name="q1" value="{//Param[@name='q1']}" />
            </xsl:when>
            <xsl:otherwise>
            </xsl:otherwise>
          </xsl:choose>
          <xsl:if test="//Param[@name='lmt']">
            <input type="hidden" name="lmt" value="{//Param[@name='lmt']}" />
          </xsl:if>
          <!-- <input type="hidden" name="debug" value="attachment" />
          <input type="hidden" name="format" value="json" /> -->
          <input type="hidden" name="format" value="text" /> 
          <button class="btn btn-mini" data-toggle="tracking" data-tracking-action="MB Download Metadata">
            <i class="icomoon icomoon-download"></i>
            <xsl:text> Download Metadata</xsl:text>
          </button>
          <xsl:text> </xsl:text>
          <a href="#">Help about Downloading Metadata</a>
        </form>

      </xsl:otherwise>
    </xsl:choose>

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
