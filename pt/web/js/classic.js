var HT = HT || {};

// HT.monitor = {
//   
//   inter : null,
//   
//   run : function() {
//     var self = this;
//     
//     if ( this.inter != null ) {
//       return;
//     }
//     
//     var ping = function() {
//       $.ajax({
//           url : "/common/robots.txt",
//           data : { ts : (new Date).getTime() },
//           cache : false,
//           success: function(data) {
//             // NOOP
//           },
//           error : function(req, textStatus, errorThrown) {
//             // stop for any error (e.g. network down)
//             self.stop();
//             if ( req.status == 503 ) {
//               var tmp = req.responseText.match(/for the next (\d+) seconds/);
//               var timeout = tmp[1];
//               
//               if ( timeout <= 5 ) {
//                   // just punt and wait it out
//                   self.run();
//                   return;
//               }
// 
//               var html = 
//                 '<div>' + 
//                   '<p>You have temporarily exceeded download limits. You may proceed in <span id="throttle-timeout">' + timeout + '</span> seconds.</p>' + 
//                   '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' + 
//                 '</div>';
//                                                   
//               var countdown = timeout;
//               var countdown_inter;
//               
//               var $notice = new Boxy(html, {
//                   show: true,
//                   modal: true,
//                   draggable: true,
//                   closeable: false,
//                   title: "",
//                   behaviours: function(r) {
//                     setTimeout(function() {
//                       Boxy.get(r).hide();
//                       
//                       // and restart the timer!
//                       self.run();
//                       
//                     }, timeout * 1000);
//                     
//                     countdown_inter = setInterval(function() {
//                       countdown -= 1;
//                       $(r).find("#throttle-timeout").text(countdown);
//                       if ( countdown == 0 ) {
//                         clearInterval(countdown_inter);
//                       }
//                     }, 1000);
//                     
//                   }
//               });
// 
//             }
//           }
//         });
//     }
//     
//     this.inter = setInterval(ping, 5000);
//     
//   },
//   
//   stop: function() {
//     clearInterval(this.inter);
//     this.inter = null;
//   },
//   
//   EOT : null
//     
// }

HT.monitor = {
  
  countdown_timer : null,
  
  run : function(url) {
    var self = this;
    
    if ( this.countdown_timer != null ) {
      return;
    }
    
    if ( this.check_url != null ) {
      return;
    }
    
    // find out how long we have to wait
    if ( url.indexOf(";") > -1 ) {
      url += ";ping=status";
    } else {
      url += "&ping=status";
    }
    
    self.check_url = url;
    
    setTimeout(function() {
      self.check_status();
    }, 500);
    
    
  },
  
  check_status : function() {
    var self = this;
    
    $.ajax({
      url : self.check_url,
      cache : false,
      data : {},
      success : function(data) {
        // NOOP; should not be choked
        console.log("TURNING EVERYTHING OFF", self.check_url);
        self.hide_warning();
        self.retry_choked();
      },
      error : function(req, textStatus, errorThrown) {
        console.log("CHECKED STATUS", self.check_url, req);
        if ( req.status == 503 ) {
          self.display_warning(req);
          // self.setup_monitoring(req);
        } else {
          // something worse has happened!!!
        }
      }
    })
  },
  
  retry_choked : function() {
    var self = this;
    
    // just reload the page so normal fudging behavior is possible
    HT.total_choke_hack = true;
    HT.reader.drawLeafs();
    this.check_url = null;
    this.countdown_timer = null;
  },
  
  hide_warning : function() {
    var self = this;
    
    if ( self.notice != null  ) {
      console.log("HIDING THE WARNING", self.notice);
      self.notice.hide();
      self.notice = null;
    }
  },
  
  display_warning : function(req) {
    var self = this;
    
    if ( self.countdown_timer != null ) {
      return;
    }

    var timeout = parseInt(req.getResponseHeader('X-Choke-UntilEpoch'));
    
    if ( timeout <= 5 ) {
        // just punt and wait it out
        console.log("PUNTING AND WAITING IT OUT...");
        setTimeout(function() {
          self.retry_choked();
        }, 5000);
        return;
    }

    timeout *= 1000;
    var now = (new Date).getTime();
    var countdown = ( Math.ceil((timeout - now) / 1000) )
    
    console.log("CHOKING:", timeout, now, countdown);
    
    if ( countdown < 0 ) {
      // we had been throttled but now are okay...
      console.log("CHOKE ALREDY DONE?...", countdown);
      setTimeout(function() {
        self.retry_choked();
      }, 100);
    }
    
    var html = 
      '<div>' + 
        '<p>You have temporarily exceeded download limits. You may proceed in <span id="throttle-timeout">' + countdown + '</span> seconds.</p>' + 
        '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' + 
      '</div>';
                                        
    self.notice = new Boxy(html, {
        show: true,
        modal: true,
        draggable: true,
        closeable: false,
        title: "",
        behaviours: function(r) {
          setTimeout(function() {
            
            // and restart the timer!
            // self.countdown_timer = setInterval(function() { self.recheck(); }, 500);
            console.log("COUNTDOWN IS OVER");
            self.check_status();
            
          }, countdown * 1000 + 1000);
          
          self.countdown_timer = setInterval(function() {
            countdown -= 1;
            $(r).find("#throttle-timeout").text(countdown);
            if ( countdown <= 0 ) {
              clearInterval(self.countdown_timer);
            }
            console.log("TIC TOC", countdown);
          }, 1000);
          
        }
    });
    
  },

  stop: function() {
    // clearInterval(this.inter);
    // this.inter = null;
  },
  
  EOT : null
    
}

$(document).ready(function() {
    
    // hide section navigation submit buttons
    // $("#mdpJumpToSectionSubmit").hide();
    // $("#mdpJumpToSection").bind('change', function() {
    //     $("#mdpSectionForm").submit();
    // })

    // hide page navigation submit buttons
    // $("#mdpGotoButton").hide();
    $("#mdpPageForm").bind('submit', function() {
        var $form = $(this);
        if ( ! FormValidation($form.get(0).num, "Please enter a page number in the box.") ) {
            return false;
        }
        var num = $form.get(0).num.value;
        if ( num.substr(0, 1) == "n" ) {
            // technically a seq
            $form.get(0).seq.value = num.substr(1);
            $form.get(0).num.disabled = true;
        }
        $form.submit();
    })

    // remove the classic print button and append the bookreader icons
    // $("#btnClassicText").replaceWith($("#bookreader-toolbar-items").tmpl());
    if ( $("#mdpToolbarViews > ul").length > 0 ) {
        $("#bookreader-toolbar-items").tmpl().appendTo("#mdpToolbarViews > ul").insertBefore($("#mdpPlainTextView"));
    }
    
    // if the toolbar is disabled, punt
    if ( $("#mdpToolbar").is(".disabled") ) {
        $("#mdpToolbar")
            .click(function() { return false; })
        $("#mdpBottomToolbar")
            .click(function() { return false; })
    }
    
    //// don't need this running for classic yet
    // HT.monitor.run();
    
})