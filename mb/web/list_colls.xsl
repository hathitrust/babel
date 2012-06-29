<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common">

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

  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <title>
          <xsl:call-template name="get_page_title"/>
        </title>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.6.1/jquery.min.js"></script>

        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>

        <!-- overide debug style if debug flag is on -->
        <xsl:call-template name="debug_CSS"/>

        <script id="controls-template" type="text/x-template">
          <div class="controls clearfix" style="text-align: center">
            <div class="clearfix">
              <ul class="filters">
                <li><button rel="all" class="g-button large active">All</button></li>
                <li><button rel="updated" class="g-button large">Recently Updated</button></li>
                <li><button rel="featured" class="g-button large">Featured</button></li>
                <li><button rel="my-collections" class="g-button large">My Collections</button></li>
              </ul>
              <div class="find-collection">
                <input style="width: 99%" class="q" type="text" placeholder="Find a collection" name="q" id="q" size="15" />
              </div>
            </div>
            <div class="clearfix" style="margin-top: 0.5em">
              <div class="num_items_control" style="width: 33%; white-space: nowrap">
                Collections with at least
                  <select size="1" name="min_items" id="min_items">
                    <option value="0" selected="selected">(all items)</option>
                    <option value="1000">1000 items</option>
                    <option value="500">500 items</option>
                    <option value="250">250 items</option>
                    <option value="100">100 items</option>
                    <option value="50">50 items</option>
                    <option value="25">25 items</option>
                  </select>
              </div>
              <div style="float:right; width: 33%; text-align: right">
                  Sort by: <select size="1" name="sort_by" id="sort_by">
                    <option value="CollName">Collection Title</option>
                    <option value="OwnerString">Owner</option>
                    <option value="Updated" rel="desc">Last Updated</option>
                    <option value="NumItems">Items (low to high)</option>
                    <option value="NumItems" rel="desc">Items (high to low)</option>
                  </select>
              </div>
              &#160;
              <!-- <div style="text-align: center">
                <input type="checkbox" name="toggle_descriptions" checked="checked" /> Show descriptions
              </div> -->
            </div>
            <!-- <div class="clearfix" style="text-align: left">
            </div> -->
            <div class="status">
              <span class="active_filters"></span>
              <a class="awesome small reset_filters_link" href="#">Reset</a>
            </div>
          </div>
        </script>

                <xsl:text>

        </xsl:text>

                <xsl:comment><![CDATA[[if lt IE 8]>
                  <link rel="stylesheet" type="text/css" href="/mb/ie7.css" />
                <![endif]]]></xsl:comment>

                        <xsl:text>

                </xsl:text>


      </head>

      <!-- XXX the onload below only needed to use with
      searchAjaxColl.js, if we don't search from this page we don't
      need it-->

      <!-- <body class="yui-skin-sam" onload="setHandlers()"> -->

      <xsl:element name="body">
        <xsl:attribute name="class">yui-skin-sam</xsl:attribute>
        <xsl:attribute name="id">PubCollPage</xsl:attribute>
        <!-- <xsl:choose>
          <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='pub'">
            <xsl:attribute name="id">PubCollPage</xsl:attribute>
          </xsl:when>
          <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='priv'">
            <xsl:attribute name="id">PrivCollPage</xsl:attribute>
          </xsl:when>
          <xsl:otherwise></xsl:otherwise>
        </xsl:choose> -->

        <div id="mbMasterContainer">

          <div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
          </div>

          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>

          <xsl:call-template name="header"/>
          <xsl:variable name="list_type">
            <xsl:call-template name="get_which_list"/>
          </xsl:variable>

          <xsl:choose>
            <xsl:when test="$list_type='mycolls'">
              <xsl:choose>
                <xsl:when test="count(/MBooksTop/MyCollList/Collection) &gt; 0">
                  <xsl:call-template name="coll_list">
                    <xsl:with-param name="which_list" select="'mycolls'"/>
                    <xsl:with-param name="list_node" select="/MBooksTop/MyCollList"/>
                  </xsl:call-template>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:call-template name="NoPrivateColl"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:when>

            <xsl:otherwise>
              <xsl:call-template name="coll_list">
                <xsl:with-param name="which_list" select="'pubcolls'"/>
                <xsl:with-param name="list_node" select="/MBooksTop/PublicCollList"/>
              </xsl:call-template>
            </xsl:otherwise>
          </xsl:choose>

          <div id="overlay"></div>
          <xsl:call-template name="footer"/>

          <xsl:call-template name="google_analytics" />

        </div>
      </xsl:element> <!-- end body -->

    </html>
  </xsl:template>


  <xsl:template name="get_which_list">
    <xsl:choose>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='pub'">
        <xsl:text>pubcolls</xsl:text>
      </xsl:when>
      <xsl:when test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='priv'">
        <xsl:text>mycolls</xsl:text>
      </xsl:when>
    </xsl:choose>
  </xsl:template>


  <!--XXX Suz this is where the messages go for when there are no private collections -->
  <xsl:template name="NoPrivateColl">
    <xsl:choose>
      <xsl:when test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO'">
        <!-- if not logged in user can save temporary collections or log in to see permanent collections-->
        <div class="loginpromt">
          <span>You are not logged in.
          <a class="inlineLink">
            <xsl:attribute name="href">
              <xsl:value-of select="/MBooksTop/Header/LoginLink"/>
            </xsl:attribute>
            Log in</a> now.
          </span>
          <p>Logging in lets you create and save permanent collections.<br/>
          Or, use the "Create New Collection" link above to create temporary collections. </p>
        </div>
      </xsl:when>
      <xsl:otherwise>
        <!-- if logged in, user just hasn't added any collections -->
        <h3>
          <xsl:text> Currently </xsl:text>
          <xsl:value-of select="$g_user_name"/>
          <xsl:text> does not have any collections </xsl:text>
          <br></br>
          Use the "Create New Collection" link above to create collections
        </h3>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- Sort direction pointer -->
  <xsl:template name="get_sort_arrow">
    <xsl:param name="which_sort"/>
    <xsl:if test="$which_sort=$g_current_sort">
      <!-- display arrow -->
      <xsl:choose>
        <xsl:when test="$g_current_sort_dir='a'">
          <img width="12" height="10" src="//common-web/graphics/arrow_up.gif" alt="sort descending"/>
        </xsl:when>
        <xsl:otherwise>
          <img width="12" height="10" src="//common-web/graphics/arrow_down.gif" alt="sort ascending"/>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:if>
  </xsl:template>

  <!-- Collection List -->
  <xsl:template name="coll_list">
    <xsl:param name="which_list"/>
    <xsl:param name="list_node"/>

    <xsl:variable name="debug_switch">
      <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='debug']"/>
    </xsl:variable>

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

    <div id="mbContentContainer" class="mbColListContainer">
      <h2 class="SkipLink">Main Content</h2>

      <xsl:call-template name="LoginMsg"/>

      <xsl:element name="div">
        <xsl:attribute name="class">
          <xsl:value-of select="$list_class"/>
        </xsl:attribute>

        <style>
          .ColList {
            width: 72%;
            float: left;
            margin: 0px;
            margin-right: 1.5em;
          }
        </style>

        <xsl:variable name="insts" select="//Inst" />

        <script type="text/javascript" disable-output-escaping="yes">
          var bucket = { 'html': [], 'featured': [], 'cols':[] };
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
            'Shared',
            'DeleteCollHref'
          ];

          <xsl:for-each select="$list_node/Collection">
              html = [];
              html.push('<xsl:value-of select="CollId" />');
              html.push(decodeURIComponent('<xsl:value-of select="CollName/@e" />'));
              html.push(decodeURIComponent('<xsl:value-of select="Description/@e" />'));
              html.push('<xsl:value-of select="NumItems" />');
              html.push('<xsl:value-of select="OwnerString" />');

              <xsl:variable name="owner_affiliation">
                <xsl:choose>
                  <xsl:when test="$insts[current()/OwnerAffiliation = @domain]">
                    <xsl:value-of select="string($insts[current()/OwnerAffiliation = @domain])" />
                  </xsl:when>
                  <xsl:when test="$insts[contains(current()/OwnerAffiliation, concat('.', @domain))]">
                    <xsl:value-of select="string($insts[contains(current()/OwnerAffiliation, concat('.', @domain))])" />
                  </xsl:when>
                  <xsl:otherwise><xsl:text></xsl:text></xsl:otherwise>
                </xsl:choose>
              </xsl:variable>

              html.push('<xsl:value-of select="str:replace($owner_affiliation, '&amp;', '__amp;')" disable-output-escaping="yes" />');
              html.push('<xsl:value-of select="Updated" />');
              html.push('<xsl:value-of select="Updated_Display" />');
              featured = '<xsl:value-of select="Featured" />';
              html.push(featured);
              if ( featured ) {
                bucket.featured.push(<xsl:value-of select="position() - 1" />);
              }
              html.push('<xsl:value-of select="Shared" />');
              html.push('<xsl:value-of select="DeleteCollHref" />');
              bucket.html.push(html);
          </xsl:for-each>

        </script>

        <div class="results">
          <xsl:for-each select="$list_node/Collection">

            <!-- <script type="text/javascript">
              html = [];
              html.push('<xsl:value-of select="CollId" />');
              html.push(decodeURIComponent('<xsl:value-of select="CollName/@e" />'));
              html.push(decodeURIComponent('<xsl:value-of select="Description/@e" />'));
              html.push('<xsl:value-of select="NumItems" />');
              html.push('<xsl:value-of select="OwnerString" />');

              <xsl:variable name="owner_affiliation" select="string($insts[contains(current()/OwnerAffiliation, @domain)])" />

              html.push('<xsl:value-of select="str:replace($owner_affiliation, '&amp;', '__amp;')" disable-output-escaping="yes" />');
              html.push('<xsl:value-of select="Updated" />');
              html.push('<xsl:value-of select="Updated_Display" />');
              featured = '<xsl:value-of select="Featured" />';
              html.push(featured);
              if ( featured ) {
                bucket.featured.push(<xsl:value-of select="position() - 1" />);
              }
              html.push('<xsl:value-of select="Shared" />');
              html.push('<xsl:value-of select="DeleteCollHref" />');
              bucket.html.push(html);
            </script> -->

            <xsl:variable name="class">
              <xsl:text>collection </xsl:text>
              <xsl:choose>
                <xsl:when test="( position() - 1 ) mod 2 = 0">even </xsl:when>
                <xsl:otherwise>odd </xsl:otherwise>
              </xsl:choose>
              <xsl:if test="Owner = $g_user_id">mine </xsl:if>
              <xsl:if test="Shared = '0'">private </xsl:if>
            </xsl:variable>

            <div class="{$class}" position="{position() - 1} / {(position() - 1) mod 2}">
              <div class="left">
                <p class="collname">
                  <a href="?a=listis;c={CollId}"><xsl:value-of select="CollName" /></a>
                </p>
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
                      <a href="mb?a=editst;shrd={Sharing};c={CollId};colltype=priv;debug={//CurrentCgi/Param[@name='debug']}" class="awesome thin small grey toggle-sharing">
                        <span class="sharing-status {translate($shared, 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz')}"><xsl:value-of select="$shared" /></span> : Make <xsl:value-of select="$altshared" />
                      </a>
                      <xsl:text>&#160;&#160;</xsl:text>
                      <a href="#" data-delete-href="{DeleteCollHref}" class="awesome thin small grey delete-collection">Delete Collection</a>
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

        <script type="text/javascript">
          <!-- setup cbBrowser app -->
          $(document).ready(function() {
            console.log("SETTING UP BROWSER");
            HT.params = {};
            HT.params.bucket = bucket;
            HT.cbBrowser.setup();
          })
        </script>

        <br class="clr" />
      </xsl:element>

      <xsl:call-template name="FeaturedCollection" />

    </div>

  </xsl:template>

  <xsl:template name="LoginMsg">
    <xsl:choose>
      <xsl:when test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO'">
        <div class="login_status">
          <strong>
            <a>
              <xsl:attribute name="href"><xsl:value-of select="/MBooksTop/Header/LoginLink"/></xsl:attribute>
              <xsl:attribute name="class">loginLink</xsl:attribute>
              Login
            </a>
          </strong> to create and save permanent collections or see your private
          collections.
        </div>
      </xsl:when>
      <xsl:otherwise></xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <!-- # search form # -->
  <xsl:template name="searchform">
    <xsl:param name="CollId"/>
    <xsl:param name="pub_priv"/>

    <!-- The form label element is for accessibility.  The CSS
         hides it with display:none. -->

    <xsl:variable name = "SearchFormId">
      <xsl:value-of select="$pub_priv"/>
      <xsl:text>_srch_</xsl:text>
      <xsl:value-of select="$CollId"/>   <!-- change to append public/private here -->
    </xsl:variable>

    <form  method="GET" action="mb" class="searchform">
      <xsl:attribute name="id">
        <xsl:value-of select="$SearchFormId"/>
      </xsl:attribute>

      <xsl:call-template name="HiddenDebug"/>
      <input type="hidden" name="a" value="srch"/>
      <input type="hidden" name="c">
        <xsl:attribute name="value">
          <xsl:value-of select="$CollId"/>
        </xsl:attribute>
      </input>
      <label>
        <xsl:attribute name="for">
          <xsl:value-of select="$SearchFormId"/>
        </xsl:attribute>

        <span class="SearchLabel">
          <xsl:value-of select="concat('Search ', CollName)"/>
        </span>
        <input type="text" size="15" maxlength="40" name="q1" />
      </label>

      <button type="submit">
        <xsl:attribute name="id">
          <xsl:text>button_</xsl:text>
          <xsl:value-of select="$CollId"/>
        </xsl:attribute>
        Search
      </button>
    </form>

    <!-- search error message-->
    <div>
      <xsl:attribute name="id">
        <xsl:text>search_errormsg_</xsl:text>
        <xsl:value-of select="$SearchFormId"/>
      </xsl:attribute>
      <div class="bd"></div>
    </div>
    </xsl:template>


    <!--# search form #-->
    <xsl:template name="subnav_header">
      <!--    <div class="MBooksCol">  XXX temporarily remove this per Suz request-->
      <div class="CollPage">
        <!-- Collections Table Title -->
        <h2>
          <xsl:text>Collections</xsl:text>
          <!-- <xsl:call-template name="get_page_title"/> -->
          <!-- <xsl:if test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO' and /MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='priv'">
            <xsl:text> (login to save them)</xsl:text>
          </xsl:if> -->
        </h2>

        <xsl:if test="$debug='1'">
          <span class="debug">DEBUG </span>
        </xsl:if>
      </div>
      <!--  </div>-->

      <div class="newCol">
        <xsl:element name="a">
          <xsl:attribute name="href">
            <xsl:value-of select="AddCollHref"/>
          </xsl:attribute>
          <xsl:attribute name="id">createNewColl</xsl:attribute>
          <xsl:text>Create New Collection</xsl:text>
        </xsl:element>
      </div>
    </xsl:template>

    <xsl:template name="get_page_title">
      <xsl:variable name="pubpriv">
        <xsl:call-template name="get_which_list"/>
      </xsl:variable>
      <xsl:text>Collections | HathiTrust Digital Library</xsl:text>
      <!-- <xsl:choose>
        <xsl:when test="$pubpriv='pubcolls'">
          <xsl:text>Public Collections</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:choose>
            <xsl:when test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO'">
              <xsl:text>Temporary Collections</xsl:text>
            </xsl:when>
            <xsl:otherwise>
              <xsl:value-of select='concat($g_user_name, "&apos;s Collections")'/>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:otherwise>
      </xsl:choose>     -->
    </xsl:template>

    <xsl:template name="FeaturedCollection">

      <script id="featured-template" type="text/x-template">
        <div class="Box">
          <h4>Featured Collection</h4>
          <div>
            <h5>
              <a href="mb?a=listis;c=${{collid}}">${collname}</a>
            </h5>
            <a href="mb?a=listis;c=${{collid}}">
              <img alt="" class="imgLeft" src="${{featured}}" />
            </a>
            <p class="hyphenate">
              ${description}
            </p>
            <br clear="both" />
          </div>
        </div>
      </script>

      <div id="Sidebar">
      </div>
    </xsl:template>

  </xsl:stylesheet>
