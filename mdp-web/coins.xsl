<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:template name="marc2coins">
    <!-- derived from record-html.xsl from vufind source code -->

    <xsl:variable name="format" select="fixfield[@id='FMT']" />

    <xsl:choose>
      <xsl:when test="$format = 'BK'">
        <!-- book -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook&amp;</xsl:text>
            <!-- <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text> -->
            <xsl:text>rft.genre=book&amp;</xsl:text>

            <xsl:text>rft.btitle=</xsl:text>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='a']"/>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='a']"/>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.au=</xsl:text>
            <xsl:value-of select="varfield[@id=100]/subfield[@label='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="varfield[@id=260]/subfield[@label='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.pub=</xsl:text>
            <xsl:value-of select="varfield[@id=260]/subfield[@label='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.edition=</xsl:text>
            <xsl:value-of select="varfield[@id=250]/subfield[@label='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="varfield[@id='MDP']/subfield[@label='u']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.isbn=</xsl:text>
            <xsl:value-of select="substring(varfield[@id=020]/subfield[@label='a'], 0, 10)"/>
          </xsl:attribute>
        </span>
      </xsl:when>

      <xsl:when test="$format = 'SE'">
        <!-- journal/serial -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Ajournal&amp;</xsl:text>
            <!-- <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text> -->
            <xsl:text>rft.genre=article&amp;</xsl:text>

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='a']"/>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.au=</xsl:text>
            <xsl:value-of select="varfield[@id=100]/subfield[@label='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="varfield[@id=260]/subfield[@label='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="varfield[@id='MDP']/subfield[@label='u']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.issn=</xsl:text>
            <xsl:value-of select="varfield[@id=022]/subfield[@label='a']"/>
          </xsl:attribute>
        </span>
      </xsl:when>

      <xsl:otherwise>
        <!-- other or unknown -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Adc&amp;</xsl:text>
            <!-- <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text> -->

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='a']"/>
            <xsl:value-of select="varfield[@id=245]/subfield[@label='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:choose>
              <xsl:when test="varfield[@id=100]">
                <xsl:text>rft.creator=</xsl:text>
                <xsl:value-of select="varfield[@id=100]/subfield[@label='a']"/>
                <xsl:text>&amp;</xsl:text>
              </xsl:when>
              <xsl:when test="varfield[@id=700]">
                <xsl:for-each select="varfield[@id=700]">
                  <xsl:text>rft.creator=</xsl:text>
                  <xsl:value-of select="./subfield[@label='a']"/>
                  <xsl:text>&amp;</xsl:text>
                </xsl:for-each>
              </xsl:when>
            </xsl:choose>

            <xsl:for-each select="varfield[@id=650]">
              <xsl:text>rft.subject=</xsl:text>
              <xsl:value-of select="./subfield[@label='a']"/>
              <xsl:text>&amp;</xsl:text>
            </xsl:for-each>

            <xsl:text>rft.description=</xsl:text>
            <xsl:value-of select="varfield[@id=500]/subfield[@label='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.publisher=</xsl:text>
            <xsl:value-of select="varfield[@id=260]/subfield[@label='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="varfield[@id=260]/subfield[@label='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="varfield[@id='MDP']/subfield[@label='u']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.format=</xsl:text>
            <xsl:value-of select="$format"/>
          </xsl:attribute>
        </span>
      </xsl:otherwise>
    </xsl:choose>
  </xsl:template>

  <xsl:template name="collItem2coins">
    <!-- place holder for adding COinS to the collection builder list -->
    <span class="Z3988">
      <xsl:attribute name="title">
        <xsl:text>ctx_ver=Z39.88-2004</xsl:text>
        <xsl:text>&amp;rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook</xsl:text>

        <xsl:text>&amp;rft.title=</xsl:text><xsl:value-of select="./Title" />
        <xsl:text>&amp;rft.year=</xsl:text><xsl:value-of select="./Date" />

        <xsl:variable name="author" select="./Author" />
        <xsl:text>&amp;rft.au=</xsl:text><xsl:value-of select="substring-before($author, ',')" />

        <xsl:variable name="PtHref" select="./PtHref" />
        <xsl:variable name="id"     select='substring-after($PtHref,"=")'/>
        <xsl:text>&amp;rft_id=http://hdl.handle.net/2027/</xsl:text><xsl:value-of select="$id" />
      </xsl:attribute>
    </span>
  </xsl:template>

  <xsl:template name="tei2coins">
    <!-- THIS IS NOT COMPLETE. Just a start of getting the TEI encoded records that 
          are in the HathiTrust right not to have COinS. -->
    <span class="Z3988">
      <xsl:attribute name="title">
        <xsl:text>ctx_ver=Z39.88-2004</xsl:text>
        <!-- <xsl:text>rft_val_fmt=info%3Aofi%2Ffmt%3Akev%3Amtx%3Abook&amp;</xsl:text> -->
        <xsl:text>&amp;rfr_id=info:sid/hathitrust.org</xsl:text>

        <xsl:text>&amp;rft.au=</xsl:text><xsl:value-of select="FILEDESC/SOURCEDESC/BIBLFULL/TITLESTMT/AUTHOR[1]" />

        <!-- rft.spage, rft.epage
        <xsl:variable name="pages" select="FILEDESC/SOURCEDESC/BIBLFULL/BIBLSCOPE[@TYPE = 'pages']" />
        <xsl:if test="not($pages = '')">
          <xsl:variable name="spage" select="substring-before($pages, '-')" />
          <xsl:variable name="epage" select="substring-after($pages,  '-')" />
    
          <xsl:if test="not($spage = '')">
            <xsl:text>&amp;rft.spage=</xsl:text><xsl:value-of select="$spage" />
          </xsl:if>
          <xsl:if test="not($epage = '')">
            <xsl:text>&amp;rft.epage=</xsl:text><xsl:value-of select="$epage" />
          </xsl:if>
        </xsl:if>
        -->

        <!-- rft.volume
        <xsl:if test="FILEDESC/SOURCEDESC/BIBLFULL/BIBLSCOPE[@TYPE = 'volume']">
          <xsl:text>&amp;rft.volume=</xsl:text><xsl:value-of select="FILEDESC/SOURCEDESC/BIBLFULL/BIBLSCOPE[@TYPE = 'volume']" />
        </xsl:if>
        -->

        <!-- rft.year -->
        <xsl:variable name="date" select="FILEDESC/SOURCEDESC/BIBLFULL/PUBLICATIONSTMT/DATE" />
        <xsl:if test="$date">
          <xsl:variable name='year' select='substring($date, 1, 4 )' />
    
          <xsl:choose>
            <xsl:when test="not(string(number($year)) = 'NaN')">
              <xsl:text>&amp;rft.year=</xsl:text><xsl:value-of select="$year" />
            </xsl:when>
            <xsl:otherwise>
              <xsl:variable name='len' select='string-length($date)' />
              <xsl:variable name='yr'  select='substring($date, ($len - 3), $len)' />
              <xsl:if test="not(string(number($yr)) = 'NaN')">
                <xsl:text>&amp;rft.year=</xsl:text><xsl:value-of select="$yr" />
              </xsl:if>
            </xsl:otherwise>
          </xsl:choose>
        </xsl:if>
    
        <xsl:text>&amp;rft.isbn=</xsl:text><xsl:value-of select="FILEDESC/PUBLICATIONSTMT/IDNO[@TYPE = 'isbn']" />
        <xsl:text>&amp;rft.issn=</xsl:text><xsl:value-of select="FILEDESC/PUBLICATIONSTMT/IDNO[@TYPE = 'issn']" />
    
        <!--
        <xsl:text>&amp;rft.genre=article</xsl:text>
        <xsl:text>&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:journal</xsl:text>
        -->
    
        <xsl:text>&amp;rft.genre=book</xsl:text>
        <xsl:text>&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:book</xsl:text>
    
        <xsl:text>&amp;rft.title=</xsl:text><xsl:value-of select="FILEDESC/TITLESTMT/TITLE[@TYPE = '245']" />

        <xsl:text>&amp;rft.pub=</xsl:text><xsl:value-of select="FILEDESC/PUBLICATIONSTMT/PUBLISHER" />
        <xsl:text>&amp;rft.place=</xsl:text><xsl:value-of select="FILEDESC/PUBLICATIONSTMT/PUBPLACE" />

      </xsl:attribute>
    </span>
  </xsl:template>

</xsl:stylesheet>

