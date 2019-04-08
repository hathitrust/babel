import {Scroll} from './scroll';

export var Thumbnail = class extends Scroll {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    // this.scale = 0.25;
    this.scale = 1.0;
    this.embedHtml = false;
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

  bindPageEvents(page) {
    var self = this;
    super.bindPageEvents(page);
    page.addEventListener('click', function(event) {
      console.log("AHOY CLICK", this.dataset.seq);
      self.reader.restart({ view: '1up', seq: this.dataset.seq });
    })
  }

  config() {
    var retval = super.config();
    retval.zoom = false;
    retval.rotate = false;
    return retval;
  }

};