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

        if ( options.shrd !== null ) {
            $block.find("input[name=shrd][value=" + options.shrd + ']').attr("checked", "checked");
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
