
YAHOO.namespace("mbooks");

var sDEBUG = false;
//var sDEBUG = true;


function dMsg(msg) {
    if (sDEBUG === true) {
        alert(msg);
    }
}


function displayErrorMsg(Msg) {
    search_errormsg.setBody(Msg);
    search_errormsg.show();
}

/*********************************************************************
   function getCgiParams

XXX copied from newCollOverlayCB.js  Should go in some common utility js!!

   usage:  var p = getCgiParams();
   var action =p.a
   var title =p.ti
   WARNING:  There seems to be a problem calling with array notation
   i.e.  Do not use   var action =p[a]
***********************************************************************/
function getCgiParams(){
    var params = {}; //empty hash
    var loc = window.location.toString();
    var temp = loc.split(/\?/);
    if (temp[1]) {
        var pairs = temp[1].split(/\;|\&/);
        for (var i = 0; i < pairs.length; i++){
            var keyvalue = pairs[i].split(/\=/);
            var key = keyvalue[0];
            var value = keyvalue[1];
            params[key] = value;
        }
    }
    return params;
}


// Get form function for items
function getForm(e) {
    return  document.getElementById('itemlist_searchform');
}

function initSearchErrorMessage(formId) {
    // For list_items and list_search_results need to use same div as other javascript
    //So we ignore the formId passed in
    var MsgId='errormsg';
    search_errormsg = new YAHOO.widget.Module(MsgId, { visible: false });
    search_errormsg.render();
}


function processSearch(e) {
    dMsg("processSearch was called");
    
    var myForm = getForm(e);
    var q1 = myForm.q1.value;
    var formId = myForm.id;
    
    // pass form  id into error message processing for use in list colls
    initSearchErrorMessage(formId);
    
    q1 = q1.replace(/^\s*|\s*$/g,'');
    
    if (q1 === "") {
        var emptyQueryMsg="<div class='error'>Please enter a search term.</div>";
        displayErrorMsg(emptyQueryMsg);
        return false;
    }
    else {
        return myForm.submit();
    }
}

var interceptSubmitByEnter = function(e) {
    YAHOO.util.Event.stopEvent(e);
    processSearch(e);
    return false;
};

/****** This code moved from searchAjaxItems.js now that we are not doing search on list_coll page we don't need
        separate searchAjaxColl.js and searchAjaxItems.js ******/




/*****************************************************************************
This is not needed or used for now:
var interceptSubmitByClick = function(e)
{
  processSearch(e);
}
YAHOO.util.Event.addListener("srch", "click", interceptSubmitByClick);
*****************************************************************************/

YAHOO.util.Event.addListener("itemlist_searchform", "submit", interceptSubmitByEnter);


