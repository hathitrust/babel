<script>
  import { setContext } from 'svelte';
  import { writable } from 'svelte/store';
  import Emittery from 'emittery';
  import { Manifest } from '../lib/manifest.js';

  const { children } = $props();

  const params = {
    id: 'test.storybook_item',
    seq: 1,
    defaultSeq: 1,
    firstSeq: 1,
    totalSeq: 5,
    view: '1up',
    format: 'image',
    ui: 'normal',
    finalAccessAllowed: true,
    metadata: {
      title: 'Storybook Test Item',
      author: 'Test Author',
      publisher: 'Test Publisher',
      date: '1910',
    },
    defaultImage: { height: 800, width: 600 },
    rights: {
      head: 'Public Domain',
      useLink: 'https://www.hathitrust.org/access_use',
      useIcon: null,
      useAuxLink: null,
      useAuxIcon: null,
    },
    featureList: [
      { seq: 1, pageNum: '1', label: '', features: [], ownerid: null, pseq: null },
      { seq: 2, pageNum: '2', label: '', features: [], ownerid: null, pseq: null },
    ],
    readingOrder: 'left-to-right',
    q1: '',
    accessType: {},
    externalLinks: [],
    sectionList: [],
  };

  const manifest = new Manifest(params);
  manifest.currentSeq = writable(1);
  manifest.currentView = writable('1up');
  manifest.currentFormat = writable('image');
  manifest.q1 = writable('');
  manifest.currentLocation = writable({});
  manifest.interfaceMode = writable('default');
  manifest.isFullscreen = writable(false);
  manifest.selected = writable(new Set());

  const emitter = new Emittery();

  // In-memory stand-in for firebird-common's cookie-backed HT.prefs (see
  // firebird-common/src/js/lib/utils.js), which real components call as
  // HT.prefs.get() / HT.prefs.set(params).
  let prefsStore = {};
  const HT = {
    www_domain: 'www.hathitrust.org',
    service_domain: 'babel.hathitrust.org',
    catalog_domain: 'catalog.hathitrust.org',
    // the real app keeps both a plain mirror (login_status) and a reactive
    // Svelte $state proxy (loginStatus) in sync; components read from either.
    login_status: { logged_in: false },
    loginStatus: { logged_in: false },
    live: { announce: () => {} },
    prefs: {
      get: () => prefsStore,
      set: (params) => {
        prefsStore = { ...prefsStore, ...params };
      },
    },
    // AccessStatusPanel's expiration monitor polls this for an 'HTexpiration' cookie;
    // returning null means it never fires, which keeps expiring-access stories static.
    cookieJar: { getItem: () => null, setItem: () => {} },
  };

  setContext('manifest', manifest);
  setContext('emitter', emitter);
  setContext('HT', HT);

  // In production, setupHTEnv() (firebird-common/src/js/lib/utils.js) makes HT a
  // global, and the Svelte context is just an alias to that same object. Some firebird-common
  // components (e.g. CollectionEditModal) reference the bare `HT` identifier directly rather
  // than via getContext, so it must exist as a global here too.
  window.HT = HT;
</script>

{@render children()}
