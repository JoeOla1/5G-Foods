/* =========================================================
   5G FOODS — SIGNUP.JS
   Handles: client-side validation, submission to backend
   ========================================================= */



document.addEventListener('DOMContentLoaded', function () {

  var form = document.getElementById('signupForm');
  var errorBox = document.getElementById('signupError');
  var successBox = document.getElementById('signupSuccess');
  if (!form) return;

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    errorBox.textContent = '';
    successBox.textContent = '';

    var fullName = document.getElementById('fullName').value.trim();
    var email = document.getElementById('email').value.trim();
    var password = document.getElementById('password').value;
    var confirmPassword = document.getElementById('confirmPassword').value;

    if (!fullName || !email || !password || !confirmPassword) {
      errorBox.textContent = 'Please fill in all fields.';
      return;
    }

    if (password.length < 6) {
      errorBox.textContent = 'Password must be at least 6 characters.';
      return;
    }

    if (password !== confirmPassword) {
      errorBox.textContent = 'Passwords do not match.';
      return;
    }

    var submitBtn = form.querySelector('button[type="submit"]');
    submitBtn.disabled = true;
    submitBtn.textContent = 'Signing up...';

    fetch(`${BACKEND_URL}/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ fullName: fullName, email: email, password: password })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Signup failed');
          return data;
        });
      })
      .then(function (data) {
        // Save the token so the user stays logged in across pages/refreshes
        localStorage.setItem('token', data.token);

        successBox.textContent = 'Account created successfully! Redirecting...';
        form.reset();
        setTimeout(function () {
          window.location.href = 'index.html';
        }, 2000);
      })
      .catch(function (err) {
        errorBox.textContent = err.message || 'Something went wrong. Please try again.';
      })
      .finally(function () {
        submitBtn.disabled = false;
        submitBtn.textContent = 'Sign Up';
      });
  });

});
