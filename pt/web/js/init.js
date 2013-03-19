

// define a namespace
var HT = HT || {};
HT.config = HT.config || {};

// bookreader utility
// seed hash based on URL parameters as needed
HT.init_from_params = function() {
    if ( ! window.location.hash ) {
      var hash = "mode/" + HT.params.view;
      if ( typeof(HT.params.seq) != 'undefined' ) {
        hash = "page/n" + HT.params.seq + "/" + hash;
      }
      window.location.hash = "#" + hash;
    }
}

HT.track_pageview = function(args) {
  var url;
  if ( args.url ) {
    url = args.url;
  } else {
    if ( window.location.hash ) {
      args = $.extend({}, { colltype : window.location.hash.substr(1) }, args);
    }
    var params = $.param(args);
    if ( params ) { params = "?" + params; }
    url = window.location.pathname + params;
  }
  if ( pageTracker != null ) {
    var fn = function() {
        try {
            pageTracker._trackPageview(url);
        } catch(e) { console.log(e); }
    };
    
    if ( args.title ) {
      _gaq.push(function() { window.oldtitle = document.title; document.title = args.title; });
    }
    _gaq.push(fn);
    if ( args.title ) {
      _gaq.push(function() { document.title = window.oldtitle; });
    }
  }
}


HT.track_event = function(args, async) {
    args = $.extend({}, { category : 'PT' }, args)
    // has to be sync?
    async = true;
    if ( pageTracker != null ) {

        if ( args.label == null ) {
            var params = ( HT.reader != null ) ? HT.reader.paramsForTracking() : HT.params;
            args.label = params.id + " " + params.seq + " " + params.size + " " + params.orient + " " + params.view;
        }

        var fn = function() {
            try {
                pageTracker._trackEvent(args.category, args.action, args.label);
            } catch(e) { console.log(e); }

            // // local tracking
            // $.ajax({
            //     url : "/cgi/feedback",
            //     data : { category : args.category, action : args.action, label : args.label },
            //     error : function(xhr, textStatus, err) {
            //         console.log("ERROR", textStatus, "/", err);
            //         return false;
            //     },
            //     success : function(data, textStatus, xhr) {
            //     },
            //     async : async
            // })
            // console.log(args);
        };
        
        if ( async ) {
            _gaq.push(fn);
        } else {
            fn();
        }
        
    }
}

head.ready(function() {
  
    $.ajaxSetup({
      cache: false
    });  

    // bind click events
    $(".tracked").click(function(e) {
        var label = $(this).data('tracking-label');
        var category = $(this).data('tracking-category') || 'PT';
        var action = $(this).data('tracking-action');
        
        HT.track_event({ label : label, category : category, action : action });
        
        if ( $(this).hasClass("dialog") ) {
            return false;
        }
        
        // return true so click event bubbles to any other
        // event handlers; will be set to false on the exceptions
        var retval = true;

        if ( HT.reader == null || ! $(this).hasClass("interactive") ) {
            // delay events that change the current document so the
            // tracking beacon can be relayed
            
            if ( $(this).is("a") ) {
                if ( $(this).attr('target') ) {
                  return true;
                }
                retval = false;
                var href = $(this).attr('href');
                setTimeout(function() {
                    window.location.href = href;
                }, 500);
            } else if ( $(this).is("input[type=submit]") ) {
                var frm = $(this).parents("form");
                retval = false;
                var events = $.data(frm.get(0), 'events');
                if ( events && events.submit == undefined ) {
                  setTimeout(function() {
                      frm.submit();
                  }, 500);
                } else {
                  return true;
                }
            }
        }
        
        return retval;
        
    })
})

// $(document).ready(function() {
//   $.get("/pt/bookreader/BookReader/images/transparent.png", 
//     { 
//       width : $(window).width(),
//       height : $(window).height(),
//       screen_width : screen.width,
//       screen_height : screen.height
//     }
//   )
// })

// HEADER FIELD
head.ready(function() {
  // update header search field
  var $html = $("html");
  var q1 = $html.data('search-q1');
  var searchtype = $html.data('search-searchtype');
  var target = $html.data('search-target');
  var ft = $html.data('search-ft') || null;
  if ( q1 ) {
    $(".search-form").find("input[name=q1]").val(q1)
      .end().find(".search-input-select").val(searchtype)
      .end().find("input[name=ft]").attr('checked', ft)
      .end().find("input[name=target][value=" + target + "]").click()
  }

})

