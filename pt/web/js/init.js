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

// bookreader utility
// seed hash based on URL parameters as needed
HT.init_from_params = function() {
    if ( ! window.location.hash ) {
      var hash = "mode/" + HT.params.view;
      if ( HT.params.seq ) {
        hash = "page/n" + HT.params.seq + "/" + hash;
      }
      window.location.hash = "#" + hash;
    }
}
