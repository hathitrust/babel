head.ready(function() {
    var $div = $(".bibLinks");
    var $p = $div.find("p:first");
    $p.find("span:empty").each(function() {
        // $(this).text($(this).attr("content")).addClass("blocked");
        var fragment = '<span class="blocked"><strong>{label}:</strong> {content}</span>';
        fragment = fragment.replace('{label}', $(this).attr('property').substr(3)).replace('{content}', $(this).attr("content"));
        $p.append(fragment);
    })    
})