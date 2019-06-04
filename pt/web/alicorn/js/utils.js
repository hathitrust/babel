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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImNsYXNzTGlzdC5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ2xvYmFsX3NlYXJjaC5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJzZWFyY2hfaW5faXRlbS5qcyIsInNvY2lhbF9saW5rcy5qcyIsInZlcnNpb25fcG9wdXAuanMiXSwibmFtZXMiOlsiZmFjdG9yeSIsImRlZmluZSIsImFtZCIsImpRdWVyeSIsIiQiLCJ1bmRlZmluZWQiLCJ0YWcyYXR0ciIsImEiLCJpbWciLCJmb3JtIiwiYmFzZSIsInNjcmlwdCIsImlmcmFtZSIsImxpbmsiLCJrZXkiLCJhbGlhc2VzIiwicGFyc2VyIiwic3RyaWN0IiwibG9vc2UiLCJ0b1N0cmluZyIsIk9iamVjdCIsInByb3RvdHlwZSIsImlzaW50IiwicGFyc2VVcmkiLCJ1cmwiLCJzdHJpY3RNb2RlIiwic3RyIiwiZGVjb2RlVVJJIiwicmVzIiwiZXhlYyIsInVyaSIsImF0dHIiLCJwYXJhbSIsInNlZyIsImkiLCJwYXJzZVN0cmluZyIsInBhdGgiLCJyZXBsYWNlIiwic3BsaXQiLCJmcmFnbWVudCIsImhvc3QiLCJwcm90b2NvbCIsInBvcnQiLCJnZXRBdHRyTmFtZSIsImVsbSIsInRuIiwidGFnTmFtZSIsInRvTG93ZXJDYXNlIiwicHJvbW90ZSIsInBhcmVudCIsImxlbmd0aCIsInQiLCJwYXJzZSIsInBhcnRzIiwidmFsIiwicGFydCIsInNoaWZ0IiwiaXNBcnJheSIsInB1c2giLCJvYmoiLCJrZXlzIiwiaW5kZXhPZiIsInN1YnN0ciIsInRlc3QiLCJtZXJnZSIsImxlbiIsImxhc3QiLCJrIiwic2V0IiwicmVkdWNlIiwiU3RyaW5nIiwicmV0IiwicGFpciIsImRlY29kZVVSSUNvbXBvbmVudCIsImUiLCJlcWwiLCJicmFjZSIsImxhc3RCcmFjZUluS2V5IiwidiIsImMiLCJhY2N1bXVsYXRvciIsImwiLCJjdXJyIiwiYXJndW1lbnRzIiwiY2FsbCIsInZBcmciLCJwcm9wIiwiaGFzT3duUHJvcGVydHkiLCJwdXJsIiwid2luZG93IiwibG9jYXRpb24iLCJkYXRhIiwicXVlcnkiLCJmcGFyYW0iLCJzZWdtZW50IiwiZnNlZ21lbnQiLCJmbiIsIkhUIiwiaGVhZCIsInJlYWR5IiwiJHN0YXR1cyIsImxhc3RNZXNzYWdlIiwibGFzdFRpbWVyIiwidXBkYXRlX3N0YXR1cyIsIm1lc3NhZ2UiLCJjbGVhclRpbWVvdXQiLCJzZXRUaW1lb3V0IiwidGV4dCIsImNvbnNvbGUiLCJsb2ciLCJnZXQiLCJpbm5lclRleHQiLCJzZWxmIiwiZG9jdW1lbnQiLCJjcmVhdGVFbGVtZW50IiwiY3JlYXRlRWxlbWVudE5TIiwidmlldyIsImNsYXNzTGlzdFByb3AiLCJwcm90b1Byb3AiLCJlbGVtQ3RyUHJvdG8iLCJFbGVtZW50Iiwib2JqQ3RyIiwic3RyVHJpbSIsInRyaW0iLCJhcnJJbmRleE9mIiwiQXJyYXkiLCJpdGVtIiwiRE9NRXgiLCJ0eXBlIiwibmFtZSIsImNvZGUiLCJET01FeGNlcHRpb24iLCJjaGVja1Rva2VuQW5kR2V0SW5kZXgiLCJjbGFzc0xpc3QiLCJ0b2tlbiIsIkNsYXNzTGlzdCIsImVsZW0iLCJ0cmltbWVkQ2xhc3NlcyIsImdldEF0dHJpYnV0ZSIsImNsYXNzZXMiLCJfdXBkYXRlQ2xhc3NOYW1lIiwic2V0QXR0cmlidXRlIiwiY2xhc3NMaXN0UHJvdG8iLCJjbGFzc0xpc3RHZXR0ZXIiLCJFcnJvciIsImNvbnRhaW5zIiwiYWRkIiwidG9rZW5zIiwidXBkYXRlZCIsInJlbW92ZSIsImluZGV4Iiwic3BsaWNlIiwidG9nZ2xlIiwiZm9yY2UiLCJyZXN1bHQiLCJtZXRob2QiLCJyZXBsYWNlbWVudF90b2tlbiIsImpvaW4iLCJkZWZpbmVQcm9wZXJ0eSIsImNsYXNzTGlzdFByb3BEZXNjIiwiZW51bWVyYWJsZSIsImNvbmZpZ3VyYWJsZSIsImV4IiwibnVtYmVyIiwiX19kZWZpbmVHZXR0ZXJfXyIsInRlc3RFbGVtZW50IiwiY3JlYXRlTWV0aG9kIiwib3JpZ2luYWwiLCJET01Ub2tlbkxpc3QiLCJfdG9nZ2xlIiwic2xpY2UiLCJhcHBseSIsIkRFRkFVTFRfQ09MTF9NRU5VX09QVElPTiIsIk5FV19DT0xMX01FTlVfT1BUSU9OIiwiSU5fWU9VUl9DT0xMU19MQUJFTCIsIiR0b29sYmFyIiwiJGVycm9ybXNnIiwiJGluZm9tc2ciLCJkaXNwbGF5X2Vycm9yIiwibXNnIiwiaW5zZXJ0QWZ0ZXIiLCJzaG93IiwiZGlzcGxheV9pbmZvIiwiaGlkZV9lcnJvciIsImhpZGUiLCJoaWRlX2luZm8iLCJnZXRfdXJsIiwicGF0aG5hbWUiLCJwYXJzZV9saW5lIiwicmV0dmFsIiwidG1wIiwia3YiLCJlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEiLCJhcmdzIiwib3B0aW9ucyIsImV4dGVuZCIsImNyZWF0aW5nIiwibGFiZWwiLCIkYmxvY2siLCJjbiIsImZpbmQiLCJkZXNjIiwic2hyZCIsImxvZ2luX3N0YXR1cyIsImxvZ2dlZF9pbiIsImFwcGVuZFRvIiwiJGhpZGRlbiIsImNsb25lIiwiaWlkIiwiJGRpYWxvZyIsImJvb3Rib3giLCJkaWFsb2ciLCJjYWxsYmFjayIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInN1Ym1pdF9wb3N0IiwiZWFjaCIsIiR0aGlzIiwiJGNvdW50IiwibGltaXQiLCJiaW5kIiwicGFyYW1zIiwicGFnZSIsImlkIiwiYWpheCIsImRvbmUiLCJhZGRfaXRlbV90b19jb2xsaXN0IiwiZmFpbCIsImpxWEhSIiwidGV4dFN0YXR1cyIsImVycm9yVGhyb3duIiwiJHVsIiwiY29sbF9ocmVmIiwiY29sbF9pZCIsIiRhIiwiY29sbF9uYW1lIiwiYXBwZW5kIiwiJG9wdGlvbiIsImNvbmZpcm1fbGFyZ2UiLCJjb2xsU2l6ZSIsImFkZE51bUl0ZW1zIiwibnVtU3RyIiwiY29uZmlybSIsImFuc3dlciIsImNsaWNrIiwicHJldmVudERlZmF1bHQiLCJhY3Rpb24iLCJzZWxlY3RlZF9jb2xsZWN0aW9uX2lkIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lIiwiYzIiLCJpcyIsImNybXNfc3RhdGUiLCJocmVmIiwiJGRpdiIsIiRwIiwiJGxpbmsiLCJEb3dubG9hZGVyIiwiaW5pdCIsInBkZiIsInN0YXJ0IiwiYmluZEV2ZW50cyIsImFkZENsYXNzIiwiaGlkZUFsbCIsImRvd25sb2FkX3Byb2dyZXNzX2Jhc2UiLCJkb3dubG9hZFBkZiIsImV4cGxhaW5QZGZBY2Nlc3MiLCJodG1sIiwiYWxlcnQiLCJzcmMiLCJpdGVtX3RpdGxlIiwiaGVhZGVyIiwidG90YWwiLCJzdWZmaXgiLCJjbG9zZU1vZGFsIiwiZGF0YVR5cGUiLCJjYWNoZSIsImVycm9yIiwicmVxIiwic3RhdHVzIiwiZGlzcGxheVdhcm5pbmciLCJkaXNwbGF5RXJyb3IiLCJyZXF1ZXN0RG93bmxvYWQiLCJjYW5jZWxEb3dubG9hZCIsInByb2dyZXNzX3VybCIsImRvd25sb2FkX3VybCIsImNsZWFyVGltZXIiLCJzdGFydERvd25sb2FkTW9uaXRvciIsInRpbWVyIiwiaXNfcnVubmluZyIsIm51bV9wcm9jZXNzZWQiLCJzZXRJbnRlcnZhbCIsImNoZWNrU3RhdHVzIiwidHMiLCJEYXRlIiwiZ2V0VGltZSIsInN1Y2Nlc3MiLCJ1cGRhdGVQcm9ncmVzcyIsIm51bV9hdHRlbXB0cyIsImRpc3BsYXlQcm9jZXNzRXJyb3IiLCJsb2dFcnJvciIsInBlcmNlbnQiLCJjdXJyZW50IiwiY3VycmVudF9wYWdlIiwibGFzdF9wZXJjZW50IiwicmVtb3ZlQ2xhc3MiLCJjc3MiLCJ3aWR0aCIsImRvd25sb2FkX2tleSIsIm5hdmlnYXRvciIsInVzZXJBZ2VudCIsIiRkb3dubG9hZF9idG4iLCJvbiIsInRyaWdnZXIiLCJyZWFkZXIiLCJjb250cm9scyIsInNlbGVjdGluYXRvciIsIl9jbGVhclNlbGVjdGlvbiIsInN0b3BQcm9wYWdhdGlvbiIsImZvY3VzIiwiTWF0aCIsImNlaWwiLCJjbGVhckludGVydmFsIiwidGltZW91dCIsInBhcnNlSW50IiwiZ2V0UmVzcG9uc2VIZWFkZXIiLCJyYXRlIiwibm93IiwiY291bnRkb3duIiwiY291bnRkb3duX3RpbWVyIiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0IiwiY29kZWJsb2NrX3R4dF9hIiwidyIsImgiLCJjb2RlYmxvY2tfdHh0X2IiLCJjbG9zZXN0IiwidGV4dGFyZWEiLCJzZWxlY3QiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwiYW5hbHl0aWNzIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0IiwiZXZlbnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJfc2ltcGxpZnlQYWdlSHJlZiIsIm5ld19ocmVmIiwicXMiLCJnZXRQYWdlSHJlZiIsIiRzdWJtaXQiLCJoYXNDbGFzcyIsInJlbW92ZUF0dHIiLCJwcmVmaXgiLCJjbGFzc1ByZWZpeCIsIm9wZW5DbGFzcyIsImlzSHR0cHMiLCJzZXJ2aWNlcyIsImZhY2Vib29rIiwiY291bnRlclVybCIsImNvbnZlcnROdW1iZXIiLCJ0b3RhbF9jb3VudCIsInBvcHVwVXJsIiwicG9wdXBXaWR0aCIsInBvcHVwSGVpZ2h0IiwidHdpdHRlciIsImNvdW50IiwidGl0bGUiLCJtYWlscnUiLCJzaGFyZXMiLCJ2a29udGFrdGUiLCJjb3VudGVyIiwianNvblVybCIsImRlZmVycmVkIiwiXyIsIlZLIiwiU2hhcmUiLCJpZHgiLCJyZXNvbHZlIiwiZ2V0U2NyaXB0IiwibWFrZVVybCIsInJlamVjdCIsIm9kbm9rbGFzc25pa2kiLCJPREtMIiwidXBkYXRlQ291bnQiLCJwbHVzb25lIiwiZ3BsdXMiLCJjYiIsInBpbnRlcmVzdCIsInR1bWJsciIsInBvcHVwVXJsMSIsInBvcHVwVXJsMiIsIndpZGdldCIsInJlZGRpdCIsInNvY2lhbExpbmtzIiwiaW5zdGFuY2UiLCJpc1BsYWluT2JqZWN0IiwidXBkYXRlIiwiZGVmYXVsdHMiLCJkYXRhVG9PcHRpb25zIiwicG9zdF90aXRsZSIsImluQXJyYXkiLCJwb3AiLCJoYXNoIiwiY291bnRlcnMiLCJ6ZXJvZXMiLCJ3YWl0IiwicG9wdXBDaGVja0ludGVydmFsIiwic2luZ2xlVGl0bGUiLCJjb250YWluZXIiLCJpbml0VXNlckJ1dHRvbnMiLCJjaGlsZHJlbiIsInByb3h5IiwiYnV0dG9uIiwiQnV0dG9uIiwidXNlckJ1dHRvbkluaXRlZCIsInNvY2lhbExpbmtzQnV0dG9ucyIsImFwcGVhciIsInNpbGVudCIsImRldGVjdFNlcnZpY2UiLCJzZXJ2aWNlIiwiZGV0ZWN0UGFyYW1zIiwiaW5pdEh0bWwiLCJpbml0Q291bnRlciIsImZvcmNlVXBkYXRlIiwibm9kZSIsImNsYXNzTmFtZSIsImNsYXNzSWR4IiwiY2xzIiwiaXNOYU4iLCJjb3VudGVyTnVtYmVyIiwiY2xpY2tVcmwiLCJjbG9uZURhdGFBdHRycyIsInJlcGxhY2VXaXRoIiwiX3dpZGdldCIsImRhdGFzZXQiLCJyb2xlIiwibWljcm90aXBQb3NpdGlvbiIsIm1pY3JvdGlwU2l6ZSIsInNvdXJjZSIsImRlc3RpbmF0aW9uIiwiZ2V0RWxlbWVudENsYXNzTmFtZXMiLCJ1cGRhdGVDb3VudGVyIiwiY291bnRlckVsZW0iLCJwcm9jZXNzIiwiaXNGdW5jdGlvbiIsImNvbnRleHQiLCJtZWRpYSIsImFkZEFkZGl0aW9uYWxQYXJhbXNUb1VybCIsIm9wZW5Qb3B1cCIsImhlaWdodCIsImlzRW1wdHlPYmplY3QiLCJnbHVlIiwibGVmdCIsInJvdW5kIiwic2NyZWVuIiwidG9wIiwid2luIiwib3BlbiIsImNsb3NlZCIsInVwcGVyIiwibSIsInRvVXBwZXIiLCJ0ZW1wbGF0ZSIsImVuY29kZVVSSUNvbXBvbmVudCIsInRtcGwiLCJmaWx0ZXIiLCJtb2QiLCJjbG9zZU9uQ2xpY2siLCJoYW5kbGVyIiwid2hpY2giLCJkb2MiLCJvZmYiLCJldmVudHMiLCJzaG93SW5WaWV3cG9ydCIsIm9mZnNldCIsImRvY3VtZW50RWxlbWVudCIsImdldEJvdW5kaW5nQ2xpZW50UmVjdCIsInJlY3QiLCJyaWdodCIsImlubmVyV2lkdGgiLCJib3R0b20iLCJpbm5lckhlaWdodCJdLCJtYXBwaW5ncyI6Ijs7OztBQUFBOzs7Ozs7O0FBT0EsQ0FBQyxDQUFDLFVBQVNBLE9BQVQsRUFBa0I7QUFDbkIsS0FBSSxPQUFPQyxNQUFQLEtBQWtCLFVBQWxCLElBQWdDQSxPQUFPQyxHQUEzQyxFQUFnRDtBQUMvQztBQUNBLE1BQUssT0FBT0MsTUFBUCxLQUFrQixXQUF2QixFQUFxQztBQUNwQ0YsVUFBTyxDQUFDLFFBQUQsQ0FBUCxFQUFtQkQsT0FBbkI7QUFDQSxHQUZELE1BRU87QUFDTkMsVUFBTyxFQUFQLEVBQVdELE9BQVg7QUFDQTtBQUNELEVBUEQsTUFPTztBQUNOO0FBQ0EsTUFBSyxPQUFPRyxNQUFQLEtBQWtCLFdBQXZCLEVBQXFDO0FBQ3BDSCxXQUFRRyxNQUFSO0FBQ0EsR0FGRCxNQUVPO0FBQ05IO0FBQ0E7QUFDRDtBQUNELENBaEJBLEVBZ0JFLFVBQVNJLENBQVQsRUFBWUMsU0FBWixFQUF1Qjs7QUFFekIsS0FBSUMsV0FBVztBQUNiQyxLQUFVLE1BREc7QUFFYkMsT0FBVSxLQUZHO0FBR2JDLFFBQVUsUUFIRztBQUliQyxRQUFVLE1BSkc7QUFLYkMsVUFBVSxLQUxHO0FBTWJDLFVBQVUs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SCxLQUZEO0FBSUgsQ0E3Z0JBLENBQUQ7OztBQ2RBelUsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCL0YsTUFBRSxjQUFGLEVBQWtCZ1AsS0FBbEIsQ0FBd0IsVUFBUzFLLENBQVQsRUFBWTtBQUNoQ0EsVUFBRTJLLGNBQUY7QUFDQW5DLGdCQUFReUQsS0FBUixDQUFjLG9ZQUFkO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IFVSTCBQYXJzZXIgcGx1Z2luLCB2Mi4yLjFcbiAqIERldmVsb3BlZCBhbmQgbWFpbnRhbmluZWQgYnkgTWFyayBQZXJraW5zLCBtYXJrQGFsbG1hcmtlZHVwLmNvbVxuICogU291cmNlIHJlcG9zaXRvcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlclxuICogTGljZW5zZWQgdW5kZXIgYW4gTUlULXN0eWxlIGxpY2Vuc2UuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXIvYmxvYi9tYXN0ZXIvTElDRU5TRSBmb3IgZGV0YWlscy5cbiAqLyBcblxuOyhmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQgYXZhaWxhYmxlOyB1c2UgYW5vbnltb3VzIG1vZHVsZVxuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gTm8gQU1EIGF2YWlsYWJsZTsgbXV0YXRlIGdsb2JhbCB2YXJzXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGZhY3RvcnkoalF1ZXJ5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmFjdG9yeSgpO1xuXHRcdH1cblx0fVxufSkoZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cdFxuXHR2YXIgdGFnMmF0dHIgPSB7XG5cdFx0XHRhICAgICAgIDogJ2hyZWYnLFxuXHRcdFx0aW1nICAgICA6ICdzcmMnLFxuXHRcdFx0Zm9ybSAgICA6ICdhY3Rpb24nLFxuXHRcdFx0YmFzZSAgICA6ICdocmVmJyxcblx0XHRcdHNjcmlwdCAgOiAnc3JjJyxcblx0XHRcdGlmcmFtZSAgOiAnc3JjJyxcblx0XHRcdGxpbmsgICAgOiAnaHJlZidcblx0XHR9LFxuXHRcdFxuXHRcdGtleSA9IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2ZyYWdtZW50J10sIC8vIGtleXMgYXZhaWxhYmxlIHRvIHF1ZXJ5XG5cdFx0XG5cdFx0YWxpYXNlcyA9IHsgJ2FuY2hvcicgOiAnZnJhZ21lbnQnIH0sIC8vIGFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG5cdFx0XG5cdFx0cGFyc2VyID0ge1xuXHRcdFx0c3RyaWN0IDogL14oPzooW146XFwvPyNdKyk6KT8oPzpcXC9cXC8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLCAgLy9sZXNzIGludHVpdGl2ZSwgbW9yZSBhY2N1cmF0ZSB0byB0aGUgc3BlY3Ncblx0XHRcdGxvb3NlIDogIC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvIC8vIG1vcmUgaW50dWl0aXZlLCBmYWlscyBvbiByZWxhdGl2ZSBwYXRocyBhbmQgZGV2aWF0ZXMgZnJvbSBzcGVjc1xuXHRcdH0sXG5cdFx0XG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdFxuXHRcdGlzaW50ID0gL15bMC05XSskLztcblx0XG5cdGZ1bmN0aW9uIHBhcnNlVXJpKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0dmFyIHN0ciA9IGRlY29kZVVSSSggdXJsICksXG5cdFx0cmVzICAgPSBwYXJzZXJbIHN0cmljdE1vZGUgfHwgZmFsc2UgPyAnc3RyaWN0JyA6ICdsb29zZScgXS5leGVjKCBzdHIgKSxcblx0XHR1cmkgPSB7IGF0dHIgOiB7fSwgcGFyYW0gOiB7fSwgc2VnIDoge30gfSxcblx0XHRpICAgPSAxNDtcblx0XHRcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHVyaS5hdHRyWyBrZXlbaV0gXSA9IHJlc1tpXSB8fCAnJztcblx0XHR9XG5cdFx0XG5cdFx0Ly8gYnVpbGQgcXVlcnkgYW5kIGZyYWdtZW50IHBhcmFtZXRlcnNcdFx0XG5cdFx0dXJpLnBhcmFtWydxdWVyeSddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ3F1ZXJ5J10pO1xuXHRcdHVyaS5wYXJhbVsnZnJhZ21lbnQnXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydmcmFnbWVudCddKTtcblx0XHRcblx0XHQvLyBzcGxpdCBwYXRoIGFuZCBmcmFnZW1lbnQgaW50byBzZWdtZW50c1x0XHRcblx0XHR1cmkuc2VnWydwYXRoJ10gPSB1cmkuYXR0ci5wYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7ICAgICBcblx0XHR1cmkuc2VnWydmcmFnbWVudCddID0gdXJpLmF0dHIuZnJhZ21lbnQucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTtcblx0XHRcblx0XHQvLyBjb21waWxlIGEgJ2Jhc2UnIGRvbWFpbiBhdHRyaWJ1dGUgICAgICAgIFxuXHRcdHVyaS5hdHRyWydiYXNlJ10gPSB1cmkuYXR0ci5ob3N0ID8gKHVyaS5hdHRyLnByb3RvY29sID8gIHVyaS5hdHRyLnByb3RvY29sKyc6Ly8nK3VyaS5hdHRyLmhvc3QgOiB1cmkuYXR0ci5ob3N0KSArICh1cmkuYXR0ci5wb3J0ID8gJzonK3VyaS5hdHRyLnBvcnQgOiAnJykgOiAnJzsgICAgICBcblx0XHQgIFxuXHRcdHJldHVybiB1cmk7XG5cdH07XG5cdFxuXHRmdW5jdGlvbiBnZXRBdHRyTmFtZSggZWxtICkge1xuXHRcdHZhciB0biA9IGVsbS50YWdOYW1lO1xuXHRcdGlmICggdHlwZW9mIHRuICE9PSAndW5kZWZpbmVkJyApIHJldHVybiB0YWcyYXR0clt0bi50b0xvd2VyQ2FzZSgpXTtcblx0XHRyZXR1cm4gdG47XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHByb21vdGUocGFyZW50LCBrZXkpIHtcblx0XHRpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuXHRcdHZhciB0ID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBwYXJlbnRba2V5XSkgdFtpXSA9IHBhcmVudFtrZXldW2ldO1xuXHRcdHBhcmVudFtrZXldID0gdDtcblx0XHRyZXR1cm4gdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdGlmICghcGFydCkge1xuXHRcdFx0aWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldLnB1c2godmFsKTtcblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG5cdFx0XHRpZiAoJ10nID09IHBhcnQpIHtcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRcdGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuXHRcdFx0XHRcdG9ialtrZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh+cGFydC5pbmRleE9mKCddJykpIHtcblx0XHRcdFx0cGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0XHQvLyBrZXlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHRpZiAofmtleS5pbmRleE9mKCddJykpIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0bGFzdCA9IGxlbiAtIDE7XG5cdFx0XHRwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG5cdFx0XHRcdHZhciB0ID0ge307XG5cdFx0XHRcdGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcblx0XHRcdFx0cGFyZW50LmJhc2UgPSB0O1xuXHRcdFx0fVxuXHRcdFx0c2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcblx0XHRyZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KC8mfDsvKSwgZnVuY3Rpb24ocmV0LCBwYWlyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYWlyID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdC8vIGlnbm9yZVxuXHRcdFx0fVxuXHRcdFx0dmFyIGVxbCA9IHBhaXIuaW5kZXhPZignPScpLFxuXHRcdFx0XHRicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpLFxuXHRcdFx0XHRrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpLFxuXHRcdFx0XHR2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKSxcblx0XHRcdFx0dmFsID0gdmFsLnN1YnN0cih2YWwuaW5kZXhPZignPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cblx0XHRcdGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuXG5cdFx0XHRyZXR1cm4gbWVyZ2UocmV0LCBrZXksIHZhbCk7XG5cdFx0fSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuXHRcdHZhciB2ID0gb2JqW2tleV07XG5cdFx0aWYgKHVuZGVmaW5lZCA9PT0gdikge1xuXHRcdFx0b2JqW2tleV0gPSB2YWw7XG5cdFx0fSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG5cdFx0XHR2LnB1c2godmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2JqW2tleV0gPSBbdiwgdmFsXTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuXHRcdHZhciBsZW4gPSBzdHIubGVuZ3RoLFxuXHRcdFx0IGJyYWNlLCBjO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0XHRcdGMgPSBzdHJbaV07XG5cdFx0XHRpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG5cdFx0XHRpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcblx0XHRcdGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gcmVkdWNlKG9iaiwgYWNjdW11bGF0b3Ipe1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGwgPSBvYmoubGVuZ3RoID4+IDAsXG5cdFx0XHRjdXJyID0gYXJndW1lbnRzWzJdO1xuXHRcdHdoaWxlIChpIDwgbCkge1xuXHRcdFx0aWYgKGkgaW4gb2JqKSBjdXJyID0gYWNjdW11bGF0b3IuY2FsbCh1bmRlZmluZWQsIGN1cnIsIG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdCsraTtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGlzQXJyYXkodkFyZykge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodkFyZykgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0fVxuXHRcblx0ZnVuY3Rpb24ga2V5cyhvYmopIHtcblx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdGZvciAoIHByb3AgaW4gb2JqICkge1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgKSBrZXlzLnB1c2gocHJvcCk7XG5cdFx0fVxuXHRcdHJldHVybiBrZXlzO1xuXHR9XG5cdFx0XG5cdGZ1bmN0aW9uIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdXJsID09PSB0cnVlICkge1xuXHRcdFx0c3RyaWN0TW9kZSA9IHRydWU7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHN0cmljdE1vZGUgPSBzdHJpY3RNb2RlIHx8IGZhbHNlO1xuXHRcdHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24udG9TdHJpbmcoKTtcblx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdFxuXHRcdFx0ZGF0YSA6IHBhcnNlVXJpKHVybCwgc3RyaWN0TW9kZSksXG5cdFx0XHRcblx0XHRcdC8vIGdldCB2YXJpb3VzIGF0dHJpYnV0ZXMgZnJvbSB0aGUgVVJJXG5cdFx0XHRhdHRyIDogZnVuY3Rpb24oIGF0dHIgKSB7XG5cdFx0XHRcdGF0dHIgPSBhbGlhc2VzW2F0dHJdIHx8IGF0dHI7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEuYXR0clthdHRyXSA6IHRoaXMuZGF0YS5hdHRyO1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG5cdFx0XHRwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0ucXVlcnlbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHBhcmFtZXRlcnNcblx0XHRcdGZwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnRbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHBhdGggc2VnbWVudHNcblx0XHRcdHNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcucGF0aC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoW3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHNlZ21lbnRzXG5cdFx0XHRmc2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQ7ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5mcmFnbWVudC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0ICAgIFx0XG5cdFx0fTtcblx0XG5cdH07XG5cdFxuXHRpZiAoIHR5cGVvZiAkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcblx0XHQkLmZuLnVybCA9IGZ1bmN0aW9uKCBzdHJpY3RNb2RlICkge1xuXHRcdFx0dmFyIHVybCA9ICcnO1xuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0dXJsID0gJCh0aGlzKS5hdHRyKCBnZXRBdHRyTmFtZSh0aGlzWzBdKSApIHx8ICcnO1xuXHRcdFx0fSAgICBcblx0XHRcdHJldHVybiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKTtcblx0XHR9O1xuXHRcdFxuXHRcdCQudXJsID0gcHVybDtcblx0XHRcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cucHVybCA9IHB1cmw7XG5cdH1cblxufSk7XG5cbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgIH1cbiAgfVxuXG59KSIsIi8qXG4gKiBjbGFzc0xpc3QuanM6IENyb3NzLWJyb3dzZXIgZnVsbCBlbGVtZW50LmNsYXNzTGlzdCBpbXBsZW1lbnRhdGlvbi5cbiAqIDEuMi4yMDE3MTIxMFxuICpcbiAqIEJ5IEVsaSBHcmV5LCBodHRwOi8vZWxpZ3JleS5jb21cbiAqIExpY2Vuc2U6IERlZGljYXRlZCB0byB0aGUgcHVibGljIGRvbWFpbi5cbiAqICAgU2VlIGh0dHBzOi8vZ2l0aHViLmNvbS9lbGlncmV5L2NsYXNzTGlzdC5qcy9ibG9iL21hc3Rlci9MSUNFTlNFLm1kXG4gKi9cblxuLypnbG9iYWwgc2VsZiwgZG9jdW1lbnQsIERPTUV4Y2VwdGlvbiAqL1xuXG4vKiEgQHNvdXJjZSBodHRwOi8vcHVybC5lbGlncmV5LmNvbS9naXRodWIvY2xhc3NMaXN0LmpzL2Jsb2IvbWFzdGVyL2NsYXNzTGlzdC5qcyAqL1xuXG5pZiAoXCJkb2N1bWVudFwiIGluIHNlbGYpIHtcblxuLy8gRnVsbCBwb2x5ZmlsbCBmb3IgYnJvd3NlcnMgd2l0aCBubyBjbGFzc0xpc3Qgc3VwcG9ydFxuLy8gSW5jbHVkaW5nIElFIDwgRWRnZSBtaXNzaW5nIFNWR0VsZW1lbnQuY2xhc3NMaXN0XG5pZiAoXG5cdCAgICEoXCJjbGFzc0xpc3RcIiBpbiBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKSkgXG5cdHx8IGRvY3VtZW50LmNyZWF0ZUVsZW1lbnROU1xuXHQmJiAhKFwiY2xhc3NMaXN0XCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudE5TKFwiaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmdcIixcImdcIikpXG4pIHtcblxuKGZ1bmN0aW9uICh2aWV3KSB7XG5cblwidXNlIHN0cmljdFwiO1xuXG5pZiAoISgnRWxlbWVudCcgaW4gdmlldykpIHJldHVybjtcblxudmFyXG5cdCAgY2xhc3NMaXN0UHJvcCA9IFwiY2xhc3NMaXN0XCJcblx0LCBwcm90b1Byb3AgPSBcInByb3RvdHlwZVwiXG5cdCwgZWxlbUN0clByb3RvID0gdmlldy5FbGVtZW50W3Byb3RvUHJvcF1cblx0LCBvYmpDdHIgPSBPYmplY3Rcblx0LCBzdHJUcmltID0gU3RyaW5nW3Byb3RvUHJvcF0udHJpbSB8fCBmdW5jdGlvbiAoKSB7XG5cdFx0cmV0dXJuIHRoaXMucmVwbGFjZSgvXlxccyt8XFxzKyQvZywgXCJcIik7XG5cdH1cblx0LCBhcnJJbmRleE9mID0gQXJyYXlbcHJvdG9Qcm9wXS5pbmRleE9mIHx8IGZ1bmN0aW9uIChpdGVtKSB7XG5cdFx0dmFyXG5cdFx0XHQgIGkgPSAwXG5cdFx0XHQsIGxlbiA9IHRoaXMubGVuZ3RoXG5cdFx0O1xuXHRcdGZvciAoOyBpIDwgbGVuOyBpKyspIHtcblx0XHRcdGlmIChpIGluIHRoaXMgJiYgdGhpc1tpXSA9PT0gaXRlbSkge1xuXHRcdFx0XHRyZXR1cm4gaTtcblx0XHRcdH1cblx0XHR9XG5cdFx0cmV0dXJuIC0xO1xuXHR9XG5cdC8vIFZlbmRvcnM6IHBsZWFzZSBhbGxvdyBjb250ZW50IGNvZGUgdG8gaW5zdGFudGlhdGUgRE9NRXhjZXB0aW9uc1xuXHQsIERPTUV4ID0gZnVuY3Rpb24gKHR5cGUsIG1lc3NhZ2UpIHtcblx0XHR0aGlzLm5hbWUgPSB0eXBlO1xuXHRcdHRoaXMuY29kZSA9IERPTUV4Y2VwdGlvblt0eXBlXTtcblx0XHR0aGlzLm1lc3NhZ2UgPSBtZXNzYWdlO1xuXHR9XG5cdCwgY2hlY2tUb2tlbkFuZEdldEluZGV4ID0gZnVuY3Rpb24gKGNsYXNzTGlzdCwgdG9rZW4pIHtcblx0XHRpZiAodG9rZW4gPT09IFwiXCIpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIlNZTlRBWF9FUlJcIlxuXHRcdFx0XHQsIFwiVGhlIHRva2VuIG11c3Qgbm90IGJlIGVtcHR5LlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRpZiAoL1xccy8udGVzdCh0b2tlbikpIHtcblx0XHRcdHRocm93IG5ldyBET01FeChcblx0XHRcdFx0ICBcIklOVkFMSURfQ0hBUkFDVEVSX0VSUlwiXG5cdFx0XHRcdCwgXCJUaGUgdG9rZW4gbXVzdCBub3QgY29udGFpbiBzcGFjZSBjaGFyYWN0ZXJzLlwiXG5cdFx0XHQpO1xuXHRcdH1cblx0XHRyZXR1cm4gYXJySW5kZXhPZi5jYWxsKGNsYXNzTGlzdCwgdG9rZW4pO1xuXHR9XG5cdCwgQ2xhc3NMaXN0ID0gZnVuY3Rpb24gKGVsZW0pIHtcblx0XHR2YXJcblx0XHRcdCAgdHJpbW1lZENsYXNzZXMgPSBzdHJUcmltLmNhbGwoZWxlbS5nZXRBdHRyaWJ1dGUoXCJjbGFzc1wiKSB8fCBcIlwiKVxuXHRcdFx0LCBjbGFzc2VzID0gdHJpbW1lZENsYXNzZXMgPyB0cmltbWVkQ2xhc3Nlcy5zcGxpdCgvXFxzKy8pIDogW11cblx0XHRcdCwgaSA9IDBcblx0XHRcdCwgbGVuID0gY2xhc3Nlcy5sZW5ndGhcblx0XHQ7XG5cdFx0Zm9yICg7IGkgPCBsZW47IGkrKykge1xuXHRcdFx0dGhpcy5wdXNoKGNsYXNzZXNbaV0pO1xuXHRcdH1cblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUgPSBmdW5jdGlvbiAoKSB7XG5cdFx0XHRlbGVtLnNldEF0dHJpYnV0ZShcImNsYXNzXCIsIHRoaXMudG9TdHJpbmcoKSk7XG5cdFx0fTtcblx0fVxuXHQsIGNsYXNzTGlzdFByb3RvID0gQ2xhc3NMaXN0W3Byb3RvUHJvcF0gPSBbXVxuXHQsIGNsYXNzTGlzdEdldHRlciA9IGZ1bmN0aW9uICgpIHtcblx0XHRyZXR1cm4gbmV3IENsYXNzTGlzdCh0aGlzKTtcblx0fVxuO1xuLy8gTW9zdCBET01FeGNlcHRpb24gaW1wbGVtZW50YXRpb25zIGRvbid0IGFsbG93IGNhbGxpbmcgRE9NRXhjZXB0aW9uJ3MgdG9TdHJpbmcoKVxuLy8gb24gbm9uLURPTUV4Y2VwdGlvbnMuIEVycm9yJ3MgdG9TdHJpbmcoKSBpcyBzdWZmaWNpZW50IGhlcmUuXG5ET01FeFtwcm90b1Byb3BdID0gRXJyb3JbcHJvdG9Qcm9wXTtcbmNsYXNzTGlzdFByb3RvLml0ZW0gPSBmdW5jdGlvbiAoaSkge1xuXHRyZXR1cm4gdGhpc1tpXSB8fCBudWxsO1xufTtcbmNsYXNzTGlzdFByb3RvLmNvbnRhaW5zID0gZnVuY3Rpb24gKHRva2VuKSB7XG5cdHJldHVybiB+Y2hlY2tUb2tlbkFuZEdldEluZGV4KHRoaXMsIHRva2VuICsgXCJcIik7XG59O1xuY2xhc3NMaXN0UHJvdG8uYWRkID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdDtcblx0ZG8ge1xuXHRcdHRva2VuID0gdG9rZW5zW2ldICsgXCJcIjtcblx0XHRpZiAoIX5jaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pKSB7XG5cdFx0XHR0aGlzLnB1c2godG9rZW4pO1xuXHRcdFx0dXBkYXRlZCA9IHRydWU7XG5cdFx0fVxuXHR9XG5cdHdoaWxlICgrK2kgPCBsKTtcblxuXHRpZiAodXBkYXRlZCkge1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVtb3ZlID0gZnVuY3Rpb24gKCkge1xuXHR2YXJcblx0XHQgIHRva2VucyA9IGFyZ3VtZW50c1xuXHRcdCwgaSA9IDBcblx0XHQsIGwgPSB0b2tlbnMubGVuZ3RoXG5cdFx0LCB0b2tlblxuXHRcdCwgdXBkYXRlZCA9IGZhbHNlXG5cdFx0LCBpbmRleFxuXHQ7XG5cdGRvIHtcblx0XHR0b2tlbiA9IHRva2Vuc1tpXSArIFwiXCI7XG5cdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdHdoaWxlICh+aW5kZXgpIHtcblx0XHRcdHRoaXMuc3BsaWNlKGluZGV4LCAxKTtcblx0XHRcdHVwZGF0ZWQgPSB0cnVlO1xuXHRcdFx0aW5kZXggPSBjaGVja1Rva2VuQW5kR2V0SW5kZXgodGhpcywgdG9rZW4pO1xuXHRcdH1cblx0fVxuXHR3aGlsZSAoKytpIDwgbCk7XG5cblx0aWYgKHVwZGF0ZWQpIHtcblx0XHR0aGlzLl91cGRhdGVDbGFzc05hbWUoKTtcblx0fVxufTtcbmNsYXNzTGlzdFByb3RvLnRvZ2dsZSA9IGZ1bmN0aW9uICh0b2tlbiwgZm9yY2UpIHtcblx0dmFyXG5cdFx0ICByZXN1bHQgPSB0aGlzLmNvbnRhaW5zKHRva2VuKVxuXHRcdCwgbWV0aG9kID0gcmVzdWx0ID9cblx0XHRcdGZvcmNlICE9PSB0cnVlICYmIFwicmVtb3ZlXCJcblx0XHQ6XG5cdFx0XHRmb3JjZSAhPT0gZmFsc2UgJiYgXCJhZGRcIlxuXHQ7XG5cblx0aWYgKG1ldGhvZCkge1xuXHRcdHRoaXNbbWV0aG9kXSh0b2tlbik7XG5cdH1cblxuXHRpZiAoZm9yY2UgPT09IHRydWUgfHwgZm9yY2UgPT09IGZhbHNlKSB7XG5cdFx0cmV0dXJuIGZvcmNlO1xuXHR9IGVsc2Uge1xuXHRcdHJldHVybiAhcmVzdWx0O1xuXHR9XG59O1xuY2xhc3NMaXN0UHJvdG8ucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0dmFyIGluZGV4ID0gY2hlY2tUb2tlbkFuZEdldEluZGV4KHRva2VuICsgXCJcIik7XG5cdGlmICh+aW5kZXgpIHtcblx0XHR0aGlzLnNwbGljZShpbmRleCwgMSwgcmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdHRoaXMuX3VwZGF0ZUNsYXNzTmFtZSgpO1xuXHR9XG59XG5jbGFzc0xpc3RQcm90by50b1N0cmluZyA9IGZ1bmN0aW9uICgpIHtcblx0cmV0dXJuIHRoaXMuam9pbihcIiBcIik7XG59O1xuXG5pZiAob2JqQ3RyLmRlZmluZVByb3BlcnR5KSB7XG5cdHZhciBjbGFzc0xpc3RQcm9wRGVzYyA9IHtcblx0XHQgIGdldDogY2xhc3NMaXN0R2V0dGVyXG5cdFx0LCBlbnVtZXJhYmxlOiB0cnVlXG5cdFx0LCBjb25maWd1cmFibGU6IHRydWVcblx0fTtcblx0dHJ5IHtcblx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdH0gY2F0Y2ggKGV4KSB7IC8vIElFIDggZG9lc24ndCBzdXBwb3J0IGVudW1lcmFibGU6dHJ1ZVxuXHRcdC8vIGFkZGluZyB1bmRlZmluZWQgdG8gZmlnaHQgdGhpcyBpc3N1ZSBodHRwczovL2dpdGh1Yi5jb20vZWxpZ3JleS9jbGFzc0xpc3QuanMvaXNzdWVzLzM2XG5cdFx0Ly8gbW9kZXJuaWUgSUU4LU1TVzcgbWFjaGluZSBoYXMgSUU4IDguMC42MDAxLjE4NzAyIGFuZCBpcyBhZmZlY3RlZFxuXHRcdGlmIChleC5udW1iZXIgPT09IHVuZGVmaW5lZCB8fCBleC5udW1iZXIgPT09IC0weDdGRjVFQzU0KSB7XG5cdFx0XHRjbGFzc0xpc3RQcm9wRGVzYy5lbnVtZXJhYmxlID0gZmFsc2U7XG5cdFx0XHRvYmpDdHIuZGVmaW5lUHJvcGVydHkoZWxlbUN0clByb3RvLCBjbGFzc0xpc3RQcm9wLCBjbGFzc0xpc3RQcm9wRGVzYyk7XG5cdFx0fVxuXHR9XG59IGVsc2UgaWYgKG9iakN0cltwcm90b1Byb3BdLl9fZGVmaW5lR2V0dGVyX18pIHtcblx0ZWxlbUN0clByb3RvLl9fZGVmaW5lR2V0dGVyX18oY2xhc3NMaXN0UHJvcCwgY2xhc3NMaXN0R2V0dGVyKTtcbn1cblxufShzZWxmKSk7XG5cbn1cblxuLy8gVGhlcmUgaXMgZnVsbCBvciBwYXJ0aWFsIG5hdGl2ZSBjbGFzc0xpc3Qgc3VwcG9ydCwgc28ganVzdCBjaGVjayBpZiB3ZSBuZWVkXG4vLyB0byBub3JtYWxpemUgdGhlIGFkZC9yZW1vdmUgYW5kIHRvZ2dsZSBBUElzLlxuXG4oZnVuY3Rpb24gKCkge1xuXHRcInVzZSBzdHJpY3RcIjtcblxuXHR2YXIgdGVzdEVsZW1lbnQgPSBkb2N1bWVudC5jcmVhdGVFbGVtZW50KFwiX1wiKTtcblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QuYWRkKFwiYzFcIiwgXCJjMlwiKTtcblxuXHQvLyBQb2x5ZmlsbCBmb3IgSUUgMTAvMTEgYW5kIEZpcmVmb3ggPDI2LCB3aGVyZSBjbGFzc0xpc3QuYWRkIGFuZFxuXHQvLyBjbGFzc0xpc3QucmVtb3ZlIGV4aXN0IGJ1dCBzdXBwb3J0IG9ubHkgb25lIGFyZ3VtZW50IGF0IGEgdGltZS5cblx0aWYgKCF0ZXN0RWxlbWVudC5jbGFzc0xpc3QuY29udGFpbnMoXCJjMlwiKSkge1xuXHRcdHZhciBjcmVhdGVNZXRob2QgPSBmdW5jdGlvbihtZXRob2QpIHtcblx0XHRcdHZhciBvcmlnaW5hbCA9IERPTVRva2VuTGlzdC5wcm90b3R5cGVbbWV0aG9kXTtcblxuXHRcdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZVttZXRob2RdID0gZnVuY3Rpb24odG9rZW4pIHtcblx0XHRcdFx0dmFyIGksIGxlbiA9IGFyZ3VtZW50cy5sZW5ndGg7XG5cblx0XHRcdFx0Zm9yIChpID0gMDsgaSA8IGxlbjsgaSsrKSB7XG5cdFx0XHRcdFx0dG9rZW4gPSBhcmd1bWVudHNbaV07XG5cdFx0XHRcdFx0b3JpZ2luYWwuY2FsbCh0aGlzLCB0b2tlbik7XG5cdFx0XHRcdH1cblx0XHRcdH07XG5cdFx0fTtcblx0XHRjcmVhdGVNZXRob2QoJ2FkZCcpO1xuXHRcdGNyZWF0ZU1ldGhvZCgncmVtb3ZlJyk7XG5cdH1cblxuXHR0ZXN0RWxlbWVudC5jbGFzc0xpc3QudG9nZ2xlKFwiYzNcIiwgZmFsc2UpO1xuXG5cdC8vIFBvbHlmaWxsIGZvciBJRSAxMCBhbmQgRmlyZWZveCA8MjQsIHdoZXJlIGNsYXNzTGlzdC50b2dnbGUgZG9lcyBub3Rcblx0Ly8gc3VwcG9ydCB0aGUgc2Vjb25kIGFyZ3VtZW50LlxuXHRpZiAodGVzdEVsZW1lbnQuY2xhc3NMaXN0LmNvbnRhaW5zKFwiYzNcIikpIHtcblx0XHR2YXIgX3RvZ2dsZSA9IERPTVRva2VuTGlzdC5wcm90b3R5cGUudG9nZ2xlO1xuXG5cdFx0RE9NVG9rZW5MaXN0LnByb3RvdHlwZS50b2dnbGUgPSBmdW5jdGlvbih0b2tlbiwgZm9yY2UpIHtcblx0XHRcdGlmICgxIGluIGFyZ3VtZW50cyAmJiAhdGhpcy5jb250YWlucyh0b2tlbikgPT09ICFmb3JjZSkge1xuXHRcdFx0XHRyZXR1cm4gZm9yY2U7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRyZXR1cm4gX3RvZ2dsZS5jYWxsKHRoaXMsIHRva2VuKTtcblx0XHRcdH1cblx0XHR9O1xuXG5cdH1cblxuXHQvLyByZXBsYWNlKCkgcG9seWZpbGxcblx0aWYgKCEoXCJyZXBsYWNlXCIgaW4gZG9jdW1lbnQuY3JlYXRlRWxlbWVudChcIl9cIikuY2xhc3NMaXN0KSkge1xuXHRcdERPTVRva2VuTGlzdC5wcm90b3R5cGUucmVwbGFjZSA9IGZ1bmN0aW9uICh0b2tlbiwgcmVwbGFjZW1lbnRfdG9rZW4pIHtcblx0XHRcdHZhclxuXHRcdFx0XHQgIHRva2VucyA9IHRoaXMudG9TdHJpbmcoKS5zcGxpdChcIiBcIilcblx0XHRcdFx0LCBpbmRleCA9IHRva2Vucy5pbmRleE9mKHRva2VuICsgXCJcIilcblx0XHRcdDtcblx0XHRcdGlmICh+aW5kZXgpIHtcblx0XHRcdFx0dG9rZW5zID0gdG9rZW5zLnNsaWNlKGluZGV4KTtcblx0XHRcdFx0dGhpcy5yZW1vdmUuYXBwbHkodGhpcywgdG9rZW5zKTtcblx0XHRcdFx0dGhpcy5hZGQocmVwbGFjZW1lbnRfdG9rZW4pO1xuXHRcdFx0XHR0aGlzLmFkZC5hcHBseSh0aGlzLCB0b2tlbnMuc2xpY2UoMSkpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdHRlc3RFbGVtZW50ID0gbnVsbDtcbn0oKSk7XG5cbn0iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiA9IFwiYVwiO1xuICAgIHZhciBORVdfQ09MTF9NRU5VX09QVElPTiA9IFwiYlwiO1xuXG4gICAgdmFyIElOX1lPVVJfQ09MTFNfTEFCRUwgPSAnVGhpcyBpdGVtIGlzIGluIHlvdXIgY29sbGVjdGlvbihzKTonO1xuXG4gICAgdmFyICR0b29sYmFyID0gJChcIi5jb2xsZWN0aW9uTGlua3MgLnNlbGVjdC1jb2xsZWN0aW9uXCIpO1xuICAgIHZhciAkZXJyb3Jtc2cgPSAkKFwiLmVycm9ybXNnXCIpO1xuICAgIHZhciAkaW5mb21zZyA9ICQoXCIuaW5mb21zZ1wiKTtcblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfZXJyb3IobXNnKSB7XG4gICAgICAgIGlmICggISAkZXJyb3Jtc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGVycm9ybXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yIGVycm9ybXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGVycm9ybXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2luZm8obXNnKSB7XG4gICAgICAgIGlmICggISAkaW5mb21zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkaW5mb21zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvIGluZm9tc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkaW5mb21zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9lcnJvcigpIHtcbiAgICAgICAgJGVycm9ybXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gaGlkZV9pbmZvKCkge1xuICAgICAgICAkaW5mb21zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldF91cmwoKSB7XG4gICAgICAgIHZhciB1cmwgPSBcIi9jZ2kvbWJcIjtcbiAgICAgICAgaWYgKCBsb2NhdGlvbi5wYXRobmFtZS5pbmRleE9mKFwiL3NoY2dpL1wiKSA+IC0xICkge1xuICAgICAgICAgICAgdXJsID0gXCIvc2hjZ2kvbWJcIjtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gdXJsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHBhcnNlX2xpbmUoZGF0YSkge1xuICAgICAgICB2YXIgcmV0dmFsID0ge307XG4gICAgICAgIHZhciB0bXAgPSBkYXRhLnNwbGl0KFwifFwiKTtcbiAgICAgICAgZm9yKHZhciBpID0gMDsgaSA8IHRtcC5sZW5ndGg7IGkrKykge1xuICAgICAgICAgICAga3YgPSB0bXBbaV0uc3BsaXQoXCI9XCIpO1xuICAgICAgICAgICAgcmV0dmFsW2t2WzBdXSA9IGt2WzFdO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiByZXR2YWw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKGFyZ3MpIHtcblxuICAgICAgICB2YXIgb3B0aW9ucyA9ICQuZXh0ZW5kKHsgY3JlYXRpbmcgOiBmYWxzZSwgbGFiZWwgOiBcIlNhdmUgQ2hhbmdlc1wiIH0sIGFyZ3MpO1xuXG4gICAgICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICAgICAgICAgJzxmb3JtIGNsYXNzPVwiZm9ybS1ob3Jpem9udGFsXCIgYWN0aW9uPVwibWJcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWNuXCI+Q29sbGVjdGlvbiBOYW1lPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBtYXhsZW5ndGg9XCIxMDBcIiBuYW1lPVwiY25cIiBpZD1cImVkaXQtY25cIiB2YWx1ZT1cIlwiIHBsYWNlaG9sZGVyPVwiWW91ciBjb2xsZWN0aW9uIG5hbWVcIiByZXF1aXJlZCAvPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1jbi1jb3VudFwiPjEwMDwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIiBmb3I9XCJlZGl0LWRlc2NcIj5EZXNjcmlwdGlvbjwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8dGV4dGFyZWEgaWQ9XCJlZGl0LWRlc2NcIiBuYW1lPVwiZGVzY1wiIHJvd3M9XCI0XCIgbWF4bGVuZ3RoPVwiMjU1XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIHBsYWNlaG9sZGVyPVwiQWRkIHlvdXIgY29sbGVjdGlvbiBkZXNjcmlwdGlvbi5cIj48L3RleHRhcmVhPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwibGFiZWwgY291bnRlclwiIGlkPVwiZWRpdC1kZXNjLWNvdW50XCI+MjU1PC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiPklzIHRoaXMgY29sbGVjdGlvbiA8c3Ryb25nPlB1YmxpYzwvc3Ryb25nPiBvciA8c3Ryb25nPlByaXZhdGU8L3N0cm9uZz4/PC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTBcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHJpdmF0ZSAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwic2hyZFwiIGlkPVwiZWRpdC1zaHJkLTFcIiB2YWx1ZT1cIjFcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0xXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1B1YmxpYyAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZm9ybT4nXG4gICAgICAgICk7XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmNuICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwob3B0aW9ucy5jbik7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuZGVzYyApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwob3B0aW9ucy5kZXNjKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5zaHJkICE9IG51bGwgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9XCIgKyBvcHRpb25zLnNocmQgKyAnXScpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgfSBlbHNlIGlmICggISBIVC5sb2dpbl9zdGF0dXMubG9nZ2VkX2luICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTBdXCIpLmF0dHIoXCJjaGVja2VkXCIsIFwiY2hlY2tlZFwiKTtcbiAgICAgICAgICAgICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvXCI+PHN0cm9uZz5UaGlzIGNvbGxlY3Rpb24gd2lsbCBiZSB0ZW1wb3Jhcnk8L3N0cm9uZz4uIExvZyBpbiB0byBjcmVhdGUgcGVybWFuZW50IGFuZCBwdWJsaWMgY29sbGVjdGlvbnMuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgIC8vIHJlbW92ZSB0aGUgPGxhYmVsPiB0aGF0IHdyYXBzIHRoZSByYWRpbyBidXR0b25cbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0xXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwibGFiZWxbZm9yPSdlZGl0LXNocmQtMSddXCIpLnJlbW92ZSgpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLiRoaWRkZW4gKSB7XG4gICAgICAgICAgICBvcHRpb25zLiRoaWRkZW4uY2xvbmUoKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2MnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYyk7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYScgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5hKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5paWQgKSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0naWlkJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmlpZCk7XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IG9wdGlvbnMubGFiZWwsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4gYnRuLXByaW1hcnkgYnRuLWRpc21pc3NcIixcbiAgICAgICAgICAgICAgICBjYWxsYmFjayA6IGZ1bmN0aW9uKCkge1xuXG4gICAgICAgICAgICAgICAgICAgIHZhciBmb3JtID0gJGJsb2NrLmdldCgwKTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGZvcm0uY2hlY2tWYWxpZGl0eSgpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgZm9ybS5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGNuID0gJC50cmltKCRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKCkpO1xuICAgICAgICAgICAgICAgICAgICB2YXIgZGVzYyA9ICQudHJpbSgkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKCkpO1xuXG4gICAgICAgICAgICAgICAgICAgIGlmICggISBjbiApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvclwiPllvdSBtdXN0IGVudGVyIGEgY29sbGVjdGlvbiBuYW1lLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgICAgICAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgICAgICAgICAgICAgYSA6ICdhZGRpdHNuYycsXG4gICAgICAgICAgICAgICAgICAgICAgICBjbiA6IGNuLFxuICAgICAgICAgICAgICAgICAgICAgICAgZGVzYyA6IGRlc2MsXG4gICAgICAgICAgICAgICAgICAgICAgICBzaHJkIDogJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdOmNoZWNrZWRcIikudmFsKClcbiAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIF0pO1xuXG4gICAgICAgICRkaWFsb2cuZmluZChcImlucHV0W3R5cGU9dGV4dF0sdGV4dGFyZWFcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgJGNvdW50ID0gJChcIiNcIiArICR0aGlzLmF0dHIoJ2lkJykgKyBcIi1jb3VudFwiKTtcbiAgICAgICAgICAgIHZhciBsaW1pdCA9ICR0aGlzLmF0dHIoXCJtYXhsZW5ndGhcIik7XG5cbiAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcblxuICAgICAgICAgICAgJHRoaXMuYmluZCgna2V5dXAnLCBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG4gICAgICAgICAgICB9KTtcbiAgICAgICAgfSlcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzdWJtaXRfcG9zdChwYXJhbXMpIHtcbiAgICAgICAgdmFyIGRhdGEgPSAkLmV4dGVuZCh7fSwgeyBwYWdlIDogJ2FqYXgnLCBpZCA6IEhULnBhcmFtcy5pZCB9LCBwYXJhbXMpO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogZ2V0X3VybCgpLFxuICAgICAgICAgICAgZGF0YSA6IGRhdGFcbiAgICAgICAgfSkuZG9uZShmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gcGFyc2VfbGluZShkYXRhKTtcbiAgICAgICAgICAgIGhpZGVfaW5mbygpO1xuICAgICAgICAgICAgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9TVUNDRVNTJyApIHtcbiAgICAgICAgICAgICAgICAvLyBkbyBzb21ldGhpbmdcbiAgICAgICAgICAgICAgICBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcyk7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBwYXJhbXMucmVzdWx0ID09ICdBRERfSVRFTV9GQUlMVVJFJyApIHtcbiAgICAgICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiSXRlbSBjb3VsZCBub3QgYmUgYWRkZWQgYXQgdGhpcyB0aW1lLlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coZGF0YSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pLmZhaWwoZnVuY3Rpb24oanFYSFIsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyh0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciAkdWwgPSAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcFwiKTtcbiAgICAgICAgdmFyIGNvbGxfaHJlZiA9IGdldF91cmwoKSArIFwiP2E9bGlzdGlzO2M9XCIgKyBwYXJhbXMuY29sbF9pZDtcbiAgICAgICAgdmFyICRhID0gJChcIjxhPlwiKS5hdHRyKFwiaHJlZlwiLCBjb2xsX2hyZWYpLnRleHQocGFyYW1zLmNvbGxfbmFtZSk7XG4gICAgICAgICQoXCI8bGk+PC9saT5cIikuYXBwZW5kVG8oJHVsKS5hcHBlbmQoJGEpO1xuXG4gICAgICAgICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwLXN1bW1hcnlcIikudGV4dChJTl9ZT1VSX0NPTExTX0xBQkVMKTtcblxuICAgICAgICAvLyBhbmQgdGhlbiBmaWx0ZXIgb3V0IHRoZSBsaXN0IGZyb20gdGhlIHNlbGVjdFxuICAgICAgICB2YXIgJG9wdGlvbiA9ICR0b29sYmFyLmZpbmQoXCJvcHRpb25bdmFsdWU9J1wiICsgcGFyYW1zLmNvbGxfaWQgKyBcIiddXCIpO1xuICAgICAgICAkb3B0aW9uLnJlbW92ZSgpO1xuXG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYEFkZGVkIGNvbGxlY3Rpb24gJHtwYXJhbXMuY29sbF9uYW1lfSB0byB5b3VyIGxpc3QuYCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY29uZmlybV9sYXJnZShjb2xsU2l6ZSwgYWRkTnVtSXRlbXMsIGNhbGxiYWNrKSB7XG5cbiAgICAgICAgaWYgKCBjb2xsU2l6ZSA8PSAxMDAwICYmIGNvbGxTaXplICsgYWRkTnVtSXRlbXMgPiAxMDAwICkge1xuICAgICAgICAgICAgdmFyIG51bVN0cjtcbiAgICAgICAgICAgIGlmIChhZGROdW1JdGVtcyA+IDEpIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoZXNlIFwiICsgYWRkTnVtSXRlbXMgKyBcIiBpdGVtc1wiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGlzIGl0ZW1cIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBtc2cgPSBcIk5vdGU6IFlvdXIgY29sbGVjdGlvbiBjb250YWlucyBcIiArIGNvbGxTaXplICsgXCIgaXRlbXMuICBBZGRpbmcgXCIgKyBudW1TdHIgKyBcIiB0byB5b3VyIGNvbGxlY3Rpb24gd2lsbCBpbmNyZWFzZSBpdHMgc2l6ZSB0byBtb3JlIHRoYW4gMTAwMCBpdGVtcy4gIFRoaXMgbWVhbnMgeW91ciBjb2xsZWN0aW9uIHdpbGwgbm90IGJlIHNlYXJjaGFibGUgdW50aWwgaXQgaXMgaW5kZXhlZCwgdXN1YWxseSB3aXRoaW4gNDggaG91cnMuICBBZnRlciB0aGF0LCBqdXN0IG5ld2x5IGFkZGVkIGl0ZW1zIHdpbGwgc2VlIHRoaXMgZGVsYXkgYmVmb3JlIHRoZXkgY2FuIGJlIHNlYXJjaGVkLiBcXG5cXG5EbyB5b3Ugd2FudCB0byBwcm9jZWVkP1wiXG5cbiAgICAgICAgICAgIGNvbmZpcm0obXNnLCBmdW5jdGlvbihhbnN3ZXIpIHtcbiAgICAgICAgICAgICAgICBpZiAoIGFuc3dlciApIHtcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9KVxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgLy8gYWxsIG90aGVyIGNhc2VzIGFyZSBva2F5XG4gICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJChcIiNQVGFkZEl0ZW1CdG5cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIHZhciBhY3Rpb24gPSAnYWRkSSdcblxuICAgICAgICBoaWRlX2Vycm9yKCk7XG5cbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0XCIpLnZhbCgpO1xuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9uYW1lID0gJHRvb2xiYXIuZmluZChcInNlbGVjdCBvcHRpb246c2VsZWN0ZWRcIikudGV4dCgpO1xuXG4gICAgICAgIGlmICggKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IERFRkFVTFRfQ09MTF9NRU5VX09QVElPTiApICkge1xuICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIllvdSBtdXN0IHNlbGVjdCBhIGNvbGxlY3Rpb24uXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID09IE5FV19DT0xMX01FTlVfT1BUSU9OICkge1xuICAgICAgICAgICAgLy8gZGVhbCB3aXRoIG5ldyBjb2xsZWN0aW9uXG4gICAgICAgICAgICBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoe1xuICAgICAgICAgICAgICAgIGNyZWF0aW5nIDogdHJ1ZSxcbiAgICAgICAgICAgICAgICBjIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgICAgICBpZCA6IEhULnBhcmFtcy5pZCxcbiAgICAgICAgICAgICAgICBhIDogYWN0aW9uXG4gICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHZhciBhZGRfbnVtX2l0ZW1zID0gMTtcbiAgICAgICAgLy8gdmFyIENPTExfU0laRV9BUlJBWSA9IGdldENvbGxTaXplQXJyYXkoKTtcbiAgICAgICAgLy8gdmFyIGNvbGxfc2l6ZSA9IENPTExfU0laRV9BUlJBWVtzZWxlY3RlZF9jb2xsZWN0aW9uX2lkXTtcbiAgICAgICAgLy8gY29uZmlybV9sYXJnZShjb2xsX3NpemUsIGFkZF9udW1faXRlbXMsIGZ1bmN0aW9uKCkge1xuICAgICAgICAvLyAgICAgJGZvcm0uc3VibWl0KCk7XG4gICAgICAgIC8vIH0pXG5cbiAgICAgICAgZGlzcGxheV9pbmZvKFwiQWRkaW5nIGl0ZW0gdG8geW91ciBjb2xsZWN0aW9uOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgYzIgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgYSAgOiAnYWRkaXRzJ1xuICAgICAgICB9KTtcblxuICAgIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBpZiAoICEgJChcImh0bWxcIikuaXMoXCIuY3Jtc1wiKSApIHtcbiAgICByZXR1cm47XG4gIH1cblxuICAvLyBpZiAoICQoXCIubmF2YmFyLXN0YXRpYy10b3BcIikuZGF0YSgnbG9nZ2VkaW4nKSAhPSAnWUVTJyAmJiB3aW5kb3cubG9jYXRpb24ucHJvdG9jb2wgPT0gJ2h0dHBzOicgKSB7XG4gIC8vICAgICAvLyBob3JyaWJsZSBoYWNrXG4gIC8vICAgICB2YXIgdGFyZ2V0ID0gd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSgvXFwkL2csICclMjQnKTtcbiAgLy8gICAgIHZhciBocmVmID0gJ2h0dHBzOi8vJyArIHdpbmRvdy5sb2NhdGlvbi5ob3N0bmFtZSArICcvU2hpYmJvbGV0aC5zc28vTG9naW4/ZW50aXR5SUQ9aHR0cHM6Ly9zaGliYm9sZXRoLnVtaWNoLmVkdS9pZHAvc2hpYmJvbGV0aCZ0YXJnZXQ9JyArIHRhcmdldDtcbiAgLy8gICAgIHdpbmRvdy5sb2NhdGlvbi5ocmVmID0gaHJlZjtcbiAgLy8gICAgIHJldHVybjtcbiAgLy8gfVxuXG4gIC8vIGRlZmluZSBDUk1TIHN0YXRlXG4gIEhULmNybXNfc3RhdGUgPSAnQ1JNUy1VUyc7XG4gIHZhciBpID0gd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZignc2tpbj1jcm1zd29ybGQnKTtcbiAgaWYgKCBpICsgMSAhPSAwICkge1xuICAgICAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVdvcmxkJztcbiAgfVxuXG4gIC8vIGRpc3BsYXkgYmliIGluZm9ybWF0aW9uXG4gIHZhciAkZGl2ID0gJChcIi5iaWJMaW5rc1wiKTtcbiAgdmFyICRwID0gJGRpdi5maW5kKFwicDpmaXJzdFwiKTtcbiAgJHAuZmluZChcInNwYW46ZW1wdHlcIikuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgIC8vICQodGhpcykudGV4dCgkKHRoaXMpLmF0dHIoXCJjb250ZW50XCIpKS5hZGRDbGFzcyhcImJsb2NrZWRcIik7XG4gICAgICB2YXIgZnJhZ21lbnQgPSAnPHNwYW4gY2xhc3M9XCJibG9ja2VkXCI+PHN0cm9uZz57bGFiZWx9Ojwvc3Ryb25nPiB7Y29udGVudH08L3NwYW4+JztcbiAgICAgIGZyYWdtZW50ID0gZnJhZ21lbnQucmVwbGFjZSgne2xhYmVsfScsICQodGhpcykuYXR0cigncHJvcGVydHknKS5zdWJzdHIoMykpLnJlcGxhY2UoJ3tjb250ZW50fScsICQodGhpcykuYXR0cihcImNvbnRlbnRcIikpO1xuICAgICAgJHAuYXBwZW5kKGZyYWdtZW50KTtcbiAgfSlcblxuICB2YXIgJGxpbmsgPSAkKFwiI2VtYmVkSHRtbFwiKTtcbiAgY29uc29sZS5sb2coXCJBSE9ZIEVNQkVEXCIsICRsaW5rKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG5cbiAgJGxpbmsgPSAkKFwiYVtkYXRhLXRvZ2dsZT0nUFQgRmluZCBpbiBhIExpYnJhcnknXVwiKTtcbiAgJGxpbmsucGFyZW50KCkucmVtb3ZlKCk7XG59KVxuIiwiLy8gZG93bmxvYWRlclxuXG52YXIgSFQgPSBIVCB8fCB7fTtcblxuSFQuRG93bmxvYWRlciA9IHtcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMucGFyYW1zLmlkO1xuICAgICAgICB0aGlzLnBkZiA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb3B0aW9uczoge1xuXG4gICAgfSxcblxuICAgIHN0YXJ0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQoXCJhW2RhdGEtdG9nZ2xlKj1kb3dubG9hZF1cIikuYWRkQ2xhc3MoXCJpbnRlcmFjdGl2ZVwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBib290Ym94LmhpZGVBbGwoKTtcbiAgICAgICAgICAgIGlmICggJCh0aGlzKS5hdHRyKFwicmVsXCIpID09ICdhbGxvdycgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1zLmRvd25sb2FkX3Byb2dyZXNzX2Jhc2UgPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZXhwbGFpblBkZkFjY2Vzcyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgIH0sXG5cbiAgICBleHBsYWluUGRmQWNjZXNzOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBodG1sID0gJChcIiNub0Rvd25sb2FkQWNjZXNzXCIpLmh0bWwoKTtcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgne0RPV05MT0FEX0xJTkt9JywgJCh0aGlzKS5hdHRyKFwiaHJlZlwiKSk7XG4gICAgICAgIHRoaXMuJGRpYWxvZyA9IGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIC8vIHRoaXMuJGRpYWxvZy5hZGRDbGFzcyhcImxvZ2luXCIpO1xuICAgIH0sXG5cbiAgICBkb3dubG9hZFBkZjogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuJGxpbmsgPSAkKGxpbmspO1xuICAgICAgICBzZWxmLnNyYyA9ICQobGluaykuYXR0cignaHJlZicpO1xuICAgICAgICBzZWxmLml0ZW1fdGl0bGUgPSAkKGxpbmspLmRhdGEoJ3RpdGxlJykgfHwgJ1BERic7XG5cbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3JhbmdlJykgPT0gJ3llcycgKSB7XG4gICAgICAgICAgICBpZiAoICEgc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAvLyAnPHA+QnVpbGRpbmcgeW91ciBQREYuLi48L3A+JyArXG4gICAgICAgICAgICBgPGRpdiBjbGFzcz1cImluaXRpYWxcIj48cD5TZXR0aW5nIHVwIHRoZSBkb3dubG9hZC4uLjwvZGl2PmAgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCIgYXJpYS1oaWRkZW49XCJ0cnVlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAvLyAnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWJsb2NrIGFsZXJ0LXN1Y2Nlc3MgZG9uZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAvLyAgICAgJzxwPkFsbCBkb25lITwvcD4nICtcbiAgICAgICAgICAgIC8vICc8L2Rpdj4nICsgXG4gICAgICAgICAgICBgPGRpdj48cD48YSBocmVmPVwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvaGVscF9kaWdpdGFsX2xpYnJhcnkjRG93bmxvYWRUaW1lXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCBhZmZlY3RzIHRoZSBkb3dubG9hZCBzcGVlZD88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MnLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgICAgICAgICAgICAgaWQ6ICdkb3dubG9hZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBIVC51cGRhdGVfc3RhdHVzKGBCdWlsZGluZyB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKTtcblxuICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuXG4gICAgfSxcblxuICAgIHJlcXVlc3REb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgZGF0YVsnc2VxJ10gPSBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpO1xuICAgICAgICB9XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHNlbGYuc3JjLnJlcGxhY2UoLzsvZywgJyYnKSArICcmY2FsbGJhY2s9SFQuZG93bmxvYWRlci5zdGFydERvd25sb2FkTW9uaXRvcicsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIFNUQVJUVVAgTk9UIERFVEVDVEVEXCIpO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nICkgeyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKHJlcSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRG93bmxvYWQ6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzdGFydERvd25sb2FkTW9uaXRvcjogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFMUkVBRFkgUE9MTElOR1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucGRmLnByb2dyZXNzX3VybCA9IHByb2dyZXNzX3VybDtcbiAgICAgICAgc2VsZi5wZGYuZG93bmxvYWRfdXJsID0gZG93bmxvYWRfdXJsO1xuICAgICAgICBzZWxmLnBkZi50b3RhbCA9IHRvdGFsO1xuXG4gICAgICAgIHNlbGYuaXNfcnVubmluZyA9IHRydWU7XG4gICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCA9IDA7XG4gICAgICAgIHNlbGYuaSA9IDA7XG5cbiAgICAgICAgc2VsZi50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBzZWxmLmNoZWNrU3RhdHVzKCk7IH0sIDI1MDApO1xuICAgICAgICAvLyBkbyBpdCBvbmNlIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIHNlbGYuY2hlY2tTdGF0dXMoKTtcblxuICAgIH0sXG5cbiAgICBjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5pICs9IDE7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBzZWxmLnBkZi5wcm9ncmVzc191cmwsXG4gICAgICAgICAgICBkYXRhIDogeyB0cyA6IChuZXcgRGF0ZSkuZ2V0VGltZSgpIH0sXG4gICAgICAgICAgICBjYWNoZSA6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHNlbGYudXBkYXRlUHJvZ3Jlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMuZG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICYmIHN0YXR1cy5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVByb2Nlc3NFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFJTEVEOiBcIiwgcmVxLCBcIi9cIiwgdGV4dFN0YXR1cywgXCIvXCIsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MDQgJiYgKHNlbGYuaSA+IDI1IHx8IHNlbGYubnVtX3Byb2Nlc3NlZCA+IDApICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgdXBkYXRlUHJvZ3Jlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdHVzID0geyBkb25lIDogZmFsc2UsIGVycm9yIDogZmFsc2UgfTtcbiAgICAgICAgdmFyIHBlcmNlbnQ7XG5cbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkYXRhLnN0YXR1cztcbiAgICAgICAgaWYgKCBjdXJyZW50ID09ICdFT1QnIHx8IGN1cnJlbnQgPT0gJ0RPTkUnICkge1xuICAgICAgICAgICAgc3RhdHVzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkYXRhLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDAgKiAoIGN1cnJlbnQgLyBzZWxmLnBkZi50b3RhbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLmxhc3RfcGVyY2VudCAhPSBwZXJjZW50ICkge1xuICAgICAgICAgICAgc2VsZi5sYXN0X3BlcmNlbnQgPSBwZXJjZW50O1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSAxMDAgdGltZXMsIHdoaWNoIGFtb3VudHMgdG8gfjEwMCBzZWNvbmRzXG4gICAgICAgIGlmICggc2VsZi5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmlzKFwiOnZpc2libGVcIikgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPlBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LjwvcD5gKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLnJlbW92ZUNsYXNzKFwiaGlkZVwiKTtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApXG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHZhciBkb3dubG9hZF9rZXkgPSBuYXZpZ2F0b3IudXNlckFnZW50LmluZGV4T2YoJ01hYyBPUyBYJykgIT0gLTEgPyAnUkVUVVJOJyA6ICdFTlRFUic7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPkFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIDxzcGFuIGNsYXNzPVwib2Zmc2NyZWVuXCI+U2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC48L3NwYW4+PC9wPmApO1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gU2VsZWN0ICR7ZG93bmxvYWRfa2V5fSB0byBkb3dubG9hZC5gKTtcblxuICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmZpbmQoXCIuZG9uZVwiKS5zaG93KCk7XG4gICAgICAgICAgICB2YXIgJGRvd25sb2FkX2J0biA9IHNlbGYuJGRpYWxvZy5maW5kKCcuZG93bmxvYWQtcGRmJyk7XG4gICAgICAgICAgICBpZiAoICEgJGRvd25sb2FkX2J0bi5sZW5ndGggKSB7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0biA9ICQoJzxhIGNsYXNzPVwiZG93bmxvYWQtcGRmIGJ0biBidG4tcHJpbWFyeVwiPkRvd25sb2FkIHtJVEVNX1RJVExFfTwvYT4nLnJlcGxhY2UoJ3tJVEVNX1RJVExFfScsIHNlbGYuaXRlbV90aXRsZSkpLmF0dHIoJ2hyZWYnLCBzZWxmLnBkZi5kb3dubG9hZF91cmwpO1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uYXBwZW5kVG8oc2VsZi4kZGlhbG9nLmZpbmQoXCIubW9kYWxfX2Zvb3RlclwiKSkub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRsaW5rLnRyaWdnZXIoXCJjbGljay5nb29nbGVcIik7XG4gICAgICAgICAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5yZW1vdmUoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2NsZWFyU2VsZWN0aW9uKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyBIVC5yZWFkZXIuZW1pdCgnZG93bmxvYWREb25lJyk7XG4gICAgICAgICAgICAgICAgICAgIH0sIDE1MDApO1xuICAgICAgICAgICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBIVC51cGRhdGVfc3RhdHVzKGBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIFByZXNzIHJldHVybiB0byBkb3dubG9hZC5gKTtcbiAgICAgICAgICAgIC8vIHN0aWxsIGNvdWxkIGNhbmNlbFxuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS50ZXh0KGBQbGVhc2Ugd2FpdCB3aGlsZSB3ZSBidWlsZCB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfSAoJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWQpLmApO1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgJHtNYXRoLmNlaWwocGVyY2VudCl9JSBjb21wbGV0ZWRgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi50aW1lcik7XG4gICAgICAgICAgICBzZWxmLnRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwbGF5V2FybmluZzogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBwYXJzZUludChyZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtVW50aWxFcG9jaCcpKTtcbiAgICAgICAgdmFyIHJhdGUgPSByZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtUmF0ZScpXG5cbiAgICAgICAgaWYgKCB0aW1lb3V0IDw9IDUgKSB7XG4gICAgICAgICAgICAvLyBqdXN0IHB1bnQgYW5kIHdhaXQgaXQgb3V0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuICAgICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aW1lb3V0ICo9IDEwMDA7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIGNvdW50ZG93biA9ICggTWF0aC5jZWlsKCh0aW1lb3V0IC0gbm93KSAvIDEwMDApIClcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgKCc8ZGl2PicgK1xuICAgICAgICAgICAgJzxwPllvdSBoYXZlIGV4Y2VlZGVkIHRoZSBkb3dubG9hZCByYXRlIG9mIHtyYXRlfS4gWW91IG1heSBwcm9jZWVkIGluIDxzcGFuIGlkPVwidGhyb3R0bGUtdGltZW91dFwiPntjb3VudGRvd259PC9zcGFuPiBzZWNvbmRzLjwvcD4nICtcbiAgICAgICAgICAgICc8cD5Eb3dubG9hZCBsaW1pdHMgcHJvdGVjdCBIYXRoaVRydXN0IHJlc291cmNlcyBmcm9tIGFidXNlIGFuZCBoZWxwIGVuc3VyZSBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZSBmb3IgZXZlcnlvbmUuPC9wPicgK1xuICAgICAgICAgICc8L2Rpdj4nKS5yZXBsYWNlKCd7cmF0ZX0nLCByYXRlKS5yZXBsYWNlKCd7Y291bnRkb3dufScsIGNvdW50ZG93bik7XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1wcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcblxuICAgICAgICBzZWxmLmNvdW50ZG93bl90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb3VudGRvd24gLT0gMTtcbiAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIjdGhyb3R0bGUtdGltZW91dFwiKS50ZXh0KGNvdW50ZG93bik7XG4gICAgICAgICAgICAgIGlmICggY291bnRkb3duID09IDAgKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUSUMgVE9DXCIsIGNvdW50ZG93bik7XG4gICAgICAgIH0sIDEwMDApO1xuXG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9jZXNzRXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArIFxuICAgICAgICAgICAgICAgICdVbmZvcnR1bmF0ZWx5LCB0aGUgcHJvY2VzcyBmb3IgY3JlYXRpbmcgeW91ciBQREYgaGFzIGJlZW4gaW50ZXJydXB0ZWQuICcgKyBcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNsaWNrIFwiT0tcIiBhbmQgdHJ5IGFnYWluLicgKyBcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ0lmIHRoaXMgcHJvYmxlbSBwZXJzaXN0cyBhbmQgeW91IGFyZSB1bmFibGUgdG8gZG93bmxvYWQgdGhpcyBQREYgYWZ0ZXIgcmVwZWF0ZWQgYXR0ZW1wdHMsICcgKyBcbiAgICAgICAgICAgICAgICAncGxlYXNlIG5vdGlmeSB1cyBhdCA8YSBocmVmPVwiL2NnaS9mZWVkYmFjay8/cGFnZT1mb3JtXCIgZGF0YT1tPVwicHRcIiBkYXRhLXRvZ2dsZT1cImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiU2hvdyBGZWVkYmFja1wiPmZlZWRiYWNrQGlzc3Vlcy5oYXRoaXRydXN0Lm9yZzwvYT4gJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBpbmNsdWRlIHRoZSBVUkwgb2YgdGhlIGJvb2sgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY2VzcyB3aGVuIHRoZSBwcm9ibGVtIG9jY3VycmVkLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYSBwcm9ibGVtIGJ1aWxkaW5nIHlvdXIgJyArIHRoaXMuaXRlbV90aXRsZSArICc7IHN0YWZmIGhhdmUgYmVlbiBub3RpZmllZC4nICtcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gaW4gMjQgaG91cnMuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBsb2dFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJC5nZXQoc2VsZi5zcmMgKyAnO251bV9hdHRlbXB0cz0nICsgc2VsZi5udW1fYXR0ZW1wdHMpO1xuICAgIH0sXG5cblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBhbmQgZG8gdGhpcyBoZXJlXG4gICAgJChcIiNzZWxlY3RlZFBhZ2VzUGRmTGlua1wiKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuXG4gICAgICAgIGlmICggcHJpbnRhYmxlLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gcHJpbnQuPC9wPlwiIF07XG4gICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGFwcGVhciBpbiB0aGUgc2VsZWN0aW9uIGNvbnRlbnRzIDxidXR0b24gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6ICM2NjY7IGJvcmRlci1jb2xvcjogI2VlZVxcXCIgY2xhc3M9XFxcImJ0biBzcXVhcmVcXFwiPjxpIGNsYXNzPVxcXCJpY29tb29uIGljb21vb24tcGFwZXJzXFxcIiBzdHlsZT1cXFwiY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDE0cHg7XFxcIiAvPjwvYnV0dG9uPlwiKTtcblxuICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiT0tcIixcbiAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBib290Ym94LmRpYWxvZyhtc2csIGJ1dHRvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHByaW50YWJsZSk7XG5cbiAgICAgICAgJCh0aGlzKS5kYXRhKCdzZXEnLCBzZXEpO1xuICAgICAgICBIVC5kb3dubG9hZGVyLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgIH0pO1xuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHQ7XG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vayAnICtcbiAgICAgICAgICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgICAgICAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+PGkgY2xhc3M9XCJpY29tb29uIGljb21vb24taGVscFwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPjwvaT48c3BhbiBjbGFzcz1cIm9mZnNjcmVlblwiPkhlbHA6IEVtYmVkZGluZyBIYXRoaVRydXN0IEJvb2tzPC9zcGFuPjwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LXNjcm9sbFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPicgK1xuICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cInZpZXctc2Nyb2xsXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LWZsaXBcIiB2YWx1ZT1cIjFcIiA+JyArXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwidmlldy1mbGlwXCI+JyArXG4gICAgICAgICAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLWJvb2stYWx0MlwiLz4gRmxpcCBWaWV3ICcgK1xuICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgJzwvZm9ybT4nICtcbiAgICAnPC9kaXY+J1xuICAgICk7XG5cblxuICAgICQoXCIjZW1iZWRIdG1sXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfVxuICAgIF0pO1xuXG4gICAgICAgIC8vIEN1c3RvbSB3aWR0aCBmb3IgYm91bmRpbmcgJy5tb2RhbCcgXG4gICAgICAgICRibG9jay5jbG9zZXN0KCcubW9kYWwnKS5hZGRDbGFzcyhcImJvb3Rib3hNZWRpdW1XaWR0aFwiKTtcblxuICAgICAgICAvLyBTZWxlY3QgZW50aXJldHkgb2YgY29kZWJsb2NrIGZvciBlYXN5IGNvcHlpbmdcbiAgICAgICAgdmFyIHRleHRhcmVhID0gJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWNvZGVibG9ja11cIik7XG4gICAgdGV4dGFyZWEub24oXCJjbGlja1wiLCBmdW5jdGlvbiAoKSB7XG4gICAgICAgICQodGhpcykuc2VsZWN0KCk7XG4gICAgfSk7XG5cbiAgICAgICAgLy8gTW9kaWZ5IGNvZGVibG9jayB0byBvbmUgb2YgdHdvIHZpZXdzIFxuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctc2Nyb2xsXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LWZsaXBcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9sb25nLCBzaWRlX3Nob3J0KSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgIH0pO1xufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGZlZWRiYWNrIHN5c3RlbVxudmFyIEhUID0gSFQgfHwge307XG5IVC5mZWVkYmFjayA9IHt9O1xuSFQuZmVlZGJhY2suZGlhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgdmFyIGh0bWwgPVxuICAgICAgICAnPGZvcm0+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPkVtYWlsIEFkZHJlc3M8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGxhYmVsIGZvcj1cImVtYWlsXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5FTWFpbCBBZGRyZXNzPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBwbGFjZWhvbGRlcj1cIltZb3VyIGVtYWlsIGFkZHJlc3NdXCIgbmFtZT1cImVtYWlsXCIgaWQ9XCJlbWFpbFwiIC8+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPldlIHdpbGwgbWFrZSBldmVyeSBlZmZvcnQgdG8gYWRkcmVzcyBjb3B5cmlnaHQgaXNzdWVzIGJ5IHRoZSBuZXh0IGJ1c2luZXNzIGRheSBhZnRlciBub3RpZmljYXRpb24uPC9zcGFuPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPk92ZXJhbGwgcGFnZSByZWFkYWJpbGl0eSBhbmQgcXVhbGl0eTwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTFcIiB2YWx1ZT1cInJlYWRhYmxlXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIE1pc3NpbmcgcGFydHMgb2YgdGhlIHBhZ2UnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQmx1cnJ5IHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJjdXJ2ZWRcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgVGhpcyBpdGVtIGlzIGluIHRoZSBwdWJsaWMgZG9tYWluLCBidXQgSSBkb25cXCd0IGhhdmUgYWNjZXNzIHRvIGl0LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwiYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAgICAgSSBoYXZlIGFjY2VzcyB0byB0aGlzIGl0ZW0sIGJ1dCBzaG91bGQgbm90LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwibm9uZVwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgaW5pdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuXG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dC5zZWFyY2gtaW5wdXQtdGV4dFwiKTtcbiAgICB2YXIgJGlucHV0X2xhYmVsID0gJGZvcm0uZmluZChcImxhYmVsW2Zvcj0ncTEtaW5wdXQnXVwiKTtcbiAgICB2YXIgJHNlbGVjdCA9ICRmb3JtLmZpbmQoXCIuY29udHJvbC1zZWFyY2h0eXBlXCIpO1xuICAgIHZhciAkc2VhcmNoX3RhcmdldCA9ICRmb3JtLmZpbmQoXCIuc2VhcmNoLXRhcmdldFwiKTtcbiAgICB2YXIgJGZ0ID0gJGZvcm0uZmluZChcInNwYW4uZnVua3ktZnVsbC12aWV3XCIpO1xuXG4gICAgdmFyICRiYWNrZHJvcCA9IG51bGw7XG5cbiAgICB2YXIgJGFjdGlvbiA9ICQoXCIjYWN0aW9uLXNlYXJjaC1oYXRoaXRydXN0XCIpO1xuICAgICRhY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvb3Rib3guc2hvdygnc2VhcmNoLW1vZGFsJywge1xuICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgICAgICAgICRpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuXG4gICAgdmFyIF9zZXR1cCA9IHt9O1xuICAgIF9zZXR1cC5scyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LmhpZGUoKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCBvciB3aXRoaW4gdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggZnVsbC10ZXh0IGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgZnVsbC10ZXh0IGluZGV4LlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zZXR1cC5jYXRhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3Quc2hvdygpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGNhdGFsb2cgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBjYXRhbG9nIGluZGV4OyB5b3UgY2FuIGxpbWl0IHlvdXIgc2VhcmNoIHRvIGEgc2VsZWN0aW9uIG9mIGZpZWxkcy5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ID0gJHNlYXJjaF90YXJnZXQuZmluZChcImlucHV0OmNoZWNrZWRcIikudmFsKCk7XG4gICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICBpbml0ZWQgPSB0cnVlO1xuXG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgaWYgKCBwcmVmcy5zZWFyY2ggJiYgcHJlZnMuc2VhcmNoLmZ0ICkge1xuICAgICAgICAkKFwiaW5wdXRbbmFtZT1mdF1cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuXG4gICAgJHNlYXJjaF90YXJnZXQub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPVwicmFkaW9cIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IGxhYmVsIDogXCItXCIsIGNhdGVnb3J5IDogXCJIVCBTZWFyY2hcIiwgYWN0aW9uIDogdGFyZ2V0IH0pO1xuICAgIH0pXG5cbiAgICAvLyAkZm9ybS5kZWxlZ2F0ZSgnOmlucHV0JywgJ2ZvY3VzIGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJGT0NVU0lOR1wiLCB0aGlzKTtcbiAgICAvLyAgICAgJGZvcm0uYWRkQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCA9PSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wID0gJCgnPGRpdiBjbGFzcz1cIm1vZGFsX19vdmVybGF5IGludmlzaWJsZVwiPjwvZGl2PicpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAkYmFja2Ryb3AuYXBwZW5kVG8oJChcImJvZHlcIikpLnNob3coKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJChcImJvZHlcIikub24oJ2ZvY3VzJywgJzppbnB1dCxhJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIC8vICAgICBpZiAoICEgJHRoaXMuY2xvc2VzdChcIi5uYXYtc2VhcmNoLWZvcm1cIikubGVuZ3RoICkge1xuICAgIC8vICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gdmFyIGNsb3NlX3NlYXJjaF9mb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRmb3JtLnJlbW92ZUNsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgIT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5kZXRhY2goKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5oaWRlKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhZGQgZXZlbnQgaGFuZGxlciBmb3Igc3VibWl0IHRvIGNoZWNrIGZvciBlbXB0eSBxdWVyeSBvciBhc3Rlcmlza1xuICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbihldmVudClcbiAgICAgICAgIHtcblxuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuICAkKFwiI2Zvcm0tc2VhcmNoLXZvbHVtZVwiKS5zdWJtaXQoZnVuY3Rpb24oKSB7XG4gICAgdmFyICRmb3JtID0gJCh0aGlzKTtcbiAgICB2YXIgJHN1Ym1pdCA9ICRmb3JtLmZpbmQoXCJidXR0b25bdHlwZT1zdWJtaXRdXCIpO1xuICAgIGlmICggJHN1Ym1pdC5oYXNDbGFzcyhcImJ0bi1sb2FkaW5nXCIpICkge1xuICAgICAgYWxlcnQoXCJZb3VyIHNlYXJjaCBxdWVyeSBoYXMgYmVlbiBzdWJtaXR0ZWQgYW5kIGlzIGN1cnJlbnRseSBiZWluZyBwcm9jZXNzZWQuXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0W3R5cGU9dGV4dF1cIilcbiAgICBpZiAoICEgJC50cmltKCRpbnB1dC52YWwoKSkgKSB7XG4gICAgICBib290Ym94LmFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgdGVybSBpbiB0aGUgc2VhcmNoIGJveC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgICRzdWJtaXQuYWRkQ2xhc3MoXCJidG4tbG9hZGluZ1wiKS5hdHRyKFwiZGlzYWJsZWRcIiwgXCJkaXNhYmxlZFwiKTtcblxuICAgICQod2luZG93KS5vbigndW5sb2FkJywgZnVuY3Rpb24oKSB7XG4gICAgICAkc3VibWl0LnJlbW92ZUF0dHIoJ2Rpc2FibGVkJyk7XG4gICAgfSlcblxuICAgIHJldHVybiB0cnVlO1xuICB9KVxufSk7XG4iLCIvKipcbiAqIFNvY2lhbCBMaW5rc1xuICogSW5zcGlyZWQgYnk6IGh0dHA6Ly9zYXBlZ2luLmdpdGh1Yi5jb20vc29jaWFsLWxpa2VzXG4gKlxuICogU2hhcmluZyBidXR0b25zIGZvciBSdXNzaWFuIGFuZCB3b3JsZHdpZGUgc29jaWFsIG5ldHdvcmtzLlxuICpcbiAqIEByZXF1aXJlcyBqUXVlcnlcbiAqIEBhdXRob3IgQXJ0ZW0gU2FwZWdpblxuICogQGNvcHlyaWdodCAyMDE0IEFydGVtIFNhcGVnaW4gKHNhcGVnaW4ubWUpXG4gKiBAbGljZW5zZSBNSVRcbiAqL1xuXG4vKmdsb2JhbCBkZWZpbmU6ZmFsc2UsIHNvY2lhbExpbmtzQnV0dG9uczpmYWxzZSAqL1xuXG4oZnVuY3Rpb24oZmFjdG9yeSkgeyAgLy8gVHJ5IHRvIHJlZ2lzdGVyIGFzIGFuIGFub255bW91cyBBTUQgbW9kdWxlXG4gICAgaWYgKHR5cGVvZiBkZWZpbmUgPT09ICdmdW5jdGlvbicgJiYgZGVmaW5lLmFtZCkge1xuICAgICAgICBkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XG4gICAgfVxuICAgIGVsc2Uge1xuICAgICAgICBmYWN0b3J5KGpRdWVyeSk7XG4gICAgfVxufShmdW5jdGlvbigkLCB1bmRlZmluZWQpIHtcblxuICAgICd1c2Ugc3RyaWN0JztcblxuICAgIHZhciBwcmVmaXggPSAnc29jaWFsLWxpbmtzJztcbiAgICB2YXIgY2xhc3NQcmVmaXggPSBwcmVmaXggKyAnX18nO1xuICAgIHZhciBvcGVuQ2xhc3MgPSBwcmVmaXggKyAnX29wZW5lZCc7XG4gICAgdmFyIHByb3RvY29sID0gbG9jYXRpb24ucHJvdG9jb2wgPT09ICdodHRwczonID8gJ2h0dHBzOicgOiAnaHR0cDonO1xuICAgIHZhciBpc0h0dHBzID0gcHJvdG9jb2wgPT09ICdodHRwczonO1xuXG5cbiAgICAvKipcbiAgICAgKiBCdXR0b25zXG4gICAgICovXG4gICAgdmFyIHNlcnZpY2VzID0ge1xuICAgICAgICBmYWNlYm9vazoge1xuICAgICAgICAgICAgbGFiZWw6ICdGYWNlYm9vaycsXG4gICAgICAgICAgICAvLyBodHRwczovL2RldmVsb3BlcnMuZmFjZWJvb2suY29tL2RvY3MvcmVmZXJlbmNlL2ZxbC9saW5rX3N0YXQvXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly9ncmFwaC5mYWNlYm9vay5jb20vZnFsP3E9U0VMRUNUK3RvdGFsX2NvdW50K0ZST00rbGlua19zdGF0K1dIRVJFK3VybCUzRCUyMnt1cmx9JTIyJmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmRhdGFbMF0udG90YWxfY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3d3dy5mYWNlYm9vay5jb20vc2hhcmVyL3NoYXJlci5waHA/dT17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNTAwXG4gICAgICAgIH0sXG4gICAgICAgIHR3aXR0ZXI6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVHdpdHRlcicsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly9jZG4uYXBpLnR3aXR0ZXIuY29tLzEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vdHdpdHRlci5jb20vaW50ZW50L3R3ZWV0P3VybD17dXJsfSZ0ZXh0PXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNDUwLFxuICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIC8vIEFkZCBjb2xvbiB0byBpbXByb3ZlIHJlYWRhYmlsaXR5XG4gICAgICAgICAgICAgICAgaWYgKCEvW1xcLlxcPzpcXC3igJPigJRdXFxzKiQvLnRlc3QodGhpcy5vcHRpb25zLnRpdGxlKSkgdGhpcy5vcHRpb25zLnRpdGxlICs9ICc6JztcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICAgICAgbWFpbHJ1OiB7XG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2Nvbm5lY3QubWFpbC5ydS9zaGFyZV9jb3VudD91cmxfbGlzdD17dXJsfSZjYWxsYmFjaz0xJmZ1bmM9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgdXJsIGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkodXJsKSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGRhdGFbdXJsXS5zaGFyZXM7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vY29ubmVjdC5tYWlsLnJ1L3NoYXJlP3NoYXJlX3VybD17dXJsfSZ0aXRsZT17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICB2a29udGFrdGU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVksnLFxuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vdmsuY29tL3NoYXJlLnBocD9hY3Q9Y291bnQmdXJsPXt1cmx9JmluZGV4PXtpbmRleH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLnZrb250YWt0ZTtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuVkspIHdpbmRvdy5WSyA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuVksuU2hhcmUgPSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjb3VudDogZnVuY3Rpb24oaWR4LCBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl9baWR4XS5yZXNvbHZlKG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gb3B0aW9ucy5fLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBvcHRpb25zLl8ucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsLCB7aW5kZXg6IGluZGV4fSkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vdmsuY29tL3NoYXJlLnBocD91cmw9e3VybH0mdGl0bGU9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzMzBcbiAgICAgICAgfSxcbiAgICAgICAgb2Rub2tsYXNzbmlraToge1xuICAgICAgICAgICAgLy8gSFRUUFMgbm90IHN1cHBvcnRlZFxuICAgICAgICAgICAgY291bnRlclVybDogaXNIdHRwcyA/IHVuZGVmaW5lZCA6ICdodHRwOi8vY29ubmVjdC5vay5ydS9kaz9zdC5jbWQ9ZXh0TGlrZSZyZWY9e3VybH0mdWlkPXtpbmRleH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLm9kbm9rbGFzc25pa2k7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93Lk9ES0wpIHdpbmRvdy5PREtMID0ge307XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5PREtMLnVwZGF0ZUNvdW50ID0gZnVuY3Rpb24oaWR4LCBudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuX1tpZHhdLnJlc29sdmUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBvcHRpb25zLl8ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwsIHtpbmRleDogaW5kZXh9KSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHA6Ly9jb25uZWN0Lm9rLnJ1L2RrP3N0LmNtZD1XaWRnZXRTaGFyZVByZXZpZXcmc2VydmljZT1vZG5va2xhc3NuaWtpJnN0LnNoYXJlVXJsPXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgcGx1c29uZToge1xuICAgICAgICAgICAgbGFiZWw6ICdHb29nbGUrJyxcbiAgICAgICAgICAgIC8vIEhUVFBTIG5vdCBzdXBwb3J0ZWQgeWV0OiBodHRwOi8vY2x1YnMueWEucnUvc2hhcmUvMTQ5OVxuICAgICAgICAgICAgY291bnRlclVybDogaXNIdHRwcyA/IHVuZGVmaW5lZCA6ICdodHRwOi8vc2hhcmUueWFuZGV4LnJ1L2dwcC54bWw/dXJsPXt1cmx9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy5wbHVzb25lO1xuICAgICAgICAgICAgICAgIGlmIChvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgLy8gUmVqZWN0IGFsbCBjb3VudGVycyBleGNlcHQgdGhlIGZpcnN0IGJlY2F1c2UgWWFuZGV4IFNoYXJlIGNvdW50ZXIgZG9lc27igJl0IHJldHVybiBVUkxcbiAgICAgICAgICAgICAgICAgICAgZGVmZXJyZWQucmVqZWN0KCk7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5zZXJ2aWNlcykgd2luZG93LnNlcnZpY2VzID0ge307XG4gICAgICAgICAgICAgICAgd2luZG93LnNlcnZpY2VzLmdwbHVzID0ge1xuICAgICAgICAgICAgICAgICAgICBjYjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAodHlwZW9mIG51bWJlciA9PT0gJ3N0cmluZycpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBudW1iZXIgPSBudW1iZXIucmVwbGFjZSgvXFxEL2csICcnKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5yZXNvbHZlKHBhcnNlSW50KG51bWJlciwgMTApKTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH07XG5cbiAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBkZWZlcnJlZDtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwpKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly9wbHVzLmdvb2dsZS5jb20vc2hhcmU/dXJsPXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDcwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA1MDBcbiAgICAgICAgfSxcbiAgICAgICAgcGludGVyZXN0OiB7XG4gICAgICAgICAgICBsYWJlbDogJ1BpbnRlcmVzdCcsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vcGludGVyZXN0LmNvbS9waW4vY3JlYXRlL2J1dHRvbi8/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHR1bWJscjoge1xuICAgICAgICAgICAgbGFiZWw6ICdUdW1ibHInLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsMTogcHJvdG9jb2wgKyAnLy93d3cudHVtYmxyLmNvbS9zaGFyZS9saW5rP3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBVcmwyOiBwcm90b2NvbCArICcvL3d3dy50dW1ibHIuY29tL3NoYXJlL3Bob3RvP3NvdXJjZT17bWVkaWF9JmNsaWNrX3RocnU9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3B1cFVybCA9IHRoaXMub3B0aW9ucy5wb3B1cFVybDI7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvcHVwVXJsID0gdGhpcy5vcHRpb25zLnBvcHVwVXJsMTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgLy8gd2lsbCBzdGlsbCBuZWVkIHRvIGNoYW5nZSB0aGUgVVJMIHN0cnVjdHVyZVxuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgcmVkZGl0OiB7XG4gICAgICAgICAgICBsYWJlbDogJ1JlZGRpdCcsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6IHByb3RvY29sICsgJy8vcmVkZGl0LmNvbS9zdWJtaXQ/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIEVPVDogdHJ1ZVxuICAgIH07XG5cbiAgICAvKipcbiAgICAgKiBqUXVlcnkgcGx1Z2luXG4gICAgICovXG4gICAgJC5mbi5zb2NpYWxMaW5rcyA9IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgcmV0dXJuIHRoaXMuZWFjaChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBlbGVtID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciBpbnN0YW5jZSA9IGVsZW0uZGF0YShwcmVmaXgpO1xuICAgICAgICAgICAgaWYgKGluc3RhbmNlKSB7XG4gICAgICAgICAgICAgICAgaWYgKCQuaXNQbGFpbk9iamVjdChvcHRpb25zKSkge1xuICAgICAgICAgICAgICAgICAgICBpbnN0YW5jZS51cGRhdGUob3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgaW5zdGFuY2UgPSBuZXcgc29jaWFsTGlua3MoZWxlbSwgJC5leHRlbmQoe30sICQuZm4uc29jaWFsTGlua3MuZGVmYXVsdHMsIG9wdGlvbnMsIGRhdGFUb09wdGlvbnMoZWxlbSkpKTtcbiAgICAgICAgICAgICAgICBlbGVtLmRhdGEocHJlZml4LCBpbnN0YW5jZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH07XG5cbiAgICB2YXIgcG9zdF90aXRsZSA9IGRvY3VtZW50LnRpdGxlLnNwbGl0KCcgfCAnKVswXS5zcGxpdCgnIC0gJyk7XG4gICAgaWYgKCAkLmluQXJyYXkocG9zdF90aXRsZVtwb3N0X3RpdGxlLmxlbmd0aCAtIDFdLCBbICdGdWxsIFZpZXcnLCAnTGltaXRlZCBWaWV3JywgJ0l0ZW0gTm90IEF2YWlsYWJsZScgXSkgIT09IC0xICkge1xuICAgICAgICBwb3N0X3RpdGxlLnBvcCgpO1xuICAgIH1cbiAgICBwb3N0X3RpdGxlID0gcG9zdF90aXRsZS5qb2luKFwiIC0gXCIpICsgXCIgfCBIYXRoaVRydXN0XCI7XG4gICAgJC5mbi5zb2NpYWxMaW5rcy5kZWZhdWx0cyA9IHtcbiAgICAgICAgdXJsOiB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKHdpbmRvdy5sb2NhdGlvbi5oYXNoLCAnJykucmVwbGFjZSgvOy9nLCAnJicpLnJlcGxhY2UoJy9zaGNnaS8nLCAnL2NnaS8nKSxcbiAgICAgICAgcG9zdF90aXRsZTogcG9zdF90aXRsZSxcbiAgICAgICAgY291bnRlcnM6IHRydWUsXG4gICAgICAgIHplcm9lczogZmFsc2UsXG4gICAgICAgIHdhaXQ6IDUwMCwgIC8vIFNob3cgYnV0dG9ucyBvbmx5IGFmdGVyIGNvdW50ZXJzIGFyZSByZWFkeSBvciBhZnRlciB0aGlzIGFtb3VudCBvZiB0aW1lXG4gICAgICAgIHRpbWVvdXQ6IDEwMDAwLCAgLy8gU2hvdyBjb3VudGVycyBhZnRlciB0aGlzIGFtb3VudCBvZiB0aW1lIGV2ZW4gaWYgdGhleSBhcmVu4oCZdCByZWFkeVxuICAgICAgICBwb3B1cENoZWNrSW50ZXJ2YWw6IDUwMCxcbiAgICAgICAgc2luZ2xlVGl0bGU6ICdTaGFyZSdcbiAgICB9O1xuXG4gICAgZnVuY3Rpb24gc29jaWFsTGlua3MoY29udGFpbmVyLCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMuY29udGFpbmVyID0gY29udGFpbmVyO1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSBvcHRpb25zO1xuICAgICAgICB0aGlzLmluaXQoKTtcbiAgICB9XG5cbiAgICBzb2NpYWxMaW5rcy5wcm90b3R5cGUgPSB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgLy8gQWRkIGNsYXNzIGluIGNhc2Ugb2YgbWFudWFsIGluaXRpYWxpemF0aW9uXG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXgpO1xuXG4gICAgICAgICAgICB0aGlzLmluaXRVc2VyQnV0dG9ucygpO1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IHRoaXMuY29udGFpbmVyLmNoaWxkcmVuKCk7XG5cbiAgICAgICAgICAgIHRoaXMuYnV0dG9ucyA9IFtdO1xuICAgICAgICAgICAgYnV0dG9ucy5lYWNoKCQucHJveHkoZnVuY3Rpb24oaWR4LCBlbGVtKSB7XG4gICAgICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IG5ldyBCdXR0b24oJChlbGVtKSwgdGhpcy5vcHRpb25zKTtcbiAgICAgICAgICAgICAgICB0aGlzLmJ1dHRvbnMucHVzaChidXR0b24pO1xuICAgICAgICAgICAgfSwgdGhpcykpO1xuXG4gICAgICAgIH0sXG4gICAgICAgIGluaXRVc2VyQnV0dG9uczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICBpZiAoIXRoaXMudXNlckJ1dHRvbkluaXRlZCAmJiB3aW5kb3cuc29jaWFsTGlua3NCdXR0b25zKSB7XG4gICAgICAgICAgICAgICAgJC5leHRlbmQodHJ1ZSwgc2VydmljZXMsIHNvY2lhbExpbmtzQnV0dG9ucyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnVzZXJCdXR0b25Jbml0ZWQgPSB0cnVlO1xuICAgICAgICB9LFxuICAgICAgICBhcHBlYXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4ICsgJ192aXNpYmxlJyk7XG4gICAgICAgIH0sXG4gICAgICAgIHJlYWR5OiBmdW5jdGlvbihzaWxlbnQpIHtcbiAgICAgICAgICAgIGlmICh0aGlzLnRpbWVvdXQpIHtcbiAgICAgICAgICAgICAgICBjbGVhclRpbWVvdXQodGhpcy50aW1lb3V0KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCArICdfcmVhZHknKTtcbiAgICAgICAgICAgIGlmICghc2lsZW50KSB7XG4gICAgICAgICAgICAgICAgdGhpcy5jb250YWluZXIudHJpZ2dlcigncmVhZHkuJyArIHByZWZpeCwgdGhpcy5udW1iZXIpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgIH07XG5cblxuICAgIGZ1bmN0aW9uIEJ1dHRvbih3aWRnZXQsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy53aWRnZXQgPSB3aWRnZXQ7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5kZXRlY3RTZXJ2aWNlKCk7XG4gICAgICAgIGlmICh0aGlzLnNlcnZpY2UpIHtcbiAgICAgICAgICAgIHRoaXMuaW5pdCgpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgQnV0dG9uLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmRldGVjdFBhcmFtcygpO1xuICAgICAgICAgICAgdGhpcy5pbml0SHRtbCgpO1xuICAgICAgICAgICAgc2V0VGltZW91dCgkLnByb3h5KHRoaXMuaW5pdENvdW50ZXIsIHRoaXMpLCAwKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGU6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgICAgICQuZXh0ZW5kKHRoaXMub3B0aW9ucywge2ZvcmNlVXBkYXRlOiBmYWxzZX0sIG9wdGlvbnMpO1xuICAgICAgICAgICAgdGhpcy53aWRnZXQuZmluZCgnLicgKyBwcmVmaXggKyAnX19jb3VudGVyJykucmVtb3ZlKCk7ICAvLyBSZW1vdmUgb2xkIGNvdW50ZXJcbiAgICAgICAgICAgIHRoaXMuaW5pdENvdW50ZXIoKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRlY3RTZXJ2aWNlOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBzZXJ2aWNlID0gdGhpcy53aWRnZXQuZGF0YSgnc2VydmljZScpO1xuICAgICAgICAgICAgaWYgKCFzZXJ2aWNlKSB7XG4gICAgICAgICAgICAgICAgLy8gY2xhc3M9XCJmYWNlYm9va1wiXG4gICAgICAgICAgICAgICAgdmFyIG5vZGUgPSB0aGlzLndpZGdldFswXTtcbiAgICAgICAgICAgICAgICB2YXIgY2xhc3NlcyA9IG5vZGUuY2xhc3NMaXN0IHx8IG5vZGUuY2xhc3NOYW1lLnNwbGl0KCcgJyk7XG4gICAgICAgICAgICAgICAgZm9yICh2YXIgY2xhc3NJZHggPSAwOyBjbGFzc0lkeCA8IGNsYXNzZXMubGVuZ3RoOyBjbGFzc0lkeCsrKSB7XG4gICAgICAgICAgICAgICAgICAgIHZhciBjbHMgPSBjbGFzc2VzW2NsYXNzSWR4XTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKHNlcnZpY2VzW2Nsc10pIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlcnZpY2UgPSBjbHM7XG4gICAgICAgICAgICAgICAgICAgICAgICBicmVhaztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBpZiAoIXNlcnZpY2UpIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMuc2VydmljZSA9IHNlcnZpY2U7XG4gICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsIHNlcnZpY2VzW3NlcnZpY2VdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBkZXRlY3RQYXJhbXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSB0aGlzLndpZGdldC5kYXRhKCk7XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIGNvdW50ZXIgVVJMIG9yIG51bWJlclxuICAgICAgICAgICAgaWYgKGRhdGEuY291bnRlcikge1xuICAgICAgICAgICAgICAgIHZhciBudW1iZXIgPSBwYXJzZUludChkYXRhLmNvdW50ZXIsIDEwKTtcbiAgICAgICAgICAgICAgICBpZiAoaXNOYU4obnVtYmVyKSkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY291bnRlclVybCA9IGRhdGEuY291bnRlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jb3VudGVyTnVtYmVyID0gbnVtYmVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgdGl0bGVcbiAgICAgICAgICAgIGlmIChkYXRhLnRpdGxlKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnRpdGxlID0gZGF0YS50aXRsZTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9zdF90aXRsZSA9IHRoaXMub3B0aW9ucy50aXRsZTtcbiAgICAgICAgICAgICAgICBkZWxldGUgZGF0YS50aXRsZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgVVJMXG4gICAgICAgICAgICBpZiAoZGF0YS51cmwpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudXJsID0gZGF0YS51cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdEh0bWw6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgd2lkZ2V0ID0gdGhpcy53aWRnZXQ7XG5cbiAgICAgICAgICAgIHZhciBidXR0b24gPSB3aWRnZXQ7XG5cbiAgICAgICAgICAgIGlmIChvcHRpb25zLmNsaWNrVXJsKSB7XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IG1ha2VVcmwob3B0aW9ucy5jbGlja1VybCwge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxuICAgICAgICAgICAgICAgICAgICBwb3N0X3RpdGxlOiBvcHRpb25zLnBvc3RfdGl0bGVcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB2YXIgbGluayA9ICQoJzxhPicsIHtcbiAgICAgICAgICAgICAgICAgICAgaHJlZjogdXJsXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdGhpcy5jbG9uZURhdGFBdHRycyh3aWRnZXQsIGxpbmspO1xuICAgICAgICAgICAgICAgIHdpZGdldC5yZXBsYWNlV2l0aChsaW5rKTtcbiAgICAgICAgICAgICAgICB0aGlzLndpZGdldCA9IHdpZGdldCA9IGxpbms7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICB3aWRnZXQub24oJ2NsaWNrJywgJC5wcm94eSh0aGlzLmNsaWNrLCB0aGlzKSk7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciBfd2lkZ2V0ID0gd2lkZ2V0LmdldCgwKTtcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5yb2xlID0gJ3Rvb2x0aXAnO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0Lm1pY3JvdGlwUG9zaXRpb24gPSAndG9wJztcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5taWNyb3RpcFNpemUgPSAnc21hbGwnO1xuICAgICAgICAgICAgX3dpZGdldC5zZXRBdHRyaWJ1dGUoJ2FyaWEtbGFiZWwnLCB3aWRnZXQudGV4dCgpKTtcbiAgICAgICAgICAgIC8vIHdpZGdldC50b29sdGlwKHsgdGl0bGUgOiB3aWRnZXQudGV4dCgpLCBhbmltYXRpb246IGZhbHNlIH0pO1xuXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbiA9IGJ1dHRvbjtcbiAgICAgICAgfSxcblxuICAgICAgICBpbml0Q291bnRlcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xvbmVEYXRhQXR0cnM6IGZ1bmN0aW9uKHNvdXJjZSwgZGVzdGluYXRpb24pIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gc291cmNlLmRhdGEoKTtcbiAgICAgICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgaWYgKGRhdGEuaGFzT3duUHJvcGVydHkoa2V5KSkge1xuICAgICAgICAgICAgICAgICAgICBkZXN0aW5hdGlvbi5kYXRhKGtleSwgZGF0YVtrZXldKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG5cbiAgICAgICAgZ2V0RWxlbWVudENsYXNzTmFtZXM6IGZ1bmN0aW9uKGVsZW0pIHtcbiAgICAgICAgICAgIHJldHVybiBnZXRFbGVtZW50Q2xhc3NOYW1lcyhlbGVtLCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZUNvdW50ZXI6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgbnVtYmVyID0gcGFyc2VJbnQobnVtYmVyLCAxMCkgfHwgMDtcblxuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHtcbiAgICAgICAgICAgICAgICAnY2xhc3MnOiB0aGlzLmdldEVsZW1lbnRDbGFzc05hbWVzKCdjb3VudGVyJyksXG4gICAgICAgICAgICAgICAgJ3RleHQnOiBudW1iZXJcbiAgICAgICAgICAgIH07XG4gICAgICAgICAgICBpZiAoIW51bWJlciAmJiAhdGhpcy5vcHRpb25zLnplcm9lcykge1xuICAgICAgICAgICAgICAgIHBhcmFtc1snY2xhc3MnXSArPSAnICcgKyBwcmVmaXggKyAnX19jb3VudGVyX2VtcHR5JztcbiAgICAgICAgICAgICAgICBwYXJhbXMudGV4dCA9ICcnO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIGNvdW50ZXJFbGVtID0gJCgnPHNwYW4+JywgcGFyYW1zKTtcbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LmFwcGVuZChjb3VudGVyRWxlbSk7XG5cbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ2NvdW50ZXIuJyArIHByZWZpeCwgW3RoaXMuc2VydmljZSwgbnVtYmVyXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgdmFyIHByb2Nlc3MgPSB0cnVlO1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihvcHRpb25zLmNsaWNrKSkge1xuICAgICAgICAgICAgICAgIHByb2Nlc3MgPSBvcHRpb25zLmNsaWNrLmNhbGwodGhpcywgZSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAocHJvY2Vzcykge1xuICAgICAgICAgICAgICAgIHZhciBjb250ZXh0ID0ge1xuICAgICAgICAgICAgICAgICAgICB1cmw6IG9wdGlvbnMudXJsLFxuICAgICAgICAgICAgICAgICAgICBwb3N0X3RpdGxlOiBvcHRpb25zLnBvc3RfdGl0bGVcbiAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgY29udGV4dC5tZWRpYSA9IHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJyk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBtYWtlVXJsKG9wdGlvbnMucG9wdXBVcmwsIGNvbnRleHQpO1xuICAgICAgICAgICAgICAgIHVybCA9IHRoaXMuYWRkQWRkaXRpb25hbFBhcmFtc1RvVXJsKHVybCk7XG4gICAgICAgICAgICAgICAgdGhpcy5vcGVuUG9wdXAodXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIHdpZHRoOiBvcHRpb25zLnBvcHVwV2lkdGgsXG4gICAgICAgICAgICAgICAgICAgIGhlaWdodDogb3B0aW9ucy5wb3B1cEhlaWdodFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9LFxuXG4gICAgICAgIGFkZEFkZGl0aW9uYWxQYXJhbXNUb1VybDogZnVuY3Rpb24odXJsKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9ICBkYXRhVG9PcHRpb25zKHRoaXMud2lkZ2V0KTtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSAkLnBhcmFtKCQuZXh0ZW5kKGRhdGEsIHRoaXMub3B0aW9ucy5kYXRhKSk7XG4gICAgICAgICAgICBpZiAoJC5pc0VtcHR5T2JqZWN0KHBhcmFtcykpIHJldHVybiB1cmw7XG4gICAgICAgICAgICB2YXIgZ2x1ZSA9IHVybC5pbmRleE9mKCc/JykgPT09IC0xID8gJz8nIDogJyYnO1xuICAgICAgICAgICAgcmV0dXJuIHVybCArIGdsdWUgKyBwYXJhbXM7XG4gICAgICAgIH0sXG5cbiAgICAgICAgb3BlblBvcHVwOiBmdW5jdGlvbih1cmwsIHBhcmFtcykge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBNYXRoLnJvdW5kKHNjcmVlbi53aWR0aC8yIC0gcGFyYW1zLndpZHRoLzIpO1xuICAgICAgICAgICAgdmFyIHRvcCA9IDA7XG4gICAgICAgICAgICBpZiAoc2NyZWVuLmhlaWdodCA+IHBhcmFtcy5oZWlnaHQpIHtcbiAgICAgICAgICAgICAgICB0b3AgPSBNYXRoLnJvdW5kKHNjcmVlbi5oZWlnaHQvMyAtIHBhcmFtcy5oZWlnaHQvMik7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIHZhciB3aW4gPSB3aW5kb3cub3Blbih1cmwsICdzbF8nICsgdGhpcy5zZXJ2aWNlLCAnbGVmdD0nICsgbGVmdCArICcsdG9wPScgKyB0b3AgKyAnLCcgK1xuICAgICAgICAgICAgICAgJ3dpZHRoPScgKyBwYXJhbXMud2lkdGggKyAnLGhlaWdodD0nICsgcGFyYW1zLmhlaWdodCArICcscGVyc29uYWxiYXI9MCx0b29sYmFyPTAsc2Nyb2xsYmFycz0xLHJlc2l6YWJsZT0xJyk7XG4gICAgICAgICAgICBpZiAod2luKSB7XG4gICAgICAgICAgICAgICAgd2luLmZvY3VzKCk7XG4gICAgICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcigncG9wdXBfb3BlbmVkLicgKyBwcmVmaXgsIFt0aGlzLnNlcnZpY2UsIHdpbl0pO1xuICAgICAgICAgICAgICAgIHZhciB0aW1lciA9IHNldEludGVydmFsKCQucHJveHkoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luLmNsb3NlZCkgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHRpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcigncG9wdXBfY2xvc2VkLicgKyBwcmVmaXgsIHRoaXMuc2VydmljZSk7XG4gICAgICAgICAgICAgICAgfSwgdGhpcyksIHRoaXMub3B0aW9ucy5wb3B1cENoZWNrSW50ZXJ2YWwpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgbG9jYXRpb24uaHJlZiA9IHVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgIH07XG5cblxuICAgIC8qKlxuICAgICAqIEhlbHBlcnNcbiAgICAgKi9cblxuICAgICAvLyBDYW1lbGl6ZSBkYXRhLWF0dHJpYnV0ZXNcbiAgICBmdW5jdGlvbiBkYXRhVG9PcHRpb25zKGVsZW0pIHtcbiAgICAgICAgZnVuY3Rpb24gdXBwZXIobSwgbCkge1xuICAgICAgICAgICAgcmV0dXJuIGwudG9VcHBlcigpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBvcHRpb25zID0ge307XG4gICAgICAgIHZhciBkYXRhID0gZWxlbS5kYXRhKCk7XG4gICAgICAgIGZvciAodmFyIGtleSBpbiBkYXRhKSB7XG4gICAgICAgICAgICBpZiAoIGtleSA9PSAndG9vbHRpcCcgKSB7IGNvbnRpbnVlIDsgfVxuICAgICAgICAgICAgdmFyIHZhbHVlID0gZGF0YVtrZXldO1xuICAgICAgICAgICAgaWYgKHZhbHVlID09PSAneWVzJykgdmFsdWUgPSB0cnVlO1xuICAgICAgICAgICAgZWxzZSBpZiAodmFsdWUgPT09ICdubycpIHZhbHVlID0gZmFsc2U7XG4gICAgICAgICAgICBvcHRpb25zW2tleS5yZXBsYWNlKC8tKFxcdykvZywgdXBwZXIpXSA9IHZhbHVlO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiBvcHRpb25zO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIG1ha2VVcmwodXJsLCBjb250ZXh0KSB7XG4gICAgICAgIHJldHVybiB0ZW1wbGF0ZSh1cmwsIGNvbnRleHQsIGVuY29kZVVSSUNvbXBvbmVudCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gdGVtcGxhdGUodG1wbCwgY29udGV4dCwgZmlsdGVyKSB7XG4gICAgICAgIHJldHVybiB0bXBsLnJlcGxhY2UoL1xceyhbXlxcfV0rKVxcfS9nLCBmdW5jdGlvbihtLCBrZXkpIHtcbiAgICAgICAgICAgIC8vIElmIGtleSBkb2Vzbid0IGV4aXN0cyBpbiB0aGUgY29udGV4dCB3ZSBzaG91bGQga2VlcCB0ZW1wbGF0ZSB0YWcgYXMgaXNcbiAgICAgICAgICAgIHJldHVybiBrZXkgaW4gY29udGV4dCA/IChmaWx0ZXIgPyBmaWx0ZXIoY29udGV4dFtrZXldKSA6IGNvbnRleHRba2V5XSkgOiBtO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRFbGVtZW50Q2xhc3NOYW1lcyhlbGVtLCBtb2QpIHtcbiAgICAgICAgdmFyIGNscyA9IGNsYXNzUHJlZml4ICsgZWxlbTtcbiAgICAgICAgcmV0dXJuIGNscyArICcgJyArIGNscyArICdfJyArIG1vZDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjbG9zZU9uQ2xpY2soZWxlbSwgY2FsbGJhY2spIHtcbiAgICAgICAgZnVuY3Rpb24gaGFuZGxlcihlKSB7XG4gICAgICAgICAgICBpZiAoKGUudHlwZSA9PT0gJ2tleWRvd24nICYmIGUud2hpY2ggIT09IDI3KSB8fCAkKGUudGFyZ2V0KS5jbG9zZXN0KGVsZW0pLmxlbmd0aCkgcmV0dXJuO1xuICAgICAgICAgICAgZWxlbS5yZW1vdmVDbGFzcyhvcGVuQ2xhc3MpO1xuICAgICAgICAgICAgZG9jLm9mZihldmVudHMsIGhhbmRsZXIpO1xuICAgICAgICAgICAgaWYgKCQuaXNGdW5jdGlvbihjYWxsYmFjaykpIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIGRvYyA9ICQoZG9jdW1lbnQpO1xuICAgICAgICB2YXIgZXZlbnRzID0gJ2NsaWNrIHRvdWNoc3RhcnQga2V5ZG93bic7XG4gICAgICAgIGRvYy5vbihldmVudHMsIGhhbmRsZXIpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHNob3dJblZpZXdwb3J0KGVsZW0pIHtcbiAgICAgICAgdmFyIG9mZnNldCA9IDEwO1xuICAgICAgICBpZiAoZG9jdW1lbnQuZG9jdW1lbnRFbGVtZW50LmdldEJvdW5kaW5nQ2xpZW50UmVjdCkge1xuICAgICAgICAgICAgdmFyIGxlZnQgPSBwYXJzZUludChlbGVtLmNzcygnbGVmdCcpLCAxMCk7XG4gICAgICAgICAgICB2YXIgdG9wID0gcGFyc2VJbnQoZWxlbS5jc3MoJ3RvcCcpLCAxMCk7XG5cbiAgICAgICAgICAgIHZhciByZWN0ID0gZWxlbVswXS5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICAgIGlmIChyZWN0LmxlZnQgPCBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ2xlZnQnLCBvZmZzZXQgLSByZWN0LmxlZnQgKyBsZWZ0KTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHJlY3QucmlnaHQgPiB3aW5kb3cuaW5uZXJXaWR0aCAtIG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygnbGVmdCcsIHdpbmRvdy5pbm5lcldpZHRoIC0gcmVjdC5yaWdodCAtIG9mZnNldCArIGxlZnQpO1xuXG4gICAgICAgICAgICBpZiAocmVjdC50b3AgPCBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ3RvcCcsIG9mZnNldCAtIHJlY3QudG9wICsgdG9wKTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHJlY3QuYm90dG9tID4gd2luZG93LmlubmVySGVpZ2h0IC0gb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCd0b3AnLCB3aW5kb3cuaW5uZXJIZWlnaHQgLSByZWN0LmJvdHRvbSAtIG9mZnNldCArIHRvcCk7XG4gICAgICAgIH1cbiAgICAgICAgZWxlbS5hZGRDbGFzcyhvcGVuQ2xhc3MpO1xuICAgIH1cblxuXG4gICAgLyoqXG4gICAgICogQXV0byBpbml0aWFsaXphdGlvblxuICAgICAqL1xuICAgICQoZnVuY3Rpb24oKSB7XG4gICAgICAgICQoJy4nICsgcHJlZml4KS5zb2NpYWxMaW5rcygpO1xuICAgIH0pO1xuXG59KSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgJChcIiN2ZXJzaW9uSWNvblwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5hbGVydChcIjxwPlRoaXMgaXMgdGhlIGRhdGUgd2hlbiB0aGlzIGl0ZW0gd2FzIGxhc3QgdXBkYXRlZC4gVmVyc2lvbiBkYXRlcyBhcmUgdXBkYXRlZCB3aGVuIGltcHJvdmVtZW50cyBzdWNoIGFzIGhpZ2hlciBxdWFsaXR5IHNjYW5zIG9yIG1vcmUgY29tcGxldGUgc2NhbnMgaGF2ZSBiZWVuIG1hZGUuIDxiciAvPjxiciAvPjxhIGhyZWY9XFxcIi9jZ2kvZmVlZGJhY2s/cGFnZT1mb3JtXFxcIiBkYXRhLWRlZmF1bHQtZm9ybT1cXFwiZGF0YS1kZWZhdWx0LWZvcm1cXFwiIGRhdGEtdG9nZ2xlPVxcXCJmZWVkYmFjayB0cmFja2luZy1hY3Rpb25cXFwiIGRhdGEtaWQ9XFxcIlxcXCIgZGF0YS10cmFja2luZy1hY3Rpb249XFxcIlNob3cgRmVlZGJhY2tcXFwiPkNvbnRhY3QgdXM8L2E+IGZvciBtb3JlIGluZm9ybWF0aW9uLjwvcD5cIilcbiAgICB9KTtcblxufSk7XG4iXX0=
