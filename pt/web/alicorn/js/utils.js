head.ready(function() {

    var DEFAULT_COLL_MENU_OPTION = "a";
    var NEW_COLL_MENU_OPTION = "b";

    var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

    var $toolbar = $(".collectionLinks .select-collection");
    var $errormsg = $(".errormsg");
    var $infomsg = $(".infomsg");

    function display_error(msg) {
        if ( ! $errormsg.length ) {
            $errormsg = $('<div class="alert alert-error errormsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
        }
        $errormsg.text(msg).show();
    }

    function display_info(msg) {
        if ( ! $infomsg.length ) {
            $infomsg = $('<div class="alert alert-info infomsg" style="margin-top: 0.5rem"></div>').insertAfter($toolbar);
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
                        '<input type="text" class="input-large" maxlength="100" name="cn" id="edit-cn" value="" placeholder="Your collection name" required />' +
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
                    '<label class="control-label">Is this collection <strong>Public</strong> or <strong>Private</strong>?</label>' +
                    '<div class="controls">' +
                        '<input type="radio" name="shrd" id="edit-shrd-0" value="0" checked="checked" > ' +
                        '<label class="radio inline" for="edit-shrd-0">' +
                            'Private ' +
                        '</label>' +
                        '<input type="radio" name="shrd" id="edit-shrd-1" value="1" > ' +
                        '<label class="radio inline" for="edit-shrd-1">' +
                            'Public ' +
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
            $('<div class="alert alert-info"><strong>This collection will be temporary</strong>. Log in to create permanent and public collections.</div>').appendTo($block);
            // remove the <label> that wraps the radio button
            $block.find("input[name=shrd][value=1]").remove();
            $block.find("label[for='edit-shrd-1']").remove();
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
                "class" : "btn btn-primary btn-dismiss",
                callback : function() {

                    var form = $block.get(0);
                    if ( ! form.checkValidity() ) {
                        form.reportValidity();
                        return false;
                    }

                    var cn = $.trim($block.find("input[name=cn]").val());
                    var desc = $.trim($block.find("textarea[name=desc]").val());

                    if ( ! cn ) {
                        // $('<div class="alert alert-error">You must enter a collection name.</div>').appendTo($block);
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
        $("a[data-toggle*=download]").addClass("interactive").click(function(e) {
            e.preventDefault();
            bootbox.hideAll();
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
        var html = $("#noDownloadAccess").html();
        html = html.replace('{DOWNLOAD_LINK}', $(this).attr("href"));
        this.$dialog = bootbox.alert(html);
        // this.$dialog.addClass("login");
    },

    downloadPdf: function(link) {
        var self = this;
        self.$link = $(link);
        self.src = $(link).attr('href');
        self.item_title = $(link).data('title') || 'PDF';

        if ( self.$link.data('range') == 'yes' ) {
            if ( ! self.$link.data('seq') ) {
                return;
            }
        }

        var html =
            // '<p>Building your PDF...</p>' +
            '<div class="initial"><p>Setting up download...</p></div>' +
            '<div class="progress progress-striped active hide">' +
                '<div class="bar" width="0%"></div>' +
            '</div>' +
            '<div class="done hide">' +
                '<p>All done!</p>' +
            '</div>';

        var header = 'Building your ' + self.item_title;
        var total = self.$link.data('total') || 0;
        if ( total > 0 ) {
            var suffix = total == 1 ? 'page' : 'pages';
            header += ' (' + total + ' ' + suffix + ')';
        }

        self.$dialog = bootbox.dialog(
            html,
            [
                {
                    label : 'Cancel',
                    'class' : 'btn-dismiss',
                    callback: function() {
                        if ( self.$dialog.data('deactivated') ) {
                            self.$dialog.closeModal();
                            return;
                        }
                        $.ajax({
                            url: self.src + ';callback=HT.downloader.cancelDownload;stop=1',
                            dataType: 'script',
                            cache: false,
                            error: function(req, textStatus, errorThrown) {
                                console.log("DOWNLOAD CANCELLED ERROR");
                                self.$dialog.closeModal();
                                console.log(req, textStatus, errorThrown);
                                if ( req.status == 503 ) {
                                    self.displayWarning(req);
                                } else {
                                    self.displayError();
                                }
                            }
                        })
                    }
                }
            ],
            {
                header: header 
            }
        );

        self.requestDownload();

    },

    requestDownload: function() {
        var self = this;
        var data = {};
        if ( self.$link.data('seq') ) {
            data['seq'] = self.$link.data('seq');
        }
        $.ajax({
            url: self.src.replace(/;/g, '&') + '&callback=HT.downloader.startDownloadMonitor',
            dataType: 'script',
            cache: false,
            data: data,
            error: function(req, textStatus, errorThrown) {
                console.log("DOWNLOAD STARTUP NOT DETECTED");
                if ( self.$dialog ) { self.$dialog.closeModal(); }
                if ( req.status == 503 ) {
                    self.displayWarning(req);
                } else {
                    self.displayError(req);
                }
            }
        });
    },

    cancelDownload: function(progress_url, download_url, total) {
        var self = this;
        self.clearTimer();
        self.$dialog.closeModal();
    },

    startDownloadMonitor: function(progress_url, download_url, total) {
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

        self.timer = setInterval(function() { self.checkStatus(); }, 2500);
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
            dataType: 'json',
            success : function(data) {
                var status = self.updateProgress(data);
                self.num_processed += 1;
                if ( status.done ) {
                    self.clearTimer();
                } else if ( status.error && status.num_attempts > 100 ) {
                    self.$dialog.closeModal();
                    self.displayProcessError();
                    self.clearTimer();
                    self.logError();
                } else if ( status.error ) {
                    self.$dialog.closeModal();
                    self.displayError();
                    self.clearTimer();
                }
            },
            error : function(req, textStatus, errorThrown) {
                console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                self.$dialog.closeModal();
                self.clearTimer();
                if ( req.status == 404 && (self.i > 25 || self.num_processed > 0) ) {
                    self.displayError();
                }
            }
        })
    },

    updateProgress: function(data) {
        var self = this;
        var status = { done : false, error : false };
        var percent;

        var current = data.status;
        if ( current == 'EOT' || current == 'DONE' ) {
            status.done = true;
            percent = 100;
        } else {
            current = data.current_page;
            percent = 100 * ( current / self.pdf.total );
        }

        if ( self.last_percent != percent ) {
            self.last_percent = percent;
            self.num_attempts = 0;
        } else {
            self.num_attempts += 1;
        }

        // try 100 times, which amounts to ~100 seconds
        if ( self.num_attempts > 100 ) {
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
            var $download_btn = self.$dialog.find('.download-pdf');
            if ( ! $download_btn.length ) {
                $download_btn = $('<a class="download-pdf btn btn-primary">Download {ITEM_TITLE}</a>'.replace('{ITEM_TITLE}', self.item_title)).attr('href', self.pdf.download_url);
                $download_btn.appendTo(self.$dialog.find(".modal__footer")).on('click', function(e) {
                    self.$link.trigger("click.google");
                    setTimeout(function() {
                        self.$dialog.closeModal();
                        $download_btn.remove();
                        HT.reader.controls.selectinator._clearSelection();
                        // HT.reader.emit('downloadDone');
                    }, 1500);
                    e.stopPropagation();
                })
            }
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
        var self = this;
        var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
        var rate = req.getResponseHeader('X-Choke-Rate')

        if ( timeout <= 5 ) {
            // just punt and wait it out
            setTimeout(function() {
              self.requestDownload();
            }, 5000);
            return;
        }

        timeout *= 1000;
        var now = (new Date).getTime();
        var countdown = ( Math.ceil((timeout - now) / 1000) )

        var html =
          ('<div>' +
            '<p>You have exceeded the download rate of {rate}. You may proceed in <span id="throttle-timeout">{countdown}</span> seconds.</p>' +
            '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' +
          '</div>').replace('{rate}', rate).replace('{countdown}', countdown);

        self.$dialog = bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-primary',
                    callback: function() {
                        clearInterval(self.countdown_timer);
                        return true;
                    }
                }
            ]
        );

        self.countdown_timer = setInterval(function() {
              countdown -= 1;
              self.$dialog.find("#throttle-timeout").text(countdown);
              if ( countdown == 0 ) {
                clearInterval(self.countdown_timer);
              }
              console.log("TIC TOC", countdown);
        }, 1000);

    },

    displayProcessError: function(req) {
        var html =
            '<p>' + 
                'Unfortunately, the process for creating your PDF has been interrupted. ' + 
                'Please click "OK" and try again.' + 
            '</p>' +
            '<p>' +
                'If this problem persists and you are unable to download this PDF after repeated attempts, ' + 
                'please notify us at <a href="/cgi/feedback/?page=form" data=m="pt" data-toggle="feedback tracking-action" data-tracking-action="Show Feedback">feedback@issues.hathitrust.org</a> ' +
                'and include the URL of the book you were trying to access when the problem occurred.' +
            '</p>';

        // bootbox.alert(html);
        bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-inverse'
                }
            ],
            { classes : 'error' }
        );

        console.log(req);
    },

    displayError: function(req) {
        var html =
            '<p>' +
                'There was a problem building your ' + this.item_title + '; staff have been notified.' +
            '</p>' +
            '<p>' +
                'Please try again in 24 hours.' +
            '</p>';

        // bootbox.alert(html);
        bootbox.dialog(
            html,
            [
                {
                    label : 'OK',
                    'class' : 'btn-dismiss btn-inverse'
                }
            ],
            { classes : 'error' }
        );

        console.log(req);
    },

    logError: function() {
        var self = this;
        $.get(self.src + ';num_attempts=' + self.num_attempts);
    },


    EOT: true

}

head.ready(function() {
    HT.downloader = Object.create(HT.Downloader).init({
        params : HT.params
    })

    HT.downloader.start();

    // and do this here
    $("#selectedPagesPdfLink").on('click', function(e) {
        e.preventDefault();

        var printable = HT.reader.controls.selectinator._getPageSelection();

        if ( printable.length == 0 ) {
            var buttons = [];

            var msg = [ "<p>You haven't selected any pages to print.</p>" ];
            if ( HT.reader.view.name == '2up' ) {
                msg.push("<p>To select pages, click in the upper left or right corner of the page.");
                msg.push("<p class=\"centered\"><img src=\"/pt/web/graphics/view-flip.gif\" /></p>");
            } else {
                msg.push("<p>To select pages, click in the upper right corner of the page.");
                if ( HT.reader.view.name == 'thumb' ) {
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
                'class' : 'btn-dismiss'
            });
            bootbox.dialog(msg, buttons);
            return false;
        }


        var seq = HT.reader.controls.selectinator._getFlattenedSelection(printable);

        $(this).data('seq', seq);
        HT.downloader.downloadPdf(this);
    });

});


// supply method for creating an embeddable URL
head.ready(function() {

    var side_short = "450";
    var side_long  = "700";
    var htId = HT.params.id;
    var embedHelpLink = "https://www.hathitrust.org/embed";

    var codeblock_txt_a = function(w,h) {return '<iframe width="' + w + '" height="' + h + '" ';}
    var codeblock_txt_b = 'src="https://hdl.handle.net/2027/' + htId + '?urlappend=%3Bui=embed"></iframe>';

    var $block = $(
    '<div class="embedUrlContainer">' +
        '<h3>Embed This Book' +
    '<a id="embedHelpIcon" default-form="data-default-form" ' +
      'href="' + embedHelpLink + '" target="_blank">Help</a></h3>' +
        '<form>' + 
        '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' +
        '    <label for="codeblock" class="offscreen">Code Block</label>' +
        '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3">' +
        codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + 
        '<div class="controls">' + 
            '<label class="radio inline">' +
                '<input type="radio" name="view" id="view-scroll" value="0" checked="checked" >' +
        '<span class="icomoon icomoon-scroll"/> Scroll View ' +
            '</label>' + 
            '<label class="radio inline">' +
                '<input type="radio" name="view" id="view-flip" value="1" >' +
        '<span class="icomoon icomoon-book-alt2"/> Flip View ' +
            '</label>' +
        '</div>' +
        '</form>' +
    '</div>'
    );


    $("#embedHtml").click(function(e) {
        e.preventDefault();
        bootbox.dialog($block, [
            {
                "label" : "Cancel",
                "class" : "btn-dismiss"
            }
    ]);

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


// supply method for feedback system
var HT = HT || {};
HT.feedback = {};
HT.feedback.dialog = function() {
    var html =
        '<form>' +
        '    <fieldset>' +
        '        <legend>Email Address</legend>' +
        '        <label for="email" class="offscreen">EMail Address</label>' +
        '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' +
        '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Overall page readability and quality</legend>' +
        '        <div class="alert alert-help">Select one option that applies</div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" id="pt-feedback-quality-1" value="readable" />' +
        '            <label class="radio" for="pt-feedback-quality" >' +
        '                Few problems, entire page is readable' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" id="pt-feedback-quality-2" value="someproblems" />' +
        '            <label class="radio" for="pt-feedback-quality-2">' +
        '                Some problems, but still readable' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" value="difficult" id="pt-feedback-quality-3" />' +
        '            <label class="radio" for="pt-feedback-quality-3">' +
        '                Significant problems, difficult or impossible to read' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Quality" value="none" checked="checked" id="pt-feedback-quality-4" />' +
        '            <label class="radio" for="pt-feedback-quality-4">' +
        '                (No problems)' +
        '            </label>' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Specific page image problems?</legend>' +
        '        <div class="alert alert-help">Select any that apply</div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-1" />' +
        '            <label class="checkbox" for="pt-feedback-problems-1">' +
        '                Missing parts of the page' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="blurry" value="1" id="pt-feedback-problems-2"  />' +
        '            <label class="checkbox" for="pt-feedback-problems-2">' +
        '                Blurry text' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="checkbox" name="curved" value="1" id="pt-feedback-problems-3"  />' +
        '            <label class="checkbox" for="pt-feedback-problems-3">' +
        '                Curved or distorted text' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <label for="pt-feedback-problems-other">Other problem </label><input type="text" class="input-medium" name="other" value="" id="pt-feedback-problems-other"  />' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' +
        '        <legend>Problems with access rights?</legend>' +
        '        <span class="help-block" style="margin-bottom: 1rem;"><strong>' +
        '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' +
        '        </strong></span>' +
        '        <div class="alert alert-help">Select one option that applies</div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="noaccess" id="pt-feedback-access-1" />' +
        '            <label class="radio" for="pt-feedback-access-1">' +
        '                This item is in the public domain, but I don\'t have access to it.' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="access" id="pt-feedback-access-2" />' +
        '            <label class="radio" for="pt-feedback-access-2">' +
        '                    I have access to this item, but should not.' +
        '            </label>' +
        '        </div>' +
        '        <div class="control">' +
        '            <input type="radio" name="Rights" value="none" checked="checked" id="pt-feedback-access-3" />' +
        '            <label class="radio" for="pt-feedback-access-3">' +
        '                (No problems)' +
        '            </label>' +
        '        </div>' +
        '    </fieldset>' +
        '    <fieldset>' + 
        '        <legend>Other problems or comments?</legend>' +
        '        <p>' +
        '            <label class="offscreen" for="comments">Other problems or comments?</label>' +
        '            <textarea id="comments" name="comments" rows="3"></textarea>' +
        '        </p>' +
        '    </fieldset>' +
        '</form>';

    var $form = $(html);

    // hidden fields
    $("<input type='hidden' name='SysID' />").val(HT.params.id).appendTo($form);
    $("<input type='hidden' name='RecordURL' />").val(HT.params.RecordURL).appendTo($form);

    if ( HT.crms_state ) {
        $("<input type='hidden' name='CRMS' />").val(HT.crms_state).appendTo($form);
        var $email = $form.find("#email");
        $email.val(HT.crms_state);
        $email.hide();
        $("<span>" + HT.crms_state + "</span><br />").insertAfter($email);
        $form.find(".help-block").hide();
    }

    if ( HT.reader ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    } else if ( HT.params.seq ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    }
    $("<input type='hidden' name='view' />").val(HT.params.view).appendTo($form);

    // if ( HT.crms_state ) {
    //     $form.find("#email").val(HT.crms_state);
    // }


    return $form;
};

head.ready(function() {

    var $form = $("#search-modal form");

    var $input = $form.find("input.search-input-text");
    var $input_label = $form.find("label[for='q1-input']");
    var $select = $form.find(".control-searchtype");
    var $search_target = $form.find(".search-target");
    var $ft = $form.find("span.funky-full-view");

    var $backdrop = null;

    var $action = $("#action-search-hathitrust");
    $action.on('click', function() {
        bootbox.show('search-modal', {
            onShow: function(modal) {
                $input.focus();
            }
        });
    })

    var _setup = {};
    _setup.ls = function() {
        $select.hide();
        $input.attr('placeholder', 'Search words about or within the items');
        $input_label.text('Search full-text index');
    }

    _setup.catalog = function() {
        $select.show();
        $input.attr('placeholder', 'Search words about the items');
        $input_label.text('Search catalog index');
    }

    var target = $search_target.find("input:checked").val();
    _setup[target]();

    var prefs = HT.prefs.get();
    if ( prefs.search && prefs.search.ft ) {
        $("input[name=ft]").attr('checked', 'checked');
    }

    $search_target.on('change', 'input[type="radio"]', function(e) {
        var target = this.value;
        _setup[target]();
        HT.analytics.trackEvent({ label : "-", category : "HT Search", action : target });
    })

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
    $form.submit(function(event)
         {


            if ( ! this.checkValidity() ) {
                this.reportValidity();
                return false;
            }

           //check for blank or single asterisk
           var $input = $(this).find("input[name=q1]");
           var query = $input.val();
           query = $.trim(query);
           if (query === '')
           {
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
           else
           {

            // save last settings
            var searchtype = ( target == 'ls' ) ? 'all' : $select.find("select").val();
            HT.prefs.set({ search : { ft : $("input[name=ft]:checked").length > 0, target : target, searchtype: searchtype }})

            return true;
           }

     } );

})

head.ready(function() {

    var $menu = $("nav > ul > li:has(ul)");
    $menu.data('selected_idx', -1);
    $menu.on('focusin', function(event) {
        $menu.find("> a").get(0).dataset.expanded = true;
    })
    $menu.prev().find("> a").on('focusin', function() {
        $menu.find("> a").get(0).dataset.expanded = false;
    })
    $menu.find("ul > li > a:last").on('focusout', function(event) {
        $menu.find("> a").get(0).dataset.expanded = false;
    })
    $menu.on('keydown', function(event) {
        var code = event.code;
        var $items = $menu.find("ul > li > a");
        var selected_idx = $menu.data('selected_idx');
        var delta = 0;
        if ( code == 'ArrowDown' ) {
            delta = 1;
        } else if ( code == 'ArrowUp' ) {
            delta = -1;
        }
        if ( delta == 0 ) { return ; }
        selected_idx = ( selected_idx + delta ) % $items.length;
        console.log("AHOY MENU KEYDOWN", selected_idx);
        $selected = $items.slice(selected_idx, selected_idx + 1);
        $selected.focus();
        $menu.data('selected_idx', selected_idx);
    })

});

head.ready(function() {
  $("#form-search-volume").submit(function() {
    var $form = $(this);
    var $submit = $form.find("button[type=submit]");
    if ( $submit.hasClass("btn-loading") ) {
      alert("Your search query has been submitted and is currently being processed.");
      return false;
    }
    var $input = $form.find("input[type=text]")
    if ( ! $.trim($input.val()) ) {
      bootbox.alert("Please enter a term in the search box.");
      return false;
    }
    $submit.addClass("btn-loading").attr("disabled", "disabled");

    $(window).on('unload', function() {
      $submit.removeAttr('disabled');
    })

    return true;
  })
});

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

(function(factory) {  // Try to register as an anonymous AMD module
    if (typeof define === 'function' && define.amd) {
        define(['jquery'], factory);
    }
    else {
        factory(jQuery);
    }
}(function($, undefined) {

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
            convertNumber: function(data) {
                return data.data[0].total_count;
            },
            popupUrl: 'https://www.facebook.com/sharer/sharer.php?u={url}',
            popupWidth: 600,
            popupHeight: 500
        },
        twitter: {
            label: 'Twitter',
            counterUrl: 'https://cdn.api.twitter.com/1/urls/count.json?url={url}&callback=?',
            convertNumber: function(data) {
                return data.count;
            },
            popupUrl: 'https://twitter.com/intent/tweet?url={url}&text={post_title}',
            popupWidth: 600,
            popupHeight: 450,
            click: function() {
                // Add colon to improve readability
                if (!/[\.\?:\-–—]\s*$/.test(this.options.title)) this.options.title += ':';
                return true;
            }
        },
        mailru: {
            counterUrl: protocol + '//connect.mail.ru/share_count?url_list={url}&callback=1&func=?',
            convertNumber: function(data) {
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
            counter: function(jsonUrl, deferred) {
                var options = services.vkontakte;
                if (!options._) {
                    options._ = [];
                    if (!window.VK) window.VK = {};
                    window.VK.Share = {
                        count: function(idx, number) {
                            options._[idx].resolve(number);
                        }
                    };
                }

                var index = options._.length;
                options._.push(deferred);
                $.getScript(makeUrl(jsonUrl, {index: index}))
                    .fail(deferred.reject);
            },
            popupUrl: protocol + '//vk.com/share.php?url={url}&title={post_title}',
            popupWidth: 550,
            popupHeight: 330
        },
        odnoklassniki: {
            // HTTPS not supported
            counterUrl: isHttps ? undefined : 'http://connect.ok.ru/dk?st.cmd=extLike&ref={url}&uid={index}',
            counter: function(jsonUrl, deferred) {
                var options = services.odnoklassniki;
                if (!options._) {
                    options._ = [];
                    if (!window.ODKL) window.ODKL = {};
                    window.ODKL.updateCount = function(idx, number) {
                        options._[idx].resolve(number);
                    };
                }

                var index = options._.length;
                options._.push(deferred);
                $.getScript(makeUrl(jsonUrl, {index: index}))
                    .fail(deferred.reject);
            },
            popupUrl: 'http://connect.ok.ru/dk?st.cmd=WidgetSharePreview&service=odnoklassniki&st.shareUrl={url}',
            popupWidth: 550,
            popupHeight: 360
        },
        plusone: {
            label: 'Google+',
            // HTTPS not supported yet: http://clubs.ya.ru/share/1499
            counterUrl: isHttps ? undefined : 'http://share.yandex.ru/gpp.xml?url={url}',
            counter: function(jsonUrl, deferred) {
                var options = services.plusone;
                if (options._) {
                    // Reject all counters except the first because Yandex Share counter doesn’t return URL
                    deferred.reject();
                    return;
                }

                if (!window.services) window.services = {};
                window.services.gplus = {
                    cb: function(number) {
                        if (typeof number === 'string') {
                            number = number.replace(/\D/g, '');
                        }
                        options._.resolve(parseInt(number, 10));
                    }
                };

                options._ = deferred;
                $.getScript(makeUrl(jsonUrl))
                    .fail(deferred.reject);
            },
            popupUrl: 'https://plus.google.com/share?url={url}',
            popupWidth: 700,
            popupHeight: 500
        },
        pinterest: {
            label: 'Pinterest',
            counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
            convertNumber: function(data) {
                return data.count;
            },
            popupUrl: protocol + '//pinterest.com/pin/create/button/?url={url}&description={post_title}',
            popupWidth: 630,
            popupHeight: 360
        },
        tumblr: {
            label: 'Tumblr',
            counterUrl: protocol + '//api.pinterest.com/v1/urls/count.json?url={url}&callback=?',
            convertNumber: function(data) {
                return data.count;
            },
            popupUrl1: protocol + '//www.tumblr.com/share/link?url={url}&description={post_title}',
            popupUrl2: protocol + '//www.tumblr.com/share/photo?source={media}&click_thru={url}&description={post_title}',
            click: function() {
                if ( this.widget.data('media') ) {
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
            convertNumber: function(data) {
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
    $.fn.socialLinks = function(options) {
        return this.each(function() {
            var elem = $(this);
            var instance = elem.data(prefix);
            if (instance) {
                if ($.isPlainObject(options)) {
                    instance.update(options);
                }
            }
            else {
                instance = new socialLinks(elem, $.extend({}, $.fn.socialLinks.defaults, options, dataToOptions(elem)));
                elem.data(prefix, instance);
            }
        });
    };

    var post_title = document.title.split(' | ')[0].split(' - ');
    if ( $.inArray(post_title[post_title.length - 1], [ 'Full View', 'Limited View', 'Item Not Available' ]) !== -1 ) {
        post_title.pop();
    }
    post_title = post_title.join(" - ") + " | HathiTrust";
    $.fn.socialLinks.defaults = {
        url: window.location.href.replace(window.location.hash, '').replace(/;/g, '&').replace('/shcgi/', '/cgi/'),
        post_title: post_title,
        counters: true,
        zeroes: false,
        wait: 500,  // Show buttons only after counters are ready or after this amount of time
        timeout: 10000,  // Show counters after this amount of time even if they aren’t ready
        popupCheckInterval: 500,
        singleTitle: 'Share'
    };

    function socialLinks(container, options) {
        this.container = container;
        this.options = options;
        this.init();
    }

    socialLinks.prototype = {
        init: function() {
            // Add class in case of manual initialization
            this.container.addClass(prefix);

            this.initUserButtons();

            var buttons = this.container.children();

            this.buttons = [];
            buttons.each($.proxy(function(idx, elem) {
                var button = new Button($(elem), this.options);
                this.buttons.push(button);
            }, this));

        },
        initUserButtons: function() {
            if (!this.userButtonInited && window.socialLinksButtons) {
                $.extend(true, services, socialLinksButtons);
            }
            this.userButtonInited = true;
        },
        appear: function() {
            this.container.addClass(prefix + '_visible');
        },
        ready: function(silent) {
            if (this.timeout) {
                clearTimeout(this.timeout);
            }
            this.container.addClass(prefix + '_ready');
            if (!silent) {
                this.container.trigger('ready.' + prefix, this.number);
            }
        },
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
        init: function() {
            this.detectParams();
            this.initHtml();
            setTimeout($.proxy(this.initCounter, this), 0);
        },

        update: function(options) {
            $.extend(this.options, {forceUpdate: false}, options);
            this.widget.find('.' + prefix + '__counter').remove();  // Remove old counter
            this.initCounter();
        },

        detectService: function() {
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

        detectParams: function() {
            var data = this.widget.data();

            // Custom page counter URL or number
            if (data.counter) {
                var number = parseInt(data.counter, 10);
                if (isNaN(number)) {
                    this.options.counterUrl = data.counter;
                }
                else {
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

        initHtml: function() {
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
            }
            else {
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

        initCounter: function() {
        },

        cloneDataAttrs: function(source, destination) {
            var data = source.data();
            for (var key in data) {
                if (data.hasOwnProperty(key)) {
                    destination.data(key, data[key]);
                }
            }
        },

        getElementClassNames: function(elem) {
            return getElementClassNames(elem, this.service);
        },

        updateCounter: function(number) {
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

        click: function(e) {
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
                if ( this.widget.data('media') ) {
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

        addAdditionalParamsToUrl: function(url) {
            var data =  dataToOptions(this.widget);
            var params = $.param($.extend(data, this.options.data));
            if ($.isEmptyObject(params)) return url;
            var glue = url.indexOf('?') === -1 ? '?' : '&';
            return url + glue + params;
        },

        openPopup: function(url, params) {
            var left = Math.round(screen.width/2 - params.width/2);
            var top = 0;
            if (screen.height > params.height) {
                top = Math.round(screen.height/3 - params.height/2);
            }

            var win = window.open(url, 'sl_' + this.service, 'left=' + left + ',top=' + top + ',' +
               'width=' + params.width + ',height=' + params.height + ',personalbar=0,toolbar=0,scrollbars=1,resizable=1');
            if (win) {
                win.focus();
                this.widget.trigger('popup_opened.' + prefix, [this.service, win]);
                var timer = setInterval($.proxy(function() {
                    if (!win.closed) return;
                    clearInterval(timer);
                    this.widget.trigger('popup_closed.' + prefix, this.service);
                }, this), this.options.popupCheckInterval);
            }
            else {
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
            if ( key == 'tooltip' ) { continue ; }
            var value = data[key];
            if (value === 'yes') value = true;
            else if (value === 'no') value = false;
            options[key.replace(/-(\w)/g, upper)] = value;
        }
        return options;
    }

    function makeUrl(url, context) {
        return template(url, context, encodeURIComponent);
    }

    function template(tmpl, context, filter) {
        return tmpl.replace(/\{([^\}]+)\}/g, function(m, key) {
            // If key doesn't exists in the context we should keep template tag as is
            return key in context ? (filter ? filter(context[key]) : context[key]) : m;
        });
    }

    function getElementClassNames(elem, mod) {
        var cls = classPrefix + elem;
        return cls + ' ' + cls + '_' + mod;
    }

    function closeOnClick(elem, callback) {
        function handler(e) {
            if ((e.type === 'keydown' && e.which !== 27) || $(e.target).closest(elem).length) return;
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
            if (rect.left < offset)
                elem.css('left', offset - rect.left + left);
            else if (rect.right > window.innerWidth - offset)
                elem.css('left', window.innerWidth - rect.right - offset + left);

            if (rect.top < offset)
                elem.css('top', offset - rect.top + top);
            else if (rect.bottom > window.innerHeight - offset)
                elem.css('top', window.innerHeight - rect.bottom - offset + top);
        }
        elem.addClass(openClass);
    }


    /**
     * Auto initialization
     */
    $(function() {
        $('.' + prefix).socialLinks();
    });

}));

head.ready(function() {

    $("#versionIcon").click(function(e) {
        e.preventDefault();
        bootbox.alert("<p>This is the date when this item was last updated. Version dates are updated when improvements such as higher quality scans or more complete scans have been made. <br /><br /><a href=\"/cgi/feedback?page=form\" data-default-form=\"data-default-form\" data-toggle=\"feedback tracking-action\" data-id=\"\" data-tracking-action=\"Show Feedback\">Contact us</a> for more information.</p>")
    });

});

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbImNvbGxlY3Rpb25fdG9vbHMuanMiLCJkb3dubG9hZGVyLmpzIiwiZW1iZWRIVE1MX3BvcHVwLmpzIiwiZmVlZGJhY2suanMiLCJnbG9iYWxfc2VhcmNoLmpzIiwibWVudXMuanMiLCJzZWFyY2hfaW5faXRlbS5qcyIsInNvY2lhbF9saW5rcy5qcyIsInZlcnNpb25fcG9wdXAuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3RRQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDeGFBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUNwSEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDaENBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUN0QkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM1aEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQSIsImZpbGUiOiJ1dGlscy5qcyIsInNvdXJjZXNDb250ZW50IjpbImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OID0gXCJhXCI7XG4gICAgdmFyIE5FV19DT0xMX01FTlVfT1BUSU9OID0gXCJiXCI7XG5cbiAgICB2YXIgSU5fWU9VUl9DT0xMU19MQUJFTCA9ICdUaGlzIGl0ZW0gaXMgaW4geW91ciBjb2xsZWN0aW9uKHMpOic7XG5cbiAgICB2YXIgJHRvb2xiYXIgPSAkKFwiLmNvbGxlY3Rpb25MaW5rcyAuc2VsZWN0LWNvbGxlY3Rpb25cIik7XG4gICAgdmFyICRlcnJvcm1zZyA9ICQoXCIuZXJyb3Jtc2dcIik7XG4gICAgdmFyICRpbmZvbXNnID0gJChcIi5pbmZvbXNnXCIpO1xuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9lcnJvcihtc2cpIHtcbiAgICAgICAgaWYgKCAhICRlcnJvcm1zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkZXJyb3Jtc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3IgZXJyb3Jtc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkZXJyb3Jtc2cudGV4dChtc2cpLnNob3coKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2luZm8obXNnKSB7XG4gICAgICAgIGlmICggISAkaW5mb21zZy5sZW5ndGggKSB7XG4gICAgICAgICAgICAkaW5mb21zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1pbmZvIGluZm9tc2dcIiBzdHlsZT1cIm1hcmdpbi10b3A6IDAuNXJlbVwiPjwvZGl2PicpLmluc2VydEFmdGVyKCR0b29sYmFyKTtcbiAgICAgICAgfVxuICAgICAgICAkaW5mb21zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBjb25maXJtX2xhcmdlKGNvbGxTaXplLCBhZGROdW1JdGVtcywgY2FsbGJhY2spIHtcblxuICAgICAgICBpZiAoIGNvbGxTaXplIDw9IDEwMDAgJiYgY29sbFNpemUgKyBhZGROdW1JdGVtcyA+IDEwMDAgKSB7XG4gICAgICAgICAgICB2YXIgbnVtU3RyO1xuICAgICAgICAgICAgaWYgKGFkZE51bUl0ZW1zID4gMSkge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhlc2UgXCIgKyBhZGROdW1JdGVtcyArIFwiIGl0ZW1zXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBudW1TdHIgPSBcInRoaXMgaXRlbVwiO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdmFyIG1zZyA9IFwiTm90ZTogWW91ciBjb2xsZWN0aW9uIGNvbnRhaW5zIFwiICsgY29sbFNpemUgKyBcIiBpdGVtcy4gIEFkZGluZyBcIiArIG51bVN0ciArIFwiIHRvIHlvdXIgY29sbGVjdGlvbiB3aWxsIGluY3JlYXNlIGl0cyBzaXplIHRvIG1vcmUgdGhhbiAxMDAwIGl0ZW1zLiAgVGhpcyBtZWFucyB5b3VyIGNvbGxlY3Rpb24gd2lsbCBub3QgYmUgc2VhcmNoYWJsZSB1bnRpbCBpdCBpcyBpbmRleGVkLCB1c3VhbGx5IHdpdGhpbiA0OCBob3Vycy4gIEFmdGVyIHRoYXQsIGp1c3QgbmV3bHkgYWRkZWQgaXRlbXMgd2lsbCBzZWUgdGhpcyBkZWxheSBiZWZvcmUgdGhleSBjYW4gYmUgc2VhcmNoZWQuIFxcblxcbkRvIHlvdSB3YW50IHRvIHByb2NlZWQ/XCJcblxuICAgICAgICAgICAgY29uZmlybShtc2csIGZ1bmN0aW9uKGFuc3dlcikge1xuICAgICAgICAgICAgICAgIGlmICggYW5zd2VyICkge1xuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjaygpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0pXG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAvLyBhbGwgb3RoZXIgY2FzZXMgYXJlIG9rYXlcbiAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICAkKFwiI1BUYWRkSXRlbUJ0blwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgdmFyIGFjdGlvbiA9ICdhZGRJJ1xuXG4gICAgICAgIGhpZGVfZXJyb3IoKTtcblxuICAgICAgICB2YXIgc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX25hbWUgPSAkdG9vbGJhci5maW5kKFwic2VsZWN0IG9wdGlvbjpzZWxlY3RlZFwiKS50ZXh0KCk7XG5cbiAgICAgICAgaWYgKCAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gREVGQVVMVF9DT0xMX01FTlVfT1BUSU9OICkgKSB7XG4gICAgICAgICAgICBkaXNwbGF5X2Vycm9yKFwiWW91IG11c3Qgc2VsZWN0IGEgY29sbGVjdGlvbi5cIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGVjdGVkX2NvbGxlY3Rpb25faWQgPT0gTkVXX0NPTExfTUVOVV9PUFRJT04gKSB7XG4gICAgICAgICAgICAvLyBkZWFsIHdpdGggbmV3IGNvbGxlY3Rpb25cbiAgICAgICAgICAgIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YSh7XG4gICAgICAgICAgICAgICAgY3JlYXRpbmcgOiB0cnVlLFxuICAgICAgICAgICAgICAgIGMgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgICAgIGlkIDogSFQucGFyYW1zLmlkLFxuICAgICAgICAgICAgICAgIGEgOiBhY3Rpb25cbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdmFyIGFkZF9udW1faXRlbXMgPSAxO1xuICAgICAgICAvLyB2YXIgQ09MTF9TSVpFX0FSUkFZID0gZ2V0Q29sbFNpemVBcnJheSgpO1xuICAgICAgICAvLyB2YXIgY29sbF9zaXplID0gQ09MTF9TSVpFX0FSUkFZW3NlbGVjdGVkX2NvbGxlY3Rpb25faWRdO1xuICAgICAgICAvLyBjb25maXJtX2xhcmdlKGNvbGxfc2l6ZSwgYWRkX251bV9pdGVtcywgZnVuY3Rpb24oKSB7XG4gICAgICAgIC8vICAgICAkZm9ybS5zdWJtaXQoKTtcbiAgICAgICAgLy8gfSlcblxuICAgICAgICBkaXNwbGF5X2luZm8oXCJTdWJtaXR0aW5nOyBwbGVhc2Ugd2FpdC4uLlwiKTtcbiAgICAgICAgc3VibWl0X3Bvc3Qoe1xuICAgICAgICAgICAgYzIgOiBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkLFxuICAgICAgICAgICAgYSAgOiAnYWRkaXRzJ1xuICAgICAgICB9KTtcblxuICAgIH0pXG5cbn0pO1xuIiwiLy8gZG93bmxvYWRlclxuXG52YXIgSFQgPSBIVCB8fCB7fTtcblxuSFQuRG93bmxvYWRlciA9IHtcblxuICAgIGluaXQ6IGZ1bmN0aW9uKG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIHRoaXMub3B0aW9ucywgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuaWQgPSB0aGlzLm9wdGlvbnMucGFyYW1zLmlkO1xuICAgICAgICB0aGlzLnBkZiA9IHt9O1xuICAgICAgICByZXR1cm4gdGhpcztcbiAgICB9LFxuXG4gICAgb3B0aW9uczoge1xuXG4gICAgfSxcblxuICAgIHN0YXJ0IDogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdGhpcy5iaW5kRXZlbnRzKCk7XG4gICAgfSxcblxuICAgIGJpbmRFdmVudHM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgICQoXCJhW2RhdGEtdG9nZ2xlKj1kb3dubG9hZF1cIikuYWRkQ2xhc3MoXCJpbnRlcmFjdGl2ZVwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgICBib290Ym94LmhpZGVBbGwoKTtcbiAgICAgICAgICAgIGlmICggJCh0aGlzKS5hdHRyKFwicmVsXCIpID09ICdhbGxvdycgKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLm9wdGlvbnMucGFyYW1zLmRvd25sb2FkX3Byb2dyZXNzX2Jhc2UgPT0gbnVsbCApIHtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIHNlbGYuZG93bmxvYWRQZGYodGhpcyk7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIHNlbGYuZXhwbGFpblBkZkFjY2Vzcyh0aGlzKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSlcblxuICAgIH0sXG5cbiAgICBleHBsYWluUGRmQWNjZXNzOiBmdW5jdGlvbihsaW5rKSB7XG4gICAgICAgIHZhciBodG1sID0gJChcIiNub0Rvd25sb2FkQWNjZXNzXCIpLmh0bWwoKTtcbiAgICAgICAgaHRtbCA9IGh0bWwucmVwbGFjZSgne0RPV05MT0FEX0xJTkt9JywgJCh0aGlzKS5hdHRyKFwiaHJlZlwiKSk7XG4gICAgICAgIHRoaXMuJGRpYWxvZyA9IGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIC8vIHRoaXMuJGRpYWxvZy5hZGRDbGFzcyhcImxvZ2luXCIpO1xuICAgIH0sXG5cbiAgICBkb3dubG9hZFBkZjogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuJGxpbmsgPSAkKGxpbmspO1xuICAgICAgICBzZWxmLnNyYyA9ICQobGluaykuYXR0cignaHJlZicpO1xuICAgICAgICBzZWxmLml0ZW1fdGl0bGUgPSAkKGxpbmspLmRhdGEoJ3RpdGxlJykgfHwgJ1BERic7XG5cbiAgICAgICAgaWYgKCBzZWxmLiRsaW5rLmRhdGEoJ3JhbmdlJykgPT0gJ3llcycgKSB7XG4gICAgICAgICAgICBpZiAoICEgc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAvLyAnPHA+QnVpbGRpbmcgeW91ciBQREYuLi48L3A+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImluaXRpYWxcIj48cD5TZXR0aW5nIHVwIGRvd25sb2FkLi4uPC9wPjwvZGl2PicgK1xuICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJwcm9ncmVzcyBwcm9ncmVzcy1zdHJpcGVkIGFjdGl2ZSBoaWRlXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJiYXJcIiB3aWR0aD1cIjAlXCI+PC9kaXY+JyArXG4gICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAnPGRpdiBjbGFzcz1cImRvbmUgaGlkZVwiPicgK1xuICAgICAgICAgICAgICAgICc8cD5BbGwgZG9uZSE8L3A+JyArXG4gICAgICAgICAgICAnPC9kaXY+JztcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MnLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcpICkge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB1cmw6IHNlbGYuc3JjICsgJztjYWxsYmFjaz1IVC5kb3dubG9hZGVyLmNhbmNlbERvd25sb2FkO3N0b3A9MScsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkRPV05MT0FEIENBTkNFTExFRCBFUlJPUlwiKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgY29uc29sZS5sb2cocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgfSlcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgaGVhZGVyOiBoZWFkZXIgXG4gICAgICAgICAgICB9XG4gICAgICAgICk7XG5cbiAgICAgICAgc2VsZi5yZXF1ZXN0RG93bmxvYWQoKTtcblxuICAgIH0sXG5cbiAgICByZXF1ZXN0RG93bmxvYWQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBkYXRhID0ge307XG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdzZXEnKSApIHtcbiAgICAgICAgICAgIGRhdGFbJ3NlcSddID0gc2VsZi4kbGluay5kYXRhKCdzZXEnKTtcbiAgICAgICAgfVxuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsOiBzZWxmLnNyYy5yZXBsYWNlKC87L2csICcmJykgKyAnJmNhbGxiYWNrPUhULmRvd25sb2FkZXIuc3RhcnREb3dubG9hZE1vbml0b3InLFxuICAgICAgICAgICAgZGF0YVR5cGU6ICdzY3JpcHQnLFxuICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgZGF0YTogZGF0YSxcbiAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJET1dOTE9BRCBTVEFSVFVQIE5PVCBERVRFQ1RFRFwiKTtcbiAgICAgICAgICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZyApIHsgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTsgfVxuICAgICAgICAgICAgICAgIGlmICggcmVxLnN0YXR1cyA9PSA1MDMgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcihyZXEpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfSxcblxuICAgIGNhbmNlbERvd25sb2FkOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICB9LFxuXG4gICAgc3RhcnREb3dubG9hZE1vbml0b3I6IGZ1bmN0aW9uKHByb2dyZXNzX3VybCwgZG93bmxvYWRfdXJsLCB0b3RhbCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG5cbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY29uc29sZS5sb2coXCJBTFJFQURZIFBPTExJTkdcIik7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLnBkZi5wcm9ncmVzc191cmwgPSBwcm9ncmVzc191cmw7XG4gICAgICAgIHNlbGYucGRmLmRvd25sb2FkX3VybCA9IGRvd25sb2FkX3VybDtcbiAgICAgICAgc2VsZi5wZGYudG90YWwgPSB0b3RhbDtcblxuICAgICAgICBzZWxmLmlzX3J1bm5pbmcgPSB0cnVlO1xuICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgPSAwO1xuICAgICAgICBzZWxmLmkgPSAwO1xuXG4gICAgICAgIHNlbGYudGltZXIgPSBzZXRJbnRlcnZhbChmdW5jdGlvbigpIHsgc2VsZi5jaGVja1N0YXR1cygpOyB9LCAyNTAwKTtcbiAgICAgICAgLy8gZG8gaXQgb25jZSB0aGUgZmlyc3QgdGltZVxuICAgICAgICBzZWxmLmNoZWNrU3RhdHVzKCk7XG5cbiAgICB9LFxuXG4gICAgY2hlY2tTdGF0dXM6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHNlbGYuaSArPSAxO1xuICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgdXJsIDogc2VsZi5wZGYucHJvZ3Jlc3NfdXJsLFxuICAgICAgICAgICAgZGF0YSA6IHsgdHMgOiAobmV3IERhdGUpLmdldFRpbWUoKSB9LFxuICAgICAgICAgICAgY2FjaGUgOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnanNvbicsXG4gICAgICAgICAgICBzdWNjZXNzIDogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHZhciBzdGF0dXMgPSBzZWxmLnVwZGF0ZVByb2dyZXNzKGRhdGEpO1xuICAgICAgICAgICAgICAgIHNlbGYubnVtX3Byb2Nlc3NlZCArPSAxO1xuICAgICAgICAgICAgICAgIGlmICggc3RhdHVzLmRvbmUgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSBpZiAoIHN0YXR1cy5lcnJvciAmJiBzdGF0dXMubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlQcm9jZXNzRXJyb3IoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYubG9nRXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBlcnJvciA6IGZ1bmN0aW9uKHJlcSwgdGV4dFN0YXR1cywgZXJyb3JUaHJvd24pIHtcbiAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIkZBSUxFRDogXCIsIHJlcSwgXCIvXCIsIHRleHRTdGF0dXMsIFwiL1wiLCBlcnJvclRocm93bik7XG4gICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNDA0ICYmIChzZWxmLmkgPiAyNSB8fCBzZWxmLm51bV9wcm9jZXNzZWQgPiAwKSApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pXG4gICAgfSxcblxuICAgIHVwZGF0ZVByb2dyZXNzOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHN0YXR1cyA9IHsgZG9uZSA6IGZhbHNlLCBlcnJvciA6IGZhbHNlIH07XG4gICAgICAgIHZhciBwZXJjZW50O1xuXG4gICAgICAgIHZhciBjdXJyZW50ID0gZGF0YS5zdGF0dXM7XG4gICAgICAgIGlmICggY3VycmVudCA9PSAnRU9UJyB8fCBjdXJyZW50ID09ICdET05FJyApIHtcbiAgICAgICAgICAgIHN0YXR1cy5kb25lID0gdHJ1ZTtcbiAgICAgICAgICAgIHBlcmNlbnQgPSAxMDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBjdXJyZW50ID0gZGF0YS5jdXJyZW50X3BhZ2U7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwICogKCBjdXJyZW50IC8gc2VsZi5wZGYudG90YWwgKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi5sYXN0X3BlcmNlbnQgIT0gcGVyY2VudCApIHtcbiAgICAgICAgICAgIHNlbGYubGFzdF9wZXJjZW50ID0gcGVyY2VudDtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzID0gMDtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYubnVtX2F0dGVtcHRzICs9IDE7XG4gICAgICAgIH1cblxuICAgICAgICAvLyB0cnkgMTAwIHRpbWVzLCB3aGljaCBhbW91bnRzIHRvIH4xMDAgc2Vjb25kc1xuICAgICAgICBpZiAoIHNlbGYubnVtX2F0dGVtcHRzID4gMTAwICkge1xuICAgICAgICAgICAgc3RhdHVzLmVycm9yID0gdHJ1ZTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5pcyhcIjp2aXNpYmxlXCIpICkge1xuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIuaW5pdGlhbFwiKS5oaWRlKCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJywgdHJ1ZSk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfVxuXG4gICAgICAgIHJldHVybiBzdGF0dXM7XG4gICAgfSxcblxuICAgIGNsZWFyVGltZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwoc2VsZi50aW1lcik7XG4gICAgICAgICAgICBzZWxmLnRpbWVyID0gbnVsbDtcbiAgICAgICAgfVxuICAgIH0sXG5cbiAgICBkaXNwbGF5V2FybmluZzogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgdmFyIHRpbWVvdXQgPSBwYXJzZUludChyZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtVW50aWxFcG9jaCcpKTtcbiAgICAgICAgdmFyIHJhdGUgPSByZXEuZ2V0UmVzcG9uc2VIZWFkZXIoJ1gtQ2hva2UtUmF0ZScpXG5cbiAgICAgICAgaWYgKCB0aW1lb3V0IDw9IDUgKSB7XG4gICAgICAgICAgICAvLyBqdXN0IHB1bnQgYW5kIHdhaXQgaXQgb3V0XG4gICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBzZWxmLnJlcXVlc3REb3dubG9hZCgpO1xuICAgICAgICAgICAgfSwgNTAwMCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICB0aW1lb3V0ICo9IDEwMDA7XG4gICAgICAgIHZhciBub3cgPSAobmV3IERhdGUpLmdldFRpbWUoKTtcbiAgICAgICAgdmFyIGNvdW50ZG93biA9ICggTWF0aC5jZWlsKCh0aW1lb3V0IC0gbm93KSAvIDEwMDApIClcblxuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgKCc8ZGl2PicgK1xuICAgICAgICAgICAgJzxwPllvdSBoYXZlIGV4Y2VlZGVkIHRoZSBkb3dubG9hZCByYXRlIG9mIHtyYXRlfS4gWW91IG1heSBwcm9jZWVkIGluIDxzcGFuIGlkPVwidGhyb3R0bGUtdGltZW91dFwiPntjb3VudGRvd259PC9zcGFuPiBzZWNvbmRzLjwvcD4nICtcbiAgICAgICAgICAgICc8cD5Eb3dubG9hZCBsaW1pdHMgcHJvdGVjdCBIYXRoaVRydXN0IHJlc291cmNlcyBmcm9tIGFidXNlIGFuZCBoZWxwIGVuc3VyZSBhIGNvbnNpc3RlbnQgZXhwZXJpZW5jZSBmb3IgZXZlcnlvbmUuPC9wPicgK1xuICAgICAgICAgICc8L2Rpdj4nKS5yZXBsYWNlKCd7cmF0ZX0nLCByYXRlKS5yZXBsYWNlKCd7Y291bnRkb3dufScsIGNvdW50ZG93bik7XG5cbiAgICAgICAgc2VsZi4kZGlhbG9nID0gYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1wcmltYXJ5JyxcbiAgICAgICAgICAgICAgICAgICAgY2FsbGJhY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF1cbiAgICAgICAgKTtcblxuICAgICAgICBzZWxmLmNvdW50ZG93bl90aW1lciA9IHNldEludGVydmFsKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICBjb3VudGRvd24gLT0gMTtcbiAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmZpbmQoXCIjdGhyb3R0bGUtdGltZW91dFwiKS50ZXh0KGNvdW50ZG93bik7XG4gICAgICAgICAgICAgIGlmICggY291bnRkb3duID09IDAgKSB7XG4gICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLmNvdW50ZG93bl90aW1lcik7XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJUSUMgVE9DXCIsIGNvdW50ZG93bik7XG4gICAgICAgIH0sIDEwMDApO1xuXG4gICAgfSxcblxuICAgIGRpc3BsYXlQcm9jZXNzRXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArIFxuICAgICAgICAgICAgICAgICdVbmZvcnR1bmF0ZWx5LCB0aGUgcHJvY2VzcyBmb3IgY3JlYXRpbmcgeW91ciBQREYgaGFzIGJlZW4gaW50ZXJydXB0ZWQuICcgKyBcbiAgICAgICAgICAgICAgICAnUGxlYXNlIGNsaWNrIFwiT0tcIiBhbmQgdHJ5IGFnYWluLicgKyBcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ0lmIHRoaXMgcHJvYmxlbSBwZXJzaXN0cyBhbmQgeW91IGFyZSB1bmFibGUgdG8gZG93bmxvYWQgdGhpcyBQREYgYWZ0ZXIgcmVwZWF0ZWQgYXR0ZW1wdHMsICcgKyBcbiAgICAgICAgICAgICAgICAncGxlYXNlIG5vdGlmeSB1cyBhdCA8YSBocmVmPVwiL2NnaS9mZWVkYmFjay8/cGFnZT1mb3JtXCIgZGF0YT1tPVwicHRcIiBkYXRhLXRvZ2dsZT1cImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVwiU2hvdyBGZWVkYmFja1wiPmZlZWRiYWNrQGlzc3Vlcy5oYXRoaXRydXN0Lm9yZzwvYT4gJyArXG4gICAgICAgICAgICAgICAgJ2FuZCBpbmNsdWRlIHRoZSBVUkwgb2YgdGhlIGJvb2sgeW91IHdlcmUgdHJ5aW5nIHRvIGFjY2VzcyB3aGVuIHRoZSBwcm9ibGVtIG9jY3VycmVkLicgK1xuICAgICAgICAgICAgJzwvcD4nO1xuXG4gICAgICAgIC8vIGJvb3Rib3guYWxlcnQoaHRtbCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ09LJyxcbiAgICAgICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcyBidG4taW52ZXJzZSdcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICBdLFxuICAgICAgICAgICAgeyBjbGFzc2VzIDogJ2Vycm9yJyB9XG4gICAgICAgICk7XG5cbiAgICAgICAgY29uc29sZS5sb2cocmVxKTtcbiAgICB9LFxuXG4gICAgZGlzcGxheUVycm9yOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgJzxwPicgK1xuICAgICAgICAgICAgICAgICdUaGVyZSB3YXMgYSBwcm9ibGVtIGJ1aWxkaW5nIHlvdXIgJyArIHRoaXMuaXRlbV90aXRsZSArICc7IHN0YWZmIGhhdmUgYmVlbiBub3RpZmllZC4nICtcbiAgICAgICAgICAgICc8L3A+JyArXG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1BsZWFzZSB0cnkgYWdhaW4gaW4gMjQgaG91cnMuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBsb2dFcnJvcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgJC5nZXQoc2VsZi5zcmMgKyAnO251bV9hdHRlbXB0cz0nICsgc2VsZi5udW1fYXR0ZW1wdHMpO1xuICAgIH0sXG5cblxuICAgIEVPVDogdHJ1ZVxuXG59XG5cbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICAgSFQuZG93bmxvYWRlciA9IE9iamVjdC5jcmVhdGUoSFQuRG93bmxvYWRlcikuaW5pdCh7XG4gICAgICAgIHBhcmFtcyA6IEhULnBhcmFtc1xuICAgIH0pXG5cbiAgICBIVC5kb3dubG9hZGVyLnN0YXJ0KCk7XG5cbiAgICAvLyBhbmQgZG8gdGhpcyBoZXJlXG4gICAgJChcIiNzZWxlY3RlZFBhZ2VzUGRmTGlua1wiKS5vbignY2xpY2snLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcblxuICAgICAgICB2YXIgcHJpbnRhYmxlID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0UGFnZVNlbGVjdGlvbigpO1xuXG4gICAgICAgIGlmICggcHJpbnRhYmxlLmxlbmd0aCA9PSAwICkge1xuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSBbXTtcblxuICAgICAgICAgICAgdmFyIG1zZyA9IFsgXCI8cD5Zb3UgaGF2ZW4ndCBzZWxlY3RlZCBhbnkgcGFnZXMgdG8gcHJpbnQuPC9wPlwiIF07XG4gICAgICAgICAgICBpZiAoIEhULnJlYWRlci52aWV3Lm5hbWUgPT0gJzJ1cCcgKSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciBsZWZ0IG9yIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cCBjbGFzcz1cXFwiY2VudGVyZWRcXFwiPjxpbWcgc3JjPVxcXCIvcHQvd2ViL2dyYXBoaWNzL3ZpZXctZmxpcC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5UbyBzZWxlY3QgcGFnZXMsIGNsaWNrIGluIHRoZSB1cHBlciByaWdodCBjb3JuZXIgb2YgdGhlIHBhZ2UuXCIpO1xuICAgICAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAndGh1bWInICkge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy10aHVtYi5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1zY3JvbGwuZ2lmXFxcIiAvPjwvcD5cIik7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD48dHQ+c2hpZnQgKyBjbGljazwvdHQ+IHRvIGRlL3NlbGVjdCB0aGUgcGFnZXMgYmV0d2VlbiB0aGlzIHBhZ2UgYW5kIGEgcHJldmlvdXNseSBzZWxlY3RlZCBwYWdlLlwiKTtcbiAgICAgICAgICAgIG1zZy5wdXNoKFwiPHA+UGFnZXMgeW91IHNlbGVjdCB3aWxsIGFwcGVhciBpbiB0aGUgc2VsZWN0aW9uIGNvbnRlbnRzIDxidXR0b24gc3R5bGU9XFxcImJhY2tncm91bmQtY29sb3I6ICM2NjY7IGJvcmRlci1jb2xvcjogI2VlZVxcXCIgY2xhc3M9XFxcImJ0biBzcXVhcmVcXFwiPjxpIGNsYXNzPVxcXCJpY29tb29uIGljb21vb24tYXR0YWNobWVudFxcXCIgc3R5bGU9XFxcImNvbG9yOiB3aGl0ZTsgZm9udC1zaXplOiAxNHB4O1xcXCIgLz48L2J1dHRvbj5cIik7XG5cbiAgICAgICAgICAgIG1zZyA9IG1zZy5qb2luKFwiXFxuXCIpO1xuXG4gICAgICAgICAgICBidXR0b25zLnB1c2goe1xuICAgICAgICAgICAgICAgIGxhYmVsOiBcIk9LXCIsXG4gICAgICAgICAgICAgICAgJ2NsYXNzJyA6ICdidG4tZGlzbWlzcydcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgYm9vdGJveC5kaWFsb2cobXNnLCBidXR0b25zKTtcbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfVxuXG5cbiAgICAgICAgdmFyIHNlcSA9IEhULnJlYWRlci5jb250cm9scy5zZWxlY3RpbmF0b3IuX2dldEZsYXR0ZW5lZFNlbGVjdGlvbihwcmludGFibGUpO1xuXG4gICAgICAgICQodGhpcykuZGF0YSgnc2VxJywgc2VxKTtcbiAgICAgICAgSFQuZG93bmxvYWRlci5kb3dubG9hZFBkZih0aGlzKTtcbiAgICB9KTtcblxufSk7XG5cbiIsIi8vIHN1cHBseSBtZXRob2QgZm9yIGNyZWF0aW5nIGFuIGVtYmVkZGFibGUgVVJMXG5oZWFkLnJlYWR5KGZ1bmN0aW9uKCkge1xuXG4gICAgdmFyIHNpZGVfc2hvcnQgPSBcIjQ1MFwiO1xuICAgIHZhciBzaWRlX2xvbmcgID0gXCI3MDBcIjtcbiAgICB2YXIgaHRJZCA9IEhULnBhcmFtcy5pZDtcbiAgICB2YXIgZW1iZWRIZWxwTGluayA9IFwiaHR0cHM6Ly93d3cuaGF0aGl0cnVzdC5vcmcvZW1iZWRcIjtcblxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2EgPSBmdW5jdGlvbih3LGgpIHtyZXR1cm4gJzxpZnJhbWUgd2lkdGg9XCInICsgdyArICdcIiBoZWlnaHQ9XCInICsgaCArICdcIiAnO31cbiAgICB2YXIgY29kZWJsb2NrX3R4dF9iID0gJ3NyYz1cImh0dHBzOi8vaGRsLmhhbmRsZS5uZXQvMjAyNy8nICsgaHRJZCArICc/dXJsYXBwZW5kPSUzQnVpPWVtYmVkXCI+PC9pZnJhbWU+JztcblxuICAgIHZhciAkYmxvY2sgPSAkKFxuICAgICc8ZGl2IGNsYXNzPVwiZW1iZWRVcmxDb250YWluZXJcIj4nICtcbiAgICAgICAgJzxoMz5FbWJlZCBUaGlzIEJvb2snICtcbiAgICAnPGEgaWQ9XCJlbWJlZEhlbHBJY29uXCIgZGVmYXVsdC1mb3JtPVwiZGF0YS1kZWZhdWx0LWZvcm1cIiAnICtcbiAgICAgICdocmVmPVwiJyArIGVtYmVkSGVscExpbmsgKyAnXCIgdGFyZ2V0PVwiX2JsYW5rXCI+SGVscDwvYT48L2gzPicgK1xuICAgICAgICAnPGZvcm0+JyArIFxuICAgICAgICAnICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiPkNvcHkgdGhlIGNvZGUgYmVsb3cgYW5kIHBhc3RlIGl0IGludG8gdGhlIEhUTUwgb2YgYW55IHdlYnNpdGUgb3IgYmxvZy48L3NwYW4+JyArXG4gICAgICAgICcgICAgPGxhYmVsIGZvcj1cImNvZGVibG9ja1wiIGNsYXNzPVwib2Zmc2NyZWVuXCI+Q29kZSBCbG9jazwvbGFiZWw+JyArXG4gICAgICAgICcgICAgPHRleHRhcmVhIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgaWQ9XCJjb2RlYmxvY2tcIiBuYW1lPVwiY29kZWJsb2NrXCIgcm93cz1cIjNcIj4nICtcbiAgICAgICAgY29kZWJsb2NrX3R4dF9hKHNpZGVfc2hvcnQsIHNpZGVfbG9uZykgKyBjb2RlYmxvY2tfdHh0X2IgKyAnPC90ZXh0YXJlYT4nICsgXG4gICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICsgXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCI+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1zY3JvbGxcIiB2YWx1ZT1cIjBcIiBjaGVja2VkPVwiY2hlY2tlZFwiID4nICtcbiAgICAgICAgJzxzcGFuIGNsYXNzPVwiaWNvbW9vbiBpY29tb29uLXNjcm9sbFwiLz4gU2Nyb2xsIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICsgXG4gICAgICAgICAgICAnPGxhYmVsIGNsYXNzPVwicmFkaW8gaW5saW5lXCI+JyArXG4gICAgICAgICAgICAgICAgJzxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwidmlld1wiIGlkPVwidmlldy1mbGlwXCIgdmFsdWU9XCIxXCIgPicgK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tYm9vay1hbHQyXCIvPiBGbGlwIFZpZXcgJyArXG4gICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAnPC9mb3JtPicgK1xuICAgICc8L2Rpdj4nXG4gICAgKTtcblxuXG4gICAgJChcIiNlbWJlZEh0bWxcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guZGlhbG9nKCRibG9jaywgW1xuICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgIFwibGFiZWxcIiA6IFwiQ2FuY2VsXCIsXG4gICAgICAgICAgICAgICAgXCJjbGFzc1wiIDogXCJidG4tZGlzbWlzc1wiXG4gICAgICAgICAgICB9XG4gICAgXSk7XG5cbiAgICAgICAgLy8gQ3VzdG9tIHdpZHRoIGZvciBib3VuZGluZyAnLm1vZGFsJyBcbiAgICAgICAgJGJsb2NrLmNsb3Nlc3QoJy5tb2RhbCcpLmFkZENsYXNzKFwiYm9vdGJveE1lZGl1bVdpZHRoXCIpO1xuXG4gICAgICAgIC8vIFNlbGVjdCBlbnRpcmV0eSBvZiBjb2RlYmxvY2sgZm9yIGVhc3kgY29weWluZ1xuICAgICAgICB2YXIgdGV4dGFyZWEgPSAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9Y29kZWJsb2NrXVwiKTtcbiAgICB0ZXh0YXJlYS5vbihcImNsaWNrXCIsIGZ1bmN0aW9uICgpIHtcbiAgICAgICAgJCh0aGlzKS5zZWxlY3QoKTtcbiAgICB9KTtcblxuICAgICAgICAvLyBNb2RpZnkgY29kZWJsb2NrIHRvIG9uZSBvZiB0d28gdmlld3MgXG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1zY3JvbGxcIl0nKS5jbGljayhmdW5jdGlvbiAoKSB7XG4gICAgICAgIGNvZGVibG9ja190eHQgPSBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYjsgXG4gICAgICAgICAgICB0ZXh0YXJlYS52YWwoY29kZWJsb2NrX3R4dCk7XG4gICAgICAgIH0pO1xuICAgICAgICAkKCdpbnB1dDpyYWRpb1tpZD1cInZpZXctZmxpcFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX2xvbmcsIHNpZGVfc2hvcnQpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgfSk7XG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgZmVlZGJhY2sgc3lzdGVtXG52YXIgSFQgPSBIVCB8fCB7fTtcbkhULmZlZWRiYWNrID0ge307XG5IVC5mZWVkYmFjay5kaWFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICB2YXIgaHRtbCA9XG4gICAgICAgICc8Zm9ybT4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+RW1haWwgQWRkcmVzczwvbGVnZW5kPicgK1xuICAgICAgICAnICAgICAgICA8bGFiZWwgZm9yPVwiZW1haWxcIiBjbGFzcz1cIm9mZnNjcmVlblwiPkVNYWlsIEFkZHJlc3M8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LXhsYXJnZVwiIHBsYWNlaG9sZGVyPVwiW1lvdXIgZW1haWwgYWRkcmVzc11cIiBuYW1lPVwiZW1haWxcIiBpZD1cImVtYWlsXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+V2Ugd2lsbCBtYWtlIGV2ZXJ5IGVmZm9ydCB0byBhZGRyZXNzIGNvcHlyaWdodCBpc3N1ZXMgYnkgdGhlIG5leHQgYnVzaW5lc3MgZGF5IGFmdGVyIG5vdGlmaWNhdGlvbi48L3NwYW4+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3ZlcmFsbCBwYWdlIHJlYWRhYmlsaXR5IGFuZCBxdWFsaXR5PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IG9uZSBvcHRpb24gdGhhdCBhcHBsaWVzPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMVwiIHZhbHVlPVwicmVhZGFibGVcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5XCIgPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEZldyBwcm9ibGVtcywgZW50aXJlIHBhZ2UgaXMgcmVhZGFibGUnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTJcIiB2YWx1ZT1cInNvbWVwcm9ibGVtc1wiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFNvbWUgcHJvYmxlbXMsIGJ1dCBzdGlsbCByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cImRpZmZpY3VsdFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU2lnbmlmaWNhbnQgcHJvYmxlbXMsIGRpZmZpY3VsdCBvciBpbXBvc3NpYmxlIHRvIHJlYWQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJRdWFsaXR5XCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHktNFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlNwZWNpZmljIHBhZ2UgaW1hZ2UgcHJvYmxlbXM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1oZWxwXCI+U2VsZWN0IGFueSB0aGF0IGFwcGx5PC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImJsdXJyeVwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTFcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBNaXNzaW5nIHBhcnRzIG9mIHRoZSBwYWdlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0yXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBCbHVycnkgdGV4dCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cImNoZWNrYm94XCIgbmFtZT1cImN1cnZlZFwiIHZhbHVlPVwiMVwiIGlkPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtM1wiICAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwiY2hlY2tib3hcIiBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgQ3VydmVkIG9yIGRpc3RvcnRlZCB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBmb3I9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiPk90aGVyIHByb2JsZW0gPC9sYWJlbD48aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LW1lZGl1bVwiIG5hbWU9XCJvdGhlclwiIHZhbHVlPVwiXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy1vdGhlclwiICAvPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5Qcm9ibGVtcyB3aXRoIGFjY2VzcyByaWdodHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxzcGFuIGNsYXNzPVwiaGVscC1ibG9ja1wiIHN0eWxlPVwibWFyZ2luLWJvdHRvbTogMXJlbTtcIj48c3Ryb25nPicgK1xuICAgICAgICAnICAgICAgICAgICAgKFNlZSBhbHNvOiA8YSBocmVmPVwiaHR0cDovL3d3dy5oYXRoaXRydXN0Lm9yZy90YWtlX2Rvd25fcG9saWN5XCIgdGFyZ2V0PVwiX2JsYW5rXCI+dGFrZS1kb3duIHBvbGljeTwvYT4pJyArXG4gICAgICAgICcgICAgICAgIDwvc3Ryb25nPjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub2FjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTFcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIFRoaXMgaXRlbSBpcyBpbiB0aGUgcHVibGljIGRvbWFpbiwgYnV0IEkgZG9uXFwndCBoYXZlIGFjY2VzcyB0byBpdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cImFjY2Vzc1wiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTJcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgICAgICBJIGhhdmUgYWNjZXNzIHRvIHRoaXMgaXRlbSwgYnV0IHNob3VsZCBub3QuJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUmlnaHRzXCIgdmFsdWU9XCJub25lXCIgY2hlY2tlZD1cImNoZWNrZWRcIiBpZD1cInB0LWZlZWRiYWNrLWFjY2Vzcy0zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICAoTm8gcHJvYmxlbXMpJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICsgXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+T3RoZXIgcHJvYmxlbXMgb3IgY29tbWVudHM/PC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxwPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwib2Zmc2NyZWVuXCIgZm9yPVwiY29tbWVudHNcIj5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICAgICAgPHRleHRhcmVhIGlkPVwiY29tbWVudHNcIiBuYW1lPVwiY29tbWVudHNcIiByb3dzPVwiM1wiPjwvdGV4dGFyZWE+JyArXG4gICAgICAgICcgICAgICAgIDwvcD4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnPC9mb3JtPic7XG5cbiAgICB2YXIgJGZvcm0gPSAkKGh0bWwpO1xuXG4gICAgLy8gaGlkZGVuIGZpZWxkc1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTeXNJRCcgLz5cIikudmFsKEhULnBhcmFtcy5pZCkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdSZWNvcmRVUkwnIC8+XCIpLnZhbChIVC5wYXJhbXMuUmVjb3JkVVJMKS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdDUk1TJyAvPlwiKS52YWwoSFQuY3Jtc19zdGF0ZSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgICAgICB2YXIgJGVtYWlsID0gJGZvcm0uZmluZChcIiNlbWFpbFwiKTtcbiAgICAgICAgJGVtYWlsLnZhbChIVC5jcm1zX3N0YXRlKTtcbiAgICAgICAgJGVtYWlsLmhpZGUoKTtcbiAgICAgICAgJChcIjxzcGFuPlwiICsgSFQuY3Jtc19zdGF0ZSArIFwiPC9zcGFuPjxiciAvPlwiKS5pbnNlcnRBZnRlcigkZW1haWwpO1xuICAgICAgICAkZm9ybS5maW5kKFwiLmhlbHAtYmxvY2tcIikuaGlkZSgpO1xuICAgIH1cblxuICAgIGlmICggSFQucmVhZGVyICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfSBlbHNlIGlmICggSFQucGFyYW1zLnNlcSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1NlcU5vJyAvPlwiKS52YWwoSFQucGFyYW1zLnNlcSkuYXBwZW5kVG8oJGZvcm0pO1xuICAgIH1cbiAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0ndmlldycgLz5cIikudmFsKEhULnBhcmFtcy52aWV3KS5hcHBlbmRUbygkZm9ybSk7XG5cbiAgICAvLyBpZiAoIEhULmNybXNfc3RhdGUgKSB7XG4gICAgLy8gICAgICRmb3JtLmZpbmQoXCIjZW1haWxcIikudmFsKEhULmNybXNfc3RhdGUpO1xuICAgIC8vIH1cblxuXG4gICAgcmV0dXJuICRmb3JtO1xufTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgJGZvcm0gPSAkKFwiI3NlYXJjaC1tb2RhbCBmb3JtXCIpO1xuXG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dC5zZWFyY2gtaW5wdXQtdGV4dFwiKTtcbiAgICB2YXIgJGlucHV0X2xhYmVsID0gJGZvcm0uZmluZChcImxhYmVsW2Zvcj0ncTEtaW5wdXQnXVwiKTtcbiAgICB2YXIgJHNlbGVjdCA9ICRmb3JtLmZpbmQoXCIuY29udHJvbC1zZWFyY2h0eXBlXCIpO1xuICAgIHZhciAkc2VhcmNoX3RhcmdldCA9ICRmb3JtLmZpbmQoXCIuc2VhcmNoLXRhcmdldFwiKTtcbiAgICB2YXIgJGZ0ID0gJGZvcm0uZmluZChcInNwYW4uZnVua3ktZnVsbC12aWV3XCIpO1xuXG4gICAgdmFyICRiYWNrZHJvcCA9IG51bGw7XG5cbiAgICB2YXIgJGFjdGlvbiA9ICQoXCIjYWN0aW9uLXNlYXJjaC1oYXRoaXRydXN0XCIpO1xuICAgICRhY3Rpb24ub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgICAgIGJvb3Rib3guc2hvdygnc2VhcmNoLW1vZGFsJywge1xuICAgICAgICAgICAgb25TaG93OiBmdW5jdGlvbihtb2RhbCkge1xuICAgICAgICAgICAgICAgICRpbnB1dC5mb2N1cygpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9KVxuXG4gICAgdmFyIF9zZXR1cCA9IHt9O1xuICAgIF9zZXR1cC5scyA9IGZ1bmN0aW9uKCkge1xuICAgICAgICAkc2VsZWN0LmhpZGUoKTtcbiAgICAgICAgJGlucHV0LmF0dHIoJ3BsYWNlaG9sZGVyJywgJ1NlYXJjaCB3b3JkcyBhYm91dCBvciB3aXRoaW4gdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggZnVsbC10ZXh0IGluZGV4Jyk7XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuXG4gICAgdmFyIHByZWZzID0gSFQucHJlZnMuZ2V0KCk7XG4gICAgaWYgKCBwcmVmcy5zZWFyY2ggJiYgcHJlZnMuc2VhcmNoLmZ0ICkge1xuICAgICAgICAkKFwiaW5wdXRbbmFtZT1mdF1cIikuYXR0cignY2hlY2tlZCcsICdjaGVja2VkJyk7XG4gICAgfVxuXG4gICAgJHNlYXJjaF90YXJnZXQub24oJ2NoYW5nZScsICdpbnB1dFt0eXBlPVwicmFkaW9cIl0nLCBmdW5jdGlvbihlKSB7XG4gICAgICAgIHZhciB0YXJnZXQgPSB0aGlzLnZhbHVlO1xuICAgICAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgICAgICBIVC5hbmFseXRpY3MudHJhY2tFdmVudCh7IGxhYmVsIDogXCItXCIsIGNhdGVnb3J5IDogXCJIVCBTZWFyY2hcIiwgYWN0aW9uIDogdGFyZ2V0IH0pO1xuICAgIH0pXG5cbiAgICAvLyAkZm9ybS5kZWxlZ2F0ZSgnOmlucHV0JywgJ2ZvY3VzIGNoYW5nZScsIGZ1bmN0aW9uKGUpIHtcbiAgICAvLyAgICAgY29uc29sZS5sb2coXCJGT0NVU0lOR1wiLCB0aGlzKTtcbiAgICAvLyAgICAgJGZvcm0uYWRkQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCA9PSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wID0gJCgnPGRpdiBjbGFzcz1cIm1vZGFsX19vdmVybGF5IGludmlzaWJsZVwiPjwvZGl2PicpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLm9uKCdjbGljaycsIGZ1bmN0aW9uKCkge1xuICAgIC8vICAgICAgICAgICAgIGNsb3NlX3NlYXJjaF9mb3JtKCk7XG4gICAgLy8gICAgICAgICB9KTtcbiAgICAvLyAgICAgfVxuICAgIC8vICAgICAkYmFja2Ryb3AuYXBwZW5kVG8oJChcImJvZHlcIikpLnNob3coKTtcbiAgICAvLyB9KVxuXG4gICAgLy8gJChcImJvZHlcIikub24oJ2ZvY3VzJywgJzppbnB1dCxhJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgIC8vICAgICBpZiAoICEgJHRoaXMuY2xvc2VzdChcIi5uYXYtc2VhcmNoLWZvcm1cIikubGVuZ3RoICkge1xuICAgIC8vICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH0pO1xuXG4gICAgLy8gdmFyIGNsb3NlX3NlYXJjaF9mb3JtID0gZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRmb3JtLnJlbW92ZUNsYXNzKFwiZm9jdXNlZFwiKTtcbiAgICAvLyAgICAgaWYgKCAkYmFja2Ryb3AgIT0gbnVsbCApIHtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5kZXRhY2goKTtcbiAgICAvLyAgICAgICAgICRiYWNrZHJvcC5oaWRlKCk7XG4gICAgLy8gICAgIH1cbiAgICAvLyB9XG5cbiAgICAvLyBhZGQgZXZlbnQgaGFuZGxlciBmb3Igc3VibWl0IHRvIGNoZWNrIGZvciBlbXB0eSBxdWVyeSBvciBhc3Rlcmlza1xuICAgICRmb3JtLnN1Ym1pdChmdW5jdGlvbihldmVudClcbiAgICAgICAgIHtcblxuXG4gICAgICAgICAgICBpZiAoICEgdGhpcy5jaGVja1ZhbGlkaXR5KCkgKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5yZXBvcnRWYWxpZGl0eSgpO1xuICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAvL2NoZWNrIGZvciBibGFuayBvciBzaW5nbGUgYXN0ZXJpc2tcbiAgICAgICAgICAgdmFyICRpbnB1dCA9ICQodGhpcykuZmluZChcImlucHV0W25hbWU9cTFdXCIpO1xuICAgICAgICAgICB2YXIgcXVlcnkgPSAkaW5wdXQudmFsKCk7XG4gICAgICAgICAgIHF1ZXJ5ID0gJC50cmltKHF1ZXJ5KTtcbiAgICAgICAgICAgaWYgKHF1ZXJ5ID09PSAnJylcbiAgICAgICAgICAge1xuICAgICAgICAgICAgIGFsZXJ0KFwiUGxlYXNlIGVudGVyIGEgc2VhcmNoIHRlcm0uXCIpO1xuICAgICAgICAgICAgICRpbnB1dC50cmlnZ2VyKCdibHVyJyk7XG4gICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICB9XG4gICAgICAgICAgIC8vIC8vICogIEJpbGwgc2F5cyBnbyBhaGVhZCBhbmQgZm9yd2FyZCBhIHF1ZXJ5IHdpdGggYW4gYXN0ZXJpc2sgICAjIyMjIyNcbiAgICAgICAgICAgLy8gZWxzZSBpZiAocXVlcnkgPT09ICcqJylcbiAgICAgICAgICAgLy8ge1xuICAgICAgICAgICAvLyAgIC8vIGNoYW5nZSBxMSB0byBibGFua1xuICAgICAgICAgICAvLyAgICQoXCIjcTEtaW5wdXRcIikudmFsKFwiXCIpXG4gICAgICAgICAgIC8vICAgJChcIi5zZWFyY2gtZm9ybVwiKS5zdWJtaXQoKTtcbiAgICAgICAgICAgLy8gfVxuICAgICAgICAgICAvLyAjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMqXG4gICAgICAgICAgIGVsc2VcbiAgICAgICAgICAge1xuXG4gICAgICAgICAgICAvLyBzYXZlIGxhc3Qgc2V0dGluZ3NcbiAgICAgICAgICAgIHZhciBzZWFyY2h0eXBlID0gKCB0YXJnZXQgPT0gJ2xzJyApID8gJ2FsbCcgOiAkc2VsZWN0LmZpbmQoXCJzZWxlY3RcIikudmFsKCk7XG4gICAgICAgICAgICBIVC5wcmVmcy5zZXQoeyBzZWFyY2ggOiB7IGZ0IDogJChcImlucHV0W25hbWU9ZnRdOmNoZWNrZWRcIikubGVuZ3RoID4gMCwgdGFyZ2V0IDogdGFyZ2V0LCBzZWFyY2h0eXBlOiBzZWFyY2h0eXBlIH19KVxuXG4gICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgfVxuXG4gICAgIH0gKTtcblxufSlcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgJG1lbnUgPSAkKFwibmF2ID4gdWwgPiBsaTpoYXModWwpXCIpO1xuICAgICRtZW51LmRhdGEoJ3NlbGVjdGVkX2lkeCcsIC0xKTtcbiAgICAkbWVudS5vbignZm9jdXNpbicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSB0cnVlO1xuICAgIH0pXG4gICAgJG1lbnUucHJldigpLmZpbmQoXCI+IGFcIikub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbigpIHtcbiAgICAgICAgJG1lbnUuZmluZChcIj4gYVwiKS5nZXQoMCkuZGF0YXNldC5leHBhbmRlZCA9IGZhbHNlO1xuICAgIH0pXG4gICAgJG1lbnUuZmluZChcInVsID4gbGkgPiBhOmxhc3RcIikub24oJ2ZvY3Vzb3V0JywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAgICAgJG1lbnUuZmluZChcIj4gYVwiKS5nZXQoMCkuZGF0YXNldC5leHBhbmRlZCA9IGZhbHNlO1xuICAgIH0pXG4gICAgJG1lbnUub24oJ2tleWRvd24nLCBmdW5jdGlvbihldmVudCkge1xuICAgICAgICB2YXIgY29kZSA9IGV2ZW50LmNvZGU7XG4gICAgICAgIHZhciAkaXRlbXMgPSAkbWVudS5maW5kKFwidWwgPiBsaSA+IGFcIik7XG4gICAgICAgIHZhciBzZWxlY3RlZF9pZHggPSAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnKTtcbiAgICAgICAgdmFyIGRlbHRhID0gMDtcbiAgICAgICAgaWYgKCBjb2RlID09ICdBcnJvd0Rvd24nICkge1xuICAgICAgICAgICAgZGVsdGEgPSAxO1xuICAgICAgICB9IGVsc2UgaWYgKCBjb2RlID09ICdBcnJvd1VwJyApIHtcbiAgICAgICAgICAgIGRlbHRhID0gLTE7XG4gICAgICAgIH1cbiAgICAgICAgaWYgKCBkZWx0YSA9PSAwICkgeyByZXR1cm4gOyB9XG4gICAgICAgIHNlbGVjdGVkX2lkeCA9ICggc2VsZWN0ZWRfaWR4ICsgZGVsdGEgKSAlICRpdGVtcy5sZW5ndGg7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBNRU5VIEtFWURPV05cIiwgc2VsZWN0ZWRfaWR4KTtcbiAgICAgICAgJHNlbGVjdGVkID0gJGl0ZW1zLnNsaWNlKHNlbGVjdGVkX2lkeCwgc2VsZWN0ZWRfaWR4ICsgMSk7XG4gICAgICAgICRzZWxlY3RlZC5mb2N1cygpO1xuICAgICAgICAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCBzZWxlY3RlZF9pZHgpO1xuICAgIH0pXG5cbn0pO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgJChcIiNmb3JtLXNlYXJjaC12b2x1bWVcIikuc3VibWl0KGZ1bmN0aW9uKCkge1xuICAgIHZhciAkZm9ybSA9ICQodGhpcyk7XG4gICAgdmFyICRzdWJtaXQgPSAkZm9ybS5maW5kKFwiYnV0dG9uW3R5cGU9c3VibWl0XVwiKTtcbiAgICBpZiAoICRzdWJtaXQuaGFzQ2xhc3MoXCJidG4tbG9hZGluZ1wiKSApIHtcbiAgICAgIGFsZXJ0KFwiWW91ciBzZWFyY2ggcXVlcnkgaGFzIGJlZW4gc3VibWl0dGVkIGFuZCBpcyBjdXJyZW50bHkgYmVpbmcgcHJvY2Vzc2VkLlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgdmFyICRpbnB1dCA9ICRmb3JtLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdXCIpXG4gICAgaWYgKCAhICQudHJpbSgkaW5wdXQudmFsKCkpICkge1xuICAgICAgYm9vdGJveC5hbGVydChcIlBsZWFzZSBlbnRlciBhIHRlcm0gaW4gdGhlIHNlYXJjaCBib3guXCIpO1xuICAgICAgcmV0dXJuIGZhbHNlO1xuICAgIH1cbiAgICAkc3VibWl0LmFkZENsYXNzKFwiYnRuLWxvYWRpbmdcIikuYXR0cihcImRpc2FibGVkXCIsIFwiZGlzYWJsZWRcIik7XG5cbiAgICAkKHdpbmRvdykub24oJ3VubG9hZCcsIGZ1bmN0aW9uKCkge1xuICAgICAgJHN1Ym1pdC5yZW1vdmVBdHRyKCdkaXNhYmxlZCcpO1xuICAgIH0pXG5cbiAgICByZXR1cm4gdHJ1ZTtcbiAgfSlcbn0pO1xuIiwiLyoqXG4gKiBTb2NpYWwgTGlua3NcbiAqIEluc3BpcmVkIGJ5OiBodHRwOi8vc2FwZWdpbi5naXRodWIuY29tL3NvY2lhbC1saWtlc1xuICpcbiAqIFNoYXJpbmcgYnV0dG9ucyBmb3IgUnVzc2lhbiBhbmQgd29ybGR3aWRlIHNvY2lhbCBuZXR3b3Jrcy5cbiAqXG4gKiBAcmVxdWlyZXMgalF1ZXJ5XG4gKiBAYXV0aG9yIEFydGVtIFNhcGVnaW5cbiAqIEBjb3B5cmlnaHQgMjAxNCBBcnRlbSBTYXBlZ2luIChzYXBlZ2luLm1lKVxuICogQGxpY2Vuc2UgTUlUXG4gKi9cblxuLypnbG9iYWwgZGVmaW5lOmZhbHNlLCBzb2NpYWxMaW5rc0J1dHRvbnM6ZmFsc2UgKi9cblxuKGZ1bmN0aW9uKGZhY3RvcnkpIHsgIC8vIFRyeSB0byByZWdpc3RlciBhcyBhbiBhbm9ueW1vdXMgQU1EIG1vZHVsZVxuICAgIGlmICh0eXBlb2YgZGVmaW5lID09PSAnZnVuY3Rpb24nICYmIGRlZmluZS5hbWQpIHtcbiAgICAgICAgZGVmaW5lKFsnanF1ZXJ5J10sIGZhY3RvcnkpO1xuICAgIH1cbiAgICBlbHNlIHtcbiAgICAgICAgZmFjdG9yeShqUXVlcnkpO1xuICAgIH1cbn0oZnVuY3Rpb24oJCwgdW5kZWZpbmVkKSB7XG5cbiAgICAndXNlIHN0cmljdCc7XG5cbiAgICB2YXIgcHJlZml4ID0gJ3NvY2lhbC1saW5rcyc7XG4gICAgdmFyIGNsYXNzUHJlZml4ID0gcHJlZml4ICsgJ19fJztcbiAgICB2YXIgb3BlbkNsYXNzID0gcHJlZml4ICsgJ19vcGVuZWQnO1xuICAgIHZhciBwcm90b2NvbCA9IGxvY2F0aW9uLnByb3RvY29sID09PSAnaHR0cHM6JyA/ICdodHRwczonIDogJ2h0dHA6JztcbiAgICB2YXIgaXNIdHRwcyA9IHByb3RvY29sID09PSAnaHR0cHM6JztcblxuXG4gICAgLyoqXG4gICAgICogQnV0dG9uc1xuICAgICAqL1xuICAgIHZhciBzZXJ2aWNlcyA9IHtcbiAgICAgICAgZmFjZWJvb2s6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnRmFjZWJvb2snLFxuICAgICAgICAgICAgLy8gaHR0cHM6Ly9kZXZlbG9wZXJzLmZhY2Vib29rLmNvbS9kb2NzL3JlZmVyZW5jZS9mcWwvbGlua19zdGF0L1xuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vZ3JhcGguZmFjZWJvb2suY29tL2ZxbD9xPVNFTEVDVCt0b3RhbF9jb3VudCtGUk9NK2xpbmtfc3RhdCtXSEVSRSt1cmwlM0QlMjJ7dXJsfSUyMiZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5kYXRhWzBdLnRvdGFsX2NvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly93d3cuZmFjZWJvb2suY29tL3NoYXJlci9zaGFyZXIucGhwP3U9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDUwMFxuICAgICAgICB9LFxuICAgICAgICB0d2l0dGVyOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1R3aXR0ZXInLFxuICAgICAgICAgICAgY291bnRlclVybDogJ2h0dHBzOi8vY2RuLmFwaS50d2l0dGVyLmNvbS8xL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3R3aXR0ZXIuY29tL2ludGVudC90d2VldD91cmw9e3VybH0mdGV4dD17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDQ1MCxcbiAgICAgICAgICAgIGNsaWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAvLyBBZGQgY29sb24gdG8gaW1wcm92ZSByZWFkYWJpbGl0eVxuICAgICAgICAgICAgICAgIGlmICghL1tcXC5cXD86XFwt4oCT4oCUXVxccyokLy50ZXN0KHRoaXMub3B0aW9ucy50aXRsZSkpIHRoaXMub3B0aW9ucy50aXRsZSArPSAnOic7XG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgICAgIG1haWxydToge1xuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9jb25uZWN0Lm1haWwucnUvc2hhcmVfY291bnQ/dXJsX2xpc3Q9e3VybH0mY2FsbGJhY2s9MSZmdW5jPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIGZvciAodmFyIHVybCBpbiBkYXRhKSB7XG4gICAgICAgICAgICAgICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KHVybCkpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBkYXRhW3VybF0uc2hhcmVzO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL2Nvbm5lY3QubWFpbC5ydS9zaGFyZT9zaGFyZV91cmw9e3VybH0mdGl0bGU9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDU1MCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgdmtvbnRha3RlOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1ZLJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL3ZrLmNvbS9zaGFyZS5waHA/YWN0PWNvdW50JnVybD17dXJsfSZpbmRleD17aW5kZXh9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy52a29udGFrdGU7XG4gICAgICAgICAgICAgICAgaWYgKCFvcHRpb25zLl8pIHtcbiAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gW107XG4gICAgICAgICAgICAgICAgICAgIGlmICghd2luZG93LlZLKSB3aW5kb3cuVksgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93LlZLLlNoYXJlID0ge1xuICAgICAgICAgICAgICAgICAgICAgICAgY291bnQ6IGZ1bmN0aW9uKGlkeCwgbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fW2lkeF0ucmVzb2x2ZShudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG9wdGlvbnMuXy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCwge2luZGV4OiBpbmRleH0pKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3ZrLmNvbS9zaGFyZS5waHA/dXJsPXt1cmx9JnRpdGxlPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzMwXG4gICAgICAgIH0sXG4gICAgICAgIG9kbm9rbGFzc25pa2k6IHtcbiAgICAgICAgICAgIC8vIEhUVFBTIG5vdCBzdXBwb3J0ZWRcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IGlzSHR0cHMgPyB1bmRlZmluZWQgOiAnaHR0cDovL2Nvbm5lY3Qub2sucnUvZGs/c3QuY21kPWV4dExpa2UmcmVmPXt1cmx9JnVpZD17aW5kZXh9JyxcbiAgICAgICAgICAgIGNvdW50ZXI6IGZ1bmN0aW9uKGpzb25VcmwsIGRlZmVycmVkKSB7XG4gICAgICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSBzZXJ2aWNlcy5vZG5va2xhc3NuaWtpO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5PREtMKSB3aW5kb3cuT0RLTCA9IHt9O1xuICAgICAgICAgICAgICAgICAgICB3aW5kb3cuT0RLTC51cGRhdGVDb3VudCA9IGZ1bmN0aW9uKGlkeCwgbnVtYmVyKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl9baWR4XS5yZXNvbHZlKG51bWJlcik7XG4gICAgICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgdmFyIGluZGV4ID0gb3B0aW9ucy5fLmxlbmd0aDtcbiAgICAgICAgICAgICAgICBvcHRpb25zLl8ucHVzaChkZWZlcnJlZCk7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsLCB7aW5kZXg6IGluZGV4fSkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwOi8vY29ubmVjdC5vay5ydS9kaz9zdC5jbWQ9V2lkZ2V0U2hhcmVQcmV2aWV3JnNlcnZpY2U9b2Rub2tsYXNzbmlraSZzdC5zaGFyZVVybD17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHBsdXNvbmU6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnR29vZ2xlKycsXG4gICAgICAgICAgICAvLyBIVFRQUyBub3Qgc3VwcG9ydGVkIHlldDogaHR0cDovL2NsdWJzLnlhLnJ1L3NoYXJlLzE0OTlcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IGlzSHR0cHMgPyB1bmRlZmluZWQgOiAnaHR0cDovL3NoYXJlLnlhbmRleC5ydS9ncHAueG1sP3VybD17dXJsfScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMucGx1c29uZTtcbiAgICAgICAgICAgICAgICBpZiAob3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIC8vIFJlamVjdCBhbGwgY291bnRlcnMgZXhjZXB0IHRoZSBmaXJzdCBiZWNhdXNlIFlhbmRleCBTaGFyZSBjb3VudGVyIGRvZXNu4oCZdCByZXR1cm4gVVJMXG4gICAgICAgICAgICAgICAgICAgIGRlZmVycmVkLnJlamVjdCgpO1xuICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuc2VydmljZXMpIHdpbmRvdy5zZXJ2aWNlcyA9IHt9O1xuICAgICAgICAgICAgICAgIHdpbmRvdy5zZXJ2aWNlcy5ncGx1cyA9IHtcbiAgICAgICAgICAgICAgICAgICAgY2I6IGZ1bmN0aW9uKG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgaWYgKHR5cGVvZiBudW1iZXIgPT09ICdzdHJpbmcnKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgbnVtYmVyID0gbnVtYmVyLnJlcGxhY2UoL1xcRC9nLCAnJyk7XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8ucmVzb2x2ZShwYXJzZUludChudW1iZXIsIDEwKSk7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9O1xuXG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fID0gZGVmZXJyZWQ7XG4gICAgICAgICAgICAgICAgJC5nZXRTY3JpcHQobWFrZVVybChqc29uVXJsKSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vcGx1cy5nb29nbGUuY29tL3NoYXJlP3VybD17dXJsfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA3MDAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogNTAwXG4gICAgICAgIH0sXG4gICAgICAgIHBpbnRlcmVzdDoge1xuICAgICAgICAgICAgbGFiZWw6ICdQaW50ZXJlc3QnLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3BpbnRlcmVzdC5jb20vcGluL2NyZWF0ZS9idXR0b24vP3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICB0dW1ibHI6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnVHVtYmxyJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDE6IHByb3RvY29sICsgJy8vd3d3LnR1bWJsci5jb20vc2hhcmUvbGluaz91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwVXJsMjogcHJvdG9jb2wgKyAnLy93d3cudHVtYmxyLmNvbS9zaGFyZS9waG90bz9zb3VyY2U9e21lZGlhfSZjbGlja190aHJ1PXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBjbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpICkge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9wdXBVcmwgPSB0aGlzLm9wdGlvbnMucG9wdXBVcmwyO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3B1cFVybCA9IHRoaXMub3B0aW9ucy5wb3B1cFVybDE7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIC8vIHdpbGwgc3RpbGwgbmVlZCB0byBjaGFuZ2UgdGhlIFVSTCBzdHJ1Y3R1cmVcbiAgICAgICAgICAgICAgICByZXR1cm4gdHJ1ZTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA2MzAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHJlZGRpdDoge1xuICAgICAgICAgICAgbGFiZWw6ICdSZWRkaXQnLFxuICAgICAgICAgICAgY291bnRlclVybDogcHJvdG9jb2wgKyAnLy9hcGkucGludGVyZXN0LmNvbS92MS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiBwcm90b2NvbCArICcvL3JlZGRpdC5jb20vc3VibWl0P3VybD17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICBFT1Q6IHRydWVcbiAgICB9O1xuXG4gICAgLyoqXG4gICAgICogalF1ZXJ5IHBsdWdpblxuICAgICAqL1xuICAgICQuZm4uc29jaWFsTGlua3MgPSBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHJldHVybiB0aGlzLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZWxlbSA9ICQodGhpcyk7XG4gICAgICAgICAgICB2YXIgaW5zdGFuY2UgPSBlbGVtLmRhdGEocHJlZml4KTtcbiAgICAgICAgICAgIGlmIChpbnN0YW5jZSkge1xuICAgICAgICAgICAgICAgIGlmICgkLmlzUGxhaW5PYmplY3Qob3B0aW9ucykpIHtcbiAgICAgICAgICAgICAgICAgICAgaW5zdGFuY2UudXBkYXRlKG9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGluc3RhbmNlID0gbmV3IHNvY2lhbExpbmtzKGVsZW0sICQuZXh0ZW5kKHt9LCAkLmZuLnNvY2lhbExpbmtzLmRlZmF1bHRzLCBvcHRpb25zLCBkYXRhVG9PcHRpb25zKGVsZW0pKSk7XG4gICAgICAgICAgICAgICAgZWxlbS5kYXRhKHByZWZpeCwgaW5zdGFuY2UpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KTtcbiAgICB9O1xuXG4gICAgdmFyIHBvc3RfdGl0bGUgPSBkb2N1bWVudC50aXRsZS5zcGxpdCgnIHwgJylbMF0uc3BsaXQoJyAtICcpO1xuICAgIGlmICggJC5pbkFycmF5KHBvc3RfdGl0bGVbcG9zdF90aXRsZS5sZW5ndGggLSAxXSwgWyAnRnVsbCBWaWV3JywgJ0xpbWl0ZWQgVmlldycsICdJdGVtIE5vdCBBdmFpbGFibGUnIF0pICE9PSAtMSApIHtcbiAgICAgICAgcG9zdF90aXRsZS5wb3AoKTtcbiAgICB9XG4gICAgcG9zdF90aXRsZSA9IHBvc3RfdGl0bGUuam9pbihcIiAtIFwiKSArIFwiIHwgSGF0aGlUcnVzdFwiO1xuICAgICQuZm4uc29jaWFsTGlua3MuZGVmYXVsdHMgPSB7XG4gICAgICAgIHVybDogd2luZG93LmxvY2F0aW9uLmhyZWYucmVwbGFjZSh3aW5kb3cubG9jYXRpb24uaGFzaCwgJycpLnJlcGxhY2UoLzsvZywgJyYnKS5yZXBsYWNlKCcvc2hjZ2kvJywgJy9jZ2kvJyksXG4gICAgICAgIHBvc3RfdGl0bGU6IHBvc3RfdGl0bGUsXG4gICAgICAgIGNvdW50ZXJzOiB0cnVlLFxuICAgICAgICB6ZXJvZXM6IGZhbHNlLFxuICAgICAgICB3YWl0OiA1MDAsICAvLyBTaG93IGJ1dHRvbnMgb25seSBhZnRlciBjb3VudGVycyBhcmUgcmVhZHkgb3IgYWZ0ZXIgdGhpcyBhbW91bnQgb2YgdGltZVxuICAgICAgICB0aW1lb3V0OiAxMDAwMCwgIC8vIFNob3cgY291bnRlcnMgYWZ0ZXIgdGhpcyBhbW91bnQgb2YgdGltZSBldmVuIGlmIHRoZXkgYXJlbuKAmXQgcmVhZHlcbiAgICAgICAgcG9wdXBDaGVja0ludGVydmFsOiA1MDAsXG4gICAgICAgIHNpbmdsZVRpdGxlOiAnU2hhcmUnXG4gICAgfTtcblxuICAgIGZ1bmN0aW9uIHNvY2lhbExpbmtzKGNvbnRhaW5lciwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLmNvbnRhaW5lciA9IGNvbnRhaW5lcjtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gb3B0aW9ucztcbiAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgfVxuXG4gICAgc29jaWFsTGlua3MucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIC8vIEFkZCBjbGFzcyBpbiBjYXNlIG9mIG1hbnVhbCBpbml0aWFsaXphdGlvblxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4KTtcblxuICAgICAgICAgICAgdGhpcy5pbml0VXNlckJ1dHRvbnMoKTtcblxuICAgICAgICAgICAgdmFyIGJ1dHRvbnMgPSB0aGlzLmNvbnRhaW5lci5jaGlsZHJlbigpO1xuXG4gICAgICAgICAgICB0aGlzLmJ1dHRvbnMgPSBbXTtcbiAgICAgICAgICAgIGJ1dHRvbnMuZWFjaCgkLnByb3h5KGZ1bmN0aW9uKGlkeCwgZWxlbSkge1xuICAgICAgICAgICAgICAgIHZhciBidXR0b24gPSBuZXcgQnV0dG9uKCQoZWxlbSksIHRoaXMub3B0aW9ucyk7XG4gICAgICAgICAgICAgICAgdGhpcy5idXR0b25zLnB1c2goYnV0dG9uKTtcbiAgICAgICAgICAgIH0sIHRoaXMpKTtcblxuICAgICAgICB9LFxuICAgICAgICBpbml0VXNlckJ1dHRvbnM6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgaWYgKCF0aGlzLnVzZXJCdXR0b25Jbml0ZWQgJiYgd2luZG93LnNvY2lhbExpbmtzQnV0dG9ucykge1xuICAgICAgICAgICAgICAgICQuZXh0ZW5kKHRydWUsIHNlcnZpY2VzLCBzb2NpYWxMaW5rc0J1dHRvbnMpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy51c2VyQnV0dG9uSW5pdGVkID0gdHJ1ZTtcbiAgICAgICAgfSxcbiAgICAgICAgYXBwZWFyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCArICdfdmlzaWJsZScpO1xuICAgICAgICB9LFxuICAgICAgICByZWFkeTogZnVuY3Rpb24oc2lsZW50KSB7XG4gICAgICAgICAgICBpZiAodGhpcy50aW1lb3V0KSB7XG4gICAgICAgICAgICAgICAgY2xlYXJUaW1lb3V0KHRoaXMudGltZW91dCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXggKyAnX3JlYWR5Jyk7XG4gICAgICAgICAgICBpZiAoIXNpbGVudCkge1xuICAgICAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLnRyaWdnZXIoJ3JlYWR5LicgKyBwcmVmaXgsIHRoaXMubnVtYmVyKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcbiAgICB9O1xuXG5cbiAgICBmdW5jdGlvbiBCdXR0b24od2lkZ2V0LCBvcHRpb25zKSB7XG4gICAgICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0O1xuICAgICAgICB0aGlzLm9wdGlvbnMgPSAkLmV4dGVuZCh7fSwgb3B0aW9ucyk7XG4gICAgICAgIHRoaXMuZGV0ZWN0U2VydmljZSgpO1xuICAgICAgICBpZiAodGhpcy5zZXJ2aWNlKSB7XG4gICAgICAgICAgICB0aGlzLmluaXQoKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIEJ1dHRvbi5wcm90b3R5cGUgPSB7XG4gICAgICAgIGluaXQ6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdGhpcy5kZXRlY3RQYXJhbXMoKTtcbiAgICAgICAgICAgIHRoaXMuaW5pdEh0bWwoKTtcbiAgICAgICAgICAgIHNldFRpbWVvdXQoJC5wcm94eSh0aGlzLmluaXRDb3VudGVyLCB0aGlzKSwgMCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlOiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgICAgICAkLmV4dGVuZCh0aGlzLm9wdGlvbnMsIHtmb3JjZVVwZGF0ZTogZmFsc2V9LCBvcHRpb25zKTtcbiAgICAgICAgICAgIHRoaXMud2lkZ2V0LmZpbmQoJy4nICsgcHJlZml4ICsgJ19fY291bnRlcicpLnJlbW92ZSgpOyAgLy8gUmVtb3ZlIG9sZCBjb3VudGVyXG4gICAgICAgICAgICB0aGlzLmluaXRDb3VudGVyKCk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV0ZWN0U2VydmljZTogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgc2VydmljZSA9IHRoaXMud2lkZ2V0LmRhdGEoJ3NlcnZpY2UnKTtcbiAgICAgICAgICAgIGlmICghc2VydmljZSkge1xuICAgICAgICAgICAgICAgIC8vIGNsYXNzPVwiZmFjZWJvb2tcIlxuICAgICAgICAgICAgICAgIHZhciBub2RlID0gdGhpcy53aWRnZXRbMF07XG4gICAgICAgICAgICAgICAgdmFyIGNsYXNzZXMgPSBub2RlLmNsYXNzTGlzdCB8fCBub2RlLmNsYXNzTmFtZS5zcGxpdCgnICcpO1xuICAgICAgICAgICAgICAgIGZvciAodmFyIGNsYXNzSWR4ID0gMDsgY2xhc3NJZHggPCBjbGFzc2VzLmxlbmd0aDsgY2xhc3NJZHgrKykge1xuICAgICAgICAgICAgICAgICAgICB2YXIgY2xzID0gY2xhc3Nlc1tjbGFzc0lkeF07XG4gICAgICAgICAgICAgICAgICAgIGlmIChzZXJ2aWNlc1tjbHNdKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBzZXJ2aWNlID0gY2xzO1xuICAgICAgICAgICAgICAgICAgICAgICAgYnJlYWs7XG4gICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgaWYgKCFzZXJ2aWNlKSByZXR1cm47XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0aGlzLnNlcnZpY2UgPSBzZXJ2aWNlO1xuICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCBzZXJ2aWNlc1tzZXJ2aWNlXSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgZGV0ZWN0UGFyYW1zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gdGhpcy53aWRnZXQuZGF0YSgpO1xuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSBjb3VudGVyIFVSTCBvciBudW1iZXJcbiAgICAgICAgICAgIGlmIChkYXRhLmNvdW50ZXIpIHtcbiAgICAgICAgICAgICAgICB2YXIgbnVtYmVyID0gcGFyc2VJbnQoZGF0YS5jb3VudGVyLCAxMCk7XG4gICAgICAgICAgICAgICAgaWYgKGlzTmFOKG51bWJlcikpIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvdW50ZXJVcmwgPSBkYXRhLmNvdW50ZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMuY291bnRlck51bWJlciA9IG51bWJlcjtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIHRpdGxlXG4gICAgICAgICAgICBpZiAoZGF0YS50aXRsZSkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy50aXRsZSA9IGRhdGEudGl0bGU7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvc3RfdGl0bGUgPSB0aGlzLm9wdGlvbnMudGl0bGU7XG4gICAgICAgICAgICAgICAgZGVsZXRlIGRhdGEudGl0bGU7XG4gICAgICAgICAgICB9XG5cbiAgICAgICAgICAgIC8vIEN1c3RvbSBwYWdlIFVSTFxuICAgICAgICAgICAgaWYgKGRhdGEudXJsKSB7XG4gICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnVybCA9IGRhdGEudXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRIdG1sOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHZhciBvcHRpb25zID0gdGhpcy5vcHRpb25zO1xuICAgICAgICAgICAgdmFyIHdpZGdldCA9IHRoaXMud2lkZ2V0O1xuXG4gICAgICAgICAgICB2YXIgYnV0dG9uID0gd2lkZ2V0O1xuXG4gICAgICAgICAgICBpZiAob3B0aW9ucy5jbGlja1VybCkge1xuICAgICAgICAgICAgICAgIHZhciB1cmwgPSBtYWtlVXJsKG9wdGlvbnMuY2xpY2tVcmwsIHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdF90aXRsZTogb3B0aW9ucy5wb3N0X3RpdGxlXG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICAgICAgdmFyIGxpbmsgPSAkKCc8YT4nLCB7XG4gICAgICAgICAgICAgICAgICAgIGhyZWY6IHVybFxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHRoaXMuY2xvbmVEYXRhQXR0cnMod2lkZ2V0LCBsaW5rKTtcbiAgICAgICAgICAgICAgICB3aWRnZXQucmVwbGFjZVdpdGgobGluayk7XG4gICAgICAgICAgICAgICAgdGhpcy53aWRnZXQgPSB3aWRnZXQgPSBsaW5rO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgZWxzZSB7XG4gICAgICAgICAgICAgICAgd2lkZ2V0Lm9uKCdjbGljaycsICQucHJveHkodGhpcy5jbGljaywgdGhpcykpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgX3dpZGdldCA9IHdpZGdldC5nZXQoMCk7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQucm9sZSA9ICd0b29sdGlwJztcbiAgICAgICAgICAgIF93aWRnZXQuZGF0YXNldC5taWNyb3RpcFBvc2l0aW9uID0gJ3RvcCc7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQubWljcm90aXBTaXplID0gJ3NtYWxsJztcbiAgICAgICAgICAgIF93aWRnZXQuc2V0QXR0cmlidXRlKCdhcmlhLWxhYmVsJywgd2lkZ2V0LnRleHQoKSk7XG4gICAgICAgICAgICAvLyB3aWRnZXQudG9vbHRpcCh7IHRpdGxlIDogd2lkZ2V0LnRleHQoKSwgYW5pbWF0aW9uOiBmYWxzZSB9KTtcblxuICAgICAgICAgICAgdGhpcy5idXR0b24gPSBidXR0b247XG4gICAgICAgIH0sXG5cbiAgICAgICAgaW5pdENvdW50ZXI6IGZ1bmN0aW9uKCkge1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsb25lRGF0YUF0dHJzOiBmdW5jdGlvbihzb3VyY2UsIGRlc3RpbmF0aW9uKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHNvdXJjZS5kYXRhKCk7XG4gICAgICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgIGlmIChkYXRhLmhhc093blByb3BlcnR5KGtleSkpIHtcbiAgICAgICAgICAgICAgICAgICAgZGVzdGluYXRpb24uZGF0YShrZXksIGRhdGFba2V5XSk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuXG4gICAgICAgIGdldEVsZW1lbnRDbGFzc05hbWVzOiBmdW5jdGlvbihlbGVtKSB7XG4gICAgICAgICAgICByZXR1cm4gZ2V0RWxlbWVudENsYXNzTmFtZXMoZWxlbSwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgfSxcblxuICAgICAgICB1cGRhdGVDb3VudGVyOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgIG51bWJlciA9IHBhcnNlSW50KG51bWJlciwgMTApIHx8IDA7XG5cbiAgICAgICAgICAgIHZhciBwYXJhbXMgPSB7XG4gICAgICAgICAgICAgICAgJ2NsYXNzJzogdGhpcy5nZXRFbGVtZW50Q2xhc3NOYW1lcygnY291bnRlcicpLFxuICAgICAgICAgICAgICAgICd0ZXh0JzogbnVtYmVyXG4gICAgICAgICAgICB9O1xuICAgICAgICAgICAgaWYgKCFudW1iZXIgJiYgIXRoaXMub3B0aW9ucy56ZXJvZXMpIHtcbiAgICAgICAgICAgICAgICBwYXJhbXNbJ2NsYXNzJ10gKz0gJyAnICsgcHJlZml4ICsgJ19fY291bnRlcl9lbXB0eSc7XG4gICAgICAgICAgICAgICAgcGFyYW1zLnRleHQgPSAnJztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHZhciBjb3VudGVyRWxlbSA9ICQoJzxzcGFuPicsIHBhcmFtcyk7XG4gICAgICAgICAgICB0aGlzLndpZGdldC5hcHBlbmQoY291bnRlckVsZW0pO1xuXG4gICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdjb3VudGVyLicgKyBwcmVmaXgsIFt0aGlzLnNlcnZpY2UsIG51bWJlcl0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGNsaWNrOiBmdW5jdGlvbihlKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgICAgIHZhciBwcm9jZXNzID0gdHJ1ZTtcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24ob3B0aW9ucy5jbGljaykpIHtcbiAgICAgICAgICAgICAgICBwcm9jZXNzID0gb3B0aW9ucy5jbGljay5jYWxsKHRoaXMsIGUpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgaWYgKHByb2Nlc3MpIHtcbiAgICAgICAgICAgICAgICB2YXIgY29udGV4dCA9IHtcbiAgICAgICAgICAgICAgICAgICAgdXJsOiBvcHRpb25zLnVybCxcbiAgICAgICAgICAgICAgICAgICAgcG9zdF90aXRsZTogb3B0aW9ucy5wb3N0X3RpdGxlXG4gICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICBpZiAoIHRoaXMud2lkZ2V0LmRhdGEoJ21lZGlhJykgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNvbnRleHQubWVkaWEgPSB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gbWFrZVVybChvcHRpb25zLnBvcHVwVXJsLCBjb250ZXh0KTtcbiAgICAgICAgICAgICAgICB1cmwgPSB0aGlzLmFkZEFkZGl0aW9uYWxQYXJhbXNUb1VybCh1cmwpO1xuICAgICAgICAgICAgICAgIHRoaXMub3BlblBvcHVwKHVybCwge1xuICAgICAgICAgICAgICAgICAgICB3aWR0aDogb3B0aW9ucy5wb3B1cFdpZHRoLFxuICAgICAgICAgICAgICAgICAgICBoZWlnaHQ6IG9wdGlvbnMucG9wdXBIZWlnaHRcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgfSxcblxuICAgICAgICBhZGRBZGRpdGlvbmFsUGFyYW1zVG9Vcmw6IGZ1bmN0aW9uKHVybCkge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSAgZGF0YVRvT3B0aW9ucyh0aGlzLndpZGdldCk7XG4gICAgICAgICAgICB2YXIgcGFyYW1zID0gJC5wYXJhbSgkLmV4dGVuZChkYXRhLCB0aGlzLm9wdGlvbnMuZGF0YSkpO1xuICAgICAgICAgICAgaWYgKCQuaXNFbXB0eU9iamVjdChwYXJhbXMpKSByZXR1cm4gdXJsO1xuICAgICAgICAgICAgdmFyIGdsdWUgPSB1cmwuaW5kZXhPZignPycpID09PSAtMSA/ICc/JyA6ICcmJztcbiAgICAgICAgICAgIHJldHVybiB1cmwgKyBnbHVlICsgcGFyYW1zO1xuICAgICAgICB9LFxuXG4gICAgICAgIG9wZW5Qb3B1cDogZnVuY3Rpb24odXJsLCBwYXJhbXMpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gTWF0aC5yb3VuZChzY3JlZW4ud2lkdGgvMiAtIHBhcmFtcy53aWR0aC8yKTtcbiAgICAgICAgICAgIHZhciB0b3AgPSAwO1xuICAgICAgICAgICAgaWYgKHNjcmVlbi5oZWlnaHQgPiBwYXJhbXMuaGVpZ2h0KSB7XG4gICAgICAgICAgICAgICAgdG9wID0gTWF0aC5yb3VuZChzY3JlZW4uaGVpZ2h0LzMgLSBwYXJhbXMuaGVpZ2h0LzIpO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICB2YXIgd2luID0gd2luZG93Lm9wZW4odXJsLCAnc2xfJyArIHRoaXMuc2VydmljZSwgJ2xlZnQ9JyArIGxlZnQgKyAnLHRvcD0nICsgdG9wICsgJywnICtcbiAgICAgICAgICAgICAgICd3aWR0aD0nICsgcGFyYW1zLndpZHRoICsgJyxoZWlnaHQ9JyArIHBhcmFtcy5oZWlnaHQgKyAnLHBlcnNvbmFsYmFyPTAsdG9vbGJhcj0wLHNjcm9sbGJhcnM9MSxyZXNpemFibGU9MScpO1xuICAgICAgICAgICAgaWYgKHdpbikge1xuICAgICAgICAgICAgICAgIHdpbi5mb2N1cygpO1xuICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ3BvcHVwX29wZW5lZC4nICsgcHJlZml4LCBbdGhpcy5zZXJ2aWNlLCB3aW5dKTtcbiAgICAgICAgICAgICAgICB2YXIgdGltZXIgPSBzZXRJbnRlcnZhbCgkLnByb3h5KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbi5jbG9zZWQpIHJldHVybjtcbiAgICAgICAgICAgICAgICAgICAgY2xlYXJJbnRlcnZhbCh0aW1lcik7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0LnRyaWdnZXIoJ3BvcHVwX2Nsb3NlZC4nICsgcHJlZml4LCB0aGlzLnNlcnZpY2UpO1xuICAgICAgICAgICAgICAgIH0sIHRoaXMpLCB0aGlzLm9wdGlvbnMucG9wdXBDaGVja0ludGVydmFsKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIGxvY2F0aW9uLmhyZWYgPSB1cmw7XG4gICAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICB9O1xuXG5cbiAgICAvKipcbiAgICAgKiBIZWxwZXJzXG4gICAgICovXG5cbiAgICAgLy8gQ2FtZWxpemUgZGF0YS1hdHRyaWJ1dGVzXG4gICAgZnVuY3Rpb24gZGF0YVRvT3B0aW9ucyhlbGVtKSB7XG4gICAgICAgIGZ1bmN0aW9uIHVwcGVyKG0sIGwpIHtcbiAgICAgICAgICAgIHJldHVybiBsLnRvVXBwZXIoKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgb3B0aW9ucyA9IHt9O1xuICAgICAgICB2YXIgZGF0YSA9IGVsZW0uZGF0YSgpO1xuICAgICAgICBmb3IgKHZhciBrZXkgaW4gZGF0YSkge1xuICAgICAgICAgICAgaWYgKCBrZXkgPT0gJ3Rvb2x0aXAnICkgeyBjb250aW51ZSA7IH1cbiAgICAgICAgICAgIHZhciB2YWx1ZSA9IGRhdGFba2V5XTtcbiAgICAgICAgICAgIGlmICh2YWx1ZSA9PT0gJ3llcycpIHZhbHVlID0gdHJ1ZTtcbiAgICAgICAgICAgIGVsc2UgaWYgKHZhbHVlID09PSAnbm8nKSB2YWx1ZSA9IGZhbHNlO1xuICAgICAgICAgICAgb3B0aW9uc1trZXkucmVwbGFjZSgvLShcXHcpL2csIHVwcGVyKV0gPSB2YWx1ZTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gb3B0aW9ucztcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBtYWtlVXJsKHVybCwgY29udGV4dCkge1xuICAgICAgICByZXR1cm4gdGVtcGxhdGUodXJsLCBjb250ZXh0LCBlbmNvZGVVUklDb21wb25lbnQpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIHRlbXBsYXRlKHRtcGwsIGNvbnRleHQsIGZpbHRlcikge1xuICAgICAgICByZXR1cm4gdG1wbC5yZXBsYWNlKC9cXHsoW15cXH1dKylcXH0vZywgZnVuY3Rpb24obSwga2V5KSB7XG4gICAgICAgICAgICAvLyBJZiBrZXkgZG9lc24ndCBleGlzdHMgaW4gdGhlIGNvbnRleHQgd2Ugc2hvdWxkIGtlZXAgdGVtcGxhdGUgdGFnIGFzIGlzXG4gICAgICAgICAgICByZXR1cm4ga2V5IGluIGNvbnRleHQgPyAoZmlsdGVyID8gZmlsdGVyKGNvbnRleHRba2V5XSkgOiBjb250ZXh0W2tleV0pIDogbTtcbiAgICAgICAgfSk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZ2V0RWxlbWVudENsYXNzTmFtZXMoZWxlbSwgbW9kKSB7XG4gICAgICAgIHZhciBjbHMgPSBjbGFzc1ByZWZpeCArIGVsZW07XG4gICAgICAgIHJldHVybiBjbHMgKyAnICcgKyBjbHMgKyAnXycgKyBtb2Q7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gY2xvc2VPbkNsaWNrKGVsZW0sIGNhbGxiYWNrKSB7XG4gICAgICAgIGZ1bmN0aW9uIGhhbmRsZXIoZSkge1xuICAgICAgICAgICAgaWYgKChlLnR5cGUgPT09ICdrZXlkb3duJyAmJiBlLndoaWNoICE9PSAyNykgfHwgJChlLnRhcmdldCkuY2xvc2VzdChlbGVtKS5sZW5ndGgpIHJldHVybjtcbiAgICAgICAgICAgIGVsZW0ucmVtb3ZlQ2xhc3Mob3BlbkNsYXNzKTtcbiAgICAgICAgICAgIGRvYy5vZmYoZXZlbnRzLCBoYW5kbGVyKTtcbiAgICAgICAgICAgIGlmICgkLmlzRnVuY3Rpb24oY2FsbGJhY2spKSBjYWxsYmFjaygpO1xuICAgICAgICB9XG4gICAgICAgIHZhciBkb2MgPSAkKGRvY3VtZW50KTtcbiAgICAgICAgdmFyIGV2ZW50cyA9ICdjbGljayB0b3VjaHN0YXJ0IGtleWRvd24nO1xuICAgICAgICBkb2Mub24oZXZlbnRzLCBoYW5kbGVyKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBzaG93SW5WaWV3cG9ydChlbGVtKSB7XG4gICAgICAgIHZhciBvZmZzZXQgPSAxMDtcbiAgICAgICAgaWYgKGRvY3VtZW50LmRvY3VtZW50RWxlbWVudC5nZXRCb3VuZGluZ0NsaWVudFJlY3QpIHtcbiAgICAgICAgICAgIHZhciBsZWZ0ID0gcGFyc2VJbnQoZWxlbS5jc3MoJ2xlZnQnKSwgMTApO1xuICAgICAgICAgICAgdmFyIHRvcCA9IHBhcnNlSW50KGVsZW0uY3NzKCd0b3AnKSwgMTApO1xuXG4gICAgICAgICAgICB2YXIgcmVjdCA9IGVsZW1bMF0uZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgICAgICBpZiAocmVjdC5sZWZ0IDwgb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCdsZWZ0Jywgb2Zmc2V0IC0gcmVjdC5sZWZ0ICsgbGVmdCk7XG4gICAgICAgICAgICBlbHNlIGlmIChyZWN0LnJpZ2h0ID4gd2luZG93LmlubmVyV2lkdGggLSBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ2xlZnQnLCB3aW5kb3cuaW5uZXJXaWR0aCAtIHJlY3QucmlnaHQgLSBvZmZzZXQgKyBsZWZ0KTtcblxuICAgICAgICAgICAgaWYgKHJlY3QudG9wIDwgb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCd0b3AnLCBvZmZzZXQgLSByZWN0LnRvcCArIHRvcCk7XG4gICAgICAgICAgICBlbHNlIGlmIChyZWN0LmJvdHRvbSA+IHdpbmRvdy5pbm5lckhlaWdodCAtIG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygndG9wJywgd2luZG93LmlubmVySGVpZ2h0IC0gcmVjdC5ib3R0b20gLSBvZmZzZXQgKyB0b3ApO1xuICAgICAgICB9XG4gICAgICAgIGVsZW0uYWRkQ2xhc3Mob3BlbkNsYXNzKTtcbiAgICB9XG5cblxuICAgIC8qKlxuICAgICAqIEF1dG8gaW5pdGlhbGl6YXRpb25cbiAgICAgKi9cbiAgICAkKGZ1bmN0aW9uKCkge1xuICAgICAgICAkKCcuJyArIHByZWZpeCkuc29jaWFsTGlua3MoKTtcbiAgICB9KTtcblxufSkpO1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgICQoXCIjdmVyc2lvbkljb25cIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICBlLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgIGJvb3Rib3guYWxlcnQoXCI8cD5UaGlzIGlzIHRoZSBkYXRlIHdoZW4gdGhpcyBpdGVtIHdhcyBsYXN0IHVwZGF0ZWQuIFZlcnNpb24gZGF0ZXMgYXJlIHVwZGF0ZWQgd2hlbiBpbXByb3ZlbWVudHMgc3VjaCBhcyBoaWdoZXIgcXVhbGl0eSBzY2FucyBvciBtb3JlIGNvbXBsZXRlIHNjYW5zIGhhdmUgYmVlbiBtYWRlLiA8YnIgLz48YnIgLz48YSBocmVmPVxcXCIvY2dpL2ZlZWRiYWNrP3BhZ2U9Zm9ybVxcXCIgZGF0YS1kZWZhdWx0LWZvcm09XFxcImRhdGEtZGVmYXVsdC1mb3JtXFxcIiBkYXRhLXRvZ2dsZT1cXFwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXFxcIiBkYXRhLWlkPVxcXCJcXFwiIGRhdGEtdHJhY2tpbmctYWN0aW9uPVxcXCJTaG93IEZlZWRiYWNrXFxcIj5Db250YWN0IHVzPC9hPiBmb3IgbW9yZSBpbmZvcm1hdGlvbi48L3A+XCIpXG4gICAgfSk7XG5cbn0pO1xuIl19
