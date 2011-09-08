var HT = HT || {};

HT.resizeBookReader = function() {
  
  var $container = $("#mdpContentContainer");
  var $body = $("body");

  var w = $body.width() - $(".mdpControlContainer").width() - HT.config.ARBITRARY_PADDING;
  $container.width(w);
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