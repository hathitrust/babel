// var $section = document.querySelector('main section');
var $main = document.querySelector('main');
var $section = document.querySelector('section .pages');
var $inner = document.querySelector('section .pages .pages-inner');
var is_active = false;
var scale = 0.75;
var image_width = 680;

var $navigator = { 
  input: document.querySelector('input[type="range"]'),
  status: document.querySelector('.navigator-range__background')
};
$navigator.input.addEventListener('change', function(event) {
  var seq = this.value;
  gotoPage(seq);
})

var handleObserver = function(entries, observer) {
  var current = { page: null, ratio: 0 };
  entries.forEach(entry => {
    var div = entry.target;
    var seq = div.dataset.seq;
    var viewed = div.querySelector('canvas');
    if ( entry.isIntersecting && entry.intersectionRatio > 0.0  ) {
      console.log("AHOY OBSERVING", entries.length, seq, 'onEnter', entry.intersectionRatio);
      if ( entry.intersectionRatio > current.ratio ) {
        current.ration = entry.intersectionRatio;
        current.page = div;
      }
      if ( ! viewed ) {
        // console.log("AHOY OBSERVING", entries.length, seq, 'onEnter');
        loadImage(div, true);
      } else if (  div.dataset.preloaded ) {
        div.dataset.preloaded = false;
        resizePage(div);
      }
    } else if ( viewed && ! div.dataset.preloaded ) {
      console.log("AHOY OBSERVING", entries.length, seq, 'onExit');
      unloadImage(div);
    }
  })
  if ( current.page ) {
    update_navigator(current.page);
  }
};

var $observer = new IntersectionObserver(handleObserver, {
    root: $section,
    rootMargin: '0px',
    threshold: [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1]
});

var resizePage = function(page) {
  var canvas = page.querySelector('canvas');
  if ( ! canvas ) { return ; }

  if ( page.dataset.loading !== 'false' ) {
    return;
  }

  var bounds = $section.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  if ( canvas.height < parseInt(page.style.height) ) {
    console.log("AHOY shrinking", page.dataset.seq, page.style.height, canvas.height);
  }
  page.style.height = `${canvas.height}px`;
  var updated_rect = page.getBoundingClientRect();
  var scrollTop = $section.scrollTop;

  if ( $main.dataset.view == '1up' && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    setTimeout(function() {
      delta = updated_rect.height - rect.height;
      if ( $section.scrollTop == scrollTop ) {
        // delta /= this.settings.scale;
        // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
        $section.scrollTop += Math.ceil(delta);
        console.log("AHOY afterResized", page.dataset.seq, scrollTop, $section.scrollTop, delta);
      } else {
        console.log("AHOY donotResized", page.dataset.seq, scrollTop, $section.scrollTop, delta);
      }
    }, 500);
  }
}

var fitImageOn = function(canvas, imageObj) {
  if ( ! canvas.parentNode ) {
    console.log("AHOY LOST PARENT", canvas.dataset.seq);
  }
  var imageAspectRatio = imageObj.width / imageObj.height;

  // canvas.width = canvas.height * imageAspectRatio;
  canvas.height = canvas.width / imageAspectRatio;
  // canvas.parentNode.style.height = `${canvas.height}px`;

  var context = canvas.getContext('2d');
  
  var canvasAspectRatio = canvas.width / canvas.height;
  var renderableHeight, renderableWidth, xStart, yStart;

  // If image's aspect ratio is less than canvas's we fit on height
  // and place the image centrally along width
  if(imageAspectRatio < canvasAspectRatio) {
    renderableHeight = canvas.height;
    renderableWidth = imageObj.width * (renderableHeight / imageObj.height);
    xStart = (canvas.width - renderableWidth) / 2;
    yStart = 0;
    // console.log(`AHOY a : ${canvas.width} x ${canvas.height} / ${canvas.offsetHeight} :: ${renderableWidth} x ${renderableHeight}`);
  }

  // If image's aspect ratio is greater than canvas's we fit on width
  // and place the image centrally along height
  else if(imageAspectRatio > canvasAspectRatio) {

    renderableWidth = canvas.width
    renderableHeight = imageObj.height * (renderableWidth / imageObj.width);
    xStart = 0;
    yStart = (canvas.height - renderableHeight) / 2;
  }

  // Happy path - keep aspect ratio
  else {
    
    renderableHeight = canvas.height;
    renderableWidth = canvas.width;
    xStart = 0;
    yStart = 0;
  }
  xStart = 0;
  yStart = 0;
  context.drawImage(imageObj, xStart, yStart, renderableWidth, renderableHeight);
  canvas.style.visibility = 'visible';
  // context.font = '48px monospace';
  // context.textAlign = 'center';
  // context.fillText('Hello world', canvas.width / 2, (canvas.height / 2) );
};

var loadImage = function(page, check_scroll) {
  if ( ! is_active ) { return ; }
  var seq = page.dataset.seq;
  var bounds = $section.getBoundingClientRect();
  var rect = page.getBoundingClientRect();

  console.log("AHOY LOADING", seq);

  // var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};size=100`;
  var image_url = `/cgi/imgsrv/image?id=${HT.params.id};seq=${seq};width=${page.offsetWidth}`;
  if ( page.querySelector('canvas') ) {
    // preloadImages(page);
    return;
  }

  var canvas = document.createElement('canvas');
  canvas.dataset.seq = seq;

  var page_height = page.offsetHeight;
  var page_width = page.offsetWidth;
  // canvas.height = page_height;
  canvas.width = page_width;
  canvas.style.visibility = 'hidden';
  page.appendChild(canvas);

  var img = new Image();

  page.dataset.loading = true;
  img.addEventListener('load', function() {
    page.dataset.loading = false;
    fitImageOn(canvas, this);
    if ( check_scroll || $main.dataset.view == 'thumbnail' ) { resizePage(page); }
    // var updated_rect = page.getBoundingClientRect();
    // if ( check_scroll && rect.bottom <= bounds.bottom && rect.top < 0 ) {
    //   delta = updated_rect.height - rect.height;
    //   // delta /= this.settings.scale;
    //   // console.log("AHOY afterResized", view.index, this.container.scrollTop, view.element.getBoundingClientRect().height, rect.height, delta / this.settings.scale);
    //   $section.scrollTop += Math.ceil(delta);
    // } else {
    //   console.log("AHOY NO CHANGE?")
    // }
  })

  img.src = image_url;

  if ( ! page.dataset.preloaded ) {
    preloadImages(page);
  }
}

var unloadImage = function(page) {
  if ( page.dataset.preloaded ) { return; }
  if ( page.dataset.loading ) { return ; }
  var canvas = page.querySelector('canvas');
  if ( canvas ) {
    page.removeChild(canvas);
  }
  page.dataset.preloaded = false;
}

var preloadImages = function(page) {
  var seq = parseInt(page.dataset.seq, 10);
  var delta = 1;
  while ( delta <= 1 ) {
    var prev_page = document.querySelector(`.page[data-seq="${seq - delta}"]`);
    if ( prev_page ) {
      prev_page.dataset.preloaded = true;
      loadImage(prev_page);
    }
    delta += 1;
  }
  delta = 1;
  while ( delta <= 1 ) {
    var next_page = document.querySelector(`.page[data-seq="${seq + delta}"]`);
    if ( next_page ) {
      next_page.dataset.preloaded = true;
      loadImage(next_page);
    }
    delta += 1;
  }
}

var getPage = function(seq) {
  return document.querySelector(`.page[data-seq="${seq}"]`);
}

var gotoPage = function(seq, delta) {
  var currentSeq = parseInt($navigator.input.value, 10);
  if ( ! seq ) {
    seq = currentSeq;
  }
  if ( delta ) {
    seq += delta;
  }

  var currentPage = getPage(currentSeq);
  console.log("AHOY AHOY", currentSeq, currentPage);
  if ( currentPage ) {
    // currentPage.addEventListener('animationend', function exitPage() {
    //   console.log("AHOY ANIMATION ENDED", currentPage);
    //   currentPage.classList.remove('pt-page-moveToLeft');
    //   currentPage.dataset.visible = false;
    //   currentPage.removeEventListener('animationend', exitPage);
    //   unloadImage(currentPage);
    // })
    // currentPage.classList.add('pt-page-moveToLeft');

    currentPage.dataset.visible = false;
    setTimeout(function() {
      unloadImage(currentPage);
    })
  }

  var target = getPage(seq);
  // target.addEventListener('animationend', function enterPage() {
  //   target.classList.remove('pt-page-moveFromRight');
  //   target.removeEventListener('animationend', enterPage);
  // })
  // target.classList.add('pt-page-moveFromRight');
  target.dataset.visible = true;
  target.parentNode.scrollTop = target.offsetTop - target.parentNode.offsetTop;
  if ( $observer.inactive ) { loadImage(target, true); update_navigator(target);}
  // target.scrollIntoView(false);
}

var nextPage = function() {
  gotoPage(null, 1);
}

var previousPage = function() {
  gotoPage(null, -1);
}

var update_navigator = function(page) {
  var seq = parseInt(page.dataset.seq, 10);
  $navigator.input.value = seq;
  var percentage = ( seq / $navigator.input.max ) * 100.0;
  $navigator.input.style.backgroundSize = `${percentage}% 100%`;
  // $navigator.status.setAttribute('style', 'background-position: ' + (-percentage) + '% 0%, left top;');
}

var min_height = $section.offsetHeight;
var min_width = $section.offsetWidth * 0.80;
$main.dataset.view = 'image';

if ( $main.dataset.view == 'thumbnail' ) {
  scale = 0.25;
}

var $data;
fetch(`/cgi/imgsrv/meta?id=${HT.params.id}`)
  .then(function(response) {
    return response.json();
  })
  .then(function(data) {

    $data = data;

    $navigator.input.max = data.items.length;
    $navigator.input.min = 1;
    $navigator.input.style.backgroundSize = '0% 100%';
    // $navigator.status.setAttribute('style', 'background-position: ' + (0) + '% 0%, left top;');

    var meta = $data.items[0];
    var r = meta.height / meta.width;

    data.items.forEach(function(item) {
      var page = document.createElement('div');
      page.style.height = `${min_width * r * scale}px`;
      page.style.width = `${min_width * scale}px`;
      page.dataset.bestFit = ( scale <= 1 );

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.marginLeft = `-${(min_width * r * scale) / 2}px`;
      // }

      // if ( $main.dataset.view == 'image' ) {
      //   page.style.top = '0px';
      //   page.style.left = `${- ( item.seq - 1 ) * min_width}px`;
      // }

      page.classList.add('page');
      page.dataset.seq = item.seq;
      page.innerHTML = `<div class="info">${item.seq}</div>`;
      $inner.appendChild(page);
    })

    var pages = document.querySelectorAll('.page');
    for(var i = 0; i < pages.length; i++) {
      if ( $main.dataset.view == 'image' ) {
        pages[i].dataset.visible = false;
        $observer.inactive = true;
      } else {
        $observer.observe(pages[i]);
      }
    }

    var page = document.querySelector('.page[data-seq="25"]');
    setTimeout(function() {
      is_active = true;
      gotoPage(25);
      // var offsetTop = page.offsetTop;
      // $inner.scrollTop = offsetTop;
    }, 100);
  })