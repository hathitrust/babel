subclass(FudgingBookReader, HTBookReader);

function FudgingBookReader() {
    HTBookReader.call(this);
}

FudgingBookReader.prototype.resizePageView1up = function() {
    var i;
    var viewHeight = 0;
    //var viewWidth  = $('#BRcontainer').width(); //includes scrollBar
    var viewWidth  = $('#BRcontainer').attr('clientWidth');   

    var oldScrollTop  = $('#BRcontainer').attr('scrollTop');
    var oldScrollLeft = $('#BRcontainer').attr('scrollLeft');
    var oldPageViewHeight = $('#BRpageview').height();
    var oldPageViewWidth = $('#BRpageview').width();
    
    var oldCenterY = this.centerY1up();
    var oldCenterX = this.centerX1up();
    
    if (0 != oldPageViewHeight) {
        var scrollRatio = oldCenterY / oldPageViewHeight;
    } else {
        var scrollRatio = 0;
    }
    
    console.log("INITIAL REDUCE", this.reduce);
    
    // Recalculate 1up reduction factors
    this.onePageCalculateReductionFactors( $('#BRcontainer').attr('clientWidth'),
                                           $('#BRcontainer').attr('clientHeight') );                                        
    // Update current reduce (if in autofit)
    if (this.onePage.autofit) {
        var reductionFactor = this.nextReduce(this.reduce, this.onePage.autofit, this.onePage.reductionFactors);
        this.reduce = reductionFactor.reduce;
    }
    
    this.setupPageLeafs();

    var newCenterY = scrollRatio*viewHeight;
    var newTop = Math.max(0, Math.floor( newCenterY - $('#BRcontainer').height()/2 ));
    $('#BRcontainer').attr('scrollTop', newTop);
    
    var newPageWidth = $("#BRpageview").width();
    var newLeft = ( newPageWidth / 2 ) - ( viewWidth / 2);
    newLeft = Math.max(newLeft, 0);
    $("#BRcontainer").attr('scrollLeft', newLeft);
    
    // // We use clientWidth here to avoid miscalculating due to scroll bar
    // var newCenterX = oldCenterX * (viewWidth / oldPageViewWidth);
    // 
    // // if ($('#BRpageview').width() < $('#BRcontainer').attr('clientWidth')) { // fully shown
    // //     centerX = $('#BRpageview').width();
    // // } else {
    // //     centerX = $('#BRcontainer').attr('scrollLeft') + $('#BRcontainer').attr('clientWidth') / 2;
    // // }
    // // centerX = Math.floor(centerX);
    // var newLeft = newCenterX - $('#BRcontainer').attr('clientWidth') / 2;
    // newLeft = Math.max(newLeft, 0);
    // $('#BRcontainer').attr('scrollLeft', newLeft);
    // //console.log('oldCenterX ' + oldCenterX + ' newCenterX ' + newCenterX + ' newLeft ' + newLeft);
    
    //this.centerPageView();
    this.loadLeafs();
        
    this.removeSearchHilites();
    this.updateSearchHilites();
}

FudgingBookReader.prototype.setupPageLeafs = function() {
  
  if ( $(".page1up").length ) {
    return;
  }
  
  var leafs = [];
  var i;
  var viewHeight = 0;
  var viewWidth  = $('#BRcontainer').attr('clientWidth');   
  for (i=0; i<this.numLeafs; i++) {
    var dimensions = this.getAdjustedDimensions(i);
    var height = dimensions.height;
    var width = dimensions.width;
      viewHeight += height + this.padding; 
      leafs.push(
        '<div class="page1up" id="pagediv{i}" style="height: {height}px; width: {width}px"><div class="debugIndex">{i}</div></div>'
        .replace(/{i}/g, i).replace('{height}', height).replace('{width}', width)
      );
      $(leafs[0]).appendTo($("#BRpageview"));
      leafs = [];
      if (width>viewWidth) viewWidth=width;
  }
  // $('#BRpageview').height(viewHeight);
  $('#BRpageview').width(viewWidth).css('margin', '0 auto');
  // $('#BRpageview').get(0).innerHTML = leafs.join("\n");
  //$(leafs.join("\n")).appendTo($("#BRpageview"));
  
}

FudgingBookReader.prototype.getViewWidth = function() {
  var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer
  return viewWidth;
}

FudgingBookReader.prototype.getAdjustedDimensions = function(index) {
  var viewWidth = this.getViewWidth();
  var height = Math.floor(this._getPageHeight(index)/this.reduce);
  var width = Math.floor(this._getPageWidth(index)/this.reduce);
  if ( width > viewWidth && this.onePage.autofit == "height" ) {
    var r = ( viewWidth - 20 ) / width;
    width = ( viewWidth - 20 );
    height = Math.floor(height * r);
  }
  return { height : height, width : width, fudged : true };
}

// drawLeafsOnePage()
//______________________________________________________________________________
FudgingBookReader.prototype.drawLeafsOnePage = function() {
    //alert('drawing leafs!');
    
    this.timer = null;
    
    this.setupPageLeafs();

    var scrollTop = $('#BRcontainer').attr('scrollTop');
    var scrollBottom = scrollTop + $('#BRcontainer').height();
    var $container = $("#BRcontainer");
    
    var indicesToDisplay = [];
    var portionVisible = {};
    
    var viewWidth = this.getViewWidth();
    
    var i;
    var leafTop = 0;
    var leafBottom = 0;
    for (i=0; i<this.numLeafs; i++) {
        var dimensions = this.getAdjustedDimensions(i);
        var height  = dimensions.height;
        var width  = dimensions.width;
        
        var $pagediv = $("#pagediv" + i);
        var leafTop = scrollTop + $pagediv.offset().top - 256;
        leafBottom += height;
        
        // console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
        var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
        var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
        var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
        // console.log('LEAF', i, scrollTop, leafTop, height, topInView, bottomInView, middleInView);
        if (topInView | bottomInView | middleInView) {
            //console.log('displayed: ' + this.displayedIndices);
            //console.log('to display: ' + i);
            indicesToDisplay.push(i);
            if ( leafTop <= scrollTop ) {
              // leaf is scrolling off
              portionVisible[i] = (height - ( scrollTop - leafTop )) / height;
            } else if ( leafBottom >= scrollBottom ) {
              portionVisible[i] = (height - ( leafBottom - scrollBottom )) / height;
            } else {
              portionVisible[i] = 1;
            }
        }
        leafTop += height +10;      
        leafBottom += 10;
    }
    
    var firstIndexToDraw  = indicesToDisplay[0];
    this.firstIndex      = firstIndexToDraw;
    
    // var now = new Date;
    // console.log(now.getSeconds(), "SET CURRENT INDEX", this.firstIndex, indicesToDisplay.join("/"));
    
    for(i=0; i < indicesToDisplay.length; i++) {
      var index = indicesToDisplay[i];
      if (portionVisible[index] > portionVisible[this.firstIndex] && portionVisible[this.firstIndex] < 0.4) {
        this.firstIndex = index;
        if ( this.firstIndex != this.lastUpdatedIndex ) {
          this.lastUpdatedIndex = this.firstIndex;
        }
      }
    }
    
    // Update hash, but only if we're currently displaying a leaf
    // Hack that fixes #365790
    if (this.displayedIndices.length > 0) {
        this.updateLocationHash();
    }

    if ((0 != firstIndexToDraw) && (1 < this.reduce)) {
        firstIndexToDraw--;
        indicesToDisplay.unshift(firstIndexToDraw);
    }
    
    var lastIndexToDraw = indicesToDisplay[indicesToDisplay.length-1];
    if ( ((this.numLeafs-1) != lastIndexToDraw) && (1 < this.reduce) ) {
        indicesToDisplay.push(lastIndexToDraw+1);
    }
    
    this.onePage.firstIndexToDraw = firstIndexToDraw;
    
    for (i = 0; i < indicesToDisplay.length; i++) {
      var index = indicesToDisplay[i];
      var dimensions = this.getAdjustedDimensions(index);
      var width = dimensions.width;
      var height = dimensions.height;
      
      var $pagediv = $("#pagediv" + index);
      if ( $pagediv.height() != height ) {
        // $pagediv.css({ height : height + 'px', width : width + 'px'});
        $pagediv.animate({ height : height + 'px', width : width + 'px'}, "fast");
      }
      
      if ( ! $pagediv.has(".content").length ) {
        var content = this.createContentElement(index, this.reduce, width, height);
        $(content).appendTo($pagediv).addClass("content");
      }
    }
    
    for (i=0; i<this.displayedIndices.length; i++) {
        if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
            var index = this.displayedIndices[i];
            //console.log('Removing leaf ' + index);
            //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
            $('#pagediv'+index).find(".content").remove();
        } else {
            //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
        }
    }
    
    if ( false ) {
      for (i=0; i<indicesToDisplay.length; i++) {
          var index = indicesToDisplay[i];    
          var height  = parseInt(this._getPageHeight(index)/this.reduce); 
          var width   = parseInt(this._getPageWidth(index)/this.reduce); 

          if ( viewWidth < width ) {
            var r = ( viewWidth - 20 ) / width;
            width = ( viewWidth - 20 );
            height = Math.floor(height * r);
          }

          if (BookReader.util.notInArray(indicesToDisplay[i], this.displayedIndices)) {            
              //console.log("displaying leaf " + indicesToDisplay[i] + ' leafTop=' +leafTop);
              var div = document.createElement("div");
              div.className = 'BRpagediv1up';
              div.id = 'pagediv'+index;
              div.style.position = "absolute";
              $(div).css('top', leafTop + 'px');
              var left = (viewWidth-width)>>1;
              if (left<0) left = 0;
              $(div).css('left', left+'px');
              $(div).css('width', width+'px');
              $(div).css('height', height+'px');
              //$(div).text('loading...');

              $('#BRpageview').append(div);
              $.data(div, 'index', index);

              var img = this.createContentElement(index, this.reduce, width, height);
              // $(img).css('width', width+'px');
              // $(img).css('height', height+'px');
              $(div).append(img);

              $('<div class="debugIndex">' + index + '</div>').appendTo(div);

              // var img = document.createElement("img");
              // img.src = this._getPageURI(index, this.reduce, 0);
              // $(img).css('width', width+'px');
              // $(img).css('height', height+'px');
              // $(div).append(img);

          } else {
              //console.log("not displaying " + indicesToDisplay[i] + ' score=' + jQuery.inArray(indicesToDisplay[i], this.displayedIndices));            
          }

          leafTop += height +10;

      }

      for (i=0; i<this.displayedIndices.length; i++) {
          if (BookReader.util.notInArray(this.displayedIndices[i], indicesToDisplay)) {
              var index = this.displayedIndices[i];
              //console.log('Removing leaf ' + index);
              //console.log('id='+'#pagediv'+index+ ' top = ' +$('#pagediv'+index).css('top'));
              $('#pagediv'+index).remove();
          } else {
              //console.log('NOT Removing leaf ' + this.displayedIndices[i]);
          }
      }
      
    }

    
    this.displayedIndices = indicesToDisplay.slice();
    this.updateSearchHilites();
    
    if (null != this.getPageNum(firstIndexToDraw))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
    } else {
        $("#BRpagenum").val('');
    }
            
    this.updateToolbarZoom(this.reduce);
    
}

//prepareOnePageView()
//______________________________________________________________________________
FudgingBookReader.prototype.prepareOnePageView = function() {

    // var startLeaf = this.displayedIndices[0];
    var startLeaf = this.currentIndex();
    $('#BRcontainer').empty();
    $('#BRcontainer').css({
        overflowY: 'scroll',
        overflowX: 'auto',
        position: 'static',
        'text-align' : 'center'
    });
    
    $("#BRcontainer").height($("#BookReader").height() - 16);
    
    $("#BRcontainer").append("<div id='BRpageview'></div>");
    var options = { ignoreTargets:['ocrText', 'rotateAction']};
    
    $('#BRcontainer').dragscrollable(options); // {preventDefault:true, ignoreTargets:['ocrText']}

    this.bindGestures($('#BRcontainer'));

    // $$$ keep select enabled for now since disabling it breaks keyboard
    //     nav in FF 3.6 (https://bugs.edge.launchpad.net/bookreader/+bug/544666)
    // BookReader.util.disableSelect($('#BRpageview'));
    
    this.resizePageView();    
    
    this.jumpToIndex(startLeaf);

    this.displayedIndices = [];
    
    this.drawLeafsOnePage();
}

FudgingBookReader.prototype.onePageGetAutofitHeight = function() {
    var clientHeight = $('#BRcontainer').attr('clientHeight') || $("#BookReader").attr("clientHeight");
    return (this.getMedianPageSize().height + 0.0) / (clientHeight - this.padding * 2); // make sure a little of adjacent pages show
}

FudgingBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
  if ( this.mode == this.constMode1up ) {
    var $div = $("#pagediv" + index);
    var $container = $("#BRcontainer");
    $container.animate({ scrollTop : ($container.scrollTop() + $div.offset().top - $container.offset().top ) }, "fast");
  } else {
    HTBookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
  }
}

FudgingBookReader.prototype.createContentElement = function(index, reduce, width, height) {
    var self = this;
    var e;
    var url = this._getPageURI(index, reduce, 0);
    
    if ( this.hasPageFeature(index, "MISSING_PAGE") ) {

        e = this._createTextElement(width, height);
        
        // have to add the text AFTER the element is attached 
        // to the DOM
        setTimeout(function() {
            var data = 
                '<div class="noText ocrText">' +
                    '<div class="noTextAlert">MISSING PAGE</div>' +
                    '<span>This page is missing in the original.</span><br />' + 
                    '<span>Please continue to available pages.</span><br />' +
                    '<span><a target="_blank" href="http://www.hathitrust.org/help_digital_library#PageNotAvailable">See the Help page for more information.</a></span>' + 
                '</div>';

            self._insertTextPane(data, index, e);
        }, 200);

    } else if ( this.displayMode == 'image' ) {

        e = document.createElement("img");
        $(e).css('width', width+'px');
        $(e).css('height', height+'px');
        $(e).data('index', index);

        var title = "image of page " + this.getPageNum(index);
        $(e).attr({ alt : title, title : title});
        e.src = this.imagesBaseURL + 'transparent.png';
        
        var viewWidth = self.getViewWidth();
        
        console.log("CREATING IMAGE", url);
        var lazy = new Image();
        lazy.e = e;
        lazy.index = index;
        $(lazy).one('load', function() {
          var index = this.index;
          var e = this.e;
          var natural_height = this.height;
          var natural_width = this.width;
          var fudged = false;
          if ( self.hasPageFeature(index, "FUDGED") ) {
            var slice = self.sliceFromIndex(index);
            var true_height = natural_height * self.reduce;
            var true_width = natural_width * self.reduce;
            self.bookData[slice.slice]['height'][slice.index] = true_height;
            self.bookData[slice.slice]['width'][slice.index] = true_width;
            self.removePageFeature(index, 'FUDGED');
            fudged = true;
          }
            
          var width = natural_width;
          var height = natural_height;
          var left;
          
          if ( viewWidth < width ) {
            var r = ( viewWidth - 20 ) / width;
            width = ( viewWidth - 20 );
            height = Math.floor(height * r);
          }
          
          if ( fudged ) {
            // $(e).parent().andSelf().css({ width : width + 'px', height : height + 'px' });
            $(e).parent().andSelf().animate({ height : height + 'px', width : width + 'px'}, "fast", function() {
              // did this scroll off screen? that's the question
              if ( index == self.firstIndex ) {
                self.jumpToIndex(index);
              }
            });
          }
          //e.src = this.src;
          
          console.log("HEY: SETTING ", index, " TO ", this.src);
          this.e = undefined;
        });
        lazy.src = url;

    } else {

        var sel = 'span';
        
        e = this._createTextElement(width, height);
        
        $.get(url, null, function(data) {
            
            if ( ! data ) {
                data = 
                    '<div class="noText ocrText">' +
                        '<div class="noTextAlert">NO TEXT ON PAGE</div>' +
                        '<span>This page does not contain any text</span><br />' +
                        '<span>recoverable by the OCR engine</span>' + 
                    '</div>';
                sel = null;
            }
            
            self._insertTextPane(data, index, e, sel);

        })
        
    }
    return e;
}

FudgingBookReader.prototype.getPageWidth = function(index) {
    var r = this.rotationCache[index] || 0;
    if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
        var h = this.__getPageHeight(index);
        // h = Math.ceil(w * ( w / h ));
        return h;
    }
    var w = this.__getPageWidth(index);
    return w;
}

FudgingBookReader.prototype.getPageHeight = function(index) {
    var r = this.rotationCache[index] || 0;
    var h = this.__getPageHeight(index);
    if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
        var w = this.__getPageWidth(index);
        // h = Math.ceil(w * ( w / h ));
        return w;
    }
    return h;
}

FudgingBookReader.prototype.__getPageWidth = function(index) {
    var slice = this.sliceFromIndex(index);
    var w;
    
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['width'][slice.index]) == 'number'){
        w = this.bookData[slice.slice]['width'][slice.index];
    }else{
        if (typeof(this.widthAvg) != 'undefined'){
            w = this.widthAvg;
        }else{
            w = this.widthAvg = this.getAvgDimension('width');
        }
    }
    return w;
}

FudgingBookReader.prototype.__getPageHeight = function(index) {
    // calculate slice from index
    var slice = this.sliceFromIndex(index);
    
    var h;
    if (! this.hasPageFeature(index, "MISSING_PAGE") && this.bookData[slice.slice] != undefined && typeof(this.bookData[slice.slice]['height'][slice.index]) == 'number'){
        h = this.bookData[slice.slice]['height'][slice.index];
    } else{
        if (typeof(this.heightAvg) != 'undefined'){
            h =  this.heightAvg;
        }else{
            h = this.heightAvg = this.getAvgDimension('height');
        }
    }
    return h;
}

// 2UP MODIFICATIONS

// prefetchImg()
//______________________________________________________________________________
FudgingBookReader.prototype.prefetchImg = function(index) {
    var self = this;
    var pageURI = this._getPageURI(index);

    // track this?
    var ratio = this.getPageHeight(index) / this.twoPage.height;
    var scale;
    // $$$ we make an assumption here that the scales are available pow2 (like kakadu)
    if (ratio < 2) {
        scale = 1;
    } else if (ratio < 4) {
        scale = 2;
    } else if (ratio < 8) {
        scale = 4;
    } else if (ratio < 16) {
        scale = 8;
    } else  if (ratio < 32) {
        scale = 16;
    } else {
        scale = 32;
    }
    var reduce = scale;
    
    // Load image if not loaded or URI has changed (e.g. due to scaling)
    var loadImage = false;
    if (undefined == this.prefetchedImgs[index]) {
        console.log('no image for ' + index);
        loadImage = true;
    } else if (pageURI != this.prefetchedImgs[index].uri) {
        console.log('uri changed for ' + index, pageURI, this.prefetchedImgs[index].uri);
        loadImage = true;
    }
    
    if (loadImage) {
        //console.log('prefetching ' + index);
        var img = $("#pagediv" + index).get(0);
        if ( img === undefined ) {
          img = document.createElement("img");
          img.className = 'BRpageimage';
          $(img).attr('id', "pagediv" + index);
        }
        if (index < 0 || index > (this.numLeafs - 1) ) {
            // Facing page at beginning or end, or beyond
            $(img).css({
                'background-color': 'transparent'
            });
        } else {
          var lazy = new Image();
          lazy.e = img;
          lazy.index = index;
          lazy.reduce = reduce;
          $(lazy).one('load', function() {
            var index = this.index;
            var e = this.e;
            var reduce = this.reduce || self.reduce;
            var natural_height = this.height;
            var natural_width = this.width;
            var fudged = false;
            
            console.log("LOADING", index, this.src, e.src);
            
            if ( self.hasPageFeature(index, "FUDGED") ) {
              var slice = self.sliceFromIndex(index);
              var old_height = self.getPageHeight(index);
              var true_height = natural_height * reduce;
              var true_width = natural_width * reduce;
              self.bookData[slice.slice]['height'][slice.index] = true_height;
              self.bookData[slice.slice]['width'][slice.index] = true_width;
              self.removePageFeature(index, 'FUDGED');
              console.log("FUDGED TRUE HEIGHT", index, self.reduce, old_height, true_height);
              fudged = true;
            }
            
            if ( fudged ) {
              console.log("FUDGING", index);
              self.fudge2up(index, this);
            } else {
              // should really animate to the new dimensions...
              e.src = this.src;
            }
            this.e = null;
          }).attr('src', pageURI);
        }
        // UM
        var title = "image of page " + this.getPageNum(index);
        img.uri = pageURI;
        img.src = this.imagesBaseURL + 'transparent.png'; // pageURI; // browser may rewrite src so we stash raw URI here
        $(img).attr({ title : title, alt : title });
        this.prefetchedImgs[index] = img;
    } else {
      var $pagediv = $("#pagediv" + index);
      if ( $pagediv.length &&  $pagediv.attr('src').indexOf("transparent.png") > -1 ) {
        $pagediv.attr('src', pageURI);
      }
      // console.log("NOT LOADING IMAGE", index, $pagediv.attr('src'), pageURI);
    }
}

FudgingBookReader.prototype.fudge2up = function(index, lazy) {
  var self = this;
  
  if ( index != self.twoPage.currentIndexL && index != self.twoPage.currentIndexR ) {
    return;
  }
  
  // this works, but can mess up the twoPage reduction --- fits this
  // instance, but the clicking punts
  var $pagediv = $("#pagediv" + index);
  if ( ! $pagediv.length ) {
    alert("COULD NOT FIND", index);
    return;
  }
  $("#pagediv" + index).attr('src', lazy.src);
  self.prepareTwoPageView();
  return;

  var $img = $("#pagediv" + index);
  var $cover = $("#BRbookcover");
  var $view = $("#BRtwopageview");
  var $edgeR = $(".BRleafEdgeR");
  var $edgeL = $(".BRleafEdgeL");
  var $spine = $("#BRbookspine");
  
  // we need to respect the height of the img in 2up
  var r = $img.height() / lazy.height;
  var width = lazy.width * r;
  
  var delta = width - $img.width();
  
  var cover_width = $cover.width() + delta;
  var cover_left = parseInt($cover.css('left'));
  
  // this happens all the time
  if ( $view.width() < $view.width() + delta ) {
    $view.width($view.width() + delta);
    
  }

  this.twoPage.bookCoverDivWidth = cover_width;
  self.twoPage.totalWidth = $view.width();
  self.twoPage.middle = self.twoPage.totalWidth >> 1;
  self.twoPage.gutter = self.twoPage.middle + self.gutterOffsetForIndex(self.twoPage.currentIndexL);
  this.twoPage.scaledWL = this.getPageWidth2UP(self.twoPage.currentIndexL);
  this.twoPage.scaledWR = this.getPageWidth2UP(self.twoPage.currentIndexR);
  this.twoPage.bookCoverDivLeft = this.twoPage.gutter - this.twoPage.scaledWL - this.twoPage.leafEdgeWidthL - this.twoPage.coverInternalPadding;
  // Book spine
  this.twoPage.bookSpineDivLeft = this.twoPage.middle - (this.twoPage.bookSpineDivWidth >> 1);

  this.twoPage.leafEdgeWidthL = this.leafEdgeWidth(this.twoPage.currentIndexL);
  this.twoPage.leafEdgeWidthR = this.twoPage.edgeWidth - this.twoPage.leafEdgeWidthL;

  var leftGutterOffset = this.gutterOffsetForIndex(this.twoPage.currentIndexL);
  var leftWidthFromCenter = this.twoPage.scaledWL - leftGutterOffset + this.twoPage.leafEdgeWidthL;
  var rightWidthFromCenter = this.twoPage.scaledWR + leftGutterOffset + this.twoPage.leafEdgeWidthR;
  var largestWidthFromCenter = Math.max( leftWidthFromCenter, rightWidthFromCenter );
  this.twoPage.totalWidth = 2 * (largestWidthFromCenter + this.twoPage.coverInternalPadding + this.twoPage.coverExternalPadding);
  
  if ( index == self.twoPage.currentIndexL ) {
    // moving to the left
    var right_delta = 0;
    cover_left = cover_left - delta;
    console.log("FUDGE LEFT", index, width, lazy, lazy.complete, lazy.width, $img.width(), delta, "/", cover_left);

    if ( cover_left < 0 ) {
      right_delta = -cover_left;
      delta = 0;
      cover_left = 0;
      console.log("TWEAKED", index, width, $img.width(), delta);
    }
    
    $cover.animate({ width : cover_width, left : cover_left + 'px' }, "fast", function() {
      $edgeL.animate({ left : (parseInt($edgeL.css('left')) - delta ) + 'px' }, "fast", function() {
        $img.animate({ left : (parseInt($img.css('left')) - delta ) + 'px', width : width + 'px' }, "fast", function() {
          if ( right_delta ) {
            $spine.animate({ left : (parseInt($spine.css('left')) + right_delta) + 'px' }, "fast", function() {
              $edgeR.animate({ left : (parseInt($edgeR.css('left')) + right_delta) + 'px' }, "fast", function() {
                var $img2 = $("#pagediv" + self.twoPage.currentIndexR);
                $img2.animate({ left : (parseInt($img2.css('left')) + right_delta) + 'px' }, "fast");
              })
            })
          }
          $img.attr('src', lazy.src);
        })
      })
    })
    
  } else {
    $img.attr("src", lazy.src);
    return;
    console.log("FUDGING RIGHT:", index, width, $img.width(), delta);
    $cover.animate({ width : cover_width }, "fast", function() {
      $edgeR.animate({ left : (parseInt($edgeR.css('left')) + delta ) + 'px' }, "fast", function() {
        $img.animate({ width : width + 'px' }, "fast", function() {
          $img.attr('src', lazy.src);
        })
      })
    })
  }
  
  // if ( index == self.twoPage.currentIndexL ) {
  //   // fudging the left index
  //   console.log("FUDGING LEFT:", index, width, $img.width(), -delta);
  //   $edge = $(".BRleafEdgeL");
  //   $cover.animate({ width : $cover.width() + delta, left : (parseInt($cover.css('left')) - delta ) + 'px' }, "fast", function() {
  //     $edge.animate({ left : (parseInt($edge.css('left')) - delta ) + 'px' }, "fast", function() {
  //       $img.animate({ left : (parseInt($img.css('left')) - delta ) + 'px', width : width + 'px' }, "fast", function() {
  //         $img.attr('src', lazy.src);
  //         if ( $view.width() < $view.width() + delta ) {
  //           $view.width($view.width() + delta);
  //         }
  //       })
  //     })
  //   })
  // } else {
  //   // fudging the right index
  //   console.log("FUDGING RIGHT:", index, width, $img.width(), delta);
  //   $edge = $(".BRleafEdgeR");
  //   $cover.animate({ width : $cover.width() + delta }, "fast", function() {
  //     $edge.animate({ left : (parseInt($edge.css('left')) + delta ) + 'px' }, "fast", function() {
  //       $img.animate({ width : width + 'px' }, "fast", function() {
  //         $img.attr('src', lazy.src);
  //         if ( $view.width() < $view.width() + delta ) {
  //           $view.width($view.width() + delta);
  //         }
  //       })
  //     })
  //   })
  // }

}