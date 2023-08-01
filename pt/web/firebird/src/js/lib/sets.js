export var setfn = {
  eqSet: function(as, bs) {
    return as.size === bs.size && this.all(this.isIn(bs), as);    
  },

  all: function(pred, as) {
    for (var a of as) if (!pred(a)) return false;
    return true;
  },

  isIn: function(as) {
    return function (a) {
        return as.has(a);
    };    
  }
};