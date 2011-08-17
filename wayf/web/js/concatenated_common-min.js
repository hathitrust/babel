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

/* /htapps/bkammin.babel/wayf/web/js/login.js */
function loginButtonClick() {
    	var e = document.getElementById('frontpage');
    	e.style.display="none";
    	
    	e=document.getElementById('selectinst');
    	e.style.display="";

		return false;
}

function loginHomeClick() {
	var e = document.getElementById('selectinst');
	e.style.display="none";
	
	e=document.getElementById('frontpage');
	e.style.display="";

	return false;
}


/* /htapps/bkammin.babel/wayf/web/mobile/loginMobile.js */
