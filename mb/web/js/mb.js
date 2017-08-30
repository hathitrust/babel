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
  if ( window.pageTacker !== undefined && window.pageTracker != null ) {
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
    if ( window.pageTracker !== undefined && window.pageTracker != null ) {

        var fn = function() {
            try {
                pageTracker._trackEvent(args.category, args.action, args.label, undefined, true);
            } catch(e) { console.log(e); }
        };
        
        _gaq.push(fn);
    }
}

head.ready(function() {
  $(".form-download-metadata").on('submit', function(e) {
    // e.preventDefault();
    var $form = $(this);
    var $btn = $form.find(".btn-group").css({ opacity: 0.4 });
    $btn.find("button").attr("disabled", "disabled");
    var $progress = $form.find("[data-role=progress]").addClass("active");

    var collid = $("html").data('anlaytics-dimension').replace(/:/g, '').replace('dimension2=', '');
    var cookieName = "download" + collid;

    var downloadTimeout;
    var checkDownloadCookie = function() {
      if ( $.cookie(cookieName, undefined, { json: false }) == 1 ) {
        // $.cookie('downloadStarted', "false");
        $.cookie(cookieName, '', { json: false, expires: -1, path: '/' });
        $progress.removeClass('active');
        $btn.css({ opacity: 1.0 }).find("button").attr('disabled', null);
      } else {
        downloadTimeout = setTimeout(checkDownloadCookie, 1000);
      }
    }

    $.cookie(cookieName, 0, { path: '/' });
    setTimeout(checkDownloadCookie, 1000);
  });

  // SEARCH FORM
  var $form = $("#itemlist_searchform");
  $form.submit(function(event) {
     //check for blank
     var $input = $(this).find("input[name=q1]");
     var query = $input.val();
     query = $.trim(query);
     if (query === '') {
       bootbox.alert("Please enter a search term.");
       $input.trigger('blur');
       return false;
     }

     // check for truncation
     var MIN_CHARS = 3; //minimum number of characters before the truncation operatior can be used
     var msg ="You must have at least " + MIN_CHARS + " characters before using the \"*\"  truncation operator";
     if ( query.indexOf('*') > -1 ) {
        var words = query.split(" ");
        for (i=0; i< words.length;i++){
          //alert( "i is " + i + "word is " +words[i]);
          var wordindex=words[i].indexOf('*');
          if (wordindex !== -1 && wordindex < MIN_CHARS ){
            bootbox.alert(msg);
            $input.trigger('blur');
            return false;
          }
        }
     }
  });
})