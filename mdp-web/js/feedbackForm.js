var displayPTFeedback = function() {
    
    var DEFAULT_EMAIL_VALUE = "[Your email address]";
    
    // empty out the form
    var frm = $("#mdpFeedbackForm form").get(0);
    $("#emptyFBError").hide();
    
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
    
    // $("#mdpFeedbackForm").boxy();
    var dialog = new Boxy("#mdpFeedbackForm", {
        show : false,
        modal: true,
        draggable : false,
        closeable : false,
        clone : false,
        unloadOnHide: false
    });
    dialog.getContent().find("input[type=submit], #mdpFBcancel").click(function(e) {
        var clicked = this;
        e.preventDefault();
        
        if ( $(this).attr('id') == "mdpFBcancel" ) {
            dialog.hide();
            return false;
        }
        
        var isEmpty = 1;
        var frm = $(this).parents("form").get(0); // document.getElementById("mdpFBform");
        
        var postData = {};

        for (var i=0; i < frm.length; i++)
        {
            if ((frm.elements[i].type == 'checkbox' || frm.elements[i].type == 'radio')
                && frm.elements[i].checked) {
                isEmpty = 0;
                postData[frm.elements[i].name] = frm.elements[i].value;
            }
            if ((frm.elements[i].type == 'text' || frm.elements[i].type == 'textarea')
                && (frm.elements[i].value.length > 0)
                && (frm.elements[i].value != DEFAULT_EMAIL_VALUE)) {
                isEmpty = 0;
                postData[frm.elements[i].name] = frm.elements[i].value;
            }
        }

        if (isEmpty == 1) {
            $(frm).find("#emptyFBError").show();
        } else {
            // post the form
            var href = $(frm).attr('action');
            $.post(href, postData);
            dialog.hide();
        }

        return false;
    })
    dialog.show();

    // initPTFeedback();
    // 
    // // Error message displayed if user tries to submit empty feedback.
    // YAHOO.mbooks.emptyPTFBError = new YAHOO.widget.Module("emptyFBError", { visible: false });
    // YAHOO.mbooks.emptyPTFBError.render();
    // 
    // // Add listener to form submit and cancel button
    // YAHOO.util.Event.addListener("mdpFBcancel", "click", interceptPTFBSubmit);
    // YAHOO.util.Event.addListener("mdpFBform", "submit", interceptPTFBSubmit);
    // 
    // YAHOO.mbooks.PTFeedbackForm.show();
    
    return false;
};

$(document).ready(function() {
    
    $("#feedback").click(function(e) {
        e.preventDefault();
        displayPTFeedback();
        return false;
    })

    $("#feedback_footer").click(function(e) {
        e.preventDefault();
        displayPTFeedback();
        return false;
    })

})