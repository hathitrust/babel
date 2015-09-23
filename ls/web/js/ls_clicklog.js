
//alert("this is ls_clicklog.js");
/**

**/
//ls_clicklog.js
head.ready(function()  
{
    var debug="true";
    //alert("head is ready to be served");


    /**
       links to pt are:
       <a class = viewonly or fulltext
       .click( [eventData ], handler http://api.jquery.com/click/
       
    **/

    //global data
    var gd =  $("#globalclick");

    //      .click(data,eventData,handler)
    //TODO: add event for clicking on catalog link
    $("a.viewonly, a.fulltext, a.cataloglinkhref").click(gd,handle_click);


    function test_handle_click(e)
    {

	var gd = e.data.text();
	var d = $(e.target).attr('data_clicklog');
	alert("clicked: "+d+"|globbal:"+gd);
    }

    //---------------------------------------------------------------------//
    function handle_click(e)
    {
	var gd = e.data.text();
	var d = $(e.target).attr('data_clicklog');
	var msg= "clicked={item:"+d+",global:"+gd+"}}";
//	alert(msg);
	$.post( "//tburtonw-full.babel.hathitrust.org/cgi/ls/logger",msg );
    }
}
  );