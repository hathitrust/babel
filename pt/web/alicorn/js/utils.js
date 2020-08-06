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
  if (HT.is_dev) {
    HT.force_size = 200;
  }

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
"use strict";

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
        // $("a[data-toggle*=download]").addClass("interactive").click(function(e) {
        $("a[data-toggle*=download]").addClass("interactive");
        $("body").on("click", "a[data-toggle*=download]", function (e) {
            e.preventDefault();
            bootbox.hideAll();
            if ($(this).attr("rel") == 'allow') {

                // --- THE MODE IS TOGGLED
                // if ( this.dataset.photocopier == 'true' && ! sessionStorage.getItem('photocopier.confirmed') ) {
                //     if ( ! window.confirm(photocopier_message) ) {
                //         e.stopPropagation();
                //         return false;
                //     }
                //     sessionStorage.setItem('photocopier.confirmed', true);
                // }


                if (self.options.params.download_progress_base == null) {
                    return true;
                }
                self.downloadPdf(this);
            } else {
                self.explainPdfAccess(this);
            }
            return false;
        });
    },

    explainPdfAccess: function explainPdfAccess(link) {
        var html = $("#noDownloadAccess").html();
        html = html.replace('{DOWNLOAD_LINK}', $(this).attr("href"));
        this.$dialog = bootbox.alert(html);
        // this.$dialog.addClass("login");
    },

    downloadPdf: function downloadPdf(link) {
        var self = this;
        self.$link = $(link);
        self.src = $(link).attr('href');
        self.item_title = $(link).data('title') || 'PDF';

        if (self.$link.data('range') == 'yes') {
            if (!self.$link.data('seq')) {
                return;
            }
        }

        var html =
        // '<p>Building your PDF...</p>' +
        "<div class=\"initial\"><p>Setting up the download...</div>" + "<div class=\"offscreen\" role=\"status\" aria-atomic=\"true\" aria-live=\"polite\"></div>" + '<div class="progress progress-striped active hide" aria-hidden="true">' + '<div class="bar" width="0%"></div>' + '</div>' +
        // '<div class="alert alert-block alert-success done hide">' +
        //     '<p>All done!</p>' +
        // '</div>' + 
        "<div><p><a href=\"https://www.hathitrust.org/help_digital_library#DownloadTime\" target=\"_blank\">What affects the download speed?</a></p></div>";

        var header = 'Building your ' + self.item_title;
        var total = self.$link.data('total') || 0;
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

        // self.updateStatusText(`Building your ${self.item_title}.`);

        self.requestDownload();
    },

    requestDownload: function requestDownload() {
        var self = this;
        var data = {};
        if (self.$link.data('seq')) {
            data['seq'] = self.$link.data('seq');
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
                if (req.status == 503) {
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
            self.$dialog.find(".initial").html("<p>Please wait while we build your " + self.item_title + ".</p>");
            self.$dialog.find(".progress").removeClass("hide");
            self.updateStatusText("Please wait while we build your " + self.item_title + ".");
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html("<p>All done! Your " + self.item_title + " is ready for download. <span class=\"offscreen\">Select " + download_key + " to download.</span></p>");
            self.updateStatusText("All done! Your " + self.item_title + " is ready for download. Select " + download_key + " to download.");

            // self.$dialog.find(".done").show();
            var $download_btn = self.$dialog.find('.download-pdf');
            if (!$download_btn.length) {
                $download_btn = $('<a class="download-pdf btn btn-primary" download="download">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
                if ($download_btn.get(0).download == undefined) {
                    $download_btn.attr('target', '_blank');
                }
                $download_btn.appendTo(self.$dialog.find(".modal__footer")).on('click', function (e) {
                    self.$link.trigger("click.google");
                    setTimeout(function () {
                        self.$dialog.closeModal();
                        $download_btn.remove();
                        HT.reader.controls.selectinator._clearSelection();
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
            self.$dialog.find(".initial").text("Please wait while we build your " + self.item_title + " (" + Math.ceil(percent) + "% completed).");
            self.updateStatusText(Math.ceil(percent) + "% completed");
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

head.ready(function () {
    HT.downloader = Object.create(HT.Downloader).init({
        params: HT.params
    });

    HT.downloader.start();

    var num_page_downloads = 0;
    $("a[data-photocopier]").on('click', function (e) {
        if (this.dataset.photocopier == 'true') {
            if (num_page_downloads == 0 || false && num_page_downloads % 5 == 0) {
                if (!window.confirm(photocopier_message)) {
                    e.preventDefault();
                    e.stopPropagation();
                    return false;
                }
            }
            num_page_downloads += 1;
        }
    });

    // and do this here
    $("#selectedPagesPdfLink").on('click', function (e) {
        e.preventDefault();

        var printable = HT.reader.controls.selectinator._getPageSelection();

        if (printable.length == 0) {
            var buttons = [];

            var msg = ["<p>You haven't selected any pages to print.</p>"];
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
            msg.push("<p>Pages you select will appear in the selection contents <button style=\"background-color: #666; border-color: #eee\" class=\"btn square\"><i class=\"icomoon icomoon-papers\" style=\"color: white; font-size: 14px;\" /></button>");

            msg = msg.join("\n");

            buttons.push({
                label: "OK",
                'class': 'btn-dismiss'
            });
            bootbox.dialog(msg, buttons);
            return false;
        }

        var seq = HT.reader.controls.selectinator._getFlattenedSelection(printable);

        $(this).data('seq', seq);
        HT.downloader.downloadPdf(this);
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

head.ready(function () {

    return;

    var inited = false;

    var $form = $("#search-modal form");

    var $input = $form.find("input.search-input-text");
    var $input_label = $form.find("label[for='q1-input']");
    var $select = $form.find(".control-searchtype");
    var $search_target = $form.find(".search-target");
    var $ft = $form.find("span.funky-full-view");

    var $backdrop = null;

    var $action = $("#action-search-hathitrust");
    $action.on('click', function () {
        bootbox.show('search-modal', {
            onShow: function onShow(modal) {
                $input.focus();
            }
        });
    });

    var _setup = {};
    _setup.ls = function () {
        $select.hide();
        $input.attr('placeholder', 'Search words about or within the items');
        $input_label.text('Search full-text index');
        if (inited) {
            HT.update_status("Search will use the full-text index.");
        }
    };

    _setup.catalog = function () {
        $select.show();
        $input.attr('placeholder', 'Search words about the items');
        $input_label.text('Search catalog index');
        if (inited) {
            HT.update_status("Search will use the catalog index; you can limit your search to a selection of fields.");
        }
    };

    var target = $search_target.find("input:checked").val();
    _setup[target]();
    inited = true;

    var prefs = HT.prefs.get();
    if (prefs.search && prefs.search.ft) {
        $("input[name=ft]").attr('checked', 'checked');
    }

    $search_target.on('change', 'input[type="radio"]', function (e) {
        var target = this.value;
        _setup[target]();
        HT.analytics.trackEvent({ label: "-", category: "HT Search", action: target });
    });

    // $form.delegate(':input', 'focus change', function(e) {
    //     console.log("FOCUSING", this);
    //     $form.addClass("focused");
    //     if ( $backdrop == null ) {
    //         $backdrop = $('<div class="modal__overlay invisible"></div>');
    //         $backdrop.on('click', function() {
    //             close_search_form();
    //         });
    //     }
    //     $backdrop.appendTo($("body")).show();
    // })

    // $("body").on('focus', ':input,a', function(e) {
    //     var $this = $(this);
    //     if ( ! $this.closest(".nav-search-form").length ) {
    //         close_search_form();
    //     }
    // });

    // var close_search_form = function() {
    //     $form.removeClass("focused");
    //     if ( $backdrop != null ) {
    //         $backdrop.detach();
    //         $backdrop.hide();
    //     }
    // }

    // add event handler for submit to check for empty query or asterisk
    $form.submit(function (event) {

        if (!this.checkValidity()) {
            this.reportValidity();
            return false;
        }

        //check for blank or single asterisk
        var $input = $(this).find("input[name=q1]");
        var query = $input.val();
        query = $.trim(query);
        if (query === '') {
            alert("Please enter a search term.");
            $input.trigger('blur');
            return false;
        }
        // // *  Bill says go ahead and forward a query with an asterisk   ######
        // else if (query === '*')
        // {
        //   // change q1 to blank
        //   $("#q1-input").val("")
        //   $(".search-form").submit();
        // }
        // ##################################################################*
        else {

                // save last settings
                var searchtype = target == 'ls' ? 'all' : $select.find("select").val();
                HT.prefs.set({ search: { ft: $("input[name=ft]:checked").length > 0, target: target, searchtype: searchtype } });

                return true;
            }
    });
});
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
    $navigator = $(".navigator");
    if ($navigator.length) {
      document.documentElement.dataset.expanded = true;
      $navigator.get(0).style.setProperty('--height', "-" + $navigator.outerHeight() * 0.90 + "px");
      $navigator.get(0).dataset.originalHeight = "{$navigator.outerHeight()}px";
      document.documentElement.style.setProperty('--navigator-height', $navigator.outerHeight() + "px");
      var $expando = $navigator.find(".action-expando");
      $expando.on('click', function () {
        document.documentElement.dataset.expanded = !(document.documentElement.dataset.expanded == 'true');
        var navigatorHeight = 0;
        if (document.documentElement.dataset.expanded == 'true') {
          navigatorHeight = $navigator.get(0).dataset.originalHeight;
        }
        document.documentElement.style.setProperty('--navigator-height', navigatorHeight);
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
    $("body").on('click', '.sidebar-container', function (event) {
      // hide the sidebar
      var $this = $(event.target);
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

    // var vh = window.innerHeight * 0.01;
    // document.documentElement.style.setProperty('--vh', vh + 'px');

    // $(window).on("resize", function() {
    //     var vh = window.innerHeight * 0.01;
    //     document.documentElement.style.setProperty('--vh', vh + 'px');
    // })

    // $(window).on("orientationchange", function() {
    //     setTimeout(function() {
    //         var vh = window.innerHeight * 0.01;
    //         document.documentElement.style.setProperty('--vh', vh + 'px');

    //         HT.utils.handleOrientationChange();
    //     }, 100);
    // })
    if (HT && HT.utils && HT.utils.handleOrientationChange) {
      HT.utils.handleOrientationChange();
    }
    document.documentElement.dataset.expanded = 'true';
  };

  HT.toggle = function (state) {

    // $trigger.attr('aria-expanded', state);
    $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', state);
    $("html").get(0).dataset.sidebarExpanded = state;
    $("html").get(0).dataset.view = state ? 'options' : 'viewer';

    // var xlink_href;
    // if ( $trigger.attr('aria-expanded') == 'true' ) {
    //   xlink_href = '#panel-expanded';
    // } else {
    //   xlink_href = '#panel-collapsed';
    // }
    // $trigger.find("svg use").attr("xlink:href", xlink_href);
  };

  setTimeout(HT.mobify, 1000);

  var updateToolbarTopProperty = function updateToolbarTopProperty() {
    var h = $("#sidebar .sidebar-toggle-button").outerHeight() || 40;
    var top = ($("header").height() + h) * 1.05;
    document.documentElement.style.setProperty('--toolbar-horizontal-top', top + 'px');
  };
  $(window).on('resize', updateToolbarTopProperty);
  updateToolbarTopProperty();

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwicG9seWZpbGxzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsInJlbmV3X2F1dGgiLCJlbnRpdHlJRCIsInNvdXJjZSIsIl9fcmVuZXdpbmciLCJzZXRUaW1lb3V0IiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIm9uIiwiZXZlbnQiLCJNT05USFMiLCIkZW1lcmdlbmN5X2FjY2VzcyIsImRlbHRhIiwibGFzdF9zZWNvbmRzIiwidG9nZ2xlX3JlbmV3X2xpbmsiLCJkYXRlIiwibm93IiwiRGF0ZSIsImdldFRpbWUiLCIkbGluayIsImZpbmQiLCJvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wIiwicGFyYW1zIiwiaWQiLCJjb29raWUiLCJqc29uIiwic2Vjb25kcyIsImNsb25lIiwidGV4dCIsImFwcGVuZCIsIiRhY3Rpb24iLCJtZXNzYWdlIiwidGltZTJtZXNzYWdlIiwiaG91cnMiLCJnZXRIb3VycyIsImFtcG0iLCJtaW51dGVzIiwiZ2V0TWludXRlcyIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImV4cGlyYXRpb24iLCJwYXJzZUludCIsImdyYW50ZWQiLCJnZXQiLCJkYXRhc2V0IiwiaW5pdGlhbGl6ZWQiLCJzZXRJbnRlcnZhbCIsInN1cHByZXNzIiwiaGFzQ2xhc3MiLCJkZWJ1ZyIsImlkaGFzaCIsImN1cnJpZCIsImlkcyIsInNob3dBbGVydCIsImh0bWwiLCIkYWxlcnQiLCJib290Ym94IiwiZGlhbG9nIiwibGFiZWwiLCJoZWFkZXIiLCJyb2xlIiwiZG9tYWluIiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm5hbWUiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJDbGFzc0xpc3QiLCJlbGVtIiwidHJpbW1lZENsYXNzZXMiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc2VzIiwiX3VwZGF0ZUNsYXNzTmFtZSIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdFByb3RvIiwiY2xhc3NMaXN0R2V0dGVyIiwiRXJyb3IiLCJjb250YWlucyIsImFkZCIsInRva2VucyIsInVwZGF0ZWQiLCJyZW1vdmUiLCJpbmRleCIsInNwbGljZSIsInRvZ2dsZSIsImZvcmNlIiwicmVzdWx0IiwibWV0aG9kIiwicmVwbGFjZW1lbnRfdG9rZW4iLCJqb2luIiwiZGVmaW5lUHJvcGVydHkiLCJjbGFzc0xpc3RQcm9wRGVzYyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJleCIsIm51bWJlciIsIl9fZGVmaW5lR2V0dGVyX18iLCJ0ZXN0RWxlbWVudCIsImNyZWF0ZU1ldGhvZCIsIm9yaWdpbmFsIiwiRE9NVG9rZW5MaXN0IiwiX3RvZ2dsZSIsInNsaWNlIiwiYXBwbHkiLCJERUZBVUxUX0NPTExfTUVOVV9PUFRJT04iLCJORVdfQ09MTF9NRU5VX09QVElPTiIsIklOX1lPVVJfQ09MTFNfTEFCRUwiLCIkdG9vbGJhciIsIiRlcnJvcm1zZyIsIiRpbmZvbXNnIiwiZGlzcGxheV9lcnJvciIsIm1zZyIsImluc2VydEFmdGVyIiwic2hvdyIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYWdlIiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwicGFyZW50cyIsInJlbW92ZUNsYXNzIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiYW5zd2VyIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJpc19kZXYiLCJmb3JjZV9zaXplIiwiJGRpdiIsIiRwIiwicGhvdG9jb3BpZXJfbWVzc2FnZSIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0Iiwic3JjIiwiaXRlbV90aXRsZSIsInRvdGFsIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsImNoZWNrU3RhdHVzIiwidHMiLCJzdWNjZXNzIiwidXBkYXRlUHJvZ3Jlc3MiLCJudW1fYXR0ZW1wdHMiLCJkaXNwbGF5UHJvY2Vzc0Vycm9yIiwibG9nRXJyb3IiLCJwZXJjZW50IiwiY3VycmVudCIsImN1cnJlbnRfcGFnZSIsImxhc3RfcGVyY2VudCIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJkb3dubG9hZCIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicmF0ZSIsImNvdW50ZG93biIsImNvdW50ZG93bl90aW1lciIsIl9sYXN0TWVzc2FnZSIsIl9sYXN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJpbm5lclRleHQiLCJFT1QiLCJkb3dubG9hZGVyIiwiY3JlYXRlIiwibnVtX3BhZ2VfZG93bmxvYWRzIiwicGhvdG9jb3BpZXIiLCJwcmludGFibGUiLCJfZ2V0UGFnZVNlbGVjdGlvbiIsImJ1dHRvbnMiLCJzZXEiLCJfZ2V0RmxhdHRlbmVkU2VsZWN0aW9uIiwic2lkZV9zaG9ydCIsInNpZGVfbG9uZyIsImh0SWQiLCJlbWJlZEhlbHBMaW5rIiwiY29kZWJsb2NrX3R4dCIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsInRleHRhcmVhIiwic2VsZWN0IiwiY2xpY2siLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwib25TaG93IiwibW9kYWwiLCJfc2V0dXAiLCJscyIsImNhdGFsb2ciLCJ0YXJnZXQiLCJwcmVmcyIsInNlYXJjaCIsImZ0IiwidmFsdWUiLCJ0cmFja0V2ZW50IiwiY2F0ZWdvcnkiLCJzdWJtaXQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRtZW51IiwiJHRyaWdnZXIiLCIkaGVhZGVyIiwiJG5hdmlnYXRvciIsIm1vYmlmeSIsImRvY3VtZW50RWxlbWVudCIsImV4cGFuZGVkIiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsIm91dGVySGVpZ2h0Iiwib3JpZ2luYWxIZWlnaHQiLCIkZXhwYW5kbyIsIm5hdmlnYXRvckhlaWdodCIsInVpIiwiJHNpZGViYXIiLCJyZXF1ZXN0RnVsbFNjcmVlbiIsInV0aWxzIiwiaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UiLCJzdGF0ZSIsInNpZGViYXJFeHBhbmRlZCIsInVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSIsInRvcCIsImhlaWdodCIsImFzc2lnbiIsInZhckFyZ3MiLCJUeXBlRXJyb3IiLCJ0byIsIm5leHRTb3VyY2UiLCJuZXh0S2V5Iiwid3JpdGFibGUiLCJhcnIiLCJmb3JFYWNoIiwiYWZ0ZXIiLCJhcmdBcnIiLCJkb2NGcmFnIiwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudCIsImFyZ0l0ZW0iLCJpc05vZGUiLCJOb2RlIiwiYXBwZW5kQ2hpbGQiLCJjcmVhdGVUZXh0Tm9kZSIsInBhcmVudE5vZGUiLCJpbnNlcnRCZWZvcmUiLCJuZXh0U2libGluZyIsIkNoYXJhY3RlckRhdGEiLCJEb2N1bWVudFR5cGUiLCJSZXBsYWNlV2l0aFBvbHlmaWxsIiwiY3VycmVudE5vZGUiLCJyZW1vdmVDaGlsZCIsIm93bmVyRG9jdW1lbnQiLCJyZXBsYWNlQ2hpbGQiLCJwcmV2aW91c1NpYmxpbmciLCJyZXBsYWNlV2l0aCIsIiRib2R5IiwicmVtb3ZlQXR0ciIsImJlZm9yZVVubG9hZFRpbWVvdXQiLCIkZm9ybV8iLCIkc3VibWl0Iiwic2VhcmNoaW5hdG9yIiwic3oiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7OztBQU9BLENBQUMsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ25CLEtBQUksT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJQUFnQ0EsT0FBT0MsR0FBM0MsRUFBZ0Q7QUFDL0M7QUFDQSxNQUFLLE9BQU9DLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENGLFVBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUJELE9BQW5CO0FBQ0EsR0FGRCxNQUVPO0FBQ05DLFVBQU8sRUFBUCxFQUFXRCxPQUFYO0FBQ0E7QUFDRCxFQVBELE1BT087QUFDTjtBQUNBLE1BQUssT0FBT0csTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0gsV0FBUUcsTUFBUjtBQUNBLEdBRkQsTUFFTztBQUNOSDtBQUNBO0FBQ0Q7QUFDRCxDQWhCQSxFQWdCRSxVQUFTSSxDQUFULEVBQVlDLFNBQVosRUFBdUI7O0FBRXpCLEtBQUlDLFdBQVc7QUFDYkMsS0FBVSxNQURHO0FBRWJDLE9BQVUsS0FGRztBQUdiQyxRQUFVLFFBSEc7QUFJYkMsUUFBVSxNQUpHO0FBS2JDLFVBQVUsS0FMRztBQU1iQyxVQUFVLEtBTkc7QUFPYkMsUUFBVTtBQVBHLEVBQWY7QUFBQSxLQVVDQyxNQUFNLENBQUMsUUFBRCxFQUFXLFVBQVgsRUFBdUIsV0FBdkIsRUFBb0MsVUFBcEMsRUFBZ0QsTUFBaEQsRUFBd0QsVUFBeEQsRUFBb0UsTUFBcEUsRUFBNEUsTUFBNUUsRUFBb0YsVUFBcEYsRUFBZ0csTUFBaEcsRUFBd0csV0FBeEcsRUFBcUgsTUFBckgsRUFBNkgsT0FBN0gsRUFBc0ksVUFBdEksQ0FWUDtBQUFBLEtBVTBKOztBQUV6SkMsV0FBVSxFQUFFLFVBQVcsVUFBYixFQVpYO0FBQUEsS0FZc0M7O0FBRXJDQyxVQUFTO0FBQ1JDLFVBQVMscUlBREQsRUFDeUk7QUFDakpDLFNBQVMsOExBRkQsQ0FFZ007QUFGaE0sRUFkVjtBQUFBLEtBbUJDQyxXQUFXQyxPQUFPQyxTQUFQLENBQWlCRixRQW5CN0I7QUFBQSxLQXFCQ0csUUFBUSxVQXJCVDs7QUF1QkEsVUFBU0MsUUFBVCxDQUFtQkMsR0FBbkIsRUFBd0JDLFVBQXhCLEVBQXFDO0FBQ3BDLE1BQUlDLE1BQU1DLFVBQVdILEdBQVgsQ0FBVjtBQUFBLE1BQ0FJLE1BQVFaLE9BQVFTLGNBQWMsS0FBZCxHQUFzQixRQUF0QixHQUFpQyxPQUF6QyxFQUFtREksSUFBbkQsQ0FBeURILEdBQXpELENBRFI7QUFBQSxNQUVBSSxNQUFNLEVBQUVDLE1BQU8sRUFBVCxFQUFhQyxPQUFRLEVBQXJCLEVBQXlCQyxLQUFNLEVBQS9CLEVBRk47QUFBQSxNQUdBQyxJQUFNLEVBSE47O0FBS0EsU0FBUUEsR0FBUixFQUFjO0FBQ2JKLE9BQUlDLElBQUosQ0FBVWpCLElBQUlvQixDQUFKLENBQVYsSUFBcUJOLElBQUlNLENBQUosS0FBVSxFQUEvQjtBQUNBOztBQUVEO0FBQ0FKLE1BQUlFLEtBQUosQ0FBVSxPQUFWLElBQXFCRyxZQUFZTCxJQUFJQyxJQUFKLENBQVMsT0FBVCxDQUFaLENBQXJCO0FBQ0FELE1BQUlFLEtBQUosQ0FBVSxVQUFWLElBQXdCRyxZQUFZTCxJQUFJQyxJQUFKLENBQVMsVUFBVCxDQUFaLENBQXhCOztBQUVBO0FBQ0FELE1BQUlHLEdBQUosQ0FBUSxNQUFSLElBQWtCSCxJQUFJQyxJQUFKLENBQVNLLElBQVQsQ0FBY0MsT0FBZCxDQUFzQixZQUF0QixFQUFtQyxFQUFuQyxFQUF1Q0MsS0FBdkMsQ0FBNkMsR0FBN0MsQ0FBbEI7QUFDQVIsTUFBSUcsR0FBSixDQUFRLFVBQVIsSUFBc0JILElBQUlDLElBQUosQ0FBU1EsUUFBVCxDQUFrQkYsT0FBbEIsQ0FBMEIsWUFBMUIsRUFBdUMsRUFBdkMsRUFBMkNDLEtBQTNDLENBQWlELEdBQWpELENBQXRCOztBQUVBO0FBQ0FSLE1BQUlDLElBQUosQ0FBUyxNQUFULElBQW1CRCxJQUFJQyxJQUFKLENBQVNTLElBQVQsR0FBZ0IsQ0FBQ1YsSUFBSUMsSUFBSixDQUFTVSxRQUFULEdBQXFCWCxJQUFJQyxJQUFKLENBQVNVLFFBQVQsR0FBa0IsS0FBbEIsR0FBd0JYLElBQUlDLElBQUosQ0FBU1MsSUFBdEQsR0FBNkRWLElBQUlDLElBQUosQ0FBU1MsSUFBdkUsS0FBZ0ZWLElBQUlDLElBQUosQ0FBU1csSUFBVCxHQUFnQixNQUFJWixJQUFJQyxJQUFKLENBQVNXLElBQTdCLEdBQW9DLEVBQXBILENBQWhCLEdBQTBJLEVBQTdKOztBQUVBLFNBQU9aLEdBQVA7QUFDQTs7QUFFRCxVQUFTYSxXQUFULENBQXNCQyxHQUF0QixFQUE0QjtBQUMzQixNQUFJQyxLQUFLRCxJQUFJRSxPQUFiO0FBQ0EsTUFBSyxPQUFPRCxFQUFQLEtBQWMsV0FBbkIsRUFBaUMsT0FBT3ZDLFNBQVN1QyxHQUFHRSxXQUFILEVBQVQsQ0FBUDtBQUNqQyxTQUFPRixFQUFQO0FBQ0E7O0FBRUQsVUFBU0csT0FBVCxDQUFpQkMsTUFBakIsRUFBeUJuQyxHQUF6QixFQUE4QjtBQUM3QixNQUFJbUMsT0FBT25DLEdBQVAsRUFBWW9DLE1BQVosSUFBc0IsQ0FBMUIsRUFBNkIsT0FBT0QsT0FBT25DLEdBQVAsSUFBYyxFQUFyQjtBQUM3QixNQUFJcUMsSUFBSSxFQUFSO0FBQ0EsT0FBSyxJQUFJakIsQ0FBVCxJQUFjZSxPQUFPbkMsR0FBUCxDQUFkO0FBQTJCcUMsS0FBRWpCLENBQUYsSUFBT2UsT0FBT25DLEdBQVAsRUFBWW9CLENBQVosQ0FBUDtBQUEzQixHQUNBZSxPQUFPbkMsR0FBUCxJQUFjcUMsQ0FBZDtBQUNBLFNBQU9BLENBQVA7QUFDQTs7QUFFRCxVQUFTQyxLQUFULENBQWVDLEtBQWYsRUFBc0JKLE1BQXRCLEVBQThCbkMsR0FBOUIsRUFBbUN3QyxHQUFuQyxFQUF3QztBQUN2QyxNQUFJQyxPQUFPRixNQUFNRyxLQUFOLEVBQVg7QUFDQSxNQUFJLENBQUNELElBQUwsRUFBVztBQUNWLE9BQUlFLFFBQVFSLE9BQU9uQyxHQUFQLENBQVIsQ0FBSixFQUEwQjtBQUN6Qm1DLFdBQU9uQyxHQUFQLEVBQVk0QyxJQUFaLENBQWlCSixHQUFqQjtBQUNBLElBRkQsTUFFTyxJQUFJLG9CQUFtQkwsT0FBT25DLEdBQVAsQ0FBbkIsQ0FBSixFQUFvQztBQUMxQ21DLFdBQU9uQyxHQUFQLElBQWN3QyxHQUFkO0FBQ0EsSUFGTSxNQUVBLElBQUksZUFBZSxPQUFPTCxPQUFPbkMsR0FBUCxDQUExQixFQUF1QztBQUM3Q21DLFdBQU9uQyxHQUFQLElBQWN3QyxHQUFkO0FBQ0EsSUFGTSxNQUVBO0FBQ05MLFdBQU9uQyxHQUFQLElBQWMsQ0FBQ21DLE9BQU9uQyxHQUFQLENBQUQsRUFBY3dDLEdBQWQsQ0FBZDtBQUNBO0FBQ0QsR0FWRCxNQVVPO0FBQ04sT0FBSUssTUFBTVYsT0FBT25DLEdBQVAsSUFBY21DLE9BQU9uQyxHQUFQLEtBQWUsRUFBdkM7QUFDQSxPQUFJLE9BQU95QyxJQUFYLEVBQWlCO0FBQ2hCLFFBQUlFLFFBQVFFLEdBQVIsQ0FBSixFQUFrQjtBQUNqQixTQUFJLE1BQU1MLEdBQVYsRUFBZUssSUFBSUQsSUFBSixDQUFTSixHQUFUO0FBQ2YsS0FGRCxNQUVPLElBQUksb0JBQW1CSyxHQUFuQix5Q0FBbUJBLEdBQW5CLEVBQUosRUFBNEI7QUFDbENBLFNBQUlDLEtBQUtELEdBQUwsRUFBVVQsTUFBZCxJQUF3QkksR0FBeEI7QUFDQSxLQUZNLE1BRUE7QUFDTkssV0FBTVYsT0FBT25DLEdBQVAsSUFBYyxDQUFDbUMsT0FBT25DLEdBQVAsQ0FBRCxFQUFjd0MsR0FBZCxDQUFwQjtBQUNBO0FBQ0QsSUFSRCxNQVFPLElBQUksQ0FBQ0MsS0FBS00sT0FBTCxDQUFhLEdBQWIsQ0FBTCxFQUF3QjtBQUM5Qk4sV0FBT0EsS0FBS08sTUFBTCxDQUFZLENBQVosRUFBZVAsS0FBS0wsTUFBTCxHQUFjLENBQTdCLENBQVA7QUFDQSxRQUFJLENBQUM1QixNQUFNeUMsSUFBTixDQUFXUixJQUFYLENBQUQsSUFBcUJFLFFBQVFFLEdBQVIsQ0FBekIsRUFBdUNBLE1BQU1YLFFBQVFDLE1BQVIsRUFBZ0JuQyxHQUFoQixDQUFOO0FBQ3ZDc0MsVUFBTUMsS0FBTixFQUFhTSxHQUFiLEVBQWtCSixJQUFsQixFQUF3QkQsR0FBeEI7QUFDQTtBQUNBLElBTE0sTUFLQTtBQUNOLFFBQUksQ0FBQ2hDLE1BQU15QyxJQUFOLENBQVdSLElBQVgsQ0FBRCxJQUFxQkUsUUFBUUUsR0FBUixDQUF6QixFQUF1Q0EsTUFBTVgsUUFBUUMsTUFBUixFQUFnQm5DLEdBQWhCLENBQU47QUFDdkNzQyxVQUFNQyxLQUFOLEVBQWFNLEdBQWIsRUFBa0JKLElBQWxCLEVBQXdCRCxHQUF4QjtBQUNBO0FBQ0Q7QUFDRDs7QUFFRCxVQUFTVSxLQUFULENBQWVmLE1BQWYsRUFBdUJuQyxHQUF2QixFQUE0QndDLEdBQTVCLEVBQWlDO0FBQ2hDLE1BQUksQ0FBQ3hDLElBQUkrQyxPQUFKLENBQVksR0FBWixDQUFMLEVBQXVCO0FBQ3RCLE9BQUlSLFFBQVF2QyxJQUFJd0IsS0FBSixDQUFVLEdBQVYsQ0FBWjtBQUFBLE9BQ0EyQixNQUFNWixNQUFNSCxNQURaO0FBQUEsT0FFQWdCLE9BQU9ELE1BQU0sQ0FGYjtBQUdBYixTQUFNQyxLQUFOLEVBQWFKLE1BQWIsRUFBcUIsTUFBckIsRUFBNkJLLEdBQTdCO0FBQ0EsR0FMRCxNQUtPO0FBQ04sT0FBSSxDQUFDaEMsTUFBTXlDLElBQU4sQ0FBV2pELEdBQVgsQ0FBRCxJQUFvQjJDLFFBQVFSLE9BQU92QyxJQUFmLENBQXhCLEVBQThDO0FBQzdDLFFBQUl5QyxJQUFJLEVBQVI7QUFDQSxTQUFLLElBQUlnQixDQUFULElBQWNsQixPQUFPdkMsSUFBckI7QUFBMkJ5QyxPQUFFZ0IsQ0FBRixJQUFPbEIsT0FBT3ZDLElBQVAsQ0FBWXlELENBQVosQ0FBUDtBQUEzQixLQUNBbEIsT0FBT3ZDLElBQVAsR0FBY3lDLENBQWQ7QUFDQTtBQUNEaUIsT0FBSW5CLE9BQU92QyxJQUFYLEVBQWlCSSxHQUFqQixFQUFzQndDLEdBQXRCO0FBQ0E7QUFDRCxTQUFPTCxNQUFQO0FBQ0E7O0FBRUQsVUFBU2QsV0FBVCxDQUFxQlQsR0FBckIsRUFBMEI7QUFDekIsU0FBTzJDLE9BQU9DLE9BQU81QyxHQUFQLEVBQVlZLEtBQVosQ0FBa0IsS0FBbEIsQ0FBUCxFQUFpQyxVQUFTaUMsR0FBVCxFQUFjQyxJQUFkLEVBQW9CO0FBQzNELE9BQUk7QUFDSEEsV0FBT0MsbUJBQW1CRCxLQUFLbkMsT0FBTCxDQUFhLEtBQWIsRUFBb0IsR0FBcEIsQ0FBbkIsQ0FBUDtBQUNBLElBRkQsQ0FFRSxPQUFNcUMsQ0FBTixFQUFTO0FBQ1Y7QUFDQTtBQUNELE9BQUlDLE1BQU1ILEtBQUtYLE9BQUwsQ0FBYSxHQUFiLENBQVY7QUFBQSxPQUNDZSxRQUFRQyxlQUFlTCxJQUFmLENBRFQ7QUFBQSxPQUVDMUQsTUFBTTBELEtBQUtWLE1BQUwsQ0FBWSxDQUFaLEVBQWVjLFNBQVNELEdBQXhCLENBRlA7QUFBQSxPQUdDckIsTUFBTWtCLEtBQUtWLE1BQUwsQ0FBWWMsU0FBU0QsR0FBckIsRUFBMEJILEtBQUt0QixNQUEvQixDQUhQO0FBQUEsT0FJQ0ksTUFBTUEsSUFBSVEsTUFBSixDQUFXUixJQUFJTyxPQUFKLENBQVksR0FBWixJQUFtQixDQUE5QixFQUFpQ1AsSUFBSUosTUFBckMsQ0FKUDs7QUFNQSxPQUFJLE1BQU1wQyxHQUFWLEVBQWVBLE1BQU0wRCxJQUFOLEVBQVlsQixNQUFNLEVBQWxCOztBQUVmLFVBQU9VLE1BQU1PLEdBQU4sRUFBV3pELEdBQVgsRUFBZ0J3QyxHQUFoQixDQUFQO0FBQ0EsR0FmTSxFQWVKLEVBQUU1QyxNQUFNLEVBQVIsRUFmSSxFQWVVQSxJQWZqQjtBQWdCQTs7QUFFRCxVQUFTMEQsR0FBVCxDQUFhVCxHQUFiLEVBQWtCN0MsR0FBbEIsRUFBdUJ3QyxHQUF2QixFQUE0QjtBQUMzQixNQUFJd0IsSUFBSW5CLElBQUk3QyxHQUFKLENBQVI7QUFDQSxNQUFJVCxjQUFjeUUsQ0FBbEIsRUFBcUI7QUFDcEJuQixPQUFJN0MsR0FBSixJQUFXd0MsR0FBWDtBQUNBLEdBRkQsTUFFTyxJQUFJRyxRQUFRcUIsQ0FBUixDQUFKLEVBQWdCO0FBQ3RCQSxLQUFFcEIsSUFBRixDQUFPSixHQUFQO0FBQ0EsR0FGTSxNQUVBO0FBQ05LLE9BQUk3QyxHQUFKLElBQVcsQ0FBQ2dFLENBQUQsRUFBSXhCLEdBQUosQ0FBWDtBQUNBO0FBQ0Q7O0FBRUQsVUFBU3VCLGNBQVQsQ0FBd0JuRCxHQUF4QixFQUE2QjtBQUM1QixNQUFJdUMsTUFBTXZDLElBQUl3QixNQUFkO0FBQUEsTUFDRTBCLEtBREY7QUFBQSxNQUNTRyxDQURUO0FBRUEsT0FBSyxJQUFJN0MsSUFBSSxDQUFiLEVBQWdCQSxJQUFJK0IsR0FBcEIsRUFBeUIsRUFBRS9CLENBQTNCLEVBQThCO0FBQzdCNkMsT0FBSXJELElBQUlRLENBQUosQ0FBSjtBQUNBLE9BQUksT0FBTzZDLENBQVgsRUFBY0gsUUFBUSxLQUFSO0FBQ2QsT0FBSSxPQUFPRyxDQUFYLEVBQWNILFFBQVEsSUFBUjtBQUNkLE9BQUksT0FBT0csQ0FBUCxJQUFZLENBQUNILEtBQWpCLEVBQXdCLE9BQU8xQyxDQUFQO0FBQ3hCO0FBQ0Q7O0FBRUQsVUFBU21DLE1BQVQsQ0FBZ0JWLEdBQWhCLEVBQXFCcUIsV0FBckIsRUFBaUM7QUFDaEMsTUFBSTlDLElBQUksQ0FBUjtBQUFBLE1BQ0MrQyxJQUFJdEIsSUFBSVQsTUFBSixJQUFjLENBRG5CO0FBQUEsTUFFQ2dDLE9BQU9DLFVBQVUsQ0FBVixDQUZSO0FBR0EsU0FBT2pELElBQUkrQyxDQUFYLEVBQWM7QUFDYixPQUFJL0MsS0FBS3lCLEdBQVQsRUFBY3VCLE9BQU9GLFlBQVlJLElBQVosQ0FBaUIvRSxTQUFqQixFQUE0QjZFLElBQTVCLEVBQWtDdkIsSUFBSXpCLENBQUosQ0FBbEMsRUFBMENBLENBQTFDLEVBQTZDeUIsR0FBN0MsQ0FBUDtBQUNkLEtBQUV6QixDQUFGO0FBQ0E7QUFDRCxTQUFPZ0QsSUFBUDtBQUNBOztBQUVELFVBQVN6QixPQUFULENBQWlCNEIsSUFBakIsRUFBdUI7QUFDdEIsU0FBT2pFLE9BQU9DLFNBQVAsQ0FBaUJGLFFBQWpCLENBQTBCaUUsSUFBMUIsQ0FBK0JDLElBQS9CLE1BQXlDLGdCQUFoRDtBQUNBOztBQUVELFVBQVN6QixJQUFULENBQWNELEdBQWQsRUFBbUI7QUFDbEIsTUFBSUMsT0FBTyxFQUFYO0FBQ0EsT0FBTTBCLElBQU4sSUFBYzNCLEdBQWQsRUFBb0I7QUFDbkIsT0FBS0EsSUFBSTRCLGNBQUosQ0FBbUJELElBQW5CLENBQUwsRUFBZ0MxQixLQUFLRixJQUFMLENBQVU0QixJQUFWO0FBQ2hDO0FBQ0QsU0FBTzFCLElBQVA7QUFDQTs7QUFFRCxVQUFTNEIsSUFBVCxDQUFlaEUsR0FBZixFQUFvQkMsVUFBcEIsRUFBaUM7QUFDaEMsTUFBSzBELFVBQVVqQyxNQUFWLEtBQXFCLENBQXJCLElBQTBCMUIsUUFBUSxJQUF2QyxFQUE4QztBQUM3Q0MsZ0JBQWEsSUFBYjtBQUNBRCxTQUFNbkIsU0FBTjtBQUNBO0FBQ0RvQixlQUFhQSxjQUFjLEtBQTNCO0FBQ0FELFFBQU1BLE9BQU9pRSxPQUFPQyxRQUFQLENBQWdCdkUsUUFBaEIsRUFBYjs7QUFFQSxTQUFPOztBQUVOd0UsU0FBT3BFLFNBQVNDLEdBQVQsRUFBY0MsVUFBZCxDQUZEOztBQUlOO0FBQ0FNLFNBQU8sY0FBVUEsS0FBVixFQUFpQjtBQUN2QkEsWUFBT2hCLFFBQVFnQixLQUFSLEtBQWlCQSxLQUF4QjtBQUNBLFdBQU8sT0FBT0EsS0FBUCxLQUFnQixXQUFoQixHQUE4QixLQUFLNEQsSUFBTCxDQUFVNUQsSUFBVixDQUFlQSxLQUFmLENBQTlCLEdBQXFELEtBQUs0RCxJQUFMLENBQVU1RCxJQUF0RTtBQUNBLElBUks7O0FBVU47QUFDQUMsVUFBUSxlQUFVQSxNQUFWLEVBQWtCO0FBQ3pCLFdBQU8sT0FBT0EsTUFBUCxLQUFpQixXQUFqQixHQUErQixLQUFLMkQsSUFBTCxDQUFVM0QsS0FBVixDQUFnQjRELEtBQWhCLENBQXNCNUQsTUFBdEIsQ0FBL0IsR0FBOEQsS0FBSzJELElBQUwsQ0FBVTNELEtBQVYsQ0FBZ0I0RCxLQUFyRjtBQUNBLElBYks7O0FBZU47QUFDQUMsV0FBUyxnQkFBVTdELEtBQVYsRUFBa0I7QUFDMUIsV0FBTyxPQUFPQSxLQUFQLEtBQWlCLFdBQWpCLEdBQStCLEtBQUsyRCxJQUFMLENBQVUzRCxLQUFWLENBQWdCTyxRQUFoQixDQUF5QlAsS0FBekIsQ0FBL0IsR0FBaUUsS0FBSzJELElBQUwsQ0FBVTNELEtBQVYsQ0FBZ0JPLFFBQXhGO0FBQ0EsSUFsQks7O0FBb0JOO0FBQ0F1RCxZQUFVLGlCQUFVN0QsR0FBVixFQUFnQjtBQUN6QixRQUFLLE9BQU9BLEdBQVAsS0FBZSxXQUFwQixFQUFrQztBQUNqQyxZQUFPLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNHLElBQXJCO0FBQ0EsS0FGRCxNQUVPO0FBQ05ILFdBQU1BLE1BQU0sQ0FBTixHQUFVLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNHLElBQWQsQ0FBbUJjLE1BQW5CLEdBQTRCakIsR0FBdEMsR0FBNENBLE1BQU0sQ0FBeEQsQ0FETSxDQUNxRDtBQUMzRCxZQUFPLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNHLElBQWQsQ0FBbUJILEdBQW5CLENBQVA7QUFDQTtBQUNELElBNUJLOztBQThCTjtBQUNBOEQsYUFBVyxrQkFBVTlELEdBQVYsRUFBZ0I7QUFDMUIsUUFBSyxPQUFPQSxHQUFQLEtBQWUsV0FBcEIsRUFBa0M7QUFDakMsWUFBTyxLQUFLMEQsSUFBTCxDQUFVMUQsR0FBVixDQUFjTSxRQUFyQjtBQUNBLEtBRkQsTUFFTztBQUNOTixXQUFNQSxNQUFNLENBQU4sR0FBVSxLQUFLMEQsSUFBTCxDQUFVMUQsR0FBVixDQUFjTSxRQUFkLENBQXVCVyxNQUF2QixHQUFnQ2pCLEdBQTFDLEdBQWdEQSxNQUFNLENBQTVELENBRE0sQ0FDeUQ7QUFDL0QsWUFBTyxLQUFLMEQsSUFBTCxDQUFVMUQsR0FBVixDQUFjTSxRQUFkLENBQXVCTixHQUF2QixDQUFQO0FBQ0E7QUFDRDs7QUF0Q0ssR0FBUDtBQTBDQTs7QUFFRCxLQUFLLE9BQU83QixDQUFQLEtBQWEsV0FBbEIsRUFBZ0M7O0FBRS9CQSxJQUFFNEYsRUFBRixDQUFLeEUsR0FBTCxHQUFXLFVBQVVDLFVBQVYsRUFBdUI7QUFDakMsT0FBSUQsTUFBTSxFQUFWO0FBQ0EsT0FBSyxLQUFLMEIsTUFBVixFQUFtQjtBQUNsQjFCLFVBQU1wQixFQUFFLElBQUYsRUFBUTJCLElBQVIsQ0FBY1ksWUFBWSxLQUFLLENBQUwsQ0FBWixDQUFkLEtBQXdDLEVBQTlDO0FBQ0E7QUFDRCxVQUFPNkMsS0FBTWhFLEdBQU4sRUFBV0MsVUFBWCxDQUFQO0FBQ0EsR0FORDs7QUFRQXJCLElBQUVvQixHQUFGLEdBQVFnRSxJQUFSO0FBRUEsRUFaRCxNQVlPO0FBQ05DLFNBQU9ELElBQVAsR0FBY0EsSUFBZDtBQUNBO0FBRUQsQ0F0UUE7OztBQ1BELElBQUlTLEtBQUtBLE1BQU0sRUFBZjtBQUNBQyxLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFcEI7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBOztBQUVBRixLQUFHRyxVQUFILEdBQWdCLFVBQVNDLFFBQVQsRUFBbUM7QUFBQSxRQUFoQkMsTUFBZ0IsdUVBQVQsT0FBUzs7QUFDakQsUUFBS0wsR0FBR00sVUFBUixFQUFxQjtBQUFFO0FBQVU7QUFDakNOLE9BQUdNLFVBQUgsR0FBZ0IsSUFBaEI7QUFDQUMsZUFBVyxZQUFNO0FBQ2YsVUFBSUMsMEJBQXdCUixHQUFHUyxjQUEzQix1Q0FBMkVMLFFBQTNFLGdCQUE4Rk0sbUJBQW1CbEIsT0FBT0MsUUFBUCxDQUFnQmtCLElBQW5DLENBQWxHO0FBQ0EsVUFBSUMsU0FBU3BCLE9BQU9xQixPQUFQLHlFQUFiO0FBQ0EsVUFBS0QsTUFBTCxFQUFjO0FBQ1pwQixlQUFPQyxRQUFQLENBQWdCa0IsSUFBaEIsR0FBdUJILFVBQXZCO0FBQ0Q7QUFDRixLQU5ELEVBTUcsR0FOSDtBQU9ELEdBVkQ7O0FBWUFSLEtBQUdjLFNBQUgsR0FBZWQsR0FBR2MsU0FBSCxJQUFnQixFQUEvQjtBQUNBZCxLQUFHYyxTQUFILENBQWFDLFNBQWIsR0FBeUIsVUFBU0osSUFBVCxFQUFlSyxPQUFmLEVBQXdCO0FBQy9DLFFBQUtMLFNBQVN2RyxTQUFkLEVBQTBCO0FBQUV1RyxhQUFPbEIsU0FBU2tCLElBQWhCO0FBQXdCO0FBQ3BELFFBQUlNLFFBQVFOLEtBQUsvQyxPQUFMLENBQWEsR0FBYixJQUFvQixDQUFDLENBQXJCLEdBQXlCLEdBQXpCLEdBQStCLEdBQTNDO0FBQ0EsUUFBS29ELFdBQVcsSUFBaEIsRUFBdUI7QUFBRUEsZ0JBQVUsR0FBVjtBQUFnQjtBQUN6Q0wsWUFBUU0sUUFBUSxJQUFSLEdBQWVELE9BQXZCO0FBQ0E7QUFDQTdHLE1BQUUrRyxJQUFGLENBQU9QLElBQVAsRUFDQTtBQUNFUSxnQkFBVSxrQkFBU0MsR0FBVCxFQUFjQyxNQUFkLEVBQXNCO0FBQzlCLFlBQUlqQixXQUFXZ0IsSUFBSUUsaUJBQUosQ0FBc0Isb0JBQXRCLENBQWY7QUFDQSxZQUFLbEIsUUFBTCxFQUFnQjtBQUNkSixhQUFHRyxVQUFILENBQWNDLFFBQWQsRUFBd0IsV0FBeEI7QUFDRDtBQUNGO0FBTkgsS0FEQTtBQVNELEdBZkQ7O0FBa0JBakcsSUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQixzQ0FBdEIsRUFBOEQsVUFBU0MsS0FBVCxFQUFnQjtBQUM1RTtBQUNBO0FBQ0E7QUFDQSxRQUFJUixVQUFVLFFBQVE3RyxFQUFFLElBQUYsRUFBUTJCLElBQVIsQ0FBYSxNQUFiLENBQXRCO0FBQ0FrRSxPQUFHYyxTQUFILENBQWFDLFNBQWIsQ0FBdUIzRyxTQUF2QixFQUFrQzRHLE9BQWxDO0FBQ0QsR0FORDtBQVNELENBN0REOzs7QUNEQWYsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRXBCLE1BQUl1QixTQUFTLENBQUMsU0FBRCxFQUFZLFVBQVosRUFBd0IsT0FBeEIsRUFBaUMsT0FBakMsRUFBMEMsS0FBMUMsRUFBaUQsTUFBakQsRUFBeUQsTUFBekQsRUFDWCxRQURXLEVBQ0QsV0FEQyxFQUNZLFNBRFosRUFDdUIsVUFEdkIsRUFDbUMsVUFEbkMsQ0FBYjs7QUFHQSxNQUFJQyxvQkFBb0J2SCxFQUFFLDBCQUFGLENBQXhCOztBQUVBLE1BQUl3SCxRQUFRLElBQUksRUFBSixHQUFTLElBQXJCO0FBQ0EsTUFBSUMsWUFBSjtBQUNBLE1BQUlDLG9CQUFvQixTQUFwQkEsaUJBQW9CLENBQVNDLElBQVQsRUFBZTtBQUNyQyxRQUFJQyxNQUFNQyxLQUFLRCxHQUFMLEVBQVY7QUFDQSxRQUFLQSxPQUFPRCxLQUFLRyxPQUFMLEVBQVosRUFBNkI7QUFDM0IsVUFBSUMsUUFBUVIsa0JBQWtCUyxJQUFsQixDQUF1QixhQUF2QixDQUFaO0FBQ0FELFlBQU1wRyxJQUFOLENBQVcsVUFBWCxFQUF1QixJQUF2QjtBQUNEO0FBQ0YsR0FORDs7QUFRQSxNQUFJc0csK0JBQStCLFNBQS9CQSw0QkFBK0IsR0FBVztBQUM1QyxRQUFLLENBQUVwQyxFQUFGLElBQVEsQ0FBRUEsR0FBR3FDLE1BQWIsSUFBdUIsQ0FBRXJDLEdBQUdxQyxNQUFILENBQVVDLEVBQXhDLEVBQTZDO0FBQUU7QUFBVTtBQUN6RCxRQUFJNUMsT0FBT3ZGLEVBQUVvSSxNQUFGLENBQVMsY0FBVCxFQUF5Qm5JLFNBQXpCLEVBQW9DLEVBQUVvSSxNQUFNLElBQVIsRUFBcEMsQ0FBWDtBQUNBLFFBQUssQ0FBRTlDLElBQVAsRUFBYztBQUFFO0FBQVU7QUFDMUIsUUFBSStDLFVBQVUvQyxLQUFLTSxHQUFHcUMsTUFBSCxDQUFVQyxFQUFmLENBQWQ7QUFDQTtBQUNBLFFBQUtHLFdBQVcsQ0FBQyxDQUFqQixFQUFxQjtBQUNuQixVQUFJUCxRQUFRUixrQkFBa0JTLElBQWxCLENBQXVCLEtBQXZCLEVBQThCTyxLQUE5QixFQUFaO0FBQ0FoQix3QkFBa0JTLElBQWxCLENBQXVCLEdBQXZCLEVBQTRCUSxJQUE1QixDQUFpQywwSEFBakM7QUFDQWpCLHdCQUFrQlMsSUFBbEIsQ0FBdUIsR0FBdkIsRUFBNEJTLE1BQTVCLENBQW1DVixLQUFuQztBQUNBLFVBQUlXLFVBQVVuQixrQkFBa0JTLElBQWxCLENBQXVCLHFDQUF2QixDQUFkO0FBQ0FVLGNBQVEvRyxJQUFSLENBQWEsTUFBYixFQUFxQjBELE9BQU9DLFFBQVAsQ0FBZ0JrQixJQUFyQztBQUNBa0MsY0FBUUYsSUFBUixDQUFhLFFBQWI7QUFDQTtBQUNEO0FBQ0QsUUFBS0YsVUFBVWIsWUFBZixFQUE4QjtBQUM1QixVQUFJa0IsVUFBVUMsYUFBYU4sT0FBYixDQUFkO0FBQ0FiLHFCQUFlYSxPQUFmO0FBQ0FmLHdCQUFrQlMsSUFBbEIsQ0FBdUIsa0JBQXZCLEVBQTJDUSxJQUEzQyxDQUFnREcsT0FBaEQ7QUFDRDtBQUNGLEdBcEJEOztBQXNCQSxNQUFJQyxlQUFlLFNBQWZBLFlBQWUsQ0FBU04sT0FBVCxFQUFrQjtBQUNuQyxRQUFJWCxPQUFPLElBQUlFLElBQUosQ0FBU1MsVUFBVSxJQUFuQixDQUFYO0FBQ0EsUUFBSU8sUUFBUWxCLEtBQUttQixRQUFMLEVBQVo7QUFDQSxRQUFJQyxPQUFPLElBQVg7QUFDQSxRQUFLRixRQUFRLEVBQWIsRUFBa0I7QUFBRUEsZUFBUyxFQUFULENBQWFFLE9BQU8sSUFBUDtBQUFjO0FBQy9DLFFBQUtGLFNBQVMsRUFBZCxFQUFrQjtBQUFFRSxhQUFPLElBQVA7QUFBYztBQUNsQyxRQUFJQyxVQUFVckIsS0FBS3NCLFVBQUwsRUFBZDtBQUNBLFFBQUtELFVBQVUsRUFBZixFQUFvQjtBQUFFQSxzQkFBY0EsT0FBZDtBQUEwQjtBQUNoRCxRQUFJTCxVQUFhRSxLQUFiLFNBQXNCRyxPQUF0QixHQUFnQ0QsSUFBaEMsU0FBd0N6QixPQUFPSyxLQUFLdUIsUUFBTCxFQUFQLENBQXhDLFNBQW1FdkIsS0FBS3dCLE9BQUwsRUFBdkU7QUFDQSxXQUFPUixPQUFQO0FBQ0QsR0FWRDs7QUFZQSxNQUFLcEIsa0JBQWtCekUsTUFBdkIsRUFBZ0M7QUFDOUIsUUFBSXNHLGFBQWE3QixrQkFBa0JoQyxJQUFsQixDQUF1QixlQUF2QixDQUFqQjtBQUNBLFFBQUkrQyxVQUFVZSxTQUFTOUIsa0JBQWtCaEMsSUFBbEIsQ0FBdUIsc0JBQXZCLENBQVQsRUFBeUQsRUFBekQsQ0FBZDtBQUNBLFFBQUkrRCxVQUFVL0Isa0JBQWtCaEMsSUFBbEIsQ0FBdUIsZUFBdkIsQ0FBZDs7QUFFQSxRQUFJcUMsTUFBTUMsS0FBS0QsR0FBTCxLQUFhLElBQXZCO0FBQ0EsUUFBSWUsVUFBVUMsYUFBYU4sT0FBYixDQUFkO0FBQ0FmLHNCQUFrQlMsSUFBbEIsQ0FBdUIsa0JBQXZCLEVBQTJDUSxJQUEzQyxDQUFnREcsT0FBaEQ7QUFDQXBCLHNCQUFrQmdDLEdBQWxCLENBQXNCLENBQXRCLEVBQXlCQyxPQUF6QixDQUFpQ0MsV0FBakMsR0FBK0MsTUFBL0M7O0FBRUEsUUFBS0gsT0FBTCxFQUFlO0FBQ2I7QUFDQTdCLHFCQUFlYSxPQUFmO0FBQ0FvQixrQkFBWSxZQUFXO0FBQ3JCO0FBQ0F6QjtBQUNELE9BSEQsRUFHRyxHQUhIO0FBSUQ7QUFDRjs7QUFFRCxNQUFJakksRUFBRSxpQkFBRixFQUFxQjhDLE1BQXJCLEdBQThCLENBQWxDLEVBQXFDO0FBQ2pDLFFBQUk2RyxXQUFXM0osRUFBRSxNQUFGLEVBQVU0SixRQUFWLENBQW1CLFdBQW5CLENBQWY7QUFDQSxRQUFJRCxRQUFKLEVBQWM7QUFDVjtBQUNIO0FBQ0QsUUFBSUUsUUFBUTdKLEVBQUUsTUFBRixFQUFVNEosUUFBVixDQUFtQixPQUFuQixDQUFaO0FBQ0EsUUFBSUUsU0FBUzlKLEVBQUVvSSxNQUFGLENBQVMsdUJBQVQsRUFBa0NuSSxTQUFsQyxFQUE2QyxFQUFDb0ksTUFBTyxJQUFSLEVBQTdDLENBQWI7QUFDQSxRQUFJakgsTUFBTXBCLEVBQUVvQixHQUFGLEVBQVYsQ0FQaUMsQ0FPZDtBQUNuQixRQUFJMkksU0FBUzNJLElBQUlRLEtBQUosQ0FBVSxJQUFWLENBQWI7QUFDQSxRQUFJa0ksVUFBVSxJQUFkLEVBQW9CO0FBQ2hCQSxlQUFTLEVBQVQ7QUFDSDs7QUFFRCxRQUFJRSxNQUFNLEVBQVY7QUFDQSxTQUFLLElBQUk3QixFQUFULElBQWUyQixNQUFmLEVBQXVCO0FBQ25CLFVBQUlBLE9BQU8zRSxjQUFQLENBQXNCZ0QsRUFBdEIsQ0FBSixFQUErQjtBQUMzQjZCLFlBQUkxRyxJQUFKLENBQVM2RSxFQUFUO0FBQ0g7QUFDSjs7QUFFRCxRQUFLNkIsSUFBSXZHLE9BQUosQ0FBWXNHLE1BQVosSUFBc0IsQ0FBdkIsSUFBNkJGLEtBQWpDLEVBQXdDO0FBQUEsVUFLM0JJLFNBTDJCLEdBS3BDLFNBQVNBLFNBQVQsR0FBcUI7QUFDakIsWUFBSUMsT0FBT2xLLEVBQUUsaUJBQUYsRUFBcUJrSyxJQUFyQixFQUFYO0FBQ0EsWUFBSUMsU0FBU0MsUUFBUUMsTUFBUixDQUFlSCxJQUFmLEVBQXFCLENBQUMsRUFBRUksT0FBTyxJQUFULEVBQWUsU0FBVSw2QkFBekIsRUFBRCxDQUFyQixFQUFpRixFQUFFQyxRQUFTLGdCQUFYLEVBQTZCQyxNQUFNLGFBQW5DLEVBQWpGLENBQWI7QUFDSCxPQVJtQzs7QUFDcENWLGFBQU9DLE1BQVAsSUFBaUIsQ0FBakI7QUFDQTtBQUNBL0osUUFBRW9JLE1BQUYsQ0FBUyx1QkFBVCxFQUFrQzBCLE1BQWxDLEVBQTBDLEVBQUV6QixNQUFPLElBQVQsRUFBZXJHLE1BQU0sR0FBckIsRUFBMEJ5SSxRQUFRLGlCQUFsQyxFQUExQzs7QUFNQXBGLGFBQU9lLFVBQVAsQ0FBa0I2RCxTQUFsQixFQUE2QixJQUE3QixFQUFtQyxJQUFuQztBQUNIO0FBQ0o7QUFFRixDQXhHRDs7O0FDQUE7Ozs7Ozs7OztBQVNBOztBQUVBOztBQUVBLElBQUksY0FBY1MsSUFBbEIsRUFBd0I7O0FBRXhCO0FBQ0E7QUFDQSxLQUNJLEVBQUUsZUFBZUMsU0FBU0MsYUFBVCxDQUF1QixHQUF2QixDQUFqQixLQUNBRCxTQUFTRSxlQUFULElBQ0EsRUFBRSxlQUFlRixTQUFTRSxlQUFULENBQXlCLDRCQUF6QixFQUFzRCxHQUF0RCxDQUFqQixDQUhKLEVBSUU7O0FBRUQsYUFBVUMsSUFBVixFQUFnQjs7QUFFakI7O0FBRUEsT0FBSSxFQUFFLGFBQWFBLElBQWYsQ0FBSixFQUEwQjs7QUFFMUIsT0FDR0MsZ0JBQWdCLFdBRG5CO0FBQUEsT0FFR0MsWUFBWSxXQUZmO0FBQUEsT0FHR0MsZUFBZUgsS0FBS0ksT0FBTCxDQUFhRixTQUFiLENBSGxCO0FBQUEsT0FJR0csU0FBU25LLE1BSlo7QUFBQSxPQUtHb0ssVUFBVWxILE9BQU84RyxTQUFQLEVBQWtCSyxJQUFsQixJQUEwQixZQUFZO0FBQ2pELFdBQU8sS0FBS3BKLE9BQUwsQ0FBYSxZQUFiLEVBQTJCLEVBQTNCLENBQVA7QUFDQSxJQVBGO0FBQUEsT0FRR3FKLGFBQWFDLE1BQU1QLFNBQU4sRUFBaUJ2SCxPQUFqQixJQUE0QixVQUFVK0gsSUFBVixFQUFnQjtBQUMxRCxRQUNHMUosSUFBSSxDQURQO0FBQUEsUUFFRytCLE1BQU0sS0FBS2YsTUFGZDtBQUlBLFdBQU9oQixJQUFJK0IsR0FBWCxFQUFnQi9CLEdBQWhCLEVBQXFCO0FBQ3BCLFNBQUlBLEtBQUssSUFBTCxJQUFhLEtBQUtBLENBQUwsTUFBWTBKLElBQTdCLEVBQW1DO0FBQ2xDLGFBQU8xSixDQUFQO0FBQ0E7QUFDRDtBQUNELFdBQU8sQ0FBQyxDQUFSO0FBQ0E7QUFDRDtBQXBCRDtBQUFBLE9BcUJHMkosUUFBUSxTQUFSQSxLQUFRLENBQVVDLElBQVYsRUFBZ0IvQyxPQUFoQixFQUF5QjtBQUNsQyxTQUFLZ0QsSUFBTCxHQUFZRCxJQUFaO0FBQ0EsU0FBS0UsSUFBTCxHQUFZQyxhQUFhSCxJQUFiLENBQVo7QUFDQSxTQUFLL0MsT0FBTCxHQUFlQSxPQUFmO0FBQ0EsSUF6QkY7QUFBQSxPQTBCR21ELHdCQUF3QixTQUF4QkEscUJBQXdCLENBQVVDLFNBQVYsRUFBcUJDLEtBQXJCLEVBQTRCO0FBQ3JELFFBQUlBLFVBQVUsRUFBZCxFQUFrQjtBQUNqQixXQUFNLElBQUlQLEtBQUosQ0FDSCxZQURHLEVBRUgsOEJBRkcsQ0FBTjtBQUlBO0FBQ0QsUUFBSSxLQUFLOUgsSUFBTCxDQUFVcUksS0FBVixDQUFKLEVBQXNCO0FBQ3JCLFdBQU0sSUFBSVAsS0FBSixDQUNILHVCQURHLEVBRUgsOENBRkcsQ0FBTjtBQUlBO0FBQ0QsV0FBT0gsV0FBV3RHLElBQVgsQ0FBZ0IrRyxTQUFoQixFQUEyQkMsS0FBM0IsQ0FBUDtBQUNBLElBeENGO0FBQUEsT0F5Q0dDLFlBQVksU0FBWkEsU0FBWSxDQUFVQyxJQUFWLEVBQWdCO0FBQzdCLFFBQ0dDLGlCQUFpQmYsUUFBUXBHLElBQVIsQ0FBYWtILEtBQUtFLFlBQUwsQ0FBa0IsT0FBbEIsS0FBOEIsRUFBM0MsQ0FEcEI7QUFBQSxRQUVHQyxVQUFVRixpQkFBaUJBLGVBQWVqSyxLQUFmLENBQXFCLEtBQXJCLENBQWpCLEdBQStDLEVBRjVEO0FBQUEsUUFHR0osSUFBSSxDQUhQO0FBQUEsUUFJRytCLE1BQU13SSxRQUFRdkosTUFKakI7QUFNQSxXQUFPaEIsSUFBSStCLEdBQVgsRUFBZ0IvQixHQUFoQixFQUFxQjtBQUNwQixVQUFLd0IsSUFBTCxDQUFVK0ksUUFBUXZLLENBQVIsQ0FBVjtBQUNBO0FBQ0QsU0FBS3dLLGdCQUFMLEdBQXdCLFlBQVk7QUFDbkNKLFVBQUtLLFlBQUwsQ0FBa0IsT0FBbEIsRUFBMkIsS0FBS3hMLFFBQUwsRUFBM0I7QUFDQSxLQUZEO0FBR0EsSUF0REY7QUFBQSxPQXVER3lMLGlCQUFpQlAsVUFBVWpCLFNBQVYsSUFBdUIsRUF2RDNDO0FBQUEsT0F3REd5QixrQkFBa0IsU0FBbEJBLGVBQWtCLEdBQVk7QUFDL0IsV0FBTyxJQUFJUixTQUFKLENBQWMsSUFBZCxDQUFQO0FBQ0EsSUExREY7QUE0REE7QUFDQTtBQUNBUixTQUFNVCxTQUFOLElBQW1CMEIsTUFBTTFCLFNBQU4sQ0FBbkI7QUFDQXdCLGtCQUFlaEIsSUFBZixHQUFzQixVQUFVMUosQ0FBVixFQUFhO0FBQ2xDLFdBQU8sS0FBS0EsQ0FBTCxLQUFXLElBQWxCO0FBQ0EsSUFGRDtBQUdBMEssa0JBQWVHLFFBQWYsR0FBMEIsVUFBVVgsS0FBVixFQUFpQjtBQUMxQyxXQUFPLENBQUNGLHNCQUFzQixJQUF0QixFQUE0QkUsUUFBUSxFQUFwQyxDQUFSO0FBQ0EsSUFGRDtBQUdBUSxrQkFBZUksR0FBZixHQUFxQixZQUFZO0FBQ2hDLFFBQ0dDLFNBQVM5SCxTQURaO0FBQUEsUUFFR2pELElBQUksQ0FGUDtBQUFBLFFBR0crQyxJQUFJZ0ksT0FBTy9KLE1BSGQ7QUFBQSxRQUlHa0osS0FKSDtBQUFBLFFBS0djLFVBQVUsS0FMYjtBQU9BLE9BQUc7QUFDRmQsYUFBUWEsT0FBTy9LLENBQVAsSUFBWSxFQUFwQjtBQUNBLFNBQUksQ0FBQyxDQUFDZ0ssc0JBQXNCLElBQXRCLEVBQTRCRSxLQUE1QixDQUFOLEVBQTBDO0FBQ3pDLFdBQUsxSSxJQUFMLENBQVUwSSxLQUFWO0FBQ0FjLGdCQUFVLElBQVY7QUFDQTtBQUNELEtBTkQsUUFPTyxFQUFFaEwsQ0FBRixHQUFNK0MsQ0FQYjs7QUFTQSxRQUFJaUksT0FBSixFQUFhO0FBQ1osVUFBS1IsZ0JBQUw7QUFDQTtBQUNELElBcEJEO0FBcUJBRSxrQkFBZU8sTUFBZixHQUF3QixZQUFZO0FBQ25DLFFBQ0dGLFNBQVM5SCxTQURaO0FBQUEsUUFFR2pELElBQUksQ0FGUDtBQUFBLFFBR0crQyxJQUFJZ0ksT0FBTy9KLE1BSGQ7QUFBQSxRQUlHa0osS0FKSDtBQUFBLFFBS0djLFVBQVUsS0FMYjtBQUFBLFFBTUdFLEtBTkg7QUFRQSxPQUFHO0FBQ0ZoQixhQUFRYSxPQUFPL0ssQ0FBUCxJQUFZLEVBQXBCO0FBQ0FrTCxhQUFRbEIsc0JBQXNCLElBQXRCLEVBQTRCRSxLQUE1QixDQUFSO0FBQ0EsWUFBTyxDQUFDZ0IsS0FBUixFQUFlO0FBQ2QsV0FBS0MsTUFBTCxDQUFZRCxLQUFaLEVBQW1CLENBQW5CO0FBQ0FGLGdCQUFVLElBQVY7QUFDQUUsY0FBUWxCLHNCQUFzQixJQUF0QixFQUE0QkUsS0FBNUIsQ0FBUjtBQUNBO0FBQ0QsS0FSRCxRQVNPLEVBQUVsSyxDQUFGLEdBQU0rQyxDQVRiOztBQVdBLFFBQUlpSSxPQUFKLEVBQWE7QUFDWixVQUFLUixnQkFBTDtBQUNBO0FBQ0QsSUF2QkQ7QUF3QkFFLGtCQUFlVSxNQUFmLEdBQXdCLFVBQVVsQixLQUFWLEVBQWlCbUIsS0FBakIsRUFBd0I7QUFDL0MsUUFDR0MsU0FBUyxLQUFLVCxRQUFMLENBQWNYLEtBQWQsQ0FEWjtBQUFBLFFBRUdxQixTQUFTRCxTQUNWRCxVQUFVLElBQVYsSUFBa0IsUUFEUixHQUdWQSxVQUFVLEtBQVYsSUFBbUIsS0FMckI7O0FBUUEsUUFBSUUsTUFBSixFQUFZO0FBQ1gsVUFBS0EsTUFBTCxFQUFhckIsS0FBYjtBQUNBOztBQUVELFFBQUltQixVQUFVLElBQVYsSUFBa0JBLFVBQVUsS0FBaEMsRUFBdUM7QUFDdEMsWUFBT0EsS0FBUDtBQUNBLEtBRkQsTUFFTztBQUNOLFlBQU8sQ0FBQ0MsTUFBUjtBQUNBO0FBQ0QsSUFsQkQ7QUFtQkFaLGtCQUFldkssT0FBZixHQUF5QixVQUFVK0osS0FBVixFQUFpQnNCLGlCQUFqQixFQUFvQztBQUM1RCxRQUFJTixRQUFRbEIsc0JBQXNCRSxRQUFRLEVBQTlCLENBQVo7QUFDQSxRQUFJLENBQUNnQixLQUFMLEVBQVk7QUFDWCxVQUFLQyxNQUFMLENBQVlELEtBQVosRUFBbUIsQ0FBbkIsRUFBc0JNLGlCQUF0QjtBQUNBLFVBQUtoQixnQkFBTDtBQUNBO0FBQ0QsSUFORDtBQU9BRSxrQkFBZXpMLFFBQWYsR0FBMEIsWUFBWTtBQUNyQyxXQUFPLEtBQUt3TSxJQUFMLENBQVUsR0FBVixDQUFQO0FBQ0EsSUFGRDs7QUFJQSxPQUFJcEMsT0FBT3FDLGNBQVgsRUFBMkI7QUFDMUIsUUFBSUMsb0JBQW9CO0FBQ3JCbEUsVUFBS2tELGVBRGdCO0FBRXJCaUIsaUJBQVksSUFGUztBQUdyQkMsbUJBQWM7QUFITyxLQUF4QjtBQUtBLFFBQUk7QUFDSHhDLFlBQU9xQyxjQUFQLENBQXNCdkMsWUFBdEIsRUFBb0NGLGFBQXBDLEVBQW1EMEMsaUJBQW5EO0FBQ0EsS0FGRCxDQUVFLE9BQU9HLEVBQVAsRUFBVztBQUFFO0FBQ2Q7QUFDQTtBQUNBLFNBQUlBLEdBQUdDLE1BQUgsS0FBYzVOLFNBQWQsSUFBMkIyTixHQUFHQyxNQUFILEtBQWMsQ0FBQyxVQUE5QyxFQUEwRDtBQUN6REosd0JBQWtCQyxVQUFsQixHQUErQixLQUEvQjtBQUNBdkMsYUFBT3FDLGNBQVAsQ0FBc0J2QyxZQUF0QixFQUFvQ0YsYUFBcEMsRUFBbUQwQyxpQkFBbkQ7QUFDQTtBQUNEO0FBQ0QsSUFoQkQsTUFnQk8sSUFBSXRDLE9BQU9ILFNBQVAsRUFBa0I4QyxnQkFBdEIsRUFBd0M7QUFDOUM3QyxpQkFBYTZDLGdCQUFiLENBQThCL0MsYUFBOUIsRUFBNkMwQixlQUE3QztBQUNBO0FBRUEsR0ExS0EsRUEwS0MvQixJQTFLRCxDQUFEO0FBNEtDOztBQUVEO0FBQ0E7O0FBRUMsY0FBWTtBQUNaOztBQUVBLE1BQUlxRCxjQUFjcEQsU0FBU0MsYUFBVCxDQUF1QixHQUF2QixDQUFsQjs7QUFFQW1ELGNBQVloQyxTQUFaLENBQXNCYSxHQUF0QixDQUEwQixJQUExQixFQUFnQyxJQUFoQzs7QUFFQTtBQUNBO0FBQ0EsTUFBSSxDQUFDbUIsWUFBWWhDLFNBQVosQ0FBc0JZLFFBQXRCLENBQStCLElBQS9CLENBQUwsRUFBMkM7QUFDMUMsT0FBSXFCLGVBQWUsU0FBZkEsWUFBZSxDQUFTWCxNQUFULEVBQWlCO0FBQ25DLFFBQUlZLFdBQVdDLGFBQWFqTixTQUFiLENBQXVCb00sTUFBdkIsQ0FBZjs7QUFFQWEsaUJBQWFqTixTQUFiLENBQXVCb00sTUFBdkIsSUFBaUMsVUFBU3JCLEtBQVQsRUFBZ0I7QUFDaEQsU0FBSWxLLENBQUo7QUFBQSxTQUFPK0IsTUFBTWtCLFVBQVVqQyxNQUF2Qjs7QUFFQSxVQUFLaEIsSUFBSSxDQUFULEVBQVlBLElBQUkrQixHQUFoQixFQUFxQi9CLEdBQXJCLEVBQTBCO0FBQ3pCa0ssY0FBUWpILFVBQVVqRCxDQUFWLENBQVI7QUFDQW1NLGVBQVNqSixJQUFULENBQWMsSUFBZCxFQUFvQmdILEtBQXBCO0FBQ0E7QUFDRCxLQVBEO0FBUUEsSUFYRDtBQVlBZ0MsZ0JBQWEsS0FBYjtBQUNBQSxnQkFBYSxRQUFiO0FBQ0E7O0FBRURELGNBQVloQyxTQUFaLENBQXNCbUIsTUFBdEIsQ0FBNkIsSUFBN0IsRUFBbUMsS0FBbkM7O0FBRUE7QUFDQTtBQUNBLE1BQUlhLFlBQVloQyxTQUFaLENBQXNCWSxRQUF0QixDQUErQixJQUEvQixDQUFKLEVBQTBDO0FBQ3pDLE9BQUl3QixVQUFVRCxhQUFhak4sU0FBYixDQUF1QmlNLE1BQXJDOztBQUVBZ0IsZ0JBQWFqTixTQUFiLENBQXVCaU0sTUFBdkIsR0FBZ0MsVUFBU2xCLEtBQVQsRUFBZ0JtQixLQUFoQixFQUF1QjtBQUN0RCxRQUFJLEtBQUtwSSxTQUFMLElBQWtCLENBQUMsS0FBSzRILFFBQUwsQ0FBY1gsS0FBZCxDQUFELEtBQTBCLENBQUNtQixLQUFqRCxFQUF3RDtBQUN2RCxZQUFPQSxLQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBT2dCLFFBQVFuSixJQUFSLENBQWEsSUFBYixFQUFtQmdILEtBQW5CLENBQVA7QUFDQTtBQUNELElBTkQ7QUFRQTs7QUFFRDtBQUNBLE1BQUksRUFBRSxhQUFhckIsU0FBU0MsYUFBVCxDQUF1QixHQUF2QixFQUE0Qm1CLFNBQTNDLENBQUosRUFBMkQ7QUFDMURtQyxnQkFBYWpOLFNBQWIsQ0FBdUJnQixPQUF2QixHQUFpQyxVQUFVK0osS0FBVixFQUFpQnNCLGlCQUFqQixFQUFvQztBQUNwRSxRQUNHVCxTQUFTLEtBQUs5TCxRQUFMLEdBQWdCbUIsS0FBaEIsQ0FBc0IsR0FBdEIsQ0FEWjtBQUFBLFFBRUc4SyxRQUFRSCxPQUFPcEosT0FBUCxDQUFldUksUUFBUSxFQUF2QixDQUZYO0FBSUEsUUFBSSxDQUFDZ0IsS0FBTCxFQUFZO0FBQ1hILGNBQVNBLE9BQU91QixLQUFQLENBQWFwQixLQUFiLENBQVQ7QUFDQSxVQUFLRCxNQUFMLENBQVlzQixLQUFaLENBQWtCLElBQWxCLEVBQXdCeEIsTUFBeEI7QUFDQSxVQUFLRCxHQUFMLENBQVNVLGlCQUFUO0FBQ0EsVUFBS1YsR0FBTCxDQUFTeUIsS0FBVCxDQUFlLElBQWYsRUFBcUJ4QixPQUFPdUIsS0FBUCxDQUFhLENBQWIsQ0FBckI7QUFDQTtBQUNELElBWEQ7QUFZQTs7QUFFREwsZ0JBQWMsSUFBZDtBQUNBLEVBNURBLEdBQUQ7QUE4REM7OztBQ3RRRGpJLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQixRQUFJdUksMkJBQTJCLEdBQS9CO0FBQ0EsUUFBSUMsdUJBQXVCLFNBQTNCLENBSGtCLENBR29COztBQUV0QyxRQUFJQyxzQkFBc0IscUNBQTFCOztBQUVBLFFBQUlDLFdBQVd6TyxFQUFFLHFDQUFGLENBQWY7QUFDQSxRQUFJME8sWUFBWTFPLEVBQUUsV0FBRixDQUFoQjtBQUNBLFFBQUkyTyxXQUFXM08sRUFBRSxVQUFGLENBQWY7O0FBRUEsYUFBUzRPLGFBQVQsQ0FBdUJDLEdBQXZCLEVBQTRCO0FBQ3hCLFlBQUssQ0FBRUgsVUFBVTVMLE1BQWpCLEVBQTBCO0FBQ3RCNEwsd0JBQVkxTyxFQUFFLDJFQUFGLEVBQStFOE8sV0FBL0UsQ0FBMkZMLFFBQTNGLENBQVo7QUFDSDtBQUNEQyxrQkFBVWxHLElBQVYsQ0FBZXFHLEdBQWYsRUFBb0JFLElBQXBCO0FBQ0FsSixXQUFHbUosYUFBSCxDQUFpQkgsR0FBakI7QUFDSDs7QUFFRCxhQUFTSSxZQUFULENBQXNCSixHQUF0QixFQUEyQjtBQUN2QixZQUFLLENBQUVGLFNBQVM3TCxNQUFoQixFQUF5QjtBQUNyQjZMLHVCQUFXM08sRUFBRSx5RUFBRixFQUE2RThPLFdBQTdFLENBQXlGTCxRQUF6RixDQUFYO0FBQ0g7QUFDREUsaUJBQVNuRyxJQUFULENBQWNxRyxHQUFkLEVBQW1CRSxJQUFuQjtBQUNBbEosV0FBR21KLGFBQUgsQ0FBaUJILEdBQWpCO0FBQ0g7O0FBRUQsYUFBU0ssVUFBVCxHQUFzQjtBQUNsQlIsa0JBQVVTLElBQVYsR0FBaUIzRyxJQUFqQjtBQUNIOztBQUVELGFBQVM0RyxTQUFULEdBQXFCO0FBQ2pCVCxpQkFBU1EsSUFBVCxHQUFnQjNHLElBQWhCO0FBQ0g7O0FBRUQsYUFBUzZHLE9BQVQsR0FBbUI7QUFDZixZQUFJak8sTUFBTSxTQUFWO0FBQ0EsWUFBS2tFLFNBQVNnSyxRQUFULENBQWtCN0wsT0FBbEIsQ0FBMEIsU0FBMUIsSUFBdUMsQ0FBQyxDQUE3QyxFQUFpRDtBQUM3Q3JDLGtCQUFNLFdBQU47QUFDSDtBQUNELGVBQU9BLEdBQVA7QUFDSDs7QUFFRCxhQUFTbU8sVUFBVCxDQUFvQmhLLElBQXBCLEVBQTBCO0FBQ3RCLFlBQUlrQixTQUFTLEVBQWI7QUFDQSxZQUFJK0ksTUFBTWpLLEtBQUtyRCxLQUFMLENBQVcsR0FBWCxDQUFWO0FBQ0EsYUFBSSxJQUFJSixJQUFJLENBQVosRUFBZUEsSUFBSTBOLElBQUkxTSxNQUF2QixFQUErQmhCLEdBQS9CLEVBQW9DO0FBQ2hDLGdCQUFJMk4sS0FBS0QsSUFBSTFOLENBQUosRUFBT0ksS0FBUCxDQUFhLEdBQWIsQ0FBVDtBQUNBdUUsbUJBQU9nSixHQUFHLENBQUgsQ0FBUCxJQUFnQkEsR0FBRyxDQUFILENBQWhCO0FBQ0g7QUFDRCxlQUFPaEosTUFBUDtBQUNIOztBQUVELGFBQVNpSix3QkFBVCxDQUFrQ0MsSUFBbEMsRUFBd0M7O0FBRXBDLFlBQUlDLFVBQVU1UCxFQUFFNlAsTUFBRixDQUFTLEVBQUVDLFVBQVcsS0FBYixFQUFvQnhGLE9BQVEsY0FBNUIsRUFBVCxFQUF1RHFGLElBQXZELENBQWQ7O0FBRUEsWUFBSUksU0FBUy9QLEVBQ1QsK0NBQ0ksNkJBREosR0FFUSxvRUFGUixHQUdRLHdCQUhSLEdBSVksdUlBSlosR0FLWSwyREFMWixHQU1RLFFBTlIsR0FPSSxRQVBKLEdBUUksNkJBUkosR0FTUSxrRUFUUixHQVVRLHdCQVZSLEdBV1ksOElBWFosR0FZWSw2REFaWixHQWFRLFFBYlIsR0FjSSxRQWRKLEdBZUksNkJBZkosR0FnQlEsOEdBaEJSLEdBaUJRLHdCQWpCUixHQWtCWSxpRkFsQlosR0FtQlksZ0RBbkJaLEdBb0JnQixVQXBCaEIsR0FxQlksVUFyQlosR0FzQlksK0RBdEJaLEdBdUJZLGdEQXZCWixHQXdCZ0IsU0F4QmhCLEdBeUJZLFVBekJaLEdBMEJRLFFBMUJSLEdBMkJJLFFBM0JKLEdBNEJBLFNBN0JTLENBQWI7O0FBZ0NBLFlBQUs0UCxRQUFRSSxFQUFiLEVBQWtCO0FBQ2RELG1CQUFPL0gsSUFBUCxDQUFZLGdCQUFaLEVBQThCOUUsR0FBOUIsQ0FBa0MwTSxRQUFRSSxFQUExQztBQUNIOztBQUVELFlBQUtKLFFBQVFLLElBQWIsRUFBb0I7QUFDaEJGLG1CQUFPL0gsSUFBUCxDQUFZLHFCQUFaLEVBQW1DOUUsR0FBbkMsQ0FBdUMwTSxRQUFRSyxJQUEvQztBQUNIOztBQUVELFlBQUtMLFFBQVFNLElBQVIsSUFBZ0IsSUFBckIsRUFBNEI7QUFDeEJILG1CQUFPL0gsSUFBUCxDQUFZLDRCQUE0QjRILFFBQVFNLElBQXBDLEdBQTJDLEdBQXZELEVBQTREdk8sSUFBNUQsQ0FBaUUsU0FBakUsRUFBNEUsU0FBNUU7QUFDSCxTQUZELE1BRU8sSUFBSyxDQUFFa0UsR0FBR3NLLFlBQUgsQ0FBZ0JDLFNBQXZCLEVBQW1DO0FBQ3RDTCxtQkFBTy9ILElBQVAsQ0FBWSwyQkFBWixFQUF5Q3JHLElBQXpDLENBQThDLFNBQTlDLEVBQXlELFNBQXpEO0FBQ0EzQixjQUFFLDRJQUFGLEVBQWdKcVEsUUFBaEosQ0FBeUpOLE1BQXpKO0FBQ0E7QUFDQUEsbUJBQU8vSCxJQUFQLENBQVksMkJBQVosRUFBeUMrRSxNQUF6QztBQUNBZ0QsbUJBQU8vSCxJQUFQLENBQVksMEJBQVosRUFBd0MrRSxNQUF4QztBQUNIOztBQUVELFlBQUs2QyxRQUFRVSxPQUFiLEVBQXVCO0FBQ25CVixvQkFBUVUsT0FBUixDQUFnQi9ILEtBQWhCLEdBQXdCOEgsUUFBeEIsQ0FBaUNOLE1BQWpDO0FBQ0gsU0FGRCxNQUVPO0FBQ0gvUCxjQUFFLGtDQUFGLEVBQXNDcVEsUUFBdEMsQ0FBK0NOLE1BQS9DLEVBQXVEN00sR0FBdkQsQ0FBMkQwTSxRQUFRakwsQ0FBbkU7QUFDQTNFLGNBQUUsa0NBQUYsRUFBc0NxUSxRQUF0QyxDQUErQ04sTUFBL0MsRUFBdUQ3TSxHQUF2RCxDQUEyRDBNLFFBQVF6UCxDQUFuRTtBQUNIOztBQUVELFlBQUt5UCxRQUFRVyxHQUFiLEVBQW1CO0FBQ2Z2USxjQUFFLG9DQUFGLEVBQXdDcVEsUUFBeEMsQ0FBaUROLE1BQWpELEVBQXlEN00sR0FBekQsQ0FBNkQwTSxRQUFRVyxHQUFyRTtBQUNIOztBQUVELFlBQUlDLFVBQVVwRyxRQUFRQyxNQUFSLENBQWUwRixNQUFmLEVBQXVCLENBQ2pDO0FBQ0kscUJBQVUsUUFEZDtBQUVJLHFCQUFVO0FBRmQsU0FEaUMsRUFLakM7QUFDSSxxQkFBVUgsUUFBUXRGLEtBRHRCO0FBRUkscUJBQVUsNkJBRmQ7QUFHSW1HLHNCQUFXLG9CQUFXOztBQUVsQixvQkFBSXBRLE9BQU8wUCxPQUFPeEcsR0FBUCxDQUFXLENBQVgsQ0FBWDtBQUNBLG9CQUFLLENBQUVsSixLQUFLcVEsYUFBTCxFQUFQLEVBQThCO0FBQzFCclEseUJBQUtzUSxjQUFMO0FBQ0EsMkJBQU8sS0FBUDtBQUNIOztBQUVELG9CQUFJWCxLQUFLaFEsRUFBRXFMLElBQUYsQ0FBTzBFLE9BQU8vSCxJQUFQLENBQVksZ0JBQVosRUFBOEI5RSxHQUE5QixFQUFQLENBQVQ7QUFDQSxvQkFBSStNLE9BQU9qUSxFQUFFcUwsSUFBRixDQUFPMEUsT0FBTy9ILElBQVAsQ0FBWSxxQkFBWixFQUFtQzlFLEdBQW5DLEVBQVAsQ0FBWDs7QUFFQSxvQkFBSyxDQUFFOE0sRUFBUCxFQUFZO0FBQ1I7QUFDQSwyQkFBTyxLQUFQO0FBQ0g7O0FBRURmLDZCQUFhLDRCQUFiO0FBQ0EyQiw0QkFBWTtBQUNSelEsdUJBQUksVUFESTtBQUVSNlAsd0JBQUtBLEVBRkc7QUFHUkMsMEJBQU9BLElBSEM7QUFJUkMsMEJBQU9ILE9BQU8vSCxJQUFQLENBQVksMEJBQVosRUFBd0M5RSxHQUF4QztBQUpDLGlCQUFaO0FBTUg7QUExQkwsU0FMaUMsQ0FBdkIsQ0FBZDs7QUFtQ0FzTixnQkFBUXhJLElBQVIsQ0FBYSwyQkFBYixFQUEwQzZJLElBQTFDLENBQStDLFlBQVc7QUFDdEQsZ0JBQUlDLFFBQVE5USxFQUFFLElBQUYsQ0FBWjtBQUNBLGdCQUFJK1EsU0FBUy9RLEVBQUUsTUFBTThRLE1BQU1uUCxJQUFOLENBQVcsSUFBWCxDQUFOLEdBQXlCLFFBQTNCLENBQWI7QUFDQSxnQkFBSXFQLFFBQVFGLE1BQU1uUCxJQUFOLENBQVcsV0FBWCxDQUFaOztBQUVBb1AsbUJBQU92SSxJQUFQLENBQVl3SSxRQUFRRixNQUFNNU4sR0FBTixHQUFZSixNQUFoQzs7QUFFQWdPLGtCQUFNRyxJQUFOLENBQVcsT0FBWCxFQUFvQixZQUFXO0FBQzNCRix1QkFBT3ZJLElBQVAsQ0FBWXdJLFFBQVFGLE1BQU01TixHQUFOLEdBQVlKLE1BQWhDO0FBQ0gsYUFGRDtBQUdILFNBVkQ7QUFXSDs7QUFFRCxhQUFTOE4sV0FBVCxDQUFxQjFJLE1BQXJCLEVBQTZCO0FBQ3pCLFlBQUkzQyxPQUFPdkYsRUFBRTZQLE1BQUYsQ0FBUyxFQUFULEVBQWEsRUFBRXFCLE1BQU8sTUFBVCxFQUFpQi9JLElBQUt0QyxHQUFHcUMsTUFBSCxDQUFVQyxFQUFoQyxFQUFiLEVBQW1ERCxNQUFuRCxDQUFYO0FBQ0FsSSxVQUFFK0csSUFBRixDQUFPO0FBQ0gzRixpQkFBTWlPLFNBREg7QUFFSDlKLGtCQUFPQTtBQUZKLFNBQVAsRUFHRzRMLElBSEgsQ0FHUSxVQUFTNUwsSUFBVCxFQUFlO0FBQ25CLGdCQUFJMkMsU0FBU3FILFdBQVdoSyxJQUFYLENBQWI7QUFDQTZKO0FBQ0EsZ0JBQUtsSCxPQUFPa0YsTUFBUCxJQUFpQixrQkFBdEIsRUFBMkM7QUFDdkM7QUFDQWdFLG9DQUFvQmxKLE1BQXBCO0FBQ0gsYUFIRCxNQUdPLElBQUtBLE9BQU9rRixNQUFQLElBQWlCLGtCQUF0QixFQUEyQztBQUM5Q3dCLDhCQUFjLHVDQUFkO0FBQ0gsYUFGTSxNQUVBO0FBQ0h5Qyx3QkFBUUMsR0FBUixDQUFZL0wsSUFBWjtBQUNIO0FBQ0osU0FkRCxFQWNHZ00sSUFkSCxDQWNRLFVBQVNDLEtBQVQsRUFBZ0JDLFVBQWhCLEVBQTRCQyxXQUE1QixFQUF5QztBQUM3Q0wsb0JBQVFDLEdBQVIsQ0FBWUcsVUFBWixFQUF3QkMsV0FBeEI7QUFDSCxTQWhCRDtBQWlCSDs7QUFFRCxhQUFTTixtQkFBVCxDQUE2QmxKLE1BQTdCLEVBQXFDO0FBQ2pDLFlBQUl5SixNQUFNM1IsRUFBRSx3QkFBRixDQUFWO0FBQ0EsWUFBSTRSLFlBQVl2QyxZQUFZLGNBQVosR0FBNkJuSCxPQUFPMkosT0FBcEQ7QUFDQSxZQUFJQyxLQUFLOVIsRUFBRSxLQUFGLEVBQVMyQixJQUFULENBQWMsTUFBZCxFQUFzQmlRLFNBQXRCLEVBQWlDcEosSUFBakMsQ0FBc0NOLE9BQU82SixTQUE3QyxDQUFUO0FBQ0EvUixVQUFFLFdBQUYsRUFBZXFRLFFBQWYsQ0FBd0JzQixHQUF4QixFQUE2QmxKLE1BQTdCLENBQW9DcUosRUFBcEM7QUFDQUgsWUFBSUssT0FBSixDQUFZLEtBQVosRUFBbUJDLFdBQW5CLENBQStCLE1BQS9COztBQUVBOztBQUVBO0FBQ0EsWUFBSUMsVUFBVXpELFNBQVN6RyxJQUFULENBQWMsbUJBQW1CRSxPQUFPMkosT0FBMUIsR0FBb0MsSUFBbEQsQ0FBZDtBQUNBSyxnQkFBUW5GLE1BQVI7O0FBRUFsSCxXQUFHbUosYUFBSCx1QkFBcUM5RyxPQUFPNkosU0FBNUM7QUFDSDs7QUFFRCxhQUFTSSxhQUFULENBQXVCQyxRQUF2QixFQUFpQ0MsV0FBakMsRUFBOEM1QixRQUE5QyxFQUF3RDs7QUFFcEQsWUFBSzJCLFlBQVksSUFBWixJQUFvQkEsV0FBV0MsV0FBWCxHQUF5QixJQUFsRCxFQUF5RDtBQUNyRCxnQkFBSUMsTUFBSjtBQUNBLGdCQUFJRCxjQUFjLENBQWxCLEVBQXFCO0FBQ2pCQyx5QkFBUyxXQUFXRCxXQUFYLEdBQXlCLFFBQWxDO0FBQ0gsYUFGRCxNQUdLO0FBQ0RDLHlCQUFTLFdBQVQ7QUFDSDtBQUNELGdCQUFJekQsTUFBTSxvQ0FBb0N1RCxRQUFwQyxHQUErQyxrQkFBL0MsR0FBb0VFLE1BQXBFLEdBQTZFLHVSQUF2Rjs7QUFFQTVMLG9CQUFRbUksR0FBUixFQUFhLFVBQVMwRCxNQUFULEVBQWlCO0FBQzFCLG9CQUFLQSxNQUFMLEVBQWM7QUFDVjlCO0FBQ0g7QUFDSixhQUpEO0FBS0gsU0FmRCxNQWVPO0FBQ0g7QUFDQUE7QUFDSDtBQUNKOztBQUVEO0FBQ0F6USxNQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLGVBQXRCLEVBQXVDLFVBQVM5QyxDQUFULEVBQVk7QUFDL0NBLFVBQUVrTyxjQUFGO0FBQ0EsWUFBSUMsU0FBUyxNQUFiOztBQUVBdkQ7O0FBRUEsWUFBSXdELHlCQUF5QmpFLFNBQVN6RyxJQUFULENBQWMsUUFBZCxFQUF3QjlFLEdBQXhCLEVBQTdCO0FBQ0EsWUFBSXlQLDJCQUEyQmxFLFNBQVN6RyxJQUFULENBQWMsd0JBQWQsRUFBd0NRLElBQXhDLEVBQS9COztBQUVBLFlBQU9rSywwQkFBMEJwRSx3QkFBakMsRUFBOEQ7QUFDMURNLDBCQUFjLCtCQUFkO0FBQ0E7QUFDSDs7QUFFRCxZQUFLOEQsMEJBQTBCbkUsb0JBQS9CLEVBQXNEO0FBQ2xEO0FBQ0FtQixxQ0FBeUI7QUFDckJJLDBCQUFXLElBRFU7QUFFckJuTCxtQkFBSStOLHNCQUZpQjtBQUdyQnZLLG9CQUFLdEMsR0FBR3FDLE1BQUgsQ0FBVUMsRUFITTtBQUlyQmhJLG1CQUFJc1M7QUFKaUIsYUFBekI7QUFNQTtBQUNIOztBQUVEO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQXhELHFCQUFhLGdEQUFiO0FBQ0EyQixvQkFBWTtBQUNSZ0MsZ0JBQUtGLHNCQURHO0FBRVJ2UyxlQUFLO0FBRkcsU0FBWjtBQUtILEtBdENEO0FBd0NILENBM1FEOzs7QUNBQTJGLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVwQixNQUFLLENBQUUvRixFQUFFLE1BQUYsRUFBVTZTLEVBQVYsQ0FBYSxPQUFiLENBQVAsRUFBK0I7QUFDN0I7QUFDRDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBaE4sS0FBR2lOLFVBQUgsR0FBZ0IsU0FBaEI7O0FBRUE7QUFDQSxNQUFLak4sR0FBR2tOLE1BQVIsRUFBaUI7QUFDZmxOLE9BQUdtTixVQUFILEdBQWdCLEdBQWhCO0FBQ0Q7O0FBRUQsTUFBSWxSLElBQUl1RCxPQUFPQyxRQUFQLENBQWdCa0IsSUFBaEIsQ0FBcUIvQyxPQUFyQixDQUE2QixnQkFBN0IsQ0FBUjtBQUNBLE1BQUszQixJQUFJLENBQUosSUFBUyxDQUFkLEVBQWtCO0FBQ2QrRCxPQUFHaU4sVUFBSCxHQUFnQixZQUFoQjtBQUNIOztBQUVEO0FBQ0EsTUFBSUcsT0FBT2pULEVBQUUsV0FBRixDQUFYO0FBQ0EsTUFBSWtULEtBQUtELEtBQUtqTCxJQUFMLENBQVUsU0FBVixDQUFUO0FBQ0FrTCxLQUFHbEwsSUFBSCxDQUFRLFlBQVIsRUFBc0I2SSxJQUF0QixDQUEyQixZQUFXO0FBQ2xDO0FBQ0EsUUFBSTFPLFdBQVcsa0VBQWY7QUFDQUEsZUFBV0EsU0FBU0YsT0FBVCxDQUFpQixTQUFqQixFQUE0QmpDLEVBQUUsSUFBRixFQUFRMkIsSUFBUixDQUFhLFVBQWIsRUFBeUIrQixNQUF6QixDQUFnQyxDQUFoQyxDQUE1QixFQUFnRXpCLE9BQWhFLENBQXdFLFdBQXhFLEVBQXFGakMsRUFBRSxJQUFGLEVBQVEyQixJQUFSLENBQWEsU0FBYixDQUFyRixDQUFYO0FBQ0F1UixPQUFHekssTUFBSCxDQUFVdEcsUUFBVjtBQUNILEdBTEQ7O0FBT0EsTUFBSTRGLFFBQVEvSCxFQUFFLFlBQUYsQ0FBWjtBQUNBcVIsVUFBUUMsR0FBUixDQUFZLFlBQVosRUFBMEJ2SixLQUExQjtBQUNBQSxRQUFNbEYsTUFBTixHQUFla0ssTUFBZjs7QUFFQWhGLFVBQVEvSCxFQUFFLHVDQUFGLENBQVI7QUFDQStILFFBQU1sRixNQUFOLEdBQWVrSyxNQUFmO0FBQ0QsQ0EzQ0Q7OztBQ0FBOztBQUVBLElBQUlsSCxLQUFLQSxNQUFNLEVBQWY7QUFDQSxJQUFJc04sc0JBQXNCLG9oQkFBMUI7O0FBRUF0TixHQUFHdU4sVUFBSCxHQUFnQjs7QUFFWkMsVUFBTSxjQUFTekQsT0FBVCxFQUFrQjtBQUNwQixhQUFLQSxPQUFMLEdBQWU1UCxFQUFFNlAsTUFBRixDQUFTLEVBQVQsRUFBYSxLQUFLRCxPQUFsQixFQUEyQkEsT0FBM0IsQ0FBZjtBQUNBLGFBQUt6SCxFQUFMLEdBQVUsS0FBS3lILE9BQUwsQ0FBYTFILE1BQWIsQ0FBb0JDLEVBQTlCO0FBQ0EsYUFBS21MLEdBQUwsR0FBVyxFQUFYO0FBQ0EsZUFBTyxJQUFQO0FBQ0gsS0FQVzs7QUFTWjFELGFBQVMsRUFURzs7QUFhWjJELFdBQVEsaUJBQVc7QUFDZixZQUFJN0ksT0FBTyxJQUFYO0FBQ0EsYUFBSzhJLFVBQUw7QUFDSCxLQWhCVzs7QUFrQlpBLGdCQUFZLHNCQUFXO0FBQ25CLFlBQUk5SSxPQUFPLElBQVg7QUFDQTtBQUNBMUssVUFBRSwwQkFBRixFQUE4QnlULFFBQTlCLENBQXVDLGFBQXZDO0FBQ0F6VCxVQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLDBCQUF0QixFQUFrRCxVQUFTOUMsQ0FBVCxFQUFZO0FBQzFEQSxjQUFFa08sY0FBRjtBQUNBcEksb0JBQVFzSixPQUFSO0FBQ0EsZ0JBQUsxVCxFQUFFLElBQUYsRUFBUTJCLElBQVIsQ0FBYSxLQUFiLEtBQXVCLE9BQTVCLEVBQXNDOztBQUVsQztBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOzs7QUFHQSxvQkFBSytJLEtBQUtrRixPQUFMLENBQWExSCxNQUFiLENBQW9CeUwsc0JBQXBCLElBQThDLElBQW5ELEVBQTBEO0FBQ3RELDJCQUFPLElBQVA7QUFDSDtBQUNEakoscUJBQUtrSixXQUFMLENBQWlCLElBQWpCO0FBQ0gsYUFoQkQsTUFnQk87QUFDSGxKLHFCQUFLbUosZ0JBQUwsQ0FBc0IsSUFBdEI7QUFDSDtBQUNELG1CQUFPLEtBQVA7QUFDSCxTQXZCRDtBQXlCSCxLQS9DVzs7QUFpRFpBLHNCQUFrQiwwQkFBU3BULElBQVQsRUFBZTtBQUM3QixZQUFJeUosT0FBT2xLLEVBQUUsbUJBQUYsRUFBdUJrSyxJQUF2QixFQUFYO0FBQ0FBLGVBQU9BLEtBQUtqSSxPQUFMLENBQWEsaUJBQWIsRUFBZ0NqQyxFQUFFLElBQUYsRUFBUTJCLElBQVIsQ0FBYSxNQUFiLENBQWhDLENBQVA7QUFDQSxhQUFLNk8sT0FBTCxHQUFlcEcsUUFBUTBKLEtBQVIsQ0FBYzVKLElBQWQsQ0FBZjtBQUNBO0FBQ0gsS0F0RFc7O0FBd0RaMEosaUJBQWEscUJBQVNuVCxJQUFULEVBQWU7QUFDeEIsWUFBSWlLLE9BQU8sSUFBWDtBQUNBQSxhQUFLM0MsS0FBTCxHQUFhL0gsRUFBRVMsSUFBRixDQUFiO0FBQ0FpSyxhQUFLcUosR0FBTCxHQUFXL1QsRUFBRVMsSUFBRixFQUFRa0IsSUFBUixDQUFhLE1BQWIsQ0FBWDtBQUNBK0ksYUFBS3NKLFVBQUwsR0FBa0JoVSxFQUFFUyxJQUFGLEVBQVE4RSxJQUFSLENBQWEsT0FBYixLQUF5QixLQUEzQzs7QUFFQSxZQUFLbUYsS0FBSzNDLEtBQUwsQ0FBV3hDLElBQVgsQ0FBZ0IsT0FBaEIsS0FBNEIsS0FBakMsRUFBeUM7QUFDckMsZ0JBQUssQ0FBRW1GLEtBQUszQyxLQUFMLENBQVd4QyxJQUFYLENBQWdCLEtBQWhCLENBQVAsRUFBZ0M7QUFDNUI7QUFDSDtBQUNKOztBQUVELFlBQUkyRTtBQUNBO0FBQ0EscUtBRUEsd0VBRkEsR0FHSSxvQ0FISixHQUlBLFFBSkE7QUFLQTtBQUNBO0FBQ0E7QUFQQSwySkFGSjs7QUFZQSxZQUFJSyxTQUFTLG1CQUFtQkcsS0FBS3NKLFVBQXJDO0FBQ0EsWUFBSUMsUUFBUXZKLEtBQUszQyxLQUFMLENBQVd4QyxJQUFYLENBQWdCLE9BQWhCLEtBQTRCLENBQXhDO0FBQ0EsWUFBSzBPLFFBQVEsQ0FBYixFQUFpQjtBQUNiLGdCQUFJQyxTQUFTRCxTQUFTLENBQVQsR0FBYSxNQUFiLEdBQXNCLE9BQW5DO0FBQ0ExSixzQkFBVSxPQUFPMEosS0FBUCxHQUFlLEdBQWYsR0FBcUJDLE1BQXJCLEdBQThCLEdBQXhDO0FBQ0g7O0FBRUR4SixhQUFLOEYsT0FBTCxHQUFlcEcsUUFBUUMsTUFBUixDQUNYSCxJQURXLEVBRVgsQ0FDSTtBQUNJSSxtQkFBUSxRQURaO0FBRUkscUJBQVUsbUJBRmQ7QUFHSW1HLHNCQUFVLG9CQUFXO0FBQ2pCLG9CQUFLL0YsS0FBSzhGLE9BQUwsQ0FBYWpMLElBQWIsQ0FBa0IsYUFBbEIsQ0FBTCxFQUF3QztBQUNwQ21GLHlCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUNBO0FBQ0g7QUFDRG5VLGtCQUFFK0csSUFBRixDQUFPO0FBQ0gzRix5QkFBS3NKLEtBQUtxSixHQUFMLEdBQVcsK0NBRGI7QUFFSEssOEJBQVUsUUFGUDtBQUdIQywyQkFBTyxLQUhKO0FBSUhDLDJCQUFPLGVBQVNDLEdBQVQsRUFBYzlDLFVBQWQsRUFBMEJDLFdBQTFCLEVBQXVDO0FBQzFDTCxnQ0FBUUMsR0FBUixDQUFZLDBCQUFaO0FBQ0E7QUFDQUQsZ0NBQVFDLEdBQVIsQ0FBWWlELEdBQVosRUFBaUI5QyxVQUFqQixFQUE2QkMsV0FBN0I7QUFDQSw0QkFBSzZDLElBQUlyTixNQUFKLElBQWMsR0FBbkIsRUFBeUI7QUFDckJ3RCxpQ0FBSzhKLGNBQUwsQ0FBb0JELEdBQXBCO0FBQ0gseUJBRkQsTUFFTztBQUNIN0osaUNBQUsrSixZQUFMO0FBQ0g7QUFDSjtBQWJFLGlCQUFQO0FBZUg7QUF2QkwsU0FESixDQUZXLEVBNkJYO0FBQ0lsSyxvQkFBUUEsTUFEWjtBQUVJcEMsZ0JBQUk7QUFGUixTQTdCVyxDQUFmO0FBa0NBdUMsYUFBS2dLLE9BQUwsR0FBZWhLLEtBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLGtCQUFsQixDQUFmOztBQUVBOztBQUVBMEMsYUFBS2lLLGVBQUw7QUFFSCxLQS9IVzs7QUFpSVpBLHFCQUFpQiwyQkFBVztBQUN4QixZQUFJakssT0FBTyxJQUFYO0FBQ0EsWUFBSW5GLE9BQU8sRUFBWDtBQUNBLFlBQUttRixLQUFLM0MsS0FBTCxDQUFXeEMsSUFBWCxDQUFnQixLQUFoQixDQUFMLEVBQThCO0FBQzFCQSxpQkFBSyxLQUFMLElBQWNtRixLQUFLM0MsS0FBTCxDQUFXeEMsSUFBWCxDQUFnQixLQUFoQixDQUFkO0FBQ0g7QUFDRHZGLFVBQUUrRyxJQUFGLENBQU87QUFDSDNGLGlCQUFLc0osS0FBS3FKLEdBQUwsQ0FBUzlSLE9BQVQsQ0FBaUIsSUFBakIsRUFBdUIsR0FBdkIsSUFBOEIsOENBRGhDO0FBRUhtUyxzQkFBVSxRQUZQO0FBR0hDLG1CQUFPLEtBSEo7QUFJSDlPLGtCQUFNQSxJQUpIO0FBS0grTyxtQkFBTyxlQUFTQyxHQUFULEVBQWM5QyxVQUFkLEVBQTBCQyxXQUExQixFQUF1QztBQUMxQ0wsd0JBQVFDLEdBQVIsQ0FBWSwrQkFBWjtBQUNBLG9CQUFLNUcsS0FBSzhGLE9BQVYsRUFBb0I7QUFBRTlGLHlCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUE0QjtBQUNsRCxvQkFBS0ksSUFBSXJOLE1BQUosSUFBYyxHQUFuQixFQUF5QjtBQUNyQndELHlCQUFLOEosY0FBTCxDQUFvQkQsR0FBcEI7QUFDSCxpQkFGRCxNQUVPO0FBQ0g3Six5QkFBSytKLFlBQUwsQ0FBa0JGLEdBQWxCO0FBQ0g7QUFDSjtBQWJFLFNBQVA7QUFlSCxLQXRKVzs7QUF3SlpLLG9CQUFnQix3QkFBU0MsWUFBVCxFQUF1QkMsWUFBdkIsRUFBcUNiLEtBQXJDLEVBQTRDO0FBQ3hELFlBQUl2SixPQUFPLElBQVg7QUFDQUEsYUFBS3FLLFVBQUw7QUFDQXJLLGFBQUs4RixPQUFMLENBQWEyRCxVQUFiO0FBQ0gsS0E1Slc7O0FBOEpaYSwwQkFBc0IsOEJBQVNILFlBQVQsRUFBdUJDLFlBQXZCLEVBQXFDYixLQUFyQyxFQUE0QztBQUM5RCxZQUFJdkosT0FBTyxJQUFYOztBQUVBLFlBQUtBLEtBQUt1SyxLQUFWLEVBQWtCO0FBQ2Q1RCxvQkFBUUMsR0FBUixDQUFZLGlCQUFaO0FBQ0E7QUFDSDs7QUFFRDVHLGFBQUs0SSxHQUFMLENBQVN1QixZQUFULEdBQXdCQSxZQUF4QjtBQUNBbkssYUFBSzRJLEdBQUwsQ0FBU3dCLFlBQVQsR0FBd0JBLFlBQXhCO0FBQ0FwSyxhQUFLNEksR0FBTCxDQUFTVyxLQUFULEdBQWlCQSxLQUFqQjs7QUFFQXZKLGFBQUt3SyxVQUFMLEdBQWtCLElBQWxCO0FBQ0F4SyxhQUFLeUssYUFBTCxHQUFxQixDQUFyQjtBQUNBekssYUFBSzVJLENBQUwsR0FBUyxDQUFUOztBQUVBNEksYUFBS3VLLEtBQUwsR0FBYXZMLFlBQVksWUFBVztBQUFFZ0IsaUJBQUswSyxXQUFMO0FBQXFCLFNBQTlDLEVBQWdELElBQWhELENBQWI7QUFDQTtBQUNBMUssYUFBSzBLLFdBQUw7QUFFSCxLQWxMVzs7QUFvTFpBLGlCQUFhLHVCQUFXO0FBQ3BCLFlBQUkxSyxPQUFPLElBQVg7QUFDQUEsYUFBSzVJLENBQUwsSUFBVSxDQUFWO0FBQ0E5QixVQUFFK0csSUFBRixDQUFPO0FBQ0gzRixpQkFBTXNKLEtBQUs0SSxHQUFMLENBQVN1QixZQURaO0FBRUh0UCxrQkFBTyxFQUFFOFAsSUFBTSxJQUFJeE4sSUFBSixFQUFELENBQVdDLE9BQVgsRUFBUCxFQUZKO0FBR0h1TSxtQkFBUSxLQUhMO0FBSUhELHNCQUFVLE1BSlA7QUFLSGtCLHFCQUFVLGlCQUFTL1AsSUFBVCxFQUFlO0FBQ3JCLG9CQUFJMkIsU0FBU3dELEtBQUs2SyxjQUFMLENBQW9CaFEsSUFBcEIsQ0FBYjtBQUNBbUYscUJBQUt5SyxhQUFMLElBQXNCLENBQXRCO0FBQ0Esb0JBQUtqTyxPQUFPaUssSUFBWixFQUFtQjtBQUNmekcseUJBQUtxSyxVQUFMO0FBQ0gsaUJBRkQsTUFFTyxJQUFLN04sT0FBT29OLEtBQVAsSUFBZ0JwTixPQUFPc08sWUFBUCxHQUFzQixHQUEzQyxFQUFpRDtBQUNwRDlLLHlCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUNBekoseUJBQUsrSyxtQkFBTDtBQUNBL0sseUJBQUtxSyxVQUFMO0FBQ0FySyx5QkFBS2dMLFFBQUw7QUFDSCxpQkFMTSxNQUtBLElBQUt4TyxPQUFPb04sS0FBWixFQUFvQjtBQUN2QjVKLHlCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUNBekoseUJBQUsrSixZQUFMO0FBQ0EvSix5QkFBS3FLLFVBQUw7QUFDSDtBQUNKLGFBcEJFO0FBcUJIVCxtQkFBUSxlQUFTQyxHQUFULEVBQWM5QyxVQUFkLEVBQTBCQyxXQUExQixFQUF1QztBQUMzQ0wsd0JBQVFDLEdBQVIsQ0FBWSxVQUFaLEVBQXdCaUQsR0FBeEIsRUFBNkIsR0FBN0IsRUFBa0M5QyxVQUFsQyxFQUE4QyxHQUE5QyxFQUFtREMsV0FBbkQ7QUFDQWhILHFCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUNBekoscUJBQUtxSyxVQUFMO0FBQ0Esb0JBQUtSLElBQUlyTixNQUFKLElBQWMsR0FBZCxLQUFzQndELEtBQUs1SSxDQUFMLEdBQVMsRUFBVCxJQUFlNEksS0FBS3lLLGFBQUwsR0FBcUIsQ0FBMUQsQ0FBTCxFQUFvRTtBQUNoRXpLLHlCQUFLK0osWUFBTDtBQUNIO0FBQ0o7QUE1QkUsU0FBUDtBQThCSCxLQXJOVzs7QUF1TlpjLG9CQUFnQix3QkFBU2hRLElBQVQsRUFBZTtBQUMzQixZQUFJbUYsT0FBTyxJQUFYO0FBQ0EsWUFBSXhELFNBQVMsRUFBRWlLLE1BQU8sS0FBVCxFQUFnQm1ELE9BQVEsS0FBeEIsRUFBYjtBQUNBLFlBQUlxQixPQUFKOztBQUVBLFlBQUlDLFVBQVVyUSxLQUFLMkIsTUFBbkI7QUFDQSxZQUFLME8sV0FBVyxLQUFYLElBQW9CQSxXQUFXLE1BQXBDLEVBQTZDO0FBQ3pDMU8sbUJBQU9pSyxJQUFQLEdBQWMsSUFBZDtBQUNBd0Usc0JBQVUsR0FBVjtBQUNILFNBSEQsTUFHTztBQUNIQyxzQkFBVXJRLEtBQUtzUSxZQUFmO0FBQ0FGLHNCQUFVLE9BQVFDLFVBQVVsTCxLQUFLNEksR0FBTCxDQUFTVyxLQUEzQixDQUFWO0FBQ0g7O0FBRUQsWUFBS3ZKLEtBQUtvTCxZQUFMLElBQXFCSCxPQUExQixFQUFvQztBQUNoQ2pMLGlCQUFLb0wsWUFBTCxHQUFvQkgsT0FBcEI7QUFDQWpMLGlCQUFLOEssWUFBTCxHQUFvQixDQUFwQjtBQUNILFNBSEQsTUFHTztBQUNIOUssaUJBQUs4SyxZQUFMLElBQXFCLENBQXJCO0FBQ0g7O0FBRUQ7QUFDQSxZQUFLOUssS0FBSzhLLFlBQUwsR0FBb0IsR0FBekIsRUFBK0I7QUFDM0J0TyxtQkFBT29OLEtBQVAsR0FBZSxJQUFmO0FBQ0g7O0FBRUQsWUFBSzVKLEtBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLFVBQWxCLEVBQThCNkssRUFBOUIsQ0FBaUMsVUFBakMsQ0FBTCxFQUFvRDtBQUNoRG5JLGlCQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixVQUFsQixFQUE4QmtDLElBQTlCLHlDQUF5RVEsS0FBS3NKLFVBQTlFO0FBQ0F0SixpQkFBSzhGLE9BQUwsQ0FBYXhJLElBQWIsQ0FBa0IsV0FBbEIsRUFBK0JpSyxXQUEvQixDQUEyQyxNQUEzQztBQUNBdkgsaUJBQUtxTCxnQkFBTCxzQ0FBeURyTCxLQUFLc0osVUFBOUQ7QUFDSDs7QUFFRHRKLGFBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLE1BQWxCLEVBQTBCZ08sR0FBMUIsQ0FBOEIsRUFBRUMsT0FBUU4sVUFBVSxHQUFwQixFQUE5Qjs7QUFFQSxZQUFLQSxXQUFXLEdBQWhCLEVBQXNCO0FBQ2xCakwsaUJBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLFdBQWxCLEVBQStCbUgsSUFBL0I7QUFDQSxnQkFBSStHLGVBQWVDLFVBQVVDLFNBQVYsQ0FBb0IzUyxPQUFwQixDQUE0QixVQUE1QixLQUEyQyxDQUFDLENBQTVDLEdBQWdELFFBQWhELEdBQTJELE9BQTlFO0FBQ0FpSCxpQkFBSzhGLE9BQUwsQ0FBYXhJLElBQWIsQ0FBa0IsVUFBbEIsRUFBOEJrQyxJQUE5Qix3QkFBd0RRLEtBQUtzSixVQUE3RCxpRUFBaUlrQyxZQUFqSTtBQUNBeEwsaUJBQUtxTCxnQkFBTCxxQkFBd0NyTCxLQUFLc0osVUFBN0MsdUNBQXlGa0MsWUFBekY7O0FBRUE7QUFDQSxnQkFBSUcsZ0JBQWdCM0wsS0FBSzhGLE9BQUwsQ0FBYXhJLElBQWIsQ0FBa0IsZUFBbEIsQ0FBcEI7QUFDQSxnQkFBSyxDQUFFcU8sY0FBY3ZULE1BQXJCLEVBQThCO0FBQzFCdVQsZ0NBQWdCclcsRUFBRSx3RkFBd0ZpQyxPQUF4RixDQUFnRyxjQUFoRyxFQUFnSHlJLEtBQUtzSixVQUFySCxDQUFGLEVBQW9JclMsSUFBcEksQ0FBeUksTUFBekksRUFBaUorSSxLQUFLNEksR0FBTCxDQUFTd0IsWUFBMUosQ0FBaEI7QUFDQSxvQkFBS3VCLGNBQWM5TSxHQUFkLENBQWtCLENBQWxCLEVBQXFCK00sUUFBckIsSUFBaUNyVyxTQUF0QyxFQUFrRDtBQUM5Q29XLGtDQUFjMVUsSUFBZCxDQUFtQixRQUFuQixFQUE2QixRQUE3QjtBQUNIO0FBQ0QwVSw4QkFBY2hHLFFBQWQsQ0FBdUIzRixLQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixnQkFBbEIsQ0FBdkIsRUFBNERaLEVBQTVELENBQStELE9BQS9ELEVBQXdFLFVBQVM5QyxDQUFULEVBQVk7QUFDaEZvRyx5QkFBSzNDLEtBQUwsQ0FBV2xCLE9BQVgsQ0FBbUIsY0FBbkI7QUFDQVQsK0JBQVcsWUFBVztBQUNsQnNFLDZCQUFLOEYsT0FBTCxDQUFhMkQsVUFBYjtBQUNBa0Msc0NBQWN0SixNQUFkO0FBQ0FsSCwyQkFBRzBRLE1BQUgsQ0FBVUMsUUFBVixDQUFtQkMsWUFBbkIsQ0FBZ0NDLGVBQWhDO0FBQ0E7QUFDSCxxQkFMRCxFQUtHLElBTEg7QUFNQXBTLHNCQUFFcVMsZUFBRjtBQUNILGlCQVREO0FBVUFOLDhCQUFjTyxLQUFkO0FBQ0g7QUFDRGxNLGlCQUFLOEYsT0FBTCxDQUFhakwsSUFBYixDQUFrQixhQUFsQixFQUFpQyxJQUFqQztBQUNBO0FBQ0E7QUFDSCxTQTVCRCxNQTRCTztBQUNIbUYsaUJBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLFVBQWxCLEVBQThCUSxJQUE5QixzQ0FBc0VrQyxLQUFLc0osVUFBM0UsVUFBMEY2QyxLQUFLQyxJQUFMLENBQVVuQixPQUFWLENBQTFGO0FBQ0FqTCxpQkFBS3FMLGdCQUFMLENBQXlCYyxLQUFLQyxJQUFMLENBQVVuQixPQUFWLENBQXpCO0FBQ0g7O0FBRUQsZUFBT3pPLE1BQVA7QUFDSCxLQTNSVzs7QUE2Ulo2TixnQkFBWSxzQkFBVztBQUNuQixZQUFJckssT0FBTyxJQUFYO0FBQ0EsWUFBS0EsS0FBS3VLLEtBQVYsRUFBa0I7QUFDZDhCLDBCQUFjck0sS0FBS3VLLEtBQW5CO0FBQ0F2SyxpQkFBS3VLLEtBQUwsR0FBYSxJQUFiO0FBQ0g7QUFDSixLQW5TVzs7QUFxU1pULG9CQUFnQix3QkFBU0QsR0FBVCxFQUFjO0FBQzFCLFlBQUk3SixPQUFPLElBQVg7QUFDQSxZQUFJc00sVUFBVTNOLFNBQVNrTCxJQUFJcE4saUJBQUosQ0FBc0Isb0JBQXRCLENBQVQsQ0FBZDtBQUNBLFlBQUk4UCxPQUFPMUMsSUFBSXBOLGlCQUFKLENBQXNCLGNBQXRCLENBQVg7O0FBRUEsWUFBSzZQLFdBQVcsQ0FBaEIsRUFBb0I7QUFDaEI7QUFDQTVRLHVCQUFXLFlBQVc7QUFDcEJzRSxxQkFBS2lLLGVBQUw7QUFDRCxhQUZELEVBRUcsSUFGSDtBQUdBO0FBQ0g7O0FBRURxQyxtQkFBVyxJQUFYO0FBQ0EsWUFBSXBQLE1BQU8sSUFBSUMsSUFBSixFQUFELENBQVdDLE9BQVgsRUFBVjtBQUNBLFlBQUlvUCxZQUFjTCxLQUFLQyxJQUFMLENBQVUsQ0FBQ0UsVUFBVXBQLEdBQVgsSUFBa0IsSUFBNUIsQ0FBbEI7O0FBRUEsWUFBSXNDLE9BQ0YsQ0FBQyxVQUNDLGtJQURELEdBRUMsc0hBRkQsR0FHRCxRQUhBLEVBR1VqSSxPQUhWLENBR2tCLFFBSGxCLEVBRzRCZ1YsSUFINUIsRUFHa0NoVixPQUhsQyxDQUcwQyxhQUgxQyxFQUd5RGlWLFNBSHpELENBREY7O0FBTUF4TSxhQUFLOEYsT0FBTCxHQUFlcEcsUUFBUUMsTUFBUixDQUNYSCxJQURXLEVBRVgsQ0FDSTtBQUNJSSxtQkFBUSxJQURaO0FBRUkscUJBQVUseUJBRmQ7QUFHSW1HLHNCQUFVLG9CQUFXO0FBQ2pCc0csOEJBQWNyTSxLQUFLeU0sZUFBbkI7QUFDQSx1QkFBTyxJQUFQO0FBQ0g7QUFOTCxTQURKLENBRlcsQ0FBZjs7QUFjQXpNLGFBQUt5TSxlQUFMLEdBQXVCek4sWUFBWSxZQUFXO0FBQ3hDd04seUJBQWEsQ0FBYjtBQUNBeE0saUJBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLG1CQUFsQixFQUF1Q1EsSUFBdkMsQ0FBNEMwTyxTQUE1QztBQUNBLGdCQUFLQSxhQUFhLENBQWxCLEVBQXNCO0FBQ3BCSCw4QkFBY3JNLEtBQUt5TSxlQUFuQjtBQUNEO0FBQ0Q5RixvQkFBUUMsR0FBUixDQUFZLFNBQVosRUFBdUI0RixTQUF2QjtBQUNMLFNBUHNCLEVBT3BCLElBUG9CLENBQXZCO0FBU0gsS0FuVlc7O0FBcVZaekIseUJBQXFCLDZCQUFTbEIsR0FBVCxFQUFjO0FBQy9CLFlBQUlySyxPQUNBLFFBQ0kseUVBREosR0FFSSxrQ0FGSixHQUdBLE1BSEEsR0FJQSxLQUpBLEdBS0ksNEZBTEosR0FNSSxvTEFOSixHQU9JLHNGQVBKLEdBUUEsTUFUSjs7QUFXQTtBQUNBRSxnQkFBUUMsTUFBUixDQUNJSCxJQURKLEVBRUksQ0FDSTtBQUNJSSxtQkFBUSxJQURaO0FBRUkscUJBQVU7QUFGZCxTQURKLENBRkosRUFRSSxFQUFFK0IsU0FBVSxPQUFaLEVBUko7O0FBV0FnRixnQkFBUUMsR0FBUixDQUFZaUQsR0FBWjtBQUNILEtBOVdXOztBQWdYWkUsa0JBQWMsc0JBQVNGLEdBQVQsRUFBYztBQUN4QixZQUFJckssT0FDQSxRQUNJLG9DQURKLEdBQzJDLEtBQUs4SixVQURoRCxHQUM2RCw2QkFEN0QsR0FFQSxNQUZBLEdBR0EsS0FIQSxHQUlJLCtCQUpKLEdBS0EsTUFOSjs7QUFRQTtBQUNBNUosZ0JBQVFDLE1BQVIsQ0FDSUgsSUFESixFQUVJLENBQ0k7QUFDSUksbUJBQVEsSUFEWjtBQUVJLHFCQUFVO0FBRmQsU0FESixDQUZKLEVBUUksRUFBRStCLFNBQVUsT0FBWixFQVJKOztBQVdBZ0YsZ0JBQVFDLEdBQVIsQ0FBWWlELEdBQVo7QUFDSCxLQXRZVzs7QUF3WVptQixjQUFVLG9CQUFXO0FBQ2pCLFlBQUloTCxPQUFPLElBQVg7QUFDQTFLLFVBQUV1SixHQUFGLENBQU1tQixLQUFLcUosR0FBTCxHQUFXLGdCQUFYLEdBQThCckosS0FBSzhLLFlBQXpDO0FBQ0gsS0EzWVc7O0FBNllaTyxzQkFBa0IsMEJBQVNwTixPQUFULEVBQWtCO0FBQ2hDLFlBQUkrQixPQUFPLElBQVg7QUFDQSxZQUFLQSxLQUFLME0sWUFBTCxJQUFxQnpPLE9BQTFCLEVBQW9DO0FBQ2xDLGdCQUFLK0IsS0FBSzJNLFVBQVYsRUFBdUI7QUFBRUMsNkJBQWE1TSxLQUFLMk0sVUFBbEIsRUFBK0IzTSxLQUFLMk0sVUFBTCxHQUFrQixJQUFsQjtBQUF5Qjs7QUFFakZqUix1QkFBVyxZQUFNO0FBQ2ZzRSxxQkFBS2dLLE9BQUwsQ0FBYWxNLElBQWIsQ0FBa0JHLE9BQWxCO0FBQ0ErQixxQkFBSzBNLFlBQUwsR0FBb0J6TyxPQUFwQjtBQUNBMEksd0JBQVFDLEdBQVIsQ0FBWSxZQUFaLEVBQTBCM0ksT0FBMUI7QUFDRCxhQUpELEVBSUcsRUFKSDtBQUtBK0IsaUJBQUsyTSxVQUFMLEdBQWtCalIsV0FBVyxZQUFNO0FBQ2pDc0UscUJBQUtnSyxPQUFMLENBQWFuTCxHQUFiLENBQWlCLENBQWpCLEVBQW9CZ08sU0FBcEIsR0FBZ0MsRUFBaEM7QUFDRCxhQUZpQixFQUVmLEdBRmUsQ0FBbEI7QUFJRDtBQUNKLEtBNVpXOztBQThaWkMsU0FBSzs7QUE5Wk8sQ0FBaEI7O0FBa2FBMVIsS0FBS0MsS0FBTCxDQUFXLFlBQVc7QUFDbEJGLE9BQUc0UixVQUFILEdBQWdCelcsT0FBTzBXLE1BQVAsQ0FBYzdSLEdBQUd1TixVQUFqQixFQUE2QkMsSUFBN0IsQ0FBa0M7QUFDOUNuTCxnQkFBU3JDLEdBQUdxQztBQURrQyxLQUFsQyxDQUFoQjs7QUFJQXJDLE9BQUc0UixVQUFILENBQWNsRSxLQUFkOztBQUVBLFFBQUlvRSxxQkFBcUIsQ0FBekI7QUFDQTNYLE1BQUUscUJBQUYsRUFBeUJvSCxFQUF6QixDQUE0QixPQUE1QixFQUFxQyxVQUFTOUMsQ0FBVCxFQUFZO0FBQzdDLFlBQUssS0FBS2tGLE9BQUwsQ0FBYW9PLFdBQWIsSUFBNEIsTUFBakMsRUFBMEM7QUFDdEMsZ0JBQUtELHNCQUFzQixDQUF0QixJQUE2QixTQUFTQSxxQkFBcUIsQ0FBckIsSUFBMEIsQ0FBckUsRUFBMkU7QUFDdkUsb0JBQUssQ0FBRXRTLE9BQU9xQixPQUFQLENBQWV5TSxtQkFBZixDQUFQLEVBQTZDO0FBQ3pDN08sc0JBQUVrTyxjQUFGO0FBQ0FsTyxzQkFBRXFTLGVBQUY7QUFDQSwyQkFBTyxLQUFQO0FBQ0g7QUFDSjtBQUNEZ0Isa0NBQXNCLENBQXRCO0FBQ0g7QUFDSixLQVhEOztBQWFBO0FBQ0EzWCxNQUFFLHVCQUFGLEVBQTJCb0gsRUFBM0IsQ0FBOEIsT0FBOUIsRUFBdUMsVUFBUzlDLENBQVQsRUFBWTtBQUMvQ0EsVUFBRWtPLGNBQUY7O0FBRUEsWUFBSXFGLFlBQVloUyxHQUFHMFEsTUFBSCxDQUFVQyxRQUFWLENBQW1CQyxZQUFuQixDQUFnQ3FCLGlCQUFoQyxFQUFoQjs7QUFFQSxZQUFLRCxVQUFVL1UsTUFBVixJQUFvQixDQUF6QixFQUE2QjtBQUN6QixnQkFBSWlWLFVBQVUsRUFBZDs7QUFFQSxnQkFBSWxKLE1BQU0sQ0FBRSxpREFBRixDQUFWO0FBQ0EsZ0JBQUtoSixHQUFHMFEsTUFBSCxDQUFVekwsSUFBVixDQUFlYSxJQUFmLElBQXVCLEtBQTVCLEVBQW9DO0FBQ2hDa0Qsb0JBQUl2TCxJQUFKLENBQVMsMEVBQVQ7QUFDQXVMLG9CQUFJdkwsSUFBSixDQUFTLDBFQUFUO0FBQ0gsYUFIRCxNQUdPO0FBQ0h1TCxvQkFBSXZMLElBQUosQ0FBUyxrRUFBVDtBQUNBLG9CQUFLdUMsR0FBRzBRLE1BQUgsQ0FBVXpMLElBQVYsQ0FBZWEsSUFBZixJQUF1QixPQUE1QixFQUFzQztBQUNsQ2tELHdCQUFJdkwsSUFBSixDQUFTLDJFQUFUO0FBQ0gsaUJBRkQsTUFFTztBQUNIdUwsd0JBQUl2TCxJQUFKLENBQVMsNEVBQVQ7QUFDSDtBQUNKO0FBQ0R1TCxnQkFBSXZMLElBQUosQ0FBUyxvR0FBVDtBQUNBdUwsZ0JBQUl2TCxJQUFKLENBQVMsc09BQVQ7O0FBRUF1TCxrQkFBTUEsSUFBSXRCLElBQUosQ0FBUyxJQUFULENBQU47O0FBRUF3SyxvQkFBUXpVLElBQVIsQ0FBYTtBQUNUZ0gsdUJBQU8sSUFERTtBQUVULHlCQUFVO0FBRkQsYUFBYjtBQUlBRixvQkFBUUMsTUFBUixDQUFld0UsR0FBZixFQUFvQmtKLE9BQXBCO0FBQ0EsbUJBQU8sS0FBUDtBQUNIOztBQUdELFlBQUlDLE1BQU1uUyxHQUFHMFEsTUFBSCxDQUFVQyxRQUFWLENBQW1CQyxZQUFuQixDQUFnQ3dCLHNCQUFoQyxDQUF1REosU0FBdkQsQ0FBVjs7QUFFQTdYLFVBQUUsSUFBRixFQUFRdUYsSUFBUixDQUFhLEtBQWIsRUFBb0J5UyxHQUFwQjtBQUNBblMsV0FBRzRSLFVBQUgsQ0FBYzdELFdBQWQsQ0FBMEIsSUFBMUI7QUFDSCxLQXRDRDtBQXdDSCxDQTlERDs7O0FDdmFBO0FBQ0E5TixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIsUUFBSW1TLGFBQWEsS0FBakI7QUFDQSxRQUFJQyxZQUFhLEtBQWpCO0FBQ0EsUUFBSUMsT0FBT3ZTLEdBQUdxQyxNQUFILENBQVVDLEVBQXJCO0FBQ0EsUUFBSWtRLGdCQUFnQixrQ0FBcEI7O0FBRUEsUUFBSUMsYUFBSjtBQUNBLFFBQUlDLGtCQUFrQixTQUFsQkEsZUFBa0IsQ0FBU0MsQ0FBVCxFQUFXQyxDQUFYLEVBQWM7QUFBQyxlQUFPLG9CQUFvQkQsQ0FBcEIsR0FBd0IsWUFBeEIsR0FBdUNDLENBQXZDLEdBQTJDLElBQWxEO0FBQXdELEtBQTdGO0FBQ0EsUUFBSUMsa0JBQWtCLHNDQUFzQ04sSUFBdEMsR0FBNkMsbUNBQW5FOztBQUVBLFFBQUlySSxTQUFTL1AsRUFDYixvQ0FDSSxzQkFESixHQUVRLHlEQUZSLEdBR1ksUUFIWixHQUd1QnFZLGFBSHZCLEdBR3VDLG1KQUh2QyxHQUlJLFFBSkosR0FLSSw0R0FMSixHQU1JLGlFQU5KLEdBT0ksOEVBUEosR0FRSUUsZ0JBQWdCTCxVQUFoQixFQUE0QkMsU0FBNUIsQ0FSSixHQVE2Q08sZUFSN0MsR0FRK0QsYUFSL0QsR0FTSSx3QkFUSixHQVVRLGdGQVZSLEdBV1EsZ0RBWFIsR0FZWSxxREFaWixHQWFRLFVBYlIsR0FjUSw0REFkUixHQWVRLDhDQWZSLEdBZ0JZLHNEQWhCWixHQWlCUSxVQWpCUixHQWtCSSxRQWxCSixHQW1CSSxTQW5CSixHQW9CQSxRQXJCYSxDQUFiOztBQXlCQTtBQUNBMVksTUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQixZQUF0QixFQUFvQyxVQUFTOUMsQ0FBVCxFQUFZO0FBQzVDQSxVQUFFa08sY0FBRjtBQUNBcEksZ0JBQVFDLE1BQVIsQ0FBZTBGLE1BQWYsRUFBdUIsQ0FDbkI7QUFDSSxxQkFBVSxRQURkO0FBRUkscUJBQVU7QUFGZCxTQURtQixDQUF2Qjs7QUFPQTtBQUNBQSxlQUFPNEksT0FBUCxDQUFlLFFBQWYsRUFBeUJsRixRQUF6QixDQUFrQyxvQkFBbEM7O0FBRUE7QUFDQSxZQUFJbUYsV0FBVzdJLE9BQU8vSCxJQUFQLENBQVksMEJBQVosQ0FBZjtBQUNKNFEsaUJBQVN4UixFQUFULENBQVksT0FBWixFQUFxQixZQUFZO0FBQzdCcEgsY0FBRSxJQUFGLEVBQVE2WSxNQUFSO0FBQ0gsU0FGRDs7QUFJSTtBQUNBN1ksVUFBRSwrQkFBRixFQUFtQzhZLEtBQW5DLENBQXlDLFlBQVk7QUFDckRSLDRCQUFnQkMsZ0JBQWdCTCxVQUFoQixFQUE0QkMsU0FBNUIsSUFBeUNPLGVBQXpEO0FBQ0lFLHFCQUFTMVYsR0FBVCxDQUFhb1YsYUFBYjtBQUNILFNBSEQ7QUFJQXRZLFVBQUUsNkJBQUYsRUFBaUM4WSxLQUFqQyxDQUF1QyxZQUFZO0FBQ25EUiw0QkFBZ0JDLGdCQUFnQkosU0FBaEIsRUFBMkJELFVBQTNCLElBQXlDUSxlQUF6RDtBQUNJRSxxQkFBUzFWLEdBQVQsQ0FBYW9WLGFBQWI7QUFDSCxTQUhEO0FBSUgsS0EzQkQ7QUE0QkgsQ0FqRUQ7OztBQ0RBO0FBQ0EsSUFBSXpTLEtBQUtBLE1BQU0sRUFBZjtBQUNBQSxHQUFHa1QsUUFBSCxHQUFjLEVBQWQ7QUFDQWxULEdBQUdrVCxRQUFILENBQVkxTyxNQUFaLEdBQXFCLFlBQVc7QUFDNUIsUUFBSUgsT0FDQSxXQUNBLGdCQURBLEdBRUEsd0NBRkEsR0FHQSxvRUFIQSxHQUlBLCtHQUpBLEdBS0EsNElBTEEsR0FNQSxpQkFOQSxHQU9BLGdCQVBBLEdBUUEsK0RBUkEsR0FTQSw0RUFUQSxHQVVBLCtCQVZBLEdBV0EsK0ZBWEEsR0FZQSxnRUFaQSxHQWFBLHVEQWJBLEdBY0Esc0JBZEEsR0FlQSxnQkFmQSxHQWdCQSwrQkFoQkEsR0FpQkEsbUdBakJBLEdBa0JBLCtEQWxCQSxHQW1CQSxtREFuQkEsR0FvQkEsc0JBcEJBLEdBcUJBLGdCQXJCQSxHQXNCQSwrQkF0QkEsR0F1QkEsZ0dBdkJBLEdBd0JBLCtEQXhCQSxHQXlCQSx1RUF6QkEsR0EwQkEsc0JBMUJBLEdBMkJBLGdCQTNCQSxHQTRCQSwrQkE1QkEsR0E2QkEsNkdBN0JBLEdBOEJBLCtEQTlCQSxHQStCQSwrQkEvQkEsR0FnQ0Esc0JBaENBLEdBaUNBLGdCQWpDQSxHQWtDQSxpQkFsQ0EsR0FtQ0EsZ0JBbkNBLEdBb0NBLHdEQXBDQSxHQXFDQSxtRUFyQ0EsR0FzQ0EsK0JBdENBLEdBdUNBLDJGQXZDQSxHQXdDQSxrREF4Q0EsR0F5Q0EsMkNBekNBLEdBMENBLHNCQTFDQSxHQTJDQSxnQkEzQ0EsR0E0Q0EsK0JBNUNBLEdBNkNBLDRGQTdDQSxHQThDQSxrREE5Q0EsR0ErQ0EsNkJBL0NBLEdBZ0RBLHNCQWhEQSxHQWlEQSxnQkFqREEsR0FrREEsK0JBbERBLEdBbURBLDRGQW5EQSxHQW9EQSxrREFwREEsR0FxREEsMENBckRBLEdBc0RBLHNCQXREQSxHQXVEQSxnQkF2REEsR0F3REEsK0JBeERBLEdBeURBLDZLQXpEQSxHQTBEQSxnQkExREEsR0EyREEsaUJBM0RBLEdBNERBLGdCQTVEQSxHQTZEQSx1REE3REEsR0E4REEsd0VBOURBLEdBK0RBLG1IQS9EQSxHQWdFQSwwQkFoRUEsR0FpRUEsNEVBakVBLEdBa0VBLCtCQWxFQSxHQW1FQSw2RkFuRUEsR0FvRUEsZ0RBcEVBLEdBcUVBLG9GQXJFQSxHQXNFQSxzQkF0RUEsR0F1RUEsZ0JBdkVBLEdBd0VBLCtCQXhFQSxHQXlFQSwyRkF6RUEsR0EwRUEsZ0RBMUVBLEdBMkVBLGlFQTNFQSxHQTRFQSxzQkE1RUEsR0E2RUEsZ0JBN0VBLEdBOEVBLCtCQTlFQSxHQStFQSwyR0EvRUEsR0FnRkEsZ0RBaEZBLEdBaUZBLCtCQWpGQSxHQWtGQSxzQkFsRkEsR0FtRkEsZ0JBbkZBLEdBb0ZBLGlCQXBGQSxHQXFGQSxnQkFyRkEsR0FzRkEsc0RBdEZBLEdBdUZBLGFBdkZBLEdBd0ZBLHlGQXhGQSxHQXlGQSwwRUF6RkEsR0EwRkEsY0ExRkEsR0EyRkEsaUJBM0ZBLEdBNEZBLFNBN0ZKOztBQStGQSxRQUFJOE8sUUFBUWhaLEVBQUVrSyxJQUFGLENBQVo7O0FBRUE7QUFDQWxLLE1BQUUsc0NBQUYsRUFBMENrRCxHQUExQyxDQUE4QzJDLEdBQUdxQyxNQUFILENBQVVDLEVBQXhELEVBQTREa0ksUUFBNUQsQ0FBcUUySSxLQUFyRTtBQUNBaFosTUFBRSwwQ0FBRixFQUE4Q2tELEdBQTlDLENBQWtEMkMsR0FBR3FDLE1BQUgsQ0FBVStRLFNBQTVELEVBQXVFNUksUUFBdkUsQ0FBZ0YySSxLQUFoRjs7QUFFQSxRQUFLblQsR0FBR2lOLFVBQVIsRUFBcUI7QUFDakI5UyxVQUFFLHFDQUFGLEVBQXlDa0QsR0FBekMsQ0FBNkMyQyxHQUFHaU4sVUFBaEQsRUFBNER6QyxRQUE1RCxDQUFxRTJJLEtBQXJFO0FBQ0EsWUFBSUUsU0FBU0YsTUFBTWhSLElBQU4sQ0FBVyxRQUFYLENBQWI7QUFDQWtSLGVBQU9oVyxHQUFQLENBQVcyQyxHQUFHaU4sVUFBZDtBQUNBb0csZUFBTy9KLElBQVA7QUFDQW5QLFVBQUUsV0FBVzZGLEdBQUdpTixVQUFkLEdBQTJCLGVBQTdCLEVBQThDaEUsV0FBOUMsQ0FBMERvSyxNQUExRDtBQUNBRixjQUFNaFIsSUFBTixDQUFXLGFBQVgsRUFBMEJtSCxJQUExQjtBQUNIOztBQUVELFFBQUt0SixHQUFHMFEsTUFBUixFQUFpQjtBQUNidlcsVUFBRSxzQ0FBRixFQUEwQ2tELEdBQTFDLENBQThDMkMsR0FBR3FDLE1BQUgsQ0FBVThQLEdBQXhELEVBQTZEM0gsUUFBN0QsQ0FBc0UySSxLQUF0RTtBQUNILEtBRkQsTUFFTyxJQUFLblQsR0FBR3FDLE1BQUgsQ0FBVThQLEdBQWYsRUFBcUI7QUFDeEJoWSxVQUFFLHNDQUFGLEVBQTBDa0QsR0FBMUMsQ0FBOEMyQyxHQUFHcUMsTUFBSCxDQUFVOFAsR0FBeEQsRUFBNkQzSCxRQUE3RCxDQUFzRTJJLEtBQXRFO0FBQ0g7QUFDRGhaLE1BQUUscUNBQUYsRUFBeUNrRCxHQUF6QyxDQUE2QzJDLEdBQUdxQyxNQUFILENBQVU0QyxJQUF2RCxFQUE2RHVGLFFBQTdELENBQXNFMkksS0FBdEU7O0FBRUE7QUFDQTtBQUNBOzs7QUFHQSxXQUFPQSxLQUFQO0FBQ0gsQ0E1SEQ7OztBQ0hBbFQsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCOztBQUVBLFFBQUlvVCxTQUFTLEtBQWI7O0FBRUEsUUFBSUgsUUFBUWhaLEVBQUUsb0JBQUYsQ0FBWjs7QUFFQSxRQUFJb1osU0FBU0osTUFBTWhSLElBQU4sQ0FBVyx5QkFBWCxDQUFiO0FBQ0EsUUFBSXFSLGVBQWVMLE1BQU1oUixJQUFOLENBQVcsdUJBQVgsQ0FBbkI7QUFDQSxRQUFJc1IsVUFBVU4sTUFBTWhSLElBQU4sQ0FBVyxxQkFBWCxDQUFkO0FBQ0EsUUFBSXVSLGlCQUFpQlAsTUFBTWhSLElBQU4sQ0FBVyxnQkFBWCxDQUFyQjtBQUNBLFFBQUl3UixNQUFNUixNQUFNaFIsSUFBTixDQUFXLHNCQUFYLENBQVY7O0FBRUEsUUFBSXlSLFlBQVksSUFBaEI7O0FBRUEsUUFBSS9RLFVBQVUxSSxFQUFFLDJCQUFGLENBQWQ7QUFDQTBJLFlBQVF0QixFQUFSLENBQVcsT0FBWCxFQUFvQixZQUFXO0FBQzNCZ0QsZ0JBQVEyRSxJQUFSLENBQWEsY0FBYixFQUE2QjtBQUN6QjJLLG9CQUFRLGdCQUFTQyxLQUFULEVBQWdCO0FBQ3BCUCx1QkFBT3hDLEtBQVA7QUFDSDtBQUh3QixTQUE3QjtBQUtILEtBTkQ7O0FBUUEsUUFBSWdELFNBQVMsRUFBYjtBQUNBQSxXQUFPQyxFQUFQLEdBQVksWUFBVztBQUNuQlAsZ0JBQVFuSyxJQUFSO0FBQ0FpSyxlQUFPelgsSUFBUCxDQUFZLGFBQVosRUFBMkIsd0NBQTNCO0FBQ0EwWCxxQkFBYTdRLElBQWIsQ0FBa0Isd0JBQWxCO0FBQ0EsWUFBSzJRLE1BQUwsRUFBYztBQUNWdFQsZUFBR21KLGFBQUgsQ0FBaUIsc0NBQWpCO0FBQ0g7QUFDSixLQVBEOztBQVNBNEssV0FBT0UsT0FBUCxHQUFpQixZQUFXO0FBQ3hCUixnQkFBUXZLLElBQVI7QUFDQXFLLGVBQU96WCxJQUFQLENBQVksYUFBWixFQUEyQiw4QkFBM0I7QUFDQTBYLHFCQUFhN1EsSUFBYixDQUFrQixzQkFBbEI7QUFDQSxZQUFLMlEsTUFBTCxFQUFjO0FBQ1Z0VCxlQUFHbUosYUFBSCxDQUFpQix3RkFBakI7QUFDSDtBQUNKLEtBUEQ7O0FBU0EsUUFBSStLLFNBQVNSLGVBQWV2UixJQUFmLENBQW9CLGVBQXBCLEVBQXFDOUUsR0FBckMsRUFBYjtBQUNBMFcsV0FBT0csTUFBUDtBQUNBWixhQUFTLElBQVQ7O0FBRUEsUUFBSWEsUUFBUW5VLEdBQUdtVSxLQUFILENBQVN6USxHQUFULEVBQVo7QUFDQSxRQUFLeVEsTUFBTUMsTUFBTixJQUFnQkQsTUFBTUMsTUFBTixDQUFhQyxFQUFsQyxFQUF1QztBQUNuQ2xhLFVBQUUsZ0JBQUYsRUFBb0IyQixJQUFwQixDQUF5QixTQUF6QixFQUFvQyxTQUFwQztBQUNIOztBQUVENFgsbUJBQWVuUyxFQUFmLENBQWtCLFFBQWxCLEVBQTRCLHFCQUE1QixFQUFtRCxVQUFTOUMsQ0FBVCxFQUFZO0FBQzNELFlBQUl5VixTQUFTLEtBQUtJLEtBQWxCO0FBQ0FQLGVBQU9HLE1BQVA7QUFDQWxVLFdBQUdjLFNBQUgsQ0FBYXlULFVBQWIsQ0FBd0IsRUFBRTlQLE9BQVEsR0FBVixFQUFlK1AsVUFBVyxXQUExQixFQUF1QzVILFFBQVNzSCxNQUFoRCxFQUF4QjtBQUNILEtBSkQ7O0FBTUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQWYsVUFBTXNCLE1BQU4sQ0FBYSxVQUFTalQsS0FBVCxFQUNSOztBQUVHLFlBQUssQ0FBRSxLQUFLcUosYUFBTCxFQUFQLEVBQThCO0FBQzFCLGlCQUFLQyxjQUFMO0FBQ0EsbUJBQU8sS0FBUDtBQUNIOztBQUVGO0FBQ0EsWUFBSXlJLFNBQVNwWixFQUFFLElBQUYsRUFBUWdJLElBQVIsQ0FBYSxnQkFBYixDQUFiO0FBQ0EsWUFBSXhDLFFBQVE0VCxPQUFPbFcsR0FBUCxFQUFaO0FBQ0FzQyxnQkFBUXhGLEVBQUVxTCxJQUFGLENBQU83RixLQUFQLENBQVI7QUFDQSxZQUFJQSxVQUFVLEVBQWQsRUFDQTtBQUNFc08sa0JBQU0sNkJBQU47QUFDQXNGLG1CQUFPdlMsT0FBUCxDQUFlLE1BQWY7QUFDQSxtQkFBTyxLQUFQO0FBQ0Q7QUFDRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBYkEsYUFlQTs7QUFFQztBQUNBLG9CQUFJMFQsYUFBZVIsVUFBVSxJQUFaLEdBQXFCLEtBQXJCLEdBQTZCVCxRQUFRdFIsSUFBUixDQUFhLFFBQWIsRUFBdUI5RSxHQUF2QixFQUE5QztBQUNBMkMsbUJBQUdtVSxLQUFILENBQVNoVyxHQUFULENBQWEsRUFBRWlXLFFBQVMsRUFBRUMsSUFBS2xhLEVBQUUsd0JBQUYsRUFBNEI4QyxNQUE1QixHQUFxQyxDQUE1QyxFQUErQ2lYLFFBQVNBLE1BQXhELEVBQWdFUSxZQUFZQSxVQUE1RSxFQUFYLEVBQWI7O0FBRUEsdUJBQU8sSUFBUDtBQUNBO0FBRU4sS0FwQ0Y7QUFzQ0gsQ0E3SEQ7OztBQ0FBLElBQUkxVSxLQUFLQSxNQUFNLEVBQWY7QUFDQUMsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRXBCRixLQUFHYyxTQUFILENBQWE2VCxtQkFBYixHQUFtQyxZQUFXO0FBQzVDO0FBQ0EsUUFBSXRHLFNBQVMsRUFBYjtBQUNBLFFBQUl1RyxnQkFBZ0IsQ0FBcEI7QUFDQSxRQUFLemEsRUFBRSxVQUFGLEVBQWN1RixJQUFkLENBQW1CLE1BQW5CLEtBQThCLFlBQW5DLEVBQWtEO0FBQ2hEa1Ysc0JBQWdCLENBQWhCO0FBQ0F2RyxlQUFTLGFBQVQ7QUFDRCxLQUhELE1BR08sSUFBSzdPLE9BQU9DLFFBQVAsQ0FBZ0JrQixJQUFoQixDQUFxQi9DLE9BQXJCLENBQTZCLGFBQTdCLElBQThDLENBQUMsQ0FBcEQsRUFBd0Q7QUFDN0RnWCxzQkFBZ0IsQ0FBaEI7QUFDQXZHLGVBQVMsUUFBVDtBQUNEO0FBQ0QsV0FBTyxFQUFFbEgsT0FBUXlOLGFBQVYsRUFBeUJOLE9BQVF0VSxHQUFHcUMsTUFBSCxDQUFVQyxFQUFWLEdBQWUrTCxNQUFoRCxFQUFQO0FBRUQsR0FiRDs7QUFlQXJPLEtBQUdjLFNBQUgsQ0FBYStULGlCQUFiLEdBQWlDLFVBQVNsVSxJQUFULEVBQWU7QUFDOUMsUUFBSXBGLE1BQU1wQixFQUFFb0IsR0FBRixDQUFNb0YsSUFBTixDQUFWO0FBQ0EsUUFBSW1VLFdBQVd2WixJQUFJc0UsT0FBSixFQUFmO0FBQ0FpVixhQUFTclgsSUFBVCxDQUFjdEQsRUFBRSxNQUFGLEVBQVV1RixJQUFWLENBQWUsa0JBQWYsQ0FBZDtBQUNBb1YsYUFBU3JYLElBQVQsQ0FBY2xDLElBQUlRLEtBQUosQ0FBVSxJQUFWLENBQWQ7QUFDQSxRQUFJZ1osS0FBSyxFQUFUO0FBQ0EsUUFBS0QsU0FBU2xYLE9BQVQsQ0FBaUIsUUFBakIsSUFBNkIsQ0FBQyxDQUE5QixJQUFtQ3JDLElBQUlRLEtBQUosQ0FBVSxJQUFWLENBQXhDLEVBQTJEO0FBQ3pEZ1osV0FBSyxTQUFTeFosSUFBSVEsS0FBSixDQUFVLElBQVYsQ0FBZDtBQUNEO0FBQ0QrWSxlQUFXLE1BQU1BLFNBQVNwTixJQUFULENBQWMsR0FBZCxDQUFOLEdBQTJCcU4sRUFBdEM7QUFDQSxXQUFPRCxRQUFQO0FBQ0QsR0FYRDs7QUFhQTlVLEtBQUdjLFNBQUgsQ0FBYWtVLFdBQWIsR0FBMkIsWUFBVztBQUNwQyxXQUFPaFYsR0FBR2MsU0FBSCxDQUFhK1QsaUJBQWIsRUFBUDtBQUNELEdBRkQ7QUFJRCxDQWxDRDs7O0FDREE1VSxLQUFLQyxLQUFMLENBQVcsWUFBVztBQUNwQixNQUFJK1UsS0FBSixDQUFXLElBQUlDLFFBQUosQ0FBYyxJQUFJQyxPQUFKLENBQWEsSUFBSUMsVUFBSjtBQUN0Q3BWLE9BQUtBLE1BQU0sRUFBWDs7QUFFQUEsS0FBR3FWLE1BQUgsR0FBWSxZQUFXOztBQUVyQjtBQUNBO0FBQ0E7O0FBRUFGLGNBQVVoYixFQUFFLFFBQUYsQ0FBVjtBQUNBaWIsaUJBQWFqYixFQUFFLFlBQUYsQ0FBYjtBQUNBLFFBQUtpYixXQUFXblksTUFBaEIsRUFBeUI7QUFDdkI2SCxlQUFTd1EsZUFBVCxDQUF5QjNSLE9BQXpCLENBQWlDNFIsUUFBakMsR0FBNEMsSUFBNUM7QUFDQUgsaUJBQVcxUixHQUFYLENBQWUsQ0FBZixFQUFrQjhSLEtBQWxCLENBQXdCQyxXQUF4QixDQUFvQyxVQUFwQyxRQUFvREwsV0FBV00sV0FBWCxLQUEyQixJQUEvRTtBQUNBTixpQkFBVzFSLEdBQVgsQ0FBZSxDQUFmLEVBQWtCQyxPQUFsQixDQUEwQmdTLGNBQTFCO0FBQ0E3USxlQUFTd1EsZUFBVCxDQUF5QkUsS0FBekIsQ0FBK0JDLFdBQS9CLENBQTJDLG9CQUEzQyxFQUFvRUwsV0FBV00sV0FBWCxFQUFwRTtBQUNBLFVBQUlFLFdBQVdSLFdBQVdqVCxJQUFYLENBQWdCLGlCQUFoQixDQUFmO0FBQ0F5VCxlQUFTclUsRUFBVCxDQUFZLE9BQVosRUFBcUIsWUFBVztBQUM5QnVELGlCQUFTd1EsZUFBVCxDQUF5QjNSLE9BQXpCLENBQWlDNFIsUUFBakMsR0FBNEMsRUFBSXpRLFNBQVN3USxlQUFULENBQXlCM1IsT0FBekIsQ0FBaUM0UixRQUFqQyxJQUE2QyxNQUFqRCxDQUE1QztBQUNBLFlBQUlNLGtCQUFrQixDQUF0QjtBQUNBLFlBQUsvUSxTQUFTd1EsZUFBVCxDQUF5QjNSLE9BQXpCLENBQWlDNFIsUUFBakMsSUFBNkMsTUFBbEQsRUFBMkQ7QUFDekRNLDRCQUFrQlQsV0FBVzFSLEdBQVgsQ0FBZSxDQUFmLEVBQWtCQyxPQUFsQixDQUEwQmdTLGNBQTVDO0FBQ0Q7QUFDRDdRLGlCQUFTd1EsZUFBVCxDQUF5QkUsS0FBekIsQ0FBK0JDLFdBQS9CLENBQTJDLG9CQUEzQyxFQUFpRUksZUFBakU7QUFDRCxPQVBEOztBQVNBLFVBQUs3VixHQUFHcUMsTUFBSCxDQUFVeVQsRUFBVixJQUFnQixPQUFyQixFQUErQjtBQUM3QnZWLG1CQUFXLFlBQU07QUFDZnFWLG1CQUFTNVUsT0FBVCxDQUFpQixPQUFqQjtBQUNELFNBRkQsRUFFRyxJQUZIO0FBR0Q7QUFDRjs7QUFFRGhCLE9BQUdpVixLQUFILEdBQVdBLEtBQVg7O0FBRUEsUUFBSWMsV0FBVzViLEVBQUUsVUFBRixDQUFmOztBQUVBK2EsZUFBV2EsU0FBUzVULElBQVQsQ0FBYyx1QkFBZCxDQUFYOztBQUVBaEksTUFBRSxrQ0FBRixFQUFzQ29ILEVBQXRDLENBQXlDLE9BQXpDLEVBQWtELFlBQVc7QUFDM0R1RCxlQUFTd1EsZUFBVCxDQUF5QlUsaUJBQXpCO0FBQ0QsS0FGRDs7QUFJQWhXLE9BQUdpVyxLQUFILEdBQVdqVyxHQUFHaVcsS0FBSCxJQUFZLEVBQXZCOztBQUVBO0FBQ0E5YixNQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLG9CQUF0QixFQUE0QyxVQUFTQyxLQUFULEVBQWdCO0FBQzFEO0FBQ0EsVUFBSXlKLFFBQVE5USxFQUFFcUgsTUFBTTBTLE1BQVIsQ0FBWjtBQUNBLFVBQUtqSixNQUFNK0IsRUFBTixDQUFTLDJCQUFULENBQUwsRUFBNkM7QUFDM0M7QUFDRDtBQUNELFVBQUsvQixNQUFNa0IsT0FBTixDQUFjLHFCQUFkLEVBQXFDbFAsTUFBMUMsRUFBbUQ7QUFDakQ7QUFDRDtBQUNELFVBQUtnTyxNQUFNK0IsRUFBTixDQUFTLFVBQVQsQ0FBTCxFQUE0QjtBQUMxQmhOLFdBQUdxSCxNQUFILENBQVUsS0FBVjtBQUNEO0FBQ0YsS0FaRDs7QUFjQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBLFFBQUtySCxNQUFNQSxHQUFHaVcsS0FBVCxJQUFrQmpXLEdBQUdpVyxLQUFILENBQVNDLHVCQUFoQyxFQUEwRDtBQUN4RGxXLFNBQUdpVyxLQUFILENBQVNDLHVCQUFUO0FBQ0Q7QUFDRHBSLGFBQVN3USxlQUFULENBQXlCM1IsT0FBekIsQ0FBaUM0UixRQUFqQyxHQUE0QyxNQUE1QztBQUNELEdBN0VEOztBQStFQXZWLEtBQUdxSCxNQUFILEdBQVksVUFBUzhPLEtBQVQsRUFBZ0I7O0FBRTFCO0FBQ0FoYyxNQUFFLG9CQUFGLEVBQXdCZ0ksSUFBeEIsQ0FBNkIsdUJBQTdCLEVBQXNEckcsSUFBdEQsQ0FBMkQsZUFBM0QsRUFBNEVxYSxLQUE1RTtBQUNBaGMsTUFBRSxNQUFGLEVBQVV1SixHQUFWLENBQWMsQ0FBZCxFQUFpQkMsT0FBakIsQ0FBeUJ5UyxlQUF6QixHQUEyQ0QsS0FBM0M7QUFDQWhjLE1BQUUsTUFBRixFQUFVdUosR0FBVixDQUFjLENBQWQsRUFBaUJDLE9BQWpCLENBQXlCc0IsSUFBekIsR0FBZ0NrUixRQUFRLFNBQVIsR0FBb0IsUUFBcEQ7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDRCxHQWREOztBQWdCQTVWLGFBQVdQLEdBQUdxVixNQUFkLEVBQXNCLElBQXRCOztBQUVBLE1BQUlnQiwyQkFBMkIsU0FBM0JBLHdCQUEyQixHQUFXO0FBQ3hDLFFBQUl6RCxJQUFJelksRUFBRSxpQ0FBRixFQUFxQ3ViLFdBQXJDLE1BQXNELEVBQTlEO0FBQ0EsUUFBSVksTUFBTSxDQUFFbmMsRUFBRSxRQUFGLEVBQVlvYyxNQUFaLEtBQXVCM0QsQ0FBekIsSUFBK0IsSUFBekM7QUFDQTlOLGFBQVN3USxlQUFULENBQXlCRSxLQUF6QixDQUErQkMsV0FBL0IsQ0FBMkMsMEJBQTNDLEVBQXVFYSxNQUFNLElBQTdFO0FBQ0QsR0FKRDtBQUtBbmMsSUFBRXFGLE1BQUYsRUFBVStCLEVBQVYsQ0FBYSxRQUFiLEVBQXVCOFUsd0JBQXZCO0FBQ0FBOztBQUVBbGMsSUFBRSxNQUFGLEVBQVV1SixHQUFWLENBQWMsQ0FBZCxFQUFpQmdELFlBQWpCLENBQThCLHVCQUE5QixFQUF1RCxLQUF2RDtBQUVELENBL0dEOzs7OztBQ0FBLElBQUksT0FBT3ZMLE9BQU9xYixNQUFkLElBQXdCLFVBQTVCLEVBQXdDO0FBQ3RDO0FBQ0FyYixTQUFPd00sY0FBUCxDQUFzQnhNLE1BQXRCLEVBQThCLFFBQTlCLEVBQXdDO0FBQ3RDbVosV0FBTyxTQUFTa0MsTUFBVCxDQUFnQnRDLE1BQWhCLEVBQXdCdUMsT0FBeEIsRUFBaUM7QUFBRTtBQUN4Qzs7QUFDQSxVQUFJdkMsVUFBVSxJQUFkLEVBQW9CO0FBQUU7QUFDcEIsY0FBTSxJQUFJd0MsU0FBSixDQUFjLDRDQUFkLENBQU47QUFDRDs7QUFFRCxVQUFJQyxLQUFLeGIsT0FBTytZLE1BQVAsQ0FBVDs7QUFFQSxXQUFLLElBQUkvTSxRQUFRLENBQWpCLEVBQW9CQSxRQUFRakksVUFBVWpDLE1BQXRDLEVBQThDa0ssT0FBOUMsRUFBdUQ7QUFDckQsWUFBSXlQLGFBQWExWCxVQUFVaUksS0FBVixDQUFqQjs7QUFFQSxZQUFJeVAsY0FBYyxJQUFsQixFQUF3QjtBQUFFO0FBQ3hCLGVBQUssSUFBSUMsT0FBVCxJQUFvQkQsVUFBcEIsRUFBZ0M7QUFDOUI7QUFDQSxnQkFBSXpiLE9BQU9DLFNBQVAsQ0FBaUJrRSxjQUFqQixDQUFnQ0gsSUFBaEMsQ0FBcUN5WCxVQUFyQyxFQUFpREMsT0FBakQsQ0FBSixFQUErRDtBQUM3REYsaUJBQUdFLE9BQUgsSUFBY0QsV0FBV0MsT0FBWCxDQUFkO0FBQ0Q7QUFDRjtBQUNGO0FBQ0Y7QUFDRCxhQUFPRixFQUFQO0FBQ0QsS0F0QnFDO0FBdUJ0Q0csY0FBVSxJQXZCNEI7QUF3QnRDaFAsa0JBQWM7QUF4QndCLEdBQXhDO0FBMEJEOztBQUVEO0FBQ0EsQ0FBQyxVQUFVaVAsR0FBVixFQUFlO0FBQ2RBLE1BQUlDLE9BQUosQ0FBWSxVQUFVclIsSUFBVixFQUFnQjtBQUMxQixRQUFJQSxLQUFLckcsY0FBTCxDQUFvQixPQUFwQixDQUFKLEVBQWtDO0FBQ2hDO0FBQ0Q7QUFDRG5FLFdBQU93TSxjQUFQLENBQXNCaEMsSUFBdEIsRUFBNEIsT0FBNUIsRUFBcUM7QUFDbkNtQyxvQkFBYyxJQURxQjtBQUVuQ0Qsa0JBQVksSUFGdUI7QUFHbkNpUCxnQkFBVSxJQUh5QjtBQUluQ3hDLGFBQU8sU0FBUzJDLEtBQVQsR0FBaUI7QUFDdEIsWUFBSUMsU0FBU3hSLE1BQU10SyxTQUFOLENBQWdCbU4sS0FBaEIsQ0FBc0JwSixJQUF0QixDQUEyQkQsU0FBM0IsQ0FBYjtBQUFBLFlBQ0VpWSxVQUFVclMsU0FBU3NTLHNCQUFULEVBRFo7O0FBR0FGLGVBQU9GLE9BQVAsQ0FBZSxVQUFVSyxPQUFWLEVBQW1CO0FBQ2hDLGNBQUlDLFNBQVNELG1CQUFtQkUsSUFBaEM7QUFDQUosa0JBQVFLLFdBQVIsQ0FBb0JGLFNBQVNELE9BQVQsR0FBbUJ2UyxTQUFTMlMsY0FBVCxDQUF3QnBaLE9BQU9nWixPQUFQLENBQXhCLENBQXZDO0FBQ0QsU0FIRDs7QUFLQSxhQUFLSyxVQUFMLENBQWdCQyxZQUFoQixDQUE2QlIsT0FBN0IsRUFBc0MsS0FBS1MsV0FBM0M7QUFDRDtBQWRrQyxLQUFyQztBQWdCRCxHQXBCRDtBQXFCRCxDQXRCRCxFQXNCRyxDQUFDdlMsUUFBUWpLLFNBQVQsRUFBb0J5YyxjQUFjemMsU0FBbEMsRUFBNkMwYyxhQUFhMWMsU0FBMUQsQ0F0Qkg7O0FBd0JBLFNBQVMyYyxtQkFBVCxHQUErQjtBQUM3QixlQUQ2QixDQUNmOztBQUNkLE1BQUkvYSxTQUFTLEtBQUswYSxVQUFsQjtBQUFBLE1BQThCemIsSUFBSWlELFVBQVVqQyxNQUE1QztBQUFBLE1BQW9EK2EsV0FBcEQ7QUFDQSxNQUFJLENBQUNoYixNQUFMLEVBQWE7QUFDYixNQUFJLENBQUNmLENBQUwsRUFBUTtBQUNOZSxXQUFPaWIsV0FBUCxDQUFtQixJQUFuQjtBQUNGLFNBQU9oYyxHQUFQLEVBQVk7QUFBRTtBQUNaK2Isa0JBQWM5WSxVQUFVakQsQ0FBVixDQUFkO0FBQ0EsUUFBSSxRQUFPK2IsV0FBUCx5Q0FBT0EsV0FBUCxPQUF1QixRQUEzQixFQUFvQztBQUNsQ0Esb0JBQWMsS0FBS0UsYUFBTCxDQUFtQlQsY0FBbkIsQ0FBa0NPLFdBQWxDLENBQWQ7QUFDRCxLQUZELE1BRU8sSUFBSUEsWUFBWU4sVUFBaEIsRUFBMkI7QUFDaENNLGtCQUFZTixVQUFaLENBQXVCTyxXQUF2QixDQUFtQ0QsV0FBbkM7QUFDRDtBQUNEO0FBQ0EsUUFBSSxDQUFDL2IsQ0FBTCxFQUFRO0FBQ05lLGFBQU9tYixZQUFQLENBQW9CSCxXQUFwQixFQUFpQyxJQUFqQyxFQURGLEtBRUs7QUFDSGhiLGFBQU8yYSxZQUFQLENBQW9CSyxXQUFwQixFQUFpQyxLQUFLSSxlQUF0QztBQUNIO0FBQ0Y7QUFDRCxJQUFJLENBQUMvUyxRQUFRakssU0FBUixDQUFrQmlkLFdBQXZCLEVBQ0loVCxRQUFRakssU0FBUixDQUFrQmlkLFdBQWxCLEdBQWdDTixtQkFBaEM7QUFDSixJQUFJLENBQUNGLGNBQWN6YyxTQUFkLENBQXdCaWQsV0FBN0IsRUFDSVIsY0FBY3pjLFNBQWQsQ0FBd0JpZCxXQUF4QixHQUFzQ04sbUJBQXRDO0FBQ0osSUFBSSxDQUFDRCxhQUFhMWMsU0FBYixDQUF1QmlkLFdBQTVCLEVBQ0lQLGFBQWExYyxTQUFiLENBQXVCaWQsV0FBdkIsR0FBcUNOLG1CQUFyQzs7O0FDaEZKOVgsS0FBS0MsS0FBTCxDQUFXLFlBQVc7QUFDcEIsTUFBSWlULFFBQVFoWixFQUFFLHFCQUFGLENBQVo7O0FBRUEsTUFBSW1lLFFBQVFuZSxFQUFFLE1BQUYsQ0FBWjs7QUFFQUEsSUFBRXFGLE1BQUYsRUFBVStCLEVBQVYsQ0FBYSxjQUFiLEVBQTZCLFlBQVc7QUFDdENwSCxNQUFFLG9CQUFGLEVBQXdCb2UsVUFBeEIsQ0FBbUMsVUFBbkMsRUFBK0NuTSxXQUEvQyxDQUEyRCxhQUEzRDtBQUNELEdBRkQ7O0FBSUFqUyxJQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxRQUFiLEVBQXVCLHlCQUF2QixFQUFrRCxVQUFTQyxLQUFULEVBQWdCO0FBQ2hFeEIsT0FBR3dZLG1CQUFILEdBQXlCLEtBQXpCO0FBQ0EsUUFBSUMsU0FBU3RlLEVBQUUsSUFBRixDQUFiOztBQUVBLFFBQUl1ZSxVQUFVRCxPQUFPdFcsSUFBUCxDQUFZLHFCQUFaLENBQWQ7QUFDQSxRQUFLdVcsUUFBUTNVLFFBQVIsQ0FBaUIsYUFBakIsQ0FBTCxFQUF1QztBQUNyQ2tLLFlBQU0sd0VBQU47QUFDQSxhQUFPLEtBQVA7QUFDRDtBQUNELFFBQUlzRixTQUFTa0YsT0FBT3RXLElBQVAsQ0FBWSxrQkFBWixDQUFiO0FBQ0EsUUFBSyxDQUFFaEksRUFBRXFMLElBQUYsQ0FBTytOLE9BQU9sVyxHQUFQLEVBQVAsQ0FBUCxFQUE4QjtBQUM1QmtILGNBQVEwSixLQUFSLENBQWMsd0NBQWQ7QUFDQSxhQUFPLEtBQVA7QUFDRDtBQUNEeUssWUFBUTlLLFFBQVIsQ0FBaUIsYUFBakIsRUFBZ0M5UixJQUFoQyxDQUFxQyxVQUFyQyxFQUFpRCxVQUFqRDs7QUFFQTNCLE1BQUVxRixNQUFGLEVBQVUrQixFQUFWLENBQWEsUUFBYixFQUF1QixZQUFXO0FBQ2hDcEgsUUFBRXFGLE1BQUYsRUFBVXdCLE9BQVYsQ0FBa0IsY0FBbEI7QUFDRCxLQUZEOztBQUlBLFFBQUtoQixHQUFHMFEsTUFBSCxJQUFhMVEsR0FBRzBRLE1BQUgsQ0FBVUMsUUFBVixDQUFtQmdJLFlBQXJDLEVBQW9EO0FBQ2xEblgsWUFBTW1MLGNBQU47QUFDQSxhQUFPM00sR0FBRzBRLE1BQUgsQ0FBVUMsUUFBVixDQUFtQmdJLFlBQW5CLENBQWdDbEUsTUFBaEMsQ0FBdUNnRSxPQUFPL1UsR0FBUCxDQUFXLENBQVgsQ0FBdkMsQ0FBUDtBQUNEOztBQUVEO0FBQ0QsR0ExQkQ7O0FBNEJBdkosSUFBRSxvQkFBRixFQUF3Qm9ILEVBQXhCLENBQTJCLFFBQTNCLEVBQXFDLFlBQVc7QUFDOUMsUUFBSXFYLEtBQUtwVixTQUFTckosRUFBRSxJQUFGLEVBQVF1RixJQUFSLENBQWEsSUFBYixDQUFULEVBQTZCLEVBQTdCLENBQVQ7QUFDQSxRQUFJNFUsUUFBUTlRLFNBQVNySixFQUFFLElBQUYsRUFBUWtELEdBQVIsRUFBVCxFQUF3QixFQUF4QixDQUFaO0FBQ0EsUUFBSXFRLFFBQVEsQ0FBRTRHLFFBQVEsQ0FBVixJQUFnQnNFLEVBQWhCLEdBQXFCLENBQWpDO0FBQ0EsUUFBSUgsU0FBU3RlLEVBQUUscUJBQUYsQ0FBYjtBQUNBc2UsV0FBTzdWLE1BQVAsa0RBQTBEOEssS0FBMUQ7QUFDQStLLFdBQU83VixNQUFQLCtDQUF1RGdXLEVBQXZEO0FBQ0FILFdBQU9oRSxNQUFQO0FBQ0QsR0FSRDtBQVVELENBL0NEOzs7QUNBQXhVLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQi9GLE1BQUUsTUFBRixFQUFVb0gsRUFBVixDQUFhLE9BQWIsRUFBc0IsY0FBdEIsRUFBc0MsVUFBUzlDLENBQVQsRUFBWTtBQUM5Q0EsVUFBRWtPLGNBQUY7QUFDQXBJLGdCQUFRMEosS0FBUixDQUFjLG9ZQUFkO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IFVSTCBQYXJzZXIgcGx1Z2luLCB2Mi4yLjFcbiAqIERldmVsb3BlZCBhbmQgbWFpbnRhbmluZWQgYnkgTWFyayBQZXJraW5zLCBtYXJrQGFsbG1hcmtlZHVwLmNvbVxuICogU291cmNlIHJlcG9zaXRvcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlclxuICogTGljZW5zZWQgdW5kZXIgYW4gTUlULXN0eWxlIGxpY2Vuc2UuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXIvYmxvYi9tYXN0ZXIvTElDRU5TRSBmb3IgZGV0YWlscy5cbiAqLyBcblxuOyhmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQgYXZhaWxhYmxlOyB1c2UgYW5vbnltb3VzIG1vZHVsZVxuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gTm8gQU1EIGF2YWlsYWJsZTsgbXV0YXRlIGdsb2JhbCB2YXJzXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGZhY3RvcnkoalF1ZXJ5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmFjdG9yeSgpO1xuXHRcdH1cblx0fVxufSkoZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cdFxuXHR2YXIgdGFnMmF0dHIgPSB7XG5cdFx0XHRhICAgICAgIDogJ2hyZWYnLFxuXHRcdFx0aW1nICAgICA6ICdzcmMnLFxuXHRcdFx0Zm9ybSAgICA6ICdhY3Rpb24nLFxuXHRcdFx0YmFzZSAgICA6ICdocmVmJyxcblx0XHRcdHNjcmlwdCAgOiAnc3JjJyxcblx0XHRcdGlmcmFtZSAgOiAnc3JjJyxcblx0XHRcdGxpbmsgICAgOiAnaHJlZidcblx0XHR9LFxuXHRcdFxuXHRcdGtleSA9IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2ZyYWdtZW50J10sIC8vIGtleXMgYXZhaWxhYmxlIHRvIHF1ZXJ5XG5cdFx0XG5cdFx0YWxpYXNlcyA9IHsgJ2FuY2hvcicgOiAnZnJhZ21lbnQnIH0sIC8vIGFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG5cdFx0XG5cdFx0cGFyc2VyID0ge1xuXHRcdFx0c3RyaWN0IDogL14oPzooW146XFwvPyNdKyk6KT8oPzpcXC9cXC8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLCAgLy9sZXNzIGludHVpdGl2ZSwgbW9yZSBhY2N1cmF0ZSB0byB0aGUgc3BlY3Ncblx0XHRcdGxvb3NlIDogIC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvIC8vIG1vcmUgaW50dWl0aXZlLCBmYWlscyBvbiByZWxhdGl2ZSBwYXRocyBhbmQgZGV2aWF0ZXMgZnJvbSBzcGVjc1xuXHRcdH0sXG5cdFx0XG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdFxuXHRcdGlzaW50ID0gL15bMC05XSskLztcblx0XG5cdGZ1bmN0aW9uIHBhcnNlVXJpKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0dmFyIHN0ciA9IGRlY29kZVVSSSggdXJsICksXG5cdFx0cmVzICAgPSBwYXJzZXJbIHN0cmljdE1vZGUgfHwgZmFsc2UgPyAnc3RyaWN0JyA6ICdsb29zZScgXS5leGVjKCBzdHIgKSxcblx0XHR1cmkgPSB7IGF0dHIgOiB7fSwgcGFyYW0gOiB7fSwgc2VnIDoge30gfSxcblx0XHRpICAgPSAxNDtcblx0XHRcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHVyaS5hdHRyWyBrZXlbaV0gXSA9IHJlc1tpXSB8fCAnJztcblx0XHR9XG5cdFx0XG5cdFx0Ly8gYnVpbGQgcXVlcnkgYW5kIGZyYWdtZW50IHBhcmFtZXRlcnNcdFx0XG5cdFx0dXJpLnBhcmFtWydxdWVyeSddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ3F1ZXJ5J10pO1xuXHRcdHVyaS5wYXJhbVsnZnJhZ21lbnQnXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydmcmFnbWVudCddKTtcblx0XHRcblx0XHQvLyBzcGxpdCBwYXRoIGFuZCBmcmFnZW1lbnQgaW50byBzZWdtZW50c1x0XHRcblx0XHR1cmkuc2VnWydwYXRoJ10gPSB1cmkuYXR0ci5wYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7ICAgICBcblx0XHR1cmkuc2VnWydmcmFnbWVudCddID0gdXJpLmF0dHIuZnJhZ21lbnQucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTtcblx0XHRcblx0XHQvLyBjb21waWxlIGEgJ2Jhc2UnIGRvbWFpbiBhdHRyaWJ1dGUgICAgICAgIFxuXHRcdHVyaS5hdHRyWydiYXNlJ10gPSB1cmkuYXR0ci5ob3N0ID8gKHVyaS5hdHRyLnByb3RvY29sID8gIHVyaS5hdHRyLnByb3RvY29sKyc6Ly8nK3VyaS5hdHRyLmhvc3QgOiB1cmkuYXR0ci5ob3N0KSArICh1cmkuYXR0ci5wb3J0ID8gJzonK3VyaS5hdHRyLnBvcnQgOiAnJykgOiAnJzsgICAgICBcblx0XHQgIFxuXHRcdHJldHVybiB1cmk7XG5cdH07XG5cdFxuXHRmdW5jdGlvbiBnZXRBdHRyTmFtZSggZWxtICkge1xuXHRcdHZhciB0biA9IGVsbS50YWdOYW1lO1xuXHRcdGlmICggdHlwZW9mIHRuICE9PSAndW5kZWZpbmVkJyApIHJldHVybiB0YWcyYXR0clt0bi50b0xvd2VyQ2FzZSgpXTtcblx0XHRyZXR1cm4gdG47XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHByb21vdGUocGFyZW50LCBrZXkpIHtcblx0XHRpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuXHRcdHZhciB0ID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBwYXJlbnRba2V5XSkgdFtpXSA9IHBhcmVudFtrZXldW2ldO1xuXHRcdHBhcmVudFtrZXldID0gdDtcblx0XHRyZXR1cm4gdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdGlmICghcGFydCkge1xuXHRcdFx0aWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldLnB1c2godmFsKTtcblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG5cdFx0XHRpZiAoJ10nID09IHBhcnQpIHtcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRcdGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuXHRcdFx0XHRcdG9ialtrZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh+cGFydC5pbmRleE9mKCddJykpIHtcblx0XHRcdFx0cGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0XHQvLyBrZXlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHRpZiAofmtleS5pbmRleE9mKCddJykpIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0bGFzdCA9IGxlbiAtIDE7XG5cdFx0XHRwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG5cdFx0XHRcdHZhciB0ID0ge307XG5cdFx0XHRcdGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcblx0XHRcdFx0cGFyZW50LmJhc2UgPSB0O1xuXHRcdFx0fVxuXHRcdFx0c2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcblx0XHRyZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KC8mfDsvKSwgZnVuY3Rpb24ocmV0LCBwYWlyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYWlyID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdC8vIGlnbm9yZVxuXHRcdFx0fVxuXHRcdFx0dmFyIGVxbCA9IHBhaXIuaW5kZXhPZignPScpLFxuXHRcdFx0XHRicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpLFxuXHRcdFx0XHRrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpLFxuXHRcdFx0XHR2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKSxcblx0XHRcdFx0dmFsID0gdmFsLnN1YnN0cih2YWwuaW5kZXhPZignPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cblx0XHRcdGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuXG5cdFx0XHRyZXR1cm4gbWVyZ2UocmV0LCBrZXksIHZhbCk7XG5cdFx0fSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuXHRcdHZhciB2ID0gb2JqW2tleV07XG5cdFx0aWYgKHVuZGVmaW5lZCA9PT0gdikge1xuXHRcdFx0b2JqW2tleV0gPSB2YWw7XG5cdFx0fSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG5cdFx0XHR2LnB1c2godmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2JqW2tleV0gPSBbdiwgdmFsXTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuXHRcdHZhciBsZW4gPSBzdHIubGVuZ3RoLFxuXHRcdFx0IGJyYWNlLCBjO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0XHRcdGMgPSBzdHJbaV07XG5cdFx0XHRpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG5cdFx0XHRpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcblx0XHRcdGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gcmVkdWNlKG9iaiwgYWNjdW11bGF0b3Ipe1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGwgPSBvYmoubGVuZ3RoID4+IDAsXG5cdFx0XHRjdXJyID0gYXJndW1lbnRzWzJdO1xuXHRcdHdoaWxlIChpIDwgbCkge1xuXHRcdFx0aWYgKGkgaW4gb2JqKSBjdXJyID0gYWNjdW11bGF0b3IuY2FsbCh1bmRlZmluZWQsIGN1cnIsIG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdCsraTtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGlzQXJyYXkodkFyZykge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodkFyZykgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0fVxuXHRcblx0ZnVuY3Rpb24ga2V5cyhvYmopIHtcblx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdGZvciAoIHByb3AgaW4gb2JqICkge1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgKSBrZXlzLnB1c2gocHJvcCk7XG5cdFx0fVxuXHRcdHJldHVybiBrZXlzO1xuXHR9XG5cdFx0XG5cdGZ1bmN0aW9uIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdXJsID09PSB0cnVlICkge1xuXHRcdFx0c3RyaWN0TW9kZSA9IHRydWU7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHN0cmljdE1vZGUgPSBzdHJpY3RNb2RlIHx8IGZhbHNlO1xuXHRcdHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24udG9TdHJpbmcoKTtcblx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdFxuXHRcdFx0ZGF0YSA6IHBhcnNlVXJpKHVybCwgc3RyaWN0TW9kZSksXG5cdFx0XHRcblx0XHRcdC8vIGdldCB2YXJpb3VzIGF0dHJpYnV0ZXMgZnJvbSB0aGUgVVJJXG5cdFx0XHRhdHRyIDogZnVuY3Rpb24oIGF0dHIgKSB7XG5cdFx0XHRcdGF0dHIgPSBhbGlhc2VzW2F0dHJdIHx8IGF0dHI7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEuYXR0clthdHRyXSA6IHRoaXMuZGF0YS5hdHRyO1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG5cdFx0XHRwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0ucXVlcnlbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHBhcmFtZXRlcnNcblx0XHRcdGZwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnRbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHBhdGggc2VnbWVudHNcblx0XHRcdHNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcucGF0aC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoW3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHNlZ21lbnRzXG5cdFx0XHRmc2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQ7ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5mcmFnbWVudC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0ICAgIFx0XG5cdFx0fTtcblx0XG5cdH07XG5cdFxuXHRpZiAoIHR5cGVvZiAkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcblx0XHQkLmZuLnVybCA9IGZ1bmN0aW9uKCBzdHJpY3RNb2RlICkge1xuXHRcdFx0dmFyIHVybCA9ICcnO1xuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0dXJsID0gJCh0aGlzKS5hdHRyKCBnZXRBdHRyTmFtZSh0aGlzWzBdKSApIHx8ICcnO1xuXHRcdFx0fSAgICBcblx0XHRcdHJldHVybiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKTtcblx0XHR9O1xuXHRcdFxuXHRcdCQudXJsID0gcHVybDtcblx0XHRcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cucHVybCA9IHB1cmw7XG5cdH1cblxufSk7XG5cbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAvLyB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIC8vIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgLy8gSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgLy8gICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgLy8gICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgLy8gICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAvLyAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gIC8vICAgICAgIH0sIDUwKTtcbiAgLy8gICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gIC8vICAgICAgIH0sIDUwMCk7XG5cbiAgLy8gICAgIH1cbiAgLy8gfVxuXG4gIEhULnJlbmV3X2F1dGggPSBmdW5jdGlvbihlbnRpdHlJRCwgc291cmNlPSdpbWFnZScpIHtcbiAgICBpZiAoIEhULl9fcmVuZXdpbmcgKSB7IHJldHVybiA7IH1cbiAgICBIVC5fX3JlbmV3aW5nID0gdHJ1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHZhciByZWF1dGhfdXJsID0gYGh0dHBzOi8vJHtIVC5zZXJ2aWNlX2RvbWFpbn0vU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9JHtlbnRpdHlJRH0mdGFyZ2V0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKX1gO1xuICAgICAgdmFyIHJldHZhbCA9IHdpbmRvdy5jb25maXJtKGBXZSdyZSBoYXZpbmcgYSBwcm9ibGVtIHdpdGggeW91ciBzZXNzaW9uOyBzZWxlY3QgT0sgdG8gbG9nIGluIGFnYWluLmApO1xuICAgICAgaWYgKCByZXR2YWwgKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcmVhdXRoX3VybDtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzID0gSFQuYW5hbHl0aWNzIHx8IHt9O1xuICBIVC5hbmFseXRpY3MubG9nQWN0aW9uID0gZnVuY3Rpb24oaHJlZiwgdHJpZ2dlcikge1xuICAgIGlmICggaHJlZiA9PT0gdW5kZWZpbmVkICkgeyBocmVmID0gbG9jYXRpb24uaHJlZiA7IH1cbiAgICB2YXIgZGVsaW0gPSBocmVmLmluZGV4T2YoJzsnKSA+IC0xID8gJzsnIDogJyYnO1xuICAgIGlmICggdHJpZ2dlciA9PSBudWxsICkgeyB0cmlnZ2VyID0gJy0nOyB9XG4gICAgaHJlZiArPSBkZWxpbSArICdhPScgKyB0cmlnZ2VyO1xuICAgIC8vICQuZ2V0KGhyZWYpO1xuICAgICQuYWpheChocmVmLCBcbiAgICB7XG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24oeGhyLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIGVudGl0eUlEID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCd4LWhhdGhpdHJ1c3QtcmVuZXcnKTtcbiAgICAgICAgaWYgKCBlbnRpdHlJRCApIHtcbiAgICAgICAgICBIVC5yZW5ld19hdXRoKGVudGl0eUlELCAnbG9nQWN0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cblxuICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnYVtkYXRhLXRyYWNraW5nLWNhdGVnb3J5PVwib3V0TGlua3NcIl0nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIHZhciB0cmlnZ2VyID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1hY3Rpb24nKTtcbiAgICAvLyB2YXIgbGFiZWwgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWxhYmVsJyk7XG4gICAgLy8gaWYgKCBsYWJlbCApIHsgdHJpZ2dlciArPSAnOicgKyBsYWJlbDsgfVxuICAgIHZhciB0cmlnZ2VyID0gJ291dCcgKyAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICBIVC5hbmFseXRpY3MubG9nQWN0aW9uKHVuZGVmaW5lZCwgdHJpZ2dlcik7XG4gIH0pXG5cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIHZhciBNT05USFMgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsXG4gICAgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xuXG4gIHZhciAkZW1lcmdlbmN5X2FjY2VzcyA9ICQoXCIjYWNjZXNzLWVtZXJnZW5jeS1hY2Nlc3NcIik7XG5cbiAgdmFyIGRlbHRhID0gNSAqIDYwICogMTAwMDtcbiAgdmFyIGxhc3Rfc2Vjb25kcztcbiAgdmFyIHRvZ2dsZV9yZW5ld19saW5rID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmICggbm93ID49IGRhdGUuZ2V0VGltZSgpICkge1xuICAgICAgdmFyICRsaW5rID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcImFbZGlzYWJsZWRdXCIpO1xuICAgICAgJGxpbmsuYXR0cihcImRpc2FibGVkXCIsIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhIEhUIHx8ICEgSFQucGFyYW1zIHx8ICEgSFQucGFyYW1zLmlkICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIGRhdGEgPSAkLmNvb2tpZSgnSFRleHBpcmF0aW9uJywgdW5kZWZpbmVkLCB7IGpzb246IHRydWUgfSk7XG4gICAgaWYgKCAhIGRhdGEgKSB7IHJldHVybiA7IH1cbiAgICB2YXIgc2Vjb25kcyA9IGRhdGFbSFQucGFyYW1zLmlkXTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWRVwiLCBzZWNvbmRzLCBsYXN0X3NlY29uZHMpO1xuICAgIGlmICggc2Vjb25kcyA9PSAtMSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwIGFcIikuY2xvbmUoKTtcbiAgICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwXCIpLnRleHQoXCJZb3VyIGFjY2VzcyBoYXMgZXhwaXJlZCBhbmQgY2Fubm90IGJlIHJlbmV3ZWQuIFJlbG9hZCB0aGUgcGFnZSBvciB0cnkgYWdhaW4gbGF0ZXIuIEFjY2VzcyBoYXMgYmVlbiBwcm92aWRlZCB0aHJvdWdoIHRoZSBcIik7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS5hcHBlbmQoJGxpbmspO1xuICAgICAgdmFyICRhY3Rpb24gPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmFsZXJ0LS1lbWVyZ2VuY3ktYWNjZXNzLS1vcHRpb25zIGFcIik7XG4gICAgICAkYWN0aW9uLmF0dHIoJ2hyZWYnLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAkYWN0aW9uLnRleHQoJ1JlbG9hZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIHNlY29uZHMgPiBsYXN0X3NlY29uZHMgKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAgIGxhc3Rfc2Vjb25kcyA9IHNlY29uZHM7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHZhciB0aW1lMm1lc3NhZ2UgPSBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzZWNvbmRzICogMTAwMCk7XG4gICAgdmFyIGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xuICAgIHZhciBhbXBtID0gJ0FNJztcbiAgICBpZiAoIGhvdXJzID4gMTIgKSB7IGhvdXJzIC09IDEyOyBhbXBtID0gJ1BNJzsgfVxuICAgIGlmICggaG91cnMgPT0gMTIgKXsgYW1wbSA9ICdQTSc7IH1cbiAgICB2YXIgbWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgIGlmICggbWludXRlcyA8IDEwICkgeyBtaW51dGVzID0gYDAke21pbnV0ZXN9YDsgfVxuICAgIHZhciBtZXNzYWdlID0gYCR7aG91cnN9OiR7bWludXRlc30ke2FtcG19ICR7TU9OVEhTW2RhdGUuZ2V0TW9udGgoKV19ICR7ZGF0ZS5nZXREYXRlKCl9YDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxuXG4gIGlmICggJGVtZXJnZW5jeV9hY2Nlc3MubGVuZ3RoICkge1xuICAgIHZhciBleHBpcmF0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlcycpO1xuICAgIHZhciBzZWNvbmRzID0gcGFyc2VJbnQoJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlc1NlY29uZHMnKSwgMTApO1xuICAgIHZhciBncmFudGVkID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzR3JhbnRlZCcpO1xuXG4gICAgdmFyIG5vdyA9IERhdGUubm93KCkgLyAxMDAwO1xuICAgIHZhciBtZXNzYWdlID0gdGltZTJtZXNzYWdlKHNlY29uZHMpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCIuZXhwaXJlcy1kaXNwbGF5XCIpLnRleHQobWVzc2FnZSk7XG4gICAgJGVtZXJnZW5jeV9hY2Nlc3MuZ2V0KDApLmRhdGFzZXQuaW5pdGlhbGl6ZWQgPSAndHJ1ZSdcblxuICAgIGlmICggZ3JhbnRlZCApIHtcbiAgICAgIC8vIHNldCB1cCBhIHdhdGNoIGZvciB0aGUgZXhwaXJhdGlvbiB0aW1lXG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHRvZ2dsZV9yZW5ld19saW5rKGRhdGUpO1xuICAgICAgICBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wKCk7XG4gICAgICB9LCA1MDApO1xuICAgIH1cbiAgfVxuXG4gIGlmICgkKCcjYWNjZXNzQmFubmVySUQnKS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3VwcHJlc3MgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ3N1cGFjY2JhbicpO1xuICAgICAgaWYgKHN1cHByZXNzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRlYnVnID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdodGRldicpO1xuICAgICAgdmFyIGlkaGFzaCA9ICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCB1bmRlZmluZWQsIHtqc29uIDogdHJ1ZX0pO1xuICAgICAgdmFyIHVybCA9ICQudXJsKCk7IC8vIHBhcnNlIHRoZSBjdXJyZW50IHBhZ2UgVVJMXG4gICAgICB2YXIgY3VycmlkID0gdXJsLnBhcmFtKCdpZCcpO1xuICAgICAgaWYgKGlkaGFzaCA9PSBudWxsKSB7XG4gICAgICAgICAgaWRoYXNoID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGlkIGluIGlkaGFzaCkge1xuICAgICAgICAgIGlmIChpZGhhc2guaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoaWRzLmluZGV4T2YoY3VycmlkKSA8IDApIHx8IGRlYnVnKSB7XG4gICAgICAgICAgaWRoYXNoW2N1cnJpZF0gPSAxO1xuICAgICAgICAgIC8vIHNlc3Npb24gY29va2llXG4gICAgICAgICAgJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIGlkaGFzaCwgeyBqc29uIDogdHJ1ZSwgcGF0aDogJy8nLCBkb21haW46ICcuaGF0aGl0cnVzdC5vcmcnIH0pO1xuXG4gICAgICAgICAgZnVuY3Rpb24gc2hvd0FsZXJ0KCkge1xuICAgICAgICAgICAgICB2YXIgaHRtbCA9ICQoJyNhY2Nlc3NCYW5uZXJJRCcpLmh0bWwoKTtcbiAgICAgICAgICAgICAgdmFyICRhbGVydCA9IGJvb3Rib3guZGlhbG9nKGh0bWwsIFt7IGxhYmVsOiBcIk9LXCIsIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIgfV0sIHsgaGVhZGVyIDogJ1NwZWNpYWwgYWNjZXNzJywgcm9sZTogJ2FsZXJ0ZGlhbG9nJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoc2hvd0FsZXJ0LCAzMDAwLCB0cnVlKTtcbiAgICAgIH1cbiAgfVxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9ICdfX05FV19fJzsgLy8gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga3YgPSB0bXBbaV0uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgcmV0dmFsW2t2WzBdXSA9IGt2WzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKGFyZ3MpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHsgY3JlYXRpbmcgOiBmYWxzZSwgbGFiZWwgOiBcIlNhdmUgQ2hhbmdlc1wiIH0sIGFyZ3MpO1xuXG4gICAgICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICAgICAgICAgJzxmb3JtIGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCIgYWN0aW9uPVwibWJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWNuXCI+Q29sbGVjdGlvbiBOYW1lPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBtYXhsZW5ndGg9XCIxMDBcIiBuYW1lPVwiY25cIiBpZD1cImVkaXQtY25cIiB2YWx1ZT1cIlwiIHBsYWNlaG9sZGVyPVwiWW91ciBjb2xsZWN0aW9uIG5hbWVcIiByZXF1aXJlZCAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1jbi1jb3VudFwiPjEwMDwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWRlc2NcIj5EZXNjcmlwdGlvbjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgaWQ9XCJlZGl0LWRlc2NcIiBuYW1lPVwiZGVzY1wiIHJvd3M9XCI0XCIgbWF4bGVuZ3RoPVwiMjU1XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIHBsYWNlaG9sZGVyPVwiQWRkIHlvdXIgY29sbGVjdGlvbiBkZXNjcmlwdGlvbi5cIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1kZXNjLWNvdW50XCI+MjU1PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiPklzIHRoaXMgY29sbGVjdGlvbiA8c3Ryb25nPlB1YmxpYzwvc3Ryb25nPiBvciA8c3Ryb25nPlByaXZhdGU8L3N0cm9uZz4/PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTBcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJpdmF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTFcIiB2YWx1ZT1cIjFcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0xXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1B1YmxpYyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZm9ybT4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmNuICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwob3B0aW9ucy5jbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuZGVzYyApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwob3B0aW9ucy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5zaHJkICE9IG51bGwgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9XCIgKyBvcHRpb25zLnNocmQgKyAnXScpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICggISBIVC5sb2dpbl9zdGF0dXMubG9nZ2VkX2luICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTBdXCIpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvXCI+PHN0cm9uZz5UaGlzIGNvbGxlY3Rpb24gd2lsbCBiZSB0ZW1wb3Jhcnk8L3N0cm9uZz4uIExvZyBpbiB0byBjcmVhdGUgcGVybWFuZW50IGFuZCBwdWJsaWMgY29sbGVjdGlvbnMuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPGxhYmVsPiB0aGF0IHdyYXBzIHRoZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0xXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwibGFiZWxbZm9yPSdlZGl0LXNocmQtMSddXCIpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLiRoaWRkZW4gKSB7XG4gICAgICAgICAgICBvcHRpb25zLiRoaWRkZW4uY2xvbmUoKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2MnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYyk7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYScgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5paWQgKSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0naWlkJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmlpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJGJsb2NrLmdldCgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGZvcm0uY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNuID0gJC50cmltKCRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9ICQudHJpbSgkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBjbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvclwiPllvdSBtdXN0IGVudGVyIGEgY29sbGVjdGlvbiBuYW1lLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYSA6ICdhZGRpdHNuYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbiA6IGNuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYyA6IGRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaHJkIDogJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdOmNoZWNrZWRcIikudmFsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgICRkaWFsb2cuZmluZChcImlucHV0W3R5cGU9dGV4dF0sdGV4dGFyZWFcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJGNvdW50ID0gJChcIiNcIiArICR0aGlzLmF0dHIoJ2lkJykgKyBcIi1jb3VudFwiKTtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9ICR0aGlzLmF0dHIoXCJtYXhsZW5ndGhcIik7XG5cbiAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcblxuICAgICAgICAgICAgJHRoaXMuYmluZCgna2V5dXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRfcG9zdChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgeyBwYWdlIDogJ2FqYXgnLCBpZCA6IEhULnBhcmFtcy5pZCB9LCBwYXJhbXMpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogZ2V0X3VybCgpLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyc2VfbGluZShkYXRhKTtcbiAgICAgICAgICAgIGhpZGVfaW5mbygpO1xuICAgICAgICAgICAgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9TVUNDRVNTJyApIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9GQUlMVVJFJyApIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiSXRlbSBjb3VsZCBub3QgYmUgYWRkZWQgYXQgdGhpcyB0aW1lLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciAkdWwgPSAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcFwiKTtcbiAgICAgICAgdmFyIGNvbGxfaHJlZiA9IGdldF91cmwoKSArIFwiP2E9bGlzdGlzO2M9XCIgKyBwYXJhbXMuY29sbF9pZDtcbiAgICAgICAgdmFyICRhID0gJChcIjxhPlwiKS5hdHRyKFwiaHJlZlwiLCBjb2xsX2hyZWYpLnRleHQocGFyYW1zLmNvbGxfbmFtZSk7XG4gICAgICAgICQoXCI8bGk+PC9saT5cIikuYXBwZW5kVG8oJHVsKS5hcHBlbmQoJGEpO1xuICAgICAgICAkdWwucGFyZW50cyhcImRpdlwiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG5cbiAgICAgICAgLy8gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNQVGFkZEl0ZW1CdG4nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcblxuICAvLyBmb3JjZSBDUk1TIHVzZXJzIHRvIGEgZml4ZWQgaW1hZ2Ugc2l6ZVxuICBpZiAoIEhULmlzX2RldiApIHtcbiAgICBIVC5mb3JjZV9zaXplID0gMjAwO1xuICB9XG5cbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xudmFyIHBob3RvY29waWVyX21lc3NhZ2UgPSAnVGhlIGNvcHlyaWdodCBsYXcgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgKFRpdGxlIDE3LCBVLlMuIENvZGUpIGdvdmVybnMgdGhlIG1ha2luZyBvZiByZXByb2R1Y3Rpb25zIG9mIGNvcHlyaWdodGVkIG1hdGVyaWFsLiBVbmRlciBjZXJ0YWluIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBsYXcsIGxpYnJhcmllcyBhbmQgYXJjaGl2ZXMgYXJlIGF1dGhvcml6ZWQgdG8gZnVybmlzaCBhIHJlcHJvZHVjdGlvbi4gT25lIG9mIHRoZXNlIHNwZWNpZmljIGNvbmRpdGlvbnMgaXMgdGhhdCB0aGUgcmVwcm9kdWN0aW9uIGlzIG5vdCB0byBiZSDigJx1c2VkIGZvciBhbnkgcHVycG9zZSBvdGhlciB0aGFuIHByaXZhdGUgc3R1ZHksIHNjaG9sYXJzaGlwLCBvciByZXNlYXJjaC7igJ0gSWYgYSB1c2VyIG1ha2VzIGEgcmVxdWVzdCBmb3IsIG9yIGxhdGVyIHVzZXMsIGEgcmVwcm9kdWN0aW9uIGZvciBwdXJwb3NlcyBpbiBleGNlc3Mgb2Yg4oCcZmFpciB1c2Us4oCdIHRoYXQgdXNlciBtYXkgYmUgbGlhYmxlIGZvciBjb3B5cmlnaHQgaW5mcmluZ2VtZW50Lic7XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvLyAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIik7XG4gICAgICAgICQoXCJib2R5XCIpLm9uKFwiY2xpY2tcIiwgXCJhW2RhdGEtdG9nZ2xlKj1kb3dubG9hZF1cIiwgZnVuY3Rpb24oZSkgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIFRIRSBNT0RFIElTIFRPR0dMRURcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHRoaXMuZGF0YXNldC5waG90b2NvcGllciA9PSAndHJ1ZScgJiYgISBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdwaG90b2NvcGllci5jb25maXJtZWQnKSApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCAhIHdpbmRvdy5jb25maXJtKHBob3RvY29waWVyX21lc3NhZ2UpICkge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdwaG90b2NvcGllci5jb25maXJtZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvLyB9XG5cblxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAvLyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LXN1Y2Nlc3MgZG9uZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAvLyAgICAgJzxwPkFsbCBkb25lITwvcD4nICtcbiAgICAgICAgICAgIC8vICc8L2Rpdj4nICsgXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiIGRvd25sb2FkPVwiZG93bmxvYWRcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoICRkb3dubG9hZF9idG4uZ2V0KDApLmRvd25sb2FkID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIHZhciBudW1fcGFnZV9kb3dubG9hZHMgPSAwO1xuICAgICQoXCJhW2RhdGEtcGhvdG9jb3BpZXJdXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCB0aGlzLmRhdGFzZXQucGhvdG9jb3BpZXIgPT0gJ3RydWUnICkge1xuICAgICAgICAgICAgaWYgKCBudW1fcGFnZV9kb3dubG9hZHMgPT0gMCB8fCAoIGZhbHNlICYmIG51bV9wYWdlX2Rvd25sb2FkcyAlIDUgPT0gMCApICkge1xuICAgICAgICAgICAgICAgIGlmICggISB3aW5kb3cuY29uZmlybShwaG90b2NvcGllcl9tZXNzYWdlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtX3BhZ2VfZG93bmxvYWRzICs9IDE7XG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gYW5kIGRvIHRoaXMgaGVyZVxuICAgICQoXCIjc2VsZWN0ZWRQYWdlc1BkZkxpbmtcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIHByaW50YWJsZSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcblxuICAgICAgICBpZiAoIHByaW50YWJsZS5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgIHZhciBidXR0b25zID0gW107XG5cbiAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIHByaW50LjwvcD5cIiBdO1xuICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgbGVmdCBvciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBhcHBlYXIgaW4gdGhlIHNlbGVjdGlvbiBjb250ZW50cyA8YnV0dG9uIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiAjNjY2OyBib3JkZXItY29sb3I6ICNlZWVcXFwiIGNsYXNzPVxcXCJidG4gc3F1YXJlXFxcIj48aSBjbGFzcz1cXFwiaWNvbW9vbiBpY29tb29uLXBhcGVyc1xcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0O1xuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2sgJyArXG4gICAgICAgICAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICAgICAgICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPjxpIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWhlbHBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5IZWxwOiBFbWJlZGRpbmcgSGF0aGlUcnVzdCBCb29rczwvc3Bhbj48L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LXNjcm9sbFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctZmxpcFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAvLyAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNlbWJlZEh0bWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuO1xuXG4gICAgdmFyIGluaXRlZCA9IGZhbHNlO1xuXG4gICAgdmFyICRmb3JtID0gJChcIiNzZWFyY2gtbW9kYWwgZm9ybVwiKTtcblxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXQuc2VhcmNoLWlucHV0LXRleHRcIik7XG4gICAgdmFyICRpbnB1dF9sYWJlbCA9ICRmb3JtLmZpbmQoXCJsYWJlbFtmb3I9J3ExLWlucHV0J11cIik7XG4gICAgdmFyICRzZWxlY3QgPSAkZm9ybS5maW5kKFwiLmNvbnRyb2wtc2VhcmNodHlwZVwiKTtcbiAgICB2YXIgJHNlYXJjaF90YXJnZXQgPSAkZm9ybS5maW5kKFwiLnNlYXJjaC10YXJnZXRcIik7XG4gICAgdmFyICRmdCA9ICRmb3JtLmZpbmQoXCJzcGFuLmZ1bmt5LWZ1bGwtdmlld1wiKTtcblxuICAgIHZhciAkYmFja2Ryb3AgPSBudWxsO1xuXG4gICAgdmFyICRhY3Rpb24gPSAkKFwiI2FjdGlvbi1zZWFyY2gtaGF0aGl0cnVzdFwiKTtcbiAgICAkYWN0aW9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBib290Ym94LnNob3coJ3NlYXJjaC1tb2RhbCcsIHtcbiAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgICAgICAkaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcblxuICAgIHZhciBfc2V0dXAgPSB7fTtcbiAgICBfc2V0dXAubHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5oaWRlKCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgb3Igd2l0aGluIHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGZ1bGwtdGV4dCBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGZ1bGwtdGV4dCBpbmRleC5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0dXAuY2F0YWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LnNob3coKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBjYXRhbG9nIGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgY2F0YWxvZyBpbmRleDsgeW91IGNhbiBsaW1pdCB5b3VyIHNlYXJjaCB0byBhIHNlbGVjdGlvbiBvZiBmaWVsZHMuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9ICRzZWFyY2hfdGFyZ2V0LmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLnZhbCgpO1xuICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgaW5pdGVkID0gdHJ1ZTtcblxuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIGlmICggcHJlZnMuc2VhcmNoICYmIHByZWZzLnNlYXJjaC5mdCApIHtcbiAgICAgICAgJChcImlucHV0W25hbWU9ZnRdXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cblxuICAgICRzZWFyY2hfdGFyZ2V0Lm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBsYWJlbCA6IFwiLVwiLCBjYXRlZ29yeSA6IFwiSFQgU2VhcmNoXCIsIGFjdGlvbiA6IHRhcmdldCB9KTtcbiAgICB9KVxuXG4gICAgLy8gJGZvcm0uZGVsZWdhdGUoJzppbnB1dCcsICdmb2N1cyBjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiRk9DVVNJTkdcIiwgdGhpcyk7XG4gICAgLy8gICAgICRmb3JtLmFkZENsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgPT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcCA9ICQoJzxkaXYgY2xhc3M9XCJtb2RhbF9fb3ZlcmxheSBpbnZpc2libGVcIj48L2Rpdj4nKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgJGJhY2tkcm9wLmFwcGVuZFRvKCQoXCJib2R5XCIpKS5zaG93KCk7XG4gICAgLy8gfSlcblxuICAgIC8vICQoXCJib2R5XCIpLm9uKCdmb2N1cycsICc6aW5wdXQsYScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAvLyAgICAgaWYgKCAhICR0aGlzLmNsb3Nlc3QoXCIubmF2LXNlYXJjaC1mb3JtXCIpLmxlbmd0aCApIHtcbiAgICAvLyAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIHZhciBjbG9zZV9zZWFyY2hfZm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkZm9ybS5yZW1vdmVDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wICE9IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuZGV0YWNoKCk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuaGlkZSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYWRkIGV2ZW50IGhhbmRsZXIgZm9yIHN1Ym1pdCB0byBjaGVjayBmb3IgZW1wdHkgcXVlcnkgb3IgYXN0ZXJpc2tcbiAgICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpXG4gICAgICAgICB7XG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIEhULmFuYWx5dGljcy5nZXRDb250ZW50R3JvdXBEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlYXRcbiAgICB2YXIgc3VmZml4ID0gJyc7XG4gICAgdmFyIGNvbnRlbnRfZ3JvdXAgPSA0O1xuICAgIGlmICggJChcIiNzZWN0aW9uXCIpLmRhdGEoXCJ2aWV3XCIpID09ICdyZXN0cmljdGVkJyApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAyO1xuICAgICAgc3VmZml4ID0gJyNyZXN0cmljdGVkJztcbiAgICB9IGVsc2UgaWYgKCB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKFwiZGVidWc9c3VwZXJcIikgPiAtMSApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAzO1xuICAgICAgc3VmZml4ID0gJyNzdXBlcic7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4IDogY29udGVudF9ncm91cCwgdmFsdWUgOiBIVC5wYXJhbXMuaWQgKyBzdWZmaXggfTtcblxuICB9XG5cbiAgSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmID0gZnVuY3Rpb24oaHJlZikge1xuICAgIHZhciB1cmwgPSAkLnVybChocmVmKTtcbiAgICB2YXIgbmV3X2hyZWYgPSB1cmwuc2VnbWVudCgpO1xuICAgIG5ld19ocmVmLnB1c2goJChcImh0bWxcIikuZGF0YSgnY29udGVudC1wcm92aWRlcicpKTtcbiAgICBuZXdfaHJlZi5wdXNoKHVybC5wYXJhbShcImlkXCIpKTtcbiAgICB2YXIgcXMgPSAnJztcbiAgICBpZiAoIG5ld19ocmVmLmluZGV4T2YoXCJzZWFyY2hcIikgPiAtMSAmJiB1cmwucGFyYW0oJ3ExJykgICkge1xuICAgICAgcXMgPSAnP3ExPScgKyB1cmwucGFyYW0oJ3ExJyk7XG4gICAgfVxuICAgIG5ld19ocmVmID0gXCIvXCIgKyBuZXdfaHJlZi5qb2luKFwiL1wiKSArIHFzO1xuICAgIHJldHVybiBuZXdfaHJlZjtcbiAgfVxuXG4gIEhULmFuYWx5dGljcy5nZXRQYWdlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYoKTtcbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkbWVudTsgdmFyICR0cmlnZ2VyOyB2YXIgJGhlYWRlcjsgdmFyICRuYXZpZ2F0b3I7XG4gIEhUID0gSFQgfHwge307XG5cbiAgSFQubW9iaWZ5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBpZiAoICQoXCJodG1sXCIpLmlzKFwiLmRlc2t0b3BcIikgKSB7XG4gICAgLy8gICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImRlc2t0b3BcIikucmVtb3ZlQ2xhc3MoXCJuby1tb2JpbGVcIik7XG4gICAgLy8gfVxuXG4gICAgJGhlYWRlciA9ICQoXCJoZWFkZXJcIik7XG4gICAgJG5hdmlnYXRvciA9ICQoXCIubmF2aWdhdG9yXCIpO1xuICAgIGlmICggJG5hdmlnYXRvci5sZW5ndGggKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9IHRydWU7XG4gICAgICAkbmF2aWdhdG9yLmdldCgwKS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1oZWlnaHQnLCBgLSR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpICogMC45MH1weGApO1xuICAgICAgJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodCA9IGB7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YDtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgYCR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YCk7XG4gICAgICB2YXIgJGV4cGFuZG8gPSAkbmF2aWdhdG9yLmZpbmQoXCIuYWN0aW9uLWV4cGFuZG9cIik7XG4gICAgICAkZXhwYW5kby5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAhICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICk7XG4gICAgICAgIHZhciBuYXZpZ2F0b3JIZWlnaHQgPSAwO1xuICAgICAgICBpZiAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApIHtcbiAgICAgICAgICBuYXZpZ2F0b3JIZWlnaHQgPSAkbmF2aWdhdG9yLmdldCgwKS5kYXRhc2V0Lm9yaWdpbmFsSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgbmF2aWdhdG9ySGVpZ2h0KTtcbiAgICAgIH0pXG5cbiAgICAgIGlmICggSFQucGFyYW1zLnVpID09ICdlbWJlZCcgKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRleHBhbmRvLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIEhULiRtZW51ID0gJG1lbnU7XG5cbiAgICB2YXIgJHNpZGViYXIgPSAkKFwiI3NpZGViYXJcIik7XG5cbiAgICAkdHJpZ2dlciA9ICRzaWRlYmFyLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIik7XG5cbiAgICAkKFwiI2FjdGlvbi1tb2JpbGUtdG9nZ2xlLWZ1bGxzY3JlZW5cIikub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgICB9KVxuXG4gICAgSFQudXRpbHMgPSBIVC51dGlscyB8fCB7fTtcblxuICAgIC8vICRzaWRlYmFyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJy5zaWRlYmFyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBoaWRlIHRoZSBzaWRlYmFyXG4gICAgICB2YXIgJHRoaXMgPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICBpZiAoICR0aGlzLmlzKFwiaW5wdXRbdHlwZT0ndGV4dCddLHNlbGVjdFwiKSApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKS5sZW5ndGggKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMuaXMoXCJidXR0b24sYVwiKSApIHtcbiAgICAgICAgSFQudG9nZ2xlKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKHdpbmRvdykub24oXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gICAgICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIC8vICAgICB9LCAxMDApO1xuICAgIC8vIH0pXG4gICAgaWYgKCBIVCAmJiBIVC51dGlscyAmJiBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSApIHtcbiAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgfVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gJ3RydWUnO1xuICB9XG5cbiAgSFQudG9nZ2xlID0gZnVuY3Rpb24oc3RhdGUpIHtcblxuICAgIC8vICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcIi5zaWRlYmFyLWNvbnRhaW5lclwiKS5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQuc2lkZWJhckV4cGFuZGVkID0gc3RhdGU7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IHN0YXRlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG5cbiAgICAvLyB2YXIgeGxpbmtfaHJlZjtcbiAgICAvLyBpZiAoICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZScgKSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1leHBhbmRlZCc7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWNvbGxhcHNlZCc7XG4gICAgLy8gfVxuICAgIC8vICR0cmlnZ2VyLmZpbmQoXCJzdmcgdXNlXCIpLmF0dHIoXCJ4bGluazpocmVmXCIsIHhsaW5rX2hyZWYpO1xuICB9XG5cbiAgc2V0VGltZW91dChIVC5tb2JpZnksIDEwMDApO1xuXG4gIHZhciB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaCA9ICQoXCIjc2lkZWJhciAuc2lkZWJhci10b2dnbGUtYnV0dG9uXCIpLm91dGVySGVpZ2h0KCkgfHwgNDA7XG4gICAgdmFyIHRvcCA9ICggJChcImhlYWRlclwiKS5oZWlnaHQoKSArIGggKSAqIDEuMDU7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXRvb2xiYXItaG9yaXpvbnRhbC10b3AnLCB0b3AgKyAncHgnKTtcbiAgfVxuICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSk7XG4gIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSgpO1xuXG4gICQoXCJodG1sXCIpLmdldCgwKS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2lkZWJhci1leHBhbmRlZCcsIGZhbHNlKTtcblxufSlcbiIsImlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gIC8vIE11c3QgYmUgd3JpdGFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCwgXCJhc3NpZ25cIiwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7IC8vIC5sZW5ndGggb2YgZnVuY3Rpb24gaXMgMlxuICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7IC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgICAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7IC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0bztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KTtcbn1cblxuLy8gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2pzZXJ6L2pzX3BpZWNlL2Jsb2IvbWFzdGVyL0RPTS9DaGlsZE5vZGUvYWZ0ZXIoKS9hZnRlcigpLm1kXG4oZnVuY3Rpb24gKGFycikge1xuICBhcnIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmIChpdGVtLmhhc093blByb3BlcnR5KCdhZnRlcicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpdGVtLCAnYWZ0ZXInLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gYWZ0ZXIoKSB7XG4gICAgICAgIHZhciBhcmdBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgIGRvY0ZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgIFxuICAgICAgICBhcmdBcnIuZm9yRWFjaChmdW5jdGlvbiAoYXJnSXRlbSkge1xuICAgICAgICAgIHZhciBpc05vZGUgPSBhcmdJdGVtIGluc3RhbmNlb2YgTm9kZTtcbiAgICAgICAgICBkb2NGcmFnLmFwcGVuZENoaWxkKGlzTm9kZSA/IGFyZ0l0ZW0gOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJpbmcoYXJnSXRlbSkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRvY0ZyYWcsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pKFtFbGVtZW50LnByb3RvdHlwZSwgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUsIERvY3VtZW50VHlwZS5wcm90b3R5cGVdKTtcblxuZnVuY3Rpb24gUmVwbGFjZVdpdGhQb2x5ZmlsbCgpIHtcbiAgJ3VzZS1zdHJpY3QnOyAvLyBGb3Igc2FmYXJpLCBhbmQgSUUgPiAxMFxuICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlLCBpID0gYXJndW1lbnRzLmxlbmd0aCwgY3VycmVudE5vZGU7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghaSkgLy8gaWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50c1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgd2hpbGUgKGktLSkgeyAvLyBpLS0gZGVjcmVtZW50cyBpIGFuZCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBpIGJlZm9yZSB0aGUgZGVjcmVtZW50XG4gICAgY3VycmVudE5vZGUgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50Tm9kZSAhPT0gJ29iamVjdCcpe1xuICAgICAgY3VycmVudE5vZGUgPSB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3VycmVudE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUucGFyZW50Tm9kZSl7XG4gICAgICBjdXJyZW50Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGN1cnJlbnROb2RlKTtcbiAgICB9XG4gICAgLy8gdGhlIHZhbHVlIG9mIFwiaVwiIGJlbG93IGlzIGFmdGVyIHRoZSBkZWNyZW1lbnRcbiAgICBpZiAoIWkpIC8vIGlmIGN1cnJlbnROb2RlIGlzIHRoZSBmaXJzdCBhcmd1bWVudCAoY3VycmVudE5vZGUgPT09IGFyZ3VtZW50c1swXSlcbiAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQoY3VycmVudE5vZGUsIHRoaXMpO1xuICAgIGVsc2UgLy8gaWYgY3VycmVudE5vZGUgaXNuJ3QgdGhlIGZpcnN0XG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGN1cnJlbnROb2RlLCB0aGlzLnByZXZpb3VzU2libGluZyk7XG4gIH1cbn1cbmlmICghRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aClcbiAgICBDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aCA9IFJlcGxhY2VXaXRoUG9seWZpbGw7XG5pZiAoIURvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGgpIFxuICAgIERvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuXG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJGZvcm0gPSAkKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKTtcblxuICB2YXIgJGJvZHkgPSAkKFwiYm9keVwiKTtcblxuICAkKHdpbmRvdykub24oJ3VuZG8tbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICQoXCJidXR0b24uYnRuLWxvYWRpbmdcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpLnJlbW92ZUNsYXNzKFwiYnRuLWxvYWRpbmdcIik7XG4gIH0pXG5cbiAgJChcImJvZHlcIikub24oJ3N1Ym1pdCcsICdmb3JtLmZvcm0tc2VhcmNoLXZvbHVtZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgSFQuYmVmb3JlVW5sb2FkVGltZW91dCA9IDE1MDAwO1xuICAgIHZhciAkZm9ybV8gPSAkKHRoaXMpO1xuXG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybV8uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybV8uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKHdpbmRvdykudHJpZ2dlcigndW5kby1sb2FkaW5nJyk7XG4gICAgfSlcblxuICAgIGlmICggSFQucmVhZGVyICYmIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3IgKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3Iuc3VibWl0KCRmb3JtXy5nZXQoMCkpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgcHJvY2Vzc2luZ1xuICB9KVxuXG4gICQoXCIjYWN0aW9uLXN0YXJ0LWp1bXBcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeiA9IHBhcnNlSW50KCQodGhpcykuZGF0YSgnc3onKSwgMTApO1xuICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KCQodGhpcykudmFsKCksIDEwKTtcbiAgICB2YXIgc3RhcnQgPSAoIHZhbHVlIC0gMSApICogc3ogKyAxO1xuICAgIHZhciAkZm9ybV8gPSAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3RhcnQnIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3RhcnR9XCIgLz5gKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3onIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3p9XCIgLz5gKTtcbiAgICAkZm9ybV8uc3VibWl0KCk7XG4gIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjdmVyc2lvbkljb24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
