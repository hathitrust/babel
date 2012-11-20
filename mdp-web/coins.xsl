<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" 
  xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  xmlns="http://www.w3.org/1999/xhtml"
  >

  <xsl:template name="marc2coins">
    <!-- derived from record-html.xsl from vufind source code -->

    <xsl:variable name="format" select="$gItemFormat" />

    <xsl:choose>
      <xsl:when test="$format = 'BK'">
        <!-- book -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info:ofi/fmt:kev:mtx:book&amp;</xsl:text>
            <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text>
            <xsl:text>rft.genre=book&amp;</xsl:text>

            <xsl:text>rft.btitle=</xsl:text>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.au=</xsl:text>
            <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.pub=</xsl:text>
            <xsl:value-of select="datafield[@tag=260]/subfield[@code='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.edition=</xsl:text>
            <xsl:value-of select="datafield[@tag=250]/subfield[@code='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft_id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="$gHtId"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.isbn=</xsl:text>
            <xsl:value-of select="substring(datafield[@tag=020]/subfield[@code='a'], 0, 10)"/>
          </xsl:attribute>
        </span>
      </xsl:when>

      <xsl:when test="$format = 'SE'">
        <!-- journal/serial -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info:ofi/fmt:kev:mtx:journal&amp;</xsl:text>
            <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text>
            <xsl:text>rft.genre=article&amp;</xsl:text>

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.au=</xsl:text>
            <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft_id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="$gHtId"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.issn=</xsl:text>
            <xsl:value-of select="datafield[@tag=022]/subfield[@code='a']"/>
          </xsl:attribute>
        </span>
      </xsl:when>

      <xsl:otherwise>
        <!-- other or unknown -->
        <span class="Z3988">
          <xsl:attribute name="title">
            <xsl:text>ctx_ver=Z39.88-2004&amp;</xsl:text>
            <xsl:text>rft_val_fmt=info:ofi/fmt:kev:mtx:dc&amp;</xsl:text>
            <xsl:text>rfr_id=info:sid/hathitrust.org&amp;</xsl:text>

            <xsl:text>rft.title=</xsl:text>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='a']"/>
            <xsl:value-of select="datafield[@tag=245]/subfield[@code='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:choose>
              <xsl:when test="datafield[@tag=100]">
                <xsl:text>rft.creator=</xsl:text>
                <xsl:value-of select="datafield[@tag=100]/subfield[@code='a']"/>
                <xsl:text>&amp;</xsl:text>
              </xsl:when>
              <xsl:when test="datafield[@tag=700]">
                <xsl:for-each select="datafield[@tag=700]">
                  <xsl:text>rft.creator=</xsl:text>
                  <xsl:value-of select="./subfield[@code='a']"/>
                  <xsl:text>&amp;</xsl:text>
                </xsl:for-each>
              </xsl:when>
            </xsl:choose>

            <xsl:for-each select="datafield[@tag=650]">
              <xsl:text>rft.subject=</xsl:text>
              <xsl:value-of select="./subfield[@code='a']"/>
              <xsl:text>&amp;</xsl:text>
            </xsl:for-each>

            <xsl:text>rft.description=</xsl:text>
            <xsl:value-of select="datafield[@tag=500]/subfield[@code='a']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.publisher=</xsl:text>
            <xsl:value-of select="datafield[@tag=260]/subfield[@code='b']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft.date=</xsl:text>
            <xsl:value-of select="datafield[@tag=260]/subfield[@code='c']"/>
            <xsl:text>&amp;</xsl:text>

            <xsl:text>rft_id=http://hdl.handle.net/2027/</xsl:text>
            <xsl:value-of select="$gHtId"/>
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
        <xsl:text>&amp;rft_val_fmt=info:ofi/fmt:kev:mtx:book</xsl:text>

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

</xsl:stylesheet>

