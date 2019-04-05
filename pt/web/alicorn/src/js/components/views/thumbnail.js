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
    return this.service.thumbnail(params);
  }

  minWidth() {
    // best guess
    return 160;
  }
};