/* =========================================================
   5G FOODS — AUTH-UI.JS
   Handles: checking if user is logged in (via saved token),
   and updating the navbar to show their name + logout button
   instead of the "Login" link.
   ========================================================= */



document.addEventListener('DOMContentLoaded', function () {

  var navActions = document.getElementById('navActions');
  if (!navActions) return; // this page doesn't have the nav actions area

  var token = localStorage.getItem('token');

  if (!token) {
    // Not logged in — leave the existing Login button as-is
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
      showLoggedInState(data.user);
    })
    .catch(function () {
      // Token is expired/invalid — clear it and leave Login button as-is
      localStorage.removeItem('token');
    });

  function showLoggedInState(user) {
    // Find the existing "Login" link and replace it with name + logout
    var loginLink = navActions.querySelector('a[href="login.html"]');
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
