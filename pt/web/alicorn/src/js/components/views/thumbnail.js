import {Scroll} from './scroll';

export var Thumbnail = class extends Scroll {
  constructor(options={}) {
    super(options);
    this.mode = 'thumbnail';
    this.scale = 0.25;
    this.embedHtml = false;
  }
};