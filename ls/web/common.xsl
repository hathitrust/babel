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
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/QueryString"/>
            </xsl:attribute>
          </input>
          <input id="fullonly" type="checkbox" name="lmt" value="ft">
          </input>
          <label for="fullonly">Full view only</label>
          <input type="hidden" name="a" value="srchls"/>
          <!--XXX temporarily add debug=local switch-->
          <input type="hidden" name="debug" value="local"/>
          <xsl:call-template name="HiddenDebug"/>
          <button type="submit" name="a" id="srch" value="srchls">Find</button> 
        </xsl:element>
      </div>
    </div>
  </xsl:template>
</xsl:stylesheet>
