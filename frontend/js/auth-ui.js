/* =========================================================
   5G FOODS — AUTH-UI.JS
   Handles: checking if user is logged in (via saved token),
   and updating the navbar to show their name + logout button
   instead of the "Login" link.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var navActions = document.getElementById('navActions');
  var mobileNavActions = document.getElementById('mobileNavActions');

  if (!navActions && !mobileNavActions) return; // this page has no nav actions areas

  var token = localStorage.getItem('token');

  if (!token) {
    // Not logged in — leave the existing Login links as-is
    return;
  }

  // We have a token — check with the backend that it's still valid
  fetch(`${BACKEND_URL}/me`, {
    method: 'GET',
    headers: {
      'Authorization': 'Bearer ' + token
    }
  })
    .then(function (res) {
      if (!res.ok) throw new Error('Invalid session');
      return res.json();
    })
    .then(function (data) {
      if (navActions) showLoggedInState(navActions, data.user);
      if (mobileNavActions) showLoggedInState(mobileNavActions, data.user);
    })
    .catch(function () {
      // Token is expired/invalid — clear it and leave Login button as-is
      localStorage.removeItem('token');
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
    logoutBtn.className = 'btn btn--ghost';
    logoutBtn.textContent = 'Logout';
    logoutBtn.addEventListener('click', function (e) {
      e.preventDefault();
      localStorage.removeItem('token');
      window.location.href = 'index.html';
    });

    loginLink.replaceWith(userSpan, logoutBtn);
  }

});