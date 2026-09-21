document.addEventListener('DOMContentLoaded', () => {
  const form = document.getElementById('reservationForm');
  if (!form) return;

  const submitBtn = document.getElementById('resSubmit');
  const message = document.getElementById('resMessage');
  const dateInput = document.getElementById('resDate');

  // Block past dates in the picker
  const today = new Date();
  const yyyy = today.getFullYear();
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const dd = String(today.getDate()).padStart(2, '0');
  dateInput.min = `${yyyy}-${mm}-${dd}`;

  const showMessage = (text, type) => {
    if (!message) return;
    message.textContent = text;
    message.className = 'reservation-message' + (type ? ` reservation-message--${type}` : '');
  };

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    // Map form fields to what the backend expects (tel -> phone)
    const payload = {
      name: document.getElementById('resName').value.trim(),
      phone: document.getElementById('resTel').value.trim(),
      date: dateInput.value,
      time: document.getElementById('resTime').value,
      guests: document.getElementById('resGuests').value,
    };

    if (!payload.name || !payload.phone || !payload.date || !payload.time || !payload.guests) {
      showMessage('Please fill in all fields.', 'error');
      return;
    }

    const originalText = submitBtn.textContent;
    submitBtn.disabled = true;
    submitBtn.textContent = 'Sending your reservation...';
    showMessage('', '');

    try {
      const res = await fetch(`${BACKEND_URL}/reservations`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      const result = await res.json();

      if (!res.ok) {
        showMessage(result.message || 'Could not send reservation.', 'error');
        return;
      }

      showMessage(result.message, 'success');
      form.reset();
    } catch (err) {
      showMessage('Network error. Please check your connection and try again.', 'error');
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  });
});