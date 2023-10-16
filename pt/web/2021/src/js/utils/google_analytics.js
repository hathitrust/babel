var HT = HT || {};
head.ready(function() {

  HT.analytics.getContentGroupData = function() {
    // cheat
    var suffix = '';
    var content_group = 4;
    if ( $("#section").data("view") == 'restricted' ) {
      content_group = 2;
      suffix = '#restricted';
    } else if ( window.location.href.indexOf("debug=super") > -1 ) {
      content_group = 3;
      suffix = '#super';
    }
    return { index : content_group, value : HT.params.id + suffix };

  }

  HT.analytics._simplifyPageHref = function(href) {
    var url = $.url(href);
    var new_href = url.segment();
    new_href.push($("html").data('content-provider'));
    new_href.push(url.param("id"));
    var qs = '?skin=2021';
    if ( new_href.indexOf("search") > -1 && url.param('q1')  ) {
      qs += '&q1=' + url.param('q1');
    }
    new_href = "/" + new_href.join("/") + qs;
    return new_href;
  }

  HT.analytics.getPageHref = function() {
    return HT.analytics._simplifyPageHref();
  }

  HT.analytics.getTitle = function() {
    const title = document.querySelector('title');
    if ( location.pathname == '/cgi/pt' && title.dataset.title ) {
      return title.dataset.title;
    }
    return document.title;
  }

  document.querySelector('title').dataset.title = document.title;

  $("body").on('click', ".shepherd-footer .shepherd-button", function(event) {
    const $button = $(this);
    const action = $button.text() == 'Exit' ? 'exit' : 'next';
    const $modal = $button.parents(".shepherd-element");
    const stepId = $modal.attr('data-shepherd-step-id');
    HT.analytics.trackEvent({
      category: 'PT.walkthrough',
      action: `${stepId}:${action}`,
      label: `${stepId}:${action}`
    })
  })

})