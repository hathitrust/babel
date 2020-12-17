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
            input.checked = true;
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
      if ($this.parents(".form-download-module").length) {
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwicG9seWZpbGxzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsInJlbmV3X2F1dGgiLCJlbnRpdHlJRCIsInNvdXJjZSIsIl9fcmVuZXdpbmciLCJzZXRUaW1lb3V0IiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIm9uIiwiZXZlbnQiLCJNT05USFMiLCIkZW1lcmdlbmN5X2FjY2VzcyIsImRlbHRhIiwibGFzdF9zZWNvbmRzIiwidG9nZ2xlX3JlbmV3X2xpbmsiLCJkYXRlIiwibm93IiwiRGF0ZSIsImdldFRpbWUiLCIkbGluayIsImZpbmQiLCJvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wIiwicGFyYW1zIiwiaWQiLCJjb29raWUiLCJqc29uIiwic2Vjb25kcyIsImNsb25lIiwidGV4dCIsImFwcGVuZCIsIiRhY3Rpb24iLCJtZXNzYWdlIiwidGltZTJtZXNzYWdlIiwiaG91cnMiLCJnZXRIb3VycyIsImFtcG0iLCJtaW51dGVzIiwiZ2V0TWludXRlcyIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImV4cGlyYXRpb24iLCJwYXJzZUludCIsImdyYW50ZWQiLCJnZXQiLCJkYXRhc2V0IiwiaW5pdGlhbGl6ZWQiLCJzZXRJbnRlcnZhbCIsInN1cHByZXNzIiwiaGFzQ2xhc3MiLCJkZWJ1ZyIsImlkaGFzaCIsImN1cnJpZCIsImlkcyIsInNob3dBbGVydCIsImh0bWwiLCIkYWxlcnQiLCJib290Ym94IiwiZGlhbG9nIiwibGFiZWwiLCJoZWFkZXIiLCJyb2xlIiwiZG9tYWluIiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm5hbWUiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJDbGFzc0xpc3QiLCJlbGVtIiwidHJpbW1lZENsYXNzZXMiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc2VzIiwiX3VwZGF0ZUNsYXNzTmFtZSIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdFByb3RvIiwiY2xhc3NMaXN0R2V0dGVyIiwiRXJyb3IiLCJjb250YWlucyIsImFkZCIsInRva2VucyIsInVwZGF0ZWQiLCJyZW1vdmUiLCJpbmRleCIsInNwbGljZSIsInRvZ2dsZSIsImZvcmNlIiwicmVzdWx0IiwibWV0aG9kIiwicmVwbGFjZW1lbnRfdG9rZW4iLCJqb2luIiwiZGVmaW5lUHJvcGVydHkiLCJjbGFzc0xpc3RQcm9wRGVzYyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJleCIsIm51bWJlciIsIl9fZGVmaW5lR2V0dGVyX18iLCJ0ZXN0RWxlbWVudCIsImNyZWF0ZU1ldGhvZCIsIm9yaWdpbmFsIiwiRE9NVG9rZW5MaXN0IiwiX3RvZ2dsZSIsInNsaWNlIiwiYXBwbHkiLCJERUZBVUxUX0NPTExfTUVOVV9PUFRJT04iLCJORVdfQ09MTF9NRU5VX09QVElPTiIsIklOX1lPVVJfQ09MTFNfTEFCRUwiLCIkdG9vbGJhciIsIiRlcnJvcm1zZyIsIiRpbmZvbXNnIiwiZGlzcGxheV9lcnJvciIsIm1zZyIsImluc2VydEFmdGVyIiwic2hvdyIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYWdlIiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwicGFyZW50cyIsInJlbW92ZUNsYXNzIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiYW5zd2VyIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJmb3JjZV9zaXplIiwiJGRpdiIsIiRwIiwicGhvdG9jb3BpZXJfbWVzc2FnZSIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0IiwiZG93bmxvYWRQZGYiLCJjb25maWciLCJzcmMiLCJpdGVtX3RpdGxlIiwiJGNvbmZpZyIsInRvdGFsIiwic2VsZWN0aW9uIiwicGFnZXMiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCIkc3RhdHVzIiwicmVxdWVzdERvd25sb2FkIiwic2VxIiwiZG93bmxvYWRGb3JtYXQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJjaGVja1N0YXR1cyIsInRzIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJ1cGRhdGVTdGF0dXNUZXh0IiwiY3NzIiwid2lkdGgiLCJkb3dubG9hZF9rZXkiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCIkZG93bmxvYWRfYnRuIiwiZG93bmxvYWQiLCJ0cmFja0V2ZW50IiwiY2F0ZWdvcnkiLCJ0b1VwcGVyQ2FzZSIsInRyYWNraW5nQWN0aW9uIiwiaGoiLCJzdG9wUHJvcGFnYXRpb24iLCJmb2N1cyIsIk1hdGgiLCJjZWlsIiwiY2xlYXJJbnRlcnZhbCIsInRpbWVvdXQiLCJyYXRlIiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiX2xhc3RNZXNzYWdlIiwiX2xhc3RUaW1lciIsImNsZWFyVGltZW91dCIsImlubmVyVGV4dCIsIkVPVCIsImRvd25sb2FkRm9ybSIsImRvd25sb2FkRm9ybWF0T3B0aW9ucyIsInJhbmdlT3B0aW9ucyIsImRvd25sb2FkSWR4IiwicXVlcnlTZWxlY3RvciIsImRvd25sb2FkZXIiLCJjcmVhdGUiLCJxdWVyeVNlbGVjdG9yQWxsIiwiZG93bmxvYWRTdWJtaXQiLCJoYXNGdWxsUGRmQWNjZXNzIiwiZnVsbFBkZkFjY2VzcyIsInVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zIiwib3B0aW9uIiwiZm9yRWFjaCIsInJhbmdlT3B0aW9uIiwiaW5wdXQiLCJkaXNhYmxlZCIsIm1hdGNoZXMiLCJ2YWx1ZSIsImN1cnJlbnRfdmlldyIsInJlYWRlciIsImNoZWNrZWQiLCJhZGRFdmVudExpc3RlbmVyIiwiZGl2IiwiZm9ybWF0T3B0aW9uIiwiZG93bmxvYWRGb3JtYXRUYXJnZXQiLCJwZGZGb3JtYXRPcHRpb24iLCJ0dW5uZWxGb3JtIiwicHJpbnRhYmxlIiwiYWN0aW9uVGVtcGxhdGUiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiaXNTZWxlY3Rpb24iLCJidXR0b25zIiwiY3VycmVudExvY2F0aW9uIiwiX2dldEZsYXR0ZW5lZFNlbGVjdGlvbiIsImlzUGFydGlhbCIsInJlbW92ZUNoaWxkIiwic2l6ZV9hdHRyIiwiaW1hZ2VfZm9ybWF0X2F0dHIiLCJzaXplX3ZhbHVlIiwiYXBwZW5kQ2hpbGQiLCJyYW5nZSIsImJvZHkiLCJ0cmFja2VyIiwidHJhY2tlcl9pbnB1dCIsInN0eWxlIiwib3BhY2l0eSIsInRyYWNrZXJJbnRlcnZhbCIsImlzX2RldiIsInJlbW92ZUNvb2tpZSIsImRpc2FibGVVbmxvYWRUaW1lb3V0Iiwic3VibWl0IiwiX2Zvcm1hdF90aXRsZXMiLCJlcHViIiwicGxhaW50ZXh0IiwiaW1hZ2UiLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwiYWRkQ2xhc3MiLCJ0ZXh0YXJlYSIsInNlbGVjdCIsImNsaWNrIiwiZmVlZGJhY2siLCIkZm9ybSIsIlJlY29yZFVSTCIsIiRlbWFpbCIsImluaXRlZCIsIiRpbnB1dCIsIiRpbnB1dF9sYWJlbCIsIiRzZWxlY3QiLCIkc2VhcmNoX3RhcmdldCIsIiRmdCIsIiRiYWNrZHJvcCIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInNlYXJjaHR5cGUiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiJG1lbnUiLCIkdHJpZ2dlciIsIiRoZWFkZXIiLCIkbmF2aWdhdG9yIiwibW9iaWZ5IiwiZG9jdW1lbnRFbGVtZW50IiwiZXhwYW5kZWQiLCJzZXRQcm9wZXJ0eSIsIm91dGVySGVpZ2h0Iiwib3JpZ2luYWxIZWlnaHQiLCIkZXhwYW5kbyIsIm5hdmlnYXRvckhlaWdodCIsInVpIiwiJHNpZGViYXIiLCJyZXF1ZXN0RnVsbFNjcmVlbiIsInV0aWxzIiwiaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UiLCJzdGF0ZSIsInNpZGViYXJFeHBhbmRlZCIsInVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSIsInRvcCIsImhlaWdodCIsImFzc2lnbiIsInZhckFyZ3MiLCJUeXBlRXJyb3IiLCJ0byIsIm5leHRTb3VyY2UiLCJuZXh0S2V5Iiwid3JpdGFibGUiLCJhcnIiLCJhZnRlciIsImFyZ0FyciIsImRvY0ZyYWciLCJjcmVhdGVEb2N1bWVudEZyYWdtZW50IiwiYXJnSXRlbSIsImlzTm9kZSIsIk5vZGUiLCJjcmVhdGVUZXh0Tm9kZSIsInBhcmVudE5vZGUiLCJpbnNlcnRCZWZvcmUiLCJuZXh0U2libGluZyIsIkNoYXJhY3RlckRhdGEiLCJEb2N1bWVudFR5cGUiLCJSZXBsYWNlV2l0aFBvbHlmaWxsIiwiY3VycmVudE5vZGUiLCJvd25lckRvY3VtZW50IiwicmVwbGFjZUNoaWxkIiwicHJldmlvdXNTaWJsaW5nIiwicmVwbGFjZVdpdGgiLCIkYm9keSIsInJlbW92ZUF0dHIiLCJiZWZvcmVVbmxvYWRUaW1lb3V0IiwiJGZvcm1fIiwiJHN1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RDZZLEVBQXZEO0FBQ0FILFdBQU9sRyxNQUFQO0FBQ0QsR0FSRDtBQVVELENBL0NEOzs7QUNBQW5WLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQi9GLE1BQUUsTUFBRixFQUFVb0gsRUFBVixDQUFhLE9BQWIsRUFBc0IsY0FBdEIsRUFBc0MsVUFBUzlDLENBQVQsRUFBWTtBQUM5Q0EsVUFBRWtPLGNBQUY7QUFDQXBJLGdCQUFRcUosS0FBUixDQUFjLG9ZQUFkO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IFVSTCBQYXJzZXIgcGx1Z2luLCB2Mi4yLjFcbiAqIERldmVsb3BlZCBhbmQgbWFpbnRhbmluZWQgYnkgTWFyayBQZXJraW5zLCBtYXJrQGFsbG1hcmtlZHVwLmNvbVxuICogU291cmNlIHJlcG9zaXRvcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlclxuICogTGljZW5zZWQgdW5kZXIgYW4gTUlULXN0eWxlIGxpY2Vuc2UuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXIvYmxvYi9tYXN0ZXIvTElDRU5TRSBmb3IgZGV0YWlscy5cbiAqLyBcblxuOyhmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQgYXZhaWxhYmxlOyB1c2UgYW5vbnltb3VzIG1vZHVsZVxuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gTm8gQU1EIGF2YWlsYWJsZTsgbXV0YXRlIGdsb2JhbCB2YXJzXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGZhY3RvcnkoalF1ZXJ5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmFjdG9yeSgpO1xuXHRcdH1cblx0fVxufSkoZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cdFxuXHR2YXIgdGFnMmF0dHIgPSB7XG5cdFx0XHRhICAgICAgIDogJ2hyZWYnLFxuXHRcdFx0aW1nICAgICA6ICdzcmMnLFxuXHRcdFx0Zm9ybSAgICA6ICdhY3Rpb24nLFxuXHRcdFx0YmFzZSAgICA6ICdocmVmJyxcblx0XHRcdHNjcmlwdCAgOiAnc3JjJyxcblx0XHRcdGlmcmFtZSAgOiAnc3JjJyxcblx0XHRcdGxpbmsgICAgOiAnaHJlZidcblx0XHR9LFxuXHRcdFxuXHRcdGtleSA9IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2ZyYWdtZW50J10sIC8vIGtleXMgYXZhaWxhYmxlIHRvIHF1ZXJ5XG5cdFx0XG5cdFx0YWxpYXNlcyA9IHsgJ2FuY2hvcicgOiAnZnJhZ21lbnQnIH0sIC8vIGFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG5cdFx0XG5cdFx0cGFyc2VyID0ge1xuXHRcdFx0c3RyaWN0IDogL14oPzooW146XFwvPyNdKyk6KT8oPzpcXC9cXC8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLCAgLy9sZXNzIGludHVpdGl2ZSwgbW9yZSBhY2N1cmF0ZSB0byB0aGUgc3BlY3Ncblx0XHRcdGxvb3NlIDogIC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvIC8vIG1vcmUgaW50dWl0aXZlLCBmYWlscyBvbiByZWxhdGl2ZSBwYXRocyBhbmQgZGV2aWF0ZXMgZnJvbSBzcGVjc1xuXHRcdH0sXG5cdFx0XG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdFxuXHRcdGlzaW50ID0gL15bMC05XSskLztcblx0XG5cdGZ1bmN0aW9uIHBhcnNlVXJpKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0dmFyIHN0ciA9IGRlY29kZVVSSSggdXJsICksXG5cdFx0cmVzICAgPSBwYXJzZXJbIHN0cmljdE1vZGUgfHwgZmFsc2UgPyAnc3RyaWN0JyA6ICdsb29zZScgXS5leGVjKCBzdHIgKSxcblx0XHR1cmkgPSB7IGF0dHIgOiB7fSwgcGFyYW0gOiB7fSwgc2VnIDoge30gfSxcblx0XHRpICAgPSAxNDtcblx0XHRcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHVyaS5hdHRyWyBrZXlbaV0gXSA9IHJlc1tpXSB8fCAnJztcblx0XHR9XG5cdFx0XG5cdFx0Ly8gYnVpbGQgcXVlcnkgYW5kIGZyYWdtZW50IHBhcmFtZXRlcnNcdFx0XG5cdFx0dXJpLnBhcmFtWydxdWVyeSddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ3F1ZXJ5J10pO1xuXHRcdHVyaS5wYXJhbVsnZnJhZ21lbnQnXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydmcmFnbWVudCddKTtcblx0XHRcblx0XHQvLyBzcGxpdCBwYXRoIGFuZCBmcmFnZW1lbnQgaW50byBzZWdtZW50c1x0XHRcblx0XHR1cmkuc2VnWydwYXRoJ10gPSB1cmkuYXR0ci5wYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7ICAgICBcblx0XHR1cmkuc2VnWydmcmFnbWVudCddID0gdXJpLmF0dHIuZnJhZ21lbnQucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTtcblx0XHRcblx0XHQvLyBjb21waWxlIGEgJ2Jhc2UnIGRvbWFpbiBhdHRyaWJ1dGUgICAgICAgIFxuXHRcdHVyaS5hdHRyWydiYXNlJ10gPSB1cmkuYXR0ci5ob3N0ID8gKHVyaS5hdHRyLnByb3RvY29sID8gIHVyaS5hdHRyLnByb3RvY29sKyc6Ly8nK3VyaS5hdHRyLmhvc3QgOiB1cmkuYXR0ci5ob3N0KSArICh1cmkuYXR0ci5wb3J0ID8gJzonK3VyaS5hdHRyLnBvcnQgOiAnJykgOiAnJzsgICAgICBcblx0XHQgIFxuXHRcdHJldHVybiB1cmk7XG5cdH07XG5cdFxuXHRmdW5jdGlvbiBnZXRBdHRyTmFtZSggZWxtICkge1xuXHRcdHZhciB0biA9IGVsbS50YWdOYW1lO1xuXHRcdGlmICggdHlwZW9mIHRuICE9PSAndW5kZWZpbmVkJyApIHJldHVybiB0YWcyYXR0clt0bi50b0xvd2VyQ2FzZSgpXTtcblx0XHRyZXR1cm4gdG47XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHByb21vdGUocGFyZW50LCBrZXkpIHtcblx0XHRpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuXHRcdHZhciB0ID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBwYXJlbnRba2V5XSkgdFtpXSA9IHBhcmVudFtrZXldW2ldO1xuXHRcdHBhcmVudFtrZXldID0gdDtcblx0XHRyZXR1cm4gdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdGlmICghcGFydCkge1xuXHRcdFx0aWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldLnB1c2godmFsKTtcblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG5cdFx0XHRpZiAoJ10nID09IHBhcnQpIHtcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRcdGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuXHRcdFx0XHRcdG9ialtrZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh+cGFydC5pbmRleE9mKCddJykpIHtcblx0XHRcdFx0cGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0XHQvLyBrZXlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHRpZiAofmtleS5pbmRleE9mKCddJykpIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0bGFzdCA9IGxlbiAtIDE7XG5cdFx0XHRwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG5cdFx0XHRcdHZhciB0ID0ge307XG5cdFx0XHRcdGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcblx0XHRcdFx0cGFyZW50LmJhc2UgPSB0O1xuXHRcdFx0fVxuXHRcdFx0c2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcblx0XHRyZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KC8mfDsvKSwgZnVuY3Rpb24ocmV0LCBwYWlyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYWlyID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdC8vIGlnbm9yZVxuXHRcdFx0fVxuXHRcdFx0dmFyIGVxbCA9IHBhaXIuaW5kZXhPZignPScpLFxuXHRcdFx0XHRicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpLFxuXHRcdFx0XHRrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpLFxuXHRcdFx0XHR2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKSxcblx0XHRcdFx0dmFsID0gdmFsLnN1YnN0cih2YWwuaW5kZXhPZignPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cblx0XHRcdGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuXG5cdFx0XHRyZXR1cm4gbWVyZ2UocmV0LCBrZXksIHZhbCk7XG5cdFx0fSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuXHRcdHZhciB2ID0gb2JqW2tleV07XG5cdFx0aWYgKHVuZGVmaW5lZCA9PT0gdikge1xuXHRcdFx0b2JqW2tleV0gPSB2YWw7XG5cdFx0fSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG5cdFx0XHR2LnB1c2godmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2JqW2tleV0gPSBbdiwgdmFsXTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuXHRcdHZhciBsZW4gPSBzdHIubGVuZ3RoLFxuXHRcdFx0IGJyYWNlLCBjO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0XHRcdGMgPSBzdHJbaV07XG5cdFx0XHRpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG5cdFx0XHRpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcblx0XHRcdGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gcmVkdWNlKG9iaiwgYWNjdW11bGF0b3Ipe1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGwgPSBvYmoubGVuZ3RoID4+IDAsXG5cdFx0XHRjdXJyID0gYXJndW1lbnRzWzJdO1xuXHRcdHdoaWxlIChpIDwgbCkge1xuXHRcdFx0aWYgKGkgaW4gb2JqKSBjdXJyID0gYWNjdW11bGF0b3IuY2FsbCh1bmRlZmluZWQsIGN1cnIsIG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdCsraTtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGlzQXJyYXkodkFyZykge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodkFyZykgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0fVxuXHRcblx0ZnVuY3Rpb24ga2V5cyhvYmopIHtcblx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdGZvciAoIHByb3AgaW4gb2JqICkge1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgKSBrZXlzLnB1c2gocHJvcCk7XG5cdFx0fVxuXHRcdHJldHVybiBrZXlzO1xuXHR9XG5cdFx0XG5cdGZ1bmN0aW9uIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdXJsID09PSB0cnVlICkge1xuXHRcdFx0c3RyaWN0TW9kZSA9IHRydWU7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHN0cmljdE1vZGUgPSBzdHJpY3RNb2RlIHx8IGZhbHNlO1xuXHRcdHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24udG9TdHJpbmcoKTtcblx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdFxuXHRcdFx0ZGF0YSA6IHBhcnNlVXJpKHVybCwgc3RyaWN0TW9kZSksXG5cdFx0XHRcblx0XHRcdC8vIGdldCB2YXJpb3VzIGF0dHJpYnV0ZXMgZnJvbSB0aGUgVVJJXG5cdFx0XHRhdHRyIDogZnVuY3Rpb24oIGF0dHIgKSB7XG5cdFx0XHRcdGF0dHIgPSBhbGlhc2VzW2F0dHJdIHx8IGF0dHI7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEuYXR0clthdHRyXSA6IHRoaXMuZGF0YS5hdHRyO1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG5cdFx0XHRwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0ucXVlcnlbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHBhcmFtZXRlcnNcblx0XHRcdGZwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnRbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHBhdGggc2VnbWVudHNcblx0XHRcdHNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcucGF0aC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoW3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHNlZ21lbnRzXG5cdFx0XHRmc2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQ7ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5mcmFnbWVudC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0ICAgIFx0XG5cdFx0fTtcblx0XG5cdH07XG5cdFxuXHRpZiAoIHR5cGVvZiAkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcblx0XHQkLmZuLnVybCA9IGZ1bmN0aW9uKCBzdHJpY3RNb2RlICkge1xuXHRcdFx0dmFyIHVybCA9ICcnO1xuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0dXJsID0gJCh0aGlzKS5hdHRyKCBnZXRBdHRyTmFtZSh0aGlzWzBdKSApIHx8ICcnO1xuXHRcdFx0fSAgICBcblx0XHRcdHJldHVybiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKTtcblx0XHR9O1xuXHRcdFxuXHRcdCQudXJsID0gcHVybDtcblx0XHRcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cucHVybCA9IHB1cmw7XG5cdH1cblxufSk7XG5cbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAvLyB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIC8vIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgLy8gSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgLy8gICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgLy8gICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgLy8gICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAvLyAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gIC8vICAgICAgIH0sIDUwKTtcbiAgLy8gICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gIC8vICAgICAgIH0sIDUwMCk7XG5cbiAgLy8gICAgIH1cbiAgLy8gfVxuXG4gIEhULnJlbmV3X2F1dGggPSBmdW5jdGlvbihlbnRpdHlJRCwgc291cmNlPSdpbWFnZScpIHtcbiAgICBpZiAoIEhULl9fcmVuZXdpbmcgKSB7IHJldHVybiA7IH1cbiAgICBIVC5fX3JlbmV3aW5nID0gdHJ1ZTtcbiAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgIHZhciByZWF1dGhfdXJsID0gYGh0dHBzOi8vJHtIVC5zZXJ2aWNlX2RvbWFpbn0vU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9JHtlbnRpdHlJRH0mdGFyZ2V0PSR7ZW5jb2RlVVJJQ29tcG9uZW50KHdpbmRvdy5sb2NhdGlvbi5ocmVmKX1gO1xuICAgICAgdmFyIHJldHZhbCA9IHdpbmRvdy5jb25maXJtKGBXZSdyZSBoYXZpbmcgYSBwcm9ibGVtIHdpdGggeW91ciBzZXNzaW9uOyBzZWxlY3QgT0sgdG8gbG9nIGluIGFnYWluLmApO1xuICAgICAgaWYgKCByZXR2YWwgKSB7XG4gICAgICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gcmVhdXRoX3VybDtcbiAgICAgIH1cbiAgICB9LCAxMDApO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzID0gSFQuYW5hbHl0aWNzIHx8IHt9O1xuICBIVC5hbmFseXRpY3MubG9nQWN0aW9uID0gZnVuY3Rpb24oaHJlZiwgdHJpZ2dlcikge1xuICAgIGlmICggaHJlZiA9PT0gdW5kZWZpbmVkICkgeyBocmVmID0gbG9jYXRpb24uaHJlZiA7IH1cbiAgICB2YXIgZGVsaW0gPSBocmVmLmluZGV4T2YoJzsnKSA+IC0xID8gJzsnIDogJyYnO1xuICAgIGlmICggdHJpZ2dlciA9PSBudWxsICkgeyB0cmlnZ2VyID0gJy0nOyB9XG4gICAgaHJlZiArPSBkZWxpbSArICdhPScgKyB0cmlnZ2VyO1xuICAgIC8vICQuZ2V0KGhyZWYpO1xuICAgICQuYWpheChocmVmLCBcbiAgICB7XG4gICAgICBjb21wbGV0ZTogZnVuY3Rpb24oeGhyLCBzdGF0dXMpIHtcbiAgICAgICAgdmFyIGVudGl0eUlEID0geGhyLmdldFJlc3BvbnNlSGVhZGVyKCd4LWhhdGhpdHJ1c3QtcmVuZXcnKTtcbiAgICAgICAgaWYgKCBlbnRpdHlJRCApIHtcbiAgICAgICAgICBIVC5yZW5ld19hdXRoKGVudGl0eUlELCAnbG9nQWN0aW9uJyk7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9KVxuICB9XG5cblxuICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnYVtkYXRhLXRyYWNraW5nLWNhdGVnb3J5PVwib3V0TGlua3NcIl0nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIHZhciB0cmlnZ2VyID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1hY3Rpb24nKTtcbiAgICAvLyB2YXIgbGFiZWwgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWxhYmVsJyk7XG4gICAgLy8gaWYgKCBsYWJlbCApIHsgdHJpZ2dlciArPSAnOicgKyBsYWJlbDsgfVxuICAgIHZhciB0cmlnZ2VyID0gJ291dCcgKyAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICBIVC5hbmFseXRpY3MubG9nQWN0aW9uKHVuZGVmaW5lZCwgdHJpZ2dlcik7XG4gIH0pXG5cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIHZhciBNT05USFMgPSBbJ0phbnVhcnknLCAnRmVicnVhcnknLCAnTWFyY2gnLCAnQXByaWwnLCAnTWF5JywgJ0p1bmUnLCAnSnVseScsXG4gICAgJ0F1Z3VzdCcsICdTZXB0ZW1iZXInLCAnT2N0b2JlcicsICdOb3ZlbWJlcicsICdEZWNlbWJlciddO1xuXG4gIHZhciAkZW1lcmdlbmN5X2FjY2VzcyA9ICQoXCIjYWNjZXNzLWVtZXJnZW5jeS1hY2Nlc3NcIik7XG5cbiAgdmFyIGRlbHRhID0gNSAqIDYwICogMTAwMDtcbiAgdmFyIGxhc3Rfc2Vjb25kcztcbiAgdmFyIHRvZ2dsZV9yZW5ld19saW5rID0gZnVuY3Rpb24oZGF0ZSkge1xuICAgIHZhciBub3cgPSBEYXRlLm5vdygpO1xuICAgIGlmICggbm93ID49IGRhdGUuZ2V0VGltZSgpICkge1xuICAgICAgdmFyICRsaW5rID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcImFbZGlzYWJsZWRdXCIpO1xuICAgICAgJGxpbmsuYXR0cihcImRpc2FibGVkXCIsIG51bGwpO1xuICAgIH1cbiAgfVxuXG4gIHZhciBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wID0gZnVuY3Rpb24oKSB7XG4gICAgaWYgKCAhIEhUIHx8ICEgSFQucGFyYW1zIHx8ICEgSFQucGFyYW1zLmlkICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIGRhdGEgPSAkLmNvb2tpZSgnSFRleHBpcmF0aW9uJywgdW5kZWZpbmVkLCB7IGpzb246IHRydWUgfSk7XG4gICAgaWYgKCAhIGRhdGEgKSB7IHJldHVybiA7IH1cbiAgICB2YXIgc2Vjb25kcyA9IGRhdGFbSFQucGFyYW1zLmlkXTtcbiAgICAvLyBjb25zb2xlLmxvZyhcIkFIT1kgT0JTRVJWRVwiLCBzZWNvbmRzLCBsYXN0X3NlY29uZHMpO1xuICAgIGlmICggc2Vjb25kcyA9PSAtMSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwIGFcIikuY2xvbmUoKTtcbiAgICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwXCIpLnRleHQoXCJZb3VyIGFjY2VzcyBoYXMgZXhwaXJlZCBhbmQgY2Fubm90IGJlIHJlbmV3ZWQuIFJlbG9hZCB0aGUgcGFnZSBvciB0cnkgYWdhaW4gbGF0ZXIuIEFjY2VzcyBoYXMgYmVlbiBwcm92aWRlZCB0aHJvdWdoIHRoZSBcIik7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS5hcHBlbmQoJGxpbmspO1xuICAgICAgdmFyICRhY3Rpb24gPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmFsZXJ0LS1lbWVyZ2VuY3ktYWNjZXNzLS1vcHRpb25zIGFcIik7XG4gICAgICAkYWN0aW9uLmF0dHIoJ2hyZWYnLCB3aW5kb3cubG9jYXRpb24uaHJlZik7XG4gICAgICAkYWN0aW9uLnRleHQoJ1JlbG9hZCcpO1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBpZiAoIHNlY29uZHMgPiBsYXN0X3NlY29uZHMgKSB7XG4gICAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAgIGxhc3Rfc2Vjb25kcyA9IHNlY29uZHM7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgIH1cbiAgfVxuXG4gIHZhciB0aW1lMm1lc3NhZ2UgPSBmdW5jdGlvbihzZWNvbmRzKSB7XG4gICAgdmFyIGRhdGUgPSBuZXcgRGF0ZShzZWNvbmRzICogMTAwMCk7XG4gICAgdmFyIGhvdXJzID0gZGF0ZS5nZXRIb3VycygpO1xuICAgIHZhciBhbXBtID0gJ0FNJztcbiAgICBpZiAoIGhvdXJzID4gMTIgKSB7IGhvdXJzIC09IDEyOyBhbXBtID0gJ1BNJzsgfVxuICAgIGlmICggaG91cnMgPT0gMTIgKXsgYW1wbSA9ICdQTSc7IH1cbiAgICB2YXIgbWludXRlcyA9IGRhdGUuZ2V0TWludXRlcygpO1xuICAgIGlmICggbWludXRlcyA8IDEwICkgeyBtaW51dGVzID0gYDAke21pbnV0ZXN9YDsgfVxuICAgIHZhciBtZXNzYWdlID0gYCR7aG91cnN9OiR7bWludXRlc30ke2FtcG19ICR7TU9OVEhTW2RhdGUuZ2V0TW9udGgoKV19ICR7ZGF0ZS5nZXREYXRlKCl9YDtcbiAgICByZXR1cm4gbWVzc2FnZTtcbiAgfVxuXG4gIGlmICggJGVtZXJnZW5jeV9hY2Nlc3MubGVuZ3RoICkge1xuICAgIHZhciBleHBpcmF0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlcycpO1xuICAgIHZhciBzZWNvbmRzID0gcGFyc2VJbnQoJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzRXhwaXJlc1NlY29uZHMnKSwgMTApO1xuICAgIHZhciBncmFudGVkID0gJGVtZXJnZW5jeV9hY2Nlc3MuZGF0YSgnYWNjZXNzR3JhbnRlZCcpO1xuXG4gICAgdmFyIG5vdyA9IERhdGUubm93KCkgLyAxMDAwO1xuICAgIHZhciBtZXNzYWdlID0gdGltZTJtZXNzYWdlKHNlY29uZHMpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCIuZXhwaXJlcy1kaXNwbGF5XCIpLnRleHQobWVzc2FnZSk7XG4gICAgJGVtZXJnZW5jeV9hY2Nlc3MuZ2V0KDApLmRhdGFzZXQuaW5pdGlhbGl6ZWQgPSAndHJ1ZSdcblxuICAgIGlmICggZ3JhbnRlZCApIHtcbiAgICAgIC8vIHNldCB1cCBhIHdhdGNoIGZvciB0aGUgZXhwaXJhdGlvbiB0aW1lXG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vIHRvZ2dsZV9yZW5ld19saW5rKGRhdGUpO1xuICAgICAgICBvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wKCk7XG4gICAgICB9LCA1MDApO1xuICAgIH1cbiAgfVxuXG4gIGlmICgkKCcjYWNjZXNzQmFubmVySUQnKS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3VwcHJlc3MgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ3N1cGFjY2JhbicpO1xuICAgICAgaWYgKHN1cHByZXNzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRlYnVnID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdodGRldicpO1xuICAgICAgdmFyIGlkaGFzaCA9ICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCB1bmRlZmluZWQsIHtqc29uIDogdHJ1ZX0pO1xuICAgICAgdmFyIHVybCA9ICQudXJsKCk7IC8vIHBhcnNlIHRoZSBjdXJyZW50IHBhZ2UgVVJMXG4gICAgICB2YXIgY3VycmlkID0gdXJsLnBhcmFtKCdpZCcpO1xuICAgICAgaWYgKGlkaGFzaCA9PSBudWxsKSB7XG4gICAgICAgICAgaWRoYXNoID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGlkIGluIGlkaGFzaCkge1xuICAgICAgICAgIGlmIChpZGhhc2guaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoaWRzLmluZGV4T2YoY3VycmlkKSA8IDApIHx8IGRlYnVnKSB7XG4gICAgICAgICAgaWRoYXNoW2N1cnJpZF0gPSAxO1xuICAgICAgICAgIC8vIHNlc3Npb24gY29va2llXG4gICAgICAgICAgJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIGlkaGFzaCwgeyBqc29uIDogdHJ1ZSwgcGF0aDogJy8nLCBkb21haW46ICcuaGF0aGl0cnVzdC5vcmcnIH0pO1xuXG4gICAgICAgICAgZnVuY3Rpb24gc2hvd0FsZXJ0KCkge1xuICAgICAgICAgICAgICB2YXIgaHRtbCA9ICQoJyNhY2Nlc3NCYW5uZXJJRCcpLmh0bWwoKTtcbiAgICAgICAgICAgICAgdmFyICRhbGVydCA9IGJvb3Rib3guZGlhbG9nKGh0bWwsIFt7IGxhYmVsOiBcIk9LXCIsIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIgfV0sIHsgaGVhZGVyIDogJ1NwZWNpYWwgYWNjZXNzJywgcm9sZTogJ2FsZXJ0ZGlhbG9nJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoc2hvd0FsZXJ0LCAzMDAwLCB0cnVlKTtcbiAgICAgIH1cbiAgfVxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9ICdfX05FV19fJzsgLy8gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga3YgPSB0bXBbaV0uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgcmV0dmFsW2t2WzBdXSA9IGt2WzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKGFyZ3MpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHsgY3JlYXRpbmcgOiBmYWxzZSwgbGFiZWwgOiBcIlNhdmUgQ2hhbmdlc1wiIH0sIGFyZ3MpO1xuXG4gICAgICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICAgICAgICAgJzxmb3JtIGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCIgYWN0aW9uPVwibWJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWNuXCI+Q29sbGVjdGlvbiBOYW1lPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBtYXhsZW5ndGg9XCIxMDBcIiBuYW1lPVwiY25cIiBpZD1cImVkaXQtY25cIiB2YWx1ZT1cIlwiIHBsYWNlaG9sZGVyPVwiWW91ciBjb2xsZWN0aW9uIG5hbWVcIiByZXF1aXJlZCAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1jbi1jb3VudFwiPjEwMDwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWRlc2NcIj5EZXNjcmlwdGlvbjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgaWQ9XCJlZGl0LWRlc2NcIiBuYW1lPVwiZGVzY1wiIHJvd3M9XCI0XCIgbWF4bGVuZ3RoPVwiMjU1XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIHBsYWNlaG9sZGVyPVwiQWRkIHlvdXIgY29sbGVjdGlvbiBkZXNjcmlwdGlvbi5cIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1kZXNjLWNvdW50XCI+MjU1PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiPklzIHRoaXMgY29sbGVjdGlvbiA8c3Ryb25nPlB1YmxpYzwvc3Ryb25nPiBvciA8c3Ryb25nPlByaXZhdGU8L3N0cm9uZz4/PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTBcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJpdmF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTFcIiB2YWx1ZT1cIjFcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0xXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1B1YmxpYyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZm9ybT4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmNuICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwob3B0aW9ucy5jbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuZGVzYyApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwob3B0aW9ucy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5zaHJkICE9IG51bGwgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9XCIgKyBvcHRpb25zLnNocmQgKyAnXScpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICggISBIVC5sb2dpbl9zdGF0dXMubG9nZ2VkX2luICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTBdXCIpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvXCI+PHN0cm9uZz5UaGlzIGNvbGxlY3Rpb24gd2lsbCBiZSB0ZW1wb3Jhcnk8L3N0cm9uZz4uIExvZyBpbiB0byBjcmVhdGUgcGVybWFuZW50IGFuZCBwdWJsaWMgY29sbGVjdGlvbnMuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPGxhYmVsPiB0aGF0IHdyYXBzIHRoZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0xXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwibGFiZWxbZm9yPSdlZGl0LXNocmQtMSddXCIpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLiRoaWRkZW4gKSB7XG4gICAgICAgICAgICBvcHRpb25zLiRoaWRkZW4uY2xvbmUoKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2MnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYyk7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYScgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5paWQgKSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0naWlkJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmlpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJGJsb2NrLmdldCgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGZvcm0uY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNuID0gJC50cmltKCRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9ICQudHJpbSgkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBjbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvclwiPllvdSBtdXN0IGVudGVyIGEgY29sbGVjdGlvbiBuYW1lLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYSA6ICdhZGRpdHNuYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbiA6IGNuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYyA6IGRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaHJkIDogJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdOmNoZWNrZWRcIikudmFsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgICRkaWFsb2cuZmluZChcImlucHV0W3R5cGU9dGV4dF0sdGV4dGFyZWFcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJGNvdW50ID0gJChcIiNcIiArICR0aGlzLmF0dHIoJ2lkJykgKyBcIi1jb3VudFwiKTtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9ICR0aGlzLmF0dHIoXCJtYXhsZW5ndGhcIik7XG5cbiAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcblxuICAgICAgICAgICAgJHRoaXMuYmluZCgna2V5dXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRfcG9zdChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgeyBwYWdlIDogJ2FqYXgnLCBpZCA6IEhULnBhcmFtcy5pZCB9LCBwYXJhbXMpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogZ2V0X3VybCgpLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyc2VfbGluZShkYXRhKTtcbiAgICAgICAgICAgIGhpZGVfaW5mbygpO1xuICAgICAgICAgICAgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9TVUNDRVNTJyApIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9GQUlMVVJFJyApIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiSXRlbSBjb3VsZCBub3QgYmUgYWRkZWQgYXQgdGhpcyB0aW1lLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciAkdWwgPSAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcFwiKTtcbiAgICAgICAgdmFyIGNvbGxfaHJlZiA9IGdldF91cmwoKSArIFwiP2E9bGlzdGlzO2M9XCIgKyBwYXJhbXMuY29sbF9pZDtcbiAgICAgICAgdmFyICRhID0gJChcIjxhPlwiKS5hdHRyKFwiaHJlZlwiLCBjb2xsX2hyZWYpLnRleHQocGFyYW1zLmNvbGxfbmFtZSk7XG4gICAgICAgICQoXCI8bGk+PC9saT5cIikuYXBwZW5kVG8oJHVsKS5hcHBlbmQoJGEpO1xuICAgICAgICAkdWwucGFyZW50cyhcImRpdlwiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG5cbiAgICAgICAgLy8gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNQVGFkZEl0ZW1CdG4nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcblxuICAvLyBmb3JjZSBDUk1TIHVzZXJzIHRvIGEgZml4ZWQgaW1hZ2Ugc2l6ZVxuICBIVC5mb3JjZV9zaXplID0gMjAwO1xuXG4gIHZhciBpID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2tpbj1jcm1zd29ybGQnKTtcbiAgaWYgKCBpICsgMSAhPSAwICkge1xuICAgICAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVdvcmxkJztcbiAgfVxuXG4gIC8vIGRpc3BsYXkgYmliIGluZm9ybWF0aW9uXG4gIHZhciAkZGl2ID0gJChcIi5iaWJMaW5rc1wiKTtcbiAgdmFyICRwID0gJGRpdi5maW5kKFwicDpmaXJzdFwiKTtcbiAgJHAuZmluZChcInNwYW46ZW1wdHlcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIC8vICQodGhpcykudGV4dCgkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKS5hZGRDbGFzcyhcImJsb2NrZWRcIik7XG4gICAgICB2YXIgZnJhZ21lbnQgPSAnPHNwYW4gY2xhc3M9XCJibG9ja2VkXCI+PHN0cm9uZz57bGFiZWx9Ojwvc3Ryb25nPiB7Y29udGVudH08L3NwYW4+JztcbiAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQucmVwbGFjZSgne2xhYmVsfScsICQodGhpcykuYXR0cigncHJvcGVydHknKS5zdWJzdHIoMykpLnJlcGxhY2UoJ3tjb250ZW50fScsICQodGhpcykuYXR0cihcImNvbnRlbnRcIikpO1xuICAgICAgJHAuYXBwZW5kKGZyYWdtZW50KTtcbiAgfSlcblxuICB2YXIgJGxpbmsgPSAkKFwiI2VtYmVkSHRtbFwiKTtcbiAgY29uc29sZS5sb2coXCJBSE9ZIEVNQkVEXCIsICRsaW5rKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG5cbiAgJGxpbmsgPSAkKFwiYVtkYXRhLXRvZ2dsZT0nUFQgRmluZCBpbiBhIExpYnJhcnknXVwiKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG59KVxuIiwiLy8gZG93bmxvYWRlclxuXG52YXIgSFQgPSBIVCB8fCB7fTtcbnZhciBwaG90b2NvcGllcl9tZXNzYWdlID0gJ1RoZSBjb3B5cmlnaHQgbGF3IG9mIHRoZSBVbml0ZWQgU3RhdGVzIChUaXRsZSAxNywgVS5TLiBDb2RlKSBnb3Zlcm5zIHRoZSBtYWtpbmcgb2YgcmVwcm9kdWN0aW9ucyBvZiBjb3B5cmlnaHRlZCBtYXRlcmlhbC4gVW5kZXIgY2VydGFpbiBjb25kaXRpb25zIHNwZWNpZmllZCBpbiB0aGUgbGF3LCBsaWJyYXJpZXMgYW5kIGFyY2hpdmVzIGFyZSBhdXRob3JpemVkIHRvIGZ1cm5pc2ggYSByZXByb2R1Y3Rpb24uIE9uZSBvZiB0aGVzZSBzcGVjaWZpYyBjb25kaXRpb25zIGlzIHRoYXQgdGhlIHJlcHJvZHVjdGlvbiBpcyBub3QgdG8gYmUg4oCcdXNlZCBmb3IgYW55IHB1cnBvc2Ugb3RoZXIgdGhhbiBwcml2YXRlIHN0dWR5LCBzY2hvbGFyc2hpcCwgb3IgcmVzZWFyY2gu4oCdIElmIGEgdXNlciBtYWtlcyBhIHJlcXVlc3QgZm9yLCBvciBsYXRlciB1c2VzLCBhIHJlcHJvZHVjdGlvbiBmb3IgcHVycG9zZXMgaW4gZXhjZXNzIG9mIOKAnGZhaXIgdXNlLOKAnSB0aGF0IHVzZXIgbWF5IGJlIGxpYWJsZSBmb3IgY29weXJpZ2h0IGluZnJpbmdlbWVudC4nO1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgIH0sXG5cbiAgICBkb3dubG9hZFBkZjogZnVuY3Rpb24oY29uZmlnKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBzZWxmLnNyYyA9IGNvbmZpZy5zcmM7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9IGNvbmZpZy5pdGVtX3RpdGxlO1xuICAgICAgICBzZWxmLiRjb25maWcgPSBjb25maWc7XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGNvbmZpZy5zZWxlY3Rpb24ucGFnZXMubGVuZ3RoO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuXG4gICAgfSxcblxuICAgIHJlcXVlc3REb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcblxuICAgICAgICBpZiAoIHNlbGYuJGNvbmZpZy5zZWxlY3Rpb24ucGFnZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgIGRhdGFbJ3NlcSddID0gc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5zZXE7XG4gICAgICAgIH1cblxuICAgICAgICBzd2l0Y2ggKHNlbGYuJGNvbmZpZy5kb3dubG9hZEZvcm1hdCkge1xuICAgICAgICAgICAgY2FzZSAnaW1hZ2UnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2Zvcm1hdCddID0gJ2ltYWdlL2pwZWcnO1xuICAgICAgICAgICAgICAgIGRhdGFbJ3RhcmdldF9wcGknXSA9IDMwMDtcbiAgICAgICAgICAgICAgICBkYXRhWydidW5kbGVfZm9ybWF0J10gPSAnemlwJztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIGNhc2UgJ3BsYWludGV4dC16aXAnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd6aXAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGxhaW50ZXh0JzpcbiAgICAgICAgICAgICAgICBkYXRhWydidW5kbGVfZm9ybWF0J10gPSAndGV4dCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgIH1cblxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBzZWxmLnNyYy5yZXBsYWNlKC87L2csICcmJykgKyAnJmNhbGxiYWNrPUhULmRvd25sb2FkZXIuc3RhcnREb3dubG9hZE1vbml0b3InLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBTVEFSVFVQIE5PVCBERVRFQ1RFRFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZyApIHsgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTsgfVxuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MjkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcihyZXEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbERvd25sb2FkOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgc3RhcnREb3dubG9hZE1vbml0b3I6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBTFJFQURZIFBPTExJTkdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnBkZi5wcm9ncmVzc191cmwgPSBwcm9ncmVzc191cmw7XG4gICAgICAgIHNlbGYucGRmLmRvd25sb2FkX3VybCA9IGRvd25sb2FkX3VybDtcbiAgICAgICAgc2VsZi5wZGYudG90YWwgPSB0b3RhbDtcblxuICAgICAgICBzZWxmLmlzX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgPSAwO1xuICAgICAgICBzZWxmLmkgPSAwO1xuXG4gICAgICAgIHNlbGYudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgc2VsZi5jaGVja1N0YXR1cygpOyB9LCAyNTAwKTtcbiAgICAgICAgLy8gZG8gaXQgb25jZSB0aGUgZmlyc3QgdGltZVxuICAgICAgICBzZWxmLmNoZWNrU3RhdHVzKCk7XG5cbiAgICB9LFxuXG4gICAgY2hlY2tTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaSArPSAxO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogc2VsZi5wZGYucHJvZ3Jlc3NfdXJsLFxuICAgICAgICAgICAgZGF0YSA6IHsgdHMgOiAobmV3IERhdGUpLmdldFRpbWUoKSB9LFxuICAgICAgICAgICAgY2FjaGUgOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBzZWxmLnVwZGF0ZVByb2dyZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCArPSAxO1xuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzLmRvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciAmJiBzdGF0dXMubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlQcm9jZXNzRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBSUxFRDogXCIsIHJlcSwgXCIvXCIsIHRleHRTdGF0dXMsIFwiL1wiLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDA0ICYmIChzZWxmLmkgPiAyNSB8fCBzZWxmLm51bV9wcm9jZXNzZWQgPiAwKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHVwZGF0ZVByb2dyZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHsgZG9uZSA6IGZhbHNlLCBlcnJvciA6IGZhbHNlIH07XG4gICAgICAgIHZhciBwZXJjZW50O1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gZGF0YS5zdGF0dXM7XG4gICAgICAgIGlmICggY3VycmVudCA9PSAnRU9UJyB8fCBjdXJyZW50ID09ICdET05FJyApIHtcbiAgICAgICAgICAgIHN0YXR1cy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGF0YS5jdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwICogKCBjdXJyZW50IC8gc2VsZi5wZGYudG90YWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi5sYXN0X3BlcmNlbnQgIT0gcGVyY2VudCApIHtcbiAgICAgICAgICAgIHNlbGYubGFzdF9wZXJjZW50ID0gcGVyY2VudDtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgMTAwIHRpbWVzLCB3aGljaCBhbW91bnRzIHRvIH4xMDAgc2Vjb25kc1xuICAgICAgICBpZiAoIHNlbGYubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgc3RhdHVzLmVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5pcyhcIjp2aXNpYmxlXCIpICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5QbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApXG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciBkb3dubG9hZF9rZXkgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01hYyBPUyBYJykgIT0gLTEgPyAnUkVUVVJOJyA6ICdFTlRFUic7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPkFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIDxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+U2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC48L3NwYW4+PC9wPmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBBbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBTZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLmApO1xuXG4gICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuZmluZChcIi5kb25lXCIpLnNob3coKTtcbiAgICAgICAgICAgIHZhciAkZG93bmxvYWRfYnRuID0gc2VsZi4kZGlhbG9nLmZpbmQoJy5kb3dubG9hZC1wZGYnKTtcbiAgICAgICAgICAgIGlmICggISAkZG93bmxvYWRfYnRuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuID0gJCgnPGEgY2xhc3M9XCJkb3dubG9hZC1wZGYgYnRuIGJ0bi1wcmltYXJ5XCIgZG93bmxvYWQ9XCJkb3dubG9hZFwiPkRvd25sb2FkIHtJVEVNX1RJVExFfTwvYT4nLnJlcGxhY2UoJ3tJVEVNX1RJVExFfScsIHNlbGYuaXRlbV90aXRsZSkpLmF0dHIoJ2hyZWYnLCBzZWxmLnBkZi5kb3dubG9hZF91cmwpO1xuICAgICAgICAgICAgICAgIGlmICggJGRvd25sb2FkX2J0bi5nZXQoMCkuZG93bmxvYWQgPT0gdW5kZWZpbmVkICkge1xuICAgICAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmF0dHIoJ3RhcmdldCcsICdfYmxhbmsnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hcHBlbmRUbyhzZWxmLiRkaWFsb2cuZmluZChcIi5tb2RhbF9fZm9vdGVyXCIpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGxpbmsudHJpZ2dlcihcImNsaWNrLmdvb2dsZVwiKTtcblxuICAgICAgICAgICAgICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IFxuICAgICAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnLScsIFxuICAgICAgICAgICAgICAgICAgICAgICAgY2F0ZWdvcnkgOiAnUFQnLCBcbiAgICAgICAgICAgICAgICAgICAgICAgIGFjdGlvbiA6IGBQVCBEb3dubG9hZCAtICR7c2VsZi4kY29uZmlnLmRvd25sb2FkRm9ybWF0LnRvVXBwZXJDYXNlKCl9IC0gJHtzZWxmLiRjb25maWcudHJhY2tpbmdBY3Rpb259YCBcbiAgICAgICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggd2luZG93LmhqICkgeyBoaigndGFnUmVjb3JkaW5nJywgWyBgUFQgRG93bmxvYWQgLSAke3NlbGYuJGNvbmZpZy5kb3dubG9hZEZvcm1hdC50b1VwcGVyQ2FzZSgpfSAtICR7c2VsZi4kY29uZmlnLnRyYWNraW5nQWN0aW9ufWAgXSkgfTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFByZXNzIHJldHVybiB0byBkb3dubG9hZC5gKTtcbiAgICAgICAgICAgIC8vIHN0aWxsIGNvdWxkIGNhbmNlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS50ZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfSAoJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWQpLmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGAke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1c1RleHQ6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYuX2xhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgICAgaWYgKCBzZWxmLl9sYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChzZWxmLl9sYXN0VGltZXIpOyBzZWxmLl9sYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2VsZi5fbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICBzZWxmLl9sYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICB9XG4gICAgfSxcblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbnZhciBkb3dubG9hZEZvcm07XG52YXIgZG93bmxvYWRGb3JtYXRPcHRpb25zO1xudmFyIHJhbmdlT3B0aW9ucztcbnZhciBkb3dubG9hZElkeCA9IDA7XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICBkb3dubG9hZEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjZm9ybS1kb3dubG9hZC1tb2R1bGUnKTtcbiAgICBpZiAoICEgZG93bmxvYWRGb3JtICkgeyByZXR1cm4gOyB9XG5cblxuICAgIEhULmRvd25sb2FkZXIgPSBPYmplY3QuY3JlYXRlKEhULkRvd25sb2FkZXIpLmluaXQoe1xuICAgICAgICBwYXJhbXMgOiBIVC5wYXJhbXNcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci5zdGFydCgpO1xuXG4gICAgLy8gbm9uLWpxdWVyeT9cbiAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXRbbmFtZT1cImRvd25sb2FkX2Zvcm1hdFwiXScpKTtcbiAgICByYW5nZU9wdGlvbnMgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF0nKSk7XG5cbiAgICB2YXIgZG93bmxvYWRTdWJtaXQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignW3R5cGU9XCJzdWJtaXRcIl0nKTtcblxuICAgIHZhciBoYXNGdWxsUGRmQWNjZXNzID0gZG93bmxvYWRGb3JtLmRhdGFzZXQuZnVsbFBkZkFjY2VzcyA9PSAnYWxsb3cnO1xuXG4gICAgdmFyIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zID0gZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICByYW5nZU9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihyYW5nZU9wdGlvbikge1xuICAgICAgICB2YXIgaW5wdXQgPSByYW5nZU9wdGlvbi5xdWVyeVNlbGVjdG9yKCdpbnB1dCcpO1xuICAgICAgICBpbnB1dC5kaXNhYmxlZCA9ICEgcmFuZ2VPcHRpb24ubWF0Y2hlcyhgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldH49XCIke29wdGlvbi52YWx1ZX1cIl1gKTtcbiAgICAgIH0pXG4gICAgICBcbiAgICAgIC8vIGlmICggISBoYXNGdWxsUGRmQWNjZXNzICkge1xuICAgICAgLy8gICB2YXIgY2hlY2tlZCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXQ6Y2hlY2tlZGApO1xuICAgICAgLy8gICBpZiAoICEgY2hlY2tlZCApIHtcbiAgICAgIC8vICAgICAgIC8vIGNoZWNrIHRoZSBmaXJzdCBvbmVcbiAgICAgIC8vICAgICAgIHZhciBpbnB1dCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XVtkYXRhLXZpZXctdGFyZ2V0fj1cIiR7SFQucmVhZGVyLnZpZXcubmFtZX1cIl0gaW5wdXRgKTtcbiAgICAgIC8vICAgICAgIGlucHV0LmNoZWNrZWQgPSB0cnVlO1xuICAgICAgLy8gICB9XG4gICAgICAvLyB9XG5cbiAgICAgIHZhciBjdXJyZW50X3ZpZXcgPSAoIEhULnJlYWRlciAmJiBIVC5yZWFkZXIudmlldyApID8gIEhULnJlYWRlci52aWV3Lm5hbWUgOiAnc2VhcmNoJzsgLy8gcGljayBhIGRlZmF1bHRcbiAgICAgIHZhciBjaGVja2VkID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtjdXJyZW50X3ZpZXd9XCJdIGlucHV0OmNoZWNrZWRgKTtcbiAgICAgIGlmICggISBjaGVja2VkICkge1xuICAgICAgICAgIC8vIGNoZWNrIHRoZSBmaXJzdCBvbmVcbiAgICAgICAgICB2YXIgaW5wdXQgPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcihgW2RhdGEtZG93bmxvYWQtZm9ybWF0LXRhcmdldF1bZGF0YS12aWV3LXRhcmdldH49XCIke2N1cnJlbnRfdmlld31cIl0gaW5wdXRgKTtcbiAgICAgICAgICBpbnB1dC5jaGVja2VkID0gdHJ1ZTtcbiAgICAgIH1cblxuICAgIH1cbiAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIG9wdGlvbi5hZGRFdmVudExpc3RlbmVyKCdjaGFuZ2UnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyh0aGlzKTtcbiAgICAgIH0pXG4gICAgfSlcblxuICAgIHJhbmdlT3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGRpdikge1xuICAgICAgICB2YXIgaW5wdXQgPSBkaXYucXVlcnlTZWxlY3RvcignaW5wdXQnKTtcbiAgICAgICAgaW5wdXQuYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIGRvd25sb2FkRm9ybWF0T3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKGZvcm1hdE9wdGlvbikge1xuICAgICAgICAgICAgICAgIGZvcm1hdE9wdGlvbi5kaXNhYmxlZCA9ICEgKCBkaXYuZGF0YXNldC5kb3dubG9hZEZvcm1hdFRhcmdldC5pbmRleE9mKGZvcm1hdE9wdGlvbi52YWx1ZSkgPiAtMSApO1xuICAgICAgICAgICAgfSlcbiAgICAgICAgfSlcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci51cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgZm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtYXRPcHRpb25zLmZpbmQoaW5wdXQgPT4gaW5wdXQuY2hlY2tlZCk7XG4gICAgICAgIHVwZGF0ZURvd25sb2FkRm9ybWF0UmFuZ2VPcHRpb25zKGZvcm1hdE9wdGlvbik7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCB0byBQREZcbiAgICB2YXIgcGRmRm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtYXRPcHRpb25zLmZpbmQoaW5wdXQgPT4gaW5wdXQudmFsdWUgPT0gJ3BkZicpO1xuICAgIHBkZkZvcm1hdE9wdGlvbi5jaGVja2VkID0gdHJ1ZTtcbiAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyhwZGZGb3JtYXRPcHRpb24pO1xuXG4gICAgdmFyIHR1bm5lbEZvcm0gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCcjdHVubmVsLWRvd25sb2FkLW1vZHVsZScpO1xuXG4gICAgZG93bmxvYWRGb3JtLmFkZEV2ZW50TGlzdGVuZXIoJ3N1Ym1pdCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgIHZhciBmb3JtYXRPcHRpb24gPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cImRvd25sb2FkX2Zvcm1hdFwiXTpjaGVja2VkJyk7XG4gICAgICAgIHZhciByYW5nZU9wdGlvbiA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKCdpbnB1dFtuYW1lPVwicmFuZ2VcIl06Y2hlY2tlZDpub3QoOmRpc2FibGVkKScpO1xuXG4gICAgICAgIHZhciBwcmludGFibGU7XG5cbiAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG5cbiAgICAgICAgaWYgKCAhIHJhbmdlT3B0aW9uICkge1xuICAgICAgICAgICAgLy8gbm8gdmFsaWQgcmFuZ2Ugb3B0aW9uIHdhcyBjaG9zZW5cbiAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGNob29zZSBhIHZhbGlkIHJhbmdlIGZvciB0aGlzIGRvd25sb2FkIGZvcm1hdC5cIik7XG4gICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGFjdGlvbiA9IHR1bm5lbEZvcm0uZGF0YXNldC5hY3Rpb25UZW1wbGF0ZSArICggZm9ybWF0T3B0aW9uLnZhbHVlID09ICdwbGFpbnRleHQtemlwJyA/ICdwbGFpbnRleHQnIDogZm9ybWF0T3B0aW9uLnZhbHVlICk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGlvbiA9IHsgcGFnZXM6IFtdIH07XG4gICAgICAgIGlmICggcmFuZ2VPcHRpb24udmFsdWUgPT0gJ3NlbGVjdGVkLXBhZ2VzJyApIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcyA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5pc1NlbGVjdGlvbiA9IHRydWU7XG4gICAgICAgICAgICBpZiAoIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gZG93bmxvYWQuPC9wPlwiIF07XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBiZSBsaXN0ZWQgaW4gdGhlIGRvd25sb2FkIG1vZHVsZS5cIik7XG5cbiAgICAgICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcblxuICAgICAgICAgICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9IGVsc2UgaWYgKCByYW5nZU9wdGlvbi52YWx1ZS5pbmRleE9mKCdjdXJyZW50LXBhZ2UnKSA+IC0xICkge1xuICAgICAgICAgICAgdmFyIHBhZ2U7XG4gICAgICAgICAgICBzd2l0Y2gocmFuZ2VPcHRpb24udmFsdWUpIHtcbiAgICAgICAgICAgICAgICBjYXNlICdjdXJyZW50LXBhZ2UnOlxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gWyBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oKSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICBjYXNlICdjdXJyZW50LXBhZ2UtdmVyc28nOlxuICAgICAgICAgICAgICAgICAgICBwYWdlID0gWyBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oJ1ZFUlNPJykgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlLXJlY3RvJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCdSRUNUTycpIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCAhIHBhZ2UgKSB7XG4gICAgICAgICAgICAgICAgLy8gcHJvYmFibHkgaW1wb3NzaWJsZT9cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcyA9IFsgcGFnZSBdO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID4gMCApIHtcbiAgICAgICAgICAgIHNlbGVjdGlvbi5zZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yID9cbiAgICAgICAgICAgICAgICAgSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHNlbGVjdGlvbi5wYWdlcykgOiBcbiAgICAgICAgICAgICAgICAgc2VsZWN0aW9uLnBhZ2VzO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCByYW5nZU9wdGlvbi5kYXRhc2V0LmlzUGFydGlhbCA9PSAndHJ1ZScgJiYgc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA8PSAxMCApIHtcblxuICAgICAgICAgICAgLy8gZGVsZXRlIGFueSBleGlzdGluZyBpbnB1dHNcbiAgICAgICAgICAgIHR1bm5lbEZvcm0ucXVlcnlTZWxlY3RvckFsbCgnaW5wdXQ6bm90KFtkYXRhLWZpeGVkXSknKS5mb3JFYWNoKGZ1bmN0aW9uKGlucHV0KSB7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5yZW1vdmVDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBpZiAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAnaW1hZ2UnICkge1xuICAgICAgICAgICAgICAgIHZhciBzaXplX2F0dHIgPSBcInRhcmdldF9wcGlcIjtcbiAgICAgICAgICAgICAgICB2YXIgaW1hZ2VfZm9ybWF0X2F0dHIgPSAnZm9ybWF0JztcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZV92YWx1ZSA9IFwiMzAwXCI7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID09IDEgKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIHNsaWdodCBkaWZmZXJlbmNlXG4gICAgICAgICAgICAgICAgICAgIGFjdGlvbiA9ICcvY2dpL2ltZ3Nydi9pbWFnZSc7XG4gICAgICAgICAgICAgICAgICAgIHNpemVfYXR0ciA9IFwic2l6ZVwiO1xuICAgICAgICAgICAgICAgICAgICBzaXplX3ZhbHVlID0gXCJwcGk6MzAwXCI7XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgc2l6ZV9hdHRyKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBzaXplX3ZhbHVlKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIGltYWdlX2Zvcm1hdF9hdHRyKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCAnaW1hZ2UvanBlZycpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggZm9ybWF0T3B0aW9uLnZhbHVlID09ICdwbGFpbnRleHQtemlwJyApIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCAnYnVuZGxlX2Zvcm1hdCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInZhbHVlXCIsIFwiemlwXCIpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VxLmZvckVhY2goZnVuY3Rpb24ocmFuZ2UpIHtcbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBcInNlcVwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCByYW5nZSk7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICB0dW5uZWxGb3JtLmFjdGlvbiA9IGFjdGlvbjtcbiAgICAgICAgICAgIC8vIEhULmRpc2FibGVVbmxvYWRUaW1lb3V0ID0gdHJ1ZTtcblxuICAgICAgICAgICAgLy8gcmVtb3ZlIG9sZCBpZnJhbWVzXG4gICAgICAgICAgICBkb2N1bWVudC5xdWVyeVNlbGVjdG9yQWxsKCdpZnJhbWUuZG93bmxvYWQtbW9kdWxlJykuZm9yRWFjaChmdW5jdGlvbihpZnJhbWUpIHtcbiAgICAgICAgICAgICAgICBkb2N1bWVudC5ib2R5LnJlbW92ZUNoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICB9KVxuXG4gICAgICAgICAgICBkb3dubG9hZElkeCArPSAxO1xuICAgICAgICAgICAgdmFyIHRyYWNrZXIgPSBgRCR7ZG93bmxvYWRJZHh9OmA7XG4gICAgICAgICAgICB2YXIgdHJhY2tlcl9pbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgndHlwZScsICdoaWRkZW4nKTtcbiAgICAgICAgICAgIHRyYWNrZXJfaW5wdXQuc2V0QXR0cmlidXRlKCduYW1lJywgJ3RyYWNrZXInKTtcbiAgICAgICAgICAgIHRyYWNrZXJfaW5wdXQuc2V0QXR0cmlidXRlKCd2YWx1ZScsIHRyYWNrZXIpO1xuICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZCh0cmFja2VyX2lucHV0KTtcbiAgICAgICAgICAgIHZhciBpZnJhbWUgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpZnJhbWUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zZXRBdHRyaWJ1dGUoJ25hbWUnLCBgZG93bmxvYWQtbW9kdWxlLSR7ZG93bmxvYWRJZHh9YCk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCdjbGFzcycsICdkb3dubG9hZC1tb2R1bGUnKTtcbiAgICAgICAgICAgIGlmcmFtZS5zdHlsZS5vcGFjaXR5ID0gMDtcbiAgICAgICAgICAgIGRvY3VtZW50LmJvZHkuYXBwZW5kQ2hpbGQoaWZyYW1lKTtcbiAgICAgICAgICAgIHR1bm5lbEZvcm0uc2V0QXR0cmlidXRlKCd0YXJnZXQnLCBpZnJhbWUuZ2V0QXR0cmlidXRlKCduYW1lJykpO1xuXG4gICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5kaXNhYmxlZCA9IHRydWU7XG4gICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5jbGFzc0xpc3QuYWRkKCdidG4tbG9hZGluZycpO1xuXG4gICAgICAgICAgICB2YXIgdHJhY2tlckludGVydmFsID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgdmFyIHZhbHVlID0gJC5jb29raWUoJ3RyYWNrZXInKSB8fCAnJztcbiAgICAgICAgICAgICAgICBpZiAoIEhULmlzX2RldiApIHtcbiAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCItLT9cIiwgdHJhY2tlciwgdmFsdWUpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIHZhbHVlLmluZGV4T2YodHJhY2tlcikgPiAtMSApIHtcbiAgICAgICAgICAgICAgICAgICAgJC5yZW1vdmVDb29raWUoJ3RyYWNrZXInLCB7IHBhdGg6ICcvJ30pO1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRyYWNrZXJJbnRlcnZhbCk7XG4gICAgICAgICAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmNsYXNzTGlzdC5yZW1vdmUoJ2J0bi1sb2FkaW5nJyk7XG4gICAgICAgICAgICAgICAgICAgIGRvd25sb2FkU3VibWl0LmRpc2FibGVkID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIEhULmRpc2FibGVVbmxvYWRUaW1lb3V0ID0gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSwgMTAwKTtcblxuXG4gICAgICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IFxuICAgICAgICAgICAgICAgIGxhYmVsIDogJy0nLCBcbiAgICAgICAgICAgICAgICBjYXRlZ29yeSA6ICdQVCcsIFxuICAgICAgICAgICAgICAgIGFjdGlvbiA6IGBQVCBEb3dubG9hZCAtICR7Zm9ybWF0T3B0aW9uLnZhbHVlLnRvVXBwZXJDYXNlKCl9IC0gJHtyYW5nZU9wdGlvbi52YWx1ZX1gIFxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBpZiAoIHdpbmRvdy5oaiApIHsgaGooJ3RhZ1JlY29yZGluZycsIFsgYFBUIERvd25sb2FkIC0gJHtmb3JtYXRPcHRpb24udmFsdWUudG9VcHBlckNhc2UoKX0gLSAke3JhbmdlT3B0aW9uLnZhbHVlfWAgXSkgfTtcblxuICAgICAgICAgICAgdHVubmVsRm9ybS5zdWJtaXQoKTtcblxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyIF9mb3JtYXRfdGl0bGVzID0ge307XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLnBkZiA9ICdQREYnO1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5lcHViID0gJ0VQVUInO1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5wbGFpbnRleHQgPSAnVGV4dCAoLnR4dCknO1xuICAgICAgICBfZm9ybWF0X3RpdGxlc1sncGxhaW50ZXh0LXppcCddID0gJ1RleHQgKC56aXApJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMuaW1hZ2UgPSAnSW1hZ2UgKEpQRUcpJztcblxuICAgICAgICAvLyBpbnZva2UgdGhlIGRvd25sb2FkZXJcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih7XG4gICAgICAgICAgICBzcmM6IGFjdGlvbiArICc/aWQ9JyArIEhULnBhcmFtcy5pZCxcbiAgICAgICAgICAgIGl0ZW1fdGl0bGU6IF9mb3JtYXRfdGl0bGVzW2Zvcm1hdE9wdGlvbi52YWx1ZV0sXG4gICAgICAgICAgICBzZWxlY3Rpb246IHNlbGVjdGlvbixcbiAgICAgICAgICAgIGRvd25sb2FkRm9ybWF0OiBmb3JtYXRPcHRpb24udmFsdWUsXG4gICAgICAgICAgICB0cmFja2luZ0FjdGlvbjogcmFuZ2VPcHRpb24udmFsdWVcbiAgICAgICAgfSk7XG5cbiAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pXG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dDtcbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rICcgK1xuICAgICAgICAgICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAgICAgICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48aSBjbGFzcz1cImljb21vb24gaWNvbW9vbi1oZWxwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+SGVscDogRW1iZWRkaW5nIEhhdGhpVHJ1c3QgQm9va3M8L3NwYW4+PC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgLy8gJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjZW1iZWRIdG1sJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHJldHVybjtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuICBIVCA9IEhUIHx8IHt9O1xuXG4gIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuICAgIC8vICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuICAgIC8vIH1cblxuICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuICAgICRuYXZpZ2F0b3IgPSAkKFwiLm5hdmlnYXRvclwiKTtcbiAgICBpZiAoICRuYXZpZ2F0b3IubGVuZ3RoICkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSB0cnVlO1xuICAgICAgJG5hdmlnYXRvci5nZXQoMCkuc3R5bGUuc2V0UHJvcGVydHkoJy0taGVpZ2h0JywgYC0keyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKSAqIDAuOTB9cHhgKTtcbiAgICAgICRuYXZpZ2F0b3IuZ2V0KDApLmRhdGFzZXQub3JpZ2luYWxIZWlnaHQgPSBgeyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKX1weGA7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tbmF2aWdhdG9yLWhlaWdodCcsIGAkeyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKX1weGApO1xuICAgICAgdmFyICRleHBhbmRvID0gJG5hdmlnYXRvci5maW5kKFwiLmFjdGlvbi1leHBhbmRvXCIpO1xuICAgICAgJGV4cGFuZG8ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gISAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApO1xuICAgICAgICB2YXIgbmF2aWdhdG9ySGVpZ2h0ID0gMDtcbiAgICAgICAgaWYgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKSB7XG4gICAgICAgICAgbmF2aWdhdG9ySGVpZ2h0ID0gJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodDtcbiAgICAgICAgfVxuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tbmF2aWdhdG9yLWhlaWdodCcsIG5hdmlnYXRvckhlaWdodCk7XG4gICAgICB9KVxuXG4gICAgICBpZiAoIEhULnBhcmFtcy51aSA9PSAnZW1iZWQnICkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkZXhwYW5kby50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBIVC4kbWVudSA9ICRtZW51O1xuXG4gICAgdmFyICRzaWRlYmFyID0gJChcIiNzaWRlYmFyXCIpO1xuXG4gICAgJHRyaWdnZXIgPSAkc2lkZWJhci5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpO1xuXG4gICAgJChcIiNhY3Rpb24tbW9iaWxlLXRvZ2dsZS1mdWxsc2NyZWVuXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSlcblxuICAgIEhULnV0aWxzID0gSFQudXRpbHMgfHwge307XG5cbiAgICAvLyAkc2lkZWJhci5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcuc2lkZWJhci1jb250YWluZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgLy8gaGlkZSB0aGUgc2lkZWJhclxuICAgICAgdmFyICR0aGlzID0gJChldmVudC50YXJnZXQpO1xuICAgICAgaWYgKCAkdGhpcy5pcyhcImlucHV0W3R5cGU9J3RleHQnXSxzZWxlY3RcIikgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMucGFyZW50cyhcIi5mb3JtLXNlYXJjaC12b2x1bWVcIikubGVuZ3RoICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLnBhcmVudHMoXCIuZm9ybS1kb3dubG9hZC1tb2R1bGVcIikubGVuZ3RoICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLmlzKFwiYnV0dG9uLGFcIikgKSB7XG4gICAgICAgIEhULnRvZ2dsZShmYWxzZSk7XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuICAgIC8vICQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJCh3aW5kb3cpLm9uKFwib3JpZW50YXRpb25jaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuICAgIC8vICAgICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbiAgICAvLyAgICAgfSwgMTAwKTtcbiAgICAvLyB9KVxuICAgIGlmICggSFQgJiYgSFQudXRpbHMgJiYgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UgKSB7XG4gICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIH1cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICd0cnVlJztcbiAgfVxuXG4gIEhULnRvZ2dsZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cbiAgICAvLyAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCIuc2lkZWJhci1jb250YWluZXJcIikuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnNpZGViYXJFeHBhbmRlZCA9IHN0YXRlO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnZpZXcgPSBzdGF0ZSA/ICdvcHRpb25zJyA6ICd2aWV3ZXInO1xuXG4gICAgLy8gdmFyIHhsaW5rX2hyZWY7XG4gICAgLy8gaWYgKCAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT0gJ3RydWUnICkge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtZXhwYW5kZWQnO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1jb2xsYXBzZWQnO1xuICAgIC8vIH1cbiAgICAvLyAkdHJpZ2dlci5maW5kKFwic3ZnIHVzZVwiKS5hdHRyKFwieGxpbms6aHJlZlwiLCB4bGlua19ocmVmKTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoSFQubW9iaWZ5LCAxMDAwKTtcblxuICB2YXIgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGggPSAkKFwiI3NpZGViYXIgLnNpZGViYXItdG9nZ2xlLWJ1dHRvblwiKS5vdXRlckhlaWdodCgpIHx8IDQwO1xuICAgIHZhciB0b3AgPSAoICQoXCJoZWFkZXJcIikuaGVpZ2h0KCkgKyBoICkgKiAxLjA1O1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10b29sYmFyLWhvcml6b250YWwtdG9wJywgdG9wICsgJ3B4Jyk7XG4gIH1cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkpO1xuICB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkoKTtcblxuICAkKFwiaHRtbFwiKS5nZXQoMCkuc2V0QXR0cmlidXRlKCdkYXRhLXNpZGViYXItZXhwYW5kZWQnLCBmYWxzZSk7XG5cbn0pXG4iLCJpZiAodHlwZW9mIE9iamVjdC5hc3NpZ24gIT0gJ2Z1bmN0aW9uJykge1xuICAvLyBNdXN0IGJlIHdyaXRhYmxlOiB0cnVlLCBlbnVtZXJhYmxlOiBmYWxzZSwgY29uZmlndXJhYmxlOiB0cnVlXG4gIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShPYmplY3QsIFwiYXNzaWduXCIsIHtcbiAgICB2YWx1ZTogZnVuY3Rpb24gYXNzaWduKHRhcmdldCwgdmFyQXJncykgeyAvLyAubGVuZ3RoIG9mIGZ1bmN0aW9uIGlzIDJcbiAgICAgICd1c2Ugc3RyaWN0JztcbiAgICAgIGlmICh0YXJnZXQgPT0gbnVsbCkgeyAvLyBUeXBlRXJyb3IgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgdGhyb3cgbmV3IFR5cGVFcnJvcignQ2Fubm90IGNvbnZlcnQgdW5kZWZpbmVkIG9yIG51bGwgdG8gb2JqZWN0Jyk7XG4gICAgICB9XG5cbiAgICAgIHZhciB0byA9IE9iamVjdCh0YXJnZXQpO1xuXG4gICAgICBmb3IgKHZhciBpbmRleCA9IDE7IGluZGV4IDwgYXJndW1lbnRzLmxlbmd0aDsgaW5kZXgrKykge1xuICAgICAgICB2YXIgbmV4dFNvdXJjZSA9IGFyZ3VtZW50c1tpbmRleF07XG5cbiAgICAgICAgaWYgKG5leHRTb3VyY2UgIT0gbnVsbCkgeyAvLyBTa2lwIG92ZXIgaWYgdW5kZWZpbmVkIG9yIG51bGxcbiAgICAgICAgICBmb3IgKHZhciBuZXh0S2V5IGluIG5leHRTb3VyY2UpIHtcbiAgICAgICAgICAgIC8vIEF2b2lkIGJ1Z3Mgd2hlbiBoYXNPd25Qcm9wZXJ0eSBpcyBzaGFkb3dlZFxuICAgICAgICAgICAgaWYgKE9iamVjdC5wcm90b3R5cGUuaGFzT3duUHJvcGVydHkuY2FsbChuZXh0U291cmNlLCBuZXh0S2V5KSkge1xuICAgICAgICAgICAgICB0b1tuZXh0S2V5XSA9IG5leHRTb3VyY2VbbmV4dEtleV07XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgICByZXR1cm4gdG87XG4gICAgfSxcbiAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICBjb25maWd1cmFibGU6IHRydWVcbiAgfSk7XG59XG5cbi8vIGZyb206IGh0dHBzOi8vZ2l0aHViLmNvbS9qc2Vyei9qc19waWVjZS9ibG9iL21hc3Rlci9ET00vQ2hpbGROb2RlL2FmdGVyKCkvYWZ0ZXIoKS5tZFxuKGZ1bmN0aW9uIChhcnIpIHtcbiAgYXJyLmZvckVhY2goZnVuY3Rpb24gKGl0ZW0pIHtcbiAgICBpZiAoaXRlbS5oYXNPd25Qcm9wZXJ0eSgnYWZ0ZXInKSkge1xuICAgICAgcmV0dXJuO1xuICAgIH1cbiAgICBPYmplY3QuZGVmaW5lUHJvcGVydHkoaXRlbSwgJ2FmdGVyJywge1xuICAgICAgY29uZmlndXJhYmxlOiB0cnVlLFxuICAgICAgZW51bWVyYWJsZTogdHJ1ZSxcbiAgICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgICAgdmFsdWU6IGZ1bmN0aW9uIGFmdGVyKCkge1xuICAgICAgICB2YXIgYXJnQXJyID0gQXJyYXkucHJvdG90eXBlLnNsaWNlLmNhbGwoYXJndW1lbnRzKSxcbiAgICAgICAgICBkb2NGcmFnID0gZG9jdW1lbnQuY3JlYXRlRG9jdW1lbnRGcmFnbWVudCgpO1xuICAgICAgICBcbiAgICAgICAgYXJnQXJyLmZvckVhY2goZnVuY3Rpb24gKGFyZ0l0ZW0pIHtcbiAgICAgICAgICB2YXIgaXNOb2RlID0gYXJnSXRlbSBpbnN0YW5jZW9mIE5vZGU7XG4gICAgICAgICAgZG9jRnJhZy5hcHBlbmRDaGlsZChpc05vZGUgPyBhcmdJdGVtIDogZG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoU3RyaW5nKGFyZ0l0ZW0pKSk7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgdGhpcy5wYXJlbnROb2RlLmluc2VydEJlZm9yZShkb2NGcmFnLCB0aGlzLm5leHRTaWJsaW5nKTtcbiAgICAgIH1cbiAgICB9KTtcbiAgfSk7XG59KShbRWxlbWVudC5wcm90b3R5cGUsIENoYXJhY3RlckRhdGEucHJvdG90eXBlLCBEb2N1bWVudFR5cGUucHJvdG90eXBlXSk7XG5cbmZ1bmN0aW9uIFJlcGxhY2VXaXRoUG9seWZpbGwoKSB7XG4gICd1c2Utc3RyaWN0JzsgLy8gRm9yIHNhZmFyaSwgYW5kIElFID4gMTBcbiAgdmFyIHBhcmVudCA9IHRoaXMucGFyZW50Tm9kZSwgaSA9IGFyZ3VtZW50cy5sZW5ndGgsIGN1cnJlbnROb2RlO1xuICBpZiAoIXBhcmVudCkgcmV0dXJuO1xuICBpZiAoIWkpIC8vIGlmIHRoZXJlIGFyZSBubyBhcmd1bWVudHNcbiAgICBwYXJlbnQucmVtb3ZlQ2hpbGQodGhpcyk7XG4gIHdoaWxlIChpLS0pIHsgLy8gaS0tIGRlY3JlbWVudHMgaSBhbmQgcmV0dXJucyB0aGUgdmFsdWUgb2YgaSBiZWZvcmUgdGhlIGRlY3JlbWVudFxuICAgIGN1cnJlbnROb2RlID0gYXJndW1lbnRzW2ldO1xuICAgIGlmICh0eXBlb2YgY3VycmVudE5vZGUgIT09ICdvYmplY3QnKXtcbiAgICAgIGN1cnJlbnROb2RlID0gdGhpcy5vd25lckRvY3VtZW50LmNyZWF0ZVRleHROb2RlKGN1cnJlbnROb2RlKTtcbiAgICB9IGVsc2UgaWYgKGN1cnJlbnROb2RlLnBhcmVudE5vZGUpe1xuICAgICAgY3VycmVudE5vZGUucGFyZW50Tm9kZS5yZW1vdmVDaGlsZChjdXJyZW50Tm9kZSk7XG4gICAgfVxuICAgIC8vIHRoZSB2YWx1ZSBvZiBcImlcIiBiZWxvdyBpcyBhZnRlciB0aGUgZGVjcmVtZW50XG4gICAgaWYgKCFpKSAvLyBpZiBjdXJyZW50Tm9kZSBpcyB0aGUgZmlyc3QgYXJndW1lbnQgKGN1cnJlbnROb2RlID09PSBhcmd1bWVudHNbMF0pXG4gICAgICBwYXJlbnQucmVwbGFjZUNoaWxkKGN1cnJlbnROb2RlLCB0aGlzKTtcbiAgICBlbHNlIC8vIGlmIGN1cnJlbnROb2RlIGlzbid0IHRoZSBmaXJzdFxuICAgICAgcGFyZW50Lmluc2VydEJlZm9yZShjdXJyZW50Tm9kZSwgdGhpcy5wcmV2aW91c1NpYmxpbmcpO1xuICB9XG59XG5pZiAoIUVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoKVxuICAgIEVsZW1lbnQucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcbmlmICghQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoKSBcbiAgICBEb2N1bWVudFR5cGUucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcblxuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRmb3JtID0gJChcIi5mb3JtLXNlYXJjaC12b2x1bWVcIik7XG5cbiAgdmFyICRib2R5ID0gJChcImJvZHlcIik7XG5cbiAgJCh3aW5kb3cpLm9uKCd1bmRvLWxvYWRpbmcnLCBmdW5jdGlvbigpIHtcbiAgICAkKFwiYnV0dG9uLmJ0bi1sb2FkaW5nXCIpLnJlbW92ZUF0dHIoXCJkaXNhYmxlZFwiKS5yZW1vdmVDbGFzcyhcImJ0bi1sb2FkaW5nXCIpO1xuICB9KVxuXG4gICQoXCJib2R5XCIpLm9uKCdzdWJtaXQnLCAnZm9ybS5mb3JtLXNlYXJjaC12b2x1bWUnLCBmdW5jdGlvbihldmVudCkge1xuICAgIEhULmJlZm9yZVVubG9hZFRpbWVvdXQgPSAxNTAwMDtcbiAgICB2YXIgJGZvcm1fID0gJCh0aGlzKTtcblxuICAgIHZhciAkc3VibWl0ID0gJGZvcm1fLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm1fLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgIH0pXG5cbiAgICBpZiAoIEhULnJlYWRlciAmJiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yICkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHJldHVybiBIVC5yZWFkZXIuY29udHJvbHMuc2VhcmNoaW5hdG9yLnN1Ym1pdCgkZm9ybV8uZ2V0KDApKTtcbiAgICB9XG5cbiAgICAvLyBkZWZhdWx0IHByb2Nlc3NpbmdcbiAgfSlcblxuICAkKFwiI2FjdGlvbi1zdGFydC1qdW1wXCIpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ogPSBwYXJzZUludCgkKHRoaXMpLmRhdGEoJ3N6JyksIDEwKTtcbiAgICB2YXIgdmFsdWUgPSBwYXJzZUludCgkKHRoaXMpLnZhbCgpLCAxMCk7XG4gICAgdmFyIHN0YXJ0ID0gKCB2YWx1ZSAtIDEgKSAqIHN6ICsgMTtcbiAgICB2YXIgJGZvcm1fID0gJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIik7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N0YXJ0JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N0YXJ0fVwiIC8+YCk7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N6JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N6fVwiIC8+YCk7XG4gICAgJGZvcm1fLnN1Ym1pdCgpO1xuICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI3ZlcnNpb25JY29uJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
