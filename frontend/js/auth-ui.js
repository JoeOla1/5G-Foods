/* =========================================================
   5G FOODS — AUTH-UI.JS
   Handles: checking if user is logged in (via saved token),
   and updating the navbar to show their name + logout button
   instead of the "Login" link.
   Load AFTER config.js on every page that has the navbar.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var navActions = document.getElementById('navActions');
  var mobileNavActions = document.getElementById('mobileNavActions');

  if (!navActions && !mobileNavActions) return; // this page has no nav actions areas

  var token = localStorage.getItem('token');
  if (!token) return; // Not logged in — leave the Login link as-is

  if (typeof BACKEND_URL === 'undefined') {
    console.warn('auth-ui.js: BACKEND_URL is missing. Load js/config.js before auth-ui.js.');
    return;
  }

  // We have a token — check with the backend that it's still valid
  fetch(BACKEND_URL + '/me', {
    method: 'GET',
    headers: { 'Authorization': 'Bearer ' + token }
  })
    .then(function (res) {
      if (res.status === 401 || res.status === 403) {
        // Server says the token is expired/invalid — clear it
        localStorage.removeItem('token');
        throw new Error('Invalid session');
      }
      if (!res.ok) throw new Error('Server error');
      return res.json();
    })
    .then(function (data) {
      if (!data || !data.user) return;
      if (navActions) showLoggedInState(navActions, data.user);
      if (mobileNavActions) showLoggedInState(mobileNavActions, data.user);
    })
    .catch(function () {
      // Network error or server asleep: leave the Login link showing.
      // The token is only removed above when the server rejects it.
    });

  function showLoggedInState(container, user) {
    // Find the existing "Login" link and replace it with name + logout
    var loginLink = container.querySelector('a[href="login.html"]');
    if (!loginLink) return;

    var firstName = user.fullName ? user.fullName.split(' ')[0] : 'Account';

    var userSpan = document.createElement('span');
    userSpan.className = 'navbar__user';
    userSpan.textContent = 'Hi, ' + firstName;

    var logoutBtn = document.createElement('a');
    logoutBtn.href = '#';
    logoutBtn.className = 'nav__logout';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });

    loginLink.replaceWith(userSpan, logoutBtn);
  }

});