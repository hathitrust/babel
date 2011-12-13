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
                  console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                  
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
    
    display_warning : function(req) {
      var self = this;

      var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
      var rate = req.getResponseHeader('X-Choke-Rate')

      if ( timeout <= 5 ) {
          // just punt and wait it out
          setTimeout(function() {
            self.retry_download();
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
          '<p><button> OK </button></p>' + 
        '</div>').replace('{rate}', rate).replace('{countdown}', countdown);

      self.notice = new Boxy(html, {
          show: true,
          modal: true,
          draggable: true,
          closeable: true,
          title: "",
          behaviours: function(r) {
            
            $(r).find("button").click(function() {
              clearTimeout(self.countdown_timer);
              Boxy.get(r).hideAndUnload();
            })
            
            setTimeout(function() {

              // and restart the timer!
              // self.countdown_timer = setInterval(function() { self.recheck(); }, 500);
              
              // wait for user to click...

            }, countdown * 1000 + 1000);

            self.countdown_timer = setInterval(function() {
              countdown -= 1;
              $(r).find("#throttle-timeout").text(countdown);
              if ( countdown == 0 ) {
                clearInterval(self.countdown_timer);
              }
              console.log("TIC TOC", countdown);
            }, 1000);

          }
      });

    },
  
    update_progress: function(contents, total) {
      var status = { done : false, error : false };
      
      var percent;
      
      if ( HT.pdf_helpers.current == -1 ) {
        HT.pdf_helpers.$content.find(".meter-text").text('Building PDF');
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
                  'Setting up PDF...' +
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
      // setTimeout(function() {
      //   if ( HT.pdf_helpers.current == -1 ) {
      //     console.log("DOWNLOAD STARTUP NOT DETECTED");
      //     HT.pdf_helpers.$notice.hide(function() {
      //       HT.pdf_helpers.show_error();
      //     })
      //   }
      // }, 5000);
      
      // empty out the iframe and create a new blank one pointing to the actual
      /// PDF download.
      //// $("div#fullPdfFrame").empty().append('<iframe src="' + src + ';callback=HT.pdf_helpers.open_progress"></iframe>');
      
      /// start PDF download via <script> callback
      $.ajax({
        url: src + ';callback=HT.pdf_helpers.open_progress;seq=10;seq=15;seq=25;seq=35',
        dataType: 'script',
        cache: false,
        error: function(req, textStatus, errorThrown) {
          console.log("DOWNLOAD STARTUP NOT DETECTED");
          HT.pdf_helpers.$notice.hide(function() {
            if ( req.status == 503 ) {
              HT.pdf_helpers.display_warning(req);
            } else {
              HT.pdf_helpers.show_error();
            }
          })
        }
      })
      
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
