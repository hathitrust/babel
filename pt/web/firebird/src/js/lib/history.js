let url;
let searchParams;
export function updateHistory(options) {
  console.log('update history!');
  if (!url) {
    url = new URL(location.href.replace(/;/g, '&'));
    searchParams = new URLSearchParams(url.searchParams);
  }

  Object.keys(options).forEach((param) => {
    if (options[param]) {
      searchParams.set(param, options[param]);
    } else {
      searchParams.delete(param);
    }
  });

  if (searchParams.get('format') == 'image') {
    searchParams.delete('format');
  }

  let title = document.title;
  if (options.seq) {
    // remove any ownerid parameters
    searchParams.delete('ownerid');
    title = `#${options.seq} - ${document.documentElement.dataset.originalTitle}`;
  }

  url.search = decodeURIComponent(searchParams.toString());

  window.history.replaceState(title, document.title, url.toString());
  document.title = title;
}
