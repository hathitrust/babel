<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:variable name="debug" >
    <xsl:value-of select="/MBooksTop/MBooksGlobals/Debug"/>
  </xsl:variable>

  <xsl:variable name="coll_name">
    <!-- <xsl:value-of select="/MBooksTop/CollectionName"/> -->
    <xsl:text> Full-text Search</xsl:text>
  </xsl:variable>

  <!-- TEMPLATE -->
  <xsl:template name="HathiCol">
    <div class="CollPage">
      <h2><xsl:value-of select="$coll_name"/>
        <xsl:if test="$debug='YES'">
          <span class="debug">DEBUG </span>
        </xsl:if>
      </h2>
    </div>
  </xsl:template>

  <!-- TEMPLATE -->  

  <xsl:template name="SearchWidget">
    <div class="LSsearchbox">
      <img class="SearchArrow" src="/ls/common-web/graphics/SearchArrow_FT.png" alt=""/>
      <div id="LSformCont">
        <xsl:element name="form">
        <xsl:attribute name="id">itemlist_searchform</xsl:attribute>
        <xsl:attribute name="action">
          <xsl:value-of select="'ls'"/>
        </xsl:attribute>
        <xsl:attribute name="name">searchcoll</xsl:attribute>
          <label class="SkipLink" for="srch">Full-text Search </label>
          <input type="text" size="30" maxlength="150" name="q1" >
          <!-- if this is not an advanced search populate the query box-->
            <xsl:if test="/MBooksTop/AdvancedSearch/isAdvanced = 'false'">
              <xsl:attribute name="value">
                <xsl:value-of select="/MBooksTop/QueryString"/>
              </xsl:attribute>
            </xsl:if>
          </input>

          <!-- make checkbox sticky based on lmt=ft -->
          <input id="fullonly" type="checkbox" name="lmt" value="ft">
            <xsl:call-template name="getCheckedStatus"/>
          </input>
          <label for="fullonly" id="fullOnlyLabel">Full view only</label>
          <input type="hidden" name="a" value="srchls"/>
          <!--XXX temporarily add debug=local switch-->
          <!--<input type="hidden" name="debug" value="local"/>-->
          <xsl:call-template name="HiddenDebug"/>
          <button type="submit" name="a" id="srch" value="srchls">Find</button> 
          <xsl:text> </xsl:text>
          <a>
            <xsl:attribute name="href">
              <xsl:value-of select="AdvancedSearch/AdvancedSearchURL"/>
            </xsl:attribute>
            <xsl:attribute name="id">AdvancedLink</xsl:attribute>

            <xsl:text>Advanced Full-text Search</xsl:text>
          </a>
    
             

        </xsl:element>

      </div>

    </div>
  </xsl:template>

  <xsl:template name="getCheckedStatus">
    <xsl:variable name="limitType">
      <xsl:value-of select="/MBooksTop/LimitToFullText/LimitType"/>
    </xsl:variable>
    
    <xsl:if test="$limitType='ft'">
      <xsl:attribute name="checked"/>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
