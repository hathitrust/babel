$(document).ready(function() {
  $(".tracked").click(function() {
    var href = $(this).attr('href');
    pageTracker._trackEvent('cbActions', 'click', "CB - branded " + $(this).text() + " link");
    setTimeout(function() {
      window.location.href = href;
    }, 500);
    return false;
  })
})