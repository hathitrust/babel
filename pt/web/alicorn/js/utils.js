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

var HT = HT || {};
head.ready(function () {

  var $status = $("div[role=status]");

  var lastMessage;var lastTimer;
  HT.update_status = function (message) {
    if (lastMessage != message) {
      if (lastTimer) {
        clearTimeout(lastTimer);lastTimer = null;
      }

      setTimeout(function () {
        $status.text(message);
        lastMessage = message;
        console.log("-- status:", message);
      }, 50);
      lastTimer = setTimeout(function () {
        $status.get(0).innerText = '';
      }, 500);
    }
  };
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
            kv = tmp[i].split("=");
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
        "<div class=\"initial\"><p>Setting up the download...</div>" + '<div class="progress progress-striped active hide" aria-hidden="true">' + '<div class="bar" width="0%"></div>' + '</div>' +
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
            'class': 'btn-x-dismiss',
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

        // HT.update_status(`Building your ${self.item_title}.`);

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
            HT.update_status("Please wait while we build your " + self.item_title + ".");
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html("<p>All done! Your " + self.item_title + " is ready for download. <span class=\"offscreen\">Select " + download_key + " to download.</span></p>");
            HT.update_status("All done! Your " + self.item_title + " is ready for download. Select " + download_key + " to download.");

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
            // HT.update_status(`Your ${self.item_title} is ready for download. Press return to download.`);
            // still could cancel
        } else {
            self.$dialog.find(".initial").text("Please wait while we build your " + self.item_title + " (" + Math.ceil(percent) + "% completed).");
            HT.update_status(Math.ceil(percent) + "% completed");
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
  $("#form-search-volume").submit(function () {
    var $form = $(this);
    var $submit = $form.find("button[type=submit]");
    if ($submit.hasClass("btn-loading")) {
      alert("Your search query has been submitted and is currently being processed.");
      return false;
    }
    var $input = $form.find("input[type=text]");
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
});
"use strict";

head.ready(function () {

    $("#versionIcon").click(function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImFjY2Vzc19iYW5uZXIuanMiLCJjbGFzc0xpc3QuanMiLCJjb2xsZWN0aW9uX3Rvb2xzLmpzIiwiY3Jtcy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJnb29nbGVfYW5hbHl0aWNzLmpzIiwic2VhcmNoX2luX2l0ZW0uanMiLCJ2ZXJzaW9uX3BvcHVwLmpzIl0sIm5hbWVzIjpbImZhY3RvcnkiLCJkZWZpbmUiLCJhbWQiLCJqUXVlcnkiLCIkIiwidW5kZWZpbmVkIiwidGFnMmF0dHIiLCJhIiwiaW1nIiwiZm9ybSIsImJhc2UiLCJzY3JpcHQiLCJpZnJhbWUiLCJsaW5rIiwia2V5IiwiYWxpYXNlcyIsInBhcnNlciIsInN0cmljdCIsImxvb3NlIiwidG9TdHJpbmciLCJPYmplY3QiLCJwcm90b3R5cGUiLCJpc2ludCIsInBhcnNlVXJpIiwidXJsIiwic3RyaWN0TW9kZSIsInN0ciIsImRlY29kZVVSSSIsInJlcyIsImV4ZWMiLCJ1cmkiLCJhdHRyIiwicGFyYW0iLCJzZWciLCJpIiwicGFyc2VTdHJpbmciLCJwYXRoIiwicmVwbGFjZSIsInNwbGl0IiwiZnJhZ21lbnQiLCJob3N0IiwicHJvdG9jb2wiLCJwb3J0IiwiZ2V0QXR0ck5hbWUiLCJlbG0iLCJ0biIsInRhZ05hbWUiLCJ0b0xvd2VyQ2FzZSIsInByb21vdGUiLCJwYXJlbnQiLCJsZW5ndGgiLCJ0IiwicGFyc2UiLCJwYXJ0cyIsInZhbCIsInBhcnQiLCJzaGlmdCIsImlzQXJyYXkiLCJwdXNoIiwib2JqIiwia2V5cyIsImluZGV4T2YiLCJzdWJzdHIiLCJ0ZXN0IiwibWVyZ2UiLCJsZW4iLCJsYXN0IiwiayIsInNldCIsInJlZHVjZSIsIlN0cmluZyIsInJldCIsInBhaXIiLCJkZWNvZGVVUklDb21wb25lbnQiLCJlIiwiZXFsIiwiYnJhY2UiLCJsYXN0QnJhY2VJbktleSIsInYiLCJjIiwiYWNjdW11bGF0b3IiLCJsIiwiY3VyciIsImFyZ3VtZW50cyIsImNhbGwiLCJ2QXJnIiwicHJvcCIsImhhc093blByb3BlcnR5IiwicHVybCIsIndpbmRvdyIsImxvY2F0aW9uIiwiZGF0YSIsInF1ZXJ5IiwiZnBhcmFtIiwic2VnbWVudCIsImZzZWdtZW50IiwiZm4iLCJIVCIsImhlYWQiLCJyZWFkeSIsIiRzdGF0dXMiLCJsYXN0TWVzc2FnZSIsImxhc3RUaW1lciIsInVwZGF0ZV9zdGF0dXMiLCJtZXNzYWdlIiwiY2xlYXJUaW1lb3V0Iiwic2V0VGltZW91dCIsInRleHQiLCJjb25zb2xlIiwibG9nIiwiZ2V0IiwiaW5uZXJUZXh0Iiwic3VwcHJlc3MiLCJoYXNDbGFzcyIsImRlYnVnIiwiaWRoYXNoIiwiY29va2llIiwianNvbiIsImN1cnJpZCIsImlkcyIsImlkIiwic2hvd0FsZXJ0IiwiaHRtbCIsIiRhbGVydCIsImJvb3Rib3giLCJkaWFsb2ciLCJsYWJlbCIsImhlYWRlciIsInJvbGUiLCJkb21haW4iLCJzZWxmIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwidmlldyIsImNsYXNzTGlzdFByb3AiLCJwcm90b1Byb3AiLCJlbGVtQ3RyUHJvdG8iLCJFbGVtZW50Iiwib2JqQ3RyIiwic3RyVHJpbSIsInRyaW0iLCJhcnJJbmRleE9mIiwiQXJyYXkiLCJpdGVtIiwiRE9NRXgiLCJ0eXBlIiwibmFtZSIsImNvZGUiLCJET01FeGNlcHRpb24iLCJjaGVja1Rva2VuQW5kR2V0SW5kZXgiLCJjbGFzc0xpc3QiLCJ0b2tlbiIsIkNsYXNzTGlzdCIsImVsZW0iLCJ0cmltbWVkQ2xhc3NlcyIsImdldEF0dHJpYnV0ZSIsImNsYXNzZXMiLCJfdXBkYXRlQ2xhc3NOYW1lIiwic2V0QXR0cmlidXRlIiwiY2xhc3NMaXN0UHJvdG8iLCJjbGFzc0xpc3RHZXR0ZXIiLCJFcnJvciIsImNvbnRhaW5zIiwiYWRkIiwidG9rZW5zIiwidXBkYXRlZCIsInJlbW92ZSIsImluZGV4Iiwic3BsaWNlIiwidG9nZ2xlIiwiZm9yY2UiLCJyZXN1bHQiLCJtZXRob2QiLCJyZXBsYWNlbWVudF90b2tlbiIsImpvaW4iLCJkZWZpbmVQcm9wZXJ0eSIsImNsYXNzTGlzdFByb3BEZXNjIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsImV4IiwibnVtYmVyIiwiX19kZWZpbmVHZXR0ZXJfXyIsInRlc3RFbGVtZW50IiwiY3JlYXRlTWV0aG9kIiwib3JpZ2luYWwiLCJET01Ub2tlbkxpc3QiLCJfdG9nZ2xlIiwic2xpY2UiLCJhcHBseSIsIkRFRkFVTFRfQ09MTF9NRU5VX09QVElPTiIsIk5FV19DT0xMX01FTlVfT1BUSU9OIiwiSU5fWU9VUl9DT0xMU19MQUJFTCIsIiR0b29sYmFyIiwiJGVycm9ybXNnIiwiJGluZm9tc2ciLCJkaXNwbGF5X2Vycm9yIiwibXNnIiwiaW5zZXJ0QWZ0ZXIiLCJzaG93IiwiZGlzcGxheV9pbmZvIiwiaGlkZV9lcnJvciIsImhpZGUiLCJoaWRlX2luZm8iLCJnZXRfdXJsIiwicGF0aG5hbWUiLCJwYXJzZV9saW5lIiwicmV0dmFsIiwidG1wIiwia3YiLCJlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEiLCJhcmdzIiwib3B0aW9ucyIsImV4dGVuZCIsImNyZWF0aW5nIiwiJGJsb2NrIiwiY24iLCJmaW5kIiwiZGVzYyIsInNocmQiLCJsb2dpbl9zdGF0dXMiLCJsb2dnZWRfaW4iLCJhcHBlbmRUbyIsIiRoaWRkZW4iLCJjbG9uZSIsImlpZCIsIiRkaWFsb2ciLCJjYWxsYmFjayIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInN1Ym1pdF9wb3N0IiwiZWFjaCIsIiR0aGlzIiwiJGNvdW50IiwibGltaXQiLCJiaW5kIiwicGFyYW1zIiwicGFnZSIsImFqYXgiLCJkb25lIiwiYWRkX2l0ZW1fdG9fY29sbGlzdCIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJlcnJvclRocm93biIsIiR1bCIsImNvbGxfaHJlZiIsImNvbGxfaWQiLCIkYSIsImNvbGxfbmFtZSIsImFwcGVuZCIsIiRvcHRpb24iLCJjb25maXJtX2xhcmdlIiwiY29sbFNpemUiLCJhZGROdW1JdGVtcyIsIm51bVN0ciIsImNvbmZpcm0iLCJhbnN3ZXIiLCJjbGljayIsInByZXZlbnREZWZhdWx0IiwiYWN0aW9uIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9pZCIsInNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSIsImMyIiwiaXMiLCJjcm1zX3N0YXRlIiwiaHJlZiIsIiRkaXYiLCIkcCIsIiRsaW5rIiwiRG93bmxvYWRlciIsImluaXQiLCJwZGYiLCJzdGFydCIsImJpbmRFdmVudHMiLCJhZGRDbGFzcyIsImhpZGVBbGwiLCJkb3dubG9hZF9wcm9ncmVzc19iYXNlIiwiZG93bmxvYWRQZGYiLCJleHBsYWluUGRmQWNjZXNzIiwiYWxlcnQiLCJzcmMiLCJpdGVtX3RpdGxlIiwidG90YWwiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwic3RhdHVzIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCJyZXF1ZXN0RG93bmxvYWQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJzZXRJbnRlcnZhbCIsImNoZWNrU3RhdHVzIiwidHMiLCJEYXRlIiwiZ2V0VGltZSIsInN1Y2Nlc3MiLCJ1cGRhdGVQcm9ncmVzcyIsIm51bV9hdHRlbXB0cyIsImRpc3BsYXlQcm9jZXNzRXJyb3IiLCJsb2dFcnJvciIsInBlcmNlbnQiLCJjdXJyZW50IiwiY3VycmVudF9wYWdlIiwibGFzdF9wZXJjZW50IiwicmVtb3ZlQ2xhc3MiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJvbiIsInRyaWdnZXIiLCJyZWFkZXIiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9jbGVhclNlbGVjdGlvbiIsInN0b3BQcm9wYWdhdGlvbiIsImZvY3VzIiwiTWF0aCIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInBhcnNlSW50IiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJyYXRlIiwibm93IiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwiYW5hbHl0aWNzIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0IiwiZXZlbnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRzdWJtaXQiLCJyZW1vdmVBdHRyIl0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7QUFPQSxDQUFDLENBQUMsVUFBU0EsT0FBVCxFQUFrQjtBQUNuQixLQUFJ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UkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAgICAgICB9LCA1MDApO1xuXG4gICAgICB9XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICBpZiAoJCgnI2FjY2Vzc0Jhbm5lcklEJykubGVuZ3RoID4gMCkge1xuICAgICAgdmFyIHN1cHByZXNzID0gJCgnaHRtbCcpLmhhc0NsYXNzKCdzdXBhY2NiYW4nKTtcbiAgICAgIGlmIChzdXBwcmVzcykge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgIH1cbiAgICAgIHZhciBkZWJ1ZyA9ICQoJ2h0bWwnKS5oYXNDbGFzcygnaHRkZXYnKTtcbiAgICAgIHZhciBpZGhhc2ggPSAkLmNvb2tpZSgnYWNjZXNzLmhhdGhpdHJ1c3Qub3JnJywgdW5kZWZpbmVkLCB7anNvbiA6IHRydWV9KTtcbiAgICAgIHZhciB1cmwgPSAkLnVybCgpOyAvLyBwYXJzZSB0aGUgY3VycmVudCBwYWdlIFVSTFxuICAgICAgdmFyIGN1cnJpZCA9IHVybC5wYXJhbSgnaWQnKTtcbiAgICAgIGlmIChpZGhhc2ggPT0gbnVsbCkge1xuICAgICAgICAgIGlkaGFzaCA9IHt9O1xuICAgICAgfVxuXG4gICAgICB2YXIgaWRzID0gW107XG4gICAgICBmb3IgKHZhciBpZCBpbiBpZGhhc2gpIHtcbiAgICAgICAgICBpZiAoaWRoYXNoLmhhc093blByb3BlcnR5KGlkKSkge1xuICAgICAgICAgICAgICBpZHMucHVzaChpZCk7XG4gICAgICAgICAgfVxuICAgICAgfVxuXG4gICAgICBpZiAoKGlkcy5pbmRleE9mKGN1cnJpZCkgPCAwKSB8fCBkZWJ1Zykge1xuICAgICAgICAgIGlkaGFzaFtjdXJyaWRdID0gMTtcbiAgICAgICAgICAvLyBzZXNzaW9uIGNvb2tpZVxuICAgICAgICAgICQuY29va2llKCdhY2Nlc3MuaGF0aGl0cnVzdC5vcmcnLCBpZGhhc2gsIHsganNvbiA6IHRydWUsIHBhdGg6ICcvJywgZG9tYWluOiAnLmhhdGhpdHJ1c3Qub3JnJyB9KTtcblxuICAgICAgICAgIGZ1bmN0aW9uIHNob3dBbGVydCgpIHtcbiAgICAgICAgICAgICAgdmFyIGh0bWwgPSAkKCcjYWNjZXNzQmFubmVySUQnKS5odG1sKCk7XG4gICAgICAgICAgICAgIHZhciAkYWxlcnQgPSBib290Ym94LmRpYWxvZyhodG1sLCBbeyBsYWJlbDogXCJPS1wiLCBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiIH1dLCB7IGhlYWRlciA6ICdTcGVjaWFsIGFjY2VzcycsIHJvbGU6ICdhbGVydGRpYWxvZycgfSk7XG4gICAgICAgICAgfVxuICAgICAgICAgIHdpbmRvdy5zZXRUaW1lb3V0KHNob3dBbGVydCwgMzAwMCwgdHJ1ZSk7XG4gICAgICB9XG4gIH1cblxufSkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjIuMjAxNzEyMTBcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiBzZWxmKSB7XG5cbi8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbi8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuaWYgKFxuXHQgICAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlNcblx0JiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKVxuKSB7XG5cbihmdW5jdGlvbiAodmlldykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbnZhclxuXHQgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG5cdCwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuXHQsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG5cdCwgb2JqQ3RyID0gT2JqZWN0XG5cdCwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXHR9XG5cdCwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdHZhclxuXHRcdFx0ICBpID0gMFxuXHRcdFx0LCBsZW4gPSB0aGlzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXHQvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcblx0LCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0dGhpcy5uYW1lID0gdHlwZTtcblx0XHR0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0fVxuXHQsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG5cdFx0aWYgKHRva2VuID09PSBcIlwiKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJTWU5UQVhfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBiZSBlbXB0eS5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGNvbnRhaW4gc3BhY2UgY2hhcmFjdGVycy5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcblx0fVxuXHQsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcblx0XHRcdCwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG5cdFx0XHQsIGkgPSAwXG5cdFx0XHQsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHRoaXMucHVzaChjbGFzc2VzW2ldKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuXHRcdH07XG5cdH1cblx0LCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cblx0LCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG5cdH1cbjtcbi8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbi8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG5jbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcblx0cmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbn07XG5jbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuXHRyZXR1cm4gfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbiArIFwiXCIpO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKCF+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAofmluZGV4KSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHZhclxuXHRcdCAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcblx0XHQsIG1ldGhvZCA9IHJlc3VsdCA/XG5cdFx0XHRmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG5cdFx0OlxuXHRcdFx0Zm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcblx0O1xuXG5cdGlmIChtZXRob2QpIHtcblx0XHR0aGlzW21ldGhvZF0odG9rZW4pO1xuXHR9XG5cblx0aWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmb3JjZTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gIXJlc3VsdDtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdHZhciBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0b2tlbiArIFwiXCIpO1xuXHRpZiAofmluZGV4KSB7XG5cdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEsIHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufVxuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0oc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0Ly8gcmVwbGFjZSgpIHBvbHlmaWxsXG5cdGlmICghKFwicmVwbGFjZVwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpLmNsYXNzTGlzdCkpIHtcblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0b2tlbnMgPSB0aGlzLnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpXG5cdFx0XHRcdCwgaW5kZXggPSB0b2tlbnMuaW5kZXhPZih0b2tlbiArIFwiXCIpXG5cdFx0XHQ7XG5cdFx0XHRpZiAofmluZGV4KSB7XG5cdFx0XHRcdHRva2VucyA9IHRva2Vucy5zbGljZShpbmRleCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlLmFwcGx5KHRoaXMsIHRva2Vucyk7XG5cdFx0XHRcdHRoaXMuYWRkKHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHRcdFx0dGhpcy5hZGQuYXBwbHkodGhpcywgdG9rZW5zLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0ZXN0RWxlbWVudCA9IG51bGw7XG59KCkpO1xuXG59IiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX0gdG8geW91ciBsaXN0LmApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuICB2YXIgaSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NraW49Y3Jtc3dvcmxkJyk7XG4gIGlmICggaSArIDEgIT0gMCApIHtcbiAgICAgIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1Xb3JsZCc7XG4gIH1cblxuICAvLyBkaXNwbGF5IGJpYiBpbmZvcm1hdGlvblxuICB2YXIgJGRpdiA9ICQoXCIuYmliTGlua3NcIik7XG4gIHZhciAkcCA9ICRkaXYuZmluZChcInA6Zmlyc3RcIik7XG4gICRwLmZpbmQoXCJzcGFuOmVtcHR5XCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKHRoaXMpLnRleHQoJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSkuYWRkQ2xhc3MoXCJibG9ja2VkXCIpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gJzxzcGFuIGNsYXNzPVwiYmxvY2tlZFwiPjxzdHJvbmc+e2xhYmVsfTo8L3N0cm9uZz4ge2NvbnRlbnR9PC9zcGFuPic7XG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UoJ3tsYWJlbH0nLCAkKHRoaXMpLmF0dHIoJ3Byb3BlcnR5Jykuc3Vic3RyKDMpKS5yZXBsYWNlKCd7Y29udGVudH0nLCAkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKTtcbiAgICAgICRwLmFwcGVuZChmcmFnbWVudCk7XG4gIH0pXG5cbiAgdmFyICRsaW5rID0gJChcIiNlbWJlZEh0bWxcIik7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBFTUJFRFwiLCAkbGluayk7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xuXG4gICRsaW5rID0gJChcImFbZGF0YS10b2dnbGU9J1BUIEZpbmQgaW4gYSBMaWJyYXJ5J11cIik7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xufSlcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgaGlkZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYmFyXCIgd2lkdGg9XCIwJVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgLy8gJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1zdWNjZXNzIGRvbmUgaGlkZVwiPicgK1xuICAgICAgICAgICAgLy8gICAgICc8cD5BbGwgZG9uZSE8L3A+JyArXG4gICAgICAgICAgICAvLyAnPC9kaXY+JyArIFxuICAgICAgICAgICAgYDxkaXY+PHA+PGEgaHJlZj1cImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2hlbHBfZGlnaXRhbF9saWJyYXJ5I0Rvd25sb2FkVGltZVwiIHRhcmdldD1cIl9ibGFua1wiPldoYXQgYWZmZWN0cyB0aGUgZG93bmxvYWQgc3BlZWQ/PC9hPjwvcD48L2Rpdj5gO1xuXG4gICAgICAgIHZhciBoZWFkZXIgPSAnQnVpbGRpbmcgeW91ciAnICsgc2VsZi5pdGVtX3RpdGxlO1xuICAgICAgICB2YXIgdG90YWwgPSBzZWxmLiRsaW5rLmRhdGEoJ3RvdGFsJykgfHwgMDtcbiAgICAgICAgaWYgKCB0b3RhbCA+IDAgKSB7XG4gICAgICAgICAgICB2YXIgc3VmZml4ID0gdG90YWwgPT0gMSA/ICdwYWdlJyA6ICdwYWdlcyc7XG4gICAgICAgICAgICBoZWFkZXIgKz0gJyAoJyArIHRvdGFsICsgJyAnICsgc3VmZml4ICsgJyknO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnQ2FuY2VsJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4teC1kaXNtaXNzJyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgdXJsOiBzZWxmLnNyYyArICc7Y2FsbGJhY2s9SFQuZG93bmxvYWRlci5jYW5jZWxEb3dubG9hZDtzdG9wPTEnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBDQU5DRUxMRUQgRVJST1JcIik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIGhlYWRlcjogaGVhZGVyLFxuICAgICAgICAgICAgICAgIGlkOiAnZG93bmxvYWQnXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgQnVpbGRpbmcgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYCk7XG5cbiAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcblxuICAgIH0sXG5cbiAgICByZXF1ZXN0RG93bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgIGRhdGFbJ3NlcSddID0gc2VsZi4kbGluay5kYXRhKCdzZXEnKTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBzZWxmLnNyYy5yZXBsYWNlKC87L2csICcmJykgKyAnJmNhbGxiYWNrPUhULmRvd25sb2FkZXIuc3RhcnREb3dubG9hZE1vbml0b3InLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBTVEFSVFVQIE5PVCBERVRFQ1RFRFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZyApIHsgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTsgfVxuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcihyZXEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbERvd25sb2FkOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgc3RhcnREb3dubG9hZE1vbml0b3I6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBTFJFQURZIFBPTExJTkdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnBkZi5wcm9ncmVzc191cmwgPSBwcm9ncmVzc191cmw7XG4gICAgICAgIHNlbGYucGRmLmRvd25sb2FkX3VybCA9IGRvd25sb2FkX3VybDtcbiAgICAgICAgc2VsZi5wZGYudG90YWwgPSB0b3RhbDtcblxuICAgICAgICBzZWxmLmlzX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgPSAwO1xuICAgICAgICBzZWxmLmkgPSAwO1xuXG4gICAgICAgIHNlbGYudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgc2VsZi5jaGVja1N0YXR1cygpOyB9LCAyNTAwKTtcbiAgICAgICAgLy8gZG8gaXQgb25jZSB0aGUgZmlyc3QgdGltZVxuICAgICAgICBzZWxmLmNoZWNrU3RhdHVzKCk7XG5cbiAgICB9LFxuXG4gICAgY2hlY2tTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaSArPSAxO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogc2VsZi5wZGYucHJvZ3Jlc3NfdXJsLFxuICAgICAgICAgICAgZGF0YSA6IHsgdHMgOiAobmV3IERhdGUpLmdldFRpbWUoKSB9LFxuICAgICAgICAgICAgY2FjaGUgOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBzZWxmLnVwZGF0ZVByb2dyZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCArPSAxO1xuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzLmRvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciAmJiBzdGF0dXMubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlQcm9jZXNzRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBSUxFRDogXCIsIHJlcSwgXCIvXCIsIHRleHRTdGF0dXMsIFwiL1wiLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDA0ICYmIChzZWxmLmkgPiAyNSB8fCBzZWxmLm51bV9wcm9jZXNzZWQgPiAwKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHVwZGF0ZVByb2dyZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHsgZG9uZSA6IGZhbHNlLCBlcnJvciA6IGZhbHNlIH07XG4gICAgICAgIHZhciBwZXJjZW50O1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gZGF0YS5zdGF0dXM7XG4gICAgICAgIGlmICggY3VycmVudCA9PSAnRU9UJyB8fCBjdXJyZW50ID09ICdET05FJyApIHtcbiAgICAgICAgICAgIHN0YXR1cy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGF0YS5jdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwICogKCBjdXJyZW50IC8gc2VsZi5wZGYudG90YWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi5sYXN0X3BlcmNlbnQgIT0gcGVyY2VudCApIHtcbiAgICAgICAgICAgIHNlbGYubGFzdF9wZXJjZW50ID0gcGVyY2VudDtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgMTAwIHRpbWVzLCB3aGljaCBhbW91bnRzIHRvIH4xMDAgc2Vjb25kc1xuICAgICAgICBpZiAoIHNlbGYubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgc3RhdHVzLmVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5pcyhcIjp2aXNpYmxlXCIpICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5QbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKVxuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYEFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuYCk7XG5cbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBQcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuYCk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikudGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0gKCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkKS5gKTtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkYCk7XG4gICAgICAgIH1cblxuICAgICAgICByZXR1cm4gc3RhdHVzO1xuICAgIH0sXG5cbiAgICBjbGVhclRpbWVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYudGltZXIpO1xuICAgICAgICAgICAgc2VsZi50aW1lciA9IG51bGw7XG4gICAgICAgIH1cbiAgICB9LFxuXG4gICAgZGlzcGxheVdhcm5pbmc6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciB0aW1lb3V0ID0gcGFyc2VJbnQocmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVVudGlsRXBvY2gnKSk7XG4gICAgICAgIHZhciByYXRlID0gcmVxLmdldFJlc3BvbnNlSGVhZGVyKCdYLUNob2tlLVJhdGUnKVxuXG4gICAgICAgIGlmICggdGltZW91dCA8PSA1ICkge1xuICAgICAgICAgICAgLy8ganVzdCBwdW50IGFuZCB3YWl0IGl0IG91dFxuICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcbiAgICAgICAgICAgIH0sIDUwMDApO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgdGltZW91dCAqPSAxMDAwO1xuICAgICAgICB2YXIgbm93ID0gKG5ldyBEYXRlKS5nZXRUaW1lKCk7XG4gICAgICAgIHZhciBjb3VudGRvd24gPSAoIE1hdGguY2VpbCgodGltZW91dCAtIG5vdykgLyAxMDAwKSApXG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICgnPGRpdj4nICtcbiAgICAgICAgICAgICc8cD5Zb3UgaGF2ZSBleGNlZWRlZCB0aGUgZG93bmxvYWQgcmF0ZSBvZiB7cmF0ZX0uIFlvdSBtYXkgcHJvY2VlZCBpbiA8c3BhbiBpZD1cInRocm90dGxlLXRpbWVvdXRcIj57Y291bnRkb3dufTwvc3Bhbj4gc2Vjb25kcy48L3A+JyArXG4gICAgICAgICAgICAnPHA+RG93bmxvYWQgbGltaXRzIHByb3RlY3QgSGF0aGlUcnVzdCByZXNvdXJjZXMgZnJvbSBhYnVzZSBhbmQgaGVscCBlbnN1cmUgYSBjb25zaXN0ZW50IGV4cGVyaWVuY2UgZm9yIGV2ZXJ5b25lLjwvcD4nICtcbiAgICAgICAgICAnPC9kaXY+JykucmVwbGFjZSgne3JhdGV9JywgcmF0ZSkucmVwbGFjZSgne2NvdW50ZG93bn0nLCBjb3VudGRvd24pO1xuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4tcHJpbWFyeScsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdXG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5jb3VudGRvd25fdGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgY291bnRkb3duIC09IDE7XG4gICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiI3Rocm90dGxlLXRpbWVvdXRcIikudGV4dChjb3VudGRvd24pO1xuICAgICAgICAgICAgICBpZiAoIGNvdW50ZG93biA9PSAwICkge1xuICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi5jb3VudGRvd25fdGltZXIpO1xuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiVElDIFRPQ1wiLCBjb3VudGRvd24pO1xuICAgICAgICB9LCAxMDAwKTtcblxuICAgIH0sXG5cbiAgICBkaXNwbGF5UHJvY2Vzc0Vycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgKyBcbiAgICAgICAgICAgICAgICAnVW5mb3J0dW5hdGVseSwgdGhlIHByb2Nlc3MgZm9yIGNyZWF0aW5nIHlvdXIgUERGIGhhcyBiZWVuIGludGVycnVwdGVkLiAnICsgXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSBjbGljayBcIk9LXCIgYW5kIHRyeSBhZ2Fpbi4nICsgXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdJZiB0aGlzIHByb2JsZW0gcGVyc2lzdHMgYW5kIHlvdSBhcmUgdW5hYmxlIHRvIGRvd25sb2FkIHRoaXMgUERGIGFmdGVyIHJlcGVhdGVkIGF0dGVtcHRzLCAnICsgXG4gICAgICAgICAgICAgICAgJ3BsZWFzZSBub3RpZnkgdXMgYXQgPGEgaHJlZj1cIi9jZ2kvZmVlZGJhY2svP3BhZ2U9Zm9ybVwiIGRhdGE9bT1cInB0XCIgZGF0YS10b2dnbGU9XCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cIlNob3cgRmVlZGJhY2tcIj5mZWVkYmFja0Bpc3N1ZXMuaGF0aGl0cnVzdC5vcmc8L2E+ICcgK1xuICAgICAgICAgICAgICAgICdhbmQgaW5jbHVkZSB0aGUgVVJMIG9mIHRoZSBib29rIHlvdSB3ZXJlIHRyeWluZyB0byBhY2Nlc3Mgd2hlbiB0aGUgcHJvYmxlbSBvY2N1cnJlZC4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGRpc3BsYXlFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnVGhlcmUgd2FzIGEgcHJvYmxlbSBidWlsZGluZyB5b3VyICcgKyB0aGlzLml0ZW1fdGl0bGUgKyAnOyBzdGFmZiBoYXZlIGJlZW4gbm90aWZpZWQuJyArXG4gICAgICAgICAgICAnPC9wPicgK1xuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdQbGVhc2UgdHJ5IGFnYWluIGluIDI0IGhvdXJzLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgbG9nRXJyb3I6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQuZ2V0KHNlbGYuc3JjICsgJztudW1fYXR0ZW1wdHM9JyArIHNlbGYubnVtX2F0dGVtcHRzKTtcbiAgICB9LFxuXG5cbiAgICBFT1Q6IHRydWVcblxufVxuXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAgIEhULmRvd25sb2FkZXIgPSBPYmplY3QuY3JlYXRlKEhULkRvd25sb2FkZXIpLmluaXQoe1xuICAgICAgICBwYXJhbXMgOiBIVC5wYXJhbXNcbiAgICB9KVxuXG4gICAgSFQuZG93bmxvYWRlci5zdGFydCgpO1xuXG4gICAgLy8gYW5kIGRvIHRoaXMgaGVyZVxuICAgICQoXCIjc2VsZWN0ZWRQYWdlc1BkZkxpbmtcIikub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG5cbiAgICAgICAgdmFyIHByaW50YWJsZSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldFBhZ2VTZWxlY3Rpb24oKTtcblxuICAgICAgICBpZiAoIHByaW50YWJsZS5sZW5ndGggPT0gMCApIHtcbiAgICAgICAgICAgIHZhciBidXR0b25zID0gW107XG5cbiAgICAgICAgICAgIHZhciBtc2cgPSBbIFwiPHA+WW91IGhhdmVuJ3Qgc2VsZWN0ZWQgYW55IHBhZ2VzIHRvIHByaW50LjwvcD5cIiBdO1xuICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICcydXAnICkge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgbGVmdCBvciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LWZsaXAuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+VG8gc2VsZWN0IHBhZ2VzLCBjbGljayBpbiB0aGUgdXBwZXIgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJ3RodW1iJyApIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctdGh1bWIuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctc2Nyb2xsLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+PHR0PnNoaWZ0ICsgY2xpY2s8L3R0PiB0byBkZS9zZWxlY3QgdGhlIHBhZ2VzIGJldHdlZW4gdGhpcyBwYWdlIGFuZCBhIHByZXZpb3VzbHkgc2VsZWN0ZWQgcGFnZS5cIik7XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPlBhZ2VzIHlvdSBzZWxlY3Qgd2lsbCBhcHBlYXIgaW4gdGhlIHNlbGVjdGlvbiBjb250ZW50cyA8YnV0dG9uIHN0eWxlPVxcXCJiYWNrZ3JvdW5kLWNvbG9yOiAjNjY2OyBib3JkZXItY29sb3I6ICNlZWVcXFwiIGNsYXNzPVxcXCJidG4gc3F1YXJlXFxcIj48aSBjbGFzcz1cXFwiaWNvbW9vbiBpY29tb29uLXBhcGVyc1xcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0O1xuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2sgJyArXG4gICAgICAgICAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICAgICAgICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPjxpIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWhlbHBcIiBhcmlhLWhpZGRlbj1cInRydWVcIj48L2k+PHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5IZWxwOiBFbWJlZGRpbmcgSGF0aGlUcnVzdCBCb29rczwvc3Bhbj48L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LXNjcm9sbFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctZmxpcFwiPicgK1xuICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGluaXRlZCA9IGZhbHNlO1xuXG4gICAgdmFyICRmb3JtID0gJChcIiNzZWFyY2gtbW9kYWwgZm9ybVwiKTtcblxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXQuc2VhcmNoLWlucHV0LXRleHRcIik7XG4gICAgdmFyICRpbnB1dF9sYWJlbCA9ICRmb3JtLmZpbmQoXCJsYWJlbFtmb3I9J3ExLWlucHV0J11cIik7XG4gICAgdmFyICRzZWxlY3QgPSAkZm9ybS5maW5kKFwiLmNvbnRyb2wtc2VhcmNodHlwZVwiKTtcbiAgICB2YXIgJHNlYXJjaF90YXJnZXQgPSAkZm9ybS5maW5kKFwiLnNlYXJjaC10YXJnZXRcIik7XG4gICAgdmFyICRmdCA9ICRmb3JtLmZpbmQoXCJzcGFuLmZ1bmt5LWZ1bGwtdmlld1wiKTtcblxuICAgIHZhciAkYmFja2Ryb3AgPSBudWxsO1xuXG4gICAgdmFyICRhY3Rpb24gPSAkKFwiI2FjdGlvbi1zZWFyY2gtaGF0aGl0cnVzdFwiKTtcbiAgICAkYWN0aW9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBib290Ym94LnNob3coJ3NlYXJjaC1tb2RhbCcsIHtcbiAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgICAgICAkaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcblxuICAgIHZhciBfc2V0dXAgPSB7fTtcbiAgICBfc2V0dXAubHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5oaWRlKCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgb3Igd2l0aGluIHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGZ1bGwtdGV4dCBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGZ1bGwtdGV4dCBpbmRleC5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0dXAuY2F0YWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LnNob3coKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBjYXRhbG9nIGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgY2F0YWxvZyBpbmRleDsgeW91IGNhbiBsaW1pdCB5b3VyIHNlYXJjaCB0byBhIHNlbGVjdGlvbiBvZiBmaWVsZHMuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9ICRzZWFyY2hfdGFyZ2V0LmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLnZhbCgpO1xuICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgaW5pdGVkID0gdHJ1ZTtcblxuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIGlmICggcHJlZnMuc2VhcmNoICYmIHByZWZzLnNlYXJjaC5mdCApIHtcbiAgICAgICAgJChcImlucHV0W25hbWU9ZnRdXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cblxuICAgICRzZWFyY2hfdGFyZ2V0Lm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBsYWJlbCA6IFwiLVwiLCBjYXRlZ29yeSA6IFwiSFQgU2VhcmNoXCIsIGFjdGlvbiA6IHRhcmdldCB9KTtcbiAgICB9KVxuXG4gICAgLy8gJGZvcm0uZGVsZWdhdGUoJzppbnB1dCcsICdmb2N1cyBjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiRk9DVVNJTkdcIiwgdGhpcyk7XG4gICAgLy8gICAgICRmb3JtLmFkZENsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgPT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcCA9ICQoJzxkaXYgY2xhc3M9XCJtb2RhbF9fb3ZlcmxheSBpbnZpc2libGVcIj48L2Rpdj4nKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgJGJhY2tkcm9wLmFwcGVuZFRvKCQoXCJib2R5XCIpKS5zaG93KCk7XG4gICAgLy8gfSlcblxuICAgIC8vICQoXCJib2R5XCIpLm9uKCdmb2N1cycsICc6aW5wdXQsYScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAvLyAgICAgaWYgKCAhICR0aGlzLmNsb3Nlc3QoXCIubmF2LXNlYXJjaC1mb3JtXCIpLmxlbmd0aCApIHtcbiAgICAvLyAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIHZhciBjbG9zZV9zZWFyY2hfZm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkZm9ybS5yZW1vdmVDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wICE9IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuZGV0YWNoKCk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuaGlkZSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYWRkIGV2ZW50IGhhbmRsZXIgZm9yIHN1Ym1pdCB0byBjaGVjayBmb3IgZW1wdHkgcXVlcnkgb3IgYXN0ZXJpc2tcbiAgICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpXG4gICAgICAgICB7XG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIEhULmFuYWx5dGljcy5nZXRDb250ZW50R3JvdXBEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlYXRcbiAgICB2YXIgc3VmZml4ID0gJyc7XG4gICAgdmFyIGNvbnRlbnRfZ3JvdXAgPSA0O1xuICAgIGlmICggJChcIiNzZWN0aW9uXCIpLmRhdGEoXCJ2aWV3XCIpID09ICdyZXN0cmljdGVkJyApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAyO1xuICAgICAgc3VmZml4ID0gJyNyZXN0cmljdGVkJztcbiAgICB9IGVsc2UgaWYgKCB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKFwiZGVidWc9c3VwZXJcIikgPiAtMSApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAzO1xuICAgICAgc3VmZml4ID0gJyNzdXBlcic7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4IDogY29udGVudF9ncm91cCwgdmFsdWUgOiBIVC5wYXJhbXMuaWQgKyBzdWZmaXggfTtcblxuICB9XG5cbiAgSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmID0gZnVuY3Rpb24oaHJlZikge1xuICAgIHZhciB1cmwgPSAkLnVybChocmVmKTtcbiAgICB2YXIgbmV3X2hyZWYgPSB1cmwuc2VnbWVudCgpO1xuICAgIG5ld19ocmVmLnB1c2goJChcImh0bWxcIikuZGF0YSgnY29udGVudC1wcm92aWRlcicpKTtcbiAgICBuZXdfaHJlZi5wdXNoKHVybC5wYXJhbShcImlkXCIpKTtcbiAgICB2YXIgcXMgPSAnJztcbiAgICBpZiAoIG5ld19ocmVmLmluZGV4T2YoXCJzZWFyY2hcIikgPiAtMSAmJiB1cmwucGFyYW0oJ3ExJykgICkge1xuICAgICAgcXMgPSAnP3ExPScgKyB1cmwucGFyYW0oJ3ExJyk7XG4gICAgfVxuICAgIG5ld19ocmVmID0gXCIvXCIgKyBuZXdfaHJlZi5qb2luKFwiL1wiKSArIHFzO1xuICAgIHJldHVybiBuZXdfaHJlZjtcbiAgfVxuXG4gIEhULmFuYWx5dGljcy5nZXRQYWdlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYoKTtcbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgJGZvcm0gPSAkKHRoaXMpO1xuICAgIHZhciAkc3VibWl0ID0gJGZvcm0uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XVwiKVxuICAgIGlmICggISAkLnRyaW0oJGlucHV0LnZhbCgpKSApIHtcbiAgICAgIGJvb3Rib3guYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSB0ZXJtIGluIHRoZSBzZWFyY2ggYm94LlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJHN1Ym1pdC5hZGRDbGFzcyhcImJ0bi1sb2FkaW5nXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICRzdWJtaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiI3ZlcnNpb25JY29uXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
