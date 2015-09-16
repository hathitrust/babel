
//alert("this is ls_clicklog.js");
/**

**/
//ls_clicklog.js
head.ready(function()  
{
//alert("head is ready to be served");

//global data
//var global = 

/**
links to pt are:
<a class = viewonly or fulltext
**/
    //.click( [eventData ], handler http://api.jquery.com/click/
    // global data could be put into js on load and then passed in with this method signature
    //      .click(data,handler)
    $("a.viewonly, a.fulltext").click(handle_click);

    function handle_click(e)
    {
	var d = $(e.target).attr('data_clicklog');
	alert("clicked: "+d);
    }
}
  );