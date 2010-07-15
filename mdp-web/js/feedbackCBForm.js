//Script: feedbackCBForm.js

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
var cbfbhost = window.location.href;
var pathname = window.location.pathname;

function getPublicKey()
{
    if (cbfbhost.indexOf("sdr.lib.umich.edu") >= 0)
    {
        return '6Lc84QIAAAAAAA2H-tsq08Cxn9fTOfg8hYGWN7M0';
    }
    else if (cbfbhost.indexOf("mdp.lib.umich.edu") >= 0)
    {
        return '6Lc94QIAAAAAAHiFjwlWLhQCnaZjoypEaogs0tcZ';
    }
    else if (cbfbhost.indexOf("babel.hathitrust.org") >= 0)
    {
        return '6Lc-4QIAAAAAAIlliZEO4MNxyBlY1utFvR7q0Suz';
    }
    else if (cbfbhost.indexOf("umdl.umich.edu") >= 0)
    {
        return '6Lc_4QIAAAAAADemEBAW2CxlZwIOF90T0j99hMvK';
    }
    else
    {
        return '';
    }
}

function getCBFBFormHTML() {
    //Post to local feedback cgi if on clamato, post to quod if in production
    if (cbfbhost.indexOf("umdl.umich.edu") >= 0)
    {
        // Shib
        var cgi_elem = "/cgi";
        if (pathname.indexOf("/shcgi/") >= 0) {
            cgi_elem = "/shcgi";
        }
        feedbackUrl = protocol + "//" + location.hostname + cgi_elem + "/f/feedback/feedback";
        captchaCgi = protocol + "//" + location.hostname + "/cgi/f/feedback/validatecaptcha";
    }
    else
    {
        feedbackUrl = "http://quod.lib.umich.edu/cgi/f/feedback/feedback";
        captchaCgi = protocol + "//quod.lib.umich.edu/cgi/f/feedback/validatecaptcha";
    }
    
    var CBform = "<form method='post' id='CBfeedback' name='CBfeedback' action='" + feedbackUrl + "'>" +
        "<input type='hidden' value='cb' name='m'/>" +
        "<input type='hidden' value='Collection Builder' name='id'/>" +
        "<input name='email' id='email' maxlength='"+ emailLen + "' value='" + emailDefault +
        "' class='overlay' onclick=\"clickclear(this, '" + emailDefault + "')\" onfocus=\"clickclear(this, '" +
        emailDefault + "')\" onblur=\"clickrecall(this,'" + emailDefault + "')\" style='width:" +  width +"px'/><br />" +
        "<textarea name='comments' id='comments' class='overlay' rows='4' maxlength='"
        + commentsLen + "' onclick=\"clickclear(this, '" + commentsDefault + "')\" onfocus=\"clickclear(this, '" +
        commentsDefault + "')\" onblur=\"clickrecall(this,'" + commentsDefault + "')\" style='width:" +  width +"px'/>" + commentsDefault + "</textarea>" +
        "<div id='reCAPTCHA'></div>" +
        "<div id='CBFBError' style='color:red'><div class='bd'></div></div>" +
        "<div id='CBFBLoading'><div class='bd'><p><b>Loading...</b></p></div></div>" +
        "<table><tbody><tr valign='bottom'><td>" +
        "<button type='button' alt='submit' value='cbFBSubmit' name='cbFBSubmit' id='cbFBSubmit'>Submit</button></td>" +
        "<td width='100' align='right'><a href='' id='cbFBCancel'><b>Cancel</b></a></td>" +
        "</tr></tbody></table></form>";
    return CBform;
}

function initCBFeedback() {
    
    var browser = navigator.appName;
    
    if (browser =="Microsoft Internet Explorer") //Make non-modal for IE
    {
        YAHOO.mbooks.CBformWidget = new YAHOO.widget.Panel("CBformWidget", { width:'400px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:false, close:true, modal:false, iframe: true} );
    }
    else
    {
        YAHOO.mbooks.CBformWidget = new YAHOO.widget.Panel("CBformWidget", { width:'400px', visible:false, draggable:true, constraintoviewport:true, fixedcenter:false, close:true, modal:true, iframe: true} );
    }
    
    YAHOO.mbooks.CBformWidget.setHeader("Feedback");
    YAHOO.mbooks.CBformWidget.setBody("");
    YAHOO.mbooks.CBformWidget.render(document.body);
    
}

var interceptCBFBSubmit = function(e)
{
    YAHOO.mbooks.CBFBError.hide();
    YAHOO.mbooks.CBFBLoading.hide();
    
    if (this.id=="cbFBCancel")
    {
        YAHOO.mbooks.CBformWidget.hide();
        YAHOO.util.Event.preventDefault(e);
    }
    else
    {
        var frm = document.getElementById("CBfeedback");
        
        //If no comments are entered, prevent submit
        if(frm.comments.value == commentsDefault)
        {
            YAHOO.util.Event.preventDefault(e);
            YAHOO.mbooks.CBFBError.setBody("<p><b>You must enter feedback before submitting or click cancel.</b></p>");
            YAHOO.mbooks.CBFBError.show();
            YAHOO.mbooks.CBformWidget.render();
        }
        /* Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
           else if (frm.recaptcha_response_field.value == "")
           {
           YAHOO.util.Event.preventDefault(e);
           YAHOO.mbooks.CBFBError.setBody("<p><b>You must respond to the captcha.</b></p>");
           YAHOO.mbooks.CBFBError.show();
           YAHOO.mbooks.CBformWidget.render();
           }*/
        
        else
        {
            /* Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
               
               YAHOO.mbooks.CBFBLoading.show();
               processCBFBRequest();
               YAHOO.mbooks.CBFBLoading.hide();
               
               The code below is temporary and should be removed when the recaptcha is reactivated
            */
            
            YAHOO.mbooks.CBFBError.hide();
            frm.submit();
        }
    }
    
};


var displayCBFeedback = function(e) {
    YAHOO.util.Event.preventDefault(e);
    
    if (PUBLIC_KEY === undefined)
    {
        PUBLIC_KEY = getPublicKey();
    }
    
    //Temporarily comment-out recaptcha until validatecaptcha cgi is moved to server with https
    //setTimeout('Recaptcha.create("' + PUBLIC_KEY + '","reCAPTCHA", {theme: "white"})',5);
    
    YAHOO.mbooks.CBformWidget.setBody(getCBFBFormHTML());
    
    YAHOO.mbooks.CBFBError = new YAHOO.widget.Module("CBFBError", { visible: false });
    YAHOO.mbooks.CBFBError.render();
    
    YAHOO.mbooks.CBFBLoading = new YAHOO.widget.Module("CBFBLoading", { visible: false });
    YAHOO.mbooks.CBFBLoading.render();
    
    YAHOO.mbooks.reCAPTCHA =  new YAHOO.widget.Module("reCAPTCHA", { visible: true });
    YAHOO.mbooks.reCAPTCHA.render();
    
    //Add listener to form submit and cancel button
    //YAHOO.util.Event.addListener("CBfeedback", "submit", interceptCBFBSubmit);
    YAHOO.util.Event.addListener("cbFBSubmit", "click", interceptCBFBSubmit);
    
    YAHOO.util.Event.addListener("cbFBCancel", "click", interceptCBFBSubmit);
    
    YAHOO.mbooks.CBformWidget.show();
};

var callbackCBFB = {
    success: function(o){
        captchaValidation = o.responseText;
        
        if(captchaValidation.indexOf("SUCCESS") >= 0)
        {
            //Remove the captcha from the feedback form DOM before emailing
            var frm = document.getElementById("CBfeedback");
            var olddiv = document.getElementById('reCAPTCHA');
            frm.removeChild(olddiv);
            YAHOO.mbooks.CBFBError.hide();
            frm.submit();
        }
        else
        {
            YAHOO.mbooks.CBFBError.setBody("Incorrect response to captcha. Captcha has been reloaded. If you cannot decipher the captcha, please click the reload or sound button in the captcha box.");
            YAHOO.mbooks.CBFBError.show();
            YAHOO.mbooks.CBformWidget.render();
            Recaptcha.reload();
        }
    },
    failure: function(o) {
        captchaValidation = "COMMUNICATION FAILURE";
        YAHOO.mbooks.CBFBError.setBody("Communication failure. Please try again.");
        YAHOO.mbooks.CBFBError.show();
        YAHOO.mbooks.CBformWidget.render();
    }
};

function processCBFBRequest()
{
    var cbfbfrm = document.getElementById("CBfeedback");
    var recaptcha_challenge = cbfbfrm.recaptcha_challenge_field.value;
    var recaptcha_response = encodeURIComponent(cbfbfrm.recaptcha_response_field.value);
    recaptchaArgs = "recaptcha_challenge_field=" +
        recaptcha_challenge + ";recaptcha_response_field=" +
        recaptcha_response;
    var request = YAHOO.util.Connect.asyncRequest('POST', captchaCgi, callbackCBFB, recaptchaArgs);
    return false;
}




YAHOO.util.Event.addListener(window, "load", initCBFeedback);

YAHOO.util.Event.addListener("feedback", "click", displayCBFeedback);
YAHOO.util.Event.addListener("feedback_footer", "click", displayCBFeedback);

//End feedbackCBForm.js
