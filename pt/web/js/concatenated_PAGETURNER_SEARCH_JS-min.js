// downloader

var HT = HT || {};

HT.Downloader = {

    init: function(options) {
        this.options = $.extend({}, this.options, options);
        this.id = this.options.params.id;
        this.pdf = {};
        return this;
    },

    options: {

    },

    start : function() {
        var self = this;
        this.bindEvents();
    },

    bindEvents: function() {
        var self = this;
        $("#fullPdfLink").addClass("interactive").click(function(e) {
            e.preventDefault();
            if ( $(this).attr("rel") == 'allow' ) {
                if ( self.options.params.download_progress_base == null ) {
                    return true;
                }
                self.downloadPdf(this);
            } else {
                self.explainPdfAccess(this);
            }
            return false;
        })

    },

    explainPdfAccess: function(link) {
        var $html = $("#noPdfAccess").html();
        this.$dialog = bootbox.alert($html);
        this.$dialog.addClass("login");
    },

    downloadPdf: function(link) {
        var self = this;
        var src = $(link).attr('href');

        var html = 
            // '<p>Building your PDF...</p>' + 
            '<div class="initial"><p>Setting up download...</p></div>' + 
            '<div class="progress progress-striped active hide">' +
                '<div class="bar" width="0%"></div>' + 
            '</div>' + 
            '<div class="done hide">' + 
                '<p>All done!</p>' + 
            '</div>';

        self.$dialog = bootbox.dialog(
            html,
            [
                {
                    label : 'Cancel',
                    'class' : 'btn-dismiss',
                    callback: function() {
                        if ( self.$dialog.data('deactivated') ) {
                            self.$dialog.modal('hide');
                            return;
                        }
                        $.ajax({
                            url: src + ';callback=HT.downloader.cancelDownload;stop=1',
                            dataType: 'script',
                            cache: false,
                            error: function(req, textStatus, errorThrown) {
                                console.log("DOWNLOAD CANCELLED ERROR");
                                self.$dialog.modal('hide');
                                console.log(req, textStatus, errorThrown);
                                if ( req.status == 503 ) {
                                    self.displayWarning(req);
                                } else {
                                    self.showError();
                                }
                            }
                        })
                    }
                },
                {
                    label : 'Download PDF',
                    'class' : 'download-pdf btn-dismiss btn-primary hide',
                    callback: function() {
                        window.location.href = self.pdf.download_url;
                        setTimeout(function() {
                            self.$dialog.modal('hide');
                        }, 500);
                        return false;
                    }
                }
            ],
            {
                header: 'Building your PDF'
            }
        );

        $.ajax({
            url: src + ';callback=HT.downloader.startDownload',
            dataType: 'script',
            cache: false,
            error: function(req, textStatus, errorThrown) {
                console.log("DOWNLOAD STARTUP NOT DETECTED");
                self.$dialog.modal('hide');
                if ( req.status == 503 ) {
                    self.displayWarning(req);
                } else {
                    self.showEror();
                }
            }
        });

    },

    cancelDownload: function(progress_url, download_url, total) {
        var self = this;
        self.clearTimer();
        self.$dialog.modal('hide');
    },

    startDownload: function(progress_url, download_url, total) {
        var self = this;

        if ( self.timer ) {
            console.log("ALREADY POLLING");
            return;
        }

        self.pdf.progress_url = progress_url;
        self.pdf.download_url = download_url;
        self.pdf.total = total;

        self.is_running = true;
        self.num_processed = 0;
        self.i = 0;

        self.timer = setInterval(function() { self.checkStatus(); }, 1000);
        // do it once the first time
        self.checkStatus();

    },

    checkStatus: function() {
        var self = this;
        self.i += 1;
        $.ajax({
            url : self.pdf.progress_url,
            data : { ts : (new Date).getTime() },
            cache : false,
            dataType : 'html',
            success : function(data) {
                var status = self.updateProgress(data);
                var log = $.trim(data).split("\n").reverse();
                self.num_processed += 1;
                if ( status.done ) {
                    self.clearTimer();
                } else if ( status.error ) {
                    self.$dialog.modal('hide');
                    self.showError();
                    self.clearTimer();
                }
            },
            error : function(req, textStatus, errorThrown) {
                console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                self.$dialog.modal('hide');
                self.clearTimer();
            }
        })
    },

    updateProgress: function(data) {
        var self = this;
        var status = { done : false, error : false };
        var percent;
        
        var current = $(data).find("#current").data('value');
        if ( current == 'EOT' ) {
            status.done = true;
            percent = 100;
        } else {
            current = parseInt(current);
            percent = 100 * ( current / self.pdf.total );
        }

        if ( self.last_percent != percent ) {
            self.last_percent = percent;
            self.num_attempts = 0;
        } else {
            self.num_attempts += 1;
        }

        if ( self.num_attempts > 5 ) {
            status.error = true;
        }

        if ( self.$dialog.find(".initial").is(":visible") ) {
            self.$dialog.find(".initial").hide();
            self.$dialog.find(".progress").removeClass("hide");
        }

        self.$dialog.find(".bar").css({ width : percent + '%'});

        if ( percent == 100 ) {
            self.$dialog.find(".progress").hide();
            self.$dialog.find(".done").show();
            self.$dialog.find(".download-pdf").show();
            self.$dialog.data('deactivated', true);
            // still could cancel
        }

        return status;
    },

    clearTimer: function() {
        var self = this;
        if ( self.timer ) {
            clearInterval(self.timer);
            self.timer = null;
        }
    },

    displayWarning: function(req) {
        console.log("WARN:", req);
    },

    showError: function() {
        console.log("ERROR");
    },


    EOT: true

}

head.ready(function() {
    HT.downloader = Object.create(HT.Downloader).init({
        params : HT.params
    })

    HT.downloader.start();

});


/* /htapps/roger.babel/pt/web/js/downloader.js */
head.ready(function() {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = "b";

    var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

    var $toolbar = $(".collectionLinks .select-collection");
    var $errormsg = $(".errormsg");
    var $infomsg = $(".infomsg");

    function display_error(msg) {
        if ( ! $errormsg.length ) {
            $errormsg = $('<div class="alert alert-error errormsg"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
    }

    function display_info(msg) {
        if ( ! $infomsg.length ) {
            $infomsg = $('<div class="alert alert-info infomsg"></div>').insertAfter($toolbar);
        }
        $infomsg.text(msg).show();
    }

    function hide_error() {
        $errormsg.hide().text();
    }

    function hide_info() {
        $infomsg.hide().text();
    }

    function get_url() {
        var url = "/cgi/mb";
        if ( location.pathname.indexOf("/shcgi/") > -1 ) {
            url = "/shcgi/mb";
        }
        return url;
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

        if ( options.iid ) {
            $("<input type='hidden' name='iid' />").appendTo($block).val(options.iid);
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

                    display_info("Submitting; please wait...");
                    submit_post({
                        a : 'additsnc',
                        cn : cn,
                        desc : desc,
                        shrd : $block.find("input[name=shrd]:checked").val()
                    })
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

    function submit_post(params) {
        var data = $.extend({}, { page : 'ajax', id : HT.params.id }, params);
        $.ajax({
            url : get_url(),
            data : data
        }).done(function(data) {
            var params = parse_line(data);
            hide_info();
            if ( params.result == 'ADD_ITEM_SUCCESS' ) {
                // do something
                add_item_to_collist(params);
            } else if ( params.result == 'ADD_ITEM_FAILURE' ) {
                display_error("Item could not be added at this time.");
            } else {
                console.log(data);
            }
        }).fail(function(jqXHR, textStatus, errorThrown) {
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

    $("#PTaddItemBtn").click(function(e) {
        e.preventDefault();
        var action = 'addI'

        hide_error();

        var selected_collection_id = $toolbar.find("select").val();
        var selected_collection_name = $toolbar.find("select option:selected").text();

        if ( ( selected_collection_id == DEFAULT_COLL_MENU_OPTION ) ) {
            display_error("You must select a collection.");
            return;
        }

        if ( selected_collection_id == NEW_COLL_MENU_OPTION ) {
            // deal with new collection
            edit_collection_metadata({ 
                creating : true,
                c : selected_collection_id,
                id : HT.params.id,
                a : action
            });
            return;
        }

        // var add_num_items = 1;
        // var COLL_SIZE_ARRAY = getCollSizeArray();
        // var coll_size = COLL_SIZE_ARRAY[selected_collection_id];
        // confirm_large(coll_size, add_num_items, function() {
        //     $form.submit();
        // })

        display_info("Submitting; please wait...");
        submit_post({
            c2 : selected_collection_id,
            a  : 'addits'
        });

    })

});
/* /htapps/roger.babel/pt/web/js/collection_tools.js */
