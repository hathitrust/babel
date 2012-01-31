<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0">

  <!--## Global Variables ##-->

  <xsl:variable name="coll_name">
    <!-- <xsl:value-of select="/MBooksTop/CollectionName"/> -->
    <xsl:text> Full-text Search</xsl:text>
  </xsl:variable>

  <!-- ## end Global Variables ##-->


  <!-- Main template -->
  <xsl:template match="/MBooksTop">
    <html lang="en" xml:lang="en" xmlns= "http://www.w3.org/1999/xhtml">
      <head>
        <script type="text/javascript" src="//ajax.googleapis.com/ajax/libs/jquery/1.4.4/jquery.min.js"></script>
        <title>Hathi Trust Digital Library - Full-text Search - v3</title>
        <xsl:call-template name="load_js_and_css"/>
        <link rel="stylesheet" type="text/css" href="/ls/web/ls.css" />
      </head>

      <body class="yui-skin-sam" onLoad="initCheckall()">

        <div id="mbMasterContainer">
          <div id="DlpsDev">
            <xsl:value-of select="/MBooksTop/MBooksGlobals/EnvHT_DEV"/>
          </div>

          <div>
            <xsl:copy-of select="/MBooksTop/MBooksGlobals/DebugMessages/*"/>
          </div>

          <xsl:call-template name="header"/>

          <div id="mbContentContainer" class="LsHomePageContainer">
            <h2 class="SkipLink">Main Content</h2>
            <!-- Added: overlay is displayed here -->
            <div id="errormsg">
              <div class="bd"></div>
            </div>
            <xsl:call-template name="PageContent"/>
          </div>
          <xsl:call-template name="footer"/>
        </div>
      </body>
      <script type="text/javascript" src="/ls/js/ls_advanced.js"></script>  

    </html>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="subnav_header">
    <xsl:call-template name="HathiCol"/>
  </xsl:template>

  <!-- TEMPLATE -->
  <xsl:template name="PageContent">
    <div class="LsAdvancedPageContent">
      <div id="LS_main">
        <div class="betasearch">
          <form id="advanced_searchform" action="ls" name="searchcoll" >
            
            <div id="queryArea">
            <h2 id="advancedLabel">Advanced  Full-text Search:</h2>
        
            <table id="queryRows" style="width: auto">
              <!-- XXX need to change this so it will only add to existing debug values-->
              <!--
              Show relevance data (dev only)  <input type="checkbox" name="debug" value="explain"/>
              -->
              <tr>
                <td></td>
                <td>
                  <input type="hidden" name="a" value="srchls" />
                </td>
              </tr>
                <xsl:for-each  select="AdvancedSearch/rows/row">
                  <tr>
                    <xsl:call-template name="queryRow">
                      <xsl:with-param name="rowNum" select="position()"/>
                    </xsl:call-template>
                  </tr>
                </xsl:for-each>
             
                
              </table>
              <div id="queryErrMsg"></div>
              <br/>
            </div>
              <!-- Limit area starts here ############################################   -->
              <div id="limits">
            <h3>Limit To:</h3>

            <!--XXX hardcoded accessability stuff-->
            <label for="fullonly">Full view only</label>        
            <input type="checkbox" value="ft" name="lmt" id="fullonly"/>

            
            
            <span style="margin-left: 4em">
              <label for="yop">Year of publication:  </label>        
                   <select id="yop" name="yop" onchange="changeRange('yop')">
                     <option value="before">Before or during</option>
                     <option value="after" selected="selected" >During or after</option>
                     <option value="between">Between</option>
                     <option value="in">Only during</option>
                   </select>
                   
                   <!-- XXX these boxes need labels for accessability -->
                   <label for="yop-start" class="SearchLabel">Starting Year  </label>        
                   <input class="yop" id="yop-start" type="text" size="4"  name="pdate_start" />
                   <span class="yop" id="yop-between" > and </span>
                   <label for="yop-end" class="SearchLabel">Ending Year</label>        
                   <input class="yop"  id="yop-end" type="text" size="4" name="pdate_end"/>
                   <label for="yop-in" class="SearchLabel">In Year</label>        
                   <input class="yop" id="yop-in" type="text" size="4" name="pdate"/>

                 </span>
                 <div id="yopErrMsg"></div>
                 
                 <table id="multiFacets" class="multiFacets" style="width: auto">
                   <tr>
                     <th>Language: </th>
                     <th>Original Format: </th>
                   </tr>
                   <tr>
                     <td>
                       <xsl:copy-of select="LanguageChunk"/>
                     </td>
                     <td>
                       <xsl:copy-of select="FormatChunk"/>
                     </td>
                   </tr>
                 </table>
               </div>


               
               <button type="submit" name="findbutton" id="srch" >Find</button>

               
               <button type="reset" name="reset" id="reset">Clear/reset</button>
               <div id="submitErrMsg"></div>
             </form>
             </div>
           </div>
         </div>
     </xsl:template>



     <xsl:template name="queryRow">
       <xsl:param name="rowNum"/>
       <xsl:variable name="opNum">
         <xsl:text>op</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>
       <xsl:variable name="fieldNum">
         <xsl:text>field</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>
       <xsl:variable name="qNum">
         <xsl:text>q</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>
       <xsl:variable name="anyallNum">
         <xsl:text>anyall</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>


       <!-- fix to read the row/op entry instead -->       
       <xsl:if test="$rowNum=1">
         <td></td>
       </xsl:if>
       <xsl:if test="$rowNum!=1">
         <td>
           <!-- XXX fix label for this -->

           <!--XXX accessability following code should be a template call-->
           <xsl:element name="label" >
             <xsl:attribute name="class">
               <xsl:text>SearchLabel</xsl:text>
             </xsl:attribute>
             <xsl:attribute name="for">
               <xsl:value-of select="$opNum"/>
             </xsl:attribute>
             <xsl:text>Operator </xsl:text>
           </xsl:element>



           <select class="AndOr">
             <xsl:attribute name="name" >
               <xsl:value-of select="$opNum"/>
             </xsl:attribute>
             <xsl:attribute name="id" >
               <xsl:value-of select="$opNum"/>
             </xsl:attribute>
             <xsl:variable name="op">
               <xsl:value-of select="op"/>
             </xsl:variable>

             <option value="AND" >         
             <xsl:if test="$op  = 'AND'">
               <xsl:attribute name="selected"/>
             </xsl:if>             
             <xsl:text>AND</xsl:text>
             </option>
             
             <option value="OR" >         
             <xsl:if test="$op  = 'OR'">
               <xsl:attribute name="selected"></xsl:attribute>
             </xsl:if>             
             <xsl:text>OR</xsl:text>
             </option>

             <!-- <option value="NOT" >NOT</option> -->
           </select>
         </td>
       </xsl:if>


         <td>
           <xsl:for-each  select="/MBooksTop/AdvancedSearch/AnyAll">
   
             <xsl:call-template name="BuildHtmlSelectCustom">
               <xsl:with-param name="id">
                 <xsl:value-of select="$anyallNum"/>
               </xsl:with-param>
               <xsl:with-param name="class" select="'anyallWidget'"/>
               <xsl:with-param name="selected">
                 <!--XXX need to put this in the xml from a config file somewhere hardcode them all to all for now-->
                 <xsl:value-of select="/MBooksTop/AdvancedSearch/rows/row[$rowNum]/anyall"/>
               </xsl:with-param>
               <xsl:with-param name="name">
                 <xsl:value-of select="$anyallNum"/>
               </xsl:with-param>
               <xsl:with-param name="labelbase">
                 <xsl:text>search precision</xsl:text>
               </xsl:with-param>
               <xsl:with-param name="rowNum">
                 <xsl:value-of select="$rowNum"/>
               </xsl:with-param>


             </xsl:call-template>
           </xsl:for-each>
         </td>

       
       <td>
         <!--XXX replace this by a call to a template -->
         <xsl:element name="label" >
          <xsl:attribute name="class">
            <xsl:text>SearchLabel</xsl:text>
          </xsl:attribute>
          <xsl:attribute name="for">
            <xsl:value-of select="$qNum"/>
          </xsl:attribute>
          <xsl:text>search box </xsl:text>
          <xsl:value-of select="$rowNum"/>
        </xsl:element>


         <input type="text"  size="50" class="querybox" >
           <xsl:attribute name="id">
             <xsl:value-of select="$qNum"/>
           </xsl:attribute>

           <xsl:attribute name="name">
             <xsl:value-of select="$qNum"/>
           </xsl:attribute>
           <xsl:attribute name="value">
             <xsl:value-of select="q"/>             
           </xsl:attribute>

         </input>
       </td>
          
       <td id="in">
         <xsl:text> in </xsl:text>
       </td>
       <td>
         <xsl:for-each  select="/MBooksTop/AdvancedSearch/fieldlist">
             <xsl:call-template name="BuildHtmlSelectCustom">
               <xsl:with-param name="id">
                 <xsl:value-of select="$fieldNum"/>
               </xsl:with-param>
               <xsl:with-param name="class" select="'fieldWidget'"/>
               <!--  <xsl:with-param name="selected" select="AdvancedSearch/rows/row[$rownum]/field"/>-->
               <xsl:with-param name="selected">
                 <xsl:value-of select="/MBooksTop/AdvancedSearch/rows/row[$rowNum]/field"/>
               </xsl:with-param>
               <xsl:with-param name="name">
                 <xsl:value-of select="$fieldNum"/>
               </xsl:with-param>
               <xsl:with-param name="labelbase">
                 <xsl:text>search field</xsl:text>
               </xsl:with-param>
               <xsl:with-param name="rowNum">
                 <xsl:value-of select="$rowNum"/>
               </xsl:with-param>

             </xsl:call-template>
           </xsl:for-each>
       
         </td>

       
     </xsl:template>

     <!--XXX######################################################################-->
     <!-- Overide xsl2htmlutils.xsl because we want to specify selected option as a parameter rather than in the xml
          Talk with phil about whether this should go in the utils-->
          <!--XXX######################################################################-->
  <xsl:template name="BuildHtmlSelectCustom">
    <xsl:param name="id"/>
    <xsl:param name="class"/>
    <xsl:param name="name"/>
    <xsl:param name="selected"/>
    <xsl:param name="key"/>
    <xsl:param name="labelbase"/>
    <xsl:param name="rowNum"/>
    <!-- create main "select" element -->
    <!-- accessability 
         add label for id where?
         -->
    
      <xsl:if test="$labelbase">

        <xsl:element name="label" >
          <xsl:attribute name="class">
            <xsl:text>SearchLabel</xsl:text>
          </xsl:attribute>
          
          <xsl:attribute name="for">
            <xsl:value-of select="$id"/>
          </xsl:attribute>
            <xsl:value-of select="$labelbase"/>
            <xsl:if test="$rowNum">
              <xsl:text> </xsl:text>
              <xsl:value-of select="$rowNum"/>
            </xsl:if>

          </xsl:element>
        

      </xsl:if>



    
    <xsl:element name="select">
      <xsl:attribute name="name">
        <xsl:value-of select="$name"/>
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

      <xsl:for-each select="Option">
        <!-- create "option" element -->
                 
        <xsl:element name="option">
        <xsl:attribute name="value">
           <xsl:value-of select="Value"/>
        </xsl:attribute>
          <xsl:if test="Value = $selected">
            <xsl:attribute name="selected"/>
          </xsl:if>
          <xsl:value-of select="Label"/>
        </xsl:element>

      </xsl:for-each>
    </xsl:element>
  </xsl:template>

</xsl:stylesheet>
