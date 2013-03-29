head.ready(function() {

    var $selects = $("select[name=sz],select[name=sort]");
    $selects.each(function() {
        init_select(this);
    })

    function init_select(select) {
        select.changed = false;
        select.onfocus = select_focused;
        select.onchange = select_changed;
        select.onkeydown = select_keyed;
        select.onclick = select_clicked;

        return true;
    }

    function select_changed(el) {
        var select;
        if ( el && el.value ) {
            select = el;
        } else {
            select = this;
        }

        if ( select.changed || select.value != select.initValue ) {
            // https://roger-full.babel.hathitrust.org/cgi/mb?c=594541169&pn=1&sort=title_a&sort=date_d&sz=25&c2=0&a=&sz=25&sz=25
            var target_url = window.location.href;
            var name = select.name;
            var re = new RegExp(';?' + name + '=([^;&]+);?', 'g');
            target_url = target_url.replace(re, "");
            target_url += ";" + name + "=" + select.value;
            window.location.href = target_url;
        }

        return false;
    }

    function select_clicked() {
        this.changed = true;
    }

    function select_focused() {
        this.initValue = this.value;
        return true;
    }

    function select_keyed(e) {
        var theEvent;
        var keyCodeTab = "9";
        var keyCodeEnter = "13";
        var keyCodeEsc = "27";
        
        if (e)
        {
            theEvent = e;
        }
        else
        {
            theEvent = event;
        }

        if ((theEvent.keyCode == keyCodeEnter || theEvent.keyCode == keyCodeTab) && this.value != this.initValue)
        {
            this.changed = true;
            selectChanged(this);
        }
        else if (theEvent.keyCode == keyCodeEsc)
        {
            this.value = this.initValue;
        }
        else
        {
            this.changed = false;
        }
        
        return true;        
    }


});