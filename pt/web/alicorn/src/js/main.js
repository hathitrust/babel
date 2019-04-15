
import NanoEvents from 'nanoevents';
import {Control} from './components/controls';
import {Service} from './components/imgsrv';
import {View} from './components/views';

var HT = window.HT || {}; window.HT = HT;
var $main = document.querySelector('main');
var $viewer = $main.querySelector('.viewer');
var $inner = $viewer.querySelector('.viewer-inner');
console.log("AHOY AHOY $inner", $inner.offsetHeight);

var $toolbar = $main.querySelector('#toolbar-vertical');

var min_height = $viewer.offsetHeight;
var min_width = $viewer.offsetWidth * 0.80;

// if ( $main.dataset.view == 'thumbnail' ) {
//   scale = 0.25;
// }

var Reader = class {
  constructor(options={}) {
    this.options = Object.assign({ scale: 1.0 }, options);
    this.emitter = new NanoEvents();
    this.controls = {};
    this.pagedetails = { rotate: {}, scale: {} };
    this.bindEvents();
  }

  start(params, cb) {
    if ( cb === undefined ) {
      cb = function() {
        this.view.display(params.seq || 1);
      }.bind(this);
    }
    if ( params.view ) {
      $main.dataset.view = params.view;
      console.log("AHOY AHOY $inner.view", $inner.offsetHeight);
      setTimeout(function() {
        console.log("AHOY AHOY $inner.view later", $inner.offsetHeight);
      }, 2000);
    }
    if ( params.scale ) { this.options.scale = params.scale; }
    this.setView({ view: $main.dataset.view });
    setTimeout(function() {
      console.log("AHOY AHOY $inner.view timeout", $inner.offsetHeight);
      this.view.attachTo($inner, cb);
    }.bind(this), 0);
  }

  restart(params) {
    var current = params.seq || this.view.currentLocation();
    if ( this.view ) { this.view.destroy(); this.view = null; }
    this.start(params, function() {
      console.log("AHOY TRYING TO GO TO", current);
      this.view.display(current);
    }.bind(this));
  }

  setView(params) {
    var cls = View.for(params.view);
    this.view = new cls({ reader: this, service: this.service, scale: this.options.scale });
    this.emit('configure', this.view.config());
  }

  next() {
    this.view.next();
  }

  prev() {
    this.view.prev();
  }

  first() {
    this.view.display(1);
  }

  last() {
    this.view.display(this.service.manifest.totalSeq);
  }

  display(seq) {
    this.view.display(seq);
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  emit(event, params={}) {
    this.emitter.emit(event, params);
  }

  bindEvents() {
    /* NOOP */
  }

}

var service = new Service({
  manifest: {
    totalSeq: $main.dataset.totalSeq,
    defaultSeq: $main.dataset.defaultSeq,
    firstSeq: $main.dataset.firstSeq,
    defaultHeight: $main.dataset.defaultHeight,
    defaultWidth: $main.dataset.defaultWidth,
    featureList: JSON.parse($main.dataset.featureList)
  },
  identifier: HT.params.id
})
HT.service = service;

var reader = new Reader({ identifier: HT.params.id });
reader.service = service;
HT.reader = reader;
HT.View = View;

var is_active = false;
var scale = 0.75;
var image_width = 680;

reader.controls.navigator = new Control.Navigator({
  input: document.querySelector('input[type="range"]'),
  output: document.querySelector('.navigator .output'),
  reader: reader
})

reader.controls.paginator = new Control.Paginator({
  input: document.querySelector('#toolbar-horizontal'),
  reader: reader
});

reader.controls.viewinator = new Control.Viewinator({
  input: document.querySelector('.action-views'),
  reader: reader
});

reader.controls.navigator.on('updateLocation', (params) => {
  console.log("AHOY updateLocation", params.seq);
  reader.view.display(params.seq);
})

reader.controls.zoominator = new Control.Zoominator({
  input: document.querySelector('.action-zoom'),
  reader: reader
})

reader.controls.rotator = new Control.Rotator({
  input: document.querySelector('.action-rotate'),
  reader: reader
})
reader.controls.rotator.on('rotate', function(delta) {
  // var seq = this.view.currentLocation();
  // var rotate = this.pagedetails.rotate[seq] || 0;
  // rotate = ( rotate + delta ) % 360;
  // this.pagedetails.rotate[seq] = rotate;
  console.log("AHOY controls.rotator", delta);
  this.emit('rotate', delta);
}.bind(reader))

reader.controls.contentsnator = new Control.Contentsnator({
  input: document.querySelector('.table-of-contents'),
  reader: reader
});

reader.start({ view: '2up', seq: 10 });




