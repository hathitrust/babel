if(!Array.indexOf){
  Array.prototype.indexOf = function(obj){
   for(var i=0; i<this.length; i++){
    if(this[i]==obj){
     return i;
    }
   }
   return -1;
  }
}

// add Array.reduce if necessary

if (!Array.prototype.reduce)
{
  Array.prototype.reduce = function(fun /*, initial*/)
  {
    var len = this.length;
    if (typeof fun != "function")
      throw new TypeError();

    // no value to return if no initial value and an empty array
    if (len == 0 && arguments.length == 1)
      throw new TypeError();

    var i = 0;
    if (arguments.length >= 2)
    {
      var rv = arguments[1];
    }
    else
    {
      do
      {
        if (i in this)
        {
          rv = this[i++];
          break;
        }

        // if array contains no values, no initial value to return
        if (++i >= len)
          throw new TypeError();
      }
      while (true);
    }

    for (; i < len; i++)
    {
      if (i in this)
        rv = fun.call(null, rv, this[i], i, this);
    }

    return rv;
  };
}

// define a console if not exists
if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

window.unload = function(e) {
    HT.unloading = true;
}

// class constructors for bookreader
function subclass(constructor, superConstructor)
{
  function surrogateConstructor()
  {
  }

  surrogateConstructor.prototype = superConstructor.prototype;

  var prototypeObject = new surrogateConstructor();
  prototypeObject.constructor = constructor;

  constructor.prototype = prototypeObject;
}

// define a namespace
var HT = HT || {};
HT.config = HT.config || {};

HT.config.ARBITRARY_PADDING = 260;
HT.config.ARBITRARY_WINDOW_WIDTH = 915;

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

$(document).ready(function() {
  
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
