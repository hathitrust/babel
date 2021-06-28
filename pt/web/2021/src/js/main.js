// https://babeljs.io/docs/en/babel-polyfill

import "core-js/stable";
import "regenerator-runtime/runtime";

// -- reader
import { createNanoEvents } from 'nanoevents';
import {Control} from './components/controls';
import {Service, Loader} from './components/imgsrv';
import {View} from './components/views';
import debounce from 'lodash/debounce';

// -- bootstrap
import Dropdown from 'bootstrap/js/dist/dropdown';

const $main = document.querySelector('main'); window.$main = $main;
var $header = document.querySelector('header');

let reader;

// --- MOCKING UP THE VIEWER
var HT = window.HT || {}; window.HT = HT;
if ( location.hostname.indexOf('.hathitrust.org') < 0 ||
     ( HT.is_dev && ! ( location.hostname.indexOf('beta-3') == 0 || location.hostname.indexOf('preview') == 0 ) ) ) {
  // FOR PERFORMANCE IN DEV
  HT.force_size = 100;  
}

const $body = document.body;
const $viewer = document.querySelector('.d--reader--viewer');
const $root = document.querySelector('.d--reader');
const $sidebar = document.querySelector('#sidebar');

const usesGrid = window.getComputedStyle(document.documentElement).getPropertyValue('--uses-grid') != 'false';
window.usesGrid = usesGrid;

const isSafari12 = navigator.userAgent.indexOf('Safari/') > -1 && 
         navigator.userAgent.indexOf('Version/12.1') > -1;
window.isSafari12 = isSafari12;

const isEtas = document.querySelector('#access-emergency-access') != null;

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({ scale: 1.0 }, options);
    this.emitter = createNanoEvents();
    this.controls = {};
    this.pagedetails = { rotate: {}, scale: {} };
    this.identifier = this.options.identifier;
    this._trigger = null;
    this.trigger = {
      push: function(value) { this._trigger = value; },
      pop: function() { var retval = this._trigger; this._trigger = null; return retval; }
    }
    this.bindEvents();
  }

  start(params, cb) {
    if ( cb === undefined ) {
      cb = function() {
        this.emit('ready', this.view.name);
        $root.classList.remove('viewer--setup');
        this.view.display(params.seq || 1);
      }.bind(this);
    } else {
      var original_cb = cb;
      cb = function() {
        this.emit('ready', this.view.name);
        $root.classList.remove('viewer--setup');
        original_cb();
      }.bind(this);
    }

    $root.classList.add('viewer--setup');

    if ( params.view ) {
      $main.dataset.view = $root.dataset.view = params.view;
      $root.classList.add(`view--${params.view}`);

      if ( params.restarting ) {
        this.emit('status', `Switching to ${params.view} view`);
      }
    }

    const format = params.format;
    if ( params.format ) {
      this.options.format = params.format;
    } else if ( ! this.options.format ) {
      this.options.format = 'image';
    }
    $main.dataset.format = $root.dataset.format = this.options.format;

    if ( params.scale ) { this.options.scale = params.scale; }

    if ( this.controls.zoominator && ! this.controls.zoominator.check(this.options.scale) ) {
      // the scale is no longer valid
      this.options.scale = 1;
    }

    this.setView({ view: $root.dataset.view, format: this.options.format, seq: ( params.seq || 1 ) });
    setTimeout(function() {
      this.view.attachTo($viewer, cb);
    }.bind(this), 0);
  }

  restart(params) {
    var current = params.seq || this.view && this.view.currentLocation() || HT.params.seq;

    if ( params.view == this.view.name && params.view == 'plaintext' && params.clicked ) { params.view = '1up'; }
    if ( params.view == '2up' && this.service.manifest.totalSeq == 1 ) { params.view = '1up'; }
    if ( isEtas && params.format == 'plaintext' ) { params.view = 'page'; }
    if ( params.view == this.view.name && params.format == this.view.format ) { return ; }

    // we track format in the reader
    if ( params.format ) { this.options.format = params.format; }
    if ( params.view && params.view != this.view.name ) { this.options.lastView = this.view.name; }

    params.restarting = true;

    if ( this.view ) { 
      $main.classList.remove(`view--${this.view.name}`);
      this.view.destroy(); 
      this.view = null; 
    }
    this.start(params, function() {
      this.view.display(current);
    }.bind(this));
  }

  setView(params) {
    var cls = View.for(params.view);
    this.view = new cls({ reader: this, service: this.service, scale: this.options.scale, format: params.format, seq: params.seq });
    this.emit('configure', this.view.config());
    this._updateViews(params.view);

    HT.update_status(`Viewing book in ${this.view.displayLabel} view.`);

    HT.prefs.set({ pt : { view : params.view, format: params.format } })

    HT.view = this.view;
  }

  next() {
    var params = { eventReferrer: document.documentElement.dataset.eventReferrer };
    this.view.next(params);
    document.documentElement.dataset.eventReferrer = null;
  }

  prev() {
    var params = { eventReferrer: document.documentElement.dataset.eventReferrer };
    this.view.prev(params);
    document.documentElement.dataset.eventReferrer = null;
  }

  first() {
    var params = { eventReferrer: document.documentElement.dataset.eventReferrer };
    this.view.first(params);
    document.documentElement.dataset.eventReferrer = null;
  }

  last() {
    var params = { eventReferrer: document.documentElement.dataset.eventReferrer };
    this.view.last(params);
    document.documentElement.dataset.eventReferrer = null;
  }

  display(seq) {
    this.view.display(seq);
    this.emit('show:reader');
  }

  jump(delta) {
    var seq = parseInt(this.view.currentLocation(), 10);
    var target = seq + delta;
    if ( target < 0 ) { target = 1; }
    else if ( target > this.service.manifest.totalSeq ) {
      target = this.service.manifest.totalSeq;
    }
    this.display(target);
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  bindEvents() {
    /* NOOP */
    var lastMessage; var statusTimer;

    this.on('relocated', (params) => {

      this._updateHistoryUrl(params);

      // legacy
      HT.params.seq = params.seq;
      HT.params.view = this.view.name;

      this._currentLocation = params.seq;

      this._updateLinks(params.seq);
      this.emit('track');
    });

    this.on('relocated', (params) => {
      this.emit('status', `Showing page scan ${params.seq}`);
    })

    this.on('redraw', (params) => {
      if ( params.scale ) { // && ! this.is_mobile
        this.options.scale = params.scale;
        this.trigger.push(`zoom:${params.scale}`); // triggers track
        this._logAction(undefined, `zoom:${params.scale}`);
        this._updateHistoryUrl({});
      }
    })

    this._updateViewports = function() {
      if ( ! usesGrid ) {
        $main.style.height = `${window.innerHeight - $header.clientHeight - 25}px`;
        $viewer.style.height = $main.style.height;
        $root.style.height = $main.style.height;
        if ( $sidebar.style ) {
          $sidebar.style.height = $main.style.height;
        }
      }
      if ( isSafari12 ) {
        // Safari 12 patching
        if ( this.view && this.view.container && this.view.container.parentElement ) {
          var node = this.view.container.parentElement;
          node.style.height = `${node.parentElement.clientHeight}px`;
        }
      }
    }

    if ( ! usesGrid || isSafari12 ) {
      this.on('resize', () => {
        this._updateViewports();
      })
    }

    this._resizer = debounce(function() {
      // DO NOT emit resize events if we're pinch-zooming??
      if ( window.visualViewport && window.visualViewport.scale > 1 ) { 
        return ; 
      }
      this.emit('resize');
    }.bind(this), 100);

    var jump = document.querySelector('#action-focus-current-page');
    jump.addEventListener('click', (event) => {
      event.preventDefault();
      this.view.focus(true);
      this._logAction(undefined, 'action-focus-current-page');
      console.log("AHOY FOCUS CURRENT PAGE");
      return false;
    })

    var IGNORE_FOCUS = [ 'input', 'textarea', 'a', 'button' ];
    var accesskey_triggers = document.querySelectorAll('button[accesskey][data-target]');
    for(var i = 0; i < accesskey_triggers.length; i++) {
      var btn = accesskey_triggers[i];
      btn.addEventListener('click', (event) => {
        event.preventDefault();
        var btn = document.querySelector(`#${event.target.dataset.target}`);
        document.documentElement.dataset.eventReferrer = 'accesskey';
        btn.click();

        if ( this.debug_focus ) {
          var $console = $("#console");
          if ( $console.length == 0 ) {
            $console = $("<p id='console' style='font-size: 8px; max-width: 18rem; max-height: 9rem; overflow: auto'></p>").appendTo($(".beta--panel"));
          }
          $console.text(document.activeElement ? document.activeElement.outerHTML : '-NA-');
        }

        if ( document.activeElement && 
             IGNORE_FOCUS.indexOf(document.activeElement.localName) >= 0 && 
             document.activeElement.getAttribute('aria-hidden') != 'hidden' && 
             ! document.activeElement.classList.contains('page')
        ) {
          return;
        }
        setTimeout(() => { 
          // this.view.container.focus(); 
          this.view.focus(true);
          if ( reader.debug_focus ) {
            // setTimeout(() => {
            //   console.log("AHOY CONTAINER AFTER", document.activeElement, document.querySelectorAll('.page[tabindex="0"]'));
            // }, 500);
          }
        }, 500);
      })
    }

    window.addEventListener('resize', this._resizer);
  }

  // TODO - REFLECT CURRENT LAYOUT
  _updateLinks(seq) {
    var self = this;

    if ( ! seq ) { seq = this.view.currentLocation(); }
    if ( this.view.name == '2up' ) {
      // this is way more complicated
      var verso = this.view.container.querySelector('.page[tabindex="0"].verso');
      var recto = this.view.container.querySelector('.page[tabindex="0"].recto');

      [ [ 'current-recto-seq', recto ], [ 'current-verso-seq', verso ] ].forEach(function(tuple) {
        var span = document.querySelector(`#sidebar [data-slot="${tuple[0]}"]`);
        if ( ! span ) { return ; }
        var page = tuple[1];
        if ( page && page.dataset.seq ) {
          span.innerText = page.dataset.seq;
          span.parentNode.previousElementSibling.disabled = false;
        } else {
          span.innerText = '-';
          span.parentNode.previousElementSibling.disabled = true;
        }
      })

    } else {
      var span = document.querySelector('#sidebar [data-slot="current-seq"]');
      if ( span ) { span.innerText = seq; }
    }
    self._updateLinkSeq(document.querySelector("#pageURL"), seq);
    self._updateLinkSeq(document.querySelector("input[name=seq]"), seq);
    self._updateLinkSeq(document.querySelector("#login-link"), seq);
    self._updateLinkSeq(document.querySelector("#ssd-link"), seq);
    self._updateLinkSeq(document.querySelector("#ssd-link"), seq);

    document.querySelectorAll('a[data-params-seq="true"]').forEach((link) => {
      self._updateLinkSeq(link, seq);
    })

    if ( HT.downloader && HT.downloader.updateDownloadFormatRangeOptions ) {
      HT.downloader.updateDownloadFormatRangeOptions();
    }
  }

  _updateViews(view) {
    var self = this;
    if ( ! view ) { view = this.view.name; }
    self._updateLinkAttribute(document.querySelector("#login-button"), "view", view);
    var inputs = document.querySelectorAll("input[name='view']");
    for(var i = 0; i < inputs.length; i++) {
      inputs[i].value = view;
    }
    $main.dataset.view = $root.dataset.view = view;
    this._updateHistoryUrl({ view: view });
  }

  _updateLinkSeq($link, seq, disabled) {
    if ( ! $link ) { return ; }
    if ( seq == null || disabled == true ) {
      $link.setAttribute('disabled', 'disabled');
      $link.setAttribute('tabindex', -1);
      // $link.classList.add('disabled');
      if ( $link.tagName.toLowerCase() == 'a' ) {
        $link.dataset.href = $link.getAttribute('href');
        $link.setAttribute('href', 'javascript:function() { return false; }');
      }
    } else {
      if ( ! $link.classList.contains('disabled') && $link.getAttribute('disabled') == 'disabled' ) {
        $link.removeAttribute('disabled');
        $link.removeAttribute('tabindex');
        if ( $link.tagName.toLowerCase() == 'a' ) {
          $link.setAttribute('href', $link.dataset.href);
        }
      }
      if ( $link.tagName.toLowerCase() == 'input' && $link.getAttribute("name") == "seq" ) {
          $link.value = seq;
      } else if ( $link.tagName.toLowerCase() == 'input' ) {
          var href = $link.value;
          $link.value = href.replace(/seq=\d+/, "seq=" + seq);
      } else {
          this._updateLinkAttribute($link, "seq", seq);
      }
    }
  }

  _updateHistoryUrl(params) {
    var href = window.location.pathname + location.search;
    var argv = [];
    argv.push(`id=${this.identifier}`);
    argv.push(`view=${params.view || this.view.name}`);
    if ( this.view.format == 'plaintext' ) {
      argv.push(`format=plaintext`);
    }
    argv.push(`seq=${params.seq || HT.params.seq}`);
    if ( HT.params.skin ) { argv.push(`skin=${HT.params.skin}`); }
    // if ( HT.params.prototype ) { argv.push(`prototype=${HT.params.prototype}`); }
    if ( this.options.scale > 1.0 ) { argv.push(`size=${Math.floor(this.options.scale * 100)}`) };
    if ( HT.params.q1 ) { argv.push(`q1=${HT.params.q1}`); }
    if ( HT.params.debug ) { argv.push(`debug=${HT.params.debug}`); }
    if ( HT.params.l11_tracking ) { argv.push(`l11_tracking=${HT.params.l11_tracking}`); }
    if ( HT.params.l11_uid ) { argv.push(`l11_uid=${HT.params.l11_uid}`); }
    if ( HT.params.ui ) { argv.push(`ui=${HT.params.ui}`); }
    var new_href = location.pathname + '?' + argv.join('&');
    var title = document.title;
    if ( ! title.match(/^#/) ) { this._original_title = title; }
    title = `#${params.seq || HT.params.seq} - ${this._original_title}`;
    window.history.replaceState(null, title, new_href);
    document.title = title;
  }

  _updateLinkAttribute($link, key, value) {
    if ( ! $link ) { return ; }
    var href = $link.getAttribute("href");
    var regex = new RegExp(key + "(=|%3D)");
    if ( href.indexOf('#' + key) > -1 ) {
        regex = new RegExp('#' + key + '\\d+');
        href = href.replace(regex, '#' + key + value);
        $link.setAttribute('href', href);
    } else if ( ! regex.test(href) ) {
        // key not in href
        var text = key + "=" + value;
        var target_href = href;
        var idx;
        if ( ( idx = target_href.indexOf('target=') ) > -1 ) {
            // extract the target url
            idx += "target=".length;
            target_href = decodeURIComponent(href.substr(idx));
        }
        var sep = ';';
        if ( target_href.indexOf("&") > -1 ) {
            // add to parameters - semicolon
            sep = '&';
        }
        target_href += sep + text;
        if ( idx > -1 ) {
            // re-encode
            target_href = href.substr(0, idx) + encodeURIComponent(target_href);
        }
        $link.setAttribute("href", target_href);
    } else {
        // replace existing key
        regex = new RegExp(key + "(=|%3D)" + "\\w+(;|&|%3B|%26)?");
        $link.setAttribute("href", href.replace(regex, key + "$1" + value + "$2"));
    }
  }

  _bestFitScale() {
    var scale = ( ( $(window).width() * 0.95 ) / 680 );
    this.options.bestFitScale = scale;
    return scale;
  }

  _logAction(href, trigger) {
    if ( HT.analytics && HT.analytics.logAction ) {
      HT.analytics.logAction(href, trigger);
    }
  }

}

var service = new Service({
  manifest: {
    readingOrder: $viewer.dataset.readingOrder,
    totalSeq: $viewer.dataset.totalSeq,
    defaultSeq: $viewer.dataset.defaultSeq,
    firstSeq: $viewer.dataset.firstSeq,
    defaultHeight: $viewer.dataset.defaultHeight,
    defaultWidth: $viewer.dataset.defaultWidth,
    featureList: HT.params.featureList // JSON.parse($main.dataset.featureList)
  },
  identifier: HT.params.id,
  q1: HT.params.q1,
  debug: HT.params.debug,
  hasOcr: $viewer.dataset.hasOcr == 'true',
  allowFullDownload: $viewer.dataset.allowFullDownload == 'true'
})
HT.service = service;

reader = new Reader({ identifier: HT.params.id });
reader.$root = $root;
reader.service = service;
HT.reader = reader;
HT.View = View;

// initiate loaders
HT.service.loaders.images = new Loader({ name: 'images' })
      .limit(3)
      .on(Loader.events.LOADED, function(image, datum) {
        if (! image ) { return false; }
        reader.view.postImage(image, datum);
      })
      .on(Loader.events.ERROR, function() {
        console.log("AHOY ERROR", arguments);
      });

HT.service.loaders.thumbnails = new Loader({ name: 'thumbnails' })
      .limit(2)
      .on(Loader.events.LOADED, function(image, datum) {
        if (! image ) { return false; }
        reader.view.postThumbnail(image, datum);
      })
      .on(Loader.events.ERROR, function() {
        console.log("AHOY ERROR", arguments);
      });

$viewer.dataset.readingOrder = service.manifest.options.readingOrder;
$viewer.classList.toggle('reading-order--rtl', $root.dataset.readingOrder == 'right-to-left');

// ADD CONTROLS
reader.controls.layoutinator = new Control.Layoutinator({
  input: {
    tweaker: '#action-tweak-sidebar',
    toggle: '#action-toggle-sidebar',
    $layoutContainer: $main,
    sidebar: '#sidebar'
  },
  reader: reader
});

reader.controls.navigator = new Control.Navigator({
  input: {
    first: '#action-go-first',
    next: '#action-go-next',
    prev: '#action-go-prev',
    last: '#action-go-last',
    sequence: '#output-seq',
    range: '#range-seq'
  },
  reader: reader
});
reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.seq);
  reader.view.display(params.seq);
})


reader.controls.screeninator = new Control.Screeninator({
  input: {
    fullscreen: '#action-toggle-fullscreen'
  },
  reader: reader
});

reader.controls.viewinator = new Control.Viewinator({
  input: {
    view: '#action-select-view',
    accessPlaintext: '#action-switch-view-plaintext'
  },
  reader: reader
});

reader.controls.zoominator = new Control.Zoominator({
  input: {
    zoomin: '.action-zoom-in',
    zoomout: '.action-zoom-out'
  },
  reader: reader
});

reader.controls.minimizer = new Control.Minimizer({
  input: {
    minimizer: '#action-go-minimal'
  },
  reader: reader
});

reader.controls.helpinator = new Control.Helpinator({
  input: {
    trigger: '#action-help'
  },
  reader: reader
})

reader.controls.jumpinator = new Control.Jumpinator({
  input: {
    prompt: '#action-jump-to-page',
    sections: '#panel-sections'
  },
  reader: reader
})

if ( reader.service.hasOcr ) {
  reader.controls.searchinator = new Control.Searchinator({
    input: {
      form: '.d--search-form',
      container: '#panel-search .results-container'
    },
    reader: reader
  });  

  reader.controls.searchinator.on('update', (params) => {
    HT.params.q1 = params.q1;
    reader.service.q1 = HT.params.q1;
    reader._updateHistoryUrl({});
    reader.view.resetHighlightIndex();
    reader.view.container.querySelectorAll('.page[data-loaded="true"]').forEach((page) => {
      if ( ! params.q1 ) {
        reader.view._removeHighlights(page);
      } else {
        const html_url = reader.service.html({ seq: page.dataset.seq });
        reader.service.loaders.images.queue({ src: html_url, page: page, mimetype: 'text/html', redraw: true });
      }
    })
    reader.service.loaders.images.start();
  });
}


if ( reader.service.allowFullDownload ) {
  reader.controls.selectinator = new Control.Selectinator({
    reader: reader,
    input: document.querySelector('#download-selected-pages-output'),
    // link: selectedPagesPdfLink,
    reset: document.querySelector('#action-clear-selection')
  });
}

// analytics
reader.on('track', () => {
  if ( HT.analytics && HT.analytics._simplifyPageHref ) {
    HT.analytics.trackPageview(HT.analytics._simplifyPageHref(location.href));
  }
  reader._logAction(undefined, reader.trigger.pop());
})

document.body.addEventListener('keydown', function(event) {
  if ( event.key == 'Tab' && 
    ! event.shiftKey && 
    reader.view && 
    document.activeElement == reader.view.container ) {
    event.preventDefault();
    reader.view.focus(true);
  }

  if ( reader.view && ( event.key == 'PageUp' || event.key == 'PageDown' ) ) {
    if ( document.activeElement.closest("#sidebar") ) { return ; }
    if ( document.activeElement.closest(".d--reader") ) { return ; }
    event.preventDefault;
    reader.view.focus(true);
    var t = reader.view.container.parentNode.scrollTop;
    var h = reader.view.container.parentNode.offsetHeight;
    reader.view.container.parentNode.scrollTop += h;
    return;
  }
})

HT.utils = HT.utils || {};
HT.utils.handleOrientationChange = function(ignore) {
  const isEmbed = HT.params && HT.params.ui == 'embed';
  if ( window.innerWidth < 800 && ! isEmbed ) {
    if ( window.orientation && Math.abs(window.orientation) == 90 && HT.reader.service.manifest.totalSeq > 1 ) {
      // enable the 2up button
      HT.reader.controls.viewinator.enable('2up');
    } else {
      // disable the 2up and switch views
      HT.reader.controls.viewinator.disable('2up');
      if ( reader.view && reader.view.name == '2up' && ignore !== true ) {
        HT.reader.restart({ view: '1up', scale: 1.0 });
      } else {
        HT.params.view = '1up';
      }
    }
  }
}

if ( HT.params.ui && HT.params.ui == 'embed' && HT.params.view == 'default' ) {
  if ( window.innerWidth > window.innerHeight ) {
    HT.params.view = '2up';
  }
}
if ( HT.params.view == 'default' ) { HT.params.view = '1up'; }
if ( HT.params.view == 'plaintext' ) {
  HT.params.view = 'page';
  HT.params.format = 'plaintext';
}
if ( HT.params.view == 'image' ) {
  HT.params.view = 'page';
  HT.params.format = 'image';
}
if ( reader.service.manifest.totalSeq == 1 ) {
  if ( HT.params.view == '2up' || HT.params.view == 'thumb' ) {
    HT.params.view = '1up';
  }
}

if ( isEtas && HT.params.format == 'plaintext' && HT.params.view == '1up' ) { HT.params.view = 'page'; }

var validViews = [ '1up', '2up', 'thumb', 'page' ];
if ( validViews.indexOf(HT.params.view) < 0 ) { HT.params.view = '1up'; }

var validFormats = [ 'plaintext', 'image' ];
if ( HT.params.format && validFormats.indexOf(HT.params.format) < 0 ) { HT.params.foramt = 'image'; }

// BETA HANDLING
HT.prefs.set({ pt: { skin: '2021' }});
if ( window.hj ) { hj('tagRecording', [ `PT 2021` ]) };
const betaLink = document.querySelector('a.action-beta-2019');
if ( betaLink )
  betaLink.addEventListener('click', (event) => {
  if ( window.hj ) { hj('tagRecording', [ `PT 2021 -> 2019` ]) };
  if ( reader.view.name == 'page' ) {
    HT.prefs.set({ pt: { view: reader.view.format == 'image' ? 'image' : 'plaintext' }});
  }
})

// start the reader when all resources have been loaded
let scale = 1.0;
window.addEventListener('load', (event) => {
  HT.utils.handleOrientationChange(true);
  reader.start({ view: HT.params.view || '1up', seq: HT.params.seq || 10, scale: scale, format: HT.params.format || 'image' });
  setTimeout(() => {
      var event = document.createEvent('UIEvents');
      event.initEvent('resize', true, false, window, 0);
      window.dispatchEvent(event)
  }, 100);
})

// apparently we still need this?
const _scrollCheck = debounce(function(event) {
  if ( window.visualViewport && window.visualViewport.scale == 1 ) {
    const activeElement = document.activeElement.closest("input,select");
    if ( activeElement ) { return ; }
    window.scrollTo(0,0);
  }
}, 50);
if ( true || ! ( $("html").is(".mobile") && $("html").is(".ios") ) ) {
  window.addEventListener('scroll', _scrollCheck);
}

// ERROR TRACKING
HT.post_error = function(event) {
  const response = fetch('/cgi/pt/error', {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      message: event.message,
      filename: event.filename,
      lineno: event.lineno,
      colno: event.colno,
      error: event.error,
      trace: event.error ? event.error.stack : null,
      htid: HT.params.id,
      view: HT.params.view,
      seq: HT.params.seq,
      skin: 2021,
      imgsrv_url: event.imgsrv_url
    })
  })
}

/* WINDOW HANDLERS */

function handleVisibilityChange() {
  if (document.hidden) {
    handleWindowBlur();
  } else  {
    handleWindowFocus();
  }
}

function handleWindowFocus() {
  if ( window.inactivated ) {
    window.inactivated = false;
    window.reactivated = true;
    setTimeout(function() {
      window.reactivated = false;
    }, 500)
  }
}

function handleWindowBlur() {
  window.inactivated = true;
  window.reactivated = false;
}

document.addEventListener("visibilitychange", handleVisibilityChange, false);
window.addEventListener("focus", handleWindowFocus, false);
window.addEventListener("blur", handleWindowBlur, false);

window.addEventListener('error', function(event) {
  if ( event.message.toLowerCase().indexOf('script error') > -1 ) {
    return;
  }
  HT.post_error(event);
})

window.addEventListener('unhandledrejection', function(event) {
  var reason = event.reason;
  if ( ! reason ) { return ; }
  HT.post_error({
    message: reason.message,
    filename: reason.fileName,
    lineno: reason.lineNumber,
    colno: reason.columnNumber,
    error: {
      stack: reason.stack
    }
  });
});

