/* =========================================================
   5G FOODS — SLIDER.JS
   Handles: hero fullscreen slideshow (auto-rotate, arrows, dots)
   ========================================================= */

document.addEventListener('DOMContentLoaded', function () {
  var slides = document.querySelectorAll('.hero__slide');
  var dots = document.querySelectorAll('.hero__dot');
  var prevBtn = document.getElementById('heroPrev');
  var nextBtn = document.getElementById('heroNext');

  if (!slides.length) return;

  var currentIndex = 0;
  var slideCount = slides.length;
  var autoRotateDelay = 2000; // 3 seconds
  var autoRotateTimer = null;

  function goToSlide(index) {
    slides[currentIndex].classList.remove('is-active');
    dots[currentIndex] && dots[currentIndex].classList.remove('is-active');

    currentIndex = (index + slideCount) % slideCount;

    slides[currentIndex].classList.add('is-active');
    dots[currentIndex] && dots[currentIndex].classList.add('is-active');
  }

  function nextSlide() {
    goToSlide(currentIndex + 1);
  }

  function prevSlide() {
    goToSlide(currentIndex - 1);
  }

  function startAutoRotate() {
    stopAutoRotate();
    autoRotateTimer = setInterval(nextSlide, autoRotateDelay);
  }

  function stopAutoRotate() {
    if (autoRotateTimer) {
      clearInterval(autoRotateTimer);
      autoRotateTimer = null;
    }
  }

  /* ---- Controls ---- */
  if (nextBtn) {
    nextBtn.addEventListener('click', function () {
      nextSlide();
      startAutoRotate(); // reset timer on manual interaction
    });
  }

  if (prevBtn) {
    prevBtn.addEventListener('click', function () {
      prevSlide();
      startAutoRotate();
    });
  }

  dots.forEach(function (dot, index) {
    dot.addEventListener('click', function () {
      goToSlide(index);
      startAutoRotate();
    });
  });

  /* ---- Pause on hover for accessibility / UX ---- */
  var heroSection = document.querySelector('.hero');
  if (heroSection) {
    heroSection.addEventListener('mouseenter', stopAutoRotate);
    heroSection.addEventListener('mouseleave', startAutoRotate);
  }

  startAutoRotate();
});
