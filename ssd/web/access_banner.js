head.ready(function() {

  var MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
    'August', 'September', 'October', 'November', 'December'];

  var $emergency_access = $("#access-emergency-access");

  var delta = 5 * 60 * 1000;
  var last_seconds;
  var toggle_renew_link = function(date) {
    var now = Date.now();
    if ( now >= date.getTime() ) {
      var $link = $emergency_access.find("a[disabled]");
      $link.attr("disabled", null);
    }
  }

  var observe_expiration_timestamp = function() {
    if ( ! HT || ! HT.params || ! HT.params.id ) { return ; }
    var data = $.cookie('HTexpiration', undefined, { json: true });
    if ( ! data ) { return ; }
    var seconds = data[HT.params.id];
    // console.log("AHOY OBSERVE", seconds, last_seconds);
    if ( seconds == -1 ) {
      var $link = $emergency_access.find("p a").clone();
      $emergency_access.find("p").text("Your access has expired and cannot be renewed. Reload the page or try again later. Access has been provided through the ");
      $emergency_access.find("p").append($link);
      var $action = $emergency_access.find(".alert--emergency-access--options a");
      $action.attr('href', window.location.href);
      $action.text('Reload');
      return;
    }
    if ( seconds > last_seconds ) {
      var message = time2message(seconds);
      last_seconds = seconds;
      $emergency_access.find(".expires-display").text(message);
      if ( HT.reader && HT.reader.service ) {
        HT.reader.service.expiration = seconds;
      }
    }
  }

  var time2message = function(seconds) {
    var date = new Date(seconds * 1000);
    var hours = date.getHours();
    var ampm = 'AM';
    if ( hours > 12 ) { hours -= 12; ampm = 'PM'; }
    if ( hours == 12 ){ ampm = 'PM'; }
    var minutes = date.getMinutes();
    if ( minutes < 10 ) { minutes = `0${minutes}`; }
    var message = `${hours}:${minutes}${ampm} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
    return message;
  }

  if ( $emergency_access.length ) {
    var expiration = $emergency_access.data('accessExpires');
    var seconds = parseInt($emergency_access.data('accessExpiresSeconds'), 10);
    var granted = $emergency_access.data('accessGranted');

    var now = Date.now() / 1000;
    var message = time2message(seconds);
    $emergency_access.find(".expires-display").text(message);
    $emergency_access.get(0).dataset.initialized = 'true'

    if ( granted ) {
      // set up a watch for the expiration time
      last_seconds = seconds;
      if ( HT.reader && HT.reader.service ) {
        HT.reader.service.expiration = seconds;
      }
      setInterval(function() {
        // toggle_renew_link(date);
        observe_expiration_timestamp();
      }, 500);
    }
  }

})