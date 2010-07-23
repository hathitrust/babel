<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <xsl:variable name="debug" select="'0'"/>

  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <!-- MDP local stylesheet (loads last to take precedence) -->
        <link rel="stylesheet" type="text/css" href="//common-web/MBooksCol.css"/>
      </head>

      <body>
        <xsl:call-template name="header"/>

        <xsl:comment>
          this is add_coll.xsl
        </xsl:comment>

        <!-- form, should this be a chunk? -->
        <!-- need to replace this with a pi that can use old cgi values to keep debug flag sticky -->

        <h1>Replace this with javascript yui widget!!</h1>
        <form action="mb?" method="get" id="add_coll">
          <input name="a" type="hidden" value="addc" />

          <input name="cn" type="text" value="New Collection Name" size="100" maxlength="254" />
          <table>
            <tr>
              <td><label>
              <input name="shrd" type="radio" value="1" checked="checked" />
              Make collection Public ( so anyone can see it)</label>	</td>

              <td><label>
              <input type="radio" name="shrd" value="0" />
              Make collection Private (only you can see it)</label></td>
            </tr>
          </table>
          <br></br>
          Description
          <textarea name="desc" cols="100" rows="4"></textarea>
          <input  type="submit" value="Submit" />
          <xsl:call-template name="HiddenDebug"/>
        </form>
        <!-- end of form -->


          <xsl:call-template name="footer"/>
          <xsl:call-template name="google_analytics" />

      </body>
    </html>
  </xsl:template>


  <xsl:template name="subnav_header">
    <div id="SubNavHeader">
      <ul>
        <li>
          <xsl:text>Create new Collection</xsl:text>
          <xsl:if test="$debug='1'">
            <span class="debug">DEBUG </span>
          </xsl:if>
        </li>
      </ul>
    </div>
  </xsl:template>

</xsl:stylesheet>

