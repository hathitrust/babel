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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImNsYXNzTGlzdC5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ2xvYmFsX3NlYXJjaC5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJzZWFyY2hfaW5faXRlbS5qcyIsInZlcnNpb25fcG9wdXAuanMiXSwibmFtZXMiOlsiZmFjdG9yeSIsImRlZmluZSIsImFtZCIsImpRdWVyeSIsIiQiLCJ1bmRlZmluZWQiLCJ0YWcyYXR0ciIsImEiLCJpbWciLCJmb3JtIiwiYmFzZSIsInNjcmlwdCIsImlmcmFtZSIsImxpbmsiLCJrZXkiLCJhbGlhc2VzIiwicGFyc2VyIiwic3RyaWN0IiwibG9vc2UiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImlzaW50IiwicGFyc2VVcmkiLCJ1cmwiLCJzdHJpY3RNb2RlIiwic3RyIiwiZGVjb2RlVVJJIiwicmVzIiwiZXhlYyIsInVyaSIsImF0dHIiLCJwYXJhbSIsInNlZyIsImkiLCJwYXJzZVN0cmluZyIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJmcmFnbWVudCIsImhvc3QiLCJwcm90b2NvbCIsInBvcnQiLCJnZXRBdHRyTmFtZSIsImVsbSIsInRuIiwidGFnTmFtZSIsInRvTG93ZXJDYXNlIiwicHJvbW90ZSIsInBhcmVudCIsImxlbmd0aCIsInQiLCJwYXJzZSIsInBhcnRzIiwidmFsIiwicGFydCIsInNoaWZ0IiwiaXNBcnJheSIsInB1c2giLCJvYmoiLCJrZXlzIiwiaW5kZXhPZiIsInN1YnN0ciIsInRlc3QiLCJtZXJnZSIsImxlbiIsImxhc3QiLCJrIiwic2V0IiwicmVkdWNlIiwiU3RyaW5nIiwicmV0IiwicGFpciIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJlcWwiLCJicmFjZSIsImxhc3RCcmFjZUluS2V5IiwidiIsImMiLCJhY2N1bXVsYXRvciIsImwiLCJjdXJyIiwiYXJndW1lbnRzIiwiY2FsbCIsInZBcmciLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJwdXJsIiwid2luZG93IiwibG9jYXRpb24iLCJkYXRhIiwicXVlcnkiLCJmcGFyYW0iLCJzZWdtZW50IiwiZnNlZ21lbnQiLCJmbiIsIkhUIiwiaGVhZCIsInJlYWR5IiwiJHN0YXR1cyIsImxhc3RNZXNzYWdlIiwibGFzdFRpbWVyIiwidXBkYXRlX3N0YXR1cyIsIm1lc3NhZ2UiLCJjbGVhclRpbWVvdXQiLCJzZXRUaW1lb3V0IiwidGV4dCIsImNvbnNvbGUiLCJsb2ciLCJnZXQiLCJpbm5lclRleHQiLCJzZWxmIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwidmlldyIsImNsYXNzTGlzdFByb3AiLCJwcm90b1Byb3AiLCJlbGVtQ3RyUHJvdG8iLCJFbGVtZW50Iiwib2JqQ3RyIiwic3RyVHJpbSIsInRyaW0iLCJhcnJJbmRleE9mIiwiQXJyYXkiLCJpdGVtIiwiRE9NRXgiLCJ0eXBlIiwibmFtZSIsImNvZGUiLCJET01FeGNlcHRpb24iLCJjaGVja1Rva2VuQW5kR2V0SW5kZXgiLCJjbGFzc0xpc3QiLCJ0b2tlbiIsIkNsYXNzTGlzdCIsImVsZW0iLCJ0cmltbWVkQ2xhc3NlcyIsImdldEF0dHJpYnV0ZSIsImNsYXNzZXMiLCJfdXBkYXRlQ2xhc3NOYW1lIiwic2V0QXR0cmlidXRlIiwiY2xhc3NMaXN0UHJvdG8iLCJjbGFzc0xpc3RHZXR0ZXIiLCJFcnJvciIsImNvbnRhaW5zIiwiYWRkIiwidG9rZW5zIiwidXBkYXRlZCIsInJlbW92ZSIsImluZGV4Iiwic3BsaWNlIiwidG9nZ2xlIiwiZm9yY2UiLCJyZXN1bHQiLCJtZXRob2QiLCJyZXBsYWNlbWVudF90b2tlbiIsImpvaW4iLCJkZWZpbmVQcm9wZXJ0eSIsImNsYXNzTGlzdFByb3BEZXNjIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsImV4IiwibnVtYmVyIiwiX19kZWZpbmVHZXR0ZXJfXyIsInRlc3RFbGVtZW50IiwiY3JlYXRlTWV0aG9kIiwib3JpZ2luYWwiLCJET01Ub2tlbkxpc3QiLCJfdG9nZ2xlIiwic2xpY2UiLCJhcHBseSIsIkRFRkFVTFRfQ09MTF9NRU5VX09QVElPTiIsIk5FV19DT0xMX01FTlVfT1BUSU9OIiwiSU5fWU9VUl9DT0xMU19MQUJFTCIsIiR0b29sYmFyIiwiJGVycm9ybXNnIiwiJGluZm9tc2ciLCJkaXNwbGF5X2Vycm9yIiwibXNnIiwiaW5zZXJ0QWZ0ZXIiLCJzaG93IiwiZGlzcGxheV9pbmZvIiwiaGlkZV9lcnJvciIsImhpZGUiLCJoaWRlX2luZm8iLCJnZXRfdXJsIiwicGF0aG5hbWUiLCJwYXJzZV9saW5lIiwicmV0dmFsIiwidG1wIiwia3YiLCJlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEiLCJhcmdzIiwib3B0aW9ucyIsImV4dGVuZCIsImNyZWF0aW5nIiwibGFiZWwiLCIkYmxvY2siLCJjbiIsImZpbmQiLCJkZXNjIiwic2hyZCIsImxvZ2luX3N0YXR1cyIsImxvZ2dlZF9pbiIsImFwcGVuZFRvIiwiJGhpZGRlbiIsImNsb25lIiwiaWlkIiwiJGRpYWxvZyIsImJvb3Rib3giLCJkaWFsb2ciLCJjYWxsYmFjayIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInN1Ym1pdF9wb3N0IiwiZWFjaCIsIiR0aGlzIiwiJGNvdW50IiwibGltaXQiLCJiaW5kIiwicGFyYW1zIiwicGFnZSIsImlkIiwiYWpheCIsImRvbmUiLCJhZGRfaXRlbV90b19jb2xsaXN0IiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJocmVmIiwiJGRpdiIsIiRwIiwiJGxpbmsiLCJEb3dubG9hZGVyIiwiaW5pdCIsInBkZiIsInN0YXJ0IiwiYmluZEV2ZW50cyIsImFkZENsYXNzIiwiaGlkZUFsbCIsImRvd25sb2FkX3Byb2dyZXNzX2Jhc2UiLCJkb3dubG9hZFBkZiIsImV4cGxhaW5QZGZBY2Nlc3MiLCJodG1sIiwiYWxlcnQiLCJzcmMiLCJpdGVtX3RpdGxlIiwiaGVhZGVyIiwidG90YWwiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwic3RhdHVzIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCJyZXF1ZXN0RG93bmxvYWQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJzZXRJbnRlcnZhbCIsImNoZWNrU3RhdHVzIiwidHMiLCJEYXRlIiwiZ2V0VGltZSIsInN1Y2Nlc3MiLCJ1cGRhdGVQcm9ncmVzcyIsIm51bV9hdHRlbXB0cyIsImRpc3BsYXlQcm9jZXNzRXJyb3IiLCJsb2dFcnJvciIsInBlcmNlbnQiLCJjdXJyZW50IiwiY3VycmVudF9wYWdlIiwibGFzdF9wZXJjZW50IiwicmVtb3ZlQ2xhc3MiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJvbiIsInRyaWdnZXIiLCJyZWFkZXIiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9jbGVhclNlbGVjdGlvbiIsInN0b3BQcm9wYWdhdGlvbiIsImZvY3VzIiwiTWF0aCIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInBhcnNlSW50IiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJyYXRlIiwibm93IiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwiYW5hbHl0aWNzIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0IiwiZXZlbnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRzdWJtaXQiLCJoYXNDbGFzcyIsInJlbW92ZUF0dHIiXSwibWFwcGluZ3MiOiI7Ozs7QUFBQTs7Ozs7OztBQU9BLENBQUMsQ0FBQyxVQUFTQSxPQUFULEVBQWtCO0FBQ25CLEtBQUksT0FBT0MsTUFBUCxLQUFrQixVQUFsQixJQUFnQ0EsT0FBT0MsR0FBM0MsRUFBZ0Q7QUFDL0M7QUFDQSxNQUFLLE9BQU9DLE1BQVAsS0FBa0IsV0FBdkIsRUFBcUM7QUFDcENGLFVBQU8sQ0FBQyxRQUFE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QUFFdUgsSUFBRixDQUFPdU8sT0FBTzVTLEdBQVAsRUFBUCxDQUFQLEVBQThCO0FBQzVCNEosY0FBUXlELEtBQVIsQ0FBYyx3Q0FBZDtBQUNBLGFBQU8sS0FBUDtBQUNEO0FBQ0RvSCxZQUFRMUgsUUFBUixDQUFpQixhQUFqQixFQUFnQ3RPLElBQWhDLENBQXFDLFVBQXJDLEVBQWlELFVBQWpEOztBQUVBM0IsTUFBRXFGLE1BQUYsRUFBVThOLEVBQVYsQ0FBYSxRQUFiLEVBQXVCLFlBQVc7QUFDaEN3RSxjQUFRRSxVQUFSLENBQW1CLFVBQW5CO0FBQ0QsS0FGRDs7QUFJQSxXQUFPLElBQVA7QUFDRCxHQW5CRDtBQW9CRCxDQXJCRDs7O0FDQUEvUixLQUFLQyxLQUFMLENBQVcsWUFBVzs7QUFFbEIvRixNQUFFLGNBQUYsRUFBa0JnUCxLQUFsQixDQUF3QixVQUFTMUssQ0FBVCxFQUFZO0FBQ2hDQSxVQUFFMkssY0FBRjtBQUNBbkMsZ0JBQVF5RCxLQUFSLENBQWMsb1lBQWQ7QUFDSCxLQUhEO0FBS0gsQ0FQRCIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbIi8qXG4gKiBKUXVlcnkgVVJMIFBhcnNlciBwbHVnaW4sIHYyLjIuMVxuICogRGV2ZWxvcGVkIGFuZCBtYWludGFuaW5lZCBieSBNYXJrIFBlcmtpbnMsIG1hcmtAYWxsbWFya2VkdXAuY29tXG4gKiBTb3VyY2UgcmVwb3NpdG9yeTogaHR0cHM6Ly9naXRodWIuY29tL2FsbG1hcmtlZHVwL2pRdWVyeS1VUkwtUGFyc2VyXG4gKiBMaWNlbnNlZCB1bmRlciBhbiBNSVQtc3R5bGUgbGljZW5zZS4gU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlci9ibG9iL21hc3Rlci9MSUNFTlNFIGZvciBkZXRhaWxzLlxuICovIFxuXG47KGZ1bmN0aW9uKGZhY3RvcnkpIHtcblx0aWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuXHRcdC8vIEFNRCBhdmFpbGFibGU7IHVzZSBhbm9ueW1vdXMgbW9kdWxlXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcdFxuXHRcdH0gZWxzZSB7XG5cdFx0XHRkZWZpbmUoW10sIGZhY3RvcnkpO1xuXHRcdH1cblx0fSBlbHNlIHtcblx0XHQvLyBObyBBTUQgYXZhaWxhYmxlOyBtdXRhdGUgZ2xvYmFsIHZhcnNcblx0XHRpZiAoIHR5cGVvZiBqUXVlcnkgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0ZmFjdG9yeShqUXVlcnkpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRmYWN0b3J5KCk7XG5cdFx0fVxuXHR9XG59KShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblx0XG5cdHZhciB0YWcyYXR0ciA9IHtcblx0XHRcdGEgICAgICAgOiAnaHJlZicsXG5cdFx0XHRpbWcgICAgIDogJ3NyYycsXG5cdFx0XHRmb3JtICAgIDogJ2FjdGlvbicsXG5cdFx0XHRiYXNlICAgIDogJ2hyZWYnLFxuXHRcdFx0c2NyaXB0ICA6ICdzcmMnLFxuXHRcdFx0aWZyYW1lICA6ICdzcmMnLFxuXHRcdFx0bGluayAgICA6ICdocmVmJ1xuXHRcdH0sXG5cdFx0XG5cdFx0a2V5ID0gWydzb3VyY2UnLCAncHJvdG9jb2wnLCAnYXV0aG9yaXR5JywgJ3VzZXJJbmZvJywgJ3VzZXInLCAncGFzc3dvcmQnLCAnaG9zdCcsICdwb3J0JywgJ3JlbGF0aXZlJywgJ3BhdGgnLCAnZGlyZWN0b3J5JywgJ2ZpbGUnLCAncXVlcnknLCAnZnJhZ21lbnQnXSwgLy8ga2V5cyBhdmFpbGFibGUgdG8gcXVlcnlcblx0XHRcblx0XHRhbGlhc2VzID0geyAnYW5jaG9yJyA6ICdmcmFnbWVudCcgfSwgLy8gYWxpYXNlcyBmb3IgYmFja3dhcmRzIGNvbXBhdGFiaWxpdHlcblx0XHRcblx0XHRwYXJzZXIgPSB7XG5cdFx0XHRzdHJpY3QgOiAvXig/OihbXjpcXC8/I10rKTopPyg/OlxcL1xcLygoPzooKFteOkBdKik6PyhbXjpAXSopKT9AKT8oW146XFwvPyNdKikoPzo6KFxcZCopKT8pKT8oKCgoPzpbXj8jXFwvXSpcXC8pKikoW14/I10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8sICAvL2xlc3MgaW50dWl0aXZlLCBtb3JlIGFjY3VyYXRlIHRvIHRoZSBzcGVjc1xuXHRcdFx0bG9vc2UgOiAgL14oPzooPyFbXjpAXSs6W146QFxcL10qQCkoW146XFwvPyMuXSspOik/KD86XFwvXFwvKT8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSgoKFxcLyg/OltePyNdKD8hW14/I1xcL10qXFwuW14/I1xcLy5dKyg/Ols/I118JCkpKSpcXC8/KT8oW14/I1xcL10qKSkoPzpcXD8oW14jXSopKT8oPzojKC4qKSk/KS8gLy8gbW9yZSBpbnR1aXRpdmUsIGZhaWxzIG9uIHJlbGF0aXZlIHBhdGhzIGFuZCBkZXZpYXRlcyBmcm9tIHNwZWNzXG5cdFx0fSxcblx0XHRcblx0XHR0b1N0cmluZyA9IE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcsXG5cdFx0XG5cdFx0aXNpbnQgPSAvXlswLTldKyQvO1xuXHRcblx0ZnVuY3Rpb24gcGFyc2VVcmkoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHR2YXIgc3RyID0gZGVjb2RlVVJJKCB1cmwgKSxcblx0XHRyZXMgICA9IHBhcnNlclsgc3RyaWN0TW9kZSB8fCBmYWxzZSA/ICdzdHJpY3QnIDogJ2xvb3NlJyBdLmV4ZWMoIHN0ciApLFxuXHRcdHVyaSA9IHsgYXR0ciA6IHt9LCBwYXJhbSA6IHt9LCBzZWcgOiB7fSB9LFxuXHRcdGkgICA9IDE0O1xuXHRcdFxuXHRcdHdoaWxlICggaS0tICkge1xuXHRcdFx0dXJpLmF0dHJbIGtleVtpXSBdID0gcmVzW2ldIHx8ICcnO1xuXHRcdH1cblx0XHRcblx0XHQvLyBidWlsZCBxdWVyeSBhbmQgZnJhZ21lbnQgcGFyYW1ldGVyc1x0XHRcblx0XHR1cmkucGFyYW1bJ3F1ZXJ5J10gPSBwYXJzZVN0cmluZyh1cmkuYXR0clsncXVlcnknXSk7XG5cdFx0dXJpLnBhcmFtWydmcmFnbWVudCddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ2ZyYWdtZW50J10pO1xuXHRcdFxuXHRcdC8vIHNwbGl0IHBhdGggYW5kIGZyYWdlbWVudCBpbnRvIHNlZ21lbnRzXHRcdFxuXHRcdHVyaS5zZWdbJ3BhdGgnXSA9IHVyaS5hdHRyLnBhdGgucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTsgICAgIFxuXHRcdHVyaS5zZWdbJ2ZyYWdtZW50J10gPSB1cmkuYXR0ci5mcmFnbWVudC5yZXBsYWNlKC9eXFwvK3xcXC8rJC9nLCcnKS5zcGxpdCgnLycpO1xuXHRcdFxuXHRcdC8vIGNvbXBpbGUgYSAnYmFzZScgZG9tYWluIGF0dHJpYnV0ZSAgICAgICAgXG5cdFx0dXJpLmF0dHJbJ2Jhc2UnXSA9IHVyaS5hdHRyLmhvc3QgPyAodXJpLmF0dHIucHJvdG9jb2wgPyAgdXJpLmF0dHIucHJvdG9jb2wrJzovLycrdXJpLmF0dHIuaG9zdCA6IHVyaS5hdHRyLmhvc3QpICsgKHVyaS5hdHRyLnBvcnQgPyAnOicrdXJpLmF0dHIucG9ydCA6ICcnKSA6ICcnOyAgICAgIFxuXHRcdCAgXG5cdFx0cmV0dXJuIHVyaTtcblx0fTtcblx0XG5cdGZ1bmN0aW9uIGdldEF0dHJOYW1lKCBlbG0gKSB7XG5cdFx0dmFyIHRuID0gZWxtLnRhZ05hbWU7XG5cdFx0aWYgKCB0eXBlb2YgdG4gIT09ICd1bmRlZmluZWQnICkgcmV0dXJuIHRhZzJhdHRyW3RuLnRvTG93ZXJDYXNlKCldO1xuXHRcdHJldHVybiB0bjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gcHJvbW90ZShwYXJlbnQsIGtleSkge1xuXHRcdGlmIChwYXJlbnRba2V5XS5sZW5ndGggPT0gMCkgcmV0dXJuIHBhcmVudFtrZXldID0ge307XG5cdFx0dmFyIHQgPSB7fTtcblx0XHRmb3IgKHZhciBpIGluIHBhcmVudFtrZXldKSB0W2ldID0gcGFyZW50W2tleV1baV07XG5cdFx0cGFyZW50W2tleV0gPSB0O1xuXHRcdHJldHVybiB0O1xuXHR9XG5cblx0ZnVuY3Rpb24gcGFyc2UocGFydHMsIHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHR2YXIgcGFydCA9IHBhcnRzLnNoaWZ0KCk7XG5cdFx0aWYgKCFwYXJ0KSB7XG5cdFx0XHRpZiAoaXNBcnJheShwYXJlbnRba2V5XSkpIHtcblx0XHRcdFx0cGFyZW50W2tleV0ucHVzaCh2YWwpO1xuXHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2UgaWYgKCd1bmRlZmluZWQnID09IHR5cGVvZiBwYXJlbnRba2V5XSkge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IHZhbDtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0fVxuXHRcdH0gZWxzZSB7XG5cdFx0XHR2YXIgb2JqID0gcGFyZW50W2tleV0gPSBwYXJlbnRba2V5XSB8fCBbXTtcblx0XHRcdGlmICgnXScgPT0gcGFydCkge1xuXHRcdFx0XHRpZiAoaXNBcnJheShvYmopKSB7XG5cdFx0XHRcdFx0aWYgKCcnICE9IHZhbCkgb2JqLnB1c2godmFsKTtcblx0XHRcdFx0fSBlbHNlIGlmICgnb2JqZWN0JyA9PSB0eXBlb2Ygb2JqKSB7XG5cdFx0XHRcdFx0b2JqW2tleXMob2JqKS5sZW5ndGhdID0gdmFsO1xuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdG9iaiA9IHBhcmVudFtrZXldID0gW3BhcmVudFtrZXldLCB2YWxdO1xuXHRcdFx0XHR9XG5cdFx0XHR9IGVsc2UgaWYgKH5wYXJ0LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0XHRwYXJ0ID0gcGFydC5zdWJzdHIoMCwgcGFydC5sZW5ndGggLSAxKTtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHRcdC8vIGtleVxuXHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0aWYgKCFpc2ludC50ZXN0KHBhcnQpICYmIGlzQXJyYXkob2JqKSkgb2JqID0gcHJvbW90ZShwYXJlbnQsIGtleSk7XG5cdFx0XHRcdHBhcnNlKHBhcnRzLCBvYmosIHBhcnQsIHZhbCk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0ZnVuY3Rpb24gbWVyZ2UocGFyZW50LCBrZXksIHZhbCkge1xuXHRcdGlmICh+a2V5LmluZGV4T2YoJ10nKSkge1xuXHRcdFx0dmFyIHBhcnRzID0ga2V5LnNwbGl0KCdbJyksXG5cdFx0XHRsZW4gPSBwYXJ0cy5sZW5ndGgsXG5cdFx0XHRsYXN0ID0gbGVuIC0gMTtcblx0XHRcdHBhcnNlKHBhcnRzLCBwYXJlbnQsICdiYXNlJywgdmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0aWYgKCFpc2ludC50ZXN0KGtleSkgJiYgaXNBcnJheShwYXJlbnQuYmFzZSkpIHtcblx0XHRcdFx0dmFyIHQgPSB7fTtcblx0XHRcdFx0Zm9yICh2YXIgayBpbiBwYXJlbnQuYmFzZSkgdFtrXSA9IHBhcmVudC5iYXNlW2tdO1xuXHRcdFx0XHRwYXJlbnQuYmFzZSA9IHQ7XG5cdFx0XHR9XG5cdFx0XHRzZXQocGFyZW50LmJhc2UsIGtleSwgdmFsKTtcblx0XHR9XG5cdFx0cmV0dXJuIHBhcmVudDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlU3RyaW5nKHN0cikge1xuXHRcdHJldHVybiByZWR1Y2UoU3RyaW5nKHN0cikuc3BsaXQoLyZ8Oy8pLCBmdW5jdGlvbihyZXQsIHBhaXIpIHtcblx0XHRcdHRyeSB7XG5cdFx0XHRcdHBhaXIgPSBkZWNvZGVVUklDb21wb25lbnQocGFpci5yZXBsYWNlKC9cXCsvZywgJyAnKSk7XG5cdFx0XHR9IGNhdGNoKGUpIHtcblx0XHRcdFx0Ly8gaWdub3JlXG5cdFx0XHR9XG5cdFx0XHR2YXIgZXFsID0gcGFpci5pbmRleE9mKCc9JyksXG5cdFx0XHRcdGJyYWNlID0gbGFzdEJyYWNlSW5LZXkocGFpciksXG5cdFx0XHRcdGtleSA9IHBhaXIuc3Vic3RyKDAsIGJyYWNlIHx8IGVxbCksXG5cdFx0XHRcdHZhbCA9IHBhaXIuc3Vic3RyKGJyYWNlIHx8IGVxbCwgcGFpci5sZW5ndGgpLFxuXHRcdFx0XHR2YWwgPSB2YWwuc3Vic3RyKHZhbC5pbmRleE9mKCc9JykgKyAxLCB2YWwubGVuZ3RoKTtcblxuXHRcdFx0aWYgKCcnID09IGtleSkga2V5ID0gcGFpciwgdmFsID0gJyc7XG5cblx0XHRcdHJldHVybiBtZXJnZShyZXQsIGtleSwgdmFsKTtcblx0XHR9LCB7IGJhc2U6IHt9IH0pLmJhc2U7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHNldChvYmosIGtleSwgdmFsKSB7XG5cdFx0dmFyIHYgPSBvYmpba2V5XTtcblx0XHRpZiAodW5kZWZpbmVkID09PSB2KSB7XG5cdFx0XHRvYmpba2V5XSA9IHZhbDtcblx0XHR9IGVsc2UgaWYgKGlzQXJyYXkodikpIHtcblx0XHRcdHYucHVzaCh2YWwpO1xuXHRcdH0gZWxzZSB7XG5cdFx0XHRvYmpba2V5XSA9IFt2LCB2YWxdO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gbGFzdEJyYWNlSW5LZXkoc3RyKSB7XG5cdFx0dmFyIGxlbiA9IHN0ci5sZW5ndGgsXG5cdFx0XHQgYnJhY2UsIGM7XG5cdFx0Zm9yICh2YXIgaSA9IDA7IGkgPCBsZW47ICsraSkge1xuXHRcdFx0YyA9IHN0cltpXTtcblx0XHRcdGlmICgnXScgPT0gYykgYnJhY2UgPSBmYWxzZTtcblx0XHRcdGlmICgnWycgPT0gYykgYnJhY2UgPSB0cnVlO1xuXHRcdFx0aWYgKCc9JyA9PSBjICYmICFicmFjZSkgcmV0dXJuIGk7XG5cdFx0fVxuXHR9XG5cdFxuXHRmdW5jdGlvbiByZWR1Y2Uob2JqLCBhY2N1bXVsYXRvcil7XG5cdFx0dmFyIGkgPSAwLFxuXHRcdFx0bCA9IG9iai5sZW5ndGggPj4gMCxcblx0XHRcdGN1cnIgPSBhcmd1bWVudHNbMl07XG5cdFx0d2hpbGUgKGkgPCBsKSB7XG5cdFx0XHRpZiAoaSBpbiBvYmopIGN1cnIgPSBhY2N1bXVsYXRvci5jYWxsKHVuZGVmaW5lZCwgY3Vyciwgb2JqW2ldLCBpLCBvYmopO1xuXHRcdFx0KytpO1xuXHRcdH1cblx0XHRyZXR1cm4gY3Vycjtcblx0fVxuXHRcblx0ZnVuY3Rpb24gaXNBcnJheSh2QXJnKSB7XG5cdFx0cmV0dXJuIE9iamVjdC5wcm90b3R5cGUudG9TdHJpbmcuY2FsbCh2QXJnKSA9PT0gXCJbb2JqZWN0IEFycmF5XVwiO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBrZXlzKG9iaikge1xuXHRcdHZhciBrZXlzID0gW107XG5cdFx0Zm9yICggcHJvcCBpbiBvYmogKSB7XG5cdFx0XHRpZiAoIG9iai5oYXNPd25Qcm9wZXJ0eShwcm9wKSApIGtleXMucHVzaChwcm9wKTtcblx0XHR9XG5cdFx0cmV0dXJuIGtleXM7XG5cdH1cblx0XHRcblx0ZnVuY3Rpb24gcHVybCggdXJsLCBzdHJpY3RNb2RlICkge1xuXHRcdGlmICggYXJndW1lbnRzLmxlbmd0aCA9PT0gMSAmJiB1cmwgPT09IHRydWUgKSB7XG5cdFx0XHRzdHJpY3RNb2RlID0gdHJ1ZTtcblx0XHRcdHVybCA9IHVuZGVmaW5lZDtcblx0XHR9XG5cdFx0c3RyaWN0TW9kZSA9IHN0cmljdE1vZGUgfHwgZmFsc2U7XG5cdFx0dXJsID0gdXJsIHx8IHdpbmRvdy5sb2NhdGlvbi50b1N0cmluZygpO1xuXHRcblx0XHRyZXR1cm4ge1xuXHRcdFx0XG5cdFx0XHRkYXRhIDogcGFyc2VVcmkodXJsLCBzdHJpY3RNb2RlKSxcblx0XHRcdFxuXHRcdFx0Ly8gZ2V0IHZhcmlvdXMgYXR0cmlidXRlcyBmcm9tIHRoZSBVUklcblx0XHRcdGF0dHIgOiBmdW5jdGlvbiggYXR0ciApIHtcblx0XHRcdFx0YXR0ciA9IGFsaWFzZXNbYXR0cl0gfHwgYXR0cjtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBhdHRyICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5hdHRyW2F0dHJdIDogdGhpcy5kYXRhLmF0dHI7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcXVlcnkgc3RyaW5nIHBhcmFtZXRlcnNcblx0XHRcdHBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5xdWVyeVtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0ucXVlcnk7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgcGFyYW1ldGVyc1xuXHRcdFx0ZnBhcmFtIDogZnVuY3Rpb24oIHBhcmFtICkge1xuXHRcdFx0XHRyZXR1cm4gdHlwZW9mIHBhcmFtICE9PSAndW5kZWZpbmVkJyA/IHRoaXMuZGF0YS5wYXJhbS5mcmFnbWVudFtwYXJhbV0gOiB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnQ7XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gcGF0aCBzZWdtZW50c1xuXHRcdFx0c2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcucGF0aDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5wYXRoLmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGhbc2VnXTsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9XG5cdFx0XHR9LFxuXHRcdFx0XG5cdFx0XHQvLyByZXR1cm4gZnJhZ21lbnQgc2VnbWVudHNcblx0XHRcdGZzZWdtZW50IDogZnVuY3Rpb24oIHNlZyApIHtcblx0XHRcdFx0aWYgKCB0eXBlb2Ygc2VnID09PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudDsgICAgICAgICAgICAgICAgICAgIFxuXHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdHNlZyA9IHNlZyA8IDAgPyB0aGlzLmRhdGEuc2VnLmZyYWdtZW50Lmxlbmd0aCArIHNlZyA6IHNlZyAtIDE7IC8vIG5lZ2F0aXZlIHNlZ21lbnRzIGNvdW50IGZyb20gdGhlIGVuZFxuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLmZyYWdtZW50W3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fVxuXHQgICAgXHRcblx0XHR9O1xuXHRcblx0fTtcblx0XG5cdGlmICggdHlwZW9mICQgIT09ICd1bmRlZmluZWQnICkge1xuXHRcdFxuXHRcdCQuZm4udXJsID0gZnVuY3Rpb24oIHN0cmljdE1vZGUgKSB7XG5cdFx0XHR2YXIgdXJsID0gJyc7XG5cdFx0XHRpZiAoIHRoaXMubGVuZ3RoICkge1xuXHRcdFx0XHR1cmwgPSAkKHRoaXMpLmF0dHIoIGdldEF0dHJOYW1lKHRoaXNbMF0pICkgfHwgJyc7XG5cdFx0XHR9ICAgIFxuXHRcdFx0cmV0dXJuIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApO1xuXHRcdH07XG5cdFx0XG5cdFx0JC51cmwgPSBwdXJsO1xuXHRcdFxuXHR9IGVsc2Uge1xuXHRcdHdpbmRvdy5wdXJsID0gcHVybDtcblx0fVxuXG59KTtcblxuIiwidmFyIEhUID0gSFQgfHwge307XG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIHZhciAkc3RhdHVzID0gJChcImRpdltyb2xlPXN0YXR1c11cIik7XG5cbiAgdmFyIGxhc3RNZXNzYWdlOyB2YXIgbGFzdFRpbWVyO1xuICBIVC51cGRhdGVfc3RhdHVzID0gZnVuY3Rpb24obWVzc2FnZSkge1xuICAgICAgaWYgKCBsYXN0TWVzc2FnZSAhPSBtZXNzYWdlICkge1xuICAgICAgICBpZiAoIGxhc3RUaW1lciApIHsgY2xlYXJUaW1lb3V0KGxhc3RUaW1lcik7IGxhc3RUaW1lciA9IG51bGw7IH1cblxuICAgICAgICBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkc3RhdHVzLnRleHQobWVzc2FnZSk7XG4gICAgICAgICAgbGFzdE1lc3NhZ2UgPSBtZXNzYWdlO1xuICAgICAgICAgIGNvbnNvbGUubG9nKFwiLS0gc3RhdHVzOlwiLCBtZXNzYWdlKTtcbiAgICAgICAgfSwgNTApO1xuICAgICAgICBsYXN0VGltZXIgPSBzZXRUaW1lb3V0KCgpID0+IHtcbiAgICAgICAgICAkc3RhdHVzLmdldCgwKS5pbm5lclRleHQgPSAnJztcbiAgICAgICAgfSwgNTAwKTtcblxuICAgICAgfVxuICB9XG5cbn0pIiwiLypcbiAqIGNsYXNzTGlzdC5qczogQ3Jvc3MtYnJvd3NlciBmdWxsIGVsZW1lbnQuY2xhc3NMaXN0IGltcGxlbWVudGF0aW9uLlxuICogMS4yLjIwMTcxMjEwXG4gKlxuICogQnkgRWxpIEdyZXksIGh0dHA6Ly9lbGlncmV5LmNvbVxuICogTGljZW5zZTogRGVkaWNhdGVkIHRvIHRoZSBwdWJsaWMgZG9tYWluLlxuICogICBTZWUgaHR0cHM6Ly9naXRodWIuY29tL2VsaWdyZXkvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL0xJQ0VOU0UubWRcbiAqL1xuXG4vKmdsb2JhbCBzZWxmLCBkb2N1bWVudCwgRE9NRXhjZXB0aW9uICovXG5cbi8qISBAc291cmNlIGh0dHA6Ly9wdXJsLmVsaWdyZXkuY29tL2dpdGh1Yi9jbGFzc0xpc3QuanMvYmxvYi9tYXN0ZXIvY2xhc3NMaXN0LmpzICovXG5cbmlmIChcImRvY3VtZW50XCIgaW4gc2VsZikge1xuXG4vLyBGdWxsIHBvbHlmaWxsIGZvciBicm93c2VycyB3aXRoIG5vIGNsYXNzTGlzdCBzdXBwb3J0XG4vLyBJbmNsdWRpbmcgSUUgPCBFZGdlIG1pc3NpbmcgU1ZHRWxlbWVudC5jbGFzc0xpc3RcbmlmIChcblx0ICAgIShcImNsYXNzTGlzdFwiIGluIGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpKSBcblx0fHwgZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TXG5cdCYmICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50TlMoXCJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2Z1wiLFwiZ1wiKSlcbikge1xuXG4oZnVuY3Rpb24gKHZpZXcpIHtcblxuXCJ1c2Ugc3RyaWN0XCI7XG5cbmlmICghKCdFbGVtZW50JyBpbiB2aWV3KSkgcmV0dXJuO1xuXG52YXJcblx0ICBjbGFzc0xpc3RQcm9wID0gXCJjbGFzc0xpc3RcIlxuXHQsIHByb3RvUHJvcCA9IFwicHJvdG90eXBlXCJcblx0LCBlbGVtQ3RyUHJvdG8gPSB2aWV3LkVsZW1lbnRbcHJvdG9Qcm9wXVxuXHQsIG9iakN0ciA9IE9iamVjdFxuXHQsIHN0clRyaW0gPSBTdHJpbmdbcHJvdG9Qcm9wXS50cmltIHx8IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gdGhpcy5yZXBsYWNlKC9eXFxzK3xcXHMrJC9nLCBcIlwiKTtcblx0fVxuXHQsIGFyckluZGV4T2YgPSBBcnJheVtwcm90b1Byb3BdLmluZGV4T2YgfHwgZnVuY3Rpb24gKGl0ZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgaSA9IDBcblx0XHRcdCwgbGVuID0gdGhpcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0aWYgKGkgaW4gdGhpcyAmJiB0aGlzW2ldID09PSBpdGVtKSB7XG5cdFx0XHRcdHJldHVybiBpO1xuXHRcdFx0fVxuXHRcdH1cblx0XHRyZXR1cm4gLTE7XG5cdH1cblx0Ly8gVmVuZG9yczogcGxlYXNlIGFsbG93IGNvbnRlbnQgY29kZSB0byBpbnN0YW50aWF0ZSBET01FeGNlcHRpb25zXG5cdCwgRE9NRXggPSBmdW5jdGlvbiAodHlwZSwgbWVzc2FnZSkge1xuXHRcdHRoaXMubmFtZSA9IHR5cGU7XG5cdFx0dGhpcy5jb2RlID0gRE9NRXhjZXB0aW9uW3R5cGVdO1xuXHRcdHRoaXMubWVzc2FnZSA9IG1lc3NhZ2U7XG5cdH1cblx0LCBjaGVja1Rva2VuQW5kR2V0SW5kZXggPSBmdW5jdGlvbiAoY2xhc3NMaXN0LCB0b2tlbikge1xuXHRcdGlmICh0b2tlbiA9PT0gXCJcIikge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiU1lOVEFYX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgYmUgZW1wdHkuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdGlmICgvXFxzLy50ZXN0KHRva2VuKSkge1xuXHRcdFx0dGhyb3cgbmV3IERPTUV4KFxuXHRcdFx0XHQgIFwiSU5WQUxJRF9DSEFSQUNURVJfRVJSXCJcblx0XHRcdFx0LCBcIlRoZSB0b2tlbiBtdXN0IG5vdCBjb250YWluIHNwYWNlIGNoYXJhY3RlcnMuXCJcblx0XHRcdCk7XG5cdFx0fVxuXHRcdHJldHVybiBhcnJJbmRleE9mLmNhbGwoY2xhc3NMaXN0LCB0b2tlbik7XG5cdH1cblx0LCBDbGFzc0xpc3QgPSBmdW5jdGlvbiAoZWxlbSkge1xuXHRcdHZhclxuXHRcdFx0ICB0cmltbWVkQ2xhc3NlcyA9IHN0clRyaW0uY2FsbChlbGVtLmdldEF0dHJpYnV0ZShcImNsYXNzXCIpIHx8IFwiXCIpXG5cdFx0XHQsIGNsYXNzZXMgPSB0cmltbWVkQ2xhc3NlcyA/IHRyaW1tZWRDbGFzc2VzLnNwbGl0KC9cXHMrLykgOiBbXVxuXHRcdFx0LCBpID0gMFxuXHRcdFx0LCBsZW4gPSBjbGFzc2VzLmxlbmd0aFxuXHRcdDtcblx0XHRmb3IgKDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHR0aGlzLnB1c2goY2xhc3Nlc1tpXSk7XG5cdFx0fVxuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSA9IGZ1bmN0aW9uICgpIHtcblx0XHRcdGVsZW0uc2V0QXR0cmlidXRlKFwiY2xhc3NcIiwgdGhpcy50b1N0cmluZygpKTtcblx0XHR9O1xuXHR9XG5cdCwgY2xhc3NMaXN0UHJvdG8gPSBDbGFzc0xpc3RbcHJvdG9Qcm9wXSA9IFtdXG5cdCwgY2xhc3NMaXN0R2V0dGVyID0gZnVuY3Rpb24gKCkge1xuXHRcdHJldHVybiBuZXcgQ2xhc3NMaXN0KHRoaXMpO1xuXHR9XG47XG4vLyBNb3N0IERPTUV4Y2VwdGlvbiBpbXBsZW1lbnRhdGlvbnMgZG9uJ3QgYWxsb3cgY2FsbGluZyBET01FeGNlcHRpb24ncyB0b1N0cmluZygpXG4vLyBvbiBub24tRE9NRXhjZXB0aW9ucy4gRXJyb3IncyB0b1N0cmluZygpIGlzIHN1ZmZpY2llbnQgaGVyZS5cbkRPTUV4W3Byb3RvUHJvcF0gPSBFcnJvcltwcm90b1Byb3BdO1xuY2xhc3NMaXN0UHJvdG8uaXRlbSA9IGZ1bmN0aW9uIChpKSB7XG5cdHJldHVybiB0aGlzW2ldIHx8IG51bGw7XG59O1xuY2xhc3NMaXN0UHJvdG8uY29udGFpbnMgPSBmdW5jdGlvbiAodG9rZW4pIHtcblx0cmV0dXJuIH5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4gKyBcIlwiKTtcbn07XG5jbGFzc0xpc3RQcm90by5hZGQgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0O1xuXHRkbyB7XG5cdFx0dG9rZW4gPSB0b2tlbnNbaV0gKyBcIlwiO1xuXHRcdGlmICghfmNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbikpIHtcblx0XHRcdHRoaXMucHVzaCh0b2tlbik7XG5cdFx0XHR1cGRhdGVkID0gdHJ1ZTtcblx0XHR9XG5cdH1cblx0d2hpbGUgKCsraSA8IGwpO1xuXG5cdGlmICh1cGRhdGVkKSB7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZW1vdmUgPSBmdW5jdGlvbiAoKSB7XG5cdHZhclxuXHRcdCAgdG9rZW5zID0gYXJndW1lbnRzXG5cdFx0LCBpID0gMFxuXHRcdCwgbCA9IHRva2Vucy5sZW5ndGhcblx0XHQsIHRva2VuXG5cdFx0LCB1cGRhdGVkID0gZmFsc2Vcblx0XHQsIGluZGV4XG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0d2hpbGUgKH5pbmRleCkge1xuXHRcdFx0dGhpcy5zcGxpY2UoaW5kZXgsIDEpO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0XHRpbmRleCA9IGNoZWNrVG9rZW5BbmRHZXRJbmRleCh0aGlzLCB0b2tlbik7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8udG9nZ2xlID0gZnVuY3Rpb24gKHRva2VuLCBmb3JjZSkge1xuXHR2YXJcblx0XHQgIHJlc3VsdCA9IHRoaXMuY29udGFpbnModG9rZW4pXG5cdFx0LCBtZXRob2QgPSByZXN1bHQgP1xuXHRcdFx0Zm9yY2UgIT09IHRydWUgJiYgXCJyZW1vdmVcIlxuXHRcdDpcblx0XHRcdGZvcmNlICE9PSBmYWxzZSAmJiBcImFkZFwiXG5cdDtcblxuXHRpZiAobWV0aG9kKSB7XG5cdFx0dGhpc1ttZXRob2RdKHRva2VuKTtcblx0fVxuXG5cdGlmIChmb3JjZSA9PT0gdHJ1ZSB8fCBmb3JjZSA9PT0gZmFsc2UpIHtcblx0XHRyZXR1cm4gZm9yY2U7XG5cdH0gZWxzZSB7XG5cdFx0cmV0dXJuICFyZXN1bHQ7XG5cdH1cbn07XG5jbGFzc0xpc3RQcm90by5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHR2YXIgaW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodG9rZW4gKyBcIlwiKTtcblx0aWYgKH5pbmRleCkge1xuXHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxLCByZXBsYWNlbWVudF90b2tlbik7XG5cdFx0dGhpcy5fdXBkYXRlQ2xhc3NOYW1lKCk7XG5cdH1cbn1cbmNsYXNzTGlzdFByb3RvLnRvU3RyaW5nID0gZnVuY3Rpb24gKCkge1xuXHRyZXR1cm4gdGhpcy5qb2luKFwiIFwiKTtcbn07XG5cbmlmIChvYmpDdHIuZGVmaW5lUHJvcGVydHkpIHtcblx0dmFyIGNsYXNzTGlzdFByb3BEZXNjID0ge1xuXHRcdCAgZ2V0OiBjbGFzc0xpc3RHZXR0ZXJcblx0XHQsIGVudW1lcmFibGU6IHRydWVcblx0XHQsIGNvbmZpZ3VyYWJsZTogdHJ1ZVxuXHR9O1xuXHR0cnkge1xuXHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0fSBjYXRjaCAoZXgpIHsgLy8gSUUgOCBkb2Vzbid0IHN1cHBvcnQgZW51bWVyYWJsZTp0cnVlXG5cdFx0Ly8gYWRkaW5nIHVuZGVmaW5lZCB0byBmaWdodCB0aGlzIGlzc3VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9pc3N1ZXMvMzZcblx0XHQvLyBtb2Rlcm5pZSBJRTgtTVNXNyBtYWNoaW5lIGhhcyBJRTggOC4wLjYwMDEuMTg3MDIgYW5kIGlzIGFmZmVjdGVkXG5cdFx0aWYgKGV4Lm51bWJlciA9PT0gdW5kZWZpbmVkIHx8IGV4Lm51bWJlciA9PT0gLTB4N0ZGNUVDNTQpIHtcblx0XHRcdGNsYXNzTGlzdFByb3BEZXNjLmVudW1lcmFibGUgPSBmYWxzZTtcblx0XHRcdG9iakN0ci5kZWZpbmVQcm9wZXJ0eShlbGVtQ3RyUHJvdG8sIGNsYXNzTGlzdFByb3AsIGNsYXNzTGlzdFByb3BEZXNjKTtcblx0XHR9XG5cdH1cbn0gZWxzZSBpZiAob2JqQ3RyW3Byb3RvUHJvcF0uX19kZWZpbmVHZXR0ZXJfXykge1xuXHRlbGVtQ3RyUHJvdG8uX19kZWZpbmVHZXR0ZXJfXyhjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RHZXR0ZXIpO1xufVxuXG59KHNlbGYpKTtcblxufVxuXG4vLyBUaGVyZSBpcyBmdWxsIG9yIHBhcnRpYWwgbmF0aXZlIGNsYXNzTGlzdCBzdXBwb3J0LCBzbyBqdXN0IGNoZWNrIGlmIHdlIG5lZWRcbi8vIHRvIG5vcm1hbGl6ZSB0aGUgYWRkL3JlbW92ZSBhbmQgdG9nZ2xlIEFQSXMuXG5cbihmdW5jdGlvbiAoKSB7XG5cdFwidXNlIHN0cmljdFwiO1xuXG5cdHZhciB0ZXN0RWxlbWVudCA9IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnQoXCJfXCIpO1xuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC5hZGQoXCJjMVwiLCBcImMyXCIpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMC8xMSBhbmQgRmlyZWZveCA8MjYsIHdoZXJlIGNsYXNzTGlzdC5hZGQgYW5kXG5cdC8vIGNsYXNzTGlzdC5yZW1vdmUgZXhpc3QgYnV0IHN1cHBvcnQgb25seSBvbmUgYXJndW1lbnQgYXQgYSB0aW1lLlxuXHRpZiAoIXRlc3RFbGVtZW50LmNsYXNzTGlzdC5jb250YWlucyhcImMyXCIpKSB7XG5cdFx0dmFyIGNyZWF0ZU1ldGhvZCA9IGZ1bmN0aW9uKG1ldGhvZCkge1xuXHRcdFx0dmFyIG9yaWdpbmFsID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdO1xuXG5cdFx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlW21ldGhvZF0gPSBmdW5jdGlvbih0b2tlbikge1xuXHRcdFx0XHR2YXIgaSwgbGVuID0gYXJndW1lbnRzLmxlbmd0aDtcblxuXHRcdFx0XHRmb3IgKGkgPSAwOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdFx0XHR0b2tlbiA9IGFyZ3VtZW50c1tpXTtcblx0XHRcdFx0XHRvcmlnaW5hbC5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdFx0fVxuXHRcdFx0fTtcblx0XHR9O1xuXHRcdGNyZWF0ZU1ldGhvZCgnYWRkJyk7XG5cdFx0Y3JlYXRlTWV0aG9kKCdyZW1vdmUnKTtcblx0fVxuXG5cdHRlc3RFbGVtZW50LmNsYXNzTGlzdC50b2dnbGUoXCJjM1wiLCBmYWxzZSk7XG5cblx0Ly8gUG9seWZpbGwgZm9yIElFIDEwIGFuZCBGaXJlZm94IDwyNCwgd2hlcmUgY2xhc3NMaXN0LnRvZ2dsZSBkb2VzIG5vdFxuXHQvLyBzdXBwb3J0IHRoZSBzZWNvbmQgYXJndW1lbnQuXG5cdGlmICh0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjM1wiKSkge1xuXHRcdHZhciBfdG9nZ2xlID0gRE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGU7XG5cblx0XHRET01Ub2tlbkxpc3QucHJvdG90eXBlLnRvZ2dsZSA9IGZ1bmN0aW9uKHRva2VuLCBmb3JjZSkge1xuXHRcdFx0aWYgKDEgaW4gYXJndW1lbnRzICYmICF0aGlzLmNvbnRhaW5zKHRva2VuKSA9PT0gIWZvcmNlKSB7XG5cdFx0XHRcdHJldHVybiBmb3JjZTtcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdHJldHVybiBfdG9nZ2xlLmNhbGwodGhpcywgdG9rZW4pO1xuXHRcdFx0fVxuXHRcdH07XG5cblx0fVxuXG5cdC8vIHJlcGxhY2UoKSBwb2x5ZmlsbFxuXHRpZiAoIShcInJlcGxhY2VcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKS5jbGFzc0xpc3QpKSB7XG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS5yZXBsYWNlID0gZnVuY3Rpb24gKHRva2VuLCByZXBsYWNlbWVudF90b2tlbikge1xuXHRcdFx0dmFyXG5cdFx0XHRcdCAgdG9rZW5zID0gdGhpcy50b1N0cmluZygpLnNwbGl0KFwiIFwiKVxuXHRcdFx0XHQsIGluZGV4ID0gdG9rZW5zLmluZGV4T2YodG9rZW4gKyBcIlwiKVxuXHRcdFx0O1xuXHRcdFx0aWYgKH5pbmRleCkge1xuXHRcdFx0XHR0b2tlbnMgPSB0b2tlbnMuc2xpY2UoaW5kZXgpO1xuXHRcdFx0XHR0aGlzLnJlbW92ZS5hcHBseSh0aGlzLCB0b2tlbnMpO1xuXHRcdFx0XHR0aGlzLmFkZChyZXBsYWNlbWVudF90b2tlbik7XG5cdFx0XHRcdHRoaXMuYWRkLmFwcGx5KHRoaXMsIHRva2Vucy5zbGljZSgxKSk7XG5cdFx0XHR9XG5cdFx0fVxuXHR9XG5cblx0dGVzdEVsZW1lbnQgPSBudWxsO1xufSgpKTtcblxufSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG5cbiAgICAgICAgJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgY29sbGVjdGlvbiAke3BhcmFtcy5jb2xsX25hbWV9IHRvIHlvdXIgbGlzdC5gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJChcImFbZGF0YS10b2dnbGUqPWRvd25sb2FkXVwiKS5hZGRDbGFzcyhcImludGVyYWN0aXZlXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGJvb3Rib3guaGlkZUFsbCgpO1xuICAgICAgICAgICAgaWYgKCAkKHRoaXMpLmF0dHIoXCJyZWxcIikgPT0gJ2FsbG93JyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbXMuZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSA9PSBudWxsICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5kb3dubG9hZFBkZih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsYWluUGRmQWNjZXNzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgfSxcblxuICAgIGV4cGxhaW5QZGZBY2Nlc3M6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkKFwiI25vRG93bmxvYWRBY2Nlc3NcIikuaHRtbCgpO1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7RE9XTkxPQURfTElOS30nLCAkKHRoaXMpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgdGhpcy4kZGlhbG9nID0gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgLy8gdGhpcy4kZGlhbG9nLmFkZENsYXNzKFwibG9naW5cIik7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi4kbGluayA9ICQobGluayk7XG4gICAgICAgIHNlbGYuc3JjID0gJChsaW5rKS5hdHRyKCdocmVmJyk7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9ICQobGluaykuZGF0YSgndGl0bGUnKSB8fCAnUERGJztcblxuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgncmFuZ2UnKSA9PSAneWVzJyApIHtcbiAgICAgICAgICAgIGlmICggISBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgIC8vICc8cD5CdWlsZGluZyB5b3VyIFBERi4uLjwvcD4nICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiaW5pdGlhbFwiPjxwPlNldHRpbmcgdXAgdGhlIGRvd25sb2FkLi4uPC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIC8vICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtc3VjY2VzcyBkb25lIGhpZGVcIj4nICtcbiAgICAgICAgICAgIC8vICAgICAnPHA+QWxsIGRvbmUhPC9wPicgK1xuICAgICAgICAgICAgLy8gJzwvZGl2PicgKyBcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFRpbWVcIiB0YXJnZXQ9XCJfYmxhbmtcIj5XaGF0IGFmZmVjdHMgdGhlIGRvd25sb2FkIHNwZWVkPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcycsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uYClcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmJhclwiKS5jc3MoeyB3aWR0aCA6IHBlcmNlbnQgKyAnJSd9KTtcblxuICAgICAgICBpZiAoIHBlcmNlbnQgPT0gMTAwICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikuaGlkZSgpO1xuICAgICAgICAgICAgdmFyIGRvd25sb2FkX2tleSA9IG5hdmlnYXRvci51c2VyQWdlbnQuaW5kZXhPZignTWFjIE9TIFgnKSAhPSAtMSA/ICdSRVRVUk4nIDogJ0VOVEVSJztcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xhc3M9XCJvZmZzY3JlZW5cIj5TZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLjwvc3Bhbj48L3A+YCk7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBbGwgZG9uZSEgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBTZWxlY3QgJHtkb3dubG9hZF9rZXl9IHRvIGRvd25sb2FkLmApO1xuXG4gICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuZmluZChcIi5kb25lXCIpLnNob3coKTtcbiAgICAgICAgICAgIHZhciAkZG93bmxvYWRfYnRuID0gc2VsZi4kZGlhbG9nLmZpbmQoJy5kb3dubG9hZC1wZGYnKTtcbiAgICAgICAgICAgIGlmICggISAkZG93bmxvYWRfYnRuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuID0gJCgnPGEgY2xhc3M9XCJkb3dubG9hZC1wZGYgYnRuIGJ0bi1wcmltYXJ5XCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hcHBlbmRUbyhzZWxmLiRkaWFsb2cuZmluZChcIi5tb2RhbF9fZm9vdGVyXCIpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGxpbmsudHJpZ2dlcihcImNsaWNrLmdvb2dsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhULnJlYWRlci5lbWl0KCdkb3dubG9hZERvbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuYCk7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGAke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZGApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIGFuZCBkbyB0aGlzIGhlcmVcbiAgICAkKFwiI3NlbGVjdGVkUGFnZXNQZGZMaW5rXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBwcmludGFibGUgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKCBwcmludGFibGUubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBwcmludC48L3A+XCIgXTtcbiAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYXBwZWFyIGluIHRoZSBzZWxlY3Rpb24gY29udGVudHMgPGJ1dHRvbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgYm9yZGVyLWNvbG9yOiAjZWVlXFxcIiBjbGFzcz1cXFwiYnRuIHNxdWFyZVxcXCI+PGkgY2xhc3M9XFxcImljb21vb24gaWNvbW9vbi1wYXBlcnNcXFwiIHN0eWxlPVxcXCJjb2xvcjogd2hpdGU7IGZvbnQtc2l6ZTogMTRweDtcXFwiIC8+PC9idXR0b24+XCIpO1xuXG4gICAgICAgICAgICBtc2cgPSBtc2cuam9pbihcIlxcblwiKTtcblxuICAgICAgICAgICAgYnV0dG9ucy5wdXNoKHtcbiAgICAgICAgICAgICAgICBsYWJlbDogXCJPS1wiLFxuICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIGJvb3Rib3guZGlhbG9nKG1zZywgYnV0dG9ucyk7XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH1cblxuXG4gICAgICAgIHZhciBzZXEgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24ocHJpbnRhYmxlKTtcblxuICAgICAgICAkKHRoaXMpLmRhdGEoJ3NlcScsIHNlcSk7XG4gICAgICAgIEhULmRvd25sb2FkZXIuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgfSk7XG5cbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBjcmVhdGluZyBhbiBlbWJlZGRhYmxlIFVSTFxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBzaWRlX3Nob3J0ID0gXCI0NTBcIjtcbiAgICB2YXIgc2lkZV9sb25nICA9IFwiNzAwXCI7XG4gICAgdmFyIGh0SWQgPSBIVC5wYXJhbXMuaWQ7XG4gICAgdmFyIGVtYmVkSGVscExpbmsgPSBcImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2VtYmVkXCI7XG5cbiAgICB2YXIgY29kZWJsb2NrX3R4dDtcbiAgICB2YXIgY29kZWJsb2NrX3R4dF9hID0gZnVuY3Rpb24odyxoKSB7cmV0dXJuICc8aWZyYW1lIHdpZHRoPVwiJyArIHcgKyAnXCIgaGVpZ2h0PVwiJyArIGggKyAnXCIgJzt9XG4gICAgdmFyIGNvZGVibG9ja190eHRfYiA9ICdzcmM9XCJodHRwczovL2hkbC5oYW5kbGUubmV0LzIwMjcvJyArIGh0SWQgKyAnP3VybGFwcGVuZD0lM0J1aT1lbWJlZFwiPjwvaWZyYW1lPic7XG5cbiAgICB2YXIgJGJsb2NrID0gJChcbiAgICAnPGRpdiBjbGFzcz1cImVtYmVkVXJsQ29udGFpbmVyXCI+JyArXG4gICAgICAgICc8aDM+RW1iZWQgVGhpcyBCb29rICcgK1xuICAgICAgICAgICAgJzxhIGlkPVwiZW1iZWRIZWxwSWNvblwiIGRlZmF1bHQtZm9ybT1cImRhdGEtZGVmYXVsdC1mb3JtXCIgJyArXG4gICAgICAgICAgICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj48aSBjbGFzcz1cImljb21vb24gaWNvbW9vbi1oZWxwXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+PC9pPjxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+SGVscDogRW1iZWRkaW5nIEhhdGhpVHJ1c3QgQm9va3M8L3NwYW4+PC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctc2Nyb2xsXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1zY3JvbGxcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInZpZXdcIiBpZD1cInZpZXctZmxpcFwiIHZhbHVlPVwiMVwiID4nICtcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJ2aWV3LWZsaXBcIj4nICtcbiAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgTWlzc2luZyBwYXJ0cyBvZiB0aGUgcGFnZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBUaGlzIGl0ZW0gaXMgaW4gdGhlIHB1YmxpYyBkb21haW4sIGJ1dCBJIGRvblxcJ3QgaGF2ZSBhY2Nlc3MgdG8gaXQuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJhY2Nlc3NcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKS5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRmb3JtID0gJCh0aGlzKTtcbiAgICB2YXIgJHN1Ym1pdCA9ICRmb3JtLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkc3VibWl0LnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgfSlcblxuICAgIHJldHVybiB0cnVlO1xuICB9KVxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgJChcIiN2ZXJzaW9uSWNvblwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
