<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns:xlink="https://www.w3.org/1999/xlink"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl str"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:template name="setup-extra-header-extra">
  </xsl:template>

  <xsl:template name="setup-extra-header--reader">

    <script>
      <xsl:call-template name="configure-find-in-library" />
      <xsl:call-template name="configure-access-restriction-message" />
      <xsl:call-template name="configure-access-type" />
    </script>
  </xsl:template>

  <xsl:template name="setup-body-class">
    <xsl:text> view-restricted</xsl:text>
  </xsl:template>

  <xsl:template name="build-root-container">
    <div class="visually-hidden" aria-hidden="true">
      <xsl:call-template name="build-collections-block" />
    </div>
  </xsl:template>

  <xsl:template name="build-root-attributes">
    <xsl:attribute name="data-prop-view">restricted</xsl:attribute>
  </xsl:template>

  <xsl:template name="configure-access-restriction-message">
    <xsl:variable name="message">
      <xsl:choose>
        <!-- TOMBSTONE -->
        <xsl:when test="$gRightsAttribute='8'">
          <xsl:text>tombstone-item</xsl:text>
        </xsl:when>

        <!-- PD-PVT (PRIVATE) -->
        <xsl:when test="$gRightsAttribute='26'">
          <xsl:text>private-item</xsl:text>
        </xsl:when>

        <xsl:when test="$gBrittleHeld = 'YES' and //AccessType/Name = 'in_library_user'">
          <xsl:text>brittle-held-item</xsl:text>
        </xsl:when>

        <xsl:when test="$gHeld = 'YES' and //AccessType/Name = 'emergency_access_affiliate'">
          <xsl:text>emergency-access-affiliate</xsl:text>
        </xsl:when>

        <!-- orphan message -->
        <xsl:when test="$gOrphanCandidate='true'">
          <xsl:text>orphan-candidate-item</xsl:text>
        </xsl:when>

        <!-- In copyright, no access message -->
        <xsl:otherwise>
          <xsl:text>no-access-item</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
    <xsl:text>HT.params.accessRestriction = {};</xsl:text>
    <xsl:value-of select="concat('HT.params.accessRestriction.rightsAttribute = ', $gRightsAttribute, ';')" />
    <xsl:value-of select="concat('HT.params.accessRestriction.message = &quot;', $message, '&quot;;')" />
  </xsl:template>

  <xsl:template name="configure-access-type">
    <xsl:if test="//AccessType">
      <xsl:variable name="available" select="//AccessType/Available = 'TRUE'" />
      <xsl:text>HT.params.accessType = {};</xsl:text>
      <xsl:value-of select="concat('HT.params.accessType.available =', $available, ';')" />
      <xsl:value-of select="concat('HT.params.accessType.debug = &quot;', //AccessType/Available, '&quot;;')" />
      <xsl:value-of select="concat('HT.params.accessType.action = &quot;', //AccessType/Action, '&quot;;')" />
    </xsl:if>
  </xsl:template>

</xsl:stylesheet>
