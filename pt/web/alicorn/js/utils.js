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
    $.get(href);
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

    $("#PTaddItemBtn").click(function (e) {
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
        $("a[data-toggle*=download]").addClass("interactive").click(function (e) {
            e.preventDefault();
            bootbox.hideAll();
            if ($(this).attr("rel") == 'allow') {
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

    $("#embedHtml").click(function (e) {
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
      $navigator.get(0).style.setProperty('--height', "-" + $navigator.outerHeight() * 0.90 + "px");
      var $expando = $navigator.find(".action-expando");
      $expando.on('click', function () {
        document.documentElement.dataset.expanded = !(document.documentElement.dataset.expanded == 'true');
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
"use strict";

head.ready(function () {
  var $form = $(".form-search-volume");
  HT.$search_form = null;

  var $body = $("body");

  var section_view = function section_view(view) {
    // $body.get(0).dataset.sectionView = view;
    document.documentElement.dataset.sidebarExpanded = false;
    document.documentElement.dataset.sectionView = view;
    $(".sidebar-container").find("button[aria-expanded]").attr('aria-expanded', false);
  };

  if ($("#toolbar-vertical").length) {
    // $iframe.on("load", function() {
    //   $(window).trigger('undo-loading');
    //   $iframe.show();

    //   var $check = $("#mdpBackToResults");
    //   if ( ! $check.length ) {
    //     var href = $iframe.get(0).contentWindow.location.href;
    //     $check = $(`<div id="mdpBackToResults"></div>`);
    //     $(".bibLinks").before($check);
    //     $("#mdpBackToResults").append(`<p><a data-toggle="tracking" data-tracking-category="PT" data-tracking-action="PT Back to In Item Results" href="${href}">&#171; Back to "Search in this text" results</a></p>`);
    //   }

    //   // actually this *is* the current URL. Hmm.
    //   HT.params.q1 = $iframe.get(0).contentWindow.HT.params.q1;
    //   $("input[name=q1]").val(HT.params.q1);

    //   $(this).contents().on('click', '.back-to-beginning-link a', function(event) {
    //     // just close this iframe
    //     event.preventDefault();
    //     event.stopPropagation();
    //     $iframe.hide();
    //   })

    //   $(this).contents().on('click', 'article.result a', function(event) {
    //     event.preventDefault();
    //     var $link = $(event.target).closest("a");
    //     var href = $link.attr('href');

    //     var fragment = href.split('#');
    //     var cfi = `epubcfi(${fragment.pop()})`;
    //     setTimeout(() => {

    //       $iframe.hide();
    //       HT.reader.emit('updateHighlights');
    //       HT.reader._updateHistoryUrl({});

    //       HT.reader.view.rendition.display(cfi).then(() => {
    //         console.log("AHOY gotoPage", cfi, HT.reader.view.currentLocation());
    //       });
    //     }, 100);
    //   })
    // })

    $("body").on('click', '.back-to-beginning-link a', function (event) {
      // just close this iframe
      event.preventDefault();
      event.stopPropagation();
      section_view('reader');
    });

    $("body").on('click', 'article.result a', function (event) {
      event.preventDefault();
      var $link = $(event.target).closest("a");
      var href = $link.attr('href');

      var fragment = href.split('#');
      var cfi = "epubcfi(" + fragment.pop() + ")";

      var highlight = $link.data('highlight');
      sessionStorage.setItem('highlight', JSON.stringify(highlight));
      section_view('reader');

      setTimeout(function () {

        HT.$search_form.scrollTop(0);

        HT.reader.emit('updateHighlights');
        HT.reader._updateHistoryUrl({});

        setTimeout(function () {
          console.log("AHOY RESULTS gotoPage CLICK X", cfi);
          HT.reader.view.rendition.display(cfi).then(function () {
            console.log("AHOY RESULTS gotoPage DONE X", cfi, HT.reader.view.currentLocation());
          });
        }, 100);
      }, 100);
    });

    $("body").on('click', '#mdpBackToResults a[data-tracking-action="PT Back to In Item Results"]', function (event) {
      event.preventDefault();
      event.stopPropagation();

      section_view('search-results');

      return false;
    });
  }

  $(window).on('undo-loading', function () {
    $("button.btn-loading").removeAttr("disabled").removeClass("btn-loading");
  });

  // $form.submit(function(event) {
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

    if ($form_.data('q') == $.trim($input.val()) && HT.$search_form) {
      // same query, just show the dang iframe
      $(window).trigger('undo-loading');
      event.preventDefault();
      section_view('search-results');
      // HT.$reader.hide();
      // HT.$search_form.show();
      return false;
    }

    $form_.data('q', $.trim($input.val()));
    HT.params.q1 = $form_.data('q');
    $("input[name='q1']").val(HT.params.q1);

    $(window).on('unload', function () {
      // $submit.removeAttr('disabled');
      $(window).trigger('undo-loading');
    });

    // return true;
    event.preventDefault();

    $.ajax({
      url: '/cgi/pt/search',
      method: 'GET',
      data: $form_.serialize()
    }).done(function (response) {
      $(window).trigger('undo-loading');
      var $response = $(response);

      var $results = $response.find("main");
      $results.attr('id', 'search-results');
      HT.$reader = $("main#main");
      if (HT.$search_form) {
        HT.$search_form.replaceWith($results);
        HT.$search_form = $("main#search-results");
      } else {
        HT.$search_form = $results;
        HT.$reader.after(HT.$search_form);
      }

      // var $results = $response.find("section#section");
      // HT.$reader = $("section#section");
      // if ( HT.$search_form ) {
      //   HT.$search_form.replaceWith($results);
      //   HT.$search_form = $("section.search-results-container");
      // } else {
      //   HT.$search_form = $results;
      //   HT.$reader.after(HT.$search_form);
      // }

      section_view('search-results');

      // this is why?
      var $btn = HT.$search_form.find(".sidebar-toggle-button");
      if ($btn.height() == 0 && ($("html").is(".ios") || $("html").is(".safari"))) {
        $btn.addClass("stupid-hack");
      }
    });
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

  // handling EPUB-related links
  // --- renable this
  // $("body").on('click', "[data-highlight]", function() {
  //   var highlight = $(this).data('highlight');
  //   sessionStorage.setItem('highlight', JSON.stringify(highlight));
  // })

  // setInterval(() => {
  //   var main = document.querySelector('main');
  //   console.log("AHOY MAIN", main.offsetHeight, main.scrollTop);
  // }, 10);
});
"use strict";

head.ready(function () {

    $("#versionIcon").click(function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsImFuYWx5dGljcyIsImxvZ0FjdGlvbiIsImhyZWYiLCJ0cmlnZ2VyIiwiZGVsaW0iLCJnZXQiLCJvbiIsImV2ZW50Iiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY29va2llIiwianNvbiIsImN1cnJpZCIsImlkcyIsImlkIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZXRUaW1lb3V0Iiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm1lc3NhZ2UiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInRleHQiLCJzaG93IiwidXBkYXRlX3N0YXR1cyIsImRpc3BsYXlfaW5mbyIsImhpZGVfZXJyb3IiLCJoaWRlIiwiaGlkZV9pbmZvIiwiZ2V0X3VybCIsInBhdGhuYW1lIiwicGFyc2VfbGluZSIsInJldHZhbCIsInRtcCIsImt2IiwiZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhIiwiYXJncyIsIm9wdGlvbnMiLCJleHRlbmQiLCJjcmVhdGluZyIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiY2FsbGJhY2siLCJjaGVja1ZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJzdWJtaXRfcG9zdCIsImVhY2giLCIkdGhpcyIsIiRjb3VudCIsImxpbWl0IiwiYmluZCIsInBhcmFtcyIsInBhZ2UiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0Iiwic3JjIiwiaXRlbV90aXRsZSIsInRvdGFsIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsInN0YXR1cyIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJkb3dubG9hZCIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJfbGFzdE1lc3NhZ2UiLCJfbGFzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiaW5uZXJUZXh0IiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0Iiwic2VhcmNodHlwZSIsImdldENvbnRlbnRHcm91cERhdGEiLCJjb250ZW50X2dyb3VwIiwiX3NpbXBsaWZ5UGFnZUhyZWYiLCJuZXdfaHJlZiIsInFzIiwiZ2V0UGFnZUhyZWYiLCIkbWVudSIsIiR0cmlnZ2VyIiwiJGhlYWRlciIsIiRuYXZpZ2F0b3IiLCJtb2JpZnkiLCJzdHlsZSIsInNldFByb3BlcnR5Iiwib3V0ZXJIZWlnaHQiLCIkZXhwYW5kbyIsImRvY3VtZW50RWxlbWVudCIsImRhdGFzZXQiLCJleHBhbmRlZCIsInVpIiwiJHNpZGViYXIiLCJyZXF1ZXN0RnVsbFNjcmVlbiIsInV0aWxzIiwicGFyZW50cyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJ1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkiLCJ0b3AiLCJoZWlnaHQiLCIkc2VhcmNoX2Zvcm0iLCIkYm9keSIsInNlY3Rpb25fdmlldyIsInNlY3Rpb25WaWV3IiwiY2ZpIiwicG9wIiwiaGlnaGxpZ2h0Iiwic2Vzc2lvblN0b3JhZ2UiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsInNjcm9sbFRvcCIsImVtaXQiLCJfdXBkYXRlSGlzdG9yeVVybCIsInJlbmRpdGlvbiIsImRpc3BsYXkiLCJ0aGVuIiwiY3VycmVudExvY2F0aW9uIiwicmVtb3ZlQXR0ciIsImJlZm9yZVVubG9hZFRpbWVvdXQiLCIkZm9ybV8iLCIkc3VibWl0IiwicTEiLCJzZXJpYWxpemUiLCJyZXNwb25zZSIsIiRyZXNwb25zZSIsIiRyZXN1bHRzIiwiJHJlYWRlciIsInJlcGxhY2VXaXRoIiwiYWZ0ZXIiLCIkYnRuIiwic3oiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7OztBQU9BLENBQUMsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ25CLEtBQUksT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJQUFnQ0EsT0FBT0MsR0FBM0MsRUFBZ0Q7QUFDL0M7QUFDQSxNQUFLLE9BQU9DLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENGLFVBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUJELE9BQW5CO0FBQ0EsR0FGRCxNQUVPO0FBQ05DLFVBQU8sRUFBUCxFQUFXRCxPQUFYO0FBQ0E7QUFDRCxFQVBELE1BT087QUFDTjtBQUNBLE1BQUssT0FBT0cs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LEVBQTdCLENBQVQ7QUFDQSxRQUFJeVMsUUFBUW5ELFNBQVM3VSxFQUFFLElBQUYsRUFBUWtELEdBQVIsRUFBVCxFQUF3QixFQUF4QixDQUFaO0FBQ0EsUUFBSTROLFFBQVEsQ0FBRWtILFFBQVEsQ0FBVixJQUFnQmlFLEVBQWhCLEdBQXFCLENBQWpDO0FBQ0EsUUFBSVgsU0FBU3RiLEVBQUUscUJBQUYsQ0FBYjtBQUNBc2IsV0FBTzlMLE1BQVAsa0RBQTBEc0IsS0FBMUQ7QUFDQXdLLFdBQU85TCxNQUFQLCtDQUF1RHlNLEVBQXZEO0FBQ0FYLFdBQU9uRCxNQUFQO0FBQ0QsR0FSRDs7QUFVQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FBRUE7QUFDQTtBQUNBO0FBQ0E7QUFFRCxDQWxORDs7O0FDQUFyUyxLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLGNBQUYsRUFBa0JnUSxLQUFsQixDQUF3QixVQUFTMUwsQ0FBVCxFQUFZO0FBQ2hDQSxVQUFFMkwsY0FBRjtBQUNBN0ksZ0JBQVFpSyxLQUFSLENBQWMsb1lBQWQ7QUFDSCxLQUhEO0FBS0gsQ0FQRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBKUXVlcnkgVVJMIFBhcnNlciBwbHVnaW4sIHYyLjIuMVxuICogRGV2ZWxvcGVkIGFuZCBtYWludGFuaW5lZCBieSBNYXJrIFBlcmtpbnMsIG1hcmtAYWxsbWFya2VkdXAuY29tXG4gKiBTb3VyY2UgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyXG4gKiBMaWNlbnNlZCB1bmRlciBhbiBNSVQtc3R5bGUgbGljZW5zZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlci9ibG9iL21hc3Rlci9MSUNFTlNFIGZvciBkZXRhaWxzLlxuICovIFxuXG47KGZ1bmN0aW9uKGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRCBhdmFpbGFibGU7IHVzZSBhbm9ueW1vdXMgbW9kdWxlXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBObyBBTUQgYXZhaWxhYmxlOyBtdXRhdGUgZ2xvYmFsIHZhcnNcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZmFjdG9yeShqUXVlcnkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmYWN0b3J5KCk7XG5cdFx0fVxuXHR9XG59KShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblx0XG5cdHZhciB0YWcyYXR0ciA9IHtcblx0XHRcdGEgICAgICAgOiAnaHJlZicsXG5cdFx0XHRpbWcgICAgIDogJ3NyYycsXG5cdFx0XHRmb3JtICAgIDogJ2FjdGlvbicsXG5cdFx0XHRiYXNlICAgIDogJ2hyZWYnLFxuXHRcdFx0c2NyaXB0ICA6ICdzcmMnLFxuXHRcdFx0aWZyYW1lICA6ICdzcmMnLFxuXHRcdFx0bGluayAgICA6ICdocmVmJ1xuXHRcdH0sXG5cdFx0XG5cdFx0a2V5ID0gWydzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnZnJhZ21lbnQnXSwgLy8ga2V5cyBhdmFpbGFibGUgdG8gcXVlcnlcblx0XHRcblx0XHRhbGlhc2VzID0geyAnYW5jaG9yJyA6ICdmcmFnbWVudCcgfSwgLy8gYWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHlcblx0XHRcblx0XHRwYXJzZXIgPSB7XG5cdFx0XHRzdHJpY3QgOiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8sICAvL2xlc3MgaW50dWl0aXZlLCBtb3JlIGFjY3VyYXRlIHRvIHRoZSBzcGVjc1xuXHRcdFx0bG9vc2UgOiAgL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8gLy8gbW9yZSBpbnR1aXRpdmUsIGZhaWxzIG9uIHJlbGF0aXZlIHBhdGhzIGFuZCBkZXZpYXRlcyBmcm9tIHNwZWNzXG5cdFx0fSxcblx0XHRcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0XG5cdFx0aXNpbnQgPSAvXlswLTldKyQvO1xuXHRcblx0ZnVuY3Rpb24gcGFyc2VVcmkoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHR2YXIgc3RyID0gZGVjb2RlVVJJKCB1cmwgKSxcblx0XHRyZXMgICA9IHBhcnNlclsgc3RyaWN0TW9kZSB8fCBmYWxzZSA/ICdzdHJpY3QnIDogJ2xvb3NlJyBdLmV4ZWMoIHN0ciApLFxuXHRcdHVyaSA9IHsgYXR0ciA6IHt9LCBwYXJhbSA6IHt9LCBzZWcgOiB7fSB9LFxuXHRcdGkgICA9IDE0O1xuXHRcdFxuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0dXJpLmF0dHJbIGtleVtpXSBdID0gcmVzW2ldIHx8ICcnO1xuXHRcdH1cblx0XHRcblx0XHQvLyBidWlsZCBxdWVyeSBhbmQgZnJhZ21lbnQgcGFyYW1ldGVyc1x0XHRcblx0XHR1cmkucGFyYW1bJ3F1ZXJ5J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsncXVlcnknXSk7XG5cdFx0dXJpLnBhcmFtWydmcmFnbWVudCddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ2ZyYWdtZW50J10pO1xuXHRcdFxuXHRcdC8vIHNwbGl0IHBhdGggYW5kIGZyYWdlbWVudCBpbnRvIHNlZ21lbnRzXHRcdFxuXHRcdHVyaS5zZWdbJ3BhdGgnXSA9IHVyaS5hdHRyLnBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTsgICAgIFxuXHRcdHVyaS5zZWdbJ2ZyYWdtZW50J10gPSB1cmkuYXR0ci5mcmFnbWVudC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpO1xuXHRcdFxuXHRcdC8vIGNvbXBpbGUgYSAnYmFzZScgZG9tYWluIGF0dHJpYnV0ZSAgICAgICAgXG5cdFx0dXJpLmF0dHJbJ2Jhc2UnXSA9IHVyaS5hdHRyLmhvc3QgPyAodXJpLmF0dHIucHJvdG9jb2wgPyAgdXJpLmF0dHIucHJvdG9jb2wrJzovLycrdXJpLmF0dHIuaG9zdCA6IHVyaS5hdHRyLmhvc3QpICsgKHVyaS5hdHRyLnBvcnQgPyAnOicrdXJpLmF0dHIucG9ydCA6ICcnKSA6ICcnOyAgICAgIFxuXHRcdCAgXG5cdFx0cmV0dXJuIHVyaTtcblx0fTtcblx0XG5cdGZ1bmN0aW9uIGdldEF0dHJOYW1lKCBlbG0gKSB7XG5cdFx0dmFyIHRuID0gZWxtLnRhZ05hbWU7XG5cdFx0aWYgKCB0eXBlb2YgdG4gIT09ICd1bmRlZmluZWQnICkgcmV0dXJuIHRhZzJhdHRyW3RuLnRvTG93ZXJDYXNlKCldO1xuXHRcdHJldHVybiB0bjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuXHRcdGlmIChwYXJlbnRba2V5XS5sZW5ndGggPT0gMCkgcmV0dXJuIHBhcmVudFtrZXldID0ge307XG5cdFx0dmFyIHQgPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHBhcmVudFtrZXldKSB0W2ldID0gcGFyZW50W2tleV1baV07XG5cdFx0cGFyZW50W2tleV0gPSB0O1xuXHRcdHJldHVybiB0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHR2YXIgcGFydCA9IHBhcnRzLnNoaWZ0KCk7XG5cdFx0aWYgKCFwYXJ0KSB7XG5cdFx0XHRpZiAoaXNBcnJheShwYXJlbnRba2V5XSkpIHtcblx0XHRcdFx0cGFyZW50W2tleV0ucHVzaCh2YWwpO1xuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2UgaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgb2JqID0gcGFyZW50W2tleV0gPSBwYXJlbnRba2V5XSB8fCBbXTtcblx0XHRcdGlmICgnXScgPT0gcGFydCkge1xuXHRcdFx0XHRpZiAoaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdFx0aWYgKCcnICE9IHZhbCkgb2JqLnB1c2godmFsKTtcblx0XHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqKSB7XG5cdFx0XHRcdFx0b2JqW2tleXMob2JqKS5sZW5ndGhdID0gdmFsO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9iaiA9IHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKH5wYXJ0LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0XHRwYXJ0ID0gcGFydC5zdWJzdHIoMCwgcGFydC5sZW5ndGggLSAxKTtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHRcdC8vIGtleVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbWVyZ2UocGFyZW50LCBrZXksIHZhbCkge1xuXHRcdGlmICh+a2V5LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0dmFyIHBhcnRzID0ga2V5LnNwbGl0KCdbJyksXG5cdFx0XHRsZW4gPSBwYXJ0cy5sZW5ndGgsXG5cdFx0XHRsYXN0ID0gbGVuIC0gMTtcblx0XHRcdHBhcnNlKHBhcnRzLCBwYXJlbnQsICdiYXNlJywgdmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFpc2ludC50ZXN0KGtleSkgJiYgaXNBcnJheShwYXJlbnQuYmFzZSkpIHtcblx0XHRcdFx0dmFyIHQgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgayBpbiBwYXJlbnQuYmFzZSkgdFtrXSA9IHBhcmVudC5iYXNlW2tdO1xuXHRcdFx0XHRwYXJlbnQuYmFzZSA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRzZXQocGFyZW50LmJhc2UsIGtleSwgdmFsKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuXHRcdHJldHVybiByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQoLyZ8Oy8pLCBmdW5jdGlvbihyZXQsIHBhaXIpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBhaXIgPSBkZWNvZGVVUklDb21wb25lbnQocGFpci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Ly8gaWdub3JlXG5cdFx0XHR9XG5cdFx0XHR2YXIgZXFsID0gcGFpci5pbmRleE9mKCc9JyksXG5cdFx0XHRcdGJyYWNlID0gbGFzdEJyYWNlSW5LZXkocGFpciksXG5cdFx0XHRcdGtleSA9IHBhaXIuc3Vic3RyKDAsIGJyYWNlIHx8IGVxbCksXG5cdFx0XHRcdHZhbCA9IHBhaXIuc3Vic3RyKGJyYWNlIHx8IGVxbCwgcGFpci5sZW5ndGgpLFxuXHRcdFx0XHR2YWwgPSB2YWwuc3Vic3RyKHZhbC5pbmRleE9mKCc9JykgKyAxLCB2YWwubGVuZ3RoKTtcblxuXHRcdFx0aWYgKCcnID09IGtleSkga2V5ID0gcGFpciwgdmFsID0gJyc7XG5cblx0XHRcdHJldHVybiBtZXJnZShyZXQsIGtleSwgdmFsKTtcblx0XHR9LCB7IGJhc2U6IHt9IH0pLmJhc2U7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG5cdFx0dmFyIHYgPSBvYmpba2V5XTtcblx0XHRpZiAodW5kZWZpbmVkID09PSB2KSB7XG5cdFx0XHRvYmpba2V5XSA9IHZhbDtcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkodikpIHtcblx0XHRcdHYucHVzaCh2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvYmpba2V5XSA9IFt2LCB2YWxdO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gbGFzdEJyYWNlSW5LZXkoc3RyKSB7XG5cdFx0dmFyIGxlbiA9IHN0ci5sZW5ndGgsXG5cdFx0XHQgYnJhY2UsIGM7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHRcdFx0YyA9IHN0cltpXTtcblx0XHRcdGlmICgnXScgPT0gYykgYnJhY2UgPSBmYWxzZTtcblx0XHRcdGlmICgnWycgPT0gYykgYnJhY2UgPSB0cnVlO1xuXHRcdFx0aWYgKCc9JyA9PSBjICYmICFicmFjZSkgcmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiByZWR1Y2Uob2JqLCBhY2N1bXVsYXRvcil7XG5cdFx0dmFyIGkgPSAwLFxuXHRcdFx0bCA9IG9iai5sZW5ndGggPj4gMCxcblx0XHRcdGN1cnIgPSBhcmd1bWVudHNbMl07XG5cdFx0d2hpbGUgKGkgPCBsKSB7XG5cdFx0XHRpZiAoaSBpbiBvYmopIGN1cnIgPSBhY2N1bXVsYXRvci5jYWxsKHVuZGVmaW5lZCwgY3Vyciwgb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0KytpO1xuXHRcdH1cblx0XHRyZXR1cm4gY3Vycjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gaXNBcnJheSh2QXJnKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2QXJnKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBrZXlzKG9iaikge1xuXHRcdHZhciBrZXlzID0gW107XG5cdFx0Zm9yICggcHJvcCBpbiBvYmogKSB7XG5cdFx0XHRpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSApIGtleXMucHVzaChwcm9wKTtcblx0XHR9XG5cdFx0cmV0dXJuIGtleXM7XG5cdH1cblx0XHRcblx0ZnVuY3Rpb24gcHVybCggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB1cmwgPT09IHRydWUgKSB7XG5cdFx0XHRzdHJpY3RNb2RlID0gdHJ1ZTtcblx0XHRcdHVybCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0c3RyaWN0TW9kZSA9IHN0cmljdE1vZGUgfHwgZmFsc2U7XG5cdFx0dXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuXHRcblx0XHRyZXR1cm4ge1xuXHRcdFx0XG5cdFx0XHRkYXRhIDogcGFyc2VVcmkodXJsLCBzdHJpY3RNb2RlKSxcblx0XHRcdFxuXHRcdFx0Ly8gZ2V0IHZhcmlvdXMgYXR0cmlidXRlcyBmcm9tIHRoZSBVUklcblx0XHRcdGF0dHIgOiBmdW5jdGlvbiggYXR0ciApIHtcblx0XHRcdFx0YXR0ciA9IGFsaWFzZXNbYXR0cl0gfHwgYXR0cjtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBhdHRyICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5hdHRyW2F0dHJdIDogdGhpcy5kYXRhLmF0dHI7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcblx0XHRcdHBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5xdWVyeVtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0ucXVlcnk7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgcGFyYW1ldGVyc1xuXHRcdFx0ZnBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudFtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnQ7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcGF0aCBzZWdtZW50c1xuXHRcdFx0c2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5wYXRoLmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGhbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgc2VnbWVudHNcblx0XHRcdGZzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudDsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLmZyYWdtZW50Lmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50W3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHQgICAgXHRcblx0XHR9O1xuXHRcblx0fTtcblx0XG5cdGlmICggdHlwZW9mICQgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFxuXHRcdCQuZm4udXJsID0gZnVuY3Rpb24oIHN0cmljdE1vZGUgKSB7XG5cdFx0XHR2YXIgdXJsID0gJyc7XG5cdFx0XHRpZiAoIHRoaXMubGVuZ3RoICkge1xuXHRcdFx0XHR1cmwgPSAkKHRoaXMpLmF0dHIoIGdldEF0dHJOYW1lKHRoaXNbMF0pICkgfHwgJyc7XG5cdFx0XHR9ICAgIFxuXHRcdFx0cmV0dXJuIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApO1xuXHRcdH07XG5cdFx0XG5cdFx0JC51cmwgPSBwdXJsO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5wdXJsID0gcHVybDtcblx0fVxuXG59KTtcblxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIC8vIHZhciAkc3RhdHVzID0gJChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgLy8gdmFyIGxhc3RNZXNzYWdlOyB2YXIgbGFzdFRpbWVyO1xuICAvLyBIVC51cGRhdGVfc3RhdHVzID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAvLyAgICAgaWYgKCBsYXN0TWVzc2FnZSAhPSBtZXNzYWdlICkge1xuICAvLyAgICAgICBpZiAoIGxhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KGxhc3RUaW1lcik7IGxhc3RUaW1lciA9IG51bGw7IH1cblxuICAvLyAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgLy8gICAgICAgICAkc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gIC8vICAgICAgICAgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0gc3RhdHVzOlwiLCBtZXNzYWdlKTtcbiAgLy8gICAgICAgfSwgNTApO1xuICAvLyAgICAgICBsYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgLy8gICAgICAgICAkc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgLy8gICAgICAgfSwgNTAwKTtcblxuICAvLyAgICAgfVxuICAvLyB9XG5cbiAgSFQuYW5hbHl0aWNzID0gSFQuYW5hbHl0aWNzIHx8IHt9O1xuICBIVC5hbmFseXRpY3MubG9nQWN0aW9uID0gZnVuY3Rpb24oaHJlZiwgdHJpZ2dlcikge1xuICAgIGlmICggaHJlZiA9PT0gdW5kZWZpbmVkICkgeyBocmVmID0gbG9jYXRpb24uaHJlZiA7IH1cbiAgICB2YXIgZGVsaW0gPSBocmVmLmluZGV4T2YoJzsnKSA+IC0xID8gJzsnIDogJyYnO1xuICAgIGlmICggdHJpZ2dlciA9PSBudWxsICkgeyB0cmlnZ2VyID0gJy0nOyB9XG4gICAgaHJlZiArPSBkZWxpbSArICdhPScgKyB0cmlnZ2VyO1xuICAgICQuZ2V0KGhyZWYpO1xuICB9XG5cblxuICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnYVtkYXRhLXRyYWNraW5nLWNhdGVnb3J5PVwib3V0TGlua3NcIl0nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vIHZhciB0cmlnZ2VyID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1hY3Rpb24nKTtcbiAgICAvLyB2YXIgbGFiZWwgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWxhYmVsJyk7XG4gICAgLy8gaWYgKCBsYWJlbCApIHsgdHJpZ2dlciArPSAnOicgKyBsYWJlbDsgfVxuICAgIHZhciB0cmlnZ2VyID0gJ291dCcgKyAkKHRoaXMpLmF0dHIoJ2hyZWYnKTtcbiAgICBIVC5hbmFseXRpY3MubG9nQWN0aW9uKHVuZGVmaW5lZCwgdHJpZ2dlcik7XG4gIH0pXG5cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICBpZiAoJCgnI2FjY2Vzc0Jhbm5lcklEJykubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN1cHByZXNzID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdzdXBhY2NiYW4nKTtcbiAgICAgIGlmIChzdXBwcmVzcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWJ1ZyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaHRkZXYnKTtcbiAgICAgIHZhciBpZGhhc2ggPSAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgdW5kZWZpbmVkLCB7anNvbiA6IHRydWV9KTtcbiAgICAgIHZhciB1cmwgPSAkLnVybCgpOyAvLyBwYXJzZSB0aGUgY3VycmVudCBwYWdlIFVSTFxuICAgICAgdmFyIGN1cnJpZCA9IHVybC5wYXJhbSgnaWQnKTtcbiAgICAgIGlmIChpZGhhc2ggPT0gbnVsbCkge1xuICAgICAgICAgIGlkaGFzaCA9IHt9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiBpZGhhc2gpIHtcbiAgICAgICAgICBpZiAoaWRoYXNoLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGlkcy5pbmRleE9mKGN1cnJpZCkgPCAwKSB8fCBkZWJ1Zykge1xuICAgICAgICAgIGlkaGFzaFtjdXJyaWRdID0gMTtcbiAgICAgICAgICAvLyBzZXNzaW9uIGNvb2tpZVxuICAgICAgICAgICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCBpZGhhc2gsIHsganNvbiA6IHRydWUsIHBhdGg6ICcvJywgZG9tYWluOiAnLmhhdGhpdHJ1c3Qub3JnJyB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIHNob3dBbGVydCgpIHtcbiAgICAgICAgICAgICAgdmFyIGh0bWwgPSAkKCcjYWNjZXNzQmFubmVySUQnKS5odG1sKCk7XG4gICAgICAgICAgICAgIHZhciAkYWxlcnQgPSBib290Ym94LmRpYWxvZyhodG1sLCBbeyBsYWJlbDogXCJPS1wiLCBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiIH1dLCB7IGhlYWRlciA6ICdTcGVjaWFsIGFjY2VzcycsIHJvbGU6ICdhbGVydGRpYWxvZycgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHNob3dBbGVydCwgMzAwMCwgdHJ1ZSk7XG4gICAgICB9XG4gIH1cblxufSkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjIuMjAxNzEyMTBcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiBzZWxmKSB7XG5cbi8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbi8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuaWYgKFxuXHQgICAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlNcblx0JiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKVxuKSB7XG5cbihmdW5jdGlvbiAodmlldykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbnZhclxuXHQgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG5cdCwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuXHQsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG5cdCwgb2JqQ3RyID0gT2JqZWN0XG5cdCwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXHR9XG5cdCwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdHZhclxuXHRcdFx0ICBpID0gMFxuXHRcdFx0LCBsZW4gPSB0aGlzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXHQvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcblx0LCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0dGhpcy5uYW1lID0gdHlwZTtcblx0XHR0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0fVxuXHQsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG5cdFx0aWYgKHRva2VuID09PSBcIlwiKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJTWU5UQVhfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBiZSBlbXB0eS5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGNvbnRhaW4gc3BhY2UgY2hhcmFjdGVycy5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcblx0fVxuXHQsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcblx0XHRcdCwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG5cdFx0XHQsIGkgPSAwXG5cdFx0XHQsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHRoaXMucHVzaChjbGFzc2VzW2ldKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuXHRcdH07XG5cdH1cblx0LCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cblx0LCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG5cdH1cbjtcbi8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbi8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG5jbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcblx0cmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbn07XG5jbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuXHRyZXR1cm4gfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbiArIFwiXCIpO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKCF+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAofmluZGV4KSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHZhclxuXHRcdCAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcblx0XHQsIG1ldGhvZCA9IHJlc3VsdCA/XG5cdFx0XHRmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG5cdFx0OlxuXHRcdFx0Zm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcblx0O1xuXG5cdGlmIChtZXRob2QpIHtcblx0XHR0aGlzW21ldGhvZF0odG9rZW4pO1xuXHR9XG5cblx0aWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmb3JjZTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gIXJlc3VsdDtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdHZhciBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0b2tlbiArIFwiXCIpO1xuXHRpZiAofmluZGV4KSB7XG5cdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEsIHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufVxuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0oc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0Ly8gcmVwbGFjZSgpIHBvbHlmaWxsXG5cdGlmICghKFwicmVwbGFjZVwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpLmNsYXNzTGlzdCkpIHtcblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0b2tlbnMgPSB0aGlzLnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpXG5cdFx0XHRcdCwgaW5kZXggPSB0b2tlbnMuaW5kZXhPZih0b2tlbiArIFwiXCIpXG5cdFx0XHQ7XG5cdFx0XHRpZiAofmluZGV4KSB7XG5cdFx0XHRcdHRva2VucyA9IHRva2Vucy5zbGljZShpbmRleCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlLmFwcGx5KHRoaXMsIHRva2Vucyk7XG5cdFx0XHRcdHRoaXMuYWRkKHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHRcdFx0dGhpcy5hZGQuYXBwbHkodGhpcywgdG9rZW5zLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0ZXN0RWxlbWVudCA9IG51bGw7XG59KCkpO1xuXG59IiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIHZhciBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG5cbiAgICAgICAgJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJChcImFbZGF0YS10b2dnbGUqPWRvd25sb2FkXVwiKS5hZGRDbGFzcyhcImludGVyYWN0aXZlXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGJvb3Rib3guaGlkZUFsbCgpO1xuICAgICAgICAgICAgaWYgKCAkKHRoaXMpLmF0dHIoXCJyZWxcIikgPT0gJ2FsbG93JyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbXMuZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSA9PSBudWxsICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5kb3dubG9hZFBkZih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsYWluUGRmQWNjZXNzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgfSxcblxuICAgIGV4cGxhaW5QZGZBY2Nlc3M6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkKFwiI25vRG93bmxvYWRBY2Nlc3NcIikuaHRtbCgpO1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7RE9XTkxPQURfTElOS30nLCAkKHRoaXMpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgdGhpcy4kZGlhbG9nID0gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgLy8gdGhpcy4kZGlhbG9nLmFkZENsYXNzKFwibG9naW5cIik7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi4kbGluayA9ICQobGluayk7XG4gICAgICAgIHNlbGYuc3JjID0gJChsaW5rKS5hdHRyKCdocmVmJyk7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9ICQobGluaykuZGF0YSgndGl0bGUnKSB8fCAnUERGJztcblxuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgncmFuZ2UnKSA9PSAneWVzJyApIHtcbiAgICAgICAgICAgIGlmICggISBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgIC8vICc8cD5CdWlsZGluZyB5b3VyIFBERi4uLjwvcD4nICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiaW5pdGlhbFwiPjxwPlNldHRpbmcgdXAgdGhlIGRvd25sb2FkLi4uPC9kaXY+YCArXG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cIm9mZnNjcmVlblwiIHJvbGU9XCJzdGF0dXNcIiBhcmlhLWF0b21pYz1cInRydWVcIiBhcmlhLWxpdmU9XCJwb2xpdGVcIj48L2Rpdj5gICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgaGlkZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYmFyXCIgd2lkdGg9XCIwJVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgLy8gJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1zdWNjZXNzIGRvbmUgaGlkZVwiPicgK1xuICAgICAgICAgICAgLy8gICAgICc8cD5BbGwgZG9uZSE8L3A+JyArXG4gICAgICAgICAgICAvLyAnPC9kaXY+JyArIFxuICAgICAgICAgICAgYDxkaXY+PHA+PGEgaHJlZj1cImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2hlbHBfZGlnaXRhbF9saWJyYXJ5I0Rvd25sb2FkVGltZVwiIHRhcmdldD1cIl9ibGFua1wiPldoYXQgYWZmZWN0cyB0aGUgZG93bmxvYWQgc3BlZWQ/PC9hPjwvcD48L2Rpdj5gO1xuXG4gICAgICAgIHZhciBoZWFkZXIgPSAnQnVpbGRpbmcgeW91ciAnICsgc2VsZi5pdGVtX3RpdGxlO1xuICAgICAgICB2YXIgdG90YWwgPSBzZWxmLiRsaW5rLmRhdGEoJ3RvdGFsJykgfHwgMDtcbiAgICAgICAgaWYgKCB0b3RhbCA+IDAgKSB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gdG90YWwgPT0gMSA/ICdwYWdlJyA6ICdwYWdlcyc7XG4gICAgICAgICAgICBoZWFkZXIgKz0gJyAoJyArIHRvdGFsICsgJyAnICsgc3VmZml4ICsgJyknO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnQ2FuY2VsJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4teC1kaXNtaXNzIGJ0bicsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgICBzZWxmLiRzdGF0dXMgPSBzZWxmLiRkaWFsb2cuZmluZChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgICAgICAgLy8gc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBCdWlsZGluZyB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKTtcblxuICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuXG4gICAgfSxcblxuICAgIHJlcXVlc3REb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgZGF0YVsnc2VxJ10gPSBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpO1xuICAgICAgICB9XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHNlbGYuc3JjLnJlcGxhY2UoLzsvZywgJyYnKSArICcmY2FsbGJhY2s9SFQuZG93bmxvYWRlci5zdGFydERvd25sb2FkTW9uaXRvcicsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIFNUQVJUVVAgTk9UIERFVEVDVEVEXCIpO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nICkgeyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKHJlcSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRG93bmxvYWQ6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzdGFydERvd25sb2FkTW9uaXRvcjogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFMUkVBRFkgUE9MTElOR1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucGRmLnByb2dyZXNzX3VybCA9IHByb2dyZXNzX3VybDtcbiAgICAgICAgc2VsZi5wZGYuZG93bmxvYWRfdXJsID0gZG93bmxvYWRfdXJsO1xuICAgICAgICBzZWxmLnBkZi50b3RhbCA9IHRvdGFsO1xuXG4gICAgICAgIHNlbGYuaXNfcnVubmluZyA9IHRydWU7XG4gICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCA9IDA7XG4gICAgICAgIHNlbGYuaSA9IDA7XG5cbiAgICAgICAgc2VsZi50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBzZWxmLmNoZWNrU3RhdHVzKCk7IH0sIDI1MDApO1xuICAgICAgICAvLyBkbyBpdCBvbmNlIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIHNlbGYuY2hlY2tTdGF0dXMoKTtcblxuICAgIH0sXG5cbiAgICBjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5pICs9IDE7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBzZWxmLnBkZi5wcm9ncmVzc191cmwsXG4gICAgICAgICAgICBkYXRhIDogeyB0cyA6IChuZXcgRGF0ZSkuZ2V0VGltZSgpIH0sXG4gICAgICAgICAgICBjYWNoZSA6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHNlbGYudXBkYXRlUHJvZ3Jlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMuZG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICYmIHN0YXR1cy5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVByb2Nlc3NFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFJTEVEOiBcIiwgcmVxLCBcIi9cIiwgdGV4dFN0YXR1cywgXCIvXCIsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MDQgJiYgKHNlbGYuaSA+IDI1IHx8IHNlbGYubnVtX3Byb2Nlc3NlZCA+IDApICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgdXBkYXRlUHJvZ3Jlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdHVzID0geyBkb25lIDogZmFsc2UsIGVycm9yIDogZmFsc2UgfTtcbiAgICAgICAgdmFyIHBlcmNlbnQ7XG5cbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkYXRhLnN0YXR1cztcbiAgICAgICAgaWYgKCBjdXJyZW50ID09ICdFT1QnIHx8IGN1cnJlbnQgPT0gJ0RPTkUnICkge1xuICAgICAgICAgICAgc3RhdHVzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkYXRhLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDAgKiAoIGN1cnJlbnQgLyBzZWxmLnBkZi50b3RhbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLmxhc3RfcGVyY2VudCAhPSBwZXJjZW50ICkge1xuICAgICAgICAgICAgc2VsZi5sYXN0X3BlcmNlbnQgPSBwZXJjZW50O1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSAxMDAgdGltZXMsIHdoaWNoIGFtb3VudHMgdG8gfjEwMCBzZWNvbmRzXG4gICAgICAgIGlmICggc2VsZi5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmlzKFwiOnZpc2libGVcIikgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPlBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmJhclwiKS5jc3MoeyB3aWR0aCA6IHBlcmNlbnQgKyAnJSd9KTtcblxuICAgICAgICBpZiAoIHBlcmNlbnQgPT0gMTAwICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuICAgICAgICAgICAgdmFyIGRvd25sb2FkX2tleSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTWFjIE9TIFgnKSAhPSAtMSA/ICdSRVRVUk4nIDogJ0VOVEVSJztcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5TZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLjwvc3Bhbj48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuYCk7XG5cbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIiBkb3dubG9hZD1cImRvd25sb2FkXCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgaWYgKCAkZG93bmxvYWRfYnRuLmdldCgwKS5kb3dubG9hZCA9PSB1bmRlZmluZWQgKSB7XG4gICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXR0cigndGFyZ2V0JywgJ19ibGFuaycpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFByZXNzIHJldHVybiB0byBkb3dubG9hZC5gKTtcbiAgICAgICAgICAgIC8vIHN0aWxsIGNvdWxkIGNhbmNlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS50ZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfSAoJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWQpLmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGAke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuICAgIHVwZGF0ZVN0YXR1c1RleHQ6IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYuX2xhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgICAgaWYgKCBzZWxmLl9sYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChzZWxmLl9sYXN0VGltZXIpOyBzZWxmLl9sYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgICAgc2VsZi5fbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICAgIH0sIDUwKTtcbiAgICAgICAgICBzZWxmLl9sYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAgIHNlbGYuJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgICAgfSwgNTAwKTtcblxuICAgICAgICB9XG4gICAgfSxcblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBhbmQgZG8gdGhpcyBoZXJlXG4gICAgJChcIiNzZWxlY3RlZFBhZ2VzUGRmTGlua1wiKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuXG4gICAgICAgIGlmICggcHJpbnRhYmxlLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gcHJpbnQuPC9wPlwiIF07XG4gICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGFwcGVhciBpbiB0aGUgc2VsZWN0aW9uIGNvbnRlbnRzIDxidXR0b24gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6ICM2NjY7IGJvcmRlci1jb2xvcjogI2VlZVxcXCIgY2xhc3M9XFxcImJ0biBzcXVhcmVcXFwiPjxpIGNsYXNzPVxcXCJpY29tb29uIGljb21vb24tcGFwZXJzXFxcIiBzdHlsZT1cXFwiY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDE0cHg7XFxcIiAvPjwvYnV0dG9uPlwiKTtcblxuICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiT0tcIixcbiAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBib290Ym94LmRpYWxvZyhtc2csIGJ1dHRvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHByaW50YWJsZSk7XG5cbiAgICAgICAgJCh0aGlzKS5kYXRhKCdzZXEnLCBzZXEpO1xuICAgICAgICBIVC5kb3dubG9hZGVyLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgIH0pO1xuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHQ7XG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vayAnICtcbiAgICAgICAgICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgICAgICAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PGkgY2xhc3M9XCJpY29tb29uIGljb21vb24taGVscFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPkhlbHA6IEVtYmVkZGluZyBIYXRoaVRydXN0IEJvb2tzPC9zcGFuPjwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LXNjcm9sbFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctc2Nyb2xsXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LWZsaXBcIiB2YWx1ZT1cIjFcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1mbGlwXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWJvb2stYWx0MlwiLz4gRmxpcCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZm9ybT4nICtcbiAgICAnPC9kaXY+J1xuICAgICk7XG5cblxuICAgICQoXCIjZW1iZWRIdG1sXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfVxuICAgIF0pO1xuXG4gICAgICAgIC8vIEN1c3RvbSB3aWR0aCBmb3IgYm91bmRpbmcgJy5tb2RhbCcgXG4gICAgICAgICRibG9jay5jbG9zZXN0KCcubW9kYWwnKS5hZGRDbGFzcyhcImJvb3Rib3hNZWRpdW1XaWR0aFwiKTtcblxuICAgICAgICAvLyBTZWxlY3QgZW50aXJldHkgb2YgY29kZWJsb2NrIGZvciBlYXN5IGNvcHlpbmdcbiAgICAgICAgdmFyIHRleHRhcmVhID0gJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWNvZGVibG9ja11cIik7XG4gICAgdGV4dGFyZWEub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IGNvZGVibG9jayB0byBvbmUgb2YgdHdvIHZpZXdzIFxuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctc2Nyb2xsXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LWZsaXBcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9sb25nLCBzaWRlX3Nob3J0KSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGZlZWRiYWNrIHN5c3RlbVxudmFyIEhUID0gSFQgfHwge307XG5IVC5mZWVkYmFjayA9IHt9O1xuSFQuZmVlZGJhY2suZGlhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPVxuICAgICAgICAnPGZvcm0+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPkVtYWlsIEFkZHJlc3M8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGxhYmVsIGZvcj1cImVtYWlsXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5FTWFpbCBBZGRyZXNzPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBwbGFjZWhvbGRlcj1cIltZb3VyIGVtYWlsIGFkZHJlc3NdXCIgbmFtZT1cImVtYWlsXCIgaWQ9XCJlbWFpbFwiIC8+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPldlIHdpbGwgbWFrZSBldmVyeSBlZmZvcnQgdG8gYWRkcmVzcyBjb3B5cmlnaHQgaXNzdWVzIGJ5IHRoZSBuZXh0IGJ1c2luZXNzIGRheSBhZnRlciBub3RpZmljYXRpb24uPC9zcGFuPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPk92ZXJhbGwgcGFnZSByZWFkYWJpbGl0eSBhbmQgcXVhbGl0eTwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiB2YWx1ZT1cInJlYWRhYmxlXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIE1pc3NpbmcgcGFydHMgb2YgdGhlIHBhZ2UnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQmx1cnJ5IHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjdXJ2ZWRcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgVGhpcyBpdGVtIGlzIGluIHRoZSBwdWJsaWMgZG9tYWluLCBidXQgSSBkb25cXCd0IGhhdmUgYWNjZXNzIHRvIGl0LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwiYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAgICAgSSBoYXZlIGFjY2VzcyB0byB0aGlzIGl0ZW0sIGJ1dCBzaG91bGQgbm90LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICByZXR1cm47XG5cbiAgICB2YXIgaW5pdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuXG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dC5zZWFyY2gtaW5wdXQtdGV4dFwiKTtcbiAgICB2YXIgJGlucHV0X2xhYmVsID0gJGZvcm0uZmluZChcImxhYmVsW2Zvcj0ncTEtaW5wdXQnXVwiKTtcbiAgICB2YXIgJHNlbGVjdCA9ICRmb3JtLmZpbmQoXCIuY29udHJvbC1zZWFyY2h0eXBlXCIpO1xuICAgIHZhciAkc2VhcmNoX3RhcmdldCA9ICRmb3JtLmZpbmQoXCIuc2VhcmNoLXRhcmdldFwiKTtcbiAgICB2YXIgJGZ0ID0gJGZvcm0uZmluZChcInNwYW4uZnVua3ktZnVsbC12aWV3XCIpO1xuXG4gICAgdmFyICRiYWNrZHJvcCA9IG51bGw7XG5cbiAgICB2YXIgJGFjdGlvbiA9ICQoXCIjYWN0aW9uLXNlYXJjaC1oYXRoaXRydXN0XCIpO1xuICAgICRhY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvb3Rib3guc2hvdygnc2VhcmNoLW1vZGFsJywge1xuICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgICAgICAgICRpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuXG4gICAgdmFyIF9zZXR1cCA9IHt9O1xuICAgIF9zZXR1cC5scyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LmhpZGUoKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCBvciB3aXRoaW4gdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggZnVsbC10ZXh0IGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgZnVsbC10ZXh0IGluZGV4LlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zZXR1cC5jYXRhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3Quc2hvdygpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGNhdGFsb2cgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBjYXRhbG9nIGluZGV4OyB5b3UgY2FuIGxpbWl0IHlvdXIgc2VhcmNoIHRvIGEgc2VsZWN0aW9uIG9mIGZpZWxkcy5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ID0gJHNlYXJjaF90YXJnZXQuZmluZChcImlucHV0OmNoZWNrZWRcIikudmFsKCk7XG4gICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICBpbml0ZWQgPSB0cnVlO1xuXG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgaWYgKCBwcmVmcy5zZWFyY2ggJiYgcHJlZnMuc2VhcmNoLmZ0ICkge1xuICAgICAgICAkKFwiaW5wdXRbbmFtZT1mdF1cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuXG4gICAgJHNlYXJjaF90YXJnZXQub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPVwicmFkaW9cIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IGxhYmVsIDogXCItXCIsIGNhdGVnb3J5IDogXCJIVCBTZWFyY2hcIiwgYWN0aW9uIDogdGFyZ2V0IH0pO1xuICAgIH0pXG5cbiAgICAvLyAkZm9ybS5kZWxlZ2F0ZSgnOmlucHV0JywgJ2ZvY3VzIGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJGT0NVU0lOR1wiLCB0aGlzKTtcbiAgICAvLyAgICAgJGZvcm0uYWRkQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCA9PSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wID0gJCgnPGRpdiBjbGFzcz1cIm1vZGFsX19vdmVybGF5IGludmlzaWJsZVwiPjwvZGl2PicpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAkYmFja2Ryb3AuYXBwZW5kVG8oJChcImJvZHlcIikpLnNob3coKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJChcImJvZHlcIikub24oJ2ZvY3VzJywgJzppbnB1dCxhJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIC8vICAgICBpZiAoICEgJHRoaXMuY2xvc2VzdChcIi5uYXYtc2VhcmNoLWZvcm1cIikubGVuZ3RoICkge1xuICAgIC8vICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gdmFyIGNsb3NlX3NlYXJjaF9mb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRmb3JtLnJlbW92ZUNsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgIT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5kZXRhY2goKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5oaWRlKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhZGQgZXZlbnQgaGFuZGxlciBmb3Igc3VibWl0IHRvIGNoZWNrIGZvciBlbXB0eSBxdWVyeSBvciBhc3Rlcmlza1xuICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbihldmVudClcbiAgICAgICAgIHtcblxuICAgICAgICAgICAgaWYgKCAhIHRoaXMuY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy9jaGVjayBmb3IgYmxhbmsgb3Igc2luZ2xlIGFzdGVyaXNrXG4gICAgICAgICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpLmZpbmQoXCJpbnB1dFtuYW1lPXExXVwiKTtcbiAgICAgICAgICAgdmFyIHF1ZXJ5ID0gJGlucHV0LnZhbCgpO1xuICAgICAgICAgICBxdWVyeSA9ICQudHJpbShxdWVyeSk7XG4gICAgICAgICAgIGlmIChxdWVyeSA9PT0gJycpXG4gICAgICAgICAgIHtcbiAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBlbnRlciBhIHNlYXJjaCB0ZXJtLlwiKTtcbiAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcignYmx1cicpO1xuICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICAvLyAvLyAqICBCaWxsIHNheXMgZ28gYWhlYWQgYW5kIGZvcndhcmQgYSBxdWVyeSB3aXRoIGFuIGFzdGVyaXNrICAgIyMjIyMjXG4gICAgICAgICAgIC8vIGVsc2UgaWYgKHF1ZXJ5ID09PSAnKicpXG4gICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgLy8gICAvLyBjaGFuZ2UgcTEgdG8gYmxhbmtcbiAgICAgICAgICAgLy8gICAkKFwiI3ExLWlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgICAgICAvLyAgICQoXCIuc2VhcmNoLWZvcm1cIikuc3VibWl0KCk7XG4gICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjKlxuICAgICAgICAgICBlbHNlXG4gICAgICAgICAgIHtcblxuICAgICAgICAgICAgLy8gc2F2ZSBsYXN0IHNldHRpbmdzXG4gICAgICAgICAgICB2YXIgc2VhcmNodHlwZSA9ICggdGFyZ2V0ID09ICdscycgKSA/ICdhbGwnIDogJHNlbGVjdC5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICAgICAgSFQucHJlZnMuc2V0KHsgc2VhcmNoIDogeyBmdCA6ICQoXCJpbnB1dFtuYW1lPWZ0XTpjaGVja2VkXCIpLmxlbmd0aCA+IDAsIHRhcmdldCA6IHRhcmdldCwgc2VhcmNodHlwZTogc2VhcmNodHlwZSB9fSlcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgIH1cblxuICAgICB9ICk7XG5cbn0pXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgSFQuYW5hbHl0aWNzLmdldENvbnRlbnRHcm91cERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjaGVhdFxuICAgIHZhciBzdWZmaXggPSAnJztcbiAgICB2YXIgY29udGVudF9ncm91cCA9IDQ7XG4gICAgaWYgKCAkKFwiI3NlY3Rpb25cIikuZGF0YShcInZpZXdcIikgPT0gJ3Jlc3RyaWN0ZWQnICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDI7XG4gICAgICBzdWZmaXggPSAnI3Jlc3RyaWN0ZWQnO1xuICAgIH0gZWxzZSBpZiAoIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoXCJkZWJ1Zz1zdXBlclwiKSA+IC0xICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDM7XG4gICAgICBzdWZmaXggPSAnI3N1cGVyJztcbiAgICB9XG4gICAgcmV0dXJuIHsgaW5kZXggOiBjb250ZW50X2dyb3VwLCB2YWx1ZSA6IEhULnBhcmFtcy5pZCArIHN1ZmZpeCB9O1xuXG4gIH1cblxuICBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYgPSBmdW5jdGlvbihocmVmKSB7XG4gICAgdmFyIHVybCA9ICQudXJsKGhyZWYpO1xuICAgIHZhciBuZXdfaHJlZiA9IHVybC5zZWdtZW50KCk7XG4gICAgbmV3X2hyZWYucHVzaCgkKFwiaHRtbFwiKS5kYXRhKCdjb250ZW50LXByb3ZpZGVyJykpO1xuICAgIG5ld19ocmVmLnB1c2godXJsLnBhcmFtKFwiaWRcIikpO1xuICAgIHZhciBxcyA9ICcnO1xuICAgIGlmICggbmV3X2hyZWYuaW5kZXhPZihcInNlYXJjaFwiKSA+IC0xICYmIHVybC5wYXJhbSgncTEnKSAgKSB7XG4gICAgICBxcyA9ICc/cTE9JyArIHVybC5wYXJhbSgncTEnKTtcbiAgICB9XG4gICAgbmV3X2hyZWYgPSBcIi9cIiArIG5ld19ocmVmLmpvaW4oXCIvXCIpICsgcXM7XG4gICAgcmV0dXJuIG5ld19ocmVmO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzLmdldFBhZ2VIcmVmID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZigpO1xuICB9XG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRtZW51OyB2YXIgJHRyaWdnZXI7IHZhciAkaGVhZGVyOyB2YXIgJG5hdmlnYXRvcjtcbiAgSFQgPSBIVCB8fCB7fTtcblxuICBIVC5tb2JpZnkgPSBmdW5jdGlvbigpIHtcblxuICAgIC8vIGlmICggJChcImh0bWxcIikuaXMoXCIuZGVza3RvcFwiKSApIHtcbiAgICAvLyAgICQoXCJodG1sXCIpLmFkZENsYXNzKFwibW9iaWxlXCIpLnJlbW92ZUNsYXNzKFwiZGVza3RvcFwiKS5yZW1vdmVDbGFzcyhcIm5vLW1vYmlsZVwiKTtcbiAgICAvLyB9XG5cbiAgICAkaGVhZGVyID0gJChcImhlYWRlclwiKTtcbiAgICAkbmF2aWdhdG9yID0gJChcIi5uYXZpZ2F0b3JcIik7XG4gICAgaWYgKCAkbmF2aWdhdG9yLmxlbmd0aCApIHtcbiAgICAgICRuYXZpZ2F0b3IuZ2V0KDApLnN0eWxlLnNldFByb3BlcnR5KCctLWhlaWdodCcsIGAtJHskbmF2aWdhdG9yLm91dGVySGVpZ2h0KCkgKiAwLjkwfXB4YCk7XG4gICAgICB2YXIgJGV4cGFuZG8gPSAkbmF2aWdhdG9yLmZpbmQoXCIuYWN0aW9uLWV4cGFuZG9cIik7XG4gICAgICAkZXhwYW5kby5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAhICggZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPT0gJ3RydWUnICk7XG4gICAgICB9KVxuXG4gICAgICBpZiAoIEhULnBhcmFtcy51aSA9PSAnZW1iZWQnICkge1xuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkZXhwYW5kby50cmlnZ2VyKCdjbGljaycpO1xuICAgICAgICB9LCAxMDAwKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBIVC4kbWVudSA9ICRtZW51O1xuXG4gICAgdmFyICRzaWRlYmFyID0gJChcIiNzaWRlYmFyXCIpO1xuXG4gICAgJHRyaWdnZXIgPSAkc2lkZWJhci5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpO1xuXG4gICAgJChcIiNhY3Rpb24tbW9iaWxlLXRvZ2dsZS1mdWxsc2NyZWVuXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4gICAgfSlcblxuICAgIEhULnV0aWxzID0gSFQudXRpbHMgfHwge307XG5cbiAgICAvLyAkc2lkZWJhci5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcuc2lkZWJhci1jb250YWluZXInLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgLy8gaGlkZSB0aGUgc2lkZWJhclxuICAgICAgdmFyICR0aGlzID0gJChldmVudC50YXJnZXQpO1xuICAgICAgaWYgKCAkdGhpcy5pcyhcImlucHV0W3R5cGU9J3RleHQnXSxzZWxlY3RcIikgKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMucGFyZW50cyhcIi5mb3JtLXNlYXJjaC12b2x1bWVcIikubGVuZ3RoICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLmlzKFwiYnV0dG9uLGFcIikgKSB7XG4gICAgICAgIEhULnRvZ2dsZShmYWxzZSk7XG4gICAgICB9XG4gICAgfSlcblxuICAgIC8vIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuICAgIC8vICQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJCh3aW5kb3cpLm9uKFwib3JpZW50YXRpb25jaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuICAgIC8vICAgICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbiAgICAvLyAgICAgfSwgMTAwKTtcbiAgICAvLyB9KVxuICAgIGlmICggSFQgJiYgSFQudXRpbHMgJiYgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UgKSB7XG4gICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIH1cbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICd0cnVlJztcbiAgfVxuXG4gIEhULnRvZ2dsZSA9IGZ1bmN0aW9uKHN0YXRlKSB7XG5cbiAgICAvLyAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCIuc2lkZWJhci1jb250YWluZXJcIikuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKS5hdHRyKCdhcmlhLWV4cGFuZGVkJywgc3RhdGUpO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnNpZGViYXJFeHBhbmRlZCA9IHN0YXRlO1xuICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnZpZXcgPSBzdGF0ZSA/ICdvcHRpb25zJyA6ICd2aWV3ZXInO1xuXG4gICAgLy8gdmFyIHhsaW5rX2hyZWY7XG4gICAgLy8gaWYgKCAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT0gJ3RydWUnICkge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtZXhwYW5kZWQnO1xuICAgIC8vIH0gZWxzZSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1jb2xsYXBzZWQnO1xuICAgIC8vIH1cbiAgICAvLyAkdHJpZ2dlci5maW5kKFwic3ZnIHVzZVwiKS5hdHRyKFwieGxpbms6aHJlZlwiLCB4bGlua19ocmVmKTtcbiAgfVxuXG4gIHNldFRpbWVvdXQoSFQubW9iaWZ5LCAxMDAwKTtcblxuICB2YXIgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5ID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGggPSAkKFwiI3NpZGViYXIgLnNpZGViYXItdG9nZ2xlLWJ1dHRvblwiKS5vdXRlckhlaWdodCgpIHx8IDQwO1xuICAgIHZhciB0b3AgPSAoICQoXCJoZWFkZXJcIikuaGVpZ2h0KCkgKyBoICkgKiAxLjA1O1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS10b29sYmFyLWhvcml6b250YWwtdG9wJywgdG9wICsgJ3B4Jyk7XG4gIH1cbiAgJCh3aW5kb3cpLm9uKCdyZXNpemUnLCB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkpO1xuICB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkoKTtcblxuICAkKFwiaHRtbFwiKS5nZXQoMCkuc2V0QXR0cmlidXRlKCdkYXRhLXNpZGViYXItZXhwYW5kZWQnLCBmYWxzZSk7XG5cbn0pXG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJGZvcm0gPSAkKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgSFQuJHNlYXJjaF9mb3JtID0gbnVsbDtcblxuICB2YXIgJGJvZHkgPSAkKFwiYm9keVwiKTtcblxuICB2YXIgc2VjdGlvbl92aWV3ID0gZnVuY3Rpb24odmlldykge1xuICAgIC8vICRib2R5LmdldCgwKS5kYXRhc2V0LnNlY3Rpb25WaWV3ID0gdmlldztcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5zaWRlYmFyRXhwYW5kZWQgPSBmYWxzZTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5zZWN0aW9uVmlldyA9IHZpZXc7XG4gICAgJChcIi5zaWRlYmFyLWNvbnRhaW5lclwiKS5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBmYWxzZSk7XG4gIH1cblxuICBpZiAoICQoXCIjdG9vbGJhci12ZXJ0aWNhbFwiKS5sZW5ndGggKSB7XG4gICAgLy8gJGlmcmFtZS5vbihcImxvYWRcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAkKHdpbmRvdykudHJpZ2dlcigndW5kby1sb2FkaW5nJyk7XG4gICAgLy8gICAkaWZyYW1lLnNob3coKTtcblxuICAgIC8vICAgdmFyICRjaGVjayA9ICQoXCIjbWRwQmFja1RvUmVzdWx0c1wiKTtcbiAgICAvLyAgIGlmICggISAkY2hlY2subGVuZ3RoICkge1xuICAgIC8vICAgICB2YXIgaHJlZiA9ICRpZnJhbWUuZ2V0KDApLmNvbnRlbnRXaW5kb3cubG9jYXRpb24uaHJlZjtcbiAgICAvLyAgICAgJGNoZWNrID0gJChgPGRpdiBpZD1cIm1kcEJhY2tUb1Jlc3VsdHNcIj48L2Rpdj5gKTtcbiAgICAvLyAgICAgJChcIi5iaWJMaW5rc1wiKS5iZWZvcmUoJGNoZWNrKTtcbiAgICAvLyAgICAgJChcIiNtZHBCYWNrVG9SZXN1bHRzXCIpLmFwcGVuZChgPHA+PGEgZGF0YS10b2dnbGU9XCJ0cmFja2luZ1wiIGRhdGEtdHJhY2tpbmctY2F0ZWdvcnk9XCJQVFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiUFQgQmFjayB0byBJbiBJdGVtIFJlc3VsdHNcIiBocmVmPVwiJHtocmVmfVwiPiYjMTcxOyBCYWNrIHRvIFwiU2VhcmNoIGluIHRoaXMgdGV4dFwiIHJlc3VsdHM8L2E+PC9wPmApO1xuICAgIC8vICAgfVxuXG4gICAgLy8gICAvLyBhY3R1YWxseSB0aGlzICppcyogdGhlIGN1cnJlbnQgVVJMLiBIbW0uXG4gICAgLy8gICBIVC5wYXJhbXMucTEgPSAkaWZyYW1lLmdldCgwKS5jb250ZW50V2luZG93LkhULnBhcmFtcy5xMTtcbiAgICAvLyAgICQoXCJpbnB1dFtuYW1lPXExXVwiKS52YWwoSFQucGFyYW1zLnExKTtcblxuICAgIC8vICAgJCh0aGlzKS5jb250ZW50cygpLm9uKCdjbGljaycsICcuYmFjay10by1iZWdpbm5pbmctbGluayBhJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICAgLy8ganVzdCBjbG9zZSB0aGlzIGlmcmFtZVxuICAgIC8vICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAvLyAgICAgJGlmcmFtZS5oaWRlKCk7XG4gICAgLy8gICB9KVxuXG4gICAgLy8gICAkKHRoaXMpLmNvbnRlbnRzKCkub24oJ2NsaWNrJywgJ2FydGljbGUucmVzdWx0IGEnLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgIC8vICAgICB2YXIgJGxpbmsgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcImFcIik7XG4gICAgLy8gICAgIHZhciBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgLy8gICAgIHZhciBmcmFnbWVudCA9IGhyZWYuc3BsaXQoJyMnKTtcbiAgICAvLyAgICAgdmFyIGNmaSA9IGBlcHViY2ZpKCR7ZnJhZ21lbnQucG9wKCl9KWA7XG4gICAgLy8gICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuXG4gICAgLy8gICAgICAgJGlmcmFtZS5oaWRlKCk7XG4gICAgLy8gICAgICAgSFQucmVhZGVyLmVtaXQoJ3VwZGF0ZUhpZ2hsaWdodHMnKTtcbiAgICAvLyAgICAgICBIVC5yZWFkZXIuX3VwZGF0ZUhpc3RvcnlVcmwoe30pO1xuXG4gICAgLy8gICAgICAgSFQucmVhZGVyLnZpZXcucmVuZGl0aW9uLmRpc3BsYXkoY2ZpKS50aGVuKCgpID0+IHtcbiAgICAvLyAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBnb3RvUGFnZVwiLCBjZmksIEhULnJlYWRlci52aWV3LmN1cnJlbnRMb2NhdGlvbigpKTtcbiAgICAvLyAgICAgICB9KTtcbiAgICAvLyAgICAgfSwgMTAwKTtcbiAgICAvLyAgIH0pXG4gICAgLy8gfSlcblxuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICcuYmFjay10by1iZWdpbm5pbmctbGluayBhJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIC8vIGp1c3QgY2xvc2UgdGhpcyBpZnJhbWVcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIHNlY3Rpb25fdmlldygncmVhZGVyJyk7XG4gICAgfSlcblxuICAgICQoXCJib2R5XCIpLm9uKCdjbGljaycsICdhcnRpY2xlLnJlc3VsdCBhJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICB2YXIgJGxpbmsgPSAkKGV2ZW50LnRhcmdldCkuY2xvc2VzdChcImFcIik7XG4gICAgICB2YXIgaHJlZiA9ICRsaW5rLmF0dHIoJ2hyZWYnKTtcblxuICAgICAgdmFyIGZyYWdtZW50ID0gaHJlZi5zcGxpdCgnIycpO1xuICAgICAgdmFyIGNmaSA9IGBlcHViY2ZpKCR7ZnJhZ21lbnQucG9wKCl9KWA7XG5cbiAgICAgIHZhciBoaWdobGlnaHQgPSAkbGluay5kYXRhKCdoaWdobGlnaHQnKTtcbiAgICAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hpZ2hsaWdodCcsIEpTT04uc3RyaW5naWZ5KGhpZ2hsaWdodCkpO1xuICAgICAgc2VjdGlvbl92aWV3KCdyZWFkZXInKTtcblxuICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG5cbiAgICAgICAgSFQuJHNlYXJjaF9mb3JtLnNjcm9sbFRvcCgwKTtcblxuICAgICAgICBIVC5yZWFkZXIuZW1pdCgndXBkYXRlSGlnaGxpZ2h0cycpO1xuICAgICAgICBIVC5yZWFkZXIuX3VwZGF0ZUhpc3RvcnlVcmwoe30pO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBSRVNVTFRTIGdvdG9QYWdlIENMSUNLIFhcIiwgY2ZpKTtcbiAgICAgICAgICBIVC5yZWFkZXIudmlldy5yZW5kaXRpb24uZGlzcGxheShjZmkpLnRoZW4oKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIFJFU1VMVFMgZ290b1BhZ2UgRE9ORSBYXCIsIGNmaSwgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCkpO1xuICAgICAgICAgIH0pO1xuICAgICAgICB9LCAxMDApO1xuICAgICAgfSwgMTAwKTtcbiAgICB9KVxuXG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJyNtZHBCYWNrVG9SZXN1bHRzIGFbZGF0YS10cmFja2luZy1hY3Rpb249XCJQVCBCYWNrIHRvIEluIEl0ZW0gUmVzdWx0c1wiXScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICBcbiAgICAgIHNlY3Rpb25fdmlldygnc2VhcmNoLXJlc3VsdHMnKTtcblxuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH0pXG4gIH1cblxuICAkKHdpbmRvdykub24oJ3VuZG8tbG9hZGluZycsIGZ1bmN0aW9uKCkge1xuICAgICQoXCJidXR0b24uYnRuLWxvYWRpbmdcIikucmVtb3ZlQXR0cihcImRpc2FibGVkXCIpLnJlbW92ZUNsYXNzKFwiYnRuLWxvYWRpbmdcIik7XG4gIH0pXG5cbiAgLy8gJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KSB7XG4gICQoXCJib2R5XCIpLm9uKCdzdWJtaXQnLCAnZm9ybS5mb3JtLXNlYXJjaC12b2x1bWUnLCBmdW5jdGlvbihldmVudCkge1xuICAgIEhULmJlZm9yZVVubG9hZFRpbWVvdXQgPSAxNTAwMDtcbiAgICB2YXIgJGZvcm1fID0gJCh0aGlzKTtcblxuICAgIHZhciAkc3VibWl0ID0gJGZvcm1fLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm1fLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICBpZiAoICRmb3JtXy5kYXRhKCdxJykgPT0gJC50cmltKCRpbnB1dC52YWwoKSkgJiYgSFQuJHNlYXJjaF9mb3JtICkge1xuICAgICAgLy8gc2FtZSBxdWVyeSwganVzdCBzaG93IHRoZSBkYW5nIGlmcmFtZVxuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHNlY3Rpb25fdmlldygnc2VhcmNoLXJlc3VsdHMnKTtcbiAgICAgIC8vIEhULiRyZWFkZXIuaGlkZSgpO1xuICAgICAgLy8gSFQuJHNlYXJjaF9mb3JtLnNob3coKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG5cbiAgICAkZm9ybV8uZGF0YSgncScsICQudHJpbSgkaW5wdXQudmFsKCkpKTtcbiAgICBIVC5wYXJhbXMucTEgPSAkZm9ybV8uZGF0YSgncScpO1xuICAgICQoXCJpbnB1dFtuYW1lPSdxMSddXCIpLnZhbChIVC5wYXJhbXMucTEpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgIC8vICRzdWJtaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICAgICQod2luZG93KS50cmlnZ2VyKCd1bmRvLWxvYWRpbmcnKTtcbiAgICB9KVxuXG4gICAgLy8gcmV0dXJuIHRydWU7XG4gICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcblxuICAgICQuYWpheCh7XG4gICAgICB1cmw6ICcvY2dpL3B0L3NlYXJjaCcsXG4gICAgICBtZXRob2Q6ICdHRVQnLFxuICAgICAgZGF0YTogJGZvcm1fLnNlcmlhbGl6ZSgpXG4gICAgfSkuZG9uZShmdW5jdGlvbiAocmVzcG9uc2UpIHtcbiAgICAgICQod2luZG93KS50cmlnZ2VyKCd1bmRvLWxvYWRpbmcnKTtcbiAgICAgIHZhciAkcmVzcG9uc2UgPSAkKHJlc3BvbnNlKTtcblxuICAgICAgdmFyICRyZXN1bHRzID0gJHJlc3BvbnNlLmZpbmQoXCJtYWluXCIpO1xuICAgICAgJHJlc3VsdHMuYXR0cignaWQnLCAnc2VhcmNoLXJlc3VsdHMnKTtcbiAgICAgIEhULiRyZWFkZXIgPSAkKFwibWFpbiNtYWluXCIpO1xuICAgICAgaWYgKCBIVC4kc2VhcmNoX2Zvcm0gKSB7XG4gICAgICAgIEhULiRzZWFyY2hfZm9ybS5yZXBsYWNlV2l0aCgkcmVzdWx0cyk7XG4gICAgICAgIEhULiRzZWFyY2hfZm9ybSA9ICQoXCJtYWluI3NlYXJjaC1yZXN1bHRzXCIpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgSFQuJHNlYXJjaF9mb3JtID0gJHJlc3VsdHM7XG4gICAgICAgIEhULiRyZWFkZXIuYWZ0ZXIoSFQuJHNlYXJjaF9mb3JtKTtcbiAgICAgIH1cblxuICAgICAgLy8gdmFyICRyZXN1bHRzID0gJHJlc3BvbnNlLmZpbmQoXCJzZWN0aW9uI3NlY3Rpb25cIik7XG4gICAgICAvLyBIVC4kcmVhZGVyID0gJChcInNlY3Rpb24jc2VjdGlvblwiKTtcbiAgICAgIC8vIGlmICggSFQuJHNlYXJjaF9mb3JtICkge1xuICAgICAgLy8gICBIVC4kc2VhcmNoX2Zvcm0ucmVwbGFjZVdpdGgoJHJlc3VsdHMpO1xuICAgICAgLy8gICBIVC4kc2VhcmNoX2Zvcm0gPSAkKFwic2VjdGlvbi5zZWFyY2gtcmVzdWx0cy1jb250YWluZXJcIik7XG4gICAgICAvLyB9IGVsc2Uge1xuICAgICAgLy8gICBIVC4kc2VhcmNoX2Zvcm0gPSAkcmVzdWx0cztcbiAgICAgIC8vICAgSFQuJHJlYWRlci5hZnRlcihIVC4kc2VhcmNoX2Zvcm0pO1xuICAgICAgLy8gfVxuXG4gICAgICBzZWN0aW9uX3ZpZXcoJ3NlYXJjaC1yZXN1bHRzJyk7XG5cbiAgICAgIC8vIHRoaXMgaXMgd2h5P1xuICAgICAgdmFyICRidG4gPSBIVC4kc2VhcmNoX2Zvcm0uZmluZChcIi5zaWRlYmFyLXRvZ2dsZS1idXR0b25cIik7XG4gICAgICBpZiAoICRidG4uaGVpZ2h0KCkgPT0gMCAmJiAoICQoXCJodG1sXCIpLmlzKFwiLmlvc1wiKSB8fCAkKFwiaHRtbFwiKS5pcyhcIi5zYWZhcmlcIikgKSApIHtcbiAgICAgICAgJGJ0bi5hZGRDbGFzcyhcInN0dXBpZC1oYWNrXCIpO1xuICAgICAgfVxuXG5cbiAgICB9KVxuXG5cbiAgfSlcblxuICAkKFwiI2FjdGlvbi1zdGFydC1qdW1wXCIpLm9uKCdjaGFuZ2UnLCBmdW5jdGlvbigpIHtcbiAgICB2YXIgc3ogPSBwYXJzZUludCgkKHRoaXMpLmRhdGEoJ3N6JyksIDEwKTtcbiAgICB2YXIgdmFsdWUgPSBwYXJzZUludCgkKHRoaXMpLnZhbCgpLCAxMCk7XG4gICAgdmFyIHN0YXJ0ID0gKCB2YWx1ZSAtIDEgKSAqIHN6ICsgMTtcbiAgICB2YXIgJGZvcm1fID0gJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIik7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N0YXJ0JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N0YXJ0fVwiIC8+YCk7XG4gICAgJGZvcm1fLmFwcGVuZChgPGlucHV0IG5hbWU9J3N6JyB0eXBlPVwiaGlkZGVuXCIgdmFsdWU9XCIke3N6fVwiIC8+YCk7XG4gICAgJGZvcm1fLnN1Ym1pdCgpO1xuICB9KVxuXG4gIC8vIGhhbmRsaW5nIEVQVUItcmVsYXRlZCBsaW5rc1xuICAvLyAtLS0gcmVuYWJsZSB0aGlzXG4gIC8vICQoXCJib2R5XCIpLm9uKCdjbGljaycsIFwiW2RhdGEtaGlnaGxpZ2h0XVwiLCBmdW5jdGlvbigpIHtcbiAgLy8gICB2YXIgaGlnaGxpZ2h0ID0gJCh0aGlzKS5kYXRhKCdoaWdobGlnaHQnKTtcbiAgLy8gICBzZXNzaW9uU3RvcmFnZS5zZXRJdGVtKCdoaWdobGlnaHQnLCBKU09OLnN0cmluZ2lmeShoaWdobGlnaHQpKTtcbiAgLy8gfSlcblxuICAvLyBzZXRJbnRlcnZhbCgoKSA9PiB7XG4gIC8vICAgdmFyIG1haW4gPSBkb2N1bWVudC5xdWVyeVNlbGVjdG9yKCdtYWluJyk7XG4gIC8vICAgY29uc29sZS5sb2coXCJBSE9ZIE1BSU5cIiwgbWFpbi5vZmZzZXRIZWlnaHQsIG1haW4uc2Nyb2xsVG9wKTtcbiAgLy8gfSwgMTApO1xuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiI3ZlcnNpb25JY29uXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
