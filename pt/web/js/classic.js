$(document).ready(function() {
    
    // hide section navigation submit buttons
    // $("#mdpJumpToSectionSubmit").hide();
    // $("#mdpJumpToSection").bind('change', function() {
    //     $("#mdpSectionForm").submit();
    // })

    // hide page navigation submit buttons
    // $("#mdpGotoButton").hide();
    $("#mdpPageForm").bind('submit', function() {
        var $form = $(this);
        if ( ! FormValidation($form.get(0).num, "Please enter a page number in the box.") ) {
            return false;
        }
        var num = $form.get(0).num.value;
        if ( num.substr(0, 1) == "n" ) {
            // technically a seq
            $form.get(0).seq.value = num.substr(1);
            $form.get(0).num.disabled = true;
        }
        $form.submit();
    })

    // remove the classic print button and append the bookreader icons
    // $("#btnClassicText").replaceWith($("#bookreader-toolbar-items").tmpl());
    $("#bookreader-toolbar-items").tmpl().appendTo("#mdpToolbarViews > ul").insertBefore($("#mdpPlainTextView"));
    
    // if the toolbar is disabled, punt
    if ( $("#mdpToolbar").is(".disabled") ) {
        $("#mdpToolbar")
            .click(function() { return false; });
    }
    
})