
import NanoEvents from 'nanoevents';
import {Control} from './components/controls';
import {Service} from './components/imgsrv';
import {View} from './components/views';

import debounce from 'lodash/debounce';

var HT = window.HT || {}; window.HT = HT;
var $root = document.querySelector('main');
var $main = document.querySelector('section#section');
var $viewer = $main.querySelector('.viewer');
var $inner = $viewer.querySelector('.viewer-inner');
var $status = document.querySelector('div[role="status"]');

var $toolbar = $main.querySelector('#toolbar-vertical');

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
    this.bindEvents();
  }

  start(params, cb) {
    if ( cb === undefined ) {
      cb = function() {
        this.emit('ready', this.view.name);
        $viewer.classList.remove('viewer--setup');
        this.view.display(params.seq || 1);
      }.bind(this);
    } else {
      var original_cb = cb;
      cb = function() {
        this.emit('ready', this.view.name);
        $viewer.classList.remove('viewer--setup');
        original_cb();
      }.bind(this);
    }

    $viewer.classList.add('viewer--setup');

    if ( params.view ) {
      $main.dataset.view = params.view; $main.classList.add(`view--${params.view}`);

      if ( params.restarting ) {
        this.emit('status', `Switching to ${params.view} view`);
      }
    }
    if ( params.scale ) { this.options.scale = params.scale; }
    this.setView({ view: $main.dataset.view });
    setTimeout(function() {
      console.log("AHOY AHOY $inner.view timeout", $inner.offsetHeight);
      var t0 = performance.now();
      this.view.attachTo($inner, cb);
      var t1 = performance.now();
      console.log(`BENCHMARK attachTo ${t1 - t0}`);
      // this.emit('ready', this.view.mode);
    }.bind(this), 0);
  }

  restart(params) {
    var current = params.seq || this.view.currentLocation();

    if ( params.view == this.view.name && params.view == 'plaintext' ) { params.view = '1up'; }
    if ( params.view == this.view.name ) { return ; }

    params.restarting = true;

    if ( this.view ) { $main.classList.remove(`view--${this.view.name}`); this.view.destroy(); this.view = null; }
    this.start(params, function() {
      console.log("AHOY TRYING TO GO TO", current);
      this.view.display(current);
    }.bind(this));
  }

  setView(params) {
    var t0 = performance.now();
    var cls = View.for(params.view);
    var t1 = performance.now();
    this.view = new cls({ reader: this, service: this.service, scale: this.options.scale });
    var t2 = performance.now();
    this.emit('configure', this.view.config());
    this._updateViews(params.view);
    console.log(`BENCHMARK setView: ${t2 - t0} / ${t1 - t0} / ${t2 - t1}`);
  }

  next() {
    this.view.next();
  }

  prev() {
    this.view.prev();
  }

  first() {
    this.view.first();
  }

  last() {
    this.view.last();
  }

  display(seq) {
    this.view.display(seq);
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
    this.on('status', (message) => {
      if ( lastMessage != message ) {
        if ( statusTimer ) { clearTimeout(statusTimer); statusTimer = null; }
        setTimeout(() => {
          $status.innerText = message;
          lastMessage = message;
          console.log("-- status:", message);
        }, 50);
        statusTimer = setTimeout(() => {
          $status.innerText = '';
        }, 500);
      }
    });

    this.on('relocated', (params) => {
      var href = window.location.pathname + location.search;
      var argv = [];
      argv.push(`id=${this.identifier}`);
      argv.push(`view=${this.view.name}`);
      argv.push(`seq=${params.seq || HT.params.seq}`);
      if ( HT.params.skin ) { argv.push(`skin=${HT.params.skin}`); }
      if ( this.options.scale != 1.0 ) { argv.push(`size=${Math.floor(this.options.scale * 100)}`) };
      if ( HT.params.debug ) { argv.push(`debug=${HT.params.debug}`); }
      if ( HT.params.l11_tracking ) { argv.push(`l11_tracking=${HT.params.l11_tracking}`); }
      if ( HT.params.l11_uid ) { argv.push(`l11_uid=${HT.params.l11_uid}`); }
      var new_href = location.pathname + '?' + argv.join('&');
      window.history.replaceState(null, document.title, new_href);

      // legacy
      HT.params.seq = params.seq;
      HT.params.view = this.view.name;

      this._updateLinks(params.seq);
      this.emit('track');
    });

    this.on('relocated', (params) => {
      this.emit('status', `Showing page scan ${params.seq}`);
    })

    this._resizer = debounce(function() {
      this.emit('resize');
    }.bind(this), 100);

    var jump = document.querySelector('#action-focus-current-page');
    jump.addEventListener('click', (event) => {
      event.preventDefault();
      this.view.focus(true);
      console.log("AHOY FOCUS CURRENT PAGE");
      return false;
    })

    window.addEventListener('resize', this._resizer);
  }

  _updateLinks(seq) {
    var self = this;
    if ( ! seq ) { seq = this.view.currentLocation(); }
    if ( this.view.name == '2up' ) {
      // this is way more complicated
      var verso = this.view.container.querySelector('.slice[data-visible="true"] .page.verso');
      var recto = this.view.container.querySelector('.slice[data-visible="true"] .page.recto');
      self._updateLinkSeq(document.querySelector(`#pagePdfLink1`), verso ? verso.dataset.seq : null);
      self._updateLinkSeq(document.querySelector(`#pagePdfLink2`), recto ? recto.dataset.seq : null);
    } else {
        var $link = document.querySelector("#pagePdfLink");
        self._updateLinkSeq($link, seq);
    }
    self._updateLinkSeq(document.querySelector("#pageURL"), seq);
    self._updateLinkSeq(document.querySelector("input[name=seq]"), seq);
    self._updateLinkSeq(document.querySelector("#login-link"), seq);
    self._updateLinkSeq(document.querySelector("#ssd-link"), seq);
  }

  _updateViews(view) {
    var self = this;
    if ( ! view ) { view = this.view.name; }
    self._updateLinkAttribute(document.querySelector("#login-button"), "view", view);
    var inputs = document.querySelectorAll("input[name='view']");
    for(var i = 0; i < inputs.length; i++) {
      inputs[i].value = view;
    }
    $root.dataset.view = view;
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

}

var service = new Service({
  manifest: {
    readingOrder: $main.dataset.readingOrder,
    totalSeq: $main.dataset.totalSeq,
    defaultSeq: $main.dataset.defaultSeq,
    firstSeq: $main.dataset.firstSeq,
    defaultHeight: $main.dataset.defaultHeight,
    defaultWidth: $main.dataset.defaultWidth,
    featureList: JSON.parse($main.dataset.featureList)
  },
  identifier: HT.params.id,
  q1: HT.params.q1,
  hasOcr: $main.dataset.hasOcr == 'true'
})
HT.service = service;

var reader = new Reader({ identifier: HT.params.id });
reader.service = service;
HT.reader = reader;
HT.View = View;

$main.dataset.readingOrder = service.manifest.options.readingOrder;
$main.classList.toggle('reading-order--rtl', $main.dataset.readingOrder == 'right-to-left');

var is_active = false;
var scale = 0.75;
var image_width = 680;

reader.controls.navigator = new Control.Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator .output'),
  prompt: document.querySelector('#action-prompt-seq'),
  form: document.querySelector('#form-go-page'),
  reader: reader
})

reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.seq);
  reader.view.display(params.seq);
})

reader.controls.paginator = new Control.Paginator({
  input: document.querySelector('#toolbar-horizontal'),
  reader: reader
});

reader.controls.viewinator = new Control.Viewinator({
  input: document.querySelector('.action-views'),
  reader: reader
});

reader.controls.zoominator = new Control.Zoominator({
  input: document.querySelector('.action-zoom'),
  reader: reader
})

reader.controls.rotator = new Control.Rotator({
  input: document.querySelector('.action-rotate'),
  reader: reader
})
reader.controls.rotator.on('rotate', function(delta) {
  this.emit('rotate', delta);
}.bind(reader))

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

var selectedPagesPdfLink = document.querySelector('#selectedPagesPdfLink');
if ( selectedPagesPdfLink ) {
  reader.controls.selectinator = new Control.Selectinator({
    reader: reader,
    input: document.querySelector('.table-of-selections'),
    link: selectedPagesPdfLink,
    reset: document.querySelector('#action-clear-selection')
  });
} else {
  document.querySelector('.table-of-selections').querySelector('button').disabled = true;
}

var _scrollCheck = debounce(function() {
  window.scrollTo(0,0);
}, 50);
window.addEventListener('scroll', _scrollCheck);

$main.dataset.selected = 0;

reader.on('track', () => {
  if ( HT.analytics ) {
    HT.analytics.trackPageview(HT.analytics._simplifyPageHref(location.href));
  }
})

document.body.addEventListener('keydown', function(event) {
  var IGNORE_TARGETS = [ 'input', 'textarea' ];
  if ( IGNORE_TARGETS.indexOf(event.target.localName) >= 0 ) {
    return;
  }
  if ( event.key == 'ArrowLeft' ) {
    reader.prev();
  } else if ( event.key == 'ArrowRight' ) {
    reader.next();
  }
})

var scale = 1.0;
if ( HT.params.size  ) {
  var size = parseInt(HT.params.size, 10);
  if ( ! isNaN(size) ) {
    var value = size / 100.0;
    if ( reader.controls.zoominator.check(value) ) {
      scale = value;
    }
  }
}

reader.start({ view: HT.params.view || '1up', seq: HT.params.seq || 10, scale: scale });

HT.mobify = function() {
  $("header").hide();
  $("footer").hide();
  $('.sidebar-container').hide();
  $("#toolbar-vertical").hide();
  $("#toolbar-horizontal").hide();
  reader.emit('resize');
}

var daInterval;
HT.debugActive = function() {
  if ( daInterval ) {
    clearInterval(daInterval);
    daInterval = null;
  } else {
    daInterval = setInterval(function() {
      console.log(document.activeElement)
    }, 1000);
  }
}

/* AND THE WINDOW */


