<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:h="http://www.hathitrust.org"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS h"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:import href="../searchresults.xsl" />

  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns="http://www.w3.org/1999/xhtml">

      <head>

        <title>
          <xsl:call-template name="setup-page-title" />
        </title>

      </head>

      <body>
        <xsl:attribute name="class">
          <xsl:call-template name="setup-body-class" />
        </xsl:attribute>

        <h1><xsl:call-template name="setup-page-title" /></h1>

        <xsl:call-template name="page-contents" />

      </body>

    </html>

  </xsl:template>

  <xsl:template name="BuildFisheyeTable" />

  <xsl:template name="BuildSearchSummary">
    <xsl:variable name="page_string">
      <xsl:choose>
        <xsl:when test="$gPagesFound > 1 or $gPagesFound = 0"><xsl:text> pages </xsl:text></xsl:when>
        <xsl:when test="$gPagesFound = 1"><xsl:text> page</xsl:text></xsl:when>
        <xsl:otherwise></xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:choose>
      <xsl:when test="$gSearchFatalError='true'">
        <div class="mdpSearchSummary">
          <div class="alert alert-error alert-block alert-banner">
            <xsl:text>Sorry! There was a system error while conducting your search.  Please check back later.</xsl:text>
          </div>
        </div>
      </xsl:when>

      <xsl:when test="$gPagesFound = 0">
        <div class="mdpSearchSummary">
          <div class="alert alert-error alert-block alert-banner">
            <xsl:text>Your search for </xsl:text>
            <span class="mdpEmp">
              <xsl:value-of select="$vNatLangQuery"/>
            </span>
            <xsl:text> did not match any pages in this item.</xsl:text>
          </div>
          <xsl:if test="$gSearchOp='OR'">
            <div class="alert alert-warning alert-block alert-banner">
              "Search in this text" can fail to find matching pages if you arrived at this item from a HathiTrust search that used bibliographic metadata terms <span class="mdpEmp"><em>about</em></span> the item that do not occur <span class="mdpEmp"><em>within</em></span> it. 
            </div>
          </xsl:if>
        </div>
      </xsl:when>
      <xsl:otherwise>

        <xsl:variable name="query_explanation">
          <xsl:choose>
            <xsl:when test="/MBooksTop/MdpApp/SearchSummary/QueryType='OR'">
              <span class="mdpEmp">Note:</span> No page contained all of your search terms.  Results are for pages containing <span class="mdpEmp">at least one</span> of your terms.
            </xsl:when>
            <xsl:otherwise></xsl:otherwise>
          </xsl:choose>
        </xsl:variable>

        <div class="mdpSearchSummary alert alert-block alert-info">
          <xsl:text>Your search for the term </xsl:text>
          <xsl:choose>
            <xsl:when test="$gNumTerms > 1">
              <xsl:text>terms: </xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>term: </xsl:text>
            </xsl:otherwise>
          </xsl:choose>
          <span class="mdpEmp">
            <xsl:value-of select="$vNatLangQuery"/>
          </span>
          <xsl:text> matched </xsl:text>
          <span class="mdpEmp">
            <xsl:value-of select="$gPagesFound"/>
          </span>
          <xsl:value-of select="$page_string"/>
          <span>
            <xsl:copy-of select="$query_explanation"/>
          </span>
        </div>
      </xsl:otherwise>
    </xsl:choose>
    <!-- <xsl:call-template name="msgRepeatSearch"/> -->
  </xsl:template>

  <xsl:template name="BuildSearchResultsList">
    <ul id="mdpOuterList">
      <xsl:for-each select="$gSearchResults/Page">
                   
        <xsl:variable name="pageLink">
          <xsl:value-of select="Link"/>
        </xsl:variable>
                    
        <xsl:variable name="pageLabel">
          <xsl:choose>
            <xsl:when test="$gHasPageNumbers='true'">
              <xsl:choose>
                <xsl:when test="PageNumber=''">
                  <xsl:text>unnumbered page</xsl:text>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:text>p.</xsl:text>
                  <xsl:value-of select="PageNumber"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:when>
            <xsl:otherwise>
              <xsl:text>sequence #</xsl:text>
              <xsl:value-of select="Sequence"/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:variable>
                  
        <li data-seq="{Sequence}">
          <xsl:choose>
            <xsl:when test="$gFinalAccessStatus='allow'">
              <xsl:element name="a">
                <xsl:attribute name="href"> 
                  <xsl:value-of select="$pageLink"/>
                </xsl:attribute>
              </xsl:element>

              <div class="resulttext">
                <xsl:element name="span">
                  <xsl:attribute name="class">srpagenumber</xsl:attribute>
                  <xsl:value-of select="$pageLabel"/>
                </xsl:element>
                <ul class="mdpInnerList">
                  <xsl:for-each select="Kwic">
                    <li>
                      <span>
                        <xsl:text>&#x2026;</xsl:text>
                        <xsl:apply-templates select="." />
                        <xsl:text>&#x2026;</xsl:text>
                      </span>
                    </li>
                  </xsl:for-each>
                </ul>
              </div>
            </xsl:when>
            <xsl:otherwise>
              <div class="resulttext">
                <xsl:element name="span">
                  <xsl:attribute name="class">srpagenumber</xsl:attribute>
                  <xsl:value-of select="$pageLabel"/>
                </xsl:element>
                <xsl:variable name="num-hits" select="Hits" />
                <ul class="mdpInnerList">
                  <li>
                    <span>
                      <xsl:text>&#x2026;</xsl:text>
                      <strong><em><xsl:value-of select="Hits" />
                      <xsl:choose>
                        <xsl:when test="$num-hits = 1">
                          <xsl:text> matching term</xsl:text>
                        </xsl:when>
                        <xsl:otherwise>
                          <xsl:text> matching terms</xsl:text>
                        </xsl:otherwise>
                      </xsl:choose>
                      </em></strong>
                      <xsl:text>&#x2026;</xsl:text>
                    </span>
                  </li>
                </ul> 
              </div>               
            </xsl:otherwise>
          </xsl:choose>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

</xsl:stylesheet>

