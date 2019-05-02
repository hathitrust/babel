import {Scroll} from './scroll';

export var Thumbnail = class extends Scroll {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    this.name = 'thumb';
    // this.scale = 0.25;
    this.scale = 1.0;
    this.embedHtml = false;
    this.trackResize = false;
  }

  imageUrl(params) {
    if ( params instanceof HTMLElement ) {
      var element = params; params = {};
      params.seq = element.dataset.seq;
      params.width = element.offsetWidth;
    }
    return this.service.thumbnail(params);
  }

  minWidth() {
    // best guess
    return 160;
  }

  bindEvents() {
    super.bindEvents();
    this._clickHandler = this.clickHandler.bind(this);
    this.container.addEventListener('click', this._clickHandler);
  }

  clickHandler(event) {
    var element = event.target;
    if ( element.tagName.toLowerCase() != 'button' ) {
      element = element.closest('.page');
      if ( element ) {
        this.reader.restart({ view: '1up', seq: element.dataset.seq });
      }
    }
  }

  destroy() {
    super.destroy();
    this.container.removeEventListener('click', this._clickHandler);
  }

  config() {
    var retval = super.config();
    retval.zoom = false;
    retval.rotate = false;
    return retval;
  }

};