'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/*
 * JQuery URL Parser plugin, v2.2.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */

;(function (factory) {
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
		link: 'href'
	},
	    key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'],
	    // keys available to query

	aliases = { 'anchor': 'fragment' },
	    // aliases for backwards compatability

	parser = {
		strict: /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/, //less intuitive, more accurate to the specs
		loose: /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
	},
	    toString = Object.prototype.toString,
	    isint = /^[0-9]+$/;

	function parseUri(url, strictMode) {
		var str = decodeURI(url),
		    res = parser[strictMode || false ? 'strict' : 'loose'].exec(str),
		    uri = { attr: {}, param: {}, seg: {} },
		    i = 14;

		while (i--) {
			uri.attr[key[i]] = res[i] || '';
		}

		// build query and fragment parameters		
		uri.param['query'] = parseString(uri.attr['query']);
		uri.param['fragment'] = parseString(uri.attr['fragment']);

		// split path and fragement into segments		
		uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g, '').split('/');
		uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g, '').split('/');

		// compile a 'base' domain attribute        
		uri.attr['base'] = uri.attr.host ? (uri.attr.protocol ? uri.attr.protocol + '://' + uri.attr.host : uri.attr.host) + (uri.attr.port ? ':' + uri.attr.port : '') : '';

		return uri;
	};

	function getAttrName(elm) {
		var tn = elm.tagName;
		if (typeof tn !== 'undefined') return tag2attr[tn.toLowerCase()];
		return tn;
	}

	function promote(parent, key) {
		if (parent[key].length == 0) return parent[key] = {};
		var t = {};
		for (var i in parent[key]) {
			t[i] = parent[key][i];
		}parent[key] = t;
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
			var obj = parent[key] = parent[key] || [];
			if (']' == part) {
				if (isArray(obj)) {
					if ('' != val) obj.push(val);
				} else if ('object' == (typeof obj === 'undefined' ? 'undefined' : _typeof(obj))) {
					obj[keys(obj).length] = val;
				} else {
					obj = parent[key] = [parent[key], val];
				}
			} else if (~part.indexOf(']')) {
				part = part.substr(0, part.length - 1);
				if (!isint.test(part) && isArray(obj)) obj = promote(parent, key);
				parse(parts, obj, part, val);
				// key
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
				}parent.base = t;
			}
			set(parent.base, key, val);
		}
		return parent;
	}

	function parseString(str) {
		return reduce(String(str).split(/&|;/), function (ret, pair) {
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

			if ('' == key) key = pair, val = '';

			return merge(ret, key, val);
		}, { base: {} }).base;
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
		return Object.prototype.toString.call(vArg) === "[object Array]";
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
			}

		};
	};

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
"use strict";

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

/**
 * @overview better-dom: Live extension playground
 * @version 2.1.1 Tue, 16 Dec 2014 14:27:26 GMT
 * @copyright 2013-2014 Maksim Chemerisuk
 * @license MIT
 * @see https://github.com/chemerisuk/better-dom
 */
(function () {
    "use strict";
    var SLICE$0 = Array.prototype.slice;
    var WINDOW = window;
    var DOCUMENT = document;
    var HTML = DOCUMENT.documentElement;

    var userAgent = WINDOW.navigator.userAgent;
    var jscriptVersion = WINDOW.ScriptEngineMajorVersion;

    var JSCRIPT_VERSION = jscriptVersion && jscriptVersion();
    var LEGACY_ANDROID = ~userAgent.indexOf("Android") && userAgent.indexOf("Chrome") < 0;
    var WEBKIT_PREFIX = WINDOW.WebKitAnimationEvent ? "-webkit-" : "";
    var CUSTOM_EVENT_TYPE = "dataavailable";

    function $NullElement() {}

    function $Element(node) {
        if (this instanceof $Element) {
            if (node) {
                // use a generated property to store a reference
                // to the wrapper for circular object binding
                node["__2001001__"] = this;

                this[0] = node;
                this._ = {
                    "handler2001001": [],
                    "watcher2001001": {},
                    "extension2001001": [],
                    "context2001001": {}
                };
            }
        } else if (node) {
            var cached = node["__2001001__"];
            // create a wrapper only once for each native element
            return cached ? cached : new $Element(node);
        } else {
            return new $NullElement();
        }
    }

    $Element.prototype = {
        constructor: function constructor(node) {
            // filter non elements like text nodes, comments etc.
            return $Element(node && node.nodeType === 1 ? node : null);
        },
        toString: function toString() {
            var node = this[0];

            return node ? "<" + node.tagName.toLowerCase() + ">" : "";
        },
        version: "2.1.1"
    };

    $NullElement.prototype = new $Element();

    function $Document(node) {
        if (node && node.nodeType === 9) {
            node = node.documentElement;
        }

        $Element.call(this, node);
    }

    $Document.prototype = new $Element();

    var DOM = new $Document(DOCUMENT);

    var util$index$$arrayProto = Array.prototype;

    var util$index$$default = {
        computeStyle: function computeStyle(node) {
            if (JSCRIPT_VERSION < 9) {
                return node.currentStyle;
            } else {
                return node.ownerDocument.defaultView.getComputedStyle(node);
            }
        },
        injectElement: function injectElement(node) {
            if (node && node.nodeType === 1) {
                return node.ownerDocument.getElementsByTagName("head")[0].appendChild(node);
            }
        },
        // utilites
        every: util$index$$arrayProto.every,
        each: util$index$$arrayProto.forEach,
        filter: util$index$$arrayProto.filter,
        map: util$index$$arrayProto.map,
        slice: util$index$$arrayProto.slice,
        isArray: Array.isArray,
        keys: Object.keys,
        safeCall: function safeCall(context, fn, arg1, arg2) {
            if (typeof fn === "string") fn = context[fn];

            try {
                return fn.call(context, arg1, arg2);
            } catch (err) {
                WINDOW.setTimeout(function () {
                    throw err;
                }, 1);

                return false;
            }
        },
        register: function register(mixins, defaultBehavior) {
            defaultBehavior = defaultBehavior || function () {};

            Object.keys(mixins).forEach(function (key) {
                var defaults = defaultBehavior(key) || function () {
                    return this;
                };

                $Element.prototype[key] = mixins[key];
                $NullElement.prototype[key] = defaults;
            });
        },
        getLegacyFile: function getLegacyFile(type) {
            if (JSCRIPT_VERSION < 10) {
                var legacyScripts = util$index$$arrayProto.filter.call(DOCUMENT.scripts, function (el) {
                    return el.src.indexOf("better-dom-legacy.js") >= 0;
                });

                if (legacyScripts.length < 1) {
                    throw new Error("In order to use live extensions in IE < 10 you have to include extra files. See https://github.com/chemerisuk/better-dom#notes-about-old-ies for details.");
                }

                return legacyScripts[0].src.replace(".js", "." + type);
            }
        }
    };

    // customized errors

    function errors$$MethodError(methodName, args) {
        var type = arguments[2];if (type === void 0) type = "$Element";
        var url = "http://chemerisuk.github.io/better-dom/" + type + ".html#" + methodName,
            line = "invalid call `" + type + (type === "DOM" ? "." : "#") + methodName + "(";

        line += util$index$$default.map.call(args, function (arg) {
            return String(arg);
        }).join(", ") + ")`;";

        this.message = line + " check " + url + " to verify the function arguments";
    }

    errors$$MethodError.prototype = new TypeError();

    function errors$$StaticMethodError(methodName, args) {
        errors$$MethodError.call(this, methodName, args, "DOM");
    }

    errors$$StaticMethodError.prototype = new TypeError();

    var // operator type / priority object
    global$emmet$$operators = { "(": 1, ")": 2, "^": 3, ">": 4, "+": 5, "*": 6, "`": 7, "[": 8, ".": 8, "#": 8 },
        global$emmet$$reParse = /`[^`]*`|\[[^\]]*\]|\.[^()>^+*`[#]+|[^()>^+*`[#.]+|\^+|./g,
        global$emmet$$reAttr = /\s*([\w\-]+)(?:=((?:`([^`]*)`)|[^\s]*))?/g,
        global$emmet$$reIndex = /(\$+)(?:@(-)?(\d+)?)?/g,
        global$emmet$$reDot = /\./g,
        global$emmet$$reDollar = /\$/g,
        global$emmet$$tagCache = { "": "" },
        global$emmet$$normalizeAttrs = function global$emmet$$normalizeAttrs(_, name, value, rawValue) {
        // try to detemnie which kind of quotes to use
        var quote = value && value.indexOf("\"") >= 0 ? "'" : "\"";

        if (typeof rawValue === "string") {
            // grab unquoted value for smart quotes
            value = rawValue;
        } else if (typeof value !== "string") {
            // handle boolean attributes by using name as value
            value = name;
        }
        // always wrap attribute values with quotes even they don't exist
        return " " + name + "=" + quote + value + quote;
    },
        global$emmet$$injectTerm = function global$emmet$$injectTerm(term, end) {
        return function (html) {
            // find index of where to inject the term
            var index = end ? html.lastIndexOf("<") : html.indexOf(">");
            // inject the term into the HTML string
            return html.slice(0, index) + term + html.slice(index);
        };
    },
        global$emmet$$makeTerm = function global$emmet$$makeTerm(tag) {
        return global$emmet$$tagCache[tag] || (global$emmet$$tagCache[tag] = "<" + tag + "></" + tag + ">");
    },
        global$emmet$$makeIndexedTerm = function global$emmet$$makeIndexedTerm(n, term) {
        var result = Array(n),
            i;

        for (i = 0; i < n; ++i) {
            result[i] = term.replace(global$emmet$$reIndex, function (expr, fmt, sign, base) {
                var index = (sign ? n - i - 1 : i) + (base ? +base : 1);
                // handle zero-padded index values, like $$$ etc.
                return (fmt + index).slice(-fmt.length).replace(global$emmet$$reDollar, "0");
            });
        }

        return result;
    },
        global$emmet$$reUnsafe = /[&<>"']/g,

    // http://stackoverflow.com/questions/6234773/can-i-escape-html-special-chars-in-javascript
    global$emmet$$safeSymbol = { "&": "&amp;", "<": "&lt;", ">": "&gt;", "\"": "&quot;", "'": "&#039;" };

    // populate empty tag names with result
    "area base br col hr img input link meta param command keygen source".split(" ").forEach(function (tag) {
        global$emmet$$tagCache[tag] = "<" + tag + ">";
    });

    DOM.emmet = function (template, varMap) {
        var $D$0;var $D$1;var $D$2;
        if (typeof template !== "string") throw new errors$$StaticMethodError("emmet", arguments);

        if (varMap) template = DOM.format(template, varMap);

        if (template in global$emmet$$tagCache) {
            return global$emmet$$tagCache[template];
        }

        // transform template string into RPN

        var stack = [],
            output = [];

        $D$2 = template.match(global$emmet$$reParse);$D$0 = 0;$D$1 = $D$2.length;for (var str; $D$0 < $D$1;) {
            str = $D$2[$D$0++];
            var op = str[0];
            var priority = global$emmet$$operators[op];

            if (priority) {
                if (str !== "(") {
                    // for ^ operator need to skip > str.length times
                    for (var i = 0, n = op === "^" ? str.length : 1; i < n; ++i) {
                        while (stack[0] !== op && global$emmet$$operators[stack[0]] >= priority) {
                            var head = stack.shift();

                            output.push(head);
                            // for ^ operator stop shifting when the first > is found
                            if (op === "^" && head === ">") break;
                        }
                    }
                }

                if (str === ")") {
                    stack.shift(); // remove "(" symbol from stack
                } else {
                    // handle values inside of `...` and [...] sections
                    if (op === "[" || op === "`") {
                        output.push(str.slice(1, -1));
                    }
                    // handle multiple classes, e.g. a.one.two
                    if (op === ".") {
                        output.push(str.slice(1).replace(global$emmet$$reDot, " "));
                    }

                    stack.unshift(op);
                }
            } else {
                output.push(str);
            }
        };$D$0 = $D$1 = $D$2 = void 0;

        output = output.concat(stack);

        // transform RPN into html nodes

        stack = [];

        $D$0 = 0;$D$1 = output.length;for (var str$0; $D$0 < $D$1;) {
            str$0 = output[$D$0++];
            if (str$0 in global$emmet$$operators) {
                var value = stack.shift();
                var node = stack.shift();

                if (typeof node === "string") {
                    node = [global$emmet$$makeTerm(node)];
                }

                switch (str$0) {
                    case ".":
                        value = global$emmet$$injectTerm(" class=\"" + value + "\"");
                        break;

                    case "#":
                        value = global$emmet$$injectTerm(" id=\"" + value + "\"");
                        break;

                    case "[":
                        value = global$emmet$$injectTerm(value.replace(global$emmet$$reAttr, global$emmet$$normalizeAttrs));
                        break;

                    case "*":
                        node = global$emmet$$makeIndexedTerm(+value, node.join(""));
                        break;

                    case "`":
                        stack.unshift(node);
                        // escape unsafe HTML symbols
                        node = [value.replace(global$emmet$$reUnsafe, function (ch) {
                            return global$emmet$$safeSymbol[ch];
                        })];
                        break;

                    default:
                        value = typeof value === "string" ? global$emmet$$makeTerm(value) : value.join("");

                        if (str$0 === ">") {
                            value = global$emmet$$injectTerm(value, true);
                        } else {
                            node.push(value);
                        }
                }

                str$0 = typeof value === "function" ? node.map(value) : node;
            }

            stack.unshift(str$0);
        };$D$0 = $D$1 = void 0;

        if (output.length === 1) {
            // handle single tag case
            output = global$emmet$$makeTerm(stack[0]);
        } else {
            output = stack[0].join("");
        }

        return output;
    };

    var global$emmet$$default = global$emmet$$tagCache;

    var document$create$$makeMethod = function document$create$$makeMethod(all) {
        return function (value, varMap) {
            var doc = this[0].ownerDocument,
                sandbox = this._["sandbox2001001"];

            if (!sandbox) {
                sandbox = doc.createElement("div");
                this._["sandbox2001001"] = sandbox;
            }

            var nodes, el;

            if (value && value in global$emmet$$default) {
                nodes = doc.createElement(value);

                if (all) nodes = [new $Element(nodes)];
            } else {
                value = value.trim();

                if (value[0] === "<" && value[value.length - 1] === ">") {
                    value = varMap ? DOM.format(value, varMap) : value;
                } else {
                    value = DOM.emmet(value, varMap);
                }

                sandbox.innerHTML = value; // parse input HTML string

                for (nodes = all ? [] : null; el = sandbox.firstChild;) {
                    sandbox.removeChild(el); // detach element from the sandbox

                    if (el.nodeType === 1) {
                        if (all) {
                            nodes.push(new $Element(el));
                        } else {
                            nodes = el;

                            break; // stop early, because need only the first element
                        }
                    }
                }
            }

            return all ? nodes : $Element(nodes);
        };
    };

    $Document.prototype.create = document$create$$makeMethod("");

    $Document.prototype.createAll = document$create$$makeMethod("All");

    $Document.prototype.importScripts = function () {
        var urls = SLICE$0.call(arguments, 0);
        var doc = this[0].ownerDocument;

        var callback = function callback() {
            var arg = urls.shift(),
                argType = typeof arg === "undefined" ? "undefined" : _typeof(arg),
                script;

            if (argType === "string") {
                script = doc.createElement("script");
                script.src = arg;
                script.onload = callback;
                script.async = true;

                util$index$$default.injectElement(script);
            } else if (argType === "function") {
                arg();
            } else if (arg) {
                throw new errors$$StaticMethodError("importScripts", arguments);
            }
        };

        callback();
    };

    $Document.prototype.importStyles = function (selector, cssText) {
        var styleSheet = this._["styles2001001"];

        if (!styleSheet) {
            var doc = this[0].ownerDocument,
                styleNode = util$index$$default.injectElement(doc.createElement("style"));

            styleSheet = styleNode.sheet || styleNode.styleSheet;
            // store object internally
            this._["styles2001001"] = styleSheet;
        }

        if (typeof selector !== "string" || typeof cssText !== "string") {
            throw new errors$$StaticMethodError("importStyles", arguments);
        }

        // insert rules one by one because of several reasons:
        // 1. IE8 does not support comma in a selector string
        // 2. if one selector fails it doesn't break others
        selector.split(",").forEach(function (selector) {
            try {
                if (styleSheet.cssRules) {
                    styleSheet.insertRule(selector + "{" + cssText + "}", styleSheet.cssRules.length);
                } else if (selector[0] !== "@") {
                    styleSheet.addRule(selector, cssText);
                } else {
                    // addRule doesn't support at-rules, use cssText instead
                    styleSheet.cssText += selector + "{" + cssText + "}";
                }
            } catch (err) {
                // silently ignore invalid rules
            }
        });
    };

    // Helper for css selectors

    var util$selectormatcher$$rquickIs = /^(\w*)(?:#([\w\-]+))?(?:\[([\w\-\=]+)\])?(?:\.([\w\-]+))?$/,
        util$selectormatcher$$propName = "m oM msM mozM webkitM".split(" ").reduce(function (result, prefix) {
        var propertyName = prefix + "atchesSelector";

        return result || HTML[propertyName] && propertyName;
    }, null);

    var util$selectormatcher$$default = function util$selectormatcher$$default(selector, context) {
        if (typeof selector !== "string") return null;

        var quick = util$selectormatcher$$rquickIs.exec(selector);

        if (quick) {
            // Quick matching is inspired by jQuery:
            //   0  1    2   3          4
            // [ _, tag, id, attribute, class ]
            if (quick[1]) quick[1] = quick[1].toLowerCase();
            if (quick[3]) quick[3] = quick[3].split("=");
            if (quick[4]) quick[4] = " " + quick[4] + " ";
        }

        return function (node) {
            var $D$3;var $D$4;
            var result, found;
            if (!quick && !util$selectormatcher$$propName) {
                found = (context || node.ownerDocument).querySelectorAll(selector);
            }

            for (; node && node.nodeType === 1; node = node.parentNode) {
                if (quick) {
                    result = (!quick[1] || node.nodeName.toLowerCase() === quick[1]) && (!quick[2] || node.id === quick[2]) && (!quick[3] || (quick[3][1] ? node.getAttribute(quick[3][0]) === quick[3][1] : node.hasAttribute(quick[3][0]))) && (!quick[4] || (" " + node.className + " ").indexOf(quick[4]) >= 0);
                } else {
                    if (util$selectormatcher$$propName) {
                        result = node[util$selectormatcher$$propName](selector);
                    } else {
                        $D$3 = 0;$D$4 = found.length;for (var n; $D$3 < $D$4;) {
                            n = found[$D$3++];
                            if (n === node) return n;
                        };$D$3 = $D$4 = void 0;
                    }
                }

                if (result || !context || node === context) break;
            }

            return result && node;
        };
    };

    var element$children$$makeMethod = function element$children$$makeMethod(all) {
        return function (selector) {
            if (all) {
                if (selector && typeof selector !== "string") throw new errors$$MethodError("children", arguments);
            } else {
                if (selector && typeof selector !== "number") throw new errors$$MethodError("child", arguments);
            }

            var node = this[0],
                matcher = util$selectormatcher$$default(selector),
                children = node.children;
            if (JSCRIPT_VERSION < 9) {
                // fix IE8 bug with children collection
                children = util$index$$default.filter.call(children, function (node) {
                    return node.nodeType === 1;
                });
            }

            if (all) {
                if (matcher) children = util$index$$default.filter.call(children, matcher);

                return util$index$$default.map.call(children, $Element);
            } else {
                if (selector < 0) selector = children.length + selector;

                return $Element(children[selector]);
            }
        };
    };

    util$index$$default.register({
        child: element$children$$makeMethod(false),

        children: element$children$$makeMethod(true)
    }, function (methodName) {
        return methodName === "child" ? function () {
            return new $NullElement();
        } : function () {
            return [];
        };
    });

    var element$classes$$reSpace = /[\n\t\r]/g,
        element$classes$$makeMethod = function element$classes$$makeMethod(nativeMethodName, strategy) {
        var methodName = nativeMethodName === "contains" ? "hasClass" : nativeMethodName + "Class";
        if (HTML.classList) {
            // use native classList property if possible
            strategy = function strategy(el, token) {
                return el[0].classList[nativeMethodName](token);
            };
        }

        if (methodName === "hasClass" || methodName === "toggleClass") {
            return function (token, force) {
                if (typeof force === "boolean" && methodName === "toggleClass") {
                    this[force ? "addClass" : "removeClass"](token);

                    return force;
                }

                if (typeof token !== "string") throw new errors$$MethodError(methodName, arguments);

                return strategy(this, token);
            };
        } else {
            return function () {
                var $D$5;var $D$6;
                var tokens = arguments;

                $D$5 = 0;$D$6 = tokens.length;for (var token; $D$5 < $D$6;) {
                    token = tokens[$D$5++];
                    if (typeof token !== "string") throw new errors$$MethodError(methodName, arguments);

                    strategy(this, token);
                };$D$5 = $D$6 = void 0;

                return this;
            };
        }
    };

    util$index$$default.register({
        hasClass: element$classes$$makeMethod("contains", function (el, token) {
            return (" " + el[0].className + " ").replace(element$classes$$reSpace, " ").indexOf(" " + token + " ") >= 0;
        }),

        addClass: element$classes$$makeMethod("add", function (el, token) {
            if (!el.hasClass(token)) el[0].className += " " + token;
        }),

        removeClass: element$classes$$makeMethod("remove", function (el, token) {
            el[0].className = (" " + el[0].className + " ").replace(element$classes$$reSpace, " ").replace(" " + token + " ", " ").trim();
        }),

        toggleClass: element$classes$$makeMethod("toggle", function (el, token) {
            var hasClass = el.hasClass(token);

            if (hasClass) {
                el.removeClass(token);
            } else {
                el[0].className += " " + token;
            }

            return !hasClass;
        })
    }, function (methodName) {
        if (methodName === "hasClass" || methodName === "toggleClass") {
            return function () {
                return false;
            };
        }
    });

    util$index$$default.register({
        clone: function clone(deep) {
            if (typeof deep !== "boolean") throw new errors$$MethodError("clone", arguments);

            var node = this[0],
                result;
            if (JSCRIPT_VERSION < 9) {
                result = DOM.create(node.outerHTML);

                if (!deep) result.set("");
            } else {
                result = new $Element(node.cloneNode(deep));
            }

            return result;
        }
    }, function () {
        return function () {
            return new $NullElement();
        };
    });

    util$index$$default.register({
        contains: function contains(element) {
            var node = this[0];

            if (element instanceof $Element) {
                var otherNode = element[0];

                if (otherNode === node) return true;
                if (node.contains) {
                    return node.contains(otherNode);
                } else {
                    return node.compareDocumentPosition(otherNode) & 16;
                }
            }

            throw new errors$$MethodError("contains", arguments);
        }
    }, function () {
        return function () {
            return false;
        };
    });

    // Inspired by the article written by Daniel Buchner:
    // http://www.backalleycoder.com/2014/04/18/element-queries-from-the-feet-up/

    var element$context$$CONTEXT_TEMPLATE = "div[style=overflow:hidden]>object[data=`about:blank` type=text/html style=`position:absolute` width=100% height=100%]";
    if (JSCRIPT_VERSION) {
        // use calc to cut ugly frame border in IE>8
        element$context$$CONTEXT_TEMPLATE = element$context$$CONTEXT_TEMPLATE.replace("position:absolute", "width:calc(100% + 4px);height:calc(100% + 4px);left:-2px;top:-2px;position:absolute");

        if (JSCRIPT_VERSION > 8) {
            // for IE>8 have to set the data attribute AFTER adding element to the DOM
            element$context$$CONTEXT_TEMPLATE = element$context$$CONTEXT_TEMPLATE.replace("data=`about:blank` ", "");
        } else {
            // IE8 fails with about:blank, use better-dom-legacy.html instead
            element$context$$CONTEXT_TEMPLATE = element$context$$CONTEXT_TEMPLATE.replace("about:blank", util$index$$default.getLegacyFile("html"));
        }
    }

    // Chrome/Safari/Opera have serious bug with tabbing to the <object> tree:
    // https://code.google.com/p/chromium/issues/detail?id=255150

    util$index$$default.register({
        context: function context(name) {
            var callback = arguments[1];if (callback === void 0) callback = function callback() {};
            var contexts = this._["context2001001"],
                data = contexts[name] || [];

            if (data[0]) {
                // callback is always async
                WINDOW.setTimeout(function () {
                    callback(data[1]);
                }, 1);

                return data[0];
            }
            // use innerHTML instead of creating element manually because of IE8
            var ctx = DOM.create(element$context$$CONTEXT_TEMPLATE);
            var object = ctx.get("firstChild");
            // set onload handler before adding element to the DOM
            object.onload = function () {
                // apply user-defined styles for the context
                // need to add class in ready callback because of IE8
                if (ctx.addClass(name).css("position") === "static") {
                    ctx.css("position", "relative");
                }
                // store new context root internally and invoke callback
                callback(data[1] = new $Document(object.contentDocument));
            };

            this.before(ctx);
            if (JSCRIPT_VERSION) {
                // IE doesn't work if to set the data attribute before adding
                // the <object> element to the DOM. IE8 will ignore this change
                // and won't start builing a new document for about:blank
                object.data = "about:blank";

                if (JSCRIPT_VERSION < 9) {
                    // IE8 does not support onload - use timeout instead
                    DOM.requestFrame(function repeat() {
                        if (!object.contentDocument) {
                            return DOM.requestFrame(repeat);
                        }

                        var frameId;
                        // add extra sizes and cut the frame border
                        ctx[0].attachEvent("onresize", function () {
                            frameId = frameId || DOM.requestFrame(function () {
                                object.width = ctx[0].offsetWidth + 4;
                                object.height = ctx[0].offsetHeight + 4;

                                frameId = null;
                            });
                        });

                        object.onload();
                    });
                }
            }
            // store context data internally
            contexts[name] = data;

            return data[0] = ctx;
        }
    });

    // Helper for CSS properties access

    var util$stylehooks$$reDash = /\-./g,
        util$stylehooks$$cssPrefixes = ["Webkit", "O", "Moz", "ms"],
        util$stylehooks$$hooks = { get: {}, set: {}, find: function find(name, style) {
            var propName = name.replace(util$stylehooks$$reDash, function (str) {
                return str[1].toUpperCase();
            });

            if (!(propName in style)) {
                propName = util$stylehooks$$cssPrefixes.map(function (prefix) {
                    return prefix + propName[0].toUpperCase() + propName.slice(1);
                }).filter(function (prop) {
                    return prop in style;
                })[0];
            }

            return this.get[name] = this.set[name] = propName;
        } },
        util$stylehooks$$directions = ["Top", "Right", "Bottom", "Left"],
        util$stylehooks$$shortCuts = {
        font: ["fontStyle", "fontSize", "/", "lineHeight", "fontFamily"],
        padding: util$stylehooks$$directions.map(function (dir) {
            return "padding" + dir;
        }),
        margin: util$stylehooks$$directions.map(function (dir) {
            return "margin" + dir;
        }),
        "border-width": util$stylehooks$$directions.map(function (dir) {
            return "border" + dir + "Width";
        }),
        "border-style": util$stylehooks$$directions.map(function (dir) {
            return "border" + dir + "Style";
        })
    };

    // Exclude the following css properties from adding px
    " float fill-opacity font-weight line-height opacity orphans widows z-index zoom ".split(" ").forEach(function (propName) {
        var stylePropName = propName.replace(util$stylehooks$$reDash, function (str) {
            return str[1].toUpperCase();
        });

        if (propName === "float") {
            stylePropName = "cssFloat" in HTML.style ? "cssFloat" : "styleFloat";
            // normalize float css property
            util$stylehooks$$hooks.get[propName] = util$stylehooks$$hooks.set[propName] = stylePropName;
        } else {
            util$stylehooks$$hooks.get[propName] = stylePropName;
            util$stylehooks$$hooks.set[propName] = function (value, style) {
                style[stylePropName] = value.toString();
            };
        }
    });

    // normalize property shortcuts
    util$index$$default.keys(util$stylehooks$$shortCuts).forEach(function (key) {
        var props = util$stylehooks$$shortCuts[key];

        util$stylehooks$$hooks.get[key] = function (style) {
            var result = [],
                hasEmptyStyleValue = function hasEmptyStyleValue(prop, index) {
                result.push(prop === "/" ? prop : style[prop]);

                return !result[index];
            };

            return props.some(hasEmptyStyleValue) ? "" : result.join(" ");
        };

        util$stylehooks$$hooks.set[key] = function (value, style) {
            if (value && "cssText" in style) {
                // normalize setting complex property across browsers
                style.cssText += ";" + key + ":" + value;
            } else {
                props.forEach(function (name) {
                    return style[name] = typeof value === "number" ? value + "px" : value.toString();
                });
            }
        };
    });

    var util$stylehooks$$default = util$stylehooks$$hooks;

    util$index$$default.register({
        css: function css(name, value) {
            var this$0 = this;
            var len = arguments.length,
                node = this[0],
                style = node.style,
                computed;

            if (len === 1 && (typeof name === "string" || util$index$$default.isArray(name))) {
                var strategy = function strategy(name) {
                    var getter = util$stylehooks$$default.get[name] || util$stylehooks$$default.find(name, style),
                        value = typeof getter === "function" ? getter(style) : style[getter];

                    if (!value) {
                        if (!computed) computed = util$index$$default.computeStyle(node);

                        value = typeof getter === "function" ? getter(computed) : computed[getter];
                    }

                    return value;
                };

                if (typeof name === "string") {
                    return strategy(name);
                } else {
                    return name.map(strategy).reduce(function (memo, value, index) {
                        memo[name[index]] = value;

                        return memo;
                    }, {});
                }
            }

            if (len === 2 && typeof name === "string") {
                var setter = util$stylehooks$$default.set[name] || util$stylehooks$$default.find(name, style);

                if (typeof value === "function") {
                    value = value(this);
                }

                if (value == null) value = "";

                if (typeof setter === "function") {
                    setter(value, style);
                } else {
                    style[setter] = typeof value === "number" ? value + "px" : value.toString();
                }
            } else if (len === 1 && name && (typeof name === "undefined" ? "undefined" : _typeof(name)) === "object") {
                util$index$$default.keys(name).forEach(function (key) {
                    this$0.css(key, name[key]);
                });
            } else {
                throw new errors$$MethodError("css", arguments);
            }

            return this;
        }
    }, function () {
        return function (name) {
            if (arguments.length === 1 && util$index$$default.isArray(name)) {
                return {};
            }

            if (arguments.length !== 1 || typeof name !== "string") {
                return this;
            }
        };
    });

    var element$define$$ATTR_CASE = JSCRIPT_VERSION < 9 ? "toUpperCase" : "toLowerCase";

    util$index$$default.register({
        define: function define(name, getter, setter) {
            var this$0 = this;
            var node = this[0];

            if (typeof name !== "string" || typeof getter !== "function" || typeof setter !== "function") {
                throw new errors$$MethodError("define", arguments);
            }

            // Use trick to fix infinite recursion in IE8:
            // http://www.smashingmagazine.com/2014/11/28/complete-polyfill-html5-details-element/

            var attrName = name[element$define$$ATTR_CASE]();
            var _setAttribute = node.setAttribute;
            var _removeAttribute = node.removeAttribute;
            if (JSCRIPT_VERSION < 9) {
                // read attribute before the defineProperty call
                // to set the correct initial state for IE8
                var initialValue = node.getAttribute(name);

                if (initialValue !== null) {
                    node[attrName] = initialValue;
                }
            }

            Object.defineProperty(node, name, {
                get: function get() {
                    var attrValue = node.getAttribute(attrName, 1);
                    // attr value -> prop value
                    return getter.call(this$0, attrValue);
                },
                set: function set(propValue) {
                    // prop value -> attr value
                    var attrValue = setter.call(this$0, propValue);

                    if (attrValue == null) {
                        _removeAttribute.call(node, attrName, 1);
                    } else {
                        _setAttribute.call(node, attrName, attrValue, 1);
                    }
                }
            });

            // override methods to catch changes from attributes too
            node.setAttribute = function (name, value, flags) {
                if (attrName === name[element$define$$ATTR_CASE]()) {
                    node[name] = getter.call(this$0, value);
                } else {
                    _setAttribute.call(node, name, value, flags);
                }
            };

            node.removeAttribute = function (name, flags) {
                if (attrName === name[element$define$$ATTR_CASE]()) {
                    node[name] = getter.call(this$0, null);
                } else {
                    _removeAttribute.call(node, name, flags);
                }
            };

            return this;
        }
    });

    util$index$$default.register({

        empty: function empty() {
            return this.set("");
        }

    });

    // big part of code inspired by Sizzle:
    // https://github.com/jquery/sizzle/blob/master/sizzle.js

    var element$find$$rquick = DOCUMENT.getElementsByClassName ? /^(?:(\w+)|\.([\w\-]+))$/ : /^(?:(\w+))$/,
        element$find$$rescape = /'|\\/g,
        element$find$$makeMethod = function element$find$$makeMethod(all) {
        return function (selector) {
            if (typeof selector !== "string") throw new errors$$MethodError("find" + all, arguments);

            var node = this[0],
                quickMatch = element$find$$rquick.exec(selector),
                result,
                old,
                nid,
                context;

            if (quickMatch) {
                if (quickMatch[1]) {
                    // speed-up: "TAG"
                    result = node.getElementsByTagName(selector);
                } else {
                    // speed-up: ".CLASS"
                    result = node.getElementsByClassName(quickMatch[2]);
                }

                if (result && !all) result = result[0];
            } else {
                old = true;
                context = node;

                if (node !== node.ownerDocument.documentElement) {
                    // qSA works strangely on Element-rooted queries
                    // We can work around this by specifying an extra ID on the root
                    // and working up from there (Thanks to Andrew Dupont for the technique)
                    if (old = node.getAttribute("id")) {
                        nid = old.replace(element$find$$rescape, "\\$&");
                    } else {
                        nid = "DOM2001001";
                        node.setAttribute("id", nid);
                    }

                    nid = "[id='" + nid + "'] ";
                    selector = nid + selector.split(",").join("," + nid);
                }

                result = util$index$$default.safeCall(context, "querySelector" + all, selector);

                if (!old) node.removeAttribute("id");
            }

            return all ? util$index$$default.map.call(result, $Element) : $Element(result);
        };
    };

    util$index$$default.register({
        find: element$find$$makeMethod(""),

        findAll: element$find$$makeMethod("All")
    }, function (methodName) {
        return methodName === "find" ? function () {
            return new $NullElement();
        } : function () {
            return [];
        };
    });

    var util$eventhooks$$hooks = {};
    if ("onfocusin" in DOCUMENT.documentElement) {
        util$eventhooks$$hooks.focus = function (handler) {
            handler._type = "focusin";
        };
        util$eventhooks$$hooks.blur = function (handler) {
            handler._type = "focusout";
        };
    } else {
        // firefox doesn't support focusin/focusout events
        util$eventhooks$$hooks.focus = util$eventhooks$$hooks.blur = function (handler) {
            handler.capturing = true;
        };
    }
    if (DOCUMENT.createElement("input").validity) {
        util$eventhooks$$hooks.invalid = function (handler) {
            handler.capturing = true;
        };
    }
    if (JSCRIPT_VERSION < 9) {
        // fix non-bubbling form events for IE8 therefore
        // use custom event type instead of original one
        ["submit", "change", "reset"].forEach(function (name) {
            util$eventhooks$$hooks[name] = function (handler) {
                handler._type = "_";
            };
        });
    }

    var util$eventhooks$$default = util$eventhooks$$hooks;

    function util$eventhandler$$getEventProperty(name, e, type, node, target, currentTarget) {
        if (typeof name === "number") {
            var args = e["__2001001__"];

            return args ? args[name] : void 0;
        }
        if (JSCRIPT_VERSION < 9) {
            var docEl = node.ownerDocument.documentElement;

            switch (name) {
                case "which":
                    return e.keyCode;
                case "button":
                    var button = e.button;
                    // click: 1 === left; 2 === middle; 3 === right
                    return button & 1 ? 1 : button & 2 ? 3 : button & 4 ? 2 : 0;
                case "pageX":
                    return e.clientX + docEl.scrollLeft - docEl.clientLeft;
                case "pageY":
                    return e.clientY + docEl.scrollTop - docEl.clientTop;
                case "preventDefault":
                    return function () {
                        return e.returnValue = false;
                    };
                case "stopPropagation":
                    return function () {
                        return e.cancelBubble = true;
                    };
            }
        }

        switch (name) {
            case "type":
                return type;
            case "defaultPrevented":
                // IE8 and Android 2.3 use returnValue instead of defaultPrevented
                return "defaultPrevented" in e ? e.defaultPrevented : e.returnValue === false;
            case "target":
                return $Element(target);
            case "currentTarget":
                return $Element(currentTarget);
            case "relatedTarget":
                return $Element(e.relatedTarget || e[(e.toElement === node ? "from" : "to") + "Element"]);
        }

        var value = e[name];

        if (typeof value === "function") {
            return function () {
                return value.apply(e, arguments);
            };
        }

        return value;
    }

    function util$eventhandler$$EventHandler(type, selector, callback, props, el, once) {
        var node = el[0],
            hook = util$eventhooks$$default[type],
            matcher = util$selectormatcher$$default(selector, node),
            _handler = function handler(e) {
            e = e || WINDOW.event;
            // early stop in case of default action
            if (util$eventhandler$$EventHandler.skip === type) return;
            if (_handler._type === CUSTOM_EVENT_TYPE && e.srcUrn !== type) {
                return; // handle custom events in legacy IE
            }
            // srcElement can be null in legacy IE when target is document
            var target = e.target || e.srcElement || node.ownerDocument.documentElement,
                currentTarget = matcher ? matcher(target) : node,
                args = props || [];

            // early stop for late binding or when target doesn't match selector
            if (!currentTarget) return;

            // off callback even if it throws an exception later
            if (once) el.off(type, callback);

            if (props) {
                args = args.map(function (name) {
                    return util$eventhandler$$getEventProperty(name, e, type, node, target, currentTarget);
                });
            } else {
                args = util$index$$default.slice.call(e["__2001001__"] || [0], 1);
            }

            // prevent default if handler returns false
            if (callback.apply(el, args) === false) {
                if (JSCRIPT_VERSION < 9) {
                    e.returnValue = false;
                } else {
                    e.preventDefault();
                }
            }
        };

        if (hook) _handler = hook(_handler, type) || _handler;
        if (JSCRIPT_VERSION < 9 && !("on" + (_handler._type || type) in node)) {
            // handle custom events for IE8
            _handler._type = CUSTOM_EVENT_TYPE;
        }

        _handler.type = type;
        _handler.callback = callback;
        _handler.selector = selector;

        return _handler;
    }

    var util$eventhandler$$default = util$eventhandler$$EventHandler;

    util$index$$default.register({
        fire: function fire(type) {
            var node = this[0],
                e,
                eventType,
                canContinue;

            if (typeof type === "string") {
                var hook = util$eventhooks$$default[type],
                    handler = {};

                if (hook) handler = hook(handler) || handler;

                eventType = handler._type || type;
            } else {
                throw new errors$$MethodError("fire", arguments);
            }
            if (JSCRIPT_VERSION < 9) {
                e = node.ownerDocument.createEventObject();
                e["__2001001__"] = arguments;
                // handle custom events for legacy IE
                if (!("on" + eventType in node)) eventType = CUSTOM_EVENT_TYPE;
                // store original event type
                if (eventType === CUSTOM_EVENT_TYPE) e.srcUrn = type;

                node.fireEvent("on" + eventType, e);

                canContinue = e.returnValue !== false;
            } else {
                e = node.ownerDocument.createEvent("HTMLEvents");
                e["__2001001__"] = arguments;
                e.initEvent(eventType, true, true);
                canContinue = node.dispatchEvent(e);
            }

            // call native function to trigger default behavior
            if (canContinue && node[type]) {
                // prevent re-triggering of the current event
                util$eventhandler$$default.skip = type;

                util$index$$default.safeCall(node, type);

                util$eventhandler$$default.skip = null;
            }

            return canContinue;
        }
    }, function () {
        return function () {
            return true;
        };
    });

    var util$accessorhooks$$hooks = { get: {}, set: {} };

    // fix camel cased attributes
    "tabIndex readOnly maxLength cellSpacing cellPadding rowSpan colSpan useMap frameBorder contentEditable".split(" ").forEach(function (key) {
        util$accessorhooks$$hooks.get[key.toLowerCase()] = function (node) {
            return node[key];
        };
    });

    // style hook
    util$accessorhooks$$hooks.get.style = function (node) {
        return node.style.cssText;
    };
    util$accessorhooks$$hooks.set.style = function (node, value) {
        node.style.cssText = value;
    };

    // title hook for DOM
    util$accessorhooks$$hooks.get.title = function (node) {
        var doc = node.ownerDocument;

        return node === doc.documentElement ? doc.title : node.title;
    };

    util$accessorhooks$$hooks.set.title = function (node, value) {
        var doc = node.ownerDocument;

        (node === doc.documentElement ? doc : node).title = value;
    };

    util$accessorhooks$$hooks.get.undefined = function (node) {
        var name;

        switch (node.tagName) {
            case "SELECT":
                return ~node.selectedIndex ? node.options[node.selectedIndex].value : "";

            case "OPTION":
                name = node.hasAttribute("value") ? "value" : "text";
                break;

            default:
                name = node.type && "value" in node ? "value" : "innerHTML";
        }

        return node[name];
    };

    util$accessorhooks$$hooks.set.value = function (node, value) {
        if (node.tagName === "SELECT") {
            // selectbox has special case
            if (util$index$$default.every.call(node.options, function (o) {
                return !(o.selected = o.value === value);
            })) {
                node.selectedIndex = -1;
            }
        } else {
            // for IE use innerText for textareabecause it doesn't trigger onpropertychange
            node[JSCRIPT_VERSION < 9 && node.type === "textarea" ? "innerText" : "value"] = value;
        }
    };

    // some browsers don't recognize input[type=email] etc.
    util$accessorhooks$$hooks.get.type = function (node) {
        return node.getAttribute("type") || node.type;
    };
    if (JSCRIPT_VERSION < 9) {
        // IE8 has innerText but not textContent
        util$accessorhooks$$hooks.get.textContent = function (node) {
            return node.innerText;
        };
        util$accessorhooks$$hooks.set.textContent = function (node, value) {
            node.innerText = value;
        };

        // IE8 sometimes breaks on innerHTML
        util$accessorhooks$$hooks.set.innerHTML = function (node, value) {
            try {
                node.innerHTML = value;
            } catch (err) {
                node.innerText = "";

                DOM.createAll(value).forEach(function (x) {
                    node.appendChild(x);
                });
            }
        };
    }

    var util$accessorhooks$$default = util$accessorhooks$$hooks;

    var element$get$$reUpper = /[A-Z]/g,
        element$get$$readPrivateProperty = function element$get$$readPrivateProperty(node, key) {
        // convert from camel case to dash-separated value
        key = key.replace(element$get$$reUpper, function (l) {
            return "-" + l.toLowerCase();
        });

        var value = node.getAttribute("data-" + key);

        if (value != null) {
            // try to recognize and parse  object notation syntax
            if (value[0] === "{" && value[value.length - 1] === "}") {
                try {
                    value = JSON.parse(value);
                } catch (err) {
                    // just return the value itself
                }
            }
        }

        return value;
    };

    util$index$$default.register({
        get: function get(name) {
            var this$0 = this;
            var node = this[0],
                hook = util$accessorhooks$$default.get[name];

            if (hook) return hook(node, name);

            if (typeof name === "string") {
                if (name in node) {
                    return node[name];
                } else if (name[0] !== "_") {
                    return node.getAttribute(name);
                } else {
                    var key = name.slice(1),
                        data = this._;

                    if (!(key in data)) {
                        data[key] = element$get$$readPrivateProperty(node, key);
                    }

                    return data[key];
                }
            } else if (util$index$$default.isArray(name)) {
                return name.reduce(function (memo, key) {
                    return memo[key] = this$0.get(key), memo;
                }, {});
            } else {
                throw new errors$$MethodError("get", arguments);
            }
        }
    }, function () {
        return function () {
            return void 0;
        };
    });

    var element$manipulation$$makeMethod = function element$manipulation$$makeMethod(methodName, fastStrategy, requiresParent, strategy) {
        return function () {
            var contents = SLICE$0.call(arguments, 0);var this$0 = this;
            var node = this[0];

            if (requiresParent && !node.parentNode) return this;

            // the idea of the algorithm is to construct HTML string
            // when possible or use document fragment as a fallback to
            // invoke manipulation using a single method call
            var fragment = fastStrategy ? "" : node.ownerDocument.createDocumentFragment();

            contents.forEach(function (content) {
                if (typeof content === "function") {
                    content = content(this$0);
                }

                if (typeof content === "string") {
                    if (typeof fragment === "string") {
                        fragment += content.trim();
                    } else {
                        content = DOM.createAll(content);
                    }
                } else if (content instanceof $Element) {
                    content = [content];
                }

                if (util$index$$default.isArray(content)) {
                    if (typeof fragment === "string") {
                        // append existing string to fragment
                        content = DOM.createAll(fragment).concat(content);
                        // fallback to document fragment strategy
                        fragment = node.ownerDocument.createDocumentFragment();
                    }

                    content.forEach(function (el) {
                        fragment.appendChild(el[0]);
                    });
                }
            });

            if (typeof fragment === "string") {
                node.insertAdjacentHTML(fastStrategy, fragment);
            } else {
                strategy(node, fragment);
            }

            return this;
        };
    };

    util$index$$default.register({
        after: element$manipulation$$makeMethod("after", "afterend", true, function (node, relatedNode) {
            node.parentNode.insertBefore(relatedNode, node.nextSibling);
        }),

        before: element$manipulation$$makeMethod("before", "beforebegin", true, function (node, relatedNode) {
            node.parentNode.insertBefore(relatedNode, node);
        }),

        prepend: element$manipulation$$makeMethod("prepend", "afterbegin", false, function (node, relatedNode) {
            node.insertBefore(relatedNode, node.firstChild);
        }),

        append: element$manipulation$$makeMethod("append", "beforeend", false, function (node, relatedNode) {
            node.appendChild(relatedNode);
        }),

        replace: element$manipulation$$makeMethod("replace", "", true, function (node, relatedNode) {
            node.parentNode.replaceChild(relatedNode, node);
        }),

        remove: element$manipulation$$makeMethod("remove", "", true, function (node) {
            node.parentNode.removeChild(node);
        })
    });

    util$index$$default.register({
        map: function map(fn, context) {
            if (typeof fn !== "function") {
                throw new errors$$MethodError("map", arguments);
            }

            return [fn.call(context, this)];
        }
    }, function () {
        return function () {
            return [];
        };
    });

    var util$selectorhooks$$isHidden = function util$selectorhooks$$isHidden(node) {
        var computed = util$index$$default.computeStyle(node);

        return computed.visibility === "hidden" || computed.display === "none";
    };

    var util$selectorhooks$$default = {
        ":focus": function focus(node) {
            return node === node.ownerDocument.activeElement;
        },

        ":visible": function visible(node) {
            return !util$selectorhooks$$isHidden(node);
        },

        ":hidden": util$selectorhooks$$isHidden
    };

    util$index$$default.register({
        matches: function matches(selector) {
            if (!selector || typeof selector !== "string") throw new errors$$MethodError("matches", arguments);

            var checker = util$selectorhooks$$default[selector] || util$selectormatcher$$default(selector);

            return !!checker(this[0]);
        }
    }, function () {
        return function () {
            return false;
        };
    });

    util$index$$default.register({
        off: function off(type, selector, callback) {
            if (typeof type !== "string") throw new errors$$MethodError("off", arguments);

            if (callback === void 0) {
                callback = selector;
                selector = void 0;
            }

            var node = this[0];

            this._["handler2001001"] = this._["handler2001001"].filter(function (handler) {
                var skip = type !== handler.type;

                skip = skip || selector && selector !== handler.selector;
                skip = skip || callback && callback !== handler.callback;

                if (skip) return true;

                type = handler._type || handler.type;
                if (JSCRIPT_VERSION < 9) {
                    node.detachEvent("on" + type, handler);
                } else {
                    node.removeEventListener(type, handler, !!handler.capturing);
                }
            });

            return this;
        }
    });

    util$index$$default.register({
        offset: function offset() {
            var node = this[0],
                docEl = node.ownerDocument.documentElement,
                clientTop = docEl.clientTop,
                clientLeft = docEl.clientLeft,
                scrollTop = WINDOW.pageYOffset || docEl.scrollTop,
                scrollLeft = WINDOW.pageXOffset || docEl.scrollLeft,
                boundingRect = node.getBoundingClientRect();

            return {
                top: boundingRect.top + scrollTop - clientTop,
                left: boundingRect.left + scrollLeft - clientLeft,
                right: boundingRect.right + scrollLeft - clientLeft,
                bottom: boundingRect.bottom + scrollTop - clientTop,
                width: boundingRect.right - boundingRect.left,
                height: boundingRect.bottom - boundingRect.top
            };
        }
    }, function () {
        return function () {
            return { top: 0, left: 0, right: 0, bottom: 0, width: 0, height: 0 };
        };
    });

    var element$on$$makeMethod = function element$on$$makeMethod(method) {
        return function (type, selector, args, callback) {
            var this$0 = this;
            if (typeof type === "string") {
                if (typeof args === "function") {
                    callback = args;

                    if (typeof selector === "string") {
                        args = null;
                    } else {
                        args = selector;
                        selector = null;
                    }
                }

                if (typeof selector === "function") {
                    callback = selector;
                    selector = null;
                    args = null;
                }

                if (typeof callback !== "function") {
                    throw new errors$$MethodError(method, arguments);
                }

                var node = this[0],
                    handler = util$eventhandler$$default(type, selector, callback, args, this, method === "once");

                if (handler) {
                    if (JSCRIPT_VERSION < 9) {
                        node.attachEvent("on" + (handler._type || type), handler);
                    } else {
                        node.addEventListener(handler._type || type, handler, !!handler.capturing);
                    }
                    // store event entry
                    this._["handler2001001"].push(handler);
                }
            } else if ((typeof type === "undefined" ? "undefined" : _typeof(type)) === "object") {
                if (util$index$$default.isArray(type)) {
                    type.forEach(function (name) {
                        this$0[method](name, selector, args, callback);
                    });
                } else {
                    util$index$$default.keys(type).forEach(function (name) {
                        this$0[method](name, type[name]);
                    });
                }
            } else {
                throw new errors$$MethodError(method, arguments);
            }

            return this;
        };
    };

    util$index$$default.register({
        on: element$on$$makeMethod("on"),

        once: element$on$$makeMethod("once")
    });

    util$index$$default.register({
        set: function set(name, value) {
            var this$0 = this;
            var node = this[0];

            // handle the value shortcut
            if (arguments.length === 1) {
                if (typeof name === "function") {
                    value = name;
                } else {
                    value = name == null ? "" : String(name);
                }

                if (value !== "[object Object]") {
                    var tag = node.tagName;

                    if (tag === "INPUT" || tag === "TEXTAREA" || tag === "SELECT" || tag === "OPTION") {
                        name = "value";
                    } else {
                        name = "innerHTML";
                    }
                }
            }

            var hook = util$accessorhooks$$default.set[name],
                watchers = this._["watcher2001001"][name],
                oldValue;

            if (watchers) {
                oldValue = this.get(name);
            }

            if (typeof name === "string") {
                if (name[0] === "_") {
                    this._[name.slice(1)] = value;
                } else {
                    if (typeof value === "function") {
                        value = value(this);
                    }

                    if (hook) {
                        hook(node, value);
                    } else if (value == null) {
                        node.removeAttribute(name);
                    } else if (name in node) {
                        node[name] = value;
                    } else {
                        node.setAttribute(name, value);
                    }
                    if (JSCRIPT_VERSION < 9 || LEGACY_ANDROID) {
                        // always trigger reflow manually for IE8 and legacy Android
                        node.className = node.className;
                    }
                }
            } else if (util$index$$default.isArray(name)) {
                name.forEach(function (key) {
                    this$0.set(key, value);
                });
            } else if ((typeof name === "undefined" ? "undefined" : _typeof(name)) === "object") {
                util$index$$default.keys(name).forEach(function (key) {
                    this$0.set(key, name[key]);
                });
            } else {
                throw new errors$$MethodError("set", arguments);
            }

            if (watchers && oldValue !== value) {
                watchers.forEach(function (w) {
                    util$index$$default.safeCall(this$0, w, value, oldValue);
                });
            }

            return this;
        }
    });

    var element$traversing$$makeMethod = function element$traversing$$makeMethod(methodName, propertyName, all) {
        return function (selector) {
            if (selector && typeof selector !== "string") throw new errors$$MethodError(methodName, arguments);

            var matcher = util$selectormatcher$$default(selector),
                nodes = all ? [] : null,
                it = this[0];

            // method closest starts traversing from the element itself
            // except no selector was specified where it returns parent
            if (!matcher || methodName !== "closest") {
                it = it[propertyName];
            }

            for (; it; it = it[propertyName]) {
                if (it.nodeType === 1 && (!matcher || matcher(it))) {
                    if (!all) break;

                    nodes.push(it);
                }
            }

            return all ? util$index$$default.map.call(nodes, $Element) : $Element(it);
        };
    };

    util$index$$default.register({
        next: element$traversing$$makeMethod("next", "nextSibling"),

        prev: element$traversing$$makeMethod("prev", "previousSibling"),

        nextAll: element$traversing$$makeMethod("nextAll", "nextSibling", true),

        prevAll: element$traversing$$makeMethod("prevAll", "previousSibling", true),

        closest: element$traversing$$makeMethod("closest", "parentNode")
    }, function (methodName) {
        if (methodName.slice(-3) === "All") {
            return function () {
                return [];
            };
        } else {
            return function () {
                return new $NullElement();
            };
        }
    });

    util$index$$default.register({
        value: function value(val) {
            if (arguments.length === 0) {
                return this.get();
            } else if (typeof val === "string") {
                return this.set(val);
            } else {
                return this.set("").append(val);
            }
        }
    });

    var util$animationhandler$$TRANSITION_PROPS = ["timing-function", "property", "duration", "delay"].map(function (prop) {
        return "transition-" + prop;
    }),
        util$animationhandler$$parseTimeValue = function util$animationhandler$$parseTimeValue(value) {
        var result = parseFloat(value) || 0;
        // if duration is in seconds, then multiple result value by 1000
        return !result || value.slice(-2) === "ms" ? result : result * 1000;
    },
        util$animationhandler$$calcTransitionDuration = function util$animationhandler$$calcTransitionDuration(transitionValues) {
        var delays = transitionValues[3],
            durations = transitionValues[2];

        return Math.max.apply(Math, durations.map(function (value, index) {
            return util$animationhandler$$parseTimeValue(value) + (util$animationhandler$$parseTimeValue(delays[index]) || 0);
        }));
    };

    // initialize hooks for properties used below
    util$animationhandler$$TRANSITION_PROPS.concat("animation-duration").forEach(function (prop) {
        util$stylehooks$$default.find(prop, HTML.style);
    });

    var util$animationhandler$$default = function util$animationhandler$$default(node, computed, animationName, hiding, done) {
        var rules, duration;

        // Legacy Android is usually slow and has lots of bugs in the
        // CSS animations implementation, so skip any animations for it
        if (LEGACY_ANDROID || JSCRIPT_VERSION < 10) return null;

        if (animationName) {
            duration = util$animationhandler$$parseTimeValue(computed[util$stylehooks$$default.get["animation-duration"]]);

            if (!duration) return; // skip animations with zero duration

            rules = [WEBKIT_PREFIX + "animation-direction:" + (hiding ? "normal" : "reverse"), WEBKIT_PREFIX + "animation-name:" + animationName,
            // for CSS3 animation element should always be visible
            "visibility:inherit"];
        } else {
            var transitionValues = util$animationhandler$$TRANSITION_PROPS.map(function (prop, index) {
                // have to use regexp to split transition-timing-function value
                return computed[util$stylehooks$$default.get[prop]].split(index ? ", " : /, (?!\d)/);
            });

            duration = util$animationhandler$$calcTransitionDuration(transitionValues);

            if (!duration) return; // skip transitions with zero duration

            if (transitionValues[1].indexOf("all") < 0) {
                // try to find existing or use 0s length or make a new visibility transition
                var visibilityIndex = transitionValues[1].indexOf("visibility");

                if (visibilityIndex < 0) visibilityIndex = transitionValues[2].indexOf("0s");
                if (visibilityIndex < 0) visibilityIndex = transitionValues[1].length;

                transitionValues[0][visibilityIndex] = "linear";
                transitionValues[1][visibilityIndex] = "visibility";
                transitionValues[hiding ? 2 : 3][visibilityIndex] = "0s";
                transitionValues[hiding ? 3 : 2][visibilityIndex] = duration + "ms";
            }

            rules = transitionValues.map(function (props, index) {
                // fill holes in a trasition property value
                for (var i = 0, n = props.length; i < n; ++i) {
                    props[i] = props[i] || props[i - 1] || "initial";
                }

                return WEBKIT_PREFIX + util$animationhandler$$TRANSITION_PROPS[index] + ":" + props.join(", ");
            });

            rules.push(
            // append target visibility value to trigger transition
            "visibility:" + (hiding ? "hidden" : "inherit"),
            // use willChange to improve performance in modern browsers:
            // http://dev.opera.com/articles/css-will-change-property/
            "will-change:" + transitionValues[1].join(", "));
        }

        return {
            cssText: rules.join(";"),
            initialCssText: node.style.cssText,
            // this function used to trigger callback
            handleEvent: function handleEvent(e) {
                if (e.target === node) {
                    if (animationName) {
                        if (e.animationName !== animationName) return;
                    } else {
                        if (e.propertyName !== "visibility") return;
                    }

                    e.stopPropagation(); // this is an internal event

                    done();
                }
            }
        };
    };

    var element$visibility$$TRANSITION_EVENT_TYPE = WEBKIT_PREFIX ? "webkitTransitionEnd" : "transitionend",
        element$visibility$$ANIMATION_EVENT_TYPE = WEBKIT_PREFIX ? "webkitAnimationEnd" : "animationend",
        element$visibility$$makeMethod = function element$visibility$$makeMethod(name, condition) {
        return function (animationName, callback) {
            var this$0 = this;
            if (typeof animationName !== "string") {
                callback = animationName;
                animationName = null;
            }

            if (callback && typeof callback !== "function") {
                throw new errors$$MethodError(name, arguments);
            }

            var node = this[0],
                style = node.style,
                computed = util$index$$default.computeStyle(node),
                hiding = condition,
                frameId = this._["frame2001001"],
                done = function done() {
                if (animationHandler) {
                    node.removeEventListener(eventType, animationHandler, true);
                    // clear inline style adjustments were made previously
                    style.cssText = animationHandler.initialCssText;
                } else {
                    this$0.set("aria-hidden", String(hiding));
                }
                // always update element visibility property: use value "inherit"
                // to respect parent container visibility. Should be a separate
                // from setting cssText because of Opera 12 quirks
                style.visibility = hiding ? "hidden" : "inherit";

                this$0._["frame2001001"] = null;

                if (callback) callback(this$0);
            };

            if (typeof hiding !== "boolean") {
                hiding = computed.visibility !== "hidden";
            }

            // cancel previous frame if it exists
            if (frameId) DOM.cancelFrame(frameId);

            if (!node.ownerDocument.documentElement.contains(node)) {
                // apply attribute/visibility syncronously for detached DOM elements
                // because browser returns zero animation/transition duration for them
                done();
            } else {
                var animationHandler = util$animationhandler$$default(node, computed, animationName, hiding, done),
                    eventType = animationName ? element$visibility$$ANIMATION_EVENT_TYPE : element$visibility$$TRANSITION_EVENT_TYPE;
                // use requestAnimationFrame to avoid animation quirks for
                // new elements inserted into the DOM
                // http://christianheilmann.com/2013/09/19/quicky-fading-in-a-newly-created-element-using-css/
                this._["frame2001001"] = DOM.requestFrame(!animationHandler ? done : function () {
                    node.addEventListener(eventType, animationHandler, true);
                    // update modified style rules
                    style.cssText = animationHandler.initialCssText + animationHandler.cssText;
                    // trigger CSS3 transition / animation
                    this$0.set("aria-hidden", String(hiding));
                });
            }

            return this;
        };
    };

    util$index$$default.register({
        show: element$visibility$$makeMethod("show", false),

        hide: element$visibility$$makeMethod("hide", true),

        toggle: element$visibility$$makeMethod("toggle")
    });

    util$index$$default.register({
        watch: function watch(name, callback) {
            var watchers = this._["watcher2001001"];

            if (!watchers[name]) watchers[name] = [];

            watchers[name].push(callback);

            return this;
        },

        unwatch: function unwatch(name, callback) {
            var watchers = this._["watcher2001001"];

            if (watchers[name]) {
                watchers[name] = watchers[name].filter(function (w) {
                    return w !== callback;
                });
            }

            return this;
        }
    });

    var util$extensionhandler$$rePrivateFunction = /^(?:on|do)[A-Z]/;

    var util$extensionhandler$$default = function util$extensionhandler$$default(selector, condition, mixins, index) {
        var ctr = mixins.hasOwnProperty("constructor") && mixins.constructor,
            matcher = util$selectormatcher$$default(selector);

        return function (node, mock) {
            var el = $Element(node);
            // skip previously invoked or mismatched elements
            if (~el._["extension2001001"].indexOf(index) || !matcher(node)) return;
            // mark extension as invoked
            el._["extension2001001"].push(index);

            if (mock === true || condition(el) !== false) {
                // apply all private/public members to the element's interface
                var privateFunctions = Object.keys(mixins).filter(function (prop) {
                    var value = mixins[prop];
                    // TODO: private functions are deprecated, remove this line later
                    if (util$extensionhandler$$rePrivateFunction.exec(prop)) {
                        // preserve context for private functions
                        el[prop] = function () {
                            return value.apply(el, arguments);
                        };

                        return !mock;
                    }

                    if (prop !== "constructor") {
                        el[prop] = value;

                        return !mock && prop[0] === "_";
                    }
                });

                // invoke constructor if it exists
                // make a safe call so live extensions can't break each other
                if (ctr) util$index$$default.safeCall(el, ctr);
                // remove event handlers from element's interface
                privateFunctions.forEach(function (prop) {
                    delete el[prop];
                });
            }
        };
    };

    // Inspired by trick discovered by Daniel Buchner:
    // https://github.com/csuwldcat/SelectorListener

    var global$extend$$extensions = [],
        global$extend$$returnTrue = function global$extend$$returnTrue() {
        return true;
    },
        global$extend$$returnFalse = function global$extend$$returnFalse() {
        return false;
    },
        global$extend$$cssText;

    DOM.extend = function (selector, condition, definition) {
        if (arguments.length === 2) {
            definition = condition;
            condition = true;
        }

        if (typeof condition === "boolean") condition = condition ? global$extend$$returnTrue : global$extend$$returnFalse;
        if (typeof definition === "function") definition = { constructor: definition };

        if (!definition || (typeof definition === "undefined" ? "undefined" : _typeof(definition)) !== "object" || typeof condition !== "function") throw new errors$$StaticMethodError("extend", arguments);

        if (selector === "*") {
            util$index$$default.keys(definition).forEach(function (methodName) {
                $Element.prototype[methodName] = definition[methodName];
            });
        } else {
            var ext = util$extensionhandler$$default(selector, condition, definition, global$extend$$extensions.length);

            global$extend$$extensions.push(ext);

            // initialize extension manually to make sure that all elements
            // have appropriate methods before they are used in other DOM.extend.
            // Also fixes legacy IEs when the HTC behavior is already attached
            util$index$$default.each.call(DOCUMENT.querySelectorAll(selector), ext);
            // MUST be after querySelectorAll because of legacy IEs quirks
            DOM.importStyles(selector, global$extend$$cssText);
        }
    };

    if (JSCRIPT_VERSION < 10) {
        global$extend$$cssText = "-ms-behavior:url(" + util$index$$default.getLegacyFile("htc") + ") !important";

        DOCUMENT.attachEvent("on" + CUSTOM_EVENT_TYPE, function () {
            var e = WINDOW.event;

            if (e.srcUrn === CUSTOM_EVENT_TYPE) {
                global$extend$$extensions.forEach(function (ext) {
                    ext(e.srcElement);
                });
            }
        });
    } else {
        var global$extend$$_extend = DOM.extend;

        global$extend$$cssText = WEBKIT_PREFIX + "animation-name:DOM2001001 !important;";
        global$extend$$cssText += WEBKIT_PREFIX + "animation-duration:1ms !important";

        DOM.extend = function () {
            // declare the fake animation on the first DOM.extend method call
            DOM.importStyles("@" + WEBKIT_PREFIX + "keyframes DOM2001001", "from {opacity:.99} to {opacity:1}");
            // restore original method and invoke it
            (DOM.extend = global$extend$$_extend).apply(DOM, arguments);
        };

        // use capturing to suppress internal animationstart events
        DOCUMENT.addEventListener(WEBKIT_PREFIX ? "webkitAnimationStart" : "animationstart", function (e) {
            if (e.animationName === "DOM2001001") {
                global$extend$$extensions.forEach(function (ext) {
                    ext(e.target);
                });
                // this is an internal event - stop it immediately
                e.stopImmediatePropagation();
            }
        }, true);
    }

    var global$extend$$default = global$extend$$extensions;

    var global$format$$reVar = /\{([\w\-]+)\}/g;

    DOM.format = function (tmpl, varMap) {
        if (typeof tmpl !== "string") tmpl = String(tmpl);

        if (!varMap || (typeof varMap === "undefined" ? "undefined" : _typeof(varMap)) !== "object") varMap = {};

        return tmpl.replace(global$format$$reVar, function (x, name, index) {
            if (name in varMap) {
                x = varMap[name];

                if (typeof x === "function") x = x(index);

                x = String(x);
            }

            return x;
        });
    };

    var global$frame$$raf = WINDOW.requestAnimationFrame,
        global$frame$$craf = WINDOW.cancelAnimationFrame,
        global$frame$$lastTime = 0;

    if (!(global$frame$$raf && global$frame$$craf)) {
        ["ms", "moz", "webkit", "o"].forEach(function (prefix) {
            global$frame$$raf = global$frame$$raf || WINDOW[prefix + "RequestAnimationFrame"];
            global$frame$$craf = global$frame$$craf || WINDOW[prefix + "CancelAnimationFrame"];
        });
    }

    DOM.requestFrame = function (callback) {
        if (global$frame$$raf) {
            return global$frame$$raf.call(WINDOW, callback);
        } else {
            // use idea from Erik Möller's polyfill:
            // http://www.paulirish.com/2011/requestanimationframe-for-smart-animating/
            var currTime = Date.now();
            var timeToCall = Math.max(0, 16 - (currTime - global$frame$$lastTime));

            global$frame$$lastTime = currTime + timeToCall;

            return WINDOW.setTimeout(function () {
                callback(currTime + timeToCall);
            }, timeToCall);
        }
    };

    DOM.cancelFrame = function (frameId) {
        if (global$frame$$craf) {
            global$frame$$craf.call(WINDOW, frameId);
        } else {
            WINDOW.clearTimeout(frameId);
        }
    };

    function global$mock$$applyExtensions(node) {
        global$extend$$default.forEach(function (ext) {
            ext(node, true);
        });

        util$index$$default.each.call(node.children, global$mock$$applyExtensions);
    }

    DOM.mock = function (content, varMap) {
        if (!content) return new $NullElement();

        var result = DOM.create(content, varMap);

        global$mock$$applyExtensions(result[0]);

        return result;
    };

    var exports$$_DOM = WINDOW.DOM;

    DOM.noConflict = function () {
        if (WINDOW.DOM === DOM) {
            WINDOW.DOM = exports$$_DOM;
        }

        return DOM;
    };

    WINDOW.DOM = DOM;
})();
"use strict";

/**
 * better-details-polyfill: <details> polyfill for better-dom
 * @version 2.1.0 Tue, 16 Dec 2014 17:37:23 GMT
 * @link https://github.com/chemerisuk/better-details-polyfill
 * @copyright 2014 Maksim Chemerisuk
 * @license MIT
 */
(function (DOM, VK_SPACE, VK_ENTER) {
    "use strict";

    // add ARIA attributes for ALL browsers because current
    // native implementaions are weak:
    // https://bugs.webkit.org/show_bug.cgi?id=131111

    var hasNativeSupport = typeof DOM.create("details").get("open") === "boolean";
    if (hasNativeSupport) {
        return;
    }

    document.documentElement.dataset.detailsPolyfilled = true;

    DOM.extend("details", {
        constructor: function constructor() {
            // http://www.w3.org/html/wg/drafts/html/master/interactive-elements.html#the-details-element
            this.set("role", "group").on("toggle", ["stopPropagation"], this._changeOpen.bind(this));

            var firstSummary = this.children("summary")[0];
            // If there is no child summary element, the user agent
            // should provide its own legend (e.g. "Details")
            if (!firstSummary) firstSummary = DOM.create("summary>`Details`");
            // make the first <summary> always to be the first child
            if (this.child(0) !== firstSummary) {
                this.prepend(firstSummary);
            }
            // http://www.w3.org/html/wg/drafts/html/master/interactive-elements.html#the-summary-element
            firstSummary.set("role", "button");
            /* istanbul ignore if */
            if (!hasNativeSupport) {
                this.define("open", this._getOpen, this._setOpen);

                this._initSummary(firstSummary);
            }

            this._changeOpen();
        },
        _initSummary: function _initSummary(summary) {
            summary.set("tabindex", 0).on("keydown", ["which"], this._toggleOpen.bind(this)).on("click", this._toggleOpen.bind(this));
        },
        _changeOpen: function _changeOpen(stop) {
            this.set("aria-expanded", this.get("open"));

            if (stop) stop(); // toggle event should not bubble
        },
        _getOpen: function _getOpen(attrValue) {
            attrValue = String(attrValue).toLowerCase();

            return attrValue === "" || attrValue === "open";
        },
        _setOpen: function _setOpen(propValue) {
            var this$0 = this;
            var currentValue = this.get("open");

            propValue = !!propValue;

            if (currentValue !== propValue) {
                // have to use setTimeout because the event should
                // fire AFTER the attribute was updated
                setTimeout(function () {
                    this$0.fire("toggle");
                }, 0);
            }

            return propValue ? "" : null;
        },
        _toggleOpen: function _toggleOpen(key) {
            if (!key || key === VK_SPACE || key === VK_ENTER) {
                this.set("open", !this.get("open"));
                // need to prevent default, because
                // the enter key usually submits a form
                return false;
            }
        }
    });
})(window.DOM, 32, 13);

// DOM.importStyles("@media all", "summary:first-child~*{display:none}details[open]>*{display:block}details>summary:first-child{display:block}details:before{content:'\\25BA';font-family:serif;font-size:.75em;margin-top:.25em;margin-left:.25em;position:absolute}details[open]:before{content:'\\25BC'}summary:first-child{text-indent:1.25em}details::before{content:'';width:0;height:0;border:solid transparent;border-left-color:inherit;border-width:.25em .5em;margin-top:.75em;margin-left:.5em;-webkit-transform:rotate(0deg) scale(1.5);-ms-transform:rotate(0deg) scale(1.5);transform:rotate(0deg) scale(1.5);-webkit-transform-origin:25% 50%;-ms-transform-origin:25% 50%;transform-origin:25% 50%;-webkit-transition:-webkit-transform .15s ease-out;transition:transform .15s ease-out}details[open]::before{content:'';-webkit-transform:rotate(90deg) scale(1.5);-ms-transform:rotate(90deg) scale(1.5);transform:rotate(90deg) scale(1.5)}summary::-webkit-details-marker{display:none}");
// DOM.importStyles("@media all", `html[data-details-polyfilled="true"] summary:first-child~*{display:none}html[data-details-polyfilled="true"] details[open]>*{display:block} html[data-details-polyfilled="true"] details>summary:first-child{display:block}html[data-details-polyfilled="true"] details:before{content:'\\25BA';font-family:serif;font-size:.75em;margin-top:.25em;margin-left:.25em;position:absolute}html[data-details-polyfilled="true"] details[open]:before{content:'\\25BC'}html[data-details-polyfilled="true"] summary:first-child{text-indent:1.25em}html[data-details-polyfilled="true"] details::before{content:'';width:0;height:0;border:solid transparent;border-left-color:inherit;border-width:.25em .5em;margin-top:.75em;margin-left:.5em;-webkit-transform:rotate(0deg) scale(1.5);-ms-transform:rotate(0deg) scale(1.5);transform:rotate(0deg) scale(1.5);-webkit-transform-origin:25% 50%;-ms-transform-origin:25% 50%;transform-origin:25% 50%;-webkit-transition:-webkit-transform .15s ease-out;transition:transform .15s ease-out}html[data-details-polyfilled="true"] details[open]::before{content:'';-webkit-transform:rotate(90deg) scale(1.5);-ms-transform:rotate(90deg) scale(1.5);transform:rotate(90deg) scale(1.5)}html[data-details-polyfilled="true"] summary::-webkit-details-marker{display:none}`);
'use strict';

var HT = HT || {};
head.ready(function () {

  // var $status = $("div[role=status]");

  // var lastMessage; var lastTimer;
  // HT.update_status = function(message) {
  //     if ( lastMessage != message ) {
  //       if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

  //       setTimeout(() => {
  //         $status.text(message);
  //         lastMessage = message;
  //         console.log("-- status:", message);
  //       }, 50);
  //       lastTimer = setTimeout(() => {
  //         $status.get(0).innerText = '';
  //       }, 500);

  //     }
  // }

  HT.renew_auth = function (entityID) {
    var source = arguments.length > 1 && arguments[1] !== undefined ? arguments[1] : 'image';

    if (HT.__renewing) {
      return;
    }
    HT.__renewing = true;
    setTimeout(function () {
      var reauth_url = 'https://' + HT.service_domain + '/Shibboleth.sso/Login?entityID=' + entityID + '&target=' + encodeURIComponent(window.location.href);
      var retval = window.confirm('We\'re having a problem with your session; select OK to log in again.');
      if (retval) {
        window.location.href = reauth_url;
      }
    }, 100);
  };

  HT.analytics = HT.analytics || {};
  HT.analytics.logAction = function (href, trigger) {
    if (href === undefined) {
      href = location.href;
    }
    var delim = href.indexOf(';') > -1 ? ';' : '&';
    if (trigger == null) {
      trigger = '-';
    }
    href += delim + 'a=' + trigger;
    // $.get(href);
    $.ajax(href, {
      complete: function complete(xhr, status) {
        var entityID = xhr.getResponseHeader('x-hathitrust-renew');
        if (entityID) {
          HT.renew_auth(entityID, 'logAction');
        }
      }
    });
  };

  $("body").on('click', 'a[data-tracking-category="outLinks"]', function (event) {
    // var trigger = $(this).data('tracking-action');
    // var label = $(this).data('tracking-label');
    // if ( label ) { trigger += ':' + label; }
    var trigger = 'out' + $(this).attr('href');
    HT.analytics.logAction(undefined, trigger);
  });
});
'use strict';

head.ready(function () {

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  var $emergency_access = $("#access-emergency-access");

  var delta = 5 * 60 * 1000;
  var last_seconds;
  var toggle_renew_link = function toggle_renew_link(date) {
    var now = Date.now();
    if (now >= date.getTime()) {
      var $link = $emergency_access.find("a[disabled]");
      $link.attr("disabled", null);
    }
  };

  var observe_expiration_timestamp = function observe_expiration_timestamp() {
    if (!HT || !HT.params || !HT.params.id) {
      return;
    }
    var data = $.cookie('HTexpiration', undefined, { json: true });
    if (!data) {
      return;
    }
    var seconds = data[HT.params.id];
    // console.log("AHOY OBSERVE", seconds, last_seconds);
    if (seconds == -1) {
      var $link = $emergency_access.find("p a").clone();
      $emergency_access.find("p").text("Your access has expired and cannot be renewed. Reload the page or try again later. Access has been provided through the ");
      $emergency_access.find("p").append($link);
      var $action = $emergency_access.find(".alert--emergency-access--options a");
      $action.attr('href', window.location.href);
      $action.text('Reload');
      return;
    }
    if (seconds > last_seconds) {
      var message = time2message(seconds);
      last_seconds = seconds;
      $emergency_access.find(".expires-display").text(message);
    }
  };

  var time2message = function time2message(seconds) {
    var date = new Date(seconds * 1000);
    var hours = date.getHours();
    var ampm = 'AM';
    if (hours > 12) {
      hours -= 12;ampm = 'PM';
    }
    if (hours == 12) {
      ampm = 'PM';
    }
    var minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = '0' + minutes;
    }
    var message = hours + ':' + minutes + ampm + ' ' + MONTHS[date.getMonth()] + ' ' + date.getDate();
    return message;
  };

  if ($emergency_access.length) {
    var expiration = $emergency_access.data('accessExpires');
    var seconds = parseInt($emergency_access.data('accessExpiresSeconds'), 10);
    var granted = $emergency_access.data('accessGranted');

    var now = Date.now() / 1000;
    var message = time2message(seconds);
    $emergency_access.find(".expires-display").text(message);
    $emergency_access.get(0).dataset.initialized = 'true';

    if (granted) {
      // set up a watch for the expiration time
      last_seconds = seconds;
      setInterval(function () {
        // toggle_renew_link(date);
        observe_expiration_timestamp();
      }, 500);
    }
  }

  if ($('#accessBannerID').length > 0) {
    var suppress = $('html').hasClass('supaccban');
    if (suppress) {
      return;
    }
    var debug = $('html').hasClass('htdev');
    var idhash = $.cookie('access.hathitrust.org', undefined, { json: true });
    var url = $.url(); // parse the current page URL
    var currid = url.param('id');
    if (idhash == null) {
      idhash = {};
    }

    var ids = [];
    for (var id in idhash) {
      if (idhash.hasOwnProperty(id)) {
        ids.push(id);
      }
    }

    if (ids.indexOf(currid) < 0 || debug) {
      var showAlert = function showAlert() {
        var html = $('#accessBannerID').html();
        var $alert = bootbox.dialog(html, [{ label: "OK", "class": "btn btn-primary btn-dismiss" }], { header: 'Special access', role: 'alertdialog' });
      };

      idhash[currid] = 1;
      // session cookie
      $.cookie('access.hathitrust.org', idhash, { json: true, path: '/', domain: '.hathitrust.org' });

      window.setTimeout(showAlert, 3000, true);
    }
  }

  $("details.details--alert").on('toggle', function (event) {
    var detail = event.target;
    var prefs = HT.prefs.get();
    prefs.pt = prefs.pt || {};
    prefs.pt.alerts = prefs.pt.alerts || {};
    prefs.pt.alerts[detail.getAttribute('id')] = detail.open ? 'open' : 'closed';
    HT.prefs.set(prefs);
  });
});
"use strict";

/*
 * classList.js: Cross-browser full element.classList implementation.
 * 1.2.20171210
 *
 * By Eli Grey, http://eligrey.com
 * License: Dedicated to the public domain.
 *   See https://github.com/eligrey/classList.js/blob/master/LICENSE.md
 */

/*global self, document, DOMException */

/*! @source http://purl.eligrey.com/github/classList.js/blob/master/classList.js */

if ("document" in self) {

	// Full polyfill for browsers with no classList support
	// Including IE < Edge missing SVGElement.classList
	if (!("classList" in document.createElement("_")) || document.createElementNS && !("classList" in document.createElementNS("http://www.w3.org/2000/svg", "g"))) {

		(function (view) {

			"use strict";

			if (!('Element' in view)) return;

			var classListProp = "classList",
			    protoProp = "prototype",
			    elemCtrProto = view.Element[protoProp],
			    objCtr = Object,
			    strTrim = String[protoProp].trim || function () {
				return this.replace(/^\s+|\s+$/g, "");
			},
			    arrIndexOf = Array[protoProp].indexOf || function (item) {
				var i = 0,
				    len = this.length;
				for (; i < len; i++) {
					if (i in this && this[i] === item) {
						return i;
					}
				}
				return -1;
			}
			// Vendors: please allow content code to instantiate DOMExceptions
			,
			    DOMEx = function DOMEx(type, message) {
				this.name = type;
				this.code = DOMException[type];
				this.message = message;
			},
			    checkTokenAndGetIndex = function checkTokenAndGetIndex(classList, token) {
				if (token === "") {
					throw new DOMEx("SYNTAX_ERR", "The token must not be empty.");
				}
				if (/\s/.test(token)) {
					throw new DOMEx("INVALID_CHARACTER_ERR", "The token must not contain space characters.");
				}
				return arrIndexOf.call(classList, token);
			},
			    ClassList = function ClassList(elem) {
				var trimmedClasses = strTrim.call(elem.getAttribute("class") || ""),
				    classes = trimmedClasses ? trimmedClasses.split(/\s+/) : [],
				    i = 0,
				    len = classes.length;
				for (; i < len; i++) {
					this.push(classes[i]);
				}
				this._updateClassName = function () {
					elem.setAttribute("class", this.toString());
				};
			},
			    classListProto = ClassList[protoProp] = [],
			    classListGetter = function classListGetter() {
				return new ClassList(this);
			};
			// Most DOMException implementations don't allow calling DOMException's toString()
			// on non-DOMExceptions. Error's toString() is sufficient here.
			DOMEx[protoProp] = Error[protoProp];
			classListProto.item = function (i) {
				return this[i] || null;
			};
			classListProto.contains = function (token) {
				return ~checkTokenAndGetIndex(this, token + "");
			};
			classListProto.add = function () {
				var tokens = arguments,
				    i = 0,
				    l = tokens.length,
				    token,
				    updated = false;
				do {
					token = tokens[i] + "";
					if (!~checkTokenAndGetIndex(this, token)) {
						this.push(token);
						updated = true;
					}
				} while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.remove = function () {
				var tokens = arguments,
				    i = 0,
				    l = tokens.length,
				    token,
				    updated = false,
				    index;
				do {
					token = tokens[i] + "";
					index = checkTokenAndGetIndex(this, token);
					while (~index) {
						this.splice(index, 1);
						updated = true;
						index = checkTokenAndGetIndex(this, token);
					}
				} while (++i < l);

				if (updated) {
					this._updateClassName();
				}
			};
			classListProto.toggle = function (token, force) {
				var result = this.contains(token),
				    method = result ? force !== true && "remove" : force !== false && "add";

				if (method) {
					this[method](token);
				}

				if (force === true || force === false) {
					return force;
				} else {
					return !result;
				}
			};
			classListProto.replace = function (token, replacement_token) {
				var index = checkTokenAndGetIndex(token + "");
				if (~index) {
					this.splice(index, 1, replacement_token);
					this._updateClassName();
				}
			};
			classListProto.toString = function () {
				return this.join(" ");
			};

			if (objCtr.defineProperty) {
				var classListPropDesc = {
					get: classListGetter,
					enumerable: true,
					configurable: true
				};
				try {
					objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
				} catch (ex) {
					// IE 8 doesn't support enumerable:true
					// adding undefined to fight this issue https://github.com/eligrey/classList.js/issues/36
					// modernie IE8-MSW7 machine has IE8 8.0.6001.18702 and is affected
					if (ex.number === undefined || ex.number === -0x7FF5EC54) {
						classListPropDesc.enumerable = false;
						objCtr.defineProperty(elemCtrProto, classListProp, classListPropDesc);
					}
				}
			} else if (objCtr[protoProp].__defineGetter__) {
				elemCtrProto.__defineGetter__(classListProp, classListGetter);
			}
		})(self);
	}

	// There is full or partial native classList support, so just check if we need
	// to normalize the add/remove and toggle APIs.

	(function () {
		"use strict";

		var testElement = document.createElement("_");

		testElement.classList.add("c1", "c2");

		// Polyfill for IE 10/11 and Firefox <26, where classList.add and
		// classList.remove exist but support only one argument at a time.
		if (!testElement.classList.contains("c2")) {
			var createMethod = function createMethod(method) {
				var original = DOMTokenList.prototype[method];

				DOMTokenList.prototype[method] = function (token) {
					var i,
					    len = arguments.length;

					for (i = 0; i < len; i++) {
						token = arguments[i];
						original.call(this, token);
					}
				};
			};
			createMethod('add');
			createMethod('remove');
		}

		testElement.classList.toggle("c3", false);

		// Polyfill for IE 10 and Firefox <24, where classList.toggle does not
		// support the second argument.
		if (testElement.classList.contains("c3")) {
			var _toggle = DOMTokenList.prototype.toggle;

			DOMTokenList.prototype.toggle = function (token, force) {
				if (1 in arguments && !this.contains(token) === !force) {
					return force;
				} else {
					return _toggle.call(this, token);
				}
			};
		}

		// replace() polyfill
		if (!("replace" in document.createElement("_").classList)) {
			DOMTokenList.prototype.replace = function (token, replacement_token) {
				var tokens = this.toString().split(" "),
				    index = tokens.indexOf(token + "");
				if (~index) {
					tokens = tokens.slice(index);
					this.remove.apply(this, tokens);
					this.add(replacement_token);
					this.add.apply(this, tokens.slice(1));
				}
			};
		}

		testElement = null;
	})();
}
'use strict';

head.ready(function () {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = '__NEW__'; // "b";

    var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

    var $toolbar = $(".collectionLinks .select-collection");
    var $errormsg = $(".errormsg");
    var $infomsg = $(".infomsg");

    function display_error(msg) {
        if (!$errormsg.length) {
            $errormsg = $('<div class="alert alert-error errormsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
        HT.update_status(msg);
    }

    function display_info(msg) {
        if (!$infomsg.length) {
            $infomsg = $('<div class="alert alert-info infomsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $infomsg.text(msg).show();
        HT.update_status(msg);
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function hide_info() {
        $infomsg.hide().text();
    }

    function get_url() {
        var url = "/cgi/mb";
        if (location.pathname.indexOf("/shcgi/") > -1) {
            url = "/shcgi/mb";
        }
        return url;
    }

    function parse_line(data) {
        var retval = {};
        var tmp = data.split("|");
        for (var i = 0; i < tmp.length; i++) {
            var kv = tmp[i].split("=");
            retval[kv[0]] = kv[1];
        }
        return retval;
    }

    function edit_collection_metadata(args) {

        var options = $.extend({ creating: false, label: "Save Changes" }, args);

        var $block = $('<form class="form-horizontal" action="mb">' + '<div class="control-group">' + '<label class="control-label" for="edit-cn">Collection Name</label>' + '<div class="controls">' + '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" required />' + '<span class="label counter" id="edit-cn-count">100</span>' + '</div>' + '</div>' + '<div class="control-group">' + '<label class="control-label" for="edit-desc">Description</label>' + '<div class="controls">' + '<textarea id="edit-desc" name="desc" rows="4" maxlength="255" class="input-large" placeholder="Add your collection description."></textarea>' + '<span class="label counter" id="edit-desc-count">255</span>' + '</div>' + '</div>' + '<div class="control-group">' + '<label class="control-label">Is this collection <strong>Public</strong> or <strong>Private</strong>?</label>' + '<div class="controls">' + '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > ' + '<label class="radio inline" for="edit-shrd-0">' + 'Private ' + '</label>' + '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > ' + '<label class="radio inline" for="edit-shrd-1">' + 'Public ' + '</label>' + '</div>' + '</div>' + '</form>');

        if (options.cn) {
            $block.find("input[name=cn]").val(options.cn);
        }

        if (options.desc) {
            $block.find("textarea[name=desc]").val(options.desc);
        }

        if (options.shrd != null) {
            $block.find("input[name=shrd][value=" + options.shrd + ']').attr("checked", "checked");
        } else if (!HT.login_status.logged_in) {
            $block.find("input[name=shrd][value=0]").attr("checked", "checked");
            $('<div class="alert alert-info"><strong>This collection will be temporary</strong>. Log in to create permanent and public collections.</div>').appendTo($block);
            // remove the <label> that wraps the radio button
            $block.find("input[name=shrd][value=1]").remove();
            $block.find("label[for='edit-shrd-1']").remove();
        }

        if (options.$hidden) {
            options.$hidden.clone().appendTo($block);
        } else {
            $("<input type='hidden' name='c' />").appendTo($block).val(options.c);
            $("<input type='hidden' name='a' />").appendTo($block).val(options.a);
        }

        if (options.iid) {
            $("<input type='hidden' name='iid' />").appendTo($block).val(options.iid);
        }

        var $dialog = bootbox.dialog($block, [{
            "label": "Cancel",
            "class": "btn-dismiss"
        }, {
            "label": options.label,
            "class": "btn btn-primary btn-dismiss",
            callback: function callback() {

                var form = $block.get(0);
                if (!form.checkValidity()) {
                    form.reportValidity();
                    return false;
                }

                var cn = $.trim($block.find("input[name=cn]").val());
                var desc = $.trim($block.find("textarea[name=desc]").val());

                if (!cn) {
                    // $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
                    return false;
                }

                display_info("Submitting; please wait...");
                submit_post({
                    a: 'additsnc',
                    cn: cn,
                    desc: desc,
                    shrd: $block.find("input[name=shrd]:checked").val()
                });
            }
        }]);

        $dialog.find("input[type=text],textarea").each(function () {
            var $this = $(this);
            var $count = $("#" + $this.attr('id') + "-count");
            var limit = $this.attr("maxlength");

            $count.text(limit - $this.val().length);

            $this.bind('keyup', function () {
                $count.text(limit - $this.val().length);
            });
        });
    }

    function submit_post(params) {
        var data = $.extend({}, { page: 'ajax', id: HT.params.id }, params);
        $.ajax({
            url: get_url(),
            data: data
        }).done(function (data) {
            var params = parse_line(data);
            hide_info();
            if (params.result == 'ADD_ITEM_SUCCESS') {
                // do something
                add_item_to_collist(params);
            } else if (params.result == 'ADD_ITEM_FAILURE') {
                display_error("Item could not be added at this time.");
            } else {
                console.log(data);
            }
        }).fail(function (jqXHR, textStatus, errorThrown) {
            console.log(textStatus, errorThrown);
        });
    }

    function add_item_to_collist(params) {
        var $ul = $(".collection-membership");
        var coll_href = get_url() + "?a=listis;c=" + params.coll_id;
        var $a = $("<a>").attr("href", coll_href).text(params.coll_name);
        $("<li></li>").appendTo($ul).append($a);
        $ul.parents("div").removeClass("hide");

        // $(".collection-membership-summary").text(IN_YOUR_COLLS_LABEL);

        // and then filter out the list from the select
        var $option = $toolbar.find("option[value='" + params.coll_id + "']");
        $option.remove();

        HT.update_status('Added collection ' + params.coll_name + ' to your list.');
    }

    function confirm_large(collSize, addNumItems, callback) {

        if (collSize <= 1000 && collSize + addNumItems > 1000) {
            var numStr;
            if (addNumItems > 1) {
                numStr = "these " + addNumItems + " items";
            } else {
                numStr = "this item";
            }
            var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 48 hours.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?";

            confirm(msg, function (answer) {
                if (answer) {
                    callback();
                }
            });
        } else {
            // all other cases are okay
            callback();
        }
    }

    // $("#PTaddItemBtn").click(function(e) {
    $("body").on('click', '#PTaddItemBtn', function (e) {
        e.preventDefault();
        var action = 'addI';

        hide_error();

        var selected_collection_id = $toolbar.find("select").val();
        var selected_collection_name = $toolbar.find("select option:selected").text();

        if (selected_collection_id == DEFAULT_COLL_MENU_OPTION) {
            display_error("You must select a collection.");
            return;
        }

        if (selected_collection_id == NEW_COLL_MENU_OPTION) {
            // deal with new collection
            edit_collection_metadata({
                creating: true,
                c: selected_collection_id,
                id: HT.params.id,
                a: action
            });
            return;
        }

        // var add_num_items = 1;
        // var COLL_SIZE_ARRAY = getCollSizeArray();
        // var coll_size = COLL_SIZE_ARRAY[selected_collection_id];
        // confirm_large(coll_size, add_num_items, function() {
        //     $form.submit();
        // })

        display_info("Adding item to your collection; please wait...");
        submit_post({
            c2: selected_collection_id,
            a: 'addits'
        });
    });
});
"use strict";

head.ready(function () {

    if (!$("html").is(".crms")) {
        return;
    }

    // if ( $(".navbar-static-top").data('loggedin') != 'YES' && window.location.protocol == 'https:' ) {
    //     // horrible hack
    //     var target = window.location.href.replace(/\$/g, '%24');
    //     var href = 'https://' + window.location.hostname + '/Shibboleth.sso/Login?entityID=https://shibboleth.umich.edu/idp/shibboleth&target=' + target;
    //     window.location.href = href;
    //     return;
    // }

    // define CRMS state
    HT.crms_state = 'CRMS-US';

    // force CRMS users to a fixed image size
    HT.force_size = 200;

    var i = window.location.href.indexOf('skin=crmsworld');
    if (i + 1 != 0) {
        HT.crms_state = 'CRMS-World';
    }

    // display bib information
    var $div = $(".bibLinks");
    var $p = $div.find("p:first");
    $p.find("span:empty").each(function () {
        // $(this).text($(this).attr("content")).addClass("blocked");
        var fragment = '<span class="blocked"><strong>{label}:</strong> {content}</span>';
        fragment = fragment.replace('{label}', $(this).attr('property').substr(3)).replace('{content}', $(this).attr("content"));
        $p.append(fragment);
    });

    var $link = $("#embedHtml");
    console.log("AHOY EMBED", $link);
    $link.parent().remove();

    $link = $("a[data-toggle='PT Find in a Library']");
    $link.parent().remove();
});
'use strict';

// downloader

var HT = HT || {};
var photocopier_message = 'The copyright law of the United States (Title 17, U.S. Code) governs the making of reproductions of copyrighted material. Under certain conditions specified in the law, libraries and archives are authorized to furnish a reproduction. One of these specific conditions is that the reproduction is not to be “used for any purpose other than private study, scholarship, or research.” If a user makes a request for, or later uses, a reproduction for purposes in excess of “fair use,” that user may be liable for copyright infringement.';

HT.Downloader = {

    init: function init(options) {
        this.options = $.extend({}, this.options, options);
        this.id = this.options.params.id;
        this.pdf = {};
        return this;
    },

    options: {},

    start: function start() {
        var self = this;
        this.bindEvents();
    },

    bindEvents: function bindEvents() {
        var self = this;
    },

    explainPdfAccess: function explainPdfAccess(link) {
        var html = $("#noDownloadAccess").html();
        html = html.replace('{DOWNLOAD_LINK}', $(this).attr("href"));
        this.$dialog = bootbox.alert(html);
    },

    downloadPdf: function downloadPdf(config) {
        var self = this;

        self.src = config.src;
        self.item_title = config.item_title;
        self.$config = config;

        var html = '<div class="initial"><p>Setting up the download...</div>' + '<div class="offscreen" role="status" aria-atomic="true" aria-live="polite"></div>' + '<div class="progress progress-striped active hide" aria-hidden="true">' + '<div class="bar" width="0%"></div>' + '</div>' + '<div><p><a href="https://www.hathitrust.org/help_digital_library#DownloadTime" target="_blank">What affects the download speed?</a></p></div>';

        var header = 'Building your ' + self.item_title;
        var total = self.$config.selection.pages.length;
        if (total > 0) {
            var suffix = total == 1 ? 'page' : 'pages';
            header += ' (' + total + ' ' + suffix + ')';
        }

        self.$dialog = bootbox.dialog(html, [{
            label: 'Cancel',
            'class': 'btn-x-dismiss btn',
            callback: function callback() {
                if (self.$dialog.data('deactivated')) {
                    self.$dialog.closeModal();
                    return;
                }
                $.ajax({
                    url: self.src + ';callback=HT.downloader.cancelDownload;stop=1',
                    dataType: 'script',
                    cache: false,
                    error: function error(req, textStatus, errorThrown) {
                        console.log("DOWNLOAD CANCELLED ERROR");
                        // self.$dialog.closeModal();
                        console.log(req, textStatus, errorThrown);
                        if (req.status == 503) {
                            self.displayWarning(req);
                        } else {
                            self.displayError();
                        }
                    }
                });
            }
        }], {
            header: header,
            id: 'download'
        });
        self.$status = self.$dialog.find("div[role=status]");

        self.requestDownload();
    },

    requestDownload: function requestDownload() {
        var self = this;
        var data = {};

        if (self.$config.selection.pages.length > 0) {
            data['seq'] = self.$config.selection.seq;
        }

        switch (self.$config.downloadFormat) {
            case 'image':
                data['format'] = 'image/jpeg';
                data['target_ppi'] = 300;
                data['bundle_format'] = 'zip';
                break;
            case 'plaintext-zip':
                data['bundle_format'] = 'zip';
                break;
            case 'plaintext':
                data['bundle_format'] = 'text';
                break;
        }

        $.ajax({
            url: self.src.replace(/;/g, '&') + '&callback=HT.downloader.startDownloadMonitor',
            dataType: 'script',
            cache: false,
            data: data,
            error: function error(req, textStatus, errorThrown) {
                console.log("DOWNLOAD STARTUP NOT DETECTED");
                if (self.$dialog) {
                    self.$dialog.closeModal();
                }
                if (req.status == 429) {
                    self.displayWarning(req);
                } else {
                    self.displayError(req);
                }
            }
        });
    },

    cancelDownload: function cancelDownload(progress_url, download_url, total) {
        var self = this;
        self.clearTimer();
        self.$dialog.closeModal();
    },

    startDownloadMonitor: function startDownloadMonitor(progress_url, download_url, total) {
        var self = this;

        if (self.timer) {
            console.log("ALREADY POLLING");
            return;
        }

        self.pdf.progress_url = progress_url;
        self.pdf.download_url = download_url;
        self.pdf.total = total;

        self.is_running = true;
        self.num_processed = 0;
        self.i = 0;

        self.timer = setInterval(function () {
            self.checkStatus();
        }, 2500);
        // do it once the first time
        self.checkStatus();
    },

    checkStatus: function checkStatus() {
        var self = this;
        self.i += 1;
        $.ajax({
            url: self.pdf.progress_url,
            data: { ts: new Date().getTime() },
            cache: false,
            dataType: 'json',
            success: function success(data) {
                var status = self.updateProgress(data);
                self.num_processed += 1;
                if (status.done) {
                    self.clearTimer();
                } else if (status.error && status.num_attempts > 100) {
                    self.$dialog.closeModal();
                    self.displayProcessError();
                    self.clearTimer();
                    self.logError();
                } else if (status.error) {
                    self.$dialog.closeModal();
                    self.displayError();
                    self.clearTimer();
                }
            },
            error: function error(req, textStatus, errorThrown) {
                console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                self.$dialog.closeModal();
                self.clearTimer();
                if (req.status == 404 && (self.i > 25 || self.num_processed > 0)) {
                    self.displayError();
                }
            }
        });
    },

    updateProgress: function updateProgress(data) {
        var self = this;
        var status = { done: false, error: false };
        var percent;

        var current = data.status;
        if (current == 'EOT' || current == 'DONE') {
            status.done = true;
            percent = 100;
        } else {
            current = data.current_page;
            percent = 100 * (current / self.pdf.total);
        }

        if (self.last_percent != percent) {
            self.last_percent = percent;
            self.num_attempts = 0;
        } else {
            self.num_attempts += 1;
        }

        // try 100 times, which amounts to ~100 seconds
        if (self.num_attempts > 100) {
            status.error = true;
        }

        if (self.$dialog.find(".initial").is(":visible")) {
            self.$dialog.find(".initial").html('<p>Please wait while we build your ' + self.item_title + '.</p>');
            self.$dialog.find(".progress").removeClass("hide");
            self.updateStatusText('Please wait while we build your ' + self.item_title + '.');
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html('<p>All done! Your ' + self.item_title + ' is ready for download. <span class="offscreen">Select ' + download_key + ' to download.</span></p>');
            self.updateStatusText('All done! Your ' + self.item_title + ' is ready for download. Select ' + download_key + ' to download.');

            // self.$dialog.find(".done").show();
            var $download_btn = self.$dialog.find('.download-pdf');
            if (!$download_btn.length) {
                $download_btn = $('<a class="download-pdf btn btn-primary" download="download">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
                if ($download_btn.get(0).download == undefined) {
                    $download_btn.attr('target', '_blank');
                }
                $download_btn.appendTo(self.$dialog.find(".modal__footer")).on('click', function (e) {
                    // self.$link.trigger("click.google");

                    HT.analytics.trackEvent({
                        label: '-',
                        category: 'PT',
                        action: 'PT Download - ' + self.$config.downloadFormat.toUpperCase() + ' - ' + self.$config.trackingAction
                    });
                    if (window.hj) {
                        hj('tagRecording', ['PT Download - ' + self.$config.downloadFormat.toUpperCase() + ' - ' + self.$config.trackingAction]);
                    };

                    setTimeout(function () {
                        self.$dialog.closeModal();
                        $download_btn.remove();
                        // HT.reader.controls.selectinator._clearSelection();
                        // HT.reader.emit('downloadDone');
                    }, 1500);
                    e.stopPropagation();
                });
                $download_btn.focus();
            }
            self.$dialog.data('deactivated', true);
            // self.updateStatusText(`Your ${self.item_title} is ready for download. Press return to download.`);
            // still could cancel
        } else {
            self.$dialog.find(".initial").text('Please wait while we build your ' + self.item_title + ' (' + Math.ceil(percent) + '% completed).');
            self.updateStatusText(Math.ceil(percent) + '% completed');
        }

        return status;
    },

    clearTimer: function clearTimer() {
        var self = this;
        if (self.timer) {
            clearInterval(self.timer);
            self.timer = null;
        }
    },

    displayWarning: function displayWarning(req) {
        var self = this;
        var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
        var rate = req.getResponseHeader('X-Choke-Rate');

        if (timeout <= 5) {
            // just punt and wait it out
            setTimeout(function () {
                self.requestDownload();
            }, 5000);
            return;
        }

        timeout *= 1000;
        var now = new Date().getTime();
        var countdown = Math.ceil((timeout - now) / 1000);

        var html = ('<div>' + '<p>You have exceeded the download rate of {rate}. You may proceed in <span id="throttle-timeout">{countdown}</span> seconds.</p>' + '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' + '</div>').replace('{rate}', rate).replace('{countdown}', countdown);

        self.$dialog = bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-primary',
            callback: function callback() {
                clearInterval(self.countdown_timer);
                return true;
            }
        }]);

        self.countdown_timer = setInterval(function () {
            countdown -= 1;
            self.$dialog.find("#throttle-timeout").text(countdown);
            if (countdown == 0) {
                clearInterval(self.countdown_timer);
            }
            console.log("TIC TOC", countdown);
        }, 1000);
    },

    displayProcessError: function displayProcessError(req) {
        var html = '<p>' + 'Unfortunately, the process for creating your PDF has been interrupted. ' + 'Please click "OK" and try again.' + '</p>' + '<p>' + 'If this problem persists and you are unable to download this PDF after repeated attempts, ' + 'please notify us at <a href="/cgi/feedback/?page=form" data=m="pt" data-toggle="feedback tracking-action" data-tracking-action="Show Feedback">feedback@issues.hathitrust.org</a> ' + 'and include the URL of the book you were trying to access when the problem occurred.' + '</p>';

        // bootbox.alert(html);
        bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-inverse'
        }], { classes: 'error' });

        console.log(req);
    },

    displayError: function displayError(req) {
        var html = '<p>' + 'There was a problem building your ' + this.item_title + '; staff have been notified.' + '</p>' + '<p>' + 'Please try again in 24 hours.' + '</p>';

        // bootbox.alert(html);
        bootbox.dialog(html, [{
            label: 'OK',
            'class': 'btn-dismiss btn-inverse'
        }], { classes: 'error' });

        console.log(req);
    },

    logError: function logError() {
        var self = this;
        $.get(self.src + ';num_attempts=' + self.num_attempts);
    },

    updateStatusText: function updateStatusText(message) {
        var self = this;
        if (self._lastMessage != message) {
            if (self._lastTimer) {
                clearTimeout(self._lastTimer);self._lastTimer = null;
            }

            setTimeout(function () {
                self.$status.text(message);
                self._lastMessage = message;
                console.log("-- status:", message);
            }, 50);
            self._lastTimer = setTimeout(function () {
                self.$status.get(0).innerText = '';
            }, 500);
        }
    },

    EOT: true

};

var downloadForm;
var downloadFormatOptions;
var rangeOptions;
var downloadIdx = 0;

head.ready(function () {

    downloadForm = document.querySelector('#form-download-module');
    if (!downloadForm) {
        return;
    }

    HT.downloader = Object.create(HT.Downloader).init({
        params: HT.params
    });

    HT.downloader.start();

    // non-jquery?
    downloadFormatOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('input[name="download_format"]'));
    rangeOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('[data-download-format-target]'));

    var downloadSubmit = downloadForm.querySelector('[type="submit"]');

    var hasFullPdfAccess = downloadForm.dataset.fullPdfAccess == 'allow';

    var updateDownloadFormatRangeOptions = function updateDownloadFormatRangeOptions(option) {
        rangeOptions.forEach(function (rangeOption) {
            var input = rangeOption.querySelector('input');
            input.disabled = !rangeOption.matches('[data-download-format-target~="' + option.value + '"]');
        });

        // if ( ! hasFullPdfAccess ) {
        //   var checked = downloadForm.querySelector(`[data-download-format-target][data-view-target~="${HT.reader.view.name}"] input:checked`);
        //   if ( ! checked ) {
        //       // check the first one
        //       var input = downloadForm.querySelector(`[data-download-format-target][data-view-target~="${HT.reader.view.name}"] input`);
        //       input.checked = true;
        //   }
        // }

        var current_view = HT.reader && HT.reader.view ? HT.reader.view.name : 'search'; // pick a default
        var checked = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + current_view + '"] input:checked');
        if (!checked) {
            // check the first one
            var input = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + current_view + '"] input');
            if (input) {
                input.checked = true;
            }
        }
    };
    downloadFormatOptions.forEach(function (option) {
        option.addEventListener('change', function (event) {
            updateDownloadFormatRangeOptions(this);
        });
    });

    rangeOptions.forEach(function (div) {
        var input = div.querySelector('input');
        input.addEventListener('change', function (event) {
            downloadFormatOptions.forEach(function (formatOption) {
                formatOption.disabled = !(div.dataset.downloadFormatTarget.indexOf(formatOption.value) > -1);
            });
        });
    });

    HT.downloader.updateDownloadFormatRangeOptions = function () {
        var formatOption = downloadFormatOptions.find(function (input) {
            return input.checked;
        });
        updateDownloadFormatRangeOptions(formatOption);
    };

    // default to PDF
    var pdfFormatOption = downloadFormatOptions.find(function (input) {
        return input.value == 'pdf';
    });
    pdfFormatOption.checked = true;
    updateDownloadFormatRangeOptions(pdfFormatOption);

    var tunnelForm = document.querySelector('#tunnel-download-module');

    downloadForm.addEventListener('submit', function (event) {
        var formatOption = downloadForm.querySelector('input[name="download_format"]:checked');
        var rangeOption = downloadForm.querySelector('input[name="range"]:checked:not(:disabled)');

        var printable;

        event.preventDefault();
        event.stopPropagation();

        if (!rangeOption) {
            // no valid range option was chosen
            alert("Please choose a valid range for this download format.");
            event.preventDefault();
            return false;
        }

        var action = tunnelForm.dataset.actionTemplate + (formatOption.value == 'plaintext-zip' ? 'plaintext' : formatOption.value);

        var selection = { pages: [] };
        if (rangeOption.value == 'selected-pages') {
            selection.pages = HT.reader.controls.selectinator._getPageSelection();
            selection.isSelection = true;
            if (selection.pages.length == 0) {
                var buttons = [];

                var msg = ["<p>You haven't selected any pages to download.</p>"];
                if (HT.reader.view.name == '2up') {
                    msg.push("<p>To select pages, click in the upper left or right corner of the page.");
                    msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-flip.gif\" /></p>");
                } else {
                    msg.push("<p>To select pages, click in the upper right corner of the page.");
                    if (HT.reader.view.name == 'thumb') {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-thumb.gif\" /></p>");
                    } else {
                        msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-scroll.gif\" /></p>");
                    }
                }
                msg.push("<p><tt>shift + click</tt> to de/select the pages between this page and a previously selected page.");
                msg.push("<p>Pages you select will be listed in the download module.");

                msg = msg.join("\n");

                buttons.push({
                    label: "OK",
                    'class': 'btn-dismiss'
                });
                bootbox.dialog(msg, buttons);

                event.preventDefault();
                return false;
            }
        } else if (rangeOption.value.indexOf('current-page') > -1) {
            var page;
            switch (rangeOption.value) {
                case 'current-page':
                    page = [HT.reader.view.currentLocation()];
                    break;
                case 'current-page-verso':
                    page = [HT.reader.view.currentLocation('VERSO')];
                    break;
                case 'current-page-recto':
                    page = [HT.reader.view.currentLocation('RECTO')];
                    break;
            }
            if (!page) {
                // probably impossible?
            }
            selection.pages = [page];
        }

        if (selection.pages.length > 0) {
            selection.seq = HT.reader.controls.selectinator ? HT.reader.controls.selectinator._getFlattenedSelection(selection.pages) : selection.pages;
        }

        if (rangeOption.dataset.isPartial == 'true' && selection.pages.length <= 10) {

            // delete any existing inputs
            tunnelForm.querySelectorAll('input:not([data-fixed])').forEach(function (input) {
                tunnelForm.removeChild(input);
            });

            if (formatOption.value == 'image') {
                var size_attr = "target_ppi";
                var image_format_attr = 'format';
                var size_value = "300";
                if (selection.pages.length == 1) {
                    // slight difference
                    action = '/cgi/imgsrv/image';
                    size_attr = "size";
                    size_value = "ppi:300";
                }

                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", size_attr);
                input.setAttribute("value", size_value);
                tunnelForm.appendChild(input);

                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", image_format_attr);
                input.setAttribute("value", 'image/jpeg');
                tunnelForm.appendChild(input);
            } else if (formatOption.value == 'plaintext-zip') {
                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", 'bundle_format');
                input.setAttribute("value", "zip");
                tunnelForm.appendChild(input);
            }

            selection.seq.forEach(function (range) {
                var input = document.createElement('input');
                input.setAttribute("type", "hidden");
                input.setAttribute("name", "seq");
                input.setAttribute("value", range);
                tunnelForm.appendChild(input);
            });

            tunnelForm.action = action;
            // HT.disableUnloadTimeout = true;

            // remove old iframes
            document.querySelectorAll('iframe.download-module').forEach(function (iframe) {
                document.body.removeChild(iframe);
            });

            downloadIdx += 1;
            var tracker = 'D' + downloadIdx + ':';
            var tracker_input = document.createElement('input');
            tracker_input.setAttribute('type', 'hidden');
            tracker_input.setAttribute('name', 'tracker');
            tracker_input.setAttribute('value', tracker);
            tunnelForm.appendChild(tracker_input);
            var iframe = document.createElement('iframe');
            iframe.setAttribute('name', 'download-module-' + downloadIdx);
            iframe.setAttribute('aria-hidden', 'true');
            iframe.setAttribute('class', 'download-module');
            iframe.style.opacity = 0;
            document.body.appendChild(iframe);
            tunnelForm.setAttribute('target', iframe.getAttribute('name'));

            downloadSubmit.disabled = true;
            downloadSubmit.classList.add('btn-loading');

            var trackerInterval = setInterval(function () {
                var value = $.cookie('tracker') || '';
                if (HT.is_dev) {
                    console.log("--?", tracker, value);
                }
                if (value.indexOf(tracker) > -1) {
                    $.removeCookie('tracker', { path: '/' });
                    clearInterval(trackerInterval);
                    downloadSubmit.classList.remove('btn-loading');
                    downloadSubmit.disabled = false;
                    HT.disableUnloadTimeout = false;
                }
            }, 100);

            HT.analytics.trackEvent({
                label: '-',
                category: 'PT',
                action: 'PT Download - ' + formatOption.value.toUpperCase() + ' - ' + rangeOption.value
            });
            if (window.hj) {
                hj('tagRecording', ['PT Download - ' + formatOption.value.toUpperCase() + ' - ' + rangeOption.value]);
            };

            tunnelForm.submit();

            return false;
        }

        var _format_titles = {};
        _format_titles.pdf = 'PDF';
        _format_titles.epub = 'EPUB';
        _format_titles.plaintext = 'Text (.txt)';
        _format_titles['plaintext-zip'] = 'Text (.zip)';
        _format_titles.image = 'Image (JPEG)';

        // invoke the downloader
        HT.downloader.downloadPdf({
            src: action + '?id=' + HT.params.id,
            item_title: _format_titles[formatOption.value],
            selection: selection,
            downloadFormat: formatOption.value,
            trackingAction: rangeOption.value
        });

        return false;
    });
});
"use strict";

// supply method for creating an embeddable URL
head.ready(function () {

    var side_short = "450";
    var side_long = "700";
    var htId = HT.params.id;
    var embedHelpLink = "https://www.hathitrust.org/embed";

    var codeblock_txt;
    var codeblock_txt_a = function codeblock_txt_a(w, h) {
        return '<iframe width="' + w + '" height="' + h + '" ';
    };
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $('<div class="embedUrlContainer">' + '<h3>Embed This Book ' + '<a id="embedHelpIcon" default-form="data-default-form" ' + 'href="' + embedHelpLink + '" target="_blank"><i class="icomoon icomoon-help" aria-hidden="true"></i><span class="offscreen">Help: Embedding HathiTrust Books</span></a></h3>' + '<form>' + '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' + '    <label for="codeblock" class="offscreen">Code Block</label>' + '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' + codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + '<div class="controls">' + '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' + '<label class="radio inline" for="view-scroll">' + '<span class="icomoon icomoon-scroll"/> Scroll View ' + '</label>' + '<input type="radio" name="view" id="view-flip" value="1" >' + '<label class="radio inline" for="view-flip">' + '<span class="icomoon icomoon-book-alt2"/> Flip View ' + '</label>' + '</div>' + '</form>' + '</div>');

    // $("#embedHtml").click(function(e) {
    $("body").on('click', '#embedHtml', function (e) {
        e.preventDefault();
        bootbox.dialog($block, [{
            "label": "Cancel",
            "class": "btn-dismiss"
        }]);

        // Custom width for bounding '.modal' 
        $block.closest('.modal').addClass("bootboxMediumWidth");

        // Select entirety of codeblock for easy copying
        var textarea = $block.find("textarea[name=codeblock]");
        textarea.on("click", function () {
            $(this).select();
        });

        // Modify codeblock to one of two views 
        $('input:radio[id="view-scroll"]').click(function () {
            codeblock_txt = codeblock_txt_a(side_short, side_long) + codeblock_txt_b;
            textarea.val(codeblock_txt);
        });
        $('input:radio[id="view-flip"]').click(function () {
            codeblock_txt = codeblock_txt_a(side_long, side_short) + codeblock_txt_b;
            textarea.val(codeblock_txt);
        });
    });
});
'use strict';

// supply method for feedback system
var HT = HT || {};
HT.feedback = {};
HT.feedback.dialog = function () {
    var html = '<form>' + '    <fieldset>' + '        <legend>Email Address</legend>' + '        <label for="email" class="offscreen">EMail Address</label>' + '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' + '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Overall page readability and quality</legend>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-1" value="readable" />' + '            <label class="radio" for="pt-feedback-quality-1" >' + '                Few problems, entire page is readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-2" value="someproblems" />' + '            <label class="radio" for="pt-feedback-quality-2">' + '                Some problems, but still readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="difficult" id="pt-feedback-quality-3" />' + '            <label class="radio" for="pt-feedback-quality-3">' + '                Significant problems, difficult or impossible to read' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="none" checked="checked" id="pt-feedback-quality-4" />' + '            <label class="radio" for="pt-feedback-quality-4">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Specific page image problems?</legend>' + '        <div class="alert alert-help">Select any that apply</div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-1" />' + '            <label for="pt-feedback-problems-1">' + '                Missing parts of the page' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-2"  />' + '            <label for="pt-feedback-problems-2">' + '                Blurry text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="curved" value="1" id="pt-feedback-problems-3"  />' + '            <label for="pt-feedback-problems-3">' + '                Curved or distorted text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <label for="pt-feedback-problems-other">Other problem </label><input type="text" class="input-medium" name="other" value="" id="pt-feedback-problems-other"  />' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Problems with access rights?</legend>' + '        <span class="help-block" style="margin-bottom: 1rem;"><strong>' + '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' + '        </strong></span>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="noaccess" id="pt-feedback-access-1" />' + '            <label for="pt-feedback-access-1">' + '                This item is in the public domain, but I don\'t have access to it.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="access" id="pt-feedback-access-2" />' + '            <label for="pt-feedback-access-2">' + '                    I have access to this item, but should not.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="none" checked="checked" id="pt-feedback-access-3" />' + '            <label for="pt-feedback-access-3">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Other problems or comments?</legend>' + '        <p>' + '            <label class="offscreen" for="comments">Other problems or comments?</label>' + '            <textarea id="comments" name="comments" rows="3"></textarea>' + '        </p>' + '    </fieldset>' + '</form>';

    var $form = $(html);

    // hidden fields
    $("<input type='hidden' name='SysID' />").val(HT.params.id).appendTo($form);
    $("<input type='hidden' name='RecordURL' />").val(HT.params.RecordURL).appendTo($form);

    if (HT.crms_state) {
        $("<input type='hidden' name='CRMS' />").val(HT.crms_state).appendTo($form);
        var $email = $form.find("#email");
        $email.val(HT.crms_state);
        $email.hide();
        $("<span>" + HT.crms_state + "</span><br />").insertAfter($email);
        $form.find(".help-block").hide();
    }

    if (HT.reader) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    } else if (HT.params.seq) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    }
    $("<input type='hidden' name='view' />").val(HT.params.view).appendTo($form);

    // if ( HT.crms_state ) {
    //     $form.find("#email").val(HT.crms_state);
    // }


    return $form;
};
"use strict";

var HT = HT || {};
head.ready(function () {

  HT.analytics.getContentGroupData = function () {
    // cheat
    var suffix = '';
    var content_group = 4;
    if ($("#section").data("view") == 'restricted') {
      content_group = 2;
      suffix = '#restricted';
    } else if (window.location.href.indexOf("debug=super") > -1) {
      content_group = 3;
      suffix = '#super';
    }
    return { index: content_group, value: HT.params.id + suffix };
  };

  HT.analytics._simplifyPageHref = function (href) {
    var url = $.url(href);
    var new_href = url.segment();
    new_href.push($("html").data('content-provider'));
    new_href.push(url.param("id"));
    var qs = '';
    if (new_href.indexOf("search") > -1 && url.param('q1')) {
      qs = '?q1=' + url.param('q1');
    }
    new_href = "/" + new_href.join("/") + qs;
    return new_href;
  };

  HT.analytics.getPageHref = function () {
    return HT.analytics._simplifyPageHref();
  };

  HT.analytics.getTitle = function () {
    var title = document.querySelector('title');
    if (location.pathname == '/cgi/pt' && title.dataset.title) {
      return title.dataset.title;
    }
    return document.title;
  };

  document.querySelector('title').dataset.title = document.title;
});
"use strict";

head.ready(function () {
  var $menu;var $trigger;var $header;var $navigator;
  HT = HT || {};

  HT.mobify = function () {

    // if ( $("html").is(".desktop") ) {
    //   $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
    // }

    $header = $("header");
    $navigator = $(".app--reader--navigator");
    if ($navigator.length) {
      document.body.dataset.expanded = true;
      // $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
      // $navigator.get(0).dataset.originalHeight = `{$navigator.outerHeight()}px`;
      // document.documentElement.style.setProperty('--navigator-height', `${$navigator.outerHeight()}px`);
      // var $expando = $navigator.find(".action-expando");
      var $expando = $("#action-expando");
      $expando.on('click', function () {
        document.body.dataset.expanded = !(document.body.dataset.expanded == 'true');
        this.setAttribute('aria-expanded', document.body.dataset.expanded == 'true');
        // var navigatorHeight = 0;
        // if ( document.documentElement.dataset.expanded == 'true' ) {
        //   navigatorHeight = $navigator.get(0).dataset.originalHeight;
        // }
        // document.documentElement.style.setProperty('--navigator-height', navigatorHeight);
      });

      if (HT.params.ui == 'embed') {
        setTimeout(function () {
          $expando.trigger('click');
        }, 1000);
      }
    }

    HT.$menu = $menu;

    var $sidebar = $("#sidebar");

    $trigger = $sidebar.find("button[aria-expanded]");

    $("#action-mobile-toggle-fullscreen").on('click', function () {
      document.documentElement.requestFullScreen();
    });

    HT.utils = HT.utils || {};

    // $sidebar.on('click', function(event) {
    $("body").on('click', '#sidebar', function (event) {
      // hide the sidebar
      var $this = $(event.target).closest("input,select,button,a");
      if ($this.is("input[type='text'],select")) {
        return;
      }
      if ($this.parents(".form-search-volume").length) {
        return;
      }
      if ($this.is("button,a")) {
        HT.toggle(false);
      }
    });

    if (HT && HT.utils && HT.utils.handleOrientationChange) {
      HT.utils.handleOrientationChange();
    }
    document.documentElement.dataset.expanded = 'true';
  };

  HT.toggle = function (state) {

    // $trigger.attr('aria-expanded', state);
    // $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', state);
    $("html").get(0).dataset.sidebarExpanded = state;
    $("html").get(0).dataset.view = state ? 'options' : 'viewer';

    document.body.dataset.sidebarNarrowState = state ? 'open' : 'closed';
    $("action-toggle-sidebar-narrow").attr('aria-expanded', state);

    // var xlink_href;
    // if ( $trigger.attr('aria-expanded') == 'true' ) {
    //   xlink_href = '#panel-expanded';
    // } else {
    //   xlink_href = '#panel-collapsed';
    // }
    // $trigger.find("svg use").attr("xlink:href", xlink_href);
  };

  setTimeout(HT.mobify, 1000);

  // var updateToolbarTopProperty = function() {
  //   var h = $("#sidebar .sidebar-toggle-button").outerHeight() || 40;
  //   var top = ( $("header").height() + h ) * 1.05;
  //   document.documentElement.style.setProperty('--toolbar-horizontal-top', top + 'px');
  // }
  // $(window).on('resize', updateToolbarTopProperty);
  // updateToolbarTopProperty();

  $("html").get(0).setAttribute('data-sidebar-expanded', false);
});
'use strict';

var _typeof = typeof Symbol === "function" && typeof Symbol.iterator === "symbol" ? function (obj) { return typeof obj; } : function (obj) { return obj && typeof Symbol === "function" && obj.constructor === Symbol && obj !== Symbol.prototype ? "symbol" : typeof obj; };

if (typeof Object.assign != 'function') {
  // Must be writable: true, enumerable: false, configurable: true
  Object.defineProperty(Object, "assign", {
    value: function assign(target, varArgs) {
      // .length of function is 2
      'use strict';

      if (target == null) {
        // TypeError if undefined or null
        throw new TypeError('Cannot convert undefined or null to object');
      }

      var to = Object(target);

      for (var index = 1; index < arguments.length; index++) {
        var nextSource = arguments[index];

        if (nextSource != null) {
          // Skip over if undefined or null
          for (var nextKey in nextSource) {
            // Avoid bugs when hasOwnProperty is shadowed
            if (Object.prototype.hasOwnProperty.call(nextSource, nextKey)) {
              to[nextKey] = nextSource[nextKey];
            }
          }
        }
      }
      return to;
    },
    writable: true,
    configurable: true
  });
}

// from: https://github.com/jserz/js_piece/blob/master/DOM/ChildNode/after()/after().md
(function (arr) {
  arr.forEach(function (item) {
    if (item.hasOwnProperty('after')) {
      return;
    }
    Object.defineProperty(item, 'after', {
      configurable: true,
      enumerable: true,
      writable: true,
      value: function after() {
        var argArr = Array.prototype.slice.call(arguments),
            docFrag = document.createDocumentFragment();

        argArr.forEach(function (argItem) {
          var isNode = argItem instanceof Node;
          docFrag.appendChild(isNode ? argItem : document.createTextNode(String(argItem)));
        });

        this.parentNode.insertBefore(docFrag, this.nextSibling);
      }
    });
  });
})([Element.prototype, CharacterData.prototype, DocumentType.prototype]);

function ReplaceWithPolyfill() {
  'use-strict'; // For safari, and IE > 10

  var parent = this.parentNode,
      i = arguments.length,
      currentNode;
  if (!parent) return;
  if (!i) // if there are no arguments
    parent.removeChild(this);
  while (i--) {
    // i-- decrements i and returns the value of i before the decrement
    currentNode = arguments[i];
    if ((typeof currentNode === 'undefined' ? 'undefined' : _typeof(currentNode)) !== 'object') {
      currentNode = this.ownerDocument.createTextNode(currentNode);
    } else if (currentNode.parentNode) {
      currentNode.parentNode.removeChild(currentNode);
    }
    // the value of "i" below is after the decrement
    if (!i) // if currentNode is the first argument (currentNode === arguments[0])
      parent.replaceChild(currentNode, this);else // if currentNode isn't the first
      parent.insertBefore(currentNode, this.previousSibling);
  }
}
if (!Element.prototype.replaceWith) Element.prototype.replaceWith = ReplaceWithPolyfill;
if (!CharacterData.prototype.replaceWith) CharacterData.prototype.replaceWith = ReplaceWithPolyfill;
if (!DocumentType.prototype.replaceWith) DocumentType.prototype.replaceWith = ReplaceWithPolyfill;
"use strict";

head.ready(function () {
  var $form = $(".form-search-volume");

  var $body = $("body");

  $(window).on('undo-loading', function () {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  });

  $("body").on('submit', 'form.form-search-volume', function (event) {
    HT.beforeUnloadTimeout = 15000;
    var $form_ = $(this);

    var $submit = $form_.find("button[type=submit]");
    if ($submit.hasClass("btn-loading")) {
      alert("Your search query has been submitted and is currently being processed.");
      return false;
    }
    var $input = $form_.find("input[type=text]");
    if (!$.trim($input.val())) {
      bootbox.alert("Please enter a term in the search box.");
      return false;
    }
    $submit.addClass("btn-loading").attr("disabled", "disabled");

    $(window).on('unload', function () {
      $(window).trigger('undo-loading');
    });

    if (HT.reader && HT.reader.controls.searchinator) {
      event.preventDefault();
      return HT.reader.controls.searchinator.submit($form_.get(0));
    }

    // default processing
  });

  $("#action-start-jump").on('change', function () {
    var sz = parseInt($(this).data('sz'), 10);
    var value = parseInt($(this).val(), 10);
    var start = (value - 1) * sz + 1;
    var $form_ = $("#form-search-volume");
    $form_.append("<input name='start' type=\"hidden\" value=\"" + start + "\" />");
    $form_.append("<input name='sz' type=\"hidden\" value=\"" + sz + "\" />");
    $form_.submit();
  });
});
'use strict';

head.ready(function () {

    $("body").on('click', '#versionIcon', function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfMDEtYmV0dGVyLWRvbS5qcyIsIl8wMi1iZXR0ZXItZGV0YWlscy1wb2x5ZmlsbC5qcyIsIl9iYXNlLmpzIiwiYWNjZXNzX2Jhbm5lci5qcyIsImNsYXNzTGlzdC5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ29vZ2xlX2FuYWx5dGljcy5qcyIsIm1vYmlmeS5qcyIsInBvbHlmaWxscy5qcyIsInNlYXJjaF9pbl9pdGVtLmpzIiwidmVyc2lvbl9wb3B1cC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwialF1ZXJ5IiwiJCIsInVuZGVmaW5lZCIsInRhZzJhdHRyIiwiYSIsImltZyIsImZvcm0iLCJiYXNlIiwic2NyaXB0IiwiaWZyYW1lIiwibGluayIsImtleSIsImFsaWFzZXMiLCJwYXJzZXIiLCJzdHJpY3QiLCJsb29zZSIsInRvU3RyaW5nIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaXNpbnQiLCJwYXJzZVVyaSIsInVybCIsInN0cmljdE1vZGUiLCJzdHIiLCJkZWNvZGVVUkkiLCJyZXMiLCJleGVjIiwidXJpIiwiYXR0ciIsInBhcmFtIiwic2VnIiwiaSIsInBhcnNlU3RyaW5nIiwicGF0aCIsInJlcGxhY2UiLCJzcGxpdCIsImZyYWdtZW50IiwiaG9zdCIsInByb3RvY29sIiwicG9ydCIsImdldEF0dHJOYW1lIiwiZWxtIiwidG4iLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJwcm9tb3RlIiwicGFyZW50IiwibGVuZ3RoIiwidCIsInBhcnNlIiwicGFydHMiLCJ2YWwiLCJwYXJ0Iiwic2hpZnQiLCJpc0FycmF5IiwicHVzaCIsIm9iaiIsImtleXMiLCJpbmRleE9mIiwic3Vic3RyIiwidGVzdCIsIm1lcmdlIiwibGVuIiwibGFzdCIsImsiLCJzZXQiLCJyZWR1Y2UiLCJTdHJpbmciLCJyZXQiLCJwYWlyIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZSIsImVxbCIsImJyYWNlIiwibGFzdEJyYWNlSW5LZXkiLCJ2IiwiYyIsImFjY3VtdWxhdG9yIiwibCIsImN1cnIiLCJhcmd1bWVudHMiLCJjYWxsIiwidkFyZyIsInByb3AiLCJoYXNPd25Qcm9wZXJ0eSIsInB1cmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImRhdGEiLCJxdWVyeSIsImZwYXJhbSIsInNlZ21lbnQiLCJmc2VnbWVudCIsImZuIiwiU0xJQ0UkMCIsIkFycmF5Iiwic2xpY2UiLCJXSU5ET1ciLCJET0NVTUVOVCIsImRvY3VtZW50IiwiSFRNTCIsImRvY3VtZW50RWxlbWVudCIsInVzZXJBZ2VudCIsIm5hdmlnYXRvciIsImpzY3JpcHRWZXJzaW9uIiwiU2NyaXB0RW5naW5lTWFqb3JWZXJzaW9uIiwiSlNDUklQVF9WRVJTSU9OIiwiTEVHQUNZX0FORFJPSUQiLCJXRUJLSVRfUFJFRklYIiwiV2ViS2l0QW5pbWF0aW9uRXZlbnQiLCJDVVNUT01fRVZFTlRfVFlQRSIsIiROdWxsRWxlbWVudCIsIiRFbGVtZW50Iiwibm9kZSIsIl8iLCJjYWNoZWQiLCJjb25zdHJ1Y3RvciIsIm5vZGVUeXBlIiwidmVyc2lvbiIsIiREb2N1bWVudCIsIkRPTSIsInV0aWwkaW5kZXgkJGFycmF5UHJvdG8iLCJ1dGlsJGluZGV4JCRkZWZhdWx0IiwiY29tcHV0ZVN0eWxlIiwiY3VycmVudFN0eWxlIiwib3duZXJEb2N1bWVudCIsImRlZmF1bHRWaWV3IiwiZ2V0Q29tcHV0ZWRTdHlsZSIsImluamVjdEVsZW1lbnQiLCJnZXRFbGVtZW50c0J5VGFnTmFtZSIsImFwcGVuZENoaWxkIiwiZXZlcnkiLCJlYWNoIiwiZm9yRWFjaCIsImZpbHRlciIsIm1hcCIsInNhZmVDYWxsIiwiY29udGV4dCIsImFyZzEiLCJhcmcyIiwiZXJyIiwic2V0VGltZW91dCIsInJlZ2lzdGVyIiwibWl4aW5zIiwiZGVmYXVsdEJlaGF2aW9yIiwiZGVmYXVsdHMiLCJnZXRMZWdhY3lGaWxlIiwidHlwZSIsImxlZ2FjeVNjcmlwdHMiLCJzY3JpcHRzIiwiZWwiLCJzcmMiLCJFcnJvciIsImVycm9ycyQkTWV0aG9kRXJyb3IiLCJtZXRob2ROYW1lIiwiYXJncyIsImxpbmUiLCJhcmciLCJqb2luIiwibWVzc2FnZSIsIlR5cGVFcnJvciIsImVycm9ycyQkU3RhdGljTWV0aG9kRXJyb3IiLCJnbG9iYWwkZW1tZXQkJG9wZXJhdG9ycyIsImdsb2JhbCRlbW1ldCQkcmVQYXJzZSIsImdsb2JhbCRlbW1ldCQkcmVBdHRyIiwiZ2xvYmFsJGVtbWV0JCRyZUluZGV4IiwiZ2xvYmFsJGVtbWV0JCRyZURvdCIsImdsb2JhbCRlbW1ldCQkcmVEb2xsYXIiLCJnbG9iYWwkZW1tZXQkJHRhZ0NhY2hlIiwiZ2xvYmFsJGVtbWV0JCRub3JtYWxpemVBdHRycyIsIm5hbWUiLCJ2YWx1ZSIsInJhd1ZhbHVlIiwicXVvdGUiLCJnbG9iYWwkZW1tZXQkJGluamVjdFRlcm0iLCJ0ZXJtIiwiZW5kIiwiaHRtbCIsImluZGV4IiwibGFzdEluZGV4T2YiLCJnbG9iYWwkZW1tZXQkJG1ha2VUZXJtIiwidGFnIiwiZ2xvYmFsJGVtbWV0JCRtYWtlSW5kZXhlZFRlcm0iLCJuIiwicmVzdWx0IiwiZXhwciIsImZtdCIsInNpZ24iLCJnbG9iYWwkZW1tZXQkJHJlVW5zYWZlIiwiZ2xvYmFsJGVtbWV0JCRzYWZlU3ltYm9sIiwiZW1tZXQiLCJ0ZW1wbGF0ZSIsInZhck1hcCIsIiREJDAiLCIkRCQxIiwiJEQkMiIsImZvcm1hdCIsInN0YWNrIiwib3V0cHV0IiwibWF0Y2giLCJvcCIsInByaW9yaXR5IiwiaGVhZCIsInVuc2hpZnQiLCJjb25jYXQiLCJzdHIkMCIsImNoIiwiZ2xvYmFsJGVtbWV0JCRkZWZhdWx0IiwiZG9jdW1lbnQkY3JlYXRlJCRtYWtlTWV0aG9kIiwiYWxsIiwiZG9jIiwic2FuZGJveCIsImNyZWF0ZUVsZW1lbnQiLCJub2RlcyIsInRyaW0iLCJpbm5lckhUTUwiLCJmaXJzdENoaWxkIiwicmVtb3ZlQ2hpbGQiLCJjcmVhdGUiLCJjcmVhdGVBbGwiLCJpbXBvcnRTY3JpcHRzIiwidXJscyIsImNhbGxiYWNrIiwiYXJnVHlwZSIsIm9ubG9hZCIsImFzeW5jIiwiaW1wb3J0U3R5bGVzIiwic2VsZWN0b3IiLCJjc3NUZXh0Iiwic3R5bGVTaGVldCIsInN0eWxlTm9kZSIsInNoZWV0IiwiY3NzUnVsZXMiLCJpbnNlcnRSdWxlIiwiYWRkUnVsZSIsInV0aWwkc2VsZWN0b3JtYXRjaGVyJCRycXVpY2tJcyIsInV0aWwkc2VsZWN0b3JtYXRjaGVyJCRwcm9wTmFtZSIsInByZWZpeCIsInByb3BlcnR5TmFtZSIsInV0aWwkc2VsZWN0b3JtYXRjaGVyJCRkZWZhdWx0IiwicXVpY2siLCIkRCQzIiwiJEQkNCIsImZvdW5kIiwicXVlcnlTZWxlY3RvckFsbCIsInBhcmVudE5vZGUiLCJub2RlTmFtZSIsImlkIiwiZ2V0QXR0cmlidXRlIiwiaGFzQXR0cmlidXRlIiwiY2xhc3NOYW1lIiwiZWxlbWVudCRjaGlsZHJlbiQkbWFrZU1ldGhvZCIsIm1hdGNoZXIiLCJjaGlsZHJlbiIsImNoaWxkIiwiZWxlbWVudCRjbGFzc2VzJCRyZVNwYWNlIiwiZWxlbWVudCRjbGFzc2VzJCRtYWtlTWV0aG9kIiwibmF0aXZlTWV0aG9kTmFtZSIsInN0cmF0ZWd5IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJmb3JjZSIsIiREJDUiLCIkRCQ2IiwidG9rZW5zIiwiaGFzQ2xhc3MiLCJhZGRDbGFzcyIsInJlbW92ZUNsYXNzIiwidG9nZ2xlQ2xhc3MiLCJjbG9uZSIsImRlZXAiLCJvdXRlckhUTUwiLCJjbG9uZU5vZGUiLCJjb250YWlucyIsImVsZW1lbnQiLCJvdGhlck5vZGUiLCJjb21wYXJlRG9jdW1lbnRQb3NpdGlvbiIsImVsZW1lbnQkY29udGV4dCQkQ09OVEVYVF9URU1QTEFURSIsImNvbnRleHRzIiwiY3R4Iiwib2JqZWN0IiwiZ2V0IiwiY3NzIiwiY29udGVudERvY3VtZW50IiwiYmVmb3JlIiwicmVxdWVzdEZyYW1lIiwicmVwZWF0IiwiZnJhbWVJZCIsImF0dGFjaEV2ZW50Iiwid2lkdGgiLCJvZmZzZXRXaWR0aCIsImhlaWdodCIsIm9mZnNldEhlaWdodCIsInV0aWwkc3R5bGVob29rcyQkcmVEYXNoIiwidXRpbCRzdHlsZWhvb2tzJCRjc3NQcmVmaXhlcyIsInV0aWwkc3R5bGVob29rcyQkaG9va3MiLCJmaW5kIiwic3R5bGUiLCJwcm9wTmFtZSIsInRvVXBwZXJDYXNlIiwidXRpbCRzdHlsZWhvb2tzJCRkaXJlY3Rpb25zIiwidXRpbCRzdHlsZWhvb2tzJCRzaG9ydEN1dHMiLCJmb250IiwicGFkZGluZyIsImRpciIsIm1hcmdpbiIsInN0eWxlUHJvcE5hbWUiLCJwcm9wcyIsImhhc0VtcHR5U3R5bGVWYWx1ZSIsInNvbWUiLCJ1dGlsJHN0eWxlaG9va3MkJGRlZmF1bHQiLCJ0aGlzJDAiLCJjb21wdXRlZCIsImdldHRlciIsIm1lbW8iLCJzZXR0ZXIiLCJlbGVtZW50JGRlZmluZSQkQVRUUl9DQVNFIiwiYXR0ck5hbWUiLCJfc2V0QXR0cmlidXRlIiwic2V0QXR0cmlidXRlIiwiX3JlbW92ZUF0dHJpYnV0ZSIsInJlbW92ZUF0dHJpYnV0ZSIsImluaXRpYWxWYWx1ZSIsImRlZmluZVByb3BlcnR5IiwiYXR0clZhbHVlIiwicHJvcFZhbHVlIiwiZmxhZ3MiLCJlbXB0eSIsImVsZW1lbnQkZmluZCQkcnF1aWNrIiwiZ2V0RWxlbWVudHNCeUNsYXNzTmFtZSIsImVsZW1lbnQkZmluZCQkcmVzY2FwZSIsImVsZW1lbnQkZmluZCQkbWFrZU1ldGhvZCIsInF1aWNrTWF0Y2giLCJvbGQiLCJuaWQiLCJmaW5kQWxsIiwidXRpbCRldmVudGhvb2tzJCRob29rcyIsImZvY3VzIiwiaGFuZGxlciIsIl90eXBlIiwiYmx1ciIsImNhcHR1cmluZyIsInZhbGlkaXR5IiwiaW52YWxpZCIsInV0aWwkZXZlbnRob29rcyQkZGVmYXVsdCIsInV0aWwkZXZlbnRoYW5kbGVyJCRnZXRFdmVudFByb3BlcnR5IiwidGFyZ2V0IiwiY3VycmVudFRhcmdldCIsImRvY0VsIiwia2V5Q29kZSIsImJ1dHRvbiIsImNsaWVudFgiLCJzY3JvbGxMZWZ0IiwiY2xpZW50TGVmdCIsImNsaWVudFkiLCJzY3JvbGxUb3AiLCJjbGllbnRUb3AiLCJyZXR1cm5WYWx1ZSIsImNhbmNlbEJ1YmJsZSIsImRlZmF1bHRQcmV2ZW50ZWQiLCJyZWxhdGVkVGFyZ2V0IiwidG9FbGVtZW50IiwiYXBwbHkiLCJ1dGlsJGV2ZW50aGFuZGxlciQkRXZlbnRIYW5kbGVyIiwib25jZSIsImhvb2siLCJldmVudCIsInNraXAiLCJzcmNVcm4iLCJzcmNFbGVtZW50Iiwib2ZmIiwicHJldmVudERlZmF1bHQiLCJ1dGlsJGV2ZW50aGFuZGxlciQkZGVmYXVsdCIsImZpcmUiLCJldmVudFR5cGUiLCJjYW5Db250aW51ZSIsImNyZWF0ZUV2ZW50T2JqZWN0IiwiZmlyZUV2ZW50IiwiY3JlYXRlRXZlbnQiLCJpbml0RXZlbnQiLCJkaXNwYXRjaEV2ZW50IiwidXRpbCRhY2Nlc3Nvcmhvb2tzJCRob29rcyIsInRpdGxlIiwic2VsZWN0ZWRJbmRleCIsIm9wdGlvbnMiLCJvIiwic2VsZWN0ZWQiLCJ0ZXh0Q29udGVudCIsImlubmVyVGV4dCIsIngiLCJ1dGlsJGFjY2Vzc29yaG9va3MkJGRlZmF1bHQiLCJlbGVtZW50JGdldCQkcmVVcHBlciIsImVsZW1lbnQkZ2V0JCRyZWFkUHJpdmF0ZVByb3BlcnR5IiwiSlNPTiIsImVsZW1lbnQkbWFuaXB1bGF0aW9uJCRtYWtlTWV0aG9kIiwiZmFzdFN0cmF0ZWd5IiwicmVxdWlyZXNQYXJlbnQiLCJjb250ZW50cyIsImNyZWF0ZURvY3VtZW50RnJhZ21lbnQiLCJjb250ZW50IiwiaW5zZXJ0QWRqYWNlbnRIVE1MIiwiYWZ0ZXIiLCJyZWxhdGVkTm9kZSIsImluc2VydEJlZm9yZSIsIm5leHRTaWJsaW5nIiwicHJlcGVuZCIsImFwcGVuZCIsInJlcGxhY2VDaGlsZCIsInJlbW92ZSIsInV0aWwkc2VsZWN0b3Job29rcyQkaXNIaWRkZW4iLCJ2aXNpYmlsaXR5IiwiZGlzcGxheSIsInV0aWwkc2VsZWN0b3Job29rcyQkZGVmYXVsdCIsImFjdGl2ZUVsZW1lbnQiLCJtYXRjaGVzIiwiY2hlY2tlciIsImRldGFjaEV2ZW50IiwicmVtb3ZlRXZlbnRMaXN0ZW5lciIsIm9mZnNldCIsInBhZ2VZT2Zmc2V0IiwicGFnZVhPZmZzZXQiLCJib3VuZGluZ1JlY3QiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJ0b3AiLCJsZWZ0IiwicmlnaHQiLCJib3R0b20iLCJlbGVtZW50JG9uJCRtYWtlTWV0aG9kIiwibWV0aG9kIiwiYWRkRXZlbnRMaXN0ZW5lciIsIm9uIiwid2F0Y2hlcnMiLCJvbGRWYWx1ZSIsInciLCJlbGVtZW50JHRyYXZlcnNpbmckJG1ha2VNZXRob2QiLCJpdCIsIm5leHQiLCJwcmV2IiwibmV4dEFsbCIsInByZXZBbGwiLCJjbG9zZXN0IiwidXRpbCRhbmltYXRpb25oYW5kbGVyJCRUUkFOU0lUSU9OX1BST1BTIiwidXRpbCRhbmltYXRpb25oYW5kbGVyJCRwYXJzZVRpbWVWYWx1ZSIsInBhcnNlRmxvYXQiLCJ1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJGNhbGNUcmFuc2l0aW9uRHVyYXRpb24iLCJ0cmFuc2l0aW9uVmFsdWVzIiwiZGVsYXlzIiwiZHVyYXRpb25zIiwiTWF0aCIsIm1heCIsInV0aWwkYW5pbWF0aW9uaGFuZGxlciQkZGVmYXVsdCIsImFuaW1hdGlvbk5hbWUiLCJoaWRpbmciLCJkb25lIiwicnVsZXMiLCJkdXJhdGlvbiIsInZpc2liaWxpdHlJbmRleCIsImluaXRpYWxDc3NUZXh0IiwiaGFuZGxlRXZlbnQiLCJzdG9wUHJvcGFnYXRpb24iLCJlbGVtZW50JHZpc2liaWxpdHkkJFRSQU5TSVRJT05fRVZFTlRfVFlQRSIsImVsZW1lbnQkdmlzaWJpbGl0eSQkQU5JTUFUSU9OX0VWRU5UX1RZUEUiLCJlbGVtZW50JHZpc2liaWxpdHkkJG1ha2VNZXRob2QiLCJjb25kaXRpb24iLCJhbmltYXRpb25IYW5kbGVyIiwiY2FuY2VsRnJhbWUiLCJzaG93IiwiaGlkZSIsInRvZ2dsZSIsIndhdGNoIiwidW53YXRjaCIsInV0aWwkZXh0ZW5zaW9uaGFuZGxlciQkcmVQcml2YXRlRnVuY3Rpb24iLCJ1dGlsJGV4dGVuc2lvbmhhbmRsZXIkJGRlZmF1bHQiLCJjdHIiLCJtb2NrIiwicHJpdmF0ZUZ1bmN0aW9ucyIsImdsb2JhbCRleHRlbmQkJGV4dGVuc2lvbnMiLCJnbG9iYWwkZXh0ZW5kJCRyZXR1cm5UcnVlIiwiZ2xvYmFsJGV4dGVuZCQkcmV0dXJuRmFsc2UiLCJnbG9iYWwkZXh0ZW5kJCRjc3NUZXh0IiwiZXh0ZW5kIiwiZGVmaW5pdGlvbiIsImV4dCIsImdsb2JhbCRleHRlbmQkJF9leHRlbmQiLCJzdG9wSW1tZWRpYXRlUHJvcGFnYXRpb24iLCJnbG9iYWwkZXh0ZW5kJCRkZWZhdWx0IiwiZ2xvYmFsJGZvcm1hdCQkcmVWYXIiLCJ0bXBsIiwiZ2xvYmFsJGZyYW1lJCRyYWYiLCJyZXF1ZXN0QW5pbWF0aW9uRnJhbWUiLCJnbG9iYWwkZnJhbWUkJGNyYWYiLCJjYW5jZWxBbmltYXRpb25GcmFtZSIsImdsb2JhbCRmcmFtZSQkbGFzdFRpbWUiLCJjdXJyVGltZSIsIkRhdGUiLCJub3ciLCJ0aW1lVG9DYWxsIiwiY2xlYXJUaW1lb3V0IiwiZ2xvYmFsJG1vY2skJGFwcGx5RXh0ZW5zaW9ucyIsImV4cG9ydHMkJF9ET00iLCJub0NvbmZsaWN0IiwiVktfU1BBQ0UiLCJWS19FTlRFUiIsImhhc05hdGl2ZVN1cHBvcnQiLCJkYXRhc2V0IiwiZGV0YWlsc1BvbHlmaWxsZWQiLCJfY2hhbmdlT3BlbiIsImJpbmQiLCJmaXJzdFN1bW1hcnkiLCJfZ2V0T3BlbiIsIl9zZXRPcGVuIiwiX2luaXRTdW1tYXJ5Iiwic3VtbWFyeSIsIl90b2dnbGVPcGVuIiwic3RvcCIsImN1cnJlbnRWYWx1ZSIsIkhUIiwicmVhZHkiLCJyZW5ld19hdXRoIiwiZW50aXR5SUQiLCJzb3VyY2UiLCJfX3JlbmV3aW5nIiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIk1PTlRIUyIsIiRlbWVyZ2VuY3lfYWNjZXNzIiwiZGVsdGEiLCJsYXN0X3NlY29uZHMiLCJ0b2dnbGVfcmVuZXdfbGluayIsImRhdGUiLCJnZXRUaW1lIiwiJGxpbmsiLCJvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wIiwicGFyYW1zIiwiY29va2llIiwianNvbiIsInNlY29uZHMiLCJ0ZXh0IiwiJGFjdGlvbiIsInRpbWUybWVzc2FnZSIsImhvdXJzIiwiZ2V0SG91cnMiLCJhbXBtIiwibWludXRlcyIsImdldE1pbnV0ZXMiLCJnZXRNb250aCIsImdldERhdGUiLCJleHBpcmF0aW9uIiwicGFyc2VJbnQiLCJncmFudGVkIiwiaW5pdGlhbGl6ZWQiLCJzZXRJbnRlcnZhbCIsInN1cHByZXNzIiwiZGVidWciLCJpZGhhc2giLCJjdXJyaWQiLCJpZHMiLCJzaG93QWxlcnQiLCIkYWxlcnQiLCJib290Ym94IiwiZGlhbG9nIiwibGFiZWwiLCJoZWFkZXIiLCJyb2xlIiwiZG9tYWluIiwiZGV0YWlsIiwicHJlZnMiLCJwdCIsImFsZXJ0cyIsIm9wZW4iLCJzZWxmIiwiY3JlYXRlRWxlbWVudE5TIiwidmlldyIsImNsYXNzTGlzdFByb3AiLCJwcm90b1Byb3AiLCJlbGVtQ3RyUHJvdG8iLCJFbGVtZW50Iiwib2JqQ3RyIiwic3RyVHJpbSIsImFyckluZGV4T2YiLCJpdGVtIiwiRE9NRXgiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsImFkZCIsInVwZGF0ZWQiLCJzcGxpY2UiLCJyZXBsYWNlbWVudF90b2tlbiIsImNsYXNzTGlzdFByb3BEZXNjIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsImV4IiwibnVtYmVyIiwiX19kZWZpbmVHZXR0ZXJfXyIsInRlc3RFbGVtZW50IiwiY3JlYXRlTWV0aG9kIiwib3JpZ2luYWwiLCJET01Ub2tlbkxpc3QiLCJfdG9nZ2xlIiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZV9pbmZvIiwiZ2V0X3VybCIsInBhdGhuYW1lIiwicGFyc2VfbGluZSIsInRtcCIsImt2IiwiZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInN1Ym1pdF9wb3N0IiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsInBhZ2UiLCJhZGRfaXRlbV90b19jb2xsaXN0IiwiY29uc29sZSIsImxvZyIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJlcnJvclRocm93biIsIiR1bCIsImNvbGxfaHJlZiIsImNvbGxfaWQiLCIkYSIsImNvbGxfbmFtZSIsInBhcmVudHMiLCIkb3B0aW9uIiwiY29uZmlybV9sYXJnZSIsImNvbGxTaXplIiwiYWRkTnVtSXRlbXMiLCJudW1TdHIiLCJhbnN3ZXIiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJmb3JjZV9zaXplIiwiJGRpdiIsIiRwIiwicGhvdG9jb3BpZXJfbWVzc2FnZSIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0IiwiZG93bmxvYWRQZGYiLCJjb25maWciLCJpdGVtX3RpdGxlIiwiJGNvbmZpZyIsInRvdGFsIiwic2VsZWN0aW9uIiwicGFnZXMiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCIkc3RhdHVzIiwicmVxdWVzdERvd25sb2FkIiwic2VxIiwiZG93bmxvYWRGb3JtYXQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJjaGVja1N0YXR1cyIsInRzIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJ1cGRhdGVTdGF0dXNUZXh0IiwiZG93bmxvYWRfa2V5IiwiJGRvd25sb2FkX2J0biIsImRvd25sb2FkIiwidHJhY2tFdmVudCIsImNhdGVnb3J5IiwidHJhY2tpbmdBY3Rpb24iLCJoaiIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInJhdGUiLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJfbGFzdE1lc3NhZ2UiLCJfbGFzdFRpbWVyIiwiRU9UIiwiZG93bmxvYWRGb3JtIiwiZG93bmxvYWRGb3JtYXRPcHRpb25zIiwicmFuZ2VPcHRpb25zIiwiZG93bmxvYWRJZHgiLCJxdWVyeVNlbGVjdG9yIiwiZG93bmxvYWRlciIsImRvd25sb2FkU3VibWl0IiwiaGFzRnVsbFBkZkFjY2VzcyIsImZ1bGxQZGZBY2Nlc3MiLCJ1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyIsIm9wdGlvbiIsInJhbmdlT3B0aW9uIiwiaW5wdXQiLCJkaXNhYmxlZCIsImN1cnJlbnRfdmlldyIsInJlYWRlciIsImNoZWNrZWQiLCJkaXYiLCJmb3JtYXRPcHRpb24iLCJkb3dubG9hZEZvcm1hdFRhcmdldCIsInBkZkZvcm1hdE9wdGlvbiIsInR1bm5lbEZvcm0iLCJwcmludGFibGUiLCJhY3Rpb25UZW1wbGF0ZSIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2dldFBhZ2VTZWxlY3Rpb24iLCJpc1NlbGVjdGlvbiIsImJ1dHRvbnMiLCJjdXJyZW50TG9jYXRpb24iLCJfZ2V0RmxhdHRlbmVkU2VsZWN0aW9uIiwiaXNQYXJ0aWFsIiwic2l6ZV9hdHRyIiwiaW1hZ2VfZm9ybWF0X2F0dHIiLCJzaXplX3ZhbHVlIiwicmFuZ2UiLCJib2R5IiwidHJhY2tlciIsInRyYWNrZXJfaW5wdXQiLCJvcGFjaXR5IiwidHJhY2tlckludGVydmFsIiwiaXNfZGV2IiwicmVtb3ZlQ29va2llIiwiZGlzYWJsZVVubG9hZFRpbWVvdXQiLCJzdWJtaXQiLCJfZm9ybWF0X3RpdGxlcyIsImVwdWIiLCJwbGFpbnRleHQiLCJpbWFnZSIsInNpZGVfc2hvcnQiLCJzaWRlX2xvbmciLCJodElkIiwiZW1iZWRIZWxwTGluayIsImNvZGVibG9ja190eHQiLCJjb2RlYmxvY2tfdHh0X2EiLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwidGV4dGFyZWEiLCJzZWxlY3QiLCJjbGljayIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiZ2V0VGl0bGUiLCIkbWVudSIsIiR0cmlnZ2VyIiwiJGhlYWRlciIsIiRuYXZpZ2F0b3IiLCJtb2JpZnkiLCJleHBhbmRlZCIsIiRleHBhbmRvIiwidWkiLCIkc2lkZWJhciIsInJlcXVlc3RGdWxsU2NyZWVuIiwidXRpbHMiLCJoYW5kbGVPcmllbnRhdGlvbkNoYW5nZSIsInN0YXRlIiwic2lkZWJhckV4cGFuZGVkIiwic2lkZWJhck5hcnJvd1N0YXRlIiwiYXNzaWduIiwidmFyQXJncyIsInRvIiwibmV4dFNvdXJjZSIsIm5leHRLZXkiLCJ3cml0YWJsZSIsImFyciIsImFyZ0FyciIsImRvY0ZyYWciLCJhcmdJdGVtIiwiaXNOb2RlIiwiTm9kZSIsImNyZWF0ZVRleHROb2RlIiwiQ2hhcmFjdGVyRGF0YSIsIkRvY3VtZW50VHlwZSIsIlJlcGxhY2VXaXRoUG9seWZpbGwiLCJjdXJyZW50Tm9kZSIsInByZXZpb3VzU2libGluZyIsInJlcGxhY2VXaXRoIiwiJGJvZHkiLCJyZW1vdmVBdHRyIiwiYmVmb3JlVW5sb2FkVGltZW91dCIsIiRmb3JtXyIsIiRzdWJtaXQiLCIkaW5wdXQiLCJzZWFyY2hpbmF0b3IiLCJzeiJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7O0FBT0EsQ0FBQyxDQUFDLFVBQVNBLE9BQVQsRUFBa0I7QUFDbkIsS0FBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUMvQztBQUNBLE1BQUssT0FBT0MsTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0YsVUFBTyxDQUFDLFFBQUQsQ0FBUCxFQUFtQkQsT0FBbkI7QUFDQSxHQUZELE1BRU87QUFDTkMsVUFBTyxFQUFQLEVBQVdELE9BQVg7QUFDQTtBQUNELEVBUEQsTUFPTztBQUNOO0FBQ0EsTUFBSyxPQUFPRyxNQUFQLEtBQWtCLFdBQXZCLEVBQXFDO0FBQ3BDSCxXQUFRRyxNQUFSO0FBQ0EsR0FGRCxNQUVPO0FBQ05IO0FBQ0E7QUFDRDtBQUNELENBaEJBLEVBZ0JFLFVBQVNJLENB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dUYsWUFBbkIsQ0FBZ0NuRSxNQUFoQyxDQUF1Q2dFLE9BQU8vakIsR0FBUCxDQUFXLENBQVgsQ0FBdkMsQ0FBUDtBQUNEOztBQUVEO0FBQ0QsR0ExQkQ7O0FBNEJBeFIsSUFBRSxvQkFBRixFQUF3QjZhLEVBQXhCLENBQTJCLFFBQTNCLEVBQXFDLFlBQVc7QUFDOUMsUUFBSThhLEtBQUszUyxTQUFTaGpCLEVBQUUsSUFBRixFQUFRdUYsSUFBUixDQUFhLElBQWIsQ0FBVCxFQUE2QixFQUE3QixDQUFUO0FBQ0EsUUFBSW1GLFFBQVFzWSxTQUFTaGpCLEVBQUUsSUFBRixFQUFRa0QsR0FBUixFQUFULEVBQXdCLEVBQXhCLENBQVo7QUFDQSxRQUFJOG5CLFFBQVEsQ0FBRXRnQixRQUFRLENBQVYsSUFBZ0JpckIsRUFBaEIsR0FBcUIsQ0FBakM7QUFDQSxRQUFJSixTQUFTdjFCLEVBQUUscUJBQUYsQ0FBYjtBQUNBdTFCLFdBQU9sYyxNQUFQLGtEQUEwRDJSLEtBQTFEO0FBQ0F1SyxXQUFPbGMsTUFBUCwrQ0FBdURzYyxFQUF2RDtBQUNBSixXQUFPaEUsTUFBUDtBQUNELEdBUkQ7QUFVRCxDQS9DRDs7O0FDQUE5a0IsS0FBSzJULEtBQUwsQ0FBVyxZQUFXOztBQUVsQnBnQixNQUFFLE1BQUYsRUFBVTZhLEVBQVYsQ0FBYSxPQUFiLEVBQXNCLGNBQXRCLEVBQXNDLFVBQVN2VyxDQUFULEVBQVk7QUFDOUNBLFVBQUU0UyxjQUFGO0FBQ0F5TSxnQkFBUXdILEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCIvKipcbiAqIEBvdmVydmlldyBiZXR0ZXItZG9tOiBMaXZlIGV4dGVuc2lvbiBwbGF5Z3JvdW5kXG4gKiBAdmVyc2lvbiAyLjEuMSBUdWUsIDE2IERlYyAyMDE0IDE0OjI3OjI2IEdNVFxuICogQGNvcHlyaWdodCAyMDEzLTIwMTQgTWFrc2ltIENoZW1lcmlzdWtcbiAqIEBsaWNlbnNlIE1JVFxuICogQHNlZSBodHRwczovL2dpdGh1Yi5jb20vY2hlbWVyaXN1ay9iZXR0ZXItZG9tXG4gKi9cbihmdW5jdGlvbigpIHtcbiAgICBcInVzZSBzdHJpY3RcIjt2YXIgU0xJQ0UkMCA9IEFycmF5LnByb3RvdHlwZS5zbGljZTtcbiAgICB2YXIgV0lORE9XID0gd2luZG93O1xuICAgIHZhciBET0NVTUVOVCA9IGRvY3VtZW50O1xuICAgIHZhciBIVE1MID0gRE9DVU1FTlQuZG9jdW1lbnRFbGVtZW50O1xuXG4gICAgdmFyIHVzZXJBZ2VudCA9IFdJTkRPVy5uYXZpZ2F0b3IudXNlckFnZW50O1xuICAgIHZhciBqc2NyaXB0VmVyc2lvbiA9IFdJTkRPVy5TY3JpcHRFbmdpbmVNYWpvclZlcnNpb247XG5cbiAgICB2YXIgSlNDUklQVF9WRVJTSU9OID0ganNjcmlwdFZlcnNpb24gJiYganNjcmlwdFZlcnNpb24oKTtcbiAgICB2YXIgTEVHQUNZX0FORFJPSUQgPSB+dXNlckFnZW50LmluZGV4T2YoXCJBbmRyb2lkXCIpICYmIHVzZXJBZ2VudC5pbmRleE9mKFwiQ2hyb21lXCIpIDwgMDtcbiAgICB2YXIgV0VCS0lUX1BSRUZJWCA9IFdJTkRPVy5XZWJLaXRBbmltYXRpb25FdmVudCA/IFwiLXdlYmtpdC1cIiA6IFwiXCI7XG4gICAgdmFyIENVU1RPTV9FVkVOVF9UWVBFID0gXCJkYXRhYXZhaWxhYmxlXCI7XG5cbiAgICBmdW5jdGlvbiAkTnVsbEVsZW1lbnQoKSB7fVxuXG4gICAgZnVuY3Rpb24gJEVsZW1lbnQobm9kZSkge1xuICAgICAgICBpZiAodGhpcyBpbnN0YW5jZW9mICRFbGVtZW50KSB7XG4gICAgICAgICAgICBpZiAobm9kZSkge1xuICAgICAgICAgICAgICAgIC8vIHVzZSBhIGdlbmVyYXRlZCBwcm9wZXJ0eSB0byBzdG9yZSBhIHJlZmVyZW5jZVxuICAgICAgICAgICAgICAgIC8vIHRvIHRoZSB3cmFwcGVyIGZvciBjaXJjdWxhciBvYmplY3QgYmluZGluZ1xuICAgICAgICAgICAgICAgIG5vZGVbXCJfXzIwMDEwMDFfX1wiXSA9IHRoaXM7XG5cbiAgICAgICAgICAgICAgICB0aGlzWzBdID0gbm9kZTtcbiAgICAgICAgICAgICAgICB0aGlzLl8gPSB7XG4gICAgICAgICAgICAgICAgICAgIFwiaGFuZGxlcjIwMDEwMDFcIjogW10sXG4gICAgICAgICAgICAgICAgICAgIFwid2F0Y2hlcjIwMDEwMDFcIjoge30sXG4gICAgICAgICAgICAgICAgICAgIFwiZXh0ZW5zaW9uMjAwMTAwMVwiOiBbXSxcbiAgICAgICAgICAgICAgICAgICAgXCJjb250ZXh0MjAwMTAwMVwiOiB7fVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAobm9kZSkge1xuICAgICAgICAgICAgdmFyIGNhY2hlZCA9IG5vZGVbXCJfXzIwMDEwMDFfX1wiXTtcbiAgICAgICAgICAgIC8vIGNyZWF0ZSBhIHdyYXBwZXIgb25seSBvbmNlIGZvciBlYWNoIG5hdGl2ZSBlbGVtZW50XG4gICAgICAgICAgICByZXR1cm4gY2FjaGVkID8gY2FjaGVkIDogbmV3ICRFbGVtZW50KG5vZGUpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIG5ldyAkTnVsbEVsZW1lbnQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRFbGVtZW50LnByb3RvdHlwZSA9IHtcbiAgICAgICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKG5vZGUpIHtcbiAgICAgICAgICAgIC8vIGZpbHRlciBub24gZWxlbWVudHMgbGlrZSB0ZXh0IG5vZGVzLCBjb21tZW50cyBldGMuXG4gICAgICAgICAgICByZXR1cm4gJEVsZW1lbnQobm9kZSAmJiBub2RlLm5vZGVUeXBlID09PSAxID8gbm9kZSA6IG51bGwpO1xuICAgICAgICB9LFxuICAgICAgICB0b1N0cmluZzogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXNbMF07XG5cbiAgICAgICAgICAgIHJldHVybiBub2RlID8gXCI8XCIgKyBub2RlLnRhZ05hbWUudG9Mb3dlckNhc2UoKSArIFwiPlwiIDogXCJcIjtcbiAgICAgICAgfSxcbiAgICAgICAgdmVyc2lvbjogXCIyLjEuMVwiXG4gICAgfTtcblxuICAgICROdWxsRWxlbWVudC5wcm90b3R5cGUgPSBuZXcgJEVsZW1lbnQoKTtcblxuICAgIGZ1bmN0aW9uICREb2N1bWVudChub2RlKSB7XG4gICAgICAgIGlmIChub2RlICYmIG5vZGUubm9kZVR5cGUgPT09IDkpIHtcbiAgICAgICAgICAgIG5vZGUgPSBub2RlLmRvY3VtZW50RWxlbWVudDtcbiAgICAgICAgfVxuXG4gICAgICAgICRFbGVtZW50LmNhbGwodGhpcywgbm9kZSk7XG4gICAgfVxuXG4gICAgJERvY3VtZW50LnByb3RvdHlwZSA9IG5ldyAkRWxlbWVudCgpO1xuXG4gICAgdmFyIERPTSA9IG5ldyAkRG9jdW1lbnQoRE9DVU1FTlQpO1xuXG4gICAgdmFyIHV0aWwkaW5kZXgkJGFycmF5UHJvdG8gPSBBcnJheS5wcm90b3R5cGU7XG5cbiAgICB2YXIgdXRpbCRpbmRleCQkZGVmYXVsdCA9IHtcbiAgICAgICAgY29tcHV0ZVN0eWxlOiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmN1cnJlbnRTdHlsZTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudC5kZWZhdWx0Vmlldy5nZXRDb21wdXRlZFN0eWxlKG5vZGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBpbmplY3RFbGVtZW50OiBmdW5jdGlvbihub2RlKSB7XG4gICAgICAgICAgICBpZiAobm9kZSAmJiBub2RlLm5vZGVUeXBlID09PSAxKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIG5vZGUub3duZXJEb2N1bWVudC5nZXRFbGVtZW50c0J5VGFnTmFtZShcImhlYWRcIilbMF0uYXBwZW5kQ2hpbGQobm9kZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIC8vIHV0aWxpdGVzXG4gICAgICAgIGV2ZXJ5OiB1dGlsJGluZGV4JCRhcnJheVByb3RvLmV2ZXJ5LFxuICAgICAgICBlYWNoOiB1dGlsJGluZGV4JCRhcnJheVByb3RvLmZvckVhY2gsXG4gICAgICAgIGZpbHRlcjogdXRpbCRpbmRleCQkYXJyYXlQcm90by5maWx0ZXIsXG4gICAgICAgIG1hcDogdXRpbCRpbmRleCQkYXJyYXlQcm90by5tYXAsXG4gICAgICAgIHNsaWNlOiB1dGlsJGluZGV4JCRhcnJheVByb3RvLnNsaWNlLFxuICAgICAgICBpc0FycmF5OiBBcnJheS5pc0FycmF5LFxuICAgICAgICBrZXlzOiBPYmplY3Qua2V5cyxcbiAgICAgICAgc2FmZUNhbGw6IGZ1bmN0aW9uKGNvbnRleHQsIGZuLCBhcmcxLCBhcmcyKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGZuID09PSBcInN0cmluZ1wiKSBmbiA9IGNvbnRleHRbZm5dO1xuXG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIHJldHVybiBmbi5jYWxsKGNvbnRleHQsIGFyZzEsIGFyZzIpO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgV0lORE9XLnNldFRpbWVvdXQoZnVuY3Rpb24oKSAgeyB0aHJvdyBlcnIgfSwgMSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIHJlZ2lzdGVyOiBmdW5jdGlvbihtaXhpbnMsIGRlZmF1bHRCZWhhdmlvcikge1xuICAgICAgICAgICAgZGVmYXVsdEJlaGF2aW9yID0gZGVmYXVsdEJlaGF2aW9yIHx8IGZ1bmN0aW9uKCkge307XG5cbiAgICAgICAgICAgIE9iamVjdC5rZXlzKG1peGlucykuZm9yRWFjaChmdW5jdGlvbihrZXkpICB7XG4gICAgICAgICAgICAgICAgdmFyIGRlZmF1bHRzID0gZGVmYXVsdEJlaGF2aW9yKGtleSkgfHwgZnVuY3Rpb24oKSB7IHJldHVybiB0aGlzIH07XG5cbiAgICAgICAgICAgICAgICAkRWxlbWVudC5wcm90b3R5cGVba2V5XSA9IG1peGluc1trZXldO1xuICAgICAgICAgICAgICAgICROdWxsRWxlbWVudC5wcm90b3R5cGVba2V5XSA9IGRlZmF1bHRzO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0sXG4gICAgICAgIGdldExlZ2FjeUZpbGU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIGlmIChKU0NSSVBUX1ZFUlNJT04gPCAxMCkge1xuICAgICAgICAgICAgICAgIHZhciBsZWdhY3lTY3JpcHRzID0gdXRpbCRpbmRleCQkYXJyYXlQcm90by5maWx0ZXIuY2FsbChET0NVTUVOVC5zY3JpcHRzLCBmdW5jdGlvbihlbCkgIHtyZXR1cm4gZWwuc3JjLmluZGV4T2YoXCJiZXR0ZXItZG9tLWxlZ2FjeS5qc1wiKSA+PSAwfSk7XG5cbiAgICAgICAgICAgICAgICBpZiAobGVnYWN5U2NyaXB0cy5sZW5ndGggPCAxKSB7XG4gICAgICAgICAgICAgICAgICAgIHRocm93IG5ldyBFcnJvcihcIkluIG9yZGVyIHRvIHVzZSBsaXZlIGV4dGVuc2lvbnMgaW4gSUUgPCAxMCB5b3UgaGF2ZSB0byBpbmNsdWRlIGV4dHJhIGZpbGVzLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2NoZW1lcmlzdWsvYmV0dGVyLWRvbSNub3Rlcy1hYm91dC1vbGQtaWVzIGZvciBkZXRhaWxzLlwiKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gbGVnYWN5U2NyaXB0c1swXS5zcmMucmVwbGFjZShcIi5qc1wiLCBcIi5cIiArIHR5cGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIGN1c3RvbWl6ZWQgZXJyb3JzXG5cbiAgICBmdW5jdGlvbiBlcnJvcnMkJE1ldGhvZEVycm9yKG1ldGhvZE5hbWUsIGFyZ3MpIHt2YXIgdHlwZSA9IGFyZ3VtZW50c1syXTtpZih0eXBlID09PSB2b2lkIDApdHlwZSA9IFwiJEVsZW1lbnRcIjtcbiAgICAgICAgdmFyIHVybCA9IFwiaHR0cDovL2NoZW1lcmlzdWsuZ2l0aHViLmlvL2JldHRlci1kb20vXCIgKyB0eXBlICsgXCIuaHRtbCNcIiArIG1ldGhvZE5hbWUsXG4gICAgICAgICAgICBsaW5lID0gXCJpbnZhbGlkIGNhbGwgYFwiICsgdHlwZSArICh0eXBlID09PSBcIkRPTVwiID8gXCIuXCIgOiBcIiNcIikgKyBtZXRob2ROYW1lICsgXCIoXCI7XG5cbiAgICAgICAgbGluZSArPSB1dGlsJGluZGV4JCRkZWZhdWx0Lm1hcC5jYWxsKGFyZ3MsIGZ1bmN0aW9uKGFyZykgIHtyZXR1cm4gU3RyaW5nKGFyZyl9KS5qb2luKFwiLCBcIikgKyBcIilgO1wiO1xuXG4gICAgICAgIHRoaXMubWVzc2FnZSA9IGxpbmUgKyBcIiBjaGVjayBcIiArIHVybCArIFwiIHRvIHZlcmlmeSB0aGUgZnVuY3Rpb24gYXJndW1lbnRzXCI7XG4gICAgfVxuXG4gICAgZXJyb3JzJCRNZXRob2RFcnJvci5wcm90b3R5cGUgPSBuZXcgVHlwZUVycm9yKCk7XG5cbiAgICBmdW5jdGlvbiBlcnJvcnMkJFN0YXRpY01ldGhvZEVycm9yKG1ldGhvZE5hbWUsIGFyZ3MpIHtcbiAgICAgICAgZXJyb3JzJCRNZXRob2RFcnJvci5jYWxsKHRoaXMsIG1ldGhvZE5hbWUsIGFyZ3MsIFwiRE9NXCIpO1xuICAgIH1cblxuICAgIGVycm9ycyQkU3RhdGljTWV0aG9kRXJyb3IucHJvdG90eXBlID0gbmV3IFR5cGVFcnJvcigpO1xuXG4gICAgdmFyIC8vIG9wZXJhdG9yIHR5cGUgLyBwcmlvcml0eSBvYmplY3RcbiAgICAgICAgZ2xvYmFsJGVtbWV0JCRvcGVyYXRvcnMgPSB7XCIoXCI6IDEsXCIpXCI6IDIsXCJeXCI6IDMsXCI+XCI6IDQsXCIrXCI6IDUsXCIqXCI6IDYsXCJgXCI6IDcsXCJbXCI6IDgsXCIuXCI6IDgsXCIjXCI6IDh9LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJHJlUGFyc2UgPSAvYFteYF0qYHxcXFtbXlxcXV0qXFxdfFxcLlteKCk+XisqYFsjXSt8W14oKT5eKypgWyMuXSt8XFxeK3wuL2csXG4gICAgICAgIGdsb2JhbCRlbW1ldCQkcmVBdHRyID0gL1xccyooW1xcd1xcLV0rKSg/Oj0oKD86YChbXmBdKilgKXxbXlxcc10qKSk/L2csXG4gICAgICAgIGdsb2JhbCRlbW1ldCQkcmVJbmRleCA9IC8oXFwkKykoPzpAKC0pPyhcXGQrKT8pPy9nLFxuICAgICAgICBnbG9iYWwkZW1tZXQkJHJlRG90ID0gL1xcLi9nLFxuICAgICAgICBnbG9iYWwkZW1tZXQkJHJlRG9sbGFyID0gL1xcJC9nLFxuICAgICAgICBnbG9iYWwkZW1tZXQkJHRhZ0NhY2hlID0ge1wiXCI6IFwiXCJ9LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJG5vcm1hbGl6ZUF0dHJzID0gZnVuY3Rpb24oXywgbmFtZSwgdmFsdWUsIHJhd1ZhbHVlKSAge1xuICAgICAgICAgICAgLy8gdHJ5IHRvIGRldGVtbmllIHdoaWNoIGtpbmQgb2YgcXVvdGVzIHRvIHVzZVxuICAgICAgICAgICAgdmFyIHF1b3RlID0gdmFsdWUgJiYgdmFsdWUuaW5kZXhPZihcIlxcXCJcIikgPj0gMCA/IFwiJ1wiIDogXCJcXFwiXCI7XG5cbiAgICAgICAgICAgIGlmICh0eXBlb2YgcmF3VmFsdWUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBncmFiIHVucXVvdGVkIHZhbHVlIGZvciBzbWFydCBxdW90ZXNcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IHJhd1ZhbHVlO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgdmFsdWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAvLyBoYW5kbGUgYm9vbGVhbiBhdHRyaWJ1dGVzIGJ5IHVzaW5nIG5hbWUgYXMgdmFsdWVcbiAgICAgICAgICAgICAgICB2YWx1ZSA9IG5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBhbHdheXMgd3JhcCBhdHRyaWJ1dGUgdmFsdWVzIHdpdGggcXVvdGVzIGV2ZW4gdGhleSBkb24ndCBleGlzdFxuICAgICAgICAgICAgcmV0dXJuIFwiIFwiICsgbmFtZSArIFwiPVwiICsgcXVvdGUgKyB2YWx1ZSArIHF1b3RlO1xuICAgICAgICB9LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJGluamVjdFRlcm0gPSBmdW5jdGlvbih0ZXJtLCBlbmQpICB7cmV0dXJuIGZ1bmN0aW9uKGh0bWwpICB7XG4gICAgICAgICAgICAvLyBmaW5kIGluZGV4IG9mIHdoZXJlIHRvIGluamVjdCB0aGUgdGVybVxuICAgICAgICAgICAgdmFyIGluZGV4ID0gZW5kID8gaHRtbC5sYXN0SW5kZXhPZihcIjxcIikgOiBodG1sLmluZGV4T2YoXCI+XCIpO1xuICAgICAgICAgICAgLy8gaW5qZWN0IHRoZSB0ZXJtIGludG8gdGhlIEhUTUwgc3RyaW5nXG4gICAgICAgICAgICByZXR1cm4gaHRtbC5zbGljZSgwLCBpbmRleCkgKyB0ZXJtICsgaHRtbC5zbGljZShpbmRleCk7XG4gICAgICAgIH19LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJG1ha2VUZXJtID0gZnVuY3Rpb24odGFnKSAge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbCRlbW1ldCQkdGFnQ2FjaGVbdGFnXSB8fCAoZ2xvYmFsJGVtbWV0JCR0YWdDYWNoZVt0YWddID0gXCI8XCIgKyB0YWcgKyBcIj48L1wiICsgdGFnICsgXCI+XCIpO1xuICAgICAgICB9LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJG1ha2VJbmRleGVkVGVybSA9IGZ1bmN0aW9uKG4sIHRlcm0pICB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gQXJyYXkobiksIGk7XG5cbiAgICAgICAgICAgIGZvciAoaSA9IDA7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICByZXN1bHRbaV0gPSB0ZXJtLnJlcGxhY2UoZ2xvYmFsJGVtbWV0JCRyZUluZGV4LCBmdW5jdGlvbihleHByLCBmbXQsIHNpZ24sIGJhc2UpICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IChzaWduID8gbiAtIGkgLSAxIDogaSkgKyAoYmFzZSA/ICtiYXNlIDogMSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSB6ZXJvLXBhZGRlZCBpbmRleCB2YWx1ZXMsIGxpa2UgJCQkIGV0Yy5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIChmbXQgKyBpbmRleCkuc2xpY2UoLWZtdC5sZW5ndGgpLnJlcGxhY2UoZ2xvYmFsJGVtbWV0JCRyZURvbGxhciwgXCIwXCIpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgICAgICB9LFxuICAgICAgICBnbG9iYWwkZW1tZXQkJHJlVW5zYWZlID0gL1smPD5cIiddL2csXG4gICAgICAgIC8vIGh0dHA6Ly9zdGFja292ZXJmbG93LmNvbS9xdWVzdGlvbnMvNjIzNDc3My9jYW4taS1lc2NhcGUtaHRtbC1zcGVjaWFsLWNoYXJzLWluLWphdmFzY3JpcHRcbiAgICAgICAgZ2xvYmFsJGVtbWV0JCRzYWZlU3ltYm9sID0ge1wiJlwiOiBcIiZhbXA7XCIsIFwiPFwiOiBcIiZsdDtcIiwgXCI+XCI6IFwiJmd0O1wiLCBcIlxcXCJcIjogXCImcXVvdDtcIiwgXCInXCI6IFwiJiMwMzk7XCJ9O1xuXG4gICAgLy8gcG9wdWxhdGUgZW1wdHkgdGFnIG5hbWVzIHdpdGggcmVzdWx0XG4gICAgXCJhcmVhIGJhc2UgYnIgY29sIGhyIGltZyBpbnB1dCBsaW5rIG1ldGEgcGFyYW0gY29tbWFuZCBrZXlnZW4gc291cmNlXCIuc3BsaXQoXCIgXCIpLmZvckVhY2goZnVuY3Rpb24odGFnKSAge1xuICAgICAgICBnbG9iYWwkZW1tZXQkJHRhZ0NhY2hlW3RhZ10gPSBcIjxcIiArIHRhZyArIFwiPlwiO1xuICAgIH0pO1xuXG4gICAgRE9NLmVtbWV0ID0gZnVuY3Rpb24odGVtcGxhdGUsIHZhck1hcCkge3ZhciAkRCQwO3ZhciAkRCQxO3ZhciAkRCQyO1xuICAgICAgICBpZiAodHlwZW9mIHRlbXBsYXRlICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgZXJyb3JzJCRTdGF0aWNNZXRob2RFcnJvcihcImVtbWV0XCIsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKHZhck1hcCkgdGVtcGxhdGUgPSBET00uZm9ybWF0KHRlbXBsYXRlLCB2YXJNYXApO1xuXG4gICAgICAgIGlmICh0ZW1wbGF0ZSBpbiBnbG9iYWwkZW1tZXQkJHRhZ0NhY2hlKSB7cmV0dXJuIGdsb2JhbCRlbW1ldCQkdGFnQ2FjaGVbdGVtcGxhdGVdO31cblxuICAgICAgICAvLyB0cmFuc2Zvcm0gdGVtcGxhdGUgc3RyaW5nIGludG8gUlBOXG5cbiAgICAgICAgdmFyIHN0YWNrID0gW10sIG91dHB1dCA9IFtdO1xuXG4gICAgICAgICREJDIgPSAodGVtcGxhdGUubWF0Y2goZ2xvYmFsJGVtbWV0JCRyZVBhcnNlKSk7JEQkMCA9IDA7JEQkMSA9ICREJDIubGVuZ3RoO2ZvciAodmFyIHN0ciA7JEQkMCA8ICREJDE7KXtzdHIgPSAoJEQkMlskRCQwKytdKTtcbiAgICAgICAgICAgIHZhciBvcCA9IHN0clswXTtcbiAgICAgICAgICAgIHZhciBwcmlvcml0eSA9IGdsb2JhbCRlbW1ldCQkb3BlcmF0b3JzW29wXTtcblxuICAgICAgICAgICAgaWYgKHByaW9yaXR5KSB7XG4gICAgICAgICAgICAgICAgaWYgKHN0ciAhPT0gXCIoXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gZm9yIF4gb3BlcmF0b3IgbmVlZCB0byBza2lwID4gc3RyLmxlbmd0aCB0aW1lc1xuICAgICAgICAgICAgICAgICAgICBmb3IgKHZhciBpID0gMCwgbiA9IChvcCA9PT0gXCJeXCIgPyBzdHIubGVuZ3RoIDogMSk7IGkgPCBuOyArK2kpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHdoaWxlIChzdGFja1swXSAhPT0gb3AgJiYgZ2xvYmFsJGVtbWV0JCRvcGVyYXRvcnNbc3RhY2tbMF1dID49IHByaW9yaXR5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdmFyIGhlYWQgPSBzdGFjay5zaGlmdCgpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3V0cHV0LnB1c2goaGVhZCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gZm9yIF4gb3BlcmF0b3Igc3RvcCBzaGlmdGluZyB3aGVuIHRoZSBmaXJzdCA+IGlzIGZvdW5kXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG9wID09PSBcIl5cIiAmJiBoZWFkID09PSBcIj5cIikgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoc3RyID09PSBcIilcIikge1xuICAgICAgICAgICAgICAgICAgICBzdGFjay5zaGlmdCgpOyAvLyByZW1vdmUgXCIoXCIgc3ltYm9sIGZyb20gc3RhY2tcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBoYW5kbGUgdmFsdWVzIGluc2lkZSBvZiBgLi4uYCBhbmQgWy4uLl0gc2VjdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgaWYgKG9wID09PSBcIltcIiB8fCBvcCA9PT0gXCJgXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG91dHB1dC5wdXNoKHN0ci5zbGljZSgxLCAtMSkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBtdWx0aXBsZSBjbGFzc2VzLCBlLmcuIGEub25lLnR3b1xuICAgICAgICAgICAgICAgICAgICBpZiAob3AgPT09IFwiLlwiKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChzdHIuc2xpY2UoMSkucmVwbGFjZShnbG9iYWwkZW1tZXQkJHJlRG90LCBcIiBcIikpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgc3RhY2sudW5zaGlmdChvcCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvdXRwdXQucHVzaChzdHIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9OyREJDAgPSAkRCQxID0gJEQkMiA9IHZvaWQgMDtcblxuICAgICAgICBvdXRwdXQgPSBvdXRwdXQuY29uY2F0KHN0YWNrKTtcblxuICAgICAgICAvLyB0cmFuc2Zvcm0gUlBOIGludG8gaHRtbCBub2Rlc1xuXG4gICAgICAgIHN0YWNrID0gW107XG5cbiAgICAgICAgJEQkMCA9IDA7JEQkMSA9IG91dHB1dC5sZW5ndGg7Zm9yICh2YXIgc3RyJDAgOyREJDAgPCAkRCQxOyl7c3RyJDAgPSAob3V0cHV0WyREJDArK10pO1xuICAgICAgICAgICAgaWYgKHN0ciQwIGluIGdsb2JhbCRlbW1ldCQkb3BlcmF0b3JzKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gc3RhY2suc2hpZnQoKTtcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHN0YWNrLnNoaWZ0KCk7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5vZGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZSA9IFsgZ2xvYmFsJGVtbWV0JCRtYWtlVGVybShub2RlKSBdO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHN3aXRjaChzdHIkMCkge1xuICAgICAgICAgICAgICAgIGNhc2UgXCIuXCI6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZ2xvYmFsJGVtbWV0JCRpbmplY3RUZXJtKFwiIGNsYXNzPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCIjXCI6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZ2xvYmFsJGVtbWV0JCRpbmplY3RUZXJtKFwiIGlkPVxcXCJcIiArIHZhbHVlICsgXCJcXFwiXCIpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJbXCI6XG4gICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZ2xvYmFsJGVtbWV0JCRpbmplY3RUZXJtKHZhbHVlLnJlcGxhY2UoZ2xvYmFsJGVtbWV0JCRyZUF0dHIsIGdsb2JhbCRlbW1ldCQkbm9ybWFsaXplQXR0cnMpKTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICBjYXNlIFwiKlwiOlxuICAgICAgICAgICAgICAgICAgICBub2RlID0gZ2xvYmFsJGVtbWV0JCRtYWtlSW5kZXhlZFRlcm0oK3ZhbHVlLCBub2RlLmpvaW4oXCJcIikpO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGNhc2UgXCJgXCI6XG4gICAgICAgICAgICAgICAgICAgIHN0YWNrLnVuc2hpZnQobm9kZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIGVzY2FwZSB1bnNhZmUgSFRNTCBzeW1ib2xzXG4gICAgICAgICAgICAgICAgICAgIG5vZGUgPSBbIHZhbHVlLnJlcGxhY2UoZ2xvYmFsJGVtbWV0JCRyZVVuc2FmZSwgZnVuY3Rpb24oY2gpICB7cmV0dXJuIGdsb2JhbCRlbW1ldCQkc2FmZVN5bWJvbFtjaF19KSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcblxuICAgICAgICAgICAgICAgIGRlZmF1bHQ6IHZhbHVlID0gdHlwZW9mIHZhbHVlID09PSBcInN0cmluZ1wiID8gZ2xvYmFsJGVtbWV0JCRtYWtlVGVybSh2YWx1ZSkgOiB2YWx1ZS5qb2luKFwiXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmIChzdHIkMCA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gZ2xvYmFsJGVtbWV0JCRpbmplY3RUZXJtKHZhbHVlLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUucHVzaCh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBzdHIkMCA9IHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiID8gbm9kZS5tYXAodmFsdWUpIDogbm9kZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc3RhY2sudW5zaGlmdChzdHIkMCk7XG4gICAgICAgIH07JEQkMCA9ICREJDEgPSB2b2lkIDA7XG5cbiAgICAgICAgaWYgKG91dHB1dC5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgIC8vIGhhbmRsZSBzaW5nbGUgdGFnIGNhc2VcbiAgICAgICAgICAgIG91dHB1dCA9IGdsb2JhbCRlbW1ldCQkbWFrZVRlcm0oc3RhY2tbMF0pO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgb3V0cHV0ID0gc3RhY2tbMF0uam9pbihcIlwiKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBvdXRwdXQ7XG4gICAgfTtcblxuICAgIHZhciBnbG9iYWwkZW1tZXQkJGRlZmF1bHQgPSBnbG9iYWwkZW1tZXQkJHRhZ0NhY2hlO1xuXG4gICAgdmFyIGRvY3VtZW50JGNyZWF0ZSQkbWFrZU1ldGhvZCA9IGZ1bmN0aW9uKGFsbCkgIHtyZXR1cm4gZnVuY3Rpb24odmFsdWUsIHZhck1hcCkge1xuICAgICAgICAgICAgdmFyIGRvYyA9IHRoaXNbMF0ub3duZXJEb2N1bWVudCxcbiAgICAgICAgICAgICAgICBzYW5kYm94ID0gdGhpcy5fW1wic2FuZGJveDIwMDEwMDFcIl07XG5cbiAgICAgICAgICAgIGlmICghc2FuZGJveCkge1xuICAgICAgICAgICAgICAgIHNhbmRib3ggPSBkb2MuY3JlYXRlRWxlbWVudChcImRpdlwiKTtcbiAgICAgICAgICAgICAgICB0aGlzLl9bXCJzYW5kYm94MjAwMTAwMVwiXSA9IHNhbmRib3g7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBub2RlcywgZWw7XG5cbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiB2YWx1ZSBpbiBnbG9iYWwkZW1tZXQkJGRlZmF1bHQpIHtcbiAgICAgICAgICAgICAgICBub2RlcyA9IGRvYy5jcmVhdGVFbGVtZW50KHZhbHVlKTtcblxuICAgICAgICAgICAgICAgIGlmIChhbGwpIG5vZGVzID0gWyBuZXcgJEVsZW1lbnQobm9kZXMpIF07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHZhbHVlID0gdmFsdWUudHJpbSgpO1xuXG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlWzBdID09PSBcIjxcIiAmJiB2YWx1ZVt2YWx1ZS5sZW5ndGggLSAxXSA9PT0gXCI+XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YXJNYXAgPyBET00uZm9ybWF0KHZhbHVlLCB2YXJNYXApIDogdmFsdWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBET00uZW1tZXQodmFsdWUsIHZhck1hcCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgc2FuZGJveC5pbm5lckhUTUwgPSB2YWx1ZTsgLy8gcGFyc2UgaW5wdXQgSFRNTCBzdHJpbmdcblxuICAgICAgICAgICAgICAgIGZvciAobm9kZXMgPSBhbGwgPyBbXSA6IG51bGw7IGVsID0gc2FuZGJveC5maXJzdENoaWxkOyApIHtcbiAgICAgICAgICAgICAgICAgICAgc2FuZGJveC5yZW1vdmVDaGlsZChlbCk7IC8vIGRldGFjaCBlbGVtZW50IGZyb20gdGhlIHNhbmRib3hcblxuICAgICAgICAgICAgICAgICAgICBpZiAoZWwubm9kZVR5cGUgPT09IDEpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2Rlcy5wdXNoKG5ldyAkRWxlbWVudChlbCkpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBub2RlcyA9IGVsO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7IC8vIHN0b3AgZWFybHksIGJlY2F1c2UgbmVlZCBvbmx5IHRoZSBmaXJzdCBlbGVtZW50XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbGwgPyBub2RlcyA6ICRFbGVtZW50KG5vZGVzKTtcbiAgICAgICAgfX07XG5cbiAgICAkRG9jdW1lbnQucHJvdG90eXBlLmNyZWF0ZSA9IGRvY3VtZW50JGNyZWF0ZSQkbWFrZU1ldGhvZChcIlwiKTtcblxuICAgICREb2N1bWVudC5wcm90b3R5cGUuY3JlYXRlQWxsID0gZG9jdW1lbnQkY3JlYXRlJCRtYWtlTWV0aG9kKFwiQWxsXCIpO1xuXG4gICAgJERvY3VtZW50LnByb3RvdHlwZS5pbXBvcnRTY3JpcHRzID0gZnVuY3Rpb24oKSB7dmFyIHVybHMgPSBTTElDRSQwLmNhbGwoYXJndW1lbnRzLCAwKTtcbiAgICAgICAgdmFyIGRvYyA9IHRoaXNbMF0ub3duZXJEb2N1bWVudDtcblxuICAgICAgICB2YXIgY2FsbGJhY2sgPSBmdW5jdGlvbigpICB7XG4gICAgICAgICAgICB2YXIgYXJnID0gdXJscy5zaGlmdCgpLFxuICAgICAgICAgICAgICAgIGFyZ1R5cGUgPSB0eXBlb2YgYXJnLFxuICAgICAgICAgICAgICAgIHNjcmlwdDtcblxuICAgICAgICAgICAgaWYgKGFyZ1R5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBzY3JpcHQgPSBkb2MuY3JlYXRlRWxlbWVudChcInNjcmlwdFwiKTtcbiAgICAgICAgICAgICAgICBzY3JpcHQuc3JjID0gYXJnO1xuICAgICAgICAgICAgICAgIHNjcmlwdC5vbmxvYWQgPSBjYWxsYmFjaztcbiAgICAgICAgICAgICAgICBzY3JpcHQuYXN5bmMgPSB0cnVlO1xuXG4gICAgICAgICAgICAgICAgdXRpbCRpbmRleCQkZGVmYXVsdC5pbmplY3RFbGVtZW50KHNjcmlwdCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKGFyZ1R5cGUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIGFyZygpO1xuICAgICAgICAgICAgfSBlbHNlIGlmIChhcmcpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzJCRTdGF0aWNNZXRob2RFcnJvcihcImltcG9ydFNjcmlwdHNcIiwgYXJndW1lbnRzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgICAgICBjYWxsYmFjaygpO1xuICAgIH07XG5cbiAgICAkRG9jdW1lbnQucHJvdG90eXBlLmltcG9ydFN0eWxlcyA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjc3NUZXh0KSB7XG4gICAgICAgIHZhciBzdHlsZVNoZWV0ID0gdGhpcy5fW1wic3R5bGVzMjAwMTAwMVwiXTtcblxuICAgICAgICBpZiAoIXN0eWxlU2hlZXQpIHtcbiAgICAgICAgICAgIHZhciBkb2MgPSB0aGlzWzBdLm93bmVyRG9jdW1lbnQsXG4gICAgICAgICAgICAgICAgc3R5bGVOb2RlID0gdXRpbCRpbmRleCQkZGVmYXVsdC5pbmplY3RFbGVtZW50KGRvYy5jcmVhdGVFbGVtZW50KFwic3R5bGVcIikpO1xuXG4gICAgICAgICAgICBzdHlsZVNoZWV0ID0gc3R5bGVOb2RlLnNoZWV0IHx8IHN0eWxlTm9kZS5zdHlsZVNoZWV0O1xuICAgICAgICAgICAgLy8gc3RvcmUgb2JqZWN0IGludGVybmFsbHlcbiAgICAgICAgICAgIHRoaXMuX1tcInN0eWxlczIwMDEwMDFcIl0gPSBzdHlsZVNoZWV0O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIiB8fCB0eXBlb2YgY3NzVGV4dCAhPT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgdGhyb3cgbmV3IGVycm9ycyQkU3RhdGljTWV0aG9kRXJyb3IoXCJpbXBvcnRTdHlsZXNcIiwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIGluc2VydCBydWxlcyBvbmUgYnkgb25lIGJlY2F1c2Ugb2Ygc2V2ZXJhbCByZWFzb25zOlxuICAgICAgICAvLyAxLiBJRTggZG9lcyBub3Qgc3VwcG9ydCBjb21tYSBpbiBhIHNlbGVjdG9yIHN0cmluZ1xuICAgICAgICAvLyAyLiBpZiBvbmUgc2VsZWN0b3IgZmFpbHMgaXQgZG9lc24ndCBicmVhayBvdGhlcnNcbiAgICAgICAgc2VsZWN0b3Iuc3BsaXQoXCIsXCIpLmZvckVhY2goZnVuY3Rpb24oc2VsZWN0b3IpICB7XG4gICAgICAgICAgICB0cnkge1xuICAgICAgICAgICAgICAgIGlmIChzdHlsZVNoZWV0LmNzc1J1bGVzKSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlU2hlZXQuaW5zZXJ0UnVsZShzZWxlY3RvciArIFwie1wiICsgY3NzVGV4dCArIFwifVwiLCBzdHlsZVNoZWV0LmNzc1J1bGVzLmxlbmd0aCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmIChzZWxlY3RvclswXSAhPT0gXCJAXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgc3R5bGVTaGVldC5hZGRSdWxlKHNlbGVjdG9yLCBjc3NUZXh0KTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAvLyBhZGRSdWxlIGRvZXNuJ3Qgc3VwcG9ydCBhdC1ydWxlcywgdXNlIGNzc1RleHQgaW5zdGVhZFxuICAgICAgICAgICAgICAgICAgICBzdHlsZVNoZWV0LmNzc1RleHQgKz0gc2VsZWN0b3IgKyBcIntcIiArIGNzc1RleHQgKyBcIn1cIjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGNhdGNoKGVycikge1xuICAgICAgICAgICAgICAgIC8vIHNpbGVudGx5IGlnbm9yZSBpbnZhbGlkIHJ1bGVzXG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICAvLyBIZWxwZXIgZm9yIGNzcyBzZWxlY3RvcnNcblxuICAgIHZhciB1dGlsJHNlbGVjdG9ybWF0Y2hlciQkcnF1aWNrSXMgPSAvXihcXHcqKSg/OiMoW1xcd1xcLV0rKSk/KD86XFxbKFtcXHdcXC1cXD1dKylcXF0pPyg/OlxcLihbXFx3XFwtXSspKT8kLyxcbiAgICAgICAgdXRpbCRzZWxlY3Rvcm1hdGNoZXIkJHByb3BOYW1lID0gXCJtIG9NIG1zTSBtb3pNIHdlYmtpdE1cIi5zcGxpdChcIiBcIikucmVkdWNlKGZ1bmN0aW9uKHJlc3VsdCwgcHJlZml4KSAge1xuICAgICAgICAgICAgICAgIHZhciBwcm9wZXJ0eU5hbWUgPSBwcmVmaXggKyBcImF0Y2hlc1NlbGVjdG9yXCI7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gcmVzdWx0IHx8IEhUTUxbcHJvcGVydHlOYW1lXSAmJiBwcm9wZXJ0eU5hbWU7XG4gICAgICAgICAgICB9LCBudWxsKTtcblxuICAgIHZhciB1dGlsJHNlbGVjdG9ybWF0Y2hlciQkZGVmYXVsdCA9IGZ1bmN0aW9uKHNlbGVjdG9yLCBjb250ZXh0KSB7XG4gICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHJldHVybiBudWxsO1xuXG4gICAgICAgIHZhciBxdWljayA9IHV0aWwkc2VsZWN0b3JtYXRjaGVyJCRycXVpY2tJcy5leGVjKHNlbGVjdG9yKTtcblxuICAgICAgICBpZiAocXVpY2spIHtcbiAgICAgICAgICAgIC8vIFF1aWNrIG1hdGNoaW5nIGlzIGluc3BpcmVkIGJ5IGpRdWVyeTpcbiAgICAgICAgICAgIC8vICAgMCAgMSAgICAyICAgMyAgICAgICAgICA0XG4gICAgICAgICAgICAvLyBbIF8sIHRhZywgaWQsIGF0dHJpYnV0ZSwgY2xhc3MgXVxuICAgICAgICAgICAgaWYgKHF1aWNrWzFdKSBxdWlja1sxXSA9IHF1aWNrWzFdLnRvTG93ZXJDYXNlKCk7XG4gICAgICAgICAgICBpZiAocXVpY2tbM10pIHF1aWNrWzNdID0gcXVpY2tbM10uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgaWYgKHF1aWNrWzRdKSBxdWlja1s0XSA9IFwiIFwiICsgcXVpY2tbNF0gKyBcIiBcIjtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBmdW5jdGlvbihub2RlKSB7dmFyICREJDM7dmFyICREJDQ7XG4gICAgICAgICAgICB2YXIgcmVzdWx0LCBmb3VuZDtcbiAgICAgICAgICAgIGlmICghcXVpY2sgJiYgIXV0aWwkc2VsZWN0b3JtYXRjaGVyJCRwcm9wTmFtZSkge1xuICAgICAgICAgICAgICAgIGZvdW5kID0gKGNvbnRleHQgfHwgbm9kZS5vd25lckRvY3VtZW50KS5xdWVyeVNlbGVjdG9yQWxsKHNlbGVjdG9yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICg7IG5vZGUgJiYgbm9kZS5ub2RlVHlwZSA9PT0gMTsgbm9kZSA9IG5vZGUucGFyZW50Tm9kZSkge1xuICAgICAgICAgICAgICAgIGlmIChxdWljaykge1xuICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSAoXG4gICAgICAgICAgICAgICAgICAgICAgICAoIXF1aWNrWzFdIHx8IG5vZGUubm9kZU5hbWUudG9Mb3dlckNhc2UoKSA9PT0gcXVpY2tbMV0pICYmXG4gICAgICAgICAgICAgICAgICAgICAgICAoIXF1aWNrWzJdIHx8IG5vZGUuaWQgPT09IHF1aWNrWzJdKSAmJlxuICAgICAgICAgICAgICAgICAgICAgICAgKCFxdWlja1szXSB8fCAocXVpY2tbM11bMV0gPyBub2RlLmdldEF0dHJpYnV0ZShxdWlja1szXVswXSkgPT09IHF1aWNrWzNdWzFdIDogbm9kZS5oYXNBdHRyaWJ1dGUocXVpY2tbM11bMF0pKSkgJiZcbiAgICAgICAgICAgICAgICAgICAgICAgICghcXVpY2tbNF0gfHwgKFwiIFwiICsgbm9kZS5jbGFzc05hbWUgKyBcIiBcIikuaW5kZXhPZihxdWlja1s0XSkgPj0gMClcbiAgICAgICAgICAgICAgICAgICAgKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBpZiAodXRpbCRzZWxlY3Rvcm1hdGNoZXIkJHByb3BOYW1lKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXN1bHQgPSBub2RlW3V0aWwkc2VsZWN0b3JtYXRjaGVyJCRwcm9wTmFtZV0oc2VsZWN0b3IpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgJEQkMyA9IDA7JEQkNCA9IGZvdW5kLmxlbmd0aDtmb3IgKHZhciBuIDskRCQzIDwgJEQkNDspe24gPSAoZm91bmRbJEQkMysrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKG4gPT09IG5vZGUpIHJldHVybiBuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfTskRCQzID0gJEQkNCA9IHZvaWQgMDtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgfHwgIWNvbnRleHQgfHwgbm9kZSA9PT0gY29udGV4dCkgYnJlYWs7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiByZXN1bHQgJiYgbm9kZTtcbiAgICAgICAgfTtcbiAgICB9O1xuXG4gICAgdmFyIGVsZW1lbnQkY2hpbGRyZW4kJG1ha2VNZXRob2QgPSBmdW5jdGlvbihhbGwpICB7cmV0dXJuIGZ1bmN0aW9uKHNlbGVjdG9yKSB7XG4gICAgICAgIGlmIChhbGwpIHtcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciAmJiB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiY2hpbGRyZW5cIiwgYXJndW1lbnRzKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmIChzZWxlY3RvciAmJiB0eXBlb2Ygc2VsZWN0b3IgIT09IFwibnVtYmVyXCIpIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiY2hpbGRcIiwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBub2RlID0gdGhpc1swXSxcbiAgICAgICAgICAgIG1hdGNoZXIgPSB1dGlsJHNlbGVjdG9ybWF0Y2hlciQkZGVmYXVsdChzZWxlY3RvciksXG4gICAgICAgICAgICBjaGlsZHJlbiA9IG5vZGUuY2hpbGRyZW47XG4gICAgICAgIGlmIChKU0NSSVBUX1ZFUlNJT04gPCA5KSB7XG4gICAgICAgICAgICAvLyBmaXggSUU4IGJ1ZyB3aXRoIGNoaWxkcmVuIGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGNoaWxkcmVuID0gdXRpbCRpbmRleCQkZGVmYXVsdC5maWx0ZXIuY2FsbChjaGlsZHJlbiwgZnVuY3Rpb24obm9kZSkgIHtyZXR1cm4gbm9kZS5ub2RlVHlwZSA9PT0gMX0pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFsbCkge1xuICAgICAgICAgICAgaWYgKG1hdGNoZXIpIGNoaWxkcmVuID0gdXRpbCRpbmRleCQkZGVmYXVsdC5maWx0ZXIuY2FsbChjaGlsZHJlbiwgbWF0Y2hlcik7XG5cbiAgICAgICAgICAgIHJldHVybiB1dGlsJGluZGV4JCRkZWZhdWx0Lm1hcC5jYWxsKGNoaWxkcmVuLCAkRWxlbWVudCk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBpZiAoc2VsZWN0b3IgPCAwKSBzZWxlY3RvciA9IGNoaWxkcmVuLmxlbmd0aCArIHNlbGVjdG9yO1xuXG4gICAgICAgICAgICByZXR1cm4gJEVsZW1lbnQoY2hpbGRyZW5bc2VsZWN0b3JdKTtcbiAgICAgICAgfVxuICAgIH19O1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGNoaWxkOiBlbGVtZW50JGNoaWxkcmVuJCRtYWtlTWV0aG9kKGZhbHNlKSxcblxuICAgICAgICBjaGlsZHJlbjogZWxlbWVudCRjaGlsZHJlbiQkbWFrZU1ldGhvZCh0cnVlKVxuICAgIH0sIGZ1bmN0aW9uKG1ldGhvZE5hbWUpICB7XG4gICAgICAgIHJldHVybiBtZXRob2ROYW1lID09PSBcImNoaWxkXCIgPyBmdW5jdGlvbigpICB7cmV0dXJuIG5ldyAkTnVsbEVsZW1lbnQoKX0gOiBmdW5jdGlvbigpICB7cmV0dXJuIFtdfTtcbiAgICB9KTtcblxuICAgIHZhciBlbGVtZW50JGNsYXNzZXMkJHJlU3BhY2UgPSAvW1xcblxcdFxccl0vZyxcbiAgICAgICAgZWxlbWVudCRjbGFzc2VzJCRtYWtlTWV0aG9kID0gZnVuY3Rpb24obmF0aXZlTWV0aG9kTmFtZSwgc3RyYXRlZ3kpICB7XG4gICAgICAgICAgICB2YXIgbWV0aG9kTmFtZSA9IG5hdGl2ZU1ldGhvZE5hbWUgPT09IFwiY29udGFpbnNcIiA/IFwiaGFzQ2xhc3NcIiA6IG5hdGl2ZU1ldGhvZE5hbWUgKyBcIkNsYXNzXCI7XG4gICAgICAgICAgICBpZiAoSFRNTC5jbGFzc0xpc3QpIHtcbiAgICAgICAgICAgICAgICAvLyB1c2UgbmF0aXZlIGNsYXNzTGlzdCBwcm9wZXJ0eSBpZiBwb3NzaWJsZVxuICAgICAgICAgICAgICAgIHN0cmF0ZWd5ID0gZnVuY3Rpb24oZWwsIHRva2VuKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBlbFswXS5jbGFzc0xpc3RbbmF0aXZlTWV0aG9kTmFtZV0odG9rZW4pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChtZXRob2ROYW1lID09PSBcImhhc0NsYXNzXCIgfHwgbWV0aG9kTmFtZSA9PT0gXCJ0b2dnbGVDbGFzc1wiKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGZvcmNlID09PSBcImJvb2xlYW5cIiAmJiBtZXRob2ROYW1lID09PSBcInRvZ2dsZUNsYXNzXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHRoaXNbZm9yY2UgPyBcImFkZENsYXNzXCIgOiBcInJlbW92ZUNsYXNzXCJdKHRva2VuKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZvcmNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiB0b2tlbiAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IGVycm9ycyQkTWV0aG9kRXJyb3IobWV0aG9kTmFtZSwgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gc3RyYXRlZ3kodGhpcywgdG9rZW4pO1xuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpIHt2YXIgJEQkNTt2YXIgJEQkNjtcbiAgICAgICAgICAgICAgICAgICAgdmFyIHRva2VucyA9IGFyZ3VtZW50cztcblxuICAgICAgICAgICAgICAgICAgICAkRCQ1ID0gMDskRCQ2ID0gdG9rZW5zLmxlbmd0aDtmb3IgKHZhciB0b2tlbiA7JEQkNSA8ICREJDY7KXt0b2tlbiA9ICh0b2tlbnNbJEQkNSsrXSk7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHRva2VuICE9PSBcInN0cmluZ1wiKSB0aHJvdyBuZXcgZXJyb3JzJCRNZXRob2RFcnJvcihtZXRob2ROYW1lLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICBzdHJhdGVneSh0aGlzLCB0b2tlbik7XG4gICAgICAgICAgICAgICAgICAgIH07JEQkNSA9ICREJDYgPSB2b2lkIDA7XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBoYXNDbGFzczogZWxlbWVudCRjbGFzc2VzJCRtYWtlTWV0aG9kKFwiY29udGFpbnNcIiwgZnVuY3Rpb24oZWwsIHRva2VuKSAge1xuICAgICAgICAgICAgcmV0dXJuIChcIiBcIiArIGVsWzBdLmNsYXNzTmFtZSArIFwiIFwiKVxuICAgICAgICAgICAgICAgIC5yZXBsYWNlKGVsZW1lbnQkY2xhc3NlcyQkcmVTcGFjZSwgXCIgXCIpLmluZGV4T2YoXCIgXCIgKyB0b2tlbiArIFwiIFwiKSA+PSAwO1xuICAgICAgICB9KSxcblxuICAgICAgICBhZGRDbGFzczogZWxlbWVudCRjbGFzc2VzJCRtYWtlTWV0aG9kKFwiYWRkXCIsIGZ1bmN0aW9uKGVsLCB0b2tlbikgIHtcbiAgICAgICAgICAgIGlmICghZWwuaGFzQ2xhc3ModG9rZW4pKSBlbFswXS5jbGFzc05hbWUgKz0gXCIgXCIgKyB0b2tlbjtcbiAgICAgICAgfSksXG5cbiAgICAgICAgcmVtb3ZlQ2xhc3M6IGVsZW1lbnQkY2xhc3NlcyQkbWFrZU1ldGhvZChcInJlbW92ZVwiLCBmdW5jdGlvbihlbCwgdG9rZW4pICB7XG4gICAgICAgICAgICBlbFswXS5jbGFzc05hbWUgPSAoXCIgXCIgKyBlbFswXS5jbGFzc05hbWUgKyBcIiBcIilcbiAgICAgICAgICAgICAgICAucmVwbGFjZShlbGVtZW50JGNsYXNzZXMkJHJlU3BhY2UsIFwiIFwiKS5yZXBsYWNlKFwiIFwiICsgdG9rZW4gKyBcIiBcIiwgXCIgXCIpLnRyaW0oKTtcbiAgICAgICAgfSksXG5cbiAgICAgICAgdG9nZ2xlQ2xhc3M6IGVsZW1lbnQkY2xhc3NlcyQkbWFrZU1ldGhvZChcInRvZ2dsZVwiLCBmdW5jdGlvbihlbCwgdG9rZW4pICB7XG4gICAgICAgICAgICB2YXIgaGFzQ2xhc3MgPSBlbC5oYXNDbGFzcyh0b2tlbik7XG5cbiAgICAgICAgICAgIGlmIChoYXNDbGFzcykge1xuICAgICAgICAgICAgICAgIGVsLnJlbW92ZUNsYXNzKHRva2VuKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgZWxbMF0uY2xhc3NOYW1lICs9IFwiIFwiICsgdG9rZW47XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiAhaGFzQ2xhc3M7XG4gICAgICAgIH0pXG4gICAgfSwgZnVuY3Rpb24obWV0aG9kTmFtZSkgIHtcbiAgICAgICAgaWYgKG1ldGhvZE5hbWUgPT09IFwiaGFzQ2xhc3NcIiB8fCBtZXRob2ROYW1lID09PSBcInRvZ2dsZUNsYXNzXCIpIHtcbiAgICAgICAgICAgIHJldHVybiBmdW5jdGlvbigpICB7cmV0dXJuIGZhbHNlfTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGNsb25lOiBmdW5jdGlvbihkZWVwKSB7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGRlZXAgIT09IFwiYm9vbGVhblwiKSB0aHJvdyBuZXcgZXJyb3JzJCRNZXRob2RFcnJvcihcImNsb25lXCIsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXSwgcmVzdWx0O1xuICAgICAgICAgICAgaWYgKEpTQ1JJUFRfVkVSU0lPTiA8IDkpIHtcbiAgICAgICAgICAgICAgICByZXN1bHQgPSBET00uY3JlYXRlKG5vZGUub3V0ZXJIVE1MKTtcblxuICAgICAgICAgICAgICAgIGlmICghZGVlcCkgcmVzdWx0LnNldChcIlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gbmV3ICRFbGVtZW50KG5vZGUuY2xvbmVOb2RlKGRlZXApKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHJlc3VsdDtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gbmV3ICROdWxsRWxlbWVudCgpfTtcbiAgICB9KTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBjb250YWluczogZnVuY3Rpb24oZWxlbWVudCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzWzBdO1xuXG4gICAgICAgICAgICBpZiAoZWxlbWVudCBpbnN0YW5jZW9mICRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgdmFyIG90aGVyTm9kZSA9IGVsZW1lbnRbMF07XG5cbiAgICAgICAgICAgICAgICBpZiAob3RoZXJOb2RlID09PSBub2RlKSByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICBpZiAobm9kZS5jb250YWlucykge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZS5jb250YWlucyhvdGhlck5vZGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmNvbXBhcmVEb2N1bWVudFBvc2l0aW9uKG90aGVyTm9kZSkgJiAxNjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiY29udGFpbnNcIiwgYXJndW1lbnRzKTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gZmFsc2V9O1xuICAgIH0pO1xuXG4gICAgLy8gSW5zcGlyZWQgYnkgdGhlIGFydGljbGUgd3JpdHRlbiBieSBEYW5pZWwgQnVjaG5lcjpcbiAgICAvLyBodHRwOi8vd3d3LmJhY2thbGxleWNvZGVyLmNvbS8yMDE0LzA0LzE4L2VsZW1lbnQtcXVlcmllcy1mcm9tLXRoZS1mZWV0LXVwL1xuXG4gICAgdmFyIGVsZW1lbnQkY29udGV4dCQkQ09OVEVYVF9URU1QTEFURSA9IFwiZGl2W3N0eWxlPW92ZXJmbG93OmhpZGRlbl0+b2JqZWN0W2RhdGE9YGFib3V0OmJsYW5rYCB0eXBlPXRleHQvaHRtbCBzdHlsZT1gcG9zaXRpb246YWJzb2x1dGVgIHdpZHRoPTEwMCUgaGVpZ2h0PTEwMCVdXCI7XG4gICAgaWYgKEpTQ1JJUFRfVkVSU0lPTikge1xuICAgICAgICAvLyB1c2UgY2FsYyB0byBjdXQgdWdseSBmcmFtZSBib3JkZXIgaW4gSUU+OFxuICAgICAgICBlbGVtZW50JGNvbnRleHQkJENPTlRFWFRfVEVNUExBVEUgPSBlbGVtZW50JGNvbnRleHQkJENPTlRFWFRfVEVNUExBVEUucmVwbGFjZShcInBvc2l0aW9uOmFic29sdXRlXCIsIFwid2lkdGg6Y2FsYygxMDAlICsgNHB4KTtoZWlnaHQ6Y2FsYygxMDAlICsgNHB4KTtsZWZ0Oi0ycHg7dG9wOi0ycHg7cG9zaXRpb246YWJzb2x1dGVcIik7XG5cbiAgICAgICAgaWYgKEpTQ1JJUFRfVkVSU0lPTiA+IDgpIHtcbiAgICAgICAgICAgIC8vIGZvciBJRT44IGhhdmUgdG8gc2V0IHRoZSBkYXRhIGF0dHJpYnV0ZSBBRlRFUiBhZGRpbmcgZWxlbWVudCB0byB0aGUgRE9NXG4gICAgICAgICAgICBlbGVtZW50JGNvbnRleHQkJENPTlRFWFRfVEVNUExBVEUgPSBlbGVtZW50JGNvbnRleHQkJENPTlRFWFRfVEVNUExBVEUucmVwbGFjZShcImRhdGE9YGFib3V0OmJsYW5rYCBcIiwgXCJcIik7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBJRTggZmFpbHMgd2l0aCBhYm91dDpibGFuaywgdXNlIGJldHRlci1kb20tbGVnYWN5Lmh0bWwgaW5zdGVhZFxuICAgICAgICAgICAgZWxlbWVudCRjb250ZXh0JCRDT05URVhUX1RFTVBMQVRFID0gZWxlbWVudCRjb250ZXh0JCRDT05URVhUX1RFTVBMQVRFLnJlcGxhY2UoXCJhYm91dDpibGFua1wiLCB1dGlsJGluZGV4JCRkZWZhdWx0LmdldExlZ2FjeUZpbGUoXCJodG1sXCIpKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vIENocm9tZS9TYWZhcmkvT3BlcmEgaGF2ZSBzZXJpb3VzIGJ1ZyB3aXRoIHRhYmJpbmcgdG8gdGhlIDxvYmplY3Q+IHRyZWU6XG4gICAgLy8gaHR0cHM6Ly9jb2RlLmdvb2dsZS5jb20vcC9jaHJvbWl1bS9pc3N1ZXMvZGV0YWlsP2lkPTI1NTE1MFxuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGNvbnRleHQ6IGZ1bmN0aW9uKG5hbWUpIHt2YXIgY2FsbGJhY2sgPSBhcmd1bWVudHNbMV07aWYoY2FsbGJhY2sgPT09IHZvaWQgMCljYWxsYmFjayA9IGZ1bmN0aW9uKCkgIHt9O1xuICAgICAgICAgICAgdmFyIGNvbnRleHRzID0gdGhpcy5fW1wiY29udGV4dDIwMDEwMDFcIl0sXG4gICAgICAgICAgICAgICAgZGF0YSA9IGNvbnRleHRzW25hbWVdIHx8IFtdO1xuXG4gICAgICAgICAgICBpZiAoZGF0YVswXSkge1xuICAgICAgICAgICAgICAgIC8vIGNhbGxiYWNrIGlzIGFsd2F5cyBhc3luY1xuICAgICAgICAgICAgICAgIFdJTkRPVy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgIHsgY2FsbGJhY2soZGF0YVsxXSkgfSwgMSk7XG5cbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVswXTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIC8vIHVzZSBpbm5lckhUTUwgaW5zdGVhZCBvZiBjcmVhdGluZyBlbGVtZW50IG1hbnVhbGx5IGJlY2F1c2Ugb2YgSUU4XG4gICAgICAgICAgICB2YXIgY3R4ID0gRE9NLmNyZWF0ZShlbGVtZW50JGNvbnRleHQkJENPTlRFWFRfVEVNUExBVEUpO1xuICAgICAgICAgICAgdmFyIG9iamVjdCA9IGN0eC5nZXQoXCJmaXJzdENoaWxkXCIpO1xuICAgICAgICAgICAgLy8gc2V0IG9ubG9hZCBoYW5kbGVyIGJlZm9yZSBhZGRpbmcgZWxlbWVudCB0byB0aGUgRE9NXG4gICAgICAgICAgICBvYmplY3Qub25sb2FkID0gZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgICAgIC8vIGFwcGx5IHVzZXItZGVmaW5lZCBzdHlsZXMgZm9yIHRoZSBjb250ZXh0XG4gICAgICAgICAgICAgICAgLy8gbmVlZCB0byBhZGQgY2xhc3MgaW4gcmVhZHkgY2FsbGJhY2sgYmVjYXVzZSBvZiBJRThcbiAgICAgICAgICAgICAgICBpZiAoY3R4LmFkZENsYXNzKG5hbWUpLmNzcyhcInBvc2l0aW9uXCIpID09PSBcInN0YXRpY1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIGN0eC5jc3MoXCJwb3NpdGlvblwiLCBcInJlbGF0aXZlXCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyBzdG9yZSBuZXcgY29udGV4dCByb290IGludGVybmFsbHkgYW5kIGludm9rZSBjYWxsYmFja1xuICAgICAgICAgICAgICAgIGNhbGxiYWNrKGRhdGFbMV0gPSBuZXcgJERvY3VtZW50KG9iamVjdC5jb250ZW50RG9jdW1lbnQpKTtcbiAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgIHRoaXMuYmVmb3JlKGN0eCk7XG4gICAgICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OKSB7XG4gICAgICAgICAgICAgICAgLy8gSUUgZG9lc24ndCB3b3JrIGlmIHRvIHNldCB0aGUgZGF0YSBhdHRyaWJ1dGUgYmVmb3JlIGFkZGluZ1xuICAgICAgICAgICAgICAgIC8vIHRoZSA8b2JqZWN0PiBlbGVtZW50IHRvIHRoZSBET00uIElFOCB3aWxsIGlnbm9yZSB0aGlzIGNoYW5nZVxuICAgICAgICAgICAgICAgIC8vIGFuZCB3b24ndCBzdGFydCBidWlsaW5nIGEgbmV3IGRvY3VtZW50IGZvciBhYm91dDpibGFua1xuICAgICAgICAgICAgICAgIG9iamVjdC5kYXRhID0gXCJhYm91dDpibGFua1wiO1xuXG4gICAgICAgICAgICAgICAgaWYgKEpTQ1JJUFRfVkVSU0lPTiA8IDkpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gSUU4IGRvZXMgbm90IHN1cHBvcnQgb25sb2FkIC0gdXNlIHRpbWVvdXQgaW5zdGVhZFxuICAgICAgICAgICAgICAgICAgICBET00ucmVxdWVzdEZyYW1lKGZ1bmN0aW9uIHJlcGVhdCgpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICghb2JqZWN0LmNvbnRlbnREb2N1bWVudCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBET00ucmVxdWVzdEZyYW1lKHJlcGVhdCk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHZhciBmcmFtZUlkO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWRkIGV4dHJhIHNpemVzIGFuZCBjdXQgdGhlIGZyYW1lIGJvcmRlclxuICAgICAgICAgICAgICAgICAgICAgICAgY3R4WzBdLmF0dGFjaEV2ZW50KFwib25yZXNpemVcIiwgZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGZyYW1lSWQgPSBmcmFtZUlkIHx8IERPTS5yZXF1ZXN0RnJhbWUoZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3Qud2lkdGggPSBjdHhbMF0ub2Zmc2V0V2lkdGggKyA0O1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBvYmplY3QuaGVpZ2h0ID0gY3R4WzBdLm9mZnNldEhlaWdodCArIDQ7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgZnJhbWVJZCA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgb2JqZWN0Lm9ubG9hZCgpO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBzdG9yZSBjb250ZXh0IGRhdGEgaW50ZXJuYWxseVxuICAgICAgICAgICAgY29udGV4dHNbbmFtZV0gPSBkYXRhO1xuXG4gICAgICAgICAgICByZXR1cm4gZGF0YVswXSA9IGN0eDtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgLy8gSGVscGVyIGZvciBDU1MgcHJvcGVydGllcyBhY2Nlc3NcblxuICAgIHZhciB1dGlsJHN0eWxlaG9va3MkJHJlRGFzaCA9IC9cXC0uL2csXG4gICAgICAgIHV0aWwkc3R5bGVob29rcyQkY3NzUHJlZml4ZXMgPSBbXCJXZWJraXRcIiwgXCJPXCIsIFwiTW96XCIsIFwibXNcIl0sXG4gICAgICAgIHV0aWwkc3R5bGVob29rcyQkaG9va3MgPSB7Z2V0OiB7fSwgc2V0OiB7fSwgZmluZDogZnVuY3Rpb24obmFtZSwgc3R5bGUpIHtcbiAgICAgICAgICAgIHZhciBwcm9wTmFtZSA9IG5hbWUucmVwbGFjZSh1dGlsJHN0eWxlaG9va3MkJHJlRGFzaCwgZnVuY3Rpb24oc3RyKSAge3JldHVybiBzdHJbMV0udG9VcHBlckNhc2UoKX0pO1xuXG4gICAgICAgICAgICBpZiAoIShwcm9wTmFtZSBpbiBzdHlsZSkpIHtcbiAgICAgICAgICAgICAgICBwcm9wTmFtZSA9IHV0aWwkc3R5bGVob29rcyQkY3NzUHJlZml4ZXNcbiAgICAgICAgICAgICAgICAgICAgLm1hcChmdW5jdGlvbihwcmVmaXgpICB7cmV0dXJuIHByZWZpeCArIHByb3BOYW1lWzBdLnRvVXBwZXJDYXNlKCkgKyBwcm9wTmFtZS5zbGljZSgxKX0pXG4gICAgICAgICAgICAgICAgICAgIC5maWx0ZXIoZnVuY3Rpb24ocHJvcCkgIHtyZXR1cm4gcHJvcCBpbiBzdHlsZX0pWzBdO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcy5nZXRbbmFtZV0gPSB0aGlzLnNldFtuYW1lXSA9IHByb3BOYW1lO1xuICAgICAgICB9fSxcbiAgICAgICAgdXRpbCRzdHlsZWhvb2tzJCRkaXJlY3Rpb25zID0gW1wiVG9wXCIsIFwiUmlnaHRcIiwgXCJCb3R0b21cIiwgXCJMZWZ0XCJdLFxuICAgICAgICB1dGlsJHN0eWxlaG9va3MkJHNob3J0Q3V0cyA9IHtcbiAgICAgICAgICAgIGZvbnQ6IFtcImZvbnRTdHlsZVwiLCBcImZvbnRTaXplXCIsIFwiL1wiLCBcImxpbmVIZWlnaHRcIiwgXCJmb250RmFtaWx5XCJdLFxuICAgICAgICAgICAgcGFkZGluZzogdXRpbCRzdHlsZWhvb2tzJCRkaXJlY3Rpb25zLm1hcChmdW5jdGlvbihkaXIpICB7cmV0dXJuIFwicGFkZGluZ1wiICsgZGlyfSksXG4gICAgICAgICAgICBtYXJnaW46IHV0aWwkc3R5bGVob29rcyQkZGlyZWN0aW9ucy5tYXAoZnVuY3Rpb24oZGlyKSAge3JldHVybiBcIm1hcmdpblwiICsgZGlyfSksXG4gICAgICAgICAgICBcImJvcmRlci13aWR0aFwiOiB1dGlsJHN0eWxlaG9va3MkJGRpcmVjdGlvbnMubWFwKGZ1bmN0aW9uKGRpcikgIHtyZXR1cm4gXCJib3JkZXJcIiArIGRpciArIFwiV2lkdGhcIn0pLFxuICAgICAgICAgICAgXCJib3JkZXItc3R5bGVcIjogdXRpbCRzdHlsZWhvb2tzJCRkaXJlY3Rpb25zLm1hcChmdW5jdGlvbihkaXIpICB7cmV0dXJuIFwiYm9yZGVyXCIgKyBkaXIgKyBcIlN0eWxlXCJ9KVxuICAgICAgICB9O1xuXG4gICAgLy8gRXhjbHVkZSB0aGUgZm9sbG93aW5nIGNzcyBwcm9wZXJ0aWVzIGZyb20gYWRkaW5nIHB4XG4gICAgXCIgZmxvYXQgZmlsbC1vcGFjaXR5IGZvbnQtd2VpZ2h0IGxpbmUtaGVpZ2h0IG9wYWNpdHkgb3JwaGFucyB3aWRvd3Mgei1pbmRleCB6b29tIFwiLnNwbGl0KFwiIFwiKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3BOYW1lKSAge1xuICAgICAgICB2YXIgc3R5bGVQcm9wTmFtZSA9IHByb3BOYW1lLnJlcGxhY2UodXRpbCRzdHlsZWhvb2tzJCRyZURhc2gsIGZ1bmN0aW9uKHN0cikgIHtyZXR1cm4gc3RyWzFdLnRvVXBwZXJDYXNlKCl9KTtcblxuICAgICAgICBpZiAocHJvcE5hbWUgPT09IFwiZmxvYXRcIikge1xuICAgICAgICAgICAgc3R5bGVQcm9wTmFtZSA9IFwiY3NzRmxvYXRcIiBpbiBIVE1MLnN0eWxlID8gXCJjc3NGbG9hdFwiIDogXCJzdHlsZUZsb2F0XCI7XG4gICAgICAgICAgICAvLyBub3JtYWxpemUgZmxvYXQgY3NzIHByb3BlcnR5XG4gICAgICAgICAgICB1dGlsJHN0eWxlaG9va3MkJGhvb2tzLmdldFtwcm9wTmFtZV0gPSB1dGlsJHN0eWxlaG9va3MkJGhvb2tzLnNldFtwcm9wTmFtZV0gPSBzdHlsZVByb3BOYW1lO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgdXRpbCRzdHlsZWhvb2tzJCRob29rcy5nZXRbcHJvcE5hbWVdID0gc3R5bGVQcm9wTmFtZTtcbiAgICAgICAgICAgIHV0aWwkc3R5bGVob29rcyQkaG9va3Muc2V0W3Byb3BOYW1lXSA9IGZ1bmN0aW9uKHZhbHVlLCBzdHlsZSkgIHtcbiAgICAgICAgICAgICAgICBzdHlsZVtzdHlsZVByb3BOYW1lXSA9IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICAvLyBub3JtYWxpemUgcHJvcGVydHkgc2hvcnRjdXRzXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5rZXlzKHV0aWwkc3R5bGVob29rcyQkc2hvcnRDdXRzKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkgIHtcbiAgICAgICAgdmFyIHByb3BzID0gdXRpbCRzdHlsZWhvb2tzJCRzaG9ydEN1dHNba2V5XTtcblxuICAgICAgICB1dGlsJHN0eWxlaG9va3MkJGhvb2tzLmdldFtrZXldID0gZnVuY3Rpb24oc3R5bGUpICB7XG4gICAgICAgICAgICB2YXIgcmVzdWx0ID0gW10sXG4gICAgICAgICAgICAgICAgaGFzRW1wdHlTdHlsZVZhbHVlID0gZnVuY3Rpb24ocHJvcCwgaW5kZXgpICB7XG4gICAgICAgICAgICAgICAgICAgIHJlc3VsdC5wdXNoKHByb3AgPT09IFwiL1wiID8gcHJvcCA6IHN0eWxlW3Byb3BdKTtcblxuICAgICAgICAgICAgICAgICAgICByZXR1cm4gIXJlc3VsdFtpbmRleF07XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHByb3BzLnNvbWUoaGFzRW1wdHlTdHlsZVZhbHVlKSA/IFwiXCIgOiByZXN1bHQuam9pbihcIiBcIik7XG4gICAgICAgIH07XG5cbiAgICAgICAgdXRpbCRzdHlsZWhvb2tzJCRob29rcy5zZXRba2V5XSA9IGZ1bmN0aW9uKHZhbHVlLCBzdHlsZSkgIHtcbiAgICAgICAgICAgIGlmICh2YWx1ZSAmJiBcImNzc1RleHRcIiBpbiBzdHlsZSkge1xuICAgICAgICAgICAgICAgIC8vIG5vcm1hbGl6ZSBzZXR0aW5nIGNvbXBsZXggcHJvcGVydHkgYWNyb3NzIGJyb3dzZXJzXG4gICAgICAgICAgICAgICAgc3R5bGUuY3NzVGV4dCArPSBcIjtcIiArIGtleSArIFwiOlwiICsgdmFsdWU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHByb3BzLmZvckVhY2goZnVuY3Rpb24obmFtZSkgIHtyZXR1cm4gc3R5bGVbbmFtZV0gPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSArIFwicHhcIiA6IHZhbHVlLnRvU3RyaW5nKCl9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfTtcbiAgICB9KTtcblxuICAgIHZhciB1dGlsJHN0eWxlaG9va3MkJGRlZmF1bHQgPSB1dGlsJHN0eWxlaG9va3MkJGhvb2tzO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGNzczogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgICAgIHZhciBsZW4gPSBhcmd1bWVudHMubGVuZ3RoLFxuICAgICAgICAgICAgICAgIG5vZGUgPSB0aGlzWzBdLFxuICAgICAgICAgICAgICAgIHN0eWxlID0gbm9kZS5zdHlsZSxcbiAgICAgICAgICAgICAgICBjb21wdXRlZDtcblxuICAgICAgICAgICAgaWYgKGxlbiA9PT0gMSAmJiAodHlwZW9mIG5hbWUgPT09IFwic3RyaW5nXCIgfHwgdXRpbCRpbmRleCQkZGVmYXVsdC5pc0FycmF5KG5hbWUpKSkge1xuICAgICAgICAgICAgICAgIHZhciBzdHJhdGVneSA9IGZ1bmN0aW9uKG5hbWUpICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBnZXR0ZXIgPSB1dGlsJHN0eWxlaG9va3MkJGRlZmF1bHQuZ2V0W25hbWVdIHx8IHV0aWwkc3R5bGVob29rcyQkZGVmYXVsdC5maW5kKG5hbWUsIHN0eWxlKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gdHlwZW9mIGdldHRlciA9PT0gXCJmdW5jdGlvblwiID8gZ2V0dGVyKHN0eWxlKSA6IHN0eWxlW2dldHRlcl07XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCF2YWx1ZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCFjb21wdXRlZCkgY29tcHV0ZWQgPSB1dGlsJGluZGV4JCRkZWZhdWx0LmNvbXB1dGVTdHlsZShub2RlKTtcblxuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB0eXBlb2YgZ2V0dGVyID09PSBcImZ1bmN0aW9uXCIgPyBnZXR0ZXIoY29tcHV0ZWQpIDogY29tcHV0ZWRbZ2V0dGVyXTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBzdHJhdGVneShuYW1lKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbmFtZS5tYXAoc3RyYXRlZ3kpLnJlZHVjZShmdW5jdGlvbihtZW1vLCB2YWx1ZSwgaW5kZXgpICB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtZW1vW25hbWVbaW5kZXhdXSA9IHZhbHVlO1xuXG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gbWVtbztcbiAgICAgICAgICAgICAgICAgICAgfSwge30pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKGxlbiA9PT0gMiAmJiB0eXBlb2YgbmFtZSA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIHZhciBzZXR0ZXIgPSB1dGlsJHN0eWxlaG9va3MkJGRlZmF1bHQuc2V0W25hbWVdIHx8IHV0aWwkc3R5bGVob29rcyQkZGVmYXVsdC5maW5kKG5hbWUsIHN0eWxlKTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IHZhbHVlKHRoaXMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSA9PSBudWxsKSB2YWx1ZSA9IFwiXCI7XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNldHRlciA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICAgICAgICAgIHNldHRlcih2YWx1ZSwgc3R5bGUpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHN0eWxlW3NldHRlcl0gPSB0eXBlb2YgdmFsdWUgPT09IFwibnVtYmVyXCIgPyB2YWx1ZSArIFwicHhcIiA6IHZhbHVlLnRvU3RyaW5nKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmIChsZW4gPT09IDEgJiYgbmFtZSAmJiB0eXBlb2YgbmFtZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkgIHsgdGhpcyQwLmNzcyhrZXksIG5hbWVba2V5XSkgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiY3NzXCIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24oKSAge3JldHVybiBmdW5jdGlvbihuYW1lKSB7XG4gICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHV0aWwkaW5kZXgkJGRlZmF1bHQuaXNBcnJheShuYW1lKSkge1xuICAgICAgICAgICAgcmV0dXJuIHt9O1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggIT09IDEgfHwgdHlwZW9mIG5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9XG4gICAgfX0pO1xuXG4gICAgdmFyIGVsZW1lbnQkZGVmaW5lJCRBVFRSX0NBU0UgPSBKU0NSSVBUX1ZFUlNJT04gPCA5ID8gXCJ0b1VwcGVyQ2FzZVwiIDogXCJ0b0xvd2VyQ2FzZVwiO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGRlZmluZTogZnVuY3Rpb24obmFtZSwgZ2V0dGVyLCBzZXR0ZXIpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lICE9PSBcInN0cmluZ1wiIHx8IHR5cGVvZiBnZXR0ZXIgIT09IFwiZnVuY3Rpb25cIiB8fCB0eXBlb2Ygc2V0dGVyICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICB0aHJvdyBuZXcgZXJyb3JzJCRNZXRob2RFcnJvcihcImRlZmluZVwiLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBVc2UgdHJpY2sgdG8gZml4IGluZmluaXRlIHJlY3Vyc2lvbiBpbiBJRTg6XG4gICAgICAgICAgICAvLyBodHRwOi8vd3d3LnNtYXNoaW5nbWFnYXppbmUuY29tLzIwMTQvMTEvMjgvY29tcGxldGUtcG9seWZpbGwtaHRtbDUtZGV0YWlscy1lbGVtZW50L1xuXG4gICAgICAgICAgICB2YXIgYXR0ck5hbWUgPSBuYW1lW2VsZW1lbnQkZGVmaW5lJCRBVFRSX0NBU0VdKCk7XG4gICAgICAgICAgICB2YXIgX3NldEF0dHJpYnV0ZSA9IG5vZGUuc2V0QXR0cmlidXRlO1xuICAgICAgICAgICAgdmFyIF9yZW1vdmVBdHRyaWJ1dGUgPSBub2RlLnJlbW92ZUF0dHJpYnV0ZTtcbiAgICAgICAgICAgIGlmIChKU0NSSVBUX1ZFUlNJT04gPCA5KSB7XG4gICAgICAgICAgICAgICAgLy8gcmVhZCBhdHRyaWJ1dGUgYmVmb3JlIHRoZSBkZWZpbmVQcm9wZXJ0eSBjYWxsXG4gICAgICAgICAgICAgICAgLy8gdG8gc2V0IHRoZSBjb3JyZWN0IGluaXRpYWwgc3RhdGUgZm9yIElFOFxuICAgICAgICAgICAgICAgIHZhciBpbml0aWFsVmFsdWUgPSBub2RlLmdldEF0dHJpYnV0ZShuYW1lKTtcblxuICAgICAgICAgICAgICAgIGlmIChpbml0aWFsVmFsdWUgIT09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZVthdHRyTmFtZV0gPSBpbml0aWFsVmFsdWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkobm9kZSwgbmFtZSwge1xuICAgICAgICAgICAgICAgIGdldDogZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgICAgICAgICB2YXIgYXR0clZhbHVlID0gbm9kZS5nZXRBdHRyaWJ1dGUoYXR0ck5hbWUsIDEpO1xuICAgICAgICAgICAgICAgICAgICAvLyBhdHRyIHZhbHVlIC0+IHByb3AgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGdldHRlci5jYWxsKHRoaXMkMCwgYXR0clZhbHVlKTtcbiAgICAgICAgICAgICAgICB9LFxuICAgICAgICAgICAgICAgIHNldDogZnVuY3Rpb24ocHJvcFZhbHVlKSAge1xuICAgICAgICAgICAgICAgICAgICAvLyBwcm9wIHZhbHVlIC0+IGF0dHIgdmFsdWVcbiAgICAgICAgICAgICAgICAgICAgdmFyIGF0dHJWYWx1ZSA9IHNldHRlci5jYWxsKHRoaXMkMCwgcHJvcFZhbHVlKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoYXR0clZhbHVlID09IG51bGwpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUuY2FsbChub2RlLCBhdHRyTmFtZSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBfc2V0QXR0cmlidXRlLmNhbGwobm9kZSwgYXR0ck5hbWUsIGF0dHJWYWx1ZSwgMSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgLy8gb3ZlcnJpZGUgbWV0aG9kcyB0byBjYXRjaCBjaGFuZ2VzIGZyb20gYXR0cmlidXRlcyB0b29cbiAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlID0gZnVuY3Rpb24obmFtZSwgdmFsdWUsIGZsYWdzKSAge1xuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gbmFtZVtlbGVtZW50JGRlZmluZSQkQVRUUl9DQVNFXSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbbmFtZV0gPSBnZXR0ZXIuY2FsbCh0aGlzJDAsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBfc2V0QXR0cmlidXRlLmNhbGwobm9kZSwgbmFtZSwgdmFsdWUsIGZsYWdzKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZSA9IGZ1bmN0aW9uKG5hbWUsIGZsYWdzKSAge1xuICAgICAgICAgICAgICAgIGlmIChhdHRyTmFtZSA9PT0gbmFtZVtlbGVtZW50JGRlZmluZSQkQVRUUl9DQVNFXSgpKSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGVbbmFtZV0gPSBnZXR0ZXIuY2FsbCh0aGlzJDAsIG51bGwpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIF9yZW1vdmVBdHRyaWJ1dGUuY2FsbChub2RlLCBuYW1lLCBmbGFncyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuXG4gICAgICAgIGVtcHR5OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHJldHVybiB0aGlzLnNldChcIlwiKTtcbiAgICAgICAgfVxuXG4gICAgfSk7XG5cbiAgICAvLyBiaWcgcGFydCBvZiBjb2RlIGluc3BpcmVkIGJ5IFNpenpsZTpcbiAgICAvLyBodHRwczovL2dpdGh1Yi5jb20vanF1ZXJ5L3NpenpsZS9ibG9iL21hc3Rlci9zaXp6bGUuanNcblxuICAgIHZhciBlbGVtZW50JGZpbmQkJHJxdWljayA9IERPQ1VNRU5ULmdldEVsZW1lbnRzQnlDbGFzc05hbWUgPyAvXig/OihcXHcrKXxcXC4oW1xcd1xcLV0rKSkkLyA6IC9eKD86KFxcdyspKSQvLFxuICAgICAgICBlbGVtZW50JGZpbmQkJHJlc2NhcGUgPSAvJ3xcXFxcL2csXG4gICAgICAgIGVsZW1lbnQkZmluZCQkbWFrZU1ldGhvZCA9IGZ1bmN0aW9uKGFsbCkgIHtyZXR1cm4gZnVuY3Rpb24oc2VsZWN0b3IpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiZmluZFwiICsgYWxsLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXNbMF0sXG4gICAgICAgICAgICAgICAgcXVpY2tNYXRjaCA9IGVsZW1lbnQkZmluZCQkcnF1aWNrLmV4ZWMoc2VsZWN0b3IpLFxuICAgICAgICAgICAgICAgIHJlc3VsdCwgb2xkLCBuaWQsIGNvbnRleHQ7XG5cbiAgICAgICAgICAgIGlmIChxdWlja01hdGNoKSB7XG4gICAgICAgICAgICAgICAgaWYgKHF1aWNrTWF0Y2hbMV0pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlZWQtdXA6IFwiVEFHXCJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbm9kZS5nZXRFbGVtZW50c0J5VGFnTmFtZShzZWxlY3Rvcik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc3BlZWQtdXA6IFwiLkNMQVNTXCJcbiAgICAgICAgICAgICAgICAgICAgcmVzdWx0ID0gbm9kZS5nZXRFbGVtZW50c0J5Q2xhc3NOYW1lKHF1aWNrTWF0Y2hbMl0pO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmIChyZXN1bHQgJiYgIWFsbCkgcmVzdWx0ID0gcmVzdWx0WzBdO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBvbGQgPSB0cnVlO1xuICAgICAgICAgICAgICAgIGNvbnRleHQgPSBub2RlO1xuXG4gICAgICAgICAgICAgICAgaWYgKG5vZGUgIT09IG5vZGUub3duZXJEb2N1bWVudC5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gcVNBIHdvcmtzIHN0cmFuZ2VseSBvbiBFbGVtZW50LXJvb3RlZCBxdWVyaWVzXG4gICAgICAgICAgICAgICAgICAgIC8vIFdlIGNhbiB3b3JrIGFyb3VuZCB0aGlzIGJ5IHNwZWNpZnlpbmcgYW4gZXh0cmEgSUQgb24gdGhlIHJvb3RcbiAgICAgICAgICAgICAgICAgICAgLy8gYW5kIHdvcmtpbmcgdXAgZnJvbSB0aGVyZSAoVGhhbmtzIHRvIEFuZHJldyBEdXBvbnQgZm9yIHRoZSB0ZWNobmlxdWUpXG4gICAgICAgICAgICAgICAgICAgIGlmICggKG9sZCA9IG5vZGUuZ2V0QXR0cmlidXRlKFwiaWRcIikpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmlkID0gb2xkLnJlcGxhY2UoZWxlbWVudCRmaW5kJCRyZXNjYXBlLCBcIlxcXFwkJlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5pZCA9IFwiRE9NMjAwMTAwMVwiO1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5zZXRBdHRyaWJ1dGUoXCJpZFwiLCBuaWQpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgbmlkID0gXCJbaWQ9J1wiICsgbmlkICsgXCInXSBcIjtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3IgPSBuaWQgKyBzZWxlY3Rvci5zcGxpdChcIixcIikuam9pbihcIixcIiArIG5pZCk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgcmVzdWx0ID0gdXRpbCRpbmRleCQkZGVmYXVsdC5zYWZlQ2FsbChjb250ZXh0LCBcInF1ZXJ5U2VsZWN0b3JcIiArIGFsbCwgc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICAgICAgaWYgKCFvbGQpIG5vZGUucmVtb3ZlQXR0cmlidXRlKFwiaWRcIik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBhbGwgPyB1dGlsJGluZGV4JCRkZWZhdWx0Lm1hcC5jYWxsKHJlc3VsdCwgJEVsZW1lbnQpIDogJEVsZW1lbnQocmVzdWx0KTtcbiAgICAgICAgfX07XG5cbiAgICB1dGlsJGluZGV4JCRkZWZhdWx0LnJlZ2lzdGVyKHtcbiAgICAgICAgZmluZDogZWxlbWVudCRmaW5kJCRtYWtlTWV0aG9kKFwiXCIpLFxuXG4gICAgICAgIGZpbmRBbGw6IGVsZW1lbnQkZmluZCQkbWFrZU1ldGhvZChcIkFsbFwiKVxuICAgIH0sIGZ1bmN0aW9uKG1ldGhvZE5hbWUpICB7XG4gICAgICAgIHJldHVybiBtZXRob2ROYW1lID09PSBcImZpbmRcIiA/IGZ1bmN0aW9uKCkgIHtyZXR1cm4gbmV3ICROdWxsRWxlbWVudCgpfSA6IGZ1bmN0aW9uKCkgIHtyZXR1cm4gW119O1xuICAgIH0pO1xuXG4gICAgdmFyIHV0aWwkZXZlbnRob29rcyQkaG9va3MgPSB7fTtcbiAgICBpZiAoXCJvbmZvY3VzaW5cIiBpbiBET0NVTUVOVC5kb2N1bWVudEVsZW1lbnQpIHtcbiAgICAgICAgdXRpbCRldmVudGhvb2tzJCRob29rcy5mb2N1cyA9IGZ1bmN0aW9uKGhhbmRsZXIpICB7IGhhbmRsZXIuX3R5cGUgPSBcImZvY3VzaW5cIiB9O1xuICAgICAgICB1dGlsJGV2ZW50aG9va3MkJGhvb2tzLmJsdXIgPSBmdW5jdGlvbihoYW5kbGVyKSAgeyBoYW5kbGVyLl90eXBlID0gXCJmb2N1c291dFwiIH07XG4gICAgfSBlbHNlIHtcbiAgICAgICAgLy8gZmlyZWZveCBkb2Vzbid0IHN1cHBvcnQgZm9jdXNpbi9mb2N1c291dCBldmVudHNcbiAgICAgICAgdXRpbCRldmVudGhvb2tzJCRob29rcy5mb2N1cyA9IHV0aWwkZXZlbnRob29rcyQkaG9va3MuYmx1ciA9IGZ1bmN0aW9uKGhhbmRsZXIpICB7IGhhbmRsZXIuY2FwdHVyaW5nID0gdHJ1ZSB9O1xuICAgIH1cbiAgICBpZiAoRE9DVU1FTlQuY3JlYXRlRWxlbWVudChcImlucHV0XCIpLnZhbGlkaXR5KSB7XG4gICAgICAgIHV0aWwkZXZlbnRob29rcyQkaG9va3MuaW52YWxpZCA9IGZ1bmN0aW9uKGhhbmRsZXIpICB7IGhhbmRsZXIuY2FwdHVyaW5nID0gdHJ1ZSB9O1xuICAgIH1cbiAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSkge1xuICAgICAgICAvLyBmaXggbm9uLWJ1YmJsaW5nIGZvcm0gZXZlbnRzIGZvciBJRTggdGhlcmVmb3JlXG4gICAgICAgIC8vIHVzZSBjdXN0b20gZXZlbnQgdHlwZSBpbnN0ZWFkIG9mIG9yaWdpbmFsIG9uZVxuICAgICAgICBbXCJzdWJtaXRcIiwgXCJjaGFuZ2VcIiwgXCJyZXNldFwiXS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpICB7XG4gICAgICAgICAgICB1dGlsJGV2ZW50aG9va3MkJGhvb2tzW25hbWVdID0gZnVuY3Rpb24oaGFuZGxlcikgIHsgaGFuZGxlci5fdHlwZSA9IFwiX1wiIH07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIHZhciB1dGlsJGV2ZW50aG9va3MkJGRlZmF1bHQgPSB1dGlsJGV2ZW50aG9va3MkJGhvb2tzO1xuXG4gICAgZnVuY3Rpb24gdXRpbCRldmVudGhhbmRsZXIkJGdldEV2ZW50UHJvcGVydHkobmFtZSwgZSwgdHlwZSwgbm9kZSwgdGFyZ2V0LCBjdXJyZW50VGFyZ2V0KSB7XG4gICAgICAgIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJudW1iZXJcIikge1xuICAgICAgICAgICAgdmFyIGFyZ3MgPSBlW1wiX18yMDAxMDAxX19cIl07XG5cbiAgICAgICAgICAgIHJldHVybiBhcmdzID8gYXJnc1tuYW1lXSA6IHZvaWQgMDtcbiAgICAgICAgfVxuICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSkge1xuICAgICAgICAgICAgdmFyIGRvY0VsID0gbm9kZS5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudDtcblxuICAgICAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgICAgICBjYXNlIFwid2hpY2hcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5rZXlDb2RlO1xuICAgICAgICAgICAgY2FzZSBcImJ1dHRvblwiOlxuICAgICAgICAgICAgICAgIHZhciBidXR0b24gPSBlLmJ1dHRvbjtcbiAgICAgICAgICAgICAgICAvLyBjbGljazogMSA9PT0gbGVmdDsgMiA9PT0gbWlkZGxlOyAzID09PSByaWdodFxuICAgICAgICAgICAgICAgIHJldHVybiBidXR0b24gJiAxID8gMSA6ICggYnV0dG9uICYgMiA/IDMgOiAoIGJ1dHRvbiAmIDQgPyAyIDogMCApICk7XG4gICAgICAgICAgICBjYXNlIFwicGFnZVhcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5jbGllbnRYICsgZG9jRWwuc2Nyb2xsTGVmdCAtIGRvY0VsLmNsaWVudExlZnQ7XG4gICAgICAgICAgICBjYXNlIFwicGFnZVlcIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gZS5jbGllbnRZICsgZG9jRWwuc2Nyb2xsVG9wIC0gZG9jRWwuY2xpZW50VG9wO1xuICAgICAgICAgICAgY2FzZSBcInByZXZlbnREZWZhdWx0XCI6XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gZS5yZXR1cm5WYWx1ZSA9IGZhbHNlfTtcbiAgICAgICAgICAgIGNhc2UgXCJzdG9wUHJvcGFnYXRpb25cIjpcbiAgICAgICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSAge3JldHVybiBlLmNhbmNlbEJ1YmJsZSA9IHRydWV9O1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgc3dpdGNoIChuYW1lKSB7XG4gICAgICAgIGNhc2UgXCJ0eXBlXCI6XG4gICAgICAgICAgICByZXR1cm4gdHlwZTtcbiAgICAgICAgY2FzZSBcImRlZmF1bHRQcmV2ZW50ZWRcIjpcbiAgICAgICAgICAgIC8vIElFOCBhbmQgQW5kcm9pZCAyLjMgdXNlIHJldHVyblZhbHVlIGluc3RlYWQgb2YgZGVmYXVsdFByZXZlbnRlZFxuICAgICAgICAgICAgcmV0dXJuIFwiZGVmYXVsdFByZXZlbnRlZFwiIGluIGUgPyBlLmRlZmF1bHRQcmV2ZW50ZWQgOiBlLnJldHVyblZhbHVlID09PSBmYWxzZTtcbiAgICAgICAgY2FzZSBcInRhcmdldFwiOlxuICAgICAgICAgICAgcmV0dXJuICRFbGVtZW50KHRhcmdldCk7XG4gICAgICAgIGNhc2UgXCJjdXJyZW50VGFyZ2V0XCI6XG4gICAgICAgICAgICByZXR1cm4gJEVsZW1lbnQoY3VycmVudFRhcmdldCk7XG4gICAgICAgIGNhc2UgXCJyZWxhdGVkVGFyZ2V0XCI6XG4gICAgICAgICAgICByZXR1cm4gJEVsZW1lbnQoZS5yZWxhdGVkVGFyZ2V0IHx8IGVbKGUudG9FbGVtZW50ID09PSBub2RlID8gXCJmcm9tXCIgOiBcInRvXCIpICsgXCJFbGVtZW50XCJdKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciB2YWx1ZSA9IGVbbmFtZV07XG5cbiAgICAgICAgaWYgKHR5cGVvZiB2YWx1ZSA9PT0gXCJmdW5jdGlvblwiKSB7XG4gICAgICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSAge3JldHVybiB2YWx1ZS5hcHBseShlLCBhcmd1bWVudHMpfTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiB2YWx1ZTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB1dGlsJGV2ZW50aGFuZGxlciQkRXZlbnRIYW5kbGVyKHR5cGUsIHNlbGVjdG9yLCBjYWxsYmFjaywgcHJvcHMsIGVsLCBvbmNlKSB7XG4gICAgICAgIHZhciBub2RlID0gZWxbMF0sXG4gICAgICAgICAgICBob29rID0gdXRpbCRldmVudGhvb2tzJCRkZWZhdWx0W3R5cGVdLFxuICAgICAgICAgICAgbWF0Y2hlciA9IHV0aWwkc2VsZWN0b3JtYXRjaGVyJCRkZWZhdWx0KHNlbGVjdG9yLCBub2RlKSxcbiAgICAgICAgICAgIGhhbmRsZXIgPSBmdW5jdGlvbihlKSAge1xuICAgICAgICAgICAgICAgIGUgPSBlIHx8IFdJTkRPVy5ldmVudDtcbiAgICAgICAgICAgICAgICAvLyBlYXJseSBzdG9wIGluIGNhc2Ugb2YgZGVmYXVsdCBhY3Rpb25cbiAgICAgICAgICAgICAgICBpZiAodXRpbCRldmVudGhhbmRsZXIkJEV2ZW50SGFuZGxlci5za2lwID09PSB0eXBlKSByZXR1cm47XG4gICAgICAgICAgICAgICAgaWYgKGhhbmRsZXIuX3R5cGUgPT09IENVU1RPTV9FVkVOVF9UWVBFICYmIGUuc3JjVXJuICE9PSB0eXBlKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjsgLy8gaGFuZGxlIGN1c3RvbSBldmVudHMgaW4gbGVnYWN5IElFXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHNyY0VsZW1lbnQgY2FuIGJlIG51bGwgaW4gbGVnYWN5IElFIHdoZW4gdGFyZ2V0IGlzIGRvY3VtZW50XG4gICAgICAgICAgICAgICAgdmFyIHRhcmdldCA9IGUudGFyZ2V0IHx8IGUuc3JjRWxlbWVudCB8fCBub2RlLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LFxuICAgICAgICAgICAgICAgICAgICBjdXJyZW50VGFyZ2V0ID0gbWF0Y2hlciA/IG1hdGNoZXIodGFyZ2V0KSA6IG5vZGUsXG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSBwcm9wcyB8fCBbXTtcblxuICAgICAgICAgICAgICAgIC8vIGVhcmx5IHN0b3AgZm9yIGxhdGUgYmluZGluZyBvciB3aGVuIHRhcmdldCBkb2Vzbid0IG1hdGNoIHNlbGVjdG9yXG4gICAgICAgICAgICAgICAgaWYgKCFjdXJyZW50VGFyZ2V0KSByZXR1cm47XG5cbiAgICAgICAgICAgICAgICAvLyBvZmYgY2FsbGJhY2sgZXZlbiBpZiBpdCB0aHJvd3MgYW4gZXhjZXB0aW9uIGxhdGVyXG4gICAgICAgICAgICAgICAgaWYgKG9uY2UpIGVsLm9mZih0eXBlLCBjYWxsYmFjayk7XG5cbiAgICAgICAgICAgICAgICBpZiAocHJvcHMpIHtcbiAgICAgICAgICAgICAgICAgICAgYXJncyA9IGFyZ3MubWFwKGZ1bmN0aW9uKG5hbWUpICB7cmV0dXJuIHV0aWwkZXZlbnRoYW5kbGVyJCRnZXRFdmVudFByb3BlcnR5KFxuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSwgZSwgdHlwZSwgbm9kZSwgdGFyZ2V0LCBjdXJyZW50VGFyZ2V0KX0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGFyZ3MgPSB1dGlsJGluZGV4JCRkZWZhdWx0LnNsaWNlLmNhbGwoZVtcIl9fMjAwMTAwMV9fXCJdIHx8IFswXSwgMSk7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgLy8gcHJldmVudCBkZWZhdWx0IGlmIGhhbmRsZXIgcmV0dXJucyBmYWxzZVxuICAgICAgICAgICAgICAgIGlmIChjYWxsYmFjay5hcHBseShlbCwgYXJncykgPT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChKU0NSSVBUX1ZFUlNJT04gPCA5KSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnJldHVyblZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9O1xuXG4gICAgICAgIGlmIChob29rKSBoYW5kbGVyID0gaG9vayhoYW5kbGVyLCB0eXBlKSB8fCBoYW5kbGVyO1xuICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSAmJiAhKFwib25cIiArIChoYW5kbGVyLl90eXBlIHx8IHR5cGUpIGluIG5vZGUpKSB7XG4gICAgICAgICAgICAvLyBoYW5kbGUgY3VzdG9tIGV2ZW50cyBmb3IgSUU4XG4gICAgICAgICAgICBoYW5kbGVyLl90eXBlID0gQ1VTVE9NX0VWRU5UX1RZUEU7XG4gICAgICAgIH1cblxuICAgICAgICBoYW5kbGVyLnR5cGUgPSB0eXBlO1xuICAgICAgICBoYW5kbGVyLmNhbGxiYWNrID0gY2FsbGJhY2s7XG4gICAgICAgIGhhbmRsZXIuc2VsZWN0b3IgPSBzZWxlY3RvcjtcblxuICAgICAgICByZXR1cm4gaGFuZGxlcjtcbiAgICB9XG5cbiAgICB2YXIgdXRpbCRldmVudGhhbmRsZXIkJGRlZmF1bHQgPSB1dGlsJGV2ZW50aGFuZGxlciQkRXZlbnRIYW5kbGVyO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIGZpcmU6IGZ1bmN0aW9uKHR5cGUpIHtcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXSxcbiAgICAgICAgICAgICAgICBlLCBldmVudFR5cGUsIGNhbkNvbnRpbnVlO1xuXG4gICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICB2YXIgaG9vayA9IHV0aWwkZXZlbnRob29rcyQkZGVmYXVsdFt0eXBlXSxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IHt9O1xuXG4gICAgICAgICAgICAgICAgaWYgKGhvb2spIGhhbmRsZXIgPSBob29rKGhhbmRsZXIpIHx8IGhhbmRsZXI7XG5cbiAgICAgICAgICAgICAgICBldmVudFR5cGUgPSBoYW5kbGVyLl90eXBlIHx8IHR5cGU7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiZmlyZVwiLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKEpTQ1JJUFRfVkVSU0lPTiA8IDkpIHtcbiAgICAgICAgICAgICAgICBlID0gbm9kZS5vd25lckRvY3VtZW50LmNyZWF0ZUV2ZW50T2JqZWN0KCk7XG4gICAgICAgICAgICAgICAgZVtcIl9fMjAwMTAwMV9fXCJdID0gYXJndW1lbnRzO1xuICAgICAgICAgICAgICAgIC8vIGhhbmRsZSBjdXN0b20gZXZlbnRzIGZvciBsZWdhY3kgSUVcbiAgICAgICAgICAgICAgICBpZiAoIShcIm9uXCIgKyBldmVudFR5cGUgaW4gbm9kZSkpIGV2ZW50VHlwZSA9IENVU1RPTV9FVkVOVF9UWVBFO1xuICAgICAgICAgICAgICAgIC8vIHN0b3JlIG9yaWdpbmFsIGV2ZW50IHR5cGVcbiAgICAgICAgICAgICAgICBpZiAoZXZlbnRUeXBlID09PSBDVVNUT01fRVZFTlRfVFlQRSkgZS5zcmNVcm4gPSB0eXBlO1xuXG4gICAgICAgICAgICAgICAgbm9kZS5maXJlRXZlbnQoXCJvblwiICsgZXZlbnRUeXBlLCBlKTtcblxuICAgICAgICAgICAgICAgIGNhbkNvbnRpbnVlID0gZS5yZXR1cm5WYWx1ZSAhPT0gZmFsc2U7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGUgPSBub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRXZlbnQoXCJIVE1MRXZlbnRzXCIpO1xuICAgICAgICAgICAgICAgIGVbXCJfXzIwMDEwMDFfX1wiXSA9IGFyZ3VtZW50cztcbiAgICAgICAgICAgICAgICBlLmluaXRFdmVudChldmVudFR5cGUsIHRydWUsIHRydWUpO1xuICAgICAgICAgICAgICAgIGNhbkNvbnRpbnVlID0gbm9kZS5kaXNwYXRjaEV2ZW50KGUpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBjYWxsIG5hdGl2ZSBmdW5jdGlvbiB0byB0cmlnZ2VyIGRlZmF1bHQgYmVoYXZpb3JcbiAgICAgICAgICAgIGlmIChjYW5Db250aW51ZSAmJiBub2RlW3R5cGVdKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJldmVudCByZS10cmlnZ2VyaW5nIG9mIHRoZSBjdXJyZW50IGV2ZW50XG4gICAgICAgICAgICAgICAgdXRpbCRldmVudGhhbmRsZXIkJGRlZmF1bHQuc2tpcCA9IHR5cGU7XG5cbiAgICAgICAgICAgICAgICB1dGlsJGluZGV4JCRkZWZhdWx0LnNhZmVDYWxsKG5vZGUsIHR5cGUpO1xuXG4gICAgICAgICAgICAgICAgdXRpbCRldmVudGhhbmRsZXIkJGRlZmF1bHQuc2tpcCA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBjYW5Db250aW51ZTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gdHJ1ZX07XG4gICAgfSk7XG5cbiAgICB2YXIgdXRpbCRhY2Nlc3Nvcmhvb2tzJCRob29rcyA9IHtnZXQ6IHt9LCBzZXQ6IHt9fTtcblxuICAgIC8vIGZpeCBjYW1lbCBjYXNlZCBhdHRyaWJ1dGVzXG4gICAgXCJ0YWJJbmRleCByZWFkT25seSBtYXhMZW5ndGggY2VsbFNwYWNpbmcgY2VsbFBhZGRpbmcgcm93U3BhbiBjb2xTcGFuIHVzZU1hcCBmcmFtZUJvcmRlciBjb250ZW50RWRpdGFibGVcIi5zcGxpdChcIiBcIikuZm9yRWFjaChmdW5jdGlvbihrZXkpICB7XG4gICAgICAgIHV0aWwkYWNjZXNzb3Job29rcyQkaG9va3MuZ2V0WyBrZXkudG9Mb3dlckNhc2UoKSBdID0gZnVuY3Rpb24obm9kZSkgIHtyZXR1cm4gbm9kZVtrZXldfTtcbiAgICB9KTtcblxuICAgIC8vIHN0eWxlIGhvb2tcbiAgICB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzLmdldC5zdHlsZSA9IGZ1bmN0aW9uKG5vZGUpICB7cmV0dXJuIG5vZGUuc3R5bGUuY3NzVGV4dH07XG4gICAgdXRpbCRhY2Nlc3Nvcmhvb2tzJCRob29rcy5zZXQuc3R5bGUgPSBmdW5jdGlvbihub2RlLCB2YWx1ZSkgIHsgbm9kZS5zdHlsZS5jc3NUZXh0ID0gdmFsdWUgfTtcblxuICAgIC8vIHRpdGxlIGhvb2sgZm9yIERPTVxuICAgIHV0aWwkYWNjZXNzb3Job29rcyQkaG9va3MuZ2V0LnRpdGxlID0gZnVuY3Rpb24obm9kZSkgIHtcbiAgICAgICAgdmFyIGRvYyA9IG5vZGUub3duZXJEb2N1bWVudDtcblxuICAgICAgICByZXR1cm4gbm9kZSA9PT0gZG9jLmRvY3VtZW50RWxlbWVudCA/IGRvYy50aXRsZSA6IG5vZGUudGl0bGU7XG4gICAgfTtcblxuICAgIHV0aWwkYWNjZXNzb3Job29rcyQkaG9va3Muc2V0LnRpdGxlID0gZnVuY3Rpb24obm9kZSwgdmFsdWUpICB7XG4gICAgICAgIHZhciBkb2MgPSBub2RlLm93bmVyRG9jdW1lbnQ7XG5cbiAgICAgICAgKG5vZGUgPT09IGRvYy5kb2N1bWVudEVsZW1lbnQgPyBkb2MgOiBub2RlKS50aXRsZSA9IHZhbHVlO1xuICAgIH07XG5cbiAgICB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzLmdldC51bmRlZmluZWQgPSBmdW5jdGlvbihub2RlKSAge1xuICAgICAgICB2YXIgbmFtZTtcblxuICAgICAgICBzd2l0Y2ggKG5vZGUudGFnTmFtZSkge1xuICAgICAgICBjYXNlIFwiU0VMRUNUXCI6XG4gICAgICAgICAgICByZXR1cm4gfm5vZGUuc2VsZWN0ZWRJbmRleCA/IG5vZGUub3B0aW9uc1sgbm9kZS5zZWxlY3RlZEluZGV4IF0udmFsdWUgOiBcIlwiO1xuXG4gICAgICAgIGNhc2UgXCJPUFRJT05cIjpcbiAgICAgICAgICAgIG5hbWUgPSBub2RlLmhhc0F0dHJpYnV0ZShcInZhbHVlXCIpID8gXCJ2YWx1ZVwiIDogXCJ0ZXh0XCI7XG4gICAgICAgICAgICBicmVhaztcblxuICAgICAgICBkZWZhdWx0OlxuICAgICAgICAgICAgbmFtZSA9IG5vZGUudHlwZSAmJiBcInZhbHVlXCIgaW4gbm9kZSA/IFwidmFsdWVcIiA6IFwiaW5uZXJIVE1MXCI7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gbm9kZVtuYW1lXTtcbiAgICB9O1xuXG4gICAgdXRpbCRhY2Nlc3Nvcmhvb2tzJCRob29rcy5zZXQudmFsdWUgPSBmdW5jdGlvbihub2RlLCB2YWx1ZSkge1xuICAgICAgICBpZiAobm9kZS50YWdOYW1lID09PSBcIlNFTEVDVFwiKSB7XG4gICAgICAgICAgICAvLyBzZWxlY3Rib3ggaGFzIHNwZWNpYWwgY2FzZVxuICAgICAgICAgICAgaWYgKHV0aWwkaW5kZXgkJGRlZmF1bHQuZXZlcnkuY2FsbChub2RlLm9wdGlvbnMsIGZ1bmN0aW9uKG8pICB7cmV0dXJuICEoby5zZWxlY3RlZCA9IG8udmFsdWUgPT09IHZhbHVlKX0pKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5zZWxlY3RlZEluZGV4ID0gLTE7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBmb3IgSUUgdXNlIGlubmVyVGV4dCBmb3IgdGV4dGFyZWFiZWNhdXNlIGl0IGRvZXNuJ3QgdHJpZ2dlciBvbnByb3BlcnR5Y2hhbmdlXG4gICAgICAgICAgICBub2RlW0pTQ1JJUFRfVkVSU0lPTiA8IDkgJiYgbm9kZS50eXBlID09PSBcInRleHRhcmVhXCIgPyBcImlubmVyVGV4dFwiIDogXCJ2YWx1ZVwiXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIC8vIHNvbWUgYnJvd3NlcnMgZG9uJ3QgcmVjb2duaXplIGlucHV0W3R5cGU9ZW1haWxdIGV0Yy5cbiAgICB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzLmdldC50eXBlID0gZnVuY3Rpb24obm9kZSkgIHtyZXR1cm4gbm9kZS5nZXRBdHRyaWJ1dGUoXCJ0eXBlXCIpIHx8IG5vZGUudHlwZX07XG4gICAgaWYgKEpTQ1JJUFRfVkVSU0lPTiA8IDkpIHtcbiAgICAgICAgLy8gSUU4IGhhcyBpbm5lclRleHQgYnV0IG5vdCB0ZXh0Q29udGVudFxuICAgICAgICB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzLmdldC50ZXh0Q29udGVudCA9IGZ1bmN0aW9uKG5vZGUpICB7cmV0dXJuIG5vZGUuaW5uZXJUZXh0fTtcbiAgICAgICAgdXRpbCRhY2Nlc3Nvcmhvb2tzJCRob29rcy5zZXQudGV4dENvbnRlbnQgPSBmdW5jdGlvbihub2RlLCB2YWx1ZSkgIHsgbm9kZS5pbm5lclRleHQgPSB2YWx1ZSB9O1xuXG4gICAgICAgIC8vIElFOCBzb21ldGltZXMgYnJlYWtzIG9uIGlubmVySFRNTFxuICAgICAgICB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzLnNldC5pbm5lckhUTUwgPSBmdW5jdGlvbihub2RlLCB2YWx1ZSkge1xuICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICBub2RlLmlubmVySFRNTCA9IHZhbHVlO1xuICAgICAgICAgICAgfSBjYXRjaCAoZXJyKSB7XG4gICAgICAgICAgICAgICAgbm9kZS5pbm5lclRleHQgPSBcIlwiO1xuXG4gICAgICAgICAgICAgICAgRE9NLmNyZWF0ZUFsbCh2YWx1ZSkuZm9yRWFjaChmdW5jdGlvbih4KSAge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmFwcGVuZENoaWxkKHgpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH1cblxuICAgIHZhciB1dGlsJGFjY2Vzc29yaG9va3MkJGRlZmF1bHQgPSB1dGlsJGFjY2Vzc29yaG9va3MkJGhvb2tzO1xuXG4gICAgdmFyIGVsZW1lbnQkZ2V0JCRyZVVwcGVyID0gL1tBLVpdL2csXG4gICAgICAgIGVsZW1lbnQkZ2V0JCRyZWFkUHJpdmF0ZVByb3BlcnR5ID0gZnVuY3Rpb24obm9kZSwga2V5KSAge1xuICAgICAgICAgICAgLy8gY29udmVydCBmcm9tIGNhbWVsIGNhc2UgdG8gZGFzaC1zZXBhcmF0ZWQgdmFsdWVcbiAgICAgICAgICAgIGtleSA9IGtleS5yZXBsYWNlKGVsZW1lbnQkZ2V0JCRyZVVwcGVyLCBmdW5jdGlvbihsKSAge3JldHVybiBcIi1cIiArIGwudG9Mb3dlckNhc2UoKX0pO1xuXG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBub2RlLmdldEF0dHJpYnV0ZShcImRhdGEtXCIgKyBrZXkpO1xuXG4gICAgICAgICAgICBpZiAodmFsdWUgIT0gbnVsbCkge1xuICAgICAgICAgICAgICAgIC8vIHRyeSB0byByZWNvZ25pemUgYW5kIHBhcnNlICBvYmplY3Qgbm90YXRpb24gc3ludGF4XG4gICAgICAgICAgICAgICAgaWYgKHZhbHVlWzBdID09PSBcIntcIiAmJiB2YWx1ZVt2YWx1ZS5sZW5ndGggLSAxXSA9PT0gXCJ9XCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdHJ5IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHZhbHVlID0gSlNPTi5wYXJzZSh2YWx1ZSk7XG4gICAgICAgICAgICAgICAgICAgIH0gY2F0Y2ggKGVycikge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8ganVzdCByZXR1cm4gdGhlIHZhbHVlIGl0c2VsZlxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdmFsdWU7XG4gICAgICAgIH07XG5cbiAgICB1dGlsJGluZGV4JCRkZWZhdWx0LnJlZ2lzdGVyKHtcbiAgICAgICAgZ2V0OiBmdW5jdGlvbihuYW1lKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXNbMF0sXG4gICAgICAgICAgICAgICAgaG9vayA9IHV0aWwkYWNjZXNzb3Job29rcyQkZGVmYXVsdC5nZXRbbmFtZV07XG5cbiAgICAgICAgICAgIGlmIChob29rKSByZXR1cm4gaG9vayhub2RlLCBuYW1lKTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWUgaW4gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gbm9kZVtuYW1lXTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKG5hbWVbMF0gIT09IFwiX1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBub2RlLmdldEF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB2YXIga2V5ID0gbmFtZS5zbGljZSgxKSxcbiAgICAgICAgICAgICAgICAgICAgICAgIGRhdGEgPSB0aGlzLl87XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCEoa2V5IGluIGRhdGEpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBkYXRhW2tleV0gPSBlbGVtZW50JGdldCQkcmVhZFByaXZhdGVQcm9wZXJ0eShub2RlLCBrZXkpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFba2V5XTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHV0aWwkaW5kZXgkJGRlZmF1bHQuaXNBcnJheShuYW1lKSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBuYW1lLnJlZHVjZShmdW5jdGlvbihtZW1vLCBrZXkpICB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiAobWVtb1trZXldID0gdGhpcyQwLmdldChrZXkpLCBtZW1vKTtcbiAgICAgICAgICAgICAgICB9LCB7fSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwiZ2V0XCIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9LCBmdW5jdGlvbigpICB7XG4gICAgICAgIHJldHVybiBmdW5jdGlvbigpICB7cmV0dXJuIHZvaWQgMH07XG4gICAgfSk7XG5cbiAgICB2YXIgZWxlbWVudCRtYW5pcHVsYXRpb24kJG1ha2VNZXRob2QgPSBmdW5jdGlvbihtZXRob2ROYW1lLCBmYXN0U3RyYXRlZ3ksIHJlcXVpcmVzUGFyZW50LCBzdHJhdGVneSkgIHtyZXR1cm4gZnVuY3Rpb24oKSB7dmFyIGNvbnRlbnRzID0gU0xJQ0UkMC5jYWxsKGFyZ3VtZW50cywgMCk7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXNbMF07XG5cbiAgICAgICAgICAgIGlmIChyZXF1aXJlc1BhcmVudCAmJiAhbm9kZS5wYXJlbnROb2RlKSByZXR1cm4gdGhpcztcblxuICAgICAgICAgICAgLy8gdGhlIGlkZWEgb2YgdGhlIGFsZ29yaXRobSBpcyB0byBjb25zdHJ1Y3QgSFRNTCBzdHJpbmdcbiAgICAgICAgICAgIC8vIHdoZW4gcG9zc2libGUgb3IgdXNlIGRvY3VtZW50IGZyYWdtZW50IGFzIGEgZmFsbGJhY2sgdG9cbiAgICAgICAgICAgIC8vIGludm9rZSBtYW5pcHVsYXRpb24gdXNpbmcgYSBzaW5nbGUgbWV0aG9kIGNhbGxcbiAgICAgICAgICAgIHZhciBmcmFnbWVudCA9IGZhc3RTdHJhdGVneSA/IFwiXCIgOiBub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuXG4gICAgICAgICAgICBjb250ZW50cy5mb3JFYWNoKGZ1bmN0aW9uKGNvbnRlbnQpICB7XG4gICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBjb250ZW50ID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGVudCA9IGNvbnRlbnQodGhpcyQwKTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNvbnRlbnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBmcmFnbWVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgKz0gY29udGVudC50cmltKCk7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb250ZW50ID0gRE9NLmNyZWF0ZUFsbChjb250ZW50KTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoY29udGVudCBpbnN0YW5jZW9mICRFbGVtZW50KSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBbIGNvbnRlbnQgXTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodXRpbCRpbmRleCQkZGVmYXVsdC5pc0FycmF5KGNvbnRlbnQpKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgZnJhZ21lbnQgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIGFwcGVuZCBleGlzdGluZyBzdHJpbmcgdG8gZnJhZ21lbnRcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvbnRlbnQgPSBET00uY3JlYXRlQWxsKGZyYWdtZW50KS5jb25jYXQoY29udGVudCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBmYWxsYmFjayB0byBkb2N1bWVudCBmcmFnbWVudCBzdHJhdGVneVxuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQgPSBub2RlLm93bmVyRG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgY29udGVudC5mb3JFYWNoKGZ1bmN0aW9uKGVsKSAge1xuICAgICAgICAgICAgICAgICAgICAgICAgZnJhZ21lbnQuYXBwZW5kQ2hpbGQoZWxbMF0pO1xuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBmcmFnbWVudCA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgIG5vZGUuaW5zZXJ0QWRqYWNlbnRIVE1MKGZhc3RTdHJhdGVneSwgZnJhZ21lbnQpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzdHJhdGVneShub2RlLCBmcmFnbWVudCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiB0aGlzO1xuICAgICAgICB9fTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBhZnRlcjogZWxlbWVudCRtYW5pcHVsYXRpb24kJG1ha2VNZXRob2QoXCJhZnRlclwiLCBcImFmdGVyZW5kXCIsIHRydWUsIGZ1bmN0aW9uKG5vZGUsIHJlbGF0ZWROb2RlKSAge1xuICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLmluc2VydEJlZm9yZShyZWxhdGVkTm9kZSwgbm9kZS5uZXh0U2libGluZyk7XG4gICAgICAgIH0pLFxuXG4gICAgICAgIGJlZm9yZTogZWxlbWVudCRtYW5pcHVsYXRpb24kJG1ha2VNZXRob2QoXCJiZWZvcmVcIiwgXCJiZWZvcmViZWdpblwiLCB0cnVlLCBmdW5jdGlvbihub2RlLCByZWxhdGVkTm9kZSkgIHtcbiAgICAgICAgICAgIG5vZGUucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUocmVsYXRlZE5vZGUsIG5vZGUpO1xuICAgICAgICB9KSxcblxuICAgICAgICBwcmVwZW5kOiBlbGVtZW50JG1hbmlwdWxhdGlvbiQkbWFrZU1ldGhvZChcInByZXBlbmRcIiwgXCJhZnRlcmJlZ2luXCIsIGZhbHNlLCBmdW5jdGlvbihub2RlLCByZWxhdGVkTm9kZSkgIHtcbiAgICAgICAgICAgIG5vZGUuaW5zZXJ0QmVmb3JlKHJlbGF0ZWROb2RlLCBub2RlLmZpcnN0Q2hpbGQpO1xuICAgICAgICB9KSxcblxuICAgICAgICBhcHBlbmQ6IGVsZW1lbnQkbWFuaXB1bGF0aW9uJCRtYWtlTWV0aG9kKFwiYXBwZW5kXCIsIFwiYmVmb3JlZW5kXCIsIGZhbHNlLCBmdW5jdGlvbihub2RlLCByZWxhdGVkTm9kZSkgIHtcbiAgICAgICAgICAgIG5vZGUuYXBwZW5kQ2hpbGQocmVsYXRlZE5vZGUpO1xuICAgICAgICB9KSxcblxuICAgICAgICByZXBsYWNlOiBlbGVtZW50JG1hbmlwdWxhdGlvbiQkbWFrZU1ldGhvZChcInJlcGxhY2VcIiwgXCJcIiwgdHJ1ZSwgZnVuY3Rpb24obm9kZSwgcmVsYXRlZE5vZGUpICB7XG4gICAgICAgICAgICBub2RlLnBhcmVudE5vZGUucmVwbGFjZUNoaWxkKHJlbGF0ZWROb2RlLCBub2RlKTtcbiAgICAgICAgfSksXG5cbiAgICAgICAgcmVtb3ZlOiBlbGVtZW50JG1hbmlwdWxhdGlvbiQkbWFrZU1ldGhvZChcInJlbW92ZVwiLCBcIlwiLCB0cnVlLCBmdW5jdGlvbihub2RlKSAge1xuICAgICAgICAgICAgbm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKG5vZGUpO1xuICAgICAgICB9KVxuICAgIH0pO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIG1hcDogZnVuY3Rpb24oZm4sIGNvbnRleHQpIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgZm4gIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwibWFwXCIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHJldHVybiBbIGZuLmNhbGwoY29udGV4dCwgdGhpcykgXTtcbiAgICAgICAgfVxuICAgIH0sIGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gW119O1xuICAgIH0pO1xuXG4gICAgdmFyIHV0aWwkc2VsZWN0b3Job29rcyQkaXNIaWRkZW4gPSBmdW5jdGlvbihub2RlKSAge1xuICAgICAgICB2YXIgY29tcHV0ZWQgPSB1dGlsJGluZGV4JCRkZWZhdWx0LmNvbXB1dGVTdHlsZShub2RlKTtcblxuICAgICAgICByZXR1cm4gY29tcHV0ZWQudmlzaWJpbGl0eSA9PT0gXCJoaWRkZW5cIiB8fCBjb21wdXRlZC5kaXNwbGF5ID09PSBcIm5vbmVcIjtcbiAgICB9O1xuXG4gICAgdmFyIHV0aWwkc2VsZWN0b3Job29rcyQkZGVmYXVsdCA9IHtcbiAgICAgICAgXCI6Zm9jdXNcIjogZnVuY3Rpb24obm9kZSkgIHtyZXR1cm4gbm9kZSA9PT0gbm9kZS5vd25lckRvY3VtZW50LmFjdGl2ZUVsZW1lbnR9LFxuXG4gICAgICAgIFwiOnZpc2libGVcIjogZnVuY3Rpb24obm9kZSkgIHtyZXR1cm4gIXV0aWwkc2VsZWN0b3Job29rcyQkaXNIaWRkZW4obm9kZSl9LFxuXG4gICAgICAgIFwiOmhpZGRlblwiOiB1dGlsJHNlbGVjdG9yaG9va3MkJGlzSGlkZGVuXG4gICAgfTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBtYXRjaGVzOiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICAgICAgaWYgKCFzZWxlY3RvciB8fCB0eXBlb2Ygc2VsZWN0b3IgIT09IFwic3RyaW5nXCIpIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwibWF0Y2hlc1wiLCBhcmd1bWVudHMpO1xuXG4gICAgICAgICAgICB2YXIgY2hlY2tlciA9IHV0aWwkc2VsZWN0b3Job29rcyQkZGVmYXVsdFtzZWxlY3Rvcl0gfHwgdXRpbCRzZWxlY3Rvcm1hdGNoZXIkJGRlZmF1bHQoc2VsZWN0b3IpO1xuXG4gICAgICAgICAgICByZXR1cm4gISFjaGVja2VyKHRoaXNbMF0pO1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24oKSAge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSAge3JldHVybiBmYWxzZX07XG4gICAgfSk7XG5cbiAgICB1dGlsJGluZGV4JCRkZWZhdWx0LnJlZ2lzdGVyKHtcbiAgICAgICAgb2ZmOiBmdW5jdGlvbih0eXBlLCBzZWxlY3RvciwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIGlmICh0eXBlb2YgdHlwZSAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IGVycm9ycyQkTWV0aG9kRXJyb3IoXCJvZmZcIiwgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgaWYgKGNhbGxiYWNrID09PSB2b2lkIDApIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IHNlbGVjdG9yO1xuICAgICAgICAgICAgICAgIHNlbGVjdG9yID0gdm9pZCAwO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXNbMF07XG5cbiAgICAgICAgICAgIHRoaXMuX1tcImhhbmRsZXIyMDAxMDAxXCJdID0gdGhpcy5fW1wiaGFuZGxlcjIwMDEwMDFcIl0uZmlsdGVyKGZ1bmN0aW9uKGhhbmRsZXIpICB7XG4gICAgICAgICAgICAgICAgdmFyIHNraXAgPSB0eXBlICE9PSBoYW5kbGVyLnR5cGU7XG5cbiAgICAgICAgICAgICAgICBza2lwID0gc2tpcCB8fCBzZWxlY3RvciAmJiBzZWxlY3RvciAhPT0gaGFuZGxlci5zZWxlY3RvcjtcbiAgICAgICAgICAgICAgICBza2lwID0gc2tpcCB8fCBjYWxsYmFjayAmJiBjYWxsYmFjayAhPT0gaGFuZGxlci5jYWxsYmFjaztcblxuICAgICAgICAgICAgICAgIGlmIChza2lwKSByZXR1cm4gdHJ1ZTtcblxuICAgICAgICAgICAgICAgIHR5cGUgPSBoYW5kbGVyLl90eXBlIHx8IGhhbmRsZXIudHlwZTtcbiAgICAgICAgICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICBub2RlLmRldGFjaEV2ZW50KFwib25cIiArIHR5cGUsIGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG5vZGUucmVtb3ZlRXZlbnRMaXN0ZW5lcih0eXBlLCBoYW5kbGVyLCAhIWhhbmRsZXIuY2FwdHVyaW5nKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH1cbiAgICB9KTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBvZmZzZXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzWzBdLFxuICAgICAgICAgICAgICAgIGRvY0VsID0gbm9kZS5vd25lckRvY3VtZW50LmRvY3VtZW50RWxlbWVudCxcbiAgICAgICAgICAgICAgICBjbGllbnRUb3AgPSBkb2NFbC5jbGllbnRUb3AsXG4gICAgICAgICAgICAgICAgY2xpZW50TGVmdCA9IGRvY0VsLmNsaWVudExlZnQsXG4gICAgICAgICAgICAgICAgc2Nyb2xsVG9wID0gV0lORE9XLnBhZ2VZT2Zmc2V0IHx8IGRvY0VsLnNjcm9sbFRvcCxcbiAgICAgICAgICAgICAgICBzY3JvbGxMZWZ0ID0gV0lORE9XLnBhZ2VYT2Zmc2V0IHx8IGRvY0VsLnNjcm9sbExlZnQsXG4gICAgICAgICAgICAgICAgYm91bmRpbmdSZWN0ID0gbm9kZS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcblxuICAgICAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICAgICAgICB0b3A6IGJvdW5kaW5nUmVjdC50b3AgKyBzY3JvbGxUb3AgLSBjbGllbnRUb3AsXG4gICAgICAgICAgICAgICAgbGVmdDogYm91bmRpbmdSZWN0LmxlZnQgKyBzY3JvbGxMZWZ0IC0gY2xpZW50TGVmdCxcbiAgICAgICAgICAgICAgICByaWdodDogYm91bmRpbmdSZWN0LnJpZ2h0ICsgc2Nyb2xsTGVmdCAtIGNsaWVudExlZnQsXG4gICAgICAgICAgICAgICAgYm90dG9tOiBib3VuZGluZ1JlY3QuYm90dG9tICsgc2Nyb2xsVG9wIC0gY2xpZW50VG9wLFxuICAgICAgICAgICAgICAgIHdpZHRoOiBib3VuZGluZ1JlY3QucmlnaHQgLSBib3VuZGluZ1JlY3QubGVmdCxcbiAgICAgICAgICAgICAgICBoZWlnaHQ6IGJvdW5kaW5nUmVjdC5ib3R0b20gLSBib3VuZGluZ1JlY3QudG9wXG4gICAgICAgICAgICB9O1xuICAgICAgICB9XG4gICAgfSwgZnVuY3Rpb24oKSAge1xuICAgICAgICByZXR1cm4gZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgcmV0dXJuIHsgdG9wIDogMCwgbGVmdCA6IDAsIHJpZ2h0IDogMCwgYm90dG9tIDogMCwgd2lkdGggOiAwLCBoZWlnaHQgOiAwIH07XG4gICAgICAgIH07XG4gICAgfSk7XG5cbiAgICB2YXIgZWxlbWVudCRvbiQkbWFrZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkgIHtyZXR1cm4gZnVuY3Rpb24odHlwZSwgc2VsZWN0b3IsIGFyZ3MsIGNhbGxiYWNrKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIHR5cGUgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGFyZ3MgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGFyZ3M7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBzZWxlY3RvciA9PT0gXCJzdHJpbmdcIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgYXJncyA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBhcmdzID0gc2VsZWN0b3I7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxlY3RvciA9IG51bGw7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIHNlbGVjdG9yID09PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2sgPSBzZWxlY3RvcjtcbiAgICAgICAgICAgICAgICAgICAgc2VsZWN0b3IgPSBudWxsO1xuICAgICAgICAgICAgICAgICAgICBhcmdzID0gbnVsbDtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIGNhbGxiYWNrICE9PSBcImZ1bmN0aW9uXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhyb3cgbmV3IGVycm9ycyQkTWV0aG9kRXJyb3IobWV0aG9kLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXSxcbiAgICAgICAgICAgICAgICAgICAgaGFuZGxlciA9IHV0aWwkZXZlbnRoYW5kbGVyJCRkZWZhdWx0KHR5cGUsIHNlbGVjdG9yLCBjYWxsYmFjaywgYXJncywgdGhpcywgbWV0aG9kID09PSBcIm9uY2VcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAoaGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5hdHRhY2hFdmVudChcIm9uXCIgKyAoaGFuZGxlci5fdHlwZSB8fCB0eXBlKSwgaGFuZGxlcik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmFkZEV2ZW50TGlzdGVuZXIoaGFuZGxlci5fdHlwZSB8fCB0eXBlLCBoYW5kbGVyLCAhIWhhbmRsZXIuY2FwdHVyaW5nKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBzdG9yZSBldmVudCBlbnRyeVxuICAgICAgICAgICAgICAgICAgICB0aGlzLl9bXCJoYW5kbGVyMjAwMTAwMVwiXS5wdXNoKGhhbmRsZXIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSBpZiAodHlwZW9mIHR5cGUgPT09IFwib2JqZWN0XCIpIHtcbiAgICAgICAgICAgICAgICBpZiAodXRpbCRpbmRleCQkZGVmYXVsdC5pc0FycmF5KHR5cGUpKSB7XG4gICAgICAgICAgICAgICAgICAgIHR5cGUuZm9yRWFjaChmdW5jdGlvbihuYW1lKSAgeyB0aGlzJDBbbWV0aG9kXShuYW1lLCBzZWxlY3RvciwgYXJncywgY2FsbGJhY2spIH0pO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQua2V5cyh0eXBlKS5mb3JFYWNoKGZ1bmN0aW9uKG5hbWUpICB7IHRoaXMkMFttZXRob2RdKG5hbWUsIHR5cGVbbmFtZV0pIH0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgdGhyb3cgbmV3IGVycm9ycyQkTWV0aG9kRXJyb3IobWV0aG9kLCBhcmd1bWVudHMpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfX07XG5cbiAgICB1dGlsJGluZGV4JCRkZWZhdWx0LnJlZ2lzdGVyKHtcbiAgICAgICAgb246IGVsZW1lbnQkb24kJG1ha2VNZXRob2QoXCJvblwiKSxcblxuICAgICAgICBvbmNlOiBlbGVtZW50JG9uJCRtYWtlTWV0aG9kKFwib25jZVwiKVxuICAgIH0pO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIHNldDogZnVuY3Rpb24obmFtZSwgdmFsdWUpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXTtcblxuICAgICAgICAgICAgLy8gaGFuZGxlIHRoZSB2YWx1ZSBzaG9ydGN1dFxuICAgICAgICAgICAgaWYgKGFyZ3VtZW50cy5sZW5ndGggPT09IDEpIHtcbiAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG5hbWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICB2YWx1ZSA9IG5hbWU7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSBuYW1lID09IG51bGwgPyBcIlwiIDogU3RyaW5nKG5hbWUpO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICh2YWx1ZSAhPT0gXCJbb2JqZWN0IE9iamVjdF1cIikge1xuICAgICAgICAgICAgICAgICAgICB2YXIgdGFnID0gbm9kZS50YWdOYW1lO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICh0YWcgPT09IFwiSU5QVVRcIiB8fCB0YWcgPT09IFwiVEVYVEFSRUFcIiB8fCAgdGFnID09PSBcIlNFTEVDVFwiIHx8IHRhZyA9PT0gXCJPUFRJT05cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbmFtZSA9IFwidmFsdWVcIjtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5hbWUgPSBcImlubmVySFRNTFwiO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgaG9vayA9IHV0aWwkYWNjZXNzb3Job29rcyQkZGVmYXVsdC5zZXRbbmFtZV0sXG4gICAgICAgICAgICAgICAgd2F0Y2hlcnMgPSB0aGlzLl9bXCJ3YXRjaGVyMjAwMTAwMVwiXVtuYW1lXSxcbiAgICAgICAgICAgICAgICBvbGRWYWx1ZTtcblxuICAgICAgICAgICAgaWYgKHdhdGNoZXJzKSB7XG4gICAgICAgICAgICAgICAgb2xkVmFsdWUgPSB0aGlzLmdldChuYW1lKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBuYW1lID09PSBcInN0cmluZ1wiKSB7XG4gICAgICAgICAgICAgICAgaWYgKG5hbWVbMF0gPT09IFwiX1wiKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMuX1tuYW1lLnNsaWNlKDEpXSA9IHZhbHVlO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgdmFsdWUgPT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgICAgICAgICAgdmFsdWUgPSB2YWx1ZSh0aGlzKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChob29rKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBob29rKG5vZGUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmICh2YWx1ZSA9PSBudWxsKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLnJlbW92ZUF0dHJpYnV0ZShuYW1lKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIGlmIChuYW1lIGluIG5vZGUpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGVbbmFtZV0gPSB2YWx1ZTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG5vZGUuc2V0QXR0cmlidXRlKG5hbWUsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICBpZiAoSlNDUklQVF9WRVJTSU9OIDwgOSB8fCBMRUdBQ1lfQU5EUk9JRCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gYWx3YXlzIHRyaWdnZXIgcmVmbG93IG1hbnVhbGx5IGZvciBJRTggYW5kIGxlZ2FjeSBBbmRyb2lkXG4gICAgICAgICAgICAgICAgICAgICAgICBub2RlLmNsYXNzTmFtZSA9IG5vZGUuY2xhc3NOYW1lO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSBlbHNlIGlmICh1dGlsJGluZGV4JCRkZWZhdWx0LmlzQXJyYXkobmFtZSkpIHtcbiAgICAgICAgICAgICAgICBuYW1lLmZvckVhY2goZnVuY3Rpb24oa2V5KSAgeyB0aGlzJDAuc2V0KGtleSwgdmFsdWUpIH0pO1xuICAgICAgICAgICAgfSBlbHNlIGlmICh0eXBlb2YgbmFtZSA9PT0gXCJvYmplY3RcIikge1xuICAgICAgICAgICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQua2V5cyhuYW1lKS5mb3JFYWNoKGZ1bmN0aW9uKGtleSkgIHsgdGhpcyQwLnNldChrZXksIG5hbWVba2V5XSkgfSk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKFwic2V0XCIsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmICh3YXRjaGVycyAmJiBvbGRWYWx1ZSAhPT0gdmFsdWUpIHtcbiAgICAgICAgICAgICAgICB3YXRjaGVycy5mb3JFYWNoKGZ1bmN0aW9uKHcpICB7XG4gICAgICAgICAgICAgICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQuc2FmZUNhbGwodGhpcyQwLCB3LCB2YWx1ZSwgb2xkVmFsdWUpO1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIGVsZW1lbnQkdHJhdmVyc2luZyQkbWFrZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZE5hbWUsIHByb3BlcnR5TmFtZSwgYWxsKSAge3JldHVybiBmdW5jdGlvbihzZWxlY3Rvcikge1xuICAgICAgICAgICAgaWYgKHNlbGVjdG9yICYmIHR5cGVvZiBzZWxlY3RvciAhPT0gXCJzdHJpbmdcIikgdGhyb3cgbmV3IGVycm9ycyQkTWV0aG9kRXJyb3IobWV0aG9kTmFtZSwgYXJndW1lbnRzKTtcblxuICAgICAgICAgICAgdmFyIG1hdGNoZXIgPSB1dGlsJHNlbGVjdG9ybWF0Y2hlciQkZGVmYXVsdChzZWxlY3RvciksXG4gICAgICAgICAgICAgICAgbm9kZXMgPSBhbGwgPyBbXSA6IG51bGwsXG4gICAgICAgICAgICAgICAgaXQgPSB0aGlzWzBdO1xuXG4gICAgICAgICAgICAvLyBtZXRob2QgY2xvc2VzdCBzdGFydHMgdHJhdmVyc2luZyBmcm9tIHRoZSBlbGVtZW50IGl0c2VsZlxuICAgICAgICAgICAgLy8gZXhjZXB0IG5vIHNlbGVjdG9yIHdhcyBzcGVjaWZpZWQgd2hlcmUgaXQgcmV0dXJucyBwYXJlbnRcbiAgICAgICAgICAgIGlmICghbWF0Y2hlciB8fCBtZXRob2ROYW1lICE9PSBcImNsb3Nlc3RcIikge1xuICAgICAgICAgICAgICAgIGl0ID0gaXRbcHJvcGVydHlOYW1lXTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgZm9yICg7IGl0OyBpdCA9IGl0W3Byb3BlcnR5TmFtZV0pIHtcbiAgICAgICAgICAgICAgICBpZiAoaXQubm9kZVR5cGUgPT09IDEgJiYgKCFtYXRjaGVyIHx8IG1hdGNoZXIoaXQpKSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIWFsbCkgYnJlYWs7XG5cbiAgICAgICAgICAgICAgICAgICAgbm9kZXMucHVzaChpdCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gYWxsID8gdXRpbCRpbmRleCQkZGVmYXVsdC5tYXAuY2FsbChub2RlcywgJEVsZW1lbnQpIDogJEVsZW1lbnQoaXQpO1xuICAgICAgICB9fTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICBuZXh0OiBlbGVtZW50JHRyYXZlcnNpbmckJG1ha2VNZXRob2QoXCJuZXh0XCIsIFwibmV4dFNpYmxpbmdcIiksXG5cbiAgICAgICAgcHJldjogZWxlbWVudCR0cmF2ZXJzaW5nJCRtYWtlTWV0aG9kKFwicHJldlwiLCBcInByZXZpb3VzU2libGluZ1wiKSxcblxuICAgICAgICBuZXh0QWxsOiBlbGVtZW50JHRyYXZlcnNpbmckJG1ha2VNZXRob2QoXCJuZXh0QWxsXCIsIFwibmV4dFNpYmxpbmdcIiwgdHJ1ZSksXG5cbiAgICAgICAgcHJldkFsbDogZWxlbWVudCR0cmF2ZXJzaW5nJCRtYWtlTWV0aG9kKFwicHJldkFsbFwiLCBcInByZXZpb3VzU2libGluZ1wiLCB0cnVlKSxcblxuICAgICAgICBjbG9zZXN0OiBlbGVtZW50JHRyYXZlcnNpbmckJG1ha2VNZXRob2QoXCJjbG9zZXN0XCIsIFwicGFyZW50Tm9kZVwiKVxuICAgIH0sIGZ1bmN0aW9uKG1ldGhvZE5hbWUpICB7XG4gICAgICAgIGlmIChtZXRob2ROYW1lLnNsaWNlKC0zKSA9PT0gXCJBbGxcIikge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gW119O1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgcmV0dXJuIGZ1bmN0aW9uKCkgIHtyZXR1cm4gbmV3ICROdWxsRWxlbWVudCgpfTtcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIHZhbHVlOiBmdW5jdGlvbih2YWwpIHtcbiAgICAgICAgICAgIGlmIChhcmd1bWVudHMubGVuZ3RoID09PSAwKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuZ2V0KCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKHR5cGVvZiB2YWwgPT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gdGhpcy5zZXQodmFsKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRoaXMuc2V0KFwiXCIpLmFwcGVuZCh2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfSk7XG5cbiAgICB2YXIgdXRpbCRhbmltYXRpb25oYW5kbGVyJCRUUkFOU0lUSU9OX1BST1BTID0gW1widGltaW5nLWZ1bmN0aW9uXCIsIFwicHJvcGVydHlcIiwgXCJkdXJhdGlvblwiLCBcImRlbGF5XCJdLm1hcChmdW5jdGlvbihwcm9wKSAge3JldHVybiBcInRyYW5zaXRpb24tXCIgKyBwcm9wfSksXG4gICAgICAgIHV0aWwkYW5pbWF0aW9uaGFuZGxlciQkcGFyc2VUaW1lVmFsdWUgPSBmdW5jdGlvbih2YWx1ZSkgIHtcbiAgICAgICAgICAgIHZhciByZXN1bHQgPSBwYXJzZUZsb2F0KHZhbHVlKSB8fCAwO1xuICAgICAgICAgICAgLy8gaWYgZHVyYXRpb24gaXMgaW4gc2Vjb25kcywgdGhlbiBtdWx0aXBsZSByZXN1bHQgdmFsdWUgYnkgMTAwMFxuICAgICAgICAgICAgcmV0dXJuICFyZXN1bHQgfHwgdmFsdWUuc2xpY2UoLTIpID09PSBcIm1zXCIgPyByZXN1bHQgOiByZXN1bHQgKiAxMDAwO1xuICAgICAgICB9LFxuICAgICAgICB1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJGNhbGNUcmFuc2l0aW9uRHVyYXRpb24gPSBmdW5jdGlvbih0cmFuc2l0aW9uVmFsdWVzKSAge1xuICAgICAgICAgICAgdmFyIGRlbGF5cyA9IHRyYW5zaXRpb25WYWx1ZXNbM10sXG4gICAgICAgICAgICAgICAgZHVyYXRpb25zID0gdHJhbnNpdGlvblZhbHVlc1syXTtcblxuICAgICAgICAgICAgcmV0dXJuIE1hdGgubWF4LmFwcGx5KE1hdGgsIGR1cmF0aW9ucy5tYXAoZnVuY3Rpb24odmFsdWUsIGluZGV4KSAge1xuICAgICAgICAgICAgICAgIHJldHVybiB1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJHBhcnNlVGltZVZhbHVlKHZhbHVlKSArICh1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJHBhcnNlVGltZVZhbHVlKGRlbGF5c1tpbmRleF0pIHx8IDApO1xuICAgICAgICAgICAgfSkpO1xuICAgICAgICB9O1xuXG4gICAgLy8gaW5pdGlhbGl6ZSBob29rcyBmb3IgcHJvcGVydGllcyB1c2VkIGJlbG93XG4gICAgdXRpbCRhbmltYXRpb25oYW5kbGVyJCRUUkFOU0lUSU9OX1BST1BTLmNvbmNhdChcImFuaW1hdGlvbi1kdXJhdGlvblwiKS5mb3JFYWNoKGZ1bmN0aW9uKHByb3ApICB7IHV0aWwkc3R5bGVob29rcyQkZGVmYXVsdC5maW5kKHByb3AsIEhUTUwuc3R5bGUpIH0pO1xuXG4gICAgdmFyIHV0aWwkYW5pbWF0aW9uaGFuZGxlciQkZGVmYXVsdCA9IGZ1bmN0aW9uKG5vZGUsIGNvbXB1dGVkLCBhbmltYXRpb25OYW1lLCBoaWRpbmcsIGRvbmUpICB7XG4gICAgICAgIHZhciBydWxlcywgZHVyYXRpb247XG5cbiAgICAgICAgLy8gTGVnYWN5IEFuZHJvaWQgaXMgdXN1YWxseSBzbG93IGFuZCBoYXMgbG90cyBvZiBidWdzIGluIHRoZVxuICAgICAgICAvLyBDU1MgYW5pbWF0aW9ucyBpbXBsZW1lbnRhdGlvbiwgc28gc2tpcCBhbnkgYW5pbWF0aW9ucyBmb3IgaXRcbiAgICAgICAgaWYgKExFR0FDWV9BTkRST0lEIHx8IEpTQ1JJUFRfVkVSU0lPTiA8IDEwKSByZXR1cm4gbnVsbDtcblxuICAgICAgICBpZiAoYW5pbWF0aW9uTmFtZSkge1xuICAgICAgICAgICAgZHVyYXRpb24gPSB1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJHBhcnNlVGltZVZhbHVlKGNvbXB1dGVkW3V0aWwkc3R5bGVob29rcyQkZGVmYXVsdC5nZXRbXCJhbmltYXRpb24tZHVyYXRpb25cIl1dKTtcblxuICAgICAgICAgICAgaWYgKCFkdXJhdGlvbikgcmV0dXJuOyAvLyBza2lwIGFuaW1hdGlvbnMgd2l0aCB6ZXJvIGR1cmF0aW9uXG5cbiAgICAgICAgICAgIHJ1bGVzID0gW1xuICAgICAgICAgICAgICAgIFdFQktJVF9QUkVGSVggKyBcImFuaW1hdGlvbi1kaXJlY3Rpb246XCIgKyAoaGlkaW5nID8gXCJub3JtYWxcIiA6IFwicmV2ZXJzZVwiKSxcbiAgICAgICAgICAgICAgICBXRUJLSVRfUFJFRklYICsgXCJhbmltYXRpb24tbmFtZTpcIiArIGFuaW1hdGlvbk5hbWUsXG4gICAgICAgICAgICAgICAgLy8gZm9yIENTUzMgYW5pbWF0aW9uIGVsZW1lbnQgc2hvdWxkIGFsd2F5cyBiZSB2aXNpYmxlXG4gICAgICAgICAgICAgICAgXCJ2aXNpYmlsaXR5OmluaGVyaXRcIlxuICAgICAgICAgICAgXTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHZhciB0cmFuc2l0aW9uVmFsdWVzID0gdXRpbCRhbmltYXRpb25oYW5kbGVyJCRUUkFOU0lUSU9OX1BST1BTLm1hcChmdW5jdGlvbihwcm9wLCBpbmRleCkgIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gaGF2ZSB0byB1c2UgcmVnZXhwIHRvIHNwbGl0IHRyYW5zaXRpb24tdGltaW5nLWZ1bmN0aW9uIHZhbHVlXG4gICAgICAgICAgICAgICAgICAgIHJldHVybiBjb21wdXRlZFt1dGlsJHN0eWxlaG9va3MkJGRlZmF1bHQuZ2V0W3Byb3BdXS5zcGxpdChpbmRleCA/IFwiLCBcIiA6IC8sICg/IVxcZCkvKTtcbiAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgZHVyYXRpb24gPSB1dGlsJGFuaW1hdGlvbmhhbmRsZXIkJGNhbGNUcmFuc2l0aW9uRHVyYXRpb24odHJhbnNpdGlvblZhbHVlcyk7XG5cbiAgICAgICAgICAgIGlmICghZHVyYXRpb24pIHJldHVybjsgLy8gc2tpcCB0cmFuc2l0aW9ucyB3aXRoIHplcm8gZHVyYXRpb25cblxuICAgICAgICAgICAgaWYgKHRyYW5zaXRpb25WYWx1ZXNbMV0uaW5kZXhPZihcImFsbFwiKSA8IDApIHtcbiAgICAgICAgICAgICAgICAvLyB0cnkgdG8gZmluZCBleGlzdGluZyBvciB1c2UgMHMgbGVuZ3RoIG9yIG1ha2UgYSBuZXcgdmlzaWJpbGl0eSB0cmFuc2l0aW9uXG4gICAgICAgICAgICAgICAgdmFyIHZpc2liaWxpdHlJbmRleCA9IHRyYW5zaXRpb25WYWx1ZXNbMV0uaW5kZXhPZihcInZpc2liaWxpdHlcIik7XG5cbiAgICAgICAgICAgICAgICBpZiAodmlzaWJpbGl0eUluZGV4IDwgMCkgdmlzaWJpbGl0eUluZGV4ID0gdHJhbnNpdGlvblZhbHVlc1syXS5pbmRleE9mKFwiMHNcIik7XG4gICAgICAgICAgICAgICAgaWYgKHZpc2liaWxpdHlJbmRleCA8IDApIHZpc2liaWxpdHlJbmRleCA9IHRyYW5zaXRpb25WYWx1ZXNbMV0ubGVuZ3RoO1xuXG4gICAgICAgICAgICAgICAgdHJhbnNpdGlvblZhbHVlc1swXVt2aXNpYmlsaXR5SW5kZXhdID0gXCJsaW5lYXJcIjtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uVmFsdWVzWzFdW3Zpc2liaWxpdHlJbmRleF0gPSBcInZpc2liaWxpdHlcIjtcbiAgICAgICAgICAgICAgICB0cmFuc2l0aW9uVmFsdWVzW2hpZGluZyA/IDIgOiAzXVt2aXNpYmlsaXR5SW5kZXhdID0gXCIwc1wiO1xuICAgICAgICAgICAgICAgIHRyYW5zaXRpb25WYWx1ZXNbaGlkaW5nID8gMyA6IDJdW3Zpc2liaWxpdHlJbmRleF0gPSBkdXJhdGlvbiArIFwibXNcIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcnVsZXMgPSB0cmFuc2l0aW9uVmFsdWVzLm1hcChmdW5jdGlvbihwcm9wcywgaW5kZXgpICB7XG4gICAgICAgICAgICAgICAgLy8gZmlsbCBob2xlcyBpbiBhIHRyYXNpdGlvbiBwcm9wZXJ0eSB2YWx1ZVxuICAgICAgICAgICAgICAgIGZvciAodmFyIGkgPSAwLCBuID0gcHJvcHMubGVuZ3RoOyBpIDwgbjsgKytpKSB7XG4gICAgICAgICAgICAgICAgICAgIHByb3BzW2ldID0gcHJvcHNbaV0gfHwgcHJvcHNbaSAtIDFdIHx8IFwiaW5pdGlhbFwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHJldHVybiBXRUJLSVRfUFJFRklYICsgdXRpbCRhbmltYXRpb25oYW5kbGVyJCRUUkFOU0lUSU9OX1BST1BTW2luZGV4XSArIFwiOlwiICsgcHJvcHMuam9pbihcIiwgXCIpO1xuICAgICAgICAgICAgfSk7XG5cbiAgICAgICAgICAgIHJ1bGVzLnB1c2goXG4gICAgICAgICAgICAgICAgLy8gYXBwZW5kIHRhcmdldCB2aXNpYmlsaXR5IHZhbHVlIHRvIHRyaWdnZXIgdHJhbnNpdGlvblxuICAgICAgICAgICAgICAgIFwidmlzaWJpbGl0eTpcIiArIChoaWRpbmcgPyBcImhpZGRlblwiIDogXCJpbmhlcml0XCIpLFxuICAgICAgICAgICAgICAgIC8vIHVzZSB3aWxsQ2hhbmdlIHRvIGltcHJvdmUgcGVyZm9ybWFuY2UgaW4gbW9kZXJuIGJyb3dzZXJzOlxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9kZXYub3BlcmEuY29tL2FydGljbGVzL2Nzcy13aWxsLWNoYW5nZS1wcm9wZXJ0eS9cbiAgICAgICAgICAgICAgICBcIndpbGwtY2hhbmdlOlwiICsgdHJhbnNpdGlvblZhbHVlc1sxXS5qb2luKFwiLCBcIilcbiAgICAgICAgICAgICk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgICAgY3NzVGV4dDogcnVsZXMuam9pbihcIjtcIiksXG4gICAgICAgICAgICBpbml0aWFsQ3NzVGV4dDogbm9kZS5zdHlsZS5jc3NUZXh0LFxuICAgICAgICAgICAgLy8gdGhpcyBmdW5jdGlvbiB1c2VkIHRvIHRyaWdnZXIgY2FsbGJhY2tcbiAgICAgICAgICAgIGhhbmRsZUV2ZW50OiBmdW5jdGlvbihlKSAge1xuICAgICAgICAgICAgICAgIGlmIChlLnRhcmdldCA9PT0gbm9kZSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uTmFtZSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUuYW5pbWF0aW9uTmFtZSAhPT0gYW5pbWF0aW9uTmFtZSkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKGUucHJvcGVydHlOYW1lICE9PSBcInZpc2liaWxpdHlcIikgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTsgLy8gdGhpcyBpcyBhbiBpbnRlcm5hbCBldmVudFxuXG4gICAgICAgICAgICAgICAgICAgIGRvbmUoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH07XG4gICAgfTtcblxuICAgIHZhciBlbGVtZW50JHZpc2liaWxpdHkkJFRSQU5TSVRJT05fRVZFTlRfVFlQRSA9IFdFQktJVF9QUkVGSVggPyBcIndlYmtpdFRyYW5zaXRpb25FbmRcIiA6IFwidHJhbnNpdGlvbmVuZFwiLFxuICAgICAgICBlbGVtZW50JHZpc2liaWxpdHkkJEFOSU1BVElPTl9FVkVOVF9UWVBFID0gV0VCS0lUX1BSRUZJWCA/IFwid2Via2l0QW5pbWF0aW9uRW5kXCIgOiBcImFuaW1hdGlvbmVuZFwiLFxuICAgICAgICBlbGVtZW50JHZpc2liaWxpdHkkJG1ha2VNZXRob2QgPSBmdW5jdGlvbihuYW1lLCBjb25kaXRpb24pICB7cmV0dXJuIGZ1bmN0aW9uKGFuaW1hdGlvbk5hbWUsIGNhbGxiYWNrKSB7dmFyIHRoaXMkMCA9IHRoaXM7XG4gICAgICAgICAgICBpZiAodHlwZW9mIGFuaW1hdGlvbk5hbWUgIT09IFwic3RyaW5nXCIpIHtcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA9IGFuaW1hdGlvbk5hbWU7XG4gICAgICAgICAgICAgICAgYW5pbWF0aW9uTmFtZSA9IG51bGw7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIGlmIChjYWxsYmFjayAmJiB0eXBlb2YgY2FsbGJhY2sgIT09IFwiZnVuY3Rpb25cIikge1xuICAgICAgICAgICAgICAgIHRocm93IG5ldyBlcnJvcnMkJE1ldGhvZEVycm9yKG5hbWUsIGFyZ3VtZW50cyk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBub2RlID0gdGhpc1swXSxcbiAgICAgICAgICAgICAgICBzdHlsZSA9IG5vZGUuc3R5bGUsXG4gICAgICAgICAgICAgICAgY29tcHV0ZWQgPSB1dGlsJGluZGV4JCRkZWZhdWx0LmNvbXB1dGVTdHlsZShub2RlKSxcbiAgICAgICAgICAgICAgICBoaWRpbmcgPSBjb25kaXRpb24sXG4gICAgICAgICAgICAgICAgZnJhbWVJZCA9IHRoaXMuX1tcImZyYW1lMjAwMTAwMVwiXSxcbiAgICAgICAgICAgICAgICBkb25lID0gZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgICAgICAgICBpZiAoYW5pbWF0aW9uSGFuZGxlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgbm9kZS5yZW1vdmVFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgYW5pbWF0aW9uSGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBjbGVhciBpbmxpbmUgc3R5bGUgYWRqdXN0bWVudHMgd2VyZSBtYWRlIHByZXZpb3VzbHlcbiAgICAgICAgICAgICAgICAgICAgICAgIHN0eWxlLmNzc1RleHQgPSBhbmltYXRpb25IYW5kbGVyLmluaXRpYWxDc3NUZXh0O1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgdGhpcyQwLnNldChcImFyaWEtaGlkZGVuXCIsIFN0cmluZyhoaWRpbmcpKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAvLyBhbHdheXMgdXBkYXRlIGVsZW1lbnQgdmlzaWJpbGl0eSBwcm9wZXJ0eTogdXNlIHZhbHVlIFwiaW5oZXJpdFwiXG4gICAgICAgICAgICAgICAgICAgIC8vIHRvIHJlc3BlY3QgcGFyZW50IGNvbnRhaW5lciB2aXNpYmlsaXR5LiBTaG91bGQgYmUgYSBzZXBhcmF0ZVxuICAgICAgICAgICAgICAgICAgICAvLyBmcm9tIHNldHRpbmcgY3NzVGV4dCBiZWNhdXNlIG9mIE9wZXJhIDEyIHF1aXJrc1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS52aXNpYmlsaXR5ID0gaGlkaW5nID8gXCJoaWRkZW5cIiA6IFwiaW5oZXJpdFwiO1xuXG4gICAgICAgICAgICAgICAgICAgIHRoaXMkMC5fW1wiZnJhbWUyMDAxMDAxXCJdID0gbnVsbDtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoY2FsbGJhY2spIGNhbGxiYWNrKHRoaXMkMCk7XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgaWYgKHR5cGVvZiBoaWRpbmcgIT09IFwiYm9vbGVhblwiKSB7XG4gICAgICAgICAgICAgICAgaGlkaW5nID0gY29tcHV0ZWQudmlzaWJpbGl0eSAhPT0gXCJoaWRkZW5cIjtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gY2FuY2VsIHByZXZpb3VzIGZyYW1lIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgaWYgKGZyYW1lSWQpIERPTS5jYW5jZWxGcmFtZShmcmFtZUlkKTtcblxuICAgICAgICAgICAgaWYgKCFub2RlLm93bmVyRG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmNvbnRhaW5zKG5vZGUpKSB7XG4gICAgICAgICAgICAgICAgLy8gYXBwbHkgYXR0cmlidXRlL3Zpc2liaWxpdHkgc3luY3Jvbm91c2x5IGZvciBkZXRhY2hlZCBET00gZWxlbWVudHNcbiAgICAgICAgICAgICAgICAvLyBiZWNhdXNlIGJyb3dzZXIgcmV0dXJucyB6ZXJvIGFuaW1hdGlvbi90cmFuc2l0aW9uIGR1cmF0aW9uIGZvciB0aGVtXG4gICAgICAgICAgICAgICAgZG9uZSgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICB2YXIgYW5pbWF0aW9uSGFuZGxlciA9IHV0aWwkYW5pbWF0aW9uaGFuZGxlciQkZGVmYXVsdChub2RlLCBjb21wdXRlZCwgYW5pbWF0aW9uTmFtZSwgaGlkaW5nLCBkb25lKSxcbiAgICAgICAgICAgICAgICAgICAgZXZlbnRUeXBlID0gYW5pbWF0aW9uTmFtZSA/IGVsZW1lbnQkdmlzaWJpbGl0eSQkQU5JTUFUSU9OX0VWRU5UX1RZUEUgOiBlbGVtZW50JHZpc2liaWxpdHkkJFRSQU5TSVRJT05fRVZFTlRfVFlQRTtcbiAgICAgICAgICAgICAgICAvLyB1c2UgcmVxdWVzdEFuaW1hdGlvbkZyYW1lIHRvIGF2b2lkIGFuaW1hdGlvbiBxdWlya3MgZm9yXG4gICAgICAgICAgICAgICAgLy8gbmV3IGVsZW1lbnRzIGluc2VydGVkIGludG8gdGhlIERPTVxuICAgICAgICAgICAgICAgIC8vIGh0dHA6Ly9jaHJpc3RpYW5oZWlsbWFubi5jb20vMjAxMy8wOS8xOS9xdWlja3ktZmFkaW5nLWluLWEtbmV3bHktY3JlYXRlZC1lbGVtZW50LXVzaW5nLWNzcy9cbiAgICAgICAgICAgICAgICB0aGlzLl9bXCJmcmFtZTIwMDEwMDFcIl0gPSBET00ucmVxdWVzdEZyYW1lKCFhbmltYXRpb25IYW5kbGVyID8gZG9uZSA6IGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgICAgICAgICAgICAgbm9kZS5hZGRFdmVudExpc3RlbmVyKGV2ZW50VHlwZSwgYW5pbWF0aW9uSGFuZGxlciwgdHJ1ZSk7XG4gICAgICAgICAgICAgICAgICAgIC8vIHVwZGF0ZSBtb2RpZmllZCBzdHlsZSBydWxlc1xuICAgICAgICAgICAgICAgICAgICBzdHlsZS5jc3NUZXh0ID0gYW5pbWF0aW9uSGFuZGxlci5pbml0aWFsQ3NzVGV4dCArIGFuaW1hdGlvbkhhbmRsZXIuY3NzVGV4dDtcbiAgICAgICAgICAgICAgICAgICAgLy8gdHJpZ2dlciBDU1MzIHRyYW5zaXRpb24gLyBhbmltYXRpb25cbiAgICAgICAgICAgICAgICAgICAgdGhpcyQwLnNldChcImFyaWEtaGlkZGVuXCIsIFN0cmluZyhoaWRpbmcpKTtcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH19O1xuXG4gICAgdXRpbCRpbmRleCQkZGVmYXVsdC5yZWdpc3Rlcih7XG4gICAgICAgIHNob3c6IGVsZW1lbnQkdmlzaWJpbGl0eSQkbWFrZU1ldGhvZChcInNob3dcIiwgZmFsc2UpLFxuXG4gICAgICAgIGhpZGU6IGVsZW1lbnQkdmlzaWJpbGl0eSQkbWFrZU1ldGhvZChcImhpZGVcIiwgdHJ1ZSksXG5cbiAgICAgICAgdG9nZ2xlOiBlbGVtZW50JHZpc2liaWxpdHkkJG1ha2VNZXRob2QoXCJ0b2dnbGVcIilcbiAgICB9KTtcblxuICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQucmVnaXN0ZXIoe1xuICAgICAgICB3YXRjaDogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB3YXRjaGVycyA9IHRoaXMuX1tcIndhdGNoZXIyMDAxMDAxXCJdO1xuXG4gICAgICAgICAgICBpZiAoIXdhdGNoZXJzW25hbWVdKSB3YXRjaGVyc1tuYW1lXSA9IFtdO1xuXG4gICAgICAgICAgICB3YXRjaGVyc1tuYW1lXS5wdXNoKGNhbGxiYWNrKTtcblxuICAgICAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdW53YXRjaDogZnVuY3Rpb24obmFtZSwgY2FsbGJhY2spIHtcbiAgICAgICAgICAgIHZhciB3YXRjaGVycyA9IHRoaXMuX1tcIndhdGNoZXIyMDAxMDAxXCJdO1xuXG4gICAgICAgICAgICBpZiAod2F0Y2hlcnNbbmFtZV0pIHtcbiAgICAgICAgICAgICAgICB3YXRjaGVyc1tuYW1lXSA9IHdhdGNoZXJzW25hbWVdLmZpbHRlcihmdW5jdGlvbih3KSAge3JldHVybiB3ICE9PSBjYWxsYmFja30pO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4gdGhpcztcbiAgICAgICAgfVxuICAgIH0pO1xuXG4gICAgdmFyIHV0aWwkZXh0ZW5zaW9uaGFuZGxlciQkcmVQcml2YXRlRnVuY3Rpb24gPSAvXig/Om9ufGRvKVtBLVpdLztcblxuICAgIHZhciB1dGlsJGV4dGVuc2lvbmhhbmRsZXIkJGRlZmF1bHQgPSBmdW5jdGlvbihzZWxlY3RvciwgY29uZGl0aW9uLCBtaXhpbnMsIGluZGV4KSAge1xuICAgICAgICB2YXIgY3RyID0gbWl4aW5zLmhhc093blByb3BlcnR5KFwiY29uc3RydWN0b3JcIikgJiYgbWl4aW5zLmNvbnN0cnVjdG9yLFxuICAgICAgICAgICAgbWF0Y2hlciA9IHV0aWwkc2VsZWN0b3JtYXRjaGVyJCRkZWZhdWx0KHNlbGVjdG9yKTtcblxuICAgICAgICByZXR1cm4gZnVuY3Rpb24obm9kZSwgbW9jaykgIHtcbiAgICAgICAgICAgIHZhciBlbCA9ICRFbGVtZW50KG5vZGUpO1xuICAgICAgICAgICAgLy8gc2tpcCBwcmV2aW91c2x5IGludm9rZWQgb3IgbWlzbWF0Y2hlZCBlbGVtZW50c1xuICAgICAgICAgICAgaWYgKH5lbC5fW1wiZXh0ZW5zaW9uMjAwMTAwMVwiXS5pbmRleE9mKGluZGV4KSB8fCAhbWF0Y2hlcihub2RlKSkgcmV0dXJuO1xuICAgICAgICAgICAgLy8gbWFyayBleHRlbnNpb24gYXMgaW52b2tlZFxuICAgICAgICAgICAgZWwuX1tcImV4dGVuc2lvbjIwMDEwMDFcIl0ucHVzaChpbmRleCk7XG5cbiAgICAgICAgICAgIGlmIChtb2NrID09PSB0cnVlIHx8IGNvbmRpdGlvbihlbCkgIT09IGZhbHNlKSB7XG4gICAgICAgICAgICAgICAgLy8gYXBwbHkgYWxsIHByaXZhdGUvcHVibGljIG1lbWJlcnMgdG8gdGhlIGVsZW1lbnQncyBpbnRlcmZhY2VcbiAgICAgICAgICAgICAgICB2YXIgcHJpdmF0ZUZ1bmN0aW9ucyA9IE9iamVjdC5rZXlzKG1peGlucykuZmlsdGVyKGZ1bmN0aW9uKHByb3ApICB7XG4gICAgICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9IG1peGluc1twcm9wXTtcbiAgICAgICAgICAgICAgICAgICAgLy8gVE9ETzogcHJpdmF0ZSBmdW5jdGlvbnMgYXJlIGRlcHJlY2F0ZWQsIHJlbW92ZSB0aGlzIGxpbmUgbGF0ZXJcbiAgICAgICAgICAgICAgICAgICAgaWYgKHV0aWwkZXh0ZW5zaW9uaGFuZGxlciQkcmVQcml2YXRlRnVuY3Rpb24uZXhlYyhwcm9wKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gcHJlc2VydmUgY29udGV4dCBmb3IgcHJpdmF0ZSBmdW5jdGlvbnNcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsW3Byb3BdID0gZnVuY3Rpb24oKSAge3JldHVybiB2YWx1ZS5hcHBseShlbCwgYXJndW1lbnRzKX07XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhbW9jaztcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGlmIChwcm9wICE9PSBcImNvbnN0cnVjdG9yXCIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGVsW3Byb3BdID0gdmFsdWU7XG5cbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiAhbW9jayAmJiBwcm9wWzBdID09PSBcIl9cIjtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH0pO1xuXG4gICAgICAgICAgICAgICAgLy8gaW52b2tlIGNvbnN0cnVjdG9yIGlmIGl0IGV4aXN0c1xuICAgICAgICAgICAgICAgIC8vIG1ha2UgYSBzYWZlIGNhbGwgc28gbGl2ZSBleHRlbnNpb25zIGNhbid0IGJyZWFrIGVhY2ggb3RoZXJcbiAgICAgICAgICAgICAgICBpZiAoY3RyKSB1dGlsJGluZGV4JCRkZWZhdWx0LnNhZmVDYWxsKGVsLCBjdHIpO1xuICAgICAgICAgICAgICAgIC8vIHJlbW92ZSBldmVudCBoYW5kbGVycyBmcm9tIGVsZW1lbnQncyBpbnRlcmZhY2VcbiAgICAgICAgICAgICAgICBwcml2YXRlRnVuY3Rpb25zLmZvckVhY2goZnVuY3Rpb24ocHJvcCkgIHsgZGVsZXRlIGVsW3Byb3BdIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICB9O1xuICAgIH07XG5cbiAgICAvLyBJbnNwaXJlZCBieSB0cmljayBkaXNjb3ZlcmVkIGJ5IERhbmllbCBCdWNobmVyOlxuICAgIC8vIGh0dHBzOi8vZ2l0aHViLmNvbS9jc3V3bGRjYXQvU2VsZWN0b3JMaXN0ZW5lclxuXG4gICAgdmFyIGdsb2JhbCRleHRlbmQkJGV4dGVuc2lvbnMgPSBbXSxcbiAgICAgICAgZ2xvYmFsJGV4dGVuZCQkcmV0dXJuVHJ1ZSA9IGZ1bmN0aW9uKCkgIHtyZXR1cm4gdHJ1ZX0sXG4gICAgICAgIGdsb2JhbCRleHRlbmQkJHJldHVybkZhbHNlID0gZnVuY3Rpb24oKSAge3JldHVybiBmYWxzZX0sXG4gICAgICAgIGdsb2JhbCRleHRlbmQkJGNzc1RleHQ7XG5cbiAgICBET00uZXh0ZW5kID0gZnVuY3Rpb24oc2VsZWN0b3IsIGNvbmRpdGlvbiwgZGVmaW5pdGlvbikge1xuICAgICAgICBpZiAoYXJndW1lbnRzLmxlbmd0aCA9PT0gMikge1xuICAgICAgICAgICAgZGVmaW5pdGlvbiA9IGNvbmRpdGlvbjtcbiAgICAgICAgICAgIGNvbmRpdGlvbiA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAodHlwZW9mIGNvbmRpdGlvbiA9PT0gXCJib29sZWFuXCIpIGNvbmRpdGlvbiA9IGNvbmRpdGlvbiA/IGdsb2JhbCRleHRlbmQkJHJldHVyblRydWUgOiBnbG9iYWwkZXh0ZW5kJCRyZXR1cm5GYWxzZTtcbiAgICAgICAgaWYgKHR5cGVvZiBkZWZpbml0aW9uID09PSBcImZ1bmN0aW9uXCIpIGRlZmluaXRpb24gPSB7Y29uc3RydWN0b3I6IGRlZmluaXRpb259O1xuXG4gICAgICAgIGlmICghZGVmaW5pdGlvbiB8fCB0eXBlb2YgZGVmaW5pdGlvbiAhPT0gXCJvYmplY3RcIiB8fCB0eXBlb2YgY29uZGl0aW9uICE9PSBcImZ1bmN0aW9uXCIpIHRocm93IG5ldyBlcnJvcnMkJFN0YXRpY01ldGhvZEVycm9yKFwiZXh0ZW5kXCIsIGFyZ3VtZW50cyk7XG5cbiAgICAgICAgaWYgKHNlbGVjdG9yID09PSBcIipcIikge1xuICAgICAgICAgICAgdXRpbCRpbmRleCQkZGVmYXVsdC5rZXlzKGRlZmluaXRpb24pLmZvckVhY2goZnVuY3Rpb24obWV0aG9kTmFtZSkgIHtcbiAgICAgICAgICAgICAgICAkRWxlbWVudC5wcm90b3R5cGVbbWV0aG9kTmFtZV0gPSBkZWZpbml0aW9uW21ldGhvZE5hbWVdO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICB2YXIgZXh0ID0gdXRpbCRleHRlbnNpb25oYW5kbGVyJCRkZWZhdWx0KHNlbGVjdG9yLCBjb25kaXRpb24sIGRlZmluaXRpb24sIGdsb2JhbCRleHRlbmQkJGV4dGVuc2lvbnMubGVuZ3RoKTtcblxuICAgICAgICAgICAgZ2xvYmFsJGV4dGVuZCQkZXh0ZW5zaW9ucy5wdXNoKGV4dCk7XG5cbiAgICAgICAgICAgIC8vIGluaXRpYWxpemUgZXh0ZW5zaW9uIG1hbnVhbGx5IHRvIG1ha2Ugc3VyZSB0aGF0IGFsbCBlbGVtZW50c1xuICAgICAgICAgICAgLy8gaGF2ZSBhcHByb3ByaWF0ZSBtZXRob2RzIGJlZm9yZSB0aGV5IGFyZSB1c2VkIGluIG90aGVyIERPTS5leHRlbmQuXG4gICAgICAgICAgICAvLyBBbHNvIGZpeGVzIGxlZ2FjeSBJRXMgd2hlbiB0aGUgSFRDIGJlaGF2aW9yIGlzIGFscmVhZHkgYXR0YWNoZWRcbiAgICAgICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQuZWFjaC5jYWxsKERPQ1VNRU5ULnF1ZXJ5U2VsZWN0b3JBbGwoc2VsZWN0b3IpLCBleHQpO1xuICAgICAgICAgICAgLy8gTVVTVCBiZSBhZnRlciBxdWVyeVNlbGVjdG9yQWxsIGJlY2F1c2Ugb2YgbGVnYWN5IElFcyBxdWlya3NcbiAgICAgICAgICAgIERPTS5pbXBvcnRTdHlsZXMoc2VsZWN0b3IsIGdsb2JhbCRleHRlbmQkJGNzc1RleHQpO1xuICAgICAgICB9XG4gICAgfTtcblxuICAgIGlmIChKU0NSSVBUX1ZFUlNJT04gPCAxMCkge1xuICAgICAgICBnbG9iYWwkZXh0ZW5kJCRjc3NUZXh0ID0gXCItbXMtYmVoYXZpb3I6dXJsKFwiICsgdXRpbCRpbmRleCQkZGVmYXVsdC5nZXRMZWdhY3lGaWxlKFwiaHRjXCIpICsgXCIpICFpbXBvcnRhbnRcIjtcblxuICAgICAgICBET0NVTUVOVC5hdHRhY2hFdmVudChcIm9uXCIgKyBDVVNUT01fRVZFTlRfVFlQRSwgZnVuY3Rpb24oKSAge1xuICAgICAgICAgICAgdmFyIGUgPSBXSU5ET1cuZXZlbnQ7XG5cbiAgICAgICAgICAgIGlmIChlLnNyY1VybiA9PT0gQ1VTVE9NX0VWRU5UX1RZUEUpIHtcbiAgICAgICAgICAgICAgICBnbG9iYWwkZXh0ZW5kJCRleHRlbnNpb25zLmZvckVhY2goZnVuY3Rpb24oZXh0KSAgeyBleHQoZS5zcmNFbGVtZW50KSB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSBlbHNlIHtcbiAgICAgICAgdmFyIGdsb2JhbCRleHRlbmQkJF9leHRlbmQgPSBET00uZXh0ZW5kO1xuXG4gICAgICAgIGdsb2JhbCRleHRlbmQkJGNzc1RleHQgPSBXRUJLSVRfUFJFRklYICsgXCJhbmltYXRpb24tbmFtZTpET00yMDAxMDAxICFpbXBvcnRhbnQ7XCI7XG4gICAgICAgIGdsb2JhbCRleHRlbmQkJGNzc1RleHQgKz0gV0VCS0lUX1BSRUZJWCArIFwiYW5pbWF0aW9uLWR1cmF0aW9uOjFtcyAhaW1wb3J0YW50XCI7XG5cbiAgICAgICAgRE9NLmV4dGVuZCA9IGZ1bmN0aW9uKCkgIHtcbiAgICAgICAgICAgIC8vIGRlY2xhcmUgdGhlIGZha2UgYW5pbWF0aW9uIG9uIHRoZSBmaXJzdCBET00uZXh0ZW5kIG1ldGhvZCBjYWxsXG4gICAgICAgICAgICBET00uaW1wb3J0U3R5bGVzKFwiQFwiICsgV0VCS0lUX1BSRUZJWCArIFwia2V5ZnJhbWVzIERPTTIwMDEwMDFcIiwgXCJmcm9tIHtvcGFjaXR5Oi45OX0gdG8ge29wYWNpdHk6MX1cIik7XG4gICAgICAgICAgICAvLyByZXN0b3JlIG9yaWdpbmFsIG1ldGhvZCBhbmQgaW52b2tlIGl0XG4gICAgICAgICAgICAoRE9NLmV4dGVuZCA9IGdsb2JhbCRleHRlbmQkJF9leHRlbmQpLmFwcGx5KERPTSwgYXJndW1lbnRzKTtcbiAgICAgICAgfTtcblxuICAgICAgICAvLyB1c2UgY2FwdHVyaW5nIHRvIHN1cHByZXNzIGludGVybmFsIGFuaW1hdGlvbnN0YXJ0IGV2ZW50c1xuICAgICAgICBET0NVTUVOVC5hZGRFdmVudExpc3RlbmVyKFdFQktJVF9QUkVGSVggPyBcIndlYmtpdEFuaW1hdGlvblN0YXJ0XCIgOiBcImFuaW1hdGlvbnN0YXJ0XCIsIGZ1bmN0aW9uKGUpICB7XG4gICAgICAgICAgICBpZiAoZS5hbmltYXRpb25OYW1lID09PSBcIkRPTTIwMDEwMDFcIikge1xuICAgICAgICAgICAgICAgIGdsb2JhbCRleHRlbmQkJGV4dGVuc2lvbnMuZm9yRWFjaChmdW5jdGlvbihleHQpICB7IGV4dChlLnRhcmdldCkgfSk7XG4gICAgICAgICAgICAgICAgLy8gdGhpcyBpcyBhbiBpbnRlcm5hbCBldmVudCAtIHN0b3AgaXQgaW1tZWRpYXRlbHlcbiAgICAgICAgICAgICAgICBlLnN0b3BJbW1lZGlhdGVQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LCB0cnVlKTtcbiAgICB9XG5cbiAgICB2YXIgZ2xvYmFsJGV4dGVuZCQkZGVmYXVsdCA9IGdsb2JhbCRleHRlbmQkJGV4dGVuc2lvbnM7XG5cbiAgICB2YXIgZ2xvYmFsJGZvcm1hdCQkcmVWYXIgPSAvXFx7KFtcXHdcXC1dKylcXH0vZztcblxuICAgIERPTS5mb3JtYXQgPSBmdW5jdGlvbih0bXBsLCB2YXJNYXApIHtcbiAgICAgICAgaWYgKHR5cGVvZiB0bXBsICE9PSBcInN0cmluZ1wiKSB0bXBsID0gU3RyaW5nKHRtcGwpO1xuXG4gICAgICAgIGlmICghdmFyTWFwIHx8IHR5cGVvZiB2YXJNYXAgIT09IFwib2JqZWN0XCIpIHZhck1hcCA9IHt9O1xuXG4gICAgICAgIHJldHVybiB0bXBsLnJlcGxhY2UoZ2xvYmFsJGZvcm1hdCQkcmVWYXIsIGZ1bmN0aW9uKHgsIG5hbWUsIGluZGV4KSAge1xuICAgICAgICAgICAgaWYgKG5hbWUgaW4gdmFyTWFwKSB7XG4gICAgICAgICAgICAgICAgeCA9IHZhck1hcFtuYW1lXTtcblxuICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgeCA9PT0gXCJmdW5jdGlvblwiKSB4ID0geChpbmRleCk7XG5cbiAgICAgICAgICAgICAgICB4ID0gU3RyaW5nKHgpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICByZXR1cm4geDtcbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBnbG9iYWwkZnJhbWUkJHJhZiA9IFdJTkRPVy5yZXF1ZXN0QW5pbWF0aW9uRnJhbWUsXG4gICAgICAgIGdsb2JhbCRmcmFtZSQkY3JhZiA9IFdJTkRPVy5jYW5jZWxBbmltYXRpb25GcmFtZSxcbiAgICAgICAgZ2xvYmFsJGZyYW1lJCRsYXN0VGltZSA9IDA7XG5cbiAgICBpZiAoIShnbG9iYWwkZnJhbWUkJHJhZiAmJiBnbG9iYWwkZnJhbWUkJGNyYWYpKSB7XG4gICAgICAgIFtcIm1zXCIsIFwibW96XCIsIFwid2Via2l0XCIsIFwib1wiXS5mb3JFYWNoKGZ1bmN0aW9uKHByZWZpeCkgIHtcbiAgICAgICAgICAgIGdsb2JhbCRmcmFtZSQkcmFmID0gZ2xvYmFsJGZyYW1lJCRyYWYgfHwgV0lORE9XW3ByZWZpeCArIFwiUmVxdWVzdEFuaW1hdGlvbkZyYW1lXCJdO1xuICAgICAgICAgICAgZ2xvYmFsJGZyYW1lJCRjcmFmID0gZ2xvYmFsJGZyYW1lJCRjcmFmIHx8IFdJTkRPV1twcmVmaXggKyBcIkNhbmNlbEFuaW1hdGlvbkZyYW1lXCJdO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBET00ucmVxdWVzdEZyYW1lID0gZnVuY3Rpb24oY2FsbGJhY2spICB7XG4gICAgICAgIGlmIChnbG9iYWwkZnJhbWUkJHJhZikge1xuICAgICAgICAgICAgcmV0dXJuIGdsb2JhbCRmcmFtZSQkcmFmLmNhbGwoV0lORE9XLCBjYWxsYmFjayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyB1c2UgaWRlYSBmcm9tIEVyaWsgTcO2bGxlcidzIHBvbHlmaWxsOlxuICAgICAgICAgICAgLy8gaHR0cDovL3d3dy5wYXVsaXJpc2guY29tLzIwMTEvcmVxdWVzdGFuaW1hdGlvbmZyYW1lLWZvci1zbWFydC1hbmltYXRpbmcvXG4gICAgICAgICAgICB2YXIgY3VyclRpbWUgPSBEYXRlLm5vdygpO1xuICAgICAgICAgICAgdmFyIHRpbWVUb0NhbGwgPSBNYXRoLm1heCgwLCAxNiAtIChjdXJyVGltZSAtIGdsb2JhbCRmcmFtZSQkbGFzdFRpbWUpKTtcblxuICAgICAgICAgICAgZ2xvYmFsJGZyYW1lJCRsYXN0VGltZSA9IGN1cnJUaW1lICsgdGltZVRvQ2FsbDtcblxuICAgICAgICAgICAgcmV0dXJuIFdJTkRPVy5zZXRUaW1lb3V0KGZ1bmN0aW9uKCkgIHsgY2FsbGJhY2soY3VyclRpbWUgKyB0aW1lVG9DYWxsKSB9LCB0aW1lVG9DYWxsKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBET00uY2FuY2VsRnJhbWUgPSBmdW5jdGlvbihmcmFtZUlkKSAge1xuICAgICAgICBpZiAoZ2xvYmFsJGZyYW1lJCRjcmFmKSB7XG4gICAgICAgICAgICBnbG9iYWwkZnJhbWUkJGNyYWYuY2FsbChXSU5ET1csIGZyYW1lSWQpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgV0lORE9XLmNsZWFyVGltZW91dChmcmFtZUlkKTtcbiAgICAgICAgfVxuICAgIH07XG5cbiAgICBmdW5jdGlvbiBnbG9iYWwkbW9jayQkYXBwbHlFeHRlbnNpb25zKG5vZGUpIHtcbiAgICAgICAgZ2xvYmFsJGV4dGVuZCQkZGVmYXVsdC5mb3JFYWNoKGZ1bmN0aW9uKGV4dCkgIHsgZXh0KG5vZGUsIHRydWUpIH0pO1xuXG4gICAgICAgIHV0aWwkaW5kZXgkJGRlZmF1bHQuZWFjaC5jYWxsKG5vZGUuY2hpbGRyZW4sIGdsb2JhbCRtb2NrJCRhcHBseUV4dGVuc2lvbnMpO1xuICAgIH1cblxuICAgIERPTS5tb2NrID0gZnVuY3Rpb24oY29udGVudCwgdmFyTWFwKSB7XG4gICAgICAgIGlmICghY29udGVudCkgcmV0dXJuIG5ldyAkTnVsbEVsZW1lbnQoKTtcblxuICAgICAgICB2YXIgcmVzdWx0ID0gRE9NLmNyZWF0ZShjb250ZW50LCB2YXJNYXApO1xuXG4gICAgICAgIGdsb2JhbCRtb2NrJCRhcHBseUV4dGVuc2lvbnMocmVzdWx0WzBdKTtcblxuICAgICAgICByZXR1cm4gcmVzdWx0O1xuICAgIH07XG5cbiAgICB2YXIgZXhwb3J0cyQkX0RPTSA9IFdJTkRPVy5ET007XG5cbiAgICBET00ubm9Db25mbGljdCA9IGZ1bmN0aW9uKCkge1xuICAgICAgICBpZiAoV0lORE9XLkRPTSA9PT0gRE9NKSB7XG4gICAgICAgICAgICBXSU5ET1cuRE9NID0gZXhwb3J0cyQkX0RPTTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBET007XG4gICAgfTtcblxuICAgIFdJTkRPVy5ET00gPSBET007XG59KSgpO1xuIiwiLyoqXG4gKiBiZXR0ZXItZGV0YWlscy1wb2x5ZmlsbDogPGRldGFpbHM+IHBvbHlmaWxsIGZvciBiZXR0ZXItZG9tXG4gKiBAdmVyc2lvbiAyLjEuMCBUdWUsIDE2IERlYyAyMDE0IDE3OjM3OjIzIEdNVFxuICogQGxpbmsgaHR0cHM6Ly9naXRodWIuY29tL2NoZW1lcmlzdWsvYmV0dGVyLWRldGFpbHMtcG9seWZpbGxcbiAqIEBjb3B5cmlnaHQgMjAxNCBNYWtzaW0gQ2hlbWVyaXN1a1xuICogQGxpY2Vuc2UgTUlUXG4gKi9cbihmdW5jdGlvbihET00sIFZLX1NQQUNFLCBWS19FTlRFUikge1xuICAgIFwidXNlIHN0cmljdFwiO1xuXG4gICAgLy8gYWRkIEFSSUEgYXR0cmlidXRlcyBmb3IgQUxMIGJyb3dzZXJzIGJlY2F1c2UgY3VycmVudFxuICAgIC8vIG5hdGl2ZSBpbXBsZW1lbnRhaW9ucyBhcmUgd2VhazpcbiAgICAvLyBodHRwczovL2J1Z3Mud2Via2l0Lm9yZy9zaG93X2J1Zy5jZ2k/aWQ9MTMxMTExXG5cbiAgICB2YXIgaGFzTmF0aXZlU3VwcG9ydCA9IHR5cGVvZiBET00uY3JlYXRlKFwiZGV0YWlsc1wiKS5nZXQoXCJvcGVuXCIpID09PSBcImJvb2xlYW5cIjtcbiAgICBpZiAoIGhhc05hdGl2ZVN1cHBvcnQgKSB7IHJldHVybiA7IH1cblxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmRldGFpbHNQb2x5ZmlsbGVkID0gdHJ1ZTtcblxuICAgIERPTS5leHRlbmQoXCJkZXRhaWxzXCIsIHtcbiAgICAgICAgY29uc3RydWN0b3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gaHR0cDovL3d3dy53My5vcmcvaHRtbC93Zy9kcmFmdHMvaHRtbC9tYXN0ZXIvaW50ZXJhY3RpdmUtZWxlbWVudHMuaHRtbCN0aGUtZGV0YWlscy1lbGVtZW50XG4gICAgICAgICAgICB0aGlzLnNldChcInJvbGVcIiwgXCJncm91cFwiKVxuICAgICAgICAgICAgICAgIC5vbihcInRvZ2dsZVwiLCBbXCJzdG9wUHJvcGFnYXRpb25cIl0sIHRoaXMuX2NoYW5nZU9wZW4uYmluZCh0aGlzKSk7XG5cbiAgICAgICAgICAgIHZhciBmaXJzdFN1bW1hcnkgPSB0aGlzLmNoaWxkcmVuKFwic3VtbWFyeVwiKVswXTtcbiAgICAgICAgICAgIC8vIElmIHRoZXJlIGlzIG5vIGNoaWxkIHN1bW1hcnkgZWxlbWVudCwgdGhlIHVzZXIgYWdlbnRcbiAgICAgICAgICAgIC8vIHNob3VsZCBwcm92aWRlIGl0cyBvd24gbGVnZW5kIChlLmcuIFwiRGV0YWlsc1wiKVxuICAgICAgICAgICAgaWYgKCFmaXJzdFN1bW1hcnkpIGZpcnN0U3VtbWFyeSA9IERPTS5jcmVhdGUoXCJzdW1tYXJ5PmBEZXRhaWxzYFwiKTtcbiAgICAgICAgICAgIC8vIG1ha2UgdGhlIGZpcnN0IDxzdW1tYXJ5PiBhbHdheXMgdG8gYmUgdGhlIGZpcnN0IGNoaWxkXG4gICAgICAgICAgICBpZiAodGhpcy5jaGlsZCgwKSAhPT0gZmlyc3RTdW1tYXJ5KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5wcmVwZW5kKGZpcnN0U3VtbWFyeSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICAvLyBodHRwOi8vd3d3LnczLm9yZy9odG1sL3dnL2RyYWZ0cy9odG1sL21hc3Rlci9pbnRlcmFjdGl2ZS1lbGVtZW50cy5odG1sI3RoZS1zdW1tYXJ5LWVsZW1lbnRcbiAgICAgICAgICAgIGZpcnN0U3VtbWFyeS5zZXQoXCJyb2xlXCIsIFwiYnV0dG9uXCIpO1xuICAgICAgICAgICAgLyogaXN0YW5idWwgaWdub3JlIGlmICovXG4gICAgICAgICAgICBpZiAoIWhhc05hdGl2ZVN1cHBvcnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmRlZmluZShcIm9wZW5cIiwgdGhpcy5fZ2V0T3BlbiwgdGhpcy5fc2V0T3Blbik7XG5cbiAgICAgICAgICAgICAgICB0aGlzLl9pbml0U3VtbWFyeShmaXJzdFN1bW1hcnkpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB0aGlzLl9jaGFuZ2VPcGVuKCk7XG4gICAgICAgIH0sXG4gICAgICAgIF9pbml0U3VtbWFyeTogZnVuY3Rpb24oc3VtbWFyeSkge1xuICAgICAgICAgICAgc3VtbWFyeVxuICAgICAgICAgICAgICAgIC5zZXQoXCJ0YWJpbmRleFwiLCAwKVxuICAgICAgICAgICAgICAgIC5vbihcImtleWRvd25cIiwgW1wid2hpY2hcIl0sIHRoaXMuX3RvZ2dsZU9wZW4uYmluZCh0aGlzKSlcbiAgICAgICAgICAgICAgICAub24oXCJjbGlja1wiLCB0aGlzLl90b2dnbGVPcGVuLmJpbmQodGhpcykpO1xuICAgICAgICB9LFxuICAgICAgICBfY2hhbmdlT3BlbjogZnVuY3Rpb24oc3RvcCkge1xuICAgICAgICAgICAgdGhpcy5zZXQoXCJhcmlhLWV4cGFuZGVkXCIsIHRoaXMuZ2V0KFwib3BlblwiKSk7XG5cbiAgICAgICAgICAgIGlmIChzdG9wKSBzdG9wKCk7IC8vIHRvZ2dsZSBldmVudCBzaG91bGQgbm90IGJ1YmJsZVxuICAgICAgICB9LFxuICAgICAgICBfZ2V0T3BlbjogZnVuY3Rpb24oYXR0clZhbHVlKSB7XG4gICAgICAgICAgICBhdHRyVmFsdWUgPSBTdHJpbmcoYXR0clZhbHVlKS50b0xvd2VyQ2FzZSgpO1xuXG4gICAgICAgICAgICByZXR1cm4gYXR0clZhbHVlID09PSBcIlwiIHx8IGF0dHJWYWx1ZSA9PT0gXCJvcGVuXCI7XG4gICAgICAgIH0sXG4gICAgICAgIF9zZXRPcGVuOiBmdW5jdGlvbihwcm9wVmFsdWUpIHt2YXIgdGhpcyQwID0gdGhpcztcbiAgICAgICAgICAgIHZhciBjdXJyZW50VmFsdWUgPSB0aGlzLmdldChcIm9wZW5cIik7XG5cbiAgICAgICAgICAgIHByb3BWYWx1ZSA9ICEhcHJvcFZhbHVlO1xuXG4gICAgICAgICAgICBpZiAoY3VycmVudFZhbHVlICE9PSBwcm9wVmFsdWUpIHtcbiAgICAgICAgICAgICAgICAvLyBoYXZlIHRvIHVzZSBzZXRUaW1lb3V0IGJlY2F1c2UgdGhlIGV2ZW50IHNob3VsZFxuICAgICAgICAgICAgICAgIC8vIGZpcmUgQUZURVIgdGhlIGF0dHJpYnV0ZSB3YXMgdXBkYXRlZFxuICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSAgeyB0aGlzJDAuZmlyZShcInRvZ2dsZVwiKSB9LCAwKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgcmV0dXJuIHByb3BWYWx1ZSA/IFwiXCIgOiBudWxsO1xuICAgICAgICB9LFxuICAgICAgICBfdG9nZ2xlT3BlbjogZnVuY3Rpb24oa2V5KSB7XG4gICAgICAgICAgICBpZiAoIWtleSB8fCBrZXkgPT09IFZLX1NQQUNFIHx8IGtleSA9PT0gVktfRU5URVIpIHtcbiAgICAgICAgICAgICAgICB0aGlzLnNldChcIm9wZW5cIiwgIXRoaXMuZ2V0KFwib3BlblwiKSk7XG4gICAgICAgICAgICAgICAgLy8gbmVlZCB0byBwcmV2ZW50IGRlZmF1bHQsIGJlY2F1c2VcbiAgICAgICAgICAgICAgICAvLyB0aGUgZW50ZXIga2V5IHVzdWFsbHkgc3VibWl0cyBhIGZvcm1cbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9KTtcbn0od2luZG93LkRPTSwgMzIsIDEzKSk7XG5cbi8vIERPTS5pbXBvcnRTdHlsZXMoXCJAbWVkaWEgYWxsXCIsIFwic3VtbWFyeTpmaXJzdC1jaGlsZH4qe2Rpc3BsYXk6bm9uZX1kZXRhaWxzW29wZW5dPip7ZGlzcGxheTpibG9ja31kZXRhaWxzPnN1bW1hcnk6Zmlyc3QtY2hpbGR7ZGlzcGxheTpibG9ja31kZXRhaWxzOmJlZm9yZXtjb250ZW50OidcXFxcMjVCQSc7Zm9udC1mYW1pbHk6c2VyaWY7Zm9udC1zaXplOi43NWVtO21hcmdpbi10b3A6LjI1ZW07bWFyZ2luLWxlZnQ6LjI1ZW07cG9zaXRpb246YWJzb2x1dGV9ZGV0YWlsc1tvcGVuXTpiZWZvcmV7Y29udGVudDonXFxcXDI1QkMnfXN1bW1hcnk6Zmlyc3QtY2hpbGR7dGV4dC1pbmRlbnQ6MS4yNWVtfWRldGFpbHM6OmJlZm9yZXtjb250ZW50OicnO3dpZHRoOjA7aGVpZ2h0OjA7Ym9yZGVyOnNvbGlkIHRyYW5zcGFyZW50O2JvcmRlci1sZWZ0LWNvbG9yOmluaGVyaXQ7Ym9yZGVyLXdpZHRoOi4yNWVtIC41ZW07bWFyZ2luLXRvcDouNzVlbTttYXJnaW4tbGVmdDouNWVtOy13ZWJraXQtdHJhbnNmb3JtOnJvdGF0ZSgwZGVnKSBzY2FsZSgxLjUpOy1tcy10cmFuc2Zvcm06cm90YXRlKDBkZWcpIHNjYWxlKDEuNSk7dHJhbnNmb3JtOnJvdGF0ZSgwZGVnKSBzY2FsZSgxLjUpOy13ZWJraXQtdHJhbnNmb3JtLW9yaWdpbjoyNSUgNTAlOy1tcy10cmFuc2Zvcm0tb3JpZ2luOjI1JSA1MCU7dHJhbnNmb3JtLW9yaWdpbjoyNSUgNTAlOy13ZWJraXQtdHJhbnNpdGlvbjotd2Via2l0LXRyYW5zZm9ybSAuMTVzIGVhc2Utb3V0O3RyYW5zaXRpb246dHJhbnNmb3JtIC4xNXMgZWFzZS1vdXR9ZGV0YWlsc1tvcGVuXTo6YmVmb3Jle2NvbnRlbnQ6Jyc7LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDkwZGVnKSBzY2FsZSgxLjUpOy1tcy10cmFuc2Zvcm06cm90YXRlKDkwZGVnKSBzY2FsZSgxLjUpO3RyYW5zZm9ybTpyb3RhdGUoOTBkZWcpIHNjYWxlKDEuNSl9c3VtbWFyeTo6LXdlYmtpdC1kZXRhaWxzLW1hcmtlcntkaXNwbGF5Om5vbmV9XCIpO1xuLy8gRE9NLmltcG9ydFN0eWxlcyhcIkBtZWRpYSBhbGxcIiwgYGh0bWxbZGF0YS1kZXRhaWxzLXBvbHlmaWxsZWQ9XCJ0cnVlXCJdIHN1bW1hcnk6Zmlyc3QtY2hpbGR+KntkaXNwbGF5Om5vbmV9aHRtbFtkYXRhLWRldGFpbHMtcG9seWZpbGxlZD1cInRydWVcIl0gZGV0YWlsc1tvcGVuXT4qe2Rpc3BsYXk6YmxvY2t9IGh0bWxbZGF0YS1kZXRhaWxzLXBvbHlmaWxsZWQ9XCJ0cnVlXCJdIGRldGFpbHM+c3VtbWFyeTpmaXJzdC1jaGlsZHtkaXNwbGF5OmJsb2NrfWh0bWxbZGF0YS1kZXRhaWxzLXBvbHlmaWxsZWQ9XCJ0cnVlXCJdIGRldGFpbHM6YmVmb3Jle2NvbnRlbnQ6J1xcXFwyNUJBJztmb250LWZhbWlseTpzZXJpZjtmb250LXNpemU6Ljc1ZW07bWFyZ2luLXRvcDouMjVlbTttYXJnaW4tbGVmdDouMjVlbTtwb3NpdGlvbjphYnNvbHV0ZX1odG1sW2RhdGEtZGV0YWlscy1wb2x5ZmlsbGVkPVwidHJ1ZVwiXSBkZXRhaWxzW29wZW5dOmJlZm9yZXtjb250ZW50OidcXFxcMjVCQyd9aHRtbFtkYXRhLWRldGFpbHMtcG9seWZpbGxlZD1cInRydWVcIl0gc3VtbWFyeTpmaXJzdC1jaGlsZHt0ZXh0LWluZGVudDoxLjI1ZW19aHRtbFtkYXRhLWRldGFpbHMtcG9seWZpbGxlZD1cInRydWVcIl0gZGV0YWlsczo6YmVmb3Jle2NvbnRlbnQ6Jyc7d2lkdGg6MDtoZWlnaHQ6MDtib3JkZXI6c29saWQgdHJhbnNwYXJlbnQ7Ym9yZGVyLWxlZnQtY29sb3I6aW5oZXJpdDtib3JkZXItd2lkdGg6LjI1ZW0gLjVlbTttYXJnaW4tdG9wOi43NWVtO21hcmdpbi1sZWZ0Oi41ZW07LXdlYmtpdC10cmFuc2Zvcm06cm90YXRlKDBkZWcpIHNjYWxlKDEuNSk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoMGRlZykgc2NhbGUoMS41KTt0cmFuc2Zvcm06cm90YXRlKDBkZWcpIHNjYWxlKDEuNSk7LXdlYmtpdC10cmFuc2Zvcm0tb3JpZ2luOjI1JSA1MCU7LW1zLXRyYW5zZm9ybS1vcmlnaW46MjUlIDUwJTt0cmFuc2Zvcm0tb3JpZ2luOjI1JSA1MCU7LXdlYmtpdC10cmFuc2l0aW9uOi13ZWJraXQtdHJhbnNmb3JtIC4xNXMgZWFzZS1vdXQ7dHJhbnNpdGlvbjp0cmFuc2Zvcm0gLjE1cyBlYXNlLW91dH1odG1sW2RhdGEtZGV0YWlscy1wb2x5ZmlsbGVkPVwidHJ1ZVwiXSBkZXRhaWxzW29wZW5dOjpiZWZvcmV7Y29udGVudDonJzstd2Via2l0LXRyYW5zZm9ybTpyb3RhdGUoOTBkZWcpIHNjYWxlKDEuNSk7LW1zLXRyYW5zZm9ybTpyb3RhdGUoOTBkZWcpIHNjYWxlKDEuNSk7dHJhbnNmb3JtOnJvdGF0ZSg5MGRlZykgc2NhbGUoMS41KX1odG1sW2RhdGEtZGV0YWlscy1wb2x5ZmlsbGVkPVwidHJ1ZVwiXSBzdW1tYXJ5Ojotd2Via2l0LWRldGFpbHMtbWFya2Vye2Rpc3BsYXk6bm9uZX1gKTtcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAvLyB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIC8vIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgLy8gSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgLy8gICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgLy8gICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgLy8gICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAvLyAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gIC8vICAgICAgIH0sIDUwKTtcbiAgLy8gICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gIC8vICAgICAgIH0sIDUwMCk7XG5cbiAgLy8gICAgIH1cbiAgLy8gfVxuXG4gIEhULnJlbmV3X2F1dGggPSBmdW5jdGlvbihlbnRpdHlJRCwgc291cmNlPSdpbWFnZScpIHtcbiAgICBpZiAoIEhULl9fcmVuZXdpbmcgKSB7IHJldHVybiA7IH1cbiAgICBIVC5fX3JlbmV3aW5nID0gdHJ1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHZhciByZWF1dGhfdXJsID0gYGh0dHBzOi8vJHtIVC5zZXJ2aWNlX2RvbWFpbn0vU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9JHtlbnRpdHlJRH0mdGFyZ2V0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKX1gO1xuICAgICAgdmFyIHJldHZhbCA9IHdpbmRvdy5jb25maXJtKGBXZSdyZSBoYXZpbmcgYSBwcm9ibGVtIHdpdGggeW91ciBzZXNzaW9uOyBzZWxlY3QgT0sgdG8gbG9nIGluIGFnYWluLmApO1xuICAgICAgaWYgKCByZXR2YWwgKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcmVhdXRoX3VybDtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzID0gSFQuYW5hbHl0aWNzIHx8IHt9O1xuICBIVC5hbmFseXRpY3MubG9nQWN0aW9uID0gZnVuY3Rpb24oaHJlZiwgdHJpZ2dlcikge1xuICAgIGlmICggaHJlZiA9PT0gdW5kZWZpbmVkICkgeyBocmVmID0gbG9jYXRpb24uaHJlZiA7IH1cbiAgICB2YXIgZGVsaW0gPSBocmVmLmluZGV4T2YoJzsnKSA+IC0xID8gJzsnIDogJyYnO1xuICAgIGlmICggdHJpZ2dlciA9PSBudWxsICkgeyB0cmlnZ2VyID0gJy0nOyB9XG4gICAgaHJlZiArPSBkZWxpbSArICdhPScgKyB0cmlnZ2VyO1xuICAgIC8vICQuZ2V0KGhyZWYpO1xuICAgICQuYWpheChocmVmLCBcbiAgICB7XG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24oeGhyLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIGVudGl0eUlEID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCd4LWhhdGhpdHJ1c3QtcmVuZXcnKTtcbiAgICAgICAgaWYgKCBlbnRpdHlJRCApIHtcbiAgICAgICAgICBIVC5yZW5ld19hdXRoKGVudGl0eUlELCAnbG9nQWN0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cblxuICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnYVtkYXRhLXRyYWNraW5nLWNhdGVnb3J5PVwib3V0TGlua3NcIl0nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIHZhciB0cmlnZ2VyID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1hY3Rpb24nKTtcbiAgICAvLyB2YXIgbGFiZWwgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWxhYmVsJyk7XG4gICAgLy8gaWYgKCBsYWJlbCApIHsgdHJpZ2dlciArPSAnOicgKyBsYWJlbDsgfVxuICAgIHZhciB0cmlnZ2VyID0gJ291dCcgKyAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICBIVC5hbmFseXRpY3MubG9nQWN0aW9uKHVuZGVmaW5lZCwgdHJpZ2dlcik7XG4gIH0pXG5cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIHZhciBNT05USFMgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsXG4gICAgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xuXG4gIHZhciAkZW1lcmdlbmN5X2FjY2VzcyA9ICQoXCIjYWNjZXNzLWVtZXJnZW5jeS1hY2Nlc3NcIik7XG5cbiAgdmFyIGRlbHRhID0gNSAqIDYwICogMTAwMDtcbiAgdmFyIGxhc3Rfc2Vjb25kcztcbiAgdmFyIHRvZ2dsZV9yZW5ld19saW5rID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmICggbm93ID49IGRhdGUuZ2V0VGltZSgpICkge1xuICAgICAgdmFyICRsaW5rID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcImFbZGlzYWJsZWRdXCIpO1xuICAgICAgJGxpbmsuYXR0cihcImRpc2FibGVkXCIsIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhIEhUIHx8ICEgSFQucGFyYW1zIHx8ICEgSFQucGFyYW1zLmlkICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIGRhdGEgPSAkLmNvb2tpZSgnSFRleHBpcmF0aW9uJywgdW5kZWZpbmVkLCB7IGpzb246IHRydWUgfSk7XG4gICAgaWYgKCAhIGRhdGEgKSB7IHJldHVybiA7IH1cbiAgICB2YXIgc2Vjb25kcyA9IGRhdGFbSFQucGFyYW1zLmlkXTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWRVwiLCBzZWNvbmRzLCBsYXN0X3NlY29uZHMpO1xuICAgIGlmICggc2Vjb25kcyA9PSAtMSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwIGFcIikuY2xvbmUoKTtcbiAgICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwXCIpLnRleHQoXCJZb3VyIGFjY2VzcyBoYXMgZXhwaXJlZCBhbmQgY2Fubm90IGJlIHJlbmV3ZWQuIFJlbG9hZCB0aGUgcGFnZSBvciB0cnkgYWdhaW4gbGF0ZXIuIEFjY2VzcyBoYXMgYmVlbiBwcm92aWRlZCB0aHJvdWdoIHRoZSBcIik7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS5hcHBlbmQoJGxpbmspO1xuICAgICAgdmFyICRhY3Rpb24gPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmFsZXJ0LS1lbWVyZ2VuY3ktYWNjZXNzLS1vcHRpb25zIGFcIik7XG4gICAgICAkYWN0aW9uLmF0dHIoJ2hyZWYnLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAkYWN0aW9uLnRleHQoJ1JlbG9hZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIHNlY29uZHMgPiBsYXN0X3NlY29uZHMgKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAgIGxhc3Rfc2Vjb25kcyA9IHNlY29uZHM7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHZhciB0aW1lMm1lc3NhZ2UgPSBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzZWNvbmRzICogMTAwMCk7XG4gICAgdmFyIGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xuICAgIHZhciBhbXBtID0gJ0FNJztcbiAgICBpZiAoIGhvdXJzID4gMTIgKSB7IGhvdXJzIC09IDEyOyBhbXBtID0gJ1BNJzsgfVxuICAgIGlmICggaG91cnMgPT0gMTIgKXsgYW1wbSA9ICdQTSc7IH1cbiAgICB2YXIgbWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgIGlmICggbWludXRlcyA8IDEwICkgeyBtaW51dGVzID0gYDAke21pbnV0ZXN9YDsgfVxuICAgIHZhciBtZXNzYWdlID0gYCR7aG91cnN9OiR7bWludXRlc30ke2FtcG19ICR7TU9OVEhTW2RhdGUuZ2V0TW9udGgoKV19ICR7ZGF0ZS5nZXREYXRlKCl9YDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxuXG4gIGlmICggJGVtZXJnZW5jeV9hY2Nlc3MubGVuZ3RoICkge1xuICAgIHZhciBleHBpcmF0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlcycpO1xuICAgIHZhciBzZWNvbmRzID0gcGFyc2VJbnQoJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlc1NlY29uZHMnKSwgMTApO1xuICAgIHZhciBncmFudGVkID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzR3JhbnRlZCcpO1xuXG4gICAgdmFyIG5vdyA9IERhdGUubm93KCkgLyAxMDAwO1xuICAgIHZhciBtZXNzYWdlID0gdGltZTJtZXNzYWdlKHNlY29uZHMpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCIuZXhwaXJlcy1kaXNwbGF5XCIpLnRleHQobWVzc2FnZSk7XG4gICAgJGVtZXJnZW5jeV9hY2Nlc3MuZ2V0KDApLmRhdGFzZXQuaW5pdGlhbGl6ZWQgPSAndHJ1ZSdcblxuICAgIGlmICggZ3JhbnRlZCApIHtcbiAgICAgIC8vIHNldCB1cCBhIHdhdGNoIGZvciB0aGUgZXhwaXJhdGlvbiB0aW1lXG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHRvZ2dsZV9yZW5ld19saW5rKGRhdGUpO1xuICAgICAgICBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wKCk7XG4gICAgICB9LCA1MDApO1xuICAgIH1cbiAgfVxuXG4gIGlmICgkKCcjYWNjZXNzQmFubmVySUQnKS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3VwcHJlc3MgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ3N1cGFjY2JhbicpO1xuICAgICAgaWYgKHN1cHByZXNzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRlYnVnID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdodGRldicpO1xuICAgICAgdmFyIGlkaGFzaCA9ICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCB1bmRlZmluZWQsIHtqc29uIDogdHJ1ZX0pO1xuICAgICAgdmFyIHVybCA9ICQudXJsKCk7IC8vIHBhcnNlIHRoZSBjdXJyZW50IHBhZ2UgVVJMXG4gICAgICB2YXIgY3VycmlkID0gdXJsLnBhcmFtKCdpZCcpO1xuICAgICAgaWYgKGlkaGFzaCA9PSBudWxsKSB7XG4gICAgICAgICAgaWRoYXNoID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGlkIGluIGlkaGFzaCkge1xuICAgICAgICAgIGlmIChpZGhhc2guaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoaWRzLmluZGV4T2YoY3VycmlkKSA8IDApIHx8IGRlYnVnKSB7XG4gICAgICAgICAgaWRoYXNoW2N1cnJpZF0gPSAxO1xuICAgICAgICAgIC8vIHNlc3Npb24gY29va2llXG4gICAgICAgICAgJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIGlkaGFzaCwgeyBqc29uIDogdHJ1ZSwgcGF0aDogJy8nLCBkb21haW46ICcuaGF0aGl0cnVzdC5vcmcnIH0pO1xuXG4gICAgICAgICAgZnVuY3Rpb24gc2hvd0FsZXJ0KCkge1xuICAgICAgICAgICAgICB2YXIgaHRtbCA9ICQoJyNhY2Nlc3NCYW5uZXJJRCcpLmh0bWwoKTtcbiAgICAgICAgICAgICAgdmFyICRhbGVydCA9IGJvb3Rib3guZGlhbG9nKGh0bWwsIFt7IGxhYmVsOiBcIk9LXCIsIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIgfV0sIHsgaGVhZGVyIDogJ1NwZWNpYWwgYWNjZXNzJywgcm9sZTogJ2FsZXJ0ZGlhbG9nJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoc2hvd0FsZXJ0LCAzMDAwLCB0cnVlKTtcbiAgICAgIH1cbiAgfVxuXG4gICQoXCJkZXRhaWxzLmRldGFpbHMtLWFsZXJ0XCIpLm9uKCd0b2dnbGUnLCBmdW5jdGlvbihldmVudCkge1xuICAgIHZhciBkZXRhaWwgPSBldmVudC50YXJnZXQ7XG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgcHJlZnMucHQgPSBwcmVmcy5wdCB8fCB7fTtcbiAgICBwcmVmcy5wdC5hbGVydHMgPSBwcmVmcy5wdC5hbGVydHMgfHwge307XG4gICAgcHJlZnMucHQuYWxlcnRzW2RldGFpbC5nZXRBdHRyaWJ1dGUoJ2lkJyldID0gZGV0YWlsLm9wZW4gPyAnb3BlbicgOiAnY2xvc2VkJztcbiAgICBIVC5wcmVmcy5zZXQocHJlZnMpO1xuICB9KVxuXG5cbn0pIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4yLjIwMTcxMjEwXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmIChcblx0ICAgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TXG5cdCYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSlcbikge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgYmUgZW1wdHkuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0cmV0dXJuIH5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4gKyBcIlwiKTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmICghfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikpIHtcblx0XHRcdHRoaXMucHVzaCh0b2tlbik7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0XHQsIGluZGV4XG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0d2hpbGUgKH5pbmRleCkge1xuXHRcdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHR2YXIgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodG9rZW4gKyBcIlwiKTtcblx0aWYgKH5pbmRleCkge1xuXHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxLCByZXBsYWNlbWVudF90b2tlbik7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn1cbmNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbn07XG5cbmlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcblx0dmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuXHRcdCAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcblx0XHQsIGVudW1lcmFibGU6IHRydWVcblx0XHQsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHR9O1xuXHR0cnkge1xuXHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0fSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG5cdFx0Ly8gYWRkaW5nIHVuZGVmaW5lZCB0byBmaWdodCB0aGlzIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9pc3N1ZXMvMzZcblx0XHQvLyBtb2Rlcm5pZSBJRTgtTVNXNyBtYWNoaW5lIGhhcyBJRTggOC4wLjYwMDEuMTg3MDIgYW5kIGlzIGFmZmVjdGVkXG5cdFx0aWYgKGV4Lm51bWJlciA9PT0gdW5kZWZpbmVkIHx8IGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcblx0XHRcdGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcblx0XHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0XHR9XG5cdH1cbn0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuXHRlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xufVxuXG59KHNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdC8vIHJlcGxhY2UoKSBwb2x5ZmlsbFxuXHRpZiAoIShcInJlcGxhY2VcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKS5jbGFzc0xpc3QpKSB7XG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdG9rZW5zID0gdGhpcy50b1N0cmluZygpLnNwbGl0KFwiIFwiKVxuXHRcdFx0XHQsIGluZGV4ID0gdG9rZW5zLmluZGV4T2YodG9rZW4gKyBcIlwiKVxuXHRcdFx0O1xuXHRcdFx0aWYgKH5pbmRleCkge1xuXHRcdFx0XHR0b2tlbnMgPSB0b2tlbnMuc2xpY2UoaW5kZXgpO1xuXHRcdFx0XHR0aGlzLnJlbW92ZS5hcHBseSh0aGlzLCB0b2tlbnMpO1xuXHRcdFx0XHR0aGlzLmFkZChyZXBsYWNlbWVudF90b2tlbik7XG5cdFx0XHRcdHRoaXMuYWRkLmFwcGx5KHRoaXMsIHRva2Vucy5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gJ19fTkVXX18nOyAvLyBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG4gICAgICAgICR1bC5wYXJlbnRzKFwiZGl2XCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcblxuICAgICAgICAvLyAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX0gdG8geW91ciBsaXN0LmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI1BUYWRkSXRlbUJ0bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuXG4gIC8vIGZvcmNlIENSTVMgdXNlcnMgdG8gYSBmaXhlZCBpbWFnZSBzaXplXG4gIEhULmZvcmNlX3NpemUgPSAyMDA7XG5cbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xudmFyIHBob3RvY29waWVyX21lc3NhZ2UgPSAnVGhlIGNvcHlyaWdodCBsYXcgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgKFRpdGxlIDE3LCBVLlMuIENvZGUpIGdvdmVybnMgdGhlIG1ha2luZyBvZiByZXByb2R1Y3Rpb25zIG9mIGNvcHlyaWdodGVkIG1hdGVyaWFsLiBVbmRlciBjZXJ0YWluIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBsYXcsIGxpYnJhcmllcyBhbmQgYXJjaGl2ZXMgYXJlIGF1dGhvcml6ZWQgdG8gZnVybmlzaCBhIHJlcHJvZHVjdGlvbi4gT25lIG9mIHRoZXNlIHNwZWNpZmljIGNvbmRpdGlvbnMgaXMgdGhhdCB0aGUgcmVwcm9kdWN0aW9uIGlzIG5vdCB0byBiZSDigJx1c2VkIGZvciBhbnkgcHVycG9zZSBvdGhlciB0aGFuIHByaXZhdGUgc3R1ZHksIHNjaG9sYXJzaGlwLCBvciByZXNlYXJjaC7igJ0gSWYgYSB1c2VyIG1ha2VzIGEgcmVxdWVzdCBmb3IsIG9yIGxhdGVyIHVzZXMsIGEgcmVwcm9kdWN0aW9uIGZvciBwdXJwb3NlcyBpbiBleGNlc3Mgb2Yg4oCcZmFpciB1c2Us4oCdIHRoYXQgdXNlciBtYXkgYmUgbGlhYmxlIGZvciBjb3B5cmlnaHQgaW5mcmluZ2VtZW50Lic7XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBleHBsYWluUGRmQWNjZXNzOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBodG1sID0gJChcIiNub0Rvd25sb2FkQWNjZXNzXCIpLmh0bWwoKTtcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgne0RPV05MT0FEX0xJTkt9JywgJCh0aGlzKS5hdHRyKFwiaHJlZlwiKSk7XG4gICAgICAgIHRoaXMuJGRpYWxvZyA9IGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuc3JjID0gY29uZmlnLnNyYztcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gY29uZmlnLml0ZW1fdGl0bGU7XG4gICAgICAgIHNlbGYuJGNvbmZpZyA9IGNvbmZpZztcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cImluaXRpYWxcIj48cD5TZXR0aW5nIHVwIHRoZSBkb3dubG9hZC4uLjwvZGl2PmAgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJvZmZzY3JlZW5cIiByb2xlPVwic3RhdHVzXCIgYXJpYS1hdG9taWM9XCJ0cnVlXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFRpbWVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5XaGF0IGFmZmVjdHMgdGhlIGRvd25sb2FkIHNwZWVkPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5wYWdlcy5sZW5ndGg7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcyBidG4nLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgICAgICAgICAgICAgaWQ6ICdkb3dubG9hZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi4kc3RhdHVzID0gc2VsZi4kZGlhbG9nLmZpbmQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmICggc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgZGF0YVsnc2VxJ10gPSBzZWxmLiRjb25maWcuc2VsZWN0aW9uLnNlcTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc2VsZi4kY29uZmlnLmRvd25sb2FkRm9ybWF0KSB7XG4gICAgICAgICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgICAgICAgICAgZGF0YVsnZm9ybWF0J10gPSAnaW1hZ2UvanBlZyc7XG4gICAgICAgICAgICAgICAgZGF0YVsndGFyZ2V0X3BwaSddID0gMzAwO1xuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd6aXAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGxhaW50ZXh0LXppcCc6XG4gICAgICAgICAgICAgICAgZGF0YVsnYnVuZGxlX2Zvcm1hdCddID0gJ3ppcCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwbGFpbnRleHQnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd0ZXh0JztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHNlbGYuc3JjLnJlcGxhY2UoLzsvZywgJyYnKSArICcmY2FsbGJhY2s9SFQuZG93bmxvYWRlci5zdGFydERvd25sb2FkTW9uaXRvcicsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIFNUQVJUVVAgTk9UIERFVEVDVEVEXCIpO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nICkgeyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQyOSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKHJlcSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRG93bmxvYWQ6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzdGFydERvd25sb2FkTW9uaXRvcjogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFMUkVBRFkgUE9MTElOR1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucGRmLnByb2dyZXNzX3VybCA9IHByb2dyZXNzX3VybDtcbiAgICAgICAgc2VsZi5wZGYuZG93bmxvYWRfdXJsID0gZG93bmxvYWRfdXJsO1xuICAgICAgICBzZWxmLnBkZi50b3RhbCA9IHRvdGFsO1xuXG4gICAgICAgIHNlbGYuaXNfcnVubmluZyA9IHRydWU7XG4gICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCA9IDA7XG4gICAgICAgIHNlbGYuaSA9IDA7XG5cbiAgICAgICAgc2VsZi50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBzZWxmLmNoZWNrU3RhdHVzKCk7IH0sIDI1MDApO1xuICAgICAgICAvLyBkbyBpdCBvbmNlIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIHNlbGYuY2hlY2tTdGF0dXMoKTtcblxuICAgIH0sXG5cbiAgICBjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5pICs9IDE7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBzZWxmLnBkZi5wcm9ncmVzc191cmwsXG4gICAgICAgICAgICBkYXRhIDogeyB0cyA6IChuZXcgRGF0ZSkuZ2V0VGltZSgpIH0sXG4gICAgICAgICAgICBjYWNoZSA6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHNlbGYudXBkYXRlUHJvZ3Jlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMuZG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICYmIHN0YXR1cy5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVByb2Nlc3NFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFJTEVEOiBcIiwgcmVxLCBcIi9cIiwgdGV4dFN0YXR1cywgXCIvXCIsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MDQgJiYgKHNlbGYuaSA+IDI1IHx8IHNlbGYubnVtX3Byb2Nlc3NlZCA+IDApICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgdXBkYXRlUHJvZ3Jlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdHVzID0geyBkb25lIDogZmFsc2UsIGVycm9yIDogZmFsc2UgfTtcbiAgICAgICAgdmFyIHBlcmNlbnQ7XG5cbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkYXRhLnN0YXR1cztcbiAgICAgICAgaWYgKCBjdXJyZW50ID09ICdFT1QnIHx8IGN1cnJlbnQgPT0gJ0RPTkUnICkge1xuICAgICAgICAgICAgc3RhdHVzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkYXRhLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDAgKiAoIGN1cnJlbnQgLyBzZWxmLnBkZi50b3RhbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLmxhc3RfcGVyY2VudCAhPSBwZXJjZW50ICkge1xuICAgICAgICAgICAgc2VsZi5sYXN0X3BlcmNlbnQgPSBwZXJjZW50O1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSAxMDAgdGltZXMsIHdoaWNoIGFtb3VudHMgdG8gfjEwMCBzZWNvbmRzXG4gICAgICAgIGlmICggc2VsZi5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmlzKFwiOnZpc2libGVcIikgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPlBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmJhclwiKS5jc3MoeyB3aWR0aCA6IHBlcmNlbnQgKyAnJSd9KTtcblxuICAgICAgICBpZiAoIHBlcmNlbnQgPT0gMTAwICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuICAgICAgICAgICAgdmFyIGRvd25sb2FkX2tleSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTWFjIE9TIFgnKSAhPSAtMSA/ICdSRVRVUk4nIDogJ0VOVEVSJztcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5TZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLjwvc3Bhbj48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuYCk7XG5cbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIiBkb3dubG9hZD1cImRvd25sb2FkXCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgaWYgKCAkZG93bmxvYWRfYnRuLmdldCgwKS5kb3dubG9hZCA9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICctJywgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeSA6ICdQVCcsIFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uIDogYFBUIERvd25sb2FkIC0gJHtzZWxmLiRjb25maWcuZG93bmxvYWRGb3JtYXQudG9VcHBlckNhc2UoKX0gLSAke3NlbGYuJGNvbmZpZy50cmFja2luZ0FjdGlvbn1gIFxuICAgICAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCB3aW5kb3cuaGogKSB7IGhqKCd0YWdSZWNvcmRpbmcnLCBbIGBQVCBEb3dubG9hZCAtICR7c2VsZi4kY29uZmlnLmRvd25sb2FkRm9ybWF0LnRvVXBwZXJDYXNlKCl9IC0gJHtzZWxmLiRjb25maWcudHJhY2tpbmdBY3Rpb259YCBdKSB9O1xuXG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxudmFyIGRvd25sb2FkRm9ybTtcbnZhciBkb3dubG9hZEZvcm1hdE9wdGlvbnM7XG52YXIgcmFuZ2VPcHRpb25zO1xudmFyIGRvd25sb2FkSWR4ID0gMDtcblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIGRvd25sb2FkRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmb3JtLWRvd25sb2FkLW1vZHVsZScpO1xuICAgIGlmICggISBkb3dubG9hZEZvcm0gKSB7IHJldHVybiA7IH1cblxuXG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBub24tanF1ZXJ5P1xuICAgIGRvd25sb2FkRm9ybWF0T3B0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFtuYW1lPVwiZG93bmxvYWRfZm9ybWF0XCJdJykpO1xuICAgIHJhbmdlT3B0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XScpKTtcblxuICAgIHZhciBkb3dubG9hZFN1Ym1pdCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuXG4gICAgdmFyIGhhc0Z1bGxQZGZBY2Nlc3MgPSBkb3dubG9hZEZvcm0uZGF0YXNldC5mdWxsUGRmQWNjZXNzID09ICdhbGxvdyc7XG5cbiAgICB2YXIgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIHJhbmdlT3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHJhbmdlT3B0aW9uKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHJhbmdlT3B0aW9uLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0LmRpc2FibGVkID0gISByYW5nZU9wdGlvbi5tYXRjaGVzKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0fj1cIiR7b3B0aW9uLnZhbHVlfVwiXWApO1xuICAgICAgfSlcbiAgICAgIFxuICAgICAgLy8gaWYgKCAhIGhhc0Z1bGxQZGZBY2Nlc3MgKSB7XG4gICAgICAvLyAgIHZhciBjaGVja2VkID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtIVC5yZWFkZXIudmlldy5uYW1lfVwiXSBpbnB1dDpjaGVja2VkYCk7XG4gICAgICAvLyAgIGlmICggISBjaGVja2VkICkge1xuICAgICAgLy8gICAgICAgLy8gY2hlY2sgdGhlIGZpcnN0IG9uZVxuICAgICAgLy8gICAgICAgdmFyIGlucHV0ID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtIVC5yZWFkZXIudmlldy5uYW1lfVwiXSBpbnB1dGApO1xuICAgICAgLy8gICAgICAgaW5wdXQuY2hlY2tlZCA9IHRydWU7XG4gICAgICAvLyAgIH1cbiAgICAgIC8vIH1cblxuICAgICAgdmFyIGN1cnJlbnRfdmlldyA9ICggSFQucmVhZGVyICYmIEhULnJlYWRlci52aWV3ICkgPyAgSFQucmVhZGVyLnZpZXcubmFtZSA6ICdzZWFyY2gnOyAvLyBwaWNrIGEgZGVmYXVsdFxuICAgICAgdmFyIGNoZWNrZWQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcihgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF1bZGF0YS12aWV3LXRhcmdldH49XCIke2N1cnJlbnRfdmlld31cIl0gaW5wdXQ6Y2hlY2tlZGApO1xuICAgICAgaWYgKCAhIGNoZWNrZWQgKSB7XG4gICAgICAgICAgLy8gY2hlY2sgdGhlIGZpcnN0IG9uZVxuICAgICAgICAgIHZhciBpbnB1dCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7Y3VycmVudF92aWV3fVwiXSBpbnB1dGApO1xuICAgICAgICAgIGlmICggaW5wdXQgKSB7IGlucHV0LmNoZWNrZWQgPSB0cnVlOyB9XG4gICAgICB9XG5cbiAgICB9XG4gICAgZG93bmxvYWRGb3JtYXRPcHRpb25zLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnModGhpcyk7XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByYW5nZU9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihkaXYpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmb3JtYXRPcHRpb24pIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRPcHRpb24uZGlzYWJsZWQgPSAhICggZGl2LmRhdGFzZXQuZG93bmxvYWRGb3JtYXRUYXJnZXQuaW5kZXhPZihmb3JtYXRPcHRpb24udmFsdWUpID4gLTEgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIudXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvcm1hdE9wdGlvbiA9IGRvd25sb2FkRm9ybWF0T3B0aW9ucy5maW5kKGlucHV0ID0+IGlucHV0LmNoZWNrZWQpO1xuICAgICAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyhmb3JtYXRPcHRpb24pO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgdG8gUERGXG4gICAgdmFyIHBkZkZvcm1hdE9wdGlvbiA9IGRvd25sb2FkRm9ybWF0T3B0aW9ucy5maW5kKGlucHV0ID0+IGlucHV0LnZhbHVlID09ICdwZGYnKTtcbiAgICBwZGZGb3JtYXRPcHRpb24uY2hlY2tlZCA9IHRydWU7XG4gICAgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMocGRmRm9ybWF0T3B0aW9uKTtcblxuICAgIHZhciB0dW5uZWxGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3R1bm5lbC1kb3dubG9hZC1tb2R1bGUnKTtcblxuICAgIGRvd25sb2FkRm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJkb3dubG9hZF9mb3JtYXRcIl06Y2hlY2tlZCcpO1xuICAgICAgICB2YXIgcmFuZ2VPcHRpb24gPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInJhbmdlXCJdOmNoZWNrZWQ6bm90KDpkaXNhYmxlZCknKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlO1xuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGlmICggISByYW5nZU9wdGlvbiApIHtcbiAgICAgICAgICAgIC8vIG5vIHZhbGlkIHJhbmdlIG9wdGlvbiB3YXMgY2hvc2VuXG4gICAgICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgYSB2YWxpZCByYW5nZSBmb3IgdGhpcyBkb3dubG9hZCBmb3JtYXQuXCIpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY3Rpb24gPSB0dW5uZWxGb3JtLmRhdGFzZXQuYWN0aW9uVGVtcGxhdGUgKyAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAncGxhaW50ZXh0LXppcCcgPyAncGxhaW50ZXh0JyA6IGZvcm1hdE9wdGlvbi52YWx1ZSApO1xuXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSB7IHBhZ2VzOiBbXSB9O1xuICAgICAgICBpZiAoIHJhbmdlT3B0aW9uLnZhbHVlID09ICdzZWxlY3RlZC1wYWdlcycgKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24ucGFnZXMgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uaXNTZWxlY3Rpb24gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIGRvd25sb2FkLjwvcD5cIiBdO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYmUgbGlzdGVkIGluIHRoZSBkb3dubG9hZCBtb2R1bGUuXCIpO1xuXG4gICAgICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggcmFuZ2VPcHRpb24udmFsdWUuaW5kZXhPZignY3VycmVudC1wYWdlJykgPiAtMSApIHtcbiAgICAgICAgICAgIHZhciBwYWdlO1xuICAgICAgICAgICAgc3dpdGNoKHJhbmdlT3B0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCkgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlLXZlcnNvJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCdWRVJTTycpIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2N1cnJlbnQtcGFnZS1yZWN0byc6XG4gICAgICAgICAgICAgICAgICAgIHBhZ2UgPSBbIEhULnJlYWRlci52aWV3LmN1cnJlbnRMb2NhdGlvbignUkVDVE8nKSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICggISBwYWdlICkge1xuICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IGltcG9zc2libGU/XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxlY3Rpb24ucGFnZXMgPSBbIHBhZ2UgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvciA/XG4gICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihzZWxlY3Rpb24ucGFnZXMpIDogXG4gICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcmFuZ2VPcHRpb24uZGF0YXNldC5pc1BhcnRpYWwgPT0gJ3RydWUnICYmIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPD0gMTAgKSB7XG5cbiAgICAgICAgICAgIC8vIGRlbGV0ZSBhbnkgZXhpc3RpbmcgaW5wdXRzXG4gICAgICAgICAgICB0dW5uZWxGb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0Om5vdChbZGF0YS1maXhlZF0pJykuZm9yRWFjaChmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0ucmVtb3ZlQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgaWYgKCBmb3JtYXRPcHRpb24udmFsdWUgPT0gJ2ltYWdlJyApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZV9hdHRyID0gXCJ0YXJnZXRfcHBpXCI7XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlX2Zvcm1hdF9hdHRyID0gJ2Zvcm1hdCc7XG4gICAgICAgICAgICAgICAgdmFyIHNpemVfdmFsdWUgPSBcIjMwMFwiO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA9PSAxICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzbGlnaHQgZGlmZmVyZW5jZVxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSAnL2NnaS9pbWdzcnYvaW1hZ2UnO1xuICAgICAgICAgICAgICAgICAgICBzaXplX2F0dHIgPSBcInNpemVcIjtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZV92YWx1ZSA9IFwicHBpOjMwMFwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIHNpemVfYXR0cik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgc2l6ZV92YWx1ZSk7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBpbWFnZV9mb3JtYXRfYXR0cik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgJ2ltYWdlL2pwZWcnKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAncGxhaW50ZXh0LXppcCcgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgJ2J1bmRsZV9mb3JtYXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBcInppcFwiKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZWN0aW9uLnNlcS5mb3JFYWNoKGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgXCJzZXFcIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgcmFuZ2UpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHVubmVsRm9ybS5hY3Rpb24gPSBhY3Rpb247XG4gICAgICAgICAgICAvLyBIVC5kaXNhYmxlVW5sb2FkVGltZW91dCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgaWZyYW1lc1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lLmRvd25sb2FkLW1vZHVsZScpLmZvckVhY2goZnVuY3Rpb24oaWZyYW1lKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZG93bmxvYWRJZHggKz0gMTtcbiAgICAgICAgICAgIHZhciB0cmFja2VyID0gYEQke2Rvd25sb2FkSWR4fTpgO1xuICAgICAgICAgICAgdmFyIHRyYWNrZXJfaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdHJhY2tlcl9pbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgnbmFtZScsICd0cmFja2VyJyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB0cmFja2VyKTtcbiAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQodHJhY2tlcl9pbnB1dCk7XG4gICAgICAgICAgICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgYGRvd25sb2FkLW1vZHVsZS0ke2Rvd25sb2FkSWR4fWApO1xuICAgICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZG93bmxvYWQtbW9kdWxlJyk7XG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICB0dW5uZWxGb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgaWZyYW1lLmdldEF0dHJpYnV0ZSgnbmFtZScpKTtcblxuICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuY2xhc3NMaXN0LmFkZCgnYnRuLWxvYWRpbmcnKTtcblxuICAgICAgICAgICAgdmFyIHRyYWNrZXJJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICQuY29va2llKCd0cmFja2VyJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5pc19kZXYgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0/XCIsIHRyYWNrZXIsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCB2YWx1ZS5pbmRleE9mKHRyYWNrZXIpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICQucmVtb3ZlQ29va2llKCd0cmFja2VyJywgeyBwYXRoOiAnLyd9KTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0cmFja2VySW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5jbGFzc0xpc3QucmVtb3ZlKCdidG4tbG9hZGluZycpO1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBIVC5kaXNhYmxlVW5sb2FkVGltZW91dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMCk7XG5cblxuICAgICAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBcbiAgICAgICAgICAgICAgICBsYWJlbCA6ICctJywgXG4gICAgICAgICAgICAgICAgY2F0ZWdvcnkgOiAnUFQnLCBcbiAgICAgICAgICAgICAgICBhY3Rpb24gOiBgUFQgRG93bmxvYWQgLSAke2Zvcm1hdE9wdGlvbi52YWx1ZS50b1VwcGVyQ2FzZSgpfSAtICR7cmFuZ2VPcHRpb24udmFsdWV9YCBcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgaWYgKCB3aW5kb3cuaGogKSB7IGhqKCd0YWdSZWNvcmRpbmcnLCBbIGBQVCBEb3dubG9hZCAtICR7Zm9ybWF0T3B0aW9uLnZhbHVlLnRvVXBwZXJDYXNlKCl9IC0gJHtyYW5nZU9wdGlvbi52YWx1ZX1gIF0pIH07XG5cbiAgICAgICAgICAgIHR1bm5lbEZvcm0uc3VibWl0KCk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBfZm9ybWF0X3RpdGxlcyA9IHt9O1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5wZGYgPSAnUERGJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMuZXB1YiA9ICdFUFVCJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMucGxhaW50ZXh0ID0gJ1RleHQgKC50eHQpJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXNbJ3BsYWludGV4dC16aXAnXSA9ICdUZXh0ICguemlwKSc7XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLmltYWdlID0gJ0ltYWdlIChKUEVHKSc7XG5cbiAgICAgICAgLy8gaW52b2tlIHRoZSBkb3dubG9hZGVyXG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYoe1xuICAgICAgICAgICAgc3JjOiBhY3Rpb24gKyAnP2lkPScgKyBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICBpdGVtX3RpdGxlOiBfZm9ybWF0X3RpdGxlc1tmb3JtYXRPcHRpb24udmFsdWVdLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb24sXG4gICAgICAgICAgICBkb3dubG9hZEZvcm1hdDogZm9ybWF0T3B0aW9uLnZhbHVlLFxuICAgICAgICAgICAgdHJhY2tpbmdBY3Rpb246IHJhbmdlT3B0aW9uLnZhbHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KVxuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHQ7XG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vayAnICtcbiAgICAgICAgICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgICAgICAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PGkgY2xhc3M9XCJpY29tb29uIGljb21vb24taGVscFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPkhlbHA6IEVtYmVkZGluZyBIYXRoaVRydXN0IEJvb2tzPC9zcGFuPjwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LXNjcm9sbFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctc2Nyb2xsXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LWZsaXBcIiB2YWx1ZT1cIjFcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1mbGlwXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWJvb2stYWx0MlwiLz4gRmxpcCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZm9ybT4nICtcbiAgICAnPC9kaXY+J1xuICAgICk7XG5cblxuICAgIC8vICQoXCIjZW1iZWRIdG1sXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI2VtYmVkSHRtbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfVxuICAgIF0pO1xuXG4gICAgICAgIC8vIEN1c3RvbSB3aWR0aCBmb3IgYm91bmRpbmcgJy5tb2RhbCcgXG4gICAgICAgICRibG9jay5jbG9zZXN0KCcubW9kYWwnKS5hZGRDbGFzcyhcImJvb3Rib3hNZWRpdW1XaWR0aFwiKTtcblxuICAgICAgICAvLyBTZWxlY3QgZW50aXJldHkgb2YgY29kZWJsb2NrIGZvciBlYXN5IGNvcHlpbmdcbiAgICAgICAgdmFyIHRleHRhcmVhID0gJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWNvZGVibG9ja11cIik7XG4gICAgdGV4dGFyZWEub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IGNvZGVibG9jayB0byBvbmUgb2YgdHdvIHZpZXdzIFxuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctc2Nyb2xsXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LWZsaXBcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9sb25nLCBzaWRlX3Nob3J0KSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGZlZWRiYWNrIHN5c3RlbVxudmFyIEhUID0gSFQgfHwge307XG5IVC5mZWVkYmFjayA9IHt9O1xuSFQuZmVlZGJhY2suZGlhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPVxuICAgICAgICAnPGZvcm0+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPkVtYWlsIEFkZHJlc3M8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGxhYmVsIGZvcj1cImVtYWlsXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5FTWFpbCBBZGRyZXNzPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBwbGFjZWhvbGRlcj1cIltZb3VyIGVtYWlsIGFkZHJlc3NdXCIgbmFtZT1cImVtYWlsXCIgaWQ9XCJlbWFpbFwiIC8+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPldlIHdpbGwgbWFrZSBldmVyeSBlZmZvcnQgdG8gYWRkcmVzcyBjb3B5cmlnaHQgaXNzdWVzIGJ5IHRoZSBuZXh0IGJ1c2luZXNzIGRheSBhZnRlciBub3RpZmljYXRpb24uPC9zcGFuPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPk92ZXJhbGwgcGFnZSByZWFkYWJpbGl0eSBhbmQgcXVhbGl0eTwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiB2YWx1ZT1cInJlYWRhYmxlXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIE1pc3NpbmcgcGFydHMgb2YgdGhlIHBhZ2UnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQmx1cnJ5IHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjdXJ2ZWRcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgVGhpcyBpdGVtIGlzIGluIHRoZSBwdWJsaWMgZG9tYWluLCBidXQgSSBkb25cXCd0IGhhdmUgYWNjZXNzIHRvIGl0LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwiYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAgICAgSSBoYXZlIGFjY2VzcyB0byB0aGlzIGl0ZW0sIGJ1dCBzaG91bGQgbm90LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0VGl0bGUgPSBmdW5jdGlvbigpIHtcbiAgICBjb25zdCB0aXRsZSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ3RpdGxlJyk7XG4gICAgaWYgKCBsb2NhdGlvbi5wYXRobmFtZSA9PSAnL2NnaS9wdCcgJiYgdGl0bGUuZGF0YXNldC50aXRsZSApIHtcbiAgICAgIHJldHVybiB0aXRsZS5kYXRhc2V0LnRpdGxlO1xuICAgIH1cbiAgICByZXR1cm4gZG9jdW1lbnQudGl0bGU7XG4gIH1cblxuICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0aXRsZScpLmRhdGFzZXQudGl0bGUgPSBkb2N1bWVudC50aXRsZTtcblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuICBIVCA9IEhUIHx8IHt9O1xuXG4gIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuICAgIC8vICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuICAgIC8vIH1cblxuICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuICAgICRuYXZpZ2F0b3IgPSAkKFwiLmFwcC0tcmVhZGVyLS1uYXZpZ2F0b3JcIik7XG4gICAgaWYgKCAkbmF2aWdhdG9yLmxlbmd0aCApIHtcbiAgICAgIGRvY3VtZW50LmJvZHkuZGF0YXNldC5leHBhbmRlZCA9IHRydWU7XG4gICAgICAvLyAkbmF2aWdhdG9yLmdldCgwKS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1oZWlnaHQnLCBgLSR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpICogMC45MH1weGApO1xuICAgICAgLy8gJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodCA9IGB7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YDtcbiAgICAgIC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgYCR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YCk7XG4gICAgICAvLyB2YXIgJGV4cGFuZG8gPSAkbmF2aWdhdG9yLmZpbmQoXCIuYWN0aW9uLWV4cGFuZG9cIik7XG4gICAgICB2YXIgJGV4cGFuZG8gPSAkKFwiI2FjdGlvbi1leHBhbmRvXCIpO1xuICAgICAgJGV4cGFuZG8ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmJvZHkuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICk7XG4gICAgICAgIHRoaXMuc2V0QXR0cmlidXRlKCdhcmlhLWV4cGFuZGVkJywgKCBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICkpO1xuICAgICAgICAvLyB2YXIgbmF2aWdhdG9ySGVpZ2h0ID0gMDtcbiAgICAgICAgLy8gaWYgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKSB7XG4gICAgICAgIC8vICAgbmF2aWdhdG9ySGVpZ2h0ID0gJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodDtcbiAgICAgICAgLy8gfVxuICAgICAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tbmF2aWdhdG9yLWhlaWdodCcsIG5hdmlnYXRvckhlaWdodCk7XG4gICAgICB9KVxuXG4gICAgICBpZiAoIEhULnBhcmFtcy51aSA9PSAnZW1iZWQnICkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkZXhwYW5kby50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBIVC4kbWVudSA9ICRtZW51O1xuXG4gICAgdmFyICRzaWRlYmFyID0gJChcIiNzaWRlYmFyXCIpO1xuXG4gICAgJHRyaWdnZXIgPSAkc2lkZWJhci5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpO1xuXG4gICAgJChcIiNhY3Rpb24tbW9iaWxlLXRvZ2dsZS1mdWxsc2NyZWVuXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSlcblxuICAgIEhULnV0aWxzID0gSFQudXRpbHMgfHwge307XG5cbiAgICAvLyAkc2lkZWJhci5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjc2lkZWJhcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBoaWRlIHRoZSBzaWRlYmFyXG4gICAgICB2YXIgJHRoaXMgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcImlucHV0LHNlbGVjdCxidXR0b24sYVwiKTtcbiAgICAgIGlmICggJHRoaXMuaXMoXCJpbnB1dFt0eXBlPSd0ZXh0J10sc2VsZWN0XCIpICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLnBhcmVudHMoXCIuZm9ybS1zZWFyY2gtdm9sdW1lXCIpLmxlbmd0aCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5pcyhcImJ1dHRvbixhXCIpICkge1xuICAgICAgICBIVC50b2dnbGUoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pXG5cbiAgICBpZiAoIEhUICYmIEhULnV0aWxzICYmIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlICkge1xuICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAndHJ1ZSc7XG4gIH1cblxuICBIVC50b2dnbGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuXG4gICAgLy8gJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAvLyAkKFwiLnNpZGViYXItY29udGFpbmVyXCIpLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIikuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC5zaWRlYmFyRXhwYW5kZWQgPSBzdGF0ZTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC52aWV3ID0gc3RhdGUgPyAnb3B0aW9ucycgOiAndmlld2VyJztcblxuICAgIGRvY3VtZW50LmJvZHkuZGF0YXNldC5zaWRlYmFyTmFycm93U3RhdGUgPSBzdGF0ZSA/ICdvcGVuJyA6ICdjbG9zZWQnO1xuICAgICQoXCJhY3Rpb24tdG9nZ2xlLXNpZGViYXItbmFycm93XCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG5cbiAgICAvLyB2YXIgeGxpbmtfaHJlZjtcbiAgICAvLyBpZiAoICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZScgKSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1leHBhbmRlZCc7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWNvbGxhcHNlZCc7XG4gICAgLy8gfVxuICAgIC8vICR0cmlnZ2VyLmZpbmQoXCJzdmcgdXNlXCIpLmF0dHIoXCJ4bGluazpocmVmXCIsIHhsaW5rX2hyZWYpO1xuICB9XG5cbiAgc2V0VGltZW91dChIVC5tb2JpZnksIDEwMDApO1xuXG4gIC8vIHZhciB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcbiAgLy8gICB2YXIgaCA9ICQoXCIjc2lkZWJhciAuc2lkZWJhci10b2dnbGUtYnV0dG9uXCIpLm91dGVySGVpZ2h0KCkgfHwgNDA7XG4gIC8vICAgdmFyIHRvcCA9ICggJChcImhlYWRlclwiKS5oZWlnaHQoKSArIGggKSAqIDEuMDU7XG4gIC8vICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXRvb2xiYXItaG9yaXpvbnRhbC10b3AnLCB0b3AgKyAncHgnKTtcbiAgLy8gfVxuICAvLyAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSk7XG4gIC8vIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSgpO1xuXG4gICQoXCJodG1sXCIpLmdldCgwKS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2lkZWJhci1leHBhbmRlZCcsIGZhbHNlKTtcblxufSlcbiIsImlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gIC8vIE11c3QgYmUgd3JpdGFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCwgXCJhc3NpZ25cIiwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7IC8vIC5sZW5ndGggb2YgZnVuY3Rpb24gaXMgMlxuICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7IC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgICAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7IC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0bztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KTtcbn1cblxuLy8gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2pzZXJ6L2pzX3BpZWNlL2Jsb2IvbWFzdGVyL0RPTS9DaGlsZE5vZGUvYWZ0ZXIoKS9hZnRlcigpLm1kXG4oZnVuY3Rpb24gKGFycikge1xuICBhcnIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmIChpdGVtLmhhc093blByb3BlcnR5KCdhZnRlcicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpdGVtLCAnYWZ0ZXInLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gYWZ0ZXIoKSB7XG4gICAgICAgIHZhciBhcmdBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgIGRvY0ZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgIFxuICAgICAgICBhcmdBcnIuZm9yRWFjaChmdW5jdGlvbiAoYXJnSXRlbSkge1xuICAgICAgICAgIHZhciBpc05vZGUgPSBhcmdJdGVtIGluc3RhbmNlb2YgTm9kZTtcbiAgICAgICAgICBkb2NGcmFnLmFwcGVuZENoaWxkKGlzTm9kZSA/IGFyZ0l0ZW0gOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJpbmcoYXJnSXRlbSkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRvY0ZyYWcsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pKFtFbGVtZW50LnByb3RvdHlwZSwgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUsIERvY3VtZW50VHlwZS5wcm90b3R5cGVdKTtcblxuZnVuY3Rpb24gUmVwbGFjZVdpdGhQb2x5ZmlsbCgpIHtcbiAgJ3VzZS1zdHJpY3QnOyAvLyBGb3Igc2FmYXJpLCBhbmQgSUUgPiAxMFxuICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlLCBpID0gYXJndW1lbnRzLmxlbmd0aCwgY3VycmVudE5vZGU7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghaSkgLy8gaWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50c1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgd2hpbGUgKGktLSkgeyAvLyBpLS0gZGVjcmVtZW50cyBpIGFuZCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBpIGJlZm9yZSB0aGUgZGVjcmVtZW50XG4gICAgY3VycmVudE5vZGUgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50Tm9kZSAhPT0gJ29iamVjdCcpe1xuICAgICAgY3VycmVudE5vZGUgPSB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3VycmVudE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUucGFyZW50Tm9kZSl7XG4gICAgICBjdXJyZW50Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGN1cnJlbnROb2RlKTtcbiAgICB9XG4gICAgLy8gdGhlIHZhbHVlIG9mIFwiaVwiIGJlbG93IGlzIGFmdGVyIHRoZSBkZWNyZW1lbnRcbiAgICBpZiAoIWkpIC8vIGlmIGN1cnJlbnROb2RlIGlzIHRoZSBmaXJzdCBhcmd1bWVudCAoY3VycmVudE5vZGUgPT09IGFyZ3VtZW50c1swXSlcbiAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQoY3VycmVudE5vZGUsIHRoaXMpO1xuICAgIGVsc2UgLy8gaWYgY3VycmVudE5vZGUgaXNuJ3QgdGhlIGZpcnN0XG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGN1cnJlbnROb2RlLCB0aGlzLnByZXZpb3VzU2libGluZyk7XG4gIH1cbn1cbmlmICghRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aClcbiAgICBDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aCA9IFJlcGxhY2VXaXRoUG9seWZpbGw7XG5pZiAoIURvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGgpIFxuICAgIERvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuXG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJGZvcm0gPSAkKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKTtcblxuICB2YXIgJGJvZHkgPSAkKFwiYm9keVwiKTtcblxuICAkKHdpbmRvdykub24oJ3VuZG8tbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICQoXCJidXR0b24uYnRuLWxvYWRpbmdcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpLnJlbW92ZUNsYXNzKFwiYnRuLWxvYWRpbmdcIik7XG4gIH0pXG5cbiAgJChcImJvZHlcIikub24oJ3N1Ym1pdCcsICdmb3JtLmZvcm0tc2VhcmNoLXZvbHVtZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgSFQuYmVmb3JlVW5sb2FkVGltZW91dCA9IDE1MDAwO1xuICAgIHZhciAkZm9ybV8gPSAkKHRoaXMpO1xuXG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybV8uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybV8uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKHdpbmRvdykudHJpZ2dlcigndW5kby1sb2FkaW5nJyk7XG4gICAgfSlcblxuICAgIGlmICggSFQucmVhZGVyICYmIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3IgKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3Iuc3VibWl0KCRmb3JtXy5nZXQoMCkpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgcHJvY2Vzc2luZ1xuICB9KVxuXG4gICQoXCIjYWN0aW9uLXN0YXJ0LWp1bXBcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeiA9IHBhcnNlSW50KCQodGhpcykuZGF0YSgnc3onKSwgMTApO1xuICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KCQodGhpcykudmFsKCksIDEwKTtcbiAgICB2YXIgc3RhcnQgPSAoIHZhbHVlIC0gMSApICogc3ogKyAxO1xuICAgIHZhciAkZm9ybV8gPSAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3RhcnQnIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3RhcnR9XCIgLz5gKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3onIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3p9XCIgLz5gKTtcbiAgICAkZm9ybV8uc3VibWl0KCk7XG4gIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjdmVyc2lvbkljb24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
