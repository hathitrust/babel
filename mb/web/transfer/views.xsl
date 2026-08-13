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
        <style>
        button.btn, a.btn {
          padding: 8px 16px;
        }
        </style>
      </head>
      <body class="apps" style="opacity: 0;">
        <div id="skiplinks" class="visually-hidden-focusable" role="complementary" aria-label="Skip links">
          <ul>
            <li>
              <a href="#main">Skip to main</a>
            </li>
          </ul>
        </div>
        <hathi-website-header data-prop-search-state="toggle"></hathi-website-header>
        <main class="container" id="main">
          <span class="d-flex gap-2 align-items-center">
            <span class="d-flex justify-content-center align-items-center" style="width: 1.5rem;">
              <i class="fa-solid fa-exchange-alt fa-flip-horizontal text-primary-600" style="font-size:1.25rem" aria-hidden="true"></i>
            </span>
            <h1 class="headline-2 mb-0">Transfer collections</h1>
          </span>
          <div class="alert alert-block alert-warning">
            <h2 class="h3">There was a problem.</h2>
            <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
            <p style="margin-top: 1rem"><a class="btn btn-primary" href="/cgi/mb?a=listcs;colltype=my-collections">Back to Collections</a></p>
          </div>
        </main>
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
        <style>
          figure { 
            width: 100%;
          }
          button.btn, a.btn {
            padding: 8px 16px;
          }
        </style>
      </head>
      <body data-view="{$view}" class="apps" style="opacity: 0;">
        <div id="skiplinks" class="visually-hidden-focusable" role="complementary" aria-label="Skip links">
          <ul>
            <li>
              <a href="#main">Skip to main</a>
            </li>
          </ul>
        </div>
        <hathi-website-header data-prop-search-state="toggle"></hathi-website-header>
        <main class="container" id="main">
          <form method="POST" action="{$root/field[@name='action']/value}">
            <div class="d-grid gap-125">
                <span class="d-flex gap-2 align-items-center">
                  <span class="d-flex justify-content-center align-items-center" style="width: 1.5rem;">
                    <i class="fa-solid fa-exchange-alt fa-flip-horizontal text-primary-600" style="font-size:1.25rem" aria-hidden="true"></i>
                  </span>
                  <h1 class="headline-2 mb-0">Transfer collections</h1>
                </span>
                <div class="d-flex flex-column gap-125">
                <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
                </div>
            </div>
            <xsl:apply-templates select="$root/field[@name='referer']" mode="input" />
          </form>
        </main>
        <hathi-website-footer class="position-absolute bottom-0 w-100"></hathi-website-footer>
        <script src="/mb/transfer/utils.js"></script>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.confirm']" name="request.confirm">

  <div class="d-grid gap-125">

        <div class="d-grid gap-3">
          <h2 class="h3 mb-0">Select collections</h2>

          <p class="mb-0">You've selected these collections to transfer:</p>
          
          <xsl:call-template name="build-collection-data-list-links" />

          <p class="mb-0">
            The next step will generate a link that can be
            used to transfer collections to a new owner, or to recover access
            to collections after logging in with a different method or identity.
          </p>

          <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />
        </div>
      <xsl:call-template name="build-modal-step-footer" />
    </div>
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.view']" name="request.view">
    <xsl:variable name="transfer-link" select="$root/field[@name='transfer_link']/value" />
    <xsl:variable name="new" select="$root/field[@name='new']/value" />

    <div class="d-grid gap-125">
      <div class="d-grid gap-3">
        <h2 class="h3 mb-0">Copy link</h2>

        <p class="mb-0">Copy this transfer link and use in a new browser session:</p>
        <div class="transfer-link-callout">
          <hathi-copy-snippet data-prop-snippet-link="{$transfer-link}"></hathi-copy-snippet>
        </div>

        <p class="mb-0">
          If you are using this link to migrate your collections to a new identity,
          make sure you <a href="/cgi/logout">log out</a> of HathiTrust with your 
          current account before proceeding.
        </p>

      </div>

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

      <xsl:call-template name="build-modal-done-cancel-footer" />
    </div>
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.confirm']" name="complete.confirm">
 
    <div class="d-grid gap-125">

        <div class="d-grid gap-1">
        <h2 class="h3 mb-0">Review collections</h2>

        <p class="mb-0">The following are the collections that are available for import:</p>

        <xsl:call-template name="build-collection-data-list" />

        <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />
        <p class="mb-0">If everything looks good, proceed to the next step to claim ownership or regain access to these collections.</p>
        </div>

        <xsl:call-template name="build-modal-step-footer" />
    </div>
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.transfer']" name="complete.transfer">
   
    <div class="d-grid gap-125">

      <div class="d-grid gap-3">
        <h2 class="h3 mb-0">Transfer completed!</h2>
        <p class="mb-0">These collections are now maintained in your personal collections:</p>

        <xsl:call-template name="build-collection-data-list-links" />

        <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />
      </div>
      <xsl:call-template name="build-modal-done-footer" />
    </div>
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.prompt_login']" name="complete.prompt_login">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
   
    <div class="d-grid gap-125">

      <div class="d-grid gap-3">
        <h2 class="h3 mb-0">Please Log In</h2>
        <p class="mb-0">Please log into HathiTrust to accept ownership of these collections:</p>

        <xsl:call-template name="build-collection-data-list" />
      </div>
      <div class="d-flex gap-125">
        <a class="btn btn-primary px-3 py-2" href="{$root/field[@name='login-link']/value}">Log In</a>
        <a id="action-modal-button-1-0" class="btn border-0 shadow-none px-3 py-2" href="{$back-link}">Cancel</a>
      </div>
    </div>
  </xsl:template>

  <!-- ERROR VIEWS -->

  <xsl:template match="xsl:template[@name='error.ownership']" name="error.ownership">
    <xsl:variable name="messages" select="$root//field[@name='collection_data']//field[@name='messages']" />
    <p>The selected collections could not be transferred.</p>
    <ul class="mb-0">
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

  <xsl:template name="build-collection-data-list-links">
    <ul class="mb-0 text-primary-700">
      <xsl:for-each select="$root/field[@name='collection_data']//field[@name='data']/value">
        <li>
          <a class="text-primary-700" href="{field[@name='href']/value}">
            <xsl:value-of select="field[@name='collname']/value" />
          </a>
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template name="build-collection-data-list">
    <ul class="mb-0">
      <xsl:for-each select="$root/field[@name='collection_data']//field[@name='data']/value">
        <li>
            <xsl:value-of select="field[@name='collname']/value" />
        </li>
      </xsl:for-each>
    </ul>
  </xsl:template>

  <xsl:template name="build-modal-step-footer">
      <xsl:call-template name="build-modal-step-actions" />
  </xsl:template>  

  <xsl:template name="build-modal-step-actions">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="d-flex gap-125">
      <button id="action-modal-button-1-1" class="btn btn-primary d-flex gap-2 align-items-center px-3 py-2" type="submit" name="action" value="submit">Continue <i class="fa-solid fa-chevron-right" aria-hidden="true"></i></button>
      <a id="action-modal-button-1-0" class="btn border-0 shadow-none px-3 py-2" href="{$back-link}">Cancel transfer</a>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-done-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="d-flex">
      <a class="btn btn-primary" href="{$back-link}">Done</a>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-done-cancel-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="d-flex gap-2">
      <a class="btn btn-primary" href="{$back-link}">Done</a>
      <button id="action-modal-button-1-1" class="btn border-0 shadow-none d-flex align-items-center gap-1" type="submit" name="action" value="cancel">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
        </svg>
        <xsl:text> Cancel Transfer</xsl:text>
      </button>
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