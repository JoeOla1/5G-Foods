/* =========================================================
   5G FOODS — FORGOT-PASSWORD.JS
   Handles: asking the backend to email a password reset link.
   Load AFTER config.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var requestView = document.getElementById('requestView');
  var sentView = document.getElementById('sentView');
  var form = document.getElementById('forgotForm');
  var emailInput = document.getElementById('email');
  var errorBox = document.getElementById('forgotError');
  var submitBtn = document.getElementById('forgotBtn');
  var sentEmail = document.getElementById('sentEmail');
  var resendBtn = document.getElementById('resendBtn');
  var resendError = document.getElementById('resendError');
  var changeEmailBtn = document.getElementById('changeEmailBtn');

  if (!form) return;

  var lastEmail = '';
  var cooldownTimer = null;
  var COOLDOWN_SECONDS = 60;

  function requestLink(email) {
    if (typeof BACKEND_URL === 'undefined') {
      return Promise.reject(new Error('Something is not set up correctly. Please refresh and try again.'));
    }

    return fetch(BACKEND_URL + '/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email })
    })
      .then(function (res) {
        return res.json().catch(function () { return {}; }).then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Something went wrong. Please try again.');
          return data;
        });
      });
  }

  function friendlyError(err) {
    // fetch() throws a TypeError when the server can't be reached at all
    if (err && err.name === 'TypeError') {
      return "Couldn't reach the server. It may be waking up, so please try again in a moment.";
    }
    return (err && err.message) || 'Something went wrong. Please try again.';
  }

  function startCooldown(seconds) {
    clearInterval(cooldownTimer);
    var left = seconds;
    resendBtn.disabled = true;
    resendBtn.textContent = 'Resend in ' + left + 's';

    cooldownTimer = setInterval(function () {
      left--;
      if (left <= 0) {
        clearInterval(cooldownTimer);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend email';
      } else {
        resendBtn.textContent = 'Resend in ' + left + 's';
      }
    }, 1000);
  }

  function showSent(email) {
    lastEmail = email;
    sentEmail.textContent = email;
    resendError.textContent = '';
    requestView.hidden = true;
    sentView.hidden = false;
    startCooldown(COOLDOWN_SECONDS);
  }

  // ----- Submit the email -----
  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.textContent = '';

    var email = emailInput.value.trim();

    if (!email) {
      errorBox.textContent = 'Please enter your email.';
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errorBox.textContent = 'Please enter a valid email address.';
      return;
    }

    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending...';

    requestLink(email)
      .then(function () {
        showSent(email);
      })
      .catch(function (err) {
        errorBox.textContent = friendlyError(err);
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Send reset link';
      });
  });

  // ----- Resend -----
  resendBtn.addEventListener('click', function () {
    resendError.textContent = '';
    resendBtn.disabled = true;
    resendBtn.textContent = 'Sending...';

    requestLink(lastEmail)
      .then(function () {
        startCooldown(COOLDOWN_SECONDS);
      })
      .catch(function (err) {
        resendError.textContent = friendlyError(err);
        resendBtn.disabled = false;
        resendBtn.textContent = 'Resend email';
      });
  });

  // ----- Go back and use another email -----
  changeEmailBtn.addEventListener('click', function () {
    clearInterval(cooldownTimer);
    sentView.hidden = true;
    requestView.hidden = false;
    emailInput.value = '';
    emailInput.focus();
  });

});