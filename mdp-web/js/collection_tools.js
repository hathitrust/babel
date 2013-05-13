head.ready(function() {

    var DEFAULT_COLL_MENU_OPTION = "0";
    var NEW_COLL_MENU_OPTION = "__NEW__";
    var SRC_COLLECTION = "";
    var ITEMS_SELECTED = [];
    var DEFAULT_SLICE_SIZE=25;//XXX need to get this dynamically from xsl/javascript?

    var $available_collections = $("#c2");
    var $errormsg = $(".errormsg");
    var $toolbar = $(".toolbar.alt");
    var $check_all = $("#checkAll");
    var $possible_selections = $(".select input[type=checkbox]");

    function display_error(msg) {
        if ( ! $errormsg.length ) {
            $errormsg = $('<div class="alert alert-error"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function get_url() {
        var url = "/cgi/mb";
        if ( location.pathname.indexOf("/shcgi/") > -1 ) {
            url = "/shcgi/mb";
        }
        return url;
    }

    function get_ids(items) {
        var id = [];
        items.each(function() {
            id.push($(this).val());
        })
        return id;
    }

    function parse_line(data) {
        var retval = {};
        var tmp = data.split("|");
        for(var i = 0; i < tmp.length; i++) {
            kv = tmp[i].split("=");
            retval[kv[0]] = kv[1];
        }
        return retval;
    }

    function uncheck_all() {
        $possible_selections.attr("checked", null);
        $check_all.attr("checked", null);
    }

    function add_item_to_collist(params) {
        var $select = $("select[name=c2]");
        var $option = $select.find("option[value='" + params.coll_id + "']");
        if ( ! $option.length ) {
            // need to add
            $option = $('<option></option>').val(params.coll_id).text(params.coll_name).appendTo($select);
        }
    }

    function summarize_results(params) {
        var $div = $(".mb-status");
        if ( ! $div.length ) {
            $div = $('<div class="mb-status alert alert-success"></div>').prependTo($(".main")).hide();
        }

        var collID = params.coll_id;
        var collName = params.coll_name;
        var collHref= '<a href="mb?a=listis;c=' + collID + '">' + collName + '</a>';
        var numAdded=params.NumAdded;
        var numFailed=params.NumFailed;
        var alertMsg;
        var msg;
        if (numFailed > 0 ){
          msg = "numFailed items could not be added to your collection,\n " +  numAdded + " items were added to " + collHref;
        }
        else {
          //  var msg =  params.NumAdded + " items of " + params.NumSubmitted + " were added to " + collHref + " collection";
          if (numAdded >1){
            msg =  numAdded + " items were added to " + collHref;
          }
          else{
            msg =  numAdded + " item was added to " + collHref;
          }
        }

        $div.html(msg).show();
        add_item_to_collist(params);

        uncheck_all();
    }

    function submit_post(params, fn) {

        var non_ajax = { movit : true, delit : true, movitnc : true, editc : true };

        if ( ! non_ajax[params.a] ) {
            params.page = 'ajax';
        }

        if ( params.page == 'ajax' ) {
            $.ajax({
                url : get_url(),
                data : $.param(params, true)
            }).done(function(data) {
                console.log(data);
                var params = parse_line(data);
                $(".btn-loading").removeClass("btn-loading");
                summarize_results(params);
                if ( fn ) {
                    fn();
                }
            })
        } else {
            // extend with HT.params...
            var formdata = $.extend({}, $.url().param(), params)    ;
            var $form = $("<form method='GET'></form>");
            $form.attr("action", get_url());
            _.each(_.keys(formdata), function(name) {
                var values = formdata[name];
                values = $.isArray(values) ? values : [ values ];
                _.each(values, function(value) {
                    $("<input type='hidden' />").attr({ name : name }).val(value).appendTo($form);
                })
            })
            $form.hide().appendTo("body");
            $form.submit();
        }


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

        $block.attr("action", get_url());

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

                    var c = $.trim($block.find("input[name=c]").val());
                    var cn = $.trim($block.find("input[name=cn]").val());
                    var desc = $.trim($block.find("textarea[name=desc]").val());

                    if ( ! cn ) {
                        $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
                        return false;
                    }

                    $dialog.find(".btn-primary").addClass("btn-loading");

                    var params = {
                        a : options.a,
                        cn : cn,
                        desc : desc,
                        shrd : $block.find("input[name=shrd]:checked").val()                        
                    };

                    if ( options.$selected ) {
                        params.id = get_ids(options.$selected);
                    }

                    if ( c ) {
                        params.c = c;
                    }

                    submit_post(params, function() {
                        $dialog.modal('hide');
                    });
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
    $check_all.click(function(e) {
        var state = $(this).attr('checked') || null;
        $possible_selections.attr("checked", state);
    })

    $(".SelectedItemActions button").click(function(e) {
        e.preventDefault();
        var action = this.id;
        var $btn = $(this);

        hide_error();

        var selected_collection_id = $available_collections.val();
        var selected_collection_name = $available_collections.find("option:selected").text();

        var $selected = $(".id:checked");
        if ( $selected.length == 0 ) {
            display_error("You must choose an item");
            return;
        }

        if ( ( selected_collection_id == DEFAULT_COLL_MENU_OPTION ) &&
             ( action == 'copyit' || action == 'movit' || action == 'addI' || action == 'addits' ) ) {
            display_error("You must select a collection.");
            return;
        }

        if ( selected_collection_id == NEW_COLL_MENU_OPTION ) {
            // deal with new collection
            // var $hidden = $form.find("input[type=hidden]").clone();
            // $hidden.filter("input[name=a]").val(action + 'nc');
            edit_collection_metadata({ 
                creating : true, 
                $selected : $selected,
                a : action + "nc"
            });
            return;
        }

        $btn.addClass("btn-loading");

        var add_num_items = $selected.length;
        var COLL_SIZE_ARRAY = getCollSizeArray();
        var coll_size = COLL_SIZE_ARRAY[selected_collection_id];

        confirm_large(coll_size, add_num_items, function() {
            // possible ajax action
            submit_post({
                a : action,
                id : get_ids($selected),
                c2 : selected_collection_id
            });
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