var HT = HT || {};
head.ready(function() {

  var $status = $("div[role=status]");

  var lastMessage; var lastTimer;
  HT.update_status = function(message) {
      if ( lastMessage != message ) {
        if ( lastTimer ) { clearTimeout(lastTimer); lastTimer = null; }

        setTimeout(() => {
          $status.text(message);
          lastMessage = message;
          console.log("-- status:", message);
        }, 50);
        lastTimer = setTimeout(() => {
          $status.get(0).innerText = '';
        }, 500);

      }
  }
})