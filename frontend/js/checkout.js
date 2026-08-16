/* =========================================================
   5G FOODS — CHECKOUT.JS
   Loads the cart, renders order summary, and triggers
   Paystack Inline payment popup.
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  var checkoutItems = document.getElementById('checkoutItems');
  var checkoutTotal = document.getElementById('checkoutTotal');
  var checkoutForm = document.getElementById('checkoutForm');
  var payNowBtn = document.getElementById('payNowBtn');

  var PAYSTACK_PUBLIC_KEY = 'pk_test_04dd71d5ea224ecf99ccc04bf5065351ac5b4a6e';

  var currentCart = null;
  var currentTotal = 0;

  var token = localStorage.getItem('token');
  if (!token) {
    window.location.href = 'login.html';
    return;
  }

  loadCartSummary();

  function loadCartSummary() {
    fetch(`${BACKEND_URL}/cart`, {
      headers: { 'Authorization': 'Bearer ' + token },
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Failed to load cart');
        return res.json();
      })
      .then(function (data) {
        renderSummary(data.cart);
      })
      .catch(function (err) {
        console.error(err);
        checkoutItems.innerHTML = '<p>Could not load your order. Please try again.</p>';
      });
  }

  function renderSummary(cart) {
    currentCart = cart;

    var validItems = cart.items.filter(function (item) {
      return !!item.menuItem;
    });

    if (!validItems.length) {
      checkoutItems.innerHTML = '<p>Your cart is empty.</p>';
      checkoutTotal.textContent = '₦0';
      payNowBtn.disabled = true;
      return;
    }

    var total = 0;
    checkoutItems.innerHTML = '';

    validItems.forEach(function (item) {
      var menuItem = item.menuItem;
      var lineTotal = menuItem.price * item.quantity;
      total += lineTotal;

      var row = document.createElement('div');
      row.className = 'checkout-summary__item';
      row.innerHTML = `
        <span>${menuItem.name} × ${item.quantity}</span>
        <span>₦${lineTotal.toLocaleString()}</span>
      `;
      checkoutItems.appendChild(row);
    });

    currentTotal = total;
    checkoutTotal.textContent = '₦' + total.toLocaleString();
  }

  // ---------- HANDLE FORM SUBMIT → TRIGGER PAYSTACK ----------
  checkoutForm.addEventListener('submit', function (e) {
    e.preventDefault();

    if (!currentCart || currentTotal <= 0) {
      alert('Your cart is empty.');
      return;
    }

    var fullName = document.getElementById('fullName').value.trim();
    var phone = document.getElementById('phone').value.trim();
    var email = document.getElementById('email').value.trim();
    var address = document.getElementById('address').value.trim();
    var notes = document.getElementById('notes').value.trim();

    payNowBtn.disabled = true;
    payNowBtn.textContent = 'Processing...';

    var handler = PaystackPop.setup({
      key: PAYSTACK_PUBLIC_KEY,
      email: email,
      amount: currentTotal * 100, // Paystack expects amount in kobo
      currency: 'NGN',
      metadata: {
        custom_fields: [
          { display_name: 'Full Name', variable_name: 'full_name', value: fullName },
          { display_name: 'Phone', variable_name: 'phone', value: phone },
          { display_name: 'Address', variable_name: 'address', value: address },
          { display_name: 'Notes', variable_name: 'notes', value: notes || 'None' },
        ],
      },
      callback: function (response) {
        // Payment succeeded on Paystack's side — now verify server-side
        verifyPayment(response.reference, {
          fullName: fullName,
          phone: phone,
          email: email,
          address: address,
          notes: notes,
        });
      },
      onClose: function () {
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Pay Now';
      },
    });

    handler.openIframe();
  });

  // ---------- VERIFY PAYMENT SERVER-SIDE ----------
  function verifyPayment(reference, deliveryDetails) {
    fetch(`${BACKEND_URL}/payment/verify`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer ' + token,
      },
      body: JSON.stringify({ reference: reference, deliveryDetails: deliveryDetails }),
    })
      .then(function (res) {
        if (!res.ok) throw new Error('Payment verification failed');
        return res.json();
      })
      .then(function (data) {
        window.location.href = 'order-confirmation.html?ref=' + reference;
      })
      .catch(function (err) {
        console.error(err);
        alert('Payment verification failed. Please contact support with reference: ' + reference);
        payNowBtn.disabled = false;
        payNowBtn.textContent = 'Pay Now';
      });
  }

});