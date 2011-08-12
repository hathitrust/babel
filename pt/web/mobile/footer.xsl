<?xml version="1.0" encoding="utf-8"?>

<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
<!-- import/include (should be first child of stylesheet element -->
  <!-- DLXS convention: for import, path is always relative to DLXSROOT/web -->
  <xsl:import href="../common-web/footer.xsl"/>


  <xsl:template name="footer">
   <!--
    <xsl:if test="/MBooksTop/MBooksGlobals/FinalAccessStatus='allow'">
      <div class="mdpControlContainerBottom">
        <ul id="BottomNav">
          <li>
            <div class="mdpPageLinksBottom">
              <xsl:call-template name="BuildPageLinksBottom">
                <xsl:with-param name="pPageLinks" select="MdpApp/PageLinks"/>
              </xsl:call-template>
            </div>
          </li>

          <li>
            <div class="mdpPageXofYBottom">
              <xsl:call-template name="BuildPageXofYForm">
                <xsl:with-param name="pPageXofYForm" select="MdpApp/PageXOfYForm"/>
                <xsl:with-param name="pPageXofYFormId" select="'PageNumberJump_2'"/>
                <xsl:with-param name="pPageXofYId" select="'PageNumberJump_2_Form'"/>
              </xsl:call-template>
            </div>
          </li>

          <xsl:if test="$gViewIsResizable='true'">
            <li>
              <xsl:if test="$gCurrentView='image'">
                <div class="mdpItemResizeBottom">
                  <xsl:call-template name="BuildResizeForm">
                    <xsl:with-param name="pResizeForm" select="MdpApp/ResizeForm"/>
                  </xsl:call-template>
                </div>
                <div class="mdpItemRotateBottom">
                  <xsl:call-template name="BuildItemRotateLinksBottom">
                    <xsl:with-param name="pRotateLinks" select="MdpApp/RotateLinks"/>
                  </xsl:call-template>
                </div>
              </xsl:if>
            </li>
          </xsl:if>

          <xsl:if test="$gShowViewTypes='true'">
            <li>
              <div class="mdpViewType">
                <xsl:call-template name="BuildViewTypeForm">
                  <xsl:with-param name="pViewTypeForm" select="MdpApp/ViewTypeForm"/>
                </xsl:call-template>
              </div>
            </li>
          </xsl:if>

        </ul>
      </div>
    </xsl:if>
  -->
  </xsl:template>

  <!-- CONTROL: Page Links Bottom -->
  <xsl:template name="BuildPageLinksBottom">
    <!--
    <xsl:param name="pPageLinks"/>

    <ul>
      <li>
        <xsl:if test="$pPageLinks/FirstPageLink">
          <xsl:element name="a">
            <xsl:attribute name="title">First</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/FirstPageLink"/>
            </xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">First</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:value-of select="'//common-web/graphics/harmony/icon_first.png'"/>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>

      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/PreviousPageLink=''">
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous</xsl:attribute>
                <xsl:attribute name="src">
                   <xsl:value-of select="'//common-web/graphics/harmony/icon_previous_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Previous</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/PreviousPageLink"/>
              </xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Previous</xsl:attribute>
                <xsl:attribute name="src">
                   <xsl:value-of select="'//common-web/graphics/harmony/icon_previous.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:choose>
          <xsl:when test="$pPageLinks/NextPageLink=''">
            <xsl:element name="span">
              <xsl:element name="img">
                <xsl:attribute name="alt">Next</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next_grayed.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:when>
          <xsl:otherwise>
            <xsl:element name="a">
              <xsl:attribute name="title">Next</xsl:attribute>
              <xsl:attribute name="href">
                <xsl:value-of select="$pPageLinks/NextPageLink"/>
              </xsl:attribute>
              <xsl:element name="img">
                <xsl:attribute name="alt">Next</xsl:attribute>
                <xsl:attribute name="src">
                  <xsl:value-of select="'//common-web/graphics/harmony/icon_next.png'"/>
                </xsl:attribute>
              </xsl:element>
            </xsl:element>
          </xsl:otherwise>
        </xsl:choose>
      </li>

      <li>
        <xsl:if test="$pPageLinks/LastPageLink">
          <xsl:element name="a">
            <xsl:attribute name="title">Last</xsl:attribute>
            <xsl:attribute name="href">
              <xsl:value-of select="$pPageLinks/LastPageLink"/>
            </xsl:attribute>
            <xsl:element name="img">
              <xsl:attribute name="alt">Last</xsl:attribute>
              <xsl:attribute name="src">
                <xsl:text>//common-web/graphics/harmony/icon_last.png</xsl:text>
              </xsl:attribute>
            </xsl:element>
          </xsl:element>
        </xsl:if>
      </li>
    </ul>
   -->
  </xsl:template>

  <!-- CONTROL: Image Rotate Bottom-->
  <xsl:template name="BuildItemRotateLinksBottom">
    <xsl:param name="pRotateLinks"/>

    <ul>
      <li>
        <span class="rotateLabel">rotate&#xa0;</span>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image counter-clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/CounterClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image counter-clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCCW_bottom.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
      </li>
      <li>
        <xsl:element name="a">
          <xsl:attribute name="title">Rotate image clockwise</xsl:attribute>
          <xsl:attribute name="href">
            <xsl:value-of select="$pRotateLinks/ClockwiseLink"/>
          </xsl:attribute>
          <xsl:element name="img">
            <xsl:attribute name="alt">Rotate image clockwise</xsl:attribute>
            <xsl:attribute name="src">
              <xsl:value-of select="'//common-web/graphics/rotateCW_bottom.gif'"/>
            </xsl:attribute>
          </xsl:element>
        </xsl:element>
      </li>
    </ul>

  </xsl:template>
  
  <!-- FORM: Image View Type -->
  <xsl:template name="BuildViewTypeForm">
    <xsl:param name="pViewTypeForm"/>

    <xsl:element name="form">
      <xsl:attribute name="method">get</xsl:attribute>
      <xsl:attribute name="action">
        <xsl:value-of select="'pt'"/>
      </xsl:attribute>

      <ul>
        <li class="asearchform">
          <xsl:apply-templates select="$pViewTypeForm/HiddenVars"/>
          <xsl:for-each select="$pViewTypeForm/ViewTypeValuesSelect">
            <span class="viewLabel">view&#xa0;page&#xa0;as&#xa0;</span>
            <xsl:call-template name="BuildHtmlSelect">
              <xsl:with-param name="class" select="'mdpSelectMenu'"/>
              <xsl:with-param name="key" select="'this.form.submit()'"/>
            </xsl:call-template>
          </xsl:for-each>
        </li>
      </ul>
    </xsl:element>
  </xsl:template>

  <!-- Utility template for building an HTML form elements) -->
  <xsl:template name="BuildHtmlSelect">
    <xsl:param name="id"/>
    <xsl:param name="class"/>
    <xsl:param name="key"/>

    <!-- create main "select" element -->
    <xsl:element name="select">
      <xsl:attribute name="name">
        <xsl:value-of select="Name"/>
      </xsl:attribute>

      <xsl:if test="$id">
        <xsl:attribute name="id">
          <xsl:value-of select="$id"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:if test="$class">
        <xsl:attribute name="class">
          <xsl:value-of select="$class"/>
        </xsl:attribute>
      </xsl:if>

      <!-- onchange attribute -->
      <xsl:if test="$key">
        <xsl:attribute name="onchange">
          <xsl:value-of select="$key"/>
        </xsl:attribute>
      </xsl:if>

      <xsl:for-each select="Option[Label != 'plaintext' and Label != 'fpdf' and Label != 'thumb']">
        <!-- create "option" element -->
        <xsl:element name="option">
          <xsl:attribute name="value">
            <xsl:value-of select="Value"/>
          </xsl:attribute>
          <xsl:if test="../Default=Value">
            <xsl:attribute name="selected">selected</xsl:attribute>
          </xsl:if>
          <xsl:value-of select="Label"/>
        </xsl:element>

      </xsl:for-each>
    </xsl:element>
  </xsl:template>

 <xsl:template name="footertakedownlink">
     <a href="http://www.hathitrust.org/take_down_policy" title="item removal policy">Take-Down Policy</a>
 </xsl:template>
 
</xsl:stylesheet>
  
