head.ready(function() {
  var $menu; var $trigger; var $header; var $navigator;
  HT = HT || {};

  HT.mobify = function() {

    // if ( $("html").is(".desktop") ) {
    //   $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
    // }

    $header = $("header");
    $navigator = $(".navigator");
    if ( $navigator.length ) {
      $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
      var $expando = $navigator.find(".action-expando");
      $expando.on('click', function() {
        document.documentElement.dataset.expanded = ! ( document.documentElement.dataset.expanded == 'true' );
      })
    }

    HT.$menu = $menu;

    var $sidebar = $("#sidebar");

    $trigger = $sidebar.find("button[aria-expanded]");
    // $trigger.on('clicked', function(event) {
    //   var active = $trigger.attr('aria-expanded') == 'true';
    //   $("html").get(0).dataset.view = active ? 'options' : 'viewer';
    // })

    $("#action-mobile-toggle-fullscreen").on('click', function() {
      document.documentElement.requestFullScreen();
    })

    HT.utils = HT.utils || {};

    $sidebar.on('click', function(event) {
      // hide the sidebar
      var $this = $(event.target);
      if ( $this.is("input[type='text']") ) {
        return;
      }
      if ( $this.parents("#form-search-volume").length ) {
        return;
      }
      HT.toggle(false);
    })

    var vh = window.innerHeight * 0.01;
    document.documentElement.style.setProperty('--vh', vh + 'px');

    $(window).on("resize", function() {
        var vh = window.innerHeight * 0.01;
        document.documentElement.style.setProperty('--vh', vh + 'px');
    })

    $(window).on("orientationchange", function() {
        setTimeout(function() {
            var vh = window.innerHeight * 0.01;
            document.documentElement.style.setProperty('--vh', vh + 'px');

            HT.utils.handleOrientationChange();
        }, 100);
    })
    document.documentElement.dataset.expanded = 'true';
  }

  HT.toggle = function(state) {

    $trigger.attr('aria-expanded', state);
    $("html").get(0).dataset.view = state ? 'options' : 'viewer';

    // var xlink_href;
    // if ( $trigger.attr('aria-expanded') == 'true' ) {
    //   xlink_href = '#panel-expanded';
    // } else {
    //   xlink_href = '#panel-collapsed';
    // }
    // $trigger.find("svg use").attr("xlink:href", xlink_href);
  }

  setTimeout(HT.mobify, 1000);
})

// head.ready(function() {
//   var $menu; var $trigger; var $header; var $navigator;
//   HT = HT || {};

//   HT.is_mobile = $("html").is(".mobile") || ( HT.params.debug && HT.params.debug.indexOf('mobile') > -1 );

//   HT.mobify = function() {

//     if ( $("html").is(".desktop") ) {
//       $("html").addClass("mobile").removeClass("desktop").removeClass("no-mobile");
//     }

//     $header = $("header");
//     $navigator = $(".navigator");
//     if ( $navigator.length ) {
//       $navigator.get(0).style.setProperty('--height', `-${$navigator.outerHeight() * 0.90}px`);
//       var $expando = $navigator.find(".action-expando");
//       $expando.on('click', function() {
//         document.documentElement.dataset.expanded = ! ( document.documentElement.dataset.expanded == 'true' );
//       })
//     }

//     HT.$menu = $menu;

//     var $sidebar = $("#sidebar");

//     $trigger = $sidebar.find("button[aria-expanded]");
//     $trigger.on('clicked', function(event) {
//       var active = $trigger.attr('aria-expanded') == 'true';
//       $("html").get(0).dataset.view = active ? 'options' : 'viewer';
//     })

//     $("#action-mobile-toggle-fullscreen").on('click', function() {
//       document.documentElement.requestFullScreen();
//     })

//     HT.utils = HT.utils || {};

//     $sidebar.on('click', function(event) {
//       // hide the sidebar
//       var $this = $(event.target);
//       if ( $this.is("input[type='text']") ) {
//         return;
//       }
//       if ( $this.parents("#form-search-volume").length ) {
//         return;
//       }
//       HT.toggle(false);
//     })

//     var vh = window.innerHeight * 0.01;
//     document.documentElement.style.setProperty('--vh', vh + 'px');

//     $(window).on("resize", function() {
//         var vh = window.innerHeight * 0.01;
//         document.documentElement.style.setProperty('--vh', vh + 'px');
//     })

//     $(window).on("orientationchange", function() {
//         setTimeout(function() {
//             var vh = window.innerHeight * 0.01;
//             document.documentElement.style.setProperty('--vh', vh + 'px');

//             HT.utils.handleOrientationChange();
//         }, 100);
//     })
//     document.documentElement.dataset.expanded = 'true';
//   }

//   HT.toggle = function(state) {

//     $trigger.attr('aria-expanded', state);
//     $("html").get(0).dataset.view = state ? 'options' : 'viewer';

//     var xlink_href;
//     if ( $trigger.attr('aria-expanded') == 'true' ) {
//       xlink_href = '#panel-expanded';
//     } else {
//       xlink_href = '#panel-collapsed';
//     }
//     $trigger.find("svg use").attr("xlink:href", xlink_href);
//   }

//   if ( HT.is_mobile ) {
//     setTimeout(HT.mobify, 1000);
//   }
// })