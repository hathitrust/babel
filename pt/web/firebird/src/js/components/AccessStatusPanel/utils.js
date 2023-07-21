const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July',
  'August', 'September', 'October', 'November', 'December'];

export function time2message(seconds) {
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

export class ExpirationMonitor {
  constructor(id, cookieJar, callback) {
    this.id = id;
    this.cookieJar = cookieJar;
    this.lastSeconds = -1;
    this.callback = callback;
    this.interval = null;
  }

  watch() {
    let expirationData = this.cookieJar.getItem('HTexpiration');
    // console.log("-- expiration.monitor.watch", this.id, expirationData);
    if ( ! expirationData ) { return ; }
    expirationData = JSON.parse(expirationData);
    let seconds = expirationData[this.id];
    // console.log("-- expiration.monitor.run", this.id, seconds, this.lastSeconds);
    if ( seconds == -1 || seconds < this.lastSeconds ) {
      clearInterval(this.interval);
      this.callback(false);
      return;
    }
    if ( seconds > this.lastSeconds ) {
      console.log("-- expiration.monitor.watch", seconds, time2message(seconds));
      this.callback(time2message(seconds));
      this.lastSeconds = seconds;
    }
  }

  run() {
    this.interval = setInterval(this.watch.bind(this), 500);
    console.log("-- expiration.monitor.run", this.interval);
  }

  stop() {
    clearInterval(this.interval);
  }
}

window.debugExpiration = function(id, seconds) {
  const HT = window.HT;
  let expires = new Date();
  let data = {};
  let timestamp;
  if ( seconds > 0 ) {
    timestamp = -1;
  } else {
    timestamp = Math.floor(expires.getTime() / 1000) + seconds;
  }
  data[id] = timestamp;
  expires.setDate(expires.getDate() + 3);
  HT.cookieJar.setItem('HTexpiration', JSON.stringify(data), expires, '/', HT.cookies_domain, true);
  console.log("-- done");
}