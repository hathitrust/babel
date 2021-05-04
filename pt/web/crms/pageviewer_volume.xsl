<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../alicorn/pageviewer_volume.xsl" />

  <xsl:template name="action-fullscreen" />

  <xsl:template name="list-surveys"></xsl:template>

  <!-- <xsl:template name="build-extra-sidebar-panels">
    <div class="panel" rel="note">
      <h3>Table of Contents</h3>
      <ul class="scrollable-list action-contents-navigation">
        <xsl:for-each select="$gFeatureList/Feature">
          <li>
            <a href="{Link}" data-seq="{Seq}">
              <xsl:value-of select="Label" />
              <xsl:if test="normalize-space(Page)">
                <xsl:text> - </xsl:text>
                <xsl:value-of select="Page" />
              </xsl:if>
            </a>
          </li>
        </xsl:for-each>
      </ul>
    </div>
  </xsl:template> -->

  <xsl:template name="load-extra-main-script">
    <script type="text/javascript"><xsl:text>head.load('/pt/crms/crms.js</xsl:text><xsl:value-of select="$timestamp" /><xsl:text>')</xsl:text></script>
  </xsl:template>


  <xsl:template name="action-resize-menu-xx">
    <div class="btn-group btn-group-vertical" style="margin-left: -3px">
      <button id="xxx" type="button" class="btn square alone dropdown-toggle" data-toggle="dropdown">
        <i class="icomoon-iconmonstr-magnifier-6-icon" style=""></i>
        <span class="label"> Zoom</span>
        <span class="caret"></span>
      </button>
      <ul class="dropdown-menu">
        <li><a href="#">25%</a></li>
        <li><a href="#">50%</a></li>
        <li><a href="#">75%</a></li>
        <li><a href="#">100%</a></li>
        <li><a href="#">125%</a></li>
        <li><a href="#">150%</a></li>
        <li><a href="#">200%</a></li>
        <li><a href="#">300%</a></li>
        <li><a href="#">400%</a></li>
      </ul>
    </div>
  </xsl:template>    

</xsl:stylesheet>
