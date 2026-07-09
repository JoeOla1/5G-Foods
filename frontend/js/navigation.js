/* =========================================================
   5G FOODS — NAVIGATION.JS
   Handles: sticky navbar background swap, mobile menu toggle,
            active link highlighting on scroll
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var navbar = document.getElementById('navbar');
  var navToggle = document.getElementById('navToggle');
  var mobileMenu = document.getElementById('mobileMenu');
  var navLinks = document.querySelectorAll('.nav-link');
  var sections = document.querySelectorAll('section[id]');

  /* ---- Navbar background on scroll ---- */
  function handleNavbarScroll() {
    if (window.scrollY > 40) {
      navbar.classList.add('is-scrolled');
    } else {
      navbar.classList.remove('is-scrolled');
    }
  }

  handleNavbarScroll();
  window.addEventListener('scroll', handleNavbarScroll);

  /* ---- Mobile menu toggle ---- */
  if (navToggle && mobileMenu) {
    navToggle.addEventListener('click', function () {
      var isOpen = mobileMenu.classList.toggle('is-open');
      navbar.classList.toggle('is-open', isOpen);
      navToggle.setAttribute('aria-expanded', isOpen ? 'true' : 'false');
    });

    // Close mobile menu when a link is clicked
    mobileMenu.querySelectorAll('a').forEach(function (link) {
      link.addEventListener('click', function () {
        mobileMenu.classList.remove('is-open');
        navbar.classList.remove('is-open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---- Active link highlighting based on scroll position ---- */
  function setActiveLink() {
    var currentSectionId = '';
    var scrollPos = window.scrollY + window.innerHeight * 0.3;

    sections.forEach(function (section) {
      if (scrollPos >= section.offsetTop) {
        currentSectionId = section.getAttribute('id');
      }
    });

    navLinks.forEach(function (link) {
      var targetId = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active-link', targetId === currentSectionId);
    });
  }

  window.addEventListener('scroll', setActiveLink);
  setActiveLink();
});
