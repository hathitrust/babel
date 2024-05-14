<?xml version="1.0" encoding="utf-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
  version="1.0"
  extension-element-prefixes="str exsl" xmlns:str="http://exslt.org/strings" xmlns:exsl="http://exslt.org/common"
  xmlns="http://www.w3.org/1999/xhtml">

  <xsl:template match="/"><xsl:value-of select="//ItemListJson"/></xsl:template>

</xsl:stylesheet>
