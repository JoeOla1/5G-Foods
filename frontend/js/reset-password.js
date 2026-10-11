/* =========================================================
   5G FOODS — RESET-PASSWORD.JS
   Handles: reading the token from the emailed link and
   sending the new password to the backend.
   Load AFTER config.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var resetView = document.getElementById('resetView');
  var invalidView = document.getElementById('invalidView');
  var doneView = document.getElementById('doneView');
  var form = document.getElementById('resetForm');
  var passwordInput = document.getElementById('password');
  var confirmInput = document.getElementById('confirmPassword');
  var errorBox = document.getElementById('resetError');
  var submitBtn = document.getElementById('resetBtn');

  if (!form) return;

  // The token comes from the link: reset-password.html?token=...
  var token = new URLSearchParams(window.location.search).get('token');

  if (!token) {
    invalidView.hidden = false;
    return;
  }

  resetView.hidden = false;

  // ----- Show / hide password buttons -----
  var toggles = document.querySelectorAll('.field__toggle');
  toggles.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var input = document.getElementById(btn.getAttribute('data-target'));
      if (!input) return;
      var show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      btn.textContent = show ? 'Hide' : 'Show';
      btn.setAttribute('aria-pressed', String(show));
      btn.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
  });

  // ----- Submit the new password -----
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.textContent = '';

    var password = passwordInput.value;
    var confirm = confirmInput.value;

    if (!password || !confirm) {
      errorBox.textContent = 'Please fill in both fields.';
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = 'Password must be at least 6 characters.';
      return;
    }

    if (password !== confirm) {
      errorBox.textContent = "The two passwords don't match.";
      return;
    }

    if (typeof BACKEND_URL === 'undefined') {
      errorBox.textContent = 'Something is not set up correctly. Please refresh and try again.';
      return;
    }

    var done = false;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Updating...';

    fetch(BACKEND_URL + '/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token, password: password })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) {
            var err = new Error(data.message || 'Something went wrong. Please try again.');
            err.expired = /invalid or has expired/i.test(err.message);
            throw err;
          }
          return data;
        });
      })
      .then(function () {
        done = true;
        resetView.hidden = true;
        doneView.hidden = false;
        setTimeout(function () {
          window.location.href = 'login.html';
        }, 2500);
      })
      .catch(function (err) {
        if (err.expired) {
          resetView.hidden = true;
          invalidView.hidden = false;
        } else if (err.name === 'TypeError') {
          errorBox.textContent = "Couldn't reach the server. It may be waking up, so please try again in a moment.";
        } else {
          errorBox.textContent = err.message || 'Something went wrong. Please try again.';
        }
      })
      .finally(function () {
        if (!done) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Update password';
        }
      });
  });

});