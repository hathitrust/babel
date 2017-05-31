<?xml version="1.0" encoding="utf-8"?>
<!DOCTYPE xsl:stylesheet [ 
<!ENTITY nbsp "&#160;"> 
<!ENTITY copy "&#169;">
<!ENTITY raquo "»"> 
<!ENTITY laquo "«"> 
]>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
  xmlns="http://www.w3.org/1999/xhtml">

  <xsl:import href="str.replace.function.xsl" />

  <xsl:variable name="g_current_sort_param" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='sort']"/>
  <!-- need to separate sort and dir from sort param i.e. title_d = sort=title dir=d -->
  <xsl:variable name="g_current_sort" select="substring-before($g_current_sort_param,'_')"/>
  <xsl:variable name="g_current_sort_dir" select="substring-after($g_current_sort_param,'_')"/>

  <xsl:variable name="debug" select="'1'"/>

  <xsl:variable name="g_user_name">
    <xsl:value-of select="/MBooksTop/Header/UserName"/>
  </xsl:variable>

  <xsl:variable name="g_user_id">
    <xsl:value-of select="/MBooksTop/Header/UserId"/>
  </xsl:variable>

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/mb/css/screen.css" />
    <!-- <link rel="stylesheet" type="text/css" href="/mb/list_colls.css" /> -->

    <xsl:call-template name="include_local_javascript" />
    <!-- <xsl:call-template name="load_js_and_css"/> -->
    
  </xsl:template>

  <xsl:template name="setup-body-class">
    listcs
  </xsl:template>

  <xsl:template name="skip-to-main-link">
    <ul id="skiplinks">
      <li><a href="#results">Skip to collections list</a></li>
    </ul>
  </xsl:template>

  <xsl:template name="contents">
    <h2 class="mbContentTitle offscreen">All Collections</h2>
    <xsl:call-template name="intro" />
    <xsl:call-template name="coll_list">
      <xsl:with-param name="which_list" select="'pubcolls'"/>
      <xsl:with-param name="list_node" select="/MBooksTop/CollList"/>
    </xsl:call-template>
    <xsl:call-template name="sidebar" />
    <script type="text/javascript">
      head.js("/mb/js/list_colls.js");
    </script>
  </xsl:template>

  <xsl:template name="intro">
    <div class="listcs-intro">
      <p>
        Collections are a way to group items for public or private use. 
        The full-text of items within a collection can be searched 
        independently of the full library.
        <a href="http://www.hathitrust.org/help_digital_library#CBBuild">Learn more about collections &raquo;</a>
      </p>
    </div>
  </xsl:template>

  <!-- Collection List -->
  <xsl:template name="coll_list">
    <xsl:param name="which_list"/>
    <xsl:param name="list_node"/>

    <xsl:variable name="pub_priv">
      <xsl:choose>
        <xsl:when test="$which_list='mycolls'">private</xsl:when>
        <xsl:otherwise>public</xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <xsl:variable name="list_class">
      <xsl:choose>
        <xsl:when test="$which_list='mycolls'">
          <!-- <xsl:text>ColList MyCollections</xsl:text> -->
          <xsl:text>ColList PublicCollections</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>ColList PublicCollections</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>

    <div id="mbContentContainer" class="main list_colls" role="main">

      <xsl:element name="div">
        <xsl:attribute name="class">
          <xsl:value-of select="$list_class"/>
        </xsl:attribute>

        <h3 class="offscreen">Sorting/Filtering Tools</h3>

        <div class="controls" role="toolbar">
          <div class="row">
            <div class="span12">
              <ul class="filters nav nav-tabs">
                <li class="active"><a href="#" data-target="all" class="active">All</a></li>
                <li><a href="#" data-target="updated" class="">Recently Updated</a></li>
                <li><a href="#" data-target="featured" class="">Featured</a></li>
                <li><a href="#" data-target="mondo" class="">Mondo</a></li>
                <li><a href="#" data-target="my-collections" class="">My Collections</a></li>
              </ul>
            </div>
          </div>
          <div class="row">
            <div class="span6">
              <div class="num_items_control" style="width: 33%; white-space: nowrap">
                <label>Collections with at least
                  <select size="1" name="min_items" id="min_items">
                    <option value="0" selected="selected">(all items)</option>
                    <option value="1000">1000 items</option>
                    <option value="500">500 items</option>
                    <option value="250">250 items</option>
                    <option value="100">100 items</option>
                    <option value="50">50 items</option>
                    <option value="25">25 items</option>
                  </select>
                </label>
              </div>

              <div>
                <label>Sort by: <select size="1" name="sort_by" id="sort_by">
                    <option value="CollName">Collection Title</option>
                    <option value="OwnerString">Owner</option>
                    <option value="Updated" data-sort="desc">Last Updated</option>
                    <option value="NumItems">Items (low to high)</option>
                    <option value="NumItems" data-sort="desc">Items (high to low)</option>
                  </select>
                </label>
              </div>
            </div>
            <div class="span6 align-right">

              <div>
                <a id="action-add-collection" href="{AddCollHref}">Create new collection</a>
              </div>

              <div class="find-collection">
                <label for="q" class="offscreen">Start typing to display only collections containing search terms.</label>
                <input class="q input-large" type="text" placeholder="Find a collection" name="q" id="q" size="15" />
              </div>

            </div>

          </div>
        </div>

        <div class="status" aria-live="assertive" aria-atomic="true">
          <span class="active_filters"></span>
          <a class="btn btn-mini list-reset" href="#">Reset</a>
        </div>

        <h3 class="offscreen">List of collections</h3>

        <script type="text/javascript">
          var bucket = { 'html': [], 'featured': [], 'cols':[], 'mondo': [] };
          var html; var featured;
          bucket.cols = [
            'CollId',
            'CollName',
            'Description',
            'NumItems',
            'OwnerString',
            'OwnerAffiliation',
            'Updated',
            'Updated_Display',
            'Featured',
            'Mondo',
            'Shared',
            'DeleteCollHref'
          ];

          <xsl:for-each select="$list_node/Collection">
              html = [];
              html.push('<xsl:value-of select="CollId" />');
              html.push(decodeURIComponent('<xsl:value-of select="CollName/@e" />'));
              html.push(decodeURIComponent('<xsl:value-of select="Description/@e" />'));
              html.push('<xsl:value-of select="NumItems" />');
              html.push(decodeURIComponent('<xsl:value-of select="OwnerString/@e" />'));

              <xsl:variable name="owner_affiliation">
                <xsl:value-of select="OwnerAffiliation/@e" />
              </xsl:variable>

              html.push(decodeURIComponent('<xsl:value-of select="str:replace($owner_affiliation, '&amp;', '__amp;')" disable-output-escaping="yes" />'));
              html.push('<xsl:value-of select="Updated" />');
              html.push('<xsl:value-of select="Updated_Display" />');
              featured = '<xsl:value-of select="Featured" />';
              html.push(featured);
              if ( featured ) {
                bucket.featured.push(<xsl:value-of select="position() - 1" />);
              }
              mondo = '<xsl:value-of select="Mondo" />';
              html.push(mondo);
              if ( mondo ) {
                bucket.mondo.push(<xsl:value-of select="position() - 1" />);
              }
              html.push('<xsl:value-of select="Shared" />');
              html.push('<xsl:value-of select="DeleteCollHref" />');
              bucket.html.push(html);
          </xsl:for-each>

        </script>

        <div class="results" id="results" tabindex="-1">
          <xsl:for-each select="$list_node/Collection[position() &lt; 10]">

            <xsl:variable name="class">
              <xsl:text>collection </xsl:text>
              <xsl:choose>
                <xsl:when test="( position() - 1 ) mod 2 = 0"></xsl:when>
                <xsl:otherwise>alt </xsl:otherwise>
              </xsl:choose>
              <xsl:if test="Owner = $g_user_id">mine </xsl:if>
              <xsl:if test="Shared = '0'">private </xsl:if>
            </xsl:variable>

            <div class="{$class}">
              <div class="left">
                <h4 class="collname">
                  <a href="?a=listis;c={CollId}"><xsl:value-of select="CollName" /></a>
                </h4>
                <xsl:if test="normalize-space(Description)">
                  <p class="description"><xsl:value-of select="Description" /></p>
                </xsl:if>
                <p class="meta">
                  <span class="owner_name">Owner: <xsl:value-of select="OwnerString" /></span>
                  <xsl:if test="Owner = $g_user_id">
                    <xsl:variable name="shared">
                      <xsl:choose>
                        <xsl:when test="Sharing = '1'">Public</xsl:when>
                        <xsl:otherwise>Private</xsl:otherwise>
                      </xsl:choose>
                    </xsl:variable>
                    <xsl:variable name="altshared">
                      <xsl:choose>
                        <xsl:when test="Sharing = '1'">Private</xsl:when>
                        <xsl:otherwise>Public</xsl:otherwise>
                      </xsl:choose>
                    </xsl:variable>
                    <span class="options">
                      <a href="mb?a=editst;shrd={Sharing};c={CollId};colltype=priv;debug={//CurrentCgi/Param[@name='debug']}" class="btn btn-mini toggle-sharing">
                        <span class="sharing-status {translate($shared, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')}"><xsl:value-of select="$shared" /></span> : Make <xsl:value-of select="$altshared" />
                      </a>
                      <xsl:text>&#160;&#160;</xsl:text>
                      <a href="#" data-delete-href="{DeleteCollHref}" class="btn btn-mini delete-collection">Delete Collection</a>
                    </span>
                  </xsl:if>
                </p>
              </div>
              <div class="right">
                <p class="num_items">
                  <xsl:value-of select="NumItems" /> item<xsl:if test="number(NumItems) > 1">s</xsl:if>
                </p>
                <p class="updated">
                  last updated: <xsl:value-of select="Updated_Display" />
                </p>
              </div>
            </div>
          </xsl:for-each>
        </div>

        <xsl:call-template name="LoginMsg" />

        <script type="text/javascript">
          var HT = HT || {};
        </script>

        <br class="clr" />
      </xsl:element>

    </div>

  </xsl:template>

  <xsl:template name="sidebar">
    <div class="sidebar sidebar-right">
      <h2>Featured Collections</h2>
      <div id="Sidebar">
      </div>
      <!-- <xsl:call-template name="FeaturedCollection" /> -->
    </div>
  </xsl:template>

  <xsl:template name="LoginMsg">
    <xsl:choose>
      <xsl:when test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO'">
        <div class="login_status hide">
          <strong>
            <a>
              <xsl:attribute name="href"><xsl:value-of select="/MBooksTop/Header/LoginLink"/></xsl:attribute>
              <xsl:attribute name="class">loginLink trigger-login</xsl:attribute>
              <xsl:text>Login</xsl:text>
            </a>
          </strong> to create and save permanent collections or see your private
          collections.
        </div>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="get-page-title">
    <xsl:text>Collections</xsl:text>
  </xsl:template>

  <xsl:template name="FeaturedCollection">

    <!-- <script id="featured-template" type="text/x-template"> -->
      <div class="Box" role="complementary">
        <div>
          <!-- <h4> -->
          <span class="title">
            <a href="mb?a=listis;c={{{{collid}}}}">{{collname}}</a>
          </span>
          <!-- </h4> -->
          <a href="mb?a=listis;c={{{{collid}}}}" aria-hidden="true">
            <img alt=" " class="imgLeft" src="{{{{featured}}}}" />
          </a>
          <p class="hyphenate">
            {{description}}
          </p>
          <br clear="all" />
        </div>
      </div>
    <!-- </script> -->

  </xsl:template>

</xsl:stylesheet>
