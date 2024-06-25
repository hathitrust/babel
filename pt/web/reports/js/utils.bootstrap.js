var $report = $("#report");
var $ths = $report.find("th");
var $tbody = $report.find("tbody");
var $form = $("form");
var data = [];

var report_keys = []; var report_columns = [];
$ths.each(function(_, th) { 
  var key = $(th).text();
  report_keys.push(key);
  var config = { field: key, title: key };
  // if ( key == 'title' || key == 'imprint' ) {
  // }
  // if ( key == 'datetime' ) {
  // }
  report_columns.push(config);
})

var report = $("html").data('report');

var bst;
var fetch_data = function(params) {
  $("#report").bootstrapTable({
    url: '/cgi/pt/reports/api/' + report,
    pagination: true,
    search: true,
    export: true,
    strictSearch: false,
    filterControl: true,
    showSearchClearButton: true,
    dateRangeFilter: true,
    exportDataType: 'all',
    exportTypes: [ 'json', 'csv', 'tsv', 'excel' ],
    columns: report_columns
  });
  bst = $report.data('bootstrap.table');


  // $report.on('search', function() {
  //   console.log("AHOY")
  // })

  setTimeout(function() {
    $(".fixed-table-toolbar .columns-right").append($("#action-copy"));
    $("#action-copy").removeClass("hidden");
  }, 100);
}

fetch_data({});

var clipboard_copy = function() {
  var rows = [];
  rows.push(report_keys.join("\t"));

  var data = $report.bootstrapTable('getData');
  for(var datum of data) {
    var row = [];
    report_keys.forEach(function(key) {
      row.push(datum[key]);
    })
    rows.push(row.join("\t"));
  }

  // var blob = new Blob(rows, { type: 'text/plain' });
  navigator.clipboard.writeText(rows.join("\n")).then(function() {
    console.log("Copied to clipboard successfully!");
    alert("Copied to clipboard!");
  }, function(e) {
    console.error("Unable to write to clipboard. :-(", e);
  });
}

$("#action-copy").on('click', clipboard_copy);
