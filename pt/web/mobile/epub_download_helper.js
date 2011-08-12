// avoid polluting the global namespace
var HT = HT || {};

HT.epub_helpers = {	
	 cancel_download : function( srccancel){
		alert('cancel!!! ' + srccancel);
	 },

     download_epub : function(self) {
		var progresst = (((1+Math.random())*0x10000)|0).toString(16) + "." + (new Date()).getTime();
        var progress = progresst;// + ".txt";
        progress = progress.substr(0,1) + "/" + progress.substr(1,1) + "/" + progress.substr(2,1) + "/" + progress;
        var src = $(self).attr('href_epub') + ";progress=" + progress;
        var srcdl = $(self).attr('href_epub') + ";dl=true;progress=" + progress;
        var srccancel = $(self).attr('href_epub') + ";cancel=true;progress=" + progress;
        var canceldl=false;        
        var bookId= $(self).attr('bookId');
        bookId=bookId.replace(/[^a-zA-Z 0-9]+/g,'');// strip non-alpha/non-numeric characters
        
        $("#fullEpubDownload"  ).empty().append('<iframe  style="display:none" name="epubdl' + bookId + '" id="epubdl' + bookId + '" src="' + src + '"></iframe>');
        //style="display:none"
        
        var inter = null;
        var thepath="/cache/progress" + "/" + progress + ".txt";
        
        var html = 
        '<div class="epub-meter-wrap">' +
        	'<div class="epub-meter-text">Generating EPUB...</div>' +
            '<div class="epub-meter-value-wrap"><div class="epub-meter-value" ></div></div>' +
            '<div class="epub-meter-button"><button  class="close" ' +
            'onclick="$(\'#epubdl' + bookId + '\').attr(\'src\', \'' + srccancel + '\');" >Cancel</button></div>' +
        '</div>';
        
        var $notice = new Boxy(html, {
           show : true,
           modal : true,
           draggable : true,
           closeable : false,
           title : "",
           afterHide : function() {clearInterval(inter);}
        });
     
        var $content = $notice.getContent();
        var idx = 0;
        var processed = 0;
        var nofilecount=0;

        var show_error = function() {
            var html =
            '<div class="fullEpubAlert">' +
            '<p>' +
            'There was a problem building your EPUB; staff have been notified. ' +
            'Please try again in 24 hours.' +
            '</p>' +
            '<p class="align-right">' +
            '<button>OK</button>' +
            '</p>' +
            '</div>';

            var $notice = new Boxy(html, {
                show: true,
                modal: true,
                draggable: true,
                closeable: false,
                title: "",
                behaviours: function(r) {
                    $(r).find("button").click(function() {
                        Boxy.get(r).hide();
                    })
                }
            });
        }
		
        var run = function() {
            idx += 1;
            $.ajax({
                url : thepath,
                cache : false,
                async: false,
                success : function(data) {  
            		processed += 1;
            		
            		var log = $.trim(data).split("\n").reverse();
                    if(log.length > 0) {
                        var current = log[0].split(":");
                        //try{console.log("CURRENT =", current[0] + ' of ' + current[1]);}catch(err){}
                        if(current[0] == 'EOT') {
                            // download done, so stop
                            clearInterval(inter);
                            $content.find(".epub-meter-value").css("width", "100%");
                            setTimeout(function() {
                                $notice.hide();
                            }, 500);

                           	window.location.href=srcdl;
                            
                        } else if ( current[0] == 'ERROR' ) {

                            $notice.hide(function() {
                                show_error();
                            })

                            clearInterval(inter);
                        }else if (current[0]=='NOFILE'){
                        	nofilecount++;
                        	//try{console.log("NOFILE Count: " + nofilecount);}catch(err){}
                        	if( (nofilecount>=3 && processed > 0 && idx>5) || nofilecount>10){
                        		// error message here?
                            	clearInterval(inter);
                                $notice.hide(function(){
                                	show_error();
                                });
                                
                                window.stop();
                        	}
                        } else {
                        	nofilecount=0;//reset
                        	
                            var percent = parseInt(current[0]) / parseInt(current[1]);
                            percent = Math.ceil(percent * 100);

                            $content.find(".epub-meter-value").css('width', percent + "%");
                        }
                    }
                  },
                
                error : function(req, textStatus, errorThrown) {
                    try{console.log("FAILED: ", req, "/", textStatus, "/", errorThrown);}catch(err){}
                    if ( req.status == 404 && (idx > 5 || processed > 0) ) {
                    	clearInterval(inter);
                        $notice.hide(function(){
                        	show_error();
                        });
                    }
                }
            });
        }
        // first run is in half a millisecond
        inter = setInterval(run, 2000);
        
    },
    
    explain_epub_access : function(self) {
        var $notice = new Boxy($("#noEpubAccess").html(), {
            show: true,
            modal: true,
            draggable: true,
            closeable: false,
            clone: true,
            title: "",
            behaviours: function(r) {
                $('<p class="align-right"><button>OK</button></p>')
                    .appendTo(r)
                    .find("button").click(function() {
                        Boxy.get(r).hide();
                    })
            }
        });
    }
    
};

//depends on jQuery

$(document).ready(function() {	
    $("a#epubLink").click(function() {
		try{
			if ( $(this).attr('rel') == 'allow' ) {
			
				HT.epub_helpers.download_epub(this);
			} else {
	            HT.epub_helpers.explain_epub_access(this);
	        }
		}catch(err){
			alert(err.toString());
		}finally{
			return false;
		}
    });
});




