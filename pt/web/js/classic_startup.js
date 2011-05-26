var HT = HT || {};

HT.resizeBookReader = function() {
  
  var $container = $("#mdpContentContainer");
  var $body = $("body");

  $container.width($body.width() - HT.config.ARBITRARY_PADDING);
}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

$(document).ready(function() {
  HT.resizeBookReader();
})