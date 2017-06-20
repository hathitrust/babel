<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns= "http://www.w3.org/1999/xhtml"
  version="1.0">
  <xsl:output indent="yes"/>
  <!--## Global Variables ##-->

  <xsl:variable name="coll_name">
    <!-- <xsl:value-of select="/MBooksTop/CollectionName"/> -->
    <xsl:text> Full-text Search</xsl:text>
  </xsl:variable>


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
      <xsl:text>True</xsl:text>
    </xsl:if>
  </xsl:variable>

  
  <xsl:variable name="coll_id" select="/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='c']"/>
  <xsl:variable name="isCollSearch">

    <!--    <xsl:if test="(/MBooksTop/MBooksGlobals/CurrentCgi/Param[@name='coll_id']) and (normalize-space($coll_id) != '') ">-->
    
    <xsl:if test="normalize-space($coll_id) != ''">
      <xsl:text>True</xsl:text>
    </xsl:if>
  </xsl:variable>

  <!-- ## end Global Variables ##-->

  <xsl:template name="setup-extra-header">
    <link rel="stylesheet" type="text/css" href="/ls/css/screen.css" />
 
    <!--XXX temporary working kludge, put in SASS after it is working-->
        <link rel="stylesheet" type="text/css" href="/ls/css/ls_advanced.css" />
    <xsl:call-template name="include_local_javascript" />
    <xsl:call-template name="load_js_and_css"/>
  </xsl:template>
  <xsl:template name="setup-body-class" >no-search</xsl:template>


    
    <!-- TEMPLATE -->
    <xsl:template name="subnav_header">
      <xsl:call-template name="HathiCol"/>
    </xsl:template>

  <!-- TEMPLATE -->
  <!--  <xsl:template name="PageContent"> -->
  <xsl:template name="contents">
    <div class="LsAdvancedPageContent">
      <div id="LS_main">
        <div class="betasearch">
          <div class="AdvancedLabelRow">

            <xsl:if test="$isCollSearch != 'True'">
              <span id="AdvancedCatalogLink">
                <xsl:text>Prefer to search words</xsl:text>
                <em> about</em>
                <xsl:text> the items in an</xsl:text>
                <a href="http://catalog.hathitrust.org/Search/Advanced"> Advanced Catalog Search?</a>
              </span>
            </xsl:if>
            <h2 id="advancedLabel">Advanced  Full-text Search
	    <xsl:choose>
	      <xsl:when test="$isCollSearch = 'True'">
		
		<span class="big_coll_name">
		  <xsl:text>in the collection </xsl:text>
      <a href="/cgi/ls?a=srchls;q1=*;c={$coll_id}">
		    <xsl:value-of select="/MBooksTop/AdvancedSearch/COLL_INFO/COLL_NAME"/>
		  </a>
		</span>
		
	      </xsl:when>
	      <xsl:otherwise>
		<xsl:text>:</xsl:text>
	      </xsl:otherwise>
	    </xsl:choose>
	    </h2>
            <!--XXX should be pi but hardcode for now-->
            <div id="AdvancedExplanation">Search information <em>within or about</em> an item</div>
            <!--XXX should probably have a PI instead of being hard-coded-->
            <div id="search_tips">
              <a  href="http://www.hathitrust.org/help_digital_library#SearchTips">Search Tips</a>
            </div>

          
       </div>
          <form id="advanced_searchform" action="ls" name="searchcoll" >
            <fieldset>
              <legend class="offscreen">Search for: </legend>
            
          <div id="queryArea">

        

              <!-- XXX need to change this so it will only add to existing debug values-->
              <!--
              Show relevance data (dev only)  <input type="checkbox" name="debug" value="explain"/>
              -->
              <input type="hidden" name="a" value="srchls" />
	      <xsl:if test="$isCollSearch = 'True' ">
		<input type="hidden" name="c">
		  <xsl:attribute name="value">
		    <xsl:value-of select="$coll_id"/>
		  </xsl:attribute>
		</input>
	      </xsl:if>
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

                    <legend class="offscreen">
                      <xsl:text>group</xsl:text>
                      <xsl:value-of select ="position()"/>
                        <xsl:text> Group of two rows of entry boxes</xsl:text>
                    </legend>



                    <!-- uncomment below for parenthesis-->
                     <div class="parenGroup">
                       <div class="IErow">
                         <!--                         <div class="paren parenLeft IEcell"> -->
                         <div>
                         <xsl:attribute name="class">
                           <xsl:text>parenGroup</xsl:text>
                           <xsl:value-of select="position()"/>
                           <xsl:text> paren parenLeft IEcell</xsl:text>
                         </xsl:attribute>
                         <xsl:text disable-output-escaping="yes">(</xsl:text>
                       </div>
                     
                       <div class="group IEmiddleCell" >
                        
                        <xsl:for-each select="row">
                          <xsl:variable name="rowNum">
                            <xsl:value-of select="@rownum"/>
                          </xsl:variable>
                          
                          <xsl:call-template name="queryRow">
                            <xsl:with-param name="rowNum" select="$rowNum"/>
                          </xsl:call-template>
                        </xsl:for-each>
                      </div>


                      <div>
                         <xsl:attribute name="class">
                           <xsl:text>parenGroup</xsl:text>
                           <xsl:value-of select="position()"/>
                           <xsl:text> paren parenRight IEcell</xsl:text>
                         </xsl:attribute>

                         <xsl:text disable-output-escaping="yes">)</xsl:text> 
                       </div>

                    </div>
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


           <div id="limits" style="margin-top: 0">
             <!-- <br clear="both"></br> -->
             <!-- XXX if logged in add a limit to my institution checkbox
                  TODO: check tab order and other accessibility maybe get ux to help
                  -->


             <xsl:if test="$logged_in = 'YES'">
               <div class="foo">
               <xsl:call-template name="LimitToInstitution"/>
             </div>
             </xsl:if>


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
                <xsl:apply-templates select="AdvancedSearch/yop/yopOptions/*" mode="copy-elements" />
              </select>
              
              <xsl:apply-templates select="AdvancedSearch/yop/span[@id='yopInputs']" mode="copy-elements" />
            </span>
            <div id="yopErrMsg"></div>
            
            <xsl:if test="false and //AdvancedSearch/facets/checkable/facet">
              <div id="checkableFacets" style="margin-top: 1em; font-size: 14px">
                <p>Selected facets:</p>
                <ul>
                  <xsl:for-each select="//AdvancedSearch/facets/checkable/facet">
                    <li>
                      <label>
                        <input type="checkbox" name="facet" value="{@term}:{.}" checked="checked" />
                        <xsl:text> </xsl:text>
                        <xsl:value-of select="@label" />: <xsl:value-of select="." />
                      </label>
                    </li>
                  </xsl:for-each>
                </ul>
              </div>
            </xsl:if>
            
            
            <div id="multiFacets">
              <div class="multiFacets" id="language">
                
                <label for="facet_lang" class="xSearchLabel">Language</label>
                <select multiple="multiple" class="orFacet"  name="facet_lang" id="facet_lang" size="8">
                  <xsl:apply-templates select="AdvancedSearch/facets/language_list/*" mode="copy-elements" />
                </select>
              </div>
              
              <div class="multiFacets" id="format">
                <label for="facet_format" class="xSearchLabel">Limit to Original Format</label>
                
                <select multiple="multiple" name="facet_format" class="orFacet"  id="facet_format"  size="8">
                  <xsl:apply-templates select="AdvancedSearch/facets/formats_list/*" mode="copy-elements" />
                </select>
              </div>

              <xsl:if test="//AdvancedSearch/facets/checkable/facet">
                <div class="multiFacets" id="checkableFacets">
                  <p>Additional facets:</p>
                  <ul>
                    <xsl:for-each select="//AdvancedSearch/facets/checkable/facet">
                      <li>
                        <label>
                          <input type="checkbox" name="facet" value="{@term}:{.}" checked="checked" />
                          <xsl:text> </xsl:text>
                          <strong><xsl:value-of select="@label" /></strong>: <xsl:value-of select="." />
                        </label>
                      </li>
                    </xsl:for-each>
                  </ul>
                </div>
              </xsl:if>

            </div>
          </div><!-- end multiFacets -->
        </fieldset>
        
<div id="findbuttons">
  <button type="submit" class="button" name="srch" id="advanced_button" >
    <span >Search</span>
  </button>
  <a href="" id="reset">Clear/reset</a>
</div>
               <div id="submitErrMsg"></div>
             </form>
             </div>
           </div>
         </div>
     </xsl:template>

     <!-- ###################################################################### -->
     <xsl:template name="LimitToInstitution">
       
             <label for="instLimit">
               <xsl:text>Held by </xsl:text>
               <xsl:value-of select="$inst_name"/>
             </label>
             <input type="checkbox" id="instLimit" name="heldby">
               <xsl:attribute name="value">
                 <xsl:value-of select="$inst_code"/>
               </xsl:attribute>

              <xsl:if test="$limitByInst = 'True'">
                <xsl:attribute name="checked">
                  <xsl:text>checked</xsl:text>
                </xsl:attribute>
              </xsl:if>
            

             </input>

       


     </xsl:template>

     <!-- ###################################################################### -->
     <xsl:template name="andOr">
       <xsl:param name="rowNum"/>
       <xsl:variable name="opNum">
         <xsl:text>op</xsl:text><xsl:value-of select="$rowNum"/>
       </xsl:variable>
       
       <!-- skip first row -->
       <xsl:if test="$rowNum != 1">
         <!--XXX accessability following code should be a template call foobar-->
           <xsl:element name="label" >
             <xsl:attribute name="class">
               <xsl:text>offscreen</xsl:text>
             </xsl:attribute>
             <xsl:attribute name="for">
               <xsl:value-of select="$opNum"/>
             </xsl:attribute>
             <xsl:text>Boolean Operator (AND OR)</xsl:text>
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
         <span class="spacer">
         </span>
       </li>
     </xsl:if>

     <xsl:if test="$rowNum=2 or $rowNum=4 ">
       <li class="col">

         <div class="andOR">           
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
            <xsl:text>offscreen</xsl:text>
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
            <xsl:text>offscreen</xsl:text>
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

  <!--  workaround for empty namespaces in copy-of see:http://dev.ektron.com/kb_article.aspx?id=492#no_namespace -->
  <xsl:template match="*" mode="copy-elements">
    <xsl:element name="{name()}">
      <xsl:apply-templates select="@*|node()" mode="copy-elements"/>
    </xsl:element>
  </xsl:template>

  <xsl:template match="@*|text()|comment()|processing-instruction()" mode="copy-elements">
    <xsl:copy>
      <xsl:apply-templates select="@*|node()"/>
    </xsl:copy>
  </xsl:template>


 <xsl:template name="get-page-title">
    <xsl:text>Full-text Advanced Search</xsl:text>
  </xsl:template>



</xsl:stylesheet>
