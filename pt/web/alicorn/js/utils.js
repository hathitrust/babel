var HT = HT || {};
head.ready(function() {

  var $status = $("div[role=status]");

  var lastMessage; var lastTimer;
  HT.update_status = function(message) {
      if ( lastMessage != message ) {
        if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

        setTimeout(() => {
          $status.text(message);
          lastMessage = message;
          console.log("-- status:", message);
        }, 50);
        lastTimer = setTimeout(() => {
          $status.get(0).innerText = '';
        }, 500);

      }
  }
})
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
        HT.update_status(msg);
    }

    function display_info(msg) {
        if ( ! $infomsg.length ) {
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

        HT.update_status(`Added item to collection ${params.coll_name}`);
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

        display_info("Adding item to your collection; please wait...");
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
            `<div class="initial" aria-live="polite"><p>Setting up the download...</div>` +
            '<div class="progress progress-striped active hide" aria-hidden="true">' +
                '<div class="bar" width="0%"></div>' +
            '</div>' +
            // '<div class="alert alert-block alert-success done hide">' +
            //     '<p>All done!</p>' +
            // '</div>' + 
            `<div><p><a href="https://www.hathitrust.org/help_digital_library#Download" target="_blank">What's the deal with downloads?</a></p></div>`;

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
                    'class' : 'btn-x-dismiss',
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
                                // self.$dialog.closeModal();
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
                header: header,
                id: 'download'
            }
        );

        // HT.update_status(`Building your ${self.item_title}.`);

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
            self.$dialog.find(".initial").html(`<p>Please wait while we build your ${self.item_title}...</p>`);
            self.$dialog.find(".progress").removeClass("hide");
        }

        self.$dialog.find(".bar").css({ width : percent + '%'});

        if ( percent == 100 ) {
            self.$dialog.find(".progress").hide();
            self.$dialog.find(".initial").html(`<p>All done! Your ${self.item_title} is ready for download. <span clsas="offscreen">Press return to download.</span></p>`);
            // self.$dialog.find(".done").show();
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
                $download_btn.focus();
            }
            self.$dialog.data('deactivated', true);
            // HT.update_status(`Your ${self.item_title} is ready for download. Press return to download.`);
            // still could cancel
        } else {
            self.$dialog.find(".initial").text(`Please wait while we build your ${self.item_title} (${Math.ceil(percent)}% completed)...`);
            // HT.update_status(`${Math.ceil(percent)}% of the ${self.item_title} has been built.`);
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

    var inited = false;

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
        if ( inited ) {
            HT.update_status("Search will use the full-text index.");
        }
    }

    _setup.catalog = function() {
        $select.show();
        $input.attr('placeholder', 'Search words about the items');
        $input_label.text('Search catalog index');
        if ( inited ) {
            HT.update_status("Search will use the catalog index; you can limit your search to a selection of fields.");
        }
    }

    var target = $search_target.find("input:checked").val();
    _setup[target]();
    inited = true;

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

    var DISMISS_EVENT = (window.hasOwnProperty &&
                window.hasOwnProperty('ontouchstart')) ?
                    'touchstart' : 'mousedown';

    var $menus = $("nav > ul > li:has(ul)");

    var toggle = function($popup, $menu, $link) {
        if ( $popup.data('state') == 'open' ) {
            $menu.removeClass("active");
            $popup.attr('aria-hidden', 'true');
            $link.focus();
            $popup.data('state', 'closed');
        } else {
            $menu.addClass("active");
            $popup.attr('aria-hidden', 'false');
            $popup.data('state', 'open');
        }
    }

    $menus.each(function(index) {
        var $menu = $(this);
        console.log("AHOY WUT", $menu);
        $menu.find("li").each(function(lidx) {
            var $item = $(this);
            $item.attr('aria-role', 'presentation');
            $item.find("a").attr('aria-role', 'menuitem');
        })

        var $link = $menu.find("> a");
        var $popup = $menu.find("ul");
        var $items = $popup.find("a");
        $link.on('click', function(e) {
            e.stopPropagation();
            e.preventDefault();
            toggle($popup, $menu, $link);
        })

        $menu.data('selected_idx', -1);
        $menu.on('keydown', function(event) {
            var code = event.code;
            var selected_idx = $menu.data('selected_idx');
            var delta = 0;
            if ( code == 'ArrowDown' ) {
                delta = 1;
            } else if ( code == 'ArrowUp' ) {
                delta = -1;
            } else if ( code == 'Escape' ) {
                toggle($popup, $menu, $link);
            }
            if ( delta == 0 ) { console.log("AHOY KEYCODE", code); return ; }
            event.stopPropagation();
            selected_idx = ( selected_idx + delta ) % $items.length;
            console.log("AHOY MENU KEYDOWN", selected_idx);
            $selected = $items.slice(selected_idx, selected_idx + 1);
            $selected.focus();
            $menu.data('selected_idx', selected_idx);
        })
    })


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

//# sourceMappingURL=data:application/json;charset=utf8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIl9iYXNlLmpzIiwiY29sbGVjdGlvbl90b29scy5qcyIsImRvd25sb2FkZXIuanMiLCJlbWJlZEhUTUxfcG9wdXAuanMiLCJmZWVkYmFjay5qcyIsImdsb2JhbF9zZWFyY2guanMiLCJtZW51cy5qcyIsInNlYXJjaF9pbl9pdGVtLmpzIiwic29jaWFsX2xpbmtzLmpzIiwidmVyc2lvbl9wb3B1cC5qcyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiQUFBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ3JCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUMxUUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbGJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDbEVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQ2hJQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUM3SEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQzNGQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDdEJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FDNWhCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoidXRpbHMuanMiLCJzb3VyY2VzQ29udGVudCI6WyJ2YXIgSFQgPSBIVCB8fCB7fTtcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgdmFyICRzdGF0dXMgPSAkKFwiZGl2W3JvbGU9c3RhdHVzXVwiKTtcblxuICB2YXIgbGFzdE1lc3NhZ2U7IHZhciBsYXN0VGltZXI7XG4gIEhULnVwZGF0ZV9zdGF0dXMgPSBmdW5jdGlvbihtZXNzYWdlKSB7XG4gICAgICBpZiAoIGxhc3RNZXNzYWdlICE9IG1lc3NhZ2UgKSB7XG4gICAgICAgIGlmICggbGFzdFRpbWVyICkgeyBjbGVhclRpbWVvdXQobGFzdFRpbWVyKTsgbGFzdFRpbWVyID0gbnVsbDsgfVxuXG4gICAgICAgIHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMudGV4dChtZXNzYWdlKTtcbiAgICAgICAgICBsYXN0TWVzc2FnZSA9IG1lc3NhZ2U7XG4gICAgICAgICAgY29uc29sZS5sb2coXCItLSBzdGF0dXM6XCIsIG1lc3NhZ2UpO1xuICAgICAgICB9LCA1MCk7XG4gICAgICAgIGxhc3RUaW1lciA9IHNldFRpbWVvdXQoKCkgPT4ge1xuICAgICAgICAgICRzdGF0dXMuZ2V0KDApLmlubmVyVGV4dCA9ICcnO1xuICAgICAgICB9LCA1MDApO1xuXG4gICAgICB9XG4gIH1cbn0pIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gPSBcImFcIjtcbiAgICB2YXIgTkVXX0NPTExfTUVOVV9PUFRJT04gPSBcImJcIjtcblxuICAgIHZhciBJTl9ZT1VSX0NPTExTX0xBQkVMID0gJ1RoaXMgaXRlbSBpcyBpbiB5b3VyIGNvbGxlY3Rpb24ocyk6JztcblxuICAgIHZhciAkdG9vbGJhciA9ICQoXCIuY29sbGVjdGlvbkxpbmtzIC5zZWxlY3QtY29sbGVjdGlvblwiKTtcbiAgICB2YXIgJGVycm9ybXNnID0gJChcIi5lcnJvcm1zZ1wiKTtcbiAgICB2YXIgJGluZm9tc2cgPSAkKFwiLmluZm9tc2dcIik7XG5cbiAgICBmdW5jdGlvbiBkaXNwbGF5X2Vycm9yKG1zZykge1xuICAgICAgICBpZiAoICEgJGVycm9ybXNnLmxlbmd0aCApIHtcbiAgICAgICAgICAgICRlcnJvcm1zZyA9ICQoJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1lcnJvciBlcnJvcm1zZ1wiIHN0eWxlPVwibWFyZ2luLXRvcDogMC41cmVtXCI+PC9kaXY+JykuaW5zZXJ0QWZ0ZXIoJHRvb2xiYXIpO1xuICAgICAgICB9XG4gICAgICAgICRlcnJvcm1zZy50ZXh0KG1zZykuc2hvdygpO1xuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKG1zZyk7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gZGlzcGxheV9pbmZvKG1zZykge1xuICAgICAgICBpZiAoICEgJGluZm9tc2cubGVuZ3RoICkge1xuICAgICAgICAgICAgJGluZm9tc2cgPSAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mbyBpbmZvbXNnXCIgc3R5bGU9XCJtYXJnaW4tdG9wOiAwLjVyZW1cIj48L2Rpdj4nKS5pbnNlcnRBZnRlcigkdG9vbGJhcik7XG4gICAgICAgIH1cbiAgICAgICAgJGluZm9tc2cudGV4dChtc2cpLnNob3coKTtcbiAgICAgICAgSFQudXBkYXRlX3N0YXR1cyhtc2cpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfZXJyb3IoKSB7XG4gICAgICAgICRlcnJvcm1zZy5oaWRlKCkudGV4dCgpO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGhpZGVfaW5mbygpIHtcbiAgICAgICAgJGluZm9tc2cuaGlkZSgpLnRleHQoKTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBnZXRfdXJsKCkge1xuICAgICAgICB2YXIgdXJsID0gXCIvY2dpL21iXCI7XG4gICAgICAgIGlmICggbG9jYXRpb24ucGF0aG5hbWUuaW5kZXhPZihcIi9zaGNnaS9cIikgPiAtMSApIHtcbiAgICAgICAgICAgIHVybCA9IFwiL3NoY2dpL21iXCI7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIHVybDtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBwYXJzZV9saW5lKGRhdGEpIHtcbiAgICAgICAgdmFyIHJldHZhbCA9IHt9O1xuICAgICAgICB2YXIgdG1wID0gZGF0YS5zcGxpdChcInxcIik7XG4gICAgICAgIGZvcih2YXIgaSA9IDA7IGkgPCB0bXAubGVuZ3RoOyBpKyspIHtcbiAgICAgICAgICAgIGt2ID0gdG1wW2ldLnNwbGl0KFwiPVwiKTtcbiAgICAgICAgICAgIHJldHZhbFtrdlswXV0gPSBrdlsxXTtcbiAgICAgICAgfVxuICAgICAgICByZXR1cm4gcmV0dmFsO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGVkaXRfY29sbGVjdGlvbl9tZXRhZGF0YShhcmdzKSB7XG5cbiAgICAgICAgdmFyIG9wdGlvbnMgPSAkLmV4dGVuZCh7IGNyZWF0aW5nIDogZmFsc2UsIGxhYmVsIDogXCJTYXZlIENoYW5nZXNcIiB9LCBhcmdzKTtcblxuICAgICAgICB2YXIgJGJsb2NrID0gJChcbiAgICAgICAgICAgICc8Zm9ybSBjbGFzcz1cImZvcm0taG9yaXpvbnRhbFwiIGFjdGlvbj1cIm1iXCI+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1jblwiPkNvbGxlY3Rpb24gTmFtZTwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInRleHRcIiBjbGFzcz1cImlucHV0LWxhcmdlXCIgbWF4bGVuZ3RoPVwiMTAwXCIgbmFtZT1cImNuXCIgaWQ9XCJlZGl0LWNuXCIgdmFsdWU9XCJcIiBwbGFjZWhvbGRlcj1cIllvdXIgY29sbGVjdGlvbiBuYW1lXCIgcmVxdWlyZWQgLz4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtY24tY291bnRcIj4xMDA8L3NwYW4+JyArXG4gICAgICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sLWdyb3VwXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJjb250cm9sLWxhYmVsXCIgZm9yPVwiZWRpdC1kZXNjXCI+RGVzY3JpcHRpb248L2xhYmVsPicgK1xuICAgICAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2xzXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPHRleHRhcmVhIGlkPVwiZWRpdC1kZXNjXCIgbmFtZT1cImRlc2NcIiByb3dzPVwiNFwiIG1heGxlbmd0aD1cIjI1NVwiIGNsYXNzPVwiaW5wdXQtbGFyZ2VcIiBwbGFjZWhvbGRlcj1cIkFkZCB5b3VyIGNvbGxlY3Rpb24gZGVzY3JpcHRpb24uXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8c3BhbiBjbGFzcz1cImxhYmVsIGNvdW50ZXJcIiBpZD1cImVkaXQtZGVzYy1jb3VudFwiPjI1NTwvc3Bhbj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICAgICAnPGRpdiBjbGFzcz1cImNvbnRyb2wtZ3JvdXBcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cImNvbnRyb2wtbGFiZWxcIj5JcyB0aGlzIGNvbGxlY3Rpb24gPHN0cm9uZz5QdWJsaWM8L3N0cm9uZz4gb3IgPHN0cm9uZz5Qcml2YXRlPC9zdHJvbmc+PzwvbGFiZWw+JyArXG4gICAgICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiY29udHJvbHNcIj4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0wXCIgdmFsdWU9XCIwXCIgY2hlY2tlZD1cImNoZWNrZWRcIiA+ICcgK1xuICAgICAgICAgICAgICAgICAgICAgICAgJzxsYWJlbCBjbGFzcz1cInJhZGlvIGlubGluZVwiIGZvcj1cImVkaXQtc2hyZC0wXCI+JyArXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgJ1ByaXZhdGUgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cInNocmRcIiBpZD1cImVkaXQtc2hyZC0xXCIgdmFsdWU9XCIxXCIgPiAnICtcbiAgICAgICAgICAgICAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIiBmb3I9XCJlZGl0LXNocmQtMVwiPicgK1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICdQdWJsaWMgJyArXG4gICAgICAgICAgICAgICAgICAgICAgICAnPC9sYWJlbD4nICtcbiAgICAgICAgICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgICAgICc8L2Rpdj4nICtcbiAgICAgICAgICAgICc8L2Zvcm0+J1xuICAgICAgICApO1xuXG4gICAgICAgIGlmICggb3B0aW9ucy5jbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1jbl1cIikudmFsKG9wdGlvbnMuY24pO1xuICAgICAgICB9XG5cbiAgICAgICAgaWYgKCBvcHRpb25zLmRlc2MgKSB7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcInRleHRhcmVhW25hbWU9ZGVzY11cIikudmFsKG9wdGlvbnMuZGVzYyk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuc2hyZCAhPSBudWxsICkge1xuICAgICAgICAgICAgJGJsb2NrLmZpbmQoXCJpbnB1dFtuYW1lPXNocmRdW3ZhbHVlPVwiICsgb3B0aW9ucy5zaHJkICsgJ10nKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgIH0gZWxzZSBpZiAoICEgSFQubG9naW5fc3RhdHVzLmxvZ2dlZF9pbiApIHtcbiAgICAgICAgICAgICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXVt2YWx1ZT0wXVwiKS5hdHRyKFwiY2hlY2tlZFwiLCBcImNoZWNrZWRcIik7XG4gICAgICAgICAgICAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaW5mb1wiPjxzdHJvbmc+VGhpcyBjb2xsZWN0aW9uIHdpbGwgYmUgdGVtcG9yYXJ5PC9zdHJvbmc+LiBMb2cgaW4gdG8gY3JlYXRlIHBlcm1hbmVudCBhbmQgcHVibGljIGNvbGxlY3Rpb25zLjwvZGl2PicpLmFwcGVuZFRvKCRibG9jayk7XG4gICAgICAgICAgICAvLyByZW1vdmUgdGhlIDxsYWJlbD4gdGhhdCB3cmFwcyB0aGUgcmFkaW8gYnV0dG9uXG4gICAgICAgICAgICAkYmxvY2suZmluZChcImlucHV0W25hbWU9c2hyZF1bdmFsdWU9MV1cIikucmVtb3ZlKCk7XG4gICAgICAgICAgICAkYmxvY2suZmluZChcImxhYmVsW2Zvcj0nZWRpdC1zaHJkLTEnXVwiKS5yZW1vdmUoKTtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggb3B0aW9ucy4kaGlkZGVuICkge1xuICAgICAgICAgICAgb3B0aW9ucy4kaGlkZGVuLmNsb25lKCkuYXBwZW5kVG8oJGJsb2NrKTtcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdjJyAvPlwiKS5hcHBlbmRUbygkYmxvY2spLnZhbChvcHRpb25zLmMpO1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2EnIC8+XCIpLmFwcGVuZFRvKCRibG9jaykudmFsKG9wdGlvbnMuYSk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIG9wdGlvbnMuaWlkICkge1xuICAgICAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J2lpZCcgLz5cIikuYXBwZW5kVG8oJGJsb2NrKS52YWwob3B0aW9ucy5paWQpO1xuICAgICAgICB9XG5cbiAgICAgICAgdmFyICRkaWFsb2cgPSBib290Ym94LmRpYWxvZygkYmxvY2ssIFtcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBcIkNhbmNlbFwiLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuLWRpc21pc3NcIlxuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBcImxhYmVsXCIgOiBvcHRpb25zLmxhYmVsLFxuICAgICAgICAgICAgICAgIFwiY2xhc3NcIiA6IFwiYnRuIGJ0bi1wcmltYXJ5IGJ0bi1kaXNtaXNzXCIsXG4gICAgICAgICAgICAgICAgY2FsbGJhY2sgOiBmdW5jdGlvbigpIHtcblxuICAgICAgICAgICAgICAgICAgICB2YXIgZm9ybSA9ICRibG9jay5nZXQoMCk7XG4gICAgICAgICAgICAgICAgICAgIGlmICggISBmb3JtLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGZvcm0ucmVwb3J0VmFsaWRpdHkoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiBmYWxzZTtcbiAgICAgICAgICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAgICAgICAgIHZhciBjbiA9ICQudHJpbSgkYmxvY2suZmluZChcImlucHV0W25hbWU9Y25dXCIpLnZhbCgpKTtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGRlc2MgPSAkLnRyaW0oJGJsb2NrLmZpbmQoXCJ0ZXh0YXJlYVtuYW1lPWRlc2NdXCIpLnZhbCgpKTtcblxuICAgICAgICAgICAgICAgICAgICBpZiAoICEgY24gKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAvLyAkKCc8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtZXJyb3JcIj5Zb3UgbXVzdCBlbnRlciBhIGNvbGxlY3Rpb24gbmFtZS48L2Rpdj4nKS5hcHBlbmRUbygkYmxvY2spO1xuICAgICAgICAgICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICAgICAgZGlzcGxheV9pbmZvKFwiU3VibWl0dGluZzsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgICAgICAgICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGEgOiAnYWRkaXRzbmMnLFxuICAgICAgICAgICAgICAgICAgICAgICAgY24gOiBjbixcbiAgICAgICAgICAgICAgICAgICAgICAgIGRlc2MgOiBkZXNjLFxuICAgICAgICAgICAgICAgICAgICAgICAgc2hyZCA6ICRibG9jay5maW5kKFwiaW5wdXRbbmFtZT1zaHJkXTpjaGVja2VkXCIpLnZhbCgpXG4gICAgICAgICAgICAgICAgICAgIH0pXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICBdKTtcblxuICAgICAgICAkZGlhbG9nLmZpbmQoXCJpbnB1dFt0eXBlPXRleHRdLHRleHRhcmVhXCIpLmVhY2goZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgJHRoaXMgPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyICRjb3VudCA9ICQoXCIjXCIgKyAkdGhpcy5hdHRyKCdpZCcpICsgXCItY291bnRcIik7XG4gICAgICAgICAgICB2YXIgbGltaXQgPSAkdGhpcy5hdHRyKFwibWF4bGVuZ3RoXCIpO1xuXG4gICAgICAgICAgICAkY291bnQudGV4dChsaW1pdCAtICR0aGlzLnZhbCgpLmxlbmd0aCk7XG5cbiAgICAgICAgICAgICR0aGlzLmJpbmQoJ2tleXVwJywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgJGNvdW50LnRleHQobGltaXQgLSAkdGhpcy52YWwoKS5sZW5ndGgpO1xuICAgICAgICAgICAgfSk7XG4gICAgICAgIH0pXG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc3VibWl0X3Bvc3QocGFyYW1zKSB7XG4gICAgICAgIHZhciBkYXRhID0gJC5leHRlbmQoe30sIHsgcGFnZSA6ICdhamF4JywgaWQgOiBIVC5wYXJhbXMuaWQgfSwgcGFyYW1zKTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IGdldF91cmwoKSxcbiAgICAgICAgICAgIGRhdGEgOiBkYXRhXG4gICAgICAgIH0pLmRvbmUoZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9IHBhcnNlX2xpbmUoZGF0YSk7XG4gICAgICAgICAgICBoaWRlX2luZm8oKTtcbiAgICAgICAgICAgIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fU1VDQ0VTUycgKSB7XG4gICAgICAgICAgICAgICAgLy8gZG8gc29tZXRoaW5nXG4gICAgICAgICAgICAgICAgYWRkX2l0ZW1fdG9fY29sbGlzdChwYXJhbXMpO1xuICAgICAgICAgICAgfSBlbHNlIGlmICggcGFyYW1zLnJlc3VsdCA9PSAnQUREX0lURU1fRkFJTFVSRScgKSB7XG4gICAgICAgICAgICAgICAgZGlzcGxheV9lcnJvcihcIkl0ZW0gY291bGQgbm90IGJlIGFkZGVkIGF0IHRoaXMgdGltZS5cIik7XG4gICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKGRhdGEpO1xuICAgICAgICAgICAgfVxuICAgICAgICB9KS5mYWlsKGZ1bmN0aW9uKGpxWEhSLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgY29uc29sZS5sb2codGV4dFN0YXR1cywgZXJyb3JUaHJvd24pO1xuICAgICAgICB9KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiBhZGRfaXRlbV90b19jb2xsaXN0KHBhcmFtcykge1xuICAgICAgICB2YXIgJHVsID0gJChcIi5jb2xsZWN0aW9uLW1lbWJlcnNoaXBcIik7XG4gICAgICAgIHZhciBjb2xsX2hyZWYgPSBnZXRfdXJsKCkgKyBcIj9hPWxpc3RpcztjPVwiICsgcGFyYW1zLmNvbGxfaWQ7XG4gICAgICAgIHZhciAkYSA9ICQoXCI8YT5cIikuYXR0cihcImhyZWZcIiwgY29sbF9ocmVmKS50ZXh0KHBhcmFtcy5jb2xsX25hbWUpO1xuICAgICAgICAkKFwiPGxpPjwvbGk+XCIpLmFwcGVuZFRvKCR1bCkuYXBwZW5kKCRhKTtcblxuICAgICAgICAkKFwiLmNvbGxlY3Rpb24tbWVtYmVyc2hpcC1zdW1tYXJ5XCIpLnRleHQoSU5fWU9VUl9DT0xMU19MQUJFTCk7XG5cbiAgICAgICAgLy8gYW5kIHRoZW4gZmlsdGVyIG91dCB0aGUgbGlzdCBmcm9tIHRoZSBzZWxlY3RcbiAgICAgICAgdmFyICRvcHRpb24gPSAkdG9vbGJhci5maW5kKFwib3B0aW9uW3ZhbHVlPSdcIiArIHBhcmFtcy5jb2xsX2lkICsgXCInXVwiKTtcbiAgICAgICAgJG9wdGlvbi5yZW1vdmUoKTtcblxuICAgICAgICBIVC51cGRhdGVfc3RhdHVzKGBBZGRlZCBpdGVtIHRvIGNvbGxlY3Rpb24gJHtwYXJhbXMuY29sbF9uYW1lfWApO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNvbmZpcm1fbGFyZ2UoY29sbFNpemUsIGFkZE51bUl0ZW1zLCBjYWxsYmFjaykge1xuXG4gICAgICAgIGlmICggY29sbFNpemUgPD0gMTAwMCAmJiBjb2xsU2l6ZSArIGFkZE51bUl0ZW1zID4gMTAwMCApIHtcbiAgICAgICAgICAgIHZhciBudW1TdHI7XG4gICAgICAgICAgICBpZiAoYWRkTnVtSXRlbXMgPiAxKSB7XG4gICAgICAgICAgICAgICAgbnVtU3RyID0gXCJ0aGVzZSBcIiArIGFkZE51bUl0ZW1zICsgXCIgaXRlbXNcIjtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIG51bVN0ciA9IFwidGhpcyBpdGVtXCI7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgbXNnID0gXCJOb3RlOiBZb3VyIGNvbGxlY3Rpb24gY29udGFpbnMgXCIgKyBjb2xsU2l6ZSArIFwiIGl0ZW1zLiAgQWRkaW5nIFwiICsgbnVtU3RyICsgXCIgdG8geW91ciBjb2xsZWN0aW9uIHdpbGwgaW5jcmVhc2UgaXRzIHNpemUgdG8gbW9yZSB0aGFuIDEwMDAgaXRlbXMuICBUaGlzIG1lYW5zIHlvdXIgY29sbGVjdGlvbiB3aWxsIG5vdCBiZSBzZWFyY2hhYmxlIHVudGlsIGl0IGlzIGluZGV4ZWQsIHVzdWFsbHkgd2l0aGluIDQ4IGhvdXJzLiAgQWZ0ZXIgdGhhdCwganVzdCBuZXdseSBhZGRlZCBpdGVtcyB3aWxsIHNlZSB0aGlzIGRlbGF5IGJlZm9yZSB0aGV5IGNhbiBiZSBzZWFyY2hlZC4gXFxuXFxuRG8geW91IHdhbnQgdG8gcHJvY2VlZD9cIlxuXG4gICAgICAgICAgICBjb25maXJtKG1zZywgZnVuY3Rpb24oYW5zd2VyKSB7XG4gICAgICAgICAgICAgICAgaWYgKCBhbnN3ZXIgKSB7XG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfSlcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIC8vIGFsbCBvdGhlciBjYXNlcyBhcmUgb2theVxuICAgICAgICAgICAgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICQoXCIjUFRhZGRJdGVtQnRuXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB2YXIgYWN0aW9uID0gJ2FkZEknXG5cbiAgICAgICAgaGlkZV9lcnJvcigpO1xuXG4gICAgICAgIHZhciBzZWxlY3RlZF9jb2xsZWN0aW9uX2lkID0gJHRvb2xiYXIuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgdmFyIHNlbGVjdGVkX2NvbGxlY3Rpb25fbmFtZSA9ICR0b29sYmFyLmZpbmQoXCJzZWxlY3Qgb3B0aW9uOnNlbGVjdGVkXCIpLnRleHQoKTtcblxuICAgICAgICBpZiAoICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBERUZBVUxUX0NPTExfTUVOVV9PUFRJT04gKSApIHtcbiAgICAgICAgICAgIGRpc3BsYXlfZXJyb3IoXCJZb3UgbXVzdCBzZWxlY3QgYSBjb2xsZWN0aW9uLlwiKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIGlmICggc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCA9PSBORVdfQ09MTF9NRU5VX09QVElPTiApIHtcbiAgICAgICAgICAgIC8vIGRlYWwgd2l0aCBuZXcgY29sbGVjdGlvblxuICAgICAgICAgICAgZWRpdF9jb2xsZWN0aW9uX21ldGFkYXRhKHtcbiAgICAgICAgICAgICAgICBjcmVhdGluZyA6IHRydWUsXG4gICAgICAgICAgICAgICAgYyA6IHNlbGVjdGVkX2NvbGxlY3Rpb25faWQsXG4gICAgICAgICAgICAgICAgaWQgOiBIVC5wYXJhbXMuaWQsXG4gICAgICAgICAgICAgICAgYSA6IGFjdGlvblxuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgIH1cblxuICAgICAgICAvLyB2YXIgYWRkX251bV9pdGVtcyA9IDE7XG4gICAgICAgIC8vIHZhciBDT0xMX1NJWkVfQVJSQVkgPSBnZXRDb2xsU2l6ZUFycmF5KCk7XG4gICAgICAgIC8vIHZhciBjb2xsX3NpemUgPSBDT0xMX1NJWkVfQVJSQVlbc2VsZWN0ZWRfY29sbGVjdGlvbl9pZF07XG4gICAgICAgIC8vIGNvbmZpcm1fbGFyZ2UoY29sbF9zaXplLCBhZGRfbnVtX2l0ZW1zLCBmdW5jdGlvbigpIHtcbiAgICAgICAgLy8gICAgICRmb3JtLnN1Ym1pdCgpO1xuICAgICAgICAvLyB9KVxuXG4gICAgICAgIGRpc3BsYXlfaW5mbyhcIkFkZGluZyBpdGVtIHRvIHlvdXIgY29sbGVjdGlvbjsgcGxlYXNlIHdhaXQuLi5cIik7XG4gICAgICAgIHN1Ym1pdF9wb3N0KHtcbiAgICAgICAgICAgIGMyIDogc2VsZWN0ZWRfY29sbGVjdGlvbl9pZCxcbiAgICAgICAgICAgIGEgIDogJ2FkZGl0cydcbiAgICAgICAgfSk7XG5cbiAgICB9KVxuXG59KTtcbiIsIi8vIGRvd25sb2FkZXJcblxudmFyIEhUID0gSFQgfHwge307XG5cbkhULkRvd25sb2FkZXIgPSB7XG5cbiAgICBpbml0OiBmdW5jdGlvbihvcHRpb25zKSB7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9ICQuZXh0ZW5kKHt9LCB0aGlzLm9wdGlvbnMsIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmlkID0gdGhpcy5vcHRpb25zLnBhcmFtcy5pZDtcbiAgICAgICAgdGhpcy5wZGYgPSB7fTtcbiAgICAgICAgcmV0dXJuIHRoaXM7XG4gICAgfSxcblxuICAgIG9wdGlvbnM6IHtcblxuICAgIH0sXG5cbiAgICBzdGFydCA6IGZ1bmN0aW9uKCkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHRoaXMuYmluZEV2ZW50cygpO1xuICAgIH0sXG5cbiAgICBiaW5kRXZlbnRzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkKFwiYVtkYXRhLXRvZ2dsZSo9ZG93bmxvYWRdXCIpLmFkZENsYXNzKFwiaW50ZXJhY3RpdmVcIikuY2xpY2soZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICAgICAgYm9vdGJveC5oaWRlQWxsKCk7XG4gICAgICAgICAgICBpZiAoICQodGhpcykuYXR0cihcInJlbFwiKSA9PSAnYWxsb3cnICkge1xuICAgICAgICAgICAgICAgIGlmICggc2VsZi5vcHRpb25zLnBhcmFtcy5kb3dubG9hZF9wcm9ncmVzc19iYXNlID09IG51bGwgKSB7XG4gICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBzZWxmLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBzZWxmLmV4cGxhaW5QZGZBY2Nlc3ModGhpcyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0pXG5cbiAgICB9LFxuXG4gICAgZXhwbGFpblBkZkFjY2VzczogZnVuY3Rpb24obGluaykge1xuICAgICAgICB2YXIgaHRtbCA9ICQoXCIjbm9Eb3dubG9hZEFjY2Vzc1wiKS5odG1sKCk7XG4gICAgICAgIGh0bWwgPSBodG1sLnJlcGxhY2UoJ3tET1dOTE9BRF9MSU5LfScsICQodGhpcykuYXR0cihcImhyZWZcIikpO1xuICAgICAgICB0aGlzLiRkaWFsb2cgPSBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICAvLyB0aGlzLiRkaWFsb2cuYWRkQ2xhc3MoXCJsb2dpblwiKTtcbiAgICB9LFxuXG4gICAgZG93bmxvYWRQZGY6IGZ1bmN0aW9uKGxpbmspIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLiRsaW5rID0gJChsaW5rKTtcbiAgICAgICAgc2VsZi5zcmMgPSAkKGxpbmspLmF0dHIoJ2hyZWYnKTtcbiAgICAgICAgc2VsZi5pdGVtX3RpdGxlID0gJChsaW5rKS5kYXRhKCd0aXRsZScpIHx8ICdQREYnO1xuXG4gICAgICAgIGlmICggc2VsZi4kbGluay5kYXRhKCdyYW5nZScpID09ICd5ZXMnICkge1xuICAgICAgICAgICAgaWYgKCAhIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG5cbiAgICAgICAgdmFyIGh0bWwgPVxuICAgICAgICAgICAgLy8gJzxwPkJ1aWxkaW5nIHlvdXIgUERGLi4uPC9wPicgK1xuICAgICAgICAgICAgYDxkaXYgY2xhc3M9XCJpbml0aWFsXCIgYXJpYS1saXZlPVwicG9saXRlXCI+PHA+U2V0dGluZyB1cCB0aGUgZG93bmxvYWQuLi48L2Rpdj5gICtcbiAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwicHJvZ3Jlc3MgcHJvZ3Jlc3Mtc3RyaXBlZCBhY3RpdmUgaGlkZVwiIGFyaWEtaGlkZGVuPVwidHJ1ZVwiPicgK1xuICAgICAgICAgICAgICAgICc8ZGl2IGNsYXNzPVwiYmFyXCIgd2lkdGg9XCIwJVwiPjwvZGl2PicgK1xuICAgICAgICAgICAgJzwvZGl2PicgK1xuICAgICAgICAgICAgLy8gJzxkaXYgY2xhc3M9XCJhbGVydCBhbGVydC1ibG9jayBhbGVydC1zdWNjZXNzIGRvbmUgaGlkZVwiPicgK1xuICAgICAgICAgICAgLy8gICAgICc8cD5BbGwgZG9uZSE8L3A+JyArXG4gICAgICAgICAgICAvLyAnPC9kaXY+JyArIFxuICAgICAgICAgICAgYDxkaXY+PHA+PGEgaHJlZj1cImh0dHBzOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL2hlbHBfZGlnaXRhbF9saWJyYXJ5I0Rvd25sb2FkXCIgdGFyZ2V0PVwiX2JsYW5rXCI+V2hhdCdzIHRoZSBkZWFsIHdpdGggZG93bmxvYWRzPzwvYT48L3A+PC9kaXY+YDtcblxuICAgICAgICB2YXIgaGVhZGVyID0gJ0J1aWxkaW5nIHlvdXIgJyArIHNlbGYuaXRlbV90aXRsZTtcbiAgICAgICAgdmFyIHRvdGFsID0gc2VsZi4kbGluay5kYXRhKCd0b3RhbCcpIHx8IDA7XG4gICAgICAgIGlmICggdG90YWwgPiAwICkge1xuICAgICAgICAgICAgdmFyIHN1ZmZpeCA9IHRvdGFsID09IDEgPyAncGFnZScgOiAncGFnZXMnO1xuICAgICAgICAgICAgaGVhZGVyICs9ICcgKCcgKyB0b3RhbCArICcgJyArIHN1ZmZpeCArICcpJztcbiAgICAgICAgfVxuXG4gICAgICAgIHNlbGYuJGRpYWxvZyA9IGJvb3Rib3guZGlhbG9nKFxuICAgICAgICAgICAgaHRtbCxcbiAgICAgICAgICAgIFtcbiAgICAgICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgICAgIGxhYmVsIDogJ0NhbmNlbCcsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLXgtZGlzbWlzcycsXG4gICAgICAgICAgICAgICAgICAgIGNhbGxiYWNrOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICggc2VsZi4kZGlhbG9nLmRhdGEoJ2RlYWN0aXZhdGVkJykgKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICAkLmFqYXgoe1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIHVybDogc2VsZi5zcmMgKyAnO2NhbGxiYWNrPUhULmRvd25sb2FkZXIuY2FuY2VsRG93bmxvYWQ7c3RvcD0xJyxcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICBkYXRhVHlwZTogJ3NjcmlwdCcsXG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgY2FjaGU6IGZhbHNlLFxuICAgICAgICAgICAgICAgICAgICAgICAgICAgIGVycm9yOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgQ0FOQ0VMTEVEIEVSUk9SXCIpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAvLyBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICBjb25zb2xlLmxvZyhyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDUwMyApIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheVdhcm5pbmcocmVxKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICBoZWFkZXI6IGhlYWRlcixcbiAgICAgICAgICAgICAgICBpZDogJ2Rvd25sb2FkJ1xuICAgICAgICAgICAgfVxuICAgICAgICApO1xuXG4gICAgICAgIC8vIEhULnVwZGF0ZV9zdGF0dXMoYEJ1aWxkaW5nIHlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9LmApO1xuXG4gICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG5cbiAgICB9LFxuXG4gICAgcmVxdWVzdERvd25sb2FkOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgZGF0YSA9IHt9O1xuICAgICAgICBpZiAoIHNlbGYuJGxpbmsuZGF0YSgnc2VxJykgKSB7XG4gICAgICAgICAgICBkYXRhWydzZXEnXSA9IHNlbGYuJGxpbmsuZGF0YSgnc2VxJyk7XG4gICAgICAgIH1cbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybDogc2VsZi5zcmMucmVwbGFjZSgvOy9nLCAnJicpICsgJyZjYWxsYmFjaz1IVC5kb3dubG9hZGVyLnN0YXJ0RG93bmxvYWRNb25pdG9yJyxcbiAgICAgICAgICAgIGRhdGFUeXBlOiAnc2NyaXB0JyxcbiAgICAgICAgICAgIGNhY2hlOiBmYWxzZSxcbiAgICAgICAgICAgIGRhdGE6IGRhdGEsXG4gICAgICAgICAgICBlcnJvcjogZnVuY3Rpb24ocmVxLCB0ZXh0U3RhdHVzLCBlcnJvclRocm93bikge1xuICAgICAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiRE9XTkxPQUQgU1RBUlRVUCBOT1QgREVURUNURURcIik7XG4gICAgICAgICAgICAgICAgaWYgKCBzZWxmLiRkaWFsb2cgKSB7IHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7IH1cbiAgICAgICAgICAgICAgICBpZiAoIHJlcS5zdGF0dXMgPT0gNTAzICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlXYXJuaW5nKHJlcSk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5RXJyb3IocmVxKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0sXG5cbiAgICBjYW5jZWxEb3dubG9hZDogZnVuY3Rpb24ocHJvZ3Jlc3NfdXJsLCBkb3dubG9hZF91cmwsIHRvdGFsKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgfSxcblxuICAgIHN0YXJ0RG93bmxvYWRNb25pdG9yOiBmdW5jdGlvbihwcm9ncmVzc191cmwsIGRvd25sb2FkX3VybCwgdG90YWwpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuXG4gICAgICAgIGlmICggc2VsZi50aW1lciApIHtcbiAgICAgICAgICAgIGNvbnNvbGUubG9nKFwiQUxSRUFEWSBQT0xMSU5HXCIpO1xuICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG5cbiAgICAgICAgc2VsZi5wZGYucHJvZ3Jlc3NfdXJsID0gcHJvZ3Jlc3NfdXJsO1xuICAgICAgICBzZWxmLnBkZi5kb3dubG9hZF91cmwgPSBkb3dubG9hZF91cmw7XG4gICAgICAgIHNlbGYucGRmLnRvdGFsID0gdG90YWw7XG5cbiAgICAgICAgc2VsZi5pc19ydW5uaW5nID0gdHJ1ZTtcbiAgICAgICAgc2VsZi5udW1fcHJvY2Vzc2VkID0gMDtcbiAgICAgICAgc2VsZi5pID0gMDtcblxuICAgICAgICBzZWxmLnRpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7IHNlbGYuY2hlY2tTdGF0dXMoKTsgfSwgMjUwMCk7XG4gICAgICAgIC8vIGRvIGl0IG9uY2UgdGhlIGZpcnN0IHRpbWVcbiAgICAgICAgc2VsZi5jaGVja1N0YXR1cygpO1xuXG4gICAgfSxcblxuICAgIGNoZWNrU3RhdHVzOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICBzZWxmLmkgKz0gMTtcbiAgICAgICAgJC5hamF4KHtcbiAgICAgICAgICAgIHVybCA6IHNlbGYucGRmLnByb2dyZXNzX3VybCxcbiAgICAgICAgICAgIGRhdGEgOiB7IHRzIDogKG5ldyBEYXRlKS5nZXRUaW1lKCkgfSxcbiAgICAgICAgICAgIGNhY2hlIDogZmFsc2UsXG4gICAgICAgICAgICBkYXRhVHlwZTogJ2pzb24nLFxuICAgICAgICAgICAgc3VjY2VzcyA6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICB2YXIgc3RhdHVzID0gc2VsZi51cGRhdGVQcm9ncmVzcyhkYXRhKTtcbiAgICAgICAgICAgICAgICBzZWxmLm51bV9wcm9jZXNzZWQgKz0gMTtcbiAgICAgICAgICAgICAgICBpZiAoIHN0YXR1cy5kb25lICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9IGVsc2UgaWYgKCBzdGF0dXMuZXJyb3IgJiYgc3RhdHVzLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi5kaXNwbGF5UHJvY2Vzc0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuY2xlYXJUaW1lcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmxvZ0Vycm9yKCk7XG4gICAgICAgICAgICAgICAgfSBlbHNlIGlmICggc3RhdHVzLmVycm9yICkge1xuICAgICAgICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuY2xvc2VNb2RhbCgpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmRpc3BsYXlFcnJvcigpO1xuICAgICAgICAgICAgICAgICAgICBzZWxmLmNsZWFyVGltZXIoKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgZXJyb3IgOiBmdW5jdGlvbihyZXEsIHRleHRTdGF0dXMsIGVycm9yVGhyb3duKSB7XG4gICAgICAgICAgICAgICAgY29uc29sZS5sb2coXCJGQUlMRUQ6IFwiLCByZXEsIFwiL1wiLCB0ZXh0U3RhdHVzLCBcIi9cIiwgZXJyb3JUaHJvd24pO1xuICAgICAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5jbG9zZU1vZGFsKCk7XG4gICAgICAgICAgICAgICAgc2VsZi5jbGVhclRpbWVyKCk7XG4gICAgICAgICAgICAgICAgaWYgKCByZXEuc3RhdHVzID09IDQwNCAmJiAoc2VsZi5pID4gMjUgfHwgc2VsZi5udW1fcHJvY2Vzc2VkID4gMCkgKSB7XG4gICAgICAgICAgICAgICAgICAgIHNlbGYuZGlzcGxheUVycm9yKCk7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICB9KVxuICAgIH0sXG5cbiAgICB1cGRhdGVQcm9ncmVzczogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICB2YXIgc2VsZiA9IHRoaXM7XG4gICAgICAgIHZhciBzdGF0dXMgPSB7IGRvbmUgOiBmYWxzZSwgZXJyb3IgOiBmYWxzZSB9O1xuICAgICAgICB2YXIgcGVyY2VudDtcblxuICAgICAgICB2YXIgY3VycmVudCA9IGRhdGEuc3RhdHVzO1xuICAgICAgICBpZiAoIGN1cnJlbnQgPT0gJ0VPVCcgfHwgY3VycmVudCA9PSAnRE9ORScgKSB7XG4gICAgICAgICAgICBzdGF0dXMuZG9uZSA9IHRydWU7XG4gICAgICAgICAgICBwZXJjZW50ID0gMTAwO1xuICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgY3VycmVudCA9IGRhdGEuY3VycmVudF9wYWdlO1xuICAgICAgICAgICAgcGVyY2VudCA9IDEwMCAqICggY3VycmVudCAvIHNlbGYucGRmLnRvdGFsICk7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYubGFzdF9wZXJjZW50ICE9IHBlcmNlbnQgKSB7XG4gICAgICAgICAgICBzZWxmLmxhc3RfcGVyY2VudCA9IHBlcmNlbnQ7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyA9IDA7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICBzZWxmLm51bV9hdHRlbXB0cyArPSAxO1xuICAgICAgICB9XG5cbiAgICAgICAgLy8gdHJ5IDEwMCB0aW1lcywgd2hpY2ggYW1vdW50cyB0byB+MTAwIHNlY29uZHNcbiAgICAgICAgaWYgKCBzZWxmLm51bV9hdHRlbXB0cyA+IDEwMCApIHtcbiAgICAgICAgICAgIHN0YXR1cy5lcnJvciA9IHRydWU7XG4gICAgICAgIH1cblxuICAgICAgICBpZiAoIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaXMoXCI6dmlzaWJsZVwiKSApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+UGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0uLi48L3A+YCk7XG4gICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5wcm9ncmVzc1wiKS5yZW1vdmVDbGFzcyhcImhpZGVcIik7XG4gICAgICAgIH1cblxuICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIi5iYXJcIikuY3NzKHsgd2lkdGggOiBwZXJjZW50ICsgJyUnfSk7XG5cbiAgICAgICAgaWYgKCBwZXJjZW50ID09IDEwMCApIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLnByb2dyZXNzXCIpLmhpZGUoKTtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikuaHRtbChgPHA+QWxsIGRvbmUhIFlvdXIgJHtzZWxmLml0ZW1fdGl0bGV9IGlzIHJlYWR5IGZvciBkb3dubG9hZC4gPHNwYW4gY2xzYXM9XCJvZmZzY3JlZW5cIj5QcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuPC9zcGFuPjwvcD5gKTtcbiAgICAgICAgICAgIC8vIHNlbGYuJGRpYWxvZy5maW5kKFwiLmRvbmVcIikuc2hvdygpO1xuICAgICAgICAgICAgdmFyICRkb3dubG9hZF9idG4gPSBzZWxmLiRkaWFsb2cuZmluZCgnLmRvd25sb2FkLXBkZicpO1xuICAgICAgICAgICAgaWYgKCAhICRkb3dubG9hZF9idG4ubGVuZ3RoICkge1xuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4gPSAkKCc8YSBjbGFzcz1cImRvd25sb2FkLXBkZiBidG4gYnRuLXByaW1hcnlcIj5Eb3dubG9hZCB7SVRFTV9USVRMRX08L2E+Jy5yZXBsYWNlKCd7SVRFTV9USVRMRX0nLCBzZWxmLml0ZW1fdGl0bGUpKS5hdHRyKCdocmVmJywgc2VsZi5wZGYuZG93bmxvYWRfdXJsKTtcbiAgICAgICAgICAgICAgICAkZG93bmxvYWRfYnRuLmFwcGVuZFRvKHNlbGYuJGRpYWxvZy5maW5kKFwiLm1vZGFsX19mb290ZXJcIikpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgICAgICAgICAgICAgc2VsZi4kbGluay50cmlnZ2VyKFwiY2xpY2suZ29vZ2xlXCIpO1xuICAgICAgICAgICAgICAgICAgICBzZXRUaW1lb3V0KGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VsZi4kZGlhbG9nLmNsb3NlTW9kYWwoKTtcbiAgICAgICAgICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4ucmVtb3ZlKCk7XG4gICAgICAgICAgICAgICAgICAgICAgICBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9jbGVhclNlbGVjdGlvbigpO1xuICAgICAgICAgICAgICAgICAgICAgICAgLy8gSFQucmVhZGVyLmVtaXQoJ2Rvd25sb2FkRG9uZScpO1xuICAgICAgICAgICAgICAgICAgICB9LCAxNTAwKTtcbiAgICAgICAgICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgICAgICB9KVxuICAgICAgICAgICAgICAgICRkb3dubG9hZF9idG4uZm9jdXMoKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5kYXRhKCdkZWFjdGl2YXRlZCcsIHRydWUpO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgWW91ciAke3NlbGYuaXRlbV90aXRsZX0gaXMgcmVhZHkgZm9yIGRvd25sb2FkLiBQcmVzcyByZXR1cm4gdG8gZG93bmxvYWQuYCk7XG4gICAgICAgICAgICAvLyBzdGlsbCBjb3VsZCBjYW5jZWxcbiAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIHNlbGYuJGRpYWxvZy5maW5kKFwiLmluaXRpYWxcIikudGV4dChgUGxlYXNlIHdhaXQgd2hpbGUgd2UgYnVpbGQgeW91ciAke3NlbGYuaXRlbV90aXRsZX0gKCR7TWF0aC5jZWlsKHBlcmNlbnQpfSUgY29tcGxldGVkKS4uLmApO1xuICAgICAgICAgICAgLy8gSFQudXBkYXRlX3N0YXR1cyhgJHtNYXRoLmNlaWwocGVyY2VudCl9JSBvZiB0aGUgJHtzZWxmLml0ZW1fdGl0bGV9IGhhcyBiZWVuIGJ1aWx0LmApO1xuICAgICAgICB9XG5cbiAgICAgICAgcmV0dXJuIHN0YXR1cztcbiAgICB9LFxuXG4gICAgY2xlYXJUaW1lcjogZnVuY3Rpb24oKSB7XG4gICAgICAgIHZhciBzZWxmID0gdGhpcztcbiAgICAgICAgaWYgKCBzZWxmLnRpbWVyICkge1xuICAgICAgICAgICAgY2xlYXJJbnRlcnZhbChzZWxmLnRpbWVyKTtcbiAgICAgICAgICAgIHNlbGYudGltZXIgPSBudWxsO1xuICAgICAgICB9XG4gICAgfSxcblxuICAgIGRpc3BsYXlXYXJuaW5nOiBmdW5jdGlvbihyZXEpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICB2YXIgdGltZW91dCA9IHBhcnNlSW50KHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1VbnRpbEVwb2NoJykpO1xuICAgICAgICB2YXIgcmF0ZSA9IHJlcS5nZXRSZXNwb25zZUhlYWRlcignWC1DaG9rZS1SYXRlJylcblxuICAgICAgICBpZiAoIHRpbWVvdXQgPD0gNSApIHtcbiAgICAgICAgICAgIC8vIGp1c3QgcHVudCBhbmQgd2FpdCBpdCBvdXRcbiAgICAgICAgICAgIHNldFRpbWVvdXQoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIHNlbGYucmVxdWVzdERvd25sb2FkKCk7XG4gICAgICAgICAgICB9LCA1MDAwKTtcbiAgICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuXG4gICAgICAgIHRpbWVvdXQgKj0gMTAwMDtcbiAgICAgICAgdmFyIG5vdyA9IChuZXcgRGF0ZSkuZ2V0VGltZSgpO1xuICAgICAgICB2YXIgY291bnRkb3duID0gKCBNYXRoLmNlaWwoKHRpbWVvdXQgLSBub3cpIC8gMTAwMCkgKVxuXG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAoJzxkaXY+JyArXG4gICAgICAgICAgICAnPHA+WW91IGhhdmUgZXhjZWVkZWQgdGhlIGRvd25sb2FkIHJhdGUgb2Yge3JhdGV9LiBZb3UgbWF5IHByb2NlZWQgaW4gPHNwYW4gaWQ9XCJ0aHJvdHRsZS10aW1lb3V0XCI+e2NvdW50ZG93bn08L3NwYW4+IHNlY29uZHMuPC9wPicgK1xuICAgICAgICAgICAgJzxwPkRvd25sb2FkIGxpbWl0cyBwcm90ZWN0IEhhdGhpVHJ1c3QgcmVzb3VyY2VzIGZyb20gYWJ1c2UgYW5kIGhlbHAgZW5zdXJlIGEgY29uc2lzdGVudCBleHBlcmllbmNlIGZvciBldmVyeW9uZS48L3A+JyArXG4gICAgICAgICAgJzwvZGl2PicpLnJlcGxhY2UoJ3tyYXRlfScsIHJhdGUpLnJlcGxhY2UoJ3tjb3VudGRvd259JywgY291bnRkb3duKTtcblxuICAgICAgICBzZWxmLiRkaWFsb2cgPSBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLXByaW1hcnknLFxuICAgICAgICAgICAgICAgICAgICBjYWxsYmFjazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXVxuICAgICAgICApO1xuXG4gICAgICAgIHNlbGYuY291bnRkb3duX3RpbWVyID0gc2V0SW50ZXJ2YWwoZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgIGNvdW50ZG93biAtPSAxO1xuICAgICAgICAgICAgICBzZWxmLiRkaWFsb2cuZmluZChcIiN0aHJvdHRsZS10aW1lb3V0XCIpLnRleHQoY291bnRkb3duKTtcbiAgICAgICAgICAgICAgaWYgKCBjb3VudGRvd24gPT0gMCApIHtcbiAgICAgICAgICAgICAgICBjbGVhckludGVydmFsKHNlbGYuY291bnRkb3duX3RpbWVyKTtcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBjb25zb2xlLmxvZyhcIlRJQyBUT0NcIiwgY291bnRkb3duKTtcbiAgICAgICAgfSwgMTAwMCk7XG5cbiAgICB9LFxuXG4gICAgZGlzcGxheVByb2Nlc3NFcnJvcjogZnVuY3Rpb24ocmVxKSB7XG4gICAgICAgIHZhciBodG1sID1cbiAgICAgICAgICAgICc8cD4nICsgXG4gICAgICAgICAgICAgICAgJ1VuZm9ydHVuYXRlbHksIHRoZSBwcm9jZXNzIGZvciBjcmVhdGluZyB5b3VyIFBERiBoYXMgYmVlbiBpbnRlcnJ1cHRlZC4gJyArIFxuICAgICAgICAgICAgICAgICdQbGVhc2UgY2xpY2sgXCJPS1wiIGFuZCB0cnkgYWdhaW4uJyArIFxuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnSWYgdGhpcyBwcm9ibGVtIHBlcnNpc3RzIGFuZCB5b3UgYXJlIHVuYWJsZSB0byBkb3dubG9hZCB0aGlzIFBERiBhZnRlciByZXBlYXRlZCBhdHRlbXB0cywgJyArIFxuICAgICAgICAgICAgICAgICdwbGVhc2Ugbm90aWZ5IHVzIGF0IDxhIGhyZWY9XCIvY2dpL2ZlZWRiYWNrLz9wYWdlPWZvcm1cIiBkYXRhPW09XCJwdFwiIGRhdGEtdG9nZ2xlPVwiZmVlZGJhY2sgdHJhY2tpbmctYWN0aW9uXCIgZGF0YS10cmFja2luZy1hY3Rpb249XCJTaG93IEZlZWRiYWNrXCI+ZmVlZGJhY2tAaXNzdWVzLmhhdGhpdHJ1c3Qub3JnPC9hPiAnICtcbiAgICAgICAgICAgICAgICAnYW5kIGluY2x1ZGUgdGhlIFVSTCBvZiB0aGUgYm9vayB5b3Ugd2VyZSB0cnlpbmcgdG8gYWNjZXNzIHdoZW4gdGhlIHByb2JsZW0gb2NjdXJyZWQuJyArXG4gICAgICAgICAgICAnPC9wPic7XG5cbiAgICAgICAgLy8gYm9vdGJveC5hbGVydChodG1sKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coXG4gICAgICAgICAgICBodG1sLFxuICAgICAgICAgICAgW1xuICAgICAgICAgICAgICAgIHtcbiAgICAgICAgICAgICAgICAgICAgbGFiZWwgOiAnT0snLFxuICAgICAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzIGJ0bi1pbnZlcnNlJ1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIF0sXG4gICAgICAgICAgICB7IGNsYXNzZXMgOiAnZXJyb3InIH1cbiAgICAgICAgKTtcblxuICAgICAgICBjb25zb2xlLmxvZyhyZXEpO1xuICAgIH0sXG5cbiAgICBkaXNwbGF5RXJyb3I6IGZ1bmN0aW9uKHJlcSkge1xuICAgICAgICB2YXIgaHRtbCA9XG4gICAgICAgICAgICAnPHA+JyArXG4gICAgICAgICAgICAgICAgJ1RoZXJlIHdhcyBhIHByb2JsZW0gYnVpbGRpbmcgeW91ciAnICsgdGhpcy5pdGVtX3RpdGxlICsgJzsgc3RhZmYgaGF2ZSBiZWVuIG5vdGlmaWVkLicgK1xuICAgICAgICAgICAgJzwvcD4nICtcbiAgICAgICAgICAgICc8cD4nICtcbiAgICAgICAgICAgICAgICAnUGxlYXNlIHRyeSBhZ2FpbiBpbiAyNCBob3Vycy4nICtcbiAgICAgICAgICAgICc8L3A+JztcblxuICAgICAgICAvLyBib290Ym94LmFsZXJ0KGh0bWwpO1xuICAgICAgICBib290Ym94LmRpYWxvZyhcbiAgICAgICAgICAgIGh0bWwsXG4gICAgICAgICAgICBbXG4gICAgICAgICAgICAgICAge1xuICAgICAgICAgICAgICAgICAgICBsYWJlbCA6ICdPSycsXG4gICAgICAgICAgICAgICAgICAgICdjbGFzcycgOiAnYnRuLWRpc21pc3MgYnRuLWludmVyc2UnXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgXSxcbiAgICAgICAgICAgIHsgY2xhc3NlcyA6ICdlcnJvcicgfVxuICAgICAgICApO1xuXG4gICAgICAgIGNvbnNvbGUubG9nKHJlcSk7XG4gICAgfSxcblxuICAgIGxvZ0Vycm9yOiBmdW5jdGlvbigpIHtcbiAgICAgICAgdmFyIHNlbGYgPSB0aGlzO1xuICAgICAgICAkLmdldChzZWxmLnNyYyArICc7bnVtX2F0dGVtcHRzPScgKyBzZWxmLm51bV9hdHRlbXB0cyk7XG4gICAgfSxcblxuXG4gICAgRU9UOiB0cnVlXG5cbn1cblxuaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcbiAgICBIVC5kb3dubG9hZGVyID0gT2JqZWN0LmNyZWF0ZShIVC5Eb3dubG9hZGVyKS5pbml0KHtcbiAgICAgICAgcGFyYW1zIDogSFQucGFyYW1zXG4gICAgfSlcblxuICAgIEhULmRvd25sb2FkZXIuc3RhcnQoKTtcblxuICAgIC8vIGFuZCBkbyB0aGlzIGhlcmVcbiAgICAkKFwiI3NlbGVjdGVkUGFnZXNQZGZMaW5rXCIpLm9uKCdjbGljaycsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuXG4gICAgICAgIHZhciBwcmludGFibGUgPSBIVC5yZWFkZXIuY29udHJvbHMuc2VsZWN0aW5hdG9yLl9nZXRQYWdlU2VsZWN0aW9uKCk7XG5cbiAgICAgICAgaWYgKCBwcmludGFibGUubGVuZ3RoID09IDAgKSB7XG4gICAgICAgICAgICB2YXIgYnV0dG9ucyA9IFtdO1xuXG4gICAgICAgICAgICB2YXIgbXNnID0gWyBcIjxwPllvdSBoYXZlbid0IHNlbGVjdGVkIGFueSBwYWdlcyB0byBwcmludC48L3A+XCIgXTtcbiAgICAgICAgICAgIGlmICggSFQucmVhZGVyLnZpZXcubmFtZSA9PSAnMnVwJyApIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIGxlZnQgb3IgcmlnaHQgY29ybmVyIG9mIHRoZSBwYWdlLlwiKTtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwIGNsYXNzPVxcXCJjZW50ZXJlZFxcXCI+PGltZyBzcmM9XFxcIi9wdC93ZWIvZ3JhcGhpY3Mvdmlldy1mbGlwLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgICBtc2cucHVzaChcIjxwPlRvIHNlbGVjdCBwYWdlcywgY2xpY2sgaW4gdGhlIHVwcGVyIHJpZ2h0IGNvcm5lciBvZiB0aGUgcGFnZS5cIik7XG4gICAgICAgICAgICAgICAgaWYgKCBIVC5yZWFkZXIudmlldy5uYW1lID09ICd0aHVtYicgKSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXRodW1iLmdpZlxcXCIgLz48L3A+XCIpO1xuICAgICAgICAgICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAgICAgICAgIG1zZy5wdXNoKFwiPHAgY2xhc3M9XFxcImNlbnRlcmVkXFxcIj48aW1nIHNyYz1cXFwiL3B0L3dlYi9ncmFwaGljcy92aWV3LXNjcm9sbC5naWZcXFwiIC8+PC9wPlwiKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBtc2cucHVzaChcIjxwPjx0dD5zaGlmdCArIGNsaWNrPC90dD4gdG8gZGUvc2VsZWN0IHRoZSBwYWdlcyBiZXR3ZWVuIHRoaXMgcGFnZSBhbmQgYSBwcmV2aW91c2x5IHNlbGVjdGVkIHBhZ2UuXCIpO1xuICAgICAgICAgICAgbXNnLnB1c2goXCI8cD5QYWdlcyB5b3Ugc2VsZWN0IHdpbGwgYXBwZWFyIGluIHRoZSBzZWxlY3Rpb24gY29udGVudHMgPGJ1dHRvbiBzdHlsZT1cXFwiYmFja2dyb3VuZC1jb2xvcjogIzY2NjsgYm9yZGVyLWNvbG9yOiAjZWVlXFxcIiBjbGFzcz1cXFwiYnRuIHNxdWFyZVxcXCI+PGkgY2xhc3M9XFxcImljb21vb24gaWNvbW9vbi1hdHRhY2htZW50XFxcIiBzdHlsZT1cXFwiY29sb3I6IHdoaXRlOyBmb250LXNpemU6IDE0cHg7XFxcIiAvPjwvYnV0dG9uPlwiKTtcblxuICAgICAgICAgICAgbXNnID0gbXNnLmpvaW4oXCJcXG5cIik7XG5cbiAgICAgICAgICAgIGJ1dHRvbnMucHVzaCh7XG4gICAgICAgICAgICAgICAgbGFiZWw6IFwiT0tcIixcbiAgICAgICAgICAgICAgICAnY2xhc3MnIDogJ2J0bi1kaXNtaXNzJ1xuICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICBib290Ym94LmRpYWxvZyhtc2csIGJ1dHRvbnMpO1xuICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICB9XG5cblxuICAgICAgICB2YXIgc2VxID0gSFQucmVhZGVyLmNvbnRyb2xzLnNlbGVjdGluYXRvci5fZ2V0RmxhdHRlbmVkU2VsZWN0aW9uKHByaW50YWJsZSk7XG5cbiAgICAgICAgJCh0aGlzKS5kYXRhKCdzZXEnLCBzZXEpO1xuICAgICAgICBIVC5kb3dubG9hZGVyLmRvd25sb2FkUGRmKHRoaXMpO1xuICAgIH0pO1xuXG59KTtcblxuIiwiLy8gc3VwcGx5IG1ldGhvZCBmb3IgY3JlYXRpbmcgYW4gZW1iZWRkYWJsZSBVUkxcbmhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICB2YXIgc2lkZV9zaG9ydCA9IFwiNDUwXCI7XG4gICAgdmFyIHNpZGVfbG9uZyAgPSBcIjcwMFwiO1xuICAgIHZhciBodElkID0gSFQucGFyYW1zLmlkO1xuICAgIHZhciBlbWJlZEhlbHBMaW5rID0gXCJodHRwczovL3d3dy5oYXRoaXRydXN0Lm9yZy9lbWJlZFwiO1xuXG4gICAgdmFyIGNvZGVibG9ja190eHRfYSA9IGZ1bmN0aW9uKHcsaCkge3JldHVybiAnPGlmcmFtZSB3aWR0aD1cIicgKyB3ICsgJ1wiIGhlaWdodD1cIicgKyBoICsgJ1wiICc7fVxuICAgIHZhciBjb2RlYmxvY2tfdHh0X2IgPSAnc3JjPVwiaHR0cHM6Ly9oZGwuaGFuZGxlLm5ldC8yMDI3LycgKyBodElkICsgJz91cmxhcHBlbmQ9JTNCdWk9ZW1iZWRcIj48L2lmcmFtZT4nO1xuXG4gICAgdmFyICRibG9jayA9ICQoXG4gICAgJzxkaXYgY2xhc3M9XCJlbWJlZFVybENvbnRhaW5lclwiPicgK1xuICAgICAgICAnPGgzPkVtYmVkIFRoaXMgQm9vaycgK1xuICAgICc8YSBpZD1cImVtYmVkSGVscEljb25cIiBkZWZhdWx0LWZvcm09XCJkYXRhLWRlZmF1bHQtZm9ybVwiICcgK1xuICAgICAgJ2hyZWY9XCInICsgZW1iZWRIZWxwTGluayArICdcIiB0YXJnZXQ9XCJfYmxhbmtcIj5IZWxwPC9hPjwvaDM+JyArXG4gICAgICAgICc8Zm9ybT4nICsgXG4gICAgICAgICcgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCI+Q29weSB0aGUgY29kZSBiZWxvdyBhbmQgcGFzdGUgaXQgaW50byB0aGUgSFRNTCBvZiBhbnkgd2Vic2l0ZSBvciBibG9nLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8bGFiZWwgZm9yPVwiY29kZWJsb2NrXCIgY2xhc3M9XCJvZmZzY3JlZW5cIj5Db2RlIEJsb2NrPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICA8dGV4dGFyZWEgY2xhc3M9XCJpbnB1dC14bGFyZ2VcIiBpZD1cImNvZGVibG9ja1wiIG5hbWU9XCJjb2RlYmxvY2tcIiByb3dzPVwiM1wiPicgK1xuICAgICAgICBjb2RlYmxvY2tfdHh0X2Eoc2lkZV9zaG9ydCwgc2lkZV9sb25nKSArIGNvZGVibG9ja190eHRfYiArICc8L3RleHRhcmVhPicgKyBcbiAgICAgICAgJzxkaXYgY2xhc3M9XCJjb250cm9sc1wiPicgKyBcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LXNjcm9sbFwiIHZhbHVlPVwiMFwiIGNoZWNrZWQ9XCJjaGVja2VkXCIgPicgK1xuICAgICAgICAnPHNwYW4gY2xhc3M9XCJpY29tb29uIGljb21vb24tc2Nyb2xsXCIvPiBTY3JvbGwgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgKyBcbiAgICAgICAgICAgICc8bGFiZWwgY2xhc3M9XCJyYWRpbyBpbmxpbmVcIj4nICtcbiAgICAgICAgICAgICAgICAnPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJ2aWV3XCIgaWQ9XCJ2aWV3LWZsaXBcIiB2YWx1ZT1cIjFcIiA+JyArXG4gICAgICAgICc8c3BhbiBjbGFzcz1cImljb21vb24gaWNvbW9vbi1ib29rLWFsdDJcIi8+IEZsaXAgVmlldyAnICtcbiAgICAgICAgICAgICc8L2xhYmVsPicgK1xuICAgICAgICAnPC9kaXY+JyArXG4gICAgICAgICc8L2Zvcm0+JyArXG4gICAgJzwvZGl2PidcbiAgICApO1xuXG5cbiAgICAkKFwiI2VtYmVkSHRtbFwiKS5jbGljayhmdW5jdGlvbihlKSB7XG4gICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgYm9vdGJveC5kaWFsb2coJGJsb2NrLCBbXG4gICAgICAgICAgICB7XG4gICAgICAgICAgICAgICAgXCJsYWJlbFwiIDogXCJDYW5jZWxcIixcbiAgICAgICAgICAgICAgICBcImNsYXNzXCIgOiBcImJ0bi1kaXNtaXNzXCJcbiAgICAgICAgICAgIH1cbiAgICBdKTtcblxuICAgICAgICAvLyBDdXN0b20gd2lkdGggZm9yIGJvdW5kaW5nICcubW9kYWwnIFxuICAgICAgICAkYmxvY2suY2xvc2VzdCgnLm1vZGFsJykuYWRkQ2xhc3MoXCJib290Ym94TWVkaXVtV2lkdGhcIik7XG5cbiAgICAgICAgLy8gU2VsZWN0IGVudGlyZXR5IG9mIGNvZGVibG9jayBmb3IgZWFzeSBjb3B5aW5nXG4gICAgICAgIHZhciB0ZXh0YXJlYSA9ICRibG9jay5maW5kKFwidGV4dGFyZWFbbmFtZT1jb2RlYmxvY2tdXCIpO1xuICAgIHRleHRhcmVhLm9uKFwiY2xpY2tcIiwgZnVuY3Rpb24gKCkge1xuICAgICAgICAkKHRoaXMpLnNlbGVjdCgpO1xuICAgIH0pO1xuXG4gICAgICAgIC8vIE1vZGlmeSBjb2RlYmxvY2sgdG8gb25lIG9mIHR3byB2aWV3cyBcbiAgICAgICAgJCgnaW5wdXQ6cmFkaW9baWQ9XCJ2aWV3LXNjcm9sbFwiXScpLmNsaWNrKGZ1bmN0aW9uICgpIHtcbiAgICAgICAgY29kZWJsb2NrX3R4dCA9IGNvZGVibG9ja190eHRfYShzaWRlX3Nob3J0LCBzaWRlX2xvbmcpICsgY29kZWJsb2NrX3R4dF9iOyBcbiAgICAgICAgICAgIHRleHRhcmVhLnZhbChjb2RlYmxvY2tfdHh0KTtcbiAgICAgICAgfSk7XG4gICAgICAgICQoJ2lucHV0OnJhZGlvW2lkPVwidmlldy1mbGlwXCJdJykuY2xpY2soZnVuY3Rpb24gKCkge1xuICAgICAgICBjb2RlYmxvY2tfdHh0ID0gY29kZWJsb2NrX3R4dF9hKHNpZGVfbG9uZywgc2lkZV9zaG9ydCkgKyBjb2RlYmxvY2tfdHh0X2I7IFxuICAgICAgICAgICAgdGV4dGFyZWEudmFsKGNvZGVibG9ja190eHQpO1xuICAgICAgICB9KTtcbiAgICB9KTtcbn0pO1xuXG4iLCIvLyBzdXBwbHkgbWV0aG9kIGZvciBmZWVkYmFjayBzeXN0ZW1cbnZhciBIVCA9IEhUIHx8IHt9O1xuSFQuZmVlZGJhY2sgPSB7fTtcbkhULmZlZWRiYWNrLmRpYWxvZyA9IGZ1bmN0aW9uKCkge1xuICAgIHZhciBodG1sID1cbiAgICAgICAgJzxmb3JtPicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5FbWFpbCBBZGRyZXNzPC9sZWdlbmQ+JyArXG4gICAgICAgICcgICAgICAgIDxsYWJlbCBmb3I9XCJlbWFpbFwiIGNsYXNzPVwib2Zmc2NyZWVuXCI+RU1haWwgQWRkcmVzczwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQteGxhcmdlXCIgcGxhY2Vob2xkZXI9XCJbWW91ciBlbWFpbCBhZGRyZXNzXVwiIG5hbWU9XCJlbWFpbFwiIGlkPVwiZW1haWxcIiAvPicgK1xuICAgICAgICAnICAgICAgICA8c3BhbiBjbGFzcz1cImhlbHAtYmxvY2tcIj5XZSB3aWxsIG1ha2UgZXZlcnkgZWZmb3J0IHRvIGFkZHJlc3MgY29weXJpZ2h0IGlzc3VlcyBieSB0aGUgbmV4dCBidXNpbmVzcyBkYXkgYWZ0ZXIgbm90aWZpY2F0aW9uLjwvc3Bhbj4nICtcbiAgICAgICAgJyAgICA8L2ZpZWxkc2V0PicgK1xuICAgICAgICAnICAgIDxmaWVsZHNldD4nICtcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdmVyYWxsIHBhZ2UgcmVhZGFiaWxpdHkgYW5kIHF1YWxpdHk8L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3Qgb25lIG9wdGlvbiB0aGF0IGFwcGxpZXM8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS0xXCIgdmFsdWU9XCJyZWFkYWJsZVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLXF1YWxpdHlcIiA+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgRmV3IHByb2JsZW1zLCBlbnRpcmUgcGFnZSBpcyByZWFkYWJsZScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiBpZD1cInB0LWZlZWRiYWNrLXF1YWxpdHktMlwiIHZhbHVlPVwic29tZXByb2JsZW1zXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgU29tZSBwcm9ibGVtcywgYnV0IHN0aWxsIHJlYWRhYmxlJyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwicmFkaW9cIiBuYW1lPVwiUXVhbGl0eVwiIHZhbHVlPVwiZGlmZmljdWx0XCIgaWQ9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1xdWFsaXR5LTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBTaWduaWZpY2FudCBwcm9ibGVtcywgZGlmZmljdWx0IG9yIGltcG9zc2libGUgdG8gcmVhZCcgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlF1YWxpdHlcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cInJhZGlvXCIgZm9yPVwicHQtZmVlZGJhY2stcXVhbGl0eS00XCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgKE5vIHByb2JsZW1zKScgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgPC9maWVsZHNldD4nICtcbiAgICAgICAgJyAgICA8ZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgICAgIDxsZWdlbmQ+U3BlY2lmaWMgcGFnZSBpbWFnZSBwcm9ibGVtcz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImFsZXJ0IGFsZXJ0LWhlbHBcIj5TZWxlY3QgYW55IHRoYXQgYXBwbHk8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiYmx1cnJ5XCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0xXCIgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCIgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMVwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIE1pc3NpbmcgcGFydHMgb2YgdGhlIHBhZ2UnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJjaGVja2JveFwiIG5hbWU9XCJibHVycnlcIiB2YWx1ZT1cIjFcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTJcIiAgLz4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxsYWJlbCBjbGFzcz1cImNoZWNrYm94XCIgZm9yPVwicHQtZmVlZGJhY2stcHJvYmxlbXMtMlwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIEJsdXJyeSB0ZXh0JyArXG4gICAgICAgICcgICAgICAgICAgICA8L2xhYmVsPicgK1xuICAgICAgICAnICAgICAgICA8L2Rpdj4nICtcbiAgICAgICAgJyAgICAgICAgPGRpdiBjbGFzcz1cImNvbnRyb2xcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDxpbnB1dCB0eXBlPVwiY2hlY2tib3hcIiBuYW1lPVwiY3VydmVkXCIgdmFsdWU9XCIxXCIgaWQ9XCJwdC1mZWVkYmFjay1wcm9ibGVtcy0zXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJjaGVja2JveFwiIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLTNcIj4nICtcbiAgICAgICAgJyAgICAgICAgICAgICAgICBDdXJ2ZWQgb3IgZGlzdG9ydGVkIHRleHQnICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGZvcj1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCI+T3RoZXIgcHJvYmxlbSA8L2xhYmVsPjxpbnB1dCB0eXBlPVwidGV4dFwiIGNsYXNzPVwiaW5wdXQtbWVkaXVtXCIgbmFtZT1cIm90aGVyXCIgdmFsdWU9XCJcIiBpZD1cInB0LWZlZWRiYWNrLXByb2JsZW1zLW90aGVyXCIgIC8+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgK1xuICAgICAgICAnICAgICAgICA8bGVnZW5kPlByb2JsZW1zIHdpdGggYWNjZXNzIHJpZ2h0cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHNwYW4gY2xhc3M9XCJoZWxwLWJsb2NrXCIgc3R5bGU9XCJtYXJnaW4tYm90dG9tOiAxcmVtO1wiPjxzdHJvbmc+JyArXG4gICAgICAgICcgICAgICAgICAgICAoU2VlIGFsc286IDxhIGhyZWY9XCJodHRwOi8vd3d3LmhhdGhpdHJ1c3Qub3JnL3Rha2VfZG93bl9wb2xpY3lcIiB0YXJnZXQ9XCJfYmxhbmtcIj50YWtlLWRvd24gcG9saWN5PC9hPiknICtcbiAgICAgICAgJyAgICAgICAgPC9zdHJvbmc+PC9zcGFuPicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiYWxlcnQgYWxlcnQtaGVscFwiPlNlbGVjdCBvbmUgb3B0aW9uIHRoYXQgYXBwbGllczwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMVwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0xXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgVGhpcyBpdGVtIGlzIGluIHRoZSBwdWJsaWMgZG9tYWluLCBidXQgSSBkb25cXCd0IGhhdmUgYWNjZXNzIHRvIGl0LicgK1xuICAgICAgICAnICAgICAgICAgICAgPC9sYWJlbD4nICtcbiAgICAgICAgJyAgICAgICAgPC9kaXY+JyArXG4gICAgICAgICcgICAgICAgIDxkaXYgY2xhc3M9XCJjb250cm9sXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICA8aW5wdXQgdHlwZT1cInJhZGlvXCIgbmFtZT1cIlJpZ2h0c1wiIHZhbHVlPVwiYWNjZXNzXCIgaWQ9XCJwdC1mZWVkYmFjay1hY2Nlc3MtMlwiIC8+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJyYWRpb1wiIGZvcj1cInB0LWZlZWRiYWNrLWFjY2Vzcy0yXCI+JyArXG4gICAgICAgICcgICAgICAgICAgICAgICAgICAgIEkgaGF2ZSBhY2Nlc3MgdG8gdGhpcyBpdGVtLCBidXQgc2hvdWxkIG5vdC4nICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgICAgICA8ZGl2IGNsYXNzPVwiY29udHJvbFwiPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGlucHV0IHR5cGU9XCJyYWRpb1wiIG5hbWU9XCJSaWdodHNcIiB2YWx1ZT1cIm5vbmVcIiBjaGVja2VkPVwiY2hlY2tlZFwiIGlkPVwicHQtZmVlZGJhY2stYWNjZXNzLTNcIiAvPicgK1xuICAgICAgICAnICAgICAgICAgICAgPGxhYmVsIGNsYXNzPVwicmFkaW9cIiBmb3I9XCJwdC1mZWVkYmFjay1hY2Nlc3MtM1wiPicgK1xuICAgICAgICAnICAgICAgICAgICAgICAgIChObyBwcm9ibGVtcyknICtcbiAgICAgICAgJyAgICAgICAgICAgIDwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgIDwvZGl2PicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICcgICAgPGZpZWxkc2V0PicgKyBcbiAgICAgICAgJyAgICAgICAgPGxlZ2VuZD5PdGhlciBwcm9ibGVtcyBvciBjb21tZW50cz88L2xlZ2VuZD4nICtcbiAgICAgICAgJyAgICAgICAgPHA+JyArXG4gICAgICAgICcgICAgICAgICAgICA8bGFiZWwgY2xhc3M9XCJvZmZzY3JlZW5cIiBmb3I9XCJjb21tZW50c1wiPk90aGVyIHByb2JsZW1zIG9yIGNvbW1lbnRzPzwvbGFiZWw+JyArXG4gICAgICAgICcgICAgICAgICAgICA8dGV4dGFyZWEgaWQ9XCJjb21tZW50c1wiIG5hbWU9XCJjb21tZW50c1wiIHJvd3M9XCIzXCI+PC90ZXh0YXJlYT4nICtcbiAgICAgICAgJyAgICAgICAgPC9wPicgK1xuICAgICAgICAnICAgIDwvZmllbGRzZXQ+JyArXG4gICAgICAgICc8L2Zvcm0+JztcblxuICAgIHZhciAkZm9ybSA9ICQoaHRtbCk7XG5cbiAgICAvLyBoaWRkZW4gZmllbGRzXG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1N5c0lEJyAvPlwiKS52YWwoSFQucGFyYW1zLmlkKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J1JlY29yZFVSTCcgLz5cIikudmFsKEhULnBhcmFtcy5SZWNvcmRVUkwpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAgICAgJChcIjxpbnB1dCB0eXBlPSdoaWRkZW4nIG5hbWU9J0NSTVMnIC8+XCIpLnZhbChIVC5jcm1zX3N0YXRlKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgICAgIHZhciAkZW1haWwgPSAkZm9ybS5maW5kKFwiI2VtYWlsXCIpO1xuICAgICAgICAkZW1haWwudmFsKEhULmNybXNfc3RhdGUpO1xuICAgICAgICAkZW1haWwuaGlkZSgpO1xuICAgICAgICAkKFwiPHNwYW4+XCIgKyBIVC5jcm1zX3N0YXRlICsgXCI8L3NwYW4+PGJyIC8+XCIpLmluc2VydEFmdGVyKCRlbWFpbCk7XG4gICAgICAgICRmb3JtLmZpbmQoXCIuaGVscC1ibG9ja1wiKS5oaWRlKCk7XG4gICAgfVxuXG4gICAgaWYgKCBIVC5yZWFkZXIgKSB7XG4gICAgICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSdTZXFObycgLz5cIikudmFsKEhULnBhcmFtcy5zZXEpLmFwcGVuZFRvKCRmb3JtKTtcbiAgICB9IGVsc2UgaWYgKCBIVC5wYXJhbXMuc2VxICkge1xuICAgICAgICAkKFwiPGlucHV0IHR5cGU9J2hpZGRlbicgbmFtZT0nU2VxTm8nIC8+XCIpLnZhbChIVC5wYXJhbXMuc2VxKS5hcHBlbmRUbygkZm9ybSk7XG4gICAgfVxuICAgICQoXCI8aW5wdXQgdHlwZT0naGlkZGVuJyBuYW1lPSd2aWV3JyAvPlwiKS52YWwoSFQucGFyYW1zLnZpZXcpLmFwcGVuZFRvKCRmb3JtKTtcblxuICAgIC8vIGlmICggSFQuY3Jtc19zdGF0ZSApIHtcbiAgICAvLyAgICAgJGZvcm0uZmluZChcIiNlbWFpbFwiKS52YWwoSFQuY3Jtc19zdGF0ZSk7XG4gICAgLy8gfVxuXG5cbiAgICByZXR1cm4gJGZvcm07XG59O1xuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBpbml0ZWQgPSBmYWxzZTtcblxuICAgIHZhciAkZm9ybSA9ICQoXCIjc2VhcmNoLW1vZGFsIGZvcm1cIik7XG5cbiAgICB2YXIgJGlucHV0ID0gJGZvcm0uZmluZChcImlucHV0LnNlYXJjaC1pbnB1dC10ZXh0XCIpO1xuICAgIHZhciAkaW5wdXRfbGFiZWwgPSAkZm9ybS5maW5kKFwibGFiZWxbZm9yPSdxMS1pbnB1dCddXCIpO1xuICAgIHZhciAkc2VsZWN0ID0gJGZvcm0uZmluZChcIi5jb250cm9sLXNlYXJjaHR5cGVcIik7XG4gICAgdmFyICRzZWFyY2hfdGFyZ2V0ID0gJGZvcm0uZmluZChcIi5zZWFyY2gtdGFyZ2V0XCIpO1xuICAgIHZhciAkZnQgPSAkZm9ybS5maW5kKFwic3Bhbi5mdW5reS1mdWxsLXZpZXdcIik7XG5cbiAgICB2YXIgJGJhY2tkcm9wID0gbnVsbDtcblxuICAgIHZhciAkYWN0aW9uID0gJChcIiNhY3Rpb24tc2VhcmNoLWhhdGhpdHJ1c3RcIik7XG4gICAgJGFjdGlvbi5vbignY2xpY2snLCBmdW5jdGlvbigpIHtcbiAgICAgICAgYm9vdGJveC5zaG93KCdzZWFyY2gtbW9kYWwnLCB7XG4gICAgICAgICAgICBvblNob3c6IGZ1bmN0aW9uKG1vZGFsKSB7XG4gICAgICAgICAgICAgICAgJGlucHV0LmZvY3VzKCk7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgIH0pXG5cbiAgICB2YXIgX3NldHVwID0ge307XG4gICAgX3NldHVwLmxzID0gZnVuY3Rpb24oKSB7XG4gICAgICAgICRzZWxlY3QuaGlkZSgpO1xuICAgICAgICAkaW5wdXQuYXR0cigncGxhY2Vob2xkZXInLCAnU2VhcmNoIHdvcmRzIGFib3V0IG9yIHdpdGhpbiB0aGUgaXRlbXMnKTtcbiAgICAgICAgJGlucHV0X2xhYmVsLnRleHQoJ1NlYXJjaCBmdWxsLXRleHQgaW5kZXgnKTtcbiAgICAgICAgaWYgKCBpbml0ZWQgKSB7XG4gICAgICAgICAgICBIVC51cGRhdGVfc3RhdHVzKFwiU2VhcmNoIHdpbGwgdXNlIHRoZSBmdWxsLXRleHQgaW5kZXguXCIpO1xuICAgICAgICB9XG4gICAgfVxuXG4gICAgX3NldHVwLmNhdGFsb2cgPSBmdW5jdGlvbigpIHtcbiAgICAgICAgJHNlbGVjdC5zaG93KCk7XG4gICAgICAgICRpbnB1dC5hdHRyKCdwbGFjZWhvbGRlcicsICdTZWFyY2ggd29yZHMgYWJvdXQgdGhlIGl0ZW1zJyk7XG4gICAgICAgICRpbnB1dF9sYWJlbC50ZXh0KCdTZWFyY2ggY2F0YWxvZyBpbmRleCcpO1xuICAgICAgICBpZiAoIGluaXRlZCApIHtcbiAgICAgICAgICAgIEhULnVwZGF0ZV9zdGF0dXMoXCJTZWFyY2ggd2lsbCB1c2UgdGhlIGNhdGFsb2cgaW5kZXg7IHlvdSBjYW4gbGltaXQgeW91ciBzZWFyY2ggdG8gYSBzZWxlY3Rpb24gb2YgZmllbGRzLlwiKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgIHZhciB0YXJnZXQgPSAkc2VhcmNoX3RhcmdldC5maW5kKFwiaW5wdXQ6Y2hlY2tlZFwiKS52YWwoKTtcbiAgICBfc2V0dXBbdGFyZ2V0XSgpO1xuICAgIGluaXRlZCA9IHRydWU7XG5cbiAgICB2YXIgcHJlZnMgPSBIVC5wcmVmcy5nZXQoKTtcbiAgICBpZiAoIHByZWZzLnNlYXJjaCAmJiBwcmVmcy5zZWFyY2guZnQgKSB7XG4gICAgICAgICQoXCJpbnB1dFtuYW1lPWZ0XVwiKS5hdHRyKCdjaGVja2VkJywgJ2NoZWNrZWQnKTtcbiAgICB9XG5cbiAgICAkc2VhcmNoX3RhcmdldC5vbignY2hhbmdlJywgJ2lucHV0W3R5cGU9XCJyYWRpb1wiXScsIGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgdmFyIHRhcmdldCA9IHRoaXMudmFsdWU7XG4gICAgICAgIF9zZXR1cFt0YXJnZXRdKCk7XG4gICAgICAgIEhULmFuYWx5dGljcy50cmFja0V2ZW50KHsgbGFiZWwgOiBcIi1cIiwgY2F0ZWdvcnkgOiBcIkhUIFNlYXJjaFwiLCBhY3Rpb24gOiB0YXJnZXQgfSk7XG4gICAgfSlcblxuICAgIC8vICRmb3JtLmRlbGVnYXRlKCc6aW5wdXQnLCAnZm9jdXMgY2hhbmdlJywgZnVuY3Rpb24oZSkge1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkZPQ1VTSU5HXCIsIHRoaXMpO1xuICAgIC8vICAgICAkZm9ybS5hZGRDbGFzcyhcImZvY3VzZWRcIik7XG4gICAgLy8gICAgIGlmICggJGJhY2tkcm9wID09IG51bGwgKSB7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3AgPSAkKCc8ZGl2IGNsYXNzPVwibW9kYWxfX292ZXJsYXkgaW52aXNpYmxlXCI+PC9kaXY+Jyk7XG4gICAgLy8gICAgICAgICAkYmFja2Ryb3Aub24oJ2NsaWNrJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICAgICAgICAgY2xvc2Vfc2VhcmNoX2Zvcm0oKTtcbiAgICAvLyAgICAgICAgIH0pO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgICRiYWNrZHJvcC5hcHBlbmRUbygkKFwiYm9keVwiKSkuc2hvdygpO1xuICAgIC8vIH0pXG5cbiAgICAvLyAkKFwiYm9keVwiKS5vbignZm9jdXMnLCAnOmlucHV0LGEnLCBmdW5jdGlvbihlKSB7XG4gICAgLy8gICAgIHZhciAkdGhpcyA9ICQodGhpcyk7XG4gICAgLy8gICAgIGlmICggISAkdGhpcy5jbG9zZXN0KFwiLm5hdi1zZWFyY2gtZm9ybVwiKS5sZW5ndGggKSB7XG4gICAgLy8gICAgICAgICBjbG9zZV9zZWFyY2hfZm9ybSgpO1xuICAgIC8vICAgICB9XG4gICAgLy8gfSk7XG5cbiAgICAvLyB2YXIgY2xvc2Vfc2VhcmNoX2Zvcm0gPSBmdW5jdGlvbigpIHtcbiAgICAvLyAgICAgJGZvcm0ucmVtb3ZlQ2xhc3MoXCJmb2N1c2VkXCIpO1xuICAgIC8vICAgICBpZiAoICRiYWNrZHJvcCAhPSBudWxsICkge1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmRldGFjaCgpO1xuICAgIC8vICAgICAgICAgJGJhY2tkcm9wLmhpZGUoKTtcbiAgICAvLyAgICAgfVxuICAgIC8vIH1cblxuICAgIC8vIGFkZCBldmVudCBoYW5kbGVyIGZvciBzdWJtaXQgdG8gY2hlY2sgZm9yIGVtcHR5IHF1ZXJ5IG9yIGFzdGVyaXNrXG4gICAgJGZvcm0uc3VibWl0KGZ1bmN0aW9uKGV2ZW50KVxuICAgICAgICAge1xuXG5cbiAgICAgICAgICAgIGlmICggISB0aGlzLmNoZWNrVmFsaWRpdHkoKSApIHtcbiAgICAgICAgICAgICAgICB0aGlzLnJlcG9ydFZhbGlkaXR5KCk7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGZhbHNlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgIC8vY2hlY2sgZm9yIGJsYW5rIG9yIHNpbmdsZSBhc3Rlcmlza1xuICAgICAgICAgICB2YXIgJGlucHV0ID0gJCh0aGlzKS5maW5kKFwiaW5wdXRbbmFtZT1xMV1cIik7XG4gICAgICAgICAgIHZhciBxdWVyeSA9ICRpbnB1dC52YWwoKTtcbiAgICAgICAgICAgcXVlcnkgPSAkLnRyaW0ocXVlcnkpO1xuICAgICAgICAgICBpZiAocXVlcnkgPT09ICcnKVxuICAgICAgICAgICB7XG4gICAgICAgICAgICAgYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSBzZWFyY2ggdGVybS5cIik7XG4gICAgICAgICAgICAgJGlucHV0LnRyaWdnZXIoJ2JsdXInKTtcbiAgICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgICAgIH1cbiAgICAgICAgICAgLy8gLy8gKiAgQmlsbCBzYXlzIGdvIGFoZWFkIGFuZCBmb3J3YXJkIGEgcXVlcnkgd2l0aCBhbiBhc3RlcmlzayAgICMjIyMjI1xuICAgICAgICAgICAvLyBlbHNlIGlmIChxdWVyeSA9PT0gJyonKVxuICAgICAgICAgICAvLyB7XG4gICAgICAgICAgIC8vICAgLy8gY2hhbmdlIHExIHRvIGJsYW5rXG4gICAgICAgICAgIC8vICAgJChcIiNxMS1pbnB1dFwiKS52YWwoXCJcIilcbiAgICAgICAgICAgLy8gICAkKFwiLnNlYXJjaC1mb3JtXCIpLnN1Ym1pdCgpO1xuICAgICAgICAgICAvLyB9XG4gICAgICAgICAgIC8vICMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIyMjIypcbiAgICAgICAgICAgZWxzZVxuICAgICAgICAgICB7XG5cbiAgICAgICAgICAgIC8vIHNhdmUgbGFzdCBzZXR0aW5nc1xuICAgICAgICAgICAgdmFyIHNlYXJjaHR5cGUgPSAoIHRhcmdldCA9PSAnbHMnICkgPyAnYWxsJyA6ICRzZWxlY3QuZmluZChcInNlbGVjdFwiKS52YWwoKTtcbiAgICAgICAgICAgIEhULnByZWZzLnNldCh7IHNlYXJjaCA6IHsgZnQgOiAkKFwiaW5wdXRbbmFtZT1mdF06Y2hlY2tlZFwiKS5sZW5ndGggPiAwLCB0YXJnZXQgOiB0YXJnZXQsIHNlYXJjaHR5cGU6IHNlYXJjaHR5cGUgfX0pXG5cbiAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICB9XG5cbiAgICAgfSApO1xuXG59KVxuIiwiaGVhZC5yZWFkeShmdW5jdGlvbigpIHtcblxuICAgIHZhciBESVNNSVNTX0VWRU5UID0gKHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSAmJlxuICAgICAgICAgICAgICAgIHdpbmRvdy5oYXNPd25Qcm9wZXJ0eSgnb250b3VjaHN0YXJ0JykpID9cbiAgICAgICAgICAgICAgICAgICAgJ3RvdWNoc3RhcnQnIDogJ21vdXNlZG93bic7XG5cbiAgICB2YXIgJG1lbnVzID0gJChcIm5hdiA+IHVsID4gbGk6aGFzKHVsKVwiKTtcblxuICAgIHZhciB0b2dnbGUgPSBmdW5jdGlvbigkcG9wdXAsICRtZW51LCAkbGluaykge1xuICAgICAgICBpZiAoICRwb3B1cC5kYXRhKCdzdGF0ZScpID09ICdvcGVuJyApIHtcbiAgICAgICAgICAgICRtZW51LnJlbW92ZUNsYXNzKFwiYWN0aXZlXCIpO1xuICAgICAgICAgICAgJHBvcHVwLmF0dHIoJ2FyaWEtaGlkZGVuJywgJ3RydWUnKTtcbiAgICAgICAgICAgICRsaW5rLmZvY3VzKCk7XG4gICAgICAgICAgICAkcG9wdXAuZGF0YSgnc3RhdGUnLCAnY2xvc2VkJyk7XG4gICAgICAgIH0gZWxzZSB7XG4gICAgICAgICAgICAkbWVudS5hZGRDbGFzcyhcImFjdGl2ZVwiKTtcbiAgICAgICAgICAgICRwb3B1cC5hdHRyKCdhcmlhLWhpZGRlbicsICdmYWxzZScpO1xuICAgICAgICAgICAgJHBvcHVwLmRhdGEoJ3N0YXRlJywgJ29wZW4nKTtcbiAgICAgICAgfVxuICAgIH1cblxuICAgICRtZW51cy5lYWNoKGZ1bmN0aW9uKGluZGV4KSB7XG4gICAgICAgIHZhciAkbWVudSA9ICQodGhpcyk7XG4gICAgICAgIGNvbnNvbGUubG9nKFwiQUhPWSBXVVRcIiwgJG1lbnUpO1xuICAgICAgICAkbWVudS5maW5kKFwibGlcIikuZWFjaChmdW5jdGlvbihsaWR4KSB7XG4gICAgICAgICAgICB2YXIgJGl0ZW0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgJGl0ZW0uYXR0cignYXJpYS1yb2xlJywgJ3ByZXNlbnRhdGlvbicpO1xuICAgICAgICAgICAgJGl0ZW0uZmluZChcImFcIikuYXR0cignYXJpYS1yb2xlJywgJ21lbnVpdGVtJyk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgdmFyICRsaW5rID0gJG1lbnUuZmluZChcIj4gYVwiKTtcbiAgICAgICAgdmFyICRwb3B1cCA9ICRtZW51LmZpbmQoXCJ1bFwiKTtcbiAgICAgICAgdmFyICRpdGVtcyA9ICRwb3B1cC5maW5kKFwiYVwiKTtcbiAgICAgICAgJGxpbmsub24oJ2NsaWNrJywgZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgZS5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIGUucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgICAgIHRvZ2dsZSgkcG9wdXAsICRtZW51LCAkbGluayk7XG4gICAgICAgIH0pXG5cbiAgICAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4JywgLTEpO1xuICAgICAgICAkbWVudS5vbigna2V5ZG93bicsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgICAgICAgICB2YXIgY29kZSA9IGV2ZW50LmNvZGU7XG4gICAgICAgICAgICB2YXIgc2VsZWN0ZWRfaWR4ID0gJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jyk7XG4gICAgICAgICAgICB2YXIgZGVsdGEgPSAwO1xuICAgICAgICAgICAgaWYgKCBjb2RlID09ICdBcnJvd0Rvd24nICkge1xuICAgICAgICAgICAgICAgIGRlbHRhID0gMTtcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoIGNvZGUgPT0gJ0Fycm93VXAnICkge1xuICAgICAgICAgICAgICAgIGRlbHRhID0gLTE7XG4gICAgICAgICAgICB9IGVsc2UgaWYgKCBjb2RlID09ICdFc2NhcGUnICkge1xuICAgICAgICAgICAgICAgIHRvZ2dsZSgkcG9wdXAsICRtZW51LCAkbGluayk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBpZiAoIGRlbHRhID09IDAgKSB7IGNvbnNvbGUubG9nKFwiQUhPWSBLRVlDT0RFXCIsIGNvZGUpOyByZXR1cm4gOyB9XG4gICAgICAgICAgICBldmVudC5zdG9wUHJvcGFnYXRpb24oKTtcbiAgICAgICAgICAgIHNlbGVjdGVkX2lkeCA9ICggc2VsZWN0ZWRfaWR4ICsgZGVsdGEgKSAlICRpdGVtcy5sZW5ndGg7XG4gICAgICAgICAgICBjb25zb2xlLmxvZyhcIkFIT1kgTUVOVSBLRVlET1dOXCIsIHNlbGVjdGVkX2lkeCk7XG4gICAgICAgICAgICAkc2VsZWN0ZWQgPSAkaXRlbXMuc2xpY2Uoc2VsZWN0ZWRfaWR4LCBzZWxlY3RlZF9pZHggKyAxKTtcbiAgICAgICAgICAgICRzZWxlY3RlZC5mb2N1cygpO1xuICAgICAgICAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jywgc2VsZWN0ZWRfaWR4KTtcbiAgICAgICAgfSlcbiAgICB9KVxuXG5cbiAgICAvLyAkbWVudS5kYXRhKCdzZWxlY3RlZF9pZHgnLCAtMSk7XG4gICAgLy8gJG1lbnUub24oJ2ZvY3VzaW4nLCBmdW5jdGlvbihldmVudCkge1xuICAgIC8vICAgICAkbWVudS5maW5kKFwiPiBhXCIpLmdldCgwKS5kYXRhc2V0LmV4cGFuZGVkID0gdHJ1ZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51LnByZXYoKS5maW5kKFwiPiBhXCIpLm9uKCdmb2N1c2luJywgZnVuY3Rpb24oKSB7XG4gICAgLy8gICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51LmZpbmQoXCJ1bCA+IGxpID4gYTpsYXN0XCIpLm9uKCdmb2N1c291dCcsIGZ1bmN0aW9uKGV2ZW50KSB7XG4gICAgLy8gICAgICRtZW51LmZpbmQoXCI+IGFcIikuZ2V0KDApLmRhdGFzZXQuZXhwYW5kZWQgPSBmYWxzZTtcbiAgICAvLyB9KVxuICAgIC8vICRtZW51Lm9uKCdrZXlkb3duJywgZnVuY3Rpb24oZXZlbnQpIHtcbiAgICAvLyAgICAgdmFyIGNvZGUgPSBldmVudC5jb2RlO1xuICAgIC8vICAgICB2YXIgJGl0ZW1zID0gJG1lbnUuZmluZChcInVsID4gbGkgPiBhXCIpO1xuICAgIC8vICAgICB2YXIgc2VsZWN0ZWRfaWR4ID0gJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jyk7XG4gICAgLy8gICAgIHZhciBkZWx0YSA9IDA7XG4gICAgLy8gICAgIGlmICggY29kZSA9PSAnQXJyb3dEb3duJyApIHtcbiAgICAvLyAgICAgICAgIGRlbHRhID0gMTtcbiAgICAvLyAgICAgfSBlbHNlIGlmICggY29kZSA9PSAnQXJyb3dVcCcgKSB7XG4gICAgLy8gICAgICAgICBkZWx0YSA9IC0xO1xuICAgIC8vICAgICB9XG4gICAgLy8gICAgIGlmICggZGVsdGEgPT0gMCApIHsgcmV0dXJuIDsgfVxuICAgIC8vICAgICBzZWxlY3RlZF9pZHggPSAoIHNlbGVjdGVkX2lkeCArIGRlbHRhICkgJSAkaXRlbXMubGVuZ3RoO1xuICAgIC8vICAgICBjb25zb2xlLmxvZyhcIkFIT1kgTUVOVSBLRVlET1dOXCIsIHNlbGVjdGVkX2lkeCk7XG4gICAgLy8gICAgICRzZWxlY3RlZCA9ICRpdGVtcy5zbGljZShzZWxlY3RlZF9pZHgsIHNlbGVjdGVkX2lkeCArIDEpO1xuICAgIC8vICAgICAkc2VsZWN0ZWQuZm9jdXMoKTtcbiAgICAvLyAgICAgJG1lbnUuZGF0YSgnc2VsZWN0ZWRfaWR4Jywgc2VsZWN0ZWRfaWR4KTtcbiAgICAvLyB9KVxuXG59KTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG4gICQoXCIjZm9ybS1zZWFyY2gtdm9sdW1lXCIpLnN1Ym1pdChmdW5jdGlvbigpIHtcbiAgICB2YXIgJGZvcm0gPSAkKHRoaXMpO1xuICAgIHZhciAkc3VibWl0ID0gJGZvcm0uZmluZChcImJ1dHRvblt0eXBlPXN1Ym1pdF1cIik7XG4gICAgaWYgKCAkc3VibWl0Lmhhc0NsYXNzKFwiYnRuLWxvYWRpbmdcIikgKSB7XG4gICAgICBhbGVydChcIllvdXIgc2VhcmNoIHF1ZXJ5IGhhcyBiZWVuIHN1Ym1pdHRlZCBhbmQgaXMgY3VycmVudGx5IGJlaW5nIHByb2Nlc3NlZC5cIik7XG4gICAgICByZXR1cm4gZmFsc2U7XG4gICAgfVxuICAgIHZhciAkaW5wdXQgPSAkZm9ybS5maW5kKFwiaW5wdXRbdHlwZT10ZXh0XVwiKVxuICAgIGlmICggISAkLnRyaW0oJGlucHV0LnZhbCgpKSApIHtcbiAgICAgIGJvb3Rib3guYWxlcnQoXCJQbGVhc2UgZW50ZXIgYSB0ZXJtIGluIHRoZSBzZWFyY2ggYm94LlwiKTtcbiAgICAgIHJldHVybiBmYWxzZTtcbiAgICB9XG4gICAgJHN1Ym1pdC5hZGRDbGFzcyhcImJ0bi1sb2FkaW5nXCIpLmF0dHIoXCJkaXNhYmxlZFwiLCBcImRpc2FibGVkXCIpO1xuXG4gICAgJCh3aW5kb3cpLm9uKCd1bmxvYWQnLCBmdW5jdGlvbigpIHtcbiAgICAgICRzdWJtaXQucmVtb3ZlQXR0cignZGlzYWJsZWQnKTtcbiAgICB9KVxuXG4gICAgcmV0dXJuIHRydWU7XG4gIH0pXG59KTtcbiIsIi8qKlxuICogU29jaWFsIExpbmtzXG4gKiBJbnNwaXJlZCBieTogaHR0cDovL3NhcGVnaW4uZ2l0aHViLmNvbS9zb2NpYWwtbGlrZXNcbiAqXG4gKiBTaGFyaW5nIGJ1dHRvbnMgZm9yIFJ1c3NpYW4gYW5kIHdvcmxkd2lkZSBzb2NpYWwgbmV0d29ya3MuXG4gKlxuICogQHJlcXVpcmVzIGpRdWVyeVxuICogQGF1dGhvciBBcnRlbSBTYXBlZ2luXG4gKiBAY29weXJpZ2h0IDIwMTQgQXJ0ZW0gU2FwZWdpbiAoc2FwZWdpbi5tZSlcbiAqIEBsaWNlbnNlIE1JVFxuICovXG5cbi8qZ2xvYmFsIGRlZmluZTpmYWxzZSwgc29jaWFsTGlua3NCdXR0b25zOmZhbHNlICovXG5cbihmdW5jdGlvbihmYWN0b3J5KSB7ICAvLyBUcnkgdG8gcmVnaXN0ZXIgYXMgYW4gYW5vbnltb3VzIEFNRCBtb2R1bGVcbiAgICBpZiAodHlwZW9mIGRlZmluZSA9PT0gJ2Z1bmN0aW9uJyAmJiBkZWZpbmUuYW1kKSB7XG4gICAgICAgIGRlZmluZShbJ2pxdWVyeSddLCBmYWN0b3J5KTtcbiAgICB9XG4gICAgZWxzZSB7XG4gICAgICAgIGZhY3RvcnkoalF1ZXJ5KTtcbiAgICB9XG59KGZ1bmN0aW9uKCQsIHVuZGVmaW5lZCkge1xuXG4gICAgJ3VzZSBzdHJpY3QnO1xuXG4gICAgdmFyIHByZWZpeCA9ICdzb2NpYWwtbGlua3MnO1xuICAgIHZhciBjbGFzc1ByZWZpeCA9IHByZWZpeCArICdfXyc7XG4gICAgdmFyIG9wZW5DbGFzcyA9IHByZWZpeCArICdfb3BlbmVkJztcbiAgICB2YXIgcHJvdG9jb2wgPSBsb2NhdGlvbi5wcm90b2NvbCA9PT0gJ2h0dHBzOicgPyAnaHR0cHM6JyA6ICdodHRwOic7XG4gICAgdmFyIGlzSHR0cHMgPSBwcm90b2NvbCA9PT0gJ2h0dHBzOic7XG5cblxuICAgIC8qKlxuICAgICAqIEJ1dHRvbnNcbiAgICAgKi9cbiAgICB2YXIgc2VydmljZXMgPSB7XG4gICAgICAgIGZhY2Vib29rOiB7XG4gICAgICAgICAgICBsYWJlbDogJ0ZhY2Vib29rJyxcbiAgICAgICAgICAgIC8vIGh0dHBzOi8vZGV2ZWxvcGVycy5mYWNlYm9vay5jb20vZG9jcy9yZWZlcmVuY2UvZnFsL2xpbmtfc3RhdC9cbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL2dyYXBoLmZhY2Vib29rLmNvbS9mcWw/cT1TRUxFQ1QrdG90YWxfY291bnQrRlJPTStsaW5rX3N0YXQrV0hFUkUrdXJsJTNEJTIye3VybH0lMjImY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuZGF0YVswXS50b3RhbF9jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogJ2h0dHBzOi8vd3d3LmZhY2Vib29rLmNvbS9zaGFyZXIvc2hhcmVyLnBocD91PXt1cmx9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA1MDBcbiAgICAgICAgfSxcbiAgICAgICAgdHdpdHRlcjoge1xuICAgICAgICAgICAgbGFiZWw6ICdUd2l0dGVyJyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6ICdodHRwczovL2Nkbi5hcGkudHdpdHRlci5jb20vMS91cmxzL2NvdW50Lmpzb24/dXJsPXt1cmx9JmNhbGxiYWNrPT8nLFxuICAgICAgICAgICAgY29udmVydE51bWJlcjogZnVuY3Rpb24oZGF0YSkge1xuICAgICAgICAgICAgICAgIHJldHVybiBkYXRhLmNvdW50O1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cHM6Ly90d2l0dGVyLmNvbS9pbnRlbnQvdHdlZXQ/dXJsPXt1cmx9JnRleHQ9e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYwMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiA0NTAsXG4gICAgICAgICAgICBjbGljazogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAgICAgLy8gQWRkIGNvbG9uIHRvIGltcHJvdmUgcmVhZGFiaWxpdHlcbiAgICAgICAgICAgICAgICBpZiAoIS9bXFwuXFw/OlxcLeKAk+KAlF1cXHMqJC8udGVzdCh0aGlzLm9wdGlvbnMudGl0bGUpKSB0aGlzLm9wdGlvbnMudGl0bGUgKz0gJzonO1xuICAgICAgICAgICAgICAgIHJldHVybiB0cnVlO1xuICAgICAgICAgICAgfVxuICAgICAgICB9LFxuICAgICAgICBtYWlscnU6IHtcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vY29ubmVjdC5tYWlsLnJ1L3NoYXJlX2NvdW50P3VybF9saXN0PXt1cmx9JmNhbGxiYWNrPTEmZnVuYz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciB1cmwgaW4gZGF0YSkge1xuICAgICAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eSh1cmwpKSB7XG4gICAgICAgICAgICAgICAgICAgICAgICByZXR1cm4gZGF0YVt1cmxdLnNoYXJlcztcbiAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9jb25uZWN0Lm1haWwucnUvc2hhcmU/c2hhcmVfdXJsPXt1cmx9JnRpdGxlPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFdpZHRoOiA1NTAsXG4gICAgICAgICAgICBwb3B1cEhlaWdodDogMzYwXG4gICAgICAgIH0sXG4gICAgICAgIHZrb250YWt0ZToge1xuICAgICAgICAgICAgbGFiZWw6ICdWSycsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiAnaHR0cHM6Ly92ay5jb20vc2hhcmUucGhwP2FjdD1jb3VudCZ1cmw9e3VybH0maW5kZXg9e2luZGV4fScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMudmtvbnRha3RlO1xuICAgICAgICAgICAgICAgIGlmICghb3B0aW9ucy5fKSB7XG4gICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IFtdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoIXdpbmRvdy5WSykgd2luZG93LlZLID0ge307XG4gICAgICAgICAgICAgICAgICAgIHdpbmRvdy5WSy5TaGFyZSA9IHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGNvdW50OiBmdW5jdGlvbihpZHgsIG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG9wdGlvbnMuX1tpZHhdLnJlc29sdmUobnVtYmVyKTtcbiAgICAgICAgICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAgICAgfTtcbiAgICAgICAgICAgICAgICB9XG5cbiAgICAgICAgICAgICAgICB2YXIgaW5kZXggPSBvcHRpb25zLl8ubGVuZ3RoO1xuICAgICAgICAgICAgICAgIG9wdGlvbnMuXy5wdXNoKGRlZmVycmVkKTtcbiAgICAgICAgICAgICAgICAkLmdldFNjcmlwdChtYWtlVXJsKGpzb25VcmwsIHtpbmRleDogaW5kZXh9KSlcbiAgICAgICAgICAgICAgICAgICAgLmZhaWwoZGVmZXJyZWQucmVqZWN0KTtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy92ay5jb20vc2hhcmUucGhwP3VybD17dXJsfSZ0aXRsZT17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDMzMFxuICAgICAgICB9LFxuICAgICAgICBvZG5va2xhc3NuaWtpOiB7XG4gICAgICAgICAgICAvLyBIVFRQUyBub3Qgc3VwcG9ydGVkXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBpc0h0dHBzID8gdW5kZWZpbmVkIDogJ2h0dHA6Ly9jb25uZWN0Lm9rLnJ1L2RrP3N0LmNtZD1leHRMaWtlJnJlZj17dXJsfSZ1aWQ9e2luZGV4fScsXG4gICAgICAgICAgICBjb3VudGVyOiBmdW5jdGlvbihqc29uVXJsLCBkZWZlcnJlZCkge1xuICAgICAgICAgICAgICAgIHZhciBvcHRpb25zID0gc2VydmljZXMub2Rub2tsYXNzbmlraTtcbiAgICAgICAgICAgICAgICBpZiAoIW9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICBvcHRpb25zLl8gPSBbXTtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW5kb3cuT0RLTCkgd2luZG93Lk9ES0wgPSB7fTtcbiAgICAgICAgICAgICAgICAgICAgd2luZG93Lk9ES0wudXBkYXRlQ291bnQgPSBmdW5jdGlvbihpZHgsIG51bWJlcikge1xuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fW2lkeF0ucmVzb2x2ZShudW1iZXIpO1xuICAgICAgICAgICAgICAgICAgICB9O1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIHZhciBpbmRleCA9IG9wdGlvbnMuXy5sZW5ndGg7XG4gICAgICAgICAgICAgICAgb3B0aW9ucy5fLnB1c2goZGVmZXJyZWQpO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCwge2luZGV4OiBpbmRleH0pKVxuICAgICAgICAgICAgICAgICAgICAuZmFpbChkZWZlcnJlZC5yZWplY3QpO1xuICAgICAgICAgICAgfSxcbiAgICAgICAgICAgIHBvcHVwVXJsOiAnaHR0cDovL2Nvbm5lY3Qub2sucnUvZGs/c3QuY21kPVdpZGdldFNoYXJlUHJldmlldyZzZXJ2aWNlPW9kbm9rbGFzc25pa2kmc3Quc2hhcmVVcmw9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNTUwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICBwbHVzb25lOiB7XG4gICAgICAgICAgICBsYWJlbDogJ0dvb2dsZSsnLFxuICAgICAgICAgICAgLy8gSFRUUFMgbm90IHN1cHBvcnRlZCB5ZXQ6IGh0dHA6Ly9jbHVicy55YS5ydS9zaGFyZS8xNDk5XG4gICAgICAgICAgICBjb3VudGVyVXJsOiBpc0h0dHBzID8gdW5kZWZpbmVkIDogJ2h0dHA6Ly9zaGFyZS55YW5kZXgucnUvZ3BwLnhtbD91cmw9e3VybH0nLFxuICAgICAgICAgICAgY291bnRlcjogZnVuY3Rpb24oanNvblVybCwgZGVmZXJyZWQpIHtcbiAgICAgICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHNlcnZpY2VzLnBsdXNvbmU7XG4gICAgICAgICAgICAgICAgaWYgKG9wdGlvbnMuXykge1xuICAgICAgICAgICAgICAgICAgICAvLyBSZWplY3QgYWxsIGNvdW50ZXJzIGV4Y2VwdCB0aGUgZmlyc3QgYmVjYXVzZSBZYW5kZXggU2hhcmUgY291bnRlciBkb2VzbuKAmXQgcmV0dXJuIFVSTFxuICAgICAgICAgICAgICAgICAgICBkZWZlcnJlZC5yZWplY3QoKTtcbiAgICAgICAgICAgICAgICAgICAgcmV0dXJuO1xuICAgICAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgICAgIGlmICghd2luZG93LnNlcnZpY2VzKSB3aW5kb3cuc2VydmljZXMgPSB7fTtcbiAgICAgICAgICAgICAgICB3aW5kb3cuc2VydmljZXMuZ3BsdXMgPSB7XG4gICAgICAgICAgICAgICAgICAgIGNiOiBmdW5jdGlvbihudW1iZXIpIHtcbiAgICAgICAgICAgICAgICAgICAgICAgIGlmICh0eXBlb2YgbnVtYmVyID09PSAnc3RyaW5nJykge1xuICAgICAgICAgICAgICAgICAgICAgICAgICAgIG51bWJlciA9IG51bWJlci5yZXBsYWNlKC9cXEQvZywgJycpO1xuICAgICAgICAgICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgICAgICAgICAgb3B0aW9ucy5fLnJlc29sdmUocGFyc2VJbnQobnVtYmVyLCAxMCkpO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfTtcblxuICAgICAgICAgICAgICAgIG9wdGlvbnMuXyA9IGRlZmVycmVkO1xuICAgICAgICAgICAgICAgICQuZ2V0U2NyaXB0KG1ha2VVcmwoanNvblVybCkpXG4gICAgICAgICAgICAgICAgICAgIC5mYWlsKGRlZmVycmVkLnJlamVjdCk7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmw6ICdodHRwczovL3BsdXMuZ29vZ2xlLmNvbS9zaGFyZT91cmw9e3VybH0nLFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNzAwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDUwMFxuICAgICAgICB9LFxuICAgICAgICBwaW50ZXJlc3Q6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnUGludGVyZXN0JyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9waW50ZXJlc3QuY29tL3Bpbi9jcmVhdGUvYnV0dG9uLz91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgdHVtYmxyOiB7XG4gICAgICAgICAgICBsYWJlbDogJ1R1bWJscicsXG4gICAgICAgICAgICBjb3VudGVyVXJsOiBwcm90b2NvbCArICcvL2FwaS5waW50ZXJlc3QuY29tL3YxL3VybHMvY291bnQuanNvbj91cmw9e3VybH0mY2FsbGJhY2s9PycsXG4gICAgICAgICAgICBjb252ZXJ0TnVtYmVyOiBmdW5jdGlvbihkYXRhKSB7XG4gICAgICAgICAgICAgICAgcmV0dXJuIGRhdGEuY291bnQ7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBVcmwxOiBwcm90b2NvbCArICcvL3d3dy50dW1ibHIuY29tL3NoYXJlL2xpbms/dXJsPXt1cmx9JmRlc2NyaXB0aW9uPXtwb3N0X3RpdGxlfScsXG4gICAgICAgICAgICBwb3B1cFVybDI6IHByb3RvY29sICsgJy8vd3d3LnR1bWJsci5jb20vc2hhcmUvcGhvdG8/c291cmNlPXttZWRpYX0mY2xpY2tfdGhydT17dXJsfSZkZXNjcmlwdGlvbj17cG9zdF90aXRsZX0nLFxuICAgICAgICAgICAgY2xpY2s6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgICAgIGlmICggdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKSApIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLnBvcHVwVXJsID0gdGhpcy5vcHRpb25zLnBvcHVwVXJsMjtcbiAgICAgICAgICAgICAgICB9IGVsc2Uge1xuICAgICAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMucG9wdXBVcmwgPSB0aGlzLm9wdGlvbnMucG9wdXBVcmwxO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICAvLyB3aWxsIHN0aWxsIG5lZWQgdG8gY2hhbmdlIHRoZSBVUkwgc3RydWN0dXJlXG4gICAgICAgICAgICAgICAgcmV0dXJuIHRydWU7XG4gICAgICAgICAgICB9LFxuICAgICAgICAgICAgcG9wdXBXaWR0aDogNjMwLFxuICAgICAgICAgICAgcG9wdXBIZWlnaHQ6IDM2MFxuICAgICAgICB9LFxuICAgICAgICByZWRkaXQ6IHtcbiAgICAgICAgICAgIGxhYmVsOiAnUmVkZGl0JyxcbiAgICAgICAgICAgIGNvdW50ZXJVcmw6IHByb3RvY29sICsgJy8vYXBpLnBpbnRlcmVzdC5jb20vdjEvdXJscy9jb3VudC5qc29uP3VybD17dXJsfSZjYWxsYmFjaz0/JyxcbiAgICAgICAgICAgIGNvbnZlcnROdW1iZXI6IGZ1bmN0aW9uKGRhdGEpIHtcbiAgICAgICAgICAgICAgICByZXR1cm4gZGF0YS5jb3VudDtcbiAgICAgICAgICAgIH0sXG4gICAgICAgICAgICBwb3B1cFVybDogcHJvdG9jb2wgKyAnLy9yZWRkaXQuY29tL3N1Ym1pdD91cmw9e3VybH0mZGVzY3JpcHRpb249e3Bvc3RfdGl0bGV9JyxcbiAgICAgICAgICAgIHBvcHVwV2lkdGg6IDYzMCxcbiAgICAgICAgICAgIHBvcHVwSGVpZ2h0OiAzNjBcbiAgICAgICAgfSxcbiAgICAgICAgRU9UOiB0cnVlXG4gICAgfTtcblxuICAgIC8qKlxuICAgICAqIGpRdWVyeSBwbHVnaW5cbiAgICAgKi9cbiAgICAkLmZuLnNvY2lhbExpbmtzID0gZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICByZXR1cm4gdGhpcy5lYWNoKGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIGVsZW0gPSAkKHRoaXMpO1xuICAgICAgICAgICAgdmFyIGluc3RhbmNlID0gZWxlbS5kYXRhKHByZWZpeCk7XG4gICAgICAgICAgICBpZiAoaW5zdGFuY2UpIHtcbiAgICAgICAgICAgICAgICBpZiAoJC5pc1BsYWluT2JqZWN0KG9wdGlvbnMpKSB7XG4gICAgICAgICAgICAgICAgICAgIGluc3RhbmNlLnVwZGF0ZShvcHRpb25zKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBpbnN0YW5jZSA9IG5ldyBzb2NpYWxMaW5rcyhlbGVtLCAkLmV4dGVuZCh7fSwgJC5mbi5zb2NpYWxMaW5rcy5kZWZhdWx0cywgb3B0aW9ucywgZGF0YVRvT3B0aW9ucyhlbGVtKSkpO1xuICAgICAgICAgICAgICAgIGVsZW0uZGF0YShwcmVmaXgsIGluc3RhbmNlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSk7XG4gICAgfTtcblxuICAgIHZhciBwb3N0X3RpdGxlID0gZG9jdW1lbnQudGl0bGUuc3BsaXQoJyB8ICcpWzBdLnNwbGl0KCcgLSAnKTtcbiAgICBpZiAoICQuaW5BcnJheShwb3N0X3RpdGxlW3Bvc3RfdGl0bGUubGVuZ3RoIC0gMV0sIFsgJ0Z1bGwgVmlldycsICdMaW1pdGVkIFZpZXcnLCAnSXRlbSBOb3QgQXZhaWxhYmxlJyBdKSAhPT0gLTEgKSB7XG4gICAgICAgIHBvc3RfdGl0bGUucG9wKCk7XG4gICAgfVxuICAgIHBvc3RfdGl0bGUgPSBwb3N0X3RpdGxlLmpvaW4oXCIgLSBcIikgKyBcIiB8IEhhdGhpVHJ1c3RcIjtcbiAgICAkLmZuLnNvY2lhbExpbmtzLmRlZmF1bHRzID0ge1xuICAgICAgICB1cmw6IHdpbmRvdy5sb2NhdGlvbi5ocmVmLnJlcGxhY2Uod2luZG93LmxvY2F0aW9uLmhhc2gsICcnKS5yZXBsYWNlKC87L2csICcmJykucmVwbGFjZSgnL3NoY2dpLycsICcvY2dpLycpLFxuICAgICAgICBwb3N0X3RpdGxlOiBwb3N0X3RpdGxlLFxuICAgICAgICBjb3VudGVyczogdHJ1ZSxcbiAgICAgICAgemVyb2VzOiBmYWxzZSxcbiAgICAgICAgd2FpdDogNTAwLCAgLy8gU2hvdyBidXR0b25zIG9ubHkgYWZ0ZXIgY291bnRlcnMgYXJlIHJlYWR5IG9yIGFmdGVyIHRoaXMgYW1vdW50IG9mIHRpbWVcbiAgICAgICAgdGltZW91dDogMTAwMDAsICAvLyBTaG93IGNvdW50ZXJzIGFmdGVyIHRoaXMgYW1vdW50IG9mIHRpbWUgZXZlbiBpZiB0aGV5IGFyZW7igJl0IHJlYWR5XG4gICAgICAgIHBvcHVwQ2hlY2tJbnRlcnZhbDogNTAwLFxuICAgICAgICBzaW5nbGVUaXRsZTogJ1NoYXJlJ1xuICAgIH07XG5cbiAgICBmdW5jdGlvbiBzb2NpYWxMaW5rcyhjb250YWluZXIsIG9wdGlvbnMpIHtcbiAgICAgICAgdGhpcy5jb250YWluZXIgPSBjb250YWluZXI7XG4gICAgICAgIHRoaXMub3B0aW9ucyA9IG9wdGlvbnM7XG4gICAgICAgIHRoaXMuaW5pdCgpO1xuICAgIH1cblxuICAgIHNvY2lhbExpbmtzLnByb3RvdHlwZSA9IHtcbiAgICAgICAgaW5pdDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICAvLyBBZGQgY2xhc3MgaW4gY2FzZSBvZiBtYW51YWwgaW5pdGlhbGl6YXRpb25cbiAgICAgICAgICAgIHRoaXMuY29udGFpbmVyLmFkZENsYXNzKHByZWZpeCk7XG5cbiAgICAgICAgICAgIHRoaXMuaW5pdFVzZXJCdXR0b25zKCk7XG5cbiAgICAgICAgICAgIHZhciBidXR0b25zID0gdGhpcy5jb250YWluZXIuY2hpbGRyZW4oKTtcblxuICAgICAgICAgICAgdGhpcy5idXR0b25zID0gW107XG4gICAgICAgICAgICBidXR0b25zLmVhY2goJC5wcm94eShmdW5jdGlvbihpZHgsIGVsZW0pIHtcbiAgICAgICAgICAgICAgICB2YXIgYnV0dG9uID0gbmV3IEJ1dHRvbigkKGVsZW0pLCB0aGlzLm9wdGlvbnMpO1xuICAgICAgICAgICAgICAgIHRoaXMuYnV0dG9ucy5wdXNoKGJ1dHRvbik7XG4gICAgICAgICAgICB9LCB0aGlzKSk7XG5cbiAgICAgICAgfSxcbiAgICAgICAgaW5pdFVzZXJCdXR0b25zOiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIGlmICghdGhpcy51c2VyQnV0dG9uSW5pdGVkICYmIHdpbmRvdy5zb2NpYWxMaW5rc0J1dHRvbnMpIHtcbiAgICAgICAgICAgICAgICAkLmV4dGVuZCh0cnVlLCBzZXJ2aWNlcywgc29jaWFsTGlua3NCdXR0b25zKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRoaXMudXNlckJ1dHRvbkluaXRlZCA9IHRydWU7XG4gICAgICAgIH0sXG4gICAgICAgIGFwcGVhcjogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB0aGlzLmNvbnRhaW5lci5hZGRDbGFzcyhwcmVmaXggKyAnX3Zpc2libGUnKTtcbiAgICAgICAgfSxcbiAgICAgICAgcmVhZHk6IGZ1bmN0aW9uKHNpbGVudCkge1xuICAgICAgICAgICAgaWYgKHRoaXMudGltZW91dCkge1xuICAgICAgICAgICAgICAgIGNsZWFyVGltZW91dCh0aGlzLnRpbWVvdXQpO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5jb250YWluZXIuYWRkQ2xhc3MocHJlZml4ICsgJ19yZWFkeScpO1xuICAgICAgICAgICAgaWYgKCFzaWxlbnQpIHtcbiAgICAgICAgICAgICAgICB0aGlzLmNvbnRhaW5lci50cmlnZ2VyKCdyZWFkeS4nICsgcHJlZml4LCB0aGlzLm51bWJlcik7XG4gICAgICAgICAgICB9XG4gICAgICAgIH0sXG4gICAgfTtcblxuXG4gICAgZnVuY3Rpb24gQnV0dG9uKHdpZGdldCwgb3B0aW9ucykge1xuICAgICAgICB0aGlzLndpZGdldCA9IHdpZGdldDtcbiAgICAgICAgdGhpcy5vcHRpb25zID0gJC5leHRlbmQoe30sIG9wdGlvbnMpO1xuICAgICAgICB0aGlzLmRldGVjdFNlcnZpY2UoKTtcbiAgICAgICAgaWYgKHRoaXMuc2VydmljZSkge1xuICAgICAgICAgICAgdGhpcy5pbml0KCk7XG4gICAgICAgIH1cbiAgICB9XG5cbiAgICBCdXR0b24ucHJvdG90eXBlID0ge1xuICAgICAgICBpbml0OiBmdW5jdGlvbigpIHtcbiAgICAgICAgICAgIHRoaXMuZGV0ZWN0UGFyYW1zKCk7XG4gICAgICAgICAgICB0aGlzLmluaXRIdG1sKCk7XG4gICAgICAgICAgICBzZXRUaW1lb3V0KCQucHJveHkodGhpcy5pbml0Q291bnRlciwgdGhpcyksIDApO1xuICAgICAgICB9LFxuXG4gICAgICAgIHVwZGF0ZTogZnVuY3Rpb24ob3B0aW9ucykge1xuICAgICAgICAgICAgJC5leHRlbmQodGhpcy5vcHRpb25zLCB7Zm9yY2VVcGRhdGU6IGZhbHNlfSwgb3B0aW9ucyk7XG4gICAgICAgICAgICB0aGlzLndpZGdldC5maW5kKCcuJyArIHByZWZpeCArICdfX2NvdW50ZXInKS5yZW1vdmUoKTsgIC8vIFJlbW92ZSBvbGQgY291bnRlclxuICAgICAgICAgICAgdGhpcy5pbml0Q291bnRlcigpO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGVjdFNlcnZpY2U6IGZ1bmN0aW9uKCkge1xuICAgICAgICAgICAgdmFyIHNlcnZpY2UgPSB0aGlzLndpZGdldC5kYXRhKCdzZXJ2aWNlJyk7XG4gICAgICAgICAgICBpZiAoIXNlcnZpY2UpIHtcbiAgICAgICAgICAgICAgICAvLyBjbGFzcz1cImZhY2Vib29rXCJcbiAgICAgICAgICAgICAgICB2YXIgbm9kZSA9IHRoaXMud2lkZ2V0WzBdO1xuICAgICAgICAgICAgICAgIHZhciBjbGFzc2VzID0gbm9kZS5jbGFzc0xpc3QgfHwgbm9kZS5jbGFzc05hbWUuc3BsaXQoJyAnKTtcbiAgICAgICAgICAgICAgICBmb3IgKHZhciBjbGFzc0lkeCA9IDA7IGNsYXNzSWR4IDwgY2xhc3Nlcy5sZW5ndGg7IGNsYXNzSWR4KyspIHtcbiAgICAgICAgICAgICAgICAgICAgdmFyIGNscyA9IGNsYXNzZXNbY2xhc3NJZHhdO1xuICAgICAgICAgICAgICAgICAgICBpZiAoc2VydmljZXNbY2xzXSkge1xuICAgICAgICAgICAgICAgICAgICAgICAgc2VydmljZSA9IGNscztcbiAgICAgICAgICAgICAgICAgICAgICAgIGJyZWFrO1xuICAgICAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICAgIGlmICghc2VydmljZSkgcmV0dXJuO1xuICAgICAgICAgICAgfVxuICAgICAgICAgICAgdGhpcy5zZXJ2aWNlID0gc2VydmljZTtcbiAgICAgICAgICAgICQuZXh0ZW5kKHRoaXMub3B0aW9ucywgc2VydmljZXNbc2VydmljZV0pO1xuICAgICAgICB9LFxuXG4gICAgICAgIGRldGVjdFBhcmFtczogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgZGF0YSA9IHRoaXMud2lkZ2V0LmRhdGEoKTtcblxuICAgICAgICAgICAgLy8gQ3VzdG9tIHBhZ2UgY291bnRlciBVUkwgb3IgbnVtYmVyXG4gICAgICAgICAgICBpZiAoZGF0YS5jb3VudGVyKSB7XG4gICAgICAgICAgICAgICAgdmFyIG51bWJlciA9IHBhcnNlSW50KGRhdGEuY291bnRlciwgMTApO1xuICAgICAgICAgICAgICAgIGlmIChpc05hTihudW1iZXIpKSB7XG4gICAgICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5jb3VudGVyVXJsID0gZGF0YS5jb3VudGVyO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICAgICAgdGhpcy5vcHRpb25zLmNvdW50ZXJOdW1iZXIgPSBudW1iZXI7XG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSB0aXRsZVxuICAgICAgICAgICAgaWYgKGRhdGEudGl0bGUpIHtcbiAgICAgICAgICAgICAgICB0aGlzLm9wdGlvbnMudGl0bGUgPSBkYXRhLnRpdGxlO1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy5wb3N0X3RpdGxlID0gdGhpcy5vcHRpb25zLnRpdGxlO1xuICAgICAgICAgICAgICAgIGRlbGV0ZSBkYXRhLnRpdGxlO1xuICAgICAgICAgICAgfVxuXG4gICAgICAgICAgICAvLyBDdXN0b20gcGFnZSBVUkxcbiAgICAgICAgICAgIGlmIChkYXRhLnVybCkge1xuICAgICAgICAgICAgICAgIHRoaXMub3B0aW9ucy51cmwgPSBkYXRhLnVybDtcbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBpbml0SHRtbDogZnVuY3Rpb24oKSB7XG4gICAgICAgICAgICB2YXIgb3B0aW9ucyA9IHRoaXMub3B0aW9ucztcbiAgICAgICAgICAgIHZhciB3aWRnZXQgPSB0aGlzLndpZGdldDtcblxuICAgICAgICAgICAgdmFyIGJ1dHRvbiA9IHdpZGdldDtcblxuICAgICAgICAgICAgaWYgKG9wdGlvbnMuY2xpY2tVcmwpIHtcbiAgICAgICAgICAgICAgICB2YXIgdXJsID0gbWFrZVVybChvcHRpb25zLmNsaWNrVXJsLCB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy51cmwsXG4gICAgICAgICAgICAgICAgICAgIHBvc3RfdGl0bGU6IG9wdGlvbnMucG9zdF90aXRsZVxuICAgICAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgICAgIHZhciBsaW5rID0gJCgnPGE+Jywge1xuICAgICAgICAgICAgICAgICAgICBocmVmOiB1cmxcbiAgICAgICAgICAgICAgICB9KTtcbiAgICAgICAgICAgICAgICB0aGlzLmNsb25lRGF0YUF0dHJzKHdpZGdldCwgbGluayk7XG4gICAgICAgICAgICAgICAgd2lkZ2V0LnJlcGxhY2VXaXRoKGxpbmspO1xuICAgICAgICAgICAgICAgIHRoaXMud2lkZ2V0ID0gd2lkZ2V0ID0gbGluaztcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgICAgIHdpZGdldC5vbignY2xpY2snLCAkLnByb3h5KHRoaXMuY2xpY2ssIHRoaXMpKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIF93aWRnZXQgPSB3aWRnZXQuZ2V0KDApO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0LnJvbGUgPSAndG9vbHRpcCc7XG4gICAgICAgICAgICBfd2lkZ2V0LmRhdGFzZXQubWljcm90aXBQb3NpdGlvbiA9ICd0b3AnO1xuICAgICAgICAgICAgX3dpZGdldC5kYXRhc2V0Lm1pY3JvdGlwU2l6ZSA9ICdzbWFsbCc7XG4gICAgICAgICAgICBfd2lkZ2V0LnNldEF0dHJpYnV0ZSgnYXJpYS1sYWJlbCcsIHdpZGdldC50ZXh0KCkpO1xuICAgICAgICAgICAgLy8gd2lkZ2V0LnRvb2x0aXAoeyB0aXRsZSA6IHdpZGdldC50ZXh0KCksIGFuaW1hdGlvbjogZmFsc2UgfSk7XG5cbiAgICAgICAgICAgIHRoaXMuYnV0dG9uID0gYnV0dG9uO1xuICAgICAgICB9LFxuXG4gICAgICAgIGluaXRDb3VudGVyOiBmdW5jdGlvbigpIHtcbiAgICAgICAgfSxcblxuICAgICAgICBjbG9uZURhdGFBdHRyczogZnVuY3Rpb24oc291cmNlLCBkZXN0aW5hdGlvbikge1xuICAgICAgICAgICAgdmFyIGRhdGEgPSBzb3VyY2UuZGF0YSgpO1xuICAgICAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgICAgICBpZiAoZGF0YS5oYXNPd25Qcm9wZXJ0eShrZXkpKSB7XG4gICAgICAgICAgICAgICAgICAgIGRlc3RpbmF0aW9uLmRhdGEoa2V5LCBkYXRhW2tleV0pO1xuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgfSxcblxuICAgICAgICBnZXRFbGVtZW50Q2xhc3NOYW1lczogZnVuY3Rpb24oZWxlbSkge1xuICAgICAgICAgICAgcmV0dXJuIGdldEVsZW1lbnRDbGFzc05hbWVzKGVsZW0sIHRoaXMuc2VydmljZSk7XG4gICAgICAgIH0sXG5cbiAgICAgICAgdXBkYXRlQ291bnRlcjogZnVuY3Rpb24obnVtYmVyKSB7XG4gICAgICAgICAgICBudW1iZXIgPSBwYXJzZUludChudW1iZXIsIDEwKSB8fCAwO1xuXG4gICAgICAgICAgICB2YXIgcGFyYW1zID0ge1xuICAgICAgICAgICAgICAgICdjbGFzcyc6IHRoaXMuZ2V0RWxlbWVudENsYXNzTmFtZXMoJ2NvdW50ZXInKSxcbiAgICAgICAgICAgICAgICAndGV4dCc6IG51bWJlclxuICAgICAgICAgICAgfTtcbiAgICAgICAgICAgIGlmICghbnVtYmVyICYmICF0aGlzLm9wdGlvbnMuemVyb2VzKSB7XG4gICAgICAgICAgICAgICAgcGFyYW1zWydjbGFzcyddICs9ICcgJyArIHByZWZpeCArICdfX2NvdW50ZXJfZW1wdHknO1xuICAgICAgICAgICAgICAgIHBhcmFtcy50ZXh0ID0gJyc7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB2YXIgY291bnRlckVsZW0gPSAkKCc8c3Bhbj4nLCBwYXJhbXMpO1xuICAgICAgICAgICAgdGhpcy53aWRnZXQuYXBwZW5kKGNvdW50ZXJFbGVtKTtcblxuICAgICAgICAgICAgdGhpcy53aWRnZXQudHJpZ2dlcignY291bnRlci4nICsgcHJlZml4LCBbdGhpcy5zZXJ2aWNlLCBudW1iZXJdKTtcbiAgICAgICAgfSxcblxuICAgICAgICBjbGljazogZnVuY3Rpb24oZSkge1xuICAgICAgICAgICAgdmFyIG9wdGlvbnMgPSB0aGlzLm9wdGlvbnM7XG4gICAgICAgICAgICB2YXIgcHJvY2VzcyA9IHRydWU7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKG9wdGlvbnMuY2xpY2spKSB7XG4gICAgICAgICAgICAgICAgcHJvY2VzcyA9IG9wdGlvbnMuY2xpY2suY2FsbCh0aGlzLCBlKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIGlmIChwcm9jZXNzKSB7XG4gICAgICAgICAgICAgICAgdmFyIGNvbnRleHQgPSB7XG4gICAgICAgICAgICAgICAgICAgIHVybDogb3B0aW9ucy51cmwsXG4gICAgICAgICAgICAgICAgICAgIHBvc3RfdGl0bGU6IG9wdGlvbnMucG9zdF90aXRsZVxuICAgICAgICAgICAgICAgIH07XG4gICAgICAgICAgICAgICAgaWYgKCB0aGlzLndpZGdldC5kYXRhKCdtZWRpYScpICkge1xuICAgICAgICAgICAgICAgICAgICBjb250ZXh0Lm1lZGlhID0gdGhpcy53aWRnZXQuZGF0YSgnbWVkaWEnKTtcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgICAgdmFyIHVybCA9IG1ha2VVcmwob3B0aW9ucy5wb3B1cFVybCwgY29udGV4dCk7XG4gICAgICAgICAgICAgICAgdXJsID0gdGhpcy5hZGRBZGRpdGlvbmFsUGFyYW1zVG9VcmwodXJsKTtcbiAgICAgICAgICAgICAgICB0aGlzLm9wZW5Qb3B1cCh1cmwsIHtcbiAgICAgICAgICAgICAgICAgICAgd2lkdGg6IG9wdGlvbnMucG9wdXBXaWR0aCxcbiAgICAgICAgICAgICAgICAgICAgaGVpZ2h0OiBvcHRpb25zLnBvcHVwSGVpZ2h0XG4gICAgICAgICAgICAgICAgfSk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICByZXR1cm4gZmFsc2U7XG4gICAgICAgIH0sXG5cbiAgICAgICAgYWRkQWRkaXRpb25hbFBhcmFtc1RvVXJsOiBmdW5jdGlvbih1cmwpIHtcbiAgICAgICAgICAgIHZhciBkYXRhID0gIGRhdGFUb09wdGlvbnModGhpcy53aWRnZXQpO1xuICAgICAgICAgICAgdmFyIHBhcmFtcyA9ICQucGFyYW0oJC5leHRlbmQoZGF0YSwgdGhpcy5vcHRpb25zLmRhdGEpKTtcbiAgICAgICAgICAgIGlmICgkLmlzRW1wdHlPYmplY3QocGFyYW1zKSkgcmV0dXJuIHVybDtcbiAgICAgICAgICAgIHZhciBnbHVlID0gdXJsLmluZGV4T2YoJz8nKSA9PT0gLTEgPyAnPycgOiAnJic7XG4gICAgICAgICAgICByZXR1cm4gdXJsICsgZ2x1ZSArIHBhcmFtcztcbiAgICAgICAgfSxcblxuICAgICAgICBvcGVuUG9wdXA6IGZ1bmN0aW9uKHVybCwgcGFyYW1zKSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IE1hdGgucm91bmQoc2NyZWVuLndpZHRoLzIgLSBwYXJhbXMud2lkdGgvMik7XG4gICAgICAgICAgICB2YXIgdG9wID0gMDtcbiAgICAgICAgICAgIGlmIChzY3JlZW4uaGVpZ2h0ID4gcGFyYW1zLmhlaWdodCkge1xuICAgICAgICAgICAgICAgIHRvcCA9IE1hdGgucm91bmQoc2NyZWVuLmhlaWdodC8zIC0gcGFyYW1zLmhlaWdodC8yKTtcbiAgICAgICAgICAgIH1cblxuICAgICAgICAgICAgdmFyIHdpbiA9IHdpbmRvdy5vcGVuKHVybCwgJ3NsXycgKyB0aGlzLnNlcnZpY2UsICdsZWZ0PScgKyBsZWZ0ICsgJyx0b3A9JyArIHRvcCArICcsJyArXG4gICAgICAgICAgICAgICAnd2lkdGg9JyArIHBhcmFtcy53aWR0aCArICcsaGVpZ2h0PScgKyBwYXJhbXMuaGVpZ2h0ICsgJyxwZXJzb25hbGJhcj0wLHRvb2xiYXI9MCxzY3JvbGxiYXJzPTEscmVzaXphYmxlPTEnKTtcbiAgICAgICAgICAgIGlmICh3aW4pIHtcbiAgICAgICAgICAgICAgICB3aW4uZm9jdXMoKTtcbiAgICAgICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdwb3B1cF9vcGVuZWQuJyArIHByZWZpeCwgW3RoaXMuc2VydmljZSwgd2luXSk7XG4gICAgICAgICAgICAgICAgdmFyIHRpbWVyID0gc2V0SW50ZXJ2YWwoJC5wcm94eShmdW5jdGlvbigpIHtcbiAgICAgICAgICAgICAgICAgICAgaWYgKCF3aW4uY2xvc2VkKSByZXR1cm47XG4gICAgICAgICAgICAgICAgICAgIGNsZWFySW50ZXJ2YWwodGltZXIpO1xuICAgICAgICAgICAgICAgICAgICB0aGlzLndpZGdldC50cmlnZ2VyKCdwb3B1cF9jbG9zZWQuJyArIHByZWZpeCwgdGhpcy5zZXJ2aWNlKTtcbiAgICAgICAgICAgICAgICB9LCB0aGlzKSwgdGhpcy5vcHRpb25zLnBvcHVwQ2hlY2tJbnRlcnZhbCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICBlbHNlIHtcbiAgICAgICAgICAgICAgICBsb2NhdGlvbi5ocmVmID0gdXJsO1xuICAgICAgICAgICAgfVxuICAgICAgICB9XG4gICAgfTtcblxuXG4gICAgLyoqXG4gICAgICogSGVscGVyc1xuICAgICAqL1xuXG4gICAgIC8vIENhbWVsaXplIGRhdGEtYXR0cmlidXRlc1xuICAgIGZ1bmN0aW9uIGRhdGFUb09wdGlvbnMoZWxlbSkge1xuICAgICAgICBmdW5jdGlvbiB1cHBlcihtLCBsKSB7XG4gICAgICAgICAgICByZXR1cm4gbC50b1VwcGVyKCk7XG4gICAgICAgIH1cbiAgICAgICAgdmFyIG9wdGlvbnMgPSB7fTtcbiAgICAgICAgdmFyIGRhdGEgPSBlbGVtLmRhdGEoKTtcbiAgICAgICAgZm9yICh2YXIga2V5IGluIGRhdGEpIHtcbiAgICAgICAgICAgIGlmICgga2V5ID09ICd0b29sdGlwJyApIHsgY29udGludWUgOyB9XG4gICAgICAgICAgICB2YXIgdmFsdWUgPSBkYXRhW2tleV07XG4gICAgICAgICAgICBpZiAodmFsdWUgPT09ICd5ZXMnKSB2YWx1ZSA9IHRydWU7XG4gICAgICAgICAgICBlbHNlIGlmICh2YWx1ZSA9PT0gJ25vJykgdmFsdWUgPSBmYWxzZTtcbiAgICAgICAgICAgIG9wdGlvbnNba2V5LnJlcGxhY2UoLy0oXFx3KS9nLCB1cHBlcildID0gdmFsdWU7XG4gICAgICAgIH1cbiAgICAgICAgcmV0dXJuIG9wdGlvbnM7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gbWFrZVVybCh1cmwsIGNvbnRleHQpIHtcbiAgICAgICAgcmV0dXJuIHRlbXBsYXRlKHVybCwgY29udGV4dCwgZW5jb2RlVVJJQ29tcG9uZW50KTtcbiAgICB9XG5cbiAgICBmdW5jdGlvbiB0ZW1wbGF0ZSh0bXBsLCBjb250ZXh0LCBmaWx0ZXIpIHtcbiAgICAgICAgcmV0dXJuIHRtcGwucmVwbGFjZSgvXFx7KFteXFx9XSspXFx9L2csIGZ1bmN0aW9uKG0sIGtleSkge1xuICAgICAgICAgICAgLy8gSWYga2V5IGRvZXNuJ3QgZXhpc3RzIGluIHRoZSBjb250ZXh0IHdlIHNob3VsZCBrZWVwIHRlbXBsYXRlIHRhZyBhcyBpc1xuICAgICAgICAgICAgcmV0dXJuIGtleSBpbiBjb250ZXh0ID8gKGZpbHRlciA/IGZpbHRlcihjb250ZXh0W2tleV0pIDogY29udGV4dFtrZXldKSA6IG07XG4gICAgICAgIH0pO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGdldEVsZW1lbnRDbGFzc05hbWVzKGVsZW0sIG1vZCkge1xuICAgICAgICB2YXIgY2xzID0gY2xhc3NQcmVmaXggKyBlbGVtO1xuICAgICAgICByZXR1cm4gY2xzICsgJyAnICsgY2xzICsgJ18nICsgbW9kO1xuICAgIH1cblxuICAgIGZ1bmN0aW9uIGNsb3NlT25DbGljayhlbGVtLCBjYWxsYmFjaykge1xuICAgICAgICBmdW5jdGlvbiBoYW5kbGVyKGUpIHtcbiAgICAgICAgICAgIGlmICgoZS50eXBlID09PSAna2V5ZG93bicgJiYgZS53aGljaCAhPT0gMjcpIHx8ICQoZS50YXJnZXQpLmNsb3Nlc3QoZWxlbSkubGVuZ3RoKSByZXR1cm47XG4gICAgICAgICAgICBlbGVtLnJlbW92ZUNsYXNzKG9wZW5DbGFzcyk7XG4gICAgICAgICAgICBkb2Mub2ZmKGV2ZW50cywgaGFuZGxlcik7XG4gICAgICAgICAgICBpZiAoJC5pc0Z1bmN0aW9uKGNhbGxiYWNrKSkgY2FsbGJhY2soKTtcbiAgICAgICAgfVxuICAgICAgICB2YXIgZG9jID0gJChkb2N1bWVudCk7XG4gICAgICAgIHZhciBldmVudHMgPSAnY2xpY2sgdG91Y2hzdGFydCBrZXlkb3duJztcbiAgICAgICAgZG9jLm9uKGV2ZW50cywgaGFuZGxlcik7XG4gICAgfVxuXG4gICAgZnVuY3Rpb24gc2hvd0luVmlld3BvcnQoZWxlbSkge1xuICAgICAgICB2YXIgb2Zmc2V0ID0gMTA7XG4gICAgICAgIGlmIChkb2N1bWVudC5kb2N1bWVudEVsZW1lbnQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KSB7XG4gICAgICAgICAgICB2YXIgbGVmdCA9IHBhcnNlSW50KGVsZW0uY3NzKCdsZWZ0JyksIDEwKTtcbiAgICAgICAgICAgIHZhciB0b3AgPSBwYXJzZUludChlbGVtLmNzcygndG9wJyksIDEwKTtcblxuICAgICAgICAgICAgdmFyIHJlY3QgPSBlbGVtWzBdLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgICAgaWYgKHJlY3QubGVmdCA8IG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygnbGVmdCcsIG9mZnNldCAtIHJlY3QubGVmdCArIGxlZnQpO1xuICAgICAgICAgICAgZWxzZSBpZiAocmVjdC5yaWdodCA+IHdpbmRvdy5pbm5lcldpZHRoIC0gb2Zmc2V0KVxuICAgICAgICAgICAgICAgIGVsZW0uY3NzKCdsZWZ0Jywgd2luZG93LmlubmVyV2lkdGggLSByZWN0LnJpZ2h0IC0gb2Zmc2V0ICsgbGVmdCk7XG5cbiAgICAgICAgICAgIGlmIChyZWN0LnRvcCA8IG9mZnNldClcbiAgICAgICAgICAgICAgICBlbGVtLmNzcygndG9wJywgb2Zmc2V0IC0gcmVjdC50b3AgKyB0b3ApO1xuICAgICAgICAgICAgZWxzZSBpZiAocmVjdC5ib3R0b20gPiB3aW5kb3cuaW5uZXJIZWlnaHQgLSBvZmZzZXQpXG4gICAgICAgICAgICAgICAgZWxlbS5jc3MoJ3RvcCcsIHdpbmRvdy5pbm5lckhlaWdodCAtIHJlY3QuYm90dG9tIC0gb2Zmc2V0ICsgdG9wKTtcbiAgICAgICAgfVxuICAgICAgICBlbGVtLmFkZENsYXNzKG9wZW5DbGFzcyk7XG4gICAgfVxuXG5cbiAgICAvKipcbiAgICAgKiBBdXRvIGluaXRpYWxpemF0aW9uXG4gICAgICovXG4gICAgJChmdW5jdGlvbigpIHtcbiAgICAgICAgJCgnLicgKyBwcmVmaXgpLnNvY2lhbExpbmtzKCk7XG4gICAgfSk7XG5cbn0pKTtcbiIsImhlYWQucmVhZHkoZnVuY3Rpb24oKSB7XG5cbiAgICAkKFwiI3ZlcnNpb25JY29uXCIpLmNsaWNrKGZ1bmN0aW9uKGUpIHtcbiAgICAgICAgZS5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICBib290Ym94LmFsZXJ0KFwiPHA+VGhpcyBpcyB0aGUgZGF0ZSB3aGVuIHRoaXMgaXRlbSB3YXMgbGFzdCB1cGRhdGVkLiBWZXJzaW9uIGRhdGVzIGFyZSB1cGRhdGVkIHdoZW4gaW1wcm92ZW1lbnRzIHN1Y2ggYXMgaGlnaGVyIHF1YWxpdHkgc2NhbnMgb3IgbW9yZSBjb21wbGV0ZSBzY2FucyBoYXZlIGJlZW4gbWFkZS4gPGJyIC8+PGJyIC8+PGEgaHJlZj1cXFwiL2NnaS9mZWVkYmFjaz9wYWdlPWZvcm1cXFwiIGRhdGEtZGVmYXVsdC1mb3JtPVxcXCJkYXRhLWRlZmF1bHQtZm9ybVxcXCIgZGF0YS10b2dnbGU9XFxcImZlZWRiYWNrIHRyYWNraW5nLWFjdGlvblxcXCIgZGF0YS1pZD1cXFwiXFxcIiBkYXRhLXRyYWNraW5nLWFjdGlvbj1cXFwiU2hvdyBGZWVkYmFja1xcXCI+Q29udGFjdCB1czwvYT4gZm9yIG1vcmUgaW5mb3JtYXRpb24uPC9wPlwiKVxuICAgIH0pO1xuXG59KTtcbiJdfQ==
