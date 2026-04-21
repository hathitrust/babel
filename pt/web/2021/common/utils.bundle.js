'use strict';

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * jQuery JavaScript Library v3.6.1
 * https://jquery.com/
 *
 * Includes Sizzle.js
 * https://sizzlejs.com/
 *
 * Copyright OpenJS Foundation and other contributors
 * Released under the MIT license
 * https://jquery.org/license
 *
 * Date: 2022-08-26T17:52Z
 */
(function (global, factory) {
  'use strict';

  if (
    (typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' &&
    _typeof(module.exports) === 'object'
  ) {
    // For CommonJS and CommonJS-like environments where a proper `window`
    // is present, execute the factory and get jQuery.
    // For environments that do not have a `window` with a `document`
    // (such as Node.js), expose a factory as module.exports.
    // This accentuates the need for the creation of a real `window`.
    // e.g. var jQuery = require("jquery")(window);
    // See ticket trac-14549 for more info.
    module.exports = global.document
      ? factory(global, true)
      : function (w) {
          if (!w.document) {
            throw new Error('jQuery requires a window with a document');
          }

          return factory(w);
        };
  } else {
    factory(global);
  } // Pass this if window is not defined yet
})(typeof window !== 'undefined' ? window : void 0, function (window, noGlobal) {
  // Edge <= 12 - 13+, Firefox <=18 - 45+, IE 10 - 11, Safari 5.1 - 9+, iOS 6 - 9.1
  // throw exceptions when non-strict code (e.g., ASP.NET 4.5) accesses strict mode
  // arguments.callee.caller (trac-13335). But as of jQuery 3.0 (2016), strict mode should be common
  // enough that all such attempts are guarded in a try block.
  'use strict';

  var arr = [];
  var getProto = Object.getPrototypeOf;
  var _slice = arr.slice;
  var flat = arr.flat
    ? function (array) {
        return arr.flat.call(array);
      }
    : function (array) {
        return arr.concat.apply([], array);
      };
  var push = arr.push;
  var indexOf = arr.indexOf;
  var class2type = {};
  var toString = class2type.toString;
  var hasOwn = class2type.hasOwnProperty;
  var fnToString = hasOwn.toString;
  var ObjectFunctionString = fnToString.call(Object);
  var support = {};

  var isFunction = function isFunction(obj) {
    // Support: Chrome <=57, Firefox <=52
    // In some browsers, typeof returns "function" for HTML <object> elements
    // (i.e., `typeof document.createElement( "object" ) === "function"`).
    // We don't want to classify *any* DOM node as a function.
    // Support: QtWeb <=3.8.5, WebKit <=534.34, wkhtmltopdf tool <=0.12.5
    // Plus for old WebKit, typeof returns "function" for HTML collections
    // (e.g., `typeof document.getElementsByTagName("div") === "function"`). (gh-4756)
    return typeof obj === 'function' && typeof obj.nodeType !== 'number' && typeof obj.item !== 'function';
  };

  var isWindow = function isWindow(obj) {
    return obj != null && obj === obj.window;
  };

  var document = window.document;
  var preservedScriptAttributes = {
    type: true,
    src: true,
    nonce: true,
    noModule: true,
  };

  function DOMEval(code, node, doc) {
    doc = doc || document;
    var i,
      val,
      script = doc.createElement('script');
    script.text = code;

    if (node) {
      for (i in preservedScriptAttributes) {
        // Support: Firefox 64+, Edge 18+
        // Some browsers don't support the "nonce" property on scripts.
        // On the other hand, just using `getAttribute` is not enough as
        // the `nonce` attribute is reset to an empty string whenever it
        // becomes browsing-context connected.
        // See https://github.com/whatwg/html/issues/2369
        // See https://html.spec.whatwg.org/#nonce-attributes
        // The `node.getAttribute` check was added for the sake of
        // `jQuery.globalEval` so that it can fake a nonce-containing node
        // via an object.
        val = node[i] || (node.getAttribute && node.getAttribute(i));

        if (val) {
          script.setAttribute(i, val);
        }
      }
    }

    doc.head.appendChild(script).parentNode.removeChild(script);
  }

  function toType(obj) {
    if (obj == null) {
      return obj + '';
    } // Support: Android <=2.3 only (functionish RegExp)

    return _typeof(obj) === 'object' || typeof obj === 'function'
      ? class2type[toString.call(obj)] || 'object'
      : _typeof(obj);
  }
  /* global Symbol */
  // Defining this global in .eslintrc.json would create a danger of using the global
  // unguarded in another place, it seems safer to define global only for this module

  var version = '3.6.1',
    // Define a local copy of jQuery
    jQuery = function jQuery(selector, context) {
      // The jQuery object is actually just the init constructor 'enhanced'
      // Need init if jQuery is called (just allow error to be thrown if not included)
      return new jQuery.fn.init(selector, context);
    };

  jQuery.fn = jQuery.prototype = {
    // The current version of jQuery being used
    jquery: version,
    constructor: jQuery,
    // The default length of a jQuery object is 0
    length: 0,
    toArray: function toArray() {
      return _slice.call(this);
    },
    // Get the Nth element in the matched element set OR
    // Get the whole matched element set as a clean array
    get: function get(num) {
      // Return all the elements in a clean array
      if (num == null) {
        return _slice.call(this);
      } // Return just the one element from the set

      return num < 0 ? this[num + this.length] : this[num];
    },
    // Take an array of elements and push it onto the stack
    // (returning the new matched element set)
    pushStack: function pushStack(elems) {
      // Build a new jQuery matched element set
      var ret = jQuery.merge(this.constructor(), elems); // Add the old object onto the stack (as a reference)

      ret.prevObject = this; // Return the newly-formed element set

      return ret;
    },
    // Execute a callback for every element in the matched set.
    each: function each(callback) {
      return jQuery.each(this, callback);
    },
    map: function map(callback) {
      return this.pushStack(
        jQuery.map(this, function (elem, i) {
          return callback.call(elem, i, elem);
        }),
      );
    },
    slice: function slice() {
      return this.pushStack(_slice.apply(this, arguments));
    },
    first: function first() {
      return this.eq(0);
    },
    last: function last() {
      return this.eq(-1);
    },
    even: function even() {
      return this.pushStack(
        jQuery.grep(this, function (_elem, i) {
          return (i + 1) % 2;
        }),
      );
    },
    odd: function odd() {
      return this.pushStack(
        jQuery.grep(this, function (_elem, i) {
          return i % 2;
        }),
      );
    },
    eq: function eq(i) {
      var len = this.length,
        j = +i + (i < 0 ? len : 0);
      return this.pushStack(j >= 0 && j < len ? [this[j]] : []);
    },
    end: function end() {
      return this.prevObject || this.constructor();
    },
    // For internal use only.
    // Behaves like an Array's method, not like a jQuery method.
    push: push,
    sort: arr.sort,
    splice: arr.splice,
  };

  jQuery.extend = jQuery.fn.extend = function () {
    var options,
      name,
      src,
      copy,
      copyIsArray,
      clone,
      target = arguments[0] || {},
      i = 1,
      length = arguments.length,
      deep = false; // Handle a deep copy situation

    if (typeof target === 'boolean') {
      deep = target; // Skip the boolean and the target

      target = arguments[i] || {};
      i++;
    } // Handle case when target is a string or something (possible in deep copy)

    if (_typeof(target) !== 'object' && !isFunction(target)) {
      target = {};
    } // Extend jQuery itself if only one argument is passed

    if (i === length) {
      target = this;
      i--;
    }

    for (; i < length; i++) {
      // Only deal with non-null/undefined values
      if ((options = arguments[i]) != null) {
        // Extend the base object
        for (name in options) {
          copy = options[name]; // Prevent Object.prototype pollution
          // Prevent never-ending loop

          if (name === '__proto__' || target === copy) {
            continue;
          } // Recurse if we're merging plain objects or arrays

          if (deep && copy && (jQuery.isPlainObject(copy) || (copyIsArray = Array.isArray(copy)))) {
            src = target[name]; // Ensure proper type for the source value

            if (copyIsArray && !Array.isArray(src)) {
              clone = [];
            } else if (!copyIsArray && !jQuery.isPlainObject(src)) {
              clone = {};
            } else {
              clone = src;
            }

            copyIsArray = false; // Never move original objects, clone them

            target[name] = jQuery.extend(deep, clone, copy); // Don't bring in undefined values
          } else if (copy !== undefined) {
            target[name] = copy;
          }
        }
      }
    } // Return the modified object

    return target;
  };

  jQuery.extend({
    // Unique for each copy of jQuery on the page
    expando: 'jQuery' + (version + Math.random()).replace(/\D/g, ''),
    // Assume jQuery is ready without the ready module
    isReady: true,
    error: function error(msg) {
      throw new Error(msg);
    },
    noop: function noop() {},
    isPlainObject: function isPlainObject(obj) {
      var proto, Ctor; // Detect obvious negatives
      // Use toString instead of jQuery.type to catch host objects

      if (!obj || toString.call(obj) !== '[object Object]') {
        return false;
      }

      proto = getProto(obj); // Objects with no prototype (e.g., `Object.create( null )`) are plain

      if (!proto) {
        return true;
      } // Objects with prototype are plain iff they were constructed by a global Object function

      Ctor = hasOwn.call(proto, 'constructor') && proto.constructor;
      return typeof Ctor === 'function' && fnToString.call(Ctor) === ObjectFunctionString;
    },
    isEmptyObject: function isEmptyObject(obj) {
      var name;

      for (name in obj) {
        return false;
      }

      return true;
    },
    // Evaluates a script in a provided context; falls back to the global one
    // if not specified.
    globalEval: function globalEval(code, options, doc) {
      DOMEval(
        code,
        {
          nonce: options && options.nonce,
        },
        doc,
      );
    },
    each: function each(obj, callback) {
      var length,
        i = 0;

      if (isArrayLike(obj)) {
        length = obj.length;

        for (; i < length; i++) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      } else {
        for (i in obj) {
          if (callback.call(obj[i], i, obj[i]) === false) {
            break;
          }
        }
      }

      return obj;
    },
    // results is for internal usage only
    makeArray: function makeArray(arr, results) {
      var ret = results || [];

      if (arr != null) {
        if (isArrayLike(Object(arr))) {
          jQuery.merge(ret, typeof arr === 'string' ? [arr] : arr);
        } else {
          push.call(ret, arr);
        }
      }

      return ret;
    },
    inArray: function inArray(elem, arr, i) {
      return arr == null ? -1 : indexOf.call(arr, elem, i);
    },
    // Support: Android <=4.0 only, PhantomJS 1 only
    // push.apply(_, arraylike) throws on ancient WebKit
    merge: function merge(first, second) {
      var len = +second.length,
        j = 0,
        i = first.length;

      for (; j < len; j++) {
        first[i++] = second[j];
      }

      first.length = i;
      return first;
    },
    grep: function grep(elems, callback, invert) {
      var callbackInverse,
        matches = [],
        i = 0,
        length = elems.length,
        callbackExpect = !invert; // Go through the array, only saving the items
      // that pass the validator function

      for (; i < length; i++) {
        callbackInverse = !callback(elems[i], i);

        if (callbackInverse !== callbackExpect) {
          matches.push(elems[i]);
        }
      }

      return matches;
    },
    // arg is for internal usage only
    map: function map(elems, callback, arg) {
      var length,
        value,
        i = 0,
        ret = []; // Go through the array, translating each of the items to their new values

      if (isArrayLike(elems)) {
        length = elems.length;

        for (; i < length; i++) {
          value = callback(elems[i], i, arg);

          if (value != null) {
            ret.push(value);
          }
        } // Go through every key on the object,
      } else {
        for (i in elems) {
          value = callback(elems[i], i, arg);

          if (value != null) {
            ret.push(value);
          }
        }
      } // Flatten any nested arrays

      return flat(ret);
    },
    // A global GUID counter for objects
    guid: 1,
    // jQuery.support is not used in Core but other projects attach their
    // properties to it so it needs to exist.
    support: support,
  });

  if (typeof Symbol === 'function') {
    jQuery.fn[Symbol.iterator] = arr[Symbol.iterator];
  } // Populate the class2type map

  jQuery.each('Boolean Number String Function Array Date RegExp Object Error Symbol'.split(' '), function (_i, name) {
    class2type['[object ' + name + ']'] = name.toLowerCase();
  });

  function isArrayLike(obj) {
    // Support: real iOS 8.2 only (not reproducible in simulator)
    // `in` check used to prevent JIT error (gh-2145)
    // hasOwn isn't used here due to false negatives
    // regarding Nodelist length in IE
    var length = !!obj && 'length' in obj && obj.length,
      type = toType(obj);

    if (isFunction(obj) || isWindow(obj)) {
      return false;
    }

    return type === 'array' || length === 0 || (typeof length === 'number' && length > 0 && length - 1 in obj);
  }

  var Sizzle =
    /*!
     * Sizzle CSS Selector Engine v2.3.6
     * https://sizzlejs.com/
     *
     * Copyright JS Foundation and other contributors
     * Released under the MIT license
     * https://js.foundation/
     *
     * Date: 2021-02-16
     */
    (function (window) {
      var i,
        support,
        Expr,
        getText,
        isXML,
        tokenize,
        compile,
        select,
        outermostContext,
        sortInput,
        hasDuplicate,
        // Local document vars
        setDocument,
        document,
        docElem,
        documentIsHTML,
        rbuggyQSA,
        rbuggyMatches,
        matches,
        contains,
        // Instance-specific data
        expando = 'sizzle' + 1 * new Date(),
        preferredDoc = window.document,
        dirruns = 0,
        done = 0,
        classCache = createCache(),
        tokenCache = createCache(),
        compilerCache = createCache(),
        nonnativeSelectorCache = createCache(),
        sortOrder = function sortOrder(a, b) {
          if (a === b) {
            hasDuplicate = true;
          }

          return 0;
        },
        // Instance methods
        hasOwn = {}.hasOwnProperty,
        arr = [],
        pop = arr.pop,
        pushNative = arr.push,
        push = arr.push,
        slice = arr.slice,
        // Use a stripped-down indexOf as it's faster than native
        // https://jsperf.com/thor-indexof-vs-for/5
        indexOf = function indexOf(list, elem) {
          var i = 0,
            len = list.length;

          for (; i < len; i++) {
            if (list[i] === elem) {
              return i;
            }
          }

          return -1;
        },
        booleans =
          'checked|selected|async|autofocus|autoplay|controls|defer|disabled|hidden|' +
          'ismap|loop|multiple|open|readonly|required|scoped',
        // Regular expressions
        // http://www.w3.org/TR/css3-selectors/#whitespace
        whitespace = '[\\x20\\t\\r\\n\\f]',
        // https://www.w3.org/TR/css-syntax-3/#ident-token-diagram
        identifier = '(?:\\\\[\\da-fA-F]{1,6}' + whitespace + '?|\\\\[^\\r\\n\\f]|[\\w-]|[^\0-\\x7f])+',
        // Attribute selectors: http://www.w3.org/TR/selectors/#attribute-selectors
        attributes =
          '\\[' +
          whitespace +
          '*(' +
          identifier +
          ')(?:' +
          whitespace + // Operator (capture 2)
          '*([*^$|!~]?=)' +
          whitespace + // "Attribute values must be CSS identifiers [capture 5]
          // or strings [capture 3 or capture 4]"
          '*(?:\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)"|(' +
          identifier +
          '))|)' +
          whitespace +
          '*\\]',
        pseudos =
          ':(' +
          identifier +
          ')(?:\\((' + // To reduce the number of selectors needing tokenize in the preFilter, prefer arguments:
          // 1. quoted (capture 3; capture 4 or capture 5)
          '(\'((?:\\\\.|[^\\\\\'])*)\'|"((?:\\\\.|[^\\\\"])*)")|' + // 2. simple (capture 6)
          '((?:\\\\.|[^\\\\()[\\]]|' +
          attributes +
          ')*)|' + // 3. anything else (capture 2)
          '.*' +
          ')\\)|)',
        // Leading and non-escaped trailing whitespace, capturing some non-whitespace characters preceding the latter
        rwhitespace = new RegExp(whitespace + '+', 'g'),
        rtrim = new RegExp('^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$', 'g'),
        rcomma = new RegExp('^' + whitespace + '*,' + whitespace + '*'),
        rcombinators = new RegExp('^' + whitespace + '*([>+~]|' + whitespace + ')' + whitespace + '*'),
        rdescend = new RegExp(whitespace + '|>'),
        rpseudo = new RegExp(pseudos),
        ridentifier = new RegExp('^' + identifier + '$'),
        matchExpr = {
          ID: new RegExp('^#(' + identifier + ')'),
          CLASS: new RegExp('^\\.(' + identifier + ')'),
          TAG: new RegExp('^(' + identifier + '|[*])'),
          ATTR: new RegExp('^' + attributes),
          PSEUDO: new RegExp('^' + pseudos),
          CHILD: new RegExp(
            '^:(only|first|last|nth|nth-last)-(child|of-type)(?:\\(' +
              whitespace +
              '*(even|odd|(([+-]|)(\\d*)n|)' +
              whitespace +
              '*(?:([+-]|)' +
              whitespace +
              '*(\\d+)|))' +
              whitespace +
              '*\\)|)',
            'i',
          ),
          bool: new RegExp('^(?:' + booleans + ')$', 'i'),
          // For use in libraries implementing .is()
          // We use this for POS matching in `select`
          needsContext: new RegExp(
            '^' +
              whitespace +
              '*[>+~]|:(even|odd|eq|gt|lt|nth|first|last)(?:\\(' +
              whitespace +
              '*((?:-\\d)?\\d*)' +
              whitespace +
              '*\\)|)(?=[^-]|$)',
            'i',
          ),
        },
        rhtml = /HTML$/i,
        rinputs = /^(?:input|select|textarea|button)$/i,
        rheader = /^h\d$/i,
        rnative = /^[^{]+\{\s*\[native \w/,
        // Easily-parseable/retrievable ID or TAG or CLASS selectors
        rquickExpr = /^(?:#([\w-]+)|(\w+)|\.([\w-]+))$/,
        rsibling = /[+~]/,
        // CSS escapes
        // http://www.w3.org/TR/CSS21/syndata.html#escaped-characters
        runescape = new RegExp('\\\\[\\da-fA-F]{1,6}' + whitespace + '?|\\\\([^\\r\\n\\f])', 'g'),
        funescape = function funescape(escape, nonHex) {
          var high = '0x' + escape.slice(1) - 0x10000;
          return nonHex // Strip the backslash prefix from a non-hex escape sequence
            ? nonHex // Replace a hexadecimal escape sequence with the encoded Unicode code point
            : // Support: IE <=11+
              // For values outside the Basic Multilingual Plane (BMP), manually construct a
              // surrogate pair
              high < 0
              ? String.fromCharCode(high + 0x10000)
              : String.fromCharCode((high >> 10) | 0xd800, (high & 0x3ff) | 0xdc00);
        },
        // CSS string/identifier serialization
        // https://drafts.csswg.org/cssom/#common-serializing-idioms
        rcssescape = /([\0-\x1f\x7f]|^-?\d)|^-$|[^\0-\x1f\x7f-\uFFFF\w-]/g,
        fcssescape = function fcssescape(ch, asCodePoint) {
          if (asCodePoint) {
            // U+0000 NULL becomes U+FFFD REPLACEMENT CHARACTER
            if (ch === '\0') {
              return '\uFFFD';
            } // Control characters and (dependent upon position) numbers get escaped as code points

            return ch.slice(0, -1) + '\\' + ch.charCodeAt(ch.length - 1).toString(16) + ' ';
          } // Other potentially-special ASCII characters get backslash-escaped

          return '\\' + ch;
        },
        // Used for iframes
        // See setDocument()
        // Removing the function wrapper causes a "Permission Denied"
        // error in IE
        unloadHandler = function unloadHandler() {
          setDocument();
        },
        inDisabledFieldset = addCombinator(
          function (elem) {
            return elem.disabled === true && elem.nodeName.toLowerCase() === 'fieldset';
          },
          {
            dir: 'parentNode',
            next: 'legend',
          },
        ); // Optimize for push.apply( _, NodeList )

      try {
        push.apply((arr = slice.call(preferredDoc.childNodes)), preferredDoc.childNodes); // Support: Android<4.0
        // Detect silently failing push.apply
        // eslint-disable-next-line no-unused-expressions

        arr[preferredDoc.childNodes.length].nodeType;
      } catch (e) {
        push = {
          apply: arr.length // Leverage slice if possible
            ? function (target, els) {
                pushNative.apply(target, slice.call(els));
              } // Support: IE<9
            : // Otherwise append directly
              function (target, els) {
                var j = target.length,
                  i = 0; // Can't trust NodeList.length

                while ((target[j++] = els[i++])) {}

                target.length = j - 1;
              },
        };
      }

      function Sizzle(selector, context, results, seed) {
        var m,
          i,
          elem,
          nid,
          match,
          groups,
          newSelector,
          newContext = context && context.ownerDocument,
          // nodeType defaults to 9, since context defaults to document
          nodeType = context ? context.nodeType : 9;
        results = results || []; // Return early from calls with invalid selector or context

        if (typeof selector !== 'string' || !selector || (nodeType !== 1 && nodeType !== 9 && nodeType !== 11)) {
          return results;
        } // Try to shortcut find operations (as opposed to filters) in HTML documents

        if (!seed) {
          setDocument(context);
          context = context || document;

          if (documentIsHTML) {
            // If the selector is sufficiently simple, try using a "get*By*" DOM method
            // (excepting DocumentFragment context, where the methods don't exist)
            if (nodeType !== 11 && (match = rquickExpr.exec(selector))) {
              // ID selector
              if ((m = match[1])) {
                // Document context
                if (nodeType === 9) {
                  if ((elem = context.getElementById(m))) {
                    // Support: IE, Opera, Webkit
                    // TODO: identify versions
                    // getElementById can match elements by name instead of ID
                    if (elem.id === m) {
                      results.push(elem);
                      return results;
                    }
                  } else {
                    return results;
                  } // Element context
                } else {
                  // Support: IE, Opera, Webkit
                  // TODO: identify versions
                  // getElementById can match elements by name instead of ID
                  if (newContext && (elem = newContext.getElementById(m)) && contains(context, elem) && elem.id === m) {
                    results.push(elem);
                    return results;
                  }
                } // Type selector
              } else if (match[2]) {
                push.apply(results, context.getElementsByTagName(selector));
                return results; // Class selector
              } else if ((m = match[3]) && support.getElementsByClassName && context.getElementsByClassName) {
                push.apply(results, context.getElementsByClassName(m));
                return results;
              }
            } // Take advantage of querySelectorAll

            if (
              support.qsa &&
              !nonnativeSelectorCache[selector + ' '] &&
              (!rbuggyQSA || !rbuggyQSA.test(selector)) &&
              (nodeType !== 1 || context.nodeName.toLowerCase() !== 'object')
            ) {
              newSelector = selector;
              newContext = context; // qSA considers elements outside a scoping root when evaluating child or
              // descendant combinators, which is not what we want.
              // In such cases, we work around the behavior by prefixing every selector in the
              // list with an ID selector referencing the scope context.
              // The technique has to be used as well when a leading combinator is used
              // as such selectors are not recognized by querySelectorAll.
              // Thanks to Andrew Dupont for this technique.

              if (nodeType === 1 && (rdescend.test(selector) || rcombinators.test(selector))) {
                // Expand context for sibling selectors
                newContext = (rsibling.test(selector) && testContext(context.parentNode)) || context; // We can use :scope instead of the ID hack if the browser
                // supports it & if we're not changing the context.

                if (newContext !== context || !support.scope) {
                  // Capture the context ID, setting it first if necessary
                  if ((nid = context.getAttribute('id'))) {
                    nid = nid.replace(rcssescape, fcssescape);
                  } else {
                    context.setAttribute('id', (nid = expando));
                  }
                } // Prefix every selector in the list

                groups = tokenize(selector);
                i = groups.length;

                while (i--) {
                  groups[i] = (nid ? '#' + nid : ':scope') + ' ' + toSelector(groups[i]);
                }

                newSelector = groups.join(',');
              }

              try {
                push.apply(results, newContext.querySelectorAll(newSelector));
                return results;
              } catch (qsaError) {
                nonnativeSelectorCache(selector, true);
              } finally {
                if (nid === expando) {
                  context.removeAttribute('id');
                }
              }
            }
          }
        } // All others

        return select(selector.replace(rtrim, '$1'), context, results, seed);
      }
      /**
       * Create key-value caches of limited size
       * @returns {function(string, object)} Returns the Object data after storing it on itself with
       *	property name the (space-suffixed) string and (if the cache is larger than Expr.cacheLength)
       *	deleting the oldest entry
       */

      function createCache() {
        var keys = [];

        function cache(key, value) {
          // Use (key + " ") to avoid collision with native prototype properties (see Issue #157)
          if (keys.push(key + ' ') > Expr.cacheLength) {
            // Only keep the most recent entries
            delete cache[keys.shift()];
          }

          return (cache[key + ' '] = value);
        }

        return cache;
      }
      /**
       * Mark a function for special use by Sizzle
       * @param {Function} fn The function to mark
       */

      function markFunction(fn) {
        fn[expando] = true;
        return fn;
      }
      /**
       * Support testing using an element
       * @param {Function} fn Passed the created element and returns a boolean result
       */

      function assert(fn) {
        var el = document.createElement('fieldset');

        try {
          return !!fn(el);
        } catch (e) {
          return false;
        } finally {
          // Remove from its parent by default
          if (el.parentNode) {
            el.parentNode.removeChild(el);
          } // release memory in IE

          el = null;
        }
      }
      /**
       * Adds the same handler for all of the specified attrs
       * @param {String} attrs Pipe-separated list of attributes
       * @param {Function} handler The method that will be applied
       */

      function addHandle(attrs, handler) {
        var arr = attrs.split('|'),
          i = arr.length;

        while (i--) {
          Expr.attrHandle[arr[i]] = handler;
        }
      }
      /**
       * Checks document order of two siblings
       * @param {Element} a
       * @param {Element} b
       * @returns {Number} Returns less than 0 if a precedes b, greater than 0 if a follows b
       */

      function siblingCheck(a, b) {
        var cur = b && a,
          diff = cur && a.nodeType === 1 && b.nodeType === 1 && a.sourceIndex - b.sourceIndex; // Use IE sourceIndex if available on both nodes

        if (diff) {
          return diff;
        } // Check if b follows a

        if (cur) {
          while ((cur = cur.nextSibling)) {
            if (cur === b) {
              return -1;
            }
          }
        }

        return a ? 1 : -1;
      }
      /**
       * Returns a function to use in pseudos for input types
       * @param {String} type
       */

      function createInputPseudo(type) {
        return function (elem) {
          var name = elem.nodeName.toLowerCase();
          return name === 'input' && elem.type === type;
        };
      }
      /**
       * Returns a function to use in pseudos for buttons
       * @param {String} type
       */

      function createButtonPseudo(type) {
        return function (elem) {
          var name = elem.nodeName.toLowerCase();
          return (name === 'input' || name === 'button') && elem.type === type;
        };
      }
      /**
       * Returns a function to use in pseudos for :enabled/:disabled
       * @param {Boolean} disabled true for :disabled; false for :enabled
       */

      function createDisabledPseudo(disabled) {
        // Known :disabled false positives: fieldset[disabled] > legend:nth-of-type(n+2) :can-disable
        return function (elem) {
          // Only certain elements can match :enabled or :disabled
          // https://html.spec.whatwg.org/multipage/scripting.html#selector-enabled
          // https://html.spec.whatwg.org/multipage/scripting.html#selector-disabled
          if ('form' in elem) {
            // Check for inherited disabledness on relevant non-disabled elements:
            // * listed form-associated elements in a disabled fieldset
            //   https://html.spec.whatwg.org/multipage/forms.html#category-listed
            //   https://html.spec.whatwg.org/multipage/forms.html#concept-fe-disabled
            // * option elements in a disabled optgroup
            //   https://html.spec.whatwg.org/multipage/forms.html#concept-option-disabled
            // All such elements have a "form" property.
            if (elem.parentNode && elem.disabled === false) {
              // Option elements defer to a parent optgroup if present
              if ('label' in elem) {
                if ('label' in elem.parentNode) {
                  return elem.parentNode.disabled === disabled;
                } else {
                  return elem.disabled === disabled;
                }
              } // Support: IE 6 - 11
              // Use the isDisabled shortcut property to check for disabled fieldset ancestors

              return (
                elem.isDisabled === disabled || // Where there is no isDisabled, check manually
                /* jshint -W018 */
                (elem.isDisabled !== !disabled && inDisabledFieldset(elem) === disabled)
              );
            }

            return elem.disabled === disabled; // Try to winnow out elements that can't be disabled before trusting the disabled property.
            // Some victims get caught in our net (label, legend, menu, track), but it shouldn't
            // even exist on them, let alone have a boolean value.
          } else if ('label' in elem) {
            return elem.disabled === disabled;
          } // Remaining elements are neither :enabled nor :disabled

          return false;
        };
      }
      /**
       * Returns a function to use in pseudos for positionals
       * @param {Function} fn
       */

      function createPositionalPseudo(fn) {
        return markFunction(function (argument) {
          argument = +argument;
          return markFunction(function (seed, matches) {
            var j,
              matchIndexes = fn([], seed.length, argument),
              i = matchIndexes.length; // Match elements found at the specified indexes

            while (i--) {
              if (seed[(j = matchIndexes[i])]) {
                seed[j] = !(matches[j] = seed[j]);
              }
            }
          });
        });
      }
      /**
       * Checks a node for validity as a Sizzle context
       * @param {Element|Object=} context
       * @returns {Element|Object|Boolean} The input node if acceptable, otherwise a falsy value
       */

      function testContext(context) {
        return context && typeof context.getElementsByTagName !== 'undefined' && context;
      } // Expose support vars for convenience

      support = Sizzle.support = {};
      /**
       * Detects XML nodes
       * @param {Element|Object} elem An element or a document
       * @returns {Boolean} True iff elem is a non-HTML XML node
       */

      isXML = Sizzle.isXML = function (elem) {
        var namespace = elem && elem.namespaceURI,
          docElem = elem && (elem.ownerDocument || elem).documentElement; // Support: IE <=8
        // Assume HTML when documentElement doesn't yet exist, such as inside loading iframes
        // https://bugs.jquery.com/ticket/4833

        return !rhtml.test(namespace || (docElem && docElem.nodeName) || 'HTML');
      };
      /**
       * Sets document-related variables once based on the current document
       * @param {Element|Object} [doc] An element or document object to use to set the document
       * @returns {Object} Returns the current document
       */

      setDocument = Sizzle.setDocument = function (node) {
        var hasCompare,
          subWindow,
          doc = node ? node.ownerDocument || node : preferredDoc; // Return early if doc is invalid or already selected
        // Support: IE 11+, Edge 17 - 18+
        // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq

        if (doc == document || doc.nodeType !== 9 || !doc.documentElement) {
          return document;
        } // Update global variables

        document = doc;
        docElem = document.documentElement;
        documentIsHTML = !isXML(document); // Support: IE 9 - 11+, Edge 12 - 18+
        // Accessing iframe documents after unload throws "permission denied" errors (jQuery #13936)
        // Support: IE 11+, Edge 17 - 18+
        // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq

        if (preferredDoc != document && (subWindow = document.defaultView) && subWindow.top !== subWindow) {
          // Support: IE 11, Edge
          if (subWindow.addEventListener) {
            subWindow.addEventListener('unload', unloadHandler, false); // Support: IE 9 - 10 only
          } else if (subWindow.attachEvent) {
            subWindow.attachEvent('onunload', unloadHandler);
          }
        } // Support: IE 8 - 11+, Edge 12 - 18+, Chrome <=16 - 25 only, Firefox <=3.6 - 31 only,
        // Safari 4 - 5 only, Opera <=11.6 - 12.x only
        // IE/Edge & older browsers don't support the :scope pseudo-class.
        // Support: Safari 6.0 only
        // Safari 6.0 supports :scope but it's an alias of :root there.

        support.scope = assert(function (el) {
          docElem.appendChild(el).appendChild(document.createElement('div'));
          return typeof el.querySelectorAll !== 'undefined' && !el.querySelectorAll(':scope fieldset div').length;
        });
        /* Attributes
      ---------------------------------------------------------------------- */
        // Support: IE<8
        // Verify that getAttribute really returns attributes and not properties
        // (excepting IE8 booleans)

        support.attributes = assert(function (el) {
          el.className = 'i';
          return !el.getAttribute('className');
        });
        /* getElement(s)By*
      ---------------------------------------------------------------------- */
        // Check if getElementsByTagName("*") returns only elements

        support.getElementsByTagName = assert(function (el) {
          el.appendChild(document.createComment(''));
          return !el.getElementsByTagName('*').length;
        }); // Support: IE<9

        support.getElementsByClassName = rnative.test(document.getElementsByClassName); // Support: IE<10
        // Check if getElementById returns elements by name
        // The broken getElementById methods don't pick up programmatically-set names,
        // so use a roundabout getElementsByName test

        support.getById = assert(function (el) {
          docElem.appendChild(el).id = expando;
          return !document.getElementsByName || !document.getElementsByName(expando).length;
        }); // ID filter and find

        if (support.getById) {
          Expr.filter['ID'] = function (id) {
            var attrId = id.replace(runescape, funescape);
            return function (elem) {
              return elem.getAttribute('id') === attrId;
            };
          };

          Expr.find['ID'] = function (id, context) {
            if (typeof context.getElementById !== 'undefined' && documentIsHTML) {
              var elem = context.getElementById(id);
              return elem ? [elem] : [];
            }
          };
        } else {
          Expr.filter['ID'] = function (id) {
            var attrId = id.replace(runescape, funescape);
            return function (elem) {
              var node = typeof elem.getAttributeNode !== 'undefined' && elem.getAttributeNode('id');
              return node && node.value === attrId;
            };
          }; // Support: IE 6 - 7 only
          // getElementById is not reliable as a find shortcut

          Expr.find['ID'] = function (id, context) {
            if (typeof context.getElementById !== 'undefined' && documentIsHTML) {
              var node,
                i,
                elems,
                elem = context.getElementById(id);

              if (elem) {
                // Verify the id attribute
                node = elem.getAttributeNode('id');

                if (node && node.value === id) {
                  return [elem];
                } // Fall back on getElementsByName

                elems = context.getElementsByName(id);
                i = 0;

                while ((elem = elems[i++])) {
                  node = elem.getAttributeNode('id');

                  if (node && node.value === id) {
                    return [elem];
                  }
                }
              }

              return [];
            }
          };
        } // Tag

        Expr.find['TAG'] = support.getElementsByTagName
          ? function (tag, context) {
              if (typeof context.getElementsByTagName !== 'undefined') {
                return context.getElementsByTagName(tag); // DocumentFragment nodes don't have gEBTN
              } else if (support.qsa) {
                return context.querySelectorAll(tag);
              }
            }
          : function (tag, context) {
              var elem,
                tmp = [],
                i = 0,
                // By happy coincidence, a (broken) gEBTN appears on DocumentFragment nodes too
                results = context.getElementsByTagName(tag); // Filter out possible comments

              if (tag === '*') {
                while ((elem = results[i++])) {
                  if (elem.nodeType === 1) {
                    tmp.push(elem);
                  }
                }

                return tmp;
              }

              return results;
            }; // Class

        Expr.find['CLASS'] =
          support.getElementsByClassName &&
          function (className, context) {
            if (typeof context.getElementsByClassName !== 'undefined' && documentIsHTML) {
              return context.getElementsByClassName(className);
            }
          };
        /* QSA/matchesSelector
      ---------------------------------------------------------------------- */
        // QSA and matchesSelector support
        // matchesSelector(:active) reports false when true (IE9/Opera 11.5)

        rbuggyMatches = []; // qSa(:focus) reports false when true (Chrome 21)
        // We allow this because of a bug in IE8/9 that throws an error
        // whenever `document.activeElement` is accessed on an iframe
        // So, we allow :focus to pass through QSA all the time to avoid the IE error
        // See https://bugs.jquery.com/ticket/13378

        rbuggyQSA = [];

        if ((support.qsa = rnative.test(document.querySelectorAll))) {
          // Build QSA regex
          // Regex strategy adopted from Diego Perini
          assert(function (el) {
            var input; // Select is set to empty string on purpose
            // This is to test IE's treatment of not explicitly
            // setting a boolean content attribute,
            // since its presence should be enough
            // https://bugs.jquery.com/ticket/12359

            docElem.appendChild(el).innerHTML =
              "<a id='" +
              expando +
              "'></a>" +
              "<select id='" +
              expando +
              "-\r\\' msallowcapture=''>" +
              "<option selected=''></option></select>"; // Support: IE8, Opera 11-12.16
            // Nothing should be selected when empty strings follow ^= or $= or *=
            // The test attribute must be unknown in Opera but "safe" for WinRT
            // https://msdn.microsoft.com/en-us/library/ie/hh465388.aspx#attribute_section

            if (el.querySelectorAll("[msallowcapture^='']").length) {
              rbuggyQSA.push('[*^$]=' + whitespace + '*(?:\'\'|"")');
            } // Support: IE8
            // Boolean attributes and "value" are not treated correctly

            if (!el.querySelectorAll('[selected]').length) {
              rbuggyQSA.push('\\[' + whitespace + '*(?:value|' + booleans + ')');
            } // Support: Chrome<29, Android<4.4, Safari<7.0+, iOS<7.0+, PhantomJS<1.9.8+

            if (!el.querySelectorAll('[id~=' + expando + '-]').length) {
              rbuggyQSA.push('~=');
            } // Support: IE 11+, Edge 15 - 18+
            // IE 11/Edge don't find elements on a `[name='']` query in some cases.
            // Adding a temporary attribute to the document before the selection works
            // around the issue.
            // Interestingly, IE 10 & older don't seem to have the issue.

            input = document.createElement('input');
            input.setAttribute('name', '');
            el.appendChild(input);

            if (!el.querySelectorAll("[name='']").length) {
              rbuggyQSA.push('\\[' + whitespace + '*name' + whitespace + '*=' + whitespace + '*(?:\'\'|"")');
            } // Webkit/Opera - :checked should return selected option elements
            // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
            // IE8 throws error here and will not see later tests

            if (!el.querySelectorAll(':checked').length) {
              rbuggyQSA.push(':checked');
            } // Support: Safari 8+, iOS 8+
            // https://bugs.webkit.org/show_bug.cgi?id=136851
            // In-page `selector#id sibling-combinator selector` fails

            if (!el.querySelectorAll('a#' + expando + '+*').length) {
              rbuggyQSA.push('.#.+[+~]');
            } // Support: Firefox <=3.6 - 5 only
            // Old Firefox doesn't throw on a badly-escaped identifier.

            el.querySelectorAll('\\\f');
            rbuggyQSA.push('[\\r\\n\\f]');
          });
          assert(function (el) {
            el.innerHTML = "<a href='' disabled='disabled'></a>" + "<select disabled='disabled'><option/></select>"; // Support: Windows 8 Native Apps
            // The type and name attributes are restricted during .innerHTML assignment

            var input = document.createElement('input');
            input.setAttribute('type', 'hidden');
            el.appendChild(input).setAttribute('name', 'D'); // Support: IE8
            // Enforce case-sensitivity of name attribute

            if (el.querySelectorAll('[name=d]').length) {
              rbuggyQSA.push('name' + whitespace + '*[*^$|!~]?=');
            } // FF 3.5 - :enabled/:disabled and hidden elements (hidden elements are still enabled)
            // IE8 throws error here and will not see later tests

            if (el.querySelectorAll(':enabled').length !== 2) {
              rbuggyQSA.push(':enabled', ':disabled');
            } // Support: IE9-11+
            // IE's :disabled selector does not pick up the children of disabled fieldsets

            docElem.appendChild(el).disabled = true;

            if (el.querySelectorAll(':disabled').length !== 2) {
              rbuggyQSA.push(':enabled', ':disabled');
            } // Support: Opera 10 - 11 only
            // Opera 10-11 does not throw on post-comma invalid pseudos

            el.querySelectorAll('*,:x');
            rbuggyQSA.push(',.*:');
          });
        }

        if (
          (support.matchesSelector = rnative.test(
            (matches =
              docElem.matches ||
              docElem.webkitMatchesSelector ||
              docElem.mozMatchesSelector ||
              docElem.oMatchesSelector ||
              docElem.msMatchesSelector),
          ))
        ) {
          assert(function (el) {
            // Check to see if it's possible to do matchesSelector
            // on a disconnected node (IE 9)
            support.disconnectedMatch = matches.call(el, '*'); // This should fail with an exception
            // Gecko does not error, returns false instead

            matches.call(el, "[s!='']:x");
            rbuggyMatches.push('!=', pseudos);
          });
        }

        rbuggyQSA = rbuggyQSA.length && new RegExp(rbuggyQSA.join('|'));
        rbuggyMatches = rbuggyMatches.length && new RegExp(rbuggyMatches.join('|'));
        /* Contains
      ---------------------------------------------------------------------- */

        hasCompare = rnative.test(docElem.compareDocumentPosition); // Element contains another
        // Purposefully self-exclusive
        // As in, an element does not contain itself

        contains =
          hasCompare || rnative.test(docElem.contains)
            ? function (a, b) {
                var adown = a.nodeType === 9 ? a.documentElement : a,
                  bup = b && b.parentNode;
                return (
                  a === bup ||
                  !!(
                    bup &&
                    bup.nodeType === 1 &&
                    (adown.contains
                      ? adown.contains(bup)
                      : a.compareDocumentPosition && a.compareDocumentPosition(bup) & 16)
                  )
                );
              }
            : function (a, b) {
                if (b) {
                  while ((b = b.parentNode)) {
                    if (b === a) {
                      return true;
                    }
                  }
                }

                return false;
              };
        /* Sorting
      ---------------------------------------------------------------------- */
        // Document order sorting

        sortOrder = hasCompare
          ? function (a, b) {
              // Flag for duplicate removal
              if (a === b) {
                hasDuplicate = true;
                return 0;
              } // Sort on method existence if only one input has compareDocumentPosition

              var compare = !a.compareDocumentPosition - !b.compareDocumentPosition;

              if (compare) {
                return compare;
              } // Calculate position if both inputs belong to the same document
              // Support: IE 11+, Edge 17 - 18+
              // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
              // two documents; shallow comparisons work.
              // eslint-disable-next-line eqeqeq

              compare =
                (a.ownerDocument || a) == (b.ownerDocument || b)
                  ? a.compareDocumentPosition(b) // Otherwise we know they are disconnected
                  : 1; // Disconnected nodes

              if (compare & 1 || (!support.sortDetached && b.compareDocumentPosition(a) === compare)) {
                // Choose the first element that is related to our preferred document
                // Support: IE 11+, Edge 17 - 18+
                // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.
                // eslint-disable-next-line eqeqeq
                if (a == document || (a.ownerDocument == preferredDoc && contains(preferredDoc, a))) {
                  return -1;
                } // Support: IE 11+, Edge 17 - 18+
                // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.
                // eslint-disable-next-line eqeqeq

                if (b == document || (b.ownerDocument == preferredDoc && contains(preferredDoc, b))) {
                  return 1;
                } // Maintain original order

                return sortInput ? indexOf(sortInput, a) - indexOf(sortInput, b) : 0;
              }

              return compare & 4 ? -1 : 1;
            }
          : function (a, b) {
              // Exit early if the nodes are identical
              if (a === b) {
                hasDuplicate = true;
                return 0;
              }

              var cur,
                i = 0,
                aup = a.parentNode,
                bup = b.parentNode,
                ap = [a],
                bp = [b]; // Parentless nodes are either documents or disconnected

              if (!aup || !bup) {
                // Support: IE 11+, Edge 17 - 18+
                // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.

                /* eslint-disable eqeqeq */
                return a == document
                  ? -1
                  : b == document
                    ? 1
                    : /* eslint-enable eqeqeq */
                      aup
                      ? -1
                      : bup
                        ? 1
                        : sortInput
                          ? indexOf(sortInput, a) - indexOf(sortInput, b)
                          : 0; // If the nodes are siblings, we can do a quick check
              } else if (aup === bup) {
                return siblingCheck(a, b);
              } // Otherwise we need full lists of their ancestors for comparison

              cur = a;

              while ((cur = cur.parentNode)) {
                ap.unshift(cur);
              }

              cur = b;

              while ((cur = cur.parentNode)) {
                bp.unshift(cur);
              } // Walk down the tree looking for a discrepancy

              while (ap[i] === bp[i]) {
                i++;
              }

              return i // Do a sibling check if the nodes have a common ancestor
                ? siblingCheck(ap[i], bp[i]) // Otherwise nodes in our document sort first
                : // Support: IE 11+, Edge 17 - 18+
                  // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
                  // two documents; shallow comparisons work.

                  /* eslint-disable eqeqeq */
                  ap[i] == preferredDoc
                  ? -1
                  : bp[i] == preferredDoc
                    ? 1
                    : /* eslint-enable eqeqeq */
                      0;
            };
        return document;
      };

      Sizzle.matches = function (expr, elements) {
        return Sizzle(expr, null, null, elements);
      };

      Sizzle.matchesSelector = function (elem, expr) {
        setDocument(elem);

        if (
          support.matchesSelector &&
          documentIsHTML &&
          !nonnativeSelectorCache[expr + ' '] &&
          (!rbuggyMatches || !rbuggyMatches.test(expr)) &&
          (!rbuggyQSA || !rbuggyQSA.test(expr))
        ) {
          try {
            var ret = matches.call(elem, expr); // IE 9's matchesSelector returns false on disconnected nodes

            if (
              ret ||
              support.disconnectedMatch || // As well, disconnected nodes are said to be in a document
              // fragment in IE 9
              (elem.document && elem.document.nodeType !== 11)
            ) {
              return ret;
            }
          } catch (e) {
            nonnativeSelectorCache(expr, true);
          }
        }

        return Sizzle(expr, document, null, [elem]).length > 0;
      };

      Sizzle.contains = function (context, elem) {
        // Set document vars if needed
        // Support: IE 11+, Edge 17 - 18+
        // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        if ((context.ownerDocument || context) != document) {
          setDocument(context);
        }

        return contains(context, elem);
      };

      Sizzle.attr = function (elem, name) {
        // Set document vars if needed
        // Support: IE 11+, Edge 17 - 18+
        // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
        // two documents; shallow comparisons work.
        // eslint-disable-next-line eqeqeq
        if ((elem.ownerDocument || elem) != document) {
          setDocument(elem);
        }

        var fn = Expr.attrHandle[name.toLowerCase()],
          // Don't get fooled by Object.prototype properties (jQuery #13807)
          val = fn && hasOwn.call(Expr.attrHandle, name.toLowerCase()) ? fn(elem, name, !documentIsHTML) : undefined;
        return val !== undefined
          ? val
          : support.attributes || !documentIsHTML
            ? elem.getAttribute(name)
            : (val = elem.getAttributeNode(name)) && val.specified
              ? val.value
              : null;
      };

      Sizzle.escape = function (sel) {
        return (sel + '').replace(rcssescape, fcssescape);
      };

      Sizzle.error = function (msg) {
        throw new Error('Syntax error, unrecognized expression: ' + msg);
      };
      /**
       * Document sorting and removing duplicates
       * @param {ArrayLike} results
       */

      Sizzle.uniqueSort = function (results) {
        var elem,
          duplicates = [],
          j = 0,
          i = 0; // Unless we *know* we can detect duplicates, assume their presence

        hasDuplicate = !support.detectDuplicates;
        sortInput = !support.sortStable && results.slice(0);
        results.sort(sortOrder);

        if (hasDuplicate) {
          while ((elem = results[i++])) {
            if (elem === results[i]) {
              j = duplicates.push(i);
            }
          }

          while (j--) {
            results.splice(duplicates[j], 1);
          }
        } // Clear input after sorting to release objects
        // See https://github.com/jquery/sizzle/pull/225

        sortInput = null;
        return results;
      };
      /**
       * Utility function for retrieving the text value of an array of DOM nodes
       * @param {Array|Element} elem
       */

      getText = Sizzle.getText = function (elem) {
        var node,
          ret = '',
          i = 0,
          nodeType = elem.nodeType;

        if (!nodeType) {
          // If no nodeType, this is expected to be an array
          while ((node = elem[i++])) {
            // Do not traverse comment nodes
            ret += getText(node);
          }
        } else if (nodeType === 1 || nodeType === 9 || nodeType === 11) {
          // Use textContent for elements
          // innerText usage removed for consistency of new lines (jQuery #11153)
          if (typeof elem.textContent === 'string') {
            return elem.textContent;
          } else {
            // Traverse its children
            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
              ret += getText(elem);
            }
          }
        } else if (nodeType === 3 || nodeType === 4) {
          return elem.nodeValue;
        } // Do not include comment or processing instruction nodes

        return ret;
      };

      Expr = Sizzle.selectors = {
        // Can be adjusted by the user
        cacheLength: 50,
        createPseudo: markFunction,
        match: matchExpr,
        attrHandle: {},
        find: {},
        relative: {
          '>': {
            dir: 'parentNode',
            first: true,
          },
          ' ': {
            dir: 'parentNode',
          },
          '+': {
            dir: 'previousSibling',
            first: true,
          },
          '~': {
            dir: 'previousSibling',
          },
        },
        preFilter: {
          ATTR: function ATTR(match) {
            match[1] = match[1].replace(runescape, funescape); // Move the given value to match[3] whether quoted or unquoted

            match[3] = (match[3] || match[4] || match[5] || '').replace(runescape, funescape);

            if (match[2] === '~=') {
              match[3] = ' ' + match[3] + ' ';
            }

            return match.slice(0, 4);
          },
          CHILD: function CHILD(match) {
            /* matches from matchExpr["CHILD"]
          	1 type (only|nth|...)
          	2 what (child|of-type)
          	3 argument (even|odd|\d*|\d*n([+-]\d+)?|...)
          	4 xn-component of xn+y argument ([+-]?\d*n|)
          	5 sign of xn-component
          	6 x of xn-component
          	7 sign of y-component
          	8 y of y-component
          */
            match[1] = match[1].toLowerCase();

            if (match[1].slice(0, 3) === 'nth') {
              // nth-* requires argument
              if (!match[3]) {
                Sizzle.error(match[0]);
              } // numeric x and y parameters for Expr.filter.CHILD
              // remember that false/true cast respectively to 0/1

              match[4] = +(match[4] ? match[5] + (match[6] || 1) : 2 * (match[3] === 'even' || match[3] === 'odd'));
              match[5] = +(match[7] + match[8] || match[3] === 'odd'); // other types prohibit arguments
            } else if (match[3]) {
              Sizzle.error(match[0]);
            }

            return match;
          },
          PSEUDO: function PSEUDO(match) {
            var excess,
              unquoted = !match[6] && match[2];

            if (matchExpr['CHILD'].test(match[0])) {
              return null;
            } // Accept quoted arguments as-is

            if (match[3]) {
              match[2] = match[4] || match[5] || ''; // Strip excess characters from unquoted arguments
            } else if (
              unquoted &&
              rpseudo.test(unquoted) &&
              (excess = tokenize(unquoted, true)) &&
              (excess = unquoted.indexOf(')', unquoted.length - excess) - unquoted.length)
            ) {
              // excess is a negative index
              match[0] = match[0].slice(0, excess);
              match[2] = unquoted.slice(0, excess);
            } // Return only captures needed by the pseudo filter method (type and argument)

            return match.slice(0, 3);
          },
        },
        filter: {
          TAG: function TAG(nodeNameSelector) {
            var nodeName = nodeNameSelector.replace(runescape, funescape).toLowerCase();
            return nodeNameSelector === '*'
              ? function () {
                  return true;
                }
              : function (elem) {
                  return elem.nodeName && elem.nodeName.toLowerCase() === nodeName;
                };
          },
          CLASS: function CLASS(className) {
            var pattern = classCache[className + ' '];
            return (
              pattern ||
              ((pattern = new RegExp('(^|' + whitespace + ')' + className + '(' + whitespace + '|$)')) &&
                classCache(className, function (elem) {
                  return pattern.test(
                    (typeof elem.className === 'string' && elem.className) ||
                      (typeof elem.getAttribute !== 'undefined' && elem.getAttribute('class')) ||
                      '',
                  );
                }))
            );
          },
          ATTR: function ATTR(name, operator, check) {
            return function (elem) {
              var result = Sizzle.attr(elem, name);

              if (result == null) {
                return operator === '!=';
              }

              if (!operator) {
                return true;
              }

              result += '';
              /* eslint-disable max-len */

              return operator === '='
                ? result === check
                : operator === '!='
                  ? result !== check
                  : operator === '^='
                    ? check && result.indexOf(check) === 0
                    : operator === '*='
                      ? check && result.indexOf(check) > -1
                      : operator === '$='
                        ? check && result.slice(-check.length) === check
                        : operator === '~='
                          ? (' ' + result.replace(rwhitespace, ' ') + ' ').indexOf(check) > -1
                          : operator === '|='
                            ? result === check || result.slice(0, check.length + 1) === check + '-'
                            : false;
              /* eslint-enable max-len */
            };
          },
          CHILD: function CHILD(type, what, _argument, first, last) {
            var simple = type.slice(0, 3) !== 'nth',
              forward = type.slice(-4) !== 'last',
              ofType = what === 'of-type';
            return first === 1 && last === 0 // Shortcut for :nth-*(n)
              ? function (elem) {
                  return !!elem.parentNode;
                }
              : function (elem, _context, xml) {
                  var cache,
                    uniqueCache,
                    outerCache,
                    node,
                    nodeIndex,
                    start,
                    dir = simple !== forward ? 'nextSibling' : 'previousSibling',
                    parent = elem.parentNode,
                    name = ofType && elem.nodeName.toLowerCase(),
                    useCache = !xml && !ofType,
                    diff = false;

                  if (parent) {
                    // :(first|last|only)-(child|of-type)
                    if (simple) {
                      while (dir) {
                        node = elem;

                        while ((node = node[dir])) {
                          if (ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) {
                            return false;
                          }
                        } // Reverse direction for :only-* (if we haven't yet done so)

                        start = dir = type === 'only' && !start && 'nextSibling';
                      }

                      return true;
                    }

                    start = [forward ? parent.firstChild : parent.lastChild]; // non-xml :nth-child(...) stores cache data on `parent`

                    if (forward && useCache) {
                      // Seek `elem` from a previously-cached index
                      // ...in a gzip-friendly way
                      node = parent;
                      outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                      // Defend against cloned attroperties (jQuery gh-1709)

                      uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                      cache = uniqueCache[type] || [];
                      nodeIndex = cache[0] === dirruns && cache[1];
                      diff = nodeIndex && cache[2];
                      node = nodeIndex && parent.childNodes[nodeIndex];

                      while ((node = (++nodeIndex && node && node[dir]) || (diff = nodeIndex = 0) || start.pop())) {
                        // When found, cache indexes on `parent` and break
                        if (node.nodeType === 1 && ++diff && node === elem) {
                          uniqueCache[type] = [dirruns, nodeIndex, diff];
                          break;
                        }
                      }
                    } else {
                      // Use previously-cached element index if available
                      if (useCache) {
                        // ...in a gzip-friendly way
                        node = elem;
                        outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                        // Defend against cloned attroperties (jQuery gh-1709)

                        uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                        cache = uniqueCache[type] || [];
                        nodeIndex = cache[0] === dirruns && cache[1];
                        diff = nodeIndex;
                      } // xml :nth-child(...)
                      // or :nth-last-child(...) or :nth(-last)?-of-type(...)

                      if (diff === false) {
                        // Use the same loop as above to seek `elem` from the start
                        while ((node = (++nodeIndex && node && node[dir]) || (diff = nodeIndex = 0) || start.pop())) {
                          if ((ofType ? node.nodeName.toLowerCase() === name : node.nodeType === 1) && ++diff) {
                            // Cache the index of each encountered element
                            if (useCache) {
                              outerCache = node[expando] || (node[expando] = {}); // Support: IE <9 only
                              // Defend against cloned attroperties (jQuery gh-1709)

                              uniqueCache = outerCache[node.uniqueID] || (outerCache[node.uniqueID] = {});
                              uniqueCache[type] = [dirruns, diff];
                            }

                            if (node === elem) {
                              break;
                            }
                          }
                        }
                      }
                    } // Incorporate the offset, then check against cycle size

                    diff -= last;
                    return diff === first || (diff % first === 0 && diff / first >= 0);
                  }
                };
          },
          PSEUDO: function PSEUDO(pseudo, argument) {
            // pseudo-class names are case-insensitive
            // http://www.w3.org/TR/selectors/#pseudo-classes
            // Prioritize by case sensitivity in case custom pseudos are added with uppercase letters
            // Remember that setFilters inherits from pseudos
            var args,
              fn =
                Expr.pseudos[pseudo] ||
                Expr.setFilters[pseudo.toLowerCase()] ||
                Sizzle.error('unsupported pseudo: ' + pseudo); // The user may use createPseudo to indicate that
            // arguments are needed to create the filter function
            // just as Sizzle does

            if (fn[expando]) {
              return fn(argument);
            } // But maintain support for old signatures

            if (fn.length > 1) {
              args = [pseudo, pseudo, '', argument];
              return Expr.setFilters.hasOwnProperty(pseudo.toLowerCase())
                ? markFunction(function (seed, matches) {
                    var idx,
                      matched = fn(seed, argument),
                      i = matched.length;

                    while (i--) {
                      idx = indexOf(seed, matched[i]);
                      seed[idx] = !(matches[idx] = matched[i]);
                    }
                  })
                : function (elem) {
                    return fn(elem, 0, args);
                  };
            }

            return fn;
          },
        },
        pseudos: {
          // Potentially complex pseudos
          not: markFunction(function (selector) {
            // Trim the selector passed to compile
            // to avoid treating leading and trailing
            // spaces as combinators
            var input = [],
              results = [],
              matcher = compile(selector.replace(rtrim, '$1'));
            return matcher[expando]
              ? markFunction(function (seed, matches, _context, xml) {
                  var elem,
                    unmatched = matcher(seed, null, xml, []),
                    i = seed.length; // Match elements unmatched by `matcher`

                  while (i--) {
                    if ((elem = unmatched[i])) {
                      seed[i] = !(matches[i] = elem);
                    }
                  }
                })
              : function (elem, _context, xml) {
                  input[0] = elem;
                  matcher(input, null, xml, results); // Don't keep the element (issue #299)

                  input[0] = null;
                  return !results.pop();
                };
          }),
          has: markFunction(function (selector) {
            return function (elem) {
              return Sizzle(selector, elem).length > 0;
            };
          }),
          contains: markFunction(function (text) {
            text = text.replace(runescape, funescape);
            return function (elem) {
              return (elem.textContent || getText(elem)).indexOf(text) > -1;
            };
          }),
          // "Whether an element is represented by a :lang() selector
          // is based solely on the element's language value
          // being equal to the identifier C,
          // or beginning with the identifier C immediately followed by "-".
          // The matching of C against the element's language value is performed case-insensitively.
          // The identifier C does not have to be a valid language name."
          // http://www.w3.org/TR/selectors/#lang-pseudo
          lang: markFunction(function (lang) {
            // lang value must be a valid identifier
            if (!ridentifier.test(lang || '')) {
              Sizzle.error('unsupported lang: ' + lang);
            }

            lang = lang.replace(runescape, funescape).toLowerCase();
            return function (elem) {
              var elemLang;

              do {
                if (
                  (elemLang = documentIsHTML ? elem.lang : elem.getAttribute('xml:lang') || elem.getAttribute('lang'))
                ) {
                  elemLang = elemLang.toLowerCase();
                  return elemLang === lang || elemLang.indexOf(lang + '-') === 0;
                }
              } while ((elem = elem.parentNode) && elem.nodeType === 1);

              return false;
            };
          }),
          // Miscellaneous
          target: function target(elem) {
            var hash = window.location && window.location.hash;
            return hash && hash.slice(1) === elem.id;
          },
          root: function root(elem) {
            return elem === docElem;
          },
          focus: function focus(elem) {
            return (
              elem === document.activeElement &&
              (!document.hasFocus || document.hasFocus()) &&
              !!(elem.type || elem.href || ~elem.tabIndex)
            );
          },
          // Boolean properties
          enabled: createDisabledPseudo(false),
          disabled: createDisabledPseudo(true),
          checked: function checked(elem) {
            // In CSS3, :checked should return both checked and selected elements
            // http://www.w3.org/TR/2011/REC-css3-selectors-20110929/#checked
            var nodeName = elem.nodeName.toLowerCase();
            return (nodeName === 'input' && !!elem.checked) || (nodeName === 'option' && !!elem.selected);
          },
          selected: function selected(elem) {
            // Accessing this property makes selected-by-default
            // options in Safari work properly
            if (elem.parentNode) {
              // eslint-disable-next-line no-unused-expressions
              elem.parentNode.selectedIndex;
            }

            return elem.selected === true;
          },
          // Contents
          empty: function empty(elem) {
            // http://www.w3.org/TR/selectors/#empty-pseudo
            // :empty is negated by element (1) or content nodes (text: 3; cdata: 4; entity ref: 5),
            //   but not by others (comment: 8; processing instruction: 7; etc.)
            // nodeType < 6 works because attributes (2) do not appear as children
            for (elem = elem.firstChild; elem; elem = elem.nextSibling) {
              if (elem.nodeType < 6) {
                return false;
              }
            }

            return true;
          },
          parent: function parent(elem) {
            return !Expr.pseudos['empty'](elem);
          },
          // Element/input types
          header: function header(elem) {
            return rheader.test(elem.nodeName);
          },
          input: function input(elem) {
            return rinputs.test(elem.nodeName);
          },
          button: function button(elem) {
            var name = elem.nodeName.toLowerCase();
            return (name === 'input' && elem.type === 'button') || name === 'button';
          },
          text: function text(elem) {
            var attr;
            return (
              elem.nodeName.toLowerCase() === 'input' &&
              elem.type === 'text' &&
              ((attr = elem.getAttribute('type')) == null || attr.toLowerCase() === 'text')
            );
          },
          // Position-in-collection
          first: createPositionalPseudo(function () {
            return [0];
          }),
          last: createPositionalPseudo(function (_matchIndexes, length) {
            return [length - 1];
          }),
          eq: createPositionalPseudo(function (_matchIndexes, length, argument) {
            return [argument < 0 ? argument + length : argument];
          }),
          even: createPositionalPseudo(function (matchIndexes, length) {
            var i = 0;

            for (; i < length; i += 2) {
              matchIndexes.push(i);
            }

            return matchIndexes;
          }),
          odd: createPositionalPseudo(function (matchIndexes, length) {
            var i = 1;

            for (; i < length; i += 2) {
              matchIndexes.push(i);
            }

            return matchIndexes;
          }),
          lt: createPositionalPseudo(function (matchIndexes, length, argument) {
            var i = argument < 0 ? argument + length : argument > length ? length : argument;

            for (; --i >= 0; ) {
              matchIndexes.push(i);
            }

            return matchIndexes;
          }),
          gt: createPositionalPseudo(function (matchIndexes, length, argument) {
            var i = argument < 0 ? argument + length : argument;

            for (; ++i < length; ) {
              matchIndexes.push(i);
            }

            return matchIndexes;
          }),
        },
      };
      Expr.pseudos['nth'] = Expr.pseudos['eq']; // Add button/input type pseudos

      for (i in {
        radio: true,
        checkbox: true,
        file: true,
        password: true,
        image: true,
      }) {
        Expr.pseudos[i] = createInputPseudo(i);
      }

      for (i in {
        submit: true,
        reset: true,
      }) {
        Expr.pseudos[i] = createButtonPseudo(i);
      } // Easy API for creating new setFilters

      function setFilters() {}

      setFilters.prototype = Expr.filters = Expr.pseudos;
      Expr.setFilters = new setFilters();

      tokenize = Sizzle.tokenize = function (selector, parseOnly) {
        var matched,
          match,
          tokens,
          type,
          soFar,
          groups,
          preFilters,
          cached = tokenCache[selector + ' '];

        if (cached) {
          return parseOnly ? 0 : cached.slice(0);
        }

        soFar = selector;
        groups = [];
        preFilters = Expr.preFilter;

        while (soFar) {
          // Comma and first run
          if (!matched || (match = rcomma.exec(soFar))) {
            if (match) {
              // Don't consume trailing commas as valid
              soFar = soFar.slice(match[0].length) || soFar;
            }

            groups.push((tokens = []));
          }

          matched = false; // Combinators

          if ((match = rcombinators.exec(soFar))) {
            matched = match.shift();
            tokens.push({
              value: matched,
              // Cast descendant combinators to space
              type: match[0].replace(rtrim, ' '),
            });
            soFar = soFar.slice(matched.length);
          } // Filters

          for (type in Expr.filter) {
            if ((match = matchExpr[type].exec(soFar)) && (!preFilters[type] || (match = preFilters[type](match)))) {
              matched = match.shift();
              tokens.push({
                value: matched,
                type: type,
                matches: match,
              });
              soFar = soFar.slice(matched.length);
            }
          }

          if (!matched) {
            break;
          }
        } // Return the length of the invalid excess
        // if we're just parsing
        // Otherwise, throw an error or return tokens

        return parseOnly
          ? soFar.length
          : soFar
            ? Sizzle.error(selector) // Cache the tokens
            : tokenCache(selector, groups).slice(0);
      };

      function toSelector(tokens) {
        var i = 0,
          len = tokens.length,
          selector = '';

        for (; i < len; i++) {
          selector += tokens[i].value;
        }

        return selector;
      }

      function addCombinator(matcher, combinator, base) {
        var dir = combinator.dir,
          skip = combinator.next,
          key = skip || dir,
          checkNonElements = base && key === 'parentNode',
          doneName = done++;
        return combinator.first // Check against closest ancestor/preceding element
          ? function (elem, context, xml) {
              while ((elem = elem[dir])) {
                if (elem.nodeType === 1 || checkNonElements) {
                  return matcher(elem, context, xml);
                }
              }

              return false;
            } // Check against all ancestor/preceding elements
          : function (elem, context, xml) {
              var oldCache,
                uniqueCache,
                outerCache,
                newCache = [dirruns, doneName]; // We can't set arbitrary data on XML nodes, so they don't benefit from combinator caching

              if (xml) {
                while ((elem = elem[dir])) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    if (matcher(elem, context, xml)) {
                      return true;
                    }
                  }
                }
              } else {
                while ((elem = elem[dir])) {
                  if (elem.nodeType === 1 || checkNonElements) {
                    outerCache = elem[expando] || (elem[expando] = {}); // Support: IE <9 only
                    // Defend against cloned attroperties (jQuery gh-1709)

                    uniqueCache = outerCache[elem.uniqueID] || (outerCache[elem.uniqueID] = {});

                    if (skip && skip === elem.nodeName.toLowerCase()) {
                      elem = elem[dir] || elem;
                    } else if ((oldCache = uniqueCache[key]) && oldCache[0] === dirruns && oldCache[1] === doneName) {
                      // Assign to newCache so results back-propagate to previous elements
                      return (newCache[2] = oldCache[2]);
                    } else {
                      // Reuse newcache so results back-propagate to previous elements
                      uniqueCache[key] = newCache; // A match means we're done; a fail means we have to keep checking

                      if ((newCache[2] = matcher(elem, context, xml))) {
                        return true;
                      }
                    }
                  }
                }
              }

              return false;
            };
      }

      function elementMatcher(matchers) {
        return matchers.length > 1
          ? function (elem, context, xml) {
              var i = matchers.length;

              while (i--) {
                if (!matchers[i](elem, context, xml)) {
                  return false;
                }
              }

              return true;
            }
          : matchers[0];
      }

      function multipleContexts(selector, contexts, results) {
        var i = 0,
          len = contexts.length;

        for (; i < len; i++) {
          Sizzle(selector, contexts[i], results);
        }

        return results;
      }

      function condense(unmatched, map, filter, context, xml) {
        var elem,
          newUnmatched = [],
          i = 0,
          len = unmatched.length,
          mapped = map != null;

        for (; i < len; i++) {
          if ((elem = unmatched[i])) {
            if (!filter || filter(elem, context, xml)) {
              newUnmatched.push(elem);

              if (mapped) {
                map.push(i);
              }
            }
          }
        }

        return newUnmatched;
      }

      function setMatcher(preFilter, selector, matcher, postFilter, postFinder, postSelector) {
        if (postFilter && !postFilter[expando]) {
          postFilter = setMatcher(postFilter);
        }

        if (postFinder && !postFinder[expando]) {
          postFinder = setMatcher(postFinder, postSelector);
        }

        return markFunction(function (seed, results, context, xml) {
          var temp,
            i,
            elem,
            preMap = [],
            postMap = [],
            preexisting = results.length,
            // Get initial elements from seed or context
            elems = seed || multipleContexts(selector || '*', context.nodeType ? [context] : context, []),
            // Prefilter to get matcher input, preserving a map for seed-results synchronization
            matcherIn = preFilter && (seed || !selector) ? condense(elems, preMap, preFilter, context, xml) : elems,
            matcherOut = matcher // If we have a postFinder, or filtered seed, or non-seed postFilter or preexisting results,
              ? postFinder || (seed ? preFilter : preexisting || postFilter) // ...intermediate processing is necessary
                ? [] // ...otherwise use results directly
                : results
              : matcherIn; // Find primary matches

          if (matcher) {
            matcher(matcherIn, matcherOut, context, xml);
          } // Apply postFilter

          if (postFilter) {
            temp = condense(matcherOut, postMap);
            postFilter(temp, [], context, xml); // Un-match failing elements by moving them back to matcherIn

            i = temp.length;

            while (i--) {
              if ((elem = temp[i])) {
                matcherOut[postMap[i]] = !(matcherIn[postMap[i]] = elem);
              }
            }
          }

          if (seed) {
            if (postFinder || preFilter) {
              if (postFinder) {
                // Get the final matcherOut by condensing this intermediate into postFinder contexts
                temp = [];
                i = matcherOut.length;

                while (i--) {
                  if ((elem = matcherOut[i])) {
                    // Restore matcherIn since elem is not yet a final match
                    temp.push((matcherIn[i] = elem));
                  }
                }

                postFinder(null, (matcherOut = []), temp, xml);
              } // Move matched elements from seed to results to keep them synchronized

              i = matcherOut.length;

              while (i--) {
                if ((elem = matcherOut[i]) && (temp = postFinder ? indexOf(seed, elem) : preMap[i]) > -1) {
                  seed[temp] = !(results[temp] = elem);
                }
              }
            } // Add elements to results, through postFinder if defined
          } else {
            matcherOut = condense(
              matcherOut === results ? matcherOut.splice(preexisting, matcherOut.length) : matcherOut,
            );

            if (postFinder) {
              postFinder(null, results, matcherOut, xml);
            } else {
              push.apply(results, matcherOut);
            }
          }
        });
      }

      function matcherFromTokens(tokens) {
        var checkContext,
          matcher,
          j,
          len = tokens.length,
          leadingRelative = Expr.relative[tokens[0].type],
          implicitRelative = leadingRelative || Expr.relative[' '],
          i = leadingRelative ? 1 : 0,
          // The foundational matcher ensures that elements are reachable from top-level context(s)
          matchContext = addCombinator(
            function (elem) {
              return elem === checkContext;
            },
            implicitRelative,
            true,
          ),
          matchAnyContext = addCombinator(
            function (elem) {
              return indexOf(checkContext, elem) > -1;
            },
            implicitRelative,
            true,
          ),
          matchers = [
            function (elem, context, xml) {
              var ret =
                (!leadingRelative && (xml || context !== outermostContext)) ||
                ((checkContext = context).nodeType
                  ? matchContext(elem, context, xml)
                  : matchAnyContext(elem, context, xml)); // Avoid hanging onto element (issue #299)

              checkContext = null;
              return ret;
            },
          ];

        for (; i < len; i++) {
          if ((matcher = Expr.relative[tokens[i].type])) {
            matchers = [addCombinator(elementMatcher(matchers), matcher)];
          } else {
            matcher = Expr.filter[tokens[i].type].apply(null, tokens[i].matches); // Return special upon seeing a positional matcher

            if (matcher[expando]) {
              // Find the next relative operator (if any) for proper handling
              j = ++i;

              for (; j < len; j++) {
                if (Expr.relative[tokens[j].type]) {
                  break;
                }
              }

              return setMatcher(
                i > 1 && elementMatcher(matchers),
                i > 1 &&
                  toSelector(
                    // If the preceding token was a descendant combinator, insert an implicit any-element `*`
                    tokens.slice(0, i - 1).concat({
                      value: tokens[i - 2].type === ' ' ? '*' : '',
                    }),
                  ).replace(rtrim, '$1'),
                matcher,
                i < j && matcherFromTokens(tokens.slice(i, j)),
                j < len && matcherFromTokens((tokens = tokens.slice(j))),
                j < len && toSelector(tokens),
              );
            }

            matchers.push(matcher);
          }
        }

        return elementMatcher(matchers);
      }

      function matcherFromGroupMatchers(elementMatchers, setMatchers) {
        var bySet = setMatchers.length > 0,
          byElement = elementMatchers.length > 0,
          superMatcher = function superMatcher(seed, context, xml, results, outermost) {
            var elem,
              j,
              matcher,
              matchedCount = 0,
              i = '0',
              unmatched = seed && [],
              setMatched = [],
              contextBackup = outermostContext,
              // We must always have either seed elements or outermost context
              elems = seed || (byElement && Expr.find['TAG']('*', outermost)),
              // Use integer dirruns iff this is the outermost matcher
              dirrunsUnique = (dirruns += contextBackup == null ? 1 : Math.random() || 0.1),
              len = elems.length;

            if (outermost) {
              // Support: IE 11+, Edge 17 - 18+
              // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
              // two documents; shallow comparisons work.
              // eslint-disable-next-line eqeqeq
              outermostContext = context == document || context || outermost;
            } // Add elements passing elementMatchers directly to results
            // Support: IE<9, Safari
            // Tolerate NodeList properties (IE: "length"; Safari: <number>) matching elements by id

            for (; i !== len && (elem = elems[i]) != null; i++) {
              if (byElement && elem) {
                j = 0; // Support: IE 11+, Edge 17 - 18+
                // IE/Edge sometimes throw a "Permission denied" error when strict-comparing
                // two documents; shallow comparisons work.
                // eslint-disable-next-line eqeqeq

                if (!context && elem.ownerDocument != document) {
                  setDocument(elem);
                  xml = !documentIsHTML;
                }

                while ((matcher = elementMatchers[j++])) {
                  if (matcher(elem, context || document, xml)) {
                    results.push(elem);
                    break;
                  }
                }

                if (outermost) {
                  dirruns = dirrunsUnique;
                }
              } // Track unmatched elements for set filters

              if (bySet) {
                // They will have gone through all possible matchers
                if ((elem = !matcher && elem)) {
                  matchedCount--;
                } // Lengthen the array for every element, matched or not

                if (seed) {
                  unmatched.push(elem);
                }
              }
            } // `i` is now the count of elements visited above, and adding it to `matchedCount`
            // makes the latter nonnegative.

            matchedCount += i; // Apply set filters to unmatched elements
            // NOTE: This can be skipped if there are no unmatched elements (i.e., `matchedCount`
            // equals `i`), unless we didn't visit _any_ elements in the above loop because we have
            // no element matchers and no seed.
            // Incrementing an initially-string "0" `i` allows `i` to remain a string only in that
            // case, which will result in a "00" `matchedCount` that differs from `i` but is also
            // numerically zero.

            if (bySet && i !== matchedCount) {
              j = 0;

              while ((matcher = setMatchers[j++])) {
                matcher(unmatched, setMatched, context, xml);
              }

              if (seed) {
                // Reintegrate element matches to eliminate the need for sorting
                if (matchedCount > 0) {
                  while (i--) {
                    if (!(unmatched[i] || setMatched[i])) {
                      setMatched[i] = pop.call(results);
                    }
                  }
                } // Discard index placeholder values to get only actual matches

                setMatched = condense(setMatched);
              } // Add matches to results

              push.apply(results, setMatched); // Seedless set matches succeeding multiple successful matchers stipulate sorting

              if (outermost && !seed && setMatched.length > 0 && matchedCount + setMatchers.length > 1) {
                Sizzle.uniqueSort(results);
              }
            } // Override manipulation of globals by nested matchers

            if (outermost) {
              dirruns = dirrunsUnique;
              outermostContext = contextBackup;
            }

            return unmatched;
          };

        return bySet ? markFunction(superMatcher) : superMatcher;
      }

      compile = Sizzle.compile = function (
        selector,
        match,
        /* Internal Use Only */
      ) {
        var i,
          setMatchers = [],
          elementMatchers = [],
          cached = compilerCache[selector + ' '];

        if (!cached) {
          // Generate a function of recursive functions that can be used to check each element
          if (!match) {
            match = tokenize(selector);
          }

          i = match.length;

          while (i--) {
            cached = matcherFromTokens(match[i]);

            if (cached[expando]) {
              setMatchers.push(cached);
            } else {
              elementMatchers.push(cached);
            }
          } // Cache the compiled function

          cached = compilerCache(selector, matcherFromGroupMatchers(elementMatchers, setMatchers)); // Save selector and tokenization

          cached.selector = selector;
        }

        return cached;
      };
      /**
       * A low-level selection function that works with Sizzle's compiled
       *  selector functions
       * @param {String|Function} selector A selector or a pre-compiled
       *  selector function built with Sizzle.compile
       * @param {Element} context
       * @param {Array} [results]
       * @param {Array} [seed] A set of elements to match against
       */

      select = Sizzle.select = function (selector, context, results, seed) {
        var i,
          tokens,
          token,
          type,
          find,
          compiled = typeof selector === 'function' && selector,
          match = !seed && tokenize((selector = compiled.selector || selector));
        results = results || []; // Try to minimize operations if there is only one selector in the list and no seed
        // (the latter of which guarantees us context)

        if (match.length === 1) {
          // Reduce context if the leading compound selector is an ID
          tokens = match[0] = match[0].slice(0);

          if (
            tokens.length > 2 &&
            (token = tokens[0]).type === 'ID' &&
            context.nodeType === 9 &&
            documentIsHTML &&
            Expr.relative[tokens[1].type]
          ) {
            context = (Expr.find['ID'](token.matches[0].replace(runescape, funescape), context) || [])[0];

            if (!context) {
              return results; // Precompiled matchers will still verify ancestry, so step up a level
            } else if (compiled) {
              context = context.parentNode;
            }

            selector = selector.slice(tokens.shift().value.length);
          } // Fetch a seed set for right-to-left matching

          i = matchExpr['needsContext'].test(selector) ? 0 : tokens.length;

          while (i--) {
            token = tokens[i]; // Abort if we hit a combinator

            if (Expr.relative[(type = token.type)]) {
              break;
            }

            if ((find = Expr.find[type])) {
              // Search, expanding context for leading sibling combinators
              if (
                (seed = find(
                  token.matches[0].replace(runescape, funescape),
                  (rsibling.test(tokens[0].type) && testContext(context.parentNode)) || context,
                ))
              ) {
                // If seed is empty or no tokens remain, we can return early
                tokens.splice(i, 1);
                selector = seed.length && toSelector(tokens);

                if (!selector) {
                  push.apply(results, seed);
                  return results;
                }

                break;
              }
            }
          }
        } // Compile and execute a filtering function if one is not provided
        // Provide `match` to avoid retokenization if we modified the selector above

        (compiled || compile(selector, match))(
          seed,
          context,
          !documentIsHTML,
          results,
          !context || (rsibling.test(selector) && testContext(context.parentNode)) || context,
        );
        return results;
      }; // One-time assignments
      // Sort stability

      support.sortStable = expando.split('').sort(sortOrder).join('') === expando; // Support: Chrome 14-35+
      // Always assume duplicates if they aren't passed to the comparison function

      support.detectDuplicates = !!hasDuplicate; // Initialize against the default document

      setDocument(); // Support: Webkit<537.32 - Safari 6.0.3/Chrome 25 (fixed in Chrome 27)
      // Detached nodes confoundingly follow *each other*

      support.sortDetached = assert(function (el) {
        // Should return 1, but returns 4 (following)
        return el.compareDocumentPosition(document.createElement('fieldset')) & 1;
      }); // Support: IE<8
      // Prevent attribute/property "interpolation"
      // https://msdn.microsoft.com/en-us/library/ms536429%28VS.85%29.aspx

      if (
        !assert(function (el) {
          el.innerHTML = "<a href='#'></a>";
          return el.firstChild.getAttribute('href') === '#';
        })
      ) {
        addHandle('type|href|height|width', function (elem, name, isXML) {
          if (!isXML) {
            return elem.getAttribute(name, name.toLowerCase() === 'type' ? 1 : 2);
          }
        });
      } // Support: IE<9
      // Use defaultValue in place of getAttribute("value")

      if (
        !support.attributes ||
        !assert(function (el) {
          el.innerHTML = '<input/>';
          el.firstChild.setAttribute('value', '');
          return el.firstChild.getAttribute('value') === '';
        })
      ) {
        addHandle('value', function (elem, _name, isXML) {
          if (!isXML && elem.nodeName.toLowerCase() === 'input') {
            return elem.defaultValue;
          }
        });
      } // Support: IE<9
      // Use getAttributeNode to fetch booleans when getAttribute lies

      if (
        !assert(function (el) {
          return el.getAttribute('disabled') == null;
        })
      ) {
        addHandle(booleans, function (elem, name, isXML) {
          var val;

          if (!isXML) {
            return elem[name] === true
              ? name.toLowerCase()
              : (val = elem.getAttributeNode(name)) && val.specified
                ? val.value
                : null;
          }
        });
      }

      return Sizzle;
    })(window);

  jQuery.find = Sizzle;
  jQuery.expr = Sizzle.selectors; // Deprecated

  jQuery.expr[':'] = jQuery.expr.pseudos;
  jQuery.uniqueSort = jQuery.unique = Sizzle.uniqueSort;
  jQuery.text = Sizzle.getText;
  jQuery.isXMLDoc = Sizzle.isXML;
  jQuery.contains = Sizzle.contains;
  jQuery.escapeSelector = Sizzle.escape;

  var dir = function dir(elem, _dir, until) {
    var matched = [],
      truncate = until !== undefined;

    while ((elem = elem[_dir]) && elem.nodeType !== 9) {
      if (elem.nodeType === 1) {
        if (truncate && jQuery(elem).is(until)) {
          break;
        }

        matched.push(elem);
      }
    }

    return matched;
  };

  var _siblings = function siblings(n, elem) {
    var matched = [];

    for (; n; n = n.nextSibling) {
      if (n.nodeType === 1 && n !== elem) {
        matched.push(n);
      }
    }

    return matched;
  };

  var rneedsContext = jQuery.expr.match.needsContext;

  function nodeName(elem, name) {
    return elem.nodeName && elem.nodeName.toLowerCase() === name.toLowerCase();
  }

  var rsingleTag = /^<([a-z][^\/\0>:\x20\t\r\n\f]*)[\x20\t\r\n\f]*\/?>(?:<\/\1>|)$/i; // Implement the identical functionality for filter and not

  function winnow(elements, qualifier, not) {
    if (isFunction(qualifier)) {
      return jQuery.grep(elements, function (elem, i) {
        return !!qualifier.call(elem, i, elem) !== not;
      });
    } // Single element

    if (qualifier.nodeType) {
      return jQuery.grep(elements, function (elem) {
        return (elem === qualifier) !== not;
      });
    } // Arraylike of elements (jQuery, arguments, Array)

    if (typeof qualifier !== 'string') {
      return jQuery.grep(elements, function (elem) {
        return indexOf.call(qualifier, elem) > -1 !== not;
      });
    } // Filtered directly for both simple and complex selectors

    return jQuery.filter(qualifier, elements, not);
  }

  jQuery.filter = function (expr, elems, not) {
    var elem = elems[0];

    if (not) {
      expr = ':not(' + expr + ')';
    }

    if (elems.length === 1 && elem.nodeType === 1) {
      return jQuery.find.matchesSelector(elem, expr) ? [elem] : [];
    }

    return jQuery.find.matches(
      expr,
      jQuery.grep(elems, function (elem) {
        return elem.nodeType === 1;
      }),
    );
  };

  jQuery.fn.extend({
    find: function find(selector) {
      var i,
        ret,
        len = this.length,
        self = this;

      if (typeof selector !== 'string') {
        return this.pushStack(
          jQuery(selector).filter(function () {
            for (i = 0; i < len; i++) {
              if (jQuery.contains(self[i], this)) {
                return true;
              }
            }
          }),
        );
      }

      ret = this.pushStack([]);

      for (i = 0; i < len; i++) {
        jQuery.find(selector, self[i], ret);
      }

      return len > 1 ? jQuery.uniqueSort(ret) : ret;
    },
    filter: function filter(selector) {
      return this.pushStack(winnow(this, selector || [], false));
    },
    not: function not(selector) {
      return this.pushStack(winnow(this, selector || [], true));
    },
    is: function is(selector) {
      return !!winnow(
        this, // If this is a positional/relative selector, check membership in the returned set
        // so $("p:first").is("p:last") won't return true for a doc with two "p".
        typeof selector === 'string' && rneedsContext.test(selector) ? jQuery(selector) : selector || [],
        false,
      ).length;
    },
  }); // Initialize a jQuery object
  // A central reference to the root jQuery(document)

  var rootjQuery,
    // A simple way to check for HTML strings
    // Prioritize #id over <tag> to avoid XSS via location.hash (trac-9521)
    // Strict HTML recognition (trac-11290: must start with <)
    // Shortcut simple #id case for speed
    rquickExpr = /^(?:\s*(<[\w\W]+>)[^>]*|#([\w-]+))$/,
    init = (jQuery.fn.init = function (selector, context, root) {
      var match, elem; // HANDLE: $(""), $(null), $(undefined), $(false)

      if (!selector) {
        return this;
      } // Method init() accepts an alternate rootjQuery
      // so migrate can support jQuery.sub (gh-2101)

      root = root || rootjQuery; // Handle HTML strings

      if (typeof selector === 'string') {
        if (selector[0] === '<' && selector[selector.length - 1] === '>' && selector.length >= 3) {
          // Assume that strings that start and end with <> are HTML and skip the regex check
          match = [null, selector, null];
        } else {
          match = rquickExpr.exec(selector);
        } // Match html or make sure no context is specified for #id

        if (match && (match[1] || !context)) {
          // HANDLE: $(html) -> $(array)
          if (match[1]) {
            context = context instanceof jQuery ? context[0] : context; // Option to run scripts is true for back-compat
            // Intentionally let the error be thrown if parseHTML is not present

            jQuery.merge(
              this,
              jQuery.parseHTML(
                match[1],
                context && context.nodeType ? context.ownerDocument || context : document,
                true,
              ),
            ); // HANDLE: $(html, props)

            if (rsingleTag.test(match[1]) && jQuery.isPlainObject(context)) {
              for (match in context) {
                // Properties of context are called as methods if possible
                if (isFunction(this[match])) {
                  this[match](context[match]); // ...and otherwise set as attributes
                } else {
                  this.attr(match, context[match]);
                }
              }
            }

            return this; // HANDLE: $(#id)
          } else {
            elem = document.getElementById(match[2]);

            if (elem) {
              // Inject the element directly into the jQuery object
              this[0] = elem;
              this.length = 1;
            }

            return this;
          } // HANDLE: $(expr, $(...))
        } else if (!context || context.jquery) {
          return (context || root).find(selector); // HANDLE: $(expr, context)
          // (which is just equivalent to: $(context).find(expr)
        } else {
          return this.constructor(context).find(selector);
        } // HANDLE: $(DOMElement)
      } else if (selector.nodeType) {
        this[0] = selector;
        this.length = 1;
        return this; // HANDLE: $(function)
        // Shortcut for document ready
      } else if (isFunction(selector)) {
        return root.ready !== undefined
          ? root.ready(selector) // Execute immediately if ready is not present
          : selector(jQuery);
      }

      return jQuery.makeArray(selector, this);
    }); // Give the init function the jQuery prototype for later instantiation

  init.prototype = jQuery.fn; // Initialize central reference

  rootjQuery = jQuery(document);
  var rparentsprev = /^(?:parents|prev(?:Until|All))/,
    // Methods guaranteed to produce a unique set when starting from a unique set
    guaranteedUnique = {
      children: true,
      contents: true,
      next: true,
      prev: true,
    };
  jQuery.fn.extend({
    has: function has(target) {
      var targets = jQuery(target, this),
        l = targets.length;
      return this.filter(function () {
        var i = 0;

        for (; i < l; i++) {
          if (jQuery.contains(this, targets[i])) {
            return true;
          }
        }
      });
    },
    closest: function closest(selectors, context) {
      var cur,
        i = 0,
        l = this.length,
        matched = [],
        targets = typeof selectors !== 'string' && jQuery(selectors); // Positional selectors never match, since there's no _selection_ context

      if (!rneedsContext.test(selectors)) {
        for (; i < l; i++) {
          for (cur = this[i]; cur && cur !== context; cur = cur.parentNode) {
            // Always skip document fragments
            if (
              cur.nodeType < 11 &&
              (targets
                ? targets.index(cur) > -1 // Don't pass non-elements to Sizzle
                : cur.nodeType === 1 && jQuery.find.matchesSelector(cur, selectors))
            ) {
              matched.push(cur);
              break;
            }
          }
        }
      }

      return this.pushStack(matched.length > 1 ? jQuery.uniqueSort(matched) : matched);
    },
    // Determine the position of an element within the set
    index: function index(elem) {
      // No argument, return index in parent
      if (!elem) {
        return this[0] && this[0].parentNode ? this.first().prevAll().length : -1;
      } // Index in selector

      if (typeof elem === 'string') {
        return indexOf.call(jQuery(elem), this[0]);
      } // Locate the position of the desired element

      return indexOf.call(
        this, // If it receives a jQuery object, the first element is used
        elem.jquery ? elem[0] : elem,
      );
    },
    add: function add(selector, context) {
      return this.pushStack(jQuery.uniqueSort(jQuery.merge(this.get(), jQuery(selector, context))));
    },
    addBack: function addBack(selector) {
      return this.add(selector == null ? this.prevObject : this.prevObject.filter(selector));
    },
  });

  function sibling(cur, dir) {
    while ((cur = cur[dir]) && cur.nodeType !== 1) {}

    return cur;
  }

  jQuery.each(
    {
      parent: function parent(elem) {
        var parent = elem.parentNode;
        return parent && parent.nodeType !== 11 ? parent : null;
      },
      parents: function parents(elem) {
        return dir(elem, 'parentNode');
      },
      parentsUntil: function parentsUntil(elem, _i, until) {
        return dir(elem, 'parentNode', until);
      },
      next: function next(elem) {
        return sibling(elem, 'nextSibling');
      },
      prev: function prev(elem) {
        return sibling(elem, 'previousSibling');
      },
      nextAll: function nextAll(elem) {
        return dir(elem, 'nextSibling');
      },
      prevAll: function prevAll(elem) {
        return dir(elem, 'previousSibling');
      },
      nextUntil: function nextUntil(elem, _i, until) {
        return dir(elem, 'nextSibling', until);
      },
      prevUntil: function prevUntil(elem, _i, until) {
        return dir(elem, 'previousSibling', until);
      },
      siblings: function siblings(elem) {
        return _siblings((elem.parentNode || {}).firstChild, elem);
      },
      children: function children(elem) {
        return _siblings(elem.firstChild);
      },
      contents: function contents(elem) {
        if (
          elem.contentDocument != null && // Support: IE 11+
          // <object> elements with no `data` attribute has an object
          // `contentDocument` with a `null` prototype.
          getProto(elem.contentDocument)
        ) {
          return elem.contentDocument;
        } // Support: IE 9 - 11 only, iOS 7 only, Android Browser <=4.3 only
        // Treat the template element as a regular one in browsers that
        // don't support it.

        if (nodeName(elem, 'template')) {
          elem = elem.content || elem;
        }

        return jQuery.merge([], elem.childNodes);
      },
    },
    function (name, fn) {
      jQuery.fn[name] = function (until, selector) {
        var matched = jQuery.map(this, fn, until);

        if (name.slice(-5) !== 'Until') {
          selector = until;
        }

        if (selector && typeof selector === 'string') {
          matched = jQuery.filter(selector, matched);
        }

        if (this.length > 1) {
          // Remove duplicates
          if (!guaranteedUnique[name]) {
            jQuery.uniqueSort(matched);
          } // Reverse order for parents* and prev-derivatives

          if (rparentsprev.test(name)) {
            matched.reverse();
          }
        }

        return this.pushStack(matched);
      };
    },
  );
  var rnothtmlwhite = /[^\x20\t\r\n\f]+/g; // Convert String-formatted options into Object-formatted ones

  function createOptions(options) {
    var object = {};
    jQuery.each(options.match(rnothtmlwhite) || [], function (_, flag) {
      object[flag] = true;
    });
    return object;
  }
  /*
   * Create a callback list using the following parameters:
   *
   *	options: an optional list of space-separated options that will change how
   *			the callback list behaves or a more traditional option object
   *
   * By default a callback list will act like an event callback list and can be
   * "fired" multiple times.
   *
   * Possible options:
   *
   *	once:			will ensure the callback list can only be fired once (like a Deferred)
   *
   *	memory:			will keep track of previous values and will call any callback added
   *					after the list has been fired right away with the latest "memorized"
   *					values (like a Deferred)
   *
   *	unique:			will ensure a callback can only be added once (no duplicate in the list)
   *
   *	stopOnFalse:	interrupt callings when a callback returns false
   *
   */

  jQuery.Callbacks = function (options) {
    // Convert options from String-formatted to Object-formatted if needed
    // (we check in cache first)
    options = typeof options === 'string' ? createOptions(options) : jQuery.extend({}, options);

    var // Flag to know if list is currently firing
      firing,
      // Last fire value for non-forgettable lists
      memory,
      // Flag to know if list was already fired
      _fired,
      // Flag to prevent firing
      _locked,
      // Actual callback list
      list = [],
      // Queue of execution data for repeatable lists
      queue = [],
      // Index of currently firing callback (modified by add/remove as needed)
      firingIndex = -1,
      // Fire callbacks
      fire = function fire() {
        // Enforce single-firing
        _locked = _locked || options.once; // Execute callbacks for all pending executions,
        // respecting firingIndex overrides and runtime changes

        _fired = firing = true;

        for (; queue.length; firingIndex = -1) {
          memory = queue.shift();

          while (++firingIndex < list.length) {
            // Run callback and check for early termination
            if (list[firingIndex].apply(memory[0], memory[1]) === false && options.stopOnFalse) {
              // Jump to end and forget the data so .add doesn't re-fire
              firingIndex = list.length;
              memory = false;
            }
          }
        } // Forget the data if we're done with it

        if (!options.memory) {
          memory = false;
        }

        firing = false; // Clean up if we're done firing for good

        if (_locked) {
          // Keep an empty list if we have data for future add calls
          if (memory) {
            list = []; // Otherwise, this object is spent
          } else {
            list = '';
          }
        }
      },
      // Actual Callbacks object
      self = {
        // Add a callback or a collection of callbacks to the list
        add: function add() {
          if (list) {
            // If we have memory from a past run, we should fire after adding
            if (memory && !firing) {
              firingIndex = list.length - 1;
              queue.push(memory);
            }

            (function add(args) {
              jQuery.each(args, function (_, arg) {
                if (isFunction(arg)) {
                  if (!options.unique || !self.has(arg)) {
                    list.push(arg);
                  }
                } else if (arg && arg.length && toType(arg) !== 'string') {
                  // Inspect recursively
                  add(arg);
                }
              });
            })(arguments);

            if (memory && !firing) {
              fire();
            }
          }

          return this;
        },
        // Remove a callback from the list
        remove: function remove() {
          jQuery.each(arguments, function (_, arg) {
            var index;

            while ((index = jQuery.inArray(arg, list, index)) > -1) {
              list.splice(index, 1); // Handle firing indexes

              if (index <= firingIndex) {
                firingIndex--;
              }
            }
          });
          return this;
        },
        // Check if a given callback is in the list.
        // If no argument is given, return whether or not list has callbacks attached.
        has: function has(fn) {
          return fn ? jQuery.inArray(fn, list) > -1 : list.length > 0;
        },
        // Remove all callbacks from the list
        empty: function empty() {
          if (list) {
            list = [];
          }

          return this;
        },
        // Disable .fire and .add
        // Abort any current/pending executions
        // Clear all callbacks and values
        disable: function disable() {
          _locked = queue = [];
          list = memory = '';
          return this;
        },
        disabled: function disabled() {
          return !list;
        },
        // Disable .fire
        // Also disable .add unless we have memory (since it would have no effect)
        // Abort any pending executions
        lock: function lock() {
          _locked = queue = [];

          if (!memory && !firing) {
            list = memory = '';
          }

          return this;
        },
        locked: function locked() {
          return !!_locked;
        },
        // Call all callbacks with the given context and arguments
        fireWith: function fireWith(context, args) {
          if (!_locked) {
            args = args || [];
            args = [context, args.slice ? args.slice() : args];
            queue.push(args);

            if (!firing) {
              fire();
            }
          }

          return this;
        },
        // Call all the callbacks with the given arguments
        fire: function fire() {
          self.fireWith(this, arguments);
          return this;
        },
        // To know if the callbacks have already been called at least once
        fired: function fired() {
          return !!_fired;
        },
      };

    return self;
  };

  function Identity(v) {
    return v;
  }

  function Thrower(ex) {
    throw ex;
  }

  function adoptValue(value, resolve, reject, noValue) {
    var method;

    try {
      // Check for promise aspect first to privilege synchronous behavior
      if (value && isFunction((method = value.promise))) {
        method.call(value).done(resolve).fail(reject); // Other thenables
      } else if (value && isFunction((method = value.then))) {
        method.call(value, resolve, reject); // Other non-thenables
      } else {
        // Control `resolve` arguments by letting Array#slice cast boolean `noValue` to integer:
        // * false: [ value ].slice( 0 ) => resolve( value )
        // * true: [ value ].slice( 1 ) => resolve()
        resolve.apply(undefined, [value].slice(noValue));
      } // For Promises/A+, convert exceptions into rejections
      // Since jQuery.when doesn't unwrap thenables, we can skip the extra checks appearing in
      // Deferred#then to conditionally suppress rejection.
    } catch (value) {
      // Support: Android 4.0 only
      // Strict mode functions invoked without .call/.apply get global-object context
      reject.apply(undefined, [value]);
    }
  }

  jQuery.extend({
    Deferred: function Deferred(func) {
      var tuples = [
          // action, add listener, callbacks,
          // ... .then handlers, argument index, [final state]
          ['notify', 'progress', jQuery.Callbacks('memory'), jQuery.Callbacks('memory'), 2],
          ['resolve', 'done', jQuery.Callbacks('once memory'), jQuery.Callbacks('once memory'), 0, 'resolved'],
          ['reject', 'fail', jQuery.Callbacks('once memory'), jQuery.Callbacks('once memory'), 1, 'rejected'],
        ],
        _state = 'pending',
        _promise = {
          state: function state() {
            return _state;
          },
          always: function always() {
            deferred.done(arguments).fail(arguments);
            return this;
          },
          catch: function _catch(fn) {
            return _promise.then(null, fn);
          },
          // Keep pipe for back-compat
          pipe: function pipe() {
            var fns = arguments;
            return jQuery
              .Deferred(function (newDefer) {
                jQuery.each(tuples, function (_i, tuple) {
                  // Map tuples (progress, done, fail) to arguments (done, fail, progress)
                  var fn = isFunction(fns[tuple[4]]) && fns[tuple[4]]; // deferred.progress(function() { bind to newDefer or newDefer.notify })
                  // deferred.done(function() { bind to newDefer or newDefer.resolve })
                  // deferred.fail(function() { bind to newDefer or newDefer.reject })

                  deferred[tuple[1]](function () {
                    var returned = fn && fn.apply(this, arguments);

                    if (returned && isFunction(returned.promise)) {
                      returned.promise().progress(newDefer.notify).done(newDefer.resolve).fail(newDefer.reject);
                    } else {
                      newDefer[tuple[0] + 'With'](this, fn ? [returned] : arguments);
                    }
                  });
                });
                fns = null;
              })
              .promise();
          },
          then: function then(onFulfilled, onRejected, onProgress) {
            var maxDepth = 0;

            function resolve(depth, deferred, handler, special) {
              return function () {
                var that = this,
                  args = arguments,
                  mightThrow = function mightThrow() {
                    var returned, then; // Support: Promises/A+ section 2.3.3.3.3
                    // https://promisesaplus.com/#point-59
                    // Ignore double-resolution attempts

                    if (depth < maxDepth) {
                      return;
                    }

                    returned = handler.apply(that, args); // Support: Promises/A+ section 2.3.1
                    // https://promisesaplus.com/#point-48

                    if (returned === deferred.promise()) {
                      throw new TypeError('Thenable self-resolution');
                    } // Support: Promises/A+ sections 2.3.3.1, 3.5
                    // https://promisesaplus.com/#point-54
                    // https://promisesaplus.com/#point-75
                    // Retrieve `then` only once

                    then =
                      returned && (_typeof(returned) === 'object' || typeof returned === 'function') && returned.then; // Handle a returned thenable

                    if (isFunction(then)) {
                      // Special processors (notify) just wait for resolution
                      if (special) {
                        then.call(
                          returned,
                          resolve(maxDepth, deferred, Identity, special),
                          resolve(maxDepth, deferred, Thrower, special),
                        ); // Normal processors (resolve) also hook into progress
                      } else {
                        // ...and disregard older resolution values
                        maxDepth++;
                        then.call(
                          returned,
                          resolve(maxDepth, deferred, Identity, special),
                          resolve(maxDepth, deferred, Thrower, special),
                          resolve(maxDepth, deferred, Identity, deferred.notifyWith),
                        );
                      } // Handle all other returned values
                    } else {
                      // Only substitute handlers pass on context
                      // and multiple values (non-spec behavior)
                      if (handler !== Identity) {
                        that = undefined;
                        args = [returned];
                      } // Process the value(s)
                      // Default process is resolve

                      (special || deferred.resolveWith)(that, args);
                    }
                  },
                  // Only normal processors (resolve) catch and reject exceptions
                  process = special
                    ? mightThrow
                    : function () {
                        try {
                          mightThrow();
                        } catch (e) {
                          if (jQuery.Deferred.exceptionHook) {
                            jQuery.Deferred.exceptionHook(e, process.stackTrace);
                          } // Support: Promises/A+ section 2.3.3.3.4.1
                          // https://promisesaplus.com/#point-61
                          // Ignore post-resolution exceptions

                          if (depth + 1 >= maxDepth) {
                            // Only substitute handlers pass on context
                            // and multiple values (non-spec behavior)
                            if (handler !== Thrower) {
                              that = undefined;
                              args = [e];
                            }

                            deferred.rejectWith(that, args);
                          }
                        }
                      }; // Support: Promises/A+ section 2.3.3.3.1
                // https://promisesaplus.com/#point-57
                // Re-resolve promises immediately to dodge false rejection from
                // subsequent errors

                if (depth) {
                  process();
                } else {
                  // Call an optional hook to record the stack, in case of exception
                  // since it's otherwise lost when execution goes async
                  if (jQuery.Deferred.getStackHook) {
                    process.stackTrace = jQuery.Deferred.getStackHook();
                  }

                  window.setTimeout(process);
                }
              };
            }

            return jQuery
              .Deferred(function (newDefer) {
                // progress_handlers.add( ... )
                tuples[0][3].add(
                  resolve(0, newDefer, isFunction(onProgress) ? onProgress : Identity, newDefer.notifyWith),
                ); // fulfilled_handlers.add( ... )

                tuples[1][3].add(resolve(0, newDefer, isFunction(onFulfilled) ? onFulfilled : Identity)); // rejected_handlers.add( ... )

                tuples[2][3].add(resolve(0, newDefer, isFunction(onRejected) ? onRejected : Thrower));
              })
              .promise();
          },
          // Get a promise for this deferred
          // If obj is provided, the promise aspect is added to the object
          promise: function promise(obj) {
            return obj != null ? jQuery.extend(obj, _promise) : _promise;
          },
        },
        deferred = {}; // Add list-specific methods

      jQuery.each(tuples, function (i, tuple) {
        var list = tuple[2],
          stateString = tuple[5]; // promise.progress = list.add
        // promise.done = list.add
        // promise.fail = list.add

        _promise[tuple[1]] = list.add; // Handle state

        if (stateString) {
          list.add(
            function () {
              // state = "resolved" (i.e., fulfilled)
              // state = "rejected"
              _state = stateString;
            }, // rejected_callbacks.disable
            // fulfilled_callbacks.disable
            tuples[3 - i][2].disable, // rejected_handlers.disable
            // fulfilled_handlers.disable
            tuples[3 - i][3].disable, // progress_callbacks.lock
            tuples[0][2].lock, // progress_handlers.lock
            tuples[0][3].lock,
          );
        } // progress_handlers.fire
        // fulfilled_handlers.fire
        // rejected_handlers.fire

        list.add(tuple[3].fire); // deferred.notify = function() { deferred.notifyWith(...) }
        // deferred.resolve = function() { deferred.resolveWith(...) }
        // deferred.reject = function() { deferred.rejectWith(...) }

        deferred[tuple[0]] = function () {
          deferred[tuple[0] + 'With'](this === deferred ? undefined : this, arguments);
          return this;
        }; // deferred.notifyWith = list.fireWith
        // deferred.resolveWith = list.fireWith
        // deferred.rejectWith = list.fireWith

        deferred[tuple[0] + 'With'] = list.fireWith;
      }); // Make the deferred a promise

      _promise.promise(deferred); // Call given func if any

      if (func) {
        func.call(deferred, deferred);
      } // All done!

      return deferred;
    },
    // Deferred helper
    when: function when(singleValue) {
      var // count of uncompleted subordinates
        remaining = arguments.length,
        // count of unprocessed arguments
        i = remaining,
        // subordinate fulfillment data
        resolveContexts = Array(i),
        resolveValues = _slice.call(arguments),
        // the primary Deferred
        primary = jQuery.Deferred(),
        // subordinate callback factory
        updateFunc = function updateFunc(i) {
          return function (value) {
            resolveContexts[i] = this;
            resolveValues[i] = arguments.length > 1 ? _slice.call(arguments) : value;

            if (!--remaining) {
              primary.resolveWith(resolveContexts, resolveValues);
            }
          };
        }; // Single- and empty arguments are adopted like Promise.resolve

      if (remaining <= 1) {
        adoptValue(singleValue, primary.done(updateFunc(i)).resolve, primary.reject, !remaining); // Use .then() to unwrap secondary thenables (cf. gh-3000)

        if (primary.state() === 'pending' || isFunction(resolveValues[i] && resolveValues[i].then)) {
          return primary.then();
        }
      } // Multiple arguments are aggregated like Promise.all array elements

      while (i--) {
        adoptValue(resolveValues[i], updateFunc(i), primary.reject);
      }

      return primary.promise();
    },
  }); // These usually indicate a programmer mistake during development,
  // warn about them ASAP rather than swallowing them by default.

  var rerrorNames = /^(Eval|Internal|Range|Reference|Syntax|Type|URI)Error$/;

  jQuery.Deferred.exceptionHook = function (error, stack) {
    // Support: IE 8 - 9 only
    // Console exists when dev tools are open, which can happen at any time
    if (window.console && window.console.warn && error && rerrorNames.test(error.name)) {
      window.console.warn('jQuery.Deferred exception: ' + error.message, error.stack, stack);
    }
  };

  jQuery.readyException = function (error) {
    window.setTimeout(function () {
      throw error;
    });
  }; // The deferred used on DOM ready

  var readyList = jQuery.Deferred();

  jQuery.fn.ready = function (fn) {
    readyList
      .then(fn) // Wrap jQuery.readyException in a function so that the lookup
      // happens at the time of error handling instead of callback
      // registration.
      .catch(function (error) {
        jQuery.readyException(error);
      });
    return this;
  };

  jQuery.extend({
    // Is the DOM ready to be used? Set to true once it occurs.
    isReady: false,
    // A counter to track how many items to wait for before
    // the ready event fires. See trac-6781
    readyWait: 1,
    // Handle when the DOM is ready
    ready: function ready(wait) {
      // Abort if there are pending holds or we're already ready
      if (wait === true ? --jQuery.readyWait : jQuery.isReady) {
        return;
      } // Remember that the DOM is ready

      jQuery.isReady = true; // If a normal DOM Ready event fired, decrement, and wait if need be

      if (wait !== true && --jQuery.readyWait > 0) {
        return;
      } // If there are functions bound, to execute

      readyList.resolveWith(document, [jQuery]);
    },
  });
  jQuery.ready.then = readyList.then; // The ready event handler and self cleanup method

  function completed() {
    document.removeEventListener('DOMContentLoaded', completed);
    window.removeEventListener('load', completed);
    jQuery.ready();
  } // Catch cases where $(document).ready() is called
  // after the browser event has already occurred.
  // Support: IE <=9 - 10 only
  // Older IE sometimes signals "interactive" too soon

  if (document.readyState === 'complete' || (document.readyState !== 'loading' && !document.documentElement.doScroll)) {
    // Handle it asynchronously to allow scripts the opportunity to delay ready
    window.setTimeout(jQuery.ready);
  } else {
    // Use the handy event callback
    document.addEventListener('DOMContentLoaded', completed); // A fallback to window.onload, that will always work

    window.addEventListener('load', completed);
  } // Multifunctional method to get and set values of a collection
  // The value/s can optionally be executed if it's a function

  var access = function access(elems, fn, key, value, chainable, emptyGet, raw) {
    var i = 0,
      len = elems.length,
      bulk = key == null; // Sets many values

    if (toType(key) === 'object') {
      chainable = true;

      for (i in key) {
        access(elems, fn, i, key[i], true, emptyGet, raw);
      } // Sets one value
    } else if (value !== undefined) {
      chainable = true;

      if (!isFunction(value)) {
        raw = true;
      }

      if (bulk) {
        // Bulk operations run against the entire set
        if (raw) {
          fn.call(elems, value);
          fn = null; // ...except when executing function values
        } else {
          bulk = fn;

          fn = function fn(elem, _key, value) {
            return bulk.call(jQuery(elem), value);
          };
        }
      }

      if (fn) {
        for (; i < len; i++) {
          fn(elems[i], key, raw ? value : value.call(elems[i], i, fn(elems[i], key)));
        }
      }
    }

    if (chainable) {
      return elems;
    } // Gets

    if (bulk) {
      return fn.call(elems);
    }

    return len ? fn(elems[0], key) : emptyGet;
  }; // Matches dashed string for camelizing

  var rmsPrefix = /^-ms-/,
    rdashAlpha = /-([a-z])/g; // Used by camelCase as callback to replace()

  function fcamelCase(_all, letter) {
    return letter.toUpperCase();
  } // Convert dashed to camelCase; used by the css and data modules
  // Support: IE <=9 - 11, Edge 12 - 15
  // Microsoft forgot to hump their vendor prefix (trac-9572)

  function camelCase(string) {
    return string.replace(rmsPrefix, 'ms-').replace(rdashAlpha, fcamelCase);
  }

  var acceptData = function acceptData(owner) {
    // Accepts only:
    //  - Node
    //    - Node.ELEMENT_NODE
    //    - Node.DOCUMENT_NODE
    //  - Object
    //    - Any
    return owner.nodeType === 1 || owner.nodeType === 9 || !+owner.nodeType;
  };

  function Data() {
    this.expando = jQuery.expando + Data.uid++;
  }

  Data.uid = 1;
  Data.prototype = {
    cache: function cache(owner) {
      // Check if the owner object already has a cache
      var value = owner[this.expando]; // If not, create one

      if (!value) {
        value = {}; // We can accept data for non-element nodes in modern browsers,
        // but we should not, see trac-8335.
        // Always return an empty object.

        if (acceptData(owner)) {
          // If it is a node unlikely to be stringify-ed or looped over
          // use plain assignment
          if (owner.nodeType) {
            owner[this.expando] = value; // Otherwise secure it in a non-enumerable property
            // configurable must be true to allow the property to be
            // deleted when data is removed
          } else {
            Object.defineProperty(owner, this.expando, {
              value: value,
              configurable: true,
            });
          }
        }
      }

      return value;
    },
    set: function set(owner, data, value) {
      var prop,
        cache = this.cache(owner); // Handle: [ owner, key, value ] args
      // Always use camelCase key (gh-2257)

      if (typeof data === 'string') {
        cache[camelCase(data)] = value; // Handle: [ owner, { properties } ] args
      } else {
        // Copy the properties one-by-one to the cache object
        for (prop in data) {
          cache[camelCase(prop)] = data[prop];
        }
      }

      return cache;
    },
    get: function get(owner, key) {
      return key === undefined
        ? this.cache(owner) // Always use camelCase key (gh-2257)
        : owner[this.expando] && owner[this.expando][camelCase(key)];
    },
    access: function access(owner, key, value) {
      // In cases where either:
      //
      //   1. No key was specified
      //   2. A string key was specified, but no value provided
      //
      // Take the "read" path and allow the get method to determine
      // which value to return, respectively either:
      //
      //   1. The entire cache object
      //   2. The data stored at the key
      //
      if (key === undefined || (key && typeof key === 'string' && value === undefined)) {
        return this.get(owner, key);
      } // When the key is not a string, or both a key and value
      // are specified, set or extend (existing objects) with either:
      //
      //   1. An object of properties
      //   2. A key and value
      //

      this.set(owner, key, value); // Since the "set" path can have two possible entry points
      // return the expected data based on which path was taken[*]

      return value !== undefined ? value : key;
    },
    remove: function remove(owner, key) {
      var i,
        cache = owner[this.expando];

      if (cache === undefined) {
        return;
      }

      if (key !== undefined) {
        // Support array or space separated string of keys
        if (Array.isArray(key)) {
          // If key is an array of keys...
          // We always set camelCase keys, so remove that.
          key = key.map(camelCase);
        } else {
          key = camelCase(key); // If a key with the spaces exists, use it.
          // Otherwise, create an array by matching non-whitespace

          key = key in cache ? [key] : key.match(rnothtmlwhite) || [];
        }

        i = key.length;

        while (i--) {
          delete cache[key[i]];
        }
      } // Remove the expando if there's no more data

      if (key === undefined || jQuery.isEmptyObject(cache)) {
        // Support: Chrome <=35 - 45
        // Webkit & Blink performance suffers when deleting properties
        // from DOM nodes, so set to undefined instead
        // https://bugs.chromium.org/p/chromium/issues/detail?id=378607 (bug restricted)
        if (owner.nodeType) {
          owner[this.expando] = undefined;
        } else {
          delete owner[this.expando];
        }
      }
    },
    hasData: function hasData(owner) {
      var cache = owner[this.expando];
      return cache !== undefined && !jQuery.isEmptyObject(cache);
    },
  };
  var dataPriv = new Data();
  var dataUser = new Data(); //	Implementation Summary
  //
  //	1. Enforce API surface and semantic compatibility with 1.9.x branch
  //	2. Improve the module's maintainability by reducing the storage
  //		paths to a single mechanism.
  //	3. Use the same single mechanism to support "private" and "user" data.
  //	4. _Never_ expose "private" data to user code (TODO: Drop _data, _removeData)
  //	5. Avoid exposing implementation details on user objects (eg. expando properties)
  //	6. Provide a clear path for implementation upgrade to WeakMap in 2014

  var rbrace = /^(?:\{[\w\W]*\}|\[[\w\W]*\])$/,
    rmultiDash = /[A-Z]/g;

  function getData(data) {
    if (data === 'true') {
      return true;
    }

    if (data === 'false') {
      return false;
    }

    if (data === 'null') {
      return null;
    } // Only convert to a number if it doesn't change the string

    if (data === +data + '') {
      return +data;
    }

    if (rbrace.test(data)) {
      return JSON.parse(data);
    }

    return data;
  }

  function dataAttr(elem, key, data) {
    var name; // If nothing was found internally, try to fetch any
    // data from the HTML5 data-* attribute

    if (data === undefined && elem.nodeType === 1) {
      name = 'data-' + key.replace(rmultiDash, '-$&').toLowerCase();
      data = elem.getAttribute(name);

      if (typeof data === 'string') {
        try {
          data = getData(data);
        } catch (e) {} // Make sure we set the data so it isn't changed later

        dataUser.set(elem, key, data);
      } else {
        data = undefined;
      }
    }

    return data;
  }

  jQuery.extend({
    hasData: function hasData(elem) {
      return dataUser.hasData(elem) || dataPriv.hasData(elem);
    },
    data: function data(elem, name, _data) {
      return dataUser.access(elem, name, _data);
    },
    removeData: function removeData(elem, name) {
      dataUser.remove(elem, name);
    },
    // TODO: Now that all calls to _data and _removeData have been replaced
    // with direct calls to dataPriv methods, these can be deprecated.
    _data: function _data(elem, name, data) {
      return dataPriv.access(elem, name, data);
    },
    _removeData: function _removeData(elem, name) {
      dataPriv.remove(elem, name);
    },
  });
  jQuery.fn.extend({
    data: function data(key, value) {
      var i,
        name,
        data,
        elem = this[0],
        attrs = elem && elem.attributes; // Gets all values

      if (key === undefined) {
        if (this.length) {
          data = dataUser.get(elem);

          if (elem.nodeType === 1 && !dataPriv.get(elem, 'hasDataAttrs')) {
            i = attrs.length;

            while (i--) {
              // Support: IE 11 only
              // The attrs elements can be null (trac-14894)
              if (attrs[i]) {
                name = attrs[i].name;

                if (name.indexOf('data-') === 0) {
                  name = camelCase(name.slice(5));
                  dataAttr(elem, name, data[name]);
                }
              }
            }

            dataPriv.set(elem, 'hasDataAttrs', true);
          }
        }

        return data;
      } // Sets multiple values

      if (_typeof(key) === 'object') {
        return this.each(function () {
          dataUser.set(this, key);
        });
      }

      return access(
        this,
        function (value) {
          var data; // The calling jQuery object (element matches) is not empty
          // (and therefore has an element appears at this[ 0 ]) and the
          // `value` parameter was not undefined. An empty jQuery object
          // will result in `undefined` for elem = this[ 0 ] which will
          // throw an exception if an attempt to read a data cache is made.

          if (elem && value === undefined) {
            // Attempt to get data from the cache
            // The key will always be camelCased in Data
            data = dataUser.get(elem, key);

            if (data !== undefined) {
              return data;
            } // Attempt to "discover" the data in
            // HTML5 custom data-* attrs

            data = dataAttr(elem, key);

            if (data !== undefined) {
              return data;
            } // We tried really hard, but the data doesn't exist.

            return;
          } // Set the data...

          this.each(function () {
            // We always store the camelCased key
            dataUser.set(this, key, value);
          });
        },
        null,
        value,
        arguments.length > 1,
        null,
        true,
      );
    },
    removeData: function removeData(key) {
      return this.each(function () {
        dataUser.remove(this, key);
      });
    },
  });
  jQuery.extend({
    queue: function queue(elem, type, data) {
      var queue;

      if (elem) {
        type = (type || 'fx') + 'queue';
        queue = dataPriv.get(elem, type); // Speed up dequeue by getting out quickly if this is just a lookup

        if (data) {
          if (!queue || Array.isArray(data)) {
            queue = dataPriv.access(elem, type, jQuery.makeArray(data));
          } else {
            queue.push(data);
          }
        }

        return queue || [];
      }
    },
    dequeue: function dequeue(elem, type) {
      type = type || 'fx';

      var queue = jQuery.queue(elem, type),
        startLength = queue.length,
        fn = queue.shift(),
        hooks = jQuery._queueHooks(elem, type),
        next = function next() {
          jQuery.dequeue(elem, type);
        }; // If the fx queue is dequeued, always remove the progress sentinel

      if (fn === 'inprogress') {
        fn = queue.shift();
        startLength--;
      }

      if (fn) {
        // Add a progress sentinel to prevent the fx queue from being
        // automatically dequeued
        if (type === 'fx') {
          queue.unshift('inprogress');
        } // Clear up the last queue stop function

        delete hooks.stop;
        fn.call(elem, next, hooks);
      }

      if (!startLength && hooks) {
        hooks.empty.fire();
      }
    },
    // Not public - generate a queueHooks object, or return the current one
    _queueHooks: function _queueHooks(elem, type) {
      var key = type + 'queueHooks';
      return (
        dataPriv.get(elem, key) ||
        dataPriv.access(elem, key, {
          empty: jQuery.Callbacks('once memory').add(function () {
            dataPriv.remove(elem, [type + 'queue', key]);
          }),
        })
      );
    },
  });
  jQuery.fn.extend({
    queue: function queue(type, data) {
      var setter = 2;

      if (typeof type !== 'string') {
        data = type;
        type = 'fx';
        setter--;
      }

      if (arguments.length < setter) {
        return jQuery.queue(this[0], type);
      }

      return data === undefined
        ? this
        : this.each(function () {
            var queue = jQuery.queue(this, type, data); // Ensure a hooks for this queue

            jQuery._queueHooks(this, type);

            if (type === 'fx' && queue[0] !== 'inprogress') {
              jQuery.dequeue(this, type);
            }
          });
    },
    dequeue: function dequeue(type) {
      return this.each(function () {
        jQuery.dequeue(this, type);
      });
    },
    clearQueue: function clearQueue(type) {
      return this.queue(type || 'fx', []);
    },
    // Get a promise resolved when queues of a certain type
    // are emptied (fx is the type by default)
    promise: function promise(type, obj) {
      var tmp,
        count = 1,
        defer = jQuery.Deferred(),
        elements = this,
        i = this.length,
        resolve = function resolve() {
          if (!--count) {
            defer.resolveWith(elements, [elements]);
          }
        };

      if (typeof type !== 'string') {
        obj = type;
        type = undefined;
      }

      type = type || 'fx';

      while (i--) {
        tmp = dataPriv.get(elements[i], type + 'queueHooks');

        if (tmp && tmp.empty) {
          count++;
          tmp.empty.add(resolve);
        }
      }

      resolve();
      return defer.promise(obj);
    },
  });
  var pnum = /[+-]?(?:\d*\.|)\d+(?:[eE][+-]?\d+|)/.source;
  var rcssNum = new RegExp('^(?:([+-])=|)(' + pnum + ')([a-z%]*)$', 'i');
  var cssExpand = ['Top', 'Right', 'Bottom', 'Left'];
  var documentElement = document.documentElement;

  var isAttached = function isAttached(elem) {
      return jQuery.contains(elem.ownerDocument, elem);
    },
    composed = {
      composed: true,
    }; // Support: IE 9 - 11+, Edge 12 - 18+, iOS 10.0 - 10.2 only
  // Check attachment across shadow DOM boundaries when possible (gh-3504)
  // Support: iOS 10.0-10.2 only
  // Early iOS 10 versions support `attachShadow` but not `getRootNode`,
  // leading to errors. We need to check for `getRootNode`.

  if (documentElement.getRootNode) {
    isAttached = function isAttached(elem) {
      return jQuery.contains(elem.ownerDocument, elem) || elem.getRootNode(composed) === elem.ownerDocument;
    };
  }

  var isHiddenWithinTree = function isHiddenWithinTree(elem, el) {
    // isHiddenWithinTree might be called from jQuery#filter function;
    // in that case, element will be second argument
    elem = el || elem; // Inline style trumps all

    return (
      elem.style.display === 'none' ||
      (elem.style.display === '' && // Otherwise, check computed style
        // Support: Firefox <=43 - 45
        // Disconnected elements can have computed display: none, so first confirm that elem is
        // in the document.
        isAttached(elem) &&
        jQuery.css(elem, 'display') === 'none')
    );
  };

  function adjustCSS(elem, prop, valueParts, tween) {
    var adjusted,
      scale,
      maxIterations = 20,
      currentValue = tween
        ? function () {
            return tween.cur();
          }
        : function () {
            return jQuery.css(elem, prop, '');
          },
      initial = currentValue(),
      unit = (valueParts && valueParts[3]) || (jQuery.cssNumber[prop] ? '' : 'px'),
      // Starting value computation is required for potential unit mismatches
      initialInUnit =
        elem.nodeType &&
        (jQuery.cssNumber[prop] || (unit !== 'px' && +initial)) &&
        rcssNum.exec(jQuery.css(elem, prop));

    if (initialInUnit && initialInUnit[3] !== unit) {
      // Support: Firefox <=54
      // Halve the iteration target value to prevent interference from CSS upper bounds (gh-2144)
      initial = initial / 2; // Trust units reported by jQuery.css

      unit = unit || initialInUnit[3]; // Iteratively approximate from a nonzero starting point

      initialInUnit = +initial || 1;

      while (maxIterations--) {
        // Evaluate and update our best guess (doubling guesses that zero out).
        // Finish if the scale equals or crosses 1 (making the old*new product non-positive).
        jQuery.style(elem, prop, initialInUnit + unit);

        if ((1 - scale) * (1 - (scale = currentValue() / initial || 0.5)) <= 0) {
          maxIterations = 0;
        }

        initialInUnit = initialInUnit / scale;
      }

      initialInUnit = initialInUnit * 2;
      jQuery.style(elem, prop, initialInUnit + unit); // Make sure we update the tween properties later on

      valueParts = valueParts || [];
    }

    if (valueParts) {
      initialInUnit = +initialInUnit || +initial || 0; // Apply relative offset (+=/-=) if specified

      adjusted = valueParts[1] ? initialInUnit + (valueParts[1] + 1) * valueParts[2] : +valueParts[2];

      if (tween) {
        tween.unit = unit;
        tween.start = initialInUnit;
        tween.end = adjusted;
      }
    }

    return adjusted;
  }

  var defaultDisplayMap = {};

  function getDefaultDisplay(elem) {
    var temp,
      doc = elem.ownerDocument,
      nodeName = elem.nodeName,
      display = defaultDisplayMap[nodeName];

    if (display) {
      return display;
    }

    temp = doc.body.appendChild(doc.createElement(nodeName));
    display = jQuery.css(temp, 'display');
    temp.parentNode.removeChild(temp);

    if (display === 'none') {
      display = 'block';
    }

    defaultDisplayMap[nodeName] = display;
    return display;
  }

  function showHide(elements, show) {
    var display,
      elem,
      values = [],
      index = 0,
      length = elements.length; // Determine new display value for elements that need to change

    for (; index < length; index++) {
      elem = elements[index];

      if (!elem.style) {
        continue;
      }

      display = elem.style.display;

      if (show) {
        // Since we force visibility upon cascade-hidden elements, an immediate (and slow)
        // check is required in this first loop unless we have a nonempty display value (either
        // inline or about-to-be-restored)
        if (display === 'none') {
          values[index] = dataPriv.get(elem, 'display') || null;

          if (!values[index]) {
            elem.style.display = '';
          }
        }

        if (elem.style.display === '' && isHiddenWithinTree(elem)) {
          values[index] = getDefaultDisplay(elem);
        }
      } else {
        if (display !== 'none') {
          values[index] = 'none'; // Remember what we're overwriting

          dataPriv.set(elem, 'display', display);
        }
      }
    } // Set the display of the elements in a second loop to avoid constant reflow

    for (index = 0; index < length; index++) {
      if (values[index] != null) {
        elements[index].style.display = values[index];
      }
    }

    return elements;
  }

  jQuery.fn.extend({
    show: function show() {
      return showHide(this, true);
    },
    hide: function hide() {
      return showHide(this);
    },
    toggle: function toggle(state) {
      if (typeof state === 'boolean') {
        return state ? this.show() : this.hide();
      }

      return this.each(function () {
        if (isHiddenWithinTree(this)) {
          jQuery(this).show();
        } else {
          jQuery(this).hide();
        }
      });
    },
  });
  var rcheckableType = /^(?:checkbox|radio)$/i;
  var rtagName = /<([a-z][^\/\0>\x20\t\r\n\f]*)/i;
  var rscriptType = /^$|^module$|\/(?:java|ecma)script/i;

  (function () {
    var fragment = document.createDocumentFragment(),
      div = fragment.appendChild(document.createElement('div')),
      input = document.createElement('input'); // Support: Android 4.0 - 4.3 only
    // Check state lost if the name is set (trac-11217)
    // Support: Windows Web Apps (WWA)
    // `name` and `type` must use .setAttribute for WWA (trac-14901)

    input.setAttribute('type', 'radio');
    input.setAttribute('checked', 'checked');
    input.setAttribute('name', 't');
    div.appendChild(input); // Support: Android <=4.1 only
    // Older WebKit doesn't clone checked state correctly in fragments

    support.checkClone = div.cloneNode(true).cloneNode(true).lastChild.checked; // Support: IE <=11 only
    // Make sure textarea (and checkbox) defaultValue is properly cloned

    div.innerHTML = '<textarea>x</textarea>';
    support.noCloneChecked = !!div.cloneNode(true).lastChild.defaultValue; // Support: IE <=9 only
    // IE <=9 replaces <option> tags with their contents when inserted outside of
    // the select element.

    div.innerHTML = '<option></option>';
    support.option = !!div.lastChild;
  })(); // We have to close these tags to support XHTML (trac-13200)

  var wrapMap = {
    // XHTML parsers do not magically insert elements in the
    // same way that tag soup parsers do. So we cannot shorten
    // this by omitting <tbody> or other required elements.
    thead: [1, '<table>', '</table>'],
    col: [2, '<table><colgroup>', '</colgroup></table>'],
    tr: [2, '<table><tbody>', '</tbody></table>'],
    td: [3, '<table><tbody><tr>', '</tr></tbody></table>'],
    _default: [0, '', ''],
  };
  wrapMap.tbody = wrapMap.tfoot = wrapMap.colgroup = wrapMap.caption = wrapMap.thead;
  wrapMap.th = wrapMap.td; // Support: IE <=9 only

  if (!support.option) {
    wrapMap.optgroup = wrapMap.option = [1, "<select multiple='multiple'>", '</select>'];
  }

  function getAll(context, tag) {
    // Support: IE <=9 - 11 only
    // Use typeof to avoid zero-argument method invocation on host objects (trac-15151)
    var ret;

    if (typeof context.getElementsByTagName !== 'undefined') {
      ret = context.getElementsByTagName(tag || '*');
    } else if (typeof context.querySelectorAll !== 'undefined') {
      ret = context.querySelectorAll(tag || '*');
    } else {
      ret = [];
    }

    if (tag === undefined || (tag && nodeName(context, tag))) {
      return jQuery.merge([context], ret);
    }

    return ret;
  } // Mark scripts as having already been evaluated

  function setGlobalEval(elems, refElements) {
    var i = 0,
      l = elems.length;

    for (; i < l; i++) {
      dataPriv.set(elems[i], 'globalEval', !refElements || dataPriv.get(refElements[i], 'globalEval'));
    }
  }

  var rhtml = /<|&#?\w+;/;

  function buildFragment(elems, context, scripts, selection, ignored) {
    var elem,
      tmp,
      tag,
      wrap,
      attached,
      j,
      fragment = context.createDocumentFragment(),
      nodes = [],
      i = 0,
      l = elems.length;

    for (; i < l; i++) {
      elem = elems[i];

      if (elem || elem === 0) {
        // Add nodes directly
        if (toType(elem) === 'object') {
          // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit
          jQuery.merge(nodes, elem.nodeType ? [elem] : elem); // Convert non-html into a text node
        } else if (!rhtml.test(elem)) {
          nodes.push(context.createTextNode(elem)); // Convert html into DOM nodes
        } else {
          tmp = tmp || fragment.appendChild(context.createElement('div')); // Deserialize a standard representation

          tag = (rtagName.exec(elem) || ['', ''])[1].toLowerCase();
          wrap = wrapMap[tag] || wrapMap._default;
          tmp.innerHTML = wrap[1] + jQuery.htmlPrefilter(elem) + wrap[2]; // Descend through wrappers to the right content

          j = wrap[0];

          while (j--) {
            tmp = tmp.lastChild;
          } // Support: Android <=4.0 only, PhantomJS 1 only
          // push.apply(_, arraylike) throws on ancient WebKit

          jQuery.merge(nodes, tmp.childNodes); // Remember the top-level container

          tmp = fragment.firstChild; // Ensure the created nodes are orphaned (trac-12392)

          tmp.textContent = '';
        }
      }
    } // Remove wrapper from fragment

    fragment.textContent = '';
    i = 0;

    while ((elem = nodes[i++])) {
      // Skip elements already in the context collection (trac-4087)
      if (selection && jQuery.inArray(elem, selection) > -1) {
        if (ignored) {
          ignored.push(elem);
        }

        continue;
      }

      attached = isAttached(elem); // Append to fragment

      tmp = getAll(fragment.appendChild(elem), 'script'); // Preserve script evaluation history

      if (attached) {
        setGlobalEval(tmp);
      } // Capture executables

      if (scripts) {
        j = 0;

        while ((elem = tmp[j++])) {
          if (rscriptType.test(elem.type || '')) {
            scripts.push(elem);
          }
        }
      }
    }

    return fragment;
  }

  var rtypenamespace = /^([^.]*)(?:\.(.+)|)/;

  function returnTrue() {
    return true;
  }

  function returnFalse() {
    return false;
  } // Support: IE <=9 - 11+
  // focus() and blur() are asynchronous, except when they are no-op.
  // So expect focus to be synchronous when the element is already active,
  // and blur to be synchronous when the element is not already active.
  // (focus and blur are always synchronous in other supported browsers,
  // this just defines when we can count on it).

  function expectSync(elem, type) {
    return (elem === safeActiveElement()) === (type === 'focus');
  } // Support: IE <=9 only
  // Accessing document.activeElement can throw unexpectedly
  // https://bugs.jquery.com/ticket/13393

  function safeActiveElement() {
    try {
      return document.activeElement;
    } catch (err) {}
  }

  function _on(elem, types, selector, data, fn, one) {
    var origFn, type; // Types can be a map of types/handlers

    if (_typeof(types) === 'object') {
      // ( types-Object, selector, data )
      if (typeof selector !== 'string') {
        // ( types-Object, data )
        data = data || selector;
        selector = undefined;
      }

      for (type in types) {
        _on(elem, type, selector, data, types[type], one);
      }

      return elem;
    }

    if (data == null && fn == null) {
      // ( types, fn )
      fn = selector;
      data = selector = undefined;
    } else if (fn == null) {
      if (typeof selector === 'string') {
        // ( types, selector, fn )
        fn = data;
        data = undefined;
      } else {
        // ( types, data, fn )
        fn = data;
        data = selector;
        selector = undefined;
      }
    }

    if (fn === false) {
      fn = returnFalse;
    } else if (!fn) {
      return elem;
    }

    if (one === 1) {
      origFn = fn;

      fn = function fn(event) {
        // Can use an empty set, since event contains the info
        jQuery().off(event);
        return origFn.apply(this, arguments);
      }; // Use same guid so caller can remove using origFn

      fn.guid = origFn.guid || (origFn.guid = jQuery.guid++);
    }

    return elem.each(function () {
      jQuery.event.add(this, types, fn, data, selector);
    });
  }
  /*
   * Helper functions for managing events -- not part of the public interface.
   * Props to Dean Edwards' addEvent library for many of the ideas.
   */

  jQuery.event = {
    global: {},
    add: function add(elem, types, handler, data, selector) {
      var handleObjIn,
        eventHandle,
        tmp,
        events,
        t,
        handleObj,
        special,
        handlers,
        type,
        namespaces,
        origType,
        elemData = dataPriv.get(elem); // Only attach events to objects that accept data

      if (!acceptData(elem)) {
        return;
      } // Caller can pass in an object of custom data in lieu of the handler

      if (handler.handler) {
        handleObjIn = handler;
        handler = handleObjIn.handler;
        selector = handleObjIn.selector;
      } // Ensure that invalid selectors throw exceptions at attach time
      // Evaluate against documentElement in case elem is a non-element node (e.g., document)

      if (selector) {
        jQuery.find.matchesSelector(documentElement, selector);
      } // Make sure that the handler has a unique ID, used to find/remove it later

      if (!handler.guid) {
        handler.guid = jQuery.guid++;
      } // Init the element's event structure and main handler, if this is the first

      if (!(events = elemData.events)) {
        events = elemData.events = Object.create(null);
      }

      if (!(eventHandle = elemData.handle)) {
        eventHandle = elemData.handle = function (e) {
          // Discard the second event of a jQuery.event.trigger() and
          // when an event is called after a page has unloaded
          return typeof jQuery !== 'undefined' && jQuery.event.triggered !== e.type
            ? jQuery.event.dispatch.apply(elem, arguments)
            : undefined;
        };
      } // Handle multiple events separated by a space

      types = (types || '').match(rnothtmlwhite) || [''];
      t = types.length;

      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || '').split('.').sort(); // There *must* be a type, no attaching namespace-only handlers

        if (!type) {
          continue;
        } // If event changes its type, use the special event handlers for the changed type

        special = jQuery.event.special[type] || {}; // If selector defined, determine special event api type, otherwise given type

        type = (selector ? special.delegateType : special.bindType) || type; // Update special based on newly reset type

        special = jQuery.event.special[type] || {}; // handleObj is passed to all event handlers

        handleObj = jQuery.extend(
          {
            type: type,
            origType: origType,
            data: data,
            handler: handler,
            guid: handler.guid,
            selector: selector,
            needsContext: selector && jQuery.expr.match.needsContext.test(selector),
            namespace: namespaces.join('.'),
          },
          handleObjIn,
        ); // Init the event handler queue if we're the first

        if (!(handlers = events[type])) {
          handlers = events[type] = [];
          handlers.delegateCount = 0; // Only use addEventListener if the special events handler returns false

          if (!special.setup || special.setup.call(elem, data, namespaces, eventHandle) === false) {
            if (elem.addEventListener) {
              elem.addEventListener(type, eventHandle);
            }
          }
        }

        if (special.add) {
          special.add.call(elem, handleObj);

          if (!handleObj.handler.guid) {
            handleObj.handler.guid = handler.guid;
          }
        } // Add to the element's handler list, delegates in front

        if (selector) {
          handlers.splice(handlers.delegateCount++, 0, handleObj);
        } else {
          handlers.push(handleObj);
        } // Keep track of which events have ever been used, for event optimization

        jQuery.event.global[type] = true;
      }
    },
    // Detach an event or set of events from an element
    remove: function remove(elem, types, handler, selector, mappedTypes) {
      var j,
        origCount,
        tmp,
        events,
        t,
        handleObj,
        special,
        handlers,
        type,
        namespaces,
        origType,
        elemData = dataPriv.hasData(elem) && dataPriv.get(elem);

      if (!elemData || !(events = elemData.events)) {
        return;
      } // Once for each type.namespace in types; type may be omitted

      types = (types || '').match(rnothtmlwhite) || [''];
      t = types.length;

      while (t--) {
        tmp = rtypenamespace.exec(types[t]) || [];
        type = origType = tmp[1];
        namespaces = (tmp[2] || '').split('.').sort(); // Unbind all events (on this namespace, if provided) for the element

        if (!type) {
          for (type in events) {
            jQuery.event.remove(elem, type + types[t], handler, selector, true);
          }

          continue;
        }

        special = jQuery.event.special[type] || {};
        type = (selector ? special.delegateType : special.bindType) || type;
        handlers = events[type] || [];
        tmp = tmp[2] && new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)'); // Remove matching events

        origCount = j = handlers.length;

        while (j--) {
          handleObj = handlers[j];

          if (
            (mappedTypes || origType === handleObj.origType) &&
            (!handler || handler.guid === handleObj.guid) &&
            (!tmp || tmp.test(handleObj.namespace)) &&
            (!selector || selector === handleObj.selector || (selector === '**' && handleObj.selector))
          ) {
            handlers.splice(j, 1);

            if (handleObj.selector) {
              handlers.delegateCount--;
            }

            if (special.remove) {
              special.remove.call(elem, handleObj);
            }
          }
        } // Remove generic event handler if we removed something and no more handlers exist
        // (avoids potential for endless recursion during removal of special event handlers)

        if (origCount && !handlers.length) {
          if (!special.teardown || special.teardown.call(elem, namespaces, elemData.handle) === false) {
            jQuery.removeEvent(elem, type, elemData.handle);
          }

          delete events[type];
        }
      } // Remove data and the expando if it's no longer used

      if (jQuery.isEmptyObject(events)) {
        dataPriv.remove(elem, 'handle events');
      }
    },
    dispatch: function dispatch(nativeEvent) {
      var i,
        j,
        ret,
        matched,
        handleObj,
        handlerQueue,
        args = new Array(arguments.length),
        // Make a writable jQuery.Event from the native event object
        event = jQuery.event.fix(nativeEvent),
        handlers = (dataPriv.get(this, 'events') || Object.create(null))[event.type] || [],
        special = jQuery.event.special[event.type] || {}; // Use the fix-ed jQuery.Event rather than the (read-only) native event

      args[0] = event;

      for (i = 1; i < arguments.length; i++) {
        args[i] = arguments[i];
      }

      event.delegateTarget = this; // Call the preDispatch hook for the mapped type, and let it bail if desired

      if (special.preDispatch && special.preDispatch.call(this, event) === false) {
        return;
      } // Determine handlers

      handlerQueue = jQuery.event.handlers.call(this, event, handlers); // Run delegates first; they may want to stop propagation beneath us

      i = 0;

      while ((matched = handlerQueue[i++]) && !event.isPropagationStopped()) {
        event.currentTarget = matched.elem;
        j = 0;

        while ((handleObj = matched.handlers[j++]) && !event.isImmediatePropagationStopped()) {
          // If the event is namespaced, then each handler is only invoked if it is
          // specially universal or its namespaces are a superset of the event's.
          if (!event.rnamespace || handleObj.namespace === false || event.rnamespace.test(handleObj.namespace)) {
            event.handleObj = handleObj;
            event.data = handleObj.data;
            ret = ((jQuery.event.special[handleObj.origType] || {}).handle || handleObj.handler).apply(
              matched.elem,
              args,
            );

            if (ret !== undefined) {
              if ((event.result = ret) === false) {
                event.preventDefault();
                event.stopPropagation();
              }
            }
          }
        }
      } // Call the postDispatch hook for the mapped type

      if (special.postDispatch) {
        special.postDispatch.call(this, event);
      }

      return event.result;
    },
    handlers: function handlers(event, _handlers) {
      var i,
        handleObj,
        sel,
        matchedHandlers,
        matchedSelectors,
        handlerQueue = [],
        delegateCount = _handlers.delegateCount,
        cur = event.target; // Find delegate handlers

      if (
        delegateCount && // Support: IE <=9
        // Black-hole SVG <use> instance trees (trac-13180)
        cur.nodeType && // Support: Firefox <=42
        // Suppress spec-violating clicks indicating a non-primary pointer button (trac-3861)
        // https://www.w3.org/TR/DOM-Level-3-Events/#event-type-click
        // Support: IE 11 only
        // ...but not arrow key "clicks" of radio inputs, which can have `button` -1 (gh-2343)
        !(event.type === 'click' && event.button >= 1)
      ) {
        for (; cur !== this; cur = cur.parentNode || this) {
          // Don't check non-elements (trac-13208)
          // Don't process clicks on disabled elements (trac-6911, trac-8165, trac-11382, trac-11764)
          if (cur.nodeType === 1 && !(event.type === 'click' && cur.disabled === true)) {
            matchedHandlers = [];
            matchedSelectors = {};

            for (i = 0; i < delegateCount; i++) {
              handleObj = _handlers[i]; // Don't conflict with Object.prototype properties (trac-13203)

              sel = handleObj.selector + ' ';

              if (matchedSelectors[sel] === undefined) {
                matchedSelectors[sel] = handleObj.needsContext
                  ? jQuery(sel, this).index(cur) > -1
                  : jQuery.find(sel, this, null, [cur]).length;
              }

              if (matchedSelectors[sel]) {
                matchedHandlers.push(handleObj);
              }
            }

            if (matchedHandlers.length) {
              handlerQueue.push({
                elem: cur,
                handlers: matchedHandlers,
              });
            }
          }
        }
      } // Add the remaining (directly-bound) handlers

      cur = this;

      if (delegateCount < _handlers.length) {
        handlerQueue.push({
          elem: cur,
          handlers: _handlers.slice(delegateCount),
        });
      }

      return handlerQueue;
    },
    addProp: function addProp(name, hook) {
      Object.defineProperty(jQuery.Event.prototype, name, {
        enumerable: true,
        configurable: true,
        get: isFunction(hook)
          ? function () {
              if (this.originalEvent) {
                return hook(this.originalEvent);
              }
            }
          : function () {
              if (this.originalEvent) {
                return this.originalEvent[name];
              }
            },
        set: function set(value) {
          Object.defineProperty(this, name, {
            enumerable: true,
            configurable: true,
            writable: true,
            value: value,
          });
        },
      });
    },
    fix: function fix(originalEvent) {
      return originalEvent[jQuery.expando] ? originalEvent : new jQuery.Event(originalEvent);
    },
    special: {
      load: {
        // Prevent triggered image.load events from bubbling to window.load
        noBubble: true,
      },
      click: {
        // Utilize native event to ensure correct state for checkable inputs
        setup: function setup(data) {
          // For mutual compressibility with _default, replace `this` access with a local var.
          // `|| data` is dead code meant only to preserve the variable through minification.
          var el = this || data; // Claim the first handler

          if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) {
            // dataPriv.set( el, "click", ... )
            leverageNative(el, 'click', returnTrue);
          } // Return false to allow normal processing in the caller

          return false;
        },
        trigger: function trigger(data) {
          // For mutual compressibility with _default, replace `this` access with a local var.
          // `|| data` is dead code meant only to preserve the variable through minification.
          var el = this || data; // Force setup before triggering a click

          if (rcheckableType.test(el.type) && el.click && nodeName(el, 'input')) {
            leverageNative(el, 'click');
          } // Return non-false to allow normal event-path propagation

          return true;
        },
        // For cross-browser consistency, suppress native .click() on links
        // Also prevent it if we're currently inside a leveraged native-event stack
        _default: function _default(event) {
          var target = event.target;
          return (
            (rcheckableType.test(target.type) &&
              target.click &&
              nodeName(target, 'input') &&
              dataPriv.get(target, 'click')) ||
            nodeName(target, 'a')
          );
        },
      },
      beforeunload: {
        postDispatch: function postDispatch(event) {
          // Support: Firefox 20+
          // Firefox doesn't alert if the returnValue field is not set.
          if (event.result !== undefined && event.originalEvent) {
            event.originalEvent.returnValue = event.result;
          }
        },
      },
    },
  }; // Ensure the presence of an event listener that handles manually-triggered
  // synthetic events by interrupting progress until reinvoked in response to
  // *native* events that it fires directly, ensuring that state changes have
  // already occurred before other listeners are invoked.

  function leverageNative(el, type, expectSync) {
    // Missing expectSync indicates a trigger call, which must force setup through jQuery.event.add
    if (!expectSync) {
      if (dataPriv.get(el, type) === undefined) {
        jQuery.event.add(el, type, returnTrue);
      }

      return;
    } // Register the controller as a special universal handler for all event namespaces

    dataPriv.set(el, type, false);
    jQuery.event.add(el, type, {
      namespace: false,
      handler: function handler(event) {
        var notAsync,
          result,
          saved = dataPriv.get(this, type);

        if (event.isTrigger & 1 && this[type]) {
          // Interrupt processing of the outer synthetic .trigger()ed event
          // Saved data should be false in such cases, but might be a leftover capture object
          // from an async native handler (gh-4350)
          if (!saved.length) {
            // Store arguments for use when handling the inner native event
            // There will always be at least one argument (an event object), so this array
            // will not be confused with a leftover capture object.
            saved = _slice.call(arguments);
            dataPriv.set(this, type, saved); // Trigger the native event and capture its result
            // Support: IE <=9 - 11+
            // focus() and blur() are asynchronous

            notAsync = expectSync(this, type);
            this[type]();
            result = dataPriv.get(this, type);

            if (saved !== result || notAsync) {
              dataPriv.set(this, type, false);
            } else {
              result = {};
            }

            if (saved !== result) {
              // Cancel the outer synthetic event
              event.stopImmediatePropagation();
              event.preventDefault(); // Support: Chrome 86+
              // In Chrome, if an element having a focusout handler is blurred by
              // clicking outside of it, it invokes the handler synchronously. If
              // that handler calls `.remove()` on the element, the data is cleared,
              // leaving `result` undefined. We need to guard against this.

              return result && result.value;
            } // If this is an inner synthetic event for an event with a bubbling surrogate
            // (focus or blur), assume that the surrogate already propagated from triggering the
            // native event and prevent that from happening again here.
            // This technically gets the ordering wrong w.r.t. to `.trigger()` (in which the
            // bubbling surrogate propagates *after* the non-bubbling base), but that seems
            // less bad than duplication.
          } else if ((jQuery.event.special[type] || {}).delegateType) {
            event.stopPropagation();
          } // If this is a native event triggered above, everything is now in order
          // Fire an inner synthetic event with the original arguments
        } else if (saved.length) {
          // ...and capture the result
          dataPriv.set(this, type, {
            value: jQuery.event.trigger(
              // Support: IE <=9 - 11+
              // Extend with the prototype to reset the above stopImmediatePropagation()
              jQuery.extend(saved[0], jQuery.Event.prototype),
              saved.slice(1),
              this,
            ),
          }); // Abort handling of the native event

          event.stopImmediatePropagation();
        }
      },
    });
  }

  jQuery.removeEvent = function (elem, type, handle) {
    // This "if" is needed for plain objects
    if (elem.removeEventListener) {
      elem.removeEventListener(type, handle);
    }
  };

  jQuery.Event = function (src, props) {
    // Allow instantiation without the 'new' keyword
    if (!(this instanceof jQuery.Event)) {
      return new jQuery.Event(src, props);
    } // Event object

    if (src && src.type) {
      this.originalEvent = src;
      this.type = src.type; // Events bubbling up the document may have been marked as prevented
      // by a handler lower down the tree; reflect the correct value.

      this.isDefaultPrevented =
        src.defaultPrevented ||
        (src.defaultPrevented === undefined && // Support: Android <=2.3 only
          src.returnValue === false)
          ? returnTrue
          : returnFalse; // Create target properties
      // Support: Safari <=6 - 7 only
      // Target should not be a text node (trac-504, trac-13143)

      this.target = src.target && src.target.nodeType === 3 ? src.target.parentNode : src.target;
      this.currentTarget = src.currentTarget;
      this.relatedTarget = src.relatedTarget; // Event type
    } else {
      this.type = src;
    } // Put explicitly provided properties onto the event object

    if (props) {
      jQuery.extend(this, props);
    } // Create a timestamp if incoming event doesn't have one

    this.timeStamp = (src && src.timeStamp) || Date.now(); // Mark it as fixed

    this[jQuery.expando] = true;
  }; // jQuery.Event is based on DOM3 Events as specified by the ECMAScript Language Binding
  // https://www.w3.org/TR/2003/WD-DOM-Level-3-Events-20030331/ecma-script-binding.html

  jQuery.Event.prototype = {
    constructor: jQuery.Event,
    isDefaultPrevented: returnFalse,
    isPropagationStopped: returnFalse,
    isImmediatePropagationStopped: returnFalse,
    isSimulated: false,
    preventDefault: function preventDefault() {
      var e = this.originalEvent;
      this.isDefaultPrevented = returnTrue;

      if (e && !this.isSimulated) {
        e.preventDefault();
      }
    },
    stopPropagation: function stopPropagation() {
      var e = this.originalEvent;
      this.isPropagationStopped = returnTrue;

      if (e && !this.isSimulated) {
        e.stopPropagation();
      }
    },
    stopImmediatePropagation: function stopImmediatePropagation() {
      var e = this.originalEvent;
      this.isImmediatePropagationStopped = returnTrue;

      if (e && !this.isSimulated) {
        e.stopImmediatePropagation();
      }

      this.stopPropagation();
    },
  }; // Includes all common event props including KeyEvent and MouseEvent specific props

  jQuery.each(
    {
      altKey: true,
      bubbles: true,
      cancelable: true,
      changedTouches: true,
      ctrlKey: true,
      detail: true,
      eventPhase: true,
      metaKey: true,
      pageX: true,
      pageY: true,
      shiftKey: true,
      view: true,
      char: true,
      code: true,
      charCode: true,
      key: true,
      keyCode: true,
      button: true,
      buttons: true,
      clientX: true,
      clientY: true,
      offsetX: true,
      offsetY: true,
      pointerId: true,
      pointerType: true,
      screenX: true,
      screenY: true,
      targetTouches: true,
      toElement: true,
      touches: true,
      which: true,
    },
    jQuery.event.addProp,
  );
  jQuery.each(
    {
      focus: 'focusin',
      blur: 'focusout',
    },
    function (type, delegateType) {
      jQuery.event.special[type] = {
        // Utilize native event if possible so blur/focus sequence is correct
        setup: function setup() {
          // Claim the first handler
          // dataPriv.set( this, "focus", ... )
          // dataPriv.set( this, "blur", ... )
          leverageNative(this, type, expectSync); // Return false to allow normal processing in the caller

          return false;
        },
        trigger: function trigger() {
          // Force setup before trigger
          leverageNative(this, type); // Return non-false to allow normal event-path propagation

          return true;
        },
        // Suppress native focus or blur if we're currently inside
        // a leveraged native-event stack
        _default: function _default(event) {
          return dataPriv.get(event.target, type);
        },
        delegateType: delegateType,
      };
    },
  ); // Create mouseenter/leave events using mouseover/out and event-time checks
  // so that event delegation works in jQuery.
  // Do the same for pointerenter/pointerleave and pointerover/pointerout
  //
  // Support: Safari 7 only
  // Safari sends mouseenter too often; see:
  // https://bugs.chromium.org/p/chromium/issues/detail?id=470258
  // for the description of the bug (it existed in older Chrome versions as well).

  jQuery.each(
    {
      mouseenter: 'mouseover',
      mouseleave: 'mouseout',
      pointerenter: 'pointerover',
      pointerleave: 'pointerout',
    },
    function (orig, fix) {
      jQuery.event.special[orig] = {
        delegateType: fix,
        bindType: fix,
        handle: function handle(event) {
          var ret,
            target = this,
            related = event.relatedTarget,
            handleObj = event.handleObj; // For mouseenter/leave call the handler if related is outside the target.
          // NB: No relatedTarget if the mouse left/entered the browser window

          if (!related || (related !== target && !jQuery.contains(target, related))) {
            event.type = handleObj.origType;
            ret = handleObj.handler.apply(this, arguments);
            event.type = fix;
          }

          return ret;
        },
      };
    },
  );
  jQuery.fn.extend({
    on: function on(types, selector, data, fn) {
      return _on(this, types, selector, data, fn);
    },
    one: function one(types, selector, data, fn) {
      return _on(this, types, selector, data, fn, 1);
    },
    off: function off(types, selector, fn) {
      var handleObj, type;

      if (types && types.preventDefault && types.handleObj) {
        // ( event )  dispatched jQuery.Event
        handleObj = types.handleObj;
        jQuery(types.delegateTarget).off(
          handleObj.namespace ? handleObj.origType + '.' + handleObj.namespace : handleObj.origType,
          handleObj.selector,
          handleObj.handler,
        );
        return this;
      }

      if (_typeof(types) === 'object') {
        // ( types-object [, selector] )
        for (type in types) {
          this.off(type, selector, types[type]);
        }

        return this;
      }

      if (selector === false || typeof selector === 'function') {
        // ( types [, fn] )
        fn = selector;
        selector = undefined;
      }

      if (fn === false) {
        fn = returnFalse;
      }

      return this.each(function () {
        jQuery.event.remove(this, types, fn, selector);
      });
    },
  });
  var // Support: IE <=10 - 11, Edge 12 - 13 only
    // In IE/Edge using regex groups here causes severe slowdowns.
    // See https://connect.microsoft.com/IE/feedback/details/1736512/
    rnoInnerhtml = /<script|<style|<link/i,
    // checked="checked" or checked
    rchecked = /checked\s*(?:[^=]|=\s*.checked.)/i,
    rcleanScript = /^\s*<!\[CDATA\[|\]\]>\s*$/g; // Prefer a tbody over its parent table for containing new rows

  function manipulationTarget(elem, content) {
    if (nodeName(elem, 'table') && nodeName(content.nodeType !== 11 ? content : content.firstChild, 'tr')) {
      return jQuery(elem).children('tbody')[0] || elem;
    }

    return elem;
  } // Replace/restore the type attribute of script elements for safe DOM manipulation

  function disableScript(elem) {
    elem.type = (elem.getAttribute('type') !== null) + '/' + elem.type;
    return elem;
  }

  function restoreScript(elem) {
    if ((elem.type || '').slice(0, 5) === 'true/') {
      elem.type = elem.type.slice(5);
    } else {
      elem.removeAttribute('type');
    }

    return elem;
  }

  function cloneCopyEvent(src, dest) {
    var i, l, type, pdataOld, udataOld, udataCur, events;

    if (dest.nodeType !== 1) {
      return;
    } // 1. Copy private data: events, handlers, etc.

    if (dataPriv.hasData(src)) {
      pdataOld = dataPriv.get(src);
      events = pdataOld.events;

      if (events) {
        dataPriv.remove(dest, 'handle events');

        for (type in events) {
          for (i = 0, l = events[type].length; i < l; i++) {
            jQuery.event.add(dest, type, events[type][i]);
          }
        }
      }
    } // 2. Copy user data

    if (dataUser.hasData(src)) {
      udataOld = dataUser.access(src);
      udataCur = jQuery.extend({}, udataOld);
      dataUser.set(dest, udataCur);
    }
  } // Fix IE bugs, see support tests

  function fixInput(src, dest) {
    var nodeName = dest.nodeName.toLowerCase(); // Fails to persist the checked state of a cloned checkbox or radio button.

    if (nodeName === 'input' && rcheckableType.test(src.type)) {
      dest.checked = src.checked; // Fails to return the selected option to the default selected state when cloning options
    } else if (nodeName === 'input' || nodeName === 'textarea') {
      dest.defaultValue = src.defaultValue;
    }
  }

  function domManip(collection, args, callback, ignored) {
    // Flatten any nested arrays
    args = flat(args);
    var fragment,
      first,
      scripts,
      hasScripts,
      node,
      doc,
      i = 0,
      l = collection.length,
      iNoClone = l - 1,
      value = args[0],
      valueIsFunction = isFunction(value); // We can't cloneNode fragments that contain checked, in WebKit

    if (valueIsFunction || (l > 1 && typeof value === 'string' && !support.checkClone && rchecked.test(value))) {
      return collection.each(function (index) {
        var self = collection.eq(index);

        if (valueIsFunction) {
          args[0] = value.call(this, index, self.html());
        }

        domManip(self, args, callback, ignored);
      });
    }

    if (l) {
      fragment = buildFragment(args, collection[0].ownerDocument, false, collection, ignored);
      first = fragment.firstChild;

      if (fragment.childNodes.length === 1) {
        fragment = first;
      } // Require either new content or an interest in ignored elements to invoke the callback

      if (first || ignored) {
        scripts = jQuery.map(getAll(fragment, 'script'), disableScript);
        hasScripts = scripts.length; // Use the original fragment for the last item
        // instead of the first because it can end up
        // being emptied incorrectly in certain situations (trac-8070).

        for (; i < l; i++) {
          node = fragment;

          if (i !== iNoClone) {
            node = jQuery.clone(node, true, true); // Keep references to cloned scripts for later restoration

            if (hasScripts) {
              // Support: Android <=4.0 only, PhantomJS 1 only
              // push.apply(_, arraylike) throws on ancient WebKit
              jQuery.merge(scripts, getAll(node, 'script'));
            }
          }

          callback.call(collection[i], node, i);
        }

        if (hasScripts) {
          doc = scripts[scripts.length - 1].ownerDocument; // Reenable scripts

          jQuery.map(scripts, restoreScript); // Evaluate executable scripts on first document insertion

          for (i = 0; i < hasScripts; i++) {
            node = scripts[i];

            if (
              rscriptType.test(node.type || '') &&
              !dataPriv.access(node, 'globalEval') &&
              jQuery.contains(doc, node)
            ) {
              if (node.src && (node.type || '').toLowerCase() !== 'module') {
                // Optional AJAX dependency, but won't run scripts if not present
                if (jQuery._evalUrl && !node.noModule) {
                  jQuery._evalUrl(
                    node.src,
                    {
                      nonce: node.nonce || node.getAttribute('nonce'),
                    },
                    doc,
                  );
                }
              } else {
                // Unwrap a CDATA section containing script contents. This shouldn't be
                // needed as in XML documents they're already not visible when
                // inspecting element contents and in HTML documents they have no
                // meaning but we're preserving that logic for backwards compatibility.
                // This will be removed completely in 4.0. See gh-4904.
                DOMEval(node.textContent.replace(rcleanScript, ''), node, doc);
              }
            }
          }
        }
      }
    }

    return collection;
  }

  function _remove(elem, selector, keepData) {
    var node,
      nodes = selector ? jQuery.filter(selector, elem) : elem,
      i = 0;

    for (; (node = nodes[i]) != null; i++) {
      if (!keepData && node.nodeType === 1) {
        jQuery.cleanData(getAll(node));
      }

      if (node.parentNode) {
        if (keepData && isAttached(node)) {
          setGlobalEval(getAll(node, 'script'));
        }

        node.parentNode.removeChild(node);
      }
    }

    return elem;
  }

  jQuery.extend({
    htmlPrefilter: function htmlPrefilter(html) {
      return html;
    },
    clone: function clone(elem, dataAndEvents, deepDataAndEvents) {
      var i,
        l,
        srcElements,
        destElements,
        clone = elem.cloneNode(true),
        inPage = isAttached(elem); // Fix IE cloning issues

      if (!support.noCloneChecked && (elem.nodeType === 1 || elem.nodeType === 11) && !jQuery.isXMLDoc(elem)) {
        // We eschew Sizzle here for performance reasons: https://jsperf.com/getall-vs-sizzle/2
        destElements = getAll(clone);
        srcElements = getAll(elem);

        for (i = 0, l = srcElements.length; i < l; i++) {
          fixInput(srcElements[i], destElements[i]);
        }
      } // Copy the events from the original to the clone

      if (dataAndEvents) {
        if (deepDataAndEvents) {
          srcElements = srcElements || getAll(elem);
          destElements = destElements || getAll(clone);

          for (i = 0, l = srcElements.length; i < l; i++) {
            cloneCopyEvent(srcElements[i], destElements[i]);
          }
        } else {
          cloneCopyEvent(elem, clone);
        }
      } // Preserve script evaluation history

      destElements = getAll(clone, 'script');

      if (destElements.length > 0) {
        setGlobalEval(destElements, !inPage && getAll(elem, 'script'));
      } // Return the cloned set

      return clone;
    },
    cleanData: function cleanData(elems) {
      var data,
        elem,
        type,
        special = jQuery.event.special,
        i = 0;

      for (; (elem = elems[i]) !== undefined; i++) {
        if (acceptData(elem)) {
          if ((data = elem[dataPriv.expando])) {
            if (data.events) {
              for (type in data.events) {
                if (special[type]) {
                  jQuery.event.remove(elem, type); // This is a shortcut to avoid jQuery.event.remove's overhead
                } else {
                  jQuery.removeEvent(elem, type, data.handle);
                }
              }
            } // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove

            elem[dataPriv.expando] = undefined;
          }

          if (elem[dataUser.expando]) {
            // Support: Chrome <=35 - 45+
            // Assign undefined instead of using delete, see Data#remove
            elem[dataUser.expando] = undefined;
          }
        }
      }
    },
  });
  jQuery.fn.extend({
    detach: function detach(selector) {
      return _remove(this, selector, true);
    },
    remove: function remove(selector) {
      return _remove(this, selector);
    },
    text: function text(value) {
      return access(
        this,
        function (value) {
          return value === undefined
            ? jQuery.text(this)
            : this.empty().each(function () {
                if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
                  this.textContent = value;
                }
              });
        },
        null,
        value,
        arguments.length,
      );
    },
    append: function append() {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.appendChild(elem);
        }
      });
    },
    prepend: function prepend() {
      return domManip(this, arguments, function (elem) {
        if (this.nodeType === 1 || this.nodeType === 11 || this.nodeType === 9) {
          var target = manipulationTarget(this, elem);
          target.insertBefore(elem, target.firstChild);
        }
      });
    },
    before: function before() {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this);
        }
      });
    },
    after: function after() {
      return domManip(this, arguments, function (elem) {
        if (this.parentNode) {
          this.parentNode.insertBefore(elem, this.nextSibling);
        }
      });
    },
    empty: function empty() {
      var elem,
        i = 0;

      for (; (elem = this[i]) != null; i++) {
        if (elem.nodeType === 1) {
          // Prevent memory leaks
          jQuery.cleanData(getAll(elem, false)); // Remove any remaining nodes

          elem.textContent = '';
        }
      }

      return this;
    },
    clone: function clone(dataAndEvents, deepDataAndEvents) {
      dataAndEvents = dataAndEvents == null ? false : dataAndEvents;
      deepDataAndEvents = deepDataAndEvents == null ? dataAndEvents : deepDataAndEvents;
      return this.map(function () {
        return jQuery.clone(this, dataAndEvents, deepDataAndEvents);
      });
    },
    html: function html(value) {
      return access(
        this,
        function (value) {
          var elem = this[0] || {},
            i = 0,
            l = this.length;

          if (value === undefined && elem.nodeType === 1) {
            return elem.innerHTML;
          } // See if we can take a shortcut and just use innerHTML

          if (
            typeof value === 'string' &&
            !rnoInnerhtml.test(value) &&
            !wrapMap[(rtagName.exec(value) || ['', ''])[1].toLowerCase()]
          ) {
            value = jQuery.htmlPrefilter(value);

            try {
              for (; i < l; i++) {
                elem = this[i] || {}; // Remove element nodes and prevent memory leaks

                if (elem.nodeType === 1) {
                  jQuery.cleanData(getAll(elem, false));
                  elem.innerHTML = value;
                }
              }

              elem = 0; // If using innerHTML throws an exception, use the fallback method
            } catch (e) {}
          }

          if (elem) {
            this.empty().append(value);
          }
        },
        null,
        value,
        arguments.length,
      );
    },
    replaceWith: function replaceWith() {
      var ignored = []; // Make the changes, replacing each non-ignored context element with the new content

      return domManip(
        this,
        arguments,
        function (elem) {
          var parent = this.parentNode;

          if (jQuery.inArray(this, ignored) < 0) {
            jQuery.cleanData(getAll(this));

            if (parent) {
              parent.replaceChild(elem, this);
            }
          } // Force callback invocation
        },
        ignored,
      );
    },
  });
  jQuery.each(
    {
      appendTo: 'append',
      prependTo: 'prepend',
      insertBefore: 'before',
      insertAfter: 'after',
      replaceAll: 'replaceWith',
    },
    function (name, original) {
      jQuery.fn[name] = function (selector) {
        var elems,
          ret = [],
          insert = jQuery(selector),
          last = insert.length - 1,
          i = 0;

        for (; i <= last; i++) {
          elems = i === last ? this : this.clone(true);
          jQuery(insert[i])[original](elems); // Support: Android <=4.0 only, PhantomJS 1 only
          // .get() because push.apply(_, arraylike) throws on ancient WebKit

          push.apply(ret, elems.get());
        }

        return this.pushStack(ret);
      };
    },
  );
  var rnumnonpx = new RegExp('^(' + pnum + ')(?!px)[a-z%]+$', 'i');
  var rcustomProp = /^--/;

  var getStyles = function getStyles(elem) {
    // Support: IE <=11 only, Firefox <=30 (trac-15098, trac-14150)
    // IE throws on elements created in popups
    // FF meanwhile throws on frame elements through "defaultView.getComputedStyle"
    var view = elem.ownerDocument.defaultView;

    if (!view || !view.opener) {
      view = window;
    }

    return view.getComputedStyle(elem);
  };

  var swap = function swap(elem, options, callback) {
    var ret,
      name,
      old = {}; // Remember the old values, and insert the new ones

    for (name in options) {
      old[name] = elem.style[name];
      elem.style[name] = options[name];
    }

    ret = callback.call(elem); // Revert the old values

    for (name in options) {
      elem.style[name] = old[name];
    }

    return ret;
  };

  var rboxStyle = new RegExp(cssExpand.join('|'), 'i');
  var whitespace = '[\\x20\\t\\r\\n\\f]';
  var rtrimCSS = new RegExp('^' + whitespace + '+|((?:^|[^\\\\])(?:\\\\.)*)' + whitespace + '+$', 'g');

  (function () {
    // Executing both pixelPosition & boxSizingReliable tests require only one layout
    // so they're executed at the same time to save the second computation.
    function computeStyleTests() {
      // This is a singleton, we need to execute it only once
      if (!div) {
        return;
      }

      container.style.cssText = 'position:absolute;left:-11111px;width:60px;' + 'margin-top:1px;padding:0;border:0';
      div.style.cssText =
        'position:relative;display:block;box-sizing:border-box;overflow:scroll;' +
        'margin:auto;border:1px;padding:1px;' +
        'width:60%;top:1%';
      documentElement.appendChild(container).appendChild(div);
      var divStyle = window.getComputedStyle(div);
      pixelPositionVal = divStyle.top !== '1%'; // Support: Android 4.0 - 4.3 only, Firefox <=3 - 44

      reliableMarginLeftVal = roundPixelMeasures(divStyle.marginLeft) === 12; // Support: Android 4.0 - 4.3 only, Safari <=9.1 - 10.1, iOS <=7.0 - 9.3
      // Some styles come back with percentage values, even though they shouldn't

      div.style.right = '60%';
      pixelBoxStylesVal = roundPixelMeasures(divStyle.right) === 36; // Support: IE 9 - 11 only
      // Detect misreporting of content dimensions for box-sizing:border-box elements

      boxSizingReliableVal = roundPixelMeasures(divStyle.width) === 36; // Support: IE 9 only
      // Detect overflow:scroll screwiness (gh-3699)
      // Support: Chrome <=64
      // Don't get tricked when zoom affects offsetWidth (gh-4029)

      div.style.position = 'absolute';
      scrollboxSizeVal = roundPixelMeasures(div.offsetWidth / 3) === 12;
      documentElement.removeChild(container); // Nullify the div so it wouldn't be stored in the memory and
      // it will also be a sign that checks already performed

      div = null;
    }

    function roundPixelMeasures(measure) {
      return Math.round(parseFloat(measure));
    }

    var pixelPositionVal,
      boxSizingReliableVal,
      scrollboxSizeVal,
      pixelBoxStylesVal,
      reliableTrDimensionsVal,
      reliableMarginLeftVal,
      container = document.createElement('div'),
      div = document.createElement('div'); // Finish early in limited (non-browser) environments

    if (!div.style) {
      return;
    } // Support: IE <=9 - 11 only
    // Style of cloned element affects source element cloned (trac-8908)

    div.style.backgroundClip = 'content-box';
    div.cloneNode(true).style.backgroundClip = '';
    support.clearCloneStyle = div.style.backgroundClip === 'content-box';
    jQuery.extend(support, {
      boxSizingReliable: function boxSizingReliable() {
        computeStyleTests();
        return boxSizingReliableVal;
      },
      pixelBoxStyles: function pixelBoxStyles() {
        computeStyleTests();
        return pixelBoxStylesVal;
      },
      pixelPosition: function pixelPosition() {
        computeStyleTests();
        return pixelPositionVal;
      },
      reliableMarginLeft: function reliableMarginLeft() {
        computeStyleTests();
        return reliableMarginLeftVal;
      },
      scrollboxSize: function scrollboxSize() {
        computeStyleTests();
        return scrollboxSizeVal;
      },
      // Support: IE 9 - 11+, Edge 15 - 18+
      // IE/Edge misreport `getComputedStyle` of table rows with width/height
      // set in CSS while `offset*` properties report correct values.
      // Behavior in IE 9 is more subtle than in newer versions & it passes
      // some versions of this test; make sure not to make it pass there!
      //
      // Support: Firefox 70+
      // Only Firefox includes border widths
      // in computed dimensions. (gh-4529)
      reliableTrDimensions: function reliableTrDimensions() {
        var table, tr, trChild, trStyle;

        if (reliableTrDimensionsVal == null) {
          table = document.createElement('table');
          tr = document.createElement('tr');
          trChild = document.createElement('div');
          table.style.cssText = 'position:absolute;left:-11111px;border-collapse:separate';
          tr.style.cssText = 'border:1px solid'; // Support: Chrome 86+
          // Height set through cssText does not get applied.
          // Computed height then comes back as 0.

          tr.style.height = '1px';
          trChild.style.height = '9px'; // Support: Android 8 Chrome 86+
          // In our bodyBackground.html iframe,
          // display for all div elements is set to "inline",
          // which causes a problem only in Android 8 Chrome 86.
          // Ensuring the div is display: block
          // gets around this issue.

          trChild.style.display = 'block';
          documentElement.appendChild(table).appendChild(tr).appendChild(trChild);
          trStyle = window.getComputedStyle(tr);
          reliableTrDimensionsVal =
            parseInt(trStyle.height, 10) +
              parseInt(trStyle.borderTopWidth, 10) +
              parseInt(trStyle.borderBottomWidth, 10) ===
            tr.offsetHeight;
          documentElement.removeChild(table);
        }

        return reliableTrDimensionsVal;
      },
    });
  })();

  function curCSS(elem, name, computed) {
    var width,
      minWidth,
      maxWidth,
      ret,
      isCustomProp = rcustomProp.test(name),
      // Support: Firefox 51+
      // Retrieving style before computed somehow
      // fixes an issue with getting wrong values
      // on detached elements
      style = elem.style;
    computed = computed || getStyles(elem); // getPropertyValue is needed for:
    //   .css('filter') (IE 9 only, trac-12537)
    //   .css('--customProperty) (gh-3144)

    if (computed) {
      ret = computed.getPropertyValue(name) || computed[name]; // trim whitespace for custom property (issue gh-4926)

      if (isCustomProp) {
        // rtrim treats U+000D CARRIAGE RETURN and U+000C FORM FEED
        // as whitespace while CSS does not, but this is not a problem
        // because CSS preprocessing replaces them with U+000A LINE FEED
        // (which *is* CSS whitespace)
        // https://www.w3.org/TR/css-syntax-3/#input-preprocessing
        ret = ret.replace(rtrimCSS, '$1');
      }

      if (ret === '' && !isAttached(elem)) {
        ret = jQuery.style(elem, name);
      } // A tribute to the "awesome hack by Dean Edwards"
      // Android Browser returns percentage for some values,
      // but width seems to be reliably pixels.
      // This is against the CSSOM draft spec:
      // https://drafts.csswg.org/cssom/#resolved-values

      if (!support.pixelBoxStyles() && rnumnonpx.test(ret) && rboxStyle.test(name)) {
        // Remember the original values
        width = style.width;
        minWidth = style.minWidth;
        maxWidth = style.maxWidth; // Put in the new values to get a computed value out

        style.minWidth = style.maxWidth = style.width = ret;
        ret = computed.width; // Revert the changed values

        style.width = width;
        style.minWidth = minWidth;
        style.maxWidth = maxWidth;
      }
    }

    return ret !== undefined // Support: IE <=9 - 11 only
      ? // IE returns zIndex value as an integer.
        ret + ''
      : ret;
  }

  function addGetHookIf(conditionFn, hookFn) {
    // Define the hook, we'll check on the first run if it's really needed.
    return {
      get: function get() {
        if (conditionFn()) {
          // Hook not needed (or it's not possible to use it due
          // to missing dependency), remove it.
          delete this.get;
          return;
        } // Hook needed; redefine it so that the support test is not executed again.

        return (this.get = hookFn).apply(this, arguments);
      },
    };
  }

  var cssPrefixes = ['Webkit', 'Moz', 'ms'],
    emptyStyle = document.createElement('div').style,
    vendorProps = {}; // Return a vendor-prefixed property or undefined

  function vendorPropName(name) {
    // Check for vendor prefixed names
    var capName = name[0].toUpperCase() + name.slice(1),
      i = cssPrefixes.length;

    while (i--) {
      name = cssPrefixes[i] + capName;

      if (name in emptyStyle) {
        return name;
      }
    }
  } // Return a potentially-mapped jQuery.cssProps or vendor prefixed property

  function finalPropName(name) {
    var final = jQuery.cssProps[name] || vendorProps[name];

    if (final) {
      return final;
    }

    if (name in emptyStyle) {
      return name;
    }

    return (vendorProps[name] = vendorPropName(name) || name);
  }

  var // Swappable if display is none or starts with table
    // except "table", "table-cell", or "table-caption"
    // See here for display values: https://developer.mozilla.org/en-US/docs/CSS/display
    rdisplayswap = /^(none|table(?!-c[ea]).+)/,
    cssShow = {
      position: 'absolute',
      visibility: 'hidden',
      display: 'block',
    },
    cssNormalTransform = {
      letterSpacing: '0',
      fontWeight: '400',
    };

  function setPositiveNumber(_elem, value, subtract) {
    // Any relative (+/-) values have already been
    // normalized at this point
    var matches = rcssNum.exec(value);
    return matches // Guard against undefined "subtract", e.g., when used as in cssHooks
      ? Math.max(0, matches[2] - (subtract || 0)) + (matches[3] || 'px')
      : value;
  }

  function boxModelAdjustment(elem, dimension, box, isBorderBox, styles, computedVal) {
    var i = dimension === 'width' ? 1 : 0,
      extra = 0,
      delta = 0; // Adjustment may not be necessary

    if (box === (isBorderBox ? 'border' : 'content')) {
      return 0;
    }

    for (; i < 4; i += 2) {
      // Both box models exclude margin
      if (box === 'margin') {
        delta += jQuery.css(elem, box + cssExpand[i], true, styles);
      } // If we get here with a content-box, we're seeking "padding" or "border" or "margin"

      if (!isBorderBox) {
        // Add padding
        delta += jQuery.css(elem, 'padding' + cssExpand[i], true, styles); // For "border" or "margin", add border

        if (box !== 'padding') {
          delta += jQuery.css(elem, 'border' + cssExpand[i] + 'Width', true, styles); // But still keep track of it otherwise
        } else {
          extra += jQuery.css(elem, 'border' + cssExpand[i] + 'Width', true, styles);
        } // If we get here with a border-box (content + padding + border), we're seeking "content" or
        // "padding" or "margin"
      } else {
        // For "content", subtract padding
        if (box === 'content') {
          delta -= jQuery.css(elem, 'padding' + cssExpand[i], true, styles);
        } // For "content" or "padding", subtract border

        if (box !== 'margin') {
          delta -= jQuery.css(elem, 'border' + cssExpand[i] + 'Width', true, styles);
        }
      }
    } // Account for positive content-box scroll gutter when requested by providing computedVal

    if (!isBorderBox && computedVal >= 0) {
      // offsetWidth/offsetHeight is a rounded sum of content, padding, scroll gutter, and border
      // Assuming integer scroll gutter, subtract the rest and round down
      delta +=
        Math.max(
          0,
          Math.ceil(
            elem['offset' + dimension[0].toUpperCase() + dimension.slice(1)] - computedVal - delta - extra - 0.5, // If offsetWidth/offsetHeight is unknown, then we can't determine content-box scroll gutter
            // Use an explicit zero to avoid NaN (gh-3964)
          ),
        ) || 0;
    }

    return delta;
  }

  function getWidthOrHeight(elem, dimension, extra) {
    // Start with computed style
    var styles = getStyles(elem),
      // To avoid forcing a reflow, only fetch boxSizing if we need it (gh-4322).
      // Fake content-box until we know it's needed to know the true value.
      boxSizingNeeded = !support.boxSizingReliable() || extra,
      isBorderBox = boxSizingNeeded && jQuery.css(elem, 'boxSizing', false, styles) === 'border-box',
      valueIsBorderBox = isBorderBox,
      val = curCSS(elem, dimension, styles),
      offsetProp = 'offset' + dimension[0].toUpperCase() + dimension.slice(1); // Support: Firefox <=54
    // Return a confounding non-pixel value or feign ignorance, as appropriate.

    if (rnumnonpx.test(val)) {
      if (!extra) {
        return val;
      }

      val = 'auto';
    } // Support: IE 9 - 11 only
    // Use offsetWidth/offsetHeight for when box sizing is unreliable.
    // In those cases, the computed value can be trusted to be border-box.

    if (
      ((!support.boxSizingReliable() && isBorderBox) || // Support: IE 10 - 11+, Edge 15 - 18+
        // IE/Edge misreport `getComputedStyle` of table rows with width/height
        // set in CSS while `offset*` properties report correct values.
        // Interestingly, in some cases IE 9 doesn't suffer from this issue.
        (!support.reliableTrDimensions() && nodeName(elem, 'tr')) || // Fall back to offsetWidth/offsetHeight when value is "auto"
        // This happens for inline elements with no explicit setting (gh-3571)
        val === 'auto' || // Support: Android <=4.1 - 4.3 only
        // Also use offsetWidth/offsetHeight for misreported inline dimensions (gh-3602)
        (!parseFloat(val) && jQuery.css(elem, 'display', false, styles) === 'inline')) && // Make sure the element is visible & connected
      elem.getClientRects().length
    ) {
      isBorderBox = jQuery.css(elem, 'boxSizing', false, styles) === 'border-box'; // Where available, offsetWidth/offsetHeight approximate border box dimensions.
      // Where not available (e.g., SVG), assume unreliable box-sizing and interpret the
      // retrieved value as a content box dimension.

      valueIsBorderBox = offsetProp in elem;

      if (valueIsBorderBox) {
        val = elem[offsetProp];
      }
    } // Normalize "" and auto

    val = parseFloat(val) || 0; // Adjust for the element's box model

    return (
      val +
      boxModelAdjustment(
        elem,
        dimension,
        extra || (isBorderBox ? 'border' : 'content'),
        valueIsBorderBox,
        styles, // Provide the current computed size to request scroll gutter calculation (gh-3589)
        val,
      ) +
      'px'
    );
  }

  jQuery.extend({
    // Add in style property hooks for overriding the default
    // behavior of getting and setting a style property
    cssHooks: {
      opacity: {
        get: function get(elem, computed) {
          if (computed) {
            // We should always get a number back from opacity
            var ret = curCSS(elem, 'opacity');
            return ret === '' ? '1' : ret;
          }
        },
      },
    },
    // Don't automatically add "px" to these possibly-unitless properties
    cssNumber: {
      animationIterationCount: true,
      columnCount: true,
      fillOpacity: true,
      flexGrow: true,
      flexShrink: true,
      fontWeight: true,
      gridArea: true,
      gridColumn: true,
      gridColumnEnd: true,
      gridColumnStart: true,
      gridRow: true,
      gridRowEnd: true,
      gridRowStart: true,
      lineHeight: true,
      opacity: true,
      order: true,
      orphans: true,
      widows: true,
      zIndex: true,
      zoom: true,
    },
    // Add in properties whose names you wish to fix before
    // setting or getting the value
    cssProps: {},
    // Get and set the style property on a DOM Node
    style: function style(elem, name, value, extra) {
      // Don't set styles on text and comment nodes
      if (!elem || elem.nodeType === 3 || elem.nodeType === 8 || !elem.style) {
        return;
      } // Make sure that we're working with the right name

      var ret,
        type,
        hooks,
        origName = camelCase(name),
        isCustomProp = rcustomProp.test(name),
        style = elem.style; // Make sure that we're working with the right name. We don't
      // want to query the value if it is a CSS custom property
      // since they are user-defined.

      if (!isCustomProp) {
        name = finalPropName(origName);
      } // Gets hook for the prefixed version, then unprefixed version

      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // Check if we're setting a value

      if (value !== undefined) {
        type = _typeof(value); // Convert "+=" or "-=" to relative numbers (trac-7345)

        if (type === 'string' && (ret = rcssNum.exec(value)) && ret[1]) {
          value = adjustCSS(elem, name, ret); // Fixes bug trac-9237

          type = 'number';
        } // Make sure that null and NaN values aren't set (trac-7116)

        if (value == null || value !== value) {
          return;
        } // If a number was passed in, add the unit (except for certain CSS properties)
        // The isCustomProp check can be removed in jQuery 4.0 when we only auto-append
        // "px" to a few hardcoded values.

        if (type === 'number' && !isCustomProp) {
          value += (ret && ret[3]) || (jQuery.cssNumber[origName] ? '' : 'px');
        } // background-* props affect original clone's values

        if (!support.clearCloneStyle && value === '' && name.indexOf('background') === 0) {
          style[name] = 'inherit';
        } // If a hook was provided, use that value, otherwise just set the specified value

        if (!hooks || !('set' in hooks) || (value = hooks.set(elem, value, extra)) !== undefined) {
          if (isCustomProp) {
            style.setProperty(name, value);
          } else {
            style[name] = value;
          }
        }
      } else {
        // If a hook was provided get the non-computed value from there
        if (hooks && 'get' in hooks && (ret = hooks.get(elem, false, extra)) !== undefined) {
          return ret;
        } // Otherwise just get the value from the style object

        return style[name];
      }
    },
    css: function css(elem, name, extra, styles) {
      var val,
        num,
        hooks,
        origName = camelCase(name),
        isCustomProp = rcustomProp.test(name); // Make sure that we're working with the right name. We don't
      // want to modify the value if it is a CSS custom property
      // since they are user-defined.

      if (!isCustomProp) {
        name = finalPropName(origName);
      } // Try prefixed name followed by the unprefixed name

      hooks = jQuery.cssHooks[name] || jQuery.cssHooks[origName]; // If a hook was provided get the computed value from there

      if (hooks && 'get' in hooks) {
        val = hooks.get(elem, true, extra);
      } // Otherwise, if a way to get the computed value exists, use that

      if (val === undefined) {
        val = curCSS(elem, name, styles);
      } // Convert "normal" to computed value

      if (val === 'normal' && name in cssNormalTransform) {
        val = cssNormalTransform[name];
      } // Make numeric if forced or a qualifier was provided and val looks numeric

      if (extra === '' || extra) {
        num = parseFloat(val);
        return extra === true || isFinite(num) ? num || 0 : val;
      }

      return val;
    },
  });
  jQuery.each(['height', 'width'], function (_i, dimension) {
    jQuery.cssHooks[dimension] = {
      get: function get(elem, computed, extra) {
        if (computed) {
          // Certain elements can have dimension info if we invisibly show them
          // but it must have a current display style that would benefit
          return rdisplayswap.test(jQuery.css(elem, 'display')) &&
            (!elem.getClientRects().length || !elem.getBoundingClientRect().width)
            ? swap(elem, cssShow, function () {
                return getWidthOrHeight(elem, dimension, extra);
              })
            : getWidthOrHeight(elem, dimension, extra);
        }
      },
      set: function set(elem, value, extra) {
        var matches,
          styles = getStyles(elem),
          // Only read styles.position if the test has a chance to fail
          // to avoid forcing a reflow.
          scrollboxSizeBuggy = !support.scrollboxSize() && styles.position === 'absolute',
          // To avoid forcing a reflow, only fetch boxSizing if we need it (gh-3991)
          boxSizingNeeded = scrollboxSizeBuggy || extra,
          isBorderBox = boxSizingNeeded && jQuery.css(elem, 'boxSizing', false, styles) === 'border-box',
          subtract = extra ? boxModelAdjustment(elem, dimension, extra, isBorderBox, styles) : 0; // Account for unreliable border-box dimensions by comparing offset* to computed and
        // faking a content-box to get border and padding (gh-3699)

        if (isBorderBox && scrollboxSizeBuggy) {
          subtract -= Math.ceil(
            elem['offset' + dimension[0].toUpperCase() + dimension.slice(1)] -
              parseFloat(styles[dimension]) -
              boxModelAdjustment(elem, dimension, 'border', false, styles) -
              0.5,
          );
        } // Convert to pixels if value adjustment is needed

        if (subtract && (matches = rcssNum.exec(value)) && (matches[3] || 'px') !== 'px') {
          elem.style[dimension] = value;
          value = jQuery.css(elem, dimension);
        }

        return setPositiveNumber(elem, value, subtract);
      },
    };
  });
  jQuery.cssHooks.marginLeft = addGetHookIf(support.reliableMarginLeft, function (elem, computed) {
    if (computed) {
      return (
        (parseFloat(curCSS(elem, 'marginLeft')) ||
          elem.getBoundingClientRect().left -
            swap(
              elem,
              {
                marginLeft: 0,
              },
              function () {
                return elem.getBoundingClientRect().left;
              },
            )) + 'px'
      );
    }
  }); // These hooks are used by animate to expand properties

  jQuery.each(
    {
      margin: '',
      padding: '',
      border: 'Width',
    },
    function (prefix, suffix) {
      jQuery.cssHooks[prefix + suffix] = {
        expand: function expand(value) {
          var i = 0,
            expanded = {},
            // Assumes a single number if not a string
            parts = typeof value === 'string' ? value.split(' ') : [value];

          for (; i < 4; i++) {
            expanded[prefix + cssExpand[i] + suffix] = parts[i] || parts[i - 2] || parts[0];
          }

          return expanded;
        },
      };

      if (prefix !== 'margin') {
        jQuery.cssHooks[prefix + suffix].set = setPositiveNumber;
      }
    },
  );
  jQuery.fn.extend({
    css: function css(name, value) {
      return access(
        this,
        function (elem, name, value) {
          var styles,
            len,
            map = {},
            i = 0;

          if (Array.isArray(name)) {
            styles = getStyles(elem);
            len = name.length;

            for (; i < len; i++) {
              map[name[i]] = jQuery.css(elem, name[i], false, styles);
            }

            return map;
          }

          return value !== undefined ? jQuery.style(elem, name, value) : jQuery.css(elem, name);
        },
        name,
        value,
        arguments.length > 1,
      );
    },
  });

  function Tween(elem, options, prop, end, easing) {
    return new Tween.prototype.init(elem, options, prop, end, easing);
  }

  jQuery.Tween = Tween;
  Tween.prototype = {
    constructor: Tween,
    init: function init(elem, options, prop, end, easing, unit) {
      this.elem = elem;
      this.prop = prop;
      this.easing = easing || jQuery.easing._default;
      this.options = options;
      this.start = this.now = this.cur();
      this.end = end;
      this.unit = unit || (jQuery.cssNumber[prop] ? '' : 'px');
    },
    cur: function cur() {
      var hooks = Tween.propHooks[this.prop];
      return hooks && hooks.get ? hooks.get(this) : Tween.propHooks._default.get(this);
    },
    run: function run(percent) {
      var eased,
        hooks = Tween.propHooks[this.prop];

      if (this.options.duration) {
        this.pos = eased = jQuery.easing[this.easing](
          percent,
          this.options.duration * percent,
          0,
          1,
          this.options.duration,
        );
      } else {
        this.pos = eased = percent;
      }

      this.now = (this.end - this.start) * eased + this.start;

      if (this.options.step) {
        this.options.step.call(this.elem, this.now, this);
      }

      if (hooks && hooks.set) {
        hooks.set(this);
      } else {
        Tween.propHooks._default.set(this);
      }

      return this;
    },
  };
  Tween.prototype.init.prototype = Tween.prototype;
  Tween.propHooks = {
    _default: {
      get: function get(tween) {
        var result; // Use a property on the element directly when it is not a DOM element,
        // or when there is no matching style property that exists.

        if (tween.elem.nodeType !== 1 || (tween.elem[tween.prop] != null && tween.elem.style[tween.prop] == null)) {
          return tween.elem[tween.prop];
        } // Passing an empty string as a 3rd parameter to .css will automatically
        // attempt a parseFloat and fallback to a string if the parse fails.
        // Simple values such as "10px" are parsed to Float;
        // complex values such as "rotate(1rad)" are returned as-is.

        result = jQuery.css(tween.elem, tween.prop, ''); // Empty strings, null, undefined and "auto" are converted to 0.

        return !result || result === 'auto' ? 0 : result;
      },
      set: function set(tween) {
        // Use step hook for back compat.
        // Use cssHook if its there.
        // Use .style if available and use plain properties where available.
        if (jQuery.fx.step[tween.prop]) {
          jQuery.fx.step[tween.prop](tween);
        } else if (
          tween.elem.nodeType === 1 &&
          (jQuery.cssHooks[tween.prop] || tween.elem.style[finalPropName(tween.prop)] != null)
        ) {
          jQuery.style(tween.elem, tween.prop, tween.now + tween.unit);
        } else {
          tween.elem[tween.prop] = tween.now;
        }
      },
    },
  }; // Support: IE <=9 only
  // Panic based approach to setting things on disconnected nodes

  Tween.propHooks.scrollTop = Tween.propHooks.scrollLeft = {
    set: function set(tween) {
      if (tween.elem.nodeType && tween.elem.parentNode) {
        tween.elem[tween.prop] = tween.now;
      }
    },
  };
  jQuery.easing = {
    linear: function linear(p) {
      return p;
    },
    swing: function swing(p) {
      return 0.5 - Math.cos(p * Math.PI) / 2;
    },
    _default: 'swing',
  };
  jQuery.fx = Tween.prototype.init; // Back compat <1.8 extension point

  jQuery.fx.step = {};
  var fxNow,
    inProgress,
    rfxtypes = /^(?:toggle|show|hide)$/,
    rrun = /queueHooks$/;

  function schedule() {
    if (inProgress) {
      if (document.hidden === false && window.requestAnimationFrame) {
        window.requestAnimationFrame(schedule);
      } else {
        window.setTimeout(schedule, jQuery.fx.interval);
      }

      jQuery.fx.tick();
    }
  } // Animations created synchronously will run synchronously

  function createFxNow() {
    window.setTimeout(function () {
      fxNow = undefined;
    });
    return (fxNow = Date.now());
  } // Generate parameters to create a standard animation

  function genFx(type, includeWidth) {
    var which,
      i = 0,
      attrs = {
        height: type,
      }; // If we include width, step value is 1 to do all cssExpand values,
    // otherwise step value is 2 to skip over Left and Right

    includeWidth = includeWidth ? 1 : 0;

    for (; i < 4; i += 2 - includeWidth) {
      which = cssExpand[i];
      attrs['margin' + which] = attrs['padding' + which] = type;
    }

    if (includeWidth) {
      attrs.opacity = attrs.width = type;
    }

    return attrs;
  }

  function createTween(value, prop, animation) {
    var tween,
      collection = (Animation.tweeners[prop] || []).concat(Animation.tweeners['*']),
      index = 0,
      length = collection.length;

    for (; index < length; index++) {
      if ((tween = collection[index].call(animation, prop, value))) {
        // We're done with this property
        return tween;
      }
    }
  }

  function defaultPrefilter(elem, props, opts) {
    var prop,
      value,
      toggle,
      hooks,
      oldfire,
      propTween,
      restoreDisplay,
      display,
      isBox = 'width' in props || 'height' in props,
      anim = this,
      orig = {},
      style = elem.style,
      hidden = elem.nodeType && isHiddenWithinTree(elem),
      dataShow = dataPriv.get(elem, 'fxshow'); // Queue-skipping animations hijack the fx hooks

    if (!opts.queue) {
      hooks = jQuery._queueHooks(elem, 'fx');

      if (hooks.unqueued == null) {
        hooks.unqueued = 0;
        oldfire = hooks.empty.fire;

        hooks.empty.fire = function () {
          if (!hooks.unqueued) {
            oldfire();
          }
        };
      }

      hooks.unqueued++;
      anim.always(function () {
        // Ensure the complete handler is called before this completes
        anim.always(function () {
          hooks.unqueued--;

          if (!jQuery.queue(elem, 'fx').length) {
            hooks.empty.fire();
          }
        });
      });
    } // Detect show/hide animations

    for (prop in props) {
      value = props[prop];

      if (rfxtypes.test(value)) {
        delete props[prop];
        toggle = toggle || value === 'toggle';

        if (value === (hidden ? 'hide' : 'show')) {
          // Pretend to be hidden if this is a "show" and
          // there is still data from a stopped show/hide
          if (value === 'show' && dataShow && dataShow[prop] !== undefined) {
            hidden = true; // Ignore all other no-op show/hide data
          } else {
            continue;
          }
        }

        orig[prop] = (dataShow && dataShow[prop]) || jQuery.style(elem, prop);
      }
    } // Bail out if this is a no-op like .hide().hide()

    propTween = !jQuery.isEmptyObject(props);

    if (!propTween && jQuery.isEmptyObject(orig)) {
      return;
    } // Restrict "overflow" and "display" styles during box animations

    if (isBox && elem.nodeType === 1) {
      // Support: IE <=9 - 11, Edge 12 - 15
      // Record all 3 overflow attributes because IE does not infer the shorthand
      // from identically-valued overflowX and overflowY and Edge just mirrors
      // the overflowX value there.
      opts.overflow = [style.overflow, style.overflowX, style.overflowY]; // Identify a display type, preferring old show/hide data over the CSS cascade

      restoreDisplay = dataShow && dataShow.display;

      if (restoreDisplay == null) {
        restoreDisplay = dataPriv.get(elem, 'display');
      }

      display = jQuery.css(elem, 'display');

      if (display === 'none') {
        if (restoreDisplay) {
          display = restoreDisplay;
        } else {
          // Get nonempty value(s) by temporarily forcing visibility
          showHide([elem], true);
          restoreDisplay = elem.style.display || restoreDisplay;
          display = jQuery.css(elem, 'display');
          showHide([elem]);
        }
      } // Animate inline elements as inline-block

      if (display === 'inline' || (display === 'inline-block' && restoreDisplay != null)) {
        if (jQuery.css(elem, 'float') === 'none') {
          // Restore the original display value at the end of pure show/hide animations
          if (!propTween) {
            anim.done(function () {
              style.display = restoreDisplay;
            });

            if (restoreDisplay == null) {
              display = style.display;
              restoreDisplay = display === 'none' ? '' : display;
            }
          }

          style.display = 'inline-block';
        }
      }
    }

    if (opts.overflow) {
      style.overflow = 'hidden';
      anim.always(function () {
        style.overflow = opts.overflow[0];
        style.overflowX = opts.overflow[1];
        style.overflowY = opts.overflow[2];
      });
    } // Implement show/hide animations

    propTween = false;

    for (prop in orig) {
      // General show/hide setup for this element animation
      if (!propTween) {
        if (dataShow) {
          if ('hidden' in dataShow) {
            hidden = dataShow.hidden;
          }
        } else {
          dataShow = dataPriv.access(elem, 'fxshow', {
            display: restoreDisplay,
          });
        } // Store hidden/visible for toggle so `.stop().toggle()` "reverses"

        if (toggle) {
          dataShow.hidden = !hidden;
        } // Show elements before animating them

        if (hidden) {
          showHide([elem], true);
        }
        /* eslint-disable no-loop-func */

        anim.done(function () {
          /* eslint-enable no-loop-func */
          // The final step of a "hide" animation is actually hiding the element
          if (!hidden) {
            showHide([elem]);
          }

          dataPriv.remove(elem, 'fxshow');

          for (prop in orig) {
            jQuery.style(elem, prop, orig[prop]);
          }
        });
      } // Per-property setup

      propTween = createTween(hidden ? dataShow[prop] : 0, prop, anim);

      if (!(prop in dataShow)) {
        dataShow[prop] = propTween.start;

        if (hidden) {
          propTween.end = propTween.start;
          propTween.start = 0;
        }
      }
    }
  }

  function propFilter(props, specialEasing) {
    var index, name, easing, value, hooks; // camelCase, specialEasing and expand cssHook pass

    for (index in props) {
      name = camelCase(index);
      easing = specialEasing[name];
      value = props[index];

      if (Array.isArray(value)) {
        easing = value[1];
        value = props[index] = value[0];
      }

      if (index !== name) {
        props[name] = value;
        delete props[index];
      }

      hooks = jQuery.cssHooks[name];

      if (hooks && 'expand' in hooks) {
        value = hooks.expand(value);
        delete props[name]; // Not quite $.extend, this won't overwrite existing keys.
        // Reusing 'index' because we have the correct "name"

        for (index in value) {
          if (!(index in props)) {
            props[index] = value[index];
            specialEasing[index] = easing;
          }
        }
      } else {
        specialEasing[name] = easing;
      }
    }
  }

  function Animation(elem, properties, options) {
    var result,
      stopped,
      index = 0,
      length = Animation.prefilters.length,
      deferred = jQuery.Deferred().always(function () {
        // Don't match elem in the :animated selector
        delete tick.elem;
      }),
      tick = function tick() {
        if (stopped) {
          return false;
        }

        var currentTime = fxNow || createFxNow(),
          remaining = Math.max(0, animation.startTime + animation.duration - currentTime),
          // Support: Android 2.3 only
          // Archaic crash bug won't allow us to use `1 - ( 0.5 || 0 )` (trac-12497)
          temp = remaining / animation.duration || 0,
          percent = 1 - temp,
          index = 0,
          length = animation.tweens.length;

        for (; index < length; index++) {
          animation.tweens[index].run(percent);
        }

        deferred.notifyWith(elem, [animation, percent, remaining]); // If there's more to do, yield

        if (percent < 1 && length) {
          return remaining;
        } // If this was an empty animation, synthesize a final progress notification

        if (!length) {
          deferred.notifyWith(elem, [animation, 1, 0]);
        } // Resolve the animation and report its conclusion

        deferred.resolveWith(elem, [animation]);
        return false;
      },
      animation = deferred.promise({
        elem: elem,
        props: jQuery.extend({}, properties),
        opts: jQuery.extend(
          true,
          {
            specialEasing: {},
            easing: jQuery.easing._default,
          },
          options,
        ),
        originalProperties: properties,
        originalOptions: options,
        startTime: fxNow || createFxNow(),
        duration: options.duration,
        tweens: [],
        createTween: function createTween(prop, end) {
          var tween = jQuery.Tween(
            elem,
            animation.opts,
            prop,
            end,
            animation.opts.specialEasing[prop] || animation.opts.easing,
          );
          animation.tweens.push(tween);
          return tween;
        },
        stop: function stop(gotoEnd) {
          var index = 0,
            // If we are going to the end, we want to run all the tweens
            // otherwise we skip this part
            length = gotoEnd ? animation.tweens.length : 0;

          if (stopped) {
            return this;
          }

          stopped = true;

          for (; index < length; index++) {
            animation.tweens[index].run(1);
          } // Resolve when we played the last frame; otherwise, reject

          if (gotoEnd) {
            deferred.notifyWith(elem, [animation, 1, 0]);
            deferred.resolveWith(elem, [animation, gotoEnd]);
          } else {
            deferred.rejectWith(elem, [animation, gotoEnd]);
          }

          return this;
        },
      }),
      props = animation.props;

    propFilter(props, animation.opts.specialEasing);

    for (; index < length; index++) {
      result = Animation.prefilters[index].call(animation, elem, props, animation.opts);

      if (result) {
        if (isFunction(result.stop)) {
          jQuery._queueHooks(animation.elem, animation.opts.queue).stop = result.stop.bind(result);
        }

        return result;
      }
    }

    jQuery.map(props, createTween, animation);

    if (isFunction(animation.opts.start)) {
      animation.opts.start.call(elem, animation);
    } // Attach callbacks from options

    animation
      .progress(animation.opts.progress)
      .done(animation.opts.done, animation.opts.complete)
      .fail(animation.opts.fail)
      .always(animation.opts.always);
    jQuery.fx.timer(
      jQuery.extend(tick, {
        elem: elem,
        anim: animation,
        queue: animation.opts.queue,
      }),
    );
    return animation;
  }

  jQuery.Animation = jQuery.extend(Animation, {
    tweeners: {
      '*': [
        function (prop, value) {
          var tween = this.createTween(prop, value);
          adjustCSS(tween.elem, prop, rcssNum.exec(value), tween);
          return tween;
        },
      ],
    },
    tweener: function tweener(props, callback) {
      if (isFunction(props)) {
        callback = props;
        props = ['*'];
      } else {
        props = props.match(rnothtmlwhite);
      }

      var prop,
        index = 0,
        length = props.length;

      for (; index < length; index++) {
        prop = props[index];
        Animation.tweeners[prop] = Animation.tweeners[prop] || [];
        Animation.tweeners[prop].unshift(callback);
      }
    },
    prefilters: [defaultPrefilter],
    prefilter: function prefilter(callback, prepend) {
      if (prepend) {
        Animation.prefilters.unshift(callback);
      } else {
        Animation.prefilters.push(callback);
      }
    },
  });

  jQuery.speed = function (speed, easing, fn) {
    var opt =
      speed && _typeof(speed) === 'object'
        ? jQuery.extend({}, speed)
        : {
            complete: fn || (!fn && easing) || (isFunction(speed) && speed),
            duration: speed,
            easing: (fn && easing) || (easing && !isFunction(easing) && easing),
          }; // Go to the end state if fx are off

    if (jQuery.fx.off) {
      opt.duration = 0;
    } else {
      if (typeof opt.duration !== 'number') {
        if (opt.duration in jQuery.fx.speeds) {
          opt.duration = jQuery.fx.speeds[opt.duration];
        } else {
          opt.duration = jQuery.fx.speeds._default;
        }
      }
    } // Normalize opt.queue - true/undefined/null -> "fx"

    if (opt.queue == null || opt.queue === true) {
      opt.queue = 'fx';
    } // Queueing

    opt.old = opt.complete;

    opt.complete = function () {
      if (isFunction(opt.old)) {
        opt.old.call(this);
      }

      if (opt.queue) {
        jQuery.dequeue(this, opt.queue);
      }
    };

    return opt;
  };

  jQuery.fn.extend({
    fadeTo: function fadeTo(speed, to, easing, callback) {
      // Show any hidden elements after setting opacity to 0
      return this.filter(isHiddenWithinTree)
        .css('opacity', 0)
        .show() // Animate to the value specified
        .end()
        .animate(
          {
            opacity: to,
          },
          speed,
          easing,
          callback,
        );
    },
    animate: function animate(prop, speed, easing, callback) {
      var empty = jQuery.isEmptyObject(prop),
        optall = jQuery.speed(speed, easing, callback),
        doAnimation = function doAnimation() {
          // Operate on a copy of prop so per-property easing won't be lost
          var anim = Animation(this, jQuery.extend({}, prop), optall); // Empty animations, or finishing resolves immediately

          if (empty || dataPriv.get(this, 'finish')) {
            anim.stop(true);
          }
        };

      doAnimation.finish = doAnimation;
      return empty || optall.queue === false ? this.each(doAnimation) : this.queue(optall.queue, doAnimation);
    },
    stop: function stop(type, clearQueue, gotoEnd) {
      var stopQueue = function stopQueue(hooks) {
        var stop = hooks.stop;
        delete hooks.stop;
        stop(gotoEnd);
      };

      if (typeof type !== 'string') {
        gotoEnd = clearQueue;
        clearQueue = type;
        type = undefined;
      }

      if (clearQueue) {
        this.queue(type || 'fx', []);
      }

      return this.each(function () {
        var dequeue = true,
          index = type != null && type + 'queueHooks',
          timers = jQuery.timers,
          data = dataPriv.get(this);

        if (index) {
          if (data[index] && data[index].stop) {
            stopQueue(data[index]);
          }
        } else {
          for (index in data) {
            if (data[index] && data[index].stop && rrun.test(index)) {
              stopQueue(data[index]);
            }
          }
        }

        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && (type == null || timers[index].queue === type)) {
            timers[index].anim.stop(gotoEnd);
            dequeue = false;
            timers.splice(index, 1);
          }
        } // Start the next in the queue if the last step wasn't forced.
        // Timers currently will call their complete callbacks, which
        // will dequeue but only if they were gotoEnd.

        if (dequeue || !gotoEnd) {
          jQuery.dequeue(this, type);
        }
      });
    },
    finish: function finish(type) {
      if (type !== false) {
        type = type || 'fx';
      }

      return this.each(function () {
        var index,
          data = dataPriv.get(this),
          queue = data[type + 'queue'],
          hooks = data[type + 'queueHooks'],
          timers = jQuery.timers,
          length = queue ? queue.length : 0; // Enable finishing flag on private data

        data.finish = true; // Empty the queue first

        jQuery.queue(this, type, []);

        if (hooks && hooks.stop) {
          hooks.stop.call(this, true);
        } // Look for any active animations, and finish them

        for (index = timers.length; index--; ) {
          if (timers[index].elem === this && timers[index].queue === type) {
            timers[index].anim.stop(true);
            timers.splice(index, 1);
          }
        } // Look for any animations in the old queue and finish them

        for (index = 0; index < length; index++) {
          if (queue[index] && queue[index].finish) {
            queue[index].finish.call(this);
          }
        } // Turn off finishing flag

        delete data.finish;
      });
    },
  });
  jQuery.each(['toggle', 'show', 'hide'], function (_i, name) {
    var cssFn = jQuery.fn[name];

    jQuery.fn[name] = function (speed, easing, callback) {
      return speed == null || typeof speed === 'boolean'
        ? cssFn.apply(this, arguments)
        : this.animate(genFx(name, true), speed, easing, callback);
    };
  }); // Generate shortcuts for custom animations

  jQuery.each(
    {
      slideDown: genFx('show'),
      slideUp: genFx('hide'),
      slideToggle: genFx('toggle'),
      fadeIn: {
        opacity: 'show',
      },
      fadeOut: {
        opacity: 'hide',
      },
      fadeToggle: {
        opacity: 'toggle',
      },
    },
    function (name, props) {
      jQuery.fn[name] = function (speed, easing, callback) {
        return this.animate(props, speed, easing, callback);
      };
    },
  );
  jQuery.timers = [];

  jQuery.fx.tick = function () {
    var timer,
      i = 0,
      timers = jQuery.timers;
    fxNow = Date.now();

    for (; i < timers.length; i++) {
      timer = timers[i]; // Run the timer and safely remove it when done (allowing for external removal)

      if (!timer() && timers[i] === timer) {
        timers.splice(i--, 1);
      }
    }

    if (!timers.length) {
      jQuery.fx.stop();
    }

    fxNow = undefined;
  };

  jQuery.fx.timer = function (timer) {
    jQuery.timers.push(timer);
    jQuery.fx.start();
  };

  jQuery.fx.interval = 13;

  jQuery.fx.start = function () {
    if (inProgress) {
      return;
    }

    inProgress = true;
    schedule();
  };

  jQuery.fx.stop = function () {
    inProgress = null;
  };

  jQuery.fx.speeds = {
    slow: 600,
    fast: 200,
    // Default speed
    _default: 400,
  }; // Based off of the plugin by Clint Helfers, with permission.

  jQuery.fn.delay = function (time, type) {
    time = jQuery.fx ? jQuery.fx.speeds[time] || time : time;
    type = type || 'fx';
    return this.queue(type, function (next, hooks) {
      var timeout = window.setTimeout(next, time);

      hooks.stop = function () {
        window.clearTimeout(timeout);
      };
    });
  };

  (function () {
    var input = document.createElement('input'),
      select = document.createElement('select'),
      opt = select.appendChild(document.createElement('option'));
    input.type = 'checkbox'; // Support: Android <=4.3 only
    // Default value for a checkbox should be "on"

    support.checkOn = input.value !== ''; // Support: IE <=11 only
    // Must access selectedIndex to make default options select

    support.optSelected = opt.selected; // Support: IE <=11 only
    // An input loses its value after becoming a radio

    input = document.createElement('input');
    input.value = 't';
    input.type = 'radio';
    support.radioValue = input.value === 't';
  })();

  var boolHook,
    attrHandle = jQuery.expr.attrHandle;
  jQuery.fn.extend({
    attr: function attr(name, value) {
      return access(this, jQuery.attr, name, value, arguments.length > 1);
    },
    removeAttr: function removeAttr(name) {
      return this.each(function () {
        jQuery.removeAttr(this, name);
      });
    },
  });
  jQuery.extend({
    attr: function attr(elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType; // Don't get/set attributes on text, comment and attribute nodes

      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      } // Fallback to prop when attributes are not supported

      if (typeof elem.getAttribute === 'undefined') {
        return jQuery.prop(elem, name, value);
      } // Attribute hooks are determined by the lowercase version
      // Grab necessary hook if one is defined

      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        hooks = jQuery.attrHooks[name.toLowerCase()] || (jQuery.expr.match.bool.test(name) ? boolHook : undefined);
      }

      if (value !== undefined) {
        if (value === null) {
          jQuery.removeAttr(elem, name);
          return;
        }

        if (hooks && 'set' in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }

        elem.setAttribute(name, value + '');
        return value;
      }

      if (hooks && 'get' in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }

      ret = jQuery.find.attr(elem, name); // Non-existent attributes return null, we normalize to undefined

      return ret == null ? undefined : ret;
    },
    attrHooks: {
      type: {
        set: function set(elem, value) {
          if (!support.radioValue && value === 'radio' && nodeName(elem, 'input')) {
            var val = elem.value;
            elem.setAttribute('type', value);

            if (val) {
              elem.value = val;
            }

            return value;
          }
        },
      },
    },
    removeAttr: function removeAttr(elem, value) {
      var name,
        i = 0,
        // Attribute names can contain non-HTML whitespace characters
        // https://html.spec.whatwg.org/multipage/syntax.html#attributes-2
        attrNames = value && value.match(rnothtmlwhite);

      if (attrNames && elem.nodeType === 1) {
        while ((name = attrNames[i++])) {
          elem.removeAttribute(name);
        }
      }
    },
  }); // Hooks for boolean attributes

  boolHook = {
    set: function set(elem, value, name) {
      if (value === false) {
        // Remove boolean attributes when set to false
        jQuery.removeAttr(elem, name);
      } else {
        elem.setAttribute(name, name);
      }

      return name;
    },
  };
  jQuery.each(jQuery.expr.match.bool.source.match(/\w+/g), function (_i, name) {
    var getter = attrHandle[name] || jQuery.find.attr;

    attrHandle[name] = function (elem, name, isXML) {
      var ret,
        handle,
        lowercaseName = name.toLowerCase();

      if (!isXML) {
        // Avoid an infinite loop by temporarily removing this function from the getter
        handle = attrHandle[lowercaseName];
        attrHandle[lowercaseName] = ret;
        ret = getter(elem, name, isXML) != null ? lowercaseName : null;
        attrHandle[lowercaseName] = handle;
      }

      return ret;
    };
  });
  var rfocusable = /^(?:input|select|textarea|button)$/i,
    rclickable = /^(?:a|area)$/i;
  jQuery.fn.extend({
    prop: function prop(name, value) {
      return access(this, jQuery.prop, name, value, arguments.length > 1);
    },
    removeProp: function removeProp(name) {
      return this.each(function () {
        delete this[jQuery.propFix[name] || name];
      });
    },
  });
  jQuery.extend({
    prop: function prop(elem, name, value) {
      var ret,
        hooks,
        nType = elem.nodeType; // Don't get/set properties on text, comment and attribute nodes

      if (nType === 3 || nType === 8 || nType === 2) {
        return;
      }

      if (nType !== 1 || !jQuery.isXMLDoc(elem)) {
        // Fix name and attach hooks
        name = jQuery.propFix[name] || name;
        hooks = jQuery.propHooks[name];
      }

      if (value !== undefined) {
        if (hooks && 'set' in hooks && (ret = hooks.set(elem, value, name)) !== undefined) {
          return ret;
        }

        return (elem[name] = value);
      }

      if (hooks && 'get' in hooks && (ret = hooks.get(elem, name)) !== null) {
        return ret;
      }

      return elem[name];
    },
    propHooks: {
      tabIndex: {
        get: function get(elem) {
          // Support: IE <=9 - 11 only
          // elem.tabIndex doesn't always return the
          // correct value when it hasn't been explicitly set
          // Use proper attribute retrieval (trac-12072)
          var tabindex = jQuery.find.attr(elem, 'tabindex');

          if (tabindex) {
            return parseInt(tabindex, 10);
          }

          if (rfocusable.test(elem.nodeName) || (rclickable.test(elem.nodeName) && elem.href)) {
            return 0;
          }

          return -1;
        },
      },
    },
    propFix: {
      for: 'htmlFor',
      class: 'className',
    },
  }); // Support: IE <=11 only
  // Accessing the selectedIndex property
  // forces the browser to respect setting selected
  // on the option
  // The getter ensures a default option is selected
  // when in an optgroup
  // eslint rule "no-unused-expressions" is disabled for this code
  // since it considers such accessions noop

  if (!support.optSelected) {
    jQuery.propHooks.selected = {
      get: function get(elem) {
        /* eslint no-unused-expressions: "off" */
        var parent = elem.parentNode;

        if (parent && parent.parentNode) {
          parent.parentNode.selectedIndex;
        }

        return null;
      },
      set: function set(elem) {
        /* eslint no-unused-expressions: "off" */
        var parent = elem.parentNode;

        if (parent) {
          parent.selectedIndex;

          if (parent.parentNode) {
            parent.parentNode.selectedIndex;
          }
        }
      },
    };
  }

  jQuery.each(
    [
      'tabIndex',
      'readOnly',
      'maxLength',
      'cellSpacing',
      'cellPadding',
      'rowSpan',
      'colSpan',
      'useMap',
      'frameBorder',
      'contentEditable',
    ],
    function () {
      jQuery.propFix[this.toLowerCase()] = this;
    },
  ); // Strip and collapse whitespace according to HTML spec
  // https://infra.spec.whatwg.org/#strip-and-collapse-ascii-whitespace

  function stripAndCollapse(value) {
    var tokens = value.match(rnothtmlwhite) || [];
    return tokens.join(' ');
  }

  function getClass(elem) {
    return (elem.getAttribute && elem.getAttribute('class')) || '';
  }

  function classesToArray(value) {
    if (Array.isArray(value)) {
      return value;
    }

    if (typeof value === 'string') {
      return value.match(rnothtmlwhite) || [];
    }

    return [];
  }

  jQuery.fn.extend({
    addClass: function addClass(value) {
      var classNames, cur, curValue, className, i, finalValue;

      if (isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).addClass(value.call(this, j, getClass(this)));
        });
      }

      classNames = classesToArray(value);

      if (classNames.length) {
        return this.each(function () {
          curValue = getClass(this);
          cur = this.nodeType === 1 && ' ' + stripAndCollapse(curValue) + ' ';

          if (cur) {
            for (i = 0; i < classNames.length; i++) {
              className = classNames[i];

              if (cur.indexOf(' ' + className + ' ') < 0) {
                cur += className + ' ';
              }
            } // Only assign if different to avoid unneeded rendering.

            finalValue = stripAndCollapse(cur);

            if (curValue !== finalValue) {
              this.setAttribute('class', finalValue);
            }
          }
        });
      }

      return this;
    },
    removeClass: function removeClass(value) {
      var classNames, cur, curValue, className, i, finalValue;

      if (isFunction(value)) {
        return this.each(function (j) {
          jQuery(this).removeClass(value.call(this, j, getClass(this)));
        });
      }

      if (!arguments.length) {
        return this.attr('class', '');
      }

      classNames = classesToArray(value);

      if (classNames.length) {
        return this.each(function () {
          curValue = getClass(this); // This expression is here for better compressibility (see addClass)

          cur = this.nodeType === 1 && ' ' + stripAndCollapse(curValue) + ' ';

          if (cur) {
            for (i = 0; i < classNames.length; i++) {
              className = classNames[i]; // Remove *all* instances

              while (cur.indexOf(' ' + className + ' ') > -1) {
                cur = cur.replace(' ' + className + ' ', ' ');
              }
            } // Only assign if different to avoid unneeded rendering.

            finalValue = stripAndCollapse(cur);

            if (curValue !== finalValue) {
              this.setAttribute('class', finalValue);
            }
          }
        });
      }

      return this;
    },
    toggleClass: function toggleClass(value, stateVal) {
      var classNames,
        className,
        i,
        self,
        type = _typeof(value),
        isValidValue = type === 'string' || Array.isArray(value);

      if (isFunction(value)) {
        return this.each(function (i) {
          jQuery(this).toggleClass(value.call(this, i, getClass(this), stateVal), stateVal);
        });
      }

      if (typeof stateVal === 'boolean' && isValidValue) {
        return stateVal ? this.addClass(value) : this.removeClass(value);
      }

      classNames = classesToArray(value);
      return this.each(function () {
        if (isValidValue) {
          // Toggle individual class names
          self = jQuery(this);

          for (i = 0; i < classNames.length; i++) {
            className = classNames[i]; // Check each className given, space separated list

            if (self.hasClass(className)) {
              self.removeClass(className);
            } else {
              self.addClass(className);
            }
          } // Toggle whole class name
        } else if (value === undefined || type === 'boolean') {
          className = getClass(this);

          if (className) {
            // Store className if set
            dataPriv.set(this, '__className__', className);
          } // If the element has a class name or if we're passed `false`,
          // then remove the whole classname (if there was one, the above saved it).
          // Otherwise bring back whatever was previously saved (if anything),
          // falling back to the empty string if nothing was stored.

          if (this.setAttribute) {
            this.setAttribute('class', className || value === false ? '' : dataPriv.get(this, '__className__') || '');
          }
        }
      });
    },
    hasClass: function hasClass(selector) {
      var className,
        elem,
        i = 0;
      className = ' ' + selector + ' ';

      while ((elem = this[i++])) {
        if (elem.nodeType === 1 && (' ' + stripAndCollapse(getClass(elem)) + ' ').indexOf(className) > -1) {
          return true;
        }
      }

      return false;
    },
  });
  var rreturn = /\r/g;
  jQuery.fn.extend({
    val: function val(value) {
      var hooks,
        ret,
        valueIsFunction,
        elem = this[0];

      if (!arguments.length) {
        if (elem) {
          hooks = jQuery.valHooks[elem.type] || jQuery.valHooks[elem.nodeName.toLowerCase()];

          if (hooks && 'get' in hooks && (ret = hooks.get(elem, 'value')) !== undefined) {
            return ret;
          }

          ret = elem.value; // Handle most common string cases

          if (typeof ret === 'string') {
            return ret.replace(rreturn, '');
          } // Handle cases where value is null/undef or number

          return ret == null ? '' : ret;
        }

        return;
      }

      valueIsFunction = isFunction(value);
      return this.each(function (i) {
        var val;

        if (this.nodeType !== 1) {
          return;
        }

        if (valueIsFunction) {
          val = value.call(this, i, jQuery(this).val());
        } else {
          val = value;
        } // Treat null/undefined as ""; convert numbers to string

        if (val == null) {
          val = '';
        } else if (typeof val === 'number') {
          val += '';
        } else if (Array.isArray(val)) {
          val = jQuery.map(val, function (value) {
            return value == null ? '' : value + '';
          });
        }

        hooks = jQuery.valHooks[this.type] || jQuery.valHooks[this.nodeName.toLowerCase()]; // If set returns undefined, fall back to normal setting

        if (!hooks || !('set' in hooks) || hooks.set(this, val, 'value') === undefined) {
          this.value = val;
        }
      });
    },
  });
  jQuery.extend({
    valHooks: {
      option: {
        get: function get(elem) {
          var val = jQuery.find.attr(elem, 'value');
          return val != null
            ? val // Support: IE <=10 - 11 only
            : // option.text throws exceptions (trac-14686, trac-14858)
              // Strip and collapse whitespace
              // https://html.spec.whatwg.org/#strip-and-collapse-whitespace
              stripAndCollapse(jQuery.text(elem));
        },
      },
      select: {
        get: function get(elem) {
          var value,
            option,
            i,
            options = elem.options,
            index = elem.selectedIndex,
            one = elem.type === 'select-one',
            values = one ? null : [],
            max = one ? index + 1 : options.length;

          if (index < 0) {
            i = max;
          } else {
            i = one ? index : 0;
          } // Loop through all the selected options

          for (; i < max; i++) {
            option = options[i]; // Support: IE <=9 only
            // IE8-9 doesn't update selected after form reset (trac-2551)

            if (
              (option.selected || i === index) && // Don't return options that are disabled or in a disabled optgroup
              !option.disabled &&
              (!option.parentNode.disabled || !nodeName(option.parentNode, 'optgroup'))
            ) {
              // Get the specific value for the option
              value = jQuery(option).val(); // We don't need an array for one selects

              if (one) {
                return value;
              } // Multi-Selects return an array

              values.push(value);
            }
          }

          return values;
        },
        set: function set(elem, value) {
          var optionSet,
            option,
            options = elem.options,
            values = jQuery.makeArray(value),
            i = options.length;

          while (i--) {
            option = options[i];
            /* eslint-disable no-cond-assign */

            if ((option.selected = jQuery.inArray(jQuery.valHooks.option.get(option), values) > -1)) {
              optionSet = true;
            }
            /* eslint-enable no-cond-assign */
          } // Force browsers to behave consistently when non-matching value is set

          if (!optionSet) {
            elem.selectedIndex = -1;
          }

          return values;
        },
      },
    },
  }); // Radios and checkboxes getter/setter

  jQuery.each(['radio', 'checkbox'], function () {
    jQuery.valHooks[this] = {
      set: function set(elem, value) {
        if (Array.isArray(value)) {
          return (elem.checked = jQuery.inArray(jQuery(elem).val(), value) > -1);
        }
      },
    };

    if (!support.checkOn) {
      jQuery.valHooks[this].get = function (elem) {
        return elem.getAttribute('value') === null ? 'on' : elem.value;
      };
    }
  }); // Return jQuery for attributes-only inclusion

  support.focusin = 'onfocusin' in window;

  var rfocusMorph = /^(?:focusinfocus|focusoutblur)$/,
    stopPropagationCallback = function stopPropagationCallback(e) {
      e.stopPropagation();
    };

  jQuery.extend(jQuery.event, {
    trigger: function trigger(event, data, elem, onlyHandlers) {
      var i,
        cur,
        tmp,
        bubbleType,
        ontype,
        handle,
        special,
        lastElement,
        eventPath = [elem || document],
        type = hasOwn.call(event, 'type') ? event.type : event,
        namespaces = hasOwn.call(event, 'namespace') ? event.namespace.split('.') : [];
      cur = lastElement = tmp = elem = elem || document; // Don't do events on text and comment nodes

      if (elem.nodeType === 3 || elem.nodeType === 8) {
        return;
      } // focus/blur morphs to focusin/out; ensure we're not firing them right now

      if (rfocusMorph.test(type + jQuery.event.triggered)) {
        return;
      }

      if (type.indexOf('.') > -1) {
        // Namespaced trigger; create a regexp to match event type in handle()
        namespaces = type.split('.');
        type = namespaces.shift();
        namespaces.sort();
      }

      ontype = type.indexOf(':') < 0 && 'on' + type; // Caller can pass in a jQuery.Event object, Object, or just an event type string

      event = event[jQuery.expando] ? event : new jQuery.Event(type, _typeof(event) === 'object' && event); // Trigger bitmask: & 1 for native handlers; & 2 for jQuery (always true)

      event.isTrigger = onlyHandlers ? 2 : 3;
      event.namespace = namespaces.join('.');
      event.rnamespace = event.namespace ? new RegExp('(^|\\.)' + namespaces.join('\\.(?:.*\\.|)') + '(\\.|$)') : null; // Clean up the event in case it is being reused

      event.result = undefined;

      if (!event.target) {
        event.target = elem;
      } // Clone any incoming data and prepend the event, creating the handler arg list

      data = data == null ? [event] : jQuery.makeArray(data, [event]); // Allow special events to draw outside the lines

      special = jQuery.event.special[type] || {};

      if (!onlyHandlers && special.trigger && special.trigger.apply(elem, data) === false) {
        return;
      } // Determine event propagation path in advance, per W3C events spec (trac-9951)
      // Bubble up to document, then to window; watch for a global ownerDocument var (trac-9724)

      if (!onlyHandlers && !special.noBubble && !isWindow(elem)) {
        bubbleType = special.delegateType || type;

        if (!rfocusMorph.test(bubbleType + type)) {
          cur = cur.parentNode;
        }

        for (; cur; cur = cur.parentNode) {
          eventPath.push(cur);
          tmp = cur;
        } // Only add window if we got to document (e.g., not plain obj or detached DOM)

        if (tmp === (elem.ownerDocument || document)) {
          eventPath.push(tmp.defaultView || tmp.parentWindow || window);
        }
      } // Fire handlers on the event path

      i = 0;

      while ((cur = eventPath[i++]) && !event.isPropagationStopped()) {
        lastElement = cur;
        event.type = i > 1 ? bubbleType : special.bindType || type; // jQuery handler

        handle = (dataPriv.get(cur, 'events') || Object.create(null))[event.type] && dataPriv.get(cur, 'handle');

        if (handle) {
          handle.apply(cur, data);
        } // Native handler

        handle = ontype && cur[ontype];

        if (handle && handle.apply && acceptData(cur)) {
          event.result = handle.apply(cur, data);

          if (event.result === false) {
            event.preventDefault();
          }
        }
      }

      event.type = type; // If nobody prevented the default action, do it now

      if (!onlyHandlers && !event.isDefaultPrevented()) {
        if ((!special._default || special._default.apply(eventPath.pop(), data) === false) && acceptData(elem)) {
          // Call a native DOM method on the target with the same name as the event.
          // Don't do default actions on window, that's where global variables be (trac-6170)
          if (ontype && isFunction(elem[type]) && !isWindow(elem)) {
            // Don't re-trigger an onFOO event when we call its FOO() method
            tmp = elem[ontype];

            if (tmp) {
              elem[ontype] = null;
            } // Prevent re-triggering of the same event, since we already bubbled it above

            jQuery.event.triggered = type;

            if (event.isPropagationStopped()) {
              lastElement.addEventListener(type, stopPropagationCallback);
            }

            elem[type]();

            if (event.isPropagationStopped()) {
              lastElement.removeEventListener(type, stopPropagationCallback);
            }

            jQuery.event.triggered = undefined;

            if (tmp) {
              elem[ontype] = tmp;
            }
          }
        }
      }

      return event.result;
    },
    // Piggyback on a donor event to simulate a different one
    // Used only for `focus(in | out)` events
    simulate: function simulate(type, elem, event) {
      var e = jQuery.extend(new jQuery.Event(), event, {
        type: type,
        isSimulated: true,
      });
      jQuery.event.trigger(e, null, elem);
    },
  });
  jQuery.fn.extend({
    trigger: function trigger(type, data) {
      return this.each(function () {
        jQuery.event.trigger(type, data, this);
      });
    },
    triggerHandler: function triggerHandler(type, data) {
      var elem = this[0];

      if (elem) {
        return jQuery.event.trigger(type, data, elem, true);
      }
    },
  }); // Support: Firefox <=44
  // Firefox doesn't have focus(in | out) events
  // Related ticket - https://bugzilla.mozilla.org/show_bug.cgi?id=687787
  //
  // Support: Chrome <=48 - 49, Safari <=9.0 - 9.1
  // focus(in | out) events fire after focus & blur events,
  // which is spec violation - http://www.w3.org/TR/DOM-Level-3-Events/#events-focusevent-event-order
  // Related ticket - https://bugs.chromium.org/p/chromium/issues/detail?id=449857

  if (!support.focusin) {
    jQuery.each(
      {
        focus: 'focusin',
        blur: 'focusout',
      },
      function (orig, fix) {
        // Attach a single capturing handler on the document while someone wants focusin/focusout
        var handler = function handler(event) {
          jQuery.event.simulate(fix, event.target, jQuery.event.fix(event));
        };

        jQuery.event.special[fix] = {
          setup: function setup() {
            // Handle: regular nodes (via `this.ownerDocument`), window
            // (via `this.document`) & document (via `this`).
            var doc = this.ownerDocument || this.document || this,
              attaches = dataPriv.access(doc, fix);

            if (!attaches) {
              doc.addEventListener(orig, handler, true);
            }

            dataPriv.access(doc, fix, (attaches || 0) + 1);
          },
          teardown: function teardown() {
            var doc = this.ownerDocument || this.document || this,
              attaches = dataPriv.access(doc, fix) - 1;

            if (!attaches) {
              doc.removeEventListener(orig, handler, true);
              dataPriv.remove(doc, fix);
            } else {
              dataPriv.access(doc, fix, attaches);
            }
          },
        };
      },
    );
  }

  var location = window.location;
  var nonce = {
    guid: Date.now(),
  };
  var rquery = /\?/; // Cross-browser xml parsing

  jQuery.parseXML = function (data) {
    var xml, parserErrorElem;

    if (!data || typeof data !== 'string') {
      return null;
    } // Support: IE 9 - 11 only
    // IE throws on parseFromString with invalid input.

    try {
      xml = new window.DOMParser().parseFromString(data, 'text/xml');
    } catch (e) {}

    parserErrorElem = xml && xml.getElementsByTagName('parsererror')[0];

    if (!xml || parserErrorElem) {
      jQuery.error(
        'Invalid XML: ' +
          (parserErrorElem
            ? jQuery
                .map(parserErrorElem.childNodes, function (el) {
                  return el.textContent;
                })
                .join('\n')
            : data),
      );
    }

    return xml;
  };

  var rbracket = /\[\]$/,
    rCRLF = /\r?\n/g,
    rsubmitterTypes = /^(?:submit|button|image|reset|file)$/i,
    rsubmittable = /^(?:input|select|textarea|keygen)/i;

  function buildParams(prefix, obj, traditional, add) {
    var name;

    if (Array.isArray(obj)) {
      // Serialize array item.
      jQuery.each(obj, function (i, v) {
        if (traditional || rbracket.test(prefix)) {
          // Treat each array item as a scalar.
          add(prefix, v);
        } else {
          // Item is non-scalar (array or object), encode its numeric index.
          buildParams(prefix + '[' + (_typeof(v) === 'object' && v != null ? i : '') + ']', v, traditional, add);
        }
      });
    } else if (!traditional && toType(obj) === 'object') {
      // Serialize object item.
      for (name in obj) {
        buildParams(prefix + '[' + name + ']', obj[name], traditional, add);
      }
    } else {
      // Serialize scalar item.
      add(prefix, obj);
    }
  } // Serialize an array of form elements or a set of
  // key/values into a query string

  jQuery.param = function (a, traditional) {
    var prefix,
      s = [],
      add = function add(key, valueOrFunction) {
        // If value is a function, invoke it and use its return value
        var value = isFunction(valueOrFunction) ? valueOrFunction() : valueOrFunction;
        s[s.length] = encodeURIComponent(key) + '=' + encodeURIComponent(value == null ? '' : value);
      };

    if (a == null) {
      return '';
    } // If an array was passed in, assume that it is an array of form elements.

    if (Array.isArray(a) || (a.jquery && !jQuery.isPlainObject(a))) {
      // Serialize the form elements
      jQuery.each(a, function () {
        add(this.name, this.value);
      });
    } else {
      // If traditional, encode the "old" way (the way 1.3.2 or older
      // did it), otherwise encode params recursively.
      for (prefix in a) {
        buildParams(prefix, a[prefix], traditional, add);
      }
    } // Return the resulting serialization

    return s.join('&');
  };

  jQuery.fn.extend({
    serialize: function serialize() {
      return jQuery.param(this.serializeArray());
    },
    serializeArray: function serializeArray() {
      return this.map(function () {
        // Can add propHook for "elements" to filter or add form elements
        var elements = jQuery.prop(this, 'elements');
        return elements ? jQuery.makeArray(elements) : this;
      })
        .filter(function () {
          var type = this.type; // Use .is( ":disabled" ) so that fieldset[disabled] works

          return (
            this.name &&
            !jQuery(this).is(':disabled') &&
            rsubmittable.test(this.nodeName) &&
            !rsubmitterTypes.test(type) &&
            (this.checked || !rcheckableType.test(type))
          );
        })
        .map(function (_i, elem) {
          var val = jQuery(this).val();

          if (val == null) {
            return null;
          }

          if (Array.isArray(val)) {
            return jQuery.map(val, function (val) {
              return {
                name: elem.name,
                value: val.replace(rCRLF, '\r\n'),
              };
            });
          }

          return {
            name: elem.name,
            value: val.replace(rCRLF, '\r\n'),
          };
        })
        .get();
    },
  });
  var r20 = /%20/g,
    rhash = /#.*$/,
    rantiCache = /([?&])_=[^&]*/,
    rheaders = /^(.*?):[ \t]*([^\r\n]*)$/gm,
    // trac-7653, trac-8125, trac-8152: local protocol detection
    rlocalProtocol = /^(?:about|app|app-storage|.+-extension|file|res|widget):$/,
    rnoContent = /^(?:GET|HEAD)$/,
    rprotocol = /^\/\//,
    /* Prefilters
     * 1) They are useful to introduce custom dataTypes (see ajax/jsonp.js for an example)
     * 2) These are called:
     *    - BEFORE asking for a transport
     *    - AFTER param serialization (s.data is a string if s.processData is true)
     * 3) key is the dataType
     * 4) the catchall symbol "*" can be used
     * 5) execution will start with transport dataType and THEN continue down to "*" if needed
     */
    prefilters = {},
    /* Transports bindings
     * 1) key is the dataType
     * 2) the catchall symbol "*" can be used
     * 3) selection will start with transport dataType and THEN go to "*" if needed
     */
    transports = {},
    // Avoid comment-prolog char sequence (trac-10098); must appease lint and evade compression
    allTypes = '*/'.concat('*'),
    // Anchor tag for parsing the document origin
    originAnchor = document.createElement('a');
  originAnchor.href = location.href; // Base "constructor" for jQuery.ajaxPrefilter and jQuery.ajaxTransport

  function addToPrefiltersOrTransports(structure) {
    // dataTypeExpression is optional and defaults to "*"
    return function (dataTypeExpression, func) {
      if (typeof dataTypeExpression !== 'string') {
        func = dataTypeExpression;
        dataTypeExpression = '*';
      }

      var dataType,
        i = 0,
        dataTypes = dataTypeExpression.toLowerCase().match(rnothtmlwhite) || [];

      if (isFunction(func)) {
        // For each dataType in the dataTypeExpression
        while ((dataType = dataTypes[i++])) {
          // Prepend if requested
          if (dataType[0] === '+') {
            dataType = dataType.slice(1) || '*';
            (structure[dataType] = structure[dataType] || []).unshift(func); // Otherwise append
          } else {
            (structure[dataType] = structure[dataType] || []).push(func);
          }
        }
      }
    };
  } // Base inspection function for prefilters and transports

  function inspectPrefiltersOrTransports(structure, options, originalOptions, jqXHR) {
    var inspected = {},
      seekingTransport = structure === transports;

    function inspect(dataType) {
      var selected;
      inspected[dataType] = true;
      jQuery.each(structure[dataType] || [], function (_, prefilterOrFactory) {
        var dataTypeOrTransport = prefilterOrFactory(options, originalOptions, jqXHR);

        if (typeof dataTypeOrTransport === 'string' && !seekingTransport && !inspected[dataTypeOrTransport]) {
          options.dataTypes.unshift(dataTypeOrTransport);
          inspect(dataTypeOrTransport);
          return false;
        } else if (seekingTransport) {
          return !(selected = dataTypeOrTransport);
        }
      });
      return selected;
    }

    return inspect(options.dataTypes[0]) || (!inspected['*'] && inspect('*'));
  } // A special extend for ajax options
  // that takes "flat" options (not to be deep extended)
  // Fixes trac-9887

  function ajaxExtend(target, src) {
    var key,
      deep,
      flatOptions = jQuery.ajaxSettings.flatOptions || {};

    for (key in src) {
      if (src[key] !== undefined) {
        (flatOptions[key] ? target : deep || (deep = {}))[key] = src[key];
      }
    }

    if (deep) {
      jQuery.extend(true, target, deep);
    }

    return target;
  }
  /* Handles responses to an ajax request:
   * - finds the right dataType (mediates between content-type and expected dataType)
   * - returns the corresponding response
   */

  function ajaxHandleResponses(s, jqXHR, responses) {
    var ct,
      type,
      finalDataType,
      firstDataType,
      contents = s.contents,
      dataTypes = s.dataTypes; // Remove auto dataType and get content-type in the process

    while (dataTypes[0] === '*') {
      dataTypes.shift();

      if (ct === undefined) {
        ct = s.mimeType || jqXHR.getResponseHeader('Content-Type');
      }
    } // Check if we're dealing with a known content-type

    if (ct) {
      for (type in contents) {
        if (contents[type] && contents[type].test(ct)) {
          dataTypes.unshift(type);
          break;
        }
      }
    } // Check to see if we have a response for the expected dataType

    if (dataTypes[0] in responses) {
      finalDataType = dataTypes[0];
    } else {
      // Try convertible dataTypes
      for (type in responses) {
        if (!dataTypes[0] || s.converters[type + ' ' + dataTypes[0]]) {
          finalDataType = type;
          break;
        }

        if (!firstDataType) {
          firstDataType = type;
        }
      } // Or just use first one

      finalDataType = finalDataType || firstDataType;
    } // If we found a dataType
    // We add the dataType to the list if needed
    // and return the corresponding response

    if (finalDataType) {
      if (finalDataType !== dataTypes[0]) {
        dataTypes.unshift(finalDataType);
      }

      return responses[finalDataType];
    }
  }
  /* Chain conversions given the request and the original response
   * Also sets the responseXXX fields on the jqXHR instance
   */

  function ajaxConvert(s, response, jqXHR, isSuccess) {
    var conv2,
      current,
      conv,
      tmp,
      prev,
      converters = {},
      // Work with a copy of dataTypes in case we need to modify it for conversion
      dataTypes = s.dataTypes.slice(); // Create converters map with lowercased keys

    if (dataTypes[1]) {
      for (conv in s.converters) {
        converters[conv.toLowerCase()] = s.converters[conv];
      }
    }

    current = dataTypes.shift(); // Convert to each sequential dataType

    while (current) {
      if (s.responseFields[current]) {
        jqXHR[s.responseFields[current]] = response;
      } // Apply the dataFilter if provided

      if (!prev && isSuccess && s.dataFilter) {
        response = s.dataFilter(response, s.dataType);
      }

      prev = current;
      current = dataTypes.shift();

      if (current) {
        // There's only work to do if current dataType is non-auto
        if (current === '*') {
          current = prev; // Convert response if prev dataType is non-auto and differs from current
        } else if (prev !== '*' && prev !== current) {
          // Seek a direct converter
          conv = converters[prev + ' ' + current] || converters['* ' + current]; // If none found, seek a pair

          if (!conv) {
            for (conv2 in converters) {
              // If conv2 outputs current
              tmp = conv2.split(' ');

              if (tmp[1] === current) {
                // If prev can be converted to accepted input
                conv = converters[prev + ' ' + tmp[0]] || converters['* ' + tmp[0]];

                if (conv) {
                  // Condense equivalence converters
                  if (conv === true) {
                    conv = converters[conv2]; // Otherwise, insert the intermediate dataType
                  } else if (converters[conv2] !== true) {
                    current = tmp[0];
                    dataTypes.unshift(tmp[1]);
                  }

                  break;
                }
              }
            }
          } // Apply converter (if not an equivalence)

          if (conv !== true) {
            // Unless errors are allowed to bubble, catch and return them
            if (conv && s.throws) {
              response = conv(response);
            } else {
              try {
                response = conv(response);
              } catch (e) {
                return {
                  state: 'parsererror',
                  error: conv ? e : 'No conversion from ' + prev + ' to ' + current,
                };
              }
            }
          }
        }
      }
    }

    return {
      state: 'success',
      data: response,
    };
  }

  jQuery.extend({
    // Counter for holding the number of active queries
    active: 0,
    // Last-Modified header cache for next request
    lastModified: {},
    etag: {},
    ajaxSettings: {
      url: location.href,
      type: 'GET',
      isLocal: rlocalProtocol.test(location.protocol),
      global: true,
      processData: true,
      async: true,
      contentType: 'application/x-www-form-urlencoded; charset=UTF-8',

      /*
      timeout: 0,
      data: null,
      dataType: null,
      username: null,
      password: null,
      cache: null,
      throws: false,
      traditional: false,
      headers: {},
      */
      accepts: {
        '*': allTypes,
        text: 'text/plain',
        html: 'text/html',
        xml: 'application/xml, text/xml',
        json: 'application/json, text/javascript',
      },
      contents: {
        xml: /\bxml\b/,
        html: /\bhtml/,
        json: /\bjson\b/,
      },
      responseFields: {
        xml: 'responseXML',
        text: 'responseText',
        json: 'responseJSON',
      },
      // Data converters
      // Keys separate source (or catchall "*") and destination types with a single space
      converters: {
        // Convert anything to text
        '* text': String,
        // Text to html (true = no transformation)
        'text html': true,
        // Evaluate text as a json expression
        'text json': JSON.parse,
        // Parse text as xml
        'text xml': jQuery.parseXML,
      },
      // For options that shouldn't be deep extended:
      // you can add your own custom options here if
      // and when you create one that shouldn't be
      // deep extended (see ajaxExtend)
      flatOptions: {
        url: true,
        context: true,
      },
    },
    // Creates a full fledged settings object into target
    // with both ajaxSettings and settings fields.
    // If target is omitted, writes into ajaxSettings.
    ajaxSetup: function ajaxSetup(target, settings) {
      return settings // Building a settings object
        ? ajaxExtend(ajaxExtend(target, jQuery.ajaxSettings), settings) // Extending ajaxSettings
        : ajaxExtend(jQuery.ajaxSettings, target);
    },
    ajaxPrefilter: addToPrefiltersOrTransports(prefilters),
    ajaxTransport: addToPrefiltersOrTransports(transports),
    // Main method
    ajax: function ajax(url, options) {
      // If url is an object, simulate pre-1.5 signature
      if (_typeof(url) === 'object') {
        options = url;
        url = undefined;
      } // Force options to be an object

      options = options || {};

      var transport,
        // URL without anti-cache param
        cacheURL,
        // Response headers
        responseHeadersString,
        responseHeaders,
        // timeout handle
        timeoutTimer,
        // Url cleanup var
        urlAnchor,
        // Request state (becomes false upon send and true upon completion)
        completed,
        // To know if global events are to be dispatched
        fireGlobals,
        // Loop variable
        i,
        // uncached part of the url
        uncached,
        // Create the final options object
        s = jQuery.ajaxSetup({}, options),
        // Callbacks context
        callbackContext = s.context || s,
        // Context for global events is callbackContext if it is a DOM node or jQuery collection
        globalEventContext =
          s.context && (callbackContext.nodeType || callbackContext.jquery) ? jQuery(callbackContext) : jQuery.event,
        // Deferreds
        deferred = jQuery.Deferred(),
        completeDeferred = jQuery.Callbacks('once memory'),
        // Status-dependent callbacks
        _statusCode = s.statusCode || {},
        // Headers (they are sent all at once)
        requestHeaders = {},
        requestHeadersNames = {},
        // Default abort message
        strAbort = 'canceled',
        // Fake xhr
        jqXHR = {
          readyState: 0,
          // Builds headers hashtable if needed
          getResponseHeader: function getResponseHeader(key) {
            var match;

            if (completed) {
              if (!responseHeaders) {
                responseHeaders = {};

                while ((match = rheaders.exec(responseHeadersString))) {
                  responseHeaders[match[1].toLowerCase() + ' '] = (
                    responseHeaders[match[1].toLowerCase() + ' '] || []
                  ).concat(match[2]);
                }
              }

              match = responseHeaders[key.toLowerCase() + ' '];
            }

            return match == null ? null : match.join(', ');
          },
          // Raw string
          getAllResponseHeaders: function getAllResponseHeaders() {
            return completed ? responseHeadersString : null;
          },
          // Caches the header
          setRequestHeader: function setRequestHeader(name, value) {
            if (completed == null) {
              name = requestHeadersNames[name.toLowerCase()] = requestHeadersNames[name.toLowerCase()] || name;
              requestHeaders[name] = value;
            }

            return this;
          },
          // Overrides response content-type header
          overrideMimeType: function overrideMimeType(type) {
            if (completed == null) {
              s.mimeType = type;
            }

            return this;
          },
          // Status-dependent callbacks
          statusCode: function statusCode(map) {
            var code;

            if (map) {
              if (completed) {
                // Execute the appropriate callbacks
                jqXHR.always(map[jqXHR.status]);
              } else {
                // Lazy-add the new callbacks in a way that preserves old ones
                for (code in map) {
                  _statusCode[code] = [_statusCode[code], map[code]];
                }
              }
            }

            return this;
          },
          // Cancel the request
          abort: function abort(statusText) {
            var finalText = statusText || strAbort;

            if (transport) {
              transport.abort(finalText);
            }

            done(0, finalText);
            return this;
          },
        }; // Attach deferreds

      deferred.promise(jqXHR); // Add protocol if not provided (prefilters might expect it)
      // Handle falsy url in the settings object (trac-10093: consistency with old signature)
      // We also use the url parameter if available

      s.url = ((url || s.url || location.href) + '').replace(rprotocol, location.protocol + '//'); // Alias method option to type as per ticket trac-12004

      s.type = options.method || options.type || s.method || s.type; // Extract dataTypes list

      s.dataTypes = (s.dataType || '*').toLowerCase().match(rnothtmlwhite) || ['']; // A cross-domain request is in order when the origin doesn't match the current origin.

      if (s.crossDomain == null) {
        urlAnchor = document.createElement('a'); // Support: IE <=8 - 11, Edge 12 - 15
        // IE throws exception on accessing the href property if url is malformed,
        // e.g. http://example.com:80x/

        try {
          urlAnchor.href = s.url; // Support: IE <=8 - 11 only
          // Anchor's host property isn't correctly set when s.url is relative

          urlAnchor.href = urlAnchor.href;
          s.crossDomain =
            originAnchor.protocol + '//' + originAnchor.host !== urlAnchor.protocol + '//' + urlAnchor.host;
        } catch (e) {
          // If there is an error parsing the URL, assume it is crossDomain,
          // it can be rejected by the transport if it is invalid
          s.crossDomain = true;
        }
      } // Convert data if not already a string

      if (s.data && s.processData && typeof s.data !== 'string') {
        s.data = jQuery.param(s.data, s.traditional);
      } // Apply prefilters

      inspectPrefiltersOrTransports(prefilters, s, options, jqXHR); // If request was aborted inside a prefilter, stop there

      if (completed) {
        return jqXHR;
      } // We can fire global events as of now if asked to
      // Don't fire events if jQuery.event is undefined in an AMD-usage scenario (trac-15118)

      fireGlobals = jQuery.event && s.global; // Watch for a new set of requests

      if (fireGlobals && jQuery.active++ === 0) {
        jQuery.event.trigger('ajaxStart');
      } // Uppercase the type

      s.type = s.type.toUpperCase(); // Determine if request has content

      s.hasContent = !rnoContent.test(s.type); // Save the URL in case we're toying with the If-Modified-Since
      // and/or If-None-Match header later on
      // Remove hash to simplify url manipulation

      cacheURL = s.url.replace(rhash, ''); // More options handling for requests with no content

      if (!s.hasContent) {
        // Remember the hash so we can put it back
        uncached = s.url.slice(cacheURL.length); // If data is available and should be processed, append data to url

        if (s.data && (s.processData || typeof s.data === 'string')) {
          cacheURL += (rquery.test(cacheURL) ? '&' : '?') + s.data; // trac-9682: remove data so that it's not used in an eventual retry

          delete s.data;
        } // Add or update anti-cache param if needed

        if (s.cache === false) {
          cacheURL = cacheURL.replace(rantiCache, '$1');
          uncached = (rquery.test(cacheURL) ? '&' : '?') + '_=' + nonce.guid++ + uncached;
        } // Put hash and anti-cache on the URL that will be requested (gh-1732)

        s.url = cacheURL + uncached; // Change '%20' to '+' if this is encoded form body content (gh-2658)
      } else if (s.data && s.processData && (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0) {
        s.data = s.data.replace(r20, '+');
      } // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.

      if (s.ifModified) {
        if (jQuery.lastModified[cacheURL]) {
          jqXHR.setRequestHeader('If-Modified-Since', jQuery.lastModified[cacheURL]);
        }

        if (jQuery.etag[cacheURL]) {
          jqXHR.setRequestHeader('If-None-Match', jQuery.etag[cacheURL]);
        }
      } // Set the correct header, if data is being sent

      if ((s.data && s.hasContent && s.contentType !== false) || options.contentType) {
        jqXHR.setRequestHeader('Content-Type', s.contentType);
      } // Set the Accepts header for the server, depending on the dataType

      jqXHR.setRequestHeader(
        'Accept',
        s.dataTypes[0] && s.accepts[s.dataTypes[0]]
          ? s.accepts[s.dataTypes[0]] + (s.dataTypes[0] !== '*' ? ', ' + allTypes + '; q=0.01' : '')
          : s.accepts['*'],
      ); // Check for headers option

      for (i in s.headers) {
        jqXHR.setRequestHeader(i, s.headers[i]);
      } // Allow custom headers/mimetypes and early abort

      if (s.beforeSend && (s.beforeSend.call(callbackContext, jqXHR, s) === false || completed)) {
        // Abort if not done already and return
        return jqXHR.abort();
      } // Aborting is no longer a cancellation

      strAbort = 'abort'; // Install callbacks on deferreds

      completeDeferred.add(s.complete);
      jqXHR.done(s.success);
      jqXHR.fail(s.error); // Get transport

      transport = inspectPrefiltersOrTransports(transports, s, options, jqXHR); // If no transport, we auto-abort

      if (!transport) {
        done(-1, 'No Transport');
      } else {
        jqXHR.readyState = 1; // Send global event

        if (fireGlobals) {
          globalEventContext.trigger('ajaxSend', [jqXHR, s]);
        } // If request was aborted inside ajaxSend, stop there

        if (completed) {
          return jqXHR;
        } // Timeout

        if (s.async && s.timeout > 0) {
          timeoutTimer = window.setTimeout(function () {
            jqXHR.abort('timeout');
          }, s.timeout);
        }

        try {
          completed = false;
          transport.send(requestHeaders, done);
        } catch (e) {
          // Rethrow post-completion exceptions
          if (completed) {
            throw e;
          } // Propagate others as results

          done(-1, e);
        }
      } // Callback for when everything is done

      function done(status, nativeStatusText, responses, headers) {
        var isSuccess,
          success,
          error,
          response,
          modified,
          statusText = nativeStatusText; // Ignore repeat invocations

        if (completed) {
          return;
        }

        completed = true; // Clear timeout if it exists

        if (timeoutTimer) {
          window.clearTimeout(timeoutTimer);
        } // Dereference transport for early garbage collection
        // (no matter how long the jqXHR object will be used)

        transport = undefined; // Cache response headers

        responseHeadersString = headers || ''; // Set readyState

        jqXHR.readyState = status > 0 ? 4 : 0; // Determine if successful

        isSuccess = (status >= 200 && status < 300) || status === 304; // Get response data

        if (responses) {
          response = ajaxHandleResponses(s, jqXHR, responses);
        } // Use a noop converter for missing script but not if jsonp

        if (!isSuccess && jQuery.inArray('script', s.dataTypes) > -1 && jQuery.inArray('json', s.dataTypes) < 0) {
          s.converters['text script'] = function () {};
        } // Convert no matter what (that way responseXXX fields are always set)

        response = ajaxConvert(s, response, jqXHR, isSuccess); // If successful, handle type chaining

        if (isSuccess) {
          // Set the If-Modified-Since and/or If-None-Match header, if in ifModified mode.
          if (s.ifModified) {
            modified = jqXHR.getResponseHeader('Last-Modified');

            if (modified) {
              jQuery.lastModified[cacheURL] = modified;
            }

            modified = jqXHR.getResponseHeader('etag');

            if (modified) {
              jQuery.etag[cacheURL] = modified;
            }
          } // if no content

          if (status === 204 || s.type === 'HEAD') {
            statusText = 'nocontent'; // if not modified
          } else if (status === 304) {
            statusText = 'notmodified'; // If we have data, let's convert it
          } else {
            statusText = response.state;
            success = response.data;
            error = response.error;
            isSuccess = !error;
          }
        } else {
          // Extract error from statusText and normalize for non-aborts
          error = statusText;

          if (status || !statusText) {
            statusText = 'error';

            if (status < 0) {
              status = 0;
            }
          }
        } // Set data for the fake xhr object

        jqXHR.status = status;
        jqXHR.statusText = (nativeStatusText || statusText) + ''; // Success/Error

        if (isSuccess) {
          deferred.resolveWith(callbackContext, [success, statusText, jqXHR]);
        } else {
          deferred.rejectWith(callbackContext, [jqXHR, statusText, error]);
        } // Status-dependent callbacks

        jqXHR.statusCode(_statusCode);
        _statusCode = undefined;

        if (fireGlobals) {
          globalEventContext.trigger(isSuccess ? 'ajaxSuccess' : 'ajaxError', [jqXHR, s, isSuccess ? success : error]);
        } // Complete

        completeDeferred.fireWith(callbackContext, [jqXHR, statusText]);

        if (fireGlobals) {
          globalEventContext.trigger('ajaxComplete', [jqXHR, s]); // Handle the global AJAX counter

          if (!--jQuery.active) {
            jQuery.event.trigger('ajaxStop');
          }
        }
      }

      return jqXHR;
    },
    getJSON: function getJSON(url, data, callback) {
      return jQuery.get(url, data, callback, 'json');
    },
    getScript: function getScript(url, callback) {
      return jQuery.get(url, undefined, callback, 'script');
    },
  });
  jQuery.each(['get', 'post'], function (_i, method) {
    jQuery[method] = function (url, data, callback, type) {
      // Shift arguments if data argument was omitted
      if (isFunction(data)) {
        type = type || callback;
        callback = data;
        data = undefined;
      } // The url can be an options object (which then must have .url)

      return jQuery.ajax(
        jQuery.extend(
          {
            url: url,
            type: method,
            dataType: type,
            data: data,
            success: callback,
          },
          jQuery.isPlainObject(url) && url,
        ),
      );
    };
  });
  jQuery.ajaxPrefilter(function (s) {
    var i;

    for (i in s.headers) {
      if (i.toLowerCase() === 'content-type') {
        s.contentType = s.headers[i] || '';
      }
    }
  });

  jQuery._evalUrl = function (url, options, doc) {
    return jQuery.ajax({
      url: url,
      // Make this explicit, since user can override this through ajaxSetup (trac-11264)
      type: 'GET',
      dataType: 'script',
      cache: true,
      async: false,
      global: false,
      // Only evaluate the response if it is successful (gh-4126)
      // dataFilter is not invoked for failure responses, so using it instead
      // of the default converter is kludgy but it works.
      converters: {
        'text script': function textScript() {},
      },
      dataFilter: function dataFilter(response) {
        jQuery.globalEval(response, options, doc);
      },
    });
  };

  jQuery.fn.extend({
    wrapAll: function wrapAll(html) {
      var wrap;

      if (this[0]) {
        if (isFunction(html)) {
          html = html.call(this[0]);
        } // The elements to wrap the target around

        wrap = jQuery(html, this[0].ownerDocument).eq(0).clone(true);

        if (this[0].parentNode) {
          wrap.insertBefore(this[0]);
        }

        wrap
          .map(function () {
            var elem = this;

            while (elem.firstElementChild) {
              elem = elem.firstElementChild;
            }

            return elem;
          })
          .append(this);
      }

      return this;
    },
    wrapInner: function wrapInner(html) {
      if (isFunction(html)) {
        return this.each(function (i) {
          jQuery(this).wrapInner(html.call(this, i));
        });
      }

      return this.each(function () {
        var self = jQuery(this),
          contents = self.contents();

        if (contents.length) {
          contents.wrapAll(html);
        } else {
          self.append(html);
        }
      });
    },
    wrap: function wrap(html) {
      var htmlIsFunction = isFunction(html);
      return this.each(function (i) {
        jQuery(this).wrapAll(htmlIsFunction ? html.call(this, i) : html);
      });
    },
    unwrap: function unwrap(selector) {
      this.parent(selector)
        .not('body')
        .each(function () {
          jQuery(this).replaceWith(this.childNodes);
        });
      return this;
    },
  });

  jQuery.expr.pseudos.hidden = function (elem) {
    return !jQuery.expr.pseudos.visible(elem);
  };

  jQuery.expr.pseudos.visible = function (elem) {
    return !!(elem.offsetWidth || elem.offsetHeight || elem.getClientRects().length);
  };

  jQuery.ajaxSettings.xhr = function () {
    try {
      return new window.XMLHttpRequest();
    } catch (e) {}
  };

  var xhrSuccessStatus = {
      // File protocol always yields status code 0, assume 200
      0: 200,
      // Support: IE <=9 only
      // trac-1450: sometimes IE returns 1223 when it should be 204
      1223: 204,
    },
    xhrSupported = jQuery.ajaxSettings.xhr();
  support.cors = !!xhrSupported && 'withCredentials' in xhrSupported;
  support.ajax = xhrSupported = !!xhrSupported;
  jQuery.ajaxTransport(function (options) {
    var _callback, errorCallback; // Cross domain only allowed if supported through XMLHttpRequest

    if (support.cors || (xhrSupported && !options.crossDomain)) {
      return {
        send: function send(headers, complete) {
          var i,
            xhr = options.xhr();
          xhr.open(options.type, options.url, options.async, options.username, options.password); // Apply custom fields if provided

          if (options.xhrFields) {
            for (i in options.xhrFields) {
              xhr[i] = options.xhrFields[i];
            }
          } // Override mime type if needed

          if (options.mimeType && xhr.overrideMimeType) {
            xhr.overrideMimeType(options.mimeType);
          } // X-Requested-With header
          // For cross-domain requests, seeing as conditions for a preflight are
          // akin to a jigsaw puzzle, we simply never set it to be sure.
          // (it can always be set on a per-request basis or even using ajaxSetup)
          // For same-domain requests, won't change header if already provided.

          if (!options.crossDomain && !headers['X-Requested-With']) {
            headers['X-Requested-With'] = 'XMLHttpRequest';
          } // Set headers

          for (i in headers) {
            xhr.setRequestHeader(i, headers[i]);
          } // Callback

          _callback = function callback(type) {
            return function () {
              if (_callback) {
                _callback =
                  errorCallback =
                  xhr.onload =
                  xhr.onerror =
                  xhr.onabort =
                  xhr.ontimeout =
                  xhr.onreadystatechange =
                    null;

                if (type === 'abort') {
                  xhr.abort();
                } else if (type === 'error') {
                  // Support: IE <=9 only
                  // On a manual native abort, IE9 throws
                  // errors on any property access that is not readyState
                  if (typeof xhr.status !== 'number') {
                    complete(0, 'error');
                  } else {
                    complete(
                      // File: protocol always yields status 0; see trac-8605, trac-14207
                      xhr.status,
                      xhr.statusText,
                    );
                  }
                } else {
                  complete(
                    xhrSuccessStatus[xhr.status] || xhr.status,
                    xhr.statusText, // Support: IE <=9 only
                    // IE9 has no XHR2 but throws on binary (trac-11426)
                    // For XHR2 non-text, let the caller handle it (gh-2498)
                    (xhr.responseType || 'text') !== 'text' || typeof xhr.responseText !== 'string'
                      ? {
                          binary: xhr.response,
                        }
                      : {
                          text: xhr.responseText,
                        },
                    xhr.getAllResponseHeaders(),
                  );
                }
              }
            };
          }; // Listen to events

          xhr.onload = _callback();
          errorCallback = xhr.onerror = xhr.ontimeout = _callback('error'); // Support: IE 9 only
          // Use onreadystatechange to replace onabort
          // to handle uncaught aborts

          if (xhr.onabort !== undefined) {
            xhr.onabort = errorCallback;
          } else {
            xhr.onreadystatechange = function () {
              // Check readyState before timeout as it changes
              if (xhr.readyState === 4) {
                // Allow onerror to be called first,
                // but that will not handle a native abort
                // Also, save errorCallback to a variable
                // as xhr.onerror cannot be accessed
                window.setTimeout(function () {
                  if (_callback) {
                    errorCallback();
                  }
                });
              }
            };
          } // Create the abort callback

          _callback = _callback('abort');

          try {
            // Do send the request (this may raise an exception)
            xhr.send((options.hasContent && options.data) || null);
          } catch (e) {
            // trac-14683: Only rethrow if this hasn't been notified as an error yet
            if (_callback) {
              throw e;
            }
          }
        },
        abort: function abort() {
          if (_callback) {
            _callback();
          }
        },
      };
    }
  }); // Prevent auto-execution of scripts when no explicit dataType was provided (See gh-2432)

  jQuery.ajaxPrefilter(function (s) {
    if (s.crossDomain) {
      s.contents.script = false;
    }
  }); // Install script dataType

  jQuery.ajaxSetup({
    accepts: {
      script: 'text/javascript, application/javascript, ' + 'application/ecmascript, application/x-ecmascript',
    },
    contents: {
      script: /\b(?:java|ecma)script\b/,
    },
    converters: {
      'text script': function textScript(text) {
        jQuery.globalEval(text);
        return text;
      },
    },
  }); // Handle cache's special case and crossDomain

  jQuery.ajaxPrefilter('script', function (s) {
    if (s.cache === undefined) {
      s.cache = false;
    }

    if (s.crossDomain) {
      s.type = 'GET';
    }
  }); // Bind script tag hack transport

  jQuery.ajaxTransport('script', function (s) {
    // This transport only deals with cross domain or forced-by-attrs requests
    if (s.crossDomain || s.scriptAttrs) {
      var script, _callback2;

      return {
        send: function send(_, complete) {
          script = jQuery('<script>')
            .attr(s.scriptAttrs || {})
            .prop({
              charset: s.scriptCharset,
              src: s.url,
            })
            .on(
              'load error',
              (_callback2 = function callback(evt) {
                script.remove();
                _callback2 = null;

                if (evt) {
                  complete(evt.type === 'error' ? 404 : 200, evt.type);
                }
              }),
            ); // Use native DOM manipulation to avoid our domManip AJAX trickery

          document.head.appendChild(script[0]);
        },
        abort: function abort() {
          if (_callback2) {
            _callback2();
          }
        },
      };
    }
  });
  var oldCallbacks = [],
    rjsonp = /(=)\?(?=&|$)|\?\?/; // Default jsonp settings

  jQuery.ajaxSetup({
    jsonp: 'callback',
    jsonpCallback: function jsonpCallback() {
      var callback = oldCallbacks.pop() || jQuery.expando + '_' + nonce.guid++;
      this[callback] = true;
      return callback;
    },
  }); // Detect, normalize options and install callbacks for jsonp requests

  jQuery.ajaxPrefilter('json jsonp', function (s, originalSettings, jqXHR) {
    var callbackName,
      overwritten,
      responseContainer,
      jsonProp =
        s.jsonp !== false &&
        (rjsonp.test(s.url)
          ? 'url'
          : typeof s.data === 'string' &&
            (s.contentType || '').indexOf('application/x-www-form-urlencoded') === 0 &&
            rjsonp.test(s.data) &&
            'data'); // Handle iff the expected data type is "jsonp" or we have a parameter to set

    if (jsonProp || s.dataTypes[0] === 'jsonp') {
      // Get callback name, remembering preexisting value associated with it
      callbackName = s.jsonpCallback = isFunction(s.jsonpCallback) ? s.jsonpCallback() : s.jsonpCallback; // Insert callback into url or form data

      if (jsonProp) {
        s[jsonProp] = s[jsonProp].replace(rjsonp, '$1' + callbackName);
      } else if (s.jsonp !== false) {
        s.url += (rquery.test(s.url) ? '&' : '?') + s.jsonp + '=' + callbackName;
      } // Use data converter to retrieve json after script execution

      s.converters['script json'] = function () {
        if (!responseContainer) {
          jQuery.error(callbackName + ' was not called');
        }

        return responseContainer[0];
      }; // Force json dataType

      s.dataTypes[0] = 'json'; // Install callback

      overwritten = window[callbackName];

      window[callbackName] = function () {
        responseContainer = arguments;
      }; // Clean-up function (fires after converters)

      jqXHR.always(function () {
        // If previous value didn't exist - remove it
        if (overwritten === undefined) {
          jQuery(window).removeProp(callbackName); // Otherwise restore preexisting value
        } else {
          window[callbackName] = overwritten;
        } // Save back as free

        if (s[callbackName]) {
          // Make sure that re-using the options doesn't screw things around
          s.jsonpCallback = originalSettings.jsonpCallback; // Save the callback name for future use

          oldCallbacks.push(callbackName);
        } // Call if it was a function and we have a response

        if (responseContainer && isFunction(overwritten)) {
          overwritten(responseContainer[0]);
        }

        responseContainer = overwritten = undefined;
      }); // Delegate to script

      return 'script';
    }
  }); // Support: Safari 8 only
  // In Safari 8 documents created via document.implementation.createHTMLDocument
  // collapse sibling forms: the second one becomes a child of the first one.
  // Because of that, this security measure has to be disabled in Safari 8.
  // https://bugs.webkit.org/show_bug.cgi?id=137337

  support.createHTMLDocument = (function () {
    var body = document.implementation.createHTMLDocument('').body;
    body.innerHTML = '<form></form><form></form>';
    return body.childNodes.length === 2;
  })(); // Argument "data" should be string of html
  // context (optional): If specified, the fragment will be created in this context,
  // defaults to document
  // keepScripts (optional): If true, will include scripts passed in the html string

  jQuery.parseHTML = function (data, context, keepScripts) {
    if (typeof data !== 'string') {
      return [];
    }

    if (typeof context === 'boolean') {
      keepScripts = context;
      context = false;
    }

    var base, parsed, scripts;

    if (!context) {
      // Stop scripts or inline event handlers from being executed immediately
      // by using document.implementation
      if (support.createHTMLDocument) {
        context = document.implementation.createHTMLDocument(''); // Set the base href for the created document
        // so any parsed elements with URLs
        // are based on the document's URL (gh-2965)

        base = context.createElement('base');
        base.href = document.location.href;
        context.head.appendChild(base);
      } else {
        context = document;
      }
    }

    parsed = rsingleTag.exec(data);
    scripts = !keepScripts && []; // Single tag

    if (parsed) {
      return [context.createElement(parsed[1])];
    }

    parsed = buildFragment([data], context, scripts);

    if (scripts && scripts.length) {
      jQuery(scripts).remove();
    }

    return jQuery.merge([], parsed.childNodes);
  };
  /**
   * Load a url into a page
   */

  jQuery.fn.load = function (url, params, callback) {
    var selector,
      type,
      response,
      self = this,
      off = url.indexOf(' ');

    if (off > -1) {
      selector = stripAndCollapse(url.slice(off));
      url = url.slice(0, off);
    } // If it's a function

    if (isFunction(params)) {
      // We assume that it's the callback
      callback = params;
      params = undefined; // Otherwise, build a param string
    } else if (params && _typeof(params) === 'object') {
      type = 'POST';
    } // If we have elements to modify, make the request

    if (self.length > 0) {
      jQuery
        .ajax({
          url: url,
          // If "type" variable is undefined, then "GET" method will be used.
          // Make value of this field explicit since
          // user can override it through ajaxSetup method
          type: type || 'GET',
          dataType: 'html',
          data: params,
        })
        .done(function (responseText) {
          // Save response for use in complete callback
          response = arguments;
          self.html(
            selector // If a selector was specified, locate the right elements in a dummy div
              ? // Exclude scripts to avoid IE 'Permission Denied' errors
                jQuery('<div>').append(jQuery.parseHTML(responseText)).find(selector) // Otherwise use the full result
              : responseText,
          ); // If the request succeeds, this function gets "data", "status", "jqXHR"
          // but they are ignored because response was set above.
          // If it fails, this function gets "jqXHR", "status", "error"
        })
        .always(
          callback &&
            function (jqXHR, status) {
              self.each(function () {
                callback.apply(this, response || [jqXHR.responseText, status, jqXHR]);
              });
            },
        );
    }

    return this;
  };

  jQuery.expr.pseudos.animated = function (elem) {
    return jQuery.grep(jQuery.timers, function (fn) {
      return elem === fn.elem;
    }).length;
  };

  jQuery.offset = {
    setOffset: function setOffset(elem, options, i) {
      var curPosition,
        curLeft,
        curCSSTop,
        curTop,
        curOffset,
        curCSSLeft,
        calculatePosition,
        position = jQuery.css(elem, 'position'),
        curElem = jQuery(elem),
        props = {}; // Set position first, in-case top/left are set even on static elem

      if (position === 'static') {
        elem.style.position = 'relative';
      }

      curOffset = curElem.offset();
      curCSSTop = jQuery.css(elem, 'top');
      curCSSLeft = jQuery.css(elem, 'left');
      calculatePosition =
        (position === 'absolute' || position === 'fixed') && (curCSSTop + curCSSLeft).indexOf('auto') > -1; // Need to be able to calculate position if either
      // top or left is auto and position is either absolute or fixed

      if (calculatePosition) {
        curPosition = curElem.position();
        curTop = curPosition.top;
        curLeft = curPosition.left;
      } else {
        curTop = parseFloat(curCSSTop) || 0;
        curLeft = parseFloat(curCSSLeft) || 0;
      }

      if (isFunction(options)) {
        // Use jQuery.extend here to allow modification of coordinates argument (gh-1848)
        options = options.call(elem, i, jQuery.extend({}, curOffset));
      }

      if (options.top != null) {
        props.top = options.top - curOffset.top + curTop;
      }

      if (options.left != null) {
        props.left = options.left - curOffset.left + curLeft;
      }

      if ('using' in options) {
        options.using.call(elem, props);
      } else {
        curElem.css(props);
      }
    },
  };
  jQuery.fn.extend({
    // offset() relates an element's border box to the document origin
    offset: function offset(options) {
      // Preserve chaining for setter
      if (arguments.length) {
        return options === undefined
          ? this
          : this.each(function (i) {
              jQuery.offset.setOffset(this, options, i);
            });
      }

      var rect,
        win,
        elem = this[0];

      if (!elem) {
        return;
      } // Return zeros for disconnected and hidden (display: none) elements (gh-2310)
      // Support: IE <=11 only
      // Running getBoundingClientRect on a
      // disconnected node in IE throws an error

      if (!elem.getClientRects().length) {
        return {
          top: 0,
          left: 0,
        };
      } // Get document-relative position by adding viewport scroll to viewport-relative gBCR

      rect = elem.getBoundingClientRect();
      win = elem.ownerDocument.defaultView;
      return {
        top: rect.top + win.pageYOffset,
        left: rect.left + win.pageXOffset,
      };
    },
    // position() relates an element's margin box to its offset parent's padding box
    // This corresponds to the behavior of CSS absolute positioning
    position: function position() {
      if (!this[0]) {
        return;
      }

      var offsetParent,
        offset,
        doc,
        elem = this[0],
        parentOffset = {
          top: 0,
          left: 0,
        }; // position:fixed elements are offset from the viewport, which itself always has zero offset

      if (jQuery.css(elem, 'position') === 'fixed') {
        // Assume position:fixed implies availability of getBoundingClientRect
        offset = elem.getBoundingClientRect();
      } else {
        offset = this.offset(); // Account for the *real* offset parent, which can be the document or its root element
        // when a statically positioned element is identified

        doc = elem.ownerDocument;
        offsetParent = elem.offsetParent || doc.documentElement;

        while (
          offsetParent &&
          (offsetParent === doc.body || offsetParent === doc.documentElement) &&
          jQuery.css(offsetParent, 'position') === 'static'
        ) {
          offsetParent = offsetParent.parentNode;
        }

        if (offsetParent && offsetParent !== elem && offsetParent.nodeType === 1) {
          // Incorporate borders into its offset, since they are outside its content origin
          parentOffset = jQuery(offsetParent).offset();
          parentOffset.top += jQuery.css(offsetParent, 'borderTopWidth', true);
          parentOffset.left += jQuery.css(offsetParent, 'borderLeftWidth', true);
        }
      } // Subtract parent offsets and element margins

      return {
        top: offset.top - parentOffset.top - jQuery.css(elem, 'marginTop', true),
        left: offset.left - parentOffset.left - jQuery.css(elem, 'marginLeft', true),
      };
    },
    // This method will return documentElement in the following cases:
    // 1) For the element inside the iframe without offsetParent, this method will return
    //    documentElement of the parent window
    // 2) For the hidden or detached element
    // 3) For body or html element, i.e. in case of the html node - it will return itself
    //
    // but those exceptions were never presented as a real life use-cases
    // and might be considered as more preferable results.
    //
    // This logic, however, is not guaranteed and can change at any point in the future
    offsetParent: function offsetParent() {
      return this.map(function () {
        var offsetParent = this.offsetParent;

        while (offsetParent && jQuery.css(offsetParent, 'position') === 'static') {
          offsetParent = offsetParent.offsetParent;
        }

        return offsetParent || documentElement;
      });
    },
  }); // Create scrollLeft and scrollTop methods

  jQuery.each(
    {
      scrollLeft: 'pageXOffset',
      scrollTop: 'pageYOffset',
    },
    function (method, prop) {
      var top = 'pageYOffset' === prop;

      jQuery.fn[method] = function (val) {
        return access(
          this,
          function (elem, method, val) {
            // Coalesce documents and windows
            var win;

            if (isWindow(elem)) {
              win = elem;
            } else if (elem.nodeType === 9) {
              win = elem.defaultView;
            }

            if (val === undefined) {
              return win ? win[prop] : elem[method];
            }

            if (win) {
              win.scrollTo(!top ? val : win.pageXOffset, top ? val : win.pageYOffset);
            } else {
              elem[method] = val;
            }
          },
          method,
          val,
          arguments.length,
        );
      };
    },
  ); // Support: Safari <=7 - 9.1, Chrome <=37 - 49
  // Add the top/left cssHooks using jQuery.fn.position
  // Webkit bug: https://bugs.webkit.org/show_bug.cgi?id=29084
  // Blink bug: https://bugs.chromium.org/p/chromium/issues/detail?id=589347
  // getComputedStyle returns percent when specified for top/left/bottom/right;
  // rather than make the css module depend on the offset module, just check for it here

  jQuery.each(['top', 'left'], function (_i, prop) {
    jQuery.cssHooks[prop] = addGetHookIf(support.pixelPosition, function (elem, computed) {
      if (computed) {
        computed = curCSS(elem, prop); // If curCSS returns percentage, fallback to offset

        return rnumnonpx.test(computed) ? jQuery(elem).position()[prop] + 'px' : computed;
      }
    });
  }); // Create innerHeight, innerWidth, height, width, outerHeight and outerWidth methods

  jQuery.each(
    {
      Height: 'height',
      Width: 'width',
    },
    function (name, type) {
      jQuery.each(
        {
          padding: 'inner' + name,
          content: type,
          '': 'outer' + name,
        },
        function (defaultExtra, funcName) {
          // Margin is only for outerHeight, outerWidth
          jQuery.fn[funcName] = function (margin, value) {
            var chainable = arguments.length && (defaultExtra || typeof margin !== 'boolean'),
              extra = defaultExtra || (margin === true || value === true ? 'margin' : 'border');
            return access(
              this,
              function (elem, type, value) {
                var doc;

                if (isWindow(elem)) {
                  // $( window ).outerWidth/Height return w/h including scrollbars (gh-1729)
                  return funcName.indexOf('outer') === 0
                    ? elem['inner' + name]
                    : elem.document.documentElement['client' + name];
                } // Get document width or height

                if (elem.nodeType === 9) {
                  doc = elem.documentElement; // Either scroll[Width/Height] or offset[Width/Height] or client[Width/Height],
                  // whichever is greatest

                  return Math.max(
                    elem.body['scroll' + name],
                    doc['scroll' + name],
                    elem.body['offset' + name],
                    doc['offset' + name],
                    doc['client' + name],
                  );
                }

                return value === undefined // Get width or height on the element, requesting but not forcing parseFloat
                  ? jQuery.css(elem, type, extra) // Set width or height on the element
                  : jQuery.style(elem, type, value, extra);
              },
              type,
              chainable ? margin : undefined,
              chainable,
            );
          };
        },
      );
    },
  );
  jQuery.each(['ajaxStart', 'ajaxStop', 'ajaxComplete', 'ajaxError', 'ajaxSuccess', 'ajaxSend'], function (_i, type) {
    jQuery.fn[type] = function (fn) {
      return this.on(type, fn);
    };
  });
  jQuery.fn.extend({
    bind: function bind(types, data, fn) {
      return this.on(types, null, data, fn);
    },
    unbind: function unbind(types, fn) {
      return this.off(types, null, fn);
    },
    delegate: function delegate(selector, types, data, fn) {
      return this.on(types, selector, data, fn);
    },
    undelegate: function undelegate(selector, types, fn) {
      // ( namespace ) or ( selector, types [, fn] )
      return arguments.length === 1 ? this.off(selector, '**') : this.off(types, selector || '**', fn);
    },
    hover: function hover(fnOver, fnOut) {
      return this.mouseenter(fnOver).mouseleave(fnOut || fnOver);
    },
  });
  jQuery.each(
    (
      'blur focus focusin focusout resize scroll click dblclick ' +
      'mousedown mouseup mousemove mouseover mouseout mouseenter mouseleave ' +
      'change select submit keydown keypress keyup contextmenu'
    ).split(' '),
    function (_i, name) {
      // Handle event binding
      jQuery.fn[name] = function (data, fn) {
        return arguments.length > 0 ? this.on(name, null, data, fn) : this.trigger(name);
      };
    },
  ); // Support: Android <=4.0 only
  // Make sure we trim BOM and NBSP
  // Require that the "whitespace run" starts from a non-whitespace
  // to avoid O(N^2) behavior when the engine would try matching "\s+$" at each space position.

  var rtrim = /^[\s\uFEFF\xA0]+|([^\s\uFEFF\xA0])[\s\uFEFF\xA0]+$/g; // Bind a function to a context, optionally partially applying any
  // arguments.
  // jQuery.proxy is deprecated to promote standards (specifically Function#bind)
  // However, it is not slated for removal any time soon

  jQuery.proxy = function (fn, context) {
    var tmp, args, proxy;

    if (typeof context === 'string') {
      tmp = fn[context];
      context = fn;
      fn = tmp;
    } // Quick check to determine if target is callable, in the spec
    // this throws a TypeError, but we will just return undefined.

    if (!isFunction(fn)) {
      return undefined;
    } // Simulated bind

    args = _slice.call(arguments, 2);

    proxy = function proxy() {
      return fn.apply(context || this, args.concat(_slice.call(arguments)));
    }; // Set the guid of unique handler to the same of original handler, so it can be removed

    proxy.guid = fn.guid = fn.guid || jQuery.guid++;
    return proxy;
  };

  jQuery.holdReady = function (hold) {
    if (hold) {
      jQuery.readyWait++;
    } else {
      jQuery.ready(true);
    }
  };

  jQuery.isArray = Array.isArray;
  jQuery.parseJSON = JSON.parse;
  jQuery.nodeName = nodeName;
  jQuery.isFunction = isFunction;
  jQuery.isWindow = isWindow;
  jQuery.camelCase = camelCase;
  jQuery.type = toType;
  jQuery.now = Date.now;

  jQuery.isNumeric = function (obj) {
    // As of jQuery 3.0, isNumeric is limited to
    // strings and numbers (primitives or objects)
    // that can be coerced to finite numbers (gh-2662)
    var type = jQuery.type(obj);
    return (
      (type === 'number' || type === 'string') && // parseFloat NaNs numeric-cast false positives ("")
      // ...but misinterprets leading-number strings, particularly hex literals ("0x...")
      // subtraction forces infinities to NaN
      !isNaN(obj - parseFloat(obj))
    );
  };

  jQuery.trim = function (text) {
    return text == null ? '' : (text + '').replace(rtrim, '$1');
  }; // Register as a named AMD module, since jQuery can be concatenated with other
  // files that may use define, but not via a proper concatenation script that
  // understands anonymous AMD modules. A named AMD is safest and most robust
  // way to register. Lowercase jquery is used because AMD module names are
  // derived from file names, and jQuery is normally delivered in a lowercase
  // file name. Do this after creating the global so that if an AMD module wants
  // to call noConflict to hide this version of jQuery, it will work.
  // Note that for maximum portability, libraries that are not jQuery should
  // declare themselves as anonymous modules, and avoid setting a global if an
  // AMD loader is present. jQuery is a special case. For more information, see
  // https://github.com/jrburke/requirejs/wiki/Updating-existing-libraries#wiki-anon

  if (typeof define === 'function' && define.amd) {
    define('jquery', [], function () {
      return jQuery;
    });
  }

  var // Map over jQuery in case of overwrite
    _jQuery = window.jQuery,
    // Map over the $ in case of overwrite
    _$ = window.$;

  jQuery.noConflict = function (deep) {
    if (window.$ === jQuery) {
      window.$ = _$;
    }

    if (deep && window.jQuery === jQuery) {
      window.jQuery = _jQuery;
    }

    return jQuery;
  }; // Expose jQuery and $ identifiers, even in AMD
  // (trac-7102#comment:10, https://github.com/jquery/jquery/pull/557)
  // and CommonJS for browser emulators (trac-13566)

  if (typeof noGlobal === 'undefined') {
    window.jQuery = window.$ = jQuery;
  }

  return jQuery;
});
('use strict');

/*!
 * jQuery.tabbable 1.0 - Simple utility for selecting the next / previous ':tabbable' element.
 * https://github.com/marklagendijk/jQuery.tabbable
 *
 * Includes ':tabbable' and ':focusable' selectors from jQuery UI Core
 *
 * Copyright 2013, Mark Lagendijk
 * Released under the MIT license
 *
 */
(function ($) {
  'use strict';
  /**
   * Focusses the next :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
   * Does not take into account that the taborder might be different as the :tabbable elements order
   * (which happens when using tabindexes which are greater than 0).
   */

  $.focusNext = function () {
    selectNextTabbableOrFocusable(':focusable');
  };
  /**
   * Focusses the previous :focusable element. Elements with tabindex=-1 are focusable, but not tabable.
   * Does not take into account that the taborder might be different as the :tabbable elements order
   * (which happens when using tabindexes which are greater than 0).
   */

  $.focusPrev = function () {
    selectPrevTabbableOrFocusable(':focusable');
  };
  /**
   * Focusses the next :tabable element.
   * Does not take into account that the taborder might be different as the :tabbable elements order
   * (which happens when using tabindexes which are greater than 0).
   */

  $.tabNext = function () {
    selectNextTabbableOrFocusable(':tabbable');
  };
  /**
   * Focusses the previous :tabbable element
   * Does not take into account that the taborder might be different as the :tabbable elements order
   * (which happens when using tabindexes which are greater than 0).
   */

  $.tabPrev = function () {
    selectPrevTabbableOrFocusable(':tabbable');
  };

  function selectNextTabbableOrFocusable(selector) {
    var selectables = $(selector);
    var current = $(':focus');
    var nextIndex = 0;

    if (current.length === 1) {
      var currentIndex = selectables.index(current);

      if (currentIndex + 1 < selectables.length) {
        nextIndex = currentIndex + 1;
      }
    }

    selectables.eq(nextIndex).focus();
  }

  function selectPrevTabbableOrFocusable(selector) {
    var selectables = $(selector);
    var current = $(':focus');
    var prevIndex = selectables.length - 1;

    if (current.length === 1) {
      var currentIndex = selectables.index(current);

      if (currentIndex > 0) {
        prevIndex = currentIndex - 1;
      }
    }

    selectables.eq(prevIndex).focus();
  }
  /**
   * :focusable and :tabbable, both taken from jQuery UI Core
   */

  $.extend($.expr[':'], {
    data: $.expr.createPseudo
      ? $.expr.createPseudo(function (dataName) {
          return function (elem) {
            return !!$.data(elem, dataName);
          };
        }) // support: jQuery <1.8
      : function (elem, i, match) {
          return !!$.data(elem, match[3]);
        },
    focusable: function focusable(element) {
      return _focusable(element, !isNaN($.attr(element, 'tabindex')));
    },
    tabbable: function tabbable(element) {
      var tabIndex = $.attr(element, 'tabindex'),
        isTabIndexNaN = isNaN(tabIndex);
      return (isTabIndexNaN || tabIndex >= 0) && _focusable(element, !isTabIndexNaN);
    },
  });
  /**
   * focussable function, taken from jQuery UI Core
   * @param element
   * @returns {*}
   */

  function _focusable(element) {
    var map,
      mapName,
      img,
      nodeName = element.nodeName.toLowerCase(),
      isTabIndexNotNaN = !isNaN($.attr(element, 'tabindex'));

    if ('area' === nodeName) {
      map = element.parentNode;
      mapName = map.name;

      if (!element.href || !mapName || map.nodeName.toLowerCase() !== 'map') {
        return false;
      }

      img = $('img[usemap=#' + mapName + ']')[0];
      return !!img && visible(img);
    }

    return (
      (/input|select|textarea|button|object/.test(nodeName)
        ? !element.disabled
        : 'a' === nodeName
          ? element.href || isTabIndexNotNaN
          : isTabIndexNotNaN) && // the element and all of its ancestors must be visible
      visible(element)
    );

    function visible(element) {
      return (
        $.expr.filters.visible(element) &&
        !$(element)
          .parents()
          .addBack()
          .filter(function () {
            return $.css(this, 'visibility') === 'hidden';
          }).length
      );
    }
  }
})(jQuery);
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? factory()
    : typeof define === 'function' && define.amd
      ? define(factory)
      : factory();
})(void 0, function () {
  'use strict';
  /**
   * https://github.com/WICG/focus-visible
   */

  function init() {
    var hadKeyboardEvent = true;
    var hadFocusVisibleRecently = false;
    var hadFocusVisibleRecentlyTimeout = null;
    var inputTypesWhitelist = {
      text: true,
      search: true,
      url: true,
      tel: true,
      email: true,
      password: true,
      number: true,
      date: true,
      month: true,
      week: true,
      time: true,
      datetime: true,
      'datetime-local': true,
    };
    /**
     * Helper function for legacy browsers and iframes which sometimes focus
     * elements like document, body, and non-interactive SVG.
     * @param {Element} el
     */

    function isValidFocusTarget(el) {
      if (
        el &&
        el !== document &&
        el.nodeName !== 'HTML' &&
        el.nodeName !== 'BODY' &&
        'classList' in el &&
        'contains' in el.classList
      ) {
        return true;
      }

      return false;
    }
    /**
     * Computes whether the given element should automatically trigger the
     * `focus-visible` class being added, i.e. whether it should always match
     * `:focus-visible` when focused.
     * @param {Element} el
     * @return {boolean}
     */

    function focusTriggersKeyboardModality(el) {
      var type = el.type;
      var tagName = el.tagName;

      if (tagName == 'INPUT' && inputTypesWhitelist[type] && !el.readOnly) {
        return true;
      }

      if (tagName == 'TEXTAREA' && !el.readOnly) {
        return true;
      }

      if (el.isContentEditable) {
        return true;
      }

      return false;
    }
    /**
     * Add the `focus-visible` class to the given element if it was not added by
     * the author.
     * @param {Element} el
     */

    function addFocusVisibleClass(el) {
      if (el.classList.contains('focus-visible')) {
        return;
      }

      el.classList.add('focus-visible');
      el.setAttribute('data-focus-visible-added', '');
    }
    /**
     * Remove the `focus-visible` class from the given element if it was not
     * originally added by the author.
     * @param {Element} el
     */

    function removeFocusVisibleClass(el) {
      if (!el.hasAttribute('data-focus-visible-added')) {
        return;
      }

      el.classList.remove('focus-visible');
      el.removeAttribute('data-focus-visible-added');
    }
    /**
     * Treat `keydown` as a signal that the user is in keyboard modality.
     * Apply `focus-visible` to any current active element and keep track
     * of our keyboard modality state with `hadKeyboardEvent`.
     * @param {Event} e
     */

    function onKeyDown(e) {
      if (isValidFocusTarget(document.activeElement)) {
        addFocusVisibleClass(document.activeElement);
      }

      hadKeyboardEvent = true;
    }
    /**
     * If at any point a user clicks with a pointing device, ensure that we change
     * the modality away from keyboard.
     * This avoids the situation where a user presses a key on an already focused
     * element, and then clicks on a different element, focusing it with a
     * pointing device, while we still think we're in keyboard modality.
     * @param {Event} e
     */

    function onPointerDown(e) {
      hadKeyboardEvent = false;
    }
    /**
     * On `focus`, add the `focus-visible` class to the target if:
     * - the target received focus as a result of keyboard navigation, or
     * - the event target is an element that will likely require interaction
     *   via the keyboard (e.g. a text box)
     * @param {Event} e
     */

    function onFocus(e) {
      // Prevent IE from focusing the document or HTML element.
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (hadKeyboardEvent || focusTriggersKeyboardModality(e.target)) {
        addFocusVisibleClass(e.target);
      }
    }
    /**
     * On `blur`, remove the `focus-visible` class from the target.
     * @param {Event} e
     */

    function onBlur(e) {
      if (!isValidFocusTarget(e.target)) {
        return;
      }

      if (e.target.classList.contains('focus-visible') || e.target.hasAttribute('data-focus-visible-added')) {
        // To detect a tab/window switch, we look for a blur event followed
        // rapidly by a visibility change.
        // If we don't see a visibility change within 100ms, it's probably a
        // regular focus change.
        hadFocusVisibleRecently = true;
        window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        hadFocusVisibleRecentlyTimeout = window.setTimeout(function () {
          hadFocusVisibleRecently = false;
          window.clearTimeout(hadFocusVisibleRecentlyTimeout);
        }, 100);
        removeFocusVisibleClass(e.target);
      }
    }
    /**
     * If the user changes tabs, keep track of whether or not the previously
     * focused element had .focus-visible.
     * @param {Event} e
     */

    function onVisibilityChange(e) {
      if (document.visibilityState == 'hidden') {
        // If the tab becomes active again, the browser will handle calling focus
        // on the element (Safari actually calls it twice).
        // If this tab change caused a blur on an element with focus-visible,
        // re-apply the class when the user switches back to the tab.
        if (hadFocusVisibleRecently) {
          hadKeyboardEvent = true;
        }

        addInitialPointerMoveListeners();
      }
    }
    /**
     * Add a group of listeners to detect usage of any pointing devices.
     * These listeners will be added when the polyfill first loads, and anytime
     * the window is blurred, so that they are active when the window regains
     * focus.
     */

    function addInitialPointerMoveListeners() {
      document.addEventListener('mousemove', onInitialPointerMove);
      document.addEventListener('mousedown', onInitialPointerMove);
      document.addEventListener('mouseup', onInitialPointerMove);
      document.addEventListener('pointermove', onInitialPointerMove);
      document.addEventListener('pointerdown', onInitialPointerMove);
      document.addEventListener('pointerup', onInitialPointerMove);
      document.addEventListener('touchmove', onInitialPointerMove);
      document.addEventListener('touchstart', onInitialPointerMove);
      document.addEventListener('touchend', onInitialPointerMove);
    }

    function removeInitialPointerMoveListeners() {
      document.removeEventListener('mousemove', onInitialPointerMove);
      document.removeEventListener('mousedown', onInitialPointerMove);
      document.removeEventListener('mouseup', onInitialPointerMove);
      document.removeEventListener('pointermove', onInitialPointerMove);
      document.removeEventListener('pointerdown', onInitialPointerMove);
      document.removeEventListener('pointerup', onInitialPointerMove);
      document.removeEventListener('touchmove', onInitialPointerMove);
      document.removeEventListener('touchstart', onInitialPointerMove);
      document.removeEventListener('touchend', onInitialPointerMove);
    }
    /**
     * When the polfyill first loads, assume the user is in keyboard modality.
     * If any event is received from a pointing device (e.g. mouse, pointer,
     * touch), turn off keyboard modality.
     * This accounts for situations where focus enters the page from the URL bar.
     * @param {Event} e
     */

    function onInitialPointerMove(e) {
      // Work around a Safari quirk that fires a mousemove on <html> whenever the
      // window blurs, even if you're tabbing out of the page. ¯\_(ツ)_/¯
      if (e.target.nodeName.toLowerCase() === 'html') {
        return;
      }

      hadKeyboardEvent = false;
      removeInitialPointerMoveListeners();
    }

    document.addEventListener('keydown', onKeyDown, true);
    document.addEventListener('mousedown', onPointerDown, true);
    document.addEventListener('pointerdown', onPointerDown, true);
    document.addEventListener('touchstart', onPointerDown, true);
    document.addEventListener('focus', onFocus, true);
    document.addEventListener('blur', onBlur, true);
    document.addEventListener('visibilitychange', onVisibilityChange, true);
    addInitialPointerMoveListeners();
    document.body.classList.add('js-focus-visible');
  }
  /**
   * Subscription when the DOM is ready
   * @param {Function} callback
   */

  function onDOMReady(callback) {
    var loaded;
    /**
     * Callback wrapper for check loaded state
     */

    function load() {
      if (!loaded) {
        loaded = true;
        callback();
      }
    }

    if (['interactive', 'complete'].indexOf(document.readyState) >= 0) {
      callback();
    } else {
      loaded = false;
      document.addEventListener('DOMContentLoaded', load, false);
      window.addEventListener('load', load, false);
    }
  }

  if (typeof document !== 'undefined') {
    onDOMReady(init);
  }
});
/**
 * @popperjs/core v2.10.1 - MIT License
 */
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

!(function (e, t) {
  'object' == (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) && 'undefined' != typeof module
    ? t(exports)
    : 'function' == typeof define && define.amd
      ? define(['exports'], t)
      : t(((e = 'undefined' != typeof globalThis ? globalThis : e || self).Popper = {}));
})(void 0, function (e) {
  function t(e) {
    return null == e
      ? window
      : '[object Window]' !== e.toString()
        ? ((e = e.ownerDocument) && e.defaultView) || window
        : e;
  }

  function n(e) {
    return e instanceof t(e).Element || e instanceof Element;
  }

  function o(e) {
    return e instanceof t(e).HTMLElement || e instanceof HTMLElement;
  }

  function r(e) {
    return 'undefined' != typeof ShadowRoot && (e instanceof t(e).ShadowRoot || e instanceof ShadowRoot);
  }

  function i(e, t) {
    void 0 === t && (t = !1);
    var n = e.getBoundingClientRect(),
      r = 1,
      i = 1;
    return (
      o(e) &&
        t &&
        ((t = e.offsetHeight), 0 < (e = e.offsetWidth) && (r = n.width / e || 1), 0 < t && (i = n.height / t || 1)),
      {
        width: N(n.width / r),
        height: N(n.height / i),
        top: N(n.top / i),
        right: N(n.right / r),
        bottom: N(n.bottom / i),
        left: N(n.left / r),
        x: N(n.left / r),
        y: N(n.top / i),
      }
    );
  }

  function a(e) {
    return {
      scrollLeft: (e = t(e)).pageXOffset,
      scrollTop: e.pageYOffset,
    };
  }

  function s(e) {
    return e ? (e.nodeName || '').toLowerCase() : null;
  }

  function f(e) {
    return ((n(e) ? e.ownerDocument : e.document) || window.document).documentElement;
  }

  function p(e) {
    return i(f(e)).left + a(e).scrollLeft;
  }

  function c(e) {
    return t(e).getComputedStyle(e);
  }

  function l(e) {
    return ((e = c(e)), /auto|scroll|overlay|hidden/.test(e.overflow + e.overflowY + e.overflowX));
  }

  function u(e, n, r) {
    void 0 === r && (r = !1);
    var c,
      u = o(n);

    if ((c = o(n))) {
      var d = (c = n.getBoundingClientRect()).height / n.offsetHeight || 1;
      c = 1 !== (c.width / n.offsetWidth || 1) || 1 !== d;
    }

    ((d = c),
      (c = f(n)),
      (e = i(e, d)),
      (d = {
        scrollLeft: 0,
        scrollTop: 0,
      }));
    var h = {
      x: 0,
      y: 0,
    };
    return (
      (u || (!u && !r)) &&
        (('body' !== s(n) || l(c)) &&
          (d =
            n !== t(n) && o(n)
              ? {
                  scrollLeft: n.scrollLeft,
                  scrollTop: n.scrollTop,
                }
              : a(n)),
        o(n) ? (((h = i(n, !0)).x += n.clientLeft), (h.y += n.clientTop)) : c && (h.x = p(c))),
      {
        x: e.left + d.scrollLeft - h.x,
        y: e.top + d.scrollTop - h.y,
        width: e.width,
        height: e.height,
      }
    );
  }

  function d(e) {
    var t = i(e),
      n = e.offsetWidth,
      o = e.offsetHeight;
    return (
      1 >= Math.abs(t.width - n) && (n = t.width),
      1 >= Math.abs(t.height - o) && (o = t.height),
      {
        x: e.offsetLeft,
        y: e.offsetTop,
        width: n,
        height: o,
      }
    );
  }

  function h(e) {
    return 'html' === s(e) ? e : e.assignedSlot || e.parentNode || (r(e) ? e.host : null) || f(e);
  }

  function m(e) {
    return 0 <= ['html', 'body', '#document'].indexOf(s(e)) ? e.ownerDocument.body : o(e) && l(e) ? e : m(h(e));
  }

  function v(e, n) {
    var o;
    void 0 === n && (n = []);
    var r = m(e);
    return (
      (e = r === (null == (o = e.ownerDocument) ? void 0 : o.body)),
      (o = t(r)),
      (r = e ? [o].concat(o.visualViewport || [], l(r) ? r : []) : r),
      (n = n.concat(r)),
      e ? n : n.concat(v(h(r)))
    );
  }

  function g(e) {
    return o(e) && 'fixed' !== c(e).position ? e.offsetParent : null;
  }

  function b(e) {
    for (var n = t(e), r = g(e); r && 0 <= ['table', 'td', 'th'].indexOf(s(r)) && 'static' === c(r).position; ) {
      r = g(r);
    }

    if (r && ('html' === s(r) || ('body' === s(r) && 'static' === c(r).position))) return n;
    if (!r)
      e: {
        if (
          ((r = -1 !== navigator.userAgent.toLowerCase().indexOf('firefox')),
          -1 === navigator.userAgent.indexOf('Trident') || !o(e) || 'fixed' !== c(e).position)
        )
          for (e = h(e); o(e) && 0 > ['html', 'body'].indexOf(s(e)); ) {
            var i = c(e);

            if (
              'none' !== i.transform ||
              'none' !== i.perspective ||
              'paint' === i.contain ||
              -1 !== ['transform', 'perspective'].indexOf(i.willChange) ||
              (r && 'filter' === i.willChange) ||
              (r && i.filter && 'none' !== i.filter)
            ) {
              r = e;
              break e;
            }

            e = e.parentNode;
          }
        r = null;
      }
    return r || n;
  }

  function y(e) {
    function t(e) {
      (o.add(e.name),
        [].concat(e.requires || [], e.requiresIfExists || []).forEach(function (e) {
          o.has(e) || ((e = n.get(e)) && t(e));
        }),
        r.push(e));
    }

    var n = new Map(),
      o = new Set(),
      r = [];
    return (
      e.forEach(function (e) {
        n.set(e.name, e);
      }),
      e.forEach(function (e) {
        o.has(e.name) || t(e);
      }),
      r
    );
  }

  function w(e) {
    var t;
    return function () {
      return (
        t ||
          (t = new Promise(function (n) {
            Promise.resolve().then(function () {
              ((t = void 0), n(e()));
            });
          })),
        t
      );
    };
  }

  function x(e) {
    return e.split('-')[0];
  }

  function O(e, t) {
    var n = t.getRootNode && t.getRootNode();
    if (e.contains(t)) return !0;
    if (n && r(n))
      do {
        if (t && e.isSameNode(t)) return !0;
        t = t.parentNode || t.host;
      } while (t);
    return !1;
  }

  function j(e) {
    return Object.assign({}, e, {
      left: e.x,
      top: e.y,
      right: e.x + e.width,
      bottom: e.y + e.height,
    });
  }

  function E(e, n) {
    if ('viewport' === n) {
      n = t(e);
      var r = f(e);
      n = n.visualViewport;
      var s = r.clientWidth;
      r = r.clientHeight;
      var l = 0,
        u = 0;
      (n &&
        ((s = n.width),
        (r = n.height),
        /^((?!chrome|android).)*safari/i.test(navigator.userAgent) || ((l = n.offsetLeft), (u = n.offsetTop))),
        (e = j(
          (e = {
            width: s,
            height: r,
            x: l + p(e),
            y: u,
          }),
        )));
    } else
      o(n)
        ? (((e = i(n)).top += n.clientTop),
          (e.left += n.clientLeft),
          (e.bottom = e.top + n.clientHeight),
          (e.right = e.left + n.clientWidth),
          (e.width = n.clientWidth),
          (e.height = n.clientHeight),
          (e.x = e.left),
          (e.y = e.top))
        : ((u = f(e)),
          (e = f(u)),
          (s = a(u)),
          (n = null == (r = u.ownerDocument) ? void 0 : r.body),
          (r = z(e.scrollWidth, e.clientWidth, n ? n.scrollWidth : 0, n ? n.clientWidth : 0)),
          (l = z(e.scrollHeight, e.clientHeight, n ? n.scrollHeight : 0, n ? n.clientHeight : 0)),
          (u = -s.scrollLeft + p(u)),
          (s = -s.scrollTop),
          'rtl' === c(n || e).direction && (u += z(e.clientWidth, n ? n.clientWidth : 0) - r),
          (e = j({
            width: r,
            height: l,
            x: u,
            y: s,
          })));

    return e;
  }

  function D(e, t, r) {
    return (
      (t =
        'clippingParents' === t
          ? (function (e) {
              var t = v(h(e)),
                r = 0 <= ['absolute', 'fixed'].indexOf(c(e).position) && o(e) ? b(e) : e;
              return n(r)
                ? t.filter(function (e) {
                    return n(e) && O(e, r) && 'body' !== s(e);
                  })
                : [];
            })(e)
          : [].concat(t)),
      ((r = (r = [].concat(t, [r])).reduce(
        function (t, n) {
          return (
            (n = E(e, n)),
            (t.top = z(n.top, t.top)),
            (t.right = F(n.right, t.right)),
            (t.bottom = F(n.bottom, t.bottom)),
            (t.left = z(n.left, t.left)),
            t
          );
        },
        E(e, r[0]),
      )).width = r.right - r.left),
      (r.height = r.bottom - r.top),
      (r.x = r.left),
      (r.y = r.top),
      r
    );
  }

  function L(e) {
    return e.split('-')[1];
  }

  function M(e) {
    return 0 <= ['top', 'bottom'].indexOf(e) ? 'x' : 'y';
  }

  function P(e) {
    var t = e.reference,
      n = e.element,
      o = (e = e.placement) ? x(e) : null;
    e = e ? L(e) : null;
    var r = t.x + t.width / 2 - n.width / 2,
      i = t.y + t.height / 2 - n.height / 2;

    switch (o) {
      case 'top':
        r = {
          x: r,
          y: t.y - n.height,
        };
        break;

      case 'bottom':
        r = {
          x: r,
          y: t.y + t.height,
        };
        break;

      case 'right':
        r = {
          x: t.x + t.width,
          y: i,
        };
        break;

      case 'left':
        r = {
          x: t.x - n.width,
          y: i,
        };
        break;

      default:
        r = {
          x: t.x,
          y: t.y,
        };
    }

    if (null != (o = o ? M(o) : null))
      switch (((i = 'y' === o ? 'height' : 'width'), e)) {
        case 'start':
          r[o] -= t[i] / 2 - n[i] / 2;
          break;

        case 'end':
          r[o] += t[i] / 2 - n[i] / 2;
      }
    return r;
  }

  function k(e) {
    return Object.assign(
      {},
      {
        top: 0,
        right: 0,
        bottom: 0,
        left: 0,
      },
      e,
    );
  }

  function W(e, t) {
    return t.reduce(function (t, n) {
      return ((t[n] = e), t);
    }, {});
  }

  function A(e, t) {
    void 0 === t && (t = {});
    var o = t;
    t = void 0 === (t = o.placement) ? e.placement : t;
    var r = o.boundary,
      a = void 0 === r ? 'clippingParents' : r,
      s = void 0 === (r = o.rootBoundary) ? 'viewport' : r;
    r = void 0 === (r = o.elementContext) ? 'popper' : r;
    var p = o.altBoundary,
      c = void 0 !== p && p;
    ((o = k('number' != typeof (o = void 0 === (o = o.padding) ? 0 : o) ? o : W(o, V))),
      (p = e.rects.popper),
      (a = D(
        n((c = e.elements[c ? ('popper' === r ? 'reference' : 'popper') : r]))
          ? c
          : c.contextElement || f(e.elements.popper),
        a,
        s,
      )),
      (c = P({
        reference: (s = i(e.elements.reference)),
        element: p,
        strategy: 'absolute',
        placement: t,
      })),
      (p = j(Object.assign({}, p, c))),
      (s = 'popper' === r ? p : s));
    var l = {
      top: a.top - s.top + o.top,
      bottom: s.bottom - a.bottom + o.bottom,
      left: a.left - s.left + o.left,
      right: s.right - a.right + o.right,
    };

    if (((e = e.modifiersData.offset), 'popper' === r && e)) {
      var u = e[t];
      Object.keys(l).forEach(function (e) {
        var t = 0 <= ['right', 'bottom'].indexOf(e) ? 1 : -1,
          n = 0 <= ['top', 'bottom'].indexOf(e) ? 'y' : 'x';
        l[e] += u[n] * t;
      });
    }

    return l;
  }

  function B() {
    for (var e = arguments.length, t = Array(e), n = 0; n < e; n++) {
      t[n] = arguments[n];
    }

    return !t.some(function (e) {
      return !(e && 'function' == typeof e.getBoundingClientRect);
    });
  }

  function H(e) {
    void 0 === e && (e = {});
    var t = e.defaultModifiers,
      o = void 0 === t ? [] : t,
      r = void 0 === (e = e.defaultOptions) ? Y : e;
    return function (e, t, i) {
      function a() {
        (f.forEach(function (e) {
          return e();
        }),
          (f = []));
      }

      void 0 === i && (i = r);
      var s = {
          placement: 'bottom',
          orderedModifiers: [],
          options: Object.assign({}, Y, r),
          modifiersData: {},
          elements: {
            reference: e,
            popper: t,
          },
          attributes: {},
          styles: {},
        },
        f = [],
        p = !1,
        c = {
          state: s,
          setOptions: function setOptions(i) {
            return (
              (i = 'function' == typeof i ? i(s.options) : i),
              a(),
              (s.options = Object.assign({}, r, s.options, i)),
              (s.scrollParents = {
                reference: n(e) ? v(e) : e.contextElement ? v(e.contextElement) : [],
                popper: v(t),
              }),
              (i = (function (e) {
                var t = y(e);
                return U.reduce(function (e, n) {
                  return e.concat(
                    t.filter(function (e) {
                      return e.phase === n;
                    }),
                  );
                }, []);
              })(
                (function (e) {
                  var t = e.reduce(function (e, t) {
                    var n = e[t.name];
                    return (
                      (e[t.name] = n
                        ? Object.assign({}, n, t, {
                            options: Object.assign({}, n.options, t.options),
                            data: Object.assign({}, n.data, t.data),
                          })
                        : t),
                      e
                    );
                  }, {});
                  return Object.keys(t).map(function (e) {
                    return t[e];
                  });
                })([].concat(o, s.options.modifiers)),
              )),
              (s.orderedModifiers = i.filter(function (e) {
                return e.enabled;
              })),
              s.orderedModifiers.forEach(function (e) {
                var t = e.name,
                  n = e.options;
                ((n = void 0 === n ? {} : n),
                  'function' == typeof (e = e.effect) &&
                    ((t = e({
                      state: s,
                      name: t,
                      instance: c,
                      options: n,
                    })),
                    f.push(t || function () {})));
              }),
              c.update()
            );
          },
          forceUpdate: function forceUpdate() {
            if (!p) {
              var e = s.elements,
                t = e.reference;
              if (B(t, (e = e.popper)))
                for (
                  s.rects = {
                    reference: u(t, b(e), 'fixed' === s.options.strategy),
                    popper: d(e),
                  },
                    s.reset = !1,
                    s.placement = s.options.placement,
                    s.orderedModifiers.forEach(function (e) {
                      return (s.modifiersData[e.name] = Object.assign({}, e.data));
                    }),
                    t = 0;
                  t < s.orderedModifiers.length;
                  t++
                ) {
                  if (!0 === s.reset) ((s.reset = !1), (t = -1));
                  else {
                    var n = s.orderedModifiers[t];
                    e = n.fn;
                    var o = n.options;
                    ((o = void 0 === o ? {} : o),
                      (n = n.name),
                      'function' == typeof e &&
                        (s =
                          e({
                            state: s,
                            options: o,
                            name: n,
                            instance: c,
                          }) || s));
                  }
                }
            }
          },
          update: w(function () {
            return new Promise(function (e) {
              (c.forceUpdate(), e(s));
            });
          }),
          destroy: function destroy() {
            (a(), (p = !0));
          },
        };
      return B(e, t)
        ? (c.setOptions(i).then(function (e) {
            !p && i.onFirstUpdate && i.onFirstUpdate(e);
          }),
          c)
        : c;
    };
  }

  function T(e) {
    var n,
      o = e.popper,
      r = e.popperRect,
      i = e.placement,
      a = e.variation,
      s = e.offsets,
      p = e.position,
      l = e.gpuAcceleration,
      u = e.adaptive;

    if (!0 === (e = e.roundOffsets)) {
      e = s.y;
      var d = window.devicePixelRatio || 1;
      e = {
        x: X(X(s.x * d) / d) || 0,
        y: X(X(e * d) / d) || 0,
      };
    } else e = 'function' == typeof e ? e(s) : s;

    ((e = void 0 === (e = (d = e).x) ? 0 : e), (d = void 0 === (d = d.y) ? 0 : d));
    var h = s.hasOwnProperty('x');
    s = s.hasOwnProperty('y');
    var m,
      v = 'left',
      g = 'top',
      y = window;

    if (u) {
      var w = b(o),
        x = 'clientHeight',
        O = 'clientWidth';
      (w === t(o) &&
        'static' !== c((w = f(o))).position &&
        'absolute' === p &&
        ((x = 'scrollHeight'), (O = 'scrollWidth')),
        ('top' !== i && (('left' !== i && 'right' !== i) || 'end' !== a)) ||
          ((g = 'bottom'), (d -= w[x] - r.height), (d *= l ? 1 : -1)),
        ('left' !== i && (('top' !== i && 'bottom' !== i) || 'end' !== a)) ||
          ((v = 'right'), (e -= w[O] - r.width), (e *= l ? 1 : -1)));
    }

    return (
      (o = Object.assign(
        {
          position: p,
        },
        u && Q,
      )),
      l
        ? Object.assign(
            {},
            o,
            (((m = {})[g] = s ? '0' : ''),
            (m[v] = h ? '0' : ''),
            (m.transform =
              1 >= (y.devicePixelRatio || 1)
                ? 'translate(' + e + 'px, ' + d + 'px)'
                : 'translate3d(' + e + 'px, ' + d + 'px, 0)'),
            m),
          )
        : Object.assign({}, o, (((n = {})[g] = s ? d + 'px' : ''), (n[v] = h ? e + 'px' : ''), (n.transform = ''), n))
    );
  }

  function R(e) {
    return e.replace(/left|right|bottom|top/g, function (e) {
      return te[e];
    });
  }

  function S(e) {
    return e.replace(/start|end/g, function (e) {
      return ne[e];
    });
  }

  function C(e, t, n) {
    return (
      void 0 === n &&
        (n = {
          x: 0,
          y: 0,
        }),
      {
        top: e.top - t.height - n.y,
        right: e.right - t.width + n.x,
        bottom: e.bottom - t.height + n.y,
        left: e.left - t.width - n.x,
      }
    );
  }

  function q(e) {
    return ['top', 'right', 'bottom', 'left'].some(function (t) {
      return 0 <= e[t];
    });
  }

  var N = Math.round,
    V = ['top', 'bottom', 'right', 'left'],
    I = V.reduce(function (e, t) {
      return e.concat([t + '-start', t + '-end']);
    }, []),
    _ = [].concat(V, ['auto']).reduce(function (e, t) {
      return e.concat([t, t + '-start', t + '-end']);
    }, []),
    U = 'beforeRead read afterRead beforeMain main afterMain beforeWrite write afterWrite'.split(' '),
    z = Math.max,
    F = Math.min,
    X = Math.round,
    Y = {
      placement: 'bottom',
      modifiers: [],
      strategy: 'absolute',
    },
    G = {
      passive: !0,
    },
    J = {
      name: 'eventListeners',
      enabled: !0,
      phase: 'write',
      fn: function fn() {},
      effect: function effect(e) {
        var n = e.state,
          o = e.instance,
          r = (e = e.options).scroll,
          i = void 0 === r || r,
          a = void 0 === (e = e.resize) || e,
          s = t(n.elements.popper),
          f = [].concat(n.scrollParents.reference, n.scrollParents.popper);
        return (
          i &&
            f.forEach(function (e) {
              e.addEventListener('scroll', o.update, G);
            }),
          a && s.addEventListener('resize', o.update, G),
          function () {
            (i &&
              f.forEach(function (e) {
                e.removeEventListener('scroll', o.update, G);
              }),
              a && s.removeEventListener('resize', o.update, G));
          }
        );
      },
      data: {},
    },
    K = {
      name: 'popperOffsets',
      enabled: !0,
      phase: 'read',
      fn: function fn(e) {
        var t = e.state;
        t.modifiersData[e.name] = P({
          reference: t.rects.reference,
          element: t.rects.popper,
          strategy: 'absolute',
          placement: t.placement,
        });
      },
      data: {},
    },
    Q = {
      top: 'auto',
      right: 'auto',
      bottom: 'auto',
      left: 'auto',
    },
    Z = {
      name: 'computeStyles',
      enabled: !0,
      phase: 'beforeWrite',
      fn: function fn(e) {
        var t = e.state,
          n = e.options;
        e = void 0 === (e = n.gpuAcceleration) || e;
        var o = n.adaptive;
        ((o = void 0 === o || o),
          (n = void 0 === (n = n.roundOffsets) || n),
          (e = {
            placement: x(t.placement),
            variation: L(t.placement),
            popper: t.elements.popper,
            popperRect: t.rects.popper,
            gpuAcceleration: e,
          }),
          null != t.modifiersData.popperOffsets &&
            (t.styles.popper = Object.assign(
              {},
              t.styles.popper,
              T(
                Object.assign({}, e, {
                  offsets: t.modifiersData.popperOffsets,
                  position: t.options.strategy,
                  adaptive: o,
                  roundOffsets: n,
                }),
              ),
            )),
          null != t.modifiersData.arrow &&
            (t.styles.arrow = Object.assign(
              {},
              t.styles.arrow,
              T(
                Object.assign({}, e, {
                  offsets: t.modifiersData.arrow,
                  position: 'absolute',
                  adaptive: !1,
                  roundOffsets: n,
                }),
              ),
            )),
          (t.attributes.popper = Object.assign({}, t.attributes.popper, {
            'data-popper-placement': t.placement,
          })));
      },
      data: {},
    },
    $ = {
      name: 'applyStyles',
      enabled: !0,
      phase: 'write',
      fn: function fn(e) {
        var t = e.state;
        Object.keys(t.elements).forEach(function (e) {
          var n = t.styles[e] || {},
            r = t.attributes[e] || {},
            i = t.elements[e];
          o(i) &&
            s(i) &&
            (Object.assign(i.style, n),
            Object.keys(r).forEach(function (e) {
              var t = r[e];
              !1 === t ? i.removeAttribute(e) : i.setAttribute(e, !0 === t ? '' : t);
            }));
        });
      },
      effect: function effect(e) {
        var t = e.state,
          n = {
            popper: {
              position: t.options.strategy,
              left: '0',
              top: '0',
              margin: '0',
            },
            arrow: {
              position: 'absolute',
            },
            reference: {},
          };
        return (
          Object.assign(t.elements.popper.style, n.popper),
          (t.styles = n),
          t.elements.arrow && Object.assign(t.elements.arrow.style, n.arrow),
          function () {
            Object.keys(t.elements).forEach(function (e) {
              var r = t.elements[e],
                i = t.attributes[e] || {};
              ((e = Object.keys(t.styles.hasOwnProperty(e) ? t.styles[e] : n[e]).reduce(function (e, t) {
                return ((e[t] = ''), e);
              }, {})),
                o(r) &&
                  s(r) &&
                  (Object.assign(r.style, e),
                  Object.keys(i).forEach(function (e) {
                    r.removeAttribute(e);
                  })));
            });
          }
        );
      },
      requires: ['computeStyles'],
    },
    ee = {
      name: 'offset',
      enabled: !0,
      phase: 'main',
      requires: ['popperOffsets'],
      fn: function fn(e) {
        var t = e.state,
          n = e.name,
          o = void 0 === (e = e.options.offset) ? [0, 0] : e,
          r = (e = _.reduce(function (e, n) {
            var r = t.rects,
              i = x(n),
              a = 0 <= ['left', 'top'].indexOf(i) ? -1 : 1,
              s =
                'function' == typeof o
                  ? o(
                      Object.assign({}, r, {
                        placement: n,
                      }),
                    )
                  : o;
            return (
              (r = (r = s[0]) || 0),
              (s = ((s = s[1]) || 0) * a),
              (i =
                0 <= ['left', 'right'].indexOf(i)
                  ? {
                      x: s,
                      y: r,
                    }
                  : {
                      x: r,
                      y: s,
                    }),
              (e[n] = i),
              e
            );
          }, {}))[t.placement],
          i = r.x;

        ((r = r.y),
          null != t.modifiersData.popperOffsets &&
            ((t.modifiersData.popperOffsets.x += i), (t.modifiersData.popperOffsets.y += r)),
          (t.modifiersData[n] = e));
      },
    },
    te = {
      left: 'right',
      right: 'left',
      bottom: 'top',
      top: 'bottom',
    },
    ne = {
      start: 'end',
      end: 'start',
    },
    oe = {
      name: 'flip',
      enabled: !0,
      phase: 'main',
      fn: function fn(e) {
        var t = e.state,
          n = e.options;

        if (((e = e.name), !t.modifiersData[e]._skip)) {
          var o = n.mainAxis;
          o = void 0 === o || o;
          var r = n.altAxis;
          r = void 0 === r || r;
          var i = n.fallbackPlacements,
            a = n.padding,
            s = n.boundary,
            f = n.rootBoundary,
            p = n.altBoundary,
            c = n.flipVariations,
            l = void 0 === c || c,
            u = n.allowedAutoPlacements;
          ((c = x((n = t.options.placement))),
            (i =
              i ||
              (c !== n && l
                ? (function (e) {
                    if ('auto' === x(e)) return [];
                    var t = R(e);
                    return [S(e), t, S(t)];
                  })(n)
                : [R(n)])));
          var d = [n].concat(i).reduce(function (e, n) {
            return e.concat(
              'auto' === x(n)
                ? (function (e, t) {
                    void 0 === t && (t = {});
                    var n = t.boundary,
                      o = t.rootBoundary,
                      r = t.padding,
                      i = t.flipVariations,
                      a = t.allowedAutoPlacements,
                      s = void 0 === a ? _ : a,
                      f = L(t.placement);
                    0 ===
                      (i = (t = f
                        ? i
                          ? I
                          : I.filter(function (e) {
                              return L(e) === f;
                            })
                        : V).filter(function (e) {
                        return 0 <= s.indexOf(e);
                      })).length && (i = t);
                    var p = i.reduce(function (t, i) {
                      return (
                        (t[i] = A(e, {
                          placement: i,
                          boundary: n,
                          rootBoundary: o,
                          padding: r,
                        })[x(i)]),
                        t
                      );
                    }, {});
                    return Object.keys(p).sort(function (e, t) {
                      return p[e] - p[t];
                    });
                  })(t, {
                    placement: n,
                    boundary: s,
                    rootBoundary: f,
                    padding: a,
                    flipVariations: l,
                    allowedAutoPlacements: u,
                  })
                : n,
            );
          }, []);
          ((n = t.rects.reference), (i = t.rects.popper));
          var h = new Map();
          c = !0;

          for (var m = d[0], v = 0; v < d.length; v++) {
            var g = d[v],
              b = x(g),
              y = 'start' === L(g),
              w = 0 <= ['top', 'bottom'].indexOf(b),
              O = w ? 'width' : 'height',
              j = A(t, {
                placement: g,
                boundary: s,
                rootBoundary: f,
                altBoundary: p,
                padding: a,
              });

            if (
              ((y = w ? (y ? 'right' : 'left') : y ? 'bottom' : 'top'),
              n[O] > i[O] && (y = R(y)),
              (O = R(y)),
              (w = []),
              o && w.push(0 >= j[b]),
              r && w.push(0 >= j[y], 0 >= j[O]),
              w.every(function (e) {
                return e;
              }))
            ) {
              ((m = g), (c = !1));
              break;
            }

            h.set(g, w);
          }

          if (c)
            for (
              o = function o(e) {
                var t = d.find(function (t) {
                  if ((t = h.get(t)))
                    return t.slice(0, e).every(function (e) {
                      return e;
                    });
                });
                if (t) return ((m = t), 'break');
              },
                r = l ? 3 : 1;
              0 < r && 'break' !== o(r);
              r--
            ) {}
          t.placement !== m && ((t.modifiersData[e]._skip = !0), (t.placement = m), (t.reset = !0));
        }
      },
      requiresIfExists: ['offset'],
      data: {
        _skip: !1,
      },
    },
    re = {
      name: 'preventOverflow',
      enabled: !0,
      phase: 'main',
      fn: function fn(e) {
        var t = e.state,
          n = e.options;
        e = e.name;
        var o = n.mainAxis,
          r = void 0 === o || o,
          i = void 0 !== (o = n.altAxis) && o;
        o = void 0 === (o = n.tether) || o;
        var a = n.tetherOffset,
          s = void 0 === a ? 0 : a,
          f = A(t, {
            boundary: n.boundary,
            rootBoundary: n.rootBoundary,
            padding: n.padding,
            altBoundary: n.altBoundary,
          });
        n = x(t.placement);
        var p = L(t.placement),
          c = !p,
          l = M(n);
        ((n = 'x' === l ? 'y' : 'x'), (a = t.modifiersData.popperOffsets));
        var u = t.rects.reference,
          h = t.rects.popper,
          m =
            'function' == typeof s
              ? s(
                  Object.assign({}, t.rects, {
                    placement: t.placement,
                  }),
                )
              : s;

        if (
          ((s = {
            x: 0,
            y: 0,
          }),
          a)
        ) {
          if (r || i) {
            var v = 'y' === l ? 'top' : 'left',
              g = 'y' === l ? 'bottom' : 'right',
              y = 'y' === l ? 'height' : 'width',
              w = a[l],
              O = a[l] + f[v],
              j = a[l] - f[g],
              E = o ? -h[y] / 2 : 0,
              D = 'start' === p ? u[y] : h[y];
            ((p = 'start' === p ? -h[y] : -u[y]),
              (h = t.elements.arrow),
              (h =
                o && h
                  ? d(h)
                  : {
                      width: 0,
                      height: 0,
                    }));
            var P = t.modifiersData['arrow#persistent']
              ? t.modifiersData['arrow#persistent'].padding
              : {
                  top: 0,
                  right: 0,
                  bottom: 0,
                  left: 0,
                };
            ((v = P[v]),
              (g = P[g]),
              (h = z(0, F(u[y], h[y]))),
              (D = c ? u[y] / 2 - E - h - v - m : D - h - v - m),
              (u = c ? -u[y] / 2 + E + h + g + m : p + h + g + m),
              (c = t.elements.arrow && b(t.elements.arrow)),
              (m = t.modifiersData.offset ? t.modifiersData.offset[t.placement][l] : 0),
              (c = a[l] + D - m - (c ? ('y' === l ? c.clientTop || 0 : c.clientLeft || 0) : 0)),
              (u = a[l] + u - m),
              r && ((r = o ? F(O, c) : O), (j = o ? z(j, u) : j), (r = z(r, F(w, j))), (a[l] = r), (s[l] = r - w)),
              i &&
                ((r = (i = a[n]) + f['x' === l ? 'top' : 'left']),
                (f = i - f['x' === l ? 'bottom' : 'right']),
                (r = o ? F(r, c) : r),
                (o = o ? z(f, u) : f),
                (o = z(r, F(i, o))),
                (a[n] = o),
                (s[n] = o - i)));
          }

          t.modifiersData[e] = s;
        }
      },
      requiresIfExists: ['offset'],
    },
    ie = {
      name: 'arrow',
      enabled: !0,
      phase: 'main',
      fn: function fn(e) {
        var t,
          n = e.state,
          o = e.name,
          r = e.options,
          i = n.elements.arrow,
          a = n.modifiersData.popperOffsets,
          s = x(n.placement);

        if (((e = M(s)), (s = 0 <= ['left', 'right'].indexOf(s) ? 'height' : 'width'), i && a)) {
          r = k(
            'number' !=
              typeof (r =
                'function' == typeof (r = r.padding)
                  ? r(
                      Object.assign({}, n.rects, {
                        placement: n.placement,
                      }),
                    )
                  : r)
              ? r
              : W(r, V),
          );
          var f = d(i),
            p = 'y' === e ? 'top' : 'left',
            c = 'y' === e ? 'bottom' : 'right',
            l = n.rects.reference[s] + n.rects.reference[e] - a[e] - n.rects.popper[s];
          ((a = a[e] - n.rects.reference[e]),
            (a =
              (i = (i = b(i)) ? ('y' === e ? i.clientHeight || 0 : i.clientWidth || 0) : 0) / 2 -
              f[s] / 2 +
              (l / 2 - a / 2)),
            (s = z(r[p], F(a, i - f[s] - r[c]))),
            (n.modifiersData[o] = (((t = {})[e] = s), (t.centerOffset = s - a), t)));
        }
      },
      effect: function effect(e) {
        var t = e.state;

        if (null != (e = void 0 === (e = e.options.element) ? '[data-popper-arrow]' : e)) {
          if ('string' == typeof e && !(e = t.elements.popper.querySelector(e))) return;
          O(t.elements.popper, e) && (t.elements.arrow = e);
        }
      },
      requires: ['popperOffsets'],
      requiresIfExists: ['preventOverflow'],
    },
    ae = {
      name: 'hide',
      enabled: !0,
      phase: 'main',
      requiresIfExists: ['preventOverflow'],
      fn: function fn(e) {
        var t = e.state;
        e = e.name;
        var n = t.rects.reference,
          o = t.rects.popper,
          r = t.modifiersData.preventOverflow,
          i = A(t, {
            elementContext: 'reference',
          }),
          a = A(t, {
            altBoundary: !0,
          });
        ((n = C(i, n)),
          (o = C(a, o, r)),
          (r = q(n)),
          (a = q(o)),
          (t.modifiersData[e] = {
            referenceClippingOffsets: n,
            popperEscapeOffsets: o,
            isReferenceHidden: r,
            hasPopperEscaped: a,
          }),
          (t.attributes.popper = Object.assign({}, t.attributes.popper, {
            'data-popper-reference-hidden': r,
            'data-popper-escaped': a,
          })));
      },
    },
    se = H({
      defaultModifiers: [J, K, Z, $],
    }),
    fe = [J, K, Z, $, ee, oe, re, ie, ae],
    pe = H({
      defaultModifiers: fe,
    });

  ((e.applyStyles = $),
    (e.arrow = ie),
    (e.computeStyles = Z),
    (e.createPopper = pe),
    (e.createPopperLite = se),
    (e.defaultModifiers = fe),
    (e.detectOverflow = A),
    (e.eventListeners = J),
    (e.flip = oe),
    (e.hide = ae),
    (e.offset = ee),
    (e.popperGenerator = H),
    (e.popperOffsets = K),
    (e.preventOverflow = re),
    Object.defineProperty(e, '__esModule', {
      value: !0,
    }));
});
('use strict');

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest()
  );
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : (typeof Symbol !== 'undefined' && arr[Symbol.iterator]) || arr['@@iterator'];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap event-handler.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self), (global.EventHandler = factory()));
})(void 0, function () {
  'use strict';
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  var getjQuery = function getjQuery() {
    var _window = window,
      jQuery = _window.jQuery;

    if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
      return jQuery;
    }

    return null;
  };
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): dom/event-handler.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var namespaceRegex = /[^.]*(?=\..*)\.|.*/;
  var stripNameRegex = /\..*/;
  var stripUidRegex = /::\d+$/;
  var eventRegistry = {}; // Events storage

  var uidEvent = 1;
  var customEvents = {
    mouseenter: 'mouseover',
    mouseleave: 'mouseout',
  };
  var customEventsRegex = /^(mouseenter|mouseleave)/i;
  var nativeEvents = new Set([
    'click',
    'dblclick',
    'mouseup',
    'mousedown',
    'contextmenu',
    'mousewheel',
    'DOMMouseScroll',
    'mouseover',
    'mouseout',
    'mousemove',
    'selectstart',
    'selectend',
    'keydown',
    'keypress',
    'keyup',
    'orientationchange',
    'touchstart',
    'touchmove',
    'touchend',
    'touchcancel',
    'pointerdown',
    'pointermove',
    'pointerup',
    'pointerleave',
    'pointercancel',
    'gesturestart',
    'gesturechange',
    'gestureend',
    'focus',
    'blur',
    'change',
    'reset',
    'select',
    'submit',
    'focusin',
    'focusout',
    'load',
    'unload',
    'beforeunload',
    'resize',
    'move',
    'DOMContentLoaded',
    'readystatechange',
    'error',
    'abort',
    'scroll',
  ]);
  /**
   * ------------------------------------------------------------------------
   * Private methods
   * ------------------------------------------------------------------------
   */

  function getUidEvent(element, uid) {
    return (uid && ''.concat(uid, '::').concat(uidEvent++)) || element.uidEvent || uidEvent++;
  }

  function getEvent(element) {
    var uid = getUidEvent(element);
    element.uidEvent = uid;
    eventRegistry[uid] = eventRegistry[uid] || {};
    return eventRegistry[uid];
  }

  function bootstrapHandler(element, fn) {
    return function handler(event) {
      event.delegateTarget = element;

      if (handler.oneOff) {
        EventHandler.off(element, event.type, fn);
      }

      return fn.apply(element, [event]);
    };
  }

  function bootstrapDelegationHandler(element, selector, fn) {
    return function handler(event) {
      var domElements = element.querySelectorAll(selector);

      for (var target = event.target; target && target !== this; target = target.parentNode) {
        for (var i = domElements.length; i--; ) {
          if (domElements[i] === target) {
            event.delegateTarget = target;

            if (handler.oneOff) {
              EventHandler.off(element, event.type, selector, fn);
            }

            return fn.apply(target, [event]);
          }
        }
      } // To please ESLint

      return null;
    };
  }

  function findHandler(events, handler) {
    var delegationSelector = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : null;
    var uidEventList = Object.keys(events);

    for (var i = 0, len = uidEventList.length; i < len; i++) {
      var event = events[uidEventList[i]];

      if (event.originalHandler === handler && event.delegationSelector === delegationSelector) {
        return event;
      }
    }

    return null;
  }

  function normalizeParams(originalTypeEvent, handler, delegationFn) {
    var delegation = typeof handler === 'string';
    var originalHandler = delegation ? delegationFn : handler;
    var typeEvent = getTypeEvent(originalTypeEvent);
    var isNative = nativeEvents.has(typeEvent);

    if (!isNative) {
      typeEvent = originalTypeEvent;
    }

    return [delegation, originalHandler, typeEvent];
  }

  function addHandler(element, originalTypeEvent, handler, delegationFn, oneOff) {
    if (typeof originalTypeEvent !== 'string' || !element) {
      return;
    }

    if (!handler) {
      handler = delegationFn;
      delegationFn = null;
    } // in case of mouseenter or mouseleave wrap the handler within a function that checks for its DOM position
    // this prevents the handler from being dispatched the same way as mouseover or mouseout does

    if (customEventsRegex.test(originalTypeEvent)) {
      var wrapFn = function wrapFn(fn) {
        return function (event) {
          if (
            !event.relatedTarget ||
            (event.relatedTarget !== event.delegateTarget && !event.delegateTarget.contains(event.relatedTarget))
          ) {
            return fn.call(this, event);
          }
        };
      };

      if (delegationFn) {
        delegationFn = wrapFn(delegationFn);
      } else {
        handler = wrapFn(handler);
      }
    }

    var _normalizeParams = normalizeParams(originalTypeEvent, handler, delegationFn),
      _normalizeParams2 = _slicedToArray(_normalizeParams, 3),
      delegation = _normalizeParams2[0],
      originalHandler = _normalizeParams2[1],
      typeEvent = _normalizeParams2[2];

    var events = getEvent(element);
    var handlers = events[typeEvent] || (events[typeEvent] = {});
    var previousFn = findHandler(handlers, originalHandler, delegation ? handler : null);

    if (previousFn) {
      previousFn.oneOff = previousFn.oneOff && oneOff;
      return;
    }

    var uid = getUidEvent(originalHandler, originalTypeEvent.replace(namespaceRegex, ''));
    var fn = delegation
      ? bootstrapDelegationHandler(element, handler, delegationFn)
      : bootstrapHandler(element, handler);
    fn.delegationSelector = delegation ? handler : null;
    fn.originalHandler = originalHandler;
    fn.oneOff = oneOff;
    fn.uidEvent = uid;
    handlers[uid] = fn;
    element.addEventListener(typeEvent, fn, delegation);
  }

  function removeHandler(element, events, typeEvent, handler, delegationSelector) {
    var fn = findHandler(events[typeEvent], handler, delegationSelector);

    if (!fn) {
      return;
    }

    element.removeEventListener(typeEvent, fn, Boolean(delegationSelector));
    delete events[typeEvent][fn.uidEvent];
  }

  function removeNamespacedHandlers(element, events, typeEvent, namespace) {
    var storeElementEvent = events[typeEvent] || {};
    Object.keys(storeElementEvent).forEach(function (handlerKey) {
      if (handlerKey.includes(namespace)) {
        var event = storeElementEvent[handlerKey];
        removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
      }
    });
  }

  function getTypeEvent(event) {
    // allow to get the native events from namespaced events ('click.bs.button' --> 'click')
    event = event.replace(stripNameRegex, '');
    return customEvents[event] || event;
  }

  var EventHandler = {
    on: function on(element, event, handler, delegationFn) {
      addHandler(element, event, handler, delegationFn, false);
    },
    one: function one(element, event, handler, delegationFn) {
      addHandler(element, event, handler, delegationFn, true);
    },
    off: function off(element, originalTypeEvent, handler, delegationFn) {
      if (typeof originalTypeEvent !== 'string' || !element) {
        return;
      }

      var _normalizeParams3 = normalizeParams(originalTypeEvent, handler, delegationFn),
        _normalizeParams4 = _slicedToArray(_normalizeParams3, 3),
        delegation = _normalizeParams4[0],
        originalHandler = _normalizeParams4[1],
        typeEvent = _normalizeParams4[2];

      var inNamespace = typeEvent !== originalTypeEvent;
      var events = getEvent(element);
      var isNamespace = originalTypeEvent.startsWith('.');

      if (typeof originalHandler !== 'undefined') {
        // Simplest case: handler is passed, remove that listener ONLY.
        if (!events || !events[typeEvent]) {
          return;
        }

        removeHandler(element, events, typeEvent, originalHandler, delegation ? handler : null);
        return;
      }

      if (isNamespace) {
        Object.keys(events).forEach(function (elementEvent) {
          removeNamespacedHandlers(element, events, elementEvent, originalTypeEvent.slice(1));
        });
      }

      var storeElementEvent = events[typeEvent] || {};
      Object.keys(storeElementEvent).forEach(function (keyHandlers) {
        var handlerKey = keyHandlers.replace(stripUidRegex, '');

        if (!inNamespace || originalTypeEvent.includes(handlerKey)) {
          var event = storeElementEvent[keyHandlers];
          removeHandler(element, events, typeEvent, event.originalHandler, event.delegationSelector);
        }
      });
    },
    trigger: function trigger(element, event, args) {
      if (typeof event !== 'string' || !element) {
        return null;
      }

      var $ = getjQuery();
      var typeEvent = getTypeEvent(event);
      var inNamespace = event !== typeEvent;
      var isNative = nativeEvents.has(typeEvent);
      var jQueryEvent;
      var bubbles = true;
      var nativeDispatch = true;
      var defaultPrevented = false;
      var evt = null;

      if (inNamespace && $) {
        jQueryEvent = $.Event(event, args);
        $(element).trigger(jQueryEvent);
        bubbles = !jQueryEvent.isPropagationStopped();
        nativeDispatch = !jQueryEvent.isImmediatePropagationStopped();
        defaultPrevented = jQueryEvent.isDefaultPrevented();
      }

      if (isNative) {
        evt = document.createEvent('HTMLEvents');
        evt.initEvent(typeEvent, bubbles, true);
      } else {
        evt = new CustomEvent(event, {
          bubbles: bubbles,
          cancelable: true,
        });
      } // merge custom information in our event

      if (typeof args !== 'undefined') {
        Object.keys(args).forEach(function (key) {
          Object.defineProperty(evt, key, {
            get: function get() {
              return args[key];
            },
          });
        });
      }

      if (defaultPrevented) {
        evt.preventDefault();
      }

      if (nativeDispatch) {
        element.dispatchEvent(evt);
      }

      if (evt.defaultPrevented && typeof jQueryEvent !== 'undefined') {
        jQueryEvent.preventDefault();
      }

      return evt;
    },
  };
  return EventHandler;
});
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap data.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self), (global.Data = factory()));
})(void 0, function () {
  'use strict';
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): dom/data.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var elementMap = new Map();
  var data = {
    set: function set(element, key, instance) {
      if (!elementMap.has(element)) {
        elementMap.set(element, new Map());
      }

      var instanceMap = elementMap.get(element); // make it clear we only want one instance per element
      // can be removed later when multiple key/instances are fine to be used

      if (!instanceMap.has(key) && instanceMap.size !== 0) {
        // eslint-disable-next-line no-console
        console.error(
          "Bootstrap doesn't allow more than one instance per element. Bound instance: ".concat(
            Array.from(instanceMap.keys())[0],
            '.',
          ),
        );
        return;
      }

      instanceMap.set(key, instance);
    },
    get: function get(element, key) {
      if (elementMap.has(element)) {
        return elementMap.get(element).get(key) || null;
      }

      return null;
    },
    remove: function remove(element, key) {
      if (!elementMap.has(element)) {
        return;
      }

      var instanceMap = elementMap.get(element);
      instanceMap.delete(key); // free up element references if there are no instances left for an element

      if (instanceMap.size === 0) {
        elementMap.delete(element);
      }
    },
  };
  return data;
});
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap manipulator.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self), (global.Manipulator = factory()));
})(void 0, function () {
  'use strict';
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): dom/manipulator.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  function normalizeData(val) {
    if (val === 'true') {
      return true;
    }

    if (val === 'false') {
      return false;
    }

    if (val === Number(val).toString()) {
      return Number(val);
    }

    if (val === '' || val === 'null') {
      return null;
    }

    return val;
  }

  function normalizeDataKey(key) {
    return key.replace(/[A-Z]/g, function (chr) {
      return '-'.concat(chr.toLowerCase());
    });
  }

  var Manipulator = {
    setDataAttribute: function setDataAttribute(element, key, value) {
      element.setAttribute('data-bs-'.concat(normalizeDataKey(key)), value);
    },
    removeDataAttribute: function removeDataAttribute(element, key) {
      element.removeAttribute('data-bs-'.concat(normalizeDataKey(key)));
    },
    getDataAttributes: function getDataAttributes(element) {
      if (!element) {
        return {};
      }

      var attributes = {};
      Object.keys(element.dataset)
        .filter(function (key) {
          return key.startsWith('bs');
        })
        .forEach(function (key) {
          var pureKey = key.replace(/^bs/, '');
          pureKey = pureKey.charAt(0).toLowerCase() + pureKey.slice(1, pureKey.length);
          attributes[pureKey] = normalizeData(element.dataset[key]);
        });
      return attributes;
    },
    getDataAttribute: function getDataAttribute(element, key) {
      return normalizeData(element.getAttribute('data-bs-'.concat(normalizeDataKey(key))));
    },
    offset: function offset(element) {
      var rect = element.getBoundingClientRect();
      return {
        top: rect.top + window.pageYOffset,
        left: rect.left + window.pageXOffset,
      };
    },
    position: function position(element) {
      return {
        top: element.offsetTop,
        left: element.offsetLeft,
      };
    },
  };
  return Manipulator;
});
('use strict');

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError(
    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if ((typeof Symbol !== 'undefined' && iter[Symbol.iterator] != null) || iter['@@iterator'] != null)
    return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap selector-engine.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
        (global.SelectorEngine = factory()));
})(void 0, function () {
  'use strict';
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  var isElement = function isElement(obj) {
    if (!obj || _typeof(obj) !== 'object') {
      return false;
    }

    if (typeof obj.jquery !== 'undefined') {
      obj = obj[0];
    }

    return typeof obj.nodeType !== 'undefined';
  };

  var isVisible = function isVisible(element) {
    if (!isElement(element) || element.getClientRects().length === 0) {
      return false;
    }

    return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
  };

  var isDisabled = function isDisabled(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    if (element.classList.contains('disabled')) {
      return true;
    }

    if (typeof element.disabled !== 'undefined') {
      return element.disabled;
    }

    return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
  };
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): dom/selector-engine.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  var NODE_TEXT = 3;
  var SelectorEngine = {
    find: function find(selector) {
      var _ref;

      var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.documentElement;
      return (_ref = []).concat.apply(
        _ref,
        _toConsumableArray(Element.prototype.querySelectorAll.call(element, selector)),
      );
    },
    findOne: function findOne(selector) {
      var element = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : document.documentElement;
      return Element.prototype.querySelector.call(element, selector);
    },
    children: function children(element, selector) {
      var _ref2;

      return (_ref2 = []).concat.apply(_ref2, _toConsumableArray(element.children)).filter(function (child) {
        return child.matches(selector);
      });
    },
    parents: function parents(element, selector) {
      var parents = [];
      var ancestor = element.parentNode;

      while (ancestor && ancestor.nodeType === Node.ELEMENT_NODE && ancestor.nodeType !== NODE_TEXT) {
        if (ancestor.matches(selector)) {
          parents.push(ancestor);
        }

        ancestor = ancestor.parentNode;
      }

      return parents;
    },
    prev: function prev(element, selector) {
      var previous = element.previousElementSibling;

      while (previous) {
        if (previous.matches(selector)) {
          return [previous];
        }

        previous = previous.previousElementSibling;
      }

      return [];
    },
    next: function next(element, selector) {
      var next = element.nextElementSibling;

      while (next) {
        if (next.matches(selector)) {
          return [next];
        }

        next = next.nextElementSibling;
      }

      return [];
    },
    focusableChildren: function focusableChildren(element) {
      var focusables = [
        'a',
        'button',
        'input',
        'textarea',
        'select',
        'details',
        '[tabindex]',
        '[contenteditable="true"]',
      ]
        .map(function (selector) {
          return ''.concat(selector, ':not([tabindex^="-"])');
        })
        .join(', ');
      return this.find(focusables, element).filter(function (el) {
        return !isDisabled(el) && isVisible(el);
      });
    },
  };
  return SelectorEngine;
});
('use strict');

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap base-component.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory(require('./dom/data.js'), require('./dom/event-handler.js')))
    : typeof define === 'function' && define.amd
      ? define(['./dom/data', './dom/event-handler'], factory)
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
        (global.Base = factory(global.Data, global.EventHandler)));
})(void 0, function (Data, EventHandler) {
  'use strict';

  function _interopDefaultLegacy(e) {
    return e && _typeof(e) === 'object' && 'default' in e
      ? e
      : {
          default: e,
        };
  }

  var Data__default = /*#__PURE__*/ _interopDefaultLegacy(Data);

  var EventHandler__default = /*#__PURE__*/ _interopDefaultLegacy(EventHandler);
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  var MILLISECONDS_MULTIPLIER = 1000;
  var TRANSITION_END = 'transitionend'; // Shoutout AngusCroll (https://goo.gl/pxwQGp)

  var getTransitionDurationFromElement = function getTransitionDurationFromElement(element) {
    if (!element) {
      return 0;
    } // Get transition-duration of the element

    var _window$getComputedSt = window.getComputedStyle(element),
      transitionDuration = _window$getComputedSt.transitionDuration,
      transitionDelay = _window$getComputedSt.transitionDelay;

    var floatTransitionDuration = Number.parseFloat(transitionDuration);
    var floatTransitionDelay = Number.parseFloat(transitionDelay); // Return 0 if element or transition duration is not found

    if (!floatTransitionDuration && !floatTransitionDelay) {
      return 0;
    } // If multiple durations are defined, take the first

    transitionDuration = transitionDuration.split(',')[0];
    transitionDelay = transitionDelay.split(',')[0];
    return (Number.parseFloat(transitionDuration) + Number.parseFloat(transitionDelay)) * MILLISECONDS_MULTIPLIER;
  };

  var triggerTransitionEnd = function triggerTransitionEnd(element) {
    element.dispatchEvent(new Event(TRANSITION_END));
  };

  var isElement = function isElement(obj) {
    if (!obj || _typeof(obj) !== 'object') {
      return false;
    }

    if (typeof obj.jquery !== 'undefined') {
      obj = obj[0];
    }

    return typeof obj.nodeType !== 'undefined';
  };

  var getElement = function getElement(obj) {
    if (isElement(obj)) {
      // it's a jQuery object or a node element
      return obj.jquery ? obj[0] : obj;
    }

    if (typeof obj === 'string' && obj.length > 0) {
      return document.querySelector(obj);
    }

    return null;
  };

  var execute = function execute(callback) {
    if (typeof callback === 'function') {
      callback();
    }
  };

  var executeAfterTransition = function executeAfterTransition(callback, transitionElement) {
    var waitForTransition = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;

    if (!waitForTransition) {
      execute(callback);
      return;
    }

    var durationPadding = 5;
    var emulatedDuration = getTransitionDurationFromElement(transitionElement) + durationPadding;
    var called = false;

    var handler = function handler(_ref) {
      var target = _ref.target;

      if (target !== transitionElement) {
        return;
      }

      called = true;
      transitionElement.removeEventListener(TRANSITION_END, handler);
      execute(callback);
    };

    transitionElement.addEventListener(TRANSITION_END, handler);
    setTimeout(function () {
      if (!called) {
        triggerTransitionEnd(transitionElement);
      }
    }, emulatedDuration);
  };
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): base-component.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var VERSION = '5.1.1';

  var BaseComponent = /*#__PURE__*/ (function () {
    function BaseComponent(element) {
      _classCallCheck(this, BaseComponent);

      element = getElement(element);

      if (!element) {
        return;
      }

      this._element = element;
      Data__default['default'].set(this._element, this.constructor.DATA_KEY, this);
    }

    _createClass(
      BaseComponent,
      [
        {
          key: 'dispose',
          value: function dispose() {
            var _this = this;

            Data__default['default'].remove(this._element, this.constructor.DATA_KEY);
            EventHandler__default['default'].off(this._element, this.constructor.EVENT_KEY);
            Object.getOwnPropertyNames(this).forEach(function (propertyName) {
              _this[propertyName] = null;
            });
          },
        },
        {
          key: '_queueCallback',
          value: function _queueCallback(callback, element) {
            var isAnimated = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : true;
            executeAfterTransition(callback, element, isAnimated);
          },
          /** Static */
        },
      ],
      [
        {
          key: 'getInstance',
          value: function getInstance(element) {
            return Data__default['default'].get(getElement(element), this.DATA_KEY);
          },
        },
        {
          key: 'getOrCreateInstance',
          value: function getOrCreateInstance(element) {
            var config = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
            return this.getInstance(element) || new this(element, _typeof(config) === 'object' ? config : null);
          },
        },
        {
          key: 'VERSION',
          get: function get() {
            return VERSION;
          },
        },
        {
          key: 'NAME',
          get: function get() {
            throw new Error('You have to implement the static method "NAME", for each component!');
          },
        },
        {
          key: 'DATA_KEY',
          get: function get() {
            return 'bs.'.concat(this.NAME);
          },
        },
        {
          key: 'EVENT_KEY',
          get: function get() {
            return '.'.concat(this.DATA_KEY);
          },
        },
      ],
    );

    return BaseComponent;
  })();

  return BaseComponent;
});
('use strict');

function ownKeys(object, enumerableOnly) {
  var keys = Object.keys(object);
  if (Object.getOwnPropertySymbols) {
    var symbols = Object.getOwnPropertySymbols(object);
    if (enumerableOnly) {
      symbols = symbols.filter(function (sym) {
        return Object.getOwnPropertyDescriptor(object, sym).enumerable;
      });
    }
    keys.push.apply(keys, symbols);
  }
  return keys;
}

function _objectSpread(target) {
  for (var i = 1; i < arguments.length; i++) {
    var source = arguments[i] != null ? arguments[i] : {};
    if (i % 2) {
      ownKeys(Object(source), true).forEach(function (key) {
        _defineProperty(target, key, source[key]);
      });
    } else if (Object.getOwnPropertyDescriptors) {
      Object.defineProperties(target, Object.getOwnPropertyDescriptors(source));
    } else {
      ownKeys(Object(source)).forEach(function (key) {
        Object.defineProperty(target, key, Object.getOwnPropertyDescriptor(source, key));
      });
    }
  }
  return target;
}

function _defineProperty(obj, key, value) {
  if (key in obj) {
    Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true });
  } else {
    obj[key] = value;
  }
  return obj;
}

function _toConsumableArray(arr) {
  return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread();
}

function _nonIterableSpread() {
  throw new TypeError(
    'Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _iterableToArray(iter) {
  if ((typeof Symbol !== 'undefined' && iter[Symbol.iterator] != null) || iter['@@iterator'] != null)
    return Array.from(iter);
}

function _arrayWithoutHoles(arr) {
  if (Array.isArray(arr)) return _arrayLikeToArray(arr);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _classCallCheck(instance, Constructor) {
  if (!(instance instanceof Constructor)) {
    throw new TypeError('Cannot call a class as a function');
  }
}

function _defineProperties(target, props) {
  for (var i = 0; i < props.length; i++) {
    var descriptor = props[i];
    descriptor.enumerable = descriptor.enumerable || false;
    descriptor.configurable = true;
    if ('value' in descriptor) descriptor.writable = true;
    Object.defineProperty(target, descriptor.key, descriptor);
  }
}

function _createClass(Constructor, protoProps, staticProps) {
  if (protoProps) _defineProperties(Constructor.prototype, protoProps);
  if (staticProps) _defineProperties(Constructor, staticProps);
  return Constructor;
}

function _get(target, property, receiver) {
  if (typeof Reflect !== 'undefined' && Reflect.get) {
    _get = Reflect.get;
  } else {
    _get = function _get(target, property, receiver) {
      var base = _superPropBase(target, property);
      if (!base) return;
      var desc = Object.getOwnPropertyDescriptor(base, property);
      if (desc.get) {
        return desc.get.call(receiver);
      }
      return desc.value;
    };
  }
  return _get(target, property, receiver || target);
}

function _superPropBase(object, property) {
  while (!Object.prototype.hasOwnProperty.call(object, property)) {
    object = _getPrototypeOf(object);
    if (object === null) break;
  }
  return object;
}

function _inherits(subClass, superClass) {
  if (typeof superClass !== 'function' && superClass !== null) {
    throw new TypeError('Super expression must either be null or a function');
  }
  subClass.prototype = Object.create(superClass && superClass.prototype, {
    constructor: { value: subClass, writable: true, configurable: true },
  });
  if (superClass) _setPrototypeOf(subClass, superClass);
}

function _setPrototypeOf(o, p) {
  _setPrototypeOf =
    Object.setPrototypeOf ||
    function _setPrototypeOf(o, p) {
      o.__proto__ = p;
      return o;
    };
  return _setPrototypeOf(o, p);
}

function _createSuper(Derived) {
  var hasNativeReflectConstruct = _isNativeReflectConstruct();
  return function _createSuperInternal() {
    var Super = _getPrototypeOf(Derived),
      result;
    if (hasNativeReflectConstruct) {
      var NewTarget = _getPrototypeOf(this).constructor;
      result = Reflect.construct(Super, arguments, NewTarget);
    } else {
      result = Super.apply(this, arguments);
    }
    return _possibleConstructorReturn(this, result);
  };
}

function _possibleConstructorReturn(self, call) {
  if (call && (_typeof(call) === 'object' || typeof call === 'function')) {
    return call;
  } else if (call !== void 0) {
    throw new TypeError('Derived constructors may only return object or undefined');
  }
  return _assertThisInitialized(self);
}

function _assertThisInitialized(self) {
  if (self === void 0) {
    throw new ReferenceError("this hasn't been initialised - super() hasn't been called");
  }
  return self;
}

function _isNativeReflectConstruct() {
  if (typeof Reflect === 'undefined' || !Reflect.construct) return false;
  if (Reflect.construct.sham) return false;
  if (typeof Proxy === 'function') return true;
  try {
    Boolean.prototype.valueOf.call(Reflect.construct(Boolean, [], function () {}));
    return true;
  } catch (e) {
    return false;
  }
}

function _getPrototypeOf(o) {
  _getPrototypeOf = Object.setPrototypeOf
    ? Object.getPrototypeOf
    : function _getPrototypeOf(o) {
        return o.__proto__ || Object.getPrototypeOf(o);
      };
  return _getPrototypeOf(o);
}

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * Bootstrap dropdown.js v5.1.1 (https://getbootstrap.com/)
 * Copyright 2011-2021 The Bootstrap Authors (https://github.com/twbs/bootstrap/graphs/contributors)
 * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
 */
(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory(
        require('@popperjs/core'),
        require('./dom/event-handler.js'),
        require('./dom/manipulator.js'),
        require('./dom/selector-engine.js'),
        require('./base-component.js'),
      ))
    : typeof define === 'function' && define.amd
      ? define(
          ['@popperjs/core', './dom/event-handler', './dom/manipulator', './dom/selector-engine', './base-component'],
          factory,
        )
      : ((global = typeof globalThis !== 'undefined' ? globalThis : global || self),
        (global.Dropdown = factory(
          global.Popper,
          global.EventHandler,
          global.Manipulator,
          global.SelectorEngine,
          global.Base,
        )));
})(void 0, function (Popper, EventHandler, Manipulator, SelectorEngine, BaseComponent) {
  'use strict';

  function _interopDefaultLegacy(e) {
    return e && _typeof(e) === 'object' && 'default' in e
      ? e
      : {
          default: e,
        };
  }

  function _interopNamespace(e) {
    if (e && e.__esModule) return e;
    var n = Object.create(null);

    if (e) {
      Object.keys(e).forEach(function (k) {
        if (k !== 'default') {
          var d = Object.getOwnPropertyDescriptor(e, k);
          Object.defineProperty(
            n,
            k,
            d.get
              ? d
              : {
                  enumerable: true,
                  get: function get() {
                    return e[k];
                  },
                },
          );
        }
      });
    }

    n['default'] = e;
    return Object.freeze(n);
  }

  var Popper__namespace = /*#__PURE__*/ _interopNamespace(Popper);

  var EventHandler__default = /*#__PURE__*/ _interopDefaultLegacy(EventHandler);

  var Manipulator__default = /*#__PURE__*/ _interopDefaultLegacy(Manipulator);

  var SelectorEngine__default = /*#__PURE__*/ _interopDefaultLegacy(SelectorEngine);

  var BaseComponent__default = /*#__PURE__*/ _interopDefaultLegacy(BaseComponent);
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): util/index.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  var toType = function toType(obj) {
    if (obj === null || obj === undefined) {
      return ''.concat(obj);
    }

    return {}.toString
      .call(obj)
      .match(/\s([a-z]+)/i)[1]
      .toLowerCase();
  };

  var getSelector = function getSelector(element) {
    var selector = element.getAttribute('data-bs-target');

    if (!selector || selector === '#') {
      var hrefAttr = element.getAttribute('href'); // The only valid content that could double as a selector are IDs or classes,
      // so everything starting with `#` or `.`. If a "real" URL is used as the selector,
      // `document.querySelector` will rightfully complain it is invalid.
      // See https://github.com/twbs/bootstrap/issues/32273

      if (!hrefAttr || (!hrefAttr.includes('#') && !hrefAttr.startsWith('.'))) {
        return null;
      } // Just in case some CMS puts out a full URL with the anchor appended

      if (hrefAttr.includes('#') && !hrefAttr.startsWith('#')) {
        hrefAttr = '#'.concat(hrefAttr.split('#')[1]);
      }

      selector = hrefAttr && hrefAttr !== '#' ? hrefAttr.trim() : null;
    }

    return selector;
  };

  var getElementFromSelector = function getElementFromSelector(element) {
    var selector = getSelector(element);
    return selector ? document.querySelector(selector) : null;
  };

  var isElement = function isElement(obj) {
    if (!obj || _typeof(obj) !== 'object') {
      return false;
    }

    if (typeof obj.jquery !== 'undefined') {
      obj = obj[0];
    }

    return typeof obj.nodeType !== 'undefined';
  };

  var getElement = function getElement(obj) {
    if (isElement(obj)) {
      // it's a jQuery object or a node element
      return obj.jquery ? obj[0] : obj;
    }

    if (typeof obj === 'string' && obj.length > 0) {
      return document.querySelector(obj);
    }

    return null;
  };

  var typeCheckConfig = function typeCheckConfig(componentName, config, configTypes) {
    Object.keys(configTypes).forEach(function (property) {
      var expectedTypes = configTypes[property];
      var value = config[property];
      var valueType = value && isElement(value) ? 'element' : toType(value);

      if (!new RegExp(expectedTypes).test(valueType)) {
        throw new TypeError(
          ''
            .concat(componentName.toUpperCase(), ': Option "')
            .concat(property, '" provided type "')
            .concat(valueType, '" but expected type "')
            .concat(expectedTypes, '".'),
        );
      }
    });
  };

  var isVisible = function isVisible(element) {
    if (!isElement(element) || element.getClientRects().length === 0) {
      return false;
    }

    return getComputedStyle(element).getPropertyValue('visibility') === 'visible';
  };

  var isDisabled = function isDisabled(element) {
    if (!element || element.nodeType !== Node.ELEMENT_NODE) {
      return true;
    }

    if (element.classList.contains('disabled')) {
      return true;
    }

    if (typeof element.disabled !== 'undefined') {
      return element.disabled;
    }

    return element.hasAttribute('disabled') && element.getAttribute('disabled') !== 'false';
  };

  var noop = function noop() {};

  var getjQuery = function getjQuery() {
    var _window = window,
      jQuery = _window.jQuery;

    if (jQuery && !document.body.hasAttribute('data-bs-no-jquery')) {
      return jQuery;
    }

    return null;
  };

  var DOMContentLoadedCallbacks = [];

  var onDOMContentLoaded = function onDOMContentLoaded(callback) {
    if (document.readyState === 'loading') {
      // add listener on the first call when the document is in loading state
      if (!DOMContentLoadedCallbacks.length) {
        document.addEventListener('DOMContentLoaded', function () {
          DOMContentLoadedCallbacks.forEach(function (callback) {
            return callback();
          });
        });
      }

      DOMContentLoadedCallbacks.push(callback);
    } else {
      callback();
    }
  };

  var isRTL = function isRTL() {
    return document.documentElement.dir === 'rtl';
  };

  var defineJQueryPlugin = function defineJQueryPlugin(plugin) {
    onDOMContentLoaded(function () {
      var $ = getjQuery();
      /* istanbul ignore if */

      if ($) {
        var name = plugin.NAME;
        var JQUERY_NO_CONFLICT = $.fn[name];
        $.fn[name] = plugin.jQueryInterface;
        $.fn[name].Constructor = plugin;

        $.fn[name].noConflict = function () {
          $.fn[name] = JQUERY_NO_CONFLICT;
          return plugin.jQueryInterface;
        };
      }
    });
  };
  /**
   * Return the previous/next element of a list.
   *
   * @param {array} list    The list of elements
   * @param activeElement   The active element
   * @param shouldGetNext   Choose to get next or previous element
   * @param isCycleAllowed
   * @return {Element|elem} The proper element
   */

  var getNextActiveElement = function getNextActiveElement(list, activeElement, shouldGetNext, isCycleAllowed) {
    var index = list.indexOf(activeElement); // if the element does not exist in the list return an element depending on the direction and if cycle is allowed

    if (index === -1) {
      return list[!shouldGetNext && isCycleAllowed ? list.length - 1 : 0];
    }

    var listLength = list.length;
    index += shouldGetNext ? 1 : -1;

    if (isCycleAllowed) {
      index = (index + listLength) % listLength;
    }

    return list[Math.max(0, Math.min(index, listLength - 1))];
  };
  /**
   * --------------------------------------------------------------------------
   * Bootstrap (v5.1.1): dropdown.js
   * Licensed under MIT (https://github.com/twbs/bootstrap/blob/main/LICENSE)
   * --------------------------------------------------------------------------
   */

  /**
   * ------------------------------------------------------------------------
   * Constants
   * ------------------------------------------------------------------------
   */

  var NAME = 'dropdown';
  var DATA_KEY = 'bs.dropdown';
  var EVENT_KEY = '.'.concat(DATA_KEY);
  var DATA_API_KEY = '.data-api';
  var ESCAPE_KEY = 'Escape';
  var SPACE_KEY = 'Space';
  var TAB_KEY = 'Tab';
  var ARROW_UP_KEY = 'ArrowUp';
  var ARROW_DOWN_KEY = 'ArrowDown';
  var RIGHT_MOUSE_BUTTON = 2; // MouseEvent.button value for the secondary button, usually the right button

  var REGEXP_KEYDOWN = new RegExp(''.concat(ARROW_UP_KEY, '|').concat(ARROW_DOWN_KEY, '|').concat(ESCAPE_KEY));
  var EVENT_HIDE = 'hide'.concat(EVENT_KEY);
  var EVENT_HIDDEN = 'hidden'.concat(EVENT_KEY);
  var EVENT_SHOW = 'show'.concat(EVENT_KEY);
  var EVENT_SHOWN = 'shown'.concat(EVENT_KEY);
  var EVENT_CLICK_DATA_API = 'click'.concat(EVENT_KEY).concat(DATA_API_KEY);
  var EVENT_KEYDOWN_DATA_API = 'keydown'.concat(EVENT_KEY).concat(DATA_API_KEY);
  var EVENT_KEYUP_DATA_API = 'keyup'.concat(EVENT_KEY).concat(DATA_API_KEY);
  var CLASS_NAME_SHOW = 'show';
  var CLASS_NAME_DROPUP = 'dropup';
  var CLASS_NAME_DROPEND = 'dropend';
  var CLASS_NAME_DROPSTART = 'dropstart';
  var CLASS_NAME_NAVBAR = 'navbar';
  var SELECTOR_DATA_TOGGLE = '[data-bs-toggle="dropdown"]';
  var SELECTOR_MENU = '.dropdown-menu';
  var SELECTOR_NAVBAR_NAV = '.navbar-nav';
  var SELECTOR_VISIBLE_ITEMS = '.dropdown-menu .dropdown-item:not(.disabled):not(:disabled)';
  var PLACEMENT_TOP = isRTL() ? 'top-end' : 'top-start';
  var PLACEMENT_TOPEND = isRTL() ? 'top-start' : 'top-end';
  var PLACEMENT_BOTTOM = isRTL() ? 'bottom-end' : 'bottom-start';
  var PLACEMENT_BOTTOMEND = isRTL() ? 'bottom-start' : 'bottom-end';
  var PLACEMENT_RIGHT = isRTL() ? 'left-start' : 'right-start';
  var PLACEMENT_LEFT = isRTL() ? 'right-start' : 'left-start';
  var Default = {
    offset: [0, 2],
    boundary: 'clippingParents',
    reference: 'toggle',
    display: 'dynamic',
    popperConfig: null,
    autoClose: true,
  };
  var DefaultType = {
    offset: '(array|string|function)',
    boundary: '(string|element)',
    reference: '(string|element|object)',
    display: 'string',
    popperConfig: '(null|object|function)',
    autoClose: '(boolean|string)',
  };
  /**
   * ------------------------------------------------------------------------
   * Class Definition
   * ------------------------------------------------------------------------
   */

  var Dropdown = /*#__PURE__*/ (function (_BaseComponent__defau) {
    _inherits(Dropdown, _BaseComponent__defau);

    var _super = _createSuper(Dropdown);

    function Dropdown(element, config) {
      var _this;

      _classCallCheck(this, Dropdown);

      _this = _super.call(this, element);
      _this._popper = null;
      _this._config = _this._getConfig(config);
      _this._menu = _this._getMenuElement();
      _this._inNavbar = _this._detectNavbar();
      return _this;
    } // Getters

    _createClass(
      Dropdown,
      [
        {
          key: 'toggle',
          // Public
          value: function toggle() {
            return this._isShown() ? this.hide() : this.show();
          },
        },
        {
          key: 'show',
          value: function show() {
            if (isDisabled(this._element) || this._isShown(this._menu)) {
              return;
            }

            var relatedTarget = {
              relatedTarget: this._element,
            };
            var showEvent = EventHandler__default['default'].trigger(this._element, EVENT_SHOW, relatedTarget);

            if (showEvent.defaultPrevented) {
              return;
            }

            var parent = Dropdown.getParentFromElement(this._element); // Totally disable Popper for Dropdowns in Navbar

            if (this._inNavbar) {
              Manipulator__default['default'].setDataAttribute(this._menu, 'popper', 'none');
            } else {
              this._createPopper(parent);
            } // If this is a touch-enabled device we add extra
            // empty mouseover listeners to the body's immediate children;
            // only needed because of broken event delegation on iOS
            // https://www.quirksmode.org/blog/archives/2014/02/mouse_event_bub.html

            if ('ontouchstart' in document.documentElement && !parent.closest(SELECTOR_NAVBAR_NAV)) {
              var _ref;

              (_ref = []).concat.apply(_ref, _toConsumableArray(document.body.children)).forEach(function (elem) {
                return EventHandler__default['default'].on(elem, 'mouseover', noop);
              });
            }

            this._element.focus();

            this._element.setAttribute('aria-expanded', true);

            this._menu.classList.add(CLASS_NAME_SHOW);

            this._element.classList.add(CLASS_NAME_SHOW);

            EventHandler__default['default'].trigger(this._element, EVENT_SHOWN, relatedTarget);
          },
        },
        {
          key: 'hide',
          value: function hide() {
            if (isDisabled(this._element) || !this._isShown(this._menu)) {
              return;
            }

            var relatedTarget = {
              relatedTarget: this._element,
            };

            this._completeHide(relatedTarget);
          },
        },
        {
          key: 'dispose',
          value: function dispose() {
            if (this._popper) {
              this._popper.destroy();
            }

            _get(_getPrototypeOf(Dropdown.prototype), 'dispose', this).call(this);
          },
        },
        {
          key: 'update',
          value: function update() {
            this._inNavbar = this._detectNavbar();

            if (this._popper) {
              this._popper.update();
            }
          }, // Private
        },
        {
          key: '_completeHide',
          value: function _completeHide(relatedTarget) {
            var hideEvent = EventHandler__default['default'].trigger(this._element, EVENT_HIDE, relatedTarget);

            if (hideEvent.defaultPrevented) {
              return;
            } // If this is a touch-enabled device we remove the extra
            // empty mouseover listeners we added for iOS support

            if ('ontouchstart' in document.documentElement) {
              var _ref2;

              (_ref2 = []).concat.apply(_ref2, _toConsumableArray(document.body.children)).forEach(function (elem) {
                return EventHandler__default['default'].off(elem, 'mouseover', noop);
              });
            }

            if (this._popper) {
              this._popper.destroy();
            }

            this._menu.classList.remove(CLASS_NAME_SHOW);

            this._element.classList.remove(CLASS_NAME_SHOW);

            this._element.setAttribute('aria-expanded', 'false');

            Manipulator__default['default'].removeDataAttribute(this._menu, 'popper');
            EventHandler__default['default'].trigger(this._element, EVENT_HIDDEN, relatedTarget);
          },
        },
        {
          key: '_getConfig',
          value: function _getConfig(config) {
            config = _objectSpread(
              _objectSpread(
                _objectSpread({}, this.constructor.Default),
                Manipulator__default['default'].getDataAttributes(this._element),
              ),
              config,
            );
            typeCheckConfig(NAME, config, this.constructor.DefaultType);

            if (
              _typeof(config.reference) === 'object' &&
              !isElement(config.reference) &&
              typeof config.reference.getBoundingClientRect !== 'function'
            ) {
              // Popper virtual elements require a getBoundingClientRect method
              throw new TypeError(
                ''.concat(
                  NAME.toUpperCase(),
                  ': Option "reference" provided type "object" without a required "getBoundingClientRect" method.',
                ),
              );
            }

            return config;
          },
        },
        {
          key: '_createPopper',
          value: function _createPopper(parent) {
            if (typeof Popper__namespace === 'undefined') {
              throw new TypeError("Bootstrap's dropdowns require Popper (https://popper.js.org)");
            }

            var referenceElement = this._element;

            if (this._config.reference === 'parent') {
              referenceElement = parent;
            } else if (isElement(this._config.reference)) {
              referenceElement = getElement(this._config.reference);
            } else if (_typeof(this._config.reference) === 'object') {
              referenceElement = this._config.reference;
            }

            var popperConfig = this._getPopperConfig();

            var isDisplayStatic = popperConfig.modifiers.find(function (modifier) {
              return modifier.name === 'applyStyles' && modifier.enabled === false;
            });
            this._popper = Popper__namespace.createPopper(referenceElement, this._menu, popperConfig);

            if (isDisplayStatic) {
              Manipulator__default['default'].setDataAttribute(this._menu, 'popper', 'static');
            }
          },
        },
        {
          key: '_isShown',
          value: function _isShown() {
            var element = arguments.length > 0 && arguments[0] !== undefined ? arguments[0] : this._element;
            return element.classList.contains(CLASS_NAME_SHOW);
          },
        },
        {
          key: '_getMenuElement',
          value: function _getMenuElement() {
            return SelectorEngine__default['default'].next(this._element, SELECTOR_MENU)[0];
          },
        },
        {
          key: '_getPlacement',
          value: function _getPlacement() {
            var parentDropdown = this._element.parentNode;

            if (parentDropdown.classList.contains(CLASS_NAME_DROPEND)) {
              return PLACEMENT_RIGHT;
            }

            if (parentDropdown.classList.contains(CLASS_NAME_DROPSTART)) {
              return PLACEMENT_LEFT;
            } // We need to trim the value because custom properties can also include spaces

            var isEnd = getComputedStyle(this._menu).getPropertyValue('--bs-position').trim() === 'end';

            if (parentDropdown.classList.contains(CLASS_NAME_DROPUP)) {
              return isEnd ? PLACEMENT_TOPEND : PLACEMENT_TOP;
            }

            return isEnd ? PLACEMENT_BOTTOMEND : PLACEMENT_BOTTOM;
          },
        },
        {
          key: '_detectNavbar',
          value: function _detectNavbar() {
            return this._element.closest('.'.concat(CLASS_NAME_NAVBAR)) !== null;
          },
        },
        {
          key: '_getOffset',
          value: function _getOffset() {
            var _this2 = this;

            var offset = this._config.offset;

            if (typeof offset === 'string') {
              return offset.split(',').map(function (val) {
                return Number.parseInt(val, 10);
              });
            }

            if (typeof offset === 'function') {
              return function (popperData) {
                return offset(popperData, _this2._element);
              };
            }

            return offset;
          },
        },
        {
          key: '_getPopperConfig',
          value: function _getPopperConfig() {
            var defaultBsPopperConfig = {
              placement: this._getPlacement(),
              modifiers: [
                {
                  name: 'preventOverflow',
                  options: {
                    boundary: this._config.boundary,
                  },
                },
                {
                  name: 'offset',
                  options: {
                    offset: this._getOffset(),
                  },
                },
              ],
            }; // Disable Popper if we have a static display

            if (this._config.display === 'static') {
              defaultBsPopperConfig.modifiers = [
                {
                  name: 'applyStyles',
                  enabled: false,
                },
              ];
            }

            return _objectSpread(
              _objectSpread({}, defaultBsPopperConfig),
              typeof this._config.popperConfig === 'function'
                ? this._config.popperConfig(defaultBsPopperConfig)
                : this._config.popperConfig,
            );
          },
        },
        {
          key: '_selectMenuItem',
          value: function _selectMenuItem(_ref3) {
            var key = _ref3.key,
              target = _ref3.target;
            var items = SelectorEngine__default['default'].find(SELECTOR_VISIBLE_ITEMS, this._menu).filter(isVisible);

            if (!items.length) {
              return;
            } // if target isn't included in items (e.g. when expanding the dropdown)
            // allow cycling to get the last item in case key equals ARROW_UP_KEY

            getNextActiveElement(items, target, key === ARROW_DOWN_KEY, !items.includes(target)).focus();
          }, // Static
        },
      ],
      [
        {
          key: 'Default',
          get: function get() {
            return Default;
          },
        },
        {
          key: 'DefaultType',
          get: function get() {
            return DefaultType;
          },
        },
        {
          key: 'NAME',
          get: function get() {
            return NAME;
          },
        },
        {
          key: 'jQueryInterface',
          value: function jQueryInterface(config) {
            return this.each(function () {
              var data = Dropdown.getOrCreateInstance(this, config);

              if (typeof config !== 'string') {
                return;
              }

              if (typeof data[config] === 'undefined') {
                throw new TypeError('No method named "'.concat(config, '"'));
              }

              data[config]();
            });
          },
        },
        {
          key: 'clearMenus',
          value: function clearMenus(event) {
            if (event && (event.button === RIGHT_MOUSE_BUTTON || (event.type === 'keyup' && event.key !== TAB_KEY))) {
              return;
            }

            var toggles = SelectorEngine__default['default'].find(SELECTOR_DATA_TOGGLE);

            for (var i = 0, len = toggles.length; i < len; i++) {
              var context = Dropdown.getInstance(toggles[i]);

              if (!context || context._config.autoClose === false) {
                continue;
              }

              if (!context._isShown()) {
                continue;
              }

              var relatedTarget = {
                relatedTarget: context._element,
              };

              if (event) {
                var composedPath = event.composedPath();
                var isMenuTarget = composedPath.includes(context._menu);

                if (
                  composedPath.includes(context._element) ||
                  (context._config.autoClose === 'inside' && !isMenuTarget) ||
                  (context._config.autoClose === 'outside' && isMenuTarget)
                ) {
                  continue;
                } // Tab navigation through the dropdown menu or events from contained inputs shouldn't close the menu

                if (
                  context._menu.contains(event.target) &&
                  ((event.type === 'keyup' && event.key === TAB_KEY) ||
                    /input|select|option|textarea|form/i.test(event.target.tagName))
                ) {
                  continue;
                }

                if (event.type === 'click') {
                  relatedTarget.clickEvent = event;
                }
              }

              context._completeHide(relatedTarget);
            }
          },
        },
        {
          key: 'getParentFromElement',
          value: function getParentFromElement(element) {
            return getElementFromSelector(element) || element.parentNode;
          },
        },
        {
          key: 'dataApiKeydownHandler',
          value: function dataApiKeydownHandler(event) {
            // If not input/textarea:
            //  - And not a key in REGEXP_KEYDOWN => not a dropdown command
            // If input/textarea:
            //  - If space key => not a dropdown command
            //  - If key is other than escape
            //    - If key is not up or down => not a dropdown command
            //    - If trigger inside the menu => not a dropdown command
            if (
              /input|textarea/i.test(event.target.tagName)
                ? event.key === SPACE_KEY ||
                  (event.key !== ESCAPE_KEY &&
                    ((event.key !== ARROW_DOWN_KEY && event.key !== ARROW_UP_KEY) ||
                      event.target.closest(SELECTOR_MENU)))
                : !REGEXP_KEYDOWN.test(event.key)
            ) {
              return;
            }

            var isActive = this.classList.contains(CLASS_NAME_SHOW);

            if (!isActive && event.key === ESCAPE_KEY) {
              return;
            }

            event.preventDefault();
            event.stopPropagation();

            if (isDisabled(this)) {
              return;
            }

            var getToggleButton = this.matches(SELECTOR_DATA_TOGGLE)
              ? this
              : SelectorEngine__default['default'].prev(this, SELECTOR_DATA_TOGGLE)[0];
            var instance = Dropdown.getOrCreateInstance(getToggleButton);

            if (event.key === ESCAPE_KEY) {
              instance.hide();
              return;
            }

            if (event.key === ARROW_UP_KEY || event.key === ARROW_DOWN_KEY) {
              if (!isActive) {
                instance.show();
              }

              instance._selectMenuItem(event);

              return;
            }

            if (!isActive || event.key === SPACE_KEY) {
              Dropdown.clearMenus();
            }
          },
        },
      ],
    );

    return Dropdown;
  })(BaseComponent__default['default']);
  /**
   * ------------------------------------------------------------------------
   * Data Api implementation
   * ------------------------------------------------------------------------
   */

  EventHandler__default['default'].on(
    document,
    EVENT_KEYDOWN_DATA_API,
    SELECTOR_DATA_TOGGLE,
    Dropdown.dataApiKeydownHandler,
  );
  EventHandler__default['default'].on(document, EVENT_KEYDOWN_DATA_API, SELECTOR_MENU, Dropdown.dataApiKeydownHandler);
  EventHandler__default['default'].on(document, EVENT_CLICK_DATA_API, Dropdown.clearMenus);
  EventHandler__default['default'].on(document, EVENT_KEYUP_DATA_API, Dropdown.clearMenus);
  EventHandler__default['default'].on(document, EVENT_CLICK_DATA_API, SELECTOR_DATA_TOGGLE, function (event) {
    event.preventDefault();
    Dropdown.getOrCreateInstance(this).toggle();
  });
  /**
   * ------------------------------------------------------------------------
   * jQuery
   * ------------------------------------------------------------------------
   * add .Dropdown to jQuery only if jQuery is present
   */

  defineJQueryPlugin(Dropdown);
  return Dropdown;
});
('use strict');

/*!
 * jQuery Cookie Plugin v1.3.1
 * https://github.com/carhartl/jquery-cookie
 *
 * Copyright 2013 Klaus Hartl
 * Released under the MIT license
 *
 * Modified by Roger Espinosa, 2013
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as anonymous module.
    define(['jquery'], factory);
  } else {
    // Browser globals.
    factory(jQuery);
  }
})(function ($) {
  var pluses = /\+/g;

  function raw(s) {
    return s;
  }

  function decoded(s) {
    return decodeURIComponent(s.replace(pluses, ' '));
  }

  function converted(s, options) {
    if (s.indexOf('"') === 0) {
      // This is a quoted cookie as according to RFC2068, unescape
      s = s.slice(1, -1).replace(/\\"/g, '"').replace(/\\\\/g, '\\');
    }

    try {
      options = $.extend({}, config.defaults, options);
      return config.json || options.json ? JSON.parse(s) : s;
    } catch (er) {}
  }

  var config = ($.cookie = function (key, value, options) {
    // write
    // if (value !== undefined) {
    if (typeof value != 'undefined') {
      options = $.extend({}, config.defaults, options);

      if (typeof options.expires === 'number') {
        var days = options.expires,
          t = (options.expires = new Date());
        t.setDate(t.getDate() + days);
      }

      value = config.json || options.json ? JSON.stringify(value) : String(value);
      return (document.cookie = [
        config.raw ? key : encodeURIComponent(key),
        '=',
        config.raw ? value : encodeURIComponent(value),
        options.expires ? '; expires=' + options.expires.toUTCString() : '', // use expires attribute, max-age is not supported by IE
        options.path ? '; path=' + options.path : '',
        options.domain ? '; domain=' + options.domain : '',
        options.secure ? '; secure' : '',
      ].join(''));
    } // read

    var decode = config.raw ? raw : decoded;
    var cookies = document.cookie.split('; '); // var result = key ? undefined : {};

    var result = key ? null : {};

    for (var i = 0, l = cookies.length; i < l; i++) {
      var parts = cookies[i].split('=');
      var name = decode(parts.shift());
      var cookie = decode(parts.join('='));

      if (key && key === name) {
        result = converted(cookie, options);
        break;
      }

      if (!key) {
        result[name] = converted(cookie, options);
      }
    }

    return result;
  });

  config.defaults = {};

  $.removeCookie = function (key, options) {
    if ($.cookie(key, undefined, options) !== undefined) {
      // Must not alter options, thus extending a fresh object...
      $.cookie(
        key,
        '',
        $.extend({}, options, {
          expires: -1,
        }),
      );
      return true;
    }

    return false;
  };
});
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*
 * JQuery URL Parser plugin, v2.2.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD available; use anonymous module
    if (typeof jQuery !== 'undefined') {
      define(['jquery'], factory);
    } else {
      define([], factory);
    }
  } else {
    // No AMD available; mutate global vars
    if (typeof jQuery !== 'undefined') {
      factory(jQuery);
    } else {
      factory();
    }
  }
})(function ($, undefined) {
  var tag2attr = {
      a: 'href',
      img: 'src',
      form: 'action',
      base: 'href',
      script: 'src',
      iframe: 'src',
      link: 'href',
    },
    key = [
      'source',
      'protocol',
      'authority',
      'userInfo',
      'user',
      'password',
      'host',
      'port',
      'relative',
      'path',
      'directory',
      'file',
      'query',
      'fragment',
    ],
    // keys available to query
    aliases = {
      anchor: 'fragment',
    },
    // aliases for backwards compatability
    parser = {
      strict:
        /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,
      //less intuitive, more accurate to the specs
      loose:
        /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/, // more intuitive, fails on relative paths and deviates from specs
    },
    toString = Object.prototype.toString,
    isint = /^[0-9]+$/;

  function parseUri(url, strictMode) {
    var str = decodeURI(url),
      res = parser[strictMode || false ? 'strict' : 'loose'].exec(str),
      uri = {
        attr: {},
        param: {},
        seg: {},
      },
      i = 14;

    while (i--) {
      uri.attr[key[i]] = res[i] || '';
    } // build query and fragment parameters

    uri.param['query'] = parseString(uri.attr['query']);
    uri.param['fragment'] = parseString(uri.attr['fragment']); // split path and fragement into segments

    uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g, '').split('/');
    uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g, '').split('/'); // compile a 'base' domain attribute

    uri.attr['base'] = uri.attr.host
      ? (uri.attr.protocol ? uri.attr.protocol + '://' + uri.attr.host : uri.attr.host) +
        (uri.attr.port ? ':' + uri.attr.port : '')
      : '';
    return uri;
  }

  function getAttrName(elm) {
    var tn = elm.tagName;
    if (typeof tn !== 'undefined') return tag2attr[tn.toLowerCase()];
    return tn;
  }

  function promote(parent, key) {
    if (parent[key].length == 0) return (parent[key] = {});
    var t = {};

    for (var i in parent[key]) {
      t[i] = parent[key][i];
    }

    parent[key] = t;
    return t;
  }

  function parse(parts, parent, key, val) {
    var part = parts.shift();

    if (!part) {
      if (isArray(parent[key])) {
        parent[key].push(val);
      } else if ('object' == _typeof(parent[key])) {
        parent[key] = val;
      } else if ('undefined' == typeof parent[key]) {
        parent[key] = val;
      } else {
        parent[key] = [parent[key], val];
      }
    } else {
      var obj = (parent[key] = parent[key] || []);

      if (']' == part) {
        if (isArray(obj)) {
          if ('' != val) obj.push(val);
        } else if ('object' == _typeof(obj)) {
          obj[keys(obj).length] = val;
        } else {
          obj = parent[key] = [parent[key], val];
        }
      } else if (~part.indexOf(']')) {
        part = part.substr(0, part.length - 1);
        if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
        parse(parts, obj, part, val); // key
      } else {
        if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
        parse(parts, obj, part, val);
      }
    }
  }

  function merge(parent, key, val) {
    if (~key.indexOf(']')) {
      var parts = key.split('['),
        len = parts.length,
        last = len - 1;
      parse(parts, parent, 'base', val);
    } else {
      if (!isint.test(key) && isArray(parent.base)) {
        var t = {};

        for (var k in parent.base) {
          t[k] = parent.base[k];
        }

        parent.base = t;
      }

      set(parent.base, key, val);
    }

    return parent;
  }

  function parseString(str) {
    return reduce(
      String(str).split(/&|;/),
      function (ret, pair) {
        try {
          pair = decodeURIComponent(pair.replace(/\+/g, ' '));
        } catch (e) {
          // ignore
        }

        var eql = pair.indexOf('='),
          brace = lastBraceInKey(pair),
          key = pair.substr(0, brace || eql),
          val = pair.substr(brace || eql, pair.length),
          val = val.substr(val.indexOf('=') + 1, val.length);
        if ('' == key) ((key = pair), (val = ''));
        return merge(ret, key, val);
      },
      {
        base: {},
      },
    ).base;
  }

  function set(obj, key, val) {
    var v = obj[key];

    if (undefined === v) {
      obj[key] = val;
    } else if (isArray(v)) {
      v.push(val);
    } else {
      obj[key] = [v, val];
    }
  }

  function lastBraceInKey(str) {
    var len = str.length,
      brace,
      c;

    for (var i = 0; i < len; ++i) {
      c = str[i];
      if (']' == c) brace = false;
      if ('[' == c) brace = true;
      if ('=' == c && !brace) return i;
    }
  }

  function reduce(obj, accumulator) {
    var i = 0,
      l = obj.length >> 0,
      curr = arguments[2];

    while (i < l) {
      if (i in obj) curr = accumulator.call(undefined, curr, obj[i], i, obj);
      ++i;
    }

    return curr;
  }

  function isArray(vArg) {
    return Object.prototype.toString.call(vArg) === '[object Array]';
  }

  function keys(obj) {
    var keys = [];

    for (prop in obj) {
      if (obj.hasOwnProperty(prop)) keys.push(prop);
    }

    return keys;
  }

  function purl(url, strictMode) {
    if (arguments.length === 1 && url === true) {
      strictMode = true;
      url = undefined;
    }

    strictMode = strictMode || false;
    url = url || window.location.toString();
    return {
      data: parseUri(url, strictMode),
      // get various attributes from the URI
      attr: function attr(_attr) {
        _attr = aliases[_attr] || _attr;
        return typeof _attr !== 'undefined' ? this.data.attr[_attr] : this.data.attr;
      },
      // return query string parameters
      param: function param(_param) {
        return typeof _param !== 'undefined' ? this.data.param.query[_param] : this.data.param.query;
      },
      // return fragment parameters
      fparam: function fparam(param) {
        return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
      },
      // return path segments
      segment: function segment(seg) {
        if (typeof seg === 'undefined') {
          return this.data.seg.path;
        } else {
          seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end

          return this.data.seg.path[seg];
        }
      },
      // return fragment segments
      fsegment: function fsegment(seg) {
        if (typeof seg === 'undefined') {
          return this.data.seg.fragment;
        } else {
          seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end

          return this.data.seg.fragment[seg];
        }
      },
    };
  }

  if (typeof $ !== 'undefined') {
    $.fn.url = function (strictMode) {
      var url = '';

      if (this.length) {
        url = $(this).attr(getAttrName(this[0])) || '';
      }

      return purl(url, strictMode);
    };

    $.url = purl;
  } else {
    window.purl = purl;
  }
});
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

/*!
 * SelectWoo 5.0.0
 * https://github.com/woocommerce/selectWoo
 *
 * Released under the MIT license
 * https://github.com/woocommerce/selectWoo/blob/master/LICENSE.md
 */
(function (factory) {
  if (typeof define === 'function' && define.amd) {
    // AMD. Register as an anonymous module.
    define(['jquery'], factory);
  } else if ((typeof module === 'undefined' ? 'undefined' : _typeof(module)) === 'object' && module.exports) {
    // Node/CommonJS
    module.exports = function (root, jQuery) {
      if (jQuery === undefined) {
        // require('jQuery') returns a factory that requires window to
        // build a jQuery instance, we normalize how we use modules
        // that require this pattern but the window provided is a noop
        // if it's defined (how jquery works)
        if (typeof window !== 'undefined') {
          jQuery = require('jquery');
        } else {
          jQuery = require('jquery')(root);
        }
      }

      factory(jQuery);
      return jQuery;
    };
  } else {
    // Browser globals
    factory(jQuery);
  }
})(function (jQuery) {
  // This is needed so we can catch the AMD loader configuration and use it
  // The inner file should be wrapped (by `banner.start.js`) in a function that
  // returns the AMD loader references.
  var S2 = (function () {
    // Restore the Select2 AMD loader so it can be used
    // Needed mostly in the language files, where the loader is not inserted
    if (jQuery && jQuery.fn && jQuery.fn.select2 && jQuery.fn.select2.amd) {
      var S2 = jQuery.fn.select2.amd;
    }

    var S2;

    (function () {
      if (!S2 || !S2.requirejs) {
        if (!S2) {
          S2 = {};
        } else {
          require = S2;
        }
        /**
         * @license almond 0.3.3 Copyright jQuery Foundation and other contributors.
         * Released under MIT license, http://github.com/requirejs/almond/LICENSE
         */
        //Going sloppy to avoid 'use strict' string cost, but strict practices should
        //be followed.

        /*global setTimeout: false */

        var requirejs, require, define;

        (function (undef) {
          var main,
            _req,
            makeMap,
            handlers,
            defined = {},
            waiting = {},
            config = {},
            defining = {},
            hasOwn = Object.prototype.hasOwnProperty,
            aps = [].slice,
            jsSuffixRegExp = /\.js$/;

          function hasProp(obj, prop) {
            return hasOwn.call(obj, prop);
          }
          /**
           * Given a relative module name, like ./something, normalize it to
           * a real name that can be mapped to a path.
           * @param {String} name the relative name
           * @param {String} baseName a real name that the name arg is relative
           * to.
           * @returns {String} normalized name
           */

          function normalize(name, baseName) {
            var nameParts,
              nameSegment,
              mapValue,
              foundMap,
              lastIndex,
              foundI,
              foundStarMap,
              starI,
              i,
              j,
              part,
              normalizedBaseParts,
              baseParts = baseName && baseName.split('/'),
              map = config.map,
              starMap = (map && map['*']) || {}; //Adjust any relative paths.

            if (name) {
              name = name.split('/');
              lastIndex = name.length - 1; // If wanting node ID compatibility, strip .js from end
              // of IDs. Have to do this here, and not in nameToUrl
              // because node allows either .js or non .js to map
              // to same file.

              if (config.nodeIdCompat && jsSuffixRegExp.test(name[lastIndex])) {
                name[lastIndex] = name[lastIndex].replace(jsSuffixRegExp, '');
              } // Starts with a '.' so need the baseName

              if (name[0].charAt(0) === '.' && baseParts) {
                //Convert baseName to array, and lop off the last part,
                //so that . matches that 'directory' and not name of the baseName's
                //module. For instance, baseName of 'one/two/three', maps to
                //'one/two/three.js', but we want the directory, 'one/two' for
                //this normalization.
                normalizedBaseParts = baseParts.slice(0, baseParts.length - 1);
                name = normalizedBaseParts.concat(name);
              } //start trimDots

              for (i = 0; i < name.length; i++) {
                part = name[i];

                if (part === '.') {
                  name.splice(i, 1);
                  i -= 1;
                } else if (part === '..') {
                  // If at the start, or previous value is still ..,
                  // keep them so that when converted to a path it may
                  // still work when converted to a path, even though
                  // as an ID it is less than ideal. In larger point
                  // releases, may be better to just kick out an error.
                  if (i === 0 || (i === 1 && name[2] === '..') || name[i - 1] === '..') {
                    continue;
                  } else if (i > 0) {
                    name.splice(i - 1, 2);
                    i -= 2;
                  }
                }
              } //end trimDots

              name = name.join('/');
            } //Apply map config if available.

            if ((baseParts || starMap) && map) {
              nameParts = name.split('/');

              for (i = nameParts.length; i > 0; i -= 1) {
                nameSegment = nameParts.slice(0, i).join('/');

                if (baseParts) {
                  //Find the longest baseName segment match in the config.
                  //So, do joins on the biggest to smallest lengths of baseParts.
                  for (j = baseParts.length; j > 0; j -= 1) {
                    mapValue = map[baseParts.slice(0, j).join('/')]; //baseName segment has  config, find if it has one for
                    //this name.

                    if (mapValue) {
                      mapValue = mapValue[nameSegment];

                      if (mapValue) {
                        //Match, update name to the new value.
                        foundMap = mapValue;
                        foundI = i;
                        break;
                      }
                    }
                  }
                }

                if (foundMap) {
                  break;
                } //Check for a star map match, but just hold on to it,
                //if there is a shorter segment match later in a matching
                //config, then favor over this star map.

                if (!foundStarMap && starMap && starMap[nameSegment]) {
                  foundStarMap = starMap[nameSegment];
                  starI = i;
                }
              }

              if (!foundMap && foundStarMap) {
                foundMap = foundStarMap;
                foundI = starI;
              }

              if (foundMap) {
                nameParts.splice(0, foundI, foundMap);
                name = nameParts.join('/');
              }
            }

            return name;
          }

          function makeRequire(relName, forceSync) {
            return function () {
              //A version of a require function that passes a moduleName
              //value for items that may need to
              //look up paths relative to the moduleName
              var args = aps.call(arguments, 0); //If first arg is not require('string'), and there is only
              //one arg, it is the array form without a callback. Insert
              //a null so that the following concat is correct.

              if (typeof args[0] !== 'string' && args.length === 1) {
                args.push(null);
              }

              return _req.apply(undef, args.concat([relName, forceSync]));
            };
          }

          function makeNormalize(relName) {
            return function (name) {
              return normalize(name, relName);
            };
          }

          function makeLoad(depName) {
            return function (value) {
              defined[depName] = value;
            };
          }

          function callDep(name) {
            if (hasProp(waiting, name)) {
              var args = waiting[name];
              delete waiting[name];
              defining[name] = true;
              main.apply(undef, args);
            }

            if (!hasProp(defined, name) && !hasProp(defining, name)) {
              throw new Error('No ' + name);
            }

            return defined[name];
          } //Turns a plugin!resource to [plugin, resource]
          //with the plugin being undefined if the name
          //did not have a plugin prefix.

          function splitPrefix(name) {
            var prefix,
              index = name ? name.indexOf('!') : -1;

            if (index > -1) {
              prefix = name.substring(0, index);
              name = name.substring(index + 1, name.length);
            }

            return [prefix, name];
          } //Creates a parts array for a relName where first part is plugin ID,
          //second part is resource ID. Assumes relName has already been normalized.

          function makeRelParts(relName) {
            return relName ? splitPrefix(relName) : [];
          }
          /**
           * Makes a name map, normalizing the name, and using a plugin
           * for normalization if necessary. Grabs a ref to plugin
           * too, as an optimization.
           */

          makeMap = function makeMap(name, relParts) {
            var plugin,
              parts = splitPrefix(name),
              prefix = parts[0],
              relResourceName = relParts[1];
            name = parts[1];

            if (prefix) {
              prefix = normalize(prefix, relResourceName);
              plugin = callDep(prefix);
            } //Normalize according

            if (prefix) {
              if (plugin && plugin.normalize) {
                name = plugin.normalize(name, makeNormalize(relResourceName));
              } else {
                name = normalize(name, relResourceName);
              }
            } else {
              name = normalize(name, relResourceName);
              parts = splitPrefix(name);
              prefix = parts[0];
              name = parts[1];

              if (prefix) {
                plugin = callDep(prefix);
              }
            } //Using ridiculous property names for space reasons

            return {
              f: prefix ? prefix + '!' + name : name,
              //fullName
              n: name,
              pr: prefix,
              p: plugin,
            };
          };

          function makeConfig(name) {
            return function () {
              return (config && config.config && config.config[name]) || {};
            };
          }

          handlers = {
            require: function require(name) {
              return makeRequire(name);
            },
            exports: function exports(name) {
              var e = defined[name];

              if (typeof e !== 'undefined') {
                return e;
              } else {
                return (defined[name] = {});
              }
            },
            module: function module(name) {
              return {
                id: name,
                uri: '',
                exports: defined[name],
                config: makeConfig(name),
              };
            },
          };

          main = function main(name, deps, callback, relName) {
            var cjsModule,
              depName,
              ret,
              map,
              i,
              relParts,
              args = [],
              callbackType = _typeof(callback),
              usingExports; //Use name if no relName

            relName = relName || name;
            relParts = makeRelParts(relName); //Call the callback to define the module, if necessary.

            if (callbackType === 'undefined' || callbackType === 'function') {
              //Pull out the defined dependencies and pass the ordered
              //values to the callback.
              //Default to [require, exports, module] if no deps
              deps = !deps.length && callback.length ? ['require', 'exports', 'module'] : deps;

              for (i = 0; i < deps.length; i += 1) {
                map = makeMap(deps[i], relParts);
                depName = map.f; //Fast path CommonJS standard dependencies.

                if (depName === 'require') {
                  args[i] = handlers.require(name);
                } else if (depName === 'exports') {
                  //CommonJS module spec 1.1
                  args[i] = handlers.exports(name);
                  usingExports = true;
                } else if (depName === 'module') {
                  //CommonJS module spec 1.1
                  cjsModule = args[i] = handlers.module(name);
                } else if (hasProp(defined, depName) || hasProp(waiting, depName) || hasProp(defining, depName)) {
                  args[i] = callDep(depName);
                } else if (map.p) {
                  map.p.load(map.n, makeRequire(relName, true), makeLoad(depName), {});
                  args[i] = defined[depName];
                } else {
                  throw new Error(name + ' missing ' + depName);
                }
              }

              ret = callback ? callback.apply(defined[name], args) : undefined;

              if (name) {
                //If setting exports via "module" is in play,
                //favor that over return value and exports. After that,
                //favor a non-undefined return value over exports use.
                if (cjsModule && cjsModule.exports !== undef && cjsModule.exports !== defined[name]) {
                  defined[name] = cjsModule.exports;
                } else if (ret !== undef || !usingExports) {
                  //Use the return value from the function.
                  defined[name] = ret;
                }
              }
            } else if (name) {
              //May just be an object definition for the module. Only
              //worry about defining if have a module name.
              defined[name] = callback;
            }
          };

          requirejs =
            require =
            _req =
              function req(deps, callback, relName, forceSync, alt) {
                if (typeof deps === 'string') {
                  if (handlers[deps]) {
                    //callback in this case is really relName
                    return handlers[deps](callback);
                  } //Just return the module wanted. In this scenario, the
                  //deps arg is the module name, and second arg (if passed)
                  //is just the relName.
                  //Normalize module name, if it contains . or ..

                  return callDep(makeMap(deps, makeRelParts(callback)).f);
                } else if (!deps.splice) {
                  //deps is a config object, not an array.
                  config = deps;

                  if (config.deps) {
                    _req(config.deps, config.callback);
                  }

                  if (!callback) {
                    return;
                  }

                  if (callback.splice) {
                    //callback is an array, which means it is a dependency list.
                    //Adjust args if there are dependencies
                    deps = callback;
                    callback = relName;
                    relName = null;
                  } else {
                    deps = undef;
                  }
                } //Support require(['a'])

                callback = callback || function () {}; //If relName is a function, it is an errback handler,
                //so remove it.

                if (typeof relName === 'function') {
                  relName = forceSync;
                  forceSync = alt;
                } //Simulate async callback;

                if (forceSync) {
                  main(undef, deps, callback, relName);
                } else {
                  //Using a non-zero value because of concern for what old browsers
                  //do, and latest browsers "upgrade" to 4 if lower value is used:
                  //http://www.whatwg.org/specs/web-apps/current-work/multipage/timers.html#dom-windowtimers-settimeout:
                  //If want a value immediately, use require('id') instead -- something
                  //that works in almond on the global level, but not guaranteed and
                  //unlikely to work in other AMD implementations.
                  setTimeout(function () {
                    main(undef, deps, callback, relName);
                  }, 4);
                }

                return _req;
              };
          /**
           * Just drops the config on the floor, but returns req in case
           * the config return value is used.
           */

          _req.config = function (cfg) {
            return _req(cfg);
          };
          /**
           * Expose module registry for debugging and tooling
           */

          requirejs._defined = defined;

          define = function define(name, deps, callback) {
            if (typeof name !== 'string') {
              throw new Error('See almond README: incorrect module build, no module name');
            } //This module may not have dependencies

            if (!deps.splice) {
              //deps is not an array, so probably means
              //an object literal or factory function for
              //the value. Adjust args.
              callback = deps;
              deps = [];
            }

            if (!hasProp(defined, name) && !hasProp(waiting, name)) {
              waiting[name] = [name, deps, callback];
            }
          };

          define.amd = {
            jQuery: true,
          };
        })();

        S2.requirejs = requirejs;
        S2.require = require;
        S2.define = define;
      }
    })();

    S2.define('almond', function () {});
    /* global jQuery:false, $:false */

    S2.define('jquery', [], function () {
      var _$ = jQuery || $;

      if (_$ == null && console && console.error) {
        console.error(
          'Select2: An instance of jQuery or a jQuery-compatible library was not ' +
            'found. Make sure that you are including jQuery before Select2 on your ' +
            'web page.',
        );
      }

      return _$;
    });
    S2.define('select2/utils', ['jquery'], function ($) {
      var Utils = {};

      Utils.Extend = function (ChildClass, SuperClass) {
        var __hasProp = {}.hasOwnProperty;

        function BaseConstructor() {
          this.constructor = ChildClass;
        }

        for (var key in SuperClass) {
          if (__hasProp.call(SuperClass, key)) {
            ChildClass[key] = SuperClass[key];
          }
        }

        BaseConstructor.prototype = SuperClass.prototype;
        ChildClass.prototype = new BaseConstructor();
        ChildClass.__super__ = SuperClass.prototype;
        return ChildClass;
      };

      function getMethods(theClass) {
        var proto = theClass.prototype;
        var methods = [];

        for (var methodName in proto) {
          var m = proto[methodName];

          if (typeof m !== 'function') {
            continue;
          }

          if (methodName === 'constructor') {
            continue;
          }

          methods.push(methodName);
        }

        return methods;
      }

      Utils.Decorate = function (SuperClass, DecoratorClass) {
        var decoratedMethods = getMethods(DecoratorClass);
        var superMethods = getMethods(SuperClass);

        function DecoratedClass() {
          var unshift = Array.prototype.unshift;
          var argCount = DecoratorClass.prototype.constructor.length;
          var calledConstructor = SuperClass.prototype.constructor;

          if (argCount > 0) {
            unshift.call(arguments, SuperClass.prototype.constructor);
            calledConstructor = DecoratorClass.prototype.constructor;
          }

          calledConstructor.apply(this, arguments);
        }

        DecoratorClass.displayName = SuperClass.displayName;

        function ctr() {
          this.constructor = DecoratedClass;
        }

        DecoratedClass.prototype = new ctr();

        for (var m = 0; m < superMethods.length; m++) {
          var superMethod = superMethods[m];
          DecoratedClass.prototype[superMethod] = SuperClass.prototype[superMethod];
        }

        var calledMethod = function calledMethod(methodName) {
          // Stub out the original method if it's not decorating an actual method
          var originalMethod = function originalMethod() {};

          if (methodName in DecoratedClass.prototype) {
            originalMethod = DecoratedClass.prototype[methodName];
          }

          var decoratedMethod = DecoratorClass.prototype[methodName];
          return function () {
            var unshift = Array.prototype.unshift;
            unshift.call(arguments, originalMethod);
            return decoratedMethod.apply(this, arguments);
          };
        };

        for (var d = 0; d < decoratedMethods.length; d++) {
          var decoratedMethod = decoratedMethods[d];
          DecoratedClass.prototype[decoratedMethod] = calledMethod(decoratedMethod);
        }

        return DecoratedClass;
      };

      var Observable = function Observable() {
        this.listeners = {};
      };

      Observable.prototype.on = function (event, callback) {
        this.listeners = this.listeners || {};

        if (event in this.listeners) {
          this.listeners[event].push(callback);
        } else {
          this.listeners[event] = [callback];
        }
      };

      Observable.prototype.trigger = function (event) {
        var slice = Array.prototype.slice;
        var params = slice.call(arguments, 1);
        this.listeners = this.listeners || {}; // Params should always come in as an array

        if (params == null) {
          params = [];
        } // If there are no arguments to the event, use a temporary object

        if (params.length === 0) {
          params.push({});
        } // Set the `_type` of the first object to the event

        params[0]._type = event;

        if (event in this.listeners) {
          this.invoke(this.listeners[event], slice.call(arguments, 1));
        }

        if ('*' in this.listeners) {
          this.invoke(this.listeners['*'], arguments);
        }
      };

      Observable.prototype.invoke = function (listeners, params) {
        for (var i = 0, len = listeners.length; i < len; i++) {
          listeners[i].apply(this, params);
        }
      };

      Utils.Observable = Observable;

      Utils.generateChars = function (length) {
        var chars = '';

        for (var i = 0; i < length; i++) {
          var randomChar = Math.floor(Math.random() * 36);
          chars += randomChar.toString(36);
        }

        return chars;
      };

      Utils.bind = function (func, context) {
        return function () {
          func.apply(context, arguments);
        };
      };

      Utils._convertData = function (data) {
        for (var originalKey in data) {
          var keys = originalKey.split('-');
          var dataLevel = data;

          if (keys.length === 1) {
            continue;
          }

          for (var k = 0; k < keys.length; k++) {
            var key = keys[k]; // Lowercase the first letter
            // By default, dash-separated becomes camelCase

            key = key.substring(0, 1).toLowerCase() + key.substring(1);

            if (!(key in dataLevel)) {
              dataLevel[key] = {};
            }

            if (k == keys.length - 1) {
              dataLevel[key] = data[originalKey];
            }

            dataLevel = dataLevel[key];
          }

          delete data[originalKey];
        }

        return data;
      };

      Utils.hasScroll = function (index, el) {
        // Adapted from the function created by @ShadowScripter
        // and adapted by @BillBarry on the Stack Exchange Code Review website.
        // The original code can be found at
        // http://codereview.stackexchange.com/q/13338
        // and was designed to be used with the Sizzle selector engine.
        var $el = $(el);
        var overflowX = el.style.overflowX;
        var overflowY = el.style.overflowY; //Check both x and y declarations

        if (overflowX === overflowY && (overflowY === 'hidden' || overflowY === 'visible')) {
          return false;
        }

        if (overflowX === 'scroll' || overflowY === 'scroll') {
          return true;
        }

        return $el.innerHeight() < el.scrollHeight || $el.innerWidth() < el.scrollWidth;
      };

      Utils.escapeMarkup = function (markup) {
        var replaceMap = {
          '\\': '&#92;',
          '&': '&amp;',
          '<': '&lt;',
          '>': '&gt;',
          '"': '&quot;',
          "'": '&#39;',
          '/': '&#47;',
        }; // Do not try to escape the markup if it's not a string

        if (typeof markup !== 'string') {
          return markup;
        }

        return String(markup).replace(/[&<>"'\/\\]/g, function (match) {
          return replaceMap[match];
        });
      }; // Append an array of jQuery nodes to a given element.

      Utils.appendMany = function ($element, $nodes) {
        // jQuery 1.7.x does not support $.fn.append() with an array
        // Fall back to a jQuery object collection using $.fn.add()
        if ($.fn.jquery.substr(0, 3) === '1.7') {
          var $jqNodes = $();
          $.map($nodes, function (node) {
            $jqNodes = $jqNodes.add(node);
          });
          $nodes = $jqNodes;
        }

        $element.append($nodes);
      };

      return Utils;
    });
    S2.define('select2/results', ['jquery', './utils'], function ($, Utils) {
      function Results($element, options, dataAdapter) {
        this.$element = $element;
        this.data = dataAdapter;
        this.options = options;

        Results.__super__.constructor.call(this);
      }

      Utils.Extend(Results, Utils.Observable);

      Results.prototype.render = function () {
        var $results = $('<ul class="select2-results__options" role="listbox"></ul>');

        if (this.options.get('multiple')) {
          $results.attr('aria-multiselectable', 'true');
        }

        this.$results = $results;
        return $results;
      };

      Results.prototype.clear = function () {
        this.$results.empty();
      };

      Results.prototype.displayMessage = function (params) {
        var escapeMarkup = this.options.get('escapeMarkup');
        this.clear();
        this.hideLoading();
        var $message = $('<li role="alert" aria-live="assertive"' + ' class="select2-results__option"></li>');
        var message = this.options.get('translations').get(params.message);
        $message.append(escapeMarkup(message(params.args)));
        $message[0].className += ' select2-results__message';
        this.$results.append($message);
      };

      Results.prototype.hideMessages = function () {
        this.$results.find('.select2-results__message').remove();
      };

      Results.prototype.append = function (data) {
        this.hideLoading();
        var $options = [];

        if (data.results == null || data.results.length === 0) {
          if (this.$results.children().length === 0) {
            this.trigger('results:message', {
              message: 'noResults',
            });
          }

          return;
        }

        data.results = this.sort(data.results);

        for (var d = 0; d < data.results.length; d++) {
          var item = data.results[d];
          var $option = this.option(item);
          $options.push($option);
        }

        this.$results.append($options);
      };

      Results.prototype.position = function ($results, $dropdown) {
        var $resultsContainer = $dropdown.find('.select2-results');
        $resultsContainer.append($results);
      };

      Results.prototype.sort = function (data) {
        var sorter = this.options.get('sorter');
        return sorter(data);
      };

      Results.prototype.highlightFirstItem = function () {
        var $options = this.$results.find('.select2-results__option[data-selected]');
        var $selected = $options.filter('[data-selected=true]'); // Check if there are any selected options

        if ($selected.length > 0) {
          // If there are selected options, highlight the first
          $selected.first().trigger('mouseenter');
        } else {
          // If there are no selected options, highlight the first option
          // in the dropdown
          $options.first().trigger('mouseenter');
        }

        this.ensureHighlightVisible();
      };

      Results.prototype.setClasses = function () {
        var self = this;
        this.data.current(function (selected) {
          var selectedIds = $.map(selected, function (s) {
            return s.id.toString();
          });
          var $options = self.$results.find('.select2-results__option[data-selected]');
          $options.each(function () {
            var $option = $(this);
            var item = $.data(this, 'data'); // id needs to be converted to a string when comparing

            var id = '' + item.id;

            if (
              (item.element != null && item.element.selected) ||
              (item.element == null && $.inArray(id, selectedIds) > -1)
            ) {
              $option.attr('data-selected', 'true');
            } else {
              $option.attr('data-selected', 'false');
            }
          });
        });
      };

      Results.prototype.showLoading = function (params) {
        this.hideLoading();
        var loadingMore = this.options.get('translations').get('searching');
        var loading = {
          disabled: true,
          loading: true,
          text: loadingMore(params),
        };
        var $loading = this.option(loading);
        $loading.className += ' loading-results';
        this.$results.prepend($loading);
      };

      Results.prototype.hideLoading = function () {
        this.$results.find('.loading-results').remove();
      };

      Results.prototype.option = function (data) {
        var option = document.createElement('li');
        option.className = 'select2-results__option';
        var attrs = {
          role: 'option',
          'data-selected': 'false',
        };

        if (data.disabled) {
          delete attrs['data-selected'];
          attrs['aria-disabled'] = 'true';
        }

        if (data.id == null) {
          delete attrs['data-selected'];
        }

        if (data._resultId != null) {
          option.id = data._resultId;
        }

        if (data.title) {
          option.title = data.title;
        }

        if (data.children) {
          attrs['aria-label'] = data.text;
          delete attrs['data-selected'];
        }

        for (var attr in attrs) {
          var val = attrs[attr];
          option.setAttribute(attr, val);
        }

        if (data.children) {
          var $option = $(option);
          var label = document.createElement('strong');
          label.className = 'select2-results__group';
          var $label = $(label);
          this.template(data, label);
          var $children = [];

          for (var c = 0; c < data.children.length; c++) {
            var child = data.children[c];
            var $child = this.option(child);
            $children.push($child);
          }

          var $childrenContainer = $('<ul></ul>', {
            class: 'select2-results__options select2-results__options--nested',
          });
          $childrenContainer.append($children);
          $option.append(label);
          $option.append($childrenContainer);
        } else {
          this.template(data, option);
        }

        $.data(option, 'data', data);
        return option;
      };

      Results.prototype.bind = function (container, $container) {
        var self = this;
        var id = container.id + '-results';
        this.$results.attr('id', id);
        container.on('results:all', function (params) {
          self.clear();
          self.append(params.data);

          if (container.isOpen()) {
            self.setClasses();
            self.highlightFirstItem();
          }
        });
        container.on('results:append', function (params) {
          self.append(params.data);

          if (container.isOpen()) {
            self.setClasses();
          }
        });
        container.on('query', function (params) {
          self.hideMessages();
          self.showLoading(params);
        });
        container.on('select', function () {
          if (!container.isOpen()) {
            return;
          }

          self.setClasses();
          self.highlightFirstItem();
        });
        container.on('unselect', function () {
          if (!container.isOpen()) {
            return;
          }

          self.setClasses();
          self.highlightFirstItem();
        });
        container.on('open', function () {
          // When the dropdown is open, aria-expended="true"
          self.$results.attr('aria-expanded', 'true');
          self.$results.attr('aria-hidden', 'false');
          self.setClasses();
          self.ensureHighlightVisible();
        });
        container.on('close', function () {
          // When the dropdown is closed, aria-expended="false"
          self.$results.attr('aria-expanded', 'false');
          self.$results.attr('aria-hidden', 'true');
          self.$results.removeAttr('aria-activedescendant');
        });
        container.on('results:toggle', function () {
          var $highlighted = self.getHighlightedResults();

          if ($highlighted.length === 0) {
            return;
          }

          $highlighted.trigger('mouseup');
        });
        container.on('results:select', function () {
          var $highlighted = self.getHighlightedResults();

          if ($highlighted.length === 0) {
            return;
          }

          var data = $highlighted.data('data');

          if ($highlighted.attr('data-selected') == 'true') {
            self.trigger('close', {});
          } else {
            self.trigger('select', {
              data: data,
            });
          }
        });
        container.on('results:previous', function () {
          var $highlighted = self.getHighlightedResults();
          var $options = self.$results.find('[data-selected]');
          var currentIndex = $options.index($highlighted); // If we are already at te top, don't move further

          if (currentIndex === 0) {
            return;
          }

          var nextIndex = currentIndex - 1; // If none are highlighted, highlight the first

          if ($highlighted.length === 0) {
            nextIndex = 0;
          }

          var $next = $options.eq(nextIndex);
          $next.trigger('mouseenter');
          var currentOffset = self.$results.offset().top;
          var nextTop = $next.offset().top;
          var nextOffset = self.$results.scrollTop() + (nextTop - currentOffset);

          if (nextIndex === 0) {
            self.$results.scrollTop(0);
          } else if (nextTop - currentOffset < 0) {
            self.$results.scrollTop(nextOffset);
          }
        });
        container.on('results:next', function () {
          var $highlighted = self.getHighlightedResults();
          var $options = self.$results.find('[data-selected]');
          var currentIndex = $options.index($highlighted);
          var nextIndex = currentIndex + 1; // If we are at the last option, stay there

          if (nextIndex >= $options.length) {
            return;
          }

          var $next = $options.eq(nextIndex);
          $next.trigger('mouseenter');
          var currentOffset = self.$results.offset().top + self.$results.outerHeight(false);
          var nextBottom = $next.offset().top + $next.outerHeight(false);
          var nextOffset = self.$results.scrollTop() + nextBottom - currentOffset;

          if (nextIndex === 0) {
            self.$results.scrollTop(0);
          } else if (nextBottom > currentOffset) {
            self.$results.scrollTop(nextOffset);
          }
        });
        container.on('results:focus', function (params) {
          params.element.addClass('select2-results__option--highlighted').attr('aria-selected', 'true');
          self.$results.attr('aria-activedescendant', params.element.attr('id'));
        });
        container.on('results:message', function (params) {
          self.displayMessage(params);
        });

        if ($.fn.mousewheel) {
          this.$results.on('mousewheel', function (e) {
            var top = self.$results.scrollTop();
            var bottom = self.$results.get(0).scrollHeight - top + e.deltaY;
            var isAtTop = e.deltaY > 0 && top - e.deltaY <= 0;
            var isAtBottom = e.deltaY < 0 && bottom <= self.$results.height();

            if (isAtTop) {
              self.$results.scrollTop(0);
              e.preventDefault();
              e.stopPropagation();
            } else if (isAtBottom) {
              self.$results.scrollTop(self.$results.get(0).scrollHeight - self.$results.height());
              e.preventDefault();
              e.stopPropagation();
            }
          });
        }

        this.$results.on('mouseup', '.select2-results__option[data-selected]', function (evt) {
          var $this = $(this);
          var data = $this.data('data');

          if ($this.attr('data-selected') === 'true') {
            if (self.options.get('multiple')) {
              self.trigger('unselect', {
                originalEvent: evt,
                data: data,
              });
            } else {
              self.trigger('close', {});
            }

            return;
          }

          self.trigger('select', {
            originalEvent: evt,
            data: data,
          });
        });
        this.$results.on('mouseenter', '.select2-results__option[data-selected]', function (evt) {
          var data = $(this).data('data');
          self
            .getHighlightedResults()
            .removeClass('select2-results__option--highlighted')
            .attr('aria-selected', 'false');
          self.trigger('results:focus', {
            data: data,
            element: $(this),
          });
        });
      };

      Results.prototype.getHighlightedResults = function () {
        var $highlighted = this.$results.find('.select2-results__option--highlighted');
        return $highlighted;
      };

      Results.prototype.destroy = function () {
        this.$results.remove();
      };

      Results.prototype.ensureHighlightVisible = function () {
        var $highlighted = this.getHighlightedResults();

        if ($highlighted.length === 0) {
          return;
        }

        var $options = this.$results.find('[data-selected]');
        var currentIndex = $options.index($highlighted);
        var currentOffset = this.$results.offset().top;
        var nextTop = $highlighted.offset().top;
        var nextOffset = this.$results.scrollTop() + (nextTop - currentOffset);
        var offsetDelta = nextTop - currentOffset;
        nextOffset -= $highlighted.outerHeight(false) * 2;

        if (currentIndex <= 2) {
          this.$results.scrollTop(0);
        } else if (offsetDelta > this.$results.outerHeight() || offsetDelta < 0) {
          this.$results.scrollTop(nextOffset);
        }
      };

      Results.prototype.template = function (result, container) {
        var template = this.options.get('templateResult');
        var escapeMarkup = this.options.get('escapeMarkup');
        var content = template(result, container);

        if (content == null) {
          container.style.display = 'none';
        } else if (typeof content === 'string') {
          container.innerHTML = escapeMarkup(content);
        } else {
          $(container).append(content);
        }
      };

      return Results;
    });
    S2.define('select2/keys', [], function () {
      var KEYS = {
        BACKSPACE: 8,
        TAB: 9,
        ENTER: 13,
        SHIFT: 16,
        CTRL: 17,
        ALT: 18,
        ESC: 27,
        SPACE: 32,
        PAGE_UP: 33,
        PAGE_DOWN: 34,
        END: 35,
        HOME: 36,
        LEFT: 37,
        UP: 38,
        RIGHT: 39,
        DOWN: 40,
        DELETE: 46,
      };
      return KEYS;
    });
    S2.define('select2/selection/base', ['jquery', '../utils', '../keys'], function ($, Utils, KEYS) {
      function BaseSelection($element, options) {
        this.$element = $element;
        this.options = options;

        BaseSelection.__super__.constructor.call(this);
      }

      Utils.Extend(BaseSelection, Utils.Observable);

      BaseSelection.prototype.render = function () {
        var $selection = $(
          '<span class="select2-selection" ' + ' aria-haspopup="true" aria-expanded="false">' + '</span>',
        );
        this._tabindex = 0;

        if (this.$element.data('old-tabindex') != null) {
          this._tabindex = this.$element.data('old-tabindex');
        } else if (this.$element.attr('tabindex') != null) {
          this._tabindex = this.$element.attr('tabindex');
        }

        $selection.attr('title', this.$element.attr('title'));
        $selection.attr('tabindex', this._tabindex);
        this.$selection = $selection;
        return $selection;
      };

      BaseSelection.prototype.bind = function (container, $container) {
        var self = this;
        var id = container.id + '-container';
        var resultsId = container.id + '-results';
        var searchHidden = this.options.get('minimumResultsForSearch') === Infinity;
        this.container = container;
        this.$selection.on('focus', function (evt) {
          self.trigger('focus', evt);
        });
        this.$selection.on('blur', function (evt) {
          self._handleBlur(evt);
        });
        this.$selection.on('keydown', function (evt) {
          self.trigger('keypress', evt);

          if (evt.which === KEYS.SPACE) {
            evt.preventDefault();
          }
        });
        container.on('results:focus', function (params) {
          self.$selection.attr('aria-activedescendant', params.data._resultId);
        });
        container.on('selection:update', function (params) {
          self.update(params.data);
        });
        container.on('open', function () {
          // When the dropdown is open, aria-expanded="true"
          self.$selection.attr('aria-expanded', 'true');
          self.$selection.attr('aria-owns', resultsId);

          self._attachCloseHandler(container);
        });
        container.on('close', function () {
          // When the dropdown is closed, aria-expanded="false"
          self.$selection.attr('aria-expanded', 'false');
          self.$selection.removeAttr('aria-activedescendant');
          self.$selection.removeAttr('aria-owns'); // This needs to be delayed as the active element is the body when the
          // key is pressed.

          window.setTimeout(function () {
            self.$selection.focus();
          }, 1);

          self._detachCloseHandler(container);
        });
        container.on('enable', function () {
          self.$selection.attr('tabindex', self._tabindex);
        });
        container.on('disable', function () {
          self.$selection.attr('tabindex', '-1');
        });
      };

      BaseSelection.prototype._handleBlur = function (evt) {
        var self = this; // This needs to be delayed as the active element is the body when the tab
        // key is pressed, possibly along with others.

        window.setTimeout(function () {
          // Don't trigger `blur` if the focus is still in the selection
          if (document.activeElement == self.$selection[0] || $.contains(self.$selection[0], document.activeElement)) {
            return;
          }

          self.trigger('blur', evt);
        }, 1);
      };

      BaseSelection.prototype._attachCloseHandler = function (container) {
        var self = this;
        $(document.body).on('mousedown.select2.' + container.id, function (e) {
          var $target = $(e.target);
          var $select = $target.closest('.select2');
          var $all = $('.select2.select2-container--open');
          $all.each(function () {
            var $this = $(this);

            if (this == $select[0]) {
              return;
            }

            var $element = $this.data('element');
            $element.select2('close');
          });
        });
      };

      BaseSelection.prototype._detachCloseHandler = function (container) {
        $(document.body).off('mousedown.select2.' + container.id);
      };

      BaseSelection.prototype.position = function ($selection, $container) {
        var $selectionContainer = $container.find('.selection');
        $selectionContainer.append($selection);
      };

      BaseSelection.prototype.destroy = function () {
        this._detachCloseHandler(this.container);
      };

      BaseSelection.prototype.update = function (data) {
        throw new Error('The `update` method must be defined in child classes.');
      };

      return BaseSelection;
    });
    S2.define(
      'select2/selection/single',
      ['jquery', './base', '../utils', '../keys'],
      function ($, BaseSelection, Utils, KEYS) {
        function SingleSelection() {
          SingleSelection.__super__.constructor.apply(this, arguments);
        }

        Utils.Extend(SingleSelection, BaseSelection);

        SingleSelection.prototype.render = function () {
          var $selection = SingleSelection.__super__.render.call(this);

          $selection.addClass('select2-selection--single');
          $selection.html(
            '<span class="select2-selection__rendered"></span>' +
              '<span class="select2-selection__arrow" role="presentation">' +
              '<b role="presentation"></b>' +
              '</span>',
          );
          return $selection;
        };

        SingleSelection.prototype.bind = function (container, $container) {
          var self = this;

          SingleSelection.__super__.bind.apply(this, arguments);

          var id = container.id + '-container';
          this.$selection
            .find('.select2-selection__rendered')
            .attr('id', id)
            .attr('role', 'textbox')
            .attr('aria-readonly', 'true');
          this.$selection.attr('aria-labelledby', id); // This makes single non-search selects work in screen readers. If it causes problems elsewhere, remove.

          this.$selection.attr('role', 'combobox');
          this.$selection.on('mousedown', function (evt) {
            // Only respond to left clicks
            if (evt.which !== 1) {
              return;
            }

            self.trigger('toggle', {
              originalEvent: evt,
            });
          });
          this.$selection.on('focus', function (evt) {
            // User focuses on the container
          });
          this.$selection.on('keydown', function (evt) {
            // If user starts typing an alphanumeric key on the keyboard, open if not opened.
            if (!container.isOpen() && evt.which >= 48 && evt.which <= 90) {
              container.open();
            }
          });
          this.$selection.on('blur', function (evt) {
            // User exits the container
          });
          container.on('focus', function (evt) {
            if (!container.isOpen()) {
              self.$selection.focus();
            }
          });
          container.on('selection:update', function (params) {
            self.update(params.data);
          });
        };

        SingleSelection.prototype.clear = function () {
          this.$selection.find('.select2-selection__rendered').empty();
        };

        SingleSelection.prototype.display = function (data, container) {
          var template = this.options.get('templateSelection');
          var escapeMarkup = this.options.get('escapeMarkup');
          return escapeMarkup(template(data, container));
        };

        SingleSelection.prototype.selectionContainer = function () {
          return $('<span></span>');
        };

        SingleSelection.prototype.update = function (data) {
          if (data.length === 0) {
            this.clear();
            return;
          }

          var selection = data[0];
          var $rendered = this.$selection.find('.select2-selection__rendered');
          var formatted = this.display(selection, $rendered);
          $rendered.empty().append(formatted);
          $rendered.prop('title', selection.title || selection.text);
        };

        return SingleSelection;
      },
    );
    S2.define('select2/selection/multiple', ['jquery', './base', '../utils'], function ($, BaseSelection, Utils) {
      function MultipleSelection($element, options) {
        MultipleSelection.__super__.constructor.apply(this, arguments);
      }

      Utils.Extend(MultipleSelection, BaseSelection);

      MultipleSelection.prototype.render = function () {
        var $selection = MultipleSelection.__super__.render.call(this);

        $selection.addClass('select2-selection--multiple');
        $selection.html(
          '<ul class="select2-selection__rendered" aria-live="polite" aria-relevant="additions removals" aria-atomic="true"></ul>',
        );
        return $selection;
      };

      MultipleSelection.prototype.bind = function (container, $container) {
        var self = this;

        MultipleSelection.__super__.bind.apply(this, arguments);

        this.$selection.on('click', function (evt) {
          self.trigger('toggle', {
            originalEvent: evt,
          });
        });
        this.$selection.on('click', '.select2-selection__choice__remove', function (evt) {
          // Ignore the event if it is disabled
          if (self.options.get('disabled')) {
            return;
          }

          var $remove = $(this);
          var $selection = $remove.parent();
          var data = $selection.data('data');
          self.trigger('unselect', {
            originalEvent: evt,
            data: data,
          });
        });
      };

      MultipleSelection.prototype.clear = function () {
        this.$selection.find('.select2-selection__rendered').empty();
      };

      MultipleSelection.prototype.display = function (data, container) {
        var template = this.options.get('templateSelection');
        var escapeMarkup = this.options.get('escapeMarkup');
        return escapeMarkup(template(data, container));
      };

      MultipleSelection.prototype.selectionContainer = function () {
        var $container = $(
          '<li class="select2-selection__choice">' +
            '<span class="select2-selection__choice__remove" role="presentation" aria-hidden="true">' +
            '&times;' +
            '</span>' +
            '</li>',
        );
        return $container;
      };

      MultipleSelection.prototype.update = function (data) {
        this.clear();

        if (data.length === 0) {
          return;
        }

        var $selections = [];

        for (var d = 0; d < data.length; d++) {
          var selection = data[d];
          var $selection = this.selectionContainer();
          var formatted = this.display(selection, $selection);
          $selection.append(formatted);
          $selection.prop('title', selection.title || selection.text);
          $selection.data('data', selection);
          $selections.push($selection);
        }

        var $rendered = this.$selection.find('.select2-selection__rendered');
        Utils.appendMany($rendered, $selections);
      };

      return MultipleSelection;
    });
    S2.define('select2/selection/placeholder', ['../utils'], function (Utils) {
      function Placeholder(decorated, $element, options) {
        this.placeholder = this.normalizePlaceholder(options.get('placeholder'));
        decorated.call(this, $element, options);
      }

      Placeholder.prototype.normalizePlaceholder = function (_, placeholder) {
        if (typeof placeholder === 'string') {
          placeholder = {
            id: '',
            text: placeholder,
          };
        }

        return placeholder;
      };

      Placeholder.prototype.createPlaceholder = function (decorated, placeholder) {
        var $placeholder = this.selectionContainer();
        $placeholder.html(this.display(placeholder));
        $placeholder.addClass('select2-selection__placeholder').removeClass('select2-selection__choice');
        return $placeholder;
      };

      Placeholder.prototype.update = function (decorated, data) {
        var singlePlaceholder = data.length == 1 && data[0].id != this.placeholder.id;
        var multipleSelections = data.length > 1;

        if (multipleSelections || singlePlaceholder) {
          return decorated.call(this, data);
        }

        this.clear();
        var $placeholder = this.createPlaceholder(this.placeholder);
        this.$selection.find('.select2-selection__rendered').append($placeholder);
      };

      return Placeholder;
    });
    S2.define('select2/selection/allowClear', ['jquery', '../keys'], function ($, KEYS) {
      function AllowClear() {}

      AllowClear.prototype.bind = function (decorated, container, $container) {
        var self = this;
        decorated.call(this, container, $container);

        if (this.placeholder == null) {
          if (this.options.get('debug') && window.console && console.error) {
            console.error(
              'Select2: The `allowClear` option should be used in combination ' + 'with the `placeholder` option.',
            );
          }
        }

        this.$selection.on('mousedown', '.select2-selection__clear', function (evt) {
          self._handleClear(evt);
        });
        container.on('keypress', function (evt) {
          self._handleKeyboardClear(evt, container);
        });
      };

      AllowClear.prototype._handleClear = function (_, evt) {
        // Ignore the event if it is disabled
        if (this.options.get('disabled')) {
          return;
        }

        var $clear = this.$selection.find('.select2-selection__clear'); // Ignore the event if nothing has been selected

        if ($clear.length === 0) {
          return;
        }

        evt.stopPropagation();
        var data = $clear.data('data');

        for (var d = 0; d < data.length; d++) {
          var unselectData = {
            data: data[d],
          }; // Trigger the `unselect` event, so people can prevent it from being
          // cleared.

          this.trigger('unselect', unselectData); // If the event was prevented, don't clear it out.

          if (unselectData.prevented) {
            return;
          }
        }

        this.$element.val(this.placeholder.id).trigger('change');
        this.trigger('toggle', {});
      };

      AllowClear.prototype._handleKeyboardClear = function (_, evt, container) {
        if (container.isOpen()) {
          return;
        }

        if (evt.which == KEYS.DELETE || evt.which == KEYS.BACKSPACE) {
          this._handleClear(evt);
        }
      };

      AllowClear.prototype.update = function (decorated, data) {
        decorated.call(this, data);

        if (this.$selection.find('.select2-selection__placeholder').length > 0 || data.length === 0) {
          return;
        }

        var $remove = $('<span class="select2-selection__clear">' + '&times;' + '</span>');
        $remove.data('data', data);
        this.$selection.find('.select2-selection__rendered').prepend($remove);
      };

      return AllowClear;
    });
    S2.define('select2/selection/search', ['jquery', '../utils', '../keys'], function ($, Utils, KEYS) {
      function Search(decorated, $element, options) {
        decorated.call(this, $element, options);
      }

      Search.prototype.render = function (decorated) {
        var $search = $(
          '<li class="select2-search select2-search--inline">' +
            '<input class="select2-search__field" type="text" tabindex="-1"' +
            ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
            ' spellcheck="false" role="textbox" aria-autocomplete="list" />' +
            '</li>',
        );
        this.$searchContainer = $search;
        this.$search = $search.find('input');
        var $rendered = decorated.call(this);

        this._transferTabIndex();

        return $rendered;
      };

      Search.prototype.bind = function (decorated, container, $container) {
        var self = this;
        var resultsId = container.id + '-results';
        decorated.call(this, container, $container);
        container.on('open', function () {
          self.$search.attr('aria-owns', resultsId);
          self.$search.trigger('focus');
        });
        container.on('close', function () {
          self.$search.val('');
          self.$search.removeAttr('aria-activedescendant');
          self.$search.removeAttr('aria-owns');
          self.$search.trigger('focus');
        });
        container.on('enable', function () {
          self.$search.prop('disabled', false);

          self._transferTabIndex();
        });
        container.on('disable', function () {
          self.$search.prop('disabled', true);
        });
        container.on('focus', function (evt) {
          self.$search.trigger('focus');
        });
        container.on('results:focus', function (params) {
          self.$search.attr('aria-activedescendant', params.data._resultId);
        });
        this.$selection.on('focusin', '.select2-search--inline', function (evt) {
          self.trigger('focus', evt);
        });
        this.$selection.on('focusout', '.select2-search--inline', function (evt) {
          self._handleBlur(evt);
        });
        this.$selection.on('keydown', '.select2-search--inline', function (evt) {
          evt.stopPropagation();
          self.trigger('keypress', evt);
          self._keyUpPrevented = evt.isDefaultPrevented();
          var key = evt.which;

          if (key === KEYS.BACKSPACE && self.$search.val() === '') {
            var $previousChoice = self.$searchContainer.prev('.select2-selection__choice');

            if ($previousChoice.length > 0) {
              var item = $previousChoice.data('data');
              self.searchRemoveChoice(item);
              evt.preventDefault();
            }
          }
        }); // Try to detect the IE version should the `documentMode` property that
        // is stored on the document. This is only implemented in IE and is
        // slightly cleaner than doing a user agent check.
        // This property is not available in Edge, but Edge also doesn't have
        // this bug.

        var msie = document.documentMode;
        var disableInputEvents = msie && msie <= 11; // Workaround for browsers which do not support the `input` event
        // This will prevent double-triggering of events for browsers which support
        // both the `keyup` and `input` events.

        this.$selection.on('input.searchcheck', '.select2-search--inline', function (evt) {
          // IE will trigger the `input` event when a placeholder is used on a
          // search box. To get around this issue, we are forced to ignore all
          // `input` events in IE and keep using `keyup`.
          if (disableInputEvents) {
            self.$selection.off('input.search input.searchcheck');
            return;
          } // Unbind the duplicated `keyup` event

          self.$selection.off('keyup.search');
        });
        this.$selection.on('keyup.search input.search', '.select2-search--inline', function (evt) {
          // IE will trigger the `input` event when a placeholder is used on a
          // search box. To get around this issue, we are forced to ignore all
          // `input` events in IE and keep using `keyup`.
          if (disableInputEvents && evt.type === 'input') {
            self.$selection.off('input.search input.searchcheck');
            return;
          }

          var key = evt.which; // We can freely ignore events from modifier keys

          if (key == KEYS.SHIFT || key == KEYS.CTRL || key == KEYS.ALT) {
            return;
          } // Tabbing will be handled during the `keydown` phase

          if (key == KEYS.TAB) {
            return;
          }

          self.handleSearch(evt);
        });
      };
      /**
       * This method will transfer the tabindex attribute from the rendered
       * selection to the search box. This allows for the search box to be used as
       * the primary focus instead of the selection container.
       *
       * @private
       */

      Search.prototype._transferTabIndex = function (decorated) {
        this.$search.attr('tabindex', this.$selection.attr('tabindex'));
        this.$selection.attr('tabindex', '-1');
      };

      Search.prototype.createPlaceholder = function (decorated, placeholder) {
        this.$search.attr('placeholder', placeholder.text);
      };

      Search.prototype.update = function (decorated, data) {
        var searchHadFocus = this.$search[0] == document.activeElement;
        this.$search.attr('placeholder', '');
        decorated.call(this, data);
        this.$selection.find('.select2-selection__rendered').append(this.$searchContainer);
        this.resizeSearch();

        if (searchHadFocus) {
          this.$search.focus();
        }
      };

      Search.prototype.handleSearch = function () {
        this.resizeSearch();

        if (!this._keyUpPrevented) {
          var input = this.$search.val();
          this.trigger('query', {
            term: input,
          });
        }

        this._keyUpPrevented = false;
      };

      Search.prototype.searchRemoveChoice = function (decorated, item) {
        this.trigger('unselect', {
          data: item,
        });
        this.$search.val(item.text);
        this.handleSearch();
      };

      Search.prototype.resizeSearch = function () {
        this.$search.css('width', '25px');
        var width = '';

        if (this.$search.attr('placeholder') !== '') {
          width = this.$selection.find('.select2-selection__rendered').innerWidth();
        } else {
          var minimumWidth = this.$search.val().length + 1;
          width = minimumWidth * 0.75 + 'em';
        }

        this.$search.css('width', width);
      };

      return Search;
    });
    S2.define('select2/selection/eventRelay', ['jquery'], function ($) {
      function EventRelay() {}

      EventRelay.prototype.bind = function (decorated, container, $container) {
        var self = this;
        var relayEvents = ['open', 'opening', 'close', 'closing', 'select', 'selecting', 'unselect', 'unselecting'];
        var preventableEvents = ['opening', 'closing', 'selecting', 'unselecting'];
        decorated.call(this, container, $container);
        container.on('*', function (name, params) {
          // Ignore events that should not be relayed
          if ($.inArray(name, relayEvents) === -1) {
            return;
          } // The parameters should always be an object

          params = params || {}; // Generate the jQuery event for the Select2 event

          var evt = $.Event('select2:' + name, {
            params: params,
          });
          self.$element.trigger(evt); // Only handle preventable events if it was one

          if ($.inArray(name, preventableEvents) === -1) {
            return;
          }

          params.prevented = evt.isDefaultPrevented();
        });
      };

      return EventRelay;
    });
    S2.define('select2/translation', ['jquery', 'require'], function ($, require) {
      function Translation(dict) {
        this.dict = dict || {};
      }

      Translation.prototype.all = function () {
        return this.dict;
      };

      Translation.prototype.get = function (key) {
        return this.dict[key];
      };

      Translation.prototype.extend = function (translation) {
        this.dict = $.extend({}, translation.all(), this.dict);
      }; // Static functions

      Translation._cache = {};

      Translation.loadPath = function (path) {
        if (!(path in Translation._cache)) {
          var translations = require(path);

          Translation._cache[path] = translations;
        }

        return new Translation(Translation._cache[path]);
      };

      return Translation;
    });
    S2.define('select2/diacritics', [], function () {
      var diacritics = {
        '\u24B6': 'A',
        '\uFF21': 'A',
        '\xC0': 'A',
        '\xC1': 'A',
        '\xC2': 'A',
        '\u1EA6': 'A',
        '\u1EA4': 'A',
        '\u1EAA': 'A',
        '\u1EA8': 'A',
        '\xC3': 'A',
        '\u0100': 'A',
        '\u0102': 'A',
        '\u1EB0': 'A',
        '\u1EAE': 'A',
        '\u1EB4': 'A',
        '\u1EB2': 'A',
        '\u0226': 'A',
        '\u01E0': 'A',
        '\xC4': 'A',
        '\u01DE': 'A',
        '\u1EA2': 'A',
        '\xC5': 'A',
        '\u01FA': 'A',
        '\u01CD': 'A',
        '\u0200': 'A',
        '\u0202': 'A',
        '\u1EA0': 'A',
        '\u1EAC': 'A',
        '\u1EB6': 'A',
        '\u1E00': 'A',
        '\u0104': 'A',
        '\u023A': 'A',
        '\u2C6F': 'A',
        '\uA732': 'AA',
        '\xC6': 'AE',
        '\u01FC': 'AE',
        '\u01E2': 'AE',
        '\uA734': 'AO',
        '\uA736': 'AU',
        '\uA738': 'AV',
        '\uA73A': 'AV',
        '\uA73C': 'AY',
        '\u24B7': 'B',
        '\uFF22': 'B',
        '\u1E02': 'B',
        '\u1E04': 'B',
        '\u1E06': 'B',
        '\u0243': 'B',
        '\u0182': 'B',
        '\u0181': 'B',
        '\u24B8': 'C',
        '\uFF23': 'C',
        '\u0106': 'C',
        '\u0108': 'C',
        '\u010A': 'C',
        '\u010C': 'C',
        '\xC7': 'C',
        '\u1E08': 'C',
        '\u0187': 'C',
        '\u023B': 'C',
        '\uA73E': 'C',
        '\u24B9': 'D',
        '\uFF24': 'D',
        '\u1E0A': 'D',
        '\u010E': 'D',
        '\u1E0C': 'D',
        '\u1E10': 'D',
        '\u1E12': 'D',
        '\u1E0E': 'D',
        '\u0110': 'D',
        '\u018B': 'D',
        '\u018A': 'D',
        '\u0189': 'D',
        '\uA779': 'D',
        '\u01F1': 'DZ',
        '\u01C4': 'DZ',
        '\u01F2': 'Dz',
        '\u01C5': 'Dz',
        '\u24BA': 'E',
        '\uFF25': 'E',
        '\xC8': 'E',
        '\xC9': 'E',
        '\xCA': 'E',
        '\u1EC0': 'E',
        '\u1EBE': 'E',
        '\u1EC4': 'E',
        '\u1EC2': 'E',
        '\u1EBC': 'E',
        '\u0112': 'E',
        '\u1E14': 'E',
        '\u1E16': 'E',
        '\u0114': 'E',
        '\u0116': 'E',
        '\xCB': 'E',
        '\u1EBA': 'E',
        '\u011A': 'E',
        '\u0204': 'E',
        '\u0206': 'E',
        '\u1EB8': 'E',
        '\u1EC6': 'E',
        '\u0228': 'E',
        '\u1E1C': 'E',
        '\u0118': 'E',
        '\u1E18': 'E',
        '\u1E1A': 'E',
        '\u0190': 'E',
        '\u018E': 'E',
        '\u24BB': 'F',
        '\uFF26': 'F',
        '\u1E1E': 'F',
        '\u0191': 'F',
        '\uA77B': 'F',
        '\u24BC': 'G',
        '\uFF27': 'G',
        '\u01F4': 'G',
        '\u011C': 'G',
        '\u1E20': 'G',
        '\u011E': 'G',
        '\u0120': 'G',
        '\u01E6': 'G',
        '\u0122': 'G',
        '\u01E4': 'G',
        '\u0193': 'G',
        '\uA7A0': 'G',
        '\uA77D': 'G',
        '\uA77E': 'G',
        '\u24BD': 'H',
        '\uFF28': 'H',
        '\u0124': 'H',
        '\u1E22': 'H',
        '\u1E26': 'H',
        '\u021E': 'H',
        '\u1E24': 'H',
        '\u1E28': 'H',
        '\u1E2A': 'H',
        '\u0126': 'H',
        '\u2C67': 'H',
        '\u2C75': 'H',
        '\uA78D': 'H',
        '\u24BE': 'I',
        '\uFF29': 'I',
        '\xCC': 'I',
        '\xCD': 'I',
        '\xCE': 'I',
        '\u0128': 'I',
        '\u012A': 'I',
        '\u012C': 'I',
        '\u0130': 'I',
        '\xCF': 'I',
        '\u1E2E': 'I',
        '\u1EC8': 'I',
        '\u01CF': 'I',
        '\u0208': 'I',
        '\u020A': 'I',
        '\u1ECA': 'I',
        '\u012E': 'I',
        '\u1E2C': 'I',
        '\u0197': 'I',
        '\u24BF': 'J',
        '\uFF2A': 'J',
        '\u0134': 'J',
        '\u0248': 'J',
        '\u24C0': 'K',
        '\uFF2B': 'K',
        '\u1E30': 'K',
        '\u01E8': 'K',
        '\u1E32': 'K',
        '\u0136': 'K',
        '\u1E34': 'K',
        '\u0198': 'K',
        '\u2C69': 'K',
        '\uA740': 'K',
        '\uA742': 'K',
        '\uA744': 'K',
        '\uA7A2': 'K',
        '\u24C1': 'L',
        '\uFF2C': 'L',
        '\u013F': 'L',
        '\u0139': 'L',
        '\u013D': 'L',
        '\u1E36': 'L',
        '\u1E38': 'L',
        '\u013B': 'L',
        '\u1E3C': 'L',
        '\u1E3A': 'L',
        '\u0141': 'L',
        '\u023D': 'L',
        '\u2C62': 'L',
        '\u2C60': 'L',
        '\uA748': 'L',
        '\uA746': 'L',
        '\uA780': 'L',
        '\u01C7': 'LJ',
        '\u01C8': 'Lj',
        '\u24C2': 'M',
        '\uFF2D': 'M',
        '\u1E3E': 'M',
        '\u1E40': 'M',
        '\u1E42': 'M',
        '\u2C6E': 'M',
        '\u019C': 'M',
        '\u24C3': 'N',
        '\uFF2E': 'N',
        '\u01F8': 'N',
        '\u0143': 'N',
        '\xD1': 'N',
        '\u1E44': 'N',
        '\u0147': 'N',
        '\u1E46': 'N',
        '\u0145': 'N',
        '\u1E4A': 'N',
        '\u1E48': 'N',
        '\u0220': 'N',
        '\u019D': 'N',
        '\uA790': 'N',
        '\uA7A4': 'N',
        '\u01CA': 'NJ',
        '\u01CB': 'Nj',
        '\u24C4': 'O',
        '\uFF2F': 'O',
        '\xD2': 'O',
        '\xD3': 'O',
        '\xD4': 'O',
        '\u1ED2': 'O',
        '\u1ED0': 'O',
        '\u1ED6': 'O',
        '\u1ED4': 'O',
        '\xD5': 'O',
        '\u1E4C': 'O',
        '\u022C': 'O',
        '\u1E4E': 'O',
        '\u014C': 'O',
        '\u1E50': 'O',
        '\u1E52': 'O',
        '\u014E': 'O',
        '\u022E': 'O',
        '\u0230': 'O',
        '\xD6': 'O',
        '\u022A': 'O',
        '\u1ECE': 'O',
        '\u0150': 'O',
        '\u01D1': 'O',
        '\u020C': 'O',
        '\u020E': 'O',
        '\u01A0': 'O',
        '\u1EDC': 'O',
        '\u1EDA': 'O',
        '\u1EE0': 'O',
        '\u1EDE': 'O',
        '\u1EE2': 'O',
        '\u1ECC': 'O',
        '\u1ED8': 'O',
        '\u01EA': 'O',
        '\u01EC': 'O',
        '\xD8': 'O',
        '\u01FE': 'O',
        '\u0186': 'O',
        '\u019F': 'O',
        '\uA74A': 'O',
        '\uA74C': 'O',
        '\u01A2': 'OI',
        '\uA74E': 'OO',
        '\u0222': 'OU',
        '\u24C5': 'P',
        '\uFF30': 'P',
        '\u1E54': 'P',
        '\u1E56': 'P',
        '\u01A4': 'P',
        '\u2C63': 'P',
        '\uA750': 'P',
        '\uA752': 'P',
        '\uA754': 'P',
        '\u24C6': 'Q',
        '\uFF31': 'Q',
        '\uA756': 'Q',
        '\uA758': 'Q',
        '\u024A': 'Q',
        '\u24C7': 'R',
        '\uFF32': 'R',
        '\u0154': 'R',
        '\u1E58': 'R',
        '\u0158': 'R',
        '\u0210': 'R',
        '\u0212': 'R',
        '\u1E5A': 'R',
        '\u1E5C': 'R',
        '\u0156': 'R',
        '\u1E5E': 'R',
        '\u024C': 'R',
        '\u2C64': 'R',
        '\uA75A': 'R',
        '\uA7A6': 'R',
        '\uA782': 'R',
        '\u24C8': 'S',
        '\uFF33': 'S',
        '\u1E9E': 'S',
        '\u015A': 'S',
        '\u1E64': 'S',
        '\u015C': 'S',
        '\u1E60': 'S',
        '\u0160': 'S',
        '\u1E66': 'S',
        '\u1E62': 'S',
        '\u1E68': 'S',
        '\u0218': 'S',
        '\u015E': 'S',
        '\u2C7E': 'S',
        '\uA7A8': 'S',
        '\uA784': 'S',
        '\u24C9': 'T',
        '\uFF34': 'T',
        '\u1E6A': 'T',
        '\u0164': 'T',
        '\u1E6C': 'T',
        '\u021A': 'T',
        '\u0162': 'T',
        '\u1E70': 'T',
        '\u1E6E': 'T',
        '\u0166': 'T',
        '\u01AC': 'T',
        '\u01AE': 'T',
        '\u023E': 'T',
        '\uA786': 'T',
        '\uA728': 'TZ',
        '\u24CA': 'U',
        '\uFF35': 'U',
        '\xD9': 'U',
        '\xDA': 'U',
        '\xDB': 'U',
        '\u0168': 'U',
        '\u1E78': 'U',
        '\u016A': 'U',
        '\u1E7A': 'U',
        '\u016C': 'U',
        '\xDC': 'U',
        '\u01DB': 'U',
        '\u01D7': 'U',
        '\u01D5': 'U',
        '\u01D9': 'U',
        '\u1EE6': 'U',
        '\u016E': 'U',
        '\u0170': 'U',
        '\u01D3': 'U',
        '\u0214': 'U',
        '\u0216': 'U',
        '\u01AF': 'U',
        '\u1EEA': 'U',
        '\u1EE8': 'U',
        '\u1EEE': 'U',
        '\u1EEC': 'U',
        '\u1EF0': 'U',
        '\u1EE4': 'U',
        '\u1E72': 'U',
        '\u0172': 'U',
        '\u1E76': 'U',
        '\u1E74': 'U',
        '\u0244': 'U',
        '\u24CB': 'V',
        '\uFF36': 'V',
        '\u1E7C': 'V',
        '\u1E7E': 'V',
        '\u01B2': 'V',
        '\uA75E': 'V',
        '\u0245': 'V',
        '\uA760': 'VY',
        '\u24CC': 'W',
        '\uFF37': 'W',
        '\u1E80': 'W',
        '\u1E82': 'W',
        '\u0174': 'W',
        '\u1E86': 'W',
        '\u1E84': 'W',
        '\u1E88': 'W',
        '\u2C72': 'W',
        '\u24CD': 'X',
        '\uFF38': 'X',
        '\u1E8A': 'X',
        '\u1E8C': 'X',
        '\u24CE': 'Y',
        '\uFF39': 'Y',
        '\u1EF2': 'Y',
        '\xDD': 'Y',
        '\u0176': 'Y',
        '\u1EF8': 'Y',
        '\u0232': 'Y',
        '\u1E8E': 'Y',
        '\u0178': 'Y',
        '\u1EF6': 'Y',
        '\u1EF4': 'Y',
        '\u01B3': 'Y',
        '\u024E': 'Y',
        '\u1EFE': 'Y',
        '\u24CF': 'Z',
        '\uFF3A': 'Z',
        '\u0179': 'Z',
        '\u1E90': 'Z',
        '\u017B': 'Z',
        '\u017D': 'Z',
        '\u1E92': 'Z',
        '\u1E94': 'Z',
        '\u01B5': 'Z',
        '\u0224': 'Z',
        '\u2C7F': 'Z',
        '\u2C6B': 'Z',
        '\uA762': 'Z',
        '\u24D0': 'a',
        '\uFF41': 'a',
        '\u1E9A': 'a',
        '\xE0': 'a',
        '\xE1': 'a',
        '\xE2': 'a',
        '\u1EA7': 'a',
        '\u1EA5': 'a',
        '\u1EAB': 'a',
        '\u1EA9': 'a',
        '\xE3': 'a',
        '\u0101': 'a',
        '\u0103': 'a',
        '\u1EB1': 'a',
        '\u1EAF': 'a',
        '\u1EB5': 'a',
        '\u1EB3': 'a',
        '\u0227': 'a',
        '\u01E1': 'a',
        '\xE4': 'a',
        '\u01DF': 'a',
        '\u1EA3': 'a',
        '\xE5': 'a',
        '\u01FB': 'a',
        '\u01CE': 'a',
        '\u0201': 'a',
        '\u0203': 'a',
        '\u1EA1': 'a',
        '\u1EAD': 'a',
        '\u1EB7': 'a',
        '\u1E01': 'a',
        '\u0105': 'a',
        '\u2C65': 'a',
        '\u0250': 'a',
        '\uA733': 'aa',
        '\xE6': 'ae',
        '\u01FD': 'ae',
        '\u01E3': 'ae',
        '\uA735': 'ao',
        '\uA737': 'au',
        '\uA739': 'av',
        '\uA73B': 'av',
        '\uA73D': 'ay',
        '\u24D1': 'b',
        '\uFF42': 'b',
        '\u1E03': 'b',
        '\u1E05': 'b',
        '\u1E07': 'b',
        '\u0180': 'b',
        '\u0183': 'b',
        '\u0253': 'b',
        '\u24D2': 'c',
        '\uFF43': 'c',
        '\u0107': 'c',
        '\u0109': 'c',
        '\u010B': 'c',
        '\u010D': 'c',
        '\xE7': 'c',
        '\u1E09': 'c',
        '\u0188': 'c',
        '\u023C': 'c',
        '\uA73F': 'c',
        '\u2184': 'c',
        '\u24D3': 'd',
        '\uFF44': 'd',
        '\u1E0B': 'd',
        '\u010F': 'd',
        '\u1E0D': 'd',
        '\u1E11': 'd',
        '\u1E13': 'd',
        '\u1E0F': 'd',
        '\u0111': 'd',
        '\u018C': 'd',
        '\u0256': 'd',
        '\u0257': 'd',
        '\uA77A': 'd',
        '\u01F3': 'dz',
        '\u01C6': 'dz',
        '\u24D4': 'e',
        '\uFF45': 'e',
        '\xE8': 'e',
        '\xE9': 'e',
        '\xEA': 'e',
        '\u1EC1': 'e',
        '\u1EBF': 'e',
        '\u1EC5': 'e',
        '\u1EC3': 'e',
        '\u1EBD': 'e',
        '\u0113': 'e',
        '\u1E15': 'e',
        '\u1E17': 'e',
        '\u0115': 'e',
        '\u0117': 'e',
        '\xEB': 'e',
        '\u1EBB': 'e',
        '\u011B': 'e',
        '\u0205': 'e',
        '\u0207': 'e',
        '\u1EB9': 'e',
        '\u1EC7': 'e',
        '\u0229': 'e',
        '\u1E1D': 'e',
        '\u0119': 'e',
        '\u1E19': 'e',
        '\u1E1B': 'e',
        '\u0247': 'e',
        '\u025B': 'e',
        '\u01DD': 'e',
        '\u24D5': 'f',
        '\uFF46': 'f',
        '\u1E1F': 'f',
        '\u0192': 'f',
        '\uA77C': 'f',
        '\u24D6': 'g',
        '\uFF47': 'g',
        '\u01F5': 'g',
        '\u011D': 'g',
        '\u1E21': 'g',
        '\u011F': 'g',
        '\u0121': 'g',
        '\u01E7': 'g',
        '\u0123': 'g',
        '\u01E5': 'g',
        '\u0260': 'g',
        '\uA7A1': 'g',
        '\u1D79': 'g',
        '\uA77F': 'g',
        '\u24D7': 'h',
        '\uFF48': 'h',
        '\u0125': 'h',
        '\u1E23': 'h',
        '\u1E27': 'h',
        '\u021F': 'h',
        '\u1E25': 'h',
        '\u1E29': 'h',
        '\u1E2B': 'h',
        '\u1E96': 'h',
        '\u0127': 'h',
        '\u2C68': 'h',
        '\u2C76': 'h',
        '\u0265': 'h',
        '\u0195': 'hv',
        '\u24D8': 'i',
        '\uFF49': 'i',
        '\xEC': 'i',
        '\xED': 'i',
        '\xEE': 'i',
        '\u0129': 'i',
        '\u012B': 'i',
        '\u012D': 'i',
        '\xEF': 'i',
        '\u1E2F': 'i',
        '\u1EC9': 'i',
        '\u01D0': 'i',
        '\u0209': 'i',
        '\u020B': 'i',
        '\u1ECB': 'i',
        '\u012F': 'i',
        '\u1E2D': 'i',
        '\u0268': 'i',
        '\u0131': 'i',
        '\u24D9': 'j',
        '\uFF4A': 'j',
        '\u0135': 'j',
        '\u01F0': 'j',
        '\u0249': 'j',
        '\u24DA': 'k',
        '\uFF4B': 'k',
        '\u1E31': 'k',
        '\u01E9': 'k',
        '\u1E33': 'k',
        '\u0137': 'k',
        '\u1E35': 'k',
        '\u0199': 'k',
        '\u2C6A': 'k',
        '\uA741': 'k',
        '\uA743': 'k',
        '\uA745': 'k',
        '\uA7A3': 'k',
        '\u24DB': 'l',
        '\uFF4C': 'l',
        '\u0140': 'l',
        '\u013A': 'l',
        '\u013E': 'l',
        '\u1E37': 'l',
        '\u1E39': 'l',
        '\u013C': 'l',
        '\u1E3D': 'l',
        '\u1E3B': 'l',
        '\u017F': 'l',
        '\u0142': 'l',
        '\u019A': 'l',
        '\u026B': 'l',
        '\u2C61': 'l',
        '\uA749': 'l',
        '\uA781': 'l',
        '\uA747': 'l',
        '\u01C9': 'lj',
        '\u24DC': 'm',
        '\uFF4D': 'm',
        '\u1E3F': 'm',
        '\u1E41': 'm',
        '\u1E43': 'm',
        '\u0271': 'm',
        '\u026F': 'm',
        '\u24DD': 'n',
        '\uFF4E': 'n',
        '\u01F9': 'n',
        '\u0144': 'n',
        '\xF1': 'n',
        '\u1E45': 'n',
        '\u0148': 'n',
        '\u1E47': 'n',
        '\u0146': 'n',
        '\u1E4B': 'n',
        '\u1E49': 'n',
        '\u019E': 'n',
        '\u0272': 'n',
        '\u0149': 'n',
        '\uA791': 'n',
        '\uA7A5': 'n',
        '\u01CC': 'nj',
        '\u24DE': 'o',
        '\uFF4F': 'o',
        '\xF2': 'o',
        '\xF3': 'o',
        '\xF4': 'o',
        '\u1ED3': 'o',
        '\u1ED1': 'o',
        '\u1ED7': 'o',
        '\u1ED5': 'o',
        '\xF5': 'o',
        '\u1E4D': 'o',
        '\u022D': 'o',
        '\u1E4F': 'o',
        '\u014D': 'o',
        '\u1E51': 'o',
        '\u1E53': 'o',
        '\u014F': 'o',
        '\u022F': 'o',
        '\u0231': 'o',
        '\xF6': 'o',
        '\u022B': 'o',
        '\u1ECF': 'o',
        '\u0151': 'o',
        '\u01D2': 'o',
        '\u020D': 'o',
        '\u020F': 'o',
        '\u01A1': 'o',
        '\u1EDD': 'o',
        '\u1EDB': 'o',
        '\u1EE1': 'o',
        '\u1EDF': 'o',
        '\u1EE3': 'o',
        '\u1ECD': 'o',
        '\u1ED9': 'o',
        '\u01EB': 'o',
        '\u01ED': 'o',
        '\xF8': 'o',
        '\u01FF': 'o',
        '\u0254': 'o',
        '\uA74B': 'o',
        '\uA74D': 'o',
        '\u0275': 'o',
        '\u01A3': 'oi',
        '\u0223': 'ou',
        '\uA74F': 'oo',
        '\u24DF': 'p',
        '\uFF50': 'p',
        '\u1E55': 'p',
        '\u1E57': 'p',
        '\u01A5': 'p',
        '\u1D7D': 'p',
        '\uA751': 'p',
        '\uA753': 'p',
        '\uA755': 'p',
        '\u24E0': 'q',
        '\uFF51': 'q',
        '\u024B': 'q',
        '\uA757': 'q',
        '\uA759': 'q',
        '\u24E1': 'r',
        '\uFF52': 'r',
        '\u0155': 'r',
        '\u1E59': 'r',
        '\u0159': 'r',
        '\u0211': 'r',
        '\u0213': 'r',
        '\u1E5B': 'r',
        '\u1E5D': 'r',
        '\u0157': 'r',
        '\u1E5F': 'r',
        '\u024D': 'r',
        '\u027D': 'r',
        '\uA75B': 'r',
        '\uA7A7': 'r',
        '\uA783': 'r',
        '\u24E2': 's',
        '\uFF53': 's',
        '\xDF': 's',
        '\u015B': 's',
        '\u1E65': 's',
        '\u015D': 's',
        '\u1E61': 's',
        '\u0161': 's',
        '\u1E67': 's',
        '\u1E63': 's',
        '\u1E69': 's',
        '\u0219': 's',
        '\u015F': 's',
        '\u023F': 's',
        '\uA7A9': 's',
        '\uA785': 's',
        '\u1E9B': 's',
        '\u24E3': 't',
        '\uFF54': 't',
        '\u1E6B': 't',
        '\u1E97': 't',
        '\u0165': 't',
        '\u1E6D': 't',
        '\u021B': 't',
        '\u0163': 't',
        '\u1E71': 't',
        '\u1E6F': 't',
        '\u0167': 't',
        '\u01AD': 't',
        '\u0288': 't',
        '\u2C66': 't',
        '\uA787': 't',
        '\uA729': 'tz',
        '\u24E4': 'u',
        '\uFF55': 'u',
        '\xF9': 'u',
        '\xFA': 'u',
        '\xFB': 'u',
        '\u0169': 'u',
        '\u1E79': 'u',
        '\u016B': 'u',
        '\u1E7B': 'u',
        '\u016D': 'u',
        '\xFC': 'u',
        '\u01DC': 'u',
        '\u01D8': 'u',
        '\u01D6': 'u',
        '\u01DA': 'u',
        '\u1EE7': 'u',
        '\u016F': 'u',
        '\u0171': 'u',
        '\u01D4': 'u',
        '\u0215': 'u',
        '\u0217': 'u',
        '\u01B0': 'u',
        '\u1EEB': 'u',
        '\u1EE9': 'u',
        '\u1EEF': 'u',
        '\u1EED': 'u',
        '\u1EF1': 'u',
        '\u1EE5': 'u',
        '\u1E73': 'u',
        '\u0173': 'u',
        '\u1E77': 'u',
        '\u1E75': 'u',
        '\u0289': 'u',
        '\u24E5': 'v',
        '\uFF56': 'v',
        '\u1E7D': 'v',
        '\u1E7F': 'v',
        '\u028B': 'v',
        '\uA75F': 'v',
        '\u028C': 'v',
        '\uA761': 'vy',
        '\u24E6': 'w',
        '\uFF57': 'w',
        '\u1E81': 'w',
        '\u1E83': 'w',
        '\u0175': 'w',
        '\u1E87': 'w',
        '\u1E85': 'w',
        '\u1E98': 'w',
        '\u1E89': 'w',
        '\u2C73': 'w',
        '\u24E7': 'x',
        '\uFF58': 'x',
        '\u1E8B': 'x',
        '\u1E8D': 'x',
        '\u24E8': 'y',
        '\uFF59': 'y',
        '\u1EF3': 'y',
        '\xFD': 'y',
        '\u0177': 'y',
        '\u1EF9': 'y',
        '\u0233': 'y',
        '\u1E8F': 'y',
        '\xFF': 'y',
        '\u1EF7': 'y',
        '\u1E99': 'y',
        '\u1EF5': 'y',
        '\u01B4': 'y',
        '\u024F': 'y',
        '\u1EFF': 'y',
        '\u24E9': 'z',
        '\uFF5A': 'z',
        '\u017A': 'z',
        '\u1E91': 'z',
        '\u017C': 'z',
        '\u017E': 'z',
        '\u1E93': 'z',
        '\u1E95': 'z',
        '\u01B6': 'z',
        '\u0225': 'z',
        '\u0240': 'z',
        '\u2C6C': 'z',
        '\uA763': 'z',
        '\u0386': '\u0391',
        '\u0388': '\u0395',
        '\u0389': '\u0397',
        '\u038A': '\u0399',
        '\u03AA': '\u0399',
        '\u038C': '\u039F',
        '\u038E': '\u03A5',
        '\u03AB': '\u03A5',
        '\u038F': '\u03A9',
        '\u03AC': '\u03B1',
        '\u03AD': '\u03B5',
        '\u03AE': '\u03B7',
        '\u03AF': '\u03B9',
        '\u03CA': '\u03B9',
        '\u0390': '\u03B9',
        '\u03CC': '\u03BF',
        '\u03CD': '\u03C5',
        '\u03CB': '\u03C5',
        '\u03B0': '\u03C5',
        '\u03C9': '\u03C9',
        '\u03C2': '\u03C3',
      };
      return diacritics;
    });
    S2.define('select2/data/base', ['../utils'], function (Utils) {
      function BaseAdapter($element, options) {
        BaseAdapter.__super__.constructor.call(this);
      }

      Utils.Extend(BaseAdapter, Utils.Observable);

      BaseAdapter.prototype.current = function (callback) {
        throw new Error('The `current` method must be defined in child classes.');
      };

      BaseAdapter.prototype.query = function (params, callback) {
        throw new Error('The `query` method must be defined in child classes.');
      };

      BaseAdapter.prototype.bind = function (container, $container) {
        // Can be implemented in subclasses
      };

      BaseAdapter.prototype.destroy = function () {
        // Can be implemented in subclasses
      };

      BaseAdapter.prototype.generateResultId = function (container, data) {
        var id = '';

        if (container != null) {
          id += container.id;
        } else {
          id += Utils.generateChars(4);
        }

        id += '-result-';
        id += Utils.generateChars(4);

        if (data.id != null) {
          id += '-' + data.id.toString();
        } else {
          id += '-' + Utils.generateChars(4);
        }

        return id;
      };

      return BaseAdapter;
    });
    S2.define('select2/data/select', ['./base', '../utils', 'jquery'], function (BaseAdapter, Utils, $) {
      function SelectAdapter($element, options) {
        this.$element = $element;
        this.options = options;

        SelectAdapter.__super__.constructor.call(this);
      }

      Utils.Extend(SelectAdapter, BaseAdapter);

      SelectAdapter.prototype.current = function (callback) {
        var data = [];
        var self = this;
        this.$element.find(':selected').each(function () {
          var $option = $(this);
          var option = self.item($option);
          data.push(option);
        });
        callback(data);
      };

      SelectAdapter.prototype.select = function (data) {
        var self = this;
        data.selected = true; // If data.element is a DOM node, use it instead

        if ($(data.element).is('option')) {
          data.element.selected = true;
          this.$element.trigger('change');
          return;
        }

        if (this.$element.prop('multiple')) {
          this.current(function (currentData) {
            var val = [];
            data = [data];
            data.push.apply(data, currentData);

            for (var d = 0; d < data.length; d++) {
              var id = data[d].id;

              if ($.inArray(id, val) === -1) {
                val.push(id);
              }
            }

            self.$element.val(val);
            self.$element.trigger('change');
          });
        } else {
          var val = data.id;
          this.$element.val(val);
          this.$element.trigger('change');
        }
      };

      SelectAdapter.prototype.unselect = function (data) {
        var self = this;

        if (!this.$element.prop('multiple')) {
          return;
        }

        data.selected = false;

        if ($(data.element).is('option')) {
          data.element.selected = false;
          this.$element.trigger('change');
          return;
        }

        this.current(function (currentData) {
          var val = [];

          for (var d = 0; d < currentData.length; d++) {
            var id = currentData[d].id;

            if (id !== data.id && $.inArray(id, val) === -1) {
              val.push(id);
            }
          }

          self.$element.val(val);
          self.$element.trigger('change');
        });
      };

      SelectAdapter.prototype.bind = function (container, $container) {
        var self = this;
        this.container = container;
        container.on('select', function (params) {
          self.select(params.data);
        });
        container.on('unselect', function (params) {
          self.unselect(params.data);
        });
      };

      SelectAdapter.prototype.destroy = function () {
        // Remove anything added to child elements
        this.$element.find('*').each(function () {
          // Remove any custom data set by Select2
          $.removeData(this, 'data');
        });
      };

      SelectAdapter.prototype.query = function (params, callback) {
        var data = [];
        var self = this;
        var $options = this.$element.children();
        $options.each(function () {
          var $option = $(this);

          if (!$option.is('option') && !$option.is('optgroup')) {
            return;
          }

          var option = self.item($option);
          var matches = self.matches(params, option);

          if (matches !== null) {
            data.push(matches);
          }
        });
        callback({
          results: data,
        });
      };

      SelectAdapter.prototype.addOptions = function ($options) {
        Utils.appendMany(this.$element, $options);
      };

      SelectAdapter.prototype.option = function (data) {
        var option;

        if (data.children) {
          option = document.createElement('optgroup');
          option.label = data.text;
        } else {
          option = document.createElement('option');

          if (option.textContent !== undefined) {
            option.textContent = data.text;
          } else {
            option.innerText = data.text;
          }
        }

        if (data.id !== undefined) {
          option.value = data.id;
        }

        if (data.disabled) {
          option.disabled = true;
        }

        if (data.selected) {
          option.selected = true;
        }

        if (data.title) {
          option.title = data.title;
        }

        var $option = $(option);

        var normalizedData = this._normalizeItem(data);

        normalizedData.element = option; // Override the option's data with the combined data

        $.data(option, 'data', normalizedData);
        return $option;
      };

      SelectAdapter.prototype.item = function ($option) {
        var data = {};
        data = $.data($option[0], 'data');

        if (data != null) {
          return data;
        }

        if ($option.is('option')) {
          data = {
            id: $option.val(),
            text: $option.text(),
            disabled: $option.prop('disabled'),
            selected: $option.prop('selected'),
            title: $option.prop('title'),
          };
        } else if ($option.is('optgroup')) {
          data = {
            text: $option.prop('label'),
            children: [],
            title: $option.prop('title'),
          };
          var $children = $option.children('option');
          var children = [];

          for (var c = 0; c < $children.length; c++) {
            var $child = $($children[c]);
            var child = this.item($child);
            children.push(child);
          }

          data.children = children;
        }

        data = this._normalizeItem(data);
        data.element = $option[0];
        $.data($option[0], 'data', data);
        return data;
      };

      SelectAdapter.prototype._normalizeItem = function (item) {
        if (!$.isPlainObject(item)) {
          item = {
            id: item,
            text: item,
          };
        }

        item = $.extend(
          {},
          {
            text: '',
          },
          item,
        );
        var defaults = {
          selected: false,
          disabled: false,
        };

        if (item.id != null) {
          item.id = item.id.toString();
        }

        if (item.text != null) {
          item.text = item.text.toString();
        }

        if (item._resultId == null && item.id) {
          item._resultId = this.generateResultId(this.container, item);
        }

        return $.extend({}, defaults, item);
      };

      SelectAdapter.prototype.matches = function (params, data) {
        var matcher = this.options.get('matcher');
        return matcher(params, data);
      };

      return SelectAdapter;
    });
    S2.define('select2/data/array', ['./select', '../utils', 'jquery'], function (SelectAdapter, Utils, $) {
      function ArrayAdapter($element, options) {
        var data = options.get('data') || [];

        ArrayAdapter.__super__.constructor.call(this, $element, options);

        this.addOptions(this.convertToOptions(data));
      }

      Utils.Extend(ArrayAdapter, SelectAdapter);

      ArrayAdapter.prototype.select = function (data) {
        var $option = this.$element.find('option').filter(function (i, elm) {
          return elm.value == data.id.toString();
        });

        if ($option.length === 0) {
          $option = this.option(data);
          this.addOptions($option);
        }

        ArrayAdapter.__super__.select.call(this, data);
      };

      ArrayAdapter.prototype.convertToOptions = function (data) {
        var self = this;
        var $existing = this.$element.find('option');
        var existingIds = $existing
          .map(function () {
            return self.item($(this)).id;
          })
          .get();
        var $options = []; // Filter out all items except for the one passed in the argument

        function onlyItem(item) {
          return function () {
            return $(this).val() == item.id;
          };
        }

        for (var d = 0; d < data.length; d++) {
          var item = this._normalizeItem(data[d]); // Skip items which were pre-loaded, only merge the data

          if ($.inArray(item.id, existingIds) >= 0) {
            var $existingOption = $existing.filter(onlyItem(item));
            var existingData = this.item($existingOption);
            var newData = $.extend(true, {}, item, existingData);
            var $newOption = this.option(newData);
            $existingOption.replaceWith($newOption);
            continue;
          }

          var $option = this.option(item);

          if (item.children) {
            var $children = this.convertToOptions(item.children);
            Utils.appendMany($option, $children);
          }

          $options.push($option);
        }

        return $options;
      };

      return ArrayAdapter;
    });
    S2.define('select2/data/ajax', ['./array', '../utils', 'jquery'], function (ArrayAdapter, Utils, $) {
      function AjaxAdapter($element, options) {
        this.ajaxOptions = this._applyDefaults(options.get('ajax'));

        if (this.ajaxOptions.processResults != null) {
          this.processResults = this.ajaxOptions.processResults;
        }

        AjaxAdapter.__super__.constructor.call(this, $element, options);
      }

      Utils.Extend(AjaxAdapter, ArrayAdapter);

      AjaxAdapter.prototype._applyDefaults = function (options) {
        var defaults = {
          data: function data(params) {
            return $.extend({}, params, {
              q: params.term,
            });
          },
          transport: function transport(params, success, failure) {
            var $request = $.ajax(params);
            $request.then(success);
            $request.fail(failure);
            return $request;
          },
        };
        return $.extend({}, defaults, options, true);
      };

      AjaxAdapter.prototype.processResults = function (results) {
        return results;
      };

      AjaxAdapter.prototype.query = function (params, callback) {
        var matches = [];
        var self = this;

        if (this._request != null) {
          // JSONP requests cannot always be aborted
          if ($.isFunction(this._request.abort)) {
            this._request.abort();
          }

          this._request = null;
        }

        var options = $.extend(
          {
            type: 'GET',
          },
          this.ajaxOptions,
        );

        if (typeof options.url === 'function') {
          options.url = options.url.call(this.$element, params);
        }

        if (typeof options.data === 'function') {
          options.data = options.data.call(this.$element, params);
        }

        function request() {
          var $request = options.transport(
            options,
            function (data) {
              var results = self.processResults(data, params);

              if (self.options.get('debug') && window.console && console.error) {
                // Check to make sure that the response included a `results` key.
                if (!results || !results.results || !$.isArray(results.results)) {
                  console.error(
                    'Select2: The AJAX results did not return an array in the ' + '`results` key of the response.',
                  );
                }
              }

              callback(results);
            },
            function () {
              // Attempt to detect if a request was aborted
              // Only works if the transport exposes a status property
              if ($request.status && $request.status === '0') {
                return;
              }

              self.trigger('results:message', {
                message: 'errorLoading',
              });
            },
          );
          self._request = $request;
        }

        if (this.ajaxOptions.delay && params.term != null) {
          if (this._queryTimeout) {
            window.clearTimeout(this._queryTimeout);
          }

          this._queryTimeout = window.setTimeout(request, this.ajaxOptions.delay);
        } else {
          request();
        }
      };

      return AjaxAdapter;
    });
    S2.define('select2/data/tags', ['jquery'], function ($) {
      function Tags(decorated, $element, options) {
        var tags = options.get('tags');
        var createTag = options.get('createTag');

        if (createTag !== undefined) {
          this.createTag = createTag;
        }

        var insertTag = options.get('insertTag');

        if (insertTag !== undefined) {
          this.insertTag = insertTag;
        }

        decorated.call(this, $element, options);

        if ($.isArray(tags)) {
          for (var t = 0; t < tags.length; t++) {
            var tag = tags[t];

            var item = this._normalizeItem(tag);

            var $option = this.option(item);
            this.$element.append($option);
          }
        }
      }

      Tags.prototype.query = function (decorated, params, callback) {
        var self = this;

        this._removeOldTags();

        if (params.term == null || params.page != null) {
          decorated.call(this, params, callback);
          return;
        }

        function wrapper(obj, child) {
          var data = obj.results;

          for (var i = 0; i < data.length; i++) {
            var option = data[i];
            var checkChildren =
              option.children != null &&
              !wrapper(
                {
                  results: option.children,
                },
                true,
              );
            var optionText = (option.text || '').toUpperCase();
            var paramsTerm = (params.term || '').toUpperCase();
            var checkText = optionText === paramsTerm;

            if (checkText || checkChildren) {
              if (child) {
                return false;
              }

              obj.data = data;
              callback(obj);
              return;
            }
          }

          if (child) {
            return true;
          }

          var tag = self.createTag(params);

          if (tag != null) {
            var $option = self.option(tag);
            $option.attr('data-select2-tag', true);
            self.addOptions([$option]);
            self.insertTag(data, tag);
          }

          obj.results = data;
          callback(obj);
        }

        decorated.call(this, params, wrapper);
      };

      Tags.prototype.createTag = function (decorated, params) {
        var term = $.trim(params.term);

        if (term === '') {
          return null;
        }

        return {
          id: term,
          text: term,
        };
      };

      Tags.prototype.insertTag = function (_, data, tag) {
        data.unshift(tag);
      };

      Tags.prototype._removeOldTags = function (_) {
        var tag = this._lastTag;
        var $options = this.$element.find('option[data-select2-tag]');
        $options.each(function () {
          if (this.selected) {
            return;
          }

          $(this).remove();
        });
      };

      return Tags;
    });
    S2.define('select2/data/tokenizer', ['jquery'], function ($) {
      function Tokenizer(decorated, $element, options) {
        var tokenizer = options.get('tokenizer');

        if (tokenizer !== undefined) {
          this.tokenizer = tokenizer;
        }

        decorated.call(this, $element, options);
      }

      Tokenizer.prototype.bind = function (decorated, container, $container) {
        decorated.call(this, container, $container);
        this.$search =
          container.dropdown.$search || container.selection.$search || $container.find('.select2-search__field');
      };

      Tokenizer.prototype.query = function (decorated, params, callback) {
        var self = this;

        function createAndSelect(data) {
          // Normalize the data object so we can use it for checks
          var item = self._normalizeItem(data); // Check if the data object already exists as a tag
          // Select it if it doesn't

          var $existingOptions = self.$element.find('option').filter(function () {
            return $(this).val() === item.id;
          }); // If an existing option wasn't found for it, create the option

          if (!$existingOptions.length) {
            var $option = self.option(item);
            $option.attr('data-select2-tag', true);

            self._removeOldTags();

            self.addOptions([$option]);
          } // Select the item, now that we know there is an option for it

          select(item);
        }

        function select(data) {
          self.trigger('select', {
            data: data,
          });
        }

        params.term = params.term || '';
        var tokenData = this.tokenizer(params, this.options, createAndSelect);

        if (tokenData.term !== params.term) {
          // Replace the search term if we have the search box
          if (this.$search.length) {
            this.$search.val(tokenData.term);
            this.$search.focus();
          }

          params.term = tokenData.term;
        }

        decorated.call(this, params, callback);
      };

      Tokenizer.prototype.tokenizer = function (_, params, options, callback) {
        var separators = options.get('tokenSeparators') || [];
        var term = params.term;
        var i = 0;

        var createTag =
          this.createTag ||
          function (params) {
            return {
              id: params.term,
              text: params.term,
            };
          };

        while (i < term.length) {
          var termChar = term[i];

          if ($.inArray(termChar, separators) === -1) {
            i++;
            continue;
          }

          var part = term.substr(0, i);
          var partParams = $.extend({}, params, {
            term: part,
          });
          var data = createTag(partParams);

          if (data == null) {
            i++;
            continue;
          }

          callback(data); // Reset the term to not include the tokenized portion

          term = term.substr(i + 1) || '';
          i = 0;
        }

        return {
          term: term,
        };
      };

      return Tokenizer;
    });
    S2.define('select2/data/minimumInputLength', [], function () {
      function MinimumInputLength(decorated, $e, options) {
        this.minimumInputLength = options.get('minimumInputLength');
        decorated.call(this, $e, options);
      }

      MinimumInputLength.prototype.query = function (decorated, params, callback) {
        params.term = params.term || '';

        if (params.term.length < this.minimumInputLength) {
          this.trigger('results:message', {
            message: 'inputTooShort',
            args: {
              minimum: this.minimumInputLength,
              input: params.term,
              params: params,
            },
          });
          return;
        }

        decorated.call(this, params, callback);
      };

      return MinimumInputLength;
    });
    S2.define('select2/data/maximumInputLength', [], function () {
      function MaximumInputLength(decorated, $e, options) {
        this.maximumInputLength = options.get('maximumInputLength');
        decorated.call(this, $e, options);
      }

      MaximumInputLength.prototype.query = function (decorated, params, callback) {
        params.term = params.term || '';

        if (this.maximumInputLength > 0 && params.term.length > this.maximumInputLength) {
          this.trigger('results:message', {
            message: 'inputTooLong',
            args: {
              maximum: this.maximumInputLength,
              input: params.term,
              params: params,
            },
          });
          return;
        }

        decorated.call(this, params, callback);
      };

      return MaximumInputLength;
    });
    S2.define('select2/data/maximumSelectionLength', [], function () {
      function MaximumSelectionLength(decorated, $e, options) {
        this.maximumSelectionLength = options.get('maximumSelectionLength');
        decorated.call(this, $e, options);
      }

      MaximumSelectionLength.prototype.query = function (decorated, params, callback) {
        var self = this;
        this.current(function (currentData) {
          var count = currentData != null ? currentData.length : 0;

          if (self.maximumSelectionLength > 0 && count >= self.maximumSelectionLength) {
            self.trigger('results:message', {
              message: 'maximumSelected',
              args: {
                maximum: self.maximumSelectionLength,
              },
            });
            return;
          }

          decorated.call(self, params, callback);
        });
      };

      return MaximumSelectionLength;
    });
    S2.define('select2/dropdown', ['jquery', './utils'], function ($, Utils) {
      function Dropdown($element, options) {
        this.$element = $element;
        this.options = options;

        Dropdown.__super__.constructor.call(this);
      }

      Utils.Extend(Dropdown, Utils.Observable);

      Dropdown.prototype.render = function () {
        var $dropdown = $('<span class="select2-dropdown">' + '<span class="select2-results"></span>' + '</span>');
        $dropdown.attr('dir', this.options.get('dir'));
        this.$dropdown = $dropdown;
        return $dropdown;
      };

      Dropdown.prototype.bind = function () {
        // Should be implemented in subclasses
      };

      Dropdown.prototype.position = function ($dropdown, $container) {
        // Should be implmented in subclasses
      };

      Dropdown.prototype.destroy = function () {
        // Remove the dropdown from the DOM
        this.$dropdown.remove();
      };

      return Dropdown;
    });
    S2.define('select2/dropdown/search', ['jquery', '../utils'], function ($, Utils) {
      function Search() {}

      Search.prototype.render = function (decorated) {
        var $rendered = decorated.call(this);
        var $search = $(
          '<span class="select2-search select2-search--dropdown">' +
            '<input class="select2-search__field" type="text" tabindex="-1"' +
            ' autocomplete="off" autocorrect="off" autocapitalize="off"' +
            ' spellcheck="false" role="combobox" aria-autocomplete="list" aria-expanded="true" />' +
            '</span>',
        );
        this.$searchContainer = $search;
        this.$search = $search.find('input');
        $rendered.prepend($search);
        return $rendered;
      };

      Search.prototype.bind = function (decorated, container, $container) {
        var self = this;
        var resultsId = container.id + '-results';
        decorated.call(this, container, $container);
        this.$search.on('keydown', function (evt) {
          self.trigger('keypress', evt);
          self._keyUpPrevented = evt.isDefaultPrevented();
        }); // Workaround for browsers which do not support the `input` event
        // This will prevent double-triggering of events for browsers which support
        // both the `keyup` and `input` events.

        this.$search.on('input', function (evt) {
          // Unbind the duplicated `keyup` event
          $(this).off('keyup');
        });
        this.$search.on('keyup input', function (evt) {
          self.handleSearch(evt);
        });
        container.on('open', function () {
          self.$search.attr('tabindex', 0);
          self.$search.attr('aria-owns', resultsId);
          self.$search.focus();
          window.setTimeout(function () {
            self.$search.focus();
          }, 0);
        });
        container.on('close', function () {
          self.$search.attr('tabindex', -1);
          self.$search.removeAttr('aria-activedescendant');
          self.$search.removeAttr('aria-owns');
          self.$search.val('');
        });
        container.on('focus', function () {
          if (container.isOpen()) {
            self.$search.focus();
          }
        });
        container.on('results:all', function (params) {
          if (params.query.term == null || params.query.term === '') {
            var showSearch = self.showSearch(params);

            if (showSearch) {
              self.$searchContainer.removeClass('select2-search--hide');
            } else {
              self.$searchContainer.addClass('select2-search--hide');
            }
          }
        });
        container.on('results:focus', function (params) {
          self.$search.attr('aria-activedescendant', params.data._resultId);
        });
      };

      Search.prototype.handleSearch = function (evt) {
        if (!this._keyUpPrevented) {
          var input = this.$search.val();
          this.trigger('query', {
            term: input,
          });
        }

        this._keyUpPrevented = false;
      };

      Search.prototype.showSearch = function (_, params) {
        return true;
      };

      return Search;
    });
    S2.define('select2/dropdown/hidePlaceholder', [], function () {
      function HidePlaceholder(decorated, $element, options, dataAdapter) {
        this.placeholder = this.normalizePlaceholder(options.get('placeholder'));
        decorated.call(this, $element, options, dataAdapter);
      }

      HidePlaceholder.prototype.append = function (decorated, data) {
        data.results = this.removePlaceholder(data.results);
        decorated.call(this, data);
      };

      HidePlaceholder.prototype.normalizePlaceholder = function (_, placeholder) {
        if (typeof placeholder === 'string') {
          placeholder = {
            id: '',
            text: placeholder,
          };
        }

        return placeholder;
      };

      HidePlaceholder.prototype.removePlaceholder = function (_, data) {
        var modifiedData = data.slice(0);

        for (var d = data.length - 1; d >= 0; d--) {
          var item = data[d];

          if (this.placeholder.id === item.id) {
            modifiedData.splice(d, 1);
          }
        }

        return modifiedData;
      };

      return HidePlaceholder;
    });
    S2.define('select2/dropdown/infiniteScroll', ['jquery'], function ($) {
      function InfiniteScroll(decorated, $element, options, dataAdapter) {
        this.lastParams = {};
        decorated.call(this, $element, options, dataAdapter);
        this.$loadingMore = this.createLoadingMore();
        this.loading = false;
      }

      InfiniteScroll.prototype.append = function (decorated, data) {
        this.$loadingMore.remove();
        this.loading = false;
        decorated.call(this, data);

        if (this.showLoadingMore(data)) {
          this.$results.append(this.$loadingMore);
        }
      };

      InfiniteScroll.prototype.bind = function (decorated, container, $container) {
        var self = this;
        decorated.call(this, container, $container);
        container.on('query', function (params) {
          self.lastParams = params;
          self.loading = true;
        });
        container.on('query:append', function (params) {
          self.lastParams = params;
          self.loading = true;
        });
        this.$results.on('scroll', function () {
          var isLoadMoreVisible = $.contains(document.documentElement, self.$loadingMore[0]);

          if (self.loading || !isLoadMoreVisible) {
            return;
          }

          var currentOffset = self.$results.offset().top + self.$results.outerHeight(false);
          var loadingMoreOffset = self.$loadingMore.offset().top + self.$loadingMore.outerHeight(false);

          if (currentOffset + 50 >= loadingMoreOffset) {
            self.loadMore();
          }
        });
      };

      InfiniteScroll.prototype.loadMore = function () {
        this.loading = true;
        var params = $.extend(
          {},
          {
            page: 1,
          },
          this.lastParams,
        );
        params.page++;
        this.trigger('query:append', params);
      };

      InfiniteScroll.prototype.showLoadingMore = function (_, data) {
        return data.pagination && data.pagination.more;
      };

      InfiniteScroll.prototype.createLoadingMore = function () {
        var $option = $(
          '<li ' +
            'class="select2-results__option select2-results__option--load-more"' +
            'role="option" aria-disabled="true"></li>',
        );
        var message = this.options.get('translations').get('loadingMore');
        $option.html(message(this.lastParams));
        return $option;
      };

      return InfiniteScroll;
    });
    S2.define('select2/dropdown/attachBody', ['jquery', '../utils'], function ($, Utils) {
      function AttachBody(decorated, $element, options) {
        this.$dropdownParent = options.get('dropdownParent') || $(document.body);
        decorated.call(this, $element, options);
      }

      AttachBody.prototype.bind = function (decorated, container, $container) {
        var self = this;
        var setupResultsEvents = false;
        decorated.call(this, container, $container);
        container.on('open', function () {
          self._showDropdown();

          self._attachPositioningHandler(container);

          if (!setupResultsEvents) {
            setupResultsEvents = true;
            container.on('results:all', function () {
              self._positionDropdown();

              self._resizeDropdown();
            });
            container.on('results:append', function () {
              self._positionDropdown();

              self._resizeDropdown();
            });
          }
        });
        container.on('close', function () {
          self._hideDropdown();

          self._detachPositioningHandler(container);
        });
        this.$dropdownContainer.on('mousedown', function (evt) {
          evt.stopPropagation();
        });
      };

      AttachBody.prototype.destroy = function (decorated) {
        decorated.call(this);
        this.$dropdownContainer.remove();
      };

      AttachBody.prototype.position = function (decorated, $dropdown, $container) {
        // Clone all of the container classes
        $dropdown.attr('class', $container.attr('class'));
        $dropdown.removeClass('select2');
        $dropdown.addClass('select2-container--open');
        $dropdown.css({
          position: 'absolute',
          top: -999999,
        });
        this.$container = $container;
      };

      AttachBody.prototype.render = function (decorated) {
        var $container = $('<span></span>');
        var $dropdown = decorated.call(this);
        $container.append($dropdown);
        this.$dropdownContainer = $container;
        return $container;
      };

      AttachBody.prototype._hideDropdown = function (decorated) {
        this.$dropdownContainer.detach();
      };

      AttachBody.prototype._attachPositioningHandler = function (decorated, container) {
        var self = this;
        var scrollEvent = 'scroll.select2.' + container.id;
        var resizeEvent = 'resize.select2.' + container.id;
        var orientationEvent = 'orientationchange.select2.' + container.id;
        var $watchers = this.$container.parents().filter(Utils.hasScroll);
        $watchers.each(function () {
          $(this).data('select2-scroll-position', {
            x: $(this).scrollLeft(),
            y: $(this).scrollTop(),
          });
        });
        $watchers.on(scrollEvent, function (ev) {
          var position = $(this).data('select2-scroll-position');
          $(this).scrollTop(position.y);
        });
        $(window).on(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent, function (e) {
          self._positionDropdown();

          self._resizeDropdown();
        });
      };

      AttachBody.prototype._detachPositioningHandler = function (decorated, container) {
        var scrollEvent = 'scroll.select2.' + container.id;
        var resizeEvent = 'resize.select2.' + container.id;
        var orientationEvent = 'orientationchange.select2.' + container.id;
        var $watchers = this.$container.parents().filter(Utils.hasScroll);
        $watchers.off(scrollEvent);
        $(window).off(scrollEvent + ' ' + resizeEvent + ' ' + orientationEvent);
      };

      AttachBody.prototype._positionDropdown = function () {
        var $window = $(window);
        var isCurrentlyAbove = this.$dropdown.hasClass('select2-dropdown--above');
        var isCurrentlyBelow = this.$dropdown.hasClass('select2-dropdown--below');
        var newDirection = null;
        var offset = this.$container.offset();
        offset.bottom = offset.top + this.$container.outerHeight(false);
        var container = {
          height: this.$container.outerHeight(false),
        };
        container.top = offset.top;
        container.bottom = offset.top + container.height;
        var dropdown = {
          height: this.$dropdown.outerHeight(false),
        };
        var viewport = {
          top: $window.scrollTop(),
          bottom: $window.scrollTop() + $window.height(),
        };
        var enoughRoomAbove = viewport.top < offset.top - dropdown.height;
        var enoughRoomBelow = viewport.bottom > offset.bottom + dropdown.height;
        var css = {
          left: offset.left,
          top: container.bottom,
        }; // Determine what the parent element is to use for calciulating the offset

        var $offsetParent = this.$dropdownParent; // For statically positoned elements, we need to get the element
        // that is determining the offset

        if ($offsetParent.css('position') === 'static') {
          $offsetParent = $offsetParent.offsetParent();
        }

        var parentOffset = $offsetParent.offset();
        css.top -= parentOffset.top;
        css.left -= parentOffset.left;

        if (!isCurrentlyAbove && !isCurrentlyBelow) {
          newDirection = 'below';
        }

        if (!enoughRoomBelow && enoughRoomAbove && !isCurrentlyAbove) {
          newDirection = 'above';
        } else if (!enoughRoomAbove && enoughRoomBelow && isCurrentlyAbove) {
          newDirection = 'below';
        }

        if (newDirection == 'above' || (isCurrentlyAbove && newDirection !== 'below')) {
          css.top = container.top - parentOffset.top - dropdown.height;
        }

        if (newDirection != null) {
          this.$dropdown
            .removeClass('select2-dropdown--below select2-dropdown--above')
            .addClass('select2-dropdown--' + newDirection);
          this.$container
            .removeClass('select2-container--below select2-container--above')
            .addClass('select2-container--' + newDirection);
        }

        this.$dropdownContainer.css(css);
      };

      AttachBody.prototype._resizeDropdown = function () {
        var css = {
          width: this.$container.outerWidth(false) + 'px',
        };

        if (this.options.get('dropdownAutoWidth')) {
          css.minWidth = css.width;
          css.position = 'relative';
          css.width = 'auto';
        }

        this.$dropdown.css(css);
      };

      AttachBody.prototype._showDropdown = function (decorated) {
        this.$dropdownContainer.appendTo(this.$dropdownParent);

        this._positionDropdown();

        this._resizeDropdown();
      };

      return AttachBody;
    });
    S2.define('select2/dropdown/minimumResultsForSearch', [], function () {
      function countResults(data) {
        var count = 0;

        for (var d = 0; d < data.length; d++) {
          var item = data[d];

          if (item.children) {
            count += countResults(item.children);
          } else {
            count++;
          }
        }

        return count;
      }

      function MinimumResultsForSearch(decorated, $element, options, dataAdapter) {
        this.minimumResultsForSearch = options.get('minimumResultsForSearch');

        if (this.minimumResultsForSearch < 0) {
          this.minimumResultsForSearch = Infinity;
        }

        decorated.call(this, $element, options, dataAdapter);
      }

      MinimumResultsForSearch.prototype.showSearch = function (decorated, params) {
        if (countResults(params.data.results) < this.minimumResultsForSearch) {
          return false;
        }

        return decorated.call(this, params);
      };

      return MinimumResultsForSearch;
    });
    S2.define('select2/dropdown/selectOnClose', [], function () {
      function SelectOnClose() {}

      SelectOnClose.prototype.bind = function (decorated, container, $container) {
        var self = this;
        decorated.call(this, container, $container);
        container.on('close', function (params) {
          self._handleSelectOnClose(params);
        });
      };

      SelectOnClose.prototype._handleSelectOnClose = function (_, params) {
        if (params && params.originalSelect2Event != null) {
          var event = params.originalSelect2Event; // Don't select an item if the close event was triggered from a select or
          // unselect event

          if (event._type === 'select' || event._type === 'unselect') {
            return;
          }
        }

        var $highlightedResults = this.getHighlightedResults(); // Only select highlighted results

        if ($highlightedResults.length < 1) {
          return;
        }

        var data = $highlightedResults.data('data'); // Don't re-select already selected resulte

        if ((data.element != null && data.element.selected) || (data.element == null && data.selected)) {
          return;
        }

        this.trigger('select', {
          data: data,
        });
      };

      return SelectOnClose;
    });
    S2.define('select2/dropdown/closeOnSelect', [], function () {
      function CloseOnSelect() {}

      CloseOnSelect.prototype.bind = function (decorated, container, $container) {
        var self = this;
        decorated.call(this, container, $container);
        container.on('select', function (evt) {
          self._selectTriggered(evt);
        });
        container.on('unselect', function (evt) {
          self._selectTriggered(evt);
        });
      };

      CloseOnSelect.prototype._selectTriggered = function (_, evt) {
        var originalEvent = evt.originalEvent; // Don't close if the control key is being held

        if (originalEvent && originalEvent.ctrlKey) {
          return;
        }

        this.trigger('close', {
          originalEvent: originalEvent,
          originalSelect2Event: evt,
        });
      };

      return CloseOnSelect;
    });
    S2.define('select2/i18n/en', [], function () {
      // English
      return {
        errorLoading: function errorLoading() {
          return 'The results could not be loaded.';
        },
        inputTooLong: function inputTooLong(args) {
          var overChars = args.input.length - args.maximum;
          var message = 'Please delete ' + overChars + ' character';

          if (overChars != 1) {
            message += 's';
          }

          return message;
        },
        inputTooShort: function inputTooShort(args) {
          var remainingChars = args.minimum - args.input.length;
          var message = 'Please enter ' + remainingChars + ' or more characters';
          return message;
        },
        loadingMore: function loadingMore() {
          return 'Loading more results…';
        },
        maximumSelected: function maximumSelected(args) {
          var message = 'You can only select ' + args.maximum + ' item';

          if (args.maximum != 1) {
            message += 's';
          }

          return message;
        },
        noResults: function noResults() {
          return 'No results found';
        },
        searching: function searching() {
          return 'Searching…';
        },
      };
    });
    S2.define(
      'select2/defaults',
      [
        'jquery',
        'require',
        './results',
        './selection/single',
        './selection/multiple',
        './selection/placeholder',
        './selection/allowClear',
        './selection/search',
        './selection/eventRelay',
        './utils',
        './translation',
        './diacritics',
        './data/select',
        './data/array',
        './data/ajax',
        './data/tags',
        './data/tokenizer',
        './data/minimumInputLength',
        './data/maximumInputLength',
        './data/maximumSelectionLength',
        './dropdown',
        './dropdown/search',
        './dropdown/hidePlaceholder',
        './dropdown/infiniteScroll',
        './dropdown/attachBody',
        './dropdown/minimumResultsForSearch',
        './dropdown/selectOnClose',
        './dropdown/closeOnSelect',
        './i18n/en',
      ],
      function (
        $,
        require,
        ResultsList,
        SingleSelection,
        MultipleSelection,
        Placeholder,
        AllowClear,
        SelectionSearch,
        EventRelay,
        Utils,
        Translation,
        DIACRITICS,
        SelectData,
        ArrayData,
        AjaxData,
        Tags,
        Tokenizer,
        MinimumInputLength,
        MaximumInputLength,
        MaximumSelectionLength,
        Dropdown,
        DropdownSearch,
        HidePlaceholder,
        InfiniteScroll,
        AttachBody,
        MinimumResultsForSearch,
        SelectOnClose,
        CloseOnSelect,
        EnglishTranslation,
      ) {
        function Defaults() {
          this.reset();
        }

        Defaults.prototype.apply = function (options) {
          options = $.extend(true, {}, this.defaults, options);

          if (options.dataAdapter == null) {
            if (options.ajax != null) {
              options.dataAdapter = AjaxData;
            } else if (options.data != null) {
              options.dataAdapter = ArrayData;
            } else {
              options.dataAdapter = SelectData;
            }

            if (options.minimumInputLength > 0) {
              options.dataAdapter = Utils.Decorate(options.dataAdapter, MinimumInputLength);
            }

            if (options.maximumInputLength > 0) {
              options.dataAdapter = Utils.Decorate(options.dataAdapter, MaximumInputLength);
            }

            if (options.maximumSelectionLength > 0) {
              options.dataAdapter = Utils.Decorate(options.dataAdapter, MaximumSelectionLength);
            }

            if (options.tags) {
              options.dataAdapter = Utils.Decorate(options.dataAdapter, Tags);
            }

            if (options.tokenSeparators != null || options.tokenizer != null) {
              options.dataAdapter = Utils.Decorate(options.dataAdapter, Tokenizer);
            }

            if (options.query != null) {
              var Query = require(options.amdBase + 'compat/query');

              options.dataAdapter = Utils.Decorate(options.dataAdapter, Query);
            }

            if (options.initSelection != null) {
              var InitSelection = require(options.amdBase + 'compat/initSelection');

              options.dataAdapter = Utils.Decorate(options.dataAdapter, InitSelection);
            }
          }

          if (options.resultsAdapter == null) {
            options.resultsAdapter = ResultsList;

            if (options.ajax != null) {
              options.resultsAdapter = Utils.Decorate(options.resultsAdapter, InfiniteScroll);
            }

            if (options.placeholder != null) {
              options.resultsAdapter = Utils.Decorate(options.resultsAdapter, HidePlaceholder);
            }

            if (options.selectOnClose) {
              options.resultsAdapter = Utils.Decorate(options.resultsAdapter, SelectOnClose);
            }
          }

          if (options.dropdownAdapter == null) {
            if (options.multiple) {
              options.dropdownAdapter = Dropdown;
            } else {
              var SearchableDropdown = Utils.Decorate(Dropdown, DropdownSearch);
              options.dropdownAdapter = SearchableDropdown;
            }

            if (options.minimumResultsForSearch !== 0) {
              options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, MinimumResultsForSearch);
            }

            if (options.closeOnSelect) {
              options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, CloseOnSelect);
            }

            if (
              options.dropdownCssClass != null ||
              options.dropdownCss != null ||
              options.adaptDropdownCssClass != null
            ) {
              var DropdownCSS = require(options.amdBase + 'compat/dropdownCss');

              options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, DropdownCSS);
            }

            options.dropdownAdapter = Utils.Decorate(options.dropdownAdapter, AttachBody);
          }

          if (options.selectionAdapter == null) {
            if (options.multiple) {
              options.selectionAdapter = MultipleSelection;
            } else {
              options.selectionAdapter = SingleSelection;
            } // Add the placeholder mixin if a placeholder was specified

            if (options.placeholder != null) {
              options.selectionAdapter = Utils.Decorate(options.selectionAdapter, Placeholder);
            }

            if (options.allowClear) {
              options.selectionAdapter = Utils.Decorate(options.selectionAdapter, AllowClear);
            }

            if (options.multiple) {
              options.selectionAdapter = Utils.Decorate(options.selectionAdapter, SelectionSearch);
            }

            if (
              options.containerCssClass != null ||
              options.containerCss != null ||
              options.adaptContainerCssClass != null
            ) {
              var ContainerCSS = require(options.amdBase + 'compat/containerCss');

              options.selectionAdapter = Utils.Decorate(options.selectionAdapter, ContainerCSS);
            }

            options.selectionAdapter = Utils.Decorate(options.selectionAdapter, EventRelay);
          }

          if (typeof options.language === 'string') {
            // Check if the language is specified with a region
            if (options.language.indexOf('-') > 0) {
              // Extract the region information if it is included
              var languageParts = options.language.split('-');
              var baseLanguage = languageParts[0];
              options.language = [options.language, baseLanguage];
            } else {
              options.language = [options.language];
            }
          }

          if ($.isArray(options.language)) {
            var languages = new Translation();
            options.language.push('en');
            var languageNames = options.language;

            for (var l = 0; l < languageNames.length; l++) {
              var name = languageNames[l];
              var language = {};

              try {
                // Try to load it with the original name
                language = Translation.loadPath(name);
              } catch (e) {
                try {
                  // If we couldn't load it, check if it wasn't the full path
                  name = this.defaults.amdLanguageBase + name;
                  language = Translation.loadPath(name);
                } catch (ex) {
                  // The translation could not be loaded at all. Sometimes this is
                  // because of a configuration problem, other times this can be
                  // because of how Select2 helps load all possible translation files.
                  if (options.debug && window.console && console.warn) {
                    console.warn(
                      'Select2: The language file for "' +
                        name +
                        '" could not be ' +
                        'automatically loaded. A fallback will be used instead.',
                    );
                  }

                  continue;
                }
              }

              languages.extend(language);
            }

            options.translations = languages;
          } else {
            var baseTranslation = Translation.loadPath(this.defaults.amdLanguageBase + 'en');
            var customTranslation = new Translation(options.language);
            customTranslation.extend(baseTranslation);
            options.translations = customTranslation;
          }

          return options;
        };

        Defaults.prototype.reset = function () {
          function stripDiacritics(text) {
            // Used 'uni range + named function' from http://jsperf.com/diacritics/18
            function match(a) {
              return DIACRITICS[a] || a;
            }

            return text.replace(/[^\u0000-\u007E]/g, match);
          }

          function matcher(params, data) {
            // Always return the object if there is nothing to compare
            if ($.trim(params.term) === '') {
              return data;
            } // Do a recursive check for options with children

            if (data.children && data.children.length > 0) {
              // Clone the data object if there are children
              // This is required as we modify the object to remove any non-matches
              var match = $.extend(true, {}, data); // Check each child of the option

              for (var c = data.children.length - 1; c >= 0; c--) {
                var child = data.children[c];
                var matches = matcher(params, child); // If there wasn't a match, remove the object in the array

                if (matches == null) {
                  match.children.splice(c, 1);
                }
              } // If any children matched, return the new object

              if (match.children.length > 0) {
                return match;
              } // If there were no matching children, check just the plain object

              return matcher(params, match);
            }

            var original = stripDiacritics(data.text).toUpperCase();
            var term = stripDiacritics(params.term).toUpperCase(); // Check if the text contains the term

            if (original.indexOf(term) > -1) {
              return data;
            } // If it doesn't contain the term, don't return anything

            return null;
          }

          this.defaults = {
            amdBase: './',
            amdLanguageBase: './i18n/',
            closeOnSelect: true,
            debug: false,
            dropdownAutoWidth: false,
            escapeMarkup: Utils.escapeMarkup,
            language: EnglishTranslation,
            matcher: matcher,
            minimumInputLength: 0,
            maximumInputLength: 0,
            maximumSelectionLength: 0,
            minimumResultsForSearch: 0,
            selectOnClose: false,
            sorter: function sorter(data) {
              return data;
            },
            templateResult: function templateResult(result) {
              return result.text;
            },
            templateSelection: function templateSelection(selection) {
              return selection.text;
            },
            theme: 'default',
            width: 'resolve',
          };
        };

        Defaults.prototype.set = function (key, value) {
          var camelKey = $.camelCase(key);
          var data = {};
          data[camelKey] = value;

          var convertedData = Utils._convertData(data);

          $.extend(this.defaults, convertedData);
        };

        var defaults = new Defaults();
        return defaults;
      },
    );
    S2.define(
      'select2/options',
      ['require', 'jquery', './defaults', './utils'],
      function (require, $, Defaults, Utils) {
        function Options(options, $element) {
          this.options = options;

          if ($element != null) {
            this.fromElement($element);
          }

          this.options = Defaults.apply(this.options);

          if ($element && $element.is('input')) {
            var InputCompat = require(this.get('amdBase') + 'compat/inputData');

            this.options.dataAdapter = Utils.Decorate(this.options.dataAdapter, InputCompat);
          }
        }

        Options.prototype.fromElement = function ($e) {
          var excludedData = ['select2'];

          if (this.options.multiple == null) {
            this.options.multiple = $e.prop('multiple');
          }

          if (this.options.disabled == null) {
            this.options.disabled = $e.prop('disabled');
          }

          if (this.options.language == null) {
            if ($e.prop('lang')) {
              this.options.language = $e.prop('lang').toLowerCase();
            } else if ($e.closest('[lang]').prop('lang')) {
              this.options.language = $e.closest('[lang]').prop('lang');
            }
          }

          if (this.options.dir == null) {
            if ($e.prop('dir')) {
              this.options.dir = $e.prop('dir');
            } else if ($e.closest('[dir]').prop('dir')) {
              this.options.dir = $e.closest('[dir]').prop('dir');
            } else {
              this.options.dir = 'ltr';
            }
          }

          $e.prop('disabled', this.options.disabled);
          $e.prop('multiple', this.options.multiple);

          if ($e.data('select2Tags')) {
            if (this.options.debug && window.console && console.warn) {
              console.warn(
                'Select2: The `data-select2-tags` attribute has been changed to ' +
                  'use the `data-data` and `data-tags="true"` attributes and will be ' +
                  'removed in future versions of Select2.',
              );
            }

            $e.data('data', $e.data('select2Tags'));
            $e.data('tags', true);
          }

          if ($e.data('ajaxUrl')) {
            if (this.options.debug && window.console && console.warn) {
              console.warn(
                'Select2: The `data-ajax-url` attribute has been changed to ' +
                  '`data-ajax--url` and support for the old attribute will be removed' +
                  ' in future versions of Select2.',
              );
            }

            $e.attr('ajax--url', $e.data('ajaxUrl'));
            $e.data('ajax--url', $e.data('ajaxUrl'));
          }

          var dataset = {}; // Prefer the element's `dataset` attribute if it exists
          // jQuery 1.x does not correctly handle data attributes with multiple dashes

          if ($.fn.jquery && $.fn.jquery.substr(0, 2) == '1.' && $e[0].dataset) {
            dataset = $.extend(true, {}, $e[0].dataset, $e.data());
          } else {
            dataset = $e.data();
          }

          var data = $.extend(true, {}, dataset);
          data = Utils._convertData(data);

          for (var key in data) {
            if ($.inArray(key, excludedData) > -1) {
              continue;
            }

            if ($.isPlainObject(this.options[key])) {
              $.extend(this.options[key], data[key]);
            } else {
              this.options[key] = data[key];
            }
          }

          return this;
        };

        Options.prototype.get = function (key) {
          return this.options[key];
        };

        Options.prototype.set = function (key, val) {
          this.options[key] = val;
        };

        return Options;
      },
    );
    S2.define('select2/core', ['jquery', './options', './utils', './keys'], function ($, Options, Utils, KEYS) {
      var Select2 = function Select2($element, options) {
        if ($element.data('select2') != null) {
          $element.data('select2').destroy();
        }

        this.$element = $element;
        this.id = this._generateId($element);
        options = options || {};
        this.options = new Options(options, $element);

        Select2.__super__.constructor.call(this); // Set up the tabindex

        var tabindex = $element.attr('tabindex') || 0;
        $element.data('old-tabindex', tabindex);
        $element.attr('tabindex', '-1'); // Set up containers and adapters

        var DataAdapter = this.options.get('dataAdapter');
        this.dataAdapter = new DataAdapter($element, this.options);
        var $container = this.render();

        this._placeContainer($container);

        var SelectionAdapter = this.options.get('selectionAdapter');
        this.selection = new SelectionAdapter($element, this.options);
        this.$selection = this.selection.render();
        this.selection.position(this.$selection, $container);
        var DropdownAdapter = this.options.get('dropdownAdapter');
        this.dropdown = new DropdownAdapter($element, this.options);
        this.$dropdown = this.dropdown.render();
        this.dropdown.position(this.$dropdown, $container);
        var ResultsAdapter = this.options.get('resultsAdapter');
        this.results = new ResultsAdapter($element, this.options, this.dataAdapter);
        this.$results = this.results.render();
        this.results.position(this.$results, this.$dropdown); // Bind events

        var self = this; // Bind the container to all of the adapters

        this._bindAdapters(); // Register any DOM event handlers

        this._registerDomEvents(); // Register any internal event handlers

        this._registerDataEvents();

        this._registerSelectionEvents();

        this._registerDropdownEvents();

        this._registerResultsEvents();

        this._registerEvents(); // Set the initial state

        this.dataAdapter.current(function (initialData) {
          self.trigger('selection:update', {
            data: initialData,
          });
        }); // Hide the original select

        $element.addClass('select2-hidden-accessible');
        $element.attr('aria-hidden', 'true'); // Synchronize any monitored attributes

        this._syncAttributes();

        $element.data('select2', this);
      };

      Utils.Extend(Select2, Utils.Observable);

      Select2.prototype._generateId = function ($element) {
        var id = '';

        if ($element.attr('id') != null) {
          id = $element.attr('id');
        } else if ($element.attr('name') != null) {
          id = $element.attr('name') + '-' + Utils.generateChars(2);
        } else {
          id = Utils.generateChars(4);
        }

        id = id.replace(/(:|\.|\[|\]|,)/g, '');
        id = 'select2-' + id;
        return id;
      };

      Select2.prototype._placeContainer = function ($container) {
        $container.insertAfter(this.$element);

        var width = this._resolveWidth(this.$element, this.options.get('width'));

        if (width != null) {
          $container.css('width', width);
        }
      };

      Select2.prototype._resolveWidth = function ($element, method) {
        var WIDTH = /^width:(([-+]?([0-9]*\.)?[0-9]+)(px|em|ex|%|in|cm|mm|pt|pc))/i;

        if (method == 'resolve') {
          var styleWidth = this._resolveWidth($element, 'style');

          if (styleWidth != null) {
            return styleWidth;
          }

          return this._resolveWidth($element, 'element');
        }

        if (method == 'element') {
          var elementWidth = $element.outerWidth(false);

          if (elementWidth <= 0) {
            return 'auto';
          }

          return elementWidth + 'px';
        }

        if (method == 'style') {
          var style = $element.attr('style');

          if (typeof style !== 'string') {
            return null;
          }

          var attrs = style.split(';');

          for (var i = 0, l = attrs.length; i < l; i = i + 1) {
            var attr = attrs[i].replace(/\s/g, '');
            var matches = attr.match(WIDTH);

            if (matches !== null && matches.length >= 1) {
              return matches[1];
            }
          }

          return null;
        }

        return method;
      };

      Select2.prototype._bindAdapters = function () {
        this.dataAdapter.bind(this, this.$container);
        this.selection.bind(this, this.$container);
        this.dropdown.bind(this, this.$container);
        this.results.bind(this, this.$container);
      };

      Select2.prototype._registerDomEvents = function () {
        var self = this;
        this.$element.on('change.select2', function () {
          self.dataAdapter.current(function (data) {
            self.trigger('selection:update', {
              data: data,
            });
          });
        });
        this.$element.on('focus.select2', function (evt) {
          self.trigger('focus', evt);
        });
        this._syncA = Utils.bind(this._syncAttributes, this);
        this._syncS = Utils.bind(this._syncSubtree, this);

        if (this.$element[0].attachEvent) {
          this.$element[0].attachEvent('onpropertychange', this._syncA);
        }

        var observer = window.MutationObserver || window.WebKitMutationObserver || window.MozMutationObserver;

        if (observer != null) {
          this._observer = new observer(function (mutations) {
            $.each(mutations, self._syncA);
            $.each(mutations, self._syncS);
          });

          this._observer.observe(this.$element[0], {
            attributes: true,
            childList: true,
            subtree: false,
          });
        } else if (this.$element[0].addEventListener) {
          this.$element[0].addEventListener('DOMAttrModified', self._syncA, false);
          this.$element[0].addEventListener('DOMNodeInserted', self._syncS, false);
          this.$element[0].addEventListener('DOMNodeRemoved', self._syncS, false);
        }
      };

      Select2.prototype._registerDataEvents = function () {
        var self = this;
        this.dataAdapter.on('*', function (name, params) {
          self.trigger(name, params);
        });
      };

      Select2.prototype._registerSelectionEvents = function () {
        var self = this;
        var nonRelayEvents = ['toggle', 'focus'];
        this.selection.on('toggle', function () {
          self.toggleDropdown();
        });
        this.selection.on('focus', function (params) {
          self.focus(params);
        });
        this.selection.on('*', function (name, params) {
          if ($.inArray(name, nonRelayEvents) !== -1) {
            return;
          }

          self.trigger(name, params);
        });
      };

      Select2.prototype._registerDropdownEvents = function () {
        var self = this;
        this.dropdown.on('*', function (name, params) {
          self.trigger(name, params);
        });
      };

      Select2.prototype._registerResultsEvents = function () {
        var self = this;
        this.results.on('*', function (name, params) {
          self.trigger(name, params);
        });
      };

      Select2.prototype._registerEvents = function () {
        var self = this;
        this.on('open', function () {
          self.$container.addClass('select2-container--open');
        });
        this.on('close', function () {
          self.$container.removeClass('select2-container--open');
        });
        this.on('enable', function () {
          self.$container.removeClass('select2-container--disabled');
        });
        this.on('disable', function () {
          self.$container.addClass('select2-container--disabled');
        });
        this.on('blur', function () {
          self.$container.removeClass('select2-container--focus');
        });
        this.on('query', function (params) {
          if (!self.isOpen()) {
            self.trigger('open', {});
          }

          this.dataAdapter.query(params, function (data) {
            self.trigger('results:all', {
              data: data,
              query: params,
            });
          });
        });
        this.on('query:append', function (params) {
          this.dataAdapter.query(params, function (data) {
            self.trigger('results:append', {
              data: data,
              query: params,
            });
          });
        });
        this.on('keypress', function (evt) {
          var key = evt.which;

          if (self.isOpen()) {
            if (key === KEYS.ESC || key === KEYS.TAB || (key === KEYS.UP && evt.altKey)) {
              self.close();
              evt.preventDefault();
            } else if (key === KEYS.ENTER) {
              self.trigger('results:select', {});
              evt.preventDefault();
            } else if (key === KEYS.SPACE && evt.ctrlKey) {
              self.trigger('results:toggle', {});
              evt.preventDefault();
            } else if (key === KEYS.UP) {
              self.trigger('results:previous', {});
              evt.preventDefault();
            } else if (key === KEYS.DOWN) {
              self.trigger('results:next', {});
              evt.preventDefault();
            }
          } else {
            if (key === KEYS.ENTER || key === KEYS.SPACE || (key === KEYS.DOWN && evt.altKey)) {
              self.open();
              evt.preventDefault();
            }
          }
        });
      };

      Select2.prototype._syncAttributes = function () {
        this.options.set('disabled', this.$element.prop('disabled'));

        if (this.options.get('disabled')) {
          if (this.isOpen()) {
            this.close();
          }

          this.trigger('disable', {});
        } else {
          this.trigger('enable', {});
        }
      };

      Select2.prototype._syncSubtree = function (evt, mutations) {
        var changed = false;
        var self = this; // Ignore any mutation events raised for elements that aren't options or
        // optgroups. This handles the case when the select element is destroyed

        if (evt && evt.target && evt.target.nodeName !== 'OPTION' && evt.target.nodeName !== 'OPTGROUP') {
          return;
        }

        if (!mutations) {
          // If mutation events aren't supported, then we can only assume that the
          // change affected the selections
          changed = true;
        } else if (mutations.addedNodes && mutations.addedNodes.length > 0) {
          for (var n = 0; n < mutations.addedNodes.length; n++) {
            var node = mutations.addedNodes[n];

            if (node.selected) {
              changed = true;
            }
          }
        } else if (mutations.removedNodes && mutations.removedNodes.length > 0) {
          changed = true;
        } // Only re-pull the data if we think there is a change

        if (changed) {
          this.dataAdapter.current(function (currentData) {
            self.trigger('selection:update', {
              data: currentData,
            });
          });
        }
      };
      /**
       * Override the trigger method to automatically trigger pre-events when
       * there are events that can be prevented.
       */

      Select2.prototype.trigger = function (name, args) {
        var actualTrigger = Select2.__super__.trigger;
        var preTriggerMap = {
          open: 'opening',
          close: 'closing',
          select: 'selecting',
          unselect: 'unselecting',
        };

        if (args === undefined) {
          args = {};
        }

        if (name in preTriggerMap) {
          var preTriggerName = preTriggerMap[name];
          var preTriggerArgs = {
            prevented: false,
            name: name,
            args: args,
          };
          actualTrigger.call(this, preTriggerName, preTriggerArgs);

          if (preTriggerArgs.prevented) {
            args.prevented = true;
            return;
          }
        }

        actualTrigger.call(this, name, args);
      };

      Select2.prototype.toggleDropdown = function () {
        if (this.options.get('disabled')) {
          return;
        }

        if (this.isOpen()) {
          this.close();
        } else {
          this.open();
        }
      };

      Select2.prototype.open = function () {
        if (this.isOpen()) {
          return;
        }

        this.trigger('query', {});
      };

      Select2.prototype.close = function () {
        if (!this.isOpen()) {
          return;
        }

        this.trigger('close', {});
      };

      Select2.prototype.isOpen = function () {
        return this.$container.hasClass('select2-container--open');
      };

      Select2.prototype.hasFocus = function () {
        return this.$container.hasClass('select2-container--focus');
      };

      Select2.prototype.focus = function (data) {
        // No need to re-trigger focus events if we are already focused
        if (this.hasFocus()) {
          return;
        }

        this.$container.addClass('select2-container--focus');
        this.trigger('focus', {});
      };

      Select2.prototype.enable = function (args) {
        if (this.options.get('debug') && window.console && console.warn) {
          console.warn(
            'Select2: The `select2("enable")` method has been deprecated and will' +
              ' be removed in later Select2 versions. Use $element.prop("disabled")' +
              ' instead.',
          );
        }

        if (args == null || args.length === 0) {
          args = [true];
        }

        var disabled = !args[0];
        this.$element.prop('disabled', disabled);
      };

      Select2.prototype.data = function () {
        if (this.options.get('debug') && arguments.length > 0 && window.console && console.warn) {
          console.warn(
            'Select2: Data can no longer be set using `select2("data")`. You ' +
              'should consider setting the value instead using `$element.val()`.',
          );
        }

        var data = [];
        this.dataAdapter.current(function (currentData) {
          data = currentData;
        });
        return data;
      };

      Select2.prototype.val = function (args) {
        if (this.options.get('debug') && window.console && console.warn) {
          console.warn(
            'Select2: The `select2("val")` method has been deprecated and will be' +
              ' removed in later Select2 versions. Use $element.val() instead.',
          );
        }

        if (args == null || args.length === 0) {
          return this.$element.val();
        }

        var newVal = args[0];

        if ($.isArray(newVal)) {
          newVal = $.map(newVal, function (obj) {
            return obj.toString();
          });
        }

        this.$element.val(newVal).trigger('change');
      };

      Select2.prototype.destroy = function () {
        this.$container.remove();

        if (this.$element[0].detachEvent) {
          this.$element[0].detachEvent('onpropertychange', this._syncA);
        }

        if (this._observer != null) {
          this._observer.disconnect();

          this._observer = null;
        } else if (this.$element[0].removeEventListener) {
          this.$element[0].removeEventListener('DOMAttrModified', this._syncA, false);
          this.$element[0].removeEventListener('DOMNodeInserted', this._syncS, false);
          this.$element[0].removeEventListener('DOMNodeRemoved', this._syncS, false);
        }

        this._syncA = null;
        this._syncS = null;
        this.$element.off('.select2');
        this.$element.attr('tabindex', this.$element.data('old-tabindex'));
        this.$element.removeClass('select2-hidden-accessible');
        this.$element.attr('aria-hidden', 'false');
        this.$element.removeData('select2');
        this.dataAdapter.destroy();
        this.selection.destroy();
        this.dropdown.destroy();
        this.results.destroy();
        this.dataAdapter = null;
        this.selection = null;
        this.dropdown = null;
        this.results = null;
      };

      Select2.prototype.render = function () {
        var $container = $(
          '<span class="select2 select2-container">' +
            '<span class="selection"></span>' +
            '<span class="dropdown-wrapper" aria-hidden="true"></span>' +
            '</span>',
        );
        $container.attr('dir', this.options.get('dir'));
        this.$container = $container;
        this.$container.addClass('select2-container--' + this.options.get('theme'));
        $container.data('element', this.$element);
        return $container;
      };

      return Select2;
    });
    S2.define('select2/compat/utils', ['jquery'], function ($) {
      function syncCssClasses($dest, $src, adapter) {
        var classes,
          replacements = [],
          adapted;
        classes = $.trim($dest.attr('class'));

        if (classes) {
          classes = '' + classes; // for IE which returns object

          $(classes.split(/\s+/)).each(function () {
            // Save all Select2 classes
            if (this.indexOf('select2-') === 0) {
              replacements.push(this);
            }
          });
        }

        classes = $.trim($src.attr('class'));

        if (classes) {
          classes = '' + classes; // for IE which returns object

          $(classes.split(/\s+/)).each(function () {
            // Only adapt non-Select2 classes
            if (this.indexOf('select2-') !== 0) {
              adapted = adapter(this);

              if (adapted != null) {
                replacements.push(adapted);
              }
            }
          });
        }

        $dest.attr('class', replacements.join(' '));
      }

      return {
        syncCssClasses: syncCssClasses,
      };
    });
    S2.define('select2/compat/containerCss', ['jquery', './utils'], function ($, CompatUtils) {
      // No-op CSS adapter that discards all classes by default
      function _containerAdapter(clazz) {
        return null;
      }

      function ContainerCSS() {}

      ContainerCSS.prototype.render = function (decorated) {
        var $container = decorated.call(this);
        var containerCssClass = this.options.get('containerCssClass') || '';

        if ($.isFunction(containerCssClass)) {
          containerCssClass = containerCssClass(this.$element);
        }

        var containerCssAdapter = this.options.get('adaptContainerCssClass');
        containerCssAdapter = containerCssAdapter || _containerAdapter;

        if (containerCssClass.indexOf(':all:') !== -1) {
          containerCssClass = containerCssClass.replace(':all:', '');
          var _cssAdapter = containerCssAdapter;

          containerCssAdapter = function containerCssAdapter(clazz) {
            var adapted = _cssAdapter(clazz);

            if (adapted != null) {
              // Append the old one along with the adapted one
              return adapted + ' ' + clazz;
            }

            return clazz;
          };
        }

        var containerCss = this.options.get('containerCss') || {};

        if ($.isFunction(containerCss)) {
          containerCss = containerCss(this.$element);
        }

        CompatUtils.syncCssClasses($container, this.$element, containerCssAdapter);
        $container.css(containerCss);
        $container.addClass(containerCssClass);
        return $container;
      };

      return ContainerCSS;
    });
    S2.define('select2/compat/dropdownCss', ['jquery', './utils'], function ($, CompatUtils) {
      // No-op CSS adapter that discards all classes by default
      function _dropdownAdapter(clazz) {
        return null;
      }

      function DropdownCSS() {}

      DropdownCSS.prototype.render = function (decorated) {
        var $dropdown = decorated.call(this);
        var dropdownCssClass = this.options.get('dropdownCssClass') || '';

        if ($.isFunction(dropdownCssClass)) {
          dropdownCssClass = dropdownCssClass(this.$element);
        }

        var dropdownCssAdapter = this.options.get('adaptDropdownCssClass');
        dropdownCssAdapter = dropdownCssAdapter || _dropdownAdapter;

        if (dropdownCssClass.indexOf(':all:') !== -1) {
          dropdownCssClass = dropdownCssClass.replace(':all:', '');
          var _cssAdapter = dropdownCssAdapter;

          dropdownCssAdapter = function dropdownCssAdapter(clazz) {
            var adapted = _cssAdapter(clazz);

            if (adapted != null) {
              // Append the old one along with the adapted one
              return adapted + ' ' + clazz;
            }

            return clazz;
          };
        }

        var dropdownCss = this.options.get('dropdownCss') || {};

        if ($.isFunction(dropdownCss)) {
          dropdownCss = dropdownCss(this.$element);
        }

        CompatUtils.syncCssClasses($dropdown, this.$element, dropdownCssAdapter);
        $dropdown.css(dropdownCss);
        $dropdown.addClass(dropdownCssClass);
        return $dropdown;
      };

      return DropdownCSS;
    });
    S2.define('select2/compat/initSelection', ['jquery'], function ($) {
      function InitSelection(decorated, $element, options) {
        if (options.get('debug') && window.console && console.warn) {
          console.warn(
            'Select2: The `initSelection` option has been deprecated in favor' +
              ' of a custom data adapter that overrides the `current` method. ' +
              'This method is now called multiple times instead of a single ' +
              'time when the instance is initialized. Support will be removed ' +
              'for the `initSelection` option in future versions of Select2',
          );
        }

        this.initSelection = options.get('initSelection');
        this._isInitialized = false;
        decorated.call(this, $element, options);
      }

      InitSelection.prototype.current = function (decorated, callback) {
        var self = this;

        if (this._isInitialized) {
          decorated.call(this, callback);
          return;
        }

        this.initSelection.call(null, this.$element, function (data) {
          self._isInitialized = true;

          if (!$.isArray(data)) {
            data = [data];
          }

          callback(data);
        });
      };

      return InitSelection;
    });
    S2.define('select2/compat/inputData', ['jquery'], function ($) {
      function InputData(decorated, $element, options) {
        this._currentData = [];
        this._valueSeparator = options.get('valueSeparator') || ',';

        if ($element.prop('type') === 'hidden') {
          if (options.get('debug') && console && console.warn) {
            console.warn(
              'Select2: Using a hidden input with Select2 is no longer ' +
                'supported and may stop working in the future. It is recommended ' +
                'to use a `<select>` element instead.',
            );
          }
        }

        decorated.call(this, $element, options);
      }

      InputData.prototype.current = function (_, callback) {
        function getSelected(data, selectedIds) {
          var selected = [];

          if (data.selected || $.inArray(data.id, selectedIds) !== -1) {
            data.selected = true;
            selected.push(data);
          } else {
            data.selected = false;
          }

          if (data.children) {
            selected.push.apply(selected, getSelected(data.children, selectedIds));
          }

          return selected;
        }

        var selected = [];

        for (var d = 0; d < this._currentData.length; d++) {
          var data = this._currentData[d];
          selected.push.apply(selected, getSelected(data, this.$element.val().split(this._valueSeparator)));
        }

        callback(selected);
      };

      InputData.prototype.select = function (_, data) {
        if (!this.options.get('multiple')) {
          this.current(function (allData) {
            $.map(allData, function (data) {
              data.selected = false;
            });
          });
          this.$element.val(data.id);
          this.$element.trigger('change');
        } else {
          var value = this.$element.val();
          value += this._valueSeparator + data.id;
          this.$element.val(value);
          this.$element.trigger('change');
        }
      };

      InputData.prototype.unselect = function (_, data) {
        var self = this;
        data.selected = false;
        this.current(function (allData) {
          var values = [];

          for (var d = 0; d < allData.length; d++) {
            var item = allData[d];

            if (data.id == item.id) {
              continue;
            }

            values.push(item.id);
          }

          self.$element.val(values.join(self._valueSeparator));
          self.$element.trigger('change');
        });
      };

      InputData.prototype.query = function (_, params, callback) {
        var results = [];

        for (var d = 0; d < this._currentData.length; d++) {
          var data = this._currentData[d];
          var matches = this.matches(params, data);

          if (matches !== null) {
            results.push(matches);
          }
        }

        callback({
          results: results,
        });
      };

      InputData.prototype.addOptions = function (_, $options) {
        var options = $.map($options, function ($option) {
          return $.data($option[0], 'data');
        });

        this._currentData.push.apply(this._currentData, options);
      };

      return InputData;
    });
    S2.define('select2/compat/matcher', ['jquery'], function ($) {
      function oldMatcher(matcher) {
        function wrappedMatcher(params, data) {
          var match = $.extend(true, {}, data);

          if (params.term == null || $.trim(params.term) === '') {
            return match;
          }

          if (data.children) {
            for (var c = data.children.length - 1; c >= 0; c--) {
              var child = data.children[c]; // Check if the child object matches
              // The old matcher returned a boolean true or false

              var doesMatch = matcher(params.term, child.text, child); // If the child didn't match, pop it off

              if (!doesMatch) {
                match.children.splice(c, 1);
              }
            }

            if (match.children.length > 0) {
              return match;
            }
          }

          if (matcher(params.term, data.text, data)) {
            return match;
          }

          return null;
        }

        return wrappedMatcher;
      }

      return oldMatcher;
    });
    S2.define('select2/compat/query', [], function () {
      function Query(decorated, $element, options) {
        if (options.get('debug') && window.console && console.warn) {
          console.warn(
            'Select2: The `query` option has been deprecated in favor of a ' +
              'custom data adapter that overrides the `query` method. Support ' +
              'will be removed for the `query` option in future versions of ' +
              'Select2.',
          );
        }

        decorated.call(this, $element, options);
      }

      Query.prototype.query = function (_, params, callback) {
        params.callback = callback;
        var query = this.options.get('query');
        query.call(null, params);
      };

      return Query;
    });
    S2.define('select2/dropdown/attachContainer', [], function () {
      function AttachContainer(decorated, $element, options) {
        decorated.call(this, $element, options);
      }

      AttachContainer.prototype.position = function (decorated, $dropdown, $container) {
        var $dropdownContainer = $container.find('.dropdown-wrapper');
        $dropdownContainer.append($dropdown);
        $dropdown.addClass('select2-dropdown--below');
        $container.addClass('select2-container--below');
      };

      return AttachContainer;
    });
    S2.define('select2/dropdown/stopPropagation', [], function () {
      function StopPropagation() {}

      StopPropagation.prototype.bind = function (decorated, container, $container) {
        decorated.call(this, container, $container);
        var stoppedEvents = [
          'blur',
          'change',
          'click',
          'dblclick',
          'focus',
          'focusin',
          'focusout',
          'input',
          'keydown',
          'keyup',
          'keypress',
          'mousedown',
          'mouseenter',
          'mouseleave',
          'mousemove',
          'mouseover',
          'mouseup',
          'search',
          'touchend',
          'touchstart',
        ];
        this.$dropdown.on(stoppedEvents.join(' '), function (evt) {
          evt.stopPropagation();
        });
      };

      return StopPropagation;
    });
    S2.define('select2/selection/stopPropagation', [], function () {
      function StopPropagation() {}

      StopPropagation.prototype.bind = function (decorated, container, $container) {
        decorated.call(this, container, $container);
        var stoppedEvents = [
          'blur',
          'change',
          'click',
          'dblclick',
          'focus',
          'focusin',
          'focusout',
          'input',
          'keydown',
          'keyup',
          'keypress',
          'mousedown',
          'mouseenter',
          'mouseleave',
          'mousemove',
          'mouseover',
          'mouseup',
          'search',
          'touchend',
          'touchstart',
        ];
        this.$selection.on(stoppedEvents.join(' '), function (evt) {
          evt.stopPropagation();
        });
      };

      return StopPropagation;
    });
    /*!
     * jQuery Mousewheel 3.1.13
     *
     * Copyright jQuery Foundation and other contributors
     * Released under the MIT license
     * http://jquery.org/license
     */

    (function (factory) {
      if (typeof S2.define === 'function' && S2.define.amd) {
        // AMD. Register as an anonymous module.
        S2.define('jquery-mousewheel', ['jquery'], factory);
      } else if ((typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object') {
        // Node/CommonJS style for Browserify
        module.exports = factory;
      } else {
        // Browser globals
        factory(jQuery);
      }
    })(function ($) {
      var toFix = ['wheel', 'mousewheel', 'DOMMouseScroll', 'MozMousePixelScroll'],
        toBind =
          'onwheel' in document || document.documentMode >= 9
            ? ['wheel']
            : ['mousewheel', 'DomMouseScroll', 'MozMousePixelScroll'],
        slice = Array.prototype.slice,
        nullLowestDeltaTimeout,
        lowestDelta;

      if ($.event.fixHooks) {
        for (var i = toFix.length; i; ) {
          $.event.fixHooks[toFix[--i]] = $.event.mouseHooks;
        }
      }

      var special = ($.event.special.mousewheel = {
        version: '3.1.12',
        setup: function setup() {
          if (this.addEventListener) {
            for (var i = toBind.length; i; ) {
              this.addEventListener(toBind[--i], handler, false);
            }
          } else {
            this.onmousewheel = handler;
          } // Store the line height and page height for this particular element

          $.data(this, 'mousewheel-line-height', special.getLineHeight(this));
          $.data(this, 'mousewheel-page-height', special.getPageHeight(this));
        },
        teardown: function teardown() {
          if (this.removeEventListener) {
            for (var i = toBind.length; i; ) {
              this.removeEventListener(toBind[--i], handler, false);
            }
          } else {
            this.onmousewheel = null;
          } // Clean up the data we added to the element

          $.removeData(this, 'mousewheel-line-height');
          $.removeData(this, 'mousewheel-page-height');
        },
        getLineHeight: function getLineHeight(elem) {
          var $elem = $(elem),
            $parent = $elem['offsetParent' in $.fn ? 'offsetParent' : 'parent']();

          if (!$parent.length) {
            $parent = $('body');
          }

          return parseInt($parent.css('fontSize'), 10) || parseInt($elem.css('fontSize'), 10) || 16;
        },
        getPageHeight: function getPageHeight(elem) {
          return $(elem).height();
        },
        settings: {
          adjustOldDeltas: true,
          // see shouldAdjustOldDeltas() below
          normalizeOffset: true, // calls getBoundingClientRect for each event
        },
      });
      $.fn.extend({
        mousewheel: function mousewheel(fn) {
          return fn ? this.bind('mousewheel', fn) : this.trigger('mousewheel');
        },
        unmousewheel: function unmousewheel(fn) {
          return this.unbind('mousewheel', fn);
        },
      });

      function handler(event) {
        var orgEvent = event || window.event,
          args = slice.call(arguments, 1),
          delta = 0,
          deltaX = 0,
          deltaY = 0,
          absDelta = 0,
          offsetX = 0,
          offsetY = 0;
        event = $.event.fix(orgEvent);
        event.type = 'mousewheel'; // Old school scrollwheel delta

        if ('detail' in orgEvent) {
          deltaY = orgEvent.detail * -1;
        }

        if ('wheelDelta' in orgEvent) {
          deltaY = orgEvent.wheelDelta;
        }

        if ('wheelDeltaY' in orgEvent) {
          deltaY = orgEvent.wheelDeltaY;
        }

        if ('wheelDeltaX' in orgEvent) {
          deltaX = orgEvent.wheelDeltaX * -1;
        } // Firefox < 17 horizontal scrolling related to DOMMouseScroll event

        if ('axis' in orgEvent && orgEvent.axis === orgEvent.HORIZONTAL_AXIS) {
          deltaX = deltaY * -1;
          deltaY = 0;
        } // Set delta to be deltaY or deltaX if deltaY is 0 for backwards compatabilitiy

        delta = deltaY === 0 ? deltaX : deltaY; // New school wheel delta (wheel event)

        if ('deltaY' in orgEvent) {
          deltaY = orgEvent.deltaY * -1;
          delta = deltaY;
        }

        if ('deltaX' in orgEvent) {
          deltaX = orgEvent.deltaX;

          if (deltaY === 0) {
            delta = deltaX * -1;
          }
        } // No change actually happened, no reason to go any further

        if (deltaY === 0 && deltaX === 0) {
          return;
        } // Need to convert lines and pages to pixels if we aren't already in pixels
        // There are three delta modes:
        //   * deltaMode 0 is by pixels, nothing to do
        //   * deltaMode 1 is by lines
        //   * deltaMode 2 is by pages

        if (orgEvent.deltaMode === 1) {
          var lineHeight = $.data(this, 'mousewheel-line-height');
          delta *= lineHeight;
          deltaY *= lineHeight;
          deltaX *= lineHeight;
        } else if (orgEvent.deltaMode === 2) {
          var pageHeight = $.data(this, 'mousewheel-page-height');
          delta *= pageHeight;
          deltaY *= pageHeight;
          deltaX *= pageHeight;
        } // Store lowest absolute delta to normalize the delta values

        absDelta = Math.max(Math.abs(deltaY), Math.abs(deltaX));

        if (!lowestDelta || absDelta < lowestDelta) {
          lowestDelta = absDelta; // Adjust older deltas if necessary

          if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
            lowestDelta /= 40;
          }
        } // Adjust older deltas if necessary

        if (shouldAdjustOldDeltas(orgEvent, absDelta)) {
          // Divide all the things by 40!
          delta /= 40;
          deltaX /= 40;
          deltaY /= 40;
        } // Get a whole, normalized value for the deltas

        delta = Math[delta >= 1 ? 'floor' : 'ceil'](delta / lowestDelta);
        deltaX = Math[deltaX >= 1 ? 'floor' : 'ceil'](deltaX / lowestDelta);
        deltaY = Math[deltaY >= 1 ? 'floor' : 'ceil'](deltaY / lowestDelta); // Normalise offsetX and offsetY properties

        if (special.settings.normalizeOffset && this.getBoundingClientRect) {
          var boundingRect = this.getBoundingClientRect();
          offsetX = event.clientX - boundingRect.left;
          offsetY = event.clientY - boundingRect.top;
        } // Add information to the event object

        event.deltaX = deltaX;
        event.deltaY = deltaY;
        event.deltaFactor = lowestDelta;
        event.offsetX = offsetX;
        event.offsetY = offsetY; // Go ahead and set deltaMode to 0 since we converted to pixels
        // Although this is a little odd since we overwrite the deltaX/Y
        // properties with normalized deltas.

        event.deltaMode = 0; // Add event and delta to the front of the arguments

        args.unshift(event, delta, deltaX, deltaY); // Clearout lowestDelta after sometime to better
        // handle multiple device types that give different
        // a different lowestDelta
        // Ex: trackpad = 3 and mouse wheel = 120

        if (nullLowestDeltaTimeout) {
          clearTimeout(nullLowestDeltaTimeout);
        }

        nullLowestDeltaTimeout = setTimeout(nullLowestDelta, 200);
        return ($.event.dispatch || $.event.handle).apply(this, args);
      }

      function nullLowestDelta() {
        lowestDelta = null;
      }

      function shouldAdjustOldDeltas(orgEvent, absDelta) {
        // If this is an older event and the delta is divisable by 120,
        // then we are assuming that the browser is treating this as an
        // older mouse wheel event and that we should divide the deltas
        // by 40 to try and get a more usable deltaFactor.
        // Side note, this actually impacts the reported scroll distance
        // in older browsers and can cause scrolling to be slower than native.
        // Turn this off by setting $.event.special.mousewheel.settings.adjustOldDeltas to false.
        return special.settings.adjustOldDeltas && orgEvent.type === 'mousewheel' && absDelta % 120 === 0;
      }
    });

    S2.define(
      'jquery.select2',
      ['jquery', 'jquery-mousewheel', './select2/core', './select2/defaults'],
      function ($, _, Select2, Defaults) {
        if ($.fn.selectWoo == null) {
          // All methods that should return the element
          var thisMethods = ['open', 'close', 'destroy'];

          $.fn.selectWoo = function (options) {
            options = options || {};

            if (_typeof(options) === 'object') {
              this.each(function () {
                var instanceOptions = $.extend(true, {}, options);
                var instance = new Select2($(this), instanceOptions);
              });
              return this;
            } else if (typeof options === 'string') {
              var ret;
              var args = Array.prototype.slice.call(arguments, 1);
              this.each(function () {
                var instance = $(this).data('select2');

                if (instance == null && window.console && console.error) {
                  console.error(
                    "The select2('" + options + "') method was called on an " + 'element that is not using Select2.',
                  );
                }

                ret = instance[options].apply(instance, args);
              }); // Check if we should be returning `this`

              if ($.inArray(options, thisMethods) > -1) {
                return this;
              }

              return ret;
            } else {
              throw new Error('Invalid arguments for Select2: ' + options);
            }
          };
        }

        if ($.fn.select2 != null && $.fn.select2.defaults != null) {
          $.fn.selectWoo.defaults = $.fn.select2.defaults;
        }

        if ($.fn.selectWoo.defaults == null) {
          $.fn.selectWoo.defaults = Defaults;
        } // Also register selectWoo under select2 if select2 is not already present.

        $.fn.select2 = $.fn.select2 || $.fn.selectWoo;
        return Select2;
      },
    ); // Return the AMD loader configuration so it can be used outside of this file

    return {
      define: S2.define,
      require: S2.require,
    };
  })(); // Autoload the jQuery bindings
  // We know that all of the modules exist above this, so we're safe

  var select2 = S2.require('jquery.select2'); // Hold the AMD module references on the jQuery function that was just loaded
  // This allows Select2 to use the internal loader outside of this file, such
  // as in the language files.

  jQuery.fn.select2.amd = S2;
  jQuery.fn.selectWoo.amd = S2; // Return the Select2 instance for anyone who is importing it.

  return select2;
});
('use strict');

/**
 * Social Links
 * Inspired by: http://sapegin.github.com/social-likes
 *
 * Sharing buttons for Russian and worldwide social networks.
 *
 * @requires jQuery
 * @author Artem Sapegin
 * @copyright 2014 Artem Sapegin (sapegin.me)
 * @license MIT
 */

/*global define:false, socialLinksButtons:false */
(function (factory) {
  // Try to register as an anonymous AMD module
  if (typeof define === 'function' && define.amd) {
    define(['jquery'], factory);
  } else {
    factory(jQuery);
  }
})(function ($, undefined) {
  'use strict';

  var prefix = 'social-links';
  var classPrefix = prefix + '__';
  var openClass = prefix + '_opened';
  var protocol = location.protocol === 'https:' ? 'https:' : 'http:';
  var isHttps = protocol === 'https:';
  /**
   * Buttons
   */

  var services = {
    facebook: {
      label: 'Facebook',
      // https://developers.facebook.com/docs/reference/fql/link_stat/
      counterUrl:
        'https://graph.facebook.com/fql?q=SELECT+total_count+FROM+link_stat+WHERE+url%3D%22{url}%22&callback=?',
      convertNumber: function convertNumber(data) {
        return data.data[0].total_count;
      },
      popupUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}',
      popupWidth: 600,
      popupHeight: 500,
    },
    twitter: {
      label: 'Twitter',
      counterUrl: 'https://cdn.api.twitter.com/1/urls/count.json?url={url}&callback=?',
      convertNumber: function convertNumber(data) {
        return data.count;
      },
      popupUrl: 'https://twitter.com/intent/tweet?url={url}&text={post_title}',
      popupWidth: 600,
      popupHeight: 450,
      click: function click() {
        // Add colon to improve readability
        if (!/[\.\?:\-–—]\s*$/.test(this.options.title)) this.options.title += ':';
        return true;
      },
    },
    mailru: {
      counterUrl: protocol + '//connect.mail.ru/share_count?url_list={url}&callback=1&func=?',
      convertNumber: function convertNumber(data) {
        for (var url in data) {
          if (data.hasOwnProperty(url)) {
            return data[url].shares;
          }
        }
      },
      popupUrl: protocol + '//connect.mail.ru/share?share_url={url}&title={post_title}',
      popupWidth: 550,
      popupHeight: 360,
    },
    vkontakte: {
      label: 'VK',
      counterUrl: 'https://vk.com/share.php?act=count&url={url}&index={index}',
      counter: function counter(jsonUrl, deferred) {
        var options = services.vkontakte;

        if (!options._) {
          options._ = [];
          if (!window.VK) window.VK = {};
          window.VK.Share = {
            count: function count(idx, number) {
              options._[idx].resolve(number);
            },
          };
        }

        var index = options._.length;

        options._.push(deferred);

        $.getScript(
          makeUrl(jsonUrl, {
            index: index,
          }),
        ).fail(deferred.reject);
      },
      popupUrl: protocol + '//vk.com/share.php?url={url}&title={post_title}',
      popupWidth: 550,
      popupHeight: 330,
    },
    odnoklassniki: {
      // HTTPS not supported
      counterUrl: isHttps ? undefined : 'http://connect.ok.ru/dk?st.cmd=extLike&ref={url}&uid={index}',
      counter: function counter(jsonUrl, deferred) {
        var options = services.odnoklassniki;

        if (!options._) {
          options._ = [];
          if (!window.ODKL) window.ODKL = {};

          window.ODKL.updateCount = function (idx, number) {
            options._[idx].resolve(number);
          };
        }

        var index = options._.length;

        options._.push(deferred);

        $.getScript(
          makeUrl(jsonUrl, {
            index: index,
          }),
        ).fail(deferred.reject);
      },
      popupUrl: 'http://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={url}',
      popupWidth: 550,
      popupHeight: 360,
    },
    plusone: {
      label: 'Google+',
      // HTTPS not supported yet: http://clubs.ya.ru/share/1499
      counterUrl: isHttps ? undefined : 'http://share.yandex.ru/gpp.xml?url={url}',
      counter: function counter(jsonUrl, deferred) {
        var options = services.plusone;

        if (options._) {
          // Reject all counters except the first because Yandex Share counter doesn’t return URL
          deferred.reject();
          return;
        }

        if (!window.services) window.services = {};
        window.services.gplus = {
          cb: function cb(number) {
            if (typeof number === 'string') {
              number = number.replace(/\D/g, '');
            }

            options._.resolve(parseInt(number, 10));
          },
        };
        options._ = deferred;
        $.getScript(makeUrl(jsonUrl)).fail(deferred.reject);
      },
      popupUrl: 'https://plus.google.com/share?url={url}',
      popupWidth: 700,
      popupHeight: 500,
    },
    pinterest: {
      label: 'Pinterest',
      counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
      convertNumber: function convertNumber(data) {
        return data.count;
      },
      popupUrl: protocol + '//pinterest.com/pin/create/button/?url={url}&description={post_title}',
      popupWidth: 630,
      popupHeight: 360,
    },
    tumblr: {
      label: 'Tumblr',
      counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
      convertNumber: function convertNumber(data) {
        return data.count;
      },
      popupUrl1: protocol + '//www.tumblr.com/share/link?url={url}&description={post_title}',
      popupUrl2: protocol + '//www.tumblr.com/share/photo?source={media}&click_thru={url}&description={post_title}',
      click: function click() {
        if (this.widget.data('media')) {
          this.options.popupUrl = this.options.popupUrl2;
        } else {
          this.options.popupUrl = this.options.popupUrl1;
        } // will still need to change the URL structure

        return true;
      },
      popupWidth: 630,
      popupHeight: 360,
    },
    reddit: {
      label: 'Reddit',
      counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
      convertNumber: function convertNumber(data) {
        return data.count;
      },
      popupUrl: protocol + '//reddit.com/submit?url={url}&description={post_title}',
      popupWidth: 630,
      popupHeight: 360,
    },
    EOT: true,
  };
  /**
   * jQuery plugin
   */

  $.fn.socialLinks = function (options) {
    return this.each(function () {
      var elem = $(this);
      var instance = elem.data(prefix);

      if (instance) {
        if ($.isPlainObject(options)) {
          instance.update(options);
        }
      } else {
        instance = new socialLinks(elem, $.extend({}, $.fn.socialLinks.defaults, options, dataToOptions(elem)));
        elem.data(prefix, instance);
      }
    });
  };

  var post_title = document.title.split(' | ')[0].split(' - ');

  if ($.inArray(post_title[post_title.length - 1], ['Full View', 'Limited View', 'Item Not Available']) !== -1) {
    post_title.pop();
  }

  post_title = post_title.join(' - ') + ' | HathiTrust';
  $.fn.socialLinks.defaults = {
    url: window.location.href.replace(window.location.hash, '').replace(/;/g, '&').replace('/shcgi/', '/cgi/'),
    post_title: post_title,
    counters: true,
    zeroes: false,
    wait: 500,
    // Show buttons only after counters are ready or after this amount of time
    timeout: 10000,
    // Show counters after this amount of time even if they aren’t ready
    popupCheckInterval: 500,
    singleTitle: 'Share',
  };

  function socialLinks(container, options) {
    this.container = container;
    this.options = options;
    this.init();
  }

  socialLinks.prototype = {
    init: function init() {
      // Add class in case of manual initialization
      this.container.addClass(prefix);
      this.initUserButtons();
      var buttons = this.container.children();
      this.buttons = [];
      buttons.each(
        $.proxy(function (idx, elem) {
          var button = new Button($(elem), this.options);
          this.buttons.push(button);
        }, this),
      );
    },
    initUserButtons: function initUserButtons() {
      if (!this.userButtonInited && window.socialLinksButtons) {
        $.extend(true, services, socialLinksButtons);
      }

      this.userButtonInited = true;
    },
    appear: function appear() {
      this.container.addClass(prefix + '_visible');
    },
    ready: function ready(silent) {
      if (this.timeout) {
        clearTimeout(this.timeout);
      }

      this.container.addClass(prefix + '_ready');

      if (!silent) {
        this.container.trigger('ready.' + prefix, this.number);
      }
    },
  };

  function Button(widget, options) {
    this.widget = widget;
    this.options = $.extend({}, options);
    this.detectService();

    if (this.service) {
      this.init();
    }
  }

  Button.prototype = {
    init: function init() {
      this.detectParams();
      this.initHtml();
      setTimeout($.proxy(this.initCounter, this), 0);
    },
    update: function update(options) {
      $.extend(
        this.options,
        {
          forceUpdate: false,
        },
        options,
      );
      this.widget.find('.' + prefix + '__counter').remove(); // Remove old counter

      this.initCounter();
    },
    detectService: function detectService() {
      var service = this.widget.data('service');

      if (!service) {
        // class="facebook"
        var node = this.widget[0];
        var classes = node.classList || node.className.split(' ');

        for (var classIdx = 0; classIdx < classes.length; classIdx++) {
          var cls = classes[classIdx];

          if (services[cls]) {
            service = cls;
            break;
          }
        }

        if (!service) return;
      }

      this.service = service;
      $.extend(this.options, services[service]);
    },
    detectParams: function detectParams() {
      var data = this.widget.data(); // Custom page counter URL or number

      if (data.counter) {
        var number = parseInt(data.counter, 10);

        if (isNaN(number)) {
          this.options.counterUrl = data.counter;
        } else {
          this.options.counterNumber = number;
        }
      } // Custom page title

      if (data.title) {
        this.options.title = data.title;
        this.options.post_title = this.options.title;
        delete data.title;
      } // Custom page URL

      if (data.url) {
        this.options.url = data.url;
      }
    },
    initHtml: function initHtml() {
      var options = this.options;
      var widget = this.widget;
      var button = widget;

      if (options.clickUrl) {
        var url = makeUrl(options.clickUrl, {
          url: options.url,
          post_title: options.post_title,
        });
        var link = $('<a>', {
          href: url,
        });
        this.cloneDataAttrs(widget, link);
        widget.replaceWith(link);
        this.widget = widget = link;
      } else {
        widget.on('click', $.proxy(this.click, this));
      }

      var _widget = widget.get(0);

      _widget.dataset.role = 'tooltip';
      _widget.dataset.microtipPosition = 'top';
      _widget.dataset.microtipSize = 'small';

      _widget.setAttribute('aria-label', $.trim(widget.text())); // widget.tooltip({ title : widget.text(), animation: false });

      this.button = button;
    },
    initCounter: function initCounter() {},
    cloneDataAttrs: function cloneDataAttrs(source, destination) {
      var data = source.data();

      for (var key in data) {
        if (data.hasOwnProperty(key)) {
          destination.data(key, data[key]);
        }
      }
    },
    getElementClassNames: function getElementClassNames(elem) {
      return _getElementClassNames(elem, this.service);
    },
    updateCounter: function updateCounter(number) {
      number = parseInt(number, 10) || 0;
      var params = {
        class: this.getElementClassNames('counter'),
        text: number,
      };

      if (!number && !this.options.zeroes) {
        params['class'] += ' ' + prefix + '__counter_empty';
        params.text = '';
      }

      var counterElem = $('<span>', params);
      this.widget.append(counterElem);
      this.widget.trigger('counter.' + prefix, [this.service, number]);
    },
    click: function click(e) {
      var options = this.options;
      var process = true;

      if ($.isFunction(options.click)) {
        process = options.click.call(this, e);
      }

      if (process) {
        var context = {
          url: options.url,
          post_title: options.post_title,
        };

        if (this.widget.data('media')) {
          context.media = this.widget.data('media');
        }

        var url = makeUrl(options.popupUrl, context);
        url = this.addAdditionalParamsToUrl(url);
        this.openPopup(url, {
          width: options.popupWidth,
          height: options.popupHeight,
        });
      }

      return false;
    },
    addAdditionalParamsToUrl: function addAdditionalParamsToUrl(url) {
      var data = dataToOptions(this.widget);
      var params = $.param($.extend(data, this.options.data));
      if ($.isEmptyObject(params)) return url;
      var glue = url.indexOf('?') === -1 ? '?' : '&';
      return url + glue + params;
    },
    openPopup: function openPopup(url, params) {
      var left = Math.round(screen.width / 2 - params.width / 2);
      var top = 0;

      if (screen.height > params.height) {
        top = Math.round(screen.height / 3 - params.height / 2);
      }

      var win = window.open(
        url,
        'sl_' + this.service,
        'left=' +
          left +
          ',top=' +
          top +
          ',' +
          'width=' +
          params.width +
          ',height=' +
          params.height +
          ',personalbar=0,toolbar=0,scrollbars=1,resizable=1',
      );

      if (win) {
        win.focus();
        this.widget.trigger('popup_opened.' + prefix, [this.service, win]);
        var timer = setInterval(
          $.proxy(function () {
            if (!win.closed) return;
            clearInterval(timer);
            this.widget.trigger('popup_closed.' + prefix, this.service);
          }, this),
          this.options.popupCheckInterval,
        );
      } else {
        location.href = url;
      }
    },
  };
  /**
   * Helpers
   */
  // Camelize data-attributes

  function dataToOptions(elem) {
    function upper(m, l) {
      return l.toUpper();
    }

    var options = {};
    var data = elem.data();

    for (var key in data) {
      if (key == 'tooltip') {
        continue;
      }

      var value = data[key];
      if (value === 'yes') value = true;
      else if (value === 'no') value = false;
      options[key.replace(/-(\w)/g, upper)] = value;
    }

    return options;
  }

  function makeUrl(url, context) {
    return template(url, context, encodeURIComponent);
  }

  function template(tmpl, context, filter) {
    return tmpl.replace(/\{([^\}]+)\}/g, function (m, key) {
      // If key doesn't exists in the context we should keep template tag as is
      return key in context ? (filter ? filter(context[key]) : context[key]) : m;
    });
  }

  function _getElementClassNames(elem, mod) {
    var cls = classPrefix + elem;
    return cls + ' ' + cls + '_' + mod;
  }

  function closeOnClick(elem, callback) {
    function handler(e) {
      if ((e.type === 'keydown' && e.which !== 27) || $(e.target).closest(elem).length) return;
      elem.removeClass(openClass);
      doc.off(events, handler);
      if ($.isFunction(callback)) callback();
    }

    var doc = $(document);
    var events = 'click touchstart keydown';
    doc.on(events, handler);
  }

  function showInViewport(elem) {
    var offset = 10;

    if (document.documentElement.getBoundingClientRect) {
      var left = parseInt(elem.css('left'), 10);
      var top = parseInt(elem.css('top'), 10);
      var rect = elem[0].getBoundingClientRect();
      if (rect.left < offset) elem.css('left', offset - rect.left + left);
      else if (rect.right > window.innerWidth - offset)
        elem.css('left', window.innerWidth - rect.right - offset + left);
      if (rect.top < offset) elem.css('top', offset - rect.top + top);
      else if (rect.bottom > window.innerHeight - offset)
        elem.css('top', window.innerHeight - rect.bottom - offset + top);
    }

    elem.addClass(openClass);
  }
  /**
   * Auto initialization
   */

  $(function () {
    $('.' + prefix).socialLinks();
  });
});
('use strict');

head.ready(function () {
  var $form = $('.advanced-search-form');

  if (!$form.length) {
    return;
  }

  jQuery.expr[':'].icontains = function (a, i, m) {
    return (a.textContent || a.innerText || '').toUpperCase().indexOf(m[3].toUpperCase()) >= 0;
  };

  var update_toggle_message = function update_toggle_message($toggle, count) {
    $toggle.data('message', 'Show only selected options ('.concat(count, ')'));

    if (!$toggle.data('state')) {
      $toggle.find('span').text($toggle.data('message'));
    }
  };

  var update_selected_count = function update_selected_count($items, $toggle, toggle) {
    var count = $items.find('input:checked').length;
    var num_visible = $items.find('input:visible').length;
    update_toggle_message($toggle, count);

    if (count == 0 || $items.legnth == num_visible) {
      $toggle.hide();
    } else {
      $toggle.show();

      if (toggle && count > 0) {
        $toggle.click();
      }
    }
  };

  var filter_items = function filter_items($items, value) {
    if (value == '') {
      $items.css({
        display: 'list-item',
      }); // .find("input").attr('tabindex', -1);
    } else {
      $items
        .find('label:not(:icontains(' + value + '))')
        .parent()
        .css({
          display: 'none',
        });
      $items
        .find('label:icontains(' + value + ')')
        .parent()
        .css({
          display: 'list-item',
        }); // $items.find("input[type=checkbox]:not(:checked):hidden").attr("tabindex", -1);
      // $items.find("input[type=checkbox]:visible").attr("tabindex", 0);
    }
  };

  $('.multiselect').each(function () {
    var $container = $(this);
    var $input = $container.find('input.multiselect-search');
    var $list = $container.find('.multiselect-options');
    var $items = $list.find('li');
    var $toggle = $container.find('.multiselect-show-checked-toggle'); // disable the tabindex

    $items.find('input').attr('tabindex', '-1');
    $list.attr('tabindex', '0');
    $list.css({
      position: 'relative',
    }); // // 2020-12-09 - chrome is triggering focusin on click, before the
    // // targeted input can catch the click
    // $container.on('focusin', 'fieldset', function(event) {
    //   if ( event.target.tagName == 'FIELDSET' && $input.filter(":focus").length == 0 ) {
    //     event.preventDefault();
    //     event.stopPropagation();
    //     setTimeout(function() {
    //       $items.filter(":visible").first().find("input").focus();
    //     })
    //   }
    // })

    $list.on('keyup', 'input', function (event) {
      var $possible = $items.filter(':visible');

      if (event.key == 'ArrowDown' || event.key == 'ArrowUp') {
        var delta = event.key == 'ArrowDown' ? 1 : -1;
        var $current = $(document.activeElement).parent('li');
        var index = $possible.index($current);
        var nextIndex = (index + delta) % $possible.length;

        if (nextIndex < 0) {
          nextIndex = $possible.length - 1;
        }

        var $next = $possible.slice(nextIndex, nextIndex + 1).find('input');
        $next.focus(); // $next.parent().get(0).scrollIntoView();
        // $list.get(0).scrollBy(0, -( $next.parent().height() * 1.125 ));
      }
    });
    $list.on('keydown', function (event) {
      if (event.target == $list.get(0) && event.key == 'Tab' && !event.shiftKey) {
        event.preventDefault();
        console.log('-- bogart');
        $items.filter(':visible').first().find('input').focus();
      }
    });
    $list.on('keydown', 'input', function (event) {
      if (event.key == 'Tab' && event.shiftKey) {
        event.preventDefault();
        event.stopPropagation();

        if (event.shiftKey) {
          $list.prevAll(':tabbable').focus();
        } else {
          $list.nextAll(':tabbable').focus();
        }
      }
    });
    $input.on('keyup', function (event) {
      var value = $(this).val();
      filter_items($items, value);
    });

    var update_toggle_button = function update_toggle_button($toggle, state) {
      if (state != null) {
        $toggle.data('state', state);
      }

      var $span = $toggle.find('span');

      if ($toggle.data('state')) {
        $span.text('Show all options');
      } else {
        $span.text($toggle.data('message'));
      }
    }; // var $last_selected;
    // $toggle.on('click', function(event) {
    //   $toggle.data('state', ! $toggle.data('state'));
    //   if ( $toggle.data('state') ) {
    //     $last_selected = $items.filter(":visible");
    //     $items.css({ display: 'none' });
    //     $items.find("input:checked").parent().css({ display: 'list-item' });
    //     $input.attr("disabled", "disabled");
    //   } else {
    //     $items.filter(":visible").css({ display: 'none' });
    //     $last_selected.css({ display: 'list-item' });
    //     $input.attr("disabled", null);
    //   }
    //   update_toggle_button($toggle);
    // })

    $toggle.on('click', function (event) {
      $toggle.data('state', !$toggle.data('state'));

      if ($toggle.data('state')) {
        // show only selected
        $items.css({
          display: 'none',
        });
        $items.find('input:checked').parent().css({
          display: 'list-item',
        });
        $input.attr('disabled', 'disabled');
      } else {
        filter_items($items, $.trim($input.val()));
        $input.attr('disabled', null);
      }

      update_toggle_button($toggle);
    });
    filter_items($items, $input.val());
    update_selected_count($items, $toggle, true);
    $container.on('click', 'input[type=checkbox]', function (event) {
      // update the toggle
      var $this = $(this);
      update_selected_count($items, $toggle); // $this.attr('tabindex', $this.is(":checked") ? '0' : '-1');

      if (!$this.is(':checked') && $items.filter(':visible:checked').length == 0) {
        // de-selected the last visible item, so un-filter
        $input.attr('disabled', null);
        filter_items($items, $input.val());
        update_toggle_button($toggle, false);
      }
    });
  }); // -- DATE RANGE

  var $date_range_input = $('.date-range-input input[type=radio]');

  var update_date_range = function update_date_range(value) {
    $('.date-range-input-text').hide();
    $('.date-range--'.concat(value)).show();
  };

  $date_range_input.on('change', function (event) {
    update_date_range($(this).val());
  });
  var init_date_range =
    $date_range_input.filter(':checked').length == 0 ? 'between' : $date_range_input.filter(':checked').val();
  update_date_range(init_date_range);
  $('.action-add-clause').on('click', function (event) {
    event.preventDefault();
    $('.group-boolean-container').addClass('active'); // HT.update_status("You've added a another group of search fields.");
  });

  var show_error_message = function show_error_message($container, $focus, message) {
    // var $alert = $(`<div class="alert alert-error alert-block" role="alert"><p>${message}</p></div>`);
    // if ( $container.is("fieldset") ) {
    //   $alert.insertAfter($container.children("legend"));
    // } else {
    //   $alert.insertBefore($container.children(":first"));
    // }
    // HT.update_status(message);
    var $alert = $container.find("[role='alert']");
    $alert.html('<p>'.concat(message, '</p>'));
    $focus.focus();
  };

  var check_for_query = function check_for_query() {
    if ($form.data('ignore-empty-query')) {
      return true;
    }

    var query_exists = false;
    var $inputs = $form.find('.advanced-input-container input[type=text]');
    $inputs.each(function (index, input) {
      var value = $.trim($(input).val());

      if (value != '') {
        query_exists = true;
      }
    });

    if (!query_exists) {
      show_error_message(
        $('form > fieldset:first'),
        $inputs.first(),
        'A search term is required to submit an advanced search.',
      );
    }

    return query_exists;
  };

  var check_date_range = function check_date_range() {
    var is_valid = true;
    var $inputs = $form.find('.date-range-input-text:visible');
    $inputs.each(function () {
      var $this = $(this);
      var value = $.trim($this.val());

      if (value) {
        // check to see this looks like a year?
        if (!value.match(/^\d+$/)) {
          show_error_message(
            $this.parents('.advanced-filter-inner-container'),
            $this,
            'Date of Publication must be between 0-9999.',
          );
          is_valid = false;
          return;
        }
      }
    });

    if ($inputs.length == 2) {
      // the input class names are keyed to the radio buttons
      var $input_start = $inputs.filter('.date-range--after');
      var $input_end = $inputs.filter('.date-range--before');

      if ($input_start.val() > $input_end.val()) {
        show_error_message(
          $input_start.parents('.advanced-filter-inner-container'),
          $input_start,
          'The Start date must be less than the End date.',
        );
        is_valid = false;
      }
    }

    return is_valid;
  };

  var clone_input = function clone_input($this) {
    var $input = $('<input type="hidden" />');
    $input.val($this.val());
    $input.attr('name', $this.data('param') || $this.attr('name'));
    return $input;
  };

  var scroll_error_into_view = function scroll_error_into_view() {
    $('.alert-error').get(0).scrollIntoView();
    $('html').get(0).scrollTop -= $(window).height() * 0.125;
  };

  $form.on('submit', function (event) {
    event.preventDefault();
    $("[role='alert']").empty();

    if (!check_for_query()) {
      return scroll_error_into_view();
    }

    if (!check_date_range()) {
      return scroll_error_into_view();
    } // assemble form

    var $proxy = $("<form style='display: none'></form>");
    $proxy.attr('action', $form.attr('action'));
    $form.children('input[type=hidden]').each(function () {
      $proxy.append($(this).clone());
    });
    var $fieldsets;

    if ($form.find('fieldsets.group:visible').length) {
      $fieldsets = $form.find('fieldset.group:visible fieldset.clause');
    } else {
      $fieldsets = $form.find('fieldset.clause');
    }

    $fieldsets.each(function () {
      var $fieldset = $(this);
      var $input = $fieldset.find('input[type=text]');

      if ($.trim($input.val())) {
        // have input
        $proxy.append($input.clone());
        $fieldset.find('select').each(function () {
          var $select = $(this);
          $proxy.append(clone_input($select));
        });
        $fieldset.find('.advanced-boolean-clause:checked').each(function () {
          $proxy.append(clone_input($(this)));
        });
      }
    }); // clone the group clause if present

    $proxy.append($form.find('.group-boolean:visible input:checked').clone());
    $form.find('.advanced-search-filter-container input[type=radio]:checked:visible').each(function () {
      $proxy.append(clone_input($(this)));
    });
    $form.find('.advanced-search-filter-container input[type=checkbox]:checked').each(function () {
      $proxy.append(clone_input($(this)));
    });
    $form.find('.date-range-input-text:visible').each(function () {
      var $this = $(this);

      if (!$.trim($this.val())) {
        return;
      }

      $proxy.append(clone_input($this));
    });
    $('body').append($proxy);
    $proxy.submit();
  });
});
('use strict');

function _createForOfIteratorHelper(o, allowArrayLike) {
  var it = (typeof Symbol !== 'undefined' && o[Symbol.iterator]) || o['@@iterator'];
  if (!it) {
    if (
      Array.isArray(o) ||
      (it = _unsupportedIterableToArray(o)) ||
      (allowArrayLike && o && typeof o.length === 'number')
    ) {
      if (it) o = it;
      var i = 0;
      var F = function F() {};
      return {
        s: F,
        n: function n() {
          if (i >= o.length) return { done: true };
          return { done: false, value: o[i++] };
        },
        e: function e(_e2) {
          throw _e2;
        },
        f: F,
      };
    }
    throw new TypeError(
      'Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
    );
  }
  var normalCompletion = true,
    didErr = false,
    err;
  return {
    s: function s() {
      it = it.call(o);
    },
    n: function n() {
      var step = it.next();
      normalCompletion = step.done;
      return step;
    },
    e: function e(_e3) {
      didErr = true;
      err = _e3;
    },
    f: function f() {
      try {
        if (!normalCompletion && it.return != null) it.return();
      } finally {
        if (didErr) throw err;
      }
    },
  };
}

function _slicedToArray(arr, i) {
  return (
    _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest()
  );
}

function _nonIterableRest() {
  throw new TypeError(
    'Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.',
  );
}

function _unsupportedIterableToArray(o, minLen) {
  if (!o) return;
  if (typeof o === 'string') return _arrayLikeToArray(o, minLen);
  var n = Object.prototype.toString.call(o).slice(8, -1);
  if (n === 'Object' && o.constructor) n = o.constructor.name;
  if (n === 'Map' || n === 'Set') return Array.from(o);
  if (n === 'Arguments' || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen);
}

function _arrayLikeToArray(arr, len) {
  if (len == null || len > arr.length) len = arr.length;
  for (var i = 0, arr2 = new Array(len); i < len; i++) {
    arr2[i] = arr[i];
  }
  return arr2;
}

function _iterableToArrayLimit(arr, i) {
  var _i = arr == null ? null : (typeof Symbol !== 'undefined' && arr[Symbol.iterator]) || arr['@@iterator'];
  if (_i == null) return;
  var _arr = [];
  var _n = true;
  var _d = false;
  var _s, _e;
  try {
    for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) {
      _arr.push(_s.value);
      if (i && _arr.length === i) break;
    }
  } catch (err) {
    _d = true;
    _e = err;
  } finally {
    try {
      if (!_n && _i['return'] != null) _i['return']();
    } finally {
      if (_d) throw _e;
    }
  }
  return _arr;
}

function _arrayWithHoles(arr) {
  if (Array.isArray(arr)) return arr;
}

var isEnabled = true;
var profiles = {
  'www.hathitrust.org': {
    ga4: 'G-88Z3DQ18W5',
    matomo: '1',
    matomo_container: {
      live: 'JBgjlXyE',
    },
  },
  'catalog.hathitrust.org': {
    ga4: 'G-SRTQWPMGW8',
    matomo: '2',
    matomo_container: {
      live: 'SnfE6ZC0',
      staging: 'SnfE6ZC0_staging_b75afee0f9d38b27dd8d1f7e',
      dev: 'SnfE6ZC0_dev_d955b9deaed0678d60f62d0c',
    },
  },
};
var HT = HT || {};
HT.analytics = HT.analytics || {};
HT.analytics.babel = {}; // hide most of these from the global namespace

HT.analytics.babel.get_report_href = function () {
  function de_semicolon(href) {
    if (href.indexOf(';') > -1) {
      href = href.replace(/;/g, '&');
    }

    return href;
  }

  function parse_babel_href(href) {
    var url = new URL(href);
    var params = new URLSearchParams(url.search);
    return [[url.pathname.replace('/cgi', '')], params];
  } // /mb/<id>

  function get_mb_report_href(href) {
    var _parse_babel_href = parse_babel_href(href),
      _parse_babel_href2 = _slicedToArray(_parse_babel_href, 2),
      parts = _parse_babel_href2[0],
      params = _parse_babel_href2[1];

    var action = params.get('a');
    parts.push(action);

    if (action == 'listcs') {
      parts.push(params.get('colltype'));
    } else if (action == 'listis') {
      parts.push(params.get('c'));
      parts.push(params.get('lmt') || 'all');
    }

    return parts.join('/');
  }

  function get_ls_report_href(href) {
    var _parse_babel_href3 = parse_babel_href(href),
      _parse_babel_href4 = _slicedToArray(_parse_babel_href3, 2),
      parts = _parse_babel_href4[0],
      params = _parse_babel_href4[1];

    var new_params = new URLSearchParams();
    var action = params.get('a');

    if (params.get('c')) {
      parts.push('listis');
      parts.push(params.get('c'));
      parts.push(params.get('lmt') || 'all');
    } else {
      parts.push(action);
    }

    var _iterator = _createForOfIteratorHelper(params.keys()),
      _step;

    try {
      for (_iterator.s(); !(_step = _iterator.n()).done; ) {
        var key = _step.value;

        if (key.match(/q[0-9]|field[0-9]|anyall[0-9]|op[0-9]|lmt/)) {
          new_params.set(key, params.get(key));
        }
      }
    } catch (err) {
      _iterator.e(err);
    } finally {
      _iterator.f();
    }

    var qs = new_params.toString();
    return ''
      .concat(parts.join('/'))
      .concat(qs ? '?' : '')
      .concat(qs);
  } // pt/<id>
  // pt/<id>/search

  function get_pt_report_href(href) {
    var _parse_babel_href5 = parse_babel_href(href),
      _parse_babel_href6 = _slicedToArray(_parse_babel_href5, 2),
      parts = _parse_babel_href6[0],
      params = _parse_babel_href6[1];

    var new_params = new URLSearchParams();
    var id = window.HT && HT.params ? HT.params.id : params.get('id');
    parts.push(document.documentElement.dataset.contentProvider);
    parts.push(encodeURIComponent(id));

    if (parts[0] == 'pt/search') {
      parts[0] = 'pt';
      parts.push('search');
      new_params.add('q1', params.get('q1'));
    } else {
      // parts.push(params.get('view') || '1up');
      // if (params.has('seq')) {
      //   new_params.set('seq', params.get('seq'));
      // }
    }

    var qs = new_params.toString();
    return ''
      .concat(parts.join('/'))
      .concat(qs ? '?' : '')
      .concat(qs);
  }

  var href = de_semicolon(location.href);

  if (href.indexOf('/cgi/mb') > -1) {
    return get_mb_report_href(href);
  } else if (href.indexOf('/cgi/ls') > -1) {
    return get_ls_report_href(href);
  } else if (href.indexOf('/cgi/pt') > -1) {
    return get_pt_report_href(href);
  }

  return href; // punt
};

var add_ga4 = function add_ga4(profileId) {
  // < !--Google tag(gtag.js)-- >
  // <script async src="https://www.googletagmanager.com/gtag/js?id=G-SRTQWPMGW8"></script>
  // <script>
  //   window.dataLayer = window.dataLayer || [];
  //   function gtag(){dataLayer.push(arguments);}
  //   gtag('js', new Date());
  //   gtag('config', 'G-SRTQWPMGW8');
  // </script>
  head.js('https://www.googletagmanager.com/gtag/js?id='.concat(profileId), function () {
    window.dataLayer = window.dataLayer || [];

    function gtag() {
      dataLayer.push(arguments);
    }

    gtag('js', new Date());
    gtag('config', profileId);
  });
};

var add_matomo = function add_matomo(profileId) {
  var _paq = (window._paq = window._paq || []);

  _paq.push(['trackPageView']);

  _paq.push(['enableLinkTracking']);

  (function () {
    var u = '//matomo.www.hathitrust.org/';

    _paq.push(['setTrackerUrl', u + 'matomo.php']);

    _paq.push(['setSiteId', profileId]);

    var d = document,
      g = d.createElement('script'),
      s = d.getElementsByTagName('script')[0];
    g.async = true;
    g.src = u + 'matomo.js';
    s.parentNode.insertBefore(g, s);
  })();
};

var add_matomo_tag = function add_matomo_tag(config) {
  var _mtm = (window._mtm = window._mtm || []);

  var _paq = (window._paq = window._paq || []);

  _mtm.push({
    'mtm.startTime': new Date().getTime(),
    event: 'mtm.Start',
  });

  if (location.host.indexOf('babel.') > -1) {
    // this is a babel app, change the URL
    _paq.push(['setCustomUrl', HT.analytics.babel.get_report_href()]);
  }

  var profileId = config.live;

  if (HT.is_dev && config.dev) {
    profileId = config.dev;
  } else if (location.host.startsWith('preview') && config.staging) {
    profileId = config.staging;
  }

  var d = document,
    g = d.createElement('script'),
    s = d.getElementsByTagName('script')[0];
  g.async = true;
  g.src = 'https://matomo.www.hathitrust.org/js/container_'.concat(profileId, '.js');
  s.parentNode.insertBefore(g, s);
};

head.ready(function () {
  var hostname = location.hostname;
  var profileId;

  if (!isEnabled) {
    return;
  }

  var config;

  if (hostname.indexOf('catalog.hathitrust.org') > -1) {
    config = profiles['catalog.hathitrust.org'];
  } else if (hostname.indexOf('babel.hathitrust.org') > -1) {
    config = profiles['catalog.hathitrust.org'];
  } else if (hostname.indexOf('www.hathitrust.org') > -1) {
    config = profiles['www.hathitrust.org'];
  } else {
    return;
  } // add_ga4(config.ga4);
  // add_matomo(config.matomo);

  add_matomo_tag(config.matomo_container);
});
('use strict');

function _typeof(obj) {
  '@babel/helpers - typeof';
  if (typeof Symbol === 'function' && typeof Symbol.iterator === 'symbol') {
    _typeof = function _typeof(obj) {
      return typeof obj;
    };
  } else {
    _typeof = function _typeof(obj) {
      return obj && typeof Symbol === 'function' && obj.constructor === Symbol && obj !== Symbol.prototype
        ? 'symbol'
        : typeof obj;
    };
  }
  return _typeof(obj);
}

(function (global, factory) {
  (typeof exports === 'undefined' ? 'undefined' : _typeof(exports)) === 'object' && typeof module !== 'undefined'
    ? (module.exports = factory())
    : typeof define === 'function' && define.amd
      ? define(factory)
      : (global.bootbox = factory());
})(window, function () {
  'use strict';

  var version = '0.3.1';
  var isIE = window.navigator.userAgent.indexOf('Trident/') > -1;

  var classCallCheck = function classCallCheck(instance, Constructor) {
    if (!(instance instanceof Constructor)) {
      throw new TypeError('Cannot call a class as a function');
    }
  };

  var createClass = (function () {
    function defineProperties(target, props) {
      for (var i = 0; i < props.length; i++) {
        var descriptor = props[i];
        descriptor.enumerable = descriptor.enumerable || false;
        descriptor.configurable = true;
        if ('value' in descriptor) descriptor.writable = true;
        Object.defineProperty(target, descriptor.key, descriptor);
      }
    }

    return function (Constructor, protoProps, staticProps) {
      if (protoProps) defineProperties(Constructor.prototype, protoProps);
      if (staticProps) defineProperties(Constructor, staticProps);
      return Constructor;
    };
  })();

  var toConsumableArray = function toConsumableArray(arr) {
    if (Array.isArray(arr)) {
      for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) {
        arr2[i] = arr[i];
      }

      return arr2;
    } else {
      return Array.from(arr);
    }
  };

  var bootbox = (function () {
    var FOCUSABLE_ELEMENTS = [
      'a[href]',
      'area[href]',
      'input:not([disabled]):not([type="hidden"]):not([aria-hidden])',
      'select:not([disabled]):not([aria-hidden])',
      'textarea:not([disabled]):not([aria-hidden])',
      'button:not([disabled]):not([aria-hidden])',
      'iframe',
      'object',
      'embed',
      '[contenteditable]',
      '[tabindex]:not([tabindex^="-"])',
    ];

    var Modal = (function () {
      function Modal(_ref) {
        var targetModal = _ref.targetModal,
          _ref$triggers = _ref.triggers,
          triggers = _ref$triggers === undefined ? [] : _ref$triggers,
          _ref$onShow = _ref.onShow,
          onShow = _ref$onShow === undefined ? function () {} : _ref$onShow,
          _ref$onClose = _ref.onClose,
          onClose = _ref$onClose === undefined ? function () {} : _ref$onClose,
          _ref$openTrigger = _ref.openTrigger,
          openTrigger = _ref$openTrigger === undefined ? 'data-micromodal-trigger' : _ref$openTrigger,
          _ref$closeTrigger = _ref.closeTrigger,
          closeTrigger = _ref$closeTrigger === undefined ? 'data-micromodal-close' : _ref$closeTrigger,
          _ref$disableScroll = _ref.disableScroll,
          disableScroll = _ref$disableScroll === undefined ? true : _ref$disableScroll,
          _ref$disableFocus = _ref.disableFocus,
          disableFocus = _ref$disableFocus === undefined ? false : _ref$disableFocus,
          _ref$awaitCloseAnimat = _ref.awaitCloseAnimation,
          awaitCloseAnimation = _ref$awaitCloseAnimat === undefined ? false : _ref$awaitCloseAnimat,
          _ref$restore = _ref.restore,
          restore = _ref$restore === undefined ? null : _ref$restore,
          _ref$callbacks = _ref.callbacks,
          callbacks = _ref$callbacks === undefined ? {} : _ref$callbacks,
          _ref$debugMode = _ref.debugMode,
          debugMode = _ref$debugMode === undefined ? false : _ref$debugMode;
        classCallCheck(this, Modal); // Save a reference of the modal

        if (targetModal instanceof HTMLElement) {
          this.modal = targetModal;
        } else {
          this.modal = document.getElementById(targetModal);
        }

        var status = this.modal.querySelector('div[role="status"]');

        if (!status) {
          status = document.createElement('div');
          status.setAttribute('role', 'status');
          status.setAttribute('aria-live', 'assertive');
          status.setAttribute('aria-atomic', 'true');
          status.classList.add('offscreen');
          this.modal.appendChild(status);
        } // Save a reference to the passed config

        this.config = {
          debugMode: debugMode,
          disableScroll: disableScroll,
          openTrigger: openTrigger,
          closeTrigger: closeTrigger,
          onShow: onShow,
          onClose: onClose,
          awaitCloseAnimation: awaitCloseAnimation,
          disableFocus: disableFocus,
          callbacks: callbacks,
          restore: restore, // Register click events only if prebinding eventListeners
        };
        if (triggers.length > 0) this.registerTriggers.apply(this, toConsumableArray(triggers)); // prebind functions for event listeners

        this.onClick = this.onClick.bind(this);
        this.onKeydown = this.onKeydown.bind(this);
        this.root = document.querySelector('#root');
      }
      /**
       * Loops through all openTriggers and binds click event
       * @param  {array} triggers [Array of node elements]
       * @return {void}
       */

      createClass(Modal, [
        {
          key: 'registerTriggers',
          value: function registerTriggers() {
            var _this = this;

            for (var _len = arguments.length, triggers = Array(_len), _key = 0; _key < _len; _key++) {
              triggers[_key] = arguments[_key];
            }

            triggers.forEach(function (trigger) {
              trigger.addEventListener('click', function () {
                return _this.showModal();
              });
            });
          },
        },
        {
          key: 'showModal',
          value: function showModal() {
            this.activeElement = document.activeElement;

            if (this.root) {
              this.root.setAttribute('aria-hidden', 'true');
            }

            this.modal.setAttribute('aria-hidden', 'false');
            this.modal.classList.add('is-open');
            this.setFocusToFirstNode();
            this.scrollBehaviour('disable');
            this.addEventListeners();
            this.config.onShow(this.modal);
          },
        },
        {
          key: 'closeModal',
          value: function closeModal() {
            var modal = this.modal;
            this.modal.setAttribute('aria-hidden', 'true');
            this.removeEventListeners();
            this.scrollBehaviour('enable');
            this.activeElement.focus();
            this.config.onClose(this.modal);

            if (this.config.awaitCloseAnimation) {
              this.modal.addEventListener(
                'animationend',
                function handler() {
                  modal.classList.remove('is-open');
                  modal.removeEventListener('animationend', handler, false);
                },
                false,
              );
            } else {
              modal.classList.remove('is-open');
            }

            if (this.root) {
              this.root.setAttribute('aria-hidden', 'false');
            }
          },
        },
        {
          key: 'scrollBehaviour',
          value: function scrollBehaviour(toggle) {
            if (!this.config.disableScroll) return;
            var body = document.querySelector('body');
            var documentEl = document.documentElement;

            switch (toggle) {
              case 'enable':
                // Object.assign(body.style, { overflow: 'initial', height: 'initial' });
                documentEl.style.removeProperty('overflow');
                body.style.removeProperty('overflow');
                break;

              case 'disable':
                // Object.assign(body.style, { overflow: 'hidden', height: '100vh' });
                body.style.overflow = 'hidden';
                documentEl.style.overflow = 'hidden';
                break;

              default:
            }
          },
        },
        {
          key: 'addEventListeners',
          value: function addEventListeners() {
            this.modal.addEventListener('touchstart', this.onClick);
            this.modal.addEventListener('click', this.onClick);
            document.addEventListener('keydown', this.onKeydown);
          },
        },
        {
          key: 'removeEventListeners',
          value: function removeEventListeners() {
            this.modal.removeEventListener('touchstart', this.onClick);
            this.modal.removeEventListener('click', this.onClick);
            document.removeEventListener('keydown', this.onKeydown);
          },
        },
        {
          key: 'onClick',
          value: function onClick(event) {
            if (!isIE && event.detail == 0) {
              return;
            }

            var id = event.target.getAttribute('id');

            if (id && this.config.callbacks[id]) {
              var retval = this.config.callbacks[id](this);

              if (retval === false) {
                event.preventDefault();
                return;
              }
            }

            if (event.target.hasAttribute(this.config.closeTrigger)) {
              this.closeModal();
              event.preventDefault();
            }
          },
        },
        {
          key: 'onKeydown',
          value: function onKeydown(event) {
            if (event.keyCode === 27) this.closeModal(event);
            if (event.keyCode === 9) this.maintainFocus(event);

            if (event.keyCode === 13) {
              var id = event.target.getAttribute('id');

              if (id && this.config.callbacks[id]) {
                var retval = this.config.callbacks[id](this);

                if (retval === false) {
                  event.preventDefault();
                  return;
                }
              }

              if (event.target.hasAttribute(this.config.closeTrigger)) {
                this.closeModal();
                event.preventDefault();
              }
            } // if (event.keyCode === 13) {
            //   var form = this.modal.querySelector('form');
            //   if ( ( window.HT && ! window.HT.debugModal ) && form && form.getAttribute('action') ) {
            //     if ( window.jQuery ) {
            //       $(form).submit();
            //     } else {
            //       // form.submit();
            //       var event = new Event('submit');
            //       if ( form.dispatchEvent(event) ) {
            //         form.submit();
            //       }
            //     }
            //   }
            // }
          },
        },
        {
          key: 'getFocusableNodes',
          value: function getFocusableNodes() {
            var nodes = this.modal.querySelectorAll(FOCUSABLE_ELEMENTS);
            return Object.keys(nodes).map(function (key) {
              return nodes[key];
            });
          },
        },
        {
          key: 'setFocusToFirstNode',
          value: function setFocusToFirstNode() {
            if (this.config.disableFocus) return;
            var focusableNodes = this.getFocusableNodes();
            if (focusableNodes.length) focusableNodes[0].focus();
          },
        },
        {
          key: 'maintainFocus',
          value: function maintainFocus(event) {
            var focusableNodes = this.getFocusableNodes(); // if disableFocus is true

            if (!this.modal.contains(document.activeElement)) {
              focusableNodes[0].focus();
            } else {
              var focusedItemIndex = focusableNodes.indexOf(document.activeElement);

              if (event.shiftKey && focusedItemIndex === 0) {
                focusableNodes[focusableNodes.length - 1].focus();
                event.preventDefault();
              }

              if (!event.shiftKey && focusedItemIndex === focusableNodes.length - 1) {
                focusableNodes[0].focus();
                event.preventDefault();
              }
            }
          },
        },
        {
          key: 'modal',
          value: function modal(action) {
            if (action == 'hide') {
              this.closeModal();
            }
          },
        },
        {
          key: 'data',
          value: function data(key, value) {
            var element = this.modal.querySelector('.modal__content');

            if (window.jquery) {
              var $element = window.jquery(element);

              if (value === undefined) {
                return $element.data(key);
              } else {
                $element.data(key, value);
              }
            }
          },
        },
        {
          key: 'find',
          value: function find(selector) {
            if (window.jQuery) {
              return window.jQuery(this.modal.querySelector('.modal__container')).find(selector);
            }

            return this.modal.querySelector('.modal__container').querySelector(selector);
          },
        },
      ]);
      return Modal;
    })();
    /**
     * Modal prototype ends.
     * Here on code is reposible for detecting and
     * autobinding event handlers on modal triggers
     */
    // Keep a reference to the opened modal

    var activeModal = null;
    /**
     * Generates an associative array of modals and it's
     * respective triggers
     * @param  {array} triggers     An array of all triggers
     * @param  {string} triggerAttr The data-attribute which triggers the module
     * @return {array}
     */

    var generateTriggerMap = function generateTriggerMap(triggers, triggerAttr) {
      var triggerMap = [];
      triggers.forEach(function (trigger) {
        var targetModal = trigger.attributes[triggerAttr].value;
        if (triggerMap[targetModal] === undefined) triggerMap[targetModal] = [];
        triggerMap[targetModal].push(trigger);
      });
      return triggerMap;
    };
    /**
     * Validates whether a modal of the given id exists
     * in the DOM
     * @param  {number} id  The id of the modal
     * @return {boolean}
     */

    var validateModalPresence = function validateModalPresence(id) {
      if (!document.getElementById(id)) {
        console.warn(
          'MicroModal v' + version + ": \u2757Seems like you have missed %c'" + id + "'",
          'background-color: #f8f9fa;color: #50596c;font-weight: bold;',
          'ID somewhere in your code. Refer example below to resolve it.',
        );
        console.warn(
          '%cExample:',
          'background-color: #f8f9fa;color: #50596c;font-weight: bold;',
          '<div class="modal" id="' + id + '"></div>',
        );
        return false;
      }
    };
    /**
     * Validates if there are modal triggers present
     * in the DOM
     * @param  {array} triggers An array of data-triggers
     * @return {boolean}
     */

    var validateTriggerPresence = function validateTriggerPresence(triggers) {
      if (triggers.length <= 0) {
        console.warn(
          'MicroModal v' + version + ": \u2757Please specify at least one %c'micromodal-trigger'",
          'background-color: #f8f9fa;color: #50596c;font-weight: bold;',
          'data attribute.',
        );
        console.warn(
          '%cExample:',
          'background-color: #f8f9fa;color: #50596c;font-weight: bold;',
          '<a href="#" data-micromodal-trigger="my-modal"></a>',
        );
        return false;
      }
    };
    /**
     * Checks if triggers and their corresponding modals
     * are present in the DOM
     * @param  {array} triggers   Array of DOM nodes which have data-triggers
     * @param  {array} triggerMap Associative array of modals and thier triggers
     * @return {boolean}
     */

    var validateArgs = function validateArgs(triggers, triggerMap) {
      validateTriggerPresence(triggers);
      if (!triggerMap) return true;

      for (var id in triggerMap) {
        validateModalPresence(id);
      }

      return true;
    };
    /**
     * Binds click handlers to all modal triggers
     * @param  {object} config [description]
     * @return void
     */

    var init = function init(config) {
      // Create an config object with default openTrigger
      var options = Object.assign(
        {},
        {
          openTrigger: 'data-micromodal-trigger',
        },
        config,
      ); // Collects all the nodes with the trigger

      var triggers = [].concat(toConsumableArray(document.querySelectorAll('[' + options.openTrigger + ']'))); // Makes a mappings of modals with their trigger nodes

      var triggerMap = generateTriggerMap(triggers, options.openTrigger); // Checks if modals and triggers exist in dom

      if (options.debugMode === true && validateArgs(triggers, triggerMap) === false) return; // For every target modal creates a new instance

      for (var key in triggerMap) {
        var value = triggerMap[key];
        options.targetModal = key;
        options.triggers = [].concat(toConsumableArray(value));
        new Modal(options); // eslint-disable-line no-new
      }
    };
    /**
     * Shows a particular modal
     * @param  {string} targetModal [The id of the modal to display]
     * @param  {object} config [The configuration object to pass]
     * @return {void}
     */

    var show = function show(targetModal, config) {
      var options = config || {};
      options.targetModal = targetModal; // Checks if modals and triggers exist in dom

      if (options.debugMode === true && validateModalPresence(targetModal) === false) return;

      if (activeModal) {
        activeModal.closeModal();
        activeModal = null;
      }

      if (targetModal instanceof Modal) {
        activeModal = targetModal;
      } else {
        // stores reference to active modal
        activeModal = new Modal(options); // eslint-disable-line no-new
      }

      activeModal.showModal();
      return activeModal;
    };
    /**
     * Closes the active modal
     * @return {void}
     */

    var close = function close() {
      if (activeModal) {
        activeModal.closeModal();
      }

      activeModal = null;
    };

    var active = function active() {
      return activeModal;
    };

    var template =
      '<div class="modal micromodal-slide" id="modal-{ID}" aria-hidden="true">\n    <div class="modal__overlay" tabindex="-1" data-micromodal-close>\n      <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="modal-{ID}-title">\n        <div class="modal__header">\n          <h2 class="modal__title" id="modal-{ID}-title"></h2>\n          <button class="modal__close" aria-label="Close modal" data-micromodal-close></button>\n        </div>\n        <div class="modal__content" id="modal-{ID}-content">\n          {TEMPLATE}\n        </div>\n        <div class="modal__footer">\n          {ACTIONS}\n        </div>\n      </div>\n    </div>\n  </div>';
    var buttonTemplate = '<button class="modal__btn modal__btn-primary btn">Continue</button>';
    var closeButtonTemplate =
      '<button class="modal__btn btn btn-primary" data-micromodal-close aria-label="Close modal">Close</button>';
    var idx = 0;

    var alert = function alert(message) {
      var options = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : {};
      idx += 1;
      var dialogHTML = template.replace(/{ID}/g, idx).replace('{TEMPLATE}', '<div>'.concat(message, '</div>'));
      dialogHTML = dialogHTML.replace('{ACTIONS}', closeButtonTemplate);
      var dialogEl = new DOMParser().parseFromString(dialogHTML, 'text/html').body.children[0];
      document.body.appendChild(dialogEl);
      var h2 = dialogEl.querySelector('h2');

      if (options.header) {
        h2.innerHTML = options.header;
      } else {
        h2.setAttribute('aria-hidden', 'true');
        h2.style.visibility = 'hidden';
        dialogEl.querySelector('.modal__container').classList.add('compact');
      }

      return show(dialogEl, {
        onClose: function onClose(modal) {
          // document.body.removeChild(dialog);
          if (dialogEl) {
            var parentEl = dialogEl.parentElement;

            if (parentEl) {
              parentEl.removeChild(dialogEl);
            }
          }

          activeModal = null;
        },
      });
    };

    var dialog = function dialog(message) {
      var actions = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : [];
      var options = arguments.length > 2 && arguments[2] !== undefined ? arguments[2] : {};
      idx += 1;
      var dialogID = options.id || idx;
      var append_message = false;
      var dialogHTML = template.replace(/{ID}/g, dialogID).replace('{ACTIONS}', '');

      if (typeof message == 'string') {
        dialogHTML = dialogHTML.replace('{TEMPLATE}', '<div>'.concat(message, '</div>'));
      } else {
        dialogHTML = dialogHTML.replace('{TEMPLATE}', '');
        append_message = true;
      }

      var dialogEl = new DOMParser().parseFromString(dialogHTML, 'text/html').body.children[0];
      document.body.appendChild(dialogEl);

      if (append_message) {
        if (message.jquery) {
          message = message.get(0);
        }

        dialogEl.querySelector('.modal__content').appendChild(message);
      }

      var h2 = dialogEl.querySelector('h2');

      if (options.header) {
        h2.innerHTML = options.header;
      } else {
        h2.setAttribute('aria-hidden', 'true');
        h2.style.visibility = 'hidden';
        dialogEl.querySelector('.modal__container').classList.add('compact');
      }

      var footer = dialogEl.querySelector('.modal__footer');
      var callbacks = {};

      for (var i = 0; i < actions.length; i++) {
        var action = actions[i];
        var button = document.createElement('button');
        button.innerHTML = action.label;
        button.setAttribute('id', 'action-modal-button-'.concat(idx, '-').concat(i));

        if (action.ariaLabel) {
          button.setAttribute('aria-label', action.ariaLabel);
        }

        if (action.class.indexOf('btn-dismiss') > -1) {
          button.classList.add('modal__btn');
          button.dataset.micromodalClose = true;
        } else {
          button.classList.add('modal__btn');
        }

        if (action.class) {
          var tmp = action.class.split(' ');
          tmp.forEach(function (cls) {
            button.classList.add(cls);
          });
        } // button.classList.add.apply(button.classList, action.class.split(' '))

        if (action.callback) {
          callbacks[button.getAttribute('id')] = action.callback; // button.addEventListener('click', function() {
          //   action.callback();
          // })
        }

        footer.appendChild(button);
      }

      var onClose = function onClose(modal) {
        // document.body.removeChild(dialog);
        if (dialogEl) {
          var parentEl = dialogEl.parentElement;

          if (parentEl) {
            parentEl.removeChild(dialogEl);
          }
        }

        activeModal = null;
      };

      if (options.lightbox) {
        dialogEl.classList.add('lightbox');
        var content = dialogEl.querySelector('.modal__content');
        content.style.width = ''.concat(options.width - 0 + 16, 'px');
        content.style.height = ''.concat(options.height - 0 + 16, 'px');
      }

      return show(dialogEl, {
        onClose: onClose,
        callbacks: callbacks,
        onShow: options.onShow,
      });
    };

    var confirm = function confirm(message, _callback) {
      return dialog(message, [
        {
          label: 'Cancel',
          class: 'btn-dismiss',
          callback: function callback() {
            _callback(false);
          },
        },
        {
          label: 'OK',
          class: 'btn btn-primary btn-dismiss',
          callback: function callback() {
            _callback(true);
          },
        },
      ]);
    };

    var hideAll = function hideAll() {
      /* WHEN WOULD THIS BE A VALID SCENARIO? */
    };

    return {
      init: init,
      show: show,
      close: close,
      alert: alert,
      dialog: dialog,
      confirm: confirm,
      hideAll: hideAll,
      active: active,
    };
  })();

  return bootbox;
});
('use strict');

head.ready(function () {
  HT.ctools = {}; // hah

  var toggle_checkbox = function toggle_checkbox($box, checked) {
    if (checked == null) {
      checked = !($box.attr('aria-checked') == 'true');
    }

    $box.attr('aria-checked', checked);
    $box.find('svg > use').attr('xlink:href', checked ? '#checkbox-checked' : '#checkbox-empty');

    if ($box == $select_all) {
      $possible_selections.each(function () {
        var $possible = $(this);
        toggle_checkbox($possible, $select_all.attr('aria-checked') == 'true');
      });
    }
  };

  function summarize_results(params) {
    var $div = $('.mb-status');

    if ($div.length) {
      $div.remove();
    }

    $('.alert.alert-operation').remove();
    var status = 'alert-success';

    if (params.result == 'ADD_ITEM_FAILURE') {
      status = 'alert-error';
    }

    if (1 || !$div.length) {
      $div = $('<div class="mb-status alert {STATUS}"></div>'.replace('{STATUS}', status)).insertAfter($toolbar).hide();
    }

    var collID = params.coll_id;
    var collName = params.coll_name;
    var collHref = '<a href="mb?a=listis;c=' + collID + '">' + collName + '</a>';
    var numAdded = params.NumAddedToCollection;
    var numAlreadyInCollection = params.NumAlreadyInCollection;
    var numFailed = params.NumFailed;
    var alertMsg;
    var msg = [];
    console.log('AHOY PARAMS', params);

    if (params.result == 'ADD_ITEM_FAILURE') {
      msg = ['Sorry; there was a problem adding these items to your collection.'];
    } else if (numFailed > 0) {
      msg.push(
        ''.concat(numFailed, ' item').concat(numFailed > 1 ? 's' : '', ' could not be added to your collection'),
      );
    }

    if (numAdded >= 1) {
      msg.push(
        ''
          .concat(numAdded, ' item')
          .concat(numAdded > 1 ? 's' : '', ' ')
          .concat(numAdded > 1 ? 'were' : 'was', ' added to ')
          .concat(collHref, '.'),
      );
    }

    if (numAlreadyInCollection > 0) {
      msg.push(
        ''
          .concat(numAlreadyInCollection, ' item')
          .concat(numAlreadyInCollection > 1 ? 's' : '', ' ')
          .concat(numAlreadyInCollection > 1 ? 'were' : 'was', ' already in ')
          .concat(collHref, '.'),
      );
    } // else {
    //   //  var msg =  params.NumAdded + " items of " + params.NumSubmitted + " were added to " + collHref + " collection";
    //   if (numAdded >1){
    //     msg =  numAdded + " items were added to " + collHref;
    //   }
    //   else{
    //     msg =  numAdded + " item was added to " + collHref;
    //   }
    // }

    msg = msg.join(' ');
    $div.html(msg).show();
    HT.update_status($div.text());
    add_item_to_collist(params);
    toggle_checkbox($select_all, false);
  }

  function submit_post(params, fn) {
    var non_ajax = {
      movit: true,
      delit: true,
      movitnc: true,
      editc: true,
      addc: true,
    };

    if (!non_ajax[params.a]) {
      params.page = 'ajax';
    }

    if (params.page == 'ajax') {
      $.ajax({
        url: get_url(),
        data: $.param(params, true),
      }).done(function (data) {
        // console.log(data);
        var params = parse_line(data);
        $('.btn-loading').removeClass('btn-loading');
        summarize_results(params);

        if (fn) {
          fn();
        }
      });
    } else {
      // extend with HT.params...
      var formdata = $.extend({}, $.url().param(), params);
      var $form = $("<form method='GET'></form>");
      $form.attr('action', get_url());
      $.each(formdata, function (name, values) {
        values = $.isArray(values) ? values : [values];
        $.each(values, function (index, value) {
          $("<input type='hidden' />")
            .attr({
              name: name,
            })
            .val(value)
            .appendTo($form);
        });
      });
      $form.hide().appendTo('body');
      $form.submit();
    }
  }

  function edit_collection_metadata(args) {
    var options = $.extend(
      {
        creating: false,
        label: 'Save Changes',
      },
      args,
    );
    var $block = $(
      '<form class="form-horizontal" action="mb" style="margin-top: 0.5rem">' +
        '<div class="control-group">' +
        '<label class="control-label" for="edit-cn">Collection Name</label>' +
        '<div class="controls">' +
        '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" required />' +
        '<span class="label counter" id="edit-cn-count">100 <span class="offscreen">characters remaining</span></span>' +
        '</div>' +
        '</div>' +
        '<div class="control-group">' +
        '<label class="control-label" for="edit-desc">Description</label>' +
        '<div class="controls">' +
        '<textarea id="edit-desc" name="desc" rows="4" maxlength="255" class="input-large" placeholder="Add your collection description."></textarea>' +
        '<span class="label counter" id="edit-desc-count">255 <span class="offscreen">characters remaining</span></span>' +
        '</div>' +
        '</div>' +
        '<div class="control-group">' +
        '<label class="control-label" for="edit-contributor_name">Contributor</label>' +
        '<div class="controls">' +
        '<input type="text" class="input-large" maxlength="255" name="contributor_name" id="edit-contributor_name" value="" placeholder="Contributor" />' +
        '<span class="label counter" id="edit-contributor_name-count">255 <span class="offscreen">characters remaining</span></span>' +
        '<p class="help-block"><strong>Optional.</strong> Set a public contributor name.</p>' +
        '</div>' +
        '</div>' +
        '<div class="control-group">' +
        '<label class="control-label">Is this collection <strong>Public</strong> or <strong>Private</strong>?</label>' +
        '<div class="controls">' +
        '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > ' +
        '<label class="radio inline" for="edit-shrd-0">' +
        '<i class="icomoon icomoon-locked" aria-hidden="true"></i> ' +
        'Private ' +
        '</label>' +
        '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > ' +
        '<label class="radio inline" for="edit-shrd-1">' +
        'Public ' +
        '</label>' +
        '</div>' +
        '</div>' +
        '</form>',
    );

    if (options.cn) {
      $block.find('input[name=cn]').val(options.cn);
    }

    if (options.desc) {
      $block.find('textarea[name=desc]').val(options.desc);
    }

    if (options.contributor_name) {
      $block.find('input[name=contributor_name]').val(options.contributor_name);
    }

    if (options.shrd != null) {
      $block.find('input[name=shrd][value=' + options.shrd + ']').attr('checked', 'checked');
    } else if (!HT.login_status.logged_in) {
      $block.find('input[name=shrd][value=0]').attr('checked', 'checked'); // remove the <label> that wraps the radio button

      $block.find('input[name=shrd][value=1]').remove();
      $block.find("label[for='edit-shrd-1']").remove();
    }

    if (options.$hidden) {
      options.$hidden.clone().appendTo($block);
    } else {
      $("<input type='hidden' name='c' />").appendTo($block).val(options.c);
      $("<input type='hidden' name='a' />").appendTo($block).val(options.a);
    }

    if (options.$selected) {
      var ids = get_ids(options.$selected);
      ids.forEach(function (id) {
        $("<input type='hidden' name='id' />").appendTo($block).val(id);
      });
    }

    var $dialog = bootbox.dialog($block, [
      {
        label: 'Cancel',
        class: 'btn-dismiss',
      },
      {
        label: options.label,
        class: 'btn btn-primary',
        callback: function callback() {
          var form = $block.get(0);

          if (!form.checkValidity()) {
            form.reportValidity();
            return false;
          }

          var c = $.trim($block.find('input[name=c]').val());
          var cn = $.trim($block.find('input[name=cn]').val());
          var desc = $.trim($block.find('textarea[name=desc]').val());
          var contributor_name = $.trim($block.find('input[name=contributor_name]').val());

          if (!cn) {
            $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
            return false;
          }

          $dialog.find('.btn-primary').addClass('btn-loading');
          display_info('Submitting; please wait...');
          var params = {
            a: options.a,
            cn: cn,
            desc: desc,
            contributor_name: contributor_name,
            shrd: $block.find('input[name=shrd]:checked').val(),
          };

          if (options.$selected) {
            params.id = get_ids(options.$selected);
          }

          if (c) {
            params.c = c;
          }

          submit_post(params, function () {
            $dialog.closeModal();
            hide_info();
          });
        },
      },
    ]);
    HT.ctools.$dialog = $dialog;

    if (!HT.login_status.logged_in) {
      $(
        '<div class="alert alert-danger" style="text-align: left"><strong>This collection will be temporary</strong>. Log in to create permanent and public collections.</div>',
      ).insertBefore($dialog.find('.modal__footer button.modal__btn.btn-dismiss'));
    }

    $dialog.find('input[type=text],textarea').each(function () {
      var $this = $(this);
      var $count = $('#' + $this.attr('id') + '-count');
      var limit = $this.attr('maxlength');
      var num_remaining = limit - $this.val().length;
      $count.html(''.concat(num_remaining, ' <span class="offscreen">characters remaining</span>'));
      $this.bind('keyup', function () {
        num_remaining = limit - $this.val().length;
        $count.html(''.concat(num_remaining, ' <span class="offscreen">characters remaining</span>'));

        if (num_remaining <= 0) {
          var $label = $this.parents('.control-group').find('label');
          HT.update_status(''.concat($.trim($label.text()), ' has a maximum size of ').concat(limit, '.'));
        }
      });
    });
  }

  HT.ctools.edit_collection_metadata = edit_collection_metadata;
  $('#action-edit-collection').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    edit_collection_metadata({
      a: 'editc',
      cn: $this.data('cn'),
      desc: $this.data('desc'),
      contributor_name: $this.data('contributor_name'),
      shrd: $this.data('shrd'),
      c: $this.data('c'),
    });
  });
  $('#action-new-collection').click(function (e) {
    e.preventDefault();
    var $this = $(this);
    edit_collection_metadata({
      a: 'addc',
      creating: true,
    });
  });
  $('.form-download-metadata a.download-help-link').click(function (e) {
    e.preventDefault();
    var html = '<p>You can download certain information about the items in this collection as a text file.';
    html += '\n' + 'You can choose one of these formats of the file:' + '\n' + '<ul class="bullets">';
    html += '\n' + '<li>Item metadata: tab-delimited text (TSV)</li>';
    html += '\n' + '<li>Item + collection metadata as linked data (JSON)</li>';
    html += '</ul>'; // html += '<p><img src="/mb/mb_download_menu.png" /></p>';
    //   html += "\n" + '<p>In both formats, the file ​will contain a few fields about each item in the collection, including title, author, date, rights, and important identifiers. The JSON file will also contain a few fields about the collection, including collection title, number of items, owner, identifier, and description.</p>';
    //   html += "\n" + '<p>JSON downloads can be imported for analysis into the <a href="https://analytics.hathitrust.org">HathiTrust Research Center</a>.</p>';

    html +=
      '\n' +
      '<p><a target="_blank" href="https://www.hathitrust.org/help_digital_library#CBDownload">More Information</a></p>';
    bootbox.alert(html);
  });
  var checkInterval;
  var isFetching = false;

  var checkDownloadStatus = function checkDownloadStatus(collid, $button) {
    if (isFetching) {
      if (HT && HT.is_dev) {
        console.log('-- still checking status');
      }

      return;
    }

    isFetching = true;
    fetch('/cgi/mb/download?a=download-status&c='.concat(collid))
      .then(function (response) {
        return response.json();
      })
      .then(function (data) {
        isFetching = false;

        if (HT && HT.is_dev) {
          console.log('-- download status', data.status);
        }

        if (data.status == 'done') {
          clearInterval(checkInterval);
          $button.attr('disabled', null).removeClass('btn-loading');
          HT.update_status('Metadata has been downloaded.');
        }
      });
  };

  $('.form-download-metadata').on('submit', function (e) {
    var $form = $(this);
    var $button = $form.find('button');
    $button.attr('disabled', 'disabled').addClass('btn-loading');
    var collid = location.search.match(/c=(\d+)/)[1];
    checkInterval = setInterval(function () {
      checkDownloadStatus(collid, $button);
    }, 1000);
    HT.update_status('Download request submitted.');
  });

  if (!$('html').data('use') == 'search') {
    return;
  }

  var $select_all = $('#action-select-all');
  var $possible_selections = $('.add-to-list-checkbox-container button');
  var DEFAULT_COLL_MENU_OPTION = '0';
  var NEW_COLL_MENU_OPTION = '__NEW__';
  var SRC_COLLECTION = '';
  var ITEMS_SELECTED = [];
  var NEW_COLL_NUM_ITEMS = {};
  var DEFAULT_SLICE_SIZE = 25; //XXX need to get this dynamically from xsl/javascript?

  var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';
  var $errormsg = $('.errormsg');
  var $infomsg = $('.infomsg');
  var $toolbar = $('.collections-action-container');
  var $available_collections = $toolbar.find('select');
  var $action = $('.collections-action-container button');

  if (!$select_all.length) {
    return;
  }

  HT.ctools.$possible_selections = $possible_selections;
  HT.ctools.$select_all = $select_all;
  $select_all.on('click', function (event) {
    toggle_checkbox($select_all); // HT.update_status("Search will use the full-text index.");
  });
  $possible_selections.on('click', function (event) {
    toggle_checkbox($(this));
  });

  function display_error(msg) {
    if (!$errormsg.length) {
      $errormsg = $('<div class="alert alert-error errormsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
    }

    $errormsg.empty();
    $errormsg.text(msg).show();
    HT.update_status(msg);
  }

  HT.ctools.display_error = display_error;

  function display_info(msg) {
    if (!$infomsg.length) {
      $infomsg = $('<div class="alert alert-info infomsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
    }

    $infomsg.text(msg).show();
    HT.update_status(msg);
  }

  HT.ctools.display_info = display_info;

  function hide_error() {
    $errormsg.hide().text();
  }

  HT.ctools.hide_error = hide_error;

  function hide_info() {
    $infomsg.hide().text();
  }

  HT.ctools.hide_info = hide_info;

  function hide_status() {
    var $div = $('.mb-status');

    if ($div.length) {
      $div.remove();
    }

    $('.alert.alert-operation').remove();
    HT.update_status('--');
  }

  function get_url() {
    var url = '/cgi/mb';

    if (location.pathname.indexOf('/shcgi/') > -1) {
      url = '/shcgi/mb';
    }

    return url;
  }

  function get_ids(items) {
    var id = [];
    items.each(function () {
      id.push($(this).data('barcode'));
    });
    return id;
  }

  HT.ctools.get_ids = get_ids;

  function parse_line(data) {
    var retval = {};
    var kv;
    var tmp = data.trim().split('|');

    for (var i = 0; i < tmp.length; i++) {
      kv = tmp[i].split('=');
      retval[kv[0]] = kv[1];
    }

    return retval;
  }

  function add_item_to_collist(params) {
    var $option = $available_collections.find("option[value='" + params.coll_id + "']");

    if (!$option.length) {
      // need to add
      $option = $('<option></option>').val(params.coll_id).text(params.coll_name).appendTo($available_collections);
      NEW_COLL_NUM_ITEMS[params.coll_id] = params.NumAdded;
      HT.update_status('Added collection '.concat(params.coll_name, ' to your list.'));
    }
  }

  function confirm_large(collSize, addNumItems, $btn, callback) {
    if (collSize <= 1000 && collSize + addNumItems > 1000) {
      var numStr;

      if (addNumItems > 1) {
        numStr = 'these ' + addNumItems + ' items';
      } else {
        numStr = 'this item';
      }

      var msg =
        'Note: Your collection contains ' +
        collSize +
        ' items.  Adding ' +
        numStr +
        ' to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 1-5 days.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?';
      bootbox.confirm(msg, function (answer) {
        if (answer) {
          callback();
        }

        $btn.removeClass('btn-loading');
      });
    } else {
      // all other cases are okay
      callback();
    }
  }

  $toolbar.on('click', 'button#addits,button#movit,button#delit', function (e) {
    e.preventDefault();
    var action = this.id;
    var $btn = $(this);
    hide_error();
    hide_status();
    var selected_collection_id = $available_collections.val();
    var selected_collection_name = $available_collections.find('option:selected').text();
    var $selected = $possible_selections.filter("[aria-checked='true']");

    if ($selected.length == 0) {
      display_error('You must choose an item');
      return;
    }

    if (action == 'delit') {
      selected_collection_id = $('html').data('c');
    }

    if (
      selected_collection_id == DEFAULT_COLL_MENU_OPTION &&
      (action == 'copyit' || action == 'movit' || action == 'addI' || action == 'addits')
    ) {
      display_error('You must select a collection.');
      return;
    }

    if (selected_collection_id == NEW_COLL_MENU_OPTION) {
      // deal with new collection
      // var $hidden = $form.find("input[type=hidden]").clone();
      // $hidden.filter("input[name=a]").val(action + 'nc');
      edit_collection_metadata({
        creating: true,
        $selected: $selected,
        a: action + 'nc',
      });
      return;
    }

    $btn.addClass('btn-loading');
    var add_num_items = $selected.length;
    var COLL_SIZE_ARRAY = getCollSizeArray();
    var coll_size = COLL_SIZE_ARRAY[selected_collection_id] || NEW_COLL_NUM_ITEMS[selected_collection_id];
    confirm_large(coll_size, add_num_items, $btn, function () {
      // possible ajax action
      submit_post({
        a: action,
        id: get_ids($selected),
        c2: selected_collection_id,
      });
    });
  });
});
('use strict');

var HT = HT || {};
head.ready(function () {
  $('body').on('focusin', ".modal__container input[type='radio']", function (event) {
    // $(event.target).next().get(0).scrollIntoView();
    var target = event.target;
    var name = target.getAttribute('name');
    var $first = $('input[name="'.concat(name, '"]:first'));
    $first.next().get(0).scrollIntoView();
    $(target).parents('.modal__content').get(0).scrollTop -= 150;
  });
  $('body').on('focusin', ".modal__container input[type='checkbox']", function (event) {
    $(event.target).next().get(0).scrollIntoView();
    $(event.target).parents('.modal__content').get(0).scrollTop -= 150;
  });

  function get_feedback_url() {
    var login_status = HT.login_status || {};
    var FEEDBACK_URL = '//' + HT.service_domain + '/cgi/feedback';

    if (login_status.logged_in) {
      FEEDBACK_URL = 'https:' + FEEDBACK_URL;
    }

    return FEEDBACK_URL;
  }

  function default_dialog() {
    var html =
      '<form class="form-horizontal">' +
      '<div class="control-group">' +
      '<label class="control-label" for="email">Email Address</label>' +
      '<div class="controls">' +
      '<input id="email" name="email" type="email" class="input-xlarge" placeholder="[Your email address]" required="required" />' +
      '<span class="required"><i class="icomoon icomoon-info-circle" aria-hidden="true"></i> This field is required.</span>' +
      '</div>' +
      '</div>' +
      '<div class="control-group">' +
      '<label class="control-label" for="comments">Comments</label>' +
      '<div class="controls">' +
      '<textarea rows="5" id="comments" name="comments" required="required" class="input-xlarge" placeholder="Add your feedback here"></textarea>' +
      '<span class="required"><i class="icomoon icomoon-info-circle" aria-hidden="true"></i> This field is required.</span>' +
      '</div>' +
      '</div>' +
      '</form>';
    return html;
  }

  $(document).on('click.feedback.data-api', '[data-toggle^=feedback]', function (e) {
    e.preventDefault();
    bootbox.hideAll();
    var id = $(this).data('id');
    var m = $(this).data('m') || 'ht';
    var html = $(this).data('default-form') ? default_dialog() : HT.feedback ? HT.feedback.dialog() : default_dialog();
    var message;
    var today = new Date();

    if (
      location.search.indexOf('debug=nye') > -1 ||
      (today.getFullYear() == 2022 && today.getDate() >= 23 && today.getMonth() == 11) ||
      (today.getFullYear() == 2023 && today.getDate() < 2 && today.getMonth() == 0)
    ) {
      // ☃
      message =
        '<div class="alert alert-block"><p><span style="font-size: 400%; float: left; display: inline-block; margin-right: 8px" aria-hidden="true">❄</span> Because of the winter holiday, HathiTrust User Support is unavailable from December 23rd through January 2nd. We will respond to your feedback as soon as possible starting January 2nd. Thank you for your patience.</p></div>';
    }

    if (message) {
      if (typeof html == 'string') {
        html = html.replace('<form', message + '<form');
      } else {
        var $tmp = $(html).children().slice(0, 1);
        $tmp.before(message);
      }
    }

    var $dialog = bootbox.dialog(
      html,
      [
        {
          label: 'Cancel',
          class: 'btn-dismiss',
        },
        {
          label: 'Submit',
          class: 'btn btn-primary',
          callback: function callback() {
            var data = {
              return: location.href,
              m: m,
            };

            if (id) {
              data.id = id;
            }

            var is_valid = true;
            var is_empty = true;
            var $form = $dialog.find('form');

            if (!$form.get(0).checkValidity()) {
              $form.get(0).reportValidity();
              return;
            }

            $dialog
              .find('input[type=email],input[type=text],textarea,input:checked,input[type=hidden]')
              .each(function () {
                var value = $.trim($(this).val());

                if (value) {
                  data[$(this).attr('name')] = $(this).val();
                  is_empty = false;
                }

                if ($(this).attr('required') && !value) {
                  is_valid = false;
                }
              }); // var val_email = $.trim($("#email").val());
            // var val_comments = $.trim($("#comments").val());

            if (is_valid && !is_empty) {
              $dialog.find('.btn').attr('disabled', 'disabled');
              $dialog.find('.btn-primary').addClass('btn-loading');

              if (location.hostname == HT.service_domain) {
                // we can do this with ajax
                $.post(get_feedback_url(), data, function () {
                  $dialog.closeModal();
                  bootbox.alert('<p>Thank you for your feedback!</p>');
                }).fail(function () {
                  $dialog.closeModal();
                  bootbox.alert('<p>There was an issue submitting this feedback.</p>');
                });
              } else {
                // have to post the form
                var $form = $("<form method='POST'></form>");
                $form.attr('action', get_feedback_url());
                $.each(data, function (name, values) {
                  values = $.isArray(values) ? values : [values];
                  $.each(values, function (index, value) {
                    $("<input type='hidden' />")
                      .attr({
                        name: name,
                      })
                      .val(value)
                      .appendTo($form);
                  });
                }); // $.each($.keys(data), function(name) {
                //   var values = data[name];
                //   values = $.isArray(values) ? values : [ values ];
                //   _.each(values, function(value) {
                //     $("<input type='hidden' />").attr({ name : name }).val(value).appendTo($form);
                //   })
                // })

                $dialog.closeModal();
                $form.hide().appendTo('body');
                $form.submit();
              }
            } else if (!is_valid) {
              $("<div class='alert alert-error'>Please fill in required fields.</div>").insertBefore(
                $dialog.find('.btn-dismiss'),
              );
              $dialog.addClass('required');
            } else {
              $("<div class='alert alert-error'>You cannot submit an empty form.</div>").insertBefore(
                $dialog.find('.btn-dismiss'),
              );
            }

            return false;
          },
        },
      ],
      {
        header: 'Feedback',
      },
    );
  });
});
('use strict');

var HT = HT || {};
HT.analytics = HT.analytics || {};
HT.analytics.enabled = false; // HT.analytics.trackPageview = function(href) { /* no op */ };

HT.analytics.trackEvent = function (params) {
  /* no op */
};

HT.analytics.getTrackingLabel = function (arg) {
  return '-';
};

HT.analytics.getContentGroupData = function () {};

HT.analytics.getPageHref = function () {
  return window.location.href;
};

HT.analytics.post_setup = [];
HT.analytics.q = [];
HT.analytics.waiting = {
  ga: true,
  login: true,
};

HT.analytics.trackPageview = function (href, profile_id) {
  HT.analytics.q.push([href, profile_id]);
};

HT.analytics.deQ = function () {
  /* no op */
};

head.ready(function () {
  var $html = $('html');
  var $window = $(window);
  HT.analytics.profile_id = $.trim($html.data('analytics-code')) || 'UA-954893-23';
  var is_enabled = $html.data('analytics-enabled');

  if (typeof is_enabled == 'string') {
    is_enabled = $.trim(is_enabled) == 'true';
  }

  if (window.location.host == 'www.hathitrust.org') {
    is_enabled = true;
  }

  if (is_enabled) {
    // deconstructed version of the tracking code, to mesh with unicorn
    // <script>
    //   (function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
    //   (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
    //   m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
    //   })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
    //   ga('create', 'UA-954893-23', 'hathitrust.org');
    //   ga('send', 'pageview');
    // </script>
    HT.analytics.enabled = true;
    window['GoogleAnalyticsObject'] = 'ga';

    window['ga'] =
      window['ga'] ||
      function () {
        (window['ga'].q = window['ga'].q || []).push(arguments);
      };

    window['ga'].l = 1 * new Date();
    var profiles = [HT.analytics.profile_id];

    function _get_prefix(profile_id) {
      var idx = profiles.indexOf(profile_id);

      if (idx < 0) {
        profiles.push(profile_id);
        idx = profiles.length - 1; // and then setup the tracker

        var config = {
          cookieDomain: 'hathitrust.org',
          legacyCookieDomain: 'hathitrust.org',
          name: 'ht' + idx,
        };
        window['ga']('create', profile_id, config);
      }

      return 'ht' + idx + '.';
    }

    window['ga']('create', HT.analytics.profile_id, {
      cookieDomain: 'hathitrust.org',
      legacyCookieDomain: 'hathitrust.org',
    });
    head.js(
      ('https:' == document.location.protocol ? 'https://ssl.' : 'http://www.') + 'google-analytics.com/analytics.js',
      function () {
        HT.analytics.waiting.ga = false;
        console.log('AHOY DEQ GA');

        function _munge_href(href) {
          if (href.indexOf(';') > -1) {
            href = href.replace(/;/g, '&');
          }

          return href.replace(window.location.protocol + '//' + window.location.hostname, '');
        }

        HT.analytics.deQ = function () {
          if (HT.analytics.waiting.ga || HT.analytics.waiting.login) {
            // console.log("AHOY DEQ", HT.analytics.waiting.ga, HT.analytics.waiting.login);
            return;
          }

          while (HT.analytics.q.length) {
            var tuple = HT.analytics.q.shift(); // console.log("AHOY DEQ", tuple[0]);

            HT.analytics.trackPageview(tuple[0], tuple[1]);
          }
        };

        HT.analytics.trackPageview = function (href, profile_id, force) {
          if (HT.analytics.waiting.ga || HT.analytics.waiting.login) {
            // console.log("AHOY PUSHING TO Q", href);
            HT.analytics.q.push([href, profile_id]);
            return;
          } // allow for passing alternative profile for analytics experiments

          var prefix = profile_id ? _get_prefix(profile_id) : '';
          ga(prefix + 'set', 'dimension1', $window.width() + 'x' + $window.height());
          var content_group_data = HT.analytics.getContentGroupData();

          if (content_group_data) {
            ga(prefix + 'set', 'contentGroup' + content_group_data.index, content_group_data.value);
          } // do we have any extra dimensions?

          var value = $html.data('anlaytics-dimension');

          if (value) {
            value = value.split('=');
            ga(prefix + 'set', value[0], value[1]);
          }

          if (HT.login_status) {
            var value;

            if (HT.login_status.logged_in) {
              value = HT.login_status.institutionCode + '/' + HT.login_status.affiliation.toLowerCase();

              if (HT.login_status.mappedInstitutionCode) {
                value = HT.login_status.mappedInstitutionCode + '/' + value;
              }
            } else {
              value = 'anon/guest';
            }

            ga(prefix + 'set', 'dimension3', value);
          }

          var title = HT.analytics.getTitle ? HT.analytics.getTitle() : document.title;
          ga(prefix + 'send', {
            hitType: 'pageview',
            page: _munge_href(href),
            title: title,
          }); // ga(prefix + 'send', 'pageview', _munge_href(href));
        };

        HT.analytics.trackEvent = function (params, profile_id) {
          var prefix = profile_id ? _get_prefix(profile_id) : '';
          ga('send', 'event', params.category, params.action, params.label);
        }; // bind to track events

        $(document).on('click.google', '[data-toggle*=tracking]', function (e) {
          var $link = $(this);
          var label = $link.data('tracking-label') || HT.analytics.getTrackingLabel($link);
          var category = $link.data('tracking-category') || $html.data('tracking-category') || 'HT';
          var action = $link.data('tracking-action');
          var toggle = $link.data('toggle');
          HT.analytics.trackEvent({
            label: label,
            category: category,
            action: action,
          });

          if (toggle.indexOf('tracking-action') > -1) {
            return true;
          }

          var retval = true;

          if ($link.is('a')) {
            if ($link.attr('target') || $link.prop('download') !== undefined) {
              return true;
            }

            retval = false;
            var href = $link.attr('href');
            setTimeout(function () {
              window.location.href = href;
            }, 500);
          } else if ($link.is('input[type=submit]')) {
            var frm = $(this).parents('form');
            retval = false;
            var events = $.data(frm.get(0), 'events');

            if (events && events.submit == undefined) {
              setTimeout(function () {
                frm.submit();
              }, 500);
            } else {
              return true;
            }
          }

          return retval;
        });

        for (var i = 0; i < HT.analytics.post_setup; i++) {
          HT.analytics.post_setup[i]();
        }

        HT.analytics.deQ(); // if ( $.trim($html.data('analytics-skip')) == 'true' ) {
        //     return;
        // }
        // // track the current page view
        // HT.analytics.trackPageview(HT.analytics.getPageHref());
      },
    );
  }
});
('use strict');

head.ready(function () {
  var $form = $('#ht-search-form');

  if (!$form.length) {
    return;
  }

  var $header = $form.parents('.container-header');
  var is_search_app = $('html').data('use') == 'search';
  var inited = false;
  var $input = $form.find('input.search-input-text');
  var $input_label = $form.find("label[for='q1-input']");
  var $select = $form.find('.control-searchtype');
  var $search_target = $form.find('.search-target');
  var $ft = $form.find('span.funky-full-view');
  var $ft_check = $('html').data('ft');
  var allItems = $('[aria-labelledby=view-all]').attr('aria-checked');
  var _setup = {};

  _setup.ls = function () {
    $('.ht-search-form .control-searchtype').hide();
    $('.ht-search-form input.search-input-text').attr('placeholder', 'Search words about or within the items');
    $(".ht-search-form label[for='q1-input']").text('Search full-text index'); // has "All Items" view has been selected?
    // check/unchecked hidden "full-view" checkbox depending

    if (allItems == 'true') {
      $('input[name=ft]').attr('checked', null);
    } else {
      $('input[name=ft]').attr('checked', 'checked');
    }

    if (inited) {
      HT.update_status('Search will use the full-text index.');
    }
  };

  _setup.catalog = function () {
    $('.ht-search-form .control-searchtype').show();
    $('.ht-search-form input.search-input-text').attr('placeholder', 'Search words about the items');
    $(".ht-search-form label[for='q1-input']").text('Search catalog index'); // has "All Items" view has been selected?
    // check/unchecked hidden "full-view" checkbox depending

    if (allItems == 'true') {
      $('input[name=ft]').attr('checked', null);
    } else {
      $('input[name=ft]').attr('checked', 'checked');
    }

    if (inited) {
      HT.update_status(
        'Search will use the catalog index; use Shift + Tab to limit your search to a selection of fields.',
      );
    }
  };

  var _handler = {};

  _handler.ls = function (formData) {
    var search_url;
    var submitData = new URLSearchParams();
    submitData.set('q1', formData.get('q1'));
    submitData.set('field1', 'ocr');
    submitData.set('a', 'srchls');

    if (formData.get('ft') == 'ft') {
      submitData.set('ft', 'ft');
      submitData.set('lmt', 'ft');
    }

    search_url = '//'.concat(HT.service_domain);
    search_url += '/cgi/ls?';
    search_url += submitData.toString();
    location.href = search_url;
  };

  _handler.catalog = function (formData) {
    var search_url;
    var submitData = new URLSearchParams();
    var searchtype = formData.get('searchtype');

    if (searchtype == 'isbn') {
      searchtype = 'isn';
    }

    submitData.set('lookfor', formData.get('q1'));
    submitData.set('searchtype', searchtype);

    if (formData.get('ft') == 'ft') {
      submitData.set('ft', 'ft');
      submitData.set('setft', 'true');
    } else {
      submitData.set('ft', '');
      submitData.set('setft', 'false');
    }

    search_url = '//'.concat(HT.catalog_domain);
    search_url += '/Search/Home?';
    search_url += submitData.toString();
    location.href = search_url;
  };

  var target = $search_target.find('input:checked').val();

  _setup[target]();

  inited = true;
  var prefs = HT.prefs.get();

  if ($ft == null && !is_search_app && prefs.search && prefs.search.ft) {
    console.log('AHOY AHOY SEARCH FORM');
    $('input[name=ft]').attr('checked', 'checked');
  } // $("body").on('change', '.ht-search-form .control-search-type input[type="radio"]', function(e) {

  $('body').on('change', '.ht-search-form .search-target input[type="radio"]', function (e) {
    target = this.value;

    _setup[target]();

    HT.analytics.trackEvent({
      label: '-',
      category: 'HT Search',
      action: target,
    });
  });
  var $action = $('nav .action-search-hathitrust');
  var $clone;
  var $dialog;
  $action.on('click', function () {
    if ($dialog === undefined) {
      $dialog = $(
        '\n        <div class="modal micromodal-slide" id="search-modal" aria-hidden="true">\n          <div class="modal__overlay" tabindex="-1" data-micromodal-close="true">\n            <div class="modal__container modal__container--square" role="dialog" aria-modal="true" aria-labelledby="search-modal-title">\n              <form action="//'.concat(
          HT.service_domain,
          '/cgi/ls/one" method="GET" role="search" class="ht-search-form">\n                <div class="modal__header">\n                  <h2 class="modal__title" id="search-modal-title">\n                    Search HathiTrust\n                  </h2>\n                  <button class="modal__close" aria-label="Close modal" data-micromodal-close="true"></button>\n                </div>\n                <div class="modal__content" id="search-modal-content">\n                </div>\n                <div class="modal__footer">\n                  <button class="modal__btn btn" data-micromodal-close="true" aria-label="Close modal">Close</button>\n                  <button class="modal__btn btn btn-primary">Search</button>\n                </div>\n              </form>\n            </div>\n          </div>          \n        </div>\n      ',
        ),
      );
      $('body').append($dialog);
    }

    var $content = $dialog.find('#search-modal-content');
    $content.children().remove();
    $content.append($form.children().clone());
    $content.find('#action-search-hathitrust').parent().parent().remove();
    $content.find('#option-full-text-search').attr('id', 'option-full-text-search-2');
    $content.find('#option-catalog-search').attr('id', 'option-catalog-search-2');
    $content.find('label.search-label-full-text').attr('for', 'option-full-text-search-2');
    $content.find('label.search-label-catalog').attr('for', 'option-catalog-search-2');
    $content.find("label[for='global-search-ft']").attr('for', 'global-search-ft-2');
    $content.find('#global-search-ft').attr('id', 'global-search-ft-2');
    var $input_modal = $content.find('input[type=text]');
    $input_modal.on('keyup', function () {
      $input.val($input_modal.val());
    }); // $dialog.find(".modal__container").remove("form").append($form.clone(true));

    bootbox.show($dialog.get(0), {
      onShow: function onShow(modal) {
        $input.focus();
      },
    });
  });

  var _resizeTimer;

  var _resizer = function _resizer() {
    var active = bootbox.active();

    if ($header.is(':visible') && active && active.modal.getAttribute('id') == 'search-modal') {
      bootbox.close();
    } else {
      /* NOP */
    }
  };

  $(window).on('resize', function () {
    if (_resizeTimer) {
      clearTimeout(_resizeTimer);
    }

    _resizeTimer = setTimeout(_resizer, 500);
  });
  setTimeout(_resizer, 500);
  $('#ht-search-form').addClass('ht-search-form'); // add event handler for submit to check for empty query or asterisk

  $('body').on('submit', '.ht-search-form', function (event) {
    event.preventDefault();
    HT.beforeUnloadTimeout = 15000;
    var $form = $(this);

    if (!this.checkValidity()) {
      this.reportValidity();
      return false;
    } //check for blank or single asterisk

    var $input = $(this).find('input[name=q1]');
    var query = $input.val();
    query = $.trim(query);

    if (query === '') {
      alert('Please enter a search term.');
      $input.trigger('blur');
      return false;
    } // // *  Bill says go ahead and forward a query with an asterisk   ######
    // else if (query === '*')
    // {
    //   // change q1 to blank
    //   $("#q1-input").val("")
    //   $(".search-form").submit();
    // }
    // ##################################################################*
    else {
      // save last settings
      var searchtype = target == 'ls' ? 'all' : $form.find('select').val(); // this won't set ft because there won't be a checkbox
      //HT.prefs.set({ search : { ft : $form.find("input[name=ft]:checked").length > 0, target : target, searchtype: searchtype }})

      HT.prefs.set({
        search: {
          target: target,
          searchtype: searchtype,
        },
      });

      _handler[target](new FormData($form.get(0)));

      return false;
    }
  });
});
('use strict');

var HT = HT || {};
head.ready(function () {
  var PING_URL;
  var PING_DOMAIN;
  PING_URL = location.protocol + '//' + HT.service_domain + '/cgi/ping';
  var is_babel = window.location.href.indexOf('babel.hathitrust') > -1;
  var $button = $('#login-button,#login-link');
  var prefs = HT.prefs.get();
  var $block;
  var $dialog;

  function getWeek(date) {
    date.setHours(0, 0, 0, 0); // Thursday in current week decides the year.

    date.setDate(date.getDate() + 3 - ((date.getDay() + 6) % 7)); // January 4 is always in week 1.

    var week1 = new Date(date.getFullYear(), 0, 4); // Adjust to Thursday in week 1 and count number of weeks from date to week1.

    return 1 + Math.round(((date.getTime() - week1.getTime()) / 86400000 - 3 + ((week1.getDay() + 6) % 7)) / 7);
  }

  function create_login_panel(args) {
    args = args || {};
    var status = HT.login_status;
    var block_html =
      '<div class="login-panel modal micromodal-slide" tabindex="-1" aria-hidden="true" id="login-modal">' +
      '<div class="modal__overlay" tabindex="-1" data-micromodal-close>' +
      '<div class="modal__container compact" role="dialog" aria-modal="true" aria-labelledby="login-modal-title">' +
      '<div class="login-panel-arrow"></div>' +
      '<div class="modal__header"><h2 class="modal__title" id="login-modal-title">Login</h2><button class="modal__close" aria-label="Close" data-micromodal-close></button></div>' +
      '<div class="modal__content" id="login-modal-content">' +
      '<form method="POST">' +
      '<div class="headline">' +
      '<p>Find your partner institution:</p>' +
      '</div>' +
      '<div class="wayf-list">' +
      '<label for="idp" class="offscreen">Select your institution</label>' +
      '<select id="idp" name="idp"><option value="0" style="font-weight: bold">Choose your partner institution</option></select>' +
      '</div>' +
      '<div class="actions">' +
      '<button class="button continue">Continue<span class="after icomoon icomoon-arrow-right" aria-hidden="true"></span></button>' +
      '</div>' +
      '<input type="hidden" name="target" value="" />' +
      '</form>' +
      '<p class="aup-notice">By logging into HathiTrust, you agree to follow our <a href="https://www.hathitrust.org/acceptable-use">Acceptable Use Policy</a>.</p>' +
      '</div>' +
      '<div class="modal__footer">' +
      '<div class="questions">' +
      '<p><a href="https://{WWW_DOMAIN}/help_digital_library#LoginNotListed">Why isn\'t my institution listed?</a></p>' +
      '</div>' +
      '<div class="questions">' +
      '<p>' +
      '<span style="font-weight: bold">Not with a partner institution?</span><br />' +
      '<a href="https://{SERVICE_DOMAIN}/cgi/wayf" data-href="wayf">See options to log in as a guest</a><br />' + // &#x27a4;
      '</p>' +
      '</div>' +
      '</div>' +
      '</div>' + // modal__container
      '</div>' + // modal__overlay
      '</div>';
    $block = $(block_html.replace(/{WWW_DOMAIN}/g, HT.www_domain).replace(/{SERVICE_DOMAIN}/g, HT.service_domain));
    $dialog = $block.find('.modal__container');
    var $select = $dialog.find('select[name=idp]');
    var target = window.location.href;

    if (target.indexOf('babel.hathitrust') < 0) {
      // not a babel app, need to route through ping/pong
      target = HT.get_pong_target(target);
    } else {
      target = target.replace('http://', 'https://');
    }

    $dialog.find('input[name=target]').val(encodeURI(target)); // find the default sdrinst first

    var selected_sdrinst = prefs.sdrinst;
    var default_sdrinst;
    var found_sdrinst = false;
    $.each(status.idp_list, function () {
      if (this.selected) {
        default_sdrinst = this.sdrinst;
      }

      if (this.sdrinst == selected_sdrinst) {
        found_sdrinst = true;
      }
    });

    if (!found_sdrinst && selected_sdrinst != 'umich.dev') {
      selected_sdrinst = default_sdrinst;
    }

    var friend_login_link;
    $.each(status.idp_list, function () {
      //var $option = $("<option></option>").appendTo($select);
      var $option = $('<option></option>');
      $option.val(this.idp_url).data('sdrinst', this.sdrinst);
      var name = this.name.replace('&amp;', '&');

      if (this.enabled == 1) {
        $option.text(name);
      } else if (this.enabled == 0) {
        if (HT.is_dev) {
          $option.text(name + ' DEV');
        } else {
          return;
        }
      } else if (this.enabled == 2) {
        return;
      }

      $option.appendTo($select); // if ( this.selected ) { default_sdrinst = this.sdrinst; }

      if (this.sdrinst == selected_sdrinst) {
        $option.attr('selected', 'selected');
      }
    });
    $dialog
      .find('a[data-href=wayf]')
      .attr('href', 'https://' + HT.service_domain + '/cgi/wayf?target=' + encodeURIComponent(target));
    var classes = 'login-modal';

    if (args.classname) {
      classes += ' ' + args.classname;
    }

    var $trigger = args.$trigger; // $block.insertAfter($trigger);

    $block.appendTo($('body'));
    HT.$block = $block;
    HT.$dialog = $dialog;
    HT.$button = $trigger;
    $dialog.find('button.continue').click(function (e) {
      e.preventDefault();
      var href = $select.val();

      if (href == '0') {
        return;
      }

      var sdrinst = $select.find('option:selected').data('sdrinst');
      HT.prefs.set({
        sdrinst: sdrinst,
      });
      href = href.replace('___TARGET___', encodeURIComponent(target));
      setTimeout(function () {
        window.location.href = href;
      }, 500); // track a fake pageview to the wayf

      HT.analytics.trackPageview('/cgi/wayf?via=' + sdrinst + '&target=' + target);
    });
    $select.select2({
      dropdownParent: $block,
      allowCear: true,
      width: '100%',
    });
    $select.on('select2:open', function () {
      $block.data('selecting', true);
    });
    $select.on('select2:close', function () {});
    $dialog.on('keyup.dismiss.login', function (e) {
      if (e.which == 27) {
        if ($dialog.data('selecting')) {
          // NOOP
          $dialog.data('selecting', false);
        } else {
          hide_login_dialog();
        }
      }
    }); // is $button fixed or static?

    var position = 'absolute';
    $button.parents().each(function () {
      var s = window.getComputedStyle(this);

      if (s.position == 'fixed') {
        position = 'fixed';
      }
    });
    console.log('AHOY POSITION', position);
    $dialog.css({
      position: position,
    });
  }

  function setup_login_link(status) {
    if ($('body').is('.no-login')) {
      return;
    }

    $('a.trigger-login').each(function () {
      var target = $(this).attr('href');

      if (!target || target == '#') {
        target = window.location.href;
      }

      if (target.indexOf('/cgi/wayf') < 0) {
        if (!HT.is_babel) {
          target = HT.get_pong_target(target);
        }

        var href = 'https://' + HT.service_domain + '/cgi/wayf?target=' + encodeURIComponent(target);
        $(this).attr('href', href);
      } else if (target.indexOf('http://') > -1) {
        $(this).attr('href', target.replace('http://', 'https://'));
      }
    });
    create_login_panel({
      $trigger: $button,
    });
    $button.on('click', function (e) {
      // if ( $("html").is(".mobile") ) { return ; }
      if ($(window).width() < 700) {
        return;
      }

      e.preventDefault();
      console.log('AHOY LOGIN CLICK', $button.data('active'), e);

      if ($button.data('active')) {
        console.log('AHOY LOGIN OFF');
        hide_login_dialog({
          $trigger: $(this),
        });
      } else {
        console.log('AHOY LOGIN ON');
        display_login_dialog({
          $trigger: $(this),
        });
      }
    });
    var target = window.location.href;

    if (target.indexOf('babel.hathitrust') < 0) {
      // not a babel app, need to route through ping/pong
      target = HT.get_pong_target(target);
    } else {
      target = target.replace('http://', 'https://');
    }

    var login_href = 'https://' + HT.service_domain + '/cgi/wayf?target=' + encodeURIComponent(target);

    if (status.expired) {
      // var $alert = $('<div class="alert alert-block alert-warning alert-plain alert-banner"><a href="javascript:;" aria-label="Close banner" class="close" style="margin-right: 24px;"><i aria-hidden="true" class="icomoon icomoon-cancel"></i></a><p>You have been logged out. <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="#">Login</a></p></div>');
      // $alert.find("a[data-action='login']").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
      // $alert.find("a.close").on('click', function() { $alert.hide(); });
      // // $alert.find("button").on('click', function() { $alert.hide(); });
      // var $target = $("#skiplinks");
      // if ( ! $target.length ) { $target = $("h1"); }
      // $alert.insertAfter($target);
      insert_banner(
        'login-expired',
        '<p>You have been logged out. <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="' +
          login_href +
          '">Login</a></p>',
        true,
      );
    }

    var last_provider = $.cookie('HTproviderName');

    if (last_provider) {
      // previous login
      if (document.referrer == location.href) {
        // var $navbar = $(".navbar-static-top");
        // var $alert = $('<div class="alert alert-block centered" style="border-radius: 0; width: auto; height: 45px;margin-left: auto; margin-right: auto; position: fixed; top: 0px; left: 0; right: 0; z-index: 1005; background: #ef7c22; border-color: #703608; color: white; text-shadow: none; font-size: 14px;"><p style="width: 900px; margin-left: auto; margin-right: auto; color: #000">You have been logged out of HathiTrust, but are still logged in to your provider ({LAST_PROVIDER}).&nbsp;<button type="button" class="close" style="opacity: 0.8"><span class="offscreen">Close</span><span aria-hidden="true">×</span></button></p></div>'.replace('{LAST_PROVIDER}', last_provider));
        // var margin_top = parseInt($("body").css("margin-top") || "0");
        // // $alert.find("a").attr("href", 'https://' + HT.service_domain + "/cgi/wayf?target=" + encodeURIComponent(window.location.href));
        // $alert.insertBefore(".navbar-static-top");
        // $navbar.css("top", 45);
        // $alert.find("button").on("click", function(e) {
        //     e.preventDefault();
        //     $alert.remove();
        //     $navbar.css('top', 0);
        //     $.removeCookie('HTproviderName', { domain: '.hathitrust.org', path: '/', secure: true });
        //     $("body").css("margin-top", margin_top);
        // })
        // $("body").css('margin-top', margin_top + 45);
        var callback = function callback() {
          $.removeCookie('HTproviderName', {
            domain: '.hathitrust.org',
            path: '/',
            secure: true,
          });
        };

        var message = 'You have been logged out of HathiTrust, but are still logged in to your provider ('.concat(
          last_provider,
          ').',
        );
        insert_banner(
          'logged-out',
          '<p>'
            .concat(message, ' <a class="btn btn-default" data-action="login" data-close-target=".modal.login" href="')
            .concat(login_href, '">Login</a></p>'),
          true,
          callback,
        );
      }

      $.removeCookie('HTproviderName', {
        domain: '.hathitrust.org',
        path: '/',
        secure: true,
      });
    }
  }

  function display_login_dialog(options) {
    var $trigger = options.$trigger;
    var top = $block.css('position') == 'fixed' ? $trigger.position().top : $trigger.offset().top;
    top = $trigger.position().top;
    top += $trigger.outerHeight() + 100 / 2; // 32;

    var left = $trigger.position().left - $dialog.width() + 150; // console.log("-- positioning", left, "<-", $trigger.position().left, $block.width(), "/", left, $dialog.get(0).getBoundingClientRect());

    var right = window.innerWidth - (left + $dialog.width());

    if (right < 0) {
      left += right;
    }

    $dialog.css({
      top: top,
      left: left,
    });
    var $caret = $dialog.find('.login-panel-arrow');
    $caret.css({
      right: 25,
    });

    if ($button.is('.button')) {
      $button.addClass('active');
    } else {
      $button.parents('li').addClass('active');
    }

    $button.data('active', true);
    bootbox.show('login-modal', {
      onClose: function onClose(modal) {
        remove_active_status();
        $button.data('active', false);
      },
    }); // bootbox.dialog($block);
    // $block.modal({ backdrop: true, keyboard: false });
    // $block.on('hidden', function() {
    //     remove_active_status();
    //     $button.data('active', false);
    // })
  }

  function hide_login_dialog(options) {
    // $block.addClass("hidden");
    setTimeout(function () {
      $block.modal('hide'); // remove_active_status();

      console.log('AHOY MODAL SHOULD BE OFF?', $button.data('active'));
    }, 0);
  }

  function remove_active_status() {
    if ($button.is('.button')) {
      $button.removeClass('active');
    } else {
      $button.parents('li').removeClass('active');
    }

    $button.data('active', false);
  }

  function setup_logged_in_state(status) {
    if ($button.length) {
      // rewrite the header so we appear to be logged in!
      $button.remove();
      var $navbar = $('#person-nav');
      var fragment = document.createDocumentFragment();
      var coll_url = 'https://' + HT.service_domain + '/cgi/mb?colltype=my-collections';
      var html =
        '<ul id="person-nav" class="nav pull-right">' +
        '<li><span>' +
        status.affiliation +
        ' (' +
        status.providerName +
        ')</span></li>' +
        '<li><a href="' +
        coll_url +
        '">My Collections</a></li>' +
        '<li><a class="logout-link" href="https://{SERVICE_DOMAIN}/cgi/logout?'.replace(
          '{SERVICE_DOMAIN}',
          HT.service_domain,
        ) +
        window.location.href +
        '">Log out</a></li>' +
        '</ul>';
      $(fragment).append('<li><span>' + status.affiliation + '</span></li>');
      $(fragment).append('<li><a href="' + coll_url + '">My Collections</a></li>');
      $(fragment).append(
        '<li><a class="logout-link" href="https://{SERVICE_DOMAIN}/cgi/logout?'.replace(
          '{SERVICE_DOMAIN}',
          HT.service_domain,
        ) +
          window.location.href +
          '">Log out</a></li>',
      ); // $(html).appendTo($navbar);

      $navbar.find('#login-link').parent().remove();
      $navbar.append(fragment); // var $footer = $(".navbar.footer .navbar-inner");
      // html =
      //     '<ul class="nav">' +
      //         '<li><span>' + status.affiliation + '<br />Member, HathiTrust</span></li>' +
      //     '</ul>';
      // $(html).prependTo($footer);
    }

    var $logout_link = $('.logout-link,#logout-link');
    $logout_link.attr(
      'href',
      'https://{SERVICE_DOMAIN}/cgi/logout?'.replace('{SERVICE_DOMAIN}', HT.service_domain) +
        encodeURIComponent(window.location.href),
    );
    $('html').trigger('action.login');

    if (status.r) {
      // what is happening?
      var switchableRoles = ['enhancedTextProxy', 'totalAccess'];
      var switchableRolesLabels = {};
      switchableRolesLabels['enhancedTextProxy'] = 'ATRS';
      switchableRolesLabels['totalAccess'] = 'Admin';
      var $check = $('a.action-switch-role');

      if ($check.length == 0) {
        for (var i = 0; i < switchableRoles.length; i++) {
          var switchableRole = switchableRoles[i];

          if (status.r.hasOwnProperty(switchableRole)) {
            var $li = $('#person-nav li.item-vanishing');
            $li.removeClass('item-vanishing').addClass('x--of-for-narrowest');
            var $e = $li.find('span');
            var link_text = 'Member ⚡';

            if (status.r[switchableRole]) {
              // the role is active
              link_text = switchableRolesLabels[switchableRole] + ' ⚡';
              document.documentElement.dataset.activated = switchableRole;
            }

            $e = $e.replaceWith(
              '<a class="action-switch-role" href="https://'
                .concat(HT.service_domain, '/cgi/ping/switch?target=')
                .concat(encodeURIComponent(location.href), '">')
                .concat(link_text, '</a>'),
            );
          }
        }
      }
    } // hey do I have the AUP-checked cookie?

    insert_banner(
      'aup-alert-form',
      '<p>By logging into HathiTrust, you agree to follow our <a href="https://www.hathitrust.org/acceptable-use">Acceptable Use Policy.</a></p>',
      null,
      null,
      '<button class="btn" data-action="close">OK</button>',
    ); // insert_banner('usability-study-2019', '<p>Want to help improve our site? <a href="http://eepurl.com/gbk5Jb" target="_blank">Sign up for more information.</a></p>');
    // if ( location.pathname.indexOf('/cgi/pt') > -1 && status && status.affiliation.match(/Member|Faculty|Staff|Student|Employee|Alum/) ) {
    //     var possible_links = [];
    //     possible_links.push('https://t.maze.design/17978544');
    //     possible_links.push('https://t.maze.design/18239317');
    //     var date = new Date;
    //     var day = date.getDay();
    //     var week = getWeek(date);
    //     var link;
    //     if ( location.href.indexOf("debug=cta") > -1 || ( day >= 2 && day <= 6) ) {
    //         var idx = ( day == 6 ) ? 1 : ( day % 2 ); // Saturday acts like Friday
    //         if ( week % 2 == 0 ) { idx = ( ( day + 1 ) % 2 ); }
    //         link = possible_links[idx];
    //         insert_banner('usability-study-2020', `<p style="text-align: left">Help us improve our website! We're making changes to our download feature and would love to hear from you. Would you be willing to take a 10 minute survey? <a style="font-weight: bold" href="${link}" target="_blank">Yes, I want to help</a></p>`);
    //     }
    // }
  }

  function insert_banner(id, html, timestamped, callback, action) {
    if (head.mobile) {
      return;
    }

    if ($('.alert-banner').length) {
      // already have a banner, so don't do this one
      return;
    }

    var xtracking;

    var xupdate = function xupdate(id) {
      xtracking[id] = true;
      var expires = new Date();
      expires.setDate(expires.getDate() + 90);
      docCookies.setItem('HT.x', JSON.stringify(xtracking), expires, '/', '.hathitrust.org', true);
    };

    try {
      xtracking = JSON.parse(docCookies.getItem('HT.x') || '{}');
    } catch (e) {
      // just null the prefs
      docCookies.removeItem('HT.x');
      xtracking = {};
    }

    if (!timestamped) {
      // get any pre-existing localStorage value
      var check = xtracking[id] || localStorage.getItem('x:' + id);

      if (check) {
        return;
      }
    }

    var banner_html =
      '<div class="alert alert-block alert-banner"><a href="javascript:;" aria-label="Close banner" class="close" style="margin-right: 24px;"><i aria-hidden="true" class="icomoon icomoon-cancel"></i></a>' +
      html +
      '</div>';

    if (action) {
      banner_html = '<div class="alert alert-block alert-banner"><div>' + html + '</div>' + action + '</div>';
    }

    var $banner = $(banner_html);
    $banner.attr('id', id);
    var $target = $('#skiplinks');

    if (!$target.length) {
      $target = $('h1');
    }

    $banner.insertAfter($target);
    $banner.find('a[target]').on('click', function (event) {
      $banner.remove();

      if (!timestamped) {
        // localStorage.setItem('x:' + id, 'true');
        xupdate(id);
      }

      if (callback) {
        callback();
      }
    });
    $banner.find("a.close,[data-action='close']").on('click', function (event) {
      event.preventDefault();
      $banner.remove();

      if (callback) {
        callback();
      }

      if (!timestamped) {
        // localStorage.setItem('x:' + id, 'true');
        xupdate(id);
      }
    });
  }

  function track_event(status) {
    var action = 'visitor';
    var label = 'visitor';

    if (status.logged_in) {
      // action = "member";
      // label = status.authType;
      // if ( status.authType == 'cosign' && status.displayName.indexOf('@') > -1 ) {
      //     label = 'friend';
      // }
      label = status.institutionCode;
      action = status.affiliation.toLowerCase();

      if (status.mappedInstitutionCode) {
        label = status.mappedInstitutionCode + '/' + label;
      }
    }

    HT.analytics.trackEvent({
      category: 'userType',
      action: action,
      label: label,
    });
  }

  HT.login_callback = function (status) {
    console.log('AHOY LOGIN STATUS', status);

    if (status.logged_in) {
      setup_logged_in_state(status);
    } else {
      setup_login_link(status);
    }

    track_event(status);
    HT.analytics.waiting.login = false;
    HT.analytics.deQ(); // track the current page view

    if (!$('html').data('analytics-skip')) {
      HT.analytics.trackPageview(HT.analytics.getPageHref());
    }

    $('html').trigger('ht:login');

    if (
      false &&
      location.hostname.indexOf('www.hathitrust.org') > -1 &&
      sessionStorage.getItem('website-survey') != 'true'
    ) {
      insert_banner(
        'website-survey',
        '<p>Would you help us improve the HathiTrust website? <a xclass="btn btn-default" data-close-target=".modal.login" target="_blank" style="font-weight: bold" href="https://www.surveymonkey.com/r/2MV55VY">Take this survey!</a></p>',
        true,
        function () {
          sessionStorage.setItem('website-survey', true);
        },
      );
    }
  };

  if (HT.login_status) {
    // we already have the status
    console.log('AHOY have status', HT.login_status.logged_in);
    setTimeout(function () {
      HT.login_callback(HT.login_status);
    }, 0);
  } else {
    var args = {};

    if (document.referrer) {
      args.ref = document.referrer;
    }

    $.ajax({
      type: 'GET',
      url: PING_URL,
      data: args,
      async: true,
      jsonp: 'callback',
      dataType: 'jsonp',
      jsonpCallback: 'HT.login_callback',
    });
  } // $("body").on('click', '.trigger-login', function(e) {
  //     e.preventDefault();
  //     bootbox.hideAll();
  //     display_login_dialog({ $target: $(this), classname: 'login-centered' })
  // })
});
('use strict');

head.ready(function () {
  if ($('.nav .nav-link').length > 0) {
    return;
  }

  var DISMISS_EVENT = window.hasOwnProperty && window.hasOwnProperty('ontouchstart') ? 'touchstart' : 'mousedown';
  var $selected;
  var $menus = $('nav a.menu');
  var $about_menu = $('#about-menu');
  var $burger_menu = $('#burger-menu');
  $menus.on('click', function (e) {
    var $this = $(this);

    if ($this.css('opacity') == '0.75') {
      return;
    }

    var expanded = ($this.attr('aria-expanded') || 'false') == 'false' ? true : false;
    $this.attr('aria-expanded', expanded);
    $this.next().find('a[aria-expanded]').attr('aria-expanded', false);
  });
  $menus.each(function (index) {
    var $menu = $(this);
    var $container = $menu.parent();
    var $popup = $menu.next('ul');
    $container.data('menu', $menu);
    $container.data('selected_idx', -1);
    $container.on('keydown', function (event) {
      var $items = $popup.find("a[aria-hidden != 'true']");

      if ($container.data('menu').attr('aria-expanded') == 'false') {
        return;
      }

      var code = event.code;
      var selected_idx = $container.data('selected_idx');
      var delta = 0;

      if (code == 'ArrowDown') {
        delta = 1;
      } else if (code == 'ArrowUp') {
        delta = -1;
      } else if (code == 'Escape' || code == 'Tab') {
        $menu.attr('aria-expanded', false);
        $container.data('selected_index', -1);
        return; // toggle($popup, $menu, $link);
      } else {
        $container.data('selected_index', -1);
        return;
      }

      event.preventDefault();
      event.stopPropagation();

      if (delta == 0) {
        console.log('AHOY KEYCODE', code);
        return;
      }

      event.stopPropagation();
      selected_idx = (selected_idx + delta) % $items.length;

      if (selected_idx < 0) {
        selected_idx = $items.length - 1;
      }

      $selected = $items.slice(selected_idx, selected_idx + 1);
      $selected.focus(); // console.log("AHOY MENU KEYDOWN", selected_idx, $selected);

      $container.data('selected_idx', selected_idx);
    });
  });
  $(document).on('click', function (event) {
    var $target = $(event.target);

    if (!$target.parents('.menu').length) {
      $menus.attr('aria-expanded', false);
      return;
    }
  });

  var _resizeTimer;

  var _resizer = function _resizer() {
    $about_menu.attr('aria-hidden', $burger_menu.is(':visible'));

    if (_resizeTimer) {
      clearTimeout(_resizeTimer);
      _resizeTimer = null;
    }
  };

  $(window).on('resize', function () {
    if (_resizeTimer) {
      clearTimeout(_resizeTimer);
    }

    _resizeTimer = setTimeout(_resizer, 100);
  });
  setTimeout(_resizer, 500);
});
('use strict');

var HT = HT || {};
var $action;
var notificationData;
var dialogEl;

var openNotifications = function openNotifications() {
  if (notificationData == null || notificationData.length == 0) {
    return;
  }

  if (dialogEl === undefined) {
    var modal_html =
      '\n<div class="notifications-panel modal micromodal-slide" tabindex="-1" aria-hidden="true" id="notifications-modal">\n  <div class="modal__overlay" tabindex="-1" data-micromodal-close>\n    <div class="modal__container" role="dialog" aria-modal="true" aria-labelledby="notifications-modal-title">\n      <div class="notifications-panel-arrow"></div>\n      <div class="modal__header"><h2 class="modal__title" id="notifications-modal-title">Your notifications</h2><button class="modal__close" aria-label="Close" data-micromodal-close></button></div>\n      <div class="modal__content" id="notifications-modal-content">\n        <dl id="notifications-modal-description">\n        </dl>\n      </div>\n    </div>\n  </div>\n</div>\n    ';
    dialogEl = $(modal_html).appendTo('body').get(0);
    notificationData.forEach(function (datum) {
      var message;

      if (datum.message.indexOf('<p>') > -1) {
        message = datum.message + '<p>';
      } else {
        message = '<p>'.concat(datum.message, ' ');
      }

      message += '<a href="'.concat(datum.read_more_link, '">').concat(datum.read_more_label, '</a></p>');
      var notice_html = '<div>\n        <dt>'
        .concat(datum.title, '</dt>\n        <dd>\n          ')
        .concat(message, '\n        </dd>\n      </div>');
      $(notice_html).appendTo(dialogEl.querySelector('dl'));
    });
  } // why is this modal calculated by the right?

  var modalEl = dialogEl.querySelector('[aria-modal]');
  var leftX = $action.position().left - $(modalEl).width() + 150;
  var rightX = window.innerWidth - (leftX + $(modalEl).width());
  rightX += 2 * 16; // padding

  if (rightX < 0) {
    rightX = 0;
  }

  if (window.innerWidth - (rightX + $(modalEl).width()) < 0) {
    rightX = 0;
  }

  dialogEl.style.setProperty('--right-x', rightX);
  $action.get(0).dataset.active = 'true';
  bootbox.show('notifications-modal', {
    onClose: function onClose(modal) {
      docCookies.setItem('HT.notice', notificationData[0].effective_on, null, '/', '.hathitrust.org', true); // localStorage.setItem('ht.notification', notificationData[0].effective_on);
    },
  });
};

head.ready(function () {
  $action = $('.action-toggle-notifications');

  if (!$action.get(0)) {
    return;
  }

  $('html').on('ht:login', function (event) {
    // console.log("AHOY WE ARE LOGGED IN");
    notificationData = HT.login_status.notificationData;

    if (notificationData == null || notificationData.length == 0) {
      return;
    }

    $action.prop('disabled', false);
    var notificationTimestamp = notificationData[0].effective_on;
    var lastNotificationTimestamp = docCookies.getItem('HT.notice'); // let lastNotificationTimestamp = localStorage.getItem('ht.notification');
    // console.log("-- notification timestamp", notificationTimestamp, lastNotificationTimestamp, lastNotificationTimestamp != notificationTimestamp);

    if (lastNotificationTimestamp != notificationTimestamp) {
      // automatically open if there are unseen notifications
      openNotifications();
    }

    $action.on('click', function (event) {
      openNotifications();
    });
  });
});
('use strict');

head.ready(function () {
  if (!$('html').data('use') == 'search') {
    return;
  }

  var $body = $('body');
  var $sidebar = $('#sidebar');
  var $section = $('#section');

  var get_href = function get_href(href) {
    if (href.indexOf(location.host) < 0) {
      href = ''.concat(location.protocol, '//').concat(location.host).concat(href);
    }

    return href;
  };

  $sidebar.on('click keydown', '.show-all-button', function (event) {
    if (event.type == 'keydown' && event.keyCode != 32) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    var $this = $(this);
    var $list = $this.parent().parent();
    $list.toggleClass('filter-list--expanded');
  });
  $('body').on('click keydown', 'button[data-href],label[data-href]', function (event) {
    if (event.type == 'keydown' && event.keyCode != 32) {
      return;
    }

    if (this.tagName == 'SELECT') {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    var href = get_href($(this).data('href'));
    location.href = href;
  });
  $sidebar.on('keydown', '[role="radio"]', function (event) {
    if (event.type == 'keydown' && !(event.key == 'ArrowUp' || event.key == 'ArrowDown')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    var delta = 0;

    if (event.key == 'ArrowUp') {
      delta = -1;
    } else {
      delta = 1;
    }

    var $this = $(this);
    var $group = $this.parents('[role=radiogroup]');
    var $items = $group.find('[role=radio]:not(:disabled)');
    var index = $items.index($this);
    var next_index = (index + delta) % $items.length;
    var $selected = $items.slice(next_index, next_index + 1);
    $selected.click(); // $selected.get(0).focus();
  }); // $sidebar.on('click keydown', '.filter-group-toggle-show-button', function(event) {

  $('body').on('click keydown', '.sidebar-container .filter-group-toggle-show-button', function (event) {
    if (event.type == 'keydown' && !(event.keyCode == 32 || event.key == 'Enter')) {
      return;
    }

    event.preventDefault();
    event.stopPropagation();
    var $this = $(this);
    $this.attr('aria-expanded', !($this.attr('aria-expanded') == 'true')); // and then update the icon

    var xlink_href;

    if ($this.attr('aria-expanded') == 'true') {
      xlink_href = '#panel-expanded';
    } else {
      xlink_href = '#panel-collapsed';
    }

    $this.find('svg use').attr('xlink:href', xlink_href);
    $this.trigger('clicked');
  });
  $section.on('change', 'select[data-href]', function (event) {
    event.preventDefault();
    event.stopPropagation();
    var $this = $(this);
    var href = get_href($this.data('href'));
    var value = $this.val();
    location.href = href + value;
  }); // $(".sidebar-toggle-button").on('clicked', function() {

  $('body').on('clicked', '.sidebar-toggle-button', function () {
    // $sidebar.css('overflow', $(this).attr('aria-expanded') == 'true' ? 'auto' : 'hidden');
    document.documentElement.dataset.sidebarExpanded = $(this).attr('aria-expanded') == 'true';
  });
  var num_checked = $sidebar.find("button[aria-checked='true']").length + $('.active-filter-item').length;
  $('.total-filter-count').text(' ('.concat(num_checked, ')'));
  $("ul[role='radiogroup'] > li").attr('role', 'presentation');
});
('use strict');

head.ready(function () {
  if (!HT.is_dev) {
    return;
  }

  $('a').each(function () {
    var $link = $(this);
    var href = $link.attr('href');

    if (!href) {
      // no op
      return;
    } else if (href.indexOf('www.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*www.hathitrust.org/, HT.www_domain);
    } else if (href.indexOf('babel.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*babel.hathitrust.org/, HT.service_domain);
    } else if (href.indexOf('catalog.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*catalog.hathitrust.org/, HT.catalog_domain);
    } else if (href.indexOf('/hdl.handle.net') > -1) {
      // e.g. https://hdl.handle.net/2027/uc2.ark:/13960/t9s19288f
      // var tmp = href.split("/");
      // href = "http:/" + babel_string + "/cgi/pt?id=" + tmp.pop();
      // href = href.replace("//hdl.handle.net/2027/", "//" + HT.service_domain + "/cgi/pt?id=");
      var tmp = href.split('?');
      href = tmp[0].replace('//hdl.handle.net/2027/', '//' + HT.service_domain + '/cgi/pt?id=');

      if (tmp[1]) {
        var tmp2 = tmp[1].split('=');
        href += ';seq=' + tmp2[2];
      }
    }

    $link.attr('href', href.replace('https:', location.protocol));
  });
  $('form[action]').each(function () {
    var $form = $(this);
    var action = $form.attr('action');

    if (!action) {
      // no op
      return;
    } else if (action.indexOf('babel.hathitrust.org') > -1) {
      action = action.replace(/[\w-\.]*babel.hathitrust.org/, HT.service_domain);
    } else if (action.indexOf('catalog.hathitrust.org') > -1) {
      action = action.replace(/[\w-\.]*catalog.hathitrust.org/, HT.catalog_domain);
    }

    $form.attr('action', action.replace('https:', location.protocol));
  });
  $('[data-href]').each(function () {
    var $link = $(this);
    var href = $link.data('href');

    if (!href) {
      // no op
      return;
    } else if (href.indexOf('www.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*www.hathitrust.org/, HT.www_domain);
    } else if (href.indexOf('babel.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*babel.hathitrust.org/, HT.service_domain);
    } else if (href.indexOf('catalog.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*catalog.hathitrust.org/, HT.catalog_domain);
    } else if (href.indexOf('/hdl.handle.net') > -1) {
      // e.g. https://hdl.handle.net/2027/uc2.ark:/13960/t9s19288f
      // var tmp = href.split("/");
      // href = "http:/" + babel_string + "/cgi/pt?id=" + tmp.pop();
      var tmp = href.split('?');
      href = tmp[0].replace('//hdl.handle.net/2027/', '//' + HT.service_domain + '/cgi/pt?id=');

      if (tmp[1]) {
        var tmp2 = tmp[1].split('=');
        href += ';seq=' + tmp2[2];
      }
    }

    $link.data('href', href.replace('https:', location.protocol));
  });
  $('[src]').each(function () {
    var $link = $(this);
    var href = $link.attr('src');

    if (!href) {
      // no op
      return;
    } else if (href.indexOf('www.hathitrust.org') > -1) {
      // $link.attr("src", href.replace(/[\w-\.]*www.hathitrust.org/, HT.www_domain));
    } else if (href.indexOf('babel.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*babel.hathitrust.org/, HT.service_domain);
    } else if (href.indexOf('catalog.hathitrust.org') > -1) {
      href = href.replace(/[\w-\.]*catalog.hathitrust.org/, HT.catalog_domain);
    } else if (href.indexOf('/hdl.handle.net') > -1) {
      // e.g. https://hdl.handle.net/2027/uc2.ark:/13960/t9s19288f
      // var tmp = href.split("/");
      // href = "http:/" + babel_string + "/cgi/pt?id=" + tmp.pop();
      href = href.replace('//hdl.handle.net/2027/', '//' + HT.service_domain + '/cgi/pt?id=');
    }

    $link.attr('src', href.replace('https:', location.protocol));
  });
});
('use strict');

// Settings:
// Timeout to hide tooltip
var TIMEOUT_LENGTH = 500;
var ACTIVE_TIMEOUT_LENGTH = 1500; // global timeout map; quick n dirty

var timeouts = new WeakMap(); // if the user actively dismisses a tooltip, save that setting
// and do not show the tooltip again

var dismissals = new WeakMap();
var initialized = new WeakMap();
var TOOLTIP_OPTION = 'tooltip'; // 'humane'

var idx = 0;
var messageIdx = 0;

function initTooltipHumane(tooltipContainer) {
  var trigger = tooltipContainer;
  var tooltip = trigger;
  tooltipContainer.addEventListener('mouseover', function () {
    showTooltipHumane(tooltip);
  });
  trigger.addEventListener('focus', function () {
    showTooltipHumane(tooltip);
  });
  trigger.addEventListener('click', function () {
    timeoutTooltipHumane(tooltip, ACTIVE_TIMEOUT_LENGTH);
  });
  tooltipContainer.addEventListener('mouseleave', function () {
    timeoutTooltipHumane(tooltip);
  });
  trigger.addEventListener('blur', function () {
    hideTooltipHumane(tooltip);
  });
} // here we attach all event listeners to control the tooltip

function initTooltip(tooltipContainer) {
  // const trigger = tooltipContainer.classList.contains('tooltip-trigger') ? tooltipContainer : tooltipContainer.querySelector('.tooltip-trigger');
  var trigger = tooltipContainer;
  var tooltip = trigger.querySelector('.offscreen');
  trigger.dataset.constructing = tooltip == null;

  if (!tooltip) {
    tooltip = document.createElement('div');
  } else {
    trigger.setAttribute('aria-label', $.trim(tooltip.innerText));
  }

  initialized.set(trigger, true);
  tooltip.classList.add('tooltip');
  tooltip.classList.remove('offscreen');
  tooltip.classList.add(trigger.dataset.microtipPosition || 'bottom');
  tooltip.style.display = 'none';
  tooltip.setAttribute('aria-hidden', 'true');
  idx += 1;
  tooltip.setAttribute('id', 'tooltip'.concat(idx));

  if (trigger.dataset.constructing == 'true') {
    trigger.appendChild(tooltip);
    tooltip.innerText = trigger.getAttribute('aria-label');
  } // // show tooltip on hover and focus
  // tooltipContainer.addEventListener('mouseover', () => {
  //   showTooltip(tooltip);
  // });
  // trigger.addEventListener('focus', () => {
  //   showTooltip(tooltip);
  // });
  // // trigger.addEventListener('click', () => {
  // //   timeoutTooltip(tooltip, ACTIVE_TIMEOUT_LENGTH);
  // // });
  // // hide tooltip on mouse out and blur
  // // use timeout on mouse leave
  // tooltipContainer.addEventListener('mouseleave', () => {
  //   timeoutTooltip(tooltip);
  // });
  // trigger.addEventListener('blur', () => {
  //   hideTooltip(tooltip);
  // });
  // // hide the tooltip on escape key press
  // trigger.addEventListener('keydown', (event) => {
  //   if (event.key === 'Escape') {
  //     hideTooltip(tooltip);
  //     // save dismissal
  //     dismissals.set(tooltip, true);
  //   }
  // });
  // create a close button for pointer dismissal

  var closeBtn = document.createElement('button');
  closeBtn.innerHTML = '';
  closeBtn.tabIndex = -1;
  closeBtn.setAttribute('aria-label', 'Close');
  closeBtn.setAttribute('aria-hidden', 'true');
  closeBtn.classList.add('tooltip__close');
  tooltip.appendChild(closeBtn);
  closeBtn.addEventListener('click', function (event) {
    event.preventDefault();
    event.stopPropagation();
    hideTooltip(tooltip); // save dismissal

    dismissals.set(tooltip, true);
  }); // hide the tooltip in here so they show up without JS on
  // debateably useful

  tooltip.style.display = 'none';
}

function showTooltipHumane(tooltip) {
  messageIdx += 1;

  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  }

  message.innerText = tooltip.getAttribute('aria-label');
  message.style.display = 'block';
}

var timeoutId;

function hideTooltipHumane(tooltip) {
  message.style.display = 'none';
}

function showTooltip(tooltip) {
  // do not show if tooltip has been dismissed
  if (dismissals.has(tooltip)) {
    return false;
  } // hide all the other tooltips pronto

  document.querySelectorAll('.tooltip[data-active="true"]').forEach(function (node) {
    node.style.display = 'none';
    node.dataset.active = false;
  });
  var trigger = tooltip.parentNode;
  var bounds = trigger.getBoundingClientRect();

  if (tooltip.classList.contains('left')) {
    tooltip.style.top = ''.concat(bounds.top, 'px'); // tooltip.style.left = `${( bounds.left - $(tooltip).width() ) - (bounds.width / 2)}px`;

    tooltip.style.right = ''.concat((window.innerWidth - bounds.left) * 1.05, 'px');
  } else if (tooltip.classList.contains('bottom')) {
    tooltip.style.top = ''.concat((bounds.top + bounds.height) * 1.025, 'px');
    tooltip.style.left = ''.concat(bounds.left - bounds.width / 2, 'px');
  } else if (tooltip.classList.contains('top')) {
    tooltip.style.top = ''.concat((bounds.top - bounds.height) * 0.995, 'px');
    tooltip.style.left = ''.concat(bounds.left - bounds.width / 2, 'px');
  }

  tooltip.style.display = 'block';
  tooltip.dataset.active = true; // tooltip.removeAttribute('aria-hidden');
  // if a hide timeout exists for this tooltip, clear it

  if (timeouts.has(tooltip)) {
    window.clearTimeout(timeouts.get(tooltip));
  }
}

function hideTooltip(tooltip) {
  tooltip.style.display = 'none';
  tooltip.setAttribute('aria-hidden', 'true');
  tooltip.dataset.active = false;
}

function timeoutTooltipHumane(tooltip, duration) {
  if (!duration) {
    duration = TIMEOUT_LENGTH;
  }

  messageIdx -= 1;

  if (timeoutId) {
    clearTimeout(timeoutId);
    timeoutId = null;
  } // hide the tooltip after a set amount of time

  timeoutId = window.setTimeout(function () {
    hideTooltipHumane(tooltip);
  }, TIMEOUT_LENGTH); // store the timeout so it can be cleared

  timeouts.set(tooltip, timeoutId);
}

function timeoutTooltip(tooltip) {
  if (!tooltip) {
    return;
  }

  var timeoutId = window.setTimeout(function () {
    hideTooltip(tooltip);
  }, TIMEOUT_LENGTH);
  timeouts.set(tooltip, timeoutId);
}

head.ready(function () {
  // initiate tooltips
  if (TOOLTIP_OPTION == 'humane') {
    message = document.createElement('div');
    message.classList.add('uber-tooltip');
    message.style.display = 'none';
    document.body.appendChild(message);
  } // setTimeout(() => {
  //   const tooltips = document.querySelectorAll('[data-role="tooltip"]');
  //   console.log("AHOY TOOLTIPS INIT", tooltips);
  //   tooltips.forEach((tooltip) => {
  //     if ( TOOLTIP_OPTION == 'tooltip' ) {
  //       initTooltip(tooltip);
  //     } else {
  //       initTooltipHumane(tooltip);
  //     }
  //   });
  // }, 500);
  // mouseover
  // mouseleave
  // focus
  // keydown
  // show tooltip on hover and focus

  document.body.addEventListener(
    'mouseenter',
    function (event) {
      if (!event.target.matches) {
        return;
      }

      if (!event.target.matches('[data-role="tooltip"]')) {
        return;
      }

      if (!initialized.has(event.target)) {
        initTooltip(event.target);
      }

      showTooltip(event.target.querySelector('.tooltip'));
    },
    true,
  );
  document.body.addEventListener('focusin', function (event) {
    if (!event.target.matches) {
      return;
    }

    if (!event.target.matches('[data-role="tooltip"]')) {
      return;
    }

    if (!initialized.has(event.target)) {
      initTooltip(event.target);
    }

    showTooltip(event.target.querySelector('.tooltip'));
  }); // hide tooltip on mouse out and blur
  // use timeout on mouse leave

  document.body.addEventListener(
    'mouseleave',
    function (event) {
      if (!event.target.matches) {
        return;
      }

      if (!event.target.matches('[data-role="tooltip"]')) {
        return;
      }

      if (!initialized.has(event.target)) {
        return;
      }

      timeoutTooltip(event.target.querySelector('.tooltip'));
    },
    true,
  );
  document.body.addEventListener('blur', function (event) {
    if (!event.target.matches) {
      return;
    }

    if (!event.target.matches('[data-role="tooltip"]')) {
      return;
    }

    if (!initialized.has(event.target)) {
      return;
    }

    hideTooltip(event.target.querySelector('.tooltip'));
  });
  document.body.addEventListener('focusout', function (event) {
    if (!event.target.matches) {
      return;
    }

    if (!event.target.matches('[data-role="tooltip"]')) {
      return;
    }

    if (!initialized.has(event.target)) {
      return;
    }

    hideTooltip(event.target.querySelector('.tooltip'));
  }); // hide the tooltip on escape key press

  document.addEventListener('keydown', function (event) {
    if (!event.target.matches) {
      return;
    }

    if (!event.target.matches('[data-role="tooltip"]')) {
      return;
    }

    if (!initialized.has(event.target)) {
      return;
    }

    if (event.key === 'Escape') {
      hideTooltip(event.target.querySelector('.tooltip')); // save dismissal

      dismissals.set(event.target.querySelector('.tooltip'), true);
    }
  });
});
//# sourceMappingURL=maps/utils.bundle.js.map
