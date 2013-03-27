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
            '<div class="progress progress-striped active">' +
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
                        console.log("CANCELING THE PDF");
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
                self.$dialog.model('hide');
                if ( req.status == 503 ) {
                    self.displayWarning(req);
                } else {
                    self.showEror();
                }
            }
        });

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

        self.$dialog.find(".bar").css({ width : percent + '%'});

        if ( percent == 100 ) {
            self.$dialog.find(".progress").hide();
            self.$dialog.find(".done").show();
            self.$dialog.find(".download-pdf").show();
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

