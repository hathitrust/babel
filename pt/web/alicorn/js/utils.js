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
            msg.push("<p>Pages you select will appear in the selection contents <button style=\"background-color: #666; border-color: #eee\" class=\"btn square\"><i class=\"icomoon icomoon-attachment\" style=\"color: white; font-size: 14px;\" /></button>");

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
//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbInB1cmwuanMiLCJfYmFzZS5qcyIsImNvbGxlY3Rpb25fdG9vbHMuanMiLCJjcm1zLmpzIiwiZG93bmxvYWRlci5qcyIsImVtYmVkSFRNTF9wb3B1cC5qcyIsImZlZWRiYWNrLmpzIiwiZ2xvYmFsX3NlYXJjaC5qcyIsImdvb2dsZV9hbmFseXRpY3MuanMiLCJtZW51cy5qcyIsInNlYXJjaF9pbl9pdGVtLmpzIiwic29jaWFsX2xpbmtzLmpzIiwidmVyc2lvbl9wb3B1cC5qcyJdLCJuYW1lcyI6WyJmYWN0b3J5IiwiZGVmaW5lIiwiYW1kIiwialF1ZXJ5IiwiJCIsInVuZGVmaW5lZCIsInRhZzJhdHRyIiwiYSIsImltZyIsImZvcm0iLCJiYXNlIiwic2NyaXB0IiwiaWZyYW1lIiwibGluayIsImtleSIsImFsaWFzZXMiLCJwYXJzZXIiLCJzdHJpY3QiLCJsb29zZSIsInRvU3RyaW5nIiwiT2JqZWN0IiwicHJvdG90eXBlIiwiaXNpbnQiLCJwYXJzZVVyaSIsInVybCIsInN0cmljdE1vZGUiLCJzdHIiLCJkZWNvZGVVUkkiLCJyZXMiLCJleGVjIiwidXJpIiwiYXR0ciIsInBhcmFtIiwic2VnIiwiaSIsInBhcnNlU3RyaW5nIiwicGF0aCIsInJlcGxhY2UiLCJzcGxpdCIsImZyYWdtZW50IiwiaG9zdCIsInByb3RvY29sIiwicG9ydCIsImdldEF0dHJOYW1lIiwiZWxtIiwidG4iLCJ0YWdOYW1lIiwidG9Mb3dlckNhc2UiLCJwcm9tb3RlIiwicGFyZW50IiwibGVuZ3RoIiwidCIsInBhcnNlIiwicGFydHMiLCJ2YWwiLCJwYXJ0Iiwic2hpZnQiLCJpc0FycmF5IiwicHVzaCIsIm9iaiIsImtleXMiLCJpbmRleE9mIiwic3Vic3RyIiwidGVzdCIsIm1lcmdlIiwibGVuIiwibGFzdCIsImsiLCJzZXQiLCJyZWR1Y2UiLCJTdHJpbmciLCJyZXQiLCJwYWlyIiwiZGVjb2RlVVJJQ29tcG9uZW50IiwiZSIsImVxbCIsImJyYWNlIiwibGFzdEJyYWNlSW5LZXkiLCJ2IiwiYyIsImFjY3VtdWxhdG9yIiwibCIsImN1cnIiLCJhcmd1bWVudHMiLCJjYWxsIiwidkFyZyIsInByb3AiLCJoYXNPd25Qcm9wZXJ0eSIsInB1cmwiLCJ3aW5kb3ciLCJsb2NhdGlvbiIsImRhdGEiLCJxdWVyeSIsImZwYXJhbSIsInNlZ21lbnQiLCJmc2VnbWVudCIsImZuIiwiSFQiLCJoZWFkIiwicmVhZHkiLCIkc3RhdHVzIiwibGFzdE1lc3NhZ2UiLCJsYXN0VGltZXIiLCJ1cGRhdGVfc3RhdHVzIiwibWVzc2FnZSIsImNsZWFyVGltZW91dCIsInNldFRpbWVvdXQiLCJ0ZXh0IiwiY29uc29sZSIsImxvZyIsImdldCIsImlubmVyVGV4dCIsIkRFRkFVTFRfQ09MTF9NRU5VX09QVElPTiIsIk5FV19DT0xMX01FTlVfT1BUSU9OIiwiSU5fWU9VUl9DT0xMU19MQUJFTCIsIiR0b29sYmFyIiwiJGVycm9ybXNnIiwiJGluZm9tc2ciLCJkaXNwbGF5X2Vycm9yIiwibXNnIiwiaW5zZXJ0QWZ0ZXIiLCJzaG93IiwiZGlzcGxheV9pbmZvIiwiaGlkZV9lcnJvciIsImhpZGUiLCJoaWRlX2luZm8iLCJnZXRfdXJsIiwicGF0aG5hbWUiLCJwYXJzZV9saW5lIiwicmV0dmFsIiwidG1wIiwia3YiLCJlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEiLCJhcmdzIiwib3B0aW9ucyIsImV4dGVuZCIsImNyZWF0aW5nIiwibGFiZWwiLCIkYmxvY2siLCJjbiIsImZpbmQiLCJkZXNjIiwic2hyZCIsImxvZ2luX3N0YXR1cyIsImxvZ2dlZF9pbiIsImFwcGVuZFRvIiwicmVtb3ZlIiwiJGhpZGRlbiIsImNsb25lIiwiaWlkIiwiJGRpYWxvZyIsImJvb3Rib3giLCJkaWFsb2ciLCJjYWxsYmFjayIsImNoZWNrVmFsaWRpdHkiLCJyZXBvcnRWYWxpZGl0eSIsInRyaW0iLCJzdWJtaXRfcG9zdCIsImVhY2giLCIkdGhpcyIsIiRjb3VudCIsImxpbWl0IiwiYmluZCIsInBhcmFtcyIsInBhZ2UiLCJpZCIsImFqYXgiLCJkb25lIiwicmVzdWx0IiwiYWRkX2l0ZW1fdG9fY29sbGlzdCIsImZhaWwiLCJqcVhIUiIsInRleHRTdGF0dXMiLCJlcnJvclRocm93biIsIiR1bCIsImNvbGxfaHJlZiIsImNvbGxfaWQiLCIkYSIsImNvbGxfbmFtZSIsImFwcGVuZCIsIiRvcHRpb24iLCJjb25maXJtX2xhcmdlIiwiY29sbFNpemUiLCJhZGROdW1JdGVtcyIsIm51bVN0ciIsImNvbmZpcm0iLCJhbnN3ZXIiLCJjbGljayIsInByZXZlbnREZWZhdWx0IiwiYWN0aW9uIiwic2VsZWN0ZWRfY29sbGVjdGlvbl9pZCIsInNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSIsImMyIiwiaXMiLCJjcm1zX3N0YXRlIiwiaHJlZiIsIiRkaXYiLCIkcCIsIiRsaW5rIiwiRG93bmxvYWRlciIsImluaXQiLCJwZGYiLCJzdGFydCIsInNlbGYiLCJiaW5kRXZlbnRzIiwiYWRkQ2xhc3MiLCJoaWRlQWxsIiwiZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSIsImRvd25sb2FkUGRmIiwiZXhwbGFpblBkZkFjY2VzcyIsImh0bWwiLCJhbGVydCIsInNyYyIsIml0ZW1fdGl0bGUiLCJoZWFkZXIiLCJ0b3RhbCIsInN1ZmZpeCIsImNsb3NlTW9kYWwiLCJkYXRhVHlwZSIsImNhY2hlIiwiZXJyb3IiLCJyZXEiLCJzdGF0dXMiLCJkaXNwbGF5V2FybmluZyIsImRpc3BsYXlFcnJvciIsInJlcXVlc3REb3dubG9hZCIsImNhbmNlbERvd25sb2FkIiwicHJvZ3Jlc3NfdXJsIiwiZG93bmxvYWRfdXJsIiwiY2xlYXJUaW1lciIsInN0YXJ0RG93bmxvYWRNb25pdG9yIiwidGltZXIiLCJpc19ydW5uaW5nIiwibnVtX3Byb2Nlc3NlZCIsInNldEludGVydmFsIiwiY2hlY2tTdGF0dXMiLCJ0cyIsIkRhdGUiLCJnZXRUaW1lIiwic3VjY2VzcyIsInVwZGF0ZVByb2dyZXNzIiwibnVtX2F0dGVtcHRzIiwiZGlzcGxheVByb2Nlc3NFcnJvciIsImxvZ0Vycm9yIiwicGVyY2VudCIsImN1cnJlbnQiLCJjdXJyZW50X3BhZ2UiLCJsYXN0X3BlcmNlbnQiLCJyZW1vdmVDbGFzcyIsImNzcyIsIndpZHRoIiwiJGRvd25sb2FkX2J0biIsIm9uIiwidHJpZ2dlciIsInJlYWRlciIsImNvbnRyb2xzIiwic2VsZWN0aW5hdG9yIiwiX2NsZWFyU2VsZWN0aW9uIiwic3RvcFByb3BhZ2F0aW9uIiwiZm9jdXMiLCJNYXRoIiwiY2VpbCIsImNsZWFySW50ZXJ2YWwiLCJ0aW1lb3V0IiwicGFyc2VJbnQiLCJnZXRSZXNwb25zZUhlYWRlciIsInJhdGUiLCJub3ciLCJjb3VudGRvd24iLCJjb3VudGRvd25fdGltZXIiLCJjbGFzc2VzIiwiRU9UIiwiZG93bmxvYWRlciIsImNyZWF0ZSIsInByaW50YWJsZSIsIl9nZXRQYWdlU2VsZWN0aW9uIiwiYnV0dG9ucyIsInZpZXciLCJuYW1lIiwiam9pbiIsInNlcSIsIl9nZXRGbGF0dGVuZWRTZWxlY3Rpb24iLCJzaWRlX3Nob3J0Iiwic2lkZV9sb25nIiwiaHRJZCIsImVtYmVkSGVscExpbmsiLCJjb2RlYmxvY2tfdHh0X2EiLCJ3IiwiaCIsImNvZGVibG9ja190eHRfYiIsImNsb3Nlc3QiLCJ0ZXh0YXJlYSIsInNlbGVjdCIsImNvZGVibG9ja190eHQiLCJmZWVkYmFjayIsIiRmb3JtIiwiUmVjb3JkVVJMIiwiJGVtYWlsIiwiaW5pdGVkIiwiJGlucHV0IiwiJGlucHV0X2xhYmVsIiwiJHNlbGVjdCIsIiRzZWFyY2hfdGFyZ2V0IiwiJGZ0IiwiJGJhY2tkcm9wIiwiJGFjdGlvbiIsIm9uU2hvdyIsIm1vZGFsIiwiX3NldHVwIiwibHMiLCJjYXRhbG9nIiwidGFyZ2V0IiwicHJlZnMiLCJzZWFyY2giLCJmdCIsInZhbHVlIiwiYW5hbHl0aWNzIiwidHJhY2tFdmVudCIsImNhdGVnb3J5Iiwic3VibWl0IiwiZXZlbnQiLCJzZWFyY2h0eXBlIiwiZ2V0Q29udGVudEdyb3VwRGF0YSIsImNvbnRlbnRfZ3JvdXAiLCJpbmRleCIsIl9zaW1wbGlmeVBhZ2VIcmVmIiwibmV3X2hyZWYiLCJxcyIsImdldFBhZ2VIcmVmIiwiRElTTUlTU19FVkVOVCIsIiRtZW51cyIsInRvZ2dsZSIsIiRwb3B1cCIsIiRtZW51IiwibGlkeCIsIiRpdGVtIiwiJGl0ZW1zIiwiY29kZSIsInNlbGVjdGVkX2lkeCIsImRlbHRhIiwiJHNlbGVjdGVkIiwic2xpY2UiLCIkc3VibWl0IiwiaGFzQ2xhc3MiLCJyZW1vdmVBdHRyIiwicHJlZml4IiwiY2xhc3NQcmVmaXgiLCJvcGVuQ2xhc3MiLCJpc0h0dHBzIiwic2VydmljZXMiLCJmYWNlYm9vayIsImNvdW50ZXJVcmwiLCJjb252ZXJ0TnVtYmVyIiwidG90YWxfY291bnQiLCJwb3B1cFVybCIsInBvcHVwV2lkdGgiLCJwb3B1cEhlaWdodCIsInR3aXR0ZXIiLCJjb3VudCIsInRpdGxlIiwibWFpbHJ1Iiwic2hhcmVzIiwidmtvbnRha3RlIiwiY291bnRlciIsImpzb25VcmwiLCJkZWZlcnJlZCIsIl8iLCJWSyIsIlNoYXJlIiwiaWR4IiwibnVtYmVyIiwicmVzb2x2ZSIsImdldFNjcmlwdCIsIm1ha2VVcmwiLCJyZWplY3QiLCJvZG5va2xhc3NuaWtpIiwiT0RLTCIsInVwZGF0ZUNvdW50IiwicGx1c29uZSIsImdwbHVzIiwiY2IiLCJwaW50ZXJlc3QiLCJ0dW1ibHIiLCJwb3B1cFVybDEiLCJwb3B1cFVybDIiLCJ3aWRnZXQiLCJyZWRkaXQiLCJzb2NpYWxMaW5rcyIsImVsZW0iLCJpbnN0YW5jZSIsImlzUGxhaW5PYmplY3QiLCJ1cGRhdGUiLCJkZWZhdWx0cyIsImRhdGFUb09wdGlvbnMiLCJwb3N0X3RpdGxlIiwiZG9jdW1lbnQiLCJpbkFycmF5IiwicG9wIiwiaGFzaCIsImNvdW50ZXJzIiwiemVyb2VzIiwid2FpdCIsInBvcHVwQ2hlY2tJbnRlcnZhbCIsInNpbmdsZVRpdGxlIiwiY29udGFpbmVyIiwiaW5pdFVzZXJCdXR0b25zIiwiY2hpbGRyZW4iLCJwcm94eSIsImJ1dHRvbiIsIkJ1dHRvbiIsInVzZXJCdXR0b25Jbml0ZWQiLCJzb2NpYWxMaW5rc0J1dHRvbnMiLCJhcHBlYXIiLCJzaWxlbnQiLCJkZXRlY3RTZXJ2aWNlIiwic2VydmljZSIsImRldGVjdFBhcmFtcyIsImluaXRIdG1sIiwiaW5pdENvdW50ZXIiLCJmb3JjZVVwZGF0ZSIsIm5vZGUiLCJjbGFzc0xpc3QiLCJjbGFzc05hbWUiLCJjbGFzc0lkeCIsImNscyIsImlzTmFOIiwiY291bnRlck51bWJlciIsImNsaWNrVXJsIiwiY2xvbmVEYXRhQXR0cnMiLCJyZXBsYWNlV2l0aCIsIl93aWRnZXQiLCJkYXRhc2V0Iiwicm9sZSIsIm1pY3JvdGlwUG9zaXRpb24iLCJtaWNyb3RpcFNpemUiLCJzZXRBdHRyaWJ1dGUiLCJzb3VyY2UiLCJkZXN0aW5hdGlvbiIsImdldEVsZW1lbnRDbGFzc05hbWVzIiwidXBkYXRlQ291bnRlciIsImNvdW50ZXJFbGVtIiwicHJvY2VzcyIsImlzRnVuY3Rpb24iLCJjb250ZXh0IiwibWVkaWEiLCJhZGRBZGRpdGlvbmFsUGFyYW1zVG9VcmwiLCJvcGVuUG9wdXAiLCJoZWlnaHQiLCJpc0VtcHR5T2JqZWN0IiwiZ2x1ZSIsImxlZnQiLCJyb3VuZCIsInNjcmVlbiIsInRvcCIsIndpbiIsIm9wZW4iLCJjbG9zZWQiLCJ1cHBlciIsIm0iLCJ0b1VwcGVyIiwidGVtcGxhdGUiLCJlbmNvZGVVUklDb21wb25lbnQiLCJ0bXBsIiwiZmlsdGVyIiwibW9kIiwiY2xvc2VPbkNsaWNrIiwiaGFuZGxlciIsInR5cGUiLCJ3aGljaCIsImRvYyIsIm9mZiIsImV2ZW50cyIsInNob3dJblZpZXdwb3J0Iiwib2Zmc2V0IiwiZG9jdW1lbnRFbGVtZW50IiwiZ2V0Qm91bmRpbmdDbGllbnRSZWN0IiwicmVjdCIsInJpZ2h0IiwiaW5uZXJXaWR0aCIsImJvdHRvbSIsImlubmVySGVpZ2h0Il0sIm1hcHBpbmdzIjoiOzs7O0FBQUE7Ozs7Ozs7QUFPQSxDQUFDLENBQUMsVUFBU0EsT0FBVCxFQUFrQjtBQUNuQixLQUFJLE9BQU9DLE1BQVAsS0FBa0IsVUFBbEIs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V0FBaEI7QUFDSCxLQUZEO0FBSUgsQ0E3Z0JBLENBQUQ7OztBQ2RBalMsS0FBS0MsS0FBTCxDQUFXLFlBQVc7O0FBRWxCL0YsTUFBRSxjQUFGLEVBQWtCdUwsS0FBbEIsQ0FBd0IsVUFBU2pILENBQVQsRUFBWTtBQUNoQ0EsVUFBRWtILGNBQUY7QUFDQXJDLGdCQUFRNEQsS0FBUixDQUFjLG9ZQUFkO0FBQ0gsS0FIRDtBQUtILENBUEQiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyIvKlxuICogSlF1ZXJ5IFVSTCBQYXJzZXIgcGx1Z2luLCB2Mi4yLjFcbiAqIERldmVsb3BlZCBhbmQgbWFpbnRhbmluZWQgYnkgTWFyayBQZXJraW5zLCBtYXJrQGFsbG1hcmtlZHVwLmNvbVxuICogU291cmNlIHJlcG9zaXRvcnk6IGh0dHBzOi8vZ2l0aHViLmNvbS9hbGxtYXJrZWR1cC9qUXVlcnktVVJMLVBhcnNlclxuICogTGljZW5zZWQgdW5kZXIgYW4gTUlULXN0eWxlIGxpY2Vuc2UuIFNlZSBodHRwczovL2dpdGh1Yi5jb20vYWxsbWFya2VkdXAvalF1ZXJ5LVVSTC1QYXJzZXIvYmxvYi9tYXN0ZXIvTElDRU5TRSBmb3IgZGV0YWlscy5cbiAqLyBcblxuOyhmdW5jdGlvbihmYWN0b3J5KSB7XG5cdGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcblx0XHQvLyBBTUQgYXZhaWxhYmxlOyB1c2UgYW5vbnltb3VzIG1vZHVsZVxuXHRcdGlmICggdHlwZW9mIGpRdWVyeSAhPT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRkZWZpbmUoWydqcXVlcnknXSwgZmFjdG9yeSk7XHRcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZGVmaW5lKFtdLCBmYWN0b3J5KTtcblx0XHR9XG5cdH0gZWxzZSB7XG5cdFx0Ly8gTm8gQU1EIGF2YWlsYWJsZTsgbXV0YXRlIGdsb2JhbCB2YXJzXG5cdFx0aWYgKCB0eXBlb2YgalF1ZXJ5ICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcdGZhY3RvcnkoalF1ZXJ5KTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0ZmFjdG9yeSgpO1xuXHRcdH1cblx0fVxufSkoZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cdFxuXHR2YXIgdGFnMmF0dHIgPSB7XG5cdFx0XHRhICAgICAgIDogJ2hyZWYnLFxuXHRcdFx0aW1nICAgICA6ICdzcmMnLFxuXHRcdFx0Zm9ybSAgICA6ICdhY3Rpb24nLFxuXHRcdFx0YmFzZSAgICA6ICdocmVmJyxcblx0XHRcdHNjcmlwdCAgOiAnc3JjJyxcblx0XHRcdGlmcmFtZSAgOiAnc3JjJyxcblx0XHRcdGxpbmsgICAgOiAnaHJlZidcblx0XHR9LFxuXHRcdFxuXHRcdGtleSA9IFsnc291cmNlJywgJ3Byb3RvY29sJywgJ2F1dGhvcml0eScsICd1c2VySW5mbycsICd1c2VyJywgJ3Bhc3N3b3JkJywgJ2hvc3QnLCAncG9ydCcsICdyZWxhdGl2ZScsICdwYXRoJywgJ2RpcmVjdG9yeScsICdmaWxlJywgJ3F1ZXJ5JywgJ2ZyYWdtZW50J10sIC8vIGtleXMgYXZhaWxhYmxlIHRvIHF1ZXJ5XG5cdFx0XG5cdFx0YWxpYXNlcyA9IHsgJ2FuY2hvcicgOiAnZnJhZ21lbnQnIH0sIC8vIGFsaWFzZXMgZm9yIGJhY2t3YXJkcyBjb21wYXRhYmlsaXR5XG5cdFx0XG5cdFx0cGFyc2VyID0ge1xuXHRcdFx0c3RyaWN0IDogL14oPzooW146XFwvPyNdKyk6KT8oPzpcXC9cXC8oKD86KChbXjpAXSopOj8oW146QF0qKSk/QCk/KFteOlxcLz8jXSopKD86OihcXGQqKSk/KSk/KCgoKD86W14/I1xcL10qXFwvKSopKFtePyNdKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvLCAgLy9sZXNzIGludHVpdGl2ZSwgbW9yZSBhY2N1cmF0ZSB0byB0aGUgc3BlY3Ncblx0XHRcdGxvb3NlIDogIC9eKD86KD8hW146QF0rOlteOkBcXC9dKkApKFteOlxcLz8jLl0rKTopPyg/OlxcL1xcLyk/KCg/OigoW146QF0qKTo/KFteOkBdKikpP0ApPyhbXjpcXC8/I10qKSg/OjooXFxkKikpPykoKChcXC8oPzpbXj8jXSg/IVtePyNcXC9dKlxcLltePyNcXC8uXSsoPzpbPyNdfCQpKSkqXFwvPyk/KFtePyNcXC9dKikpKD86XFw/KFteI10qKSk/KD86IyguKikpPykvIC8vIG1vcmUgaW50dWl0aXZlLCBmYWlscyBvbiByZWxhdGl2ZSBwYXRocyBhbmQgZGV2aWF0ZXMgZnJvbSBzcGVjc1xuXHRcdH0sXG5cdFx0XG5cdFx0dG9TdHJpbmcgPSBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLFxuXHRcdFxuXHRcdGlzaW50ID0gL15bMC05XSskLztcblx0XG5cdGZ1bmN0aW9uIHBhcnNlVXJpKCB1cmwsIHN0cmljdE1vZGUgKSB7XG5cdFx0dmFyIHN0ciA9IGRlY29kZVVSSSggdXJsICksXG5cdFx0cmVzICAgPSBwYXJzZXJbIHN0cmljdE1vZGUgfHwgZmFsc2UgPyAnc3RyaWN0JyA6ICdsb29zZScgXS5leGVjKCBzdHIgKSxcblx0XHR1cmkgPSB7IGF0dHIgOiB7fSwgcGFyYW0gOiB7fSwgc2VnIDoge30gfSxcblx0XHRpICAgPSAxNDtcblx0XHRcblx0XHR3aGlsZSAoIGktLSApIHtcblx0XHRcdHVyaS5hdHRyWyBrZXlbaV0gXSA9IHJlc1tpXSB8fCAnJztcblx0XHR9XG5cdFx0XG5cdFx0Ly8gYnVpbGQgcXVlcnkgYW5kIGZyYWdtZW50IHBhcmFtZXRlcnNcdFx0XG5cdFx0dXJpLnBhcmFtWydxdWVyeSddID0gcGFyc2VTdHJpbmcodXJpLmF0dHJbJ3F1ZXJ5J10pO1xuXHRcdHVyaS5wYXJhbVsnZnJhZ21lbnQnXSA9IHBhcnNlU3RyaW5nKHVyaS5hdHRyWydmcmFnbWVudCddKTtcblx0XHRcblx0XHQvLyBzcGxpdCBwYXRoIGFuZCBmcmFnZW1lbnQgaW50byBzZWdtZW50c1x0XHRcblx0XHR1cmkuc2VnWydwYXRoJ10gPSB1cmkuYXR0ci5wYXRoLnJlcGxhY2UoL15cXC8rfFxcLyskL2csJycpLnNwbGl0KCcvJyk7ICAgICBcblx0XHR1cmkuc2VnWydmcmFnbWVudCddID0gdXJpLmF0dHIuZnJhZ21lbnQucmVwbGFjZSgvXlxcLyt8XFwvKyQvZywnJykuc3BsaXQoJy8nKTtcblx0XHRcblx0XHQvLyBjb21waWxlIGEgJ2Jhc2UnIGRvbWFpbiBhdHRyaWJ1dGUgICAgICAgIFxuXHRcdHVyaS5hdHRyWydiYXNlJ10gPSB1cmkuYXR0ci5ob3N0ID8gKHVyaS5hdHRyLnByb3RvY29sID8gIHVyaS5hdHRyLnByb3RvY29sKyc6Ly8nK3VyaS5hdHRyLmhvc3QgOiB1cmkuYXR0ci5ob3N0KSArICh1cmkuYXR0ci5wb3J0ID8gJzonK3VyaS5hdHRyLnBvcnQgOiAnJykgOiAnJzsgICAgICBcblx0XHQgIFxuXHRcdHJldHVybiB1cmk7XG5cdH07XG5cdFxuXHRmdW5jdGlvbiBnZXRBdHRyTmFtZSggZWxtICkge1xuXHRcdHZhciB0biA9IGVsbS50YWdOYW1lO1xuXHRcdGlmICggdHlwZW9mIHRuICE9PSAndW5kZWZpbmVkJyApIHJldHVybiB0YWcyYXR0clt0bi50b0xvd2VyQ2FzZSgpXTtcblx0XHRyZXR1cm4gdG47XG5cdH1cblx0XG5cdGZ1bmN0aW9uIHByb21vdGUocGFyZW50LCBrZXkpIHtcblx0XHRpZiAocGFyZW50W2tleV0ubGVuZ3RoID09IDApIHJldHVybiBwYXJlbnRba2V5XSA9IHt9O1xuXHRcdHZhciB0ID0ge307XG5cdFx0Zm9yICh2YXIgaSBpbiBwYXJlbnRba2V5XSkgdFtpXSA9IHBhcmVudFtrZXldW2ldO1xuXHRcdHBhcmVudFtrZXldID0gdDtcblx0XHRyZXR1cm4gdDtcblx0fVxuXG5cdGZ1bmN0aW9uIHBhcnNlKHBhcnRzLCBwYXJlbnQsIGtleSwgdmFsKSB7XG5cdFx0dmFyIHBhcnQgPSBwYXJ0cy5zaGlmdCgpO1xuXHRcdGlmICghcGFydCkge1xuXHRcdFx0aWYgKGlzQXJyYXkocGFyZW50W2tleV0pKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldLnB1c2godmFsKTtcblx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIHBhcmVudFtrZXldKSB7XG5cdFx0XHRcdHBhcmVudFtrZXldID0gdmFsO1xuXHRcdFx0fSBlbHNlIGlmICgndW5kZWZpbmVkJyA9PSB0eXBlb2YgcGFyZW50W2tleV0pIHtcblx0XHRcdFx0cGFyZW50W2tleV0gPSB2YWw7XG5cdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdH1cblx0XHR9IGVsc2Uge1xuXHRcdFx0dmFyIG9iaiA9IHBhcmVudFtrZXldID0gcGFyZW50W2tleV0gfHwgW107XG5cdFx0XHRpZiAoJ10nID09IHBhcnQpIHtcblx0XHRcdFx0aWYgKGlzQXJyYXkob2JqKSkge1xuXHRcdFx0XHRcdGlmICgnJyAhPSB2YWwpIG9iai5wdXNoKHZhbCk7XG5cdFx0XHRcdH0gZWxzZSBpZiAoJ29iamVjdCcgPT0gdHlwZW9mIG9iaikge1xuXHRcdFx0XHRcdG9ialtrZXlzKG9iaikubGVuZ3RoXSA9IHZhbDtcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRvYmogPSBwYXJlbnRba2V5XSA9IFtwYXJlbnRba2V5XSwgdmFsXTtcblx0XHRcdFx0fVxuXHRcdFx0fSBlbHNlIGlmICh+cGFydC5pbmRleE9mKCddJykpIHtcblx0XHRcdFx0cGFydCA9IHBhcnQuc3Vic3RyKDAsIHBhcnQubGVuZ3RoIC0gMSk7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0XHQvLyBrZXlcblx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdGlmICghaXNpbnQudGVzdChwYXJ0KSAmJiBpc0FycmF5KG9iaikpIG9iaiA9IHByb21vdGUocGFyZW50LCBrZXkpO1xuXHRcdFx0XHRwYXJzZShwYXJ0cywgb2JqLCBwYXJ0LCB2YWwpO1xuXHRcdFx0fVxuXHRcdH1cblx0fVxuXG5cdGZ1bmN0aW9uIG1lcmdlKHBhcmVudCwga2V5LCB2YWwpIHtcblx0XHRpZiAofmtleS5pbmRleE9mKCddJykpIHtcblx0XHRcdHZhciBwYXJ0cyA9IGtleS5zcGxpdCgnWycpLFxuXHRcdFx0bGVuID0gcGFydHMubGVuZ3RoLFxuXHRcdFx0bGFzdCA9IGxlbiAtIDE7XG5cdFx0XHRwYXJzZShwYXJ0cywgcGFyZW50LCAnYmFzZScsIHZhbCk7XG5cdFx0fSBlbHNlIHtcblx0XHRcdGlmICghaXNpbnQudGVzdChrZXkpICYmIGlzQXJyYXkocGFyZW50LmJhc2UpKSB7XG5cdFx0XHRcdHZhciB0ID0ge307XG5cdFx0XHRcdGZvciAodmFyIGsgaW4gcGFyZW50LmJhc2UpIHRba10gPSBwYXJlbnQuYmFzZVtrXTtcblx0XHRcdFx0cGFyZW50LmJhc2UgPSB0O1xuXHRcdFx0fVxuXHRcdFx0c2V0KHBhcmVudC5iYXNlLCBrZXksIHZhbCk7XG5cdFx0fVxuXHRcdHJldHVybiBwYXJlbnQ7XG5cdH1cblxuXHRmdW5jdGlvbiBwYXJzZVN0cmluZyhzdHIpIHtcblx0XHRyZXR1cm4gcmVkdWNlKFN0cmluZyhzdHIpLnNwbGl0KC8mfDsvKSwgZnVuY3Rpb24ocmV0LCBwYWlyKSB7XG5cdFx0XHR0cnkge1xuXHRcdFx0XHRwYWlyID0gZGVjb2RlVVJJQ29tcG9uZW50KHBhaXIucmVwbGFjZSgvXFwrL2csICcgJykpO1xuXHRcdFx0fSBjYXRjaChlKSB7XG5cdFx0XHRcdC8vIGlnbm9yZVxuXHRcdFx0fVxuXHRcdFx0dmFyIGVxbCA9IHBhaXIuaW5kZXhPZignPScpLFxuXHRcdFx0XHRicmFjZSA9IGxhc3RCcmFjZUluS2V5KHBhaXIpLFxuXHRcdFx0XHRrZXkgPSBwYWlyLnN1YnN0cigwLCBicmFjZSB8fCBlcWwpLFxuXHRcdFx0XHR2YWwgPSBwYWlyLnN1YnN0cihicmFjZSB8fCBlcWwsIHBhaXIubGVuZ3RoKSxcblx0XHRcdFx0dmFsID0gdmFsLnN1YnN0cih2YWwuaW5kZXhPZignPScpICsgMSwgdmFsLmxlbmd0aCk7XG5cblx0XHRcdGlmICgnJyA9PSBrZXkpIGtleSA9IHBhaXIsIHZhbCA9ICcnO1xuXG5cdFx0XHRyZXR1cm4gbWVyZ2UocmV0LCBrZXksIHZhbCk7XG5cdFx0fSwgeyBiYXNlOiB7fSB9KS5iYXNlO1xuXHR9XG5cdFxuXHRmdW5jdGlvbiBzZXQob2JqLCBrZXksIHZhbCkge1xuXHRcdHZhciB2ID0gb2JqW2tleV07XG5cdFx0aWYgKHVuZGVmaW5lZCA9PT0gdikge1xuXHRcdFx0b2JqW2tleV0gPSB2YWw7XG5cdFx0fSBlbHNlIGlmIChpc0FycmF5KHYpKSB7XG5cdFx0XHR2LnB1c2godmFsKTtcblx0XHR9IGVsc2Uge1xuXHRcdFx0b2JqW2tleV0gPSBbdiwgdmFsXTtcblx0XHR9XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGxhc3RCcmFjZUluS2V5KHN0cikge1xuXHRcdHZhciBsZW4gPSBzdHIubGVuZ3RoLFxuXHRcdFx0IGJyYWNlLCBjO1xuXHRcdGZvciAodmFyIGkgPSAwOyBpIDwgbGVuOyArK2kpIHtcblx0XHRcdGMgPSBzdHJbaV07XG5cdFx0XHRpZiAoJ10nID09IGMpIGJyYWNlID0gZmFsc2U7XG5cdFx0XHRpZiAoJ1snID09IGMpIGJyYWNlID0gdHJ1ZTtcblx0XHRcdGlmICgnPScgPT0gYyAmJiAhYnJhY2UpIHJldHVybiBpO1xuXHRcdH1cblx0fVxuXHRcblx0ZnVuY3Rpb24gcmVkdWNlKG9iaiwgYWNjdW11bGF0b3Ipe1xuXHRcdHZhciBpID0gMCxcblx0XHRcdGwgPSBvYmoubGVuZ3RoID4+IDAsXG5cdFx0XHRjdXJyID0gYXJndW1lbnRzWzJdO1xuXHRcdHdoaWxlIChpIDwgbCkge1xuXHRcdFx0aWYgKGkgaW4gb2JqKSBjdXJyID0gYWNjdW11bGF0b3IuY2FsbCh1bmRlZmluZWQsIGN1cnIsIG9ialtpXSwgaSwgb2JqKTtcblx0XHRcdCsraTtcblx0XHR9XG5cdFx0cmV0dXJuIGN1cnI7XG5cdH1cblx0XG5cdGZ1bmN0aW9uIGlzQXJyYXkodkFyZykge1xuXHRcdHJldHVybiBPYmplY3QucHJvdG90eXBlLnRvU3RyaW5nLmNhbGwodkFyZykgPT09IFwiW29iamVjdCBBcnJheV1cIjtcblx0fVxuXHRcblx0ZnVuY3Rpb24ga2V5cyhvYmopIHtcblx0XHR2YXIga2V5cyA9IFtdO1xuXHRcdGZvciAoIHByb3AgaW4gb2JqICkge1xuXHRcdFx0aWYgKCBvYmouaGFzT3duUHJvcGVydHkocHJvcCkgKSBrZXlzLnB1c2gocHJvcCk7XG5cdFx0fVxuXHRcdHJldHVybiBrZXlzO1xuXHR9XG5cdFx0XG5cdGZ1bmN0aW9uIHB1cmwoIHVybCwgc3RyaWN0TW9kZSApIHtcblx0XHRpZiAoIGFyZ3VtZW50cy5sZW5ndGggPT09IDEgJiYgdXJsID09PSB0cnVlICkge1xuXHRcdFx0c3RyaWN0TW9kZSA9IHRydWU7XG5cdFx0XHR1cmwgPSB1bmRlZmluZWQ7XG5cdFx0fVxuXHRcdHN0cmljdE1vZGUgPSBzdHJpY3RNb2RlIHx8IGZhbHNlO1xuXHRcdHVybCA9IHVybCB8fCB3aW5kb3cubG9jYXRpb24udG9TdHJpbmcoKTtcblx0XG5cdFx0cmV0dXJuIHtcblx0XHRcdFxuXHRcdFx0ZGF0YSA6IHBhcnNlVXJpKHVybCwgc3RyaWN0TW9kZSksXG5cdFx0XHRcblx0XHRcdC8vIGdldCB2YXJpb3VzIGF0dHJpYnV0ZXMgZnJvbSB0aGUgVVJJXG5cdFx0XHRhdHRyIDogZnVuY3Rpb24oIGF0dHIgKSB7XG5cdFx0XHRcdGF0dHIgPSBhbGlhc2VzW2F0dHJdIHx8IGF0dHI7XG5cdFx0XHRcdHJldHVybiB0eXBlb2YgYXR0ciAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEuYXR0clthdHRyXSA6IHRoaXMuZGF0YS5hdHRyO1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHF1ZXJ5IHN0cmluZyBwYXJhbWV0ZXJzXG5cdFx0XHRwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0ucXVlcnlbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLnF1ZXJ5O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHBhcmFtZXRlcnNcblx0XHRcdGZwYXJhbSA6IGZ1bmN0aW9uKCBwYXJhbSApIHtcblx0XHRcdFx0cmV0dXJuIHR5cGVvZiBwYXJhbSAhPT0gJ3VuZGVmaW5lZCcgPyB0aGlzLmRhdGEucGFyYW0uZnJhZ21lbnRbcGFyYW1dIDogdGhpcy5kYXRhLnBhcmFtLmZyYWdtZW50O1xuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIHBhdGggc2VnbWVudHNcblx0XHRcdHNlZ21lbnQgOiBmdW5jdGlvbiggc2VnICkge1xuXHRcdFx0XHRpZiAoIHR5cGVvZiBzZWcgPT09ICd1bmRlZmluZWQnICkge1xuXHRcdFx0XHRcdHJldHVybiB0aGlzLmRhdGEuc2VnLnBhdGg7XG5cdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0c2VnID0gc2VnIDwgMCA/IHRoaXMuZGF0YS5zZWcucGF0aC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5wYXRoW3NlZ107ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fVxuXHRcdFx0fSxcblx0XHRcdFxuXHRcdFx0Ly8gcmV0dXJuIGZyYWdtZW50IHNlZ21lbnRzXG5cdFx0XHRmc2VnbWVudCA6IGZ1bmN0aW9uKCBzZWcgKSB7XG5cdFx0XHRcdGlmICggdHlwZW9mIHNlZyA9PT0gJ3VuZGVmaW5lZCcgKSB7XG5cdFx0XHRcdFx0cmV0dXJuIHRoaXMuZGF0YS5zZWcuZnJhZ21lbnQ7ICAgICAgICAgICAgICAgICAgICBcblx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRzZWcgPSBzZWcgPCAwID8gdGhpcy5kYXRhLnNlZy5mcmFnbWVudC5sZW5ndGggKyBzZWcgOiBzZWcgLSAxOyAvLyBuZWdhdGl2ZSBzZWdtZW50cyBjb3VudCBmcm9tIHRoZSBlbmRcblx0XHRcdFx0XHRyZXR1cm4gdGhpcy5kYXRhLnNlZy5mcmFnbWVudFtzZWddOyAgICAgICAgICAgICAgICAgICAgXG5cdFx0XHRcdH1cblx0XHRcdH1cblx0ICAgIFx0XG5cdFx0fTtcblx0XG5cdH07XG5cdFxuXHRpZiAoIHR5cGVvZiAkICE9PSAndW5kZWZpbmVkJyApIHtcblx0XHRcblx0XHQkLmZuLnVybCA9IGZ1bmN0aW9uKCBzdHJpY3RNb2RlICkge1xuXHRcdFx0dmFyIHVybCA9ICcnO1xuXHRcdFx0aWYgKCB0aGlzLmxlbmd0aCApIHtcblx0XHRcdFx0dXJsID0gJCh0aGlzKS5hdHRyKCBnZXRBdHRyTmFtZSh0aGlzWzBdKSApIHx8ICcnO1xuXHRcdFx0fSAgICBcblx0XHRcdHJldHVybiBwdXJsKCB1cmwsIHN0cmljdE1vZGUgKTtcblx0XHR9O1xuXHRcdFxuXHRcdCQudXJsID0gcHVybDtcblx0XHRcblx0fSBlbHNlIHtcblx0XHR3aW5kb3cucHVybCA9IHB1cmw7XG5cdH1cblxufSk7XG5cbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICB2YXIgJHN0YXR1cyA9ICQoXCJkaXZbcm9sZT1zdGF0dXNdXCIpO1xuXG4gIHZhciBsYXN0TWVzc2FnZTsgdmFyIGxhc3RUaW1lcjtcbiAgSFQudXBkYXRlX3N0YXR1cyA9IGZ1bmN0aW9uKG1lc3NhZ2UpIHtcbiAgICAgIGlmICggbGFzdE1lc3NhZ2UgIT0gbWVzc2FnZSApIHtcbiAgICAgICAgaWYgKCBsYXN0VGltZXIgKSB7IGNsZWFyVGltZW91dChsYXN0VGltZXIpOyBsYXN0VGltZXIgPSBudWxsOyB9XG5cbiAgICAgICAgc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJHN0YXR1cy50ZXh0KG1lc3NhZ2UpO1xuICAgICAgICAgIGxhc3RNZXNzYWdlID0gbWVzc2FnZTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhcIi0tIHN0YXR1czpcIiwgbWVzc2FnZSk7XG4gICAgICAgIH0sIDUwKTtcbiAgICAgICAgbGFzdFRpbWVyID0gc2V0VGltZW91dCgoKSA9PiB7XG4gICAgICAgICAgJHN0YXR1cy5nZXQoMCkuaW5uZXJUZXh0ID0gJyc7XG4gICAgICAgIH0sIDUwMCk7XG5cbiAgICAgIH1cbiAgfVxuXG59KSIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGRpc3BsYXlfaW5mbyhtc2cpIHtcbiAgICAgICAgaWYgKCAhICRpbmZvbXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRpbmZvbXNnID0gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm8gaW5mb21zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRpbmZvbXNnLnRleHQobXNnKS5zaG93KCk7XG4gICAgICAgIEhULnVwZGF0ZV9zdGF0dXMobXNnKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2Vycm9yKCkge1xuICAgICAgICAkZXJyb3Jtc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBoaWRlX2luZm8oKSB7XG4gICAgICAgICRpbmZvbXNnLmhpZGUoKS50ZXh0KCk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0X3VybCgpIHtcbiAgICAgICAgdmFyIHVybCA9IFwiL2NnaS9tYlwiO1xuICAgICAgICBpZiAoIGxvY2F0aW9uLnBhdGhuYW1lLmluZGV4T2YoXCIvc2hjZ2kvXCIpID4gLTEgKSB7XG4gICAgICAgICAgICB1cmwgPSBcIi9zaGNnaS9tYlwiO1xuICAgICAgICB9XG4gICAgICAgIHJldHVybiB1cmw7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gcGFyc2VfbGluZShkYXRhKSB7XG4gICAgICAgIHZhciByZXR2YWwgPSB7fTtcbiAgICAgICAgdmFyIHRtcCA9IGRhdGEuc3BsaXQoXCJ8XCIpO1xuICAgICAgICBmb3IodmFyIGkgPSAwOyBpIDwgdG1wLmxlbmd0aDsgaSsrKSB7XG4gICAgICAgICAgICBrdiA9IHRtcFtpXS5zcGxpdChcIj1cIik7XG4gICAgICAgICAgICByZXR2YWxba3ZbMF1dID0ga3ZbMV07XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHJldHZhbDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBlZGl0X2NvbGxlY3Rpb25fbWV0YWRhdGEoYXJncykge1xuXG4gICAgICAgIHZhciBvcHRpb25zID0gJC5leHRlbmQoeyBjcmVhdGluZyA6IGZhbHNlLCBsYWJlbCA6IFwiU2F2ZSBDaGFuZ2VzXCIgfSwgYXJncyk7XG5cbiAgICAgICAgdmFyICRibG9jayA9ICQoXG4gICAgICAgICAgICAnPGZvcm0gY2xhc3M9XCJmb3JtLWhvcml6b250YWxcIiBhY3Rpb249XCJtYlwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtY25cIj5Db2xsZWN0aW9uIE5hbWU8L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJ0ZXh0XCIgY2xhc3M9XCJpbnB1dC1sYXJnZVwiIG1heGxlbmd0aD1cIjEwMFwiIG5hbWU9XCJjblwiIGlkPVwiZWRpdC1jblwiIHZhbHVlPVwiXCIgcGxhY2Vob2xkZXI9XCJZb3VyIGNvbGxlY3Rpb24gbmFtZVwiIHJlcXVpcmVkIC8+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWNuLWNvdW50XCI+MTAwPC9zcGFuPicgK1xuICAgICAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbC1ncm91cFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwiY29udHJvbC1sYWJlbFwiIGZvcj1cImVkaXQtZGVzY1wiPkRlc2NyaXB0aW9uPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzx0ZXh0YXJlYSBpZD1cImVkaXQtZGVzY1wiIG5hbWU9XCJkZXNjXCIgcm93cz1cIjRcIiBtYXhsZW5ndGg9XCIyNTVcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgcGxhY2Vob2xkZXI9XCJBZGQgeW91ciBjb2xsZWN0aW9uIGRlc2NyaXB0aW9uLlwiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHNwYW4gY2xhc3M9XCJsYWJlbCBjb3VudGVyXCIgaWQ9XCJlZGl0LWRlc2MtY291bnRcIj4yNTU8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCI+SXMgdGhpcyBjb2xsZWN0aW9uIDxzdHJvbmc+UHVibGljPC9zdHJvbmc+IG9yIDxzdHJvbmc+UHJpdmF0ZTwvc3Ryb25nPj88L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMFwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQcml2YXRlICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJzaHJkXCIgaWQ9XCJlZGl0LXNocmQtMVwiIHZhbHVlPVwiMVwiID4gJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCIgZm9yPVwiZWRpdC1zaHJkLTFcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAnUHVibGljICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPC9mb3JtPidcbiAgICAgICAgKTtcblxuICAgICAgICBpZiAoIG9wdGlvbnMuY24gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbChvcHRpb25zLmNuKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy5kZXNjICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbChvcHRpb25zLmRlc2MpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLnNocmQgIT0gbnVsbCApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT1cIiArIG9wdGlvbnMuc2hyZCArICddJykuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICB9IGVsc2UgaWYgKCAhIEhULmxvZ2luX3N0YXR1cy5sb2dnZWRfaW4gKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MF1cIikuYXR0cihcImNoZWNrZWRcIiwgXCJjaGVja2VkXCIpO1xuICAgICAgICAgICAgJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWluZm9cIj48c3Ryb25nPlRoaXMgY29sbGVjdGlvbiB3aWxsIGJlIHRlbXBvcmFyeTwvc3Ryb25nPi4gTG9nIGluIHRvIGNyZWF0ZSBwZXJtYW5lbnQgYW5kIHB1YmxpYyBjb2xsZWN0aW9ucy48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgLy8gcmVtb3ZlIHRoZSA8bGFiZWw+IHRoYXQgd3JhcHMgdGhlIHJhZGlvIGJ1dHRvblxuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPTFdXCIpLnJlbW92ZSgpO1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJsYWJlbFtmb3I9J2VkaXQtc2hyZC0xJ11cIikucmVtb3ZlKCk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuJGhpZGRlbiApIHtcbiAgICAgICAgICAgIG9wdGlvbnMuJGhpZGRlbi5jbG9uZSgpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nYycgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5jKTtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdhJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmEpO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmlpZCApIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdpaWQnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuaWlkKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHZhciAkZGlhbG9nID0gYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogb3B0aW9ucy5sYWJlbCxcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0biBidG4tcHJpbWFyeSBidG4tZGlzbWlzc1wiLFxuICAgICAgICAgICAgICAgIGNhbGxiYWNrIDogZnVuY3Rpb24oKSB7XG5cbiAgICAgICAgICAgICAgICAgICAgdmFyIGZvcm0gPSAkYmxvY2suZ2V0KDApO1xuICAgICAgICAgICAgICAgICAgICBpZiAoICEgZm9ybS5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBmb3JtLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgICAgICB2YXIgY24gPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPWNuXVwiKS52YWwoKSk7XG4gICAgICAgICAgICAgICAgICAgIHZhciBkZXNjID0gJC50cmltKCRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1kZXNjXVwiKS52YWwoKSk7XG5cbiAgICAgICAgICAgICAgICAgICAgaWYgKCAhIGNuICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gJCgnPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWVycm9yXCI+WW91IG11c3QgZW50ZXIgYSBjb2xsZWN0aW9uIG5hbWUuPC9kaXY+JykuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIGRpc3BsYXlfaW5mbyhcIlN1Ym1pdHRpbmc7IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICAgICAgICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICAgICAgICAgICAgICBhIDogJ2FkZGl0c25jJyxcbiAgICAgICAgICAgICAgICAgICAgICAgIGNuIDogY24sXG4gICAgICAgICAgICAgICAgICAgICAgICBkZXNjIDogZGVzYyxcbiAgICAgICAgICAgICAgICAgICAgICAgIHNocmQgOiAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF06Y2hlY2tlZFwiKS52YWwoKVxuICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgXSk7XG5cbiAgICAgICAgJGRpYWxvZy5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XSx0ZXh0YXJlYVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyICR0aGlzID0gJCh0aGlzKTtcbiAgICAgICAgICAgIHZhciAkY291bnQgPSAkKFwiI1wiICsgJHRoaXMuYXR0cignaWQnKSArIFwiLWNvdW50XCIpO1xuICAgICAgICAgICAgdmFyIGxpbWl0ID0gJHRoaXMuYXR0cihcIm1heGxlbmd0aFwiKTtcblxuICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuXG4gICAgICAgICAgICAkdGhpcy5iaW5kKCdrZXl1cCcsIGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICRjb3VudC50ZXh0KGxpbWl0IC0gJHRoaXMudmFsKCkubGVuZ3RoKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICB9KVxuICAgIH1cblxuICAgIGZ1bmN0aW9uIHN1Ym1pdF9wb3N0KHBhcmFtcykge1xuICAgICAgICB2YXIgZGF0YSA9ICQuZXh0ZW5kKHt9LCB7IHBhZ2UgOiAnYWpheCcsIGlkIDogSFQucGFyYW1zLmlkIH0sIHBhcmFtcyk7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBnZXRfdXJsKCksXG4gICAgICAgICAgICBkYXRhIDogZGF0YVxuICAgICAgICB9KS5kb25lKGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSBwYXJzZV9saW5lKGRhdGEpO1xuICAgICAgICAgICAgaGlkZV9pbmZvKCk7XG4gICAgICAgICAgICBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX1NVQ0NFU1MnICkge1xuICAgICAgICAgICAgICAgIC8vIGRvIHNvbWV0aGluZ1xuICAgICAgICAgICAgICAgIGFkZF9pdGVtX3RvX2NvbGxpc3QocGFyYW1zKTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIHBhcmFtcy5yZXN1bHQgPT0gJ0FERF9JVEVNX0ZBSUxVUkUnICkge1xuICAgICAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJJdGVtIGNvdWxkIG5vdCBiZSBhZGRlZCBhdCB0aGlzIHRpbWUuXCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhkYXRhKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSkuZmFpbChmdW5jdGlvbihqcVhIUiwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpIHtcbiAgICAgICAgdmFyICR1bCA9ICQoXCIuY29sbGVjdGlvbi1tZW1iZXJzaGlwXCIpO1xuICAgICAgICB2YXIgY29sbF9ocmVmID0gZ2V0X3VybCgpICsgXCI/YT1saXN0aXM7Yz1cIiArIHBhcmFtcy5jb2xsX2lkO1xuICAgICAgICB2YXIgJGEgPSAkKFwiPGE+XCIpLmF0dHIoXCJocmVmXCIsIGNvbGxfaHJlZikudGV4dChwYXJhbXMuY29sbF9uYW1lKTtcbiAgICAgICAgJChcIjxsaT48L2xpPlwiKS5hcHBlbmRUbygkdWwpLmFwcGVuZCgkYSk7XG5cbiAgICAgICAgJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXAtc3VtbWFyeVwiKS50ZXh0KElOX1lPVVJfQ09MTFNfTEFCRUwpO1xuXG4gICAgICAgIC8vIGFuZCB0aGVuIGZpbHRlciBvdXQgdGhlIGxpc3QgZnJvbSB0aGUgc2VsZWN0XG4gICAgICAgIHZhciAkb3B0aW9uID0gJHRvb2xiYXIuZmluZChcIm9wdGlvblt2YWx1ZT0nXCIgKyBwYXJhbXMuY29sbF9pZCArIFwiJ11cIik7XG4gICAgICAgICRvcHRpb24ucmVtb3ZlKCk7XG5cbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhgQWRkZWQgaXRlbSB0byBjb2xsZWN0aW9uICR7cGFyYW1zLmNvbGxfbmFtZX1gKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJBZGRpbmcgaXRlbSB0byB5b3VyIGNvbGxlY3Rpb247IHBsZWFzZSB3YWl0Li4uXCIpO1xuICAgICAgICBzdWJtaXRfcG9zdCh7XG4gICAgICAgICAgICBjMiA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICBhICA6ICdhZGRpdHMnXG4gICAgICAgIH0pO1xuXG4gICAgfSlcblxufSk7XG4iLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gIGlmICggISAkKFwiaHRtbFwiKS5pcyhcIi5jcm1zXCIpICkge1xuICAgIHJldHVybjtcbiAgfVxuXG4gIC8vIGlmICggJChcIi5uYXZiYXItc3RhdGljLXRvcFwiKS5kYXRhKCdsb2dnZWRpbicpICE9ICdZRVMnICYmIHdpbmRvdy5sb2NhdGlvbi5wcm90b2NvbCA9PSAnaHR0cHM6JyApIHtcbiAgLy8gICAgIC8vIGhvcnJpYmxlIGhhY2tcbiAgLy8gICAgIHZhciB0YXJnZXQgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5yZXBsYWNlKC9cXCQvZywgJyUyNCcpO1xuICAvLyAgICAgdmFyIGhyZWYgPSAnaHR0cHM6Ly8nICsgd2luZG93LmxvY2F0aW9uLmhvc3RuYW1lICsgJy9TaGliYm9sZXRoLnNzby9Mb2dpbj9lbnRpdHlJRD1odHRwczovL3NoaWJib2xldGgudW1pY2guZWR1L2lkcC9zaGliYm9sZXRoJnRhcmdldD0nICsgdGFyZ2V0O1xuICAvLyAgICAgd2luZG93LmxvY2F0aW9uLmhyZWYgPSBocmVmO1xuICAvLyAgICAgcmV0dXJuO1xuICAvLyB9XG5cbiAgLy8gZGVmaW5lIENSTVMgc3RhdGVcbiAgSFQuY3Jtc19zdGF0ZSA9ICdDUk1TLVVTJztcbiAgdmFyIGkgPSB3aW5kb3cubG9jYXRpb24uaHJlZi5pbmRleE9mKCdza2luPWNybXN3b3JsZCcpO1xuICBpZiAoIGkgKyAxICE9IDAgKSB7XG4gICAgICBIVC5jcm1zX3N0YXRlID0gJ0NSTVMtV29ybGQnO1xuICB9XG5cbiAgLy8gZGlzcGxheSBiaWIgaW5mb3JtYXRpb25cbiAgdmFyICRkaXYgPSAkKFwiLmJpYkxpbmtzXCIpO1xuICB2YXIgJHAgPSAkZGl2LmZpbmQoXCJwOmZpcnN0XCIpO1xuICAkcC5maW5kKFwic3BhbjplbXB0eVwiKS5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgLy8gJCh0aGlzKS50ZXh0KCQodGhpcykuYXR0cihcImNvbnRlbnRcIikpLmFkZENsYXNzKFwiYmxvY2tlZFwiKTtcbiAgICAgIHZhciBmcmFnbWVudCA9ICc8c3BhbiBjbGFzcz1cImJsb2NrZWRcIj48c3Ryb25nPntsYWJlbH06PC9zdHJvbmc+IHtjb250ZW50fTwvc3Bhbj4nO1xuICAgICAgZnJhZ21lbnQgPSBmcmFnbWVudC5yZXBsYWNlKCd7bGFiZWx9JywgJCh0aGlzKS5hdHRyKCdwcm9wZXJ0eScpLnN1YnN0cigzKSkucmVwbGFjZSgne2NvbnRlbnR9JywgJCh0aGlzKS5hdHRyKFwiY29udGVudFwiKSk7XG4gICAgICAkcC5hcHBlbmQoZnJhZ21lbnQpO1xuICB9KVxuXG4gIHZhciAkbGluayA9ICQoXCIjZW1iZWRIdG1sXCIpO1xuICBjb25zb2xlLmxvZyhcIkFIT1kgRU1CRURcIiwgJGxpbmspO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcblxuICAkbGluayA9ICQoXCJhW2RhdGEtdG9nZ2xlPSdQVCBGaW5kIGluIGEgTGlicmFyeSddXCIpO1xuICAkbGluay5wYXJlbnQoKS5yZW1vdmUoKTtcbn0pXG4iLCIvLyBkb3dubG9hZGVyXG5cbnZhciBIVCA9IEhUIHx8IHt9O1xuXG5IVC5Eb3dubG9hZGVyID0ge1xuXG4gICAgaW5pdDogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgdGhpcy5vcHRpb25zLCBvcHRpb25zKTtcbiAgICAgICAgdGhpcy5pZCA9IHRoaXMub3B0aW9ucy5wYXJhbXMuaWQ7XG4gICAgICAgIHRoaXMucGRmID0ge307XG4gICAgICAgIHJldHVybiB0aGlzO1xuICAgIH0sXG5cbiAgICBvcHRpb25zOiB7XG5cbiAgICB9LFxuXG4gICAgc3RhcnQgOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB0aGlzLmJpbmRFdmVudHMoKTtcbiAgICB9LFxuXG4gICAgYmluZEV2ZW50czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJChcImFbZGF0YS10b2dnbGUqPWRvd25sb2FkXVwiKS5hZGRDbGFzcyhcImludGVyYWN0aXZlXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIGJvb3Rib3guaGlkZUFsbCgpO1xuICAgICAgICAgICAgaWYgKCAkKHRoaXMpLmF0dHIoXCJyZWxcIikgPT0gJ2FsbG93JyApIHtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYub3B0aW9ucy5wYXJhbXMuZG93bmxvYWRfcHJvZ3Jlc3NfYmFzZSA9PSBudWxsICkge1xuICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgc2VsZi5kb3dubG9hZFBkZih0aGlzKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgc2VsZi5leHBsYWluUGRmQWNjZXNzKHRoaXMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9KVxuXG4gICAgfSxcblxuICAgIGV4cGxhaW5QZGZBY2Nlc3M6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIGh0bWwgPSAkKFwiI25vRG93bmxvYWRBY2Nlc3NcIikuaHRtbCgpO1xuICAgICAgICBodG1sID0gaHRtbC5yZXBsYWNlKCd7RE9XTkxPQURfTElOS30nLCAkKHRoaXMpLmF0dHIoXCJocmVmXCIpKTtcbiAgICAgICAgdGhpcy4kZGlhbG9nID0gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgLy8gdGhpcy4kZGlhbG9nLmFkZENsYXNzKFwibG9naW5cIik7XG4gICAgfSxcblxuICAgIGRvd25sb2FkUGRmOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi4kbGluayA9ICQobGluayk7XG4gICAgICAgIHNlbGYuc3JjID0gJChsaW5rKS5hdHRyKCdocmVmJyk7XG4gICAgICAgIHNlbGYuaXRlbV90aXRsZSA9ICQobGluaykuZGF0YSgndGl0bGUnKSB8fCAnUERGJztcblxuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgncmFuZ2UnKSA9PSAneWVzJyApIHtcbiAgICAgICAgICAgIGlmICggISBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgIC8vICc8cD5CdWlsZGluZyB5b3VyIFBERi4uLjwvcD4nICtcbiAgICAgICAgICAgIGA8ZGl2IGNsYXNzPVwiaW5pdGlhbFwiIGFyaWEtbGl2ZT1cInBvbGl0ZVwiPjxwPlNldHRpbmcgdXAgdGhlIGRvd25sb2FkLi4uPC9kaXY+YCArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cInByb2dyZXNzIHByb2dyZXNzLXN0cmlwZWQgYWN0aXZlIGhpZGVcIiBhcmlhLWhpZGRlbj1cInRydWVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImJhclwiIHdpZHRoPVwiMCVcIj48L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgIC8vICc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtYmxvY2sgYWxlcnQtc3VjY2VzcyBkb25lIGhpZGVcIj4nICtcbiAgICAgICAgICAgIC8vICAgICAnPHA+QWxsIGRvbmUhPC9wPicgK1xuICAgICAgICAgICAgLy8gJzwvZGl2PicgKyBcbiAgICAgICAgICAgIGA8ZGl2PjxwPjxhIGhyZWY9XCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9oZWxwX2RpZ2l0YWxfbGlicmFyeSNEb3dubG9hZFwiIHRhcmdldD1cIl9ibGFua1wiPldoYXQncyB0aGUgZGVhbCB3aXRoIGRvd25sb2Fkcz88L2E+PC9wPjwvZGl2PmA7XG5cbiAgICAgICAgdmFyIGhlYWRlciA9ICdCdWlsZGluZyB5b3VyICcgKyBzZWxmLml0ZW1fdGl0bGU7XG4gICAgICAgIHZhciB0b3RhbCA9IHNlbGYuJGxpbmsuZGF0YSgndG90YWwnKSB8fCAwO1xuICAgICAgICBpZiAoIHRvdGFsID4gMCApIHtcbiAgICAgICAgICAgIHZhciBzdWZmaXggPSB0b3RhbCA9PSAxID8gJ3BhZ2UnIDogJ3BhZ2VzJztcbiAgICAgICAgICAgIGhlYWRlciArPSAnICgnICsgdG90YWwgKyAnICcgKyBzdWZmaXggKyAnKSc7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdDYW5jZWwnLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi14LWRpc21pc3MnLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgLy8gc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIsXG4gICAgICAgICAgICAgICAgaWQ6ICdkb3dubG9hZCdcbiAgICAgICAgICAgIH1cbiAgICAgICAgKTtcblxuICAgICAgICAvLyBIVC51cGRhdGVfc3RhdHVzKGBCdWlsZGluZyB5b3VyICR7c2VsZi5pdGVtX3RpdGxlfS5gKTtcblxuICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuXG4gICAgfSxcblxuICAgIHJlcXVlc3REb3dubG9hZDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIGRhdGEgPSB7fTtcbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpICkge1xuICAgICAgICAgICAgZGF0YVsnc2VxJ10gPSBzZWxmLiRsaW5rLmRhdGEoJ3NlcScpO1xuICAgICAgICB9XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmw6IHNlbGYuc3JjLnJlcGxhY2UoLzsvZywgJyYnKSArICcmY2FsbGJhY2s9SFQuZG93bmxvYWRlci5zdGFydERvd25sb2FkTW9uaXRvcicsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICBjYWNoZTogZmFsc2UsXG4gICAgICAgICAgICBkYXRhOiBkYXRhLFxuICAgICAgICAgICAgZXJyb3I6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIFNUQVJUVVAgTk9UIERFVEVDVEVEXCIpO1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nICkgeyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpOyB9XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5V2FybmluZyhyZXEpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKHJlcSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9LFxuXG4gICAgY2FuY2VsRG93bmxvYWQ6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgIH0sXG5cbiAgICBzdGFydERvd25sb2FkTW9uaXRvcjogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcblxuICAgICAgICBpZiAoIHNlbGYudGltZXIgKSB7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFMUkVBRFkgUE9MTElOR1wiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYucGRmLnByb2dyZXNzX3VybCA9IHByb2dyZXNzX3VybDtcbiAgICAgICAgc2VsZi5wZGYuZG93bmxvYWRfdXJsID0gZG93bmxvYWRfdXJsO1xuICAgICAgICBzZWxmLnBkZi50b3RhbCA9IHRvdGFsO1xuXG4gICAgICAgIHNlbGYuaXNfcnVubmluZyA9IHRydWU7XG4gICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCA9IDA7XG4gICAgICAgIHNlbGYuaSA9IDA7XG5cbiAgICAgICAgc2VsZi50aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkgeyBzZWxmLmNoZWNrU3RhdHVzKCk7IH0sIDI1MDApO1xuICAgICAgICAvLyBkbyBpdCBvbmNlIHRoZSBmaXJzdCB0aW1lXG4gICAgICAgIHNlbGYuY2hlY2tTdGF0dXMoKTtcblxuICAgIH0sXG5cbiAgICBjaGVja1N0YXR1czogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5pICs9IDE7XG4gICAgICAgICQuYWpheCh7XG4gICAgICAgICAgICB1cmwgOiBzZWxmLnBkZi5wcm9ncmVzc191cmwsXG4gICAgICAgICAgICBkYXRhIDogeyB0cyA6IChuZXcgRGF0ZSkuZ2V0VGltZSgpIH0sXG4gICAgICAgICAgICBjYWNoZSA6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdqc29uJyxcbiAgICAgICAgICAgIHN1Y2Nlc3MgOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgdmFyIHN0YXR1cyA9IHNlbGYudXBkYXRlUHJvZ3Jlc3MoZGF0YSk7XG4gICAgICAgICAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkICs9IDE7XG4gICAgICAgICAgICAgICAgaWYgKCBzdGF0dXMuZG9uZSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICYmIHN0YXR1cy5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVByb2Nlc3NFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5sb2dFcnJvcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIGVycm9yIDogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRkFJTEVEOiBcIiwgcmVxLCBcIi9cIiwgdGV4dFN0YXR1cywgXCIvXCIsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA0MDQgJiYgKHNlbGYuaSA+IDI1IHx8IHNlbGYubnVtX3Byb2Nlc3NlZCA+IDApICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSlcbiAgICB9LFxuXG4gICAgdXBkYXRlUHJvZ3Jlc3M6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgc3RhdHVzID0geyBkb25lIDogZmFsc2UsIGVycm9yIDogZmFsc2UgfTtcbiAgICAgICAgdmFyIHBlcmNlbnQ7XG5cbiAgICAgICAgdmFyIGN1cnJlbnQgPSBkYXRhLnN0YXR1cztcbiAgICAgICAgaWYgKCBjdXJyZW50ID09ICdFT1QnIHx8IGN1cnJlbnQgPT0gJ0RPTkUnICkge1xuICAgICAgICAgICAgc3RhdHVzLmRvbmUgPSB0cnVlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGN1cnJlbnQgPSBkYXRhLmN1cnJlbnRfcGFnZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDAgKiAoIGN1cnJlbnQgLyBzZWxmLnBkZi50b3RhbCApO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLmxhc3RfcGVyY2VudCAhPSBwZXJjZW50ICkge1xuICAgICAgICAgICAgc2VsZi5sYXN0X3BlcmNlbnQgPSBwZXJjZW50O1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgPSAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgc2VsZi5udW1fYXR0ZW1wdHMgKz0gMTtcbiAgICAgICAgfVxuXG4gICAgICAgIC8vIHRyeSAxMDAgdGltZXMsIHdoaWNoIGFtb3VudHMgdG8gfjEwMCBzZWNvbmRzXG4gICAgICAgIGlmICggc2VsZi5udW1fYXR0ZW1wdHMgPiAxMDAgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZXJyb3IgPSB0cnVlO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmlzKFwiOnZpc2libGVcIikgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPlBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9Li4uPC9wPmApO1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIucHJvZ3Jlc3NcIikucmVtb3ZlQ2xhc3MoXCJoaWRlXCIpO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuYmFyXCIpLmNzcyh7IHdpZHRoIDogcGVyY2VudCArICclJ30pO1xuXG4gICAgICAgIGlmICggcGVyY2VudCA9PSAxMDAgKSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5oaWRlKCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLmh0bWwoYDxwPkFsbCBkb25lISBZb3VyICR7c2VsZi5pdGVtX3RpdGxlfSBpcyByZWFkeSBmb3IgZG93bmxvYWQuIDxzcGFuIGNsc2FzPVwib2Zmc2NyZWVuXCI+UHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLjwvc3Bhbj48L3A+YCk7XG4gICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuZmluZChcIi5kb25lXCIpLnNob3coKTtcbiAgICAgICAgICAgIHZhciAkZG93bmxvYWRfYnRuID0gc2VsZi4kZGlhbG9nLmZpbmQoJy5kb3dubG9hZC1wZGYnKTtcbiAgICAgICAgICAgIGlmICggISAkZG93bmxvYWRfYnRuLmxlbmd0aCApIHtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuID0gJCgnPGEgY2xhc3M9XCJkb3dubG9hZC1wZGYgYnRuIGJ0bi1wcmltYXJ5XCI+RG93bmxvYWQge0lURU1fVElUTEV9PC9hPicucmVwbGFjZSgne0lURU1fVElUTEV9Jywgc2VsZi5pdGVtX3RpdGxlKSkuYXR0cignaHJlZicsIHNlbGYucGRmLmRvd25sb2FkX3VybCk7XG4gICAgICAgICAgICAgICAgJGRvd25sb2FkX2J0bi5hcHBlbmRUbyhzZWxmLiRkaWFsb2cuZmluZChcIi5tb2RhbF9fZm9vdGVyXCIpKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGxpbmsudHJpZ2dlcihcImNsaWNrLmdvb2dsZVwiKTtcbiAgICAgICAgICAgICAgICAgICAgc2V0VGltZW91dChmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLnJlbW92ZSgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fY2xlYXJTZWxlY3Rpb24oKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIC8vIEhULnJlYWRlci5lbWl0KCdkb3dubG9hZERvbmUnKTtcbiAgICAgICAgICAgICAgICAgICAgfSwgMTUwMCk7XG4gICAgICAgICAgICAgICAgICAgIGUuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZGF0YSgnZGVhY3RpdmF0ZWQnLCB0cnVlKTtcbiAgICAgICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gUHJlc3MgcmV0dXJuIHRvIGRvd25sb2FkLmApO1xuICAgICAgICAgICAgLy8gc3RpbGwgY291bGQgY2FuY2VsXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5pbml0aWFsXCIpLnRleHQoYFBsZWFzZSB3YWl0IHdoaWxlIHdlIGJ1aWxkIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9ICgke01hdGguY2VpbChwZXJjZW50KX0lIGNvbXBsZXRlZCkuLi5gKTtcbiAgICAgICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgb2YgdGhlICR7c2VsZi5pdGVtX3RpdGxlfSBoYXMgYmVlbiBidWlsdC5gKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi50aW1lcik7XG4gICAgICAgICAgICBzZWxmLnRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwbGF5V2FybmluZzogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBwYXJzZUludChyZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtVW50aWxFcG9jaCcpKTtcbiAgICAgICAgdmFyIHJhdGUgPSByZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtUmF0ZScpXG5cbiAgICAgICAgaWYgKCB0aW1lb3V0IDw9IDUgKSB7XG4gICAgICAgICAgICAvLyBqdXN0IHB1bnQgYW5kIHdhaXQgaXQgb3V0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuICAgICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aW1lb3V0ICo9IDEwMDA7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIGNvdW50ZG93biA9ICggTWF0aC5jZWlsKCh0aW1lb3V0IC0gbm93KSAvIDEwMDApIClcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgKCc8ZGl2PicgK1xuICAgICAgICAgICAgJzxwPllvdSBoYXZlIGV4Y2VlZGVkIHRoZSBkb3dubG9hZCByYXRlIG9mIHtyYXRlfS4gWW91IG1heSBwcm9jZWVkIGluIDxzcGFuIGlkPVwidGhyb3R0bGUtdGltZW91dFwiPntjb3VudGRvd259PC9zcGFuPiBzZWNvbmRzLjwvcD4nICtcbiAgICAgICAgICAgICc8cD5Eb3dubG9hZCBsaW1pdHMgcHJvdGVjdCBIYXRoaVRydXN0IHJlc291cmNlcyBmcm9tIGFidXNlIGFuZCBoZWxwIGVuc3VyZSBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZSBmb3IgZXZlcnlvbmUuPC9wPicgK1xuICAgICAgICAgICc8L2Rpdj4nKS5yZXBsYWNlKCd7cmF0ZX0nLCByYXRlKS5yZXBsYWNlKCd7Y291bnRkb3dufScsIGNvdW50ZG93bik7XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1wcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcblxuICAgICAgICBzZWxmLmNvdW50ZG93bl90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb3VudGRvd24gLT0gMTtcbiAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIjdGhyb3R0bGUtdGltZW91dFwiKS50ZXh0KGNvdW50ZG93bik7XG4gICAgICAgICAgICAgIGlmICggY291bnRkb3duID09IDAgKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUSUMgVE9DXCIsIGNvdW50ZG93bik7XG4gICAgICAgIH0sIDEwMDApO1xuXG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9jZXNzRXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArIFxuICAgICAgICAgICAgICAgICdVbmZvcnR1bmF0ZWx5LCB0aGUgcHJvY2VzcyBmb3IgY3JlYXRpbmcgeW91ciBQREYgaGFzIGJlZW4gaW50ZXJydXB0ZWQuICcgKyBcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNsaWNrIFwiT0tcIiBhbmQgdHJ5IGFnYWluLicgKyBcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ0lmIHRoaXMgcHJvYmxlbSBwZXJzaXN0cyBhbmQgeW91IGFyZSB1bmFibGUgdG8gZG93bmxvYWQgdGhpcyBQREYgYWZ0ZXIgcmVwZWF0ZWQgYXR0ZW1wdHMsICcgKyBcbiAgICAgICAgICAgICAgICAncGxlYXNlIG5vdGlmeSB1cyBhdCA8YSBocmVmPVwiL2NnaS9mZWVkYmFjay8/cGFnZT1mb3JtXCIgZGF0YT1tPVwicHRcIiBkYXRhLXRvZ2dsZT1cImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiU2hvdyBGZWVkYmFja1wiPmZlZWRiYWNrQGlzc3Vlcy5oYXRoaXRydXN0Lm9yZzwvYT4gJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBpbmNsdWRlIHRoZSBVUkwgb2YgdGhlIGJvb2sgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY2VzcyB3aGVuIHRoZSBwcm9ibGVtIG9jY3VycmVkLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYSBwcm9ibGVtIGJ1aWxkaW5nIHlvdXIgJyArIHRoaXMuaXRlbV90aXRsZSArICc7IHN0YWZmIGhhdmUgYmVlbiBub3RpZmllZC4nICtcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gaW4gMjQgaG91cnMuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBsb2dFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJC5nZXQoc2VsZi5zcmMgKyAnO251bV9hdHRlbXB0cz0nICsgc2VsZi5udW1fYXR0ZW1wdHMpO1xuICAgIH0sXG5cblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBhbmQgZG8gdGhpcyBoZXJlXG4gICAgJChcIiNzZWxlY3RlZFBhZ2VzUGRmTGlua1wiKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuXG4gICAgICAgIGlmICggcHJpbnRhYmxlLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gcHJpbnQuPC9wPlwiIF07XG4gICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGFwcGVhciBpbiB0aGUgc2VsZWN0aW9uIGNvbnRlbnRzIDxidXR0b24gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6ICM2NjY7IGJvcmRlci1jb2xvcjogI2VlZVxcXCIgY2xhc3M9XFxcImJ0biBzcXVhcmVcXFwiPjxpIGNsYXNzPVxcXCJpY29tb29uIGljb21vb24tYXR0YWNobWVudFxcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2snICtcbiAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+SGVscDwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCI+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCI+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5XCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIiBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgaW5pdGVkID0gZmFsc2U7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuXG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dC5zZWFyY2gtaW5wdXQtdGV4dFwiKTtcbiAgICB2YXIgJGlucHV0X2xhYmVsID0gJGZvcm0uZmluZChcImxhYmVsW2Zvcj0ncTEtaW5wdXQnXVwiKTtcbiAgICB2YXIgJHNlbGVjdCA9ICRmb3JtLmZpbmQoXCIuY29udHJvbC1zZWFyY2h0eXBlXCIpO1xuICAgIHZhciAkc2VhcmNoX3RhcmdldCA9ICRmb3JtLmZpbmQoXCIuc2VhcmNoLXRhcmdldFwiKTtcbiAgICB2YXIgJGZ0ID0gJGZvcm0uZmluZChcInNwYW4uZnVua3ktZnVsbC12aWV3XCIpO1xuXG4gICAgdmFyICRiYWNrZHJvcCA9IG51bGw7XG5cbiAgICB2YXIgJGFjdGlvbiA9ICQoXCIjYWN0aW9uLXNlYXJjaC1oYXRoaXRydXN0XCIpO1xuICAgICRhY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvb3Rib3guc2hvdygnc2VhcmNoLW1vZGFsJywge1xuICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgICAgICAgICRpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuXG4gICAgdmFyIF9zZXR1cCA9IHt9O1xuICAgIF9zZXR1cC5scyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LmhpZGUoKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCBvciB3aXRoaW4gdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggZnVsbC10ZXh0IGluZGV4Jyk7XG4gICAgICAgIGlmICggaW5pdGVkICkge1xuICAgICAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhcIlNlYXJjaCB3aWxsIHVzZSB0aGUgZnVsbC10ZXh0IGluZGV4LlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIF9zZXR1cC5jYXRhbG9nID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3Quc2hvdygpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IHRoZSBpdGVtcycpO1xuICAgICAgICAkaW5wdXRfbGFiZWwudGV4dCgnU2VhcmNoIGNhdGFsb2cgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBjYXRhbG9nIGluZGV4OyB5b3UgY2FuIGxpbWl0IHlvdXIgc2VhcmNoIHRvIGEgc2VsZWN0aW9uIG9mIGZpZWxkcy5cIik7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICB2YXIgdGFyZ2V0ID0gJHNlYXJjaF90YXJnZXQuZmluZChcImlucHV0OmNoZWNrZWRcIikudmFsKCk7XG4gICAgX3NldHVwW3RhcmdldF0oKTtcbiAgICBpbml0ZWQgPSB0cnVlO1xuXG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgaWYgKCBwcmVmcy5zZWFyY2ggJiYgcHJlZnMuc2VhcmNoLmZ0ICkge1xuICAgICAgICAkKFwiaW5wdXRbbmFtZT1mdF1cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuXG4gICAgJHNlYXJjaF90YXJnZXQub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPVwicmFkaW9cIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IGxhYmVsIDogXCItXCIsIGNhdGVnb3J5IDogXCJIVCBTZWFyY2hcIiwgYWN0aW9uIDogdGFyZ2V0IH0pO1xuICAgIH0pXG5cbiAgICAvLyAkZm9ybS5kZWxlZ2F0ZSgnOmlucHV0JywgJ2ZvY3VzIGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJGT0NVU0lOR1wiLCB0aGlzKTtcbiAgICAvLyAgICAgJGZvcm0uYWRkQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCA9PSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wID0gJCgnPGRpdiBjbGFzcz1cIm1vZGFsX19vdmVybGF5IGludmlzaWJsZVwiPjwvZGl2PicpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAkYmFja2Ryb3AuYXBwZW5kVG8oJChcImJvZHlcIikpLnNob3coKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJChcImJvZHlcIikub24oJ2ZvY3VzJywgJzppbnB1dCxhJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIC8vICAgICBpZiAoICEgJHRoaXMuY2xvc2VzdChcIi5uYXYtc2VhcmNoLWZvcm1cIikubGVuZ3RoICkge1xuICAgIC8vICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gdmFyIGNsb3NlX3NlYXJjaF9mb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRmb3JtLnJlbW92ZUNsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgIT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5kZXRhY2goKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5oaWRlKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhZGQgZXZlbnQgaGFuZGxlciBmb3Igc3VibWl0IHRvIGNoZWNrIGZvciBlbXB0eSBxdWVyeSBvciBhc3Rlcmlza1xuICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbihldmVudClcbiAgICAgICAgIHtcblxuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsInZhciBIVCA9IEhUIHx8IHt9O1xuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICBIVC5hbmFseXRpY3MuZ2V0Q29udGVudEdyb3VwRGF0YSA9IGZ1bmN0aW9uKCkge1xuICAgIC8vIGNoZWF0XG4gICAgdmFyIHN1ZmZpeCA9ICcnO1xuICAgIHZhciBjb250ZW50X2dyb3VwID0gNDtcbiAgICBpZiAoICQoXCIjc2VjdGlvblwiKS5kYXRhKFwidmlld1wiKSA9PSAncmVzdHJpY3RlZCcgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMjtcbiAgICAgIHN1ZmZpeCA9ICcjcmVzdHJpY3RlZCc7XG4gICAgfSBlbHNlIGlmICggd2luZG93LmxvY2F0aW9uLmhyZWYuaW5kZXhPZihcImRlYnVnPXN1cGVyXCIpID4gLTEgKSB7XG4gICAgICBjb250ZW50X2dyb3VwID0gMztcbiAgICAgIHN1ZmZpeCA9ICcjc3VwZXInO1xuICAgIH1cbiAgICByZXR1cm4geyBpbmRleCA6IGNvbnRlbnRfZ3JvdXAsIHZhbHVlIDogSFQucGFyYW1zLmlkICsgc3VmZml4IH07XG5cbiAgfVxuXG4gIEhULmFuYWx5dGljcy5fc2ltcGxpZnlQYWdlSHJlZiA9IGZ1bmN0aW9uKGhyZWYpIHtcbiAgICB2YXIgdXJsID0gJC51cmwoaHJlZik7XG4gICAgdmFyIG5ld19ocmVmID0gdXJsLnNlZ21lbnQoKTtcbiAgICBuZXdfaHJlZi5wdXNoKCQoXCJodG1sXCIpLmRhdGEoJ2NvbnRlbnQtcHJvdmlkZXInKSk7XG4gICAgbmV3X2hyZWYucHVzaCh1cmwucGFyYW0oXCJpZFwiKSk7XG4gICAgdmFyIHFzID0gJyc7XG4gICAgaWYgKCBuZXdfaHJlZi5pbmRleE9mKFwic2VhcmNoXCIpID4gLTEgJiYgdXJsLnBhcmFtKCdxMScpICApIHtcbiAgICAgIHFzID0gJz9xMT0nICsgdXJsLnBhcmFtKCdxMScpO1xuICAgIH1cbiAgICBuZXdfaHJlZiA9IFwiL1wiICsgbmV3X2hyZWYuam9pbihcIi9cIikgKyBxcztcbiAgICByZXR1cm4gbmV3X2hyZWY7XG4gIH1cblxuICBIVC5hbmFseXRpY3MuZ2V0UGFnZUhyZWYgPSBmdW5jdGlvbigpIHtcbiAgICByZXR1cm4gSFQuYW5hbHl0aWNzLl9zaW1wbGlmeVBhZ2VIcmVmKCk7XG4gIH1cblxufSkiLCJoZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIERJU01JU1NfRVZFTlQgPSAod2luZG93Lmhhc093blByb3BlcnR5ICYmXG4gICAgICAgICAgICAgICAgd2luZG93Lmhhc093blByb3BlcnR5KCdvbnRvdWNoc3RhcnQnKSkgP1xuICAgICAgICAgICAgICAgICAgICAndG91Y2hzdGFydCcgOiAnbW91c2Vkb3duJztcblxuICAgIHZhciAkbWVudXMgPSAkKFwibmF2ID4gdWwgPiBsaTpoYXModWwpXCIpO1xuXG4gICAgdmFyIHRvZ2dsZSA9IGZ1bmN0aW9uKCRwb3B1cCwgJG1lbnUsICRsaW5rKSB7XG4gICAgICAgIGlmICggJHBvcHVwLmRhdGEoJ3N0YXRlJykgPT0gJ29wZW4nICkge1xuICAgICAgICAgICAgJG1lbnUucmVtb3ZlQ2xhc3MoXCJhY3RpdmVcIik7XG4gICAgICAgICAgICAkcG9wdXAuYXR0cignYXJpYS1oaWRkZW4nLCAndHJ1ZScpO1xuICAgICAgICAgICAgJGxpbmsuZm9jdXMoKTtcbiAgICAgICAgICAgICRwb3B1cC5kYXRhKCdzdGF0ZScsICdjbG9zZWQnKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICRtZW51LmFkZENsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJHBvcHVwLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ2ZhbHNlJyk7XG4gICAgICAgICAgICAkcG9wdXAuZGF0YSgnc3RhdGUnLCAnb3BlbicpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgJG1lbnVzLmVhY2goZnVuY3Rpb24oaW5kZXgpIHtcbiAgICAgICAgdmFyICRtZW51ID0gJCh0aGlzKTtcbiAgICAgICAgY29uc29sZS5sb2coXCJBSE9ZIFdVVFwiLCAkbWVudSk7XG4gICAgICAgICRtZW51LmZpbmQoXCJsaVwiKS5lYWNoKGZ1bmN0aW9uKGxpZHgpIHtcbiAgICAgICAgICAgIHZhciAkaXRlbSA9ICQodGhpcyk7XG4gICAgICAgICAgICAkaXRlbS5hdHRyKCdhcmlhLXJvbGUnLCAncHJlc2VudGF0aW9uJyk7XG4gICAgICAgICAgICAkaXRlbS5maW5kKFwiYVwiKS5hdHRyKCdhcmlhLXJvbGUnLCAnbWVudWl0ZW0nKTtcbiAgICAgICAgfSlcblxuICAgICAgICB2YXIgJGxpbmsgPSAkbWVudS5maW5kKFwiPiBhXCIpO1xuICAgICAgICB2YXIgJHBvcHVwID0gJG1lbnUuZmluZChcInVsXCIpO1xuICAgICAgICB2YXIgJGl0ZW1zID0gJHBvcHVwLmZpbmQoXCJhXCIpO1xuICAgICAgICAkbGluay5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgdG9nZ2xlKCRwb3B1cCwgJG1lbnUsICRsaW5rKTtcbiAgICAgICAgfSlcblxuICAgICAgICAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCAtMSk7XG4gICAgICAgICRtZW51Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgICAgIHZhciBjb2RlID0gZXZlbnQuY29kZTtcbiAgICAgICAgICAgIHZhciBzZWxlY3RlZF9pZHggPSAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnKTtcbiAgICAgICAgICAgIHZhciBkZWx0YSA9IDA7XG4gICAgICAgICAgICBpZiAoIGNvZGUgPT0gJ0Fycm93RG93bicgKSB7XG4gICAgICAgICAgICAgICAgZGVsdGEgPSAxO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggY29kZSA9PSAnQXJyb3dVcCcgKSB7XG4gICAgICAgICAgICAgICAgZGVsdGEgPSAtMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNvZGUgPT0gJ0VzY2FwZScgKSB7XG4gICAgICAgICAgICAgICAgdG9nZ2xlKCRwb3B1cCwgJG1lbnUsICRsaW5rKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmICggZGVsdGEgPT0gMCApIHsgY29uc29sZS5sb2coXCJBSE9ZIEtFWUNPREVcIiwgY29kZSk7IHJldHVybiA7IH1cbiAgICAgICAgICAgIGV2ZW50LnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgICAgc2VsZWN0ZWRfaWR4ID0gKCBzZWxlY3RlZF9pZHggKyBkZWx0YSApICUgJGl0ZW1zLmxlbmd0aDtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBNRU5VIEtFWURPV05cIiwgc2VsZWN0ZWRfaWR4KTtcbiAgICAgICAgICAgICRzZWxlY3RlZCA9ICRpdGVtcy5zbGljZShzZWxlY3RlZF9pZHgsIHNlbGVjdGVkX2lkeCArIDEpO1xuICAgICAgICAgICAgJHNlbGVjdGVkLmZvY3VzKCk7XG4gICAgICAgICAgICAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCBzZWxlY3RlZF9pZHgpO1xuICAgICAgICB9KVxuICAgIH0pXG5cblxuICAgIC8vICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcsIC0xKTtcbiAgICAvLyAkbWVudS5vbignZm9jdXNpbicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSB0cnVlO1xuICAgIC8vIH0pXG4gICAgLy8gJG1lbnUucHJldigpLmZpbmQoXCI+IGFcIikub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJG1lbnUuZmluZChcIj4gYVwiKS5nZXQoMCkuZGF0YXNldC5leHBhbmRlZCA9IGZhbHNlO1xuICAgIC8vIH0pXG4gICAgLy8gJG1lbnUuZmluZChcInVsID4gbGkgPiBhOmxhc3RcIikub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICAgJG1lbnUuZmluZChcIj4gYVwiKS5nZXQoMCkuZGF0YXNldC5leHBhbmRlZCA9IGZhbHNlO1xuICAgIC8vIH0pXG4gICAgLy8gJG1lbnUub24oJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICB2YXIgY29kZSA9IGV2ZW50LmNvZGU7XG4gICAgLy8gICAgIHZhciAkaXRlbXMgPSAkbWVudS5maW5kKFwidWwgPiBsaSA+IGFcIik7XG4gICAgLy8gICAgIHZhciBzZWxlY3RlZF9pZHggPSAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnKTtcbiAgICAvLyAgICAgdmFyIGRlbHRhID0gMDtcbiAgICAvLyAgICAgaWYgKCBjb2RlID09ICdBcnJvd0Rvd24nICkge1xuICAgIC8vICAgICAgICAgZGVsdGEgPSAxO1xuICAgIC8vICAgICB9IGVsc2UgaWYgKCBjb2RlID09ICdBcnJvd1VwJyApIHtcbiAgICAvLyAgICAgICAgIGRlbHRhID0gLTE7XG4gICAgLy8gICAgIH1cbiAgICAvLyAgICAgaWYgKCBkZWx0YSA9PSAwICkgeyByZXR1cm4gOyB9XG4gICAgLy8gICAgIHNlbGVjdGVkX2lkeCA9ICggc2VsZWN0ZWRfaWR4ICsgZGVsdGEgKSAlICRpdGVtcy5sZW5ndGg7XG4gICAgLy8gICAgIGNvbnNvbGUubG9nKFwiQUhPWSBNRU5VIEtFWURPV05cIiwgc2VsZWN0ZWRfaWR4KTtcbiAgICAvLyAgICAgJHNlbGVjdGVkID0gJGl0ZW1zLnNsaWNlKHNlbGVjdGVkX2lkeCwgc2VsZWN0ZWRfaWR4ICsgMSk7XG4gICAgLy8gICAgICRzZWxlY3RlZC5mb2N1cygpO1xuICAgIC8vICAgICAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCBzZWxlY3RlZF9pZHgpO1xuICAgIC8vIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIikuc3VibWl0KGZ1bmN0aW9uKCkge1xuICAgIHZhciAkZm9ybSA9ICQodGhpcyk7XG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybS5maW5kKFwiYnV0dG9uW3R5cGU9c3VibWl0XVwiKTtcbiAgICBpZiAoICRzdWJtaXQuaGFzQ2xhc3MoXCJidG4tbG9hZGluZ1wiKSApIHtcbiAgICAgIGFsZXJ0KFwiWW91ciBzZWFyY2ggcXVlcnkgaGFzIGJlZW4gc3VibWl0dGVkIGFuZCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgJHN1Ym1pdC5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH0pXG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSlcbn0pO1xuIiwiLyoqXG4gKiBTb2NpYWwgTGlua3NcbiAqIEluc3BpcmVkIGJ5OiBodHRwOi8vc2FwZWdpbi5naXRodWIuY29tL3NvY2lhbC1saWtlc1xuICpcbiAqIFNoYXJpbmcgYnV0dG9ucyBmb3IgUnVzc2lhbiBhbmQgd29ybGR3aWRlIHNvY2lhbCBuZXR3b3Jrcy5cbiAqXG4gKiBAcmVxdWlyZXMgalF1ZXJ5XG4gKiBAYXV0aG9yIEFydGVtIFNhcGVnaW5cbiAqIEBjb3B5cmlnaHQgMjAxNCBBcnRlbSBTYXBlZ2luIChzYXBlZ2luLm1lKVxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOmZhbHNlLCBzb2NpYWxMaW5rc0J1dHRvbnM6ZmFsc2UgKi9cblxuKGZ1bmN0aW9uKGZhY3RvcnkpIHsgIC8vIFRyeSB0byByZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgQU1EIG1vZHVsZVxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShqUXVlcnkpO1xuICAgIH1cbn0oZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHJlZml4ID0gJ3NvY2lhbC1saW5rcyc7XG4gICAgdmFyIGNsYXNzUHJlZml4ID0gcHJlZml4ICsgJ19fJztcbiAgICB2YXIgb3BlbkNsYXNzID0gcHJlZml4ICsgJ19vcGVuZWQnO1xuICAgIHZhciBwcm90b2NvbCA9IGxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICdodHRwczonIDogJ2h0dHA6JztcbiAgICB2YXIgaXNIdHRwcyA9IHByb3RvY29sID09PSAnaHR0cHM6JztcblxuXG4gICAgLyoqXG4gICAgICogQnV0dG9uc1xuICAgICAqL1xuICAgIHZhciBzZXJ2aWNlcyA9IHtcbiAgICAgICAgZmFjZWJvb2s6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnRmFjZWJvb2snLFxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXJzLmZhY2Vib29rLmNvbS9kb2NzL3JlZmVyZW5jZS9mcWwvbGlua19zdGF0L1xuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL2ZxbD9xPVNFTEVDVCt0b3RhbF9jb3VudCtGUk9NK2xpbmtfc3RhdCtXSEVSRSt1cmwlM0QlMjJ7dXJsfSUyMiZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5kYXRhWzBdLnRvdGFsX2NvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci9zaGFyZXIucGhwP3U9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDUwMFxuICAgICAgICB9LFxuICAgICAgICB0d2l0dGVyOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1R3aXR0ZXInLFxuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vY2RuLmFwaS50d2l0dGVyLmNvbS8xL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD91cmw9e3VybH0mdGV4dD17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDQ1MCxcbiAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBBZGQgY29sb24gdG8gaW1wcm92ZSByZWFkYWJpbGl0eVxuICAgICAgICAgICAgICAgIGlmICghL1tcXC5cXD86XFwt4oCT4oCUXVxccyokLy50ZXN0KHRoaXMub3B0aW9ucy50aXRsZSkpIHRoaXMub3B0aW9ucy50aXRsZSArPSAnOic7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1haWxydToge1xuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9jb25uZWN0Lm1haWwucnUvc2hhcmVfY291bnQ/dXJsX2xpc3Q9e3VybH0mY2FsbGJhY2s9MSZmdW5jPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHVybCBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KHVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhW3VybF0uc2hhcmVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL2Nvbm5lY3QubWFpbC5ydS9zaGFyZT9zaGFyZV91cmw9e3VybH0mdGl0bGU9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgdmtvbnRha3RlOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1ZLJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL3ZrLmNvbS9zaGFyZS5waHA/YWN0PWNvdW50JnVybD17dXJsfSZpbmRleD17aW5kZXh9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy52a29udGFrdGU7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93LlZLKSB3aW5kb3cuVksgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LlZLLlNoYXJlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGZ1bmN0aW9uKGlkeCwgbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fW2lkeF0ucmVzb2x2ZShudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG9wdGlvbnMuXy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCwge2luZGV4OiBpbmRleH0pKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3ZrLmNvbS9zaGFyZS5waHA/dXJsPXt1cmx9JnRpdGxlPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzMwXG4gICAgICAgIH0sXG4gICAgICAgIG9kbm9rbGFzc25pa2k6IHtcbiAgICAgICAgICAgIC8vIEhUVFBTIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IGlzSHR0cHMgPyB1bmRlZmluZWQgOiAnaHR0cDovL2Nvbm5lY3Qub2sucnUvZGs/c3QuY21kPWV4dExpa2UmcmVmPXt1cmx9JnVpZD17aW5kZXh9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy5vZG5va2xhc3NuaWtpO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5PREtMKSB3aW5kb3cuT0RLTCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuT0RLTC51cGRhdGVDb3VudCA9IGZ1bmN0aW9uKGlkeCwgbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl9baWR4XS5yZXNvbHZlKG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gb3B0aW9ucy5fLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBvcHRpb25zLl8ucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsLCB7aW5kZXg6IGluZGV4fSkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwOi8vY29ubmVjdC5vay5ydS9kaz9zdC5jbWQ9V2lkZ2V0U2hhcmVQcmV2aWV3JnNlcnZpY2U9b2Rub2tsYXNzbmlraSZzdC5zaGFyZVVybD17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHBsdXNvbmU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnR29vZ2xlKycsXG4gICAgICAgICAgICAvLyBIVFRQUyBub3Qgc3VwcG9ydGVkIHlldDogaHR0cDovL2NsdWJzLnlhLnJ1L3NoYXJlLzE0OTlcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IGlzSHR0cHMgPyB1bmRlZmluZWQgOiAnaHR0cDovL3NoYXJlLnlhbmRleC5ydS9ncHAueG1sP3VybD17dXJsfScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMucGx1c29uZTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlamVjdCBhbGwgY291bnRlcnMgZXhjZXB0IHRoZSBmaXJzdCBiZWNhdXNlIFlhbmRleCBTaGFyZSBjb3VudGVyIGRvZXNu4oCZdCByZXR1cm4gVVJMXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuc2VydmljZXMpIHdpbmRvdy5zZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXJ2aWNlcy5ncGx1cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgY2I6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW1iZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8ucmVzb2x2ZShwYXJzZUludChudW1iZXIsIDEwKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gZGVmZXJyZWQ7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsKSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vcGx1cy5nb29nbGUuY29tL3NoYXJlP3VybD17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA3MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNTAwXG4gICAgICAgIH0sXG4gICAgICAgIHBpbnRlcmVzdDoge1xuICAgICAgICAgICAgbGFiZWw6ICdQaW50ZXJlc3QnLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9idXR0b24vP3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICB0dW1ibHI6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVHVtYmxyJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDE6IHByb3RvY29sICsgJy8vd3d3LnR1bWJsci5jb20vc2hhcmUvbGluaz91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwVXJsMjogcHJvdG9jb2wgKyAnLy93d3cudHVtYmxyLmNvbS9zaGFyZS9waG90bz9zb3VyY2U9e21lZGlhfSZjbGlja190aHJ1PXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBjbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9wdXBVcmwgPSB0aGlzLm9wdGlvbnMucG9wdXBVcmwyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3B1cFVybCA9IHRoaXMub3B0aW9ucy5wb3B1cFVybDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHdpbGwgc3RpbGwgbmVlZCB0byBjaGFuZ2UgdGhlIFVSTCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGRpdDoge1xuICAgICAgICAgICAgbGFiZWw6ICdSZWRkaXQnLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3JlZGRpdC5jb20vc3VibWl0P3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICBFT1Q6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IHBsdWdpblxuICAgICAqL1xuICAgICQuZm4uc29jaWFsTGlua3MgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbSA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSBlbGVtLmRhdGEocHJlZml4KTtcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UudXBkYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gbmV3IHNvY2lhbExpbmtzKGVsZW0sICQuZXh0ZW5kKHt9LCAkLmZuLnNvY2lhbExpbmtzLmRlZmF1bHRzLCBvcHRpb25zLCBkYXRhVG9PcHRpb25zKGVsZW0pKSk7XG4gICAgICAgICAgICAgICAgZWxlbS5kYXRhKHByZWZpeCwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIHBvc3RfdGl0bGUgPSBkb2N1bWVudC50aXRsZS5zcGxpdCgnIHwgJylbMF0uc3BsaXQoJyAtICcpO1xuICAgIGlmICggJC5pbkFycmF5KHBvc3RfdGl0bGVbcG9zdF90aXRsZS5sZW5ndGggLSAxXSwgWyAnRnVsbCBWaWV3JywgJ0xpbWl0ZWQgVmlldycsICdJdGVtIE5vdCBBdmFpbGFibGUnIF0pICE9PSAtMSApIHtcbiAgICAgICAgcG9zdF90aXRsZS5wb3AoKTtcbiAgICB9XG4gICAgcG9zdF90aXRsZSA9IHBvc3RfdGl0bGUuam9pbihcIiAtIFwiKSArIFwiIHwgSGF0aGlUcnVzdFwiO1xuICAgICQuZm4uc29jaWFsTGlua3MuZGVmYXVsdHMgPSB7XG4gICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaGFzaCwgJycpLnJlcGxhY2UoLzsvZywgJyYnKS5yZXBsYWNlKCcvc2hjZ2kvJywgJy9jZ2kvJyksXG4gICAgICAgIHBvc3RfdGl0bGU6IHBvc3RfdGl0bGUsXG4gICAgICAgIGNvdW50ZXJzOiB0cnVlLFxuICAgICAgICB6ZXJvZXM6IGZhbHNlLFxuICAgICAgICB3YWl0OiA1MDAsICAvLyBTaG93IGJ1dHRvbnMgb25seSBhZnRlciBjb3VudGVycyBhcmUgcmVhZHkgb3IgYWZ0ZXIgdGhpcyBhbW91bnQgb2YgdGltZVxuICAgICAgICB0aW1lb3V0OiAxMDAwMCwgIC8vIFNob3cgY291bnRlcnMgYWZ0ZXIgdGhpcyBhbW91bnQgb2YgdGltZSBldmVuIGlmIHRoZXkgYXJlbuKAmXQgcmVhZHlcbiAgICAgICAgcG9wdXBDaGVja0ludGVydmFsOiA1MDAsXG4gICAgICAgIHNpbmdsZVRpdGxlOiAnU2hhcmUnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNvY2lhbExpbmtzKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgc29jaWFsTGlua3MucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFkZCBjbGFzcyBpbiBjYXNlIG9mIG1hbnVhbCBpbml0aWFsaXphdGlvblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4KTtcblxuICAgICAgICAgICAgdGhpcy5pbml0VXNlckJ1dHRvbnMoKTtcblxuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSB0aGlzLmNvbnRhaW5lci5jaGlsZHJlbigpO1xuXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMgPSBbXTtcbiAgICAgICAgICAgIGJ1dHRvbnMuZWFjaCgkLnByb3h5KGZ1bmN0aW9uKGlkeCwgZWxlbSkge1xuICAgICAgICAgICAgICAgIHZhciBidXR0b24gPSBuZXcgQnV0dG9uKCQoZWxlbSksIHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLnB1c2goYnV0dG9uKTtcbiAgICAgICAgICAgIH0sIHRoaXMpKTtcblxuICAgICAgICB9LFxuICAgICAgICBpbml0VXNlckJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnVzZXJCdXR0b25Jbml0ZWQgJiYgd2luZG93LnNvY2lhbExpbmtzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VzLCBzb2NpYWxMaW5rc0J1dHRvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51c2VyQnV0dG9uSW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCArICdfdmlzaWJsZScpO1xuICAgICAgICB9LFxuICAgICAgICByZWFkeTogZnVuY3Rpb24oc2lsZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXggKyAnX3JlYWR5Jyk7XG4gICAgICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnRyaWdnZXIoJ3JlYWR5LicgKyBwcmVmaXgsIHRoaXMubnVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBCdXR0b24od2lkZ2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZGV0ZWN0U2VydmljZSgpO1xuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEJ1dHRvbi5wcm90b3R5cGUgPSB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5kZXRlY3RQYXJhbXMoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdEh0bWwoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmluaXRDb3VudGVyLCB0aGlzKSwgMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsIHtmb3JjZVVwZGF0ZTogZmFsc2V9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LmZpbmQoJy4nICsgcHJlZml4ICsgJ19fY291bnRlcicpLnJlbW92ZSgpOyAgLy8gUmVtb3ZlIG9sZCBjb3VudGVyXG4gICAgICAgICAgICB0aGlzLmluaXRDb3VudGVyKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV0ZWN0U2VydmljZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VydmljZSA9IHRoaXMud2lkZ2V0LmRhdGEoJ3NlcnZpY2UnKTtcbiAgICAgICAgICAgIGlmICghc2VydmljZSkge1xuICAgICAgICAgICAgICAgIC8vIGNsYXNzPVwiZmFjZWJvb2tcIlxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy53aWRnZXRbMF07XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzZXMgPSBub2RlLmNsYXNzTGlzdCB8fCBub2RlLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNsYXNzSWR4ID0gMDsgY2xhc3NJZHggPCBjbGFzc2VzLmxlbmd0aDsgY2xhc3NJZHgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2xzID0gY2xhc3Nlc1tjbGFzc0lkeF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXJ2aWNlc1tjbHNdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlID0gY2xzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFzZXJ2aWNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCBzZXJ2aWNlc1tzZXJ2aWNlXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV0ZWN0UGFyYW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gdGhpcy53aWRnZXQuZGF0YSgpO1xuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSBjb3VudGVyIFVSTCBvciBudW1iZXJcbiAgICAgICAgICAgIGlmIChkYXRhLmNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQoZGF0YS5jb3VudGVyLCAxMCk7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKG51bWJlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvdW50ZXJVcmwgPSBkYXRhLmNvdW50ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY291bnRlck51bWJlciA9IG51bWJlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIHRpdGxlXG4gICAgICAgICAgICBpZiAoZGF0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50aXRsZSA9IGRhdGEudGl0bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvc3RfdGl0bGUgPSB0aGlzLm9wdGlvbnMudGl0bGU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGEudGl0bGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIFVSTFxuICAgICAgICAgICAgaWYgKGRhdGEudXJsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnVybCA9IGRhdGEudXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRIdG1sOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0O1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gd2lkZ2V0O1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jbGlja1VybCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBtYWtlVXJsKG9wdGlvbnMuY2xpY2tVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdF90aXRsZTogb3B0aW9ucy5wb3N0X3RpdGxlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmsgPSAkKCc8YT4nLCB7XG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IHVybFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvbmVEYXRhQXR0cnMod2lkZ2V0LCBsaW5rKTtcbiAgICAgICAgICAgICAgICB3aWRnZXQucmVwbGFjZVdpdGgobGluayk7XG4gICAgICAgICAgICAgICAgdGhpcy53aWRnZXQgPSB3aWRnZXQgPSBsaW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0Lm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgX3dpZGdldCA9IHdpZGdldC5nZXQoMCk7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQucm9sZSA9ICd0b29sdGlwJztcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5taWNyb3RpcFBvc2l0aW9uID0gJ3RvcCc7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQubWljcm90aXBTaXplID0gJ3NtYWxsJztcbiAgICAgICAgICAgIF93aWRnZXQuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgd2lkZ2V0LnRleHQoKSk7XG4gICAgICAgICAgICAvLyB3aWRnZXQudG9vbHRpcCh7IHRpdGxlIDogd2lkZ2V0LnRleHQoKSwgYW5pbWF0aW9uOiBmYWxzZSB9KTtcblxuICAgICAgICAgICAgdGhpcy5idXR0b24gPSBidXR0b247XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdENvdW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsb25lRGF0YUF0dHJzOiBmdW5jdGlvbihzb3VyY2UsIGRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHNvdXJjZS5kYXRhKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb24uZGF0YShrZXksIGRhdGFba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldEVsZW1lbnRDbGFzc05hbWVzOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RWxlbWVudENsYXNzTmFtZXMoZWxlbSwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb3VudGVyOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApIHx8IDA7XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5nZXRFbGVtZW50Q2xhc3NOYW1lcygnY291bnRlcicpLFxuICAgICAgICAgICAgICAgICd0ZXh0JzogbnVtYmVyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCFudW1iZXIgJiYgIXRoaXMub3B0aW9ucy56ZXJvZXMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbJ2NsYXNzJ10gKz0gJyAnICsgcHJlZml4ICsgJ19fY291bnRlcl9lbXB0eSc7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb3VudGVyRWxlbSA9ICQoJzxzcGFuPicsIHBhcmFtcyk7XG4gICAgICAgICAgICB0aGlzLndpZGdldC5hcHBlbmQoY291bnRlckVsZW0pO1xuXG4gICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdjb3VudGVyLicgKyBwcmVmaXgsIFt0aGlzLnNlcnZpY2UsIG51bWJlcl0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgICAgIHZhciBwcm9jZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy5jbGljaykpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzID0gb3B0aW9ucy5jbGljay5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb2Nlc3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdF90aXRsZTogb3B0aW9ucy5wb3N0X3RpdGxlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubWVkaWEgPSB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gbWFrZVVybChvcHRpb25zLnBvcHVwVXJsLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB1cmwgPSB0aGlzLmFkZEFkZGl0aW9uYWxQYXJhbXNUb1VybCh1cmwpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlblBvcHVwKHVybCwge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogb3B0aW9ucy5wb3B1cFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG9wdGlvbnMucG9wdXBIZWlnaHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRBZGRpdGlvbmFsUGFyYW1zVG9Vcmw6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSAgZGF0YVRvT3B0aW9ucyh0aGlzLndpZGdldCk7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gJC5wYXJhbSgkLmV4dGVuZChkYXRhLCB0aGlzLm9wdGlvbnMuZGF0YSkpO1xuICAgICAgICAgICAgaWYgKCQuaXNFbXB0eU9iamVjdChwYXJhbXMpKSByZXR1cm4gdXJsO1xuICAgICAgICAgICAgdmFyIGdsdWUgPSB1cmwuaW5kZXhPZignPycpID09PSAtMSA/ICc/JyA6ICcmJztcbiAgICAgICAgICAgIHJldHVybiB1cmwgKyBnbHVlICsgcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9wZW5Qb3B1cDogZnVuY3Rpb24odXJsLCBwYXJhbXMpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gTWF0aC5yb3VuZChzY3JlZW4ud2lkdGgvMiAtIHBhcmFtcy53aWR0aC8yKTtcbiAgICAgICAgICAgIHZhciB0b3AgPSAwO1xuICAgICAgICAgICAgaWYgKHNjcmVlbi5oZWlnaHQgPiBwYXJhbXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdG9wID0gTWF0aC5yb3VuZChzY3JlZW4uaGVpZ2h0LzMgLSBwYXJhbXMuaGVpZ2h0LzIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd2luID0gd2luZG93Lm9wZW4odXJsLCAnc2xfJyArIHRoaXMuc2VydmljZSwgJ2xlZnQ9JyArIGxlZnQgKyAnLHRvcD0nICsgdG9wICsgJywnICtcbiAgICAgICAgICAgICAgICd3aWR0aD0nICsgcGFyYW1zLndpZHRoICsgJyxoZWlnaHQ9JyArIHBhcmFtcy5oZWlnaHQgKyAnLHBlcnNvbmFsYmFyPTAsdG9vbGJhcj0wLHNjcm9sbGJhcnM9MSxyZXNpemFibGU9MScpO1xuICAgICAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpO1xuICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ3BvcHVwX29wZW5lZC4nICsgcHJlZml4LCBbdGhpcy5zZXJ2aWNlLCB3aW5dKTtcbiAgICAgICAgICAgICAgICB2YXIgdGltZXIgPSBzZXRJbnRlcnZhbCgkLnByb3h5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbi5jbG9zZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ3BvcHVwX2Nsb3NlZC4nICsgcHJlZml4LCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpLCB0aGlzLm9wdGlvbnMucG9wdXBDaGVja0ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXJzXG4gICAgICovXG5cbiAgICAgLy8gQ2FtZWxpemUgZGF0YS1hdHRyaWJ1dGVzXG4gICAgZnVuY3Rpb24gZGF0YVRvT3B0aW9ucyhlbGVtKSB7XG4gICAgICAgIGZ1bmN0aW9uIHVwcGVyKG0sIGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsLnRvVXBwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgICAgICB2YXIgZGF0YSA9IGVsZW0uZGF0YSgpO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKCBrZXkgPT0gJ3Rvb2x0aXAnICkgeyBjb250aW51ZSA7IH1cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ3llcycpIHZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSAnbm8nKSB2YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgb3B0aW9uc1trZXkucmVwbGFjZSgvLShcXHcpL2csIHVwcGVyKV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlVXJsKHVybCwgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUodXJsLCBjb250ZXh0LCBlbmNvZGVVUklDb21wb25lbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlbXBsYXRlKHRtcGwsIGNvbnRleHQsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdG1wbC5yZXBsYWNlKC9cXHsoW15cXH1dKylcXH0vZywgZnVuY3Rpb24obSwga2V5KSB7XG4gICAgICAgICAgICAvLyBJZiBrZXkgZG9lc24ndCBleGlzdHMgaW4gdGhlIGNvbnRleHQgd2Ugc2hvdWxkIGtlZXAgdGVtcGxhdGUgdGFnIGFzIGlzXG4gICAgICAgICAgICByZXR1cm4ga2V5IGluIGNvbnRleHQgPyAoZmlsdGVyID8gZmlsdGVyKGNvbnRleHRba2V5XSkgOiBjb250ZXh0W2tleV0pIDogbTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RWxlbWVudENsYXNzTmFtZXMoZWxlbSwgbW9kKSB7XG4gICAgICAgIHZhciBjbHMgPSBjbGFzc1ByZWZpeCArIGVsZW07XG4gICAgICAgIHJldHVybiBjbHMgKyAnICcgKyBjbHMgKyAnXycgKyBtb2Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VPbkNsaWNrKGVsZW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZSkge1xuICAgICAgICAgICAgaWYgKChlLnR5cGUgPT09ICdrZXlkb3duJyAmJiBlLndoaWNoICE9PSAyNykgfHwgJChlLnRhcmdldCkuY2xvc2VzdChlbGVtKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3Mob3BlbkNsYXNzKTtcbiAgICAgICAgICAgIGRvYy5vZmYoZXZlbnRzLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oY2FsbGJhY2spKSBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgdmFyIGV2ZW50cyA9ICdjbGljayB0b3VjaHN0YXJ0IGtleWRvd24nO1xuICAgICAgICBkb2Mub24oZXZlbnRzLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93SW5WaWV3cG9ydChlbGVtKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSAxMDtcbiAgICAgICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoZWxlbS5jc3MoJ2xlZnQnKSwgMTApO1xuICAgICAgICAgICAgdmFyIHRvcCA9IHBhcnNlSW50KGVsZW0uY3NzKCd0b3AnKSwgMTApO1xuXG4gICAgICAgICAgICB2YXIgcmVjdCA9IGVsZW1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBpZiAocmVjdC5sZWZ0IDwgb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCdsZWZ0Jywgb2Zmc2V0IC0gcmVjdC5sZWZ0ICsgbGVmdCk7XG4gICAgICAgICAgICBlbHNlIGlmIChyZWN0LnJpZ2h0ID4gd2luZG93LmlubmVyV2lkdGggLSBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ2xlZnQnLCB3aW5kb3cuaW5uZXJXaWR0aCAtIHJlY3QucmlnaHQgLSBvZmZzZXQgKyBsZWZ0KTtcblxuICAgICAgICAgICAgaWYgKHJlY3QudG9wIDwgb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCd0b3AnLCBvZmZzZXQgLSByZWN0LnRvcCArIHRvcCk7XG4gICAgICAgICAgICBlbHNlIGlmIChyZWN0LmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCAtIG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygndG9wJywgd2luZG93LmlubmVySGVpZ2h0IC0gcmVjdC5ib3R0b20gLSBvZmZzZXQgKyB0b3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsZW0uYWRkQ2xhc3Mob3BlbkNsYXNzKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEF1dG8gaW5pdGlhbGl6YXRpb25cbiAgICAgKi9cbiAgICAkKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuJyArIHByZWZpeCkuc29jaWFsTGlua3MoKTtcbiAgICB9KTtcblxufSkpO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCIjdmVyc2lvbkljb25cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
