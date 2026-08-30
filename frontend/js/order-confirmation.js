document.addEventListener("DOMContentLoaded", async () => {
  const loadingState = document.getElementById("loadingState");
  const errorState = document.getElementById("errorState");
  const successState = document.getElementById("successState");
  const errorMessage = document.getElementById("errorMessage");

  const params = new URLSearchParams(window.location.search);
  const reference = params.get("ref");
  const token = localStorage.getItem("token");

  function showError(message) {
    loadingState.classList.add("hidden");
    successState.classList.add("hidden");
    errorState.classList.remove("hidden");
    errorMessage.textContent = message;
  }

  if (!reference) {
    showError("No order reference was provided.");
    return;
  }

  if (!token) {
    showError("Please log in to view your order.");
    return;
  }

  try {
    const res = await fetch(`${BACKEND_URL}/payment/order/${reference}`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    const data = await res.json();

    if (!res.ok) {
      showError(data.message || "Order not found.");
      return;
    }

    renderOrder(data.order);
  } catch (err) {
    console.error(err);
    showError("Something went wrong while fetching your order. Please try again.");
  }

  function renderOrder(order) {
    loadingState.classList.add("hidden");
    errorState.classList.add("hidden");
    successState.classList.remove("hidden");

    document.getElementById("orderRef").textContent = order.paymentReference;

    const date = order.createdAt ? new Date(order.createdAt) : new Date();
    document.getElementById("orderDate").textContent = date.toLocaleString("en-NG", {
      dateStyle: "medium",
      timeStyle: "short",
    });

    const statusEl = document.getElementById("orderStatus");
    statusEl.textContent = order.orderStatus || "placed";
    statusEl.classList.add(`status-${(order.orderStatus || "placed").toLowerCase()}`);

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
      ${dd.address ? `<p><strong>Address:</strong> ${dd.address}</p>` : ""}
      ${dd.phone ? `<p><strong>Phone:</strong> ${dd.phone}</p>` : ""}
      ${dd.notes ? `<p><strong>Notes:</strong> ${dd.notes}</p>` : ""}
    `;
  }
});