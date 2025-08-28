// @ts-nocheck
import '../scss/styles.scss';

import { setupHTEnv } from '~firebird-common/src/js/lib/utils';
import { AnalyticsManager } from '~firebird-common/src/js/lib/analytics.svelte.js';
import { HotjarManager } from '~firebird-common/src/js/lib/hotjar.svelte.js';

// Import all of Bootstrap's JS
// these are made available globally
import * as bootstrap from 'bootstrap';
window.bootstrap = bootstrap;

import { writable } from 'svelte/store';

// -- favor lib/tooltip.js action because the native bootstrap
// tooltip remains on when buttons are clicked and stay in focus
// new bootstrap.Tooltip('body', {
//   selector: '[data-bs-toggle="tooltip"]',
//   title: function() { return this.getAttribute('aria-label'); }
// });

import App from './App.svelte';
import CookieConsentBanner from '~firebird-common/src/js/components/CookieConsentBanner';
import { mount } from 'svelte';

const toCamel = (s) => {
  return s.replace(/([-_][a-z])/gi, ($1) => {
    return $1.toUpperCase().replace('-', '').replace('_', '');
  });
};

const buildProps = (el) => {
  let propProperty = `data-prop-`;
  let props = {};
  for (const attr of el.attributes) {
    if (attr.name.startsWith(propProperty)) {
      let value = attr.value;
      try {
        value = JSON.parse(value);
      } catch (error) {}

      props[toCamel(attr.name.replace(propProperty, ''))] = value;
    }
  }
  return props;
};

// configure the HT global
setupHTEnv();

// an empty login status
let emptyLoginStatus = {
  logged_in: false,
  idp_list: [],
};

HT.loginStatus = writable(emptyLoginStatus);
HT.login_status = emptyLoginStatus;

let app;
export const apps = {};
apps['hathi-cookie-consent-banner'] = CookieConsentBanner;

let needLoggedInStatus = true;

HT.postPingCallback = function (login_status) {
  if (!needLoggedInStatus) {
    return;
  }

  // we need to set loginStatus as long as login_status.authType === undefined
  // because ping sets authType=null and the emptyLoginStatus doesn't set authType
  // now in a non-logged in state, if the timeout fires AFTER ping
  // the loginStatus won't get overwritten with the empty response
  needLoggedInStatus = login_status.authType === undefined;

  HT.loginStatus.set(login_status);

  // if the app was already initialized, punt
  if (app) {
    return;
  }

  let el = document.getElementById('root');
  let props = buildProps(el);

  app = mount(App, {
    target: document.getElementById('root'),
    props: props,
  });
  Object.keys(apps).forEach((slug) => {
    document.querySelectorAll(slug).forEach((el) => {
      if (el.component) {
        return;
      }
      let props = buildProps(el);
      el.component = mount(apps[slug], {
        target: el,
        props: props,
      });
    });
  });
  setTimeout(() => {
    document.body.dataset.initialized = true;
  });
  new AnalyticsManager(HT).configure();
  new HotjarManager(HT).configure();

  if (window.firebirdErrorHandler) {
    window.removeEventListener('error', window.firebirdErrorHandler);
  }
};

let script = document.createElement('script');
script.async = true;
script.src = `//${HT.service_domain}/cgi/ping?callback=HT.postPingCallback&_${new Date().getTime()}`;
script.onerror = function () {
  HT.postPingCallback(emptyLoginStatus);
};
document.head.appendChild(script);

setTimeout(() => {
  if (document.body.dataset.initialized == 'true') {
    return;
  }
  HT.postPingCallback(emptyLoginStatus);
}, 500);

export default app;
