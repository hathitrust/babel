<?xml version="1.0" encoding="UTF-8" ?>

<xsl:stylesheet version="1.0"
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns:METS="http://www.loc.gov/METS/"
  >

  <xsl:import href="../searchresults.xsl"/>
  
 
 

<!-- Results -->
<xsl:template name="ResultsContainer">
    <xsl:param name="pSearchTerms"/>
    <xsl:param name="pSearchHits"/>
    <xsl:param name="pSearchResults"/>
 	
 	<xsl:element name="div">
	<xsl:attribute name="id">mdpResultsContainer</xsl:attribute>
	<xsl:attribute name="totalpages"><xsl:value-of select="$pSearchHits"/></xsl:attribute>
  <!--  <div id="mdpResultsContainer" > -->

         <xsl:call-template name="BuildSearchSummary">
              <xsl:with-param name="ppSearchTerms" select="$pSearchTerms"/>
              <xsl:with-param name="ppSearchHits" select="$pSearchHits"/>
         </xsl:call-template>

         <xsl:if test="$pSearchHits > 0">
              <xsl:choose>
                   <xsl:when test="$gFinalAccessStatus='needlogin'">
                        <div class="mdpSearchSummary">
                             <span>
                			      <span class="mdpEmp">Note:</span> detailed search results are not shown for restricted items.  Results may be available if you login.
              				 </span>
            			</div>
          		   </xsl:when>
              	   
              
        	  </xsl:choose>

        	  <ul id="mdpOuterList">
          		   <xsl:for-each select="$pSearchResults/Page">
          		     
          		     	<xsl:variable name="pageLink">
          		     		<xsl:value-of select="Link"/>
          		     	</xsl:variable>
          		     	
                        <xsl:variable name="pageLabel">
              			<xsl:choose>
                			 <xsl:when test="$gHasPageNumbers='true'">
                  				  <xsl:choose>
                    				   <xsl:when test="PageNumber=''">
                      					    <xsl:text>unnumbered page</xsl:text>
                    				   </xsl:when>
                    			  <xsl:otherwise>
                      					<xsl:text>p.</xsl:text>
                      			        <xsl:value-of select="PageNumber"/>
                    			  </xsl:otherwise>
                  				  </xsl:choose>
                		 	 </xsl:when>
                		<xsl:otherwise>
                  			 <xsl:text>sequence #</xsl:text>
                  			 <xsl:value-of select="Sequence"/>
                		</xsl:otherwise>
              			</xsl:choose>
            			</xsl:variable>
            			
                     <xsl:for-each select="Kwic">
            			<li>

              			     <xsl:choose>
                			 <xsl:when test="$gFinalAccessStatus='allow'">
                			        <xsl:element name="a">
                    			  		<xsl:attribute name="href"> 
                      			  			<xsl:value-of select="$pageLink"/>
                    			  		</xsl:attribute>
                    			  	</xsl:element>
                    			  	
                			 	<div class="resulttext">
                  			      <!-- <xsl:element name="a"> -->
                    			  <!--     <xsl:attribute name="href"> -->
                      					    <!--<xsl:value-of select="Link"/>-->
                      			  <!--		    <xsl:value-of select="$pageLink"/> -->
                    			  <!--	   </xsl:attribute> -->
									   <xsl:element name="span">
									   		<xsl:attribute name="class">srpagenumber</xsl:attribute>
                    				        <xsl:value-of select="$pageLabel"/>
                    				   </xsl:element>
                    				   <!--
		              						<xsl:element name="span">
		                					     <xsl:attribute name="class">mdpHitCount</xsl:attribute>
		                						 <xsl:text>&#xa0;-&#xa0;</xsl:text>
		                					     <xsl:value-of select="Hits"/>
		                						 <xsl:choose>
		                  						 <xsl:when test="Hits > 1">
		                    					 <xsl:text>&#xa0;matching terms</xsl:text>
		                  						 </xsl:when>
		                  						 <xsl:otherwise>
		                    					 <xsl:text>&#xa0;matching term</xsl:text>
		                  						 </xsl:otherwise>
		                						 </xsl:choose>
		                						 <xsl:text>&#xa0;</xsl:text>
		              					    </xsl:element>
		              				   -->
		              
		              <span>&#x2026;<xsl:apply-templates select="."/>&#x2026;</span>
		              <!--
		                            <xsl:if test="$gFinalAccessStatus='allow'">
		                <ul class="mdpInnerList">
		                  <xsl:for-each select="Kwic">
		                    <li>&#x2026;<xsl:apply-templates select="."/>&#x2026;</li>
		                    
		                  </xsl:for-each>
		                </ul>
		              </xsl:if>
                  	  -->
                  					</div>

                  				  <!--   </xsl:element> -->
                			 </xsl:when>
                		 	 <xsl:otherwise>
                  			 	  <xsl:value-of select="$pageLabel"/>
                			 </xsl:otherwise>
              				 </xsl:choose>
            		  	</li>
            	     </xsl:for-each>
          		   </xsl:for-each>
        	  </ul>
        	  
        	  <button id='moreresults' >More Results</button>
        	  <!-- style='display:none' -->
         </xsl:if>
         <!--
         <xsl:if test="$pSearchHits > 0">
              <xsl:call-template name="BuildFisheyeTable"/>
         </xsl:if>
         -->
    <!--</div>-->
    	
    </xsl:element>
</xsl:template>



<xsl:template name="BuildSearchSummary">
    <xsl:param name="ppSearchTerms"/>
    <xsl:param name="ppSearchHits"/>

    <xsl:variable name="numTerms">
         <xsl:value-of select="count($ppSearchTerms/Term)"/>
    </xsl:variable>

    <xsl:variable name="separator">
         <xsl:choose>
              <xsl:when test="$numTerms > 1">
                   <xsl:text>, </xsl:text>
              </xsl:when>
              <xsl:otherwise></xsl:otherwise>
         </xsl:choose>
    </xsl:variable>

    <xsl:variable name="vNatLangQuery">
         <xsl:for-each select="$ppSearchTerms/Term">
              <xsl:choose>
                   <xsl:when test="contains(., ' ')">
                        <xsl:text>"</xsl:text><xsl:value-of select="."/><xsl:text>"</xsl:text>
                   </xsl:when>
                   <xsl:otherwise>
                        <xsl:value-of select="."/><xsl:text> </xsl:text>
                   </xsl:otherwise>
              </xsl:choose>
              <xsl:if test="position()!=last()">
                   <xsl:value-of select="$separator"/>
              </xsl:if>
         </xsl:for-each>
    </xsl:variable>
    
    
    <div class="mdpSearchSummary">
         <xsl:if test="$gFinalAccessStatus!='allow'">
              <xsl:element name="div">
<!--          <xsl:attribute name="id">mdpTextDeny</xsl:attribute> -->
                   <p class="centertext">Full view is not available for this item <br/>due to copyright &#169; restrictions. </p>
                   <p class="centertext"><img src="//common-web/graphics/LimitedLink.png" alt=""/></p>
              </xsl:element>
         </xsl:if>

         <xsl:variable name="page_string">
              <xsl:choose>
                   <xsl:when test="$ppSearchHits > 1">
                        <xsl:text> pages in this item.</xsl:text>
                   </xsl:when>
                   <xsl:otherwise>
                        <xsl:text> page in this item.</xsl:text>
                   </xsl:otherwise>
              </xsl:choose>
         </xsl:variable>

         <xsl:variable name="query_explanation">
              <xsl:choose>
                   <xsl:when test="/MBooksTop/MdpApp/SearchSummary/QueryType='OR'">
                        <span class="mdpEmp">Note:</span> No page contained all of your search terms.  Results are for pages containing <span class="mdpEmp">at least one</span> of your terms.
                   </xsl:when>
                   <xsl:otherwise></xsl:otherwise>
                   </xsl:choose>
         </xsl:variable>
        
        <span>
             <xsl:choose>
             <xsl:when test="$ppSearchHits > 0">
                   <xsl:text>Your search for the </xsl:text>
                   <xsl:choose>
                   <xsl:when test="$numTerms > 1">
                        <xsl:text>terms: </xsl:text>
                   </xsl:when>
                   <xsl:otherwise>
                        <xsl:text>term: </xsl:text>
                   </xsl:otherwise>
                   </xsl:choose>
                   <span class="mdpEmp">
                        <xsl:value-of select="$vNatLangQuery"/>
                   </span>
                   <xsl:text> matched </xsl:text>
                   <span class="mdpEmp">
                        <xsl:value-of select="$ppSearchHits"/>
                   </span>
                   <xsl:value-of select="$page_string"/>
                   <!--<span class="smallMessage">-->
                   <span>
                        <xsl:copy-of select="$query_explanation"/>
                  </span>
             </xsl:when>
             <xsl:otherwise>
                   <span class="mdpEmp">&#x25b8;&#xa0;No </span>
                   <xsl:text>pages matched your search for </xsl:text>
                   <span class="mdpEmp">
                        <xsl:value-of select="$vNatLangQuery"/>
                   </span>
                   <xsl:text> in this item.</xsl:text>
             </xsl:otherwise>
             </xsl:choose>
         </span>
    </div>

    <!-- <xsl:call-template name="backToBeginning" /> -->
    <!--
    <xsl:if test="$ppSearchHits > 0">
         <xsl:call-template name="BuildFisheyeTable"/>
    </xsl:if>
    -->
</xsl:template>

</xsl:stylesheet>

