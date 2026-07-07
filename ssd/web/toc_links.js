document.addEventListener('DOMContentLoaded', function () {
  document.querySelector('#mdpContentsList').addEventListener('click', function (event) {
    const link = event.target.closest('.mdpFeatureListItem a[data-section-href]');
    if (!link) return;
    event.preventDefault();
    const target = link.dataset.sectionHref;
    history.pushState(null, '', link.getAttribute('href'));
    document.getElementById(target).scrollIntoView();
    console.log('--', link.getAttribute('href'));
  });

  if (window.URL) {
    document.querySelectorAll('#mdpPage a.navigation').forEach(function (link) {
      const href = link.getAttribute('href');
      const url = new URL(link.href.replace(/;/g, '&'));
      const seq = url.searchParams.get('seq');
      link.setAttribute('href', href + `#seq${seq}`);
    });
  }
});
