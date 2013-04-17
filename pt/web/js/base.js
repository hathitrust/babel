if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

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

// For IE8 and earlier version.
if (!Date.now) {
  Date.now = function() {
    return new Date().valueOf();
  }
}

head.ready(function() {

  !function( $ ) {
    
    if (!Object.create) {
        Object.create = function (o) {
            if (arguments.length > 1) {
                throw new Error('Object.create implementation only accepts the first parameter.');
            }
            function F() {}
            F.prototype = o;
            return new F();
        };
    }
    
    // Create a plugin based on a defined object
    $.plugin = function( name, object ) {
      $.fn[name] = function( options ) {
        return this.each(function() {
          if ( ! $.data( this, name ) ) {
            $.data( this, name, Object.create(object).init(
            options, this ) );
          } else {
            var ob = $.data(this, name);
            ob.handle(options);
          }
        });
      };
    };
    
  }( window.jQuery );

  /* jQuery Tiny Pub/Sub - v0.7 - 10/27/2011
   * http://benalman.com/
   * Copyright (c) 2011 "Cowboy" Ben Alman; Licensed MIT, GPL */
   
  (function($) {
   
    // var o = $({});
    var o = $(document);
   
    $.subscribe = function() {
      o.on.apply(o, arguments);
    };
   
    $.unsubscribe = function() {
      o.off.apply(o, arguments);
    };
   
    $.publish = function() {
      o.trigger.apply(o, arguments);
    };

    $.fn.subscribe = function(trigger, fn) {
      var $objects = this;
      $.subscribe(trigger, function() {
        var args = arguments;
        $objects.each(function() {
          fn.apply(this, args);
        })
      });
      return $objects;
    }
   
  }(jQuery));

  var $window;

  $(document).ready(function() {

    $window = $(window);

    // bind the resize for IE8
    if ( $.browser.msie ) {
      if ( parseInt($.browser.version) <= 8 ) {
        $window = $("body");
        console.log("REDEFINING $window");
      }
    }

    //** THESE COULD BE DONE IN reader.js

    // and bind the search form for validation
    $("#form-search-volume").submit(function() {
      var $form = $(this);
      var $input = $form.find("input[type=text]")
      if ( ! $.trim($input.val()) ) {
        bootbox.alert("Please enter a term in the search box.");
        return false;
      }
      return true;
    })

    // same with any existing page number
    $("#form-go-page").submit(function() {
      var $form = $(this);
      var $input = $form.find("input[type=text]")
      if ( ! $.trim($input.val()) ) {
        bootbox.alert("Please enter a page number.");
        return false;
      }
      return true;
    })

  })

})


