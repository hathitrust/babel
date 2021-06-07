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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJtb2JpZnkuanMiLCJwb2x5ZmlsbHMuanMiLCJzZWFyY2hfaW5faXRlbS5qcyIsInZlcnNpb25fcG9wdXAuanMiXSwibmFtZXMiOlsiZmFjdG9yeSIsImRlZmluZSIsImFtZCIsImpRdWVyeSIsIiQiLCJ1bmRlZmluZWQiLCJ0YWcyYXR0ciIsImEiLCJpbWciLCJmb3JtIiwiYmFzZSIsInNjcmlwdCIsImlmcmFtZSIsImxpbmsiLCJrZXkiLCJhbGlhc2VzIiwicGFyc2VyIiwic3RyaWN0IiwibG9vc2UiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImlzaW50IiwicGFyc2VVcmkiLCJ1cmwiLCJzdHJpY3RNb2RlIiwic3RyIiwiZGVjb2RlVVJJIiwicmVzIiwiZXhlYyIsInVyaSIsImF0dHIiLCJwYXJhbSIsInNlZyIsImkiLCJwYXJzZVN0cmluZyIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJmcmFnbWVudCIsImhvc3QiLCJwcm90b2NvbCIsInBvcnQiLCJnZXRBdHRyTmFtZSIsImVsbSIsInRuIiwidGFnTmFtZSIsInRvTG93ZXJDYXNlIiwicHJvbW90ZSIsInBhcmVudCIsImxlbmd0aCIsInQiLCJwYXJzZSIsInBhcnRzIiwidmFsIiwicGFydCIsInNoaWZ0IiwiaXNBcnJheSIsInB1c2giLCJvYmoiLCJrZXlzIiwiaW5kZXhPZiIsInN1YnN0ciIsInRlc3QiLCJtZXJnZSIsImxlbiIsImxhc3QiLCJrIiwic2V0IiwicmVkdWNlIiwiU3RyaW5nIiwicmV0IiwicGFpciIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJlcWwiLCJicmFjZSIsImxhc3RCcmFjZUluS2V5IiwidiIsImMiLCJhY2N1bXVsYXRvciIsImwiLCJjdXJyIiwiYXJndW1lbnRzIiwiY2FsbCIsInZBcmciLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJwdXJsIiwid2luZG93IiwibG9jYXRpb24iLCJkYXRhIiwicXVlcnkiLCJmcGFyYW0iLCJzZWdtZW50IiwiZnNlZ21lbnQiLCJmbiIsIkhUIiwiaGVhZCIsInJlYWR5IiwicmVuZXdfYXV0aCIsImVudGl0eUlEIiwic291cmNlIiwiX19yZW5ld2luZyIsInNldFRpbWVvdXQiLCJyZWF1dGhfdXJsIiwic2VydmljZV9kb21haW4iLCJlbmNvZGVVUklDb21wb25lbnQiLCJocmVmIiwicmV0dmFsIiwiY29uZmlybSIsImFuYWx5dGljcyIsImxvZ0FjdGlvbiIsInRyaWdnZXIiLCJkZWxpbSIsImFqYXgiLCJjb21wbGV0ZSIsInhociIsInN0YXR1cyIsImdldFJlc3BvbnNlSGVhZGVyIiwib24iLCJldmVudCIsIk1PTlRIUyIsIiRlbWVyZ2VuY3lfYWNjZXNzIiwiZGVsdGEiLCJsYXN0X3NlY29uZHMiLCJ0b2dnbGVfcmVuZXdfbGluayIsImRhdGUiLCJub3ciLCJEYXRlIiwiZ2V0VGltZSIsIiRsaW5rIiwiZmluZCIsIm9ic2VydmVfZXhwaXJhdGlvbl90aW1lc3RhbXAiLCJwYXJhbXMiLCJpZCIsImNvb2tpZSIsImpzb24iLCJzZWNvbmRzIiwiY2xvbmUiLCJ0ZXh0IiwiYXBwZW5kIiwiJGFjdGlvbiIsIm1lc3NhZ2UiLCJ0aW1lMm1lc3NhZ2UiLCJob3VycyIsImdldEhvdXJzIiwiYW1wbSIsIm1pbnV0ZXMiLCJnZXRNaW51dGVzIiwiZ2V0TW9udGgiLCJnZXREYXRlIiwiZXhwaXJhdGlvbiIsInBhcnNlSW50IiwiZ3JhbnRlZCIsImdldCIsImRhdGFzZXQiLCJpbml0aWFsaXplZCIsInNldEludGVydmFsIiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY3VycmlkIiwiaWRzIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJkZXRhaWwiLCJ0YXJnZXQiLCJwcmVmcyIsInB0IiwiYWxlcnRzIiwiZ2V0QXR0cmlidXRlIiwib3BlbiIsInNlbGYiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJ2aWV3IiwiY2xhc3NMaXN0UHJvcCIsInByb3RvUHJvcCIsImVsZW1DdHJQcm90byIsIkVsZW1lbnQiLCJvYmpDdHIiLCJzdHJUcmltIiwidHJpbSIsImFyckluZGV4T2YiLCJBcnJheSIsIml0ZW0iLCJET01FeCIsInR5cGUiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInNob3ciLCJ1cGRhdGVfc3RhdHVzIiwiZGlzcGxheV9pbmZvIiwiaGlkZV9lcnJvciIsImhpZGUiLCJoaWRlX2luZm8iLCJnZXRfdXJsIiwicGF0aG5hbWUiLCJwYXJzZV9saW5lIiwidG1wIiwia3YiLCJlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEiLCJhcmdzIiwib3B0aW9ucyIsImV4dGVuZCIsImNyZWF0aW5nIiwiJGJsb2NrIiwiY24iLCJkZXNjIiwic2hyZCIsImxvZ2luX3N0YXR1cyIsImxvZ2dlZF9pbiIsImFwcGVuZFRvIiwiJGhpZGRlbiIsImlpZCIsIiRkaWFsb2ciLCJjYWxsYmFjayIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInN1Ym1pdF9wb3N0IiwiZWFjaCIsIiR0aGlzIiwiJGNvdW50IiwibGltaXQiLCJiaW5kIiwicGFnZSIsImRvbmUiLCJhZGRfaXRlbV90b19jb2xsaXN0IiwiY29uc29sZSIsImxvZyIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJlcnJvclRocm93biIsIiR1bCIsImNvbGxfaHJlZiIsImNvbGxfaWQiLCIkYSIsImNvbGxfbmFtZSIsInBhcmVudHMiLCJyZW1vdmVDbGFzcyIsIiRvcHRpb24iLCJjb25maXJtX2xhcmdlIiwiY29sbFNpemUiLCJhZGROdW1JdGVtcyIsIm51bVN0ciIsImFuc3dlciIsInByZXZlbnREZWZhdWx0IiwiYWN0aW9uIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9pZCIsInNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSIsImMyIiwiaXMiLCJjcm1zX3N0YXRlIiwiZm9yY2Vfc2l6ZSIsIiRkaXYiLCIkcCIsInBob3RvY29waWVyX21lc3NhZ2UiLCJEb3dubG9hZGVyIiwiaW5pdCIsInBkZiIsInN0YXJ0IiwiYmluZEV2ZW50cyIsImV4cGxhaW5QZGZBY2Nlc3MiLCJhbGVydCIsImRvd25sb2FkUGRmIiwiY29uZmlnIiwic3JjIiwiaXRlbV90aXRsZSIsIiRjb25maWciLCJ0b3RhbCIsInNlbGVjdGlvbiIsInBhZ2VzIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsInNlcSIsImRvd25sb2FkRm9ybWF0IiwiY2FuY2VsRG93bmxvYWQiLCJwcm9ncmVzc191cmwiLCJkb3dubG9hZF91cmwiLCJjbGVhclRpbWVyIiwic3RhcnREb3dubG9hZE1vbml0b3IiLCJ0aW1lciIsImlzX3J1bm5pbmciLCJudW1fcHJvY2Vzc2VkIiwiY2hlY2tTdGF0dXMiLCJ0cyIsInN1Y2Nlc3MiLCJ1cGRhdGVQcm9ncmVzcyIsIm51bV9hdHRlbXB0cyIsImRpc3BsYXlQcm9jZXNzRXJyb3IiLCJsb2dFcnJvciIsInBlcmNlbnQiLCJjdXJyZW50IiwiY3VycmVudF9wYWdlIiwibGFzdF9wZXJjZW50IiwidXBkYXRlU3RhdHVzVGV4dCIsImNzcyIsIndpZHRoIiwiZG93bmxvYWRfa2V5IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiJGRvd25sb2FkX2J0biIsImRvd25sb2FkIiwidHJhY2tFdmVudCIsImNhdGVnb3J5IiwidG9VcHBlckNhc2UiLCJ0cmFja2luZ0FjdGlvbiIsImhqIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicmF0ZSIsImNvdW50ZG93biIsImNvdW50ZG93bl90aW1lciIsIl9sYXN0TWVzc2FnZSIsIl9sYXN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJpbm5lclRleHQiLCJFT1QiLCJkb3dubG9hZEZvcm0iLCJkb3dubG9hZEZvcm1hdE9wdGlvbnMiLCJyYW5nZU9wdGlvbnMiLCJkb3dubG9hZElkeCIsInF1ZXJ5U2VsZWN0b3IiLCJkb3dubG9hZGVyIiwiY3JlYXRlIiwicXVlcnlTZWxlY3RvckFsbCIsImRvd25sb2FkU3VibWl0IiwiaGFzRnVsbFBkZkFjY2VzcyIsImZ1bGxQZGZBY2Nlc3MiLCJ1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyIsIm9wdGlvbiIsImZvckVhY2giLCJyYW5nZU9wdGlvbiIsImlucHV0IiwiZGlzYWJsZWQiLCJtYXRjaGVzIiwidmFsdWUiLCJjdXJyZW50X3ZpZXciLCJyZWFkZXIiLCJjaGVja2VkIiwiYWRkRXZlbnRMaXN0ZW5lciIsImRpdiIsImZvcm1hdE9wdGlvbiIsImRvd25sb2FkRm9ybWF0VGFyZ2V0IiwicGRmRm9ybWF0T3B0aW9uIiwidHVubmVsRm9ybSIsInByaW50YWJsZSIsImFjdGlvblRlbXBsYXRlIiwiY29udHJvbHMiLCJzZWxlY3RpbmF0b3IiLCJfZ2V0UGFnZVNlbGVjdGlvbiIsImlzU2VsZWN0aW9uIiwiYnV0dG9ucyIsImN1cnJlbnRMb2NhdGlvbiIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJpc1BhcnRpYWwiLCJyZW1vdmVDaGlsZCIsInNpemVfYXR0ciIsImltYWdlX2Zvcm1hdF9hdHRyIiwic2l6ZV92YWx1ZSIsImFwcGVuZENoaWxkIiwicmFuZ2UiLCJib2R5IiwidHJhY2tlciIsInRyYWNrZXJfaW5wdXQiLCJzdHlsZSIsIm9wYWNpdHkiLCJ0cmFja2VySW50ZXJ2YWwiLCJpc19kZXYiLCJyZW1vdmVDb29raWUiLCJkaXNhYmxlVW5sb2FkVGltZW91dCIsInN1Ym1pdCIsIl9mb3JtYXRfdGl0bGVzIiwiZXB1YiIsInBsYWludGV4dCIsImltYWdlIiwic2lkZV9zaG9ydCIsInNpZGVfbG9uZyIsImh0SWQiLCJlbWJlZEhlbHBMaW5rIiwiY29kZWJsb2NrX3R4dCIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsImFkZENsYXNzIiwidGV4dGFyZWEiLCJzZWxlY3QiLCJjbGljayIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiZ2V0VGl0bGUiLCJ0aXRsZSIsIiRtZW51IiwiJHRyaWdnZXIiLCIkaGVhZGVyIiwiJG5hdmlnYXRvciIsIm1vYmlmeSIsImV4cGFuZGVkIiwiJGV4cGFuZG8iLCJ1aSIsIiRzaWRlYmFyIiwiZG9jdW1lbnRFbGVtZW50IiwicmVxdWVzdEZ1bGxTY3JlZW4iLCJ1dGlscyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJzaWRlYmFyTmFycm93U3RhdGUiLCJhc3NpZ24iLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsIndyaXRhYmxlIiwiYXJyIiwiYWZ0ZXIiLCJhcmdBcnIiLCJkb2NGcmFnIiwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudCIsImFyZ0l0ZW0iLCJpc05vZGUiLCJOb2RlIiwiY3JlYXRlVGV4dE5vZGUiLCJwYXJlbnROb2RlIiwiaW5zZXJ0QmVmb3JlIiwibmV4dFNpYmxpbmciLCJDaGFyYWN0ZXJEYXRhIiwiRG9jdW1lbnRUeXBlIiwiUmVwbGFjZVdpdGhQb2x5ZmlsbCIsImN1cnJlbnROb2RlIiwib3duZXJEb2N1bWVudCIsInJlcGxhY2VDaGlsZCIsInByZXZpb3VzU2libGluZyIsInJlcGxhY2VXaXRoIiwiJGJvZHkiLCJyZW1vdmVBdHRyIiwiYmVmb3JlVW5sb2FkVGltZW91dCIsIiRmb3JtXyIsIiRzdWJtaXQiLCIkaW5wdXQiLCJzZWFyY2hpbmF0b3IiLCJzeiJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7O0FBT0EsQ0FBQyxDQUFDLFVBQVNBLE9BQVQsRUFBa0I7QUFDbkIsS0FBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUMvQztBQUNBLE1BQUssT0FBT0MsTUFBUCxLQUFrQixXQUF2QixFQUFxQztB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WUFBVztBQUM5QyxRQUFJb1osS0FBS25YLFNBQVNySixFQUFFLElBQUYsRUFBUXVGLElBQVIsQ0FBYSxJQUFiLENBQVQsRUFBNkIsRUFBN0IsQ0FBVDtBQUNBLFFBQUk2VCxRQUFRL1AsU0FBU3JKLEVBQUUsSUFBRixFQUFRa0QsR0FBUixFQUFULEVBQXdCLEVBQXhCLENBQVo7QUFDQSxRQUFJMFEsUUFBUSxDQUFFd0YsUUFBUSxDQUFWLElBQWdCb0gsRUFBaEIsR0FBcUIsQ0FBakM7QUFDQSxRQUFJSixTQUFTcGdCLEVBQUUscUJBQUYsQ0FBYjtBQUNBb2dCLFdBQU8zWCxNQUFQLGtEQUEwRG1MLEtBQTFEO0FBQ0F3TSxXQUFPM1gsTUFBUCwrQ0FBdUQrWCxFQUF2RDtBQUNBSixXQUFPN0UsTUFBUDtBQUNELEdBUkQ7QUFVRCxDQS9DRDs7O0FDQUF6VixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLGNBQXRCLEVBQXNDLFVBQVM5QyxDQUFULEVBQVk7QUFDOUNBLFVBQUV3TyxjQUFGO0FBQ0ExSSxnQkFBUTJKLEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgLy8gdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAvLyB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIC8vIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIC8vICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gIC8vICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gIC8vICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgLy8gICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gIC8vICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAvLyAgICAgICB9LCA1MCk7XG4gIC8vICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAvLyAgICAgICB9LCA1MDApO1xuXG4gIC8vICAgICB9XG4gIC8vIH1cblxuICBIVC5yZW5ld19hdXRoID0gZnVuY3Rpb24oZW50aXR5SUQsIHNvdXJjZT0naW1hZ2UnKSB7XG4gICAgaWYgKCBIVC5fX3JlbmV3aW5nICkgeyByZXR1cm4gOyB9XG4gICAgSFQuX19yZW5ld2luZyA9IHRydWU7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB2YXIgcmVhdXRoX3VybCA9IGBodHRwczovLyR7SFQuc2VydmljZV9kb21haW59L1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPSR7ZW50aXR5SUR9JnRhcmdldD0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9YDtcbiAgICAgIHZhciByZXR2YWwgPSB3aW5kb3cuY29uZmlybShgV2UncmUgaGF2aW5nIGEgcHJvYmxlbSB3aXRoIHlvdXIgc2Vzc2lvbjsgc2VsZWN0IE9LIHRvIGxvZyBpbiBhZ2Fpbi5gKTtcbiAgICAgIGlmICggcmV0dmFsICkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHJlYXV0aF91cmw7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIEhULmFuYWx5dGljcyA9IEhULmFuYWx5dGljcyB8fCB7fTtcbiAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbiA9IGZ1bmN0aW9uKGhyZWYsIHRyaWdnZXIpIHtcbiAgICBpZiAoIGhyZWYgPT09IHVuZGVmaW5lZCApIHsgaHJlZiA9IGxvY2F0aW9uLmhyZWYgOyB9XG4gICAgdmFyIGRlbGltID0gaHJlZi5pbmRleE9mKCc7JykgPiAtMSA/ICc7JyA6ICcmJztcbiAgICBpZiAoIHRyaWdnZXIgPT0gbnVsbCApIHsgdHJpZ2dlciA9ICctJzsgfVxuICAgIGhyZWYgKz0gZGVsaW0gKyAnYT0nICsgdHJpZ2dlcjtcbiAgICAvLyAkLmdldChocmVmKTtcbiAgICAkLmFqYXgoaHJlZiwgXG4gICAge1xuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKHhociwgc3RhdHVzKSB7XG4gICAgICAgIHZhciBlbnRpdHlJRCA9IHhoci5nZXRSZXNwb25zZUhlYWRlcigneC1oYXRoaXRydXN0LXJlbmV3Jyk7XG4gICAgICAgIGlmICggZW50aXR5SUQgKSB7XG4gICAgICAgICAgSFQucmVuZXdfYXV0aChlbnRpdHlJRCwgJ2xvZ0FjdGlvbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG5cbiAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJ2FbZGF0YS10cmFja2luZy1jYXRlZ29yeT1cIm91dExpbmtzXCJdJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyB2YXIgdHJpZ2dlciA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctYWN0aW9uJyk7XG4gICAgLy8gdmFyIGxhYmVsID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1sYWJlbCcpO1xuICAgIC8vIGlmICggbGFiZWwgKSB7IHRyaWdnZXIgKz0gJzonICsgbGFiZWw7IH1cbiAgICB2YXIgdHJpZ2dlciA9ICdvdXQnICsgJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbih1bmRlZmluZWQsIHRyaWdnZXIpO1xuICB9KVxuXG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICB2YXIgTU9OVEhTID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLFxuICAgICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcblxuICB2YXIgJGVtZXJnZW5jeV9hY2Nlc3MgPSAkKFwiI2FjY2Vzcy1lbWVyZ2VuY3ktYWNjZXNzXCIpO1xuXG4gIHZhciBkZWx0YSA9IDUgKiA2MCAqIDEwMDA7XG4gIHZhciBsYXN0X3NlY29uZHM7XG4gIHZhciB0b2dnbGVfcmVuZXdfbGluayA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoIG5vdyA+PSBkYXRlLmdldFRpbWUoKSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJhW2Rpc2FibGVkXVwiKTtcbiAgICAgICRsaW5rLmF0dHIoXCJkaXNhYmxlZFwiLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICB2YXIgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICggISBIVCB8fCAhIEhULnBhcmFtcyB8fCAhIEhULnBhcmFtcy5pZCApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBkYXRhID0gJC5jb29raWUoJ0hUZXhwaXJhdGlvbicsIHVuZGVmaW5lZCwgeyBqc29uOiB0cnVlIH0pO1xuICAgIGlmICggISBkYXRhICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIHNlY29uZHMgPSBkYXRhW0hULnBhcmFtcy5pZF07XG4gICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIE9CU0VSVkVcIiwgc2Vjb25kcywgbGFzdF9zZWNvbmRzKTtcbiAgICBpZiAoIHNlY29uZHMgPT0gLTEgKSB7XG4gICAgICB2YXIgJGxpbmsgPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicCBhXCIpLmNsb25lKCk7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS50ZXh0KFwiWW91ciBhY2Nlc3MgaGFzIGV4cGlyZWQgYW5kIGNhbm5vdCBiZSByZW5ld2VkLiBSZWxvYWQgdGhlIHBhZ2Ugb3IgdHJ5IGFnYWluIGxhdGVyLiBBY2Nlc3MgaGFzIGJlZW4gcHJvdmlkZWQgdGhyb3VnaCB0aGUgXCIpO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcInBcIikuYXBwZW5kKCRsaW5rKTtcbiAgICAgIHZhciAkYWN0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5hbGVydC0tZW1lcmdlbmN5LWFjY2Vzcy0tb3B0aW9ucyBhXCIpO1xuICAgICAgJGFjdGlvbi5hdHRyKCdocmVmJywgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgJGFjdGlvbi50ZXh0KCdSZWxvYWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCBzZWNvbmRzID4gbGFzdF9zZWNvbmRzICkge1xuICAgICAgdmFyIG1lc3NhZ2UgPSB0aW1lMm1lc3NhZ2Uoc2Vjb25kcyk7XG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5leHBpcmVzLWRpc3BsYXlcIikudGV4dChtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgdGltZTJtZXNzYWdlID0gZnVuY3Rpb24oc2Vjb25kcykge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoc2Vjb25kcyAqIDEwMDApO1xuICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICB2YXIgYW1wbSA9ICdBTSc7XG4gICAgaWYgKCBob3VycyA+IDEyICkgeyBob3VycyAtPSAxMjsgYW1wbSA9ICdQTSc7IH1cbiAgICBpZiAoIGhvdXJzID09IDEyICl7IGFtcG0gPSAnUE0nOyB9XG4gICAgdmFyIG1pbnV0ZXMgPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICBpZiAoIG1pbnV0ZXMgPCAxMCApIHsgbWludXRlcyA9IGAwJHttaW51dGVzfWA7IH1cbiAgICB2YXIgbWVzc2FnZSA9IGAke2hvdXJzfToke21pbnV0ZXN9JHthbXBtfSAke01PTlRIU1tkYXRlLmdldE1vbnRoKCldfSAke2RhdGUuZ2V0RGF0ZSgpfWA7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICBpZiAoICRlbWVyZ2VuY3lfYWNjZXNzLmxlbmd0aCApIHtcbiAgICB2YXIgZXhwaXJhdGlvbiA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXMnKTtcbiAgICB2YXIgc2Vjb25kcyA9IHBhcnNlSW50KCRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXNTZWNvbmRzJyksIDEwKTtcbiAgICB2YXIgZ3JhbnRlZCA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0dyYW50ZWQnKTtcblxuICAgIHZhciBub3cgPSBEYXRlLm5vdygpIC8gMTAwMDtcbiAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmdldCgwKS5kYXRhc2V0LmluaXRpYWxpemVkID0gJ3RydWUnXG5cbiAgICBpZiAoIGdyYW50ZWQgKSB7XG4gICAgICAvLyBzZXQgdXAgYSB3YXRjaCBmb3IgdGhlIGV4cGlyYXRpb24gdGltZVxuICAgICAgbGFzdF9zZWNvbmRzID0gc2Vjb25kcztcbiAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB0b2dnbGVfcmVuZXdfbGluayhkYXRlKTtcbiAgICAgICAgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCgpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9XG4gIH1cblxuICBpZiAoJCgnI2FjY2Vzc0Jhbm5lcklEJykubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN1cHByZXNzID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdzdXBhY2NiYW4nKTtcbiAgICAgIGlmIChzdXBwcmVzcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWJ1ZyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaHRkZXYnKTtcbiAgICAgIHZhciBpZGhhc2ggPSAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgdW5kZWZpbmVkLCB7anNvbiA6IHRydWV9KTtcbiAgICAgIHZhciB1cmwgPSAkLnVybCgpOyAvLyBwYXJzZSB0aGUgY3VycmVudCBwYWdlIFVSTFxuICAgICAgdmFyIGN1cnJpZCA9IHVybC5wYXJhbSgnaWQnKTtcbiAgICAgIGlmIChpZGhhc2ggPT0gbnVsbCkge1xuICAgICAgICAgIGlkaGFzaCA9IHt9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiBpZGhhc2gpIHtcbiAgICAgICAgICBpZiAoaWRoYXNoLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGlkcy5pbmRleE9mKGN1cnJpZCkgPCAwKSB8fCBkZWJ1Zykge1xuICAgICAgICAgIGlkaGFzaFtjdXJyaWRdID0gMTtcbiAgICAgICAgICAvLyBzZXNzaW9uIGNvb2tpZVxuICAgICAgICAgICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCBpZGhhc2gsIHsganNvbiA6IHRydWUsIHBhdGg6ICcvJywgZG9tYWluOiAnLmhhdGhpdHJ1c3Qub3JnJyB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIHNob3dBbGVydCgpIHtcbiAgICAgICAgICAgICAgdmFyIGh0bWwgPSAkKCcjYWNjZXNzQmFubmVySUQnKS5odG1sKCk7XG4gICAgICAgICAgICAgIHZhciAkYWxlcnQgPSBib290Ym94LmRpYWxvZyhodG1sLCBbeyBsYWJlbDogXCJPS1wiLCBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiIH1dLCB7IGhlYWRlciA6ICdTcGVjaWFsIGFjY2VzcycsIHJvbGU6ICdhbGVydGRpYWxvZycgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHNob3dBbGVydCwgMzAwMCwgdHJ1ZSk7XG4gICAgICB9XG4gIH1cblxuICAkKFwiZGV0YWlscy5kZXRhaWxzLS1hbGVydFwiKS5vbigndG9nZ2xlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICB2YXIgZGV0YWlsID0gZXZlbnQudGFyZ2V0O1xuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIHByZWZzLnB0ID0gcHJlZnMucHQgfHwge307XG4gICAgcHJlZnMucHQuYWxlcnRzID0gcHJlZnMucHQuYWxlcnRzIHx8IHt9O1xuICAgIHByZWZzLnB0LmFsZXJ0c1tkZXRhaWwuZ2V0QXR0cmlidXRlKCdpZCcpXSA9IGRldGFpbC5vcGVuID8gJ29wZW4nIDogJ2Nsb3NlZCc7XG4gICAgSFQucHJlZnMuc2V0KHByZWZzKTtcbiAgfSlcblxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9ICdfX05FV19fJzsgLy8gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga3YgPSB0bXBbaV0uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgcmV0dmFsW2t2WzBdXSA9IGt2WzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKGFyZ3MpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHsgY3JlYXRpbmcgOiBmYWxzZSwgbGFiZWwgOiBcIlNhdmUgQ2hhbmdlc1wiIH0sIGFyZ3MpO1xuXG4gICAgICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICAgICAgICAgJzxmb3JtIGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCIgYWN0aW9uPVwibWJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWNuXCI+Q29sbGVjdGlvbiBOYW1lPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBtYXhsZW5ndGg9XCIxMDBcIiBuYW1lPVwiY25cIiBpZD1cImVkaXQtY25cIiB2YWx1ZT1cIlwiIHBsYWNlaG9sZGVyPVwiWW91ciBjb2xsZWN0aW9uIG5hbWVcIiByZXF1aXJlZCAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1jbi1jb3VudFwiPjEwMDwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWRlc2NcIj5EZXNjcmlwdGlvbjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgaWQ9XCJlZGl0LWRlc2NcIiBuYW1lPVwiZGVzY1wiIHJvd3M9XCI0XCIgbWF4bGVuZ3RoPVwiMjU1XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIHBsYWNlaG9sZGVyPVwiQWRkIHlvdXIgY29sbGVjdGlvbiBkZXNjcmlwdGlvbi5cIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1kZXNjLWNvdW50XCI+MjU1PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiPklzIHRoaXMgY29sbGVjdGlvbiA8c3Ryb25nPlB1YmxpYzwvc3Ryb25nPiBvciA8c3Ryb25nPlByaXZhdGU8L3N0cm9uZz4/PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTBcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJpdmF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTFcIiB2YWx1ZT1cIjFcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0xXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1B1YmxpYyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZm9ybT4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmNuICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwob3B0aW9ucy5jbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuZGVzYyApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwob3B0aW9ucy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5zaHJkICE9IG51bGwgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9XCIgKyBvcHRpb25zLnNocmQgKyAnXScpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICggISBIVC5sb2dpbl9zdGF0dXMubG9nZ2VkX2luICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTBdXCIpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvXCI+PHN0cm9uZz5UaGlzIGNvbGxlY3Rpb24gd2lsbCBiZSB0ZW1wb3Jhcnk8L3N0cm9uZz4uIExvZyBpbiB0byBjcmVhdGUgcGVybWFuZW50IGFuZCBwdWJsaWMgY29sbGVjdGlvbnMuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPGxhYmVsPiB0aGF0IHdyYXBzIHRoZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0xXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwibGFiZWxbZm9yPSdlZGl0LXNocmQtMSddXCIpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLiRoaWRkZW4gKSB7XG4gICAgICAgICAgICBvcHRpb25zLiRoaWRkZW4uY2xvbmUoKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2MnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYyk7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYScgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5paWQgKSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0naWlkJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmlpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJGJsb2NrLmdldCgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGZvcm0uY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNuID0gJC50cmltKCRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9ICQudHJpbSgkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBjbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvclwiPllvdSBtdXN0IGVudGVyIGEgY29sbGVjdGlvbiBuYW1lLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYSA6ICdhZGRpdHNuYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbiA6IGNuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYyA6IGRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaHJkIDogJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdOmNoZWNrZWRcIikudmFsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgICRkaWFsb2cuZmluZChcImlucHV0W3R5cGU9dGV4dF0sdGV4dGFyZWFcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJGNvdW50ID0gJChcIiNcIiArICR0aGlzLmF0dHIoJ2lkJykgKyBcIi1jb3VudFwiKTtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9ICR0aGlzLmF0dHIoXCJtYXhsZW5ndGhcIik7XG5cbiAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcblxuICAgICAgICAgICAgJHRoaXMuYmluZCgna2V5dXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRfcG9zdChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgeyBwYWdlIDogJ2FqYXgnLCBpZCA6IEhULnBhcmFtcy5pZCB9LCBwYXJhbXMpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogZ2V0X3VybCgpLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyc2VfbGluZShkYXRhKTtcbiAgICAgICAgICAgIGhpZGVfaW5mbygpO1xuICAgICAgICAgICAgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9TVUNDRVNTJyApIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9GQUlMVVJFJyApIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiSXRlbSBjb3VsZCBub3QgYmUgYWRkZWQgYXQgdGhpcyB0aW1lLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciAkdWwgPSAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcFwiKTtcbiAgICAgICAgdmFyIGNvbGxfaHJlZiA9IGdldF91cmwoKSArIFwiP2E9bGlzdGlzO2M9XCIgKyBwYXJhbXMuY29sbF9pZDtcbiAgICAgICAgdmFyICRhID0gJChcIjxhPlwiKS5hdHRyKFwiaHJlZlwiLCBjb2xsX2hyZWYpLnRleHQocGFyYW1zLmNvbGxfbmFtZSk7XG4gICAgICAgICQoXCI8bGk+PC9saT5cIikuYXBwZW5kVG8oJHVsKS5hcHBlbmQoJGEpO1xuICAgICAgICAkdWwucGFyZW50cyhcImRpdlwiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG5cbiAgICAgICAgLy8gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNQVGFkZEl0ZW1CdG4nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcblxuICAvLyBmb3JjZSBDUk1TIHVzZXJzIHRvIGEgZml4ZWQgaW1hZ2Ugc2l6ZVxuICBIVC5mb3JjZV9zaXplID0gMjAwO1xuXG4gIHZhciBpID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2tpbj1jcm1zd29ybGQnKTtcbiAgaWYgKCBpICsgMSAhPSAwICkge1xuICAgICAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVdvcmxkJztcbiAgfVxuXG4gIC8vIGRpc3BsYXkgYmliIGluZm9ybWF0aW9uXG4gIHZhciAkZGl2ID0gJChcIi5iaWJMaW5rc1wiKTtcbiAgdmFyICRwID0gJGRpdi5maW5kKFwicDpmaXJzdFwiKTtcbiAgJHAuZmluZChcInNwYW46ZW1wdHlcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIC8vICQodGhpcykudGV4dCgkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKS5hZGRDbGFzcyhcImJsb2NrZWRcIik7XG4gICAgICB2YXIgZnJhZ21lbnQgPSAnPHNwYW4gY2xhc3M9XCJibG9ja2VkXCI+PHN0cm9uZz57bGFiZWx9Ojwvc3Ryb25nPiB7Y29udGVudH08L3NwYW4+JztcbiAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQucmVwbGFjZSgne2xhYmVsfScsICQodGhpcykuYXR0cigncHJvcGVydHknKS5zdWJzdHIoMykpLnJlcGxhY2UoJ3tjb250ZW50fScsICQodGhpcykuYXR0cihcImNvbnRlbnRcIikpO1xuICAgICAgJHAuYXBwZW5kKGZyYWdtZW50KTtcbiAgfSlcblxuICB2YXIgJGxpbmsgPSAkKFwiI2VtYmVkSHRtbFwiKTtcbiAgY29uc29sZS5sb2coXCJBSE9ZIEVNQkVEXCIsICRsaW5rKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG5cbiAgJGxpbmsgPSAkKFwiYVtkYXRhLXRvZ2dsZT0nUFQgRmluZCBpbiBhIExpYnJhcnknXVwiKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG59KVxuIiwiLy8gZG93bmxvYWRlclxuXG52YXIgSFQgPSBIVCB8fCB7fTtcbnZhciBwaG90b2NvcGllcl9tZXNzYWdlID0gJ1RoZSBjb3B5cmlnaHQgbGF3IG9mIHRoZSBVbml0ZWQgU3RhdGVzIChUaXRsZSAxNywgVS5TLiBDb2RlKSBnb3Zlcm5zIHRoZSBtYWtpbmcgb2YgcmVwcm9kdWN0aW9ucyBvZiBjb3B5cmlnaHRlZCBtYXRlcmlhbC4gVW5kZXIgY2VydGFpbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgbGF3LCBsaWJyYXJpZXMgYW5kIGFyY2hpdmVzIGFyZSBhdXRob3JpemVkIHRvIGZ1cm5pc2ggYSByZXByb2R1Y3Rpb24uIE9uZSBvZiB0aGVzZSBzcGVjaWZpYyBjb25kaXRpb25zIGlzIHRoYXQgdGhlIHJlcHJvZHVjdGlvbiBpcyBub3QgdG8gYmUg4oCcdXNlZCBmb3IgYW55IHB1cnBvc2Ugb3RoZXIgdGhhbiBwcml2YXRlIHN0dWR5LCBzY2hvbGFyc2hpcCwgb3IgcmVzZWFyY2gu4oCdIElmIGEgdXNlciBtYWtlcyBhIHJlcXVlc3QgZm9yLCBvciBsYXRlciB1c2VzLCBhIHJlcHJvZHVjdGlvbiBmb3IgcHVycG9zZXMgaW4gZXhjZXNzIG9mIOKAnGZhaXIgdXNlLOKAnSB0aGF0IHVzZXIgbWF5IGJlIGxpYWJsZSBmb3IgY29weXJpZ2h0IGluZnJpbmdlbWVudC4nO1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgIH0sXG5cbiAgICBkb3dubG9hZFBkZjogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnNyYyA9IGNvbmZpZy5zcmM7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9IGNvbmZpZy5pdGVtX3RpdGxlO1xuICAgICAgICBzZWxmLiRjb25maWcgPSBjb25maWc7XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGNvbmZpZy5zZWxlY3Rpb24ucGFnZXMubGVuZ3RoO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuXG4gICAgfSxcblxuICAgIHJlcXVlc3REb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcblxuICAgICAgICBpZiAoIHNlbGYuJGNvbmZpZy5zZWxlY3Rpb24ucGFnZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgIGRhdGFbJ3NlcSddID0gc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5zZXE7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNlbGYuJGNvbmZpZy5kb3dubG9hZEZvcm1hdCkge1xuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2Zvcm1hdCddID0gJ2ltYWdlL2pwZWcnO1xuICAgICAgICAgICAgICAgIGRhdGFbJ3RhcmdldF9wcGknXSA9IDMwMDtcbiAgICAgICAgICAgICAgICBkYXRhWydidW5kbGVfZm9ybWF0J10gPSAnemlwJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BsYWludGV4dC16aXAnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd6aXAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGxhaW50ZXh0JzpcbiAgICAgICAgICAgICAgICBkYXRhWydidW5kbGVfZm9ybWF0J10gPSAndGV4dCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBzZWxmLnNyYy5yZXBsYWNlKC87L2csICcmJykgKyAnJmNhbGxiYWNrPUhULmRvd25sb2FkZXIuc3RhcnREb3dubG9hZE1vbml0b3InLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBTVEFSVFVQIE5PVCBERVRFQ1RFRFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZyApIHsgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTsgfVxuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MjkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcihyZXEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbERvd25sb2FkOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgc3RhcnREb3dubG9hZE1vbml0b3I6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBTFJFQURZIFBPTExJTkdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnBkZi5wcm9ncmVzc191cmwgPSBwcm9ncmVzc191cmw7XG4gICAgICAgIHNlbGYucGRmLmRvd25sb2FkX3VybCA9IGRvd25sb2FkX3VybDtcbiAgICAgICAgc2VsZi5wZGYudG90YWwgPSB0b3RhbDtcblxuICAgICAgICBzZWxmLmlzX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgPSAwO1xuICAgICAgICBzZWxmLmkgPSAwO1xuXG4gICAgICAgIHNlbGYudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgc2VsZi5jaGVja1N0YXR1cygpOyB9LCAyNTAwKTtcbiAgICAgICAgLy8gZG8gaXQgb25jZSB0aGUgZmlyc3QgdGltZVxuICAgICAgICBzZWxmLmNoZWNrU3RhdHVzKCk7XG5cbiAgICB9LFxuXG4gICAgY2hlY2tTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaSArPSAxO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogc2VsZi5wZGYucHJvZ3Jlc3NfdXJsLFxuICAgICAgICAgICAgZGF0YSA6IHsgdHMgOiAobmV3IERhdGUpLmdldFRpbWUoKSB9LFxuICAgICAgICAgICAgY2FjaGUgOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBzZWxmLnVwZGF0ZVByb2dyZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCArPSAxO1xuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzLmRvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciAmJiBzdGF0dXMubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlQcm9jZXNzRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBSUxFRDogXCIsIHJlcSwgXCIvXCIsIHRleHRTdGF0dXMsIFwiL1wiLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDA0ICYmIChzZWxmLmkgPiAyNSB8fCBzZWxmLm51bV9wcm9jZXNzZWQgPiAwKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHVwZGF0ZVByb2dyZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHsgZG9uZSA6IGZhbHNlLCBlcnJvciA6IGZhbHNlIH07XG4gICAgICAgIHZhciBwZXJjZW50O1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gZGF0YS5zdGF0dXM7XG4gICAgICAgIGlmICggY3VycmVudCA9PSAnRU9UJyB8fCBjdXJyZW50ID09ICdET05FJyApIHtcbiAgICAgICAgICAgIHN0YXR1cy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGF0YS5jdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwICogKCBjdXJyZW50IC8gc2VsZi5wZGYudG90YWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi5sYXN0X3BlcmNlbnQgIT0gcGVyY2VudCApIHtcbiAgICAgICAgICAgIHNlbGYubGFzdF9wZXJjZW50ID0gcGVyY2VudDtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgMTAwIHRpbWVzLCB3aGljaCBhbW91bnRzIHRvIH4xMDAgc2Vjb25kc1xuICAgICAgICBpZiAoIHNlbGYubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgc3RhdHVzLmVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5pcyhcIjp2aXNpYmxlXCIpICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5QbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApXG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciBkb3dubG9hZF9rZXkgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01hYyBPUyBYJykgIT0gLTEgPyAnUkVUVVJOJyA6ICdFTlRFUic7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPkFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIDxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+U2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC48L3NwYW4+PC9wPmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBBbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBTZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLmApO1xuXG4gICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuZmluZChcIi5kb25lXCIpLnNob3coKTtcbiAgICAgICAgICAgIHZhciAkZG93bmxvYWRfYnRuID0gc2VsZi4kZGlhbG9nLmZpbmQoJy5kb3dubG9hZC1wZGYnKTtcbiAgICAgICAgICAgIGlmICggISAkZG93bmxvYWRfYnRuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuID0gJCgnPGEgY2xhc3M9XCJkb3dubG9hZC1wZGYgYnRuIGJ0bi1wcmltYXJ5XCIgZG93bmxvYWQ9XCJkb3dubG9hZFwiPkRvd25sb2FkIHtJVEVNX1RJVExFfTwvYT4nLnJlcGxhY2UoJ3tJVEVNX1RJVExFfScsIHNlbGYuaXRlbV90aXRsZSkpLmF0dHIoJ2hyZWYnLCBzZWxmLnBkZi5kb3dubG9hZF91cmwpO1xuICAgICAgICAgICAgICAgIGlmICggJGRvd25sb2FkX2J0bi5nZXQoMCkuZG93bmxvYWQgPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmF0dHIoJ3RhcmdldCcsICdfYmxhbmsnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hcHBlbmRUbyhzZWxmLiRkaWFsb2cuZmluZChcIi5tb2RhbF9fZm9vdGVyXCIpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGxpbmsudHJpZ2dlcihcImNsaWNrLmdvb2dsZVwiKTtcblxuICAgICAgICAgICAgICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnLScsIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnkgOiAnUFQnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA6IGBQVCBEb3dubG9hZCAtICR7c2VsZi4kY29uZmlnLmRvd25sb2FkRm9ybWF0LnRvVXBwZXJDYXNlKCl9IC0gJHtzZWxmLiRjb25maWcudHJhY2tpbmdBY3Rpb259YCBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggd2luZG93LmhqICkgeyBoaigndGFnUmVjb3JkaW5nJywgWyBgUFQgRG93bmxvYWQgLSAke3NlbGYuJGNvbmZpZy5kb3dubG9hZEZvcm1hdC50b1VwcGVyQ2FzZSgpfSAtICR7c2VsZi4kY29uZmlnLnRyYWNraW5nQWN0aW9ufWAgXSkgfTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFByZXNzIHJldHVybiB0byBkb3dubG9hZC5gKTtcbiAgICAgICAgICAgIC8vIHN0aWxsIGNvdWxkIGNhbmNlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS50ZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfSAoJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWQpLmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGAke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1c1RleHQ6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYuX2xhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgICAgaWYgKCBzZWxmLl9sYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChzZWxmLl9sYXN0VGltZXIpOyBzZWxmLl9sYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2VsZi5fbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICBzZWxmLl9sYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICB9XG4gICAgfSxcblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbnZhciBkb3dubG9hZEZvcm07XG52YXIgZG93bmxvYWRGb3JtYXRPcHRpb25zO1xudmFyIHJhbmdlT3B0aW9ucztcbnZhciBkb3dubG9hZElkeCA9IDA7XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICBkb3dubG9hZEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZm9ybS1kb3dubG9hZC1tb2R1bGUnKTtcbiAgICBpZiAoICEgZG93bmxvYWRGb3JtICkgeyByZXR1cm4gOyB9XG5cblxuICAgIEhULmRvd25sb2FkZXIgPSBPYmplY3QuY3JlYXRlKEhULkRvd25sb2FkZXIpLmluaXQoe1xuICAgICAgICBwYXJhbXMgOiBIVC5wYXJhbXNcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci5zdGFydCgpO1xuXG4gICAgLy8gbm9uLWpxdWVyeT9cbiAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbbmFtZT1cImRvd25sb2FkX2Zvcm1hdFwiXScpKTtcbiAgICByYW5nZU9wdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF0nKSk7XG5cbiAgICB2YXIgZG93bmxvYWRTdWJtaXQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignW3R5cGU9XCJzdWJtaXRcIl0nKTtcblxuICAgIHZhciBoYXNGdWxsUGRmQWNjZXNzID0gZG93bmxvYWRGb3JtLmRhdGFzZXQuZnVsbFBkZkFjY2VzcyA9PSAnYWxsb3cnO1xuXG4gICAgdmFyIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICByYW5nZU9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihyYW5nZU9wdGlvbikge1xuICAgICAgICB2YXIgaW5wdXQgPSByYW5nZU9wdGlvbi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICBpbnB1dC5kaXNhYmxlZCA9ICEgcmFuZ2VPcHRpb24ubWF0Y2hlcyhgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldH49XCIke29wdGlvbi52YWx1ZX1cIl1gKTtcbiAgICAgIH0pXG4gICAgICBcbiAgICAgIC8vIGlmICggISBoYXNGdWxsUGRmQWNjZXNzICkge1xuICAgICAgLy8gICB2YXIgY2hlY2tlZCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXQ6Y2hlY2tlZGApO1xuICAgICAgLy8gICBpZiAoICEgY2hlY2tlZCApIHtcbiAgICAgIC8vICAgICAgIC8vIGNoZWNrIHRoZSBmaXJzdCBvbmVcbiAgICAgIC8vICAgICAgIHZhciBpbnB1dCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXRgKTtcbiAgICAgIC8vICAgICAgIGlucHV0LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgLy8gICB9XG4gICAgICAvLyB9XG5cbiAgICAgIHZhciBjdXJyZW50X3ZpZXcgPSAoIEhULnJlYWRlciAmJiBIVC5yZWFkZXIudmlldyApID8gIEhULnJlYWRlci52aWV3Lm5hbWUgOiAnc2VhcmNoJzsgLy8gcGljayBhIGRlZmF1bHRcbiAgICAgIHZhciBjaGVja2VkID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtjdXJyZW50X3ZpZXd9XCJdIGlucHV0OmNoZWNrZWRgKTtcbiAgICAgIGlmICggISBjaGVja2VkICkge1xuICAgICAgICAgIC8vIGNoZWNrIHRoZSBmaXJzdCBvbmVcbiAgICAgICAgICB2YXIgaW5wdXQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcihgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF1bZGF0YS12aWV3LXRhcmdldH49XCIke2N1cnJlbnRfdmlld31cIl0gaW5wdXRgKTtcbiAgICAgICAgICBpZiAoIGlucHV0ICkgeyBpbnB1dC5jaGVja2VkID0gdHJ1ZTsgfVxuICAgICAgfVxuXG4gICAgfVxuICAgIGRvd25sb2FkRm9ybWF0T3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKG9wdGlvbikge1xuICAgICAgb3B0aW9uLmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zKHRoaXMpO1xuICAgICAgfSlcbiAgICB9KVxuXG4gICAgcmFuZ2VPcHRpb25zLmZvckVhY2goZnVuY3Rpb24oZGl2KSB7XG4gICAgICAgIHZhciBpbnB1dCA9IGRpdi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICBpbnB1dC5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgZG93bmxvYWRGb3JtYXRPcHRpb25zLmZvckVhY2goZnVuY3Rpb24oZm9ybWF0T3B0aW9uKSB7XG4gICAgICAgICAgICAgICAgZm9ybWF0T3B0aW9uLmRpc2FibGVkID0gISAoIGRpdi5kYXRhc2V0LmRvd25sb2FkRm9ybWF0VGFyZ2V0LmluZGV4T2YoZm9ybWF0T3B0aW9uLnZhbHVlKSA+IC0xICk7XG4gICAgICAgICAgICB9KVxuICAgICAgICB9KVxuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zID0gZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBmb3JtYXRPcHRpb24gPSBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZmluZChpbnB1dCA9PiBpbnB1dC5jaGVja2VkKTtcbiAgICAgICAgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMoZm9ybWF0T3B0aW9uKTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IHRvIFBERlxuICAgIHZhciBwZGZGb3JtYXRPcHRpb24gPSBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZmluZChpbnB1dCA9PiBpbnB1dC52YWx1ZSA9PSAncGRmJyk7XG4gICAgcGRmRm9ybWF0T3B0aW9uLmNoZWNrZWQgPSB0cnVlO1xuICAgIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zKHBkZkZvcm1hdE9wdGlvbik7XG5cbiAgICB2YXIgdHVubmVsRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyN0dW5uZWwtZG93bmxvYWQtbW9kdWxlJyk7XG5cbiAgICBkb3dubG9hZEZvcm0uYWRkRXZlbnRMaXN0ZW5lcignc3VibWl0JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdmFyIGZvcm1hdE9wdGlvbiA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwiZG93bmxvYWRfZm9ybWF0XCJdOmNoZWNrZWQnKTtcbiAgICAgICAgdmFyIHJhbmdlT3B0aW9uID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJyYW5nZVwiXTpjaGVja2VkOm5vdCg6ZGlzYWJsZWQpJyk7XG5cbiAgICAgICAgdmFyIHByaW50YWJsZTtcblxuICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcblxuICAgICAgICBpZiAoICEgcmFuZ2VPcHRpb24gKSB7XG4gICAgICAgICAgICAvLyBubyB2YWxpZCByYW5nZSBvcHRpb24gd2FzIGNob3NlblxuICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgY2hvb3NlIGEgdmFsaWQgcmFuZ2UgZm9yIHRoaXMgZG93bmxvYWQgZm9ybWF0LlwiKTtcbiAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgYWN0aW9uID0gdHVubmVsRm9ybS5kYXRhc2V0LmFjdGlvblRlbXBsYXRlICsgKCBmb3JtYXRPcHRpb24udmFsdWUgPT0gJ3BsYWludGV4dC16aXAnID8gJ3BsYWludGV4dCcgOiBmb3JtYXRPcHRpb24udmFsdWUgKTtcblxuICAgICAgICB2YXIgc2VsZWN0aW9uID0geyBwYWdlczogW10gfTtcbiAgICAgICAgaWYgKCByYW5nZU9wdGlvbi52YWx1ZSA9PSAnc2VsZWN0ZWQtcGFnZXMnICkge1xuICAgICAgICAgICAgc2VsZWN0aW9uLnBhZ2VzID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuICAgICAgICAgICAgc2VsZWN0aW9uLmlzU2VsZWN0aW9uID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICggc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgICAgIHZhciBidXR0b25zID0gW107XG5cbiAgICAgICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBkb3dubG9hZC48L3A+XCIgXTtcbiAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgbGVmdCBvciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGJlIGxpc3RlZCBpbiB0aGUgZG93bmxvYWQgbW9kdWxlLlwiKTtcblxuICAgICAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWw6IFwiT0tcIixcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICBib290Ym94LmRpYWxvZyhtc2csIGJ1dHRvbnMpO1xuXG4gICAgICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0gZWxzZSBpZiAoIHJhbmdlT3B0aW9uLnZhbHVlLmluZGV4T2YoJ2N1cnJlbnQtcGFnZScpID4gLTEgKSB7XG4gICAgICAgICAgICB2YXIgcGFnZTtcbiAgICAgICAgICAgIHN3aXRjaChyYW5nZU9wdGlvbi52YWx1ZSkge1xuICAgICAgICAgICAgICAgIGNhc2UgJ2N1cnJlbnQtcGFnZSc6XG4gICAgICAgICAgICAgICAgICAgIHBhZ2UgPSBbIEhULnJlYWRlci52aWV3LmN1cnJlbnRMb2NhdGlvbigpIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2N1cnJlbnQtcGFnZS12ZXJzbyc6XG4gICAgICAgICAgICAgICAgICAgIHBhZ2UgPSBbIEhULnJlYWRlci52aWV3LmN1cnJlbnRMb2NhdGlvbignVkVSU08nKSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjdXJyZW50LXBhZ2UtcmVjdG8nOlxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gWyBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oJ1JFQ1RPJykgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoICEgcGFnZSApIHtcbiAgICAgICAgICAgICAgICAvLyBwcm9iYWJseSBpbXBvc3NpYmxlP1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZWN0aW9uLnBhZ2VzID0gWyBwYWdlIF07XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgc2VsZWN0aW9uLnNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IgP1xuICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24oc2VsZWN0aW9uLnBhZ2VzKSA6IFxuICAgICAgICAgICAgICAgICBzZWxlY3Rpb24ucGFnZXM7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHJhbmdlT3B0aW9uLmRhdGFzZXQuaXNQYXJ0aWFsID09ICd0cnVlJyAmJiBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoIDw9IDEwICkge1xuXG4gICAgICAgICAgICAvLyBkZWxldGUgYW55IGV4aXN0aW5nIGlucHV0c1xuICAgICAgICAgICAgdHVubmVsRm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dDpub3QoW2RhdGEtZml4ZWRdKScpLmZvckVhY2goZnVuY3Rpb24oaW5wdXQpIHtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLnJlbW92ZUNoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGlmICggZm9ybWF0T3B0aW9uLnZhbHVlID09ICdpbWFnZScgKSB7XG4gICAgICAgICAgICAgICAgdmFyIHNpemVfYXR0ciA9IFwidGFyZ2V0X3BwaVwiO1xuICAgICAgICAgICAgICAgIHZhciBpbWFnZV9mb3JtYXRfYXR0ciA9ICdmb3JtYXQnO1xuICAgICAgICAgICAgICAgIHZhciBzaXplX3ZhbHVlID0gXCIzMDBcIjtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPT0gMSApIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2xpZ2h0IGRpZmZlcmVuY2VcbiAgICAgICAgICAgICAgICAgICAgYWN0aW9uID0gJy9jZ2kvaW1nc3J2L2ltYWdlJztcbiAgICAgICAgICAgICAgICAgICAgc2l6ZV9hdHRyID0gXCJzaXplXCI7XG4gICAgICAgICAgICAgICAgICAgIHNpemVfdmFsdWUgPSBcInBwaTozMDBcIjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBzaXplX2F0dHIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHNpemVfdmFsdWUpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgaW1hZ2VfZm9ybWF0X2F0dHIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsICdpbWFnZS9qcGVnJyk7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBmb3JtYXRPcHRpb24udmFsdWUgPT0gJ3BsYWludGV4dC16aXAnICkge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsICdidW5kbGVfZm9ybWF0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgXCJ6aXBcIik7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXEuZm9yRWFjaChmdW5jdGlvbihyYW5nZSkge1xuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIFwic2VxXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIHJhbmdlKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIHR1bm5lbEZvcm0uYWN0aW9uID0gYWN0aW9uO1xuICAgICAgICAgICAgLy8gSFQuZGlzYWJsZVVubG9hZFRpbWVvdXQgPSB0cnVlO1xuXG4gICAgICAgICAgICAvLyByZW1vdmUgb2xkIGlmcmFtZXNcbiAgICAgICAgICAgIGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3JBbGwoJ2lmcmFtZS5kb3dubG9hZC1tb2R1bGUnKS5mb3JFYWNoKGZ1bmN0aW9uKGlmcmFtZSkge1xuICAgICAgICAgICAgICAgIGRvY3VtZW50LmJvZHkucmVtb3ZlQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIH0pXG5cbiAgICAgICAgICAgIGRvd25sb2FkSWR4ICs9IDE7XG4gICAgICAgICAgICB2YXIgdHJhY2tlciA9IGBEJHtkb3dubG9hZElkeH06YDtcbiAgICAgICAgICAgIHZhciB0cmFja2VyX2lucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgIHRyYWNrZXJfaW5wdXQuc2V0QXR0cmlidXRlKCd0eXBlJywgJ2hpZGRlbicpO1xuICAgICAgICAgICAgdHJhY2tlcl9pbnB1dC5zZXRBdHRyaWJ1dGUoJ25hbWUnLCAndHJhY2tlcicpO1xuICAgICAgICAgICAgdHJhY2tlcl9pbnB1dC5zZXRBdHRyaWJ1dGUoJ3ZhbHVlJywgdHJhY2tlcik7XG4gICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKHRyYWNrZXJfaW5wdXQpO1xuICAgICAgICAgICAgdmFyIGlmcmFtZSA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lmcmFtZScpO1xuICAgICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnbmFtZScsIGBkb3dubG9hZC1tb2R1bGUtJHtkb3dubG9hZElkeH1gKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ2NsYXNzJywgJ2Rvd25sb2FkLW1vZHVsZScpO1xuICAgICAgICAgICAgaWZyYW1lLnN0eWxlLm9wYWNpdHkgPSAwO1xuICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5hcHBlbmRDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgdHVubmVsRm9ybS5zZXRBdHRyaWJ1dGUoJ3RhcmdldCcsIGlmcmFtZS5nZXRBdHRyaWJ1dGUoJ25hbWUnKSk7XG5cbiAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmRpc2FibGVkID0gdHJ1ZTtcbiAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmNsYXNzTGlzdC5hZGQoJ2J0bi1sb2FkaW5nJyk7XG5cbiAgICAgICAgICAgIHZhciB0cmFja2VySW50ZXJ2YWwgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICB2YXIgdmFsdWUgPSAkLmNvb2tpZSgndHJhY2tlcicpIHx8ICcnO1xuICAgICAgICAgICAgICAgIGlmICggSFQuaXNfZGV2ICkge1xuICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tP1wiLCB0cmFja2VyLCB2YWx1ZSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICggdmFsdWUuaW5kZXhPZih0cmFja2VyKSA+IC0xICkge1xuICAgICAgICAgICAgICAgICAgICAkLnJlbW92ZUNvb2tpZSgndHJhY2tlcicsIHsgcGF0aDogJy8nfSk7XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodHJhY2tlckludGVydmFsKTtcbiAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuY2xhc3NMaXN0LnJlbW92ZSgnYnRuLWxvYWRpbmcnKTtcbiAgICAgICAgICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuZGlzYWJsZWQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgSFQuZGlzYWJsZVVubG9hZFRpbWVvdXQgPSBmYWxzZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LCAxMDApO1xuXG5cbiAgICAgICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgXG4gICAgICAgICAgICAgICAgbGFiZWwgOiAnLScsIFxuICAgICAgICAgICAgICAgIGNhdGVnb3J5IDogJ1BUJywgXG4gICAgICAgICAgICAgICAgYWN0aW9uIDogYFBUIERvd25sb2FkIC0gJHtmb3JtYXRPcHRpb24udmFsdWUudG9VcHBlckNhc2UoKX0gLSAke3JhbmdlT3B0aW9uLnZhbHVlfWAgXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGlmICggd2luZG93LmhqICkgeyBoaigndGFnUmVjb3JkaW5nJywgWyBgUFQgRG93bmxvYWQgLSAke2Zvcm1hdE9wdGlvbi52YWx1ZS50b1VwcGVyQ2FzZSgpfSAtICR7cmFuZ2VPcHRpb24udmFsdWV9YCBdKSB9O1xuXG4gICAgICAgICAgICB0dW5uZWxGb3JtLnN1Ym1pdCgpO1xuXG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgX2Zvcm1hdF90aXRsZXMgPSB7fTtcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMucGRmID0gJ1BERic7XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLmVwdWIgPSAnRVBVQic7XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLnBsYWludGV4dCA9ICdUZXh0ICgudHh0KSc7XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzWydwbGFpbnRleHQtemlwJ10gPSAnVGV4dCAoLnppcCknO1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5pbWFnZSA9ICdJbWFnZSAoSlBFRyknO1xuXG4gICAgICAgIC8vIGludm9rZSB0aGUgZG93bmxvYWRlclxuICAgICAgICBIVC5kb3dubG9hZGVyLmRvd25sb2FkUGRmKHtcbiAgICAgICAgICAgIHNyYzogYWN0aW9uICsgJz9pZD0nICsgSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgaXRlbV90aXRsZTogX2Zvcm1hdF90aXRsZXNbZm9ybWF0T3B0aW9uLnZhbHVlXSxcbiAgICAgICAgICAgIHNlbGVjdGlvbjogc2VsZWN0aW9uLFxuICAgICAgICAgICAgZG93bmxvYWRGb3JtYXQ6IGZvcm1hdE9wdGlvbi52YWx1ZSxcbiAgICAgICAgICAgIHRyYWNraW5nQWN0aW9uOiByYW5nZU9wdGlvbi52YWx1ZVxuICAgICAgICB9KTtcblxuICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSlcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0O1xuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2sgJyArXG4gICAgICAgICAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICAgICAgICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPjxpIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWhlbHBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5IZWxwOiBFbWJlZGRpbmcgSGF0aGlUcnVzdCBCb29rczwvc3Bhbj48L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LXNjcm9sbFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctZmxpcFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAvLyAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNlbWJlZEh0bWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgSFQuYW5hbHl0aWNzLmdldENvbnRlbnRHcm91cERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjaGVhdFxuICAgIHZhciBzdWZmaXggPSAnJztcbiAgICB2YXIgY29udGVudF9ncm91cCA9IDQ7XG4gICAgaWYgKCAkKFwiI3NlY3Rpb25cIikuZGF0YShcInZpZXdcIikgPT0gJ3Jlc3RyaWN0ZWQnICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDI7XG4gICAgICBzdWZmaXggPSAnI3Jlc3RyaWN0ZWQnO1xuICAgIH0gZWxzZSBpZiAoIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoXCJkZWJ1Zz1zdXBlclwiKSA+IC0xICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDM7XG4gICAgICBzdWZmaXggPSAnI3N1cGVyJztcbiAgICB9XG4gICAgcmV0dXJuIHsgaW5kZXggOiBjb250ZW50X2dyb3VwLCB2YWx1ZSA6IEhULnBhcmFtcy5pZCArIHN1ZmZpeCB9O1xuXG4gIH1cblxuICBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYgPSBmdW5jdGlvbihocmVmKSB7XG4gICAgdmFyIHVybCA9ICQudXJsKGhyZWYpO1xuICAgIHZhciBuZXdfaHJlZiA9IHVybC5zZWdtZW50KCk7XG4gICAgbmV3X2hyZWYucHVzaCgkKFwiaHRtbFwiKS5kYXRhKCdjb250ZW50LXByb3ZpZGVyJykpO1xuICAgIG5ld19ocmVmLnB1c2godXJsLnBhcmFtKFwiaWRcIikpO1xuICAgIHZhciBxcyA9ICcnO1xuICAgIGlmICggbmV3X2hyZWYuaW5kZXhPZihcInNlYXJjaFwiKSA+IC0xICYmIHVybC5wYXJhbSgncTEnKSAgKSB7XG4gICAgICBxcyA9ICc/cTE9JyArIHVybC5wYXJhbSgncTEnKTtcbiAgICB9XG4gICAgbmV3X2hyZWYgPSBcIi9cIiArIG5ld19ocmVmLmpvaW4oXCIvXCIpICsgcXM7XG4gICAgcmV0dXJuIG5ld19ocmVmO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzLmdldFBhZ2VIcmVmID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZigpO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzLmdldFRpdGxlID0gZnVuY3Rpb24oKSB7XG4gICAgY29uc3QgdGl0bGUgPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCd0aXRsZScpO1xuICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUgPT0gJy9jZ2kvcHQnICYmIHRpdGxlLmRhdGFzZXQudGl0bGUgKSB7XG4gICAgICByZXR1cm4gdGl0bGUuZGF0YXNldC50aXRsZTtcbiAgICB9XG4gICAgcmV0dXJuIGRvY3VtZW50LnRpdGxlO1xuICB9XG5cbiAgZG9jdW1lbnQucXVlcnlTZWxlY3RvcigndGl0bGUnKS5kYXRhc2V0LnRpdGxlID0gZG9jdW1lbnQudGl0bGU7XG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRtZW51OyB2YXIgJHRyaWdnZXI7IHZhciAkaGVhZGVyOyB2YXIgJG5hdmlnYXRvcjtcbiAgSFQgPSBIVCB8fCB7fTtcblxuICBIVC5tb2JpZnkgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGlmICggJChcImh0bWxcIikuaXMoXCIuZGVza3RvcFwiKSApIHtcbiAgICAvLyAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiZGVza3RvcFwiKS5yZW1vdmVDbGFzcyhcIm5vLW1vYmlsZVwiKTtcbiAgICAvLyB9XG5cbiAgICAkaGVhZGVyID0gJChcImhlYWRlclwiKTtcbiAgICAkbmF2aWdhdG9yID0gJChcIi5hcHAtLXJlYWRlci0tbmF2aWdhdG9yXCIpO1xuICAgIGlmICggJG5hdmlnYXRvci5sZW5ndGggKSB7XG4gICAgICBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPSB0cnVlO1xuICAgICAgLy8gJG5hdmlnYXRvci5nZXQoMCkuc3R5bGUuc2V0UHJvcGVydHkoJy0taGVpZ2h0JywgYC0keyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKSAqIDAuOTB9cHhgKTtcbiAgICAgIC8vICRuYXZpZ2F0b3IuZ2V0KDApLmRhdGFzZXQub3JpZ2luYWxIZWlnaHQgPSBgeyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKX1weGA7XG4gICAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tbmF2aWdhdG9yLWhlaWdodCcsIGAkeyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKX1weGApO1xuICAgICAgLy8gdmFyICRleHBhbmRvID0gJG5hdmlnYXRvci5maW5kKFwiLmFjdGlvbi1leHBhbmRvXCIpO1xuICAgICAgdmFyICRleHBhbmRvID0gJChcIiNhY3Rpb24tZXhwYW5kb1wiKTtcbiAgICAgICRleHBhbmRvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb2N1bWVudC5ib2R5LmRhdGFzZXQuZXhwYW5kZWQgPSAhICggZG9jdW1lbnQuYm9keS5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApO1xuICAgICAgICB0aGlzLnNldEF0dHJpYnV0ZSgnYXJpYS1leHBhbmRlZCcsICggZG9jdW1lbnQuYm9keS5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApKTtcbiAgICAgICAgLy8gdmFyIG5hdmlnYXRvckhlaWdodCA9IDA7XG4gICAgICAgIC8vIGlmICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICkge1xuICAgICAgICAvLyAgIG5hdmlnYXRvckhlaWdodCA9ICRuYXZpZ2F0b3IuZ2V0KDApLmRhdGFzZXQub3JpZ2luYWxIZWlnaHQ7XG4gICAgICAgIC8vIH1cbiAgICAgICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLW5hdmlnYXRvci1oZWlnaHQnLCBuYXZpZ2F0b3JIZWlnaHQpO1xuICAgICAgfSlcblxuICAgICAgaWYgKCBIVC5wYXJhbXMudWkgPT0gJ2VtYmVkJyApIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJGV4cGFuZG8udHJpZ2dlcignY2xpY2snKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgSFQuJG1lbnUgPSAkbWVudTtcblxuICAgIHZhciAkc2lkZWJhciA9ICQoXCIjc2lkZWJhclwiKTtcblxuICAgICR0cmlnZ2VyID0gJHNpZGViYXIuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKTtcblxuICAgICQoXCIjYWN0aW9uLW1vYmlsZS10b2dnbGUtZnVsbHNjcmVlblwiKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0pXG5cbiAgICBIVC51dGlscyA9IEhULnV0aWxzIHx8IHt9O1xuXG4gICAgLy8gJHNpZGViYXIub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI3NpZGViYXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgLy8gaGlkZSB0aGUgc2lkZWJhclxuICAgICAgdmFyICR0aGlzID0gJChldmVudC50YXJnZXQpLmNsb3Nlc3QoXCJpbnB1dCxzZWxlY3QsYnV0dG9uLGFcIik7XG4gICAgICBpZiAoICR0aGlzLmlzKFwiaW5wdXRbdHlwZT0ndGV4dCddLHNlbGVjdFwiKSApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKS5sZW5ndGggKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMuaXMoXCJidXR0b24sYVwiKSApIHtcbiAgICAgICAgSFQudG9nZ2xlKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgaWYgKCBIVCAmJiBIVC51dGlscyAmJiBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSApIHtcbiAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgfVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gJ3RydWUnO1xuICB9XG5cbiAgSFQudG9nZ2xlID0gZnVuY3Rpb24oc3RhdGUpIHtcblxuICAgIC8vICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgLy8gJChcIi5zaWRlYmFyLWNvbnRhaW5lclwiKS5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQuc2lkZWJhckV4cGFuZGVkID0gc3RhdGU7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IHN0YXRlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG5cbiAgICBkb2N1bWVudC5ib2R5LmRhdGFzZXQuc2lkZWJhck5hcnJvd1N0YXRlID0gc3RhdGUgPyAnb3BlbicgOiAnY2xvc2VkJztcbiAgICAkKFwiYWN0aW9uLXRvZ2dsZS1zaWRlYmFyLW5hcnJvd1wiKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuXG4gICAgLy8gdmFyIHhsaW5rX2hyZWY7XG4gICAgLy8gaWYgKCAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT0gJ3RydWUnICkge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtZXhwYW5kZWQnO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1jb2xsYXBzZWQnO1xuICAgIC8vIH1cbiAgICAvLyAkdHJpZ2dlci5maW5kKFwic3ZnIHVzZVwiKS5hdHRyKFwieGxpbms6aHJlZlwiLCB4bGlua19ocmVmKTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoSFQubW9iaWZ5LCAxMDAwKTtcblxuICAvLyB2YXIgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5ID0gZnVuY3Rpb24oKSB7XG4gIC8vICAgdmFyIGggPSAkKFwiI3NpZGViYXIgLnNpZGViYXItdG9nZ2xlLWJ1dHRvblwiKS5vdXRlckhlaWdodCgpIHx8IDQwO1xuICAvLyAgIHZhciB0b3AgPSAoICQoXCJoZWFkZXJcIikuaGVpZ2h0KCkgKyBoICkgKiAxLjA1O1xuICAvLyAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10b29sYmFyLWhvcml6b250YWwtdG9wJywgdG9wICsgJ3B4Jyk7XG4gIC8vIH1cbiAgLy8gJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkpO1xuICAvLyB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkoKTtcblxuICAkKFwiaHRtbFwiKS5nZXQoMCkuc2V0QXR0cmlidXRlKCdkYXRhLXNpZGViYXItZXhwYW5kZWQnLCBmYWxzZSk7XG5cbn0pXG4iLCJpZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT0gJ2Z1bmN0aW9uJykge1xuICAvLyBNdXN0IGJlIHdyaXRhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsIFwiYXNzaWduXCIsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykgeyAvLyAubGVuZ3RoIG9mIGZ1bmN0aW9uIGlzIDJcbiAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgIGlmICh0YXJnZXQgPT0gbnVsbCkgeyAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuXG4gICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICAgICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkgeyAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdG87XG4gICAgfSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8vIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qc2Vyei9qc19waWVjZS9ibG9iL21hc3Rlci9ET00vQ2hpbGROb2RlL2FmdGVyKCkvYWZ0ZXIoKS5tZFxuKGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBpZiAoaXRlbS5oYXNPd25Qcm9wZXJ0eSgnYWZ0ZXInKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaXRlbSwgJ2FmdGVyJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFmdGVyKCkge1xuICAgICAgICB2YXIgYXJnQXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICBkb2NGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBcbiAgICAgICAgYXJnQXJyLmZvckVhY2goZnVuY3Rpb24gKGFyZ0l0ZW0pIHtcbiAgICAgICAgICB2YXIgaXNOb2RlID0gYXJnSXRlbSBpbnN0YW5jZW9mIE5vZGU7XG4gICAgICAgICAgZG9jRnJhZy5hcHBlbmRDaGlsZChpc05vZGUgPyBhcmdJdGVtIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKGFyZ0l0ZW0pKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkb2NGcmFnLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KShbRWxlbWVudC5wcm90b3R5cGUsIENoYXJhY3RlckRhdGEucHJvdG90eXBlLCBEb2N1bWVudFR5cGUucHJvdG90eXBlXSk7XG5cbmZ1bmN0aW9uIFJlcGxhY2VXaXRoUG9seWZpbGwoKSB7XG4gICd1c2Utc3RyaWN0JzsgLy8gRm9yIHNhZmFyaSwgYW5kIElFID4gMTBcbiAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSwgaSA9IGFyZ3VtZW50cy5sZW5ndGgsIGN1cnJlbnROb2RlO1xuICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICBpZiAoIWkpIC8vIGlmIHRoZXJlIGFyZSBubyBhcmd1bWVudHNcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gIHdoaWxlIChpLS0pIHsgLy8gaS0tIGRlY3JlbWVudHMgaSBhbmQgcmV0dXJucyB0aGUgdmFsdWUgb2YgaSBiZWZvcmUgdGhlIGRlY3JlbWVudFxuICAgIGN1cnJlbnROb2RlID0gYXJndW1lbnRzW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudE5vZGUgIT09ICdvYmplY3QnKXtcbiAgICAgIGN1cnJlbnROb2RlID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGN1cnJlbnROb2RlKTtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnBhcmVudE5vZGUpe1xuICAgICAgY3VycmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XG4gICAgfVxuICAgIC8vIHRoZSB2YWx1ZSBvZiBcImlcIiBiZWxvdyBpcyBhZnRlciB0aGUgZGVjcmVtZW50XG4gICAgaWYgKCFpKSAvLyBpZiBjdXJyZW50Tm9kZSBpcyB0aGUgZmlyc3QgYXJndW1lbnQgKGN1cnJlbnROb2RlID09PSBhcmd1bWVudHNbMF0pXG4gICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKGN1cnJlbnROb2RlLCB0aGlzKTtcbiAgICBlbHNlIC8vIGlmIGN1cnJlbnROb2RlIGlzbid0IHRoZSBmaXJzdFxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShjdXJyZW50Tm9kZSwgdGhpcy5wcmV2aW91c1NpYmxpbmcpO1xuICB9XG59XG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoKVxuICAgIEVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcbmlmICghQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoKSBcbiAgICBEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcblxuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRmb3JtID0gJChcIi5mb3JtLXNlYXJjaC12b2x1bWVcIik7XG5cbiAgdmFyICRib2R5ID0gJChcImJvZHlcIik7XG5cbiAgJCh3aW5kb3cpLm9uKCd1bmRvLWxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAkKFwiYnV0dG9uLmJ0bi1sb2FkaW5nXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKS5yZW1vdmVDbGFzcyhcImJ0bi1sb2FkaW5nXCIpO1xuICB9KVxuXG4gICQoXCJib2R5XCIpLm9uKCdzdWJtaXQnLCAnZm9ybS5mb3JtLXNlYXJjaC12b2x1bWUnLCBmdW5jdGlvbihldmVudCkge1xuICAgIEhULmJlZm9yZVVubG9hZFRpbWVvdXQgPSAxNTAwMDtcbiAgICB2YXIgJGZvcm1fID0gJCh0aGlzKTtcblxuICAgIHZhciAkc3VibWl0ID0gJGZvcm1fLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm1fLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgIH0pXG5cbiAgICBpZiAoIEhULnJlYWRlciAmJiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yICkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yLnN1Ym1pdCgkZm9ybV8uZ2V0KDApKTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IHByb2Nlc3NpbmdcbiAgfSlcblxuICAkKFwiI2FjdGlvbi1zdGFydC1qdW1wXCIpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ogPSBwYXJzZUludCgkKHRoaXMpLmRhdGEoJ3N6JyksIDEwKTtcbiAgICB2YXIgdmFsdWUgPSBwYXJzZUludCgkKHRoaXMpLnZhbCgpLCAxMCk7XG4gICAgdmFyIHN0YXJ0ID0gKCB2YWx1ZSAtIDEgKSAqIHN6ICsgMTtcbiAgICB2YXIgJGZvcm1fID0gJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIik7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N0YXJ0JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N0YXJ0fVwiIC8+YCk7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N6JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N6fVwiIC8+YCk7XG4gICAgJGZvcm1fLnN1Ym1pdCgpO1xuICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI3ZlcnNpb25JY29uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
