<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform">

  <xsl:output method="html" omit-xml-declaration="yes" indent="yes" />
  <xsl:variable name="root" select="//root" />
  <xsl:variable name="self-transfer">false</xsl:variable>

  <xsl:template match="/">
    <xsl:apply-templates />
  </xsl:template>

  <xsl:template match="root[field[@name='status']/value = 'error']" priority="100">
    <xsl:variable name="view" select="$root/field[@name='view']/value" />

    <html lang="en-US">

      <head>
        <title>Transfer Collections | HathiTrust Digital Library</title>
        <xsl:call-template name="load-firebird-assets" />
        
        <meta charset="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body class="apps" style="opacity: 0;">
        <hathi-website-header data-prop-search-state="toggle"></hathi-website-header>
        <div class="container">
          <h1 class="mb-3">Transfer collections</h1>
          <div class="alert alert-block alert-warning">
            <h2 class="h3">There was a problem.</h2>
            <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
            <p style="margin-top: 1rem"><a class="btn btn-primary" href="/cgi/mb?a=listcs;colltype=my-collections">Back to Collections</a></p>
          </div>
        </div>
        <hathi-website-footer class="position-absolute bottom-0 w-100"></hathi-website-footer>
      </body>
    </html>

  </xsl:template>

  <xsl:template match="root[field[@name='view']/value]">
    <xsl:variable name="view" select="$root/field[@name='view']/value" />

    <html lang="en-US">

      <head>
        <title>Transfer Collections | HathiTrust Digital Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <xsl:call-template name="load-firebird-assets" />
        <meta charset="utf-8" />
      </head>
      <body data-view="{$view}" class="apps" style="opacity: 0;">
        <hathi-website-header data-prop-search-state="toggle"></hathi-website-header>
        <div class="container">
          <form method="POST" action="{$root/field[@name='action']/value}">
            <div class="p-3">
                <h1 class="mb-3">Transfer collections</h1>
                <div class="d-flex flex-column">
                <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
                </div>
            </div>
            <xsl:apply-templates select="$root/field[@name='referer']" mode="input" />
          </form>
        </div>
        <hathi-website-footer class="position-absolute bottom-0 w-100"></hathi-website-footer>
        <script src="/mb/transfer/utils.js"></script>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.confirm']" name="request.confirm">

  <div>

        <h2 class="h3">Review selected collections</h2>

        <p>You've selected these collections to transfer:</p>
        
        <xsl:call-template name="build-collection-data-list" />

        <p>
          The next step will generate a link that can be
          used to transfer collections to a new owner, or to recover access
          to collections after logging in with a different method or identity.
        </p>

        <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

      <xsl:call-template name="build-modal-step-footer" />
    </div>
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.view']" name="request.view">
    <xsl:variable name="transfer-link" select="$root/field[@name='transfer_link']/value" />
    <xsl:variable name="new" select="$root/field[@name='new']/value" />

    

    <div role="region" aria-label="Transfer collections steps">
      <h2 class="h3">
        <xsl:choose>
          <xsl:when test="$new = '1'">
            <xsl:text>Finalize transfer</xsl:text>
          </xsl:when>
          <xsl:otherwise>
            <xsl:text>Transfer has been initiated</xsl:text>
          </xsl:otherwise>
        </xsl:choose>
      </h2>

      <p>Copy this transfer link and use in a new browser session:</p>
      <div class="transfer-link-callout">
        <hathi-copy-snippet data-prop-snippet-link="{$transfer-link}"></hathi-copy-snippet>
      </div>

      <p>
        If you are using this link to migrate your collections to a new identity,
        make sure you <a href="/cgi/logout">log out</a> of HathiTrust with your 
        current account before proceeding.
      </p>

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-done-cancel-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.confirm']" name="complete.confirm">
 
    <div role="region" aria-label="Transfer collections steps">

      <h2 class="h3">Review Transfer</h2>

      <p>Continue to the next step to accept ownership of or recover access to these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-step-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.transfer']" name="complete.transfer">
   
    <div class="modal__content" id="modal-1-content">

      <h2 class="h3">Transfer completed!</h2>
      <p>You now maintain these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-done-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.prompt_login']" name="complete.prompt_login">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
   
    <div id="modal-1-content">

      <h2 class="h3">Please Log In</h2>
      <p>Please log into HathiTrust to accept ownership of these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

    </div>
    <div class="d-flex justify-content-between">
      <a id="action-modal-button-1-0" class="btn border-0 shadow-none" href="{$back-link}">Cancel</a>
      <a class="btn btn-primary" href="{$root/field[@name='login-link']/value}">Log In</a>
    </div>
  </xsl:template>

  <!-- ERROR VIEWS -->

  <xsl:template match="xsl:template[@name='error.ownership']" name="error.ownership">
    <xsl:variable name="messages" select="$root//field[@name='collection_data']//field[@name='messages']" />
    <p>The selected collections could not be transferred.</p>
    <ul>
      <xsl:for-each select="$messages/value">
        <li><xsl:value-of select="." /></li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.expired-transfer']" name="error.expired-transfer">
    <p>This transfer link has expired.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.who-are-you']" name="error.who-are-you">
    <p>There was a problem verifying that you requested this transfer.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.missing-token']" name="error.missing-token">
    <p>The transfer link was missing a valid token.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.invalid-token']" name="error.invalid-token">
    <p>The transfer link was missing a valid token, or the token expired.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.missing-selection']" name="error.missing-selection">
    <p>There were no collections selected to transfer.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.login-required']" name="error.login-required">
    <p>You have to log in before you can transfer collections.</p>
  </xsl:template>

  <xsl:template match="xsl:template[@name='error.database-transfer-error']" name="error.database-transfer-error">
    <xsl:variable name="message" select="$root//field[@name='message']" />
    <p>There was a problem with the transfer.</p>
    <blockquote>
      <xsl:value-of select="$message/value" />
    </blockquote>
  </xsl:template>

  <xsl:template match="field">
    <dt>
      <xsl:value-of select="@name" />
    </dt>
    <xsl:apply-templates select="value" />
  </xsl:template>

  <xsl:template match="value">
    <dd>
      <xsl:value-of select="." />
    </dd>
  </xsl:template>

  <xsl:template name="build-collection-data-list">
    <ul>
      <xsl:for-each select="$root/field[@name='collection_data']//field[@name='data']/value">
        <li>
          <a href="{field[@name='href']/value}">
            <xsl:value-of select="field[@name='collname']/value" />
          </a>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template name="build-modal-step-footer">
    <div class="d-flex justify-content-between">
      <xsl:call-template name="build-modal-step-actions" />
    </div>
  </xsl:template>  

  <xsl:template name="build-modal-step-actions">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <a id="action-modal-button-1-0" class="btn border-0 shadow-none" href="{$back-link}">Cancel</a>
    <div class="d-flex gap-2">
      <button id="action-modal-button-1-1" class="btn btn-primary" type="submit" name="action" value="submit">Continue <i class="fa-solid fa-arrow-right" aria-hidden="true"></i></button>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-done-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="d-flex justify-content-end">
      <a class="btn btn-primary" href="{$back-link}">Done</a>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-done-cancel-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="d-flex justify-content-between">
      <button id="action-modal-button-1-1" class="btn btn-outline-dark d-flex align-items-center gap-1" type="submit" name="action" value="cancel">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
        </svg>
        <xsl:text> Cancel Transfer</xsl:text>
      </button>
      <a class="btn btn-primary" href="{$back-link}">Done</a>
    </div>
  </xsl:template>

  <xsl:template match="field[@name='collection_data']" mode="input" priority="100">
    <xsl:for-each select="value/field[@name='collids']/value">
      <input type="hidden" name="c" value="{.}" />
    </xsl:for-each>
  </xsl:template>

  <xsl:template match="field" mode="input">
    <xsl:variable name="name" select="@name" />
    <xsl:for-each select="value">
      <input type="hidden" name="{$name}" value="{.}" />
    </xsl:for-each>
  </xsl:template>

  <xsl:template match="*|@*|text()">
    <xsl:copy>
      <xsl:apply-templates select="@*|*|text()" />
    </xsl:copy>
  </xsl:template>

   <xsl:template name="load-firebird-assets">
    <script>
      async function loadFirebirdAssets() {
          function addScript(options) {
            let scriptEl = document.createElement('script');
            if (options.crossOrigin) {
              scriptEl.crossOrigin = options.crossOrigin;
            }
            if (options.type) {
              scriptEl.type = options.type;
            }
            scriptEl.src = options.href;
            document.head.appendChild(scriptEl);
          }

          function addStylesheet(options) {
            let linkEl = document.createElement('link');
            linkEl.rel = 'stylesheet';
            linkEl.href = options.href;
            document.head.appendChild(linkEl);
          }

          try {
            const response = await fetch('/common/firebird/dist/manifest.json');
            const manifest = await response.json();

            const assets = {
              stylesheet: '/common/firebird/dist/' + manifest['index.css'].file,
              script: '/common/firebird/dist/' + manifest['index.html'].file,
            };

            addStylesheet({ href: assets.stylesheet });
            addScript({ href: assets.script, type: 'module' });
          } catch (err) {
            console.error('Failed to load firebird assets:', err);
          }
        }

        loadFirebirdAssets();

        // in case any of the links and scripts fail
        setTimeout(function () {
          document.body.style.visibility = 'visible';
          document.body.style.opacity = '1';
        }, 1500);
    </script>
  </xsl:template>

</xsl:stylesheet>