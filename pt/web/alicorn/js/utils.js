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
    HT.downloader = Object.create(HT.Downloader).init({
        params: HT.params
    });

    HT.downloader.start();

    // non-jquery?
    downloadForm = document.querySelector('#form-download-module');
    downloadFormatOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('input[name="download_format"]'));
    rangeOptions = Array.prototype.slice.call(downloadForm.querySelectorAll('[data-download-format-target]'));

    var downloadSubmit = downloadForm.querySelector('[type="submit"]');

    var hasFullPdfAccess = downloadForm.dataset.fullPdfAccess == 'allow';

    var updateDownloadFormatRangeOptions = function updateDownloadFormatRangeOptions(option) {
        rangeOptions.forEach(function (rangeOption) {
            var input = rangeOption.querySelector('input');
            input.disabled = !rangeOption.matches('[data-download-format-target~="' + option.value + '"]');
        });

        if (!hasFullPdfAccess) {
            var checked = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + HT.reader.view.name + '"] input:checked');
            if (!checked) {
                // check the first one
                var input = downloadForm.querySelector('[data-download-format-target][data-view-target~="' + HT.reader.view.name + '"] input');
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwicG9seWZpbGxzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsInJlbmV3X2F1dGgiLCJlbnRpdHlJRCIsInNvdXJjZSIsIl9fcmVuZXdpbmciLCJzZXRUaW1lb3V0IiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIm9uIiwiZXZlbnQiLCJNT05USFMiLCIkZW1lcmdlbmN5X2FjY2VzcyIsImRlbHRhIiwibGFzdF9zZWNvbmRzIiwidG9nZ2xlX3JlbmV3X2xpbmsiLCJkYXRlIiwibm93IiwiRGF0ZSIsImdldFRpbWUiLCIkbGluayIsImZpbmQiLCJvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wIiwicGFyYW1zIiwiaWQiLCJjb29raWUiLCJqc29uIiwic2Vjb25kcyIsImNsb25lIiwidGV4dCIsImFwcGVuZCIsIiRhY3Rpb24iLCJtZXNzYWdlIiwidGltZTJtZXNzYWdlIiwiaG91cnMiLCJnZXRIb3VycyIsImFtcG0iLCJtaW51dGVzIiwiZ2V0TWludXRlcyIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImV4cGlyYXRpb24iLCJwYXJzZUludCIsImdyYW50ZWQiLCJnZXQiLCJkYXRhc2V0IiwiaW5pdGlhbGl6ZWQiLCJzZXRJbnRlcnZhbCIsInN1cHByZXNzIiwiaGFzQ2xhc3MiLCJkZWJ1ZyIsImlkaGFzaCIsImN1cnJpZCIsImlkcyIsInNob3dBbGVydCIsImh0bWwiLCIkYWxlcnQiLCJib290Ym94IiwiZGlhbG9nIiwibGFiZWwiLCJoZWFkZXIiLCJyb2xlIiwiZG9tYWluIiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm5hbWUiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJDbGFzc0xpc3QiLCJlbGVtIiwidHJpbW1lZENsYXNzZXMiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc2VzIiwiX3VwZGF0ZUNsYXNzTmFtZSIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdFByb3RvIiwiY2xhc3NMaXN0R2V0dGVyIiwiRXJyb3IiLCJjb250YWlucyIsImFkZCIsInRva2VucyIsInVwZGF0ZWQiLCJyZW1vdmUiLCJpbmRleCIsInNwbGljZSIsInRvZ2dsZSIsImZvcmNlIiwicmVzdWx0IiwibWV0aG9kIiwicmVwbGFjZW1lbnRfdG9rZW4iLCJqb2luIiwiZGVmaW5lUHJvcGVydHkiLCJjbGFzc0xpc3RQcm9wRGVzYyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJleCIsIm51bWJlciIsIl9fZGVmaW5lR2V0dGVyX18iLCJ0ZXN0RWxlbWVudCIsImNyZWF0ZU1ldGhvZCIsIm9yaWdpbmFsIiwiRE9NVG9rZW5MaXN0IiwiX3RvZ2dsZSIsInNsaWNlIiwiYXBwbHkiLCJERUZBVUxUX0NPTExfTUVOVV9PUFRJT04iLCJORVdfQ09MTF9NRU5VX09QVElPTiIsIklOX1lPVVJfQ09MTFNfTEFCRUwiLCIkdG9vbGJhciIsIiRlcnJvcm1zZyIsIiRpbmZvbXNnIiwiZGlzcGxheV9lcnJvciIsIm1zZyIsImluc2VydEFmdGVyIiwic2hvdyIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYWdlIiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwicGFyZW50cyIsInJlbW92ZUNsYXNzIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiYW5zd2VyIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJmb3JjZV9zaXplIiwiJGRpdiIsIiRwIiwicGhvdG9jb3BpZXJfbWVzc2FnZSIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0IiwiZG93bmxvYWRQZGYiLCJjb25maWciLCJzcmMiLCJpdGVtX3RpdGxlIiwiJGNvbmZpZyIsInRvdGFsIiwic2VsZWN0aW9uIiwicGFnZXMiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCIkc3RhdHVzIiwicmVxdWVzdERvd25sb2FkIiwic2VxIiwiZG93bmxvYWRGb3JtYXQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJjaGVja1N0YXR1cyIsInRzIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJ1cGRhdGVTdGF0dXNUZXh0IiwiY3NzIiwid2lkdGgiLCJkb3dubG9hZF9rZXkiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCIkZG93bmxvYWRfYnRuIiwiZG93bmxvYWQiLCJ0cmFja0V2ZW50IiwiY2F0ZWdvcnkiLCJ0b1VwcGVyQ2FzZSIsInRyYWNraW5nQWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicmF0ZSIsImNvdW50ZG93biIsImNvdW50ZG93bl90aW1lciIsIl9sYXN0TWVzc2FnZSIsIl9sYXN0VGltZXIiLCJjbGVhclRpbWVvdXQiLCJpbm5lclRleHQiLCJFT1QiLCJkb3dubG9hZEZvcm0iLCJkb3dubG9hZEZvcm1hdE9wdGlvbnMiLCJyYW5nZU9wdGlvbnMiLCJkb3dubG9hZElkeCIsImRvd25sb2FkZXIiLCJjcmVhdGUiLCJxdWVyeVNlbGVjdG9yIiwicXVlcnlTZWxlY3RvckFsbCIsImRvd25sb2FkU3VibWl0IiwiaGFzRnVsbFBkZkFjY2VzcyIsImZ1bGxQZGZBY2Nlc3MiLCJ1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyIsIm9wdGlvbiIsImZvckVhY2giLCJyYW5nZU9wdGlvbiIsImlucHV0IiwiZGlzYWJsZWQiLCJtYXRjaGVzIiwidmFsdWUiLCJjaGVja2VkIiwicmVhZGVyIiwiYWRkRXZlbnRMaXN0ZW5lciIsImRpdiIsImZvcm1hdE9wdGlvbiIsImRvd25sb2FkRm9ybWF0VGFyZ2V0IiwicGRmRm9ybWF0T3B0aW9uIiwidHVubmVsRm9ybSIsInByaW50YWJsZSIsImFjdGlvblRlbXBsYXRlIiwiY29udHJvbHMiLCJzZWxlY3RpbmF0b3IiLCJfZ2V0UGFnZVNlbGVjdGlvbiIsImlzU2VsZWN0aW9uIiwiYnV0dG9ucyIsImN1cnJlbnRMb2NhdGlvbiIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJpc1BhcnRpYWwiLCJyZW1vdmVDaGlsZCIsInNpemVfYXR0ciIsImltYWdlX2Zvcm1hdF9hdHRyIiwic2l6ZV92YWx1ZSIsImFwcGVuZENoaWxkIiwicmFuZ2UiLCJib2R5IiwidHJhY2tlciIsInRyYWNrZXJfaW5wdXQiLCJzdHlsZSIsIm9wYWNpdHkiLCJ0cmFja2VySW50ZXJ2YWwiLCJpc19kZXYiLCJyZW1vdmVDb29raWUiLCJkaXNhYmxlVW5sb2FkVGltZW91dCIsInN1Ym1pdCIsIl9mb3JtYXRfdGl0bGVzIiwiZXB1YiIsInBsYWludGV4dCIsImltYWdlIiwic2lkZV9zaG9ydCIsInNpZGVfbG9uZyIsImh0SWQiLCJlbWJlZEhlbHBMaW5rIiwiY29kZWJsb2NrX3R4dCIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsImFkZENsYXNzIiwidGV4dGFyZWEiLCJzZWxlY3QiLCJjbGljayIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJpbml0ZWQiLCIkaW5wdXQiLCIkaW5wdXRfbGFiZWwiLCIkc2VsZWN0IiwiJHNlYXJjaF90YXJnZXQiLCIkZnQiLCIkYmFja2Ryb3AiLCJvblNob3ciLCJtb2RhbCIsIl9zZXR1cCIsImxzIiwiY2F0YWxvZyIsInRhcmdldCIsInByZWZzIiwic2VhcmNoIiwiZnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRtZW51IiwiJHRyaWdnZXIiLCIkaGVhZGVyIiwiJG5hdmlnYXRvciIsIm1vYmlmeSIsImRvY3VtZW50RWxlbWVudCIsImV4cGFuZGVkIiwic2V0UHJvcGVydHkiLCJvdXRlckhlaWdodCIsIm9yaWdpbmFsSGVpZ2h0IiwiJGV4cGFuZG8iLCJuYXZpZ2F0b3JIZWlnaHQiLCJ1aSIsIiRzaWRlYmFyIiwicmVxdWVzdEZ1bGxTY3JlZW4iLCJ1dGlscyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJ1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkiLCJ0b3AiLCJoZWlnaHQiLCJhc3NpZ24iLCJ2YXJBcmdzIiwiVHlwZUVycm9yIiwidG8iLCJuZXh0U291cmNlIiwibmV4dEtleSIsIndyaXRhYmxlIiwiYXJyIiwiYWZ0ZXIiLCJhcmdBcnIiLCJkb2NGcmFnIiwiY3JlYXRlRG9jdW1lbnRGcmFnbWVudCIsImFyZ0l0ZW0iLCJpc05vZGUiLCJOb2RlIiwiY3JlYXRlVGV4dE5vZGUiLCJwYXJlbnROb2RlIiwiaW5zZXJ0QmVmb3JlIiwibmV4dFNpYmxpbmciLCJDaGFyYWN0ZXJEYXRhIiwiRG9jdW1lbnRUeXBlIiwiUmVwbGFjZVdpdGhQb2x5ZmlsbCIsImN1cnJlbnROb2RlIiwib3duZXJEb2N1bWVudCIsInJlcGxhY2VDaGlsZCIsInByZXZpb3VzU2libGluZyIsInJlcGxhY2VXaXRoIiwiJGJvZHkiLCJyZW1vdmVBdHRyIiwiYmVmb3JlVW5sb2FkVGltZW91dCIsIiRmb3JtXyIsIiRzdWJtaXQiLCJzZWFyY2hpbmF0b3Ii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LEVBQXhCLENBQTJCLFFBQTNCLEVBQXFDLFlBQVc7QUFDOUMsUUFBSWdhLEtBQUsvWCxTQUFTckosRUFBRSxJQUFGLEVBQVF1RixJQUFSLENBQWEsSUFBYixDQUFULEVBQTZCLEVBQTdCLENBQVQ7QUFDQSxRQUFJc1QsUUFBUXhQLFNBQVNySixFQUFFLElBQUYsRUFBUWtELEdBQVIsRUFBVCxFQUF3QixFQUF4QixDQUFaO0FBQ0EsUUFBSW9RLFFBQVEsQ0FBRXVGLFFBQVEsQ0FBVixJQUFnQnVJLEVBQWhCLEdBQXFCLENBQWpDO0FBQ0EsUUFBSUgsU0FBU2poQixFQUFFLHFCQUFGLENBQWI7QUFDQWloQixXQUFPeFksTUFBUCxrREFBMEQ2SyxLQUExRDtBQUNBMk4sV0FBT3hZLE1BQVAsK0NBQXVEMlksRUFBdkQ7QUFDQUgsV0FBT2xHLE1BQVA7QUFDRCxHQVJEO0FBVUQsQ0EvQ0Q7OztBQ0FBalYsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCL0YsTUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQixjQUF0QixFQUFzQyxVQUFTOUMsQ0FBVCxFQUFZO0FBQzlDQSxVQUFFa08sY0FBRjtBQUNBcEksZ0JBQVFxSixLQUFSLENBQWMsb1lBQWQ7QUFDSCxLQUhEO0FBS0gsQ0FQRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBKUXVlcnkgVVJMIFBhcnNlciBwbHVnaW4sIHYyLjIuMVxuICogRGV2ZWxvcGVkIGFuZCBtYWludGFuaW5lZCBieSBNYXJrIFBlcmtpbnMsIG1hcmtAYWxsbWFya2VkdXAuY29tXG4gKiBTb3VyY2UgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyXG4gKiBMaWNlbnNlZCB1bmRlciBhbiBNSVQtc3R5bGUgbGljZW5zZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlci9ibG9iL21hc3Rlci9MSUNFTlNFIGZvciBkZXRhaWxzLlxuICovIFxuXG47KGZ1bmN0aW9uKGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRCBhdmFpbGFibGU7IHVzZSBhbm9ueW1vdXMgbW9kdWxlXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBObyBBTUQgYXZhaWxhYmxlOyBtdXRhdGUgZ2xvYmFsIHZhcnNcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZmFjdG9yeShqUXVlcnkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmYWN0b3J5KCk7XG5cdFx0fVxuXHR9XG59KShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblx0XG5cdHZhciB0YWcyYXR0ciA9IHtcblx0XHRcdGEgICAgICAgOiAnaHJlZicsXG5cdFx0XHRpbWcgICAgIDogJ3NyYycsXG5cdFx0XHRmb3JtICAgIDogJ2FjdGlvbicsXG5cdFx0XHRiYXNlICAgIDogJ2hyZWYnLFxuXHRcdFx0c2NyaXB0ICA6ICdzcmMnLFxuXHRcdFx0aWZyYW1lICA6ICdzcmMnLFxuXHRcdFx0bGluayAgICA6ICdocmVmJ1xuXHRcdH0sXG5cdFx0XG5cdFx0a2V5ID0gWydzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnZnJhZ21lbnQnXSwgLy8ga2V5cyBhdmFpbGFibGUgdG8gcXVlcnlcblx0XHRcblx0XHRhbGlhc2VzID0geyAnYW5jaG9yJyA6ICdmcmFnbWVudCcgfSwgLy8gYWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHlcblx0XHRcblx0XHRwYXJzZXIgPSB7XG5cdFx0XHRzdHJpY3QgOiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8sICAvL2xlc3MgaW50dWl0aXZlLCBtb3JlIGFjY3VyYXRlIHRvIHRoZSBzcGVjc1xuXHRcdFx0bG9vc2UgOiAgL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8gLy8gbW9yZSBpbnR1aXRpdmUsIGZhaWxzIG9uIHJlbGF0aXZlIHBhdGhzIGFuZCBkZXZpYXRlcyBmcm9tIHNwZWNzXG5cdFx0fSxcblx0XHRcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0XG5cdFx0aXNpbnQgPSAvXlswLTldKyQvO1xuXHRcblx0ZnVuY3Rpb24gcGFyc2VVcmkoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHR2YXIgc3RyID0gZGVjb2RlVVJJKCB1cmwgKSxcblx0XHRyZXMgICA9IHBhcnNlclsgc3RyaWN0TW9kZSB8fCBmYWxzZSA/ICdzdHJpY3QnIDogJ2xvb3NlJyBdLmV4ZWMoIHN0ciApLFxuXHRcdHVyaSA9IHsgYXR0ciA6IHt9LCBwYXJhbSA6IHt9LCBzZWcgOiB7fSB9LFxuXHRcdGkgICA9IDE0O1xuXHRcdFxuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0dXJpLmF0dHJbIGtleVtpXSBdID0gcmVzW2ldIHx8ICcnO1xuXHRcdH1cblx0XHRcblx0XHQvLyBidWlsZCBxdWVyeSBhbmQgZnJhZ21lbnQgcGFyYW1ldGVyc1x0XHRcblx0XHR1cmkucGFyYW1bJ3F1ZXJ5J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsncXVlcnknXSk7XG5cdFx0dXJpLnBhcmFtWydmcmFnbWVudCddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ2ZyYWdtZW50J10pO1xuXHRcdFxuXHRcdC8vIHNwbGl0IHBhdGggYW5kIGZyYWdlbWVudCBpbnRvIHNlZ21lbnRzXHRcdFxuXHRcdHVyaS5zZWdbJ3BhdGgnXSA9IHVyaS5hdHRyLnBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTsgICAgIFxuXHRcdHVyaS5zZWdbJ2ZyYWdtZW50J10gPSB1cmkuYXR0ci5mcmFnbWVudC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpO1xuXHRcdFxuXHRcdC8vIGNvbXBpbGUgYSAnYmFzZScgZG9tYWluIGF0dHJpYnV0ZSAgICAgICAgXG5cdFx0dXJpLmF0dHJbJ2Jhc2UnXSA9IHVyaS5hdHRyLmhvc3QgPyAodXJpLmF0dHIucHJvdG9jb2wgPyAgdXJpLmF0dHIucHJvdG9jb2wrJzovLycrdXJpLmF0dHIuaG9zdCA6IHVyaS5hdHRyLmhvc3QpICsgKHVyaS5hdHRyLnBvcnQgPyAnOicrdXJpLmF0dHIucG9ydCA6ICcnKSA6ICcnOyAgICAgIFxuXHRcdCAgXG5cdFx0cmV0dXJuIHVyaTtcblx0fTtcblx0XG5cdGZ1bmN0aW9uIGdldEF0dHJOYW1lKCBlbG0gKSB7XG5cdFx0dmFyIHRuID0gZWxtLnRhZ05hbWU7XG5cdFx0aWYgKCB0eXBlb2YgdG4gIT09ICd1bmRlZmluZWQnICkgcmV0dXJuIHRhZzJhdHRyW3RuLnRvTG93ZXJDYXNlKCldO1xuXHRcdHJldHVybiB0bjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuXHRcdGlmIChwYXJlbnRba2V5XS5sZW5ndGggPT0gMCkgcmV0dXJuIHBhcmVudFtrZXldID0ge307XG5cdFx0dmFyIHQgPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHBhcmVudFtrZXldKSB0W2ldID0gcGFyZW50W2tleV1baV07XG5cdFx0cGFyZW50W2tleV0gPSB0O1xuXHRcdHJldHVybiB0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHR2YXIgcGFydCA9IHBhcnRzLnNoaWZ0KCk7XG5cdFx0aWYgKCFwYXJ0KSB7XG5cdFx0XHRpZiAoaXNBcnJheShwYXJlbnRba2V5XSkpIHtcblx0XHRcdFx0cGFyZW50W2tleV0ucHVzaCh2YWwpO1xuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2UgaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgb2JqID0gcGFyZW50W2tleV0gPSBwYXJlbnRba2V5XSB8fCBbXTtcblx0XHRcdGlmICgnXScgPT0gcGFydCkge1xuXHRcdFx0XHRpZiAoaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdFx0aWYgKCcnICE9IHZhbCkgb2JqLnB1c2godmFsKTtcblx0XHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqKSB7XG5cdFx0XHRcdFx0b2JqW2tleXMob2JqKS5sZW5ndGhdID0gdmFsO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9iaiA9IHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKH5wYXJ0LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0XHRwYXJ0ID0gcGFydC5zdWJzdHIoMCwgcGFydC5sZW5ndGggLSAxKTtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHRcdC8vIGtleVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbWVyZ2UocGFyZW50LCBrZXksIHZhbCkge1xuXHRcdGlmICh+a2V5LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0dmFyIHBhcnRzID0ga2V5LnNwbGl0KCdbJyksXG5cdFx0XHRsZW4gPSBwYXJ0cy5sZW5ndGgsXG5cdFx0XHRsYXN0ID0gbGVuIC0gMTtcblx0XHRcdHBhcnNlKHBhcnRzLCBwYXJlbnQsICdiYXNlJywgdmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFpc2ludC50ZXN0KGtleSkgJiYgaXNBcnJheShwYXJlbnQuYmFzZSkpIHtcblx0XHRcdFx0dmFyIHQgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgayBpbiBwYXJlbnQuYmFzZSkgdFtrXSA9IHBhcmVudC5iYXNlW2tdO1xuXHRcdFx0XHRwYXJlbnQuYmFzZSA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRzZXQocGFyZW50LmJhc2UsIGtleSwgdmFsKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuXHRcdHJldHVybiByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQoLyZ8Oy8pLCBmdW5jdGlvbihyZXQsIHBhaXIpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBhaXIgPSBkZWNvZGVVUklDb21wb25lbnQocGFpci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Ly8gaWdub3JlXG5cdFx0XHR9XG5cdFx0XHR2YXIgZXFsID0gcGFpci5pbmRleE9mKCc9JyksXG5cdFx0XHRcdGJyYWNlID0gbGFzdEJyYWNlSW5LZXkocGFpciksXG5cdFx0XHRcdGtleSA9IHBhaXIuc3Vic3RyKDAsIGJyYWNlIHx8IGVxbCksXG5cdFx0XHRcdHZhbCA9IHBhaXIuc3Vic3RyKGJyYWNlIHx8IGVxbCwgcGFpci5sZW5ndGgpLFxuXHRcdFx0XHR2YWwgPSB2YWwuc3Vic3RyKHZhbC5pbmRleE9mKCc9JykgKyAxLCB2YWwubGVuZ3RoKTtcblxuXHRcdFx0aWYgKCcnID09IGtleSkga2V5ID0gcGFpciwgdmFsID0gJyc7XG5cblx0XHRcdHJldHVybiBtZXJnZShyZXQsIGtleSwgdmFsKTtcblx0XHR9LCB7IGJhc2U6IHt9IH0pLmJhc2U7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG5cdFx0dmFyIHYgPSBvYmpba2V5XTtcblx0XHRpZiAodW5kZWZpbmVkID09PSB2KSB7XG5cdFx0XHRvYmpba2V5XSA9IHZhbDtcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkodikpIHtcblx0XHRcdHYucHVzaCh2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvYmpba2V5XSA9IFt2LCB2YWxdO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gbGFzdEJyYWNlSW5LZXkoc3RyKSB7XG5cdFx0dmFyIGxlbiA9IHN0ci5sZW5ndGgsXG5cdFx0XHQgYnJhY2UsIGM7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHRcdFx0YyA9IHN0cltpXTtcblx0XHRcdGlmICgnXScgPT0gYykgYnJhY2UgPSBmYWxzZTtcblx0XHRcdGlmICgnWycgPT0gYykgYnJhY2UgPSB0cnVlO1xuXHRcdFx0aWYgKCc9JyA9PSBjICYmICFicmFjZSkgcmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiByZWR1Y2Uob2JqLCBhY2N1bXVsYXRvcil7XG5cdFx0dmFyIGkgPSAwLFxuXHRcdFx0bCA9IG9iai5sZW5ndGggPj4gMCxcblx0XHRcdGN1cnIgPSBhcmd1bWVudHNbMl07XG5cdFx0d2hpbGUgKGkgPCBsKSB7XG5cdFx0XHRpZiAoaSBpbiBvYmopIGN1cnIgPSBhY2N1bXVsYXRvci5jYWxsKHVuZGVmaW5lZCwgY3Vyciwgb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0KytpO1xuXHRcdH1cblx0XHRyZXR1cm4gY3Vycjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gaXNBcnJheSh2QXJnKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2QXJnKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBrZXlzKG9iaikge1xuXHRcdHZhciBrZXlzID0gW107XG5cdFx0Zm9yICggcHJvcCBpbiBvYmogKSB7XG5cdFx0XHRpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSApIGtleXMucHVzaChwcm9wKTtcblx0XHR9XG5cdFx0cmV0dXJuIGtleXM7XG5cdH1cblx0XHRcblx0ZnVuY3Rpb24gcHVybCggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB1cmwgPT09IHRydWUgKSB7XG5cdFx0XHRzdHJpY3RNb2RlID0gdHJ1ZTtcblx0XHRcdHVybCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0c3RyaWN0TW9kZSA9IHN0cmljdE1vZGUgfHwgZmFsc2U7XG5cdFx0dXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuXHRcblx0XHRyZXR1cm4ge1xuXHRcdFx0XG5cdFx0XHRkYXRhIDogcGFyc2VVcmkodXJsLCBzdHJpY3RNb2RlKSxcblx0XHRcdFxuXHRcdFx0Ly8gZ2V0IHZhcmlvdXMgYXR0cmlidXRlcyBmcm9tIHRoZSBVUklcblx0XHRcdGF0dHIgOiBmdW5jdGlvbiggYXR0ciApIHtcblx0XHRcdFx0YXR0ciA9IGFsaWFzZXNbYXR0cl0gfHwgYXR0cjtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBhdHRyICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5hdHRyW2F0dHJdIDogdGhpcy5kYXRhLmF0dHI7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcblx0XHRcdHBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5xdWVyeVtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0ucXVlcnk7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgcGFyYW1ldGVyc1xuXHRcdFx0ZnBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudFtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnQ7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcGF0aCBzZWdtZW50c1xuXHRcdFx0c2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5wYXRoLmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGhbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgc2VnbWVudHNcblx0XHRcdGZzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudDsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLmZyYWdtZW50Lmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50W3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHQgICAgXHRcblx0XHR9O1xuXHRcblx0fTtcblx0XG5cdGlmICggdHlwZW9mICQgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFxuXHRcdCQuZm4udXJsID0gZnVuY3Rpb24oIHN0cmljdE1vZGUgKSB7XG5cdFx0XHR2YXIgdXJsID0gJyc7XG5cdFx0XHRpZiAoIHRoaXMubGVuZ3RoICkge1xuXHRcdFx0XHR1cmwgPSAkKHRoaXMpLmF0dHIoIGdldEF0dHJOYW1lKHRoaXNbMF0pICkgfHwgJyc7XG5cdFx0XHR9ICAgIFxuXHRcdFx0cmV0dXJuIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApO1xuXHRcdH07XG5cdFx0XG5cdFx0JC51cmwgPSBwdXJsO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5wdXJsID0gcHVybDtcblx0fVxuXG59KTtcblxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIC8vIHZhciAkc3RhdHVzID0gJChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgLy8gdmFyIGxhc3RNZXNzYWdlOyB2YXIgbGFzdFRpbWVyO1xuICAvLyBIVC51cGRhdGVfc3RhdHVzID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAvLyAgICAgaWYgKCBsYXN0TWVzc2FnZSAhPSBtZXNzYWdlICkge1xuICAvLyAgICAgICBpZiAoIGxhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KGxhc3RUaW1lcik7IGxhc3RUaW1lciA9IG51bGw7IH1cblxuICAvLyAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgLy8gICAgICAgICAkc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gIC8vICAgICAgICAgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0gc3RhdHVzOlwiLCBtZXNzYWdlKTtcbiAgLy8gICAgICAgfSwgNTApO1xuICAvLyAgICAgICBsYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgLy8gICAgICAgICAkc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgLy8gICAgICAgfSwgNTAwKTtcblxuICAvLyAgICAgfVxuICAvLyB9XG5cbiAgSFQucmVuZXdfYXV0aCA9IGZ1bmN0aW9uKGVudGl0eUlELCBzb3VyY2U9J2ltYWdlJykge1xuICAgIGlmICggSFQuX19yZW5ld2luZyApIHsgcmV0dXJuIDsgfVxuICAgIEhULl9fcmVuZXdpbmcgPSB0cnVlO1xuICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgdmFyIHJlYXV0aF91cmwgPSBgaHR0cHM6Ly8ke0hULnNlcnZpY2VfZG9tYWlufS9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD0ke2VudGl0eUlEfSZ0YXJnZXQ9JHtlbmNvZGVVUklDb21wb25lbnQod2luZG93LmxvY2F0aW9uLmhyZWYpfWA7XG4gICAgICB2YXIgcmV0dmFsID0gd2luZG93LmNvbmZpcm0oYFdlJ3JlIGhhdmluZyBhIHByb2JsZW0gd2l0aCB5b3VyIHNlc3Npb247IHNlbGVjdCBPSyB0byBsb2cgaW4gYWdhaW4uYCk7XG4gICAgICBpZiAoIHJldHZhbCApIHtcbiAgICAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSByZWF1dGhfdXJsO1xuICAgICAgfVxuICAgIH0sIDEwMCk7XG4gIH1cblxuICBIVC5hbmFseXRpY3MgPSBIVC5hbmFseXRpY3MgfHwge307XG4gIEhULmFuYWx5dGljcy5sb2dBY3Rpb24gPSBmdW5jdGlvbihocmVmLCB0cmlnZ2VyKSB7XG4gICAgaWYgKCBocmVmID09PSB1bmRlZmluZWQgKSB7IGhyZWYgPSBsb2NhdGlvbi5ocmVmIDsgfVxuICAgIHZhciBkZWxpbSA9IGhyZWYuaW5kZXhPZignOycpID4gLTEgPyAnOycgOiAnJic7XG4gICAgaWYgKCB0cmlnZ2VyID09IG51bGwgKSB7IHRyaWdnZXIgPSAnLSc7IH1cbiAgICBocmVmICs9IGRlbGltICsgJ2E9JyArIHRyaWdnZXI7XG4gICAgLy8gJC5nZXQoaHJlZik7XG4gICAgJC5hamF4KGhyZWYsIFxuICAgIHtcbiAgICAgIGNvbXBsZXRlOiBmdW5jdGlvbih4aHIsIHN0YXR1cykge1xuICAgICAgICB2YXIgZW50aXR5SUQgPSB4aHIuZ2V0UmVzcG9uc2VIZWFkZXIoJ3gtaGF0aGl0cnVzdC1yZW5ldycpO1xuICAgICAgICBpZiAoIGVudGl0eUlEICkge1xuICAgICAgICAgIEhULnJlbmV3X2F1dGgoZW50aXR5SUQsICdsb2dBY3Rpb24nKTtcbiAgICAgICAgfVxuICAgICAgfVxuICAgIH0pXG4gIH1cblxuXG4gICQoXCJib2R5XCIpLm9uKCdjbGljaycsICdhW2RhdGEtdHJhY2tpbmctY2F0ZWdvcnk9XCJvdXRMaW5rc1wiXScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gdmFyIHRyaWdnZXIgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWFjdGlvbicpO1xuICAgIC8vIHZhciBsYWJlbCA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctbGFiZWwnKTtcbiAgICAvLyBpZiAoIGxhYmVsICkgeyB0cmlnZ2VyICs9ICc6JyArIGxhYmVsOyB9XG4gICAgdmFyIHRyaWdnZXIgPSAnb3V0JyArICQodGhpcykuYXR0cignaHJlZicpO1xuICAgIEhULmFuYWx5dGljcy5sb2dBY3Rpb24odW5kZWZpbmVkLCB0cmlnZ2VyKTtcbiAgfSlcblxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgdmFyIE1PTlRIUyA9IFsnSmFudWFyeScsICdGZWJydWFyeScsICdNYXJjaCcsICdBcHJpbCcsICdNYXknLCAnSnVuZScsICdKdWx5JyxcbiAgICAnQXVndXN0JywgJ1NlcHRlbWJlcicsICdPY3RvYmVyJywgJ05vdmVtYmVyJywgJ0RlY2VtYmVyJ107XG5cbiAgdmFyICRlbWVyZ2VuY3lfYWNjZXNzID0gJChcIiNhY2Nlc3MtZW1lcmdlbmN5LWFjY2Vzc1wiKTtcblxuICB2YXIgZGVsdGEgPSA1ICogNjAgKiAxMDAwO1xuICB2YXIgbGFzdF9zZWNvbmRzO1xuICB2YXIgdG9nZ2xlX3JlbmV3X2xpbmsgPSBmdW5jdGlvbihkYXRlKSB7XG4gICAgdmFyIG5vdyA9IERhdGUubm93KCk7XG4gICAgaWYgKCBub3cgPj0gZGF0ZS5nZXRUaW1lKCkgKSB7XG4gICAgICB2YXIgJGxpbmsgPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiYVtkaXNhYmxlZF1cIik7XG4gICAgICAkbGluay5hdHRyKFwiZGlzYWJsZWRcIiwgbnVsbCk7XG4gICAgfVxuICB9XG5cbiAgdmFyIG9ic2VydmVfZXhwaXJhdGlvbl90aW1lc3RhbXAgPSBmdW5jdGlvbigpIHtcbiAgICBpZiAoICEgSFQgfHwgISBIVC5wYXJhbXMgfHwgISBIVC5wYXJhbXMuaWQgKSB7IHJldHVybiA7IH1cbiAgICB2YXIgZGF0YSA9ICQuY29va2llKCdIVGV4cGlyYXRpb24nLCB1bmRlZmluZWQsIHsganNvbjogdHJ1ZSB9KTtcbiAgICBpZiAoICEgZGF0YSApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBzZWNvbmRzID0gZGF0YVtIVC5wYXJhbXMuaWRdO1xuICAgIC8vIGNvbnNvbGUubG9nKFwiQUhPWSBPQlNFUlZFXCIsIHNlY29uZHMsIGxhc3Rfc2Vjb25kcyk7XG4gICAgaWYgKCBzZWNvbmRzID09IC0xICkge1xuICAgICAgdmFyICRsaW5rID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcInAgYVwiKS5jbG9uZSgpO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcInBcIikudGV4dChcIllvdXIgYWNjZXNzIGhhcyBleHBpcmVkIGFuZCBjYW5ub3QgYmUgcmVuZXdlZC4gUmVsb2FkIHRoZSBwYWdlIG9yIHRyeSBhZ2FpbiBsYXRlci4gQWNjZXNzIGhhcyBiZWVuIHByb3ZpZGVkIHRocm91Z2ggdGhlIFwiKTtcbiAgICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJwXCIpLmFwcGVuZCgkbGluayk7XG4gICAgICB2YXIgJGFjdGlvbiA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCIuYWxlcnQtLWVtZXJnZW5jeS1hY2Nlc3MtLW9wdGlvbnMgYVwiKTtcbiAgICAgICRhY3Rpb24uYXR0cignaHJlZicsIHdpbmRvdy5sb2NhdGlvbi5ocmVmKTtcbiAgICAgICRhY3Rpb24udGV4dCgnUmVsb2FkJyk7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIGlmICggc2Vjb25kcyA+IGxhc3Rfc2Vjb25kcyApIHtcbiAgICAgIHZhciBtZXNzYWdlID0gdGltZTJtZXNzYWdlKHNlY29uZHMpO1xuICAgICAgbGFzdF9zZWNvbmRzID0gc2Vjb25kcztcbiAgICAgICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCIuZXhwaXJlcy1kaXNwbGF5XCIpLnRleHQobWVzc2FnZSk7XG4gICAgfVxuICB9XG5cbiAgdmFyIHRpbWUybWVzc2FnZSA9IGZ1bmN0aW9uKHNlY29uZHMpIHtcbiAgICB2YXIgZGF0ZSA9IG5ldyBEYXRlKHNlY29uZHMgKiAxMDAwKTtcbiAgICB2YXIgaG91cnMgPSBkYXRlLmdldEhvdXJzKCk7XG4gICAgdmFyIGFtcG0gPSAnQU0nO1xuICAgIGlmICggaG91cnMgPiAxMiApIHsgaG91cnMgLT0gMTI7IGFtcG0gPSAnUE0nOyB9XG4gICAgaWYgKCBob3VycyA9PSAxMiApeyBhbXBtID0gJ1BNJzsgfVxuICAgIHZhciBtaW51dGVzID0gZGF0ZS5nZXRNaW51dGVzKCk7XG4gICAgaWYgKCBtaW51dGVzIDwgMTAgKSB7IG1pbnV0ZXMgPSBgMCR7bWludXRlc31gOyB9XG4gICAgdmFyIG1lc3NhZ2UgPSBgJHtob3Vyc306JHttaW51dGVzfSR7YW1wbX0gJHtNT05USFNbZGF0ZS5nZXRNb250aCgpXX0gJHtkYXRlLmdldERhdGUoKX1gO1xuICAgIHJldHVybiBtZXNzYWdlO1xuICB9XG5cbiAgaWYgKCAkZW1lcmdlbmN5X2FjY2Vzcy5sZW5ndGggKSB7XG4gICAgdmFyIGV4cGlyYXRpb24gPSAkZW1lcmdlbmN5X2FjY2Vzcy5kYXRhKCdhY2Nlc3NFeHBpcmVzJyk7XG4gICAgdmFyIHNlY29uZHMgPSBwYXJzZUludCgkZW1lcmdlbmN5X2FjY2Vzcy5kYXRhKCdhY2Nlc3NFeHBpcmVzU2Vjb25kcycpLCAxMCk7XG4gICAgdmFyIGdyYW50ZWQgPSAkZW1lcmdlbmN5X2FjY2Vzcy5kYXRhKCdhY2Nlc3NHcmFudGVkJyk7XG5cbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKSAvIDEwMDA7XG4gICAgdmFyIG1lc3NhZ2UgPSB0aW1lMm1lc3NhZ2Uoc2Vjb25kcyk7XG4gICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5leHBpcmVzLWRpc3BsYXlcIikudGV4dChtZXNzYWdlKTtcbiAgICAkZW1lcmdlbmN5X2FjY2Vzcy5nZXQoMCkuZGF0YXNldC5pbml0aWFsaXplZCA9ICd0cnVlJ1xuXG4gICAgaWYgKCBncmFudGVkICkge1xuICAgICAgLy8gc2V0IHVwIGEgd2F0Y2ggZm9yIHRoZSBleHBpcmF0aW9uIHRpbWVcbiAgICAgIGxhc3Rfc2Vjb25kcyA9IHNlY29uZHM7XG4gICAgICBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gdG9nZ2xlX3JlbmV3X2xpbmsoZGF0ZSk7XG4gICAgICAgIG9ic2VydmVfZXhwaXJhdGlvbl90aW1lc3RhbXAoKTtcbiAgICAgIH0sIDUwMCk7XG4gICAgfVxuICB9XG5cbiAgaWYgKCQoJyNhY2Nlc3NCYW5uZXJJRCcpLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBzdXBwcmVzcyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnc3VwYWNjYmFuJyk7XG4gICAgICBpZiAoc3VwcHJlc3MpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgZGVidWcgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ2h0ZGV2Jyk7XG4gICAgICB2YXIgaWRoYXNoID0gJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIHVuZGVmaW5lZCwge2pzb24gOiB0cnVlfSk7XG4gICAgICB2YXIgdXJsID0gJC51cmwoKTsgLy8gcGFyc2UgdGhlIGN1cnJlbnQgcGFnZSBVUkxcbiAgICAgIHZhciBjdXJyaWQgPSB1cmwucGFyYW0oJ2lkJyk7XG4gICAgICBpZiAoaWRoYXNoID09IG51bGwpIHtcbiAgICAgICAgICBpZGhhc2ggPSB7fTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlkcyA9IFtdO1xuICAgICAgZm9yICh2YXIgaWQgaW4gaWRoYXNoKSB7XG4gICAgICAgICAgaWYgKGlkaGFzaC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgaWRzLnB1c2goaWQpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChpZHMuaW5kZXhPZihjdXJyaWQpIDwgMCkgfHwgZGVidWcpIHtcbiAgICAgICAgICBpZGhhc2hbY3VycmlkXSA9IDE7XG4gICAgICAgICAgLy8gc2Vzc2lvbiBjb29raWVcbiAgICAgICAgICAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgaWRoYXNoLCB7IGpzb24gOiB0cnVlLCBwYXRoOiAnLycsIGRvbWFpbjogJy5oYXRoaXRydXN0Lm9yZycgfSk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBzaG93QWxlcnQoKSB7XG4gICAgICAgICAgICAgIHZhciBodG1sID0gJCgnI2FjY2Vzc0Jhbm5lcklEJykuaHRtbCgpO1xuICAgICAgICAgICAgICB2YXIgJGFsZXJ0ID0gYm9vdGJveC5kaWFsb2coaHRtbCwgW3sgbGFiZWw6IFwiT0tcIiwgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIiB9XSwgeyBoZWFkZXIgOiAnU3BlY2lhbCBhY2Nlc3MnLCByb2xlOiAnYWxlcnRkaWFsb2cnIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChzaG93QWxlcnQsIDMwMDAsIHRydWUpO1xuICAgICAgfVxuICB9XG5cbn0pIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4yLjIwMTcxMjEwXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmIChcblx0ICAgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TXG5cdCYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSlcbikge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgYmUgZW1wdHkuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0cmV0dXJuIH5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4gKyBcIlwiKTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmICghfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikpIHtcblx0XHRcdHRoaXMucHVzaCh0b2tlbik7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0XHQsIGluZGV4XG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0d2hpbGUgKH5pbmRleCkge1xuXHRcdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHR2YXIgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodG9rZW4gKyBcIlwiKTtcblx0aWYgKH5pbmRleCkge1xuXHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxLCByZXBsYWNlbWVudF90b2tlbik7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn1cbmNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbn07XG5cbmlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcblx0dmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuXHRcdCAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcblx0XHQsIGVudW1lcmFibGU6IHRydWVcblx0XHQsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHR9O1xuXHR0cnkge1xuXHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0fSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG5cdFx0Ly8gYWRkaW5nIHVuZGVmaW5lZCB0byBmaWdodCB0aGlzIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9pc3N1ZXMvMzZcblx0XHQvLyBtb2Rlcm5pZSBJRTgtTVNXNyBtYWNoaW5lIGhhcyBJRTggOC4wLjYwMDEuMTg3MDIgYW5kIGlzIGFmZmVjdGVkXG5cdFx0aWYgKGV4Lm51bWJlciA9PT0gdW5kZWZpbmVkIHx8IGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcblx0XHRcdGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcblx0XHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0XHR9XG5cdH1cbn0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuXHRlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xufVxuXG59KHNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdC8vIHJlcGxhY2UoKSBwb2x5ZmlsbFxuXHRpZiAoIShcInJlcGxhY2VcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKS5jbGFzc0xpc3QpKSB7XG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdG9rZW5zID0gdGhpcy50b1N0cmluZygpLnNwbGl0KFwiIFwiKVxuXHRcdFx0XHQsIGluZGV4ID0gdG9rZW5zLmluZGV4T2YodG9rZW4gKyBcIlwiKVxuXHRcdFx0O1xuXHRcdFx0aWYgKH5pbmRleCkge1xuXHRcdFx0XHR0b2tlbnMgPSB0b2tlbnMuc2xpY2UoaW5kZXgpO1xuXHRcdFx0XHR0aGlzLnJlbW92ZS5hcHBseSh0aGlzLCB0b2tlbnMpO1xuXHRcdFx0XHR0aGlzLmFkZChyZXBsYWNlbWVudF90b2tlbik7XG5cdFx0XHRcdHRoaXMuYWRkLmFwcGx5KHRoaXMsIHRva2Vucy5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gJ19fTkVXX18nOyAvLyBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG4gICAgICAgICR1bC5wYXJlbnRzKFwiZGl2XCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcblxuICAgICAgICAvLyAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX0gdG8geW91ciBsaXN0LmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIC8vICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI1BUYWRkSXRlbUJ0bicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuXG4gIC8vIGZvcmNlIENSTVMgdXNlcnMgdG8gYSBmaXhlZCBpbWFnZSBzaXplXG4gIEhULmZvcmNlX3NpemUgPSAyMDA7XG5cbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xudmFyIHBob3RvY29waWVyX21lc3NhZ2UgPSAnVGhlIGNvcHlyaWdodCBsYXcgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgKFRpdGxlIDE3LCBVLlMuIENvZGUpIGdvdmVybnMgdGhlIG1ha2luZyBvZiByZXByb2R1Y3Rpb25zIG9mIGNvcHlyaWdodGVkIG1hdGVyaWFsLiBVbmRlciBjZXJ0YWluIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBsYXcsIGxpYnJhcmllcyBhbmQgYXJjaGl2ZXMgYXJlIGF1dGhvcml6ZWQgdG8gZnVybmlzaCBhIHJlcHJvZHVjdGlvbi4gT25lIG9mIHRoZXNlIHNwZWNpZmljIGNvbmRpdGlvbnMgaXMgdGhhdCB0aGUgcmVwcm9kdWN0aW9uIGlzIG5vdCB0byBiZSDigJx1c2VkIGZvciBhbnkgcHVycG9zZSBvdGhlciB0aGFuIHByaXZhdGUgc3R1ZHksIHNjaG9sYXJzaGlwLCBvciByZXNlYXJjaC7igJ0gSWYgYSB1c2VyIG1ha2VzIGEgcmVxdWVzdCBmb3IsIG9yIGxhdGVyIHVzZXMsIGEgcmVwcm9kdWN0aW9uIGZvciBwdXJwb3NlcyBpbiBleGNlc3Mgb2Yg4oCcZmFpciB1c2Us4oCdIHRoYXQgdXNlciBtYXkgYmUgbGlhYmxlIGZvciBjb3B5cmlnaHQgaW5mcmluZ2VtZW50Lic7XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgIH0sXG5cbiAgICBleHBsYWluUGRmQWNjZXNzOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBodG1sID0gJChcIiNub0Rvd25sb2FkQWNjZXNzXCIpLmh0bWwoKTtcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgne0RPV05MT0FEX0xJTkt9JywgJCh0aGlzKS5hdHRyKFwiaHJlZlwiKSk7XG4gICAgICAgIHRoaXMuJGRpYWxvZyA9IGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihjb25maWcpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIHNlbGYuc3JjID0gY29uZmlnLnNyYztcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gY29uZmlnLml0ZW1fdGl0bGU7XG4gICAgICAgIHNlbGYuJGNvbmZpZyA9IGNvbmZpZztcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cImluaXRpYWxcIj48cD5TZXR0aW5nIHVwIHRoZSBkb3dubG9hZC4uLjwvZGl2PmAgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJvZmZzY3JlZW5cIiByb2xlPVwic3RhdHVzXCIgYXJpYS1hdG9taWM9XCJ0cnVlXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFRpbWVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5XaGF0IGFmZmVjdHMgdGhlIGRvd25sb2FkIHNwZWVkPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5wYWdlcy5sZW5ndGg7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcyBidG4nLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgICAgICAgICAgICAgaWQ6ICdkb3dubG9hZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi4kc3RhdHVzID0gc2VsZi4kZGlhbG9nLmZpbmQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuXG4gICAgICAgIGlmICggc2VsZi4kY29uZmlnLnNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPiAwICkge1xuICAgICAgICAgICAgZGF0YVsnc2VxJ10gPSBzZWxmLiRjb25maWcuc2VsZWN0aW9uLnNlcTtcbiAgICAgICAgfVxuXG4gICAgICAgIHN3aXRjaCAoc2VsZi4kY29uZmlnLmRvd25sb2FkRm9ybWF0KSB7XG4gICAgICAgICAgICBjYXNlICdpbWFnZSc6XG4gICAgICAgICAgICAgICAgZGF0YVsnZm9ybWF0J10gPSAnaW1hZ2UvanBlZyc7XG4gICAgICAgICAgICAgICAgZGF0YVsndGFyZ2V0X3BwaSddID0gMzAwO1xuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd6aXAnO1xuICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgY2FzZSAncGxhaW50ZXh0LXppcCc6XG4gICAgICAgICAgICAgICAgZGF0YVsnYnVuZGxlX2Zvcm1hdCddID0gJ3ppcCc7XG4gICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICBjYXNlICdwbGFpbnRleHQnOlxuICAgICAgICAgICAgICAgIGRhdGFbJ2J1bmRsZV9mb3JtYXQnXSA9ICd0ZXh0JztcbiAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgfVxuXG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHNlbGYuc3JjLnJlcGxhY2UoLzsvZywgJyYnKSArICcmY2FsbGJhY2s9SFQuZG93bmxvYWRlci5zdGFydERvd25sb2FkTW9uaXRvcicsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIFNUQVJUVVAgTk9UIERFVEVDVEVEXCIpO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nICkgeyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQyOSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKHJlcSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRG93bmxvYWQ6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzdGFydERvd25sb2FkTW9uaXRvcjogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFMUkVBRFkgUE9MTElOR1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucGRmLnByb2dyZXNzX3VybCA9IHByb2dyZXNzX3VybDtcbiAgICAgICAgc2VsZi5wZGYuZG93bmxvYWRfdXJsID0gZG93bmxvYWRfdXJsO1xuICAgICAgICBzZWxmLnBkZi50b3RhbCA9IHRvdGFsO1xuXG4gICAgICAgIHNlbGYuaXNfcnVubmluZyA9IHRydWU7XG4gICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCA9IDA7XG4gICAgICAgIHNlbGYuaSA9IDA7XG5cbiAgICAgICAgc2VsZi50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBzZWxmLmNoZWNrU3RhdHVzKCk7IH0sIDI1MDApO1xuICAgICAgICAvLyBkbyBpdCBvbmNlIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIHNlbGYuY2hlY2tTdGF0dXMoKTtcblxuICAgIH0sXG5cbiAgICBjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5pICs9IDE7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBzZWxmLnBkZi5wcm9ncmVzc191cmwsXG4gICAgICAgICAgICBkYXRhIDogeyB0cyA6IChuZXcgRGF0ZSkuZ2V0VGltZSgpIH0sXG4gICAgICAgICAgICBjYWNoZSA6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHNlbGYudXBkYXRlUHJvZ3Jlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMuZG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICYmIHN0YXR1cy5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVByb2Nlc3NFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFJTEVEOiBcIiwgcmVxLCBcIi9cIiwgdGV4dFN0YXR1cywgXCIvXCIsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MDQgJiYgKHNlbGYuaSA+IDI1IHx8IHNlbGYubnVtX3Byb2Nlc3NlZCA+IDApICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgdXBkYXRlUHJvZ3Jlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdHVzID0geyBkb25lIDogZmFsc2UsIGVycm9yIDogZmFsc2UgfTtcbiAgICAgICAgdmFyIHBlcmNlbnQ7XG5cbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkYXRhLnN0YXR1cztcbiAgICAgICAgaWYgKCBjdXJyZW50ID09ICdFT1QnIHx8IGN1cnJlbnQgPT0gJ0RPTkUnICkge1xuICAgICAgICAgICAgc3RhdHVzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkYXRhLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDAgKiAoIGN1cnJlbnQgLyBzZWxmLnBkZi50b3RhbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLmxhc3RfcGVyY2VudCAhPSBwZXJjZW50ICkge1xuICAgICAgICAgICAgc2VsZi5sYXN0X3BlcmNlbnQgPSBwZXJjZW50O1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSAxMDAgdGltZXMsIHdoaWNoIGFtb3VudHMgdG8gfjEwMCBzZWNvbmRzXG4gICAgICAgIGlmICggc2VsZi5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmlzKFwiOnZpc2libGVcIikgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPlBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmJhclwiKS5jc3MoeyB3aWR0aCA6IHBlcmNlbnQgKyAnJSd9KTtcblxuICAgICAgICBpZiAoIHBlcmNlbnQgPT0gMTAwICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuICAgICAgICAgICAgdmFyIGRvd25sb2FkX2tleSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTWFjIE9TIFgnKSAhPSAtMSA/ICdSRVRVUk4nIDogJ0VOVEVSJztcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5TZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLjwvc3Bhbj48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuYCk7XG5cbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIiBkb3dubG9hZD1cImRvd25sb2FkXCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgaWYgKCAkZG93bmxvYWRfYnRuLmdldCgwKS5kb3dubG9hZCA9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuXG4gICAgICAgICAgICAgICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgXG4gICAgICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICctJywgXG4gICAgICAgICAgICAgICAgICAgICAgICBjYXRlZ29yeSA6ICdQVCcsIFxuICAgICAgICAgICAgICAgICAgICAgICAgYWN0aW9uIDogYFBUIERvd25sb2FkIC0gJHtzZWxmLiRjb25maWcuZG93bmxvYWRGb3JtYXQudG9VcHBlckNhc2UoKX0gLSAke3NlbGYuJGNvbmZpZy50cmFja2luZ0FjdGlvbn1gIFxuICAgICAgICAgICAgICAgICAgICB9KTtcblxuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFByZXNzIHJldHVybiB0byBkb3dubG9hZC5gKTtcbiAgICAgICAgICAgIC8vIHN0aWxsIGNvdWxkIGNhbmNlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS50ZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfSAoJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWQpLmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGAke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1c1RleHQ6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYuX2xhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgICAgaWYgKCBzZWxmLl9sYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChzZWxmLl9sYXN0VGltZXIpOyBzZWxmLl9sYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2VsZi5fbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICBzZWxmLl9sYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICB9XG4gICAgfSxcblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbnZhciBkb3dubG9hZEZvcm07XG52YXIgZG93bmxvYWRGb3JtYXRPcHRpb25zO1xudmFyIHJhbmdlT3B0aW9ucztcbnZhciBkb3dubG9hZElkeCA9IDA7XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBub24tanF1ZXJ5P1xuICAgIGRvd25sb2FkRm9ybSA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJyNmb3JtLWRvd25sb2FkLW1vZHVsZScpO1xuICAgIGRvd25sb2FkRm9ybWF0T3B0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdpbnB1dFtuYW1lPVwiZG93bmxvYWRfZm9ybWF0XCJdJykpO1xuICAgIHJhbmdlT3B0aW9ucyA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yQWxsKCdbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0XScpKTtcblxuICAgIHZhciBkb3dubG9hZFN1Ym1pdCA9IGRvd25sb2FkRm9ybS5xdWVyeVNlbGVjdG9yKCdbdHlwZT1cInN1Ym1pdFwiXScpO1xuXG4gICAgdmFyIGhhc0Z1bGxQZGZBY2Nlc3MgPSBkb3dubG9hZEZvcm0uZGF0YXNldC5mdWxsUGRmQWNjZXNzID09ICdhbGxvdyc7XG5cbiAgICB2YXIgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMgPSBmdW5jdGlvbihvcHRpb24pIHtcbiAgICAgIHJhbmdlT3B0aW9ucy5mb3JFYWNoKGZ1bmN0aW9uKHJhbmdlT3B0aW9uKSB7XG4gICAgICAgIHZhciBpbnB1dCA9IHJhbmdlT3B0aW9uLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0LmRpc2FibGVkID0gISByYW5nZU9wdGlvbi5tYXRjaGVzKGBbZGF0YS1kb3dubG9hZC1mb3JtYXQtdGFyZ2V0fj1cIiR7b3B0aW9uLnZhbHVlfVwiXWApO1xuICAgICAgfSlcbiAgICAgIFxuICAgICAgaWYgKCAhIGhhc0Z1bGxQZGZBY2Nlc3MgKSB7XG4gICAgICAgIHZhciBjaGVja2VkID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtIVC5yZWFkZXIudmlldy5uYW1lfVwiXSBpbnB1dDpjaGVja2VkYCk7XG4gICAgICAgIGlmICggISBjaGVja2VkICkge1xuICAgICAgICAgICAgLy8gY2hlY2sgdGhlIGZpcnN0IG9uZVxuICAgICAgICAgICAgdmFyIGlucHV0ID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoYFtkYXRhLWRvd25sb2FkLWZvcm1hdC10YXJnZXRdW2RhdGEtdmlldy10YXJnZXR+PVwiJHtIVC5yZWFkZXIudmlldy5uYW1lfVwiXSBpbnB1dGApO1xuICAgICAgICAgICAgaW5wdXQuY2hlY2tlZCA9IHRydWU7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gICAgZG93bmxvYWRGb3JtYXRPcHRpb25zLmZvckVhY2goZnVuY3Rpb24ob3B0aW9uKSB7XG4gICAgICBvcHRpb24uYWRkRXZlbnRMaXN0ZW5lcignY2hhbmdlJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnModGhpcyk7XG4gICAgICB9KVxuICAgIH0pXG5cbiAgICByYW5nZU9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihkaXYpIHtcbiAgICAgICAgdmFyIGlucHV0ID0gZGl2LnF1ZXJ5U2VsZWN0b3IoJ2lucHV0Jyk7XG4gICAgICAgIGlucHV0LmFkZEV2ZW50TGlzdGVuZXIoJ2NoYW5nZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICBkb3dubG9hZEZvcm1hdE9wdGlvbnMuZm9yRWFjaChmdW5jdGlvbihmb3JtYXRPcHRpb24pIHtcbiAgICAgICAgICAgICAgICBmb3JtYXRPcHRpb24uZGlzYWJsZWQgPSAhICggZGl2LmRhdGFzZXQuZG93bmxvYWRGb3JtYXRUYXJnZXQuaW5kZXhPZihmb3JtYXRPcHRpb24udmFsdWUpID4gLTEgKTtcbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0pXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIudXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIGZvcm1hdE9wdGlvbiA9IGRvd25sb2FkRm9ybWF0T3B0aW9ucy5maW5kKGlucHV0ID0+IGlucHV0LmNoZWNrZWQpO1xuICAgICAgICB1cGRhdGVEb3dubG9hZEZvcm1hdFJhbmdlT3B0aW9ucyhmb3JtYXRPcHRpb24pO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgdG8gUERGXG4gICAgdmFyIHBkZkZvcm1hdE9wdGlvbiA9IGRvd25sb2FkRm9ybWF0T3B0aW9ucy5maW5kKGlucHV0ID0+IGlucHV0LnZhbHVlID09ICdwZGYnKTtcbiAgICBwZGZGb3JtYXRPcHRpb24uY2hlY2tlZCA9IHRydWU7XG4gICAgdXBkYXRlRG93bmxvYWRGb3JtYXRSYW5nZU9wdGlvbnMocGRmRm9ybWF0T3B0aW9uKTtcblxuICAgIHZhciB0dW5uZWxGb3JtID0gZG9jdW1lbnQucXVlcnlTZWxlY3RvcignI3R1bm5lbC1kb3dubG9hZC1tb2R1bGUnKTtcblxuICAgIGRvd25sb2FkRm9ybS5hZGRFdmVudExpc3RlbmVyKCdzdWJtaXQnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgZm9ybWF0T3B0aW9uID0gZG93bmxvYWRGb3JtLnF1ZXJ5U2VsZWN0b3IoJ2lucHV0W25hbWU9XCJkb3dubG9hZF9mb3JtYXRcIl06Y2hlY2tlZCcpO1xuICAgICAgICB2YXIgcmFuZ2VPcHRpb24gPSBkb3dubG9hZEZvcm0ucXVlcnlTZWxlY3RvcignaW5wdXRbbmFtZT1cInJhbmdlXCJdOmNoZWNrZWQ6bm90KDpkaXNhYmxlZCknKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlO1xuXG4gICAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuXG4gICAgICAgIGlmICggISByYW5nZU9wdGlvbiApIHtcbiAgICAgICAgICAgIC8vIG5vIHZhbGlkIHJhbmdlIG9wdGlvbiB3YXMgY2hvc2VuXG4gICAgICAgICAgICBhbGVydChcIlBsZWFzZSBjaG9vc2UgYSB2YWxpZCByYW5nZSBmb3IgdGhpcyBkb3dubG9hZCBmb3JtYXQuXCIpO1xuICAgICAgICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBhY3Rpb24gPSB0dW5uZWxGb3JtLmRhdGFzZXQuYWN0aW9uVGVtcGxhdGUgKyAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAncGxhaW50ZXh0LXppcCcgPyAncGxhaW50ZXh0JyA6IGZvcm1hdE9wdGlvbi52YWx1ZSApO1xuXG4gICAgICAgIHZhciBzZWxlY3Rpb24gPSB7IHBhZ2VzOiBbXSB9O1xuICAgICAgICBpZiAoIHJhbmdlT3B0aW9uLnZhbHVlID09ICdzZWxlY3RlZC1wYWdlcycgKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24ucGFnZXMgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICBzZWxlY3Rpb24uaXNTZWxlY3Rpb24gPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCBzZWxlY3Rpb24ucGFnZXMubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIGRvd25sb2FkLjwvcD5cIiBdO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYmUgbGlzdGVkIGluIHRoZSBkb3dubG9hZCBtb2R1bGUuXCIpO1xuXG4gICAgICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG5cbiAgICAgICAgICAgICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSBlbHNlIGlmICggcmFuZ2VPcHRpb24udmFsdWUuaW5kZXhPZignY3VycmVudC1wYWdlJykgPiAtMSApIHtcbiAgICAgICAgICAgIHZhciBwYWdlO1xuICAgICAgICAgICAgc3dpdGNoKHJhbmdlT3B0aW9uLnZhbHVlKSB7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCkgXTtcbiAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgY2FzZSAnY3VycmVudC1wYWdlLXZlcnNvJzpcbiAgICAgICAgICAgICAgICAgICAgcGFnZSA9IFsgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCdWRVJTTycpIF07XG4gICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgIGNhc2UgJ2N1cnJlbnQtcGFnZS1yZWN0byc6XG4gICAgICAgICAgICAgICAgICAgIHBhZ2UgPSBbIEhULnJlYWRlci52aWV3LmN1cnJlbnRMb2NhdGlvbignUkVDVE8nKSBdO1xuICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICggISBwYWdlICkge1xuICAgICAgICAgICAgICAgIC8vIHByb2JhYmx5IGltcG9zc2libGU/XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxlY3Rpb24ucGFnZXMgPSBbIHBhZ2UgXTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA+IDAgKSB7XG4gICAgICAgICAgICBzZWxlY3Rpb24uc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvciA/XG4gICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihzZWxlY3Rpb24ucGFnZXMpIDogXG4gICAgICAgICAgICAgICAgIHNlbGVjdGlvbi5wYWdlcztcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggcmFuZ2VPcHRpb24uZGF0YXNldC5pc1BhcnRpYWwgPT0gJ3RydWUnICYmIHNlbGVjdGlvbi5wYWdlcy5sZW5ndGggPD0gMTAgKSB7XG5cbiAgICAgICAgICAgIC8vIGRlbGV0ZSBhbnkgZXhpc3RpbmcgaW5wdXRzXG4gICAgICAgICAgICB0dW5uZWxGb3JtLnF1ZXJ5U2VsZWN0b3JBbGwoJ2lucHV0Om5vdChbZGF0YS1maXhlZF0pJykuZm9yRWFjaChmdW5jdGlvbihpbnB1dCkge1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0ucmVtb3ZlQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgaWYgKCBmb3JtYXRPcHRpb24udmFsdWUgPT0gJ2ltYWdlJyApIHtcbiAgICAgICAgICAgICAgICB2YXIgc2l6ZV9hdHRyID0gXCJ0YXJnZXRfcHBpXCI7XG4gICAgICAgICAgICAgICAgdmFyIGltYWdlX2Zvcm1hdF9hdHRyID0gJ2Zvcm1hdCc7XG4gICAgICAgICAgICAgICAgdmFyIHNpemVfdmFsdWUgPSBcIjMwMFwiO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZWN0aW9uLnBhZ2VzLmxlbmd0aCA9PSAxICkge1xuICAgICAgICAgICAgICAgICAgICAvLyBzbGlnaHQgZGlmZmVyZW5jZVxuICAgICAgICAgICAgICAgICAgICBhY3Rpb24gPSAnL2NnaS9pbWdzcnYvaW1hZ2UnO1xuICAgICAgICAgICAgICAgICAgICBzaXplX2F0dHIgPSBcInNpemVcIjtcbiAgICAgICAgICAgICAgICAgICAgc2l6ZV92YWx1ZSA9IFwicHBpOjMwMFwiO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbnB1dCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoJ2lucHV0Jyk7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidHlwZVwiLCBcImhpZGRlblwiKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJuYW1lXCIsIHNpemVfYXR0cik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgc2l6ZV92YWx1ZSk7XG4gICAgICAgICAgICAgICAgdHVubmVsRm9ybS5hcHBlbmRDaGlsZChpbnB1dCk7XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcInR5cGVcIiwgXCJoaWRkZW5cIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwibmFtZVwiLCBpbWFnZV9mb3JtYXRfYXR0cik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgJ2ltYWdlL2pwZWcnKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGZvcm1hdE9wdGlvbi52YWx1ZSA9PSAncGxhaW50ZXh0LXppcCcgKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgJ2J1bmRsZV9mb3JtYXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ2YWx1ZVwiLCBcInppcFwiKTtcbiAgICAgICAgICAgICAgICB0dW5uZWxGb3JtLmFwcGVuZENoaWxkKGlucHV0KTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgc2VsZWN0aW9uLnNlcS5mb3JFYWNoKGZ1bmN0aW9uKHJhbmdlKSB7XG4gICAgICAgICAgICAgICAgdmFyIGlucHV0ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaW5wdXQnKTtcbiAgICAgICAgICAgICAgICBpbnB1dC5zZXRBdHRyaWJ1dGUoXCJ0eXBlXCIsIFwiaGlkZGVuXCIpO1xuICAgICAgICAgICAgICAgIGlucHV0LnNldEF0dHJpYnV0ZShcIm5hbWVcIiwgXCJzZXFcIik7XG4gICAgICAgICAgICAgICAgaW5wdXQuc2V0QXR0cmlidXRlKFwidmFsdWVcIiwgcmFuZ2UpO1xuICAgICAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQoaW5wdXQpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgdHVubmVsRm9ybS5hY3Rpb24gPSBhY3Rpb247XG4gICAgICAgICAgICAvLyBIVC5kaXNhYmxlVW5sb2FkVGltZW91dCA9IHRydWU7XG5cbiAgICAgICAgICAgIC8vIHJlbW92ZSBvbGQgaWZyYW1lc1xuICAgICAgICAgICAgZG9jdW1lbnQucXVlcnlTZWxlY3RvckFsbCgnaWZyYW1lLmRvd25sb2FkLW1vZHVsZScpLmZvckVhY2goZnVuY3Rpb24oaWZyYW1lKSB7XG4gICAgICAgICAgICAgICAgZG9jdW1lbnQuYm9keS5yZW1vdmVDaGlsZChpZnJhbWUpO1xuICAgICAgICAgICAgfSlcblxuICAgICAgICAgICAgZG93bmxvYWRJZHggKz0gMTtcbiAgICAgICAgICAgIHZhciB0cmFja2VyID0gYEQke2Rvd25sb2FkSWR4fTpgO1xuICAgICAgICAgICAgdmFyIHRyYWNrZXJfaW5wdXQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KCdpbnB1dCcpO1xuICAgICAgICAgICAgdHJhY2tlcl9pbnB1dC5zZXRBdHRyaWJ1dGUoJ3R5cGUnLCAnaGlkZGVuJyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgnbmFtZScsICd0cmFja2VyJyk7XG4gICAgICAgICAgICB0cmFja2VyX2lucHV0LnNldEF0dHJpYnV0ZSgndmFsdWUnLCB0cmFja2VyKTtcbiAgICAgICAgICAgIHR1bm5lbEZvcm0uYXBwZW5kQ2hpbGQodHJhY2tlcl9pbnB1dCk7XG4gICAgICAgICAgICB2YXIgaWZyYW1lID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudCgnaWZyYW1lJyk7XG4gICAgICAgICAgICBpZnJhbWUuc2V0QXR0cmlidXRlKCduYW1lJywgYGRvd25sb2FkLW1vZHVsZS0ke2Rvd25sb2FkSWR4fWApO1xuICAgICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgICAgaWZyYW1lLnNldEF0dHJpYnV0ZSgnY2xhc3MnLCAnZG93bmxvYWQtbW9kdWxlJyk7XG4gICAgICAgICAgICBpZnJhbWUuc3R5bGUub3BhY2l0eSA9IDA7XG4gICAgICAgICAgICBkb2N1bWVudC5ib2R5LmFwcGVuZENoaWxkKGlmcmFtZSk7XG4gICAgICAgICAgICB0dW5uZWxGb3JtLnNldEF0dHJpYnV0ZSgndGFyZ2V0JywgaWZyYW1lLmdldEF0dHJpYnV0ZSgnbmFtZScpKTtcblxuICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuZGlzYWJsZWQgPSB0cnVlO1xuICAgICAgICAgICAgZG93bmxvYWRTdWJtaXQuY2xhc3NMaXN0LmFkZCgnYnRuLWxvYWRpbmcnKTtcblxuICAgICAgICAgICAgdmFyIHRyYWNrZXJJbnRlcnZhbCA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIHZhciB2YWx1ZSA9ICQuY29va2llKCd0cmFja2VyJykgfHwgJyc7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5pc19kZXYgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0/XCIsIHRyYWNrZXIsIHZhbHVlKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCB2YWx1ZS5pbmRleE9mKHRyYWNrZXIpID4gLTEgKSB7XG4gICAgICAgICAgICAgICAgICAgICQucmVtb3ZlQ29va2llKCd0cmFja2VyJywgeyBwYXRoOiAnLyd9KTtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0cmFja2VySW50ZXJ2YWwpO1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5jbGFzc0xpc3QucmVtb3ZlKCdidG4tbG9hZGluZycpO1xuICAgICAgICAgICAgICAgICAgICBkb3dubG9hZFN1Ym1pdC5kaXNhYmxlZCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICBIVC5kaXNhYmxlVW5sb2FkVGltZW91dCA9IGZhbHNlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sIDEwMCk7XG5cbiAgICAgICAgICAgIHR1bm5lbEZvcm0uc3VibWl0KCk7XG5cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBfZm9ybWF0X3RpdGxlcyA9IHt9O1xuICAgICAgICBfZm9ybWF0X3RpdGxlcy5wZGYgPSAnUERGJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMuZXB1YiA9ICdFUFVCJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXMucGxhaW50ZXh0ID0gJ1RleHQgKC50eHQpJztcbiAgICAgICAgX2Zvcm1hdF90aXRsZXNbJ3BsYWludGV4dC16aXAnXSA9ICdUZXh0ICguemlwKSc7XG4gICAgICAgIF9mb3JtYXRfdGl0bGVzLmltYWdlID0gJ0ltYWdlIChKUEVHKSc7XG5cbiAgICAgICAgLy8gaW52b2tlIHRoZSBkb3dubG9hZGVyXG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYoe1xuICAgICAgICAgICAgc3JjOiBhY3Rpb24gKyAnP2lkPScgKyBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICBpdGVtX3RpdGxlOiBfZm9ybWF0X3RpdGxlc1tmb3JtYXRPcHRpb24udmFsdWVdLFxuICAgICAgICAgICAgc2VsZWN0aW9uOiBzZWxlY3Rpb24sXG4gICAgICAgICAgICBkb3dubG9hZEZvcm1hdDogZm9ybWF0T3B0aW9uLnZhbHVlLFxuICAgICAgICAgICAgdHJhY2tpbmdBY3Rpb246IHJhbmdlT3B0aW9uLnZhbHVlXG4gICAgICAgIH0pO1xuXG4gICAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9KVxuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHQ7XG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vayAnICtcbiAgICAgICAgICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgICAgICAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PGkgY2xhc3M9XCJpY29tb29uIGljb21vb24taGVscFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPkhlbHA6IEVtYmVkZGluZyBIYXRoaVRydXN0IEJvb2tzPC9zcGFuPjwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LXNjcm9sbFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctc2Nyb2xsXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LWZsaXBcIiB2YWx1ZT1cIjFcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1mbGlwXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWJvb2stYWx0MlwiLz4gRmxpcCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZm9ybT4nICtcbiAgICAnPC9kaXY+J1xuICAgICk7XG5cblxuICAgIC8vICQoXCIjZW1iZWRIdG1sXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI2VtYmVkSHRtbCcsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfVxuICAgIF0pO1xuXG4gICAgICAgIC8vIEN1c3RvbSB3aWR0aCBmb3IgYm91bmRpbmcgJy5tb2RhbCcgXG4gICAgICAgICRibG9jay5jbG9zZXN0KCcubW9kYWwnKS5hZGRDbGFzcyhcImJvb3Rib3hNZWRpdW1XaWR0aFwiKTtcblxuICAgICAgICAvLyBTZWxlY3QgZW50aXJldHkgb2YgY29kZWJsb2NrIGZvciBlYXN5IGNvcHlpbmdcbiAgICAgICAgdmFyIHRleHRhcmVhID0gJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWNvZGVibG9ja11cIik7XG4gICAgdGV4dGFyZWEub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IGNvZGVibG9jayB0byBvbmUgb2YgdHdvIHZpZXdzIFxuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctc2Nyb2xsXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LWZsaXBcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9sb25nLCBzaWRlX3Nob3J0KSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGZlZWRiYWNrIHN5c3RlbVxudmFyIEhUID0gSFQgfHwge307XG5IVC5mZWVkYmFjayA9IHt9O1xuSFQuZmVlZGJhY2suZGlhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPVxuICAgICAgICAnPGZvcm0+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPkVtYWlsIEFkZHJlc3M8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGxhYmVsIGZvcj1cImVtYWlsXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5FTWFpbCBBZGRyZXNzPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBwbGFjZWhvbGRlcj1cIltZb3VyIGVtYWlsIGFkZHJlc3NdXCIgbmFtZT1cImVtYWlsXCIgaWQ9XCJlbWFpbFwiIC8+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPldlIHdpbGwgbWFrZSBldmVyeSBlZmZvcnQgdG8gYWRkcmVzcyBjb3B5cmlnaHQgaXNzdWVzIGJ5IHRoZSBuZXh0IGJ1c2luZXNzIGRheSBhZnRlciBub3RpZmljYXRpb24uPC9zcGFuPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPk92ZXJhbGwgcGFnZSByZWFkYWJpbGl0eSBhbmQgcXVhbGl0eTwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiB2YWx1ZT1cInJlYWRhYmxlXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIE1pc3NpbmcgcGFydHMgb2YgdGhlIHBhZ2UnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQmx1cnJ5IHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjdXJ2ZWRcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgVGhpcyBpdGVtIGlzIGluIHRoZSBwdWJsaWMgZG9tYWluLCBidXQgSSBkb25cXCd0IGhhdmUgYWNjZXNzIHRvIGl0LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwiYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAgICAgSSBoYXZlIGFjY2VzcyB0byB0aGlzIGl0ZW0sIGJ1dCBzaG91bGQgbm90LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm47XG5cbiAgICB2YXIgaW5pdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuXG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dC5zZWFyY2gtaW5wdXQtdGV4dFwiKTtcbiAgICB2YXIgJGlucHV0X2xhYmVsID0gJGZvcm0uZmluZChcImxhYmVsW2Zvcj0ncTEtaW5wdXQnXVwiKTtcbiAgICB2YXIgJHNlbGVjdCA9ICRmb3JtLmZpbmQoXCIuY29udHJvbC1zZWFyY2h0eXBlXCIpO1xuICAgIHZhciAkc2VhcmNoX3RhcmdldCA9ICRmb3JtLmZpbmQoXCIuc2VhcmNoLXRhcmdldFwiKTtcbiAgICB2YXIgJGZ0ID0gJGZvcm0uZmluZChcInNwYW4uZnVua3ktZnVsbC12aWV3XCIpO1xuXG4gICAgdmFyICRiYWNrZHJvcCA9IG51bGw7XG5cbiAgICB2YXIgJGFjdGlvbiA9ICQoXCIjYWN0aW9uLXNlYXJjaC1oYXRoaXRydXN0XCIpO1xuICAgICRhY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvb3Rib3guc2hvdygnc2VhcmNoLW1vZGFsJywge1xuICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgICAgICAgICRpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuXG4gICAgdmFyIF9zZXR1cCA9IHt9O1xuICAgIF9zZXR1cC5scyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LmhpZGUoKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCBvciB3aXRoaW4gdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggZnVsbC10ZXh0IGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgZnVsbC10ZXh0IGluZGV4LlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zZXR1cC5jYXRhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3Quc2hvdygpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGNhdGFsb2cgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBjYXRhbG9nIGluZGV4OyB5b3UgY2FuIGxpbWl0IHlvdXIgc2VhcmNoIHRvIGEgc2VsZWN0aW9uIG9mIGZpZWxkcy5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ID0gJHNlYXJjaF90YXJnZXQuZmluZChcImlucHV0OmNoZWNrZWRcIikudmFsKCk7XG4gICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICBpbml0ZWQgPSB0cnVlO1xuXG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgaWYgKCBwcmVmcy5zZWFyY2ggJiYgcHJlZnMuc2VhcmNoLmZ0ICkge1xuICAgICAgICAkKFwiaW5wdXRbbmFtZT1mdF1cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuXG4gICAgJHNlYXJjaF90YXJnZXQub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPVwicmFkaW9cIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IGxhYmVsIDogXCItXCIsIGNhdGVnb3J5IDogXCJIVCBTZWFyY2hcIiwgYWN0aW9uIDogdGFyZ2V0IH0pO1xuICAgIH0pXG5cbiAgICAvLyAkZm9ybS5kZWxlZ2F0ZSgnOmlucHV0JywgJ2ZvY3VzIGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJGT0NVU0lOR1wiLCB0aGlzKTtcbiAgICAvLyAgICAgJGZvcm0uYWRkQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCA9PSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wID0gJCgnPGRpdiBjbGFzcz1cIm1vZGFsX19vdmVybGF5IGludmlzaWJsZVwiPjwvZGl2PicpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAkYmFja2Ryb3AuYXBwZW5kVG8oJChcImJvZHlcIikpLnNob3coKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJChcImJvZHlcIikub24oJ2ZvY3VzJywgJzppbnB1dCxhJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIC8vICAgICBpZiAoICEgJHRoaXMuY2xvc2VzdChcIi5uYXYtc2VhcmNoLWZvcm1cIikubGVuZ3RoICkge1xuICAgIC8vICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gdmFyIGNsb3NlX3NlYXJjaF9mb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRmb3JtLnJlbW92ZUNsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgIT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5kZXRhY2goKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5oaWRlKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhZGQgZXZlbnQgaGFuZGxlciBmb3Igc3VibWl0IHRvIGNoZWNrIGZvciBlbXB0eSBxdWVyeSBvciBhc3Rlcmlza1xuICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbihldmVudClcbiAgICAgICAgIHtcblxuICAgICAgICAgICAgaWYgKCAhIHRoaXMuY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy9jaGVjayBmb3IgYmxhbmsgb3Igc2luZ2xlIGFzdGVyaXNrXG4gICAgICAgICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpLmZpbmQoXCJpbnB1dFtuYW1lPXExXVwiKTtcbiAgICAgICAgICAgdmFyIHF1ZXJ5ID0gJGlucHV0LnZhbCgpO1xuICAgICAgICAgICBxdWVyeSA9ICQudHJpbShxdWVyeSk7XG4gICAgICAgICAgIGlmIChxdWVyeSA9PT0gJycpXG4gICAgICAgICAgIHtcbiAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBlbnRlciBhIHNlYXJjaCB0ZXJtLlwiKTtcbiAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcignYmx1cicpO1xuICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICAvLyAvLyAqICBCaWxsIHNheXMgZ28gYWhlYWQgYW5kIGZvcndhcmQgYSBxdWVyeSB3aXRoIGFuIGFzdGVyaXNrICAgIyMjIyMjXG4gICAgICAgICAgIC8vIGVsc2UgaWYgKHF1ZXJ5ID09PSAnKicpXG4gICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgLy8gICAvLyBjaGFuZ2UgcTEgdG8gYmxhbmtcbiAgICAgICAgICAgLy8gICAkKFwiI3ExLWlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgICAgICAvLyAgICQoXCIuc2VhcmNoLWZvcm1cIikuc3VibWl0KCk7XG4gICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjKlxuICAgICAgICAgICBlbHNlXG4gICAgICAgICAgIHtcblxuICAgICAgICAgICAgLy8gc2F2ZSBsYXN0IHNldHRpbmdzXG4gICAgICAgICAgICB2YXIgc2VhcmNodHlwZSA9ICggdGFyZ2V0ID09ICdscycgKSA/ICdhbGwnIDogJHNlbGVjdC5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICAgICAgSFQucHJlZnMuc2V0KHsgc2VhcmNoIDogeyBmdCA6ICQoXCJpbnB1dFtuYW1lPWZ0XTpjaGVja2VkXCIpLmxlbmd0aCA+IDAsIHRhcmdldCA6IHRhcmdldCwgc2VhcmNodHlwZTogc2VhcmNodHlwZSB9fSlcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgIH1cblxuICAgICB9ICk7XG5cbn0pXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgSFQuYW5hbHl0aWNzLmdldENvbnRlbnRHcm91cERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjaGVhdFxuICAgIHZhciBzdWZmaXggPSAnJztcbiAgICB2YXIgY29udGVudF9ncm91cCA9IDQ7XG4gICAgaWYgKCAkKFwiI3NlY3Rpb25cIikuZGF0YShcInZpZXdcIikgPT0gJ3Jlc3RyaWN0ZWQnICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDI7XG4gICAgICBzdWZmaXggPSAnI3Jlc3RyaWN0ZWQnO1xuICAgIH0gZWxzZSBpZiAoIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoXCJkZWJ1Zz1zdXBlclwiKSA+IC0xICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDM7XG4gICAgICBzdWZmaXggPSAnI3N1cGVyJztcbiAgICB9XG4gICAgcmV0dXJuIHsgaW5kZXggOiBjb250ZW50X2dyb3VwLCB2YWx1ZSA6IEhULnBhcmFtcy5pZCArIHN1ZmZpeCB9O1xuXG4gIH1cblxuICBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYgPSBmdW5jdGlvbihocmVmKSB7XG4gICAgdmFyIHVybCA9ICQudXJsKGhyZWYpO1xuICAgIHZhciBuZXdfaHJlZiA9IHVybC5zZWdtZW50KCk7XG4gICAgbmV3X2hyZWYucHVzaCgkKFwiaHRtbFwiKS5kYXRhKCdjb250ZW50LXByb3ZpZGVyJykpO1xuICAgIG5ld19ocmVmLnB1c2godXJsLnBhcmFtKFwiaWRcIikpO1xuICAgIHZhciBxcyA9ICcnO1xuICAgIGlmICggbmV3X2hyZWYuaW5kZXhPZihcInNlYXJjaFwiKSA+IC0xICYmIHVybC5wYXJhbSgncTEnKSAgKSB7XG4gICAgICBxcyA9ICc/cTE9JyArIHVybC5wYXJhbSgncTEnKTtcbiAgICB9XG4gICAgbmV3X2hyZWYgPSBcIi9cIiArIG5ld19ocmVmLmpvaW4oXCIvXCIpICsgcXM7XG4gICAgcmV0dXJuIG5ld19ocmVmO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzLmdldFBhZ2VIcmVmID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZigpO1xuICB9XG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRtZW51OyB2YXIgJHRyaWdnZXI7IHZhciAkaGVhZGVyOyB2YXIgJG5hdmlnYXRvcjtcbiAgSFQgPSBIVCB8fCB7fTtcblxuICBIVC5tb2JpZnkgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGlmICggJChcImh0bWxcIikuaXMoXCIuZGVza3RvcFwiKSApIHtcbiAgICAvLyAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiZGVza3RvcFwiKS5yZW1vdmVDbGFzcyhcIm5vLW1vYmlsZVwiKTtcbiAgICAvLyB9XG5cbiAgICAkaGVhZGVyID0gJChcImhlYWRlclwiKTtcbiAgICAkbmF2aWdhdG9yID0gJChcIi5uYXZpZ2F0b3JcIik7XG4gICAgaWYgKCAkbmF2aWdhdG9yLmxlbmd0aCApIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gdHJ1ZTtcbiAgICAgICRuYXZpZ2F0b3IuZ2V0KDApLnN0eWxlLnNldFByb3BlcnR5KCctLWhlaWdodCcsIGAtJHskbmF2aWdhdG9yLm91dGVySGVpZ2h0KCkgKiAwLjkwfXB4YCk7XG4gICAgICAkbmF2aWdhdG9yLmdldCgwKS5kYXRhc2V0Lm9yaWdpbmFsSGVpZ2h0ID0gYHskbmF2aWdhdG9yLm91dGVySGVpZ2h0KCl9cHhgO1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLW5hdmlnYXRvci1oZWlnaHQnLCBgJHskbmF2aWdhdG9yLm91dGVySGVpZ2h0KCl9cHhgKTtcbiAgICAgIHZhciAkZXhwYW5kbyA9ICRuYXZpZ2F0b3IuZmluZChcIi5hY3Rpb24tZXhwYW5kb1wiKTtcbiAgICAgICRleHBhbmRvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKTtcbiAgICAgICAgdmFyIG5hdmlnYXRvckhlaWdodCA9IDA7XG4gICAgICAgIGlmICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICkge1xuICAgICAgICAgIG5hdmlnYXRvckhlaWdodCA9ICRuYXZpZ2F0b3IuZ2V0KDApLmRhdGFzZXQub3JpZ2luYWxIZWlnaHQ7XG4gICAgICAgIH1cbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLW5hdmlnYXRvci1oZWlnaHQnLCBuYXZpZ2F0b3JIZWlnaHQpO1xuICAgICAgfSlcblxuICAgICAgaWYgKCBIVC5wYXJhbXMudWkgPT0gJ2VtYmVkJyApIHtcbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJGV4cGFuZG8udHJpZ2dlcignY2xpY2snKTtcbiAgICAgICAgfSwgMTAwMCk7XG4gICAgICB9XG4gICAgfVxuXG4gICAgSFQuJG1lbnUgPSAkbWVudTtcblxuICAgIHZhciAkc2lkZWJhciA9ICQoXCIjc2lkZWJhclwiKTtcblxuICAgICR0cmlnZ2VyID0gJHNpZGViYXIuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKTtcblxuICAgICQoXCIjYWN0aW9uLW1vYmlsZS10b2dnbGUtZnVsbHNjcmVlblwiKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0pXG5cbiAgICBIVC51dGlscyA9IEhULnV0aWxzIHx8IHt9O1xuXG4gICAgLy8gJHNpZGViYXIub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnLnNpZGViYXItY29udGFpbmVyJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIC8vIGhpZGUgdGhlIHNpZGViYXJcbiAgICAgIHZhciAkdGhpcyA9ICQoZXZlbnQudGFyZ2V0KTtcbiAgICAgIGlmICggJHRoaXMuaXMoXCJpbnB1dFt0eXBlPSd0ZXh0J10sc2VsZWN0XCIpICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLnBhcmVudHMoXCIuZm9ybS1zZWFyY2gtdm9sdW1lXCIpLmxlbmd0aCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiLmZvcm0tZG93bmxvYWQtbW9kdWxlXCIpLmxlbmd0aCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5pcyhcImJ1dHRvbixhXCIpICkge1xuICAgICAgICBIVC50b2dnbGUoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG5cbiAgICAvLyAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG4gICAgLy8gfSlcblxuICAgIC8vICQod2luZG93KS5vbihcIm9yaWVudGF0aW9uY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG5cbiAgICAvLyAgICAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgLy8gICAgIH0sIDEwMCk7XG4gICAgLy8gfSlcbiAgICBpZiAoIEhUICYmIEhULnV0aWxzICYmIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlICkge1xuICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAndHJ1ZSc7XG4gIH1cblxuICBIVC50b2dnbGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuXG4gICAgLy8gJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAkKFwiLnNpZGViYXItY29udGFpbmVyXCIpLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIikuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC5zaWRlYmFyRXhwYW5kZWQgPSBzdGF0ZTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC52aWV3ID0gc3RhdGUgPyAnb3B0aW9ucycgOiAndmlld2VyJztcblxuICAgIC8vIHZhciB4bGlua19ocmVmO1xuICAgIC8vIGlmICggJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcpID09ICd0cnVlJyApIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWV4cGFuZGVkJztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtY29sbGFwc2VkJztcbiAgICAvLyB9XG4gICAgLy8gJHRyaWdnZXIuZmluZChcInN2ZyB1c2VcIikuYXR0cihcInhsaW5rOmhyZWZcIiwgeGxpbmtfaHJlZik7XG4gIH1cblxuICBzZXRUaW1lb3V0KEhULm1vYmlmeSwgMTAwMCk7XG5cbiAgdmFyIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoID0gJChcIiNzaWRlYmFyIC5zaWRlYmFyLXRvZ2dsZS1idXR0b25cIikub3V0ZXJIZWlnaHQoKSB8fCA0MDtcbiAgICB2YXIgdG9wID0gKCAkKFwiaGVhZGVyXCIpLmhlaWdodCgpICsgaCApICogMS4wNTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdG9vbGJhci1ob3Jpem9udGFsLXRvcCcsIHRvcCArICdweCcpO1xuICB9XG4gICQod2luZG93KS5vbigncmVzaXplJywgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5KTtcbiAgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5KCk7XG5cbiAgJChcImh0bWxcIikuZ2V0KDApLnNldEF0dHJpYnV0ZSgnZGF0YS1zaWRlYmFyLWV4cGFuZGVkJywgZmFsc2UpO1xuXG59KVxuIiwiaWYgKHR5cGVvZiBPYmplY3QuYXNzaWduICE9ICdmdW5jdGlvbicpIHtcbiAgLy8gTXVzdCBiZSB3cml0YWJsZTogdHJ1ZSwgZW51bWVyYWJsZTogZmFsc2UsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICBPYmplY3QuZGVmaW5lUHJvcGVydHkoT2JqZWN0LCBcImFzc2lnblwiLCB7XG4gICAgdmFsdWU6IGZ1bmN0aW9uIGFzc2lnbih0YXJnZXQsIHZhckFyZ3MpIHsgLy8gLmxlbmd0aCBvZiBmdW5jdGlvbiBpcyAyXG4gICAgICAndXNlIHN0cmljdCc7XG4gICAgICBpZiAodGFyZ2V0ID09IG51bGwpIHsgLy8gVHlwZUVycm9yIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgIHRocm93IG5ldyBUeXBlRXJyb3IoJ0Nhbm5vdCBjb252ZXJ0IHVuZGVmaW5lZCBvciBudWxsIHRvIG9iamVjdCcpO1xuICAgICAgfVxuXG4gICAgICB2YXIgdG8gPSBPYmplY3QodGFyZ2V0KTtcblxuICAgICAgZm9yICh2YXIgaW5kZXggPSAxOyBpbmRleCA8IGFyZ3VtZW50cy5sZW5ndGg7IGluZGV4KyspIHtcbiAgICAgICAgdmFyIG5leHRTb3VyY2UgPSBhcmd1bWVudHNbaW5kZXhdO1xuXG4gICAgICAgIGlmIChuZXh0U291cmNlICE9IG51bGwpIHsgLy8gU2tpcCBvdmVyIGlmIHVuZGVmaW5lZCBvciBudWxsXG4gICAgICAgICAgZm9yICh2YXIgbmV4dEtleSBpbiBuZXh0U291cmNlKSB7XG4gICAgICAgICAgICAvLyBBdm9pZCBidWdzIHdoZW4gaGFzT3duUHJvcGVydHkgaXMgc2hhZG93ZWRcbiAgICAgICAgICAgIGlmIChPYmplY3QucHJvdG90eXBlLmhhc093blByb3BlcnR5LmNhbGwobmV4dFNvdXJjZSwgbmV4dEtleSkpIHtcbiAgICAgICAgICAgICAgdG9bbmV4dEtleV0gPSBuZXh0U291cmNlW25leHRLZXldO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgfVxuICAgICAgcmV0dXJuIHRvO1xuICAgIH0sXG4gICAgd3JpdGFibGU6IHRydWUsXG4gICAgY29uZmlndXJhYmxlOiB0cnVlXG4gIH0pO1xufVxuXG4vLyBmcm9tOiBodHRwczovL2dpdGh1Yi5jb20vanNlcnovanNfcGllY2UvYmxvYi9tYXN0ZXIvRE9NL0NoaWxkTm9kZS9hZnRlcigpL2FmdGVyKCkubWRcbihmdW5jdGlvbiAoYXJyKSB7XG4gIGFyci5mb3JFYWNoKGZ1bmN0aW9uIChpdGVtKSB7XG4gICAgaWYgKGl0ZW0uaGFzT3duUHJvcGVydHkoJ2FmdGVyJykpIHtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgT2JqZWN0LmRlZmluZVByb3BlcnR5KGl0ZW0sICdhZnRlcicsIHtcbiAgICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZSxcbiAgICAgIGVudW1lcmFibGU6IHRydWUsXG4gICAgICB3cml0YWJsZTogdHJ1ZSxcbiAgICAgIHZhbHVlOiBmdW5jdGlvbiBhZnRlcigpIHtcbiAgICAgICAgdmFyIGFyZ0FyciA9IEFycmF5LnByb3RvdHlwZS5zbGljZS5jYWxsKGFyZ3VtZW50cyksXG4gICAgICAgICAgZG9jRnJhZyA9IGRvY3VtZW50LmNyZWF0ZURvY3VtZW50RnJhZ21lbnQoKTtcbiAgICAgICAgXG4gICAgICAgIGFyZ0Fyci5mb3JFYWNoKGZ1bmN0aW9uIChhcmdJdGVtKSB7XG4gICAgICAgICAgdmFyIGlzTm9kZSA9IGFyZ0l0ZW0gaW5zdGFuY2VvZiBOb2RlO1xuICAgICAgICAgIGRvY0ZyYWcuYXBwZW5kQ2hpbGQoaXNOb2RlID8gYXJnSXRlbSA6IGRvY3VtZW50LmNyZWF0ZVRleHROb2RlKFN0cmluZyhhcmdJdGVtKSkpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHRoaXMucGFyZW50Tm9kZS5pbnNlcnRCZWZvcmUoZG9jRnJhZywgdGhpcy5uZXh0U2libGluZyk7XG4gICAgICB9XG4gICAgfSk7XG4gIH0pO1xufSkoW0VsZW1lbnQucHJvdG90eXBlLCBDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZSwgRG9jdW1lbnRUeXBlLnByb3RvdHlwZV0pO1xuXG5mdW5jdGlvbiBSZXBsYWNlV2l0aFBvbHlmaWxsKCkge1xuICAndXNlLXN0cmljdCc7IC8vIEZvciBzYWZhcmksIGFuZCBJRSA+IDEwXG4gIHZhciBwYXJlbnQgPSB0aGlzLnBhcmVudE5vZGUsIGkgPSBhcmd1bWVudHMubGVuZ3RoLCBjdXJyZW50Tm9kZTtcbiAgaWYgKCFwYXJlbnQpIHJldHVybjtcbiAgaWYgKCFpKSAvLyBpZiB0aGVyZSBhcmUgbm8gYXJndW1lbnRzXG4gICAgcGFyZW50LnJlbW92ZUNoaWxkKHRoaXMpO1xuICB3aGlsZSAoaS0tKSB7IC8vIGktLSBkZWNyZW1lbnRzIGkgYW5kIHJldHVybnMgdGhlIHZhbHVlIG9mIGkgYmVmb3JlIHRoZSBkZWNyZW1lbnRcbiAgICBjdXJyZW50Tm9kZSA9IGFyZ3VtZW50c1tpXTtcbiAgICBpZiAodHlwZW9mIGN1cnJlbnROb2RlICE9PSAnb2JqZWN0Jyl7XG4gICAgICBjdXJyZW50Tm9kZSA9IHRoaXMub3duZXJEb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShjdXJyZW50Tm9kZSk7XG4gICAgfSBlbHNlIGlmIChjdXJyZW50Tm9kZS5wYXJlbnROb2RlKXtcbiAgICAgIGN1cnJlbnROb2RlLnBhcmVudE5vZGUucmVtb3ZlQ2hpbGQoY3VycmVudE5vZGUpO1xuICAgIH1cbiAgICAvLyB0aGUgdmFsdWUgb2YgXCJpXCIgYmVsb3cgaXMgYWZ0ZXIgdGhlIGRlY3JlbWVudFxuICAgIGlmICghaSkgLy8gaWYgY3VycmVudE5vZGUgaXMgdGhlIGZpcnN0IGFyZ3VtZW50IChjdXJyZW50Tm9kZSA9PT0gYXJndW1lbnRzWzBdKVxuICAgICAgcGFyZW50LnJlcGxhY2VDaGlsZChjdXJyZW50Tm9kZSwgdGhpcyk7XG4gICAgZWxzZSAvLyBpZiBjdXJyZW50Tm9kZSBpc24ndCB0aGUgZmlyc3RcbiAgICAgIHBhcmVudC5pbnNlcnRCZWZvcmUoY3VycmVudE5vZGUsIHRoaXMucHJldmlvdXNTaWJsaW5nKTtcbiAgfVxufVxuaWYgKCFFbGVtZW50LnByb3RvdHlwZS5yZXBsYWNlV2l0aClcbiAgICBFbGVtZW50LnByb3RvdHlwZS5yZXBsYWNlV2l0aCA9IFJlcGxhY2VXaXRoUG9seWZpbGw7XG5pZiAoIUNoYXJhY3RlckRhdGEucHJvdG90eXBlLnJlcGxhY2VXaXRoKVxuICAgIENoYXJhY3RlckRhdGEucHJvdG90eXBlLnJlcGxhY2VXaXRoID0gUmVwbGFjZVdpdGhQb2x5ZmlsbDtcbmlmICghRG9jdW1lbnRUeXBlLnByb3RvdHlwZS5yZXBsYWNlV2l0aCkgXG4gICAgRG9jdW1lbnRUeXBlLnByb3RvdHlwZS5yZXBsYWNlV2l0aCA9IFJlcGxhY2VXaXRoUG9seWZpbGw7XG5cbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkZm9ybSA9ICQoXCIuZm9ybS1zZWFyY2gtdm9sdW1lXCIpO1xuXG4gIHZhciAkYm9keSA9ICQoXCJib2R5XCIpO1xuXG4gICQod2luZG93KS5vbigndW5kby1sb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgJChcImJ1dHRvbi5idG4tbG9hZGluZ1wiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIikucmVtb3ZlQ2xhc3MoXCJidG4tbG9hZGluZ1wiKTtcbiAgfSlcblxuICAkKFwiYm9keVwiKS5vbignc3VibWl0JywgJ2Zvcm0uZm9ybS1zZWFyY2gtdm9sdW1lJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICBIVC5iZWZvcmVVbmxvYWRUaW1lb3V0ID0gMTUwMDA7XG4gICAgdmFyICRmb3JtXyA9ICQodGhpcyk7XG5cbiAgICB2YXIgJHN1Ym1pdCA9ICRmb3JtXy5maW5kKFwiYnV0dG9uW3R5cGU9c3VibWl0XVwiKTtcbiAgICBpZiAoICRzdWJtaXQuaGFzQ2xhc3MoXCJidG4tbG9hZGluZ1wiKSApIHtcbiAgICAgIGFsZXJ0KFwiWW91ciBzZWFyY2ggcXVlcnkgaGFzIGJlZW4gc3VibWl0dGVkIGFuZCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRpbnB1dCA9ICRmb3JtXy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XVwiKVxuICAgIGlmICggISAkLnRyaW0oJGlucHV0LnZhbCgpKSApIHtcbiAgICAgIGJvb3Rib3guYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSB0ZXJtIGluIHRoZSBzZWFyY2ggYm94LlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJHN1Ym1pdC5hZGRDbGFzcyhcImJ0bi1sb2FkaW5nXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICQod2luZG93KS50cmlnZ2VyKCd1bmRvLWxvYWRpbmcnKTtcbiAgICB9KVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgJiYgSFQucmVhZGVyLmNvbnRyb2xzLnNlYXJjaGluYXRvciApIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICByZXR1cm4gSFQucmVhZGVyLmNvbnRyb2xzLnNlYXJjaGluYXRvci5zdWJtaXQoJGZvcm1fLmdldCgwKSk7XG4gICAgfVxuXG4gICAgLy8gZGVmYXVsdCBwcm9jZXNzaW5nXG4gIH0pXG5cbiAgJChcIiNhY3Rpb24tc3RhcnQtanVtcFwiKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN6ID0gcGFyc2VJbnQoJCh0aGlzKS5kYXRhKCdzeicpLCAxMCk7XG4gICAgdmFyIHZhbHVlID0gcGFyc2VJbnQoJCh0aGlzKS52YWwoKSwgMTApO1xuICAgIHZhciBzdGFydCA9ICggdmFsdWUgLSAxICkgKiBzeiArIDE7XG4gICAgdmFyICRmb3JtXyA9ICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpO1xuICAgICRmb3JtXy5hcHBlbmQoYDxpbnB1dCBuYW1lPSdzdGFydCcgdHlwZT1cImhpZGRlblwiIHZhbHVlPVwiJHtzdGFydH1cIiAvPmApO1xuICAgICRmb3JtXy5hcHBlbmQoYDxpbnB1dCBuYW1lPSdzeicgdHlwZT1cImhpZGRlblwiIHZhbHVlPVwiJHtzen1cIiAvPmApO1xuICAgICRmb3JtXy5zdWJtaXQoKTtcbiAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyN2ZXJzaW9uSWNvbicsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
