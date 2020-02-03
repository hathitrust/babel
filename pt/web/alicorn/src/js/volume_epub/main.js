
import NanoEvents from 'nanoevents';
import {Control} from './components/controls';
// import {View} from './components/views';

import debounce from 'lodash/debounce';

import * as cozy from 'cozy-sun-bear/src/reader';

var HT = window.HT || {}; window.HT = HT;
var $root = document.querySelector('main');
var $main = document.querySelector('section#section');
var $viewer = $main.querySelector('.viewer');
var $inner = $viewer.querySelector('.viewer-inner');
var $status = document.querySelector('div[role="status"]');

var $toolbar = $main.querySelector('#toolbar-vertical');
// // --- need to do something about the toolbar height
// setTimeout(() => {
//   // $toolbar.style.height = `${getComputedStyle($toolbar).height}`;
//   var h = parseInt(getComputedStyle($toolbar).height);

//   $toolbar.style.overflowY = 'auto';
// }, 100);

var min_height = $viewer.offsetHeight;
var min_width = $viewer.offsetWidth * 0.80;

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) { // .length of function is 2
      'use strict';
      if (target == null) { // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) { // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({ scale: 1.0 }, options);
    this.emitter = new NanoEvents();
    this.controls = {};
    this.pagedetails = { rotate: {}, scale: {} };
    this.identifier = this.options.identifier;
    this._trigger = null;
    this.trigger = {
      push: function(value) { this._trigger = value; },
      pop: function() { var retval = this._trigger; this._trigger = null; return retval; }
    }
    // mocking the service object
    this.service = {
      hasOcr: function() { return false; },
      manifest: {
        totalSeq: 2
      }
    }
    this.bindEvents();
  }

  start(params, cb) {
    var epub_href = document.querySelector('html').dataset.epubRoot;

    if ( location.href.indexOf('debug=local,epub') > 0 ) {
      var tmp = epub_href.split('/');
      tmp.pop(); // trailing slash
      var epub_filename = tmp.pop()
      epub_filename = epub_filename.replace('.epub_unpacked', '.epub');
      tmp.push(epub_filename);
      epub_href = tmp.join('/');
    }

    var flow = params.view == '1up' ? 'scrolled-doc' : 'paginated';

    if ( params.view ) {
      $main.dataset.view = params.view; $main.classList.add(`view--${params.view}`);

      if ( params.restarting ) {
        this.emit('status', `Switching to ${params.view} view`);
      }
    }

    this.view = cozy.reader(document.querySelector('.viewer-inner'), { href: epub_href, flow: flow, xxmobileMediaQuery: '(min-device-width : 100px) and (max-device-width : 150px)' });
    this.view.name = params.view;

    this.emit('initialized');

    this.view.on('relocated', (location) => {
      this.emit('relocated', location);
    });

    var perm_url = document.querySelector('#permURL').value;
    this.view.start(() => {
      this.emit('ready');

      this.view.on('updateLocation', () => {
        document.querySelector('#pageURL').value = `${perm_url}?urlappend=%23${window.location.hash}`;
      })
    });
  }

  restart(params) {
    var current = params.location || this.view.currentLocation();

    if ( params.view == this.view.options.flow ) { return ; }
    $main.classList.remove(`view--${this.view.name}`);
    $main.dataset.view = params.view; $main.classList.add(`view--${params.view}`);

    var flow = params.view == '1up' ? 'scrolled-doc' : 'paginated';
    this.view.saveOptions({ flow: flow });

    params.restarting = true;

    this.view.reopen({ flow: flow }, current);
    this.view.name = params.view;
  }

  bindEvents() {
    this.on('redraw', (params) => {
      if ( params.scale ) { // && ! this.is_mobile
        this.options.scale = params.scale;
        this.controls.flexinator.sidebar(params.scale <= 1.0);
        this.trigger.push(`zoom:${params.scale}`); // triggers track
        // this._logAction(undefined, `zoom:${params.scale}`);

        // var text_size = this.view.options.text_size;
        var text_size = 100.0 * params.scale;
        console.log("AHOY REDRAW", params.scale, text_size);
        this.view.reopen({ text_size: text_size });
      }
    });
  }

  display(target) {
    this.view.gotoPage(target);
  }

  prev() {
    this.view.prev();
  }

  next() {
    this.view.next();
  }

  first() {
    this.view.first();
  }

  last() {
    this.view.last();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  _updateHistoryUrl(params) {
    var href = window.location.pathname + location.search;
    var argv = [];
    argv.push(`id=${this.identifier}`);
    argv.push(`view=${params.view || this.view.name}`);
    // argv.push(`seq=${params.seq || HT.params.seq}`);
    if ( HT.params.skin ) { argv.push(`skin=${HT.params.skin}`); }
    if ( this.options.scale > 1.0 ) { argv.push(`size=${Math.floor(this.options.scale * 100)}`) };
    if ( HT.params.debug ) { argv.push(`debug=${HT.params.debug}`); }
    if ( HT.params.l11_tracking ) { argv.push(`l11_tracking=${HT.params.l11_tracking}`); }
    if ( HT.params.l11_uid ) { argv.push(`l11_uid=${HT.params.l11_uid}`); }
    if ( HT.params.q1 ) { argv.push(`q1=${params.q1 || HT.params.q1}`); }
    var new_href = location.pathname + '?' + argv.join('&');
    new_href += location.hash;
    window.history.replaceState(null, document.title, new_href);
  }

  _logAction(href, trigger) {
    if ( HT.analytics && HT.analytics.logAction ) {
      HT.analytics.logAction(href, trigger);
    }
  }
}

// --- RANDOM JANK
var _scrollCheckFn = function(what) {
  return debounce(function(event) {
    if ( what == window ) { window.scrollTo(0,0); }
    else { what.scrollTop = 0; }
  }, 50);
}

// var _scrollCheck = debounce(function(event) {
//   window.scrollTo(0,0);
// }, 50);
// if ( true || ! ( $("html").is(".mobile") && $("html").is(".ios") ) ) {
//   window.addEventListener('scroll', _scrollCheck);
// }

window.addEventListener('scroll', _scrollCheckFn(window));
$root.addEventListener('scroll', _scrollCheckFn($root));

// var _scrollCheck = debounce(function(event) {
//   window.scrollTo(0,0);
// }, 50);
// if ( true || ! ( $("html").is(".mobile") && $("html").is(".ios") ) ) {
//   window.addEventListener('scroll', _scrollCheck);
// }



// --- INITIALIZE READER
var reader = new Reader({ identifier: HT.params.id });
HT.reader = reader;

// initialize
var scale = 1.0;
if ( HT.params.size  ) {
  var size = parseInt(HT.params.size, 10);
  // if ( ! isNaN(size) ) {
  //   var value = size / 100.0;
  //   if ( reader.controls.zoominator.check(value) ) {
  //     scale = value;
  //   }
  // }
}

reader.controls.navigator = new Control.Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator .output'),
  prompt: document.querySelector('#action-prompt-seq'),
  form: document.querySelector('#form-go-page'),
  reader: reader
})

reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.value);
  var value = parseInt(params.value, 10);
  var cfi;
  var locations = reader.view.locations;
  cfi = locations.cfiFromLocation(value);
  reader.view.gotoPage(cfi);
})

reader.controls.paginator = new Control.Paginator({
  input: document.querySelector('#toolbar-horizontal'),
  reader: reader
});

reader.controls.viewinator = new Control.Viewinator({
  input: document.querySelector('.action-views'),
  reader: reader
});

reader.controls.flexinator = new Control.Flexinator({ reader: reader });
reader.controls.flexinator.on('track', (trigger) => {
  reader._logAction(undefined, trigger);
  if ( HT.analytics && HT.analytics.trackEvent ) {
    HT.analytics.trackEvent({ label : "-", category : "HT Reader", action : `HT Reader: ${trigger}` });
  }
});

reader.controls.zoominator = new Control.Zoominator({
  input: document.querySelector('.action-zoom'),
  reader: reader
})

reader.controls.highlighter = new Control.Highlighter({
  reader: reader
})

reader.controls.contentsnator = new Control.Contentsnator({
  input: document.querySelector('.table-of-contents'),
  reader: reader
});

var actionFullScreen = document.querySelector('.action-fullscreen');
if ( actionFullScreen ) {
  reader.controls.expandinator = new Control.Expandinator({
    input: actionFullScreen,
    reader: reader
  });
}

if ( HT.params.view == 'default' ) { HT.params.view = '1up'; }
if ( $inner.offsetWidth < 800 ) {
  HT.params.view = '1up';
}

reader.start({ view: HT.params.view || '1up', seq: HT.params.seq || 10, scale: scale });

setTimeout(() => {
    var event = document.createEvent('UIEvents');
    event.initEvent('resize', true, false, window, 0);
    window.dispatchEvent(event)
}, 100);
