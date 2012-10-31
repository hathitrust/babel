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

  <!-- Important for performance on large METS docs -->
  <xsl:key
    name="Mimetype"
    match="/*/METS:mets/METS:fileSec/METS:fileGrp[@USE='image']/METS:file"
    use="@ID"/>

  <!-- xsl:variable name="SelectedSeq" is passed in as:
       $stylesheet->transform($doc, SelectedSeq => $seq) -->

  <!-- Identity transform -->
  <xsl:template match="node()|@*">
    <xsl:copy>
      <xsl:apply-templates select="node()|@*"/>
    </xsl:copy>
  </xsl:template>

  <!-- Identity over-rides -->
  <xsl:template match="METS:mets">
    <xsl:apply-templates select="METS:structMap[@TYPE='physical']/*"/>
  </xsl:template>

  <!-- Build the HTD maps from the METS -->
  <xsl:template match="METS:div[@TYPE='volume']">
    <xsl:element name="htd:numpages">
      <xsl:value-of select="count(*)"/>
    </xsl:element>

    <xsl:element name="htd:seqmap">
      <xsl:apply-templates mode="seqmap"/>
    </xsl:element>
    
    <xsl:element name="htd:pgmap">
      <xsl:apply-templates mode="pgmap"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='page']" mode="pgmap">
    <xsl:variable name="Order">
      <xsl:value-of select="@ORDER"/>
    </xsl:variable>
    <xsl:if test="$Order=$SelectedSeq">
      <xsl:variable name="PageNum" select="@ORDERLABEL"/>
      <xsl:if test="$PageNum">
        <xsl:element name="htd:pg">
          <xsl:attribute name="pgnum">
            <xsl:value-of select="$PageNum"/>
          </xsl:attribute>
          <xsl:value-of select="$Order"/>
        </xsl:element>
      </xsl:if>
    </xsl:if>
  </xsl:template>

  <xsl:template match="METS:div[@TYPE='page']" mode="seqmap">
    <xsl:variable name="Order">
      <xsl:value-of select="@ORDER"/>
    </xsl:variable>
    <xsl:if test="$Order=$SelectedSeq">
      <xsl:element name="htd:seq">
        <xsl:attribute name="pseq">
          <xsl:value-of select="$Order"/>
        </xsl:attribute>
        <xsl:element name="htd:pnum">
          <xsl:value-of select="@ORDERLABEL"/>
        </xsl:element>
        <xsl:variable name="FeaturesVal" select="@LABEL"/>
        <xsl:choose>
          <xsl:when test="contains($FeaturesVal, ',')">
            <xsl:call-template name="output-features">
              <xsl:with-param name="list">
                <xsl:value-of select="$FeaturesVal"/>
              </xsl:with-param>
              <xsl:with-param name="delimiter">
                <xsl:value-of select="','"/>
              </xsl:with-param>
            </xsl:call-template>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="htd:pfeat">
              <xsl:value-of select="$FeaturesVal"/>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
        <xsl:element name="htd:imgfmt">
          <xsl:variable name="fileId" select="METS:fptr[starts-with(@FILEID,'IMG')]/@FILEID"/>
          <xsl:value-of select="key('Mimetype', $fileId)/@MIMETYPE"/>
        </xsl:element>
      </xsl:element>
    </xsl:if>
  </xsl:template>

  <!-- Split multiple features into elements -->
  <xsl:template name="output-features">
    <xsl:param name="list"/>
    <xsl:param name="delimiter"/>
    <xsl:variable name="newlist">
      <xsl:choose>
        <xsl:when test="contains($list, $delimiter)">
          <xsl:value-of select="normalize-space($list)"/>
        </xsl:when>
        <xsl:otherwise>
          <xsl:value-of select="concat(normalize-space($list), $delimiter)"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:variable name="first" select="substring-before($newlist, $delimiter)"/>
    <xsl:variable name="remaining" select="substring-after($newlist, $delimiter)"/>
    <xsl:element name="htd:pfeat">
      <xsl:value-of select="$first"/>
    </xsl:element>
    <xsl:if test="$remaining">
      <xsl:call-template name="output-features">
        <xsl:with-param name="list" select="$remaining"/>
        <xsl:with-param name="delimiter">
          <xsl:value-of select="$delimiter"/>
        </xsl:with-param>
      </xsl:call-template>
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
