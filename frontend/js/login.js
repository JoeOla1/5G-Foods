/* =========================================================
   5G FOODS — LOGIN.JS
   Handles: client-side validation, submission to backend
   Load AFTER config.js
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('loginForm');
  if (!form) return;

  var errorBox = document.getElementById('authError') || document.getElementById('loginError');
  var successBox = document.getElementById('loginSuccess');

  function showError(message) {
    if (successBox) successBox.textContent = '';
    if (errorBox) errorBox.textContent = message;
    else alert(message);
  }

  function showSuccess(message) {
    if (errorBox) errorBox.textContent = '';
    if (successBox) successBox.textContent = message;
  }

  // If the user already has a valid session, skip the login page
  var existingToken = localStorage.getItem('token');
  if (existingToken && typeof BACKEND_URL !== 'undefined') {
    fetch(BACKEND_URL + '/me', {
      headers: { 'Authorization': 'Bearer ' + existingToken }
    })
      .then(function (res) {
        if (res.ok) window.location.href = 'index.html';
        else if (res.status === 401 || res.status === 403) localStorage.removeItem('token');
      })
      .catch(function () { /* server asleep or offline: stay on the login page */ });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    if (errorBox) errorBox.textContent = '';
    if (successBox) successBox.textContent = '';

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    if (!email || !password) {
      showError('Please fill in all fields.');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      showError('Please enter a valid email address.');
      return;
    }

    if (typeof BACKEND_URL === 'undefined') {
      showError('Something is not set up correctly. Please refresh and try again.');
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    var redirecting = false;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    fetch(BACKEND_URL + '/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: email, password: password })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Login failed');
          return data;
        });
      })
      .then(function (data) {
        // Save the token so the user stays logged in across pages/refreshes
        localStorage.setItem('token', data.token);

        redirecting = true;
        showSuccess('Login successful! Redirecting...');
        setTimeout(function () {
          window.location.href = 'index.html';
        }, 1200);
      })
      .catch(function (err) {
        showError(err.message || 'Something went wrong. Please try again.');
      })
      .finally(function () {
        // Keep the button locked while redirecting
        if (!redirecting) {
          submitBtn.disabled = false;
          submitBtn.textContent = 'Log in';
        }
      });
  });

});