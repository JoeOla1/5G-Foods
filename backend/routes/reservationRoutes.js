const express = require('express');
const router = express.Router();
const Reservation = require('../models/Reservation');

const escapeHtml = (str) =>
  String(str).replace(/[&<>"']/g, (c) => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  }[c]));

// Sends the owner an email via Resend's HTTP API (no SMTP, so it works on Render).
// A failure here never blocks the reservation itself.
async function notifyOwner(r) {
  if (!process.env.RESEND_API_KEY || !process.env.NOTIFY_EMAIL) return;

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: process.env.MAIL_FROM || 'onboarding@resend.dev',
        to: [process.env.NOTIFY_EMAIL],
        subject: `New reservation: ${r.name}, ${r.guests} guest(s) on ${r.date} at ${r.time}`,
        html: `
          <h2>New Reservation</h2>
          <p><strong>Name:</strong> ${escapeHtml(r.name)}</p>
          <p><strong>Phone:</strong> ${escapeHtml(r.phone)}</p>
          <p><strong>Date:</strong> ${escapeHtml(r.date)}</p>
          <p><strong>Time:</strong> ${escapeHtml(r.time)}</p>
          <p><strong>Guests:</strong> ${escapeHtml(r.guests)}</p>
        `,
      }),
    });
    if (!res.ok) console.error('Resend error:', res.status, await res.text());
  } catch (err) {
    console.error('Email notification failed:', err.message);
  }
}

// POST /reservations
router.post('/', async (req, res) => {
  try {
    const { name, phone, date, time, guests, website } = req.body;

    // Honeypot: real users never fill this hidden field, bots do.
    // Pretend success so bots don't retry.
    if (website) return res.status(201).json({ message: 'Reservation received' });

    if (!name || !phone || !date || !time || !guests) {
      return res.status(400).json({ message: 'Please fill in all fields.' });
    }

    const guestCount = Number(guests);
    if (!Number.isInteger(guestCount) || guestCount < 1 || guestCount > 20) {
      return res.status(400).json({ message: 'Guests must be between 1 and 20.' });
    }

    const cleanPhone = String(phone).replace(/[\s\-()]/g, '');
    if (!/^\+?\d{10,15}$/.test(cleanPhone)) {
      return res.status(400).json({ message: 'Please enter a valid phone number.' });
    }

    if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:\d{2}$/.test(time)) {
      return res.status(400).json({ message: 'Invalid date or time.' });
    }

    // Compare against current date/time in Nigeria (WAT)
    const todayLagos = new Date().toLocaleDateString('en-CA', { timeZone: 'Africa/Lagos' });
    const nowLagos = new Date().toLocaleTimeString('en-GB', {
      timeZone: 'Africa/Lagos', hour: '2-digit', minute: '2-digit',
    });

    if (date < todayLagos || (date === todayLagos && time <= nowLagos)) {
      return res.status(400).json({ message: 'Please choose a future date and time.' });
    }

    const reservation = await Reservation.create({
      name: String(name).trim(),
      phone: cleanPhone,
      date,
      time,
      guests: guestCount,
    });

    notifyOwner(reservation); // fire and forget, don't await

    res.status(201).json({
      message: 'Reservation received! We will contact you shortly to confirm.',
      id: reservation._id,
    });
  } catch (err) {
    console.error('Reservation error:', err);
    res.status(500).json({ message: 'Something went wrong. Please try again.' });
  }
});

module.exports = router;