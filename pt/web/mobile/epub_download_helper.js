// avoid polluting the global namespace
var HT = HT || {};

HT.epub_helpers = {
    
    is_running: false,
    inter: null,
  
    open_progress: function(progress_url, download_url, total) {
        
      if ( HT.epub_helpers.inter ) {
        // already polling
        console.log("ALREADY POLLING!");
        return;
      }
      
      HT.epub_helpers.progress_url = progress_url;
      HT.epub_helpers.download_url = download_url;
      HT.epub_helpers.total = total;
      HT.epub_helpers.is_running = true;
      
      
      // this means the epub has been located so...
      var $contents = $("div#fullEpubFrame").find("iframe").contents();
      HT.epub_helpers.update_progress($contents, total);
      
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
                  var status = HT.epub_helpers.update_progress(data, total);
                  var log = $.trim(data).split("\n").reverse();
                  processed += 1;
                  
                  if ( status.done ) {
                    HT.epub_helpers.$notice.hide(function() {
                      HT.epub_helpers.show_download_link(download_url);
                    })
                    clearInterval(HT.epub_helpers.inter);
                    HT.epub_helpers.inter = null;
                    
                  } else if ( status.error ) {
                    HT.epub_helpers.$notice.hide(function() {
                      HT.epub_helpers.show_error();
                    })
                    
                    clearInterval(HT.epub_helpers.inter);
                    HT.epub_helpers.inter = null;
                    
                  }
              },
              error : function(req, textStatus, errorThrown) {
                  console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);
                  
                  if ( req.status == 503 ) {
                    // throttling error; clear interval and try again later
                    clearInterval(HT.epub_helpers.inter);
                    HT.epub_helpers.inter = null;

                    setTimeout(function() {
                      HT.epub_helpers.inter = setInterval(run, 2000);
                    }, 1000);

                  } else if ( ( eq.status == 404 ) && (idx > 25 || processed > 0) ) {
                      
                      clearInterval(HT.epub_helpers.inter);
                      HT.epub_helpers.inter = null;

                      HT.epub_helpers.$notice.hide(function() {
                        HT.epub_helpers.show_error();
                      });
                  }
              }
          });
      }

      // first run is in half a millisecond
      HT.epub_helpers.inter = setInterval(run, 2000);
      
    },
    
    show_download_link : function(download_url) {
      // need to change color of .meter-value to make change obvious!!!
      var html = 
      '<div class="fullEpubAlert">' +
        '<div>' +
          '<p><strong>Your EPUB is ready!</strong></p>' +
          '<p><a href="' + download_url + '">Download EPUB</a></p>' +
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
      '<div class="fullEpubAlert">' +
      '<p>' +
      'There was a problem building your EPUB; staff have been notified.' +
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
      
      if ( HT.epub_helpers.current == -1 ) {
        HT.epub_helpers.$content.find(".meter-text").text('Building EPUB');
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
      HT.epub_helpers.current = current;
      
      if ( self.last_percent != percent ) {
        self.last_percent = percent;
        self.attempts = 0;
      } else {
        self.attempts += 1;
      }
      
      if ( self.attempts > 5 ) {
        status.error = true;
      }
      
      HT.epub_helpers.$content.find(".meter-value").css('width', percent + "%");
      
      return status;
    },
  
    download_epub : function(self) {
      
      var src = $(self).attr('href');
      src=src.replace('download/pdf','download/epub');
      
      var html = 
      '<div class="meter-wrap">' +
          '<div class="meter-value" style="background-color: #EF7A06; width: 0%">' +
              '<div class="meter-text">' +
                  'Setting up EPUB...' +
              '</div>' +
          '</div>' +
      '</div>';

      HT.epub_helpers.$notice = new Boxy(html, {
         show : true,
         modal : true,
         draggable : true,
         closeable : false,
         title : "" 
      });

      HT.epub_helpers.$content = HT.epub_helpers.$notice.getContent();
      HT.epub_helpers.current = -1;
      
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
        url: src + ';callback=HT.epub_helpers.open_progress',
        dataType: 'script',
        cache: false,
        error: function() {
          console.log("DOWNLOAD STARTUP NOT DETECTED");
          HT.epub_helpers.$notice.hide(function() {
            HT.epub_helpers.show_error();
          })
        }
      })
      
    },
  
    explain_epub_access : function(self) {
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
    $("#epubLink").addClass("dialog").addClass("interactive").click(function() {
        if ( $(this).attr('rel') == 'allow' ) {
            // if there's no progress base, punt on the progress bar
            if ( HT.config.download_progress_base == null ) {
                return true;
            }
            HT.epub_helpers.download_epub(this);
        } else {
            HT.epub_helpers.explain_epub_access(this);
        }
        return false;
    });
});
