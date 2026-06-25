document.addEventListener('DOMContentLoaded', function () {
  var MONTHS = [
    'January',
    'February',
    'March',
    'April',
    'May',
    'June',
    'July',
    'August',
    'September',
    'October',
    'November',
    'December',
  ];
  var emergency_access = document.getElementById('access-emergency-access');
  var delta = 5 * 60 * 1000;
  var last_seconds;

  var toggle_renew_link = function (date) {
    var now = Date.now();
    if (now >= date.getTime()) {
      var link = emergency_access.querySelector('a[disabled]');
      if (link) link.removeAttribute('disabled');
    }
  };

  var observe_expiration_timestamp = function () {
    if (!HT || !HT.params || !HT.params.id) {
      return;
    }
    var cookieMatch = document.cookie.split('; ').find((row) => row.startsWith('HTexpiration='));
    var data = cookieMatch ? JSON.parse(decodeURIComponent(cookieMatch.split('=')[1])) : null;
    if (!data) {
      return;
    }
    var seconds = data[HT.params.id];
    if (seconds == -1) {
      var p = emergency_access.querySelector('p');
      var link = p.querySelector('a').cloneNode(true);
      p.textContent =
        'Your access has expired and cannot be renewed. Reload the page or try again later. Access has been provided through the ';
      p.appendChild(link);
      var action = emergency_access.querySelector('.alert--emergency-access--options a');
      action.setAttribute('href', window.location.href);
      action.textContent = 'Reload';
      return;
    }
    if (seconds > last_seconds) {
      var message = time2message(seconds);
      last_seconds = seconds;
      var expiresDisplay = emergency_access.querySelector('.expires-display');
      if (expiresDisplay) expiresDisplay.textContent = message;
      if (HT.reader && HT.reader.service) {
        HT.reader.service.expiration = seconds;
      }
    }
  };

  var time2message = function (seconds) {
    var date = new Date(seconds * 1000);
    var hours = date.getHours();
    var ampm = 'AM';
    if (hours > 12) {
      hours -= 12;
      ampm = 'PM';
    }
    if (hours == 12) {
      ampm = 'PM';
    }
    var minutes = date.getMinutes();
    if (minutes < 10) {
      minutes = `0${minutes}`;
    }
    var message = `${hours}:${minutes}${ampm} ${MONTHS[date.getMonth()]} ${date.getDate()}`;
    return message;
  };

  if (emergency_access) {
    var expiration = emergency_access.dataset.accessExpires;
    var seconds = parseInt(emergency_access.dataset.accessExpiresSeconds, 10);
    var granted = emergency_access.dataset.accessGranted;
    var now = Date.now() / 1000;
    var message = time2message(seconds);
    var expiresDisplay = emergency_access.querySelector('.expires-display');
    if (expiresDisplay) expiresDisplay.textContent = message;
    emergency_access.dataset.initialized = 'true';
    if (granted) {
      last_seconds = seconds;
      setInterval(function () {
        observe_expiration_timestamp();
      }, 500);
    }
  }
});
