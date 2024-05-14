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
        <link rel="stylesheet" type="text/css" href="/common/alicorn/css/main.201910.css" />
        <meta charset="utf-8" />
        <style>
          body {
            display: flex;
            justify-content: center;
            align-items: center;
          }

          .alert {
            border: 1px solid #423c31;
          }

          .alert-block.alert-warning > * + * {
            margin-top: 0.5rem;
          }

          .alert-block .btn {
            text-shadow: none;
          }
        </style>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </head>
      <body>
        <div class="alert alert-block alert-warning">
          <p>There was a problem.</p>
          <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
          <p style="margin-top: 1rem"><a class="btn btn-primary" href="/cgi/mb?a=listcs;colltype=my-collections">Back to Index</a></p>
        </div>
      </body>
    </html>

  </xsl:template>

  <xsl:template match="root[field[@name='view']/value]">
    <xsl:variable name="view" select="$root/field[@name='view']/value" />

    <html lang="en-US">

      <head>
        <title>Transfer Collections | HathiTrust Digital Library</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />

        <link rel="stylesheet" type="text/css" href="/common/alicorn/css/main.201910.css" />
        <meta charset="utf-8" />
        <style>
          .modal__container {
            width: 75vw;
            max-width: 54rem;
            min-width: 34rem;
          }

          .modal__container ul {
            font-size: 95%;
          }

          .modal__content {
            padding: 1rem 2rem;
          }

          .modal__footer {
            display: flex;
            align-items: center;
            justify-content: flex-end;
            gap: 0.25rem;
            border-bottom-left-radius: 6px;
            border-bottom-right-radius: 6px;
          }

          .modal__footer .btn.justify-start {
            margin-right: auto;
            justify-self: flex-start;
          }

          .modal__container * + * {
            margin-top: 1rem;
          }

          .modal__container li + li {
            margin-top: 0.25rem;
          }

          .transfer-link-callout {
            margin: 1rem auto; 
            width: 90%; 
            display: flex; 
            flex-direction: row; 
            align-items: flex-start; 
            gap: 1rem;
          }

          .transfer-link-callout p {
          }

          span.transfer-link-span {
            word-break: break-all;
            font-size: 90%; 
            font-family: monospace;
            display: inline-block;
          }

          button[data-action="action-copy"] {
            flex-grow: 0;
            flex-shrink: 0;
            display: flex;
          }

          button[data-action="action-copy"]:hover {
            fill: #f5f5f5;
          }

          .modal__content h2 {
            margin-top: 0;
            font-size: 1.125rem;
          }

          .btn.flex {
            display: flex; 
            align-items: center; 
            gap: 0.25rem;
          }

        </style>
      </head>
      <body data-view="{$view}">
        <form method="POST" action="{$root/field[@name='action']/value}">
          <div class="modal is-open" id="modal-1" aria-hidden="false">
            <div class="modal__overlay" tabindex="-1" data-micromodal-close="">
              <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-1-title">
                <xsl:apply-templates select="document('')//xsl:template[@name=$view]" />
              </div>
            </div>
          </div>
          <xsl:apply-templates select="$root/field[@name='referer']" mode="input" />
        </form>
        <script src="/mb/transfer/utils.js"></script>
      </body>
    </html>
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.confirm']" name="request.confirm">
    <xsl:call-template name="build-modal-header">
      <xsl:with-param name="title">Transfer Collections</xsl:with-param>
    </xsl:call-template>
    <div class="modal__content" id="modal-1-content">

      <h2>Step 1: Select collections</h2>

      <p>You've selected these collections to transfer:</p>
      
      <xsl:call-template name="build-collection-data-list" />

      <p>
        The next step will generate a link that can be
        used to transfer collections to a new owner, or to recover access
        to collections after logging in with a different method or identity.
      </p>

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-step-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='request.view']" name="request.view">
    <xsl:variable name="transfer-link" select="$root/field[@name='transfer_link']/value" />
    <xsl:variable name="new" select="$root/field[@name='new']/value" />

    <xsl:call-template name="build-modal-header">
      <xsl:with-param name="title">Transfer Collections</xsl:with-param>
    </xsl:call-template>

    <div class="modal__content" id="modal-1-content">

      <h2>
        <xsl:if test="$new = '1'">
          <xsl:text>Step 2: </xsl:text>
        </xsl:if>
        <xsl:text>Copy Link</xsl:text>
      </h2>

      <p>Copy this transfer link and use in a new browser session:</p>
      <div class="transfer-link-callout">
        <p id="transfer-link">
          <xsl:value-of select="$transfer-link" />
        </p>
        <xsl:call-template name="build-action-copy" />
      </div>

      <div id="transfer-link-success" style="display: none" class="alert alert-success">Link copied!</div>

      <p>
        If you are using this link to migrate your collections to a new identity,
        make sure you <a href="/cgi/logout">log out</a> of HathiTrust with your 
        current account before proceeding.
      </p>

      <!-- <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" /> -->

    </div>
    <xsl:call-template name="build-modal-done-cancel-footer" />
  </xsl:template>

  <xsl:template name="build-action-copy">
    <button type="button" data-action="action-copy" data-for="transfer-link" aria-label="Copy Transfer Link">
      <svg xmlns="http://www.w3.org/2000/svg" aria-hidden="true" data-name="mat-copy-content" height="24px" viewBox="0 0 24 24" width="24px">
        <path d="M0 0h24v24H0V0z" fill="none"></path>
        <path d="M16 1H4c-1.1 0-2 .9-2 2v14h2V3h12V1zm3 4H8c-1.1 0-2 .9-2 2v14c0 1.1.9 2 2 2h11c1.1 0 2-.9 2-2V7c0-1.1-.9-2-2-2zm0 16H8V7h11v14z"></path>
      </svg>
    </button>
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.confirm']" name="complete.confirm">
    <xsl:call-template name="build-modal-header">
      <xsl:with-param name="title">Transfer Collections: Confirm</xsl:with-param>
    </xsl:call-template>
    <div class="modal__content" id="modal-1-content">

      <h2>Step 1: Review Transfer</h2>

      <p>Continue to the next step to accept ownership of or recover access to these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

      <!-- <p>
      </p> -->

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-step-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.transfer']" name="complete.transfer">
    <xsl:call-template name="build-modal-header">
      <xsl:with-param name="title">Transfer Collections: Confirm</xsl:with-param>
    </xsl:call-template>
    <div class="modal__content" id="modal-1-content">

      <h2>Transfer completed!</h2>
      <p>You now maintain these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

      <xsl:apply-templates select="$root/field[@name='collection_data']" mode="input" />

    </div>
    <xsl:call-template name="build-modal-done-footer" />
  </xsl:template>

  <xsl:template match="xsl:template[@name='complete.prompt_login']" name="complete.prompt_login">
    <xsl:call-template name="build-modal-header">
      <xsl:with-param name="title">Transfer Collections: Confirm</xsl:with-param>
    </xsl:call-template>
    <div class="modal__content" id="modal-1-content">

      <h2>Step 0: Please Log In</h2>
      <p>Please log into HathiTrust to accept ownership of these collections:</p>

      <xsl:call-template name="build-collection-data-list" />

    </div>
    <div class="modal__footer">
      <button type="button" id="action-modal-button-1-0" class="modal__btn btn-dismiss" data-micromodal-close="true" name="action" value="cancel">Cancel</button>
      <a class="modal__btn btn btn-primary" href="{$root/field[@name='login-link']/value}">Log In</a>
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

  <xsl:template name="build-modal-header">
    <xsl:param name="title" />
    <div class="modal__header">
      <h1 class="modal__title" id="modal-1-title">
        <xsl:value-of select="$title" />
      </h1>
      <button type="button" class="modal__close" aria-label="Close modal" data-micromodal-close=""></button>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-step-footer">
    <div class="modal__footer">
      <xsl:call-template name="build-modal-step-actions" />
    </div>
  </xsl:template>

  <xsl:template name="build-modal-step-actions">
    <button type="button" id="action-modal-button-1-0" class="modal__btn btn-dismiss" data-micromodal-close="true" name="action" value="cancel">Cancel</button>
    <button id="action-modal-button-1-1" class="modal__btn btn btn-primary" type="submit" name="action" value="submit">Next</button>
  </xsl:template>

  <xsl:template name="build-modal-done-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="modal__footer">
      <a class="modal__btn btn btn-primary" href="{$back-link}">Done</a>
    </div>
  </xsl:template>

  <xsl:template name="build-modal-done-cancel-footer">
    <xsl:variable name="back-link" select="$root/field[@name='referer']/value" />
    <div class="modal__footer">
      <button id="action-modal-button-1-1" class="modal__btn btn justify-start flex" type="submit" name="action" value="cancel">
        <svg aria-hidden="true" xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" class="bi bi-trash" viewBox="0 0 16 16">
          <path d="M5.5 5.5A.5.5 0 0 1 6 6v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm2.5 0a.5.5 0 0 1 .5.5v6a.5.5 0 0 1-1 0V6a.5.5 0 0 1 .5-.5zm3 .5a.5.5 0 0 0-1 0v6a.5.5 0 0 0 1 0V6z" />
          <path fill-rule="evenodd" d="M14.5 3a1 1 0 0 1-1 1H13v9a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V4h-.5a1 1 0 0 1-1-1V2a1 1 0 0 1 1-1H6a1 1 0 0 1 1-1h2a1 1 0 0 1 1 1h3.5a1 1 0 0 1 1 1v1zM4.118 4 4 4.059V13a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1V4.059L11.882 4H4.118zM2.5 3V2h11v1h-11z" />
        </svg>
        <xsl:text> Cancel Transfer</xsl:text>
      </button>
      <a class="modal__btn btn btn-primary" href="{$back-link}">Done</a>
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

</xsl:stylesheet>