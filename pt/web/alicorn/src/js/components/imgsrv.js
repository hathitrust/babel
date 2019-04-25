import NanoEvents from 'nanoevents';

export var Manifest = class {
  constructor(options={}) {
    this.options = Object.assign({}, options);
    this.totalSeq = parseInt(options.totalSeq, 10);
    this.defaultSeq = parseInt(options.defaultSeq, 10);
    this.firstSeq = parseInt(options.firstSeq, 10);
    this.defaultImage = {
      height: parseInt(options.defaultHeight, 10),
      width: parseInt(options.defaultWidth, 10),
      rotation: 0
    };
    this.featureList = options.featureList;
    this.featureMap = {};
    this._seq2num = {};
    this._num2seq = {};
    this._pageNum = { first: null, last: null };
    this.featureList.forEach(function(item) {
      this.featureMap[item.seq] = item;
      if ( item.pageNum && ! this._seq2num[item.seq] ) {
        this._seq2num[item.seq] = item.pageNum;
        this._num2seq[item.pageNum] = item.seq;
        if ( this._pageNum.first == null ) { this._pageNum.first = item.pageNum; }
        this._pageNum.last = item.pageNum;
      }
    }.bind(this))

    this.manifest = {};
  }

  update(seq, meta) {
    if ( meta.rotation != null && meta.width === undefined ) {
      // just updating rotation
      this.manifest[seq].rotation = meta.rotation;
      return;
    }
    // ... which will help with switching lanes and rotating
    if ( this.manifest[seq] && this.manifest[seq].width ) { return ; }
    var ratio = this.defaultImage.width / meta.width;
    this.manifest[seq] = {
      width: this.defaultImage.width,
      height: meta.height * ratio,
      rotation: meta.rotation || 0
    }
  }

  meta(seq) {
    if ( this.manifest[seq] ) {
      var meta = this.manifest[seq];
      if ( meta.rotation % 180 != 0 ) {
        return { height: meta.width, width: meta.height, rotation: meta.rotation };
      }
      return meta;
    }
    return this.defaultImage;
  }

  rotateBy(seq, delta) {
    var rotation;
    // this shouldn't happen
    if ( ! this.manifest[seq] ) { return; }
    rotation = this.manifest[seq].rotation;
    if ( rotation == 0 ) { rotation = 360; }
    rotation += delta;
    rotation = rotation % 360;
    this.manifest[seq].rotation = rotation;
  }

  checkFeatures(seq, feature) {
    var data = this.featureMap[seq];
    if ( data && data.features ) {
      if ( feature === undefined ) { return data.features.length() > 1 };
      return ( data.features.indexOf(feature) > -1 );
    }
    return false;
  }

  pageNum(seq) {
    var value = this._seq2num[seq];
    if ( value ) { value = `p.${value}`; }
    return value;
  }

  pageNumRange() {
    if ( this._pageNum.first == null ) { return null; }
    return `p.${this._pageNum.first}-p.${this._pageNum.last}`;
  }

  seq(pageNum) {
    return this._num2seq[pageNum];
  }
}

export var Service = class {
  constructor(options={}) {
    this.manifest = new Manifest(options.manifest);
    this.identifier = options.identifier;
    this.q1 = options.q1;
    this.emitter = new NanoEvents();
    this.bindEvents();
  }

  thumbnail(options={}) {
    var width = 250; // one size fits all
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    return `/cgi/imgsrv/thumbnail?id=${this.identifier};seq=${options.seq};width=${width};rotation=${rotation}`;
  }

  image(options={}) {
    var action = 'image'; // options.mode == 'thumbnail' ? 'thumbnail' : 'image';
    var param = this.bestFit(options);
    var meta = this.manifest.meta(options.seq);
    var rotation = meta.rotation || 0;
    return `/cgi/imgsrv/${action}?id=${this.identifier};seq=${options.seq};${param.param}=${param.value};rotation=${rotation}`;
  }

  html(options={}) {
    var url = `/cgi/imgsrv/html?id=${this.identifier};seq=${options.seq}`;
    if ( this.q1 ) {
      url += `;q1=${this.q1}`;
    }
    return url;
  }

  on() {
    return this.emitter.on.apply(this.emitter, arguments)
  }

  bindEvents() {

  }

  bestFit(params) {
    var possibles = [50, 75, 100, 125, 150, 175, 200];
    var retval = {};
    if ( params.width ) {
      retval.param = 'size';
      retval.value = possibles.find(function(possible) {
        var check = 680 * ( possible / 100.0 );
        return params.width <= check;
      })
    } else if ( params.height ) {
      retval.param = 'height';
      retval.value = params.height;
    }
    return retval;
  }

};
