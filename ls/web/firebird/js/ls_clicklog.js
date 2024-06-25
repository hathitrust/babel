//global data
var container = document.querySelector('.results-container');
var gd = JSON.parse(container.dataset.gdata);

// logger url
var loggerUrl = container.dataset.loggerUrl;

container.addEventListener('click', function(event) {
	if (event.target.matches('.resource-access-container a')) {
		handle_click(event);
	} else if (event.target.matches('.resource-access-container a *')) {
		handle_child_click(event);
	}
});

//logs right click context menu, might not open in new window/tab but best we can do
container.addEventListener('contextmenu', function(event) {
	if(event.target.matches('.resource-access-container a')) {
		handle_context_menu(event);
	} else if (event.target.matches('.resource-access-container a *')) {
		handle_child_context_menu(event);
	}
});

// the context menu clicks are currently being recorded as regular clicks
// and I don't know why but I'm not sure it matters
function handle_context_menu(e) {
  var target = e.target;
  var clicktype = target.getAttribute('data-clicktype');
  var clickdata = JSON.parse(target.getAttribute('data-clickdata'));
  var item_data = Object.assign({}, { click_type: 'context_menu', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd });

  fetch(loggerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'clicked=' + msg,
  })
//    .then((response) => response.text())
//    .then((text) => console.log(text))
    .catch((error) => console.error('Error:', error));
}
function handle_child_context_menu(e) {
  var target = e.target;
  var clicktype = target.parentElement.getAttribute('data-clicktype');
  var clickdata = JSON.parse(target.parentElement.getAttribute('data-clickdata'));
  var item_data = Object.assign({}, { click_type: 'context_menu', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd });

  fetch(loggerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'clicked=' + msg,
  })
//    .then((response) => response.text())
//    .then((text) => console.log(text))
    .catch((error) => console.error('Error:', error));
}
function handle_click(e) {
  var target = e.target;
  var clicktype = target.getAttribute('data-clicktype');
  var clickdata = JSON.parse(target.getAttribute('data-clickdata'));

  var item_data = Object.assign({}, { click_type: 'click', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd });

  fetch(loggerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'clicked=' + msg,
  })
 //   .then((response) => response.text())
 //   .then((text) => console.log(text))
    .catch((error) => console.error('Error:', error));
}
function handle_child_click(e) {
  var target = e.target;
  var clicktype = target.parentElement.getAttribute('data-clicktype');
  var clickdata = JSON.parse(target.parentElement.getAttribute('data-clickdata'));
  var item_data = Object.assign({}, { click_type: 'click', type: clicktype }, clickdata);
  var msg = JSON.stringify({ item: item_data, global: gd });

  fetch(loggerUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'clicked=' + msg,
  })
 //   .then((response) => response.text())
 //   .then((text) => console.log(text))
    .catch((error) => console.error('Error:', error));
}
