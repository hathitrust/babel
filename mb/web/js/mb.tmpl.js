(function($){

  var srcToName = function(name){
    return name
    .replace(/\.\w+?$/, "")
    .replace(/(\/|_)/, "-");
  };

  var appendTemplate = function(src, html){
    var template = $("<script />");
    template.attr({
      type: "text/x-template",
      id:   srcToName(src) + "-template"
    });
    template.html(html);
    $("head").append(template);
  };

  $.loadTemplate = function(src, name){
    $.ajax({url: src, async: false, dataType: "html"})
      .success(function(result){
        appendTemplate(name || src, result);
      });
    return this;
  };

})(jQuery);