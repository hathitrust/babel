<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../../list_items.xsl"/>

  <!-- Edit Collection Widget - OVERRIDE for ETSC -->
  <!-- Change the class names to whatever works for you -->
  <xsl:template name="EditCollectionWidget">
    <div class="ColSidebar">
      <div id="colBranding">
        <xsl:element name="img">
          <xsl:attribute name="src">/mb/e/estc/graphics/hathiTrust_estc.jpg</xsl:attribute>
          <xsl:attribute name="alt">ESTC logo</xsl:attribute>
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
            <xsl:text>http://estc.bl.uk</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="onClick">pageTracker._trackEvent('cbActions', 'click', 'ESTC-branded UM Press link');</xsl:attribute>
          <xsl:text>Visit English Short Title Catalogue website</xsl:text>
        </xsl:element>
      </div>
      
      
    </div>
  </xsl:template>

</xsl:stylesheet>
