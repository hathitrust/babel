<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../common-web/framework.xsl"/>
  
  <xsl:template name="BuildRDFaWrappedAuthor">
    <xsl:variable name="author">
      <xsl:call-template name="MetadataAuthorHelper"/>        
    </xsl:variable>
    
    <xsl:choose>
      <xsl:when test="$gItemFormat='BK'">
        <!-- visible -->
        <!-- <xsl:value-of select="$author"/> -->
        <!-- CC attribution, creator -->
        <xsl:element name="span">
          <xsl:attribute name="property">cc:attributionName</xsl:attribute>
          <xsl:attribute name="rel">cc:attributionURL</xsl:attribute>
          <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
          <xsl:attribute name="content">
            <xsl:value-of select="$author"/>
          </xsl:attribute>
        </xsl:element>
        <xsl:element name="span">
          <xsl:attribute name="property">dc:creator</xsl:attribute>
          <xsl:attribute name="content">
            <xsl:value-of select="$author"/>
          </xsl:attribute>
          <xsl:value-of select="$author"/>    
        </xsl:element>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="$author"/>    
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>
  
  <!-- RDFa: published -->
  <xsl:template name="BuildRDFaWrappedPublished">
    <xsl:variable name="published">
      <xsl:call-template name="MetadataPublishedHelper"/>        
    </xsl:variable>

    <!-- visible -->
    <!-- <xsl:value-of select="$published"/> -->
    <!-- published -->
    <xsl:element name="span">
      <xsl:attribute name="property">dc:publisher</xsl:attribute>
      <xsl:attribute name="content">
        <xsl:value-of select="$published"/>
      </xsl:attribute>
      <xsl:value-of select="$published" />
    </xsl:element>
  </xsl:template>
  
  
</xsl:stylesheet>