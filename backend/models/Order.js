  function renderOrder(order) {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    successState.classList.remove("hidden");

    document.getElementById("orderRef").textContent = order.paymentReference;

    const date = new Date(order.createdAt);
    document.getElementById("orderDate").textContent = date.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const statusEl = document.getElementById("orderStatus");
    statusEl.textContent = order.orderStatus;
    statusEl.classList.add(`status-${order.orderStatus}`);

    const itemsContainer = document.getElementById("orderItems");
    itemsContainer.innerHTML = order.items
      .map(
        (item) => `
        <div class="order-item-row">
          <span class="item-qty">${item.quantity}×</span>
          <span class="item-name">${item.name}</span>
          <span class="item-price">₦${(item.price * item.quantity).toLocaleString("en-NG")}</span>
        </div>
      `
      )
      .join("");

    document.getElementById("orderTotal").textContent = `₦${order.totalAmount.toLocaleString("en-NG")}`;

    const dd = order.deliveryDetails || {};
    const deliveryContainer = document.getElementById("deliveryDetails");
    deliveryContainer.innerHTML = `
      <h3>Delivery Details</h3>
      <p><strong>Name:</strong> ${dd.fullName}</p>
      <p><strong>Phone:</strong> ${dd.phone}</p>
      <p><strong>Email:</strong> ${dd.email}</p>
      <p><strong>Address:</strong> ${dd.address}</p>
      ${dd.notes ? `<p><strong>Notes:</strong> ${dd.notes}</p>` : ""}
    `;
  }