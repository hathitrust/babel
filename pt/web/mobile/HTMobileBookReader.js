subclass(HTMobileBookReader, HTBookReader);

function HTMobileBookReader() {
    HTBookReader.call(this);
    this.chunkSize=5; // brk - used for retrieving ocr pages in bulk...
}

// twoPageTop()
//______________________________________________________________________________
// Returns the offset for the top of the page images
HTMobileBookReader.prototype.twoPageTop = function() {
   return 0;
}

// brk - subclassed to remove code adding extra height/width

HTMobileBookReader.prototype.getIdealSpreadSize = function(firstIndex, secondIndex) {
	
    var ideal = {};

    // We check which page is closest to a "normal" page and use that to set the height
    // for both pages.  This means that foldouts and other odd size pages will be displayed
    // smaller than the nominal zoom amount.
    var canon5Dratio = 1.5;
    
    var first = {
        height: this._getPageHeight(firstIndex),
        width: this._getPageWidth(firstIndex)
    }
    
    var second = {
        height: this._getPageHeight(secondIndex),
        width: this._getPageWidth(secondIndex)
    }
    
    var firstIndexRatio  = first.height / first.width;
    var secondIndexRatio = second.height / second.width;

    var ratio;
    if (Math.abs(firstIndexRatio - canon5Dratio) < Math.abs(secondIndexRatio - canon5Dratio)) {
        ratio = firstIndexRatio;
    } else {
        ratio = secondIndexRatio;
    }

    var totalLeafEdgeWidth = parseInt(this.numLeafs * 0.1);
    var maxLeafEdgeWidth   = parseInt($('#BRcontainer').attr('clientWidth') * 0.1);
    ideal.totalLeafEdgeWidth     = Math.min(totalLeafEdgeWidth, maxLeafEdgeWidth);
    
    //brk var widthOutsidePages = 2 * (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding) + ideal.totalLeafEdgeWidth;
    // brk var heightOutsidePages = 2* (this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
    
    //brk ideal.width = ($('#BRcontainer').width() - widthOutsidePages) >> 1;
    //brk ideal.width -= 10; // $$$ fudge factor
    ideal.width = ($('#BRcontainer').width()) >> 1;
    //brk ideal.height = $('#BRcontainer').height() - heightOutsidePages;
    //brk ideal.height -= 20; // fudge factor
    ideal.height = $('#BRcontainer').height();

    if (ideal.height/ratio <= ideal.width) {
        //use height
        ideal.width = parseInt(ideal.height/ratio);
    } else {
        //use width
        ideal.height = parseInt(ideal.width*ratio);
    }
    
    // $$$ check this logic with large spreads
    ideal.reduce = ((first.height + second.height) / 2) / ideal.height;
    
    return ideal;
}

// brk - this function subclassed soley to catch a js error...
HTMobileBookReader.prototype.paramsForTracking = function(params) {
    var self = this;
    var retval = {};
    if ( params == null ) {
        params = self.paramsFromCurrent();
    }
    var orient = self.rotationCache[params.index] == null ? 0 : self.rotationCache[params.index];
    if ( orient == 90 ) { orient = 1; }
    else if ( orient == 180 ) { orient = 2 ; }
    else if ( orient == 270 ) { orient = 3 ; }
    var size = (100 / self.reduce).toFixed(2);
    
    retval.id = self.bookId;
    retval.seq = params.index;
    retval.size = size;
    retval.orient = orient;

    try{
    retval.view = $(".PTbuttonActive").attr('href').replace(/.*view=(\w+).*/, '$1');
    }catch(err){}
    return retval;
}

//brk - make some adjustments to the original calculations...
HTMobileBookReader.prototype.calculateSpreadSize = function() {

	HTBookReader.prototype.calculateSpreadSize.call(this);
	
	this.twoPage.totalHeight = this.twoPage.height;
	this.twoPage.edgeWidth = 0;
    this.twoPage.leafEdgeWidthL = 0;
    this.twoPage.leafEdgeWidthR  =0;
    this.twoPage.bookCoverDivWidth=0;
    this.twoPage.gutter = 0;

    this.twoPage.middle = (this.twoPage.scaledWL+this.twoPage.scaledWR) >> 1;
    this.twoPage.totalWidth =  this.twoPage.scaledWL +  this.twoPage.scaledWR;

}

//brk - customize toolbar - can probably be cleaned up...

HTMobileBookReader.prototype.initToolbar = function(mode, ui) {
	// Contents
	$("#BookReader").append("<div id='BRtoolbar'>"
			+ "<div class='header'>"
			+ "<a class='htlogobutton' href='http://m.hathitrust.org'></a>"
       + "<a href='' id='toc' style='float: right'></a>"
       + "<a href='' id='read' class='backlink' style='display:none' >&lt;&lt; Back</a>"
       // + "<span class='booktitle'>" + $("#mdpTitle").html() + "</span>"
			+ "</div>"
        + "</div>");
    
    this.updateToolbarZoom(this.reduce); // Pretty format
        
    if (ui == "embed" || ui == "touch") {
        $("#BookReader a.logo").attr("target","_blank");
    }

    // $$$ turn this into a member variable
    var jToolbar = $('#BRtoolbar'); // j prefix indicates jQuery object
    
    // We build in mode 2
    jToolbar.append();

    this.bindToolbarNavHandlers(jToolbar);
    
    // Setup tooltips -- later we could load these from a file for i18n
    var titles = { '.logo': 'Go to Archive.org',
                   '.zoom_in': 'Zoom in',
                   '.zoom_out': 'Zoom out',
                   '.one_page_mode': 'One-page view',
                   '.two_page_mode': 'Two-page view',
                   '.thumbnail_mode': 'Thumbnail view',
                   '.print': 'Print this page',
                   '.embed': 'Embed bookreader',
                   '.book_left': 'Flip left',
                   '.book_right': 'Flip right',
                   '.book_up': 'Page up',
                   '.book_down': 'Page down',
                   '.play': 'Play',
                   '.pause': 'Pause',
                   '.book_top': 'First page',
                   '.book_bottom': 'Last page'
                  };
    if ('rl' == this.pageProgression) {
        titles['.book_leftmost'] = 'Last page';
        titles['.book_rightmost'] = 'First page';
    } else { // LTR
        titles['.book_leftmost'] = 'First page';
        titles['.book_rightmost'] = 'Last page';
    }
                  
    for (var icon in titles) {
        jToolbar.find(icon).attr('title', titles[icon]);
    }
    
    // Hide mode buttons and autoplay if 2up is not available
    // $$$ if we end up with more than two modes we should show the applicable buttons
    if ( !this.canSwitchToMode(this.constMode2up) ) {
        jToolbar.find('.two_page_mode, .play, .pause').hide();
    }
    if ( !this.canSwitchToMode(this.constModeThumb) ) {
        jToolbar.find('.thumbnail_mode').hide();
    }
    
    // Hide one page button if it is the only mode available
    if ( ! (this.canSwitchToMode(this.constMode2up) || this.canSwitchToMode(this.constModeThumb)) ) {
        jToolbar.find('.one_page_mode').hide();
    }

    // Switch to requested mode -- binds other click handlers
    this.switchToolbarMode(mode);	
	
	// We init the nav bar after the params processing so that the nav slider knows where
    // it should start (doesn't jump after init)
    if (this.ui == "embed") {
        this.initEmbedNavbar();
    } else {
        this.initNavbar();
    }
    this.bindNavigationHandlers();
    
    // brk add/move around contents and other pages... seems like a kluge-y approach... could some of this could be moved to the xsl?
    $('#mdpMobileTableOfContents').appendTo('#BookReader');
  
    $('#login').remove();
    $('#help').remove();
    
    $('#feedback').appendTo('#BRiteminfo');
    
    
    $('#BRsearch').appendTo('#BookReader');
    

    
    //$('#BRsearch').appendTo('body');
    
    $('#fullPdfLinkP').appendTo('#BRgetbook');
    $('#fullEpubLinkP').appendTo('#BRgetbook');
    
    //$('#mdpCatalogLink').prependTo('#BRtoolbar .header');
    $('#mdpCatalogLink').appendTo('#BRtoolbar .header');
    $('#mdpCatalogLink').addClass("backlink");
     
    var link=$('#epubLink').attr('href_epub');
    if(link){
    	link=link.replace('download','epub');
    	$('#epubLink').attr('href_epub',link);
    }
    
    $('#BRiteminfo').css('display','none');
    $('#mdpMobileTableOfContents').css('display','none');
    $('#BRsearch').css('display','none');
    
    // brk scrollingtodo
    $('#mdpMobileTableOfContents').dragscrollable({	dragStart: 'touchstart',
    												dragcontinue: 'touchmove',
    												dragend: 'touchend', 
    												dragSelector : 'div', 
    												acceptPropagatedEvent : true, 
    												preventDefault : false});
    
    $("#BookReader").append("<div id='BRocr'></div>");
    $("#BRocr").append("<div id='BRocrcontainer' class='hidebr'></div>"); // default to wrapped text
	//$("#BRocr").append("<div id='BRocrcontainer' ></div>");
	
	$('#BRocr').dragscrollable({dragSelector : '#BRocrcontainer', acceptPropagatedEvent : true, preventDefault : false });	
}

// initNavbar
//______________________________________________________________________________
// Initialize the navigation bar.
// $$$ this could also add the base elements to the DOM, so disabling the nav bar
//     could be as simple as not calling this function
HTMobileBookReader.prototype.initNavbar = function() {
    // Setup nav / chapter / search results bar
	var self=this;
	var author="";
	if ($("#mdpAuthor").html()!=null){
		author="<div>By " + $("#mdpAuthor").html() + "</div>";
	}
    
    $('#BookReader').append(
        '<div id="BRnav">'
            +     '<span>'
            +     "<button id='ocr'></button>"
            +     "<button id='image' style='display:none'></button>"
            +     " <button id='bookinfo'></button>"
            +     " <button id='imagesettings'></button>"
            +     " <button id='ocrsettings' style='display:none'></button>"
            +     " <button id='getbook'></button>"
            +     " <button id='booksearch'></button>"
            //+   " <button class='BRicon rollover two_page_mode' onclick='HT.reader.switchMode(2); return false;'/>"
            + 	  '</span>'
            +     '<div id="BRnavpos">' // Page slider and nav line
            +         '<div id="BRpager"></div>'  // Page slider
            +         '<div id="BRnavline">'      // Nav line with e.g. chapter markers
            +         '</div>'     
            +     '</div>'
        +     '<div id="BRnavCntlBtm" class="BRnavCntl BRdn"></div>'
        + '</div>'
    );
    
    $("#BRnavCntlBtm").css('bottom', $("#BRnav").css('height'));
    
    var self = this;
    
    $('#BRpager').slider({    
        animate: true,
        min: 0,
        /*max: this.numLeafs - 1,
        value: this.currentIndex()*/
        max: this.numLeafs - 1,
    	value: self.currentIndex()
    })
    .bind('slide', function(event, ui) {
    	
        self.updateNavPageNum(ui.value);
        $("#pagenum").show();
        
        return true;
    })
    
    .bind('slidechange', function(event, ui) { 	
        self.updateNavPageNum(ui.value); // hiding now but will show later
        $("#pagenum").hide();
        
        // recursion prevention for jumpToIndex
        if ( $(this).data('swallowchange') ) {
            $(this).data('swallowchange', false);
        } else {
            if(self.displayMode=='image'){
            	self.jumpToIndex(ui.value);
            }else{
            	$("#BRocrcontainer div").remove();
  	    	  	self.loadOCR((parseInt(ui.value)),self.chunkSize, "forward");
            }
        }
        
        return true;
    })
    .hover(function() {
            $("#pagenum").show();
        },function(){
            // XXXmang not triggering on iPad - probably due to touch event translation layer
            $("#pagenum").hide();
        }
    );
    
    //append icon to handle
    var handleHelper = $('#BRpager .ui-slider-handle')
    // $$$mang update logic for setting the page number label -- use page numbers if available
    .append('<div id="pagenum"><span class="currentpage"></span></div>');
    //.wrap('<div class="ui-handle-helper-parent"></div>').parent(); // XXXmang is this used for hiding the tooltip?

    this.updateNavPageNum(this.currentIndex());

    $("#BRzoombtn").draggable({axis:'y',containment:'parent'});
    
    /* Initial hiding
        $('#BRtoolbar').delay(3000).animate({top:-40});
        $('#BRnav').delay(3000).animate({bottom:-53});
        changeArrow();
        $('.BRnavCntl').delay(3000).animate({height:'43px'}).delay(1000).animate({opacity:.25},1000);
    */
    
    
    $('#BookReader').append(
            '<div id="BRupdownnavbar" >'
                +     "<a id='pageup'></a>"
               // +	  "<br />"
                +     "<a id='pagedown'></a>"
            + '</div>'
        );
    
    this.hideToolbars();
    
}

// bindNavigationHandlers
//______________________________________________________________________________
// Bind navigation handlers
HTMobileBookReader.prototype.bindNavigationHandlers = function() {

    var self = this; // closure
    jIcons = $('.BRicon');

    jIcons.filter('.onepg').bind('click', function(e) {
        self.switchMode(self.constMode1up);
    });
    
    jIcons.filter('.twopg').bind('click', function(e) {
        self.switchMode(self.constMode2up);
    });

    jIcons.filter('.thumb').bind('click', function(e) {
        self.switchMode(self.constModeThumb);
    });
    
    jIcons.filter('.fit').bind('fit', function(e) {
        // XXXmang implement autofit zoom
    });

    jIcons.filter('.book_left').click(function(e) {
        // brk self.ttsStop();
        self.left();
        return false;
    });
    
    $('#bookinfo').click(function(e) {
      try{
        self.getBookOption=0;
        var html = "<div>" + $("#BRiteminfo").html() + "</div>";
        var $notice = new Boxy(html, {
              show : true,
              modal : true,
              draggable : true,
              closeable : true,
              title : "Info",
              behaviours: function(r) {
                $(r).find('#feedback').css('display',''); // still needed???
            
                $(r).find('#mobilefeedbackdiv a.mobilefeedback').click(function() {
                  Boxy.get(r).hide();
                  return self.feedback();
                });
              },
	         });
     }catch(err){alert(err.toString())};
    	
    });
    
    $("#ocrsettings").click(function (e) {
    	try{
    		self.getBookOption=0;
    		var html = "<div>" + $("#BRocrsettings").html() + "</div>";
	    	var $notice = new Boxy(html, {
	            show : true,
	            modal : true,
	            draggable : true,
	            closeable : true,
	            title : "Settings",
	            behaviours: function(r) {
	    			if($("#BRocrcontainer").hasClass('hidebr')){
	    				$(r).find("#wraptext").addClass("selectedwrap");
	    				$(r).find("#unwraptext").removeClass("selectedwrap");
	    			}else{
	    				$(r).find("#wraptext").removeClass("selectedwrap");
	    				$(r).find("#unwraptext").addClass("selectedwrap");
	    			}

	    			$(r).find("#ocrzoomin").click(function() {	    				
	    				self.changeFont(1);
                        return false;
                    })
                    $(r).find("#ocrzoomout").click(function() {	    				
	    				self.changeFont(-1);
                        return false;
                    })
                    $(r).find("#wraptext").click(function() {	    				
                    	$("#BRocrcontainer").addClass('hidebr');
                    	//$("unwraptext").addClass("selectedwrap");
                    	 $(r).find("#unwraptext").removeClass("selectedwrap");
                    	 $(r).find("#wraptext").addClass("selectedwrap");
                        return false;
                    })
                    $(r).find("#unwraptext").click(function() {	    				
                    	$("#BRocrcontainer").removeClass('hidebr');
                    	//$("wraptext").addClass("selectedwrap");
                    	$(r).find("#wraptext").removeClass("selectedwrap");
                    	$(r).find("#unwraptext").addClass("selectedwrap");
                        return false;
                    })
                }
	         });
    	}catch(err){alert(err.toString())};
    	
    });
    
    $("#imagesettings").click(function (e) {
    	try{
    		self.getBookOption=0;
    		var html = "<div>" + $("#BRimagesettings").html() + "</div>";
	    	var $notice = new Boxy(html, {
	            show : true,
	            modal : true,
	            draggable : true,
	            closeable : true,
	            title : "Settings",
	            behaviours: function(r) {
	    			$(r).find("#imagezoomin").click(function() {	    				
	    				self.zoom(1);
	                    return false;
	                })
	                $(r).find("#imagezoomout").click(function() {	    				
	    				self.zoom(-1);
	                    return false;
	                })
	                
	                $(r).find("#fittopage").click(function() {
	                	switch (self.mode) {
	                    	case self.constMode1up:
	                    		if(self.onePage.autofit){
	                    			self.zoom1up(self.onePage.autofit);
	                    		}else{
	                    			self.zoom1up('height');
	                    		}
	                            Boxy.get(r).hide();
	                            break;
	                        case self.constMode2up:
	                        	self.zoom2up('auto');
	                        	Boxy.get(r).hide();
	                        	break;
	                	}
	                    return false;
	                })	                
                },

	         });
    	}catch(err){alert(err.toString())};
    });
    
    $("#getbook").click(function (e) {
    	try{
    		self.getBookOption=0;
    		var html = "<div>" + $("#BRgetbook").html() + "</div>";
	    	var $notice = new Boxy(html, {
	            show : true,
	            modal : true,
	            draggable : true,
	            closeable : true,
	            title : "Get this book",
	            behaviours: function(r) {
	    			$(r).find("#epubLink").click(function() {	    				
	    				self.getBookOption=1;
                        Boxy.get(r).hide();
                        return false;
                    })
                    $(r).find("#fullPdfLink").click(function() {
                    	self.getBookOption=2;
                        Boxy.get(r).hide();
                        return false;
                    })
                },
                afterHide: function(r) {
                	if(self.getBookOption==1){
                		$("a#epubLink").click();
                	}else if (self.getBookOption==2){
                		$("a#fullPdfLink").click();
                	}
                }
	         });
    	}catch(err){alert(err.toString())};
    });
    
    $('#toc').click(function(e) {
    	// brktoctodo
    	
    	$('#BRupdownnavbar').css('display','none');		
    	
    	self.showToolbars();
    	
		$('#BRcontainer').css('z-index','-1');
		$('#BRocr').css('display','none');
		$('#BRocr').css('z-index','-1');
		$('#BRiteminfo').css('z-index','-1');
		$('#BRiteminfo').css('display','none');
		$('#BRsearch').css('z-index','-1');
		$('#BRsearch').css('display','none');
		$('#BRreadonly').css('display','none');
		$("#BRnavCntlBtm").css('bottom', $("#BRnav").css('height'));
		$('#mdpMobileTableOfContents').css('display','');
		$('#mdpMobileTableOfContents').css('z-index','1');
    	$('#BRnav').css('display','none');
    	$('#toc').css('display','none');
    	$('#mdpCatalogLink').css('display','none');
    	$('#read').css('display','');
		/*
    	try{
    		var html = "<div>" + $("#mdpMobileTableOfContents").html() + "</div>";
    		html = "<div> <div id='testtoc' >";
    		html+="<ul  >"; //style='height:100px;overflow:auto;'
    		for(i=1;i<100;i++){
    			html+="<li>Line " + i + "</li>";
    		}
    		html+="</ul>";
    		html+="</div></div>";
	    	var $notice = new Boxy(html, {
	            *//* show : true, *//*
	            modal : true,
	            draggable : true,
	            closeable : true,
	            title : "Contents",
	            behaviours: function(r) {
	    		/*
	    			$(r).find("#epubLink").click(function() {	    				
	    				self.getBookOption=1;
                        Boxy.get(r).hide();
                        return false;
                    })
                    $(r).find("#fullPdfLink").click(function() {
                    	self.getBookOption=2;
                        Boxy.get(r).hide();
                        return false;
                    })
                    */
	    			//$(r).find('#testtoc').dragscrollable({/*dragSelector : 'div', */acceptPropagatedEvent : false, preventDefault : false});
	    			/*
	    			$(r).find(".mdpFeatureListItemLink").click(function() { 
	    				console.log("TOC Link Click");
	    				return false;
	    			});
	    			
	    			//myScroll = new iScroll('testtoc');
	    			
                },
                afterHide: function(r) {
                	/*
                	if(self.getBookOption==1){
                		$("a#epubLink").click();
                	}else if (self.getBookOption==2){
                		$("a#fullPdfLink").click();
                	}*//*
                }
	         });
	    	
	    	$notice.resize(screen.width * .8, screen.height * .25);
	    	
	    	$notice.show();
    	}catch(err){
    		alert(err.toString())
    	}finally{
    		return false;
    	}
    	*/
    	return false;
    });

    $('#booksearch').click(function(e) {
    	
    	$('#BRupdownnavbar').css('display','none');		
    	
    	self.showToolbars();
    	
		$('#mdpMobileTableOfContents').css('z-index','-1');
		$('#mdpMobileTableOfContents').css('display','none');
		$('#BRcontainer').css('z-index','-1');	
		$('#BRocr').css('display','none');
		$('#BRocr').css('z-index','-1');
		$('#BRiteminfo').css('z-index','-1');
		$('#BRiteminfo').css('display','none');
		$('#BRreadonly').css('display','none');
		$("#BRnavCntlBtm").css('bottom', $("#BRnav").css('height'));
		$('#BRsearch').css('display','');
		$('#BRsearch').css('z-index','1');
    	$('#BRnav').css('display','none');
    	$('#toc').css('display','none');
    	$('#mdpCatalogLink').css('display','none');
    	$('#read').css('display','');		
		
        return false;
    });     
             
    $('#read').click(function(e) {		
    	$('#read').css('display','none');
    	$('#BRnav').css('display','');
    	$('#toc').css('display','');
    	$('#mdpCatalogLink').css('display','');    	
		$('#mdpMobileTableOfContents').css('z-index','-1');
		$('#mdpMobileTableOfContents').css('display','none');
		$('#BRiteminfo').css('z-index','-1');
		$('#BRiteminfo').css('display','none');
		$('#BRsearch').css('z-index','-1');
		$('#BRsearch').css('display','none');
		if(HT.reader.displayMode=='image'){
			$('#BRocr').css('z-index','-1');
			$('#BRocr').css('display','none');
			$('#BRcontainer').css('z-index','1');
			if(self.mode==self.constMode1up){
				$('#BRupdownnavbar').css('display','');
			}
		}else{
			$('#BRcontainer').css('z-index','-1');
			$('#BRocr').css('display','');
			$('#BRocr').css('z-index','1');
		}
		
		$('#BRreadonly').css('display','');
		$("#BRnavCntlBtm").css('bottom', $("#BRnav").css('height'));
		
		self.hideToolbars();
		
        return false;
    });        
    
    $('#ocr').click(function(e) {
    	$('#read').click();
    	
    	if(self.displayMode!='text'){
    		$('#ocr').css('display','none');
    		$('#imagesettings').css('display','none');
    		$('#image').css('display','');
    		$('#ocrsettings').css('display','');
    		
    		self.displayMode='text';
    		
    		$('#BRcontainer').css('z-index','-1');
    		$('#BRocr').css('display','');
    		$('#BRocr').css('z-index','1');
    		
    		$('#BRupdownnavbar').css('display','none');
    		
    		var pagesExist=false;
    		var currentPageLoaded=false;
    		
    		$('.mocrpage').each(function() {
    			var correctedIndex=parseInt($(this).attr('seq'));//-1;
    			pagesExist=true;
    			// look for current page...
    			if( (correctedIndex==self.currentIndex())){
    				currentPageLoaded=true;
    				return false;
    			}
    		});
    		
    		if(!pagesExist){ // no pages -- load...
    			self.loadOCR(self.currentIndex(),self.chunkSize, "forward"); // start index, chunk size
    		}else if(!currentPageLoaded){ // current page NOT loaded... empty and reload...
    			$("#BRocrcontainer div").remove();
    			self.loadOCR(self.currentIndex(),self.chunkSize, "forward"); // start index, chunk size
    		}else if(currentPageLoaded){ // current page LOADED ... scroll to it...
    			window.location.hash = "#ocrpage" + self.currentIndex();
    		}
	    }
    	
	    return false;
	}
    );

    $('#image').click(function(e) {
    	
    	$('#read').click();
		
		if(self.displayMode!='image'){
			var cutoff = $(window).scrollTop();
			var currentIndex=-1;
		    
			$('.mocrpage').each(function() {
		    	if ($(this).offset().top >= cutoff) {
		    		currentIndex=parseInt($(this).attr('seq'));
		            return false; // stops the iteration after the first one on screen
		        }
		    })
		    
			$('#BRocr').css('display','none');
			$('#BRocr').css('z-index','-1');
			$('#BRcontainer').css('z-index','1');
			
			$('#image').css('display','none');
			$('#ocrsettings').css('display','none');
    		$('#ocr').css('display','');
    		$('#imagesettings').css('display','');
    		
			switch(window.orientation){
				case -90:
				case 90:
					
					if(screen.width>320){
						// landscape mode -- switch to 2up
						self.mode=self.constMode2up;
					}else{
						self.mode=self.constMode1up;
					}
					
					break;
				
				case 0:
				case 180:
					self.mode=self.constMode1up;
					break;
			}
			
			self.displayMode='image';
			self.switchDisplayMode(); // eventually remove?
			
			if(currentIndex>=0){
				self.jumpToIndex(currentIndex);
			}	
		}
	    return false;
	}
    );
          
    
    $("#pageup").click(function (e) {
    	self.prev();
    	return false;
    });
    
    $("#pagedown").click(function (e) {
    	self.next();
    	return false;
    });
    


    $('#mdpSearchButton').click(function(e) {
    		var valid=true;
    		var searchValue = $("#mdpSearchInputBox").val();
    	    var stripped = searchValue;
    	    stripped = stripped.replace(/^\s*|\s*$/g, '');
    	    
    	    if ( stripped === "" ) {
    	        alert( "Please enter a term in the search box." );
    	        valid=false;;
    	    }
    	    
    		if(valid){
    			$("#mdpSearchButton").focus();
    			
    			// new search - reset params
    			self.searchStart=1;
    			self.searchSize=25;
    			
    			self.searchValue=searchValue;
    			self.searchText("#mdpSearchButton");
    		}
    });

    $(".mobilefeedback").click(function (e) {
    	return self.feedback();
    });
    

    
    jIcons.filter('.book_right').click(function(e) {
        // brk self.ttsStop();
        self.right();
        return false;
    });
        
    jIcons.filter('.book_up').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollUp();
        } else {
            self.prev();
        }
        return false;
    });        
        
    jIcons.filter('.book_down').bind('click', function(e) {
        if ($.inArray(self.mode, [self.constMode1up, self.constModeThumb]) >= 0) {
            self.scrollDown();
        } else {
            self.next();
        }
        return false;
    });

    jIcons.filter('.print').click(function(e) {
        self.printPage();
        return false;
    });
    
    // Note: Functionality has been replaced by .share
    jIcons.filter('.embed').click(function(e) {
        self.showEmbedCode();
        return false;
    });

    jIcons.filter('.bookmark').click(function(e) {
        self.showBookmarkCode();
        return false;
    });

    jIcons.filter('.play').click(function(e) {
        self.autoToggle();
        return false;
    });

    jIcons.filter('.pause').click(function(e) {
        self.autoToggle();
        return false;
    });
    
    jIcons.filter('.book_top').click(function(e) {
        self.first();
        return false;
    });

    jIcons.filter('.book_bottom').click(function(e) {
        self.last();
        return false;
    });
    
    jIcons.filter('.book_leftmost').click(function(e) {
        self.leftmost();
        return false;
    });
  
    jIcons.filter('.book_rightmost').click(function(e) {
        self.rightmost();
        return false;
    });

    jIcons.filter('.read').click(function(e) {
        self.ttsToggle();
        return false;
    });
    /*
    jIcons.filter('.zoom_in').bind('click', function() {
       // self.ttsStop();
    	if(self.displayMode!='text'){
    		self.zoom(1);
    	}else{
    		self.changeFont(1);
    	}
        return false;
    });
    
    $('#zoomin').bind('click', function() {
        // self.ttsStop();
    	if(self.displayMode!='text'){
    		self.zoom(1);
    	}else{
    		self.changeFont(1);
    	}
        return false;
     });
    
    jIcons.filter('.zoom_out').bind('click', function() {
     //   self.ttsStop();
    	if(self.displayMode!='text'){
    		self.zoom(-1);
    	}else{
    		self.changeFont(-1);
    	}
        return false;
    });
    
    $('#zoomout').bind('click', function() {
        //   self.ttsStop();
    	if(self.displayMode!='text'){
    		self.zoom(-1);
    	}else{
    		self.changeFont(-1);
    	}
        return false;
       });
    */
    jIcons.filter('.full').bind('click', function() {
        if (self.ui == 'embed') {
            // $$$ bit of a hack, IA-specific
            var url = (window.location + '').replace("?ui=embed","");
            window.open(url);
        }
        
        // Not implemented
    });
    
    $('.BRnavCntl').click(
        function(){
            if ($('#BRnavCntlBtm').hasClass('BRdn')) {
            	$('#BRtoolbar').animate({top:-55});
            	$('#BRnav').animate({bottom: '-' + $('#BRnav').css('height') });
                $('#BRnavCntlBtm').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlTop').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'45px'});
                //$('.BRnavCntl').delay(1000).animate({opacity:.25},1000);
            } else {
                $('#BRtoolbar').animate({top:0});
                $('#BRnav').animate({bottom:0});
                $('#BRnavCntlBtm').addClass('BRdn').removeClass('BRup');
                $('#BRnavCntlTop').addClass('BRup').removeClass('BRdn');
                $('#BRnavCntlBtm.BRnavCntl').animate({height:'30px'});
                //$('.BRvavCntl').animate({opacity:1})
            };
        }
    );
    /*
    $('#BRnavCntlBtm').mouseover(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:1},250);
        };
    });
    $('#BRnavCntlBtm').mouseleave(function(){
        if ($(this).hasClass('BRup')) {
            $('.BRnavCntl').animate({opacity:.25},250);
        };
    });
    $('#BRnavCntlTop').mouseover(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:1},250);
        };
    });
    $('#BRnavCntlTop').mouseleave(function(){
        if ($(this).hasClass('BRdn')) {
            $('.BRnavCntl').animate({opacity:.25},250);
        };
    });
	*/
    
    //this.initSwipeData();
    
   // $('#BookReader').die('mousemove.navigation').live('mousemove.navigation',
    //    { 'br': this },
    //    /* this.navigationMousemoveHandler*/
    //    function() { /*console.log("mousemove.navigation");*/ }
    //);
    
   // $('.BRpageimage').die('mousedown.swipe').live('mousedown.swipe',
    //    { 'br': this },
     //   /* this.swipeMousedownHandler */ 
      //  function() { /*console.log("mousedown.swipe");*/ }
    //);

    this.bindMozTouchHandlers();
}



HTMobileBookReader.prototype.updateNavPageNum = function(index) {
    var pageNum = this.getPageNum(index);
    var pageStr;
    if(pageNum==undefined){
    	pageStr='';
    }else{
	    if (pageNum[0] == 'n') { // funny index
	        pageStr = index + ' / ' + this.numLeafs;
	    } else {
	        pageStr = 'Page ' + pageNum;
	    }
    }
    $('#pagenum .currentpage').text(pageStr);
}

/*
 * Update the nav bar display - does not cause navigation.
 */
HTMobileBookReader.prototype.updateNavIndex = function(index) {
    // We want to update the value, but normally moving the slider
    // triggers jumpToIndex which triggers this method
	//$('#displayindex').html("Current Index:" + index);
    $('#BRpager').data('swallowchange', true).slider('value', index);
  	this.updateLocationHash();
}

HTMobileBookReader.prototype.updateLocationHash = function() {
    var self = this;
    
    // update the classic view link to reflect the current page number
    var params = this.paramsFromCurrent();
    
    // iOS doesn't allow passive use of replaceState
    var newHash = window.location.protocol + "//" + 
                  window.location.host + 
                  window.location.pathname + 
                  window.location.search + 
                  '#' + this.fragmentFromParams(params);
    window.location.replace(newHash); // replace blocks the back button!
    
    // if ( this.last_index != params.index ) {
    //     if ( this.last_index != null ) {
    //         if ( pageTracker != null ) {
    //             // window.location.origin?
    //             var params_ = this.paramsForTracking(params);
    //             var href = window.location.protocol + "//" + window.location.host + window.location.pathname + "?";
    //             var args = ["id=" + params_.id];
    //             args.push("view=" + params_.view);
    //             args.push("orient=" + params_.orient);
    //             args.push("size=" + params_.size);
    //             
    //             var num = this.getPageNum(params_.seq);
    //             if ( typeof(num) == "number" ) {
    //                 args.push("num=", num);
    //             }
    //             
    //             args.push("seq=" + ( params_.seq + 1 ));
    //             href += args.join(";");
    //             _gaq.push(["_trackPageview", href])
    //         }
    //     }
    //     this.last_index = params.index;
    // }
    
    // This is the variable checked in the timer.  Only user-generated changes
    // to the URL will trigger the event.
    this.oldLocationHash = newHash;
}

// jumpToIndex()
//______________________________________________________________________________
HTMobileBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
	HTBookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
	this.updateNavIndex(index);
}

// flipBackToIndex()
//______________________________________________________________________________
// to flip back one spread, pass index=null
HTMobileBookReader.prototype.flipBackToIndex = function(index){
	HTBookReader.prototype.flipBackToIndex.call(this,index);
	this.updateNavIndex(this.currentIndex());
}

// flipFwdToIndex()
//______________________________________________________________________________
// Whether we flip left or right is dependent on the page progression
// to flip forward one spread, pass index=null
HTMobileBookReader.prototype.flipFwdToIndex = function(index) {
	HTBookReader.prototype.flipFwdToIndex.call(this,index);
	this.updateNavIndex(this.currentIndex());
}

// brk - still needed?
/*
HTMobileBookReader.prototype.init = function(index) {
	HTBookReader.prototype.init.call(this);
}
*/
// brk - still needed?

HTMobileBookReader.prototype.prepareTwoPageView = function(centerPercentageX, centerPercentageY){
	try{
		$('#BRupdownnavbar').css('display','none');		
		
		if(this.twoPage.preparing==false || this.twoPage.preparing==undefined){ // this is to prevent unwanted recursion
			this.twoPage.preparing=true;
			HTBookReader.prototype.prepareTwoPageView.call(this,centerPercentageX, centerPercentageY);
			this.updateNavIndex(this.currentIndex());
			this.twoPage.preparing=false;
			
			var self=this;
			$('#BRtwopageview').swipe({
				 threshold: {
					x: 100,
					y: 33
				 },
			     swipeLeft: function() { 
					self.right();
				 },
			     swipeRight: function() { 
					 self.left();
				 },
			});
		}
	}catch(err){
		this.twoPage.preparing=false;
	}
	
}
	
// flipRightToLeft(nextL, nextR, gutter)
// $$$ better not to have to pass gutter in
//______________________________________________________________________________
// Flip from left to right and show the nextL and nextR indices on those sides
HTMobileBookReader.prototype.flipRightToLeft = function(newIndexL, newIndexR) {
	// brk - sub-classed to prevent page-turn animation....

    var top = this.twoPageTop();
    var scaledW = this.getPageWidth2UP(this.twoPage.currentIndexR);

    var middle = this.twoPage.middle;
    var gutter = middle + this.gutterOffsetForIndex(newIndexL);

    //var scaledWR = this.getPageWidth2UP(newIndexR); // $$$ should be current instead?
    //var scaledWL = this.getPageWidth2UP(newIndexL); // $$$ should be current instead?
    
    var currWidthL = this.getPageWidth2UP(this.twoPage.currentIndexL);
    var currWidthR = this.getPageWidth2UP(this.twoPage.currentIndexR);
    var newWidthL = this.getPageWidth2UP(newIndexL);
    var newWidthR = this.getPageWidth2UP(newIndexR);

    var self = this; // closure-tastic!

    var speed = this.flipSpeed;

    this.removeSearchHilites();
    $(self.prefetchedImgs[newIndexR]).css('zIndex', 2);
    $(self.prefetchedImgs[newIndexL]).css('zIndex', 2);
         
	self.twoPage.currentIndexL = newIndexL;
    self.twoPage.currentIndexR = newIndexR;
    self.twoPage.scaledWL = newWidthL;
    self.twoPage.scaledWR = newWidthR;
	self.twoPage.gutter = gutter;

    self.firstIndex = self.twoPage.currentIndexL;
    self.displayedIndices = [newIndexL, newIndexR];
    self.pruneUnusedImgs();
    self.prefetch();
    self.animating = false;

	self.updateSearchHilites2UP();
    self.updatePageNumBox2UP();
            
    self.setMouseHandlers2UP();     
	self.twoPageSetCursor();

}	


// $$$ mang we're adding an extra pixel in the middle.  See https://bugs.edge.launchpad.net/gnubook/+bug/411667
// prepareFlipRightToLeft()
//______________________________________________________________________________
HTMobileBookReader.prototype.prepareFlipRightToLeft = function(nextL, nextR) {
	// brk - sub-classed to prevent page-turn animation....
	
    // Prefetch images
    this.prefetchImg(nextL);
    this.prefetchImg(nextR);

    var height  = this._getPageHeight(nextR); 
    var width   = this._getPageWidth(nextR);    
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();               
    var scaledW = this.twoPage.height*width/height;

    var gutter = middle + this.gutterOffsetForIndex(nextL);
       
    $(this.prefetchedImgs[nextR]).css({
        position: 'absolute',
        left:   gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        borderLeft: '1px solid black',
        zIndex: 1
    });
    
    $('#BRtwopageview').append(this.prefetchedImgs[nextR]);

    height  = this._getPageHeight(nextL); 
    width   = this._getPageWidth(nextL);      
    scaledW = this.twoPage.height*width/height;

    $(this.prefetchedImgs[nextL]).css({
        position: 'absolute',
        right:   $('#BRtwopageview').attr('clientWidth')-gutter+'px',
        top:    top+'px',
        height: this.twoPage.height,
        //width:  0+'px', // Start at 0 width, then grow to the left
        width:  scaledW+'px',
        borderRight: '1px solid black',
        zIndex: 1
    });

    $('#BRtwopageview').append(this.prefetchedImgs[nextL]);    
            
}



// prepareFlipLeftToRight()
//
//______________________________________________________________________________
//
// Prepare to flip the left page towards the right.  This corresponds to moving
// backward when the page progression is left to right.

HTMobileBookReader.prototype.prepareFlipLeftToRight = function(prevL, prevR) {
	// brk - sub-classed to prevent page-turn animation....

    this.prefetchImg(prevL);
    this.prefetchImg(prevR);
    
    var height  = this._getPageHeight(prevL); 
    var width   = this._getPageWidth(prevL);    
    var middle = this.twoPage.middle;
    var top  = this.twoPageTop();                
    var scaledW = this.twoPage.height*width/height; // $$$ assumes height of page is dominant

    // The gutter is the dividing line between the left and right pages.
    // It is offset from the middle to create the illusion of thickness to the pages
    var gutter = middle + this.gutterOffsetForIndex(prevL);
    
    leftCSS = {
        position: 'absolute',
        left: gutter-scaledW+'px',
        right: '', // clear right property
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW+'px',
        borderRight: '1px solid black',
        zIndex: 1
    }
    
    $(this.prefetchedImgs[prevL]).css(leftCSS);
    
    $('#BRtwopageview').append(this.prefetchedImgs[prevL]);
    	
    height  = this._getPageHeight(prevR); 
	width   = this._getPageWidth(prevR);  
    scaledW = this.twoPage.height*width/height;
    
    rightCSS = {
        position: 'absolute',
        left:   gutter+'px',
        right: '',
        top:    top+'px',
        height: this.twoPage.height,
        width:  scaledW + 'px',
        //width:  0 + 'px',
        borderLeft: '1px solid black',
        zIndex: 1
    }
    
    $(this.prefetchedImgs[prevR]).css(rightCSS);

    $('#BRtwopageview').append(this.prefetchedImgs[prevR]);
    
}

// flipLeftToRight()
//______________________________________________________________________________
// Flips the page on the left towards the page on the right
HTMobileBookReader.prototype.flipLeftToRight = function(newIndexL, newIndexR) {
	// brk - sub-classed to prevent page-turn animation....
	
    var leftLeaf = this.twoPage.currentIndexL;

    var newWidthL    = this.getPageWidth2UP(newIndexL);
    var newWidthR    = this.getPageWidth2UP(newIndexR);

    var top  = this.twoPageTop();
    var gutter = this.twoPage.middle + this.gutterOffsetForIndex(newIndexL);
    
    var self = this;

    this.removeSearchHilites();
    
    $(self.prefetchedImgs[newIndexL]).css('zIndex', 2);
    $(self.prefetchedImgs[newIndexR]).css('zIndex', 2);
    
	self.twoPage.currentIndexL = newIndexL;
    self.twoPage.currentIndexR = newIndexR;
    self.twoPage.scaledWL = newWidthL;
    self.twoPage.scaledWR = newWidthR;
    self.twoPage.gutter = gutter;
            
	self.firstIndex = self.twoPage.currentIndexL;
    self.displayedIndices = [newIndexL, newIndexR];
    self.pruneUnusedImgs();
    self.prefetch();            
    self.animating = false;
            
    self.updateSearchHilites2UP();
    self.updatePageNumBox2UP();
            
    // self.twoPagePlaceFlipAreas(); // No longer used
    self.setMouseHandlers2UP();
    self.twoPageSetCursor();    
}

HTMobileBookReader.prototype.paramsFromFragment = function(urlFragment){
	var params = HTBookReader.prototype.paramsFromFragment.call(this,urlFragment);
	
	// want to be fudging params based on orientation
	if (typeof window.orientation != 'undefined'){
		switch(window.orientation){
			case 0:
			case 180:
				// this.switchMode(HT.reader.constMode1up);
				params.mode = HT.reader.constMode1up;
				break;
			case 90:
			case -90:
				if(this.displayMode == undefined){
					this.displayMode='image';
					params.displayMode = 'image';
				}
				
				if(this.displayMode=='image'){
					//
					if(screen.width>320){
						//this.switchMode(HT.reader.constMode2up);
						params.mode = HT.reader.constMode2up;
					}else{
						//this.switchMode(HT.reader.constMode1up);
						params.mode = HT.reader.constMode1up;
					}
				}else{
					// this.switchMode(HT.reader.constMode1up);
					params.mode = HT.reader.constMode1up;
				}
				break;
		}
	} else if ( navigator.userAgent.indexOf("iPad") < 0 ) {
	  params.mode = this.constMode1up;
	}
	return params;

	// brk
	// set mode based on landscape/portrait
	// is this the right place for this logic?
	
	if (typeof window.orientation != 'undefined'){
		switch(window.orientation){
			case 0:
			case 180:
				this.switchMode(HT.reader.constMode1up);
				break;
			case 90:
			case -90:
				if(this.displayMode == undefined){
					this.displayMode='image';
				}
				
				if(this.displayMode=='image'){
					//
					if(screen.width>320){
						this.switchMode(HT.reader.constMode2up);
					}else{
						this.switchMode(HT.reader.constMode1up);
					}
				}else{
					this.switchMode(HT.reader.constMode1up);
				}
				break;
		}
	}else{
		// default to 1up if no orientation found...
		this.switchMode(HT.reader.constMode1up);
	}
	return params;
}


// bindGestures(jElement)
//
// brk - subclassed because in BookReader.bindGestures, a variable called br caused an exception...
//______________________________________________________________________________
HTMobileBookReader.prototype.bindGestures = function(jElement) {
	var self=this;
    jElement.unbind('gesturechange').bind('gesturechange', function(e) {
        e.preventDefault();
        if (e.originalEvent.scale > 1.5) {
            self.zoom(1);
        } else if (e.originalEvent.scale < 0.6) {
            self.zoom(-1);
        }
    });
      
}


// brk - need to keep this...

//reduce defaults to 1 (no reduction)
//rotate defaults to 0 (no rotation)
HTMobileBookReader.prototype.getPageURI = function(index, reduce, rotate) {
	 var _reduce;
	 var _rotate;
	
	 if ('undefined' == typeof(reduce)) {
	     _reduce = 1;
	 } else {
	     _reduce = reduce;
	 }
	 if ('undefined' == typeof(rotate)) {
	     _rotate = 0;
	 } else {
	     _rotate = rotate;
	 }
	 if ( _rotate == null || _rotate == 0 ) {
	     _rotate = this.rotationCache[index] || 0;
	 }
	 if ( this.mode == 2 ) { _rotate = 0 ; }
	 
	 // convert to imgsrv orient
	 var _orient = 0;
	 if ( _rotate == 90 ) { _orient = 1; }
	 else if ( _rotate == 180 ) { _orient = 2 ; }
	 else if ( _rotate == 270 ) { _orient = 3 ; }
	 
	 //var q1 = this.getURLParameter("q1");
	
	 var _targetWidth = Math.round(this.getMedianPageSize().width / _reduce);
	 var page_uri;
	 if ( (this.displayMode == 'text' /*&& this.mode == 1*/) ) {
		 page_uri = this.url_config.text;
	 } else if ( this.mode == 3 ) {
	     // thumbnail
	     page_uri = this.url_config.thumb;
	 } else {
	     //page_uri = "http://babel.hathitrust.org/" +  this.url_config.image;
		 //page_uri = "http://babel.hathitrust.org" +  this.url_config.image;
		 page_uri = this.url_config.image;
	 }
	 page_uri += '?id='+this.bookId+';seq='+(index+1);
	 
	 if ( (/*this.mode == 1 &&*/ this.displayMode == "text")  ) {
	     if ( this.q1 ) {
	         page_uri += ";q1=" + this.q1;
	     }else if(this.searchValue){
	    	 if(this.searchValue.length > 0){
	    		 page_uri += ";q1=\"" + this.searchValue + "\"";
	    	 }
	     }
	 } else {
	     page_uri += ';width=' + _targetWidth + ';orient=' + _orient;
	 }
	 
	 if ( this.flags.debug ) {
	     page_uri += ';debug=' + this.flags.debug;
	 }
	 if ( this.flags.attr ) {
	     page_uri += ';attr=' + this.flags.attr;
	 }
	 
	 //console.log("Page URI: " + page_uri);
	 
	 return page_uri;
}


//switchMode()
//______________________________________________________________________________
HTMobileBookReader.prototype.switchDisplayMode = function() {

  this.autoStop();
  this.removeSearchHilites();

  // reinstate scale if moving from thumbnail view
  if (this.pageScale != this.reduce) {
      this.reduce = this.pageScale;
  }
  
  // $$$ TODO preserve center of view when switching between mode
  //     See https://bugs.edge.launchpad.net/gnubook/+bug/416682

  // XXX maybe better to preserve zoom in each mode
  if (1 == this.mode) {
      this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'), $('#BRcontainer').attr('clientHeight'));
      this.reduce = this.quantizeReduce(this.reduce, this.onePage.reductionFactors);
      $('#BRupdownnavbar').css('display','');
      
      this.prepareOnePageView();
  } else if (3 == this.mode) {
      this.reduce = this.quantizeReduce(this.reduce, this.reductionFactors);
      this.prepareThumbnailView();
  } else {
      // $$$ why don't we save autofit?
      this.twoPage.autofit = false; // Take zoom level from other mode
      this.twoPageCalculateReductionFactors();
      this.reduce = this.quantizeReduce(this.reduce, this.twoPage.reductionFactors);
      $('#BRupdownnavbar').css('display','none');
      
      this.prepareTwoPageView();
      this.twoPageCenterView(0.5, 0.5); // $$$ TODO preserve center      
  }
}

// brk - still needed?

//zoom2up(direction)
//______________________________________________________________________________

/* brk 2011.07.22
HTMobileBookReader.prototype.zoom2up = function(direction) {

  // Hard stop autoplay
  this.stopFlipAnimations();
  
  // Recalculate autofit factors
  this.twoPageCalculateReductionFactors();
  
  // Get new zoom state
  var reductionFactor = this.nextReduce(this.reduce, direction, this.twoPage.reductionFactors);
  if ((this.reduce == reductionFactor.reduce) && (this.twoPage.autofit == reductionFactor.autofit)) {
      // Same zoom
  	  //console.log("HTMobileBookReader.prototype.zoom2up() - returning - same zoom");
      return;
  }
  //this.twoPage.autofit = reductionFactor.autofit;
  this.twoPage.autofit='zoom';
  this.reduce = reductionFactor.reduce;
  this.pageScale = this.reduce; // preserve current reduce

  // Preserve view center position
  var oldCenter = this.twoPageGetViewCenter();
  
  // If zooming in, reload imgs.  DOM elements will be removed by prepareTwoPageView
  // $$$ An improvement would be to use the low res image until the larger one is loaded.
  if (1 == direction) {
	  
      for (var img in this.prefetchedImgs) {
	  	delete this.prefetchedImgs[img];
  	  }
	  
	 // for (var img in this.prefetchedImage) {
      	// delete image, leave ocr
     //     delete this.prefetchedImage[img];
     // }
  }
  
  // Prepare view with new center to minimize visual glitches
  this.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);

}
*/
// brk - subclassed because of an exception caused by undefined features variable... retest/still needed?
// still needed?
HTMobileBookReader.prototype.hasPageFeature = function(index, feature) {
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
        var features = this.bookData[slice.slice]['features'][slice.index];
        if(features){
        	return ( features.indexOf(feature) >= 0 );
        }else{
        	return false;
        }
    }
    return false;
}

// brk - new

HTMobileBookReader.prototype.searchText = function(busyElement ){
	
	var self=this;

	var url="/cgi/pt/search?skin=mobile;id=" + HT.params['id'] + "&q1=" + self.searchValue + ";";
	if(self.searchStart){
		url+="start=" + self.searchStart + ";";
	}
	if(self.searchSize){
		url+="size=" + self.searchSize + ";";
	}
	if(self.searchStart==1){
		$("#mdpResultsContainer").remove();
	}
	
	if(busyElement){
		$(busyElement).addClass("loading");
		$(busyElement).attr('disabled', 'disabled');

	}
	
	$('#ajaxerror').remove();
	
	$.ajax({
		url:url,
		cache:true,
		success:function(data) {
    		try{    			
	    		if ( ! data ) {
	    			var footer=$("#mdpFooter").detach();
	                data = '<div id="ajaxerror">No data retrieved</div>';
	                $(data).appendTo("#BRsearch");
	                $(footer).appendTo("#BRsearch");
	            }else{	            	
	            	var lData = $("<div>" + data + "</div>");
	            	
	            	// brk not sure on this... $('div').remove("#mdpResultsContainer");

	            	var footer=$("#mdpFooter").detach();
	            	
	            	// if no results container exists, add it...
	            	if( ! $("#mdpResultsContainer")[0]){
	            		
	            		$("#mdpResultsContainer",lData).appendTo("#BRsearch");
	            		
	            		// brk scrollingtodo
	            		$('#BRsearch').dragscrollable({	dragStart: 'touchstart',
														dragcontinue: 'touchmove',
														dragend: 'touchend', 
	            										dragSelector : '#mdpResultsContainer', 
	            										acceptPropagatedEvent : true, 
	            										preventDefault : false });
	            		//$('#BRsearch').dragscrollable({dragSelector : 'div', acceptPropagatedEvent : true, preventDefault : false });
	            		//$('#BookReader').dragscrollable({dragSelector : '#BRsearch', acceptPropagatedEvent : true, preventDefault : false });
	            		//$('#BRsearch').dragScroller();
	            	}else{
	            		// o/w -- add list items to existing list...
	            		$("#mdpOuterList").html( $("#mdpOuterList").html() + $(data).find("#mdpOuterList").html() );
	            	}
	            	
	            	// check to see if 'more results' button should be hidden...
	            	if( (self.searchStart+self.searchSize) > parseInt( $("#mdpResultsContainer").attr('totalpages') ) ){
	            		// hide
	            		$('#moreresults').css('display','none');
	            	}else{
	            		// show
	            		$('#moreresults').css('display','');
	            	}
	            	
            		// i have no idea where this height is set, but it needs to be cleared to push the footer to bottom of screen
            		$("#mdpResultsContainer").css('height',''); 
	            	$(footer).appendTo("#BRsearch");	
	            	
	            	//$(".mdpGoToBeginning").remove();
	            	
	            	$('#mdpOuterList > li > a').click(function(event){
	            		
	            	      try{
		            	      var url = $.url($(this).attr('href'));
		            	      if(self.displayMode=='image'){
		            	    	  $('#image').click();
		            	      }else{
		            	    	  $('#ocr').click();
		            	      }
	            	    	  
	            	    	  if(self.displayMode=='image'){
	            	    		  HT.reader.jumpToIndex(parseInt(url.param('seq'))-1);
	            	    	  }else{
	            	    		  // empty pages... remove all divs from BRocrcontainer
	            	    		  $("#BRocrcontainer div").remove();
	            	    		  
	            	    		  self.loadOCR((parseInt(url.param('seq'))-1),self.chunkSize, "forward");
	            	    	  }
	            	      }catch(err){
	            	    	  alert(err.toString());
	            	      }finally{
	            	    	  return false;
	            	      }				            	      
	            	});
	            	$('#moreresults').unbind('click');
	            	$('#moreresults').click(function(event){
	            	      try{
	            	    	  self.searchStart+=self.searchSize;
	            	    	  console.log("Loading More Results. Start=" + self.searchStart);
	            	    	  self.searchText('#moreresults');
	            	      }catch(err){
	            	    	  alert(err.toString());
	            	      }finally{
	            	    	  return false;
	            	      }				            	      
	            	});
	            	
	            	// brk - what is this for????
	            	$("#mdpResultsContainer").css('height', $("#mdpResultsContainer").height() + "px");
	            }
	    	}catch(err){alert(err.toString())}			    	
    	},
    	error:function(jqXHR, textStatus, errorThrown){
    		var footer=$("#mdpFooter").detach();
    		var data = '<div id="ajaxerror">Search failed: ' + textStatus + '</div>';
            $(data).appendTo("#BRsearch");
            $(footer).appendTo("#BRsearch");
    	},
    	complete:function(){
    		if(busyElement){
    			$(busyElement).removeClass("loading");
    			$(busyElement).attr('disabled', '');
    		}
    	}
    	
	}
	);
}

// brk - new

HTMobileBookReader.prototype.changeFont = function(multiplier) {
	var oldfont=parseFloat($("#BRocrcontainer").css('font-size'));
	var factor=(multiplier * 1);
	var newfont=oldfont + factor;
	
	if(newfont<30){
		$("#BRocrcontainer").css('font-size',  newfont + "px");
	}
}

// brk - still needed? i think there was an exception triggered by this function, thus the sub-classing...

HTMobileBookReader.prototype.getPageNum = function(index) {
    if(index < 0) { return ; }
    var slice = this.sliceFromIndex(index);
    if ( this.bookData[slice.slice] != undefined ) {
	    var pageNum = this.bookData[slice.slice]['page_num'][slice.index];
	    if (pageNum) {
	        return pageNum;
	    } else {
	        return 'n' + index;
	    }
    }else{
    	return 'n' + index;
    }
}

// brk - still needed?

HTMobileBookReader.prototype.updateFromParams = function(params) {

	// process /search
    if ('undefined' != typeof(params.searchTerm)) {
        if (this.searchTerm != params.searchTerm) {
            this.search(params.searchTerm);
        }
    }
    
    // $$$ process /zoom
    
    // We only respect page if index is not set
    if ('undefined' != typeof(params.index)) {
        if (params.index != this.currentIndex()) {
            this.jumpToIndex(params.index);
        }
    } else if ('undefined' != typeof(params.page)) {
        // $$$ this assumes page numbers are unique
        if (params.page != this.getPageNum(this.currentIndex())) {
            this.jumpToPage(params.page);
        }
    }
    
    // $$$ process /region
    // $$$ process /highlight
}

// brk - new

HTMobileBookReader.prototype.loadOCR = function(start, size, direction){
	if(direction=='back'){
		for(var index=start;index>(start-size);index--){
			this.retrieveOCRPage(index, start, direction, (start-size+1), start);
		}
	}else{
		for(var index=start;index<(size+start);index++){
			this.retrieveOCRPage(index,start, direction, start, (size+start-1));
		}		
	}
}

// brk - new

HTMobileBookReader.prototype.retrieveOCRPage = function(index, scrollTo, direction, start, end){
	
	var self=this;
	if(index<0){
		return;
	}
	if(index>=this.numLeafs){
		return;
	}
	
	if($("#ocrpage" + index).html()==null){
		
		var url = this._getPageURI(index, null, 0);
		
		var e = document.createElement("div");
		$(e).attr('id', 'ocrpage' + index);
		$(e).addClass('mocrpage');
		$(e).attr('seq', index);
		
		$(e).html("<div>Loading Page " + this.getPageNum(index) + "...");
		
		if(direction=='back'){
			$("#BRocrcontainer").prepend(e);
		}else{
			$("#BRocrcontainer").append(e);
		}
		
		if(index==scrollTo){
			window.location.hash = "#ocrpage" + index;
		}
		
		// todo - make ajax to trap errors...
		
	    $.get(url, null, function(data) {
	        
	        if ( ! data ) {
	            data = 
	                //'<div class="noText ocrText">' +
	            	'<div >' +
	                   // '<div class="noTextAlert">NO TEXT ON PAGE</div>' +
	            	 	'<div >NO TEXT ON PAGE</div>' +
	                    '<span>This page does not contain any text</span><br />' +
	                    '<span>recoverable by the OCR engine</span>' + 
	                '</div>';
	        }
	        
	        //data+="<p><div>(index=" + index + ", page=" + self.getPageNum(index) + ")</div></p>";
	        data+="<p><div>(Page " + self.getPageNum(index) + ")</div></p>";

	        	$(e).html(data);
	        	
	        	// check for previous/next page
	        	if( ($("#ocrpage" + (index-1)).html()!=null) && (index>0) && (index==start)){
	        		// previous page exists -- remove 'next' link from previous page
	        		$("#ocrpage" + (index-1) + " a.next").remove();
	        	}else if((index>0) && (index==start)){
	        		// no previous page loaded -- add 'previous' link to current page
	        		var previousstart=start-self.chunkSize;
	        		var previousend=start-1;
	        		
	        		if(previousstart<0){
	        			previousstart=0;
	        		}
	        		
	        		$(e).prepend('<div class="previouscontainer"><a class="previous" href="#" start="' + (index-1) + '" size="' + self.chunkSize + '">Load Pages ' + self.getPageNum(previousstart) + ' through ' + self.getPageNum(previousend) + '</a></div>');
	        		
	        		$("#ocrpage" + (index) + " a.previous").click(function() {
	        			try{
	        		        self.loadOCR(index-1,self.chunkSize,"back");
	        		        $(this).remove();
	        			}catch(err){
	        				alert(err.toString());
	        			}finally{
	        				return false;
	        			}
	        	    });
	        	}
	        	
	        	if( ($("#ocrpage" + (index+1)).html()!=null) && (index<(self.numLeafs-1)) && (index==end) ){
	        		// next page exists -- remove 'previous' link from next page
	        		$("#ocrpage" + (index+1) + " a.previous").remove();
	        	}else if((index<(self.numLeafs-1)) && (index==end) ){
	        		// no next page loaded -- add 'next' link to current page
	        		var nextstart=end+1;
	        		var nextend=end+self.chunkSize;
	        		
	        		if(nextend>=self.numLeafs){
	        			nextend=self.numLeafs-1;
	        		}
	        		
	        		$(e).append('<div class="nextcontainer"><a class="next" href="#" start="' + (index+1) + '" size="' + self.chunkSize + '">Load Pages ' + self.getPageNum(nextstart) + ' through ' + self.getPageNum(nextend) + '</a></div>');

	        		
	        		$("#ocrpage" + (index) + " a.next").click(function() {
	        			try{
	        		        self.loadOCR(index+1,self.chunkSize,"forward");
	        		        $(this).remove();
	        			}catch(err){
	        				alert(err.toString());
	        			}finally{
	        				return false;
	        			}
	        	    });
	        	    

	        	}
	        	if(scrollTo==index){
	        		window.location.hash = "#ocrpage" + index;
	        	}
	    });
	}
}

HTMobileBookReader.prototype.showToolbars = function() {
	//console.log("Clearing SHOW timeout");
	clearTimeout(this.toolbarTimeout);
	if (! $('#BRnavCntlBtm').hasClass('BRdn')){
		$('.BRnavCntl').click();
	}
}

HTMobileBookReader.prototype.hideToolbars = function() {
	// hide after an interval...
	
	//console.log("Setting SHOW timeout");
	this.toolbarTimeout = setTimeout( function() {
		//console.log("SHOW timeout fired");
		$('.BRnavCntl').click();
	},3000);
}



//brk - added these because they are in the latest version of Book Reader, but not in the version used by PageTurner...
//handles mouse swipes for turning pages...
/*
HTMobileBookReader.prototype.initSwipeData = function(clientX, clientY) {
	// could be removed in the future if Page Turner version is brought up to date...
	
	//console.log("HTMobileBookReader.prototype.initSwipeData()");
	
  /*
   * Based on the really quite awesome "Today's Guardian" at http://guardian.gyford.com/
   *//*
  this._swipe = {
      mightBeSwiping: false,
      didSwipe: false,
      mightBeDraggin: false,
      didDrag: false,
      startTime: (new Date).getTime(),
      startX: clientX,
      startY: clientY,
      lastX: clientX,
      lastY: clientY,
      deltaX: 0,
      deltaY: 0,
      deltaT: 0
  }
}


HTMobileBookReader.prototype.swipeMousedownHandler = function(event) {
    console.log('swipe mousedown');
    console.log(event);

    var self = event.data['br'];

    // We should be the last bubble point for the page images
    // Disable image drag and select, but keep right-click
    if (event.which == 3) {
        if (self.protected) {
            return false;
        }
        return true;
    }
    
    $(event.target).bind('mouseout.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mouseup.swipe',
        { 'br': self},
        self.swipeMouseupHandler
    ).bind('mousemove.swipe',
        { 'br': self },
        self.swipeMousemoveHandler
    );    
    
    self.initSwipeData(event.clientX, event.clientY);
    self._swipe.mightBeSwiping = true;
    self._swipe.mightBeDragging = true;
    
    event.preventDefault();
    event.returnValue  = false;  
    event.cancelBubble = true;          
    return false;
}

HTMobileBookReader.prototype.swipeMousemoveHandler = function(event) {
    console.log('swipe move ' + event.clientX + ',' + event.clientY);

    var _swipe = event.data['br']._swipe;
    if (! _swipe.mightBeSwiping) {
        return;
    }
    
    // Update swipe data
    _swipe.deltaX = event.clientX - _swipe.startX;
    _swipe.deltaY = event.clientY - _swipe.startY;
    _swipe.deltaT = (new Date).getTime() - _swipe.startTime;
    
    var absX = Math.abs(_swipe.deltaX);
    var absY = Math.abs(_swipe.deltaY);
    
    // Minimum distance in the amount of tim to trigger the swipe
    var minSwipeLength = Math.min($('#BookReader').width() / 5, 80);
    var maxSwipeTime = 400;
    
    // Check for horizontal swipe
    if (absX > absY && (absX > minSwipeLength) && _swipe.deltaT < maxSwipeTime) {
        //console.log('swipe! ' + _swipe.deltaX + ',' + _swipe.deltaY + ' ' + _swipe.deltaT + 'ms');
        
        _swipe.mightBeSwiping = false; // only trigger once
        _swipe.didSwipe = true;
        if (event.data['br'].mode == event.data['br'].constMode2up) {
            if (_swipe.deltaX < 0) {
                event.data['br'].right();
            } else {
                event.data['br'].left();
            }
        }
    }
    
    if ( _swipe.deltaT > maxSwipeTime && !_swipe.didSwipe) {
        if (_swipe.mightBeDragging) {        
            // Dragging
            _swipe.didDrag = true;
            $('#BRcontainer')
            .scrollTop($('#BRcontainer').scrollTop() - event.clientY + _swipe.lastY)
            .scrollLeft($('#BRcontainer').scrollLeft() - event.clientX + _swipe.lastX);            
        }
    }
    _swipe.lastX = event.clientX;
    _swipe.lastY = event.clientY;
    
    event.preventDefault();
    event.returnValue  = false;
    event.cancelBubble = true;         
    return false;
}
HTMobileBookReader.prototype.swipeMouseupHandler = function(event) {
    var _swipe = event.data['br']._swipe;
    console.log('swipe mouseup - did swipe ' + _swipe.didSwipe);
    _swipe.mightBeSwiping = false;
    _swipe.mightBeDragging = false;

    $(event.target).unbind('mouseout.swipe').unbind('mouseup.swipe').unbind('mousemove.swipe');
    
    if (_swipe.didSwipe || _swipe.didDrag) {
        // Swallow event if completed swipe gesture
        event.preventDefault();
        event.returnValue  = false;
        event.cancelBubble = true;         
        return false;
    }
    return true;
}
*/
HTMobileBookReader.prototype.bindMozTouchHandlers = function() {
    var self = this;
    
    // Currently only want touch handlers in 2up
    $('#BookReader').bind('MozTouchDown', function(event) {
        console.log('MozTouchDown ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode == this.constMode2up) {
            event.preventDefault();
        }
    })
    .bind('MozTouchMove', function(event) {
        console.log('MozTouchMove - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY)
        if (this.mode == this.constMode2up) { 
            event.preventDefault();
        }
    })
    .bind('MozTouchUp', function(event) {
        console.log('MozTouchUp - ' + event.originalEvent.streamId + ' ' + event.target + ' ' + event.clientX + ',' + event.clientY);
        if (this.mode = this.constMode2up) {
            event.preventDefault();
        }
    });
}


HTMobileBookReader.prototype.switchMode = function(mode, btn) {
	if(mode==2){
		$('#BRupdownnavbar').css('display','none');		
	}else{
		if(this.displayMode != 'text'){
			$('#BRupdownnavbar').css('display','');
		}
	}
	HTBookReader.prototype.switchMode.call(this,mode, btn);
}


HTMobileBookReader.prototype.feedback = function(){
	try{
		var html = "<div>" + $("#mdpFeedbackForm").html() + "</div>";
    	var $notice = new Boxy(html, {
            show : true,
            modal : true,
            draggable : true,
            closeable : true,
            title : "Feedback",
            behaviours: function(r) {
				//console.log("Adding boxytest..." + $(r).parent().attr("class"));
				//$($(r).parent()).find(".title-bar").addClass("boxytest");
				//console.log("Finding..." + $(r).parent().find(".title-bar").attr("class"));
			
    			$(r).find("#mdpFBinputbutton").click(function() {
    				// check to make sure comments field is populated
    				var comments = $(r).find("#comments").val();
    				var valid=false;

    				if ( comments === "" ) {
    	    	        alert( "Please enter comments." );
    	    	        valid=false;;
    	    	    }else{
    	    	    	valid=true;
    	    	    	$.post("feedback", $(r).find("#mdpFBform").serialize());
    	    	    	Boxy.get(r).hide();
    	    	    }
    				return false;
    			});
            },

         });
	}catch(err){alert(err.toString())};
	return false;	
}