var displayCBFeedback = function() {
    
    var DEFAULT_EMAIL_VALUE = "[Your email address]";
    var pathname = window.location.pathname;
    var emailLen = 96;
    var commentsLen = 4096;

    // Shib
    var cgi_elem = "/cgi";
    if (pathname.indexOf("/shcgi/") >= 0) {
        cgi_elem = "/shcgi";
    }
    var feedbackUrl = cgi_elem + "/feedback";

    var html = '<div id="mdpFeedbackForm">' + 
                  '<form method="POST" action="{feedbackUrl}" id="CBfeedback" name="CBfeedback">' + 
                    '<input type="hidden" value="cb" name="m" />' + 
                    '<input type="hidden" value="Collection Builder" name="id" />' +
                    '<div id="mdpEmail" class="row">' + 
                      '<label id="mdpEmailLabel" for="email">To request a reply, enter your email address below.</label>' + 
                      '<span><input id="email" name="email" class="overlay" value="{DEFAULT_EMAIL_VALUE}" size="50" maxlength="{emailLen}" /></span>' + 
                    '</div>' + 
                    '<div id="mdpFlexible_2_Other" class="row">' + 
                      '<label id="mdpCommentsLabel" for="comments">Problems or comments?</label>' + 
                      '<textarea name="comments" id="comments" class="overlay" rows="4" maxlength="{commentsLen}"></textarea>' + 
                    '</div>' +
                    '<div id="emptyFBError" aria-live="assertive" aria-atomic="true"></div>' + 
                    '<div id="mdpFBtools">' + 
                      '<div class="mdpFBbuttons">' + 
                        '<input id="mdpFBinputbutton" type="submit" name="op" value="Submit" />' + 
                        '<a id="mdpFBcancel" href="#"><strong>Cancel</strong></a>' + 
                      '</div>' + 
                    '</div>' + 
                  '</form>' + 
                '</div>';
    html = html.replace('{DEFAULT_EMAIL_VALUE}', DEFAULT_EMAIL_VALUE)
               .replace('{feedbackUrl}', feedbackUrl)
               .replace('{emailLen}', emailLen)
               .replace('{commentsLen}', commentsLen)
    var $div = $(html).appendTo("body");
    var $frm = $div.find("form");
    var frm = $frm.get(0);

    var dialog = new Boxy($div, {
        show : false,
        modal: true,
        draggable : false,
        closeable : true,
        closeText : "<span class='accessBannerCloseText'>close</span> <span class='accessBannerClose'>X</span></span>",
        clone : false,
        unloadOnHide: true,
        title : "Feedback"
    });
    
    if ( ! $frm.data('initialized') ) {
      // bind the events in the closure in order to share the DEFAULT_EMAIL_VALUE variable
      $("#email")
        .bind('click', function() {
          clickclear(this, DEFAULT_EMAIL_VALUE);
        })
        .bind('focus', function() {
          clickclear(this, DEFAULT_EMAIL_VALUE);
        })
        .bind('blur', function() {
          clickrecall(this, DEFAULT_EMAIL_VALUE);
        })

      $("input[type=submit], #mdpFBcancel", $frm).click(function(e) {
          var clicked = this;
          e.preventDefault();
          
          // get a version of the dialog that 
          // has the most current visibility settings
          var dialog = Boxy.get(this);

          if ( $(this).attr('id') == "mdpFBcancel" ) {
              dialog.hide().getContent().untrap();
              return false;
          }

          var isEmpty = 1;

          var postData = {};

          for (var i=0; i < frm.length; i++)
          {
              if ((frm.elements[i].type == 'checkbox' || frm.elements[i].type == 'radio')
                  && frm.elements[i].checked) {
                  isEmpty = 0;
                  postData[frm.elements[i].name] = frm.elements[i].value;
              }
              else if ((frm.elements[i].type == 'text' || frm.elements[i].type == 'textarea')
                  && (frm.elements[i].value.length > 0)
                  && (frm.elements[i].value != DEFAULT_EMAIL_VALUE)) {
                  isEmpty = 0;
                  postData[frm.elements[i].name] = frm.elements[i].value;
              }
              else if ( frm.elements[i].type == 'hidden' ) {
                postData[frm.elements[i].name] = frm.elements[i].value;
              }
          }

          if (isEmpty == 1) {
              $(frm).find("#emptyFBError").append('<strong>You must enter feedback before submitting or cancel.</strong>');
              return false;
          }

          $(frm).submit();
      });
      $frm.data('initialized', true);
    }
    
    // empty out the form
    $("#emptyFBError").empty();
    
    dialog.show().getContent().trap();
    // focus on the title of the dialog; moves focus into the dialog
    dialog.getInner().find(".title-bar h2").attr('tabindex', '-1').focus();

    return false;
};

$(document).ready(function() {
    
    $("#feedback, #feedback_footer").click(function(e) {
          e.preventDefault();
          displayCBFeedback();
          return false;
    })

})
