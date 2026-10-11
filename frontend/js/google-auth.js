/* =========================================================
   5G FOODS — GOOGLE-AUTH.JS
   Handles: "Continue with Google" button using Google
   Identity Services (GSI). Sends the returned ID token to
   the backend for verification.

   Container: <div id="googleButtonContainer"></div>
   Optional:  data-google-style="icon"  -> round Google icon button
              (leave it off for the wide "Sign in with Google" button)
   ========================================================= */

const GOOGLE_CLIENT_ID = "963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com";

document.addEventListener('DOMContentLoaded', function () {

  var googleButtonContainer = document.getElementById('googleButtonContainer');
  if (!googleButtonContainer) return;

  var attempts = 0;

  // Wait for the Google script to be ready before initializing
  function initGoogle() {
    if (typeof google === 'undefined' || !google.accounts) {
      attempts++;
      if (attempts > 50) { // ~10 seconds, then give up
        console.warn('google-auth.js: Google script failed to load.');
        return;
      }
      setTimeout(initGoogle, 200);
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });

    var useIcon = googleButtonContainer.getAttribute('data-google-style') === 'icon';

    var buttonOptions = useIcon
      ? { type: "icon", shape: "circle", theme: "filled_black", size: "large" }
      : { theme: "outline", size: "large", width: 280 };

    google.accounts.id.renderButton(googleButtonContainer, buttonOptions);
  }

  function showError(message) {
    // Works on both pages: login (authError) and signup (signupError)
    var errorBox =
      document.getElementById('authError') ||
      document.getElementById('loginError') ||
      document.getElementById('signupError');

    if (errorBox) {
      errorBox.textContent = message;
    } else {
      alert(message);
    }
  }

  function handleGoogleResponse(response) {
    // response.credential is a JWT ID token — send it to the backend
    // so it can verify it with Google and create/login the user.
    fetch(BACKEND_URL + '/google-auth', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: response.credential })
    })
      .then(function (res) {
        return res.json().then(function (data) {
          if (!res.ok) throw new Error(data.message || 'Google sign-in failed');
          return data;
        });
      })
      .then(function (data) {
        // Save the token so the user stays logged in across pages/refreshes
        localStorage.setItem('token', data.token);
        window.location.href = 'index.html';
      })
      .catch(function (err) {
        showError(err.message || 'Google sign-in failed. Please try again.');
      });
  }

  initGoogle();
});