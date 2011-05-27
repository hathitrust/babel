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
  
  $("#mdpImage").load(function() {
    var $container = $("#mdpContentContainer");
    if ( $(this).height() < $container.height() ) {
      var h = $(this).height() + 10;
      $container.height($container.height())
                .css('min-height', '')
                .removeClass('fakeContentLoader')
                .animate({ height: h }, 150);
    }
  })
  
})