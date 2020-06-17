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
"use strict";

head.ready(function () {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = "b";

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

        $(".collection-membership-summary").text(IN_YOUR_COLLS_LABEL);

        // and then filter out the list from the select
        var $option = $toolbar.find("option[value='" + params.coll_id + "']");
        $option.remove();

        HT.update_status("Added collection " + params.coll_name + " to your list.");
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwicG9seWZpbGxzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsInJlbmV3X2F1dGgiLCJlbnRpdHlJRCIsInNvdXJjZSIsIl9fcmVuZXdpbmciLCJzZXRUaW1lb3V0IiwicmVhdXRoX3VybCIsInNlcnZpY2VfZG9tYWluIiwiZW5jb2RlVVJJQ29tcG9uZW50IiwiaHJlZiIsInJldHZhbCIsImNvbmZpcm0iLCJhbmFseXRpY3MiLCJsb2dBY3Rpb24iLCJ0cmlnZ2VyIiwiZGVsaW0iLCJhamF4IiwiY29tcGxldGUiLCJ4aHIiLCJzdGF0dXMiLCJnZXRSZXNwb25zZUhlYWRlciIsIm9uIiwiZXZlbnQiLCJNT05USFMiLCIkZW1lcmdlbmN5X2FjY2VzcyIsImRlbHRhIiwibGFzdF9zZWNvbmRzIiwidG9nZ2xlX3JlbmV3X2xpbmsiLCJkYXRlIiwibm93IiwiRGF0ZSIsImdldFRpbWUiLCIkbGluayIsImZpbmQiLCJvYnNlcnZlX2V4cGlyYXRpb25fdGltZXN0YW1wIiwicGFyYW1zIiwiaWQiLCJjb29raWUiLCJqc29uIiwic2Vjb25kcyIsImNsb25lIiwidGV4dCIsImFwcGVuZCIsIiRhY3Rpb24iLCJtZXNzYWdlIiwidGltZTJtZXNzYWdlIiwiaG91cnMiLCJnZXRIb3VycyIsImFtcG0iLCJtaW51dGVzIiwiZ2V0TWludXRlcyIsImdldE1vbnRoIiwiZ2V0RGF0ZSIsImV4cGlyYXRpb24iLCJwYXJzZUludCIsImdyYW50ZWQiLCJnZXQiLCJkYXRhc2V0IiwiaW5pdGlhbGl6ZWQiLCJzZXRJbnRlcnZhbCIsInN1cHByZXNzIiwiaGFzQ2xhc3MiLCJkZWJ1ZyIsImlkaGFzaCIsImN1cnJpZCIsImlkcyIsInNob3dBbGVydCIsImh0bWwiLCIkYWxlcnQiLCJib290Ym94IiwiZGlhbG9nIiwibGFiZWwiLCJoZWFkZXIiLCJyb2xlIiwiZG9tYWluIiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm5hbWUiLCJjb2RlIiwiRE9NRXhjZXB0aW9uIiwiY2hlY2tUb2tlbkFuZEdldEluZGV4IiwiY2xhc3NMaXN0IiwidG9rZW4iLCJDbGFzc0xpc3QiLCJlbGVtIiwidHJpbW1lZENsYXNzZXMiLCJnZXRBdHRyaWJ1dGUiLCJjbGFzc2VzIiwiX3VwZGF0ZUNsYXNzTmFtZSIsInNldEF0dHJpYnV0ZSIsImNsYXNzTGlzdFByb3RvIiwiY2xhc3NMaXN0R2V0dGVyIiwiRXJyb3IiLCJjb250YWlucyIsImFkZCIsInRva2VucyIsInVwZGF0ZWQiLCJyZW1vdmUiLCJpbmRleCIsInNwbGljZSIsInRvZ2dsZSIsImZvcmNlIiwicmVzdWx0IiwibWV0aG9kIiwicmVwbGFjZW1lbnRfdG9rZW4iLCJqb2luIiwiZGVmaW5lUHJvcGVydHkiLCJjbGFzc0xpc3RQcm9wRGVzYyIsImVudW1lcmFibGUiLCJjb25maWd1cmFibGUiLCJleCIsIm51bWJlciIsIl9fZGVmaW5lR2V0dGVyX18iLCJ0ZXN0RWxlbWVudCIsImNyZWF0ZU1ldGhvZCIsIm9yaWdpbmFsIiwiRE9NVG9rZW5MaXN0IiwiX3RvZ2dsZSIsInNsaWNlIiwiYXBwbHkiLCJERUZBVUxUX0NPTExfTUVOVV9PUFRJT04iLCJORVdfQ09MTF9NRU5VX09QVElPTiIsIklOX1lPVVJfQ09MTFNfTEFCRUwiLCIkdG9vbGJhciIsIiRlcnJvcm1zZyIsIiRpbmZvbXNnIiwiZGlzcGxheV9lcnJvciIsIm1zZyIsImluc2VydEFmdGVyIiwic2hvdyIsInVwZGF0ZV9zdGF0dXMiLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCIkYmxvY2siLCJjbiIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiaWlkIiwiJGRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYWdlIiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiYW5zd2VyIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCIkZGl2IiwiJHAiLCJwaG90b2NvcGllcl9tZXNzYWdlIiwiRG93bmxvYWRlciIsImluaXQiLCJwZGYiLCJzdGFydCIsImJpbmRFdmVudHMiLCJhZGRDbGFzcyIsImhpZGVBbGwiLCJkb3dubG9hZF9wcm9ncmVzc19iYXNlIiwiZG93bmxvYWRQZGYiLCJleHBsYWluUGRmQWNjZXNzIiwiYWxlcnQiLCJzcmMiLCJpdGVtX3RpdGxlIiwidG90YWwiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCIkc3RhdHVzIiwicmVxdWVzdERvd25sb2FkIiwiY2FuY2VsRG93bmxvYWQiLCJwcm9ncmVzc191cmwiLCJkb3dubG9hZF91cmwiLCJjbGVhclRpbWVyIiwic3RhcnREb3dubG9hZE1vbml0b3IiLCJ0aW1lciIsImlzX3J1bm5pbmciLCJudW1fcHJvY2Vzc2VkIiwiY2hlY2tTdGF0dXMiLCJ0cyIsInN1Y2Nlc3MiLCJ1cGRhdGVQcm9ncmVzcyIsIm51bV9hdHRlbXB0cyIsImRpc3BsYXlQcm9jZXNzRXJyb3IiLCJsb2dFcnJvciIsInBlcmNlbnQiLCJjdXJyZW50IiwiY3VycmVudF9wYWdlIiwibGFzdF9wZXJjZW50IiwicmVtb3ZlQ2xhc3MiLCJ1cGRhdGVTdGF0dXNUZXh0IiwiY3NzIiwid2lkdGgiLCJkb3dubG9hZF9rZXkiLCJuYXZpZ2F0b3IiLCJ1c2VyQWdlbnQiLCIkZG93bmxvYWRfYnRuIiwiZG93bmxvYWQiLCJyZWFkZXIiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9jbGVhclNlbGVjdGlvbiIsInN0b3BQcm9wYWdhdGlvbiIsImZvY3VzIiwiTWF0aCIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInJhdGUiLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJfbGFzdE1lc3NhZ2UiLCJfbGFzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiaW5uZXJUZXh0IiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsIm51bV9wYWdlX2Rvd25sb2FkcyIsInBob3RvY29waWVyIiwicHJpbnRhYmxlIiwiX2dldFBhZ2VTZWxlY3Rpb24iLCJidXR0b25zIiwic2VxIiwiX2dldEZsYXR0ZW5lZFNlbGVjdGlvbiIsInNpZGVfc2hvcnQiLCJzaWRlX2xvbmciLCJodElkIiwiZW1iZWRIZWxwTGluayIsImNvZGVibG9ja190eHQiLCJjb2RlYmxvY2tfdHh0X2EiLCJ3IiwiaCIsImNvZGVibG9ja190eHRfYiIsImNsb3Nlc3QiLCJ0ZXh0YXJlYSIsInNlbGVjdCIsImNsaWNrIiwiZmVlZGJhY2siLCIkZm9ybSIsIlJlY29yZFVSTCIsIiRlbWFpbCIsImluaXRlZCIsIiRpbnB1dCIsIiRpbnB1dF9sYWJlbCIsIiRzZWxlY3QiLCIkc2VhcmNoX3RhcmdldCIsIiRmdCIsIiRiYWNrZHJvcCIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0Iiwic2VhcmNodHlwZSIsImdldENvbnRlbnRHcm91cERhdGEiLCJjb250ZW50X2dyb3VwIiwiX3NpbXBsaWZ5UGFnZUhyZWYiLCJuZXdfaHJlZiIsInFzIiwiZ2V0UGFnZUhyZWYiLCIkbWVudSIsIiR0cmlnZ2VyIiwiJGhlYWRlciIsIiRuYXZpZ2F0b3IiLCJtb2JpZnkiLCJkb2N1bWVudEVsZW1lbnQiLCJleHBhbmRlZCIsInN0eWxlIiwic2V0UHJvcGVydHkiLCJvdXRlckhlaWdodCIsIm9yaWdpbmFsSGVpZ2h0IiwiJGV4cGFuZG8iLCJuYXZpZ2F0b3JIZWlnaHQiLCJ1aSIsIiRzaWRlYmFyIiwicmVxdWVzdEZ1bGxTY3JlZW4iLCJ1dGlscyIsInBhcmVudHMiLCJoYW5kbGVPcmllbnRhdGlvbkNoYW5nZSIsInN0YXRlIiwic2lkZWJhckV4cGFuZGVkIiwidXBkYXRlVG9vbGJhclRvcFByb3BlcnR5IiwidG9wIiwiaGVpZ2h0IiwiYXNzaWduIiwidmFyQXJncyIsIlR5cGVFcnJvciIsInRvIiwibmV4dFNvdXJjZSIsIm5leHRLZXkiLCJ3cml0YWJsZSIsImFyciIsImZvckVhY2giLCJhZnRlciIsImFyZ0FyciIsImRvY0ZyYWciLCJjcmVhdGVEb2N1bWVudEZyYWdtZW50IiwiYXJnSXRlbSIsImlzTm9kZSIsIk5vZGUiLCJhcHBlbmRDaGlsZCIsImNyZWF0ZVRleHROb2RlIiwicGFyZW50Tm9kZSIsImluc2VydEJlZm9yZSIsIm5leHRTaWJsaW5nIiwiQ2hhcmFjdGVyRGF0YSIsIkRvY3VtZW50VHlwZSIsIlJlcGxhY2VXaXRoUG9seWZpbGwiLCJjdXJyZW50Tm9kZSIsInJlbW92ZUNoaWxkIiwib3duZXJEb2N1bWVudCIsInJlcGxhY2VDaGlsZCIsInByZXZpb3VzU2libGluZyIsInJlcGxhY2VXaXRoIiwiJGJvZHkiLCJyZW1vdmVBdHRyIiwiYmVmb3JlVW5sb2FkVGltZW91dCIsIiRmb3JtXyIsIiRzdWJtaXQiLCJzZWFyY2hpbmF0b3IiLCJzeiJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7O0FBT0EsQ0FBQyxDQUFDLFVBQVNBLE9BQVQsRUFBa0I7QUFDbkIsS0FBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUMvQztBQUNBLE1BQUssT0FBT0MsTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0YsVUFBTyxDQUFDLFFBQUQsQ0FBUCxFQUFtQkQsT0FBbkI7QUFDQSxHQUZELE1BRU87QUFDTkMsVUFBTyxFQUFQLEVBQVdELE9BQVg7QUFDQTtBQUNELEVBUEQsTUFPTztBQUNOO0FBQ0EsTUFBSyxPQUFPRyxNQUFQLEtBQWtCLFdBQXZCLEVBQXFDO0FBQ3BDSCxXQUFRRyxNQUFSO0FBQ0EsR0FGRCxNQUVPO0FBQ05IO0FBQ0E7QUFDRDtBQUNELENBaEJBLEVBZ0JFLFVBQVNJLENBQVQsRUFBWUMsU0FBWixFQUF1Qjs7QUFFekIsS0FBSUMsV0FBVztBQUNiQyxLQUFVLE1BREc7QUFFYkMsT0FBVSxLQUZHO0FBR2JDLFFBQVUsUUFIRztBQUliQyxRQUFVLE1BSkc7QUFLYkMsVUFBVSxLQUxHO0FBTWJDLFVBQVUsS0FORztBQU9iQyxRQUFVO0FBUEcsRUFBZjtBQUFBLEtBVUNDLE1BQU0sQ0FBQyxRQUFELEVBQVcsVUFBWCxFQUF1QixXQUF2QixFQUFvQyxVQUFwQyxFQUFnRCxNQUFoRCxFQUF3RCxVQUF4RCxFQUFvRSxNQUFwRSxFQUE0RSxNQUE1RSxFQUFvRixVQUFwRixFQUFnRyxNQUFoRyxFQUF3RyxXQUF4RyxFQUFxSCxNQUFySCxFQUE2SCxPQUE3SCxFQUFzSSxVQUF0SSxDQVZQO0FBQUEsS0FVMEo7O0FBRXpKQyxXQUFVLEVBQUUsVUFBVyxVQUFiLEVBWlg7QUFBQSxLQVlzQzs7QUFFckNDLFVBQVM7QUFDUkMsVUFBUyxxSUFERCxFQUN5STtBQUNqSkMsU0FBUyw4TEFGRCxDQUVnTTtBQUZoTSxFQWRWO0FBQUEsS0FtQkNDLFdBQVdDLE9BQU9DLFNBQVAsQ0FBaUJGLFFBbkI3QjtBQUFBLEtBcUJDRyxRQUFRLFVBckJUOztBQXVCQSxVQUFTQyxRQUFULENBQW1CQyxHQUFuQixFQUF3QkMsVUFBeEIsRUFBcUM7QUFDcEMsTUFBSUMsTUFBTUMsVUFBV0gsR0FBWCxDQUFWO0FBQUEsTUFDQUksTUFBUVosT0FBUVMsY0FBYyxLQUFkLEdBQXNCLFFBQXRCLEdBQWlDLE9BQXpDLEVBQW1ESSxJQUFuRCxDQUF5REgsR0FBekQsQ0FEUjtBQUFBLE1BRUFJLE1BQU0sRUFBRUMsTUFBTyxFQUFULEVBQWFDLE9BQVEsRUFBckIsRUFBeUJDLEtBQU0sRUFBL0IsRUFGTjtBQUFBLE1BR0FDLElBQU0sRUFITjs7QUFLQSxTQUFRQSxHQUFSLEVBQWM7QUFDYkosT0FBSUMsSUFBSixDQUFVakIsSUFBSW9CLENBQUosQ0FBVixJQUFxQk4sSUFBSU0sQ0FBSixLQUFVLEVBQS9CO0FBQ0E7O0FBRUQ7QUFDQUosTUFBSUUsS0FBSixDQUFVLE9BQVYsSUFBcUJHLFlBQVlMLElBQUlDLElBQUosQ0FBUyxPQUFULENBQVosQ0FBckI7QUFDQUQsTUFBSUUsS0FBSixDQUFVLFVBQVYsSUFBd0JHLFlBQVlMLElBQUlDLElBQUosQ0FBUyxVQUFULENBQVosQ0FBeEI7O0FBRUE7QUFDQUQsTUFBSUcsR0FBSixDQUFRLE1BQVIsSUFBa0JILElBQUlDLElBQUosQ0FBU0ssSUFBVCxDQUFjQyxPQUFkLENBQXNCLFlBQXRCLEVBQW1DLEVBQW5DLEVBQXVDQyxLQUF2QyxDQUE2QyxHQUE3QyxDQUFsQjtBQUNBUixNQUFJRyxHQUFKLENBQVEsVUFBUixJQUFzQkgsSUFBSUMsSUFBSixDQUFTUSxRQUFULENBQWtCRixPQUFsQixDQUEwQixZQUExQixFQUF1QyxFQUF2QyxFQUEyQ0MsS0FBM0MsQ0FBaUQsR0FBakQsQ0FBdEI7O0FBRUE7QUFDQVIsTUFBSUMsSUFBSixDQUFTLE1BQVQsSUFBbUJELElBQUlDLElBQUosQ0FBU1MsSUFBVCxHQUFnQixDQUFDVixJQUFJQyxJQUFKLENBQVNVLFFBQVQsR0FBcUJYLElBQUlDLElBQUosQ0FBU1UsUUFBVCxHQUFrQixLQUFsQixHQUF3QlgsSUFBSUMsSUFBSixDQUFTUyxJQUF0RCxHQUE2RFYsSUFBSUMsSUFBSixDQUFTUyxJQUF2RSxLQUFnRlYsSUFBSUMsSUFBSixDQUFTVyxJQUFULEdBQWdCLE1BQUlaLElBQUlDLElBQUosQ0FBU1csSUFBN0IsR0FBb0MsRUFBcEgsQ0FBaEIsR0FBMEksRUFBN0o7O0FBRUEsU0FBT1osR0FBUDtBQUNBOztBQUVELFVBQVNhLFdBQVQsQ0FBc0JDLEdBQXRCLEVBQTRCO0FBQzNCLE1BQUlDLEtBQUtELElBQUlFLE9BQWI7QUFDQSxNQUFLLE9BQU9ELEVBQVAsS0FBYyxXQUFuQixFQUFpQyxPQUFPdkMsU0FBU3VDLEdBQUdFLFdBQUgsRUFBVCxDQUFQO0FBQ2pDLFNBQU9GLEVBQVA7QUFDQTs7QUFFRCxVQUFTRyxPQUFULENBQWlCQyxNQUFqQixFQUF5Qm5DLEdBQXpCLEVBQThCO0FBQzdCLE1BQUltQyxPQUFPbkMsR0FBUCxFQUFZb0MsTUFBWixJQUFzQixDQUExQixFQUE2QixPQUFPRCxPQUFPbkMsR0FBUCxJQUFjLEVBQXJCO0FBQzdCLE1BQUlxQyxJQUFJLEVBQVI7QUFDQSxPQUFLLElBQUlqQixDQUFULElBQWNlLE9BQU9uQyxHQUFQLENBQWQ7QUFBMkJxQyxLQUFFakIsQ0FBRixJQUFPZSxPQUFPbkMsR0FBUCxFQUFZb0IsQ0FBWixDQUFQO0FBQTNCLEdBQ0FlLE9BQU9uQyxHQUFQLElBQWNxQyxDQUFkO0FBQ0EsU0FBT0EsQ0FBUDtBQUNBOztBQUVELFVBQVNDLEtBQVQsQ0FBZUMsS0FBZixFQUFzQkosTUFBdEIsRUFBOEJuQyxHQUE5QixFQUFtQ3dDLEdBQW5DLEVBQXdDO0FBQ3ZDLE1BQUlDLE9BQU9GLE1BQU1HLEtBQU4sRUFBWDtBQUNBLE1BQUksQ0FBQ0QsSUFBTCxFQUFXO0FBQ1YsT0FBSUUsUUFBUVIsT0FBT25DLEdBQVAsQ0FBUixDQUFKLEVBQTBCO0FBQ3pCbUMsV0FBT25DLEdBQVAsRUFBWTRDLElBQVosQ0FBaUJKLEdBQWpCO0FBQ0EsSUFGRCxNQUVPLElBQUksb0JBQW1CTCxPQUFPbkMsR0FBUCxDQUFuQixDQUFKLEVBQW9DO0FBQzFDbUMsV0FBT25DLEdBQVAsSUFBY3dDLEdBQWQ7QUFDQSxJQUZNLE1BRUEsSUFBSSxlQUFlLE9BQU9MLE9BQU9uQyxHQUFQLENBQTFCLEVBQXVDO0FBQzdDbUMsV0FBT25DLEdBQVAsSUFBY3dDLEdBQWQ7QUFDQSxJQUZNLE1BRUE7QUFDTkwsV0FBT25DLEdBQVAsSUFBYyxDQUFDbUMsT0FBT25DLEdBQVAsQ0FBRCxFQUFjd0MsR0FBZCxDQUFkO0FBQ0E7QUFDRCxHQVZELE1BVU87QUFDTixPQUFJSyxNQUFNVixPQUFPbkMsR0FBUCxJQUFjbUMsT0FBT25DLEdBQVAsS0FBZSxFQUF2QztBQUNBLE9BQUksT0FBT3lDLElBQVgsRUFBaUI7QUFDaEIsUUFBSUUsUUFBUUUsR0FBUixDQUFKLEVBQWtCO0FBQ2pCLFNBQUksTUFBTUwsR0FBVixFQUFlSyxJQUFJRCxJQUFKLENBQVNKLEdBQVQ7QUFDZixLQUZELE1BRU8sSUFBSSxvQkFBbUJLLEdBQW5CLHlDQUFtQkEsR0FBbkIsRUFBSixFQUE0QjtBQUNsQ0EsU0FBSUMsS0FBS0QsR0FBTCxFQUFVVCxNQUFkLElBQXdCSSxHQUF4QjtBQUNBLEtBRk0sTUFFQTtBQUNOSyxXQUFNVixPQUFPbkMsR0FBUCxJQUFjLENBQUNtQyxPQUFPbkMsR0FBUCxDQUFELEVBQWN3QyxHQUFkLENBQXBCO0FBQ0E7QUFDRCxJQVJELE1BUU8sSUFBSSxDQUFDQyxLQUFLTSxPQUFMLENBQWEsR0FBYixDQUFMLEVBQXdCO0FBQzlCTixXQUFPQSxLQUFLTyxNQUFMLENBQVksQ0FBWixFQUFlUCxLQUFLTCxNQUFMLEdBQWMsQ0FBN0IsQ0FBUDtBQUNBLFFBQUksQ0FBQzVCLE1BQU15QyxJQUFOLENBQVdSLElBQVgsQ0FBRCxJQUFxQkUsUUFBUUUsR0FBUixDQUF6QixFQUF1Q0EsTUFBTVgsUUFBUUMsTUFBUixFQUFnQm5DLEdBQWhCLENBQU47QUFDdkNzQyxVQUFNQyxLQUFOLEVBQWFNLEdBQWIsRUFBa0JKLElBQWxCLEVBQXdCRCxHQUF4QjtBQUNBO0FBQ0EsSUFMTSxNQUtBO0FBQ04sUUFBSSxDQUFDaEMsTUFBTXlDLElBQU4sQ0FBV1IsSUFBWCxDQUFELElBQXFCRSxRQUFRRSxHQUFSLENBQXpCLEVBQXVDQSxNQUFNWCxRQUFRQyxNQUFSLEVBQWdCbkMsR0FBaEIsQ0FBTjtBQUN2Q3NDLFVBQU1DLEtBQU4sRUFBYU0sR0FBYixFQUFrQkosSUFBbEIsRUFBd0JELEdBQXhCO0FBQ0E7QUFDRDtBQUNEOztBQUVELFVBQVNVLEtBQVQsQ0FBZWYsTUFBZixFQUF1Qm5DLEdBQXZCLEVBQTRCd0MsR0FBNUIsRUFBaUM7QUFDaEMsTUFBSSxDQUFDeEMsSUFBSStDLE9BQUosQ0FBWSxHQUFaLENBQUwsRUFBdUI7QUFDdEIsT0FBSVIsUUFBUXZDLElBQUl3QixLQUFKLENBQVUsR0FBVixDQUFaO0FBQUEsT0FDQTJCLE1BQU1aLE1BQU1ILE1BRFo7QUFBQSxPQUVBZ0IsT0FBT0QsTUFBTSxDQUZiO0FBR0FiLFNBQU1DLEtBQU4sRUFBYUosTUFBYixFQUFxQixNQUFyQixFQUE2QkssR0FBN0I7QUFDQSxHQUxELE1BS087QUFDTixPQUFJLENBQUNoQyxNQUFNeUMsSUFBTixDQUFXakQsR0FBWCxDQUFELElBQW9CMkMsUUFBUVIsT0FBT3ZDLElBQWYsQ0FBeEIsRUFBOEM7QUFDN0MsUUFBSXlDLElBQUksRUFBUjtBQUNBLFNBQUssSUFBSWdCLENBQVQsSUFBY2xCLE9BQU92QyxJQUFyQjtBQUEyQnlDLE9BQUVnQixDQUFGLElBQU9sQixPQUFPdkMsSUFBUCxDQUFZeUQsQ0FBWixDQUFQO0FBQTNCLEtBQ0FsQixPQUFPdkMsSUFBUCxHQUFjeUMsQ0FBZDtBQUNBO0FBQ0RpQixPQUFJbkIsT0FBT3ZDLElBQVgsRUFBaUJJLEdBQWpCLEVBQXNCd0MsR0FBdEI7QUFDQTtBQUNELFNBQU9MLE1BQVA7QUFDQTs7QUFFRCxVQUFTZCxXQUFULENBQXFCVCxHQUFyQixFQUEwQjtBQUN6QixTQUFPMkMsT0FBT0MsT0FBTzVDLEdBQVAsRUFBWVksS0FBWixDQUFrQixLQUFsQixDQUFQLEVBQWlDLFVBQVNpQyxHQUFULEVBQWNDLElBQWQsRUFBb0I7QUFDM0QsT0FBSTtBQUNIQSxXQUFPQyxtQkFBbUJELEtBQUtuQyxPQUFMLENBQWEsS0FBYixFQUFvQixHQUFwQixDQUFuQixDQUFQO0FBQ0EsSUFGRCxDQUVFLE9BQU1xQyxDQUFOLEVBQVM7QUFDVjtBQUNBO0FBQ0QsT0FBSUMsTUFBTUgsS0FBS1gsT0FBTCxDQUFhLEdBQWIsQ0FBVjtBQUFBLE9BQ0NlLFFBQVFDLGVBQWVMLElBQWYsQ0FEVDtBQUFBLE9BRUMxRCxNQUFNMEQsS0FBS1YsTUFBTCxDQUFZLENBQVosRUFBZWMsU0FBU0QsR0FBeEIsQ0FGUDtBQUFBLE9BR0NyQixNQUFNa0IsS0FBS1YsTUFBTCxDQUFZYyxTQUFTRCxHQUFyQixFQUEwQkgsS0FBS3RCLE1BQS9CLENBSFA7QUFBQSxPQUlDSSxNQUFNQSxJQUFJUSxNQUFKLENBQVdSLElBQUlPLE9BQUosQ0FBWSxHQUFaLElBQW1CLENBQTlCLEVBQWlDUCxJQUFJSixNQUFyQyxDQUpQOztBQU1BLE9BQUksTUFBTXBDLEdBQVYsRUFBZUEsTUFBTTBELElBQU4sRUFBWWxCLE1BQU0sRUFBbEI7O0FBRWYsVUFBT1UsTUFBTU8sR0FBTixFQUFXekQsR0FBWCxFQUFnQndDLEdBQWhCLENBQVA7QUFDQSxHQWZNLEVBZUosRUFBRTVDLE1BQU0sRUFBUixFQWZJLEVBZVVBLElBZmpCO0FBZ0JBOztBQUVELFVBQVMwRCxHQUFULENBQWFULEdBQWIsRUFBa0I3QyxHQUFsQixFQUF1QndDLEdBQXZCLEVBQTRCO0FBQzNCLE1BQUl3QixJQUFJbkIsSUFBSTdDLEdBQUosQ0FBUjtBQUNBLE1BQUlULGNBQWN5RSxDQUFsQixFQUFxQjtBQUNwQm5CLE9BQUk3QyxHQUFKLElBQVd3QyxHQUFYO0FBQ0EsR0FGRCxNQUVPLElBQUlHLFFBQVFxQixDQUFSLENBQUosRUFBZ0I7QUFDdEJBLEtBQUVwQixJQUFGLENBQU9KLEdBQVA7QUFDQSxHQUZNLE1BRUE7QUFDTkssT0FBSTdDLEdBQUosSUFBVyxDQUFDZ0UsQ0FBRCxFQUFJeEIsR0FBSixDQUFYO0FBQ0E7QUFDRDs7QUFFRCxVQUFTdUIsY0FBVCxDQUF3Qm5ELEdBQXhCLEVBQTZCO0FBQzVCLE1BQUl1QyxNQUFNdkMsSUFBSXdCLE1BQWQ7QUFBQSxNQUNFMEIsS0FERjtBQUFBLE1BQ1NHLENBRFQ7QUFFQSxPQUFLLElBQUk3QyxJQUFJLENBQWIsRUFBZ0JBLElBQUkrQixHQUFwQixFQUF5QixFQUFFL0IsQ0FBM0IsRUFBOEI7QUFDN0I2QyxPQUFJckQsSUFBSVEsQ0FBSixDQUFKO0FBQ0EsT0FBSSxPQUFPNkMsQ0FBWCxFQUFjSCxRQUFRLEtBQVI7QUFDZCxPQUFJLE9BQU9HLENBQVgsRUFBY0gsUUFBUSxJQUFSO0FBQ2QsT0FBSSxPQUFPRyxDQUFQLElBQVksQ0FBQ0gsS0FBakIsRUFBd0IsT0FBTzFDLENBQVA7QUFDeEI7QUFDRDs7QUFFRCxVQUFTbUMsTUFBVCxDQUFnQlYsR0FBaEIsRUFBcUJxQixXQUFyQixFQUFpQztBQUNoQyxNQUFJOUMsSUFBSSxDQUFSO0FBQUEsTUFDQytDLElBQUl0QixJQUFJVCxNQUFKLElBQWMsQ0FEbkI7QUFBQSxNQUVDZ0MsT0FBT0MsVUFBVSxDQUFWLENBRlI7QUFHQSxTQUFPakQsSUFBSStDLENBQVgsRUFBYztBQUNiLE9BQUkvQyxLQUFLeUIsR0FBVCxFQUFjdUIsT0FBT0YsWUFBWUksSUFBWixDQUFpQi9FLFNBQWpCLEVBQTRCNkUsSUFBNUIsRUFBa0N2QixJQUFJekIsQ0FBSixDQUFsQyxFQUEwQ0EsQ0FBMUMsRUFBNkN5QixHQUE3QyxDQUFQO0FBQ2QsS0FBRXpCLENBQUY7QUFDQTtBQUNELFNBQU9nRCxJQUFQO0FBQ0E7O0FBRUQsVUFBU3pCLE9BQVQsQ0FBaUI0QixJQUFqQixFQUF1QjtBQUN0QixTQUFPakUsT0FBT0MsU0FBUCxDQUFpQkYsUUFBakIsQ0FBMEJpRSxJQUExQixDQUErQkMsSUFBL0IsTUFBeUMsZ0JBQWhEO0FBQ0E7O0FBRUQsVUFBU3pCLElBQVQsQ0FBY0QsR0FBZCxFQUFtQjtBQUNsQixNQUFJQyxPQUFPLEVBQVg7QUFDQSxPQUFNMEIsSUFBTixJQUFjM0IsR0FBZCxFQUFvQjtBQUNuQixPQUFLQSxJQUFJNEIsY0FBSixDQUFtQkQsSUFBbkIsQ0FBTCxFQUFnQzFCLEtBQUtGLElBQUwsQ0FBVTRCLElBQVY7QUFDaEM7QUFDRCxTQUFPMUIsSUFBUDtBQUNBOztBQUVELFVBQVM0QixJQUFULENBQWVoRSxHQUFmLEVBQW9CQyxVQUFwQixFQUFpQztBQUNoQyxNQUFLMEQsVUFBVWpDLE1BQVYsS0FBcUIsQ0FBckIsSUFBMEIxQixRQUFRLElBQXZDLEVBQThDO0FBQzdDQyxnQkFBYSxJQUFiO0FBQ0FELFNBQU1uQixTQUFOO0FBQ0E7QUFDRG9CLGVBQWFBLGNBQWMsS0FBM0I7QUFDQUQsUUFBTUEsT0FBT2lFLE9BQU9DLFFBQVAsQ0FBZ0J2RSxRQUFoQixFQUFiOztBQUVBLFNBQU87O0FBRU53RSxTQUFPcEUsU0FBU0MsR0FBVCxFQUFjQyxVQUFkLENBRkQ7O0FBSU47QUFDQU0sU0FBTyxjQUFVQSxLQUFWLEVBQWlCO0FBQ3ZCQSxZQUFPaEIsUUFBUWdCLEtBQVIsS0FBaUJBLEtBQXhCO0FBQ0EsV0FBTyxPQUFPQSxLQUFQLEtBQWdCLFdBQWhCLEdBQThCLEtBQUs0RCxJQUFMLENBQVU1RCxJQUFWLENBQWVBLEtBQWYsQ0FBOUIsR0FBcUQsS0FBSzRELElBQUwsQ0FBVTVELElBQXRFO0FBQ0EsSUFSSzs7QUFVTjtBQUNBQyxVQUFRLGVBQVVBLE1BQVYsRUFBa0I7QUFDekIsV0FBTyxPQUFPQSxNQUFQLEtBQWlCLFdBQWpCLEdBQStCLEtBQUsyRCxJQUFMLENBQVUzRCxLQUFWLENBQWdCNEQsS0FBaEIsQ0FBc0I1RCxNQUF0QixDQUEvQixHQUE4RCxLQUFLMkQsSUFBTCxDQUFVM0QsS0FBVixDQUFnQjRELEtBQXJGO0FBQ0EsSUFiSzs7QUFlTjtBQUNBQyxXQUFTLGdCQUFVN0QsS0FBVixFQUFrQjtBQUMxQixXQUFPLE9BQU9BLEtBQVAsS0FBaUIsV0FBakIsR0FBK0IsS0FBSzJELElBQUwsQ0FBVTNELEtBQVYsQ0FBZ0JPLFFBQWhCLENBQXlCUCxLQUF6QixDQUEvQixHQUFpRSxLQUFLMkQsSUFBTCxDQUFVM0QsS0FBVixDQUFnQk8sUUFBeEY7QUFDQSxJQWxCSzs7QUFvQk47QUFDQXVELFlBQVUsaUJBQVU3RCxHQUFWLEVBQWdCO0FBQ3pCLFFBQUssT0FBT0EsR0FBUCxLQUFlLFdBQXBCLEVBQWtDO0FBQ2pDLFlBQU8sS0FBSzBELElBQUwsQ0FBVTFELEdBQVYsQ0FBY0csSUFBckI7QUFDQSxLQUZELE1BRU87QUFDTkgsV0FBTUEsTUFBTSxDQUFOLEdBQVUsS0FBSzBELElBQUwsQ0FBVTFELEdBQVYsQ0FBY0csSUFBZCxDQUFtQmMsTUFBbkIsR0FBNEJqQixHQUF0QyxHQUE0Q0EsTUFBTSxDQUF4RCxDQURNLENBQ3FEO0FBQzNELFlBQU8sS0FBSzBELElBQUwsQ0FBVTFELEdBQVYsQ0FBY0csSUFBZCxDQUFtQkgsR0FBbkIsQ0FBUDtBQUNBO0FBQ0QsSUE1Qks7O0FBOEJOO0FBQ0E4RCxhQUFXLGtCQUFVOUQsR0FBVixFQUFnQjtBQUMxQixRQUFLLE9BQU9BLEdBQVAsS0FBZSxXQUFwQixFQUFrQztBQUNqQyxZQUFPLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNNLFFBQXJCO0FBQ0EsS0FGRCxNQUVPO0FBQ05OLFdBQU1BLE1BQU0sQ0FBTixHQUFVLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNNLFFBQWQsQ0FBdUJXLE1BQXZCLEdBQWdDakIsR0FBMUMsR0FBZ0RBLE1BQU0sQ0FBNUQsQ0FETSxDQUN5RDtBQUMvRCxZQUFPLEtBQUswRCxJQUFMLENBQVUxRCxHQUFWLENBQWNNLFFBQWQsQ0FBdUJOLEdBQXZCLENBQVA7QUFDQTtBQUNEOztBQXRDSyxHQUFQO0FBMENBOztBQUVELEtBQUssT0FBTzdCLENBQVAsS0FBYSxXQUFsQixFQUFnQzs7QUFFL0JBLElBQUU0RixFQUFGLENBQUt4RSxHQUFMLEdBQVcsVUFBVUMsVUFBVixFQUF1QjtBQUNqQyxPQUFJRCxNQUFNLEVBQVY7QUFDQSxPQUFLLEtBQUswQixNQUFWLEVBQW1CO0FBQ2xCMUIsVUFBTXBCLEVBQUUsSUFBRixFQUFRMkIsSUFBUixDQUFjWSxZQUFZLEtBQUssQ0FBTCxDQUFaLENBQWQsS0FBd0MsRUFBOUM7QUFDQTtBQUNELFVBQU82QyxLQUFNaEUsR0FBTixFQUFXQyxVQUFYLENBQVA7QUFDQSxHQU5EOztBQVFBckIsSUFBRW9CLEdBQUYsR0FBUWdFLElBQVI7QUFFQSxFQVpELE1BWU87QUFDTkMsU0FBT0QsSUFBUCxHQUFjQSxJQUFkO0FBQ0E7QUFFRCxDQXRRQTs7O0FDUEQsSUFBSVMsS0FBS0EsTUFBTSxFQUFmO0FBQ0FDLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVwQjs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7O0FBRUFGLEtBQUdHLFVBQUgsR0FBZ0IsVUFBU0MsUUFBVCxFQUFtQztBQUFBLFFBQWhCQyxNQUFnQix1RUFBVCxPQUFTOztBQUNqRCxRQUFLTCxHQUFHTSxVQUFSLEVBQXFCO0FBQUU7QUFBVTtBQUNqQ04sT0FBR00sVUFBSCxHQUFnQixJQUFoQjtBQUNBQyxlQUFXLFlBQU07QUFDZixVQUFJQywwQkFBd0JSLEdBQUdTLGNBQTNCLHVDQUEyRUwsUUFBM0UsZ0JBQThGTSxtQkFBbUJsQixPQUFPQyxRQUFQLENBQWdCa0IsSUFBbkMsQ0FBbEc7QUFDQSxVQUFJQyxTQUFTcEIsT0FBT3FCLE9BQVAseUVBQWI7QUFDQSxVQUFLRCxNQUFMLEVBQWM7QUFDWnBCLGVBQU9DLFFBQVAsQ0FBZ0JrQixJQUFoQixHQUF1QkgsVUFBdkI7QUFDRDtBQUNGLEtBTkQsRUFNRyxHQU5IO0FBT0QsR0FWRDs7QUFZQVIsS0FBR2MsU0FBSCxHQUFlZCxHQUFHYyxTQUFILElBQWdCLEVBQS9CO0FBQ0FkLEtBQUdjLFNBQUgsQ0FBYUMsU0FBYixHQUF5QixVQUFTSixJQUFULEVBQWVLLE9BQWYsRUFBd0I7QUFDL0MsUUFBS0wsU0FBU3ZHLFNBQWQsRUFBMEI7QUFBRXVHLGFBQU9sQixTQUFTa0IsSUFBaEI7QUFBd0I7QUFDcEQsUUFBSU0sUUFBUU4sS0FBSy9DLE9BQUwsQ0FBYSxHQUFiLElBQW9CLENBQUMsQ0FBckIsR0FBeUIsR0FBekIsR0FBK0IsR0FBM0M7QUFDQSxRQUFLb0QsV0FBVyxJQUFoQixFQUF1QjtBQUFFQSxnQkFBVSxHQUFWO0FBQWdCO0FBQ3pDTCxZQUFRTSxRQUFRLElBQVIsR0FBZUQsT0FBdkI7QUFDQTtBQUNBN0csTUFBRStHLElBQUYsQ0FBT1AsSUFBUCxFQUNBO0FBQ0VRLGdCQUFVLGtCQUFTQyxHQUFULEVBQWNDLE1BQWQsRUFBc0I7QUFDOUIsWUFBSWpCLFdBQVdnQixJQUFJRSxpQkFBSixDQUFzQixvQkFBdEIsQ0FBZjtBQUNBLFlBQUtsQixRQUFMLEVBQWdCO0FBQ2RKLGFBQUdHLFVBQUgsQ0FBY0MsUUFBZCxFQUF3QixXQUF4QjtBQUNEO0FBQ0Y7QUFOSCxLQURBO0FBU0QsR0FmRDs7QUFrQkFqRyxJQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLHNDQUF0QixFQUE4RCxVQUFTQyxLQUFULEVBQWdCO0FBQzVFO0FBQ0E7QUFDQTtBQUNBLFFBQUlSLFVBQVUsUUFBUTdHLEVBQUUsSUFBRixFQUFRMkIsSUFBUixDQUFhLE1BQWIsQ0FBdEI7QUFDQWtFLE9BQUdjLFNBQUgsQ0FBYUMsU0FBYixDQUF1QjNHLFNBQXZCLEVBQWtDNEcsT0FBbEM7QUFDRCxHQU5EO0FBU0QsQ0E3REQ7OztBQ0RBZixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFcEIsTUFBSXVCLFNBQVMsQ0FBQyxTQUFELEVBQVksVUFBWixFQUF3QixPQUF4QixFQUFpQyxPQUFqQyxFQUEwQyxLQUExQyxFQUFpRCxNQUFqRCxFQUF5RCxNQUF6RCxFQUNYLFFBRFcsRUFDRCxXQURDLEVBQ1ksU0FEWixFQUN1QixVQUR2QixFQUNtQyxVQURuQyxDQUFiOztBQUdBLE1BQUlDLG9CQUFvQnZILEVBQUUsMEJBQUYsQ0FBeEI7O0FBRUEsTUFBSXdILFFBQVEsSUFBSSxFQUFKLEdBQVMsSUFBckI7QUFDQSxNQUFJQyxZQUFKO0FBQ0EsTUFBSUMsb0JBQW9CLFNBQXBCQSxpQkFBb0IsQ0FBU0MsSUFBVCxFQUFlO0FBQ3JDLFFBQUlDLE1BQU1DLEtBQUtELEdBQUwsRUFBVjtBQUNBLFFBQUtBLE9BQU9ELEtBQUtHLE9BQUwsRUFBWixFQUE2QjtBQUMzQixVQUFJQyxRQUFRUixrQkFBa0JTLElBQWxCLENBQXVCLGFBQXZCLENBQVo7QUFDQUQsWUFBTXBHLElBQU4sQ0FBVyxVQUFYLEVBQXVCLElBQXZCO0FBQ0Q7QUFDRixHQU5EOztBQVFBLE1BQUlzRywrQkFBK0IsU0FBL0JBLDRCQUErQixHQUFXO0FBQzVDLFFBQUssQ0FBRXBDLEVBQUYsSUFBUSxDQUFFQSxHQUFHcUMsTUFBYixJQUF1QixDQUFFckMsR0FBR3FDLE1BQUgsQ0FBVUMsRUFBeEMsRUFBNkM7QUFBRTtBQUFVO0FBQ3pELFFBQUk1QyxPQUFPdkYsRUFBRW9JLE1BQUYsQ0FBUyxjQUFULEVBQXlCbkksU0FBekIsRUFBb0MsRUFBRW9JLE1BQU0sSUFBUixFQUFwQyxDQUFYO0FBQ0EsUUFBSyxDQUFFOUMsSUFBUCxFQUFjO0FBQUU7QUFBVTtBQUMxQixRQUFJK0MsVUFBVS9DLEtBQUtNLEdBQUdxQyxNQUFILENBQVVDLEVBQWYsQ0FBZDtBQUNBO0FBQ0EsUUFBS0csV0FBVyxDQUFDLENBQWpCLEVBQXFCO0FBQ25CLFVBQUlQLFFBQVFSLGtCQUFrQlMsSUFBbEIsQ0FBdUIsS0FBdkIsRUFBOEJPLEtBQTlCLEVBQVo7QUFDQWhCLHdCQUFrQlMsSUFBbEIsQ0FBdUIsR0FBdkIsRUFBNEJRLElBQTVCLENBQWlDLDBIQUFqQztBQUNBakIsd0JBQWtCUyxJQUFsQixDQUF1QixHQUF2QixFQUE0QlMsTUFBNUIsQ0FBbUNWLEtBQW5DO0FBQ0EsVUFBSVcsVUFBVW5CLGtCQUFrQlMsSUFBbEIsQ0FBdUIscUNBQXZCLENBQWQ7QUFDQVUsY0FBUS9HLElBQVIsQ0FBYSxNQUFiLEVBQXFCMEQsT0FBT0MsUUFBUCxDQUFnQmtCLElBQXJDO0FBQ0FrQyxjQUFRRixJQUFSLENBQWEsUUFBYjtBQUNBO0FBQ0Q7QUFDRCxRQUFLRixVQUFVYixZQUFmLEVBQThCO0FBQzVCLFVBQUlrQixVQUFVQyxhQUFhTixPQUFiLENBQWQ7QUFDQWIscUJBQWVhLE9BQWY7QUFDQWYsd0JBQWtCUyxJQUFsQixDQUF1QixrQkFBdkIsRUFBMkNRLElBQTNDLENBQWdERyxPQUFoRDtBQUNEO0FBQ0YsR0FwQkQ7O0FBc0JBLE1BQUlDLGVBQWUsU0FBZkEsWUFBZSxDQUFTTixPQUFULEVBQWtCO0FBQ25DLFFBQUlYLE9BQU8sSUFBSUUsSUFBSixDQUFTUyxVQUFVLElBQW5CLENBQVg7QUFDQSxRQUFJTyxRQUFRbEIsS0FBS21CLFFBQUwsRUFBWjtBQUNBLFFBQUlDLE9BQU8sSUFBWDtBQUNBLFFBQUtGLFFBQVEsRUFBYixFQUFrQjtBQUFFQSxlQUFTLEVBQVQsQ0FBYUUsT0FBTyxJQUFQO0FBQWM7QUFDL0MsUUFBS0YsU0FBUyxFQUFkLEVBQWtCO0FBQUVFLGFBQU8sSUFBUDtBQUFjO0FBQ2xDLFFBQUlDLFVBQVVyQixLQUFLc0IsVUFBTCxFQUFkO0FBQ0EsUUFBS0QsVUFBVSxFQUFmLEVBQW9CO0FBQUVBLHNCQUFjQSxPQUFkO0FBQTBCO0FBQ2hELFFBQUlMLFVBQWFFLEtBQWIsU0FBc0JHLE9BQXRCLEdBQWdDRCxJQUFoQyxTQUF3Q3pCLE9BQU9LLEtBQUt1QixRQUFMLEVBQVAsQ0FBeEMsU0FBbUV2QixLQUFLd0IsT0FBTCxFQUF2RTtBQUNBLFdBQU9SLE9BQVA7QUFDRCxHQVZEOztBQVlBLE1BQUtwQixrQkFBa0J6RSxNQUF2QixFQUFnQztBQUM5QixRQUFJc0csYUFBYTdCLGtCQUFrQmhDLElBQWxCLENBQXVCLGVBQXZCLENBQWpCO0FBQ0EsUUFBSStDLFVBQVVlLFNBQVM5QixrQkFBa0JoQyxJQUFsQixDQUF1QixzQkFBdkIsQ0FBVCxFQUF5RCxFQUF6RCxDQUFkO0FBQ0EsUUFBSStELFVBQVUvQixrQkFBa0JoQyxJQUFsQixDQUF1QixlQUF2QixDQUFkOztBQUVBLFFBQUlxQyxNQUFNQyxLQUFLRCxHQUFMLEtBQWEsSUFBdkI7QUFDQSxRQUFJZSxVQUFVQyxhQUFhTixPQUFiLENBQWQ7QUFDQWYsc0JBQWtCUyxJQUFsQixDQUF1QixrQkFBdkIsRUFBMkNRLElBQTNDLENBQWdERyxPQUFoRDtBQUNBcEIsc0JBQWtCZ0MsR0FBbEIsQ0FBc0IsQ0FBdEIsRUFBeUJDLE9BQXpCLENBQWlDQyxXQUFqQyxHQUErQyxNQUEvQzs7QUFFQSxRQUFLSCxPQUFMLEVBQWU7QUFDYjtBQUNBN0IscUJBQWVhLE9BQWY7QUFDQW9CLGtCQUFZLFlBQVc7QUFDckI7QUFDQXpCO0FBQ0QsT0FIRCxFQUdHLEdBSEg7QUFJRDtBQUNGOztBQUVELE1BQUlqSSxFQUFFLGlCQUFGLEVBQXFCOEMsTUFBckIsR0FBOEIsQ0FBbEMsRUFBcUM7QUFDakMsUUFBSTZHLFdBQVczSixFQUFFLE1BQUYsRUFBVTRKLFFBQVYsQ0FBbUIsV0FBbkIsQ0FBZjtBQUNBLFFBQUlELFFBQUosRUFBYztBQUNWO0FBQ0g7QUFDRCxRQUFJRSxRQUFRN0osRUFBRSxNQUFGLEVBQVU0SixRQUFWLENBQW1CLE9BQW5CLENBQVo7QUFDQSxRQUFJRSxTQUFTOUosRUFBRW9JLE1BQUYsQ0FBUyx1QkFBVCxFQUFrQ25JLFNBQWxDLEVBQTZDLEVBQUNvSSxNQUFPLElBQVIsRUFBN0MsQ0FBYjtBQUNBLFFBQUlqSCxNQUFNcEIsRUFBRW9CLEdBQUYsRUFBVixDQVBpQyxDQU9kO0FBQ25CLFFBQUkySSxTQUFTM0ksSUFBSVEsS0FBSixDQUFVLElBQVYsQ0FBYjtBQUNBLFFBQUlrSSxVQUFVLElBQWQsRUFBb0I7QUFDaEJBLGVBQVMsRUFBVDtBQUNIOztBQUVELFFBQUlFLE1BQU0sRUFBVjtBQUNBLFNBQUssSUFBSTdCLEVBQVQsSUFBZTJCLE1BQWYsRUFBdUI7QUFDbkIsVUFBSUEsT0FBTzNFLGNBQVAsQ0FBc0JnRCxFQUF0QixDQUFKLEVBQStCO0FBQzNCNkIsWUFBSTFHLElBQUosQ0FBUzZFLEVBQVQ7QUFDSDtBQUNKOztBQUVELFFBQUs2QixJQUFJdkcsT0FBSixDQUFZc0csTUFBWixJQUFzQixDQUF2QixJQUE2QkYsS0FBakMsRUFBd0M7QUFBQSxVQUszQkksU0FMMkIsR0FLcEMsU0FBU0EsU0FBVCxHQUFxQjtBQUNqQixZQUFJQyxPQUFPbEssRUFBRSxpQkFBRixFQUFxQmtLLElBQXJCLEVBQVg7QUFDQSxZQUFJQyxTQUFTQyxRQUFRQyxNQUFSLENBQWVILElBQWYsRUFBcUIsQ0FBQyxFQUFFSSxPQUFPLElBQVQsRUFBZSxTQUFVLDZCQUF6QixFQUFELENBQXJCLEVBQWlGLEVBQUVDLFFBQVMsZ0JBQVgsRUFBNkJDLE1BQU0sYUFBbkMsRUFBakYsQ0FBYjtBQUNILE9BUm1DOztBQUNwQ1YsYUFBT0MsTUFBUCxJQUFpQixDQUFqQjtBQUNBO0FBQ0EvSixRQUFFb0ksTUFBRixDQUFTLHVCQUFULEVBQWtDMEIsTUFBbEMsRUFBMEMsRUFBRXpCLE1BQU8sSUFBVCxFQUFlckcsTUFBTSxHQUFyQixFQUEwQnlJLFFBQVEsaUJBQWxDLEVBQTFDOztBQU1BcEYsYUFBT2UsVUFBUCxDQUFrQjZELFNBQWxCLEVBQTZCLElBQTdCLEVBQW1DLElBQW5DO0FBQ0g7QUFDSjtBQUVGLENBeEdEOzs7QUNBQTs7Ozs7Ozs7O0FBU0E7O0FBRUE7O0FBRUEsSUFBSSxjQUFjUyxJQUFsQixFQUF3Qjs7QUFFeEI7QUFDQTtBQUNBLEtBQ0ksRUFBRSxlQUFlQyxTQUFTQyxhQUFULENBQXVCLEdBQXZCLENBQWpCLEtBQ0FELFNBQVNFLGVBQVQsSUFDQSxFQUFFLGVBQWVGLFNBQVNFLGVBQVQsQ0FBeUIsNEJBQXpCLEVBQXNELEdBQXRELENBQWpCLENBSEosRUFJRTs7QUFFRCxhQUFVQyxJQUFWLEVBQWdCOztBQUVqQjs7QUFFQSxPQUFJLEVBQUUsYUFBYUEsSUFBZixDQUFKLEVBQTBCOztBQUUxQixPQUNHQyxnQkFBZ0IsV0FEbkI7QUFBQSxPQUVHQyxZQUFZLFdBRmY7QUFBQSxPQUdHQyxlQUFlSCxLQUFLSSxPQUFMLENBQWFGLFNBQWIsQ0FIbEI7QUFBQSxPQUlHRyxTQUFTbkssTUFKWjtBQUFBLE9BS0dvSyxVQUFVbEgsT0FBTzhHLFNBQVAsRUFBa0JLLElBQWxCLElBQTBCLFlBQVk7QUFDakQsV0FBTyxLQUFLcEosT0FBTCxDQUFhLFlBQWIsRUFBMkIsRUFBM0IsQ0FBUDtBQUNBLElBUEY7QUFBQSxPQVFHcUosYUFBYUMsTUFBTVAsU0FBTixFQUFpQnZILE9BQWpCLElBQTRCLFVBQVUrSCxJQUFWLEVBQWdCO0FBQzFELFFBQ0cxSixJQUFJLENBRFA7QUFBQSxRQUVHK0IsTUFBTSxLQUFLZixNQUZkO0FBSUEsV0FBT2hCLElBQUkrQixHQUFYLEVBQWdCL0IsR0FBaEIsRUFBcUI7QUFDcEIsU0FBSUEsS0FBSyxJQUFMLElBQWEsS0FBS0EsQ0FBTCxNQUFZMEosSUFBN0IsRUFBbUM7QUFDbEMsYUFBTzFKLENBQVA7QUFDQTtBQUNEO0FBQ0QsV0FBTyxDQUFDLENBQVI7QUFDQTtBQUNEO0FBcEJEO0FBQUEsT0FxQkcySixRQUFRLFNBQVJBLEtBQVEsQ0FBVUMsSUFBVixFQUFnQi9DLE9BQWhCLEVBQXlCO0FBQ2xDLFNBQUtnRCxJQUFMLEdBQVlELElBQVo7QUFDQSxTQUFLRSxJQUFMLEdBQVlDLGFBQWFILElBQWIsQ0FBWjtBQUNBLFNBQUsvQyxPQUFMLEdBQWVBLE9BQWY7QUFDQSxJQXpCRjtBQUFBLE9BMEJHbUQsd0JBQXdCLFNBQXhCQSxxQkFBd0IsQ0FBVUMsU0FBVixFQUFxQkMsS0FBckIsRUFBNEI7QUFDckQsUUFBSUEsVUFBVSxFQUFkLEVBQWtCO0FBQ2pCLFdBQU0sSUFBSVAsS0FBSixDQUNILFlBREcsRUFFSCw4QkFGRyxDQUFOO0FBSUE7QUFDRCxRQUFJLEtBQUs5SCxJQUFMLENBQVVxSSxLQUFWLENBQUosRUFBc0I7QUFDckIsV0FBTSxJQUFJUCxLQUFKLENBQ0gsdUJBREcsRUFFSCw4Q0FGRyxDQUFOO0FBSUE7QUFDRCxXQUFPSCxXQUFXdEcsSUFBWCxDQUFnQitHLFNBQWhCLEVBQTJCQyxLQUEzQixDQUFQO0FBQ0EsSUF4Q0Y7QUFBQSxPQXlDR0MsWUFBWSxTQUFaQSxTQUFZLENBQVVDLElBQVYsRUFBZ0I7QUFDN0IsUUFDR0MsaUJBQWlCZixRQUFRcEcsSUFBUixDQUFha0gsS0FBS0UsWUFBTCxDQUFrQixPQUFsQixLQUE4QixFQUEzQyxDQURwQjtBQUFBLFFBRUdDLFVBQVVGLGlCQUFpQkEsZUFBZWpLLEtBQWYsQ0FBcUIsS0FBckIsQ0FBakIsR0FBK0MsRUFGNUQ7QUFBQSxRQUdHSixJQUFJLENBSFA7QUFBQSxRQUlHK0IsTUFBTXdJLFFBQVF2SixNQUpqQjtBQU1BLFdBQU9oQixJQUFJK0IsR0FBWCxFQUFnQi9CLEdBQWhCLEVBQXFCO0FBQ3BCLFVBQUt3QixJQUFMLENBQVUrSSxRQUFRdkssQ0FBUixDQUFWO0FBQ0E7QUFDRCxTQUFLd0ssZ0JBQUwsR0FBd0IsWUFBWTtBQUNuQ0osVUFBS0ssWUFBTCxDQUFrQixPQUFsQixFQUEyQixLQUFLeEwsUUFBTCxFQUEzQjtBQUNBLEtBRkQ7QUFHQSxJQXRERjtBQUFBLE9BdURHeUwsaUJBQWlCUCxVQUFVakIsU0FBVixJQUF1QixFQXZEM0M7QUFBQSxPQXdER3lCLGtCQUFrQixTQUFsQkEsZUFBa0IsR0FBWTtBQUMvQixXQUFPLElBQUlSLFNBQUosQ0FBYyxJQUFkLENBQVA7QUFDQSxJQTFERjtBQTREQTtBQUNBO0FBQ0FSLFNBQU1ULFNBQU4sSUFBbUIwQixNQUFNMUIsU0FBTixDQUFuQjtBQUNBd0Isa0JBQWVoQixJQUFmLEdBQXNCLFVBQVUxSixDQUFWLEVBQWE7QUFDbEMsV0FBTyxLQUFLQSxDQUFMLEtBQVcsSUFBbEI7QUFDQSxJQUZEO0FBR0EwSyxrQkFBZUcsUUFBZixHQUEwQixVQUFVWCxLQUFWLEVBQWlCO0FBQzFDLFdBQU8sQ0FBQ0Ysc0JBQXNCLElBQXRCLEVBQTRCRSxRQUFRLEVBQXBDLENBQVI7QUFDQSxJQUZEO0FBR0FRLGtCQUFlSSxHQUFmLEdBQXFCLFlBQVk7QUFDaEMsUUFDR0MsU0FBUzlILFNBRFo7QUFBQSxRQUVHakQsSUFBSSxDQUZQO0FBQUEsUUFHRytDLElBQUlnSSxPQUFPL0osTUFIZDtBQUFBLFFBSUdrSixLQUpIO0FBQUEsUUFLR2MsVUFBVSxLQUxiO0FBT0EsT0FBRztBQUNGZCxhQUFRYSxPQUFPL0ssQ0FBUCxJQUFZLEVBQXBCO0FBQ0EsU0FBSSxDQUFDLENBQUNnSyxzQkFBc0IsSUFBdEIsRUFBNEJFLEtBQTVCLENBQU4sRUFBMEM7QUFDekMsV0FBSzFJLElBQUwsQ0FBVTBJLEtBQVY7QUFDQWMsZ0JBQVUsSUFBVjtBQUNBO0FBQ0QsS0FORCxRQU9PLEVBQUVoTCxDQUFGLEdBQU0rQyxDQVBiOztBQVNBLFFBQUlpSSxPQUFKLEVBQWE7QUFDWixVQUFLUixnQkFBTDtBQUNBO0FBQ0QsSUFwQkQ7QUFxQkFFLGtCQUFlTyxNQUFmLEdBQXdCLFlBQVk7QUFDbkMsUUFDR0YsU0FBUzlILFNBRFo7QUFBQSxRQUVHakQsSUFBSSxDQUZQO0FBQUEsUUFHRytDLElBQUlnSSxPQUFPL0osTUFIZDtBQUFBLFFBSUdrSixLQUpIO0FBQUEsUUFLR2MsVUFBVSxLQUxiO0FBQUEsUUFNR0UsS0FOSDtBQVFBLE9BQUc7QUFDRmhCLGFBQVFhLE9BQU8vSyxDQUFQLElBQVksRUFBcEI7QUFDQWtMLGFBQVFsQixzQkFBc0IsSUFBdEIsRUFBNEJFLEtBQTVCLENBQVI7QUFDQSxZQUFPLENBQUNnQixLQUFSLEVBQWU7QUFDZCxXQUFLQyxNQUFMLENBQVlELEtBQVosRUFBbUIsQ0FBbkI7QUFDQUYsZ0JBQVUsSUFBVjtBQUNBRSxjQUFRbEIsc0JBQXNCLElBQXRCLEVBQTRCRSxLQUE1QixDQUFSO0FBQ0E7QUFDRCxLQVJELFFBU08sRUFBRWxLLENBQUYsR0FBTStDLENBVGI7O0FBV0EsUUFBSWlJLE9BQUosRUFBYTtBQUNaLFVBQUtSLGdCQUFMO0FBQ0E7QUFDRCxJQXZCRDtBQXdCQUUsa0JBQWVVLE1BQWYsR0FBd0IsVUFBVWxCLEtBQVYsRUFBaUJtQixLQUFqQixFQUF3QjtBQUMvQyxRQUNHQyxTQUFTLEtBQUtULFFBQUwsQ0FBY1gsS0FBZCxDQURaO0FBQUEsUUFFR3FCLFNBQVNELFNBQ1ZELFVBQVUsSUFBVixJQUFrQixRQURSLEdBR1ZBLFVBQVUsS0FBVixJQUFtQixLQUxyQjs7QUFRQSxRQUFJRSxNQUFKLEVBQVk7QUFDWCxVQUFLQSxNQUFMLEVBQWFyQixLQUFiO0FBQ0E7O0FBRUQsUUFBSW1CLFVBQVUsSUFBVixJQUFrQkEsVUFBVSxLQUFoQyxFQUF1QztBQUN0QyxZQUFPQSxLQUFQO0FBQ0EsS0FGRCxNQUVPO0FBQ04sWUFBTyxDQUFDQyxNQUFSO0FBQ0E7QUFDRCxJQWxCRDtBQW1CQVosa0JBQWV2SyxPQUFmLEdBQXlCLFVBQVUrSixLQUFWLEVBQWlCc0IsaUJBQWpCLEVBQW9DO0FBQzVELFFBQUlOLFFBQVFsQixzQkFBc0JFLFFBQVEsRUFBOUIsQ0FBWjtBQUNBLFFBQUksQ0FBQ2dCLEtBQUwsRUFBWTtBQUNYLFVBQUtDLE1BQUwsQ0FBWUQsS0FBWixFQUFtQixDQUFuQixFQUFzQk0saUJBQXRCO0FBQ0EsVUFBS2hCLGdCQUFMO0FBQ0E7QUFDRCxJQU5EO0FBT0FFLGtCQUFlekwsUUFBZixHQUEwQixZQUFZO0FBQ3JDLFdBQU8sS0FBS3dNLElBQUwsQ0FBVSxHQUFWLENBQVA7QUFDQSxJQUZEOztBQUlBLE9BQUlwQyxPQUFPcUMsY0FBWCxFQUEyQjtBQUMxQixRQUFJQyxvQkFBb0I7QUFDckJsRSxVQUFLa0QsZUFEZ0I7QUFFckJpQixpQkFBWSxJQUZTO0FBR3JCQyxtQkFBYztBQUhPLEtBQXhCO0FBS0EsUUFBSTtBQUNIeEMsWUFBT3FDLGNBQVAsQ0FBc0J2QyxZQUF0QixFQUFvQ0YsYUFBcEMsRUFBbUQwQyxpQkFBbkQ7QUFDQSxLQUZELENBRUUsT0FBT0csRUFBUCxFQUFXO0FBQUU7QUFDZDtBQUNBO0FBQ0EsU0FBSUEsR0FBR0MsTUFBSCxLQUFjNU4sU0FBZCxJQUEyQjJOLEdBQUdDLE1BQUgsS0FBYyxDQUFDLFVBQTlDLEVBQTBEO0FBQ3pESix3QkFBa0JDLFVBQWxCLEdBQStCLEtBQS9CO0FBQ0F2QyxhQUFPcUMsY0FBUCxDQUFzQnZDLFlBQXRCLEVBQW9DRixhQUFwQyxFQUFtRDBDLGlCQUFuRDtBQUNBO0FBQ0Q7QUFDRCxJQWhCRCxNQWdCTyxJQUFJdEMsT0FBT0gsU0FBUCxFQUFrQjhDLGdCQUF0QixFQUF3QztBQUM5QzdDLGlCQUFhNkMsZ0JBQWIsQ0FBOEIvQyxhQUE5QixFQUE2QzBCLGVBQTdDO0FBQ0E7QUFFQSxHQTFLQSxFQTBLQy9CLElBMUtELENBQUQ7QUE0S0M7O0FBRUQ7QUFDQTs7QUFFQyxjQUFZO0FBQ1o7O0FBRUEsTUFBSXFELGNBQWNwRCxTQUFTQyxhQUFULENBQXVCLEdBQXZCLENBQWxCOztBQUVBbUQsY0FBWWhDLFNBQVosQ0FBc0JhLEdBQXRCLENBQTBCLElBQTFCLEVBQWdDLElBQWhDOztBQUVBO0FBQ0E7QUFDQSxNQUFJLENBQUNtQixZQUFZaEMsU0FBWixDQUFzQlksUUFBdEIsQ0FBK0IsSUFBL0IsQ0FBTCxFQUEyQztBQUMxQyxPQUFJcUIsZUFBZSxTQUFmQSxZQUFlLENBQVNYLE1BQVQsRUFBaUI7QUFDbkMsUUFBSVksV0FBV0MsYUFBYWpOLFNBQWIsQ0FBdUJvTSxNQUF2QixDQUFmOztBQUVBYSxpQkFBYWpOLFNBQWIsQ0FBdUJvTSxNQUF2QixJQUFpQyxVQUFTckIsS0FBVCxFQUFnQjtBQUNoRCxTQUFJbEssQ0FBSjtBQUFBLFNBQU8rQixNQUFNa0IsVUFBVWpDLE1BQXZCOztBQUVBLFVBQUtoQixJQUFJLENBQVQsRUFBWUEsSUFBSStCLEdBQWhCLEVBQXFCL0IsR0FBckIsRUFBMEI7QUFDekJrSyxjQUFRakgsVUFBVWpELENBQVYsQ0FBUjtBQUNBbU0sZUFBU2pKLElBQVQsQ0FBYyxJQUFkLEVBQW9CZ0gsS0FBcEI7QUFDQTtBQUNELEtBUEQ7QUFRQSxJQVhEO0FBWUFnQyxnQkFBYSxLQUFiO0FBQ0FBLGdCQUFhLFFBQWI7QUFDQTs7QUFFREQsY0FBWWhDLFNBQVosQ0FBc0JtQixNQUF0QixDQUE2QixJQUE3QixFQUFtQyxLQUFuQzs7QUFFQTtBQUNBO0FBQ0EsTUFBSWEsWUFBWWhDLFNBQVosQ0FBc0JZLFFBQXRCLENBQStCLElBQS9CLENBQUosRUFBMEM7QUFDekMsT0FBSXdCLFVBQVVELGFBQWFqTixTQUFiLENBQXVCaU0sTUFBckM7O0FBRUFnQixnQkFBYWpOLFNBQWIsQ0FBdUJpTSxNQUF2QixHQUFnQyxVQUFTbEIsS0FBVCxFQUFnQm1CLEtBQWhCLEVBQXVCO0FBQ3RELFFBQUksS0FBS3BJLFNBQUwsSUFBa0IsQ0FBQyxLQUFLNEgsUUFBTCxDQUFjWCxLQUFkLENBQUQsS0FBMEIsQ0FBQ21CLEtBQWpELEVBQXdEO0FBQ3ZELFlBQU9BLEtBQVA7QUFDQSxLQUZELE1BRU87QUFDTixZQUFPZ0IsUUFBUW5KLElBQVIsQ0FBYSxJQUFiLEVBQW1CZ0gsS0FBbkIsQ0FBUDtBQUNBO0FBQ0QsSUFORDtBQVFBOztBQUVEO0FBQ0EsTUFBSSxFQUFFLGFBQWFyQixTQUFTQyxhQUFULENBQXVCLEdBQXZCLEVBQTRCbUIsU0FBM0MsQ0FBSixFQUEyRDtBQUMxRG1DLGdCQUFhak4sU0FBYixDQUF1QmdCLE9BQXZCLEdBQWlDLFVBQVUrSixLQUFWLEVBQWlCc0IsaUJBQWpCLEVBQW9DO0FBQ3BFLFFBQ0dULFNBQVMsS0FBSzlMLFFBQUwsR0FBZ0JtQixLQUFoQixDQUFzQixHQUF0QixDQURaO0FBQUEsUUFFRzhLLFFBQVFILE9BQU9wSixPQUFQLENBQWV1SSxRQUFRLEVBQXZCLENBRlg7QUFJQSxRQUFJLENBQUNnQixLQUFMLEVBQVk7QUFDWEgsY0FBU0EsT0FBT3VCLEtBQVAsQ0FBYXBCLEtBQWIsQ0FBVDtBQUNBLFVBQUtELE1BQUwsQ0FBWXNCLEtBQVosQ0FBa0IsSUFBbEIsRUFBd0J4QixNQUF4QjtBQUNBLFVBQUtELEdBQUwsQ0FBU1UsaUJBQVQ7QUFDQSxVQUFLVixHQUFMLENBQVN5QixLQUFULENBQWUsSUFBZixFQUFxQnhCLE9BQU91QixLQUFQLENBQWEsQ0FBYixDQUFyQjtBQUNBO0FBQ0QsSUFYRDtBQVlBOztBQUVETCxnQkFBYyxJQUFkO0FBQ0EsRUE1REEsR0FBRDtBQThEQzs7O0FDdFFEakksS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCLFFBQUl1SSwyQkFBMkIsR0FBL0I7QUFDQSxRQUFJQyx1QkFBdUIsR0FBM0I7O0FBRUEsUUFBSUMsc0JBQXNCLHFDQUExQjs7QUFFQSxRQUFJQyxXQUFXek8sRUFBRSxxQ0FBRixDQUFmO0FBQ0EsUUFBSTBPLFlBQVkxTyxFQUFFLFdBQUYsQ0FBaEI7QUFDQSxRQUFJMk8sV0FBVzNPLEVBQUUsVUFBRixDQUFmOztBQUVBLGFBQVM0TyxhQUFULENBQXVCQyxHQUF2QixFQUE0QjtBQUN4QixZQUFLLENBQUVILFVBQVU1TCxNQUFqQixFQUEwQjtBQUN0QjRMLHdCQUFZMU8sRUFBRSwyRUFBRixFQUErRThPLFdBQS9FLENBQTJGTCxRQUEzRixDQUFaO0FBQ0g7QUFDREMsa0JBQVVsRyxJQUFWLENBQWVxRyxHQUFmLEVBQW9CRSxJQUFwQjtBQUNBbEosV0FBR21KLGFBQUgsQ0FBaUJILEdBQWpCO0FBQ0g7O0FBRUQsYUFBU0ksWUFBVCxDQUFzQkosR0FBdEIsRUFBMkI7QUFDdkIsWUFBSyxDQUFFRixTQUFTN0wsTUFBaEIsRUFBeUI7QUFDckI2TCx1QkFBVzNPLEVBQUUseUVBQUYsRUFBNkU4TyxXQUE3RSxDQUF5RkwsUUFBekYsQ0FBWDtBQUNIO0FBQ0RFLGlCQUFTbkcsSUFBVCxDQUFjcUcsR0FBZCxFQUFtQkUsSUFBbkI7QUFDQWxKLFdBQUdtSixhQUFILENBQWlCSCxHQUFqQjtBQUNIOztBQUVELGFBQVNLLFVBQVQsR0FBc0I7QUFDbEJSLGtCQUFVUyxJQUFWLEdBQWlCM0csSUFBakI7QUFDSDs7QUFFRCxhQUFTNEcsU0FBVCxHQUFxQjtBQUNqQlQsaUJBQVNRLElBQVQsR0FBZ0IzRyxJQUFoQjtBQUNIOztBQUVELGFBQVM2RyxPQUFULEdBQW1CO0FBQ2YsWUFBSWpPLE1BQU0sU0FBVjtBQUNBLFlBQUtrRSxTQUFTZ0ssUUFBVCxDQUFrQjdMLE9BQWxCLENBQTBCLFNBQTFCLElBQXVDLENBQUMsQ0FBN0MsRUFBaUQ7QUFDN0NyQyxrQkFBTSxXQUFOO0FBQ0g7QUFDRCxlQUFPQSxHQUFQO0FBQ0g7O0FBRUQsYUFBU21PLFVBQVQsQ0FBb0JoSyxJQUFwQixFQUEwQjtBQUN0QixZQUFJa0IsU0FBUyxFQUFiO0FBQ0EsWUFBSStJLE1BQU1qSyxLQUFLckQsS0FBTCxDQUFXLEdBQVgsQ0FBVjtBQUNBLGFBQUksSUFBSUosSUFBSSxDQUFaLEVBQWVBLElBQUkwTixJQUFJMU0sTUFBdkIsRUFBK0JoQixHQUEvQixFQUFvQztBQUNoQyxnQkFBSTJOLEtBQUtELElBQUkxTixDQUFKLEVBQU9JLEtBQVAsQ0FBYSxHQUFiLENBQVQ7QUFDQXVFLG1CQUFPZ0osR0FBRyxDQUFILENBQVAsSUFBZ0JBLEdBQUcsQ0FBSCxDQUFoQjtBQUNIO0FBQ0QsZUFBT2hKLE1BQVA7QUFDSDs7QUFFRCxhQUFTaUosd0JBQVQsQ0FBa0NDLElBQWxDLEVBQXdDOztBQUVwQyxZQUFJQyxVQUFVNVAsRUFBRTZQLE1BQUYsQ0FBUyxFQUFFQyxVQUFXLEtBQWIsRUFBb0J4RixPQUFRLGNBQTVCLEVBQVQsRUFBdURxRixJQUF2RCxDQUFkOztBQUVBLFlBQUlJLFNBQVMvUCxFQUNULCtDQUNJLDZCQURKLEdBRVEsb0VBRlIsR0FHUSx3QkFIUixHQUlZLHVJQUpaLEdBS1ksMkRBTFosR0FNUSxRQU5SLEdBT0ksUUFQSixHQVFJLDZCQVJKLEdBU1Esa0VBVFIsR0FVUSx3QkFWUixHQVdZLDhJQVhaLEdBWVksNkRBWlosR0FhUSxRQWJSLEdBY0ksUUFkSixHQWVJLDZCQWZKLEdBZ0JRLDhHQWhCUixHQWlCUSx3QkFqQlIsR0FrQlksaUZBbEJaLEdBbUJZLGdEQW5CWixHQW9CZ0IsVUFwQmhCLEdBcUJZLFVBckJaLEdBc0JZLCtEQXRCWixHQXVCWSxnREF2QlosR0F3QmdCLFNBeEJoQixHQXlCWSxVQXpCWixHQTBCUSxRQTFCUixHQTJCSSxRQTNCSixHQTRCQSxTQTdCUyxDQUFiOztBQWdDQSxZQUFLNFAsUUFBUUksRUFBYixFQUFrQjtBQUNkRCxtQkFBTy9ILElBQVAsQ0FBWSxnQkFBWixFQUE4QjlFLEdBQTlCLENBQWtDME0sUUFBUUksRUFBMUM7QUFDSDs7QUFFRCxZQUFLSixRQUFRSyxJQUFiLEVBQW9CO0FBQ2hCRixtQkFBTy9ILElBQVAsQ0FBWSxxQkFBWixFQUFtQzlFLEdBQW5DLENBQXVDME0sUUFBUUssSUFBL0M7QUFDSDs7QUFFRCxZQUFLTCxRQUFRTSxJQUFSLElBQWdCLElBQXJCLEVBQTRCO0FBQ3hCSCxtQkFBTy9ILElBQVAsQ0FBWSw0QkFBNEI0SCxRQUFRTSxJQUFwQyxHQUEyQyxHQUF2RCxFQUE0RHZPLElBQTVELENBQWlFLFNBQWpFLEVBQTRFLFNBQTVFO0FBQ0gsU0FGRCxNQUVPLElBQUssQ0FBRWtFLEdBQUdzSyxZQUFILENBQWdCQyxTQUF2QixFQUFtQztBQUN0Q0wsbUJBQU8vSCxJQUFQLENBQVksMkJBQVosRUFBeUNyRyxJQUF6QyxDQUE4QyxTQUE5QyxFQUF5RCxTQUF6RDtBQUNBM0IsY0FBRSw0SUFBRixFQUFnSnFRLFFBQWhKLENBQXlKTixNQUF6SjtBQUNBO0FBQ0FBLG1CQUFPL0gsSUFBUCxDQUFZLDJCQUFaLEVBQXlDK0UsTUFBekM7QUFDQWdELG1CQUFPL0gsSUFBUCxDQUFZLDBCQUFaLEVBQXdDK0UsTUFBeEM7QUFDSDs7QUFFRCxZQUFLNkMsUUFBUVUsT0FBYixFQUF1QjtBQUNuQlYsb0JBQVFVLE9BQVIsQ0FBZ0IvSCxLQUFoQixHQUF3QjhILFFBQXhCLENBQWlDTixNQUFqQztBQUNILFNBRkQsTUFFTztBQUNIL1AsY0FBRSxrQ0FBRixFQUFzQ3FRLFFBQXRDLENBQStDTixNQUEvQyxFQUF1RDdNLEdBQXZELENBQTJEME0sUUFBUWpMLENBQW5FO0FBQ0EzRSxjQUFFLGtDQUFGLEVBQXNDcVEsUUFBdEMsQ0FBK0NOLE1BQS9DLEVBQXVEN00sR0FBdkQsQ0FBMkQwTSxRQUFRelAsQ0FBbkU7QUFDSDs7QUFFRCxZQUFLeVAsUUFBUVcsR0FBYixFQUFtQjtBQUNmdlEsY0FBRSxvQ0FBRixFQUF3Q3FRLFFBQXhDLENBQWlETixNQUFqRCxFQUF5RDdNLEdBQXpELENBQTZEME0sUUFBUVcsR0FBckU7QUFDSDs7QUFFRCxZQUFJQyxVQUFVcEcsUUFBUUMsTUFBUixDQUFlMEYsTUFBZixFQUF1QixDQUNqQztBQUNJLHFCQUFVLFFBRGQ7QUFFSSxxQkFBVTtBQUZkLFNBRGlDLEVBS2pDO0FBQ0kscUJBQVVILFFBQVF0RixLQUR0QjtBQUVJLHFCQUFVLDZCQUZkO0FBR0ltRyxzQkFBVyxvQkFBVzs7QUFFbEIsb0JBQUlwUSxPQUFPMFAsT0FBT3hHLEdBQVAsQ0FBVyxDQUFYLENBQVg7QUFDQSxvQkFBSyxDQUFFbEosS0FBS3FRLGFBQUwsRUFBUCxFQUE4QjtBQUMxQnJRLHlCQUFLc1EsY0FBTDtBQUNBLDJCQUFPLEtBQVA7QUFDSDs7QUFFRCxvQkFBSVgsS0FBS2hRLEVBQUVxTCxJQUFGLENBQU8wRSxPQUFPL0gsSUFBUCxDQUFZLGdCQUFaLEVBQThCOUUsR0FBOUIsRUFBUCxDQUFUO0FBQ0Esb0JBQUkrTSxPQUFPalEsRUFBRXFMLElBQUYsQ0FBTzBFLE9BQU8vSCxJQUFQLENBQVkscUJBQVosRUFBbUM5RSxHQUFuQyxFQUFQLENBQVg7O0FBRUEsb0JBQUssQ0FBRThNLEVBQVAsRUFBWTtBQUNSO0FBQ0EsMkJBQU8sS0FBUDtBQUNIOztBQUVEZiw2QkFBYSw0QkFBYjtBQUNBMkIsNEJBQVk7QUFDUnpRLHVCQUFJLFVBREk7QUFFUjZQLHdCQUFLQSxFQUZHO0FBR1JDLDBCQUFPQSxJQUhDO0FBSVJDLDBCQUFPSCxPQUFPL0gsSUFBUCxDQUFZLDBCQUFaLEVBQXdDOUUsR0FBeEM7QUFKQyxpQkFBWjtBQU1IO0FBMUJMLFNBTGlDLENBQXZCLENBQWQ7O0FBbUNBc04sZ0JBQVF4SSxJQUFSLENBQWEsMkJBQWIsRUFBMEM2SSxJQUExQyxDQUErQyxZQUFXO0FBQ3RELGdCQUFJQyxRQUFROVEsRUFBRSxJQUFGLENBQVo7QUFDQSxnQkFBSStRLFNBQVMvUSxFQUFFLE1BQU04USxNQUFNblAsSUFBTixDQUFXLElBQVgsQ0FBTixHQUF5QixRQUEzQixDQUFiO0FBQ0EsZ0JBQUlxUCxRQUFRRixNQUFNblAsSUFBTixDQUFXLFdBQVgsQ0FBWjs7QUFFQW9QLG1CQUFPdkksSUFBUCxDQUFZd0ksUUFBUUYsTUFBTTVOLEdBQU4sR0FBWUosTUFBaEM7O0FBRUFnTyxrQkFBTUcsSUFBTixDQUFXLE9BQVgsRUFBb0IsWUFBVztBQUMzQkYsdUJBQU92SSxJQUFQLENBQVl3SSxRQUFRRixNQUFNNU4sR0FBTixHQUFZSixNQUFoQztBQUNILGFBRkQ7QUFHSCxTQVZEO0FBV0g7O0FBRUQsYUFBUzhOLFdBQVQsQ0FBcUIxSSxNQUFyQixFQUE2QjtBQUN6QixZQUFJM0MsT0FBT3ZGLEVBQUU2UCxNQUFGLENBQVMsRUFBVCxFQUFhLEVBQUVxQixNQUFPLE1BQVQsRUFBaUIvSSxJQUFLdEMsR0FBR3FDLE1BQUgsQ0FBVUMsRUFBaEMsRUFBYixFQUFtREQsTUFBbkQsQ0FBWDtBQUNBbEksVUFBRStHLElBQUYsQ0FBTztBQUNIM0YsaUJBQU1pTyxTQURIO0FBRUg5SixrQkFBT0E7QUFGSixTQUFQLEVBR0c0TCxJQUhILENBR1EsVUFBUzVMLElBQVQsRUFBZTtBQUNuQixnQkFBSTJDLFNBQVNxSCxXQUFXaEssSUFBWCxDQUFiO0FBQ0E2SjtBQUNBLGdCQUFLbEgsT0FBT2tGLE1BQVAsSUFBaUIsa0JBQXRCLEVBQTJDO0FBQ3ZDO0FBQ0FnRSxvQ0FBb0JsSixNQUFwQjtBQUNILGFBSEQsTUFHTyxJQUFLQSxPQUFPa0YsTUFBUCxJQUFpQixrQkFBdEIsRUFBMkM7QUFDOUN3Qiw4QkFBYyx1Q0FBZDtBQUNILGFBRk0sTUFFQTtBQUNIeUMsd0JBQVFDLEdBQVIsQ0FBWS9MLElBQVo7QUFDSDtBQUNKLFNBZEQsRUFjR2dNLElBZEgsQ0FjUSxVQUFTQyxLQUFULEVBQWdCQyxVQUFoQixFQUE0QkMsV0FBNUIsRUFBeUM7QUFDN0NMLG9CQUFRQyxHQUFSLENBQVlHLFVBQVosRUFBd0JDLFdBQXhCO0FBQ0gsU0FoQkQ7QUFpQkg7O0FBRUQsYUFBU04sbUJBQVQsQ0FBNkJsSixNQUE3QixFQUFxQztBQUNqQyxZQUFJeUosTUFBTTNSLEVBQUUsd0JBQUYsQ0FBVjtBQUNBLFlBQUk0UixZQUFZdkMsWUFBWSxjQUFaLEdBQTZCbkgsT0FBTzJKLE9BQXBEO0FBQ0EsWUFBSUMsS0FBSzlSLEVBQUUsS0FBRixFQUFTMkIsSUFBVCxDQUFjLE1BQWQsRUFBc0JpUSxTQUF0QixFQUFpQ3BKLElBQWpDLENBQXNDTixPQUFPNkosU0FBN0MsQ0FBVDtBQUNBL1IsVUFBRSxXQUFGLEVBQWVxUSxRQUFmLENBQXdCc0IsR0FBeEIsRUFBNkJsSixNQUE3QixDQUFvQ3FKLEVBQXBDOztBQUVBOVIsVUFBRSxnQ0FBRixFQUFvQ3dJLElBQXBDLENBQXlDZ0csbUJBQXpDOztBQUVBO0FBQ0EsWUFBSXdELFVBQVV2RCxTQUFTekcsSUFBVCxDQUFjLG1CQUFtQkUsT0FBTzJKLE9BQTFCLEdBQW9DLElBQWxELENBQWQ7QUFDQUcsZ0JBQVFqRixNQUFSOztBQUVBbEgsV0FBR21KLGFBQUgsdUJBQXFDOUcsT0FBTzZKLFNBQTVDO0FBQ0g7O0FBRUQsYUFBU0UsYUFBVCxDQUF1QkMsUUFBdkIsRUFBaUNDLFdBQWpDLEVBQThDMUIsUUFBOUMsRUFBd0Q7O0FBRXBELFlBQUt5QixZQUFZLElBQVosSUFBb0JBLFdBQVdDLFdBQVgsR0FBeUIsSUFBbEQsRUFBeUQ7QUFDckQsZ0JBQUlDLE1BQUo7QUFDQSxnQkFBSUQsY0FBYyxDQUFsQixFQUFxQjtBQUNqQkMseUJBQVMsV0FBV0QsV0FBWCxHQUF5QixRQUFsQztBQUNILGFBRkQsTUFHSztBQUNEQyx5QkFBUyxXQUFUO0FBQ0g7QUFDRCxnQkFBSXZELE1BQU0sb0NBQW9DcUQsUUFBcEMsR0FBK0Msa0JBQS9DLEdBQW9FRSxNQUFwRSxHQUE2RSx1UkFBdkY7O0FBRUExTCxvQkFBUW1JLEdBQVIsRUFBYSxVQUFTd0QsTUFBVCxFQUFpQjtBQUMxQixvQkFBS0EsTUFBTCxFQUFjO0FBQ1Y1QjtBQUNIO0FBQ0osYUFKRDtBQUtILFNBZkQsTUFlTztBQUNIO0FBQ0FBO0FBQ0g7QUFDSjs7QUFFRDtBQUNBelEsTUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQixlQUF0QixFQUF1QyxVQUFTOUMsQ0FBVCxFQUFZO0FBQy9DQSxVQUFFZ08sY0FBRjtBQUNBLFlBQUlDLFNBQVMsTUFBYjs7QUFFQXJEOztBQUVBLFlBQUlzRCx5QkFBeUIvRCxTQUFTekcsSUFBVCxDQUFjLFFBQWQsRUFBd0I5RSxHQUF4QixFQUE3QjtBQUNBLFlBQUl1UCwyQkFBMkJoRSxTQUFTekcsSUFBVCxDQUFjLHdCQUFkLEVBQXdDUSxJQUF4QyxFQUEvQjs7QUFFQSxZQUFPZ0ssMEJBQTBCbEUsd0JBQWpDLEVBQThEO0FBQzFETSwwQkFBYywrQkFBZDtBQUNBO0FBQ0g7O0FBRUQsWUFBSzRELDBCQUEwQmpFLG9CQUEvQixFQUFzRDtBQUNsRDtBQUNBbUIscUNBQXlCO0FBQ3JCSSwwQkFBVyxJQURVO0FBRXJCbkwsbUJBQUk2TixzQkFGaUI7QUFHckJySyxvQkFBS3RDLEdBQUdxQyxNQUFILENBQVVDLEVBSE07QUFJckJoSSxtQkFBSW9TO0FBSmlCLGFBQXpCO0FBTUE7QUFDSDs7QUFFRDtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUF0RCxxQkFBYSxnREFBYjtBQUNBMkIsb0JBQVk7QUFDUjhCLGdCQUFLRixzQkFERztBQUVSclMsZUFBSztBQUZHLFNBQVo7QUFLSCxLQXRDRDtBQXdDSCxDQTFRRDs7O0FDQUEyRixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFcEIsUUFBSyxDQUFFL0YsRUFBRSxNQUFGLEVBQVUyUyxFQUFWLENBQWEsT0FBYixDQUFQLEVBQStCO0FBQzdCO0FBQ0Q7O0FBRUQ7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTlNLE9BQUcrTSxVQUFILEdBQWdCLFNBQWhCO0FBQ0EsUUFBSTlRLElBQUl1RCxPQUFPQyxRQUFQLENBQWdCa0IsSUFBaEIsQ0FBcUIvQyxPQUFyQixDQUE2QixnQkFBN0IsQ0FBUjtBQUNBLFFBQUszQixJQUFJLENBQUosSUFBUyxDQUFkLEVBQWtCO0FBQ2QrRCxXQUFHK00sVUFBSCxHQUFnQixZQUFoQjtBQUNIOztBQUVEO0FBQ0EsUUFBSUMsT0FBTzdTLEVBQUUsV0FBRixDQUFYO0FBQ0EsUUFBSThTLEtBQUtELEtBQUs3SyxJQUFMLENBQVUsU0FBVixDQUFUO0FBQ0E4SyxPQUFHOUssSUFBSCxDQUFRLFlBQVIsRUFBc0I2SSxJQUF0QixDQUEyQixZQUFXO0FBQ2xDO0FBQ0EsWUFBSTFPLFdBQVcsa0VBQWY7QUFDQUEsbUJBQVdBLFNBQVNGLE9BQVQsQ0FBaUIsU0FBakIsRUFBNEJqQyxFQUFFLElBQUYsRUFBUTJCLElBQVIsQ0FBYSxVQUFiLEVBQXlCK0IsTUFBekIsQ0FBZ0MsQ0FBaEMsQ0FBNUIsRUFBZ0V6QixPQUFoRSxDQUF3RSxXQUF4RSxFQUFxRmpDLEVBQUUsSUFBRixFQUFRMkIsSUFBUixDQUFhLFNBQWIsQ0FBckYsQ0FBWDtBQUNBbVIsV0FBR3JLLE1BQUgsQ0FBVXRHLFFBQVY7QUFDSCxLQUxEOztBQU9BLFFBQUk0RixRQUFRL0gsRUFBRSxZQUFGLENBQVo7QUFDQXFSLFlBQVFDLEdBQVIsQ0FBWSxZQUFaLEVBQTBCdkosS0FBMUI7QUFDQUEsVUFBTWxGLE1BQU4sR0FBZWtLLE1BQWY7O0FBRUFoRixZQUFRL0gsRUFBRSx1Q0FBRixDQUFSO0FBQ0ErSCxVQUFNbEYsTUFBTixHQUFla0ssTUFBZjtBQUNELENBckNEOzs7QUNBQTs7QUFFQSxJQUFJbEgsS0FBS0EsTUFBTSxFQUFmO0FBQ0EsSUFBSWtOLHNCQUFzQixvaEJBQTFCOztBQUVBbE4sR0FBR21OLFVBQUgsR0FBZ0I7O0FBRVpDLFVBQU0sY0FBU3JELE9BQVQsRUFBa0I7QUFDcEIsYUFBS0EsT0FBTCxHQUFlNVAsRUFBRTZQLE1BQUYsQ0FBUyxFQUFULEVBQWEsS0FBS0QsT0FBbEIsRUFBMkJBLE9BQTNCLENBQWY7QUFDQSxhQUFLekgsRUFBTCxHQUFVLEtBQUt5SCxPQUFMLENBQWExSCxNQUFiLENBQW9CQyxFQUE5QjtBQUNBLGFBQUsrSyxHQUFMLEdBQVcsRUFBWDtBQUNBLGVBQU8sSUFBUDtBQUNILEtBUFc7O0FBU1p0RCxhQUFTLEVBVEc7O0FBYVp1RCxXQUFRLGlCQUFXO0FBQ2YsWUFBSXpJLE9BQU8sSUFBWDtBQUNBLGFBQUswSSxVQUFMO0FBQ0gsS0FoQlc7O0FBa0JaQSxnQkFBWSxzQkFBVztBQUNuQixZQUFJMUksT0FBTyxJQUFYO0FBQ0E7QUFDQTFLLFVBQUUsMEJBQUYsRUFBOEJxVCxRQUE5QixDQUF1QyxhQUF2QztBQUNBclQsVUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQiwwQkFBdEIsRUFBa0QsVUFBUzlDLENBQVQsRUFBWTtBQUMxREEsY0FBRWdPLGNBQUY7QUFDQWxJLG9CQUFRa0osT0FBUjtBQUNBLGdCQUFLdFQsRUFBRSxJQUFGLEVBQVEyQixJQUFSLENBQWEsS0FBYixLQUF1QixPQUE1QixFQUFzQzs7QUFFbEM7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7O0FBR0Esb0JBQUsrSSxLQUFLa0YsT0FBTCxDQUFhMUgsTUFBYixDQUFvQnFMLHNCQUFwQixJQUE4QyxJQUFuRCxFQUEwRDtBQUN0RCwyQkFBTyxJQUFQO0FBQ0g7QUFDRDdJLHFCQUFLOEksV0FBTCxDQUFpQixJQUFqQjtBQUNILGFBaEJELE1BZ0JPO0FBQ0g5SSxxQkFBSytJLGdCQUFMLENBQXNCLElBQXRCO0FBQ0g7QUFDRCxtQkFBTyxLQUFQO0FBQ0gsU0F2QkQ7QUF5QkgsS0EvQ1c7O0FBaURaQSxzQkFBa0IsMEJBQVNoVCxJQUFULEVBQWU7QUFDN0IsWUFBSXlKLE9BQU9sSyxFQUFFLG1CQUFGLEVBQXVCa0ssSUFBdkIsRUFBWDtBQUNBQSxlQUFPQSxLQUFLakksT0FBTCxDQUFhLGlCQUFiLEVBQWdDakMsRUFBRSxJQUFGLEVBQVEyQixJQUFSLENBQWEsTUFBYixDQUFoQyxDQUFQO0FBQ0EsYUFBSzZPLE9BQUwsR0FBZXBHLFFBQVFzSixLQUFSLENBQWN4SixJQUFkLENBQWY7QUFDQTtBQUNILEtBdERXOztBQXdEWnNKLGlCQUFhLHFCQUFTL1MsSUFBVCxFQUFlO0FBQ3hCLFlBQUlpSyxPQUFPLElBQVg7QUFDQUEsYUFBSzNDLEtBQUwsR0FBYS9ILEVBQUVTLElBQUYsQ0FBYjtBQUNBaUssYUFBS2lKLEdBQUwsR0FBVzNULEVBQUVTLElBQUYsRUFBUWtCLElBQVIsQ0FBYSxNQUFiLENBQVg7QUFDQStJLGFBQUtrSixVQUFMLEdBQWtCNVQsRUFBRVMsSUFBRixFQUFROEUsSUFBUixDQUFhLE9BQWIsS0FBeUIsS0FBM0M7O0FBRUEsWUFBS21GLEtBQUszQyxLQUFMLENBQVd4QyxJQUFYLENBQWdCLE9BQWhCLEtBQTRCLEtBQWpDLEVBQXlDO0FBQ3JDLGdCQUFLLENBQUVtRixLQUFLM0MsS0FBTCxDQUFXeEMsSUFBWCxDQUFnQixLQUFoQixDQUFQLEVBQWdDO0FBQzVCO0FBQ0g7QUFDSjs7QUFFRCxZQUFJMkU7QUFDQTtBQUNBLHFLQUVBLHdFQUZBLEdBR0ksb0NBSEosR0FJQSxRQUpBO0FBS0E7QUFDQTtBQUNBO0FBUEEsMkpBRko7O0FBWUEsWUFBSUssU0FBUyxtQkFBbUJHLEtBQUtrSixVQUFyQztBQUNBLFlBQUlDLFFBQVFuSixLQUFLM0MsS0FBTCxDQUFXeEMsSUFBWCxDQUFnQixPQUFoQixLQUE0QixDQUF4QztBQUNBLFlBQUtzTyxRQUFRLENBQWIsRUFBaUI7QUFDYixnQkFBSUMsU0FBU0QsU0FBUyxDQUFULEdBQWEsTUFBYixHQUFzQixPQUFuQztBQUNBdEosc0JBQVUsT0FBT3NKLEtBQVAsR0FBZSxHQUFmLEdBQXFCQyxNQUFyQixHQUE4QixHQUF4QztBQUNIOztBQUVEcEosYUFBSzhGLE9BQUwsR0FBZXBHLFFBQVFDLE1BQVIsQ0FDWEgsSUFEVyxFQUVYLENBQ0k7QUFDSUksbUJBQVEsUUFEWjtBQUVJLHFCQUFVLG1CQUZkO0FBR0ltRyxzQkFBVSxvQkFBVztBQUNqQixvQkFBSy9GLEtBQUs4RixPQUFMLENBQWFqTCxJQUFiLENBQWtCLGFBQWxCLENBQUwsRUFBd0M7QUFDcENtRix5QkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFDQTtBQUNIO0FBQ0QvVCxrQkFBRStHLElBQUYsQ0FBTztBQUNIM0YseUJBQUtzSixLQUFLaUosR0FBTCxHQUFXLCtDQURiO0FBRUhLLDhCQUFVLFFBRlA7QUFHSEMsMkJBQU8sS0FISjtBQUlIQywyQkFBTyxlQUFTQyxHQUFULEVBQWMxQyxVQUFkLEVBQTBCQyxXQUExQixFQUF1QztBQUMxQ0wsZ0NBQVFDLEdBQVIsQ0FBWSwwQkFBWjtBQUNBO0FBQ0FELGdDQUFRQyxHQUFSLENBQVk2QyxHQUFaLEVBQWlCMUMsVUFBakIsRUFBNkJDLFdBQTdCO0FBQ0EsNEJBQUt5QyxJQUFJak4sTUFBSixJQUFjLEdBQW5CLEVBQXlCO0FBQ3JCd0QsaUNBQUswSixjQUFMLENBQW9CRCxHQUFwQjtBQUNILHlCQUZELE1BRU87QUFDSHpKLGlDQUFLMkosWUFBTDtBQUNIO0FBQ0o7QUFiRSxpQkFBUDtBQWVIO0FBdkJMLFNBREosQ0FGVyxFQTZCWDtBQUNJOUosb0JBQVFBLE1BRFo7QUFFSXBDLGdCQUFJO0FBRlIsU0E3QlcsQ0FBZjtBQWtDQXVDLGFBQUs0SixPQUFMLEdBQWU1SixLQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixrQkFBbEIsQ0FBZjs7QUFFQTs7QUFFQTBDLGFBQUs2SixlQUFMO0FBRUgsS0EvSFc7O0FBaUlaQSxxQkFBaUIsMkJBQVc7QUFDeEIsWUFBSTdKLE9BQU8sSUFBWDtBQUNBLFlBQUluRixPQUFPLEVBQVg7QUFDQSxZQUFLbUYsS0FBSzNDLEtBQUwsQ0FBV3hDLElBQVgsQ0FBZ0IsS0FBaEIsQ0FBTCxFQUE4QjtBQUMxQkEsaUJBQUssS0FBTCxJQUFjbUYsS0FBSzNDLEtBQUwsQ0FBV3hDLElBQVgsQ0FBZ0IsS0FBaEIsQ0FBZDtBQUNIO0FBQ0R2RixVQUFFK0csSUFBRixDQUFPO0FBQ0gzRixpQkFBS3NKLEtBQUtpSixHQUFMLENBQVMxUixPQUFULENBQWlCLElBQWpCLEVBQXVCLEdBQXZCLElBQThCLDhDQURoQztBQUVIK1Isc0JBQVUsUUFGUDtBQUdIQyxtQkFBTyxLQUhKO0FBSUgxTyxrQkFBTUEsSUFKSDtBQUtIMk8sbUJBQU8sZUFBU0MsR0FBVCxFQUFjMUMsVUFBZCxFQUEwQkMsV0FBMUIsRUFBdUM7QUFDMUNMLHdCQUFRQyxHQUFSLENBQVksK0JBQVo7QUFDQSxvQkFBSzVHLEtBQUs4RixPQUFWLEVBQW9CO0FBQUU5Rix5QkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFBNEI7QUFDbEQsb0JBQUtJLElBQUlqTixNQUFKLElBQWMsR0FBbkIsRUFBeUI7QUFDckJ3RCx5QkFBSzBKLGNBQUwsQ0FBb0JELEdBQXBCO0FBQ0gsaUJBRkQsTUFFTztBQUNIekoseUJBQUsySixZQUFMLENBQWtCRixHQUFsQjtBQUNIO0FBQ0o7QUFiRSxTQUFQO0FBZUgsS0F0Slc7O0FBd0paSyxvQkFBZ0Isd0JBQVNDLFlBQVQsRUFBdUJDLFlBQXZCLEVBQXFDYixLQUFyQyxFQUE0QztBQUN4RCxZQUFJbkosT0FBTyxJQUFYO0FBQ0FBLGFBQUtpSyxVQUFMO0FBQ0FqSyxhQUFLOEYsT0FBTCxDQUFhdUQsVUFBYjtBQUNILEtBNUpXOztBQThKWmEsMEJBQXNCLDhCQUFTSCxZQUFULEVBQXVCQyxZQUF2QixFQUFxQ2IsS0FBckMsRUFBNEM7QUFDOUQsWUFBSW5KLE9BQU8sSUFBWDs7QUFFQSxZQUFLQSxLQUFLbUssS0FBVixFQUFrQjtBQUNkeEQsb0JBQVFDLEdBQVIsQ0FBWSxpQkFBWjtBQUNBO0FBQ0g7O0FBRUQ1RyxhQUFLd0ksR0FBTCxDQUFTdUIsWUFBVCxHQUF3QkEsWUFBeEI7QUFDQS9KLGFBQUt3SSxHQUFMLENBQVN3QixZQUFULEdBQXdCQSxZQUF4QjtBQUNBaEssYUFBS3dJLEdBQUwsQ0FBU1csS0FBVCxHQUFpQkEsS0FBakI7O0FBRUFuSixhQUFLb0ssVUFBTCxHQUFrQixJQUFsQjtBQUNBcEssYUFBS3FLLGFBQUwsR0FBcUIsQ0FBckI7QUFDQXJLLGFBQUs1SSxDQUFMLEdBQVMsQ0FBVDs7QUFFQTRJLGFBQUttSyxLQUFMLEdBQWFuTCxZQUFZLFlBQVc7QUFBRWdCLGlCQUFLc0ssV0FBTDtBQUFxQixTQUE5QyxFQUFnRCxJQUFoRCxDQUFiO0FBQ0E7QUFDQXRLLGFBQUtzSyxXQUFMO0FBRUgsS0FsTFc7O0FBb0xaQSxpQkFBYSx1QkFBVztBQUNwQixZQUFJdEssT0FBTyxJQUFYO0FBQ0FBLGFBQUs1SSxDQUFMLElBQVUsQ0FBVjtBQUNBOUIsVUFBRStHLElBQUYsQ0FBTztBQUNIM0YsaUJBQU1zSixLQUFLd0ksR0FBTCxDQUFTdUIsWUFEWjtBQUVIbFAsa0JBQU8sRUFBRTBQLElBQU0sSUFBSXBOLElBQUosRUFBRCxDQUFXQyxPQUFYLEVBQVAsRUFGSjtBQUdIbU0sbUJBQVEsS0FITDtBQUlIRCxzQkFBVSxNQUpQO0FBS0hrQixxQkFBVSxpQkFBUzNQLElBQVQsRUFBZTtBQUNyQixvQkFBSTJCLFNBQVN3RCxLQUFLeUssY0FBTCxDQUFvQjVQLElBQXBCLENBQWI7QUFDQW1GLHFCQUFLcUssYUFBTCxJQUFzQixDQUF0QjtBQUNBLG9CQUFLN04sT0FBT2lLLElBQVosRUFBbUI7QUFDZnpHLHlCQUFLaUssVUFBTDtBQUNILGlCQUZELE1BRU8sSUFBS3pOLE9BQU9nTixLQUFQLElBQWdCaE4sT0FBT2tPLFlBQVAsR0FBc0IsR0FBM0MsRUFBaUQ7QUFDcEQxSyx5QkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFDQXJKLHlCQUFLMkssbUJBQUw7QUFDQTNLLHlCQUFLaUssVUFBTDtBQUNBaksseUJBQUs0SyxRQUFMO0FBQ0gsaUJBTE0sTUFLQSxJQUFLcE8sT0FBT2dOLEtBQVosRUFBb0I7QUFDdkJ4Six5QkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFDQXJKLHlCQUFLMkosWUFBTDtBQUNBM0oseUJBQUtpSyxVQUFMO0FBQ0g7QUFDSixhQXBCRTtBQXFCSFQsbUJBQVEsZUFBU0MsR0FBVCxFQUFjMUMsVUFBZCxFQUEwQkMsV0FBMUIsRUFBdUM7QUFDM0NMLHdCQUFRQyxHQUFSLENBQVksVUFBWixFQUF3QjZDLEdBQXhCLEVBQTZCLEdBQTdCLEVBQWtDMUMsVUFBbEMsRUFBOEMsR0FBOUMsRUFBbURDLFdBQW5EO0FBQ0FoSCxxQkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFDQXJKLHFCQUFLaUssVUFBTDtBQUNBLG9CQUFLUixJQUFJak4sTUFBSixJQUFjLEdBQWQsS0FBc0J3RCxLQUFLNUksQ0FBTCxHQUFTLEVBQVQsSUFBZTRJLEtBQUtxSyxhQUFMLEdBQXFCLENBQTFELENBQUwsRUFBb0U7QUFDaEVySyx5QkFBSzJKLFlBQUw7QUFDSDtBQUNKO0FBNUJFLFNBQVA7QUE4QkgsS0FyTlc7O0FBdU5aYyxvQkFBZ0Isd0JBQVM1UCxJQUFULEVBQWU7QUFDM0IsWUFBSW1GLE9BQU8sSUFBWDtBQUNBLFlBQUl4RCxTQUFTLEVBQUVpSyxNQUFPLEtBQVQsRUFBZ0IrQyxPQUFRLEtBQXhCLEVBQWI7QUFDQSxZQUFJcUIsT0FBSjs7QUFFQSxZQUFJQyxVQUFValEsS0FBSzJCLE1BQW5CO0FBQ0EsWUFBS3NPLFdBQVcsS0FBWCxJQUFvQkEsV0FBVyxNQUFwQyxFQUE2QztBQUN6Q3RPLG1CQUFPaUssSUFBUCxHQUFjLElBQWQ7QUFDQW9FLHNCQUFVLEdBQVY7QUFDSCxTQUhELE1BR087QUFDSEMsc0JBQVVqUSxLQUFLa1EsWUFBZjtBQUNBRixzQkFBVSxPQUFRQyxVQUFVOUssS0FBS3dJLEdBQUwsQ0FBU1csS0FBM0IsQ0FBVjtBQUNIOztBQUVELFlBQUtuSixLQUFLZ0wsWUFBTCxJQUFxQkgsT0FBMUIsRUFBb0M7QUFDaEM3SyxpQkFBS2dMLFlBQUwsR0FBb0JILE9BQXBCO0FBQ0E3SyxpQkFBSzBLLFlBQUwsR0FBb0IsQ0FBcEI7QUFDSCxTQUhELE1BR087QUFDSDFLLGlCQUFLMEssWUFBTCxJQUFxQixDQUFyQjtBQUNIOztBQUVEO0FBQ0EsWUFBSzFLLEtBQUswSyxZQUFMLEdBQW9CLEdBQXpCLEVBQStCO0FBQzNCbE8sbUJBQU9nTixLQUFQLEdBQWUsSUFBZjtBQUNIOztBQUVELFlBQUt4SixLQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixVQUFsQixFQUE4QjJLLEVBQTlCLENBQWlDLFVBQWpDLENBQUwsRUFBb0Q7QUFDaERqSSxpQkFBSzhGLE9BQUwsQ0FBYXhJLElBQWIsQ0FBa0IsVUFBbEIsRUFBOEJrQyxJQUE5Qix5Q0FBeUVRLEtBQUtrSixVQUE5RTtBQUNBbEosaUJBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLFdBQWxCLEVBQStCMk4sV0FBL0IsQ0FBMkMsTUFBM0M7QUFDQWpMLGlCQUFLa0wsZ0JBQUwsc0NBQXlEbEwsS0FBS2tKLFVBQTlEO0FBQ0g7O0FBRURsSixhQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixNQUFsQixFQUEwQjZOLEdBQTFCLENBQThCLEVBQUVDLE9BQVFQLFVBQVUsR0FBcEIsRUFBOUI7O0FBRUEsWUFBS0EsV0FBVyxHQUFoQixFQUFzQjtBQUNsQjdLLGlCQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixXQUFsQixFQUErQm1ILElBQS9CO0FBQ0EsZ0JBQUk0RyxlQUFlQyxVQUFVQyxTQUFWLENBQW9CeFMsT0FBcEIsQ0FBNEIsVUFBNUIsS0FBMkMsQ0FBQyxDQUE1QyxHQUFnRCxRQUFoRCxHQUEyRCxPQUE5RTtBQUNBaUgsaUJBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLFVBQWxCLEVBQThCa0MsSUFBOUIsd0JBQXdEUSxLQUFLa0osVUFBN0QsaUVBQWlJbUMsWUFBakk7QUFDQXJMLGlCQUFLa0wsZ0JBQUwscUJBQXdDbEwsS0FBS2tKLFVBQTdDLHVDQUF5Rm1DLFlBQXpGOztBQUVBO0FBQ0EsZ0JBQUlHLGdCQUFnQnhMLEtBQUs4RixPQUFMLENBQWF4SSxJQUFiLENBQWtCLGVBQWxCLENBQXBCO0FBQ0EsZ0JBQUssQ0FBRWtPLGNBQWNwVCxNQUFyQixFQUE4QjtBQUMxQm9ULGdDQUFnQmxXLEVBQUUsd0ZBQXdGaUMsT0FBeEYsQ0FBZ0csY0FBaEcsRUFBZ0h5SSxLQUFLa0osVUFBckgsQ0FBRixFQUFvSWpTLElBQXBJLENBQXlJLE1BQXpJLEVBQWlKK0ksS0FBS3dJLEdBQUwsQ0FBU3dCLFlBQTFKLENBQWhCO0FBQ0Esb0JBQUt3QixjQUFjM00sR0FBZCxDQUFrQixDQUFsQixFQUFxQjRNLFFBQXJCLElBQWlDbFcsU0FBdEMsRUFBa0Q7QUFDOUNpVyxrQ0FBY3ZVLElBQWQsQ0FBbUIsUUFBbkIsRUFBNkIsUUFBN0I7QUFDSDtBQUNEdVUsOEJBQWM3RixRQUFkLENBQXVCM0YsS0FBSzhGLE9BQUwsQ0FBYXhJLElBQWIsQ0FBa0IsZ0JBQWxCLENBQXZCLEVBQTREWixFQUE1RCxDQUErRCxPQUEvRCxFQUF3RSxVQUFTOUMsQ0FBVCxFQUFZO0FBQ2hGb0cseUJBQUszQyxLQUFMLENBQVdsQixPQUFYLENBQW1CLGNBQW5CO0FBQ0FULCtCQUFXLFlBQVc7QUFDbEJzRSw2QkFBSzhGLE9BQUwsQ0FBYXVELFVBQWI7QUFDQW1DLHNDQUFjbkosTUFBZDtBQUNBbEgsMkJBQUd1USxNQUFILENBQVVDLFFBQVYsQ0FBbUJDLFlBQW5CLENBQWdDQyxlQUFoQztBQUNBO0FBQ0gscUJBTEQsRUFLRyxJQUxIO0FBTUFqUyxzQkFBRWtTLGVBQUY7QUFDSCxpQkFURDtBQVVBTiw4QkFBY08sS0FBZDtBQUNIO0FBQ0QvTCxpQkFBSzhGLE9BQUwsQ0FBYWpMLElBQWIsQ0FBa0IsYUFBbEIsRUFBaUMsSUFBakM7QUFDQTtBQUNBO0FBQ0gsU0E1QkQsTUE0Qk87QUFDSG1GLGlCQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixVQUFsQixFQUE4QlEsSUFBOUIsc0NBQXNFa0MsS0FBS2tKLFVBQTNFLFVBQTBGOEMsS0FBS0MsSUFBTCxDQUFVcEIsT0FBVixDQUExRjtBQUNBN0ssaUJBQUtrTCxnQkFBTCxDQUF5QmMsS0FBS0MsSUFBTCxDQUFVcEIsT0FBVixDQUF6QjtBQUNIOztBQUVELGVBQU9yTyxNQUFQO0FBQ0gsS0EzUlc7O0FBNlJaeU4sZ0JBQVksc0JBQVc7QUFDbkIsWUFBSWpLLE9BQU8sSUFBWDtBQUNBLFlBQUtBLEtBQUttSyxLQUFWLEVBQWtCO0FBQ2QrQiwwQkFBY2xNLEtBQUttSyxLQUFuQjtBQUNBbkssaUJBQUttSyxLQUFMLEdBQWEsSUFBYjtBQUNIO0FBQ0osS0FuU1c7O0FBcVNaVCxvQkFBZ0Isd0JBQVNELEdBQVQsRUFBYztBQUMxQixZQUFJekosT0FBTyxJQUFYO0FBQ0EsWUFBSW1NLFVBQVV4TixTQUFTOEssSUFBSWhOLGlCQUFKLENBQXNCLG9CQUF0QixDQUFULENBQWQ7QUFDQSxZQUFJMlAsT0FBTzNDLElBQUloTixpQkFBSixDQUFzQixjQUF0QixDQUFYOztBQUVBLFlBQUswUCxXQUFXLENBQWhCLEVBQW9CO0FBQ2hCO0FBQ0F6USx1QkFBVyxZQUFXO0FBQ3BCc0UscUJBQUs2SixlQUFMO0FBQ0QsYUFGRCxFQUVHLElBRkg7QUFHQTtBQUNIOztBQUVEc0MsbUJBQVcsSUFBWDtBQUNBLFlBQUlqUCxNQUFPLElBQUlDLElBQUosRUFBRCxDQUFXQyxPQUFYLEVBQVY7QUFDQSxZQUFJaVAsWUFBY0wsS0FBS0MsSUFBTCxDQUFVLENBQUNFLFVBQVVqUCxHQUFYLElBQWtCLElBQTVCLENBQWxCOztBQUVBLFlBQUlzQyxPQUNGLENBQUMsVUFDQyxrSUFERCxHQUVDLHNIQUZELEdBR0QsUUFIQSxFQUdVakksT0FIVixDQUdrQixRQUhsQixFQUc0QjZVLElBSDVCLEVBR2tDN1UsT0FIbEMsQ0FHMEMsYUFIMUMsRUFHeUQ4VSxTQUh6RCxDQURGOztBQU1Bck0sYUFBSzhGLE9BQUwsR0FBZXBHLFFBQVFDLE1BQVIsQ0FDWEgsSUFEVyxFQUVYLENBQ0k7QUFDSUksbUJBQVEsSUFEWjtBQUVJLHFCQUFVLHlCQUZkO0FBR0ltRyxzQkFBVSxvQkFBVztBQUNqQm1HLDhCQUFjbE0sS0FBS3NNLGVBQW5CO0FBQ0EsdUJBQU8sSUFBUDtBQUNIO0FBTkwsU0FESixDQUZXLENBQWY7O0FBY0F0TSxhQUFLc00sZUFBTCxHQUF1QnROLFlBQVksWUFBVztBQUN4Q3FOLHlCQUFhLENBQWI7QUFDQXJNLGlCQUFLOEYsT0FBTCxDQUFheEksSUFBYixDQUFrQixtQkFBbEIsRUFBdUNRLElBQXZDLENBQTRDdU8sU0FBNUM7QUFDQSxnQkFBS0EsYUFBYSxDQUFsQixFQUFzQjtBQUNwQkgsOEJBQWNsTSxLQUFLc00sZUFBbkI7QUFDRDtBQUNEM0Ysb0JBQVFDLEdBQVIsQ0FBWSxTQUFaLEVBQXVCeUYsU0FBdkI7QUFDTCxTQVBzQixFQU9wQixJQVBvQixDQUF2QjtBQVNILEtBblZXOztBQXFWWjFCLHlCQUFxQiw2QkFBU2xCLEdBQVQsRUFBYztBQUMvQixZQUFJakssT0FDQSxRQUNJLHlFQURKLEdBRUksa0NBRkosR0FHQSxNQUhBLEdBSUEsS0FKQSxHQUtJLDRGQUxKLEdBTUksb0xBTkosR0FPSSxzRkFQSixHQVFBLE1BVEo7O0FBV0E7QUFDQUUsZ0JBQVFDLE1BQVIsQ0FDSUgsSUFESixFQUVJLENBQ0k7QUFDSUksbUJBQVEsSUFEWjtBQUVJLHFCQUFVO0FBRmQsU0FESixDQUZKLEVBUUksRUFBRStCLFNBQVUsT0FBWixFQVJKOztBQVdBZ0YsZ0JBQVFDLEdBQVIsQ0FBWTZDLEdBQVo7QUFDSCxLQTlXVzs7QUFnWFpFLGtCQUFjLHNCQUFTRixHQUFULEVBQWM7QUFDeEIsWUFBSWpLLE9BQ0EsUUFDSSxvQ0FESixHQUMyQyxLQUFLMEosVUFEaEQsR0FDNkQsNkJBRDdELEdBRUEsTUFGQSxHQUdBLEtBSEEsR0FJSSwrQkFKSixHQUtBLE1BTko7O0FBUUE7QUFDQXhKLGdCQUFRQyxNQUFSLENBQ0lILElBREosRUFFSSxDQUNJO0FBQ0lJLG1CQUFRLElBRFo7QUFFSSxxQkFBVTtBQUZkLFNBREosQ0FGSixFQVFJLEVBQUUrQixTQUFVLE9BQVosRUFSSjs7QUFXQWdGLGdCQUFRQyxHQUFSLENBQVk2QyxHQUFaO0FBQ0gsS0F0WVc7O0FBd1labUIsY0FBVSxvQkFBVztBQUNqQixZQUFJNUssT0FBTyxJQUFYO0FBQ0ExSyxVQUFFdUosR0FBRixDQUFNbUIsS0FBS2lKLEdBQUwsR0FBVyxnQkFBWCxHQUE4QmpKLEtBQUswSyxZQUF6QztBQUNILEtBM1lXOztBQTZZWlEsc0JBQWtCLDBCQUFTak4sT0FBVCxFQUFrQjtBQUNoQyxZQUFJK0IsT0FBTyxJQUFYO0FBQ0EsWUFBS0EsS0FBS3VNLFlBQUwsSUFBcUJ0TyxPQUExQixFQUFvQztBQUNsQyxnQkFBSytCLEtBQUt3TSxVQUFWLEVBQXVCO0FBQUVDLDZCQUFhek0sS0FBS3dNLFVBQWxCLEVBQStCeE0sS0FBS3dNLFVBQUwsR0FBa0IsSUFBbEI7QUFBeUI7O0FBRWpGOVEsdUJBQVcsWUFBTTtBQUNmc0UscUJBQUs0SixPQUFMLENBQWE5TCxJQUFiLENBQWtCRyxPQUFsQjtBQUNBK0IscUJBQUt1TSxZQUFMLEdBQW9CdE8sT0FBcEI7QUFDQTBJLHdCQUFRQyxHQUFSLENBQVksWUFBWixFQUEwQjNJLE9BQTFCO0FBQ0QsYUFKRCxFQUlHLEVBSkg7QUFLQStCLGlCQUFLd00sVUFBTCxHQUFrQjlRLFdBQVcsWUFBTTtBQUNqQ3NFLHFCQUFLNEosT0FBTCxDQUFhL0ssR0FBYixDQUFpQixDQUFqQixFQUFvQjZOLFNBQXBCLEdBQWdDLEVBQWhDO0FBQ0QsYUFGaUIsRUFFZixHQUZlLENBQWxCO0FBSUQ7QUFDSixLQTVaVzs7QUE4WlpDLFNBQUs7O0FBOVpPLENBQWhCOztBQWthQXZSLEtBQUtDLEtBQUwsQ0FBVyxZQUFXO0FBQ2xCRixPQUFHeVIsVUFBSCxHQUFnQnRXLE9BQU91VyxNQUFQLENBQWMxUixHQUFHbU4sVUFBakIsRUFBNkJDLElBQTdCLENBQWtDO0FBQzlDL0ssZ0JBQVNyQyxHQUFHcUM7QUFEa0MsS0FBbEMsQ0FBaEI7O0FBSUFyQyxPQUFHeVIsVUFBSCxDQUFjbkUsS0FBZDs7QUFFQSxRQUFJcUUscUJBQXFCLENBQXpCO0FBQ0F4WCxNQUFFLHFCQUFGLEVBQXlCb0gsRUFBekIsQ0FBNEIsT0FBNUIsRUFBcUMsVUFBUzlDLENBQVQsRUFBWTtBQUM3QyxZQUFLLEtBQUtrRixPQUFMLENBQWFpTyxXQUFiLElBQTRCLE1BQWpDLEVBQTBDO0FBQ3RDLGdCQUFLRCxzQkFBc0IsQ0FBdEIsSUFBNkIsU0FBU0EscUJBQXFCLENBQXJCLElBQTBCLENBQXJFLEVBQTJFO0FBQ3ZFLG9CQUFLLENBQUVuUyxPQUFPcUIsT0FBUCxDQUFlcU0sbUJBQWYsQ0FBUCxFQUE2QztBQUN6Q3pPLHNCQUFFZ08sY0FBRjtBQUNBaE8sc0JBQUVrUyxlQUFGO0FBQ0EsMkJBQU8sS0FBUDtBQUNIO0FBQ0o7QUFDRGdCLGtDQUFzQixDQUF0QjtBQUNIO0FBQ0osS0FYRDs7QUFhQTtBQUNBeFgsTUFBRSx1QkFBRixFQUEyQm9ILEVBQTNCLENBQThCLE9BQTlCLEVBQXVDLFVBQVM5QyxDQUFULEVBQVk7QUFDL0NBLFVBQUVnTyxjQUFGOztBQUVBLFlBQUlvRixZQUFZN1IsR0FBR3VRLE1BQUgsQ0FBVUMsUUFBVixDQUFtQkMsWUFBbkIsQ0FBZ0NxQixpQkFBaEMsRUFBaEI7O0FBRUEsWUFBS0QsVUFBVTVVLE1BQVYsSUFBb0IsQ0FBekIsRUFBNkI7QUFDekIsZ0JBQUk4VSxVQUFVLEVBQWQ7O0FBRUEsZ0JBQUkvSSxNQUFNLENBQUUsaURBQUYsQ0FBVjtBQUNBLGdCQUFLaEosR0FBR3VRLE1BQUgsQ0FBVXRMLElBQVYsQ0FBZWEsSUFBZixJQUF1QixLQUE1QixFQUFvQztBQUNoQ2tELG9CQUFJdkwsSUFBSixDQUFTLDBFQUFUO0FBQ0F1TCxvQkFBSXZMLElBQUosQ0FBUywwRUFBVDtBQUNILGFBSEQsTUFHTztBQUNIdUwsb0JBQUl2TCxJQUFKLENBQVMsa0VBQVQ7QUFDQSxvQkFBS3VDLEdBQUd1USxNQUFILENBQVV0TCxJQUFWLENBQWVhLElBQWYsSUFBdUIsT0FBNUIsRUFBc0M7QUFDbENrRCx3QkFBSXZMLElBQUosQ0FBUywyRUFBVDtBQUNILGlCQUZELE1BRU87QUFDSHVMLHdCQUFJdkwsSUFBSixDQUFTLDRFQUFUO0FBQ0g7QUFDSjtBQUNEdUwsZ0JBQUl2TCxJQUFKLENBQVMsb0dBQVQ7QUFDQXVMLGdCQUFJdkwsSUFBSixDQUFTLHNPQUFUOztBQUVBdUwsa0JBQU1BLElBQUl0QixJQUFKLENBQVMsSUFBVCxDQUFOOztBQUVBcUssb0JBQVF0VSxJQUFSLENBQWE7QUFDVGdILHVCQUFPLElBREU7QUFFVCx5QkFBVTtBQUZELGFBQWI7QUFJQUYsb0JBQVFDLE1BQVIsQ0FBZXdFLEdBQWYsRUFBb0IrSSxPQUFwQjtBQUNBLG1CQUFPLEtBQVA7QUFDSDs7QUFHRCxZQUFJQyxNQUFNaFMsR0FBR3VRLE1BQUgsQ0FBVUMsUUFBVixDQUFtQkMsWUFBbkIsQ0FBZ0N3QixzQkFBaEMsQ0FBdURKLFNBQXZELENBQVY7O0FBRUExWCxVQUFFLElBQUYsRUFBUXVGLElBQVIsQ0FBYSxLQUFiLEVBQW9Cc1MsR0FBcEI7QUFDQWhTLFdBQUd5UixVQUFILENBQWM5RCxXQUFkLENBQTBCLElBQTFCO0FBQ0gsS0F0Q0Q7QUF3Q0gsQ0E5REQ7OztBQ3ZhQTtBQUNBMU4sS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCLFFBQUlnUyxhQUFhLEtBQWpCO0FBQ0EsUUFBSUMsWUFBYSxLQUFqQjtBQUNBLFFBQUlDLE9BQU9wUyxHQUFHcUMsTUFBSCxDQUFVQyxFQUFyQjtBQUNBLFFBQUkrUCxnQkFBZ0Isa0NBQXBCOztBQUVBLFFBQUlDLGFBQUo7QUFDQSxRQUFJQyxrQkFBa0IsU0FBbEJBLGVBQWtCLENBQVNDLENBQVQsRUFBV0MsQ0FBWCxFQUFjO0FBQUMsZUFBTyxvQkFBb0JELENBQXBCLEdBQXdCLFlBQXhCLEdBQXVDQyxDQUF2QyxHQUEyQyxJQUFsRDtBQUF3RCxLQUE3RjtBQUNBLFFBQUlDLGtCQUFrQixzQ0FBc0NOLElBQXRDLEdBQTZDLG1DQUFuRTs7QUFFQSxRQUFJbEksU0FBUy9QLEVBQ2Isb0NBQ0ksc0JBREosR0FFUSx5REFGUixHQUdZLFFBSFosR0FHdUJrWSxhQUh2QixHQUd1QyxtSkFIdkMsR0FJSSxRQUpKLEdBS0ksNEdBTEosR0FNSSxpRUFOSixHQU9JLDhFQVBKLEdBUUlFLGdCQUFnQkwsVUFBaEIsRUFBNEJDLFNBQTVCLENBUkosR0FRNkNPLGVBUjdDLEdBUStELGFBUi9ELEdBU0ksd0JBVEosR0FVUSxnRkFWUixHQVdRLGdEQVhSLEdBWVkscURBWlosR0FhUSxVQWJSLEdBY1EsNERBZFIsR0FlUSw4Q0FmUixHQWdCWSxzREFoQlosR0FpQlEsVUFqQlIsR0FrQkksUUFsQkosR0FtQkksU0FuQkosR0FvQkEsUUFyQmEsQ0FBYjs7QUF5QkE7QUFDQXZZLE1BQUUsTUFBRixFQUFVb0gsRUFBVixDQUFhLE9BQWIsRUFBc0IsWUFBdEIsRUFBb0MsVUFBUzlDLENBQVQsRUFBWTtBQUM1Q0EsVUFBRWdPLGNBQUY7QUFDQWxJLGdCQUFRQyxNQUFSLENBQWUwRixNQUFmLEVBQXVCLENBQ25CO0FBQ0kscUJBQVUsUUFEZDtBQUVJLHFCQUFVO0FBRmQsU0FEbUIsQ0FBdkI7O0FBT0E7QUFDQUEsZUFBT3lJLE9BQVAsQ0FBZSxRQUFmLEVBQXlCbkYsUUFBekIsQ0FBa0Msb0JBQWxDOztBQUVBO0FBQ0EsWUFBSW9GLFdBQVcxSSxPQUFPL0gsSUFBUCxDQUFZLDBCQUFaLENBQWY7QUFDSnlRLGlCQUFTclIsRUFBVCxDQUFZLE9BQVosRUFBcUIsWUFBWTtBQUM3QnBILGNBQUUsSUFBRixFQUFRMFksTUFBUjtBQUNILFNBRkQ7O0FBSUk7QUFDQTFZLFVBQUUsK0JBQUYsRUFBbUMyWSxLQUFuQyxDQUF5QyxZQUFZO0FBQ3JEUiw0QkFBZ0JDLGdCQUFnQkwsVUFBaEIsRUFBNEJDLFNBQTVCLElBQXlDTyxlQUF6RDtBQUNJRSxxQkFBU3ZWLEdBQVQsQ0FBYWlWLGFBQWI7QUFDSCxTQUhEO0FBSUFuWSxVQUFFLDZCQUFGLEVBQWlDMlksS0FBakMsQ0FBdUMsWUFBWTtBQUNuRFIsNEJBQWdCQyxnQkFBZ0JKLFNBQWhCLEVBQTJCRCxVQUEzQixJQUF5Q1EsZUFBekQ7QUFDSUUscUJBQVN2VixHQUFULENBQWFpVixhQUFiO0FBQ0gsU0FIRDtBQUlILEtBM0JEO0FBNEJILENBakVEOzs7QUNEQTtBQUNBLElBQUl0UyxLQUFLQSxNQUFNLEVBQWY7QUFDQUEsR0FBRytTLFFBQUgsR0FBYyxFQUFkO0FBQ0EvUyxHQUFHK1MsUUFBSCxDQUFZdk8sTUFBWixHQUFxQixZQUFXO0FBQzVCLFFBQUlILE9BQ0EsV0FDQSxnQkFEQSxHQUVBLHdDQUZBLEdBR0Esb0VBSEEsR0FJQSwrR0FKQSxHQUtBLDRJQUxBLEdBTUEsaUJBTkEsR0FPQSxnQkFQQSxHQVFBLCtEQVJBLEdBU0EsNEVBVEEsR0FVQSwrQkFWQSxHQVdBLCtGQVhBLEdBWUEsZ0VBWkEsR0FhQSx1REFiQSxHQWNBLHNCQWRBLEdBZUEsZ0JBZkEsR0FnQkEsK0JBaEJBLEdBaUJBLG1HQWpCQSxHQWtCQSwrREFsQkEsR0FtQkEsbURBbkJBLEdBb0JBLHNCQXBCQSxHQXFCQSxnQkFyQkEsR0FzQkEsK0JBdEJBLEdBdUJBLGdHQXZCQSxHQXdCQSwrREF4QkEsR0F5QkEsdUVBekJBLEdBMEJBLHNCQTFCQSxHQTJCQSxnQkEzQkEsR0E0QkEsK0JBNUJBLEdBNkJBLDZHQTdCQSxHQThCQSwrREE5QkEsR0ErQkEsK0JBL0JBLEdBZ0NBLHNCQWhDQSxHQWlDQSxnQkFqQ0EsR0FrQ0EsaUJBbENBLEdBbUNBLGdCQW5DQSxHQW9DQSx3REFwQ0EsR0FxQ0EsbUVBckNBLEdBc0NBLCtCQXRDQSxHQXVDQSwyRkF2Q0EsR0F3Q0Esa0RBeENBLEdBeUNBLDJDQXpDQSxHQTBDQSxzQkExQ0EsR0EyQ0EsZ0JBM0NBLEdBNENBLCtCQTVDQSxHQTZDQSw0RkE3Q0EsR0E4Q0Esa0RBOUNBLEdBK0NBLDZCQS9DQSxHQWdEQSxzQkFoREEsR0FpREEsZ0JBakRBLEdBa0RBLCtCQWxEQSxHQW1EQSw0RkFuREEsR0FvREEsa0RBcERBLEdBcURBLDBDQXJEQSxHQXNEQSxzQkF0REEsR0F1REEsZ0JBdkRBLEdBd0RBLCtCQXhEQSxHQXlEQSw2S0F6REEsR0EwREEsZ0JBMURBLEdBMkRBLGlCQTNEQSxHQTREQSxnQkE1REEsR0E2REEsdURBN0RBLEdBOERBLHdFQTlEQSxHQStEQSxtSEEvREEsR0FnRUEsMEJBaEVBLEdBaUVBLDRFQWpFQSxHQWtFQSwrQkFsRUEsR0FtRUEsNkZBbkVBLEdBb0VBLGdEQXBFQSxHQXFFQSxvRkFyRUEsR0FzRUEsc0JBdEVBLEdBdUVBLGdCQXZFQSxHQXdFQSwrQkF4RUEsR0F5RUEsMkZBekVBLEdBMEVBLGdEQTFFQSxHQTJFQSxpRUEzRUEsR0E0RUEsc0JBNUVBLEdBNkVBLGdCQTdFQSxHQThFQSwrQkE5RUEsR0ErRUEsMkdBL0VBLEdBZ0ZBLGdEQWhGQSxHQWlGQSwrQkFqRkEsR0FrRkEsc0JBbEZBLEdBbUZBLGdCQW5GQSxHQW9GQSxpQkFwRkEsR0FxRkEsZ0JBckZBLEdBc0ZBLHNEQXRGQSxHQXVGQSxhQXZGQSxHQXdGQSx5RkF4RkEsR0F5RkEsMEVBekZBLEdBMEZBLGNBMUZBLEdBMkZBLGlCQTNGQSxHQTRGQSxTQTdGSjs7QUErRkEsUUFBSTJPLFFBQVE3WSxFQUFFa0ssSUFBRixDQUFaOztBQUVBO0FBQ0FsSyxNQUFFLHNDQUFGLEVBQTBDa0QsR0FBMUMsQ0FBOEMyQyxHQUFHcUMsTUFBSCxDQUFVQyxFQUF4RCxFQUE0RGtJLFFBQTVELENBQXFFd0ksS0FBckU7QUFDQTdZLE1BQUUsMENBQUYsRUFBOENrRCxHQUE5QyxDQUFrRDJDLEdBQUdxQyxNQUFILENBQVU0USxTQUE1RCxFQUF1RXpJLFFBQXZFLENBQWdGd0ksS0FBaEY7O0FBRUEsUUFBS2hULEdBQUcrTSxVQUFSLEVBQXFCO0FBQ2pCNVMsVUFBRSxxQ0FBRixFQUF5Q2tELEdBQXpDLENBQTZDMkMsR0FBRytNLFVBQWhELEVBQTREdkMsUUFBNUQsQ0FBcUV3SSxLQUFyRTtBQUNBLFlBQUlFLFNBQVNGLE1BQU03USxJQUFOLENBQVcsUUFBWCxDQUFiO0FBQ0ErUSxlQUFPN1YsR0FBUCxDQUFXMkMsR0FBRytNLFVBQWQ7QUFDQW1HLGVBQU81SixJQUFQO0FBQ0FuUCxVQUFFLFdBQVc2RixHQUFHK00sVUFBZCxHQUEyQixlQUE3QixFQUE4QzlELFdBQTlDLENBQTBEaUssTUFBMUQ7QUFDQUYsY0FBTTdRLElBQU4sQ0FBVyxhQUFYLEVBQTBCbUgsSUFBMUI7QUFDSDs7QUFFRCxRQUFLdEosR0FBR3VRLE1BQVIsRUFBaUI7QUFDYnBXLFVBQUUsc0NBQUYsRUFBMENrRCxHQUExQyxDQUE4QzJDLEdBQUdxQyxNQUFILENBQVUyUCxHQUF4RCxFQUE2RHhILFFBQTdELENBQXNFd0ksS0FBdEU7QUFDSCxLQUZELE1BRU8sSUFBS2hULEdBQUdxQyxNQUFILENBQVUyUCxHQUFmLEVBQXFCO0FBQ3hCN1gsVUFBRSxzQ0FBRixFQUEwQ2tELEdBQTFDLENBQThDMkMsR0FBR3FDLE1BQUgsQ0FBVTJQLEdBQXhELEVBQTZEeEgsUUFBN0QsQ0FBc0V3SSxLQUF0RTtBQUNIO0FBQ0Q3WSxNQUFFLHFDQUFGLEVBQXlDa0QsR0FBekMsQ0FBNkMyQyxHQUFHcUMsTUFBSCxDQUFVNEMsSUFBdkQsRUFBNkR1RixRQUE3RCxDQUFzRXdJLEtBQXRFOztBQUVBO0FBQ0E7QUFDQTs7O0FBR0EsV0FBT0EsS0FBUDtBQUNILENBNUhEOzs7QUNIQS9TLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQjs7QUFFQSxRQUFJaVQsU0FBUyxLQUFiOztBQUVBLFFBQUlILFFBQVE3WSxFQUFFLG9CQUFGLENBQVo7O0FBRUEsUUFBSWlaLFNBQVNKLE1BQU03USxJQUFOLENBQVcseUJBQVgsQ0FBYjtBQUNBLFFBQUlrUixlQUFlTCxNQUFNN1EsSUFBTixDQUFXLHVCQUFYLENBQW5CO0FBQ0EsUUFBSW1SLFVBQVVOLE1BQU03USxJQUFOLENBQVcscUJBQVgsQ0FBZDtBQUNBLFFBQUlvUixpQkFBaUJQLE1BQU03USxJQUFOLENBQVcsZ0JBQVgsQ0FBckI7QUFDQSxRQUFJcVIsTUFBTVIsTUFBTTdRLElBQU4sQ0FBVyxzQkFBWCxDQUFWOztBQUVBLFFBQUlzUixZQUFZLElBQWhCOztBQUVBLFFBQUk1USxVQUFVMUksRUFBRSwyQkFBRixDQUFkO0FBQ0EwSSxZQUFRdEIsRUFBUixDQUFXLE9BQVgsRUFBb0IsWUFBVztBQUMzQmdELGdCQUFRMkUsSUFBUixDQUFhLGNBQWIsRUFBNkI7QUFDekJ3SyxvQkFBUSxnQkFBU0MsS0FBVCxFQUFnQjtBQUNwQlAsdUJBQU94QyxLQUFQO0FBQ0g7QUFId0IsU0FBN0I7QUFLSCxLQU5EOztBQVFBLFFBQUlnRCxTQUFTLEVBQWI7QUFDQUEsV0FBT0MsRUFBUCxHQUFZLFlBQVc7QUFDbkJQLGdCQUFRaEssSUFBUjtBQUNBOEosZUFBT3RYLElBQVAsQ0FBWSxhQUFaLEVBQTJCLHdDQUEzQjtBQUNBdVgscUJBQWExUSxJQUFiLENBQWtCLHdCQUFsQjtBQUNBLFlBQUt3USxNQUFMLEVBQWM7QUFDVm5ULGVBQUdtSixhQUFILENBQWlCLHNDQUFqQjtBQUNIO0FBQ0osS0FQRDs7QUFTQXlLLFdBQU9FLE9BQVAsR0FBaUIsWUFBVztBQUN4QlIsZ0JBQVFwSyxJQUFSO0FBQ0FrSyxlQUFPdFgsSUFBUCxDQUFZLGFBQVosRUFBMkIsOEJBQTNCO0FBQ0F1WCxxQkFBYTFRLElBQWIsQ0FBa0Isc0JBQWxCO0FBQ0EsWUFBS3dRLE1BQUwsRUFBYztBQUNWblQsZUFBR21KLGFBQUgsQ0FBaUIsd0ZBQWpCO0FBQ0g7QUFDSixLQVBEOztBQVNBLFFBQUk0SyxTQUFTUixlQUFlcFIsSUFBZixDQUFvQixlQUFwQixFQUFxQzlFLEdBQXJDLEVBQWI7QUFDQXVXLFdBQU9HLE1BQVA7QUFDQVosYUFBUyxJQUFUOztBQUVBLFFBQUlhLFFBQVFoVSxHQUFHZ1UsS0FBSCxDQUFTdFEsR0FBVCxFQUFaO0FBQ0EsUUFBS3NRLE1BQU1DLE1BQU4sSUFBZ0JELE1BQU1DLE1BQU4sQ0FBYUMsRUFBbEMsRUFBdUM7QUFDbkMvWixVQUFFLGdCQUFGLEVBQW9CMkIsSUFBcEIsQ0FBeUIsU0FBekIsRUFBb0MsU0FBcEM7QUFDSDs7QUFFRHlYLG1CQUFlaFMsRUFBZixDQUFrQixRQUFsQixFQUE0QixxQkFBNUIsRUFBbUQsVUFBUzlDLENBQVQsRUFBWTtBQUMzRCxZQUFJc1YsU0FBUyxLQUFLSSxLQUFsQjtBQUNBUCxlQUFPRyxNQUFQO0FBQ0EvVCxXQUFHYyxTQUFILENBQWFzVCxVQUFiLENBQXdCLEVBQUUzUCxPQUFRLEdBQVYsRUFBZTRQLFVBQVcsV0FBMUIsRUFBdUMzSCxRQUFTcUgsTUFBaEQsRUFBeEI7QUFDSCxLQUpEOztBQU1BO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQUVBO0FBQ0FmLFVBQU1zQixNQUFOLENBQWEsVUFBUzlTLEtBQVQsRUFDUjs7QUFFRyxZQUFLLENBQUUsS0FBS3FKLGFBQUwsRUFBUCxFQUE4QjtBQUMxQixpQkFBS0MsY0FBTDtBQUNBLG1CQUFPLEtBQVA7QUFDSDs7QUFFRjtBQUNBLFlBQUlzSSxTQUFTalosRUFBRSxJQUFGLEVBQVFnSSxJQUFSLENBQWEsZ0JBQWIsQ0FBYjtBQUNBLFlBQUl4QyxRQUFReVQsT0FBTy9WLEdBQVAsRUFBWjtBQUNBc0MsZ0JBQVF4RixFQUFFcUwsSUFBRixDQUFPN0YsS0FBUCxDQUFSO0FBQ0EsWUFBSUEsVUFBVSxFQUFkLEVBQ0E7QUFDRWtPLGtCQUFNLDZCQUFOO0FBQ0F1RixtQkFBT3BTLE9BQVAsQ0FBZSxNQUFmO0FBQ0EsbUJBQU8sS0FBUDtBQUNEO0FBQ0Q7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQWJBLGFBZUE7O0FBRUM7QUFDQSxvQkFBSXVULGFBQWVSLFVBQVUsSUFBWixHQUFxQixLQUFyQixHQUE2QlQsUUFBUW5SLElBQVIsQ0FBYSxRQUFiLEVBQXVCOUUsR0FBdkIsRUFBOUM7QUFDQTJDLG1CQUFHZ1UsS0FBSCxDQUFTN1YsR0FBVCxDQUFhLEVBQUU4VixRQUFTLEVBQUVDLElBQUsvWixFQUFFLHdCQUFGLEVBQTRCOEMsTUFBNUIsR0FBcUMsQ0FBNUMsRUFBK0M4VyxRQUFTQSxNQUF4RCxFQUFnRVEsWUFBWUEsVUFBNUUsRUFBWCxFQUFiOztBQUVBLHVCQUFPLElBQVA7QUFDQTtBQUVOLEtBcENGO0FBc0NILENBN0hEOzs7QUNBQSxJQUFJdlUsS0FBS0EsTUFBTSxFQUFmO0FBQ0FDLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVwQkYsS0FBR2MsU0FBSCxDQUFhMFQsbUJBQWIsR0FBbUMsWUFBVztBQUM1QztBQUNBLFFBQUl2RyxTQUFTLEVBQWI7QUFDQSxRQUFJd0csZ0JBQWdCLENBQXBCO0FBQ0EsUUFBS3RhLEVBQUUsVUFBRixFQUFjdUYsSUFBZCxDQUFtQixNQUFuQixLQUE4QixZQUFuQyxFQUFrRDtBQUNoRCtVLHNCQUFnQixDQUFoQjtBQUNBeEcsZUFBUyxhQUFUO0FBQ0QsS0FIRCxNQUdPLElBQUt6TyxPQUFPQyxRQUFQLENBQWdCa0IsSUFBaEIsQ0FBcUIvQyxPQUFyQixDQUE2QixhQUE3QixJQUE4QyxDQUFDLENBQXBELEVBQXdEO0FBQzdENlcsc0JBQWdCLENBQWhCO0FBQ0F4RyxlQUFTLFFBQVQ7QUFDRDtBQUNELFdBQU8sRUFBRTlHLE9BQVFzTixhQUFWLEVBQXlCTixPQUFRblUsR0FBR3FDLE1BQUgsQ0FBVUMsRUFBVixHQUFlMkwsTUFBaEQsRUFBUDtBQUVELEdBYkQ7O0FBZUFqTyxLQUFHYyxTQUFILENBQWE0VCxpQkFBYixHQUFpQyxVQUFTL1QsSUFBVCxFQUFlO0FBQzlDLFFBQUlwRixNQUFNcEIsRUFBRW9CLEdBQUYsQ0FBTW9GLElBQU4sQ0FBVjtBQUNBLFFBQUlnVSxXQUFXcFosSUFBSXNFLE9BQUosRUFBZjtBQUNBOFUsYUFBU2xYLElBQVQsQ0FBY3RELEVBQUUsTUFBRixFQUFVdUYsSUFBVixDQUFlLGtCQUFmLENBQWQ7QUFDQWlWLGFBQVNsWCxJQUFULENBQWNsQyxJQUFJUSxLQUFKLENBQVUsSUFBVixDQUFkO0FBQ0EsUUFBSTZZLEtBQUssRUFBVDtBQUNBLFFBQUtELFNBQVMvVyxPQUFULENBQWlCLFFBQWpCLElBQTZCLENBQUMsQ0FBOUIsSUFBbUNyQyxJQUFJUSxLQUFKLENBQVUsSUFBVixDQUF4QyxFQUEyRDtBQUN6RDZZLFdBQUssU0FBU3JaLElBQUlRLEtBQUosQ0FBVSxJQUFWLENBQWQ7QUFDRDtBQUNENFksZUFBVyxNQUFNQSxTQUFTak4sSUFBVCxDQUFjLEdBQWQsQ0FBTixHQUEyQmtOLEVBQXRDO0FBQ0EsV0FBT0QsUUFBUDtBQUNELEdBWEQ7O0FBYUEzVSxLQUFHYyxTQUFILENBQWErVCxXQUFiLEdBQTJCLFlBQVc7QUFDcEMsV0FBTzdVLEdBQUdjLFNBQUgsQ0FBYTRULGlCQUFiLEVBQVA7QUFDRCxHQUZEO0FBSUQsQ0FsQ0Q7OztBQ0RBelUsS0FBS0MsS0FBTCxDQUFXLFlBQVc7QUFDcEIsTUFBSTRVLEtBQUosQ0FBVyxJQUFJQyxRQUFKLENBQWMsSUFBSUMsT0FBSixDQUFhLElBQUlDLFVBQUo7QUFDdENqVixPQUFLQSxNQUFNLEVBQVg7O0FBRUFBLEtBQUdrVixNQUFILEdBQVksWUFBVzs7QUFFckI7QUFDQTtBQUNBOztBQUVBRixjQUFVN2EsRUFBRSxRQUFGLENBQVY7QUFDQThhLGlCQUFhOWEsRUFBRSxZQUFGLENBQWI7QUFDQSxRQUFLOGEsV0FBV2hZLE1BQWhCLEVBQXlCO0FBQ3ZCNkgsZUFBU3FRLGVBQVQsQ0FBeUJ4UixPQUF6QixDQUFpQ3lSLFFBQWpDLEdBQTRDLElBQTVDO0FBQ0FILGlCQUFXdlIsR0FBWCxDQUFlLENBQWYsRUFBa0IyUixLQUFsQixDQUF3QkMsV0FBeEIsQ0FBb0MsVUFBcEMsUUFBb0RMLFdBQVdNLFdBQVgsS0FBMkIsSUFBL0U7QUFDQU4saUJBQVd2UixHQUFYLENBQWUsQ0FBZixFQUFrQkMsT0FBbEIsQ0FBMEI2UixjQUExQjtBQUNBMVEsZUFBU3FRLGVBQVQsQ0FBeUJFLEtBQXpCLENBQStCQyxXQUEvQixDQUEyQyxvQkFBM0MsRUFBb0VMLFdBQVdNLFdBQVgsRUFBcEU7QUFDQSxVQUFJRSxXQUFXUixXQUFXOVMsSUFBWCxDQUFnQixpQkFBaEIsQ0FBZjtBQUNBc1QsZUFBU2xVLEVBQVQsQ0FBWSxPQUFaLEVBQXFCLFlBQVc7QUFDOUJ1RCxpQkFBU3FRLGVBQVQsQ0FBeUJ4UixPQUF6QixDQUFpQ3lSLFFBQWpDLEdBQTRDLEVBQUl0USxTQUFTcVEsZUFBVCxDQUF5QnhSLE9BQXpCLENBQWlDeVIsUUFBakMsSUFBNkMsTUFBakQsQ0FBNUM7QUFDQSxZQUFJTSxrQkFBa0IsQ0FBdEI7QUFDQSxZQUFLNVEsU0FBU3FRLGVBQVQsQ0FBeUJ4UixPQUF6QixDQUFpQ3lSLFFBQWpDLElBQTZDLE1BQWxELEVBQTJEO0FBQ3pETSw0QkFBa0JULFdBQVd2UixHQUFYLENBQWUsQ0FBZixFQUFrQkMsT0FBbEIsQ0FBMEI2UixjQUE1QztBQUNEO0FBQ0QxUSxpQkFBU3FRLGVBQVQsQ0FBeUJFLEtBQXpCLENBQStCQyxXQUEvQixDQUEyQyxvQkFBM0MsRUFBaUVJLGVBQWpFO0FBQ0QsT0FQRDs7QUFTQSxVQUFLMVYsR0FBR3FDLE1BQUgsQ0FBVXNULEVBQVYsSUFBZ0IsT0FBckIsRUFBK0I7QUFDN0JwVixtQkFBVyxZQUFNO0FBQ2ZrVixtQkFBU3pVLE9BQVQsQ0FBaUIsT0FBakI7QUFDRCxTQUZELEVBRUcsSUFGSDtBQUdEO0FBQ0Y7O0FBRURoQixPQUFHOFUsS0FBSCxHQUFXQSxLQUFYOztBQUVBLFFBQUljLFdBQVd6YixFQUFFLFVBQUYsQ0FBZjs7QUFFQTRhLGVBQVdhLFNBQVN6VCxJQUFULENBQWMsdUJBQWQsQ0FBWDs7QUFFQWhJLE1BQUUsa0NBQUYsRUFBc0NvSCxFQUF0QyxDQUF5QyxPQUF6QyxFQUFrRCxZQUFXO0FBQzNEdUQsZUFBU3FRLGVBQVQsQ0FBeUJVLGlCQUF6QjtBQUNELEtBRkQ7O0FBSUE3VixPQUFHOFYsS0FBSCxHQUFXOVYsR0FBRzhWLEtBQUgsSUFBWSxFQUF2Qjs7QUFFQTtBQUNBM2IsTUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsT0FBYixFQUFzQixvQkFBdEIsRUFBNEMsVUFBU0MsS0FBVCxFQUFnQjtBQUMxRDtBQUNBLFVBQUl5SixRQUFROVEsRUFBRXFILE1BQU11UyxNQUFSLENBQVo7QUFDQSxVQUFLOUksTUFBTTZCLEVBQU4sQ0FBUywyQkFBVCxDQUFMLEVBQTZDO0FBQzNDO0FBQ0Q7QUFDRCxVQUFLN0IsTUFBTThLLE9BQU4sQ0FBYyxxQkFBZCxFQUFxQzlZLE1BQTFDLEVBQW1EO0FBQ2pEO0FBQ0Q7QUFDRCxVQUFLZ08sTUFBTTZCLEVBQU4sQ0FBUyxVQUFULENBQUwsRUFBNEI7QUFDMUI5TSxXQUFHcUgsTUFBSCxDQUFVLEtBQVY7QUFDRDtBQUNGLEtBWkQ7O0FBY0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQTs7QUFFQTtBQUNBO0FBQ0E7QUFDQSxRQUFLckgsTUFBTUEsR0FBRzhWLEtBQVQsSUFBa0I5VixHQUFHOFYsS0FBSCxDQUFTRSx1QkFBaEMsRUFBMEQ7QUFDeERoVyxTQUFHOFYsS0FBSCxDQUFTRSx1QkFBVDtBQUNEO0FBQ0RsUixhQUFTcVEsZUFBVCxDQUF5QnhSLE9BQXpCLENBQWlDeVIsUUFBakMsR0FBNEMsTUFBNUM7QUFDRCxHQTdFRDs7QUErRUFwVixLQUFHcUgsTUFBSCxHQUFZLFVBQVM0TyxLQUFULEVBQWdCOztBQUUxQjtBQUNBOWIsTUFBRSxvQkFBRixFQUF3QmdJLElBQXhCLENBQTZCLHVCQUE3QixFQUFzRHJHLElBQXRELENBQTJELGVBQTNELEVBQTRFbWEsS0FBNUU7QUFDQTliLE1BQUUsTUFBRixFQUFVdUosR0FBVixDQUFjLENBQWQsRUFBaUJDLE9BQWpCLENBQXlCdVMsZUFBekIsR0FBMkNELEtBQTNDO0FBQ0E5YixNQUFFLE1BQUYsRUFBVXVKLEdBQVYsQ0FBYyxDQUFkLEVBQWlCQyxPQUFqQixDQUF5QnNCLElBQXpCLEdBQWdDZ1IsUUFBUSxTQUFSLEdBQW9CLFFBQXBEOztBQUVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0QsR0FkRDs7QUFnQkExVixhQUFXUCxHQUFHa1YsTUFBZCxFQUFzQixJQUF0Qjs7QUFFQSxNQUFJaUIsMkJBQTJCLFNBQTNCQSx3QkFBMkIsR0FBVztBQUN4QyxRQUFJMUQsSUFBSXRZLEVBQUUsaUNBQUYsRUFBcUNvYixXQUFyQyxNQUFzRCxFQUE5RDtBQUNBLFFBQUlhLE1BQU0sQ0FBRWpjLEVBQUUsUUFBRixFQUFZa2MsTUFBWixLQUF1QjVELENBQXpCLElBQStCLElBQXpDO0FBQ0EzTixhQUFTcVEsZUFBVCxDQUF5QkUsS0FBekIsQ0FBK0JDLFdBQS9CLENBQTJDLDBCQUEzQyxFQUF1RWMsTUFBTSxJQUE3RTtBQUNELEdBSkQ7QUFLQWpjLElBQUVxRixNQUFGLEVBQVUrQixFQUFWLENBQWEsUUFBYixFQUF1QjRVLHdCQUF2QjtBQUNBQTs7QUFFQWhjLElBQUUsTUFBRixFQUFVdUosR0FBVixDQUFjLENBQWQsRUFBaUJnRCxZQUFqQixDQUE4Qix1QkFBOUIsRUFBdUQsS0FBdkQ7QUFFRCxDQS9HRDs7Ozs7QUNBQSxJQUFJLE9BQU92TCxPQUFPbWIsTUFBZCxJQUF3QixVQUE1QixFQUF3QztBQUN0QztBQUNBbmIsU0FBT3dNLGNBQVAsQ0FBc0J4TSxNQUF0QixFQUE4QixRQUE5QixFQUF3QztBQUN0Q2daLFdBQU8sU0FBU21DLE1BQVQsQ0FBZ0J2QyxNQUFoQixFQUF3QndDLE9BQXhCLEVBQWlDO0FBQUU7QUFDeEM7O0FBQ0EsVUFBSXhDLFVBQVUsSUFBZCxFQUFvQjtBQUFFO0FBQ3BCLGNBQU0sSUFBSXlDLFNBQUosQ0FBYyw0Q0FBZCxDQUFOO0FBQ0Q7O0FBRUQsVUFBSUMsS0FBS3RiLE9BQU80WSxNQUFQLENBQVQ7O0FBRUEsV0FBSyxJQUFJNU0sUUFBUSxDQUFqQixFQUFvQkEsUUFBUWpJLFVBQVVqQyxNQUF0QyxFQUE4Q2tLLE9BQTlDLEVBQXVEO0FBQ3JELFlBQUl1UCxhQUFheFgsVUFBVWlJLEtBQVYsQ0FBakI7O0FBRUEsWUFBSXVQLGNBQWMsSUFBbEIsRUFBd0I7QUFBRTtBQUN4QixlQUFLLElBQUlDLE9BQVQsSUFBb0JELFVBQXBCLEVBQWdDO0FBQzlCO0FBQ0EsZ0JBQUl2YixPQUFPQyxTQUFQLENBQWlCa0UsY0FBakIsQ0FBZ0NILElBQWhDLENBQXFDdVgsVUFBckMsRUFBaURDLE9BQWpELENBQUosRUFBK0Q7QUFDN0RGLGlCQUFHRSxPQUFILElBQWNELFdBQVdDLE9BQVgsQ0FBZDtBQUNEO0FBQ0Y7QUFDRjtBQUNGO0FBQ0QsYUFBT0YsRUFBUDtBQUNELEtBdEJxQztBQXVCdENHLGNBQVUsSUF2QjRCO0FBd0J0QzlPLGtCQUFjO0FBeEJ3QixHQUF4QztBQTBCRDs7QUFFRDtBQUNBLENBQUMsVUFBVStPLEdBQVYsRUFBZTtBQUNkQSxNQUFJQyxPQUFKLENBQVksVUFBVW5SLElBQVYsRUFBZ0I7QUFDMUIsUUFBSUEsS0FBS3JHLGNBQUwsQ0FBb0IsT0FBcEIsQ0FBSixFQUFrQztBQUNoQztBQUNEO0FBQ0RuRSxXQUFPd00sY0FBUCxDQUFzQmhDLElBQXRCLEVBQTRCLE9BQTVCLEVBQXFDO0FBQ25DbUMsb0JBQWMsSUFEcUI7QUFFbkNELGtCQUFZLElBRnVCO0FBR25DK08sZ0JBQVUsSUFIeUI7QUFJbkN6QyxhQUFPLFNBQVM0QyxLQUFULEdBQWlCO0FBQ3RCLFlBQUlDLFNBQVN0UixNQUFNdEssU0FBTixDQUFnQm1OLEtBQWhCLENBQXNCcEosSUFBdEIsQ0FBMkJELFNBQTNCLENBQWI7QUFBQSxZQUNFK1gsVUFBVW5TLFNBQVNvUyxzQkFBVCxFQURaOztBQUdBRixlQUFPRixPQUFQLENBQWUsVUFBVUssT0FBVixFQUFtQjtBQUNoQyxjQUFJQyxTQUFTRCxtQkFBbUJFLElBQWhDO0FBQ0FKLGtCQUFRSyxXQUFSLENBQW9CRixTQUFTRCxPQUFULEdBQW1CclMsU0FBU3lTLGNBQVQsQ0FBd0JsWixPQUFPOFksT0FBUCxDQUF4QixDQUF2QztBQUNELFNBSEQ7O0FBS0EsYUFBS0ssVUFBTCxDQUFnQkMsWUFBaEIsQ0FBNkJSLE9BQTdCLEVBQXNDLEtBQUtTLFdBQTNDO0FBQ0Q7QUFka0MsS0FBckM7QUFnQkQsR0FwQkQ7QUFxQkQsQ0F0QkQsRUFzQkcsQ0FBQ3JTLFFBQVFqSyxTQUFULEVBQW9CdWMsY0FBY3ZjLFNBQWxDLEVBQTZDd2MsYUFBYXhjLFNBQTFELENBdEJIOztBQXdCQSxTQUFTeWMsbUJBQVQsR0FBK0I7QUFDN0IsZUFENkIsQ0FDZjs7QUFDZCxNQUFJN2EsU0FBUyxLQUFLd2EsVUFBbEI7QUFBQSxNQUE4QnZiLElBQUlpRCxVQUFVakMsTUFBNUM7QUFBQSxNQUFvRDZhLFdBQXBEO0FBQ0EsTUFBSSxDQUFDOWEsTUFBTCxFQUFhO0FBQ2IsTUFBSSxDQUFDZixDQUFMLEVBQVE7QUFDTmUsV0FBTythLFdBQVAsQ0FBbUIsSUFBbkI7QUFDRixTQUFPOWIsR0FBUCxFQUFZO0FBQUU7QUFDWjZiLGtCQUFjNVksVUFBVWpELENBQVYsQ0FBZDtBQUNBLFFBQUksUUFBTzZiLFdBQVAseUNBQU9BLFdBQVAsT0FBdUIsUUFBM0IsRUFBb0M7QUFDbENBLG9CQUFjLEtBQUtFLGFBQUwsQ0FBbUJULGNBQW5CLENBQWtDTyxXQUFsQyxDQUFkO0FBQ0QsS0FGRCxNQUVPLElBQUlBLFlBQVlOLFVBQWhCLEVBQTJCO0FBQ2hDTSxrQkFBWU4sVUFBWixDQUF1Qk8sV0FBdkIsQ0FBbUNELFdBQW5DO0FBQ0Q7QUFDRDtBQUNBLFFBQUksQ0FBQzdiLENBQUwsRUFBUTtBQUNOZSxhQUFPaWIsWUFBUCxDQUFvQkgsV0FBcEIsRUFBaUMsSUFBakMsRUFERixLQUVLO0FBQ0g5YSxhQUFPeWEsWUFBUCxDQUFvQkssV0FBcEIsRUFBaUMsS0FBS0ksZUFBdEM7QUFDSDtBQUNGO0FBQ0QsSUFBSSxDQUFDN1MsUUFBUWpLLFNBQVIsQ0FBa0IrYyxXQUF2QixFQUNJOVMsUUFBUWpLLFNBQVIsQ0FBa0IrYyxXQUFsQixHQUFnQ04sbUJBQWhDO0FBQ0osSUFBSSxDQUFDRixjQUFjdmMsU0FBZCxDQUF3QitjLFdBQTdCLEVBQ0lSLGNBQWN2YyxTQUFkLENBQXdCK2MsV0FBeEIsR0FBc0NOLG1CQUF0QztBQUNKLElBQUksQ0FBQ0QsYUFBYXhjLFNBQWIsQ0FBdUIrYyxXQUE1QixFQUNJUCxhQUFheGMsU0FBYixDQUF1QitjLFdBQXZCLEdBQXFDTixtQkFBckM7OztBQ2hGSjVYLEtBQUtDLEtBQUwsQ0FBVyxZQUFXO0FBQ3BCLE1BQUk4UyxRQUFRN1ksRUFBRSxxQkFBRixDQUFaOztBQUVBLE1BQUlpZSxRQUFRamUsRUFBRSxNQUFGLENBQVo7O0FBRUFBLElBQUVxRixNQUFGLEVBQVUrQixFQUFWLENBQWEsY0FBYixFQUE2QixZQUFXO0FBQ3RDcEgsTUFBRSxvQkFBRixFQUF3QmtlLFVBQXhCLENBQW1DLFVBQW5DLEVBQStDdkksV0FBL0MsQ0FBMkQsYUFBM0Q7QUFDRCxHQUZEOztBQUlBM1YsSUFBRSxNQUFGLEVBQVVvSCxFQUFWLENBQWEsUUFBYixFQUF1Qix5QkFBdkIsRUFBa0QsVUFBU0MsS0FBVCxFQUFnQjtBQUNoRXhCLE9BQUdzWSxtQkFBSCxHQUF5QixLQUF6QjtBQUNBLFFBQUlDLFNBQVNwZSxFQUFFLElBQUYsQ0FBYjs7QUFFQSxRQUFJcWUsVUFBVUQsT0FBT3BXLElBQVAsQ0FBWSxxQkFBWixDQUFkO0FBQ0EsUUFBS3FXLFFBQVF6VSxRQUFSLENBQWlCLGFBQWpCLENBQUwsRUFBdUM7QUFDckM4SixZQUFNLHdFQUFOO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7QUFDRCxRQUFJdUYsU0FBU21GLE9BQU9wVyxJQUFQLENBQVksa0JBQVosQ0FBYjtBQUNBLFFBQUssQ0FBRWhJLEVBQUVxTCxJQUFGLENBQU80TixPQUFPL1YsR0FBUCxFQUFQLENBQVAsRUFBOEI7QUFDNUJrSCxjQUFRc0osS0FBUixDQUFjLHdDQUFkO0FBQ0EsYUFBTyxLQUFQO0FBQ0Q7QUFDRDJLLFlBQVFoTCxRQUFSLENBQWlCLGFBQWpCLEVBQWdDMVIsSUFBaEMsQ0FBcUMsVUFBckMsRUFBaUQsVUFBakQ7O0FBRUEzQixNQUFFcUYsTUFBRixFQUFVK0IsRUFBVixDQUFhLFFBQWIsRUFBdUIsWUFBVztBQUNoQ3BILFFBQUVxRixNQUFGLEVBQVV3QixPQUFWLENBQWtCLGNBQWxCO0FBQ0QsS0FGRDs7QUFJQSxRQUFLaEIsR0FBR3VRLE1BQUgsSUFBYXZRLEdBQUd1USxNQUFILENBQVVDLFFBQVYsQ0FBbUJpSSxZQUFyQyxFQUFvRDtBQUNsRGpYLFlBQU1pTCxjQUFOO0FBQ0EsYUFBT3pNLEdBQUd1USxNQUFILENBQVVDLFFBQVYsQ0FBbUJpSSxZQUFuQixDQUFnQ25FLE1BQWhDLENBQXVDaUUsT0FBTzdVLEdBQVAsQ0FBVyxDQUFYLENBQXZDLENBQVA7QUFDRDs7QUFFRDtBQUNELEdBMUJEOztBQTRCQXZKLElBQUUsb0JBQUYsRUFBd0JvSCxFQUF4QixDQUEyQixRQUEzQixFQUFxQyxZQUFXO0FBQzlDLFFBQUltWCxLQUFLbFYsU0FBU3JKLEVBQUUsSUFBRixFQUFRdUYsSUFBUixDQUFhLElBQWIsQ0FBVCxFQUE2QixFQUE3QixDQUFUO0FBQ0EsUUFBSXlVLFFBQVEzUSxTQUFTckosRUFBRSxJQUFGLEVBQVFrRCxHQUFSLEVBQVQsRUFBd0IsRUFBeEIsQ0FBWjtBQUNBLFFBQUlpUSxRQUFRLENBQUU2RyxRQUFRLENBQVYsSUFBZ0J1RSxFQUFoQixHQUFxQixDQUFqQztBQUNBLFFBQUlILFNBQVNwZSxFQUFFLHFCQUFGLENBQWI7QUFDQW9lLFdBQU8zVixNQUFQLGtEQUEwRDBLLEtBQTFEO0FBQ0FpTCxXQUFPM1YsTUFBUCwrQ0FBdUQ4VixFQUF2RDtBQUNBSCxXQUFPakUsTUFBUDtBQUNELEdBUkQ7QUFVRCxDQS9DRDs7O0FDQUFyVSxLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLE1BQUYsRUFBVW9ILEVBQVYsQ0FBYSxPQUFiLEVBQXNCLGNBQXRCLEVBQXNDLFVBQVM5QyxDQUFULEVBQVk7QUFDOUNBLFVBQUVnTyxjQUFGO0FBQ0FsSSxnQkFBUXNKLEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgLy8gdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAvLyB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIC8vIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIC8vICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gIC8vICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gIC8vICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgLy8gICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gIC8vICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAvLyAgICAgICB9LCA1MCk7XG4gIC8vICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAvLyAgICAgICB9LCA1MDApO1xuXG4gIC8vICAgICB9XG4gIC8vIH1cblxuICBIVC5yZW5ld19hdXRoID0gZnVuY3Rpb24oZW50aXR5SUQsIHNvdXJjZT0naW1hZ2UnKSB7XG4gICAgaWYgKCBIVC5fX3JlbmV3aW5nICkgeyByZXR1cm4gOyB9XG4gICAgSFQuX19yZW5ld2luZyA9IHRydWU7XG4gICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICB2YXIgcmVhdXRoX3VybCA9IGBodHRwczovLyR7SFQuc2VydmljZV9kb21haW59L1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPSR7ZW50aXR5SUR9JnRhcmdldD0ke2VuY29kZVVSSUNvbXBvbmVudCh3aW5kb3cubG9jYXRpb24uaHJlZil9YDtcbiAgICAgIHZhciByZXR2YWwgPSB3aW5kb3cuY29uZmlybShgV2UncmUgaGF2aW5nIGEgcHJvYmxlbSB3aXRoIHlvdXIgc2Vzc2lvbjsgc2VsZWN0IE9LIHRvIGxvZyBpbiBhZ2Fpbi5gKTtcbiAgICAgIGlmICggcmV0dmFsICkge1xuICAgICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IHJlYXV0aF91cmw7XG4gICAgICB9XG4gICAgfSwgMTAwKTtcbiAgfVxuXG4gIEhULmFuYWx5dGljcyA9IEhULmFuYWx5dGljcyB8fCB7fTtcbiAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbiA9IGZ1bmN0aW9uKGhyZWYsIHRyaWdnZXIpIHtcbiAgICBpZiAoIGhyZWYgPT09IHVuZGVmaW5lZCApIHsgaHJlZiA9IGxvY2F0aW9uLmhyZWYgOyB9XG4gICAgdmFyIGRlbGltID0gaHJlZi5pbmRleE9mKCc7JykgPiAtMSA/ICc7JyA6ICcmJztcbiAgICBpZiAoIHRyaWdnZXIgPT0gbnVsbCApIHsgdHJpZ2dlciA9ICctJzsgfVxuICAgIGhyZWYgKz0gZGVsaW0gKyAnYT0nICsgdHJpZ2dlcjtcbiAgICAvLyAkLmdldChocmVmKTtcbiAgICAkLmFqYXgoaHJlZiwgXG4gICAge1xuICAgICAgY29tcGxldGU6IGZ1bmN0aW9uKHhociwgc3RhdHVzKSB7XG4gICAgICAgIHZhciBlbnRpdHlJRCA9IHhoci5nZXRSZXNwb25zZUhlYWRlcigneC1oYXRoaXRydXN0LXJlbmV3Jyk7XG4gICAgICAgIGlmICggZW50aXR5SUQgKSB7XG4gICAgICAgICAgSFQucmVuZXdfYXV0aChlbnRpdHlJRCwgJ2xvZ0FjdGlvbicpO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSlcbiAgfVxuXG5cbiAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJ2FbZGF0YS10cmFja2luZy1jYXRlZ29yeT1cIm91dExpbmtzXCJdJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyB2YXIgdHJpZ2dlciA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctYWN0aW9uJyk7XG4gICAgLy8gdmFyIGxhYmVsID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1sYWJlbCcpO1xuICAgIC8vIGlmICggbGFiZWwgKSB7IHRyaWdnZXIgKz0gJzonICsgbGFiZWw7IH1cbiAgICB2YXIgdHJpZ2dlciA9ICdvdXQnICsgJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbih1bmRlZmluZWQsIHRyaWdnZXIpO1xuICB9KVxuXG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICB2YXIgTU9OVEhTID0gWydKYW51YXJ5JywgJ0ZlYnJ1YXJ5JywgJ01hcmNoJywgJ0FwcmlsJywgJ01heScsICdKdW5lJywgJ0p1bHknLFxuICAgICdBdWd1c3QnLCAnU2VwdGVtYmVyJywgJ09jdG9iZXInLCAnTm92ZW1iZXInLCAnRGVjZW1iZXInXTtcblxuICB2YXIgJGVtZXJnZW5jeV9hY2Nlc3MgPSAkKFwiI2FjY2Vzcy1lbWVyZ2VuY3ktYWNjZXNzXCIpO1xuXG4gIHZhciBkZWx0YSA9IDUgKiA2MCAqIDEwMDA7XG4gIHZhciBsYXN0X3NlY29uZHM7XG4gIHZhciB0b2dnbGVfcmVuZXdfbGluayA9IGZ1bmN0aW9uKGRhdGUpIHtcbiAgICB2YXIgbm93ID0gRGF0ZS5ub3coKTtcbiAgICBpZiAoIG5vdyA+PSBkYXRlLmdldFRpbWUoKSApIHtcbiAgICAgIHZhciAkbGluayA9ICRlbWVyZ2VuY3lfYWNjZXNzLmZpbmQoXCJhW2Rpc2FibGVkXVwiKTtcbiAgICAgICRsaW5rLmF0dHIoXCJkaXNhYmxlZFwiLCBudWxsKTtcbiAgICB9XG4gIH1cblxuICB2YXIgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCA9IGZ1bmN0aW9uKCkge1xuICAgIGlmICggISBIVCB8fCAhIEhULnBhcmFtcyB8fCAhIEhULnBhcmFtcy5pZCApIHsgcmV0dXJuIDsgfVxuICAgIHZhciBkYXRhID0gJC5jb29raWUoJ0hUZXhwaXJhdGlvbicsIHVuZGVmaW5lZCwgeyBqc29uOiB0cnVlIH0pO1xuICAgIGlmICggISBkYXRhICkgeyByZXR1cm4gOyB9XG4gICAgdmFyIHNlY29uZHMgPSBkYXRhW0hULnBhcmFtcy5pZF07XG4gICAgLy8gY29uc29sZS5sb2coXCJBSE9ZIE9CU0VSVkVcIiwgc2Vjb25kcywgbGFzdF9zZWNvbmRzKTtcbiAgICBpZiAoIHNlY29uZHMgPT0gLTEgKSB7XG4gICAgICB2YXIgJGxpbmsgPSAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicCBhXCIpLmNsb25lKCk7XG4gICAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwicFwiKS50ZXh0KFwiWW91ciBhY2Nlc3MgaGFzIGV4cGlyZWQgYW5kIGNhbm5vdCBiZSByZW5ld2VkLiBSZWxvYWQgdGhlIHBhZ2Ugb3IgdHJ5IGFnYWluIGxhdGVyLiBBY2Nlc3MgaGFzIGJlZW4gcHJvdmlkZWQgdGhyb3VnaCB0aGUgXCIpO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcInBcIikuYXBwZW5kKCRsaW5rKTtcbiAgICAgIHZhciAkYWN0aW9uID0gJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5hbGVydC0tZW1lcmdlbmN5LWFjY2Vzcy0tb3B0aW9ucyBhXCIpO1xuICAgICAgJGFjdGlvbi5hdHRyKCdocmVmJywgd2luZG93LmxvY2F0aW9uLmhyZWYpO1xuICAgICAgJGFjdGlvbi50ZXh0KCdSZWxvYWQnKTtcbiAgICAgIHJldHVybjtcbiAgICB9XG4gICAgaWYgKCBzZWNvbmRzID4gbGFzdF9zZWNvbmRzICkge1xuICAgICAgdmFyIG1lc3NhZ2UgPSB0aW1lMm1lc3NhZ2Uoc2Vjb25kcyk7XG4gICAgICBsYXN0X3NlY29uZHMgPSBzZWNvbmRzO1xuICAgICAgJGVtZXJnZW5jeV9hY2Nlc3MuZmluZChcIi5leHBpcmVzLWRpc3BsYXlcIikudGV4dChtZXNzYWdlKTtcbiAgICB9XG4gIH1cblxuICB2YXIgdGltZTJtZXNzYWdlID0gZnVuY3Rpb24oc2Vjb25kcykge1xuICAgIHZhciBkYXRlID0gbmV3IERhdGUoc2Vjb25kcyAqIDEwMDApO1xuICAgIHZhciBob3VycyA9IGRhdGUuZ2V0SG91cnMoKTtcbiAgICB2YXIgYW1wbSA9ICdBTSc7XG4gICAgaWYgKCBob3VycyA+IDEyICkgeyBob3VycyAtPSAxMjsgYW1wbSA9ICdQTSc7IH1cbiAgICBpZiAoIGhvdXJzID09IDEyICl7IGFtcG0gPSAnUE0nOyB9XG4gICAgdmFyIG1pbnV0ZXMgPSBkYXRlLmdldE1pbnV0ZXMoKTtcbiAgICBpZiAoIG1pbnV0ZXMgPCAxMCApIHsgbWludXRlcyA9IGAwJHttaW51dGVzfWA7IH1cbiAgICB2YXIgbWVzc2FnZSA9IGAke2hvdXJzfToke21pbnV0ZXN9JHthbXBtfSAke01PTlRIU1tkYXRlLmdldE1vbnRoKCldfSAke2RhdGUuZ2V0RGF0ZSgpfWA7XG4gICAgcmV0dXJuIG1lc3NhZ2U7XG4gIH1cblxuICBpZiAoICRlbWVyZ2VuY3lfYWNjZXNzLmxlbmd0aCApIHtcbiAgICB2YXIgZXhwaXJhdGlvbiA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXMnKTtcbiAgICB2YXIgc2Vjb25kcyA9IHBhcnNlSW50KCRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0V4cGlyZXNTZWNvbmRzJyksIDEwKTtcbiAgICB2YXIgZ3JhbnRlZCA9ICRlbWVyZ2VuY3lfYWNjZXNzLmRhdGEoJ2FjY2Vzc0dyYW50ZWQnKTtcblxuICAgIHZhciBub3cgPSBEYXRlLm5vdygpIC8gMTAwMDtcbiAgICB2YXIgbWVzc2FnZSA9IHRpbWUybWVzc2FnZShzZWNvbmRzKTtcbiAgICAkZW1lcmdlbmN5X2FjY2Vzcy5maW5kKFwiLmV4cGlyZXMtZGlzcGxheVwiKS50ZXh0KG1lc3NhZ2UpO1xuICAgICRlbWVyZ2VuY3lfYWNjZXNzLmdldCgwKS5kYXRhc2V0LmluaXRpYWxpemVkID0gJ3RydWUnXG5cbiAgICBpZiAoIGdyYW50ZWQgKSB7XG4gICAgICAvLyBzZXQgdXAgYSB3YXRjaCBmb3IgdGhlIGV4cGlyYXRpb24gdGltZVxuICAgICAgbGFzdF9zZWNvbmRzID0gc2Vjb25kcztcbiAgICAgIHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyB0b2dnbGVfcmVuZXdfbGluayhkYXRlKTtcbiAgICAgICAgb2JzZXJ2ZV9leHBpcmF0aW9uX3RpbWVzdGFtcCgpO1xuICAgICAgfSwgNTAwKTtcbiAgICB9XG4gIH1cblxuICBpZiAoJCgnI2FjY2Vzc0Jhbm5lcklEJykubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN1cHByZXNzID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdzdXBhY2NiYW4nKTtcbiAgICAgIGlmIChzdXBwcmVzcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWJ1ZyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaHRkZXYnKTtcbiAgICAgIHZhciBpZGhhc2ggPSAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgdW5kZWZpbmVkLCB7anNvbiA6IHRydWV9KTtcbiAgICAgIHZhciB1cmwgPSAkLnVybCgpOyAvLyBwYXJzZSB0aGUgY3VycmVudCBwYWdlIFVSTFxuICAgICAgdmFyIGN1cnJpZCA9IHVybC5wYXJhbSgnaWQnKTtcbiAgICAgIGlmIChpZGhhc2ggPT0gbnVsbCkge1xuICAgICAgICAgIGlkaGFzaCA9IHt9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiBpZGhhc2gpIHtcbiAgICAgICAgICBpZiAoaWRoYXNoLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGlkcy5pbmRleE9mKGN1cnJpZCkgPCAwKSB8fCBkZWJ1Zykge1xuICAgICAgICAgIGlkaGFzaFtjdXJyaWRdID0gMTtcbiAgICAgICAgICAvLyBzZXNzaW9uIGNvb2tpZVxuICAgICAgICAgICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCBpZGhhc2gsIHsganNvbiA6IHRydWUsIHBhdGg6ICcvJywgZG9tYWluOiAnLmhhdGhpdHJ1c3Qub3JnJyB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIHNob3dBbGVydCgpIHtcbiAgICAgICAgICAgICAgdmFyIGh0bWwgPSAkKCcjYWNjZXNzQmFubmVySUQnKS5odG1sKCk7XG4gICAgICAgICAgICAgIHZhciAkYWxlcnQgPSBib290Ym94LmRpYWxvZyhodG1sLCBbeyBsYWJlbDogXCJPS1wiLCBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiIH1dLCB7IGhlYWRlciA6ICdTcGVjaWFsIGFjY2VzcycsIHJvbGU6ICdhbGVydGRpYWxvZycgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHNob3dBbGVydCwgMzAwMCwgdHJ1ZSk7XG4gICAgICB9XG4gIH1cblxufSkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjIuMjAxNzEyMTBcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiBzZWxmKSB7XG5cbi8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbi8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuaWYgKFxuXHQgICAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlNcblx0JiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKVxuKSB7XG5cbihmdW5jdGlvbiAodmlldykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbnZhclxuXHQgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG5cdCwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuXHQsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG5cdCwgb2JqQ3RyID0gT2JqZWN0XG5cdCwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXHR9XG5cdCwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdHZhclxuXHRcdFx0ICBpID0gMFxuXHRcdFx0LCBsZW4gPSB0aGlzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXHQvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcblx0LCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0dGhpcy5uYW1lID0gdHlwZTtcblx0XHR0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0fVxuXHQsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG5cdFx0aWYgKHRva2VuID09PSBcIlwiKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJTWU5UQVhfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBiZSBlbXB0eS5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGNvbnRhaW4gc3BhY2UgY2hhcmFjdGVycy5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcblx0fVxuXHQsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcblx0XHRcdCwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG5cdFx0XHQsIGkgPSAwXG5cdFx0XHQsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHRoaXMucHVzaChjbGFzc2VzW2ldKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuXHRcdH07XG5cdH1cblx0LCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cblx0LCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG5cdH1cbjtcbi8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbi8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG5jbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcblx0cmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbn07XG5jbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuXHRyZXR1cm4gfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbiArIFwiXCIpO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKCF+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAofmluZGV4KSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHZhclxuXHRcdCAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcblx0XHQsIG1ldGhvZCA9IHJlc3VsdCA/XG5cdFx0XHRmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG5cdFx0OlxuXHRcdFx0Zm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcblx0O1xuXG5cdGlmIChtZXRob2QpIHtcblx0XHR0aGlzW21ldGhvZF0odG9rZW4pO1xuXHR9XG5cblx0aWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmb3JjZTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gIXJlc3VsdDtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdHZhciBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0b2tlbiArIFwiXCIpO1xuXHRpZiAofmluZGV4KSB7XG5cdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEsIHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufVxuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0oc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0Ly8gcmVwbGFjZSgpIHBvbHlmaWxsXG5cdGlmICghKFwicmVwbGFjZVwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpLmNsYXNzTGlzdCkpIHtcblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0b2tlbnMgPSB0aGlzLnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpXG5cdFx0XHRcdCwgaW5kZXggPSB0b2tlbnMuaW5kZXhPZih0b2tlbiArIFwiXCIpXG5cdFx0XHQ7XG5cdFx0XHRpZiAofmluZGV4KSB7XG5cdFx0XHRcdHRva2VucyA9IHRva2Vucy5zbGljZShpbmRleCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlLmFwcGx5KHRoaXMsIHRva2Vucyk7XG5cdFx0XHRcdHRoaXMuYWRkKHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHRcdFx0dGhpcy5hZGQuYXBwbHkodGhpcywgdG9rZW5zLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0ZXN0RWxlbWVudCA9IG51bGw7XG59KCkpO1xuXG59IiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG5cbiAgICAgICAgJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAvLyAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNQVGFkZEl0ZW1CdG4nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xudmFyIHBob3RvY29waWVyX21lc3NhZ2UgPSAnVGhlIGNvcHlyaWdodCBsYXcgb2YgdGhlIFVuaXRlZCBTdGF0ZXMgKFRpdGxlIDE3LCBVLlMuIENvZGUpIGdvdmVybnMgdGhlIG1ha2luZyBvZiByZXByb2R1Y3Rpb25zIG9mIGNvcHlyaWdodGVkIG1hdGVyaWFsLiBVbmRlciBjZXJ0YWluIGNvbmRpdGlvbnMgc3BlY2lmaWVkIGluIHRoZSBsYXcsIGxpYnJhcmllcyBhbmQgYXJjaGl2ZXMgYXJlIGF1dGhvcml6ZWQgdG8gZnVybmlzaCBhIHJlcHJvZHVjdGlvbi4gT25lIG9mIHRoZXNlIHNwZWNpZmljIGNvbmRpdGlvbnMgaXMgdGhhdCB0aGUgcmVwcm9kdWN0aW9uIGlzIG5vdCB0byBiZSDigJx1c2VkIGZvciBhbnkgcHVycG9zZSBvdGhlciB0aGFuIHByaXZhdGUgc3R1ZHksIHNjaG9sYXJzaGlwLCBvciByZXNlYXJjaC7igJ0gSWYgYSB1c2VyIG1ha2VzIGEgcmVxdWVzdCBmb3IsIG9yIGxhdGVyIHVzZXMsIGEgcmVwcm9kdWN0aW9uIGZvciBwdXJwb3NlcyBpbiBleGNlc3Mgb2Yg4oCcZmFpciB1c2Us4oCdIHRoYXQgdXNlciBtYXkgYmUgbGlhYmxlIGZvciBjb3B5cmlnaHQgaW5mcmluZ2VtZW50Lic7XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAvLyAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIik7XG4gICAgICAgICQoXCJib2R5XCIpLm9uKFwiY2xpY2tcIiwgXCJhW2RhdGEtdG9nZ2xlKj1kb3dubG9hZF1cIiwgZnVuY3Rpb24oZSkgeyAgICAgICAgICAgIFxuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuXG4gICAgICAgICAgICAgICAgLy8gLS0tIFRIRSBNT0RFIElTIFRPR0dMRURcbiAgICAgICAgICAgICAgICAvLyBpZiAoIHRoaXMuZGF0YXNldC5waG90b2NvcGllciA9PSAndHJ1ZScgJiYgISBzZXNzaW9uU3RvcmFnZS5nZXRJdGVtKCdwaG90b2NvcGllci5jb25maXJtZWQnKSApIHtcbiAgICAgICAgICAgICAgICAvLyAgICAgaWYgKCAhIHdpbmRvdy5jb25maXJtKHBob3RvY29waWVyX21lc3NhZ2UpICkge1xuICAgICAgICAgICAgICAgIC8vICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICAvLyAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAvLyAgICAgfVxuICAgICAgICAgICAgICAgIC8vICAgICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdwaG90b2NvcGllci5jb25maXJtZWQnLCB0cnVlKTtcbiAgICAgICAgICAgICAgICAvLyB9XG5cblxuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAvLyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LXN1Y2Nlc3MgZG9uZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAvLyAgICAgJzxwPkFsbCBkb25lITwvcD4nICtcbiAgICAgICAgICAgIC8vICc8L2Rpdj4nICsgXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiIGRvd25sb2FkPVwiZG93bmxvYWRcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoICRkb3dubG9hZF9idG4uZ2V0KDApLmRvd25sb2FkID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIHZhciBudW1fcGFnZV9kb3dubG9hZHMgPSAwO1xuICAgICQoXCJhW2RhdGEtcGhvdG9jb3BpZXJdXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgaWYgKCB0aGlzLmRhdGFzZXQucGhvdG9jb3BpZXIgPT0gJ3RydWUnICkge1xuICAgICAgICAgICAgaWYgKCBudW1fcGFnZV9kb3dubG9hZHMgPT0gMCB8fCAoIGZhbHNlICYmIG51bV9wYWdlX2Rvd25sb2FkcyAlIDUgPT0gMCApICkge1xuICAgICAgICAgICAgICAgIGlmICggISB3aW5kb3cuY29uZmlybShwaG90b2NvcGllcl9tZXNzYWdlKSApIHtcbiAgICAgICAgICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbnVtX3BhZ2VfZG93bmxvYWRzICs9IDE7XG4gICAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gYW5kIGRvIHRoaXMgaGVyZVxuICAgICQoXCIjc2VsZWN0ZWRQYWdlc1BkZkxpbmtcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIHByaW50YWJsZSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcblxuICAgICAgICBpZiAoIHByaW50YWJsZS5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgIHZhciBidXR0b25zID0gW107XG5cbiAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIHByaW50LjwvcD5cIiBdO1xuICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgbGVmdCBvciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBhcHBlYXIgaW4gdGhlIHNlbGVjdGlvbiBjb250ZW50cyA8YnV0dG9uIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiAjNjY2OyBib3JkZXItY29sb3I6ICNlZWVcXFwiIGNsYXNzPVxcXCJidG4gc3F1YXJlXFxcIj48aSBjbGFzcz1cXFwiaWNvbW9vbiBpY29tb29uLXBhcGVyc1xcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0O1xuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2sgJyArXG4gICAgICAgICAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICAgICAgICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPjxpIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWhlbHBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5IZWxwOiBFbWJlZGRpbmcgSGF0aGlUcnVzdCBCb29rczwvc3Bhbj48L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LXNjcm9sbFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctZmxpcFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAvLyAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNlbWJlZEh0bWwnLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuO1xuXG4gICAgdmFyIGluaXRlZCA9IGZhbHNlO1xuXG4gICAgdmFyICRmb3JtID0gJChcIiNzZWFyY2gtbW9kYWwgZm9ybVwiKTtcblxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXQuc2VhcmNoLWlucHV0LXRleHRcIik7XG4gICAgdmFyICRpbnB1dF9sYWJlbCA9ICRmb3JtLmZpbmQoXCJsYWJlbFtmb3I9J3ExLWlucHV0J11cIik7XG4gICAgdmFyICRzZWxlY3QgPSAkZm9ybS5maW5kKFwiLmNvbnRyb2wtc2VhcmNodHlwZVwiKTtcbiAgICB2YXIgJHNlYXJjaF90YXJnZXQgPSAkZm9ybS5maW5kKFwiLnNlYXJjaC10YXJnZXRcIik7XG4gICAgdmFyICRmdCA9ICRmb3JtLmZpbmQoXCJzcGFuLmZ1bmt5LWZ1bGwtdmlld1wiKTtcblxuICAgIHZhciAkYmFja2Ryb3AgPSBudWxsO1xuXG4gICAgdmFyICRhY3Rpb24gPSAkKFwiI2FjdGlvbi1zZWFyY2gtaGF0aGl0cnVzdFwiKTtcbiAgICAkYWN0aW9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBib290Ym94LnNob3coJ3NlYXJjaC1tb2RhbCcsIHtcbiAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgICAgICAkaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcblxuICAgIHZhciBfc2V0dXAgPSB7fTtcbiAgICBfc2V0dXAubHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5oaWRlKCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgb3Igd2l0aGluIHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGZ1bGwtdGV4dCBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGZ1bGwtdGV4dCBpbmRleC5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0dXAuY2F0YWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LnNob3coKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBjYXRhbG9nIGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgY2F0YWxvZyBpbmRleDsgeW91IGNhbiBsaW1pdCB5b3VyIHNlYXJjaCB0byBhIHNlbGVjdGlvbiBvZiBmaWVsZHMuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9ICRzZWFyY2hfdGFyZ2V0LmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLnZhbCgpO1xuICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgaW5pdGVkID0gdHJ1ZTtcblxuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIGlmICggcHJlZnMuc2VhcmNoICYmIHByZWZzLnNlYXJjaC5mdCApIHtcbiAgICAgICAgJChcImlucHV0W25hbWU9ZnRdXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cblxuICAgICRzZWFyY2hfdGFyZ2V0Lm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBsYWJlbCA6IFwiLVwiLCBjYXRlZ29yeSA6IFwiSFQgU2VhcmNoXCIsIGFjdGlvbiA6IHRhcmdldCB9KTtcbiAgICB9KVxuXG4gICAgLy8gJGZvcm0uZGVsZWdhdGUoJzppbnB1dCcsICdmb2N1cyBjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiRk9DVVNJTkdcIiwgdGhpcyk7XG4gICAgLy8gICAgICRmb3JtLmFkZENsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgPT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcCA9ICQoJzxkaXYgY2xhc3M9XCJtb2RhbF9fb3ZlcmxheSBpbnZpc2libGVcIj48L2Rpdj4nKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgJGJhY2tkcm9wLmFwcGVuZFRvKCQoXCJib2R5XCIpKS5zaG93KCk7XG4gICAgLy8gfSlcblxuICAgIC8vICQoXCJib2R5XCIpLm9uKCdmb2N1cycsICc6aW5wdXQsYScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAvLyAgICAgaWYgKCAhICR0aGlzLmNsb3Nlc3QoXCIubmF2LXNlYXJjaC1mb3JtXCIpLmxlbmd0aCApIHtcbiAgICAvLyAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIHZhciBjbG9zZV9zZWFyY2hfZm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkZm9ybS5yZW1vdmVDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wICE9IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuZGV0YWNoKCk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuaGlkZSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYWRkIGV2ZW50IGhhbmRsZXIgZm9yIHN1Ym1pdCB0byBjaGVjayBmb3IgZW1wdHkgcXVlcnkgb3IgYXN0ZXJpc2tcbiAgICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpXG4gICAgICAgICB7XG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIEhULmFuYWx5dGljcy5nZXRDb250ZW50R3JvdXBEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlYXRcbiAgICB2YXIgc3VmZml4ID0gJyc7XG4gICAgdmFyIGNvbnRlbnRfZ3JvdXAgPSA0O1xuICAgIGlmICggJChcIiNzZWN0aW9uXCIpLmRhdGEoXCJ2aWV3XCIpID09ICdyZXN0cmljdGVkJyApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAyO1xuICAgICAgc3VmZml4ID0gJyNyZXN0cmljdGVkJztcbiAgICB9IGVsc2UgaWYgKCB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKFwiZGVidWc9c3VwZXJcIikgPiAtMSApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAzO1xuICAgICAgc3VmZml4ID0gJyNzdXBlcic7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4IDogY29udGVudF9ncm91cCwgdmFsdWUgOiBIVC5wYXJhbXMuaWQgKyBzdWZmaXggfTtcblxuICB9XG5cbiAgSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmID0gZnVuY3Rpb24oaHJlZikge1xuICAgIHZhciB1cmwgPSAkLnVybChocmVmKTtcbiAgICB2YXIgbmV3X2hyZWYgPSB1cmwuc2VnbWVudCgpO1xuICAgIG5ld19ocmVmLnB1c2goJChcImh0bWxcIikuZGF0YSgnY29udGVudC1wcm92aWRlcicpKTtcbiAgICBuZXdfaHJlZi5wdXNoKHVybC5wYXJhbShcImlkXCIpKTtcbiAgICB2YXIgcXMgPSAnJztcbiAgICBpZiAoIG5ld19ocmVmLmluZGV4T2YoXCJzZWFyY2hcIikgPiAtMSAmJiB1cmwucGFyYW0oJ3ExJykgICkge1xuICAgICAgcXMgPSAnP3ExPScgKyB1cmwucGFyYW0oJ3ExJyk7XG4gICAgfVxuICAgIG5ld19ocmVmID0gXCIvXCIgKyBuZXdfaHJlZi5qb2luKFwiL1wiKSArIHFzO1xuICAgIHJldHVybiBuZXdfaHJlZjtcbiAgfVxuXG4gIEhULmFuYWx5dGljcy5nZXRQYWdlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYoKTtcbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkbWVudTsgdmFyICR0cmlnZ2VyOyB2YXIgJGhlYWRlcjsgdmFyICRuYXZpZ2F0b3I7XG4gIEhUID0gSFQgfHwge307XG5cbiAgSFQubW9iaWZ5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBpZiAoICQoXCJodG1sXCIpLmlzKFwiLmRlc2t0b3BcIikgKSB7XG4gICAgLy8gICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImRlc2t0b3BcIikucmVtb3ZlQ2xhc3MoXCJuby1tb2JpbGVcIik7XG4gICAgLy8gfVxuXG4gICAgJGhlYWRlciA9ICQoXCJoZWFkZXJcIik7XG4gICAgJG5hdmlnYXRvciA9ICQoXCIubmF2aWdhdG9yXCIpO1xuICAgIGlmICggJG5hdmlnYXRvci5sZW5ndGggKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9IHRydWU7XG4gICAgICAkbmF2aWdhdG9yLmdldCgwKS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1oZWlnaHQnLCBgLSR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpICogMC45MH1weGApO1xuICAgICAgJG5hdmlnYXRvci5nZXQoMCkuZGF0YXNldC5vcmlnaW5hbEhlaWdodCA9IGB7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YDtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgYCR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpfXB4YCk7XG4gICAgICB2YXIgJGV4cGFuZG8gPSAkbmF2aWdhdG9yLmZpbmQoXCIuYWN0aW9uLWV4cGFuZG9cIik7XG4gICAgICAkZXhwYW5kby5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAhICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICk7XG4gICAgICAgIHZhciBuYXZpZ2F0b3JIZWlnaHQgPSAwO1xuICAgICAgICBpZiAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApIHtcbiAgICAgICAgICBuYXZpZ2F0b3JIZWlnaHQgPSAkbmF2aWdhdG9yLmdldCgwKS5kYXRhc2V0Lm9yaWdpbmFsSGVpZ2h0O1xuICAgICAgICB9XG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1uYXZpZ2F0b3ItaGVpZ2h0JywgbmF2aWdhdG9ySGVpZ2h0KTtcbiAgICAgIH0pXG5cbiAgICAgIGlmICggSFQucGFyYW1zLnVpID09ICdlbWJlZCcgKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRleHBhbmRvLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIEhULiRtZW51ID0gJG1lbnU7XG5cbiAgICB2YXIgJHNpZGViYXIgPSAkKFwiI3NpZGViYXJcIik7XG5cbiAgICAkdHJpZ2dlciA9ICRzaWRlYmFyLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIik7XG5cbiAgICAkKFwiI2FjdGlvbi1tb2JpbGUtdG9nZ2xlLWZ1bGxzY3JlZW5cIikub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgICB9KVxuXG4gICAgSFQudXRpbHMgPSBIVC51dGlscyB8fCB7fTtcblxuICAgIC8vICRzaWRlYmFyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJy5zaWRlYmFyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBoaWRlIHRoZSBzaWRlYmFyXG4gICAgICB2YXIgJHRoaXMgPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICBpZiAoICR0aGlzLmlzKFwiaW5wdXRbdHlwZT0ndGV4dCddLHNlbGVjdFwiKSApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKS5sZW5ndGggKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMuaXMoXCJidXR0b24sYVwiKSApIHtcbiAgICAgICAgSFQudG9nZ2xlKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKHdpbmRvdykub24oXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gICAgICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIC8vICAgICB9LCAxMDApO1xuICAgIC8vIH0pXG4gICAgaWYgKCBIVCAmJiBIVC51dGlscyAmJiBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSApIHtcbiAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgfVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gJ3RydWUnO1xuICB9XG5cbiAgSFQudG9nZ2xlID0gZnVuY3Rpb24oc3RhdGUpIHtcblxuICAgIC8vICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcIi5zaWRlYmFyLWNvbnRhaW5lclwiKS5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQuc2lkZWJhckV4cGFuZGVkID0gc3RhdGU7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IHN0YXRlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG5cbiAgICAvLyB2YXIgeGxpbmtfaHJlZjtcbiAgICAvLyBpZiAoICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZScgKSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1leHBhbmRlZCc7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWNvbGxhcHNlZCc7XG4gICAgLy8gfVxuICAgIC8vICR0cmlnZ2VyLmZpbmQoXCJzdmcgdXNlXCIpLmF0dHIoXCJ4bGluazpocmVmXCIsIHhsaW5rX2hyZWYpO1xuICB9XG5cbiAgc2V0VGltZW91dChIVC5tb2JpZnksIDEwMDApO1xuXG4gIHZhciB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaCA9ICQoXCIjc2lkZWJhciAuc2lkZWJhci10b2dnbGUtYnV0dG9uXCIpLm91dGVySGVpZ2h0KCkgfHwgNDA7XG4gICAgdmFyIHRvcCA9ICggJChcImhlYWRlclwiKS5oZWlnaHQoKSArIGggKSAqIDEuMDU7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXRvb2xiYXItaG9yaXpvbnRhbC10b3AnLCB0b3AgKyAncHgnKTtcbiAgfVxuICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSk7XG4gIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSgpO1xuXG4gICQoXCJodG1sXCIpLmdldCgwKS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2lkZWJhci1leHBhbmRlZCcsIGZhbHNlKTtcblxufSlcbiIsImlmICh0eXBlb2YgT2JqZWN0LmFzc2lnbiAhPSAnZnVuY3Rpb24nKSB7XG4gIC8vIE11c3QgYmUgd3JpdGFibGU6IHRydWUsIGVudW1lcmFibGU6IGZhbHNlLCBjb25maWd1cmFibGU6IHRydWVcbiAgT2JqZWN0LmRlZmluZVByb3BlcnR5KE9iamVjdCwgXCJhc3NpZ25cIiwge1xuICAgIHZhbHVlOiBmdW5jdGlvbiBhc3NpZ24odGFyZ2V0LCB2YXJBcmdzKSB7IC8vIC5sZW5ndGggb2YgZnVuY3Rpb24gaXMgMlxuICAgICAgJ3VzZSBzdHJpY3QnO1xuICAgICAgaWYgKHRhcmdldCA9PSBudWxsKSB7IC8vIFR5cGVFcnJvciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICB0aHJvdyBuZXcgVHlwZUVycm9yKCdDYW5ub3QgY29udmVydCB1bmRlZmluZWQgb3IgbnVsbCB0byBvYmplY3QnKTtcbiAgICAgIH1cblxuICAgICAgdmFyIHRvID0gT2JqZWN0KHRhcmdldCk7XG5cbiAgICAgIGZvciAodmFyIGluZGV4ID0gMTsgaW5kZXggPCBhcmd1bWVudHMubGVuZ3RoOyBpbmRleCsrKSB7XG4gICAgICAgIHZhciBuZXh0U291cmNlID0gYXJndW1lbnRzW2luZGV4XTtcblxuICAgICAgICBpZiAobmV4dFNvdXJjZSAhPSBudWxsKSB7IC8vIFNraXAgb3ZlciBpZiB1bmRlZmluZWQgb3IgbnVsbFxuICAgICAgICAgIGZvciAodmFyIG5leHRLZXkgaW4gbmV4dFNvdXJjZSkge1xuICAgICAgICAgICAgLy8gQXZvaWQgYnVncyB3aGVuIGhhc093blByb3BlcnR5IGlzIHNoYWRvd2VkXG4gICAgICAgICAgICBpZiAoT2JqZWN0LnByb3RvdHlwZS5oYXNPd25Qcm9wZXJ0eS5jYWxsKG5leHRTb3VyY2UsIG5leHRLZXkpKSB7XG4gICAgICAgICAgICAgIHRvW25leHRLZXldID0gbmV4dFNvdXJjZVtuZXh0S2V5XTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICAgIHJldHVybiB0bztcbiAgICB9LFxuICAgIHdyaXRhYmxlOiB0cnVlLFxuICAgIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuICB9KTtcbn1cblxuLy8gZnJvbTogaHR0cHM6Ly9naXRodWIuY29tL2pzZXJ6L2pzX3BpZWNlL2Jsb2IvbWFzdGVyL0RPTS9DaGlsZE5vZGUvYWZ0ZXIoKS9hZnRlcigpLm1kXG4oZnVuY3Rpb24gKGFycikge1xuICBhcnIuZm9yRWFjaChmdW5jdGlvbiAoaXRlbSkge1xuICAgIGlmIChpdGVtLmhhc093blByb3BlcnR5KCdhZnRlcicpKSB7XG4gICAgICByZXR1cm47XG4gICAgfVxuICAgIE9iamVjdC5kZWZpbmVQcm9wZXJ0eShpdGVtLCAnYWZ0ZXInLCB7XG4gICAgICBjb25maWd1cmFibGU6IHRydWUsXG4gICAgICBlbnVtZXJhYmxlOiB0cnVlLFxuICAgICAgd3JpdGFibGU6IHRydWUsXG4gICAgICB2YWx1ZTogZnVuY3Rpb24gYWZ0ZXIoKSB7XG4gICAgICAgIHZhciBhcmdBcnIgPSBBcnJheS5wcm90b3R5cGUuc2xpY2UuY2FsbChhcmd1bWVudHMpLFxuICAgICAgICAgIGRvY0ZyYWcgPSBkb2N1bWVudC5jcmVhdGVEb2N1bWVudEZyYWdtZW50KCk7XG4gICAgICAgIFxuICAgICAgICBhcmdBcnIuZm9yRWFjaChmdW5jdGlvbiAoYXJnSXRlbSkge1xuICAgICAgICAgIHZhciBpc05vZGUgPSBhcmdJdGVtIGluc3RhbmNlb2YgTm9kZTtcbiAgICAgICAgICBkb2NGcmFnLmFwcGVuZENoaWxkKGlzTm9kZSA/IGFyZ0l0ZW0gOiBkb2N1bWVudC5jcmVhdGVUZXh0Tm9kZShTdHJpbmcoYXJnSXRlbSkpKTtcbiAgICAgICAgfSk7XG4gICAgICAgIFxuICAgICAgICB0aGlzLnBhcmVudE5vZGUuaW5zZXJ0QmVmb3JlKGRvY0ZyYWcsIHRoaXMubmV4dFNpYmxpbmcpO1xuICAgICAgfVxuICAgIH0pO1xuICB9KTtcbn0pKFtFbGVtZW50LnByb3RvdHlwZSwgQ2hhcmFjdGVyRGF0YS5wcm90b3R5cGUsIERvY3VtZW50VHlwZS5wcm90b3R5cGVdKTtcblxuZnVuY3Rpb24gUmVwbGFjZVdpdGhQb2x5ZmlsbCgpIHtcbiAgJ3VzZS1zdHJpY3QnOyAvLyBGb3Igc2FmYXJpLCBhbmQgSUUgPiAxMFxuICB2YXIgcGFyZW50ID0gdGhpcy5wYXJlbnROb2RlLCBpID0gYXJndW1lbnRzLmxlbmd0aCwgY3VycmVudE5vZGU7XG4gIGlmICghcGFyZW50KSByZXR1cm47XG4gIGlmICghaSkgLy8gaWYgdGhlcmUgYXJlIG5vIGFyZ3VtZW50c1xuICAgIHBhcmVudC5yZW1vdmVDaGlsZCh0aGlzKTtcbiAgd2hpbGUgKGktLSkgeyAvLyBpLS0gZGVjcmVtZW50cyBpIGFuZCByZXR1cm5zIHRoZSB2YWx1ZSBvZiBpIGJlZm9yZSB0aGUgZGVjcmVtZW50XG4gICAgY3VycmVudE5vZGUgPSBhcmd1bWVudHNbaV07XG4gICAgaWYgKHR5cGVvZiBjdXJyZW50Tm9kZSAhPT0gJ29iamVjdCcpe1xuICAgICAgY3VycmVudE5vZGUgPSB0aGlzLm93bmVyRG9jdW1lbnQuY3JlYXRlVGV4dE5vZGUoY3VycmVudE5vZGUpO1xuICAgIH0gZWxzZSBpZiAoY3VycmVudE5vZGUucGFyZW50Tm9kZSl7XG4gICAgICBjdXJyZW50Tm9kZS5wYXJlbnROb2RlLnJlbW92ZUNoaWxkKGN1cnJlbnROb2RlKTtcbiAgICB9XG4gICAgLy8gdGhlIHZhbHVlIG9mIFwiaVwiIGJlbG93IGlzIGFmdGVyIHRoZSBkZWNyZW1lbnRcbiAgICBpZiAoIWkpIC8vIGlmIGN1cnJlbnROb2RlIGlzIHRoZSBmaXJzdCBhcmd1bWVudCAoY3VycmVudE5vZGUgPT09IGFyZ3VtZW50c1swXSlcbiAgICAgIHBhcmVudC5yZXBsYWNlQ2hpbGQoY3VycmVudE5vZGUsIHRoaXMpO1xuICAgIGVsc2UgLy8gaWYgY3VycmVudE5vZGUgaXNuJ3QgdGhlIGZpcnN0XG4gICAgICBwYXJlbnQuaW5zZXJ0QmVmb3JlKGN1cnJlbnROb2RlLCB0aGlzLnByZXZpb3VzU2libGluZyk7XG4gIH1cbn1cbmlmICghRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGgpXG4gICAgRWxlbWVudC5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuaWYgKCFDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aClcbiAgICBDaGFyYWN0ZXJEYXRhLnByb3RvdHlwZS5yZXBsYWNlV2l0aCA9IFJlcGxhY2VXaXRoUG9seWZpbGw7XG5pZiAoIURvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGgpIFxuICAgIERvY3VtZW50VHlwZS5wcm90b3R5cGUucmVwbGFjZVdpdGggPSBSZXBsYWNlV2l0aFBvbHlmaWxsO1xuXG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJGZvcm0gPSAkKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKTtcblxuICB2YXIgJGJvZHkgPSAkKFwiYm9keVwiKTtcblxuICAkKHdpbmRvdykub24oJ3VuZG8tbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICQoXCJidXR0b24uYnRuLWxvYWRpbmdcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpLnJlbW92ZUNsYXNzKFwiYnRuLWxvYWRpbmdcIik7XG4gIH0pXG5cbiAgJChcImJvZHlcIikub24oJ3N1Ym1pdCcsICdmb3JtLmZvcm0tc2VhcmNoLXZvbHVtZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgSFQuYmVmb3JlVW5sb2FkVGltZW91dCA9IDE1MDAwO1xuICAgIHZhciAkZm9ybV8gPSAkKHRoaXMpO1xuXG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybV8uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybV8uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkKHdpbmRvdykudHJpZ2dlcigndW5kby1sb2FkaW5nJyk7XG4gICAgfSlcblxuICAgIGlmICggSFQucmVhZGVyICYmIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3IgKSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgcmV0dXJuIEhULnJlYWRlci5jb250cm9scy5zZWFyY2hpbmF0b3Iuc3VibWl0KCRmb3JtXy5nZXQoMCkpO1xuICAgIH1cblxuICAgIC8vIGRlZmF1bHQgcHJvY2Vzc2luZ1xuICB9KVxuXG4gICQoXCIjYWN0aW9uLXN0YXJ0LWp1bXBcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeiA9IHBhcnNlSW50KCQodGhpcykuZGF0YSgnc3onKSwgMTApO1xuICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KCQodGhpcykudmFsKCksIDEwKTtcbiAgICB2YXIgc3RhcnQgPSAoIHZhbHVlIC0gMSApICogc3ogKyAxO1xuICAgIHZhciAkZm9ybV8gPSAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3RhcnQnIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3RhcnR9XCIgLz5gKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3onIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3p9XCIgLz5gKTtcbiAgICAkZm9ybV8uc3VibWl0KCk7XG4gIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcjdmVyc2lvbkljb24nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
