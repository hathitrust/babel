<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  version="1.0">

  <xsl:import href="../common-web/framework.xsl"/>

  <xsl:variable name="gTitleTruncAmt">
    <xsl:choose>
      <xsl:when test="$gVolumeTitleFragment!=' '">
        <xsl:value-of select="'40'"/>
      </xsl:when>
      <xsl:otherwise>
        <xsl:value-of select="'50'"/>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

  <xsl:template name="BuildRDFaWrappedTitle">
    <xsl:element name="span">
      <xsl:attribute name="about"><xsl:value-of select="$gFOAFPrimaryTopicId"/></xsl:attribute>
      <xsl:attribute name="property">dc:title</xsl:attribute>
      <xsl:attribute name="rel">dc:type</xsl:attribute>
      <xsl:attribute name="href">http://purl.org/dc/dcmitype/Text</xsl:attribute>
      <xsl:attribute name="content"><xsl:value-of select="$gFullTitleString"/></xsl:attribute>
    </xsl:element>
  </xsl:template>
  
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
  
  
  
  <!-- FORM: Page Image Feedback -->
  <xsl:template name="BuildFeedbackForm">
    <div id="mdpFeedbackForm">
      <xsl:element name="form">
        <xsl:attribute name="method">
          <xsl:choose>
            <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']">
              <xsl:text>get</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>post</xsl:text>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:attribute>
        
        <xsl:attribute name="id">mdpFBform</xsl:attribute>
        <xsl:attribute name="name">mdpFBform</xsl:attribute>
        
        <xsl:attribute name="action">
          <!-- Coupled to $gFeedbackCGIUrl in mdpglobals.cfg -->
          <xsl:value-of select="/MBooksTop/MdpApp/FeedbackForm/FeedbackCGIUrl"/>
        </xsl:attribute>
        
        <div>
          <!-- hidden vars -->
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">label</xsl:attribute>
            <xsl:attribute name="value">mobile</xsl:attribute>
          </xsl:element>
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">SysID</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='id']"/>
            </xsl:attribute>
          </xsl:element>
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">return</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentUrl"/>
            </xsl:attribute>
          </xsl:element>
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">useragent</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/MBooksGlobals/UserAgent"/>
            </xsl:attribute>
          </xsl:element>
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">m</xsl:attribute>
            <xsl:attribute name="value">pt</xsl:attribute>
          </xsl:element>
          
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">SeqNo</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']"/>
            </xsl:attribute>
          </xsl:element>
          
          <xsl:element name="input">
            <xsl:attribute name="type">hidden</xsl:attribute>
            <xsl:attribute name="name">view</xsl:attribute>
            <xsl:attribute name="value">
              <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='view']"/>
            </xsl:attribute>
          </xsl:element>
          
          <xsl:call-template name="HiddenDebug"/>
        </div>
        
        
        
        
        
       
        
        

        <div class="mdpFbSubtitle">
          <label for="email">Email</label>
        </div>        
        <div>
          <div id="mdpEmail">
            <span><input id="email" name="email" class="overlay" alt="Your email address" value="[Your email address]" maxlength="50" size="50" onclick="ClickClear(this, '[Your email address]')" onkeypress="ClickClear(this, '[Your email address]')"/></span>
          </div>
        </div>
        
        <div class="mdpFbSubtitle">
          <label for="comments">Comments/Questions *</label>
        </div>
        <div id="mdpFlexible_2_Other">
          <div>
            <!-- see: $FBGlobals::gCommentsLimit -->
            <textarea name="comments" id="comments" class="overlay" rows="2" cols="40"/>
          </div>
        </div>        
        
        <input id="mdpFBinputbutton" type="submit" name="submit" value="Submit" alt="submit"/>
        
        <!--
        <table>
          <tr valign="bottom">
            <td><div id="emptyFBError"><strong>Error: You cannot submit an empty form.</strong></div></td>   
            <td><xsl:text>    </xsl:text></td>
            <td><input id="mdpFBinputbutton" type="submit" name="submit" value="Submit" alt="submit"/></td>
            <td width='100px' align='right'><a id='mdpFBcancel' href=''><strong>Cancel</strong></a></td>
          </tr>
        </table>
        -->
      </xsl:element>
      
    </div>
  </xsl:template>  
  
</xsl:stylesheet>