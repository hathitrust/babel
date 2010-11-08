// Script: feedbackForm.js
YAHOO.namespace("mbooks");

var FBhtml = "";

function initPTFBFormHTML() {
    var frm = document.getElementById("mdpFeedbackForm");
    FBhtml = frm.innerHTML;
    frm.innerHTML = "";
}

function getPTFBFormHTML() {
    return FBhtml;
}

function initPTFeedback() {
    // Populate the overlay with the HTML generated from the XSL
    // stylesheet.  The Panel burns through the iframe containing the
    // pdf plugin when Panel.hide() is used.  Solution was to use
    // Panel.destroy().

    // If pdf view, make iframe
    var view = getURLParam('view', location.href);

    var browser = navigator.appName;

    if (browser == "Microsoft Internet Explorer" && view =="pdf") {
        // Make non-modal iframe for IE pdf
        YAHOO.mbooks.PTFeedbackForm =
            new YAHOO.widget.Panel("formWidget", { width:'550px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, iframe: true } );
    }
    else if (browser == "Microsoft Internet Explorer" && (view != "pdf" || view === null)) {
        // Make non-modal non-iframe for IE non-pdf
        YAHOO.mbooks.PTFeedbackForm =
            new YAHOO.widget.Panel("formWidget", { width:'550px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false } );
    }
    else if (view == "pdf") {
        YAHOO.mbooks.PTFeedbackForm =
            new YAHOO.widget.Panel("formWidget", { width:'550px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true, iframe: true } );
    }
    else {
        YAHOO.mbooks.PTFeedbackForm =
            new YAHOO.widget.Panel("formWidget", { width:'550px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true} );
    }

    YAHOO.mbooks.PTFeedbackForm.setHeader("Feedback");
    YAHOO.mbooks.PTFeedbackForm.setBody(getPTFBFormHTML());
    YAHOO.mbooks.PTFeedbackForm.render("feedbackDiv");

    // Hide the old form since the HTML was extracted onDOMReady
    YAHOO.mbooks.mdpFeedbackForm = new YAHOO.widget.Module("mdpFeedbackForm");
    YAHOO.mbooks.mdpFeedbackForm.hide();

    // Panel Close button is a different event than Submit/Cancel
    var closeElem = YAHOO.util.Dom.getElementsByClassName("container-close", null, YAHOO.mbooks.PTFeedbackForm.element[0]);
    YAHOO.util.Event.on(closeElem, "click",  destroyPTFeedbackForm);
}

var interceptPTFBSubmit = function(e) {
    YAHOO.mbooks.emptyPTFBError.hide();

    if (this.id == "mdpFBcancel") {
        YAHOO.mbooks.PTFeedbackForm.destroy();
        YAHOO.util.Event.preventDefault(e);
    }
    else {
        var isEmpty = 1;
        var frm = document.getElementById("mdpFBform");

        for (var i=0; i < frm.length; i++)
        {
            if ((frm.elements[i].type == 'checkbox' || frm.elements[i].type == 'radio')
                && frm.elements[i].checked) {
                isEmpty = 0;
            }
            if ((frm.elements[i].type == 'text' || frm.elements[i].type == 'textarea')
                && (frm.elements[i].value.length > 0)
                && (frm.elements[i].value != "[Your email address]")) {
                isEmpty = 0;
            }
        }

        if (isEmpty == 1) {
            YAHOO.util.Event.preventDefault(e);
            YAHOO.mbooks.emptyPTFBError.show();
            YAHOO.mbooks.PTFeedbackForm.render();
        }
    }
};

var destroyPTFeedbackForm = function(e) {
    YAHOO.mbooks.PTFeedbackForm.destroy();
}

var displayPTFeedback = function(e) {
    YAHOO.util.Event.preventDefault(e);

    initPTFeedback();

    // Error message displayed if user tries to submit empty feedback.
    YAHOO.mbooks.emptyPTFBError = new YAHOO.widget.Module("emptyFBError", { visible: false });
    YAHOO.mbooks.emptyPTFBError.render();

    // Add listener to form submit and cancel button
    YAHOO.util.Event.addListener("mdpFBcancel", "click", interceptPTFBSubmit);
    YAHOO.util.Event.addListener("mdpFBform", "submit", interceptPTFBSubmit);

    YAHOO.mbooks.PTFeedbackForm.show();
};

YAHOO.util.Event.onDOMReady(initPTFBFormHTML);

YAHOO.util.Event.addListener("feedback", "click", displayPTFeedback);
YAHOO.util.Event.addListener("feedback_footer", "click", displayPTFeedback);

// End feedbackForm.js

