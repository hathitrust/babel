<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:import href="../common-web/header.xsl"/>
  
  <xsl:output
    method="xml"
    indent="yes"
    encoding="utf-8"
    doctype-system="http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd"
    doctype-public="-//W3C//DTD XHTML 1.0 Strict//EN"
    />


    <xsl:template name="header">
      <div style="background-color:#FFFFFF;border-top:5px solid #494949; height:20px; width:100%; margin-bottom: 25px">
        <xsl:call-template name="subnavheaderWrapper"/>
      </div>
    </xsl:template>

    <xsl:template name="subnavheaderWrapper">
      <div id="SubNavHeader">
        <div id="SubNavHeaderCont">
          <xsl:call-template name="subnav_header_short"/>
        </div>
      </div>
    </xsl:template>

    <!-- Navigation bar -->
    <xsl:template name="subnav_header_short">
      <div id="mdpItemBar" style="top:2px;">
        <div id="ItemBarContainer">
          <xsl:call-template name="ItemMetadata"/>
        </div>
      </div>
      <div style="margin-top:-5px;">
      <!-- Override mbooksnav to suppress Logout link and adjust
           interelement spacing. -->
      <style>
        .loginLink {
          display: none;
        }
        #feedback {
          padding: 0;
        }
        .MBooksNav ul li {
          padding-right: 10px;
          text-align: left;
        }
        .MBooksNav ul li a {
          padding: 0;
          text-align: left;
        }
      </style>
        <xsl:call-template name="mbooksnav"/>
      </div>
    </xsl:template>


</xsl:stylesheet>
