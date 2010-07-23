<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
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
        <xsl:call-template  name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        
        <!-- overide debug style if debug flag is on -->
        <xsl:call-template name="debug_CSS"/>

      </head>

      <!-- XXX the onload below only needed to use with searchAjaxColl.js, if we don't search from this page we don't need it-->
      <!--  <body class="yui-skin-sam" onload="setHandlers()"> -->
      
      <body class="yui-skin-sam">
        <div id="mbMasterContainer">
          
          <div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvDLPS_DEV"/>
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
      </body>
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
    
    <xsl:variable name="pub_priv">
      <xsl:choose>
        <xsl:when test="$which_list='mycolls'">private</xsl:when>          
        <xsl:otherwise>public</xsl:otherwise>
      </xsl:choose>      
    </xsl:variable>
    
    <xsl:variable name="list_class">
      <xsl:choose>
        <xsl:when test="$which_list='mycolls'">
          <xsl:text>ColList MyCollections</xsl:text>
        </xsl:when>
        <xsl:otherwise>
          <xsl:text>ColList PublicCollections</xsl:text>
        </xsl:otherwise>
      </xsl:choose>
    </xsl:variable>
        
    <div id="mbContentContainer" class="mbColListContainer">
      <h2 class="SkipLink">Main Content</h2>
      <xsl:element name="div">
        <xsl:attribute name="class">
          <xsl:value-of select="$list_class"/>
        </xsl:attribute>
        
        <xsl:call-template name="LoginMsg"/>
        
        <div class="colTable">
          <ul class="row colheader">
            <li class="CollName">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/CollNameSortHref"/>
                </xsl:attribute>
                <xsl:text>Collection Name&#x00A0;</xsl:text>
                <xsl:call-template name="get_sort_arrow">
                  <xsl:with-param name="which_sort" select="'cn'"/>
                </xsl:call-template>
              </xsl:element>
            </li>
            
            <xsl:if test="$debug='1'">
              <xsl:element name="li">
                <xsl:attribute name="class">CollId debug</xsl:attribute>
                <xsl:text>Coll Id</xsl:text>
              </xsl:element>
            </xsl:if>
            
            <li class="Action">Action</li>
            <li class="NoItems">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/NumItemsSortHref"/>
                </xsl:attribute>
                <xsl:text>Items</xsl:text>
                <xsl:call-template name="get_sort_arrow">
                  <xsl:with-param name="which_sort" select="'num'"/>
                </xsl:call-template>
              </xsl:element>
            </li>
            <li class="Access">
              <xsl:element name="a">
                <xsl:attribute name="href">
                  <xsl:value-of select="/MBooksTop/SharedSortHref"/>
                </xsl:attribute>
                <xsl:text>Public</xsl:text>
                <xsl:call-template name="get_sort_arrow">
                  <xsl:with-param name="which_sort" select="'shrd'"/>
                </xsl:call-template>
              </xsl:element>
            </li>
            <li class="Owner">
              <xsl:choose>
                <xsl:when test="$which_list='pubcolls'">
                  <xsl:element name="a">
                    <xsl:attribute name="href">
                      <xsl:value-of select="/MBooksTop/OwnerSortHref"/>
                    </xsl:attribute>
                    <xsl:text>Owner</xsl:text>
                    <xsl:call-template name="get_sort_arrow">
                      <xsl:with-param name="which_sort" select="'own'"/>
                    </xsl:call-template>
                  </xsl:element>
                </xsl:when>
                <xsl:otherwise><xsl:text>Owner</xsl:text></xsl:otherwise>
              </xsl:choose>
            </li>
            <!-- Removed, may revisit <li class="Search">Search</li>-->
            <li class="clr"></li>
          </ul>
          
          <xsl:for-each select="$list_node/Collection">
            <xsl:variable name="CollId">
              <xsl:value-of select="CollId"/>
            </xsl:variable>
            
            <xsl:variable name="row_class">
              <xsl:choose>
                <xsl:when test="(position() mod 2) = 0">
                  <xsl:value-of select="'row roweven'"/>
                </xsl:when>
                <xsl:otherwise>
                  <xsl:value-of select="'row rowodd'"/>
                </xsl:otherwise>
              </xsl:choose>
            </xsl:variable>
            
            <xsl:element name="ul">
              <xsl:attribute name="class">
                <xsl:value-of select="$row_class"/>
                
                <xsl:if test="Owner=$g_user_id">
                  <!-- if user is owner of this collection add css class = owned-->
                  <xsl:text> owned</xsl:text>
                </xsl:if>
              </xsl:attribute>
              
              <xsl:element name="li">
                <xsl:attribute name="class">CollName</xsl:attribute>
                <a>
                  <xsl:attribute name="href">
                    <xsl:text>mb?a=listis;c=</xsl:text>
                    <xsl:value-of select="$CollId"/>
                  </xsl:attribute>
                  <xsl:value-of select="CollName"/>
                </a>
              </xsl:element>
              
              <xsl:if test="$debug='1'">
                <xsl:element name="li">
                  <xsl:attribute name="class">CollId debug</xsl:attribute>
                  <xsl:choose>
                    <xsl:when test="$CollId=''">
                      <xsl:text>not set</xsl:text>
                    </xsl:when>
                    <xsl:otherwise>
                      <xsl:value-of select="$CollId"/>
                    </xsl:otherwise>
                  </xsl:choose>
                </xsl:element>
              </xsl:if>
              
              <xsl:element name="li">
                <xsl:attribute name="class">Action</xsl:attribute>
                
                <xsl:element name="a">
                  <xsl:attribute name="href">
                    <xsl:text>mb?a=listis;c=</xsl:text>
                    <xsl:value-of select="$CollId"/>
                  </xsl:attribute>
                  <xsl:choose>
                    <xsl:when test="Owner=$g_user_id or Owner=/MBooksTop/MBooksGlobals/SessionId" >
                      <xsl:text>view/edit</xsl:text>
                    </xsl:when>
                    <xsl:otherwise><xsl:text>view</xsl:text></xsl:otherwise>
                  </xsl:choose>
                </xsl:element>
                
                <xsl:if test="Owner=$g_user_id or Owner=/MBooksTop/MBooksGlobals/SessionId">
                  <xsl:text>&#x00A0;|&#x00A0;</xsl:text>
                  <xsl:element name="a">
                    <xsl:attribute name="href">
                      <xsl:value-of select="DeleteCollHref"/>
                    </xsl:attribute>
                    <xsl:attribute name="onClick">
                      <xsl:text>return doYouReally(&quot;</xsl:text>
                      <xsl:value-of select="CollName"/>
                      <xsl:text>&quot;)</xsl:text>
                    </xsl:attribute>
                    <xsl:text>delete</xsl:text>
                  </xsl:element>
                </xsl:if>
              </xsl:element>
              
              <xsl:element name="li">
                <xsl:attribute name="class">NoItems</xsl:attribute>
                <xsl:choose>
                  <xsl:when test="NumItems=''">
                    <xsl:text>0</xsl:text>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:value-of select="NumItems"/>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:element>
              
              <xsl:element name="li">
                <xsl:attribute name="class">Access</xsl:attribute>
                <xsl:choose>
                  <xsl:when test="Shared='1'">
                    <xsl:text>yes</xsl:text>
                    <xsl:if test="Owner=$g_user_id" >
                      <xsl:text>&#x00A0;|&#x00A0;</xsl:text>
                      <xsl:element name="a">
                        <xsl:attribute name="href">
                          <xsl:text>mb?a=editst;shrd=0;c=</xsl:text>
                          <xsl:value-of select="$CollId"/>
                          <xsl:text>;colltype=</xsl:text>
                          <!--XXX ask suz, if we are in public coll and make private, should we go to mycolls?-->
                          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']"/>
                        </xsl:attribute>
                        <xsl:text>make private</xsl:text>
                      </xsl:element>
                    </xsl:if>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:text>no</xsl:text>
                    <xsl:if test="Owner=$g_user_id" >
                      <xsl:text>&#x00A0;|&#x00A0;</xsl:text>
                      <xsl:element name="a">
                        <xsl:attribute name="href">
                          <xsl:text>mb?a=editst;shrd=1;c=</xsl:text>
                          <xsl:value-of select="$CollId"/>
                          <xsl:text>;colltype=</xsl:text>
                          <xsl:value-of select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']"/>
                        </xsl:attribute>
                        <xsl:text>make public</xsl:text>
                      </xsl:element>
                    </xsl:if>
                  </xsl:otherwise>
                </xsl:choose>
              </xsl:element>
              
              <!--XXX replace this with better logic in the PIFiller.
              The PIFiller should provide Owner and OwnerString and
              OwnerString should be whatever is in the config file if
              there the owner is a session_id -->
              
              <xsl:element name="li">
                <xsl:attribute name="class">Owner</xsl:attribute>
                <xsl:value-of select="OwnerString"/>                
              </xsl:element>

              <!-- <li class="Search">

                <xsl:choose>
                  <xsl:when test="NumItems='0'"> -->
                    <!--
                         The above is correct code. below is to allow testing of debugging ajax call by
                         searching collections with no items
                         -->
                    <!--<xsl:when test="NumItems=''">  -->
                    <!--<span class="noItems">Add items to collection to make it searchable</span>
                  </xsl:when>
                  <xsl:otherwise>
                    <xsl:call-template name="searchform">
                      <xsl:with-param name="CollId" select="$CollId"/>
                      <xsl:with-param name="pub_priv" select="$pub_priv"/>
                    </xsl:call-template>
                    
                  </xsl:otherwise>
                </xsl:choose>

              </li> -->

              <li class="clr"></li>
            </xsl:element>
            
          </xsl:for-each>
        </div>
        <br class="clr" />
        <div class="footnoteMsg">
          <p>* = abbreviated account names for <a href="http://www.itd.umich.edu/itcsdocs/s4316/">UM Friend guest account</a> users.</p>
        </div>        
      </xsl:element>
    </div>
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
      <input type = "hidden" name="c">
        <xsl:attribute name="value">
          <xsl:value-of select="$CollId"/>
        </xsl:attribute>
      </input>
      <label > 
        <xsl:attribute name="for">
          <xsl:value-of select="$SearchFormId"/>
        </xsl:attribute>
        
        <xsl:call-template name="AllIndexedMsg">
          <xsl:with-param name="AllIndexedStatus">
            <xsl:value-of select= "AllItemsIndexed"/>
            </xsl:with-param>
            <xsl:with-param name="IndexMsg">Not all items indexed</xsl:with-param>
            <xsl:with-param name="IndexMsgClass">IndexMsgListColls</xsl:with-param> 
          </xsl:call-template>
          
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
          Search</button>
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
          <xsl:call-template name="get_page_title"/>
          <xsl:if test= "/MBooksTop/MBooksGlobals/LoggedIn = 'NO' and /MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='colltype']='priv'">
            <xsl:text> (login to save them)</xsl:text>
          </xsl:if>
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
      <xsl:text>HathiTrust Digital Library - </xsl:text>
      <xsl:choose>
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
      </xsl:choose>    
    </xsl:template>
    
  </xsl:stylesheet>
