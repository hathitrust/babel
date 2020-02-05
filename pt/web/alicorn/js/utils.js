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

        // HT.$search_form.hide();
        // HT.$reader.show();

        var fn;
        fn = function gotoPageFromResults(cfi) {
          setTimeout(function () {
            console.log("AHOY RESULTS gotoPage CLICK", cfi);
            // HT.reader.view.rendition.off("resized", fn);
            HT.reader.view.rendition.display(cfi).then(function () {
              console.log("AHOY RESULTS gotoPage DONE", cfi, HT.reader.view.currentLocation());
            });
          }, 100);
        };

        HT.reader.view.rendition.once("resized", fn.bind(window, cfi));

        HT.$search_form.scrollTop(0);

        HT.reader.emit('updateHighlights');
        HT.reader._updateHistoryUrl({});

        setTimeout(function () {
          console.log("AHOY RESULTS gotoPage CLICK", cfi);
          HT.reader.view.rendition.display(cfi).then(function () {
            console.log("AHOY RESULTS gotoPage DONE", cfi, HT.reader.view.currentLocation());
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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwibW9iaWZ5LmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsImFuYWx5dGljcyIsImxvZ0FjdGlvbiIsImhyZWYiLCJ0cmlnZ2VyIiwiZGVsaW0iLCJnZXQiLCJvbiIsImV2ZW50Iiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY29va2llIiwianNvbiIsImN1cnJpZCIsImlkcyIsImlkIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZXRUaW1lb3V0Iiwic2VsZiIsImRvY3VtZW50IiwiY3JlYXRlRWxlbWVudCIsImNyZWF0ZUVsZW1lbnROUyIsInZpZXciLCJjbGFzc0xpc3RQcm9wIiwicHJvdG9Qcm9wIiwiZWxlbUN0clByb3RvIiwiRWxlbWVudCIsIm9iakN0ciIsInN0clRyaW0iLCJ0cmltIiwiYXJySW5kZXhPZiIsIkFycmF5IiwiaXRlbSIsIkRPTUV4IiwidHlwZSIsIm1lc3NhZ2UiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInRleHQiLCJzaG93IiwidXBkYXRlX3N0YXR1cyIsImRpc3BsYXlfaW5mbyIsImhpZGVfZXJyb3IiLCJoaWRlIiwiaGlkZV9pbmZvIiwiZ2V0X3VybCIsInBhdGhuYW1lIiwicGFyc2VfbGluZSIsInJldHZhbCIsInRtcCIsImt2IiwiZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhIiwiYXJncyIsIm9wdGlvbnMiLCJleHRlbmQiLCJjcmVhdGluZyIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiY2FsbGJhY2siLCJjaGVja1ZhbGlkaXR5IiwicmVwb3J0VmFsaWRpdHkiLCJzdWJtaXRfcG9zdCIsImVhY2giLCIkdGhpcyIsIiRjb3VudCIsImxpbWl0IiwiYmluZCIsInBhcmFtcyIsInBhZ2UiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJjb25zb2xlIiwibG9nIiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImFsZXJ0Iiwic3JjIiwiaXRlbV90aXRsZSIsInRvdGFsIiwic3VmZml4IiwiY2xvc2VNb2RhbCIsImRhdGFUeXBlIiwiY2FjaGUiLCJlcnJvciIsInJlcSIsInN0YXR1cyIsImRpc3BsYXlXYXJuaW5nIiwiZGlzcGxheUVycm9yIiwiJHN0YXR1cyIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsInVwZGF0ZVN0YXR1c1RleHQiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJkb3dubG9hZCIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJfbGFzdE1lc3NhZ2UiLCJfbGFzdFRpbWVyIiwiY2xlYXJUaW1lb3V0IiwiaW5uZXJUZXh0IiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0Iiwic2VhcmNodHlwZSIsImdldENvbnRlbnRHcm91cERhdGEiLCJjb250ZW50X2dyb3VwIiwiX3NpbXBsaWZ5UGFnZUhyZWYiLCJuZXdfaHJlZiIsInFzIiwiZ2V0UGFnZUhyZWYiLCIkbWVudSIsIiR0cmlnZ2VyIiwiJGhlYWRlciIsIiRuYXZpZ2F0b3IiLCJtb2JpZnkiLCJzdHlsZSIsInNldFByb3BlcnR5Iiwib3V0ZXJIZWlnaHQiLCIkZXhwYW5kbyIsImRvY3VtZW50RWxlbWVudCIsImRhdGFzZXQiLCJleHBhbmRlZCIsInVpIiwiJHNpZGViYXIiLCJyZXF1ZXN0RnVsbFNjcmVlbiIsInV0aWxzIiwicGFyZW50cyIsImhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlIiwic3RhdGUiLCJzaWRlYmFyRXhwYW5kZWQiLCJ1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkiLCJ0b3AiLCJoZWlnaHQiLCIkc2VhcmNoX2Zvcm0iLCIkYm9keSIsInNlY3Rpb25fdmlldyIsInNlY3Rpb25WaWV3IiwiY2ZpIiwicG9wIiwiaGlnaGxpZ2h0Iiwic2Vzc2lvblN0b3JhZ2UiLCJzZXRJdGVtIiwiSlNPTiIsInN0cmluZ2lmeSIsImdvdG9QYWdlRnJvbVJlc3VsdHMiLCJyZW5kaXRpb24iLCJkaXNwbGF5IiwidGhlbiIsImN1cnJlbnRMb2NhdGlvbiIsIm9uY2UiLCJzY3JvbGxUb3AiLCJlbWl0IiwiX3VwZGF0ZUhpc3RvcnlVcmwiLCJyZW1vdmVBdHRyIiwiYmVmb3JlVW5sb2FkVGltZW91dCIsIiRmb3JtXyIsIiRzdWJtaXQiLCJxMSIsInNlcmlhbGl6ZSIsInJlc3BvbnNlIiwiJHJlc3BvbnNlIiwiJHJlc3VsdHMiLCIkcmVhZGVyIiwicmVwbGFjZVdpdGgiLCJhZnRlciIsIiRidG4iLCJzeiJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7O0FBT0EsQ0FBQyxDQUFDLFVBQVNBLE9BQVQsRUFBa0I7QUFDbkIsS0FBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUMvQztBQUNBLE1BQUssT0FBT0MsTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0YsVUFBTyxDQUFDLFFBQUQsQ0FBUCxFQUFtQkQsT0FBbkI7QUFDQSxHQUZELE1BRU87QUFDTkMsVUFBTyxFQUFQLEVBQVdELE9BQVg7QUFDQTtBQUNELEVB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QUUsY0FBRixFQUFrQmdRLEtBQWxCLENBQXdCLFVBQVMxTCxDQUFULEVBQVk7QUFDaENBLFVBQUUyTCxjQUFGO0FBQ0E3SSxnQkFBUWlLLEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgLy8gdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAvLyB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIC8vIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gIC8vICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gIC8vICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gIC8vICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgLy8gICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gIC8vICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAvLyAgICAgICB9LCA1MCk7XG4gIC8vICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAvLyAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAvLyAgICAgICB9LCA1MDApO1xuXG4gIC8vICAgICB9XG4gIC8vIH1cblxuICBIVC5hbmFseXRpY3MgPSBIVC5hbmFseXRpY3MgfHwge307XG4gIEhULmFuYWx5dGljcy5sb2dBY3Rpb24gPSBmdW5jdGlvbihocmVmLCB0cmlnZ2VyKSB7XG4gICAgaWYgKCBocmVmID09PSB1bmRlZmluZWQgKSB7IGhyZWYgPSBsb2NhdGlvbi5ocmVmIDsgfVxuICAgIHZhciBkZWxpbSA9IGhyZWYuaW5kZXhPZignOycpID4gLTEgPyAnOycgOiAnJic7XG4gICAgaWYgKCB0cmlnZ2VyID09IG51bGwgKSB7IHRyaWdnZXIgPSAnLSc7IH1cbiAgICBocmVmICs9IGRlbGltICsgJ2E9JyArIHRyaWdnZXI7XG4gICAgJC5nZXQoaHJlZik7XG4gIH1cblxuXG4gICQoXCJib2R5XCIpLm9uKCdjbGljaycsICdhW2RhdGEtdHJhY2tpbmctY2F0ZWdvcnk9XCJvdXRMaW5rc1wiXScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gdmFyIHRyaWdnZXIgPSAkKHRoaXMpLmRhdGEoJ3RyYWNraW5nLWFjdGlvbicpO1xuICAgIC8vIHZhciBsYWJlbCA9ICQodGhpcykuZGF0YSgndHJhY2tpbmctbGFiZWwnKTtcbiAgICAvLyBpZiAoIGxhYmVsICkgeyB0cmlnZ2VyICs9ICc6JyArIGxhYmVsOyB9XG4gICAgdmFyIHRyaWdnZXIgPSAnb3V0JyArICQodGhpcykuYXR0cignaHJlZicpO1xuICAgIEhULmFuYWx5dGljcy5sb2dBY3Rpb24odW5kZWZpbmVkLCB0cmlnZ2VyKTtcbiAgfSlcblxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIGlmICgkKCcjYWNjZXNzQmFubmVySUQnKS5sZW5ndGggPiAwKSB7XG4gICAgICB2YXIgc3VwcHJlc3MgPSAkKCdodG1sJykuaGFzQ2xhc3MoJ3N1cGFjY2JhbicpO1xuICAgICAgaWYgKHN1cHByZXNzKSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgdmFyIGRlYnVnID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdodGRldicpO1xuICAgICAgdmFyIGlkaGFzaCA9ICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCB1bmRlZmluZWQsIHtqc29uIDogdHJ1ZX0pO1xuICAgICAgdmFyIHVybCA9ICQudXJsKCk7IC8vIHBhcnNlIHRoZSBjdXJyZW50IHBhZ2UgVVJMXG4gICAgICB2YXIgY3VycmlkID0gdXJsLnBhcmFtKCdpZCcpO1xuICAgICAgaWYgKGlkaGFzaCA9PSBudWxsKSB7XG4gICAgICAgICAgaWRoYXNoID0ge307XG4gICAgICB9XG5cbiAgICAgIHZhciBpZHMgPSBbXTtcbiAgICAgIGZvciAodmFyIGlkIGluIGlkaGFzaCkge1xuICAgICAgICAgIGlmIChpZGhhc2guaGFzT3duUHJvcGVydHkoaWQpKSB7XG4gICAgICAgICAgICAgIGlkcy5wdXNoKGlkKTtcbiAgICAgICAgICB9XG4gICAgICB9XG5cbiAgICAgIGlmICgoaWRzLmluZGV4T2YoY3VycmlkKSA8IDApIHx8IGRlYnVnKSB7XG4gICAgICAgICAgaWRoYXNoW2N1cnJpZF0gPSAxO1xuICAgICAgICAgIC8vIHNlc3Npb24gY29va2llXG4gICAgICAgICAgJC5jb29raWUoJ2FjY2Vzcy5oYXRoaXRydXN0Lm9yZycsIGlkaGFzaCwgeyBqc29uIDogdHJ1ZSwgcGF0aDogJy8nLCBkb21haW46ICcuaGF0aGl0cnVzdC5vcmcnIH0pO1xuXG4gICAgICAgICAgZnVuY3Rpb24gc2hvd0FsZXJ0KCkge1xuICAgICAgICAgICAgICB2YXIgaHRtbCA9ICQoJyNhY2Nlc3NCYW5uZXJJRCcpLmh0bWwoKTtcbiAgICAgICAgICAgICAgdmFyICRhbGVydCA9IGJvb3Rib3guZGlhbG9nKGh0bWwsIFt7IGxhYmVsOiBcIk9LXCIsIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIgfV0sIHsgaGVhZGVyIDogJ1NwZWNpYWwgYWNjZXNzJywgcm9sZTogJ2FsZXJ0ZGlhbG9nJyB9KTtcbiAgICAgICAgICB9XG4gICAgICAgICAgd2luZG93LnNldFRpbWVvdXQoc2hvd0FsZXJ0LCAzMDAwLCB0cnVlKTtcbiAgICAgIH1cbiAgfVxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9IFwiYlwiO1xuXG4gICAgdmFyIElOX1lPVVJfQ09MTFNfTEFCRUwgPSAnVGhpcyBpdGVtIGlzIGluIHlvdXIgY29sbGVjdGlvbihzKTonO1xuXG4gICAgdmFyICR0b29sYmFyID0gJChcIi5jb2xsZWN0aW9uTGlua3MgLnNlbGVjdC1jb2xsZWN0aW9uXCIpO1xuICAgIHZhciAkZXJyb3Jtc2cgPSAkKFwiLmVycm9ybXNnXCIpO1xuICAgIHZhciAkaW5mb21zZyA9ICQoXCIuaW5mb21zZ1wiKTtcblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfZXJyb3IobXNnKSB7XG4gICAgICAgIGlmICggISAkZXJyb3Jtc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGVycm9ybXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yIGVycm9ybXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGVycm9ybXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2luZm8obXNnKSB7XG4gICAgICAgIGlmICggISAkaW5mb21zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkaW5mb21zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvIGluZm9tc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkaW5mb21zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9lcnJvcigpIHtcbiAgICAgICAgJGVycm9ybXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9pbmZvKCkge1xuICAgICAgICAkaW5mb21zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF91cmwoKSB7XG4gICAgICAgIHZhciB1cmwgPSBcIi9jZ2kvbWJcIjtcbiAgICAgICAgaWYgKCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL3NoY2dpL1wiKSA+IC0xICkge1xuICAgICAgICAgICAgdXJsID0gXCIvc2hjZ2kvbWJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlX2xpbmUoZGF0YSkge1xuICAgICAgICB2YXIgcmV0dmFsID0ge307XG4gICAgICAgIHZhciB0bXAgPSBkYXRhLnNwbGl0KFwifFwiKTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRtcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAgdmFyIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX0gdG8geW91ciBsaXN0LmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuICB2YXIgaSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NraW49Y3Jtc3dvcmxkJyk7XG4gIGlmICggaSArIDEgIT0gMCApIHtcbiAgICAgIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1Xb3JsZCc7XG4gIH1cblxuICAvLyBkaXNwbGF5IGJpYiBpbmZvcm1hdGlvblxuICB2YXIgJGRpdiA9ICQoXCIuYmliTGlua3NcIik7XG4gIHZhciAkcCA9ICRkaXYuZmluZChcInA6Zmlyc3RcIik7XG4gICRwLmZpbmQoXCJzcGFuOmVtcHR5XCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKHRoaXMpLnRleHQoJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSkuYWRkQ2xhc3MoXCJibG9ja2VkXCIpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gJzxzcGFuIGNsYXNzPVwiYmxvY2tlZFwiPjxzdHJvbmc+e2xhYmVsfTo8L3N0cm9uZz4ge2NvbnRlbnR9PC9zcGFuPic7XG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UoJ3tsYWJlbH0nLCAkKHRoaXMpLmF0dHIoJ3Byb3BlcnR5Jykuc3Vic3RyKDMpKS5yZXBsYWNlKCd7Y29udGVudH0nLCAkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKTtcbiAgICAgICRwLmFwcGVuZChmcmFnbWVudCk7XG4gIH0pXG5cbiAgdmFyICRsaW5rID0gJChcIiNlbWJlZEh0bWxcIik7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBFTUJFRFwiLCAkbGluayk7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xuXG4gICRsaW5rID0gJChcImFbZGF0YS10b2dnbGU9J1BUIEZpbmQgaW4gYSBMaWJyYXJ5J11cIik7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xufSlcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwib2Zmc2NyZWVuXCIgcm9sZT1cInN0YXR1c1wiIGFyaWEtYXRvbWljPVwidHJ1ZVwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAvLyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LXN1Y2Nlc3MgZG9uZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAvLyAgICAgJzxwPkFsbCBkb25lITwvcD4nICtcbiAgICAgICAgICAgIC8vICc8L2Rpdj4nICsgXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MgYnRuJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICAgIHNlbGYuJHN0YXR1cyA9IHNlbGYuJGRpYWxvZy5maW5kKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgc2VsZi51cGRhdGVTdGF0dXNUZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYudXBkYXRlU3RhdHVzVGV4dChgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiIGRvd25sb2FkPVwiZG93bmxvYWRcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICBpZiAoICRkb3dubG9hZF9idG4uZ2V0KDApLmRvd25sb2FkID09IHVuZGVmaW5lZCApIHtcbiAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hdHRyKCd0YXJnZXQnLCAnX2JsYW5rJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBzZWxmLnVwZGF0ZVN0YXR1c1RleHQoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG4gICAgdXBkYXRlU3RhdHVzVGV4dDogZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi5fbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgICBpZiAoIHNlbGYuX2xhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KHNlbGYuX2xhc3RUaW1lcik7IHNlbGYuX2xhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgICBzZWxmLl9sYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgICAgfSwgNTApO1xuICAgICAgICAgIHNlbGYuX2xhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgc2VsZi4kc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgICB9LCA1MDApO1xuXG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIGFuZCBkbyB0aGlzIGhlcmVcbiAgICAkKFwiI3NlbGVjdGVkUGFnZXNQZGZMaW5rXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBwcmludGFibGUgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKCBwcmludGFibGUubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBwcmludC48L3A+XCIgXTtcbiAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYXBwZWFyIGluIHRoZSBzZWxlY3Rpb24gY29udGVudHMgPGJ1dHRvbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgYm9yZGVyLWNvbG9yOiAjZWVlXFxcIiBjbGFzcz1cXFwiYnRuIHNxdWFyZVxcXCI+PGkgY2xhc3M9XFxcImljb21vb24gaWNvbW9vbi1wYXBlcnNcXFwiIHN0eWxlPVxcXCJjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMTRweDtcXFwiIC8+PC9idXR0b24+XCIpO1xuXG4gICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBzZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24ocHJpbnRhYmxlKTtcblxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3NlcScsIHNlcSk7XG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgfSk7XG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dDtcbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rICcgK1xuICAgICAgICAgICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAgICAgICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48aSBjbGFzcz1cImljb21vb24gaWNvbW9vbi1oZWxwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+SGVscDogRW1iZWRkaW5nIEhhdGhpVHJ1c3QgQm9va3M8L3NwYW4+PC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHJldHVybjtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICB2YXIgJG1lbnU7IHZhciAkdHJpZ2dlcjsgdmFyICRoZWFkZXI7IHZhciAkbmF2aWdhdG9yO1xuICBIVCA9IEhUIHx8IHt9O1xuXG4gIEhULm1vYmlmeSA9IGZ1bmN0aW9uKCkge1xuXG4gICAgLy8gaWYgKCAkKFwiaHRtbFwiKS5pcyhcIi5kZXNrdG9wXCIpICkge1xuICAgIC8vICAgJChcImh0bWxcIikuYWRkQ2xhc3MoXCJtb2JpbGVcIikucmVtb3ZlQ2xhc3MoXCJkZXNrdG9wXCIpLnJlbW92ZUNsYXNzKFwibm8tbW9iaWxlXCIpO1xuICAgIC8vIH1cblxuICAgICRoZWFkZXIgPSAkKFwiaGVhZGVyXCIpO1xuICAgICRuYXZpZ2F0b3IgPSAkKFwiLm5hdmlnYXRvclwiKTtcbiAgICBpZiAoICRuYXZpZ2F0b3IubGVuZ3RoICkge1xuICAgICAgJG5hdmlnYXRvci5nZXQoMCkuc3R5bGUuc2V0UHJvcGVydHkoJy0taGVpZ2h0JywgYC0keyRuYXZpZ2F0b3Iub3V0ZXJIZWlnaHQoKSAqIDAuOTB9cHhgKTtcbiAgICAgIHZhciAkZXhwYW5kbyA9ICRuYXZpZ2F0b3IuZmluZChcIi5hY3Rpb24tZXhwYW5kb1wiKTtcbiAgICAgICRleHBhbmRvLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9ICEgKCBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZGF0YXNldC5leHBhbmRlZCA9PSAndHJ1ZScgKTtcbiAgICAgIH0pXG5cbiAgICAgIGlmICggSFQucGFyYW1zLnVpID09ICdlbWJlZCcgKSB7XG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRleHBhbmRvLnRyaWdnZXIoJ2NsaWNrJyk7XG4gICAgICAgIH0sIDEwMDApO1xuICAgICAgfVxuICAgIH1cblxuICAgIEhULiRtZW51ID0gJG1lbnU7XG5cbiAgICB2YXIgJHNpZGViYXIgPSAkKFwiI3NpZGViYXJcIik7XG5cbiAgICAkdHJpZ2dlciA9ICRzaWRlYmFyLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIik7XG5cbiAgICAkKFwiI2FjdGlvbi1tb2JpbGUtdG9nZ2xlLWZ1bGxzY3JlZW5cIikub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQucmVxdWVzdEZ1bGxTY3JlZW4oKTtcbiAgICB9KVxuXG4gICAgSFQudXRpbHMgPSBIVC51dGlscyB8fCB7fTtcblxuICAgIC8vICRzaWRlYmFyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJy5zaWRlYmFyLWNvbnRhaW5lcicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAvLyBoaWRlIHRoZSBzaWRlYmFyXG4gICAgICB2YXIgJHRoaXMgPSAkKGV2ZW50LnRhcmdldCk7XG4gICAgICBpZiAoICR0aGlzLmlzKFwiaW5wdXRbdHlwZT0ndGV4dCddLHNlbGVjdFwiKSApIHtcbiAgICAgICAgcmV0dXJuO1xuICAgICAgfVxuICAgICAgaWYgKCAkdGhpcy5wYXJlbnRzKFwiLmZvcm0tc2VhcmNoLXZvbHVtZVwiKS5sZW5ndGggKSB7XG4gICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIGlmICggJHRoaXMuaXMoXCJidXR0b24sYVwiKSApIHtcbiAgICAgICAgSFQudG9nZ2xlKGZhbHNlKTtcbiAgICAgIH1cbiAgICB9KVxuXG4gICAgLy8gdmFyIHZoID0gd2luZG93LmlubmVySGVpZ2h0ICogMC4wMTtcbiAgICAvLyBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gJCh3aW5kb3cpLm9uKFwicmVzaXplXCIsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICB2YXIgdmggPSB3aW5kb3cuaW5uZXJIZWlnaHQgKiAwLjAxO1xuICAgIC8vICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKHdpbmRvdykub24oXCJvcmllbnRhdGlvbmNoYW5nZVwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgIHZhciB2aCA9IHdpbmRvdy5pbm5lckhlaWdodCAqIDAuMDE7XG4gICAgLy8gICAgICAgICBkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuc3R5bGUuc2V0UHJvcGVydHkoJy0tdmgnLCB2aCArICdweCcpO1xuXG4gICAgLy8gICAgICAgICBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSgpO1xuICAgIC8vICAgICB9LCAxMDApO1xuICAgIC8vIH0pXG4gICAgaWYgKCBIVCAmJiBIVC51dGlscyAmJiBIVC51dGlscy5oYW5kbGVPcmllbnRhdGlvbkNoYW5nZSApIHtcbiAgICAgIEhULnV0aWxzLmhhbmRsZU9yaWVudGF0aW9uQ2hhbmdlKCk7XG4gICAgfVxuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LmV4cGFuZGVkID0gJ3RydWUnO1xuICB9XG5cbiAgSFQudG9nZ2xlID0gZnVuY3Rpb24oc3RhdGUpIHtcblxuICAgIC8vICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcIi5zaWRlYmFyLWNvbnRhaW5lclwiKS5maW5kKFwiYnV0dG9uW2FyaWEtZXhwYW5kZWRdXCIpLmF0dHIoJ2FyaWEtZXhwYW5kZWQnLCBzdGF0ZSk7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQuc2lkZWJhckV4cGFuZGVkID0gc3RhdGU7XG4gICAgJChcImh0bWxcIikuZ2V0KDApLmRhdGFzZXQudmlldyA9IHN0YXRlID8gJ29wdGlvbnMnIDogJ3ZpZXdlcic7XG5cbiAgICAvLyB2YXIgeGxpbmtfaHJlZjtcbiAgICAvLyBpZiAoICR0cmlnZ2VyLmF0dHIoJ2FyaWEtZXhwYW5kZWQnKSA9PSAndHJ1ZScgKSB7XG4gICAgLy8gICB4bGlua19ocmVmID0gJyNwYW5lbC1leHBhbmRlZCc7XG4gICAgLy8gfSBlbHNlIHtcbiAgICAvLyAgIHhsaW5rX2hyZWYgPSAnI3BhbmVsLWNvbGxhcHNlZCc7XG4gICAgLy8gfVxuICAgIC8vICR0cmlnZ2VyLmZpbmQoXCJzdmcgdXNlXCIpLmF0dHIoXCJ4bGluazpocmVmXCIsIHhsaW5rX2hyZWYpO1xuICB9XG5cbiAgc2V0VGltZW91dChIVC5tb2JpZnksIDEwMDApO1xuXG4gIHZhciB1cGRhdGVUb29sYmFyVG9wUHJvcGVydHkgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaCA9ICQoXCIjc2lkZWJhciAuc2lkZWJhci10b2dnbGUtYnV0dG9uXCIpLm91dGVySGVpZ2h0KCkgfHwgNDA7XG4gICAgdmFyIHRvcCA9ICggJChcImhlYWRlclwiKS5oZWlnaHQoKSArIGggKSAqIDEuMDU7XG4gICAgZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LnN0eWxlLnNldFByb3BlcnR5KCctLXRvb2xiYXItaG9yaXpvbnRhbC10b3AnLCB0b3AgKyAncHgnKTtcbiAgfVxuICAkKHdpbmRvdykub24oJ3Jlc2l6ZScsIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSk7XG4gIHVwZGF0ZVRvb2xiYXJUb3BQcm9wZXJ0eSgpO1xuXG4gICQoXCJodG1sXCIpLmdldCgwKS5zZXRBdHRyaWJ1dGUoJ2RhdGEtc2lkZWJhci1leHBhbmRlZCcsIGZhbHNlKTtcblxufSlcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gIHZhciAkZm9ybSA9ICQoXCIuZm9ybS1zZWFyY2gtdm9sdW1lXCIpO1xuICBIVC4kc2VhcmNoX2Zvcm0gPSBudWxsO1xuXG4gIHZhciAkYm9keSA9ICQoXCJib2R5XCIpO1xuXG4gIHZhciBzZWN0aW9uX3ZpZXcgPSBmdW5jdGlvbih2aWV3KSB7XG4gICAgLy8gJGJvZHkuZ2V0KDApLmRhdGFzZXQuc2VjdGlvblZpZXcgPSB2aWV3O1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LnNpZGViYXJFeHBhbmRlZCA9IGZhbHNlO1xuICAgIGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5kYXRhc2V0LnNlY3Rpb25WaWV3ID0gdmlldztcbiAgICAkKFwiLnNpZGViYXItY29udGFpbmVyXCIpLmZpbmQoXCJidXR0b25bYXJpYS1leHBhbmRlZF1cIikuYXR0cignYXJpYS1leHBhbmRlZCcsIGZhbHNlKTtcbiAgfVxuXG4gIGlmICggJChcIiN0b29sYmFyLXZlcnRpY2FsXCIpLmxlbmd0aCApIHtcbiAgICAvLyAkaWZyYW1lLm9uKFwibG9hZFwiLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICQod2luZG93KS50cmlnZ2VyKCd1bmRvLWxvYWRpbmcnKTtcbiAgICAvLyAgICRpZnJhbWUuc2hvdygpO1xuXG4gICAgLy8gICB2YXIgJGNoZWNrID0gJChcIiNtZHBCYWNrVG9SZXN1bHRzXCIpO1xuICAgIC8vICAgaWYgKCAhICRjaGVjay5sZW5ndGggKSB7XG4gICAgLy8gICAgIHZhciBocmVmID0gJGlmcmFtZS5nZXQoMCkuY29udGVudFdpbmRvdy5sb2NhdGlvbi5ocmVmO1xuICAgIC8vICAgICAkY2hlY2sgPSAkKGA8ZGl2IGlkPVwibWRwQmFja1RvUmVzdWx0c1wiPjwvZGl2PmApO1xuICAgIC8vICAgICAkKFwiLmJpYkxpbmtzXCIpLmJlZm9yZSgkY2hlY2spO1xuICAgIC8vICAgICAkKFwiI21kcEJhY2tUb1Jlc3VsdHNcIikuYXBwZW5kKGA8cD48YSBkYXRhLXRvZ2dsZT1cInRyYWNraW5nXCIgZGF0YS10cmFja2luZy1jYXRlZ29yeT1cIlBUXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJQVCBCYWNrIHRvIEluIEl0ZW0gUmVzdWx0c1wiIGhyZWY9XCIke2hyZWZ9XCI+JiMxNzE7IEJhY2sgdG8gXCJTZWFyY2ggaW4gdGhpcyB0ZXh0XCIgcmVzdWx0czwvYT48L3A+YCk7XG4gICAgLy8gICB9XG5cbiAgICAvLyAgIC8vIGFjdHVhbGx5IHRoaXMgKmlzKiB0aGUgY3VycmVudCBVUkwuIEhtbS5cbiAgICAvLyAgIEhULnBhcmFtcy5xMSA9ICRpZnJhbWUuZ2V0KDApLmNvbnRlbnRXaW5kb3cuSFQucGFyYW1zLnExO1xuICAgIC8vICAgJChcImlucHV0W25hbWU9cTFdXCIpLnZhbChIVC5wYXJhbXMucTEpO1xuXG4gICAgLy8gICAkKHRoaXMpLmNvbnRlbnRzKCkub24oJ2NsaWNrJywgJy5iYWNrLXRvLWJlZ2lubmluZy1saW5rIGEnLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICAvLyBqdXN0IGNsb3NlIHRoaXMgaWZyYW1lXG4gICAgLy8gICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgIC8vICAgICAkaWZyYW1lLmhpZGUoKTtcbiAgICAvLyAgIH0pXG5cbiAgICAvLyAgICQodGhpcykuY29udGVudHMoKS5vbignY2xpY2snLCAnYXJ0aWNsZS5yZXN1bHQgYScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgLy8gICAgIHZhciAkbGluayA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFwiYVwiKTtcbiAgICAvLyAgICAgdmFyIGhyZWYgPSAkbGluay5hdHRyKCdocmVmJyk7XG5cbiAgICAvLyAgICAgdmFyIGZyYWdtZW50ID0gaHJlZi5zcGxpdCgnIycpO1xuICAgIC8vICAgICB2YXIgY2ZpID0gYGVwdWJjZmkoJHtmcmFnbWVudC5wb3AoKX0pYDtcbiAgICAvLyAgICAgc2V0VGltZW91dCgoKSA9PiB7XG5cbiAgICAvLyAgICAgICAkaWZyYW1lLmhpZGUoKTtcbiAgICAvLyAgICAgICBIVC5yZWFkZXIuZW1pdCgndXBkYXRlSGlnaGxpZ2h0cycpO1xuICAgIC8vICAgICAgIEhULnJlYWRlci5fdXBkYXRlSGlzdG9yeVVybCh7fSk7XG5cbiAgICAvLyAgICAgICBIVC5yZWFkZXIudmlldy5yZW5kaXRpb24uZGlzcGxheShjZmkpLnRoZW4oKCkgPT4ge1xuICAgIC8vICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIGdvdG9QYWdlXCIsIGNmaSwgSFQucmVhZGVyLnZpZXcuY3VycmVudExvY2F0aW9uKCkpO1xuICAgIC8vICAgICAgIH0pO1xuICAgIC8vICAgICB9LCAxMDApO1xuICAgIC8vICAgfSlcbiAgICAvLyB9KVxuXG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJy5iYWNrLXRvLWJlZ2lubmluZy1saW5rIGEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgLy8ganVzdCBjbG9zZSB0aGlzIGlmcmFtZVxuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgc2VjdGlvbl92aWV3KCdyZWFkZXInKTtcbiAgICB9KVxuXG4gICAgJChcImJvZHlcIikub24oJ2NsaWNrJywgJ2FydGljbGUucmVzdWx0IGEnLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgZXZlbnQucHJldmVudERlZmF1bHQoKTtcbiAgICAgIHZhciAkbGluayA9ICQoZXZlbnQudGFyZ2V0KS5jbG9zZXN0KFwiYVwiKTtcbiAgICAgIHZhciBocmVmID0gJGxpbmsuYXR0cignaHJlZicpO1xuXG4gICAgICB2YXIgZnJhZ21lbnQgPSBocmVmLnNwbGl0KCcjJyk7XG4gICAgICB2YXIgY2ZpID0gYGVwdWJjZmkoJHtmcmFnbWVudC5wb3AoKX0pYDtcblxuICAgICAgdmFyIGhpZ2hsaWdodCA9ICRsaW5rLmRhdGEoJ2hpZ2hsaWdodCcpO1xuICAgICAgc2Vzc2lvblN0b3JhZ2Uuc2V0SXRlbSgnaGlnaGxpZ2h0JywgSlNPTi5zdHJpbmdpZnkoaGlnaGxpZ2h0KSk7XG5cbiAgICAgIHNlY3Rpb25fdmlldygncmVhZGVyJyk7XG5cbiAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuXG4gICAgICAgIC8vIEhULiRzZWFyY2hfZm9ybS5oaWRlKCk7XG4gICAgICAgIC8vIEhULiRyZWFkZXIuc2hvdygpO1xuXG4gICAgICAgIHZhciBmbjtcbiAgICAgICAgZm4gPSBmdW5jdGlvbiBnb3RvUGFnZUZyb21SZXN1bHRzKGNmaSkge1xuICAgICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIFJFU1VMVFMgZ290b1BhZ2UgQ0xJQ0tcIiwgY2ZpKTtcbiAgICAgICAgICAgIC8vIEhULnJlYWRlci52aWV3LnJlbmRpdGlvbi5vZmYoXCJyZXNpemVkXCIsIGZuKTtcbiAgICAgICAgICAgIEhULnJlYWRlci52aWV3LnJlbmRpdGlvbi5kaXNwbGF5KGNmaSkudGhlbigoKSA9PiB7XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBSRVNVTFRTIGdvdG9QYWdlIERPTkVcIiwgY2ZpLCBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oKSk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICB9LCAxMDApO1xuICAgICAgICB9O1xuXG4gICAgICAgIEhULnJlYWRlci52aWV3LnJlbmRpdGlvbi5vbmNlKFwicmVzaXplZFwiLCBmbi5iaW5kKHdpbmRvdywgY2ZpKSk7XG5cbiAgICAgICAgSFQuJHNlYXJjaF9mb3JtLnNjcm9sbFRvcCgwKTtcblxuICAgICAgICBIVC5yZWFkZXIuZW1pdCgndXBkYXRlSGlnaGxpZ2h0cycpO1xuICAgICAgICBIVC5yZWFkZXIuX3VwZGF0ZUhpc3RvcnlVcmwoe30pO1xuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBSRVNVTFRTIGdvdG9QYWdlIENMSUNLXCIsIGNmaSk7XG4gICAgICAgICAgSFQucmVhZGVyLnZpZXcucmVuZGl0aW9uLmRpc3BsYXkoY2ZpKS50aGVuKCgpID0+IHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBSRVNVTFRTIGdvdG9QYWdlIERPTkVcIiwgY2ZpLCBIVC5yZWFkZXIudmlldy5jdXJyZW50TG9jYXRpb24oKSk7XG4gICAgICAgICAgfSk7XG4gICAgICAgIH0sIDEwMCk7XG4gICAgICB9LCAxMDApO1xuICAgIH0pXG5cbiAgICAkKFwiYm9keVwiKS5vbignY2xpY2snLCAnI21kcEJhY2tUb1Jlc3VsdHMgYVtkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlBUIEJhY2sgdG8gSW4gSXRlbSBSZXN1bHRzXCJdJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgIGV2ZW50LnByZXZlbnREZWZhdWx0KCk7XG4gICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgIFxuICAgICAgc2VjdGlvbl92aWV3KCdzZWFyY2gtcmVzdWx0cycpO1xuXG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfSlcbiAgfVxuXG4gICQod2luZG93KS5vbigndW5kby1sb2FkaW5nJywgZnVuY3Rpb24oKSB7XG4gICAgJChcImJ1dHRvbi5idG4tbG9hZGluZ1wiKS5yZW1vdmVBdHRyKFwiZGlzYWJsZWRcIikucmVtb3ZlQ2xhc3MoXCJidG4tbG9hZGluZ1wiKTtcbiAgfSlcblxuICAvLyAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpIHtcbiAgJChcImJvZHlcIikub24oJ3N1Ym1pdCcsICdmb3JtLmZvcm0tc2VhcmNoLXZvbHVtZScsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgSFQuYmVmb3JlVW5sb2FkVGltZW91dCA9IDE1MDAwO1xuICAgIHZhciAkZm9ybV8gPSAkKHRoaXMpO1xuXG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybV8uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybV8uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgIGlmICggJGZvcm1fLmRhdGEoJ3EnKSA9PSAkLnRyaW0oJGlucHV0LnZhbCgpKSAmJiBIVC4kc2VhcmNoX2Zvcm0gKSB7XG4gICAgICAvLyBzYW1lIHF1ZXJ5LCBqdXN0IHNob3cgdGhlIGRhbmcgaWZyYW1lXG4gICAgICAkKHdpbmRvdykudHJpZ2dlcigndW5kby1sb2FkaW5nJyk7XG4gICAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgc2VjdGlvbl92aWV3KCdzZWFyY2gtcmVzdWx0cycpO1xuICAgICAgLy8gSFQuJHJlYWRlci5oaWRlKCk7XG4gICAgICAvLyBIVC4kc2VhcmNoX2Zvcm0uc2hvdygpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cblxuICAgICRmb3JtXy5kYXRhKCdxJywgJC50cmltKCRpbnB1dC52YWwoKSkpO1xuICAgIEhULnBhcmFtcy5xMSA9ICRmb3JtXy5kYXRhKCdxJyk7XG4gICAgJChcImlucHV0W25hbWU9J3ExJ11cIikudmFsKEhULnBhcmFtcy5xMSk7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJHN1Ym1pdC5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgIH0pXG5cbiAgICAvLyByZXR1cm4gdHJ1ZTtcbiAgICBldmVudC5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgJC5hamF4KHtcbiAgICAgIHVybDogJy9jZ2kvcHQvc2VhcmNoJyxcbiAgICAgIG1ldGhvZDogJ0dFVCcsXG4gICAgICBkYXRhOiAkZm9ybV8uc2VyaWFsaXplKClcbiAgICB9KS5kb25lKGZ1bmN0aW9uIChyZXNwb25zZSkge1xuICAgICAgJCh3aW5kb3cpLnRyaWdnZXIoJ3VuZG8tbG9hZGluZycpO1xuICAgICAgdmFyICRyZXNwb25zZSA9ICQocmVzcG9uc2UpO1xuXG4gICAgICB2YXIgJHJlc3VsdHMgPSAkcmVzcG9uc2UuZmluZChcIm1haW5cIik7XG4gICAgICAkcmVzdWx0cy5hdHRyKCdpZCcsICdzZWFyY2gtcmVzdWx0cycpO1xuICAgICAgSFQuJHJlYWRlciA9ICQoXCJtYWluI21haW5cIik7XG4gICAgICBpZiAoIEhULiRzZWFyY2hfZm9ybSApIHtcbiAgICAgICAgSFQuJHNlYXJjaF9mb3JtLnJlcGxhY2VXaXRoKCRyZXN1bHRzKTtcbiAgICAgICAgSFQuJHNlYXJjaF9mb3JtID0gJChcIm1haW4jc2VhcmNoLXJlc3VsdHNcIik7XG4gICAgICB9IGVsc2Uge1xuICAgICAgICBIVC4kc2VhcmNoX2Zvcm0gPSAkcmVzdWx0cztcbiAgICAgICAgSFQuJHJlYWRlci5hZnRlcihIVC4kc2VhcmNoX2Zvcm0pO1xuICAgICAgfVxuXG4gICAgICAvLyB2YXIgJHJlc3VsdHMgPSAkcmVzcG9uc2UuZmluZChcInNlY3Rpb24jc2VjdGlvblwiKTtcbiAgICAgIC8vIEhULiRyZWFkZXIgPSAkKFwic2VjdGlvbiNzZWN0aW9uXCIpO1xuICAgICAgLy8gaWYgKCBIVC4kc2VhcmNoX2Zvcm0gKSB7XG4gICAgICAvLyAgIEhULiRzZWFyY2hfZm9ybS5yZXBsYWNlV2l0aCgkcmVzdWx0cyk7XG4gICAgICAvLyAgIEhULiRzZWFyY2hfZm9ybSA9ICQoXCJzZWN0aW9uLnNlYXJjaC1yZXN1bHRzLWNvbnRhaW5lclwiKTtcbiAgICAgIC8vIH0gZWxzZSB7XG4gICAgICAvLyAgIEhULiRzZWFyY2hfZm9ybSA9ICRyZXN1bHRzO1xuICAgICAgLy8gICBIVC4kcmVhZGVyLmFmdGVyKEhULiRzZWFyY2hfZm9ybSk7XG4gICAgICAvLyB9XG5cbiAgICAgIHNlY3Rpb25fdmlldygnc2VhcmNoLXJlc3VsdHMnKTtcblxuICAgICAgLy8gdGhpcyBpcyB3aHk/XG4gICAgICB2YXIgJGJ0biA9IEhULiRzZWFyY2hfZm9ybS5maW5kKFwiLnNpZGViYXItdG9nZ2xlLWJ1dHRvblwiKTtcbiAgICAgIGlmICggJGJ0bi5oZWlnaHQoKSA9PSAwICYmICggJChcImh0bWxcIikuaXMoXCIuaW9zXCIpIHx8ICQoXCJodG1sXCIpLmlzKFwiLnNhZmFyaVwiKSApICkge1xuICAgICAgICAkYnRuLmFkZENsYXNzKFwic3R1cGlkLWhhY2tcIik7XG4gICAgICB9XG5cblxuICAgIH0pXG5cblxuICB9KVxuXG4gICQoXCIjYWN0aW9uLXN0YXJ0LWp1bXBcIikub24oJ2NoYW5nZScsIGZ1bmN0aW9uKCkge1xuICAgIHZhciBzeiA9IHBhcnNlSW50KCQodGhpcykuZGF0YSgnc3onKSwgMTApO1xuICAgIHZhciB2YWx1ZSA9IHBhcnNlSW50KCQodGhpcykudmFsKCksIDEwKTtcbiAgICB2YXIgc3RhcnQgPSAoIHZhbHVlIC0gMSApICogc3ogKyAxO1xuICAgIHZhciAkZm9ybV8gPSAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3RhcnQnIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3RhcnR9XCIgLz5gKTtcbiAgICAkZm9ybV8uYXBwZW5kKGA8aW5wdXQgbmFtZT0nc3onIHR5cGU9XCJoaWRkZW5cIiB2YWx1ZT1cIiR7c3p9XCIgLz5gKTtcbiAgICAkZm9ybV8uc3VibWl0KCk7XG4gIH0pXG5cbiAgLy8gaGFuZGxpbmcgRVBVQi1yZWxhdGVkIGxpbmtzXG4gIC8vIC0tLSByZW5hYmxlIHRoaXNcbiAgLy8gJChcImJvZHlcIikub24oJ2NsaWNrJywgXCJbZGF0YS1oaWdobGlnaHRdXCIsIGZ1bmN0aW9uKCkge1xuICAvLyAgIHZhciBoaWdobGlnaHQgPSAkKHRoaXMpLmRhdGEoJ2hpZ2hsaWdodCcpO1xuICAvLyAgIHNlc3Npb25TdG9yYWdlLnNldEl0ZW0oJ2hpZ2hsaWdodCcsIEpTT04uc3RyaW5naWZ5KGhpZ2hsaWdodCkpO1xuICAvLyB9KVxuXG4gIC8vIHNldEludGVydmFsKCgpID0+IHtcbiAgLy8gICB2YXIgbWFpbiA9IGRvY3VtZW50LnF1ZXJ5U2VsZWN0b3IoJ21haW4nKTtcbiAgLy8gICBjb25zb2xlLmxvZyhcIkFIT1kgTUFJTlwiLCBtYWluLm9mZnNldEhlaWdodCwgbWFpbi5zY3JvbGxUb3ApO1xuICAvLyB9LCAxMCk7XG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCIjdmVyc2lvbkljb25cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
