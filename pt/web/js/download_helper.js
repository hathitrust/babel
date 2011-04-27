// avoid polluting the global namespace
var HT = HT || {};

HT.pdf_helpers = {
    
    is_running: false,
    inter: null,
  
    open_progress: function(progress_url, download_url, total) {
        
      if ( HT.pdf_helpers.inter ) {
        // already polling
        console.log("ALREADY POLLING!");
        return;
      }
      
      HT.pdf_helpers.progress_url = progress_url;
      HT.pdf_helpers.download_url = download_url;
      HT.pdf_helpers.total = total;
      HT.pdf_helpers.is_running = true;
      
      
      // this means the PDF has been located so...
      var $contents = $("div#fullPdfFrame").find("iframe").contents();
      HT.pdf_helpers.update_progress($contents, total);
      
      var idx = 0;
      var processed = 0;
      var run = function() {
          idx += 1;
          $.ajax({
              url : progress_url,
              data : { ts : (new Date).getTime() },
              cache : false,
              dataType : "html",
              success : function(data) {
                  var status = HT.pdf_helpers.update_progress(data, total);
                  var log = $.trim(data).split("\n").reverse();
                  processed += 1;
                  
                  if ( status.done ) {
                    HT.pdf_helpers.$notice.hide(function() {
                      HT.pdf_helpers.show_download_link(download_url);
                    })
                    clearInterval(HT.pdf_helpers.inter);
                    HT.pdf_helpers.inter = null;
                    
                  } else if ( status.error ) {
                    HT.pdf_helpers.$notice.hide(function() {
                      HT.pdf_helpers.show_error();
                    })
                    
                    clearInterval(HT.pdf_helpers.inter);
                    HT.pdf_helpers.inter = null;
                    
                  }
              },
              error : function(req, textStatus, errorThrown) {
                  // console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                  
                  if ( req.status == 503 ) {
                    // throttling error; clear interval and try again later
                    clearInterval(HT.pdf_helpers.inter);
                    HT.pdf_helpers.inter = null;

                    setTimeout(function() {
                      HT.pdf_helpers.inter = setInterval(run, 2000);
                    }, 1000);

                  } else if ( ( eq.status == 404 ) && (idx > 25 || processed > 0) ) {
                      
                      clearInterval(HT.pdf_helpers.inter);
                      HT.pdf_helpers.inter = null;

                      HT.pdf_helpers.$notice.hide(function() {
                        HT.pdf_helpers.show_error();
                      });
                  }
              }
          });
      }

      // first run is in half a millisecond
      HT.pdf_helpers.inter = setInterval(run, 2000);
      
    },
    
    show_download_link : function(download_url) {
      // need to change color of .meter-value to make change obvious!!!
      var html = 
      '<div class="fullPdfAlert">' +
        '<div>' +
          '<p><strong>Your PDF is ready!</strong></p>' +
          '<p><a href="' + download_url + '">Download PDF</a></p>' +
        '</div>' +
      '</div>';
      
      var $notice = new Boxy(html, {
          show: true,
          modal: true,
          draggable: true,
          closeable: false,
          title: "",
          behaviours: function(r) {
              $(r).find("a").click(function() {
                  setTimeout(function() {
                    Boxy.get(r).hide();
                  }, 500);
                  return true;
              })
          }
      });
      
    },
    
    show_error : function() {
      var html =
      '<div class="fullPdfAlert">' +
      '<p>' +
      'There was a problem building your PDF; staff have been notified.' +
      '</p>' + 
      '<p>' + 
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
    },
  
    update_progress: function(contents, total) {
      var status = { done : false, error : false };
      
      var percent;
      
      if ( HT.pdf_helpers.currrent == -1 ) {
        window.guts = contents;
      }
      
      
      var current = $(contents).find("#current").data("value");
      if ( current == "EOT" ) {
        status.done = true;
        percent = 100;
      } else {
        current = parseInt(current);
        percent = 100 * (current / total);
      }
      
      // track current
      HT.pdf_helpers.current = current;
      
      if ( self.last_percent != percent ) {
        self.last_percent = percent;
        self.attempts = 0;
      } else {
        self.attempts += 1;
      }
      
      if ( self.attempts > 5 ) {
        status.error = true;
      }
      
      HT.pdf_helpers.$content.find(".meter-value").css('width', percent + "%");
      
      return status;
    },
  
    download_pdf : function(self) {
      
      var src = $(self).attr('href');
      
      var html = 
      '<div class="meter-wrap">' +
          '<div class="meter-value" style="background-color: #EF7A06; width: 0%">' +
              '<div class="meter-text">' +
                  'Building PDF...' +
              '</div>' +
          '</div>' +
      '</div>';

      HT.pdf_helpers.$notice = new Boxy(html, {
         show : true,
         modal : true,
         draggable : true,
         closeable : false,
         title : "" 
      });

      HT.pdf_helpers.$content = HT.pdf_helpers.$notice.getContent();
      HT.pdf_helpers.current = -1;
      
      // set a timer in case the iframe fails to load!
      setTimeout(function() {
        if ( HT.pdf_helpers.current == -1 ) {
          console.log("DOWNLOAD STARTUP NOT DETECTED");
          HT.pdf_helpers.$notice.hide(function() {
            HT.pdf_helpers.show_error();
          })
        }
      }, 5000);
      
      // empty out the iframe and create a new blank one pointing to the actual
      /// PDF download.
      $("div#fullPdfFrame").empty().append('<iframe src="' + src + ';callback=HT.pdf_helpers.open_progress"></iframe>');
      
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
    $("a#fullPdfLink").addClass("dialog").addClass("interactive").click(function() {
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
