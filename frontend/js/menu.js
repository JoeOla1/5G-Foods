/* =========================================================
   5G FOODS — MENU.JS
   Fetches menu items from the backend and renders them
   dynamically into the menu grid. Wires up "Order Now"
   buttons to add items to the cart.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var menuGrid = document.getElementById('menuGrid');
  if (!menuGrid) return; // this page doesn't have a menu grid

  fetch(`${BACKEND_URL}/menu`)
    .then(function (res) {
      if (!res.ok) throw new Error('Failed to load menu');
      return res.json();
    })
    .then(function (data) {
      renderMenu(data.items);
    })
    .catch(function (err) {
      console.error(err);
      menuGrid.innerHTML = '<p>Sorry, the menu could not be loaded right now.</p>';
    });

  function renderMenu(items) {
    menuGrid.innerHTML = ''; // clear any placeholder content

    items.forEach(function (item) {
      var card = document.createElement('article');
      card.className = 'food-card fade-up';
      card.innerHTML = `
        <div class="food-card__image">
          <img src="${item.image}" alt="${item.name}" />
        </div>
        <div class="food-card__body">
          <div class="food-card__top">
            <h3 class="food-card__name">${item.name}</h3>
            <span class="food-card__price">₦${item.price.toLocaleString()}</span>
          </div>
          <p class="food-card__desc">${item.description}</p>
          <button class="btn btn--outline btn--sm order-now-btn" data-id="${item._id}">Order Now</button>
        </div>
      `;
      menuGrid.appendChild(card);
    });

    // Wire up "Order Now" buttons after they're rendered
    var orderButtons = menuGrid.querySelectorAll('.order-now-btn');
    orderButtons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var menuItemId = btn.getAttribute('data-id');

        if (typeof addToCart === 'function') {
          addToCart(menuItemId, 1);
        } else {
          console.error('addToCart function not found — is cart.js loaded?');
        }
      });
    });
  }

});