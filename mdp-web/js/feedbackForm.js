var displayPTFeedback = function() {
    
    var DEFAULT_EMAIL_VALUE = "[Your email address]";

    var $div = $("#mdpFeedbackForm");
    var $frm = $div.find("form");
    var frm = $frm.get(0);

    var dialog = new Boxy($div, {
        show : false,
        modal: true,
        draggable : false,
        closeable : true,
        closeText : "<span class='accessBannerCloseText'>close</span> <span class='accessBannerClose'>X</span></span>",
        clone : false,
        unloadOnHide: false,
        title : "Feedback"
    });
    
    if ( ! $frm.data('initialized') ) {
      // bind the events in the closure in order to share the DEFAULT_EMAIL_VALUE variable
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
              $(frm).find("#emptyFBError").append('<strong>Error: You cannot submit an empty form.</strong>');
          } else {
              // post the form
              var href = $(frm).attr('action');

              $.post(href, postData);
              dialog.hide().getContent().untrap();
          }

          return false;
      });
      $frm.data('initialized', true);
    }
    
    // empty out the form
    $("#emptyFBError").empty();
    
    for (var i=0; i < frm.length; i++)
    {
        if ((frm.elements[i].type == 'checkbox' || frm.elements[i].type == 'radio')
            && frm.elements[i].checked) {
            frm.elements[i].checked = false;
        }
        if ((frm.elements[i].type == 'text' || frm.elements[i].type == 'textarea')
            && (frm.elements[i].value.length > 0)) {
        
            frm.elements[i].value = "";
            if ( frm.elements[i].id == "email" ) {
                frm.elements[i].value = DEFAULT_EMAIL_VALUE;
            }
        }
    }
    
    dialog.show().getContent().trap();
    // focus on the title of the dialog; moves focus into the dialog
    dialog.getInner().find(".title-bar h2").attr('tabindex', '-1').focus();

    return false;
};

$(document).ready(function() {
    
    $("#feedback, #feedback_footer, .mobilefeedback").click(function(e) {
          e.preventDefault();
          displayPTFeedback();
          return false;
    })

})
