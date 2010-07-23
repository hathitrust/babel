//Script: newCollOverlayCB.js
//This javascript is used for collection list and collection items views. 

YAHOO.namespace("mbooks");

//Methods for collection items view
var DEFAULT_COLL_MENU_OPTION = "Select Collection";
var NEW_COLL_MENU_OPTION = "[CREATE NEW COLLECTION]";
var SRC_COLLECTION = "";
var ITEMS_SELECTED = [];
var DEFAULT_SLICE_SIZE=25;//XXX need to get this dynamically from xsl/javascript?

function initCB() {
	
	init();	
	
	//This is the confirmation message "# items have.." that appears after a successful action
	//The alert id may or may exist in the html, but when it does, it will be hidden when
	//a error message is displayed.
	//YAHOO.mbooks.errormsg is already declared in newCollOverlayCore.js
	YAHOO.mbooks.alert = new YAHOO.widget.Module("alert", { visible: false });
	YAHOO.mbooks.alert.render();	 

	YAHOO.mbooks.defaultCollParams.setBody("<input type='hidden' id='newcoll_sz' name ='sz' value='" + DEFAULT_SLICE_SIZE +"'>"+
		"<input type='hidden' id='newcoll_pn' name ='pn' value='1'>" +
		"<input type='hidden' id='newcoll_sort' name ='sort' value='title_a'>");
	YAHOO.mbooks.defaultCollParams.show();

	populateSelected();

	setReferrer("CB");

}

/*********************************************************************
   function getCgiParams

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
  var pairs = temp[1].split(/\;|\&/);
  for (var i = 0; i < pairs.length; i++){
    var keyvalue = pairs[i].split(/\=/);
    var key = keyvalue[0];
    var value = keyvalue[1];
    params[key] = value;
  }
  return params;
}

function populateHiddenItemsField() {
	var results = "<INPUT type='hidden' value='" + SRC_COLLECTION + "' name='c' id='c'>";
	for (var i=0;i<ITEMS_SELECTED.length;i++) {
		results = results + "<INPUT type='hidden' value='" + ITEMS_SELECTED[i] + "' name='iid' id='id'>";
	}

	YAHOO.mbooks.itemsSelected.setBody(results);
	YAHOO.mbooks.itemsSelected.show();
	return results;
}

function populateSelected() {
	var frm = document.getElementById("form1");
	ITEMS_SELECTED = [];

	for (var i=0;i<frm.length;i++)
	{
          //	don't include the "checkAll" button :tbw
          if(frm.elements[i].type == 'checkbox' && frm.elements[i].checked && frm.elements[i].id !=='checkAll') {
		   ITEMS_SELECTED.push(frm.elements[i].value);
		}

	 }
}

function addPagingParams()
{
  // get hidden params and use them to replace the defaults in newcoll form
  var params=getCgiParams();

  if (params['sz'] != null)
  {
    document.newcoll.elements["newcoll_sz"].value = params['sz'];
  }
  if (params['pn'] != null)
  {
    document.newcoll.elements["newcoll_pn"].value = params['pn'];
  }
  if (params['sort'] != null)
  {
	  document.newcoll.elements["newcoll_sort"].value = params['sort'];
  }
  
}

var interceptNewCollMenu = function(e) 
{
	initCB();

        //tbw IE workaround
        var a_action;
        if (this.id == "copyit"){a_action ="copyit" };
        if (this.id == "movit"){a_action ="movit" };
        if (this.id == "delit"){a_action ="delit" };
        var myForm = document.getElementById('form1');
        myForm.a.setAttribute('value', a_action);
        //tbw

	YAHOO.mbooks.errormsg.hide();

	var selectedCollectionNameHTML = document.getElementById('c2')[document.getElementById('c2').selectedIndex].innerHTML;
	var selectedCollectionNameVal = document.getElementById('c2').value;

	if(ITEMS_SELECTED.length==0) 
	{
		YAHOO.mbooks.errormsg.setBody("<div class='error'>You must choose an item</div>");
		YAHOO.mbooks.errormsg.show();
		YAHOO.util.Event.preventDefault(e);
	}
	//Check to see if dropdown item selected is still "Select Collection"
	//this is different for ie than other browsers, thus the two conditionnels
	else if( ((selectedCollectionNameHTML==DEFAULT_COLL_MENU_OPTION) || (selectedCollectionNameVal==DEFAULT_COLL_MENU_OPTION)) &&
		(this.id == "copyit" || this.id =="movit" || this.id =="addI")) 
	{
		YAHOO.mbooks.errormsg.setBody("<div class='error'>You must select a collection.</div>");
		YAHOO.mbooks.errormsg.show();
                YAHOO.mbooks.alert.hide();
		YAHOO.util.Event.preventDefault(e);
	}
	//Check to see if dropdown item selected is new collection
	//this is different for ie than other browsers, thus the two conditionnels
	else if( (selectedCollectionNameHTML==NEW_COLL_MENU_OPTION) || (selectedCollectionNameVal==NEW_COLL_MENU_OPTION)) 
	{

		SRC_COLLECTION = document.form1.c.value;
		populateHiddenItemsField();
		addPagingParams();

		YAHOO.util.Event.preventDefault(e);

		//initializeButtons();

		if(this.id == "addC")
		{
			YAHOO.mbooks.addC.show();
		}
		else if(this.id == "addI")
		{
			document.newcoll.elements["additnc"].textContent = "Add " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["additnc"].value = document.newcoll.elements["additnc"].textContent;
			document.newcoll.elements["action"].value="additnc";
			YAHOO.mbooks.addI.show();
		}
		else if(this.id == "copyit")
		{
			document.newcoll.elements["copyitnc"].textContent = "Copy " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["copyitnc"].value = document.newcoll.elements["copyitnc"].textContent;
			document.newcoll.elements["action"].value="copyitnc";
			YAHOO.mbooks.copy.show();
		}

		else if(this.id == "movit")
		{
			document.newcoll.elements["movitnc"].textContent = "Move " + ITEMS_SELECTED.length + " item(s)";
			document.newcoll.elements["movitnc"].value = document.newcoll.elements["movitnc"].textContent;
			document.newcoll.elements["action"].value="movitnc";
			YAHOO.mbooks.move.show();
		}

		//Add listener to cancel link	
		YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);
		
		YAHOO.mbooks.charsRemainingColl.show();
		YAHOO.mbooks.charsRemainingDesc.show();
		YAHOO.mbooks.newCollectionPanel.show();
	}
	else 
	{
          YAHOO.mbooks.errormsg.hide();
	  
         //tbw IE6 workaround
          myForm.submit();
	}
}


var interceptEditCollButton = function(e) {
	initCB();

	YAHOO.mbooks.errormsg.hide();

	var editCollName = document.getElementById('CollNameEdit').value;
        var userError = 0;
        if (editCollName==DEFAULT_COLL_MENU_OPTION || editCollName==NEW_COLL_MENU_OPTION) {
                // Prevent use of system names
		YAHOO.mbooks.errormsg.setBody('<div class="error">"' + editCollName + '" cannot be used to name a collection.  Please choose a different name.</div>');
                userError = 1;
	}
        else {
                var nameExists = 0;
                var currCollName = document.getElementById('currCollName').innerHTML;
                for (var i=0; i<COLL_NAME.length; i++) {
                        if(editCollName==COLL_NAME[i]) {
                                if (editCollName!=currCollName) {
                                        nameExists = 1;
                                }
                        }
                }
                if (nameExists==1) {
                        YAHOO.mbooks.errormsg.setBody('<div class="error">You already have a collection named "' + editCollName + '"</div>');
                        userError = 1;
                }
        }

        if (userError==1) {
                YAHOO.util.Event.preventDefault(e);
                YAHOO.mbooks.errormsg.show();
                YAHOO.mbooks.alert.hide();
        }
        else {
		var editForm = document.getElementById('editcoll');
		editForm.submit();
	}
}

YAHOO.util.Event.addListener("copyit", "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("movit",  "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("delit",  "click", interceptNewCollMenu);
YAHOO.util.Event.addListener("editc",  "click", interceptEditCollButton);

//Methods for collection list view

function initCV() {
	
	init();
	setReferrer("CV");		
}

var interceptNewCollButton = function(e) {
	initCV();
	
	YAHOO.util.Event.preventDefault(e);

	initializeButtons();	

	YAHOO.mbooks.addC.show();
	document.newcoll.elements["action"].value="addc";
		
	//Add listener to cancel link
	YAHOO.util.Event.addListener("cancel", "click", interceptNewCollSubmit);	
	
	YAHOO.mbooks.newCollectionPanel.show();
}

YAHOO.util.Event.addListener("createNewColl", "click", interceptNewCollButton);

//End newCollOverlayCB.js
