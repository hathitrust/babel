<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0" xmlns="http://www.w3.org/1999/xhtml" xmlns:xhtml="http://www.w3.org/1999/xhtml" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" xmlns:METS="http://www.loc.gov/METS/" xmlns:PREMIS="http://www.loc.gov/standards/premis" xmlns:exsl="http://exslt.org/common" xmlns:xlink="https://www.w3.org/1999/xlink"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="exsl">

  <!-- Global Variables -->
  <xsl:variable name="gHasOcr" select="/MBooksTop/MBooksGlobals/HasOcr"/>
  <xsl:variable name="gMdpMetadata" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record"/>
  <xsl:variable name="gItemHandle" select="/MBooksTop/MBooksGlobals/ItemHandle"/>
  <xsl:variable name="gCatalogRecordNo" select="/MBooksTop/METS:mets/METS:dmdSec[@ID='DMD1']/collection/record/controlfield[@tag='001']"/>
  <xsl:variable name="gRightsAttribute" select="/MBooksTop/MBooksGlobals/RightsAttribute"/>
  <xsl:variable name="gTitleString" select="/MBooksTop/MBooksGlobals/VolumeTitle"/>
  <xsl:variable name="gVolumeTitleFragment">
    <xsl:choose>
      <xsl:when test="normalize-space(/MBooksTop/MBooksGlobals/VolCurrTitleFrag)">
        <xsl:value-of select="concat(' ', /MBooksTop/MBooksGlobals/VolCurrTitleFrag, '.')"/>
      </xsl:when>
      <xsl:otherwise><xsl:value-of select="' '"/></xsl:otherwise>
    </xsl:choose>
  </xsl:variable>

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

  <xsl:variable name="gTruncTitleString">
    <xsl:call-template name="GetMaybeTruncatedTitle">
      <xsl:with-param name="titleString" select="$gTitleString"/>
      <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
      <xsl:with-param name="maxLength" select="$gTitleTruncAmt"/>
    </xsl:call-template>
  </xsl:variable>

  <xsl:variable name="gFullTitleString">
    <xsl:value-of select="concat($gTitleString, ', ', $gVolumeTitleFragment)"/>
  </xsl:variable>

  <xsl:variable name="gUsingSearch" select="string(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='page'] = 'search')"/>

  <xsl:template name="get-feedback-id"></xsl:template>
  <xsl:template name="get-feedback-m"><xsl:text>pt</xsl:text></xsl:template>

  <xsl:template name="setup-html-data-attributes">
    <xsl:variable name="items" select="//MBooksGlobals/Collections/Item" />
    <xsl:if test="$items">
      <xsl:attribute name="data-anlaytics-dimension">
        <xsl:text>dimension2=</xsl:text>
        <xsl:text>:</xsl:text>
        <xsl:for-each select="$items">
          <xsl:value-of select="." />
          <xsl:text>:</xsl:text>
        </xsl:for-each>
      </xsl:attribute>
    </xsl:if>
    <xsl:attribute name="data-item-type"><xsl:value-of select="//MBooksGlobals/ItemType" /></xsl:attribute>
    <xsl:attribute name="data-analytics-report-url"><xsl:value-of select="//AnalyticsReportUrl" /></xsl:attribute>
  </xsl:template>

  <!-- FOAF: primary topic -->
  <xsl:variable name="gFOAFPrimaryTopicId">
    <xsl:value-of select="concat('[_:', $gHtId, ']')"/>
  </xsl:variable>


  <!-- schema org: start -->
  <xsl:template name="BuildSchemaOrgTitle">
    <xsl:param name="title"/>

    <xsl:element name="span">
    <xsl:attribute name="itemprop">name</xsl:attribute><xsl:value-of select="$title"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="BuildSchemaOrgAuthor">

    <xsl:variable name="author">
      <xsl:call-template name="MetadataAuthorHelper"/>
    </xsl:variable>

    <xsl:element name="span">
    <xsl:attribute name="itemprop">author</xsl:attribute><xsl:value-of select="$author"/>
    </xsl:element>
  </xsl:template>

  <xsl:template name="BuildSchemaOrgUrl">
    <xsl:element name="span">
    <xsl:attribute name="itemprop">url</xsl:attribute><xsl:value-of select="$gItemHandle"/>
    </xsl:element>
  </xsl:template>
  <!-- schema org: end -->

  <!-- RDFa: hidden_title_string wrapped in content-less span -->
  <xsl:template name="BuildRDFaWrappedTitle">
    <xsl:param name="visible_title_string"/>
    <xsl:param name="hidden_title_string"/>

    <!-- visible -->
    <xsl:element name="span">
      <xsl:attribute name="about"><xsl:value-of select="$gFOAFPrimaryTopicId"/></xsl:attribute>
      <xsl:attribute name="property">dc:title</xsl:attribute>
      <xsl:attribute name="rel">dc:type</xsl:attribute>
      <xsl:attribute name="href">http://purl.org/dc/dcmitype/Text</xsl:attribute>
      <xsl:attribute name="content"><xsl:value-of select="$hidden_title_string"/></xsl:attribute>
      <xsl:value-of select="$visible_title_string"/>
    </xsl:element>
  </xsl:template>

  <!-- RDFa: author -->
  <xsl:template name="BuildRDFaWrappedAuthor">
    <xsl:param name="visible"/>

    <xsl:variable name="author">
      <xsl:call-template name="MetadataAuthorHelper"/>
    </xsl:variable>

    <!-- not ever visible -->
    <xsl:if test="$gItemFormat='BK'">
      <xsl:element name="span">
        <xsl:attribute name="property">cc:attributionName</xsl:attribute>
        <xsl:attribute name="rel">cc:attributionURL</xsl:attribute>
        <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
        <!--xsl:attribute name="content"--> <!-- So it will be seen by CC scraper -->
          <xsl:value-of select="$author"/>
        <!--/xsl:attribute-->
      </xsl:element>
    </xsl:if>

    <!-- maybe visible -->
    <xsl:element name="span">
      <xsl:attribute name="property">dc:creator</xsl:attribute>
      <xsl:attribute name="content">
        <xsl:value-of select="$author"/>
      </xsl:attribute>
      <xsl:if test="$visible = 'visible'">
        <xsl:value-of select="$author"/>
      </xsl:if>
    </xsl:element>

  </xsl:template>

  <!-- RDFa: published -->
  <xsl:template name="BuildRDFaWrappedPublished">
    <xsl:param name="visible"/>

    <xsl:variable name="published">
      <xsl:call-template name="MetadataPublishedHelper"/>
    </xsl:variable>

    <!-- not ever visible -->
    <xsl:if test="$gItemFormat='SE'">
      <xsl:element name="span">
        <xsl:attribute name="property">cc:attributionName</xsl:attribute>
        <xsl:attribute name="rel">cc:attributionURL</xsl:attribute>
        <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
        <xsl:attribute name="content">
          <xsl:value-of select="$published"/>
        </xsl:attribute>
      </xsl:element>
    </xsl:if>

    <!-- maybe visible -->
    <xsl:element name="span">
      <xsl:attribute name="property">dc:publisher</xsl:attribute>
      <xsl:attribute name="content">
        <xsl:value-of select="$published"/>
      </xsl:attribute>
      <xsl:if test="$visible = 'visible'">
        <xsl:value-of select="$published"/>
      </xsl:if>
    </xsl:element>
  </xsl:template>

  <!-- RDFa: description -->
  <xsl:template name="BuildRDFaWrappedDescription">
    <xsl:param name="visible"/>

    <xsl:if test="$gMdpMetadata/datafield[@tag='300']/subfield">

      <xsl:variable name="description">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='a']"/>
        &#x20;
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='b']"/>
        &#x20;
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='c']"/>
      </xsl:variable>

      <xsl:element name="span">
        <xsl:attribute name="property">dc:description</xsl:attribute>
        <xsl:attribute name="content">
          <xsl:value-of select="$description" />
        </xsl:attribute>
        <xsl:if test="$visible = 'visible'">
          <xsl:value-of select="$description" />
        </xsl:if>
      </xsl:element>
    </xsl:if>

  </xsl:template>

  <!-- RDFa: license -->
  <xsl:template name="BuildRDFaCCLicenseMarkup">
    <xsl:variable name="access_use_header">
      <xsl:value-of select="$gAccessUseHeader"/><xsl:text>. </xsl:text>
    </xsl:variable>

    <!-- Link text to the default HT.org page -->
    <xsl:element name="a">
      <xsl:attribute name="target">
        <xsl:text>_blank</xsl:text>
      </xsl:attribute>
      <xsl:attribute name="href">
        <xsl:value-of select="$gAccessUseLink"/>
      </xsl:attribute>
      <xsl:value-of select="$access_use_header"/>
    </xsl:element>

    <xsl:if test="$gItemFormat='BK' and $gAccessUseAuxLink!=''">
      <xsl:element name="a">
        <xsl:attribute name="href"><xsl:value-of select="$gAccessUseAuxLink"/></xsl:attribute>
        <xsl:attribute name="rel">license</xsl:attribute>
      </xsl:element>
    </xsl:if>

    <xsl:if test="$gAccessUseIcon != '' or ( $gAccessUseAuxLink != '' and $gAccessUseAuxIcon != '' )">
      <br /><br />
    </xsl:if>

    <!-- If there's a default icon, link it default HT.org page -->
    <xsl:if test="$gAccessUseIcon!=''">
      <xsl:element name="a">
        <xsl:attribute name="target">
          <xsl:text>_blank</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="$gAccessUseLink"/>
        </xsl:attribute>
        <xsl:element name="img">
          <xsl:attribute name="src">
            <xsl:value-of select="$gAccessUseIcon"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:element>
    </xsl:if>

    <!-- (CC): If there's an auxillary icon, link it using auxillary link -->
    <xsl:if test="$gAccessUseAuxLink!='' and $gAccessUseAuxIcon!=''">
      <xsl:element name="a">
        <xsl:attribute name="target">
          <xsl:text>_blank</xsl:text>
        </xsl:attribute>
        <xsl:attribute name="href">
          <xsl:value-of select="$gAccessUseAuxLink"/>
        </xsl:attribute>
        <xsl:element name="img">
          <xsl:attribute name="src">
            <xsl:value-of select="$gAccessUseAuxIcon"/>
          </xsl:attribute>
        </xsl:element>
      </xsl:element>
    </xsl:if>

  </xsl:template>

  <!-- METADATA: author metadata helper -->
  <xsl:template name="MetadataAuthorHelper">
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='100']">
      <xsl:if test="subfield[@code='a']">
        <xsl:value-of select="subfield[@code='a']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='b']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='b']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='c']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='c']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='e']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='e']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='q']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='q']"/>
      </xsl:if>
      <xsl:if test="subfield[@code='d']">
        <xsl:text>&#x20;</xsl:text>
        <xsl:value-of select="subfield[@code='d']"/>
      </xsl:if>
    </xsl:for-each>

    <xsl:for-each select="$gMdpMetadata/datafield[@tag='110']">
      <xsl:value-of select="subfield[@code='a']"/>
      <xsl:if test="subfield[@code='b']">
        <xsl:text>&#32;</xsl:text>
        <xsl:value-of select="subfield[@code='c']"/>
      </xsl:if>
    </xsl:for-each>

    <xsl:for-each select="$gMdpMetadata/datafield[@tag='111']">
      <xsl:value-of select="subfield[@code='a']"/>
    </xsl:for-each>

  </xsl:template>

  <!-- METADATA: published metadata helper -->
  <xsl:template name="MetadataPublishedHelper">
    <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='260'])">
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='a']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='a']"/>
        &#x20;
      </xsl:if>
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='b']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='b']"/>
        &#x20;
      </xsl:if>
      <xsl:if test="$gMdpMetadata/datafield[@tag='260']/subfield[@code='c']">
        <xsl:value-of select="$gMdpMetadata/datafield[@tag='260']/subfield[@code='c']"/>
      </xsl:if>
    </xsl:if>
    <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='264'])">
      <xsl:if test="normalize-space($gMdpMetadata/datafield[@tag='260'])"><xsl:text> / </xsl:text></xsl:if>
      <xsl:for-each select="$gMdpMetadata/datafield[@tag='264']/subfield">
        <xsl:value-of select="." />
        <xsl:if test="position() != last()"><xsl:text> </xsl:text></xsl:if>
      </xsl:for-each>
    </xsl:if>

  </xsl:template>

  <!-- METADATA: MDP-style metadata helper -->
  <xsl:template name="MdpMetadataHelper">
    <xsl:param name="ssd"/>
    <div id="mdpFlexible_1">

      <xsl:if test="$gHasMARCAuthor">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Author&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:call-template name="BuildRDFaWrappedAuthor">
              <xsl:with-param name="visible" select="'visible'"/>
            </xsl:call-template>
          </div>
        </div>
      </xsl:if>

      <xsl:if test="$gMdpMetadata/datafield[@tag='250']/subfield">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Edition&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='250']/subfield"/>
          </div>
        </div>
      </xsl:if>

      <div class="mdpMetaDataRow">
        <div class="mdpMetaDataRegionHead">
          <xsl:text>Published&#xa0;</xsl:text>
        </div>
        <div class="mdpMetaText">
          <xsl:call-template name="BuildRDFaWrappedPublished">
            <xsl:with-param name="visible" select="'visible'"/>
          </xsl:call-template>
        </div>
      </div>

      <xsl:if test="$gMdpMetadata/datafield[@tag='300']/subfield">
        <div class="mdpMetaDataRow">
          <div class="mdpMetaDataRegionHead">
            <xsl:text>Description&#xa0;</xsl:text>
          </div>
          <div class="mdpMetaText">
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='a']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='b']"/>
            &#x20;
            <xsl:value-of select="$gMdpMetadata/datafield[@tag='300']/subfield[@code='c']"/>
          </div>
        </div>
      </xsl:if>

      <div class="mdpMetaDataRow">
        <div class="mdpMetaDataRegionHead">
          <xsl:text>Copyright&#xa0;</xsl:text>
        </div>
        <div class="mdpMetaText">
          <xsl:call-template name="BuildRDFaCCLicenseMarkup"/>
        </div>
      </div>

      <!-- allow SSD user to link from SSDviewer to pageturner if desired -->
      <xsl:choose>
        <xsl:when test="$ssd">
          <xsl:call-template name="PermanentURL">
            <xsl:with-param name="ssd" select="$ssd"/>
          </xsl:call-template>
        </xsl:when>
        <xsl:otherwise>
          <xsl:call-template name="PermanentURL"/>
        </xsl:otherwise>
      </xsl:choose>
    </div>
  </xsl:template>


  <xsl:template name="PermanentURL">
    <xsl:param name="ssd"/>
    <div class="mdpMetaDataRow">
      <div class="mdpMetaDataRegionHead">
        <xsl:text>Permanent URL&#xa0;</xsl:text>
      </div>
      <div class="mdpMetaText">
        <xsl:choose>
          <xsl:when test="$gItemHandle=''">
            <xsl:text>not available</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:choose>
              <xsl:when test="$ssd = 'true'">
                <a>
                  <xsl:attribute name="href"><xsl:value-of select="$gItemHandle"/></xsl:attribute>
                  <xsl:value-of select="$gItemHandle"/>
                </a>
              </xsl:when>
              <xsl:otherwise>
                <xsl:value-of select="$gItemHandle"/>
              </xsl:otherwise>
            </xsl:choose>
          </xsl:otherwise>
        </xsl:choose>
      </div>
    </div>
  </xsl:template>

  <!-- Link to OCLC Get Book -->
  <xsl:template name="FindInALibraryLink">
    <xsl:param name="class" />
    <xsl:param name="label">Find in a library</xsl:param>
    <xsl:for-each select="$gMdpMetadata/datafield[@tag='035'][contains(.,'OCoLC)ocm') or contains(.,'OCoLC') or contains(.,'oclc') or contains(.,'ocm') or contains(.,'ocn')][1]">
      <xsl:variable name="oclc-number">
        <xsl:choose>
          <xsl:when test="contains(.,'OCoLC)ocm')">
            <xsl:value-of select="substring-after(.,'OCoLC)ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'OCoLC')">
            <xsl:value-of select="substring-after(.,'OCoLC)')"/>
          </xsl:when>
          <xsl:when test="contains(.,'oclc')">
            <xsl:value-of select="substring-after(.,'oclc')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocm')">
            <xsl:value-of select="substring-after(.,'ocm')"/>
          </xsl:when>
          <xsl:when test="contains(.,'ocn')">
            <xsl:value-of select="substring-after(.,'ocn')"/>
          </xsl:when>
          <xsl:otherwise/>
        </xsl:choose>
      </xsl:variable>
      <xsl:element name="a">
        <xsl:attribute name="class">worldcat <xsl:value-of select="$class" /></xsl:attribute>
        <xsl:attribute name="href">
          <xsl:text>http://www.worldcat.org/oclc/</xsl:text>
          <xsl:value-of select="$oclc-number" />
        </xsl:attribute>
        <xsl:attribute name="data-toggle">tracking</xsl:attribute>
        <xsl:attribute name="data-tracking-category">outLinks</xsl:attribute>
        <xsl:attribute name="data-tracking-action">PT Find in a Library</xsl:attribute>
        <xsl:attribute name="data-tracking-label"><xsl:value-of select="$oclc-number" /></xsl:attribute>
        <!-- <xsl:attribute name="title">Link to OCLC Find in a Library</xsl:attribute> -->

        <xsl:value-of select="$label" />

      </xsl:element>
    </xsl:for-each>

  </xsl:template>

  <xsl:template match="xhtml:div/@class[. = 'panel']" mode="copy" priority="300" />

  <xsl:template match="xhtml:div[contains(@class, 'panel')]/xhtml:h3" mode="copy" priority="200" />

  <xsl:template match="xhtml:div[contains(@class, 'panel')]" mode="copy-filter" priority="200">
    <div>
      <xsl:attribute name="class">
        <xsl:value-of select="@class" />
        <xsl:text> filter-list-container</xsl:text>
      </xsl:attribute>
      <xsl:apply-templates select="@*" mode="copy" />
      <xsl:apply-templates mode="copy" />
    </div>
  </xsl:template>

  <xsl:template name="get-sharable-handle-link">
    <xsl:value-of select="$gItemHandle" />
    <xsl:if test="$gUsingSearch = 'false'">
      <xsl:text>?urlappend=%3Bseq=</xsl:text>
      <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='seq']"/>
    </xsl:if>
  </xsl:template>

  <xsl:template name="PageTitle">
    <xsl:param name="detail" select="''" />
    <xsl:param name="suffix" select="''" />
    <!-- <xsl:param name="suffix" select="'HathiTrust Digital Library'" /> -->
    <xsl:param name="dash" select="'-'" />
    <xsl:param name="title" />
    <xsl:param name="tail" />

    <xsl:variable name="displayed-title">
      <xsl:choose>
        <xsl:when test="normalize-space($title)">
          <xsl:value-of select="normalize-space($title)" />
        </xsl:when>
        <xsl:otherwise>
          <xsl:variable name="truncated-title">
            <xsl:call-template name="GetMaybeTruncatedTitle">
              <xsl:with-param name="titleString" select="$gTitleString"/>
              <xsl:with-param name="titleFragment" select="$gVolumeTitleFragment"/>
              <xsl:with-param name="maxLength" select="$gTitleTruncAmt"/>
            </xsl:call-template>
          </xsl:variable>
          <xsl:value-of select="normalize-space($truncated-title)" />
        </xsl:otherwise>
      </xsl:choose>
      <xsl:if test="normalize-space($detail)">
        <xsl:value-of select="concat(' ', $dash, ' ')" />
        <xsl:value-of select="$detail" />
      </xsl:if>
    </xsl:variable>

    <xsl:value-of select="$displayed-title" />
    <xsl:choose>
      <xsl:when test="$gRightsAttribute='8'">
        <xsl:text> - Item Not Available </xsl:text>
      </xsl:when>
      <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow' and //AccessType/Name = 'emergency_access_affiliate'">
        <xsl:text> - Temporary Access </xsl:text>
      </xsl:when>
      <xsl:when test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
        <xsl:text> - Full View </xsl:text>
      </xsl:when>
      <xsl:otherwise>
        <xsl:text> - Limited View </xsl:text>
      </xsl:otherwise>
    </xsl:choose>

    <xsl:if test="normalize-space($suffix)">
      <xsl:text> | </xsl:text>
      <xsl:value-of select="$suffix" />
    </xsl:if>

    <xsl:if test="normalize-space($tail)">
      <xsl:text> (</xsl:text>
      <xsl:value-of select="$tail" />
      <xsl:text>)</xsl:text>
    </xsl:if>

  </xsl:template>

</xsl:stylesheet>
