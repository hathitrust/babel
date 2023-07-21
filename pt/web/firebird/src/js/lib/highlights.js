export const extractHighlights = function (words, ocr_div) {

  function parseCoords(value) {
    var values = value.split(' ')
    return values.map((v) => parseInt(v, 10));
  }

  let matches = [];
  
  var timestamp = (new Date).getTime();
  var word_regexes = {};
  let word;
  words.forEach((word) => {
    var pattern;
    try {
      pattern = new RegExp(`(?<=^|\\P{L})(${word})(?=\\P{L}|$)`, 'igu');
    } catch (error) {
      try {
        pattern = new RegExp(`(?:^|[\\s,\\.:;"'-])${word}(?:$|[\\s,\\.:;"'-])`, 'igu');
      } catch (error) {
        pattern = new RegExp(`(?:^|[\\s,\\.:;"'-])${word}(?:$|[\\s,\\.:;"'-])`, 'ig');
      }
    }
    word_regexes[word] = pattern;
  })

  function textNodesUnder(el) {
    var n, a = [], walk = document.createTreeWalker(el, NodeFilter.SHOW_TEXT, null, false);
    while (n = walk.nextNode()) a.push(n);
    return a;
  }

  var textNodes = textNodesUnder(ocr_div);
  textNodes.forEach(function (text) {
    var innerHTML = text.nodeValue.trim();
    if (!innerHTML) { return; }

    var matched = false; var matchedWord = null;
    words.forEach(function (word) {
      // var pattern = new RegExp(`\\b(${word})\\b`, 'gi');
      // var pattern = new RegExp(`(?:^|\\s)${words[0]}(?:$|\\s)`, 'ig')
      // var pattern = new RegExp(`(?<=^|\\P{L})(${word})(?=\\P{L}|$)`, 'ig');
      var pattern = word_regexes[word];
      if (innerHTML.match(pattern)) {
        matched = true;
        matchedWord = word.toLowerCase();
      }
    })
    if (!matched) { return; }
    var span = text.parentNode;
    span.dataset.innerHTML = innerHTML;
    matches.push(span);
  })

  console.log("AHOY MATCHES", matches);
  return matches;
}