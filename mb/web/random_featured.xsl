<?xml version="1.0" encoding="UTF-8" ?>
<!--
  random_featured
  Created by Roger Espinosa on 2011-07-22.
  Copyright (c) 2011 University of Michigan. All rights reserved.
-->

<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output encoding="UTF-8" indent="no" method="text" omit-xml-declaration="yes" />

  <xsl:template match="/"><xsl:value-of select="//Featured"/></xsl:template>

  <xsl:template match="/" mode="xml">
    
    <xsl:variable name="collname" select="//Collection/CollName" />
    <xsl:variable name="collid" select="//Collection/CollId" />
    <xsl:variable name="featured" select="//Collection/Featured" />
    <xsl:variable name="description" select="//Collection/Description" />

    <div class="itemList">
      <a href="//{//EnvHTTP_HOST}/cgi/mb?a=listis;c={$collid}">
        <img alt="" class="imgLeft">
          <xsl:attribute name="src">
            <xsl:if test="substring-after($featured, 'http') = ''">
              <xsl:text>//</xsl:text>
              <xsl:value-of select="//EnvHTTP_HOST" />
            </xsl:if>
            <xsl:value-of select="$featured" />
          </xsl:attribute>
        </img>
      </a>
      <h5>
        <a href="//{//EnvHTTP_HOST}/cgi/mb?a=listis;c={$collid}"><xsl:value-of select="$collname" /></a>
      </h5>
      <p class="hyphenate">
        <xsl:value-of select="$description" />
      </p>
    </div>

  </xsl:template>
</xsl:stylesheet>
