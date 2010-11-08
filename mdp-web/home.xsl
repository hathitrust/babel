<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">
  
  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <xsl:call-template name="include_local_javascript"/>
        <xsl:call-template name="load_js_and_css"/>
        <!-- overide debug style if debug flag is on -->
        <!-- <xsl:call-template name="debug_CSS"/>-->
        <title>HathiTrust Digital Library | Home</title>
      </head>
      
      <body class="yui-skin-sam">
        
        <div id="mbMasterContainer">
          
          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>
          <xsl:call-template name="header"/>
          
          <div id="mbContentContainer" class="mbHomeContainer">
            <div id="homeContent">
              
              <!--Center Column #########################################################-->
              <div id="centercontent">
                
                <xsl:call-template name="LoginMsg"/>
                
                <div id="Content" class="HomeCenterContent">
                  
                  <h2>Welcome! Here's how to get started...</h2>                  
                  
                  <div id="start_1">
                    <span>1</span> Go to
                    <xsl:element name="a">
                      <xsl:attribute name="href">
                        <xsl:value-of select="/MBooksTop/Header/PubCollLink"/>
                      </xsl:attribute>
                      <xsl:attribute name="class">inline</xsl:attribute>
                      <xsl:text>Public Collections</xsl:text>
                    </xsl:element>
                    <xsl:text> to browse other people's collections. Items can be copied into your own personal collection.</xsl:text>
                  </div>
                  
                  <div id="start_or">OR</div>
                  
                  <div id="start_2">
                    <span>2</span>
                    Go to the <a href="http://mirlyn.lib.umich.edu/F/?local_base=hathitrust" class="inline">HathiTrust Digital Library search page</a> in the Mirlyn Library Catalog to find new items. Follow an item's "HathiTrust Digital Library" link to view the item and/or add it to a collection.
                  </div>
                  
                </div>
                
                <div class="clear"></div>
                
                <div id="intro" class="HomeCenterContent">
                  <h2>About the project...</h2>
                  <p>HathiTrust makes the digitized collections of some of the nation’s great research libraries available for all. HathiTrust was initially conceived as a collaboration of the twelve universities of the Committee on Institutional Cooperation to establish a repository for those universities to archive and share their digitized collections.
                  </p>
                  <p>HathiTrust will quickly expand to include additional partners and to provide those partners an easy means to archive their digital content.</p>
                  <p>See the <a href="http://www.hathitrust.org">about page</a> for more information.</p>
                </div>
                
                <div class="clear"></div>
                
                <div id="Blog" class="HomeCenterContent">	
                <h2>What the Digital Library development team is currently working on...</h2>
                
                <h3><span>from our</span> <a href="http://mblog.lib.umich.edu/blt/">Blog for Library Technology</a></h3>
                <!--dynamic content from PIFiller-->
                <xsl:copy-of select="/MBooksTop/Blog"/>
                <span><a href="http://mblog.lib.umich.edu/blt/">read more blog posts</a></span>
              </div>
              
            </div>
            <!-- end of center column div -->
            
            <!--Right Column #########################################################-->
            <div id="rightcontent">
              
              
              <div id="FeaturedItem">
                <h2>Featured Collection</h2>
                <xsl:call-template name="getFeaturedItem"/>
                <div class="clear"></div>
              </div>

              <div id="RecentlyAdded">
                <h2>New and Recently Changed Collections</h2>
                <xsl:call-template name="getRecentlyAdded"/>
                <div class="clear"></div>
              </div>

              <!--<div id="Schedule">
                <h2>Scanning Schedule</h2>
                <ul>
                  <li><strong>Currently scanning:</strong> Hatcher Graduate Library
                  <br/>More details about the <a href="http://www.lib.umich.edu/grad/mdpprogress.html">Hatcher Scanning Schedule</a></li>
                  <li><strong>Summer 2008:</strong> Dentistry Library and Taubman Medical Library monographs</li>
                  <li><strong>Fall 2008:</strong> More Hatcher Graduate Library</li>
                  <li><strong>Scanning completed:</strong> The Social Work Library, the Art, Architecture and Engineering Library, and large portions of the Buhr Remote Shelving Facility</li>
                </ul>
              </div>-->
                            
              <div id="MBooksNews">
                <h2>News &amp; Announcements</h2>
                <span class="UInote">This can probably use the updates RSS from the drupal site but I can't set it up until that's working and in production...</span>
                <!--<ul>
                  <li><span class="survey"><a href="http://www.lib.umich.edu/survey/public/survey.php?name=MBooksCB_1">Help us improve the HathiTrust Digital Library, take our survey!</a></span></li>
                  <li>University of Michigan and Indiana University create a multi-institutional repository. More details available via Indiana University's <a href="http://uits.iu.edu/scripts/ose.cgi?awac.ose.help">Shared Digital Repository project page</a>.</li>
                  <li>The UM Library marked the occasion of its millionth book online. <a href="http://www.lib.umich.edu/news/millionth.html">Read more about the millionth book</a>.</li>
                  <li>&gt; <a href="http://www.lib.umich.edu/mdp/resources.html">See full list of MDP related news and resources</a></li>
                </ul>-->
              </div>
              
              <div id="blogLinks">
                <h2>See Also</h2>
                <ul>
                  <li><a href="http://books.google.com/googlebooks/partners.html">Google Book Search Partners</a></li>
                  <li>
                    <a>
                      <xsl:attribute name="href">
                        <xsl:value-of select="/MBooksTop/Header/HelpLink"/>
                      </xsl:attribute>
                      <xsl:attribute name="title">
                        <xsl:text>Help page and faq</xsl:text>
                      </xsl:attribute>
                      <xsl:text>HathiTrust Help &amp; FAQ</xsl:text>
                    </a>
                  </li>
                  <li><a href="http://www.lib.umich.edu/mdp/MBooksFlowchart.pdf">UM's MDP Project Workflow Chart</a></li>
                  <li><a href="http://www.lib.umich.edu/policies/takedown.html" title="item removal policy">Take-Down Policy</a></li>
                  <li><a href="http://en.wikipedia.org/wiki/HathiTrust" title="Hathi Trust wikipedia article">Hathi Trust wikipedia article</a></li>
                </ul>
              </div>
              
            </div>
            <!-- end of rightcontent div-->
            
          </div> 
          <!-- end of homeContainer div-->
          
        </div>
        
        <xsl:call-template name="footer"/>
        
      </div>
    </body>
  </html>
</xsl:template>

<xsl:template name="subnav_header">
  <h1>Home Page</h1>
</xsl:template>


   <xsl:template name="getRecentlyAdded">
     <ul>
       <xsl:for-each select="/MBooksTop/RecentlyAdded/Item">
         <li>
           <xsl:element name="a">
             <xsl:attribute name="href">
               <xsl:value-of select="Href"/>
             </xsl:attribute>
             <xsl:value-of select="Name"/>             
           </xsl:element>
         </li>
       </xsl:for-each>
     </ul>
   </xsl:template>

<xsl:template name="getFeaturedItem">
  
  <xsl:variable name="tempSelectedItemPos">
    <xsl:value-of select="/MBooksTop/FeaturedItemPos"/>
  </xsl:variable>
  <xsl:variable name="numItems">
    <xsl:value-of select="count(/MBooksTop/FeaturedItem/Item)"/>      
  </xsl:variable>
  <xsl:variable name="selectedItemPos">
    <xsl:choose>
      <xsl:when test="$tempSelectedItemPos &lt; $numItems +1">
        <xsl:value-of select="$tempSelectedItemPos"/>
      </xsl:when>
      <xsl:otherwise>1</xsl:otherwise>
    </xsl:choose>
  </xsl:variable>
  <!--
       <xsl:text>debug selectedItemPos is </xsl:text>
       <xsl:value-of select="$selectedItemPos"/>
       <xsl:text>
       </xsl:text>
       <xsl:text>tempSelectedItemPos is </xsl:text>
       <xsl:value-of select="$tempSelectedItemPos"/>
       -->
       
       <xsl:copy-of select="/MBooksTop/FeaturedItem/Item[position()=$selectedItemPos]"/>
     </xsl:template>
     
   </xsl:stylesheet>
   
