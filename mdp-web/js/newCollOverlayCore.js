//Script: newCollOverlayCore.js

var DEFAULT_COLL_NAME = "Collection Name";
var DEFAULT_DESC = "Description";
var COLL_NAME = [];

var maxCharsColl = 50;
var charsTypedColl = 0;
var charsRemainingColl = maxCharsColl - charsTypedColl;
var maxCharsDesc = 150;
var charsTypedDesc = 0;
var charsRemainingDesc = maxCharsDesc - charsTypedDesc;

var formWidth = 400;
var URL = null;
var referrer = "";
var dup = 0;


YAHOO.namespace("mbooks");

function setPostURL(url) { URL = url; }
function getPostURL() { return URL; }

function setReferrer(ref) { referrer = ref; }
function getReferrer() { return referrer; }

function getNewCollForm () {
    var mbCgi = "/cgi/mb";
    if ( window.location.href.indexOf("/shcgi/") > -1 ) {
      mbCgi = "/shcgi/mb";
    } 
  
    var width = formWidth - 100;
    var formHTML = 
        "<form method='get' id='newcoll' name='newcoll' action='" + mbCgi + "'><table>";
    
    formHTML = 
        formHTML + 
        "<tr><td>" +
	"<div><input name='cn' type='text' style='width:" 
        + width + 
        "px' maxlength='" 
        + maxCharsColl + 
        "' " +   
	"class='overlay' id='cn' onclick=\"clickclear(this, 'Collection Name')\" onfocus=\"clickclear(this, 'Collection Name')\" onblur=\"clickrecall(this,'Collection Name')\" onKeyUp=\"CheckCollLength()\" value='Collection Name'/> " +
	"</div></td><td><div id='charsRemainingColl'>" +
	"<div class='bd'></div></div></td></tr>"+
	"<tr><td><div><textarea style='width:" 
        + width +
        "px;margin-left:0px;' name='desc' id='desc' class='overlay' rows='4' onclick=\"clickclear(this, 'Description')\" onfocus=\"clickclear(this, 'Description')\" onblur=\"clickrecall(this,'Description')\" style=\"font-family:Arial\" onKeyUp=\"CheckDescLength()\">" + 
	"Description</textarea></div></td>" +
	"<td><div id='charsRemainingDesc'><div class='bd'></div></div>" +
	"</td></tr></table>" 
        + getSharedOptions() +
	"<div id='collType'><div class='bd'></div></div> " +
	"<div id='searchParams'><div class='bd'></div></div> " +
	"<div id='invalidName'><div class='bd'></div></div> " +
	"<div id='itemsSelected'><div class='bd'></div></div>" +
	"<div id='defaultCollParams'><div class='bd'></div></div>" +
	"<table name='buttons'> <tr> " +
	"<td id='addC'><button id='addc' type='submit'>Add</button></td> " +
	"<td id='addI'><button id='additnc' type='submit'>Add</button></td>"+
        //tbw test for ls
	"<td id='addItems'><button id='additsnc' type='submit'>Add</button></td>"+
	"<td id='copy'><button id='copyitnc' type='submit'>Copy</button></td> "+
	"<td id='move'><button id='movitnc' type='submit'>Move</button></td> "+
	"<input id='action' type='hidden' name='a' value='?'></td>" +
	"<td width='100px' align='right'><a id='cancel' href=''>Cancel</a></td> "+
	"</tr> </table>" +
        "</form>";
    return formHTML;
}

function getSharedOptions() {
    var options = "<table><tr><td><INPUT type='radio' name='shrd' id='shrd_priv' value='0' checked='yes'/>Private</td>";
    if(isLoggedIn()===true) 
    {
	options = options + "<td>&nbsp;</td><td><INPUT type='radio' name='shrd' id='shrd_publ' value='1'/>Public</td>";
	options = options + "</tr></table>";		
    }
    else 
    {
	options = options + "</tr></table>";
	options = options + "<span class='loginNC' style='color:#FF4040'>Login to create public and/or permanent collections</span>";
    }
    
    return options;
}

//tbw LS hack
function getLS_COLL_NAME(){
    var CollWidget= document.getElementById('LSaddItemSelect');
    var Opts=CollWidget.options;
    var collname = new Array();
    for (var i=0; i<Opts.length; i++){
        collname[i]=Opts[i].text;
    }
    return collname;
}


function init() {
    // Init array of existing coll names to prevent duplication
    var pg = getURLParam('page', location.href);
    
    if (pg != "home") 
    {	
	
        //XXX tbw hack for LS here
        var action = getURLParam('a', location.href);
        if (action === "srchls"){
            COLL_NAME = getLS_COLL_NAME();
        }
        else{
            COLL_NAME = getCollArray();// regular way to get array from embedded javascript 
        }
        
        
        
        var widthInPixels = formWidth + "px";
        
        var view = getURLParam('view', location.href);
        
        var browser = navigator.appName;
        
        if (browser =="Microsoft Internet Explorer" && view =="pdf") //Make non-modal iframe for IE pdf 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, x:100, y:200, iframe: true} );
        }
        else if (browser =="Microsoft Internet Explorer" && view !="pdf")  //Make non-modal non-iframe for IE non-pdf
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:false, x:100, y:200} );
        }
        else if(view =="pdf")  //Make modal iframe for pdf view in other browsers 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true, x:100, y:200, iframe: true} );
        }
        else //Make modal non-iframe for non-pdf view in other browsers 
        {
            YAHOO.mbooks.newCollectionPanel = new YAHOO.widget.Panel("newCollectionPanel", { width:widthInPixels, visible:false, draggable:true, constraintoviewport:true, fixedcenter:true, close:true, modal:true, x:100, y:200} );
        }		
        
        if(isLoggedIn()===true) {
            YAHOO.mbooks.newCollectionPanel.setHeader("New Collection");			
        }
        else 
        {
            YAHOO.mbooks.newCollectionPanel.setHeader("New Temporary Collection");				
        }
        YAHOO.mbooks.newCollectionPanel.setBody(getNewCollForm());		
        YAHOO.mbooks.newCollectionPanel.render("overlay");
        
        //Character counts
        YAHOO.mbooks.collChars = new YAHOO.widget.Module("collChars", { visible: true });
        YAHOO.mbooks.collChars.render();
        YAHOO.mbooks.descChars = new YAHOO.widget.Module("descChars", { visible: true });
        YAHOO.mbooks.descChars.render();
        
        //Hide error messages
        YAHOO.mbooks.invalidName = new YAHOO.widget.Module("invalidName", { visible: false });
        YAHOO.mbooks.invalidName.render();
        YAHOO.mbooks.errormsg = new YAHOO.widget.Module("errormsg", { visible: false });
        YAHOO.mbooks.errormsg.render();
        
        //Hide selected items and params
        YAHOO.mbooks.itemsSelected = new YAHOO.widget.Module("itemsSelected", { visible: false });
        YAHOO.mbooks.itemsSelected.render();
        YAHOO.mbooks.defaultCollParams = new YAHOO.widget.Module("defaultCollParams", { visible: false });
        YAHOO.mbooks.defaultCollParams.render();
        YAHOO.mbooks.collType = new YAHOO.widget.Module("collType", { visible: false});
        YAHOO.mbooks.collType.hide();
        YAHOO.mbooks.collType.render();
        YAHOO.mbooks.searchParams = new YAHOO.widget.Module("searchParams", { visible: false });
        YAHOO.mbooks.searchParams.hide();
        YAHOO.mbooks.searchParams.render();	
	
	
        //Hide character counts upon submit
        YAHOO.mbooks.charsRemainingColl = new YAHOO.widget.Module("charsRemainingColl", { visible: true });
        YAHOO.mbooks.charsRemainingColl.setBody(charsRemainingColl + "");
        YAHOO.mbooks.charsRemainingColl.render();
        YAHOO.mbooks.charsRemainingDesc = new YAHOO.widget.Module("charsRemainingDesc", { visible: true });
        YAHOO.mbooks.charsRemainingDesc.setBody(charsRemainingDesc + "");
        YAHOO.mbooks.charsRemainingDesc.render();
        
        //Hide unrelated buttons
        YAHOO.mbooks.addC = new YAHOO.widget.Module("addC", { visible: false });
        YAHOO.mbooks.addC.render();
        YAHOO.mbooks.addI = new YAHOO.widget.Module("addI", { visible: false });
        YAHOO.mbooks.addI.render();
        YAHOO.mbooks.addItems = new YAHOO.widget.Module("addItems", { visible: false });
        YAHOO.mbooks.addItems.render();
        
        YAHOO.mbooks.copy = new YAHOO.widget.Module("copy", { visible: false });
        YAHOO.mbooks.copy.render();
        YAHOO.mbooks.move = new YAHOO.widget.Module("move", { visible: false });
        YAHOO.mbooks.move.render();
        
        //Add listener to form submit: This will cover when the form is submitted by clicking any of the submit buttons on the form or by enter in Safari
        YAHOO.util.Event.addListener("newcoll", "submit", interceptNewCollSubmit);
        
        //Add listener to cancel link
        YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);
    }
}

function SetCharsRemainingColl(charsRemaining) {
    YAHOO.mbooks.charsRemainingColl.setBody(charsRemaining + "");
}
function CheckCollLength() {
    if(maxCharsColl <= 0) { return; }
    if(charsRemainingColl <= 0) { 
	document.newcoll.cn.value = document.newcoll.cn.value.substring(0, maxCharsColl);	
	charsRemainingColl = 0;
    }
    
    var textfield = document.newcoll.cn.value;
    charsTypedColl = textfield.length;
    charsRemainingColl = maxCharsColl - charsTypedColl;
    SetCharsRemainingColl(charsRemainingColl);	
    document.newcoll.cn.focus();
}

function SetCharsRemainingDesc(charsRemaining) {
    YAHOO.mbooks.charsRemainingDesc.setBody(charsRemaining + "");
}

function CheckDescLength() {
    if(maxCharsDesc <= 0) { return; }
    if(charsRemainingDesc <= 0) { 
	document.newcoll.desc.value = document.newcoll.desc.value.substring(0, maxCharsDesc);	
	charsRemainingDesc = 0;
    }
    
    var textfield = document.newcoll.desc.value;
    charsTypedDesc = textfield.length;
    charsRemainingDesc = maxCharsDesc - charsTypedDesc;
    SetCharsRemainingDesc(charsRemainingDesc);	
    document.newcoll.desc.focus();
} 

function checkIt(agent, string) {
    var place = agent.indexOf(string) + 1;
    return place;
}

function initializeButtons() {
    YAHOO.mbooks.addC.hide();
    YAHOO.mbooks.addI.hide();
    YAHOO.mbooks.addItems.hide();
    YAHOO.mbooks.copy.hide();
    YAHOO.mbooks.move.hide();
}

function initializeInputs() {
    document.newcoll.cn.value = DEFAULT_COLL_NAME;
    document.newcoll.desc.value = DEFAULT_DESC;
    charsRemainingDesc = maxCharsDesc;
    SetCharsRemainingDesc(charsRemainingDesc);
    charsRemainingColl = maxCharsColl;
    SetCharsRemainingColl(charsRemainingColl);
}

var interceptNewCollSubmit = function(e) {
    var newCollName = document.newcoll.cn.value;
    
    YAHOO.mbooks.errormsg.hide();
    YAHOO.mbooks.invalidName.hide();
    
    if (this.id=="cancel") {
	YAHOO.mbooks.newCollectionPanel.hide();
	YAHOO.util.Event.preventDefault(e);
	initializeInputs();
    }
    else {
	var trimmedName = trimString(newCollName);
	
	if (newCollName==DEFAULT_COLL_NAME || newCollName=="" || trimmedName=="") {
	    YAHOO.util.Event.preventDefault(e);
	    YAHOO.mbooks.invalidName.setBody("<br/><b>You must enter a collection name</b><br/>");
	    YAHOO.mbooks.invalidName.show();
	}
	else if (newCollName.indexOf('"') > -1) {
	    YAHOO.util.Event.preventDefault(e);
	    YAHOO.mbooks.invalidName.setBody("<br/><b>You can use single quotes but not double quotes. </b><br/>");
	    YAHOO.mbooks.invalidName.show();
	}
	else {
	    dup = 0;
	    for (var i=0; i<COLL_NAME.length; i++) {
		if (newCollName==COLL_NAME[i]) {
		    dup = 1;
		}
	    }
            
	    if (dup==1) {
		YAHOO.util.Event.preventDefault(e);
		YAHOO.mbooks.invalidName.setBody("<br/><b>A collection with that name already exists</b><br/>");
		YAHOO.mbooks.invalidName.show();
	    }
	    else {
		var desc = document.newcoll.desc.value;
		if(desc==DEFAULT_DESC) {
		    desc = "";
		}							
		if (getReferrer() == "CB" || getReferrer() == "CV") { 
		    if (desc==DEFAULT_DESC || desc=="") {
			document.newcoll.desc.value = "";
		    }
		    
		    var action = getURLParam('a', location.href);
		    var query = getURLParam('q1', location.href);
		    
		    //Return to personal collection view after creating a new collection from collection builder
		    if (getReferrer() == "CV" && action != "listsrch") {					
			YAHOO.mbooks.collType.setBody(
			    "<INPUT type='hidden' name='colltype' id='coll_type' value='priv'/>");
			YAHOO.mbooks.collType.show();
		    }					
		    
		    //If search results page, hide coll type and preserve query params 
		    if (action == "listsrch") {					
			YAHOO.mbooks.searchParams.setBody(
			    "<INPUT type='hidden' name='page' id='page_type' value='srchresults'/>" +
				"<INPUT type='hidden' name='q1' id='page_type' value='" + query + "'/>");
			YAHOO.mbooks.searchParams.show();						
			YAHOO.mbooks.collType.hide();
		    }					
		}
		else if (getReferrer() == "PT"  || getReferrer() == "LS") {
                    
                    var priv = document.newcoll.shrd_priv.checked;
                    var shrd;
                    if (priv === true) {
                        shrd = 0;
                    }
                    else {
                        shrd = 1;
                    }
		    initializeInputs();
	            
		    YAHOO.util.Event.preventDefault(e);
		    
		    newCollName = encodeURIComponent(newCollName);
		    desc = encodeURIComponent(desc);
		    
		    //Set URL here
		    setPostURL(getPostURL() + ";cn=" + newCollName + ";desc=" + desc + ";shrd=" + shrd);
		    YAHOO.mbooks.newCollectionPanel.hide();
                    
		    setRequestUrl(getPostURL());
		    processRequest();
		}
		//else { alert("other referrer"); }				
		
	    }
	}
    }
}

//Init method is now called by newCollOverlayPT and newCollOverlayCB so that
//overlay is hidden from screenheaders until invoked
//YAHOO.util.Event.addListener(window, "load", init); 


//End newCollOverlayCore.js
