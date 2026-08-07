document.getElementById('action-modal-button-0-1').addEventListener('click', (event) => {
  console.log('YEP, you clicked the button');
  event.preventDefault();
  document.getElementById('step-1').classList.replace('d-block', 'd-none');
  document.getElementById('step-2').classList.replace('d-none', 'd-block');
});

document.querySelectorAll('button[data-action="action-copy"]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();

    let el = document.querySelector('#' + button.dataset.for);
    console.log('??', button, button.dataset.for, el);

    let inputEl = document.createElement('textarea');
    // inputEl.type = 'text';
    inputEl.classList.add('sr-only');
    inputEl.value = el.innerText;
    document.body.appendChild(inputEl);
    inputEl.select();
    document.execCommand('copy');

    document.querySelector('#' + button.dataset.for + '-success').style.display = 'block';
  });
});
