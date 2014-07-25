<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../pageviewer_volume.xsl" />

  <xsl:template name="action-fullscreen" />

  <xsl:template name="action-resize-menu">
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
