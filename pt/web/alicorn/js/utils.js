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

        HT.update_status("Added item to collection " + params.coll_name);
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
        "<div class=\"initial\" aria-live=\"polite\"><p>Setting up the download...</div>" + '<div class="progress progress-striped active hide" aria-hidden="true">' + '<div class="bar" width="0%"></div>' + '</div>' +
        // '<div class="alert alert-block alert-success done hide">' +
        //     '<p>All done!</p>' +
        // '</div>' + 
        "<div><p><a href=\"https://www.hathitrust.org/help_digital_library#Download\" target=\"_blank\">What's the deal with downloads?</a></p></div>";

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
            self.$dialog.find(".initial").html("<p>Please wait while we build your " + self.item_title + "...</p>");
            self.$dialog.find(".progress").removeClass("hide");
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            self.$dialog.find(".initial").html("<p>All done! Your " + self.item_title + " is ready for download. <span clsas=\"offscreen\">Press return to download.</span></p>");
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
            self.$dialog.find(".initial").text("Please wait while we build your " + self.item_title + " (" + Math.ceil(percent) + "% completed)...");
            // HT.update_status(`${Math.ceil(percent)}% of the ${self.item_title} has been built.`);
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

    var codeblock_txt_a = function codeblock_txt_a(w, h) {
        return '<iframe width="' + w + '" height="' + h + '" ';
    };
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $('<div class="embedUrlContainer">' + '<h3>Embed This Book' + '<a id="embedHelpIcon" default-form="data-default-form" ' + 'href="' + embedHelpLink + '" target="_blank">Help</a></h3>' + '<form>' + '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' + '    <label for="codeblock" class="offscreen">Code Block</label>' + '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' + codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + '<div class="controls">' + '<label class="radio inline">' + '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' + '<span class="icomoon icomoon-scroll"/> Scroll View ' + '</label>' + '<label class="radio inline">' + '<input type="radio" name="view" id="view-flip" value="1" >' + '<span class="icomoon icomoon-book-alt2"/> Flip View ' + '</label>' + '</div>' + '</form>' + '</div>');

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
    var html = '<form>' + '    <fieldset>' + '        <legend>Email Address</legend>' + '        <label for="email" class="offscreen">EMail Address</label>' + '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' + '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Overall page readability and quality</legend>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-1" value="readable" />' + '            <label class="radio" for="pt-feedback-quality" >' + '                Few problems, entire page is readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" id="pt-feedback-quality-2" value="someproblems" />' + '            <label class="radio" for="pt-feedback-quality-2">' + '                Some problems, but still readable' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="difficult" id="pt-feedback-quality-3" />' + '            <label class="radio" for="pt-feedback-quality-3">' + '                Significant problems, difficult or impossible to read' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Quality" value="none" checked="checked" id="pt-feedback-quality-4" />' + '            <label class="radio" for="pt-feedback-quality-4">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Specific page image problems?</legend>' + '        <div class="alert alert-help">Select any that apply</div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-1" />' + '            <label class="checkbox" for="pt-feedback-problems-1">' + '                Missing parts of the page' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-2"  />' + '            <label class="checkbox" for="pt-feedback-problems-2">' + '                Blurry text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="checkbox" name="curved" value="1" id="pt-feedback-problems-3"  />' + '            <label class="checkbox" for="pt-feedback-problems-3">' + '                Curved or distorted text' + '            </label>' + '        </div>' + '        <div class="control">' + '            <label for="pt-feedback-problems-other">Other problem </label><input type="text" class="input-medium" name="other" value="" id="pt-feedback-problems-other"  />' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Problems with access rights?</legend>' + '        <span class="help-block" style="margin-bottom: 1rem;"><strong>' + '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' + '        </strong></span>' + '        <div class="alert alert-help">Select one option that applies</div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="noaccess" id="pt-feedback-access-1" />' + '            <label class="radio" for="pt-feedback-access-1">' + '                This item is in the public domain, but I don\'t have access to it.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="access" id="pt-feedback-access-2" />' + '            <label class="radio" for="pt-feedback-access-2">' + '                    I have access to this item, but should not.' + '            </label>' + '        </div>' + '        <div class="control">' + '            <input type="radio" name="Rights" value="none" checked="checked" id="pt-feedback-access-3" />' + '            <label class="radio" for="pt-feedback-access-3">' + '                (No problems)' + '            </label>' + '        </div>' + '    </fieldset>' + '    <fieldset>' + '        <legend>Other problems or comments?</legend>' + '        <p>' + '            <label class="offscreen" for="comments">Other problems or comments?</label>' + '            <textarea id="comments" name="comments" rows="3"></textarea>' + '        </p>' + '    </fieldset>' + '</form>';

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
'use strict';

head.ready(function () {

    var inited = false;

    var $form = $("#search-modal form");
    $form.attr('action', '/pt/search_complete.html');

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
'use strict';

head.ready(function () {

    var DISMISS_EVENT = window.hasOwnProperty && window.hasOwnProperty('ontouchstart') ? 'touchstart' : 'mousedown';

    var $menus = $("nav > ul > li:has(ul)");

    var toggle = function toggle($popup, $menu, $link) {
        if ($popup.data('state') == 'open') {
            $menu.removeClass("active");
            $popup.attr('aria-hidden', 'true');
            $link.focus();
            $popup.data('state', 'closed');
        } else {
            $menu.addClass("active");
            $popup.attr('aria-hidden', 'false');
            $popup.data('state', 'open');
        }
    };

    $menus.each(function (index) {
        var $menu = $(this);
        console.log("AHOY WUT", $menu);
        $menu.find("li").each(function (lidx) {
            var $item = $(this);
            $item.attr('aria-role', 'presentation');
            $item.find("a").attr('aria-role', 'menuitem');
        });

        var $link = $menu.find("> a");
        var $popup = $menu.find("ul");
        var $items = $popup.find("a");
        $link.on('click', function (e) {
            e.stopPropagation();
            e.preventDefault();
            toggle($popup, $menu, $link);
        });

        $menu.data('selected_idx', -1);
        $menu.on('keydown', function (event) {
            var code = event.code;
            var selected_idx = $menu.data('selected_idx');
            var delta = 0;
            if (code == 'ArrowDown') {
                delta = 1;
            } else if (code == 'ArrowUp') {
                delta = -1;
            } else if (code == 'Escape') {
                toggle($popup, $menu, $link);
            }
            if (delta == 0) {
                console.log("AHOY KEYCODE", code);return;
            }
            event.stopPropagation();
            selected_idx = (selected_idx + delta) % $items.length;
            console.log("AHOY MENU KEYDOWN", selected_idx);
            $selected = $items.slice(selected_idx, selected_idx + 1);
            $selected.focus();
            $menu.data('selected_idx', selected_idx);
        });
    });

    // $menu.data('selected_idx', -1);
    // $menu.on('focusin', function(event) {
    //     $menu.find("> a").get(0).dataset.expanded = true;
    // })
    // $menu.prev().find("> a").on('focusin', function() {
    //     $menu.find("> a").get(0).dataset.expanded = false;
    // })
    // $menu.find("ul > li > a:last").on('focusout', function(event) {
    //     $menu.find("> a").get(0).dataset.expanded = false;
    // })
    // $menu.on('keydown', function(event) {
    //     var code = event.code;
    //     var $items = $menu.find("ul > li > a");
    //     var selected_idx = $menu.data('selected_idx');
    //     var delta = 0;
    //     if ( code == 'ArrowDown' ) {
    //         delta = 1;
    //     } else if ( code == 'ArrowUp' ) {
    //         delta = -1;
    //     }
    //     if ( delta == 0 ) { return ; }
    //     selected_idx = ( selected_idx + delta ) % $items.length;
    //     console.log("AHOY MENU KEYDOWN", selected_idx);
    //     $selected = $items.slice(selected_idx, selected_idx + 1);
    //     $selected.focus();
    //     $menu.data('selected_idx', selected_idx);
    // })
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
'use strict';

/**
 * Social Links
 * Inspired by: http://sapegin.github.com/social-likes
 *
 * Sharing buttons for Russian and worldwide social networks.
 *
 * @requires jQuery
 * @author Artem Sapegin
 * @copyright 2014 Artem Sapegin (sapegin.me)
 * @license MIT
 */

/*global define:false, socialLinksButtons:false */

(function (factory) {
    // Try to register as an anonymous AMD module
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    } else {
        factory(jQuery);
    }
})(function ($, undefined) {

    'use strict';

    var prefix = 'social-links';
    var classPrefix = prefix + '__';
    var openClass = prefix + '_opened';
    var protocol = location.protocol === 'https:' ? 'https:' : 'http:';
    var isHttps = protocol === 'https:';

    /**
     * Buttons
     */
    var services = {
        facebook: {
            label: 'Facebook',
            // https://developers.facebook.com/docs/reference/fql/link_stat/
            counterUrl: 'https://graph.facebook.com/fql?q=SELECT+total_count+FROM+link_stat+WHERE+url%3D%22{url}%22&callback=?',
            convertNumber: function convertNumber(data) {
                return data.data[0].total_count;
            },
            popupUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}',
            popupWidth: 600,
            popupHeight: 500
        },
        twitter: {
            label: 'Twitter',
            counterUrl: 'https://cdn.api.twitter.com/1/urls/count.json?url={url}&callback=?',
            convertNumber: function convertNumber(data) {
                return data.count;
            },
            popupUrl: 'https://twitter.com/intent/tweet?url={url}&text={post_title}',
            popupWidth: 600,
            popupHeight: 450,
            click: function click() {
                // Add colon to improve readability
                if (!/[\.\?:\-–—]\s*$/.test(this.options.title)) this.options.title += ':';
                return true;
            }
        },
        mailru: {
            counterUrl: protocol + '//connect.mail.ru/share_count?url_list={url}&callback=1&func=?',
            convertNumber: function convertNumber(data) {
                for (var url in data) {
                    if (data.hasOwnProperty(url)) {
                        return data[url].shares;
                    }
                }
            },
            popupUrl: protocol + '//connect.mail.ru/share?share_url={url}&title={post_title}',
            popupWidth: 550,
            popupHeight: 360
        },
        vkontakte: {
            label: 'VK',
            counterUrl: 'https://vk.com/share.php?act=count&url={url}&index={index}',
            counter: function counter(jsonUrl, deferred) {
                var options = services.vkontakte;
                if (!options._) {
                    options._ = [];
                    if (!window.VK) window.VK = {};
                    window.VK.Share = {
                        count: function count(idx, number) {
                            options._[idx].resolve(number);
                        }
                    };
                }

                var index = options._.length;
                options._.push(deferred);
                $.getScript(makeUrl(jsonUrl, { index: index })).fail(deferred.reject);
            },
            popupUrl: protocol + '//vk.com/share.php?url={url}&title={post_title}',
            popupWidth: 550,
            popupHeight: 330
        },
        odnoklassniki: {
            // HTTPS not supported
            counterUrl: isHttps ? undefined : 'http://connect.ok.ru/dk?st.cmd=extLike&ref={url}&uid={index}',
            counter: function counter(jsonUrl, deferred) {
                var options = services.odnoklassniki;
                if (!options._) {
                    options._ = [];
                    if (!window.ODKL) window.ODKL = {};
                    window.ODKL.updateCount = function (idx, number) {
                        options._[idx].resolve(number);
                    };
                }

                var index = options._.length;
                options._.push(deferred);
                $.getScript(makeUrl(jsonUrl, { index: index })).fail(deferred.reject);
            },
            popupUrl: 'http://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={url}',
            popupWidth: 550,
            popupHeight: 360
        },
        plusone: {
            label: 'Google+',
            // HTTPS not supported yet: http://clubs.ya.ru/share/1499
            counterUrl: isHttps ? undefined : 'http://share.yandex.ru/gpp.xml?url={url}',
            counter: function counter(jsonUrl, deferred) {
                var options = services.plusone;
                if (options._) {
                    // Reject all counters except the first because Yandex Share counter doesn’t return URL
                    deferred.reject();
                    return;
                }

                if (!window.services) window.services = {};
                window.services.gplus = {
                    cb: function cb(number) {
                        if (typeof number === 'string') {
                            number = number.replace(/\D/g, '');
                        }
                        options._.resolve(parseInt(number, 10));
                    }
                };

                options._ = deferred;
                $.getScript(makeUrl(jsonUrl)).fail(deferred.reject);
            },
            popupUrl: 'https://plus.google.com/share?url={url}',
            popupWidth: 700,
            popupHeight: 500
        },
        pinterest: {
            label: 'Pinterest',
            counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
            convertNumber: function convertNumber(data) {
                return data.count;
            },
            popupUrl: protocol + '//pinterest.com/pin/create/button/?url={url}&description={post_title}',
            popupWidth: 630,
            popupHeight: 360
        },
        tumblr: {
            label: 'Tumblr',
            counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
            convertNumber: function convertNumber(data) {
                return data.count;
            },
            popupUrl1: protocol + '//www.tumblr.com/share/link?url={url}&description={post_title}',
            popupUrl2: protocol + '//www.tumblr.com/share/photo?source={media}&click_thru={url}&description={post_title}',
            click: function click() {
                if (this.widget.data('media')) {
                    this.options.popupUrl = this.options.popupUrl2;
                } else {
                    this.options.popupUrl = this.options.popupUrl1;
                }
                // will still need to change the URL structure
                return true;
            },
            popupWidth: 630,
            popupHeight: 360
        },
        reddit: {
            label: 'Reddit',
            counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
            convertNumber: function convertNumber(data) {
                return data.count;
            },
            popupUrl: protocol + '//reddit.com/submit?url={url}&description={post_title}',
            popupWidth: 630,
            popupHeight: 360
        },
        EOT: true
    };

    /**
     * jQuery plugin
     */
    $.fn.socialLinks = function (options) {
        return this.each(function () {
            var elem = $(this);
            var instance = elem.data(prefix);
            if (instance) {
                if ($.isPlainObject(options)) {
                    instance.update(options);
                }
            } else {
                instance = new socialLinks(elem, $.extend({}, $.fn.socialLinks.defaults, options, dataToOptions(elem)));
                elem.data(prefix, instance);
            }
        });
    };

    var post_title = document.title.split(' | ')[0].split(' - ');
    if ($.inArray(post_title[post_title.length - 1], ['Full View', 'Limited View', 'Item Not Available']) !== -1) {
        post_title.pop();
    }
    post_title = post_title.join(" - ") + " | HathiTrust";
    $.fn.socialLinks.defaults = {
        url: window.location.href.replace(window.location.hash, '').replace(/;/g, '&').replace('/shcgi/', '/cgi/'),
        post_title: post_title,
        counters: true,
        zeroes: false,
        wait: 500, // Show buttons only after counters are ready or after this amount of time
        timeout: 10000, // Show counters after this amount of time even if they aren’t ready
        popupCheckInterval: 500,
        singleTitle: 'Share'
    };

    function socialLinks(container, options) {
        this.container = container;
        this.options = options;
        this.init();
    }

    socialLinks.prototype = {
        init: function init() {
            // Add class in case of manual initialization
            this.container.addClass(prefix);

            this.initUserButtons();

            var buttons = this.container.children();

            this.buttons = [];
            buttons.each($.proxy(function (idx, elem) {
                var button = new Button($(elem), this.options);
                this.buttons.push(button);
            }, this));
        },
        initUserButtons: function initUserButtons() {
            if (!this.userButtonInited && window.socialLinksButtons) {
                $.extend(true, services, socialLinksButtons);
            }
            this.userButtonInited = true;
        },
        appear: function appear() {
            this.container.addClass(prefix + '_visible');
        },
        ready: function ready(silent) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.container.addClass(prefix + '_ready');
            if (!silent) {
                this.container.trigger('ready.' + prefix, this.number);
            }
        }
    };

    function Button(widget, options) {
        this.widget = widget;
        this.options = $.extend({}, options);
        this.detectService();
        if (this.service) {
            this.init();
        }
    }

    Button.prototype = {
        init: function init() {
            this.detectParams();
            this.initHtml();
            setTimeout($.proxy(this.initCounter, this), 0);
        },

        update: function update(options) {
            $.extend(this.options, { forceUpdate: false }, options);
            this.widget.find('.' + prefix + '__counter').remove(); // Remove old counter
            this.initCounter();
        },

        detectService: function detectService() {
            var service = this.widget.data('service');
            if (!service) {
                // class="facebook"
                var node = this.widget[0];
                var classes = node.classList || node.className.split(' ');
                for (var classIdx = 0; classIdx < classes.length; classIdx++) {
                    var cls = classes[classIdx];
                    if (services[cls]) {
                        service = cls;
                        break;
                    }
                }
                if (!service) return;
            }
            this.service = service;
            $.extend(this.options, services[service]);
        },

        detectParams: function detectParams() {
            var data = this.widget.data();

            // Custom page counter URL or number
            if (data.counter) {
                var number = parseInt(data.counter, 10);
                if (isNaN(number)) {
                    this.options.counterUrl = data.counter;
                } else {
                    this.options.counterNumber = number;
                }
            }

            // Custom page title
            if (data.title) {
                this.options.title = data.title;
                this.options.post_title = this.options.title;
                delete data.title;
            }

            // Custom page URL
            if (data.url) {
                this.options.url = data.url;
            }
        },

        initHtml: function initHtml() {
            var options = this.options;
            var widget = this.widget;

            var button = widget;

            if (options.clickUrl) {
                var url = makeUrl(options.clickUrl, {
                    url: options.url,
                    post_title: options.post_title
                });
                var link = $('<a>', {
                    href: url
                });
                this.cloneDataAttrs(widget, link);
                widget.replaceWith(link);
                this.widget = widget = link;
            } else {
                widget.on('click', $.proxy(this.click, this));
            }

            var _widget = widget.get(0);
            _widget.dataset.role = 'tooltip';
            _widget.dataset.microtipPosition = 'top';
            _widget.dataset.microtipSize = 'small';
            _widget.setAttribute('aria-label', widget.text());
            // widget.tooltip({ title : widget.text(), animation: false });

            this.button = button;
        },

        initCounter: function initCounter() {},

        cloneDataAttrs: function cloneDataAttrs(source, destination) {
            var data = source.data();
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    destination.data(key, data[key]);
                }
            }
        },

        getElementClassNames: function getElementClassNames(elem) {
            return _getElementClassNames(elem, this.service);
        },

        updateCounter: function updateCounter(number) {
            number = parseInt(number, 10) || 0;

            var params = {
                'class': this.getElementClassNames('counter'),
                'text': number
            };
            if (!number && !this.options.zeroes) {
                params['class'] += ' ' + prefix + '__counter_empty';
                params.text = '';
            }
            var counterElem = $('<span>', params);
            this.widget.append(counterElem);

            this.widget.trigger('counter.' + prefix, [this.service, number]);
        },

        click: function click(e) {
            var options = this.options;
            var process = true;
            if ($.isFunction(options.click)) {
                process = options.click.call(this, e);
            }
            if (process) {
                var context = {
                    url: options.url,
                    post_title: options.post_title
                };
                if (this.widget.data('media')) {
                    context.media = this.widget.data('media');
                }
                var url = makeUrl(options.popupUrl, context);
                url = this.addAdditionalParamsToUrl(url);
                this.openPopup(url, {
                    width: options.popupWidth,
                    height: options.popupHeight
                });
            }
            return false;
        },

        addAdditionalParamsToUrl: function addAdditionalParamsToUrl(url) {
            var data = dataToOptions(this.widget);
            var params = $.param($.extend(data, this.options.data));
            if ($.isEmptyObject(params)) return url;
            var glue = url.indexOf('?') === -1 ? '?' : '&';
            return url + glue + params;
        },

        openPopup: function openPopup(url, params) {
            var left = Math.round(screen.width / 2 - params.width / 2);
            var top = 0;
            if (screen.height > params.height) {
                top = Math.round(screen.height / 3 - params.height / 2);
            }

            var win = window.open(url, 'sl_' + this.service, 'left=' + left + ',top=' + top + ',' + 'width=' + params.width + ',height=' + params.height + ',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
            if (win) {
                win.focus();
                this.widget.trigger('popup_opened.' + prefix, [this.service, win]);
                var timer = setInterval($.proxy(function () {
                    if (!win.closed) return;
                    clearInterval(timer);
                    this.widget.trigger('popup_closed.' + prefix, this.service);
                }, this), this.options.popupCheckInterval);
            } else {
                location.href = url;
            }
        }
    };

    /**
     * Helpers
     */

    // Camelize data-attributes
    function dataToOptions(elem) {
        function upper(m, l) {
            return l.toUpper();
        }
        var options = {};
        var data = elem.data();
        for (var key in data) {
            if (key == 'tooltip') {
                continue;
            }
            var value = data[key];
            if (value === 'yes') value = true;else if (value === 'no') value = false;
            options[key.replace(/-(\w)/g, upper)] = value;
        }
        return options;
    }

    function makeUrl(url, context) {
        return template(url, context, encodeURIComponent);
    }

    function template(tmpl, context, filter) {
        return tmpl.replace(/\{([^\}]+)\}/g, function (m, key) {
            // If key doesn't exists in the context we should keep template tag as is
            return key in context ? filter ? filter(context[key]) : context[key] : m;
        });
    }

    function _getElementClassNames(elem, mod) {
        var cls = classPrefix + elem;
        return cls + ' ' + cls + '_' + mod;
    }

    function closeOnClick(elem, callback) {
        function handler(e) {
            if (e.type === 'keydown' && e.which !== 27 || $(e.target).closest(elem).length) return;
            elem.removeClass(openClass);
            doc.off(events, handler);
            if ($.isFunction(callback)) callback();
        }
        var doc = $(document);
        var events = 'click touchstart keydown';
        doc.on(events, handler);
    }

    function showInViewport(elem) {
        var offset = 10;
        if (document.documentElement.getBoundingClientRect) {
            var left = parseInt(elem.css('left'), 10);
            var top = parseInt(elem.css('top'), 10);

            var rect = elem[0].getBoundingClientRect();
            if (rect.left < offset) elem.css('left', offset - rect.left + left);else if (rect.right > window.innerWidth - offset) elem.css('left', window.innerWidth - rect.right - offset + left);

            if (rect.top < offset) elem.css('top', offset - rect.top + top);else if (rect.bottom > window.innerHeight - offset) elem.css('top', window.innerHeight - rect.bottom - offset + top);
        }
        elem.addClass(openClass);
    }

    /**
     * Auto initialization
     */
    $(function () {
        $('.' + prefix).socialLinks();
    });
});
"use strict";

head.ready(function () {

    $("#versionIcon").click(function (e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>");
    });
});
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImNsYXNzTGlzdC5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ2xvYmFsX3NlYXJjaC5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJtZW51cy5qcyIsInNlYXJjaF9pbl9pdGVtLmpzIiwic29jaWFsX2xpbmtzLmpzIiwidmVyc2lvbl9wb3B1cC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwialF1ZXJ5IiwiJCIsInVuZGVmaW5lZCIsInRhZzJhdHRyIiwiYSIsImltZyIsImZvcm0iLCJiYXNlIiwic2NyaXB0IiwiaWZyYW1lIiwibGluayIsImtleSIsImFsaWFzZXMiLCJwYXJzZXIiLCJzdHJpY3QiLCJsb29zZSIsInRvU3RyaW5nIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaXNpbnQiLCJwYXJzZVVyaSIsInVybCIsInN0cmljdE1vZGUiLCJzdHIiLCJkZWNvZGVVUkkiLCJyZXMiLCJleGVjIiwidXJpIiwiYXR0ciIsInBhcmFtIiwic2VnIiwiaSIsInBhcnNlU3RyaW5nIiwicGF0aCIsInJlcGxhY2UiLCJzcGxpdCIsImZyYWdtZW50IiwiaG9zdCIsInByb3RvY29sIiwicG9ydCIsImdldEF0dHJOYW1lIiwiZWxtIiwidG4iLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJwcm9tb3RlIiwicGFyZW50IiwibGVuZ3RoIiwidCIsInBhcnNlIiwicGFydHMiLCJ2YWwiLCJwYXJ0Iiwic2hpZnQiLCJpc0FycmF5IiwicHVzaCIsIm9iaiIsImtleXMiLCJpbmRleE9mIiwic3Vic3RyIiwidGVzdCIsIm1lcmdlIiwibGVuIiwibGFzdCIsImsiLCJzZXQiLCJyZWR1Y2UiLCJTdHJpbmciLCJyZXQiLCJwYWlyIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZSIsImVxbCIsImJyYWNlIiwibGFzdEJyYWNlSW5LZXkiLCJ2IiwiYyIsImFjY3VtdWxhdG9yIiwibCIsImN1cnIiLCJhcmd1bWVudHMiLCJjYWxsIiwidkFyZyIsInByb3AiLCJoYXNPd25Qcm9wZXJ0eSIsInB1cmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImRhdGEiLCJxdWVyeSIsImZwYXJhbSIsInNlZ21lbnQiLCJmc2VnbWVudCIsImZuIiwiSFQiLCJoZWFkIiwicmVhZHkiLCIkc3RhdHVzIiwibGFzdE1lc3NhZ2UiLCJsYXN0VGltZXIiLCJ1cGRhdGVfc3RhdHVzIiwibWVzc2FnZSIsImNsZWFyVGltZW91dCIsInNldFRpbWVvdXQiLCJ0ZXh0IiwiY29uc29sZSIsImxvZyIsImdldCIsImlubmVyVGV4dCIsInNlbGYiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJ2aWV3IiwiY2xhc3NMaXN0UHJvcCIsInByb3RvUHJvcCIsImVsZW1DdHJQcm90byIsIkVsZW1lbnQiLCJvYmpDdHIiLCJzdHJUcmltIiwidHJpbSIsImFyckluZGV4T2YiLCJBcnJheSIsIml0ZW0iLCJET01FeCIsInR5cGUiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInNob3ciLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJyZXR2YWwiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCJsYWJlbCIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiYm9vdGJveCIsImRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYXJhbXMiLCJwYWdlIiwiaWQiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiZXJyb3JUaHJvd24iLCIkdWwiLCJjb2xsX2hyZWYiLCJjb2xsX2lkIiwiJGEiLCJjb2xsX25hbWUiLCJhcHBlbmQiLCIkb3B0aW9uIiwiY29uZmlybV9sYXJnZSIsImNvbGxTaXplIiwiYWRkTnVtSXRlbXMiLCJudW1TdHIiLCJjb25maXJtIiwiYW5zd2VyIiwiY2xpY2siLCJwcmV2ZW50RGVmYXVsdCIsImFjdGlvbiIsInNlbGVjdGVkX2NvbGxlY3Rpb25faWQiLCJzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUiLCJjMiIsImlzIiwiY3Jtc19zdGF0ZSIsImhyZWYiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImh0bWwiLCJhbGVydCIsInNyYyIsIml0ZW1fdGl0bGUiLCJoZWFkZXIiLCJ0b3RhbCIsInN1ZmZpeCIsImNsb3NlTW9kYWwiLCJkYXRhVHlwZSIsImNhY2hlIiwiZXJyb3IiLCJyZXEiLCJzdGF0dXMiLCJkaXNwbGF5V2FybmluZyIsImRpc3BsYXlFcnJvciIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsImNzcyIsIndpZHRoIiwiJGRvd25sb2FkX2J0biIsIm9uIiwidHJpZ2dlciIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJFT1QiLCJkb3dubG9hZGVyIiwiY3JlYXRlIiwicHJpbnRhYmxlIiwiX2dldFBhZ2VTZWxlY3Rpb24iLCJidXR0b25zIiwic2VxIiwiX2dldEZsYXR0ZW5lZFNlbGVjdGlvbiIsInNpZGVfc2hvcnQiLCJzaWRlX2xvbmciLCJodElkIiwiZW1iZWRIZWxwTGluayIsImNvZGVibG9ja190eHRfYSIsInciLCJoIiwiY29kZWJsb2NrX3R4dF9iIiwiY2xvc2VzdCIsInRleHRhcmVhIiwic2VsZWN0IiwiY29kZWJsb2NrX3R4dCIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJpbml0ZWQiLCIkaW5wdXQiLCIkaW5wdXRfbGFiZWwiLCIkc2VsZWN0IiwiJHNlYXJjaF90YXJnZXQiLCIkZnQiLCIkYmFja2Ryb3AiLCIkYWN0aW9uIiwib25TaG93IiwibW9kYWwiLCJfc2V0dXAiLCJscyIsImNhdGFsb2ciLCJ0YXJnZXQiLCJwcmVmcyIsInNlYXJjaCIsImZ0IiwidmFsdWUiLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiY2F0ZWdvcnkiLCJzdWJtaXQiLCJldmVudCIsInNlYXJjaHR5cGUiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiRElTTUlTU19FVkVOVCIsIiRtZW51cyIsIiRwb3B1cCIsIiRtZW51IiwibGlkeCIsIiRpdGVtIiwiJGl0ZW1zIiwic2VsZWN0ZWRfaWR4IiwiZGVsdGEiLCIkc2VsZWN0ZWQiLCIkc3VibWl0IiwiaGFzQ2xhc3MiLCJyZW1vdmVBdHRyIiwicHJlZml4IiwiY2xhc3NQcmVmaXgiLCJvcGVuQ2xhc3MiLCJpc0h0dHBzIiwic2VydmljZXMiLCJmYWNlYm9vayIsImNvdW50ZXJVcmwiLCJjb252ZXJ0TnVtYmVyIiwidG90YWxfY291bnQiLCJwb3B1cFVybCIsInBvcHVwV2lkdGgiLCJwb3B1cEhlaWdodCIsInR3aXR0ZXIiLCJjb3VudCIsInRpdGxlIiwibWFpbHJ1Iiwic2hhcmVzIiwidmtvbnRha3RlIiwiY291bnRlciIsImpzb25VcmwiLCJkZWZlcnJlZCIsIl8iLCJWSyIsIlNoYXJlIiwiaWR4IiwicmVzb2x2ZSIsImdldFNjcmlwdCIsIm1ha2VVcmwiLCJyZWplY3QiLCJvZG5va2xhc3NuaWtpIiwiT0RLTCIsInVwZGF0ZUNvdW50IiwicGx1c29uZSIsImdwbHVzIiwiY2IiLCJwaW50ZXJlc3QiLCJ0dW1ibHIiLCJwb3B1cFVybDEiLCJwb3B1cFVybDIiLCJ3aWRnZXQiLCJyZWRkaXQiLCJzb2NpYWxMaW5rcyIsImluc3RhbmNlIiwiaXNQbGFpbk9iamVjdCIsInVwZGF0ZSIsImRlZmF1bHRzIiwiZGF0YVRvT3B0aW9ucyIsInBvc3RfdGl0bGUiLCJpbkFycmF5IiwicG9wIiwiaGFzaCIsImNvdW50ZXJzIiwiemVyb2VzIiwid2FpdCIsInBvcHVwQ2hlY2tJbnRlcnZhbCIsInNpbmdsZVRpdGxlIiwiY29udGFpbmVyIiwiaW5pdFVzZXJCdXR0b25zIiwiY2hpbGRyZW4iLCJwcm94eSIsImJ1dHRvbiIsIkJ1dHRvbiIsInVzZXJCdXR0b25Jbml0ZWQiLCJzb2NpYWxMaW5rc0J1dHRvbnMiLCJhcHBlYXIiLCJzaWxlbnQiLCJkZXRlY3RTZXJ2aWNlIiwic2VydmljZSIsImRldGVjdFBhcmFtcyIsImluaXRIdG1sIiwiaW5pdENvdW50ZXIiLCJmb3JjZVVwZGF0ZSIsIm5vZGUiLCJjbGFzc05hbWUiLCJjbGFzc0lkeCIsImNscyIsImlzTmFOIiwiY291bnRlck51bWJlciIsImNsaWNrVXJsIiwiY2xvbmVEYXRhQXR0cnMiLCJyZXBsYWNlV2l0aCIsIl93aWRnZXQiLCJkYXRhc2V0Iiwicm9sZSIsIm1pY3JvdGlwUG9zaXRpb24iLCJtaWNyb3RpcFNpemUiLCJzb3VyY2UiLCJkZXN0aW5hdGlvbiIsImdldEVsZW1lbnRDbGFzc05hbWVzIiwidXBkYXRlQ291bnRlciIsImNvdW50ZXJFbGVtIiwicHJvY2VzcyIsImlzRnVuY3Rpb24iLCJjb250ZXh0IiwibWVkaWEiLCJhZGRBZGRpdGlvbmFsUGFyYW1zVG9VcmwiLCJvcGVuUG9wdXAiLCJoZWlnaHQiLCJpc0VtcHR5T2JqZWN0IiwiZ2x1ZSIsImxlZnQiLCJyb3VuZCIsInNjcmVlbiIsInRvcCIsIndpbiIsIm9wZW4iLCJjbG9zZWQiLCJ1cHBlciIsIm0iLCJ0b1VwcGVyIiwidGVtcGxhdGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ0bXBsIiwiZmlsdGVyIiwibW9kIiwiY2xvc2VPbkNsaWNrIiwiaGFuZGxlciIsIndoaWNoIiwiZG9jIiwib2ZmIiwiZXZlbnRzIiwic2hvd0luVmlld3BvcnQiLCJvZmZzZXQiLCJkb2N1bWVudEVsZW1lbnQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyZWN0IiwicmlnaHQiLCJpbm5lcldpZHRoIiwiYm90dG9tIiwiaW5uZXJIZWlnaHQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7OztBQU9BLENBQUMsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ25CLEtBQUksT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJQUFnQ0EsT0FBT0MsR0FBM0MsRUFBZ0Q7QUFDL0M7QUFDQSxNQUFLLE9BQU9DLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENGLFVBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUJELE9BQW5CO0FBQ0EsR0FGRCxNQUVPO0FBQ05DLFVBQU8sRUFBUCxFQUFXRCxPQUFYO0FBQ0E7QUFDRCxFQVBELE1BT087QUFDTjtBQUNBLE1BQUssT0FBT0csTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0gsV0FBUUcsTUFBUjtBQUNBLEdBRkQsTUFFTztBQUNOSDtBQUNBO0FBQ0Q7QUFDRCxDQWhCQSxFQWdCRSxVQUFTSSxDQUFULEVBQVlDLFNBQVosRUFBdUI7O0FBRXpCLEtBQUlDLFdBQVc7QUFDYkMsS0FBVSxNQURHO0FB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QW5DLEdBQTRDbkIsR0FBNUQ7QUFDUDtBQUNEeFcsYUFBSzZILFFBQUwsQ0FBY3NJLFNBQWQ7QUFDSDs7QUFHRDs7O0FBR0F2WSxNQUFFLFlBQVc7QUFDVEEsVUFBRSxNQUFNcVksTUFBUixFQUFnQnlDLFdBQWhCO0FBQ0gsS0FGRDtBQUlILENBN2dCQSxDQUFEOzs7QUNkQWhWLEtBQUtDLEtBQUwsQ0FBVyxZQUFXOztBQUVsQi9GLE1BQUUsY0FBRixFQUFrQmdQLEtBQWxCLENBQXdCLFVBQVMxSyxDQUFULEVBQVk7QUFDaENBLFVBQUUySyxjQUFGO0FBQ0FuQyxnQkFBUXlELEtBQVIsQ0FBYyxvWUFBZDtBQUNILEtBSEQ7QUFLSCxDQVBEIiwiZmlsZSI6InV0aWxzLmpzIiwic291cmNlc0NvbnRlbnQiOlsiLypcbiAqIEpRdWVyeSBVUkwgUGFyc2VyIHBsdWdpbiwgdjIuMi4xXG4gKiBEZXZlbG9wZWQgYW5kIG1haW50YW5pbmVkIGJ5IE1hcmsgUGVya2lucywgbWFya0BhbGxtYXJrZWR1cC5jb21cbiAqIFNvdXJjZSByZXBvc2l0b3J5OiBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXJcbiAqIExpY2Vuc2VkIHVuZGVyIGFuIE1JVC1zdHlsZSBsaWNlbnNlLiBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyL2Jsb2IvbWFzdGVyL0xJQ0VOU0UgZm9yIGRldGFpbHMuXG4gKi8gXG5cbjsoZnVuY3Rpb24oZmFjdG9yeSkge1xuXHRpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG5cdFx0Ly8gQU1EIGF2YWlsYWJsZTsgdXNlIGFub255bW91cyBtb2R1bGVcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1x0XG5cdFx0fSBlbHNlIHtcblx0XHRcdGRlZmluZShbXSwgZmFjdG9yeSk7XG5cdFx0fVxuXHR9IGVsc2Uge1xuXHRcdC8vIE5vIEFNRCBhdmFpbGFibGU7IG11dGF0ZSBnbG9iYWwgdmFyc1xuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRmYWN0b3J5KGpRdWVyeSk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGZhY3RvcnkoKTtcblx0XHR9XG5cdH1cbn0pKGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXHRcblx0dmFyIHRhZzJhdHRyID0ge1xuXHRcdFx0YSAgICAgICA6ICdocmVmJyxcblx0XHRcdGltZyAgICAgOiAnc3JjJyxcblx0XHRcdGZvcm0gICAgOiAnYWN0aW9uJyxcblx0XHRcdGJhc2UgICAgOiAnaHJlZicsXG5cdFx0XHRzY3JpcHQgIDogJ3NyYycsXG5cdFx0XHRpZnJhbWUgIDogJ3NyYycsXG5cdFx0XHRsaW5rICAgIDogJ2hyZWYnXG5cdFx0fSxcblx0XHRcblx0XHRrZXkgPSBbJ3NvdXJjZScsICdwcm90b2NvbCcsICdhdXRob3JpdHknLCAndXNlckluZm8nLCAndXNlcicsICdwYXNzd29yZCcsICdob3N0JywgJ3BvcnQnLCAncmVsYXRpdmUnLCAncGF0aCcsICdkaXJlY3RvcnknLCAnZmlsZScsICdxdWVyeScsICdmcmFnbWVudCddLCAvLyBrZXlzIGF2YWlsYWJsZSB0byBxdWVyeVxuXHRcdFxuXHRcdGFsaWFzZXMgPSB7ICdhbmNob3InIDogJ2ZyYWdtZW50JyB9LCAvLyBhbGlhc2VzIGZvciBiYWNrd2FyZHMgY29tcGF0YWJpbGl0eVxuXHRcdFxuXHRcdHBhcnNlciA9IHtcblx0XHRcdHN0cmljdCA6IC9eKD86KFteOlxcLz8jXSspOik/KD86XFwvXFwvKCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykpPygoKCg/OltePyNcXC9dKlxcLykqKShbXj8jXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLywgIC8vbGVzcyBpbnR1aXRpdmUsIG1vcmUgYWNjdXJhdGUgdG8gdGhlIHNwZWNzXG5cdFx0XHRsb29zZSA6ICAvXig/Oig/IVteOkBdKzpbXjpAXFwvXSpAKShbXjpcXC8/Iy5dKyk6KT8oPzpcXC9cXC8pPygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKCgoXFwvKD86W14/I10oPyFbXj8jXFwvXSpcXC5bXj8jXFwvLl0rKD86Wz8jXXwkKSkpKlxcLz8pPyhbXj8jXFwvXSopKSg/OlxcPyhbXiNdKikpPyg/OiMoLiopKT8pLyAvLyBtb3JlIGludHVpdGl2ZSwgZmFpbHMgb24gcmVsYXRpdmUgcGF0aHMgYW5kIGRldmlhdGVzIGZyb20gc3BlY3Ncblx0XHR9LFxuXHRcdFxuXHRcdHRvU3RyaW5nID0gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZyxcblx0XHRcblx0XHRpc2ludCA9IC9eWzAtOV0rJC87XG5cdFxuXHRmdW5jdGlvbiBwYXJzZVVyaSggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdHZhciBzdHIgPSBkZWNvZGVVUkkoIHVybCApLFxuXHRcdHJlcyAgID0gcGFyc2VyWyBzdHJpY3RNb2RlIHx8IGZhbHNlID8gJ3N0cmljdCcgOiAnbG9vc2UnIF0uZXhlYyggc3RyICksXG5cdFx0dXJpID0geyBhdHRyIDoge30sIHBhcmFtIDoge30sIHNlZyA6IHt9IH0sXG5cdFx0aSAgID0gMTQ7XG5cdFx0XG5cdFx0d2hpbGUgKCBpLS0gKSB7XG5cdFx0XHR1cmkuYXR0clsga2V5W2ldIF0gPSByZXNbaV0gfHwgJyc7XG5cdFx0fVxuXHRcdFxuXHRcdC8vIGJ1aWxkIHF1ZXJ5IGFuZCBmcmFnbWVudCBwYXJhbWV0ZXJzXHRcdFxuXHRcdHVyaS5wYXJhbVsncXVlcnknXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydxdWVyeSddKTtcblx0XHR1cmkucGFyYW1bJ2ZyYWdtZW50J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsnZnJhZ21lbnQnXSk7XG5cdFx0XG5cdFx0Ly8gc3BsaXQgcGF0aCBhbmQgZnJhZ2VtZW50IGludG8gc2VnbWVudHNcdFx0XG5cdFx0dXJpLnNlZ1sncGF0aCddID0gdXJpLmF0dHIucGF0aC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpOyAgICAgXG5cdFx0dXJpLnNlZ1snZnJhZ21lbnQnXSA9IHVyaS5hdHRyLmZyYWdtZW50LnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7XG5cdFx0XG5cdFx0Ly8gY29tcGlsZSBhICdiYXNlJyBkb21haW4gYXR0cmlidXRlICAgICAgICBcblx0XHR1cmkuYXR0clsnYmFzZSddID0gdXJpLmF0dHIuaG9zdCA/ICh1cmkuYXR0ci5wcm90b2NvbCA/ICB1cmkuYXR0ci5wcm90b2NvbCsnOi8vJyt1cmkuYXR0ci5ob3N0IDogdXJpLmF0dHIuaG9zdCkgKyAodXJpLmF0dHIucG9ydCA/ICc6Jyt1cmkuYXR0ci5wb3J0IDogJycpIDogJyc7ICAgICAgXG5cdFx0ICBcblx0XHRyZXR1cm4gdXJpO1xuXHR9O1xuXHRcblx0ZnVuY3Rpb24gZ2V0QXR0ck5hbWUoIGVsbSApIHtcblx0XHR2YXIgdG4gPSBlbG0udGFnTmFtZTtcblx0XHRpZiAoIHR5cGVvZiB0biAhPT0gJ3VuZGVmaW5lZCcgKSByZXR1cm4gdGFnMmF0dHJbdG4udG9Mb3dlckNhc2UoKV07XG5cdFx0cmV0dXJuIHRuO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBwcm9tb3RlKHBhcmVudCwga2V5KSB7XG5cdFx0aWYgKHBhcmVudFtrZXldLmxlbmd0aCA9PSAwKSByZXR1cm4gcGFyZW50W2tleV0gPSB7fTtcblx0XHR2YXIgdCA9IHt9O1xuXHRcdGZvciAodmFyIGkgaW4gcGFyZW50W2tleV0pIHRbaV0gPSBwYXJlbnRba2V5XVtpXTtcblx0XHRwYXJlbnRba2V5XSA9IHQ7XG5cdFx0cmV0dXJuIHQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZShwYXJ0cywgcGFyZW50LCBrZXksIHZhbCkge1xuXHRcdHZhciBwYXJ0ID0gcGFydHMuc2hpZnQoKTtcblx0XHRpZiAoIXBhcnQpIHtcblx0XHRcdGlmIChpc0FycmF5KHBhcmVudFtrZXldKSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XS5wdXNoKHZhbCk7XG5cdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSBpZiAoJ3VuZGVmaW5lZCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHR9XG5cdFx0fSBlbHNlIHtcblx0XHRcdHZhciBvYmogPSBwYXJlbnRba2V5XSA9IHBhcmVudFtrZXldIHx8IFtdO1xuXHRcdFx0aWYgKCddJyA9PSBwYXJ0KSB7XG5cdFx0XHRcdGlmIChpc0FycmF5KG9iaikpIHtcblx0XHRcdFx0XHRpZiAoJycgIT0gdmFsKSBvYmoucHVzaCh2YWwpO1xuXHRcdFx0XHR9IGVsc2UgaWYgKCdvYmplY3QnID09IHR5cGVvZiBvYmopIHtcblx0XHRcdFx0XHRvYmpba2V5cyhvYmopLmxlbmd0aF0gPSB2YWw7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0b2JqID0gcGFyZW50W2tleV0gPSBbcGFyZW50W2tleV0sIHZhbF07XG5cdFx0XHRcdH1cblx0XHRcdH0gZWxzZSBpZiAofnBhcnQuaW5kZXhPZignXScpKSB7XG5cdFx0XHRcdHBhcnQgPSBwYXJ0LnN1YnN0cigwLCBwYXJ0Lmxlbmd0aCAtIDEpO1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdFx0Ly8ga2V5XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRpZiAoIWlzaW50LnRlc3QocGFydCkgJiYgaXNBcnJheShvYmopKSBvYmogPSBwcm9tb3RlKHBhcmVudCwga2V5KTtcblx0XHRcdFx0cGFyc2UocGFydHMsIG9iaiwgcGFydCwgdmFsKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHRmdW5jdGlvbiBtZXJnZShwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0aWYgKH5rZXkuaW5kZXhPZignXScpKSB7XG5cdFx0XHR2YXIgcGFydHMgPSBrZXkuc3BsaXQoJ1snKSxcblx0XHRcdGxlbiA9IHBhcnRzLmxlbmd0aCxcblx0XHRcdGxhc3QgPSBsZW4gLSAxO1xuXHRcdFx0cGFyc2UocGFydHMsIHBhcmVudCwgJ2Jhc2UnLCB2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRpZiAoIWlzaW50LnRlc3Qoa2V5KSAmJiBpc0FycmF5KHBhcmVudC5iYXNlKSkge1xuXHRcdFx0XHR2YXIgdCA9IHt9O1xuXHRcdFx0XHRmb3IgKHZhciBrIGluIHBhcmVudC5iYXNlKSB0W2tdID0gcGFyZW50LmJhc2Vba107XG5cdFx0XHRcdHBhcmVudC5iYXNlID0gdDtcblx0XHRcdH1cblx0XHRcdHNldChwYXJlbnQuYmFzZSwga2V5LCB2YWwpO1xuXHRcdH1cblx0XHRyZXR1cm4gcGFyZW50O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2VTdHJpbmcoc3RyKSB7XG5cdFx0cmV0dXJuIHJlZHVjZShTdHJpbmcoc3RyKS5zcGxpdCgvJnw7LyksIGZ1bmN0aW9uKHJldCwgcGFpcikge1xuXHRcdFx0dHJ5IHtcblx0XHRcdFx0cGFpciA9IGRlY29kZVVSSUNvbXBvbmVudChwYWlyLnJlcGxhY2UoL1xcKy9nLCAnICcpKTtcblx0XHRcdH0gY2F0Y2goZSkge1xuXHRcdFx0XHQvLyBpZ25vcmVcblx0XHRcdH1cblx0XHRcdHZhciBlcWwgPSBwYWlyLmluZGV4T2YoJz0nKSxcblx0XHRcdFx0YnJhY2UgPSBsYXN0QnJhY2VJbktleShwYWlyKSxcblx0XHRcdFx0a2V5ID0gcGFpci5zdWJzdHIoMCwgYnJhY2UgfHwgZXFsKSxcblx0XHRcdFx0dmFsID0gcGFpci5zdWJzdHIoYnJhY2UgfHwgZXFsLCBwYWlyLmxlbmd0aCksXG5cdFx0XHRcdHZhbCA9IHZhbC5zdWJzdHIodmFsLmluZGV4T2YoJz0nKSArIDEsIHZhbC5sZW5ndGgpO1xuXG5cdFx0XHRpZiAoJycgPT0ga2V5KSBrZXkgPSBwYWlyLCB2YWwgPSAnJztcblxuXHRcdFx0cmV0dXJuIG1lcmdlKHJldCwga2V5LCB2YWwpO1xuXHRcdH0sIHsgYmFzZToge30gfSkuYmFzZTtcblx0fVxuXHRcblx0ZnVuY3Rpb24gc2V0KG9iaiwga2V5LCB2YWwpIHtcblx0XHR2YXIgdiA9IG9ialtrZXldO1xuXHRcdGlmICh1bmRlZmluZWQgPT09IHYpIHtcblx0XHRcdG9ialtrZXldID0gdmFsO1xuXHRcdH0gZWxzZSBpZiAoaXNBcnJheSh2KSkge1xuXHRcdFx0di5wdXNoKHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdG9ialtrZXldID0gW3YsIHZhbF07XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiBsYXN0QnJhY2VJbktleShzdHIpIHtcblx0XHR2YXIgbGVuID0gc3RyLmxlbmd0aCxcblx0XHRcdCBicmFjZSwgYztcblx0XHRmb3IgKHZhciBpID0gMDsgaSA8IGxlbjsgKytpKSB7XG5cdFx0XHRjID0gc3RyW2ldO1xuXHRcdFx0aWYgKCddJyA9PSBjKSBicmFjZSA9IGZhbHNlO1xuXHRcdFx0aWYgKCdbJyA9PSBjKSBicmFjZSA9IHRydWU7XG5cdFx0XHRpZiAoJz0nID09IGMgJiYgIWJyYWNlKSByZXR1cm4gaTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHJlZHVjZShvYmosIGFjY3VtdWxhdG9yKXtcblx0XHR2YXIgaSA9IDAsXG5cdFx0XHRsID0gb2JqLmxlbmd0aCA+PiAwLFxuXHRcdFx0Y3VyciA9IGFyZ3VtZW50c1syXTtcblx0XHR3aGlsZSAoaSA8IGwpIHtcblx0XHRcdGlmIChpIGluIG9iaikgY3VyciA9IGFjY3VtdWxhdG9yLmNhbGwodW5kZWZpbmVkLCBjdXJyLCBvYmpbaV0sIGksIG9iaik7XG5cdFx0XHQrK2k7XG5cdFx0fVxuXHRcdHJldHVybiBjdXJyO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBpc0FycmF5KHZBcmcpIHtcblx0XHRyZXR1cm4gT2JqZWN0LnByb3RvdHlwZS50b1N0cmluZy5jYWxsKHZBcmcpID09PSBcIltvYmplY3QgQXJyYXldXCI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGtleXMob2JqKSB7XG5cdFx0dmFyIGtleXMgPSBbXTtcblx0XHRmb3IgKCBwcm9wIGluIG9iaiApIHtcblx0XHRcdGlmICggb2JqLmhhc093blByb3BlcnR5KHByb3ApICkga2V5cy5wdXNoKHByb3ApO1xuXHRcdH1cblx0XHRyZXR1cm4ga2V5cztcblx0fVxuXHRcdFxuXHRmdW5jdGlvbiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0aWYgKCBhcmd1bWVudHMubGVuZ3RoID09PSAxICYmIHVybCA9PT0gdHJ1ZSApIHtcblx0XHRcdHN0cmljdE1vZGUgPSB0cnVlO1xuXHRcdFx0dXJsID0gdW5kZWZpbmVkO1xuXHRcdH1cblx0XHRzdHJpY3RNb2RlID0gc3RyaWN0TW9kZSB8fCBmYWxzZTtcblx0XHR1cmwgPSB1cmwgfHwgd2luZG93LmxvY2F0aW9uLnRvU3RyaW5nKCk7XG5cdFxuXHRcdHJldHVybiB7XG5cdFx0XHRcblx0XHRcdGRhdGEgOiBwYXJzZVVyaSh1cmwsIHN0cmljdE1vZGUpLFxuXHRcdFx0XG5cdFx0XHQvLyBnZXQgdmFyaW91cyBhdHRyaWJ1dGVzIGZyb20gdGhlIFVSSVxuXHRcdFx0YXR0ciA6IGZ1bmN0aW9uKCBhdHRyICkge1xuXHRcdFx0XHRhdHRyID0gYWxpYXNlc1thdHRyXSB8fCBhdHRyO1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIGF0dHIgIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLmF0dHJbYXR0cl0gOiB0aGlzLmRhdGEuYXR0cjtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBxdWVyeSBzdHJpbmcgcGFyYW1ldGVyc1xuXHRcdFx0cGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5xdWVyeTtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBwYXJhbWV0ZXJzXG5cdFx0XHRmcGFyYW0gOiBmdW5jdGlvbiggcGFyYW0gKSB7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgcGFyYW0gIT09ICd1bmRlZmluZWQnID8gdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50W3BhcmFtXSA6IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudDtcblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBwYXRoIHNlZ21lbnRzXG5cdFx0XHRzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLnBhdGgubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH0sXG5cdFx0XHRcblx0XHRcdC8vIHJldHVybiBmcmFnbWVudCBzZWdtZW50c1xuXHRcdFx0ZnNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50OyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQubGVuZ3RoICsgc2VnIDogc2VnIC0gMTsgLy8gbmVnYXRpdmUgc2VnbWVudHMgY291bnQgZnJvbSB0aGUgZW5kXG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnRbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9XG5cdCAgICBcdFxuXHRcdH07XG5cdFxuXHR9O1xuXHRcblx0aWYgKCB0eXBlb2YgJCAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XG5cdFx0JC5mbi51cmwgPSBmdW5jdGlvbiggc3RyaWN0TW9kZSApIHtcblx0XHRcdHZhciB1cmwgPSAnJztcblx0XHRcdGlmICggdGhpcy5sZW5ndGggKSB7XG5cdFx0XHRcdHVybCA9ICQodGhpcykuYXR0ciggZ2V0QXR0ck5hbWUodGhpc1swXSkgKSB8fCAnJztcblx0XHRcdH0gICAgXG5cdFx0XHRyZXR1cm4gcHVybCggdXJsLCBzdHJpY3RNb2RlICk7XG5cdFx0fTtcblx0XHRcblx0XHQkLnVybCA9IHB1cmw7XG5cdFx0XG5cdH0gZWxzZSB7XG5cdFx0d2luZG93LnB1cmwgPSBwdXJsO1xuXHR9XG5cbn0pO1xuXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAgICAgICB9LCA1MDApO1xuXG4gICAgICB9XG4gIH1cblxufSkiLCIvKlxuICogY2xhc3NMaXN0LmpzOiBDcm9zcy1icm93c2VyIGZ1bGwgZWxlbWVudC5jbGFzc0xpc3QgaW1wbGVtZW50YXRpb24uXG4gKiAxLjIuMjAxNzEyMTBcbiAqXG4gKiBCeSBFbGkgR3JleSwgaHR0cDovL2VsaWdyZXkuY29tXG4gKiBMaWNlbnNlOiBEZWRpY2F0ZWQgdG8gdGhlIHB1YmxpYyBkb21haW4uXG4gKiAgIFNlZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvTElDRU5TRS5tZFxuICovXG5cbi8qZ2xvYmFsIHNlbGYsIGRvY3VtZW50LCBET01FeGNlcHRpb24gKi9cblxuLyohIEBzb3VyY2UgaHR0cDovL3B1cmwuZWxpZ3JleS5jb20vZ2l0aHViL2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9jbGFzc0xpc3QuanMgKi9cblxuaWYgKFwiZG9jdW1lbnRcIiBpbiBzZWxmKSB7XG5cbi8vIEZ1bGwgcG9seWZpbGwgZm9yIGJyb3dzZXJzIHdpdGggbm8gY2xhc3NMaXN0IHN1cHBvcnRcbi8vIEluY2x1ZGluZyBJRSA8IEVkZ2UgbWlzc2luZyBTVkdFbGVtZW50LmNsYXNzTGlzdFxuaWYgKFxuXHQgICAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikpIFxuXHR8fCBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlNcblx0JiYgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROUyhcImh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnXCIsXCJnXCIpKVxuKSB7XG5cbihmdW5jdGlvbiAodmlldykge1xuXG5cInVzZSBzdHJpY3RcIjtcblxuaWYgKCEoJ0VsZW1lbnQnIGluIHZpZXcpKSByZXR1cm47XG5cbnZhclxuXHQgIGNsYXNzTGlzdFByb3AgPSBcImNsYXNzTGlzdFwiXG5cdCwgcHJvdG9Qcm9wID0gXCJwcm90b3R5cGVcIlxuXHQsIGVsZW1DdHJQcm90byA9IHZpZXcuRWxlbWVudFtwcm90b1Byb3BdXG5cdCwgb2JqQ3RyID0gT2JqZWN0XG5cdCwgc3RyVHJpbSA9IFN0cmluZ1twcm90b1Byb3BdLnRyaW0gfHwgZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiB0aGlzLnJlcGxhY2UoL15cXHMrfFxccyskL2csIFwiXCIpO1xuXHR9XG5cdCwgYXJySW5kZXhPZiA9IEFycmF5W3Byb3RvUHJvcF0uaW5kZXhPZiB8fCBmdW5jdGlvbiAoaXRlbSkge1xuXHRcdHZhclxuXHRcdFx0ICBpID0gMFxuXHRcdFx0LCBsZW4gPSB0aGlzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRpZiAoaSBpbiB0aGlzICYmIHRoaXNbaV0gPT09IGl0ZW0pIHtcblx0XHRcdFx0cmV0dXJuIGk7XG5cdFx0XHR9XG5cdFx0fVxuXHRcdHJldHVybiAtMTtcblx0fVxuXHQvLyBWZW5kb3JzOiBwbGVhc2UgYWxsb3cgY29udGVudCBjb2RlIHRvIGluc3RhbnRpYXRlIERPTUV4Y2VwdGlvbnNcblx0LCBET01FeCA9IGZ1bmN0aW9uICh0eXBlLCBtZXNzYWdlKSB7XG5cdFx0dGhpcy5uYW1lID0gdHlwZTtcblx0XHR0aGlzLmNvZGUgPSBET01FeGNlcHRpb25bdHlwZV07XG5cdFx0dGhpcy5tZXNzYWdlID0gbWVzc2FnZTtcblx0fVxuXHQsIGNoZWNrVG9rZW5BbmRHZXRJbmRleCA9IGZ1bmN0aW9uIChjbGFzc0xpc3QsIHRva2VuKSB7XG5cdFx0aWYgKHRva2VuID09PSBcIlwiKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJTWU5UQVhfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBiZSBlbXB0eS5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0aWYgKC9cXHMvLnRlc3QodG9rZW4pKSB7XG5cdFx0XHR0aHJvdyBuZXcgRE9NRXgoXG5cdFx0XHRcdCAgXCJJTlZBTElEX0NIQVJBQ1RFUl9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGNvbnRhaW4gc3BhY2UgY2hhcmFjdGVycy5cIlxuXHRcdFx0KTtcblx0XHR9XG5cdFx0cmV0dXJuIGFyckluZGV4T2YuY2FsbChjbGFzc0xpc3QsIHRva2VuKTtcblx0fVxuXHQsIENsYXNzTGlzdCA9IGZ1bmN0aW9uIChlbGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIHRyaW1tZWRDbGFzc2VzID0gc3RyVHJpbS5jYWxsKGVsZW0uZ2V0QXR0cmlidXRlKFwiY2xhc3NcIikgfHwgXCJcIilcblx0XHRcdCwgY2xhc3NlcyA9IHRyaW1tZWRDbGFzc2VzID8gdHJpbW1lZENsYXNzZXMuc3BsaXQoL1xccysvKSA6IFtdXG5cdFx0XHQsIGkgPSAwXG5cdFx0XHQsIGxlbiA9IGNsYXNzZXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdHRoaXMucHVzaChjbGFzc2VzW2ldKTtcblx0XHR9XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lID0gZnVuY3Rpb24gKCkge1xuXHRcdFx0ZWxlbS5zZXRBdHRyaWJ1dGUoXCJjbGFzc1wiLCB0aGlzLnRvU3RyaW5nKCkpO1xuXHRcdH07XG5cdH1cblx0LCBjbGFzc0xpc3RQcm90byA9IENsYXNzTGlzdFtwcm90b1Byb3BdID0gW11cblx0LCBjbGFzc0xpc3RHZXR0ZXIgPSBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIG5ldyBDbGFzc0xpc3QodGhpcyk7XG5cdH1cbjtcbi8vIE1vc3QgRE9NRXhjZXB0aW9uIGltcGxlbWVudGF0aW9ucyBkb24ndCBhbGxvdyBjYWxsaW5nIERPTUV4Y2VwdGlvbidzIHRvU3RyaW5nKClcbi8vIG9uIG5vbi1ET01FeGNlcHRpb25zLiBFcnJvcidzIHRvU3RyaW5nKCkgaXMgc3VmZmljaWVudCBoZXJlLlxuRE9NRXhbcHJvdG9Qcm9wXSA9IEVycm9yW3Byb3RvUHJvcF07XG5jbGFzc0xpc3RQcm90by5pdGVtID0gZnVuY3Rpb24gKGkpIHtcblx0cmV0dXJuIHRoaXNbaV0gfHwgbnVsbDtcbn07XG5jbGFzc0xpc3RQcm90by5jb250YWlucyA9IGZ1bmN0aW9uICh0b2tlbikge1xuXHRyZXR1cm4gfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbiArIFwiXCIpO1xufTtcbmNsYXNzTGlzdFByb3RvLmFkZCA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aWYgKCF+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKSkge1xuXHRcdFx0dGhpcy5wdXNoKHRva2VuKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlbW92ZSA9IGZ1bmN0aW9uICgpIHtcblx0dmFyXG5cdFx0ICB0b2tlbnMgPSBhcmd1bWVudHNcblx0XHQsIGkgPSAwXG5cdFx0LCBsID0gdG9rZW5zLmxlbmd0aFxuXHRcdCwgdG9rZW5cblx0XHQsIHVwZGF0ZWQgPSBmYWxzZVxuXHRcdCwgaW5kZXhcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR3aGlsZSAofmluZGV4KSB7XG5cdFx0XHR0aGlzLnNwbGljZShpbmRleCwgMSk7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHRcdGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuKTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by50b2dnbGUgPSBmdW5jdGlvbiAodG9rZW4sIGZvcmNlKSB7XG5cdHZhclxuXHRcdCAgcmVzdWx0ID0gdGhpcy5jb250YWlucyh0b2tlbilcblx0XHQsIG1ldGhvZCA9IHJlc3VsdCA/XG5cdFx0XHRmb3JjZSAhPT0gdHJ1ZSAmJiBcInJlbW92ZVwiXG5cdFx0OlxuXHRcdFx0Zm9yY2UgIT09IGZhbHNlICYmIFwiYWRkXCJcblx0O1xuXG5cdGlmIChtZXRob2QpIHtcblx0XHR0aGlzW21ldGhvZF0odG9rZW4pO1xuXHR9XG5cblx0aWYgKGZvcmNlID09PSB0cnVlIHx8IGZvcmNlID09PSBmYWxzZSkge1xuXHRcdHJldHVybiBmb3JjZTtcblx0fSBlbHNlIHtcblx0XHRyZXR1cm4gIXJlc3VsdDtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdHZhciBpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0b2tlbiArIFwiXCIpO1xuXHRpZiAofmluZGV4KSB7XG5cdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEsIHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufVxuY2xhc3NMaXN0UHJvdG8udG9TdHJpbmcgPSBmdW5jdGlvbiAoKSB7XG5cdHJldHVybiB0aGlzLmpvaW4oXCIgXCIpO1xufTtcblxuaWYgKG9iakN0ci5kZWZpbmVQcm9wZXJ0eSkge1xuXHR2YXIgY2xhc3NMaXN0UHJvcERlc2MgPSB7XG5cdFx0ICBnZXQ6IGNsYXNzTGlzdEdldHRlclxuXHRcdCwgZW51bWVyYWJsZTogdHJ1ZVxuXHRcdCwgY29uZmlndXJhYmxlOiB0cnVlXG5cdH07XG5cdHRyeSB7XG5cdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHR9IGNhdGNoIChleCkgeyAvLyBJRSA4IGRvZXNuJ3Qgc3VwcG9ydCBlbnVtZXJhYmxlOnRydWVcblx0XHQvLyBhZGRpbmcgdW5kZWZpbmVkIHRvIGZpZ2h0IHRoaXMgaXNzdWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2lzc3Vlcy8zNlxuXHRcdC8vIG1vZGVybmllIElFOC1NU1c3IG1hY2hpbmUgaGFzIElFOCA4LjAuNjAwMS4xODcwMiBhbmQgaXMgYWZmZWN0ZWRcblx0XHRpZiAoZXgubnVtYmVyID09PSB1bmRlZmluZWQgfHwgZXgubnVtYmVyID09PSAtMHg3RkY1RUM1NCkge1xuXHRcdFx0Y2xhc3NMaXN0UHJvcERlc2MuZW51bWVyYWJsZSA9IGZhbHNlO1xuXHRcdFx0b2JqQ3RyLmRlZmluZVByb3BlcnR5KGVsZW1DdHJQcm90bywgY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0UHJvcERlc2MpO1xuXHRcdH1cblx0fVxufSBlbHNlIGlmIChvYmpDdHJbcHJvdG9Qcm9wXS5fX2RlZmluZUdldHRlcl9fKSB7XG5cdGVsZW1DdHJQcm90by5fX2RlZmluZUdldHRlcl9fKGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdEdldHRlcik7XG59XG5cbn0oc2VsZikpO1xuXG59XG5cbi8vIFRoZXJlIGlzIGZ1bGwgb3IgcGFydGlhbCBuYXRpdmUgY2xhc3NMaXN0IHN1cHBvcnQsIHNvIGp1c3QgY2hlY2sgaWYgd2UgbmVlZFxuLy8gdG8gbm9ybWFsaXplIHRoZSBhZGQvcmVtb3ZlIGFuZCB0b2dnbGUgQVBJcy5cblxuKGZ1bmN0aW9uICgpIHtcblx0XCJ1c2Ugc3RyaWN0XCI7XG5cblx0dmFyIHRlc3RFbGVtZW50ID0gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIik7XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LmFkZChcImMxXCIsIFwiYzJcIik7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwLzExIGFuZCBGaXJlZm94IDwyNiwgd2hlcmUgY2xhc3NMaXN0LmFkZCBhbmRcblx0Ly8gY2xhc3NMaXN0LnJlbW92ZSBleGlzdCBidXQgc3VwcG9ydCBvbmx5IG9uZSBhcmd1bWVudCBhdCBhIHRpbWUuXG5cdGlmICghdGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzJcIikpIHtcblx0XHR2YXIgY3JlYXRlTWV0aG9kID0gZnVuY3Rpb24obWV0aG9kKSB7XG5cdFx0XHR2YXIgb3JpZ2luYWwgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF07XG5cblx0XHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXSA9IGZ1bmN0aW9uKHRva2VuKSB7XG5cdFx0XHRcdHZhciBpLCBsZW4gPSBhcmd1bWVudHMubGVuZ3RoO1xuXG5cdFx0XHRcdGZvciAoaSA9IDA7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0XHRcdHRva2VuID0gYXJndW1lbnRzW2ldO1xuXHRcdFx0XHRcdG9yaWdpbmFsLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0XHR9XG5cdFx0XHR9O1xuXHRcdH07XG5cdFx0Y3JlYXRlTWV0aG9kKCdhZGQnKTtcblx0XHRjcmVhdGVNZXRob2QoJ3JlbW92ZScpO1xuXHR9XG5cblx0dGVzdEVsZW1lbnQuY2xhc3NMaXN0LnRvZ2dsZShcImMzXCIsIGZhbHNlKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAgYW5kIEZpcmVmb3ggPDI0LCB3aGVyZSBjbGFzc0xpc3QudG9nZ2xlIGRvZXMgbm90XG5cdC8vIHN1cHBvcnQgdGhlIHNlY29uZCBhcmd1bWVudC5cblx0aWYgKHRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMzXCIpKSB7XG5cdFx0dmFyIF90b2dnbGUgPSBET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZTtcblxuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlID0gZnVuY3Rpb24odG9rZW4sIGZvcmNlKSB7XG5cdFx0XHRpZiAoMSBpbiBhcmd1bWVudHMgJiYgIXRoaXMuY29udGFpbnModG9rZW4pID09PSAhZm9yY2UpIHtcblx0XHRcdFx0cmV0dXJuIGZvcmNlO1xuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0cmV0dXJuIF90b2dnbGUuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHR9XG5cdFx0fTtcblxuXHR9XG5cblx0Ly8gcmVwbGFjZSgpIHBvbHlmaWxsXG5cdGlmICghKFwicmVwbGFjZVwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpLmNsYXNzTGlzdCkpIHtcblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnJlcGxhY2UgPSBmdW5jdGlvbiAodG9rZW4sIHJlcGxhY2VtZW50X3Rva2VuKSB7XG5cdFx0XHR2YXJcblx0XHRcdFx0ICB0b2tlbnMgPSB0aGlzLnRvU3RyaW5nKCkuc3BsaXQoXCIgXCIpXG5cdFx0XHRcdCwgaW5kZXggPSB0b2tlbnMuaW5kZXhPZih0b2tlbiArIFwiXCIpXG5cdFx0XHQ7XG5cdFx0XHRpZiAofmluZGV4KSB7XG5cdFx0XHRcdHRva2VucyA9IHRva2Vucy5zbGljZShpbmRleCk7XG5cdFx0XHRcdHRoaXMucmVtb3ZlLmFwcGx5KHRoaXMsIHRva2Vucyk7XG5cdFx0XHRcdHRoaXMuYWRkKHJlcGxhY2VtZW50X3Rva2VuKTtcblx0XHRcdFx0dGhpcy5hZGQuYXBwbHkodGhpcywgdG9rZW5zLnNsaWNlKDEpKTtcblx0XHRcdH1cblx0XHR9XG5cdH1cblxuXHR0ZXN0RWxlbWVudCA9IG51bGw7XG59KCkpO1xuXG59IiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBpdGVtIHRvIGNvbGxlY3Rpb24gJHtwYXJhbXMuY29sbF9uYW1lfWApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgaWYgKCAhICQoXCJodG1sXCIpLmlzKFwiLmNybXNcIikgKSB7XG4gICAgcmV0dXJuO1xuICB9XG5cbiAgLy8gaWYgKCAkKFwiLm5hdmJhci1zdGF0aWMtdG9wXCIpLmRhdGEoJ2xvZ2dlZGluJykgIT0gJ1lFUycgJiYgd2luZG93LmxvY2F0aW9uLnByb3RvY29sID09ICdodHRwczonICkge1xuICAvLyAgICAgLy8gaG9ycmlibGUgaGFja1xuICAvLyAgICAgdmFyIHRhcmdldCA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2UoL1xcJC9nLCAnJTI0Jyk7XG4gIC8vICAgICB2YXIgaHJlZiA9ICdodHRwczovLycgKyB3aW5kb3cubG9jYXRpb24uaG9zdG5hbWUgKyAnL1NoaWJib2xldGguc3NvL0xvZ2luP2VudGl0eUlEPWh0dHBzOi8vc2hpYmJvbGV0aC51bWljaC5lZHUvaWRwL3NoaWJib2xldGgmdGFyZ2V0PScgKyB0YXJnZXQ7XG4gIC8vICAgICB3aW5kb3cubG9jYXRpb24uaHJlZiA9IGhyZWY7XG4gIC8vICAgICByZXR1cm47XG4gIC8vIH1cblxuICAvLyBkZWZpbmUgQ1JNUyBzdGF0ZVxuICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtVVMnO1xuICB2YXIgaSA9IHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoJ3NraW49Y3Jtc3dvcmxkJyk7XG4gIGlmICggaSArIDEgIT0gMCApIHtcbiAgICAgIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1Xb3JsZCc7XG4gIH1cblxuICAvLyBkaXNwbGF5IGJpYiBpbmZvcm1hdGlvblxuICB2YXIgJGRpdiA9ICQoXCIuYmliTGlua3NcIik7XG4gIHZhciAkcCA9ICRkaXYuZmluZChcInA6Zmlyc3RcIik7XG4gICRwLmZpbmQoXCJzcGFuOmVtcHR5XCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAvLyAkKHRoaXMpLnRleHQoJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSkuYWRkQ2xhc3MoXCJibG9ja2VkXCIpO1xuICAgICAgdmFyIGZyYWdtZW50ID0gJzxzcGFuIGNsYXNzPVwiYmxvY2tlZFwiPjxzdHJvbmc+e2xhYmVsfTo8L3N0cm9uZz4ge2NvbnRlbnR9PC9zcGFuPic7XG4gICAgICBmcmFnbWVudCA9IGZyYWdtZW50LnJlcGxhY2UoJ3tsYWJlbH0nLCAkKHRoaXMpLmF0dHIoJ3Byb3BlcnR5Jykuc3Vic3RyKDMpKS5yZXBsYWNlKCd7Y29udGVudH0nLCAkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKTtcbiAgICAgICRwLmFwcGVuZChmcmFnbWVudCk7XG4gIH0pXG5cbiAgdmFyICRsaW5rID0gJChcIiNlbWJlZEh0bWxcIik7XG4gIGNvbnNvbGUubG9nKFwiQUhPWSBFTUJFRFwiLCAkbGluayk7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xuXG4gICRsaW5rID0gJChcImFbZGF0YS10b2dnbGU9J1BUIEZpbmQgaW4gYSBMaWJyYXJ5J11cIik7XG4gICRsaW5rLnBhcmVudCgpLnJlbW92ZSgpO1xufSlcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgaGlkZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYmFyXCIgd2lkdGg9XCIwJVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgLy8gJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1zdWNjZXNzIGRvbmUgaGlkZVwiPicgK1xuICAgICAgICAgICAgLy8gICAgICc8cD5BbGwgZG9uZSE8L3A+JyArXG4gICAgICAgICAgICAvLyAnPC9kaXY+JyArIFxuICAgICAgICAgICAgYDxkaXY+PHA+PGEgaHJlZj1cImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2hlbHBfZGlnaXRhbF9saWJyYXJ5I0Rvd25sb2FkXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCdzIHRoZSBkZWFsIHdpdGggZG93bmxvYWRzPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcycsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uLi48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xzYXM9XCJvZmZzY3JlZW5cIj5QcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBQcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuYCk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikudGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0gKCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkKS4uLmApO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgJHtNYXRoLmNlaWwocGVyY2VudCl9JSBvZiB0aGUgJHtzZWxmLml0ZW1fdGl0bGV9IGhhcyBiZWVuIGJ1aWx0LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIGFuZCBkbyB0aGlzIGhlcmVcbiAgICAkKFwiI3NlbGVjdGVkUGFnZXNQZGZMaW5rXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBwcmludGFibGUgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKCBwcmludGFibGUubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBwcmludC48L3A+XCIgXTtcbiAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYXBwZWFyIGluIHRoZSBzZWxlY3Rpb24gY29udGVudHMgPGJ1dHRvbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgYm9yZGVyLWNvbG9yOiAjZWVlXFxcIiBjbGFzcz1cXFwiYnRuIHNxdWFyZVxcXCI+PGkgY2xhc3M9XFxcImljb21vb24gaWNvbW9vbi1wYXBlcnNcXFwiIHN0eWxlPVxcXCJjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMTRweDtcXFwiIC8+PC9idXR0b24+XCIpO1xuXG4gICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBzZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24ocHJpbnRhYmxlKTtcblxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3NlcScsIHNlcSk7XG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgfSk7XG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rJyArXG4gICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAnaHJlZj1cIicgKyBlbWJlZEhlbHBMaW5rICsgJ1wiIHRhcmdldD1cIl9ibGFua1wiPkhlbHA8L2E+PC9oMz4nICtcbiAgICAgICAgJzxmb3JtPicgKyBcbiAgICAgICAgJyAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5Db3B5IHRoZSBjb2RlIGJlbG93IGFuZCBwYXN0ZSBpdCBpbnRvIHRoZSBIVE1MIG9mIGFueSB3ZWJzaXRlIG9yIGJsb2cuPC9zcGFuPicgK1xuICAgICAgICAnICAgIDxsYWJlbCBmb3I9XCJjb2RlYmxvY2tcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkNvZGUgQmxvY2s8L2xhYmVsPicgK1xuICAgICAgICAnICAgIDx0ZXh0YXJlYSBjbGFzcz1cImlucHV0LXhsYXJnZVwiIGlkPVwiY29kZWJsb2NrXCIgbmFtZT1cImNvZGVibG9ja1wiIHJvd3M9XCIzXCI+JyArXG4gICAgICAgIGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iICsgJzwvdGV4dGFyZWE+JyArIFxuICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArIFxuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiPicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1zY3JvbGxcIi8+IFNjcm9sbCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArIFxuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiPicgK1xuICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWJvb2stYWx0MlwiLz4gRmxpcCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZm9ybT4nICtcbiAgICAnPC9kaXY+J1xuICAgICk7XG5cblxuICAgICQoXCIjZW1iZWRIdG1sXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfVxuICAgIF0pO1xuXG4gICAgICAgIC8vIEN1c3RvbSB3aWR0aCBmb3IgYm91bmRpbmcgJy5tb2RhbCcgXG4gICAgICAgICRibG9jay5jbG9zZXN0KCcubW9kYWwnKS5hZGRDbGFzcyhcImJvb3Rib3hNZWRpdW1XaWR0aFwiKTtcblxuICAgICAgICAvLyBTZWxlY3QgZW50aXJldHkgb2YgY29kZWJsb2NrIGZvciBlYXN5IGNvcHlpbmdcbiAgICAgICAgdmFyIHRleHRhcmVhID0gJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWNvZGVibG9ja11cIik7XG4gICAgdGV4dGFyZWEub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IGNvZGVibG9jayB0byBvbmUgb2YgdHdvIHZpZXdzIFxuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctc2Nyb2xsXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LWZsaXBcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9sb25nLCBzaWRlX3Nob3J0KSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGZlZWRiYWNrIHN5c3RlbVxudmFyIEhUID0gSFQgfHwge307XG5IVC5mZWVkYmFjayA9IHt9O1xuSFQuZmVlZGJhY2suZGlhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPVxuICAgICAgICAnPGZvcm0+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPkVtYWlsIEFkZHJlc3M8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGxhYmVsIGZvcj1cImVtYWlsXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5FTWFpbCBBZGRyZXNzPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBwbGFjZWhvbGRlcj1cIltZb3VyIGVtYWlsIGFkZHJlc3NdXCIgbmFtZT1cImVtYWlsXCIgaWQ9XCJlbWFpbFwiIC8+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPldlIHdpbGwgbWFrZSBldmVyeSBlZmZvcnQgdG8gYWRkcmVzcyBjb3B5cmlnaHQgaXNzdWVzIGJ5IHRoZSBuZXh0IGJ1c2luZXNzIGRheSBhZnRlciBub3RpZmljYXRpb24uPC9zcGFuPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPk92ZXJhbGwgcGFnZSByZWFkYWJpbGl0eSBhbmQgcXVhbGl0eTwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiB2YWx1ZT1cInJlYWRhYmxlXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eVwiID4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBGZXcgcHJvYmxlbXMsIGVudGlyZSBwYWdlIGlzIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCIgdmFsdWU9XCJzb21lcHJvYmxlbXNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTb21lIHByb2JsZW1zLCBidXQgc3RpbGwgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJkaWZmaWN1bHRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNpZ25pZmljYW50IHByb2JsZW1zLCBkaWZmaWN1bHQgb3IgaW1wb3NzaWJsZSB0byByZWFkJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTRcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5TcGVjaWZpYyBwYWdlIGltYWdlIHByb2JsZW1zPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBhbnkgdGhhdCBhcHBseTwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIiBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIiBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQmx1cnJ5IHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjdXJ2ZWRcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCIgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEN1cnZlZCBvciBkaXN0b3J0ZWQgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIj5PdGhlciBwcm9ibGVtIDwvbGFiZWw+PGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1tZWRpdW1cIiBuYW1lPVwib3RoZXJcIiB2YWx1ZT1cIlwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtb3RoZXJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+UHJvYmxlbXMgd2l0aCBhY2Nlc3MgcmlnaHRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIiBzdHlsZT1cIm1hcmdpbi1ib3R0b206IDFyZW07XCI+PHN0cm9uZz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIChTZWUgYWxzbzogPGEgaHJlZj1cImh0dHA6Ly93d3cuaGF0aGl0cnVzdC5vcmcvdGFrZV9kb3duX3BvbGljeVwiIHRhcmdldD1cIl9ibGFua1wiPnRha2UtZG93biBwb2xpY3k8L2E+KScgK1xuICAgICAgICAnICAgICAgICA8L3N0cm9uZz48L3NwYW4+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9hY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAgICAgSSBoYXZlIGFjY2VzcyB0byB0aGlzIGl0ZW0sIGJ1dCBzaG91bGQgbm90LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArIFxuICAgICAgICAnICAgICAgICA8bGVnZW5kPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8cD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cIm9mZnNjcmVlblwiIGZvcj1cImNvbW1lbnRzXCI+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDx0ZXh0YXJlYSBpZD1cImNvbW1lbnRzXCIgbmFtZT1cImNvbW1lbnRzXCIgcm93cz1cIjNcIj48L3RleHRhcmVhPicgK1xuICAgICAgICAnICAgICAgICA8L3A+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJzwvZm9ybT4nO1xuXG4gICAgdmFyICRmb3JtID0gJChodG1sKTtcblxuICAgIC8vIGhpZGRlbiBmaWVsZHNcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU3lzSUQnIC8+XCIpLnZhbChIVC5wYXJhbXMuaWQpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nUmVjb3JkVVJMJyAvPlwiKS52YWwoSFQucGFyYW1zLlJlY29yZFVSTCkuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nQ1JNUycgLz5cIikudmFsKEhULmNybXNfc3RhdGUpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICAgICAgdmFyICRlbWFpbCA9ICRmb3JtLmZpbmQoXCIjZW1haWxcIik7XG4gICAgICAgICRlbWFpbC52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgICAgICRlbWFpbC5oaWRlKCk7XG4gICAgICAgICQoXCI8c3Bhbj5cIiArIEhULmNybXNfc3RhdGUgKyBcIjwvc3Bhbj48YnIgLz5cIikuaW5zZXJ0QWZ0ZXIoJGVtYWlsKTtcbiAgICAgICAgJGZvcm0uZmluZChcIi5oZWxwLWJsb2NrXCIpLmhpZGUoKTtcbiAgICB9XG5cbiAgICBpZiAoIEhULnJlYWRlciApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH0gZWxzZSBpZiAoIEhULnBhcmFtcy5zZXEgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J3ZpZXcnIC8+XCIpLnZhbChIVC5wYXJhbXMudmlldykuYXBwZW5kVG8oJGZvcm0pO1xuXG4gICAgLy8gaWYgKCBIVC5jcm1zX3N0YXRlICkge1xuICAgIC8vICAgICAkZm9ybS5maW5kKFwiI2VtYWlsXCIpLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAvLyB9XG5cblxuICAgIHJldHVybiAkZm9ybTtcbn07XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIGluaXRlZCA9IGZhbHNlO1xuXG4gICAgdmFyICRmb3JtID0gJChcIiNzZWFyY2gtbW9kYWwgZm9ybVwiKTtcbiAgICAkZm9ybS5hdHRyKCdhY3Rpb24nLCAnL3B0L3NlYXJjaF9jb21wbGV0ZS5odG1sJyk7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIEhULmFuYWx5dGljcy5nZXRDb250ZW50R3JvdXBEYXRhID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gY2hlYXRcbiAgICB2YXIgc3VmZml4ID0gJyc7XG4gICAgdmFyIGNvbnRlbnRfZ3JvdXAgPSA0O1xuICAgIGlmICggJChcIiNzZWN0aW9uXCIpLmRhdGEoXCJ2aWV3XCIpID09ICdyZXN0cmljdGVkJyApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAyO1xuICAgICAgc3VmZml4ID0gJyNyZXN0cmljdGVkJztcbiAgICB9IGVsc2UgaWYgKCB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKFwiZGVidWc9c3VwZXJcIikgPiAtMSApIHtcbiAgICAgIGNvbnRlbnRfZ3JvdXAgPSAzO1xuICAgICAgc3VmZml4ID0gJyNzdXBlcic7XG4gICAgfVxuICAgIHJldHVybiB7IGluZGV4IDogY29udGVudF9ncm91cCwgdmFsdWUgOiBIVC5wYXJhbXMuaWQgKyBzdWZmaXggfTtcblxuICB9XG5cbiAgSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmID0gZnVuY3Rpb24oaHJlZikge1xuICAgIHZhciB1cmwgPSAkLnVybChocmVmKTtcbiAgICB2YXIgbmV3X2hyZWYgPSB1cmwuc2VnbWVudCgpO1xuICAgIG5ld19ocmVmLnB1c2goJChcImh0bWxcIikuZGF0YSgnY29udGVudC1wcm92aWRlcicpKTtcbiAgICBuZXdfaHJlZi5wdXNoKHVybC5wYXJhbShcImlkXCIpKTtcbiAgICB2YXIgcXMgPSAnJztcbiAgICBpZiAoIG5ld19ocmVmLmluZGV4T2YoXCJzZWFyY2hcIikgPiAtMSAmJiB1cmwucGFyYW0oJ3ExJykgICkge1xuICAgICAgcXMgPSAnP3ExPScgKyB1cmwucGFyYW0oJ3ExJyk7XG4gICAgfVxuICAgIG5ld19ocmVmID0gXCIvXCIgKyBuZXdfaHJlZi5qb2luKFwiL1wiKSArIHFzO1xuICAgIHJldHVybiBuZXdfaHJlZjtcbiAgfVxuXG4gIEhULmFuYWx5dGljcy5nZXRQYWdlSHJlZiA9IGZ1bmN0aW9uKCkge1xuICAgIHJldHVybiBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYoKTtcbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgRElTTUlTU19FVkVOVCA9ICh3aW5kb3cuaGFzT3duUHJvcGVydHkgJiZcbiAgICAgICAgICAgICAgICB3aW5kb3cuaGFzT3duUHJvcGVydHkoJ29udG91Y2hzdGFydCcpKSA/XG4gICAgICAgICAgICAgICAgICAgICd0b3VjaHN0YXJ0JyA6ICdtb3VzZWRvd24nO1xuXG4gICAgdmFyICRtZW51cyA9ICQoXCJuYXYgPiB1bCA+IGxpOmhhcyh1bClcIik7XG5cbiAgICB2YXIgdG9nZ2xlID0gZnVuY3Rpb24oJHBvcHVwLCAkbWVudSwgJGxpbmspIHtcbiAgICAgICAgaWYgKCAkcG9wdXAuZGF0YSgnc3RhdGUnKSA9PSAnb3BlbicgKSB7XG4gICAgICAgICAgICAkbWVudS5yZW1vdmVDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICRwb3B1cC5hdHRyKCdhcmlhLWhpZGRlbicsICd0cnVlJyk7XG4gICAgICAgICAgICAkbGluay5mb2N1cygpO1xuICAgICAgICAgICAgJHBvcHVwLmRhdGEoJ3N0YXRlJywgJ2Nsb3NlZCcpO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJG1lbnUuYWRkQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkcG9wdXAuYXR0cignYXJpYS1oaWRkZW4nLCAnZmFsc2UnKTtcbiAgICAgICAgICAgICRwb3B1cC5kYXRhKCdzdGF0ZScsICdvcGVuJyk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkbWVudXMuZWFjaChmdW5jdGlvbihpbmRleCkge1xuICAgICAgICB2YXIgJG1lbnUgPSAkKHRoaXMpO1xuICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgV1VUXCIsICRtZW51KTtcbiAgICAgICAgJG1lbnUuZmluZChcImxpXCIpLmVhY2goZnVuY3Rpb24obGlkeCkge1xuICAgICAgICAgICAgdmFyICRpdGVtID0gJCh0aGlzKTtcbiAgICAgICAgICAgICRpdGVtLmF0dHIoJ2FyaWEtcm9sZScsICdwcmVzZW50YXRpb24nKTtcbiAgICAgICAgICAgICRpdGVtLmZpbmQoXCJhXCIpLmF0dHIoJ2FyaWEtcm9sZScsICdtZW51aXRlbScpO1xuICAgICAgICB9KVxuXG4gICAgICAgIHZhciAkbGluayA9ICRtZW51LmZpbmQoXCI+IGFcIik7XG4gICAgICAgIHZhciAkcG9wdXAgPSAkbWVudS5maW5kKFwidWxcIik7XG4gICAgICAgIHZhciAkaXRlbXMgPSAkcG9wdXAuZmluZChcImFcIik7XG4gICAgICAgICRsaW5rLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICB0b2dnbGUoJHBvcHVwLCAkbWVudSwgJGxpbmspO1xuICAgICAgICB9KVxuXG4gICAgICAgICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcsIC0xKTtcbiAgICAgICAgJG1lbnUub24oJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICAgICAgdmFyIGNvZGUgPSBldmVudC5jb2RlO1xuICAgICAgICAgICAgdmFyIHNlbGVjdGVkX2lkeCA9ICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcpO1xuICAgICAgICAgICAgdmFyIGRlbHRhID0gMDtcbiAgICAgICAgICAgIGlmICggY29kZSA9PSAnQXJyb3dEb3duJyApIHtcbiAgICAgICAgICAgICAgICBkZWx0YSA9IDE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBjb2RlID09ICdBcnJvd1VwJyApIHtcbiAgICAgICAgICAgICAgICBkZWx0YSA9IC0xO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggY29kZSA9PSAnRXNjYXBlJyApIHtcbiAgICAgICAgICAgICAgICB0b2dnbGUoJHBvcHVwLCAkbWVudSwgJGxpbmspO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKCBkZWx0YSA9PSAwICkgeyBjb25zb2xlLmxvZyhcIkFIT1kgS0VZQ09ERVwiLCBjb2RlKTsgcmV0dXJuIDsgfVxuICAgICAgICAgICAgZXZlbnQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICBzZWxlY3RlZF9pZHggPSAoIHNlbGVjdGVkX2lkeCArIGRlbHRhICkgJSAkaXRlbXMubGVuZ3RoO1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIE1FTlUgS0VZRE9XTlwiLCBzZWxlY3RlZF9pZHgpO1xuICAgICAgICAgICAgJHNlbGVjdGVkID0gJGl0ZW1zLnNsaWNlKHNlbGVjdGVkX2lkeCwgc2VsZWN0ZWRfaWR4ICsgMSk7XG4gICAgICAgICAgICAkc2VsZWN0ZWQuZm9jdXMoKTtcbiAgICAgICAgICAgICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcsIHNlbGVjdGVkX2lkeCk7XG4gICAgICAgIH0pXG4gICAgfSlcblxuXG4gICAgLy8gJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4JywgLTEpO1xuICAgIC8vICRtZW51Lm9uKCdmb2N1c2luJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICAgJG1lbnUuZmluZChcIj4gYVwiKS5nZXQoMCkuZGF0YXNldC5leHBhbmRlZCA9IHRydWU7XG4gICAgLy8gfSlcbiAgICAvLyAkbWVudS5wcmV2KCkuZmluZChcIj4gYVwiKS5vbignZm9jdXNpbicsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkbWVudS5maW5kKFwiPiBhXCIpLmdldCgwKS5kYXRhc2V0LmV4cGFuZGVkID0gZmFsc2U7XG4gICAgLy8gfSlcbiAgICAvLyAkbWVudS5maW5kKFwidWwgPiBsaSA+IGE6bGFzdFwiKS5vbignZm9jdXNvdXQnLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICAkbWVudS5maW5kKFwiPiBhXCIpLmdldCgwKS5kYXRhc2V0LmV4cGFuZGVkID0gZmFsc2U7XG4gICAgLy8gfSlcbiAgICAvLyAkbWVudS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gICAgIHZhciBjb2RlID0gZXZlbnQuY29kZTtcbiAgICAvLyAgICAgdmFyICRpdGVtcyA9ICRtZW51LmZpbmQoXCJ1bCA+IGxpID4gYVwiKTtcbiAgICAvLyAgICAgdmFyIHNlbGVjdGVkX2lkeCA9ICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcpO1xuICAgIC8vICAgICB2YXIgZGVsdGEgPSAwO1xuICAgIC8vICAgICBpZiAoIGNvZGUgPT0gJ0Fycm93RG93bicgKSB7XG4gICAgLy8gICAgICAgICBkZWx0YSA9IDE7XG4gICAgLy8gICAgIH0gZWxzZSBpZiAoIGNvZGUgPT0gJ0Fycm93VXAnICkge1xuICAgIC8vICAgICAgICAgZGVsdGEgPSAtMTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICBpZiAoIGRlbHRhID09IDAgKSB7IHJldHVybiA7IH1cbiAgICAvLyAgICAgc2VsZWN0ZWRfaWR4ID0gKCBzZWxlY3RlZF9pZHggKyBkZWx0YSApICUgJGl0ZW1zLmxlbmd0aDtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJBSE9ZIE1FTlUgS0VZRE9XTlwiLCBzZWxlY3RlZF9pZHgpO1xuICAgIC8vICAgICAkc2VsZWN0ZWQgPSAkaXRlbXMuc2xpY2Uoc2VsZWN0ZWRfaWR4LCBzZWxlY3RlZF9pZHggKyAxKTtcbiAgICAvLyAgICAgJHNlbGVjdGVkLmZvY3VzKCk7XG4gICAgLy8gICAgICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcsIHNlbGVjdGVkX2lkeCk7XG4gICAgLy8gfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKS5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRmb3JtID0gJCh0aGlzKTtcbiAgICB2YXIgJHN1Ym1pdCA9ICRmb3JtLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkc3VibWl0LnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgfSlcblxuICAgIHJldHVybiB0cnVlO1xuICB9KVxufSk7XG4iLCIvKipcbiAqIFNvY2lhbCBMaW5rc1xuICogSW5zcGlyZWQgYnk6IGh0dHA6Ly9zYXBlZ2luLmdpdGh1Yi5jb20vc29jaWFsLWxpa2VzXG4gKlxuICogU2hhcmluZyBidXR0b25zIGZvciBSdXNzaWFuIGFuZCB3b3JsZHdpZGUgc29jaWFsIG5ldHdvcmtzLlxuICpcbiAqIEByZXF1aXJlcyBqUXVlcnlcbiAqIEBhdXRob3IgQXJ0ZW0gU2FwZWdpblxuICogQGNvcHlyaWdodCAyMDE0IEFydGVtIFNhcGVnaW4gKHNhcGVnaW4ubWUpXG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4vKmdsb2JhbCBkZWZpbmU6ZmFsc2UsIHNvY2lhbExpbmtzQnV0dG9uczpmYWxzZSAqL1xuXG4oZnVuY3Rpb24oZmFjdG9yeSkgeyAgLy8gVHJ5IHRvIHJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBBTUQgbW9kdWxlXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSk7XG4gICAgfVxufShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBwcmVmaXggPSAnc29jaWFsLWxpbmtzJztcbiAgICB2YXIgY2xhc3NQcmVmaXggPSBwcmVmaXggKyAnX18nO1xuICAgIHZhciBvcGVuQ2xhc3MgPSBwcmVmaXggKyAnX29wZW5lZCc7XG4gICAgdmFyIHByb3RvY29sID0gbG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonID8gJ2h0dHBzOicgOiAnaHR0cDonO1xuICAgIHZhciBpc0h0dHBzID0gcHJvdG9jb2wgPT09ICdodHRwczonO1xuXG5cbiAgICAvKipcbiAgICAgKiBCdXR0b25zXG4gICAgICovXG4gICAgdmFyIHNlcnZpY2VzID0ge1xuICAgICAgICBmYWNlYm9vazoge1xuICAgICAgICAgICAgbGFiZWw6ICdGYWNlYm9vaycsXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3BlcnMuZmFjZWJvb2suY29tL2RvY3MvcmVmZXJlbmNlL2ZxbC9saW5rX3N0YXQvXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vZnFsP3E9U0VMRUNUK3RvdGFsX2NvdW50K0ZST00rbGlua19zdGF0K1dIRVJFK3VybCUzRCUyMnt1cmx9JTIyJmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmRhdGFbMF0udG90YWxfY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNTAwXG4gICAgICAgIH0sXG4gICAgICAgIHR3aXR0ZXI6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVHdpdHRlcicsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly9jZG4uYXBpLnR3aXR0ZXIuY29tLzEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P3VybD17dXJsfSZ0ZXh0PXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNDUwLFxuICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCBjb2xvbiB0byBpbXByb3ZlIHJlYWRhYmlsaXR5XG4gICAgICAgICAgICAgICAgaWYgKCEvW1xcLlxcPzpcXC3igJPigJRdXFxzKiQvLnRlc3QodGhpcy5vcHRpb25zLnRpdGxlKSkgdGhpcy5vcHRpb25zLnRpdGxlICs9ICc6JztcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbWFpbHJ1OiB7XG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2Nvbm5lY3QubWFpbC5ydS9zaGFyZV9jb3VudD91cmxfbGlzdD17dXJsfSZjYWxsYmFjaz0xJmZ1bmM9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdXJsIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkodXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFbdXJsXS5zaGFyZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vY29ubmVjdC5tYWlsLnJ1L3NoYXJlP3NoYXJlX3VybD17dXJsfSZ0aXRsZT17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICB2a29udGFrdGU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVksnLFxuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vdmsuY29tL3NoYXJlLnBocD9hY3Q9Y291bnQmdXJsPXt1cmx9JmluZGV4PXtpbmRleH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLnZrb250YWt0ZTtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuVkspIHdpbmRvdy5WSyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuVksuU2hhcmUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogZnVuY3Rpb24oaWR4LCBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl9baWR4XS5yZXNvbHZlKG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gb3B0aW9ucy5fLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBvcHRpb25zLl8ucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsLCB7aW5kZXg6IGluZGV4fSkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vdmsuY29tL3NoYXJlLnBocD91cmw9e3VybH0mdGl0bGU9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzMzBcbiAgICAgICAgfSxcbiAgICAgICAgb2Rub2tsYXNzbmlraToge1xuICAgICAgICAgICAgLy8gSFRUUFMgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgY291bnRlclVybDogaXNIdHRwcyA/IHVuZGVmaW5lZCA6ICdodHRwOi8vY29ubmVjdC5vay5ydS9kaz9zdC5jbWQ9ZXh0TGlrZSZyZWY9e3VybH0mdWlkPXtpbmRleH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLm9kbm9rbGFzc25pa2k7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93Lk9ES0wpIHdpbmRvdy5PREtMID0ge307XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5PREtMLnVwZGF0ZUNvdW50ID0gZnVuY3Rpb24oaWR4LCBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuX1tpZHhdLnJlc29sdmUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBvcHRpb25zLl8ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwsIHtpbmRleDogaW5kZXh9KSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHA6Ly9jb25uZWN0Lm9rLnJ1L2RrP3N0LmNtZD1XaWRnZXRTaGFyZVByZXZpZXcmc2VydmljZT1vZG5va2xhc3NuaWtpJnN0LnNoYXJlVXJsPXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgcGx1c29uZToge1xuICAgICAgICAgICAgbGFiZWw6ICdHb29nbGUrJyxcbiAgICAgICAgICAgIC8vIEhUVFBTIG5vdCBzdXBwb3J0ZWQgeWV0OiBodHRwOi8vY2x1YnMueWEucnUvc2hhcmUvMTQ5OVxuICAgICAgICAgICAgY291bnRlclVybDogaXNIdHRwcyA/IHVuZGVmaW5lZCA6ICdodHRwOi8vc2hhcmUueWFuZGV4LnJ1L2dwcC54bWw/dXJsPXt1cmx9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy5wbHVzb25lO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVqZWN0IGFsbCBjb3VudGVycyBleGNlcHQgdGhlIGZpcnN0IGJlY2F1c2UgWWFuZGV4IFNoYXJlIGNvdW50ZXIgZG9lc27igJl0IHJldHVybiBVUkxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5zZXJ2aWNlcykgd2luZG93LnNlcnZpY2VzID0ge307XG4gICAgICAgICAgICAgICAgd2luZG93LnNlcnZpY2VzLmdwbHVzID0ge1xuICAgICAgICAgICAgICAgICAgICBjYjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bWJlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1iZXIgPSBudW1iZXIucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5yZXNvbHZlKHBhcnNlSW50KG51bWJlciwgMTApKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBkZWZlcnJlZDtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwpKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/dXJsPXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDcwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA1MDBcbiAgICAgICAgfSxcbiAgICAgICAgcGludGVyZXN0OiB7XG4gICAgICAgICAgICBsYWJlbDogJ1BpbnRlcmVzdCcsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2J1dHRvbi8/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHR1bWJscjoge1xuICAgICAgICAgICAgbGFiZWw6ICdUdW1ibHInLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsMTogcHJvdG9jb2wgKyAnLy93d3cudHVtYmxyLmNvbS9zaGFyZS9saW5rP3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBVcmwyOiBwcm90b2NvbCArICcvL3d3dy50dW1ibHIuY29tL3NoYXJlL3Bob3RvP3NvdXJjZT17bWVkaWF9JmNsaWNrX3RocnU9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3B1cFVybCA9IHRoaXMub3B0aW9ucy5wb3B1cFVybDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvcHVwVXJsID0gdGhpcy5vcHRpb25zLnBvcHVwVXJsMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gd2lsbCBzdGlsbCBuZWVkIHRvIGNoYW5nZSB0aGUgVVJMIHN0cnVjdHVyZVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgcmVkZGl0OiB7XG4gICAgICAgICAgICBsYWJlbDogJ1JlZGRpdCcsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vcmVkZGl0LmNvbS9zdWJtaXQ/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIEVPVDogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgcGx1Z2luXG4gICAgICovXG4gICAgJC5mbi5zb2NpYWxMaW5rcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbGVtID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IGVsZW0uZGF0YShwcmVmaXgpO1xuICAgICAgICAgICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS51cGRhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBuZXcgc29jaWFsTGlua3MoZWxlbSwgJC5leHRlbmQoe30sICQuZm4uc29jaWFsTGlua3MuZGVmYXVsdHMsIG9wdGlvbnMsIGRhdGFUb09wdGlvbnMoZWxlbSkpKTtcbiAgICAgICAgICAgICAgICBlbGVtLmRhdGEocHJlZml4LCBpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgcG9zdF90aXRsZSA9IGRvY3VtZW50LnRpdGxlLnNwbGl0KCcgfCAnKVswXS5zcGxpdCgnIC0gJyk7XG4gICAgaWYgKCAkLmluQXJyYXkocG9zdF90aXRsZVtwb3N0X3RpdGxlLmxlbmd0aCAtIDFdLCBbICdGdWxsIFZpZXcnLCAnTGltaXRlZCBWaWV3JywgJ0l0ZW0gTm90IEF2YWlsYWJsZScgXSkgIT09IC0xICkge1xuICAgICAgICBwb3N0X3RpdGxlLnBvcCgpO1xuICAgIH1cbiAgICBwb3N0X3RpdGxlID0gcG9zdF90aXRsZS5qb2luKFwiIC0gXCIpICsgXCIgfCBIYXRoaVRydXN0XCI7XG4gICAgJC5mbi5zb2NpYWxMaW5rcy5kZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5oYXNoLCAnJykucmVwbGFjZSgvOy9nLCAnJicpLnJlcGxhY2UoJy9zaGNnaS8nLCAnL2NnaS8nKSxcbiAgICAgICAgcG9zdF90aXRsZTogcG9zdF90aXRsZSxcbiAgICAgICAgY291bnRlcnM6IHRydWUsXG4gICAgICAgIHplcm9lczogZmFsc2UsXG4gICAgICAgIHdhaXQ6IDUwMCwgIC8vIFNob3cgYnV0dG9ucyBvbmx5IGFmdGVyIGNvdW50ZXJzIGFyZSByZWFkeSBvciBhZnRlciB0aGlzIGFtb3VudCBvZiB0aW1lXG4gICAgICAgIHRpbWVvdXQ6IDEwMDAwLCAgLy8gU2hvdyBjb3VudGVycyBhZnRlciB0aGlzIGFtb3VudCBvZiB0aW1lIGV2ZW4gaWYgdGhleSBhcmVu4oCZdCByZWFkeVxuICAgICAgICBwb3B1cENoZWNrSW50ZXJ2YWw6IDUwMCxcbiAgICAgICAgc2luZ2xlVGl0bGU6ICdTaGFyZSdcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc29jaWFsTGlua3MoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICBzb2NpYWxMaW5rcy5wcm90b3R5cGUgPSB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWRkIGNsYXNzIGluIGNhc2Ugb2YgbWFudWFsIGluaXRpYWxpemF0aW9uXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXgpO1xuXG4gICAgICAgICAgICB0aGlzLmluaXRVc2VyQnV0dG9ucygpO1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IHRoaXMuY29udGFpbmVyLmNoaWxkcmVuKCk7XG5cbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucyA9IFtdO1xuICAgICAgICAgICAgYnV0dG9ucy5lYWNoKCQucHJveHkoZnVuY3Rpb24oaWR4LCBlbGVtKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IG5ldyBCdXR0b24oJChlbGVtKSwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMucHVzaChidXR0b24pO1xuICAgICAgICAgICAgfSwgdGhpcykpO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGluaXRVc2VyQnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudXNlckJ1dHRvbkluaXRlZCAmJiB3aW5kb3cuc29jaWFsTGlua3NCdXR0b25zKSB7XG4gICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgc2VydmljZXMsIHNvY2lhbExpbmtzQnV0dG9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnVzZXJCdXR0b25Jbml0ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4ICsgJ192aXNpYmxlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWR5OiBmdW5jdGlvbihzaWxlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCArICdfcmVhZHknKTtcbiAgICAgICAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIudHJpZ2dlcigncmVhZHkuJyArIHByZWZpeCwgdGhpcy5udW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIEJ1dHRvbih3aWRnZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5kZXRlY3RTZXJ2aWNlKCk7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQnV0dG9uLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmRldGVjdFBhcmFtcygpO1xuICAgICAgICAgICAgdGhpcy5pbml0SHRtbCgpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KHRoaXMuaW5pdENvdW50ZXIsIHRoaXMpLCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICQuZXh0ZW5kKHRoaXMub3B0aW9ucywge2ZvcmNlVXBkYXRlOiBmYWxzZX0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy53aWRnZXQuZmluZCgnLicgKyBwcmVmaXggKyAnX19jb3VudGVyJykucmVtb3ZlKCk7ICAvLyBSZW1vdmUgb2xkIGNvdW50ZXJcbiAgICAgICAgICAgIHRoaXMuaW5pdENvdW50ZXIoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRlY3RTZXJ2aWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZXJ2aWNlID0gdGhpcy53aWRnZXQuZGF0YSgnc2VydmljZScpO1xuICAgICAgICAgICAgaWYgKCFzZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xhc3M9XCJmYWNlYm9va1wiXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLndpZGdldFswXTtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NlcyA9IG5vZGUuY2xhc3NMaXN0IHx8IG5vZGUuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2xhc3NJZHggPSAwOyBjbGFzc0lkeCA8IGNsYXNzZXMubGVuZ3RoOyBjbGFzc0lkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbHMgPSBjbGFzc2VzW2NsYXNzSWR4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlcnZpY2VzW2Nsc10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2UgPSBjbHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXNlcnZpY2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VydmljZSA9IHNlcnZpY2U7XG4gICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsIHNlcnZpY2VzW3NlcnZpY2VdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRlY3RQYXJhbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLndpZGdldC5kYXRhKCk7XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIGNvdW50ZXIgVVJMIG9yIG51bWJlclxuICAgICAgICAgICAgaWYgKGRhdGEuY291bnRlcikge1xuICAgICAgICAgICAgICAgIHZhciBudW1iZXIgPSBwYXJzZUludChkYXRhLmNvdW50ZXIsIDEwKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4obnVtYmVyKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY291bnRlclVybCA9IGRhdGEuY291bnRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jb3VudGVyTnVtYmVyID0gbnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgdGl0bGVcbiAgICAgICAgICAgIGlmIChkYXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9zdF90aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGF0YS50aXRsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgVVJMXG4gICAgICAgICAgICBpZiAoZGF0YS51cmwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudXJsID0gZGF0YS51cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdEh0bWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgd2lkZ2V0ID0gdGhpcy53aWRnZXQ7XG5cbiAgICAgICAgICAgIHZhciBidXR0b24gPSB3aWRnZXQ7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNsaWNrVXJsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IG1ha2VVcmwob3B0aW9ucy5jbGlja1VybCwge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxuICAgICAgICAgICAgICAgICAgICBwb3N0X3RpdGxlOiBvcHRpb25zLnBvc3RfdGl0bGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgbGluayA9ICQoJzxhPicsIHtcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogdXJsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9uZURhdGFBdHRycyh3aWRnZXQsIGxpbmspO1xuICAgICAgICAgICAgICAgIHdpZGdldC5yZXBsYWNlV2l0aChsaW5rKTtcbiAgICAgICAgICAgICAgICB0aGlzLndpZGdldCA9IHdpZGdldCA9IGxpbms7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmNsaWNrLCB0aGlzKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBfd2lkZ2V0ID0gd2lkZ2V0LmdldCgwKTtcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5yb2xlID0gJ3Rvb2x0aXAnO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0Lm1pY3JvdGlwUG9zaXRpb24gPSAndG9wJztcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5taWNyb3RpcFNpemUgPSAnc21hbGwnO1xuICAgICAgICAgICAgX3dpZGdldC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCB3aWRnZXQudGV4dCgpKTtcbiAgICAgICAgICAgIC8vIHdpZGdldC50b29sdGlwKHsgdGl0bGUgOiB3aWRnZXQudGV4dCgpLCBhbmltYXRpb246IGZhbHNlIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbiA9IGJ1dHRvbjtcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0Q291bnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xvbmVEYXRhQXR0cnM6IGZ1bmN0aW9uKHNvdXJjZSwgZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gc291cmNlLmRhdGEoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbi5kYXRhKGtleSwgZGF0YVtrZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RWxlbWVudENsYXNzTmFtZXM6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRFbGVtZW50Q2xhc3NOYW1lcyhlbGVtLCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUNvdW50ZXI6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCkgfHwgMDtcblxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiB0aGlzLmdldEVsZW1lbnRDbGFzc05hbWVzKCdjb3VudGVyJyksXG4gICAgICAgICAgICAgICAgJ3RleHQnOiBudW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW51bWJlciAmJiAhdGhpcy5vcHRpb25zLnplcm9lcykge1xuICAgICAgICAgICAgICAgIHBhcmFtc1snY2xhc3MnXSArPSAnICcgKyBwcmVmaXggKyAnX19jb3VudGVyX2VtcHR5JztcbiAgICAgICAgICAgICAgICBwYXJhbXMudGV4dCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvdW50ZXJFbGVtID0gJCgnPHNwYW4+JywgcGFyYW1zKTtcbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LmFwcGVuZChjb3VudGVyRWxlbSk7XG5cbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ2NvdW50ZXIuJyArIHByZWZpeCwgW3RoaXMuc2VydmljZSwgbnVtYmVyXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgdmFyIHByb2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLmNsaWNrKSkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MgPSBvcHRpb25zLmNsaWNrLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvY2Vzcykge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxuICAgICAgICAgICAgICAgICAgICBwb3N0X3RpdGxlOiBvcHRpb25zLnBvc3RfdGl0bGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5tZWRpYSA9IHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBtYWtlVXJsKG9wdGlvbnMucG9wdXBVcmwsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHVybCA9IHRoaXMuYWRkQWRkaXRpb25hbFBhcmFtc1RvVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuUG9wdXAodXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBvcHRpb25zLnBvcHVwV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogb3B0aW9ucy5wb3B1cEhlaWdodFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZEFkZGl0aW9uYWxQYXJhbXNUb1VybDogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9ICBkYXRhVG9PcHRpb25zKHRoaXMud2lkZ2V0KTtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLnBhcmFtKCQuZXh0ZW5kKGRhdGEsIHRoaXMub3B0aW9ucy5kYXRhKSk7XG4gICAgICAgICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KHBhcmFtcykpIHJldHVybiB1cmw7XG4gICAgICAgICAgICB2YXIgZ2x1ZSA9IHVybC5pbmRleE9mKCc/JykgPT09IC0xID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgcmV0dXJuIHVybCArIGdsdWUgKyBwYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3BlblBvcHVwOiBmdW5jdGlvbih1cmwsIHBhcmFtcykge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBNYXRoLnJvdW5kKHNjcmVlbi53aWR0aC8yIC0gcGFyYW1zLndpZHRoLzIpO1xuICAgICAgICAgICAgdmFyIHRvcCA9IDA7XG4gICAgICAgICAgICBpZiAoc2NyZWVuLmhlaWdodCA+IHBhcmFtcy5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB0b3AgPSBNYXRoLnJvdW5kKHNjcmVlbi5oZWlnaHQvMyAtIHBhcmFtcy5oZWlnaHQvMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3cub3Blbih1cmwsICdzbF8nICsgdGhpcy5zZXJ2aWNlLCAnbGVmdD0nICsgbGVmdCArICcsdG9wPScgKyB0b3AgKyAnLCcgK1xuICAgICAgICAgICAgICAgJ3dpZHRoPScgKyBwYXJhbXMud2lkdGggKyAnLGhlaWdodD0nICsgcGFyYW1zLmhlaWdodCArICcscGVyc29uYWxiYXI9MCx0b29sYmFyPTAsc2Nyb2xsYmFycz0xLHJlc2l6YWJsZT0xJyk7XG4gICAgICAgICAgICBpZiAod2luKSB7XG4gICAgICAgICAgICAgICAgd2luLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcigncG9wdXBfb3BlbmVkLicgKyBwcmVmaXgsIFt0aGlzLnNlcnZpY2UsIHdpbl0pO1xuICAgICAgICAgICAgICAgIHZhciB0aW1lciA9IHNldEludGVydmFsKCQucHJveHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luLmNsb3NlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcigncG9wdXBfY2xvc2VkLicgKyBwcmVmaXgsIHRoaXMuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyksIHRoaXMub3B0aW9ucy5wb3B1cENoZWNrSW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8qKlxuICAgICAqIEhlbHBlcnNcbiAgICAgKi9cblxuICAgICAvLyBDYW1lbGl6ZSBkYXRhLWF0dHJpYnV0ZXNcbiAgICBmdW5jdGlvbiBkYXRhVG9PcHRpb25zKGVsZW0pIHtcbiAgICAgICAgZnVuY3Rpb24gdXBwZXIobSwgbCkge1xuICAgICAgICAgICAgcmV0dXJuIGwudG9VcHBlcigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0ge307XG4gICAgICAgIHZhciBkYXRhID0gZWxlbS5kYXRhKCk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIGtleSA9PSAndG9vbHRpcCcgKSB7IGNvbnRpbnVlIDsgfVxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAneWVzJykgdmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09ICdubycpIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICBvcHRpb25zW2tleS5yZXBsYWNlKC8tKFxcdykvZywgdXBwZXIpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VVcmwodXJsLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZSh1cmwsIGNvbnRleHQsIGVuY29kZVVSSUNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUodG1wbCwgY29udGV4dCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB0bXBsLnJlcGxhY2UoL1xceyhbXlxcfV0rKVxcfS9nLCBmdW5jdGlvbihtLCBrZXkpIHtcbiAgICAgICAgICAgIC8vIElmIGtleSBkb2Vzbid0IGV4aXN0cyBpbiB0aGUgY29udGV4dCB3ZSBzaG91bGQga2VlcCB0ZW1wbGF0ZSB0YWcgYXMgaXNcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gY29udGV4dCA/IChmaWx0ZXIgPyBmaWx0ZXIoY29udGV4dFtrZXldKSA6IGNvbnRleHRba2V5XSkgOiBtO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRFbGVtZW50Q2xhc3NOYW1lcyhlbGVtLCBtb2QpIHtcbiAgICAgICAgdmFyIGNscyA9IGNsYXNzUHJlZml4ICsgZWxlbTtcbiAgICAgICAgcmV0dXJuIGNscyArICcgJyArIGNscyArICdfJyArIG1vZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZU9uQ2xpY2soZWxlbSwgY2FsbGJhY2spIHtcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlcihlKSB7XG4gICAgICAgICAgICBpZiAoKGUudHlwZSA9PT0gJ2tleWRvd24nICYmIGUud2hpY2ggIT09IDI3KSB8fCAkKGUudGFyZ2V0KS5jbG9zZXN0KGVsZW0pLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICAgICAgZWxlbS5yZW1vdmVDbGFzcyhvcGVuQ2xhc3MpO1xuICAgICAgICAgICAgZG9jLm9mZihldmVudHMsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihjYWxsYmFjaykpIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRvYyA9ICQoZG9jdW1lbnQpO1xuICAgICAgICB2YXIgZXZlbnRzID0gJ2NsaWNrIHRvdWNoc3RhcnQga2V5ZG93bic7XG4gICAgICAgIGRvYy5vbihldmVudHMsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dJblZpZXdwb3J0KGVsZW0pIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IDEwO1xuICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBwYXJzZUludChlbGVtLmNzcygnbGVmdCcpLCAxMCk7XG4gICAgICAgICAgICB2YXIgdG9wID0gcGFyc2VJbnQoZWxlbS5jc3MoJ3RvcCcpLCAxMCk7XG5cbiAgICAgICAgICAgIHZhciByZWN0ID0gZWxlbVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGlmIChyZWN0LmxlZnQgPCBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ2xlZnQnLCBvZmZzZXQgLSByZWN0LmxlZnQgKyBsZWZ0KTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHJlY3QucmlnaHQgPiB3aW5kb3cuaW5uZXJXaWR0aCAtIG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygnbGVmdCcsIHdpbmRvdy5pbm5lcldpZHRoIC0gcmVjdC5yaWdodCAtIG9mZnNldCArIGxlZnQpO1xuXG4gICAgICAgICAgICBpZiAocmVjdC50b3AgPCBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ3RvcCcsIG9mZnNldCAtIHJlY3QudG9wICsgdG9wKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0IC0gb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCd0b3AnLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSByZWN0LmJvdHRvbSAtIG9mZnNldCArIHRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS5hZGRDbGFzcyhvcGVuQ2xhc3MpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQXV0byBpbml0aWFsaXphdGlvblxuICAgICAqL1xuICAgICQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy4nICsgcHJlZml4KS5zb2NpYWxMaW5rcygpO1xuICAgIH0pO1xuXG59KSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgJChcIiN2ZXJzaW9uSWNvblwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
