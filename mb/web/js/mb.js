// define a console if not exists
if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

var HT = HT || {};

HT.track_pageview = function(args) {
  if ( window.location.hash ) {
    args = $.extend({}, { colltype : window.location.hash.substr(1) }, args);
  }
  var params = $.param(args);
  if ( params ) { params = "?" + params; }
  if ( pageTracker != null ) {
    var fn = function() {
        try {
            pageTracker._trackPageview(window.location.pathname + params);
        } catch(e) { console.log(e); }
    };
    
    _gaq.push(fn);
  }
}

HT.track_event = function(args) {
    args = $.extend({}, { category : 'MB' }, args)
    if ( pageTracker != null ) {

        var fn = function() {
            try {
                pageTracker._trackEvent(args.category, args.action, args.label, undefined, true);
            } catch(e) { console.log(e); }
        };
        
        _gaq.push(fn);
    }
}