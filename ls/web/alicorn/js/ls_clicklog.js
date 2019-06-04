//global data
var $container = $(".results-container");
var gd = $container.data('gdata');

// logger url
var logger_url = $container.data('logger-url');

// $("a.viewonly, a.fulltext, a.cataloglinkhref").click(gd,handle_click);

$container.on('click', '.resource-access-container a', handle_click);
//logs right click context menu, might not open in new window/tab but best we can do
$container.on('contextmenu', '.resource-access-container a', handle_context_menu);

// $("a.viewonly, a.fulltext, a.cataloglinkhref").on("contextmenu",gd,handle_context_menu);

function handle_context_menu(e)
{
  var $this = $(e.target);
  var clicktype = $this.data('clicktype');
  var clickdata = $this.data('clickdata');
  var item_data = $.extend({}, { click_type: 'context_menu', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd});
  $.post(logger_url,'clicked=' + msg);
}

function handle_click(e)
{
  var $this = $(e.target);
  var clicktype = $this.data('clicktype');
  var clickdata = $this.data('clickdata');
  var item_data = $.extend({}, { click_type: 'click', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd});
  // var msg= "clicked={\"item\":"+d+",\"global\":"+gd+"}";
  //$.post( "//tburtonw-full.babel.hathitrust.org/cgi/ls/logger",msg );
  $.post(logger_url,'clicked=' + msg);
}

