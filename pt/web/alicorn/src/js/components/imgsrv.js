import NanoEvents from 'nanoevents';

export var Manifest = class {
  constructor(options={}) {
    this.options = Object.assign({}, options);
    this.totalSeq = parseInt(options.totalSeq, 10);
    this.defaultSeq = parseInt(options.defaultSeq, 10);
    this.firstSeq = parseInt(options.firstSeq, 10);
    this.defaultImage = {
      height: parseInt(options.defaultHeight, 10),
      width: parseInt(options.defaultWidth, 10)
    };
    this.featureList = options.featureList;
    this.featureMap = {};
    this.featureList.forEach(function(item) {
      this.featureMap[item.seq] = item;
    }.bind(this))
  }
}

export var Service = class {
  constructor(options={}) {
    this.manifest = new Manifest(options.manifest);
    this.identifier = options.identifier;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  image(options={}) {
    return `/cgi/imgsrv/image?id=${this.identifier};seq=${options.seq};width=${options.width || 680}`;
  }

  html(options={}) {
    return `/cgi/imgsrv/html?id=${this.identifier};seq=${options.seq}`;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {

  }

};