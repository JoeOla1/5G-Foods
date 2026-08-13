/* =========================================================
   5G FOODS — CART.JS
   Handles: adding items to cart, rendering the cart drawer,
   updating/removing quantities, and keeping the cart count
   badge in sync. Cart is tied to the logged-in user (JWT).
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var cartDrawer = document.getElementById('cartDrawer');
  var cartDrawerOverlay = document.getElementById('cartDrawerOverlay');
  var cartDrawerClose = document.getElementById('cartDrawerClose');
  var cartDrawerItems = document.getElementById('cartDrawerItems');
  var cartTotal = document.getElementById('cartTotal');
  var cartIconBtn = document.getElementById('cartIconBtn');
  var cartIconBtnMobile = document.getElementById('cartIconBtnMobile');
  var cartCount = document.getElementById('cartCount');
  var cartCountMobile = document.getElementById('cartCountMobile');
  var cartCheckoutBtn = document.getElementById('cartCheckoutBtn');

  // Load the cart badge count on every page load (if logged in)
  refreshCartCount();

  // ---------- OPEN / CLOSE DRAWER ----------
  function openDrawer() {
    var token = localStorage.getItem('token');
    if (!token) {
      window.location.href = 'login.html';
      return;
    }
    cartDrawer.classList.add('is-open');
    loadCart();
  }

  function closeDrawer() {
    cartDrawer.classList.remove('is-open');
  }

  if (cartIconBtn) cartIconBtn.addEventListener('click', openDrawer);
  if (cartIconBtnMobile) cartIconBtnMobile.addEventListener('click', openDrawer);
  if (cartDrawerClose) cartDrawerClose.addEventListener('click', closeDrawer);
  if (cartDrawerOverlay) cartDrawerOverlay.addEventListener('click', closeDrawer);

  // ---------- ADD TO CART (called from menu.js) ----------
  window.addToCart = function (menuItemId, quantity) {
    var token = localStorage.getItem('token');

    if (!token) {
      window.location.href = 'login.html';
      return;
    }

    fetch(`${BACKEND_URL}/cart/add`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ menuItemId: menuItemId, quantity: quantity }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to add to cart');
        return res.json();
      })
      .then(function (data) {
        renderCart(data.cart);
        cartDrawer.classList.add('is-open');
      })
      .catch(function (err) {
        console.error(err);
      });
  };

  // ---------- LOAD CART ----------
  function loadCart() {
    var token = localStorage.getItem('token');
    if (!token) return;

    cartDrawerItems.innerHTML = '<p class="cart-drawer__empty">Loading...</p>';

    fetch(`${BACKEND_URL}/cart`, {
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(function (data) {
        renderCart(data.cart);
      })
      .catch(function (err) {
        console.error(err);
        cartDrawerItems.innerHTML = '<p class="cart-drawer__empty">Could not load cart.</p>';
      });
  }

  // ---------- REFRESH CART COUNT BADGE ----------
  function refreshCartCount() {
    var token = localStorage.getItem('token');
    if (!token) return;

    fetch(`${BACKEND_URL}/cart`, {
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(function (data) {
        updateCountBadge(data.cart);
      })
      .catch(function () {
        // silently ignore — user might not be logged in or token expired
      });
  }

  function updateCountBadge(cart) {
    var totalQty = cart.items.reduce(function (sum, item) {
      return sum + item.quantity;
    }, 0);

    if (cartCount) cartCount.textContent = totalQty;
    if (cartCountMobile) cartCountMobile.textContent = totalQty;
  }

  // ---------- RENDER CART DRAWER ----------
  function renderCart(cart) {
    updateCountBadge(cart);

    if (!cart.items.length) {
      cartDrawerItems.innerHTML = '<p class="cart-drawer__empty">Your cart is empty.</p>';
      cartTotal.textContent = '₦0';
      return;
    }

    var total = 0;
    cartDrawerItems.innerHTML = '';

    cart.items.forEach(function (item) {
      var menuItem = item.menuItem;
      var lineTotal = menuItem.price * item.quantity;
      total += lineTotal;

      var row = document.createElement('div');
      row.className = 'cart-drawer__item';
      row.innerHTML = `
        <img src="${menuItem.image}" alt="${menuItem.name}" class="cart-drawer__item-img" />
        <div class="cart-drawer__item-info">
          <h4>${menuItem.name}</h4>
          <span>₦${menuItem.price.toLocaleString()}</span>
        </div>
        <div class="cart-drawer__item-qty">
          <button class="qty-btn qty-decrease" data-id="${menuItem._id}">&minus;</button>
          <span>${item.quantity}</span>
          <button class="qty-btn qty-increase" data-id="${menuItem._id}">&plus;</button>
        </div>
        <button class="cart-drawer__item-remove" data-id="${menuItem._id}" aria-label="Remove item">&times;</button>
      `;
      cartDrawerItems.appendChild(row);
    });

    cartTotal.textContent = '₦' + total.toLocaleString();

    // Wire up quantity + remove buttons
    cartDrawerItems.querySelectorAll('.qty-increase').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var currentItem = cart.items.find((i) => i.menuItem._id === id);
        updateQuantity(id, currentItem.quantity + 1);
      });
    });

    cartDrawerItems.querySelectorAll('.qty-decrease').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        var currentItem = cart.items.find((i) => i.menuItem._id === id);
        updateQuantity(id, currentItem.quantity - 1); // 0 removes it (handled by backend)
      });
    });

    cartDrawerItems.querySelectorAll('.cart-drawer__item-remove').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var id = btn.getAttribute('data-id');
        removeItem(id);
      });
    });
  }

  // ---------- UPDATE QUANTITY ----------
  function updateQuantity(menuItemId, quantity) {
    var token = localStorage.getItem('token');

    fetch(`${BACKEND_URL}/cart/update`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ menuItemId: menuItemId, quantity: quantity }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to update cart');
        return res.json();
      })
      .then(function (data) {
        renderCart(data.cart);
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  // ---------- REMOVE ITEM ----------
  function removeItem(menuItemId) {
    var token = localStorage.getItem('token');

    fetch(`${BACKEND_URL}/cart/remove/${menuItemId}`, {
      method: 'DELETE',
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to remove item');
        return res.json();
      })
      .then(function (data) {
        renderCart(data.cart);
      })
      .catch(function (err) {
        console.error(err);
      });
  }

  // ---------- CHECKOUT (placeholder for now) ----------
  if (cartCheckoutBtn) {
    cartCheckoutBtn.addEventListener('click', function () {
      window.location.href = 'checkout.html'; // we'll build this page next
    });
  }

});