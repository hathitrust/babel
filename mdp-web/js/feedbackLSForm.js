//Script: feedbackLSForm.js

YAHOO.namespace("mbooks");

var emailDefault = "Email address (optional)";
var commentsDefault = "Add your feedback here";
var emailLen = 96;
var commentsLen = 256;
var width = 375;
var feedbackUrl;
var recaptchaArgs;
var captchaCgi;
var captchaValidation;
var protocol = window.location.protocol;

var PUBLIC_KEY;
var lsfbhost = window.location.href;
var pathname = window.location.pathname;

function getPublicKey() {
    if (lsfbhost.indexOf("babel.hathitrust.org") >= 0) {
        return '6Lc-4QIAAAAAAIlliZEO4MNxyBlY1utFvR7q0Suz';
    }
    else {
        return '';
    }
}

function getLSFBFormHTML() {
    // Shib
    var cgi_elem = "/cgi";
    if (pathname.indexOf("/shcgi/") >= 0) {
        cgi_elem = "/shcgi";
    }
    feedbackUrl = protocol + "//" + location.hostname + cgi_elem + "/feedback";
    captchaCgi = protocol + "//" + location.hostname + "/cgi/validatecaptcha";
    
    var LSform =
        "<form method='post' id='LSfeedback' name='LSfeedback' action='" + feedbackUrl + "'>" +
        "<input type='hidden' value='ls' name='m'/>" +
        "<input type='hidden' value='Large-scale Search' name='id'/>" +
        "<input name='email' id='email' maxlength='"+ emailLen + "' value='"
        + emailDefault +
        "' class='overlay' onclick=\"clickclear(this, '" + emailDefault + "')\" onfocus=\"clickclear(this, '"
        + emailDefault +
        "')\" onblur=\"clickrecall(this,'" + emailDefault + "')\" style='width:" +  width +"px'/><br />" +
        "<textarea name='comments' id='comments' class='overlay' rows='4' maxlength='"
        + commentsLen +
        "' onclick=\"clickclear(this, '" + commentsDefault + "')\" onfocus=\"clickclear(this, '"
        + commentsDefault +
        "')\" onblur=\"clickrecall(this,'"
        + commentsDefault +
        "')\" style='width:"
        +  width +
        "px'/>"
        + commentsDefault +
        "</textarea>" +
        "<div id='reCAPTCHA'></div>" +
        "<div id='LSFBError' style='color:red'><div class='bd'></div></div>" +
        "<div id='LSFBLoading'><div class='bd'><p><b>Loading...</b></p></div></div>" +
        "<table><tbody><tr valign='bottom'><td>" +
        "<button type='button' alt='submit' value='lsFBSubmit' name='lsFBSubmit' id='lsFBSubmit'>Submit</button></td>" +
        "<td width='100' align='right'><a href='' id='lsFBCancel'><b>Cancel</b></a></td>" +
        "</tr></tbody></table></form>";
    return LSform;
}

function initLSFeedback() {
    var browser = navigator.appName;
    
    if (browser =="Microsoft Internet Explorer") { //Make non-modal for IE
        YAHOO.mbooks.LSformWidget = new YAHOO.widget.Panel("LSformWidget", { width:'400px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:false, close:true, modal:false, iframe: true} );
    }
    else {
        YAHOO.mbooks.LSformWidget = new YAHOO.widget.Panel("LSformWidget", { width:'400px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:false, close:true, modal:true, iframe: true} );
    }
    
    YAHOO.mbooks.LSformWidget.setHeader("Feedback");
    YAHOO.mbooks.LSformWidget.setBody("");
    YAHOO.mbooks.LSformWidget.render(document.body);
}

var interceptLSFBSubmit = function(e) {
    YAHOO.mbooks.LSFBError.hide();
    YAHOO.mbooks.LSFBLoading.hide();
    
    if (this.id=="lsFBCancel") {
        YAHOO.mbooks.LSformWidget.hide();
        YAHOO.util.Event.preventDefault(e);
    }
    else {
        var frm = document.getElementById("LSfeedback");
        
        // If no comments are entered, prevent submit
        if(frm.comments.value == commentsDefault) {
            YAHOO.util.Event.preventDefault(e);
            YAHOO.mbooks.LSFBError.setBody("<p><b>You must enter feedback before submitting or click cancel.</b></p>");
            YAHOO.mbooks.LSFBError.show();
            YAHOO.mbooks.LSformWidget.render();
        }
        /* Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
           else if (frm.recaptcha_response_field.value == "")
           {
           YAHOO.util.Event.preventDefault(e);
           YAHOO.mbooks.LSFBError.setBody("<p><b>You must respond to the captcha.</b></p>");
           YAHOO.mbooks.LSFBError.show();
           YAHOO.mbooks.LSformWidget.render();
           }*/
        
        else {
            /* Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
               
               YAHOO.mbooks.LSFBLoading.show();
               processLSFBRequest();
               YAHOO.mbooks.LSFBLoading.hide();
               
               The code below is temporary and should be removed when the recaptcha is reactivated
            */
            
            YAHOO.mbooks.LSFBError.hide();
            frm.submit();
        }
    }
};


var displayLSFeedback = function(e) {
    YAHOO.util.Event.preventDefault(e);
    
    if (PUBLIC_KEY === undefined) {
        PUBLIC_KEY = getPublicKey();
    }
    
    //Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
    //setTimeout('Recaptcha.create("' + PUBLIC_KEY + '","reCAPTCHA", {theme: "white"})',5);
    
    YAHOO.mbooks.LSformWidget.setBody(getLSFBFormHTML());
    
    YAHOO.mbooks.LSFBError = new YAHOO.widget.Module("LSFBError", { visible: false });
    YAHOO.mbooks.LSFBError.render();
    
    YAHOO.mbooks.LSFBLoading = new YAHOO.widget.Module("LSFBLoading", { visible: false });
    YAHOO.mbooks.LSFBLoading.render();
    
    YAHOO.mbooks.reCAPTCHA =  new YAHOO.widget.Module("reCAPTCHA", { visible: true });
    YAHOO.mbooks.reCAPTCHA.render();
    
    //Add listener to form submit and cancel button
    //YAHOO.util.Event.addListener("LSfeedback", "submit", interceptLSFBSubmit);
    YAHOO.util.Event.addListener("lsFBSubmit", "click", interceptLSFBSubmit);
    
    YAHOO.util.Event.addListener("lsFBCancel", "click", interceptLSFBSubmit);
    
    YAHOO.mbooks.LSformWidget.show();
};

var callbackLSFB = {
    success: function(o){
        captchaValidation = o.responseText;
        
        if(captchaValidation.indexOf("SUCCESS") >= 0) {
            //Remove the captcha from the feedback form DOM before emailing
            var frm = document.getElementById("LSfeedback");
            var olddiv = document.getElementById('reCAPTCHA');
            frm.removeChild(olddiv);
            YAHOO.mbooks.LSFBError.hide();
            frm.submit();
        }
        else {
            YAHOO.mbooks.LSFBError.setBody("Incorrect response to captcha. Captcha has been reloaded. If you cannot decipher the captcha, please click the reload or sound button in the captcha box.");
            YAHOO.mbooks.LSFBError.show();
            YAHOO.mbooks.LSformWidget.render();
            Recaptcha.reload();
        }
    },
    failure: function(o) {
        captchaValidation = "COMMUNICATION FAILURE";
        YAHOO.mbooks.LSFBError.setBody("Communication failure. Please try again.");
        YAHOO.mbooks.LSFBError.show();
        YAHOO.mbooks.LSformWidget.render();
    }
};

function processLSFBRequest() {
    var lsfbfrm = document.getElementById("LSfeedback");
    var recaptcha_challenge = lsfbfrm.recaptcha_challenge_field.value;
    var recaptcha_response = encodeURIComponent(lsfbfrm.recaptcha_response_field.value);
    recaptchaArgs = 
        "recaptcha_challenge_field=" 
        + recaptcha_challenge + 
        ";recaptcha_response_field=" 
        + recaptcha_response;
    var request = YAHOO.util.Connect.asyncRequest('POST', captchaCgi, callbackLSFB, recaptchaArgs);
    return false;
}

YAHOO.util.Event.addListener(window, "load", initLSFeedback);

YAHOO.util.Event.addListener("feedback", "click", displayLSFeedback);
YAHOO.util.Event.addListener("feedback_footer", "click", displayLSFeedback);

// End feedbackLSForm.js
