
YAHOO.namespace("mbooks");
var ITEMS_SELECTED = [];
var rUrl;

var lsDEBUG = false;

function dMsg(msg){
  if (lsDEBUG === true){
    alert(msg);
  }
}

/***
 see pageviewer.xsl  template CollectionWidgetContainer
 context tells the overlay to align with the given element. See:http://developer.yahoo.com/yui/container/overlay/#position
 tl = top left corner of widget align with bl bottom left corner of addCollectionWidgetLS element
***/

YAHOO.mbooks.loadingLS = 
  new YAHOO.widget.Overlay("loading", 
                                 { context:["addCollectionWidgetLS","tl","bl"], visible:false, width:"150px" } );

// these are the values of these options in the menu
var SELECT_COLL_MENU_VALUE = 'a';
var NEW_COLL_MENU_VALUE = 'b';


var handleSuccess = function(o) {
  dMsg("handle success called");
  YAHOO.mbooks.loadingLS.hide();
  if (o.responseText !== undefined) {
    o.responseText = o.responseText.replace(/[\n\r]/g, "");
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
      showSuccessMessage(params);
    }
    else if (params.result == "ADD_ITEM_FAILURE") {
      // don't add the item to the coll list if there was a failure
      //addItemToCollList(params);
      YAHOO.mbooks.errormsg.setBody("<div class='LSerror'>Database problem. Could not add item(s) to your collection.</div>");
      YAHOO.mbooks.errormsg.show();
    }
    else {
      debugWindowWrite(o.responseText);
    }
  }
  setRequestUrl("");
};

function showSuccessMessage(params){

//     $s .= qq{|NumFailed=$NumFailed};

  var collID = params.coll_id;
  var collName = params.coll_name;
  var collHref= '<a href="mb?a=listis;c=' + collID + '">' + collName + '</a>';
  var numAdded=params.NumAdded;
  var numFailed=params.NumFailed;
  var alertMsg;
  var msg;
  if (numFailed > 0 ){
    msg = "numFailed items could not be added to your collection,\n " +  numAdded + " items were added to " + collHref;
    alertMsg = "<div class='LSerror'>" + msg + "</div>";
  }
  else {
    //  var msg =  params.NumAdded + " items of " + params.NumSubmitted + " were added to " + collHref + " collection";
    if (numAdded >1){
      msg =  numAdded + " items were added to " + collHref;
    }
    else{
      msg =  numAdded + " item was added to " + collHref;
    }
    alertMsg="<div class='alert'>" + msg + "</div>";
  }

  YAHOO.mbooks.errormsg.setBody(alertMsg);
  YAHOO.mbooks.errormsg.show();
  uncheckAll_LS();
  // check if its a new collection and if so, add it to the widget!
  addCollToWidget(collID,collName);
}

function  addCollToWidget(collID,collName){
  // do we need tricky innerhtml and IE hacks or can we just do some magic DOM stuff?
  var CollWidget= document.getElementById('LSaddItemSelect');
  var Opts=CollWidget.options;
  var AlreadyThere=false;

  for (var i=0; i < Opts.length; i++) {
    if (collID === Opts[i].value ){
      AlreadyThere=true;
    }
  }
  if (AlreadyThere !== true){
    //create new option object
    var newOption = document.createElement('option');
    // set properties
    newOption.value=collID;
    newOption.text=collName;

      // add it
    //Stupid IE implements the select.add() method differently than anybody else!

    try
    {
      CollWidget.add(newOption,null); // standards compliant
    }
    catch(ex)
    {
      CollWidget.add(newOption); // IE only
    }
  }
    // is it better to create an options object and then push it on array?
    //    Opts.[i+1].value="";
    //Opts.[i+1]
  //XXX TODO:  this adds it to html select element, but NewCollOverlayCore gets list of Colls to check for dupes from someplace else.  Need to find it!!!
}

function debugWindowWrite(html) {
        var w = window.document;
        w.open();
        w.writeln(html);
        w.close();
}


var handleFailure = function(o) {
  dMsg("handle failure called");
  YAHOO.mbooks.loadingLS.hide();
  YAHOO.mbooks.errormsg.setBody("<div class='LSerror'>Communication failure. Could not add items to your collection.</div>");
  YAHOO.mbooks.errormsg.show();

  setRequestUrl("");
};

var callback = {
  success:handleSuccess,
  failure:handleFailure
};


var addItemsToCollection = function(o) {
  dMsg("addItemsToCollection called");  
  ITEMS_SELECTED = [];
  init(); //init new coll widget (this is in newCollOverlayCore and suppresses copy/move buttons etc. tbw)
  YAHOO.mbooks.errormsg.hide();
  YAHOO.mbooks.loadingLS.setBody("<div class='LSloading'>Loading, please wait ...</div>");
  YAHOO.mbooks.loadingLS.render(document.body);

  populateSelected();
  
  if (ITEMS_SELECTED.length <1){
    YAHOO.mbooks.errormsg.setBody("<div class='LSerror'>You must choose an item</div>");
    YAHOO.mbooks.errormsg.show();
    YAHOO.util.Event.preventDefault(o);
  }
  else if (getCollMenuVal()==NEW_COLL_MENU_VALUE) {
    dMsg("new coll selected");
    initNewCollUrl();
    setReferrer("LS");
    //Set position of new collection widget, done to reset position after drag-drop.
    YAHOO.mbooks.newCollectionPanel.moveTo(100,250);
    addToNewCollection(getRequestUrl());
    //add new collection to dropdown if successful
  }
  else if (getCollMenuVal()==SELECT_COLL_MENU_VALUE) {
    YAHOO.mbooks.errormsg.setBody("<div class='LSerror'>You must select a collection</div>");
    YAHOO.mbooks.errormsg.show();
    YAHOO.util.Event.preventDefault(o);
  }
  else  {
      YAHOO.util.Event.preventDefault(o);

      var addNumItems = ITEMS_SELECTED.length;
      var COLL_SIZE_ARRAY = getCollSizeArray();
      var coll_id = getCollMenuVal();
      var collSize = COLL_SIZE_ARRAY[coll_id];
      if (confirmLarge(collSize, addNumItems)) {
          initExistingCollUrl();
          processRequest();
      }
  }
};



function processRequest() 
{
  YAHOO.mbooks.loadingLS.show();
  dMsg("process request");
  YAHOO.util.Connect.asyncRequest('GET', getRequestUrl(), callback);
  return false;
}

function initExistingCollUrl() 
{
  var existingCollid = getCollMenuVal();	
  rUrl = constructAddItemsUrl() + 'a=addits;c2=' + existingCollid;		
  dMsg("rUrl is "+rUrl);
  return rUrl;
}


function populateSelected(){
  var idlist=document.getElementsByName("id");
  for (var i=0;i<idlist.length;i++){
    if(idlist[i].type == 'checkbox' && idlist[i].checked && idlist[i].id !=='checkAll'){
      ITEMS_SELECTED.push(idlist[i].value);
    }
  }
}

function uncheckAll_LS(){
  var idlist=document.getElementsByName("id");
  for (var i=0;i<idlist.length;i++){
    if(idlist[i].type == 'checkbox' && idlist[i].checked){
      idlist[i].checked = false;
    }
  }
  //uncheck the check all button if it was checked
   var checkall = document.getElementById("checkAll");
   checkall.checked = false;
}


function constructAddItemsUrl() 
{
  //populateSelected() gets list of ids from DOM and puts it in ITEMS_SELECTED array
  var addItemsURL = 'mb?page=ajax;'  ;
  var idParams = '';
  for (var i=0;i<ITEMS_SELECTED.length;i++) {
    idParams = idParams +"id=" +ITEMS_SELECTED[i] + ';';
  }
  addItemsURL = addItemsURL  + idParams;
  return addItemsURL;
}


function initNewCollUrl() 
{
  rUrl = constructAddItemsUrl() + 'a=additsnc';
}

function setRequestUrl(url)  
{
  dMsg("setting request url to " + url);
	rUrl = url;
}

function getRequestUrl() 
{
  dMsg ("in getRequestURL " + rUrl);
	return rUrl;
}

function getCollMenuVal() 
{
        var selectedIndex = document.getElementById('LSaddItemSelect').selectedIndex;
        var value = document.getElementById('LSaddItemSelect')[selectedIndex].value;
        return value;
}

function addToNewCollection(url) 
{
  dMsg("addToNewCollection function");
  setPostURL(url);
  
  initializeButtons();
  // need addItems instead of addI in newCollOverlayCore form and need to hide it.
  YAHOO.mbooks.addItems.show();
  
  //Add listener to cancel link
  YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);
  YAHOO.mbooks.newCollectionPanel.show();
}

//YAHOO.util.Event.preventDefault("form_lsCB.onSubmit");

YAHOO.util.Event.addListener("LSaddItemsBtn", "click", addItemsToCollection);

