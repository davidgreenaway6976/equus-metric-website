/* Launch list signup. The form works without JavaScript (a normal POST that
   Netlify stores, then a redirect to thanks.html). This only adds an inline
   confirmation so the visitor stays on the page they were reading. */

(function () {
  var forms = document.querySelectorAll('form.signup');
  if (!forms.length) return;

  forms.forEach(function (form) {
    var email = form.querySelector('input[type="email"]');
    var consent = form.querySelector('input[name="consent"]');
    var button = form.querySelector('button[type="submit"]');
    var status = form.querySelector('.signup-status');

    function say(message, kind) {
      status.textContent = message;
      status.className = 'signup-status' + (kind ? ' is-' + kind : '');
    }

    form.addEventListener('submit', function (e) {
      // Old browsers fall back to the normal form post.
      if (!window.fetch || !window.URLSearchParams || !window.FormData) return;
      e.preventDefault();

      var address = String(email.value || '').trim();
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(address)) {
        say('Please enter a valid email address.', 'error');
        email.focus();
        return;
      }
      if (!consent.checked) {
        say('Please tick the box to say you would like to hear from us.', 'error');
        consent.focus();
        return;
      }

      button.disabled = true;
      say('Sending...');

      var body = new URLSearchParams(new FormData(form)).toString();
      fetch('/', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: body
      })
        .then(function (response) {
          if (!response.ok) throw new Error('Request failed');
          form.classList.add('is-done');
          say("Thank you. We'll email you once, when Equus Metric launches.", 'ok');
        })
        .catch(function () {
          button.disabled = false;
          say('Sorry, that did not go through. Please try again, or email support@equusmetric.com.', 'error');
        });
    });
  });
})();
