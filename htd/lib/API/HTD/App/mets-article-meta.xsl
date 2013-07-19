<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet
  version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:htd="http://schemas.hathitrust.org/htd/2009"
  >

  <xsl:output
    indent="yes"
    method="xml"
  />

  <!-- METS is full of white-space -->
  <xsl:strip-space elements="*"/>

  <!-- Identity transform -->
  <xsl:template match="node()|@*">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <!-- Identity over-rides -->
  <xsl:template match="METS:mets">
    <xsl:apply-templates select="METS:structMap[@TYPE='physical']/METS:div[@TYPE='contents']/METS:div[@TYPE='article']/*"/>
    <xsl:apply-templates select="METS:structMap[@TYPE='physical']/METS:div[@TYPE='contents']/METS:div[@TYPE='assets']/*"/>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='primary']">
      <xsl:element name="htd:num_articles">
        <xsl:value-of select="count(*)"/>
      </xsl:element>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='alternate']">
      <xsl:element name="htd:num_article_alternates">
        <xsl:value-of select="count(*)"/>
      </xsl:element>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='embedded']">
      <xsl:element name="htd:num_embedded_assets">
        <xsl:value-of select="count(*)"/>
      </xsl:element>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='supplementary']">
      <xsl:element name="htd:num_supplementary_assets">
        <xsl:value-of select="count(*)"/>
      </xsl:element>
  </xsl:template>

</xsl:stylesheet>
