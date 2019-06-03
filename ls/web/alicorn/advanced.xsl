<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  xmlns:PREMIS="http://www.loc.gov/standards/premis"
  xmlns="http://www.w3.org/1999/xhtml"
  xmlns:dc="http://purl.org/dc/elements/1.1/"
  xmlns:exsl="http://exslt.org/common"
  exclude-result-prefixes="exsl METS PREMIS"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings">

  <xsl:variable name="logged_in">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/LoggedIn"/>
  </xsl:variable>

  <xsl:variable name="inst_code">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionCode"/>
  </xsl:variable>

  <xsl:variable name="inst_name">
    <xsl:value-of select="/MBooksTop/MBooksGlobals/InstitutionName"/>
  </xsl:variable>
  <xsl:variable name="limitByInst">
    <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='heldby']">
      <xsl:text>TRUE</xsl:text>
    </xsl:if>
  </xsl:variable>

  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
  <xsl:variable name="isCollSearch">
    <xsl:if test="normalize-space($coll_id) != ''">
      <xsl:text>TRUE</xsl:text>
    </xsl:if>
  </xsl:variable>

  <xsl:template name="setup-extra-header">
    <style>
      .parenthesis03 {
          position: relative;

          padding: 15px 20px;
          box-sizing: border-box;
      }
      .parenthesis03::before,
      .parenthesis03::after {
          position: absolute;
          top: 0;
          content: '';
          width: 20px;
          height: 100%;
          border-top: 1px solid #aaa; /* original #555 */
          border-bottom: 1px solid #aaa;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
      }
      .parenthesis03::before {
          left: 0;
          border-left: 1px solid #aaa;
      }
      .parenthesis03::after {
          right: 0;
          border-right: 1px solid #aaa;
      }

      .parenthesis04 {
          position: relative;
          padding: 1.5rem;
          box-sizing: border-box;
      }
      .parenthesis04::before,
      .parenthesis04::after {
          position: absolute;
          top: 0;
          content: '';
          width: 20px;
          height: 100%;
          border-top: 2px solid #aaa;
          border-bottom: 2px solid #aaa;
          -webkit-box-sizing: border-box;
          box-sizing: border-box;
      }
      .parenthesis04::before {
          left: 0;
          border-left: 2px solid #aaa;
          border-radius: 8px 0 0 8px;
      }
      .parenthesis04::after {
          right: 0;
          border-right: 2px solid #aaa;
          border-radius: 0 8px 8px 0;
      }
      .group-boolean {
        width: 50%;
        margin: 0 auto;
        border-top: 1px dotted #666;
        border-bottom: 1px dotted #666;
        font-size: 2rem;
        display: none;
      }

      .group-boolean-container + fieldset.group {
        display: none;
      }

      .group-boolean-container.active + fieldset.group {
        display: block;
      }

      .group-boolean-container.active .group-boolean {
        display: block;
      }

      .group-boolean-container button {
        display: block;
        margin: 0 auto;
        font-size: 0.8rem
      }

      .group-boolean-container.active button {
        display: none;
      }

      .group-boolean label {
        margin-bottom: 0;
      }

    </style>
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <div id="skiplinks" role="complementary" aria-label="Skip links">
      <ul>
        <li>
          <a href="#section">Skip to main</a>
        </li>
      </ul>
    </div>
  </xsl:template>

  <xsl:template name="main">
    <form method="GET" action="/cgi/ls" name="searchcoll" class="advanced-search-form">
      <h2>
        <xsl:text>Advanced Full-text Search</xsl:text>
        <xsl:if test="$isCollSearch = 'TRUE'">
          <xsl:text>: </xsl:text>
          <a href="/cgi/ls?a=srchls;q1=*;c={$coll_id}">
            <xsl:value-of select="/MBooksTop/AdvancedSearch/COLL_INFO/COLL_NAME"/>
          </a>
        </xsl:if>
      </h2>


      <p>Search information <em>within</em> the item (<a target="_blank" href="http://www.hathitrust.org/help_digital_library#SearchTips">Search Tips</a>).</p>
      <p>Prefer to search <em>about</em> the item in an <a href="//catalog.hathitrust.org/Search/Advanced">Advanced Catalog search</a>?</p>

      <h3 class="offscreen">Search by field</h3>

      <xsl:for-each select="//AdvancedSearch/groups/group">
        <xsl:if test="position() > 1">
          <div>
            <xsl:attribute name="class">
              <xsl:text>group-boolean-container</xsl:text>
              <xsl:if test="normalize-space(.//q)">
                <xsl:text> active</xsl:text>
              </xsl:if>
            </xsl:attribute>
            <button class="btn button action-add-clause" style=""><i class="icomoon icomoon-plus" aria-hidden="true"></i> Add another group of search fields</button>
            <xsl:call-template name="boolean-operator">
              <xsl:with-param name="index">GROUP</xsl:with-param>
              <xsl:with-param name="name">op3</xsl:with-param>
              <xsl:with-param name="legend">group 1 and group 2</xsl:with-param>
              <xsl:with-param name="selected" select="row[1]/op" />
              <xsl:with-param name="class">group-boolean</xsl:with-param>
            </xsl:call-template>
          </div>
        </xsl:if>
        <xsl:apply-templates select=".">
          <xsl:with-param name="index" select="position()" />
        </xsl:apply-templates>
      </xsl:for-each>

      <button kind="primary" class="button btn btn-primary"><i class="icomoon icomoon-search" aria-hidden="true"></i> Advanced Search</button>

      <h3>Additional search options</h3>
      <div class="advanced-filters-inner-container">
        <xsl:call-template name="build-view-option" />
        <xsl:call-template name="build-date-range-option" />
        <xsl:call-template name="build-language-option" />
        <xsl:call-template name="build-format-option" />
      </div>

      <div style="display: flex; justify-content: space-between; align-items: center; flex-direction: row">
        <button kind="primary" class="button btn btn-primary"><i class="icomoon icomoon-search" aria-hidden="true"></i> Advanced Search</button>
        <a class="button btn">
          <xsl:attribute name="href">
            <xsl:text>/cgi/ls?a=page;page=advanced</xsl:text>
            <xsl:if test="$coll_id"><xsl:text>;c=</xsl:text><xsl:value-of select="$coll_id" /></xsl:if>
          </xsl:attribute>
          Reset Form
        </a>
      </div>

      <input type="hidden" name="a" value="srchls"/>
      <xsl:if test="$isCollSearch = 'True' ">
        <input type="hidden" name="c" value="{$coll_id}" />
      </xsl:if>

    </form>
  </xsl:template>

  <xsl:template name="build-view-option">
    <div class="advanced-search-filter-container">
      <h4 class="advanced-filter-label-text">View Options</h4>
      <div class="advanced-filter-inner-container">
        <input type="checkbox" name="lmt" value="ft" id="filter-full-view-only">
          <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='lmt']='ft'">
            <xsl:attribute name="checked">
              <xsl:text>checked</xsl:text>
            </xsl:attribute>
          </xsl:if>
        </input>
        <label for="filter-full-view-only">Full view only</label>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-date-range-option">
    <div class="advanced-search-filter-container">
      <h4 class="advanced-filter-label-text">Date of Publication</h4>
      <div class="advanced-filter-inner-container">
        <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
        <div class="date-range-input">
          <fieldset class="no-margin choice-container">
            <legend class="offscreen">Select the type of date range to search on</legend>
            <xsl:for-each select="//yop/yopOptions/option">
              <div>
                <input type="radio" id="date-range-input-radio-{position()}" name="yop" value="{@value}">
                  <xsl:if test="@selected = 'selected'">
                    <xsl:attribute name="checked">checked</xsl:attribute>
                  </xsl:if>
                </input>
                <label class="multiple-choice" for="date-range-input-radio-{position()}"><span><xsl:value-of select="." /></span></label>
              </div>
            </xsl:for-each>
          </fieldset>
          <xsl:variable name="inputs" select="//yop/span" />
          <div class="date-range-container">
            <input name="pdate_start" class="date-range-input-text date-range--between date-range--after" type="text" aria-label="Start date" placeholder="Start date">
              <xsl:attribute name="value"><xsl:value-of select="$inputs/input[@name = 'pdate_start']/@value" /></xsl:attribute>
            </input>
            <input name="pdate_end" class="date-range-input-text date-range--between date-range--before" type="text" aria-label="End date" placeholder="End date">
              <xsl:attribute name="value"><xsl:value-of select="$inputs/input[@name = 'pdate_end']/@value" /></xsl:attribute>
            </input>
            <input name="pdate" class="date-range-input-text date-range--in" type="text" aria-label="Date" placeholder="Date">
              <xsl:attribute name="value"><xsl:value-of select="$inputs/input[@name = 'pdate']/@value" /></xsl:attribute>
            </input>
          </div>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-language-option">
    <div class="advanced-search-filter-container">
      <h4 class="advanced-filter-label-text">Language</h4>
      <div class="advanced-filter-inner-container">
        <div class="multiselect">
          <p>Select one or more checkboxes to narrow your results to items that match all of your language selections.</p>
          <input name=".language-filter" type="text" class="multiselect-search" aria-label="Filter options" aria-describedby="language" placeholder="Filter" value="" />
          <p id="language" class="offscreen">Below this edit box is a list of check boxes that allow you to filter down your options. As you type in this edit box, the list of check boxes is updated to reflect only those that match the query typed in this box.</p>
          <fieldset class="multiselect-options">
            <ul class="multiselect-options-list">
              <xsl:for-each select="//facets/language_list/option[@value != 'language008_full:All'][normalize-space(.)]">
                <li class="multiselect-options-list-item">
                  <input type="checkbox" name="facet_lang" id="language-{position()}" value="{@value}">
                    <xsl:choose>
                      <xsl:when test="@selected = 'selected'">
                        <xsl:attribute name="checked">checked</xsl:attribute>
                        <!-- <xsl:attribute name="tabindex">0</xsl:attribute> -->
                      </xsl:when>
                      <xsl:otherwise>
                        <!-- <xsl:attribute name="tabindex">-1</xsl:attribute> -->
                      </xsl:otherwise>
                    </xsl:choose>
                  </input>
                  <label for="language-{position()}">
                    <span class="filter-name"><xsl:value-of select="." /></span>
                  </label>
                </li>
              </xsl:for-each>
            </ul>
          </fieldset>
          <button style="display: none" type="button" class="button-link-light multiselect-show-checked-toggle"><span>Show only selected options (<span data-slot="count">0</span>)</span></button>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template name="build-format-option">
    <div class="advanced-search-filter-container">
      <h4 class="advanced-filter-label-text">Original Format</h4>
      <div class="advanced-filter-inner-container">
        <div class="multiselect">
          <p>Select one or more checkboxes to narrow your results to items that match all of your format selections.</p>
          <input name=".format-filter" type="text" class="multiselect-search" aria-label="Filter options" aria-describedby="language" placeholder="Filter" value="" />
          <p id="language" class="offscreen">Below this edit box is a list of check boxes that allow you to filter down your options. As you type in this edit box, the list of check boxes is updated to reflect only those that match the query typed in this box.</p>
          <fieldset class="multiselect-options">
            <ul class="multiselect-options-list">
              <xsl:for-each select="//facets/formats_list/option[@value != 'format:All'][normalize-space(.)]">
                <li class="multiselect-options-list-item">
                  <xsl:choose>
                    <xsl:when test="@selected = 'selected'">
                      <xsl:attribute name="checked">checked</xsl:attribute>
                      <!-- <xsl:attribute name="tabindex">0</xsl:attribute> -->
                    </xsl:when>
                    <xsl:otherwise>
                      <!-- <xsl:attribute name="tabindex">-1</xsl:attribute> -->
                    </xsl:otherwise>
                  </xsl:choose>
                  <input type="checkbox" name="facet_format" id="format-{position()}" value="{@value}">
                    <xsl:choose>
                      <xsl:when test="@selected = 'selected'">
                        <xsl:attribute name="checked">checked</xsl:attribute>
                        <!-- <xsl:attribute name="tabindex">0</xsl:attribute> -->
                      </xsl:when>
                      <xsl:otherwise>
                        <!-- <xsl:attribute name="tabindex">-1</xsl:attribute> -->
                      </xsl:otherwise>
                    </xsl:choose>
                  </input>
                  <label role="checkbox" for="format-{position()}">
                    <span class="filter-name"><xsl:value-of select="." /></span>
                  </label>
                </li>
              </xsl:for-each>
            </ul>
          </fieldset>
          <button style="display: none" type="button" class="button-link-light multiselect-show-checked-toggle"><span>Show only selected options (<span data-slot="count">0</span>)</span></button>
        </div>
      </div>
    </div>
  </xsl:template>

  <xsl:template match="group">
    <xsl:param name="index" />
    <fieldset class="group parenthesis04">
      <legend class="offscreen">Search group <xsl:value-of select="$index" /></legend>
      <div class="alert alert-error alert-block" role="alert" aria-atomic="true"></div>
      <xsl:for-each select="row">
        <xsl:apply-templates select=".">
          <xsl:with-param name="group-index" select="$index" />
          <xsl:with-param name="index" select="position()" />
        </xsl:apply-templates>
      </xsl:for-each>
    </fieldset>
  </xsl:template>

  <xsl:template match="row">
    <xsl:param name="group-index" />
    <xsl:param name="index" />
    <xsl:variable name="row" select="." />

    <fieldset class="clause">
      <legend class="offscreen">Search Field <xsl:value-of select="@rownum" /></legend>
      <xsl:if test="$index > 1">
        <xsl:call-template name="boolean-operator">
          <xsl:with-param name="index" select="concat($group-index, '-', $index)" />
          <xsl:with-param name="name" select="concat('op', @rownum)" />
          <xsl:with-param name="legend">field <xsl:value-of select="@rownum - 1" /> and <xsl:value-of select="@rownum" /></xsl:with-param>
          <xsl:with-param name="selected"><xsl:value-of select="op" /></xsl:with-param>
        </xsl:call-template>
      </xsl:if>

      <div class="advanced-input-container">
        <select name="field{@rownum}" aria-label="Selected field {@rownum}" class="advanced-field-select">
          <xsl:for-each select="/MBooksTop/AdvancedSearch/fieldlist/Option">
            <option value="{Value}">
              <xsl:if test="Value = $row/field">
                <xsl:attribute name="selected">selected</xsl:attribute>
              </xsl:if>
              <xsl:value-of select="Label" />
            </option>
          </xsl:for-each>
        </select>
        <select name="anyall{@rownum}" aria-label="Selected field {@rownum}" class="advanced-field-select">
          <xsl:for-each select="/MBooksTop/AdvancedSearch/AnyAll/Option">
            <option value="{Value}">
              <xsl:if test="Value = $row/anyall">
                <xsl:attribute name="selected">selected</xsl:attribute>
              </xsl:if>
              <xsl:value-of select="Label" />
            </option>
          </xsl:for-each>
        </select>
        <div class="advanced-input-container" style="margin-right: 1rem">
          <label for="field-search-text-input-{$group-index}-{$index}" class="offscreen">Search Term <xsl:value-of select="@rownum" /></label>
          <input id="field-search-text-input-{$group-index}-{$index}" placeholder="Search Term {@rownum}" type="text" name="q{@rownum}" value="{q}" />
        </div>
      </div>

    </fieldset>
  </xsl:template>

  <xsl:template name="boolean-operator">
    <xsl:param name="index" />
    <xsl:param name="name" />
    <xsl:param name="legend" />
    <xsl:param name="selected" />
    <xsl:param name="class" />
    <fieldset class="no-margin choice-container {$class}">
      <legend class="offscreen">Boolean Operator for <xsl:value-of select="$legend" /></legend>
      <div>
        <input type="radio" id="search-field-{$index}-boolean-0" class="advanced-boolean-clause" name="{$name}" value="AND">
          <xsl:if test="$selected = 'AND'">
            <xsl:attribute name="checked">checked</xsl:attribute>
          </xsl:if>
        </input>
        <label for="search-field-{$index}-boolean-0">AND</label>
      </div>
      <div>
        <input type="radio" id="search-field-{$index}-boolean-1" name="{$name}" value="OR" class="advanced-boolean-clause">
          <xsl:if test="$selected = 'OR'">
            <xsl:attribute name="checked">checked</xsl:attribute>
          </xsl:if>
        </input>
        <label for="search-field-{$index}-boolean-1">OR</label>
      </div>
    </fieldset>
  </xsl:template>

  <xsl:template name="get-page-title">
    Advanced Full-Text Search
  </xsl:template>

  <!-- <div class="sidebar-container" id="sidebar" tabindex="0"></div> -->

  <xsl:template name="header" />

  <xsl:template name="config-include-logo">TRUE</xsl:template>
  <xsl:template name="get-container-class">container-narrow</xsl:template>

</xsl:stylesheet>
