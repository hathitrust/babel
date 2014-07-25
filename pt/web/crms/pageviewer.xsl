<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet 
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../pageviewer.xsl" />

  <xsl:template name="header" />
  <xsl:template name="action-search-volume" />
  <xsl:template name="collect-this-book" />
  <!-- <xsl:template name="share-this-book" /> -->
  <xsl:template name="find-in-library" />
  <xsl:template name="buy-this-item" />

  <xsl:template name="navbar">
    <div class="navbar navbar-static-top navbar-inverse">
      <div class="navbar-inner" id="navbar-inner">
        <h2 class="offscreen">
          <xsl:text>Navigation links for help, collections</xsl:text>
          <xsl:if test="$gLoggedIn = 'YES'">, logout</xsl:if>
        </h2>
        <ul id="nav" class="nav pull-right">
          <xsl:if test="$gLoggedIn = 'YES'">
          <li><span>Hi <xsl:value-of select="//Header/UserName" />!</span></li>
          </xsl:if>
          <li class="help"><a href="http://www.hathitrust.org/help">Help</a></li>
          <xsl:call-template name="li-feedback" />
        </ul>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="share-this-book">
    <div class="shareLinks">
      <h3>Share</h3>
      <form action="" name="urlForm" id="urlForm">
        <label class="smaller" for="permURL">Permanent link to this book</label>
        <!-- <input type="text" name="permURL_link" id="permURL" class="email-permURL" onclick="document.urlForm.permURL_link.select();" readonly="readonly = true;" value="http://hdl.handle.net/2027/mdp.39015015394847" /> -->
        <xsl:element name="input">
          <xsl:attribute name="type">text</xsl:attribute>
          <xsl:attribute name="name">permURL_link</xsl:attribute>
          <xsl:attribute name="id">permURL</xsl:attribute>
          <xsl:attribute name="class">email-permURL</xsl:attribute>
          <xsl:attribute name="onclick">document.urlForm.permURL_link.select();</xsl:attribute>
          <xsl:attribute name="data-toggle">tracking</xsl:attribute>
          <xsl:attribute name="data-tracking-category">PT</xsl:attribute>
          <xsl:attribute name="data-tracking-action">PT Link to this Book</xsl:attribute>
          <xsl:attribute name="data-tracking-label"><xsl:value-of select="$gItemHandle" /></xsl:attribute>
          <xsl:attribute name="readonly">readonly</xsl:attribute>
          <xsl:attribute name="value">
            <xsl:value-of select="$gItemHandle"/>
          </xsl:attribute>
        </xsl:element>
      </form>    
    </div>
  </xsl:template>


</xsl:stylesheet>
