// UTILITIES

HT.resizeBookReader = function() {
	//console.log("HT.resizeBookReader()");
	
	
	
  var viewportHeight = window.innerHeight ? window.innerHeight : $(window).height();
  var innerHeight = $("#mbFooter").height() + $("#mbHeader").height();
  var textDenyHeight = 0;
  var $textDeny = $("#mdpTextDeny");
  if ( $textDeny.length > 0 ) {
    textDenyHeight = $textDeny.outerHeight() + 8;
  }
  var chromeHeight = innerHeight;
  if ( $("#mdpToolbar").is(":visible")) {
    chromeHeight += $("#mdpToolbar").height();
  }
  
  var currentIndex = HT.reader.currentIndex();
  
  //var bookreader_height = viewportHeight - chromeHeight - textDenyHeight - 25;
  var bookreader_height = viewportHeight;
  //var bookreader_height=$(window).height();
  if ( HT.reader.ui == 'embed' ) {
    bookreader_height -= 32; // crollbar
  }
  //try{console.log("Resize 3: " + bookreader_height);console.log("Window height: " + $(window).height());}catch(err){}
  $("#BookReader, #BRcontainer").height(bookreader_height);
  
  // roger - rotating the device sometimes leaves BRcontainer with the old height
  if ( $("#BRcontainer").width() > $("#BookReader").width() ) {
    $("#BRcontainer").width($("#BookReader".width()));
  }
  
  //HT.reader.setScreenSize();
  
  //console.log("Resize -- #BRnav.bottom=" + $("#BRnav").css('bottom') );
  if(typeof $("#BRnav").css('bottom') != 'undefined' ){
	//  console.log("height=" + $("#BRnav").css('height') );
	  if($("#BRnav").css('bottom').charAt(0)=='-'){
		//  console.log("charAt(0)=" + $("#BRnav").css('bottom').charAt(0) );
		  
		  $("#BRnav").css('bottom', '-' + $("#BRnav").css('height'));
	  }else{
		  $("#BRnav").css('bottom', '0');
	  }
  }else{
	  $("#BRnav").css('bottom', '0');
  }
  $("#BRnavCntlBtm").css('bottom', $("#BRnav").css('height'));
  
  /* brk
  var $scrollable = $("div.mdpScrollableContainer");
  if ( $scrollable.length > 0 ) {
      var checkHeight = viewportHeight - innerHeight - $("div.bibLinks").height() - 50;
      $scrollable.removeAttr('style');
      if ( $scrollable.height() > checkHeight ) {
        $scrollable.height(checkHeight);
      }
  }
  */
  if ( HT.reader.ui == 'embed' ) {
      var $branding = $(".branding");
      var $embedLink = $(".embedLink");
      var $pageOptions = $("#mdpPageOptions");
      var w = $(window).width();
      var fixed = $branding.width() + $pageOptions.width() + 50;
      while (  fixed + $embedLink.width()  > w ) {
          $embedLink.width( $embedLink.width() - 5 );
          console.log("MUST NARROW:", $embedLink.width(), w);
      }
  }
  
  if ( currentIndex != null ) {
    setTimeout(function() {
      HT.reader.jumpToIndex(currentIndex);
    }, 500);
  }
  
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
    
    $(".mdpFeatureListItemLink").click(function() {
		try{
	        //$('#read').click();
  	      	if(HT.reader.displayMode=='image'){
	    	  $('#image').click();
	    	  HT.reader.jumpToIndex(parseInt($(this).attr('seq'))-1);
  	      	}else{
	    	  $('#ocr').click();
	    	  $("#BRocrcontainer div").remove();
	    	  HT.reader.loadOCR((parseInt($(this).attr('seq'))-1),HT.reader.chunkSize, "forward");
	      	}
	        
		}catch(err){
			alert(err.toString());
		}finally{
			return false;
		}
    });
    

    
    /*
    var element = document.getElementById('BRcontainer');

	if(element){
		console.log('startup - adding BRcontainer event listener');
		element.addEventListener("gesturechange", function() { console.log("gesture change / addeventlistener");}, false);
	}else{
		console.log('startup - not adding BRcontainer event listener');
		
	} 
	*/   
    // Load bookreader
    // delay loading metaURL - BAH HUMBUG
    
    HT.reader.openNotice();
    HT.reader.loadBookDataSlice(0);
    
    // if(false) {
    //     var data = lscache.get(HT.reader.bookId + "-0");
    //     console.log("CACHE:", HT.reader.bookId, "0", data);
    //     if ( data ) {
    //       HT.reader.init();
    //     } else {
    //       HT.reader.openNotice();
    //       HT.reader.loadBookDataSlice(0);
    //       // var params = HT.reader.getMetaUrlParams(0);
    //       // setTimeout(function() {
    //       //     $.getJSON(HT.reader.metaURL, params, function(data) {
    //       //       HT.reader.installBookDataSlice(0, data, true);
    //       //       HT.reader.init();
    //       //     });
    //       // }, 500);
    //     }
    // }
    
})

window.onorientationchange = function() {
    var redisplay_contents = $("#mdpMobileTableOfContents").is(":visible");
    if ( redisplay_contents ) {
      $("#mdpMobileTableOfContents").hide();
    }
    try{
    switch(window.orientation){
   case 90:
   case -90:
     //HT.reader.mode=3;
     if(HT.reader.mode!=HT.reader.constMode2up && HT.reader.displayMode!='text' && screen.width>320){
     //  console.log("switching to 2up");
     //  console.log("orientation change - switching to 2up");
       HT.resizeBookReader();
       HT.reader.switchMode(HT.reader.constMode2up);
     }else{
       HT.resizeBookReader();
     }
         break;
        case 0:
        case 180:
         if(HT.reader.mode!=HT.reader.constMode1up){
         //  console.log("orientation change - switching to 1up");
           HT.resizeBookReader();
           HT.reader.switchMode(HT.reader.constMode1up);
         }else{
           HT.resizeBookReader();
         }
         break;
        default:
         // ("no switch: " + window.orientation);
         break;
 }
 }catch(err){alert(err.toString())}
 // if ( redisplay_contents ) {
 //   setTimeout(function() {
 //     $("#toc").click();
 //   }, 500);
 // }
}

window.mockrotate = function(orientation) {
  
    HT.mock_mode = ( orientation == 0 ) ? 1 : 2;
  
    var redisplay_contents = $("#mdpMobileTableOfContents").is(":visible");
    if ( redisplay_contents ) {
      $("#read").click();
    }
    try{
    switch(orientation){
		case 90:
		case -90:
			//HT.reader.mode=3;
			if(HT.mock_mode == 2){
			//	console.log("switching to 2up");
			//	console.log("orientation change - switching to 2up");
				HT.resizeBookReader();
				HT.reader.switchMode(HT.reader.constMode2up);
				var spreadSize = HT.reader.getSpreadSizeFromReduce(HT.reader.twoPage.currentIndexL, HT.reader.twoPage.currentIndexR, HT.reader.reduce);
				var spreadSize = HT.reader.getIdealSpreadSize(HT.reader.twoPage.currentIndexL, HT.reader.twoPage.currentIndexR);
			}else{
				HT.resizeBookReader();
			}
        	break;
        case 0:
        case 180:
        	if(HT.mock_mode == 1){
        	//	console.log("orientation change - switching to 1up");
        		HT.resizeBookReader();
        		HT.reader.switchMode(HT.reader.constMode1up);
        	}else{
        		HT.resizeBookReader();
        	}
        	break;
        default:
        	("no switch: " + orientation);
        	break;
	}
	}catch(err){alert(err.toString())}
	if ( redisplay_contents ) {
	  setTimeout(function() {
  	  $("#toc").click();
	  }, 500);
	}

}

