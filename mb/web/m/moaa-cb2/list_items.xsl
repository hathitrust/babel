<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../../list_items.xsl"/>

  <!-- Edit Collection Widget - OVERRIDE for branding -->
  <xsl:template name="EditCollectionWidget">
    <div class="ColSidebar">
      <div id="colBranding">
        <xsl:element name="img">
          <xsl:attribute name="src">/mb/m/moaa-cb2/graphics/MOAA.jpg</xsl:attribute>
          <xsl:attribute name="alt">Making of Ann Arbor logo</xsl:attribute>
        </xsl:element>
      </div>

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
      
      <div class="ownerLink">
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:text>http://moaa.aadl.org/</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="onClick">pageTracker._trackEvent('cbActions', 'click', 'CB-branded MOAA2 link');</xsl:attribute>
          <xsl:text>Visit the Making of Ann Arbor website</xsl:text>
        </xsl:element>
      </div>
      
      
    </div>
  </xsl:template>

</xsl:stylesheet>
