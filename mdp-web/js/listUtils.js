
function get_selected(id)
{
  var s=document.getElementById(id);
  var indexSelected = s.selectedIndex;
  var selected = s.options[indexSelected].value;
  return selected;

}

function jumpToColl()
{
  var l = window.location;
  var host = l.host;
  var path = l.pathname;
  var prot = l.protocol;
  var params = l.search;

  //  alert("input host is "+ host + " path is " + path +" params is " + params + "proto is " + prot);

  var c = get_selected('jumpToColl');

  var new_params = 'a=listis;c=' + c ;

  /** right now we only get sz param.  Do we want sort param as well**/
  var sz;
  var regex =/(sz=[^\&\;]+)[\&\;]/;
    
  var result = params.match(regex);
  if (result !== null)
  {
    sz = result[1];
    // alert("sz is now " + sz + "[1] is " + result[1] + "2" + result[2] + "0" +result[0]);
    new_params = new_params + ';' + sz +';';
  }

  /* When called from pageturner or LS (pt or ls) go to collection builder (mb) */
  path = path.replace(/ptsearch/g, "mb");
  path = path.replace(/pt/g, "mb");
  path = path.replace(/ls/g, "mb");

  var newloc = prot +'//'+ host + path +'?' + new_params;
  //  alert("newloc is "+ newloc);
  window.location = newloc;

}



/**Functions for sorting widget  **/
function doSort()
{
  var temploc= window.location.toString();
  var new_sort = get_selected('SortWidgetSort');
  var new_loc;

  //if there is a sort replace it
  if (/sort/.test(temploc))
  {
    new_loc = temploc.replace(/sort=(title|auth|date|rel)_[ad]/,"sort="+new_sort);
  }
  else
  {
    // otherwise add it  do we need to add & or ; ?
    new_loc = temploc + ";sort=" + new_sort;
  }
  window.location=new_loc;
}

/**End functions for sort widget   **/

/** 
Slice widget code
When user changes slice size in slice size widget, initiate a redisplay the list with only that number of records/slice
**/

/**  can't discover how to do an "onChange" in YUI so using regular javascript in the XSL/HTML instead of YUI**/
//YAHOO.util.Event.addListener("sz", "click", redisplay_new_slice_size);

function get_new_size(which)
{
  var s=document.getElementById(which);
  var indexSelected = s.selectedIndex;
  var new_size = s.options[indexSelected].value;
  return new_size;
}


function redisplay_new_slice_size(which_paging)
{
  var which = which_paging;
  var temploc = window.location.toString();
  var new_size = get_new_size(which);
  var new_loc1;
  var new_loc2;

  //fix for fac bac solr  if there is a new size we need to redo solr search because solr is doing the paging
  if (/a=listsrchm/.test(temploc))
  {
    // alert("temloc is "+temploc);
     new_loc1=temploc.replace(/a=listsrchm/,"a=srchm");
     temploc=new_loc1;
  }

  //if there is a sz replace it
  if (/sz/.test(temploc))
  {
     new_loc1=temploc.replace(/sz=(\d+)/,"sz="+new_size);
  }
  else
  {
    // otherwise add it  do we need to add & or ; ?
    new_loc1=temploc+ ";sz=" + new_size;
  }

  if (/pn/.test(new_loc1))
    {
      new_loc2=new_loc1.replace(/pn=(\d+)/,"pn=1"); 
      //reset page to first page
    }
    else
    {
      new_loc2=new_loc1 + ";pn=1";
    }

  //   alert("new_loc1 is " + new_loc1 +"\ncurrent loc is "+ temploc + "\nnew size is" + new_size + "\nnew_loc2 is " + new_loc2 );

    location=new_loc2;
}



/**  End slice size code **/


/** XXX  now this does not only contain the checkall code so these global vars are probably not ok **/
/***

var tag='input' ;//checkbox
var class='iid';
***/
var root=document.getElementById('itemTable');

var checkboxes;

var  checkIt= function(el)
{
  el.checked=true;
};

var  unCheckIt= function(el)
{
  el.checked=false;
};
  
var checkAll =function()
{
  checkboxes = YAHOO.util.Dom.getElementsByClassName('iid','input',root,checkIt);
};


var uncheckAll =function()
{
  checkboxes = YAHOO.util.Dom.getElementsByClassName('iid','input',root,unCheckIt);
};

var changeAllCheckboxes  =  function(e)
{
  var master;
  if (typeof e.currentTarget != 'undefined')
  {
     master=e.currentTarget;
  }
  else
  {
    //DOM workaround for I.E.
          master=e.srcElement;
  }
 
  if (master.checked === true)
  {
    checkAll();
  }
  else
  {
    uncheckAll();
  }
};


function initCheckall()
{
  YAHOO.util.Event.addListener("checkAll", "click", changeAllCheckboxes);

}

// this is how to do a body onload in YUI : YAHOO.util.Event.addListener(window, "load", initCheckall);

/****************************************************************************************/
/** general js utility function**/


function doYouReally(collname)
{
  return  confirm("Really delete collection: " + collname + "?");
}

function confirmLarge(collSize, addNumItems) {
    if (collSize + addNumItems <= 1000) {
        //alert("Coll will remain small ...");
        return true;
    }
    else if (collSize <= 1000) {
        var numStr;
        if (addNumItems > 1) {
            numStr = "these " + addNumItems + " items";
        }
        else {
            numStr = "this item";
        }
        var msg = "Note: Your collection contains " + collSize + " items.  Adding " + numStr + " to your collection will increase its size to more than 1000 items.  This means your collection will not be searchable until it is indexed, usually within 1-5 days.  After that, just newly added items will see this delay before they can be searched. \n\nDo you want to proceed?"
    
        var answer = confirm(msg);
    
        if (answer) {
            //alert("Ok adding ...");
            return true;
        }
        else {
            //alert ("Not adding ....");
            return false;
        }
    }
    else {
        //alert("Coll already large ...");
        return true;
    }
}


//End listUtils.js
