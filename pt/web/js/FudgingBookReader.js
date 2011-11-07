// var fudgingMonkeyPatch = true;
// if ( navigator.appVersion.indexOf("MSIE 7.") != -1 ) {
//   fudgingMonkeyPatch = false;
// } else if ( navigator.userAgent.indexOf("Firefox/") != -1 ) {
//   var version = navigator.userAgent.split("/");
//   version = version.pop()
//   if ( version < "3.6" ) {
//     fudgingMonkeyPatch = false;
//   }
// }

var fudgingMonkeyPatch = false;
if ( navigator.appVersion.indexOf("MSIE 7.") == -1 && navigator.appVersion.indexOf("MSIE 6") == -1 ) {
  // IE 8+
  fudgingMonkeyPatch = true;
} else if ( navigator.userAgent.indexOf("Gecko/") != -1 ) {
  var match = navigator.userAgent.match(/rv:([\w+\.])\)/)
  if ( match != null && match[1] >= "1.9" ) {
    // FF3.6+
    fudgingMonkeyPatch = true;
  }
} else if ( navigator.userAgent.indexOf("WebKit") != -1 ) {
  // Webkit
  fudgingMonkeyPatch = true;
} else if ( navigator.userAgent.indexOf("Opera") != -1 ) {
  fudgingMonkeyPatch = true;
}

if ( fudgingMonkeyPatch ) {

  HTBookReader.prototype.resizePageView1up = function() {
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

  HTBookReader.prototype.setupPageLeafs = function() {
    
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
        if (width>viewWidth) viewWidth=width;
    }
    // $('#BRpageview').height(viewHeight);
    $('#BRpageview').width(viewWidth).css('margin', '0 auto');

    // what does rl mean with scroll??
    
    $('#BRpageview').get(0).innerHTML = leafs.join("\n");
    //$(leafs.join("\n")).appendTo($("#BRpageview"));

  }

  HTBookReader.prototype.getViewWidth = function() {
    var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer
    return viewWidth;
  }

  HTBookReader.prototype.getAdjustedDimensions = function(index) {
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
  HTBookReader.prototype.drawLeafsOnePage = function() {
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
          leafBottom = leafTop + height;

          // console.log('leafTop = '+leafTop+ ' pageH = ' + this.pageH[i] + 'leafTop>=scrollTop=' + (leafTop>=scrollTop));
          var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
          var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
          var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
          // console.log('LEAF', i, scrollTop, leafTop, height, topInView, bottomInView, middleInView);
          if (topInView | bottomInView | middleInView) {
              //console.log('displayed: ' + this.displayedIndices);
              //console.log('to display: ' + i);
              // console.log("DISPLAY:", i, topInView, bottomInView, middleInView, ":", leafTop, "x", leafBottom, "/", scrollTop, "x", scrollBottom, indicesToDisplay.join(":"));
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

      // // Update hash, but only if we're currently displaying a leaf
      // // Hack that fixes #365790
      // if (this.displayedIndices.length > 0) {
      //     this.updateLocationHash();
      // }
      // 
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

        if ( ! $pagediv.has(".content").length || $pagediv.has(".choked").length ) {
          var content = this.createContentElement(index, this.reduce, width, height);
          if ( $pagediv.has(".choked").length ) {
            $(content).replaceAll($pagediv.find(".choked"));
          } else {
            $(content).appendTo($pagediv).addClass("content");
          }
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

      this.displayedIndices = indicesToDisplay.slice();

      // Update hash, but only if we're currently displaying a leaf
      // Hack that fixes #365790
      // update after we finally determine the visible pages?
      if (this.displayedIndices.length > 0) {
          this.updateLocationHash();
      }

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
  HTBookReader.prototype.prepareOnePageView = function() {

      // var startLeaf = this.displayedIndices[0];
      var startLeaf = this.currentIndex();
      $('#BRcontainer').empty();
      $('#BRcontainer').css({
          overflowY: 'auto',
          overflowX: 'auto',
          'text-align' : 'center'
      });
      
      // needed?
      // position: 'static',

      $("#BRcontainer").height($("#BookReader").height());

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

  HTBookReader.prototype.onePageGetAutofitHeight = function() {
      var clientHeight = $('#BRcontainer').attr('clientHeight') || $("#BookReader").attr("clientHeight");
      return (this.getMedianPageSize().height + 0.0) / (clientHeight - this.padding * 2); // make sure a little of adjacent pages show
  }
  
  // drawLeafsThumbnail()
  //______________________________________________________________________________
  // If seekIndex is defined, the view will be drawn with that page visible (without any
  // animated scrolling)
  HTBookReader.prototype.drawLeafsThumbnail = function( seekIndex ) {
      //alert('drawing leafs!');
      this.timer = null;
      
      var viewWidth = $('#BRcontainer').attr('scrollWidth') - 20; // width minus buffer

      //console.log('top=' + scrollTop + ' bottom='+scrollBottom);

      var i;
      var leafWidth;
      var leafHeight;
      var rightPos = 0;
      var bottomPos = 0;
      var maxRight = 0;
      var currentRow = 0;
      var leafIndex = 0;
      var leafMap = [];

      var self = this;

      // Will be set to top of requested seek index, if set
      var seekTop;
      
      var $container = $('#BRpageview');
      var leafs = [];
      var rowLeafs = [];

      var viewHeight = 0;
      var rowHeights = [];
      // Calculate the position of every thumbnail.  $$$ cache instead of calculating on every draw
      for (i=0; i<this.numLeafs; i++) {
          leafWidth = this.thumbWidth;

          // if ( i % this.thumbColumns == 0 ) {
          //   leafs.push('<div class="thumbRow">');
          // }
          
          if (leafMap[currentRow]===undefined) { leafMap[currentRow] = {}; }
          if (leafMap[currentRow].leafs===undefined) {
              leafMap[currentRow].leafs = [];
              leafMap[currentRow].height = 0;
              leafMap[currentRow].top = 0;
          }
          leafMap[currentRow].leafs[leafIndex] = {};
          leafMap[currentRow].leafs[leafIndex].num = i;
          leafMap[currentRow].leafs[leafIndex].left = rightPos;

          leafHeight = parseInt((this.getPageHeight(leafMap[currentRow].leafs[leafIndex].num)*this.thumbWidth)/this.getPageWidth(leafMap[currentRow].leafs[leafIndex].num), 10);
          if (leafHeight > leafMap[currentRow].height) {
              leafMap[currentRow].height = leafHeight;
          }
          if (leafIndex===0) { bottomPos += this.padding + leafMap[currentRow].height; }
          rightPos += leafWidth + this.padding;
          if (rightPos > maxRight) { maxRight = rightPos; }
          leafIndex++;

          if (i == seekIndex) {
              seekTop = bottomPos - this.padding - leafMap[currentRow].height;
          }

          rowHeights.push(leafHeight);
          
          rowLeafs.push(
            '<div class="pageThumb BRpagedivthumb" id="pagediv{i}" style="height: {height}px; width: {width}px"><div class="debugIndex">{i}</div></div>'
            .replace(/{i}/g, i).replace('{height}', leafHeight).replace('{width}', leafWidth)
          );
          
          if ( i % this.thumbColumns == ( this.thumbColumns - 1 ) ) {
            
            if ( this.pageProgression == "rl" ) {
              rowLeafs.reverse();
            }
            
            // leafs.push('<div id="thumbrow{currentRow}" class="thumbRow">'.replace('{currentRow}', currentRow) + rowLeafs.join("\n") + '<br clear="both" /></div>');
            leafs.push('<div id="thumbrow{currentRow}" data-rowIndex="{currentRow}" class="thumbRow">'.replace(/{currentRow}/g, currentRow) + rowLeafs.join("\n") + '<br clear="both" />' + '<div class="debugIndex">' + currentRow + '</div>'  +  '</div>');
            
            // leafs.push(rowLeafs.join("\n"));
            // leafs.push('<br clear="both" /></div>');

            viewHeight += Math.max.apply(Math, rowHeights) + 20; // css padding
            rowHeights = [];
            rowLeafs = [];
            currentRow += 1;
            leafIndex = 0;
          }
          
      }

      if ( rowHeights.length ) {
        if ( this.pageProgression == "rl" ) {
          rowLeafs.reverse();
        }
        //leafs.push('<div class="thumbRow">' + rowLeafs.join("\n") + '<br clear="both" /></div>');
        leafs.push('<div id="thumbrow{currentRow}" data-rowIndex="{currentRow}" class="thumbRow">'.replace(/{currentRow}/g, currentRow) + rowLeafs.join("\n") + '<br clear="both" />' + '<div class="debugIndex">' + currentRow + '</div>'  +  '</div>');
        
        // leafs.push(rowLeafs.join("\n"));
        // leafs.push('<br clear="both" /></div>');

        viewHeight += Math.max.apply(Math, rowHeights);
      }
      
      leafs.push('<br clear="both" />');

      // reset the bottom position based on thumbnails
      $('#BRpageview').height(viewHeight);
      
      if ( ! $(".pageThumb").length ) {
        $container.get(0).innerHTML = leafs.join("\n");
      }

      var pageViewBuffer = Math.floor(($('#BRcontainer').attr('scrollWidth') - maxRight) / 2) - 14;

      // If seekTop is defined, seeking was requested and target found
      if (typeof(seekTop) != 'undefined') {
          $('#BRcontainer').scrollTop( seekTop );
      }

      var scrollTop = $('#BRcontainer').attr('scrollTop');
      var scrollBottom = scrollTop + $('#BRcontainer').height();

      var leafTop = 0;
      var leafBottom = 0;
      var rowsToDisplay = [];

      // Visible leafs with least/greatest index
      var leastVisible = this.numLeafs - 1;
      var mostVisible = 0;

      // Determine the thumbnails in view
      for (i=0; i<leafMap.length; i++) {
        
          var $row = $("#thumbrow" + i);
          var leafTop = scrollTop + $row.offset().top - $("#BRcontainer").offset().top;
          var leafBottom = leafTop + $row.height();
        
          // leafBottom += this.padding + leafMap[i].height;
          var topInView    = (leafTop >= scrollTop) && (leafTop <= scrollBottom);
          var bottomInView = (leafBottom >= scrollTop) && (leafBottom <= scrollBottom);
          var middleInView = (leafTop <=scrollTop) && (leafBottom>=scrollBottom);
          
          // console.log("THUMB", i, leafTop, leafBottom, "|", scrollTop, scrollBottom, "|", topInView, middleInView, bottomInView);
          
          if (topInView | bottomInView | middleInView) {
              //console.log('row to display: ' + j);
              rowsToDisplay.push(i);
              if (leafMap[i].leafs[0].num < leastVisible) {
                  leastVisible = leafMap[i].leafs[0].num;
              }
              if (leafMap[i].leafs[leafMap[i].leafs.length - 1].num > mostVisible) {
                  mostVisible = leafMap[i].leafs[leafMap[i].leafs.length - 1].num;
              }
          }
          if (leafTop > leafMap[i].top) { leafMap[i].top = leafTop; }
          leafTop = leafBottom;
      }
      // create a buffer of preloaded rows before and after the visible rows
      var firstRow = rowsToDisplay[0];
      var lastRow = rowsToDisplay[rowsToDisplay.length-1];
      for (i=1; i<this.thumbRowBuffer+1; i++) {
          if (lastRow+i < leafMap.length) { rowsToDisplay.push(lastRow+i); }
      }
      for (i=1; i<this.thumbRowBuffer+1; i++) {
          if (firstRow-i >= 0) { rowsToDisplay.push(firstRow-i); }
      }

      // Create the thumbnail divs and images (lazy loaded)
      var j;
      var row;
      var left;
      var index;
      var div;
      var link;
      var img;
      var page;
      
      $(".thumbRow:has(.choked)").each(function() {
        var i = $(this).data('rowIndex');
        console.log("CHECKING DISPLAY OF", i);
        if ( BookReader.util.notInArray(i, rowsToDisplay) ) {
          console.log("ADDING TO ROWS TO DISPLAY", i);
          rowsToDisplay.push(i);
        }
      })
      
      console.log("ROWS TO DISPLAY", rowsToDisplay.join(" / "));
      
      for (i=0; i<rowsToDisplay.length; i++) {
        row = rowsToDisplay[i];
        var $thumbrow = $("#thumbrow" + row);
          if (BookReader.util.notInArray(rowsToDisplay[i], this.displayedRows) || $thumbrow.has(".choked").length ) {    

              for (j=0; j<leafMap[row].leafs.length; j++) {
                  index = j;
                  leaf = leafMap[row].leafs[j].num;
                  
                  leafWidth = this.thumbWidth;
                  leafHeight = parseInt((this.getPageHeight(leaf)*this.thumbWidth)/this.getPageWidth(leaf), 10);
                  // if ('rl' == this.pageProgression){
                  //     left = viewWidth - leafWidth - left;
                  // }

                  var $pagediv = $("#pagediv" + leaf);
                  if ( $pagediv.find(".content").length && ! $pagediv.has(".choked").length ) {
                    // already has image...
                    continue;
                  }
                  // $pagediv.addClass("BRpagedivthumb");
                  
                  if ( $pagediv.has(".choked").length ) {
                    $pagediv.find("a").remove();
                  }

                  // link to page in single page mode
                  link = document.createElement("a");
                  $(link).data('leaf', leaf).addClass("content");
                  $(link).bind('click', function(event) {
                      self.firstIndex = $(this).data('leaf');
                      self.switchMode(self.constMode1up);
                      event.preventDefault();
                  });

                  // $$$ we don't actually go to this URL (click is handled in handler above)
                  var title = "image of page " + this.getPageNum(leaf);
                  link.href = '#page/' + (this.getPageNum(leaf)) +'/mode/1up' ;
                  $(link).attr({ title : title });
                  $pagediv.append(link);

                  img = document.createElement("img");
                  var thumbReduce = Math.floor(this.getPageWidth(leaf) / this.thumbWidth);
                  
                  var srcURL = this._getPageURI(leaf, thumbReduce);

                  $(img).attr('src', this.imagesBaseURL + 'transparent.png')
                      .css({'width': leafWidth+'px', 'height': leafHeight+'px' })
                      .addClass('BRlazyload')
                      // Store the URL of the image that will replace this one
                      .data('srcURL',  srcURL)
                      .data('index', leaf).
                      data('reduce', thumbReduce);
                  $(link).append(img);
                  //console.log('displaying thumbnail: ' + leaf);
              }   
          }
      }
      
      // Remove thumbnails that are not to be displayed
      var k;
      for (i=0; i<this.displayedRows.length; i++) {
          if (BookReader.util.notInArray(this.displayedRows[i], rowsToDisplay)) {
              row = this.displayedRows[i];

              // $$$ Safari doesn't like the comprehension
              //var rowLeafs =  [leaf.num for each (leaf in leafMap[row].leafs)];
              //console.log('Removing row ' + row + ' ' + rowLeafs);

              for (k=0; k<leafMap[row].leafs.length; k++) {
                  index = leafMap[row].leafs[k].num;
                  //console.log('Removing leaf ' + index);
                  $('#pagediv'+index).find(".content").remove();
              }
          } else {
              /*
              var mRow = this.displayedRows[i];
              var mLeafs = '[' +  [leaf.num for each (leaf in leafMap[mRow].leafs)] + ']';
              console.log('NOT Removing row ' + mRow + ' ' + mLeafs);
              */
          }
      }

      // Update which page is considered current to make sure a visible page is the current one
      var currentIndex = this.currentIndex();
      // console.log('current ' + currentIndex);
      // console.log('least visible ' + leastVisible + ' most visible ' + mostVisible);
      if (currentIndex < leastVisible) {
          this.setCurrentIndex(leastVisible);
      } else if (currentIndex > mostVisible ) {
        this.setCurrentIndex(mostVisible);
      }

      // if ( this.currentIndex() >= this.numLeafs ) {
      //   console.log("REDUCING THE CURRENT INDEX!!!");
      //   this.currentIndex(this.numLeafs - 1);
      // }

      this.displayedRows = rowsToDisplay.slice();

      // Update hash, but only if we're currently displaying a leaf
      // Hack that fixes #365790
      if (this.displayedRows.length > 0) {
          this.updateLocationHash();
      }

      // remove previous highlights
      $('.BRpagedivthumb_highlight').removeClass('BRpagedivthumb_highlight');

      // highlight current page
      $('#pagediv'+this.currentIndex()).addClass('BRpagedivthumb_highlight');

      this.lazyLoadThumbnails();

      // Update page number box.  $$$ refactor to function
      if (null !== this.getPageNum(this.currentIndex()))  {
        this.updatePageNumBox();
        // $("#BRpagenum").val(this.getPageNum(this.currentIndex()));
      } else {
        $("#BRpagenum").val('');
      }

      this.updateToolbarZoom(this.reduce); 
  }

  HTBookReader.prototype.jumpToIndex = function(index, pageX, pageY) {
    if ( this.mode == this.constMode1up ) {
      var $div = $("#pagediv" + index);
      var top = $div.length ? $div.offset().top : 0;
      var $container = $("#BRcontainer");
      $container.animate({ scrollTop : ($container.scrollTop() + top - $container.offset().top ) }, "fast");
    } else {
      // HTBookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
      // HTBookReader jumpToIndex obsessed with text mode
      BookReader.prototype.jumpToIndex.call(this, index, pageX, pageY);
    }
  }

  HTBookReader.prototype.createContentElement = function(index, reduce, width, height) {
      var self = this;
      var e;
      var url = this._getPageURI(index, reduce, 0);

      if ( 0 && this.hasPageFeature(index, "MISSING_PAGE") ) {
        // don't generate the text version; use the image served by imgsrv

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

          var lazy = new Image();
          
          lazy.onerror = function(evt) {
            console.log("ERROR: ", this, evt);
          }
          
          lazy.e = e;
          lazy.index = index;
          $(lazy).one('load', function() {
            console.log("LOADING", this.index);
            var index = this.index;
            var e = this.e;
            this.e = null;
            var natural_height = this.height;
            var natural_width = this.width;
            
            // check for a throttled image
            // this is so lame
            if ( natural_height == HT.config.CHOKE_DIM && natural_width == HT.config.CHOKE_DIM ) {
              // start the choke timer
              console.log("TREAT THIS AS AN ERROR:", this);
              // but show this image
              $(e).addClass("choked");
              e.src = this.src;
              HT.monitor.run(this.src);
              return;
            }
            
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
            
            if ( ! $(e).length ) {
              // image is gone
              return;
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
              $(e).parent().andSelf().animate({ height : height + 'px', width : width + 'px'}, "fast", function() {
                // did this scroll off screen? that's the question
                if ( index == self.firstIndex ) {
                  self.jumpToIndex(index);
                }
              });
            }
            e.src = this.src;
          })
          .attr({ src : url });

          lazy = null;

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

  HTBookReader.prototype.getPageWidth = function(index) {
      var r = this.rotationCache[index] || 0;
      if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
          var h = this.__getPageHeight(index);
          // h = Math.ceil(w * ( w / h ));
          return h;
      }
      var w = this.__getPageWidth(index);
      return w;
  }

  HTBookReader.prototype.getPageHeight = function(index) {
      var r = this.rotationCache[index] || 0;
      var h = this.__getPageHeight(index);
      if ( this.displayMode == 'image' && 2 !== this.mode && ( r == 90 || r == 270 )) {
          var w = this.__getPageWidth(index);
          // h = Math.ceil(w * ( w / h ));
          return w;
      }
      return h;
  }

  HTBookReader.prototype.__getPageWidth = function(index) {
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

  HTBookReader.prototype.__getPageHeight = function(index) {
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
  HTBookReader.prototype.prefetchImg = function(index) {
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
          // console.log('no image for ' + index);
          loadImage = true;
      } else if (pageURI != this.prefetchedImgs[index].uri || this.prefetchedImgs[index].choked ) {
          // console.log('uri changed for ' + index, pageURI, this.prefetchedImgs[index].uri);
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

              // check for a throttled image
              // this is so lame
              if ( natural_height == HT.config.CHOKE_DIM && natural_width == HT.config.CHOKE_DIM ) {
                // start the choke timer
                console.log("TREAT THIS AS AN ERROR (2UP):", this);
                // but show this image
                $(e).addClass("choked");
                e.choked = true;
                e.src = this.src;
                HT.monitor.run(this.src);
                return;
              }

              if ( self.hasPageFeature(index, "FUDGED") ) {
                var slice = self.sliceFromIndex(index);
                var old_height = self.getPageHeight(index);
                var true_height = natural_height * reduce;
                var true_width = natural_width * reduce;
                self.bookData[slice.slice]['height'][slice.index] = true_height;
                self.bookData[slice.slice]['width'][slice.index] = true_width;
                self.removePageFeature(index, 'FUDGED');
                // console.log("FUDGED TRUE HEIGHT", index, self.reduce, old_height, true_height);
                fudged = true;
              }
              
              if ( fudged ) {
                self.fudge2up(index);
              }
              
              e.src = this.src; // updates the img in the prefetch
              
              // if ( fudged ) {
              //   console.log("FUDGING", index);
              //   self.fudge2up(index, this);
              // } else {
              //   // should really animate to the new dimensions...
              //   e.src = this.src;
              // }

              this.e = null;
            }).attr('src', pageURI);
          }
          // UM
          var title = "image of page " + this.getPageNum(index);
          img.uri = pageURI;
          img.src = this.imagesBaseURL + 'transparent.png'; // pageURI; // browser may rewrite src so we stash raw URI here
          $(img).attr({ title : title, alt : title });
          this.prefetchedImgs[index] = img;
      } else if ( index > -1 ) {
        var $pagediv = $("#pagediv" + index);
        if ( $pagediv.length &&  $pagediv.attr('src').indexOf("transparent.png") > -1 ) {
          $pagediv.attr('src', pageURI);
        }
        // console.log("NOT LOADING IMAGE", index, $pagediv.attr('src'), pageURI);
      }
  }

  HTBookReader.prototype.fudge2up = function(index, lazy) {
    var self = this;

    if ( index != self.twoPage.currentIndexL && index != self.twoPage.currentIndexR ) {
      return;
    }

    // redraw the page
    var oldCenter = this.twoPageGetViewCenter();
    self.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);
    return;

    // // this works, but can mess up the twoPage reduction --- fits this
    // // instance, but the clicking punts
    // var $pagediv = $("#pagediv" + index);
    // if ( ! $pagediv.length ) {
    //   return;
    // }
    // $("#pagediv" + index).attr('src', lazy.src);
    // 
    // var oldCenter = this.twoPageGetViewCenter();
    // self.prepareTwoPageView(oldCenter.percentageX, oldCenter.percentageY);

  }

  
}

