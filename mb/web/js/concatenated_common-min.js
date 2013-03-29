/*
 * JQuery URL Parser plugin, v2.2.1
 * Developed and maintanined by Mark Perkins, mark@allmarkedup.com
 * Source repository: https://github.com/allmarkedup/jQuery-URL-Parser
 * Licensed under an MIT-style license. See https://github.com/allmarkedup/jQuery-URL-Parser/blob/master/LICENSE for details.
 */ 

;(function(factory) {
	if (typeof define === 'function' && define.amd) {
		// AMD available; use anonymous module
		if ( typeof jQuery !== 'undefined' ) {
			define(['jquery'], factory);	
		} else {
			define([], factory);
		}
	} else {
		// No AMD available; mutate global vars
		if ( typeof jQuery !== 'undefined' ) {
			factory(jQuery);
		} else {
			factory();
		}
	}
})(function($, undefined) {
	
	var tag2attr = {
			a       : 'href',
			img     : 'src',
			form    : 'action',
			base    : 'href',
			script  : 'src',
			iframe  : 'src',
			link    : 'href'
		},
		
		key = ['source', 'protocol', 'authority', 'userInfo', 'user', 'password', 'host', 'port', 'relative', 'path', 'directory', 'file', 'query', 'fragment'], // keys available to query
		
		aliases = { 'anchor' : 'fragment' }, // aliases for backwards compatability
		
		parser = {
			strict : /^(?:([^:\/?#]+):)?(?:\/\/((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?))?((((?:[^?#\/]*\/)*)([^?#]*))(?:\?([^#]*))?(?:#(.*))?)/,  //less intuitive, more accurate to the specs
			loose :  /^(?:(?![^:@]+:[^:@\/]*@)([^:\/?#.]+):)?(?:\/\/)?((?:(([^:@]*):?([^:@]*))?@)?([^:\/?#]*)(?::(\d*))?)(((\/(?:[^?#](?![^?#\/]*\.[^?#\/.]+(?:[?#]|$)))*\/?)?([^?#\/]*))(?:\?([^#]*))?(?:#(.*))?)/ // more intuitive, fails on relative paths and deviates from specs
		},
		
		toString = Object.prototype.toString,
		
		isint = /^[0-9]+$/;
	
	function parseUri( url, strictMode ) {
		var str = decodeURI( url ),
		res   = parser[ strictMode || false ? 'strict' : 'loose' ].exec( str ),
		uri = { attr : {}, param : {}, seg : {} },
		i   = 14;
		
		while ( i-- ) {
			uri.attr[ key[i] ] = res[i] || '';
		}
		
		// build query and fragment parameters		
		uri.param['query'] = parseString(uri.attr['query']);
		uri.param['fragment'] = parseString(uri.attr['fragment']);
		
		// split path and fragement into segments		
		uri.seg['path'] = uri.attr.path.replace(/^\/+|\/+$/g,'').split('/');     
		uri.seg['fragment'] = uri.attr.fragment.replace(/^\/+|\/+$/g,'').split('/');
		
		// compile a 'base' domain attribute        
		uri.attr['base'] = uri.attr.host ? (uri.attr.protocol ?  uri.attr.protocol+'://'+uri.attr.host : uri.attr.host) + (uri.attr.port ? ':'+uri.attr.port : '') : '';      
		  
		return uri;
	};
	
	function getAttrName( elm ) {
		var tn = elm.tagName;
		if ( typeof tn !== 'undefined' ) return tag2attr[tn.toLowerCase()];
		return tn;
	}
	
	function promote(parent, key) {
		if (parent[key].length == 0) return parent[key] = {};
		var t = {};
		for (var i in parent[key]) t[i] = parent[key][i];
		parent[key] = t;
		return t;
	}

	function parse(parts, parent, key, val) {
		var part = parts.shift();
		if (!part) {
			if (isArray(parent[key])) {
				parent[key].push(val);
			} else if ('object' == typeof parent[key]) {
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
				} else if ('object' == typeof obj) {
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
				for (var k in parent.base) t[k] = parent.base[k];
				parent.base = t;
			}
			set(parent.base, key, val);
		}
		return parent;
	}

	function parseString(str) {
		return reduce(String(str).split(/&|;/), function(ret, pair) {
			try {
				pair = decodeURIComponent(pair.replace(/\+/g, ' '));
			} catch(e) {
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
			 brace, c;
		for (var i = 0; i < len; ++i) {
			c = str[i];
			if (']' == c) brace = false;
			if ('[' == c) brace = true;
			if ('=' == c && !brace) return i;
		}
	}
	
	function reduce(obj, accumulator){
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
		for ( prop in obj ) {
			if ( obj.hasOwnProperty(prop) ) keys.push(prop);
		}
		return keys;
	}
		
	function purl( url, strictMode ) {
		if ( arguments.length === 1 && url === true ) {
			strictMode = true;
			url = undefined;
		}
		strictMode = strictMode || false;
		url = url || window.location.toString();
	
		return {
			
			data : parseUri(url, strictMode),
			
			// get various attributes from the URI
			attr : function( attr ) {
				attr = aliases[attr] || attr;
				return typeof attr !== 'undefined' ? this.data.attr[attr] : this.data.attr;
			},
			
			// return query string parameters
			param : function( param ) {
				return typeof param !== 'undefined' ? this.data.param.query[param] : this.data.param.query;
			},
			
			// return fragment parameters
			fparam : function( param ) {
				return typeof param !== 'undefined' ? this.data.param.fragment[param] : this.data.param.fragment;
			},
			
			// return path segments
			segment : function( seg ) {
				if ( typeof seg === 'undefined' ) {
					return this.data.seg.path;
				} else {
					seg = seg < 0 ? this.data.seg.path.length + seg : seg - 1; // negative segments count from the end
					return this.data.seg.path[seg];                    
				}
			},
			
			// return fragment segments
			fsegment : function( seg ) {
				if ( typeof seg === 'undefined' ) {
					return this.data.seg.fragment;                    
				} else {
					seg = seg < 0 ? this.data.seg.fragment.length + seg : seg - 1; // negative segments count from the end
					return this.data.seg.fragment[seg];                    
				}
			}
	    	
		};
	
	};
	
	if ( typeof $ !== 'undefined' ) {
		
		$.fn.url = function( strictMode ) {
			var url = '';
			if ( this.length ) {
				url = $(this).attr( getAttrName(this[0]) ) || '';
			}    
			return purl( url, strictMode );
		};
		
		$.url = purl;
		
	} else {
		window.purl = purl;
	}

});


/* /htapps/roger.babel/mdp-web/jquery/jQuery-URL-Parser/purl.js */
/*!
Copyright (c) 2011, 2012 Julien Wajsberg <felash@gmail.com>
All rights reserved.

Official repository: https://github.com/julienw/jquery-trap-input
License is there: https://github.com/julienw/jquery-trap-input/blob/master/LICENSE
This is version 1.2.0.
*/(function(a,b){function d(a){if(a.keyCode===9){var b=!!a.shiftKey;e(this,a.target,b)&&(a.preventDefault(),a.stopPropagation())}}function e(a,b,c){var d=i(a),e=b,f,g,h,j;do{f=d.index(e),g=f+1,h=f-1,j=d.length-1;switch(f){case-1:return!1;case 0:h=j;break;case j:g=0}c&&(g=h),e=d.get(g);try{e.focus()}catch(k){}}while(b===b.ownerDocument.activeElement);return!0}function f(){return this.tabIndex>0}function g(){return!this.tabIndex}function h(a,b){return a.t-b.t||a.i-b.i}function i(b){var c=a(b),d=[],e=0;return m.enable&&m.enable(),c.find("a[href], link[href], [draggable=true], [contenteditable=true], :input:enabled, [tabindex=0]").filter(":visible").filter(g).each(function(a,b){d.push({v:b,t:0,i:e++})}),c.find("[tabindex]").filter(":visible").filter(f).each(function(a,b){d.push({v:b,t:b.tabIndex,i:e++})}),m.disable&&m.disable(),d=a.map(d.sort(h),function(a){return a.v}),a(d)}function j(){return this.keydown(d),this.data(c,!0),this}function k(){return this.unbind("keydown",d),this.removeData(c),this}function l(){return!!this.data(c)}var c="trap.isTrapping";a.fn.extend({trap:j,untrap:k,isTrapping:l});var m={};a.find.find&&a.find.attr!==a.attr&&function(){function e(a){var d=a.getAttributeNode(c);return d&&d.specified?parseInt(d.value,10):b}function f(){d[c]=d.tabIndex=e}function g(){delete d[c],delete d.tabIndex}var c="tabindex",d=a.expr.attrHandle;m={enable:f,disable:g}}()})(jQuery);
/* /htapps/roger.babel/mdp-web/jquery/jquery.trap.min.js */
// define a console if not exists
if ( window.console === undefined ) {
    window.console = {
        log : function() { }
    }
}

var HT = HT || {};

HT.track_pageview = function(args) {
  if ( window.location.hash ) {
    args = $.extend({}, { colltype : window.location.hash.substr(1) }, args);
  }
  var params = $.param(args);
  if ( params ) { params = "?" + params; }
  if ( window.pageTacker !== undefined && window.pageTracker != null ) {
    var fn = function() {
        try {
            pageTracker._trackPageview(window.location.pathname + params);
        } catch(e) { console.log(e); }
    };
    
    _gaq.push(fn);
  }
}

HT.track_event = function(args) {
    args = $.extend({}, { category : 'MB' }, args)
    if ( window.pageTracker !== undefined && window.pageTracker != null ) {

        var fn = function() {
            try {
                pageTracker._trackEvent(args.category, args.action, args.label, undefined, true);
            } catch(e) { console.log(e); }
        };
        
        _gaq.push(fn);
    }
}
/* /htapps/roger.babel/mb/web/js/mb.js */
head.ready(function() {

  $(".tracked").click(function() {
    var href = $(this).attr('href');
    pageTracker._trackEvent('cbActions', 'click', "CB - branded " + $(this).text() + " link");
    setTimeout(function() {
      window.location.href = href;
    }, 500);
    return false;
  })
})
/* /htapps/roger.babel/mb/web/js/tracking.js */

head.ready(function() {

  var API_URL = ( window.location.protocol == 'https:' ? "https://encrypted.google.com" : "http://books.google.com" ) + "/books?callback=?";
  var THUMBNAIL_SIZE = 60;

  $("[data-bookid]").each(function() {
    var $div = $(this);
    var book_id = $div.data('bookid');
    $.getJSON(API_URL, {
      jscmd : 'viewapi',
      bibkeys : book_id
    }, function(gdata) {
      if ( gdata.length == 0 ) return;
      var google_link = selectGoogleLink(gdata, 1, 1 );
      if ( google_link.thumbnail_url ) {
        var $img = $('<img class="bookCover" aria-hidden="true" alt=""/>')
        $img.load(function() {
          $img = jQuery(this);
          owidth = $img.attr('width');
          if (owidth > THUMBNAIL_SIZE) {
            $img.attr('width', THUMBNAIL_SIZE);
            $img.attr('height', $img.attr('height') * (THUMBNAIL_SIZE/owidth));
          }
          $div.append($img);
        }).attr('src', google_link.thumbnail_url);
      }
    })
  })
})


function getGoogleBookInfo(link_nums, record_num, record_counter)
{
  var google_id = '';
  var oclc = '';
  var lccn = '';
  var id = '';
  if (link_nums.length > 0 ) {
    // call the google api with the collected link numbers
    //alert(link_nums);
    var api_url ="//books.google.com/books?jscmd=viewapi&bibkeys=" + link_nums + "&callback=?";
    //alert("calling script: " + api_url);
    jQuery.getJSON(api_url,
      function(gdata) {
        if (gdata.length == 0) return;
        // process the data returned from the google api
        var thumbnailImg = '';
        googleLink = selectGoogleLink(gdata, record_num, record_counter);
        if ( googleLink.searchNum ) {
          jQuery('#ELEC_holdings').append('<tr><th></th><td style="width: 50%;"></td><td>' + googleLink.link + '</td></tr>');
          jQuery('#dummyElec').show();
          // deal with elec copy on results page
          if (jQuery('#ELEC_'+ record_num).length ) {   // replace link
            //alert("replace elec copy for record num" + record_num);
            jQuery('#ELEC_' + record_num).replaceWith('<tr><td class="holdingLocation">Electronic Resources</td><td><a href="/Record/' + record_num + '/Holdings#holdings">See Holdings</a></td>');
          } else {  // add a row
            //alert("add elec copy for record num" + record_num);
            jQuery('#holdings' + record_num).append('<tr><td class="holdingLocation">Electronic Resources</td><td>' + googleLink.link + '</td></tr>');
          }
        }
        // if (googleLink.thumbnailImg) {
        //   jQuery("#GoogleCover_" + record_num).html(googleLink.thumbnailImg);
        //   jQuery("#GoogleCover_" + record_num).show();
        // }
        if (googleLink.thumbnail_url) {
          img = jQuery('<img class="bookCover" aria-hidden="true" alt="">');
          img.load(function() {
            img = jQuery(this);
            owidth = img.attr('width');
            if (owidth > 75) {
              img.attr('width', 75);
              img.attr('height', img.attr('height') * (75/owidth));
            }
            jQuery("#GoogleCover_" + record_num).empty().append(img).show();
          }).attr('src', googleLink.thumbnail_url);
        }
      }
    );          // end of callback
  }
}

function getViewRank(preview) {
  if (preview == 'noview') return 0;            // test--could be snippet, but no way to tell
  if (preview == 'partial') return 2;
  if (preview == 'full') return 3;
  return 0;
}

function selectGoogleLink(gdata, record_num, record_counter) {
  var selectLink = [];
  selectLink["thumbnailImg"] = '';
  selectLink["link"] = '';
  selectLink["searchNum"] = '';
  var currRank = 0;
  // loop through gdata--get thumbnail_url, and extract view info for ranking
  for (num in gdata) {
    var rank = getViewRank(gdata[num].preview);
    if (gdata[num].thumbnail_url) {
      selectLink.thumbnailImg = '<img alt="Cover Image" src="' + gdata[num].thumbnail_url + '">';
      selectLink.thumbnail_url = gdata[num].thumbnail_url;
    }
    if (rank > currRank) {
      if (gdata[num].thumbnail_url) selectLink.thumbnailImg = '<img alt="Cover Image" src="' + gdata[num].thumbnail_url + '">';
      currRank = rank;
      viewInfo = translateGooglePreview(gdata[num].preview);
      selectLink.link =
        '<a class="clickpostlog" ref="googlebook|' + record_num + '|google|' + record_counter + '" href="' + gdata[num].preview_url + '" target="fulltext">' +
        'Google Online (' + viewInfo + ')' + '</a>';
      selectLink.searchNum = num;
    }
  }
  return selectLink;
}

function translateGooglePreview(preview) {
  if (preview == 'full') return('Available Online');
  if (preview == 'noview') return('Snippet View');
  if (preview == 'partial') return('Limited View');
  return(preview);
}


/* /htapps/roger.babel/mdp-web/js/google_covers.js */
head.ready(function() {

    var DEFAULT_COLL_MENU_OPTION = "0";
    var NEW_COLL_MENU_OPTION = "__NEW__";
    var SRC_COLLECTION = "";
    var ITEMS_SELECTED = [];
    var DEFAULT_SLICE_SIZE=25;//XXX need to get this dynamically from xsl/javascript?

    var $available_collections = $("#c2");
    var $errormsg = $(".errormsg");
    var $toolbar = $(".toolbar.alt");

    function display_error(msg) {
        if ( ! $errormsg.length ) {
            $errormsg = $('<div class="alert alert-error"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function edit_collection_metadata(args) {

        var options = $.extend({ creating : false, label : "Save Changes" }, args);
        var dummy = new Image();
        dummy.src = "/common/unicorn/img/throbber.gif";

        var $block = $(
            '<form class="form-horizontal" action="mb">' + 
                '<div class="control-group">' + 
                    '<label class="control-label" for="edit-cn">Collection Name</label>' + 
                    '<div class="controls">' + 
                        '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" />' +
                        '<span class="label counter" id="edit-cn-count">100</span>' + 
                    '</div>' +
                '</div>' + 
                '<div class="control-group">' + 
                    '<label class="control-label" for="edit-desc">Description</label>' + 
                    '<div class="controls">' + 
                        '<textarea id="edit-desc" name="desc" rows="4" maxlength="255" class="input-large" placeholder="Add your collection description."></textarea>' +
                        '<span class="label counter" id="edit-desc-count">255</span>' + 
                    '</div>' +
                '</div>' + 
                '<div class="control-group">' + 
                    '<div class="controls">' + 
                        '<label class="radio inline">' +
                            '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > Private ' +
                        '</label>' + 
                        '<label class="radio inline">' +
                            '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > Public ' +
                        '</label>' +
                    '</div>' +
                '</div>' + 
            '</form>'
        );

        if ( options.cn ) {
            $block.find("input[name=cn]").val(options.cn);
        }

        if ( options.desc ) {
            $block.find("textarea[name=desc]").val(options.desc);
        }

        if ( options.shrd != null ) {
            $block.find("input[name=shrd][value=" + options.shrd + ']').attr("checked", "checked");
        } else if ( ! HT.login_status.logged_in ) {
            $block.find("input[name=shrd][value=0]").attr("checked", "checked");
            $('<div class="alert alert-info">Login to create public/permanent collections.</div>').appendTo($block);
            // remove the <label> that wraps the radio button
            $block.find("input[name=shrd][value=1]").parent().remove();
        }

        if ( options.$hidden ) {
            options.$hidden.clone().appendTo($block);
        } else {
            $("<input type='hidden' name='c' />").appendTo($block).val(options.c);
            $("<input type='hidden' name='a' />").appendTo($block).val(options.a);            
        }

        if ( options.$selected ) {
            options.$selected.clone().attr('type', 'hidden').appendTo($block);
        }

        var $dialog = bootbox.dialog($block, [
            {
                "label" : "Cancel",
                "class" : "btn-dismiss"
            },
            {
                "label" : options.label,
                "class" : "btn-primary",
                callback : function() {

                    var cn = $.trim($block.find("input[name=cn]").val());
                    var desc = $.trim($block.find("textarea[name=desc]").val());

                    if ( ! cn ) {
                        $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
                        return false;
                    }

                    $dialog.find(".btn-primary").addClass("btn-loading");
                    $block.submit();
                    return false;
                }
            }
        ]);

        $dialog.find("input[type=text],textarea").each(function() {
            var $this = $(this);
            var $count = $("#" + $this.attr('id') + "-count");
            var limit = $this.attr("maxlength");
        
            $count.text(limit - $this.val().length);

            $this.bind('keyup', function() {
                $count.text(limit - $this.val().length);
            });
        })
    }

    function confirm_large(collSize, addNumItems, callback) {

        if ( collSize <= 1000 && collSize + addNumItems > 1000 ) {
            var numStr;
            if (addNumItems > 1) {
                numStr = "these " + addNumItems + " items";
            }
            else {
                numStr = "this item";
            }
            var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 48 hours.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?"

            confirm(msg, function(answer) {
                if ( answer ) {
                    callback();
                }
            })
        } else {
            // all other cases are okay
            callback();
        }
    }

    // bind actions
    $("#checkAll").click(function(e) {
        var state = $(this).attr('checked') || null;
        console.log("STATE", state);
        $(".select input[type=checkbox]").attr('checked', state);
    })

    $(".SelectedItemActions button").click(function(e) {
        e.preventDefault();
        var action = this.id;
        var $form = $("#form1");
        $form.find("input[name=a]").val(action);

        hide_error();

        var selected_collection_id = $available_collections.val();
        var selected_collection_name = $available_collections.find("option:selected").text();

        var $selected = $(".iid:checked");
        if ( $selected.length == 0 ) {
            display_error("You must choose an item");
            return;
        }

        if ( ( selected_collection_id == DEFAULT_COLL_MENU_OPTION ) &&
             ( action == 'copyit' || action == 'movit' || action == 'addI' ) ) {
            display_error("You must select a collection.");
            return;
        }

        if ( selected_collection_id == NEW_COLL_MENU_OPTION ) {
            // deal with new collection
            var $hidden = $form.find("input[type=hidden]").clone();
            $hidden.filter("input[name=a]").val(action + 'nc');
            edit_collection_metadata({ 
                creating : true, 
                $selected : $selected, 
                $hidden : $hidden
            });
            return;
        }

        var add_num_items = $selected.length;
        var COLL_SIZE_ARRAY = getCollSizeArray();
        var coll_size = COLL_SIZE_ARRAY[selected_collection_id];
        confirm_large(coll_size, add_num_items, function() {
            $form.submit();
        })

    })

    $("#trigger-editc").click(function(e) {
        e.preventDefault();
        var $this = $(this);        
        edit_collection_metadata({
            a : 'editc',
            cn : $this.data('cn'),
            desc : $this.data('desc'),
            shrd : $this.data('shrd'),
            c : $this.data('c')
        });
    })

});
/* /htapps/roger.babel/mdp-web/js/collection_tools.js */
head.ready(function() {

    var $selects = $("select[name=sz],select[name=sort]");
    $selects.each(function() {
        init_select(this);
    })

    function init_select(select) {
        select.changed = false;
        select.onfocus = select_focused;
        select.onchange = select_changed;
        select.onkeydown = select_keyed;
        select.onclick = select_clicked;

        return true;
    }

    function select_changed(el) {
        var select;
        if ( el && el.value ) {
            select = el;
        } else {
            select = this;
        }
        if ( ! select.changed ) {
            return false;
        }

        // https://roger-full.babel.hathitrust.org/cgi/mb?c=594541169&pn=1&sort=title_a&sort=date_d&sz=25&c2=0&a=&sz=25&sz=25
        var $form = $("<form></form>").attr("action", window.location.pathname);
        var $tmpl = $(select).parents("form");
        $form.append($tmpl.find("input[type=hidden]"));
        $form.append('<input type="hidden" name="a" value="{VALUE}" />'.replace('{VALUE}', $.url().param('a')));
        var name = $(select).attr("name");
        $form.find("input[name='" + name + "']").val($(select).val());
        $form.submit();

        return true;
    }

    function select_clicked() {
        this.changed = true;
    }

    function select_focused() {
        this.initValue = this.value;
        return true;
    }

    function select_keyed(e) {
        var theEvent;
        var keyCodeTab = "9";
        var keyCodeEnter = "13";
        var keyCodeEsc = "27";
        
        if (e)
        {
            theEvent = e;
        }
        else
        {
            theEvent = event;
        }

        if ((theEvent.keyCode == keyCodeEnter || theEvent.keyCode == keyCodeTab) && this.value != this.initValue)
        {
            this.changed = true;
            selectChanged(this);
        }
        else if (theEvent.keyCode == keyCodeEsc)
        {
            this.value = this.initValue;
        }
        else
        {
            this.changed = false;
        }
        
        return true;        
    }


    $("#SortWidgetSort").change(function() {
        $(this).parents("form").submit();
    })

});
/* /htapps/roger.babel/mdp-web/js/search_tools.js */
