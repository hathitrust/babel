//checktrunc.js
//$Id: checktrunc.js,v 1.1 2009/11/16 22:16:13 tburtonw Exp $

var MIN_CHARS = 3; //minimum number of characters before the truncation operatior can be used


var interceptSearchSubmit = function(e) {
  var frm = document.getElementById("itemlist_searchform");
  var query =frm.q1.value;
  //alert ("query is "+ query);
  var index = query.indexOf('*');
  //alert ("index is "+ index);
  

  var msg ="You must have at least " + MIN_CHARS + " characters before using the \"*\"  truncation operator";
  var div = "<div class='error'>" + msg + "</div>";

  if (index !== -1)// indexOf returns -1 if "*" not found otherwise it returns the first occurance.
  {
    //alert('there was a asterisk found');
    var words = query.split(" ");
    for (i=0; i< words.length;i++){
      //alert( "i is " + i + "word is " +words[i]);
      var wordindex=words[i].indexOf('*');
      if (wordindex !== -1 && wordindex < MIN_CHARS ){
        YAHOO.mbooks.ls_errormsg.setBody(div);
        YAHOO.mbooks.ls_errormsg.show();
        YAHOO.util.Event.preventDefault(e);
        return;
      }
    }
  }
}

function initTruncHandler(){
  //  alert("this is initTruncHandler in checktrunc.js");
  YAHOO.util.Event.addListener("srch", "click", interceptSearchSubmit);
  YAHOO.mbooks.ls_errormsg = new YAHOO.widget.Module("ls_errormsg", { visible: false });
  YAHOO.mbooks.ls_errormsg.render();

}
