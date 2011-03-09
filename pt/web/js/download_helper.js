// avoid polluting the global namespace
var HT = HT || {};
HT.pdf_helpers = {
     download_pdf : function(self) {
         
        var progress = (((1+Math.random())*0x10000)|0).toString(16) + "." + (new Date()).getTime() + ".txt";
        progress = progress.substr(0,1) + "/" + progress.substr(1,1) + "/" + progress.substr(2,1) + "/" + progress;
        var src = $(self).attr('href') + ";progress=" + progress;

        var progress_url = HT.config.download_progress_base + "/" + progress;

        var html = 
        '<div class="meter-wrap">' +
            '<div class="meter-value" style="background-color: #EF7A06; width: 0%">' +
                '<div class="meter-text">' +
                    'Generating PDF...' +
                '</div>' +
            '</div>' +
        '</div>';

        var $notice = new Boxy(html, {
           show : true,
           modal : true,
           draggable : true,
           closeable : false,
           title : "" 
        });

        var $content = $notice.getContent();

        // empty out the iframe and create a new blank one pointing to the actual
        /// PDF download.
        $("div#fullPdfFrame").empty().append('<iframe src="' + src + '"></iframe>');

        var inter = null;
        var idx = 0;
        var processed = 0;

        var show_error = function() {
            var html =
            '<div class="fullPdfAlert">' +
            '<p>' +
            'There was a problem building your PDF; staff have been notified. ' +
            'Please try again in 24 hours.' +
            '</p>' +
            '<p class="align-right">' +
            '<button>OK</button>' +
            '</p>' +
            '</div>';

            var $notice = new Boxy(html, {
                show: true,
                modal: true,
                draggable: true,
                closeable: false,
                title: "",
                behaviours: function(r) {
                    $(r).find("button").click(function() {
                        Boxy.get(r).hide();
                    })
                }
            });

        }


        var run = function() {
            idx += 1;
            $.ajax({
                url : progress_url,
                cache : false,
                success : function(data) {
                    var log = $.trim(data).split("\n").reverse();
                    processed += 1;
                    if(log.length > 0) {
                        var current = log[0].split(":");
                        //console.log("CURRENT =", current);
                        if(current[0] == 'EOT') {
                            // download done, so stop
                            clearInterval(inter);
                            $content.find(".meter-value").css("width", "100%");
                            setTimeout(function() {
                                $notice.hide();
                            }, 500);

                        } else if ( current[0] == 'ERROR' ) {

                            $notice.hide(function() {
                                show_error();
                            })

                            clearInterval(inter);
                        } else {
                            var percent = parseInt(current[0]) / parseInt(current[1]);
                            percent = Math.ceil(percent * 100);
                            $content.find(".meter-value").css('width', percent + "%");
                        }
                    }
                },
                error : function(req, textStatus, errorThrown) {
                    // console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                    if ( req.status == 404 && (idx > 5 || processed > 0) ) {
                        clearInterval(inter);
                        $notice.hide();
                    }
                }
            });
        }

        // first run is in half a millisecond
        inter = setInterval(run, 2000);
    },
    
    explain_pdf_access : function(self) {
        var $notice = new Boxy($("#noPdfAccess").html(), {
            show: true,
            modal: true,
            draggable: true,
            closeable: false,
            clone: true,
            title: "",
            behaviours: function(r) {
                $('<p class="align-right"><button>OK</button></p>')
                    .appendTo(r)
                    .find("button").click(function() {
                        Boxy.get(r).hide();
                    })
            }
        });
    }
    
};
  
// depends on jQuery
$(document).ready(function() {
    $("a#fullPdfLink").addClass("dialog").click(function() {
        if ( $(this).attr('rel') == 'allow' ) {
            // if there's no progress base, punt on the progress bar
            if ( HT.config.download_progress_base == null ) {
                return true;
            }
            HT.pdf_helpers.download_pdf(this);
        } else {
            HT.pdf_helpers.explain_pdf_access(this);
        }
        return false;
    });
});
