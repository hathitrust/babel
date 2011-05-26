var HT = HT || {};

HT.resizeBookReader = function() {
  
  var $container = $("#mdpContentContainer");
  var $body = $("body");

  // if ( $.browser.msie && parseInt($.browser.version) < 8 ) {
  //   var $window = $(window);
  //   if ( $window.width() >= HT.config.ARBITRARY_WINDOW_WIDTH ) {
  //     $body.width($window.width());
  //   } else if ( $body.width() < HT.config.ARBITRARY_WINDOW_WIDTH ) {
  //     $body.width(HT.config.ARBITRARY_WINDOW_WIDTH);
  //   }
  // }

  $container.width($body.width() - HT.config.ARBITRARY_PADDING);
}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

$(document).ready(function() {
  HT.resizeBookReader();
})