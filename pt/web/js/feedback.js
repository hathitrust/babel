// supply method for feedback system
var HT = HT || {};
HT.feedback = {};
HT.feedback.dialog = function() {
    var html = 
        '<form>' + 
        '    <fieldset>' + 
        '        <legend>Email Address</legend>' +
        '        <label for="email" class="offscreen">EMail Address</label>' +
        '        <input type="text" class="input-xlarge" placeholder="[Your email address]" name="email" id="email" />' + 
        '        <span class="help-block">We will make every effort to address copyright issues by the next business day after notification.</span>' +
        '    </fieldset>' + 
        '    <fieldset>' + 
        '        <legend>Overall page readability and quality</legend>' + 
        '        <label class="radio">' + 
        '            <input type="radio" name="Quality" value="readable" />' + 
        '            Few problems, entire page is readable' + 
        '        </label>' + 
        '        <label class="radio">' + 
        '            <input type="radio" name="Quality" value="someproblems" />' + 
        '            Some problems, but still readable' + 
        '        </label>' + 
        '        <label class="radio">' + 
        '            <input type="radio" name="Quality" value="difficult" />' + 
        '            Significant problems, difficult or impossible to read' + 
        '        </label>' + 
        '    </fieldset>' + 
        '    <fieldset>' + 
        '        <legend>Specific page image problems?</legend>' + 
        '        <label class="checkbox">' + 
        '            <input type="checkbox" name="missing" value="1" />' + 
        '            Missing parts of the page' + 
        '        </label>' + 
        '        <label class="checkbox">' + 
        '            <input type="checkbox" name="blurry" value="1" />' + 
        '            Blurry text' + 
        '        </label>' + 
        '        <label class="checkbox">' + 
        '            <input type="checkbox" name="curved" value="1" />' + 
        '            Curved or distorted text' + 
        '        </label>' + 
        '        <label>Other problem <input type="text" class="input-medium" name="other" value="" /></label>' + 
        '    </fieldset>' + 
        '    <fieldset>' + 
        '        <legend>Problems with access rights?</legend>' + 
        '        <span class="help-block"><strong>' + 
        '            (See also: <a href="http://www.hathitrust.org/take_down_policy" target="_blank">take-down policy</a>)' + 
        '        </strong></span>' + 
        '        <label class="radio">' + 
        '            <input type="radio" name="Rights" value="noaccess" />' + 
        '            This item is in the public domain, but I don\'t have access to it.' + 
        '        </label>' + 
        '        <label class="radio">' + 
        '            <input type="radio" name="Rights" value="access" />' + 
        '            I have access to this item, but should not.' + 
        '        </label>' + 
        '    </fieldset>' + 
        '    <p>' + 
        '        <label for="comments">Other problems or comments?</label>' + 
        '        <textarea id="comments" name="comments" rows="3"></textarea>' + 
        '    </p>' + 
        '</form>';

    var $form = $(html);

    // hidden fields
    $("<input type='hidden' name='SysID' />").val(HT.params.id).appendTo($form);
    $("<input type='hidden' name='RecordURL' />").val(HT.params.RecordURL).appendTo($form);

    if ( HT.reader ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.reader.getCurrentSeq()).appendTo($form);
    } else if ( HT.params.seq ) {
        $("<input type='hidden' name='SeqNo' />").val(HT.params.seq).appendTo($form);
    }
    $("<input type='hidden' name='view' />").val(HT.params.view).appendTo($form);

    if ( HT.crms_state ) {
        $form.find("#email").val(HT.crms_state);
    }


    return $form;
};