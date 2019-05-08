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
        }

        self.$dialog.find(".bar").css({ width: percent + '%' });

        if (percent == 100) {
            self.$dialog.find(".progress").hide();
            var download_key = navigator.userAgent.indexOf('Mac OS X') != -1 ? 'RETURN' : 'ENTER';
            self.$dialog.find(".initial").html("<p>All done! Your " + self.item_title + " is ready for download. <span class=\"offscreen\">Select " + download_key + " to download.</span></p>");
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

    var codeblock_txt;
    var codeblock_txt_a = function codeblock_txt_a(w, h) {
        return '<iframe width="' + w + '" height="' + h + '" ';
    };
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $('<div class="embedUrlContainer">' + '<h3>Embed This Book' + '<a id="embedHelpIcon" default-form="data-default-form" ' + 'href="' + embedHelpLink + '" target="_blank">Help</a></h3>' + '<form>' + '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' + '    <label for="codeblock" class="offscreen">Code Block</label>' + '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' + codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + '<div class="controls">' + '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' + '<label class="radio inline" for="view-scroll">' + '<span class="icomoon icomoon-scroll"/> Scroll View ' + '</label>' + '<input type="radio" name="view" id="view-flip" value="1" >' + '<label class="radio inline" for="view-flip">' + '<span class="icomoon icomoon-book-alt2"/> Flip View ' + '</label>' + '</div>' + '</form>' + '</div>');

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImNsYXNzTGlzdC5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ2xvYmFsX3NlYXJjaC5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJtZW51cy5qcyIsInNlYXJjaF9pbl9pdGVtLmpzIiwic29jaWFsX2xpbmtzLmpzIiwidmVyc2lvbl9wb3B1cC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwialF1ZXJ5IiwiJCIsInVuZGVmaW5lZCIsInRhZzJhdHRyIiwiYSIsImltZyIsImZvcm0iLCJiYXNlIiwic2NyaXB0IiwiaWZyYW1lIiwibGluayIsImtleSIsImFsaWFzZXMiLCJwYXJzZXIiLCJzdHJpY3QiLCJsb29zZSIsInRvU3RyaW5nIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaXNpbnQiLCJwYXJzZVVyaSIsInVybCIsInN0cmljdE1vZGUiLCJzdHIiLCJkZWNvZGVVUkkiLCJyZXMiLCJleGVjIiwidXJpIiwiYXR0ciIsInBhcmFtIiwic2VnIiwiaSIsInBhcnNlU3RyaW5nIiwicGF0aCIsInJlcGxhY2UiLCJzcGxpdCIsImZyYWdtZW50IiwiaG9zdCIsInByb3RvY29sIiwicG9ydCIsImdldEF0dHJOYW1lIiwiZWxtIiwidG4iLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJwcm9tb3RlIiwicGFyZW50IiwibGVuZ3RoIiwidCIsInBhcnNlIiwicGFydHMiLCJ2YWwiLCJwYXJ0Iiwic2hpZnQiLCJpc0FycmF5IiwicHVzaCIsIm9iaiIsImtleXMiLCJpbmRleE9mIiwic3Vic3RyIiwidGVzdCIsIm1lcmdlIiwibGVuIiwibGFzdCIsImsiLCJzZXQiLCJyZWR1Y2UiLCJTdHJpbmciLCJyZXQiLCJwYWlyIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZSIsImVxbCIsImJyYWNlIiwibGFzdEJyYWNlSW5LZXkiLCJ2IiwiYyIsImFjY3VtdWxhdG9yIiwibCIsImN1cnIiLCJhcmd1bWVudHMiLCJjYWxsIiwidkFyZyIsInByb3AiLCJoYXNPd25Qcm9wZXJ0eSIsInB1cmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImRhdGEiLCJxdWVyeSIsImZwYXJhbSIsInNlZ21lbnQiLCJmc2VnbWVudCIsImZuIiwiSFQiLCJoZWFkIiwicmVhZHkiLCIkc3RhdHVzIiwibGFzdE1lc3NhZ2UiLCJsYXN0VGltZXIiLCJ1cGRhdGVfc3RhdHVzIiwibWVzc2FnZSIsImNsZWFyVGltZW91dCIsInNldFRpbWVvdXQiLCJ0ZXh0IiwiY29uc29sZSIsImxvZyIsImdldCIsImlubmVyVGV4dCIsInNlbGYiLCJkb2N1bWVudCIsImNyZWF0ZUVsZW1lbnQiLCJjcmVhdGVFbGVtZW50TlMiLCJ2aWV3IiwiY2xhc3NMaXN0UHJvcCIsInByb3RvUHJvcCIsImVsZW1DdHJQcm90byIsIkVsZW1lbnQiLCJvYmpDdHIiLCJzdHJUcmltIiwidHJpbSIsImFyckluZGV4T2YiLCJBcnJheSIsIml0ZW0iLCJET01FeCIsInR5cGUiLCJuYW1lIiwiY29kZSIsIkRPTUV4Y2VwdGlvbiIsImNoZWNrVG9rZW5BbmRHZXRJbmRleCIsImNsYXNzTGlzdCIsInRva2VuIiwiQ2xhc3NMaXN0IiwiZWxlbSIsInRyaW1tZWRDbGFzc2VzIiwiZ2V0QXR0cmlidXRlIiwiY2xhc3NlcyIsIl91cGRhdGVDbGFzc05hbWUiLCJzZXRBdHRyaWJ1dGUiLCJjbGFzc0xpc3RQcm90byIsImNsYXNzTGlzdEdldHRlciIsIkVycm9yIiwiY29udGFpbnMiLCJhZGQiLCJ0b2tlbnMiLCJ1cGRhdGVkIiwicmVtb3ZlIiwiaW5kZXgiLCJzcGxpY2UiLCJ0b2dnbGUiLCJmb3JjZSIsInJlc3VsdCIsIm1ldGhvZCIsInJlcGxhY2VtZW50X3Rva2VuIiwiam9pbiIsImRlZmluZVByb3BlcnR5IiwiY2xhc3NMaXN0UHJvcERlc2MiLCJlbnVtZXJhYmxlIiwiY29uZmlndXJhYmxlIiwiZXgiLCJudW1iZXIiLCJfX2RlZmluZUdldHRlcl9fIiwidGVzdEVsZW1lbnQiLCJjcmVhdGVNZXRob2QiLCJvcmlnaW5hbCIsIkRPTVRva2VuTGlzdCIsIl90b2dnbGUiLCJzbGljZSIsImFwcGx5IiwiREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OIiwiTkVXX0NPTExfTUVOVV9PUFRJT04iLCJJTl9ZT1VSX0NPTExTX0xBQkVMIiwiJHRvb2xiYXIiLCIkZXJyb3Jtc2ciLCIkaW5mb21zZyIsImRpc3BsYXlfZXJyb3IiLCJtc2ciLCJpbnNlcnRBZnRlciIsInNob3ciLCJkaXNwbGF5X2luZm8iLCJoaWRlX2Vycm9yIiwiaGlkZSIsImhpZGVfaW5mbyIsImdldF91cmwiLCJwYXRobmFtZSIsInBhcnNlX2xpbmUiLCJyZXR2YWwiLCJ0bXAiLCJrdiIsImVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSIsImFyZ3MiLCJvcHRpb25zIiwiZXh0ZW5kIiwiY3JlYXRpbmciLCJsYWJlbCIsIiRibG9jayIsImNuIiwiZmluZCIsImRlc2MiLCJzaHJkIiwibG9naW5fc3RhdHVzIiwibG9nZ2VkX2luIiwiYXBwZW5kVG8iLCIkaGlkZGVuIiwiY2xvbmUiLCJpaWQiLCIkZGlhbG9nIiwiYm9vdGJveCIsImRpYWxvZyIsImNhbGxiYWNrIiwiY2hlY2tWYWxpZGl0eSIsInJlcG9ydFZhbGlkaXR5Iiwic3VibWl0X3Bvc3QiLCJlYWNoIiwiJHRoaXMiLCIkY291bnQiLCJsaW1pdCIsImJpbmQiLCJwYXJhbXMiLCJwYWdlIiwiaWQiLCJhamF4IiwiZG9uZSIsImFkZF9pdGVtX3RvX2NvbGxpc3QiLCJmYWlsIiwianFYSFIiLCJ0ZXh0U3RhdHVzIiwiZXJyb3JUaHJvd24iLCIkdWwiLCJjb2xsX2hyZWYiLCJjb2xsX2lkIiwiJGEiLCJjb2xsX25hbWUiLCJhcHBlbmQiLCIkb3B0aW9uIiwiY29uZmlybV9sYXJnZSIsImNvbGxTaXplIiwiYWRkTnVtSXRlbXMiLCJudW1TdHIiLCJjb25maXJtIiwiYW5zd2VyIiwiY2xpY2siLCJwcmV2ZW50RGVmYXVsdCIsImFjdGlvbiIsInNlbGVjdGVkX2NvbGxlY3Rpb25faWQiLCJzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUiLCJjMiIsImlzIiwiY3Jtc19zdGF0ZSIsImhyZWYiLCIkZGl2IiwiJHAiLCIkbGluayIsIkRvd25sb2FkZXIiLCJpbml0IiwicGRmIiwic3RhcnQiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImh0bWwiLCJhbGVydCIsInNyYyIsIml0ZW1fdGl0bGUiLCJoZWFkZXIiLCJ0b3RhbCIsInN1ZmZpeCIsImNsb3NlTW9kYWwiLCJkYXRhVHlwZSIsImNhY2hlIiwiZXJyb3IiLCJyZXEiLCJzdGF0dXMiLCJkaXNwbGF5V2FybmluZyIsImRpc3BsYXlFcnJvciIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsImNzcyIsIndpZHRoIiwiZG93bmxvYWRfa2V5IiwibmF2aWdhdG9yIiwidXNlckFnZW50IiwiJGRvd25sb2FkX2J0biIsIm9uIiwidHJpZ2dlciIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJFT1QiLCJkb3dubG9hZGVyIiwiY3JlYXRlIiwicHJpbnRhYmxlIiwiX2dldFBhZ2VTZWxlY3Rpb24iLCJidXR0b25zIiwic2VxIiwiX2dldEZsYXR0ZW5lZFNlbGVjdGlvbiIsInNpZGVfc2hvcnQiLCJzaWRlX2xvbmciLCJodElkIiwiZW1iZWRIZWxwTGluayIsImNvZGVibG9ja190eHQiLCJjb2RlYmxvY2tfdHh0X2EiLCJ3IiwiaCIsImNvZGVibG9ja190eHRfYiIsImNsb3Nlc3QiLCJ0ZXh0YXJlYSIsInNlbGVjdCIsImZlZWRiYWNrIiwiJGZvcm0iLCJSZWNvcmRVUkwiLCIkZW1haWwiLCJpbml0ZWQiLCIkaW5wdXQiLCIkaW5wdXRfbGFiZWwiLCIkc2VsZWN0IiwiJHNlYXJjaF90YXJnZXQiLCIkZnQiLCIkYmFja2Ryb3AiLCIkYWN0aW9uIiwib25TaG93IiwibW9kYWwiLCJfc2V0dXAiLCJscyIsImNhdGFsb2ciLCJ0YXJnZXQiLCJwcmVmcyIsInNlYXJjaCIsImZ0IiwidmFsdWUiLCJhbmFseXRpY3MiLCJ0cmFja0V2ZW50IiwiY2F0ZWdvcnkiLCJzdWJtaXQiLCJldmVudCIsInNlYXJjaHR5cGUiLCJnZXRDb250ZW50R3JvdXBEYXRhIiwiY29udGVudF9ncm91cCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiRElTTUlTU19FVkVOVCIsIiRtZW51cyIsIiRwb3B1cCIsIiRtZW51IiwibGlkeCIsIiRpdGVtIiwiJGl0ZW1zIiwic2VsZWN0ZWRfaWR4IiwiZGVsdGEiLCIkc2VsZWN0ZWQiLCIkc3VibWl0IiwiaGFzQ2xhc3MiLCJyZW1vdmVBdHRyIiwicHJlZml4IiwiY2xhc3NQcmVmaXgiLCJvcGVuQ2xhc3MiLCJpc0h0dHBzIiwic2VydmljZXMiLCJmYWNlYm9vayIsImNvdW50ZXJVcmwiLCJjb252ZXJ0TnVtYmVyIiwidG90YWxfY291bnQiLCJwb3B1cFVybCIsInBvcHVwV2lkdGgiLCJwb3B1cEhlaWdodCIsInR3aXR0ZXIiLCJjb3VudCIsInRpdGxlIiwibWFpbHJ1Iiwic2hhcmVzIiwidmtvbnRha3RlIiwiY291bnRlciIsImpzb25VcmwiLCJkZWZlcnJlZCIsIl8iLCJWSyIsIlNoYXJlIiwiaWR4IiwicmVzb2x2ZSIsImdldFNjcmlwdCIsIm1ha2VVcmwiLCJyZWplY3QiLCJvZG5va2xhc3NuaWtpIiwiT0RLTCIsInVwZGF0ZUNvdW50IiwicGx1c29uZSIsImdwbHVzIiwiY2IiLCJwaW50ZXJlc3QiLCJ0dW1ibHIiLCJwb3B1cFVybDEiLCJwb3B1cFVybDIiLCJ3aWRnZXQiLCJyZWRkaXQiLCJzb2NpYWxMaW5rcyIsImluc3RhbmNlIiwiaXNQbGFpbk9iamVjdCIsInVwZGF0ZSIsImRlZmF1bHRzIiwiZGF0YVRvT3B0aW9ucyIsInBvc3RfdGl0bGUiLCJpbkFycmF5IiwicG9wIiwiaGFzaCIsImNvdW50ZXJzIiwiemVyb2VzIiwid2FpdCIsInBvcHVwQ2hlY2tJbnRlcnZhbCIsInNpbmdsZVRpdGxlIiwiY29udGFpbmVyIiwiaW5pdFVzZXJCdXR0b25zIiwiY2hpbGRyZW4iLCJwcm94eSIsImJ1dHRvbiIsIkJ1dHRvbiIsInVzZXJCdXR0b25Jbml0ZWQiLCJzb2NpYWxMaW5rc0J1dHRvbnMiLCJhcHBlYXIiLCJzaWxlbnQiLCJkZXRlY3RTZXJ2aWNlIiwic2VydmljZSIsImRldGVjdFBhcmFtcyIsImluaXRIdG1sIiwiaW5pdENvdW50ZXIiLCJmb3JjZVVwZGF0ZSIsIm5vZGUiLCJjbGFzc05hbWUiLCJjbGFzc0lkeCIsImNscyIsImlzTmFOIiwiY291bnRlck51bWJlciIsImNsaWNrVXJsIiwiY2xvbmVEYXRhQXR0cnMiLCJyZXBsYWNlV2l0aCIsIl93aWRnZXQiLCJkYXRhc2V0Iiwicm9sZSIsIm1pY3JvdGlwUG9zaXRpb24iLCJtaWNyb3RpcFNpemUiLCJzb3VyY2UiLCJkZXN0aW5hdGlvbiIsImdldEVsZW1lbnRDbGFzc05hbWVzIiwidXBkYXRlQ291bnRlciIsImNvdW50ZXJFbGVtIiwicHJvY2VzcyIsImlzRnVuY3Rpb24iLCJjb250ZXh0IiwibWVkaWEiLCJhZGRBZGRpdGlvbmFsUGFyYW1zVG9VcmwiLCJvcGVuUG9wdXAiLCJoZWlnaHQiLCJpc0VtcHR5T2JqZWN0IiwiZ2x1ZSIsImxlZnQiLCJyb3VuZCIsInNjcmVlbiIsInRvcCIsIndpbiIsIm9wZW4iLCJjbG9zZWQiLCJ1cHBlciIsIm0iLCJ0b1VwcGVyIiwidGVtcGxhdGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ0bXBsIiwiZmlsdGVyIiwibW9kIiwiY2xvc2VPbkNsaWNrIiwiaGFuZGxlciIsIndoaWNoIiwiZG9jIiwib2ZmIiwiZXZlbnRzIiwic2hvd0luVmlld3BvcnQiLCJvZmZzZXQiLCJkb2N1bWVudEVsZW1lbnQiLCJnZXRCb3VuZGluZ0NsaWVudFJlY3QiLCJyZWN0IiwicmlnaHQiLCJpbm5lcldpZHRoIiwiYm90dG9tIiwiaW5uZXJIZWlnaHQiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7OztBQU9BLENBQUMsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ25CLEtBQUksT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJQUFnQ0EsT0FBT0MsR0FBM0MsRUFBZ0Q7QUFDL0M7QUFDQSxNQUFLLE9BQU9DLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENGLFVBQU8sQ0FBQyxRQUFELENBQVAsRUFBbUJELE9BQW5CO0FBQ0EsR0FGRCxNQUVPO0FBQ05DLFVBQU8sRUFBUCxFQUFXRCxPQUFYO0FBQ0E7QUFDRCxFQVBELE1BT087QUFDTjtBQUNBLE1BQUssT0FBT0csTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0gsV0FBUUcsTUFBUjtBQUNBLEdBRkQsTUFFTztBQUNOSDtBQUNBO0FBQ0Q7QUFDRCxDQWhCQSxFQWdCRSxVQUFTSSxDQUFULEVBQVlDLFNBQVosRUFB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QVNHLEtBQUt0QixHQUFkLEdBQW9CQSxHQUFwQyxFQURKLEtBRUssSUFBSXNCLEtBQUtHLE1BQUwsR0FBY25iLE9BQU9vYixXQUFQLEdBQXFCUCxNQUF2QyxFQUNEOVgsS0FBS3lLLEdBQUwsQ0FBUyxLQUFULEVBQWdCeE4sT0FBT29iLFdBQVAsR0FBcUJKLEtBQUtHLE1BQTFCLEdBQW1DTixNQUFuQyxHQUE0Q25CLEdBQTVEO0FBQ1A7QUFDRDNXLGFBQUs2SCxRQUFMLENBQWN5SSxTQUFkO0FBQ0g7O0FBR0Q7OztBQUdBMVksTUFBRSxZQUFXO0FBQ1RBLFVBQUUsTUFBTXdZLE1BQVIsRUFBZ0J5QyxXQUFoQjtBQUNILEtBRkQ7QUFJSCxDQTdnQkEsQ0FBRDs7O0FDZEFuVixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLGNBQUYsRUFBa0JnUCxLQUFsQixDQUF3QixVQUFTMUssQ0FBVCxFQUFZO0FBQ2hDQSxVQUFFMkssY0FBRjtBQUNBbkMsZ0JBQVF5RCxLQUFSLENBQWMsb1lBQWQ7QUFDSCxLQUhEO0FBS0gsQ0FQRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBKUXVlcnkgVVJMIFBhcnNlciBwbHVnaW4sIHYyLjIuMVxuICogRGV2ZWxvcGVkIGFuZCBtYWludGFuaW5lZCBieSBNYXJrIFBlcmtpbnMsIG1hcmtAYWxsbWFya2VkdXAuY29tXG4gKiBTb3VyY2UgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyXG4gKiBMaWNlbnNlZCB1bmRlciBhbiBNSVQtc3R5bGUgbGljZW5zZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlci9ibG9iL21hc3Rlci9MSUNFTlNFIGZvciBkZXRhaWxzLlxuICovIFxuXG47KGZ1bmN0aW9uKGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRCBhdmFpbGFibGU7IHVzZSBhbm9ueW1vdXMgbW9kdWxlXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBObyBBTUQgYXZhaWxhYmxlOyBtdXRhdGUgZ2xvYmFsIHZhcnNcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZmFjdG9yeShqUXVlcnkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmYWN0b3J5KCk7XG5cdFx0fVxuXHR9XG59KShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblx0XG5cdHZhciB0YWcyYXR0ciA9IHtcblx0XHRcdGEgICAgICAgOiAnaHJlZicsXG5cdFx0XHRpbWcgICAgIDogJ3NyYycsXG5cdFx0XHRmb3JtICAgIDogJ2FjdGlvbicsXG5cdFx0XHRiYXNlICAgIDogJ2hyZWYnLFxuXHRcdFx0c2NyaXB0ICA6ICdzcmMnLFxuXHRcdFx0aWZyYW1lICA6ICdzcmMnLFxuXHRcdFx0bGluayAgICA6ICdocmVmJ1xuXHRcdH0sXG5cdFx0XG5cdFx0a2V5ID0gWydzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnZnJhZ21lbnQnXSwgLy8ga2V5cyBhdmFpbGFibGUgdG8gcXVlcnlcblx0XHRcblx0XHRhbGlhc2VzID0geyAnYW5jaG9yJyA6ICdmcmFnbWVudCcgfSwgLy8gYWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHlcblx0XHRcblx0XHRwYXJzZXIgPSB7XG5cdFx0XHRzdHJpY3QgOiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8sICAvL2xlc3MgaW50dWl0aXZlLCBtb3JlIGFjY3VyYXRlIHRvIHRoZSBzcGVjc1xuXHRcdFx0bG9vc2UgOiAgL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8gLy8gbW9yZSBpbnR1aXRpdmUsIGZhaWxzIG9uIHJlbGF0aXZlIHBhdGhzIGFuZCBkZXZpYXRlcyBmcm9tIHNwZWNzXG5cdFx0fSxcblx0XHRcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0XG5cdFx0aXNpbnQgPSAvXlswLTldKyQvO1xuXHRcblx0ZnVuY3Rpb24gcGFyc2VVcmkoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHR2YXIgc3RyID0gZGVjb2RlVVJJKCB1cmwgKSxcblx0XHRyZXMgICA9IHBhcnNlclsgc3RyaWN0TW9kZSB8fCBmYWxzZSA/ICdzdHJpY3QnIDogJ2xvb3NlJyBdLmV4ZWMoIHN0ciApLFxuXHRcdHVyaSA9IHsgYXR0ciA6IHt9LCBwYXJhbSA6IHt9LCBzZWcgOiB7fSB9LFxuXHRcdGkgICA9IDE0O1xuXHRcdFxuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0dXJpLmF0dHJbIGtleVtpXSBdID0gcmVzW2ldIHx8ICcnO1xuXHRcdH1cblx0XHRcblx0XHQvLyBidWlsZCBxdWVyeSBhbmQgZnJhZ21lbnQgcGFyYW1ldGVyc1x0XHRcblx0XHR1cmkucGFyYW1bJ3F1ZXJ5J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsncXVlcnknXSk7XG5cdFx0dXJpLnBhcmFtWydmcmFnbWVudCddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ2ZyYWdtZW50J10pO1xuXHRcdFxuXHRcdC8vIHNwbGl0IHBhdGggYW5kIGZyYWdlbWVudCBpbnRvIHNlZ21lbnRzXHRcdFxuXHRcdHVyaS5zZWdbJ3BhdGgnXSA9IHVyaS5hdHRyLnBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTsgICAgIFxuXHRcdHVyaS5zZWdbJ2ZyYWdtZW50J10gPSB1cmkuYXR0ci5mcmFnbWVudC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpO1xuXHRcdFxuXHRcdC8vIGNvbXBpbGUgYSAnYmFzZScgZG9tYWluIGF0dHJpYnV0ZSAgICAgICAgXG5cdFx0dXJpLmF0dHJbJ2Jhc2UnXSA9IHVyaS5hdHRyLmhvc3QgPyAodXJpLmF0dHIucHJvdG9jb2wgPyAgdXJpLmF0dHIucHJvdG9jb2wrJzovLycrdXJpLmF0dHIuaG9zdCA6IHVyaS5hdHRyLmhvc3QpICsgKHVyaS5hdHRyLnBvcnQgPyAnOicrdXJpLmF0dHIucG9ydCA6ICcnKSA6ICcnOyAgICAgIFxuXHRcdCAgXG5cdFx0cmV0dXJuIHVyaTtcblx0fTtcblx0XG5cdGZ1bmN0aW9uIGdldEF0dHJOYW1lKCBlbG0gKSB7XG5cdFx0dmFyIHRuID0gZWxtLnRhZ05hbWU7XG5cdFx0aWYgKCB0eXBlb2YgdG4gIT09ICd1bmRlZmluZWQnICkgcmV0dXJuIHRhZzJhdHRyW3RuLnRvTG93ZXJDYXNlKCldO1xuXHRcdHJldHVybiB0bjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuXHRcdGlmIChwYXJlbnRba2V5XS5sZW5ndGggPT0gMCkgcmV0dXJuIHBhcmVudFtrZXldID0ge307XG5cdFx0dmFyIHQgPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHBhcmVudFtrZXldKSB0W2ldID0gcGFyZW50W2tleV1baV07XG5cdFx0cGFyZW50W2tleV0gPSB0O1xuXHRcdHJldHVybiB0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHR2YXIgcGFydCA9IHBhcnRzLnNoaWZ0KCk7XG5cdFx0aWYgKCFwYXJ0KSB7XG5cdFx0XHRpZiAoaXNBcnJheShwYXJlbnRba2V5XSkpIHtcblx0XHRcdFx0cGFyZW50W2tleV0ucHVzaCh2YWwpO1xuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2UgaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgb2JqID0gcGFyZW50W2tleV0gPSBwYXJlbnRba2V5XSB8fCBbXTtcblx0XHRcdGlmICgnXScgPT0gcGFydCkge1xuXHRcdFx0XHRpZiAoaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdFx0aWYgKCcnICE9IHZhbCkgb2JqLnB1c2godmFsKTtcblx0XHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqKSB7XG5cdFx0XHRcdFx0b2JqW2tleXMob2JqKS5sZW5ndGhdID0gdmFsO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9iaiA9IHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKH5wYXJ0LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0XHRwYXJ0ID0gcGFydC5zdWJzdHIoMCwgcGFydC5sZW5ndGggLSAxKTtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHRcdC8vIGtleVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbWVyZ2UocGFyZW50LCBrZXksIHZhbCkge1xuXHRcdGlmICh+a2V5LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0dmFyIHBhcnRzID0ga2V5LnNwbGl0KCdbJyksXG5cdFx0XHRsZW4gPSBwYXJ0cy5sZW5ndGgsXG5cdFx0XHRsYXN0ID0gbGVuIC0gMTtcblx0XHRcdHBhcnNlKHBhcnRzLCBwYXJlbnQsICdiYXNlJywgdmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFpc2ludC50ZXN0KGtleSkgJiYgaXNBcnJheShwYXJlbnQuYmFzZSkpIHtcblx0XHRcdFx0dmFyIHQgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgayBpbiBwYXJlbnQuYmFzZSkgdFtrXSA9IHBhcmVudC5iYXNlW2tdO1xuXHRcdFx0XHRwYXJlbnQuYmFzZSA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRzZXQocGFyZW50LmJhc2UsIGtleSwgdmFsKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuXHRcdHJldHVybiByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQoLyZ8Oy8pLCBmdW5jdGlvbihyZXQsIHBhaXIpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBhaXIgPSBkZWNvZGVVUklDb21wb25lbnQocGFpci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Ly8gaWdub3JlXG5cdFx0XHR9XG5cdFx0XHR2YXIgZXFsID0gcGFpci5pbmRleE9mKCc9JyksXG5cdFx0XHRcdGJyYWNlID0gbGFzdEJyYWNlSW5LZXkocGFpciksXG5cdFx0XHRcdGtleSA9IHBhaXIuc3Vic3RyKDAsIGJyYWNlIHx8IGVxbCksXG5cdFx0XHRcdHZhbCA9IHBhaXIuc3Vic3RyKGJyYWNlIHx8IGVxbCwgcGFpci5sZW5ndGgpLFxuXHRcdFx0XHR2YWwgPSB2YWwuc3Vic3RyKHZhbC5pbmRleE9mKCc9JykgKyAxLCB2YWwubGVuZ3RoKTtcblxuXHRcdFx0aWYgKCcnID09IGtleSkga2V5ID0gcGFpciwgdmFsID0gJyc7XG5cblx0XHRcdHJldHVybiBtZXJnZShyZXQsIGtleSwgdmFsKTtcblx0XHR9LCB7IGJhc2U6IHt9IH0pLmJhc2U7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG5cdFx0dmFyIHYgPSBvYmpba2V5XTtcblx0XHRpZiAodW5kZWZpbmVkID09PSB2KSB7XG5cdFx0XHRvYmpba2V5XSA9IHZhbDtcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkodikpIHtcblx0XHRcdHYucHVzaCh2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvYmpba2V5XSA9IFt2LCB2YWxdO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gbGFzdEJyYWNlSW5LZXkoc3RyKSB7XG5cdFx0dmFyIGxlbiA9IHN0ci5sZW5ndGgsXG5cdFx0XHQgYnJhY2UsIGM7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHRcdFx0YyA9IHN0cltpXTtcblx0XHRcdGlmICgnXScgPT0gYykgYnJhY2UgPSBmYWxzZTtcblx0XHRcdGlmICgnWycgPT0gYykgYnJhY2UgPSB0cnVlO1xuXHRcdFx0aWYgKCc9JyA9PSBjICYmICFicmFjZSkgcmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiByZWR1Y2Uob2JqLCBhY2N1bXVsYXRvcil7XG5cdFx0dmFyIGkgPSAwLFxuXHRcdFx0bCA9IG9iai5sZW5ndGggPj4gMCxcblx0XHRcdGN1cnIgPSBhcmd1bWVudHNbMl07XG5cdFx0d2hpbGUgKGkgPCBsKSB7XG5cdFx0XHRpZiAoaSBpbiBvYmopIGN1cnIgPSBhY2N1bXVsYXRvci5jYWxsKHVuZGVmaW5lZCwgY3Vyciwgb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0KytpO1xuXHRcdH1cblx0XHRyZXR1cm4gY3Vycjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gaXNBcnJheSh2QXJnKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2QXJnKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBrZXlzKG9iaikge1xuXHRcdHZhciBrZXlzID0gW107XG5cdFx0Zm9yICggcHJvcCBpbiBvYmogKSB7XG5cdFx0XHRpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSApIGtleXMucHVzaChwcm9wKTtcblx0XHR9XG5cdFx0cmV0dXJuIGtleXM7XG5cdH1cblx0XHRcblx0ZnVuY3Rpb24gcHVybCggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB1cmwgPT09IHRydWUgKSB7XG5cdFx0XHRzdHJpY3RNb2RlID0gdHJ1ZTtcblx0XHRcdHVybCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0c3RyaWN0TW9kZSA9IHN0cmljdE1vZGUgfHwgZmFsc2U7XG5cdFx0dXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuXHRcblx0XHRyZXR1cm4ge1xuXHRcdFx0XG5cdFx0XHRkYXRhIDogcGFyc2VVcmkodXJsLCBzdHJpY3RNb2RlKSxcblx0XHRcdFxuXHRcdFx0Ly8gZ2V0IHZhcmlvdXMgYXR0cmlidXRlcyBmcm9tIHRoZSBVUklcblx0XHRcdGF0dHIgOiBmdW5jdGlvbiggYXR0ciApIHtcblx0XHRcdFx0YXR0ciA9IGFsaWFzZXNbYXR0cl0gfHwgYXR0cjtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBhdHRyICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5hdHRyW2F0dHJdIDogdGhpcy5kYXRhLmF0dHI7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcblx0XHRcdHBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5xdWVyeVtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0ucXVlcnk7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgcGFyYW1ldGVyc1xuXHRcdFx0ZnBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudFtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnQ7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcGF0aCBzZWdtZW50c1xuXHRcdFx0c2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5wYXRoLmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGhbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgc2VnbWVudHNcblx0XHRcdGZzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudDsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLmZyYWdtZW50Lmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50W3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHQgICAgXHRcblx0XHR9O1xuXHRcblx0fTtcblx0XG5cdGlmICggdHlwZW9mICQgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFxuXHRcdCQuZm4udXJsID0gZnVuY3Rpb24oIHN0cmljdE1vZGUgKSB7XG5cdFx0XHR2YXIgdXJsID0gJyc7XG5cdFx0XHRpZiAoIHRoaXMubGVuZ3RoICkge1xuXHRcdFx0XHR1cmwgPSAkKHRoaXMpLmF0dHIoIGdldEF0dHJOYW1lKHRoaXNbMF0pICkgfHwgJyc7XG5cdFx0XHR9ICAgIFxuXHRcdFx0cmV0dXJuIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApO1xuXHRcdH07XG5cdFx0XG5cdFx0JC51cmwgPSBwdXJsO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5wdXJsID0gcHVybDtcblx0fVxuXG59KTtcblxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIHZhciAkc3RhdHVzID0gJChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgdmFyIGxhc3RNZXNzYWdlOyB2YXIgbGFzdFRpbWVyO1xuICBIVC51cGRhdGVfc3RhdHVzID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgaWYgKCBsYXN0TWVzc2FnZSAhPSBtZXNzYWdlICkge1xuICAgICAgICBpZiAoIGxhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KGxhc3RUaW1lcik7IGxhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0gc3RhdHVzOlwiLCBtZXNzYWdlKTtcbiAgICAgICAgfSwgNTApO1xuICAgICAgICBsYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgfVxuICB9XG5cbn0pIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4yLjIwMTcxMjEwXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmIChcblx0ICAgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TXG5cdCYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSlcbikge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgYmUgZW1wdHkuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0cmV0dXJuIH5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4gKyBcIlwiKTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmICghfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikpIHtcblx0XHRcdHRoaXMucHVzaCh0b2tlbik7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0XHQsIGluZGV4XG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0d2hpbGUgKH5pbmRleCkge1xuXHRcdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHR2YXIgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodG9rZW4gKyBcIlwiKTtcblx0aWYgKH5pbmRleCkge1xuXHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxLCByZXBsYWNlbWVudF90b2tlbik7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn1cbmNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbn07XG5cbmlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcblx0dmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuXHRcdCAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcblx0XHQsIGVudW1lcmFibGU6IHRydWVcblx0XHQsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHR9O1xuXHR0cnkge1xuXHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0fSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG5cdFx0Ly8gYWRkaW5nIHVuZGVmaW5lZCB0byBmaWdodCB0aGlzIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9pc3N1ZXMvMzZcblx0XHQvLyBtb2Rlcm5pZSBJRTgtTVNXNyBtYWNoaW5lIGhhcyBJRTggOC4wLjYwMDEuMTg3MDIgYW5kIGlzIGFmZmVjdGVkXG5cdFx0aWYgKGV4Lm51bWJlciA9PT0gdW5kZWZpbmVkIHx8IGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcblx0XHRcdGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcblx0XHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0XHR9XG5cdH1cbn0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuXHRlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xufVxuXG59KHNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdC8vIHJlcGxhY2UoKSBwb2x5ZmlsbFxuXHRpZiAoIShcInJlcGxhY2VcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKS5jbGFzc0xpc3QpKSB7XG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdG9rZW5zID0gdGhpcy50b1N0cmluZygpLnNwbGl0KFwiIFwiKVxuXHRcdFx0XHQsIGluZGV4ID0gdG9rZW5zLmluZGV4T2YodG9rZW4gKyBcIlwiKVxuXHRcdFx0O1xuXHRcdFx0aWYgKH5pbmRleCkge1xuXHRcdFx0XHR0b2tlbnMgPSB0b2tlbnMuc2xpY2UoaW5kZXgpO1xuXHRcdFx0XHR0aGlzLnJlbW92ZS5hcHBseSh0aGlzLCB0b2tlbnMpO1xuXHRcdFx0XHR0aGlzLmFkZChyZXBsYWNlbWVudF90b2tlbik7XG5cdFx0XHRcdHRoaXMuYWRkLmFwcGx5KHRoaXMsIHRva2Vucy5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG5cbiAgICAgICAgJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgaXRlbSB0byBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX1gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJChcImFbZGF0YS10b2dnbGUqPWRvd25sb2FkXVwiKS5hZGRDbGFzcyhcImludGVyYWN0aXZlXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGJvb3Rib3guaGlkZUFsbCgpO1xuICAgICAgICAgICAgaWYgKCAkKHRoaXMpLmF0dHIoXCJyZWxcIikgPT0gJ2FsbG93JyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbXMuZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSA9PSBudWxsICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5kb3dubG9hZFBkZih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsYWluUGRmQWNjZXNzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgfSxcblxuICAgIGV4cGxhaW5QZGZBY2Nlc3M6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkKFwiI25vRG93bmxvYWRBY2Nlc3NcIikuaHRtbCgpO1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7RE9XTkxPQURfTElOS30nLCAkKHRoaXMpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgdGhpcy4kZGlhbG9nID0gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgLy8gdGhpcy4kZGlhbG9nLmFkZENsYXNzKFwibG9naW5cIik7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi4kbGluayA9ICQobGluayk7XG4gICAgICAgIHNlbGYuc3JjID0gJChsaW5rKS5hdHRyKCdocmVmJyk7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9ICQobGluaykuZGF0YSgndGl0bGUnKSB8fCAnUERGJztcblxuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgncmFuZ2UnKSA9PSAneWVzJyApIHtcbiAgICAgICAgICAgIGlmICggISBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgIC8vICc8cD5CdWlsZGluZyB5b3VyIFBERi4uLjwvcD4nICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiaW5pdGlhbFwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjxwPlNldHRpbmcgdXAgdGhlIGRvd25sb2FkLi4uPC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIC8vICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtc3VjY2VzcyBkb25lIGhpZGVcIj4nICtcbiAgICAgICAgICAgIC8vICAgICAnPHA+QWxsIGRvbmUhPC9wPicgK1xuICAgICAgICAgICAgLy8gJzwvZGl2PicgKyBcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFRpbWVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5XaGF0IGFmZmVjdHMgdGhlIGRvd25sb2FkIHNwZWVkPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcycsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICB2YXIgZG93bmxvYWRfa2V5ID0gbmF2aWdhdG9yLnVzZXJBZ2VudC5pbmRleE9mKCdNYWMgT1MgWCcpICE9IC0xID8gJ1JFVFVSTicgOiAnRU5URVInO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5odG1sKGA8cD5BbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiA8c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPlNlbGVjdCAke2Rvd25sb2FkX2tleX0gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBQcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuYCk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikudGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0gKCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkKS5gKTtcbiAgICAgICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgb2YgdGhlICR7c2VsZi5pdGVtX3RpdGxlfSBoYXMgYmVlbiBidWlsdC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi50aW1lcik7XG4gICAgICAgICAgICBzZWxmLnRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwbGF5V2FybmluZzogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBwYXJzZUludChyZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtVW50aWxFcG9jaCcpKTtcbiAgICAgICAgdmFyIHJhdGUgPSByZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtUmF0ZScpXG5cbiAgICAgICAgaWYgKCB0aW1lb3V0IDw9IDUgKSB7XG4gICAgICAgICAgICAvLyBqdXN0IHB1bnQgYW5kIHdhaXQgaXQgb3V0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuICAgICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aW1lb3V0ICo9IDEwMDA7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIGNvdW50ZG93biA9ICggTWF0aC5jZWlsKCh0aW1lb3V0IC0gbm93KSAvIDEwMDApIClcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgKCc8ZGl2PicgK1xuICAgICAgICAgICAgJzxwPllvdSBoYXZlIGV4Y2VlZGVkIHRoZSBkb3dubG9hZCByYXRlIG9mIHtyYXRlfS4gWW91IG1heSBwcm9jZWVkIGluIDxzcGFuIGlkPVwidGhyb3R0bGUtdGltZW91dFwiPntjb3VudGRvd259PC9zcGFuPiBzZWNvbmRzLjwvcD4nICtcbiAgICAgICAgICAgICc8cD5Eb3dubG9hZCBsaW1pdHMgcHJvdGVjdCBIYXRoaVRydXN0IHJlc291cmNlcyBmcm9tIGFidXNlIGFuZCBoZWxwIGVuc3VyZSBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZSBmb3IgZXZlcnlvbmUuPC9wPicgK1xuICAgICAgICAgICc8L2Rpdj4nKS5yZXBsYWNlKCd7cmF0ZX0nLCByYXRlKS5yZXBsYWNlKCd7Y291bnRkb3dufScsIGNvdW50ZG93bik7XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1wcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcblxuICAgICAgICBzZWxmLmNvdW50ZG93bl90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb3VudGRvd24gLT0gMTtcbiAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIjdGhyb3R0bGUtdGltZW91dFwiKS50ZXh0KGNvdW50ZG93bik7XG4gICAgICAgICAgICAgIGlmICggY291bnRkb3duID09IDAgKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUSUMgVE9DXCIsIGNvdW50ZG93bik7XG4gICAgICAgIH0sIDEwMDApO1xuXG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9jZXNzRXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArIFxuICAgICAgICAgICAgICAgICdVbmZvcnR1bmF0ZWx5LCB0aGUgcHJvY2VzcyBmb3IgY3JlYXRpbmcgeW91ciBQREYgaGFzIGJlZW4gaW50ZXJydXB0ZWQuICcgKyBcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNsaWNrIFwiT0tcIiBhbmQgdHJ5IGFnYWluLicgKyBcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ0lmIHRoaXMgcHJvYmxlbSBwZXJzaXN0cyBhbmQgeW91IGFyZSB1bmFibGUgdG8gZG93bmxvYWQgdGhpcyBQREYgYWZ0ZXIgcmVwZWF0ZWQgYXR0ZW1wdHMsICcgKyBcbiAgICAgICAgICAgICAgICAncGxlYXNlIG5vdGlmeSB1cyBhdCA8YSBocmVmPVwiL2NnaS9mZWVkYmFjay8/cGFnZT1mb3JtXCIgZGF0YT1tPVwicHRcIiBkYXRhLXRvZ2dsZT1cImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiU2hvdyBGZWVkYmFja1wiPmZlZWRiYWNrQGlzc3Vlcy5oYXRoaXRydXN0Lm9yZzwvYT4gJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBpbmNsdWRlIHRoZSBVUkwgb2YgdGhlIGJvb2sgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY2VzcyB3aGVuIHRoZSBwcm9ibGVtIG9jY3VycmVkLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYSBwcm9ibGVtIGJ1aWxkaW5nIHlvdXIgJyArIHRoaXMuaXRlbV90aXRsZSArICc7IHN0YWZmIGhhdmUgYmVlbiBub3RpZmllZC4nICtcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gaW4gMjQgaG91cnMuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBsb2dFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJC5nZXQoc2VsZi5zcmMgKyAnO251bV9hdHRlbXB0cz0nICsgc2VsZi5udW1fYXR0ZW1wdHMpO1xuICAgIH0sXG5cblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBhbmQgZG8gdGhpcyBoZXJlXG4gICAgJChcIiNzZWxlY3RlZFBhZ2VzUGRmTGlua1wiKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuXG4gICAgICAgIGlmICggcHJpbnRhYmxlLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gcHJpbnQuPC9wPlwiIF07XG4gICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGFwcGVhciBpbiB0aGUgc2VsZWN0aW9uIGNvbnRlbnRzIDxidXR0b24gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6ICM2NjY7IGJvcmRlci1jb2xvcjogI2VlZVxcXCIgY2xhc3M9XFxcImJ0biBzcXVhcmVcXFwiPjxpIGNsYXNzPVxcXCJpY29tb29uIGljb21vb24tcGFwZXJzXFxcIiBzdHlsZT1cXFwiY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDE0cHg7XFxcIiAvPjwvYnV0dG9uPlwiKTtcblxuICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiT0tcIixcbiAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBib290Ym94LmRpYWxvZyhtc2csIGJ1dHRvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHByaW50YWJsZSk7XG5cbiAgICAgICAgJCh0aGlzKS5kYXRhKCdzZXEnLCBzZXEpO1xuICAgICAgICBIVC5kb3dubG9hZGVyLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgIH0pO1xuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHQ7XG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vaycgK1xuICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj5IZWxwPC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5XCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIiBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgaW5pdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuICAgICRmb3JtLmF0dHIoJ2FjdGlvbicsICcvcHQvc2VhcmNoX2NvbXBsZXRlLmh0bWwnKTtcblxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXQuc2VhcmNoLWlucHV0LXRleHRcIik7XG4gICAgdmFyICRpbnB1dF9sYWJlbCA9ICRmb3JtLmZpbmQoXCJsYWJlbFtmb3I9J3ExLWlucHV0J11cIik7XG4gICAgdmFyICRzZWxlY3QgPSAkZm9ybS5maW5kKFwiLmNvbnRyb2wtc2VhcmNodHlwZVwiKTtcbiAgICB2YXIgJHNlYXJjaF90YXJnZXQgPSAkZm9ybS5maW5kKFwiLnNlYXJjaC10YXJnZXRcIik7XG4gICAgdmFyICRmdCA9ICRmb3JtLmZpbmQoXCJzcGFuLmZ1bmt5LWZ1bGwtdmlld1wiKTtcblxuICAgIHZhciAkYmFja2Ryb3AgPSBudWxsO1xuXG4gICAgdmFyICRhY3Rpb24gPSAkKFwiI2FjdGlvbi1zZWFyY2gtaGF0aGl0cnVzdFwiKTtcbiAgICAkYWN0aW9uLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgICAgICBib290Ym94LnNob3coJ3NlYXJjaC1tb2RhbCcsIHtcbiAgICAgICAgICAgIG9uU2hvdzogZnVuY3Rpb24obW9kYWwpIHtcbiAgICAgICAgICAgICAgICAkaW5wdXQuZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSlcblxuICAgIHZhciBfc2V0dXAgPSB7fTtcbiAgICBfc2V0dXAubHMgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5oaWRlKCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgb3Igd2l0aGluIHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGZ1bGwtdGV4dCBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGZ1bGwtdGV4dCBpbmRleC5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBfc2V0dXAuY2F0YWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LnNob3coKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBjYXRhbG9nIGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgY2F0YWxvZyBpbmRleDsgeW91IGNhbiBsaW1pdCB5b3VyIHNlYXJjaCB0byBhIHNlbGVjdGlvbiBvZiBmaWVsZHMuXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgdmFyIHRhcmdldCA9ICRzZWFyY2hfdGFyZ2V0LmZpbmQoXCJpbnB1dDpjaGVja2VkXCIpLnZhbCgpO1xuICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgaW5pdGVkID0gdHJ1ZTtcblxuICAgIHZhciBwcmVmcyA9IEhULnByZWZzLmdldCgpO1xuICAgIGlmICggcHJlZnMuc2VhcmNoICYmIHByZWZzLnNlYXJjaC5mdCApIHtcbiAgICAgICAgJChcImlucHV0W25hbWU9ZnRdXCIpLmF0dHIoJ2NoZWNrZWQnLCAnY2hlY2tlZCcpO1xuICAgIH1cblxuICAgICRzZWFyY2hfdGFyZ2V0Lm9uKCdjaGFuZ2UnLCAnaW5wdXRbdHlwZT1cInJhZGlvXCJdJywgZnVuY3Rpb24oZSkge1xuICAgICAgICB2YXIgdGFyZ2V0ID0gdGhpcy52YWx1ZTtcbiAgICAgICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICAgICAgSFQuYW5hbHl0aWNzLnRyYWNrRXZlbnQoeyBsYWJlbCA6IFwiLVwiLCBjYXRlZ29yeSA6IFwiSFQgU2VhcmNoXCIsIGFjdGlvbiA6IHRhcmdldCB9KTtcbiAgICB9KVxuXG4gICAgLy8gJGZvcm0uZGVsZWdhdGUoJzppbnB1dCcsICdmb2N1cyBjaGFuZ2UnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiRk9DVVNJTkdcIiwgdGhpcyk7XG4gICAgLy8gICAgICRmb3JtLmFkZENsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgPT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcCA9ICQoJzxkaXYgY2xhc3M9XCJtb2RhbF9fb3ZlcmxheSBpbnZpc2libGVcIj48L2Rpdj4nKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICAgICAgfSk7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgJGJhY2tkcm9wLmFwcGVuZFRvKCQoXCJib2R5XCIpKS5zaG93KCk7XG4gICAgLy8gfSlcblxuICAgIC8vICQoXCJib2R5XCIpLm9uKCdmb2N1cycsICc6aW5wdXQsYScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAvLyAgICAgaWYgKCAhICR0aGlzLmNsb3Nlc3QoXCIubmF2LXNlYXJjaC1mb3JtXCIpLmxlbmd0aCApIHtcbiAgICAvLyAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9KTtcblxuICAgIC8vIHZhciBjbG9zZV9zZWFyY2hfZm9ybSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAkZm9ybS5yZW1vdmVDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wICE9IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuZGV0YWNoKCk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AuaGlkZSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfVxuXG4gICAgLy8gYWRkIGV2ZW50IGhhbmRsZXIgZm9yIHN1Ym1pdCB0byBjaGVjayBmb3IgZW1wdHkgcXVlcnkgb3IgYXN0ZXJpc2tcbiAgICAkZm9ybS5zdWJtaXQoZnVuY3Rpb24oZXZlbnQpXG4gICAgICAgICB7XG5cblxuICAgICAgICAgICAgaWYgKCAhIHRoaXMuY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgIHRoaXMucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgLy9jaGVjayBmb3IgYmxhbmsgb3Igc2luZ2xlIGFzdGVyaXNrXG4gICAgICAgICAgIHZhciAkaW5wdXQgPSAkKHRoaXMpLmZpbmQoXCJpbnB1dFtuYW1lPXExXVwiKTtcbiAgICAgICAgICAgdmFyIHF1ZXJ5ID0gJGlucHV0LnZhbCgpO1xuICAgICAgICAgICBxdWVyeSA9ICQudHJpbShxdWVyeSk7XG4gICAgICAgICAgIGlmIChxdWVyeSA9PT0gJycpXG4gICAgICAgICAgIHtcbiAgICAgICAgICAgICBhbGVydChcIlBsZWFzZSBlbnRlciBhIHNlYXJjaCB0ZXJtLlwiKTtcbiAgICAgICAgICAgICAkaW5wdXQudHJpZ2dlcignYmx1cicpO1xuICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgfVxuICAgICAgICAgICAvLyAvLyAqICBCaWxsIHNheXMgZ28gYWhlYWQgYW5kIGZvcndhcmQgYSBxdWVyeSB3aXRoIGFuIGFzdGVyaXNrICAgIyMjIyMjXG4gICAgICAgICAgIC8vIGVsc2UgaWYgKHF1ZXJ5ID09PSAnKicpXG4gICAgICAgICAgIC8vIHtcbiAgICAgICAgICAgLy8gICAvLyBjaGFuZ2UgcTEgdG8gYmxhbmtcbiAgICAgICAgICAgLy8gICAkKFwiI3ExLWlucHV0XCIpLnZhbChcIlwiKVxuICAgICAgICAgICAvLyAgICQoXCIuc2VhcmNoLWZvcm1cIikuc3VibWl0KCk7XG4gICAgICAgICAgIC8vIH1cbiAgICAgICAgICAgLy8gIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjKlxuICAgICAgICAgICBlbHNlXG4gICAgICAgICAgIHtcblxuICAgICAgICAgICAgLy8gc2F2ZSBsYXN0IHNldHRpbmdzXG4gICAgICAgICAgICB2YXIgc2VhcmNodHlwZSA9ICggdGFyZ2V0ID09ICdscycgKSA/ICdhbGwnIDogJHNlbGVjdC5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICAgICAgSFQucHJlZnMuc2V0KHsgc2VhcmNoIDogeyBmdCA6ICQoXCJpbnB1dFtuYW1lPWZ0XTpjaGVja2VkXCIpLmxlbmd0aCA+IDAsIHRhcmdldCA6IHRhcmdldCwgc2VhcmNodHlwZTogc2VhcmNodHlwZSB9fSlcblxuICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgIH1cblxuICAgICB9ICk7XG5cbn0pXG4iLCJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgSFQuYW5hbHl0aWNzLmdldENvbnRlbnRHcm91cERhdGEgPSBmdW5jdGlvbigpIHtcbiAgICAvLyBjaGVhdFxuICAgIHZhciBzdWZmaXggPSAnJztcbiAgICB2YXIgY29udGVudF9ncm91cCA9IDQ7XG4gICAgaWYgKCAkKFwiI3NlY3Rpb25cIikuZGF0YShcInZpZXdcIikgPT0gJ3Jlc3RyaWN0ZWQnICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDI7XG4gICAgICBzdWZmaXggPSAnI3Jlc3RyaWN0ZWQnO1xuICAgIH0gZWxzZSBpZiAoIHdpbmRvdy5sb2NhdGlvbi5ocmVmLmluZGV4T2YoXCJkZWJ1Zz1zdXBlclwiKSA+IC0xICkge1xuICAgICAgY29udGVudF9ncm91cCA9IDM7XG4gICAgICBzdWZmaXggPSAnI3N1cGVyJztcbiAgICB9XG4gICAgcmV0dXJuIHsgaW5kZXggOiBjb250ZW50X2dyb3VwLCB2YWx1ZSA6IEhULnBhcmFtcy5pZCArIHN1ZmZpeCB9O1xuXG4gIH1cblxuICBIVC5hbmFseXRpY3MuX3NpbXBsaWZ5UGFnZUhyZWYgPSBmdW5jdGlvbihocmVmKSB7XG4gICAgdmFyIHVybCA9ICQudXJsKGhyZWYpO1xuICAgIHZhciBuZXdfaHJlZiA9IHVybC5zZWdtZW50KCk7XG4gICAgbmV3X2hyZWYucHVzaCgkKFwiaHRtbFwiKS5kYXRhKCdjb250ZW50LXByb3ZpZGVyJykpO1xuICAgIG5ld19ocmVmLnB1c2godXJsLnBhcmFtKFwiaWRcIikpO1xuICAgIHZhciBxcyA9ICcnO1xuICAgIGlmICggbmV3X2hyZWYuaW5kZXhPZihcInNlYXJjaFwiKSA+IC0xICYmIHVybC5wYXJhbSgncTEnKSAgKSB7XG4gICAgICBxcyA9ICc/cTE9JyArIHVybC5wYXJhbSgncTEnKTtcbiAgICB9XG4gICAgbmV3X2hyZWYgPSBcIi9cIiArIG5ld19ocmVmLmpvaW4oXCIvXCIpICsgcXM7XG4gICAgcmV0dXJuIG5ld19ocmVmO1xuICB9XG5cbiAgSFQuYW5hbHl0aWNzLmdldFBhZ2VIcmVmID0gZnVuY3Rpb24oKSB7XG4gICAgcmV0dXJuIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZigpO1xuICB9XG5cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBESVNNSVNTX0VWRU5UID0gKHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgICAgICAgICAgICAgIHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnb250b3VjaHN0YXJ0JykpID9cbiAgICAgICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnIDogJ21vdXNlZG93bic7XG5cbiAgICB2YXIgJG1lbnVzID0gJChcIm5hdiA+IHVsID4gbGk6aGFzKHVsKVwiKTtcblxuICAgIHZhciB0b2dnbGUgPSBmdW5jdGlvbigkcG9wdXAsICRtZW51LCAkbGluaykge1xuICAgICAgICBpZiAoICRwb3B1cC5kYXRhKCdzdGF0ZScpID09ICdvcGVuJyApIHtcbiAgICAgICAgICAgICRtZW51LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJHBvcHVwLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgICAgICAgICRsaW5rLmZvY3VzKCk7XG4gICAgICAgICAgICAkcG9wdXAuZGF0YSgnc3RhdGUnLCAnY2xvc2VkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbWVudS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICRwb3B1cC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgICAgICAgICAgJHBvcHVwLmRhdGEoJ3N0YXRlJywgJ29wZW4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRtZW51cy5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHZhciAkbWVudSA9ICQodGhpcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBXVVRcIiwgJG1lbnUpO1xuICAgICAgICAkbWVudS5maW5kKFwibGlcIikuZWFjaChmdW5jdGlvbihsaWR4KSB7XG4gICAgICAgICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgJGl0ZW0uYXR0cignYXJpYS1yb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuICAgICAgICAgICAgJGl0ZW0uZmluZChcImFcIikuYXR0cignYXJpYS1yb2xlJywgJ21lbnVpdGVtJyk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyICRsaW5rID0gJG1lbnUuZmluZChcIj4gYVwiKTtcbiAgICAgICAgdmFyICRwb3B1cCA9ICRtZW51LmZpbmQoXCJ1bFwiKTtcbiAgICAgICAgdmFyICRpdGVtcyA9ICRwb3B1cC5maW5kKFwiYVwiKTtcbiAgICAgICAgJGxpbmsub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRvZ2dsZSgkcG9wdXAsICRtZW51LCAkbGluayk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4JywgLTEpO1xuICAgICAgICAkbWVudS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGV2ZW50LmNvZGU7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRfaWR4ID0gJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jyk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSAwO1xuICAgICAgICAgICAgaWYgKCBjb2RlID09ICdBcnJvd0Rvd24nICkge1xuICAgICAgICAgICAgICAgIGRlbHRhID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNvZGUgPT0gJ0Fycm93VXAnICkge1xuICAgICAgICAgICAgICAgIGRlbHRhID0gLTE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBjb2RlID09ICdFc2NhcGUnICkge1xuICAgICAgICAgICAgICAgIHRvZ2dsZSgkcG9wdXAsICRtZW51LCAkbGluayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKSB7IGNvbnNvbGUubG9nKFwiQUhPWSBLRVlDT0RFXCIsIGNvZGUpOyByZXR1cm4gOyB9XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHNlbGVjdGVkX2lkeCA9ICggc2VsZWN0ZWRfaWR4ICsgZGVsdGEgKSAlICRpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgTUVOVSBLRVlET1dOXCIsIHNlbGVjdGVkX2lkeCk7XG4gICAgICAgICAgICAkc2VsZWN0ZWQgPSAkaXRlbXMuc2xpY2Uoc2VsZWN0ZWRfaWR4LCBzZWxlY3RlZF9pZHggKyAxKTtcbiAgICAgICAgICAgICRzZWxlY3RlZC5mb2N1cygpO1xuICAgICAgICAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jywgc2VsZWN0ZWRfaWR4KTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG5cbiAgICAvLyAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCAtMSk7XG4gICAgLy8gJG1lbnUub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICAkbWVudS5maW5kKFwiPiBhXCIpLmdldCgwKS5kYXRhc2V0LmV4cGFuZGVkID0gdHJ1ZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51LnByZXYoKS5maW5kKFwiPiBhXCIpLm9uKCdmb2N1c2luJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51LmZpbmQoXCJ1bCA+IGxpID4gYTpsYXN0XCIpLm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICAgdmFyIGNvZGUgPSBldmVudC5jb2RlO1xuICAgIC8vICAgICB2YXIgJGl0ZW1zID0gJG1lbnUuZmluZChcInVsID4gbGkgPiBhXCIpO1xuICAgIC8vICAgICB2YXIgc2VsZWN0ZWRfaWR4ID0gJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jyk7XG4gICAgLy8gICAgIHZhciBkZWx0YSA9IDA7XG4gICAgLy8gICAgIGlmICggY29kZSA9PSAnQXJyb3dEb3duJyApIHtcbiAgICAvLyAgICAgICAgIGRlbHRhID0gMTtcbiAgICAvLyAgICAgfSBlbHNlIGlmICggY29kZSA9PSAnQXJyb3dVcCcgKSB7XG4gICAgLy8gICAgICAgICBkZWx0YSA9IC0xO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGlmICggZGVsdGEgPT0gMCApIHsgcmV0dXJuIDsgfVxuICAgIC8vICAgICBzZWxlY3RlZF9pZHggPSAoIHNlbGVjdGVkX2lkeCArIGRlbHRhICkgJSAkaXRlbXMubGVuZ3RoO1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkFIT1kgTUVOVSBLRVlET1dOXCIsIHNlbGVjdGVkX2lkeCk7XG4gICAgLy8gICAgICRzZWxlY3RlZCA9ICRpdGVtcy5zbGljZShzZWxlY3RlZF9pZHgsIHNlbGVjdGVkX2lkeCArIDEpO1xuICAgIC8vICAgICAkc2VsZWN0ZWQuZm9jdXMoKTtcbiAgICAvLyAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jywgc2VsZWN0ZWRfaWR4KTtcbiAgICAvLyB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgJGZvcm0gPSAkKHRoaXMpO1xuICAgIHZhciAkc3VibWl0ID0gJGZvcm0uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XVwiKVxuICAgIGlmICggISAkLnRyaW0oJGlucHV0LnZhbCgpKSApIHtcbiAgICAgIGJvb3Rib3guYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSB0ZXJtIGluIHRoZSBzZWFyY2ggYm94LlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJHN1Ym1pdC5hZGRDbGFzcyhcImJ0bi1sb2FkaW5nXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICRzdWJtaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pXG59KTtcbiIsIi8qKlxuICogU29jaWFsIExpbmtzXG4gKiBJbnNwaXJlZCBieTogaHR0cDovL3NhcGVnaW4uZ2l0aHViLmNvbS9zb2NpYWwtbGlrZXNcbiAqXG4gKiBTaGFyaW5nIGJ1dHRvbnMgZm9yIFJ1c3NpYW4gYW5kIHdvcmxkd2lkZSBzb2NpYWwgbmV0d29ya3MuXG4gKlxuICogQHJlcXVpcmVzIGpRdWVyeVxuICogQGF1dGhvciBBcnRlbSBTYXBlZ2luXG4gKiBAY29weXJpZ2h0IDIwMTQgQXJ0ZW0gU2FwZWdpbiAoc2FwZWdpbi5tZSlcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbi8qZ2xvYmFsIGRlZmluZTpmYWxzZSwgc29jaWFsTGlua3NCdXR0b25zOmZhbHNlICovXG5cbihmdW5jdGlvbihmYWN0b3J5KSB7ICAvLyBUcnkgdG8gcmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIEFNRCBtb2R1bGVcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoalF1ZXJ5KTtcbiAgICB9XG59KGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHByZWZpeCA9ICdzb2NpYWwtbGlua3MnO1xuICAgIHZhciBjbGFzc1ByZWZpeCA9IHByZWZpeCArICdfXyc7XG4gICAgdmFyIG9wZW5DbGFzcyA9IHByZWZpeCArICdfb3BlbmVkJztcbiAgICB2YXIgcHJvdG9jb2wgPSBsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyAnaHR0cHM6JyA6ICdodHRwOic7XG4gICAgdmFyIGlzSHR0cHMgPSBwcm90b2NvbCA9PT0gJ2h0dHBzOic7XG5cblxuICAgIC8qKlxuICAgICAqIEJ1dHRvbnNcbiAgICAgKi9cbiAgICB2YXIgc2VydmljZXMgPSB7XG4gICAgICAgIGZhY2Vib29rOiB7XG4gICAgICAgICAgICBsYWJlbDogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVycy5mYWNlYm9vay5jb20vZG9jcy9yZWZlcmVuY2UvZnFsL2xpbmtfc3RhdC9cbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS9mcWw/cT1TRUxFQ1QrdG90YWxfY291bnQrRlJPTStsaW5rX3N0YXQrV0hFUkUrdXJsJTNEJTIye3VybH0lMjImY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuZGF0YVswXS50b3RhbF9jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA1MDBcbiAgICAgICAgfSxcbiAgICAgICAgdHdpdHRlcjoge1xuICAgICAgICAgICAgbGFiZWw6ICdUd2l0dGVyJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL2Nkbi5hcGkudHdpdHRlci5jb20vMS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dXJsPXt1cmx9JnRleHQ9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA0NTAsXG4gICAgICAgICAgICBjbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gQWRkIGNvbG9uIHRvIGltcHJvdmUgcmVhZGFiaWxpdHlcbiAgICAgICAgICAgICAgICBpZiAoIS9bXFwuXFw/OlxcLeKAk+KAlF1cXHMqJC8udGVzdCh0aGlzLm9wdGlvbnMudGl0bGUpKSB0aGlzLm9wdGlvbnMudGl0bGUgKz0gJzonO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtYWlscnU6IHtcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vY29ubmVjdC5tYWlsLnJ1L3NoYXJlX2NvdW50P3VybF9saXN0PXt1cmx9JmNhbGxiYWNrPTEmZnVuYz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB1cmwgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSh1cmwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVt1cmxdLnNoYXJlcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9jb25uZWN0Lm1haWwucnUvc2hhcmU/c2hhcmVfdXJsPXt1cmx9JnRpdGxlPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHZrb250YWt0ZToge1xuICAgICAgICAgICAgbGFiZWw6ICdWSycsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly92ay5jb20vc2hhcmUucGhwP2FjdD1jb3VudCZ1cmw9e3VybH0maW5kZXg9e2luZGV4fScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMudmtvbnRha3RlO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5WSykgd2luZG93LlZLID0ge307XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5WSy5TaGFyZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBmdW5jdGlvbihpZHgsIG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuX1tpZHhdLnJlc29sdmUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBvcHRpb25zLl8ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwsIHtpbmRleDogaW5kZXh9KSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy92ay5jb20vc2hhcmUucGhwP3VybD17dXJsfSZ0aXRsZT17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDMzMFxuICAgICAgICB9LFxuICAgICAgICBvZG5va2xhc3NuaWtpOiB7XG4gICAgICAgICAgICAvLyBIVFRQUyBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBpc0h0dHBzID8gdW5kZWZpbmVkIDogJ2h0dHA6Ly9jb25uZWN0Lm9rLnJ1L2RrP3N0LmNtZD1leHRMaWtlJnJlZj17dXJsfSZ1aWQ9e2luZGV4fScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMub2Rub2tsYXNzbmlraTtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuT0RLTCkgd2luZG93Lk9ES0wgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lk9ES0wudXBkYXRlQ291bnQgPSBmdW5jdGlvbihpZHgsIG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fW2lkeF0ucmVzb2x2ZShudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG9wdGlvbnMuXy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCwge2luZGV4OiBpbmRleH0pKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cDovL2Nvbm5lY3Qub2sucnUvZGs/c3QuY21kPVdpZGdldFNoYXJlUHJldmlldyZzZXJ2aWNlPW9kbm9rbGFzc25pa2kmc3Quc2hhcmVVcmw9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICBwbHVzb25lOiB7XG4gICAgICAgICAgICBsYWJlbDogJ0dvb2dsZSsnLFxuICAgICAgICAgICAgLy8gSFRUUFMgbm90IHN1cHBvcnRlZCB5ZXQ6IGh0dHA6Ly9jbHVicy55YS5ydS9zaGFyZS8xNDk5XG4gICAgICAgICAgICBjb3VudGVyVXJsOiBpc0h0dHBzID8gdW5kZWZpbmVkIDogJ2h0dHA6Ly9zaGFyZS55YW5kZXgucnUvZ3BwLnhtbD91cmw9e3VybH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLnBsdXNvbmU7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWplY3QgYWxsIGNvdW50ZXJzIGV4Y2VwdCB0aGUgZmlyc3QgYmVjYXVzZSBZYW5kZXggU2hhcmUgY291bnRlciBkb2VzbuKAmXQgcmV0dXJuIFVSTFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghd2luZG93LnNlcnZpY2VzKSB3aW5kb3cuc2VydmljZXMgPSB7fTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2VydmljZXMuZ3BsdXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNiOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtYmVyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fLnJlc29sdmUocGFyc2VJbnQobnVtYmVyLCAxMCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IGRlZmVycmVkO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT91cmw9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNzAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDUwMFxuICAgICAgICB9LFxuICAgICAgICBwaW50ZXJlc3Q6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnUGludGVyZXN0JyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYnV0dG9uLz91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgdHVtYmxyOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1R1bWJscicsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmwxOiBwcm90b2NvbCArICcvL3d3dy50dW1ibHIuY29tL3NoYXJlL2xpbms/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFVybDI6IHByb3RvY29sICsgJy8vd3d3LnR1bWJsci5jb20vc2hhcmUvcGhvdG8/c291cmNlPXttZWRpYX0mY2xpY2tfdGhydT17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvcHVwVXJsID0gdGhpcy5vcHRpb25zLnBvcHVwVXJsMjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9wdXBVcmwgPSB0aGlzLm9wdGlvbnMucG9wdXBVcmwxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB3aWxsIHN0aWxsIG5lZWQgdG8gY2hhbmdlIHRoZSBVUkwgc3RydWN0dXJlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICByZWRkaXQ6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnUmVkZGl0JyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9yZWRkaXQuY29tL3N1Ym1pdD91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgRU9UOiB0cnVlXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBwbHVnaW5cbiAgICAgKi9cbiAgICAkLmZuLnNvY2lhbExpbmtzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVsZW0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gZWxlbS5kYXRhKHByZWZpeCk7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLnVwZGF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IG5ldyBzb2NpYWxMaW5rcyhlbGVtLCAkLmV4dGVuZCh7fSwgJC5mbi5zb2NpYWxMaW5rcy5kZWZhdWx0cywgb3B0aW9ucywgZGF0YVRvT3B0aW9ucyhlbGVtKSkpO1xuICAgICAgICAgICAgICAgIGVsZW0uZGF0YShwcmVmaXgsIGluc3RhbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBwb3N0X3RpdGxlID0gZG9jdW1lbnQudGl0bGUuc3BsaXQoJyB8ICcpWzBdLnNwbGl0KCcgLSAnKTtcbiAgICBpZiAoICQuaW5BcnJheShwb3N0X3RpdGxlW3Bvc3RfdGl0bGUubGVuZ3RoIC0gMV0sIFsgJ0Z1bGwgVmlldycsICdMaW1pdGVkIFZpZXcnLCAnSXRlbSBOb3QgQXZhaWxhYmxlJyBdKSAhPT0gLTEgKSB7XG4gICAgICAgIHBvc3RfdGl0bGUucG9wKCk7XG4gICAgfVxuICAgIHBvc3RfdGl0bGUgPSBwb3N0X3RpdGxlLmpvaW4oXCIgLSBcIikgKyBcIiB8IEhhdGhpVHJ1c3RcIjtcbiAgICAkLmZuLnNvY2lhbExpbmtzLmRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLmhhc2gsICcnKS5yZXBsYWNlKC87L2csICcmJykucmVwbGFjZSgnL3NoY2dpLycsICcvY2dpLycpLFxuICAgICAgICBwb3N0X3RpdGxlOiBwb3N0X3RpdGxlLFxuICAgICAgICBjb3VudGVyczogdHJ1ZSxcbiAgICAgICAgemVyb2VzOiBmYWxzZSxcbiAgICAgICAgd2FpdDogNTAwLCAgLy8gU2hvdyBidXR0b25zIG9ubHkgYWZ0ZXIgY291bnRlcnMgYXJlIHJlYWR5IG9yIGFmdGVyIHRoaXMgYW1vdW50IG9mIHRpbWVcbiAgICAgICAgdGltZW91dDogMTAwMDAsICAvLyBTaG93IGNvdW50ZXJzIGFmdGVyIHRoaXMgYW1vdW50IG9mIHRpbWUgZXZlbiBpZiB0aGV5IGFyZW7igJl0IHJlYWR5XG4gICAgICAgIHBvcHVwQ2hlY2tJbnRlcnZhbDogNTAwLFxuICAgICAgICBzaW5nbGVUaXRsZTogJ1NoYXJlJ1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzb2NpYWxMaW5rcyhjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIHNvY2lhbExpbmtzLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZGQgY2xhc3MgaW4gY2FzZSBvZiBtYW51YWwgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCk7XG5cbiAgICAgICAgICAgIHRoaXMuaW5pdFVzZXJCdXR0b25zKCk7XG5cbiAgICAgICAgICAgIHZhciBidXR0b25zID0gdGhpcy5jb250YWluZXIuY2hpbGRyZW4oKTtcblxuICAgICAgICAgICAgdGhpcy5idXR0b25zID0gW107XG4gICAgICAgICAgICBidXR0b25zLmVhY2goJC5wcm94eShmdW5jdGlvbihpZHgsIGVsZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9uID0gbmV3IEJ1dHRvbigkKGVsZW0pLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKGJ1dHRvbik7XG4gICAgICAgICAgICB9LCB0aGlzKSk7XG5cbiAgICAgICAgfSxcbiAgICAgICAgaW5pdFVzZXJCdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy51c2VyQnV0dG9uSW5pdGVkICYmIHdpbmRvdy5zb2NpYWxMaW5rc0J1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlcywgc29jaWFsTGlua3NCdXR0b25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudXNlckJ1dHRvbkluaXRlZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXggKyAnX3Zpc2libGUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVhZHk6IGZ1bmN0aW9uKHNpbGVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4ICsgJ19yZWFkeScpO1xuICAgICAgICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci50cmlnZ2VyKCdyZWFkeS4nICsgcHJlZml4LCB0aGlzLm51bWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gQnV0dG9uKHdpZGdldCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmRldGVjdFNlcnZpY2UoKTtcbiAgICAgICAgaWYgKHRoaXMuc2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBCdXR0b24ucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0UGFyYW1zKCk7XG4gICAgICAgICAgICB0aGlzLmluaXRIdG1sKCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5pbml0Q291bnRlciwgdGhpcyksIDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCB7Zm9yY2VVcGRhdGU6IGZhbHNlfSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLndpZGdldC5maW5kKCcuJyArIHByZWZpeCArICdfX2NvdW50ZXInKS5yZW1vdmUoKTsgIC8vIFJlbW92ZSBvbGQgY291bnRlclxuICAgICAgICAgICAgdGhpcy5pbml0Q291bnRlcigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGVjdFNlcnZpY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlcnZpY2UgPSB0aGlzLndpZGdldC5kYXRhKCdzZXJ2aWNlJyk7XG4gICAgICAgICAgICBpZiAoIXNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBjbGFzcz1cImZhY2Vib29rXCJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMud2lkZ2V0WzBdO1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc2VzID0gbm9kZS5jbGFzc0xpc3QgfHwgbm9kZS5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjbGFzc0lkeCA9IDA7IGNsYXNzSWR4IDwgY2xhc3Nlcy5sZW5ndGg7IGNsYXNzSWR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNscyA9IGNsYXNzZXNbY2xhc3NJZHhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VydmljZXNbY2xzXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZSA9IGNscztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghc2VydmljZSkgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgICAgICQuZXh0ZW5kKHRoaXMub3B0aW9ucywgc2VydmljZXNbc2VydmljZV0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGVjdFBhcmFtczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMud2lkZ2V0LmRhdGEoKTtcblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgY291bnRlciBVUkwgb3IgbnVtYmVyXG4gICAgICAgICAgICBpZiAoZGF0YS5jb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KGRhdGEuY291bnRlciwgMTApO1xuICAgICAgICAgICAgICAgIGlmIChpc05hTihudW1iZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jb3VudGVyVXJsID0gZGF0YS5jb3VudGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvdW50ZXJOdW1iZXIgPSBudW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSB0aXRsZVxuICAgICAgICAgICAgaWYgKGRhdGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3N0X3RpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhLnRpdGxlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSBVUkxcbiAgICAgICAgICAgIGlmIChkYXRhLnVybCkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy51cmwgPSBkYXRhLnVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpbml0SHRtbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldDtcblxuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHdpZGdldDtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2xpY2tVcmwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gbWFrZVVybChvcHRpb25zLmNsaWNrVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy51cmwsXG4gICAgICAgICAgICAgICAgICAgIHBvc3RfdGl0bGU6IG9wdGlvbnMucG9zdF90aXRsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBsaW5rID0gJCgnPGE+Jywge1xuICAgICAgICAgICAgICAgICAgICBocmVmOiB1cmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb25lRGF0YUF0dHJzKHdpZGdldCwgbGluayk7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnJlcGxhY2VXaXRoKGxpbmspO1xuICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0ID0gbGluaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpZGdldC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIF93aWRnZXQgPSB3aWRnZXQuZ2V0KDApO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0LnJvbGUgPSAndG9vbHRpcCc7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQubWljcm90aXBQb3NpdGlvbiA9ICd0b3AnO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0Lm1pY3JvdGlwU2l6ZSA9ICdzbWFsbCc7XG4gICAgICAgICAgICBfd2lkZ2V0LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHdpZGdldC50ZXh0KCkpO1xuICAgICAgICAgICAgLy8gd2lkZ2V0LnRvb2x0aXAoeyB0aXRsZSA6IHdpZGdldC50ZXh0KCksIGFuaW1hdGlvbjogZmFsc2UgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuYnV0dG9uID0gYnV0dG9uO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRDb3VudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgfSxcblxuICAgICAgICBjbG9uZURhdGFBdHRyczogZnVuY3Rpb24oc291cmNlLCBkZXN0aW5hdGlvbikge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBzb3VyY2UuZGF0YSgpO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uLmRhdGEoa2V5LCBkYXRhW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFbGVtZW50Q2xhc3NOYW1lczogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVsZW1lbnRDbGFzc05hbWVzKGVsZW0sIHRoaXMuc2VydmljZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ291bnRlcjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKSB8fCAwO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgICdjbGFzcyc6IHRoaXMuZ2V0RWxlbWVudENsYXNzTmFtZXMoJ2NvdW50ZXInKSxcbiAgICAgICAgICAgICAgICAndGV4dCc6IG51bWJlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghbnVtYmVyICYmICF0aGlzLm9wdGlvbnMuemVyb2VzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zWydjbGFzcyddICs9ICcgJyArIHByZWZpeCArICdfX2NvdW50ZXJfZW1wdHknO1xuICAgICAgICAgICAgICAgIHBhcmFtcy50ZXh0ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY291bnRlckVsZW0gPSAkKCc8c3Bhbj4nLCBwYXJhbXMpO1xuICAgICAgICAgICAgdGhpcy53aWRnZXQuYXBwZW5kKGNvdW50ZXJFbGVtKTtcblxuICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcignY291bnRlci4nICsgcHJlZml4LCBbdGhpcy5zZXJ2aWNlLCBudW1iZXJdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgcHJvY2VzcyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMuY2xpY2spKSB7XG4gICAgICAgICAgICAgICAgcHJvY2VzcyA9IG9wdGlvbnMuY2xpY2suY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9jZXNzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy51cmwsXG4gICAgICAgICAgICAgICAgICAgIHBvc3RfdGl0bGU6IG9wdGlvbnMucG9zdF90aXRsZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpICkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0Lm1lZGlhID0gdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IG1ha2VVcmwob3B0aW9ucy5wb3B1cFVybCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdXJsID0gdGhpcy5hZGRBZGRpdGlvbmFsUGFyYW1zVG9VcmwodXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW5Qb3B1cCh1cmwsIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG9wdGlvbnMucG9wdXBXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBvcHRpb25zLnBvcHVwSGVpZ2h0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkQWRkaXRpb25hbFBhcmFtc1RvVXJsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gIGRhdGFUb09wdGlvbnModGhpcy53aWRnZXQpO1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9ICQucGFyYW0oJC5leHRlbmQoZGF0YSwgdGhpcy5vcHRpb25zLmRhdGEpKTtcbiAgICAgICAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QocGFyYW1zKSkgcmV0dXJuIHVybDtcbiAgICAgICAgICAgIHZhciBnbHVlID0gdXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJic7XG4gICAgICAgICAgICByZXR1cm4gdXJsICsgZ2x1ZSArIHBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICBvcGVuUG9wdXA6IGZ1bmN0aW9uKHVybCwgcGFyYW1zKSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IE1hdGgucm91bmQoc2NyZWVuLndpZHRoLzIgLSBwYXJhbXMud2lkdGgvMik7XG4gICAgICAgICAgICB2YXIgdG9wID0gMDtcbiAgICAgICAgICAgIGlmIChzY3JlZW4uaGVpZ2h0ID4gcGFyYW1zLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRvcCA9IE1hdGgucm91bmQoc2NyZWVuLmhlaWdodC8zIC0gcGFyYW1zLmhlaWdodC8yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdy5vcGVuKHVybCwgJ3NsXycgKyB0aGlzLnNlcnZpY2UsICdsZWZ0PScgKyBsZWZ0ICsgJyx0b3A9JyArIHRvcCArICcsJyArXG4gICAgICAgICAgICAgICAnd2lkdGg9JyArIHBhcmFtcy53aWR0aCArICcsaGVpZ2h0PScgKyBwYXJhbXMuaGVpZ2h0ICsgJyxwZXJzb25hbGJhcj0wLHRvb2xiYXI9MCxzY3JvbGxiYXJzPTEscmVzaXphYmxlPTEnKTtcbiAgICAgICAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgICAgICAgICB3aW4uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdwb3B1cF9vcGVuZWQuJyArIHByZWZpeCwgW3RoaXMuc2VydmljZSwgd2luXSk7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVyID0gc2V0SW50ZXJ2YWwoJC5wcm94eShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW4uY2xvc2VkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdwb3B1cF9jbG9zZWQuJyArIHByZWZpeCwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSwgdGhpcy5vcHRpb25zLnBvcHVwQ2hlY2tJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogSGVscGVyc1xuICAgICAqL1xuXG4gICAgIC8vIENhbWVsaXplIGRhdGEtYXR0cmlidXRlc1xuICAgIGZ1bmN0aW9uIGRhdGFUb09wdGlvbnMoZWxlbSkge1xuICAgICAgICBmdW5jdGlvbiB1cHBlcihtLCBsKSB7XG4gICAgICAgICAgICByZXR1cm4gbC50b1VwcGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgdmFyIGRhdGEgPSBlbGVtLmRhdGEoKTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICgga2V5ID09ICd0b29sdGlwJyApIHsgY29udGludWUgOyB9XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICd5ZXMnKSB2YWx1ZSA9IHRydWU7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gJ25vJykgdmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIG9wdGlvbnNba2V5LnJlcGxhY2UoLy0oXFx3KS9nLCB1cHBlcildID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZVVybCh1cmwsIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlKHVybCwgY29udGV4dCwgZW5jb2RlVVJJQ29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZW1wbGF0ZSh0bXBsLCBjb250ZXh0LCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRtcGwucmVwbGFjZSgvXFx7KFteXFx9XSspXFx9L2csIGZ1bmN0aW9uKG0sIGtleSkge1xuICAgICAgICAgICAgLy8gSWYga2V5IGRvZXNuJ3QgZXhpc3RzIGluIHRoZSBjb250ZXh0IHdlIHNob3VsZCBrZWVwIHRlbXBsYXRlIHRhZyBhcyBpc1xuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBjb250ZXh0ID8gKGZpbHRlciA/IGZpbHRlcihjb250ZXh0W2tleV0pIDogY29udGV4dFtrZXldKSA6IG07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEVsZW1lbnRDbGFzc05hbWVzKGVsZW0sIG1vZCkge1xuICAgICAgICB2YXIgY2xzID0gY2xhc3NQcmVmaXggKyBlbGVtO1xuICAgICAgICByZXR1cm4gY2xzICsgJyAnICsgY2xzICsgJ18nICsgbW9kO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlT25DbGljayhlbGVtLCBjYWxsYmFjaykge1xuICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcbiAgICAgICAgICAgIGlmICgoZS50eXBlID09PSAna2V5ZG93bicgJiYgZS53aGljaCAhPT0gMjcpIHx8ICQoZS50YXJnZXQpLmNsb3Nlc3QoZWxlbSkubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKG9wZW5DbGFzcyk7XG4gICAgICAgICAgICBkb2Mub2ZmKGV2ZW50cywgaGFuZGxlcik7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgIHZhciBldmVudHMgPSAnY2xpY2sgdG91Y2hzdGFydCBrZXlkb3duJztcbiAgICAgICAgZG9jLm9uKGV2ZW50cywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0luVmlld3BvcnQoZWxlbSkge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMTA7XG4gICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IHBhcnNlSW50KGVsZW0uY3NzKCdsZWZ0JyksIDEwKTtcbiAgICAgICAgICAgIHZhciB0b3AgPSBwYXJzZUludChlbGVtLmNzcygndG9wJyksIDEwKTtcblxuICAgICAgICAgICAgdmFyIHJlY3QgPSBlbGVtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgaWYgKHJlY3QubGVmdCA8IG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygnbGVmdCcsIG9mZnNldCAtIHJlY3QubGVmdCArIGxlZnQpO1xuICAgICAgICAgICAgZWxzZSBpZiAocmVjdC5yaWdodCA+IHdpbmRvdy5pbm5lcldpZHRoIC0gb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCdsZWZ0Jywgd2luZG93LmlubmVyV2lkdGggLSByZWN0LnJpZ2h0IC0gb2Zmc2V0ICsgbGVmdCk7XG5cbiAgICAgICAgICAgIGlmIChyZWN0LnRvcCA8IG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygndG9wJywgb2Zmc2V0IC0gcmVjdC50b3AgKyB0b3ApO1xuICAgICAgICAgICAgZWxzZSBpZiAocmVjdC5ib3R0b20gPiB3aW5kb3cuaW5uZXJIZWlnaHQgLSBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ3RvcCcsIHdpbmRvdy5pbm5lckhlaWdodCAtIHJlY3QuYm90dG9tIC0gb2Zmc2V0ICsgdG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtLmFkZENsYXNzKG9wZW5DbGFzcyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBBdXRvIGluaXRpYWxpemF0aW9uXG4gICAgICovXG4gICAgJChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLicgKyBwcmVmaXgpLnNvY2lhbExpbmtzKCk7XG4gICAgfSk7XG5cbn0pKTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiI3ZlcnNpb25JY29uXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
