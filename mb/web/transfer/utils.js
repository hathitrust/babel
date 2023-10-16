document.querySelectorAll('button[data-micromodal-close]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    let referer = document.querySelector('input[name="referer"]').value;
    location.href = referer;
  })
})

  document.querySelectorAll('button[data-action="action-copy"]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();

    let el = document.querySelector('#' + button.dataset.for);
    console.log("??", button, button.dataset.for, el);

    let inputEl = document.createElement('textarea');
    // inputEl.type = 'text';
    inputEl.classList.add('sr-only');
    inputEl.value = el.innerText;
    document.body.appendChild(inputEl);
    inputEl.select();
    document.execCommand('copy');

    document.querySelector('#' + button.dataset.for + '-success').style.display = 'block';
  })
})
