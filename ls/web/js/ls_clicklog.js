
//alert("this is ls_clicklog.js");
/**

**/
//ls_clicklog.js
head.ready(function()  
{
    //global data
    var gd =  $("#globalclick");

    $("a.viewonly, a.fulltext, a.cataloglinkhref").click(gd,handle_click);
    //logs right click context menu, might not open in new window/tab but best we can do
    $("a.viewonly, a.fulltext, a.cataloglinkhref").on("contextmenu",gd,handle_context_menu);


    function handle_context_menu(e)
    {
	var gd = e.data.text();
	var item_data = $(e.target).attr('data_clicklog');
	var fixed = fix_json(item_data);
	var d = add_cm_event_to_log(fixed);
	var msg= "clicked={\"item\":"+d+",\"global\":"+gd+"}";
	$.post( "//tburtonw-full.babel.hathitrust.org/cgi/ls/logger",msg );
    }

    function handle_click(e)
    {
	var gd = e.data.text();
	var item_data = $(e.target).attr('data_clicklog');
	var d = fix_json(item_data);
	var msg= "clicked={\"item\":"+d+",\"global\":"+gd+"}";
	$.post( "//tburtonw-full.babel.hathitrust.org/cgi/ls/logger",msg );
    }


    function fix_json(item_data)
    {
	// pt|{json stuff} to {"type":"pt", content of json stuff}  for pt or catalog
	
	var ary = item_data.split('|');
	var json_in = ary[1];
	var type = ary[0];
	// create json syntax for type
	var type_object = '"type":"'+type+'",';
	//remove leading bracket
	var json_temp = json_in.replace(/^\{/,'');
	//add bracket and type object
	var json_out = '{' + type_object + json_temp;
	return json_out;
    }

    function add_cm_event_to_log(fixed)
    {
	var cm = '"click_type":"context_menu",'
	var out = '{' + cm + fixed.replace(/^\{/,'');
	return out;
    }
}
  );



