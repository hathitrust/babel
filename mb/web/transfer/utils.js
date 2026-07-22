document.querySelectorAll('button[data-micromodal-close]').forEach((button) => {
  button.addEventListener('click', (event) => {
    event.preventDefault();
    let referer = document.querySelector('input[name="referer"]').value;
    location.href = referer;
  });
});
