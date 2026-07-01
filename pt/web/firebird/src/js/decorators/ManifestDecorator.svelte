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
    featureList: [
      { seq: 1, pageNum: '1', label: '', features: [], ownerid: null, pseq: null },
      { seq: 2, pageNum: '2', label: '', features: [], ownerid: null, pseq: null },
    ],
    readingOrder: 'left-to-right',
    q1: '',
    accessType: {},
    externalLinks: [],
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

  const HT = {
    www_domain: 'www.hathitrust.org',
    service_domain: 'babel.hathitrust.org',
    loginStatus: { logged_in: false },
    live: { announce: () => {} },
    prefs: { getItem: () => null, setItem: () => {} },
  };

  setContext('manifest', manifest);
  setContext('emitter', emitter);
  setContext('HT', HT);
</script>

{@render children()}
