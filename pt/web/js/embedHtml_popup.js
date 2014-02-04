// supply method for creating an embeddable URL
head.ready(function() {

    var side_short = "450";
    var side_long  = "700";
    var htId = HT.params.id;

    var codeblock_txt_a = function(w,h) {
        return '<iframe width="' + w + '" height="' + h + '" '; 
    }
    var codeblock_txt_b = 'src="http://hdl.handle.net/2027/' + htId + 
        '?urlappend=%3Bui=embed"></iframe>';

    var $block = $(
	'<div class="embedUrlContainer">' +
        '<h3>Embed This Book</h3>' +
	'<a id="embedIcon" default-form="data-default-form" href="http://www.hathitrust.org/embed" target="_blank">Help</a>' +
        '<form>' + 
        '    <span class="help-block">Copy the code below and paste it into the HTML of any website or blog.</span>' +
        '    <label for="codeblock" class="offscreen">Code Block</label>' +
        '    <textarea class="input-xlarge" id="codeblock" name="codeblock" rows="3" readonly="readonly">' +
        codeblock_txt_a(side_short, side_long) + codeblock_txt_b + '</textarea>' + 
        '<div class="controls">' + 
            '<label class="radio inline">' +
                '<input type="radio" name="view" id="edit-view-0" value="0" checked="checked" > <span class="icomoon-scroll"/> Scroll View ' +
            '</label>' + 
            '<label class="radio inline">' +
                '<input type="radio" name="view" id="edit-view-1" value="1" > <span class="icomoon-book-alt2"/> Flip View ' +
            '</label>' +
        '</div>' +
        '</form>' +
	'</div>'
    );


    $("#embedHtml").click(function(e) {
        e.preventDefault();
        bootbox.dialog($block, [
            {
                "label" : "Cancel",
                "class" : "btn-dismiss"
            }
        ]);

        var textarea = $block.find("textarea[name=codeblock]");
	textarea.on("click", function () {
	    $(this).select();
	});

        $('input:radio[id="edit-view-0"]').click(function () {
	    codeblock_txt = codeblock_txt_a(side_short, side_long) + codeblock_txt_b; 
            textarea.val(codeblock_txt);
        });
        $('input:radio[id="edit-view-1"]').click(function () {
	    codeblock_txt = codeblock_txt_a(side_long, side_short) + codeblock_txt_b; 
            textarea.val(codeblock_txt);
        });
    });
});

