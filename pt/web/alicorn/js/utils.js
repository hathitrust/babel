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
    // $trigger.on('clicked', function(event) {
    //   var active = $trigger.attr('aria-expanded') == 'true';
    //   $("html").get(0).dataset.view = active ? 'options' : 'viewer';
    // })

    $("#action-mobile-toggle-fullscreen").on('click', function () {
      document.documentElement.requestFullScreen();
    });

    HT.utils = HT.utils || {};

    $sidebar.on('click', function (event) {
      // hide the sidebar
      var $this = $(event.target);
      if ($this.is("input[type='text'],select")) {
        return;
      }
      if ($this.parents("#form-search-volume").length) {
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

    $trigger.attr('aria-expanded', state);
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
  var $form = $("#form-search-volume");
  $form.submit(function () {
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
      $submit.removeAttr('disabled');
    });

    return true;
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
"use strict";

head.ready(function () {

    $("#versionIcon").click(function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsImFuYWx5dGljcyIsImxvZ0FjdGlvbiIsImhyZWYiLCJ0cmlnZ2VyIiwiZGVsaW0iLCJnZXQiLCJvbiIsImV2ZW50Iiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY29va2llIiwianNvbiIsImN1cnJpZCIsImlkcyIsImlkIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZXRUaW1lb3V0Iiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm1lc3NhZ2UiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInRleHQiLCJzaG93IiwidXBkYXRlX3N0YXR1cyIsImRpc3BsYXlfaW5mbyIsImhpZGVfZXJyb3IiLCJoaWRlIiwiaGlkZV9pbmZvIiwiZ2V0X3VybCIsInBhdGhuYW1lIiwicGFyc2VfbGluZSIsInJldHZhbCIsInRtcCIsImt2IiwiZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhIiwiYXJncyIsIm9wdGlvbnMiLCJleHRlbmQiLCJjcmVhdGluZyIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiY2FsbGJhY2siLCJjaGVja1ZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJzdWJtaXRfcG9zdCIsImVhY2giLCIkdGhpcyIsIiRjb3VudCIsImxpbWl0IiwiYmluZCIsInBhcmFtcyIsInBhZ2UiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0Iiwic3JjIiwiaXRlbV90aXRsZSIsInRvdGFsIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsInN0YXR1cyIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJkb3dubG9hZCIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJfbGFzdE1lc3NhZ2UiLCJfbGFzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiaW5uZXJUZXh0IiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0Iiwic2VhcmNodHlwZSIsImdldENvbnRlbnRHcm91cERhdGEiLCJjb250ZW50X2dyb3VwIiwiX3NpbXBsaWZ5UGFnZUhyZWYiLCJuZXdfaHJlZiIsInFzIiwiZ2V0UGFnZUhyZWYiLCIkbWVudSIsIiR0cmlnZ2VyIiwiJGhlYWRlciIsIiRuYXZpZ2F0b3IiLCJtb2JpZnkiLCJzdHlsZSIsInNldFByb3BlcnR5Iiwib3V0ZXJIZWlnaHQiLCIkZXhwYW5kbyIsImRvY3VtZW50RWxlbWVudCIsImRhdGFzZXQiLCJleHBhbmRlZCIsInVpIiwiJHNpZGViYXIiLCJyZXF1ZXN0RnVsbFNjcmVlbiIsInV0aWxzIiwicGFyZW50cyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJ1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkiLCJ0b3AiLCJoZWlnaHQiLCIkZm9ybV8iLCIkc3VibWl0IiwicmVtb3ZlQXR0ciIsInN6Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7QUFPQSxDQUFDLENBQUMsVUFBU0EsT0FBVCxFQUFrQjtBQUNuQixLQUFJLE9BQU9DLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0NBLE9BQU9DLEdBQTNDLEVBQWdEO0FBQy9DO0FBQ0EsTUFBSyxPQUFPQyxNQUFQLEtBQWtCLFdBQXZCLEVBQXFDO0FBQ3BDRixVQUFPLENBQUMsUUFBRCxDQUFQLEVBQW1CRCxPQUFuQjtBQUNBLEdBRkQsTUFFTztBQUNOQyxVQUFPLEVBQVAsRUFBV0QsT0FBWDtBQUNBO0FBQ0QsRUFQRCxNQU9PO0FBQ047QUFDQSxNQUFLLE9BQU9HLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENILFdBQVFHLE1BQVI7QUFDQSxHQUZELE1BRU87QUFDTkg7QUFDQTtBQUNEO0FBQ0QsQ0FoQkEsRUFnQkUsVUFBU0ksQ0FBVCxFQUFZQyxTQUFaLEVBQXVCOztBQUV6QixLQUFJQyxXQUFXO0FBQ2JDLEtBQVUsTUFERztBQUViQyxPQUFVLEtBRkc7QUFHYkMsUUFBVSxRQUhHO0FBSWJDLFFBQVUsTUFKRztBQUtiQyxVQUFVLEtBTEc7QUFNYkMsVUFBVSxLQU5HO0FBT2JDLFFBQVU7QUFQRyxFQUFmO0FBQUEsS0FVQ0MsTUFBTSxDQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCLFdBQXZCLEVBQW9DLFVBQXBDLEVBQWdELE1B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STROLFFBQVEsQ0FBRWtILFFBQVEsQ0FBVixJQUFnQnFDLEVBQWhCLEdBQXFCLENBQWpDO0FBQ0EsUUFBSUgsU0FBU2xhLEVBQUUscUJBQUYsQ0FBYjtBQUNBa2EsV0FBTzFLLE1BQVAsa0RBQTBEc0IsS0FBMUQ7QUFDQW9KLFdBQU8xSyxNQUFQLCtDQUF1RDZLLEVBQXZEO0FBQ0FILFdBQU8vQixNQUFQO0FBQ0QsR0FSRDtBQVNELENBaENEOzs7QUNBQXJTLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQi9GLE1BQUUsY0FBRixFQUFrQmdRLEtBQWxCLENBQXdCLFVBQVMxTCxDQUFULEVBQVk7QUFDaENBLFVBQUUyTCxjQUFGO0FBQ0E3SSxnQkFBUWlLLEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgLy8gdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAvLyB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIC8vIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIC8vICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gIC8vICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gIC8vICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgLy8gICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gIC8vICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAvLyAgICAgICB9LCA1MCk7XG4gIC8vICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAvLyAgICAgICB9LCA1MDApO1xuXG4gIC8vICAgICB9XG4gIC8vIH1cblxuICBIVC5hbmFseXRpY3MgPSBIVC5hbmFseXRpY3MgfHwge307XG4gIEhULmFuYWx5dGljcy5sb2dBY3Rpb24gPSBmdW5jdGlvbihocmVmLCB0cmlnZ2VyKSB7XG4gICAgaWYgKCBocmVmID09PSB1bmRlZmluZWQgKSB7IGhyZWYgPSBsb2NhdGlvbi5ocmVmIDsgfVxuICAgIHZhciBkZWxpbSA9IGhyZWYuaW5kZXhPZignOycpID4gLTEgPyAnOycgOiAnJic7XG4gICAgaWYgKCB0cmlnZ2VyID09IG51bGwgKSB7IHRyaWdnZXIgPSAnLSc7IH1cbiAgICBocmVmICs9IGRlbGltICsgJ2E9JyArIHRyaWdnZXI7XG4gICAgJC5nZXQoaHJlZik7XG4gIH1cblxuXG4gICQoXCJib2R5XCIpLm9uKCdjbGljaycsICdhW2RhdGEtdHJhY2tpbmctY2F0ZWdvcnk9XCJvdXRMaW5rc1wiXScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gdmFyIHRyaWdnZXIgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWFjdGlvbicpO1xuICAgIC8vIHZhciBsYWJlbCA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctbGFiZWwnKTtcbiAgICAvLyBpZiAoIGxhYmVsICkgeyB0cmlnZ2VyICs9ICc6JyArIGxhYmVsOyB9XG4gICAgdmFyIHRyaWdnZXIgPSAnb3V0JyArICQodGhpcykuYXR0cignaHJlZicpO1xuICAgIEhULmFuYWx5dGljcy5sb2dBY3Rpb24odW5kZWZpbmVkLCB0cmlnZ2VyKTtcbiAgfSlcblxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIGlmICgkKCcjYWNjZXNzQmFubmVySUQnKS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3VwcHJlc3MgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ3N1cGFjY2JhbicpO1xuICAgICAgaWYgKHN1cHByZXNzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRlYnVnID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdodGRldicpO1xuICAgICAgdmFyIGlkaGFzaCA9ICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCB1bmRlZmluZWQsIHtqc29uIDogdHJ1ZX0pO1xuICAgICAgdmFyIHVybCA9ICQudXJsKCk7IC8vIHBhcnNlIHRoZSBjdXJyZW50IHBhZ2UgVVJMXG4gICAgICB2YXIgY3VycmlkID0gdXJsLnBhcmFtKCdpZCcpO1xuICAgICAgaWYgKGlkaGFzaCA9PSBudWxsKSB7XG4gICAgICAgICAgaWRoYXNoID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGlkIGluIGlkaGFzaCkge1xuICAgICAgICAgIGlmIChpZGhhc2guaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoaWRzLmluZGV4T2YoY3VycmlkKSA8IDApIHx8IGRlYnVnKSB7XG4gICAgICAgICAgaWRoYXNoW2N1cnJpZF0gPSAxO1xuICAgICAgICAgIC8vIHNlc3Npb24gY29va2llXG4gICAgICAgICAgJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIGlkaGFzaCwgeyBqc29uIDogdHJ1ZSwgcGF0aDogJy8nLCBkb21haW46ICcuaGF0aGl0cnVzdC5vcmcnIH0pO1xuXG4gICAgICAgICAgZnVuY3Rpb24gc2hvd0FsZXJ0KCkge1xuICAgICAgICAgICAgICB2YXIgaHRtbCA9ICQoJyNhY2Nlc3NCYW5uZXJJRCcpLmh0bWwoKTtcbiAgICAgICAgICAgICAgdmFyICRhbGVydCA9IGJvb3Rib3guZGlhbG9nKGh0bWwsIFt7IGxhYmVsOiBcIk9LXCIsIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIgfV0sIHsgaGVhZGVyIDogJ1NwZWNpYWwgYWNjZXNzJywgcm9sZTogJ2FsZXJ0ZGlhbG9nJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoc2hvd0FsZXJ0LCAzMDAwLCB0cnVlKTtcbiAgICAgIH1cbiAgfVxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9IFwiYlwiO1xuXG4gICAgdmFyIElOX1lPVVJfQ09MTFNfTEFCRUwgPSAnVGhpcyBpdGVtIGlzIGluIHlvdXIgY29sbGVjdGlvbihzKTonO1xuXG4gICAgdmFyICR0b29sYmFyID0gJChcIi5jb2xsZWN0aW9uTGlua3MgLnNlbGVjdC1jb2xsZWN0aW9uXCIpO1xuICAgIHZhciAkZXJyb3Jtc2cgPSAkKFwiLmVycm9ybXNnXCIpO1xuICAgIHZhciAkaW5mb21zZyA9ICQoXCIuaW5mb21zZ1wiKTtcblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfZXJyb3IobXNnKSB7XG4gICAgICAgIGlmICggISAkZXJyb3Jtc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGVycm9ybXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yIGVycm9ybXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGVycm9ybXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2luZm8obXNnKSB7XG4gICAgICAgIGlmICggISAkaW5mb21zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkaW5mb21zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvIGluZm9tc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkaW5mb21zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9lcnJvcigpIHtcbiAgICAgICAgJGVycm9ybXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9pbmZvKCkge1xuICAgICAgICAkaW5mb21zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF91cmwoKSB7XG4gICAgICAgIHZhciB1cmwgPSBcIi9jZ2kvbWJcIjtcbiAgICAgICAgaWYgKCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL3NoY2dpL1wiKSA+IC0xICkge1xuICAgICAgICAgICAgdXJsID0gXCIvc2hjZ2kvbWJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlX2xpbmUoZGF0YSkge1xuICAgICAgICB2YXIgcmV0dmFsID0ge307XG4gICAgICAgIHZhciB0bXAgPSBkYXRhLnNwbGl0KFwifFwiKTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRtcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX0gdG8geW91ciBsaXN0LmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuICB2YXIgaSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NraW49Y3Jtc3dvcmxkJyk7XG4gIGlmICggaSArIDEgIT0gMCApIHtcbiAgICAgIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1Xb3JsZCc7XG4gIH1cblxuICAvLyBkaXNwbGF5IGJpYiBpbmZvcm1hdGlvblxuICB2YXIgJGRpdiA9ICQoXCIuYmliTGlua3NcIik7XG4gIHZhciAkcCA9ICRkaXYuZmluZChcInA6Zmlyc3RcIik7XG4gICRwLmZpbmQoXCJzcGFuOmVtcHR5XCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKHRoaXMpLnRleHQoJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSkuYWRkQ2xhc3MoXCJibG9ja2VkXCIpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gJzxzcGFuIGNsYXNzPVwiYmxvY2tlZFwiPjxzdHJvbmc+e2xhYmVsfTo8L3N0cm9uZz4ge2NvbnRlbnR9PC9zcGFuPic7XG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UoJ3tsYWJlbH0nLCAkKHRoaXMpLmF0dHIoJ3Byb3BlcnR5Jykuc3Vic3RyKDMpKS5yZXBsYWNlKCd7Y29udGVudH0nLCAkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKTtcbiAgICAgICRwLmFwcGVuZChmcmFnbWVudCk7XG4gIH0pXG5cbiAgdmFyICRsaW5rID0gJChcIiNlbWJlZEh0bWxcIik7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBFTUJFRFwiLCAkbGluayk7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xuXG4gICRsaW5rID0gJChcImFbZGF0YS10b2dnbGU9J1BUIEZpbmQgaW4gYSBMaWJyYXJ5J11cIik7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xufSlcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAvLyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LXN1Y2Nlc3MgZG9uZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAvLyAgICAgJzxwPkFsbCBkb25lITwvcD4nICtcbiAgICAgICAgICAgIC8vICc8L2Rpdj4nICsgXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiIGRvd25sb2FkPVwiZG93bmxvYWRcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoICRkb3dubG9hZF9idG4uZ2V0KDApLmRvd25sb2FkID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIGFuZCBkbyB0aGlzIGhlcmVcbiAgICAkKFwiI3NlbGVjdGVkUGFnZXNQZGZMaW5rXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBwcmludGFibGUgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKCBwcmludGFibGUubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBwcmludC48L3A+XCIgXTtcbiAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYXBwZWFyIGluIHRoZSBzZWxlY3Rpb24gY29udGVudHMgPGJ1dHRvbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgYm9yZGVyLWNvbG9yOiAjZWVlXFxcIiBjbGFzcz1cXFwiYnRuIHNxdWFyZVxcXCI+PGkgY2xhc3M9XFxcImljb21vb24gaWNvbW9vbi1wYXBlcnNcXFwiIHN0eWxlPVxcXCJjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMTRweDtcXFwiIC8+PC9idXR0b24+XCIpO1xuXG4gICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBzZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24ocHJpbnRhYmxlKTtcblxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3NlcScsIHNlcSk7XG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgfSk7XG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dDtcbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rICcgK1xuICAgICAgICAgICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAgICAgICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48aSBjbGFzcz1cImljb21vb24gaWNvbW9vbi1oZWxwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+SGVscDogRW1iZWRkaW5nIEhhdGhpVHJ1c3QgQm9va3M8L3NwYW4+PC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHJldHVybjtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuICBIVCA9IEhUIHx8IHt9O1xuXG4gIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuICAgIC8vICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuICAgIC8vIH1cblxuICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuICAgICRuYXZpZ2F0b3IgPSAkKFwiLm5hdmlnYXRvclwiKTtcbiAgICBpZiAoICRuYXZpZ2F0b3IubGVuZ3RoICkge1xuICAgICAgJG5hdmlnYXRvci5nZXQoMCkuc3R5bGUuc2V0UHJvcGVydHkoJy0taGVpZ2h0JywgYC0keyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKSAqIDAuOTB9cHhgKTtcbiAgICAgIHZhciAkZXhwYW5kbyA9ICRuYXZpZ2F0b3IuZmluZChcIi5hY3Rpb24tZXhwYW5kb1wiKTtcbiAgICAgICRleHBhbmRvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKTtcbiAgICAgIH0pXG5cbiAgICAgIGlmICggSFQucGFyYW1zLnVpID09ICdlbWJlZCcgKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRleHBhbmRvLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIEhULiRtZW51ID0gJG1lbnU7XG5cbiAgICB2YXIgJHNpZGViYXIgPSAkKFwiI3NpZGViYXJcIik7XG5cbiAgICAkdHJpZ2dlciA9ICRzaWRlYmFyLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIik7XG4gICAgLy8gJHRyaWdnZXIub24oJ2NsaWNrZWQnLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgdmFyIGFjdGl2ZSA9ICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZSc7XG4gICAgLy8gICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC52aWV3ID0gYWN0aXZlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG4gICAgLy8gfSlcblxuICAgICQoXCIjYWN0aW9uLW1vYmlsZS10b2dnbGUtZnVsbHNjcmVlblwiKS5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5yZXF1ZXN0RnVsbFNjcmVlbigpO1xuICAgIH0pXG5cbiAgICBIVC51dGlscyA9IEhULnV0aWxzIHx8IHt9O1xuXG4gICAgJHNpZGViYXIub24oJ2NsaWNrJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIC8vIGhpZGUgdGhlIHNpZGViYXJcbiAgICAgIHZhciAkdGhpcyA9ICQoZXZlbnQudGFyZ2V0KTtcbiAgICAgIGlmICggJHRoaXMuaXMoXCJpbnB1dFt0eXBlPSd0ZXh0J10sc2VsZWN0XCIpICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLnBhcmVudHMoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpLmxlbmd0aCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5pcyhcImJ1dHRvbixhXCIpICkge1xuICAgICAgICBIVC50b2dnbGUoZmFsc2UpO1xuICAgICAgfVxuICAgIH0pXG5cbiAgICAvLyB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG5cbiAgICAvLyAkKHdpbmRvdykub24oXCJyZXNpemVcIiwgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG4gICAgLy8gfSlcblxuICAgIC8vICQod2luZG93KS5vbihcIm9yaWVudGF0aW9uY2hhbmdlXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyAgICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5zdHlsZS5zZXRQcm9wZXJ0eSgnLS12aCcsIHZoICsgJ3B4Jyk7XG5cbiAgICAvLyAgICAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgLy8gICAgIH0sIDEwMCk7XG4gICAgLy8gfSlcbiAgICBpZiAoIEhUICYmIEhULnV0aWxzICYmIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlICkge1xuICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbiAgICB9XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAndHJ1ZSc7XG4gIH1cblxuICBIVC50b2dnbGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuXG4gICAgJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC5zaWRlYmFyRXhwYW5kZWQgPSBzdGF0ZTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC52aWV3ID0gc3RhdGUgPyAnb3B0aW9ucycgOiAndmlld2VyJztcblxuICAgIC8vIHZhciB4bGlua19ocmVmO1xuICAgIC8vIGlmICggJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcpID09ICd0cnVlJyApIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWV4cGFuZGVkJztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtY29sbGFwc2VkJztcbiAgICAvLyB9XG4gICAgLy8gJHRyaWdnZXIuZmluZChcInN2ZyB1c2VcIikuYXR0cihcInhsaW5rOmhyZWZcIiwgeGxpbmtfaHJlZik7XG4gIH1cblxuICBzZXRUaW1lb3V0KEhULm1vYmlmeSwgMTAwMCk7XG5cbiAgdmFyIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBoID0gJChcIiNzaWRlYmFyIC5zaWRlYmFyLXRvZ2dsZS1idXR0b25cIikub3V0ZXJIZWlnaHQoKSB8fCA0MDtcbiAgICB2YXIgdG9wID0gKCAkKFwiaGVhZGVyXCIpLmhlaWdodCgpICsgaCApICogMS4wNTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdG9vbGJhci1ob3Jpem9udGFsLXRvcCcsIHRvcCArICdweCcpO1xuICB9XG4gICQod2luZG93KS5vbigncmVzaXplJywgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5KTtcbiAgdXBkYXRlVG9vbGJhclRvcFByb3BlcnR5KCk7XG5cbiAgJChcImh0bWxcIikuZ2V0KDApLnNldEF0dHJpYnV0ZSgnZGF0YS1zaWRlYmFyLWV4cGFuZGVkJywgZmFsc2UpO1xuXG59KVxuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgdmFyICRmb3JtID0gJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIik7XG4gICRmb3JtLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgJGZvcm1fID0gJCh0aGlzKTtcbiAgICB2YXIgJHN1Ym1pdCA9ICRmb3JtXy5maW5kKFwiYnV0dG9uW3R5cGU9c3VibWl0XVwiKTtcbiAgICBpZiAoICRzdWJtaXQuaGFzQ2xhc3MoXCJidG4tbG9hZGluZ1wiKSApIHtcbiAgICAgIGFsZXJ0KFwiWW91ciBzZWFyY2ggcXVlcnkgaGFzIGJlZW4gc3VibWl0dGVkIGFuZCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRpbnB1dCA9ICRmb3JtXy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XVwiKVxuICAgIGlmICggISAkLnRyaW0oJGlucHV0LnZhbCgpKSApIHtcbiAgICAgIGJvb3Rib3guYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSB0ZXJtIGluIHRoZSBzZWFyY2ggYm94LlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJHN1Ym1pdC5hZGRDbGFzcyhcImJ0bi1sb2FkaW5nXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICRzdWJtaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pXG5cbiAgJChcIiNhY3Rpb24tc3RhcnQtanVtcFwiKS5vbignY2hhbmdlJywgZnVuY3Rpb24oKSB7XG4gICAgdmFyIHN6ID0gcGFyc2VJbnQoJCh0aGlzKS5kYXRhKCdzeicpLCAxMCk7XG4gICAgdmFyIHZhbHVlID0gcGFyc2VJbnQoJCh0aGlzKS52YWwoKSwgMTApO1xuICAgIHZhciBzdGFydCA9ICggdmFsdWUgLSAxICkgKiBzeiArIDE7XG4gICAgdmFyICRmb3JtXyA9ICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpO1xuICAgICRmb3JtXy5hcHBlbmQoYDxpbnB1dCBuYW1lPSdzdGFydCcgdHlwZT1cImhpZGRlblwiIHZhbHVlPVwiJHtzdGFydH1cIiAvPmApO1xuICAgICRmb3JtXy5hcHBlbmQoYDxpbnB1dCBuYW1lPSdzeicgdHlwZT1cImhpZGRlblwiIHZhbHVlPVwiJHtzen1cIiAvPmApO1xuICAgICRmb3JtXy5zdWJtaXQoKTtcbiAgfSlcbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCIjdmVyc2lvbkljb25cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
