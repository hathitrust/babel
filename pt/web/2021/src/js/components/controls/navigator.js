import { createNanoEvents } from 'nanoevents';

export var Navigator = class {
  constructor(options={}) {
    this.input = options.input;
    this.reader = options.reader;
    this.emitter = createNanoEvents();
    this.bindEvents();
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {
    var self = this;

    this._bindNavigation();
    // this._bindRange();
    this._bindSequence();
    this._bindResize();

    this.reader.on('relocated', (params) => {
      this.sequenceEl.value = params.seq;
      if ( this.rangeEl ) {
        this.rangeEl.value = params.seq;
        this._updateRange();
      }
    })

    this.reader.on('ready', (params) => {
      this._updateNavigationLabels(params);
    })
  }

  _bindNavigation() {
    this.nextEl = document.querySelector(this.input.next);
    this.nextEl.addEventListener('click', (event) => {
      this.reader.trigger.push('action-go-next');
      this.reader.next();      
    })

    this.prevEl = document.querySelector(this.input.prev);
    this.prevEl.addEventListener('click', (event) => {
      this.reader.trigger.push('action-go-prev');
      this.reader.prev();
    })

    this.firstEl = document.querySelector(this.input.first);
    this.firstEl.addEventListener('click', (event) => {
      this.reader.trigger.push('action-go-first');
      this.reader.first();
    })

    this.lastEl = document.querySelector(this.input.last);    
    this.lastEl.addEventListener('click', (event) => {
      this.reader.trigger.push('action-go-last');
      this.reader.last();
    })
  }

  _updateNavigationLabels(view) {
    if ( ! this.reader.isRTL ) { return ; }
    [ this.firstEl, this.nextEl, this.prevEl, this.lastEl ].forEach((el) => {
      let currentLabel = el.getAttribute('aria-label');
      let newLabel;
      if (this.reader.view.isRTL && currentLabel != el.dataset.labelRtl) {
        if ( ! el.dataset.unflippedLabel ) {
          el.dataset.unflippedLabel = currentLabel;
        }
        newLabel = el.dataset.labelRtl;
      } else {
        if (el.dataset.unflippedLabel && currentLabel != el.dataset.unflippedLabel) {
          newLabel = el.dataset.unflippedLabel;
        }
      }
      if ( newLabel ) {
        el.setAttribute('aria-label', newLabel);
        if (el._tippy) { el._tippy.setContent(newLabel) };
      }
    })

  }

  _bindRange() {

    const rangeEl = this.rangeEl = document.querySelector(this.input.range);

    const isIE = window.navigator.userAgent.indexOf("Trident/") > -1;
    this.isRTL = rangeEl.getAttribute('dir') == 'rtl';

    rangeEl.addEventListener('change', (event) => {
      if ( self._mouseDown ) { 
        if ( isIE ) { self._updateRange(false); }
        return;
      }
      this.updateLocation(rangeEl);
    })

    rangeEl.addEventListener('input', (event) => {
      if ( self._keyDown ) { self._keyDown = false; return; }
      this._updateRange();
    })

    rangeEl.addEventListener("mousedown", function(event){
        self._mouseDown = true;
    }, false);
    rangeEl.addEventListener("mouseup", function(){
        self._mouseDown = false;
        if ( isIE ) { self._change(); return; }
        self._updateRange();
    }, false);

    const isTouchDevice = 'ontouchstart' in document.documentElement;
    if ( isTouchDevice ) {
      rangeEl.addEventListener('touchstart', (event) => {
        self._mouseDown = true;
      })

      rangeEl.addEventListener("touchend", function(event){
        self._mouseDown = false;
        if ( isIE ) { self._change(); return; }
        self._updateRange();
      }, false);
    }

    rangeEl.addEventListener("keydown", function(event) {
      if ( event.key == 'ArrowLeft' || event.key == 'ArrowRight' ) {
        self._keyDown = true;
      }
    }, false);
  }

  _bindSequence() {

    const sequenceEl = this.sequenceEl = document.querySelector(this.input.sequence);

    var capture_value = function(event) {
      sequenceEl.dataset.value = sequenceEl.value;
    }
    sequenceEl.addEventListener('click', capture_value, false);
    sequenceEl.addEventListener('focus', capture_value, false);

    var handle_change = function(event) {
      if ( event.type == 'keydown' ) {
        if ( ! ( event.key == 'Enter' || event.key == 'Return' || event.key == 'ArrowUp' || event.key == 'ArrowDown' ) ) {
          return;
        }
        event.preventDefault();
        event.stopPropagation();
      }
      var value = sequenceEl.value;
      if ( value.match(/^\d+$/) ) { 
        value = parseInt(value, 10);
        if ( event.type == 'keydown' ) {
          if ( event.key == 'ArrowDown' ) {
            value -= 1;
            if ( value < 0 ) { value = sequenceEl.dataset.max; }
          } else if ( event.key == 'ArrowUp' ) {
            value += 1;
            if ( value > this.reader.service.manifest.totalSeq ) { value = 1; }
          }
        }
        value = '#' + value; 
      }
      if ( ! this.handleValue(value) ) {
        sequenceEl.value = sequenceEl.dataset.value;
      }
    }.bind(this);

    sequenceEl.addEventListener('blur', handle_change);
    sequenceEl.addEventListener('keydown', handle_change);
  }

  _bindResize() {

    if ( window.ResizeObserver ) {
      const toolbar = document.querySelector(this.input.toolbar);
      const resizeObserver = new ResizeObserver(entries => {
        for(let entry of entries) {
          console.log("--", entry, entry.target, entry.target.offsetWidth);
          const offsetWidth = entry.target.offsetWidth;
          if ( offsetWidth >= 770 ) {
            if ( this.rangeEl ) { this.rangeEl.parentElement.style.display = null; }
            this.firstEl.style.display = null;
            this.lastEl.style.display = null;
          } else if ( offsetWidth < 550  ) {
            this.firstEl.style.display = 'none';
            this.lastEl.style.display = 'none';            
            if ( this.rangeEl ) { this.rangeEl.parentElement.style.display = 'none'; }
          } else if ( offsetWidth < 770 ) {
            this.firstEl.style.display = null;
            this.lastEl.style.display = null;            
            if ( this.rangeEl ) { this.rangeEl.parentElement.style.display = 'none'; }
          }
        }
      })      
      resizeObserver.observe(this.reader.$root);
    }

  }

  updateLocation(el) {
    this.reader.trigger.push(`control-navigator-${el.type}`);
    this.emitter.emit('updateLocation', { seq: el.value, trigger: `control-navigator-${e.type}` });
  }

  _updateRange() {
    this.sequenceEl.value = this.rangeEl.value;
    this._updateRangeBackground();
    var value = parseFloat(this.rangeEl.value, 10);
    var current_location = value;
    var current_page = '';

    var max = parseFloat(this.rangeEl.max, 10);
    var percentage = Math.floor((( value / max ) * 100.0))
    this.rangeEl.setAttribute('aria-valuenow', value);
    this.rangeEl.setAttribute('aria-valuetext', `${current_location}/${this.input.max}`);
  }

  _updateRangeBackground() {
    var val = parseInt(this.rangeEl.value, 10);
    var total = parseInt(this.rangeEl.max, 10);
    var p = Math.ceil(( ( val - 1 ) / ( total - 1 ) ) * 100);
    var fill = '#ff9f1a';
    var end = '#444';
    var dir = this.isRTL ? 'left' : 'right';
    this.rangeEl.style.background = `linear-gradient(to ${dir}, ${fill} 0%, ${fill} ${p}%, ${end} ${p}%, ${end} 100%)`;
  }

  handleValue(value) {
    var seq; var retval = true;
    if ( value.substr(0, 1) == '+' || value.substr(0, 1) == '-' ) {
      var delta = value.substr(0, 1) == '+' ? +1 : -1;
      value = parseInt(value.substr(1), 10);
      this.reader.trigger.push('action-navigator-seq');
      this.reader.jump(delta * value);
      return true;
    }

    if ( value.substr(0, 2) == 'p.' ) {
      // sequence
      seq = this.reader.service.manifest.seq(value.substr(2).trim());
    } else if ( value.substr(0, 1) == 'p' ) {
      seq = this.reader.service.manifest.seq(value.substr(1).trim());
    } else if ( value.substr(0, 1) == '#' || value.substr(0, 1) == 'n' ) {
      seq = parseInt(value.substr(1), 10);
    } else {
      // seq = parseInt(value, 10);
      seq = this.reader.service.manifest.seq(value);
    }
    if ( seq && seq >= 1 && seq <= this.reader.service.manifest.totalSeq ) {
      this.reader.trigger.push('action-navigator-seq');
      this.reader.display(seq);
    } else {
      retval = false;
    }
    return retval;
  }

}
