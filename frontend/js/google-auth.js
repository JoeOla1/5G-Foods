/* =========================================================
   5G FOODS — GOOGLE-AUTH.JS
   Handles: "Continue with Google" button using Google
   Identity Services (GSI). Sends the returned ID token to
   the backend for verification.

   SETUP REQUIRED:
   1. Go to https://console.cloud.google.com/apis/credentials
   2. Create an OAuth 2.0 Client ID (type: Web application)
   3. Add your site's URL (e.g. http://localhost:5500 or your
      live domain) under "Authorized JavaScript origins"
   4. Paste the Client ID below in place of YOUR_GOOGLE_CLIENT_ID
   ========================================================= */

const GOOGLE_CLIENT_ID = "963467298379-vfm1r14822rm8gg9sl3b51lf0knn5dil.apps.googleusercontent.com";

document.addEventListener('DOMContentLoaded', function () {

  var googleButtonContainer = document.getElementById('googleButtonContainer');
  if (!googleButtonContainer) return;

  // Wait for the Google script to be ready before initializing
  function initGoogle() {
    if (typeof google === 'undefined' || !google.accounts) {
      // Google script hasn't loaded yet, retry shortly
      setTimeout(initGoogle, 200);
      return;
    }

    google.accounts.id.initialize({
      client_id: GOOGLE_CLIENT_ID,
      callback: handleGoogleResponse
    });

    google.accounts.id.renderButton(
      googleButtonContainer,
      { theme: "outline", size: "large", width: 280 }
);
  }

  function handleGoogleResponse(response) {
    // response.credential is a JWT ID token — send it to the backend
    // so it can verify it with Google and create/login the user.
    fetch('http://localhost:5000/google-auth', {
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
      .then(function () {
        window.location.href = 'index.html';
      })
      .catch(function (err) {
        var errorBox = document.getElementById('signupError');
        if (errorBox) {
          errorBox.textContent = err.message || 'Google sign-in failed. Please try again.';
        } else {
          alert(err.message || 'Google sign-in failed. Please try again.');
        }
      });
  }

  initGoogle();
});
