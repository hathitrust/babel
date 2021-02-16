var HT = HT || {};

HT.isLogging = false;
HT.log = function() {
  if ( HT.isLogging ) {
    console.log.apply(console, arguments);
  }
}

head.ready(function() {

  HT.renew_auth = function(entityID, source='image') {
    if ( HT.__renewing ) { return ; }
    HT.__renewing = true;
    setTimeout(() => {
      var reauth_url = `https://${HT.service_domain}/Shibboleth.sso/Login?entityID=${entityID}&target=${encodeURIComponent(window.location.href)}`;
      var retval = window.confirm(`We're having a problem with your session; select OK to log in again.`);
      if ( retval ) {
        window.location.href = reauth_url;
      }
    }, 100);
  }

  HT.analytics = HT.analytics || {};
  HT.analytics.logAction = function(href, trigger) {
    if ( href === undefined ) { href = location.href ; }
    var delim = href.indexOf(';') > -1 ? ';' : '&';
    if ( trigger == null ) { trigger = '-'; }
    href += delim + 'a=' + trigger;
    $.ajax(href, 
    {
      complete: function(xhr, status) {
        var entityID = xhr.getResponseHeader('x-hathitrust-renew');
        if ( entityID ) {
          HT.renew_auth(entityID, 'logAction');
        }
      }
    })
  }


  $("body").on('click', 'a[data-tracking-category="outLinks"]', function(event) {
    var trigger = 'out' + $(this).attr('href');
    HT.analytics.logAction(undefined, trigger);
  })

})