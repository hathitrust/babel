function goto_page(url) {
    if (url != "" ) {
        if (url == "0" ) {
            alert("Please select your institution");
        }
        else {
            document.location.href = url;
        }
    }
    return false;
}

head.ready(function() {
  $("form select").selectWoo({
    allowCear: true,
    width: '100%'
  });  
})

