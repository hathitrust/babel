var HT = HT || {};

HT.monitor = {
  
  inter : null,
  
  run : function() {
    var self = this;
    
    if ( this.inter != null ) {
      return;
    }
    
    var ping = function() {
      $.ajax({
          url : "/common/robots.txt",
          data : { ts : (new Date).getTime() },
          cache : false,
          success: function(data) {
            // NOOP
          },
          error : function(req, textStatus, errorThrown) {
            // stop for any error (e.g. network down)
            self.stop();
            if ( req.status == 503 ) {
              var tmp = req.responseText.match(/for the next (\d+) seconds/);
              var timeout = tmp[1];
              
              if ( timeout <= 5 ) {
                  // just punt and wait it out
                  self.run();
                  return;
              }

              var html = 
                '<div>' + 
                  '<p>You have temporarily exceeded download limits. You may proceed in <span id="throttle-timeout">' + timeout + '</span> seconds.</p>' + 
                  '<p>Download limits protect HathiTrust resources from abuse and help ensure a consistent experience for everyone.</p>' + 
                '</div>';
                                                  
              var countdown = timeout;
              var countdown_inter;
              
              var $notice = new Boxy(html, {
                  show: true,
                  modal: true,
                  draggable: true,
                  closeable: false,
                  title: "",
                  behaviours: function(r) {
                    setTimeout(function() {
                      Boxy.get(r).hide();
                      
                      // and restart the timer!
                      self.run();
                      
                    }, timeout * 1000);
                    
                    countdown_inter = setInterval(function() {
                      countdown -= 1;
                      $(r).find("#throttle-timeout").text(countdown);
                      if ( countdown == 0 ) {
                        clearInterval(countdown_inter);
                      }
                    }, 1000);
                    
                  }
              });

            }
          }
        });
    }
    
    this.inter = setInterval(ping, 5000);
    
  },
  
  stop: function() {
    clearInterval(this.inter);
    this.inter = null;
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