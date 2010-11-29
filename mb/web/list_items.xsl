<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>Hathi Trust Digital Library - Collection: <xsl:value-of select="$coll_name"/></title>
        <xsl:call-template name="load_js_and_css"/>
        <xsl:call-template name="include_local_javascript"/>
        
        <xsl:call-template name="debug_CSS"/>
      </head>
      
      <!-- <body class="yui-skin-sam" onLoad="testjs()">-->
      <!-- <body class="yui-skin-sam" >-->
      <!-- This adds a listener to the checkAll checkbox in listUtils.js-->
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

          <div id="mbContentContainer" class="mbListItemsContainer">
            <h2 class="SkipLink">Main Content</h2>
            <div class="SearchAndRefine">
              <div class="refine">
                <xsl:call-template name="decideDisplayRefine"/>
              </div>
            </div>
            
            <div id="main">
              <xsl:choose>
                <xsl:when test="ItemList/Item">
                  <xsl:call-template name="DisplayContent"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="EmptyCollection"/>
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
  
  <xsl:template name="MBooksCol">
    <div class="MBooksCol">
      <h2>
        <xsl:value-of select="/MBooksTop/CollectionOwner"/>
        <xsl:text>'s </xsl:text>
        <span class="colName"><xsl:value-of select="$coll_name"/></span>
        <xsl:text> collection</xsl:text>
        <xsl:if test="$debug='YES'">
          <span class="debug">DEBUG </span>
        </xsl:if>
      </h2>
    </div>
  </xsl:template>
  
  
  
  <!-- Edit Collection Widget  (refine results needs separate pi/widget) -->
  <xsl:template name="EditCollectionWidget">
    <div class="ColSidebar">
      <div class="ColOptions">
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
      <h3><xsl:text>Edit options</xsl:text></h3>
      
      <form id="editcoll" name="editcoll" method="get" action="mb?">
        <xsl:copy-of select="$hidden_c_param"/>
        <input type="hidden" name="a" value="editc"/>
        <xsl:call-template name="HiddenDebug"/>  
        
        <div class="formElement">
          <label for="ColNameEdit">
            <div class="colNameLabel">
              <xsl:text>Collection Name</xsl:text>
            </div>
            <input id="CollNameEdit" type="text" size="16" maxlength="32" name="cn">
              <xsl:attribute name="value">
                <xsl:value-of select="$coll_name"/>
              </xsl:attribute>
            </input>
          </label>
        </div>
        <div class="formElement">
          <label for="ColDescEdit">
            <div class="colDescLabel">
              <xsl:text>Description </xsl:text>
            </div>
            <div class="colDesc">
              <textarea id="ColDescEdit" cols="17" rows="4" name="desc">
                <xsl:attribute name="value">
                  <xsl:value-of select="EditCollectionWidget/CollDesc"/>
                </xsl:attribute>
                <xsl:value-of select="EditCollectionWidget/CollDesc"/>
              </textarea>
            </div>
          </label>
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
          
          <label for="public_radio">
            <xsl:text>Public</xsl:text>
            <input type="radio" name="shrd" id="public_radio" value="1">
              <xsl:if test="EditCollectionWidget/Status='public'">
                <xsl:attribute name="checked">checked</xsl:attribute>
              </xsl:if>
            </input>
          </label>
        </div>
        
        <button id="editc" value="editc">
          <xsl:text>Save Changes</xsl:text>
        </button>
      </form>
    </div>
  </xsl:template>
  
  <xsl:template name="EditCollectionWidgetViewOnly">
    <div class="editViewOnly">
      <div class="colNameLabel">
        <xsl:text>Collection Name: </xsl:text>
        <!-- <span class="colName"><xsl:value-of select="$coll_name"/></span>-->
        <span class="colName"><xsl:value-of select="$spaced_coll_name"/></span>
      </div>
      
      <div class="colDescLabel">
        <xsl:text>Collection Description: </xsl:text>
        <span class="colDesc">
          <xsl:value-of select="EditCollectionWidget/CollDesc"/>
        </span>
      </div>
      
    </div>
  </xsl:template>
  
  <xsl:template name="subnav_header">
    
    <xsl:call-template name="MBooksCol"/>
  </xsl:template>
  <xsl:template name ="DisplaySearchWidgetLogic">
 <div class="mainsearch">
      <xsl:if test="$AllItemsCount>0">
        <xsl:call-template name="SearchWidget"/>
      </xsl:if>
    </div>
    
  </xsl:template>


</xsl:stylesheet>
