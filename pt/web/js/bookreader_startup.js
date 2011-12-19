// UTILITIES

HT._getBookReaderHeight = function(is_fullscreen) {
  var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
  
  var innerHeight = $("#mbFooter").height() + $("#mbHeader").height();
  var textDenyHeight = 0;
  var $textDeny = $("#mdpTextDeny");
  if ( $textDeny.length > 0 ) {
    textDenyHeight = $textDeny.outerHeight() + 8;
  }
  var chromeHeight = innerHeight;
  if ( $("#mdpToolbar").is(":visible") ) {
    chromeHeight += $("#mdpToolbar").height();
  } else if ( HT.cache && HT.cache.mdpToolbar ) {
    chromeHeight += HT.cache.mdpToolbar;
  }
  
  var bookreader_height = viewportHeight - chromeHeight - textDenyHeight - 25;
  if ( HT.reader.ui == 'embed' ) {
    bookreader_height -= 32; // scrollbar
  }

  if ( $("#mbHeader").is(":hidden") || is_fullscreen ) {
    // $("#mbFooter").hide().css('z-index', 10);
    // $("#mbHeader").hide();
    // $(".MBooksNav").css('margin-right', "20px");
    // $("#mbToggleHeader").show();
    bookreader_height += $("#mbHeader").height() + $("#mbFooter").height();
    innerHeight = 0;
  }

  return { bookreader_height : bookreader_height, 
          viewportHeight : viewportHeight,
          innerHeight : innerHeight };
}

HT.resizeBookReader = function(is_fullscreen) {
  
  var dims = HT._getBookReaderHeight(is_fullscreen);
  $("#BookReader,#BRcontainer").height(dims.bookreader_height);
  
  var $scrollable = $("div.mdpScrollableContainer");
  if ( $scrollable.length > 0 ) {
      var checkHeight = dims.viewportHeight - dims.innerHeight - $("div.bibLinks").height() - 50;
      var scrollable_height = $scrollable.height();
      $scrollable.removeAttr('style');
      if ( scrollable_height >= checkHeight ) {
        // $scrollable.data('height', $scrollable.height);
        $scrollable.height(checkHeight);
      }
  }

  var $body = $("body");
  var $container = $(".contentContainerWrap"); // $("#mdpContentContainer");

  var padding = HT.config.ARBITRARY_PADDING + $(".mdpControlContainer").width();
  if ( HT.reader.ui == 'embed' ) {
      var $branding = $(".branding");
      var $embedLink = $(".embedLink");
      var $pageOptions = $("#mdpPageOptions");
      var w = $(window).width();
      var fixed = $branding.width() + $pageOptions.width() + 50;
      while (  fixed + $embedLink.width()  > w ) {
          $embedLink.width( $embedLink.width() - 5 );
          // console.log("MUST NARROW:", $embedLink.width(), w);
      }
      padding = 0;
  } else if ( $body.hasClass("fullscreen") ) {
    // for the scrollbar
    padding = 32;
  }
  
  // add 10 for the padding we turn off for BookReader
  $container.width($body.width() - padding + 10);

}


$(window).bind("resize", function() {
  HT.resizeBookReader();
})

// PREPPING AND LOADING SECTION
// override slice size from params
var newHash = window.location.hash.substr(1);
if(newHash.indexOf("slice/") >= 0) {
    var parts = newHash.split('/');
    var slice_size;
    for(var i = 0; i < parts.length; i += 2) {
        if(parts[i] == 'slice') {
            slice_size = parts[i+1];
            break;
        }
    }
    HT.reader.slice_size = parseInt(slice_size);
}

// update slice_size to match thumbColumns
while ( HT.reader.slice_size % HT.reader.thumbColumns != 0 ) {
    HT.reader.slice_size += 1;
}

$(document).ready(function() {
    
    $("#mdpImage").hide();
    HT.resizeBookReader();
        
    // Load bookreader
    // delay loading metaURL - BAH HUMBUG
    
    HT.reader.openNotice();
    HT.reader.loadBookDataSlice(0);
    
    // SETUP FULL SCREEN MODE
    if ( HT.params.ui == "reader" ) {
      $('<a href="#" id="mbToggleHeader" title="Enter Full Screen"></a>')
        .prependTo("#mdpToolbarViews");

      $("#mbToggleHeader").click(function() {

        var speed = "fast";
        var $toggleButton = $(this);

        var fx_in = { opacity: 0.0 };
        var fx_out = { opacity: 1.0 };

        var zindex = $("#BookReader").css('z-index');
        if ( $.browser.msie ) {
          $("#BookReader").css('z-index', -10);
        }

        $("#mdpUberContainer").animate(fx_in, speed, function() {
          $("body").toggleClass("fullscreen");
          $("#mbFooter").toggle("blind", speed, function() {
            $("#mbHeader").toggle("blind", function() {
              HT.resizeBookReader(true);
              $toggleButton.toggleClass("active");
              if ( $toggleButton.hasClass("active") ) {
                $toggleButton.data("original-title", $toggleButton.attr("title"));
                $toggleButton.attr("title", $toggleButton.attr("title").replace("Enter", "Exit"));
              } else {
                $toggleButton.attr("title", $toggleButton.data("original-title"));
              }
              $(window).trigger('resize');
              $("#mdpUberContainer").animate(fx_out, speed, function() {
                if ( $.browser.msie ) {
                  $("#BookReader").css('z-index', zindex);
                }
              });
            });
          })
        })

        return false;
      })
    }
        
})
