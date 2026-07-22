/* =========================================================
   5G FOODS — LOGIN.JS
   Handles: client-side validation, submission to backend
   ========================================================= */



document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('loginForm');
  var errorBox = document.getElementById('loginError');
  var successBox = document.getElementById('loginSuccess');

  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.textContent = '';
    successBox.textContent = '';

    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;

    if (!email || !password) {
      errorBox.textContent = 'Please fill in all fields.';
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Logging in...';

    fetch(`${BACKEND_URL}/login`, {
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

        successBox.textContent = 'Login successful! Redirecting...';
        setTimeout(function () {
          window.location.href = 'index.html';
        }, 2000);
      })
      .catch(function (err) {
        errorBox.textContent = err.message || 'Something went wrong. Please try again.';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Login';
      });
  });

});
