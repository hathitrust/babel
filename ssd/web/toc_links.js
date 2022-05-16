head.ready(function () {
  $("#mdpContentsList").on('click', '.mdpFeatureListItem a[data-section-href]', function(event) {
    event.preventDefault();
    var target = $(this).data('section-href');
    history.pushState(null, '', $(this).attr('href'));
    document.getElementById(target).scrollIntoView();
    console.log("--", $(this).attr('href'));
  })

  if ( window.URL ) {
    $("#mdpPage a.navigation").each(function(index, link) {
      let href = link.getAttribute('href');
      var url = new URL(link.href.replace(/;/g, '&'));
      var seq = url.searchParams.get('seq');
      link.setAttribute('href', href + `#seq${seq}`);
    });
  }

});