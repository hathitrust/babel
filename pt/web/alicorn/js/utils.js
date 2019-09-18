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
                $download_btn = $('<a class="download-pdf btn btn-primary">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
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
      if ($this.is("input[type='text']")) {
        return;
      }
      if ($this.parents("#form-search-volume").length) {
        return;
      }
      HT.toggle(false);
    });

    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');

    $(window).on("resize", function () {
      var vh = window.innerHeight * 0.01;
      document.documentElement.style.setProperty('--vh', vh + 'px');
    });

    $(window).on("orientationchange", function () {
      setTimeout(function () {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');

        HT.utils.handleOrientationChange();
      }, 100);
    });
    document.documentElement.dataset.expanded = 'true';
  };

  HT.toggle = function (state) {

    $trigger.attr('aria-expanded', state);
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
});

// head.ready(function() {
//   var $menu; var $trigger; var $header; var $navigator;
//   HT = HT || {};

//   HT.is_mobile = $("html").is(".mobile") || ( HT.params.debug && HT.params.debug.indexOf('mobile') > -1 );

//   HT.mobify = function() {

//     if ( $("html").is(".desktop") ) {
//       $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
//     }

//     $header = $("header");
//     $navigator = $(".navigator");
//     if ( $navigator.length ) {
//       $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
//       var $expando = $navigator.find(".action-expando");
//       $expando.on('click', function() {
//         document.documentElement.dataset.expanded = ! ( document.documentElement.dataset.expanded == 'true' );
//       })
//     }

//     HT.$menu = $menu;

//     var $sidebar = $("#sidebar");

//     $trigger = $sidebar.find("button[aria-expanded]");
//     $trigger.on('clicked', function(event) {
//       var active = $trigger.attr('aria-expanded') == 'true';
//       $("html").get(0).dataset.view = active ? 'options' : 'viewer';
//     })

//     $("#action-mobile-toggle-fullscreen").on('click', function() {
//       document.documentElement.requestFullScreen();
//     })

//     HT.utils = HT.utils || {};

//     $sidebar.on('click', function(event) {
//       // hide the sidebar
//       var $this = $(event.target);
//       if ( $this.is("input[type='text']") ) {
//         return;
//       }
//       if ( $this.parents("#form-search-volume").length ) {
//         return;
//       }
//       HT.toggle(false);
//     })

//     var vh = window.innerHeight * 0.01;
//     document.documentElement.style.setProperty('--vh', vh + 'px');

//     $(window).on("resize", function() {
//         var vh = window.innerHeight * 0.01;
//         document.documentElement.style.setProperty('--vh', vh + 'px');
//     })

//     $(window).on("orientationchange", function() {
//         setTimeout(function() {
//             var vh = window.innerHeight * 0.01;
//             document.documentElement.style.setProperty('--vh', vh + 'px');

//             HT.utils.handleOrientationChange();
//         }, 100);
//     })
//     document.documentElement.dataset.expanded = 'true';
//   }

//   HT.toggle = function(state) {

//     $trigger.attr('aria-expanded', state);
//     $("html").get(0).dataset.view = state ? 'options' : 'viewer';

//     var xlink_href;
//     if ( $trigger.attr('aria-expanded') == 'true' ) {
//       xlink_href = '#panel-expanded';
//     } else {
//       xlink_href = '#panel-collapsed';
//     }
//     $trigger.find("svg use").attr("xlink:href", xlink_href);
//   }

//   if ( HT.is_mobile ) {
//     setTimeout(HT.mobify, 1000);
//   }
// })
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsImFuYWx5dGljcyIsImxvZ0FjdGlvbiIsImhyZWYiLCJ0cmlnZ2VyIiwiZGVsaW0iLCJnZXQiLCJvbiIsImV2ZW50Iiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY29va2llIiwianNvbiIsImN1cnJpZCIsImlkcyIsImlkIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZXRUaW1lb3V0Iiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm1lc3NhZ2UiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInRleHQiLCJzaG93IiwidXBkYXRlX3N0YXR1cyIsImRpc3BsYXlfaW5mbyIsImhpZGVfZXJyb3IiLCJoaWRlIiwiaGlkZV9pbmZvIiwiZ2V0X3VybCIsInBhdGhuYW1lIiwicGFyc2VfbGluZSIsInJldHZhbCIsInRtcCIsImt2IiwiZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhIiwiYXJncyIsIm9wdGlvbnMiLCJleHRlbmQiLCJjcmVhdGluZyIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiY2FsbGJhY2siLCJjaGVja1ZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJzdWJtaXRfcG9zdCIsImVhY2giLCIkdGhpcyIsIiRjb3VudCIsImxpbWl0IiwiYmluZCIsInBhcmFtcyIsInBhZ2UiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0Iiwic3JjIiwiaXRlbV90aXRsZSIsInRvdGFsIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsInN0YXR1cyIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJyZWFkZXIiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9jbGVhclNlbGVjdGlvbiIsInN0b3BQcm9wYWdhdGlvbiIsImZvY3VzIiwiTWF0aCIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInBhcnNlSW50IiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJyYXRlIiwibm93IiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiX2xhc3RNZXNzYWdlIiwiX2xhc3RUaW1lciIsImNsZWFyVGltZW91dCIsImlubmVyVGV4dCIsIkVPVCIsImRvd25sb2FkZXIiLCJjcmVhdGUiLCJwcmludGFibGUiLCJfZ2V0UGFnZVNlbGVjdGlvbiIsImJ1dHRvbnMiLCJzZXEiLCJfZ2V0RmxhdHRlbmVkU2VsZWN0aW9uIiwic2lkZV9zaG9ydCIsInNpZGVfbG9uZyIsImh0SWQiLCJlbWJlZEhlbHBMaW5rIiwiY29kZWJsb2NrX3R4dCIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsInRleHRhcmVhIiwic2VsZWN0IiwiZmVlZGJhY2siLCIkZm9ybSIsIlJlY29yZFVSTCIsIiRlbWFpbCIsImluaXRlZCIsIiRpbnB1dCIsIiRpbnB1dF9sYWJlbCIsIiRzZWxlY3QiLCIkc2VhcmNoX3RhcmdldCIsIiRmdCIsIiRiYWNrZHJvcCIsIiRhY3Rpb24iLCJvblNob3ciLCJtb2RhbCIsIl9zZXR1cCIsImxzIiwiY2F0YWxvZyIsInRhcmdldCIsInByZWZzIiwic2VhcmNoIiwiZnQiLCJ2YWx1ZSIsInRyYWNrRXZlbnQiLCJjYXRlZ29yeSIsInN1Ym1pdCIsInNlYXJjaHR5cGUiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiJG1lbnUiLCIkdHJpZ2dlciIsIiRoZWFkZXIiLCIkbmF2aWdhdG9yIiwibW9iaWZ5Iiwic3R5bGUiLCJzZXRQcm9wZXJ0eSIsIm91dGVySGVpZ2h0IiwiJGV4cGFuZG8iLCJkb2N1bWVudEVsZW1lbnQiLCJkYXRhc2V0IiwiZXhwYW5kZWQiLCIkc2lkZWJhciIsInJlcXVlc3RGdWxsU2NyZWVuIiwidXRpbHMiLCJwYXJlbnRzIiwidmgiLCJpbm5lckhlaWdodCIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCIkZm9ybV8iLCIkc3VibWl0IiwicmVtb3ZlQXR0ciIsInN6Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7QUFPQSxDQUFDLENBQUMsVUFBU0EsT0FBVCxFQUFrQjtBQUNuQixLQUFJLE9BQU9DLE1BQVAsS0FBa0IsVUFBbEIsSUFBZ0NBLE9BQU9DLEdBQTNDLEVBQWdEO0FBQy9DO0FBQ0EsTUFBSyxPQUFPQyxNQUFQLEtBQWtCLFdBQXZCLEVBQXFDO0FBQ3BDRixVQUFPLENBQUMsUUFBRCxDQUFQLEVBQW1CRCxPQUFuQjtBQUNBLEdBRkQsTUFFTztBQUNOQyxVQUFPLEVBQVAsRUFBV0QsT0FBWDtBQUNBO0FBQ0QsRUFQRCxNQU9PO0FBQ047QUFDQSxNQUFLLE9BQU9HLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENILFdBQVFHLE1BQVI7QUFDQSxHQUZELE1BRU87QUFDTkg7QUFDQTtBQUNEO0FBQ0QsQ0FoQkEsRUFnQkUsVUFBU0ksQ0FBVCxFQUFZQyxTQUFaLEVBQXVCOztBQUV6QixLQUFJQyxXQUFXO0FBQ2JDLEtBQVUsTUFERztBQUViQyxPQUFVLEtBRkc7QUFHYkMsUUFBVSxRQUhHO0FBSWJDLFFBQVUsTUFKRztBQUtiQyxVQUFVLEtBTEc7QUFNYkMsVUFBVSxLQU5HO0FBT2JDLFFBQVU7QUFQRyxFQUFmO0FBQUEsS0FVQ0MsTUFBTSxDQUFDLFFBQUQsRUFBVyxVQUFYLEVBQXVCLFdBQXZCLEVBQW9DLFVBQXBDLEVBQWdELE1BQWhELEVBQXdELFVBQXhELEVBQW9FLE1BQXBFLEVBQTRFLE1BQTVFLEVBQW9GLFVBQXBGLEVBQWdH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O0FBQ0E4WixXQUFPdEssTUFBUCxrREFBMERzQixLQUExRDtBQUNBZ0osV0FBT3RLLE1BQVAsK0NBQXVEeUssRUFBdkQ7QUFDQUgsV0FBTzVCLE1BQVA7QUFDRCxHQVJEO0FBU0QsQ0FoQ0Q7OztBQ0FBcFMsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCL0YsTUFBRSxjQUFGLEVBQWtCZ1EsS0FBbEIsQ0FBd0IsVUFBUzFMLENBQVQsRUFBWTtBQUNoQ0EsVUFBRTJMLGNBQUY7QUFDQTdJLGdCQUFRaUssS0FBUixDQUFjLG9ZQUFkO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IFVSTCBQYXJzZXIgcGx1Z2luLCB2Mi4yLjFcbiAqIERldmVsb3BlZCBhbmQgbWFpbnRhbmluZWQgYnkgTWFyayBQZXJraW5zLCBtYXJrQGFsbG1hcmtlZHVwLmNvbVxuICogU291cmNlIHJlcG9zaXRvcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlclxuICogTGljZW5zZWQgdW5kZXIgYW4gTUlULXN0eWxlIGxpY2Vuc2UuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXIvYmxvYi9tYXN0ZXIvTElDRU5TRSBmb3IgZGV0YWlscy5cbiAqLyBcblxuOyhmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQgYXZhaWxhYmxlOyB1c2UgYW5vbnltb3VzIG1vZHVsZVxuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gTm8gQU1EIGF2YWlsYWJsZTsgbXV0YXRlIGdsb2JhbCB2YXJzXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGZhY3RvcnkoalF1ZXJ5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmFjdG9yeSgpO1xuXHRcdH1cblx0fVxufSkoZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cdFxuXHR2YXIgdGFnMmF0dHIgPSB7XG5cdFx0XHRhICAgICAgIDogJ2hyZWYnLFxuXHRcdFx0aW1nICAgICA6ICdzcmMnLFxuXHRcdFx0Zm9ybSAgICA6ICdhY3Rpb24nLFxuXHRcdFx0YmFzZSAgICA6ICdocmVmJyxcblx0XHRcdHNjcmlwdCAgOiAnc3JjJyxcblx0XHRcdGlmcmFtZSAgOiAnc3JjJyxcblx0XHRcdGxpbmsgICAgOiAnaHJlZidcblx0XHR9LFxuXHRcdFxuXHRcdGtleSA9IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2ZyYWdtZW50J10sIC8vIGtleXMgYXZhaWxhYmxlIHRvIHF1ZXJ5XG5cdFx0XG5cdFx0YWxpYXNlcyA9IHsgJ2FuY2hvcicgOiAnZnJhZ21lbnQnIH0sIC8vIGFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG5cdFx0XG5cdFx0cGFyc2VyID0ge1xuXHRcdFx0c3RyaWN0IDogL14oPzooW146XFwvPyNdKyk6KT8oPzpcXC9cXC8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLCAgLy9sZXNzIGludHVpdGl2ZSwgbW9yZSBhY2N1cmF0ZSB0byB0aGUgc3BlY3Ncblx0XHRcdGxvb3NlIDogIC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvIC8vIG1vcmUgaW50dWl0aXZlLCBmYWlscyBvbiByZWxhdGl2ZSBwYXRocyBhbmQgZGV2aWF0ZXMgZnJvbSBzcGVjc1xuXHRcdH0sXG5cdFx0XG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdFxuXHRcdGlzaW50ID0gL15bMC05XSskLztcblx0XG5cdGZ1bmN0aW9uIHBhcnNlVXJpKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0dmFyIHN0ciA9IGRlY29kZVVSSSggdXJsICksXG5cdFx0cmVzICAgPSBwYXJzZXJbIHN0cmljdE1vZGUgfHwgZmFsc2UgPyAnc3RyaWN0JyA6ICdsb29zZScgXS5leGVjKCBzdHIgKSxcblx0XHR1cmkgPSB7IGF0dHIgOiB7fSwgcGFyYW0gOiB7fSwgc2VnIDoge30gfSxcblx0XHRpICAgPSAxNDtcblx0XHRcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHVyaS5hdHRyWyBrZXlbaV0gXSA9IHJlc1tpXSB8fCAnJztcblx0XHR9XG5cdFx0XG5cdFx0Ly8gYnVpbGQgcXVlcnkgYW5kIGZyYWdtZW50IHBhcmFtZXRlcnNcdFx0XG5cdFx0dXJpLnBhcmFtWydxdWVyeSddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ3F1ZXJ5J10pO1xuXHRcdHVyaS5wYXJhbVsnZnJhZ21lbnQnXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydmcmFnbWVudCddKTtcblx0XHRcblx0XHQvLyBzcGxpdCBwYXRoIGFuZCBmcmFnZW1lbnQgaW50byBzZWdtZW50c1x0XHRcblx0XHR1cmkuc2VnWydwYXRoJ10gPSB1cmkuYXR0ci5wYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7ICAgICBcblx0XHR1cmkuc2VnWydmcmFnbWVudCddID0gdXJpLmF0dHIuZnJhZ21lbnQucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTtcblx0XHRcblx0XHQvLyBjb21waWxlIGEgJ2Jhc2UnIGRvbWFpbiBhdHRyaWJ1dGUgICAgICAgIFxuXHRcdHVyaS5hdHRyWydiYXNlJ10gPSB1cmkuYXR0ci5ob3N0ID8gKHVyaS5hdHRyLnByb3RvY29sID8gIHVyaS5hdHRyLnByb3RvY29sKyc6Ly8nK3VyaS5hdHRyLmhvc3QgOiB1cmkuYXR0ci5ob3N0KSArICh1cmkuYXR0ci5wb3J0ID8gJzonK3VyaS5hdHRyLnBvcnQgOiAnJykgOiAnJzsgICAgICBcblx0XHQgIFxuXHRcdHJldHVybiB1cmk7XG5cdH07XG5cdFxuXHRmdW5jdGlvbiBnZXRBdHRyTmFtZSggZWxtICkge1xuXHRcdHZhciB0biA9IGVsbS50YWdOYW1lO1xuXHRcdGlmICggdHlwZW9mIHRuICE9PSAndW5kZWZpbmVkJyApIHJldHVybiB0YWcyYXR0clt0bi50b0xvd2VyQ2FzZSgpXTtcblx0XHRyZXR1cm4gdG47XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHByb21vdGUocGFyZW50LCBrZXkpIHtcblx0XHRpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuXHRcdHZhciB0ID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBwYXJlbnRba2V5XSkgdFtpXSA9IHBhcmVudFtrZXldW2ldO1xuXHRcdHBhcmVudFtrZXldID0gdDtcblx0XHRyZXR1cm4gdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdGlmICghcGFydCkge1xuXHRcdFx0aWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldLnB1c2godmFsKTtcblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG5cdFx0XHRpZiAoJ10nID09IHBhcnQpIHtcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRcdGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuXHRcdFx0XHRcdG9ialtrZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh+cGFydC5pbmRleE9mKCddJykpIHtcblx0XHRcdFx0cGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0XHQvLyBrZXlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHRpZiAofmtleS5pbmRleE9mKCddJykpIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0bGFzdCA9IGxlbiAtIDE7XG5cdFx0XHRwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG5cdFx0XHRcdHZhciB0ID0ge307XG5cdFx0XHRcdGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcblx0XHRcdFx0cGFyZW50LmJhc2UgPSB0O1xuXHRcdFx0fVxuXHRcdFx0c2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcblx0XHRyZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KC8mfDsvKSwgZnVuY3Rpb24ocmV0LCBwYWlyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYWlyID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdC8vIGlnbm9yZVxuXHRcdFx0fVxuXHRcdFx0dmFyIGVxbCA9IHBhaXIuaW5kZXhPZignPScpLFxuXHRcdFx0XHRicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpLFxuXHRcdFx0XHRrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpLFxuXHRcdFx0XHR2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKSxcblx0XHRcdFx0dmFsID0gdmFsLnN1YnN0cih2YWwuaW5kZXhPZignPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cblx0XHRcdGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuXG5cdFx0XHRyZXR1cm4gbWVyZ2UocmV0LCBrZXksIHZhbCk7XG5cdFx0fSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuXHRcdHZhciB2ID0gb2JqW2tleV07XG5cdFx0aWYgKHVuZGVmaW5lZCA9PT0gdikge1xuXHRcdFx0b2JqW2tleV0gPSB2YWw7XG5cdFx0fSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG5cdFx0XHR2LnB1c2godmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2JqW2tleV0gPSBbdiwgdmFsXTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuXHRcdHZhciBsZW4gPSBzdHIubGVuZ3RoLFxuXHRcdFx0IGJyYWNlLCBjO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0XHRcdGMgPSBzdHJbaV07XG5cdFx0XHRpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG5cdFx0XHRpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcblx0XHRcdGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gcmVkdWNlKG9iaiwgYWNjdW11bGF0b3Ipe1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGwgPSBvYmoubGVuZ3RoID4+IDAsXG5cdFx0XHRjdXJyID0gYXJndW1lbnRzWzJdO1xuXHRcdHdoaWxlIChpIDwgbCkge1xuXHRcdFx0aWYgKGkgaW4gb2JqKSBjdXJyID0gYWNjdW11bGF0b3IuY2FsbCh1bmRlZmluZWQsIGN1cnIsIG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdCsraTtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGlzQXJyYXkodkFyZykge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodkFyZykgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0fVxuXHRcblx0ZnVuY3Rpb24ga2V5cyhvYmopIHtcblx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdGZvciAoIHByb3AgaW4gb2JqICkge1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgKSBrZXlzLnB1c2gocHJvcCk7XG5cdFx0fVxuXHRcdHJldHVybiBrZXlzO1xuXHR9XG5cdFx0XG5cdGZ1bmN0aW9uIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdXJsID09PSB0cnVlICkge1xuXHRcdFx0c3RyaWN0TW9kZSA9IHRydWU7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHN0cmljdE1vZGUgPSBzdHJpY3RNb2RlIHx8IGZhbHNlO1xuXHRcdHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24udG9TdHJpbmcoKTtcblx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdFxuXHRcdFx0ZGF0YSA6IHBhcnNlVXJpKHVybCwgc3RyaWN0TW9kZSksXG5cdFx0XHRcblx0XHRcdC8vIGdldCB2YXJpb3VzIGF0dHJpYnV0ZXMgZnJvbSB0aGUgVVJJXG5cdFx0XHRhdHRyIDogZnVuY3Rpb24oIGF0dHIgKSB7XG5cdFx0XHRcdGF0dHIgPSBhbGlhc2VzW2F0dHJdIHx8IGF0dHI7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEuYXR0clthdHRyXSA6IHRoaXMuZGF0YS5hdHRyO1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG5cdFx0XHRwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0ucXVlcnlbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHBhcmFtZXRlcnNcblx0XHRcdGZwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnRbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHBhdGggc2VnbWVudHNcblx0XHRcdHNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcucGF0aC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoW3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHNlZ21lbnRzXG5cdFx0XHRmc2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQ7ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5mcmFnbWVudC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0ICAgIFx0XG5cdFx0fTtcblx0XG5cdH07XG5cdFxuXHRpZiAoIHR5cGVvZiAkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcblx0XHQkLmZuLnVybCA9IGZ1bmN0aW9uKCBzdHJpY3RNb2RlICkge1xuXHRcdFx0dmFyIHVybCA9ICcnO1xuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0dXJsID0gJCh0aGlzKS5hdHRyKCBnZXRBdHRyTmFtZSh0aGlzWzBdKSApIHx8ICcnO1xuXHRcdFx0fSAgICBcblx0XHRcdHJldHVybiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKTtcblx0XHR9O1xuXHRcdFxuXHRcdCQudXJsID0gcHVybDtcblx0XHRcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cucHVybCA9IHB1cmw7XG5cdH1cblxufSk7XG5cbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAvLyB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIC8vIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgLy8gSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgLy8gICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgLy8gICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgLy8gICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAvLyAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgLy8gICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gIC8vICAgICAgIH0sIDUwKTtcbiAgLy8gICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gIC8vICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gIC8vICAgICAgIH0sIDUwMCk7XG5cbiAgLy8gICAgIH1cbiAgLy8gfVxuXG4gIEhULmFuYWx5dGljcyA9IEhULmFuYWx5dGljcyB8fCB7fTtcbiAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbiA9IGZ1bmN0aW9uKGhyZWYsIHRyaWdnZXIpIHtcbiAgICBpZiAoIGhyZWYgPT09IHVuZGVmaW5lZCApIHsgaHJlZiA9IGxvY2F0aW9uLmhyZWYgOyB9XG4gICAgdmFyIGRlbGltID0gaHJlZi5pbmRleE9mKCc7JykgPiAtMSA/ICc7JyA6ICcmJztcbiAgICBpZiAoIHRyaWdnZXIgPT0gbnVsbCApIHsgdHJpZ2dlciA9ICctJzsgfVxuICAgIGhyZWYgKz0gZGVsaW0gKyAnYT0nICsgdHJpZ2dlcjtcbiAgICAkLmdldChocmVmKTtcbiAgfVxuXG5cbiAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJ2FbZGF0YS10cmFja2luZy1jYXRlZ29yeT1cIm91dExpbmtzXCJdJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyB2YXIgdHJpZ2dlciA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctYWN0aW9uJyk7XG4gICAgLy8gdmFyIGxhYmVsID0gJCh0aGlzKS5kYXRhKCd0cmFja2luZy1sYWJlbCcpO1xuICAgIC8vIGlmICggbGFiZWwgKSB7IHRyaWdnZXIgKz0gJzonICsgbGFiZWw7IH1cbiAgICB2YXIgdHJpZ2dlciA9ICdvdXQnICsgJCh0aGlzKS5hdHRyKCdocmVmJyk7XG4gICAgSFQuYW5hbHl0aWNzLmxvZ0FjdGlvbih1bmRlZmluZWQsIHRyaWdnZXIpO1xuICB9KVxuXG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgaWYgKCQoJyNhY2Nlc3NCYW5uZXJJRCcpLmxlbmd0aCA+IDApIHtcbiAgICAgIHZhciBzdXBwcmVzcyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnc3VwYWNjYmFuJyk7XG4gICAgICBpZiAoc3VwcHJlc3MpIHtcbiAgICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICB2YXIgZGVidWcgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ2h0ZGV2Jyk7XG4gICAgICB2YXIgaWRoYXNoID0gJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIHVuZGVmaW5lZCwge2pzb24gOiB0cnVlfSk7XG4gICAgICB2YXIgdXJsID0gJC51cmwoKTsgLy8gcGFyc2UgdGhlIGN1cnJlbnQgcGFnZSBVUkxcbiAgICAgIHZhciBjdXJyaWQgPSB1cmwucGFyYW0oJ2lkJyk7XG4gICAgICBpZiAoaWRoYXNoID09IG51bGwpIHtcbiAgICAgICAgICBpZGhhc2ggPSB7fTtcbiAgICAgIH1cblxuICAgICAgdmFyIGlkcyA9IFtdO1xuICAgICAgZm9yICh2YXIgaWQgaW4gaWRoYXNoKSB7XG4gICAgICAgICAgaWYgKGlkaGFzaC5oYXNPd25Qcm9wZXJ0eShpZCkpIHtcbiAgICAgICAgICAgICAgaWRzLnB1c2goaWQpO1xuICAgICAgICAgIH1cbiAgICAgIH1cblxuICAgICAgaWYgKChpZHMuaW5kZXhPZihjdXJyaWQpIDwgMCkgfHwgZGVidWcpIHtcbiAgICAgICAgICBpZGhhc2hbY3VycmlkXSA9IDE7XG4gICAgICAgICAgLy8gc2Vzc2lvbiBjb29raWVcbiAgICAgICAgICAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgaWRoYXNoLCB7IGpzb24gOiB0cnVlLCBwYXRoOiAnLycsIGRvbWFpbjogJy5oYXRoaXRydXN0Lm9yZycgfSk7XG5cbiAgICAgICAgICBmdW5jdGlvbiBzaG93QWxlcnQoKSB7XG4gICAgICAgICAgICAgIHZhciBodG1sID0gJCgnI2FjY2Vzc0Jhbm5lcklEJykuaHRtbCgpO1xuICAgICAgICAgICAgICB2YXIgJGFsZXJ0ID0gYm9vdGJveC5kaWFsb2coaHRtbCwgW3sgbGFiZWw6IFwiT0tcIiwgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIiB9XSwgeyBoZWFkZXIgOiAnU3BlY2lhbCBhY2Nlc3MnLCByb2xlOiAnYWxlcnRkaWFsb2cnIH0pO1xuICAgICAgICAgIH1cbiAgICAgICAgICB3aW5kb3cuc2V0VGltZW91dChzaG93QWxlcnQsIDMwMDAsIHRydWUpO1xuICAgICAgfVxuICB9XG5cbn0pIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4yLjIwMTcxMjEwXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmIChcblx0ICAgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TXG5cdCYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSlcbikge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgYmUgZW1wdHkuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0cmV0dXJuIH5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4gKyBcIlwiKTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmICghfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikpIHtcblx0XHRcdHRoaXMucHVzaCh0b2tlbik7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0XHQsIGluZGV4XG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0d2hpbGUgKH5pbmRleCkge1xuXHRcdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHR2YXIgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodG9rZW4gKyBcIlwiKTtcblx0aWYgKH5pbmRleCkge1xuXHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxLCByZXBsYWNlbWVudF90b2tlbik7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn1cbmNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbn07XG5cbmlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcblx0dmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuXHRcdCAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcblx0XHQsIGVudW1lcmFibGU6IHRydWVcblx0XHQsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHR9O1xuXHR0cnkge1xuXHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0fSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG5cdFx0Ly8gYWRkaW5nIHVuZGVmaW5lZCB0byBmaWdodCB0aGlzIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9pc3N1ZXMvMzZcblx0XHQvLyBtb2Rlcm5pZSBJRTgtTVNXNyBtYWNoaW5lIGhhcyBJRTggOC4wLjYwMDEuMTg3MDIgYW5kIGlzIGFmZmVjdGVkXG5cdFx0aWYgKGV4Lm51bWJlciA9PT0gdW5kZWZpbmVkIHx8IGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcblx0XHRcdGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcblx0XHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0XHR9XG5cdH1cbn0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuXHRlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xufVxuXG59KHNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdC8vIHJlcGxhY2UoKSBwb2x5ZmlsbFxuXHRpZiAoIShcInJlcGxhY2VcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKS5jbGFzc0xpc3QpKSB7XG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdG9rZW5zID0gdGhpcy50b1N0cmluZygpLnNwbGl0KFwiIFwiKVxuXHRcdFx0XHQsIGluZGV4ID0gdG9rZW5zLmluZGV4T2YodG9rZW4gKyBcIlwiKVxuXHRcdFx0O1xuXHRcdFx0aWYgKH5pbmRleCkge1xuXHRcdFx0XHR0b2tlbnMgPSB0b2tlbnMuc2xpY2UoaW5kZXgpO1xuXHRcdFx0XHR0aGlzLnJlbW92ZS5hcHBseSh0aGlzLCB0b2tlbnMpO1xuXHRcdFx0XHR0aGlzLmFkZChyZXBsYWNlbWVudF90b2tlbik7XG5cdFx0XHRcdHRoaXMuYWRkLmFwcGx5KHRoaXMsIHRva2Vucy5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICB2YXIga3YgPSB0bXBbaV0uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgcmV0dmFsW2t2WzBdXSA9IGt2WzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKGFyZ3MpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHsgY3JlYXRpbmcgOiBmYWxzZSwgbGFiZWwgOiBcIlNhdmUgQ2hhbmdlc1wiIH0sIGFyZ3MpO1xuXG4gICAgICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICAgICAgICAgJzxmb3JtIGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCIgYWN0aW9uPVwibWJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWNuXCI+Q29sbGVjdGlvbiBOYW1lPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBtYXhsZW5ndGg9XCIxMDBcIiBuYW1lPVwiY25cIiBpZD1cImVkaXQtY25cIiB2YWx1ZT1cIlwiIHBsYWNlaG9sZGVyPVwiWW91ciBjb2xsZWN0aW9uIG5hbWVcIiByZXF1aXJlZCAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1jbi1jb3VudFwiPjEwMDwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWRlc2NcIj5EZXNjcmlwdGlvbjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgaWQ9XCJlZGl0LWRlc2NcIiBuYW1lPVwiZGVzY1wiIHJvd3M9XCI0XCIgbWF4bGVuZ3RoPVwiMjU1XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIHBsYWNlaG9sZGVyPVwiQWRkIHlvdXIgY29sbGVjdGlvbiBkZXNjcmlwdGlvbi5cIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1kZXNjLWNvdW50XCI+MjU1PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiPklzIHRoaXMgY29sbGVjdGlvbiA8c3Ryb25nPlB1YmxpYzwvc3Ryb25nPiBvciA8c3Ryb25nPlByaXZhdGU8L3N0cm9uZz4/PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTBcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJpdmF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTFcIiB2YWx1ZT1cIjFcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0xXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1B1YmxpYyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZm9ybT4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmNuICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwob3B0aW9ucy5jbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuZGVzYyApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwob3B0aW9ucy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5zaHJkICE9IG51bGwgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9XCIgKyBvcHRpb25zLnNocmQgKyAnXScpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICggISBIVC5sb2dpbl9zdGF0dXMubG9nZ2VkX2luICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTBdXCIpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvXCI+PHN0cm9uZz5UaGlzIGNvbGxlY3Rpb24gd2lsbCBiZSB0ZW1wb3Jhcnk8L3N0cm9uZz4uIExvZyBpbiB0byBjcmVhdGUgcGVybWFuZW50IGFuZCBwdWJsaWMgY29sbGVjdGlvbnMuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPGxhYmVsPiB0aGF0IHdyYXBzIHRoZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0xXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwibGFiZWxbZm9yPSdlZGl0LXNocmQtMSddXCIpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLiRoaWRkZW4gKSB7XG4gICAgICAgICAgICBvcHRpb25zLiRoaWRkZW4uY2xvbmUoKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2MnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYyk7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYScgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5paWQgKSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0naWlkJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmlpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJGJsb2NrLmdldCgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGZvcm0uY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNuID0gJC50cmltKCRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9ICQudHJpbSgkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBjbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvclwiPllvdSBtdXN0IGVudGVyIGEgY29sbGVjdGlvbiBuYW1lLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYSA6ICdhZGRpdHNuYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbiA6IGNuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYyA6IGRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaHJkIDogJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdOmNoZWNrZWRcIikudmFsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgICRkaWFsb2cuZmluZChcImlucHV0W3R5cGU9dGV4dF0sdGV4dGFyZWFcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJGNvdW50ID0gJChcIiNcIiArICR0aGlzLmF0dHIoJ2lkJykgKyBcIi1jb3VudFwiKTtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9ICR0aGlzLmF0dHIoXCJtYXhsZW5ndGhcIik7XG5cbiAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcblxuICAgICAgICAgICAgJHRoaXMuYmluZCgna2V5dXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRfcG9zdChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgeyBwYWdlIDogJ2FqYXgnLCBpZCA6IEhULnBhcmFtcy5pZCB9LCBwYXJhbXMpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogZ2V0X3VybCgpLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyc2VfbGluZShkYXRhKTtcbiAgICAgICAgICAgIGhpZGVfaW5mbygpO1xuICAgICAgICAgICAgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9TVUNDRVNTJyApIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9GQUlMVVJFJyApIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiSXRlbSBjb3VsZCBub3QgYmUgYWRkZWQgYXQgdGhpcyB0aW1lLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciAkdWwgPSAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcFwiKTtcbiAgICAgICAgdmFyIGNvbGxfaHJlZiA9IGdldF91cmwoKSArIFwiP2E9bGlzdGlzO2M9XCIgKyBwYXJhbXMuY29sbF9pZDtcbiAgICAgICAgdmFyICRhID0gJChcIjxhPlwiKS5hdHRyKFwiaHJlZlwiLCBjb2xsX2hyZWYpLnRleHQocGFyYW1zLmNvbGxfbmFtZSk7XG4gICAgICAgICQoXCI8bGk+PC9saT5cIikuYXBwZW5kVG8oJHVsKS5hcHBlbmQoJGEpO1xuXG4gICAgICAgICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwLXN1bW1hcnlcIikudGV4dChJTl9ZT1VSX0NPTExTX0xBQkVMKTtcblxuICAgICAgICAvLyBhbmQgdGhlbiBmaWx0ZXIgb3V0IHRoZSBsaXN0IGZyb20gdGhlIHNlbGVjdFxuICAgICAgICB2YXIgJG9wdGlvbiA9ICR0b29sYmFyLmZpbmQoXCJvcHRpb25bdmFsdWU9J1wiICsgcGFyYW1zLmNvbGxfaWQgKyBcIiddXCIpO1xuICAgICAgICAkb3B0aW9uLnJlbW92ZSgpO1xuXG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYEFkZGVkIGNvbGxlY3Rpb24gJHtwYXJhbXMuY29sbF9uYW1lfSB0byB5b3VyIGxpc3QuYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlybV9sYXJnZShjb2xsU2l6ZSwgYWRkTnVtSXRlbXMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgaWYgKCBjb2xsU2l6ZSA8PSAxMDAwICYmIGNvbGxTaXplICsgYWRkTnVtSXRlbXMgPiAxMDAwICkge1xuICAgICAgICAgICAgdmFyIG51bVN0cjtcbiAgICAgICAgICAgIGlmIChhZGROdW1JdGVtcyA+IDEpIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoZXNlIFwiICsgYWRkTnVtSXRlbXMgKyBcIiBpdGVtc1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGlzIGl0ZW1cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtc2cgPSBcIk5vdGU6IFlvdXIgY29sbGVjdGlvbiBjb250YWlucyBcIiArIGNvbGxTaXplICsgXCIgaXRlbXMuICBBZGRpbmcgXCIgKyBudW1TdHIgKyBcIiB0byB5b3VyIGNvbGxlY3Rpb24gd2lsbCBpbmNyZWFzZSBpdHMgc2l6ZSB0byBtb3JlIHRoYW4gMTAwMCBpdGVtcy4gIFRoaXMgbWVhbnMgeW91ciBjb2xsZWN0aW9uIHdpbGwgbm90IGJlIHNlYXJjaGFibGUgdW50aWwgaXQgaXMgaW5kZXhlZCwgdXN1YWxseSB3aXRoaW4gNDggaG91cnMuICBBZnRlciB0aGF0LCBqdXN0IG5ld2x5IGFkZGVkIGl0ZW1zIHdpbGwgc2VlIHRoaXMgZGVsYXkgYmVmb3JlIHRoZXkgY2FuIGJlIHNlYXJjaGVkLiBcXG5cXG5EbyB5b3Ugd2FudCB0byBwcm9jZWVkP1wiXG5cbiAgICAgICAgICAgIGNvbmZpcm0obXNnLCBmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGFuc3dlciApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNhc2VzIGFyZSBva2F5XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJChcIiNQVGFkZEl0ZW1CdG5cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBhY3Rpb24gPSAnYWRkSSdcblxuICAgICAgICBoaWRlX2Vycm9yKCk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lID0gJHRvb2xiYXIuZmluZChcInNlbGVjdCBvcHRpb246c2VsZWN0ZWRcIikudGV4dCgpO1xuXG4gICAgICAgIGlmICggKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiApICkge1xuICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIllvdSBtdXN0IHNlbGVjdCBhIGNvbGxlY3Rpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IE5FV19DT0xMX01FTlVfT1BUSU9OICkge1xuICAgICAgICAgICAgLy8gZGVhbCB3aXRoIG5ldyBjb2xsZWN0aW9uXG4gICAgICAgICAgICBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoe1xuICAgICAgICAgICAgICAgIGNyZWF0aW5nIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgICAgICBpZCA6IEhULnBhcmFtcy5pZCxcbiAgICAgICAgICAgICAgICBhIDogYWN0aW9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhciBhZGRfbnVtX2l0ZW1zID0gMTtcbiAgICAgICAgLy8gdmFyIENPTExfU0laRV9BUlJBWSA9IGdldENvbGxTaXplQXJyYXkoKTtcbiAgICAgICAgLy8gdmFyIGNvbGxfc2l6ZSA9IENPTExfU0laRV9BUlJBWVtzZWxlY3RlZF9jb2xsZWN0aW9uX2lkXTtcbiAgICAgICAgLy8gY29uZmlybV9sYXJnZShjb2xsX3NpemUsIGFkZF9udW1faXRlbXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgJGZvcm0uc3VibWl0KCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZGlzcGxheV9pbmZvKFwiQWRkaW5nIGl0ZW0gdG8geW91ciBjb2xsZWN0aW9uOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgYzIgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgYSAgOiAnYWRkaXRzJ1xuICAgICAgICB9KTtcblxuICAgIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBpZiAoICEgJChcImh0bWxcIikuaXMoXCIuY3Jtc1wiKSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBpZiAoICQoXCIubmF2YmFyLXN0YXRpYy10b3BcIikuZGF0YSgnbG9nZ2VkaW4nKSAhPSAnWUVTJyAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT0gJ2h0dHBzOicgKSB7XG4gIC8vICAgICAvLyBob3JyaWJsZSBoYWNrXG4gIC8vICAgICB2YXIgdGFyZ2V0ID0gd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvXFwkL2csICclMjQnKTtcbiAgLy8gICAgIHZhciBocmVmID0gJ2h0dHBzOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArICcvU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9aHR0cHM6Ly9zaGliYm9sZXRoLnVtaWNoLmVkdS9pZHAvc2hpYmJvbGV0aCZ0YXJnZXQ9JyArIHRhcmdldDtcbiAgLy8gICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gaHJlZjtcbiAgLy8gICAgIHJldHVybjtcbiAgLy8gfVxuXG4gIC8vIGRlZmluZSBDUk1TIHN0YXRlXG4gIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1VUyc7XG4gIHZhciBpID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2tpbj1jcm1zd29ybGQnKTtcbiAgaWYgKCBpICsgMSAhPSAwICkge1xuICAgICAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVdvcmxkJztcbiAgfVxuXG4gIC8vIGRpc3BsYXkgYmliIGluZm9ybWF0aW9uXG4gIHZhciAkZGl2ID0gJChcIi5iaWJMaW5rc1wiKTtcbiAgdmFyICRwID0gJGRpdi5maW5kKFwicDpmaXJzdFwiKTtcbiAgJHAuZmluZChcInNwYW46ZW1wdHlcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIC8vICQodGhpcykudGV4dCgkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKS5hZGRDbGFzcyhcImJsb2NrZWRcIik7XG4gICAgICB2YXIgZnJhZ21lbnQgPSAnPHNwYW4gY2xhc3M9XCJibG9ja2VkXCI+PHN0cm9uZz57bGFiZWx9Ojwvc3Ryb25nPiB7Y29udGVudH08L3NwYW4+JztcbiAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQucmVwbGFjZSgne2xhYmVsfScsICQodGhpcykuYXR0cigncHJvcGVydHknKS5zdWJzdHIoMykpLnJlcGxhY2UoJ3tjb250ZW50fScsICQodGhpcykuYXR0cihcImNvbnRlbnRcIikpO1xuICAgICAgJHAuYXBwZW5kKGZyYWdtZW50KTtcbiAgfSlcblxuICB2YXIgJGxpbmsgPSAkKFwiI2VtYmVkSHRtbFwiKTtcbiAgY29uc29sZS5sb2coXCJBSE9ZIEVNQkVEXCIsICRsaW5rKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG5cbiAgJGxpbmsgPSAkKFwiYVtkYXRhLXRvZ2dsZT0nUFQgRmluZCBpbiBhIExpYnJhcnknXVwiKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG59KVxuIiwiLy8gZG93bmxvYWRlclxuXG52YXIgSFQgPSBIVCB8fCB7fTtcblxuSFQuRG93bmxvYWRlciA9IHtcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMucGFyYW1zLmlkO1xuICAgICAgICB0aGlzLnBkZiA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb3B0aW9uczoge1xuXG4gICAgfSxcblxuICAgIHN0YXJ0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQoXCJhW2RhdGEtdG9nZ2xlKj1kb3dubG9hZF1cIikuYWRkQ2xhc3MoXCJpbnRlcmFjdGl2ZVwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBib290Ym94LmhpZGVBbGwoKTtcbiAgICAgICAgICAgIGlmICggJCh0aGlzKS5hdHRyKFwicmVsXCIpID09ICdhbGxvdycgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1zLmRvd25sb2FkX3Byb2dyZXNzX2Jhc2UgPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZXhwbGFpblBkZkFjY2Vzcyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgIH0sXG5cbiAgICBleHBsYWluUGRmQWNjZXNzOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBodG1sID0gJChcIiNub0Rvd25sb2FkQWNjZXNzXCIpLmh0bWwoKTtcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgne0RPV05MT0FEX0xJTkt9JywgJCh0aGlzKS5hdHRyKFwiaHJlZlwiKSk7XG4gICAgICAgIHRoaXMuJGRpYWxvZyA9IGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIC8vIHRoaXMuJGRpYWxvZy5hZGRDbGFzcyhcImxvZ2luXCIpO1xuICAgIH0sXG5cbiAgICBkb3dubG9hZFBkZjogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuJGxpbmsgPSAkKGxpbmspO1xuICAgICAgICBzZWxmLnNyYyA9ICQobGluaykuYXR0cignaHJlZicpO1xuICAgICAgICBzZWxmLml0ZW1fdGl0bGUgPSAkKGxpbmspLmRhdGEoJ3RpdGxlJykgfHwgJ1BERic7XG5cbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3JhbmdlJykgPT0gJ3llcycgKSB7XG4gICAgICAgICAgICBpZiAoICEgc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAvLyAnPHA+QnVpbGRpbmcgeW91ciBQREYuLi48L3A+JyArXG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cImluaXRpYWxcIj48cD5TZXR0aW5nIHVwIHRoZSBkb3dubG9hZC4uLjwvZGl2PmAgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJvZmZzY3JlZW5cIiByb2xlPVwic3RhdHVzXCIgYXJpYS1hdG9taWM9XCJ0cnVlXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIC8vICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtc3VjY2VzcyBkb25lIGhpZGVcIj4nICtcbiAgICAgICAgICAgIC8vICAgICAnPHA+QWxsIGRvbmUhPC9wPicgK1xuICAgICAgICAgICAgLy8gJzwvZGl2PicgKyBcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFRpbWVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5XaGF0IGFmZmVjdHMgdGhlIGRvd25sb2FkIHNwZWVkPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcyBidG4nLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgICAgICAgICAgICAgaWQ6ICdkb3dubG9hZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgICAgc2VsZi4kc3RhdHVzID0gc2VsZi4kZGlhbG9nLmZpbmQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gICAgICAgIC8vIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQnVpbGRpbmcgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYCk7XG5cbiAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcblxuICAgIH0sXG5cbiAgICByZXF1ZXN0RG93bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgIGRhdGFbJ3NlcSddID0gc2VsZi4kbGluay5kYXRhKCdzZXEnKTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBzZWxmLnNyYy5yZXBsYWNlKC87L2csICcmJykgKyAnJmNhbGxiYWNrPUhULmRvd25sb2FkZXIuc3RhcnREb3dubG9hZE1vbml0b3InLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBTVEFSVFVQIE5PVCBERVRFQ1RFRFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZyApIHsgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTsgfVxuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcihyZXEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbERvd25sb2FkOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgc3RhcnREb3dubG9hZE1vbml0b3I6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBTFJFQURZIFBPTExJTkdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnBkZi5wcm9ncmVzc191cmwgPSBwcm9ncmVzc191cmw7XG4gICAgICAgIHNlbGYucGRmLmRvd25sb2FkX3VybCA9IGRvd25sb2FkX3VybDtcbiAgICAgICAgc2VsZi5wZGYudG90YWwgPSB0b3RhbDtcblxuICAgICAgICBzZWxmLmlzX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgPSAwO1xuICAgICAgICBzZWxmLmkgPSAwO1xuXG4gICAgICAgIHNlbGYudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgc2VsZi5jaGVja1N0YXR1cygpOyB9LCAyNTAwKTtcbiAgICAgICAgLy8gZG8gaXQgb25jZSB0aGUgZmlyc3QgdGltZVxuICAgICAgICBzZWxmLmNoZWNrU3RhdHVzKCk7XG5cbiAgICB9LFxuXG4gICAgY2hlY2tTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaSArPSAxO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogc2VsZi5wZGYucHJvZ3Jlc3NfdXJsLFxuICAgICAgICAgICAgZGF0YSA6IHsgdHMgOiAobmV3IERhdGUpLmdldFRpbWUoKSB9LFxuICAgICAgICAgICAgY2FjaGUgOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBzZWxmLnVwZGF0ZVByb2dyZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCArPSAxO1xuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzLmRvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciAmJiBzdGF0dXMubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlQcm9jZXNzRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBSUxFRDogXCIsIHJlcSwgXCIvXCIsIHRleHRTdGF0dXMsIFwiL1wiLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDA0ICYmIChzZWxmLmkgPiAyNSB8fCBzZWxmLm51bV9wcm9jZXNzZWQgPiAwKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHVwZGF0ZVByb2dyZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHsgZG9uZSA6IGZhbHNlLCBlcnJvciA6IGZhbHNlIH07XG4gICAgICAgIHZhciBwZXJjZW50O1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gZGF0YS5zdGF0dXM7XG4gICAgICAgIGlmICggY3VycmVudCA9PSAnRU9UJyB8fCBjdXJyZW50ID09ICdET05FJyApIHtcbiAgICAgICAgICAgIHN0YXR1cy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGF0YS5jdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwICogKCBjdXJyZW50IC8gc2VsZi5wZGYudG90YWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi5sYXN0X3BlcmNlbnQgIT0gcGVyY2VudCApIHtcbiAgICAgICAgICAgIHNlbGYubGFzdF9wZXJjZW50ID0gcGVyY2VudDtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgMTAwIHRpbWVzLCB3aGljaCBhbW91bnRzIHRvIH4xMDAgc2Vjb25kc1xuICAgICAgICBpZiAoIHNlbGYubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgc3RhdHVzLmVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5pcyhcIjp2aXNpYmxlXCIpICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5QbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApXG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciBkb3dubG9hZF9rZXkgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01hYyBPUyBYJykgIT0gLTEgPyAnUkVUVVJOJyA6ICdFTlRFUic7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPkFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIDxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+U2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC48L3NwYW4+PC9wPmApO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBBbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBTZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLmApO1xuXG4gICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuZmluZChcIi5kb25lXCIpLnNob3coKTtcbiAgICAgICAgICAgIHZhciAkZG93bmxvYWRfYnRuID0gc2VsZi4kZGlhbG9nLmZpbmQoJy5kb3dubG9hZC1wZGYnKTtcbiAgICAgICAgICAgIGlmICggISAkZG93bmxvYWRfYnRuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuID0gJCgnPGEgY2xhc3M9XCJkb3dubG9hZC1wZGYgYnRuIGJ0bi1wcmltYXJ5XCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hcHBlbmRUbyhzZWxmLiRkaWFsb2cuZmluZChcIi5tb2RhbF9fZm9vdGVyXCIpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGxpbmsudHJpZ2dlcihcImNsaWNrLmdvb2dsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhULnJlYWRlci5lbWl0KCdkb3dubG9hZERvbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBQcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuYCk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikudGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0gKCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkKS5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi50aW1lcik7XG4gICAgICAgICAgICBzZWxmLnRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwbGF5V2FybmluZzogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBwYXJzZUludChyZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtVW50aWxFcG9jaCcpKTtcbiAgICAgICAgdmFyIHJhdGUgPSByZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtUmF0ZScpXG5cbiAgICAgICAgaWYgKCB0aW1lb3V0IDw9IDUgKSB7XG4gICAgICAgICAgICAvLyBqdXN0IHB1bnQgYW5kIHdhaXQgaXQgb3V0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuICAgICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aW1lb3V0ICo9IDEwMDA7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIGNvdW50ZG93biA9ICggTWF0aC5jZWlsKCh0aW1lb3V0IC0gbm93KSAvIDEwMDApIClcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgKCc8ZGl2PicgK1xuICAgICAgICAgICAgJzxwPllvdSBoYXZlIGV4Y2VlZGVkIHRoZSBkb3dubG9hZCByYXRlIG9mIHtyYXRlfS4gWW91IG1heSBwcm9jZWVkIGluIDxzcGFuIGlkPVwidGhyb3R0bGUtdGltZW91dFwiPntjb3VudGRvd259PC9zcGFuPiBzZWNvbmRzLjwvcD4nICtcbiAgICAgICAgICAgICc8cD5Eb3dubG9hZCBsaW1pdHMgcHJvdGVjdCBIYXRoaVRydXN0IHJlc291cmNlcyBmcm9tIGFidXNlIGFuZCBoZWxwIGVuc3VyZSBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZSBmb3IgZXZlcnlvbmUuPC9wPicgK1xuICAgICAgICAgICc8L2Rpdj4nKS5yZXBsYWNlKCd7cmF0ZX0nLCByYXRlKS5yZXBsYWNlKCd7Y291bnRkb3dufScsIGNvdW50ZG93bik7XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1wcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcblxuICAgICAgICBzZWxmLmNvdW50ZG93bl90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb3VudGRvd24gLT0gMTtcbiAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIjdGhyb3R0bGUtdGltZW91dFwiKS50ZXh0KGNvdW50ZG93bik7XG4gICAgICAgICAgICAgIGlmICggY291bnRkb3duID09IDAgKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUSUMgVE9DXCIsIGNvdW50ZG93bik7XG4gICAgICAgIH0sIDEwMDApO1xuXG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9jZXNzRXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArIFxuICAgICAgICAgICAgICAgICdVbmZvcnR1bmF0ZWx5LCB0aGUgcHJvY2VzcyBmb3IgY3JlYXRpbmcgeW91ciBQREYgaGFzIGJlZW4gaW50ZXJydXB0ZWQuICcgKyBcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNsaWNrIFwiT0tcIiBhbmQgdHJ5IGFnYWluLicgKyBcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ0lmIHRoaXMgcHJvYmxlbSBwZXJzaXN0cyBhbmQgeW91IGFyZSB1bmFibGUgdG8gZG93bmxvYWQgdGhpcyBQREYgYWZ0ZXIgcmVwZWF0ZWQgYXR0ZW1wdHMsICcgKyBcbiAgICAgICAgICAgICAgICAncGxlYXNlIG5vdGlmeSB1cyBhdCA8YSBocmVmPVwiL2NnaS9mZWVkYmFjay8/cGFnZT1mb3JtXCIgZGF0YT1tPVwicHRcIiBkYXRhLXRvZ2dsZT1cImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiU2hvdyBGZWVkYmFja1wiPmZlZWRiYWNrQGlzc3Vlcy5oYXRoaXRydXN0Lm9yZzwvYT4gJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBpbmNsdWRlIHRoZSBVUkwgb2YgdGhlIGJvb2sgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY2VzcyB3aGVuIHRoZSBwcm9ibGVtIG9jY3VycmVkLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYSBwcm9ibGVtIGJ1aWxkaW5nIHlvdXIgJyArIHRoaXMuaXRlbV90aXRsZSArICc7IHN0YWZmIGhhdmUgYmVlbiBub3RpZmllZC4nICtcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gaW4gMjQgaG91cnMuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBsb2dFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJC5nZXQoc2VsZi5zcmMgKyAnO251bV9hdHRlbXB0cz0nICsgc2VsZi5udW1fYXR0ZW1wdHMpO1xuICAgIH0sXG5cbiAgICB1cGRhdGVTdGF0dXNUZXh0OiBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLl9sYXN0TWVzc2FnZSAhPSBtZXNzYWdlICkge1xuICAgICAgICAgIGlmICggc2VsZi5fbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQoc2VsZi5fbGFzdFRpbWVyKTsgc2VsZi5fbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gICAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBzZWxmLiRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgICAgICAgICAgIHNlbGYuX2xhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0gc3RhdHVzOlwiLCBtZXNzYWdlKTtcbiAgICAgICAgICB9LCA1MCk7XG4gICAgICAgICAgc2VsZi5fbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgICBzZWxmLiRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAgICAgICAgIH0sIDUwMCk7XG5cbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBFT1Q6IHRydWVcblxufVxuXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgIEhULmRvd25sb2FkZXIgPSBPYmplY3QuY3JlYXRlKEhULkRvd25sb2FkZXIpLmluaXQoe1xuICAgICAgICBwYXJhbXMgOiBIVC5wYXJhbXNcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci5zdGFydCgpO1xuXG4gICAgLy8gYW5kIGRvIHRoaXMgaGVyZVxuICAgICQoXCIjc2VsZWN0ZWRQYWdlc1BkZkxpbmtcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIHByaW50YWJsZSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcblxuICAgICAgICBpZiAoIHByaW50YWJsZS5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgIHZhciBidXR0b25zID0gW107XG5cbiAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIHByaW50LjwvcD5cIiBdO1xuICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgbGVmdCBvciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBhcHBlYXIgaW4gdGhlIHNlbGVjdGlvbiBjb250ZW50cyA8YnV0dG9uIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiAjNjY2OyBib3JkZXItY29sb3I6ICNlZWVcXFwiIGNsYXNzPVxcXCJidG4gc3F1YXJlXFxcIj48aSBjbGFzcz1cXFwiaWNvbW9vbiBpY29tb29uLXBhcGVyc1xcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0O1xuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2sgJyArXG4gICAgICAgICAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICAgICAgICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPjxpIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWhlbHBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5IZWxwOiBFbWJlZGRpbmcgSGF0aGlUcnVzdCBCb29rczwvc3Bhbj48L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LXNjcm9sbFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctZmxpcFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgcmV0dXJuO1xuXG4gICAgdmFyIGluaXRlZCA9IGZhbHNlO1xuXG4gICAgdmFyICRmb3JtID0gJChcIiNzZWFyY2gtbW9kYWwgZm9ybVwiKTtcblxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXQuc2VhcmNoLWlucHV0LXRleHRcIik7XG4gICAgdmFyICRpbnB1dF9sYWJlbCA9ICRmb3JtLmZpbmQoXCJsYWJlbFtmb3I9J3ExLWlucHV0J11cIik7XG4gICAgdmFyICRzZWxlY3QgPSAkZm9ybS5maW5kKFwiLmNvbnRyb2wtc2VhcmNodHlwZVwiKTtcbiAgICB2YXIgJHNlYXJjaF90YXJnZXQgPSAkZm9ybS5maW5kKFwiLnNlYXJjaC10YXJnZXRcIik7XG4gICAgdmFyICRmdCA9ICRmb3JtLmZpbmQoXCJzcGFuLmZ1bmt5LWZ1bGwtdmlld1wiKTtcblxuICAgIHZhciAkYmFja2Ryb3AgPSBudWxsO1xuXG4gICAgdmFyICRhY3Rpb24gPSAkKFwiI2FjdGlvbi1zZWFyY2gtaGF0aGl0cnVzdFwiKTtcbiAgICAkYWN0aW9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBib290Ym94LnNob3coJ3NlYXJjaC1tb2RhbCcsIHtcbiAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgICAgICAkaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcblxuICAgIHZhciBfc2V0dXAgPSB7fTtcbiAgICBfc2V0dXAubHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5oaWRlKCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgb3Igd2l0aGluIHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGZ1bGwtdGV4dCBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGZ1bGwtdGV4dCBpbmRleC5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0dXAuY2F0YWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LnNob3coKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBjYXRhbG9nIGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgY2F0YWxvZyBpbmRleDsgeW91IGNhbiBsaW1pdCB5b3VyIHNlYXJjaCB0byBhIHNlbGVjdGlvbiBvZiBmaWVsZHMuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9ICRzZWFyY2hfdGFyZ2V0LmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLnZhbCgpO1xuICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgaW5pdGVkID0gdHJ1ZTtcblxuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIGlmICggcHJlZnMuc2VhcmNoICYmIHByZWZzLnNlYXJjaC5mdCApIHtcbiAgICAgICAgJChcImlucHV0W25hbWU9ZnRdXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cblxuICAgICRzZWFyY2hfdGFyZ2V0Lm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBsYWJlbCA6IFwiLVwiLCBjYXRlZ29yeSA6IFwiSFQgU2VhcmNoXCIsIGFjdGlvbiA6IHRhcmdldCB9KTtcbiAgICB9KVxuXG4gICAgLy8gJGZvcm0uZGVsZWdhdGUoJzppbnB1dCcsICdmb2N1cyBjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiRk9DVVNJTkdcIiwgdGhpcyk7XG4gICAgLy8gICAgICRmb3JtLmFkZENsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgPT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcCA9ICQoJzxkaXYgY2xhc3M9XCJtb2RhbF9fb3ZlcmxheSBpbnZpc2libGVcIj48L2Rpdj4nKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgJGJhY2tkcm9wLmFwcGVuZFRvKCQoXCJib2R5XCIpKS5zaG93KCk7XG4gICAgLy8gfSlcblxuICAgIC8vICQoXCJib2R5XCIpLm9uKCdmb2N1cycsICc6aW5wdXQsYScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAvLyAgICAgaWYgKCAhICR0aGlzLmNsb3Nlc3QoXCIubmF2LXNlYXJjaC1mb3JtXCIpLmxlbmd0aCApIHtcbiAgICAvLyAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIHZhciBjbG9zZV9zZWFyY2hfZm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkZm9ybS5yZW1vdmVDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wICE9IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuZGV0YWNoKCk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuaGlkZSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYWRkIGV2ZW50IGhhbmRsZXIgZm9yIHN1Ym1pdCB0byBjaGVjayBmb3IgZW1wdHkgcXVlcnkgb3IgYXN0ZXJpc2tcbiAgICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpXG4gICAgICAgICB7XG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIEhULmFuYWx5dGljcy5nZXRDb250ZW50R3JvdXBEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlYXRcbiAgICB2YXIgc3VmZml4ID0gJyc7XG4gICAgdmFyIGNvbnRlbnRfZ3JvdXAgPSA0O1xuICAgIGlmICggJChcIiNzZWN0aW9uXCIpLmRhdGEoXCJ2aWV3XCIpID09ICdyZXN0cmljdGVkJyApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAyO1xuICAgICAgc3VmZml4ID0gJyNyZXN0cmljdGVkJztcbiAgICB9IGVsc2UgaWYgKCB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKFwiZGVidWc9c3VwZXJcIikgPiAtMSApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAzO1xuICAgICAgc3VmZml4ID0gJyNzdXBlcic7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4IDogY29udGVudF9ncm91cCwgdmFsdWUgOiBIVC5wYXJhbXMuaWQgKyBzdWZmaXggfTtcblxuICB9XG5cbiAgSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmID0gZnVuY3Rpb24oaHJlZikge1xuICAgIHZhciB1cmwgPSAkLnVybChocmVmKTtcbiAgICB2YXIgbmV3X2hyZWYgPSB1cmwuc2VnbWVudCgpO1xuICAgIG5ld19ocmVmLnB1c2goJChcImh0bWxcIikuZGF0YSgnY29udGVudC1wcm92aWRlcicpKTtcbiAgICBuZXdfaHJlZi5wdXNoKHVybC5wYXJhbShcImlkXCIpKTtcbiAgICB2YXIgcXMgPSAnJztcbiAgICBpZiAoIG5ld19ocmVmLmluZGV4T2YoXCJzZWFyY2hcIikgPiAtMSAmJiB1cmwucGFyYW0oJ3ExJykgICkge1xuICAgICAgcXMgPSAnP3ExPScgKyB1cmwucGFyYW0oJ3ExJyk7XG4gICAgfVxuICAgIG5ld19ocmVmID0gXCIvXCIgKyBuZXdfaHJlZi5qb2luKFwiL1wiKSArIHFzO1xuICAgIHJldHVybiBuZXdfaHJlZjtcbiAgfVxuXG4gIEhULmFuYWx5dGljcy5nZXRQYWdlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYoKTtcbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkbWVudTsgdmFyICR0cmlnZ2VyOyB2YXIgJGhlYWRlcjsgdmFyICRuYXZpZ2F0b3I7XG4gIEhUID0gSFQgfHwge307XG5cbiAgSFQubW9iaWZ5ID0gZnVuY3Rpb24oKSB7XG5cbiAgICAvLyBpZiAoICQoXCJodG1sXCIpLmlzKFwiLmRlc2t0b3BcIikgKSB7XG4gICAgLy8gICAkKFwiaHRtbFwiKS5hZGRDbGFzcyhcIm1vYmlsZVwiKS5yZW1vdmVDbGFzcyhcImRlc2t0b3BcIikucmVtb3ZlQ2xhc3MoXCJuby1tb2JpbGVcIik7XG4gICAgLy8gfVxuXG4gICAgJGhlYWRlciA9ICQoXCJoZWFkZXJcIik7XG4gICAgJG5hdmlnYXRvciA9ICQoXCIubmF2aWdhdG9yXCIpO1xuICAgIGlmICggJG5hdmlnYXRvci5sZW5ndGggKSB7XG4gICAgICAkbmF2aWdhdG9yLmdldCgwKS5zdHlsZS5zZXRQcm9wZXJ0eSgnLS1oZWlnaHQnLCBgLSR7JG5hdmlnYXRvci5vdXRlckhlaWdodCgpICogMC45MH1weGApO1xuICAgICAgdmFyICRleHBhbmRvID0gJG5hdmlnYXRvci5maW5kKFwiLmFjdGlvbi1leHBhbmRvXCIpO1xuICAgICAgJGV4cGFuZG8ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gISAoIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID09ICd0cnVlJyApO1xuICAgICAgfSlcbiAgICB9XG5cbiAgICBIVC4kbWVudSA9ICRtZW51O1xuXG4gICAgdmFyICRzaWRlYmFyID0gJChcIiNzaWRlYmFyXCIpO1xuXG4gICAgJHRyaWdnZXIgPSAkc2lkZWJhci5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpO1xuICAgIC8vICR0cmlnZ2VyLm9uKCdjbGlja2VkJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgIHZhciBhY3RpdmUgPSAkdHJpZ2dlci5hdHRyKCdhcmlhLWV4cGFuZGVkJykgPT0gJ3RydWUnO1xuICAgIC8vICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IGFjdGl2ZSA/ICdvcHRpb25zJyA6ICd2aWV3ZXInO1xuICAgIC8vIH0pXG5cbiAgICAkKFwiI2FjdGlvbi1tb2JpbGUtdG9nZ2xlLWZ1bGxzY3JlZW5cIikub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgICB9KVxuXG4gICAgSFQudXRpbHMgPSBIVC51dGlscyB8fCB7fTtcblxuICAgICRzaWRlYmFyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBoaWRlIHRoZSBzaWRlYmFyXG4gICAgICB2YXIgJHRoaXMgPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICBpZiAoICR0aGlzLmlzKFwiaW5wdXRbdHlwZT0ndGV4dCddXCIpICkge1xuICAgICAgICByZXR1cm47XG4gICAgICB9XG4gICAgICBpZiAoICR0aGlzLnBhcmVudHMoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpLmxlbmd0aCApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgSFQudG9nZ2xlKGZhbHNlKTtcbiAgICB9KVxuXG4gICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuICAgIH0pXG5cbiAgICAkKHdpbmRvdykub24oXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgICAgICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgICAgICB9LCAxMDApO1xuICAgIH0pXG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmRhdGFzZXQuZXhwYW5kZWQgPSAndHJ1ZSc7XG4gIH1cblxuICBIVC50b2dnbGUgPSBmdW5jdGlvbihzdGF0ZSkge1xuXG4gICAgJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcsIHN0YXRlKTtcbiAgICAkKFwiaHRtbFwiKS5nZXQoMCkuZGF0YXNldC52aWV3ID0gc3RhdGUgPyAnb3B0aW9ucycgOiAndmlld2VyJztcblxuICAgIC8vIHZhciB4bGlua19ocmVmO1xuICAgIC8vIGlmICggJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcpID09ICd0cnVlJyApIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWV4cGFuZGVkJztcbiAgICAvLyB9IGVsc2Uge1xuICAgIC8vICAgeGxpbmtfaHJlZiA9ICcjcGFuZWwtY29sbGFwc2VkJztcbiAgICAvLyB9XG4gICAgLy8gJHRyaWdnZXIuZmluZChcInN2ZyB1c2VcIikuYXR0cihcInhsaW5rOmhyZWZcIiwgeGxpbmtfaHJlZik7XG4gIH1cblxuICBzZXRUaW1lb3V0KEhULm1vYmlmeSwgMTAwMCk7XG59KVxuXG4vLyBoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuLy8gICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuLy8gICBIVCA9IEhUIHx8IHt9O1xuXG4vLyAgIEhULmlzX21vYmlsZSA9ICQoXCJodG1sXCIpLmlzKFwiLm1vYmlsZVwiKSB8fCAoIEhULnBhcmFtcy5kZWJ1ZyAmJiBIVC5wYXJhbXMuZGVidWcuaW5kZXhPZignbW9iaWxlJykgPiAtMSApO1xuXG4vLyAgIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4vLyAgICAgaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuLy8gICAgICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuLy8gICAgIH1cblxuLy8gICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuLy8gICAgICRuYXZpZ2F0b3IgPSAkKFwiLm5hdmlnYXRvclwiKTtcbi8vICAgICBpZiAoICRuYXZpZ2F0b3IubGVuZ3RoICkge1xuLy8gICAgICAgJG5hdmlnYXRvci5nZXQoMCkuc3R5bGUuc2V0UHJvcGVydHkoJy0taGVpZ2h0JywgYC0keyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKSAqIDAuOTB9cHhgKTtcbi8vICAgICAgIHZhciAkZXhwYW5kbyA9ICRuYXZpZ2F0b3IuZmluZChcIi5hY3Rpb24tZXhwYW5kb1wiKTtcbi8vICAgICAgICRleHBhbmRvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuLy8gICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKTtcbi8vICAgICAgIH0pXG4vLyAgICAgfVxuXG4vLyAgICAgSFQuJG1lbnUgPSAkbWVudTtcblxuLy8gICAgIHZhciAkc2lkZWJhciA9ICQoXCIjc2lkZWJhclwiKTtcblxuLy8gICAgICR0cmlnZ2VyID0gJHNpZGViYXIuZmluZChcImJ1dHRvblthcmlhLWV4cGFuZGVkXVwiKTtcbi8vICAgICAkdHJpZ2dlci5vbignY2xpY2tlZCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4vLyAgICAgICB2YXIgYWN0aXZlID0gJHRyaWdnZXIuYXR0cignYXJpYS1leHBhbmRlZCcpID09ICd0cnVlJztcbi8vICAgICAgICQoXCJodG1sXCIpLmdldCgwKS5kYXRhc2V0LnZpZXcgPSBhY3RpdmUgPyAnb3B0aW9ucycgOiAndmlld2VyJztcbi8vICAgICB9KVxuXG4vLyAgICAgJChcIiNhY3Rpb24tbW9iaWxlLXRvZ2dsZS1mdWxsc2NyZWVuXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuLy8gICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnJlcXVlc3RGdWxsU2NyZWVuKCk7XG4vLyAgICAgfSlcblxuLy8gICAgIEhULnV0aWxzID0gSFQudXRpbHMgfHwge307XG5cbi8vICAgICAkc2lkZWJhci5vbignY2xpY2snLCBmdW5jdGlvbihldmVudCkge1xuLy8gICAgICAgLy8gaGlkZSB0aGUgc2lkZWJhclxuLy8gICAgICAgdmFyICR0aGlzID0gJChldmVudC50YXJnZXQpO1xuLy8gICAgICAgaWYgKCAkdGhpcy5pcyhcImlucHV0W3R5cGU9J3RleHQnXVwiKSApIHtcbi8vICAgICAgICAgcmV0dXJuO1xuLy8gICAgICAgfVxuLy8gICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKS5sZW5ndGggKSB7XG4vLyAgICAgICAgIHJldHVybjtcbi8vICAgICAgIH1cbi8vICAgICAgIEhULnRvZ2dsZShmYWxzZSk7XG4vLyAgICAgfSlcblxuLy8gICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4vLyAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuLy8gICAgICQod2luZG93KS5vbihcInJlc2l6ZVwiLCBmdW5jdGlvbigpIHtcbi8vICAgICAgICAgdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbi8vICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcbi8vICAgICB9KVxuXG4vLyAgICAgJCh3aW5kb3cpLm9uKFwib3JpZW50YXRpb25jaGFuZ2VcIiwgZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4vLyAgICAgICAgICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuLy8gICAgICAgICAgICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXZoJywgdmggKyAncHgnKTtcblxuLy8gICAgICAgICAgICAgSFQudXRpbHMuaGFuZGxlT3JpZW50YXRpb25DaGFuZ2UoKTtcbi8vICAgICAgICAgfSwgMTAwKTtcbi8vICAgICB9KVxuLy8gICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gJ3RydWUnO1xuLy8gICB9XG5cbi8vICAgSFQudG9nZ2xlID0gZnVuY3Rpb24oc3RhdGUpIHtcblxuLy8gICAgICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4vLyAgICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IHN0YXRlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG5cbi8vICAgICB2YXIgeGxpbmtfaHJlZjtcbi8vICAgICBpZiAoICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZScgKSB7XG4vLyAgICAgICB4bGlua19ocmVmID0gJyNwYW5lbC1leHBhbmRlZCc7XG4vLyAgICAgfSBlbHNlIHtcbi8vICAgICAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWNvbGxhcHNlZCc7XG4vLyAgICAgfVxuLy8gICAgICR0cmlnZ2VyLmZpbmQoXCJzdmcgdXNlXCIpLmF0dHIoXCJ4bGluazpocmVmXCIsIHhsaW5rX2hyZWYpO1xuLy8gICB9XG5cbi8vICAgaWYgKCBIVC5pc19tb2JpbGUgKSB7XG4vLyAgICAgc2V0VGltZW91dChIVC5tb2JpZnksIDEwMDApO1xuLy8gICB9XG4vLyB9KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkZm9ybSA9ICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpO1xuICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRmb3JtXyA9ICQodGhpcyk7XG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybV8uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybV8uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkc3VibWl0LnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgfSlcblxuICAgIHJldHVybiB0cnVlO1xuICB9KVxuXG4gICQoXCIjYWN0aW9uLXN0YXJ0LWp1bXBcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeiA9IHBhcnNlSW50KCQodGhpcykuZGF0YSgnc3onKSwgMTApO1xuICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KCQodGhpcykudmFsKCksIDEwKTtcbiAgICB2YXIgc3RhcnQgPSAoIHZhbHVlIC0gMSApICogc3ogKyAxO1xuICAgIHZhciAkZm9ybV8gPSAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3RhcnQnIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3RhcnR9XCIgLz5gKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3onIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3p9XCIgLz5gKTtcbiAgICAkZm9ybV8uc3VibWl0KCk7XG4gIH0pXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiI3ZlcnNpb25JY29uXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
