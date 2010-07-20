// newCollOverlayPT.js
// Javascript supporting AJAX add pageturner item currently being viewed to collection
// $Id: newCollOverlayPT.js,v 1.27 2009/08/26 19:24:26 tburtonw Exp $
//

// Must match text in pageviewer.xsl
var IN_YOUR_COLLS_LABEL = 'This item is in your collection(s):';

var SELECT_COLL_MENU_VALUE = 'a';
var NEW_COLL_MENU_VALUE = 'b';
var rUrl;

YAHOO.namespace("mbooks");

YAHOO.mbooks.loadingPT = 
        new YAHOO.widget.Overlay("loading", 
                                 { context:["PTcollectionList","tl","bl"], visible:false, width:"150px" } );

var handleSuccess = function(o) {
	YAHOO.mbooks.loadingPT.hide();
        if (o.responseText != undefined) {
                o.responseText = o.responseText.replace(/\n/g, "");
                o.responseText = stripXMLPI(o.responseText);

                var params = {};
                var returnPairs = o.responseText.split(/\|/);
                for (var i=0; i < returnPairs.length; i++) {
                        var keyvalue = returnPairs[i].split(/\=/);
                        var key = keyvalue[0];
                        var value = keyvalue[1];
                        params[key] = value;
                }

                if (params.result == "ADD_ITEM_SUCCESS") {
                        addItemToCollList(params);
                }
                else if (params.result == "ADD_ITEM_FAILURE") {
                  // don't add the item to the coll list if there was a failure
                  //addItemToCollList(params);
                        YAHOO.mbooks.errormsg.setBody("<div class='PTerror'>Database problem. Could not add item to your collection.</div>");
                        YAHOO.mbooks.errormsg.show();
                }
                else {
                        debugWindowWrite(o.responseText);
                }
        }
        setRequestUrl("");
}


function debugWindowWrite(html) {
        var w = window.document;
        w.open();
        w.writeln(html);
        w.close();
}


function addItemToCollList(params) {
        var collID = params.coll_id;
        var collName = params.coll_name;
        var collectionList = document.getElementById('PTcollectionList');

        var listLabel = document.getElementById('PTitemInCollLabel');
        listLabel.innerHTML = IN_YOUR_COLLS_LABEL;
        collectionList.innerHTML +=
                '<li><a href="mb?a=listis;c=' + collID + '">' + collName + '</a></li>';

        var selectList = document.getElementById('PTaddItemSelect');
        for (var j=0; j < selectList.options.length; j++) {
                if (selectList.options[j].text == collName) {
                        selectList.options[j] = null;
                        break;
                }
        }
}

var handleFailure = function(o) {
        YAHOO.mbooks.loadingPT.hide();
        YAHOO.mbooks.errormsg.setBody("<div class='PTerror'>Communication failure. Could not add this item to your collection.</div>");
        YAHOO.mbooks.errormsg.show();

        setRequestUrl("");
}

var callback = {
        success:handleSuccess,
        failure:handleFailure
};



var addItemToCollection = function(o) {
        init(); //init new coll widget
	YAHOO.mbooks.errormsg.hide();
	YAHOO.mbooks.loadingPT.setBody("<div class='PTloading'>Loading, please wait ...</div>");
	YAHOO.mbooks.loadingPT.render(document.body);

        if (getCollMenuVal()==NEW_COLL_MENU_VALUE) {
		initNewCollUrl();
                setReferrer("PT");
		//Set position of new collection widget, done to reset position after drag-drop.
		YAHOO.mbooks.newCollectionPanel.moveTo(100,250);
                addToNewCollection(getRequestUrl());
        }
        else if (getCollMenuVal()==SELECT_COLL_MENU_VALUE) {
		YAHOO.mbooks.errormsg.setBody("<div class='PTerror'>Please select a collection to add this item to</div>");
		YAHOO.mbooks.errormsg.show();
		YAHOO.util.Event.preventDefault(o);
        }
        else  {
                initExistingCollUrl();
                processRequest();
        }
}


function processRequest() 
{
	YAHOO.mbooks.loadingPT.show();
	YAHOO.util.Connect.asyncRequest('GET', getRequestUrl(), callback);
  	return false;
}

function initExistingCollUrl() 
{
	var existingCollid = getCollMenuVal();	
	rUrl = constructAddItemUrl() + ';a=addits;c2=' + existingCollid;		
}


function constructAddItemUrl() 
{
	var urlTemp = document.getElementById('PTajaxAddItemPartialUrl').textContent;		
	
	if(urlTemp == undefined)
	{
		urlTemp = document.getElementById('PTajaxAddItemPartialUrl').innerHTML;
	}
	return urlTemp;
}


function initNewCollUrl() 
{
  rUrl = rUrl = constructAddItemUrl() + ';a=additsnc';
}

function setRequestUrl(url)  
{
	rUrl = url;
}

function getRequestUrl() 
{
	return rUrl;
}

function getCollMenuVal() 
{
        var selectedIndex = document.getElementById('PTaddItemSelect').selectedIndex;
        var value = document.getElementById('PTaddItemSelect')[selectedIndex].value;
        return value;
}

function addToNewCollection(url) 
{
	setPostURL(url);

	initializeButtons();

	YAHOO.mbooks.addI.show();

	//Add listener to cancel link
	YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);

	YAHOO.mbooks.newCollectionPanel.show();
}

YAHOO.util.Event.addListener("PTaddItemBtn", "click", addItemToCollection);

//end of newCollOverlayPT.js
