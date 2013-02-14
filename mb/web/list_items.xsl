<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  version="1.0">

  <xsl:template name="setup-extra-header">
    <!-- <link rel="stylesheet" type="text/css" href="/mb/css/mb.css" /> -->
    <link rel="stylesheet" type="text/css" href="/mb/css/results.css" />

    <script src="/mb/web/js/mb.js"></script>
    <script src="/mb/web/js/tracking.js"></script>

  </xsl:template>

  <xsl:template name="contents">
    <xsl:call-template name="sidebar" />
    <xsl:call-template name="list-items-results" />
    <script src="/mb/web/js/google_covers.js"></script>
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

    <h3>
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
        <dd>
          <p class="colDesc">
            <xsl:value-of select="//EditCollectionWidget/CollDesc"/>
          </p>
        </dd>
      </xsl:if>

      <xsl:if test="normalize-space(//CollectionContactInfo)">
        <dt>More Information</dt>
        <p><xsl:apply-templates select="//CollectionContactInfo" mode="copy-guts" /></p>
      </xsl:if>

      <dt>Status</dt>
      <dd><xsl:value-of select="//EditCollectionWidget/Status" /></dd>

      <xsl:if test="//EditCollectionWidget/OwnedByUser='yes' ">
        <h3 class="offscreen">Edit collection details</h3>
        <p>
          <a href="#" class="btn btn-small">Edit</a>
        </p>
      </xsl:if>

    </dl>
    
  </xsl:template>

  <xsl:template name="list-items-results">
    <div id="mbContentContainer" class="main clearfix">

      <xsl:call-template name="DisplaySearchWidgetLogic"/>
      <xsl:call-template name="decideDisplayRefine"/>
      <xsl:choose>
        <xsl:when test="ItemList/Item">
          <xsl:call-template name="DisplayContent">
            <xsl:with-param name="title">Collection</xsl:with-param>
            <xsl:with-param name="item-list-contents">items</xsl:with-param>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="EmptyCollection"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>

  </xsl:template>
  
  <xsl:template name="MBooksCol">
    <div class="MBooksCol">
      <xsl:value-of select="/MBooksTop/CollectionOwner"/>
      <xsl:text>'s </xsl:text>
      <span class="colName"><xsl:value-of select="$coll_name"/></span>
      <xsl:text> collection</xsl:text>
      <xsl:if test="$debug='YES'">
        <span class="debug">DEBUG </span>
      </xsl:if>
    </div>
  </xsl:template>
  
  <xsl:template name="get-page-title">
    <xsl:text>Collections: </xsl:text><xsl:value-of select="$coll_name" /><xsl:text> | HathiTrust Digital Library</xsl:text>
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
  
  <xsl:template name="subnav_header">
    
    <xsl:call-template name="MBooksCol"/>
  </xsl:template>
  
  <xsl:template name ="DisplaySearchWidgetLogic">
    <xsl:if test="$AllItemsCount>0">
      <div class="mainsearch" role="search">
        <xsl:call-template name="SearchWidget"/>
      </div>
    </xsl:if>
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
