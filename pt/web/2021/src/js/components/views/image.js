import { createNanoEvents } from 'nanoevents';
import {Base} from './base';

export var Single = class extends Base {
  constructor(options={}) {
    super(options);
    this.mode = 'image';
    this.name = 'image';
    this.displayLabel = 'page by page';
    this.embedHtml = true;
    this.isAnimating = false;
    this.useAnimations = true;
    this._queue = [];
  }

  display(seq) {
    var self = this;

    seq = parseInt(seq, 10);

    if ( seq == this.currentSeq ) { return ; }
    if ( this.getPage(seq).dataset.visible == 'true' ) { return ; }

    var currentPage; var targetPage;
    if ( this.currentSeq ) {
      currentPage = this.container.querySelector(`.page[data-seq="${this.currentSeq}"]`);
    }

    var targetPage = this.container.querySelector(`.page[data-seq="${seq}"]`);
    if ( ! targetPage ) { return; }

    this.loadImage(targetPage);

    var delta = this.currentSeq < seq;
    this._queue.push([ seq, currentPage, targetPage, delta ]);

    this.currentSeq = seq;

    this._processQueue();
  }

  _processQueue() {
    var self = this;

    if ( ! this._queue.length ) { return; }

    if ( this.isAnimating ) {
      console.log("-- _processQueue: postponing", this._queue[0][0]);
      setTimeout(() => { this._processQueue() }, 100);
      return;
    }

    this.isAnimating = true;
    console.log("-- _processQueue: processing", this._queue[0][0]);

    var tuple = this._queue.shift();
    var seq = tuple[0];
    var currentPage = tuple[1];
    var targetPage = tuple[2];
    var delta = tuple[3];

    targetPage.dataset.visible = true;

    var currentPages = document.querySelectorAll('.page[data-visible="true"]');

    if ( ! currentPages || ! currentPages.length || ! this._initialized ) { 
      self.focus(targetPage);
      self.reader.emit('relocated', { seq: self.currentSeq });
      self.isAnimating = false;
      return ; 
    }

    var inClass = delta > 0 ? 'page--moveFromRight' : 'page--moveFromLeft';
    var outClass = delta > 0 ? 'page--moveToLeft' : 'page--moveToRight';
    outClass = 'page--fade';

    var endCurrentPage = false;
    var endTargetPage = false;

    var onEndAnimation = function(currentPages, targetPages) {
      // console.log("-- onEndAnimation", currentPages, targetPages);
      endTargetPage = false;
      endCurrentPage = false;
      currentPages.forEach((page) => { 
        // console.log("-- onEndAnimation currentPages", page.dataset.seq,self.sets.visible.has(parseInt(page.dataset.seq, 10)) );
        page.classList.remove(outClass); 
        if ( page.dataset.seq == self.currentSeq ) { return ; }
        // if ( self.sets.visible.has(parseInt(page.dataset.seq, 10)) ) { page.dataset.visible = true; return ; }
        page.dataset.visible = false; 
        // page.classList.remove(outClass, otherClass); 
        self.unfocus(page);
      }) 
      targetPage.classList.remove(inClass);
      targetPage.dataset.visible = true;
      targetPage.classList.remove(inClass);
      self.focus(targetPage);

console.log("-- onEndAnimation", self._queue.length, currentPages, targetPages);

      self.container.classList.remove('animating');
      self.isAnimating = false;

      self.reader.emit('relocated', { seq: self.currentSeq });
    }

    var outAnimationHandler = function(event) {
      currentPages.forEach((page) => { page.removeEventListener('animationend', outAnimationHandler); });
      endCurrentPage = true;
      // console.log("-- outAnimationHandler", endCurrentPage, endTargetPage);
      if ( endTargetPage ) { onEndAnimation(currentPages, targetPage); }
    }
    var inAnimationHandler = function(event) {
      targetPage.removeEventListener('animationend', inAnimationHandler);
      endTargetPage = true;
      // console.log("-- inAnimationHandler", endCurrentPage, endTargetPage);
      if ( endCurrentPage ) { onEndAnimation(currentPages, targetPage); }      
    }

    if ( window.matchMedia('(prefers-reduced-motion)').matches ) {
      onEndAnimation(currentPages, targetPage);
    } else {
      this.container.classList.add('animating');
      currentPages.forEach((page) => { page.addEventListener('animationend', outAnimationHandler); });
      targetPage.addEventListener('animationend', inAnimationHandler);

      currentPage.classList.add(outClass);
      targetPage.classList.add(inClass);      
    }

    this.visible(targetPage);
  }

  currentLocation() {
    return this.currentSeq;
  }

  next() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq + 1);
  }

  prev() {
    this.container.scrollTop = 0;
    this.display(this.currentSeq - 1);
  }

  bindEvents() {
    var self = this;

    super.bindEvents();

    // this._clickHandler = this.clickHandler.bind(this);
    // this.container.addEventListener('click', this._clickHandler);

    // this._handlers.rotate = this.reader.on('rotate', function(delta) {
    //   var seq = self.currentLocation();
    //   self.service.manifest.rotateBy(seq, delta);
    //   self.redrawPage(seq);
    // });

    this._handlers.rotate = this.reader.on('rotate', function(delta) {
      var seq = self.currentSeq; // self.currentLocation();
      var page = self.pagesIndex[seq];
      var image_frame = page.querySelector('.image');

      var rotated = parseInt(page.dataset.rotated || 360, 10);
      rotated += delta;
      rotated = rotated % 360;

      if ( rotated % 90 == 0 ) {
        // set margins!
        var margin = image_frame.clientWidth * 0.8;
        page.style.setProperty('--margin-rotated', ( margin / 2 - margin / 8 ) * -1);
      } else {
        page.style.setProperty('--margin-rotated', null);
      }

      page.dataset.rotated = rotated;
    });

  }

  bindPageEvents(page) {
    page.dataset.visible = false; page.classList.remove('page--visible');
  }

};
