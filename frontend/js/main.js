/* =========================================================
   5G FOODS — MAIN.JS
   Handles: scroll-reveal (fade-up) animations, footer year,
            misc global behaviors
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {

  /* ---- Footer copyright year ---- */
  var yearEl = document.getElementById('year');
  if (yearEl) {
    yearEl.textContent = new Date().getFullYear();
  }

  /* ---- Scroll-reveal for elements with .fade-up ---- */
  var revealTargets = document.querySelectorAll('.fade-up');

  if ('IntersectionObserver' in window) {
    var observer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          observer.unobserve(entry.target);
        }
      });
    }, {
      threshold: 0.15,
      rootMargin: '0px 0px -60px 0px'
    });

    revealTargets.forEach(function (el, index) {
      el.style.setProperty('--stagger-index', index % 6);
      observer.observe(el);
    });
  } else {
    // Fallback: show everything immediately if IntersectionObserver unsupported
    revealTargets.forEach(function (el) {
      el.classList.add('is-visible');
    });
  }

  /* ---- Newsletter form (frontend only, no submission) ---- */
  var newsletterForm = document.querySelector('.newsletter__form');
  if (newsletterForm) {
    newsletterForm.addEventListener('submit', function (e) {
      e.preventDefault();
      // Frontend-only placeholder: no backend wired up.
      var input = newsletterForm.querySelector('input[type="email"]');
      if (input) {
        input.value = '';
        input.placeholder = 'Thanks for subscribing!';
      }
    });
  }

});
