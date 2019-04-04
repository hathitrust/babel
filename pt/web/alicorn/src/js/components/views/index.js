import * as Scroll from './scroll';

var View = class {
  constructor(options={}) {
    this.service = options.service;
    this.reader = options.reader;
    this.scale = options.scale || 1.0;
    this.mode = 'scroll';
    this.emitter = new NanoEvents();
  }
}

View.Scroll = Scroll.View;

export {View};
