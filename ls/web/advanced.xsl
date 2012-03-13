<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"

  version="1.0">
  <xsl:output indent="yes"/>
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
          <xsl:call-template name="google_analytics" />
        </div>
        <script type="text/javascript" src="/ls/js/ls_advanced.js"></script>  
      </body>
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
          <h2 id="advancedLabel">Advanced  Full-text Search:</h2>
          <form id="advanced_searchform" action="ls" name="searchcoll" >
            <fieldset>
              <legend class="SkipLink">Search for: </legend>
            <div id="queryArea">
       
        

              <!-- XXX need to change this so it will only add to existing debug values-->
              <!--
              Show relevance data (dev only)  <input type="checkbox" name="debug" value="explain"/>
              -->
                  <input type="hidden" name="a" value="srchls" />

              <!--XXX lets start by converting the query rows from a table to css and then do the rest-->

                <xsl:for-each select="AdvancedSearch/groups/group">
                  
                  <!-- insert an and widget here if this is row 3 -->
                  <!-- XXX this is lame, what is the correct way to pass the context without misusing a foreach? -->
                  <!--                  <xsl:for-each select="row[@rownum ='3']">-->
                  <xsl:for-each select="row[@rownum='3']">
                    <a href="_blank" id="addGroup">+ Add a pair of search fields</a>
                       <div class="andOR">
                          <xsl:call-template name="andOr">
                            <xsl:with-param name="rowNum" select="3"/>
                          </xsl:call-template>
                        </div>
                  </xsl:for-each>
                 
               
                  <fieldset class="group">
                    <xsl:attribute name="id">
                      <xsl:text>fieldsetGroup</xsl:text>
                      <xsl:value-of select ="position()"/>
                    </xsl:attribute>

                    <legend class="SkipLink">
                      <xsl:text>group</xsl:text>
                      <xsl:value-of select ="position()"/>
                        <xsl:text> Group of two rows of entry boxes</xsl:text>
                    </legend>


                    <!-- uncomment below for parenthesis-->
                     <div class="parenGroup">

                       <div class="paren parenLeft"> 
                       <xsl:text disable-output-escaping="yes">  &amp;nbsp;( &amp;nbsp;</xsl:text>
                     </div>
                     
                      <div class="group">
                      
                        <!--                    <xsl:attribute name="id">
                      <xsl:text>group</xsl:text>
                      <xsl:value-of select ="position()"/>
                    </xsl:attribute> -->


                    <xsl:for-each select="row">
                      <xsl:variable name="rowNum">
                        <xsl:value-of select="@rownum"/>
                      </xsl:variable>
                      
                    <xsl:call-template name="queryRow">
                      <xsl:with-param name="rowNum" select="$rowNum"/>
                    </xsl:call-template>
                  </xsl:for-each>
                  </div>
                  <div class="paren parenRight"><xsl:text disable-output-escaping="yes">  &amp;nbsp;) &amp;nbsp;</xsl:text> </div>
                      

                    </div>
                  </fieldset> 

                <xsl:for-each select="row[@rownum='4']">
                  <a href="_blank" id="removeGroup">- Remove this pair of search fields</a>
                </xsl:for-each>
                
              </xsl:for-each>
                

              <div id="queryErrMsg"></div>
              <br/>
              </div> 
          </fieldset>
              <!-- Limit area starts here ############################################   -->
            
            <fieldset class="limits">
              <legend class="limitTo">Limit to: </legend>


           <div id="limits">

            <!--XXX hardcoded accessability stuff-->
            <label for="fullonly" >Full view only</label>        
            <input type="checkbox"  name="lmt" id="fullonly"  value='ft'>
              <xsl:if test="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='lmt']='ft'">
                <xsl:attribute name="checked">
                  <xsl:text>checked</xsl:text>
                </xsl:attribute>
              </xsl:if>
            </input>

            
            
            <span style="margin-left: 4em">
              <label for="yop">Year of publication:  </label>        
              <select id="yop" name="yop" onchange="changeRange('yop')"  >
                <xsl:copy-of select="AdvancedSearch/yop/yopOptions/*" />
              </select>
              
              <xsl:copy-of select="AdvancedSearch/yop/span[@name='yopInputs']"/>
              
            </span>
            <div id="yopErrMsg"></div>
            
            
            
            <div id="multiFacets">
              <div class="multiFacets" id="language">
                
                <label for="facet_lang" class="xSearchLabel">Language</label>
                <select multiple="multiple" class="orFacet"  name="facet_lang" id="facet_lang" size="8">
                  <xsl:copy-of select="AdvancedSearch/facets/language_list/*"/>
                </select>
              </div>
              
              <div class="multiFacets" id="format">
                <label for="facet_format" class="xSearchLabel">Limit to Original Format</label>
                
                <select multiple="multiple" name="facet_format" class="orFacet"  id="facet_format"  size="8">
                  <xsl:copy-of select="AdvancedSearch/facets/formats_list/*"/>
                </select>
              </div>
            </div>
          </div><!-- end multiFacets -->
        </fieldset>
        
<div id="findbuttons">
               <!-- <button type="reset" name="reset" id="reset">Clear/reset</button>-->
               <a href="" id="reset">Clear/reset</a>
               <button type="submit" name="srch" id="srch" >Find</button>
             </div>
               <div id="submitErrMsg"></div>
             </form>
             </div>
           </div>
         </div>
     </xsl:template>

     <!-- ###################################################################### -->
     <xsl:template name="andOr">
       <xsl:param name="rowNum"/>
       <xsl:variable name="opNum">
         <xsl:text>op</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>
       
       <!-- skip first row -->
       <xsl:if test="$rowNum != 1">

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
   
 </xsl:if>   
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

    

   <div class="advrow">

   <ul class="advrow">
     <!-- fix to read the row/op entry instead -->       

     <!--XXX lose the parens for now
     <xsl:if test="$rowNum = 1 or $rowNum =3">
       <li>
       <span class="p">
         <xsl:text> ( </xsl:text>
       </span>
       </li>
     </xsl:if>
     -->

     <xsl:if test="$rowNum=1 or  $rowNum = 3" >
       <li class="col">
         <div class="spacer"></div>
       </li>
     </xsl:if>

     <xsl:if test="$rowNum=2 or $rowNum=4 ">
       <li class="col">
         <!--XXX accessability following code should be a template call-->
         <div class="andOR">
           <xsl:element name="label" >
             <xsl:attribute name="class">
               <xsl:text>SearchLabel</xsl:text>
             </xsl:attribute>
             <xsl:attribute name="for">
               <xsl:value-of select="$opNum"/>
             </xsl:attribute>
             <xsl:text>Operator </xsl:text>
           </xsl:element>
           
           <xsl:call-template name="andOr">
             <xsl:with-param name="rowNum" select="$rowNum"/>
           </xsl:call-template>
         </div>
       </li>
     </xsl:if>
     
     
     <li class="col">
       <xsl:for-each  select="/MBooksTop/AdvancedSearch/AnyAll">
         <xsl:call-template name="BuildHtmlSelectCustom">
           <xsl:with-param name="id">
             <xsl:value-of select="$anyallNum"/>
           </xsl:with-param>
           <xsl:with-param name="class" select="'anyallWidget'"/>
           <xsl:with-param name="selected">
             <!--XXX need to put this in the xml from a config file somewhere hardcode them all to all for now-->
             <xsl:value-of select="/MBooksTop/AdvancedSearch/groups/group/row[@rownum=$rowNum]/anyall"/>
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
         </li>

       
       <li class="col">
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


         <input type="text"   class="querybox" >
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
       </li>
          
       <li class="in">
         <xsl:text> in </xsl:text>
       </li>
       <li class="col">
         <xsl:for-each  select="/MBooksTop/AdvancedSearch/fieldlist">
             <xsl:call-template name="BuildHtmlSelectCustom">
               <xsl:with-param name="id">
                 <xsl:value-of select="$fieldNum"/>
               </xsl:with-param>
               <xsl:with-param name="class" select="'fieldWidget'"/>
               <!--  <xsl:with-param name="selected" select="AdvancedSearch/rows/row[$rownum]/field"/>-->
               <xsl:with-param name="selected">
                 <xsl:value-of select="/MBooksTop/AdvancedSearch/groups/group/row[@rownum=$rowNum]/field"/>
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
       
         </li>
         <!-- XXX lose the parens for now
     <xsl:if test="$rowNum = 2 or $rowNum =4">
       <li>
       <span class="p">
         <xsl:text>  ) </xsl:text>
       </span>
       </li>
     </xsl:if>
     -->

       </ul>
     </div>
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
